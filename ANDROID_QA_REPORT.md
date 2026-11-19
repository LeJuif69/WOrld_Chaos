# WORLD CHAOS — ANDROID & PWA QA REPORT (RELEASE 1.0)

**Date :** 2026-11-18  
**Périmètre :** Ergonomie tactile, orientation paysage/portrait, cycle de vie WebGL2 & audio mobile, PWA hors ligne, prérequis Trusted Web Activity (TWA / Google Play).

---

## 1. Contrôles & Ergonomie Mobile (Vérifié par Code & Build)

| Élément Vérifié | Fichier(s) | État Technique | Statut |
|---|---|---|---|
| **Détection tactile automatique (`DEFAULT_SETTINGS`)** | `src/game/gameLogic.ts`, `src/game/saveSystem.ts` | `detectTouchCapableDevice()` (`pointer: coarse` ou `maxTouchPoints > 0`) masque le stick sur bureau tout en l’activant sur mobile | **PASS** *(unit/code)* |
| **Joystick gauche & caméra glissée droite** | `src/components/GameHUD.tsx` | `setPointerCapture(e.pointerId)` + `touch-none` sur joystick ET zone caméra droite + `onUnlockAudio()` au premier contact | **PASS** *(code)* / **NOT TESTED** *(doigt réel)* |
| **Cibles tactiles ≥ 44px** | `src/components/GameHUD.tsx` | Boutons `w-11 h-11` (44px) minimum même en breakpoint `<640px`, jusqu’à `w-16 h-16` (64px) pour l’attaque principale | **PASS** *(CSS/inspection)* |
| **Mode Portrait non bloquant & HUD adapté** | `src/components/GameHUD.tsx` | Détection `window.innerHeight > window.innerWidth && innerWidth < 768` → bannière fermable *« Mode Paysage recommandé »* + réduction compacte de la carte vitale (`w-44`) et du stick (`w-24`) sans chevauchement | **PASS** *(code/CSS)* / **NOT TESTED** *(appareil portrait)* |
| **Vibrations haptiques (`navigator.vibrate`)** | `src/game/haptics.ts`, `src/components/GameHUD.tsx`, `src/game/WorldEngine.ts` | Garde `typeof navigator.vibrate === 'function'` + toggle Paramètres `hapticsEnabled` | **PASS** *(code)* / **NOT TESTED** *(moteur vibreur Android)* |
| **Perte de contexte WebGL2 & reprise** | `src/game/WorldEngine.ts`, `src/App.tsx` | `webglcontextlost` (`e.preventDefault()`, pause boucle/audio, overlay Dark & Gold) + `webglcontextrestored` (PMREM, textures `needsUpdate`, recompilation shaders, reprise boucle) + bouton secours rechargement | **PASS** *(code)* / **NOT TESTED** *(veille Android)* |
| **Mise en arrière-plan mobile (`visibilitychange`)** | `src/game/WorldEngine.ts`, `src/game/audio.ts` | Suspend `AudioContext` si `document.hidden` et réinitialise `lastTime` au retour pour éviter tout pic `dt` | **PASS** *(code)* / **NOT TESTED** *(switch apps Android)* |

---

## 2. PWA Hors Ligne & Google Play TWA

| Critère | Détail Vérifié | Statut |
|---|---|---|
| **Web App Manifest (`dist/manifest.webmanifest`)** | Généré par VitePWA (`0.67 kB`) : `display: fullscreen`, `orientation: landscape`, `theme_color: #08110D`, icônes `192`, `512` `any`, `512` `maskable`, `apple-touch-icon.png` | **PASS** *(build)* |
| **Service Worker Offline (`dist/sw.js`)** | `vite-plugin-pwa` (`generateSW`) précaching `23` entrées (`1,922.32 KiB`) + `runtimeCaching` Google Fonts + `OfflineIndicator` | **PASS** *(build)* / **NOT TESTED** *(mode avion Android Chrome)* |
| **Installation PWA Chrome Android & mode avion** | Aucun smartphone Android ni Android Emulator connecté dans ce conteneur Linux | **NOT TESTED** |
| **Package `.aab` Bubblewrap & `/.well-known/assetlinks.json`** | Générateur présent dans `StoreReleaseModal.tsx`, mais `.aab` non compilé ici (nécessite JDK/Android SDK + URL HTTPS publique + SHA-256 Play App Signing) | **BLOCKED** *(infra externe)* |
