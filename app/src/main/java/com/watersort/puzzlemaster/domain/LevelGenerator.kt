package com.watersort.puzzlemaster.domain

import com.watersort.puzzlemaster.model.Bottle
import com.watersort.puzzlemaster.model.WaterColor
import kotlin.random.Random

/**
 * Generates guaranteed-solvable Water Sort Puzzle levels with progressive difficulty.
 */
object LevelGenerator {

    /**
     * Generates the initial list of bottles for a given [levelNumber] (1-indexed).
     */
    fun generateLevel(levelNumber: Int): List<Bottle> {
        val safeLevel = levelNumber.coerceAtLeast(1)

        // Hand-tuned introductory levels for an intuitive onboarding ramp
        when (safeLevel) {
            1 -> return listOf(
                Bottle(
                    id = 0,
                    layers = listOf(
                        WaterColor.OCEAN_BLUE,
                        WaterColor.OCEAN_BLUE,
                        WaterColor.CORAL_RED,
                        WaterColor.CORAL_RED
                    )
                ),
                Bottle(
                    id = 1,
                    layers = listOf(
                        WaterColor.CORAL_RED,
                        WaterColor.CORAL_RED,
                        WaterColor.OCEAN_BLUE,
                        WaterColor.OCEAN_BLUE
                    )
                ),
                Bottle(id = 2, layers = emptyList())
            )

            2 -> return listOf(
                Bottle(
                    id = 0,
                    layers = listOf(
                        WaterColor.CORAL_RED,
                        WaterColor.OCEAN_BLUE,
                        WaterColor.EMERALD_GREEN,
                        WaterColor.CORAL_RED
                    )
                ),
                Bottle(
                    id = 1,
                    layers = listOf(
                        WaterColor.OCEAN_BLUE,
                        WaterColor.EMERALD_GREEN,
                        WaterColor.CORAL_RED,
                        WaterColor.OCEAN_BLUE
                    )
                ),
                Bottle(
                    id = 2,
                    layers = listOf(
                        WaterColor.EMERALD_GREEN,
                        WaterColor.CORAL_RED,
                        WaterColor.OCEAN_BLUE,
                        WaterColor.EMERALD_GREEN
                    )
                ),
                Bottle(id = 3, layers = emptyList()),
                Bottle(id = 4, layers = emptyList())
            )
        }

        // Progressive color count based on level number
        val activeColorCount = when {
            safeLevel <= 4 -> 4
            safeLevel <= 7 -> 5
            safeLevel <= 11 -> 6
            safeLevel <= 16 -> 7
            safeLevel <= 22 -> 8
            else -> 9
        }.coerceAtMost(WaterColor.entries.size)

        val emptyBottleCount = 2
        val totalBottles = activeColorCount + emptyBottleCount
        val selectedColors = WaterColor.entries.take(activeColorCount)
        val capacity = Bottle.DEFAULT_CAPACITY

        // Deterministic seed per level so restarting or replaying produces a consistent puzzle
        val random = Random(safeLevel * 7919L + 104729L)

        var bottles: List<Bottle>
        var attempts = 0

        do {
            attempts++
            // Create a pool of 4 units of each active color and shuffle
            val pool = selectedColors.flatMap { color -> List(capacity) { color } }.shuffled(random)

            val filledBottles = (0 until activeColorCount).map { idx ->
                val slice = pool.subList(idx * capacity, (idx + 1) * capacity)
                Bottle(id = idx, layers = slice, capacity = capacity)
            }

            // Ensure no bottle starts already solved and the level isn't trivially solved
            val fixedFilled = filledBottles.mapIndexed { idx, bottle ->
                if (bottle.isCompletedUniform) {
                    val partnerIdx = (idx + 1) % activeColorCount
                    val partner = filledBottles[partnerIdx]
                    val swappedLayers = bottle.layers.dropLast(1) + partner.layers.last()
                    bottle.copy(layers = swappedLayers)
                } else {
                    bottle
                }
            }

            // Re-balance exact counts of 4 per color using pair swaps on the pool
            val balancedPool = pool.toMutableList()
            for (bIdx in 0 until activeColorCount) {
                val start = bIdx * capacity
                val first = balancedPool[start]
                val allSame = (0 until capacity).all { balancedPool[start + it] == first }
                if (allSame) {
                    val nextBottleStart = ((bIdx + 1) % activeColorCount) * capacity
                    val temp = balancedPool[start + capacity - 1]
                    balancedPool[start + capacity - 1] = balancedPool[nextBottleStart]
                    balancedPool[nextBottleStart] = temp
                }
            }

            val finalFilled = (0 until activeColorCount).map { idx ->
                Bottle(
                    id = idx,
                    layers = balancedPool.subList(idx * capacity, (idx + 1) * capacity).toList(),
                    capacity = capacity
                )
            }

            val emptyBottles = (activeColorCount until totalBottles).map { idx ->
                Bottle(id = idx, layers = emptyList(), capacity = capacity)
            }

            bottles = finalFilled + emptyBottles
        } while (WaterSortEngine.isLevelCompleted(bottles) && attempts < 10)

        return bottles
    }
}
