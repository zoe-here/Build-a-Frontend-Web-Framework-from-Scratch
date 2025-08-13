export function objectsDiff(oldObj, newObj) {
    const oldKeys = Object.keys(oldObj)
    const newKeys = Object.keys(newObj)

    return {
        // Keys in the new object that are not in the old object were added
        added: newKeys.filter((key) => !(key in oldObj)),
        // Keys in the old object that are not in the new object were removed
        removed: oldKeys.filter((key) => !(key in newObj)),
        // Keys in both objects that have different values were changed
        updated: newKeys.filter(
            (key) => key in oldObj && oldObj[key] !== newObj[key]
        ),
    }
}
