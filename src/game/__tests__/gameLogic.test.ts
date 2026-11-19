import { describe, expect, it } from 'vitest';
import {
  applyLevelUps,
  BOSS_ARENA_CENTER_X,
  BOSS_ARENA_CENTER_Z,
  BOSS_ARENA_LOCK_RADIUS,
  BOSS_GATE_Z,
  detectTouchCapableDevice,
  isBlockedByWorldBarrier,
  SANCTUARY_BARRIER_X,
  SANCTUARY_BARRIER_Z,
} from '../gameLogic';

describe('gameLogic — BUG-01 Boss Gate & Colosseum Barrier', () => {
  const lockedWorld = { bossGateOpen: false, sanctuaryBarrierBroken: false };
  const unlockedBossWorld = { bossGateOpen: true, sanctuaryBarrierBroken: false };

  it('blocks direct entry through the south boss gate when sealed', () => {
    expect(isBlockedByWorldBarrier(0, BOSS_GATE_Z, lockedWorld)).toBe('boss');
    expect(isBlockedByWorldBarrier(4.8, -59.5, lockedWorld)).toBe('boss');
  });

  it('blocks lateral bypass attempts around the colosseum perimeter (BUG-01 regression)', () => {
    expect(isBlockedByWorldBarrier(6, -65, lockedWorld)).toBe('boss');
    expect(isBlockedByWorldBarrier(-6, -65, lockedWorld)).toBe('boss');
    expect(isBlockedByWorldBarrier(19, -82, lockedWorld)).toBe('boss');
    expect(isBlockedByWorldBarrier(-19, -82, lockedWorld)).toBe('boss');
    expect(isBlockedByWorldBarrier(0, -101, lockedWorld)).toBe('boss');
    expect(isBlockedByWorldBarrier(BOSS_ARENA_CENTER_X, BOSS_ARENA_CENTER_Z, lockedWorld)).toBe('boss');
  });

  it('keeps the boss seal pedestal at (0, -56) reachable while locked', () => {
    expect(isBlockedByWorldBarrier(0, -56, lockedWorld)).toBeNull();
    expect(isBlockedByWorldBarrier(0, -57.2, lockedWorld)).toBeNull();
    expect(isBlockedByWorldBarrier(0, -62, lockedWorld)).toBe('boss');
    expect(isBlockedByWorldBarrier(0, BOSS_ARENA_CENTER_Z - BOSS_ARENA_LOCK_RADIUS - 1, lockedWorld)).toBeNull();
  });

  it('allows full entry into the colosseum once bossGateOpen is true', () => {
    expect(isBlockedByWorldBarrier(0, BOSS_GATE_Z, unlockedBossWorld)).toBeNull();
    expect(isBlockedByWorldBarrier(6, -65, unlockedBossWorld)).toBeNull();
    expect(isBlockedByWorldBarrier(0, BOSS_ARENA_CENTER_Z, unlockedBossWorld)).toBeNull();
  });

  it('enforces and opens the Secret Sanctuary crystal bramble barrier', () => {
    expect(isBlockedByWorldBarrier(SANCTUARY_BARRIER_X, SANCTUARY_BARRIER_Z, lockedWorld)).toBe('sanctuary');
    expect(
      isBlockedByWorldBarrier(SANCTUARY_BARRIER_X, SANCTUARY_BARRIER_Z, {
        bossGateOpen: false,
        sanctuaryBarrierBroken: true,
      })
    ).toBeNull();
  });
});

describe('gameLogic — BUG-10 Multi-Level Progression & Cap', () => {
  it('handles multi-level XP bursts in a single call', () => {
    // Level 1 needs 120 XP, Level 2 needs 240 XP -> 400 XP gains 2 levels (40 XP leftover)
    const res = applyLevelUps(400, 1, 100, 50, 100, 40);
    expect(res.levelsGained).toBe(2);
    expect(res.level).toBe(3);
    expect(res.xp).toBe(40);
    expect(res.maxHp).toBe(130);
    expect(res.hp).toBe(130);
    expect(res.maxChaosEnergy).toBe(120);
    expect(res.chaosEnergy).toBe(120);
  });

  it('does not advance level when XP is below threshold', () => {
    const res = applyLevelUps(119, 1, 100, 80, 100, 90);
    expect(res.levelsGained).toBe(0);
    expect(res.level).toBe(1);
    expect(res.hp).toBe(80);
    expect(res.chaosEnergy).toBe(90);
  });

  it('caps level at 99 and stats at 1000 matching firestore.rules', () => {
    const res = applyLevelUps(999999, 98, 995, 100, 995, 50);
    expect(res.level).toBe(99);
    expect(res.maxHp).toBe(1000);
    expect(res.maxChaosEnergy).toBe(1000);
  });
});

describe('gameLogic — BUG-08 Touch Detection', () => {
  it('returns false safely in non-touch Node/headless environment', () => {
    expect(detectTouchCapableDevice()).toBe(false);
  });
});
