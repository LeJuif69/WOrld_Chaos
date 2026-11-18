import * as THREE from 'three';
import { EnemyFamily } from './types';

export interface ExplorerRig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  scarf: THREE.Mesh;
  blade: THREE.Mesh;
  shieldDome: THREE.Mesh;
  gravityAura: THREE.Mesh;
  contactShadow: THREE.Mesh;
}

export function buildExplorerModel(shadowTex: THREE.Texture): ExplorerRig {
  const root = new THREE.Group();

  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.7),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.03;
  root.add(contactShadow);

  const tunicMat = new THREE.MeshStandardMaterial({ color: 0x134e3a, roughness: 0.78, metalness: 0.08 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x5c3820, roughness: 0.65, metalness: 0.1 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xdba77b, roughness: 0.58, metalness: 0.0 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.2, metalness: 0.88 });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x14b8a6,
    emissive: 0x0d9488,
    emissiveIntensity: 1.05,
    roughness: 0.15,
    metalness: 0.6,
  });

  const body = new THREE.Group();
  body.position.y = 0.85;
  root.add(body);

  // Torso jacket
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.24, 0.74, 10), tunicMat);
  torso.position.y = 0.25;
  torso.castShadow = true;
  body.add(torso);

  // Antique gold shoulder pauldrons for strong heroic silhouette
  for (const sx of [-0.33, 0.33]) {
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), brassMat);
    pauldron.scale.set(1.1, 0.7, 1.1);
    pauldron.position.set(sx, 0.56, 0);
    body.add(pauldron);
  }

  // Leather belt & brass buckle
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.11, 10), leatherMat);
  belt.position.y = -0.02;
  body.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.09), brassMat);
  buckle.position.set(0, -0.02, 0.24);
  body.add(buckle);

  // Explorer backpack + Chaos Compass core
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.22), leatherMat);
  pack.position.set(0, 0.28, -0.26);
  pack.castShadow = true;
  body.add(pack);
  const packCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), visorMat);
  packCore.position.set(0, 0.34, -0.38);
  body.add(packCore);

  // Flowing Crimson & Gold Hero Scarf
  const scarf = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.09, 0.72),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.75 })
  );
  scarf.position.set(0, 0.58, -0.28);
  scarf.rotation.x = 0.25;
  body.add(scarf);

  // Head + Explorer Hat + Goggles
  const head = new THREE.Group();
  head.position.y = 0.76;
  body.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.23, 14, 12), skinMat);
  skull.castShadow = true;
  head.add(skull);

  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.04, 14), leatherMat);
  hatBrim.position.y = 0.14;
  hatBrim.castShadow = true;
  head.add(hatBrim);

  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.2, 12), leatherMat);
  hatCrown.position.y = 0.24;
  head.add(hatCrown);

  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.12), visorMat);
  goggles.position.set(0, 0.05, 0.19);
  head.add(goggles);

  // Arms + Energy Blade
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.36, 0.52, 0);
  body.add(leftArm);
  const lSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.36, 4, 8), tunicMat);
  lSleeve.position.y = -0.2;
  lSleeve.castShadow = true;
  leftArm.add(lSleeve);
  const lGauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.16, 8), brassMat);
  lGauntlet.position.y = -0.4;
  leftArm.add(lGauntlet);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.36, 0.52, 0);
  body.add(rightArm);
  const rSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.36, 4, 8), tunicMat);
  rSleeve.position.y = -0.2;
  rSleeve.castShadow = true;
  rightArm.add(rSleeve);
  const rGauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.16, 8), brassMat);
  rGauntlet.position.y = -0.4;
  rightArm.add(rGauntlet);

  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 1.02),
    new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x14b8a6,
      emissiveIntensity: 1.25,
      roughness: 0.18,
      metalness: 0.72,
    })
  );
  blade.position.set(0, -0.44, 0.48);
  rightArm.add(blade);

  // Legs + Boots
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.14, -0.1, 0);
  body.add(leftLeg);
  const lLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.36, 4, 8), leatherMat);
  lLegMesh.position.y = -0.26;
  lLegMesh.castShadow = true;
  leftLeg.add(lLegMesh);
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), brassMat);
  lBoot.position.set(0, -0.58, 0.04);
  leftLeg.add(lBoot);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.14, -0.1, 0);
  body.add(rightLeg);
  const rLegMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.36, 4, 8), leatherMat);
  rLegMesh.position.y = -0.26;
  rLegMesh.castShadow = true;
  rightLeg.add(rLegMesh);
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.28), brassMat);
  rBoot.position.set(0, -0.58, 0.04);
  rightLeg.add(rBoot);

  // Ability Visual Auras
  const shieldDome = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35, 1),
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.28,
      wireframe: true,
      depthWrite: false,
    })
  );
  shieldDome.position.y = 1.05;
  shieldDome.visible = false;
  root.add(shieldDome);

  const gravityAura = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.05, 8, 28),
    new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 1.2,
      roughness: 0.2,
    })
  );
  gravityAura.rotation.x = Math.PI / 2;
  gravityAura.position.y = 0.22;
  gravityAura.visible = false;
  root.add(gravityAura);

  return {
    root,
    body,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    scarf,
    blade,
    shieldDome,
    gravityAura,
    contactShadow,
  };
}

