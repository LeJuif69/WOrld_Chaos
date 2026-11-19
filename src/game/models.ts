import * as THREE from 'three';
import { EnemyFamily } from './types';

export interface PbrTextureMaps {
  stoneNormal?: THREE.Texture;
  stoneRoughness?: THREE.Texture;
  barkNormal?: THREE.Texture;
  barkRoughness?: THREE.Texture;
  foliageNormal?: THREE.Texture;
}

export interface ExplorerTextureMaps {
  skinMap?: THREE.Texture;
  skinNormal?: THREE.Texture;
  leatherMap?: THREE.Texture;
  leatherNormal?: THREE.Texture;
  clothNormal?: THREE.Texture;
}

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

/**
 * Builds the Hero Adventurer Model.
 * Scaled to realistic human athletic proportions (~1.82m total height, 1/7.6 head ratio),
 * with layered adventurer garments, leather harness & pouches, glowing Chaos Compass,
 * sculpted facial features, articulated limbs, and PBR material responses.
 *
 * NOTE: This advanced procedural model serves as an optimized high-fidelity rig
 * while preparing for external Blender .glb asset drop-in via AssetManager.
 */
export function buildExplorerModel(
  shadowTex: THREE.Texture,
  textures?: ExplorerTextureMaps
): ExplorerRig {
  const root = new THREE.Group();

  // Soft directional ground contact shadow
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 1.65),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.03;
  root.add(contactShadow);

  // PBR Materials calibrated for realistic lighting
  const tunicMat = new THREE.MeshStandardMaterial({
    color: 0x1a4d3b,
    roughness: 0.72,
    metalness: 0.05,
    normalMap: textures?.clothNormal,
    normalScale: textures?.clothNormal ? new THREE.Vector2(0.8, 0.8) : undefined,
  });

  const underTunicMat = new THREE.MeshStandardMaterial({
    color: 0x0e281f,
    roughness: 0.84,
    metalness: 0.02,
    normalMap: textures?.clothNormal,
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: textures?.leatherMap ? 0xffffff : 0x54321d,
    map: textures?.leatherMap,
    normalMap: textures?.leatherNormal,
    normalScale: textures?.leatherNormal ? new THREE.Vector2(1.2, 1.2) : undefined,
    roughness: 0.58,
    metalness: 0.12,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: textures?.skinMap ? 0xffffff : 0xe4ab87,
    map: textures?.skinMap,
    normalMap: textures?.skinNormal,
    normalScale: textures?.skinNormal ? new THREE.Vector2(0.85, 0.85) : undefined,
    roughness: 0.54,
    metalness: 0.0,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x1f1712,
    roughness: 0.65,
    metalness: 0.1,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.88,
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x474a4f,
    roughness: 0.42,
    metalness: 0.78,
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x14b8a6,
    emissive: 0x0d9488,
    emissiveIntensity: 1.25,
    roughness: 0.14,
    metalness: 0.65,
  });

  // Body Hip/Pelvis Anchor (Realistic human hip height: ~0.88m above floor)
  const body = new THREE.Group();
  body.position.y = 0.88;
  root.add(body);

  // Anatomical Pelvis & Waist
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.22, 10), underTunicMat);
  pelvis.position.y = 0.06;
  pelvis.castShadow = true;
  body.add(pelvis);

  // Tapered Athletic Torso (waist 0.22m to broad chest 0.32m, height 0.52m)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.22, 0.52, 12), tunicMat);
  torso.position.y = 0.38;
  torso.castShadow = true;
  body.add(torso);

  // Inner shirt high collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.14, 10), underTunicMat);
  collar.position.y = 0.64;
  body.add(collar);

  // Crossed Leather Equipment Harness with brass cinch buckles
  const chestStrap1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.34), leatherMat);
  chestStrap1.position.set(0, 0.42, 0.03);
  chestStrap1.rotation.z = 0.42;
  body.add(chestStrap1);

  const chestStrap2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.34), leatherMat);
  chestStrap2.position.set(0, 0.42, -0.01);
  chestStrap2.rotation.z = -0.42;
  body.add(chestStrap2);

  const harnessBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), brassMat);
  harnessBuckle.position.set(0, 0.42, 0.21);
  body.add(harnessBuckle);

  // Broad contoured Pauldrons (Shoulder Armor)
  for (const sx of [-0.34, 0.34]) {
    const pauldronGroup = new THREE.Group();
    pauldronGroup.position.set(sx, 0.58, 0);

    const plate = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), leatherMat);
    plate.scale.set(1.15, 0.62, 1.25);
    plate.castShadow = true;
    pauldronGroup.add(plate);

    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 12), brassMat);
    trim.rotation.x = Math.PI / 2;
    pauldronGroup.add(trim);

    body.add(pauldronGroup);
  }

  // Expedition Utility Belt + Buckle + Accessories
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.09, 12), leatherMat);
  belt.position.y = 0.14;
  body.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.11, 0.07), brassMat);
  buckle.position.set(0, 0.14, 0.22);
  body.add(buckle);

  // Side Field Pouch (Right hip)
  const pouchR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.13), leatherMat);
  pouchR.position.set(0.24, 0.1, 0.04);
  pouchR.rotation.y = 0.2;
  body.add(pouchR);

  // Explorer Brass Canteen (Left hip)
  const canteen = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 8), ironMat);
  canteen.position.set(-0.24, 0.1, -0.02);
  canteen.rotation.z = -0.25;
  body.add(canteen);

  // Expedition Backpack with rolled blanket + glowing Chaos Compass
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.22), leatherMat);
  pack.position.set(0, 0.4, -0.24);
  pack.castShadow = true;
  body.add(pack);

  // Rolled bedroll at backpack top
  const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8), underTunicMat);
  bedroll.rotation.z = Math.PI / 2;
  bedroll.position.set(0, 0.64, -0.24);
  body.add(bedroll);

  // Chaos Compass frame & emissive core
  const compassRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 16), brassMat);
  compassRing.position.set(0, 0.42, -0.36);
  body.add(compassRing);

  const compassCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), visorMat);
  compassCore.position.set(0, 0.42, -0.36);
  body.add(compassCore);

  // Flowing Crimson Hero Scarf with dual trailing streamers
  const scarf = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.07, 0.72),
    new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.68,
      metalness: 0.05,
    })
  );
  scarf.position.set(0, 0.62, -0.28);
  scarf.rotation.x = 0.28;
  body.add(scarf);

  // Head Group (Positioned at neck apex, y = 0.74 relative to body)
  const head = new THREE.Group();
  head.position.y = 0.74;
  body.add(head);

  // Anatomical Head base (jaw, cranium)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 12), skinMat);
  skull.scale.set(0.92, 1.12, 1.05);
  skull.castShadow = true;
  head.add(skull);

  // Refined nose bridge
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.075, 4), skinMat);
  nose.position.set(0, -0.015, 0.19);
  nose.rotation.x = Math.PI / 2;
  head.add(nose);

  // Ears
  for (const ex of [-0.175, 0.175]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.038, 6, 6), skinMat);
    ear.scale.set(0.45, 1.25, 0.85);
    ear.position.set(ex, 0, 0.02);
    head.add(ear);
  }

  // Realistic Eyes & Brow ridge
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.15 });
  for (const eyeX of [-0.065, 0.065]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), eyeMat);
    eye.position.set(eyeX, 0.035, 0.165);
    head.add(eye);
  }

  // Layered swept hair locks framing temples
  for (const hx of [-0.14, -0.07, 0.07, 0.14]) {
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.08), hairMat);
    lock.position.set(hx, 0.06, 0.13);
    lock.rotation.z = hx * -0.6;
    head.add(lock);
  }
  const backHair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), hairMat);
  backHair.scale.set(0.94, 1.05, 1.08);
  backHair.position.set(0, 0.04, -0.04);
  head.add(backHair);

  // Adventurer Leather Hat with stitched brim
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.035, 18), leatherMat);
  hatBrim.position.y = 0.12;
  hatBrim.castShadow = true;
  head.add(hatBrim);

  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.18, 14), leatherMat);
  hatCrown.position.y = 0.21;
  head.add(hatCrown);

  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.245, 0.045, 14), brassMat);
  hatBand.position.y = 0.15;
  head.add(hatBand);

  // Flip-up Exploration Goggles
  const goggleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.09), brassMat);
  goggleFrame.position.set(0, 0.06, 0.16);
  head.add(goggleFrame);

  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.065, 0.11), visorMat);
  goggles.position.set(0, 0.06, 0.17);
  head.add(goggles);

  // Left Arm Group (Shoulder joint at [-0.36, 0.52, 0])
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.36, 0.52, 0);
  body.add(leftArm);

  const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.32, 8), tunicMat);
  lUpperArm.position.y = -0.16;
  lUpperArm.castShadow = true;
  leftArm.add(lUpperArm);

  const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.28, 8), leatherMat);
  lForearm.position.y = -0.38;
  lForearm.castShadow = true;
  leftArm.add(lForearm);

  const lGauntletTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.07, 8), brassMat);
  lGauntletTrim.position.y = -0.46;
  leftArm.add(lGauntletTrim);

  const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.06), leatherMat);
  lHand.position.set(0, -0.55, 0.01);
  leftArm.add(lHand);

  // Right Arm Group (Weapon hand, shoulder joint at [0.36, 0.52, 0])
  const rightArm = new THREE.Group();
  rightArm.position.set(0.36, 0.52, 0);
  body.add(rightArm);

  const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.32, 8), tunicMat);
  rUpperArm.position.y = -0.16;
  rUpperArm.castShadow = true;
  rightArm.add(rUpperArm);

  const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.28, 8), leatherMat);
  rForearm.position.y = -0.38;
  rForearm.castShadow = true;
  rightArm.add(rForearm);

  const rGauntletTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.07, 8), brassMat);
  rGauntletTrim.position.y = -0.46;
  rightArm.add(rGauntletTrim);

  const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.06), leatherMat);
  rHand.position.set(0, -0.55, 0.01);
  rightArm.add(rHand);

  // Brass Sword Hilt & Swept Crossguard
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.26, 8), leatherMat);
  hilt.rotation.x = Math.PI / 2;
  hilt.position.set(0, -0.56, 0.05);
  rightArm.add(hilt);

  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), brassMat);
  pommel.position.set(0, -0.56, -0.09);
  rightArm.add(pommel);

  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.06), brassMat);
  crossguard.position.set(0, -0.56, 0.18);
  rightArm.add(crossguard);

  // Faceted Crystal Energy Blade (aligned along +Z for dynamic reach scaling during combo hits)
  const bladeGeo = new THREE.CylinderGeometry(0.012, 0.065, 1.12, 4);
  bladeGeo.rotateX(Math.PI / 2);
  const blade = new THREE.Mesh(
    bladeGeo,
    new THREE.MeshStandardMaterial({
      color: 0x2dd4bf,
      emissive: 0x14b8a6,
      emissiveIntensity: 1.45,
      roughness: 0.14,
      metalness: 0.8,
    })
  );
  blade.position.set(0, -0.56, 0.76);
  rightArm.add(blade);

  // Left Leg (Athletic expedition pants + knee guard + hiking boot)
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, -0.05, 0);
  body.add(leftLeg);

  const lThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.38, 8), leatherMat);
  lThigh.position.y = -0.22;
  lThigh.castShadow = true;
  leftLeg.add(lThigh);

  const lKneePad = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), brassMat);
  lKneePad.scale.set(0.9, 1.1, 0.7);
  lKneePad.position.set(0, -0.41, 0.06);
  leftLeg.add(lKneePad);

  const lCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.32, 8), underTunicMat);
  lCalf.position.y = -0.56;
  lCalf.castShadow = true;
  leftLeg.add(lCalf);

  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), ironMat);
  lBoot.position.set(0, -0.74, 0.04);
  lBoot.castShadow = true;
  leftLeg.add(lBoot);

  const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.04, 0.3), leatherMat);
  lSole.position.set(0, -0.83, 0.04);
  leftLeg.add(lSole);

  // Right Leg (Athletic expedition pants + knee guard + hiking boot)
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, -0.05, 0);
  body.add(rightLeg);

  const rThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.38, 8), leatherMat);
  rThigh.position.y = -0.22;
  rThigh.castShadow = true;
  rightLeg.add(rThigh);

  const rKneePad = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), brassMat);
  rKneePad.scale.set(0.9, 1.1, 0.7);
  rKneePad.position.set(0, -0.41, 0.06);
  rightLeg.add(rKneePad);

  const rCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.32, 8), underTunicMat);
  rCalf.position.y = -0.56;
  rCalf.castShadow = true;
  rightLeg.add(rCalf);

  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.28), ironMat);
  rBoot.position.set(0, -0.74, 0.04);
  rBoot.castShadow = true;
  rightLeg.add(rBoot);

  const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.04, 0.3), leatherMat);
  rSole.position.set(0, -0.83, 0.04);
  rightLeg.add(rSole);

  // Ability Visual Auras
  const shieldDome = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.42, 1),
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.95,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
      depthWrite: false,
    })
  );
  shieldDome.position.y = 1.05;
  shieldDome.visible = false;
  root.add(shieldDome);

  const gravityAura = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.06, 8, 32),
    new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 1.35,
      roughness: 0.18,
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
  shadowTex: THREE.Texture,
  roleId?: string
): THREE.Group {
  const g = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.55, 1.55),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.48 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  g.add(shadow);

  const cloakMat = new THREE.MeshStandardMaterial({ color: cloakColor, roughness: 0.78, metalness: 0.06 });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.38,
    roughness: 0.28,
    metalness: 0.65,
  });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd9a77e, roughness: 0.58 });

  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.4, 1.16, 12), cloakMat);
  robe.position.y = 0.58;
  robe.castShadow = true;
  g.add(robe);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.29, 0.1, 12), brassMat);
  belt.position.y = 0.78;
  g.add(belt);

  const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.29, 0.28, 12), accentMat);
  mantle.position.y = 1.09;
  g.add(mantle);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skinMat);
  head.position.y = 1.43;
  head.castShadow = true;
  g.add(head);

  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.29, 0.38, 12), cloakMat);
  hood.position.set(0, 1.61, -0.03);
  hood.rotation.x = -0.16;
  g.add(hood);

  // Distinctive NPC Role Props
  if (roleId === 'lyra') {
    const scroll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.48, 8),
      new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 })
    );
    scroll.rotation.z = 0.65;
    scroll.position.set(0.32, 0.92, 0.18);
    g.add(scroll);
  } else if (roleId === 'kael') {
    const wrench = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.1), brassMat);
    wrench.rotation.z = -0.35;
    wrench.position.set(-0.34, 0.96, 0.14);
    g.add(wrench);
    const headTool = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.14), brassMat);
    headTool.rotation.z = -0.35;
    headTool.position.set(-0.44, 1.24, 0.14);
    g.add(headTool);
  } else if (roleId === 'orin' || roleId === 'veyra') {
    const staff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 1.85, 8),
      roleId === 'veyra' ? brassMat : cloakMat
    );
    staff.position.set(0.4, 0.92, 0.12);
    g.add(staff);
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), accentMat);
    orb.position.set(0.4, 1.9, 0.12);
    g.add(orb);
  } else if (roleId === 'tarek') {
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 1), accentMat);
    orb.position.set(-0.34, 1.22, 0.22);
    g.add(orb);
  }

  // Floating beacon ring above NPC for crisp readability
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 1.05,
      roughness: 0.2,
    })
  );
  beacon.position.y = 2.15;
  beacon.name = 'npc_beacon';
  g.add(beacon);

  return g;
}

