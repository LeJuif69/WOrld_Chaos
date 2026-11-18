export type PlateCategory = 'environments' | 'interface';

export interface ColorToken {
  name: string;
  hex: string;
  usage: string;
}

export interface ArtBiblePlate {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: PlateCategory;
  summary: string;
  palette: ColorToken[];
  unitySpecs: {
    lighting: string;
    materials: string;
    camera: string;
    silhouetteAndComposition: string;
  };
  uiRedesignNotes: string[];
  snapshotPreset?: {
    position: [number, number, number];
    lookAt: [number, number, number];
  };
}

export const OFFICIAL_PALETTE: ColorToken[] = [
  { name: 'Obsidienne Forêt', hex: '#08110D', usage: 'Canvas UI sombre, ombres profondes & fonds de panneaux (60%)' },
  { name: 'Émeraude Profonde', hex: '#0F3D2E', usage: 'Canopée, feuillages denses & surfaces structurelles (30%)' },
  { name: 'Turquoise Vivant', hex: '#14B8A6', usage: 'Eaux sacrées, énergie Chaos, conduits & lame du héros' },
  { name: 'Or Antique', hex: '#D4AF37', usage: 'Cadres UI, liserés royaux, glyphes, récompenses & CTA (10%)' },
  { name: 'Carmin Chaos', hex: '#DC2626', usage: 'Vitalité HP, écharpe héroïque, noyaux ennemis & alertes' },
  { name: 'Améthyste Rift', hex: '#7C3AED', usage: 'Anomalies Chaos Engine, gravité altérée & grottes cristallines' },
];

