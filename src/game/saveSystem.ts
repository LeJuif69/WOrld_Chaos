import { GameSettings, QuestProgress, SaveDataV1 } from './types';
import { QUESTS } from './worldData';

const SAVE_KEY = 'world_chaos_save_v1';
const SETTINGS_KEY = 'world_chaos_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'MEDIUM',
  masterVolume: 0.75,
  musicVolume: 0.55,
  sfxVolume: 0.85,
  ambienceVolume: 0.6,
  cameraSensitivity: 1.0,
  invertY: false,
  cameraDistance: 8.5,
  showTouchControls: true,
};

export function createInitialQuests(): Record<string, QuestProgress> {
  const quests: Record<string, QuestProgress> = {};
  for (const q of QUESTS) {
    const counts: Record<string, number> = {};
    for (const obj of q.objectives) counts[obj.id] = 0;
    quests[q.id] = {
      questId: q.id,
      status: q.id === 'mq_1_camp' ? 'active' : 'locked',
      objectiveCounts: counts,
    };
  }
  return quests;
}

export function createNewSaveData(): SaveDataV1 {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    playTimeSeconds: 0,
    playerPosition: [0, 1.5, 84],
    playerYaw: Math.PI,
    hp: 100,
    maxHp: 100,
    chaosEnergy: 100,
    maxChaosEnergy: 100,
    xp: 0,
    level: 1,
    inventory: [
      { itemId: 'vitality_fruit', quantity: 2 },
      { itemId: 'aether_tonic', quantity: 1 },
    ],
    quests: createInitialQuests(),
    worldState: {
      discoveredZones: ['arrival'],
      activatedInteractables: [],
      solvedPuzzles: [],
      unlockedAbilities: ['shockwave'],
      defeatedEnemies: [],
      bossDefeated: false,
      chaosCoreObtained: false,
      bridgeLowered: false,
      templeGateOpen: false,
      bossGateOpen: false,
      sanctuaryBarrierBroken: false,
      talkedNpcs: [],
      puzzleHintsUnlocked: {},
    },
    enemiesDefeatedCount: 0,
    chaosEventsSurvived: 0,
  };
}

export function saveGame(data: SaveDataV1): boolean {
  try {
    const payload: SaveDataV1 = {
      ...data,
      version: 1,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(): SaveDataV1 | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaveDataV1>;
    if (
      !parsed ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.playerPosition) ||
      parsed.playerPosition.length !== 3 ||
      typeof parsed.hp !== 'number' ||
      !parsed.worldState
    ) {
      return null;
    }
    const base = createNewSaveData();
    return {
      ...base,
      ...parsed,
      worldState: {
        ...base.worldState,
        ...parsed.worldState,
      },
      quests: {
        ...base.quests,
        ...(parsed.quests ?? {}),
      },
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : base.inventory,
    };
  } catch {
    return null;
  }
}

export function hasSavedGame(): boolean {
  return loadGame() !== null;
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore storage failures
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage failures
  }
}
