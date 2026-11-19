import { beforeEach, describe, expect, it } from 'vitest';
import { createNewSaveData, loadGame, saveGame } from '../saveSystem';
import { ABILITY_META, INTERACTABLES, ITEMS, NPCS, PUZZLES, QUESTS, ZONES } from '../worldData';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => {
      store.set(key, val);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe('worldData — World 1 Integrity', () => {
  it('contains all 10 zones, 10 quests (5 main + 5 side), 5 puzzles, 5 NPCs, 3 abilities, 10 items', () => {
    expect(ZONES).toHaveLength(10);
    expect(QUESTS).toHaveLength(10);
    expect(QUESTS.filter((q) => q.category === 'main')).toHaveLength(5);
    expect(QUESTS.filter((q) => q.category === 'side')).toHaveLength(5);
    expect(Object.keys(PUZZLES)).toHaveLength(5);
    expect(NPCS).toHaveLength(5);
    expect(Object.keys(ABILITY_META)).toHaveLength(3);
    expect(Object.keys(ITEMS)).toHaveLength(10);
    expect(INTERACTABLES.length).toBeGreaterThanOrEqual(34);
  });

  it('references valid zones and items across all quests and interactables', () => {
    const zoneIds = new Set(ZONES.map((z) => z.id));
    const itemIds = new Set(Object.keys(ITEMS));
    for (const npc of NPCS) {
      expect(zoneIds.has(npc.zoneId)).toBe(true);
    }
    for (const inter of INTERACTABLES) {
      expect(zoneIds.has(inter.zoneId)).toBe(true);
      if (inter.itemReward) {
        expect(itemIds.has(inter.itemReward.itemId)).toBe(true);
      }
    }
    for (const q of QUESTS) {
      for (const reward of q.rewardItems) {
        expect(itemIds.has(reward.itemId)).toBe(true);
      }
    }
  });
});

describe('saveSystem — Persistence & Corruption Resilience', () => {
  const mockStorage = createMemoryStorage();

  beforeEach(() => {
    mockStorage.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true,
    });
  });

  it('creates valid default save state starting in arrival with mq_1_camp active', () => {
    const data = createNewSaveData();
    expect(data.version).toBe(1);
    expect(data.hp).toBe(100);
    expect(data.worldState.discoveredZones).toEqual(['arrival']);
    expect(data.worldState.unlockedAbilities).toEqual(['shockwave']);
    expect(data.quests.mq_1_camp.status).toBe('active');
    expect(data.quests.mq_2_river_ruins.status).toBe('locked');
  });

  it('round-trips valid save data and clamps out-of-range corrupted numeric values', () => {
    const base = createNewSaveData();
    base.hp = 85;
    base.level = 4;
    base.worldState.solvedPuzzles.push('puzzle_symbols');
    expect(saveGame(base)).toBe(true);

    const loaded = loadGame();
    expect(loaded).not.toBeNull();
    expect(loaded?.hp).toBe(85);
    expect(loaded?.level).toBe(4);
    expect(loaded?.worldState.solvedPuzzles).toContain('puzzle_symbols');

    // Inject out-of-range corrupted values into localStorage
    mockStorage.setItem(
      'world_chaos_save_v1',
      JSON.stringify({
        ...base,
        hp: 99999,
        maxHp: 200,
        level: 500,
        xp: -50,
      })
    );
    const sanitized = loadGame();
    expect(sanitized).not.toBeNull();
    expect(sanitized?.maxHp).toBe(200);
    expect(sanitized?.hp).toBe(200);
    expect(sanitized?.level).toBe(99);
    expect(sanitized?.xp).toBe(0);
  });

  it('returns null safely on malformed JSON or wrong schema version', () => {
    mockStorage.setItem('world_chaos_save_v1', '{broken-json');
    expect(loadGame()).toBeNull();

    mockStorage.setItem('world_chaos_save_v1', JSON.stringify({ version: 99 }));
    expect(loadGame()).toBeNull();
  });
});
