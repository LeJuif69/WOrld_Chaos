import * as THREE from 'three';

function createCanvas(size = 256): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fillWrappedCircle(
  ctx: CanvasRenderingContext2D,
  size: number,
  x: number,
  y: number,
  r: number,
  color: string
): void {
  ctx.fillStyle = color;
  for (let ox = -1; ox <= 1; ox++) {
    for (let oy = -1; oy <= 1; oy++) {
      const cx = x + ox * size;
      const cy = y + oy * size;
      if (cx + r < 0 || cx - r > size || cy + r < 0 || cy - r > size) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function createGrassTexture(maxAnisotropy: number, size = 512): THREE.CanvasTexture {
  const baseSize = 512;
  const scale = size / baseSize;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(1042);

  ctx.save();
  ctx.scale(scale, scale);

  // Rich natural forest humus & deep moss underlayer
  ctx.fillStyle = '#234427';
  ctx.fillRect(0, 0, baseSize, baseSize);

  // Seamless organic moss beds, sunlit clearings, and damp forest earth pockets
  const patchColors = [
    'rgba(19, 54, 30, 0.34)',
    'rgba(48, 92, 46, 0.28)',
    'rgba(74, 96, 44, 0.24)',
    'rgba(60, 52, 34, 0.22)',
    'rgba(28, 72, 44, 0.3)',
  ];
  for (let i = 0; i < 115; i++) {
    fillWrappedCircle(
      ctx,
      baseSize,
      rand() * baseSize,
      rand() * baseSize,
      14 + rand() * 42,
      patchColors[i % patchColors.length]
    );
  }

  // Organic curved grass blades & forest-floor tufts (wrapped across tile borders)
  const bladeColors = ['#2d6435', '#3b7840', '#214d28', '#4c8643', '#618842', '#356c47'];
  for (let i = 0; i < 4600; i++) {
    const x = rand() * baseSize;
    const y = rand() * baseSize;
    const w = 1.0 + rand() * 2.0;
    const h = 4 + rand() * 8;
    const lean = (rand() - 0.5) * 4.5;
    const midLean = lean * 0.45 + (rand() - 0.5) * 1.6;
    ctx.strokeStyle = bladeColors[i % bladeColors.length];
    ctx.lineWidth = w;
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const px = x + ox * baseSize;
        const py = y + oy * baseSize;
        if (px < -12 || px > baseSize + 12 || py < -12 || py > baseSize + 12) continue;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + midLean, py - h * 0.55, px + lean, py - h);
        ctx.stroke();
      }
    }
  }

  // Tiny wild clover clusters & broad forest-floor leaf rosettes
  for (let i = 0; i < 160; i++) {
    const cx = rand() * baseSize;
    const cy = rand() * baseSize;
    const leafCol = i % 3 === 0 ? 'rgba(84, 134, 62, 0.42)' : 'rgba(38, 96, 52, 0.42)';
    const r = 2.0 + rand() * 2.6;
    for (let l = 0; l < 3; l++) {
      const a = (l / 3) * Math.PI * 2 + rand() * 0.5;
      fillWrappedCircle(ctx, baseSize, cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9, r * 0.72, leafCol);
    }
  }

  // Subtle fallen ochre leaves & mineral humus specks
  for (let i = 0; i < 105; i++) {
    const x = rand() * baseSize;
    const y = rand() * baseSize;
    fillWrappedCircle(
      ctx,
      baseSize,
      x,
      y,
      1.4 + rand() * 2.3,
      i % 4 === 0 ? 'rgba(168, 128, 52, 0.32)' : 'rgba(78, 68, 48, 0.28)'
    );
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 22);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createGrassBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(1043);
  ctx.fillStyle = '#787878';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 75; i++) {
    fillWrappedCircle(
      ctx,
      size,
      rand() * size,
      rand() * size,
      10 + rand() * 22,
      i % 2 === 0 ? 'rgba(205,205,205,0.18)' : 'rgba(55,55,55,0.2)'
    );
  }
  for (let i = 0; i < 1900; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(225,225,225,0.24)' : 'rgba(50,50,50,0.24)';
    ctx.fillRect(x, y, 2, 4);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(22, 22);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStoneTexture(maxAnisotropy: number, size = 512): THREE.CanvasTexture {
  const baseSize = 512;
  const scale = size / baseSize;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(2042);

  ctx.save();
  ctx.scale(scale, scale);

  // Ancient weathered sandstone base
  ctx.fillStyle = '#5e5a4b';
  ctx.fillRect(0, 0, baseSize, baseSize);

  const rowH = 64;
  const cols = 4;
  const colW = baseSize / cols;

  // Individual blocks with subtle tone variation + highlight bevel
  for (let r = 0; r < baseSize / rowH; r++) {
    const y = r * rowH;
    const offset = r % 2 === 0 ? 0 : colW * 0.5;
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const tone = 82 + Math.floor(rand() * 28);
      const rCol = Math.min(255, tone + 14);
      const gCol = Math.min(255, tone + 9);
      const bCol = Math.max(0, tone - 6);
      ctx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
      ctx.fillRect(x + 3, y + 3, colW - 6, rowH - 6);

      // Top/Left warm sunlit bevel edge
      ctx.fillStyle = 'rgba(245, 229, 184, 0.14)';
      ctx.fillRect(x + 3, y + 3, colW - 6, 4);
      ctx.fillRect(x + 3, y + 3, 3, rowH - 6);

      // Bottom/Right shadow chamfer
      ctx.fillStyle = 'rgba(18, 22, 16, 0.28)';
      ctx.fillRect(x + 3, y + rowH - 7, colW - 6, 4);
      ctx.fillRect(x + colW - 7, y + 3, 4, rowH - 6);
    }
  }

  // Mortar crevices & weathering fractures
  ctx.strokeStyle = '#343228';
  ctx.lineWidth = 4;
  for (let y = 0; y <= baseSize; y += rowH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(baseSize, y);
    ctx.stroke();
    const offset = (y / rowH) % 2 === 0 ? 0 : colW * 0.5;
    for (let x = offset; x < baseSize + colW; x += colW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  // Fine mineral pitting & chiseled grain
  for (let i = 0; i < 3200; i++) {
    const x = rand() * baseSize;
    const y = rand() * baseSize;
    const s = 1 + rand() * 3;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(250, 244, 220, 0.08)' : 'rgba(20, 26, 18, 0.14)';
    ctx.fillRect(x, y, s, s);
  }

  // Creeping jungle moss along crevices
  for (let i = 0; i < 42; i++) {
    const my = Math.floor(rand() * (baseSize / rowH)) * rowH + (rand() - 0.5) * 8;
    const mx = rand() * baseSize;
    fillWrappedCircle(ctx, baseSize, mx, my, 5 + rand() * 14, 'rgba(31, 96, 56, 0.34)');
  }

  // Subtle carved antique-gold flecks in worn grooves
  for (let i = 0; i < 24; i++) {
    const gx = rand() * baseSize;
    const gy = Math.floor(rand() * (baseSize / rowH)) * rowH + 14 + rand() * 36;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.18)';
    ctx.fillRect(gx, gy, 8 + rand() * 14, 2);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createStoneBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(2043);

  ctx.fillStyle = '#a8a8a8';
  ctx.fillRect(0, 0, size, size);

  const rowH = 64;
  const colW = 128;

  // Deep dark mortar joints for crisp PBR relief
  ctx.strokeStyle = '#202020';
  ctx.lineWidth = 6;
  for (let y = 0; y <= size; y += rowH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
    const offset = (y / rowH) % 2 === 0 ? 0 : colW * 0.5;
    for (let x = offset; x < size + colW; x += colW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  // Chiseled pitting across blocks
  for (let i = 0; i < 2800; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(30,30,30,0.22)';
    ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 3, 2 + rand() * 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBarkTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(3042);

  ctx.fillStyle = '#473122';
  ctx.fillRect(0, 0, size, size);

  // Organic sinuous bark furrows (seamless vertically & horizontally)
  const ridges = 32;
  for (let i = 0; i < ridges; i++) {
    const baseX = (i / ridges) * size;
    const phase = rand() * Math.PI * 2;
    const isDark = i % 2 === 0;
    ctx.strokeStyle = isDark ? 'rgba(34, 21, 13, 0.72)' : 'rgba(104, 73, 50, 0.58)';
    ctx.lineWidth = 2.5 + rand() * 3.5;

    for (const ox of [-size, 0, size]) {
      ctx.beginPath();
      for (let y = 0; y <= size; y += 8) {
        const wave = Math.sin((y / size) * Math.PI * 2 + phase) * 4.5;
        const px = baseX + ox + wave;
        if (y === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
    }
  }

  // Fine fibrous bark grain & subtle moss/lichen spots
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = i % 3 === 0 ? 'rgba(24, 15, 9, 0.25)' : 'rgba(128, 95, 68, 0.16)';
    ctx.fillRect(rand() * size, rand() * size, 1.5, 6 + rand() * 10);
  }
  for (let i = 0; i < 24; i++) {
    fillWrappedCircle(ctx, size, rand() * size, rand() * size, 4 + rand() * 8, 'rgba(36, 92, 52, 0.28)');
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createBarkBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(3043);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const ridges = 32;
  for (let i = 0; i < ridges; i++) {
    const baseX = (i / ridges) * size;
    const phase = rand() * Math.PI * 2;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(30,30,30,0.75)' : 'rgba(225,225,225,0.55)';
    ctx.lineWidth = 3 + rand() * 3;
    for (const ox of [-size, 0, size]) {
      ctx.beginPath();
      for (let y = 0; y <= size; y += 8) {
        const px = baseX + ox + Math.sin((y / size) * Math.PI * 2 + phase) * 4.5;
        if (y === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createObsidianTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(4042);

  ctx.fillStyle = '#1b1626';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 45; i++) {
    fillWrappedCircle(
      ctx,
      size,
      rand() * size,
      rand() * size,
      10 + rand() * 24,
      i % 2 === 0 ? 'rgba(48, 34, 68, 0.35)' : 'rgba(12, 10, 18, 0.42)'
    );
  }

  // Subtle fractured magma/chaos hairline veins
  ctx.strokeStyle = 'rgba(225, 29, 72, 0.24)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) {
    let x = rand() * size;
    let y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      x += (rand() - 0.5) * 42;
      y += (rand() - 0.5) * 42;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWaterTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(5042);

  // Seamless base turquoise-emerald water
  ctx.fillStyle = '#148e88';
  ctx.fillRect(0, 0, size, size);

  // Subtle caustic cells (wrapped for seamless scrolling!)
  for (let i = 0; i < 48; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const rad = 14 + rand() * 26;
    fillWrappedCircle(
      ctx,
      size,
      cx,
      cy,
      rad,
      i % 2 === 0 ? 'rgba(45, 212, 191, 0.16)' : 'rgba(12, 92, 96, 0.22)'
    );
  }

  // Periodic seamless ripples
  ctx.strokeStyle = 'rgba(204, 251, 241, 0.28)';
  ctx.lineWidth = 2;
  for (let y = 16; y < size; y += 32) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 8) {
      const py = y + Math.sin((x / size) * Math.PI * 4) * 5;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function bleedAlphaCutoutRgb(
  ctx: CanvasRenderingContext2D,
  size: number,
  rFill: number,
  gFill: number,
  bFill: number
): void {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 16) {
      d[i] = rFill;
      d[i + 1] = gFill;
      d[i + 2] = bFill;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawDetailedLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  len: number,
  wid: number,
  angle: number,
  baseFill: string,
  tipFill: string,
  veinColor: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const grad = ctx.createLinearGradient(0, -len * 0.52, 0, len * 0.52);
  grad.addColorStop(0, tipFill);
  grad.addColorStop(0.55, baseFill);
  grad.addColorStop(1, baseFill);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.54);
  ctx.bezierCurveTo(wid * 0.62, -len * 0.24, wid * 0.68, len * 0.22, 0, len * 0.54);
  ctx.bezierCurveTo(-wid * 0.68, len * 0.22, -wid * 0.62, -len * 0.24, 0, -len * 0.54);
  ctx.fill();

  // Subtle leaf margin highlight
  ctx.strokeStyle = 'rgba(224, 248, 198, 0.16)';
  ctx.lineWidth = Math.max(0.8, wid * 0.05);
  ctx.stroke();

  // Central midrib vein
  ctx.strokeStyle = veinColor;
  ctx.lineWidth = Math.max(1, wid * 0.085);
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.44);
  ctx.lineTo(0, len * 0.46);
  ctx.stroke();

  // Secondary lateral veins
  ctx.lineWidth = Math.max(0.7, wid * 0.045);
  for (let v = -2; v <= 2; v++) {
    const vy = v * (len * 0.14);
    const spanX = wid * (0.44 - Math.abs(v) * 0.09);
    ctx.beginPath();
    ctx.moveTo(0, vy + len * 0.05);
    ctx.lineTo(spanX, vy - len * 0.08);
    ctx.moveTo(0, vy + len * 0.05);
    ctx.lineTo(-spanX, vy - len * 0.08);
    ctx.stroke();
  }
  ctx.restore();
}

export function createFoliageTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(6042);

  // Transparent background for crisp dappled air gaps between outer leaf clusters
  ctx.clearRect(0, 0, size, size);

  const drawWrappedSpray = (
    cx: number,
    cy: number,
    len: number,
    wid: number,
    angle: number,
    baseFill: string,
    tipFill: string,
    veinColor: string
  ) => {
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const px = cx + ox * size;
        const py = cy + oy * size;
        if (px + len < 0 || px - len > size || py + len < 0 || py - len > size) continue;
        drawDetailedLeaf(ctx, px, py, len, wid, angle, baseFill, tipFill, veinColor);
      }
    }
  };

  // Inner shaded foliage layer (creates dense core with organic openings around edges)
  const innerBase = ['#3f6e3d', '#487a43', '#366138'];
  const innerTip = ['#588f50', '#639e58', '#4c8049'];
  for (let i = 0; i < 165; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    // Leave subtle deterministic clearings so ~20% airy skylight pockets remain
    if (Math.sin(cx * 0.032) * Math.cos(cy * 0.032) > 0.54) continue;
    drawWrappedSpray(
      cx,
      cy,
      28 + rand() * 24,
      15 + rand() * 13,
      rand() * Math.PI * 2,
      innerBase[i % innerBase.length],
      innerTip[i % innerTip.length],
      'rgba(24, 48, 26, 0.42)'
    );
  }

  // Detailed outer sunlit tropical leaves with crisp veins
  const outerBase = ['#6ba960', '#7ab86b', '#5d9957', '#83c26e'];
  const outerTip = ['#9ed983', '#b3e593', '#8ec979', '#c2eb9e'];
  for (let i = 0; i < 245; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    if (Math.sin(cx * 0.032) * Math.cos(cy * 0.032) > 0.62) continue;
    drawWrappedSpray(
      cx,
      cy,
      20 + rand() * 22,
      11 + rand() * 11,
      rand() * Math.PI * 2,
      outerBase[i % outerBase.length],
      outerTip[i % outerTip.length],
      'rgba(225, 248, 198, 0.36)'
    );
  }

  // Eliminate dark mipmap halo fringes on transparent alpha-cutout pixels
  bleedAlphaCutoutRgb(ctx, size, 88, 146, 78);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFrondTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(6099);

  ctx.clearRect(0, 0, size, size);

  // Central rachis stem along u = 0.5 (x = 256)
  const stemGrad = ctx.createLinearGradient(0, size, 0, 0);
  stemGrad.addColorStop(0, '#5a8c44');
  stemGrad.addColorStop(1, '#9cd16f');
  ctx.strokeStyle = stemGrad;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(size * 0.5, size * 0.98);
  ctx.lineTo(size * 0.5, size * 0.05);
  ctx.stroke();

  // Paired pinnate leaflets radiating outward with natural gaps between leaflets
  const pairs = 15;
  for (let p = 0; p < pairs; p++) {
    const frac = p / (pairs - 1); // 0 = base (bottom in canvas, v=0), 1 = tip
    const py = size * (0.9 - frac * 0.8);
    const widthEnvelope = Math.sin(Math.pow(frac, 0.72) * Math.PI * 0.92 + 0.18);
    const leafletLen = 68 + widthEnvelope * 155;
    const leafletWid = 16 + widthEnvelope * 14;

    for (const side of [-1, 1]) {
      const jitter = (rand() - 0.5) * 0.08;
      const angle = side * (1.06 - frac * 0.36 + jitter);
      const baseX = size * 0.5 + side * 3;
      const midX = baseX + Math.sin(angle) * leafletLen * 0.52;
      const midY = py - Math.cos(angle) * leafletLen * 0.52;
      drawDetailedLeaf(
        ctx,
        midX,
        midY,
        leafletLen,
        leafletWid,
        angle,
        p % 2 === 0 ? '#6db05b' : '#5ea053',
        '#a6de86',
        'rgba(225, 248, 198, 0.34)'
      );
    }
  }

  // Terminal tip leaflet
  drawDetailedLeaf(
    ctx,
    size * 0.5,
    size * 0.075,
    66,
    22,
    0,
    '#79ba64',
    '#b5e894',
    'rgba(225, 248, 198, 0.34)'
  );

  bleedAlphaCutoutRgb(ctx, size, 94, 152, 82);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createFoliageBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(6043);
  ctx.fillStyle = '#484848';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 320; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const len = 10 + rand() * 15;
    const wid = 5 + rand() * 7;
    const angle = rand() * Math.PI * 2;
    const shade = 115 + Math.floor(rand() * 130);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const px = cx + ox * size;
        const py = cy + oy * size;
        if (px + len < 0 || px - len > size || py + len < 0 || py - len > size) continue;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.beginPath();
        ctx.moveTo(0, -len * 0.5);
        ctx.quadraticCurveTo(wid * 0.65, 0, 0, len * 0.5);
        ctx.quadraticCurveTo(-wid * 0.65, 0, 0, -len * 0.5);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -len * 0.4);
        ctx.lineTo(0, len * 0.4);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(128);
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function heightCanvasToNormalTexture(
  srcCanvas: HTMLCanvasElement,
  strength: number,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const srcCtx = srcCanvas.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, w, h).data;

  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    lum[i] = (0.299 * srcData[p] + 0.587 * srcData[p + 1] + 0.114 * srcData[p + 2]) / 255;
  }

  const [outCanvas, outCtx] = createCanvas(w);
  const outImg = outCtx.createImageData(w, h);
  const out = outImg.data;

  for (let y = 0; y < h; y++) {
    const ym = (y - 1 + h) % h;
    const yp = (y + 1) % h;
    for (let x = 0; x < w; x++) {
      const xm = (x - 1 + w) % w;
      const xp = (x + 1) % w;

      const tl = lum[ym * w + xm];
      const t = lum[ym * w + x];
      const tr = lum[ym * w + xp];
      const l = lum[y * w + xm];
      const r = lum[y * w + xp];
      const bl = lum[yp * w + xm];
      const b = lum[yp * w + x];
      const br = lum[yp * w + xp];

      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);

      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * w + x) * 4;
      out[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      out[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      out[idx + 3] = 255;
    }
  }
  outCtx.putImageData(outImg, 0, 0);

  const tex = new THREE.CanvasTexture(outCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function heightCanvasToRoughnessTexture(
  srcCanvas: HTMLCanvasElement,
  minRough: number,
  maxRough: number,
  invert: boolean,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const srcCtx = srcCanvas.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, w, h).data;

  const [outCanvas, outCtx] = createCanvas(w);
  const outImg = outCtx.createImageData(w, h);
  const out = outImg.data;

  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    let t = (0.299 * srcData[p] + 0.587 * srcData[p + 1] + 0.114 * srcData[p + 2]) / 255;
    if (invert) t = 1 - t;
    const val = Math.round((minRough + t * (maxRough - minRough)) * 255);
    out[p] = val;
    out[p + 1] = val;
    out[p + 2] = val;
    out[p + 3] = 255;
  }
  outCtx.putImageData(outImg, 0, 0);

  const tex = new THREE.CanvasTexture(outCanvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createGrassHeightCanvas(): HTMLCanvasElement {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(1043);
  ctx.fillStyle = '#787878';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 85; i++) {
    fillWrappedCircle(
      ctx,
      size,
      rand() * size,
      rand() * size,
      10 + rand() * 22,
      i % 2 === 0 ? 'rgba(205,205,205,0.2)' : 'rgba(55,55,55,0.22)'
    );
  }
  for (let i = 0; i < 2200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(232,232,232,0.28)' : 'rgba(46,46,46,0.26)';
    ctx.fillRect(x, y, 2, 4);
  }
  return canvas;
}

export function createGrassNormalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return heightCanvasToNormalTexture(createGrassHeightCanvas(), 2.2, maxAnisotropy, 22, 22);
}

export function createGrassRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return heightCanvasToRoughnessTexture(createGrassHeightCanvas(), 0.72, 0.98, true, maxAnisotropy, 22, 22);
}

function createStoneHeightCanvas(): HTMLCanvasElement {
  const size = 512;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(2043);
  ctx.fillStyle = '#b0b0b0';
  ctx.fillRect(0, 0, size, size);

  const rowH = 64;
  const colW = 128;
  for (let r = 0; r < size / rowH; r++) {
    const y = r * rowH;
    const offset = r % 2 === 0 ? 0 : colW * 0.5;
    for (let c = -1; c <= 4; c++) {
      const x = c * colW + offset;
      const v = 165 + Math.floor(rand() * 35);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x + 4, y + 4, colW - 8, rowH - 8);
    }
  }

  ctx.strokeStyle = '#1d1d1d';
  ctx.lineWidth = 6;
  for (let y = 0; y <= size; y += rowH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
    const offset = (y / rowH) % 2 === 0 ? 0 : colW * 0.5;
    for (let x = offset; x < size + colW; x += colW) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    }
  }

  for (let i = 0; i < 3200; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(25,25,25,0.22)';
    ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 3, 2 + rand() * 3);
  }
  return canvas;
}

