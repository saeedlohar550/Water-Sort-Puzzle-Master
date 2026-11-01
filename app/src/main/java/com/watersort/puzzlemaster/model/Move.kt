package com.watersort.puzzlemaster.model

/**
 * Records a completed water-pouring move so the player can undo moves reliably.
 */
data class Move(
    val fromBottleIndex: Int,
    val toBottleIndex: Int,
    val color: WaterColor,
    val layersMoved: Int
)
