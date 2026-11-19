# WORLD CHAOS — PERFORMANCE VALIDATION (RELEASE 1.0)

**Date :** 2026-11-18  
**Méthodologie :** Mesures comparatives réelles avant/après sur `npm run build` (`vite v8.3.8`) et analyse vérifiée des pipelines GPU/CPU dans `WorldEngine.ts`, `App.tsx`, `vite.config.ts`. Les métriques de rendu GPU temps réel sur smartphone ne peuvent pas être exécutées dans ce conteneur Linux headless et sont marquées `NOT TESTED`.

---

## 1. Comparatif Bundle JS Avant / Après Stabilisation (`vite build`)

| Métrique | Baseline Avant | Après Stabilisation | Delta | Statut |
|---|---|---|---|---|
| **Chunk applicatif principal (`index-*.js`)** | `1,844.34 kB` (`514.29 kB` gzip) | **`194.82 kB` (`50.20 kB` gzip)** | **-89.4 %** (-1,649.5 kB) | **PASS** |
| **Chunk `react-vendor-*.js`** | Inclus dans `index` | `438.24 kB` (`134.24 kB` gzip) | Isolé & cacheable | **PASS** |
| **Chunk `three-vendor-*.js`** | Inclus dans `index` | `556.01 kB` (`137.78 kB` gzip) | Isolé & cacheable | **PARTIAL** *(>500 kB brut mono-lib Three.js)* |
| **Chunks Firebase (`firebase-core` + `firebase-auth`)** | Inclus dans `index` | `464.86 kB` + `99.67 kB` | Auth séparée | **PASS** |
| **Modales différées (`React.lazy`)** | Chargées au démarrage | `ArtBibleView` (`61.66 kB`), `StoreReleaseModal` (`27.52 kB`), `CloudProfileModal` (`14.54 kB`) | Chargement à la demande | **PASS** |
| **CSS Tailwind v4** | `39.06 kB` (`7.76 kB` gzip) | `40.31 kB` (`7.92 kB` gzip) | +1.25 kB (banner portrait) | **PASS** |
| **Temps de build total** | `2.10s` | **`1.70s`** | -19 % | **PASS** |
| **Precache PWA Workbox** | `15` entrées (`1,907.40 KiB`) | `23` entrées (`1,922.32 KiB`) | +0.78 % | **PASS** |

---

## 2. Optimisations GPU / CPU Appliquées dans le Moteur 3D

| Optimisation | Détail Technique | Risque Visuel | Statut |
|---|---|---|---|
| **Matériau eau allégé sur `LOW` / Software GL** | `createWaterMaterial()` / `syncWaterMaterialForQuality()` utilise `MeshStandardMaterial` (sans `clearcoat: 0.9`) en `LOW` tout en conservant `MeshPhysicalMaterial` en `MEDIUM`/`HIGH` | Aucun en `MEDIUM`/`HIGH`, gain shader fragment en `LOW` | **PASS** *(code)* |
| **Mutualisation géométries & matériaux hazards/projectiles** | Météores, piliers `COLLAPSE` et projectiles utilisent désormais 7 ressources GPU partagées créées une fois dans `buildWorld()` et libérées dans `dispose()` | Aucun | **PASS** *(code)* |
| **Réduction allocations GC boucle combat** | Suppression de `new THREE.Vector3` à chaque tir spitter & hit projectile grâce à `_v1` / `_v2` | Aucun | **PASS** *(code)* |
| **Débouncing des écritures Cloud Firestore** | `scheduleCloudSave` regroupe les sauvegardes automatiques à `2 500 ms` au lieu d’écrire à chaque micro-action | Aucun | **PASS** *(code)* |
| **Pause audio & horloge en arrière-plan (`visibilitychange`)** | Suspension `AudioContext` + réinitialisation `lastTime` au retour pour éviter les sauts `dt` et la consommation batterie | Aucun | **PASS** *(code)* |

---

## 3. Mesures Runtime GPU & Mémoire (Non Exécutables en Sandbox)

| Test Runtime Cible | Résultat | Statut |
|---|---|---|
| FPS mesuré en jeu sur navigateur GPU bureau (60 FPS cible) | Non mesuré (conteneur sans GPU Chromium) | **NOT TESTED** |
| FPS mesuré sur smartphone Android (`LOW` / `MEDIUM`) | Non mesuré (appareil Android requis) | **NOT TESTED** |
| Consommation RAM / VRAM durant `METEOR_RAIN` prolongé (20 min) | Non mesurée en profiler Chrome | **NOT TESTED** |
| Transition de zones × 10 sans micro-stutter | Non mesurée en profiler Chrome | **NOT TESTED** |
