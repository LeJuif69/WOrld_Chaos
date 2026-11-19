# WORLD CHAOS — REGRESSION TEST REPORT (RELEASE 1.0)

**Date :** 2026-11-18  
**Commande globale exécutée après les derniers correctifs :**
```bash
npm test && npm run lint && npm run build && npx eslint firestore.rules
```

---

## 1. Suite Automatisée Vitest (`npm test` — `vitest v5.1.1`)

| Fichier de Test | Couverture | Tests Passés | Durée | Statut |
|---|---|---|---|---|
| `src/game/__tests__/gameLogic.test.ts` | `BUG-01` (porte boss + colisée + barrière sanctuaire), `BUG-10` (multi-level up + cap 99/1000), `BUG-08` (détection tactile) | **9 / 9** | `12 ms` | **PASS** |
| `src/game/__tests__/worldAndSave.test.ts` | Intégrité Monde 1 (10 zones, 10 quêtes, 5 énigmes, 5 PNJ, 34 interactables, 10 objets, 3 pouvoirs), `saveGame`/`loadGame`, assainissement JSON corrompu & valeurs hors bornes | **5 / 5** | `16 ms` | **PASS** |
| `src/game/__tests__/cloudSync.test.ts` | Monotonicité `computeSaveScore()` début → milieu → victoire Chaos Core | **1 / 1** | `8 ms` | **PASS** |
| **Total Vitest** | **3 suites de tests** | **15 / 15** | `1.63 s` | **PASS** |

---

## 2. Vérifications Statiques, Build & Sécurité Post-Correctifs

| Contrôle | Commande | Résultat Exact | Statut |
|---|---|---|---|
| **TypeScript strict (`noEmit`)** | `npm run lint` (`tsc --noEmit`) | `0` erreur | **PASS** |
| **Build de production & PWA** | `npm run build` (`vite build` v8.3.8) | `1.70s` — `index-*.js` `194.82 kB` (`50.20 kB` gzip), 0 warning `__dirname`, 23 entrées precache Workbox (`1,922.32 KiB`) | **PASS** |
| **Security Rules ESLint** | `npx eslint firestore.rules` | Exit code `0` (`0` erreur, `0` warning) | **PASS** |
| **Tests E2E Playwright / WebGL2 GPU réel** | Non disponibles (aucun navigateur GPU headless configuré) | Non exécutés | **NOT TESTED** |