export function buildNpcModel(
  cloakColor: string,
  accentColor: string,
  shadowTex: THREE.Texture
): THREE.Group {
  const g = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.45 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  g.add(shadow);

  const cloakMat = new THREE.MeshStandardMaterial({ color: cloakColor, roughness: 0.8 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.6,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a77e, roughness: 0.6 });

  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 1.15, 10), cloakMat);
  robe.position.y = 0.58;
  robe.castShadow = true;
  g.add(robe);

  const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.28, 10), accentMat);
  mantle.position.y = 1.08;
  g.add(mantle);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skinMat);
  head.position.y = 1.42;
  head.castShadow = true;
  g.add(head);

  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.36, 10), cloakMat);
  hood.position.set(0, 1.6, -0.03);
  hood.rotation.x = -0.15;
  g.add(hood);

  // Floating beacon ring above NPC for crisp readability
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 1.0,
      roughness: 0.2,
    })
  );
  beacon.position.y = 2.15;
  beacon.name = 'npc_beacon';
  g.add(beacon);

  return g;
}

export interface EnemyRig {
  root: THREE.Group;
  body: THREE.Group;
  limbs: THREE.Object3D[];
  telegraphRing: THREE.Mesh;
  coreMesh: THREE.Mesh;
}

export function buildEnemyModel(family: EnemyFamily, shadowTex: THREE.Texture): EnemyRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const shadowSize = family === 'boss' ? 5.6 : family === 'sentinel' ? 2.4 : 1.5;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(shadowSize, shadowSize),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.5 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  root.add(shadow);

  const telegraphRing = new THREE.Mesh(
    new THREE.RingGeometry(family === 'boss' ? 3.2 : 1.3, family === 'boss' ? 3.7 : 1.55, 32),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
  );
  telegraphRing.rotation.x = -Math.PI / 2;
  telegraphRing.position.y = 0.08;
  telegraphRing.visible = false;
  root.add(telegraphRing);

  const limbs: THREE.Object3D[] = [];
  let coreMesh: THREE.Mesh;

  if (family === 'stalker') {
    const furMat = new THREE.MeshStandardMaterial({ color: 0x3b1f47, roughness: 0.72 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 1.3 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 1.15), furMat);
    torso.position.y = 0.65;
    torso.castShadow = true;
    body.add(torso);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 6), furMat);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 0.82, 0.75);
    body.add(head);

    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), eyeMat);
    coreMesh.position.set(0, 0.92, 0.15);
    body.add(coreMesh);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.8, 6), furMat);
    tail.rotation.x = -0.8;
    tail.position.set(0, 0.75, -0.8);
    body.add(tail);

    for (const [lx, lz] of [
      [-0.26, 0.35],
      [0.26, 0.35],
      [-0.26, -0.35],
      [0.26, -0.35],
    ]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.16), furMat);
      leg.position.set(lx, 0.28, lz);
      leg.castShadow = true;
      body.add(leg);
      limbs.push(leg);
    }
  } else if (family === 'spitter') {
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x1b4d3e, roughness: 0.78 });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635,
      emissive: 0x65a30d,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 0.45, 8), stemMat);
    base.position.y = 0.22;
    base.castShadow = true;
    body.add(base);

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.0, 8), stemMat);
    stalk.position.y = 0.85;
    stalk.castShadow = true;
    body.add(stalk);

    coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), bulbMat);
    coreMesh.position.y = 1.45;
    body.add(coreMesh);

    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.22), stemMat);
      const ang = (i * Math.PI) / 2;
      leaf.position.set(Math.cos(ang) * 0.5, 0.48, Math.sin(ang) * 0.5);
      leaf.rotation.y = -ang;
      leaf.rotation.z = -0.35;
      body.add(leaf);
      limbs.push(leaf);
    }
  } else if (family === 'sentinel') {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.88, metalness: 0.15 });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.1,
      roughness: 0.2,
    });

    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.2, 0.8), stoneMat);
    chest.position.y = 1.35;
    chest.castShadow = true;
    body.add(chest);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.48, 0.52), stoneMat);
    head.position.y = 2.15;
    body.add(head);

    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), runeMat);
    coreMesh.position.set(0, 1.4, 0.42);
    body.add(coreMesh);

    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.15, 0.36), stoneMat);
    lArm.position.set(-0.82, 1.25, 0);
    lArm.castShadow = true;
    body.add(lArm);
    limbs.push(lArm);

    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.15, 0.36), stoneMat);
    rArm.position.set(0.82, 1.25, 0);
    rArm.castShadow = true;
    body.add(rArm);
    limbs.push(rArm);
  } else {
    // BOSS: KRAKOSS, THE CORRUPTED GUARDIAN (Monumental multi-part Golem)
    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x2a1f36, roughness: 0.72, metalness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, metalness: 0.85 });
    const chaosMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.5,
      roughness: 0.18,
    });

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 1.0, 8), obsidianMat);
    pelvis.position.y = 1.1;
    pelvis.castShadow = true;
    body.add(pelvis);

    const chest = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.05, 2.0, 8), obsidianMat);
    chest.position.y = 2.6;
    chest.castShadow = true;
    body.add(chest);

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.1, 6), goldMat);
    crown.position.y = 4.15;
    body.add(crown);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.26, 0.9), chaosMat);
    visor.position.set(0, 3.6, 0.55);
    body.add(visor);

    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), chaosMat);
    coreMesh.position.set(0, 2.6, 1.35);
    body.add(coreMesh);

    const lShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 0), goldMat);
    lShoulder.position.set(-2.0, 3.3, 0);
    body.add(lShoulder);

    const rShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 0), goldMat);
    rShoulder.position.set(2.0, 3.3, 0);
    body.add(rShoulder);

    const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.3, 0.75), obsidianMat);
    lArm.position.set(-2.1, 2.0, 0);
    lArm.castShadow = true;
    body.add(lArm);
    limbs.push(lArm);

    const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.3, 0.75), obsidianMat);
    rArm.position.set(2.1, 2.0, 0);
    rArm.castShadow = true;
    body.add(rArm);
    limbs.push(rArm);
  }

  return { root, body, limbs, telegraphRing, coreMesh };
}

