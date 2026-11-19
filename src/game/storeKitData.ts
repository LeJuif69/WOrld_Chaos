export interface StoreScreenshotPreset {
  id: string;
  title: string;
  caption: string;
  position: [number, number, number];
  lookAt: [number, number, number];
}

export const STORE_SCREENSHOT_PRESETS: StoreScreenshotPreset[] = [
  {
    id: 'shot_01_jungle',
    title: '01 · The Lost Jungle',
    caption: 'Explorez une jungle semi-réaliste vivante et ses marécages turquoise.',
    position: [-16, 7.2, 34],
    lookAt: [-30, 1.8, 14],
  },
  {
    id: 'shot_02_camp',
    title: '02 · Campement & Alliés',
    caption: 'Préparez vos quêtes auprès de Lyra, Kael et des stèles de sauvegarde.',
    position: [14, 6.2, 57],
    lookAt: [0, 1.8, 44],
  },
  {
    id: 'shot_03_temple',
    title: '03 · Le Temple Oublié',
    caption: 'Résolvez les énigmes de gravité au sommet de la pyramide dorée.',
    position: [20, 11.2, -16],
    lookAt: [0, 4.4, -34],
  },
  {
    id: 'shot_04_boss',
    title: '04 · Boss Krakoss',
    caption: 'Affrontez le Gardien du Chaos en 3 phases dans son arène sacrée.',
    position: [13, 8.4, -71],
    lookAt: [0, 2.8, -84],
  },
  {
    id: 'shot_05_river',
    title: '05 · Rivière & Pont-Levis',
    caption: 'Débloquez les passages anciens et récoltez les cristaux du Chaos.',
    position: [36, 9.5, 28],
    lookAt: [24, 1.5, 12],
  },
  {
    id: 'shot_06_panorama',
    title: '06 · Panorama World 1',
    caption: 'Dix zones interconnectées prêtes pour Android, iOS, Web et PC.',
    position: [44, 34, 48],
    lookAt: [0, 3, -16],
  },
];

export const STORE_COPY = {
  title: 'WORLD CHAOS : The Living Worlds',
  shortDescFr: 'Action-aventure 3D hors ligne dans The Lost Jungle : combats, énigmes et pouvoirs.',
  shortDescEn: '3D action-adventure in The Lost Jungle: combat, puzzles, Chaos events & boss.',
  fullDescFr: `WORLD CHAOS : THE LIVING WORLDS — Monde 1 : The Lost Jungle

Plongez dans une aventure 3D Fantasy semi-réaliste jouable hors ligne sur mobile et navigateur, sans aucune publicité ni achat forcé.

CARACTÉRISTIQUES PRINCIPALES
• 10 zones interconnectées : Campement, Rivière, Ruines Anciennes, Grotte Secrète, Temple Oublié, Zone Chaos et Arène du Boss.
• 3 pouvoirs évolutifs : Shockwave (onde cinétique), Gravity Control (lévitation & sauts amplifiés) et Chaos Shield.
• Chaos Engine dynamique : survivez aux anomalies Gravity Flip, Collapse, Flood et Meteor Rain.
• 10 quêtes & 5 énigmes progressives avec 5 PNJ alliés et système d’indices intégré.
• Combat fluide à la 3e personne : combo rapide/lourd, esquive à invulnérabilité, verrouillage de cible et Boss Krakoss en 3 phases.
• Sauvegarde locale instantanée + synchronisation Cloud Google facultative et classement des explorateurs.`,
  fullDescEn: `WORLD CHAOS: THE LIVING WORLDS — World 1: The Lost Jungle

Embark on a semi-realistic 3D fantasy action-adventure playable offline with zero ads.

KEY FEATURES
• 10 interconnected zones: Base Camp, River, Ancient Ruins, Hidden Cave, Forgotten Temple, Chaos Zone & Boss Arena.
• 3 unlockable powers: Shockwave, Gravity Control, and Chaos Shield.
• Dynamic Chaos Engine: survive Gravity Flip, Collapse, Flood, and Meteor Rain anomalies.
• 10 quests & 5 puzzles with 5 ally NPCs and progressive hint system.
• Responsive 3rd-person combat: light/heavy strikes, dodge i-frames, lock-on targeting & 3-phase Boss Krakoss.
• Offline-first local saves + optional Google Cloud Sync & Explorer Mastery Leaderboard.`,
  privacyPolicy: `# Politique de Confidentialité — WORLD CHAOS : The Living Worlds

Dernière mise à jour : ${new Date().toISOString().slice(0, 10)}

1. Données collectées
- Mode Hors Ligne (Invité) : aucune donnée personnelle n'est envoyée. Votre progression est stockée uniquement dans la mémoire locale de votre appareil.
- Mode Cloud (Optionnel via Connexion Google) : votre identifiant Firebase UID et votre sauvegarde de jeu sont stockés de façon isolée dans Google Cloud Firestore afin de restaurer votre partie entre appareils.
- Classement public : seul votre pseudonyme public choisi (sans adresse e-mail) et vos statistiques de partie (niveau, XP, temps de jeu) apparaissent.

2. Publicités & Partage
WORLD CHAOS ne contient aucune publicité tierce, aucun traceur publicitaire et ne vend aucune donnée utilisateur.

3. Suppression des données
Vous pouvez supprimer votre sauvegarde locale à tout moment depuis l'appareil ou demander la suppression complète de vos données Cloud en écrivant au développeur.`,
};

