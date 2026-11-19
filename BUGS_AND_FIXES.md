# WORLD CHAOS — BUGS & CORRECTIFS RECOMMANDÉS (RELEASE 1.0)

Chaque anomalie ci-dessous a été identifiée par inspection directe du code source et classée par gravité. Conformément à la consigne d’audit (*ne développer aucune nouvelle fonctionnalité et ne rien casser sans justification*), ce document recense les défauts exacts, leur emplacement et le correctif chirurgical à appliquer avant la mise en ligne publique.

---

## Récapitulatif par Gravité

- **Critique (Bloquant Release immédiate) :** 0 dans le code applicatif ; 1 prérequis infra TWA (`/.well-known/assetlinks.json` réel à héberger).
- **Élevée (À corriger avant Release 1.0) :** 6 anomalies.
- **Moyenne (Fortement recommandé avant/pour Release 1.0) :** 9 anomalies.
- **Faible (Nettoyage / Dette technique) :** 4 anomalies.

---

## 1. Anomalies de Gravité ÉLEVÉE

### BUG-01 — Contournement possible de la porte du Boss (`bossGateMesh`)
- **Fichier :** `src/game/WorldEngine.ts` (lignes 622–645 et 1776–1787)
- **Cause :** La collision de `bossGateOpen` ne bloque que la bande centrale `Math.abs(nextX) < 5 && Math.abs(nextZ + 59) < 1.2`, alors que les piliers du colisée (`boss_arena`, rayon 20m autour de `(0, -82)`) sont espacés de ~10,4m sans collision physique. Le joueur peut simplement contourner à `x = ±6` et affronter Krakoss avant d’avoir obtenu le *Chaos Shield* et stabilisé l’Obélisque.
- **Correctif recommandé :** Tant que `!this.saveData.worldState.bossGateOpen`, imposer une barrière circulaire autour du colisée (`Math.hypot(nextX, nextZ + 82) < 22.5`) ou bloquer les entrées latérales, avec un toast explicatif clair.

### BUG-02 — État visuel des énigmes et objets résolus non restauré après `loadFromSave`
- **Fichier :** `src/game/WorldEngine.ts` (lignes 276–278 et 942–983)
- **Cause :** `symbolRotations`, `sequenceStep` et `crystalLit` sont stockés uniquement en mémoire vive sur l’instance `WorldEngine`. Lorsqu’un joueur résout une énigme, sauvegarde, recharge l’application et clique sur *Continuer l’aventure*, `worldState.solvedPuzzles` contient l’ID résolu, mais les totems ne sont pas orientés sur `[0, 1, 2]` et les flags locaux restent réinitialisés.
- **Correctif recommandé :** Dans `applySaveData(data)`, si `data.worldState.solvedPuzzles.includes('puzzle_symbols')`, fixer `this.symbolRotations = [0, 1, 2]` et orienter les 3 `totem_symbol` ; si `'puzzle_crystals'` est résolue, fixer `this.crystalLit = [true, true, true]` ; si `'puzzle_sequence'` est résolue, fixer `this.sequenceStep = 3` et désactiver les plaques.

### BUG-03 — Réapparition au camp (`respawnAtCamp`) incomplète après une défaite
- **Fichier :** `src/game/WorldEngine.ts` (lignes 1021–1028 et 2071–2075)
- **Cause :** Lors d’une défaite pendant un événement `METEOR_RAIN` ou face à Krakoss :
  1. `this.activeChaos`, `this.meteors` et `this.projectiles` ne sont pas nettoyés lors du `respawnAtCamp()`.
  2. Les PV du boss Krakoss restent entamés entre deux morts, permettant d’user le boss sans réinitialiser la rencontre.
  3. `this.attackTimer`, `this.dodgeTimer` et `this.lockedEnemyId` ne sont pas remis à zéro.
- **Correctif recommandé :** Nettoyer projectiles/météores actifs, réinitialiser `activeChaos = null`, remettre les PV des ennemis vivants (et de Krakoss s’il n’est pas encore `bossDefeated`) à `e.maxHp` avec `e.state = 'Idle'`, et restaurer `this.audio.setPaused(false)`.

### BUG-04 — Fuite mémoire GPU sur les matériaux des météores (`METEOR_RAIN`)
- **Fichier :** `src/game/WorldEngine.ts` (lignes 2201–2207 et 2263–2277)
- **Cause :** Chaque météore crée un `MeshBasicMaterial` (anneau) et un `MeshStandardMaterial` (roche), mais la suppression ne dispose que les géométries (`m.ring.geometry.dispose()`, `m.rock.geometry.dispose()`), jamais `.material.dispose()`. Sur de longues sessions ou dans la `chaos_zone`, cela accumule des programmes/shaders GPU non libérés.
- **Correctif recommandé :** Partager une géométrie et un matériau uniques pour les anneaux/roches de météores, ou appeler `(m.ring.material as THREE.Material).dispose()` et `(m.rock.material as THREE.Material).dispose()` lors de la suppression et dans `dispose()`.

