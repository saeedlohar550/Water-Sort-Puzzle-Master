package com.watersort.puzzlemaster.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.IntOffset
import com.watersort.puzzlemaster.model.Bottle
import com.watersort.puzzlemaster.model.WaterColor
import kotlin.math.PI
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Renders a smooth, contoured transparent glass bottle with vibrant liquid layers,
 * animated surface meniscus waves, specular glass reflections, and selection/pouring states.
 */
@Composable
fun GlassBottleView(
    bottle: Bottle,
    isSelected: Boolean,
    isPouringSource: Boolean,
    isPouringTarget: Boolean,
    pouringColor: WaterColor?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val liftDp by animateFloatAsState(
        targetValue = when {
            isPouringSource -> -28f
            isSelected -> -20f
            else -> 0f
        },
        animationSpec = tween(durationMillis = 220, easing = FastOutSlowInEasing),
        label = "bottleLift"
    )

    val tiltDegrees by animateFloatAsState(
        targetValue = if (isPouringSource) 34f else 0f,
        animationSpec = tween(durationMillis = 240, easing = FastOutSlowInEasing),
        label = "bottleTilt"
    )

    val scaleFactor by animateFloatAsState(
        targetValue = if (isSelected) 1.05f else 1.0f,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "bottleScale"
    )

    val infiniteTransition = rememberInfiniteTransition(label = "liquidWaveTransition")
    val wavePhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2f * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "wavePhase"
    )

    val interactionSource = remember { MutableInteractionSource() }

    Box(
        modifier = modifier
            .offset { IntOffset(0, (liftDp * 2.5f).roundToInt()) }
            .graphicsLayer {
                rotationZ = tiltDegrees
                scaleX = scaleFactor
                scaleY = scaleFactor
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawContouredGlassBottle(
                bottle = bottle,
                isSelected = isSelected,
                isPouringTarget = isPouringTarget,
                pouringColor = pouringColor,
                wavePhase = wavePhase
            )
        }
    }
}

