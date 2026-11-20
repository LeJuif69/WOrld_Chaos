import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { AudioManager } from './audio';
import { triggerHaptic } from './haptics';
import { AssetManager } from './assetLoader';
import {
  buildCampGroup,
  buildCliffOutcrop,
  buildEnemyModel,
  buildExplorerModel,
  buildForgottenTemple,
  buildNpcModel,
  buildSanctuarySacredTree,
  EnemyRig,
  ExplorerRig,
  ExplorerTextureMaps,
  PbrTextureMaps,
} from './models';
import { PerformanceMonitor } from './performanceMonitor';
import { applyLevelUps, isBlockedByWorldBarrier } from './gameLogic';
import { checkEnvironmentCollision, registerDynamicObstacles, SolidColliderDef } from './physics';
import { createNewSaveData, saveGame } from './saveSystem';
import {
  createBarkNormalTexture,
  createBarkRoughnessTexture,
  createBarkTexture,
  createCliffNormalTexture,
  createCliffTexture,
  createClothNormalTexture,
  createContactShadowTexture,
  createFoliageNormalTexture,
  createFoliageTexture,
  createFrondTexture,
  createGrassNormalTexture,
  createGrassRoughnessTexture,
  createGrassTexture,
  createLeatherNormalTexture,
  createLeatherTexture,
  createObsidianNormalTexture,
  createObsidianRoughnessTexture,
  createObsidianTexture,
  createSkinNormalTexture,
  createSkinTexture,
  createStoneNormalTexture,
  createStoneRoughnessTexture,
  createStoneTexture,
  createSunbeamTexture,
  createWaterfallTexture,
  createWaterNormalTexture,
  createWaterTexture,
} from './textures';
import {
  AbilityId,
  ChaosEventType,
  EnemyAIState,
  EnemyFamily,
  GameSettings,
  HUDStateSnapshot,
  InteractableDef,
  NpcDef,
  PuzzleId,
  SaveDataV1,
  ZoneDef,
  ZoneId,
} from './types';
import { ABILITY_META, INTERACTABLES, ITEMS, NPCS, PUZZLES, QUESTS, WORLD_HALF_SIZE, ZONES } from './worldData';

// Module-scope reusable scratch math objects (zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _color = new THREE.Color();
const _colorMix = new THREE.Color();
const _fogColor = new THREE.Color();
const _skyColor = new THREE.Color();
const _hemiSky = new THREE.Color();
const _hemiGround = new THREE.Color();
const _sunTint = new THREE.Color();

interface EnemyEntity {
  id: string;
  name: string;
  family: EnemyFamily;
  spawnPos: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  hp: number;
  maxHp: number;
  speed: number;
  detectRange: number;
  attackRange: number;
  damage: number;
  state: EnemyAIState;
  stateTimer: number;
  attackCooldown: number;
  telegraphDuration: number;
  staggerTimer: number;
  patrolAngle: number;
  bossPhase: number;
  summonedP2: boolean;
  hitFlashTimer: number;
  hitSquash: number;
  rig: EnemyRig;
}

interface Projectile {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  damage: number;
  fromEnemy: boolean;
}

interface ShockRingVfx {
  mesh: THREE.Mesh;
  age: number;
  maxAge: number;
  maxScale: number;
}

interface SlashArcVfx {
  mesh: THREE.Mesh;
  age: number;
  maxAge: number;
  baseScale: number;
}

interface ParticleBurstVfx {
  points: THREE.Points;
  velocities: Float32Array;
  age: number;
  maxAge: number;
  baseSize: number;
  gravity: number;
  swirl: number;
}

interface MeteorHazard {
  ring: THREE.Mesh;
  rock: THREE.Mesh;
  pos: THREE.Vector3;
  timer: number;
  impacted: boolean;
}

interface CollapsePillar {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  timer: number;
}

interface InteractableRuntime {
  def: InteractableDef;
  group: THREE.Group;
  indicator: THREE.Mesh;
  active: boolean;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HUDStateSnapshot) => void;
  onOpenDialogue: (npc: NpcDef) => void;
  onOpenChestOrPopup: (title: string, message: string) => void;
  onStateChange: () => void;
  onWebGLContextChange?: (lost: boolean) => void;
  onCombatAction?: () => void;
  onSettingsChange?: (settings: GameSettings) => void;
}

export function getTerrainHeight(x: number, z: number): number {
  // Base rolling jungle topography
  let h =
    Math.sin(x * 0.045) * Math.cos(z * 0.045) * 1.15 +
    Math.sin(x * 0.11 + z * 0.07) * 0.35;

  // Flatten Arrival & Camp gently
  const dArrival = Math.hypot(x - 0, z - 82);
  if (dArrival < 18) h *= Math.max(0.15, dArrival / 18);

  const dCamp = Math.hypot(x - 0, z - 44);
  if (dCamp < 17) h = THREE.MathUtils.lerp(0.25, h, Math.max(0, (dCamp - 10) / 7));

  // River channel running roughly along x = 24..34, z = -30..55
  const riverCurveX = 27 + Math.sin(z * 0.06) * 5.5;
  const distRiver = Math.abs(x - riverCurveX);
  if (z > -28 && z < 60 && distRiver < 9) {
    const t = Math.max(0, 1 - distRiver / 9);
    h -= t * t * 2.1;
  }

  // Hidden Cave grotto flat clearing (east behind waterfall)
  const dCave = Math.hypot(x - 66, z + 8);
  if (dCave < 18) {
    h = THREE.MathUtils.lerp(0.15, h, Math.max(0, (dCave - 11) / 7));
  }

  // Ancient Ruins flat terrace
  const dRuins = Math.hypot(x + 30, z + 24);
  if (dRuins < 19) {
    h = THREE.MathUtils.lerp(0.35, h, Math.max(0, (dRuins - 12) / 7));
  }

  // Forgotten Temple base + stepped pyramid tiers at (0, -34)
  const tx = Math.abs(x);
  const tz = Math.abs(z + 34);
  if (tx < 14 && tz < 14) {
    h = 0.4;
    if (tx < 9 && tz < 9) h = 2.2;
    if (tx < 6.25 && tz < 6.25) h = 4.6;
    if (tx < 3.6 && tz < 3.6) h = 7.0;
    // South stepped stairway ramp for readable ascent
    if (x > -2.5 && x < 2.5 && z > -34 && z < -23) {
      const stairH = (( -23 - z ) / 11) * 7.1;
      h = Math.max(h, Math.min(7.0, stairH));
    }
  }

  // Secret Sanctuary clearing
  const dSanc = Math.hypot(x + 66, z + 64);
  if (dSanc < 17) {
    h = THREE.MathUtils.lerp(0.5, h, Math.max(0, (dSanc - 11) / 6));
  }

  // Chaos Zone elevated fractured basin
  const dChaos = Math.hypot(x - 44, z + 46);
  if (dChaos < 20) {
    h = THREE.MathUtils.lerp(1.4, h, Math.max(0, (dChaos - 12) / 8));
  }

  // Boss Arena sunken flat colosseum at (0, -82)
  const dBoss = Math.hypot(x, z + 82);
  if (dBoss < 22) {
    h = THREE.MathUtils.lerp(0.0, h, Math.max(0, (dBoss - 17) / 5));
  }

  // Natural perimeter mountain ridge at world edge
  const rEdge = Math.max(Math.abs(x), Math.abs(z));
  if (rEdge > 98) {
    h += Math.pow((rEdge - 98) / 14, 2) * 8.0;
  }

  return h;
}

export class WorldEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  public audio: AudioManager;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private rimLight!: THREE.DirectionalLight;
  private isSoftwareGl = false;

  private frameId = 0;
  private disposed = false;
  private contextLost = false;
  private lastTime = performance.now();
  private hudEmitAccum = 0;

  // World visual elements
  private waterMesh!: THREE.Mesh;
  private waterTex!: THREE.Texture;
  private waterNormalTex!: THREE.Texture;
  private waterfallTex!: THREE.Texture;
  private stoneNormalTex!: THREE.Texture;
  private stoneRoughnessTex!: THREE.Texture;
  private barkNormalTex!: THREE.Texture;
  private barkRoughnessTex!: THREE.Texture;
  private foliageNormalTex!: THREE.Texture;
  private obsidianTex!: THREE.Texture;
  private obsidianNormalTex!: THREE.Texture;
  private obsidianRoughnessTex!: THREE.Texture;
  private sunbeamTex!: THREE.Texture;
  private pbrMaps!: PbrTextureMaps;
  private baseWaterY = -0.35;
  private currentWaterY = -0.35;
  private bridgeMesh!: THREE.Mesh;
  private bossGateMesh!: THREE.Mesh;
  private sanctuaryBarrierMesh!: THREE.Mesh;
  private campFlame!: THREE.Object3D | null;
  private campEmbers: THREE.Points | null = null;
  private waterfallMist: THREE.Points | null = null;
  private floatingStones: THREE.Object3D[] = [];
  private fireflies: THREE.Points | null = null;
  private shadowTex!: THREE.Texture;
  private disposableTextures: THREE.Texture[] = [];
  private disposableMaterials: THREE.Material[] = [];
  private foliageWindTime = { value: 0 };
  private waterShaderTime = { value: 0 };

  // Shared VFX / Hazard GPU Assets (prevents shader & material leaks)
  private sharedMeteorRingGeo: THREE.RingGeometry | null = null;
  private sharedMeteorRingMat: THREE.MeshBasicMaterial | null = null;
  private sharedMeteorRockGeo: THREE.DodecahedronGeometry | null = null;
  private sharedMeteorRockMat: THREE.MeshStandardMaterial | null = null;
  private sharedCollapsePillarGeo: THREE.DodecahedronGeometry | null = null;
  private sharedCollapsePillarMat: THREE.MeshStandardMaterial | null = null;
  private sharedProjectileGeo: THREE.SphereGeometry | null = null;
  private sharedEnemyProjMat: THREE.MeshStandardMaterial | null = null;
  private sharedPlayerProjMat: THREE.MeshStandardMaterial | null = null;

  // Player state
  private explorer!: ExplorerRig;
  private playerPos = new THREE.Vector3(0, 1.5, 84);
  private playerVel = new THREE.Vector3();
  private playerYaw = Math.PI;
  private onGround = true;
  private jumpCount = 0;
  private dodgeTimer = 0;
  private dodgeCooldown = 0;
  private attackTimer = 0;
  private comboStep = 0;
  private attackHitDone = false;
  private animTime = 0;
  private footstepAccum = 0;
  private dodgeTrailAccum = 0;
  private invulnTimer = 0;

  // Camera state
  private camYaw = Math.PI;
  private camPitch = 0.36;
  private camSmoothPos = new THREE.Vector3(0, 6, 92);
  private screenShake = 0;
  private camKick = new THREE.Vector3();
  private camFovKick = 0;
  private readonly baseFov = 58;

  // Gameplay & Save State
  private saveData: SaveDataV1;
  private settings: GameSettings;
  private screenMode: 'menu' | 'playing' | 'paused' | 'victory' | 'defeat' = 'menu';

  // Input state
  private keys: Record<string, boolean> = {};
  private touchMove = { x: 0, y: 0 };
  private isPointerOrbiting = false;
  private canvasPointerActive = false;
  private lastPointer = { x: 0, y: 0 };
  private pointerDownPos = { x: 0, y: 0 };
  private pointerDragDist = 0;

  // Dynamic Entities
  private npcs: Array<{ def: NpcDef; mesh: THREE.Group }> = [];
  private interactables: InteractableRuntime[] = [];
  private enemies: EnemyEntity[] = [];
  private projectiles: Projectile[] = [];
  private shockRings: ShockRingVfx[] = [];
  private slashArcs: SlashArcVfx[] = [];
  private particleBursts: ParticleBurstVfx[] = [];
  private meteors: MeteorHazard[] = [];
  private collapsePillars: CollapsePillar[] = [];

  // Puzzle state
  private symbolRotations: [number, number, number] = [1, 2, 0]; // Target: [0, 1, 2]
  private sequenceStep = 0;
  private crystalLit: [boolean, boolean, boolean] = [false, false, false];

  // Abilities & Chaos Engine
  private abilityCooldowns: Record<AbilityId, number> = {
    shockwave: 0,
    gravity_control: 0,
    chaos_shield: 0,
  };
  private gravityControlTimer = 0;
  private chaosShieldTimer = 0;

  private chaosEventIndex = 0;
  private chaosNextCountdown = 28;
  private activeChaos: {
    type: ChaosEventType;
    phase: 'warning' | 'active';
    timer: number;
    meteorTick: number;
  } | null = null;

  // Feedback & UI Banners
  private lockedEnemyId: string | null = null;
  private barrierToastCooldown = 0;
  private saveToast: string | null = null;
  private saveToastTimer = 0;
  private discoveryBanner: { title: string; subtitle: string } | null = null;
  private discoveryTimer = 0;
  private hitStopTimer = 0;
  private currentZone: ZoneDef = ZONES[0];

  // Performance & Asset Management (Lot 2)
  private perfMonitor: PerformanceMonitor;
  private assetManager: AssetManager;
  private jungleDustMotes?: THREE.Points;
  private creepingMistPatches: THREE.Mesh[] = [];
  private cliffOutcrops: THREE.Group[] = [];

  constructor(container: HTMLElement, settings: GameSettings, callbacks: EngineCallbacks) {
    this.container = container;
    this.settings = settings;
    this.callbacks = callbacks;
    this.perfMonitor = new PerformanceMonitor();
    this.assetManager = new AssetManager();
    this.audio = new AudioManager();
    this.audio.applySettings(settings);
    this.saveData = createNewSaveData();

    this.initThree();
    this.buildWorld();
    this.bindWindowEvents();
    this.startLoop();
  }

  private initThree(): void {
    this.isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
    this.applyGraphicsQuality();

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#275249');
    this.scene.fog = new THREE.FogExp2('#12291f', 0.011);

    const aspect = (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.25, 260);

    // Procedural Jungle Canopy & Golden-Hour Sky IBL (zero external HDRI 404s)
    this.scene.environment = this.createJungleEnvironmentTexture();

    // Warm golden key light + turquoise/moss hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x7dd3c8, 0x16291e, 0.82);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffe7b3, 1.62);
    this.sunLight.position.set(35, 58, 25);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 140;
    const d = 38;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Subtle cool turquoise rim light for crisp photoreal silhouettes
    this.rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.52);
    this.rimLight.position.set(-40, 24, -50);
    this.scene.add(this.rimLight);

    // Apply shadow resolution & frustum calibrated for the active graphics profile
    this.applyGraphicsQuality();
  }

  private createJungleEnvironmentTexture(): THREE.Texture {
    const envScene = new THREE.Scene();
    const skyGeo = new THREE.SphereGeometry(32, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSunDir: { value: new THREE.Vector3(0.55, 0.68, 0.45).normalize() },
      },
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vWorldDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uSunDir;
        varying vec3 vWorldDir;
        void main() {
          float y = clamp(vWorldDir.y, -1.0, 1.0);
          vec3 zenith = vec3(0.08, 0.28, 0.25);
          vec3 canopyTeal = vec3(0.16, 0.42, 0.34);
          vec3 goldenHorizon = vec3(0.86, 0.67, 0.36);
          vec3 mossFloor = vec3(0.05, 0.12, 0.08);
          vec3 col = y >= 0.0
            ? mix(goldenHorizon, mix(canopyTeal, zenith, smoothstep(0.15, 0.85, y)), smoothstep(0.0, 0.36, y))
            : mix(goldenHorizon * 0.45, mossFloor, smoothstep(0.0, -0.45, y));
          float sunHalo = pow(max(dot(normalize(vWorldDir), uSunDir), 0.0), 18.0);
          col += vec3(1.45, 1.12, 0.68) * sunHalo;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    envScene.add(skyDome);

    // Crisp specular bounce cards for metallic gold/obsidian & water reflections
    const sunCardGeo = new THREE.PlaneGeometry(14, 14);
    const sunCardMat = new THREE.MeshBasicMaterial({ color: 0xffe4a0, side: THREE.DoubleSide });
    const sunCard = new THREE.Mesh(sunCardGeo, sunCardMat);
    sunCard.position.set(16, 18, 12);
    sunCard.lookAt(0, 0, 0);
    envScene.add(sunCard);

    const rimCardMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, side: THREE.DoubleSide });
    const rimCard = new THREE.Mesh(sunCardGeo, rimCardMat);
    rimCard.position.set(-16, 10, -14);
    rimCard.lookAt(0, 0, 0);
    envScene.add(rimCard);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmremGenerator.fromScene(envScene, 0.035).texture;
    pmremGenerator.dispose();
    skyGeo.dispose();
    skyMat.dispose();
    sunCardGeo.dispose();
    sunCardMat.dispose();
    rimCardMat.dispose();
    return envTex;
  }

  private applyGraphicsQuality(): void {
    if (!this.renderer) return;
    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      if (this.sunLight) this.sunLight.castShadow = false;
    } else {
      const q = this.settings.graphicsQuality;
      const maxDpr = q === 'HIGH' ? 2 : q === 'MEDIUM' ? 1.5 : 1;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      this.renderer.shadowMap.enabled = q !== 'LOW';
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      if (this.sunLight) {
        this.sunLight.castShadow = q !== 'LOW';
        const targetMapSize = q === 'HIGH' ? 2048 : 1024;
        if (this.sunLight.shadow.mapSize.x !== targetMapSize) {
          if (this.sunLight.shadow.map) {
            this.sunLight.shadow.map.dispose();
            this.sunLight.shadow.map = null;
          }
          this.sunLight.shadow.mapSize.set(targetMapSize, targetMapSize);
        }
        this.sunLight.shadow.radius = q === 'HIGH' ? 2.5 : 1.4;
        const d = q === 'HIGH' ? 34 : 38;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.camera.updateProjectionMatrix();
      }
    }
    this.syncWaterMaterialForQuality();
  }

  private createWaterMaterial(): THREE.Material {
    const isLowCost = this.settings.graphicsQuality === 'LOW' || this.isSoftwareGl;
    const mat = isLowCost
      ? new THREE.MeshStandardMaterial({
          map: this.waterTex,
          normalMap: this.waterNormalTex,
          normalScale: new THREE.Vector2(0.45, 0.45),
          color: 0x1ea89a,
          roughness: 0.24,
          metalness: 0.1,
          transparent: true,
          opacity: 0.82,
        })
      : new THREE.MeshPhysicalMaterial({
          map: this.waterTex,
          normalMap: this.waterNormalTex,
          normalScale: new THREE.Vector2(0.58, 0.58),
          color: 0x1ea89a,
          roughness: 0.14,
          metalness: 0.12,
          transparent: true,
          opacity: 0.84,
          clearcoat: 0.92,
          clearcoatRoughness: 0.12,
        });

    mat.customProgramCacheKey = () => (isLowCost ? 'wc_water_low_v1' : 'wc_water_pbr_v1');
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWaterTime = this.waterShaderTime;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uWaterTime;
varying vec3 vWaterWorldPos;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
float wWave = sin(transformed.x * 0.42 + uWaterTime * 1.9) * 0.032 + cos(transformed.z * 0.38 - uWaterTime * 1.6) * 0.028;
transformed.y += wWave;
vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uWaterTime;
varying vec3 vWaterWorldPos;`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
float rippleA = sin(vWaterWorldPos.x * 1.35 + vWaterWorldPos.z * 0.95 - uWaterTime * 2.1);
float rippleB = cos(vWaterWorldPos.x * 1.1 - vWaterWorldPos.z * 1.45 + uWaterTime * 1.7);
float foamCrest = smoothstep(0.68, 0.96, (rippleA + rippleB) * 0.5 + 0.5);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.68, 0.96, 0.92), foamCrest * 0.22);`
        )
        .replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