export interface EnemyFlashTarget {
  mat: THREE.MeshStandardMaterial;
  baseEmissive: number;
  baseIntensity: number;
}

export interface EnemyRig {
  root: THREE.Group;
  body: THREE.Group;
  limbs: THREE.Object3D[];
  telegraphRing: THREE.Mesh;
  staggerHalo: THREE.Mesh;
  coreMesh: THREE.Mesh;
  coreBaseIntensity: number;
  flashTargets: EnemyFlashTarget[];
}

export function buildEnemyModel(family: EnemyFamily, shadowTex: THREE.Texture): EnemyRig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const shadowSize = family === 'boss' ? 5.8 : family === 'sentinel' ? 2.5 : 1.55;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(shadowSize, shadowSize),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.52 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  root.add(shadow);

  const outerTeleR = family === 'boss' ? 4.2 : family === 'sentinel' ? 2.1 : 1.68;
  const innerTeleR = family === 'boss' ? 3.55 : family === 'sentinel' ? 1.72 : 1.34;
  const telegraphRing = new THREE.Mesh(
    new THREE.RingGeometry(innerTeleR, outerTeleR, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  telegraphRing.rotation.x = -Math.PI / 2;
  telegraphRing.position.y = 0.2;
  telegraphRing.renderOrder = 5;
  const telegraphFill = new THREE.Mesh(
    new THREE.CircleGeometry(innerTeleR, 28),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
  );
  telegraphRing.add(telegraphFill);
  telegraphRing.visible = false;
  root.add(telegraphRing);

  const staggerY = family === 'boss' ? 5.15 : family === 'sentinel' ? 2.85 : family === 'spitter' ? 2.15 : 1.48;
  const staggerR = family === 'boss' ? 1.55 : 0.65;
  const staggerHalo = new THREE.Mesh(
    new THREE.TorusGeometry(staggerR, family === 'boss' ? 0.11 : 0.06, 8, 24),
    new THREE.MeshBasicMaterial({
      color: 0xf2cf66,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    })
  );
  staggerHalo.rotation.x = Math.PI / 2;
  staggerHalo.position.y = staggerY;
  staggerHalo.visible = false;
  root.add(staggerHalo);

  const limbs: THREE.Object3D[] = [];
  let coreMesh: THREE.Mesh;

  if (family === 'stalker') {
    const furMat = new THREE.MeshStandardMaterial({ color: 0x3b1f47, roughness: 0.68, metalness: 0.12 });
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x1e1028, roughness: 0.5, metalness: 0.3 });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.45,
      roughness: 0.2,
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.46, 1.18), furMat);
    torso.position.y = 0.66;
    torso.castShadow = true;
    body.add(torso);

    // Dorsal obsidian spine plates
    for (let i = 0; i < 3; i++) {
      const plate = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 4), spineMat);
      plate.position.set(0, 0.98, 0.25 - i * 0.32);
      plate.rotation.x = -0.3;
      body.add(plate);
    }

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.58, 6), furMat);
    head.rotation.x = Math.PI / 2;
    head.position.set(0, 0.82, 0.76);
    body.add(head);

    for (const ex of [-0.11, 0.11]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), eyeMat);
      eye.position.set(ex, 0.86, 0.84);
      body.add(eye);
    }

    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), eyeMat);
    coreMesh.position.set(0, 0.92, 0.18);
    body.add(coreMesh);

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.13, 0.88, 6), spineMat);
    tail.rotation.x = -0.82;
    tail.position.set(0, 0.78, -0.82);
    body.add(tail);

    // Hip/shoulder-pivoted legs for crisp quadrupède stride animation
    const legGeo = new THREE.BoxGeometry(0.15, 0.52, 0.17);
    legGeo.translate(0, -0.24, 0);
    for (const [lx, lz] of [
      [-0.27, 0.36],
      [0.27, 0.36],
      [-0.27, -0.36],
      [0.27, -0.36],
    ]) {
      const leg = new THREE.Mesh(legGeo, furMat);
      leg.position.set(lx, 0.52, lz);
      leg.castShadow = true;
      body.add(leg);
      limbs.push(leg);
    }
  } else if (family === 'spitter') {
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x164e3f, roughness: 0.76, metalness: 0.06 });
    const thornMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.55 });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635,
      emissive: 0x65a30d,
      emissiveIntensity: 1.05,
      roughness: 0.25,
    });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.68, 0.46, 8), stemMat);
    base.position.y = 0.23;
    base.castShadow = true;
    body.add(base);

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 1.02, 8), stemMat);
    stalk.position.y = 0.86;
    stalk.castShadow = true;
    body.add(stalk);

    // Stalk thorns
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const thorn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 4), thornMat);
      thorn.position.set(Math.cos(a) * 0.28, 0.72 + (i % 2) * 0.28, Math.sin(a) * 0.28);
      thorn.rotation.z = -Math.cos(a) * 1.1;
      thorn.rotation.x = Math.sin(a) * 1.1;
      body.add(thorn);
    }

    coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), bulbMat);
    coreMesh.position.y = 1.46;
    body.add(coreMesh);

    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.24), stemMat);
      const ang = (i * Math.PI) / 2;
      leaf.position.set(Math.cos(ang) * 0.48, 0.52, Math.sin(ang) * 0.48);
      leaf.rotation.y = -ang;
      leaf.rotation.z = -0.38;
      body.add(leaf);
      limbs.push(leaf);
    }
  } else if (family === 'sentinel') {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.88, metalness: 0.16 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 });
    const runeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      roughness: 0.18,
    });

    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.22, 0.82), stoneMat);
    chest.position.y = 1.35;
    chest.castShadow = true;
    body.add(chest);

    const chestTrim = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.2, 0.86), goldMat);
    chestTrim.position.y = 1.82;
    body.add(chestTrim);

    for (const sx of [-0.74, 0.74]) {
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.65), goldMat);
      pauldron.position.set(sx, 1.9, 0);
      body.add(pauldron);
    }

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.54), stoneMat);
    head.position.y = 2.16;
    body.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.56), runeMat);
    visor.position.set(0, 2.18, 0.02);
    body.add(visor);

    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), runeMat);
    coreMesh.position.set(0, 1.4, 0.43);
    body.add(coreMesh);

    const armGeo = new THREE.BoxGeometry(0.36, 1.15, 0.36);
    armGeo.translate(0, -0.45, 0);
    const lArm = new THREE.Mesh(armGeo, stoneMat);
    lArm.position.set(-0.84, 1.72, 0);
    lArm.castShadow = true;
    body.add(lArm);
    limbs.push(lArm);

    const rArm = new THREE.Mesh(armGeo, stoneMat);
    rArm.position.set(0.84, 1.72, 0);
    rArm.castShadow = true;
    body.add(rArm);
    limbs.push(rArm);
  } else {
    // BOSS: KRAKOSS, THE CORRUPTED GUARDIAN (Monumental Obsidian & Gold Golem)
    const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x241930, roughness: 0.66, metalness: 0.34 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.24, metalness: 0.88 });
    const chaosMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.55,
      roughness: 0.18,
    });

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 1.05, 8), obsidianMat);
    pelvis.position.y = 1.1;
    pelvis.castShadow = true;
    body.add(pelvis);

    const beltGold = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.08, 0.24, 8), goldMat);
    beltGold.position.y = 1.56;
    body.add(beltGold);

    const chest = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.08, 2.05, 8), obsidianMat);
    chest.position.y = 2.62;
    chest.castShadow = true;
    body.add(chest);

    // Magma rib fissures across chest
    for (const ry of [2.15, 2.6, 3.05]) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.22 + (ry - 2.15) * 0.35, 0.06, 6, 12), chaosMat);
      rib.rotation.x = Math.PI / 2;
      rib.position.y = ry;
      body.add(rib);
    }

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.88, 1.15, 6), goldMat);
    crown.position.y = 4.18;
    body.add(crown);

    // Curved Obsidian Horns
    for (const hx of [-0.72, 0.72]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.15, 6), obsidianMat);
      horn.position.set(hx, 4.15, 0.05);
      horn.rotation.z = hx > 0 ? -0.45 : 0.45;
      body.add(horn);
    }

    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.28, 0.94), chaosMat);
    visor.position.set(0, 3.62, 0.55);
    body.add(visor);

    coreMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.64, 0), chaosMat);
    coreMesh.position.set(0, 2.65, 1.42);
    body.add(coreMesh);

    // Floating corrupted chaos halo ring behind shoulders
    const halo = new THREE.Group();
    halo.name = 'boss_halo';
    halo.position.set(0, 3.1, -1.25);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), chaosMat);
      shard.position.set(Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0);
      halo.add(shard);
    }
    body.add(halo);

    const lShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), goldMat);
    lShoulder.position.set(-2.05, 3.32, 0);
    body.add(lShoulder);

    const rShoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), goldMat);
    rShoulder.position.set(2.05, 3.32, 0);
    body.add(rShoulder);

    const bossArmGeo = new THREE.BoxGeometry(0.78, 2.35, 0.78);
    bossArmGeo.translate(0, -1.02, 0);
    const lArm = new THREE.Mesh(bossArmGeo, obsidianMat);
    lArm.position.set(-2.15, 3.05, 0);
    lArm.castShadow = true;
    const lKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.4, 0.84), goldMat);
    lKnuckle.position.y = -2.0;
    lArm.add(lKnuckle);
    body.add(lArm);
    limbs.push(lArm);

    const rArm = new THREE.Mesh(bossArmGeo, obsidianMat);
    rArm.position.set(2.15, 3.05, 0);
    rArm.castShadow = true;
    const rKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.4, 0.84), goldMat);
    rKnuckle.position.y = -2.0;
    rArm.add(rKnuckle);
    body.add(rArm);
    limbs.push(rArm);
  }

  const seenMats = new Set<THREE.MeshStandardMaterial>();
  const flashTargets: EnemyFlashTarget[] = [];
  body.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
      if (!seenMats.has(obj.material)) {
        seenMats.add(obj.material);
        flashTargets.push({
          mat: obj.material,
          baseEmissive: obj.material.emissive.getHex(),
          baseIntensity: obj.material.emissiveIntensity,
        });
      }
    }
  });
  const coreMat = coreMesh.material as THREE.MeshStandardMaterial;
  const coreBaseIntensity = coreMat?.emissiveIntensity ?? 1.0;

  return {
    root,
    body,
    limbs,
    telegraphRing,
    staggerHalo,
    coreMesh,
    coreBaseIntensity,
    flashTargets,
  };
}

