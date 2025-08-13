export function withoutNulls(arr) {
    return arr.filter((item) => item != null)
}

export function arraysDiff(oldArray, newArray) {
    return {
        added: newArray.filter(
            (newItem) => !oldArray.includes(newItem)
        ),
        removed: oldArray.filter(
            (oldItem) => !newArray.includes(oldItem)
        ),
    }
}

export const ARRAY_DIFF_OP = {
    ADD: 'add',
    REMOVE: 'remove',
    MOVE: 'move',
    NOOP: 'noop',
}

class ArrayWithOriginalIndices {
    #array = []
    #originalIndices = []
    #equalsFn

    constructor(array, equalsFn) {
        this.#array = [...array]
        this.#originalIndices = array.map((_, i) => i)
        this.#equalsFn = equalsFn
    }

    get length() {
        return this.#array.length
    }

    isRemoval(index, newArray) {
        // If the index is out of bounds, there’s nothing to remove
        if (index >= this.length) {
            return false
        }
        const item = this.#array[index]
        const indexInNewArray = newArray.findIndex((newItem) =>
            this.#equalsFn(item, newItem)
        )
        // If the index is -1, the item was removed
        return indexInNewArray === -1
    }

    removeItem(index) {
        const operation = {
            op: ARRAY_DIFF_OP.REMOVE,
            index,
            // The current index of the item in the old array (not the original index)
            item: this.#array[index],
        }
        // Removes the item from the array
        this.#array.splice(index, 1)
        // Removes the original index of the item
        this.#originalIndices.splice(index, 1)

        return operation
    }

    isNoop(index, newArray) {
        if (index >= this.length) {
            return false
        }
        const item = this.#array[index]
        const newItem = newArray[index]

        return this.#equalsFn(item, newItem)
    }

    originalIndexAt(index) {
        return this.#originalIndices[index]
    }

    noopItem(index) {
        return {
            op: ARRAY_DIFF_OP.NOOP,
            originalIndex: this.originalIndexAt(index),
            index,
            item: this.#array[index],
        }
    }

    isAddition(item, fromIdx) {
        return this.findIndexFrom(item, fromIdx) === -1
    }

    findIndexFrom(item, fromIndex) {
        for (let i = fromIndex; i < this.length; i++) {
            if (this.#equalsFn(item, this.#array[i])) {
                return i
            }
        }
        return -1
    }

    addItem(item, index) {
        const operation = {
            op: ARRAY_DIFF_OP.ADD,
            index,
            item,
        }
        // Add the new item to the old array at the given index
        this.#array.splice(index, 0, item)
        this.#originalIndices.splice(index, 0, -1)

        return operation
    }

    moveItem(item, toIndex) {
        // Look for the item in the old array, starting from the target index
        const fromIndex = this.findIndexFrom(item, toIndex)
        const operation = {
            op: ARRAY_DIFF_OP.MOVE,
            originalIndex : this.originalIndexAt(fromIndex),
            from: fromIndex,
            index: toIndex,
            item: this.#array[fromIndex],
        }
        // Extract the item from the old array
        const [_item] = this.#array.splice(fromIndex, 1)
        // Insert the item into the new position
        this.#array.splice(toIndex, 0, _item)

        // Extract the original index from the #originalIndices array
        const [originalIndex] = this.#originalIndices.splice(fromIndex, 1)
        // Insert the original index into the new position
        this.#originalIndices.splice(toIndex, 0, originalIndex)

        return operation
    }

    removeItemsAfter(index) {
        const operations = []
        // Keep removing items while the old array is longer than the index
        while (this.length > index) {
            operations.push(this.removeItem(index))
        }
        return operations
    }
}

export function arraysDiffSequence (
    oldArray,
    newArray,
    equalsFn = (a, b) => a === b
) {
    const sequence = []
    const array = new ArrayWithOriginalIndices(oldArray, equalsFn)

    for (let index = 0; index < newArray.length; index++) {
        // Removal case
        if (array.isRemoval(index, newArray)) {
            // Remove the item and push the operation to the sequence
            sequence.push(array.removeItem(index))
            // Decrement the index to stay at the same index in the next iteration
            index--
            continue
        }
        // Noop case, at the current index, both the old and new arrays have the same item
        if (array.isNoop(index, newArray)) {
            sequence.push(array.noopItem(index))
            continue
        }
        // Addition case
        const item = newArray[index]
        if (array.isAddition(item, index)) {
            sequence.push(array.addItem(item, index))
            continue
        }
        // Move case
        sequence.push(array.moveItem(item, index))
    }
    // Remove extra items
    sequence.push(...array.removeItemsAfter(newArray.length))

    return sequence
}