### BUG-05 — Nettoyage incomplet de `WorldEngine.dispose()`
- **Fichier :** `src/game/WorldEngine.ts` (lignes 359–361, 405–409, 2570–2596)
- **Cause :** `dispose()` parcourt `this.scene` pour les `Mesh`/`Points`, mais oublie :
  - `this.scene.environment?.dispose()` (texture PMREM `RoomEnvironment`),
  - les `CanvasTexture` (`grassTex`, `stoneTex`, `barkTex`, `waterTex`, `shadowTex`),
  - le vidage des tableaux (`projectiles`, `shockRings`, `particleBursts`, `meteors`, `collapsePillars`).
- **Correctif recommandé :** Stocker les 5 textures créées dans `this.disposableTextures: THREE.Texture[]`, les libérer dans `dispose()` ainsi que `this.scene.environment?.dispose()`, et vider tous les tableaux runtime.

### BUG-06 — Absence de gestion de perte de contexte WebGL (`webglcontextlost`)
- **Fichier :** `src/game/WorldEngine.ts` (`initThree` / `bindWindowEvents`) et `src/App.tsx`
- **Cause :** Sur Android Chrome, iOS Safari ou TWA après mise en veille ou changement d’application, le système peut révoquer le contexte WebGL2. Sans écouteur `webglcontextlost`, `requestAnimationFrame` continue à tourner sur un contexte mort ou l’écran reste figé sans possibilité de reprise.
- **Correctif recommandé :** Ajouter `dom.addEventListener('webglcontextlost', ...)` avec `e.preventDefault()` + mise en pause et callback UI clair, et `dom.addEventListener('webglcontextrestored', ...)` pour relancer le rendu ou proposer un rechargement propre.

---

## 2. Anomalies de Gravité MOYENNE

### BUG-07 — Zone tactile caméra droite sans `setPointerCapture` ni `audio.unlock()`
- **Fichier :** `src/components/GameHUD.tsx` (lignes 94–107 et 152–160)
- **Cause :** `handleCamDown` ne capture pas le pointeur (`e.currentTarget.setPointerCapture(e.pointerId)`). Si le pouce droit glisse à gauche de la ligne médiane (`left-1/2`), l’événement `onPointerMove` cesse de suivre le doigt. De plus, toucher d’abord la zone caméra ne déclenche pas `audio.unlock()` (contrairement au canvas sous-jacent).
- **Correctif recommandé :** Appeler `setPointerCapture(e.pointerId)` dans `handleCamDown` et déverrouiller l’audio au premier geste tactile.

### BUG-08 — Chevauchement HUD en orientation portrait mobile & défaut tactile sur Desktop
- **Fichiers :** `src/components/GameHUD.tsx` (lignes 163–456) et `src/game/saveSystem.ts` (ligne 16)
- **Cause :**
  1. Sur smartphone tenu en portrait (`~360–390px` de large), les deux blocs du haut (`w-60` + barre d’icônes) et le bas (`w-28` stick + boutons combat) se touchent ou débordent. Aucun message « Mode Paysage recommandé » n’est affiché.
  2. `DEFAULT_SETTINGS.showTouchControls` est figé à `true`, affichant le stick et les boutons tactiles à l’écran même sur PC souris/clavier tant que le joueur ne va pas dans les Paramètres.
- **Correctif recommandé :** Initialiser `showTouchControls` via détection hybride (`window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0`) et ajouter une invite non bloquante / adaptation responsive en portrait (`@media (orientation: portrait)`).

### BUG-09 — `triggerInteract()` lors d’un dialogue PNJ ne synchronise pas React (`emitHud`)
- **Fichier :** `src/game/WorldEngine.ts` (lignes 1207–1214)
- **Cause :** `this.screenMode = 'paused'` est défini avant `this.callbacks.onOpenDialogue(npc)` sans appeler `this.emitHud()`. Dans `App.tsx`, `hud.screen` reste `'playing'` pendant tout le dialogue, laissant `<GameHUD>` et `<TutorialOverlay>` montés derrière le modal.
- **Correctif recommandé :** Appeler `this.emitHud()` (ou `this.setScreenMode('paused')`) avant `onOpenDialogue(npc)`.

