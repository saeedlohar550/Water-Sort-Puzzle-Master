package com.watersort.puzzlemaster

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.watersort.puzzlemaster.ui.screens.GameScreen
import com.watersort.puzzlemaster.ui.screens.IntroScreen
import com.watersort.puzzlemaster.ui.theme.DeepOceanDark
import com.watersort.puzzlemaster.ui.theme.WaterSortPuzzleMasterTheme
import com.watersort.puzzlemaster.viewmodel.GameViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            WaterSortPuzzleMasterTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = DeepOceanDark
                ) {
                    WaterSortPuzzleMasterApp()
                }
            }
        }
    }
}

@Composable
fun WaterSortPuzzleMasterApp(
    gameViewModel: GameViewModel = viewModel()
) {
    var showIntro by rememberSaveable { mutableStateOf(true) }

    Crossfade(
        targetState = showIntro,
        animationSpec = tween(durationMillis = 550),
        label = "screenTransition"
    ) { isIntroVisible ->
        if (isIntroVisible) {
            IntroScreen(
                onIntroFinished = { showIntro = false }
            )
        } else {
            GameScreen(viewModel = gameViewModel)
        }
    }
}
