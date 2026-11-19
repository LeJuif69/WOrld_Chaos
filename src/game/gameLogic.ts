import { SaveDataV1 } from './types';

export type BarrierHit = 'boss' | 'sanctuary' | null;

export const BOSS_ARENA_CENTER_X = 0;
export const BOSS_ARENA_CENTER_Z = -82;
export const BOSS_ARENA_LOCK_RADIUS = 21.5;
export const BOSS_GATE_Z = -59;
export const BOSS_GATE_HALF_WIDTH = 5.2;
export const BOSS_GATE_HALF_DEPTH = 1.35;

export const SANCTUARY_BARRIER_X = -50;
export const SANCTUARY_BARRIER_Z = -44;
export const SANCTUARY_BARRIER_RADIUS = 3.6;

/**
 * Pure barrier collision check enforcing both the south boss gate and the
 * circular colosseum perimeter so players cannot bypass the sealed arena laterally.
 */
export function isBlockedByWorldBarrier(
  nextX: number,
  nextZ: number,
  worldState: Pick<SaveDataV1['worldState'], 'bossGateOpen' | 'sanctuaryBarrierBroken'>
): BarrierHit {
  if (!worldState.bossGateOpen) {
    if (
      Math.abs(nextX - BOSS_ARENA_CENTER_X) < BOSS_GATE_HALF_WIDTH &&
      Math.abs(nextZ - BOSS_GATE_Z) < BOSS_GATE_HALF_DEPTH
    ) {
      return 'boss';
    }
    if (Math.hypot(nextX - BOSS_ARENA_CENTER_X, nextZ - BOSS_ARENA_CENTER_Z) < BOSS_ARENA_LOCK_RADIUS) {
      return 'boss';
    }
  }
  if (
    !worldState.sanctuaryBarrierBroken &&
    Math.hypot(nextX - SANCTUARY_BARRIER_X, nextZ - SANCTUARY_BARRIER_Z) < SANCTUARY_BARRIER_RADIUS
  ) {
    return 'sanctuary';
  }
  return null;
}

export interface LevelUpResult {
  xp: number;
  level: number;
  maxHp: number;
  hp: number;
  maxChaosEnergy: number;
  chaosEnergy: number;
  levelsGained: number;
}

/**
 * Resolves multi-level XP thresholds up to the Firestore rule cap (level 99).
 */
export function applyLevelUps(
  xp: number,
  level: number,
  maxHp: number,
  hp: number,
  maxChaosEnergy: number,
  chaosEnergy: number
): LevelUpResult {
  let curXp = xp;
  let curLevel = level;
  let curMaxHp = maxHp;
  let curHp = hp;
  let curMaxEn = maxChaosEnergy;
  let curEn = chaosEnergy;
  let levelsGained = 0;

  while (curLevel < 99 && curXp >= curLevel * 120) {
    curXp -= curLevel * 120;
    curLevel += 1;
    curMaxHp = Math.min(1000, curMaxHp + 15);
    curHp = curMaxHp;
    curMaxEn = Math.min(1000, curMaxEn + 10);
    curEn = curMaxEn;
    levelsGained += 1;
  }

  return {
    xp: curXp,
    level: curLevel,
    maxHp: curMaxHp,
    hp: curHp,
    maxChaosEnergy: curMaxEn,
    chaosEnergy: curEn,
    levelsGained,
  };
}

export function detectTouchCapableDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const touchPoints = typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0;
  return coarsePointer || touchPoints;
}
