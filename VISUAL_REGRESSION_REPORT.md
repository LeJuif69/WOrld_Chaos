# VISUAL_REGRESSION_REPORT — WORLD CHAOS V1
**Validation Technique, Non-Régression & Matrice d’Exécution**

## 1. Résumé de Validation Automatisée (Exécutée après Lot 4)
Toutes les vérifications automatisées disponibles dans l’environnement de build ont été exécutées après la dernière modification de code :

| Contrôle | Commande exécutée | Résultat | Détails mesurés |
| --- | --- | --- | --- |
| Tests unitaires & logique | `npm test` (`vitest run`) | **PASS (15/15)** | `gameLogic.test.ts` (9/9), `worldAndSave.test.ts` (5/5), `cloudSync.test.ts` (1/1) |
| Typage TypeScript | `npm run lint` (`tsc --noEmit`) | **PASS (0 erreur)** | Strict check sur tout `src/` |
| Build Production & PWA | `npm run build` (`vite build`) | **PASS (2.13s)** | 1 710 modules, `dist/sw.js` généré (`23 entries`, `1953.35 KiB`), `three-vendor` `556.01 kB` (`137.78 kB` gzip), `index.js` `221.70 kB` (`57.44 kB` gzip), `index.css` `44.07 kB` (`8.78 kB` gzip) |
| Règles Firestore | `npx eslint firestore.rules` | **PASS (0 erreur)** | Aucune règle ou logique Firebase modifiée |
| Audit CSS `backdrop-filter` | `grep -rnE 'backdrop-blur\|backdrop-filter' src` | **PASS (0 occurrence UI)** | Seul un texte descriptif dans `artBibleData.ts` mentionne le terme |

---

## 2. Intégrité Fonctionnelle RC 1.0 Préservée
- **Physique & Navigation** : `getTerrainHeight`, `isBlockedByWorldBarrier`, coordonnées des 10 zones (`ZONES`), positions/IDs des 5 PNJ (`NPCS`) et des 30+ interactables (`INTERACTABLES`) inchangés.
- **Combat & Pouvoirs** : Dégâts, portées, temps de recharge et coûts d’énergie de `shockwave`, `gravity_control`, `chaos_shield`, attaques rapides/lourdes et esquive inchangés.
- **Sauvegardes & Firebase** : Schéma `SaveDataV1`, `saveSystem.ts`, `cloudSync.ts`, `firebase.ts` et `firestore.rules` intacts.
- **Qualité & Sécurité GPU/WebGL2** :
  - Nouvelles textures/bump maps toutes suivies dans `this.disposableTextures` (libération complète dans `dispose()` et ré-upload dans `onWebGLContextRestored`).
  - Particules environnementales (`fireflies`, `campEmbers`, `waterfallMist`) et bursts de combat (`radial_wave`, `shield_dome`, `shield_block`, `hit_spark`) proportionnés à `LOW`/`MEDIUM`/`HIGH` et `isSoftwareGl`.
  - Matériau d’eau commuté automatiquement vers `MeshStandardMaterial` (sans `MeshPhysicalMaterial`) lorsque `graphicsQuality === 'LOW'` ou `isSoftwareGl === true`.

---

## 3. Matrice Honnête : Vérifié vs Non Testé en Conteneur
Conformément aux exigences d’audit, aucune exécution non réalisée n’est déclarée testée :

| Vérification | Statut | Commentaire |
| --- | --- | --- |
| Compilation TS, build Vite/PWA, 15 tests Vitest, ESLint `firestore.rules` | **VERIFIÉ** | Exécutés directement dans l’espace de travail après le dernier changement |
| Rendu WebGL2 réel 60 FPS GPU (Desktop Chrome / Edge) | **NOT TESTED** | Le conteneur headless ne dispose pas d’écran/GPU physique interactif pour inspection visuelle directe |
| Test physique sur smartphone Android (tactile, paysage, TWA/PWA installée) | **NOT TESTED** | À valider sur appareil Android cible en suivant `RELEASE_CHECKLIST.md` |
| Captures visuelles in-engine comparatives avant/après sur écran | **NOT TESTED** | À contrôler visuellement au lancement navigateur (`ArtBibleView` / vue 3D) |
