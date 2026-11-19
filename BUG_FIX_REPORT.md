# WORLD CHAOS — BUG FIX REPORT (RELEASE 1.0)

**Périmètre :** Priorités 1 & 2 (`BUG-01` à `BUG-15`, plus `BUG-17` et `BUG-19` traités par cohérence) sans ajout de gameplay ni suppression de fonctionnalité validée.

---

## 1. Tableau Récapitulatif des Correctifs

| ID | Gravité | Fichier(s) | Correction Appliquée | Vérification | Statut |
|---|---|---|---|---|---|
| **BUG-01** | Élevée | `src/game/gameLogic.ts`, `src/game/WorldEngine.ts` | Collision combinée porte sud (`\|x\|<5.2, \|z+59\|<1.35`) + barrière circulaire du colisée (`hypot(x, z+82) < 21.5`) tant que `!bossGateOpen`, avec glissement X/Z et toast throttlé | Vitest (`gameLogic.test.ts` — 5 assertions) + inspection code | **PASS** *(unit/code)* |
| **BUG-02** | Élevée | `src/game/WorldEngine.ts` | `applySaveData()` resynchronise `symbolRotations = [0,1,2]`, la rotation Y des 3 `totem_symbol`, `crystalLit = [true,true,true]` et `sequenceStep = 3` depuis `solvedPuzzles`, plus gardes post-résolution sur `totem_symbol`/`sequence_switch` | Inspection `WorldEngine.ts` + build TS | **PASS** *(code)* / **NOT TESTED** *(runtime E2E)* |
| **BUG-03** | Élevée | `src/game/WorldEngine.ts` | `respawnAtCamp()` appelle `clearTransientVfxAndHazards()` (météores, piliers, projectiles, ondes, particules), annule `activeChaos`, réinitialise eau/timers/cible, remet PV/phases de Krakoss et ennemis vivants, restaure l’audio et l’atmosphère | Inspection `WorldEngine.ts` + build TS | **PASS** *(code)* / **NOT TESTED** *(runtime E2E)* |
| **BUG-04** | Élevée | `src/game/WorldEngine.ts` | Mutualisation des géométries et matériaux des météores (`sharedMeteorRingGeo/Mat`, `sharedMeteorRockGeo/Mat`) et piliers (`sharedCollapsePillarGeo/Mat`) ; plus aucune allocation de matériau par météore | Inspection `WorldEngine.ts` + `dispose()` | **PASS** *(code)* / **NOT TESTED** *(VRAM GPU)* |
| **BUG-05** | Élevée | `src/game/WorldEngine.ts` | `this.disposableTextures` stocke les 5 `CanvasTexture` ; `dispose()` vide hazards/VFX, déduplique géométries & matériaux (`Set`), libère toutes les textures, `this.scene.environment?.dispose()`, retire listeners (`visibilitychange`, WebGL, window) et `renderer.dispose()` | Inspection `WorldEngine.ts` | **PASS** *(code)* |
| **BUG-06** | Élevée | `src/game/WorldEngine.ts`, `src/App.tsx` | Gestion `webglcontextlost` (`preventDefault()`, arrêt boucle, pause audio, callback UI) et `webglcontextrestored` (re-config SRGB/ACES, qualité, PMREM `RoomEnvironment`, `needsUpdate = true`, recompilation shaders, reprise boucle) + overlay de récupération Dark & Gold | Inspection `WorldEngine.ts` & `App.tsx` + build TS | **PASS** *(code)* / **NOT TESTED** *(perte contexte Chrome/Android)* |
| **BUG-07** | Moyenne | `src/components/GameHUD.tsx`, `src/App.tsx` | `handleCamDown` appelle `setPointerCapture(e.pointerId)` et `onUnlockAudio?.()` (`engine.audio.unlock()`), idem sur `handleJoyStart`, avec `touch-none` sur la zone caméra droite | Inspection `GameHUD.tsx` + build TS | **PASS** *(code)* / **NOT TESTED** *(tactile mobile)* |
| **BUG-08** | Moyenne | `src/game/saveSystem.ts`, `src/game/gameLogic.ts`, `src/components/GameHUD.tsx` | `DEFAULT_SETTINGS.showTouchControls` initialisé via `detectTouchCapableDevice()` ; bannière non bloquante *« Mode Paysage recommandé »* (fermable) en portrait mobile + adaptation compacte du HUD conservant des cibles ≥ 44px | Vitest (`detectTouchCapableDevice`) + build CSS/TS | **PASS** *(code/unit)* / **NOT TESTED** *(écran mobile)* |
| **BUG-09** | Moyenne | `src/game/WorldEngine.ts` | `triggerInteract()` sur PNJ appelle `this.audio.setPaused(true)` et `this.emitHud()` avant `onOpenDialogue(npc)` pour masquer proprement HUD et tutoriel | Inspection `WorldEngine.ts` | **PASS** *(code)* |
| **BUG-10** | Moyenne | `src/game/gameLogic.ts`, `src/game/WorldEngine.ts` | `applyLevelUps()` boucle `while (curLevel < 99 && curXp >= curLevel * 120)` avec plafond stats à `1000` aligné sur `firestore.rules` | Vitest (`gameLogic.test.ts` — 3 tests) | **PASS** |
| **BUG-11** | Moyenne | `src/App.tsx` | `scheduleCloudSave` débounce `saveToCloud()` à `2 500 ms` sur `onStateChange`, annulé au démontage et lors d’une sauvegarde manuelle immédiate | Inspection `App.tsx` + build TS | **PASS** *(code)* |
| **BUG-12** | Moyenne | `src/components/ArtBibleView.tsx`, `src/components/StoreReleaseModal.tsx` | Suivi `mountedRef` + registre `timersRef` nettoyant tous les `window.setTimeout` au démontage des modales | Inspection composants + build TS | **PASS** *(code)* |
| **BUG-13** | Moyenne | `src/firebase.ts`, `src/game/cloudSync.ts`, `src/game/saveSystem.ts` | Redaction de l’e-mail dans `handleFirestoreError`, bornage/assainissement strict des nombres lus depuis `localStorage` et Firestore ; App Check documenté en prérequis infra | `eslint firestore.rules` + Vitest (`worldAndSave.test.ts`) | **PASS** *(code/rules)* |
| **BUG-14** | Moyenne | `package.json`, racine, `public/` | Suppression de `@google/genai`, `dotenv`, `express`, `motion`, `@types/express`, `DRAFT_firestore.rules` et `public/assets/aistudio/Paste_...` | `list_dir`, `npm run lint`, `npm run build` | **PASS** |
| **BUG-15** | Moyenne | `src/App.tsx`, `vite.config.ts` | Lazy-loading `React.lazy` + `Suspense` sur `ArtBibleView`, `CloudProfileModal`, `StoreReleaseModal` et découpage `rolldownOptions.output.manualChunks` (`three-vendor`, `firebase-core`, `firebase-auth`, `react-vendor`) | `npm run build` (`index-*.js` : `1,844 kB` → `194.82 kB`) | **PASS** |
| **BUG-17** | Faible | `src/game/WorldEngine.ts` | Géométrie/matériaux partagés pour projectiles (`sharedProjectileGeo`, `sharedEnemyProjMat`, `sharedPlayerProjMat`) + réutilisation `_v1`/`_v2` | Inspection `WorldEngine.ts` + build TS | **PASS** *(code)* |
| **BUG-19** | Faible | `vite.config.ts` | Remplacement de `__dirname` par `import.meta.dirname` dans `vite.config.ts` | `npm run build` (0 warning `__dirname`) | **PASS** |

---

## 2. Anomalies Non Modifiées (Hors Scope Priorité 1-2 / Dette Mineure)

- **BUG-16 (Faible) :** `EnemyRig.limbs` non animé pendant la marche/attaque — laissé volontairement pour ne pas altérer les animations validées.
- **BUG-18 (Faible) :** Valeurs `'Investigate'` / `'Defend'` dans `EnemyAIState` et champ `templeGateOpen` conservé dans `SaveDataV1` pour compatibilité stricte de schéma `version: 1`.
- **Anti-triche Leaderboard Cloud Function & Firebase App Check :** Prérequis serveur Google Cloud / Play Integrity hors scope client pur.
