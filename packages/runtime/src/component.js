import { destroyDOM } from './destroy-dom'
import { DOM_TYPES } from './h'
import { mountDOM, extractChildren} from './mount-dom'
import { patchDOM } from './patch-dom'

// It takes an object containing a render() function and returns a component
// It takes an object with a state() function to create the initial state
export function defineComponent({ render, state }) {
    class Component {
        #isMounted = false
        #vdom = null
        #hostEl = null

        constructor(props = {}) {
            this.props = props
            // The state() function returns the initial state of the component based on the props
            this.state = state ? state(props) : {}
        }

        get elements() {
            // If the vdom is null, returns an empty array
            if (this.#vdom == null) {
                return []
            }
            // If the vdom top node is a fragment, returns the elements inside the fragment
            if (this.#vdom.type === DOM_TYPES.FRAGMENT) {
                return extractChildren(this.#vdom).map((child) => child.el)
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
            mountDOM(this.#vdom, hostEl, index)
            this.#hostEl = hostEl
            this.#isMounted = true
        }

        unmount() {
            if (!this.#isMounted) {
                // A component can’t be unmounted if it’s not mounted
                throw new Error('Component is not mounted')
            }
            destroyDOM(this.#vdom)
            this.#vdom = null
            this.#hostEl = null
            this.#isMounted = false
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

    return Component
}