# WORLD CHAOS — THE LIVING WORLDS
## VISUAL IDENTITY AUDIT (PHASE 1)

**Date :** 2026-11-19  
**Périmètre inspecté :** `artBibleData.ts`, `ArtBibleView.tsx`, `conceptArtGenerator.ts`, `textures.ts`, `models.ts`, `WorldEngine.ts`, `worldData.ts`, `GameHUD.tsx`, `MainMenu.tsx`, `PauseAndMenus.tsx`, `DialogueModal.tsx`, `TutorialOverlay.tsx`, `App.tsx`, `index.css`.  
**Socle de stabilité préservé :** RC 1.0 (`15/15` tests Vitest, `0` erreur TypeScript, profils `LOW`/`MEDIUM`/`HIGH` + mode SoftwareGL, cibles tactiles ≥ 44 px, aucune régression gameplay/sauvegardes/Firebase).

---

## 1. Synthèse Évaluative des 12 Domaines Visuels

| # | Domaine | État Actuel (Factuel) | Note / 10 | Niveau d'Écart vs Cible AAA Cinematic Fantasy |
|---|---|---|---|---|
| 1 | **Qualité des environnements** | Terrain continu 240×240 avec vertex colors basiques (4 teintes), 10 zones différenciées surtout par `fogColor`/`skyColor`. Landmarks minimalistes (boxes/cônes simples). | 5.2 / 10 | **Élevé** — Manque d'identité architecturale et botanique propre à chaque zone. |
| 2 | **Qualité des textures** | 5 `CanvasTexture` procédurales simples (256px `grass`/`stone`/`water`, 128px `bark`/`contactShadow`), 0 `bumpMap`/`roughnessMap`, joints pierre géométriques très rigides, écorce en rayures verticales uniformes. | 4.0 / 10 | **Critique** — Aspect plastique/carrelé de près ; absence totale de micro-relief PBR. |
| 3 | **Éclairage** | `HemisphereLight` + `DirectionalLight` soleil (ombres `1024×1024`) + `RimLight` turquoise fixe + `RoomEnvironment` IBL. Seule `Camp` a une `PointLight`. `toneMappingExposure` fixe (`1.08`). | 6.0 / 10 | **Moyen** — Bon socle PBR, mais l'éclairage ne varie pas par zone (grotte, temple, chaos, boss) et manque d'accents lumineux locaux. |
| 4 | **Matériaux** | `MeshStandardMaterial` majoritaire + `MeshPhysicalMaterial` sur l'eau (`clearcoat: 0.9`). Contraste métallique présent sur le laiton, mais pierre, bois, végétation et tissus restent uniformément mats sans modulation de rugosité ni relief. | 5.5 / 10 | **Moyen** — Manque de micro-contraste spéculaire (mousse humide vs pierre sèche vs or ciselé). |
| 5 | **Végétation** | 1 seule géométrie d'arbre (`Cylinder` + `Dodecahedron` unique) instanciée (~120–160 instances) + 36 nénuphars plats. Zéro fougères au sol, zéro palmiers, zéro lianes, zéro racines contreforts. | 3.8 / 10 | **Critique** — Répétition visuelle très visible et canopée trop dépouillée. |
| 6 | **Rochers et reliefs** | 70 `DodecahedronGeometry(1.1, 0)` identiques sans variation de couleur ni strates. Arche de la grotte construite avec 2 dodécaèdres + 1 `BoxGeometry` rectangulaire flottante (`16×3.5×20`). | 4.2 / 10 | **Élevé** — L'arche rocheuse de `Hidden Cave` paraît artificielle ; rochers trop géométriques. |
| 7 | **Architecture des temples** | Pyramide à 3 `BoxGeometry` + liserés plats dorés + 4 obélisques carrés. Escalier purement topographique (aucune marche sculptée visible). Piliers des ruines = simples cylindres 8 faces nus. | 4.8 / 10 | **Élevé** — Silhouette macro correcte mais détails architecturaux (marches, chapiteaux, linteaux, braseros, mousse) absents. |
| 8 | **Personnages (Héros & PNJ)** | Héros articulé complet (`ExplorerRig` 11 nœuds) avec couleurs justes, mais formes carrées (écharpe = boîte rigide, lunettes = boîte, lame = pavé rectangulaire). Les 5 PNJ partagent exactement le même maillage générique sans accessoires de rôle. | 5.6 / 10 | **Moyen** — Lisibilité correcte, mais silhouette et finition des armes/accessoires trop primitives. |
| 9 | **Boss Krakoss & Ennemis** | `Stalker` quadrupède en boîtes, `Spitter` statique, `Sentinel` cubique. **`BUG-16` toujours présent :** `EnemyRig.limbs` est peuplé mais jamais animé dans `WorldEngine.ts` (ennemis figés en glissant). Krakoss manque d'aura, de cornes/couronne d'obsidienne, de fissures énergétiques et d'escalade visuelle en Phase 2/3. | 4.6 / 10 | **Critique** — Animation des membres absente et présence visuelle du Boss insuffisante pour un climax de Monde 1. |
| 10 | **Interface utilisateur (UI)** | UI Sombre & Or propre, sans `backdrop-blur` sur WebGL, cibles tactiles ≥ 44px conformes. Cependant esthétique encore « dashboard SaaS dark » : cartes rectangulaires simples, carrés de couleur plats (`w-3 h-3`) dans l'inventaire, barres PV/EN basiques, écran de chargement minimaliste. | 6.2 / 10 | **Moyen** — Fonctionnelle et lisible, mais manque de gravure fantasy, d'ornementation dorée subtile et d'atmosphère cinématique. |
| 11 | **Animations** | Locomotion héros fonctionnelle (bras, jambes, bob, écharpe), balises rotatives. **Lacunes :** `EnemyRig.limbs` immobiles ; pas d'inclinaison dynamique en esquive (`dodgeTimer`) ; pas de torsion sur attaque lourde ; eau animée ou immobile (UV non scrollées dans `update()` !). | 4.9 / 10 | **Élevé** — Eau statique en UV et membres ennemis non animés brisent la vie du monde. |
| 12 | **Effets visuels (VFX)** | `ShockRing` + `ParticleBurst` sur `Shockwave` et `Chaos Shield`. Manquants : `Gravity Control` n'a qu'un anneau au sol (pas de particules ascensionnelles), aucune braise au feu de camp, aucune brume au pied de la cascade, zéro particule d'impact sur attaque/lame, aucune teinte ambiante de lucioles différenciée par zone. | 5.4 / 10 | **Élevé** — Effets réactifs présents sur 2 pouvoirs mais environnement et combat manquent de vie particulaire. |

