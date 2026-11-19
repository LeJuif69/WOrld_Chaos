# UI_REDESIGN_REPORT — WORLD CHAOS V1
**Identité UI/UX Dark & Or Antique — Cinematic Fantasy Adventure**

## 1. Système de Design & Tokens CSS (`src/index.css`)
- **Palette Obsidienne & Or Antique** : variables CSS cohérentes (`--wc-bg: #08110d`, `--wc-obsidian: #060d0a`, `--wc-gold: #d4af37`, `--wc-gold-bright: #f2cf66`, `--wc-turquoise: #14b8a6`, `--wc-amethyst: #a855f7`, `--wc-crimson: #dc2626`).
- **Composants de surface sans `backdrop-filter`** :
  - `.wc-panel` : dégradé obsidienne-émeraude profond, bordure or antique `rgba(212,175,55,0.44)` et liseré intérieur doré discret.
  - `.wc-panel-crimson` : variante obsidienne-carmin dédiée à la barre de Krakoss et à l’écran de défaite.
  - `.wc-divider-gold` : filet gravé horizontal en dégradé doré symétrique.
  - `.wc-bar-frame` : gouttière encastrée pour les jauges PV, EN et Boss.
  - `.wc-btn-gold` : bouton d’action principal dégradé or antique avec contraste élevé (`#08110D`).
- **Contrainte WebGL respectée** : **0 règle `backdrop-blur` ou `backdrop-filter`** sur l’ensemble des composants d’interface (`grep` vérifié sur `src/`).

---

## 2. Refonte des Écrans & Modales
| Composant | Améliorations visuelles appliquées |
| --- | --- |
| `MainMenu.tsx` | Vignette obsidienne directionnelle dévoilant le campement 3D à droite, titre `WORLD CHAOS` à lisible hiérarchie (`text-balance`), séparateur SVG losange/horizon gravé en or antique sous `THE LIVING WORLDS`, boutons `.wc-btn-gold` et cartouche de commandes `.wc-panel`. |
| `GameHUD.tsx` | Cartouche joueur `.wc-panel`, badge niveau encadré, jauges PV et EN sculptées (`.wc-bar-frame` + dégradés carmin/turquoise), barre Boss Krakoss `.wc-panel-crimson` à dégradé carmin-ambre, bannière de découverte ornée, mini-radar circulaire à graduations et repère `N`, stick tactile à anneau concentrique doré, boutons de compétences circulaires lumineux et boutons tactiles sculptés. |
| `PauseAndMenus.tsx` | `ModalFrame` en `.wc-panel` avec losange doré d’en-tête et `.wc-divider-gold` ; `InventoryModal` remplaçant les anciens carrés plats par des icônes vectorielles par catégorie (`FlaskConical`, `Compass`, `Gem`, `Cog`, `Award`, `Sparkles`) sur socle obsidienne ; `WorldMapModal` enrichi d’une grille topographique SVG et d’une rose des vents (`N · E / S · O`) ; `VictoryScreen` & `DefeatScreen` rééquilibrés avec médaillons encadrés et `.wc-btn-gold`. |
| `DialogueModal.tsx` | Panneau `.wc-panel` ancré en bas d’écran, portrait de rôle encadré d’or, séparateur `.wc-divider-gold` et choix interactifs `min-h-[44px]`. |
| `TutorialOverlay.tsx` | Carte compacte `.wc-panel` avec titre `tabular-nums`, `.wc-divider-gold` et bouton de fermeture préservé. |
| `App.tsx` | Écrans d’erreur WebGL, de restauration de contexte WebGL2 et de chargement `Suspense` alignés sur `.wc-panel` / `.wc-panel-crimson` avec icône `Compass`. |

---

## 3. Ergonomie Mobile & Règles Anti-Slop Préservées
- **Cibles tactiles** : tous les boutons d’action du HUD (`Carte`, `Quêtes`, `Sac`, `Pause`, `Ciblage`, pouvoirs `1/2/3`, `Esquive`, `Lourde`, `Attaque`, `Saut`, prompt `[E]`) conservent un minimum `>= 44px × 44px`.
- **Zone caméra tactile** : la moitié droite de l’écran (`top-16 right-0 bottom-0 left-1/2`) reste intacte pour l’orbite caméra au glissement sur mobile.
- **Bannière portrait non bloquante** : conservée en `.wc-panel` avec fermeture explicite sur mobile portrait (`< 768px`).
- **Accessibilité** : `focus-visible` doré net sur boutons/inputs, `font-mono-num` (`tabular-nums`) sur tous les compteurs.

---

## 4. Inventaire & Licences des Assets (Phase 7)
- **Icônes UI** : `lucide-react` (licence ISC) + SVG inline originaux créés pour le projet (diviseur d’or, grille topographique).
- **Textures 3D** : 100 % générées procéduralement en TypeScript/Canvas 2D dans `src/game/textures.ts` (aucun asset tiers téléchargé ou non sourcé).
- **Bible Graphique (`ArtBibleView.tsx`) & Icônes PWA (`vite.config.ts`)** : conservés intacts ; les fiches illustrées de la Bible Graphique restent présentées fidèlement comme concepts 2D et captures moteur réelles.
