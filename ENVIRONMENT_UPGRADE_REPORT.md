# ENVIRONMENT_UPGRADE_REPORT — WORLD CHAOS V1
**Monde 1 : The Lost Jungle — Environnements 3D, PBR, Personnages & VFX**

## 1. Textures Procédurales & Relief PBR (`src/game/textures.ts`)
Toutes les textures sont 100 % procédurales (canvas 2D déterministe avec PRNG seedé `mulberry32`), bouclées sans couture (*seamless wrapping* sur les tuiles), encodées en `THREE.SRGBColorSpace` pour l’albédo et en `THREE.NoColorSpace` linéaire pour les *bump maps*. Chaque instance est référencée dans `this.disposableTextures` pour nettoyage strict au `dispose()` et ré-upload sur `webglcontextrestored`.

| Asset | Résolution | Espace Couleur | Détails procéduraux ajoutés |
| --- | --- | --- | --- |
| `createGrassTexture` & `createGrassBumpTexture` | `512×512` | sRGB / Linéaire | Brins d’herbe multi-teintes, trèfles/touffes de mousse, grains de terre sombre et carte de micro-relief |
| `createStoneTexture` & `createStoneBumpTexture` | `512×512` | sRGB / Linéaire | Blocs de basalte/calcaire joints, veinage minéral, mousses de fissures et joints creusés sur bump map |
| `createBarkTexture` & `createBarkBumpTexture` | `256×256` | sRGB / Linéaire | Stries d’écorce sinueuses organiques, nœuds de bois et taches de lichen |
| `createWaterTexture` | `256×256` | sRGB | Caustiques sinusoïdales bouclées (`this.waterTex` pour la rivière et clone `this.waterfallTex` pour la cascade) |
| `createObsidianTexture` | `256×256` | sRGB | Verre volcanique sombre fracturé avec veines magmatiques améthyste/carmin |

---

## 2. Transformation des 10 Zones (`src/game/WorldEngine.ts` & `src/game/models.ts`)

1. **01. The Arrival** : Sky-skiff échoué enrichi d’une quille en laiton doré, d’un propulseur cylindrique et d’une caisse d’expédition à proximité sans modifier les points de collision ou le `Expedition Compass`.
2. **02. The Camp** : `buildCampGroup` doté de jupes de tentes émeraude, de faîtières en laiton, de caisses cerclées, de bûches croisées dans l’âtre, d’une double flamme animée (externe ambre + cœur doré), d’un système d’braises montantes (`campEmbers`) et de pierres de garde sur plinthes étagées à gemmes turquoise.
3. **03. The Wild Jungle** : Biomes teintés par *vertex color* dégradé radial sur le terrain, double couronne sur 100 % des arbres instanciés (`buildInstancedJungle`) + 160 fougères tropicales en sous-bois + 85 rochers teintés par biome.
4. **04. The River** : Rivière animée par double défilement UV (`waterTex.offset`) et matériau adaptatif (`MeshPhysicalMaterial` à `clearcoat` en MEDIUM/HIGH, `MeshStandardMaterial` en LOW/SoftwareGL), 42 nénuphars instanciés et pont-levis doté de garde-corps en laiton.
5. **05. The Ancient Ruins** : Colonnes cannelées surmontées de chapiteaux et d’un linteau sculpté à frise dorée au-dessus du sanctuaire de gravité.
6. **06. The Hidden Cave** : Remplacement du plafond cubique plat par une voûte naturelle multi-blocs en roche saphir (`DodecahedronGeometry`) éclairée par une lumière froide saphir (`PointLight`, `castShadow = false`) et précédée d’une cascade double couche avec anneau d’écume et particules de brume montantes (`waterfallMist`).
7. **07. The Forgotten Temple** : `buildForgottenTemple` enrichi de pilastres d’angle, de nappes de mousse retombantes sur les gradins, de **14 marches d’escalier sculptées** flanquées de balustrades dorées, d’un portique sommital à linteau d’or et de deux braseros rituels flamboyants au pied des degrés.
8. **08. The Chaos Zone** : Sol teinté obsidienne/améthyste, 7 pierres flottantes en lévitation, 14 flèches d’obsidienne fracturée (`spireInst`) ceinturant la cuvette du Rift, et obélisque vertical fracturé.
9. **09. The Secret Sanctuary** : `buildSanctuarySacredTree` (tronc noueux à 5 racines-contreforts, couronne émeraude bioluminescente multi-niveaux, 6 cristaux suspendus et lueur turquoise dédiée) et barrière cristalline hérissée de pointes prismatiques.
10. **10. The Boss Arena** : Colisée d’obsidienne à 12 colonnes dotées de socles, chapiteaux d’or antique et braseros carmin, encadrant le socle doré du *Jungle Chaos Core*.

