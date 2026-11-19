# WORLD CHAOS — THE LIVING WORLDS
## PREMIUM ART DIRECTION — VERSION 1.0
**Direction Artistique :** *CINEMATIC FANTASY ADVENTURE — PREMIUM 3D*

---

## 1. Vision & Piliers Esthétiques

WORLD CHAOS — THE LIVING WORLDS (Monde 1 : *The Lost Jungle*) passe d'un prototype fonctionnel à géométries brutes à une esthétique d'**aventure fantastique semi-réaliste cinématique** :
1. **Lisibilité de silhouette avant le détail :** Le Héros, les alliés, chaque famille d'ennemis et le Boss Krakoss doivent être reconnaissables en moins de 0,5 seconde sur écran mobile (paysage 5–6") comme sur moniteur desktop.
2. **Contraste Matière & Lumière :** Opposition assumée entre pierres/écorces mates (`roughness 0.85–0.94`), eaux/cristaux brillants (`roughness 0.14–0.25`) et or antique métallique (`metalness 0.86`, `roughness 0.22`).
3. **Transition Atmosphérique Continue :** Traverser les 10 zones doit faire ressentir une progression dramatique — de l'or tropical chaud du Campement à l'émeraude humide de la Rivière, au grès doré du Temple, jusqu'au pourpre/carmin du Colosseum de Krakoss.
4. **Sobriété Mobile-First :** Zéro surcoût post-processing lourd ; toute la richesse repose sur des textures procédurales denses, des `bumpMap` légères, un `InstancedMesh` varié et des éclairages locaux stratégiques.

---

## 2. Palette Chromatique Officielle (Environnement · Personnages · VFX · UI)

| Rôle | Token | Hex | Température & Usage Cohérent |
|---|---|---|---|
| **Noir Obsidienne** | `wc-obsidian` | `#08110D` / `#050B08` | Ombres portées, fonds d'interface, carapace de Krakoss, roches volcaniques de la Faille. |
| **Vert Jungle Profond** | `wc-jungle-deep` | `#0F3D2E` / `#134E3A` | Canopée dense, tunique du Héros, troncs moussus, cartes UI secondaires (`#0E1B15`). |
| **Vert Émeraude** | `wc-emerald` | `#10B981` / `#185732` | Fougères éclairées, bouclier *Chaos Shield*, balises de santé/sanctuaire, lianes vivantes. |
| **Pierre Ancienne** | `wc-ancient-stone` | `#6C6858` / `#524E42` | Grès des Ruines et du Temple Oublié, stèles, marches gravées, Sentinelles. |
| **Or Antique** | `wc-antique-gold` | `#D4AF37` / `#F2CF66` | Frises du Temple, épaulettes & garde d'épée du Héros, couronne de Krakoss, liserés UI, CTA. |
| **Lumière Chaude** | `wc-warm-light` | `#FFE7B3` / `#F59E0B` | Soleil zénithal filtré, feu de camp du Campement, braseros rituels du Temple, braises. |
| **Accents Lumineux Magiques** | `wc-magic-cyan` / `wc-magic-violet` / `wc-chaos-crimson` | `#14B8A6` (`#38BDF8`) · `#A855F7` · `#DC2626` (`#F43F5E`) | **Turquoise Vivant :** Rivière, Lame du Héros, *Shockwave*. **Améthyste Rift :** Grotte, *Gravity Control*, Zone Chaos. **Carmin Chaos :** Écharpe du Héros, cœur/télégraphes des ennemis et de Krakoss, barre de PV. |

---

## 3. Matrice Atmosphérique des 10 Zones de World 1

