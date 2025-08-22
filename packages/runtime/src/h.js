import { withoutNulls } from './utils/arrays'

export const DOM_TYPES = {
    TEXT: 'text',
    ELEMENT: 'element',
    FRAGMENT: 'fragment',
    COMPONENT: 'component',
    SLOT: 'slot',
}

export function h(tag, props = {}, children = []) {
    const type =
        typeof tag === 'string' ? DOM_TYPES.ELEMENT : DOM_TYPES.COMPONENT

    return {
        tag,
        props,
        type,
        children: mapTextNodes(withoutNulls(children)),
    }
}

function mapTextNodes(children) {
    return children.map((child) => 
        typeof child === 'string' ? hString(child) : child
    )
}

export function hString(str) {
    return { type: DOM_TYPES.TEXT, value: str }
}

export function hFragment(vNodes) {
    return {
        type: DOM_TYPES.FRAGMENT,
        children: mapTextNodes(withoutNulls(vNodes)),
    }
}

let hSlotCalled = false

export function didCreateSlot() {
    return hSlotCalled
}

export function resetDidCreateSlot() {
    hSlotCalled = false
}

export function hSlot(children = []) {
    hSlotCalled = true
    return { type: DOM_TYPES.SLOT, children }
}
