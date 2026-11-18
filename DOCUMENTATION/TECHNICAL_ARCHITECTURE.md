# WORLD CHAOS — TECHNICAL ARCHITECTURE

## 1. Modular System Overview

The codebase separates 3D simulation, procedural assets, audio synthesis, persistence, and UI overlays so React HUD updates never tear down or re-initialize the WebGL viewport.

```text
src/
├── game/
│   ├── types.ts          # Core interfaces: Zones, Quests, NPCs, Enemies, Chaos Events, SaveData
│   ├── worldData.ts      # World 1 (The Lost Jungle) data: 10 zones, 5 NPCs, 10 quests, 5 puzzles, 15+ interactables
│   ├── textures.ts       # Procedural CanvasTexture generators (terrain, bark, stone, runes, water, shadow blob)
│   ├── models.ts         # Multi-part THREE.Group procedural characters, enemies, boss, ruins, shrines, camp
│   ├── audio.ts          # Procedural Web Audio synthesizer (adaptive music, ambience, combat & ability SFX)
│   ├── saveSystem.ts     # Versioned localStorage persistence, validation, settings & world-state serialization
│   └── WorldEngine.ts    # Core Three.js simulation loop, physics, terrain, combat, AI, Chaos Engine, camera
└── components/
    ├── GameHUD.tsx       # Landscape HUD, Boss bar, Chaos alert, virtual thumbstick & mobile action cluster
    ├── MainMenu.tsx      # Title screen over live 3D jungle vista
    ├── DialogueModal.tsx # Branching NPC dialogue & quest interaction panel
    ├── PauseAndMenus.tsx # Inventory, Quest Journal, World Map, Settings, Victory & Defeat overlays
```

## 2. Core Runtime Systems

- **Terrain & Navigation:** Analytical continuous heightmap `getTerrainHeight(x, z)` over a `240m × 240m` world bounds, shaping The Arrival beach/clearing, Camp plateau, Wild Jungle, carved River channel, Ancient Ruins plaza, Hidden Cave alcove, stepped Forgotten Temple, elevated Chaos Zone, and sunken Boss Arena.
- **Combat & Enemy AI FSM:** Supports Quick Attack combos, Heavy Attack (guard-break), Dodge Roll (i-frames), Target Lock-on, and 3 enemy families (`Jungle Stalker`, `Thorn Spitter`, `Stone Sentinel`) plus 3-phase Boss (`Krakoss`) transitioning cleanly across `Idle → Patrol → Investigate → Chase → Attack (Telegraph) → Stagger → Retreat → Dead`.
- **Chaos Engine:** Scheduled and zone-triggered reversible world events (`GRAVITY_FLIP`, `COLLAPSE`, `FLOOD`, `METEOR_RAIN`) with 3-second warning phase, active world modification, enemy/player physics interaction, and guaranteed clean restoration.
- **World State & Save System:** Persists player coordinates, HP, Chaos Energy, unlocked abilities, inventory stacks, discovered zones, solved puzzles, quest steps, defeated boss status, and collected Chaos Core under `world_chaos_save_v1`.
