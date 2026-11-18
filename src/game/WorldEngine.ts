import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AudioManager } from './audio';
import {
  buildCampGroup,
  buildEnemyModel,
  buildExplorerModel,
  buildForgottenTemple,
  buildNpcModel,
  EnemyRig,
  ExplorerRig,
} from './models';
import { createNewSaveData, saveGame } from './saveSystem';
import {
  createBarkTexture,
  createContactShadowTexture,
  createGrassTexture,
  createStoneTexture,
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
  QuestProgress,
  SaveDataV1,
  ZoneDef,
  ZoneId,
} from './types';
import { ABILITY_META, INTERACTABLES, ITEMS, NPCS, PUZZLES, QUESTS, WORLD_HALF_SIZE, ZONES } from './worldData';

// Module-scope reusable scratch math objects (zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _color = new THREE.Color();
const _fogColor = new THREE.Color();
const _skyColor = new THREE.Color();

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
  private isSoftwareGl = false;

  private frameId = 0;
  private disposed = false;
  private lastTime = performance.now();
  private hudEmitAccum = 0;

  // World visual elements
  private waterMesh!: THREE.Mesh;
  private baseWaterY = -0.35;
  private currentWaterY = -0.35;
  private bridgeMesh!: THREE.Mesh;
  private bossGateMesh!: THREE.Mesh;
  private sanctuaryBarrierMesh!: THREE.Mesh;
  private campFlame!: THREE.Object3D | null;
  private floatingStones: THREE.Object3D[] = [];
  private fireflies: THREE.Points | null = null;
  private shadowTex!: THREE.Texture;

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
  private invulnTimer = 0;

  // Camera state
  private camYaw = Math.PI;
  private camPitch = 0.36;
  private camSmoothPos = new THREE.Vector3(0, 6, 92);
  private screenShake = 0;

  // Gameplay & Save State
  private saveData: SaveDataV1;
  private settings: GameSettings;
  private screenMode: 'menu' | 'playing' | 'paused' | 'victory' | 'defeat' = 'menu';

  // Input state
  private keys: Record<string, boolean> = {};
  private touchMove = { x: 0, y: 0 };
  private isPointerOrbiting = false;
  private lastPointer = { x: 0, y: 0 };

  // Dynamic Entities
  private npcs: Array<{ def: NpcDef; mesh: THREE.Group }> = [];
  private interactables: InteractableRuntime[] = [];
  private enemies: EnemyEntity[] = [];
  private projectiles: Projectile[] = [];
  private shockRings: ShockRingVfx[] = [];
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
  private saveToast: string | null = null;
  private saveToastTimer = 0;
  private discoveryBanner: { title: string; subtitle: string } | null = null;
  private discoveryTimer = 0;
  private currentZone: ZoneDef = ZONES[0];

  constructor(container: HTMLElement, settings: GameSettings, callbacks: EngineCallbacks) {
    this.container = container;
    this.settings = settings;
    this.callbacks = callbacks;
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

    // Studio/World Environment map (mandatory for PBR metallic/crystal highlights)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Warm golden key light + turquoise/moss hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x7dd3c8, 0x16291e, 0.78);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffe7b3, 1.55);
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

    // Subtle cool turquoise rim light for crisp semi-realistic silhouettes
    const rimLight = new THREE.DirectionalLight(0x2dd4bf, 0.42);
    rimLight.position.set(-40, 24, -50);
    this.scene.add(rimLight);
  }

  private applyGraphicsQuality(): void {
    if (!this.renderer) return;
    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      return;
    }
    const q = this.settings.graphicsQuality;
    const maxDpr = q === 'HIGH' ? 2 : q === 'MEDIUM' ? 1.5 : 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.shadowMap.enabled = q !== 'LOW';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  private buildWorld(): void {
    const maxAniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const grassTex = createGrassTexture(maxAniso);
    const stoneTex = createStoneTexture(maxAniso);
    const barkTex = createBarkTexture(maxAniso);
    const waterTex = createWaterTexture(maxAniso);
    this.shadowTex = createContactShadowTexture();

    // 1. Sculpted 240x240 continuous Terrain Mesh with vertex color tinting per biome
    const geo = new THREE.PlaneGeometry(240, 240, 120, 120);
    geo.rotateX(-Math.PI / 2);
    const posAttr = geo.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      // Biome vertex tint
      if (Math.hypot(vx - 44, vz + 46) < 22 || Math.hypot(vx, vz + 82) < 23) {
        _color.set('#58446b'); // Chaos & Boss arena slate-violet
      } else if (Math.hypot(vx + 30, vz + 24) < 20 || (Math.abs(vx) < 12 && Math.abs(vz + 34) < 12)) {
        _color.set('#7a7866'); // Ancient ruins / temple sandstone moss
      } else if (vy < -0.5) {
        _color.set('#3d5e4c'); // Riverbed
      } else {
        _color.set('#7eb87a'); // Lush tropical grass
      }
      colors[i * 3] = _color.r;
      colors[i * 3 + 1] = _color.g;
      colors[i * 3 + 2] = _color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02,
    });
    const terrain = new THREE.Mesh(geo, terrainMat);
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    // 2. River & Waterfall Water Plane
    const waterGeo = new THREE.PlaneGeometry(220, 220, 1, 1);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshPhysicalMaterial({
      map: waterTex,
      color: 0x2dd4bf,
      roughness: 0.16,
      metalness: 0.1,
      transparent: true,
      opacity: 0.78,
      clearcoat: 0.9,
    });
    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = this.baseWaterY;
    this.scene.add(this.waterMesh);

    // Waterfall cascade mesh at cave entrance (east bank)
    const waterfallMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 11),
      new THREE.MeshStandardMaterial({
        map: waterTex,
        color: 0x67e8f9,
        emissive: 0x0891b2,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      })
    );
    waterfallMesh.position.set(47, 4.5, -8);
    waterfallMesh.rotation.y = -Math.PI / 2;
    this.scene.add(waterfallMesh);

    // 3. Instanced Jungle Trees, Ferns & Rocks (fast GPU instancing)
    this.buildInstancedJungle(barkTex, stoneTex);

    // 3b. Swamp Lily Pads & Atmospheric Jungle Fireflies (01 — The Lost Jungle)
    const padGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.06, 10);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.72 });
    const padInst = new THREE.InstancedMesh(padGeo, padMat, 36);
    const padDummy = new THREE.Object3D();
    for (let i = 0; i < 36; i++) {
      const pz = -18 + i * 2.1;
      const px = 27 + Math.sin(pz * 0.06) * 5.5 + Math.cos(i * 1.9) * 3.4;
      const s = 0.65 + (i % 4) * 0.22;
      padDummy.position.set(px, this.baseWaterY + 0.04, pz);
      padDummy.rotation.y = i * 0.8;
      padDummy.scale.set(s, 1, s);
      padDummy.updateMatrix();
      padInst.setMatrixAt(i, padDummy.matrix);
    }
    padInst.instanceMatrix.needsUpdate = true;
    padInst.computeBoundingSphere();
    this.scene.add(padInst);

    const ffCount = 260;
    const ffPos = new Float32Array(ffCount * 3);
    const ffCol = new Float32Array(ffCount * 3);
    for (let i = 0; i < ffCount; i++) {
      const fx = (Math.random() - 0.5) * 180;
      const fz = (Math.random() - 0.5) * 180;
      ffPos[i * 3] = fx;
      ffPos[i * 3 + 1] = getTerrainHeight(fx, fz) + 0.8 + Math.random() * 4.5;
      ffPos[i * 3 + 2] = fz;
      _color.set(i % 3 === 0 ? '#14b8a6' : '#f2cf66');
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
      depthWrite: false,
    });
    this.fireflies = new THREE.Points(ffGeo, ffMat);
    this.scene.add(this.fireflies);

    // 4. Key Landmarks
    // Arrival Crashed Sky-Skiff
    const skiff = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.1, 6.2),
      new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65, metalness: 0.2 })
    );
    hull.rotation.set(0.18, 0.4, -0.22);
    hull.castShadow = true;
    skiff.add(hull);
    const sail = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 3.8, 4),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85 })
    );
    sail.position.set(0.6, 1.5, -0.5);
    sail.rotation.z = -0.55;
    skiff.add(sail);
    skiff.position.set(-5, getTerrainHeight(-5, 84) + 0.4, 84);
    this.scene.add(skiff);

    // Camp Outpost
    const campGroup = buildCampGroup(barkTex);
    campGroup.position.set(0, getTerrainHeight(0, 44), 44);
    this.campFlame = campGroup.getObjectByName('camp_flame') ?? null;
    this.scene.add(campGroup);

    // River Drawbridge (raised until pulled!)
    const bridgeGeo = new THREE.BoxGeometry(10, 0.45, 4.2);
    const bridgeMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.85 });
    this.bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    this.bridgeMesh.position.set(27, 0.25, 14);
    this.bridgeMesh.rotation.z = 0.85; // Raised initially
    this.bridgeMesh.castShadow = true;
    this.bridgeMesh.receiveShadow = true;
    this.scene.add(this.bridgeMesh);

    // Ancient Ruins Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.88 });
    for (const [px, pz, h] of [
      [-38, -16, 4.5],
      [-22, -16, 5.2],
      [-38, -32, 3.8],
      [-22, -32, 5.8],
      [-30, -14, 2.2],
    ]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, h, 8), pillarMat);
      p.position.set(px, getTerrainHeight(px, pz) + h * 0.5, pz);
      p.castShadow = true;
      p.receiveShadow = true;
      this.scene.add(p);
    }

    // Hidden Cave Rock Arch
    const caveMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.92 });
    const archLeft = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), caveMat);
    archLeft.position.set(53, 2.8, -15);
    this.scene.add(archLeft);
    const archRight = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), caveMat);
    archRight.position.set(53, 2.8, -1);
    this.scene.add(archRight);
    const archTop = new THREE.Mesh(new THREE.BoxGeometry(16, 3.5, 20), caveMat);
    archTop.position.set(64, 7.4, -8);
    this.scene.add(archTop);

    // Forgotten Temple Stepped Pyramid
    const templeGroup = buildForgottenTemple(stoneTex);
    templeGroup.position.set(0, 0, -34);
    this.scene.add(templeGroup);

    // Floating Gravity Stones (Temple & Chaos Zone)
    const floatMat = new THREE.MeshStandardMaterial({
      color: 0x6b21a8,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.45,
      roughness: 0.5,
    });
    for (const [fx, fy, fz] of [
      [-8, 4.2, -36],
      [8, 5.1, -36],
      [38, 4.2, -44],
      [50, 5.4, -52],
      [44, 6.2, -39],
    ]) {
      const fs = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), floatMat);
      fs.position.set(fx, fy, fz);
      fs.userData.baseY = fy;
      this.scene.add(fs);
      this.floatingStones.push(fs);
    }

    // Boss Arena Colosseum Ring & Seal Gate
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      if (Math.abs(Math.sin(a) - 1) < 0.25) continue; // Leave south entrance gap
      const bx = Math.cos(a) * 20;
      const bz = -82 + Math.sin(a) * 20;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 6.5, 8), pillarMat);
      col.position.set(bx, getTerrainHeight(bx, bz) + 3.25, bz);
      col.castShadow = true;
      this.scene.add(col);
    }

    this.bossGateMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 5.2, 0.9),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.65,
      })
    );
    this.bossGateMesh.position.set(0, 2.6, -59);
    this.scene.add(this.bossGateMesh);

    // Sanctuary Crystal Bramble Barrier
    this.sanctuaryBarrierMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4.5, 1.4),
      new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x0891b2,
        emissiveIntensity: 0.85,
        transparent: true,
        opacity: 0.72,
      })
    );
    this.sanctuaryBarrierMesh.position.set(-50, getTerrainHeight(-50, -44) + 2.2, -44);
    this.sanctuaryBarrierMesh.rotation.y = Math.PI / 4;
    this.scene.add(this.sanctuaryBarrierMesh);

    // 5. Build Protagonist Explorer
    this.explorer = buildExplorerModel(this.shadowTex);
    this.explorer.root.position.copy(this.playerPos);
    this.scene.add(this.explorer.root);

    // 6. Build 5 NPCs
    for (const npc of NPCS) {
      const mesh = buildNpcModel(npc.cloakColor, npc.accentColor, this.shadowTex);
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

  private buildInstancedJungle(barkTex: THREE.Texture, stoneTex: THREE.Texture): void {
    const treePositions: Array<[number, number, number]> = [];
    // Deterministic seeded-like pattern avoiding pathways/centers
    for (let i = 0; i < 160; i++) {
      const angle = i * 2.39996;
      const dist = 16 + ((i * 37) % 94);
      const tx = Math.cos(angle) * dist;
      const tz = Math.sin(angle) * dist;

      // Skip clearings
      const nearZoneCenter = ZONES.some((z) => Math.hypot(tx - z.center[0], tz - z.center[1]) < 12);
      const inRiver = Math.abs(tx - (27 + Math.sin(tz * 0.06) * 5.5)) < 8 && tz > -26 && tz < 58;
      if (nearZoneCenter || inRiver) continue;

      const scale = 0.85 + ((i * 13) % 30) / 100; // ±15%
      treePositions.push([tx, tz, scale]);
    }

    const trunkGeo = new THREE.CylinderGeometry(0.32, 0.55, 5.2, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.92 });
    const trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;

    const canopyGeo = new THREE.DodecahedronGeometry(2.4, 1);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const canopyInst = new THREE.InstancedMesh(canopyGeo, canopyMat, treePositions.length);
    canopyInst.castShadow = true;

    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const leafPalette = [0x1f6e38, 0x2a8543, 0x185732, 0x3b8c42];

    treePositions.forEach(([tx, tz, s], idx) => {
      const ty = getTerrainHeight(tx, tz);
      dummy.position.set(tx, ty + 2.5 * s, tz);
      dummy.rotation.set(0, idx * 0.7, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(tx, ty + 5.3 * s, tz);
      dummy.scale.set(s * 1.15, s * 0.82, s * 1.15);
      dummy.updateMatrix();
      canopyInst.setMatrixAt(idx, dummy.matrix);

      tint.setHex(leafPalette[idx % leafPalette.length]);
      canopyInst.setColorAt(idx, tint);
    });

    trunkInst.instanceMatrix.needsUpdate = true;
    canopyInst.instanceMatrix.needsUpdate = true;
    if (canopyInst.instanceColor) canopyInst.instanceColor.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    canopyInst.computeBoundingSphere();
    this.scene.add(trunkInst);
    this.scene.add(canopyInst);

    // Instanced Rocks
    const rockCount = 70;
    const rockGeo = new THREE.DodecahedronGeometry(1.1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.92 });
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockInst.castShadow = true;
    rockInst.receiveShadow = true;

    for (let i = 0; i < rockCount; i++) {
      const a = i * 1.73;
      const r = 14 + ((i * 53) % 92);
      const rx = Math.cos(a) * r;
      const rz = Math.sin(a) * r;
      const ry = getTerrainHeight(rx, rz);
      const s = 0.7 + ((i * 19) % 60) / 100;
      dummy.position.set(rx, ry + 0.35 * s, rz);
      dummy.rotation.set(i * 0.4, i * 0.9, 0);
      dummy.scale.set(s * 1.2, s * 0.85, s);
      dummy.updateMatrix();
      rockInst.setMatrixAt(i, dummy.matrix);
    }
    rockInst.instanceMatrix.needsUpdate = true;
    rockInst.computeBoundingSphere();
    this.scene.add(rockInst);
  }

  private buildInteractables(stoneTex: THREE.Texture): void {
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.85 });
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.85 });

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
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 0.8), goldMat);
        box.position.y = 0.38;
        box.castShadow = true;
        g.add(box);
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
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.3, 1.1, 8), stoneMat);
        plinth.position.y = 0.55;
        g.add(plinth);
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
        const altar = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.5, 1.4, 8), stoneMat);
        altar.position.y = 0.7;
        g.add(altar);
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
        rig,
      });
    }
  }

  // --- Public Game Lifecycle & Controls ---

  public startNewGame(): void {
    this.audio.unlock();
    this.applySaveData(createNewSaveData());
    this.screenMode = 'playing';
    this.showDiscoveryBanner('The Lost Jungle', 'Explore. Discover. Fight. Transform.');
    this.emitHud();
  }

  public loadFromSave(data: SaveDataV1): void {
    this.audio.unlock();
    this.applySaveData(data);
    this.screenMode = 'playing';
    this.showSaveToast('Progress Restored');
    this.emitHud();
  }

  public applySaveData(data: SaveDataV1): void {
    this.saveData = data;
    this.playerPos.set(data.playerPosition[0], data.playerPosition[1], data.playerPosition[2]);
    this.playerVel.set(0, 0, 0);
    this.playerYaw = data.playerYaw;
    this.camYaw = data.playerYaw;

    // Restore world state visuals
    this.bridgeMesh.rotation.z = data.worldState.bridgeLowered ? 0 : 0.85;
    this.bossGateMesh.visible = !data.worldState.bossGateOpen;
    this.sanctuaryBarrierMesh.visible = !data.worldState.sanctuaryBarrierBroken;

    for (const item of this.interactables) {
      const done = data.worldState.activatedInteractables.includes(item.def.id);
      if (done && !item.def.repeatable) {
        item.active = false;
        item.group.visible = false;
      } else {
        item.active = true;
        item.group.visible = true;
      }
      if (item.def.type === 'chaos_core_pedestal') {
        item.group.visible = data.worldState.bossDefeated && !data.worldState.chaosCoreObtained;
        item.active = item.group.visible;
      }
    }

    for (const e of this.enemies) {
      const dead = data.worldState.defeatedEnemies.includes(e.id) || (e.family === 'boss' && data.worldState.bossDefeated);
      if (dead) {
        e.hp = 0;
        e.state = 'Dead';
        e.rig.root.visible = false;
      } else {
        e.hp = e.maxHp;
        e.state = 'Idle';
        e.pos.copy(e.spawnPos);
        e.rig.root.position.copy(e.pos);
        e.rig.root.visible = true;
      }
    }
  }

  public setScreenMode(mode: 'menu' | 'playing' | 'paused' | 'victory' | 'defeat'): void {
    this.screenMode = mode;
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
    this.screenMode = 'playing';
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
    this.dodgeTimer = 0.34;
    this.dodgeCooldown = 0.9;
    this.invulnTimer = 0.42;
    this.audio.playSfx('dodge');
  }

  public triggerAttack(heavy: boolean): void {
    if (this.screenMode !== 'playing' || this.attackTimer > 0.08) return;
    this.attackTimer = heavy ? 0.52 : 0.3;
    this.comboStep = heavy ? 3 : (this.comboStep + 1) % 3;
    this.attackHitDone = false;
    this.audio.playSfx(heavy ? 'heavy' : 'attack');
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
      this.screenShake = 0.35;

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
      this.spawnShockRing(this.playerPos, 0xa855f7, 6.0);
    } else if (id === 'chaos_shield') {
      this.audio.playSfx('shield');
      this.chaosShieldTimer = 6.0;
      this.spawnShockRing(this.playerPos, 0x10b981, 4.5);
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
      const idx = def.puzzleIndex ?? 0;
      this.symbolRotations[idx] = (this.symbolRotations[idx] + 1) % 3;
      runtime.group.rotation.y = this.symbolRotations[idx] * ((Math.PI * 2) / 3);
      this.audio.playSfx('step');
      const labels = ['Sun', 'Leaf', 'Spiral'];
      this.showSaveToast(`Totem ${idx + 1}: ${labels[this.symbolRotations[idx]]}`);
      if (
        this.symbolRotations[0] === 0 &&
        this.symbolRotations[1] === 1 &&
        this.symbolRotations[2] === 2 &&
        !this.saveData.worldState.solvedPuzzles.includes('puzzle_symbols')
      ) {
        this.markPuzzleSolved('puzzle_symbols', 'Triad Aligned! Gravity Shrine awakened.');
      }
    } else if (def.type === 'sequence_switch') {
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
    const needed = this.saveData.level * 120;
    if (this.saveData.xp >= needed) {
      this.saveData.xp -= needed;
      this.saveData.level += 1;
      this.saveData.maxHp += 15;
      this.saveData.hp = this.saveData.maxHp;
      this.saveData.maxChaosEnergy += 10;
      this.saveData.chaosEnergy = this.saveData.maxChaosEnergy;
      this.showSaveToast(`Level Up! Level ${this.saveData.level}`);
    }
  }

  private spawnShockRing(origin: THREE.Vector3, color: number, maxScale: number): void {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 1.0, 32),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(origin.x, origin.y + 0.35, origin.z);
    this.scene.add(ring);
    this.shockRings.push({ mesh: ring, age: 0, maxAge: 0.48, maxScale });
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
    const tick = () => {
      if (this.disposed) return;
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

  private update(dt: number): void {
    this.animTime += dt;

    // Animate camp flame, floating stones, NPC & interactable beacons
    if (this.campFlame) {
      this.campFlame.scale.y = 0.85 + Math.sin(this.animTime * 12) * 0.2;
    }
    for (let i = 0; i < this.floatingStones.length; i++) {
      const s = this.floatingStones[i];
      const lift = this.gravityControlTimer > 0 || this.activeChaos?.type === 'GRAVITY_FLIP' ? 1.8 : 0;
      s.position.y = (s.userData.baseY as number) + lift + Math.sin(this.animTime * 1.8 + i) * 0.45;
      s.rotation.y += dt * 0.7;
    }
    for (const item of this.interactables) {
      if (item.active) {
        item.indicator.rotation.y += dt * 1.8;
        item.indicator.position.y = 2.0 + Math.sin(this.animTime * 3 + item.def.position[0]) * 0.16;
      }
    }
    for (const npc of this.npcs) {
      const beacon = npc.mesh.getObjectByName('npc_beacon');
      if (beacon) {
        beacon.rotation.y += dt * 1.5;
        beacon.position.y = 2.15 + Math.sin(this.animTime * 2.5) * 0.12;
      }
    }
    if (this.fireflies) {
      this.fireflies.position.y = Math.sin(this.animTime * 1.1) * 0.28;
    }

    // Menu vista gentle orbit
    if (this.screenMode === 'menu') {
      this.audio.setMood('menu');
      const angle = this.animTime * 0.14;
      this.camera.position.set(Math.sin(angle) * 24, 11, 44 + Math.cos(angle) * 24);
      this.camera.lookAt(0, 2, 44);
      return;
    }

    if (this.screenMode !== 'playing') {
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
    if (this.dodgeTimer > 0) this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
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

    // Proposed next position
    const nextX = THREE.MathUtils.clamp(this.playerPos.x + this.playerVel.x * dt, -WORLD_HALF_SIZE, WORLD_HALF_SIZE);
    const nextZ = THREE.MathUtils.clamp(this.playerPos.z + this.playerVel.z * dt, -WORLD_HALF_SIZE, WORLD_HALF_SIZE);

    // Barrier collisions: Boss Gate, Sanctuary Barrier, Raised River Drawbridge gap
    let blocked = false;
    if (!this.saveData.worldState.bossGateOpen && Math.abs(nextX) < 5 && Math.abs(nextZ + 59) < 1.2) {
      blocked = true;
    }
    if (!this.saveData.worldState.sanctuaryBarrierBroken && Math.hypot(nextX + 50, nextZ + 44) < 3.6) {
      blocked = true;
    }
    if (!blocked) {
      this.playerPos.x = nextX;
      this.playerPos.z = nextZ;
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
        const hitRange = isHeavy ? 4.2 : 3.4;
        const dmg = isHeavy ? 46 : 24;
        for (const e of this.enemies) {
          if (e.state === 'Dead') continue;
          if (e.pos.distanceTo(this.playerPos) <= hitRange) {
            this.damageEnemy(e, dmg, isHeavy);
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

    // Articulated Explorer Animations
    this.explorer.root.position.copy(this.playerPos);
    this.explorer.root.rotation.y = this.playerYaw;
    this.explorer.shieldDome.visible = this.chaosShieldTimer > 0;
    this.explorer.shieldDome.rotation.y += dt * 1.4;
    this.explorer.gravityAura.visible = this.gravityControlTimer > 0;
    this.explorer.gravityAura.rotation.z += dt * 3.0;

    const horizSpeed = Math.hypot(this.playerVel.x, this.playerVel.z);
    if (horizSpeed > 0.6 && this.onGround) {
      const cycle = this.animTime * 11;
      this.explorer.leftLeg.rotation.x = Math.sin(cycle) * 0.65;
      this.explorer.rightLeg.rotation.x = -Math.sin(cycle) * 0.65;
      this.explorer.leftArm.rotation.x = -Math.sin(cycle) * 0.45;
      this.explorer.body.position.y = 0.85 + Math.abs(Math.sin(cycle)) * 0.06;
      this.footstepAccum += dt;
      if (this.footstepAccum > 0.34) {
        this.footstepAccum = 0;
        this.audio.playSfx('step');
      }
    } else {
      this.explorer.leftLeg.rotation.x = THREE.MathUtils.damp(this.explorer.leftLeg.rotation.x, 0, 12, dt);
      this.explorer.rightLeg.rotation.x = THREE.MathUtils.damp(this.explorer.rightLeg.rotation.x, 0, 12, dt);
      this.explorer.leftArm.rotation.x = THREE.MathUtils.damp(this.explorer.leftArm.rotation.x, 0, 12, dt);
      this.explorer.body.position.y = 0.85 + Math.sin(this.animTime * 2.4) * 0.025;
    }

    if (this.attackTimer > 0) {
      this.explorer.rightArm.rotation.x = -1.6 + Math.sin(this.attackTimer * 18) * 1.1;
      this.explorer.blade.scale.z = 1.35;
    } else {
      this.explorer.rightArm.rotation.x = THREE.MathUtils.damp(
        this.explorer.rightArm.rotation.x,
        horizSpeed > 0.6 ? Math.sin(this.animTime * 11) * 0.45 : 0,
        14,
        dt
      );
      this.explorer.blade.scale.z = 1.0;
    }

    this.explorer.scarf.rotation.x = 0.25 + Math.min(0.65, horizSpeed * 0.06) + Math.sin(this.animTime * 7) * 0.08;
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
        if (e.staggerTimer <= 0) e.state = 'Chase';
      } else if (e.state === 'Attack') {
        e.stateTimer += dt;
        e.rig.telegraphRing.visible = true;
        const pulse = 0.8 + Math.sin(e.stateTimer * 18) * 0.25;
        e.rig.telegraphRing.scale.setScalar(pulse);

        if (e.stateTimer >= e.telegraphDuration) {
          e.rig.telegraphRing.visible = false;
          if (e.family === 'spitter') {
            _v1.subVectors(this.playerPos, e.pos).add(new THREE.Vector3(0, 0.8, 0)).sub(new THREE.Vector3(0, 1.4, 0)).normalize();
            this.spawnProjectile(
              new THREE.Vector3(e.pos.x, e.pos.y + 1.4, e.pos.z),
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
              this.screenShake = 0.3;
            }
          }
          e.attackCooldown = e.family === 'boss' ? (e.bossPhase === 3 ? 1.3 : 1.9) : 1.7;
          e.state = 'Chase';
          e.stateTimer = 0;
        }
      } else {
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
      e.rig.coreMesh.rotation.y += dt * 2.5;
    }
  }

  private damageEnemy(e: EnemyEntity, amount: number, stagger: boolean): void {
    const mult = e.family === 'boss' && e.state === 'Stagger' ? 1.5 : 1.0;
    e.hp = Math.max(0, e.hp - Math.round(amount * mult));
    this.audio.playSfx('hit');

    if (stagger && e.state !== 'Dead') {
      e.state = 'Stagger';
      e.staggerTimer = e.family === 'boss' ? 1.1 : 0.9;
      e.rig.telegraphRing.visible = false;
    }

    if (e.hp <= 0) {
      e.state = 'Dead';
      e.rig.root.visible = false;
      e.rig.telegraphRing.visible = false;
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
      return;
    }
    this.saveData.hp = Math.max(0, this.saveData.hp - amount);
    this.invulnTimer = 0.45;
    this.screenShake = 0.25;
    this.audio.playSfx('hit');

    if (this.saveData.hp <= 0) {
      this.audio.setMood('defeat');
      this.screenMode = 'defeat';
      this.emitHud();
    }
  }

  private spawnProjectile(pos: THREE.Vector3, vel: THREE.Vector3, damage: number, fromEnemy: boolean): void {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshStandardMaterial({
        color: fromEnemy ? 0xa3e635 : 0x38bdf8,
        emissive: fromEnemy ? 0x65a30d : 0x0284c7,
        emissiveIntensity: 1.4,
      })
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

      let remove = p.life <= 0 || p.pos.y < getTerrainHeight(p.pos.x, p.pos.z);
      if (p.fromEnemy && p.pos.distanceTo(this.playerPos.clone().add(new THREE.Vector3(0, 1, 0))) < 1.1) {
        this.damagePlayer(p.damage);
        remove = true;
      }
      if (remove) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
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
  }

  private updateChaosEngine(dt: number): void {
    // Clean up collapse pillars after duration
    for (let i = this.collapsePillars.length - 1; i >= 0; i--) {
      const cp = this.collapsePillars[i];
      cp.timer -= dt;
      if (cp.timer <= 0) {
        this.scene.remove(cp.mesh);
        cp.mesh.geometry.dispose();
        (cp.mesh.material as THREE.Material).dispose();
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
        m.ring.geometry.dispose();
        m.rock.geometry.dispose();
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

        if (this.activeChaos.type === 'COLLAPSE') {
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + 0.4;
            const px = this.playerPos.x + Math.cos(a) * 6.5;
            const pz = this.playerPos.z + Math.sin(a) * 6.5;
            const py = getTerrainHeight(px, pz);
            const pillar = new THREE.Mesh(
              new THREE.DodecahedronGeometry(1.4, 0),
              new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 })
            );
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
      } else if (this.activeChaos.type === 'METEOR_RAIN') {
        this.activeChaos.meteorTick -= dt;
        if (this.activeChaos.meteorTick <= 0) {
          this.activeChaos.meteorTick = 1.45;
          const ox = (Math.random() - 0.5) * 14;
          const oz = (Math.random() - 0.5) * 14;
          const mx = THREE.MathUtils.clamp(this.playerPos.x + ox, -100, 100);
          const mz = THREE.MathUtils.clamp(this.playerPos.z + oz, -100, 100);
          const my = getTerrainHeight(mx, mz);
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(2.5, 3.1, 24),
            new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide })
          );
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(mx, my + 0.12, mz);
          this.scene.add(ring);

          const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.95, 0),
            new THREE.MeshStandardMaterial({ color: 0x7c2d12, emissive: 0xea580c, emissiveIntensity: 0.9 })
          );
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
        this.saveData.xp += 30;
        this.checkLevelUp();
        this.showDiscoveryBanner(bestZone.name, bestZone.subtitle);
        if (bestZone.id === 'ancient_ruins') {
          this.advanceQuestObjective('mq_2_river_ruins', 'discover_ruins', 1);
        } else if (bestZone.id === 'secret_sanctuary') {
          this.advanceQuestObjective('sq_5_sanctuary', 'find_sanctuary', 1);
        }
      }
    }

    // Dynamic music mood
    const boss = this.enemies.find((e) => e.family === 'boss');
    const inCombat = this.enemies.some((e) => e.state !== 'Dead' && e.state === 'Chase' && e.pos.distanceTo(this.playerPos) < 16);
    if (bestZone.id === 'boss_arena' && boss && boss.state !== 'Dead') {
      this.audio.setMood('boss');
    } else if (this.activeChaos) {
      this.audio.setMood('chaos');
    } else if (inCombat) {
      this.audio.setMood('combat');
    } else {
      this.audio.setMood(bestZone.ambientMood);
    }

    // Smooth sky & fog color transitions
    const targetFog = this.activeChaos ? '#3a1b3d' : bestZone.fogColor;
    const targetSky = this.activeChaos ? '#632b5e' : bestZone.skyColor;
    _fogColor.set(targetFog);
    _skyColor.set(targetSky);
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(_fogColor, dt * 2.5);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(_skyColor, dt * 2.5);
    }
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

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 1.4);
      this.camera.position.set(
        this.camSmoothPos.x + (Math.random() - 0.5) * this.screenShake,
        this.camSmoothPos.y + (Math.random() - 0.5) * this.screenShake,
        this.camSmoothPos.z + (Math.random() - 0.5) * this.screenShake
      );
    } else {
      this.camera.position.copy(this.camSmoothPos);
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
    });
  }

  // --- Window & Input Binding ---

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
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
      return;
    }
    this.isPointerOrbiting = true;
    this.lastPointer = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isPointerOrbiting || this.screenMode !== 'playing') return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.addCameraDelta(dx, dy);
  };

  private onPointerUp = () => {
    this.isPointerOrbiting = false;
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

  private bindWindowEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('contextmenu', this.onContextMenu);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('contextmenu', this.onContextMenu);

    this.audio.dispose();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
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
