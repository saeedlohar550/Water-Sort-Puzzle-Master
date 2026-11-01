export type WaterColorId =
  | 'CORAL_RED'
  | 'OCEAN_BLUE'
  | 'EMERALD_GREEN'
  | 'SUNSET_AMBER'
  | 'ROYAL_VIOLET'
  | 'TROPICAL_CYAN'
  | 'MAGENTA_PINK'
  | 'LIME_ZEST'
  | 'TANGERINE_ORANGE';

export interface WaterColorDef {
  id: WaterColorId;
  displayName: string;
  primary: string;
  highlight: string;
  deep: string;
  glow: string;
}

export interface BottleData {
  id: number;
  layers: WaterColorId[];
  capacity: number;
}

export interface MoveRecord {
  fromBottleIndex: number;
  toBottleIndex: number;
  color: WaterColorId;
  layersMoved: number;
}

export interface PourAnimationState {
  fromIndex: number;
  toIndex: number;
  color: WaterColorId;
  layersCount: number;
  progress: number; // 0 to 1
  durationMs: number;
  startTime: number;
  beforeBottles: BottleData[];
  afterBottles: BottleData[];
  moveRecord: MoveRecord;
}

export interface DropletParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export type GameScreenState = 'INTRO' | 'PLAYING' | 'PAUSED' | 'VICTORY';
