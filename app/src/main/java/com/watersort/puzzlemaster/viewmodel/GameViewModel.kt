package com.watersort.puzzlemaster.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.watersort.puzzlemaster.domain.LevelGenerator
import com.watersort.puzzlemaster.domain.WaterSortEngine
import com.watersort.puzzlemaster.model.Bottle
import com.watersort.puzzlemaster.model.Move
import com.watersort.puzzlemaster.model.WaterColor
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Immutable UI state for the active Water Sort Puzzle screen.
 */
data class GameUiState(
    val currentLevel: Int = 1,
    val bottles: List<Bottle> = emptyList(),
    val selectedBottleIndex: Int? = null,
    val pouringFromIndex: Int? = null,
    val pouringToIndex: Int? = null,
    val pouringColor: WaterColor? = null,
    val moveHistory: List<Move> = emptyList(),
    val moveCount: Int = 0,
    val isLevelCompleted: Boolean = false
) {
    val canUndo: Boolean
        get() = moveHistory.isNotEmpty() && pouringFromIndex == null && !isLevelCompleted
}

/**
 * Manages game state, bottle selection, pouring animations, undo stack, and level progression.
 */
class GameViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(GameUiState())
    val uiState: StateFlow<GameUiState> = _uiState.asStateFlow()

    private var pourAnimationJob: Job? = null

    init {
        loadLevel(levelNumber = 1)
    }

    /**
     * Loads or resets the puzzle for [levelNumber].
     */
    fun loadLevel(levelNumber: Int) {
        pourAnimationJob?.cancel()
        val safeLevel = levelNumber.coerceAtLeast(1)
        val initialBottles = LevelGenerator.generateLevel(safeLevel)
        _uiState.value = GameUiState(
            currentLevel = safeLevel,
            bottles = initialBottles,
            selectedBottleIndex = null,
            pouringFromIndex = null,
            pouringToIndex = null,
            pouringColor = null,
            moveHistory = emptyList(),
            moveCount = 0,
            isLevelCompleted = false
        )
    }

    /**
     * Restarts the current level from its initial configuration.
     */
    fun restartLevel() {
        loadLevel(_uiState.value.currentLevel)
    }

    /**
     * Advances to the next puzzle level.
     */
    fun nextLevel() {
        loadLevel(_uiState.value.currentLevel + 1)
    }

    /**
     * Reverts the most recent pouring move if available.
     */
    fun undoLastMove() {
        val state = _uiState.value
        if (!state.canUndo) return

        val lastMove = state.moveHistory.lastOrNull() ?: return
        val restoredBottles = WaterSortEngine.undoMove(state.bottles, lastMove)

        _uiState.update {
            it.copy(
                bottles = restoredBottles,
                selectedBottleIndex = null,
                moveHistory = it.moveHistory.dropLast(1),
                moveCount = (it.moveCount - 1).coerceAtLeast(0),
                isLevelCompleted = false
            )
        }
    }

    /**
     * Handles player tapping a bottle at [tappedIndex].
     */
    fun onBottleTapped(tappedIndex: Int) {
        val state = _uiState.value
        if (state.isLevelCompleted || state.pouringFromIndex != null) return
        if (tappedIndex !in state.bottles.indices) return

        val tappedBottle = state.bottles[tappedIndex]
        val currentSelected = state.selectedBottleIndex

        if (currentSelected == null) {
            // Select the tapped bottle if it contains water
            if (!tappedBottle.isEmpty) {
                _uiState.update { it.copy(selectedBottleIndex = tappedIndex) }
            }
            return
        }

        if (currentSelected == tappedIndex) {
            // Deselect if tapping the already-selected bottle
            _uiState.update { it.copy(selectedBottleIndex = null) }
            return
        }

        val sourceBottle = state.bottles[currentSelected]
        if (WaterSortEngine.canPour(sourceBottle, tappedBottle)) {
            animateAndPerformPour(fromIndex = currentSelected, toIndex = tappedIndex)
        } else {
            // If invalid target, switch selection to the newly tapped bottle (if non-empty)
            _uiState.update {
                it.copy(selectedBottleIndex = if (!tappedBottle.isEmpty) tappedIndex else null)
            }
        }
    }

    private fun animateAndPerformPour(fromIndex: Int, toIndex: Int) {
        val currentBottles = _uiState.value.bottles
        val pouringWaterColor = currentBottles.getOrNull(fromIndex)?.topColor ?: return

        pourAnimationJob?.cancel()
        pourAnimationJob = viewModelScope.launch {
            _uiState.update {
                it.copy(
                    selectedBottleIndex = null,
                    pouringFromIndex = fromIndex,
                    pouringToIndex = toIndex,
                    pouringColor = pouringWaterColor
                )
            }

            // Brief pouring animation duration for smooth visual feedback
            delay(320L)

            val latestState = _uiState.value
            val result = WaterSortEngine.performPour(
                bottles = latestState.bottles,
                fromIndex = fromIndex,
                toIndex = toIndex
            )

            if (result != null) {
                val (updatedBottles, move) = result
                val completed = WaterSortEngine.isLevelCompleted(updatedBottles)
                _uiState.update {
                    it.copy(
                        bottles = updatedBottles,
                        pouringFromIndex = null,
                        pouringToIndex = null,
                        pouringColor = null,
                        moveHistory = it.moveHistory + move,
                        moveCount = it.moveCount + 1,
                        isLevelCompleted = completed
                    )
                }
            } else {
                _uiState.update {
                    it.copy(
                        pouringFromIndex = null,
                        pouringToIndex = null,
                        pouringColor = null
                    )
                }
            }
        }
    }
}
