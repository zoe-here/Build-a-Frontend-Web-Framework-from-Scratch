export class Dispatcher {
    // The hash makes the variable private inside a class
    #subs = new Map()
    #afterHandlers = []

    subscribe(commandName, handler) {
        if (!this.#subs.has(commandName)) {
            this.#subs.set(commandName, [])
        }

        const handlers = this.#subs.get(commandName)
        if (handlers.includes(handler)) {
            // Return a function that does nothing if the handler already registered
            return () => {}
        }
        handlers.push(handler)

        // Return a function to unregister the handler
        return () => {
            const idx = handlers.indexOf(handler)
            handlers.splice(idx, 1)
        }
    }

    afterEveyCommand(handler) {
        this.#afterHandlers.push(handler)
        return () => {
            const idx = this.#afterHandlers.indexOf(handler)
            this.#afterHandlers.splice(idx, 1)
        }
    }

    dispatch(commandName, payload) {
        if (this.#subs.has(commandName)) {
            this.#subs.get(commandName).forEach((handler) => handler(payload))
        } else {
            console.warn(`No handlers for command: ${commandName}`)
        }
        this.#afterHandlers.forEach((handler) => handler())
    }
}