export function buildCampGroup(
  barkTex: THREE.Texture,
  stoneTex?: THREE.Texture,
  stoneBump?: THREE.Texture,
  barkBump?: THREE.Texture,
  pbr?: PbrTextureMaps
): THREE.Group {
  const g = new THREE.Group();
  const canvasMat = new THREE.MeshStandardMaterial({ color: 0xd6ba8a, roughness: 0.86 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x134e3a, roughness: 0.8 });
  const poleMat = new THREE.MeshStandardMaterial({
    map: barkTex,
    normalMap: pbr?.barkNormal,
    normalScale: pbr?.barkNormal ? new THREE.Vector2(0.85, 0.85) : undefined,
    bumpMap: pbr?.barkNormal ? undefined : barkBump,
    bumpScale: 0.05,
    roughnessMap: pbr?.barkRoughness,
    roughness: pbr?.barkRoughness ? 1.0 : 0.9,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    normalMap: pbr?.stoneNormal,
    normalScale: pbr?.stoneNormal ? new THREE.Vector2(0.95, 0.95) : undefined,
    bumpMap: pbr?.stoneNormal ? undefined : stoneBump,
    bumpScale: 0.06,
    roughnessMap: pbr?.stoneRoughness,
    color: stoneTex ? 0xbab3a0 : 0x57534e,
    roughness: pbr?.stoneRoughness ? 1.0 : 0.9,
  });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.86 });

  // Expedition Tents with ridge trim & warm lanterns
  for (const [tx, tz, rot] of [
    [-9, 3, 0.6],
    [9, 4, -0.7],
  ]) {
    const tent = new THREE.Group();
    tent.position.set(tx, 0, tz);
    tent.rotation.y = rot;

    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 2.5, 4), canvasMat);
    roof.position.y = 1.25;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    roof.receiveShadow = true;
    tent.add(roof);

    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.15, 0.26, 4), trimMat);
    skirt.position.y = 0.13;
    skirt.rotation.y = Math.PI / 4;
    tent.add(skirt);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.8, 6), poleMat);
    pole.position.y = 1.4;
    tent.add(pole);

    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), brassMat);
    finial.position.y = 2.85;
    tent.add(finial);

    // Expedition crate beside tent
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.7), poleMat);
    crate.position.set(1.85, 0.32, 0.55);
    crate.rotation.y = 0.3;
    crate.castShadow = true;
    tent.add(crate);

    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.08, 0.72), brassMat);
    strap.position.set(1.85, 0.48, 0.55);
    strap.rotation.y = 0.3;
    tent.add(strap);

    g.add(tent);
  }

  // Stone fire pit ring & crossed logs
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), stoneMat);
    s.position.set(Math.cos(a) * 1.15, 0.14, Math.sin(a) * 1.15);
    s.rotation.set(i * 0.5, a, 0);
    g.add(s);
  }
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.45, 7), poleMat);
    log.position.y = 0.2;
    log.rotation.z = Math.PI / 2 - 0.15;
    log.rotation.y = (i * Math.PI) / 3;
    g.add(log);
  }

  // Layered glowing campfire flame & warm refuge point light
  const flame = new THREE.Group();
  flame.position.y = 0.52;
  flame.name = 'camp_flame';

  const outerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, 1.1, 7),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xea580c,
      emissiveIntensity: 1.9,
      roughness: 0.35,
      transparent: true,
      opacity: 0.9,
    })
  );
  flame.add(outerFlame);

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.7, 6),
    new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfbbf24,
      emissiveIntensity: 2.3,
      roughness: 0.25,
    })
  );
  innerFlame.position.y = -0.1;
  flame.add(innerFlame);
  g.add(flame);

  const campGlow = new THREE.PointLight(0xffb84d, 3.6, 26, 1.5);
  campGlow.position.set(0, 2.4, 0);
  g.add(campGlow);

  // Carved golden-rune perimeter ward stones with stepped plinths
  const runeMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    emissive: 0xb48a20,
    emissiveIntensity: 0.75,
    roughness: 0.24,
    metalness: 0.85,
  });
  const wardGemMat = new THREE.MeshStandardMaterial({
    color: 0x2dd4bf,
    emissive: 0x14b8a6,
    emissiveIntensity: 1.15,
    roughness: 0.18,
  });
  for (const [wx, wz] of [
    [-10, -7],
    [10, -7],
    [-10, 9],
    [10, 9],
  ]) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.15), stoneMat);
    plinth.position.set(wx, 0.17, wz);
    g.add(plinth);
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.35, 0.75), stoneMat);
    pillar.position.set(wx, 1.35, wz);
    pillar.castShadow = true;
    g.add(pillar);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.16, 0.82), runeMat);
    band.position.set(wx, 2.1, wz);
    g.add(band);
    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), wardGemMat);
    cap.position.set(wx, 2.85, wz);
    g.add(cap);
  }

  return g;
}

