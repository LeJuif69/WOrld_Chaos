import {
  InteractableDef,
  InventoryItemDef,
  NpcDef,
  PuzzleDef,
  QuestDef,
  ZoneDef,
} from './types';

export const WORLD_HALF_SIZE = 115;

export const ZONES: ZoneDef[] = [
  {
    id: 'arrival',
    name: 'The Arrival',
    subtitle: 'Shattered Skiff Clearing',
    center: [0, 82],
    radius: 22,
    fogColor: '#1e382b',
    skyColor: '#4e8a7d',
    ambientMood: 'jungle',
    description: 'Where your sky-skiff crash-landed after the Great Chaos tore the continent apart.',
  },
  {
    id: 'camp',
    name: 'The Camp',
    subtitle: 'Explorers Outpost',
    center: [0, 44],
    radius: 20,
    fogColor: '#223d2d',
    skyColor: '#5c997f',
    ambientMood: 'camp',
    description: 'A warm refuge protected by carved ward-stones. Lyra and Kael coordinate the expedition here.',
  },
  {
    id: 'wild_jungle',
    name: 'The Wild Jungle',
    subtitle: 'Canopy of Living Roots',
    center: [-34, 16],
    radius: 28,
    fogColor: '#173323',
    skyColor: '#3f7861',
    ambientMood: 'jungle',
    description: 'Dense bioluminescent ferns, giant banyan roots, and prowling Chaos-touched predators.',
  },
  {
    id: 'river',
    name: 'The River',
    subtitle: 'Emerald Basin & Cascade',
    center: [28, 12],
    radius: 26,
    fogColor: '#1a3b3c',
    skyColor: '#52939c',
    ambientMood: 'river',
    description: 'A turquoise river fed by the twin waterfall. An ancient drawbridge guards the northern crossing.',
  },
  {
    id: 'ancient_ruins',
    name: 'The Ancient Ruins',
    subtitle: 'Pillars of the First Age',
    center: [-30, -24],
    radius: 24,
    fogColor: '#2c3627',
    skyColor: '#698a6f',
    ambientMood: 'ruins',
    description: 'Weathered sandstone monoliths engraved with Sun, Leaf, and Spiral glyphs.',
  },
  {
    id: 'hidden_cave',
    name: 'The Hidden Cave',
    subtitle: 'Crystal Grotto Behind the Falls',
    center: [64, -8],
    radius: 22,
    fogColor: '#142436',
    skyColor: '#25425e',
    ambientMood: 'cave',
    description: 'A resonant grotto behind the waterfall where Orin studies humming amethyst crystals.',
  },
  {
    id: 'forgotten_temple',
    name: 'The Forgotten Temple',
    subtitle: 'Stepped Sanctuary of Gravity',
    center: [0, -34],
    radius: 26,
    fogColor: '#28332b',
    skyColor: '#6b8577',
    ambientMood: 'ruins',
    description: 'A stepped pyramid whose gravity conduits still hum with pre-Chaos engineering.',
  },
  {
    id: 'chaos_zone',
    name: 'The Chaos Zone',
    subtitle: 'Fractured Rift Basin',
    center: [44, -46],
    radius: 24,
    fogColor: '#2d1c38',
    skyColor: '#58346e',
    ambientMood: 'chaos',
    description: 'Reality fractures here: floating monoliths, meteor scars, and unstable Chaos anomalies.',
  },
  {
    id: 'boss_arena',
    name: 'The Boss Arena',
    subtitle: 'Colosseum of the Core',
    center: [0, -82],
    radius: 28,
    fogColor: '#2b1526',
    skyColor: '#612b48',
    ambientMood: 'boss',
    description: 'The sunken ring where Krakoss, the Corrupted Guardian, guards the World 1 Chaos Core.',
  },
  {
    id: 'secret_sanctuary',
    name: 'The Secret Sanctuary',
    subtitle: 'Shrine of the Living World',
    center: [-66, -64],
    radius: 20,
    fogColor: '#1b3b36',
    skyColor: '#54a696',
    ambientMood: 'ruins',
    description: 'A hidden emerald sanctuary sealed behind resonant crystal brambles.',
  },
];

