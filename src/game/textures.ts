import * as THREE from 'three';

function createCanvas(size = 256): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createGrassTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256);
  ctx.fillStyle = '#2d5a34';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const r = 1 + Math.random() * 3;
    ctx.fillStyle = i % 3 === 0 ? '#3a703f' : i % 3 === 1 ? '#234929' : '#4a7a42';
    ctx.fillRect(x, y, r, r * 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStoneTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256);
  ctx.fillStyle = '#6c6858';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#474337';
  ctx.lineWidth = 4;
  for (let y = 0; y < 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
    const offset = (y / 64) % 2 === 0 ? 0 : 64;
    for (let x = offset; x < 256; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 64);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,240,0.06)' : 'rgba(25,35,20,0.12)';
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 4, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBarkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(128);
  ctx.fillStyle = '#4d3626';
  ctx.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 6) {
    ctx.fillStyle = x % 12 === 0 ? '#3b271b' : '#5e422e';
    ctx.fillRect(x, 0, 3, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWaterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(256);
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#148f8b');
  grad.addColorStop(0.5, '#1fa89e');
  grad.addColorStop(1, '#127a7e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(220, 255, 250, 0.26)';
  ctx.lineWidth = 2;
  for (let y = 16; y < 256; y += 32) {
    ctx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const py = y + Math.sin((x / 256) * Math.PI * 4) * 5;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 10);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(128);
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.2)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
