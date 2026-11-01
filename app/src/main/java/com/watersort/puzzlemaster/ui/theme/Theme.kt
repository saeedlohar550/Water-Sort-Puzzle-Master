package com.watersort.puzzlemaster.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val WaterSortColorScheme = darkColorScheme(
    primary = CrystalCyan,
    secondary = AquaAccent,
    tertiary = WarmAmber,
    background = DeepOceanDark,
    surface = DeepOceanSurface,
    onPrimary = DeepOceanDark,
    onSecondary = FrostedWhite,
    onTertiary = DeepOceanDark,
    onBackground = FrostedWhite,
    onSurface = FrostedWhite
)

@Composable
fun WaterSortPuzzleMasterTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = WaterSortColorScheme,
        typography = Typography,
        content = content
    )
}