---

## 3. Éclairage 3 Points, Atmosphère & Budget GPU
- **Transition atmosphérique continue par zone (`updateZoneAtmosphere`)** : interpolation fluide (`lerp`) de `hemiLight.color`, `hemiLight.groundColor`, `sunLight.color`, `sunLight.intensity`, `rimLight.color`, `fog.color`, `fog.density` et `renderer.toneMappingExposure` selon chacune des 10 zones et l’état Chaos actif.
- **Budget lumières dynamiques respecté** : 3 `PointLight` locales max (`Camp`, `Hidden Cave`, `Secret Sanctuary`), toutes avec `castShadow = false` et portée courte (`24–28 m`).

---

## 4. Héros, PNJ, Ennemis, Boss Krakoss & Correctif `BUG-16`
- **Explorateur (`buildExplorerModel`)** : Tunique doublée, baudrier de cuir et col sombre, anneau de boussole lumineux sur le sac à dos, chapeau ceinturé d’or avec monture de lunettes en laiton et lame énergétique facettée effilée avec garde croisée dorée (rotation de géométrie en `+Z` préservant `blade.scale.z` en attaque). Animation enrichie par inclinaison avant en esquive (`dodgeTimer > 0`) et torsion du buste en frappe.
- **PNJ (`buildNpcModel`)** : Ceinture en laiton et accessoires de rôle distinctifs via `roleId` (parchemin cartographique pour Lyra, clé/marteau en laiton pour Kael, bâton cristallin/doré pour Orin et Veyra, orbe émeraude en lévitation pour Tarek), tout en conservant `npc_beacon`.
- **Ennemis & Boss Krakoss** :
  - *Stalker* : Crête dorsale d’obsidienne, double regard carmin, museau affûté et 4 pattes pivotées à la hanche.
  - *Spitter* : Épines améthyste le long de la tige et calice à 4 pétales flexibles.
  - *Sentinel* : Épaulières et plastron d’or antique, visière lumineuse ambre et bras pivotés à l’épaule.
  - *Boss Krakoss* : Ceinture dorée, 3 côtes de magma carmin sur le torse, cornes d’obsidienne flanquant la couronne, halo corrompu flottant à 6 éclats (`boss_halo`) et gantelets dorés.
- **Correctif `BUG-16` (`updateEnemies`)** : Animation complète des membres (`e.rig.limbs`) et de la posture (`e.rig.body`) pour chaque famille : foulée quadrupède et affût d’attaque sur *Stalker*, respiration et ouverture du calice sur *Spitter*, balancier de marche et armement à deux mains pendant le télégraphe sur *Sentinel* et *Krakoss*, rotation accélérée de `boss_halo` et pulsation du cœur en Phase 2 et Phase 3.
- **VFX adaptatifs (`spawnParticleBurst`)** : Support de `'hit_spark'` sur impact mêlée et burst améthyste ascendant sur `gravity_control`, avec densité adaptée à `LOW`/`MEDIUM`/`HIGH` et `isSoftwareGl`.
