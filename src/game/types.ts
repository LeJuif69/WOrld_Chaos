export type ZoneId =
  | 'arrival'
  | 'camp'
  | 'wild_jungle'
  | 'river'
  | 'ancient_ruins'
  | 'hidden_cave'
  | 'forgotten_temple'
  | 'chaos_zone'
  | 'boss_arena'
  | 'secret_sanctuary';

export type AbilityId = 'shockwave' | 'gravity_control' | 'chaos_shield';

export type ChaosEventType = 'GRAVITY_FLIP' | 'COLLAPSE' | 'FLOOD' | 'METEOR_RAIN';

export type EnemyFamily = 'stalker' | 'spitter' | 'sentinel' | 'boss';

export type EnemyAIState =
  | 'Idle'
  | 'Patrol'
  | 'Investigate'
  | 'Chase'
  | 'Attack'
  | 'Defend'
  | 'Stagger'
  | 'Retreat'
  | 'Dead';

export type ItemCategory =
  | 'quest'
  | 'resource'
  | 'artifact'
  | 'crystal'
  | 'consumable'
  | 'chaos_core';

export interface InventoryItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  usable: boolean;
  healAmount?: number;
  energyAmount?: number;
  color: string;
}

export interface InventoryStack {
  itemId: string;
  quantity: number;
}

export interface ZoneDef {
  id: ZoneId;
  name: string;
  subtitle: string;
  center: [number, number];
  radius: number;
  fogColor: string;
  skyColor: string;
  ambientMood: 'jungle' | 'camp' | 'river' | 'cave' | 'ruins' | 'chaos' | 'boss';
  description: string;
}

export type QuestCategory = 'main' | 'side';

export interface QuestObjectiveDef {
  id: string;
  description: string;
  targetCount: number;
}

export interface QuestDef {
  id: string;
  title: string;
  category: QuestCategory;
  giverNpcId: string;
  summary: string;
  objectives: QuestObjectiveDef[];
  rewardItems: InventoryStack[];
  rewardAbility?: AbilityId;
  unlocksZoneHint?: string;
}

export interface QuestProgress {
  questId: string;
  status: 'locked' | 'active' | 'completed';
  objectiveCounts: Record<string, number>;
}

export interface DialogueChoice {
  label: string;
  nextNodeId?: string;
  action?: 'accept_quest' | 'complete_quest' | 'heal' | 'give_hint' | 'close';
  questId?: string;
  hintPuzzleId?: string;
}

export interface DialogueNode {
  id: string;
  text: string;
  choices: DialogueChoice[];
}

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  zoneId: ZoneId;
  position: [number, number];
  rotationY: number;
  cloakColor: string;
  accentColor: string;
  greetingNodeId: string;
  nodes: Record<string, DialogueNode>;
}

export type PuzzleId =
  | 'puzzle_symbols'
  | 'puzzle_sequence'
  | 'puzzle_crystals'
  | 'puzzle_gravity'
  | 'puzzle_chaos_conduit';

export interface PuzzleDef {
  id: PuzzleId;
  name: string;
  zoneId: ZoneId;
  hints: string[];
}

export type InteractableType =
  | 'save_campfire'
  | 'chest'
  | 'lever_bridge'
  | 'totem_symbol'
  | 'sequence_switch'
  | 'resonant_crystal'
  | 'ability_shrine'
  | 'relic_machine'
  | 'healing_altar'
  | 'destructible_barrier'
  | 'sanctuary_portal'
  | 'quest_relic'
  | 'collectible_shard'
  | 'collectible_fruit'
  | 'chaos_obelisk'
  | 'boss_seal'
  | 'chaos_core_pedestal';

export interface InteractableDef {
  id: string;
  type: InteractableType;
  label: string;
  zoneId: ZoneId;
  position: [number, number];
  abilityGrant?: AbilityId;
  itemReward?: InventoryStack;
  puzzleId?: PuzzleId;
  puzzleIndex?: number;
  questFlag?: string;
  repeatable?: boolean;
}

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambienceVolume: number;
  cameraSensitivity: number;
  invertY: boolean;
  cameraDistance: number;
  showTouchControls: boolean;
}

export interface WorldStateData {
  discoveredZones: ZoneId[];
  activatedInteractables: string[];
  solvedPuzzles: PuzzleId[];
  unlockedAbilities: AbilityId[];
  defeatedEnemies: string[];
  bossDefeated: boolean;
  chaosCoreObtained: boolean;
  bridgeLowered: boolean;
  templeGateOpen: boolean;
  bossGateOpen: boolean;
  sanctuaryBarrierBroken: boolean;
  talkedNpcs: string[];
  puzzleHintsUnlocked: Record<string, number>;
}

export interface SaveDataV1 {
  version: 1;
  savedAt: string;
  playTimeSeconds: number;
  playerPosition: [number, number, number];
  playerYaw: number;
  hp: number;
  maxHp: number;
  chaosEnergy: number;
  maxChaosEnergy: number;
  xp: number;
  level: number;
  inventory: InventoryStack[];
  quests: Record<string, QuestProgress>;
  worldState: WorldStateData;
  enemiesDefeatedCount: number;
  chaosEventsSurvived: number;
}

export interface HUDStateSnapshot {
  screen: 'menu' | 'playing' | 'paused' | 'victory' | 'defeat';
  hp: number;
  maxHp: number;
  chaosEnergy: number;
  maxChaosEnergy: number;
  xp: number;
  level: number;
  currentZone: ZoneDef;
  activePrompt: { id: string; label: string; kind: 'npc' | 'interact' } | null;
  abilityCooldowns: Record<AbilityId, number>;
  abilityMaxCooldowns: Record<AbilityId, number>;
  unlockedAbilities: AbilityId[];
  chaosShieldActive: boolean;
  gravityControlActive: boolean;
  activeChaosEvent: {
    type: ChaosEventType;
    phase: 'warning' | 'active';
    remainingSeconds: number;
    label: string;
  } | null;
  bossHud: {
    visible: boolean;
    name: string;
    hp: number;
    maxHp: number;
    phase: number;
  };
  lockedTargetName: string | null;
  playerPos: [number, number, number];
  playerYaw: number;
  saveToast: string | null;
  discoveryBanner: { title: string; subtitle: string } | null;
  activeMainQuestTitle: string | null;
  activeMainQuestStep: string | null;
}
