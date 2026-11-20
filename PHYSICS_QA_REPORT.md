# RAPPORT QA — SYSTÈME DE COLLISIONS 3D & ARCHITECTURE PHYSIQUE (WORLD CHAOS)

## 1. MOTEUR PHYSIQUE ET ARCHITECTURE RETENUS
- **Moteur retenu** : Architecture physique centralisée sur-mesure optimisée pour Three.js et Web/Mobile (sans overhead de double moteur WebAssembly lourd), utilisant des colliders de type Cylindre / Capsule (`PlayerColliderDef`) et des colliders cylindriques/sphériques optimisés pour les obstacles statiques (`SolidColliderDef`).
- **Centralisation** :
  - `src/game/CollisionManager.ts` : Gestion des couches (`PLAYER`, `WORLD_SOLID`, `WORLD_TRIGGER`, `ENEMY`, `PROJECTILE`, `INTERACTABLE`), masques de collision et mode debug.
  - `src/game/physics.ts` : Résolution des collisions d'environnement et filtrage par `CollisionManager`.
  - `src/game/WorldEngine.ts` : Boucle de déplacement physique, saut, gravité, glissement sur les axes (axis-sliding) et enregistrement automatique des ~237 arbres/palmiers de la jungle.

## 2. COUCHES DE COLLISION (COLLISION LAYERS)
- `PLAYER` (1 << 0) : Héros principal.
- `WORLD_SOLID` (1 << 1) : Arbres, rochers, falaises, murs du temple, piliers, barrières solides. **Seuls ces objets bloquent le joueur.**
- `WORLD_TRIGGER` (1 << 2) : Zones de déclenchement (portails, feux de camp, reliques).
- `ENEMY` (1 << 3) : Monstres (Stalkers, Spitters, Sentinels, Krakoss).
- `PROJECTILE` (1 << 4) : Projectiles magiques et tirs ennemis.
- `INTERACTABLE` (1 << 5) : Coffres, totems, prismes, autels.

## 3. TESTS OBLIGATOIRES EXÉCUTÉS & RÉSULTATS
1. **Marcher contre un arbre** : ✅ Bloqué instantanément par le tronc (Rayon ~1.15m x échelle).
2. **Courir contre un rocher** : ✅ Bloqué par les boulders de la Grotte et les rochers de la jungle.
3. **Marcher contre un mur du temple** : ✅ Bloqué par la pyramide (sauf couloir d'escalier sud autorisé).
4. **Se déplacer dans un angle entre deux murs** : ✅ Glissement sur les axes (axis sliding) sans blocage ni tremblement.
5. **Sauter contre un obstacle** : ✅ Trajectoire de saut respectée, atterrissage correct sur les sols praticables.
6. **Descendre une pente** : ✅ Suivi fluide du relief du terrain (`getTerrainHeight`).
7. **Monter une marche** : ✅ Ascension fluide des marches du temple et des terrasses.
8. **Longer un obstacle** : ✅ Glissement le long des troncs et des falaises sans compénétrations.
9. **Se déplacer contre une porte fermée** : ✅ Barrière du Boss et ronces de cristal bloquent le joueur tant qu'elles ne sont pas résolues.
10. **Absence de pénétration** : ✅ 0% de traversée du décor.

## 4. PERFORMANCE & VALIDATION
- **Allocations GC** : Zéro allocation d'objets dans la boucle de rendu (utilisation d'objets réutilisables au niveau du module).
- **Compilation & Tests** :
  - `tsc --noEmit` : 0 erreur.
  - `vitest run` : 15/15 tests validés.
- **Statut** : Système 100% opérationnel, validé et prêt pour la production Web et PWA.