export function buildForgottenTemple(
  stoneTex: THREE.Texture,
  stoneBump?: THREE.Texture,
  pbr?: PbrTextureMaps
): THREE.Group {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    normalMap: pbr?.stoneNormal,
    normalScale: pbr?.stoneNormal ? new THREE.Vector2(1.05, 1.05) : undefined,
    bumpMap: pbr?.stoneNormal ? undefined : stoneBump,
    bumpScale: 0.08,
    roughnessMap: pbr?.stoneRoughness,
    roughness: pbr?.stoneRoughness ? 1.0 : 0.86,
    metalness: 0.04,
  });
  const darkStoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    normalMap: pbr?.stoneNormal,
    normalScale: pbr?.stoneNormal ? new THREE.Vector2(1.05, 1.05) : undefined,
    bumpMap: pbr?.stoneNormal ? undefined : stoneBump,
    bumpScale: 0.08,
    roughnessMap: pbr?.stoneRoughness,
    color: 0x7a7668,
    roughness: pbr?.stoneRoughness ? 1.0 : 0.9,
  });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x1e5938, roughness: 0.88 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.22, metalness: 0.88 });
  const conduitMat = new THREE.MeshStandardMaterial({
    color: 0x2dd4bf,
    emissive: 0x0d9488,
    emissiveIntensity: 1.2,
    roughness: 0.18,
  });
  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xea580c,
    emissiveIntensity: 1.8,
    roughness: 0.3,
  });

  // Stepped Mayan pyramid tiers with golden architectural inlays & moss patches
  const tierSpecs = [
    { w: 18, h: 2.2, y: 1.1 },
    { w: 12.5, h: 2.4, y: 3.4 },
    { w: 7.2, h: 2.4, y: 5.8 },
  ];
  for (const t of tierSpecs) {
    const tier = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.w), stoneMat);
    tier.position.y = t.y;
    tier.receiveShadow = true;
    tier.castShadow = true;
    g.add(tier);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(t.w + 0.26, 0.24, t.w + 0.26), goldMat);
    trim.position.y = t.y + t.h * 0.5 - 0.05;
    g.add(trim);

    // Corner pilasters for deep relief
    const cOff = t.w * 0.5 - 0.3;
    for (const sx of [-cOff, cOff]) {
      for (const sz of [-cOff, cOff]) {
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.9, t.h + 0.1, 0.9), darkStoneMat);
        pilaster.position.set(sx, t.y, sz);
        g.add(pilaster);
      }
    }
  }

  // Overgrown hanging moss drapes on temple ledges
  for (const [mx, my, mz, mw] of [
    [-5.8, 2.25, 8.9, 2.2],
    [6.1, 2.25, 8.9, 1.9],
    [-4.2, 4.65, 6.2, 1.8],
    [4.4, 4.65, 6.2, 1.5],
    [-8.9, 2.25, -3.5, 2.4],
    [8.9, 2.25, 2.5, 2.1],
  ]) {
    const moss = new THREE.Mesh(new THREE.BoxGeometry(mw, 0.45, 0.38), mossMat);
    moss.position.set(mx, my, mz);
    g.add(moss);
  }

  // Sculpted South Stairway visual steps + golden cheek walls (z=+11 down to z=0)
  const stepCount = 14;
  for (let s = 0; s < stepCount; s++) {
    const frac = s / stepCount;
    const stepY = 0.25 + frac * 6.6;
    const stepZ = 10.6 - frac * 7.8;
    const step = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.5, 0.72), darkStoneMat);
    step.position.set(0, stepY, stepZ);
    step.receiveShadow = true;
    step.castShadow = true;
    g.add(step);
  }
  for (const wx of [-2.45, 2.45]) {
    const balustrade = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 9.2), goldMat);
    balustrade.position.set(wx, 3.65, 6.7);
    balustrade.rotation.x = 0.69;
    g.add(balustrade);
  }

  // Summit sanctuary archway + glowing conduit portal frame
  for (const px of [-2.1, 2.1]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.8, 0.75), stoneMat);
    col.position.set(px, 8.4, -1.6);
    col.castShadow = true;
    g.add(col);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.68, 1.15), stoneMat);
  lintel.position.set(0, 10.0, -1.6);
  lintel.castShadow = true;
  g.add(lintel);
  const lintelGold = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.18, 1.25), goldMat);
  lintelGold.position.set(0, 10.38, -1.6);
  g.add(lintelGold);

  // Floating turquoise gravity ring above temple apex
  const apexRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.12, 10, 36), conduitMat);
  apexRing.rotation.x = Math.PI / 2;
  apexRing.position.y = 9.5;
  g.add(apexRing);

  // Twin ceremonial braziers at stairs base
  for (const bx of [-3.6, 3.6]) {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 1.3, 8), darkStoneMat);
    pedestal.position.set(bx, 0.65, 10.5);
    g.add(pedestal);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.35, 0.4, 8), goldMat);
    bowl.position.set(bx, 1.45, 10.5);
    g.add(bowl);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.85, 7), emberMat);
    flame.position.set(bx, 2.0, 10.5);
    g.add(flame);
  }

  // Decorative corner obelisks
  for (const sx of [-7.5, 7.5]) {
    for (const sz of [-7.5, 7.5]) {
      const ob = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.2, 1.1), stoneMat);
      ob.position.set(sx, 2.1, sz);
      ob.castShadow = true;
      g.add(ob);
      const collar = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.22, 1.25), goldMat);
      collar.position.set(sx, 4.0, sz);
      g.add(collar);
      const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldMat);
      cap.position.set(sx, 4.65, sz);
      g.add(cap);
    }
  }

  return g;
}

