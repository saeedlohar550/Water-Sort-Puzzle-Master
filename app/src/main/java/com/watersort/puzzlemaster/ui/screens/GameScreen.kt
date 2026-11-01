package com.watersort.puzzlemaster.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.watersort.puzzlemaster.model.Bottle
import com.watersort.puzzlemaster.ui.components.GlassBottleView
import com.watersort.puzzlemaster.viewmodel.GameUiState
import com.watersort.puzzlemaster.viewmodel.GameViewModel
import kotlin.math.ceil

@Composable
fun GameScreen(
    viewModel: GameViewModel
) {
    val uiState by viewModel.uiState.collectAsState()

    GameScreenContent(
        uiState = uiState,
        onBottleClick = viewModel::onBottleTapped,
        onUndoClick = viewModel::undoLastMove,
        onRestartClick = viewModel::restartLevel,
        onNextLevelClick = viewModel::nextLevel
    )
}

@Composable
fun GameScreenContent(
    uiState: GameUiState,
    onBottleClick: (Int) -> Unit,
    onUndoClick: () -> Unit,
    onRestartClick: () -> Unit,
    onNextLevelClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF071324),
                        Color(0xFF0D2544),
                        Color(0xFF08182E)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp, vertical = 18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top HUD bar: Level display and Moves counter
            TopHeaderBar(
                currentLevel = uiState.currentLevel,
                moveCount = uiState.moveCount,
                completedCount = uiState.bottles.count { it.isCompletedUniform },
                totalColorCount = uiState.bottles.count { !it.isEmpty }
            )

            // Responsive glass bottle playfield
            BoxWithConstraints(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                BottleGridPlayfield(
                    bottles = uiState.bottles,
                    selectedBottleIndex = uiState.selectedBottleIndex,
                    pouringFromIndex = uiState.pouringFromIndex,
                    pouringToIndex = uiState.pouringToIndex,
                    pouringColor = uiState.pouringColor,
                    maxWidth = maxWidth,
                    maxHeight = maxHeight,
                    onBottleClick = onBottleClick
                )
            }

            // Bottom control bar: Undo and Restart buttons
            BottomControlBar(
                canUndo = uiState.canUndo,
                remainingUndos = uiState.moveHistory.size,
                onUndoClick = onUndoClick,
                onRestartClick = onRestartClick
            )
        }

        // Level Completion Modal Overlay
        AnimatedVisibility(
            visible = uiState.isLevelCompleted,
            enter = fadeIn() + scaleIn(initialScale = 0.88f),
            exit = fadeOut() + scaleOut(targetScale = 0.9f),
            modifier = Modifier.align(Alignment.Center)
        ) {
            LevelCompleteDialog(
                levelNumber = uiState.currentLevel,
                moveCount = uiState.moveCount,
                onRestartLevel = onRestartClick,
                onNextLevel = onNextLevelClick
            )
        }
    }
}

