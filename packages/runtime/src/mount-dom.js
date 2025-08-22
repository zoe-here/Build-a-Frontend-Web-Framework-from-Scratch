import { DOM_TYPES } from './h'
import { setAttributes } from './attributes'
import { addEventListeners } from './events'
import { extractPropsAndEvents } from './utils/props'
import { enqueueJob } from './scheduler'

export function mountDOM(
    vdom,
    parentEl,
    index,
    hostComponent = null
) {
    switch (vdom.type) {
        case DOM_TYPES.TEXT: {
            createTextNode(vdom, parentEl, index)
            break
        }
        case DOM_TYPES.ELEMENT: {
            createElementNode(vdom, parentEl, index, hostComponent)
            break
        }
        case DOM_TYPES.FRAGMENT: {
            createFragmentNodes(vdom, parentEl, index, hostComponent)
            break
        }
        case DOM_TYPES.COMPONENT: {
            createComponentNode(vdom, parentEl, index, hostComponent)
            enqueueJob(() => vdom.component.onMounted())
            break
        }
        default: {
            throw new Error(`Can't mount DOM of type: ${vdom.type}`)
        }
    }
}

function createTextNode(vdom, parentEl, index) {
    const { value } = vdom
    const textNode = document.createTextNode(value)
    vdom.el = textNode
    insert(textNode, parentEl, index)
}

function createFragmentNodes(vdom, parentEl, index, hostComponent) {
    const { children } = vdom
    vdom.el = parentEl
    children.forEach((child, i) =>
        mountDOM(
            child,
            parentEl,
            index ? index + i : null,
            hostComponent
        )
    )
}

function createComponentNode(vdom, parentEl, index, hostComponent) {
    const { tag: Component, children } = vdom
    const { props, events } = extractPropsAndEvents(vdom)
    const component = new Component(props, events, hostComponent)
    component.setExternalContent(children)

    component.mount(parentEl, index)
    vdom.component = component
    vdom.el = component.firstElement
}

function createElementNode(vdom, parentEl, index, hostComponent) {
    const { tag, children } = vdom
    const element = document.createElement(tag)
    addProps(element, vdom, hostComponent)
    vdom.el = element
    // Pass a null index and the host component to the mountDOM() function
    children.forEach((child) => mountDOM(child, element, null, hostComponent))
    insert(element, parentEl, index)
}

function addProps(el, vdom, hostComponent) {
    const { props: attrs, events } = extractPropsAndEvents(vdom)

    vdom.listeners = addEventListeners(events, el, hostComponent)
    setAttributes(el, attrs)
}

function insert(el, parentEl, index) {
    // If index is null or undefined, simply append
    if (index == null) {
        parentEl.append(el)
        return
    }
    if (index < 0) {
        throw new Error(`Index must be a positive integer, got ${index}`)
    }
    const children = parentEl.childNodes

    if (index >= children.length) {
        parentEl.append(el)
    } else {
        parentEl.insertBefore(el, children[index])
    }
}

export function extractChildren(vdom) {
    if (vdom.children == null) {
        return []
    }
    const children = []

    for (const child of vdom.children) {
        if (child.type === DOM_TYPES.FRAGMENT) {
            children.push(...extractChildren(child))
        } else {
            children.push(child)
        }
    }
    return children
}
