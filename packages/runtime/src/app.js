import { destroyDOM } from './destroy-dom'
import { Dispatcher } from './dispatcher'
import { mountDOM } from './mount-dom'

export function createApp({ state, view, reducers = {} }) {
    let parentEl = null
    let vdom = null

    const dispatcher = new Dispatcher()
    // Subscribe the renderApp() function to be an after-command handler
    // so the application is re-rendered after every command is handled
    const subscriptions = [dispatcher.afterEveyCommand(renderApp)]

    function emit(eventName, payload) {
        dispatcher.dispatch(eventName, payload)
    }

    for (const actionName in reducers) {
        const reducer = reducers[actionName]

        const subs = dispatcher.subscribe(actionName, (payload) => {
            state = reducer(state, payload)
        })
        subscriptions.push(subs)
    }

    function renderApp() {
        // If a previous view exists, unmounts it
        if (vdom) {
            destroyDOM(vdom)
        }
        vdom = view(state, emit)
        mountDOM(vdom, parentEl)
    }
    return {
        mount (_parentEl) {
            parentEl = _parentEl
            renderApp()
        },

        unmount () {
            destroyDOM(vdom)
            vdom = null
            subscriptions.forEach((unsubscribe) => unsubscribe())
        },
    }
}