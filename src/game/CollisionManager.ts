import * as THREE from 'three';

export enum CollisionLayer {
  PLAYER = 1 << 0,       // 1
  WORLD_SOLID = 1 << 1,  // 2
  WORLD_TRIGGER = 1 << 2,// 4
  ENEMY = 1 << 3,        // 8
  PROJECTILE = 1 << 4,   // 16
  INTERACTABLE = 1 << 5, // 32
}

export interface CollisionMaskConfig {
  layer: CollisionLayer;
  mask: number;
}

export const COLLISION_MASKS: Record<string, CollisionMaskConfig> = {
  player: {
    layer: CollisionLayer.PLAYER,
    // Player capsule collider only treats WORLD_SOLID as physical solid obstacles
    mask: CollisionLayer.WORLD_SOLID | CollisionLayer.WORLD_TRIGGER | CollisionLayer.INTERACTABLE | CollisionLayer.ENEMY,
  },
  world_solid: {
    layer: CollisionLayer.WORLD_SOLID,
    mask: CollisionLayer.PLAYER | CollisionLayer.ENEMY | CollisionLayer.PROJECTILE,
  },
  world_trigger: {
    layer: CollisionLayer.WORLD_TRIGGER,
    mask: CollisionLayer.PLAYER,
  },
  enemy: {
    layer: CollisionLayer.ENEMY,
    mask: CollisionLayer.PLAYER | CollisionLayer.WORLD_SOLID | CollisionLayer.PROJECTILE,
  },
  projectile: {
    layer: CollisionLayer.PROJECTILE,
    mask: CollisionLayer.WORLD_SOLID | CollisionLayer.PLAYER | CollisionLayer.ENEMY,
  },
  interactable: {
    layer: CollisionLayer.INTERACTABLE,
    mask: CollisionLayer.PLAYER,
  },
};

export interface PlayerColliderDef {
  radius: number;
  height: number;
  center: THREE.Vector3;
}

export class CollisionManager {
  private static instance: CollisionManager;
  private debugMode = false;
  private debugGroup: THREE.Group | null = null;

  public static getInstance(): CollisionManager {
    if (!CollisionManager.instance) {
      CollisionManager.instance = new CollisionManager();
    }
    return CollisionManager.instance;
  }

  /**
   * Checks if layerA's collision mask permits collision with layerB.
   */
  public canCollide(layerA: CollisionLayer, layerB: CollisionLayer): boolean {
    for (const key of Object.keys(COLLISION_MASKS)) {
      const config = COLLISION_MASKS[key];
      if (config.layer === layerA) {
        return (config.mask & layerB) !== 0;
      }
    }
    return false;
  }

  /**
   * Returns true if the target layer acts as a solid obstacle for the player's Capsule/Cylinder Collider.
   * Per requirements, only WORLD_SOLID objects block the player.
   */
  public isPlayerObstacle(targetLayer: CollisionLayer): boolean {
    return (COLLISION_MASKS.player.mask & targetLayer) !== 0 && targetLayer === CollisionLayer.WORLD_SOLID;
  }

  public setDebugMode(enabled: boolean, scene?: THREE.Scene): void {
    this.debugMode = enabled;
    if (scene && !this.debugGroup) {
      this.debugGroup = new THREE.Group();
      this.debugGroup.name = 'CollisionDebugGroup';
      scene.add(this.debugGroup);
    }
    if (this.debugGroup) {
      this.debugGroup.visible = this.debugMode;
    }
  }

  public isDebugActive(): boolean {
    return this.debugMode;
  }

  public getDebugGroup(): THREE.Group | null {
    return this.debugGroup;
  }
}
