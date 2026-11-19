import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export interface CharacterAnimationSet {
  idle?: THREE.AnimationAction;
  run?: THREE.AnimationAction;
  attack1?: THREE.AnimationAction;
  attack2?: THREE.AnimationAction;
  heavyAttack?: THREE.AnimationAction;
  jump?: THREE.AnimationAction;
  hit?: THREE.AnimationAction;
  stagger?: THREE.AnimationAction;
  death?: THREE.AnimationAction;
}

export interface LoadedCharacterAsset {
  root: THREE.Group;
  mixer?: THREE.AnimationMixer;
  animations: CharacterAnimationSet;
  isGlb: boolean;
  assetKey: string;
  sourcePath?: string;
}

export interface AssetSlotStatus {
  key: string;
  type: 'character' | 'environment' | 'prop';
  source: 'procedural_placeholder' | 'glb_external';
  filePath?: string;
  loaded: boolean;
  triangleCount?: number;
}

export class AssetManager {
  private loader: GLTFLoader;
  private activeMixers: Set<THREE.AnimationMixer> = new Set();
  private loadedGlbs: Map<string, GLTF> = new Map();
  private assetStatuses: Map<string, AssetSlotStatus> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
    this.initDefaultSlots();
  }

  private initDefaultSlots(): void {
    const defaultSlots: Array<{ key: string; type: 'character' | 'environment' | 'prop'; path?: string }> = [
      { key: 'hero', type: 'character', path: '/models/hero.glb' },
      { key: 'enemy_stalker', type: 'character', path: '/models/stalker.glb' },
      { key: 'enemy_spitter', type: 'character', path: '/models/spitter.glb' },
      { key: 'enemy_sentinel', type: 'character', path: '/models/sentinel.glb' },
      { key: 'boss_krakoss', type: 'character', path: '/models/boss_krakoss.glb' },
      { key: 'forgotten_temple', type: 'environment', path: '/models/temple.glb' },
      { key: 'sacred_tree', type: 'environment', path: '/models/sacred_tree.glb' },
    ];

    for (const slot of defaultSlots) {
      this.assetStatuses.set(slot.key, {
        key: slot.key,
        type: slot.type,
        source: 'procedural_placeholder',
        filePath: slot.path,
        loaded: false,
      });
    }
  }

  /**
   * Attempts to load a GLB asset by URL or path.
   * If not available or fails, returns null, allowing seamless fallback to procedural model.
   */
  public async tryLoadGlb(key: string, url: string): Promise<GLTF | null> {
    if (this.loadedGlbs.has(key)) {
      return this.loadedGlbs.get(key)!;
    }

    try {
      // Check head/fetch first to avoid loud 404 unhandled console rejections
      const check = await fetch(url, { method: 'HEAD' });
      if (!check.ok) {
        return null;
      }

      const gltf = await new Promise<GLTF>((resolve, reject) => {
        this.loader.load(url, resolve, undefined, reject);
      });

      // Enable shadow casting and receiving on all child meshes
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.loadedGlbs.set(key, gltf);
      const slot = this.assetStatuses.get(key);
      if (slot) {
        slot.source = 'glb_external';
        slot.loaded = true;
      }
      return gltf;
    } catch {
      // Graceful fallback to procedural
      return null;
    }
  }

  /**
   * Instantiates an animated character asset from either a GLB or creates an AnimationMixer for it.
   */
  public registerCharacterMixer(root: THREE.Group, gltfAnimations: THREE.AnimationClip[]): {
    mixer: THREE.AnimationMixer;
    actions: CharacterAnimationSet;
  } {
    const mixer = new THREE.AnimationMixer(root);
    const actions: CharacterAnimationSet = {};

    for (const clip of gltfAnimations) {
      const name = clip.name.toLowerCase();
      const action = mixer.clipAction(clip);
      if (name.includes('idle')) actions.idle = action;
      else if (name.includes('run') || name.includes('walk')) actions.run = action;
      else if (name.includes('attack_heavy') || name.includes('heavy')) actions.heavyAttack = action;
      else if (name.includes('attack1') || name.includes('attack_1')) actions.attack1 = action;
      else if (name.includes('attack2') || name.includes('attack_2')) actions.attack2 = action;
      else if (name.includes('jump')) actions.jump = action;
      else if (name.includes('hit') || name.includes('hurt')) actions.hit = action;
      else if (name.includes('stagger')) actions.stagger = action;
      else if (name.includes('die') || name.includes('death')) actions.death = action;
    }

    this.activeMixers.add(mixer);
    return { mixer, actions };
  }

  public unregisterMixer(mixer: THREE.AnimationMixer): void {
    this.activeMixers.delete(mixer);
    mixer.stopAllAction();
    mixer.uncacheRoot(mixer.getRoot());
  }

  public update(dt: number): void {
    for (const mixer of this.activeMixers) {
      mixer.update(dt);
    }
  }

  public getAssetSlots(): AssetSlotStatus[] {
    return Array.from(this.assetStatuses.values());
  }

  public dispose(): void {
    for (const mixer of this.activeMixers) {
      mixer.stopAllAction();
    }
    this.activeMixers.clear();
    this.loadedGlbs.clear();
  }
}
