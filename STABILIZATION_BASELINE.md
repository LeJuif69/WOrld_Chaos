# WORLD CHAOS — STABILIZATION BASELINE (RELEASE 1.0)

**Date :** 2026-11-18  
**Projet :** WORLD CHAOS — THE LIVING WORLDS (Monde 1 : *The Lost Jungle*)  
**Objectif :** Établir l’état initial complet avant application des correctifs de stabilisation Release 1.0 (sans ajout de nouvelle fonctionnalité ni dégradation de l’existant).

---

## 1. État du Dépôt & Contrôle de Version

| Contrôle | État Constaté | Statut |
|---|---|---|
| Dépôt Git | `git status` : `fatal: not a git repository` (environnement sandbox sans historique `.git`) | **PARTIAL** |
| Fichiers critiques identifiés | `src/game/WorldEngine.ts`, `src/game/audio.ts`, `src/game/saveSystem.ts`, `src/game/cloudSync.ts`, `src/game/worldData.ts`, `src/firebase.ts`, `firestore.rules`, `src/App.tsx`, `src/components/GameHUD.tsx`, `vite.config.ts` | **PASS** |
| Audits de référence lus | `AUDIT_FINAL_RELEASE_1.md`, `BUGS_AND_FIXES.md`, `PERFORMANCE_REPORT.md`, `SECURITY_AUDIT.md`, `RELEASE_CHECKLIST.md` | **PASS** |
| Fichiers orphelins initiaux repérés | `DRAFT_firestore.rules` (racine), `public/assets/aistudio/Paste_November_18__2026_-_5_42PM_f9f33479` (32 Ko) | **FAIL** *(nettoyés ensuite)* |

---

## 2. Dépendances Initiales (`package.json` avant nettoyage)

- **Runtime conservé :** `react` (`^19.0.1`), `react-dom` (`^19.0.1`), `three` (`^0.187.0`), `@types/three` (`^0.187.0`), `firebase` (`^13.4.0`), `lucide-react` (`^0.546.0`), `vite` (`^8.3.0`), `vite-plugin-pwa` (`^2.0.0`), `@tailwindcss/vite` (`^4.3.3`), `eslint` (`^10.15.0`), `@firebase/eslint-plugin-security-rules` (`^0.0.2`).
- **Paquets inutilisés détectés (0 import dans `src/`, `vite.config.ts`, `index.html`, `eslint.config.js`) :**
  - `@google/genai`
  - `dotenv`
  - `express`
  - `motion`
  - `@types/express`
- **Tests automatisés initiaux :** Aucun runner ni test unitaire installé (`npm test` inexistant).

---

## 3. Mesures Initiales Avant Modification

| Vérification Baseline | Commande | Résultat Mesuré | Statut |
|---|---|---|---|
| TypeScript check | `npm run lint` (`tsc --noEmit`) | 0 erreur | **PASS** |
| Build production Vite + PWA | `npm run build` (`vite v8.3.8`) | `2.10s`, chunk unique JS `1,844.34 kB` (`514.29 kB` gzip), CSS `39.06 kB` (`7.76 kB` gzip), PWA `15 entries (1907.40 KiB)` | **PARTIAL** *(warning chunk > 500 kB)* |
| Règles Firestore ESLint | `npx eslint firestore.rules` | Exit 0 (0 erreur, 0 warning) | **PASS** |
| FPS GPU réel & session Android physique | Non disponible dans conteneur Linux headless | Aucune télémétrie matérielle mesurable | **NOT TESTED** |

---

## 4. Configurations Firebase & PWA Vérifiées

- **Firebase (`firebase-applet-config.json` & `firestore.rules`) :** Projet `united-builder-tnzsc`, base Firestore `ai-studio-worldchaostheliv-86d66efb-8900-46e2-a0c9-a13370e46898`, règle default-deny + isolation stricte `isOwner(userId)` + leaderboard sans PII.
- **PWA (`vite.config.ts` & `index.html`) :** `display: fullscreen`, `orientation: landscape`, thème `#08110D`, icônes `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, `icon.svg`.
