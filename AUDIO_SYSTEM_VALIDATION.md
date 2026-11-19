# WORLD CHAOS — AUDIO SYSTEM VALIDATION (RELEASE 1.0)

**Fichier audité et durci :** `src/game/audio.ts` (`AudioManager`), intégré via `src/game/WorldEngine.ts` et `src/components/GameHUD.tsx`.

---

## 1. Architecture Vérifiée

- **Bus de mixage hiérarchiques :**
  - `masterGain` → `masterCompressor` (`DynamicsCompressorNode`, seuil `-10 dB`, ratio `6:1`) → `ctx.destination`.
  - Sous-bus principaux : `musicGain` (`* 0.38 * pauseDuck`), `sfxGain` (`* 0.62`), `ambienceGain` (`* 0.28 * pauseDuck`).
  - Stems musicaux dynamiques : `jungleBus`, `templeBus`, `combatBus`, `themeBus`.
- **Crossfade dynamique par zone & contexte (`setZoneAudioContext`):**
  - Jungle (`arrival`, `wild_jungle`, `camp`), Rivière (`river` avec shimmer aigu `1450 Hz`), Grotte (`hidden_cave` résonance sombre `210 Hz`), Ruines/Temple (`ancient_ruins`, `forgotten_temple`, `secret_sanctuary`), Zone Chaos & Combat (`combatIntensity` `0..1`), Boss (`boss_arena`), Écrans (`menu`, `victory`, `defeat`).
  - Transitions exponentielles douces `setTargetAtTime(..., tau = 0.45–1.05s)` évitant tout clic ou coupure brutale.

---

## 2. Correctifs Appliqués & Contrôles

| Point Contrôlé | Résultat Inspection / Durcissement | Statut |
|---|---|---|
| **Prévention clipping / saturation multi-couches** | Ajout d’un `DynamicsCompressorNode` en sortie maître (`masterGain -> masterCompressor -> destination`) absorbant les crêtes lorsque combat + météores + rugissement boss + shockwave se superposent | **PASS** *(code)* |
| **Oscillateurs persistants (drones & bruit ambiant)** | 5 sources persistantes (`ambienceNode`, `jungleDroneOsc`, `jungleDroneFifthOsc`, `templeDroneOsc`, `templeDroneHarmOsc`) créées une seule fois (`if (this.jungleDroneOsc) return`) | **PASS** *(code)* |
| **Fuites AudioNodes éphémères (`playVoice`, `playSfx`, loop)** | Attachement systématique de `osc.onended = () => { osc.disconnect(); ... }` sur chaque oscillateur court afin de détacher immédiatement les nœuds du graphe WebAudio | **PASS** *(code)* |
| **Transition pause (`setPaused`)** | Attenuation progressive (`pauseDuck = 0.35`, `tau = 0.14–0.18s`), sans couper ni redémarrer les oscillateurs | **PASS** *(code)* |
| **Déverrouillage geste tactile mobile (`unlock`)** | Déclenché sur canvas `pointerdown`, joystick `handleJoyStart` et désormais aussi sur la zone caméra droite `handleCamDown` | **PASS** *(code)* |
| **Cycle de vie mobile arrière-plan (`visibilitychange`)** | `setBackgroundSuspended(document.hidden)` suspend `AudioContext` quand l’onglet/app passe en arrière-plan et le relance au retour | **PASS** *(code)* |
| **Nettoyage complet `AudioManager.dispose()`** | `clearInterval(musicInterval)`, `stop()` + `disconnect()` de tous les oscillateurs, filtres, bus et `masterCompressor`, `ctx.close()`, remise à `null` de toutes les références | **PASS** *(code)* |
| **Écoute audio réelle sur haut-parleurs / Android Chrome** | Aucun périphérique audio ni navigateur interactif disponible dans ce conteneur | **NOT TESTED** |