export function buildCampGroup(barkTex: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  const canvasMat = new THREE.MeshStandardMaterial({ color: 0xd4b483, roughness: 0.85 });
  const poleMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.9 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });

  // Expedition Tents
  for (const [tx, tz, rot] of [
    [-9, 3, 0.6],
    [9, 4, -0.7],
  ]) {
    const tent = new THREE.Group();
    tent.position.set(tx, 0, tz);
    tent.rotation.y = rot;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.4, 4), canvasMat);
    roof.position.y = 1.2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    tent.add(roof);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), poleMat);
    pole.position.y = 1.3;
    tent.add(pole);
    g.add(tent);
  }

  // Stone fire pit ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), stoneMat);
    s.position.set(Math.cos(a) * 1.1, 0.16, Math.sin(a) * 1.1);
    g.add(s);
  }

  // Glowing campfire flames & warm refuge point light
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.05, 7),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xea580c,
      emissiveIntensity: 2.0,
      roughness: 0.35,
    })
  );
  flame.position.y = 0.55;
  flame.name = 'camp_flame';
  g.add(flame);

  const campGlow = new THREE.PointLight(0xf59e0b, 3.2, 22, 1.6);
  campGlow.position.set(0, 2.2, 0);
  g.add(campGlow);

  // Carved golden-rune perimeter ward stones
  const runeMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    emissive: 0xb48a20,
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.85,
  });
  for (const [wx, wz] of [
    [-10, -7],
    [10, -7],
    [-10, 9],
    [10, 9],
  ]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.4, 0.75), stoneMat);
    pillar.position.set(wx, 1.2, wz);
    pillar.castShadow = true;
    g.add(pillar);
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), runeMat);
    cap.position.set(wx, 2.7, wz);
    g.add(cap);
  }

  return g;
}

