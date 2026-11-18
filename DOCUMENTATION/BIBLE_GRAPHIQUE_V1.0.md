# WORLD CHAOS : THE LIVING WORLDS — BIBLE GRAPHIQUE V1.0

> Référentiel visuel et ergonomique officiel pour l’intégration Unity (Antigravity) — Monde 1 : **The Lost Jungle**.

## 1. Orientations Artistiques Officielles
- **Style graphique** : 3D Fantasy semi-réaliste
- **Caméra** : Troisième personne amortie avec collision terrain
- **Silhouettes** : Expressives, contrastées et lisibles en combat comme en exploration
- **Environnements** : Luxuriants, monumentaux, brume atmosphérique et particules vivantes
- **Interface (UI/UX)** : Sombre (#08110D), élégante, liserés Or Antique (#D4AF37), textes nets redessinés

## 2. Palette Chromatique Officielle (60-30-10)
| Rôle | Nom | Hex | Usage |
|---|---|---|---|
| 1 | Obsidienne Forêt | `#08110D` | Canvas UI sombre, ombres profondes & fonds de panneaux (60%) |
| 2 | Émeraude Profonde | `#0F3D2E` | Canopée, feuillages denses & surfaces structurelles (30%) |
| 3 | Turquoise Vivant | `#14B8A6` | Eaux sacrées, énergie Chaos, conduits & lame du héros |
| 4 | Or Antique | `#D4AF37` | Cadres UI, liserés royaux, glyphes, récompenses & CTA (10%) |
| 5 | Carmin Chaos | `#DC2626` | Vitalité HP, écharpe héroïque, noyaux ennemis & alertes |
| 6 | Améthyste Rift | `#7C3AED` | Anomalies Chaos Engine, gravité altérée & grottes cristallines |

## 3. Spécifications des 10 Planches Officielle

### 01 — The Lost Jungle (Jungle mystérieuse et marécages)
**Catégorie :** Environnements & Direction Artistique

Biome d’ouverture semi-réaliste mêlant racines banyan monumentales, bassins marécageux turquoise, brume basse émeraude et lucioles dorées guidant l’exploration.

**Palette de la planche :** Mousse Sombre (`#0F3D2E`) · Eau Marécage (`#14B8A6`) · Luciole Or (`#F2CF66`)

- **Éclairage :** Directional Sun chaud (#FFE7B3) + Hemisphere Fill turquoise (#7DD3C8) + FogExp2 vert profond
- **Matériaux PBR :** PBR rugosité 0.85–0.92 sur écorces/mousses ; eau clearcoat réflective (roughness 0.14)
- **Caméra :** 3e personne épaule souple (FOV 58°, distance 8.5m), lecture lointaine des clairières
- **Silhouettes & Composition :** Premier plan racines sculptées, plan moyen marécage, arrière-plan canopée brumeuse
- **Refonte UI :** Bannière de découverte sobre en haut de l’écran : titre Outfit + filet doré sans boîtes superflues.

### 02 — Combat (Affrontement et créatures)
**Catégorie :** Environnements & Direction Artistique

Affrontements lisibles à 360° où les créatures corrompues se détachent instantanément du décor grâce à leurs noyaux carmin/ambre et anneaux télégraphes au sol.

**Palette de la planche :** Carapace Obsidienne (`#2A1F36`) · Cœur Carmin (`#DC2626`) · Acier Turquoise (`#2DD4BF`)

- **Éclairage :** Rim light froid pour détacher les ennemis + éclairs d’impact additifs brefs
- **Matériaux PBR :** Contraste roughness >= 0.35 entre pierre mate (0.9) et noyaux cristallins émissifs
- **Caméra :** Lock-on fluide avec léger recul dynamique et micro screen-shake sur coups lourds
- **Silhouettes & Composition :** 3 familles distinctes : quadrupède vif (Stalker), plante tourelle (Spitter), colosse (Sentinel)
- **Refonte UI :** Suppression des badges flottants bruyants : jauge Boss centrée sombre/or avec phase clairement indiquée.

### 03 — Campement (Refuge et préparation)
**Catégorie :** Environnements & Direction Artistique

Havre chaleureux au cœur de la jungle protégé par des stèles gravées d’or. Le contraste thermique entre le feu ambré et la brume turquoise signale immédiatement la sécurité.

**Palette de la planche :** Braise Ambrée (`#F59E0B`) · Toile Expédition (`#D4B483`) · Rune Dorée (`#D4AF37`)

- **Éclairage :** PointLight ambrée douce centrée sur le foyer + éclairage crépusculaire apaisé
- **Matériaux PBR :** Toiles mates (roughness 0.85), laiton poli des équipements (metalness 0.85, roughness 0.22)
- **Caméra :** Angle légèrement abaissé mettant en valeur Lyra, Kael et le feu de camp central
- **Silhouettes & Composition :** Composition circulaire sécurisante autour du foyer (tentes, PNJ, point de sauvegarde)
- **Refonte UI :** Boîtes de dialogue NPC redessinées en panneau sombre bordé d’or avec choix tactiles >= 44px.

### 04 — Temple oublié (Architecture et mystère)
**Catégorie :** Environnements & Direction Artistique

Architecture mésoaméricaine à degrés envahie par la végétation, sertie d’incrustations d’or antique et de monolithes de gravité flottants à lueur turquoise.

**Palette de la planche :** Grès Moussue (`#6C6858`) · Or Incrusté (`#D4AF37`) · Flux Gravité (`#38BDF8`)

- **Éclairage :** Faisceaux obliques zénithaux + points émissifs turquoise sur les conduits supérieurs
- **Matériaux PBR :** Pierre sculptée avec joints marqués + or anisotrope sur les ornements du sommet
- **Caméra :** Contre-plongée progressive révélant les 3 gradins lors de l’approche depuis le sud
- **Silhouettes & Composition :** Pyramide à 3 niveaux, escalier axial lisible, 4 obélisques d’angle dorés
- **Refonte UI :** Prompts d’énigmes intégrés au journal avec indices progressifs propres sans texte tronqué.

### 05 — Héros (Personnage et équipement)
**Catégorie :** Environnements & Direction Artistique

Silhouette iconique immédiatement lisible de dos comme de profil : tunique vert forêt, gantelets en laiton doré, écharpe carmin flottante et lame énergétique turquoise.

**Palette de la planche :** Tunique Forêt (`#134E3A`) · Écharpe Carmin (`#DC2626`) · Laiton Royal (`#D4AF37`)

- **Éclairage :** Éclairage 3 points studio/terrain garantissant la lisibilité de l’équipement en zone d’ombre
- **Matériaux PBR :** Cuir semi-mat (0.65), tissu mat (0.8), laiton métallique (metalness 0.85, roughness 0.22)
- **Caméra :** Cadrage 3e personne centré légèrement sous l’épaule pour suivre l’écharpe en course
- **Silhouettes & Composition :** Chapeau d’explorateur large + sac à cœur lumineux + lame turquoise contrastante
- **Refonte UI :** Portrait et fiche équipement exploitant la palette officielle sans effets néon saturés.

### 06 — Vue panoramique (Composition du monde)
**Catégorie :** Environnements & Direction Artistique

Lecture spatiale complète de World 1 : de la rivière turquoise à l’est jusqu’au Temple Oublié au centre et à la faille Chaos améthyste à l’horizon nord.

**Palette de la planche :** Canopée Émeraude (`#185732`) · Cascade Turquoise (`#2DD4BF`) · Horizon Chaos (`#632B5E`)

- **Éclairage :** FogExp2 synchronisé sur la couleur du ciel par zone pour fondre les bords du terrain 240x240m
- **Matériaux PBR :** Variation de teinte par instance (`setColorAt` ±15%) pour éviter la répétition végétale
- **Caméra :** Transition fluide entre ambiances de zone sans coupure ni mur rectangulaire visible
- **Silhouettes & Composition :** Points de repère verticaux (Temple, Cascade, Colosseum) visibles à longue distance
- **Refonte UI :** Mini-radar et carte interactive en mode sombre/or utilisant les coordonnées exactes des 10 zones.

### 07 — Univers et interface (Charte UI sombre & or redessinée)
**Catégorie :** Interface & Expérience de Jeu

Refonte complète de l’habillage UI : abandon des textes IA illisibles au profit d’une interface obsidienne (#08110D) soulignée de filets or antique (#D4AF37) et typographie nette.

**Palette de la planche :** Fond Obsidienne (`#08110D`) · Liseré Or Royal (`#D4AF37`) · Ivoire Lisible (`#F3F1E8`)

- **Éclairage :** Rendu UI URP séparé sans flou coûteux (`backdrop-filter`) sur WebGL logiciel
- **Matériaux PBR :** Sprites vectoriels SVG / 9-slice dorés nets à toutes résolutions (1x à 3x Retina)
- **Caméra :** Centre du viewport 100% dégagé (<= 15% d’occupation verticale sur mobile)
- **Silhouettes & Composition :** Contrat top-bar 3 zones + panneaux latéraux ancrés aux coins
- **Refonte UI :** Typographie Outfit (titres) + Plus Jakarta Sans (corps) + JetBrains Mono (chiffres tabulaires). Zéro badge pilule décoratif : métadonnées séparées par « · ». États colorés toujours doublés d’un libellé ou d’une icône explicite.

### 08 — Personnages et compétences (Archétypes & 3 pouvoirs officiels)
**Catégorie :** Interface & Expérience de Jeu

Codification visuelle des 5 PNJ alliés et des 3 capacités officielles (Shockwave turquoise, Gravity Control améthyste, Chaos Shield émeraude) pour une identification instantanée.

**Palette de la planche :** Shockwave (`#38BDF8`) · Gravity Control (`#A855F7`) · Chaos Shield (`#10B981`)

- **Éclairage :** Aura dédiée sur le personnage (anneau rotatif au sol ou dôme filaire émissif)
- **Matériaux PBR :** Matériaux additifs/transparents depthWrite=false pour éviter le tri alpha instable
- **Caméra :** Feedback visuel clair même en mouvement rapide sur petit écran mobile
- **Silhouettes & Composition :** Balise flottante codée par couleur au-dessus de chaque PNJ (Lyra, Kael, Orin, Veyra, Tarek)
- **Refonte UI :** Boutons de compétences circulaires sombres cerclés d’or avec compteur de recharge numérique centré.

### 09 — Gameplay mobile (Ergonomie paysage & contrôles tactiles)
**Catégorie :** Interface & Expérience de Jeu

Architecture tactile pensée pour le format paysage Android/Web : stick virtuel flottant à gauche, rotation caméra glissée à droite, grappe d’actions >= 44px sous le pouce droit.

**Palette de la planche :** Attaque Principale (`#DC2626`) · Action Contextuelle (`#D4AF37`) · Zone Stick (`#14B8A6`)

- **Éclairage :** Contraste garanti quel que soit l’éclairage de la scène (fond sombre 88% opacité)
- **Matériaux PBR :** Cibles tactiles minimales 44×44px (64px sur attaque principale)
- **Caméra :** Zone tactile droite dédiée à l’orbite caméra sans conflit avec les boutons
- **Silhouettes & Composition :** Disposition symétrique en U laissant la ligne d’horizon et le héros parfaitement visibles
- **Refonte UI :** Option de masquage des contrôles tactiles dans les paramètres pour les joueurs clavier/manette.

### 10 — Présentation du MVP (Référentiel complet World 1 pour Unity)
**Catégorie :** Interface & Expérience de Jeu

Synthèse officielle prête pour transmission à Antigravity : 10 zones, 5 quêtes principales + 5 secondaires, 5 énigmes, 4 événements Chaos Engine, Boss Krakoss et sauvegarde hors ligne.

**Palette de la planche :** Chaos Core (`#F43F5E`) · Sceau Or (`#D4AF37`) · Turquoise Lien (`#14B8A6`)

- **Éclairage :** Profils LOW / MEDIUM / HIGH calibrés (ombres PCFSoft, DPR dynamique)
- **Matériaux PBR :** Zéro dépendance externe fragile : textures et audio 100% procéduraux dans le prototype
- **Caméra :** Caméra 3e personne amortie avec clamp terrain anti-traversée
- **Silhouettes & Composition :** Boucle complète : Camp -> Rivière -> Ruines -> Grotte -> Temple -> Zone Chaos -> Arène Boss
- **Refonte UI :** Export direct Markdown (.md) et JSON (.json) depuis cette Bible Graphique V1.0.
