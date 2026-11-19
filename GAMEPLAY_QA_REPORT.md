# WORLD CHAOS — GAMEPLAY QA REPORT (MONDE 1 : THE LOST JUNGLE)

**Date :** 2026-11-18  
**Règle stricte :** Aucun test interactif de bout en bout en session WebGL2 jouée n’ayant pu être exécuté dans ce conteneur Linux sans GPU navigateur interactif, seuls les invariants vérifiés par **tests unitaires automatisés (`Vitest`)** et **inspection directe du code** sont marqués `PASS` ; les essais temps réel joueur restent marqués `NOT TESTED`.

---

## 1. Intégrité Structurelle des Données Monde 1 (`worldAndSave.test.ts` — **PASS**)

| Système Monde 1 | Quantité Vérifiée | Résultat | Statut |
|---|---|---|---|
| **Zones explorables** | `10` (`arrival`, `camp`, `wild_jungle`, `river`, `ancient_ruins`, `hidden_cave`, `forgotten_temple`, `chaos_zone`, `boss_arena`, `secret_sanctuary`) | Toutes définies avec `center`, `radius`, `fogColor`, `skyColor`, `ambientMood` | **PASS** *(unit test)* |
| **Quêtes** | `10` (`5` principales chaînées `mq_1`..`mq_5` + `5` secondaires `sq_1`..`sq_5`) | Récompenses d’objets validées dans `ITEMS` | **PASS** *(unit test)* |
| **Énigmes** | `5` (`puzzle_symbols`, `puzzle_sequence`, `puzzle_crystals`, `puzzle_gravity`, `puzzle_chaos_conduit`) | 3 indices par énigme + récompenses vérifiées | **PASS** *(unit test)* |
| **PNJ & Interactables** | `5` PNJ (`Lyra`, `Kael`, `Orin`, `Veyra`, `Tarek`), `34` interactables | Tous référencés sur des `ZoneId` et `ItemId` valides | **PASS** *(unit test)* |
| **Capacités spéciales** | `3` (`Shockwave`, `Gravity Control`, `Chaos Shield`) | Coûts énergie (20/25/30) & cooldowns (4.5s/8s/10s) cohérents | **PASS** *(unit test)* |

---

## 2. Scénarios Critiques & Correctifs Gameplay Vérifiés

| Scénario Gameplay | Mécanisme Vérifié | Résultat Unit / Code | Statut Runtime Joué |
|---|---|---|---|
| **Verrouillage arène Boss & anti-contournement (`BUG-01`)** | `isBlockedByWorldBarrier()` bloque porte sud ET rayon `21.5m` autour `(0, -82)` tant que `!bossGateOpen`, tout en laissant le sceau `(0, -56)` accessible | **PASS** *(5 assertions Vitest)* | **NOT TESTED** *(navigation 3D)* |
| **Restauration des énigmes après chargement (`BUG-02`)** | `applySaveData()` resynchronise `symbolRotations`, orientation des 3 totems, `crystalLit` et `sequenceStep` depuis `solvedPuzzles` | **PASS** *(code)* | **NOT TESTED** *(reload navigateur)* |
| **Défaite & réapparition au camp (`BUG-03`)** | `respawnAtCamp()` purge hazards/projectiles/`activeChaos`, réinitialise Krakoss & ennemis vivants, restaure 100 % PV/Énergie | **PASS** *(code)* | **NOT TESTED** *(combat boss)* |
| **Passages multi-niveaux XP (`BUG-10`)** | `applyLevelUps()` itère `while (curLevel < 99 && curXp >= curLevel * 120)` avec plafond `1000` PV/EN | **PASS** *(3 assertions Vitest)* | **NOT TESTED** |
| **Dialogue PNJ & masquage HUD (`BUG-09`)** | `triggerInteract()` sur PNJ synchronise `emitHud()` avant `onOpenDialogue()` | **PASS** *(code)* | **NOT TESTED** |
| **4 Événements Chaos (`GRAVITY_FLIP`, `COLLAPSE`, `FLOOD`, `METEOR_RAIN`)** | Timers warning `3s`, effets physiques/environnementaux & nettoyage complet des ressources partagées | **PASS** *(code)* | **NOT TESTED** *(en jeu)* |
| **Victoire Boss Krakoss & obtention Chaos Core** | Phases 1–3, invocation renforts P2, apparition `chaos_core_pedestal` et écran `VictoryScreen` | **PASS** *(code)* | **NOT TESTED** *(session complète)* |