| Zone | Identité Visuelle & Lumière | Points Focaux 3D / Landmarks | Signature Particulaire |
|---|---|---|---|
| **01. The Arrival** | Soleil matinal doré à travers la canopée brisée ; brume émeraude légère (`#1e382b`). | Épave inclinée du Sky-Skiff (nervures, mât brisé, caisses d'expédition, balise). | Lucioles or & étincelles résiduelles. |
| **02. The Camp** | Chaleur ambrée refuge (`PointLight` feu de camp + lanternes sur poteaux). | Feu sur bûches croisées, tentes d'expédition avec mâts, stèles de sauvegarde gravées d'or, caisses. | Braises orangées montantes. |
| **03. The Wild Jungle** | Canopée dense en couches, clairières percées de rais de lumière. | Arbres contreforts, sous-bois de fougères tropicales, dalles harmoniques gravées. | Lucioles émeraude & dorées. |
| **04. The River** | Reflets turquoise brillants, courant animé et écume fraîche. | Pont-levis charpenté à rambardes, cascade bi-couche + nuage de brume en pied de chute, nénuphars. | Embruns turquoise près de la cascade. |
| **05. The Ancient Ruins** | Grès moussu baigné d'une lumière dorée poussiéreuse (`#2c3627`). | Colonnes cannelées à chapiteaux brisés, arche monumentale, totems Soleil/Feuille/Spirale. | Poussière dorée flottante. |
| **06. The Hidden Cave** | Pénombre bleutée fraîche éclairée par les cristaux améthystes/saphirs. | Arche rocheuse multi-blocs sculptée + stalactites rocheuses + 3 grappes cristallines lumineuses. | Spores cristallines cyan/violet. |
| **07. The Forgotten Temple** | Monumentalité sacrée : pierre ancienne + or antique + flux cyan au sommet. | Pyramide à 3 degrés, **marches d'escalier sculptées**, portail sommital, braseros allumés, obélisques. | Braises chaudes & anneau gravité. |
| **08. The Chaos Zone** | Ciel violacé fracturé, végétation raréfiée, sol volcanique sombre. | Éclats d'obsidienne flottants rotatifs, cristaux de faille, Obélisque instable cerclé d'énergie. | Flammèches améthyste & carmin. |
| **09. The Secret Sanctuary** | Émeraude lumineuse pure et turquoise apaisant. | Arbre Sacré bioluminescent à grande couronne, pétales/lucioles turquoise, portail antique. | Lucioles sacrées turquoise/or. |
| **10. The Boss Arena** | Tension dramatique maximale : brume carmin sombre, exposition tendue. | Colosseum à 12 colonnes gravées avec braseros carmin, sceau du portail, **Krakoss** au centre. | Cendres incandescentes carmin. |

---

## 4. Standards PBR & Échelle de Qualité Mobile (`LOW` / `MEDIUM` / `HIGH`)

- **Textures procédurales :** `512×512` (herbe/sol, pierre ancienne) et `256×256` (écorce organique, eau caustique) + `bumpMap` niveaux de gris en `THREE.NoColorSpace` (`bumpScale` calibré `0.04–0.08`) pour donner du relief réel à la pierre, à l'écorce et au sol sans multiplier le nombre de sommets.
- **Matériaux :**
  - *Pierre / Écorce / Toile :* `roughness: 0.85–0.94`, `metalness: 0.02–0.08`.
  - *Or Antique / Laiton / Garde d'arme :* `roughness: 0.22–0.28`, `metalness: 0.86`.
  - *Eau / Cristaux / Lames énergétiques :* `roughness: 0.14–0.22`, `emissiveIntensity: 0.9–1.5`.
- **Dégradation propre par profil :**
  - `LOW` (ou `SoftwareGL`) : `MeshStandardMaterial` sur l'eau, ombres désactivées, densité de particules atmosphériques réduite (`~50%`), DPR = 1.
  - `MEDIUM` : `MeshPhysicalMaterial` sur l'eau, ombres `PCFSoft` `1024px`, DPR ≤ 1.5, particules standards.
  - `HIGH` : `MeshPhysicalMaterial`, ombres `PCFSoft`, DPR ≤ 2, particules complètes (braises + embruns cascade + lucioles + impacts).

---

## 5. Direction Interface Utilisateur (UI/UX Dark Obsidian & Antique Gold)

- **Principes :**
  - **Cadre gravé sans flou WebGL :** Aucun `backdrop-filter` sur les éléments superposés au canvas 3D (préserve les FPS sur mobile et SoftwareGL). Profondeur obtenue par dégradés obsidienne (`#060D0A` → `#0E1B15`), bordures doubles or (`rgba(212, 175, 55, 0.45)`), filet intérieur fin et ornements d'angle SVG légers.
  - **Typographie :** `Outfit` (titres en balance typographique), `Plus Jakarta Sans` (corps lisible WCAG AA+), `JetBrains Mono` (`tabular-nums` sur tous les compteurs PV/EN/temps/niveaux).
  - **Zéro bruit visuel :** Aucune pilule décorative autour des métadonnées statiques ; zéro point clignotant inutile ; états toujours doublés d'une icône ou d'un libellé.
  - **Ergonomie Android Paysage :** Toutes les cibles tactiles ≥ `44×44 px`, barre supérieure compacte (< 15 % hauteur mobile), bannière portrait non bloquante conservée, boutons d'action ergonomiques dans la zone du pouce droit.

---

## 6. Stratégie Assets & Conformité Licences (Phase 7)

- **100 % Assets Originaux & Procéduraux :**
  - Toutes les textures 3D, bump maps, géométries Three.js, illustrations de la Bible Graphique (`conceptArtGenerator.ts`) et icônes vectorielles UI (SVG inline + `lucide-react` licence ISC) sont **originales ou sous licence permissive auditée**.
  - Les icônes PWA (`icon-192.png`, `icon-512.png`) générées précédemment restent des assets 2D du manifest PWA et ne sont jamais substituées aux modèles 3D.
  - **Distinction claire :** Les illustrations de `conceptArtGenerator.ts` sont présentées explicitement comme *Concepts HD 2D* face aux captures *Rendu 3D* temps réel dans `ArtBibleView.tsx`.
