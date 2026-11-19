# WORLD CHAOS — RELEASE CANDIDATE 1.0 (RAPPORT FINAL DE STABILISATION)

**Projet :** WORLD CHAOS — THE LIVING WORLDS (Monde 1 : *The Lost Jungle*)  
**Date :** 2026-11-18  
**Objectif :** Synthèse décisionnelle Release 1.0 suite à la passe de stabilisation Priorités 1 & 2 (`BUG-01` à `BUG-15`, `BUG-17`, `BUG-19`).

---

## 1. Résumé Exécutif & Score de Maturité Release 1.0

### Score Objectif Actuel : **82 / 100** *(Prêt pour Release Web/PWA Beta Publique — Validation physique Android requise avant soumission Play Store)*

| Axe d’Évaluation (Poids) | Score | Détail Justificatif | Statut |
|---|---|---|---|
| **Stabilité Code & Zéro Erreur Build/TS (20 pts)** | **20 / 20** | `tsc --noEmit` (0 erreur), `vite build` (`1.70s`), `15/15` tests Vitest passés, `BUG-01`..`BUG-15` corrigés, dépendances & fichiers orphelins nettoyés | **PASS** |
| **Performance Bundle & Pipeline 3D (15 pts)** | **14 / 15** | Chunk principal réduit de `1,844 kB` → `194.82 kB` (-89.4 %), ressources GPU mutualisées/libérées, eau `LOW` allégée (`three-vendor` reste à `556 kB` brut / `137.8 kB` gzip) | **PASS** |
| **Système Audio Procédural (10 pts)** | **9 / 10** | Limiteur `DynamicsCompressorNode`, `onended` disconnect, `visibilitychange` suspend/resume, `dispose()` complet ; non écouté sur matériel physique | **PASS** *(code)* |
| **Firebase Auth, Firestore & Sécurité (15 pts)** | **13 / 15** | `eslint firestore.rules` (`0` erreur), isolation UID strict, e-mail masqué des erreurs, débouncing Cloud `2.5s`, clamping local & cloud ; App Check V1.1 en attente | **PASS** |
| **QA Runtime Navigateur GPU & Gameplay Joué (20 pts)** | **12 / 20** | Intégrité données + logique critique vérifiée en Vitest (`15/15`), mais session 3D jouée complète (10 zones + Krakoss + 4 Chaos) non exécutée sur GPU réel ici | **PARTIAL** *(runtime `NOT TESTED`)* |
| **QA Physique Android / PWA / Play Store TWA (20 pts)** | **14 / 20** | Manifeste + SW offline Workbox + HUD portrait/paysage + `webglcontextlost` prêts ; installation réelle Chrome Android, vibrations physiques, `.aab` Bubblewrap et `assetlinks.json` hébergé restent à valider hors conteneur | **PARTIAL** *(hardware/infra `NOT TESTED` / `BLOCKED`)* |

---

## 2. Correctifs Implémentés (`BUG-01` à `BUG-15`, `BUG-17`, `BUG-19`)

- **Critiques / Élevées (`BUG-01` à `BUG-06`) :** Barrière circulaire complète autour de l’arène de Krakoss, restauration d’état logique/visuel des énigmes dans `applySaveData()`, nettoyage complet de `respawnAtCamp()`, partage de matériaux/géométries sur les météores & piliers, libération des 5 `CanvasTexture` + `scene.environment` dans `dispose()`, et gestion complète `webglcontextlost` / `webglcontextrestored` avec overlay UI de reprise.
- **Moyennes & Hygiène (`BUG-07` à `BUG-15`, `BUG-17`, `BUG-19`) :** `setPointerCapture` + `audio.unlock()` sur la zone caméra droite, détection tactile auto sur `DEFAULT_SETTINGS` + bannière portrait non bloquante + adaptation HUD mobile, synchronisation `emitHud()` sur dialogue PNJ, `applyLevelUps()` multi-niveaux plafonné à 99, débouncing Cloud `2 500 ms`, nettoyage des `setTimeout` au démontage dans `ArtBibleView`/`StoreReleaseModal`, redaction e-mail erreur + clamping save local/cloud, suppression des 5 paquets npm inutilisés & 2 fichiers orphelins, code-splitting (`index` à `194.82 kB`), et `import.meta.dirname`.

---

## 3. Résultats des Tests Automatisés, Build & Lint

| Vérification | Résultat | Statut |
|---|---|---|
| `npm test` (`vitest run`) | `3` fichiers, **`15 / 15` tests passés** (`1.63s`) | **PASS** |
| `npm run lint` (`tsc --noEmit`) | `0` erreur TypeScript | **PASS** |
| `npm run build` (`vite build`) | `1.70s`, `index` `194.82 kB` (`50.20 kB` gzip), `23` entrées precache (`1,922.32 KiB`) | **PASS** |
| `npx eslint firestore.rules` | Exit code `0` | **PASS** |

---

## 4. État Réel des Vérifications Non Exécutées (`NOT TESTED` / `BLOCKED`)

- **GPU Navigateur Bureau / Mobile (`NOT TESTED`) :** Mesure réelle des FPS (cible 60 FPS bureau / 30–60 FPS Android), consommation RAM/VRAM sur 20+ minutes et transitions visuelles entre les 10 zones.
- **Session Jouée Complète (`NOT TESTED`) :** Parcours interactif des 10 quêtes, 5 énigmes, 4 événements Chaos, combat Krakoss et obtention du Chaos Core.
- **Appareil Android Réel (`NOT TESTED`) :** Installation PWA depuis Chrome Android, mode avion hors ligne, geste tactile double-pouce simultané, vibrations `navigator.vibrate`, connexion Google OAuth en Custom Tab.
- **Packaging Google Play TWA (`BLOCKED` — infra externe requise) :** Génération du binaire signé `.aab` via Bubblewrap et publication du vrai `/.well-known/assetlinks.json` (empreinte SHA-256 Play App Signing) sur domaine HTTPS définitif.

---

## 5. Risques Résiduels & Plan de Clôture Avant Publication Commerciale

1. **Bloquant Play Store (Infra) :** Héberger le build `dist/` sur HTTPS stable (Firebase Hosting / Cloud Run), configurer `/.well-known/assetlinks.json` avec le SHA-256 Play App Signing, puis compiler et tester le `.aab` Bubblewrap sur appareil Android physique.
2. **Validation QA Humaine (1 heure recommandée) :** Jouer un run complet sur navigateur GPU bureau + smartphone Android (paysage, portrait, mode avion, connexion Google Cloud Save, combat Krakoss).
3. **Post-Release V1.0.1 :** Activer Firebase App Check (Play Integrity + reCAPTCHA v3) et animer `EnemyRig.limbs` (`BUG-16`).

---

## 6. Décision de Release (GO / NO-GO)

- **Web / PWA (Beta publique / itch.io HTML5) :** **GO CONDITIONNEL** *(build, sécurité, code-splitting et tests unitaires au vert ; effectuer un smoke-test navigateur GPU avant partage large)*.
- **Google Play Store (TWA `.aab` commercial) :** **GO APRÈS TESTS ANDROID PHYSIQUES** *(le code applicatif est prêt pour RC 1.0, sous réserve de valider les étapes matérielles et `assetlinks.json` listées en section 4)*.