export const ITEMS: Record<string, InventoryItemDef> = {
  vitality_fruit: {
    id: 'vitality_fruit',
    name: 'Sunberry Fruit',
    category: 'consumable',
    description: 'Restores 45 HP immediately. Grows near sunlit clearings and riverbanks.',
    usable: true,
    healAmount: 45,
    color: '#ef4444',
  },
  aether_tonic: {
    id: 'aether_tonic',
    name: 'Aether Tonic',
    category: 'consumable',
    description: 'Restores 60 Chaos Energy and 25 HP for sustained ability combat.',
    usable: true,
    healAmount: 25,
    energyAmount: 60,
    color: '#38bdf8',
  },
  chaos_shard: {
    id: 'chaos_shard',
    name: 'Chaos Shard',
    category: 'crystal',
    description: 'Crystallized energy left behind by anomalies and corrupted beasts.',
    usable: false,
    color: '#a855f7',
  },
  ancient_gear: {
    id: 'ancient_gear',
    name: 'Sun-Brass Mechanism',
    category: 'resource',
    description: 'Precision bronze gear salvaged from First Age machinery.',
    usable: false,
    color: '#f59e0b',
  },
  broken_compass: {
    id: 'broken_compass',
    name: 'Expedition Compass',
    category: 'quest',
    description: 'Recovered from the skiff wreckage. Points toward concentrated Chaos energy.',
    usable: false,
    color: '#eab308',
  },
  sun_tablet: {
    id: 'sun_tablet',
    name: 'Tablet of Dawn',
    category: 'quest',
    description: 'Ancient stone slate bearing the alignment key: Sun, Leaf, Spiral.',
    usable: false,
    color: '#f97316',
  },
  cave_prism: {
    id: 'cave_prism',
    name: 'Resonant Prism',
    category: 'artifact',
    description: 'A humming crystal from the Hidden Cave that amplifies Shockwave resonance.',
    usable: false,
    color: '#22d3ee',
  },
  warden_seal: {
    id: 'warden_seal',
    name: 'Warden Crest',
    category: 'quest',
    description: 'Emblem bestowed by Veyra upon unlocking the Forgotten Temple conduits.',
    usable: false,
    color: '#10b981',
  },
  sanctuary_relic: {
    id: 'sanctuary_relic',
    name: 'Heart of the Canopy',
    category: 'artifact',
    description: 'A living amber relic preserved inside the Secret Sanctuary.',
    usable: false,
    color: '#34d399',
  },
  chaos_core_jungle: {
    id: 'chaos_core_jungle',
    name: 'Jungle Chaos Core',
    category: 'chaos_core',
    description: 'Primary Chaos Core of World 1. Stabilizes The Lost Jungle and unlocks the path beyond.',
    usable: false,
    color: '#f43f5e',
  },
};

export const PUZZLES: Record<string, PuzzleDef> = {
  puzzle_symbols: {
    id: 'puzzle_symbols',
    name: 'Triad of the First Age',
    zoneId: 'ancient_ruins',
    hints: [
      'The Tablet of Dawn describes the cycle of life: light feeds growth, growth spirals onward.',
      'Rotate the three sandstone totems until they show: 1) Sun, 2) Leaf, 3) Spiral.',
      'Interact with each totem in the Ancient Ruins until all three glow emerald.',
    ],
  },
  puzzle_sequence: {
    id: 'puzzle_sequence',
    name: 'Harmonic Pressure Runes',
    zoneId: 'wild_jungle',
    hints: [
      'Each stone pad rings with a distinct pitch when stepped on or activated.',
      'Activate the three runes from lowest tone (West) to middle (Center) to highest (East).',
      'Look at the number of carved rings on each plinth: 1 ring, then 2 rings, then 3 rings.',
    ],
  },
  puzzle_crystals: {
    id: 'puzzle_crystals',
    name: 'Grotto Crystal Resonance',
    zoneId: 'hidden_cave',
    hints: [
      'Orin noted that the amethyst pillars inside the cave respond to kinetic force.',
      'Use Shockwave or strike all three resonant crystals in the Hidden Cave.',
      'Once all three crystals sing simultaneously, the grotto chest and Chaos Shield shrine awaken.',
    ],
  },
  puzzle_gravity: {
    id: 'puzzle_gravity',
    name: 'Temple Gravity Conduit',
    zoneId: 'forgotten_temple',
    hints: [
      'A suspended keystone sits high on the Forgotten Temple terrace, unreachable on foot alone.',
      'Unlock Gravity Control at the Ancient Ruins shrine, then activate it near the floating stones.',
      'Jump onto the raised temple steps during Gravity Control and touch the Temple Conduit.',
    ],
  },
  puzzle_chaos_conduit: {
    id: 'puzzle_chaos_conduit',
    name: 'Unstable Rift Obelisk',
    zoneId: 'chaos_zone',
    hints: [
      'The Chaos Obelisk burns any explorer who touches it unprotected.',
      'Activate Chaos Shield before interacting with the Chaos Obelisk.',
      'Channeling the shielded obelisk breaks the seal on the Boss Arena to the north.',
    ],
  },
};

