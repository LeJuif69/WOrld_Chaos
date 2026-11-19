# WORLD CHAOS — AUDIT TECHNIQUE FINAL AVANT RELEASE 1.0

**Projet :** WORLD CHAOS — THE LIVING WORLDS (Monde 1 : *The Lost Jungle*)  
**Date de l’audit :** 2026-11-18  
**Périmètre inspecté :** Code source complet (`src/`), configuration build/PWA (`vite.config.ts`, `index.html`, `package.json`, `tsconfig.json`), sécurité Firebase (`firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`, `eslint.config.js`), actifs (`public/`).  
**Règle d’audit appliquée :** Aucune nouvelle fonctionnalité développée ; aucune modification du gameplay validé ; distinction stricte entre éléments **vérifiés par exécution/inspection** et éléments **non exécutés sur appareil physique**.

---

## 1. Synthèse Exécutive & Verdict Release 1.0

| Domaine Audité | État Actuel | Bloquants Critique | Risques Élevés | Risques Moyens | Risques Faibles | Verdict |
|---|---|---|---|---|---|---|
| **1. Code & Architecture** | Sain, modulaire (`WorldEngine` découplé de React) | 0 | 2 | 4 | 3 | **Prêt après correctifs ciblés** |
| **2. Gameplay (Monde 1)** | 10 zones, 10 quêtes, 5 énigmes, 3 pouvoirs, 4 Chaos, Krakoss | 0 | 3 | 2 | 1 | **Correctifs de collision & persistance recommandés** |
| **3. Mobile & PWA** | Controls tactiles + haptiques + Workbox precache (15 entrées) | 0 | 1 | 4 | 1 | **Garde-fou orientation & perte contexte WebGL requis** |
| **4. Firebase & Sécurité** | Règles `firestore.rules` validées ESLint & déployées | 0 | 0 | 4 | 2 | **Solide (App Check & anti-triche serveur pour V1.1)** |
| **5. Publication Multi-Store** | PWA prête ; TWA/iOS/Steam préparés (wrappers non compilés ici) | 1 (TWA `.well-known` réel) | 1 | 3 | 0 | **Web/PWA prêt ; TWA/iOS/PC à builder en CI/local** |

**Verdict global :** Le cœur logiciel de **WORLD CHAOS V1.0** compile sans erreur TypeScript (`tsc --noEmit`) ni erreur Vite/PWA (`vite build`), et ses règles Firestore passent l’audit `@firebase/eslint-plugin-security-rules`. Avant la **mise en production publique (Google Play TWA + Web/itch.io)**, **5 correctifs prioritaires (Gravité Élevée)** doivent être appliqués (cf. `BUGS_AND_FIXES.md`), et les tests sur GPU physique Android/iOS doivent être exécutés (non disponibles dans ce conteneur Linux sans Chromium GPU ni Android SDK).

---

## 2. Vérifications Effectivement Exécutées vs Non Testées

### 2.1 Vérifications effectivement exécutées lors de cet audit
| Vérification | Commande exécutée | Résultat |
|---|---|---|
| Vérification statique TypeScript | `npm run lint` (`tsc --noEmit`) | **PASS** — 0 erreur |
| Build de production + bundle PWA Workbox | `npm run build` (`vite build`) | **PASS** — `dist/` généré en 2.19s (`15` entrées precache, `1907.40 KiB`) |
| Audit sécurité ESLint des règles Firestore | `npx eslint firestore.rules` | **PASS** — 0 erreur, 0 warning |
| Intégrité des données Monde 1 & Save V1 | `npx tsx -e ...` sur `worldData.ts` & `saveSystem.ts` | **PASS** — `10` zones, `10` quêtes (`5` principales + `5` secondaires), `5` PNJ, `5` énigmes, `34` interactables, `10` objets, `3` pouvoirs, `Save v1` valide |
| Inspection exhaustive du code source | Lecture complète de tous les fichiers `src/`, `public/`, `vite.config.ts`, `firestore.rules`, `package.json` | **PASS** — 100 % des modules inspectés |

### 2.2 Éléments NON testés dans cet environnement (requièrent matériel / navigateur GPU réel)
- Rendu WebGL2 réel à 60 FPS sur GPU mobile (Adreno / Mali / Apple GPU) — conteneur Linux sans GPU physique ni émulateur Android.
- Exécution interactive des 10 zones, du combat temps réel, des 4 événements Chaos et du boss Krakoss en session jouée complète de bout en bout.
- Connexion réelle Google OAuth (`signInWithPopup`) et écriture/lecture Firestore en live dans un navigateur utilisateur.
- Vibration physique (`navigator.vibrate`) sur smartphone Android.
- Emballage et lancement `.aab` via Bubblewrap (TWA), Xcode/Capacitor (iOS) et Tauri/Electron (PC).

---

## 3. Audit Détaillé par Axe