export function buildForgottenTemple(stoneTex: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.86, metalness: 0.05 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.24, metalness: 0.88 });
  const conduitMat = new THREE.MeshStandardMaterial({
    color: 0x14b8a6,
    emissive: 0x0d9488,
    emissiveIntensity: 1.1,
    roughness: 0.2,
  });

  // Stepped Mayan pyramid tiers with golden architectural inlays
  const tier1 = new THREE.Mesh(new THREE.BoxGeometry(18, 2.2, 18), stoneMat);
  tier1.position.y = 1.1;
  tier1.receiveShadow = true;
  tier1.castShadow = true;
  g.add(tier1);
  const trim1 = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.22, 18.2), goldMat);
  trim1.position.y = 2.15;
  g.add(trim1);

  const tier2 = new THREE.Mesh(new THREE.BoxGeometry(12.5, 2.4, 12.5), stoneMat);
  tier2.position.y = 3.4;
  tier2.receiveShadow = true;
  tier2.castShadow = true;
  g.add(tier2);
  const trim2 = new THREE.Mesh(new THREE.BoxGeometry(12.7, 0.22, 12.7), goldMat);
  trim2.position.y = 4.55;
  g.add(trim2);

  const tier3 = new THREE.Mesh(new THREE.BoxGeometry(7.2, 2.4, 7.2), stoneMat);
  tier3.position.y = 5.8;
  tier3.receiveShadow = true;
  tier3.castShadow = true;
  g.add(tier3);
  const trim3 = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.24, 7.4), goldMat);
  trim3.position.y = 6.95;
  g.add(trim3);

  // Floating turquoise gravity ring above temple apex
  const apexRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.1, 8, 32), conduitMat);
  apexRing.rotation.x = Math.PI / 2;
  apexRing.position.y = 9.1;
  g.add(apexRing);

  // Decorative corner obelisks
  for (const sx of [-7.5, 7.5]) {
    for (const sz of [-7.5, 7.5]) {
      const ob = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.2, 1.1), stoneMat);
      ob.position.set(sx, 2.1, sz);
      ob.castShadow = true;
      g.add(ob);
      const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldMat);
      cap.position.set(sx, 4.5, sz);
      g.add(cap);
    }
  }

  return g;
}