### BUG-10 — `checkLevelUp()` ne gère qu’un niveau par appel
- **Fichier :** `src/game/WorldEngine.ts` (lignes 1458–1469)
- **Cause :** `if (this.saveData.xp >= needed)` au lieu de `while (this.saveData.xp >= this.saveData.level * 120)`.
- **Correctif recommandé :** Remplacer `if` par `while` (avec plafond `level < 99` cohérent avec `firestore.rules:56`).

### BUG-11 — Écritures Cloud Firestore non déboundées (`saveToCloud`)
- **Fichier :** `src/App.tsx` (lignes 110–119)
- **Cause :** Chaque `onStateChange()` (ramassage de baie, ennemi vaincu, objet utilisé, dialogue) appelle immédiatement `saveToCloud(snap)` si l’utilisateur est connecté. Une rafale d’actions génère autant d’écritures Firestore inutiles et de `JSON.stringify` locaux.
- **Correctif recommandé :** Débouncer `saveToCloud` (ex. 2 500 ms) tout en gardant `saveGame()` synchrone sur les points critiques (feu de camp, fin de quête, boss, pause/fermeture).

### BUG-12 — Timers `setTimeout` non nettoyés au démontage dans `ArtBibleView` et `StoreReleaseModal`
- **Fichiers :** `src/components/ArtBibleView.tsx` (lignes 216–237, 260–263) et `src/components/StoreReleaseModal.tsx` (lignes 60–87)
- **Cause :** Fermer l’écran avant la fin de la séquence de captures laisse les `setTimeout` s’exécuter et appeler `setState` sur un composant démonté.
- **Correctif recommandé :** Enregistrer un `cancelled = false` (cleanup `useEffect`) et un tableau de IDs de timers à nettoyer via `clearTimeout`.

### BUG-13 — Validation partielle de `inventory` dans `firestore.rules` & absence de App Check
- **Fichier :** `firestore.rules` (lignes 59–62)
- **Cause :** Seul `data.inventory[0] is map` est vérifié (limitation native des règles Firestore sans boucle sur liste), et aucune vérification App Check n’est activée.
- **Correctif recommandé :** Documenter l’activation Firebase App Check (reCAPTCHA v3 / Play Integrity) avant montée en charge, et valider chaque champ côté Cloud Function pour le classement compétitif.

### BUG-14 — Dépendances npm inutilisées & fichier orphelin dans `public/`
- **Fichiers :** `package.json` (`@google/genai`, `dotenv`, `express`, `motion`, `@types/express`) et `public/assets/aistudio/Paste_November_18__2026_-_5_42PM_f9f33479` (32 Ko) et `DRAFT_firestore.rules`.
- **Correctif recommandé :** Désinstaller les paquets non importés, supprimer l’artefact `public/assets/aistudio/` et `DRAFT_firestore.rules` du dépôt de release.

### BUG-15 — Chunk JavaScript monolithique de 1 844 Ko (sans code-splitting)
- **Fichier :** `vite.config.ts` & `src/App.tsx`
- **Cause :** Three.js, Firebase et les vues modales (`ArtBibleView`, `StoreReleaseModal`, `CloudProfileModal`) sont importés statiquement au démarrage.
- **Correctif recommandé :** Utiliser `React.lazy` pour les modales secondaires et `manualChunks` (`three`, `firebase`, `react-vendor`) dans Vite pour réduire le bundle initial critique (~500–600 Ko au lieu de 1 844 Ko).

---

## 3. Anomalies de Gravité FAIBLE

### BUG-16 — `EnemyRig.limbs` construit mais non animé
- **Fichiers :** `src/game/models.ts` (`limbs`) & `src/game/WorldEngine.ts` (`updateEnemies`)
- **Impact :** Les membres des Stalkers/Sentinels/Krakoss restent statiques lors des déplacements et attaques (seul le noyau cristal tourne).

### BUG-17 — Allocations `Vector3` & géométries par projectile
- **Fichier :** `src/game/WorldEngine.ts` (lignes 1927, 2079–2088, 2100)
- **Impact :** Légère pression GC lors des combats contre plusieurs `Thorn Spitters`. Remplaçable par `_v1` et un cache `SphereGeometry`/`MeshStandardMaterial`.

### BUG-18 — États morts `EnemyAIState` (`'Investigate'`, `'Defend'`) et drapeau `templeGateOpen`
- **Fichiers :** `src/game/types.ts` (lignes 22, 25) et `src/game/WorldEngine.ts` (ligne 1297)
- **Impact :** Aucun bug runtime, simple dette de typage / modélisation.

### BUG-19 — Avertissement Vite `__dirname` dans `vite.config.ts`
- **Fichier :** `vite.config.ts` (ligne 105)
- **Impact :** Warning console au build Vite 8 (`Use import.meta.dirname instead`).