---

## 2. Diagnostic Détaillé par Fichier Inspecté

### `src/game/textures.ts`
- `createBarkTexture`: bandes verticales alternées strictement tous les `6px` (`#3b271b` / `#5e422e`) — produit un effet « code-barres » très répétitif sur les troncs.
- `createStoneTexture`: briques régulières avec lignes de `4px` sans chanfrein, fissure, mousse ni variation de luminosité par bloc.
- `createGrassTexture`: bruit uniforme de rectangles aléatoires, sans mottes, trèfles, racines ni nuances organiques.
- `createWaterTexture`: gradient plat + vagues sinusoïdales rigides ; **et dans `WorldEngine.ts`, `this.waterTex.offset` n'est jamais animé dans `update()`**, rendant l'eau visuellement figée.
- Aucune **bump map** / **roughness map** procédurale (ex. pierre ciselée, écorce fibreuse, relief herbeux).

### `src/game/WorldEngine.ts` & `src/game/models.ts`
- **Végétation :** `buildInstancedJungle` ne génère qu'un couple `CylinderGeometry` + `DodecahedronGeometry`. Pas de sous-bois (fougères, buissons tropicaux, palmes, lianes suspendues), pas d'adaptation au biome (ex. cristaux et roches calcinées près de `chaos_zone`/`boss_arena` au lieu d'arbres verts uniformes).
- **Landmarks :**
  - *The Arrival* : coque du sky-skiff en `BoxGeometry` nue sans nervures, débris/caisses éparpillés ni balise de fumée/étincelles.
  - *The Camp* : tentes coniques nues, feu sans bûches croisées ni braises ascendantes, pas de lanternes ni table d'expédition.
  - *The River* : pont-levis plat sans garde-corps ni poutres transversales ; cascade = 1 seul `PlaneGeometry` statique sans écume ni brume à la base.
  - *The Hidden Cave* : l'arche supérieure (`BoxGeometry(16, 3.5, 20)`) présente des arêtes parfaitement droites qui cassent l'illusion organique de grotte.
  - *The Forgotten Temple* : marches d'escalier invisibles (pente lisse dans le terrain), absence de braseros rituels, de linteaux d'entrée et de mousse tombante.
  - *The Secret Sanctuary* : manque d'un Arbre Sacré lumineux monumental et d'un anneau floral/émeraude distinctif.
  - *The Boss Arena* : 12 cylindres nus sans chapiteaux, braseros de garde ou gravures obsidienne.
- **Personnages & Ennemis :**
  - `ExplorerRig` : écharpe rigide mono-bloc, lame en pavé `BoxGeometry` sans garde dorée ni pointe biseautée.
  - `EnemyRig.limbs` : jamais animé dans `updateEnemies()`.
  - `Krakoss` : taille et masse imposantes mais silhouette encore géométrique (pas de cornes d'obsidienne, pas de fissures carmin sur le torse, pas de fragments flottants gravitationnels, pas de changement visuel marqué en Phase 2 / Phase 3).

### `src/index.css`, `MainMenu.tsx`, `GameHUD.tsx`, `PauseAndMenus.tsx`, `DialogueModal.tsx`, `App.tsx`
- Palette et polices déjà très saines (`Outfit` + `Plus Jakarta Sans` + `JetBrains Mono`), sans `backdrop-blur` sur le WebGL (critique à conserver pour SoftwareGL / mobile).
- Opportunités visuelles majeures sans nuire à la perf :
  - Liserés doubles or antique (`1px` externe + liseré interne subtil), motifs d'angle gravés SVG légers sur les cadres modaux et bannières, dégradés obsidienne-émeraude profonds.
  - Barre de PV/EN et jauge de Boss Krakoss avec embouts dorés ciselés et reflets gradués.
  - Icônes SVG vectorielles thématiques pour chaque catégorie/objet d'inventaire au lieu des carrés plats.
  - Écran de chargement stylisé et sélecteurs tactiles enrichis sans altérer les hitboxes ≥ 44 px ni la bannière portrait non bloquante.

---

## 3. Plan de Modifications Prioritaires (Avant Code)

Ordre d'exécution incrémental validé avec `npm test && npm run lint && npm run build` après chaque lot :

1. **Lot 1 — Textures PBR Procédurales & Relief (`src/game/textures.ts`, `src/game/WorldEngine.ts`) :**
   - Enrichir `grass`, `stone`, `bark`, `water` (détail organique multi-couches, mousse, fissures, écorce fibreuse, caustiques aquatiques) + créer des `CanvasTexture` `bumpMap` (en `THREE.NoColorSpace`) enregistrées dans `disposableTextures`.
   - Animer le courant de `waterTex` et de la cascade dans `update()` + varier l'exposition et la lumière hémisphérique par zone.
2. **Lot 2 — Environnements des 10 Zones & VFX Adaptatifs (`src/game/WorldEngine.ts`, `src/game/models.ts`) :**
   - Végétation multi-espèces instanciée (arbres contreforts à double canopée, palmiers/fougères au sol, cristaux de faille en Zone Chaos) adaptée par biome pour casser toute répétition.
   - Refonte visuelle des landmarks (épave du skiff détaillée, camp avec bûches/lanternes/tables, pont à rambardes, cascade à double couche + brume, grotte sculptée à stalactites sans bloc carré, Temple avec vraies marches visuelles, portail & braseros, Arbre Sacré du Sanctuaire, Colosseum obsidienne-or).
   - VFX améliorés et scalés sur `LOW`/`MEDIUM`/`HIGH` (braises camp, particules gravité, impacts d'attaque, aura Chaos, lucioles teintées par zone).
3. **Lot 3 — Personnages, Ennemis, Animations & Boss Krakoss (`src/game/models.ts`, `src/game/WorldEngine.ts`) :**
   - Affinage des silhouettes : Héros (lame biseautée à garde dorée, bandeau de chapeau or, écharpe à double pan fluide), PNJ (accessoires de rôle : carte/sacoche, marteau/clé, bâton cristal, sceptre temple, orbe sanctuaire), ennemis plus expressifs.
   - **Animation complète des `EnemyRig.limbs`** (marche quadrupède Stalker, balancement Spitter + recul au tir, marche/frappe lourde Sentinel & Krakoss) + inclinaison du Héros en esquive et arc de frappe.
   - **Refonte visuelle de Krakoss** : couronne à cornes d'obsidienne, fissures thoraciques lumineuses, anneau d'éclats corrompus en orbite et escalade visuelle Phase 2 / Phase 3.
4. **Lot 4 — Refonte UI Premium & Alignement Bible Graphique (`src/index.css`, `MainMenu.tsx`, `GameHUD.tsx`, `PauseAndMenus.tsx`, `DialogueModal.tsx`, `TutorialOverlay.tsx`, `App.tsx`, `artBibleData.ts`) :**
   - Cadres obsidienne gravés or, emblèmes SVG d'objets, barre de Boss et HUD cinématique, Menu principal immersif, écrans Victoire/Défaite/Chargement soignés — tout en conservant **0 `backdrop-blur` sur WebGL**, **hitboxes ≥ 44 px**, **0 pill décorative** et **100 % des mécaniques intactes**.
5. **Lot 5 — Rapports & Validation Finale :**
   - Produire `ENVIRONMENT_UPGRADE_REPORT.md`, `UI_REDESIGN_REPORT.md` et `VISUAL_REGRESSION_REPORT.md`, vérifier `vitest`, `tsc`, `vite build` et `eslint firestore.rules`.