export function createStoneNormalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return heightCanvasToNormalTexture(createStoneHeightCanvas(), 2.8, maxAnisotropy);
}

export function createStoneRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return heightCanvasToRoughnessTexture(createStoneHeightCanvas(), 0.62, 0.96, true, maxAnisotropy);
}

function createBarkHeightCanvas(): HTMLCanvasElement {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(3043);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const ridges = 32;
  for (let i = 0; i < ridges; i++) {
    const baseX = (i / ridges) * size;
    const phase = rand() * Math.PI * 2;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(28,28,28,0.78)' : 'rgba(228,228,228,0.58)';
    ctx.lineWidth = 3 + rand() * 3;
    for (const ox of [-size, 0, size]) {
      ctx.beginPath();
      for (let y = 0; y <= size; y += 8) {
        const px = baseX + ox + Math.sin((y / size) * Math.PI * 2 + phase) * 4.5;
        if (y === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
    }
  }
  return canvas;
}

export function createBarkNormalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return heightCanvasToNormalTexture(createBarkHeightCanvas(), 2.6, maxAnisotropy);
}

export function createBarkRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return heightCanvasToRoughnessTexture(createBarkHeightCanvas(), 0.72, 0.98, true, maxAnisotropy);
}

function createObsidianHeightCanvas(): HTMLCanvasElement {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(4043);
  ctx.fillStyle = '#909090';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 65; i++) {
    const shade = 95 + Math.floor(rand() * 110);
    fillWrappedCircle(ctx, size, rand() * size, rand() * size, 8 + rand() * 22, `rgba(${shade},${shade},${shade},0.35)`);
  }
  ctx.strokeStyle = '#202020';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    let x = rand() * size;
    let y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += (rand() - 0.5) * 44;
      y += (rand() - 0.5) * 44;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return canvas;
}

