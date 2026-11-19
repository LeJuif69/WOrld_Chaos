# WORLD CHAOS — CHECKLIST FINALE DE RELEASE 1.0

**Version cible :** `1.0.0` (World 1 : *The Lost Jungle*)  
**Date :** 2026-11-18  

---

## Phase A — Correctifs Techniques Pré-Release (À exécuter avant mise en ligne)

- [ ] **BUG-01 [Élevée] :** Fermer le contournement latéral du portail Boss (`bossGateMesh` / colisée) tant que `bossGateOpen === false`.
- [ ] **BUG-02 [Élevée] :** Restaurer l’état visuel des puzzles (`symbolRotations`, `crystalLit`, `sequenceStep`) dans `WorldEngine.applySaveData()`.
- [ ] **BUG-03 [Élevée] :** Nettoyer `activeChaos`, `meteors`, `projectiles` et réinitialiser la rencontre Boss non vaincue dans `respawnAtCamp()`.
- [ ] **BUG-04 & BUG-05 [Élevée] :** Libérer `.material` des météores + toutes les textures `CanvasTexture` et `scene.environment` dans `WorldEngine.dispose()`.
- [ ] **BUG-06 [Élevée] :** Ajouter la gestion `webglcontextlost` / `webglcontextrestored` sur le canvas WebGL2.
- [ ] **BUG-07 à BUG-12 [Moyenne] :** Ajouter `setPointerCapture` sur la zone caméra droite (`GameHUD`), détecter `pointer: coarse` pour `showTouchControls`, appeler `emitHud()` à l’ouverture dialogue PNJ, passer `checkLevelUp()` en boucle `while`, débouncer `saveToCloud()`, annuler les `setTimeout` au démontage des modales.
- [ ] **Hygiène Dépôt [Moyenne] :** Supprimer dépendances inutilisées (`@google/genai`, `dotenv`, `express`, `motion`, `@types/express`), supprimer `DRAFT_firestore.rules` et `public/assets/aistudio/`, découper le bundle (`React.lazy` + `manualChunks`) sous 500 Ko par chunk.
- [x] **Vérification Build & Lint :** `npm run lint` (`tsc --noEmit`), `npm run build` (`vite build`), `npx eslint firestore.rules` passés (à ré-exécuter après les correctifs ci-dessus).

---

## Phase B — Tests Manuels Obligatoires Sur Appareils Réels (Non testés en sandbox Linux)

- [ ] **Playthrough Complet World 1 (Desktop + Mobile) :**
  - Parcourir les 10 zones (`Arrival` → `Camp` → `Wild Jungle` → `River` → `Ancient Ruins` → `Hidden Cave` → `Forgotten Temple` → `Chaos Zone` → `Boss Arena` → `Secret Sanctuary`).
  - Valider les 5 quêtes principales + 5 quêtes secondaires + 5 énigmes + 3 capacités (`Shockwave`, `Gravity Control`, `Chaos Shield`) + 4 événements Chaos + défaite & victoire sur Krakoss.
- [ ] **Test Mobile Android (Chrome + PWA installée) :**
  - Vérifier verrouillage paysage, ergonomie stick gauche + caméra droite, vibrations `navigator.vibrate`, FPS (≥ 30 FPS en `MEDIUM`, fluide en `LOW`), puis lancer en **Mode Avion** pour confirmer le démarrage 100 % hors ligne via Service Worker.
- [ ] **Test Cloud & Auth :**
  - Connexion Google sur compte réel → Sauvegarde Cloud → Chargement sur 2e appareil/navigateur → Vérification du classement public (zéro e-mail affiché).

---

## Phase C — Déploiement par Plateforme

### 1. Web & PWA (Jour 1 — Prioritaire)
- [ ] Déployer `dist/` sur hébergement HTTPS permanent (Firebase Hosting, Cloud Run ou Cloudflare Pages) avec en-têtes `Cache-Control` adaptés (`sw.js` en `no-cache`, `assets/*` en `immutable`).
- [ ] Vérifier score Lighthouse PWA (installabilité, icônes 192/512/maskable, offline `HTTP 200`).
- [ ] Publier l’archive ZIP de `dist/` sur **itch.io** (HTML5, `1280×720`, plein écran activé).

### 2. Android Trusted Web Activity — Google Play Store
- [ ] Initialiser le projet TWA avec Bubblewrap : `npx @bubblewrap/cli init --manifest=https://VOTRE_DOMAINE/manifest.webmanifest`
- [ ] Récupérer l’empreinte **SHA-256** du keystore *Play App Signing* (Play Console).
- [ ] Déposer le vrai fichier généré dans `public/.well-known/assetlinks.json` puis redéployer le site HTTPS.
- [ ] Vérifier `https://VOTRE_DOMAINE/.well-known/assetlinks.json` (`HTTP 200`, `application/json`) et tester l’APK/AAB généré sur un téléphone Android (absence totale de barre d’adresse Chrome).
- [ ] Publier la Politique de Confidentialité en HTTPS, importer les 6 captures 16:9 + icône `512×512` + textes FR/EN depuis le *Kit Publication Stores*, compléter la fiche *Data Safety* & *PEGI/IARC*, puis lancer un **Test fermé (Play Console)** avant la mise en Production.

### 3. iOS App Store (Post-TWA / Phase 2)
- [ ] Initialiser **Capacitor iOS** (`@capacitor/core`, `@capacitor/ios`) pointant vers `dist/` sur macOS.
- [ ] Configurer `Info.plist` (orientation Paysage uniquement, safe-areas iPhone avec encoche) et remplacer `signInWithPopup` par un flux compatible iOS WKWebView si Google Sign-In est conservé sur iOS.
- [ ] Tester sur iPhone physique via Xcode + TestFlight (Attention : `navigator.vibrate` reste inactif sur iOS, comportement normal et sécurisé).

### 4. PC Desktop & Steam (Phase 2)
- [ ] Empaqueter `dist/` via **Tauri** ou **Electron** (fenêtre `1280×720` / plein écran natif).
- [ ] Ajouter la prise en charge manette (`Gamepad API`) si visé pour certification *Full Controller Support* sur Steam.
- [ ] Publier builds Windows/Linux via Steamworks (`steam_appid.txt`) & itch.io Desktop.
