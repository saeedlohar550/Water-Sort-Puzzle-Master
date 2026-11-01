package com.watersort.puzzlemaster.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.watersort.puzzlemaster.model.Bottle
import com.watersort.puzzlemaster.model.WaterColor
import com.watersort.puzzlemaster.ui.components.GlassBottleView
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.PI
import kotlin.math.sin

private data class IntroWaterDrop(
    val xFraction: Float,
    val baseYFraction: Float,
    val sizeDp: Float,
    val speedFactor: Float,
    val color: Color
)

@Composable
fun IntroScreen(
    onIntroFinished: () -> Unit
) {
    val titleScale = remember { Animatable(0.72f) }
    val titleAlpha = remember { Animatable(0f) }
    val bottlesOffsetY = remember { Animatable(60f) }
    val bottlesAlpha = remember { Animatable(0f) }
    val progressAnim = remember { Animatable(0f) }

    val infiniteTransition = rememberInfiniteTransition(label = "introBackground")
    val dropPhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "dropPhase"
    )

    val waveShift by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2 * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "waveShift"
    )

    val waterDrops = remember {
        listOf(
            IntroWaterDrop(0.12f, 0.18f, 16f, 1.0f, WaterColor.OCEAN_BLUE.highlightColor),
            IntroWaterDrop(0.26f, 0.65f, 12f, 1.3f, WaterColor.CORAL_RED.highlightColor),
            IntroWaterDrop(0.42f, 0.30f, 18f, 0.9f, WaterColor.EMERALD_GREEN.highlightColor),
            IntroWaterDrop(0.61f, 0.78f, 14f, 1.2f, WaterColor.SUNSET_AMBER.highlightColor),
            IntroWaterDrop(0.76f, 0.24f, 20f, 1.1f, WaterColor.ROYAL_VIOLET.highlightColor),
            IntroWaterDrop(0.88f, 0.55f, 15f, 1.4f, WaterColor.TROPICAL_CYAN.highlightColor),
            IntroWaterDrop(0.19f, 0.85f, 13f, 1.15f, WaterColor.MAGENTA_PINK.highlightColor),
            IntroWaterDrop(0.53f, 0.12f, 15f, 1.25f, WaterColor.LIME_ZEST.highlightColor)
        )
    }

    val showcaseBottles = remember {
        listOf(
            Bottle(
                id = 101,
                layers = listOf(
                    WaterColor.OCEAN_BLUE,
                    WaterColor.TROPICAL_CYAN,
                    WaterColor.EMERALD_GREEN,
                    WaterColor.SUNSET_AMBER
                )
            ),
            Bottle(
                id = 102,
                layers = listOf(
                    WaterColor.ROYAL_VIOLET,
                    WaterColor.MAGENTA_PINK,
                    WaterColor.CORAL_RED,
                    WaterColor.SUNSET_AMBER
                )
            ),
            Bottle(
                id = 103,
                layers = listOf(
                    WaterColor.EMERALD_GREEN,
                    WaterColor.LIME_ZEST,
                    WaterColor.TROPICAL_CYAN,
                    WaterColor.OCEAN_BLUE
                )
            )
        )
    }

    LaunchedEffect(Unit) {
        launch {
            titleAlpha.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing)
            )
        }
        launch {
            titleScale.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 750, easing = FastOutSlowInEasing)
            )
        }
        launch {
            delay(200)
            bottlesAlpha.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 650, easing = FastOutSlowInEasing)
            )
        }
        launch {
            delay(200)
            bottlesOffsetY.animateTo(
                targetValue = 0f,
                animationSpec = tween(durationMillis = 700, easing = FastOutSlowInEasing)
            )
        }
        launch {
            progressAnim.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 2900, easing = LinearEasing)
            )
            onIntroFinished()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF071324),
                        Color(0xFF0E294B),
                        Color(0xFF091D36)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        // Animated water waves and colorful teardrop particles in background
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = size.width
            val h = size.height

            // Soft bottom ocean wave ribbons
            for (waveIdx in 0..1) {
                val baseHeight = h * (0.78f + waveIdx * 0.07f)
                val wavePath = Path().apply {
                    moveTo(0f, h)
                    lineTo(0f, baseHeight)
                    val steps = 28
                    for (i in 0..steps) {
                        val x = (i.toFloat() / steps) * w
                        val y = baseHeight + sin(waveShift + i * 0.35f + waveIdx) * 18f
                        lineTo(x, y)
                    }
                    lineTo(w, h)
                    close()
                }
                drawPath(
                    path = wavePath,
                    color = if (waveIdx == 0) Color(0x220EA5E9) else Color(0x2806B6D4)
                )
            }

            // Animated falling/floating colorful water drops
            waterDrops.forEachIndexed { index, drop ->
                val rawY = (drop.baseYFraction + dropPhase * drop.speedFactor) % 1.0f
                val cx = w * drop.xFraction + sin(waveShift + index) * 14f
                val cy = h * rawY
                val r = drop.sizeDp * density * 0.5f

                val teardownPath = Path().apply {
                    moveTo(cx, cy - r * 1.45f)
                    cubicTo(
                        cx + r * 1.1f, cy - r * 0.2f,
                        cx + r * 1.05f, cy + r,
                        cx, cy + r
                    )
                    cubicTo(
                        cx - r * 1.05f, cy + r,
                        cx - r * 1.1f, cy - r * 0.2f,
                        cx, cy - r * 1.45f
                    )
                    close()
                }

                drawPath(
                    path = teardownPath,
                    color = drop.color.copy(alpha = 0.42f)
                )
                drawCircle(
                    color = Color.White.copy(alpha = 0.35f),
                    radius = r * 0.24f,
                    center = Offset(cx - r * 0.25f, cy + r * 0.15f)
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Animated game title
            Box(
                modifier = Modifier
                    .graphicsLayer {
                        scaleX = titleScale.value
                        scaleY = titleScale.value
                        alpha = titleAlpha.value
                    }
                    .padding(horizontal = 8.dp)
            ) {
                Text(
                    text = "WELCOME TO WATER SORT PUZZLE MASTER",
                    color = Color(0xFFF0F7FF),
                    fontSize = 26.sp,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center,
                    lineHeight = 34.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Sort colorful liquids into pure glass bottles",
                color = Color(0xFFBAE6FD),
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                modifier = Modifier.graphicsLayer {
                    alpha = titleAlpha.value
                }
            )

            Spacer(modifier = Modifier.height(36.dp))

            // Animated colorful glass bottles showcase
            Row(
                modifier = Modifier
                    .graphicsLayer {
                        translationY = bottlesOffsetY.value
                        alpha = bottlesAlpha.value
                    },
                horizontalArrangement = Arrangement.spacedBy(22.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                showcaseBottles.forEachIndexed { index, bottle ->
                    GlassBottleView(
                        bottle = bottle,
                        isSelected = index == 1,
                        isPouringSource = false,
                        isPouringTarget = false,
                        pouringColor = null,
                        onClick = onIntroFinished,
                        modifier = Modifier.size(width = 72.dp, height = 176.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(42.dp))

            // Smooth loading indicator bar
            LinearProgressIndicator(
                progress = { progressAnim.value },
                modifier = Modifier
                    .fillMaxWidth(0.62f)
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = Color(0xFF38BDF8),
                trackColor = Color(0x33BAE6FD)
            )
        }
    }
}