export interface PlatformChecklistItem {
  id: string;
  platform: 'web_itch' | 'playstore' | 'appstore' | 'steam_pc';
  label: string;
  commandOrDetail: string;
}

export const PLATFORM_CHECKLIST: PlatformChecklistItem[] = [
  {
    id: 'web_1',
    platform: 'web_itch',
    label: 'Exporter le build production HTTPS optimisé (npm run build)',
    commandOrDetail: 'Déployer le dossier dist/ sur hébergement HTTPS (Cloud Run, Firebase Hosting ou Cloudflare Pages).',
  },
  {
    id: 'web_2',
    platform: 'web_itch',
    label: 'Uploader le ZIP HTML5 sur itch.io',
    commandOrDetail: 'Compresser le contenu de dist/ en world-chaos-html5.zip, cocher "This file will be played in the browser" (1280×720, Fullscreen button).',
  },
  {
    id: 'ps_1',
    platform: 'playstore',
    label: 'Déposer .well-known/assetlinks.json sur le domaine HTTPS',
    commandOrDetail: 'Utiliser le générateur ci-contre avec votre empreinte SHA-256 pour supprimer la barre navigateur en TWA.',
  },
  {
    id: 'ps_2',
    platform: 'playstore',
    label: 'Générer l’Android App Bundle (.aab) via Bubblewrap',
    commandOrDetail: 'npx @bubblewrap/cli init --manifest=https://VOTRE_DOMAINE/manifest.webmanifest && npx @bubblewrap/cli build',
  },
  {
    id: 'ps_3',
    platform: 'playstore',
    label: 'Importer les captures 16:9, icônes 512px et fiche sur Google Play Console',
    commandOrDetail: 'Lancer d’abord en test fermé (Play Console) puis promouvoir en Production.',
  },
  {
    id: 'ios_1',
    platform: 'appstore',
    label: 'Encapsuler le build dist/ dans Capacitor iOS',
    commandOrDetail: 'npm i @capacitor/core @capacitor/cli @capacitor/ios && npx cap init "WORLD CHAOS" com.worldchaos.livingworlds --web-dir=dist && npx cap add ios',
  },
  {
    id: 'ios_2',
    platform: 'appstore',
    label: 'Compiler l’archive .ipa via Xcode et soumettre à App Store Connect / TestFlight',
    commandOrDetail: 'Configurer orientation Paysage dans Info.plist et signer avec votre certificat Apple Developer.',
  },
  {
    id: 'pc_1',
    platform: 'steam_pc',
    label: 'Empaqueter en application bureau Windows/macOS/Linux (Tauri ou Electron)',
    commandOrDetail: 'Pointer Tauri (src-tauri) vers dist/ avec fenêtre 1280×720 plein écran par défaut et support manette.',
  },
  {
    id: 'pc_2',
    platform: 'steam_pc',
    label: 'Déployer sur Steamworks & itch.io Desktop',
    commandOrDetail: 'Uploader les builds Windows/Linux via SteamCMD (steam_appid.txt) et publier les fiches FR/EN.',
  },
];

export function buildAssetLinksJson(packageId: string, sha256Fingerprint: string): string {
  const cleanId = packageId.trim() || 'com.worldchaos.livingworlds';
  const cleanSha =
    sha256Fingerprint.trim() ||
    '00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00';
  return JSON.stringify(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: cleanId,
          sha256_cert_fingerprints: [cleanSha],
        },
      },
    ],
    null,
    2
  );
}