private fun DrawScope.drawContouredGlassBottle(
    bottle: Bottle,
    isSelected: Boolean,
    isPouringTarget: Boolean,
    pouringColor: WaterColor?,
    wavePhase: Float
) {
    val w = size.width
    val h = size.height

    val neckTopY = h * 0.08f
    val shoulderStartY = h * 0.19f
    val bodyStartY = h * 0.27f
    val bottomY = h * 0.94f

    val bodyLeft = w * 0.15f
    val bodyRight = w * 0.85f
    val bodyWidth = bodyRight - bodyLeft

    val neckLeft = w * 0.26f
    val neckRight = w * 0.74f

    val lipLeft = w * 0.21f
    val lipRight = w * 0.79f

    val bottomRadius = bodyWidth * 0.46f

    // Build smooth contoured bottle silhouette path
    val bottlePath = Path().apply {
        moveTo(neckLeft, neckTopY)
        lineTo(neckRight, neckTopY)
        lineTo(neckRight, shoulderStartY)
        cubicTo(
            neckRight, shoulderStartY + (bodyStartY - shoulderStartY) * 0.45f,
            bodyRight, shoulderStartY + (bodyStartY - shoulderStartY) * 0.45f,
            bodyRight, bodyStartY
        )
        lineTo(bodyRight, bottomY - bottomRadius)
        arcTo(
            rect = Rect(
                left = bodyRight - bottomRadius * 2f,
                top = bottomY - bottomRadius * 2f,
                right = bodyRight,
                bottom = bottomY
            ),
            startAngleDegrees = 0f,
            sweepAngleDegrees = 90f,
            forceMoveTo = false
        )
        lineTo(bodyLeft + bottomRadius, bottomY)
        arcTo(
            rect = Rect(
                left = bodyLeft,
                top = bottomY - bottomRadius * 2f,
                right = bodyLeft + bottomRadius * 2f,
                bottom = bottomY
            ),
            startAngleDegrees = 90f,
            sweepAngleDegrees = 90f,
            forceMoveTo = false
        )
        lineTo(bodyLeft, bodyStartY)
        cubicTo(
            bodyLeft, shoulderStartY + (bodyStartY - shoulderStartY) * 0.45f,
            neckLeft, shoulderStartY + (bodyStartY - shoulderStartY) * 0.45f,
            neckLeft, shoulderStartY
        )
        close()
    }

    // Selection glow halo underneath bottle
    if (isSelected) {
        drawRoundRect(
            brush = Brush.radialGradient(
                colors = listOf(Color(0x6638BDF8), Color.Transparent),
                center = Offset(w * 0.5f, h * 0.55f),
                radius = w * 0.65f
            ),
            topLeft = Offset(0f, 0f),
            size = size
        )
    }

    // Translucent frosted glass interior fill
    drawPath(
        path = bottlePath,
        brush = Brush.horizontalGradient(
            colors = listOf(
                Color(0x28E0F2FE),
                Color(0x12FFFFFF),
                Color(0x24BAE6FD)
            ),
            startX = bodyLeft,
            endX = bodyRight
        )
    )

    // Draw liquid layers clipped inside the smooth glass path
    val liquidTopLimit = bodyStartY + (bottomY - bodyStartY) * 0.04f
    val liquidTotalHeight = bottomY - liquidTopLimit
    val layerHeight = liquidTotalHeight / bottle.capacity.toFloat()

    clipPath(bottlePath) {
        // Incoming pouring stream when this bottle is the target
        if (isPouringTarget && pouringColor != null) {
            val streamWidth = w * 0.11f
            drawRect(
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        pouringColor.primaryColor,
                        pouringColor.highlightColor,
                        pouringColor.primaryColor
                    ),
                    startX = (w - streamWidth) * 0.5f,
                    endX = (w + streamWidth) * 0.5f
                ),
                topLeft = Offset((w - streamWidth) * 0.5f, 0f),
                size = Size(streamWidth, bottomY)
            )
        }

        bottle.layers.forEachIndexed { index, waterColor ->
            val layerBottom = bottomY - index * layerHeight
            val layerTop = layerBottom - layerHeight
            val isTopLayer = index == bottle.layers.lastIndex

            if (isTopLayer) {
                val wavePath = Path().apply {
                    val steps = 16
                    val stepWidth = (bodyRight - bodyLeft) / steps
                    val waveAmplitude = if (isSelected || isPouringTarget) 3.8f else 2.0f
                    moveTo(bodyLeft, layerBottom + 4f)
                    lineTo(bodyLeft, layerTop)
                    for (s in 0..steps) {
                        val x = bodyLeft + s * stepWidth
                        val angle = wavePhase + (s.toFloat() / steps) * (2f * PI).toFloat()
                        val y = layerTop + sin(angle) * waveAmplitude
                        lineTo(x, y)
                    }
                    lineTo(bodyRight, layerBottom + 4f)
                    close()
                }

                drawPath(
                    path = wavePath,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            waterColor.highlightColor,
                            waterColor.primaryColor,
                            waterColor.deepColor
                        ),
                        startY = layerTop - 4f,
                        endY = layerBottom
                    )
                )

                // Bright liquid meniscus highlight on top layer
                drawOval(
                    color = Color.White.copy(alpha = 0.26f),
                    topLeft = Offset(bodyLeft + bodyWidth * 0.08f, layerTop - 3f),
                    size = Size(bodyWidth * 0.84f, 6f)
                )
            } else {
                drawRect(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            waterColor.primaryColor,
                            waterColor.deepColor
                        ),
                        startY = layerTop,
                        endY = layerBottom + 2f
                    ),
                    topLeft = Offset(bodyLeft, layerTop),
                    size = Size(bodyWidth, layerHeight + 2f)
                )

                // Subtle interface line between different colors
                val aboveColor = bottle.layers.getOrNull(index + 1)
                if (aboveColor != null && aboveColor != waterColor) {
                    drawLine(
                        color = Color.White.copy(alpha = 0.22f),
                        start = Offset(bodyLeft, layerTop),
                        end = Offset(bodyRight, layerTop),
                        strokeWidth = 1.5f
                    )
                }
            }
        }

        // Specular left-side vertical glass highlight
        val leftHighlightPath = Path().apply {
            addRoundRect(
                RoundRect(
                    rect = Rect(
                        left = bodyLeft + bodyWidth * 0.10f,
                        top = bodyStartY + 8f,
                        right = bodyLeft + bodyWidth * 0.20f,
                        bottom = bottomY - bottomRadius * 0.65f
                    ),
                    cornerRadius = CornerRadius(12f, 12f)
                )
            )
        }
        drawPath(
            path = leftHighlightPath,
            brush = Brush.verticalGradient(
                colors = listOf(
                    Color.White.copy(alpha = 0.42f),
                    Color.White.copy(alpha = 0.14f),
                    Color.Transparent
                )
            )
        )

        // Subtle right-side rim reflection
        val rightHighlightPath = Path().apply {
            addRoundRect(
                RoundRect(
                    rect = Rect(
                        left = bodyRight - bodyWidth * 0.14f,
                        top = bodyStartY + 18f,
                        right = bodyRight - bodyWidth * 0.08f,
                        bottom = bottomY - bottomRadius * 0.8f
                    ),
                    cornerRadius = CornerRadius(8f, 8f)
                )
            )
        }
        drawPath(
            path = rightHighlightPath,
            color = Color.White.copy(alpha = 0.20f)
        )
    }

    // Outer glass wall stroke
    val borderColor = when {
        bottle.isCompletedUniform -> Color(0xFF34D399)
        isSelected -> Color(0xFF38BDF8)
        else -> Color(0xCCBAE6FD)
    }

    drawPath(
        path = bottlePath,
        color = borderColor,
        style = Stroke(
            width = if (isSelected || bottle.isCompletedUniform) 4.2f else 3.0f,
            cap = StrokeCap.Round,
            join = StrokeJoin.Round
        )
    )

    // Flared glass rim lip at the bottle opening
    drawRoundRect(
        brush = Brush.horizontalGradient(
            colors = listOf(
                borderColor.copy(alpha = 0.85f),
                Color.White.copy(alpha = 0.95f),
                borderColor.copy(alpha = 0.85f)
            ),
            startX = lipLeft,
            endX = lipRight
        ),
        topLeft = Offset(lipLeft, neckTopY - 4f),
        size = Size(lipRight - lipLeft, 8f),
        cornerRadius = CornerRadius(6f, 6f)
    )

    // If bottle is completed with 4 matching colors, draw a golden cork seal at the top
    if (bottle.isCompletedUniform) {
        val corkWidth = (neckRight - neckLeft) * 0.84f
        val corkLeft = (w - corkWidth) * 0.5f
        drawRoundRect(
            brush = Brush.verticalGradient(
                colors = listOf(Color(0xFFFBBF24), Color(0xFFD97706))
            ),
            topLeft = Offset(corkLeft, neckTopY - 9f),
            size = Size(corkWidth, 14f),
            cornerRadius = CornerRadius(4f, 4f)
        )
    }
}
