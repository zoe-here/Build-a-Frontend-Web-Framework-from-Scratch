import { DOM_TYPES } from './h'

export function areNodesEqual(nodeOne, nodeTwo) {
    // Nodes of different types are never equal
    if (nodeOne.type !== nodeTwo.type) {
        return false
    }
    // Element nodes require their tag names to be equal
    if (nodeOne.type === DOM_TYPES.ELEMENT) {
        const {
            tag: tagOne,
            props: { key: keyOne },
        } = nodeOne
        const {
            tag: tagTwo,
            props: { key: keyTwo },
        } = nodeTwo

        return tagOne === tagTwo && keyOne === keyTwo
    }
    // Check whether the type is component
    if (nodeOne.type === DOM_TYPES.COMPONENT) {
        // Extract the node’s component prototype and key props
        const {
            tag: componentOne,
            props: { key: keyOne },
        } = nodeOne
        const {
            tag: componentTwo,
            props: { key: keyTwo },
        } = nodeTwo

        return componentOne === componentTwo && keyOne === keyTwo
    }
    return true
}