// High-definition (1280x720) procedural semi-realistic fantasy concept art generator
// for World 1: The Lost Jungle & Forgotten Temple Art Bible plates.

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.55) {
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.22, w * 0.5, h * 0.5, w * 0.72);
  grad.addColorStop(0, 'rgba(8, 17, 13, 0)');
  grad.addColorStop(1, `rgba(4, 10, 7, ${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawGodRays(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  rays: Array<{ angle: number; spread: number; length: number; color: string }>
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const r of rays) {
    const x1 = originX + Math.cos(r.angle - r.spread) * r.length;
    const y1 = originY + Math.sin(r.angle - r.spread) * r.length;
    const x2 = originX + Math.cos(r.angle + r.spread) * r.length;
    const y2 = originY + Math.sin(r.angle + r.spread) * r.length;
    const grad = ctx.createLinearGradient(originX, originY, (x1 + x2) * 0.5, (y1 + y2) * 0.5);
    grad.addColorStop(0, r.color);
    grad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFireflies(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  rand: () => number,
  colors: string[]
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = h * 0.18 + rand() * (h * 0.72);
    const radius = 2 + rand() * 8;
    const color = colors[i % colors.length];
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.4);
    grad.addColorStop(0, '#FFFDF5');
    grad.addColorStop(0.25, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRidge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseY: number,
  amp: number,
  freq: number,
  phase: number,
  fill: string
) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 24) {
    const n =
      Math.sin(x * freq + phase) * amp +
      Math.cos(x * freq * 2.3 + phase * 1.7) * (amp * 0.42);
    ctx.lineTo(x, baseY + n);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawJungleTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  trunkH: number,
  trunkW: number,
  canopyColor: string,
  barkColor: string,
  rand: () => number
) {
  // Buttress roots & curved trunk
  ctx.fillStyle = barkColor;
  ctx.beginPath();
  ctx.moveTo(x - trunkW * 1.4, baseY + 18);
  ctx.quadraticCurveTo(x - trunkW * 0.45, baseY - trunkH * 0.35, x - trunkW * 0.38, baseY - trunkH);
  ctx.lineTo(x + trunkW * 0.38, baseY - trunkH);
  ctx.quadraticCurveTo(x + trunkW * 0.5, baseY - trunkH * 0.35, x + trunkW * 1.45, baseY + 18);
  ctx.closePath();
  ctx.fill();

  // Hanging vines
  ctx.strokeStyle = 'rgba(20, 78, 56, 0.72)';
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 4; i++) {
    const vx = x - trunkW * 1.8 + rand() * trunkW * 3.6;
    const vy0 = baseY - trunkH * (0.75 + rand() * 0.25);
    const vLen = trunkH * (0.28 + rand() * 0.35);
    ctx.beginPath();
    ctx.moveTo(vx, vy0);
    ctx.quadraticCurveTo(vx + (rand() - 0.5) * 28, vy0 + vLen * 0.5, vx + (rand() - 0.5) * 16, vy0 + vLen);
    ctx.stroke();
  }

  // Layered canopy domes
  ctx.fillStyle = canopyColor;
  for (let i = 0; i < 5; i++) {
    const cx = x + (i - 2) * trunkW * 0.95;
    const cy = baseY - trunkH - (i % 2 === 0 ? 18 : 6);
    const rx = trunkW * (1.25 + rand() * 0.5);
    const ry = trunkW * (0.7 + rand() * 0.3);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderLostJunglePlate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(101);

  // Twilight emerald & turquoise atmospheric sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#071B15');
  sky.addColorStop(0.42, '#0E3A2D');
  sky.addColorStop(0.75, '#134B3A');
  sky.addColorStop(1, '#06110D');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Distant misty glow
  const glow = ctx.createRadialGradient(w * 0.56, h * 0.34, 20, w * 0.56, h * 0.38, w * 0.45);
  glow.addColorStop(0, 'rgba(45, 212, 191, 0.36)');
  glow.addColorStop(0.45, 'rgba(212, 175, 55, 0.14)');
  glow.addColorStop(1, 'rgba(8, 17, 13, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  drawRidge(ctx, w, h, h * 0.44, 28, 0.005, 0.4, '#0B2B21');
  drawRidge(ctx, w, h, h * 0.54, 24, 0.007, 1.9, '#09231B');

  drawGodRays(ctx, w * 0.62, -40, [
    { angle: 1.92, spread: 0.09, length: 920, color: 'rgba(242, 207, 102, 0.16)' },
    { angle: 2.15, spread: 0.07, length: 880, color: 'rgba(45, 212, 191, 0.15)' },
    { angle: 1.72, spread: 0.06, length: 850, color: 'rgba(242, 207, 102, 0.12)' },
  ]);

  // Midground trees
  for (let i = 0; i < 9; i++) {
    drawJungleTree(
      ctx,
      90 + i * 145 + (rand() - 0.5) * 45,
      h * 0.68,
      240 + rand() * 110,
      28 + rand() * 16,
      '#0C3024',
      '#0A221A',
      rand
    );
  }

  // Luminous turquoise swamp basin
  const swampGrad = ctx.createLinearGradient(0, h * 0.62, 0, h);
  swampGrad.addColorStop(0, '#0D4A3F');
  swampGrad.addColorStop(0.45, '#149B8B');
  swampGrad.addColorStop(1, '#071F1A');
  ctx.fillStyle = swampGrad;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.66);
  ctx.bezierCurveTo(w * 0.28, h * 0.6, w * 0.7, h * 0.72, w, h * 0.63);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Bioluminescent water ripples & lily pads
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const poolGlow = ctx.createRadialGradient(w * 0.52, h * 0.78, 12, w * 0.52, h * 0.78, 300);
  poolGlow.addColorStop(0, 'rgba(45, 212, 191, 0.55)');
  poolGlow.addColorStop(0.5, 'rgba(20, 184, 166, 0.22)');
  poolGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
  ctx.fillStyle = poolGlow;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);
  ctx.restore();

  for (let i = 0; i < 12; i++) {
    const lx = w * 0.16 + rand() * w * 0.68;
    const ly = h * 0.7 + rand() * h * 0.22;
    const lr = 16 + rand() * 24;
    ctx.fillStyle = '#12543B';
    ctx.beginPath();
    ctx.ellipse(lx, ly, lr, lr * 0.36, 0, 0.2, Math.PI * 1.9);
    ctx.lineTo(lx, ly);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // Submerged mossy carved ruin pillar with antique gold rune band
  ctx.fillStyle = '#2B3A33';
  ctx.fillRect(w * 0.64, h * 0.47, 56, 195);
  ctx.fillStyle = '#1A5E44';
  ctx.fillRect(w * 0.64, h * 0.47, 56, 36);
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(w * 0.64, h * 0.54, 56, 7);
  ctx.fillStyle = '#2DD4BF';
  ctx.fillRect(w * 0.64 + 22, h * 0.57, 12, 44);

  // Framing foreground banyan silhouettes
  drawJungleTree(ctx, 85, h + 10, 560, 74, '#05150F', '#06130E', rand);
  drawJungleTree(ctx, w - 75, h + 10, 590, 82, '#05150F', '#06130E', rand);

  // Foreground mossy banks
  drawRidge(ctx, w, h, h * 0.9, 18, 0.01, 2.2, '#06140F');

  drawFireflies(ctx, w, h, 46, rand, ['#F2CF66', '#2DD4BF']);
  drawVignette(ctx, w, h, 0.52);
}

function renderForgottenTemplePlate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(404);

  // Dramatic emerald & turquoise temple sky
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#061510');
  sky.addColorStop(0.5, '#0F362B');
  sky.addColorStop(1, '#08110D');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Zenithal aura behind temple apex
  const sunGlow = ctx.createRadialGradient(w * 0.5, h * 0.24, 15, w * 0.5, h * 0.28, 390);
  sunGlow.addColorStop(0, 'rgba(242, 207, 102, 0.42)');
  sunGlow.addColorStop(0.42, 'rgba(56, 189, 248, 0.22)');
  sunGlow.addColorStop(1, 'rgba(8, 17, 13, 0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(0, 0, w, h);

  drawGodRays(ctx, w * 0.5, -30, [
    { angle: Math.PI * 0.5, spread: 0.24, length: 820, color: 'rgba(212, 175, 55, 0.14)' },
    { angle: Math.PI * 0.5 - 0.22, spread: 0.1, length: 760, color: 'rgba(56, 189, 248, 0.14)' },
    { angle: Math.PI * 0.5 + 0.22, spread: 0.1, length: 760, color: 'rgba(56, 189, 248, 0.14)' },
  ]);

  // Surrounding jungle cliffs
  drawRidge(ctx, w, h, h * 0.58, 36, 0.0045, 0.7, '#09241B');

  // Stepped 3-tier monumental Forgotten Temple Pyramid
  const tiers = [
    { y: h * 0.56, halfW: 360, height: 110 },
    { y: h * 0.43, halfW: 260, height: 96 },
    { y: h * 0.31, halfW: 165, height: 88 },
  ];

  for (const t of tiers) {
    // Stone body
    const stoneGrad = ctx.createLinearGradient(w * 0.5 - t.halfW, t.y, w * 0.5 + t.halfW, t.y + t.height);
    stoneGrad.addColorStop(0, '#3C4238');
    stoneGrad.addColorStop(0.5, '#595B4E');
    stoneGrad.addColorStop(1, '#2B3029');
    ctx.fillStyle = stoneGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - t.halfW + 18, t.y);
    ctx.lineTo(w * 0.5 + t.halfW - 18, t.y);
    ctx.lineTo(w * 0.5 + t.halfW, t.y + t.height);
    ctx.lineTo(w * 0.5 - t.halfW, t.y + t.height);
    ctx.closePath();
    ctx.fill();

    // Antique gold trim frieze
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(w * 0.5 - t.halfW + 18, t.y, t.halfW * 2 - 36, 8);
    ctx.fillStyle = 'rgba(20, 184, 166, 0.65)';
    ctx.fillRect(w * 0.5 - t.halfW + 42, t.y + 18, t.halfW * 2 - 84, 3);

    // Overgrown jungle moss drapes
    ctx.fillStyle = '#124933';
    for (let m = 0; m < 8; m++) {
      const mx = w * 0.5 - t.halfW + 25 + rand() * (t.halfW * 2 - 50);
      const mw = 22 + rand() * 34;
      const mh = 18 + rand() * 38;
      ctx.beginPath();
      ctx.ellipse(mx, t.y + 8, mw, mh, 0, 0, Math.PI);
      ctx.fill();
    }
  }

  // Summit sanctuary archway + glowing turquoise portal
  ctx.fillStyle = '#383B33';
  ctx.fillRect(w * 0.5 - 66, h * 0.19, 132, 92);
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(w * 0.5 - 72, h * 0.185, 144, 10);

  const portalGrad = ctx.createRadialGradient(w * 0.5, h * 0.255, 6, w * 0.5, h * 0.255, 58);
  portalGrad.addColorStop(0, '#E0F2FE');
  portalGrad.addColorStop(0.4, '#38BDF8');
  portalGrad.addColorStop(1, '#0F3D2E');
  ctx.fillStyle = portalGrad;
  ctx.fillRect(w * 0.5 - 28, h * 0.215, 56, 72);

  // Axial jade stairway
  ctx.fillStyle = '#4B5046';
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - 42, h * 0.31);
  ctx.lineTo(w * 0.5 + 42, h * 0.31);
  ctx.lineTo(w * 0.5 + 115, h * 0.85);
  ctx.lineTo(w * 0.5 - 115, h * 0.85);
  ctx.closePath();
  ctx.fill();

  for (let s = 0; s < 16; s++) {
    const sy = h * 0.32 + s * 22;
    const sw = 82 + s * 9;
    ctx.strokeStyle = s % 3 === 0 ? 'rgba(212, 175, 55, 0.55)' : 'rgba(15, 25, 20, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - sw * 0.5, sy);
    ctx.lineTo(w * 0.5 + sw * 0.5, sy);
    ctx.stroke();
  }

  // Floating turquoise gravity monoliths
  const monoliths = [
    { x: w * 0.28, y: h * 0.26, scale: 1 },
    { x: w * 0.72, y: h * 0.24, scale: 1.05 },
    { x: w * 0.2, y: h * 0.42, scale: 0.78 },
    { x: w * 0.8, y: h * 0.4, scale: 0.82 },
  ];
  for (const m of monoliths) {
    const mGlow = ctx.createRadialGradient(m.x, m.y, 4, m.x, m.y, 58 * m.scale);
    mGlow.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
    mGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = mGlow;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 58 * m.scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2A332E';
    ctx.beginPath();
    ctx.moveTo(m.x, m.y - 36 * m.scale);
    ctx.lineTo(m.x + 15 * m.scale, m.y);
    ctx.lineTo(m.x, m.y + 38 * m.scale);
    ctx.lineTo(m.x - 15 * m.scale, m.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  // Twin golden braziers at stairs base
  for (const bx of [w * 0.5 - 125, w * 0.5 + 125]) {
    const by = h * 0.76;
    const fire = ctx.createRadialGradient(bx, by - 16, 4, bx, by - 16, 65);
    fire.addColorStop(0, '#FEF3C7');
    fire.addColorStop(0.35, 'rgba(245, 158, 11, 0.75)');
    fire.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = fire;
    ctx.beginPath();
    ctx.arc(bx, by - 16, 65, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(bx - 12, by, 24, 34);
  }

  // Framing jungle canopy
  drawJungleTree(ctx, 70, h + 10, 540, 68, '#061711', '#07140F', rand);
  drawJungleTree(ctx, w - 70, h + 10, 540, 68, '#061711', '#07140F', rand);
  drawRidge(ctx, w, h, h * 0.87, 16, 0.008, 1.1, '#071610');

  drawFireflies(ctx, w, h, 36, rand, ['#F2CF66', '#38BDF8']);
  drawVignette(ctx, w, h, 0.52);
}

function renderCombatPlate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(202);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#130D1E');
  bg.addColorStop(0.45, '#112E26');
  bg.addColorStop(1, '#08110D');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawRidge(ctx, w, h, h * 0.55, 32, 0.006, 0.3, '#0B231C');
  // Ruined courtyard pillars
  for (const px of [w * 0.14, w * 0.86]) {
    ctx.fillStyle = '#25312B';
    ctx.fillRect(px - 28, h * 0.25, 56, h * 0.55);
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(px - 28, h * 0.36, 56, 6);
  }

  // Courtyard floor
  ctx.fillStyle = '#0D1E18';
  ctx.fillRect(0, h * 0.72, w, h * 0.28);

  // Telegraph ring under boss sentinel
  ctx.save();
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.82)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(w * 0.68, h * 0.79, 145, 34, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Mossy Stone Guardian Golem (Right)
  const gx = w * 0.68;
  const gy = h * 0.52;
  const bossGlow = ctx.createRadialGradient(gx, gy, 10, gx, gy, 190);
  bossGlow.addColorStop(0, 'rgba(220, 38, 38, 0.4)');
  bossGlow.addColorStop(0.5, 'rgba(45, 212, 191, 0.18)');
  bossGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bossGlow;
  ctx.fillRect(gx - 200, gy - 200, 400, 400);

  ctx.fillStyle = '#2A312C';
  // Torso & shoulders
  ctx.fillRect(gx - 64, gy - 90, 128, 150);
  ctx.fillRect(gx - 110, gy - 84, 48, 118);
  ctx.fillRect(gx + 62, gy - 84, 48, 118);
  // Legs
  ctx.fillRect(gx - 52, gy + 60, 38, 95);
  ctx.fillRect(gx + 14, gy + 60, 38, 95);
  // Glowing crimson/turquoise rune core
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.arc(gx, gy - 24, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2DD4BF';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Hero Explorer (Left foreground)
  const hx = w * 0.3;
  const hy = h * 0.62;
  // Crimson flowing scarf
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(hx - 10, hy - 34);
  ctx.quadraticCurveTo(hx - 95, hy - 68, hx - 160, hy - 22);
  ctx.quadraticCurveTo(hx - 95, hy - 26, hx - 8, hy - 14);
  ctx.closePath();
  ctx.fill();
  // Emerald tunic + gold pauldrons
  ctx.fillStyle = '#134E3A';
  ctx.fillRect(hx - 20, hy - 32, 40, 82);
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(hx - 28, hy - 34, 18, 14);
  ctx.fillRect(hx + 10, hy - 34, 18, 14);
  // Hat
  ctx.fillStyle = '#2C2318';
  ctx.beginPath();
  ctx.ellipse(hx, hy - 54, 28, 8, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hx - 13, hy - 72, 26, 18);

  // Turquoise energy sword slash arc
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.strokeStyle = '#2DD4BF';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(hx + 70, hy - 20, 120, -0.95, 0.72);
  ctx.stroke();
  ctx.strokeStyle = '#F2CF66';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hx + 74, hy - 20, 128, -0.85, 0.62);
  ctx.stroke();
  ctx.restore();

  drawFireflies(ctx, w, h, 38, rand, ['#2DD4BF', '#F2CF66', '#DC2626']);
  drawVignette(ctx, w, h, 0.56);
}

function renderCampementPlate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(303);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#071410');
  bg.addColorStop(0.55, '#0F3226');
  bg.addColorStop(1, '#08110D');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 7; i++) {
    drawJungleTree(ctx, 110 + i * 180, h * 0.7, 290 + rand() * 80, 32, '#0A281E', '#081B14', rand);
  }
  drawRidge(ctx, w, h, h * 0.72, 16, 0.005, 0.8, '#0D2118');

  // Warm radial campfire glow
  const cx = w * 0.5;
  const cy = h * 0.74;
  const campGlow = ctx.createRadialGradient(cx, cy - 20, 16, cx, cy - 10, 420);
  campGlow.addColorStop(0, 'rgba(253, 224, 71, 0.62)');
  campGlow.addColorStop(0.3, 'rgba(245, 158, 11, 0.35)');
  campGlow.addColorStop(1, 'rgba(8, 17, 13, 0)');
  ctx.fillStyle = campGlow;
  ctx.fillRect(0, 0, w, h);

  // Expedition canvas tents
  ctx.fillStyle = '#B89563';
  ctx.beginPath();
  ctx.moveTo(w * 0.16, h * 0.73);
  ctx.lineTo(w * 0.27, h * 0.5);
  ctx.lineTo(w * 0.38, h * 0.73);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#C9A875';
  ctx.beginPath();
  ctx.moveTo(w * 0.64, h * 0.73);
  ctx.lineTo(w * 0.76, h * 0.48);
  ctx.lineTo(w * 0.88, h * 0.73);
  ctx.closePath();
  ctx.fill();

  // Golden ward steles
  for (const sx of [w * 0.41, w * 0.59]) {
    ctx.fillStyle = '#303A33';
    ctx.fillRect(sx - 12, h * 0.54, 24, 110);
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(sx - 4, h * 0.57, 8, 56);
  }

  // Campfire flame
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(cx - 26, cy);
  ctx.quadraticCurveTo(cx, cy - 92, cx + 26, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FEF3C7';
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy);
  ctx.quadraticCurveTo(cx, cy - 52, cx + 12, cy);
  ctx.closePath();
  ctx.fill();

  drawFireflies(ctx, w, h, 42, rand, ['#F59E0B', '#F2CF66', '#14B8A6']);
  drawVignette(ctx, w, h, 0.5);
}

function renderHeroPlate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(505);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#081A14');
  bg.addColorStop(0.6, '#0E392C');
  bg.addColorStop(1, '#08110D');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const rim = ctx.createRadialGradient(w * 0.5, h * 0.44, 20, w * 0.5, h * 0.46, 360);
  rim.addColorStop(0, 'rgba(20, 184, 166, 0.42)');
  rim.addColorStop(0.5, 'rgba(212, 175, 55, 0.16)');
  rim.addColorStop(1, 'rgba(8, 17, 13, 0)');
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, w, h);

  drawRidge(ctx, w, h, h * 0.78, 22, 0.007, 0.4, '#071510');

  const hx = w * 0.5;
  const hy = h * 0.48;

  // Flowing crimson scarf
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy - 66);
  ctx.bezierCurveTo(hx - 140, hy - 110, hx - 220, hy - 10, hx - 300, hy - 42);
  ctx.bezierCurveTo(hx - 200, hy + 20, hx - 120, hy - 48, hx - 12, hy - 34);
  ctx.closePath();
  ctx.fill();

  // Legs & boots
  ctx.fillStyle = '#1E2420';
  ctx.fillRect(hx - 36, hy + 72, 26, 135);
  ctx.fillRect(hx + 10, hy + 72, 26, 135);

  // Forest emerald tunic
  ctx.fillStyle = '#134E3A';
  ctx.fillRect(hx - 44, hy - 64, 88, 146);

  // Antique gold belt, buckle & pauldrons
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(hx - 46, hy + 24, 92, 14);
  ctx.fillRect(hx - 62, hy - 68, 30, 26);
  ctx.fillRect(hx + 32, hy - 68, 30, 26);
  ctx.fillRect(hx - 60, hy + 24, 18, 38);

  // Explorer hat with gold band
  ctx.fillStyle = '#2B2216';
  ctx.beginPath();
  ctx.ellipse(hx, hy - 104, 62, 16, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(hx - 28, hy - 144, 56, 40);
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(hx - 28, hy - 114, 56, 7);

  // Turquoise energy blade
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const bladeGlow = ctx.createLinearGradient(hx + 56, hy + 28, hx + 225, hy - 145);
  bladeGlow.addColorStop(0, '#D4AF37');
  bladeGlow.addColorStop(0.25, '#2DD4BF');
  bladeGlow.addColorStop(1, '#E0F2FE');
  ctx.strokeStyle = bladeGlow;
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx + 56, hy + 28);
  ctx.lineTo(hx + 225, hy - 145);
  ctx.stroke();
  ctx.restore();

  drawFireflies(ctx, w, h, 34, rand, ['#2DD4BF', '#F2CF66']);
  drawVignette(ctx, w, h, 0.54);
}

function renderVistaPlate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seededRandom(606);

  // Panoramic sky transitioning from emerald-turquoise to northern amethyst Chaos rift
  const sky = ctx.createLinearGradient(0, 0, w, h * 0.65);
  sky.addColorStop(0, '#0A271E');
  sky.addColorStop(0.55, '#133C32');
  sky.addColorStop(1, '#3B1D4E');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Northern Chaos rift glow
  const rift = ctx.createRadialGradient(w * 0.82, h * 0.18, 12, w * 0.82, h * 0.2, 320);
  rift.addColorStop(0, 'rgba(168, 85, 247, 0.52)');
  rift.addColorStop(0.5, 'rgba(124, 58, 237, 0.2)');
  rift.addColorStop(1, 'rgba(8, 17, 13, 0)');
  ctx.fillStyle = rift;
  ctx.fillRect(0, 0, w, h);

  drawRidge(ctx, w, h, h * 0.38, 34, 0.004, 0.3, '#172D2B');
  drawRidge(ctx, w, h, h * 0.5, 28, 0.0055, 1.4, '#0E3326');

  // Distant Forgotten Temple spire on center plateau
  ctx.fillStyle = '#4B5046';
  ctx.beginPath();
  ctx.moveTo(w * 0.44, h * 0.48);
  ctx.lineTo(w * 0.56, h * 0.48);
  ctx.lineTo(w * 0.53, h * 0.31);
  ctx.lineTo(w * 0.47, h * 0.31);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(w * 0.47, h * 0.31, w * 0.06, 5);
  ctx.fillStyle = '#38BDF8';
  ctx.fillRect(w * 0.495, h * 0.26, 12, 32);

  // Winding turquoise river & cascading waterfall on the right-center
  const river = ctx.createLinearGradient(w * 0.72, h * 0.46, w * 0.25, h);
  river.addColorStop(0, '#38BDF8');
  river.addColorStop(0.5, '#2DD4BF');
  river.addColorStop(1, '#0F766E');
  ctx.fillStyle = river;
  ctx.beginPath();
  ctx.moveTo(w * 0.74, h * 0.46);
  ctx.bezierCurveTo(w * 0.65, h * 0.62, w * 0.78, h * 0.74, w * 0.42, h);
  ctx.lineTo(w * 0.24, h);
  ctx.bezierCurveTo(w * 0.55, h * 0.72, w * 0.56, h * 0.58, w * 0.69, h * 0.46);
  ctx.closePath();
  ctx.fill();

  // Lush canopy hills
  drawRidge(ctx, w, h, h * 0.68, 26, 0.007, 2.1, '#0B2D20');
  drawRidge(ctx, w, h, h * 0.84, 22, 0.008, 0.9, '#071B13');

  // Foreground warm camp lantern beacon (bottom-left)
  const beacon = ctx.createRadialGradient(w * 0.16, h * 0.8, 4, w * 0.16, h * 0.8, 120);
  beacon.addColorStop(0, '#FEF3C7');
  beacon.addColorStop(0.35, 'rgba(245, 158, 11, 0.6)');
  beacon.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = beacon;
  ctx.beginPath();
  ctx.arc(w * 0.16, h * 0.8, 120, 0, Math.PI * 2);
  ctx.fill();

  drawFireflies(ctx, w, h, 44, rand, ['#F2CF66', '#2DD4BF', '#A855F7']);
  drawVignette(ctx, w, h, 0.5);
}

const cache = new Map<string, string>();

export function generateConceptPlateDataUrl(plateId: string): string | null {
  if (cache.has(plateId)) {
    return cache.get(plateId) ?? null;
  }
  if (typeof document === 'undefined') return null;

  const w = 1280;
  const h = 720;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  switch (plateId) {
    case 'plate_01':
      renderLostJunglePlate(ctx, w, h);
      break;
    case 'plate_02':
      renderCombatPlate(ctx, w, h);
      break;
    case 'plate_03':
      renderCampementPlate(ctx, w, h);
      break;
    case 'plate_04':
      renderForgottenTemplePlate(ctx, w, h);
      break;
    case 'plate_05':
      renderHeroPlate(ctx, w, h);
      break;
    case 'plate_06':
      renderVistaPlate(ctx, w, h);
      break;
    default:
      return null;
  }

  const url = canvas.toDataURL('image/jpeg', 0.92);
  cache.set(plateId, url);
  return url;
}
