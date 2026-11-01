import React, { useEffect, useRef } from 'react';
import {
  canPour,
  isBottleCompletedUniform,
  WATER_COLORS,
} from '../game/engine';
import {
  BottleData,
  DropletParticle,
  PourAnimationState,
  WaterColorId,
} from '../game/types';

interface WaterSortCanvasProps {
  bottles: BottleData[];
  selectedBottleIndex: number | null;
  pourAnimation: PourAnimationState | null;
  onBottleSelect: (index: number) => void;
  onPourAnimationComplete: (anim: PourAnimationState) => void;
}

interface BottleRect {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BubbleParticle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  wobbleOffset: number;
  alpha: number;
}

export const WaterSortCanvas: React.FC<WaterSortCanvasProps> = ({
  bottles,
  selectedBottleIndex,
  pourAnimation,
  onBottleSelect,
  onPourAnimationComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Store latest props in refs so the 60fps requestAnimationFrame loop never restarts on React state updates
  const stateRef = useRef({
    bottles,
    selectedBottleIndex,
    pourAnimation,
    onBottleSelect,
    onPourAnimationComplete,
  });

  useEffect(() => {
    stateRef.current = {
      bottles,
      selectedBottleIndex,
      pourAnimation,
      onBottleSelect,
      onPourAnimationComplete,
    };
  }, [
    bottles,
    selectedBottleIndex,
    pourAnimation,
    onBottleSelect,
    onPourAnimationComplete,
  ]);

  const bottleRectsRef = useRef<BottleRect[]>([]);
  const hoveredIndexRef = useRef<number | null>(null);
  const liftOffsetsRef = useRef<number[]>([]);
  const particlesRef = useRef<DropletParticle[]>([]);
  const bubblesRef = useRef<BubbleParticle[]>([]);
  const completedIdsRef = useRef<Set<number>>(new Set());
  const shakeRef = useRef<number>(0);
  const hitstopTimerRef = useRef<number>(0);

  // Track newly completed bottles to spawn celebratory cork & sparkle burst
  useEffect(() => {
    const currentCompleted = new Set<number>();
    bottles.forEach((b, idx) => {
      if (isBottleCompletedUniform(b)) {
        currentCompleted.add(b.id);
        if (!completedIdsRef.current.has(b.id) && completedIdsRef.current.size >= 0) {
          const rect = bottleRectsRef.current[idx];
          if (rect) {
            const topColorId = b.layers[b.layers.length - 1];
            const colorDef = WATER_COLORS[topColorId];
            spawnCompletionParticles(
              rect.x + rect.width * 0.5,
              rect.y + rect.height * 0.12,
              colorDef ? colorDef.highlight : '#38BDF8'
            );
            shakeRef.current = 5.5;
            hitstopTimerRef.current = 0.045; // 45ms tactile hitstop
          }
        }
      }
    });
    completedIdsRef.current = currentCompleted;
  }, [bottles]);

  const spawnCompletionParticles = (cx: number, cy: number, colorHex: string) => {
    const list = particlesRef.current;
    for (let i = 0; i < 26; i++) {
      const angle = (Math.PI * 2 * i) / 26 + (Math.random() - 0.5) * 0.25;
      const speed = 90 + Math.random() * 170;
      list.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        radius: 2.5 + Math.random() * 3.5,
        color: i % 3 === 0 ? '#FBBF24' : i % 2 === 0 ? '#FFFFFF' : colorHex,
        alpha: 1,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.35,
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize ambient rising water bubbles
    if (bubblesRef.current.length === 0) {
      for (let i = 0; i < 24; i++) {
        bubblesRef.current.push({
          x: Math.random(),
          y: Math.random(),
          radius: 2 + Math.random() * 5.5,
          speedY: 0.025 + Math.random() * 0.04,
          wobbleOffset: Math.random() * Math.PI * 2,
          alpha: 0.08 + Math.random() * 0.16,
        });
      }
    }

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let waveTime = 0;

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = (now: number) => {
      const rawDt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      if (hitstopTimerRef.current > 0) {
        hitstopTimerRef.current = Math.max(0, hitstopTimerRef.current - dt);
      } else {
        waveTime += dt * 3.2;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Apply decaying camera shake if active
      if (shakeRef.current > 0.1) {
        const dx = (Math.random() - 0.5) * shakeRef.current * 2;
        const dy = (Math.random() - 0.5) * shakeRef.current * 2;
        ctx.translate(dx, dy);
        shakeRef.current *= Math.pow(0.04, dt);
      } else {
        shakeRef.current = 0;
      }

      // 1. Draw deep aquatic background gradient and ambient light waves
      drawAquaticBackdrop(ctx, width, height, waveTime, bubblesRef.current, dt);

      const {
        bottles: currentBottles,
        selectedBottleIndex: selectedIdx,
        pourAnimation: activePour,
        onPourAnimationComplete: finishPour,
      } = stateRef.current;

      // 2. Compute responsive bottle slots
      const rects = computeBottleLayout(currentBottles.length, width, height);
      bottleRectsRef.current = rects;

      // Ensure lift interpolation array matches bottle count
      while (liftOffsetsRef.current.length < currentBottles.length) {
        liftOffsetsRef.current.push(0);
      }

      // Check pour animation progress
      let pourProgress = 0;
      if (activePour) {
        const elapsed = now - activePour.startTime;
        pourProgress = Math.min(1, Math.max(0, elapsed / activePour.durationMs));
      }

      // 3. Draw non-pouring bottles first so the active pouring bottle renders cleanly on top
      for (let i = 0; i < currentBottles.length; i++) {
        if (activePour && i === activePour.fromIndex) continue;

        const rect = rects[i];
        if (!rect) continue;

        const isSelected = selectedIdx === i;
        const isHovered = hoveredIndexRef.current === i;
        const canReceiveFromSelected =
          selectedIdx !== null &&
          selectedIdx !== i &&
          currentBottles[selectedIdx] &&
          canPour(currentBottles[selectedIdx], currentBottles[i]);

        const targetLift = isSelected
          ? -24
          : isHovered && (!selectedIdx || canReceiveFromSelected)
          ? -8
          : 0;

        liftOffsetsRef.current[i] +=
          (targetLift - liftOffsetsRef.current[i]) * Math.min(1, dt * 16);

        // Determine displayed liquid level (smoothly rising if this bottle is the pour target)
        let extraFillFraction = 0;
        let extraFillColor: WaterColorId | null = null;
        let baseLayers = currentBottles[i].layers;

        if (activePour && i === activePour.toIndex) {
          baseLayers = activePour.beforeBottles[i].layers;
          extraFillColor = activePour.color;
          // Liquid rises during the middle phase of the pour (0.20 -> 0.85)
          const streamFactor = Math.min(
            1,
            Math.max(0, (pourProgress - 0.18) / 0.64)
          );
          extraFillFraction = streamFactor * activePour.layersCount;
        }

        drawSingleGlassBottle(ctx, {
          bottle: { ...currentBottles[i], layers: baseLayers },
          x: rect.x,
          y: rect.y + liftOffsetsRef.current[i],
          width: rect.width,
          height: rect.height,
          isSelected,
          isValidTarget: canReceiveFromSelected,
          tiltRadians: 0,
          waveTime: waveTime + i * 0.7,
          extraTopColor: extraFillColor,
          extraTopLayers: extraFillFraction,
          keyLabel: i < 9 ? `${i + 1}` : undefined,
        });
      }

      // 4. Draw active pouring bottle and parabolic liquid stream on top
      if (activePour) {
        const fromRect = rects[activePour.fromIndex];
        const toRect = rects[activePour.toIndex];
        const beforeSource = activePour.beforeBottles[activePour.fromIndex];

        if (fromRect && toRect && beforeSource) {
          // Smooth 3-stage trajectory: move & tilt (0..0.22), pour (0.22..0.82), return (0.82..1.0)
          let moveFactor = 0;
          if (pourProgress < 0.22) {
            moveFactor = easeOutCubic(pourProgress / 0.22);
          } else if (pourProgress < 0.82) {
            moveFactor = 1;
          } else {
            moveFactor = 1 - easeInOutCubic((pourProgress - 0.82) / 0.18);
          }

          const pourRightward = toRect.x >= fromRect.x;
          const direction = pourRightward ? 1 : -1;

          // Position source bottle neck right above the target bottle opening
          const targetAnchorX =
            toRect.x +
            toRect.width * 0.5 -
            fromRect.width * 0.5 -
            direction * (fromRect.width * 0.62);
          const targetAnchorY = toRect.y - fromRect.height * 0.36;

          const currentX =
            fromRect.x + (targetAnchorX - fromRect.x) * moveFactor;
          const currentY =
            fromRect.y - 24 + (targetAnchorY - (fromRect.y - 24)) * moveFactor;
          const tiltAngle = direction * (Math.PI * 0.34) * moveFactor;

          const drainFactor = Math.min(
            1,
            Math.max(0, (pourProgress - 0.18) / 0.64)
          );
          const remainingRemovedLayers =
            (1 - drainFactor) * activePour.layersCount;
          const keptLayers = beforeSource.layers.slice(
            0,
            beforeSource.layers.length - activePour.layersCount
          );

          // Draw parabolic liquid stream during the pouring window
          if (pourProgress >= 0.17 && pourProgress <= 0.84) {
            const colorDef = WATER_COLORS[activePour.color];
            const mouthX =
              currentX +
              fromRect.width * 0.5 +
              direction * (fromRect.width * 0.42);
            const mouthY = currentY + fromRect.height * 0.18;
            const destX = toRect.x + toRect.width * 0.5;
            const destY = toRect.y + toRect.height * 0.72;

            drawPouringStream(
              ctx,
              mouthX,
              mouthY,
              destX,
              destY,
              colorDef.primary,
              colorDef.highlight,
              waveTime
            );

            // Spawn subtle splash droplets inside target bottle
            if (Math.random() < 0.45) {
              particlesRef.current.push({
                x: destX + (Math.random() - 0.5) * 10,
                y: toRect.y + toRect.height * 0.35,
                vx: (Math.random() - 0.5) * 45,
                vy: -25 - Math.random() * 45,
                radius: 2 + Math.random() * 2,
                color: colorDef.highlight,
                alpha: 0.85,
                life: 0,
                maxLife: 0.28,
              });
            }
          }

          drawSingleGlassBottle(ctx, {
            bottle: { ...beforeSource, layers: keptLayers },
            x: currentX,
            y: currentY,
            width: fromRect.width,
            height: fromRect.height,
            isSelected: true,
            isValidTarget: false,
            tiltRadians: tiltAngle,
            waveTime,
            extraTopColor: activePour.color,
            extraTopLayers: remainingRemovedLayers,
          });
        }

        if (pourProgress >= 1) {
          finishPour(activePour);
        }
      }

      // 5. Update and draw droplet & celebration particles
      updateAndDrawParticles(ctx, particlesRef.current, dt);

      ctx.restore();
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getBottleAtClientPoint = (clientX: number, clientY: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    const x = clientX - bounds.left;
    const y = clientY - bounds.top;

    for (const r of bottleRectsRef.current) {
      const pad = 8;
      if (
        x >= r.x - pad &&
        x <= r.x + r.width + pad &&
        y >= r.y - 28 &&
        y <= r.y + r.height + pad
      ) {
        return r.index;
      }
    }
    return null;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const idx = getBottleAtClientPoint(e.clientX, e.clientY);
    hoveredIndexRef.current = idx;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const idx = getBottleAtClientPoint(e.clientX, e.clientY);
    if (idx !== null) {
      stateRef.current.onBottleSelect(idx);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        hoveredIndexRef.current = null;
      }}
      onPointerDown={handlePointerDown}
      className="w-full h-full block cursor-pointer touch-manipulation"
    />
  );
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function computeBottleLayout(
  count: number,
  width: number,
  height: number
): BottleRect[] {
  if (count === 0) return [];

  // Reserve safe top & bottom perimeter space for the low-occlusion HUD
  const safeTop = Math.max(76, height * 0.13);
  const safeBottom = Math.max(84, height * 0.14);
  const playHeight = Math.max(180, height - safeTop - safeBottom);
  const playWidth = Math.max(260, width - 48);

  const rowCount = count <= 5 ? 1 : 2;
  const topRowCount = rowCount === 1 ? count : Math.ceil(count / 2);
  const bottomRowCount = rowCount === 1 ? 0 : count - topRowCount;
  const maxCols = Math.max(topRowCount, bottomRowCount, 1);

  const maxBottleHeightByRow =
    rowCount === 1 ? playHeight * 0.64 : playHeight * 0.42;
  const maxBottleWidthByCol = (playWidth / maxCols) * 0.64;

  const bottleWidth = Math.max(
    46,
    Math.min(86, maxBottleWidthByCol, maxBottleHeightByRow * 0.41)
  );
  const bottleHeight = bottleWidth * 2.42;
  const gapX = Math.max(16, Math.min(42, bottleWidth * 0.42));
  const gapY = Math.max(34, Math.min(64, playHeight * 0.1));

  const rects: BottleRect[] = [];

  if (rowCount === 1) {
    const totalRowWidth = count * bottleWidth + (count - 1) * gapX;
    const startX = (width - totalRowWidth) * 0.5;
    const startY = safeTop + (playHeight - bottleHeight) * 0.52;

    for (let i = 0; i < count; i++) {
      rects.push({
        index: i,
        x: startX + i * (bottleWidth + gapX),
        y: startY,
        width: bottleWidth,
        height: bottleHeight,
      });
    }
  } else {
    const totalBlockHeight = bottleHeight * 2 + gapY;
    const topY = safeTop + (playHeight - totalBlockHeight) * 0.52;
    const bottomY = topY + bottleHeight + gapY;

    const topRowWidth = topRowCount * bottleWidth + (topRowCount - 1) * gapX;
    const topStartX = (width - topRowWidth) * 0.5;

    for (let i = 0; i < topRowCount; i++) {
      rects.push({
        index: i,
        x: topStartX + i * (bottleWidth + gapX),
        y: topY,
        width: bottleWidth,
        height: bottleHeight,
      });
    }

    const bottomRowWidth =
      bottomRowCount * bottleWidth + (bottomRowCount - 1) * gapX;
    const bottomStartX = (width - bottomRowWidth) * 0.5;

    for (let i = 0; i < bottomRowCount; i++) {
      const idx = topRowCount + i;
      rects.push({
        index: idx,
        x: bottomStartX + i * (bottleWidth + gapX),
        y: bottomY,
        width: bottleWidth,
        height: bottleHeight,
      });
    }
  }

  return rects;
}

function drawAquaticBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  waveTime: number,
  bubbles: BubbleParticle[],
  dt: number
) {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#061120');
  bgGrad.addColorStop(0.5, '#0B213D');
  bgGrad.addColorStop(1, '#071528');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial caustic glow in center
  const centerGlow = ctx.createRadialGradient(
    width * 0.5,
    height * 0.48,
    20,
    width * 0.5,
    height * 0.48,
    Math.max(width, height) * 0.55
  );
  centerGlow.addColorStop(0, 'rgba(14, 165, 233, 0.11)');
  centerGlow.addColorStop(0.6, 'rgba(6, 182, 212, 0.04)');
  centerGlow.addColorStop(1, 'rgba(7, 19, 36, 0)');
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 0, width, height);

  // Soft bottom water waves
  for (let wIdx = 0; wIdx < 2; wIdx++) {
    ctx.beginPath();
    const baseY = height * (0.85 + wIdx * 0.05);
    ctx.moveTo(0, height);
    ctx.lineTo(0, baseY);
    const steps = 32;
    for (let s = 0; s <= steps; s++) {
      const x = (s / steps) * width;
      const y =
        baseY +
        Math.sin(waveTime * 0.55 + s * 0.35 + wIdx * 1.4) * (12 + wIdx * 4);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle =
      wIdx === 0 ? 'rgba(14, 165, 233, 0.06)' : 'rgba(6, 182, 212, 0.08)';
    ctx.fill();
  }

  // Rising ambient water bubbles
  for (const b of bubbles) {
    b.y -= b.speedY * dt;
    if (b.y < -0.05) {
      b.y = 1.05;
      b.x = Math.random();
    }
    const bx =
      b.x * width + Math.sin(waveTime * 0.7 + b.wobbleOffset) * 14;
    const by = b.y * height;

    ctx.beginPath();
    ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(186, 230, 253, ${b.alpha})`;
    ctx.fill();
  }
}

function buildContouredBottlePath(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const neckTopY = h * 0.08;
  const shoulderStartY = h * 0.19;
  const bodyStartY = h * 0.27;
  const bottomY = h * 0.94;

  const bodyLeft = w * 0.14;
  const bodyRight = w * 0.86;
  const bodyWidth = bodyRight - bodyLeft;

  const neckLeft = w * 0.26;
  const neckRight = w * 0.74;

  const bottomRadius = bodyWidth * 0.46;

  ctx.beginPath();
  ctx.moveTo(neckLeft, neckTopY);
  ctx.lineTo(neckRight, neckTopY);
  ctx.lineTo(neckRight, shoulderStartY);
  ctx.bezierCurveTo(
    neckRight,
    shoulderStartY + (bodyStartY - shoulderStartY) * 0.45,
    bodyRight,
    shoulderStartY + (bodyStartY - shoulderStartY) * 0.45,
    bodyRight,
    bodyStartY
  );
  ctx.lineTo(bodyRight, bottomY - bottomRadius);
  ctx.arc(
    bodyRight - bottomRadius,
    bottomY - bottomRadius,
    bottomRadius,
    0,
    Math.PI * 0.5
  );
  ctx.lineTo(bodyLeft + bottomRadius, bottomY);
  ctx.arc(
    bodyLeft + bottomRadius,
    bottomY - bottomRadius,
    bottomRadius,
    Math.PI * 0.5,
    Math.PI
  );
  ctx.lineTo(bodyLeft, bodyStartY);
  ctx.bezierCurveTo(
    bodyLeft,
    shoulderStartY + (bodyStartY - shoulderStartY) * 0.45,
    neckLeft,
    shoulderStartY + (bodyStartY - shoulderStartY) * 0.45,
    neckLeft,
    shoulderStartY
  );
  ctx.closePath();
}

interface DrawBottleOptions {
  bottle: BottleData;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isValidTarget: boolean;
  tiltRadians: number;
  waveTime: number;
  extraTopColor: WaterColorId | null;
  extraTopLayers: number;
  keyLabel?: string;
}

function drawSingleGlassBottle(
  ctx: CanvasRenderingContext2D,
  opts: DrawBottleOptions
) {
  const {
    bottle,
    x,
    y,
    width: w,
    height: h,
    isSelected,
    isValidTarget,
    tiltRadians,
    waveTime,
    extraTopColor,
    extraTopLayers,
    keyLabel,
  } = opts;

  const isCompleted =
    extraTopLayers === 0 && isBottleCompletedUniform(bottle);

  ctx.save();
  ctx.translate(x + w * 0.5, y + h * 0.5);
  if (tiltRadians !== 0) {
    ctx.rotate(tiltRadians);
  }
  ctx.translate(-w * 0.5, -h * 0.5);

  const neckTopY = h * 0.08;
  const bodyStartY = h * 0.27;
  const bottomY = h * 0.94;
  const bodyLeft = w * 0.14;
  const bodyRight = w * 0.86;
  const bodyWidth = bodyRight - bodyLeft;
  const neckLeft = w * 0.26;
  const neckRight = w * 0.74;
  const lipLeft = w * 0.21;
  const lipRight = w * 0.79;

  // Soft shadow / selection aura beneath bottle
  if (isSelected || isValidTarget || isCompleted) {
    const auraGrad = ctx.createRadialGradient(
      w * 0.5,
      h * 0.55,
      w * 0.1,
      w * 0.5,
      h * 0.55,
      w * 0.75
    );
    if (isCompleted) {
      auraGrad.addColorStop(0, 'rgba(16, 185, 129, 0.26)');
    } else if (isSelected) {
      auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
    } else {
      auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
    }
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(-w * 0.25, -h * 0.1, w * 1.5, h * 1.2);
  }

  // 1. Frosted glass background fill
  buildContouredBottlePath(ctx, w, h);
  const glassGrad = ctx.createLinearGradient(bodyLeft, 0, bodyRight, 0);
  glassGrad.addColorStop(0, 'rgba(224, 242, 254, 0.16)');
  glassGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.06)');
  glassGrad.addColorStop(1, 'rgba(186, 230, 253, 0.15)');
  ctx.fillStyle = glassGrad;
  ctx.fill();

  // 2. Clip to interior of bottle to draw colored water layers & glass specular reflections
  ctx.save();
  buildContouredBottlePath(ctx, w, h);
  ctx.clip();

  const liquidTopLimit = bodyStartY + (bottomY - bodyStartY) * 0.04;
  const liquidTotalHeight = bottomY - liquidTopLimit;
  const layerHeight = liquidTotalHeight / bottle.capacity;

  // Build effective layer segments (including fractional animated pour layer if present)
  const segments: { colorId: WaterColorId; heightUnits: number }[] =
    bottle.layers.map((c) => ({ colorId: c, heightUnits: 1 }));
  if (extraTopColor && extraTopLayers > 0.001) {
    segments.push({ colorId: extraTopColor, heightUnits: extraTopLayers });
  }

  let currentBottomY = bottomY;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const colorDef = WATER_COLORS[seg.colorId];
    const segPixelHeight = seg.heightUnits * layerHeight;
    const layerTop = currentBottomY - segPixelHeight;
    const isTopMost = i === segments.length - 1;

    const liqGrad = ctx.createLinearGradient(0, layerTop, 0, currentBottomY);
    liqGrad.addColorStop(0, colorDef.highlight);
    liqGrad.addColorStop(0.35, colorDef.primary);
    liqGrad.addColorStop(1, colorDef.deep);
    ctx.fillStyle = liqGrad;

    if (isTopMost) {
      const waveAmp = isSelected || extraTopLayers > 0 ? 3.5 : 1.8;
      ctx.beginPath();
      ctx.moveTo(bodyLeft - 4, currentBottomY + 3);
      ctx.lineTo(bodyLeft - 4, layerTop);
      const waveSteps = 16;
      for (let s = 0; s <= waveSteps; s++) {
        const wx = bodyLeft + (s / waveSteps) * bodyWidth;
        const wy =
          layerTop +
          Math.sin(waveTime + (s / waveSteps) * Math.PI * 2) * waveAmp;
        ctx.lineTo(wx, wy);
      }
      ctx.lineTo(bodyRight + 4, currentBottomY + 3);
      ctx.closePath();
      ctx.fill();

      // Surface meniscus highlight ellipse
      ctx.beginPath();
      ctx.ellipse(
        w * 0.5,
        layerTop,
        bodyWidth * 0.42,
        2.6,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fill();
    } else {
      ctx.fillRect(bodyLeft - 2, layerTop - 1, bodyWidth + 4, segPixelHeight + 2.5);

      const nextSeg = segments[i + 1];
      if (nextSeg && nextSeg.colorId !== seg.colorId) {
        ctx.beginPath();
        ctx.moveTo(bodyLeft, layerTop);
        ctx.lineTo(bodyRight, layerTop);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    currentBottomY = layerTop;
  }

  // Left vertical curved glass reflection strip
  const specGrad = ctx.createLinearGradient(
    0,
    bodyStartY,
    0,
    bottomY - bodyWidth * 0.35
  );
  specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.44)');
  specGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.16)');
  specGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.roundRect(
    bodyLeft + bodyWidth * 0.09,
    bodyStartY + 8,
    bodyWidth * 0.1,
    (bottomY - bodyStartY) * 0.74,
    6
  );
  ctx.fill();

  // Right subtle glass rim highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.beginPath();
  ctx.roundRect(
    bodyRight - bodyWidth * 0.14,
    bodyStartY + 18,
    bodyWidth * 0.055,
    (bottomY - bodyStartY) * 0.62,
    4
  );
  ctx.fill();

  ctx.restore();

  // 3. Outer glass bottle contour stroke
  buildContouredBottlePath(ctx, w, h);
  ctx.strokeStyle = isCompleted
    ? '#34D399'
    : isSelected
    ? '#38BDF8'
    : isValidTarget
    ? '#7DD3FC'
    : 'rgba(186, 230, 253, 0.78)';
  ctx.lineWidth = isSelected || isCompleted ? 3.2 : 2.3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  // 4. Flared glass lip at top of neck
  const lipGrad = ctx.createLinearGradient(lipLeft, 0, lipRight, 0);
  lipGrad.addColorStop(0, 'rgba(186, 230, 253, 0.85)');
  lipGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.96)');
  lipGrad.addColorStop(1, 'rgba(186, 230, 253, 0.85)');
  ctx.fillStyle = lipGrad;
  ctx.beginPath();
  ctx.roundRect(lipLeft, neckTopY - 3.5, lipRight - lipLeft, 7, 4);
  ctx.fill();

  // 5. Golden cork seal when bottle is completed with 4 matching layers
  if (isCompleted) {
    const corkW = (neckRight - neckLeft) * 0.82;
    const corkX = (w - corkW) * 0.5;
    const corkGrad = ctx.createLinearGradient(0, neckTopY - 10, 0, neckTopY + 5);
    corkGrad.addColorStop(0, '#FBBF24');
    corkGrad.addColorStop(1, '#D97706');
    ctx.fillStyle = corkGrad;
    ctx.beginPath();
    ctx.roundRect(corkX, neckTopY - 9, corkW, 13, 3.5);
    ctx.fill();
  }

  ctx.restore();

  // 6. Subtle keyboard shortcut number below bottle
  if (keyLabel && tiltRadians === 0) {
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSelected
      ? '#38BDF8'
      : 'rgba(148, 163, 184, 0.55)';
    ctx.fillText(keyLabel, x + w * 0.5, y + h + 14);
    ctx.restore();
  }
}

function drawPouringStream(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  primaryColor: string,
  highlightColor: string,
  waveTime: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  const cpX = endX + Math.sin(waveTime * 2) * 3;
  const cpY = startY + (endY - startY) * 0.32;
  ctx.quadraticCurveTo(cpX, cpY, endX, endY);

  const streamGrad = ctx.createLinearGradient(startX, startY, endX, endY);
  streamGrad.addColorStop(0, highlightColor);
  streamGrad.addColorStop(0.5, primaryColor);
  streamGrad.addColorStop(1, highlightColor);

  ctx.strokeStyle = streamGrad;
  ctx.lineWidth = 7.5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Inner specular filament
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(cpX, cpY, endX, endY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.restore();
}

function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: DropletParticle[],
  dt: number
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }

    p.vy += 340 * dt; // Gravity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