export const ART_BIBLE_PLATES: ArtBiblePlate[] = [
  {
    id: 'plate_01',
    number: '01',
    title: 'The Lost Jungle',
    subtitle: 'Jungle mystérieuse et marécages',
    category: 'environments',
    summary:
      'Biome d’ouverture semi-réaliste mêlant racines banyan monumentales, bassins marécageux turquoise, brume basse émeraude et lucioles dorées guidant l’exploration.',
    palette: [
      { name: 'Mousse Sombre', hex: '#0F3D2E', usage: 'Sol forestier & feuillages' },
      { name: 'Eau Marécage', hex: '#14B8A6', usage: 'Bassins & reflets' },
      { name: 'Luciole Or', hex: '#F2CF66', usage: 'Particules atmosphériques' },
    ],
    unitySpecs: {
      lighting: 'Directional Sun chaud (#FFE7B3) + Hemisphere Fill turquoise (#7DD3C8) + FogExp2 vert profond',
      materials: 'PBR rugosité 0.85–0.92 sur écorces/mousses ; eau clearcoat réflective (roughness 0.14)',
      camera: '3e personne épaule souple (FOV 58°, distance 8.5m), lecture lointaine des clairières',
      silhouetteAndComposition: 'Premier plan racines sculptées, plan moyen marécage, arrière-plan canopée brumeuse',
    },
    uiRedesignNotes: [
      'Bannière de découverte sobre en haut de l’écran : titre Outfit + filet doré sans boîtes superflues.',
    ],
    snapshotPreset: {
      position: [-14, 7.5, 32],
      lookAt: [-30, 1.5, 14],
    },
  },
  {
    id: 'plate_02',
    number: '02',
    title: 'Combat',
    subtitle: 'Affrontement et créatures',
    category: 'environments',
    summary:
      'Affrontements lisibles à 360° où les créatures corrompues se détachent instantanément du décor grâce à leurs noyaux carmin/ambre et anneaux télégraphes au sol.',
    palette: [
      { name: 'Carapace Obsidienne', hex: '#2A1F36', usage: 'Silhouettes Stalkers & Boss' },
      { name: 'Cœur Carmin', hex: '#DC2626', usage: 'Télégraphes & points faibles' },
      { name: 'Acier Turquoise', hex: '#2DD4BF', usage: 'Traînées d’attaque & Shockwave' },
    ],
    unitySpecs: {
      lighting: 'Rim light froid pour détacher les ennemis + éclairs d’impact additifs brefs',
      materials: 'Contraste roughness >= 0.35 entre pierre mate (0.9) et noyaux cristallins émissifs',
      camera: 'Lock-on fluide avec léger recul dynamique et micro screen-shake sur coups lourds',
      silhouetteAndComposition: '3 familles distinctes : quadrupède vif (Stalker), plante tourelle (Spitter), colosse (Sentinel)',
    },
    uiRedesignNotes: [
      'Suppression des badges flottants bruyants : jauge Boss centrée sombre/or avec phase clairement indiquée.',
    ],
    snapshotPreset: {
      position: [12, 8.2, -72],
      lookAt: [0, 2.8, -84],
    },
  },
  {
    id: 'plate_03',
    number: '03',
    title: 'Campement',
    subtitle: 'Refuge et préparation',
    category: 'environments',
    summary:
      'Havre chaleureux au cœur de la jungle protégé par des stèles gravées d’or. Le contraste thermique entre le feu ambré et la brume turquoise signale immédiatement la sécurité.',
    palette: [
      { name: 'Braise Ambrée', hex: '#F59E0B', usage: 'Foyer central & lanternes' },
      { name: 'Toile Expédition', hex: '#D4B483', usage: 'Tentes & auvents' },
      { name: 'Rune Dorée', hex: '#D4AF37', usage: 'Stèles de sauvegarde' },
    ],
    unitySpecs: {
      lighting: 'PointLight ambrée douce centrée sur le foyer + éclairage crépusculaire apaisé',
      materials: 'Toiles mates (roughness 0.85), laiton poli des équipements (metalness 0.85, roughness 0.22)',
      camera: 'Angle légèrement abaissé mettant en valeur Lyra, Kael et le feu de camp central',
      silhouetteAndComposition: 'Composition circulaire sécurisante autour du foyer (tentes, PNJ, point de sauvegarde)',
    },
    uiRedesignNotes: [
      'Boîtes de dialogue NPC redessinées en panneau sombre bordé d’or avec choix tactiles >= 44px.',
    ],
    snapshotPreset: {
      position: [13, 6.4, 56],
      lookAt: [0, 1.8, 44],
    },
  },
  {
    id: 'plate_04',
    number: '04',
    title: 'Temple oublié',
    subtitle: 'Architecture et mystère',
    category: 'environments',
    summary:
      'Architecture mésoaméricaine à degrés envahie par la végétation, sertie d’incrustations d’or antique et de monolithes de gravité flottants à lueur turquoise.',
    palette: [
      { name: 'Grès Moussue', hex: '#6C6858', usage: 'Blocs monumentaux' },
      { name: 'Or Incrusté', hex: '#D4AF37', usage: 'Frises & chapiteaux' },
      { name: 'Flux Gravité', hex: '#38BDF8', usage: 'Conduits & lévitation' },
    ],
    unitySpecs: {
      lighting: 'Faisceaux obliques zénithaux + points émissifs turquoise sur les conduits supérieurs',
      materials: 'Pierre sculptée avec joints marqués + or anisotrope sur les ornements du sommet',
      camera: 'Contre-plongée progressive révélant les 3 gradins lors de l’approche depuis le sud',
      silhouetteAndComposition: 'Pyramide à 3 niveaux, escalier axial lisible, 4 obélisques d’angle dorés',
    },
    uiRedesignNotes: [
      'Prompts d’énigmes intégrés au journal avec indices progressifs propres sans texte tronqué.',
    ],
    snapshotPreset: {
      position: [18, 10.5, -18],
      lookAt: [0, 4.2, -34],
    },
  },
  {
    id: 'plate_05',
    number: '05',
    title: 'Héros',
    subtitle: 'Personnage et équipement',
    category: 'environments',
    summary:
      'Silhouette iconique immédiatement lisible de dos comme de profil : tunique vert forêt, gantelets en laiton doré, écharpe carmin flottante et lame énergétique turquoise.',
    palette: [
      { name: 'Tunique Forêt', hex: '#134E3A', usage: 'Vêtement principal' },
      { name: 'Écharpe Carmin', hex: '#DC2626', usage: 'Mouvement & lecture de dos' },
      { name: 'Laiton Royal', hex: '#D4AF37', usage: 'Gantelets, boucle & visière' },
    ],
    unitySpecs: {
      lighting: 'Éclairage 3 points studio/terrain garantissant la lisibilité de l’équipement en zone d’ombre',
      materials: 'Cuir semi-mat (0.65), tissu mat (0.8), laiton métallique (metalness 0.85, roughness 0.22)',
      camera: 'Cadrage 3e personne centré légèrement sous l’épaule pour suivre l’écharpe en course',
      silhouetteAndComposition: 'Chapeau d’explorateur large + sac à cœur lumineux + lame turquoise contrastante',
    },
    uiRedesignNotes: [
      'Portrait et fiche équipement exploitant la palette officielle sans effets néon saturés.',
    ],
    snapshotPreset: {
      position: [2.8, 3.2, 87.5],
      lookAt: [0, 2.3, 84],
    },
  },
  {
    id: 'plate_06',
    number: '06',
    title: 'Vue panoramique',
    subtitle: 'Composition du monde',
    category: 'environments',
    summary:
      'Lecture spatiale complète de World 1 : de la rivière turquoise à l’est jusqu’au Temple Oublié au centre et à la faille Chaos améthyste à l’horizon nord.',
    palette: [
      { name: 'Canopée Émeraude', hex: '#185732', usage: 'Masse végétale continue' },
      { name: 'Cascade Turquoise', hex: '#2DD4BF', usage: 'Axe hydraulique est' },
      { name: 'Horizon Chaos', hex: '#632B5E', usage: 'Brume d’atmosphère lointaine' },
    ],
    unitySpecs: {
      lighting: 'FogExp2 synchronisé sur la couleur du ciel par zone pour fondre les bords du terrain 240x240m',
      materials: 'Variation de teinte par instance (`setColorAt` ±15%) pour éviter la répétition végétale',
      camera: 'Transition fluide entre ambiances de zone sans coupure ni mur rectangulaire visible',
      silhouetteAndComposition: 'Points de repère verticaux (Temple, Cascade, Colosseum) visibles à longue distance',
    },
    uiRedesignNotes: [
      'Mini-radar et carte interactive en mode sombre/or utilisant les coordonnées exactes des 10 zones.',
    ],
    snapshotPreset: {
      position: [42, 34, 48],
      lookAt: [0, 3, -16],
    },
  },
  {
    id: 'plate_07',
    number: '07',
    title: 'Univers et interface',
    subtitle: 'Charte UI sombre & or redessinée',
    category: 'interface',
    summary:
      'Refonte complète de l’habillage UI : abandon des textes IA illisibles au profit d’une interface obsidienne (#08110D) soulignée de filets or antique (#D4AF37) et typographie nette.',
    palette: [
      { name: 'Fond Obsidienne', hex: '#08110D', usage: 'Panneaux & modales' },
      { name: 'Liseré Or Royal', hex: '#D4AF37', usage: 'Bordures & CTA principaux' },
      { name: 'Ivoire Lisible', hex: '#F3F1E8', usage: 'Textes WCAG AA+' },
    ],
    unitySpecs: {
      lighting: 'Rendu UI URP séparé sans flou coûteux (`backdrop-filter`) sur WebGL logiciel',
      materials: 'Sprites vectoriels SVG / 9-slice dorés nets à toutes résolutions (1x à 3x Retina)',
      camera: 'Centre du viewport 100% dégagé (<= 15% d’occupation verticale sur mobile)',
      silhouetteAndComposition: 'Contrat top-bar 3 zones + panneaux latéraux ancrés aux coins',
    },
    uiRedesignNotes: [
      'Typographie Outfit (titres) + Plus Jakarta Sans (corps) + JetBrains Mono (chiffres tabulaires).',
      'Zéro badge pilule décoratif : métadonnées séparées par « · ».',
      'États colorés toujours doublés d’un libellé ou d’une icône explicite.',
    ],
  },
  {
    id: 'plate_08',
    number: '08',
    title: 'Personnages et compétences',
    subtitle: 'Archétypes & 3 pouvoirs officiels',
    category: 'interface',
    summary:
      'Codification visuelle des 5 PNJ alliés et des 3 capacités officielles (Shockwave turquoise, Gravity Control améthyste, Chaos Shield émeraude) pour une identification instantanée.',
    palette: [
      { name: 'Shockwave', hex: '#38BDF8', usage: 'Onde cinétique & bris de cristal' },
      { name: 'Gravity Control', hex: '#A855F7', usage: 'Lévitation & sauts temple' },
      { name: 'Chaos Shield', hex: '#10B981', usage: 'Barrière défensive 6s' },
    ],
    unitySpecs: {
      lighting: 'Aura dédiée sur le personnage (anneau rotatif au sol ou dôme filaire émissif)',
      materials: 'Matériaux additifs/transparents depthWrite=false pour éviter le tri alpha instable',
      camera: 'Feedback visuel clair même en mouvement rapide sur petit écran mobile',
      silhouetteAndComposition: 'Balise flottante codée par couleur au-dessus de chaque PNJ (Lyra, Kael, Orin, Veyra, Tarek)',
    },
    uiRedesignNotes: [
      'Boutons de compétences circulaires sombres cerclés d’or avec compteur de recharge numérique centré.',
    ],
  },
  {
    id: 'plate_09',
    number: '09',
    title: 'Gameplay mobile',
    subtitle: 'Ergonomie paysage & contrôles tactiles',
    category: 'interface',
    summary:
      'Architecture tactile pensée pour le format paysage Android/Web : stick virtuel flottant à gauche, rotation caméra glissée à droite, grappe d’actions >= 44px sous le pouce droit.',
    palette: [
      { name: 'Attaque Principale', hex: '#DC2626', usage: 'Bouton action primaire pouce droit' },
      { name: 'Action Contextuelle', hex: '#D4AF37', usage: 'Bouton Interaction centré bas' },
      { name: 'Zone Stick', hex: '#14B8A6', usage: 'Joystick gauche semi-transparent' },
    ],
    unitySpecs: {
      lighting: 'Contraste garanti quel que soit l’éclairage de la scène (fond sombre 88% opacité)',
      materials: 'Cibles tactiles minimales 44×44px (64px sur attaque principale)',
      camera: 'Zone tactile droite dédiée à l’orbite caméra sans conflit avec les boutons',
      silhouetteAndComposition: 'Disposition symétrique en U laissant la ligne d’horizon et le héros parfaitement visibles',
    },
    uiRedesignNotes: [
      'Option de masquage des contrôles tactiles dans les paramètres pour les joueurs clavier/manette.',
    ],
  },
  {
    id: 'plate_10',
    number: '10',
    title: 'Présentation du MVP',
    subtitle: 'Référentiel complet World 1 pour Unity',
    category: 'interface',
    summary:
      'Synthèse officielle prête pour transmission à Antigravity : 10 zones, 5 quêtes principales + 5 secondaires, 5 énigmes, 4 événements Chaos Engine, Boss Krakoss et sauvegarde hors ligne.',
    palette: [
      { name: 'Chaos Core', hex: '#F43F5E', usage: 'Objectif final World 1' },
      { name: 'Sceau Or', hex: '#D4AF37', usage: 'Validation & progression' },
      { name: 'Turquoise Lien', hex: '#14B8A6', usage: 'Passerelle vers World 2' },
    ],
    unitySpecs: {
      lighting: 'Profils LOW / MEDIUM / HIGH calibrés (ombres PCFSoft, DPR dynamique)',
      materials: 'Zéro dépendance externe fragile : textures et audio 100% procéduraux dans le prototype',
      camera: 'Caméra 3e personne amortie avec clamp terrain anti-traversée',
      silhouetteAndComposition: 'Boucle complète : Camp -> Rivière -> Ruines -> Grotte -> Temple -> Zone Chaos -> Arène Boss',
    },
    uiRedesignNotes: [
      'Export direct Markdown (.md) et JSON (.json) depuis cette Bible Graphique V1.0.',
    ],
  },
];

