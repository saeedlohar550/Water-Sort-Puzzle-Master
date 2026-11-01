import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Code2,
  Pause,
  Play,
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AndroidProjectModal } from './components/AndroidProjectModal';
import { WaterSortCanvas } from './components/WaterSortCanvas';
import {
  calculatePourCount,
  canPour,
  generateLevel,
  getTopColor,
  isBottleCompletedUniform,
  isLevelCompleted,
  performPour,
  undoMove,
} from './game/engine';
import { soundEngine } from './game/sound';
import {
  BottleData,
  GameScreenState,
  MoveRecord,
  PourAnimationState,
} from './game/types';

export default function App() {
  const [screenState, setScreenState] = useState<GameScreenState>('INTRO');
  const [introProgress, setIntroProgress] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState<number>(1);
  const [bottles, setBottles] = useState<BottleData[]>(() => generateLevel(1));
  const [selectedBottleIndex, setSelectedBottleIndex] = useState<number | null>(
    null
  );
  const [pourAnimation, setPourAnimation] =
    useState<PourAnimationState | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [moveCount, setMoveCount] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAndroidModal, setShowAndroidModal] = useState<boolean>(false);

  const pourAnimLockRef = useRef<boolean>(false);

  // Automatic Intro progression that smoothly transitions to PLAYING after ~3.2s
  useEffect(() => {
    if (screenState !== 'INTRO') return;

    let rafId: number;
    const duration = 3200;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(1, Math.max(0, elapsed / duration));
      setIntroProgress(pct);
      if (pct < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setScreenState('PLAYING');
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [screenState]);

  const startLevel = useCallback((levelNum: number) => {
    const safeLevel = Math.max(1, levelNum);
    pourAnimLockRef.current = false;
    setPourAnimation(null);
    setSelectedBottleIndex(null);
    setMoveHistory([]);
    setMoveCount(0);
    setCurrentLevel(safeLevel);
    setBottles(generateLevel(safeLevel));
    setScreenState('PLAYING');
  }, []);

  const handleRestartLevel = useCallback(() => {
    soundEngine.playDeselectGlass();
    startLevel(currentLevel);
  }, [currentLevel, startLevel]);

  const handleNextLevel = useCallback(() => {
    const next = currentLevel + 1;
    setHighestUnlockedLevel((prev) => Math.max(prev, next));
    startLevel(next);
  }, [currentLevel, startLevel]);

  const handleUndo = useCallback(() => {
    if (
      pourAnimation !== null ||
      moveHistory.length === 0 ||
      screenState !== 'PLAYING'
    ) {
      return;
    }
    const lastMove = moveHistory[moveHistory.length - 1];
    const restored = undoMove(bottles, lastMove);
    soundEngine.playDeselectGlass();
    setBottles(restored);
    setSelectedBottleIndex(null);
    setMoveHistory((prev) => prev.slice(0, prev.length - 1));
    setMoveCount((prev) => Math.max(0, prev - 1));
  }, [bottles, moveHistory, pourAnimation, screenState]);

  const handleBottleSelect = useCallback(
    (tappedIndex: number) => {
      if (
        screenState !== 'PLAYING' ||
        pourAnimation !== null ||
        pourAnimLockRef.current
      ) {
        return;
      }
      if (tappedIndex < 0 || tappedIndex >= bottles.length) return;

      const tappedBottle = bottles[tappedIndex];

      if (selectedBottleIndex === null) {
        if (tappedBottle.layers.length > 0) {
          soundEngine.playSelectGlass();
          setSelectedBottleIndex(tappedIndex);
        } else {
          soundEngine.playInvalidTap();
        }
        return;
      }

      if (selectedBottleIndex === tappedIndex) {
        soundEngine.playDeselectGlass();
        setSelectedBottleIndex(null);
        return;
      }

      const sourceBottle = bottles[selectedBottleIndex];
      if (canPour(sourceBottle, tappedBottle)) {
        const layersToMove = calculatePourCount(sourceBottle, tappedBottle);
        const topColor = getTopColor(sourceBottle);
        const result = performPour(bottles, selectedBottleIndex, tappedIndex);

        if (result && topColor && layersToMove > 0) {
          pourAnimLockRef.current = true;
          soundEngine.playWaterPour(layersToMove);
          setSelectedBottleIndex(null);
          setPourAnimation({
            fromIndex: selectedBottleIndex,
            toIndex: tappedIndex,
            color: topColor,
            layersCount: layersToMove,
            progress: 0,
            durationMs: 420,
            startTime: performance.now(),
            beforeBottles: bottles,
            afterBottles: result.bottles,
            moveRecord: result.move,
          });
        }
      } else {
        if (tappedBottle.layers.length > 0) {
          soundEngine.playSelectGlass();
          setSelectedBottleIndex(tappedIndex);
        } else {
          soundEngine.playInvalidTap();
          setSelectedBottleIndex(null);
        }
      }
    },
    [bottles, pourAnimation, screenState, selectedBottleIndex]
  );

  const handlePourAnimationComplete = useCallback(
    (completedAnim: PourAnimationState) => {
      if (!pourAnimLockRef.current) return;
      pourAnimLockRef.current = false;

      const updatedBottles = completedAnim.afterBottles;
      const targetBottle = updatedBottles[completedAnim.toIndex];
      const justCompletedTarget =
        targetBottle && isBottleCompletedUniform(targetBottle);

      setPourAnimation(null);
      setBottles(updatedBottles);
      setMoveHistory((prev) => [...prev, completedAnim.moveRecord]);
      setMoveCount((prev) => prev + 1);

      if (isLevelCompleted(updatedBottles)) {
        soundEngine.playLevelVictory();
        setHighestUnlockedLevel((prev) => Math.max(prev, currentLevel + 1));
        setScreenState('VICTORY');
      } else if (justCompletedTarget) {
        soundEngine.playBottleCompleted();
      }
    },
    [currentLevel]
  );

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundEngine.setMuted(nextMuted);
  }, [isMuted]);

  // Keyboard controls (edge-triggered actions + blur cleanup)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAndroidModal) {
        if (e.key === 'Escape') {
          setShowAndroidModal(false);
        }
        return;
      }

      if (screenState === 'INTRO') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setScreenState('PLAYING');
        }
        return;
      }

      if (screenState === 'VICTORY') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNextLevel();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          handleRestartLevel();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setScreenState((prev) => (prev === 'PAUSED' ? 'PLAYING' : 'PAUSED'));
        return;
      }

      if (screenState !== 'PLAYING') return;

      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < bottles.length) {
          handleBottleSelect(idx);
        }
      } else if (e.key === 'u' || e.key === 'U' || e.key === 'z' || e.key === 'Z') {
        handleUndo();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRestartLevel();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    bottles.length,
    handleBottleSelect,
    handleNextLevel,
    handleRestartLevel,
    handleToggleMute,
    handleUndo,
    screenState,
    showAndroidModal,
  ]);

  const completedBottlesCount = bottles.filter(isBottleCompletedUniform).length;
  const totalColorBottlesCount = Math.max(
    1,
    bottles.length === 3 ? 2 : bottles.length - 2
  );

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#071324] select-none">
      {/* Always-mounted 60fps Canvas backdrop and active puzzle simulation */}
      <div className="absolute inset-0">
        <WaterSortCanvas
          bottles={bottles}
          selectedBottleIndex={selectedBottleIndex}
          pourAnimation={pourAnimation}
          onBottleSelect={handleBottleSelect}
          onPourAnimationComplete={handlePourAnimationComplete}
        />
      </div>

      {/* 1. ANIMATED INTRO SCREEN OVERLAY */}
      {screenState === 'INTRO' && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-[#061120]/95 via-[#0B2240]/92 to-[#071324]/95 px-6 text-center">
          {/* Floating decorative water droplets */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <svg
              className="w-full h-full opacity-75"
              viewBox="0 0 1440 900"
              fill="none"
              preserveAspectRatio="xMidYMid slice"
            >
              <g className="animate-float-drop">
                <path
                  d="M210 160 C232 195 232 225 210 242 C188 225 188 195 210 160 Z"
                  fill="#38BDF8"
                  fillOpacity="0.45"
                />
                <path
                  d="M1210 190 C1236 232 1236 266 1210 286 C1184 266 1184 232 1210 190 Z"
                  fill="#F43F5E"
                  fillOpacity="0.42"
                />
                <path
                  d="M280 650 C300 682 300 710 280 726 C260 710 260 682 280 650 Z"
                  fill="#10B981"
                  fillOpacity="0.42"
                />
                <path
                  d="M1140 620 C1164 658 1164 690 1140 708 C1116 690 1116 658 1140 620 Z"
                  fill="#F59E0B"
                  fillOpacity="0.42"
                />
                <path
                  d="M720 110 C738 138 738 162 720 176 C702 162 702 138 720 110 Z"
                  fill="#A78BFA"
                  fillOpacity="0.4"
                />
              </g>
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center animate-title-entrance">
            {/* Bespoke inline SVG Showcase of Colorful Glass Bottles & Water Drops */}
            <svg
              className="w-64 h-44 mb-5 drop-shadow-[0_12px_28px_rgba(14,165,233,0.28)]"
              viewBox="0 0 280 185"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left Bottle (Tilted slightly) */}
              <g transform="translate(36, 22) rotate(-8 32 75)">
                <path
                  d="M18 10 H46 V26 C46 34 56 38 56 48 V126 C56 140 45 150 32 150 C19 150 8 140 8 126 V48 C8 38 18 34 18 26 V10 Z"
                  fill="#E0F2FE"
                  fillOpacity="0.14"
                />
                <path
                  d="M10 120 H54 V126 C54 138 44 148 32 148 C20 148 10 138 10 126 V120 Z"
                  fill="#0EA5E9"
                />
                <rect x="10" y="95" width="44" height="25" fill="#06B6D4" />
                <rect x="10" y="70" width="44" height="25" fill="#10B981" />
                <rect x="10" y="46" width="44" height="24" fill="#F59E0B" />
                <path
                  d="M18 10 H46 V26 C46 34 56 38 56 48 V126 C56 140 45 150 32 150 C19 150 8 140 8 126 V48 C8 38 18 34 18 26 V10 Z"
                  stroke="#BAE6FD"
                  strokeWidth="3"
                />
                <rect
                  x="14"
                  y="7"
                  width="36"
                  height="6"
                  rx="3"
                  fill="#F0F9FF"
                />
                <rect
                  x="14"
                  y="52"
                  width="5"
                  height="72"
                  rx="2.5"
                  fill="white"
                  fillOpacity="0.38"
                />
              </g>

              {/* Center Hero Bottle (Elevated) */}
              <g transform="translate(108, 8)">
                <path
                  d="M18 10 H46 V26 C46 34 56 38 56 48 V126 C56 140 45 150 32 150 C19 150 8 140 8 126 V48 C8 38 18 34 18 26 V10 Z"
                  fill="#E0F2FE"
                  fillOpacity="0.18"
                />
                <path
                  d="M10 120 H54 V126 C54 138 44 148 32 148 C20 148 10 138 10 126 V120 Z"
                  fill="#8B5CF6"
                />
                <rect x="10" y="95" width="44" height="25" fill="#EC4899" />
                <rect x="10" y="70" width="44" height="25" fill="#F43F5E" />
                <rect x="10" y="46" width="44" height="24" fill="#FBBF24" />
                <path
                  d="M18 10 H46 V26 C46 34 56 38 56 48 V126 C56 140 45 150 32 150 C19 150 8 140 8 126 V48 C8 38 18 34 18 26 V10 Z"
                  stroke="#38BDF8"
                  strokeWidth="3.5"
                />
                <rect
                  x="14"
                  y="7"
                  width="36"
                  height="6"
                  rx="3"
                  fill="#FFFFFF"
                />
                <rect
                  x="14"
                  y="52"
                  width="5"
                  height="72"
                  rx="2.5"
                  fill="white"
                  fillOpacity="0.45"
                />
              </g>

              {/* Right Bottle (Tilted slightly right) */}
              <g transform="translate(180, 22) rotate(8 32 75)">
                <path
                  d="M18 10 H46 V26 C46 34 56 38 56 48 V126 C56 140 45 150 32 150 C19 150 8 140 8 126 V48 C8 38 18 34 18 26 V10 Z"
                  fill="#E0F2FE"
                  fillOpacity="0.14"
                />
                <path
                  d="M10 120 H54 V126 C54 138 44 148 32 148 C20 148 10 138 10 126 V120 Z"
                  fill="#10B981"
                />
                <rect x="10" y="95" width="44" height="25" fill="#84CC16" />
                <rect x="10" y="70" width="44" height="25" fill="#0EA5E9" />
                <rect x="10" y="46" width="44" height="24" fill="#F43F5E" />
                <path
                  d="M18 10 H46 V26 C46 34 56 38 56 48 V126 C56 140 45 150 32 150 C19 150 8 140 8 126 V48 C8 38 18 34 18 26 V10 Z"
                  stroke="#BAE6FD"
                  strokeWidth="3"
                />
                <rect
                  x="14"
                  y="7"
                  width="36"
                  height="6"
                  rx="3"
                  fill="#F0F9FF"
                />
                <rect
                  x="14"
                  y="52"
                  width="5"
                  height="72"
                  rx="2.5"
                  fill="white"
                  fillOpacity="0.38"
                />
              </g>
            </svg>

            {/* Exact Required Intro Title */}
            <h1
              className="font-display font-extrabold tracking-tight text-[#F0F7FF] text-3xl sm:text-4xl md:text-5xl max-w-2xl leading-tight"
              style={{ textWrap: 'balance' }}
            >
              WELCOME TO WATER SORT PUZZLE MASTER
            </h1>

            <p className="mt-3 text-sm sm:text-base text-sky-200/85 max-w-md font-medium">
              Pour and sort vibrant liquid layers until every crystal bottle holds a single pure color.
            </p>

            {/* Smooth Auto-Transition Progress Bar */}
            <div className="mt-7 w-64 sm:w-72 h-2 bg-sky-950/80 rounded-full overflow-hidden border border-sky-400/20">
              <div
                className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 transition-none"
                style={{ width: `${Math.round(introProgress * 100)}%` }}
              />
            </div>

            {/* Primary Start CTA */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setScreenState('PLAYING')}
                className="flex items-center gap-2.5 px-7 py-3.5 text-base font-bold text-[#071324] bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 rounded-xl shadow-lg shadow-sky-500/20 transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Game</span>
              </button>

              <button
                onClick={() => setShowAndroidModal(true)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-sky-200 bg-[#0E2542] hover:bg-[#143258] border border-sky-400/25 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Code2 className="w-4 h-4 text-sky-400" />
                <span>Android Kotlin Source</span>
              </button>
            </div>

            {/* Single Flat Control-Hint Line */}
            <p className="mt-6 text-xs text-slate-400 font-mono-tabular">
              Click or 1–9 Select Bottle · U Undo · R Restart · Esc Pause
            </p>
          </div>
        </div>
      )}

      {/* 2. LOW-OCCLUSION PERIMETER HUD (Active during PLAYING) */}
      {screenState !== 'INTRO' && (
        <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
          {/* Top Perimeter Bar */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Cluster: Level Selector & Progress */}
            <div className="pointer-events-auto flex items-center gap-3 bg-[#0C203B]/90 border border-sky-400/20 rounded-2xl px-4 py-2.5 shadow-lg">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startLevel(Math.max(1, currentLevel - 1))}
                  disabled={currentLevel <= 1}
                  aria-label="Previous Level"
                  className="p-1.5 text-sky-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-sky-500/15 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-2 text-center">
                  <div className="text-[11px] font-medium text-sky-300/80 leading-none">
                    Water Sort Puzzle
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold font-display text-[#F0F7FF] font-mono-tabular leading-tight">
                    Level {currentLevel}
                  </div>
                </div>
                <button
                  onClick={() => startLevel(currentLevel + 1)}
                  disabled={currentLevel >= highestUnlockedLevel && currentLevel >= 25}
                  aria-label="Next Level"
                  className="p-1.5 text-sky-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg hover:bg-sky-500/15 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="h-7 w-px bg-sky-400/15 hidden sm:block" />

              <div className="hidden sm:flex items-center gap-4 text-xs px-1">
                <div>
                  <span className="text-slate-400">Moves </span>
                  <span className="font-bold text-[#F0F7FF] font-mono-tabular">
                    {moveCount}
                  </span>
                </div>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <div>
                  <span className="text-slate-400">Sorted </span>
                  <span className="font-bold text-emerald-400 font-mono-tabular">
                    {completedBottlesCount}/{totalColorBottlesCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Cluster: Android Kotlin Source, Audio Mute, Pause */}
            <div className="pointer-events-auto flex items-center gap-2.5">
              <button
                onClick={() => setShowAndroidModal(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-sky-200 bg-[#0C203B]/90 hover:bg-[#122E54] border border-sky-400/25 rounded-xl shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Code2 className="w-4 h-4 text-sky-400" />
                <span className="hidden md:inline">Android Project (Kotlin)</span>
                <span className="md:hidden">Kotlin</span>
              </button>

              <button
                onClick={handleToggleMute}
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="p-2.5 text-sky-200 bg-[#0C203B]/90 hover:bg-[#122E54] border border-sky-400/20 rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-sky-400" />
                )}
              </button>

              <button
                onClick={() =>
                  setScreenState((prev) =>
                    prev === 'PAUSED' ? 'PLAYING' : 'PAUSED'
                  )
                }
                aria-label="Pause Game"
                className="p-2.5 text-sky-200 bg-[#0C203B]/90 hover:bg-[#122E54] border border-sky-400/20 rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                <Pause className="w-5 h-5 text-sky-400" />
              </button>
            </div>
          </div>

          {/* Bottom Perimeter Controls: Undo & Restart */}
          <div className="flex items-center justify-center gap-4">
            <div className="pointer-events-auto flex items-center gap-3 bg-[#0C203B]/90 border border-sky-400/20 rounded-2xl p-2 shadow-lg">
              <button
                onClick={handleUndo}
                disabled={moveHistory.length === 0 || pourAnimation !== null}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#F0F7FF] bg-[#122F54] hover:bg-[#193E6D] disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Undo2 className="w-4 h-4 text-sky-400" />
                <span className="font-mono-tabular">
                  Undo{moveHistory.length > 0 ? ` (${moveHistory.length})` : ''}
                </span>
              </button>

              <button
                onClick={handleRestartLevel}
                disabled={pourAnimation !== null}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#071324] bg-sky-400 hover:bg-sky-300 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PAUSE MODAL */}
      {screenState === 'PAUSED' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#040B16]/80 px-4">
          <div className="w-full max-w-md bg-[#0C213D] border border-sky-400/25 rounded-3xl p-7 text-center shadow-2xl">
            <h2 className="text-2xl font-extrabold font-display text-[#F0F7FF]">
              Game Paused
            </h2>
            <p className="mt-1.5 text-sm text-sky-200/80 font-mono-tabular">
              Level {currentLevel} · {moveCount} Moves
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => setScreenState('PLAYING')}
                className="w-full py-3.5 text-sm font-bold text-[#071324] bg-sky-400 hover:bg-sky-300 rounded-xl transition-colors cursor-pointer"
              >
                Resume Game
              </button>
              <button
                onClick={handleRestartLevel}
                className="w-full py-3.5 text-sm font-semibold text-[#F0F7FF] bg-[#13325B] hover:bg-[#194073] rounded-xl transition-colors cursor-pointer"
              >
                Restart Level
              </button>
              <button
                onClick={() => setScreenState('INTRO')}
                className="w-full py-3.5 text-sm font-semibold text-sky-200 bg-[#0F2747] hover:bg-[#14335C] border border-sky-400/20 rounded-xl transition-colors cursor-pointer"
              >
                Replay Intro Animation
              </button>
              <button
                onClick={() => setShowAndroidModal(true)}
                className="w-full py-3.5 text-sm font-semibold text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-400/25 rounded-xl transition-colors cursor-pointer"
              >
                Inspect / Download Android Project (.zip)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEVEL COMPLETE VICTORY MODAL */}
      {screenState === 'VICTORY' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#040B16]/80 px-4">
          <div className="w-full max-w-md bg-[#0C213D] border border-emerald-400/35 rounded-3xl p-7 text-center shadow-2xl animate-title-entrance">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <svg
                className="w-9 h-9 text-emerald-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <h2 className="text-3xl font-extrabold font-display text-[#F0F7FF]">
              Level {currentLevel} Complete!
            </h2>
            <p className="mt-2 text-sm text-sky-200/85">
              All glass bottles sorted cleanly in{' '}
              <span className="font-bold text-emerald-300 font-mono-tabular">
                {moveCount} moves
              </span>
              .
            </p>

            <div className="mt-7 flex items-center gap-3">
              <button
                onClick={handleRestartLevel}
                className="flex-1 py-3.5 text-sm font-bold text-sky-200 bg-[#13325B] hover:bg-[#194073] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Replay Level
              </button>
              <button
                onClick={handleNextLevel}
                className="flex-[1.3] py-3.5 text-sm font-extrabold text-[#052E16] bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg shadow-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap"
              >
                Next Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ANDROID STUDIO PROJECT INSPECTOR & ZIP DOWNLOADER MODAL */}
      {showAndroidModal && (
        <AndroidProjectModal onClose={() => setShowAndroidModal(false)} />
      )}
    </main>
  );
}