vec3 viewDirW = normalize(cameraPosition - vWaterWorldPos);
float fresnel = pow(1.0 - max(viewDirW.y, 0.0), 3.0);
totalEmissiveRadiance += mix(vec3(0.04, 0.22, 0.21), vec3(0.42, 0.36, 0.2), fresnel) * fresnel * 0.65;`
        );
    };
    return mat;
  }

  private syncWaterMaterialForQuality(): void {
    if (!this.waterMesh || !this.waterTex) return;
    const isLowCost = this.settings.graphicsQuality === 'LOW' || this.isSoftwareGl;
    const curIsPhysical = this.waterMesh.material instanceof THREE.MeshPhysicalMaterial;
    if (isLowCost && curIsPhysical) {
      (this.waterMesh.material as THREE.Material).dispose();
      this.waterMesh.material = this.createWaterMaterial();
    } else if (!isLowCost && !curIsPhysical) {
      (this.waterMesh.material as THREE.Material).dispose();
      this.waterMesh.material = this.createWaterMaterial();
    }
  }

  private buildWorld(): void {
    const isLowCostTex = this.settings.graphicsQuality === 'LOW' || this.isSoftwareGl;
    const highResSize = isLowCostTex ? 512 : 1024;
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const grassTex = createGrassTexture(maxAniso, highResSize);
    const grassNormalTex = createGrassNormalTexture(maxAniso);
    const grassRoughnessTex = createGrassRoughnessTexture(maxAniso);
    const stoneTex = createStoneTexture(maxAniso, highResSize);
    this.stoneNormalTex = createStoneNormalTexture(maxAniso);
    this.stoneRoughnessTex = createStoneRoughnessTexture(maxAniso);
    const barkTex = createBarkTexture(maxAniso);
    this.barkNormalTex = createBarkNormalTexture(maxAniso);
    this.barkRoughnessTex = createBarkRoughnessTexture(maxAniso);
    const foliageTex = createFoliageTexture(maxAniso);
    this.foliageNormalTex = createFoliageNormalTexture(maxAniso);
    const frondTex = createFrondTexture(maxAniso);
    this.obsidianTex = createObsidianTexture(maxAniso);
    this.obsidianNormalTex = createObsidianNormalTexture(maxAniso);
    this.obsidianRoughnessTex = createObsidianRoughnessTexture(maxAniso);
    this.waterTex = createWaterTexture(maxAniso);
    this.waterNormalTex = createWaterNormalTexture(maxAniso);
    this.waterfallTex = createWaterfallTexture(maxAniso);
    this.sunbeamTex = createSunbeamTexture();
    this.shadowTex = createContactShadowTexture();

    // Lot 2 PBR Textures for Hero Adventurer and Jungle Cliffs
    const skinTex = createSkinTexture(256);
    const skinNormalTex = createSkinNormalTexture(maxAniso, 256);
    const leatherTex = createLeatherTexture(maxAniso, 256);
    const leatherNormalTex = createLeatherNormalTexture(maxAniso, 256);
    const clothNormalTex = createClothNormalTexture(maxAniso, 128);
    const cliffTex = createCliffTexture(maxAniso, highResSize);
    const cliffNormalTex = createCliffNormalTexture(maxAniso, highResSize);

    this.pbrMaps = {
      stoneNormal: this.stoneNormalTex,
      stoneRoughness: this.stoneRoughnessTex,
      barkNormal: this.barkNormalTex,
      barkRoughness: this.barkRoughnessTex,
      foliageNormal: this.foliageNormalTex,
    };
    this.disposableTextures = [
      grassTex,
      grassNormalTex,
      grassRoughnessTex,
      stoneTex,
      this.stoneNormalTex,
      this.stoneRoughnessTex,
      barkTex,
      this.barkNormalTex,
      this.barkRoughnessTex,
      foliageTex,
      this.foliageNormalTex,
      frondTex,
      this.obsidianTex,
      this.obsidianNormalTex,
      this.obsidianRoughnessTex,
      this.waterTex,
      this.waterNormalTex,
      this.waterfallTex,
      this.sunbeamTex,
      this.shadowTex,
      skinTex,
      skinNormalTex,
      leatherTex,
      leatherNormalTex,
      clothNormalTex,
      cliffTex,
      cliffNormalTex,
    ];

    // Pre-allocate shared VFX/Hazard geometries and materials
    this.sharedMeteorRingGeo = new THREE.RingGeometry(2.5, 3.1, 24);
    this.sharedMeteorRingMat = new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide });
    this.sharedMeteorRockGeo = new THREE.DodecahedronGeometry(0.95, 0);
    this.sharedMeteorRockMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      emissive: 0xea580c,
      emissiveIntensity: 0.9,
    });
    this.sharedCollapsePillarGeo = new THREE.DodecahedronGeometry(1.4, 0);
    this.sharedCollapsePillarMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
    this.sharedProjectileGeo = new THREE.SphereGeometry(0.28, 8, 8);
    this.sharedEnemyProjMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635,
      emissive: 0x65a30d,
      emissiveIntensity: 1.4,
    });
    this.sharedPlayerProjMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
    });

    // 1. Sculpted 240x240 continuous Terrain Mesh with organic biome vertex tinting
    const geo = new THREE.PlaneGeometry(240, 240, 120, 120);
    geo.rotateX(-Math.PI / 2);
    const posAttr = geo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      // Smooth biome vertex tint blending across all 10 zones with organic dappled patch noise
      const dBoss = Math.hypot(vx, vz + 82);
      const dChaos = Math.hypot(vx - 44, vz + 46);
      const dRuins = Math.hypot(vx + 30, vz + 24);
      const dTemple = Math.max(Math.abs(vx), Math.abs(vz + 34));
      const dCave = Math.hypot(vx - 64, vz + 8);
      const dSanct = Math.hypot(vx + 66, vz + 64);
      const dCamp = Math.hypot(vx, vz - 44);

      const macroPatch =
        0.5 +
        0.28 * Math.sin(vx * 0.065 + vz * 0.052) +
        0.22 * Math.cos(vx * 0.13 - vz * 0.11);
      const microPatch = 0.5 + 0.5 * Math.sin(vx * 0.28 - vz * 0.23);

      // Blend deep forest moss shadow -> lush emerald -> warm sunlit olive clearing
      _color.set('#4e8b53');
      _colorMix.set('#7aa85c');
      _color.lerp(_colorMix, THREE.MathUtils.clamp(macroPatch, 0, 1) * 0.72);
      if (microPatch > 0.68) {
        _colorMix.set('#687d4b'); // Subtle forest-floor humus & warm earth mottling
        _color.lerp(_colorMix, (microPatch - 0.68) * 1.15);
      }

      // Smooth damp riverbank transition instead of a hard elevation threshold
      if (vy < 0.35) {
        const bankBlend = THREE.MathUtils.clamp((0.35 - vy) / 0.95, 0, 1);
        _colorMix.set('#315948');
        _color.lerp(_colorMix, bankBlend);
      }
      if (dCamp < 24) {
        _colorMix.set('#83b366');
        _color.lerp(_colorMix, Math.max(0, 1 - dCamp / 24) * 0.7);
      }
      if (dRuins < 24) {
        _colorMix.set('#807c66');
        _color.lerp(_colorMix, Math.max(0, 1 - dRuins / 24) * 0.85);
      }
      if (dTemple < 17) {
        _colorMix.set('#7a7661');
        _color.lerp(_colorMix, Math.max(0, 1 - dTemple / 17) * 0.9);
      }
      if (dCave < 22) {
        _colorMix.set('#3a4c62');
        _color.lerp(_colorMix, Math.max(0, 1 - dCave / 22) * 0.9);
      }
      if (dSanct < 21) {
        _colorMix.set('#40a675');
        _color.lerp(_colorMix, Math.max(0, 1 - dSanct / 21) * 0.82);
      }
      if (dChaos < 26) {
        _colorMix.set('#4d3661');
        _color.lerp(_colorMix, Math.max(0, 1 - dChaos / 26) * 0.95);
      }
      if (dBoss < 27) {
        _colorMix.set('#3f2948');
        _color.lerp(_colorMix, Math.max(0, 1 - dBoss / 27) * 0.95);
      }

      colors[i * 3] = _color.r;
      colors[i * 3 + 1] = _color.g;
      colors[i * 3 + 2] = _color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      normalMap: grassNormalTex,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: grassRoughnessTex,
      vertexColors: true,
      roughness: 1.0,
      metalness: 0.02,
    });
    const terrain = new THREE.Mesh(geo, terrainMat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // 2. River & Waterfall Water Plane (subdivided for subtle wave vertex motion + Fresnel shader)
    const waterGeo = new THREE.PlaneGeometry(220, 220, 48, 48);
    waterGeo.rotateX(-Math.PI / 2);
    this.waterMesh = new THREE.Mesh(waterGeo, this.createWaterMaterial());
    this.waterMesh.position.y = this.baseWaterY;
    this.scene.add(this.waterMesh);

    // Dual-layer animated Waterfall cascade & foam basin at cave entrance
    const waterfallMat = new THREE.MeshStandardMaterial({
      map: this.waterfallTex,
      color: 0x99f6e4,
      emissive: 0x0d9488,
      emissiveIntensity: 0.42,
      roughness: 0.18,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });
    const waterfallMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 11.2), waterfallMat);
    waterfallMesh.position.set(47, 4.5, -8);
    waterfallMesh.rotation.y = -Math.PI / 2;
    this.scene.add(waterfallMesh);

    const waterfallBack = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 11.0),
      new THREE.MeshBasicMaterial({
        map: this.waterfallTex,
        color: 0xccfbf1,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
      })
    );
    waterfallBack.position.set(47.35, 4.5, -8);
    waterfallBack.rotation.y = -Math.PI / 2;
    this.scene.add(waterfallBack);

    const foamPool = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 4.4, 24),
      new THREE.MeshBasicMaterial({
        color: 0xccfbf1,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    foamPool.rotation.x = -Math.PI / 2;
    foamPool.position.set(45.4, this.baseWaterY + 0.06, -8);
    this.scene.add(foamPool);

    // Subtle atmospheric golden canopy sunbeams in scenic clearings
    const sunbeamMat = new THREE.MeshBasicMaterial({
      map: this.sunbeamTex,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const sunbeamGeo = new THREE.PlaneGeometry(5.6, 17);
    const beamCoords: Array<[number, number, number, number]> = [
      [1.8, 8.8, -21.0, 0.3],
      [-4.2, 9.6, -29.0, 0.85],
      [6.4, 9.2, -26.5, -0.45],
      [-70.0, 9.4, -63.0, 0.5],
      [-76.0, 9.6, -69.5, -0.6],
      [3.5, 8.6, 42.5, 0.2],
    ];
    for (const [bx, by, bz, ry] of beamCoords) {
      const beam = new THREE.Mesh(sunbeamGeo, sunbeamMat);
      beam.position.set(bx, by, bz);
      beam.rotation.set(0.24, ry, -0.26);
      this.scene.add(beam);
    }

    // 3. Instanced Jungle Trees, Palms, Ferns, Grass Tufts, Shrubs & Biome Rocks
    this.buildInstancedJungle(barkTex, stoneTex, foliageTex, frondTex);

    // 3b. Swamp Lily Pads & Adaptive Environmental Particles (Fireflies, Camp Embers, Waterfall Mist)
    const padGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.05, 11, 1, false, 0, Math.PI * 1.85);
    const padMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const padInst = new THREE.InstancedMesh(padGeo, padMat, 42);
    const padDummy = new THREE.Object3D();
    const padTint = new THREE.Color();
    const padPalette = [0x1c6e3d, 0x268044, 0x185c37, 0x358c44];
    for (let i = 0; i < 42; i++) {
      const pz = -18 + i * 1.85;
      const px = 27 + Math.sin(pz * 0.06) * 5.5 + Math.cos(i * 1.9) * 3.4;
      const s = 0.65 + (i % 4) * 0.22;
      padDummy.position.set(px, this.baseWaterY + 0.04, pz);
      padDummy.rotation.y = i * 0.8;
      padDummy.scale.set(s, 1, s * (0.9 + (i % 3) * 0.08));
      padDummy.updateMatrix();
      padInst.setMatrixAt(i, padDummy.matrix);
      padTint.setHex(padPalette[i % padPalette.length]);
      padInst.setColorAt(i, padTint);
    }
    padInst.instanceMatrix.needsUpdate = true;
    if (padInst.instanceColor) padInst.instanceColor.needsUpdate = true;
    padInst.computeBoundingSphere();
    this.scene.add(padInst);

    const isLowQuality = this.settings.graphicsQuality === 'LOW' || this.isSoftwareGl;
    const ffCount = isLowQuality ? 130 : this.settings.graphicsQuality === 'MEDIUM' ? 220 : 300;
    const ffPos = new Float32Array(ffCount * 3);
    const ffCol = new Float32Array(ffCount * 3);
    for (let i = 0; i < ffCount; i++) {
      const fx = (Math.random() - 0.5) * 184;
      const fz = (Math.random() - 0.5) * 184;
      ffPos[i * 3] = fx;
      ffPos[i * 3 + 1] = getTerrainHeight(fx, fz) + 0.8 + Math.random() * 4.5;
      ffPos[i * 3 + 2] = fz;
      if (Math.hypot(fx - 44, fz + 46) < 28 || Math.hypot(fx, fz + 82) < 28) {
        _color.set(i % 2 === 0 ? '#a855f7' : '#f43f5e');
      } else if (Math.hypot(fx - 64, fz + 8) < 24) {
        _color.set(i % 2 === 0 ? '#38bdf8' : '#c084fc');
      } else {
        _color.set(i % 3 === 0 ? '#14b8a6' : '#f2cf66');
      }
      ffCol[i * 3] = _color.r;
      ffCol[i * 3 + 1] = _color.g;
      ffCol[i * 3 + 2] = _color.b;
    }
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    ffGeo.setAttribute('color', new THREE.BufferAttribute(ffCol, 3));
    const ffMat = new THREE.PointsMaterial({
      size: 0.34,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.fireflies = new THREE.Points(ffGeo, ffMat);
    this.scene.add(this.fireflies);

    // Rising Campfire Embers
    const emberCount = isLowQuality ? 14 : 28;
    const emberPos = new Float32Array(emberCount * 3);
    const campY = getTerrainHeight(0, 44);
    for (let i = 0; i < emberCount; i++) {
      emberPos[i * 3] = (Math.random() - 0.5) * 1.1;
      emberPos[i * 3 + 1] = campY + 0.7 + Math.random() * 3.6;
      emberPos[i * 3 + 2] = 44 + (Math.random() - 0.5) * 1.1;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    this.campEmbers = new THREE.Points(
      emberGeo,
      new THREE.PointsMaterial({
        color: 0xfbbf24,
        size: 0.19,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.scene.add(this.campEmbers);

    // Waterfall Spray Mist Particles
    const mistCount = isLowQuality ? 18 : 36;
    const mistPos = new Float32Array(mistCount * 3);
    for (let i = 0; i < mistCount; i++) {
      mistPos[i * 3] = 44.5 + Math.random() * 3.2;
      mistPos[i * 3 + 1] = this.baseWaterY + 0.3 + Math.random() * 2.8;
      mistPos[i * 3 + 2] = -8 + (Math.random() - 0.5) * 6.5;
    }
    const mistGeo = new THREE.BufferGeometry();
    mistGeo.setAttribute('position', new THREE.BufferAttribute(mistPos, 3));
    this.waterfallMist = new THREE.Points(
      mistGeo,
      new THREE.PointsMaterial({
        color: 0x99f6e4,
        size: 0.42,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      })
    );
    this.scene.add(this.waterfallMist);

    // 4. Key Landmarks per Zone
    // 01. Arrival Crashed Sky-Skiff (ribbed hull, brass thruster, sail, distress beacon, cargo)
    const skiff = new THREE.Group();
    const skiffWoodMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      normalMap: this.barkNormalTex,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: this.barkRoughnessTex,
      color: 0x9a5422,
      roughness: 0.88,
      metalness: 0.12,
    });
    const skiffBrassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.15, 6.4), skiffWoodMat);
    hull.rotation.set(0.18, 0.4, -0.22);
    hull.castShadow = true;
    hull.receiveShadow = true;
    skiff.add(hull);
    const keel = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.24, 6.6), skiffBrassMat);
    keel.rotation.set(0.18, 0.4, -0.22);
    keel.position.y = 0.48;
    skiff.add(keel);
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.78, 0.9, 10), skiffBrassMat);
    thruster.rotation.set(Math.PI / 2 + 0.18, 0, 0.4);
    thruster.position.set(-1.1, 0.4, -2.7);
    skiff.add(thruster);
    const sail = new THREE.Mesh(
      new THREE.ConeGeometry(1.9, 4.1, 4),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.86 })
    );
    sail.position.set(0.6, 1.7, -0.4);
    sail.rotation.z = -0.52;
    sail.castShadow = true;
    skiff.add(sail);
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.95), skiffWoodMat);
    crate1.position.set(2.8, -0.1, 1.4);
    crate1.rotation.y = 0.5;
    crate1.castShadow = true;
    skiff.add(crate1);
    skiff.position.set(-5, getTerrainHeight(-5, 84) + 0.45, 84);
    this.scene.add(skiff);

    // 02. Camp Outpost
    const campGroup = buildCampGroup(barkTex, stoneTex, undefined, undefined, this.pbrMaps);
    campGroup.position.set(0, getTerrainHeight(0, 44), 44);
    this.campFlame = campGroup.getObjectByName('camp_flame') ?? null;
    this.scene.add(campGroup);

    // 04. River Drawbridge (timber deck + guard rails, rotates cleanly on z)
    const bridgeGeo = new THREE.BoxGeometry(10, 0.45, 4.2);
    const bridgeMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      normalMap: this.barkNormalTex,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: this.barkRoughnessTex,
      roughness: 1.0,
    });
    this.bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    for (const rz of [-1.95, 1.95]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.52, 0.22), skiffBrassMat);
      rail.position.set(0, 0.48, rz);
      this.bridgeMesh.add(rail);
    }
    this.bridgeMesh.position.set(27, 0.25, 14);
    this.bridgeMesh.rotation.z = 0.85; // Raised initially
    this.bridgeMesh.castShadow = true;
    this.bridgeMesh.receiveShadow = true;
    this.scene.add(this.bridgeMesh);

    // 05. Ancient Ruins Pillars & Carved Archway
    const pillarMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      normalMap: this.stoneNormalTex,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughnessMap: this.stoneRoughnessTex,
      roughness: 1.0,
    });
    const ruinsGoldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.24, metalness: 0.85 });
    for (const [px, pz, h] of [
      [-38, -16, 4.5],
      [-22, -16, 5.2],
      [-38, -32, 3.8],
      [-22, -32, 5.8],
      [-30, -14, 2.2],
    ]) {
      const py = getTerrainHeight(px, pz);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, h, 8), pillarMat);
      p.position.set(px, py + h * 0.5, pz);
      p.castShadow = true;
      p.receiveShadow = true;
      this.scene.add(p);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 1.7), pillarMat);
      cap.position.set(px, py + h + 0.16, pz);
      this.scene.add(cap);
    }
    const ruinsLintel = new THREE.Mesh(new THREE.BoxGeometry(17.5, 1.05, 1.35), pillarMat);
    ruinsLintel.position.set(-30, getTerrainHeight(-30, -16) + 5.3, -16);
    ruinsLintel.castShadow = true;
    this.scene.add(ruinsLintel);
    const ruinsFrieze = new THREE.Mesh(new THREE.BoxGeometry(17.7, 0.2, 1.45), ruinsGoldMat);
    ruinsFrieze.position.set(-30, getTerrainHeight(-30, -16) + 5.85, -16);
    this.scene.add(ruinsFrieze);

    // 06. Hidden Cave Sculpted Rock Grotto (organic boulders + stalactites + cool crystal light)
    const caveMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      normalMap: this.stoneNormalTex,
      normalScale: new THREE.Vector2(1.05, 1.05),
      roughnessMap: this.stoneRoughnessTex,
      color: 0x3b4d63,
      roughness: 1.0,
    });
    for (const [cx, cy, cz, r, sx, sy, sz] of [
      [53, 2.8, -15.5, 4.4, 1.1, 1.2, 1.0],
      [53, 2.8, -0.5, 4.4, 1.1, 1.2, 1.0],
      [58, 7.2, -12, 4.5, 1.4, 0.75, 1.4],
      [58, 7.2, -4, 4.5, 1.4, 0.75, 1.4],
      [66, 7.8, -8, 5.8, 1.7, 0.65, 2.1],
      [74, 3.6, -15, 4.8, 1.0, 1.4, 1.2],
      [74, 3.6, -1, 4.8, 1.0, 1.4, 1.2],
    ]) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), caveMat);
      rock.position.set(cx, cy, cz);
      rock.scale.set(sx, sy, sz);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
    }
    const caveLight = new THREE.PointLight(0x818cf8, 2.8, 28, 1.5);
    caveLight.position.set(66, 4.6, -8);
    this.scene.add(caveLight);

    // 07. Forgotten Temple Stepped Pyramid
    const templeGroup = buildForgottenTemple(stoneTex, undefined, this.pbrMaps);
    templeGroup.position.set(0, 0, -34);
    this.scene.add(templeGroup);

    // 08. Floating Gravity Stones (Temple & Chaos Zone)
    const floatMat = new THREE.MeshStandardMaterial({
      color: 0x6b21a8,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.55,
      roughness: 0.4,
      metalness: 0.25,
    });
    for (const [fx, fy, fz] of [
      [-8, 4.2, -36],
      [8, 5.1, -36],
      [38, 4.2, -44],
      [50, 5.4, -52],
      [44, 6.2, -39],
      [52, 4.7, -41],
      [39, 5.8, -54],
    ]) {
      const fs = new THREE.Mesh(new THREE.OctahedronGeometry(1.15, 0), floatMat);
      fs.position.set(fx, fy, fz);
      fs.userData.baseY = fy;
      this.scene.add(fs);
      this.floatingStones.push(fs);
    }

    // 09. Secret Sanctuary Sacred Tree
    const sacredTree = buildSanctuarySacredTree(barkTex, undefined, foliageTex, undefined, this.pbrMaps);
    sacredTree.position.set(-73, getTerrainHeight(-73, -67), -67);
    const patchedSacredMats = new Set<THREE.Material>();
    sacredTree.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.material.map === foliageTex && !patchedSacredMats.has(obj.material)) {
          patchedSacredMats.add(obj.material);
          this.applyFoliageWindAndHueShader(obj.material, {
            windStrength: 0.065,
            hueVariation: 0.55,
            groundedAnchor: false,
          });
        }
      }
    });
    this.scene.add(sacredTree);

    // 10. Boss Arena Colosseum Ring & Seal Gate (Obsidian, Gold & Crimson Braziers)
    const obsidianMat = new THREE.MeshStandardMaterial({
      map: this.obsidianTex,
      normalMap: this.obsidianNormalTex,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: this.obsidianRoughnessTex,
      roughness: 1.0,
      metalness: 0.28,
    });
    const crimsonBrazierMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.6,
      roughness: 0.25,
    });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      if (Math.abs(Math.sin(a) - 1) < 0.25) continue; // Leave south entrance gap
      const bx = Math.cos(a) * 20;
      const bz = -82 + Math.sin(a) * 20;
      const by = getTerrainHeight(bx, bz);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.7, 2.3), obsidianMat);
      plinth.position.set(bx, by + 0.35, bz);
      this.scene.add(plinth);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.08, 6.5, 8), obsidianMat);
      col.position.set(bx, by + 3.6, bz);
      col.castShadow = true;
      this.scene.add(col);
      const colCap = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 2.1), ruinsGoldMat);
      colCap.position.set(bx, by + 6.9, bz);
      this.scene.add(colCap);
      const brazier = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crimsonBrazierMat);
      brazier.position.set(bx, by + 7.55, bz);
      this.scene.add(brazier);
    }

    this.bossGateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 5.2, 0.9),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.95,
        transparent: true,
        opacity: 0.65,
      })
    );
    this.bossGateMesh.position.set(0, 2.6, -59);
    this.scene.add(this.bossGateMesh);

    // Sanctuary Crystal Bramble Barrier (with crystalline spire prongs)
    this.sanctuaryBarrierMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4.5, 1.4),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x0891b2,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.72,
      })
    );
    for (const ox of [-2.6, 0, 2.6]) {
      const shard = new THREE.Mesh(
        new THREE.ConeGeometry(0.55, 2.6, 5),
        new THREE.MeshStandardMaterial({
          color: 0x67e8f9,
          emissive: 0x06b6d4,
          emissiveIntensity: 1.0,
          roughness: 0.2,
        })
      );
      shard.position.set(ox, 1.5, 0);
      shard.rotation.z = ox * -0.14;
      this.sanctuaryBarrierMesh.add(shard);
    }
    this.sanctuaryBarrierMesh.position.set(-50, getTerrainHeight(-50, -44) + 2.2, -44);
    this.sanctuaryBarrierMesh.rotation.y = Math.PI / 4;
    this.scene.add(this.sanctuaryBarrierMesh);

    // 5. Build Protagonist Explorer (realistic PBR rig with procedural fallback)
    this.explorer = buildExplorerModel(this.shadowTex, {
      skinMap: skinTex,
      skinNormal: skinNormalTex,
      leatherMap: leatherTex,
      leatherNormal: leatherNormalTex,
      clothNormal: clothNormalTex,
    });
    this.explorer.root.position.copy(this.playerPos);
    this.scene.add(this.explorer.root);

    // 5b. Monumental Stratified Jungle Cliffs (framing canyon & temple approach)
    const cliffPositions: Array<[number, number, number, number]> = [
      [-62, -18, 0.45, 1.0],
      [-65, 26, -0.32, 1.15],
      [58, -26, -0.75, 1.0],
      [64, 22, 0.85, 1.1],
      [-18, -64, 0.15, 1.3],
      [22, -64, -0.22, 1.25],
    ];
    for (const [cx, cz, crot, cscale] of cliffPositions) {
      const cliff = buildCliffOutcrop(cliffTex, cliffNormalTex);
      cliff.position.set(cx, getTerrainHeight(cx, cz) - 1.2, cz);
      cliff.rotation.y = crot;
      if (cscale !== 1.0) cliff.scale.setScalar(cscale);
      this.scene.add(cliff);
      this.cliffOutcrops.push(cliff);
    }

    // 5c. Atmospheric Sunbeam Dust Motes / Jungle Spores
    const moteCount = isLowCostTex ? 80 : 180;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 130;
      motePos[i * 3 + 1] = 1.5 + Math.random() * 11.0;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 130;
    }
    moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: isLowCostTex ? 0.35 : 0.24,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.jungleDustMotes = new THREE.Points(moteGeo, moteMat);
    this.scene.add(this.jungleDustMotes);

    // 5d. Ground-level Creeping River & Humid Glade Mist
    const creepingMistGeo = new THREE.PlaneGeometry(28, 28);
    const creepingMistMat = new THREE.MeshBasicMaterial({
      color: 0xa7f3d0,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    for (const [mx, mz, myOff] of [
      [26, 12, 0.4],
      [28, 38, 0.35],
      [2, 74, 0.3],
      [-12, -22, 0.45],
    ]) {
      const mist = new THREE.Mesh(creepingMistGeo, creepingMistMat);
      mist.rotation.x = -Math.PI / 2;
      mist.position.set(mx, getTerrainHeight(mx, mz) + myOff, mz);
      this.scene.add(mist);
      this.creepingMistPatches.push(mist);
    }

    // 6. Build 5 NPCs
    for (const npc of NPCS) {
      const mesh = buildNpcModel(npc.cloakColor, npc.accentColor, this.shadowTex, npc.id);
      const y = getTerrainHeight(npc.position[0], npc.position[1]);
      mesh.position.set(npc.position[0], y, npc.position[1]);
      mesh.rotation.y = npc.rotationY;
      this.scene.add(mesh);
      this.npcs.push({ def: npc, mesh });
    }

    // 7. Build 30+ Interactive Objects
    this.buildInteractables(stoneTex);

    // 8. Spawn Enemy Families + Krakoss Boss
    this.spawnEnemies();

    // Warm shader compilation on GPU only
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
  }

  private mergeGeometryParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const normalized = parts.map((p) => {
      const g = p.index ? p.toNonIndexed() : p;
      if (g !== p) p.dispose();
      return g;
    });
    const merged = mergeGeometries(normalized, false);
    for (const g of normalized) g.dispose();
    merged.computeBoundingSphere();
    return merged;
  }

  private createArchedBladeGeometry(
    length: number,
    baseWidth: number,
    archHeight: number,
    droopEnd: number,
    segments = 4
  ): THREE.BufferGeometry {
    // Sculpted arched blade with subtle V-fold midrib for crisp natural highlights
    const verts: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const z = t * length;
      const y = Math.sin(t * Math.PI * 0.72) * archHeight - t * t * droopEnd;
      const w = baseWidth * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.5) * (1 - t * 0.85) + 0.015;
      const midDrop = -w * 0.22;

      // Left edge, center midrib, right edge
      verts.push(-w, y + midDrop, z, 0, y, z, w, y + midDrop, z);
      uvs.push(0, t, 0.5, t, 1, t);

      if (s < segments) {
        const row = s * 3;
        const next = (s + 1) * 3;
        indices.push(row, next, row + 1, row + 1, next, next + 1);
        indices.push(row + 1, next + 1, row + 2, row + 2, next + 1, next + 2);
      }
    }

    const blade = new THREE.BufferGeometry();
    blade.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    blade.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    blade.setIndex(indices);
    blade.computeVertexNormals();
    return blade;
  }

  private applyTreeTrunkWindShader(mat: THREE.MeshStandardMaterial, swayAmount: number): void {
    mat.customProgramCacheKey = () => `tree_trunk_wind_${swayAmount}`;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = this.foliageWindTime;
      shader.uniforms.uSwayAmount = { value: swayAmount };
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uWindTime;
uniform float uSwayAmount;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
vec4 trunkOrigin = vec4(0.0, 0.0, 0.0, 1.0);
#ifdef USE_INSTANCING
  trunkOrigin = modelMatrix * instanceMatrix * trunkOrigin;
#else
  trunkOrigin = modelMatrix * trunkOrigin;
#endif
float trunkHeightMask = clamp(position.y / 6.0, 0.0, 1.0);
float trunkBreeze = sin(uWindTime * 1.25 + trunkOrigin.x * 0.16 + trunkOrigin.z * 0.12);
transformed.x += trunkBreeze * (uSwayAmount * trunkHeightMask);
transformed.z += cos(uWindTime * 0.95 + trunkOrigin.z * 0.15) * (uSwayAmount * 0.65 * trunkHeightMask);`
        );
    };
  }

  private applyFoliageWindAndHueShader(
    mat: THREE.MeshStandardMaterial,
    opts: { windStrength: number; hueVariation: number; groundedAnchor: boolean }
  ): void {
    mat.customProgramCacheKey = () =>
      `tree_foliage_v2_${opts.windStrength}_${opts.hueVariation}_${opts.groundedAnchor ? 1 : 0}`;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = this.foliageWindTime;
      shader.uniforms.uWindStrength = { value: opts.windStrength };
      shader.uniforms.uHueVar = { value: opts.hueVariation };

      const swayMaskExpr = opts.groundedAnchor
        ? 'clamp(max(position.y * 0.9, length(position.xz) * 0.6), 0.0, 1.35)'
        : '0.55 + 0.45 * smoothstep(-1.1, 1.1, position.y)';

      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uWindTime;
uniform float uWindStrength;
varying vec3 vFoliageSeed;
varying vec3 vFoliageLocal;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
vec4 foliageOrigin = vec4(0.0, 0.0, 0.0, 1.0);
#ifdef USE_INSTANCING
  foliageOrigin = modelMatrix * instanceMatrix * foliageOrigin;
#else
  foliageOrigin = modelMatrix * foliageOrigin;
#endif
vFoliageSeed = foliageOrigin.xyz;
vFoliageLocal = position;

float swayMask = ${swayMaskExpr};
float primaryWave = sin(uWindTime * 1.25 + foliageOrigin.x * 0.16 + foliageOrigin.z * 0.12);
float gustWave = sin(uWindTime * 2.1 - foliageOrigin.x * 0.09 + foliageOrigin.z * 0.19) * 0.45;
float leafFlutter = sin(uWindTime * 3.8 + position.x * 2.4 + position.z * 2.1 + foliageOrigin.x * 1.3) * 0.28;
transformed.x += (primaryWave + gustWave + leafFlutter) * uWindStrength * swayMask;
transformed.z += (cos(uWindTime * 0.95 + foliageOrigin.z * 0.15) * 0.65 + leafFlutter * 0.7) * uWindStrength * swayMask;
transformed.y += sin(uWindTime * 2.7 + position.x * 1.9 + foliageOrigin.z) * (uWindStrength * 0.22) * swayMask;`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uHueVar;
varying vec3 vFoliageSeed;
varying vec3 vFoliageLocal;`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
float fHash = fract(sin(dot(vFoliageSeed.xz, vec2(12.9898, 78.233))) * 43758.5453);
float microNoise = sin(vFoliageLocal.x * 2.3 + vFoliageLocal.y * 1.9 - vFoliageLocal.z * 2.1 + fHash * 6.2831);
float hueDelta = (fHash - 0.5) * uHueVar + microNoise * (uHueVar * 0.42);
vec3 coolEmerald = vec3(-0.14, 0.06, 0.10);
vec3 warmOlive = vec3(0.16, 0.08, -0.14);
vec3 shadeMod = vec3(1.0) + mix(coolEmerald, warmOlive, smoothstep(-0.35, 0.35, hueDelta)) * min(1.0, abs(hueDelta) * 2.2);
float sunCrownMix = clamp(vFoliageLocal.y * 0.35 + 0.52, 0.0, 1.0);
diffuseColor.rgb *= shadeMod * mix(0.84, 1.15, sunCrownMix);`
        );
    };
  }

  private createFoliageWindDepthMaterial(
    map: THREE.Texture,
    alphaTest: number,
    windStrength: number,
    groundedAnchor: boolean
  ): THREE.MeshDepthMaterial {
    const depthMat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map,
      alphaTest,
      side: THREE.DoubleSide,
    });
    depthMat.customProgramCacheKey = () =>
      `tree_foliage_depth_${windStrength}_${groundedAnchor ? 1 : 0}`;
    depthMat.onBeforeCompile = (shader) => {
      shader.uniforms.uWindTime = this.foliageWindTime;
      shader.uniforms.uWindStrength = { value: windStrength };
      const swayMaskExpr = groundedAnchor
        ? 'clamp(max(position.y * 0.9, length(position.xz) * 0.6), 0.0, 1.35)'
        : '0.55 + 0.45 * smoothstep(-1.1, 1.1, position.y)';
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
uniform float uWindTime;
uniform float uWindStrength;`
        )
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
vec4 foliageOrigin = vec4(0.0, 0.0, 0.0, 1.0);
#ifdef USE_INSTANCING
  foliageOrigin = modelMatrix * instanceMatrix * foliageOrigin;