export function buildCliffOutcrop(
  cliffTex: THREE.Texture,
  cliffNormal?: THREE.Texture
): THREE.Group {
  const g = new THREE.Group();
  const cliffMat = new THREE.MeshStandardMaterial({
    map: cliffTex,
    normalMap: cliffNormal,
    normalScale: cliffNormal ? new THREE.Vector2(1.35, 1.35) : undefined,
    roughness: 0.88,
    metalness: 0.05,
  });
  const mossShelfMat = new THREE.MeshStandardMaterial({
    color: 0x1f4722,
    roughness: 0.94,
    metalness: 0.02,
  });

  // Main stratified rock face
  const mainBlock = new THREE.Mesh(new THREE.DodecahedronGeometry(8.5, 1), cliffMat);
  mainBlock.scale.set(1.4, 2.2, 0.9);
  mainBlock.position.y = 8.5;
  mainBlock.castShadow = true;
  mainBlock.receiveShadow = true;
  g.add(mainBlock);

  // Stepped horizontal rock shelves with overhanging moss
  for (const [ly, lz, sx, sy] of [
    [4.2, 2.4, 1.2, 0.8],
    [9.5, 1.8, 1.1, 0.7],
    [14.2, 0.8, 0.9, 0.6],
  ]) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(10 * sx, 1.2 * sy, 4.2), cliffMat);
    shelf.position.set(0, ly, lz);
    shelf.rotation.x = 0.12;
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    g.add(shelf);

    const moss = new THREE.Mesh(new THREE.BoxGeometry(9.6 * sx, 0.25, 3.8), mossShelfMat);
    moss.position.set(0, ly + 0.65 * sy, lz);
    g.add(moss);
  }

  // Flanking buttress boulders
  for (const bx of [-7.2, 7.2]) {
    const buttress = new THREE.Mesh(new THREE.DodecahedronGeometry(5.2, 1), cliffMat);
    buttress.scale.set(0.9, 1.6, 0.85);
    buttress.position.set(bx, 5.0, 1.2);
    buttress.castShadow = true;
    buttress.receiveShadow = true;
    g.add(buttress);
  }

  return g;
}

