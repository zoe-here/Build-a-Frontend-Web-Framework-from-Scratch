// To handle event modifiers AND context binding
export function addEventListener (
    eventNameWithModifiers,
    handler,
    el,
    hostComponent = null
) {
    const [eventName, ...modifiers] = eventNameWithModifiers.split('.')

    function boundHandler() {
        // Extract the event object (always the first argument from the browser)
        const event = arguments[0]

        // Apply modifiers to the event
        if (modifiers.includes('prevent')) {
            event.preventDefault()
        }
        if (modifiers.includes('stop')) {
            event.stopPropagation()
        }

        // Call the original handler, preserving all arguments and context
        hostComponent
            // If a host component exists, binds it to the event handler context
            ? handler.apply(hostComponent, arguments)
            // Otherwise, call the event handler
            : handler(...arguments)
    }
    el.addEventListener(eventName, boundHandler)
    // Return the wrapper function so it can be removed later
    return boundHandler
}

export function addEventListeners (
    listeners = {},
    el,
    hostComponent = null
) {
    const addedListeners = {}

    Object.entries(listeners).forEach(([eventNameWithModifiers, handler]) => {
        // Store the modified handler that addEventListener returns
        const listener = addEventListener(eventNameWithModifiers, handler, el, hostComponent)
        addedListeners[eventNameWithModifiers] = listener
    })
    // Return the object containing the actual registered handlers
    return addedListeners
}

export function removeEventListeners (listeners = {}, el) {
    Object.entries(listeners).forEach(([eventNameWithModifiers, modifiedHandler]) => {
        // Extract just the event name (no modifiers needed for removal)
        const [eventName] = eventNameWithModifiers.split('.')
        // Remove using the modified handler that was actually registered
        el.removeEventListener(eventName, modifiedHandler)
    })
}