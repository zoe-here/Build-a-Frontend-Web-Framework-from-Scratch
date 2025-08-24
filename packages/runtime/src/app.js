import { destroyDOM } from './destroy-dom'
import { mountDOM } from './mount-dom'
import { h } from './h'
import { NoopRouter } from './router'

export function createApp(RootComponent, props = {}, options = {}) {
    let parentEl = null
    let vdom = null
    let isMounted = false

    const context = {
        router: options.router || new NoopRouter(),
    }

    // To reset the internal properties of the application
    function reset() {
        parentEl = null
        isMounted = false
        vdom = null
    }
    return {
        mount (_parentEl) {
            if (isMounted) {
                throw new Error('The application is already mounted')
            }
            parentEl = _parentEl
            vdom = h(RootComponent, props)
            mountDOM(vdom, parentEl, null, { appContext: context })

            context.router.init()

            isMounted = true
        },

        unmount () {
            if (!isMounted) {
                throw new Error('The application is not mounted')
            }
            destroyDOM(vdom)
            context.router.destroy()
            reset()
        },
    }
}