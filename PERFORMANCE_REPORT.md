# WORLD CHAOS — RAPPORT DE PERFORMANCE (RELEASE 1.0)

**Date :** 2026-11-18  
**Méthodologie :** Mesures réelles du bundle de production (`npm run build`), analyse statique de complexité de scène Three.js / WebGL2, profils de rendu et consommation mémoire estimée.  
**Important :** Aucun test de framerate sur smartphone Android/iOS physique n’a pu être réalisé dans le conteneur Linux ; les métriques de build sont **mesurées**, les métriques GPU mobiles sont **analytiques**.

---

## 1. Métriques Mesurées du Build de Production (`vite build`)

| Artéfact généré (`dist/`) | Taille brute | Taille gzip | Impact |
|---|---|---|---|
| `assets/index-BTzKgLL3.js` | **1 844.34 kB** | **514.29 kB** | **Élevé** — Chunk unique (> 500 kB warning Vite) |
| `assets/index-CNEKOevY.css` | 39.06 kB | 7.76 kB | Optimal (Tailwind v4 purgé) |
| `workbox-afac4cd2.js` + `sw.js` | ~175.6 kB | — | Service Worker offline |
| `assets/workbox-window.prod.es5-*.js` | 5.65 kB | 2.20 kB | Enregistrement SW |
| Icônes PWA (`192`, `512`, `maskable`, `180`, `svg`) | ~60.6 kB | — | Très léger |
| `manifest.webmanifest` + `index.html` | 2.54 kB | — | Instantané |
| **Total Precache Workbox** | **1 907.40 KiB** (15 entrées) | — | Téléchargement initial ~530 Ko sur réseau compressé |

### Diagnostic Bundle
- Le bundle dépasse le seuil recommandé par Vite (`500 kB`) car **Three.js**, **Firebase (`auth` + `firestore`)**, **React**, et les outils lourds non nécessaires pendant le gameplay immédiat (`ArtBibleView`, `conceptArtGenerator`, `StoreReleaseModal`, `CloudProfileModal`) sont chargés de façon synchrone dans `index.js`.
- **Gain attendu avec code-splitting (`React.lazy` + `manualChunks`) :** Réduction du temps d’exécution JS initial (Parse/Compile sur CPU mobile) de **35 à 45 %**.

---

## 2. Budget GPU & Géométrie de la Scène 3D (`WorldEngine.ts`)

| Système 3D | Géométrie / Technique | Draw Calls estimés | Impact GPU Mobile |
|---|---|---|---|
| Terrain (`240×240m`) | `PlaneGeometry(240, 240, 120, 120)` + vertex colors | 1 | **Moyen** (28 800 triangles statiques) |
| Arbres (`160` max, ~120–130 placés) | 2 `InstancedMesh` (troncs + canopées tintées) | 2 | **Très optimisé** |
| Rochers (`70`) & Nénuphars (`36`) | 2 `InstancedMesh` | 2 | **Très optimisé** |
| Lucioles (`260`) | 1 `THREE.Points` | 1 | **Négligeable** |
| Plan d’eau (`220×220m`) | `MeshPhysicalMaterial` (`clearcoat: 0.9`, `transparent: true`) | 1 | **Moyen-Élevé** (shader PBR + overdraw plein écran sur mobile) |
| PNJ (`5`), Ennemis (`10`), Interactables (`34`), Landmarks | Groupes hiérarchiques multi-mesh | ~90–140 | **Acceptable** (à surveiller sur `LOW`) |
| Particules VFX (Shockwave / Shield) | `THREE.Points` additif (`22` à `52` pts selon qualité) | 0–4 actifs | **Léger** |
| Éclairage & Ombres | `HemisphereLight` + `DirectionalLight` (ombre `1024×1024` PCFSoft) + Rim + Camp `PointLight` + `RoomEnvironment` PMREM | Passe shadow + passe main | **Élevé** si `DPR > 1.5` sur GPU entrée de gamme |

---