export function buildSanctuarySacredTree(
  barkTex: THREE.Texture,
  barkBump?: THREE.Texture,
  foliageTex?: THREE.Texture,
  foliageBump?: THREE.Texture,
  pbr?: PbrTextureMaps
): THREE.Group {
  const g = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({
    map: barkTex,
    normalMap: pbr?.barkNormal,
    normalScale: pbr?.barkNormal ? new THREE.Vector2(0.95, 0.95) : undefined,
    bumpMap: pbr?.barkNormal ? undefined : barkBump,
    bumpScale: 0.08,
    roughnessMap: pbr?.barkRoughness,
    color: 0x5c422f,
    roughness: pbr?.barkRoughness ? 1.0 : 0.9,
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    map: foliageTex,
    normalMap: pbr?.foliageNormal,
    normalScale: pbr?.foliageNormal ? new THREE.Vector2(0.75, 0.75) : undefined,
    bumpMap: pbr?.foliageNormal ? undefined : foliageBump,
    bumpScale: 0.07,
    color: foliageTex ? 0x62c48c : 0x14855c,
    emissive: 0x064e3b,
    emissiveIntensity: 0.3,
    roughness: 0.72,
    alphaTest: foliageTex ? 0.36 : 0,
    side: foliageTex ? THREE.DoubleSide : THREE.FrontSide,
  });
  const vineMat = new THREE.MeshStandardMaterial({
    color: 0x1e6f49,
    roughness: 0.82,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x2dd4bf,
    emissive: 0x14b8a6,
    emissiveIntensity: 1.25,
    roughness: 0.16,
  });

  // Sculpted lower & upper trunk with natural taper
  const lowerTrunk = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 2.25, 4.2, 12), barkMat);
  lowerTrunk.position.y = 2.0;
  lowerTrunk.castShadow = true;
  lowerTrunk.receiveShadow = true;
  g.add(lowerTrunk);

  const upperTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.32, 3.6, 10), barkMat);
  upperTrunk.position.set(0.15, 5.4, -0.1);
  upperTrunk.rotation.z = -0.06;
  upperTrunk.castShadow = true;
  upperTrunk.receiveShadow = true;
  g.add(upperTrunk);

  // Tapered organic buttress roots gripping the earth
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + (i % 2) * 0.18;
    const rootLen = 2.4 + (i % 2) * 0.55;
    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.78, rootLen, 7), barkMat);
    root.position.set(Math.cos(a) * 1.95, 0.75, Math.sin(a) * 1.95);
    root.rotation.order = 'YXZ';
    root.rotation.y = -a + Math.PI / 2;
    root.rotation.x = 0.78;
    root.castShadow = true;
    root.receiveShadow = true;
    g.add(root);
  }

  // Forked boughs supporting the canopy
  const boughSpecs: Array<[number, number, number, number, number, number]> = [
    [-1.4, 6.4, 0.7, 0.25, 0.65, 3.6],
    [1.5, 6.5, -0.6, -0.22, -0.62, 3.5],
    [0.2, 6.3, -1.4, -0.65, 0.12, 3.4],
    [-0.2, 6.2, 1.35, 0.6, -0.15, 3.2],
  ];
  for (const [bx, by, bz, rx, rz, len] of boughSpecs) {
    const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.68, len, 8), barkMat);
    bough.position.set(bx, by, bz);
    bough.rotation.set(rx, 0, rz);
    bough.castShadow = true;
    g.add(bough);
  }

  // Multi-tiered sculpted organic canopy lobes with subtle vertex irregularity
  const lobeGeo = new THREE.IcosahedronGeometry(1, 2);
  const pos = lobeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const ripple =
      1 +
      0.13 * Math.sin(vx * 3.1 + vy * 2.4) +
      0.09 * Math.cos(vz * 3.5 - vx * 1.9);
    pos.setXYZ(i, vx * ripple, vy * ripple, vz * ripple);
  }
  lobeGeo.computeVertexNormals();

  for (const [cx, cy, cz, rx, ry, rz] of [
    [0, 8.7, 0, 4.3, 2.35, 4.1],
    [-2.7, 7.6, 1.3, 3.1, 1.85, 2.9],
    [2.8, 7.8, -1.1, 3.0, 1.9, 2.8],
    [0.3, 7.4, -2.7, 2.8, 1.75, 2.8],
    [-0.4, 7.3, 2.5, 2.6, 1.65, 2.5],
    [0.1, 9.7, 0.2, 2.6, 1.55, 2.5],
  ]) {
    const crown = new THREE.Mesh(lobeGeo, canopyMat);
    crown.position.set(cx, cy, cz);
    crown.scale.set(rx, ry, rz);
    crown.rotation.y = cx * 0.7 + cz * 0.5;
    crown.castShadow = true;
    crown.receiveShadow = true;
    g.add(crown);
  }

  // Hanging jungle vines & bioluminescent sanctuary crystals
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.25;
    const rad = 3.1 + (i % 2) * 0.65;
    const vx = Math.cos(a) * rad;
    const vz = Math.sin(a) * rad;
    const vineLen = 1.6 + (i % 3) * 0.55;
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.025, vineLen, 5), vineMat);
    vine.position.set(vx, 6.2 - vineLen * 0.5, vz);
    g.add(vine);

    if (i % 2 === 0 || i === 1) {
      const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), crystalMat);
      drop.position.set(vx, 6.0 - vineLen, vz);
      g.add(drop);
    }
  }

  const light = new THREE.PointLight(0x2dd4bf, 3.0, 24, 1.5);
  light.position.set(0, 4.5, 0);
  g.add(light);

  return g;
}
