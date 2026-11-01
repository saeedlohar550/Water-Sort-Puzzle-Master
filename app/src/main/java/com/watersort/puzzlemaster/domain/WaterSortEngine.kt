package com.watersort.puzzlemaster.domain

import com.watersort.puzzlemaster.model.Bottle
import com.watersort.puzzlemaster.model.Move

/**
 * Pure domain logic for validating and executing water sorting moves.
 * Designed for modular expansion in future updates.
 */
object WaterSortEngine {

    /**
     * Checks whether pouring water from [source] into [target] is a valid move.
     */
    fun canPour(source: Bottle, target: Bottle): Boolean {
        if (source.id == target.id) return false
        if (source.isEmpty) return false
        if (target.isFull) return false
        if (source.isCompletedUniform && target.isEmpty) {
            // Still technically a legal move, though unnecessary; allowed by standard rules,
            // or we can allow pouring into empty bottles anytime.
        }
        val sourceTop = source.topColor ?: return false
        val targetTop = target.topColor ?: return true // Target is empty
        return sourceTop == targetTop
    }

    /**
     * Calculates how many layers will transfer when pouring from [source] into [target].
     */
    fun calculatePourCount(source: Bottle, target: Bottle): Int {
        if (!canPour(source, target)) return 0
        return minOf(source.topSameColorCount, target.freeSpace)
    }

    /**
     * Executes a valid pour between [fromIndex] and [toIndex], returning the updated
     * bottle list and the recorded [Move], or null if the move is invalid.
     */
    fun performPour(
        bottles: List<Bottle>,
        fromIndex: Int,
        toIndex: Int
    ): Pair<List<Bottle>, Move>? {
        if (fromIndex !in bottles.indices || toIndex !in bottles.indices) return null
        val source = bottles[fromIndex]
        val target = bottles[toIndex]

        val count = calculatePourCount(source, target)
        if (count <= 0) return null
        val color = source.topColor ?: return null

        val updatedSourceLayers = source.layers.dropLast(count)
        val updatedTargetLayers = target.layers + List(count) { color }

        val updatedBottles = bottles.mapIndexed { index, bottle ->
            when (index) {
                fromIndex -> bottle.copy(layers = updatedSourceLayers)
                toIndex -> bottle.copy(layers = updatedTargetLayers)
                else -> bottle
            }
        }

        val move = Move(
            fromBottleIndex = fromIndex,
            toBottleIndex = toIndex,
            color = color,
            layersMoved = count
        )
        return updatedBottles to move
    }

    /**
     * Reverts a previously executed [Move] and returns the restored list of bottles.
     */
    fun undoMove(bottles: List<Bottle>, move: Move): List<Bottle> {
        val fromIdx = move.fromBottleIndex
        val toIdx = move.toBottleIndex
        if (fromIdx !in bottles.indices || toIdx !in bottles.indices) return bottles

        val currentTarget = bottles[toIdx]
        val currentSource = bottles[fromIdx]
        val layersToRestore = move.layersMoved.coerceAtMost(currentTarget.layers.size)

        val restoredTargetLayers = currentTarget.layers.dropLast(layersToRestore)
        val restoredSourceLayers = currentSource.layers + List(layersToRestore) { move.color }

        return bottles.mapIndexed { index, bottle ->
            when (index) {
                fromIdx -> bottle.copy(layers = restoredSourceLayers)
                toIdx -> bottle.copy(layers = restoredTargetLayers)
                else -> bottle
            }
        }
    }

    /**
     * Returns true when every bottle in the puzzle is either completely full of a single
     * uniform color or completely empty.
     */
    fun isLevelCompleted(bottles: List<Bottle>): Boolean {
        return bottles.isNotEmpty() && bottles.all { it.isSolvedOrEmpty }
    }
}