@Composable
private fun TopHeaderBar(
    currentLevel: Int,
    moveCount: Int,
    completedCount: Int,
    totalColorCount: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = Color(0xFF102A4C).copy(alpha = 0.85f),
                shape = RoundedCornerShape(18.dp)
            )
            .border(
                width = 1.dp,
                color = Color(0x33BAE6FD),
                shape = RoundedCornerShape(18.dp)
            )
            .padding(horizontal = 20.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column {
            Text(
                text = "Water Sort Puzzle Master",
                color = Color(0xFF7DD3FC),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "Level $currentLevel",
                color = Color(0xFFF0F7FF),
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold
            )
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "Moves",
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "$moveCount",
                    color = Color(0xFFF0F7FF),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "Sorted",
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "$completedCount / ${totalColorCount.coerceAtLeast(1)}",
                    color = Color(0xFF34D399),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun BottleGridPlayfield(
    bottles: List<Bottle>,
    selectedBottleIndex: Int?,
    pouringFromIndex: Int?,
    pouringToIndex: Int?,
    pouringColor: com.watersort.puzzlemaster.model.WaterColor?,
    maxWidth: Dp,
    maxHeight: Dp,
    onBottleClick: (Int) -> Unit
) {
    if (bottles.isEmpty()) return

    val total = bottles.size
    val rowCount = if (total <= 5) 1 else 2
    val topRowCount = if (rowCount == 1) total else ceil(total / 2.0).toInt()
    val maxCols = topRowCount.coerceAtLeast(1)

    // Compute responsive bottle dimensions so they fit any Android phone or tablet screen
    val horizontalSpacing = 14.dp
    val availableWidthPerBottle = (maxWidth - horizontalSpacing * (maxCols + 1)) / maxCols
    val availableHeightPerBottle = if (rowCount == 1) {
        maxHeight * 0.62f
    } else {
        (maxHeight - 36.dp) * 0.44f
    }

    val bottleWidth = minOf(availableWidthPerBottle, availableHeightPerBottle * 0.42f)
        .coerceIn(48.dp, 82.dp)
    val bottleHeight = (bottleWidth * 2.38f).coerceIn(116.dp, 198.dp)

    val rows = if (rowCount == 1) {
        listOf(bottles.indices.toList())
    } else {
        listOf(
            (0 until topRowCount).toList(),
            (topRowCount until total).toList()
        )
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(28.dp)
    ) {
        rows.forEach { rowIndices ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(horizontalSpacing),
                verticalAlignment = Alignment.CenterVertically
            ) {
                rowIndices.forEach { index ->
                    val bottle = bottles[index]
                    GlassBottleView(
                        bottle = bottle,
                        isSelected = selectedBottleIndex == index,
                        isPouringSource = pouringFromIndex == index,
                        isPouringTarget = pouringToIndex == index,
                        pouringColor = pouringColor,
                        onClick = { onBottleClick(index) },
                        modifier = Modifier.size(width = bottleWidth, height = bottleHeight)
                    )
                }
            }
        }
    }
}

@Composable
private fun BottomControlBar(
    canUndo: Boolean,
    remainingUndos: Int,
    onUndoClick: () -> Unit,
    onRestartClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically
    ) {
        OutlinedButton(
            onClick = onUndoClick,
            enabled = canUndo,
            shape = RoundedCornerShape(14.dp),
            contentPadding = PaddingValues(horizontal = 24.dp, vertical = 14.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = Color(0xFFF0F7FF),
                disabledContentColor = Color(0xFF64748B)
            ),
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = if (remainingUndos > 0) "Undo ($remainingUndos)" else "Undo",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Button(
            onClick = onRestartClick,
            shape = RoundedCornerShape(14.dp),
            contentPadding = PaddingValues(horizontal = 24.dp, vertical = 14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF0EA5E9),
                contentColor = Color(0xFF071324)
            ),
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = "Restart",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun LevelCompleteDialog(
    levelNumber: Int,
    moveCount: Int,
    onRestartLevel: () -> Unit,
    onNextLevel: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 28.dp),
        shape = RoundedCornerShape(24.dp),
        color = Color(0xFF0F294A),
        tonalElevation = 8.dp
    ) {
        Column(
            modifier = Modifier
                .border(
                    width = 1.5.dp,
                    color = Color(0x6638BDF8),
                    shape = RoundedCornerShape(24.dp)
                )
                .padding(horizontal = 26.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Level $levelNumber Complete!",
                color = Color(0xFFF0F7FF),
                fontSize = 26.sp,
                fontWeight = FontWeight.ExtraBold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "Every glass bottle is sorted in $moveCount moves.",
                color = Color(0xFFBAE6FD),
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(26.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onRestartLevel,
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(vertical = 14.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color(0xFFF0F7FF)
                    ),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Replay",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Button(
                    onClick = onNextLevel,
                    shape = RoundedCornerShape(14.dp),
                    contentPadding = PaddingValues(vertical = 14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF10B981),
                        contentColor = Color(0xFF052E16)
                    ),
                    modifier = Modifier.weight(1.3f)
                ) {
                    Text(
                        text = "Next Level",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }
        }
    }
}