### 3.1 Code & Architecture (`src/`)
- **Points forts :**
  - Séparation stricte entre boucle WebGL2 (`src/game/WorldEngine.ts`) et UI React (`src/App.tsx`, `src/components/*`), évitant tout démontage du canvas lors des mises à jour HUD.
  - Réutilisation d’objets mathématiques scratch (`_v1`, `_v2`, `_v3`, `_camTarget`, `_camPos`, `_color`, `_fogColor`, `_skyColor`) dans la boucle principale (`WorldEngine.ts:40-47`).
  - Audio 100 % procédural multi-bus (`src/game/audio.ts`) et textures procédurales (`src/game/textures.ts`) sans dépendances réseau audio/texture externes fragiles.
- **Problèmes identifiés :**
  - **[Élevée]** Fuite GPU dans `updateChaosEngine` (`WorldEngine.ts:2201-2207`) : `m.ring.material` et `m.rock.material` ne sont jamais libérés (`.dispose()`) à la destruction des météores.
  - **[Élevée]** Nettoyage incomplet dans `WorldEngine.dispose()` (`WorldEngine.ts:2584-2595`) : les 5 `CanvasTexture` procédurales, `this.scene.environment` (PMREM) et les listes actives (`projectiles`, `shockRings`, `particleBursts`, `meteors`, `collapsePillars`) ne sont pas explicitement libérés/vidés.
  - **[Moyenne]** Allocations GC par frame sur projectiles (`WorldEngine.ts:1927, 2079-2088, 2100`) : `new THREE.Vector3` et nouvelles paires géométrie/matériau créées à chaque tir au lieu de ressources partagées.
  - **[Moyenne]** 5 dépendances déclarées dans `package.json` sont totalement inutilisées dans le code (`@google/genai`, `dotenv`, `express`, `motion`, `@types/express`), plus un artefact orphelin `public/assets/aistudio/Paste_November_18__2026_-_5_42PM_f9f33479` (32 Ko) et `DRAFT_firestore.rules` à la racine.
  - **[Moyenne]** Timers `setTimeout` non annulés au démontage dans `ArtBibleView.tsx:216-237` et `StoreReleaseModal.tsx:65-82`.
  - **[Faible]** Code/états morts : `EnemyAIState` déclare `'Investigate'` et `'Defend'` (`types.ts:22,25`) non utilisés dans `updateEnemies` ; `EnemyRig.limbs` (`models.ts`) n’est jamais animé dans `WorldEngine.ts` ; `onOpenChestOrPopup` (`App.tsx:109`) est un no-op ; `worldState.templeGateOpen` (`WorldEngine.ts:1297`) n’est associé à aucun obstacle bloquant.

### 3.2 Gameplay (Monde 1 : *The Lost Jungle*)
- **Zones (10/10 vérifiées dans `worldData.ts`) :** `arrival`, `camp`, `wild_jungle`, `river`, `ancient_ruins`, `hidden_cave`, `forgotten_temple`, `chaos_zone`, `boss_arena`, `secret_sanctuary`. La détection de zone la plus proche (`WorldEngine.ts:2291-2299`) et les transitions `fogColor`/`skyColor` + audio dynamique multi-stems (`jungle`, `temple`, `combat`) sont continues et cohérentes.
- **Problèmes identifiés :**
  - **[Élevée]** Contournement de la porte du Boss (`WorldEngine.ts:1778`) : la collision ne bloque que `|nextX| < 5 && |nextZ + 59| < 1.2`, alors que le colisée (`boss_arena`, rayon 20m) possède des colonnes espacées de ~10,4m sans collision latérale. Un joueur peut contourner la porte par `x = ±6` et entrer dans l’arène de Krakoss avant de stabiliser l’Obélisque Chaos (`bossGateOpen = false`).
  - **[Élevée]** État visuel des énigmes non restauré au chargement (`WorldEngine.ts:276-278, 942-983`) : `symbolRotations` (`totem_1..3`), `crystalLit` (`crys_1..3`) et `sequenceStep` ne sont pas resynchronisés depuis `saveData.worldState.solvedPuzzles` après `loadFromSave()`.
  - **[Élevée]** Réinitialisation partielle sur défaite (`WorldEngine.ts:1021-1028`) : `respawnAtCamp()` ne purge ni `activeChaos`, ni `meteors`/`projectiles` en vol, ni le verrou de cible, et laisse les PV entamés de Krakoss sans réinitialiser le combat si le joueur meurt dans l’arène.
  - **[Moyenne]** `checkLevelUp()` (`WorldEngine.ts:1458-1469`) utilise un `if` au lieu d’un `while`, empêchant un double passage de niveau si un gain d’XP dépasse deux seuils d’un coup.
  - **[Moyenne]** `triggerInteract()` sur PNJ (`WorldEngine.ts:1210`) passe `screenMode = 'paused'` sans appeler `this.emitHud()`, laissant le HUD et le tutoriel visibles sous la boîte de dialogue jusqu’à la fermeture.
  - **[Faible]** Absence de vérification d’angle/cône frontal sur les attaques de mêlée (`WorldEngine.ts:1820-1825`) : toutes les cibles dans un cercle 360° autour du joueur sont touchées (acceptable en action-aventure mobile, à confirmer selon le ressenti souhaité).