export const QUESTS: QuestDef[] = [
  {
    id: 'mq_1_camp',
    title: '01. Survivors of the Fall',
    category: 'main',
    giverNpcId: 'lyra',
    summary: 'Recover your Expedition Compass from The Arrival wreckage and report to Lyra at The Camp.',
    objectives: [
      { id: 'find_compass', description: 'Recover the Expedition Compass at The Arrival', targetCount: 1 },
      { id: 'talk_lyra', description: 'Speak with Lyra in The Camp', targetCount: 1 },
    ],
    rewardItems: [{ itemId: 'vitality_fruit', quantity: 2 }],
  },
  {
    id: 'mq_2_river_ruins',
    title: '02. Across the Emerald River',
    category: 'main',
    giverNpcId: 'kael',
    summary: 'Lower the River Drawbridge using the stone lever and discover the Ancient Ruins.',
    objectives: [
      { id: 'lower_bridge', description: 'Pull the River Drawbridge Lever', targetCount: 1 },
      { id: 'discover_ruins', description: 'Enter The Ancient Ruins', targetCount: 1 },
    ],
    rewardItems: [{ itemId: 'aether_tonic', quantity: 2 }],
  },
  {
    id: 'mq_3_temple_gravity',
    title: '03. Pillars of Gravity',
    category: 'main',
    giverNpcId: 'veyra',
    summary: 'Solve the Triad Symbol Puzzle in the Ancient Ruins, claim Gravity Control, and activate the Temple Conduit.',
    objectives: [
      { id: 'unlock_gravity', description: 'Awaken Gravity Control at the Ruins Shrine', targetCount: 1 },
      { id: 'solve_gravity', description: 'Align the Forgotten Temple Gravity Conduit', targetCount: 1 },
    ],
    rewardItems: [{ itemId: 'warden_seal', quantity: 1 }],
    rewardAbility: 'gravity_control',
  },
  {
    id: 'mq_4_chaos_shield',
    title: '04. Heart of the Rift',
    category: 'main',
    giverNpcId: 'veyra',
    summary: 'Obtain Chaos Shield in the Hidden Cave, shield yourself, and stabilize the Chaos Zone Obelisk.',
    objectives: [
      { id: 'unlock_shield', description: 'Unlock Chaos Shield in The Hidden Cave', targetCount: 1 },
      { id: 'stabilize_obelisk', description: 'Stabilize the Chaos Obelisk while shielded', targetCount: 1 },
    ],
    rewardItems: [{ itemId: 'aether_tonic', quantity: 2 }, { itemId: 'vitality_fruit', quantity: 2 }],
    rewardAbility: 'chaos_shield',
  },
  {
    id: 'mq_5_boss',
    title: '05. The Corrupted Guardian',
    category: 'main',
    giverNpcId: 'veyra',
    summary: 'Enter The Boss Arena, defeat Krakoss, and reclaim the Jungle Chaos Core.',
    objectives: [
      { id: 'defeat_krakoss', description: 'Defeat Krakoss in The Boss Arena', targetCount: 1 },
      { id: 'claim_core', description: 'Claim the Jungle Chaos Core', targetCount: 1 },
    ],
    rewardItems: [{ itemId: 'chaos_core_jungle', quantity: 1 }],
  },
  {
    id: 'sq_1_berries',
    title: 'Camp Provisions',
    category: 'side',
    giverNpcId: 'lyra',
    summary: 'Gather 3 Sunberry Fruits from the jungle clearings to keep the camp supplied.',
    objectives: [
      { id: 'collect_berries', description: 'Collect Sunberry Fruits in the jungle', targetCount: 3 },
    ],
    rewardItems: [{ itemId: 'aether_tonic', quantity: 2 }],
  },
  {
    id: 'sq_2_stalkers',
    title: 'Clear the Canopy',
    category: 'side',
    giverNpcId: 'kael',
    summary: 'Defeat 3 Chaos-touched enemies prowling The Wild Jungle.',
    objectives: [
      { id: 'defeat_enemies', description: 'Defeat jungle creatures', targetCount: 3 },
    ],
    rewardItems: [{ itemId: 'ancient_gear', quantity: 2 }, { itemId: 'chaos_shard', quantity: 2 }],
  },
  {
    id: 'sq_3_crystals',
    title: 'Echoes Behind the Falls',
    category: 'side',
    giverNpcId: 'orin',
    summary: 'Strike all 3 Resonant Crystals inside The Hidden Cave for Orin.',
    objectives: [
      { id: 'solve_crystals', description: 'Resonate the 3 Cave Crystals', targetCount: 1 },
    ],
    rewardItems: [{ itemId: 'cave_prism', quantity: 1 }],
  },
  {
    id: 'sq_4_sequence',
    title: 'Song of the Stones',
    category: 'side',
    giverNpcId: 'veyra',
    summary: 'Activate the 3 Harmonic Pressure Runes in order (1-2-3 rings) near the Jungle-Ruins border.',
    objectives: [
      { id: 'solve_sequence', description: 'Complete the Harmonic Rune sequence', targetCount: 1 },
    ],
    rewardItems: [{ itemId: 'chaos_shard', quantity: 3 }],
  },
  {
    id: 'sq_5_sanctuary',
    title: 'The Secret Sanctuary',
    category: 'side',
    giverNpcId: 'tarek',
    summary: 'Break the crystal bramble barrier with Shockwave and retrieve the Heart of the Canopy.',
    objectives: [
      { id: 'find_sanctuary', description: 'Reach The Secret Sanctuary', targetCount: 1 },
      { id: 'claim_heart', description: 'Claim the Heart of the Canopy', targetCount: 1 },
    ],
    rewardItems: [{ itemId: 'sanctuary_relic', quantity: 1 }, { itemId: 'vitality_fruit', quantity: 3 }],
  },
];