export function generateArtBibleMarkdown(): string {
  const lines: string[] = [
    '# WORLD CHAOS : THE LIVING WORLDS — BIBLE GRAPHIQUE V1.0',
    '',
    '> Référentiel visuel et ergonomique officiel pour l’intégration Unity (Antigravity) — Monde 1 : **The Lost Jungle**.',
    '',
    '## 1. Orientations Artistiques Officielles',
    '- **Style graphique** : 3D Fantasy semi-réaliste',
    '- **Caméra** : Troisième personne amortie avec collision terrain',
    '- **Silhouettes** : Expressives, contrastées et lisibles en combat comme en exploration',
    '- **Environnements** : Luxuriants, monumentaux, brume atmosphérique et particules vivantes',
    '- **Interface (UI/UX)** : Sombre (#08110D), élégante, liserés Or Antique (#D4AF37), textes nets redessinés',
    '',
    '## 2. Palette Chromatique Officielle (60-30-10)',
    '| Rôle | Nom | Hex | Usage |',
    '|---|---|---|---|',
    ...OFFICIAL_PALETTE.map((c, i) => `| ${i + 1} | ${c.name} | \`${c.hex}\` | ${c.usage} |`),
    '',
    '## 3. Spécifications des 10 Planches Officielle',
    '',
  ];

  for (const p of ART_BIBLE_PLATES) {
    lines.push(`### ${p.number} — ${p.title} (${p.subtitle})`);
    lines.push(`**Catégorie :** ${p.category === 'environments' ? 'Environnements & Direction Artistique' : 'Interface & Expérience de Jeu'}`);
    lines.push('');
    lines.push(p.summary);
    lines.push('');
    lines.push('**Palette de la planche :** ' + p.palette.map((c) => `${c.name} (\`${c.hex}\`)`).join(' · '));
    lines.push('');
    lines.push('- **Éclairage :** ' + p.unitySpecs.lighting);
    lines.push('- **Matériaux PBR :** ' + p.unitySpecs.materials);
    lines.push('- **Caméra :** ' + p.unitySpecs.camera);
    lines.push('- **Silhouettes & Composition :** ' + p.unitySpecs.silhouetteAndComposition);
    if (p.uiRedesignNotes.length > 0) {
      lines.push('- **Refonte UI :** ' + p.uiRedesignNotes.join(' '));
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generateArtBibleJson(): string {
  return JSON.stringify(
    {
      title: 'WORLD CHAOS : THE LIVING WORLDS — Bible Graphique V1.0',
      world: 'World 1: The Lost Jungle',
      targetEngine: 'Unity 6 URP / WebGL2 Reference MVP',
      artDirection: {
        style: '3D Fantasy Semi-Realiste',
        camera: 'Third-person damped orbit with terrain collision',
        uiTheme: 'Dark Obsidian & Antique Gold',
      },
      officialPalette: OFFICIAL_PALETTE,
      plates: ART_BIBLE_PLATES,
    },
    null,
    2
  );
}
