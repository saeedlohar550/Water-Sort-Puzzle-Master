package com.watersort.puzzlemaster

import com.watersort.puzzlemaster.domain.LevelGenerator
import com.watersort.puzzlemaster.domain.WaterSortEngine
import com.watersort.puzzlemaster.model.Bottle
import com.watersort.puzzlemaster.model.WaterColor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class WaterSortEngineTest {

    @Test
    fun `canPour returns true for matching top colors with available space`() {
        val source = Bottle(
            id = 0,
            layers = listOf(WaterColor.OCEAN_BLUE, WaterColor.CORAL_RED, WaterColor.CORAL_RED)
        )
        val target = Bottle(
            id = 1,
            layers = listOf(WaterColor.CORAL_RED)
        )

        assertTrue(WaterSortEngine.canPour(source, target))
        assertEquals(2, WaterSortEngine.calculatePourCount(source, target))
    }

    @Test
    fun `canPour returns false when top colors differ`() {
        val source = Bottle(
            id = 0,
            layers = listOf(WaterColor.OCEAN_BLUE)
        )
        val target = Bottle(
            id = 1,
            layers = listOf(WaterColor.CORAL_RED)
        )

        assertFalse(WaterSortEngine.canPour(source, target))
        assertNull(WaterSortEngine.performPour(listOf(source, target), 0, 1))
    }

    @Test
    fun `performPour and undoMove restore exact initial bottle state`() {
        val initialBottles = LevelGenerator.generateLevel(1)
        val result = WaterSortEngine.performPour(initialBottles, 0, 2)
        assertNotNull(result)

        val (afterPour, move) = result!!
        assertEquals(2, move.layersMoved)
        assertEquals(2, afterPour[2].layers.size)

        val afterUndo = WaterSortEngine.undoMove(afterPour, move)
        assertEquals(initialBottles, afterUndo)
    }

    @Test
    fun `level 1 can be solved in three valid moves`() {
        var bottles = LevelGenerator.generateLevel(1)
        assertFalse(WaterSortEngine.isLevelCompleted(bottles))

        // Move 1: Bottle 0 top 2 CORAL_RED -> Empty Bottle 2
        bottles = WaterSortEngine.performPour(bottles, 0, 2)!!.first
        // Move 2: Bottle 1 top 2 OCEAN_BLUE -> Bottle 0 (now has 4 OCEAN_BLUE)
        bottles = WaterSortEngine.performPour(bottles, 1, 0)!!.first
        // Move 3: Bottle 1 remaining 2 CORAL_RED -> Bottle 2 (now has 4 CORAL_RED)
        bottles = WaterSortEngine.performPour(bottles, 1, 2)!!.first

        assertTrue(WaterSortEngine.isLevelCompleted(bottles))
    }
}