export const NPCS: NpcDef[] = [
  {
    id: 'lyra',
    name: 'Lyra',
    role: 'Expedition Cartographer',
    zoneId: 'camp',
    position: [-5, 42],
    rotationY: 0.6,
    cloakColor: '#1f6f5c',
    accentColor: '#f59e0b',
    greetingNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: 'You made it back from the crash site! Since the Great Chaos shattered our sky-skiff, the jungle itself has been shifting—gravity flips, floods, even meteor showers.',
        choices: [
          { label: 'Accept: Survivors of the Fall', nextNodeId: 'quest_main', action: 'accept_quest', questId: 'mq_1_camp' },
          { label: 'Accept: Camp Provisions (Side)', nextNodeId: 'quest_side', action: 'accept_quest', questId: 'sq_1_berries' },
          { label: 'Rest at Camp (+Full Heal)', nextNodeId: 'healed', action: 'heal' },
          { label: 'Leave', action: 'close' },
        ],
      },
      quest_main: {
        id: 'quest_main',
        text: 'If you have your Expedition Compass from The Arrival, speak with Kael across the fire. Together we can reach the Forgotten Temple and locate the Jungle Chaos Core.',
        choices: [{ label: 'Continue', action: 'close' }],
      },
      quest_side: {
        id: 'quest_side',
        text: 'Bring back Sunberry Fruits whenever you spot their red glow near clearings. They keep everyone standing when Chaos storms hit.',
        choices: [{ label: 'On it', action: 'close' }],
      },
      healed: {
        id: 'healed',
        text: 'Take a breath by the ward-fire. Your vitality and Chaos Energy are fully restored.',
        choices: [{ label: 'Thank you', action: 'close' }],
      },
    },
  },
  {
    id: 'kael',
    name: 'Kael',
    role: 'Relic Tinkerer',
    zoneId: 'camp',
    position: [6, 41],
    rotationY: -0.7,
    cloakColor: '#7c4a2d',
    accentColor: '#38bdf8',
    greetingNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: 'Your gauntlet already channels Shockwave—great for knocking back Stalkers and shattering crystal brambles. Next, we need that River Drawbridge lowered.',
        choices: [
          { label: 'Accept: Across the Emerald River', nextNodeId: 'bridge', action: 'accept_quest', questId: 'mq_2_river_ruins' },
          { label: 'Accept: Clear the Canopy (Side)', nextNodeId: 'hunt', action: 'accept_quest', questId: 'sq_2_stalkers' },
          { label: 'Ask about Ruins Puzzle', nextNodeId: 'hint', action: 'give_hint', hintPuzzleId: 'puzzle_symbols' },
          { label: 'Leave', action: 'close' },
        ],
      },
      bridge: {
        id: 'bridge',
        text: 'Follow the trail northeast to The River. Pull the ancient lever on the south bank to drop the bridge, then cross west toward The Ancient Ruins.',
        choices: [{ label: 'Got it', action: 'close' }],
      },
      hunt: {
        id: 'hunt',
        text: 'Stalkers and Thorn Spitters are swarming the Wild Jungle to the northwest. Thin their numbers and watch for their red attack wind-ups—dodge right as they lunge!',
        choices: [{ label: 'Will do', action: 'close' }],
      },
      hint: {
        id: 'hint',
        text: 'Inside the Ancient Ruins, look for the Tablet of Dawn—it marks the order for the three rotating totems: Sun, Leaf, and Spiral.',
        choices: [{ label: 'Thanks', action: 'close' }],
      },
    },
  },
  {
    id: 'orin',
    name: 'Orin',
    role: 'Crystal Hermit',
    zoneId: 'hidden_cave',
    position: [61, -5],
    rotationY: -1.1,
    cloakColor: '#2c4170',
    accentColor: '#c084fc',
    greetingNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: 'Listen closely... the crystals in this grotto remember the world before the Great Chaos. Strike all three with your Shockwave or blade, and the Chaos Shield shrine will awaken.',
        choices: [
          { label: 'Accept: Echoes Behind the Falls', nextNodeId: 'crystals', action: 'accept_quest', questId: 'sq_3_crystals' },
          { label: 'Need Crystal Puzzle Hint', nextNodeId: 'hint', action: 'give_hint', hintPuzzleId: 'puzzle_crystals' },
          { label: 'Restore Vitality', nextNodeId: 'heal', action: 'heal' },
          { label: 'Leave', action: 'close' },
        ],
      },
      crystals: {
        id: 'crystals',
        text: 'Each crystal sits along the cavern wall. Strike or Shockwave all three until they hum in harmony.',
        choices: [{ label: 'Begin', action: 'close' }],
      },
      hint: {
        id: 'hint',
        text: 'Use Shockwave near the violet crystal pillars or hit them directly with a quick strike. None can be missed!',
        choices: [{ label: 'Understood', action: 'close' }],
      },
      heal: {
        id: 'heal',
        text: 'Let the cool grotto mist mend your wounds.',
        choices: [{ label: 'Thank you', action: 'close' }],
      },
    },
  },
  {
    id: 'veyra',
    name: 'Veyra',
    role: 'Temple Warden',
    zoneId: 'forgotten_temple',
    position: [-5, -26],
    rotationY: 0.4,
    cloakColor: '#4c5c3e',
    accentColor: '#34d399',
    greetingNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: 'Krakoss has succumbed to the Rift in the northern colosseum. To unseal the Boss Arena, you must master both Gravity Control and Chaos Shield.',
        choices: [
          { label: 'Accept: Pillars of Gravity', nextNodeId: 'grav', action: 'accept_quest', questId: 'mq_3_temple_gravity' },
          { label: 'Accept: Heart of the Rift', nextNodeId: 'rift', action: 'accept_quest', questId: 'mq_4_chaos_shield' },
          { label: 'Accept: The Corrupted Guardian', nextNodeId: 'boss', action: 'accept_quest', questId: 'mq_5_boss' },
          { label: 'Accept: Song of the Stones (Side)', nextNodeId: 'seq', action: 'accept_quest', questId: 'sq_4_sequence' },
          { label: 'Leave', action: 'close' },
        ],
      },
      grav: {
        id: 'grav',
        text: 'Awaken Gravity Control at the shrine in The Ancient Ruins to the southwest, then use it to leap up the Forgotten Temple terrace and touch the top Conduit.',
        choices: [{ label: 'On my way', action: 'close' }],
      },
      rift: {
        id: 'rift',
        text: 'Seek Chaos Shield in The Hidden Cave east of the river. Activate your shield before channeling the unstable Obelisk in The Chaos Zone.',
        choices: [{ label: 'Understood', action: 'close' }],
      },
      boss: {
        id: 'boss',
        text: 'Once the Arena Seal opens north of the Temple, face Krakoss. Watch his glowing slam rings, dodge or shield, and punish his recovery!',
        choices: [{ label: 'I am ready', action: 'close' }],
      },
      seq: {
        id: 'seq',
        text: 'Along the western jungle path stand three harmonic pressure pads. Trigger them in ascending order: 1 ring, 2 rings, 3 rings.',
        choices: [{ label: 'I will check them', action: 'close' }],
      },
    },
  },
  {
    id: 'tarek',
    name: 'Tarek',
    role: 'Sanctuary Echo',
    zoneId: 'secret_sanctuary',
    position: [-65, -58],
    rotationY: 0.9,
    cloakColor: '#1e5c55',
    accentColor: '#a7f3d0',
    greetingNodeId: 'root',
    nodes: {
      root: {
        id: 'root',
        text: 'Few explorers pierce the crystal brambles to reach this Sanctuary. The Great Chaos was not an accident—each Chaos Core anchors one of the Five Living Worlds.',
        choices: [
          { label: 'Accept: The Secret Sanctuary', nextNodeId: 'sanct', action: 'accept_quest', questId: 'sq_5_sanctuary' },
          { label: 'Blessing of Canopy (+Full Heal)', nextNodeId: 'heal', action: 'heal' },
          { label: 'Leave', action: 'close' },
        ],
      },
      sanct: {
        id: 'sanct',
        text: 'Claim the Heart of the Canopy from the pedestal beside the sanctuary tree. May its strength carry you against Krakoss.',
        choices: [{ label: 'Thank you', action: 'close' }],
      },
      heal: {
        id: 'heal',
        text: 'The ancient canopy restores your body and spirit.',
        choices: [{ label: 'Farewell', action: 'close' }],
      },
    },
  },
];