export function createObsidianNormalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return heightCanvasToNormalTexture(createObsidianHeightCanvas(), 2.5, maxAnisotropy);
}

export function createObsidianRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  return heightCanvasToRoughnessTexture(createObsidianHeightCanvas(), 0.34, 0.82, true, maxAnisotropy);
}

export function createFoliageNormalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(6043);
  ctx.fillStyle = '#484848';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 320; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const len = 10 + rand() * 15;
    const wid = 5 + rand() * 7;
    const angle = rand() * Math.PI * 2;
    const shade = 115 + Math.floor(rand() * 130);
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const px = cx + ox * size;
        const py = cy + oy * size;
        if (px + len < 0 || px - len > size || py + len < 0 || py - len > size) continue;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(angle);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.beginPath();
        ctx.moveTo(0, -len * 0.5);
        ctx.quadraticCurveTo(wid * 0.65, 0, 0, len * 0.5);
        ctx.quadraticCurveTo(-wid * 0.65, 0, 0, -len * 0.5);
        ctx.fill();
        ctx.restore();
      }
    }
  }
  return heightCanvasToNormalTexture(canvas, 1.85, maxAnisotropy, 2, 2);
}

export function createWaterNormalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const img = ctx.createImageData(size, size);
  const out = img.data;
  const tau = Math.PI * 2;

  for (let y = 0; y < size; y++) {
    const v = (y / size) * tau;
    for (let x = 0; x < size; x++) {
      const u = (x / size) * tau;
      // Seamless analytical multi-harmonic wave derivatives
      const dx =
        Math.cos(u * 3 + v * 2) * 0.42 +
        Math.cos(u * 5 - v * 4) * 0.28 +
        Math.cos(u * 7 + v * 6) * 0.16;
      const dy =
        Math.cos(v * 3 - u * 2) * 0.42 +
        Math.sin(u * 4 + v * 5) * 0.28 +
        Math.cos(v * 8 - u * 3) * 0.16;

      let nx = -dx * 0.35;
      let ny = -dy * 0.35;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      const idx = (y * size + x) * 4;
      out[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      out[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      out[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      out[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 14);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createWaterfallTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(5088);

  const baseGrad = ctx.createLinearGradient(0, 0, size, 0);
  baseGrad.addColorStop(0, 'rgba(13, 148, 136, 0.35)');
  baseGrad.addColorStop(0.2, 'rgba(45, 212, 191, 0.82)');
  baseGrad.addColorStop(0.5, 'rgba(153, 246, 228, 0.92)');
  baseGrad.addColorStop(0.8, 'rgba(45, 212, 191, 0.82)');
  baseGrad.addColorStop(1, 'rgba(13, 148, 136, 0.35)');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Seamless vertical water rush streaks & foam ribbons
  for (let i = 0; i < 160; i++) {
    const x = 14 + rand() * (size - 28);
    const y = rand() * size;
    const h = 24 + rand() * 68;
    const w = 1.5 + rand() * 3.8;
    const bright = i % 3 === 0 ? 'rgba(240, 253, 250, 0.55)' : 'rgba(94, 234, 212, 0.38)';
    ctx.fillStyle = bright;
    for (const oy of [-size, 0, size]) {
      if (y + oy + h < 0 || y + oy > size) continue;
      ctx.fillRect(x, y + oy, w, h);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2.2);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createSunbeamTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const vert = ctx.createLinearGradient(0, 0, 0, h);
  vert.addColorStop(0, 'rgba(255, 232, 168, 0.48)');
  vert.addColorStop(0.35, 'rgba(252, 211, 118, 0.28)');
  vert.addColorStop(0.75, 'rgba(245, 190, 90, 0.09)');
  vert.addColorStop(1, 'rgba(245, 190, 90, 0.0)');
  ctx.fillStyle = vert;
  ctx.fillRect(0, 0, w, h);

  // Multiply smooth radial horizontal edge fade
  ctx.globalCompositeOperation = 'destination-in';
  const horiz = ctx.createLinearGradient(0, 0, w, 0);
  horiz.addColorStop(0, 'rgba(255, 255, 255, 0)');
  horiz.addColorStop(0.25, 'rgba(255, 255, 255, 0.72)');
  horiz.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
  horiz.addColorStop(0.75, 'rgba(255, 255, 255, 0.72)');
  horiz.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = horiz;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSkinTexture(size = 256): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(3317);

  // Warm healthy human skin base tone with subsurface reddish undertone
  const baseGrad = ctx.createRadialGradient(size * 0.45, size * 0.4, 10, size * 0.5, size * 0.5, size * 0.7);
  baseGrad.addColorStop(0, '#f2bf9e');
  baseGrad.addColorStop(0.5, '#e4ab87');
  baseGrad.addColorStop(1, '#c98e6b');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle natural epidermal tone variation and blush
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 24;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(235, 140, 120, 0.08)' : 'rgba(245, 210, 180, 0.09)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Very fine micro-grain
  for (let i = 0; i < 600; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 235, 220, 0.12)' : 'rgba(160, 95, 70, 0.08)';
    ctx.fillRect(x, y, 1.2, 1.2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createSkinNormalTexture(maxAnisotropy: number, size = 256): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(7721);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1800; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const val = Math.floor(115 + rand() * 25);
    ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  return heightCanvasToNormalTexture(canvas, 1.2, maxAnisotropy, 4, 4);
}

export function createLeatherTexture(maxAnisotropy: number, size = 256): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(8842);

  // Deep oiled saddle leather gradient
  ctx.fillStyle = '#452615';
  ctx.fillRect(0, 0, size, size);

  // Leather mottling and oiled patina
  for (let i = 0; i < 75; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 8 + rand() * 26;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(92, 54, 30, 0.35)' : 'rgba(38, 20, 10, 0.38)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Micro-creases & pebble grain
  ctx.strokeStyle = 'rgba(28, 14, 6, 0.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 350; i++) {
    const x = rand() * size;
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 8, y + (rand() - 0.5) * 8);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createLeatherNormalTexture(maxAnisotropy: number, size = 256): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(9912);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 1 + rand() * 2.5;
    const lum = Math.floor(105 + rand() * 45);
    ctx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return heightCanvasToNormalTexture(canvas, 1.85, maxAnisotropy, 3, 3);
}

export function createClothNormalTexture(maxAnisotropy: number, size = 128): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(size);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Woven thread pattern
  for (let y = 0; y < size; y += 4) {
    for (let x = 0; x < size; x += 4) {
      const isWarp = ((x + y) / 4) % 2 === 0;
      ctx.fillStyle = isWarp ? '#a0a0a0' : '#686868';
      ctx.fillRect(x, y, 3, 3);
    }
  }

  return heightCanvasToNormalTexture(canvas, 1.35, maxAnisotropy, 8, 8);
}

export function createCliffTexture(maxAnisotropy: number, size = 512): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(4419);

  // Rich weathered sedimentary rock base
  ctx.fillStyle = '#3a342c';
  ctx.fillRect(0, 0, size, size);

  // Horizontal geological strata
  const strataColors = [
    '#2c2720',
    '#483f35',
    '#363028',
    '#554a3e',
    '#3e382f',
    '#25201a',
  ];
  let curY = 0;
  while (curY < size) {
    const bandH = 8 + rand() * 28;
    ctx.fillStyle = strataColors[Math.floor(rand() * strataColors.length)];
    ctx.fillRect(0, curY, size, bandH);

    // Weathering striations
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(0, curY, size, 2);
    curY += bandH;
  }

  // Vertical erosion fissures and damp mineral stains
  for (let i = 0; i < 45; i++) {
    const x = rand() * size;
    const w = 4 + rand() * 16;
    const grad = ctx.createLinearGradient(x, 0, x, size);
    grad.addColorStop(0, 'rgba(18, 15, 12, 0.55)');
    grad.addColorStop(0.5, 'rgba(28, 24, 20, 0.25)');
    grad.addColorStop(1, 'rgba(14, 32, 20, 0.45)'); // moss at bottom
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, w, size);
  }

  // Moss and tropical lichen clinging to rock shelves
  for (let i = 0; i < 80; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 8 + rand() * 22;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(38, 72, 36, 0.45)' : 'rgba(74, 98, 48, 0.35)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createCliffNormalTexture(maxAnisotropy: number, size = 512): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(size);
  const rand = createRng(6602);

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Horizontal geological fracture lines
  let curY = 0;
  while (curY < size) {
    const bandH = 10 + rand() * 32;
    const lum = Math.floor(90 + rand() * 75);
    ctx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
    ctx.fillRect(0, curY, size, bandH);

    // Deep fracture groove
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, curY + bandH - 3, size, 3);
    curY += bandH;
  }

  // Craggy rock noise
  for (let i = 0; i < 2200; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 2 + rand() * 6;
    const lum = Math.floor(100 + rand() * 55);
    ctx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return heightCanvasToNormalTexture(canvas, 3.2, maxAnisotropy, 3, 3);
}

