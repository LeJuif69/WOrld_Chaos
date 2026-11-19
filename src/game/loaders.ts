import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

let sharedDracoLoader: DRACOLoader | null = null;
let sharedGltfLoader: GLTFLoader | null = null;

/**
 * Returns a singleton GLTFLoader instance pre-configured with Draco compression support
 * for loading optimized .glb 3D assets in World Chaos.
 */
export function getDracoGltfLoader(): GLTFLoader {
  if (sharedGltfLoader) {
    return sharedGltfLoader;
  }

  const gltfLoader = new GLTFLoader();

  if (!sharedDracoLoader) {
    sharedDracoLoader = new DRACOLoader();
    // Use reliable CDN decoder path for Draco compressed GLB assets
    sharedDracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    // Enable decoding on mobile/worker threads if supported
    sharedDracoLoader.preload();
  }

  gltfLoader.setDRACOLoader(sharedDracoLoader);
  sharedGltfLoader = gltfLoader;
  return sharedGltfLoader;
}

/**
 * Helper to load a GLB model with automatic error handling and mesh shadow configuration.
 */
export async function loadGlbModel(url: string): Promise<THREE.Group | null> {
  try {
    const loader = getDracoGltfLoader();
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject);
    });

    if (gltf && gltf.scene) {
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return gltf.scene;
    }
    return null;
  } catch {
    return null;
  }
}
