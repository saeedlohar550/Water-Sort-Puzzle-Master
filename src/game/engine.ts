import { BottleData, MoveRecord, WaterColorDef, WaterColorId } from './types';

export const WATER_COLORS: Record<WaterColorId, WaterColorDef> = {
  CORAL_RED: {
    id: 'CORAL_RED',
    displayName: 'Coral Red',
    primary: '#F43F5E',
    highlight: '#FB7185',
    deep: '#BE123C',
    glow: 'rgba(244, 63, 94, 0.45)',
  },
  OCEAN_BLUE: {
    id: 'OCEAN_BLUE',
    displayName: 'Ocean Blue',
    primary: '#0EA5E9',
    highlight: '#38BDF8',
    deep: '#0369A1',
    glow: 'rgba(14, 165, 233, 0.45)',
  },
  EMERALD_GREEN: {
    id: 'EMERALD_GREEN',
    displayName: 'Emerald Green',
    primary: '#10B981',
    highlight: '#34D399',
    deep: '#047857',
    glow: 'rgba(16, 185, 129, 0.45)',
  },
  SUNSET_AMBER: {
    id: 'SUNSET_AMBER',
    displayName: 'Sunset Amber',
    primary: '#F59E0B',
    highlight: '#FBBF24',
    deep: '#B45309',
    glow: 'rgba(245, 158, 11, 0.45)',
  },
  ROYAL_VIOLET: {
    id: 'ROYAL_VIOLET',
    displayName: 'Royal Violet',
    primary: '#8B5CF6',
    highlight: '#A78BFA',
    deep: '#5B21B6',
    glow: 'rgba(139, 92, 246, 0.45)',
  },
  TROPICAL_CYAN: {
    id: 'TROPICAL_CYAN',
    displayName: 'Tropical Cyan',
    primary: '#06B6D4',
    highlight: '#22D3EE',
    deep: '#0E7490',
    glow: 'rgba(6, 182, 212, 0.45)',
  },
  MAGENTA_PINK: {
    id: 'MAGENTA_PINK',
    displayName: 'Magenta Pink',
    primary: '#EC4899',
    highlight: '#F472B6',
    deep: '#9D174D',
    glow: 'rgba(236, 72, 153, 0.45)',
  },
  LIME_ZEST: {
    id: 'LIME_ZEST',
    displayName: 'Lime Zest',
    primary: '#84CC16',
    highlight: '#A3E635',
    deep: '#4D7C0F',
    glow: 'rgba(132, 204, 22, 0.45)',
  },
  TANGERINE_ORANGE: {
    id: 'TANGERINE_ORANGE',
    displayName: 'Tangerine',
    primary: '#F97316',
    highlight: '#FB923C',
    deep: '#C2410C',
    glow: 'rgba(249, 115, 22, 0.45)',
  },
};

export const ORDERED_COLOR_IDS: WaterColorId[] = [
  'CORAL_RED',
  'OCEAN_BLUE',
  'EMERALD_GREEN',
  'SUNSET_AMBER',
  'ROYAL_VIOLET',
  'TROPICAL_CYAN',
  'MAGENTA_PINK',
  'LIME_ZEST',
  'TANGERINE_ORANGE',
];

export const DEFAULT_CAPACITY = 4;

export function getTopColor(bottle: BottleData): WaterColorId | null {
  return bottle.layers.length > 0 ? bottle.layers[bottle.layers.length - 1] : null;
}

