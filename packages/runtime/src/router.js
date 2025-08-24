import { makeRouteMatcher } from './route-matchers'
import { Dispatcher } from './dispatcher'

const ROUTER_EVENT = 'router-event'

export class HashRouter {
    #matchers = []
    // Saved to a variable to be able to remove the event listener in the destroy() method
    #onPopState = () => this.#matchCurrentRoute()
    #isInitialized = false
    #dispatcher = new Dispatcher()
    #subscriptions = new WeakMap()
    #subscriberFns = new Set()

    #matchedRoute = null
    get matchedRoute() {
        return this.#matchedRoute
    }
    #params = {}
    get params() {
        return this.#params
    }
    #query = {}
    get query() {
        return this.#query
    }

    get #currentRouteHash() {
        const hash = document.location.hash

        if (hash === '') {
            return '/'
        }
        return hash.slice(1)
    }

    constructor(routes = []) {
        assert(Array.isArray(routes), 'Routes must be an array')
        this.#matchers = routes.map(makeRouteMatcher)
    }

    async init() {
        if (this.#isInitialized) {
            return
        }
        // If the URL does not have a fragment identifier, this property contains an empty string
        if (document.location.hash === '') {
            window.history.replaceState({}, '', '#/')
        }
        window.addEventListener('popstate', this.#onPopState)
        await this.#matchCurrentRoute()

        this.#isInitialized = true
    }

    destroy() {
        if (!this.#isInitialized) {
            return
        }
        window.removeEventListener('popstate', this.#onPopState)
        Array.from(this.#subscriberFns).forEach(this.unsubscribe, this)
        this.#isInitialized = false
    }

    #matchCurrentRoute() {
        return this.navigateTo(this.#currentRouteHash)
    }

    async navigateTo(path) {
        const matcher = this.#matchers.find((matcher) =>
            matcher.checkMatch(path)
        )
        if (matcher == null) {
            console.warn(`[Router] No route matches path "${path}"`)

            this.#matchedRoute = null
            this.#params = {}
            this.#query = {}

            return
        }

        if (matcher.isRedirect) {
            return this.navigateTo(matcher.route.redirect)
        }

        const from = this.#matchedRoute
        const to = matcher.route
        const { shouldNavigate, shouldRedirect, redirectPath } =
            await this.#canChangeRoute(from, to)

        if (shouldRedirect) {
            return this.navigateTo(redirectPath)
        }

        if (shouldNavigate) {
            this.#matchedRoute = matcher.route
            this.#params = matcher.extractParams(path)
            this.#query = matcher.extractQuery(path)
            this.#pushState(path)

            this.#dispatcher.dispatch(ROUTER_EVENT, { from, to, router: this })
        }
    }

    #pushState(path) {
        window.history.pushState({}, '', `#${path}`)
    }

    back() {
        window.history.back()
    }

    forward() {
        window.history.forward()
    }

    subscribe(handler) {
        const unsubscribe = this.#dispatcher.subscribe(ROUTER_EVENT, handler)
        this.#subscriptions.set(handler, unsubscribe)
        this.#subscriberFns.add(handler)
    }

    unsubscribe(handler) {
        const unsubscribe = this.#subscriptions.get(handler)
        if (unsubscribe) {
            unsubscribe()
            this.#subscriptions.delete(handler)
            this.#subscriberFns.delete(handler)
        }
    }

    // Checking if the route can be navigated to according to guards
    async #canChangeRoute(from, to) {
        const guard = to.beforeEnter

        if (typeof guard !== 'function') {
            return {
                shouldRedirect: false,
                shouldNavigate: true,
                redirectPath: null,
            }
        }

        const result = await guard(from?.path, to?.path)
        if (result === false) {
            return {
                shouldRedirect: false,
                shouldNavigate: false,
                redirectPath: null,
            }
        }

        if (typeof result === 'string') {
            return {
                shouldRedirect: true,
                shouldNavigate: false,
                redirectPath: result,
            }
        }

        return {
            shouldRedirect: false,
            shouldNavigate: true,
            redirectPath: null,
        }
    }
}

export class NoopRouter {
    init() {}
    destroy() {}
    navigateTo() {}
    back() {}
    forward() {}
    subscribe() {}
    unsubscribe() {}
}