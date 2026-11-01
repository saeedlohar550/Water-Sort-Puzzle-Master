package com.watersort.puzzlemaster.model

/**
 * Immutable representation of a glass water bottle.
 *
 * @property id Unique bottle identifier within a level.
 * @property layers Ordered list of water layers from bottom (index 0) to top (lastIndex).
 * @property capacity Maximum number of layers the bottle can hold (default 4).
 */
data class Bottle(
    val id: Int,
    val layers: List<WaterColor>,
    val capacity: Int = DEFAULT_CAPACITY
) {
    val isEmpty: Boolean
        get() = layers.isEmpty()

    val isFull: Boolean
        get() = layers.size >= capacity

    val freeSpace: Int
        get() = (capacity - layers.size).coerceAtLeast(0)

    val topColor: WaterColor?
        get() = layers.lastOrNull()

    /**
     * Number of contiguous layers at the top of the bottle that share the same [topColor].
     */
    val topSameColorCount: Int
        get() {
            val top = topColor ?: return 0
            var count = 0
            for (i in layers.indices.reversed()) {
                if (layers[i] == top) {
                    count++
                } else {
                    break
                }
            }
            return count
        }

    /**
     * True when the bottle is completely full of a single uniform [WaterColor].
     */
    val isCompletedUniform: Boolean
        get() = layers.size == capacity && topSameColorCount == capacity

    /**
     * True when the bottle is either empty or completely solved with a single uniform color.
     */
    val isSolvedOrEmpty: Boolean
        get() = isEmpty || isCompletedUniform

    companion object {
        const val DEFAULT_CAPACITY = 4
    }
}
