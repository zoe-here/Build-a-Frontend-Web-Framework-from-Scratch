import {
    removeAttribute,
    setAttribute,
    removeStyle,
    setStyle,
} from './attributes'
import { destroyDOM } from './destroy-dom'
import { addEventListener } from './events'
import { DOM_TYPES } from './h'
import { mountDOM, extractChildren } from './mount-dom'
import { areNodesEqual } from './nodes-equal'
import {
    arraysDiff,
    arraysDiffSequence,
    ARRAY_DIFF_OP,
} from './utils/arrays'
import { objectsDiff } from './utils/objects'
import { isNotBlankOrEmptyString } from './utils/strings'

export function patchDOM(
    // Pass the host component instance to the patchDOM() function
    oldVdom, newVdom, parentEl, hostComponent = null
) {
    if (!areNodesEqual(oldVdom, newVdom)) {
        const index = findIndexInParent(parentEl, oldVdom.el)
        destroyDOM(oldVdom)
        mountDOM(newVdom, parentEl, index)
        return newVdom
    }
    // Save the reference to the DOM element in the new node
    newVdom.el = oldVdom.el

    switch (newVdom.type) {
        case DOM_TYPES.TEXT: {
            patchText(oldVdom, newVdom)
            return newVdom
        }
        case DOM_TYPES.ELEMENT: {
            patchElement(oldVdom, newVdom)
            break
        }
    }
    patchChildren(oldVdom, newVdom, hostComponent)

    return newVdom
}

function findIndexInParent(parentEl, el) {
    const index = Array.from(parentEl.childNodes).indexOf(el)
    if (index < 0) {
        return null
    }
    return index
}

function patchText(oldVdom, newVdom) {
    // Extract the DOM element from the oldVDom virtual node’s el property
    const el = oldVdom.el
    const { value: oldText } = oldVdom
    const { value: newText } = newVdom

    if (oldText !== newText) {
        el.nodeValue = newText
    }
}

function patchElement(oldVdom, newVdom) {
    const el = oldVdom.el
    const {
        class: oldClass,
        style: oldStyle,
        on: oldEvents,
        ...oldAttrs
    } = oldVdom.props
    const {
        class: newClass,
        style: newStyle,
        on: newEvents,
        ...newAttrs
    } = newVdom.props
    const { listeners: oldListeners } = oldVdom

    patchAttrs(el, oldAttrs, newAttrs)
    patchClasses(el, oldClass, newClass)
    patchStyles(el, oldStyle, newStyle)
    newVdom.listeners = patchEvents(el, oldListeners, oldEvents, newEvents)
}

function patchAttrs(el, oldAttrs, newAttrs) {
    const { added, removed, updated } = objectsDiff(oldAttrs, newAttrs)

    for (const attr of removed) {
        removeAttribute(el, attr)
    }
    for (const attr of added.concat(updated)) {
        setAttribute(el, attr, newAttrs[attr])
    }
}

function patchClasses(el, oldClass, newClass) {
    const oldClasses = toClassList(oldClass)
    const newClasses = toClassList(newClass)

    const { added, removed } = arraysDiff(oldClasses, newClasses)

    if (removed.length > 0) {
        el.classList.remove(...removed)
    }
    if (added.length > 0) {
        el.classList.add(...added)
    }
}

function toClassList(classes = '') {
    return Array.isArray(classes)
        ? classes.filter(isNotBlankOrEmptyString)
        // Split the string on whitespace
        : classes.split(/(\s+)/)
            .filter(isNotBlankOrEmptyString)
}

function patchStyles(el, oldStyle = {}, newStyle = {}) {
    const { added, removed, updated } = objectsDiff(oldStyle, newStyle)
    for (const style of removed) {
        removeStyle(el, style)
    }
    for (const style of added.concat(updated)) {
        setStyle(el, style, newStyle[style])
    }
}

function patchEvents(
    el,
    oldListeners = {},
    oldEvents = {},
    newEvents = {}
) {
    const { removed, added, updated } = objectsDiff(oldEvents, newEvents)

    for (const eventName of removed.concat(updated)) {
        el.removeEventListener(eventName, oldListeners[eventName])
    }
    const addedListeners = {}

    for (const eventName of added.concat(updated)) {
        const listener = addEventListener(eventName, newEvents[eventName], el)
        addedListeners[eventName] = listener
    }
    return addedListeners
}

function patchChildren(oldVdom, newVdom, hostComponent) {
    const oldChildren = extractChildren(oldVdom)
    const newChildren = extractChildren(newVdom)
    const parentEl = oldVdom.el

    const diffSeq = arraysDiffSequence(
        oldChildren,
        newChildren,
        areNodesEqual
    )

    for (const operation of diffSeq) {
        // Get the host component’s offset, if there is one; offset is zero otherwise
        const offset = hostComponent?.offset ?? 0
        const { originalIndex, index, item } = operation

        switch (operation.op) {
            case ARRAY_DIFF_OP.ADD: {
                // When a node is added, takes account of the host component’s offset
                mountDOM(item, parentEl, index + offset, hostComponent)
                break
            }
            case ARRAY_DIFF_OP.REMOVE: {
                destroyDOM(item)
                break
            }
            case ARRAY_DIFF_OP.MOVE: {
                // Get the old virtual node at the original index
                const oldChild = oldChildren[originalIndex]
                // Get the new virtual node at the new index
                const newChild = newChildren[index]
                // Get the DOM element associated with the moved node
                const el = oldChild.el
                // Find the element at the target index inside the parent element
                // When a node is moved, uses the offset to find the correct position in the DOM
                const elAtTargetIndex = parentEl.childNodes[index + offset]

                // Insert the moved element before the target element
                parentEl.insertBefore(el, elAtTargetIndex)
                // Recursively patches the moved element
                patchDOM(
                    oldChild,
                    newChild,
                    parentEl,
                    hostComponent
                )

                break
            }
            case ARRAY_DIFF_OP.NOOP: {
                patchDOM(
                    oldChildren[originalIndex],
                    newChildren[index],
                    parentEl,
                    hostComponent
                )
                break
            }
        }
    }
}