### 3.3 Mobile, Ergonomie Paysage & PWA Hors Ligne
- **Points forts :**
  - Manifeste PWA complet (`dist/manifest.webmanifest` : `display: fullscreen`, `orientation: landscape`, icônes `192`, `512`, `maskable 512`, `apple-touch-icon.png` 180px).
  - Precache Workbox généré (`15` fichiers, `1907.40 KiB`) + `OfflineIndicator` réactif (`useOnlineStatus.ts`).
  - Contrôles tactiles avec cibles ≥ 44px (`GameHUD.tsx`) et retours haptiques différenciés (`src/game/haptics.ts`) désactivables dans les paramètres.
- **Problèmes identifiés :**
  - **[Élevée]** Absence de gestion `webglcontextlost` / `webglcontextrestored` sur le canvas WebGL2 (`WorldEngine.ts`): sur mobile après passage en arrière-plan, une perte de contexte fige l’écran sans message ni reprise.
  - **[Moyenne]** Absence de capture de pointeur (`setPointerCapture`) et de déverrouillage audio (`audio.unlock()`) sur la zone caméra tactile droite (`GameHUD.tsx:94-107`) : glisser le pouce de droite vers la moitié gauche interrompt la rotation caméra.
  - **[Moyenne]** Aucun écran « Tournez votre appareil en paysage » ni appel `screen.orientation?.lock('landscape')` : en mode portrait mobile (~375px de large), le HUD haut et les boutons tactiles du bas se chevauchent.
  - **[Moyenne]** `DEFAULT_SETTINGS.showTouchControls` vaut `true` même sur ordinateur de bureau (affiche sticks/boutons tactiles par défaut au lieu d’une détection `pointer: coarse` / `maxTouchPoints > 0`).
  - **[Moyenne]** Bundle JS unique de **`1 844.34 kB`** (`514.29 kB` gzip) sans découpage (`manualChunks` / `React.lazy`), augmentant le temps d’analyse JS au démarrage sur téléphones d’entrée de gamme.
  - **[Faible]** Polices Google Fonts (`index.html:21`) : nécessitent une première visite en ligne pour être mises en cache Workbox ; hors ligne dès la toute première ouverture (WebView embarquée), bascule propre sur `system-ui`/`monospace`.

### 3.4 Firebase (Auth, Firestore, Isolation & Sync)
- Voir le rapport dédié `SECURITY_AUDIT.md`.
- Synthèse : Isolation stricte par UID + `email_verified == true` vérifiée par ESLint (`npx eslint firestore.rules` : 0 erreur). Risques principaux : validation partielle de la liste `inventory` (index `[0]` uniquement dans `firestore.rules:60`), absence d’anti-triche serveur sur `/leaderboard/{userId}`, absence de Firebase App Check, et écritures cloud non déboundées (`App.tsx:115-117`) sur chaque micro-événement.

### 3.5 Évaluation de Publication par Plateforme
| Plateforme | Niveau de Préparation | État Réel | Actions Restantes Avant Soumission |
|---|---|---|---|
| **Web (Cloud Run / Firebase Hosting / itch.io HTML5)** | **90 % — Quasi prêt** | `dist/` complet, `index.html` SEO/OG cohérent, 100 % autonome | Appliquer correctifs code Élevés, supprimer `public/assets/aistudio/` & dépendances inutilisées, zipper `dist/` pour itch.io |
| **PWA Hors Ligne** | **88 % — Fonctionnel (build vérifié)** | `sw.js`, `manifest.webmanifest`, `OfflineIndicator`, `usePWAInstall` | Découper le chunk 1.84 Mo, tester installation Chrome Android & mode avion sur appareil réel |
| **Android TWA (Google Play Store)** | **65 % — Kit prêt, binaire `.aab` à générer** | Générateur `assetlinks.json` + commandes Bubblewrap dans `StoreReleaseModal` | Déployer en HTTPS permanent, générer `.aab` via Bubblewrap, placer le vrai SHA-256 Play App Signing dans `/.well-known/assetlinks.json`, tester sur Android |
| **iOS (App Store / Capacitor)** | **45 % — PWA iOS prête, wrapper natif absent** | Meta tags Apple + guide installation Safari + garde `navigator.vibrate` | Aucun dossier `ios/` Capacitor présent ; créer wrapper Capacitor sur macOS/Xcode, gérer safe-areas notch & verrou paysage |
| **PC Desktop & Steam (Tauri/Electron)** | **40 % — Build Web prêt, wrapper bureau absent** | Contrôles clavier/souris complets ; guide Steam dans `StoreReleaseModal` | Aucun projet `src-tauri/` ou Electron présent ; ajouter wrapper bureau, support manette (Gamepad API) et SDK Steamworks si nécessaire |
