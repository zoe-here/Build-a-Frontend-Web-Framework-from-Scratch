export function traverseDFS(
    // The virtual node tree to traverse
    vdom,
    // The function to be called for each node
    processNode,
    shouldSkipBranch = () => false,
    // The parent node of the node being processed or null if it’s the root node
    parentNode = null,
    // The index of the node being processed in the parent’s children array or null if it’s the root node
    index = null
) {
    if (shouldSkipBranch(vdom)) return

    processNode(vdom, parentNode, index)

    if (vdom.children) {
        vdom.children.forEach((child, i) =>
            traverseDFS(child, processNode, shouldSkipBranch, vdom, i)
        )
    }
}