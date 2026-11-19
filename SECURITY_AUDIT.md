# WORLD CHAOS — AUDIT DE SÉCURITÉ & FIREBASE (RELEASE 1.0)

**Projet Firebase :** `united-builder-tnzsc`  
**Base Firestore :** `ai-studio-worldchaostheliv-86d66efb-8900-46e2-a0c9-a13370e46898`  
**Date :** 2026-11-18  
**Outils vérifiés :** `npx eslint firestore.rules` (via `@firebase/eslint-plugin-security-rules`), inspection statique de `firestore.rules`, `firebase-blueprint.json`, `src/firebase.ts`, `src/game/cloudSync.ts`, `src/components/CloudProfileModal.tsx`, `src/components/StoreReleaseModal.tsx`, `src/App.tsx`.

---

## 1. Résultat Automatisé des Règles Firestore

```bash
$ npx eslint firestore.rules
# Exit code: 0 (0 erreur, 0 avertissement)
```

Les règles ont été déployées avec succès via le workflow Firebase intégré lors de la phase précédente.

---

## 2. Matrice d’Audit Sécurité & Confidentialité

| Contrôle Audité | État | Gravité si défaut | Détail Technique Vérifié |
|---|---|---|---|
| **Verrou global default-deny** | **CONFORME** | — | `match /{document=**} { allow read, write: if false; }` (`firestore.rules:6-8`) |
| **Authentification requise sur données privées** | **CONFORME** | — | `isOwner(userId)` vérifie `request.auth != null && request.auth.token.email_verified == true && request.auth.uid == userId` (`firestore.rules:22-28`) |
| **Isolation des sauvegardes (`/users/{userId}/saves/{saveId}`)** | **CONFORME** | — | `get`, `list`, `create`, `update`, `delete` strictement réservés à `isOwner(userId)` avec validation d’ID `^[a-zA-Z0-9_\-]+$` (`1–128` car.) |
| **Protection PII sur `/leaderboard/{userId}`** | **CONFORME** | — | Aucun e-mail, téléphone ou jeton stocké. Seul `displayName` (`1–32` car.) + stats de jeu autorisés par whitelist stricte `hasOnly(...)` |
| **Intégrité temporelle & immuabilité `ownerId`** | **CONFORME** | — | `updatedAt == request.time` exigé sur `create`/`update` ; `incoming().ownerId == existing().ownerId` verrouillé sur `update` |
| **Validation profonde de `inventory` / `quests` / `worldState`** | **PARTIEL** | **Moyenne** | `firestore.rules:60-62` vérifie `inventory.size() <= 30`, `quests.keys().size() <= 15`, `worldState.keys().size() <= 20`, et `inventory[0] is map`, mais ne peut pas valider les éléments `1..29` ni le typage interne des sous-cartes |
| **Anti-triche Leaderboard côté serveur** | **ABSENT** | **Moyenne** | Un client modifié authentifié peut soumettre directement `level: 99, xp: 10000000, bossDefeated: true` dans `/leaderboard/{uid}` (bornes numériques respectées mais sans Cloud Function vérificatrice) |
| **Firebase App Check** | **ABSENT** | **Moyenne** | Aucune intégration `initializeAppCheck` (Play Integrity Android / reCAPTCHA Web). Expose les quotas Firestore publics (`leaderboard`, `test/connection`) aux scripts automatisés |
| **Fuite potentielle d’e-mail dans logs d’erreur Firestore** | **MINEUR** | **Faible** | `handleFirestoreError` (`src/firebase.ts:43-62`) sérialise `auth.currentUser?.email` dans `console.error` et `Error.message` en cas d’échec réseau/règle |
| **Exposition de clés secrètes côté client** | **CONFORME** | — | `firebase-applet-config.json` ne contient que la configuration SDK publique Firebase (normal côté client). Aucun secret OAuth ni clé `GEMINI_API_KEY` côté client |
| **Sonde `/test/connection`** | **CONFORME** | — | `allow get: if true; allow list, write: if false;` (`firestore.rules:88-91`) — lecture unitaire uniquement |
| **Artefact `DRAFT_firestore.rules` & config `oAuthClientId`** | **NETTOYAGE** | **Faible** | `DRAFT_firestore.rules` reste présent dans la racine ; `vite.config.ts` ne l’inclut pas dans `dist/`, mais il doit être supprimé pour la propreté du dépôt |

---

## 3. Audit OAuth & Flux de Connexion Mobile / TWA

- **Google Sign-In (`src/App.tsx:258-260`) :** Utilise `signInWithPopup(auth, googleProvider)`.
  - **Attention Mobile / iOS / WebView :** Sur certains navigateurs in-app restrictifs ou en PWA standalone iOS, `signInWithPopup` peut être bloqué ou rediriger hors de la fenêtre standalone. Dans l’environnement AI Studio iframe, `signInWithPopup` est requis ; toutefois, pour une release autonome iOS/TWA, prévoir un fallback ou tester rigoureusement le comportement de `signInWithPopup` dans Custom Tabs (Android TWA supporte nativement les popups OAuth via Custom Tabs, mais **Capacitor iOS** nécessite un plugin natif ou `signInWithRedirect`/ASWebAuthenticationSession).
- **Synchronisation hors ligne -> en ligne (`src/game/cloudSync.ts`) :**
  - Le jeu reste 100 % jouable sans compte (`localStorage`).
  - L’utilisateur peut comparer le score local vs Cloud (`computeSaveScore`) avant d’écraser dans un sens ou l’autre (`CloudProfileModal.tsx:245-251`) — excellente protection contre l’écrasement accidentel d’une progression avancée !
  - **Amélioration suggérée :** En cas de déconnexion pendant une session connectée (`navigator.onLine === false`), afficher un indicateur « Sync en attente » si l’auto-save cloud a échoué silencieusement (actuellement `.catch(() => {})` dans `App.tsx:116`).

---

## 4. Plan de Durcissement Recommandé Avant & Après Release 1.0

1. **Avant Release 1.0 (Obligatoire Play Store) :**
   - Héberger la **Politique de Confidentialité** (générée dans `StoreReleaseModal.tsx`) sur une URL HTTPS publique stable et renseigner la section **Sécurité des données (Data Safety)** sur Google Play Console (déclaration : UID Firebase Auth + progression de jeu + pseudo public, zéro pub, zéro revente).
   - Remplacer les empreintes SHA-256 factices de démonstration lors de la création de `/.well-known/assetlinks.json` par l’empreinte réelle **Google Play App Signing**.
   - Retirer `email` de l’objet lancé dans `throw new Error(...)` dans `src/firebase.ts:47`.
2. **Post-Release immédiate (V1.0.1 / V1.1) :**
   - Activer **Firebase App Check** (Play Integrity + reCAPTCHA Enterprise) et restreindre la clé API Google Cloud au domaine de production et à l’empreinte Android.
   - Si le classement devient compétitif, déplacer la publication `/leaderboard/{uid}` derrière une Cloud Function vérifiant le delta XP/temps de jeu.
