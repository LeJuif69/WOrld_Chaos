import { SaveDataV1 } from './types';
import { isBlockedByWorldBarrier } from './gameLogic';
import { CollisionManager, CollisionLayer } from './CollisionManager';

export interface SolidColliderDef {
  id: string;
  x: number;
  z: number;
  radius: number;
  minY?: number;
  maxY?: number;
  layer?: CollisionLayer;
}

// Pre-defined static solid environment colliders (trees, boulders, temple base, ruins, pillars) belonging to WORLD_SOLID layer
export const STATIC_OBSTACLES: SolidColliderDef[] = [
  // Forgotten Temple base footprint (z = -34, radius ~8.5m, allowance for stairs in front z: -23..-34, x: -2.5..2.5)
  { id: 'temple_base', x: 0, z: -34, radius: 8.5, minY: 0, maxY: 6.5, layer: CollisionLayer.WORLD_SOLID },
  // Hidden Cave Grotto Boulders
  { id: 'cave_rock_1', x: 53, z: -15.5, radius: 4.2, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cave_rock_2', x: 53, z: -0.5, radius: 4.2, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cave_rock_3', x: 58, z: -12, radius: 4.5, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cave_rock_4', x: 58, z: -4, radius: 4.5, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cave_rock_5', x: 66, z: -8, radius: 5.5, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cave_rock_6', x: 74, z: -15, radius: 4.6, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cave_rock_7', x: 74, z: -1, radius: 4.6, layer: CollisionLayer.WORLD_SOLID },
  // Stratified Jungle Cliffs (Lot 2 outposts)
  { id: 'cliff_nw_1', x: -62, z: -18, radius: 5.8, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cliff_nw_2', x: -65, z: 26, radius: 6.2, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cliff_ne_1', x: 58, z: -26, radius: 5.8, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cliff_ne_2', x: 64, z: 22, radius: 6.0, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cliff_s_1', x: -18, z: -64, radius: 6.5, layer: CollisionLayer.WORLD_SOLID },
  { id: 'cliff_s_2', x: 22, z: -64, radius: 6.2, layer: CollisionLayer.WORLD_SOLID },
  // Secret Sanctuary Sacred Tree
  { id: 'sanctuary_tree', x: -73, z: -67, radius: 4.5, layer: CollisionLayer.WORLD_SOLID },
  // Ancient Ruins pillars around x = -30, z = -16
  { id: 'ruins_pillar_1', x: -30, z: -16, radius: 2.2, layer: CollisionLayer.WORLD_SOLID },
  { id: 'ruins_pillar_2', x: -22, z: -12, radius: 1.8, layer: CollisionLayer.WORLD_SOLID },
  { id: 'ruins_pillar_3', x: -38, z: -20, radius: 1.8, layer: CollisionLayer.WORLD_SOLID },
  // Camp Outpost center
  { id: 'camp_center', x: 0, z: 44, radius: 5.2, layer: CollisionLayer.WORLD_SOLID },
];

export function registerDynamicObstacles(obstacles: SolidColliderDef[]) {
  for (const obs of obstacles) {
    if (!obs.layer) obs.layer = CollisionLayer.WORLD_SOLID;
    if (!STATIC_OBSTACLES.some((o) => o.id === obs.id)) {
      STATIC_OBSTACLES.push(obs);
    }
  }
}

/**
 * Checks if a proposed character capsule position [x, z, y] collides with any WORLD_SOLID environment obstacle,
 * world barrier, or boundary, per CollisionManager mask rules.
 */
export function checkEnvironmentCollision(
  x: number,
  z: number,
  y: number,
  worldState: Pick<SaveDataV1['worldState'], 'bossGateOpen' | 'sanctuaryBarrierBroken'>
): boolean {
  // 1. World Boundary check
  if (Math.abs(x) > 110 || Math.abs(z) > 110) {
    return true;
  }

  // 2. World Barrier check (Boss Gate / Sanctuary Barrier)
  const barrierHit = isBlockedByWorldBarrier(x, z, worldState);
  if (barrierHit !== null) {
    return true;
  }

  const collisionManager = CollisionManager.getInstance();
  const playerRadius = 0.42;

  // 3. Static Obstacles (trees, rocks, pillars, cliffs) filtered through CollisionManager
  for (const obs of STATIC_OBSTACLES) {
    const obsLayer = obs.layer ?? CollisionLayer.WORLD_SOLID;
    // Ensure only WORLD_SOLID objects act as obstacles for the player's Capsule/Cylinder Collider
    if (!collisionManager.isPlayerObstacle(obsLayer)) {
      continue;
    }

    // If obstacle has height limits, check Y range
    if (obs.minY !== undefined && obs.maxY !== undefined) {
      if (y < obs.minY || y > obs.maxY) continue;
    }

    const dist = Math.hypot(x - obs.x, z - obs.z);
    if (dist < obs.radius + playerRadius) {
      // Special exception for Forgotten Temple front stairs (x between -2.8 and 2.8, z between -45 and -22)
      if (obs.id === 'temple_base') {
        if (Math.abs(x) < 2.8 && z >= -45 && z <= -23) {
          continue; // Walkable stairway corridor
        }
      }
      return true;
    }
  }

  return false;
}
