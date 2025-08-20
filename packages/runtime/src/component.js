import { destroyDOM } from './destroy-dom'
import { Dispatcher } from './dispatcher'
import { DOM_TYPES } from './h'
import { mountDOM, extractChildren} from './mount-dom'
import { patchDOM } from './patch-dom'
import { hasOwnProperty } from './utils/objects'
import equal from 'fast-deep-equal'

const emptyFn = () => {}
// It takes an object containing a render() function and returns a component
// It takes an object with a state() function to create the initial state
export function defineComponent({
    render,
    state,
    onMounted = emptyFn,
    onUnmounted = emptyFn,
    ...methods
}) {
    class Component {
        #isMounted = false
        #vdom = null
        #hostEl = null
        #eventHandlers = null
        #parentComponent = null
        #dispatcher = new Dispatcher()
        #subscriptions = []

        constructor(
            props = {},
            eventHandlers = {},
            parentComponent = null,
        ) {
            this.props = props
            // The state() function returns the initial state of the component based on the props
            this.state = state ? state(props) : {}
            this.#eventHandlers = eventHandlers
            this.#parentComponent = parentComponent
        }

        onMounted() {
            return Promise.resolve(onMounted.call(this))
        }

        onUnmounted() {
            return Promise.resolve(onUnmounted.call(this))
        }

        #wireEventHandlers() {
            this.#subscriptions = Object.entries(this.#eventHandlers).map(
                ([eventName, handler]) =>
                    this.#wireEventHandler(eventName, handler)
            )
        }

        #wireEventHandler(eventName, handler) {
            return this.#dispatcher.subscribe(eventName, (payload) => {
                if (this.#parentComponent) {
                    // If there is a parent component, binds the event handler’s context to it and calls it
                    handler.call(this.#parentComponent, payload)
                } else {
                    handler(payload)
                }
            })
        }

        emit(eventName, payload) {
            this.#dispatcher.dispatch(eventName, payload)
        }

        get elements() {
            // If the vdom is null, returns an empty array
            if (this.#vdom == null) {
                return []
            }
            if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
                return extractChildren(this.#vdom).flatMap((child) => {
                    if (child.type === DOM_TYPES.COMPONENT) {
                        // Call the elements getter recursively
                        return child.component.elements
                    }
                    // Otherwise, returns the node’s element inside an array
                    return [child.el]
                })
            }
            // If the vdom top node is a single node, returns its element
            return [this.#vdom.el]
        }

        get firstElement() {
            return this.elements[0]
        }

        get offset() {
            if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
                // The component’s first element offset inside the parent element
                return Array.from(this.#hostEl.children).indexOf(this.firstElement)
            }
            // When the component’s view isn’t a fragment, the offset is 0
            return 0
        }

        updateProps(props) {
            const newProps = { ...this.props, ...props }
            if (equal(this.props, newProps)) {
                return
            }
            this.props = newProps
            this.#patch()
        }

        updateState(state) {
            this.state = { ...this.state, ...state }
            this.#patch()
        }

        render() {
            return render.call(this)
        }

        mount(hostEl, index = null) {
            if (this.#isMounted) {
                // A component can’t be mounted more than once
                throw new Error('Component is already mounted')
            }
            // Call the render() method and saves the result in the #vdom private property
            this.#vdom = this.render()
            // Pass the component reference to the mountDOM() function by this
            mountDOM(this.#vdom, hostEl, index, this)
            this.#wireEventHandlers()
            this.#hostEl = hostEl
            this.#isMounted = true
        }

        unmount() {
            if (!this.#isMounted) {
                // A component can’t be unmounted if it’s not mounted
                throw new Error('Component is not mounted')
            }
            destroyDOM(this.#vdom)
            this.#subscriptions.forEach((unsubscribe) => unsubscribe())
            this.#vdom = null
            this.#isMounted = false
            this.#hostEl = null
            this.#subscriptions = []
        }

        #patch() {
            if (!this.#isMounted) {
                // If the component is not mounted, the DOM can’t be patched
                throw new Error('Component is not mounted')
            }
            // To get the new virtual DOM
            const vdom = this.render()
            // To patch the DOM and saves the result in the #vdom property
            // Pass the component instance to the patchDOM() function using this
            this.#vdom = patchDOM(this.#vdom, vdom, this.#hostEl, this)
        }
    }

    for (const methodName in methods) {
        if (hasOwnProperty(Component, methodName)) {
            throw new Error(
                `Method "${methodName}()" already exists in the component`
            )
        }
        // Add the method to the prototype
        Component.prototype[methodName] = methods[methodName]
    }

    return Component
}