## 3. Profils Qualité Graphique Actuels (`WorldEngine.ts:389-401`)

| Paramètre | `LOW` | `MEDIUM` (Défaut) | `HIGH` | Software GL (`SwiftShader` / `llvmpipe`) |
|---|---|---|---|---|
| `PixelRatio` max | `1.0` | `min(dpr, 1.5)` | `min(dpr, 2.0)` | `1.0` |
| Ombres temps réel | Désactivées | Activées (`1024²`) | Activées (`1024²`) | Désactivées |
| Antialiasing | Activé | Activé | Activé | Désactivé |
| Boucle rendu | `requestAnimationFrame` | `requestAnimationFrame` | `requestAnimationFrame` | `gl.fenceSync` + pause 80ms |

---

## 4. Goulots d’Étranglement & Fuites Identifiés

1. **[Élevée — Fuite GPU] Matériaux de météores non libérés (`WorldEngine.ts:2201-2207`) :** À chaque météore de `METEOR_RAIN`, deux matériaux sont créés et jamais `.dispose()` à la suppression.
2. **[Élevée — Fuite GPU sur cycle vie] Textures & PMREM non libérés dans `dispose()` (`WorldEngine.ts:2584-2595`) :** En SPA, si le composant principal remontait, 5 `CanvasTexture` (`256×256` / `128×128`) et la cubemap PMREM resteraient en VRAM.
3. **[Moyenne — Mémoire RAM Images] Cache `conceptArtGenerator.ts` + captures simultanées :**
   - `ArtBibleView` et `StoreReleaseModal` génèrent/stockent chacun 6 DataURL `1280×720` ou viewport complet (~1,5–4 Mo en base64 + bitmaps décodés dans le navigateur). Sur appareils iOS/Android 2–3 Go RAM, ouvrir les deux vues successivement augmente la pression mémoire (risque `webglcontextlost`).
4. **[Moyenne — Overdraw Eau `MeshPhysicalMaterial`] :** L’eau occupe un plan `220×220` même sous le terrain, et utilise `MeshPhysicalMaterial` (`clearcoat: 0.9`). Sur profil `LOW`, basculer l’eau sur `MeshStandardMaterial` (sans clearcoat) ou `MeshLambertMaterial` réduirait nettement le coût fragment shader.
5. **[Moyenne — Garbage Collection en combat] :** Allocations de `THREE.Vector3`, `SphereGeometry` et `MeshStandardMaterial` à chaque projectile `spitter` (`WorldEngine.ts:1927, 2079, 2100`).
6. **[Moyenne — `emitHud()` à 12.5 Hz] :** `hudEmitAccum >= 0.08` déclenche un re-render React de `App.tsx` + `GameHUD.tsx` ~12 fois/sec pendant le jeu. Les propriétés `ZONES.map` et `saveData` sont légères, mais le mémoïsation / séparation du radar éviteraient des re-calculs inutiles.

---

## 5. Recommandations d’Optimisation Priorisées

1. **Corriger la fuite matériaux météores + `dispose()` complet** *(Impact : Stabilité longue session)*.
2. **Code-splitting Vite + `React.lazy`** sur `ArtBibleView`, `StoreReleaseModal`, `CloudProfileModal` et découpage chunks `three` / `firebase` *(Impact : Temps de chargement initial & TTI mobile)*.
3. **Mutualiser géométrie & matériau des projectiles** + utiliser `_v1` dans `updateProjectilesAndVfx` *(Impact : Zéro micro-stutter GC en combat)*.
4. **Profil `LOW` mobile renforcé :** utiliser `MeshStandardMaterial` sur l’eau quand `graphicsQuality === 'LOW'` et désactiver l’antialiasing sur écrans haute densité (`dpr >= 2`) *(Impact : +10 à +15 FPS sur Android d’entrée de gamme)*.
5. **Libération mémoire images :** révoquer/vider le cache `conceptArtGenerator` à la fermeture de `ArtBibleView` ou utiliser `Blob` + `URL.revokeObjectURL`.
