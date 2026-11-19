import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { createNewSaveData } from './saveSystem';
import { SaveDataV1 } from './types';

export interface LeaderboardEntry {
  ownerId: string;
  displayName: string;
  level: number;
  xp: number;
  bossDefeated: boolean;
  chaosCoreObtained: boolean;
  playTimeSeconds: number;
  enemiesDefeatedCount: number;
}

const SAVE_DOC_ID = 'world_1';

function clampNum(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

function clampInt(val: number, min: number, max: number): number {
  return Math.round(clampNum(val, min, max));
}

function sanitizeDisplayName(raw: string | null | undefined): string {
  const cleaned = (raw ?? 'Explorateur').trim().slice(0, 32);
  return cleaned.length > 0 ? cleaned : 'Explorateur';
}

export function computeSaveScore(save: SaveDataV1): number {
  const completedQuests = Object.values(save.quests).filter((q) => q.status === 'completed').length;
  return (
    save.level * 10000 +
    save.xp * 10 +
    completedQuests * 500 +
    save.worldState.discoveredZones.length * 100 +
    (save.worldState.bossDefeated ? 5000 : 0) +
    (save.worldState.chaosCoreObtained ? 10000 : 0)
  );
}

export async function saveToCloud(save: SaveDataV1): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const path = `users/${user.uid}/saves/${SAVE_DOC_ID}`;

  const payload = {
    ownerId: user.uid,
    version: 1,
    savedAt: (save.savedAt || new Date().toISOString()).slice(0, 64),
    playTimeSeconds: clampNum(save.playTimeSeconds, 0, 10000000),
    playerPosition: [
      clampNum(save.playerPosition[0] ?? 0, -200, 200),
      clampNum(save.playerPosition[1] ?? 1.5, -50, 200),
      clampNum(save.playerPosition[2] ?? 84, -200, 200),
    ],
    playerYaw: clampNum(save.playerYaw, -10, 10),
    hp: clampNum(save.hp, 0, 1000),
    maxHp: clampNum(save.maxHp, 50, 1000),
    chaosEnergy: clampNum(save.chaosEnergy, 0, 1000),
    maxChaosEnergy: clampNum(save.maxChaosEnergy, 50, 1000),
    xp: clampNum(save.xp, 0, 10000000),
    level: clampInt(save.level, 1, 99),
    enemiesDefeatedCount: clampInt(save.enemiesDefeatedCount, 0, 1000000),
    chaosEventsSurvived: clampInt(save.chaosEventsSurvived, 0, 1000000),
    inventory: save.inventory.slice(0, 30).map((item) => ({
      itemId: String(item.itemId).slice(0, 48),
      quantity: clampInt(item.quantity, 1, 999),
    })),
    quests: save.quests,
    worldState: save.worldState,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', user.uid, 'saves', SAVE_DOC_ID), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadFromCloud(): Promise<SaveDataV1 | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const path = `users/${user.uid}/saves/${SAVE_DOC_ID}`;

  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'saves', SAVE_DOC_ID));
    if (!snap.exists()) return null;
    const raw = snap.data() as Partial<SaveDataV1>;
    const base = createNewSaveData();
    const maxHp = clampNum(typeof raw.maxHp === 'number' ? raw.maxHp : base.maxHp, 50, 1000);
    const maxChaosEnergy = clampNum(
      typeof raw.maxChaosEnergy === 'number' ? raw.maxChaosEnergy : base.maxChaosEnergy,
      50,
      1000
    );
    return {
      ...base,
      version: 1,
      savedAt: typeof raw.savedAt === 'string' ? raw.savedAt.slice(0, 64) : base.savedAt,
      playTimeSeconds: clampNum(
        typeof raw.playTimeSeconds === 'number' ? raw.playTimeSeconds : base.playTimeSeconds,
        0,
        10000000
      ),
      playerPosition:
        Array.isArray(raw.playerPosition) && raw.playerPosition.length === 3
          ? [
              clampNum(Number(raw.playerPosition[0]), -200, 200),
              clampNum(Number(raw.playerPosition[1]), -50, 200),
              clampNum(Number(raw.playerPosition[2]), -200, 200),
            ]
          : base.playerPosition,
      playerYaw: clampNum(typeof raw.playerYaw === 'number' ? raw.playerYaw : base.playerYaw, -10, 10),
      hp: clampNum(typeof raw.hp === 'number' ? raw.hp : maxHp, 0, maxHp),
      maxHp,
      chaosEnergy: clampNum(
        typeof raw.chaosEnergy === 'number' ? raw.chaosEnergy : maxChaosEnergy,
        0,
        maxChaosEnergy
      ),
      maxChaosEnergy,
      xp: clampNum(typeof raw.xp === 'number' ? raw.xp : base.xp, 0, 10000000),
      level: clampInt(typeof raw.level === 'number' ? raw.level : base.level, 1, 99),
      enemiesDefeatedCount: clampInt(
        typeof raw.enemiesDefeatedCount === 'number' ? raw.enemiesDefeatedCount : base.enemiesDefeatedCount,
        0,
        1000000
      ),
      chaosEventsSurvived: clampInt(
        typeof raw.chaosEventsSurvived === 'number' ? raw.chaosEventsSurvived : base.chaosEventsSurvived,
        0,
        1000000
      ),
      inventory: Array.isArray(raw.inventory) ? raw.inventory.slice(0, 30) : base.inventory,
      quests: raw.quests ? { ...base.quests, ...raw.quests } : base.quests,
      worldState: raw.worldState ? { ...base.worldState, ...raw.worldState } : base.worldState,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function publishLeaderboardEntry(
  save: SaveDataV1,
  customName?: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const path = `leaderboard/${user.uid}`;

  const payload = {
    ownerId: user.uid,
    displayName: sanitizeDisplayName(customName ?? user.displayName),
    level: clampInt(save.level, 1, 99),
    xp: clampNum(save.xp, 0, 10000000),
    bossDefeated: Boolean(save.worldState.bossDefeated),
    chaosCoreObtained: Boolean(save.worldState.chaosCoreObtained),
    playTimeSeconds: clampNum(save.playTimeSeconds, 0, 10000000),
    enemiesDefeatedCount: clampInt(save.enemiesDefeatedCount, 0, 1000000),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'leaderboard', user.uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const path = 'leaderboard';
  try {
    const q = query(collection(db, path), orderBy('xp', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        ownerId: String(data.ownerId ?? d.id),
        displayName: String(data.displayName ?? 'Explorateur'),
        level: Number(data.level ?? 1),
        xp: Number(data.xp ?? 0),
        bossDefeated: Boolean(data.bossDefeated),
        chaosCoreObtained: Boolean(data.chaosCoreObtained),
        playTimeSeconds: Number(data.playTimeSeconds ?? 0),
        enemiesDefeatedCount: Number(data.enemiesDefeatedCount ?? 0),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
