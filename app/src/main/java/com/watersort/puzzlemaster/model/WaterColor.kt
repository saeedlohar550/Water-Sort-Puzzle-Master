package com.watersort.puzzlemaster.model

import androidx.compose.ui.graphics.Color

/**
 * Represents the distinct liquid colors available in Water Sort Puzzle Master.
 * Each color provides a primary body hue and a lighter surface highlight for realistic liquid depth.
 */
enum class WaterColor(
    val displayName: String,
    val primaryColor: Color,
    val highlightColor: Color,
    val deepColor: Color
) {
    CORAL_RED(
        displayName = "Coral Red",
        primaryColor = Color(0xFFF43F5E),
        highlightColor = Color(0xFFFB7185),
        deepColor = Color(0xFFBE123C)
    ),
    OCEAN_BLUE(
        displayName = "Ocean Blue",
        primaryColor = Color(0xFF0EA5E9),
        highlightColor = Color(0xFF38BDF8),
        deepColor = Color(0xFF0369A1)
    ),
    EMERALD_GREEN(
        displayName = "Emerald Green",
        primaryColor = Color(0xFF10B981),
        highlightColor = Color(0xFF34D399),
        deepColor = Color(0xFF047857)
    ),
    SUNSET_AMBER(
        displayName = "Sunset Amber",
        primaryColor = Color(0xFFF59E0B),
        highlightColor = Color(0xFFFBBF24),
        deepColor = Color(0xFFB45309)
    ),
    ROYAL_VIOLET(
        displayName = "Royal Violet",
        primaryColor = Color(0xFF8B5CF6),
        highlightColor = Color(0xFFA78BFA),
        deepColor = Color(0xFF5B21B6)
    ),
    TROPICAL_CYAN(
        displayName = "Tropical Cyan",
        primaryColor = Color(0xFF06B6D4),
        highlightColor = Color(0xFF22D3EE),
        deepColor = Color(0xFF0E7490)
    ),
    MAGENTA_PINK(
        displayName = "Magenta Pink",
        primaryColor = Color(0xFFEC4899),
        highlightColor = Color(0xFFF472B6),
        deepColor = Color(0xFF9D174D)
    ),
    LIME_ZEST(
        displayName = "Lime Zest",
        primaryColor = Color(0xFF84CC16),
        highlightColor = Color(0xFFA3E635),
        deepColor = Color(0xFF4D7C0F)
    ),
    TANGERINE_ORANGE(
        displayName = "Tangerine",
        primaryColor = Color(0xFFF97316),
        highlightColor = Color(0xFFFB923C),
        deepColor = Color(0xFFC2410C)
    )
}