export function getTopSameColorCount(bottle: BottleData): number {
  const top = getTopColor(bottle);
  if (!top) return 0;
  let count = 0;
  for (let i = bottle.layers.length - 1; i >= 0; i--) {
    if (bottle.layers[i] === top) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export function isBottleCompletedUniform(bottle: BottleData): boolean {
  return (
    bottle.layers.length === bottle.capacity &&
    getTopSameColorCount(bottle) === bottle.capacity
  );
}

export function isBottleSolvedOrEmpty(bottle: BottleData): boolean {
  return bottle.layers.length === 0 || isBottleCompletedUniform(bottle);
}

export function canPour(source: BottleData, target: BottleData): boolean {
  if (source.id === target.id) return false;
  if (source.layers.length === 0) return false;
  if (target.layers.length >= target.capacity) return false;

  const sourceTop = getTopColor(source);
  if (!sourceTop) return false;

  const targetTop = getTopColor(target);
  if (!targetTop) return true; // Empty bottle accepts any water color
  return sourceTop === targetTop;
}

export function calculatePourCount(source: BottleData, target: BottleData): number {
  if (!canPour(source, target)) return 0;
  const topCount = getTopSameColorCount(source);
  const freeSpace = Math.max(0, target.capacity - target.layers.length);
  return Math.min(topCount, freeSpace);
}

export function performPour(
  bottles: BottleData[],
  fromIndex: number,
  toIndex: number
): { bottles: BottleData[]; move: MoveRecord } | null {
  if (
    fromIndex < 0 ||
    fromIndex >= bottles.length ||
    toIndex < 0 ||
    toIndex >= bottles.length
  ) {
    return null;
  }

  const source = bottles[fromIndex];
  const target = bottles[toIndex];
  const count = calculatePourCount(source, target);
  if (count <= 0) return null;

  const color = getTopColor(source);
  if (!color) return null;

  const updatedSourceLayers = source.layers.slice(0, source.layers.length - count);
  const addedLayers = Array.from({ length: count }, () => color);
  const updatedTargetLayers = [...target.layers, ...addedLayers];

  const updatedBottles = bottles.map((b, idx) => {
    if (idx === fromIndex) return { ...b, layers: updatedSourceLayers };
    if (idx === toIndex) return { ...b, layers: updatedTargetLayers };
    return { ...b, layers: [...b.layers] };
  });

  return {
    bottles: updatedBottles,
    move: {
      fromBottleIndex: fromIndex,
      toBottleIndex: toIndex,
      color,
      layersMoved: count,
    },
  };
}

export function undoMove(bottles: BottleData[], move: MoveRecord): BottleData[] {
  const { fromBottleIndex, toBottleIndex, color, layersMoved } = move;
  if (
    fromBottleIndex < 0 ||
    fromBottleIndex >= bottles.length ||
    toBottleIndex < 0 ||
    toBottleIndex >= bottles.length
  ) {
    return bottles;
  }

  const currentTarget = bottles[toBottleIndex];
  const currentSource = bottles[fromBottleIndex];
  const layersToRestore = Math.min(layersMoved, currentTarget.layers.length);

  const restoredTargetLayers = currentTarget.layers.slice(
    0,
    currentTarget.layers.length - layersToRestore
  );
  const restoredSourceLayers = [
    ...currentSource.layers,
    ...Array.from({ length: layersToRestore }, () => color),
  ];

  return bottles.map((b, idx) => {
    if (idx === fromBottleIndex) return { ...b, layers: restoredSourceLayers };
    if (idx === toBottleIndex) return { ...b, layers: restoredTargetLayers };
    return { ...b, layers: [...b.layers] };
  });
}

export function isLevelCompleted(bottles: BottleData[]): boolean {
  return bottles.length > 0 && bottles.every(isBottleSolvedOrEmpty);
}

/**
 * Deterministic PRNG so each level number generates the exact same puzzle layout.
 */
function createSeededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateLevel(levelNumber: number): BottleData[] {
  const safeLevel = Math.max(1, Math.floor(levelNumber));

  // Hand-crafted introductory levels matching the Kotlin LevelGenerator
  if (safeLevel === 1) {
    return [
      {
        id: 0,
        capacity: DEFAULT_CAPACITY,
        layers: ['OCEAN_BLUE', 'OCEAN_BLUE', 'CORAL_RED', 'CORAL_RED'],
      },
      {
        id: 1,
        capacity: DEFAULT_CAPACITY,
        layers: ['CORAL_RED', 'CORAL_RED', 'OCEAN_BLUE', 'OCEAN_BLUE'],
      },
      {
        id: 2,
        capacity: DEFAULT_CAPACITY,
        layers: [],
      },
    ];
  }

  if (safeLevel === 2) {
    return [
      {
        id: 0,
        capacity: DEFAULT_CAPACITY,
        layers: ['CORAL_RED', 'OCEAN_BLUE', 'EMERALD_GREEN', 'CORAL_RED'],
      },
      {
        id: 1,
        capacity: DEFAULT_CAPACITY,
        layers: ['OCEAN_BLUE', 'EMERALD_GREEN', 'CORAL_RED', 'OCEAN_BLUE'],
      },
      {
        id: 2,
        capacity: DEFAULT_CAPACITY,
        layers: ['EMERALD_GREEN', 'CORAL_RED', 'OCEAN_BLUE', 'EMERALD_GREEN'],
      },
      {
        id: 3,
        capacity: DEFAULT_CAPACITY,
        layers: [],
      },
      {
        id: 4,
        capacity: DEFAULT_CAPACITY,
        layers: [],
      },
    ];
  }

  let activeColorCount = 4;
  if (safeLevel <= 4) activeColorCount = 4;
  else if (safeLevel <= 7) activeColorCount = 5;
  else if (safeLevel <= 11) activeColorCount = 6;
  else if (safeLevel <= 16) activeColorCount = 7;
  else if (safeLevel <= 22) activeColorCount = 8;
  else activeColorCount = 9;

  activeColorCount = Math.min(activeColorCount, ORDERED_COLOR_IDS.length);
  const emptyBottleCount = 2;
  const selectedColors = ORDERED_COLOR_IDS.slice(0, activeColorCount);
  const rng = createSeededRandom(safeLevel * 7919 + 104729);

  const pool: WaterColorId[] = [];
  for (const color of selectedColors) {
    for (let i = 0; i < DEFAULT_CAPACITY; i++) {
      pool.push(color);
    }
  }

  // Fisher-Yates shuffle with seeded PRNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  // Ensure no bottle starts already solved with 4 identical layers
  for (let bIdx = 0; bIdx < activeColorCount; bIdx++) {
    const start = bIdx * DEFAULT_CAPACITY;
    const first = pool[start];
    const allSame =
      pool[start + 1] === first &&
      pool[start + 2] === first &&
      pool[start + 3] === first;
    if (allSame) {
      const nextStart = ((bIdx + 1) % activeColorCount) * DEFAULT_CAPACITY;
      const temp = pool[start + DEFAULT_CAPACITY - 1];
      pool[start + DEFAULT_CAPACITY - 1] = pool[nextStart];
      pool[nextStart] = temp;
    }
  }

  const bottles: BottleData[] = [];
  for (let i = 0; i < activeColorCount; i++) {
    bottles.push({
      id: i,
      capacity: DEFAULT_CAPACITY,
      layers: pool.slice(i * DEFAULT_CAPACITY, (i + 1) * DEFAULT_CAPACITY),
    });
  }

  for (let i = 0; i < emptyBottleCount; i++) {
    bottles.push({
      id: activeColorCount + i,
      capacity: DEFAULT_CAPACITY,
      layers: [],
    });
  }

  return bottles;
}