#else
  foliageOrigin = modelMatrix * foliageOrigin;
#endif
float swayMask = ${swayMaskExpr};
float primaryWave = sin(uWindTime * 1.25 + foliageOrigin.x * 0.16 + foliageOrigin.z * 0.12);
float gustWave = sin(uWindTime * 2.1 - foliageOrigin.x * 0.09 + foliageOrigin.z * 0.19) * 0.45;
float leafFlutter = sin(uWindTime * 3.8 + position.x * 2.4 + position.z * 2.1 + foliageOrigin.x * 1.3) * 0.28;
transformed.x += (primaryWave + gustWave + leafFlutter) * uWindStrength * swayMask;
transformed.z += (cos(uWindTime * 0.95 + foliageOrigin.z * 0.15) * 0.65 + leafFlutter * 0.7) * uWindStrength * swayMask;
transformed.y += sin(uWindTime * 2.7 + position.x * 1.9 + foliageOrigin.z) * (uWindStrength * 0.22) * swayMask;`
        );
    };
    this.disposableMaterials.push(depthMat);
    return depthMat;
  }

  private buildInstancedJungle(
    barkTex: THREE.Texture,
    stoneTex: THREE.Texture,
    foliageTex: THREE.Texture,
    frondTex: THREE.Texture
  ): void {
    const isLowQuality = this.settings.graphicsQuality === 'LOW' || this.isSoftwareGl;

    // 1. Primary Broadleaf Jungle Trees (Flared roots, tapered bent trunk, forked boughs, 4-cluster foliage crowns)
    const treePositions: Array<[number, number, number]> = [];
    for (let i = 0; i < 185; i++) {
      const angle = i * 2.39996;
      const dist = 16 + ((i * 37) % 94);
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;

      const nearZoneCenter = ZONES.some((z) => Math.hypot(tx - z.center[0], tz - z.center[1]) < 12.5);
      const inRiver = Math.abs(tx - (27 + Math.sin(tz * 0.06) * 5.5)) < 8 && tz > -26 && tz < 58;
      const inScorchedBiome = Math.hypot(tx - 44, tz + 46) < 22 || Math.hypot(tx, tz + 82) < 25;
      const inTempleVista = Math.abs(tx - 0.8) < 7.5 && tz > -26 && tz < -6;
      if (nearZoneCenter || inRiver || inScorchedBiome || inTempleVista) continue;

      const scale = 0.84 + ((i * 13) % 40) / 100;
      treePositions.push([tx, tz, scale]);
    }

    // Build merged branched trunk + root buttress geometry (origin at base y=0)
    const trunkParts: THREE.BufferGeometry[] = [];
    const lowerTrunk = new THREE.CylinderGeometry(0.32, 0.56, 3.2, 8);
    lowerTrunk.translate(0, 1.55, 0);
    trunkParts.push(lowerTrunk);

    const upperTrunk = new THREE.CylinderGeometry(0.19, 0.34, 2.5, 7);
    upperTrunk.rotateZ(0.08);
    upperTrunk.translate(-0.1, 4.15, 0.04);
    trunkParts.push(upperTrunk);

    for (let r = 0; r < 4; r++) {
      const ra = (r / 4) * Math.PI * 2 + 0.35;
      const root = new THREE.CylinderGeometry(0.09, 0.31, 1.35, 6);
      root.rotateZ(0.56);
      root.rotateY(ra);
      root.translate(Math.cos(ra) * 0.42, 0.44, -Math.sin(ra) * 0.42);
      trunkParts.push(root);
    }

    const boughConfigs: Array<[number, number, number, number, number]> = [
      [0.15, 0.72, 0.62, 4.7, 0.12],
      [2.25, 0.66, -0.45, 4.85, 0.45],
      [4.2, 0.62, -0.18, 4.6, -0.52],
    ];
    for (const [byaw, btilt, bx, by, bz] of boughConfigs) {
      const bough = new THREE.CylinderGeometry(0.1, 0.21, 2.25, 6);
      bough.rotateZ(btilt);
      bough.rotateY(byaw);
      bough.translate(bx, by, bz);
      trunkParts.push(bough);
    }
    const trunkGeo = this.mergeGeometryParts(trunkParts);

    const trunkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      normalMap: this.barkNormalTex,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: this.barkRoughnessTex,
      color: 0xffffff,
      roughness: 1.0,
    });
    this.applyTreeTrunkWindShader(trunkMat, 0.055);
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;

    // Organically perturbed canopy cluster geometry
    const canopyGeo = new THREE.IcosahedronGeometry(1.72, 2);
    const cPos = canopyGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const vx = cPos.getX(i);
      const vy = cPos.getY(i);
      const vz = cPos.getZ(i);
      const n = 1 + 0.15 * Math.sin(vx * 2.5 + vy * 2.1) + 0.1 * Math.cos(vz * 2.8 - vx * 1.7);
      cPos.setXYZ(i, vx * n, vy * n * 0.76, vz * n);
    }
    canopyGeo.computeVertexNormals();

    const canopyMat = new THREE.MeshStandardMaterial({
      map: foliageTex,
      normalMap: this.foliageNormalTex,
      normalScale: new THREE.Vector2(0.75, 0.75),
      color: 0xffffff,
      roughness: 0.74,
      metalness: 0.02,
      alphaTest: 0.36,
      side: THREE.DoubleSide,
    });
    this.applyFoliageWindAndHueShader(canopyMat, {
      windStrength: 0.085,
      hueVariation: 0.9,
      groundedAnchor: false,
    });
    const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treePositions.length * 4);
    canopyInst.castShadow = true;
    canopyInst.receiveShadow = true;
    canopyInst.customDepthMaterial = this.createFoliageWindDepthMaterial(foliageTex, 0.36, 0.085, false);

    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const barkPalette = [0xd4c3b2, 0xc4b09b, 0xdfd2be, 0xb8a491];
    const leafPalette = [0x4b9c4e, 0x59ad56, 0x3b8745, 0x67b053, 0x3f8f5c, 0x72ab4c];
    const crownOffsets: Array<[number, number, number, number, number]> = [
      [-0.12, 5.75, 0.05, 1.24, 0.86],
      [-1.35, 5.35, 0.75, 0.96, 0.74],
      [1.32, 5.5, -0.58, 0.92, 0.72],
      [0.18, 6.45, -0.22, 0.88, 0.68],
    ];

    treePositions.forEach(([tx, tz, s], idx) => {
      const ty = getTerrainHeight(tx, tz) - 0.16; // Embed flared roots cleanly into slopes
      const yaw = idx * 2.17;
      const leanX = Math.sin(idx * 1.3) * 0.055;
      const leanZ = Math.cos(idx * 1.9) * 0.055;

      dummy.position.set(tx, ty, tz);
      dummy.rotation.set(leanX, yaw, leanZ);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(idx, dummy.matrix);
      tint.setHex(barkPalette[idx % barkPalette.length]);
      trunkInst.setColorAt(idx, tint);

      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const baseHex = leafPalette[idx % leafPalette.length];

      for (let c = 0; c < 4; c++) {
        const [ox, oy, oz, sx, sy] = crownOffsets[c];
        const rx = (ox * cosY + oz * sinY) * s;
        const rz = (-ox * sinY + oz * cosY) * s;
        dummy.position.set(tx + rx, ty + oy * s, tz + rz);
        dummy.rotation.set(leanX * 0.5, yaw + c * 1.4, leanZ * 0.5);
        dummy.scale.set(s * sx, s * sy, s * sx * (0.94 + (c % 2) * 0.12));
        dummy.updateMatrix();
        canopyInst.setMatrixAt(idx * 4 + c, dummy.matrix);

        tint.setHex(baseHex);
        if (c === 3) tint.offsetHSL(0.015, -0.02, 0.06); // Sunlit top crown
        else if (c === 1) tint.offsetHSL(-0.01, 0.02, -0.04); // Shaded side lobe
        else if (c === 2) tint.offsetHSL(0.02, 0.0, 0.02);
        canopyInst.setColorAt(idx * 4 + c, tint);
      }
    });

    trunkInst.instanceMatrix.needsUpdate = true;
    if (trunkInst.instanceColor) trunkInst.instanceColor.needsUpdate = true;
    canopyInst.instanceMatrix.needsUpdate = true;
    if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    canopyInst.computeBoundingSphere();
    this.scene.add(trunkInst);
    this.scene.add(canopyInst);

    // 2. Curved Tropical Jungle Palms (adds vertical silhouette variety near riverbanks & clearings)
    const palmPositions: Array<[number, number, number]> = [];
    const palmTarget = isLowQuality ? 32 : 52;
    for (let i = 0; i < 160 && palmPositions.length < palmTarget; i++) {
      const angle = i * 1.91 + 0.5;
      const dist = 15 + ((i * 29) % 86);
      const px = Math.cos(angle) * dist;
      const pz = Math.sin(angle) * dist;
      const py = getTerrainHeight(px, pz);
      if (py < -0.1) continue;
      if (ZONES.some((z) => Math.hypot(px - z.center[0], pz - z.center[1]) < 13.5)) continue;
      if (Math.hypot(px - 44, pz + 46) < 24 || Math.hypot(px, pz + 82) < 26) continue;
      if (Math.hypot(px - 64, pz + 8) < 19) continue;
      if (Math.abs(px - 0.8) < 7.5 && pz > -26 && pz < -6) continue;
      if (treePositions.some(([tx, tz]) => Math.hypot(px - tx, pz - tz) < 3.6)) continue;
      palmPositions.push([px, pz, 0.85 + ((i * 11) % 35) / 100]);
    }

    const dynamicColliders: SolidColliderDef[] = [];
    treePositions.forEach(([tx, tz, s], idx) => {
      dynamicColliders.push({
        id: `jungle_tree_${idx}`,
        x: tx,
        z: tz,
        radius: 1.15 * s,
      });
    });
    palmPositions.forEach(([px, pz, s], idx) => {
      dynamicColliders.push({
        id: `palm_tree_${idx}`,
        x: px,
        z: pz,
        radius: 0.9 * s,
      });
    });
    registerDynamicObstacles(dynamicColliders);

    const palmTrunkParts: THREE.BufferGeometry[] = [];
    const segHeights = [1.8, 1.8, 1.7, 1.6];
    let curX = 0;
    let curY = 0;
    for (let seg = 0; seg < segHeights.length; seg++) {
      const h = segHeights[seg];
      const rTop = 0.24 - seg * 0.04;
      const rBot = 0.29 - seg * 0.045;
      const tilt = 0.07 + seg * 0.055;
      const cyl = new THREE.CylinderGeometry(rTop, rBot, h + 0.12, 7);
      cyl.rotateZ(-tilt);
      const dx = Math.sin(tilt) * h * 0.5;
      const dy = Math.cos(tilt) * h * 0.5;
      cyl.translate(curX + dx, curY + dy, 0);
      palmTrunkParts.push(cyl);
      curX += Math.sin(tilt) * h;
      curY += Math.cos(tilt) * h;
    }
    const palmTrunkGeo = this.mergeGeometryParts(palmTrunkParts);
    const palmTrunkInst = new THREE.InstancedMesh(palmTrunkGeo, trunkMat, palmPositions.length);
    palmTrunkInst.castShadow = true;
    palmTrunkInst.receiveShadow = true;

    const palmFrondParts: THREE.BufferGeometry[] = [];
    for (let f = 0; f < 7; f++) {
      const fa = (f / 7) * Math.PI * 2 + (f % 2) * 0.18;
      const frond = this.createArchedBladeGeometry(3.2 + (f % 2) * 0.35, 0.58, 0.72, 1.65, 5);
      frond.rotateX((f % 2 === 0 ? -0.16 : 0.05));
      frond.rotateY(fa);
      frond.translate(curX, curY - 0.05, 0);
      palmFrondParts.push(frond);
    }
    const palmCrownGeo = this.mergeGeometryParts(palmFrondParts);
    const palmCrownMat = new THREE.MeshStandardMaterial({
      map: frondTex,
      normalMap: this.foliageNormalTex,
      normalScale: new THREE.Vector2(0.55, 0.55),
      color: 0xffffff,
      roughness: 0.7,
      alphaTest: 0.34,
      side: THREE.DoubleSide,
    });
    this.applyFoliageWindAndHueShader(palmCrownMat, {
      windStrength: 0.11,
      hueVariation: 0.8,
      groundedAnchor: false,
    });
    const palmCrownInst = new THREE.InstancedMesh(palmCrownGeo, palmCrownMat, palmPositions.length);
    palmCrownInst.castShadow = true;
    palmCrownInst.customDepthMaterial = this.createFoliageWindDepthMaterial(frondTex, 0.34, 0.11, false);

    const palmPalette = [0x5eb04f, 0x4b994b, 0x70b857, 0x418c4f];
    palmPositions.forEach(([px, pz, s], idx) => {
      const py = getTerrainHeight(px, pz) - 0.15;
      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, idx * 2.41, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      palmTrunkInst.setMatrixAt(idx, dummy.matrix);
      palmCrownInst.setMatrixAt(idx, dummy.matrix);
      tint.setHex(barkPalette[(idx + 1) % barkPalette.length]);
      palmTrunkInst.setColorAt(idx, tint);
      tint.setHex(palmPalette[idx % palmPalette.length]);
      palmCrownInst.setColorAt(idx, tint);
    });
    palmTrunkInst.instanceMatrix.needsUpdate = true;
    if (palmTrunkInst.instanceColor) palmTrunkInst.instanceColor.needsUpdate = true;
    palmCrownInst.instanceMatrix.needsUpdate = true;
    if (palmCrownInst.instanceColor) palmCrownInst.instanceColor.needsUpdate = true;
    palmTrunkInst.computeBoundingSphere();
    palmCrownInst.computeBoundingSphere();
    this.scene.add(palmTrunkInst);
    this.scene.add(palmCrownInst);

    // 3. Sculpted Multi-Frond Tropical Undergrowth Ferns (keeping trails & combat telegraphs clear)
    const combatClearings: Array<[number, number]> = [
      [-24, 22], [-38, 12], [38, -38], [-28, 8], [16, 8], [48, -26], [-26, -20], [6, -20], [42, -50],
    ];
    const isBlockedByTrailOrCombat = (x: number, z: number): boolean => {
      if (Math.abs(x) < 4.5 && z > -76 && z < 80) return true; // Keep central stone trail open
      if (Math.hypot(x - 27, z - 14) < 6.5) return true; // River crossing approach
      return combatClearings.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 4.2);
    };

    const fernPositions: Array<[number, number, number]> = [];
    const fernLimit = isLowQuality ? 125 : 220;
    for (let i = 0; i < 420 && fernPositions.length < fernLimit; i++) {
      const a = i * 1.618 * Math.PI * 2;
      const r = 10 + ((i * 41) % 92);
      const fx = Math.cos(a) * r;
      const fz = Math.sin(a) * r;
      const fy = getTerrainHeight(fx, fz);
      if (fy < -0.1) continue;
      if (Math.hypot(fx - 44, fz + 46) < 20 || Math.hypot(fx, fz + 82) < 22) continue;
      if (Math.max(Math.abs(fx), Math.abs(fz + 34)) < 13) continue; // Keep Temple pyramid stone stairs clear
      if (Math.hypot(fx, fz - 44) < 9.5 || Math.hypot(fx, fz - 82) < 8 || Math.hypot(fx + 30, fz + 24) < 10) continue;
      if (isBlockedByTrailOrCombat(fx, fz)) continue;
      fernPositions.push([fx, fz, 0.78 + (i % 5) * 0.16]);
    }
    const fernParts: THREE.BufferGeometry[] = [];
    for (let f = 0; f < 7; f++) {
      const fa = (f / 7) * Math.PI * 2 + (f % 2) * 0.22;
      const inner = f % 2 === 0;
      const frond = this.createArchedBladeGeometry(inner ? 1.05 : 1.32, 0.3, inner ? 0.56 : 0.42, inner ? 0.28 : 0.44, 4);
      frond.rotateY(fa);
      fernParts.push(frond);
    }
    const fernGeo = this.mergeGeometryParts(fernParts);
    const fernMat = new THREE.MeshStandardMaterial({
      map: frondTex,
      normalMap: this.foliageNormalTex,
      normalScale: new THREE.Vector2(0.5, 0.5),
      color: 0xffffff,
      roughness: 0.72,
      alphaTest: 0.34,
      side: THREE.DoubleSide,
    });
    this.applyFoliageWindAndHueShader(fernMat, {
      windStrength: 0.075,
      hueVariation: 0.85,
      groundedAnchor: true,
    });
    const fernInst = new THREE.InstancedMesh(fernGeo, fernMat, fernPositions.length);
    const fernPalette = [0x4ca14d, 0x3f8c46, 0x388766, 0x62ab4f, 0x509943];
    fernPositions.forEach(([fx, fz, s], idx) => {
      const fy = getTerrainHeight(fx, fz) - 0.04;
      dummy.position.set(fx, fy, fz);
      dummy.rotation.set((idx % 3 - 1) * 0.05, idx * 0.97, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      fernInst.setMatrixAt(idx, dummy.matrix);
      tint.setHex(fernPalette[idx % fernPalette.length]);
      fernInst.setColorAt(idx, tint);
    });
    fernInst.instanceMatrix.needsUpdate = true;
    if (fernInst.instanceColor) fernInst.instanceColor.needsUpdate = true;
    fernInst.computeBoundingSphere();
    this.scene.add(fernInst);

    // 4. Leafy Jungle Shrubs & Mossy Undergrowth Bushes
    const shrubPositions: Array<[number, number, number]> = [];
    const shrubLimit = isLowQuality ? 65 : 115;
    for (let i = 0; i < 200 && shrubPositions.length < shrubLimit; i++) {
      const a = i * 2.13 + 0.8;
      const r = 13 + ((i * 31) % 90);
      const sx = Math.cos(a) * r;
      const sz = Math.sin(a) * r;
      const sy = getTerrainHeight(sx, sz);
      if (sy < -0.05) continue;
      if (ZONES.some((z) => Math.hypot(sx - z.center[0], sz - z.center[1]) < 10.5)) continue;
      if (Math.hypot(sx - 44, sz + 46) < 22 || Math.hypot(sx, sz + 82) < 24) continue;
      if (Math.abs(sx - 0.8) < 6.5 && sz > -24 && sz < -8) continue;
      shrubPositions.push([sx, sz, 0.78 + (i % 5) * 0.15]);
    }
    const shrubParts: THREE.BufferGeometry[] = [];
    const moundOffsets: Array<[number, number, number, number, number]> = [
      [0, 0.42, 0, 0.85, 0.62],
      [0.48, 0.3, 0.32, 0.62, 0.48],
      [-0.44, 0.34, -0.28, 0.68, 0.52],
    ];
    for (const [mx, my, mz, rxy, ry] of moundOffsets) {
      const m = new THREE.IcosahedronGeometry(1, 1);
      m.scale(rxy, ry, rxy);
      m.translate(mx, my, mz);
      shrubParts.push(m);
    }
    const shrubGeo = this.mergeGeometryParts(shrubParts);
    const shrubMat = new THREE.MeshStandardMaterial({
      map: foliageTex,
      normalMap: this.foliageNormalTex,
      normalScale: new THREE.Vector2(0.7, 0.7),
      color: 0xffffff,
      roughness: 0.76,
      alphaTest: 0.36,
      side: THREE.DoubleSide,
    });
    this.applyFoliageWindAndHueShader(shrubMat, {
      windStrength: 0.055,
      hueVariation: 0.8,
      groundedAnchor: true,
    });
    const shrubInst = new THREE.InstancedMesh(shrubGeo, shrubMat, shrubPositions.length);
    shrubInst.castShadow = true;
    shrubInst.receiveShadow = true;
    shrubInst.customDepthMaterial = this.createFoliageWindDepthMaterial(foliageTex, 0.36, 0.055, true);
    const shrubPalette = [0x428745, 0x529949, 0x357546, 0x629e47];
    shrubPositions.forEach(([sx, sz, s], idx) => {
      const sy = getTerrainHeight(sx, sz) - 0.08;
      dummy.position.set(sx, sy, sz);
      dummy.rotation.set(0, idx * 1.43, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      shrubInst.setMatrixAt(idx, dummy.matrix);
      tint.setHex(shrubPalette[idx % shrubPalette.length]);
      shrubInst.setColorAt(idx, tint);
    });
    shrubInst.instanceMatrix.needsUpdate = true;
    if (shrubInst.instanceColor) shrubInst.instanceColor.needsUpdate = true;
    shrubInst.computeBoundingSphere();
    this.scene.add(shrubInst);

    // 5. Wild Meadow Grass Tufts & Riverbank Reeds
    const grassPositions: Array<[number, number, number]> = [];
    const grassLimit = isLowQuality ? 210 : 460;
    for (let i = 0; i < 760 && grassPositions.length < grassLimit; i++) {
      const a = i * 2.39996 + 1.1;
      const r = 7 + ((i * 23) % 94);
      const gx = Math.cos(a) * r;
      const gz = Math.sin(a) * r;
      const gy = getTerrainHeight(gx, gz);
      if (gy < -0.15) continue;
      if (Math.hypot(gx - 44, gz + 46) < 22 || Math.hypot(gx, gz + 82) < 25) continue;
      if (Math.hypot(gx - 64, gz + 8) < 16) continue;
      if (Math.max(Math.abs(gx), Math.abs(gz + 34)) < 14) continue;
      if (Math.hypot(gx + 30, gz + 24) < 11) continue;
      if (isBlockedByTrailOrCombat(gx, gz)) continue;
      grassPositions.push([gx, gz, 0.72 + ((i * 7) % 55) / 100]);
    }
    const tuftParts: THREE.BufferGeometry[] = [];
    for (let b = 0; b < 8; b++) {
      const ba = (b / 8) * Math.PI * 2 + (b % 3) * 0.2;
      const blade = this.createArchedBladeGeometry(0.62 + (b % 3) * 0.16, 0.06, -0.12, 0.04, 3);
      blade.rotateX(-1.02);
      blade.rotateY(ba);
      blade.translate(Math.sin(ba) * 0.12, 0, Math.cos(ba) * 0.12);
      tuftParts.push(blade);
    }
    const grassTuftGeo = this.mergeGeometryParts(tuftParts);
    const grassTuftMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
      side: THREE.DoubleSide,
    });
    this.applyFoliageWindAndHueShader(grassTuftMat, {
      windStrength: 0.085,
      hueVariation: 0.9,
      groundedAnchor: true,
    });
    const grassTuftInst = new THREE.InstancedMesh(grassTuftGeo, grassTuftMat, grassPositions.length);
    const grassPalette = [0x3d7a3c, 0x4f8c43, 0x629647, 0x2f6938, 0x749c48];
    grassPositions.forEach(([gx, gz, s], idx) => {
      const gy = getTerrainHeight(gx, gz) - 0.04;
      dummy.position.set(gx, gy, gz);
      dummy.rotation.set(0, idx * 1.27, 0);
      dummy.scale.set(s, s * (0.9 + (idx % 3) * 0.16), s);
      dummy.updateMatrix();
      grassTuftInst.setMatrixAt(idx, dummy.matrix);
      tint.setHex(grassPalette[idx % grassPalette.length]);
      grassTuftInst.setColorAt(idx, tint);
    });
    grassTuftInst.instanceMatrix.needsUpdate = true;
    if (grassTuftInst.instanceColor) grassTuftInst.instanceColor.needsUpdate = true;
    grassTuftInst.computeBoundingSphere();
    this.scene.add(grassTuftInst);

    // 6. Instanced Weathered & Moss-Dusted Biome Rocks
    const rockCount = 85;
    const rockGeo = new THREE.IcosahedronGeometry(1.12, 1);
    const rPos = rockGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const vx = rPos.getX(i);
      const vy = rPos.getY(i);
      const vz = rPos.getZ(i);
      const crag = 1 + 0.14 * Math.sin(vx * 2.9 + vz * 2.2) + 0.08 * Math.cos(vy * 3.4);
      rPos.setXYZ(i, vx * crag, vy * crag, vz * crag);
    }
    rockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      normalMap: this.stoneNormalTex,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: this.stoneRoughnessTex,
      color: 0xffffff,
      roughness: 1.0,
    });
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockInst.castShadow = true;
    rockInst.receiveShadow = true;

    for (let i = 0; i < rockCount; i++) {
      const a = i * 1.73;
      const r = 14 + ((i * 53) % 92);
      const rx = Math.cos(a) * r;
      const rz = Math.sin(a) * r;
      const ry = getTerrainHeight(rx, rz);
      const s = 0.7 + ((i * 19) % 65) / 100;
      dummy.position.set(rx, ry + 0.25 * s, rz);
      dummy.rotation.set(i * 0.4, i * 0.9, i * 0.25);
      dummy.scale.set(s * 1.25, s * 0.78, s * 0.98);
      dummy.updateMatrix();
      rockInst.setMatrixAt(i, dummy.matrix);
      if (Math.hypot(rx - 44, rz + 46) < 25 || Math.hypot(rx, rz + 82) < 26) {
        tint.setHex(0x4b3d5c);
      } else if (Math.hypot(rx - 64, rz + 8) < 24) {
        tint.setHex(0x526478);
      } else {
        tint.setHex(i % 2 === 0 ? 0xa3ad92 : 0xb8b29e);
      }
      rockInst.setColorAt(i, tint);
    }
    rockInst.instanceMatrix.needsUpdate = true;
    if (rockInst.instanceColor) rockInst.instanceColor.needsUpdate = true;
    rockInst.computeBoundingSphere();
    this.scene.add(rockInst);

    // Chaos Zone jagged Obsidian Rift Spires
    const spireGeo = new THREE.ConeGeometry(0.65, 3.6, 5);
    const spireMat = new THREE.MeshStandardMaterial({
      map: this.obsidianTex,
      normalMap: this.obsidianNormalTex,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: this.obsidianRoughnessTex,
      color: 0x3b294d,
      emissive: 0x581c87,
      emissiveIntensity: 0.32,
      roughness: 0.9,
      metalness: 0.32,
    });
    const spireInst = new THREE.InstancedMesh(spireGeo, spireMat, 14);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const rad = 12 + (i % 3) * 4.5;
      const sx = 44 + Math.cos(a) * rad;
      const sz = -46 + Math.sin(a) * rad;
      const sy = getTerrainHeight(sx, sz);
      const sc = 0.75 + (i % 4) * 0.22;
      dummy.position.set(sx, sy + 1.4 * sc, sz);
      dummy.rotation.set((i % 2 === 0 ? 1 : -1) * 0.16, a, 0.12);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      spireInst.setMatrixAt(i, dummy.matrix);
    }
    spireInst.instanceMatrix.needsUpdate = true;
    spireInst.computeBoundingSphere();
    this.scene.add(spireInst);
  }

  private buildInteractables(stoneTex: THREE.Texture): void {
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 });
    const stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      normalMap: this.stoneNormalTex,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: this.stoneRoughnessTex,
      roughness: 1.0,
    });

    for (const def of INTERACTABLES) {
      const g = new THREE.Group();
      const y = getTerrainHeight(def.position[0], def.position[1]);
      g.position.set(def.position[0], y, def.position[1]);

      let indColor = 0x38bdf8;
      if (def.type === 'save_campfire') {
        indColor = 0xf97316;
        const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 0.9, 6), stoneMat);
        stone.position.y = 0.45;
        g.add(stone);
      } else if (def.type === 'chest') {
        indColor = 0xfbbf24;
        const chestWoodMat = new THREE.MeshStandardMaterial({ color: 0x6b3e1b, roughness: 0.72 });
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.56, 0.8), chestWoodMat);
        box.position.y = 0.28;
        box.castShadow = true;
        g.add(box);
        const lid = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.24, 0.86), goldMat);
        lid.position.y = 0.64;
        lid.castShadow = true;
        g.add(lid);
      } else if (def.type === 'lever_bridge') {
        indColor = 0xf59e0b;
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.9), stoneMat);
        base.position.y = 0.25;
        g.add(base);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), goldMat);
        handle.position.y = 0.85;
        handle.rotation.z = 0.35;
        g.add(handle);
      } else if (def.type === 'totem_symbol') {
        indColor = 0x34d399;
        const col = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 1.0), stoneMat);
        col.position.y = 1.1;
        col.castShadow = true;
        g.add(col);
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 1.1), goldMat);
        face.position.y = 1.45;
        g.add(face);
      } else if (def.type === 'sequence_switch') {
        indColor = 0x38bdf8;
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.28, 12), stoneMat);
        pad.position.y = 0.14;
        g.add(pad);
      } else if (def.type === 'resonant_crystal' || def.type === 'collectible_shard') {
        indColor = 0xc084fc;
        const crystal = new THREE.Mesh(
          new THREE.OctahedronGeometry(def.type === 'resonant_crystal' ? 0.85 : 0.42, 0),
          new THREE.MeshStandardMaterial({
            color: 0xa855f7,
            emissive: 0x7e22ce,
            emissiveIntensity: 0.9,
            roughness: 0.15,
            metalness: 0.4,
          })
        );
        crystal.position.y = def.type === 'resonant_crystal' ? 1.2 : 0.7;
        g.add(crystal);
      } else if (def.type === 'ability_shrine') {
        indColor = def.abilityGrant === 'gravity_control' ? 0xa855f7 : 0x10b981;
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 1.1, 8), stoneMat);
        plinth.position.y = 0.55;
        g.add(plinth);
        const shrineHalo = new THREE.Mesh(
          new THREE.TorusGeometry(0.95, 0.08, 8, 24),
          new THREE.MeshStandardMaterial({
            color: indColor,
            emissive: indColor,
            emissiveIntensity: 1.0,
            roughness: 0.2,
          })
        );
        shrineHalo.position.y = 1.65;
        g.add(shrineHalo);
      } else if (def.type === 'collectible_fruit') {
        indColor = 0xef4444;
        const bush = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.55, 0),
          new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.85 })
        );
        bush.position.y = 0.4;
        g.add(bush);
      } else if (def.type === 'chaos_core_pedestal') {
        indColor = 0xf43f5e;
        const altar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.65, 1.35, 8), stoneMat);
        altar.position.y = 0.68;
        g.add(altar);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.25, 0.18, 8), goldMat);
        crown.position.y = 1.35;
        g.add(crown);
      } else if (def.type === 'chaos_obelisk') {
        indColor = 0xc084fc;
        const obeliskMat = new THREE.MeshStandardMaterial({
          map: this.obsidianTex,
          color: 0x3b294d,
          emissive: 0x581c87,
          emissiveIntensity: 0.45,
          roughness: 0.55,
        });
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.95, 3.6, 4), obeliskMat);
        shaft.position.y = 1.8;
        shaft.castShadow = true;
        g.add(shaft);
      } else {
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.1, 8), stoneMat);
        plinth.position.y = 0.55;
        g.add(plinth);
      }

      const indicator = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({
          color: indColor,
          emissive: indColor,
          emissiveIntensity: 1.2,
          roughness: 0.2,
        })
      );
      indicator.position.y = 2.0;
      g.add(indicator);

      this.scene.add(g);
      this.interactables.push({ def, group: g, indicator, active: true });
    }
  }

  private spawnEnemies(): void {
    const specs: Array<{ id: string; name: string; family: EnemyFamily; x: number; z: number }> = [
      { id: 'stalker_1', name: 'Jungle Stalker', family: 'stalker', x: -24, z: 22 },
      { id: 'stalker_2', name: 'Jungle Stalker', family: 'stalker', x: -38, z: 12 },
      { id: 'stalker_3', name: 'Rift Stalker', family: 'stalker', x: 38, z: -38 },
      { id: 'spitter_1', name: 'Thorn Spitter', family: 'spitter', x: -28, z: 8 },
      { id: 'spitter_2', name: 'Thorn Spitter', family: 'spitter', x: 16, z: 8 },
      { id: 'spitter_3', name: 'Grotto Spitter', family: 'spitter', x: 48, z: -26 },
      { id: 'sentinel_1', name: 'Stone Sentinel', family: 'sentinel', x: -26, z: -20 },
      { id: 'sentinel_2', name: 'Temple Sentinel', family: 'sentinel', x: 6, z: -20 },
      { id: 'sentinel_3', name: 'Rift Sentinel', family: 'sentinel', x: 42, z: -50 },
      { id: 'boss_krakoss', name: 'Krakoss, The Corrupted Guardian', family: 'boss', x: 0, z: -84 },
    ];

    for (const s of specs) {
      const rig = buildEnemyModel(s.family, this.shadowTex);
      const y = getTerrainHeight(s.x, s.z);
      rig.root.position.set(s.x, y, s.z);
      this.scene.add(rig.root);

      const isBoss = s.family === 'boss';
      const maxHp = isBoss ? 420 : s.family === 'sentinel' ? 120 : s.family === 'spitter' ? 65 : 75;
      const speed = isBoss ? 4.4 : s.family === 'stalker' ? 6.2 : s.family === 'spitter' ? 0 : 3.2;
      const damage = isBoss ? 22 : s.family === 'sentinel' ? 18 : 12;

      this.enemies.push({
        id: s.id,
        name: s.name,
        family: s.family,
        spawnPos: new THREE.Vector3(s.x, y, s.z),
        pos: new THREE.Vector3(s.x, y, s.z),
        vel: new THREE.Vector3(),
        yaw: 0,
        hp: maxHp,
        maxHp,
        speed,
        detectRange: isBoss ? 24 : 15,
        attackRange: isBoss ? 4.2 : s.family === 'spitter' ? 12 : s.family === 'sentinel' ? 2.9 : 2.3,
        damage,
        state: 'Idle',
        stateTimer: 0,
        attackCooldown: 0,
        telegraphDuration: isBoss ? 0.95 : s.family === 'sentinel' ? 0.85 : 0.55,
        staggerTimer: 0,
        patrolAngle: Math.random() * Math.PI * 2,
        bossPhase: 1,
        summonedP2: false,
        hitFlashTimer: 0,
        hitSquash: 0,
        rig,
      });
    }
  }

  // --- Public Game Lifecycle & Controls ---

  public playUiSound(kind: 'ui_hover' | 'ui_click'): void {
    if (kind === 'ui_click') {
      this.audio.unlock();
    }
    this.audio.playSfx(kind);
  }

  private restoreGameplayAvatarState(): void {
    this.explorer.root.position.copy(this.playerPos);
    this.explorer.root.rotation.set(0, this.playerYaw, 0);
    this.explorer.body.position.y = 0.85;
    this.explorer.body.rotation.set(0, 0, 0);
    this.explorer.leftArm.rotation.set(0, 0, 0);
    this.explorer.rightArm.rotation.set(0, 0, 0);
    this.explorer.leftLeg.rotation.set(0, 0, 0);
    this.explorer.rightLeg.rotation.set(0, 0, 0);
    this.explorer.scarf.rotation.x = 0.25;

    const dist = this.settings.cameraDistance;
    const horizDist = Math.cos(this.camPitch) * dist;
    const camX = this.playerPos.x + Math.sin(this.camYaw) * horizDist;
    const camZ = this.playerPos.z + Math.cos(this.camYaw) * horizDist;
    const lookY = this.playerPos.y + 1.55;
    let camY = lookY + Math.sin(this.camPitch) * dist;
    const groundAtCam = getTerrainHeight(camX, camZ) + 1.1;
    if (camY < groundAtCam) camY = groundAtCam;
    this.camSmoothPos.set(camX, camY, camZ);
  }

  public startNewGame(): void {
    this.audio.unlock();
    this.applySaveData(createNewSaveData());
    this.restoreGameplayAvatarState();
    this.screenMode = 'playing';
    this.showDiscoveryBanner('The Lost Jungle', 'Explore. Discover. Fight. Transform.');
    this.emitHud();
  }

  public loadFromSave(data: SaveDataV1): void {
    this.audio.unlock();
    this.applySaveData(data);
    this.restoreGameplayAvatarState();
    this.screenMode = 'playing';
    this.showSaveToast('Progress Restored');
    this.emitHud();
  }

  private clearTransientVfxAndHazards(): void {
    for (const m of this.meteors) {
      this.scene.remove(m.ring);
      this.scene.remove(m.rock);
    }
    this.meteors.length = 0;

    for (const cp of this.collapsePillars) {
      this.scene.remove(cp.mesh);
    }
    this.collapsePillars.length = 0;

    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles.length = 0;

    for (const r of this.shockRings) {
      this.scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    }
    this.shockRings.length = 0;

    for (const arc of this.slashArcs) {
      this.scene.remove(arc.mesh);
      arc.mesh.geometry.dispose();
      (arc.mesh.material as THREE.Material).dispose();
    }
    this.slashArcs.length = 0;

    for (const b of this.particleBursts) {
      this.scene.remove(b.points);
      b.points.geometry.dispose();
      (b.points.material as THREE.Material).dispose();
    }
    this.particleBursts.length = 0;
  }

  public applySaveData(data: SaveDataV1): void {
    this.saveData = data;
    this.playerPos.set(data.playerPosition[0], data.playerPosition[1], data.playerPosition[2]);
    this.playerVel.set(0, 0, 0);
    this.playerYaw = data.playerYaw;
    this.camYaw = data.playerYaw;

    // Clear transient runtime hazards/timers when loading/starting a game
    this.clearTransientVfxAndHazards();
    this.activeChaos = null;
    this.chaosNextCountdown = 28;
    this.currentWaterY = this.baseWaterY;
    this.waterMesh.position.y = this.baseWaterY;
    this.gravityControlTimer = 0;
    this.chaosShieldTimer = 0;
    this.attackTimer = 0;
    this.dodgeTimer = 0;
    this.dodgeTrailAccum = 0;
    this.invulnTimer = 0;
    this.hitStopTimer = 0;
    this.screenShake = 0;
    this.camKick.set(0, 0, 0);
    this.camFovKick = 0;
    this.lockedEnemyId = null;

    // Restore world state visuals
    this.bridgeMesh.rotation.z = data.worldState.bridgeLowered ? 0 : 0.85;
    this.bossGateMesh.visible = !data.worldState.bossGateOpen;
    this.sanctuaryBarrierMesh.visible = !data.worldState.sanctuaryBarrierBroken;

    // Synchronize puzzle runtime & visual state from solvedPuzzles (BUG-02)
    const symbolsSolved = data.worldState.solvedPuzzles.includes('puzzle_symbols');
    this.symbolRotations = symbolsSolved ? [0, 1, 2] : [1, 2, 0];
    this.crystalLit = data.worldState.solvedPuzzles.includes('puzzle_crystals')
      ? [true, true, true]
      : [false, false, false];
    this.sequenceStep = data.worldState.solvedPuzzles.includes('puzzle_sequence') ? 3 : 0;

    for (const item of this.interactables) {
      const done = data.worldState.activatedInteractables.includes(item.def.id);
      if (done && !item.def.repeatable) {
        item.active = false;
        item.group.visible = false;
      } else {
        item.active = true;
        item.group.visible = true;
      }
      if (item.def.type === 'totem_symbol') {
        const idx = item.def.puzzleIndex ?? 0;
        item.group.rotation.y = this.symbolRotations[idx] * ((Math.PI * 2) / 3);
      }
      if (item.def.type === 'chaos_core_pedestal') {
        item.group.visible = data.worldState.bossDefeated && !data.worldState.chaosCoreObtained;
        item.active = item.group.visible;
      }
    }

    for (const e of this.enemies) {
      const dead = data.worldState.defeatedEnemies.includes(e.id) || (e.family === 'boss' && data.worldState.bossDefeated);
      e.hitFlashTimer = 0;
      e.hitSquash = 0;
      e.rig.body.scale.set(1, 1, 1);
      e.rig.staggerHalo.visible = false;
      for (const ft of e.rig.flashTargets) {
        ft.mat.emissive.setHex(ft.baseEmissive);
        ft.mat.emissiveIntensity = ft.baseIntensity;
      }
      if (dead) {
        e.hp = 0;
        e.state = 'Dead';
        e.rig.root.visible = false;
        e.rig.telegraphRing.visible = false;
      } else {
        e.hp = e.maxHp;
        e.state = 'Idle';
        e.stateTimer = 0;
        e.attackCooldown = 0;
        e.staggerTimer = 0;
        if (e.family === 'boss') {
          e.bossPhase = 1;
          e.summonedP2 = false;
          e.speed = 4.4;
        }
        e.pos.copy(e.spawnPos);
        e.vel.set(0, 0, 0);
        e.rig.root.position.copy(e.pos);
        e.rig.root.visible = true;
        e.rig.telegraphRing.visible = false;
      }
    }
  }

  public setScreenMode(mode: 'menu' | 'playing' | 'paused' | 'victory' | 'defeat'): void {
    const prev = this.screenMode;
    this.screenMode = mode;
    this.audio.setPaused(mode === 'paused');
    if (mode === 'playing' && prev === 'menu') {
      this.restoreGameplayAvatarState();
    }
    if (mode === 'menu') {
      this.audio.setMood('menu');
    } else if (mode === 'victory') {
      this.audio.setMood('victory');
    } else if (mode === 'defeat') {
      this.audio.setMood('defeat');
    }
    this.emitHud();
  }

  public updateSettings(next: GameSettings): void {
    this.settings = next;
    this.audio.applySettings(next);
    this.applyGraphicsQuality();
  }

  public getSaveSnapshot(): SaveDataV1 {
    return {
      ...this.saveData,
      playerPosition: [this.playerPos.x, this.playerPos.y, this.playerPos.z],
      playerYaw: this.playerYaw,
    };
  }

  public manualSave(): boolean {
    const ok = saveGame(this.getSaveSnapshot());
    if (ok) {
      this.audio.playSfx('save');
      this.showSaveToast('Game Saved');
    }
    return ok;
  }

  public respawnAtCamp(): void {
    this.saveData.hp = this.saveData.maxHp;
    this.saveData.chaosEnergy = this.saveData.maxChaosEnergy;
    this.playerPos.set(0, getTerrainHeight(0, 46) + 0.5, 46);
    this.playerVel.set(0, 0, 0);

    // Clean all active chaos hazards, projectiles, transient timers & reset unfinished boss/enemies (BUG-03)
    this.clearTransientVfxAndHazards();
    this.activeChaos = null;
    this.chaosNextCountdown = 28;
    this.currentWaterY = this.baseWaterY;
    this.waterMesh.position.y = this.baseWaterY;
    this.attackTimer = 0;
    this.dodgeTimer = 0;
    this.dodgeTrailAccum = 0;
    this.invulnTimer = 1.0;
    this.hitStopTimer = 0;
    this.screenShake = 0;
    this.camKick.set(0, 0, 0);
    this.camFovKick = 0;
    this.gravityControlTimer = 0;
    this.chaosShieldTimer = 0;
    this.lockedEnemyId = null;

    for (const e of this.enemies) {
      if (e.state === 'Dead') continue;
      e.hp = e.maxHp;
      e.state = 'Idle';
      e.stateTimer = 0;
      e.attackCooldown = 0;
      e.staggerTimer = 0;
      e.hitFlashTimer = 0;
      e.hitSquash = 0;
      e.rig.body.scale.set(1, 1, 1);
      e.rig.staggerHalo.visible = false;
      for (const ft of e.rig.flashTargets) {
        ft.mat.emissive.setHex(ft.baseEmissive);
        ft.mat.emissiveIntensity = ft.baseIntensity;
      }
      e.vel.set(0, 0, 0);
      e.pos.copy(e.spawnPos);
      e.rig.root.position.copy(e.pos);
      e.rig.telegraphRing.visible = false;
      if (e.family === 'boss') {
        e.bossPhase = 1;
        e.summonedP2 = false;
        e.speed = 4.4;
      }
    }

    this.screenMode = 'playing';
    this.audio.setPaused(false);
    this.updateZoneAtmosphere(0.016);
    this.emitHud();
  }

  public useInventoryItem(itemId: string): boolean {
    const def = ITEMS[itemId];
    if (!def || !def.usable) return false;
    const stack = this.saveData.inventory.find((s) => s.itemId === itemId);
    if (!stack || stack.quantity <= 0) return false;

    stack.quantity -= 1;
    if (stack.quantity <= 0) {
      this.saveData.inventory = this.saveData.inventory.filter((s) => s.itemId !== itemId);
    }
    if (def.healAmount) {
      this.saveData.hp = Math.min(this.saveData.maxHp, this.saveData.hp + def.healAmount);
    }
    if (def.energyAmount) {
      this.saveData.chaosEnergy = Math.min(this.saveData.maxChaosEnergy, this.saveData.chaosEnergy + def.energyAmount);
    }
    this.audio.playSfx('pickup');
    this.callbacks.onStateChange();
    this.emitHud();
    return true;
  }

  public handleDialogueChoice(
    npcId: string,
    action?: string,
    questId?: string,
    hintPuzzleId?: string
  ): string | null {
    if (!this.saveData.worldState.talkedNpcs.includes(npcId)) {
      this.saveData.worldState.talkedNpcs.push(npcId);
    }
    if (npcId === 'lyra') {
      this.advanceQuestObjective('mq_1_camp', 'talk_lyra', 1);
    }

    if (action === 'accept_quest' && questId) {
      const q = this.saveData.quests[questId];
      if (q && q.status === 'locked') {
        q.status = 'active';
        this.audio.playSfx('puzzle');
      }
      this.callbacks.onStateChange();
    } else if (action === 'heal') {
      this.saveData.hp = this.saveData.maxHp;
      this.saveData.chaosEnergy = this.saveData.maxChaosEnergy;
      this.audio.playSfx('save');
      this.showSaveToast('Restored at Camp');
    } else if (action === 'give_hint' && hintPuzzleId) {
      const prev = this.saveData.worldState.puzzleHintsUnlocked[hintPuzzleId] ?? 0;
      const maxHints = PUZZLES[hintPuzzleId]?.hints.length ?? 1;
      const next = Math.min(maxHints, prev + 1);
      this.saveData.worldState.puzzleHintsUnlocked[hintPuzzleId] = next;
      this.callbacks.onStateChange();
      return PUZZLES[hintPuzzleId]?.hints[next - 1] ?? null;
    }
    this.emitHud();
    return null;
  }

  // Mobile Touch Inputs
  public setTouchMove(nx: number, ny: number): void {
    this.touchMove.x = nx;
    this.touchMove.y = ny;
  }

  public addCameraDelta(dx: number, dy: number): void {
    const sens = 0.0045 * this.settings.cameraSensitivity;
    this.camYaw -= dx * sens;
    const ySign = this.settings.invertY ? -1 : 1;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * sens * ySign, 0.08, 1.15);
  }

  public triggerJump(): void {
    if (this.screenMode !== 'playing') return;
    this.audio.unlock();
    const gravBonus = this.gravityControlTimer > 0 || this.activeChaos?.type === 'GRAVITY_FLIP' ? 1.38 : 1.0;
    if (this.onGround || this.jumpCount < 2) {
      this.playerVel.y = 10.2 * gravBonus;
      this.onGround = false;
      this.jumpCount += 1;
      this.audio.playSfx('jump');
    }
  }

  public triggerDodge(): void {
    if (this.screenMode !== 'playing' || this.dodgeCooldown > 0) return;
    this.audio.unlock();
    this.dodgeTimer = 0.34;
    this.dodgeCooldown = 0.9;
    this.dodgeTrailAccum = 0;
    this.invulnTimer = 0.42;
    this.audio.playSfx('dodge_whoosh');
    this.spawnShockRing(this.playerPos, 0x2dd4bf, 2.4);
    this.spawnParticleBurst(this.playerPos, 0x2dd4bf, 'dodge_trail');
    this.applyCameraImpulse(-Math.sin(this.playerYaw), -Math.cos(this.playerYaw), 0.14, 0.05, 1.4);
  }

  public triggerAttack(heavy: boolean): void {
    if (this.screenMode !== 'playing' || this.attackTimer > 0.08) return;
    this.audio.unlock();
    this.attackTimer = heavy ? 0.52 : 0.3;
    this.comboStep = heavy ? 3 : (this.comboStep + 1) % 3;
    this.attackHitDone = false;
    this.audio.playSfx(heavy ? 'heavy_attack' : 'light_attack', this.comboStep);
    this.spawnSlashArc(heavy, this.comboStep);
  }

  public triggerAbility(id: AbilityId): void {
    if (this.screenMode !== 'playing') return;
    if (!this.saveData.worldState.unlockedAbilities.includes(id)) {
      this.showSaveToast('Ability Not Yet Unlocked');
      return;
    }
    if (this.abilityCooldowns[id] > 0) return;
    const meta = ABILITY_META[id];
    if (this.saveData.chaosEnergy < meta.energyCost) {
      this.showSaveToast('Not Enough Chaos Energy');
      return;
    }

    this.saveData.chaosEnergy -= meta.energyCost;
    this.abilityCooldowns[id] = meta.cooldown;

    if (id === 'shockwave') {
      this.audio.playSfx('shockwave');
      this.spawnShockRing(this.playerPos, 0x38bdf8, 8.5);
      this.spawnShockRing(this.playerPos, 0xf2cf66, 6.2);
      this.spawnParticleBurst(this.playerPos, 0x38bdf8, 'radial_wave');
      this.spawnParticleBurst(this.playerPos, 0x5eead4, 'radial_wave');
      this.applyCameraImpulse(-Math.sin(this.camYaw), -Math.cos(this.camYaw), 0.38, 0.45, 4.2);

      // Knockback + damage enemies
      for (const e of this.enemies) {
        if (e.state === 'Dead') continue;
        const dist = e.pos.distanceTo(this.playerPos);
        if (dist < 8.5) {
          this.damageEnemy(e, 38, true);
          _v1.subVectors(e.pos, this.playerPos).setY(0).normalize();
          e.vel.addScaledVector(_v1, 14);
        }
      }

      // Break Sanctuary crystal bramble barrier if close
      if (!this.saveData.worldState.sanctuaryBarrierBroken) {
        const bPos = this.sanctuaryBarrierMesh.position;
        if (Math.hypot(this.playerPos.x - bPos.x, this.playerPos.z - bPos.z) < 9.5) {
          this.saveData.worldState.sanctuaryBarrierBroken = true;
          this.sanctuaryBarrierMesh.visible = false;
          this.audio.playSfx('puzzle');
          this.showDiscoveryBanner('Barrier Shattered', 'The path to The Secret Sanctuary is open!');
        }
      }

      // Resonate nearby crystals in Hidden Cave
      for (const inter of this.interactables) {
        if (inter.def.type === 'resonant_crystal') {
          const d = Math.hypot(
            this.playerPos.x - inter.def.position[0],
            this.playerPos.z - inter.def.position[1]
          );
          if (d < 9.0) {
            this.handleCrystalResonate(inter.def.puzzleIndex ?? 0);
          }
        }
      }
    } else if (id === 'gravity_control') {
      this.audio.playSfx('gravity');
      this.gravityControlTimer = 7.0;
      this.spawnShockRing(this.playerPos, 0xa855f7, 6.5);
      this.spawnParticleBurst(this.playerPos, 0xa855f7, 'shield_dome');
      this.screenShake = Math.max(this.screenShake, 0.16);
    } else if (id === 'chaos_shield') {
      this.audio.playSfx('shield');
      this.chaosShieldTimer = 6.0;
      this.spawnShockRing(this.playerPos, 0x10b981, 4.5);
      this.spawnParticleBurst(this.playerPos, 0x10b981, 'shield_dome');
      this.spawnParticleBurst(this.playerPos, 0xd4af37, 'shield_dome');
      this.screenShake = Math.max(this.screenShake, 0.22);
    }

    this.emitHud();
  }

  public triggerInteract(): void {
    if (this.screenMode !== 'playing') return;
    const prompt = this.findNearestPrompt();
    if (!prompt) return;

    if (prompt.kind === 'npc') {
      const npc = NPCS.find((n) => n.id === prompt.id);
      if (npc) {
        this.screenMode = 'paused';
        this.audio.setPaused(true);
        this.emitHud();
        this.callbacks.onOpenDialogue(npc);
      }
      return;
    }

    const runtime = this.interactables.find((i) => i.def.id === prompt.id);
    if (!runtime || !runtime.active) return;
    const def = runtime.def;

    if (def.type === 'save_campfire') {
      this.saveData.hp = this.saveData.maxHp;
      this.saveData.chaosEnergy = this.saveData.maxChaosEnergy;
      this.manualSave();
      this.showSaveToast('Rested & Saved');
    } else if (def.type === 'healing_altar') {
      this.saveData.hp = this.saveData.maxHp;
      this.saveData.chaosEnergy = this.saveData.maxChaosEnergy;
      this.audio.playSfx('save');
      this.showSaveToast('Vitality Restored');
    } else if (def.type === 'lever_bridge') {
      this.saveData.worldState.bridgeLowered = true;
      this.bridgeMesh.rotation.z = 0;
      runtime.active = false;
      this.saveData.worldState.activatedInteractables.push(def.id);
      this.advanceQuestObjective('mq_2_river_ruins', 'lower_bridge', 1);
      this.audio.playSfx('puzzle');
      this.showDiscoveryBanner('Drawbridge Lowered', 'You can now cross The River toward the Ancient Ruins.');
      saveGame(this.getSaveSnapshot());
    } else if (def.type === 'totem_symbol') {
      if (this.saveData.worldState.solvedPuzzles.includes('puzzle_symbols')) {
        this.showSaveToast('Triad already aligned.');
        return;
      }
      const idx = def.puzzleIndex ?? 0;
      this.symbolRotations[idx] = (this.symbolRotations[idx] + 1) % 3;
      runtime.group.rotation.y = this.symbolRotations[idx] * ((Math.PI * 2) / 3);
      this.audio.playSfx('step');
      const labels = ['Sun', 'Leaf', 'Spiral'];
      this.showSaveToast(`Totem ${idx + 1}: ${labels[this.symbolRotations[idx]]}`);
      if (
        this.symbolRotations[0] === 0 &&
        this.symbolRotations[1] === 1 &&
        this.symbolRotations[2] === 2
      ) {
        this.markPuzzleSolved('puzzle_symbols', 'Triad Aligned! Gravity Shrine awakened.');
      }
    } else if (def.type === 'sequence_switch') {
      if (this.saveData.worldState.solvedPuzzles.includes('puzzle_sequence')) {
        this.showSaveToast('Harmonic Song already aligned.');
        return;
      }
      const idx = def.puzzleIndex ?? 0;
      if (idx === this.sequenceStep) {
        this.sequenceStep += 1;
        this.audio.playSfx('pickup');
        this.showSaveToast(`Harmonic Pad ${idx + 1}/3 Activated`);
        if (this.sequenceStep === 3) {
          this.markPuzzleSolved('puzzle_sequence', 'Harmonic Song Complete!');
          this.advanceQuestObjective('sq_4_sequence', 'solve_sequence', 1);
          this.grantItem('chaos_shard', 2);
        }
      } else {
        this.sequenceStep = 0;
        this.audio.playSfx('hit');
        this.showSaveToast('Sequence Reset — Try 1, then 2, then 3');
      }
    } else if (def.type === 'resonant_crystal') {
      this.handleCrystalResonate(def.puzzleIndex ?? 0);
    } else if (def.type === 'ability_shrine' && def.abilityGrant) {
      if (!this.saveData.worldState.unlockedAbilities.includes(def.abilityGrant)) {
        this.saveData.worldState.unlockedAbilities.push(def.abilityGrant);
      }
      runtime.active = false;
      runtime.group.visible = false;
      this.saveData.worldState.activatedInteractables.push(def.id);
      this.audio.playSfx('puzzle');
      const abilityColor = def.abilityGrant === 'gravity_control' ? 0xa855f7 : 0x10b981;
      this.spawnShockRing(this.playerPos, abilityColor, 6.2);
      this.spawnShockRing(this.playerPos, 0xf2cf66, 4.4);
      this.spawnParticleBurst(this.playerPos, abilityColor, 'radial_wave');
      this.applyCameraImpulse(0, 0, 0.24, 0.28, 3.0);
      const abilityName = ABILITY_META[def.abilityGrant].name;
      this.showDiscoveryBanner(`${abilityName} Unlocked`, ABILITY_META[def.abilityGrant].description);
      if (def.abilityGrant === 'gravity_control') {
        this.advanceQuestObjective('mq_3_temple_gravity', 'unlock_gravity', 1);
      } else if (def.abilityGrant === 'chaos_shield') {
        this.advanceQuestObjective('mq_4_chaos_shield', 'unlock_shield', 1);
      }
      saveGame(this.getSaveSnapshot());
    } else if (def.type === 'relic_machine') {
      if (this.playerPos.y < 5.5) {
        this.showSaveToast('Climb to the Top Temple Terrace (Use Gravity Control)');
        return;
      }
      this.markPuzzleSolved('puzzle_gravity', 'Temple Gravity Conduit Aligned!');
      this.advanceQuestObjective('mq_3_temple_gravity', 'solve_gravity', 1);
      runtime.active = false;
      this.saveData.worldState.activatedInteractables.push(def.id);
      this.saveData.worldState.templeGateOpen = true;
      saveGame(this.getSaveSnapshot());
    } else if (def.type === 'chaos_obelisk') {
      if (this.chaosShieldTimer <= 0) {
        this.damagePlayer(18);
        this.showSaveToast('Activate CHAOS SHIELD before touching the Obelisk!');
        return;
      }
      this.markPuzzleSolved('puzzle_chaos_conduit', 'Chaos Obelisk Stabilized — Boss Arena Unsealed!');
      this.advanceQuestObjective('mq_4_chaos_shield', 'stabilize_obelisk', 1);
      this.saveData.worldState.bossGateOpen = true;
      this.bossGateMesh.visible = false;
      this.spawnShockRing(this.playerPos, 0xf2cf66, 8.0);
      this.spawnParticleBurst(this.playerPos, 0xc084fc, 'radial_wave');
      this.applyCameraImpulse(0, 0, 0.35, 0.36, 3.5);
      runtime.active = false;
      this.saveData.worldState.activatedInteractables.push(def.id);
      saveGame(this.getSaveSnapshot());
    } else if (def.type === 'destructible_barrier') {
      this.showSaveToast('Use SHOCKWAVE (1) to shatter these crystal brambles!');
    } else if (def.type === 'sanctuary_portal') {
      const cy = getTerrainHeight(0, 46);
      this.playerPos.set(0, cy + 0.5, 46);
      this.audio.playSfx('gravity');
      this.showDiscoveryBanner('Returned to Camp', 'Sanctuary Portal Warp Complete');
    } else if (def.type === 'boss_seal') {
      if (this.saveData.worldState.bossGateOpen) {
        this.showSaveToast('The Boss Arena is open!');
      } else {
        this.showSaveToast('Stabilize the Chaos Obelisk in The Chaos Zone to break this seal.');
      }
    } else if (def.type === 'chaos_core_pedestal') {
      this.saveData.worldState.chaosCoreObtained = true;
      runtime.active = false;
      runtime.group.visible = false;
      this.grantItem('chaos_core_jungle', 1);
      this.advanceQuestObjective('mq_5_boss', 'claim_core', 1);
      this.audio.setMood('victory');
      this.audio.playSfx('puzzle');
      saveGame(this.getSaveSnapshot());
      this.screenMode = 'victory';
    } else {
      // Chests, relics, collectibles
      if (def.itemReward) {
        this.grantItem(def.itemReward.itemId, def.itemReward.quantity);
      }
      if (def.questFlag === 'find_compass') {
        this.advanceQuestObjective('mq_1_camp', 'find_compass', 1);
      } else if (def.questFlag === 'collect_berries') {
        this.advanceQuestObjective('sq_1_berries', 'collect_berries', 1);
      } else if (def.questFlag === 'claim_heart') {
        this.advanceQuestObjective('sq_5_sanctuary', 'claim_heart', 1);
      }
      runtime.active = false;
      runtime.group.visible = false;
      this.saveData.worldState.activatedInteractables.push(def.id);
      this.audio.playSfx('pickup');
      const itemLabel = def.itemReward ? ITEMS[def.itemReward.itemId]?.name : def.label;
      this.showSaveToast(`Collected: ${itemLabel}`);
      this.saveData.xp += 25;
      this.checkLevelUp();
    }

    this.callbacks.onStateChange();
    this.emitHud();
  }

  public toggleLockOn(): void {
    if (this.lockedEnemyId) {
      this.lockedEnemyId = null;
      this.emitHud();
      return;
    }
    let best: EnemyEntity | null = null;
    let bestD = 22;
    for (const e of this.enemies) {
      if (e.state === 'Dead') continue;
      const d = e.pos.distanceTo(this.playerPos);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    this.lockedEnemyId = best ? best.id : null;
    this.emitHud();
  }

  public triggerChaosEventManual(type?: ChaosEventType): void {
    const order: ChaosEventType[] = ['GRAVITY_FLIP', 'COLLAPSE', 'FLOOD', 'METEOR_RAIN'];
    const chosen = type ?? order[this.chaosEventIndex % order.length];
    this.chaosEventIndex += 1;
    this.activeChaos = {
      type: chosen,
      phase: 'warning',
      timer: 3.0,
      meteorTick: 0,
    };
    this.audio.playSfx('chaos_warn');
    this.emitHud();
  }

  // --- Internal Helpers ---

  private handleCrystalResonate(idx: number): void {
    if (this.crystalLit[idx]) return;
    this.crystalLit[idx] = true;
    this.audio.playSfx('pickup');
    const litCount = this.crystalLit.filter(Boolean).length;
    this.showSaveToast(`Crystal Resonated (${litCount}/3)`);
    if (litCount === 3) {
      this.markPuzzleSolved('puzzle_crystals', 'Grotto Harmony Restored!');
      this.advanceQuestObjective('sq_3_crystals', 'solve_crystals', 1);
      this.grantItem('cave_prism', 1);
    }
  }

  private markPuzzleSolved(id: PuzzleId, bannerMsg: string): void {
    if (!this.saveData.worldState.solvedPuzzles.includes(id)) {
      this.saveData.worldState.solvedPuzzles.push(id);
      this.saveData.xp += 60;
      this.checkLevelUp();
      this.audio.playSfx('puzzle');
      this.showDiscoveryBanner(PUZZLES[id].name, bannerMsg);
    }
  }

  private grantItem(itemId: string, qty: number): void {
    const existing = this.saveData.inventory.find((s) => s.itemId === itemId);
    if (existing) existing.quantity += qty;
    else this.saveData.inventory.push({ itemId, quantity: qty });
  }

  private advanceQuestObjective(questId: string, objId: string, amount: number): void {
    const qp = this.saveData.quests[questId];
    const def = QUESTS.find((q) => q.id === questId);
    if (!qp || !def) return;
    if (qp.status === 'locked') qp.status = 'active';
    if (qp.status === 'completed') return;

    const objDef = def.objectives.find((o) => o.id === objId);
    if (!objDef) return;
    qp.objectiveCounts[objId] = Math.min(objDef.targetCount, (qp.objectiveCounts[objId] ?? 0) + amount);

    const allDone = def.objectives.every((o) => (qp.objectiveCounts[o.id] ?? 0) >= o.targetCount);
    if (allDone) {
      qp.status = 'completed';
      for (const r of def.rewardItems) this.grantItem(r.itemId, r.quantity);
      this.saveData.xp += 80;
      this.checkLevelUp();
      this.showSaveToast(`Quest Completed: ${def.title}`);

      // Chain next main quest cleanly
      const mainChain = ['mq_1_camp', 'mq_2_river_ruins', 'mq_3_temple_gravity', 'mq_4_chaos_shield', 'mq_5_boss'];
      const idx = mainChain.indexOf(questId);
      if (idx >= 0 && idx + 1 < mainChain.length) {
        const nextId = mainChain[idx + 1];
        if (this.saveData.quests[nextId]?.status === 'locked') {
          this.saveData.quests[nextId].status = 'active';
        }
      }
      saveGame(this.getSaveSnapshot());
    }
  }

  private checkLevelUp(): void {
    const res = applyLevelUps(
      this.saveData.xp,
      this.saveData.level,
      this.saveData.maxHp,
      this.saveData.hp,
      this.saveData.maxChaosEnergy,
      this.saveData.chaosEnergy
    );
    if (res.levelsGained > 0) {
      this.saveData.xp = res.xp;
      this.saveData.level = res.level;
      this.saveData.maxHp = res.maxHp;
      this.saveData.hp = res.hp;
      this.saveData.maxChaosEnergy = res.maxChaosEnergy;
      this.saveData.chaosEnergy = res.chaosEnergy;
      this.showSaveToast(`Level Up! Level ${this.saveData.level}`);
    }
  }

  private applyCameraImpulse(
    dirX: number,
    dirZ: number,
    kickStrength: number,
    shakeStrength: number,
    fovPunch = 0
  ): void {
    const len = Math.hypot(dirX, dirZ);
    if (len > 0.001) {
      this.camKick.x += (dirX / len) * kickStrength;
      this.camKick.z += (dirZ / len) * kickStrength;
    } else {
      this.camKick.x += Math.sin(this.camYaw) * kickStrength;
      this.camKick.z += Math.cos(this.camYaw) * kickStrength;
    }
    this.camKick.y += kickStrength * 0.28;
    this.screenShake = Math.min(0.65, Math.max(this.screenShake, shakeStrength));
    this.camFovKick = THREE.MathUtils.clamp(this.camFovKick + fovPunch, -3.5, 5.0);
  }

  private spawnSlashArc(heavy: boolean, comboStep: number): void {
    const isFinisher = comboStep === 2;
    const innerR = heavy ? 1.25 : 1.0;
    const outerR = heavy ? 2.45 : isFinisher ? 2.05 : 1.75;
    const span = heavy ? Math.PI * 1.15 : isFinisher ? Math.PI * 1.0 : Math.PI * 0.85;
    const geo = new THREE.RingGeometry(innerR, outerR, 18, 1, -span * 0.5, span);
    const color = heavy ? 0xf2cf66 : isFinisher ? 0x5eead4 : 0x2dd4bf;
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: heavy ? 0.92 : 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const fwdX = Math.sin(this.playerYaw);
    const fwdZ = Math.cos(this.playerYaw);
    mesh.position.set(
      this.playerPos.x + fwdX * 0.72,
      this.playerPos.y + 1.05,
      this.playerPos.z + fwdZ * 0.72
    );
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = this.playerYaw;
    mesh.rotation.x = Math.PI / 2;
    mesh.rotation.z = heavy ? 0.08 : comboStep === 0 ? -0.34 : comboStep === 1 ? 0.34 : -0.1;
    this.scene.add(mesh);
    this.slashArcs.push({
      mesh,
      age: 0,
      maxAge: heavy ? 0.25 : 0.17,
      baseScale: heavy ? 1.1 : 0.95,
    });
  }

  private spawnShockRing(origin: THREE.Vector3, color: number, maxScale: number): void {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1.0, 32),
      new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(origin.x, origin.y + 0.35, origin.z);
    this.scene.add(ring);
    this.shockRings.push({ mesh: ring, age: 0, maxAge: 0.48, maxScale });
  }

  private spawnParticleBurst(
    origin: THREE.Vector3,
    color: number,
    mode: 'radial_wave' | 'shield_dome' | 'shield_block' | 'hit_spark' | 'heavy_impact' | 'dodge_trail'
  ): void {
    const isLow = this.settings.graphicsQuality === 'LOW' || this.isSoftwareGl;
    const isMedium = this.settings.graphicsQuality === 'MEDIUM';
    const count =
      mode === 'hit_spark'
        ? isLow
          ? 9
          : isMedium
          ? 15
          : 22
        : mode === 'heavy_impact'
        ? isLow
          ? 14
          : isMedium
          ? 24
          : 34
        : mode === 'dodge_trail'
        ? isLow
          ? 7
          : 14
        : isLow
        ? 20
        : isMedium
        ? 36
        : 52;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;

      if (mode === 'radial_wave') {
        const radius = 0.55 + Math.random() * 0.45;
        positions[idx] = origin.x + Math.cos(angle) * radius;
        positions[idx + 1] = origin.y + 0.35 + Math.random() * 0.65;
        positions[idx + 2] = origin.z + Math.sin(angle) * radius;

        const speed = 7.5 + Math.random() * 6.5;
        velocities[idx] = Math.cos(angle) * speed;
        velocities[idx + 1] = 1.4 + Math.random() * 2.6;
        velocities[idx + 2] = Math.sin(angle) * speed;
      } else if (mode === 'shield_dome') {
        const radius = 1.05 + Math.random() * 0.45;
        positions[idx] = origin.x + Math.cos(angle) * radius;
        positions[idx + 1] = origin.y + 0.25 + Math.random() * 1.4;
        positions[idx + 2] = origin.z + Math.sin(angle) * radius;

        const speed = 1.1 + Math.random() * 1.3;
        velocities[idx] = Math.cos(angle) * speed;
        velocities[idx + 1] = 2.0 + Math.random() * 2.4;
        velocities[idx + 2] = Math.sin(angle) * speed;
      } else if (mode === 'hit_spark' || mode === 'heavy_impact') {
        const spread = mode === 'heavy_impact' ? 0.65 : 0.45;
        positions[idx] = origin.x + (Math.random() - 0.5) * spread;
        positions[idx + 1] = origin.y + 0.9 + Math.random() * 0.7;
        positions[idx + 2] = origin.z + (Math.random() - 0.5) * spread;

        const speed = (mode === 'heavy_impact' ? 5.8 : 4.2) + Math.random() * 5.2;
        velocities[idx] = Math.cos(angle) * speed;
        velocities[idx + 1] = (mode === 'heavy_impact' ? 2.6 : 1.8) + Math.random() * 3.8;
        velocities[idx + 2] = Math.sin(angle) * speed;
      } else if (mode === 'dodge_trail') {
        positions[idx] = origin.x + (Math.random() - 0.5) * 0.75;
        positions[idx + 1] = origin.y + 0.35 + Math.random() * 1.05;
        positions[idx + 2] = origin.z + (Math.random() - 0.5) * 0.75;

        const backX = -Math.sin(this.playerYaw);
        const backZ = -Math.cos(this.playerYaw);
        const speed = 2.4 + Math.random() * 2.5;
        velocities[idx] = backX * speed + (Math.random() - 0.5) * 1.6;
        velocities[idx + 1] = 0.7 + Math.random() * 1.5;
        velocities[idx + 2] = backZ * speed + (Math.random() - 0.5) * 1.6;
      } else {
        const radius = 1.2 + Math.random() * 0.25;
        positions[idx] = origin.x + Math.cos(angle) * radius;
        positions[idx + 1] = origin.y + 0.9 + (Math.random() - 0.5) * 0.9;
        positions[idx + 2] = origin.z + Math.sin(angle) * radius;

        const speed = 3.2 + Math.random() * 2.8;
        velocities[idx] = Math.cos(angle) * speed;
        velocities[idx + 1] = 1.2 + Math.random() * 2.0;
        velocities[idx + 2] = Math.sin(angle) * speed;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const baseSize =
      mode === 'radial_wave'
        ? 0.34
        : mode === 'heavy_impact'
        ? 0.3
        : mode === 'dodge_trail'
        ? 0.22
        : mode === 'hit_spark'
        ? 0.25
        : 0.26;
    const material = new THREE.PointsMaterial({
      color,
      size: baseSize,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);

    this.particleBursts.push({
      points,
      velocities,
      age: 0,
      maxAge:
        mode === 'radial_wave'
          ? 0.65
          : mode === 'shield_dome'
          ? 0.85
          : mode === 'heavy_impact'
          ? 0.48
          : mode === 'dodge_trail'
          ? 0.3
          : mode === 'hit_spark'
          ? 0.36
          : 0.45,
      baseSize,
      gravity:
        mode === 'radial_wave'
          ? -4.5
          : mode === 'heavy_impact'
          ? -12.5
          : mode === 'hit_spark'
          ? -8.0
          : mode === 'dodge_trail'
          ? -0.8
          : -1.5,
      swirl: mode === 'shield_dome' ? 2.4 : 0,
    });
  }

  private showSaveToast(msg: string): void {
    this.saveToast = msg;
    this.saveToastTimer = 2.8;
  }

  private showDiscoveryBanner(title: string, subtitle: string): void {
    this.discoveryBanner = { title, subtitle };
    this.discoveryTimer = 3.8;
  }

  private findNearestPrompt(): { id: string; label: string; kind: 'npc' | 'interact' } | null {
    let bestDist = 3.6;
    let best: { id: string; label: string; kind: 'npc' | 'interact' } | null = null;

    for (const n of this.npcs) {
      const d = Math.hypot(this.playerPos.x - n.def.position[0], this.playerPos.z - n.def.position[1]);
      if (d < bestDist) {
        bestDist = d;
        best = { id: n.def.id, label: `Talk to ${n.def.name} (${n.def.role})`, kind: 'npc' };
      }
    }

    for (const item of this.interactables) {
      if (!item.active) continue;
      const d = Math.hypot(this.playerPos.x - item.def.position[0], this.playerPos.z - item.def.position[1]);
      if (d < bestDist) {
        bestDist = d;
        best = { id: item.def.id, label: item.def.label, kind: 'interact' };
      }
    }
    return best;
  }

  // --- Per-Frame Simulation ---

  private startLoop(): void {
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    const tick = () => {
      if (this.disposed || this.contextLost) return;
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
      this.lastTime = now;

      this.update(dt);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private getLodDistanceLimit(): number {
    const q = this.settings.graphicsQuality;
    return q === 'LOW' ? 38 : q === 'MEDIUM' ? 70 : 125;
  }

  private update(dt: number): void {
    this.animTime += dt;
    this.foliageWindTime.value = this.animTime;
    this.waterShaderTime.value = this.animTime;
    this.assetManager.update(dt);

    const lodLimit = this.getLodDistanceLimit();

    // Animate camp flame, floating stones, NPC & interactable beacons
    if (this.campFlame) {
      this.campFlame.scale.y = 0.85 + Math.sin(this.animTime * 12) * 0.2;
    }
    for (let i = 0; i < this.floatingStones.length; i++) {
      const s = this.floatingStones[i];
      if (s.position.distanceTo(this.playerPos) > lodLimit + 20) continue;
      const lift = this.gravityControlTimer > 0 || this.activeChaos?.type === 'GRAVITY_FLIP' ? 1.8 : 0;
      s.position.y = (s.userData.baseY as number) + lift + Math.sin(this.animTime * 1.8 + i) * 0.45;
      s.rotation.y += dt * 0.7;
    }
    for (const item of this.interactables) {
      if (item.active) {
        if (item.group.position.distanceTo(this.playerPos) > lodLimit + 15) continue;
        item.indicator.rotation.y += dt * 1.8;
        item.indicator.position.y = 2.0 + Math.sin(this.animTime * 3 + item.def.position[0]) * 0.16;
      }
    }
    for (const npc of this.npcs) {
      if (npc.mesh.position.distanceTo(this.playerPos) > lodLimit + 10) continue;
      const beacon = npc.mesh.getObjectByName('npc_beacon');
      if (beacon) {
        beacon.rotation.y += dt * 1.5;
        beacon.position.y = 2.15 + Math.sin(this.animTime * 2.5) * 0.12;
      }
    }
    if (this.fireflies) {
      this.fireflies.position.y = Math.sin(this.animTime * 1.1) * 0.28;
    }
    if (this.jungleDustMotes) {
      const posAttr = this.jungleDustMotes.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] += Math.sin(this.animTime * 0.45 + i) * dt * 0.35;
        arr[i + 1] += Math.cos(this.animTime * 0.35 + i * 2) * dt * 0.18;
        arr[i + 2] += Math.sin(this.animTime * 0.28 + i * 3) * dt * 0.25;
      }
      posAttr.needsUpdate = true;
    }
    for (let i = 0; i < this.creepingMistPatches.length; i++) {
      const mist = this.creepingMistPatches[i];
      mist.rotation.z += dt * (0.012 + i * 0.004);
      const mat = mist.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.16 + Math.sin(this.animTime * 0.8 + i) * 0.04;
    }
    if (this.campEmbers) {
      const posAttr = this.campEmbers.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const campFloorY = getTerrainHeight(0, 44);
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += dt * (1.2 + (i % 5) * 0.16);
        arr[i] += Math.sin(this.animTime * 2.5 + i) * dt * 0.25;
        if (arr[i + 1] > campFloorY + 4.4) {
          arr[i] = (Math.random() - 0.5) * 0.9;
          arr[i + 1] = campFloorY + 0.65;
          arr[i + 2] = 44 + (Math.random() - 0.5) * 0.9;
        }
      }
      posAttr.needsUpdate = true;
    }
    if (this.waterfallMist) {
      const posAttr = this.waterfallMist.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] -= dt * 0.7;
        arr[i + 1] += dt * 0.85;
        if (arr[i + 1] > this.baseWaterY + 3.1) {
          arr[i] = 45.2 + Math.random() * 2.4;
          arr[i + 1] = this.baseWaterY + 0.25;
          arr[i + 2] = -8 + (Math.random() - 0.5) * 6.2;
        }
      }
      posAttr.needsUpdate = true;
    }
    if (this.waterTex) {
      this.waterTex.offset.x = (this.waterTex.offset.x + dt * 0.025) % 1;
      this.waterTex.offset.y = (this.waterTex.offset.y - dt * 0.065) % 1;
    }
    if (this.waterNormalTex) {
      this.waterNormalTex.offset.x = (this.waterNormalTex.offset.x - dt * 0.018 + 1) % 1;
      this.waterNormalTex.offset.y = (this.waterNormalTex.offset.y + dt * 0.042) % 1;
    }
    if (this.waterfallTex) {
      this.waterfallTex.offset.y = (this.waterfallTex.offset.y + dt * 0.75) % 1;
    }

    // Cinematic 3D Main Menu Vista: Hero posed overlooking Forgotten Temple, sunbeams & living jungle
    if (this.screenMode === 'menu') {
      this.audio.setPaused(false);
      this.audio.setMood('menu');

      const hx = 2.6;
      const hz = -16.5;
      const hy = getTerrainHeight(hx, hz);
      this.explorer.root.position.set(hx, hy, hz);
      this.explorer.root.rotation.set(0, -Math.PI * 0.28 + Math.sin(this.animTime * 0.35) * 0.04, 0);
      this.explorer.body.position.y = 0.85 + Math.sin(this.animTime * 2.0) * 0.025;
      this.explorer.body.rotation.set(0.03, 0, 0);
      this.explorer.leftArm.rotation.set(0.18 + Math.sin(this.animTime * 1.4) * 0.04, 0, 0.14);
      this.explorer.rightArm.rotation.set(-0.34 + Math.sin(this.animTime * 1.4) * 0.04, 0, -0.18);
      this.explorer.leftLeg.rotation.set(0.08, 0, 0);
      this.explorer.rightLeg.rotation.set(-0.1, 0, 0);
      this.explorer.scarf.rotation.x = 0.38 + Math.sin(this.animTime * 4.2) * 0.16;

      // Golden-hour atmosphere tuned for the Forgotten Temple vista
      if (this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.set('#18362a');
        this.scene.fog.density = 0.0095;
      }
      if (this.scene.background instanceof THREE.Color) {
        this.scene.background.set('#2c5c4e');
      }
      this.sunLight.position.set(28, 36, -4);
      this.sunLight.target.position.set(0, 3.0, -26);
      this.sunLight.target.updateMatrixWorld();

      const swayX = Math.sin(this.animTime * 0.24) * 0.65;
      const swayY = Math.cos(this.animTime * 0.19) * 0.18;
      this.camera.position.set(-1.2 + swayX, hy + 2.05 + swayY, -10.2);
      this.camera.lookAt(-1.1, hy + 2.15, -26.5);
      return;
    }

    if (this.screenMode !== 'playing') {
      return;
    }

    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      this.updateCamera(dt);
      return;
    }

    this.saveData.playTimeSeconds += dt;

    // Cooldowns & timers
    for (const key of ['shockwave', 'gravity_control', 'chaos_shield'] as AbilityId[]) {
      if (this.abilityCooldowns[key] > 0) this.abilityCooldowns[key] = Math.max(0, this.abilityCooldowns[key] - dt);
    }
    if (this.gravityControlTimer > 0) this.gravityControlTimer = Math.max(0, this.gravityControlTimer - dt);
    if (this.chaosShieldTimer > 0) this.chaosShieldTimer = Math.max(0, this.chaosShieldTimer - dt);
    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.barrierToastCooldown > 0) this.barrierToastCooldown = Math.max(0, this.barrierToastCooldown - dt);
    if (this.dodgeTimer > 0) {
      this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
      this.dodgeTrailAccum += dt;
      if (this.dodgeTrailAccum >= 0.085) {
        this.dodgeTrailAccum = 0;
        this.spawnParticleBurst(this.playerPos, 0x5eead4, 'dodge_trail');
      }
    }
    if (this.dodgeCooldown > 0) this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    if (this.saveToastTimer > 0) {
      this.saveToastTimer -= dt;
      if (this.saveToastTimer <= 0) this.saveToast = null;
    }
    if (this.discoveryTimer > 0) {
      this.discoveryTimer -= dt;
      if (this.discoveryTimer <= 0) this.discoveryBanner = null;
    }

    // Passive energy regen
    this.saveData.chaosEnergy = Math.min(this.saveData.maxChaosEnergy, this.saveData.chaosEnergy + dt * 5.2);

    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateProjectilesAndVfx(dt);
    this.updateChaosEngine(dt);
    this.updateZoneAtmosphere(dt);
    this.updateCamera(dt);

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.08) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }
  }

  private updatePlayer(dt: number): void {
    let moveX = this.touchMove.x;
    let moveZ = this.touchMove.y;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 1) {
      moveX /= len;
      moveZ /= len;
    }

    // Camera-relative movement direction
    const forwardX = -Math.sin(this.camYaw);
    const forwardZ = -Math.cos(this.camYaw);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);

    const worldDirX = rightX * moveX - forwardX * moveZ;
    const worldDirZ = rightZ * moveX - forwardZ * moveZ;

    const isDodging = this.dodgeTimer > 0;
    const inWater = this.currentWaterY - this.playerPos.y > 0.55;
    const moveSpeed = isDodging ? 17.5 : inWater ? 5.6 : 9.4;

    if (isDodging) {
      this.playerVel.x = Math.sin(this.playerYaw) * moveSpeed;
      this.playerVel.z = Math.cos(this.playerYaw) * moveSpeed;
    } else if (len > 0.08) {
      const targetYaw = Math.atan2(worldDirX, worldDirZ);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 12);

      this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, worldDirX * moveSpeed, 14, dt);
      this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, worldDirZ * moveSpeed, 14, dt);
    } else {
      this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, 0, 14, dt);
      this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, 0, 14, dt);
    }

    // Gravity (modified by Gravity Control ability or GRAVITY_FLIP Chaos event)
    let gravity = -24;
    if (this.gravityControlTimer > 0 || this.activeChaos?.type === 'GRAVITY_FLIP') {
      gravity = -9.8;
    }
    this.playerVel.y += gravity * dt;

    // Proposed next position & solid environment obstacle collisions
    const nextX = THREE.MathUtils.clamp(this.playerPos.x + this.playerVel.x * dt, -WORLD_HALF_SIZE, WORLD_HALF_SIZE);
    const nextZ = THREE.MathUtils.clamp(this.playerPos.z + this.playerVel.z * dt, -WORLD_HALF_SIZE, WORLD_HALF_SIZE);

    const isBlocked = (x: number, z: number) =>
      checkEnvironmentCollision(x, z, this.playerPos.y, this.saveData.worldState);

    const directBlocked = isBlocked(nextX, nextZ);
    const barrierHit = isBlockedByWorldBarrier(nextX, nextZ, this.saveData.worldState);

    if (!directBlocked) {
      this.playerPos.x = nextX;
      this.playerPos.z = nextZ;
    } else {
      // Axis sliding against obstacles/barriers
      if (!isBlocked(nextX, this.playerPos.z)) {
        this.playerPos.x = nextX;
      } else if (!isBlocked(this.playerPos.x, nextZ)) {
        this.playerPos.z = nextZ;
      }
      if (barrierHit && this.barrierToastCooldown <= 0) {
        this.barrierToastCooldown = 2.5;
        this.showSaveToast(
          barrierHit === 'boss'
            ? 'Boss Arena sealed — stabilize the Chaos Obelisk first.'
            : 'Crystal Brambles block the way — shatter them with Shockwave.'
        );
      }
    }

    this.playerPos.y += this.playerVel.y * dt;

    // Ground & Bridge height check
    let floorY = getTerrainHeight(this.playerPos.x, this.playerPos.z);
    if (this.saveData.worldState.bridgeLowered && Math.abs(this.playerPos.x - 27) < 5.5 && Math.abs(this.playerPos.z - 14) < 2.4) {
      floorY = Math.max(floorY, 0.5);
    }
    if (inWater) {
      floorY = Math.max(floorY, this.currentWaterY - 0.85);
    }

    if (this.playerPos.y <= floorY) {
      if (!this.onGround && this.playerVel.y < -8) {
        this.audio.playSfx('land');
      }
      this.playerPos.y = floorY;
      this.playerVel.y = 0;
      this.onGround = true;
      this.jumpCount = 0;
    } else {
      this.onGround = false;
    }

    // Combat swing timing & hit detection
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (!this.attackHitDone && this.attackTimer < 0.22) {
        this.attackHitDone = true;
        const isHeavy = this.comboStep === 3;
        const isFinisher = this.comboStep === 2;
        const hitRange = isHeavy ? 4.2 : isFinisher ? 3.7 : 3.4;
        const dmg = isHeavy ? 46 : isFinisher ? 34 : 24;
        for (const e of this.enemies) {
          if (e.state === 'Dead') continue;
          if (e.pos.distanceTo(this.playerPos) <= hitRange) {
            this.damageEnemy(e, dmg, isHeavy || isFinisher, isHeavy);
          }
        }
        // Also allow attacking resonant crystals in Hidden Cave
        for (const inter of this.interactables) {
          if (inter.def.type === 'resonant_crystal') {
            const d = Math.hypot(
              this.playerPos.x - inter.def.position[0],
              this.playerPos.z - inter.def.position[1]
            );
            if (d <= hitRange + 0.8) {
              this.handleCrystalResonate(inter.def.puzzleIndex ?? 0);
            }
          }
        }
      }
    }

    // Articulated Explorer Animations with enhanced organic human kinematics
    this.explorer.root.position.copy(this.playerPos);
    this.explorer.root.rotation.y = this.playerYaw;
    this.explorer.shieldDome.visible = this.chaosShieldTimer > 0;
    this.explorer.shieldDome.rotation.y += dt * 1.4;
    this.explorer.gravityAura.visible = this.gravityControlTimer > 0;
    this.explorer.gravityAura.rotation.z += dt * 3.0;

    const horizSpeed = Math.hypot(this.playerVel.x, this.playerVel.z);
    const inAir = !this.onGround;

    if (inAir) {
      // Jump kinematics: tuck legs on ascent, extend to brace on descent
      const isRising = this.playerVel.y > 0;
      this.explorer.leftLeg.rotation.x = THREE.MathUtils.damp(
        this.explorer.leftLeg.rotation.x,
        isRising ? -0.45 : 0.15,
        10,
        dt
      );
      this.explorer.rightLeg.rotation.x = THREE.MathUtils.damp(
        this.explorer.rightLeg.rotation.x,
        isRising ? 0.35 : 0.15,
        10,
        dt
      );
      this.explorer.leftArm.rotation.x = THREE.MathUtils.damp(
        this.explorer.leftArm.rotation.x,
        -0.65,
        8,
        dt
      );
      this.explorer.body.position.y = 0.88;
    } else if (horizSpeed > 0.6) {
      // Running locomotion: reciprocal arm/leg gait with natural hip lift and foot cadence
      const cycle = this.animTime * (horizSpeed > 10 ? 14 : 11.5);
      this.explorer.leftLeg.rotation.x = Math.sin(cycle) * 0.68;
      this.explorer.rightLeg.rotation.x = -Math.sin(cycle) * 0.68;
      this.explorer.leftArm.rotation.x = -Math.sin(cycle) * 0.52;
      this.explorer.body.position.y = 0.88 + Math.abs(Math.sin(cycle)) * 0.055;
      this.footstepAccum += dt;
      if (this.footstepAccum > 0.32) {
        this.footstepAccum = 0;
        this.audio.playSfx('step');
      }
    } else {
      // Natural resting breathing with rhythmic chest expansion
      this.explorer.leftLeg.rotation.x = THREE.MathUtils.damp(this.explorer.leftLeg.rotation.x, 0, 12, dt);
      this.explorer.rightLeg.rotation.x = THREE.MathUtils.damp(this.explorer.rightLeg.rotation.x, 0, 12, dt);
      this.explorer.leftArm.rotation.x = THREE.MathUtils.damp(this.explorer.leftArm.rotation.x, 0, 12, dt);
      this.explorer.body.position.y = 0.88 + Math.sin(this.animTime * 2.2) * 0.022;
    }

    if (this.attackTimer > 0) {
      if (this.comboStep === 3) {
        // Heavy overhead smash plunge
        this.explorer.rightArm.rotation.x = -2.1 + Math.sin(this.attackTimer * 16) * 1.6;
        this.explorer.rightArm.rotation.z = -0.42;
        this.explorer.body.rotation.y = Math.sin(this.attackTimer * 14) * 0.42;
        this.explorer.blade.scale.z = 1.55;
      } else if (this.comboStep === 2) {
        // Reverse cross cut
        this.explorer.rightArm.rotation.x = -1.35 + Math.cos(this.attackTimer * 18) * 1.25;
        this.explorer.rightArm.rotation.z = -0.32;
        this.explorer.body.rotation.y = -Math.sin(this.attackTimer * 18) * 0.28;
        this.explorer.blade.scale.z = 1.36;
      } else {
        // Quick horizontal slash
        this.explorer.rightArm.rotation.x = -1.65 + Math.sin(this.attackTimer * 18) * 1.15;
        this.explorer.rightArm.rotation.z = -0.22;
        this.explorer.body.rotation.y = Math.sin(this.attackTimer * 16) * 0.18;
        this.explorer.blade.scale.z = 1.25;
      }
    } else {
      this.explorer.rightArm.rotation.x = THREE.MathUtils.damp(
        this.explorer.rightArm.rotation.x,
        horizSpeed > 0.6 ? Math.sin(this.animTime * 11.5) * 0.48 : 0,
        14,
        dt
      );
      this.explorer.rightArm.rotation.z = THREE.MathUtils.damp(this.explorer.rightArm.rotation.z, 0, 14, dt);
      this.explorer.body.rotation.y = THREE.MathUtils.damp(this.explorer.body.rotation.y, 0, 14, dt);
      this.explorer.blade.scale.z = 1.0;
    }

    const targetLean = this.dodgeTimer > 0 ? 0.35 : horizSpeed > 2.5 ? 0.1 : 0;
    this.explorer.body.rotation.x = THREE.MathUtils.damp(this.explorer.body.rotation.x, targetLean, 14, dt);
    this.explorer.scarf.rotation.x = 0.28 + Math.min(0.68, horizSpeed * 0.065) + Math.sin(this.animTime * 7.5) * 0.09;
  }

  private updateEnemies(dt: number): void {
    const gravSlow = this.gravityControlTimer > 0 || this.activeChaos?.type === 'GRAVITY_FLIP' ? 0.55 : 1.0;

    for (const e of this.enemies) {
      if (e.state === 'Dead') continue;

      if (e.attackCooldown > 0) e.attackCooldown -= dt;
      const distToPlayer = e.pos.distanceTo(this.playerPos);
      const distToSpawn = e.pos.distanceTo(e.spawnPos);

      // Boss phase transitions
      if (e.family === 'boss') {
        const hpRatio = e.hp / e.maxHp;
        if (hpRatio < 0.66 && e.bossPhase === 1) {
          e.bossPhase = 2;
          this.audio.playSfx('boss_roar');
          this.showDiscoveryBanner('Krakoss Enraged — Phase 2', 'Chaos Meteors & Minions Inbound!');
          if (!e.summonedP2) {
            e.summonedP2 = true;
            this.triggerChaosEventManual('METEOR_RAIN');
          }
        } else if (hpRatio < 0.33 && e.bossPhase === 2) {
          e.bossPhase = 3;
          e.speed = 5.6;
          this.audio.playSfx('boss_roar');
          this.showDiscoveryBanner('Krakoss Overdrive — Phase 3', 'Final Stand of the Guardian!');
        }
      }

      // AI FSM
      if (e.state === 'Stagger') {
        e.staggerTimer -= dt;
        e.rig.telegraphRing.visible = false;
        e.rig.staggerHalo.visible = true;
        e.rig.staggerHalo.rotation.z += dt * 4.2;
        if (e.staggerTimer <= 0) {
          e.state = 'Chase';
          e.rig.staggerHalo.visible = false;
        }
      } else if (e.state === 'Attack') {
        e.rig.staggerHalo.visible = false;
        e.stateTimer += dt;
        e.rig.telegraphRing.visible = true;
        const windupNorm = Math.min(1, e.stateTimer / Math.max(0.1, e.telegraphDuration));
        const pulse = 0.84 + Math.sin(e.stateTimer * 22) * 0.22 + windupNorm * 0.16;
        e.rig.telegraphRing.scale.setScalar(pulse);
        (e.rig.coreMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          e.rig.coreBaseIntensity * (1.2 + windupNorm * 1.4);

        if (e.stateTimer >= e.telegraphDuration) {
          e.rig.telegraphRing.visible = false;
          (e.rig.coreMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = e.rig.coreBaseIntensity;
          if (e.family === 'spitter') {
            _v1.set(
              this.playerPos.x - e.pos.x,
              this.playerPos.y + 0.8 - (e.pos.y + 1.4),
              this.playerPos.z - e.pos.z
            ).normalize();
            _v2.set(e.pos.x, e.pos.y + 1.4, e.pos.z);
            this.spawnProjectile(
              _v2,
              _v1.multiplyScalar(15),
              e.damage,
              true
            );
          } else {
            const hitRadius = e.family === 'boss' ? 5.0 : e.attackRange + 0.8;
            if (distToPlayer <= hitRadius) {
              this.damagePlayer(e.damage);
            }
            if (e.family === 'boss') {
              this.spawnShockRing(e.pos, 0xf43f5e, 5.5);
              this.applyCameraImpulse(
                this.playerPos.x - e.pos.x,
                this.playerPos.z - e.pos.z,
                0.38,
                0.36,
                2.8
              );
            }
          }
          e.attackCooldown = e.family === 'boss' ? (e.bossPhase === 3 ? 1.3 : 1.9) : 1.7;
          e.state = 'Chase';
          e.stateTimer = 0;
        }
      } else {
        e.rig.staggerHalo.visible = false;
        e.rig.telegraphRing.visible = false;
        if (e.hitFlashTimer <= 0) {
          (e.rig.coreMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = e.rig.coreBaseIntensity;
        }
        // Idle / Patrol / Chase / Retreat
        if (distToPlayer < e.detectRange && distToSpawn < 32) {
          e.state = 'Chase';
        } else if (distToSpawn > 28) {
          e.state = 'Retreat';
        } else {
          e.state = e.speed > 0 ? 'Patrol' : 'Idle';
        }

        if (e.state === 'Chase') {
          _v1.subVectors(this.playerPos, e.pos).setY(0);
          const len = _v1.length();
          if (len > 0.01) {
            e.yaw = Math.atan2(_v1.x, _v1.z);
          }
          if (distToPlayer <= e.attackRange && e.attackCooldown <= 0) {
            e.state = 'Attack';
            e.stateTimer = 0;
          } else if (e.speed > 0 && distToPlayer > e.attackRange * 0.8) {
            _v1.normalize();
            e.pos.x += _v1.x * e.speed * gravSlow * dt;
            e.pos.z += _v1.z * e.speed * gravSlow * dt;
          }
        } else if (e.state === 'Retreat') {
          _v1.subVectors(e.spawnPos, e.pos).setY(0);
          if (_v1.length() < 1.5) e.state = 'Idle';
          else {
            _v1.normalize();
            e.yaw = Math.atan2(_v1.x, _v1.z);
            e.pos.x += _v1.x * e.speed * dt;
            e.pos.z += _v1.z * e.speed * dt;
          }
        } else if (e.state === 'Patrol') {
          e.patrolAngle += dt * 0.5;
          const targetX = e.spawnPos.x + Math.cos(e.patrolAngle) * 4.5;
          const targetZ = e.spawnPos.z + Math.sin(e.patrolAngle) * 4.5;
          _v1.set(targetX - e.pos.x, 0, targetZ - e.pos.z);
          if (_v1.length() > 0.2) {
            _v1.normalize();
            e.yaw = Math.atan2(_v1.x, _v1.z);
            e.pos.x += _v1.x * e.speed * 0.45 * dt;
            e.pos.z += _v1.z * e.speed * 0.45 * dt;
          }
        }
      }

      // Apply knockback velocity & ground snap
      e.pos.addScaledVector(e.vel, dt);
      e.vel.multiplyScalar(Math.max(0, 1 - dt * 8));
      e.pos.y = getTerrainHeight(e.pos.x, e.pos.z);
      e.rig.root.position.copy(e.pos);
      e.rig.root.rotation.y = e.yaw;
      e.rig.coreMesh.rotation.y += dt * (e.family === 'boss' && e.bossPhase >= 2 ? 4.5 : 2.5);

      // BUG-16: Articulated limb, telegraph windup & phase animations for all enemy families
      const isMoving = e.state === 'Chase' || e.state === 'Patrol' || e.state === 'Retreat';
      const windup = e.state === 'Attack' ? Math.min(1, e.stateTimer / Math.max(0.1, e.telegraphDuration)) : 0;

      if (e.family === 'stalker') {
        const stride = isMoving ? Math.sin(this.animTime * 13 + e.patrolAngle) * 0.65 : 0;
        if (e.rig.limbs.length >= 4) {
          e.rig.limbs[0].rotation.x = e.state === 'Attack' ? -0.65 * windup : stride;
          e.rig.limbs[1].rotation.x = e.state === 'Attack' ? -0.65 * windup : -stride;
          e.rig.limbs[2].rotation.x = -stride;
          e.rig.limbs[3].rotation.x = stride;
        }
        e.rig.body.rotation.x = e.state === 'Attack' ? -0.22 * windup : e.state === 'Stagger' ? 0.25 : 0;
      } else if (e.family === 'spitter') {
        e.rig.body.scale.y = 1 + Math.sin(this.animTime * 3.5 + e.patrolAngle) * 0.05 + windup * 0.14;
        for (let l = 0; l < e.rig.limbs.length; l++) {
          e.rig.limbs[l].rotation.z = -0.38 - windup * 0.35 + Math.sin(this.animTime * 3 + l) * 0.08;
        }
      } else if (e.family === 'sentinel' || e.family === 'boss') {
        const walkSwing = isMoving ? Math.sin(this.animTime * (e.family === 'boss' ? 5.5 : 7)) * 0.45 : 0;
        const targetArmLeft =
          e.state === 'Attack' ? -2.1 * windup : e.state === 'Stagger' ? 0.35 : walkSwing;
        const targetArmRight =
          e.state === 'Attack' ? -2.1 * windup : e.state === 'Stagger' ? 0.35 : -walkSwing;
        if (e.rig.limbs[0]) {
          e.rig.limbs[0].rotation.x = THREE.MathUtils.damp(e.rig.limbs[0].rotation.x, targetArmLeft, 10, dt);
        }
        if (e.rig.limbs[1]) {
          e.rig.limbs[1].rotation.x = THREE.MathUtils.damp(e.rig.limbs[1].rotation.x, targetArmRight, 10, dt);
        }
        e.rig.body.rotation.x = e.state === 'Stagger' ? -0.18 : 0;

        if (e.family === 'boss') {
          const halo = e.rig.body.getObjectByName('boss_halo');
          if (halo) {
            halo.rotation.z += dt * (e.bossPhase === 3 ? 2.6 : e.bossPhase === 2 ? 1.6 : 0.8);
          }
          e.rig.coreMesh.scale.setScalar(
            1 + (e.bossPhase - 1) * 0.14 + Math.sin(this.animTime * 5) * 0.06
          );
        }
      }
      // Hit-flash emissive highlight & squash/stretch impact recovery
      if (e.hitFlashTimer > 0) {
        e.hitFlashTimer = Math.max(0, e.hitFlashTimer - dt);
        if (e.hitFlashTimer <= 0) {
          for (const ft of e.rig.flashTargets) {
            ft.mat.emissive.setHex(ft.baseEmissive);
            ft.mat.emissiveIntensity = ft.baseIntensity;
          }
        }
      }
      if (e.hitSquash > 0.002) {
        e.hitSquash = THREE.MathUtils.damp(e.hitSquash, 0, 18, dt);
        e.rig.body.scale.set(1 + e.hitSquash * 0.55, 1 - e.hitSquash * 0.42, 1 + e.hitSquash * 0.55);
      } else if (e.family !== 'spitter') {
        e.rig.body.scale.set(1, 1, 1);
      }
      if (e.state === 'Stagger') {
        e.rig.body.rotation.z = Math.sin(this.animTime * 24) * 0.12;
      } else {
        e.rig.body.rotation.z = THREE.MathUtils.damp(e.rig.body.rotation.z, 0, 14, dt);
      }
    }
  }

  private damageEnemy(e: EnemyEntity, amount: number, stagger: boolean, isHeavyStrike = stagger): void {
    const mult = e.family === 'boss' && e.state === 'Stagger' ? 1.5 : 1.0;
    e.hp = Math.max(0, e.hp - Math.round(amount * mult));
    this.audio.playSfx(stagger ? 'heavy_hit' : 'hit');
    this.hitStopTimer = isHeavyStrike ? 0.055 : stagger ? 0.038 : 0.02;

    const dirX = e.pos.x - this.playerPos.x;
    const dirZ = e.pos.z - this.playerPos.z;
    const dLen = Math.hypot(dirX, dirZ) || 1;
    e.vel.x += (dirX / dLen) * (isHeavyStrike ? 9.2 : stagger ? 6.2 : 3.6);
    e.vel.z += (dirZ / dLen) * (isHeavyStrike ? 9.2 : stagger ? 6.2 : 3.6);

    this.applyCameraImpulse(
      -dirX,
      -dirZ,
      isHeavyStrike ? 0.44 : stagger ? 0.28 : 0.14,
      isHeavyStrike ? 0.28 : stagger ? 0.18 : 0.09,
      isHeavyStrike ? 2.8 : stagger ? 1.8 : 0.7
    );

    e.hitFlashTimer = isHeavyStrike ? 0.16 : 0.11;
    e.hitSquash = isHeavyStrike ? 0.26 : 0.15;
    const flashHex = isHeavyStrike ? 0xfef08a : 0x99f6e4;
    for (const ft of e.rig.flashTargets) {
      ft.mat.emissive.setHex(flashHex);
      ft.mat.emissiveIntensity = isHeavyStrike ? 1.75 : 1.35;
    }

    this.spawnShockRing(e.pos, stagger ? 0xf2cf66 : 0x2dd4bf, stagger ? 2.6 : 1.6);
    this.spawnParticleBurst(e.pos, stagger ? 0xf2cf66 : 0x38bdf8, isHeavyStrike ? 'heavy_impact' : 'hit_spark');
    if (isHeavyStrike) {
      this.spawnParticleBurst(e.pos, 0x10b981, 'hit_spark');
    }
    if (this.settings.showTouchControls) {
      triggerHaptic(stagger ? 'heavyHitImpact' : 'hitImpact', this.settings.hapticsEnabled !== false);
    }

    if (stagger && e.state !== 'Dead') {
      e.state = 'Stagger';
      e.staggerTimer = e.family === 'boss' ? 1.15 : 0.95;
      e.rig.telegraphRing.visible = false;
      e.rig.staggerHalo.visible = true;
    }

    if (e.hp <= 0) {
      e.state = 'Dead';
      e.rig.root.visible = false;
      e.rig.telegraphRing.visible = false;
      e.rig.staggerHalo.visible = false;
      this.spawnParticleBurst(e.pos, 0xf2cf66, 'heavy_impact');
      this.saveData.enemiesDefeatedCount += 1;
      this.saveData.xp += e.family === 'boss' ? 200 : 35;
      this.checkLevelUp();
      this.advanceQuestObjective('sq_2_stalkers', 'defeat_enemies', 1);

      if (e.family === 'boss') {
        this.saveData.worldState.bossDefeated = true;
        this.advanceQuestObjective('mq_5_boss', 'defeat_krakoss', 1);
        const pedestal = this.interactables.find((i) => i.def.type === 'chaos_core_pedestal');
        if (pedestal) {
          pedestal.group.visible = true;
          pedestal.active = true;
        }
        this.showDiscoveryBanner('Krakoss Defeated!', 'Approach the pedestal to claim the Jungle Chaos Core.');
        saveGame(this.getSaveSnapshot());
      } else {
        this.saveData.worldState.defeatedEnemies.push(e.id);
        this.grantItem('chaos_shard', 1);
      }

      if (this.lockedEnemyId === e.id) this.lockedEnemyId = null;
      this.callbacks.onStateChange();
    }
  }

  private damagePlayer(amount: number): void {
    if (this.invulnTimer > 0) return;
    if (this.chaosShieldTimer > 0) {
      this.audio.playSfx('shield');
      this.showSaveToast('Blocked by Chaos Shield!');
      this.spawnParticleBurst(this.playerPos, 0x10b981, 'shield_block');
      this.applyCameraImpulse(-Math.sin(this.playerYaw), -Math.cos(this.playerYaw), 0.2, 0.16, 1.2);
      if (this.settings.showTouchControls) {
        triggerHaptic('shieldBlock', this.settings.hapticsEnabled !== false);
      }
      return;
    }
    this.saveData.hp = Math.max(0, this.saveData.hp - amount);
    this.invulnTimer = 0.45;
    this.applyCameraImpulse(-Math.sin(this.playerYaw), -Math.cos(this.playerYaw), 0.4, 0.32, -2.2);
    this.audio.playSfx('hit');
    if (this.settings.showTouchControls) {
      triggerHaptic('playerDamaged', this.settings.hapticsEnabled !== false);
    }

    if (this.saveData.hp <= 0) {
      this.audio.setMood('defeat');
      this.screenMode = 'defeat';
      this.emitHud();
    }
  }

  private spawnProjectile(pos: THREE.Vector3, vel: THREE.Vector3, damage: number, fromEnemy: boolean): void {
    if (!this.sharedProjectileGeo || !this.sharedEnemyProjMat || !this.sharedPlayerProjMat) return;
    const mesh = new THREE.Mesh(
      this.sharedProjectileGeo,
      fromEnemy ? this.sharedEnemyProjMat : this.sharedPlayerProjMat
    );
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.projectiles.push({ mesh, pos: pos.clone(), vel: vel.clone(), life: 3.2, damage, fromEnemy });
  }

  private updateProjectilesAndVfx(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);

      _v1.set(this.playerPos.x, this.playerPos.y + 1, this.playerPos.z);
      let remove = p.life <= 0 || p.pos.y < getTerrainHeight(p.pos.x, p.pos.z);
      if (p.fromEnemy && p.pos.distanceTo(_v1) < 1.1) {
        this.damagePlayer(p.damage);
        remove = true;
      }
      if (remove) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const arc = this.slashArcs[i];
      arc.age += dt;
      const t = Math.min(1, arc.age / arc.maxAge);
      arc.mesh.scale.setScalar(arc.baseScale + t * 0.48);
      (arc.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - t) * 0.9);
      if (arc.age >= arc.maxAge) {
        this.scene.remove(arc.mesh);
        arc.mesh.geometry.dispose();
        (arc.mesh.material as THREE.Material).dispose();
        this.slashArcs.splice(i, 1);
      }
    }

    for (let i = this.shockRings.length - 1; i >= 0; i--) {
      const r = this.shockRings[i];
      r.age += dt;
      const t = r.age / r.maxAge;
      const s = 1 + t * r.maxScale;
      r.mesh.scale.setScalar(s);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t);
      if (r.age >= r.maxAge) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        (r.mesh.material as THREE.Material).dispose();
        this.shockRings.splice(i, 1);
      }
    }

    for (let i = this.particleBursts.length - 1; i >= 0; i--) {
      const b = this.particleBursts[i];
      b.age += dt;
      const t = Math.min(1, b.age / b.maxAge);
      const posAttr = b.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const v = b.velocities;
      const count = arr.length / 3;

      for (let j = 0; j < count; j++) {
        const idx = j * 3;
        v[idx + 1] += b.gravity * dt;
        arr[idx] += v[idx] * dt;
        arr[idx + 1] += v[idx + 1] * dt;
        arr[idx + 2] += v[idx + 2] * dt;

        if (b.swirl !== 0) {
          const dx = arr[idx] - this.playerPos.x;
          const dz = arr[idx + 2] - this.playerPos.z;
          const rot = b.swirl * dt;
          const cosR = Math.cos(rot);
          const sinR = Math.sin(rot);
          arr[idx] = this.playerPos.x + dx * cosR - dz * sinR;
          arr[idx + 2] = this.playerPos.z + dx * sinR + dz * cosR;
        }
      }
      posAttr.needsUpdate = true;

      const mat = b.points.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, (1 - t) * 0.9);
      mat.size = b.baseSize * (1 - t * 0.45);

      if (b.age >= b.maxAge) {
        this.scene.remove(b.points);
        b.points.geometry.dispose();
        mat.dispose();
        this.particleBursts.splice(i, 1);
      }
    }
  }

  private updateChaosEngine(dt: number): void {
    // Clean up collapse pillars after duration
    for (let i = this.collapsePillars.length - 1; i >= 0; i--) {
      const cp = this.collapsePillars[i];
      cp.timer -= dt;
      if (cp.timer <= 0) {
        this.scene.remove(cp.mesh);
        this.collapsePillars.splice(i, 1);
      }
    }

    // Update active Meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.timer -= dt;
      if (!m.impacted) {
        m.rock.position.y = Math.max(m.pos.y + 0.5, m.pos.y + m.timer * 24);
        if (m.timer <= 0) {
          m.impacted = true;
          this.audio.playSfx('meteor');
          this.spawnShockRing(m.pos, 0xf97316, 4.5);
          this.screenShake = 0.22;
          if (this.playerPos.distanceTo(m.pos) < 3.4) {
            this.damagePlayer(20);
          }
          for (const e of this.enemies) {
            if (e.state !== 'Dead' && e.pos.distanceTo(m.pos) < 4.0) {
              this.damageEnemy(e, 30, true);
            }
          }
        }
      } else if (m.timer < -0.6) {
        this.scene.remove(m.ring);
        this.scene.remove(m.rock);
        this.meteors.splice(i, 1);
      }
    }

    if (!this.activeChaos) {
      // Only countdown outside safe Camp zone
      if (this.currentZone.id !== 'camp') {
        this.chaosNextCountdown -= dt * (this.currentZone.id === 'chaos_zone' ? 2.2 : 1.0);
        if (this.chaosNextCountdown <= 0) {
          this.chaosNextCountdown = 36;
          this.triggerChaosEventManual();
        }
      }
      this.currentWaterY = THREE.MathUtils.damp(this.currentWaterY, this.baseWaterY, 2.5, dt);
      this.waterMesh.position.y = this.currentWaterY;
      return;
    }

    this.activeChaos.timer -= dt;

    if (this.activeChaos.phase === 'warning') {
      if (this.activeChaos.timer <= 0) {
        this.activeChaos.phase = 'active';
        this.activeChaos.timer = 11.0;

        if (this.activeChaos.type === 'COLLAPSE' && this.sharedCollapsePillarGeo && this.sharedCollapsePillarMat) {
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + 0.4;
            const px = this.playerPos.x + Math.cos(a) * 6.5;
            const pz = this.playerPos.z + Math.sin(a) * 6.5;
            const py = getTerrainHeight(px, pz);
            const pillar = new THREE.Mesh(this.sharedCollapsePillarGeo, this.sharedCollapsePillarMat);
            pillar.position.set(px, py + 0.9, pz);
            this.scene.add(pillar);
            this.collapsePillars.push({ mesh: pillar, pos: new THREE.Vector3(px, py, pz), timer: 10.5 });
          }
          this.screenShake = 0.4;
          this.audio.playSfx('meteor');
        }
      }
    } else {
      // Active phase behavior
      if (this.activeChaos.type === 'FLOOD') {
        this.currentWaterY = THREE.MathUtils.damp(this.currentWaterY, 1.35, 2.0, dt);
        this.waterMesh.position.y = this.currentWaterY;
      } else if (
        this.activeChaos.type === 'METEOR_RAIN' &&
        this.sharedMeteorRingGeo &&
        this.sharedMeteorRingMat &&
        this.sharedMeteorRockGeo &&
        this.sharedMeteorRockMat
      ) {
        this.activeChaos.meteorTick -= dt;
        if (this.activeChaos.meteorTick <= 0) {
          this.activeChaos.meteorTick = 1.45;
          const ox = (Math.random() - 0.5) * 14;
          const oz = (Math.random() - 0.5) * 14;
          const mx = THREE.MathUtils.clamp(this.playerPos.x + ox, -100, 100);
          const mz = THREE.MathUtils.clamp(this.playerPos.z + oz, -100, 100);
          const my = getTerrainHeight(mx, mz);
          const ring = new THREE.Mesh(this.sharedMeteorRingGeo, this.sharedMeteorRingMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(mx, my + 0.12, mz);
          this.scene.add(ring);

          const rock = new THREE.Mesh(this.sharedMeteorRockGeo, this.sharedMeteorRockMat);
          rock.position.set(mx, my + 24, mz);
          this.scene.add(rock);
          this.meteors.push({ ring, rock, pos: new THREE.Vector3(mx, my, mz), timer: 1.35, impacted: false });
        }
      }

      if (this.activeChaos.timer <= 0) {
        this.activeChaos = null;
        this.saveData.chaosEventsSurvived += 1;
        this.showSaveToast('Chaos Event Subsided');
      }
    }
  }

  private updateZoneAtmosphere(dt: number): void {
    // Find nearest zone
    let bestZone = ZONES[0];
    let bestScore = Infinity;
    for (const z of ZONES) {
      const d = Math.hypot(this.playerPos.x - z.center[0], this.playerPos.z - z.center[1]) - z.radius * 0.5;
      if (d < bestScore) {
        bestScore = d;
        bestZone = z;
      }
    }

    if (bestZone.id !== this.currentZone.id) {
      this.currentZone = bestZone;
      if (!this.saveData.worldState.discoveredZones.includes(bestZone.id)) {
        this.saveData.worldState.discoveredZones.push(bestZone.id);
        this.saveData.xp += 35;
        this.saveData.hp = Math.min(this.saveData.maxHp, this.saveData.hp + 10);
        this.saveData.chaosEnergy = Math.min(this.saveData.maxChaosEnergy, this.saveData.chaosEnergy + 15);
        this.checkLevelUp();
        this.audio.playSfx('pickup');
        this.spawnShockRing(this.playerPos, 0xf2cf66, 3.6);
        const zoneMilestoneHints: Partial<Record<ZoneId, string>> = {
          ancient_ruins: 'Align the 3 Totems (Sun, Leaf, Spiral) to awaken Gravity Control.',
          hidden_cave: 'Strike or Shockwave all 3 crystals to awaken Chaos Shield.',
          forgotten_temple: 'Channel Gravity Control to reach the upper Temple Conduit.',
          chaos_zone: 'Engage Chaos Shield before stabilizing the Rift Obelisk.',
          boss_arena: 'Defeat Krakoss to claim the World 1 Jungle Chaos Core!',
          secret_sanctuary: 'Claim the Heart of the Canopy beside the Sacred Tree.',
        };
        this.showDiscoveryBanner(
          bestZone.name,
          zoneMilestoneHints[bestZone.id] ?? `${bestZone.subtitle} (+35 XP)`
        );
        if (bestZone.id === 'ancient_ruins') {
          this.advanceQuestObjective('mq_2_river_ruins', 'discover_ruins', 1);
        } else if (bestZone.id === 'secret_sanctuary') {
          this.advanceQuestObjective('sq_5_sanctuary', 'find_sanctuary', 1);
        }
      }
    }

    // Dynamic multi-stem background audio controller (jungle soundscapes, temple music, combat intensity)
    const boss = this.enemies.find((e) => e.family === 'boss');
    const isBossActive = bestZone.id === 'boss_arena' && Boolean(boss && boss.state !== 'Dead');
    let threatScore = 0;
    for (const e of this.enemies) {
      if (e.state === 'Dead') continue;
      const dist = e.pos.distanceTo(this.playerPos);
      if (dist > 24) continue;
      if (e.state === 'Attack' || e.state === 'Chase' || e.state === 'Stagger') {
        const proximity = Math.max(0, 1 - dist / 24);
        threatScore += (e.state === 'Attack' ? 0.65 : 0.45) + proximity * 0.4;
      } else if (e.state === 'Investigate' && dist < 14) {
        threatScore += 0.2;
      }
    }
    if (this.activeChaos) {
      threatScore = Math.max(threatScore, 0.8);
    }
    if (isBossActive) {
      threatScore = 1;
    }

    const combatIntensity = Math.min(1, threatScore);
    const activeMood = isBossActive
      ? 'boss'
      : this.activeChaos
        ? 'chaos'
        : combatIntensity >= 0.45
          ? 'combat'
          : bestZone.ambientMood;

    this.audio.setZoneAudioContext({
      zoneId: bestZone.id,
      mood: activeMood,
      combatIntensity,
      inChaos: Boolean(this.activeChaos),
      isBoss: isBossActive,
    });

    // Smooth sky, fog & zone cinematic lighting transitions
    const targetFog = this.activeChaos ? '#3a1b3d' : bestZone.fogColor;
    const targetSky = this.activeChaos ? '#632b5e' : bestZone.skyColor;
    _fogColor.set(targetFog);
    _skyColor.set(targetSky);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(_fogColor, dt * 2.5);
      const targetDensity = this.activeChaos
        ? 0.0155
        : bestZone.id === 'hidden_cave'
          ? 0.016
          : bestZone.id === 'boss_arena' || bestZone.id === 'chaos_zone'
            ? 0.0135
            : 0.0105;
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, targetDensity, dt * 2.0);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(_skyColor, dt * 2.5);
    }

    // Zone-calibrated 3-point atmospheric lighting
    let hemiSkyHex = 0x7dd3c8;
    let hemiGroundHex = 0x16291e;
    let sunHex = 0xffe7b3;
    let sunIntensity = 1.55;
    let rimHex = 0x2dd4bf;
    let exposure = 1.08;

    if (this.activeChaos || bestZone.id === 'chaos_zone') {
      hemiSkyHex = 0xa855f7;
      hemiGroundHex = 0x1d1128;
      sunHex = 0xe9d5ff;
      sunIntensity = 1.25;
      rimHex = 0xf43f5e;
      exposure = 1.02;
    } else if (bestZone.id === 'boss_arena') {
      hemiSkyHex = 0xf43f5e;
      hemiGroundHex = 0x180c14;
      sunHex = 0xfecdd3;
      sunIntensity = 1.35;
      rimHex = 0xf59e0b;
      exposure = 1.04;
    } else if (bestZone.id === 'hidden_cave') {
      hemiSkyHex = 0x60a5fa;
      hemiGroundHex = 0x0f172a;
      sunHex = 0xbae6fd;
      sunIntensity = 0.88;
      rimHex = 0xa855f7;
      exposure = 0.96;
    } else if (bestZone.id === 'camp') {
      hemiSkyHex = 0x99f6e4;
      hemiGroundHex = 0x292014;
      sunHex = 0xfde68a;
      sunIntensity = 1.5;
      rimHex = 0xf59e0b;
      exposure = 1.1;
    } else if (bestZone.id === 'forgotten_temple' || bestZone.id === 'ancient_ruins') {
      hemiSkyHex = 0x99f6e4;
      hemiGroundHex = 0x2c2b21;
      sunHex = 0xffe4a0;
      sunIntensity = 1.65;
      rimHex = 0x38bdf8;
      exposure = 1.12;
    } else if (bestZone.id === 'secret_sanctuary') {
      hemiSkyHex = 0x5eead4;
      hemiGroundHex = 0x0f3d2e;
      sunHex = 0xd1fae5;
      sunIntensity = 1.52;
      rimHex = 0xf2cf66;
      exposure = 1.12;
    }

    _hemiSky.setHex(hemiSkyHex);
    _hemiGround.setHex(hemiGroundHex);
    _sunTint.setHex(sunHex);
    this.hemiLight.color.lerp(_hemiSky, dt * 2.2);
    this.hemiLight.groundColor.lerp(_hemiGround, dt * 2.2);
    this.sunLight.color.lerp(_sunTint, dt * 2.2);
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, sunIntensity, dt * 2.2);
    _sunTint.setHex(rimHex);
    this.rimLight.color.lerp(_sunTint, dt * 2.2);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(this.renderer.toneMappingExposure, exposure, dt * 2.0);
  }

  private updateCamera(dt: number): void {
    // Optional lock-on gentle yaw assist
    if (this.lockedEnemyId) {
      const target = this.enemies.find((e) => e.id === this.lockedEnemyId && e.state !== 'Dead');
      if (target) {
        const dx = target.pos.x - this.playerPos.x;
        const dz = target.pos.z - this.playerPos.z;
        const desiredYaw = Math.atan2(-dx, -dz);
        let diff = desiredYaw - this.camYaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.camYaw += diff * Math.min(1, dt * 5);
      } else {
        this.lockedEnemyId = null;
      }
    }

    const dist = this.settings.cameraDistance;
    const lookY = this.playerPos.y + 1.55;
    _camTarget.set(this.playerPos.x, lookY, this.playerPos.z);

    const horizDist = Math.cos(this.camPitch) * dist;
    const camX = this.playerPos.x + Math.sin(this.camYaw) * horizDist;
    const camZ = this.playerPos.z + Math.cos(this.camYaw) * horizDist;
    let camY = lookY + Math.sin(this.camPitch) * dist;

    // Prevent camera from clipping under terrain
    const groundAtCam = getTerrainHeight(camX, camZ) + 1.1;
    if (camY < groundAtCam) camY = groundAtCam;

    _camPos.set(camX, camY, camZ);
    this.camSmoothPos.lerp(_camPos, 1 - Math.exp(-12 * dt));

    const kickDecay = Math.exp(-14 * dt);
    this.camKick.multiplyScalar(kickDecay);

    if (Math.abs(this.camFovKick) > 0.02) {
      this.camFovKick *= Math.exp(-11 * dt);
      const nextFov = this.baseFov + this.camFovKick;
      if (Math.abs(this.camera.fov - nextFov) > 0.04) {
        this.camera.fov = nextFov;
        this.camera.updateProjectionMatrix();
      }
    } else if (this.camera.fov !== this.baseFov) {
      this.camFovKick = 0;
      this.camera.fov = this.baseFov;
      this.camera.updateProjectionMatrix();
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 1.65);
      this.camera.position.set(
        this.camSmoothPos.x + this.camKick.x + (Math.random() - 0.5) * this.screenShake,
        this.camSmoothPos.y + this.camKick.y + (Math.random() - 0.5) * this.screenShake,
        this.camSmoothPos.z + this.camKick.z + (Math.random() - 0.5) * this.screenShake
      );
    } else {
      this.camera.position.set(
        this.camSmoothPos.x + this.camKick.x,
        this.camSmoothPos.y + this.camKick.y,
        this.camSmoothPos.z + this.camKick.z
      );
    }
    this.camera.lookAt(_camTarget);

    // Keep Sun shadow frustum centered near player
    this.sunLight.position.set(this.playerPos.x + 28, this.playerPos.y + 46, this.playerPos.z + 22);
    this.sunLight.target.position.copy(this.playerPos);
    this.sunLight.target.updateMatrixWorld();
  }

  private emitHud(): void {
    const boss = this.enemies.find((e) => e.family === 'boss');
    const bossVisible = Boolean(
      boss && boss.state !== 'Dead' && this.currentZone.id === 'boss_arena'
    );
    const locked = this.lockedEnemyId ? this.enemies.find((e) => e.id === this.lockedEnemyId) : null;

    // Find current active main quest
    const activeMain = QUESTS.find(
      (q) => q.category === 'main' && this.saveData.quests[q.id]?.status === 'active'
    );
    let activeStep: string | null = null;
    if (activeMain) {
      const qp = this.saveData.quests[activeMain.id];
      const nextObj = activeMain.objectives.find(
        (o) => (qp.objectiveCounts[o.id] ?? 0) < o.targetCount
      );
      if (nextObj) {
        activeStep = `${nextObj.description} (${qp.objectiveCounts[nextObj.id] ?? 0}/${nextObj.targetCount})`;
      }
    }

    const chaosLabels: Record<ChaosEventType, string> = {
      GRAVITY_FLIP: 'Gravity Anomaly',
      COLLAPSE: 'Tectonic Collapse',
      FLOOD: 'Rising Floodwaters',
      METEOR_RAIN: 'Chaos Meteor Rain',
    };

    this.callbacks.onHudUpdate({
      screen: this.screenMode,
      hp: Math.round(this.saveData.hp),
      maxHp: this.saveData.maxHp,
      chaosEnergy: Math.round(this.saveData.chaosEnergy),
      maxChaosEnergy: this.saveData.maxChaosEnergy,
      xp: this.saveData.xp,
      level: this.saveData.level,
      currentZone: this.currentZone,
      activePrompt: this.findNearestPrompt(),
      abilityCooldowns: { ...this.abilityCooldowns },
      abilityMaxCooldowns: {
        shockwave: ABILITY_META.shockwave.cooldown,
        gravity_control: ABILITY_META.gravity_control.cooldown,
        chaos_shield: ABILITY_META.chaos_shield.cooldown,
      },
      unlockedAbilities: [...this.saveData.worldState.unlockedAbilities],
      chaosShieldActive: this.chaosShieldTimer > 0,
      gravityControlActive: this.gravityControlTimer > 0,
      activeChaosEvent: this.activeChaos
        ? {
            type: this.activeChaos.type,
            phase: this.activeChaos.phase,
            remainingSeconds: Math.ceil(this.activeChaos.timer),
            label: chaosLabels[this.activeChaos.type],
          }
        : null,
      bossHud: {
        visible: bossVisible,
        name: boss?.name ?? 'Krakoss',
        hp: boss?.hp ?? 0,
        maxHp: boss?.maxHp ?? 420,
        phase: boss?.bossPhase ?? 1,
      },
      lockedTargetName: locked ? `${locked.name} (${locked.hp}/${locked.maxHp})` : null,
      playerPos: [this.playerPos.x, this.playerPos.y, this.playerPos.z],
      playerYaw: this.playerYaw,
      saveToast: this.saveToast,
      discoveryBanner: this.discoveryBanner,
      activeMainQuestTitle: activeMain?.title ?? null,
      activeMainQuestStep: activeStep,
      perfStats: this.settings.showPerfOverlay ? this.perfMonitor.update(this.renderer) : undefined,
    });
  }

  // --- Window & Input Binding ---

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (e.code === 'F3') {
      e.preventDefault();
      this.settings.showPerfOverlay = !this.settings.showPerfOverlay;
      this.callbacks.onSettingsChange?.(this.settings);
      this.showSaveToast(
        this.settings.showPerfOverlay
          ? 'Stats Performance (F3) : Activées'
          : 'Stats Performance (F3) : Désactivées'
      );
      this.emitHud();
      return;
    }

    if (this.screenMode !== 'playing') return;

    if (e.code === 'Space') {
      e.preventDefault();
      this.triggerJump();
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.triggerDodge();
    } else if (e.code === 'KeyJ') {
      this.triggerAttack(false);
    } else if (e.code === 'KeyK' || e.code === 'KeyQ') {
      this.triggerAttack(true);
    } else if (e.code === 'KeyE') {
      this.triggerInteract();
    } else if (e.code === 'Digit1') {
      this.triggerAbility('shockwave');
    } else if (e.code === 'Digit2') {
      this.triggerAbility('gravity_control');
    } else if (e.code === 'Digit3') {
      this.triggerAbility('chaos_shield');
    } else if (e.code === 'Tab') {
      e.preventDefault();
      this.toggleLockOn();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onPointerDown = (e: PointerEvent) => {
    if (this.screenMode !== 'playing') return;
    this.audio.unlock();
    if (e.button === 2) {
      this.triggerDodge();
      this.callbacks.onCombatAction?.();
      return;
    }
    if (e.button === 0) {
      this.canvasPointerActive = true;
      this.isPointerOrbiting = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
      this.pointerDragDist = 0;
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isPointerOrbiting || this.screenMode !== 'playing') return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.pointerDragDist = Math.max(
      this.pointerDragDist,
      Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y)
    );
    this.addCameraDelta(dx, dy);
  };

  private onPointerUp = (e: PointerEvent) => {
    if (
      this.canvasPointerActive &&
      e.button === 0 &&
      this.screenMode === 'playing' &&
      this.pointerDragDist < 6
    ) {
      this.triggerAttack(false);
      this.callbacks.onCombatAction?.();
    }
    this.isPointerOrbiting = false;
    this.canvasPointerActive = false;
  };

  private onContextMenu = (e: MouseEvent) => e.preventDefault();

  private onResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onWebGLContextLost = (e: Event) => {
    e.preventDefault();
    this.contextLost = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.audio.setPaused(true);
    this.callbacks.onWebGLContextChange?.(true);
  };

  private onWebGLContextRestored = () => {
    if (this.disposed) return;
    this.contextLost = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.applyGraphicsQuality();

    if (this.scene.environment) {
      this.scene.environment.dispose();
    }
    this.scene.environment = this.createJungleEnvironmentTexture();

    for (const tex of this.disposableTextures) {
      tex.needsUpdate = true;
    }
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
    this.lastTime = performance.now();
    this.audio.setPaused(this.screenMode === 'paused');
    this.callbacks.onWebGLContextChange?.(false);
    this.startLoop();
  };

  private onVisibilityChange = () => {
    if (this.disposed) return;
    this.audio.setBackgroundSuspended(document.hidden);
    if (!document.hidden) {
      this.lastTime = performance.now();
    }
  };

  private bindWindowEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('contextmenu', this.onContextMenu);
    dom.addEventListener('webglcontextlost', this.onWebGLContextLost);
    dom.addEventListener('webglcontextrestored', this.onWebGLContextRestored);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('contextmenu', this.onContextMenu);
    dom.removeEventListener('webglcontextlost', this.onWebGLContextLost);
    dom.removeEventListener('webglcontextrestored', this.onWebGLContextRestored);

    this.audio.dispose();
    this.assetManager.dispose();
    this.clearTransientVfxAndHazards();

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        geometries.add(obj.geometry);
        if (Array.isArray(obj.material)) {
          for (const m of obj.material) materials.add(m);
        } else if (obj.material) {
          materials.add(obj.material);
        }
      }
    });

    for (const g of [
      this.sharedMeteorRingGeo,
      this.sharedMeteorRockGeo,
      this.sharedCollapsePillarGeo,
      this.sharedProjectileGeo,
    ]) {
      if (g) geometries.add(g);
    }
    for (const m of [
      this.sharedMeteorRingMat,
      this.sharedMeteorRockMat,
      this.sharedCollapsePillarMat,
      this.sharedEnemyProjMat,
      this.sharedPlayerProjMat,
    ]) {
      if (m) materials.add(m);
    }

    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    for (const m of this.disposableMaterials) {
      m.dispose();
    }
    this.disposableMaterials = [];

    for (const tex of this.disposableTextures) {
      tex.dispose();
    }
    this.disposableTextures = [];

    if (this.sunLight?.shadow?.map) {
      this.sunLight.shadow.map.dispose();
      this.sunLight.shadow.map = null;
    }

    if (this.scene.environment) {
      this.scene.environment.dispose();
      this.scene.environment = null;
    }

    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
  }

  public getAssetSlots() {
    return this.assetManager.getAssetSlots();
  }

  public captureArtBibleSnapshot(
    position: [number, number, number],
    lookAt: [number, number, number]
  ): string | null {
    if (this.disposed || !this.renderer || !this.scene) return null;
    try {
      const prevCamPos = this.camera.position.clone();
      const prevCamQuat = this.camera.quaternion.clone();

      this.camera.position.set(position[0], position[1], position[2]);
      this.camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
      this.camera.updateMatrixWorld();

      this.renderer.render(this.scene, this.camera);
      const dataUrl = this.renderer.domElement.toDataURL('image/jpeg', 0.88);

      this.camera.position.copy(prevCamPos);
      this.camera.quaternion.copy(prevCamQuat);
      this.camera.updateMatrixWorld();
      return dataUrl;
    } catch {
      return null;
    }
  }
}