export const INTERACTABLES: InteractableDef[] = [
  // Save Campfires (Points de sauvegarde)
  { id: 'save_camp', type: 'save_campfire', label: 'Campfire — Rest & Save', zoneId: 'camp', position: [0, 44], repeatable: true },
  { id: 'save_temple', type: 'save_campfire', label: 'Temple Brazier — Rest & Save', zoneId: 'forgotten_temple', position: [9, -28], repeatable: true },

  // Quest Relics
  { id: 'relic_compass', type: 'quest_relic', label: 'Pick up Expedition Compass', zoneId: 'arrival', position: [3, 79], itemReward: { itemId: 'broken_compass', quantity: 1 }, questFlag: 'find_compass' },
  { id: 'relic_sun_tablet', type: 'quest_relic', label: 'Read Tablet of Dawn', zoneId: 'ancient_ruins', position: [-21, -18], itemReward: { itemId: 'sun_tablet', quantity: 1 } },
  { id: 'relic_sanctuary_heart', type: 'quest_relic', label: 'Claim Heart of the Canopy', zoneId: 'secret_sanctuary', position: [-69, -68], itemReward: { itemId: 'sanctuary_relic', quantity: 1 }, questFlag: 'claim_heart' },

  // Lever & Bridge
  { id: 'lever_river_bridge', type: 'lever_bridge', label: 'Pull River Drawbridge Lever', zoneId: 'river', position: [19, 22], questFlag: 'lower_bridge' },

  // Puzzle 1: Symbol Totems (Ancient Ruins) -> target order: 0=Sun, 1=Leaf, 2=Spiral
  { id: 'totem_1', type: 'totem_symbol', label: 'Rotate West Totem (Sun)', zoneId: 'ancient_ruins', position: [-36, -24], puzzleId: 'puzzle_symbols', puzzleIndex: 0, repeatable: true },
  { id: 'totem_2', type: 'totem_symbol', label: 'Rotate Center Totem (Leaf)', zoneId: 'ancient_ruins', position: [-30, -29], puzzleId: 'puzzle_symbols', puzzleIndex: 1, repeatable: true },
  { id: 'totem_3', type: 'totem_symbol', label: 'Rotate East Totem (Spiral)', zoneId: 'ancient_ruins', position: [-24, -24], puzzleId: 'puzzle_symbols', puzzleIndex: 2, repeatable: true },

  // Puzzle 2: Harmonic Sequence Switches (Wild Jungle)
  { id: 'seq_1', type: 'sequence_switch', label: 'Activate 1-Ring Rune', zoneId: 'wild_jungle', position: [-42, 4], puzzleId: 'puzzle_sequence', puzzleIndex: 0, repeatable: true },
  { id: 'seq_2', type: 'sequence_switch', label: 'Activate 2-Ring Rune', zoneId: 'wild_jungle', position: [-35, 0], puzzleId: 'puzzle_sequence', puzzleIndex: 1, repeatable: true },
  { id: 'seq_3', type: 'sequence_switch', label: 'Activate 3-Ring Rune', zoneId: 'wild_jungle', position: [-28, 4], puzzleId: 'puzzle_sequence', puzzleIndex: 2, repeatable: true },

  // Puzzle 3: Resonant Crystals (Hidden Cave)
  { id: 'crys_1', type: 'resonant_crystal', label: 'Resonate Sapphire Crystal', zoneId: 'hidden_cave', position: [62, -14], puzzleId: 'puzzle_crystals', puzzleIndex: 0, repeatable: true },
  { id: 'crys_2', type: 'resonant_crystal', label: 'Resonate Amethyst Crystal', zoneId: 'hidden_cave', position: [70, -8], puzzleId: 'puzzle_crystals', puzzleIndex: 1, repeatable: true },
  { id: 'crys_3', type: 'resonant_crystal', label: 'Resonate Emerald Crystal', zoneId: 'hidden_cave', position: [65, -2], puzzleId: 'puzzle_crystals', puzzleIndex: 2, repeatable: true },

  // Ability Shrines
  { id: 'shrine_gravity', type: 'ability_shrine', label: 'Awaken GRAVITY CONTROL', zoneId: 'ancient_ruins', position: [-30, -37], abilityGrant: 'gravity_control', questFlag: 'unlock_gravity' },
  { id: 'shrine_shield', type: 'ability_shrine', label: 'Awaken CHAOS SHIELD', zoneId: 'hidden_cave', position: [72, -14], abilityGrant: 'chaos_shield', questFlag: 'unlock_shield' },

  // Puzzle 4: Forgotten Temple Gravity Conduit
  { id: 'temple_conduit', type: 'relic_machine', label: 'Align Temple Gravity Conduit', zoneId: 'forgotten_temple', position: [0, -40], puzzleId: 'puzzle_gravity', questFlag: 'solve_gravity' },

  // Puzzle 5: Chaos Zone Obelisk
  { id: 'chaos_obelisk', type: 'chaos_obelisk', label: 'Stabilize Chaos Obelisk (Needs Shield)', zoneId: 'chaos_zone', position: [46, -48], puzzleId: 'puzzle_chaos_conduit', questFlag: 'stabilize_obelisk' },

  // Destructible Barrier to Secret Sanctuary
  { id: 'barrier_sanctuary', type: 'destructible_barrier', label: 'Crystal Bramble Barrier (Use Shockwave)', zoneId: 'ancient_ruins', position: [-50, -44] },

  // Sanctuary Portal (fast return to Camp)
  { id: 'portal_sanctuary', type: 'sanctuary_portal', label: 'Ancient Portal — Return to Camp', zoneId: 'secret_sanctuary', position: [-60, -68], repeatable: true },

  // Healing Altar
  { id: 'altar_jungle', type: 'healing_altar', label: 'Ancient Healing Fountain', zoneId: 'wild_jungle', position: [-22, 22], repeatable: true },

  // Chests
  { id: 'chest_jungle', type: 'chest', label: 'Open Expedition Chest', zoneId: 'wild_jungle', position: [-45, 22], itemReward: { itemId: 'aether_tonic', quantity: 2 } },
  { id: 'chest_river', type: 'chest', label: 'Open Sunken Chest', zoneId: 'river', position: [38, 6], itemReward: { itemId: 'ancient_gear', quantity: 2 } },
  { id: 'chest_sanctuary', type: 'chest', label: 'Open Sanctuary Vault', zoneId: 'secret_sanctuary', position: [-72, -62], itemReward: { itemId: 'chaos_shard', quantity: 4 } },

  // Boss Arena Seal & Final Chaos Core Pedestal
  { id: 'boss_seal', type: 'boss_seal', label: 'Boss Arena Seal', zoneId: 'forgotten_temple', position: [0, -56] },
  { id: 'chaos_core_pedestal', type: 'chaos_core_pedestal', label: 'Claim JUNGLE CHAOS CORE', zoneId: 'boss_arena', position: [0, -88], itemReward: { itemId: 'chaos_core_jungle', quantity: 1 }, questFlag: 'claim_core' },

  // Collectible Shards & Sunberries
  { id: 'fruit_1', type: 'collectible_fruit', label: 'Pick Sunberry Fruit', zoneId: 'arrival', position: [-7, 72], itemReward: { itemId: 'vitality_fruit', quantity: 1 }, questFlag: 'collect_berries' },
  { id: 'fruit_2', type: 'collectible_fruit', label: 'Pick Sunberry Fruit', zoneId: 'wild_jungle', position: [-18, 28], itemReward: { itemId: 'vitality_fruit', quantity: 1 }, questFlag: 'collect_berries' },
  { id: 'fruit_3', type: 'collectible_fruit', label: 'Pick Sunberry Fruit', zoneId: 'river', position: [14, 15], itemReward: { itemId: 'vitality_fruit', quantity: 1 }, questFlag: 'collect_berries' },
  { id: 'fruit_4', type: 'collectible_fruit', label: 'Pick Sunberry Fruit', zoneId: 'forgotten_temple', position: [14, -22], itemReward: { itemId: 'vitality_fruit', quantity: 1 }, questFlag: 'collect_berries' },

  { id: 'shard_1', type: 'collectible_shard', label: 'Collect Chaos Shard', zoneId: 'river', position: [35, 20], itemReward: { itemId: 'chaos_shard', quantity: 1 } },
  { id: 'shard_2', type: 'collectible_shard', label: 'Collect Chaos Shard', zoneId: 'chaos_zone', position: [36, -38], itemReward: { itemId: 'chaos_shard', quantity: 1 } },
  { id: 'shard_3', type: 'collectible_shard', label: 'Collect Chaos Shard', zoneId: 'chaos_zone', position: [52, -55], itemReward: { itemId: 'chaos_shard', quantity: 1 } },
];

export const ABILITY_META = {
  shockwave: {
    id: 'shockwave' as const,
    name: 'Shockwave',
    keyHint: '1',
    energyCost: 20,
    cooldown: 4.5,
    color: '#38bdf8',
    description: 'Unleashes a kinetic blast that knocks back enemies, shatters crystal brambles, and resonates crystals.',
  },
  gravity_control: {
    id: 'gravity_control' as const,
    name: 'Gravity Control',
    keyHint: '2',
    energyCost: 25,
    cooldown: 8.0,
    color: '#a855f7',
    description: 'Reduces local gravity for 7s—enabling high leaps up temple terraces and lifting nearby anomalies.',
  },
  chaos_shield: {
    id: 'chaos_shield' as const,
    name: 'Chaos Shield',
    keyHint: '3',
    energyCost: 30,
    cooldown: 10.0,
    color: '#10b981',
    description: 'Projects a 6s barrier blocking enemy attacks, meteor strikes, and unstable Chaos Obelisk damage.',
  },
};
