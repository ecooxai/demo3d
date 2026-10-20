// All textures painted procedurally on canvas 2D (no external assets).
import * as THREE from 'three';

function rng(seed) { let a = seed >>> 0; return () => { a += 0x6d2b79f5; let t = Math.imul(a ^ a >>> 15, 1 | a); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

/* ============ FACE ============ 1024x1024, sphere-UV:
   u: .25..75 spans front 180°, center front at u=.5 (x=512)
   v: 0 top(crown) .. 1 bottom(below chin) → canvas y = v*1024                    */
const FACE = {
  EY: 470,      // eye-line y
  EX: 75,       // eye-center x-offset from 512
  EW: 45,       // eye half-width
  EH: 74,       // eye half-height
  BLUSH_X: 150, BLUSH_Y: 585, BLUSH_RX: 62, BLUSH_RY: 40,
  MOUTH_Y: 640, NOSE_Y: 558,
};

function ellipsePath(g, x, y, rx, ry, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

function softBlob(g, x, y, rx, ry, color, alpha, rot = 0, n = 24) {
  for (let i = n; i > 0; i--) {
    const t = i / n;
    g.globalAlpha = alpha * Math.pow(t, 1.5) * 0.28;
    ellipsePath(g, x, y, rx * (2 - t), ry * (2 - t), rot);
    g.fillStyle = color; g.fill();
  }
  g.globalAlpha = 1;
}

function drawCommonFace(g, cnv) {
  // skin base with cool airbrush
  const hg = g.createLinearGradient(0, 0, 0, cnv.height);
  hg.addColorStop(0, '#e9dcea'); // slightly shadowed under bangs
  hg.addColorStop(0.24, '#f8e7e2');
  hg.addColorStop(0.62, '#fdeee9');
  hg.addColorStop(0.92, '#fbe7e3');
  g.fillStyle = hg; g.fillRect(0, 0, cnv.width, cnv.height);

  // bang shadow: soft wash across forehead (no hard edges)
  for (let i = 8; i > 0; i--) {
    const t = i / 8;
    g.globalAlpha = 0.016 * t * t;
    ellipsePath(g, 512, 40, 250 / t * 0 + 260, 90 + 150 * (1 - t));
    g.fillStyle = '#6e5f96'; g.fill();
  }
  g.globalAlpha = 1;

  // side hair shadow: soft vertical fades at the face window edges
  for (const s of [-1, 1]) {
    for (let i = 7; i > 0; i--) {
      const t = i / 7;
      g.globalAlpha = 0.020 * t;
      ellipsePath(g, 512 + s * (258 - t * 18), 560, 60 + 40 * (1 - t), 210);
      g.fillStyle = '#7a6596'; g.fill();
    }
  }
  g.globalAlpha = 1;

  // underline shading under chin (hidden mostly)
  const cg = g.createLinearGradient(0, 940, 0, 1010);
  cg.addColorStop(0, 'rgba(150,110,140,0.14)'); cg.addColorStop(1, 'rgba(150,110,140,0)');
  g.fillStyle = cg; g.fillRect(256, 920, 512, 92);

  // brows — short soft arcs sitting above the lashes
  for (const s of [-1, 1]) {
    const cx = 512 + s * FACE.EX;
    g.strokeStyle = 'rgba(102,84,142,0.55)';
    g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - s * 16, 430);
    g.quadraticCurveTo(cx + s * 8, 414, cx + s * 36, 424);
    g.stroke();
  }

  // blush (soft ellipse + faint streaks like the reference)
  for (const s of [-1, 1]) {
    const bx = 512 + s * FACE.BLUSH_X, by = FACE.BLUSH_Y;
    softBlob(g, bx, by, FACE.BLUSH_RX, FACE.BLUSH_RY, 'rgba(240,146,158,1)', 0.8, 0);
    g.strokeStyle = 'rgba(232,128,148,0.20)'; g.lineWidth = 6; g.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      const px = bx + i * 20;
      g.moveTo(px - s * 9, by - 14 - Math.abs(i) * 5);
      g.lineTo(px + s * 12, by + 12 + -i * 8);
      g.stroke();
    }
  }

  // nose: tiny hint
  softBlob(g, 512, FACE.NOSE_Y, 5.5, 4, 'rgba(214,146,150,1)', 0.4);
  // crease glimmer under nose
  softBlob(g, 512, FACE.NOSE_Y + 12, 9, 4, 'rgba(255,255,255,1)', 0.35);

  // mouth: small subtle pout
  g.strokeStyle = 'rgba(178,104,118,0.85)';
  g.lineWidth = 6.5; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(500, FACE.MOUTH_Y - 1);
  g.quadraticCurveTo(512, FACE.MOUTH_Y + 4, 524, FACE.MOUTH_Y - 2);
  g.stroke();
  softBlob(g, 512, FACE.MOUTH_Y - 2, 8, 3, 'rgba(196,120,130,1)', 0.30);
}

function drawEyeOpen(g, s) {
  // s=+1 → viewer-right canvas half (her left eye); mirror consistent
  const cx = 512 + s * FACE.EX, cy = FACE.EY;
  const exo = FACE.EW * 0.15; // outer x direction
  const dir = -s;             // outer corner outward on canvas: for s=+1 outer edge is +x
  const ox = cx + dir * (FACE.EW + 14), ix = cx - dir * (FACE.EW + 6);

  // eye white (soft vertical oval, slightly egg)
  g.save();
  ellipsePath(g, cx, cy + 4, FACE.EW, FACE.EH * 0.94);
  g.fillStyle = '#ffffff'; g.fill();
  // faint inner-corner shadow
  const shg = g.createLinearGradient(cx - dir * FACE.EW, cy, cx, cy);
  shg.addColorStop(0, 'rgba(150,140,190,0.25)'); shg.addColorStop(1, 'rgba(150,140,190,0)');
  g.fillStyle = shg; g.fill();
  g.restore();

  // iris (clipped to eye)
  g.save();
  ellipsePath(g, cx, cy + 4, FACE.EW * 0.94, FACE.EH * 0.9);
  g.clip();
  const icy = cy + 6, irx = FACE.EW * 0.94, iry = FACE.EH * 0.92;
  const ig = g.createLinearGradient(0, icy - iry, 0, icy + iry);
  ig.addColorStop(0, '#413672');
  ig.addColorStop(0.45, '#625aa8');
  ig.addColorStop(0.8, '#8b7ec9');
  ig.addColorStop(1, '#a79ae0');
  g.fillStyle = ig;
  ellipsePath(g, cx, icy, irx, iry); g.fill();
  // pupil
  g.fillStyle = 'rgba(34,28,62,0.9)';
  ellipsePath(g, cx, icy + 4, irx * 0.44, iry * 0.62); g.fill();
  // bottom iris glow
  softBlob(g, cx, icy + iry * 0.62, irx * 0.7, iry * 0.3, 'rgba(190,220,255,1)', 0.5);
  // iris top rim shadow
  g.strokeStyle = 'rgba(38,30,66,0.55)'; g.lineWidth = 5;
  ellipsePath(g, cx, icy, irx, iry); g.stroke();
  // highlights
  g.fillStyle = '#ffffff';
  const hx = cx - dir * (irx * 0.42), hy = icy - iry * 0.42;
  ellipsePath(g, hx, hy, 16.5, 13.5, -0.25 * dir); g.fill();
  g.globalAlpha = 0.85;
  ellipsePath(g, cx + dir * irx * 0.5, icy + iry * 0.52, 6.5, 5.5); g.fill();
  g.globalAlpha = 0.35;
  ellipsePath(g, cx - dir * irx * 0.1, icy + iry * 0.15, 4.5, 4.5); g.fill();
  g.globalAlpha = 1;
  g.restore();

  // upper lash band (thick, tapered, with outer wing)
  g.fillStyle = '#3a3154';
  g.beginPath();
  g.moveTo(ix, cy - FACE.EH * 0.52 + 10);
  g.quadraticCurveTo(cx, cy - FACE.EH * 0.74 - 10, ox + dir * 6, cy - FACE.EH * 0.44 + 2);
  // wing tip
  g.quadraticCurveTo(ox + dir * 16, cy - FACE.EH * 0.30, ox + dir * 4, cy - FACE.EH * 0.16);
  g.quadraticCurveTo(cx, cy - FACE.EH * 0.54, ix, cy - FACE.EH * 0.30 + 12);
  g.closePath(); g.fill();
  // lash spikes at outer corner
  g.lineCap = 'round'; g.strokeStyle = '#3a3154';
  for (const k of [0, 1]) {
    g.lineWidth = k ? 4 : 5.5;
    const bx = ox + dir * (2 - k * 7), by = cy - FACE.EH * (0.30 - k * 0.10);
    g.beginPath(); g.moveTo(bx, by);
    g.quadraticCurveTo(bx + dir * 10, by - 6, bx + dir * (13 + k * 4), by - (2 + k * 5));
    g.stroke();
  }
  // lower lash (thin partial)
  g.strokeStyle = 'rgba(58,49,84,0.85)'; g.lineWidth = 4.5;
  g.beginPath();
  g.moveTo(ox - dir * 8, cy + FACE.EH * 0.78);
  g.quadraticCurveTo(cx + dir * 10, cy + FACE.EH * 0.92 + 4, cx - dir * FACE.EW * 0.55, cy + FACE.EH * 0.80);
  g.stroke();
  // lower bright lash glint
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(ox - dir * 10, cy + FACE.EH * 0.70);
  g.quadraticCurveTo(cx + dir * 12, cy + FACE.EH * 0.86, cx - dir * FACE.EW * 0.5, cy + FACE.EH * 0.74);
  g.stroke();

  // double-lid crease (faint, under fringe)
  g.strokeStyle = 'rgba(120,96,150,0.30)'; g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx - dir * FACE.EW * 0.8, cy - FACE.EH * 1.40);
  g.quadraticCurveTo(cx, cy - FACE.EH * 1.54, ox + dir * FACE.EW * 0.9, cy - FACE.EH * 1.16);
  g.stroke();
  // eyeshadow wash above eye
  softBlob(g, cx + dir * FACE.EW * 0.5, cy - FACE.EH * 0.98, FACE.EW * 1.0, 20, 'rgba(198,152,180,1)', 0.11);
  // white spec under lower lash
  softBlob(g, cx + dir * FACE.EW * 0.35, cy + FACE.EH * 0.30, 7, 4, 'rgba(255,255,255,1)', 0.4);
}

function drawEyeClosed(g, s) {
  const cx = 512 + s * FACE.EX, cy = FACE.EY;
  const dir = -s;
  // soft lid shadow
  softBlob(g, cx, cy, FACE.EW * 1.08, FACE.EH * 0.7, 'rgba(200,150,180,1)', 0.35);
  g.strokeStyle = '#3a3154'; g.lineCap = 'round';
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(cx - dir * (FACE.EW + 8), cy + FACE.EH * 0.10);
  g.quadraticCurveTo(cx, cy + FACE.EH * 0.62, cx + dir * (FACE.EW + 12), cy + FACE.EH * 0.04);
  g.stroke();
  // wing tick
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(cx + dir * (FACE.EW + 4), cy + FACE.EH * 0.20);
  g.quadraticCurveTo(cx + dir * (FACE.EW + 14), cy + FACE.EH * 0.30, cx + dir * (FACE.EW + 20), cy + FACE.EH * 0.42);
  g.stroke();
}

export function makeFaceTextures() {
  const open = document.createElement('canvas'); open.width = open.height = 1024;
  const closed = document.createElement('canvas'); closed.width = closed.height = 1024;
  const go = open.getContext('2d'), gc = closed.getContext('2d');
  drawCommonFace(go, open);
  drawCommonFace(gc, closed);
  for (const s of [-1, 1]) { drawEyeOpen(go, s); drawEyeClosed(gc, s); }
  if (typeof window !== 'undefined') window.__FACE_CANVAS__ = open;
  return { open: tex(open), closed: tex(closed) };
}

/* ============ PAJAMA CAT PATTERN ============ */
function drawCat(g, x, y, s, rot) {
  g.save();
  g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const w = 62, h = 52, rr = 16;
  // ears first (behind face square)
  for (const sd of [-1, 1]) {
    g.beginPath();
    g.moveTo(sd * 16, -h / 2 - 2);
    g.lineTo(sd * 30, -h / 2 - 22);
    g.lineTo(sd * 33, -h / 2 + 8);
    g.closePath();
    g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.lineJoin = 'round'; g.stroke();
    g.fillStyle = 'rgba(244,169,198,0.95)';
    g.beginPath();
    g.moveTo(sd * 19, -h / 2 - 3);
    g.lineTo(sd * 27, -h / 2 - 15);
    g.lineTo(sd * 28.5, -h / 2 + 2);
    g.closePath(); g.fill();
  }
  // face square (white outline)
  g.beginPath();
  g.roundRect(-w / 2, -h / 2, w, h, [rr * 1.5, rr]);
  g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.stroke();
  // cats are #f4a9c6 accent ears + face dots subtle
  g.fillStyle = 'rgba(137,205,228,0.95)';
  ellipsePath(g, -13, -5, 3.4, 4.4); g.fill();
  ellipsePath(g, 13, -5, 3.4, 4.4); g.fill();
  // nose pink
  g.fillStyle = 'rgba(244,169,198,0.95)';
  ellipsePath(g, 0, 7, 3.6, 2.6); g.fill();
  g.restore();
}

export function makePajamaTexture(kind, seed = 7) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = kind === 'shorts' ? '#d0eefb' : kind === 'cuff' ? '#d9f3fc' : '#d5f1fb';
  g.fillRect(0, 0, 1024, 1024);
  const stepX = 208, stepY = 126;
  let k = 0;
  for (let iy = 0; iy < 12; iy++) {
    for (let ix = 0; ix < 8; ix++) {
      const ox = (iy % 2) * stepX * 0.5;
      const jitter = () => (r() - 0.5) * 46;
      if (r() < 0.82) {
        drawCat(g, 60 + ix * stepX + ox + jitter(), 40 + iy * stepY + jitter(), 1, (r() - 0.5) * 0.42);
      }
      k++;
    }
  }
  // tiny sparse pink dots
  for (let i = 0; i < 46; i++) {
    g.globalAlpha = 0.55; g.fillStyle = '#f4a9c6';
    ellipsePath(g, r() * 1024, r() * 1024, 4.5, 4.5); g.fill();
  }
  g.globalAlpha = 1;
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ============ misc sprites ============ */
export function makeGlowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  rg.addColorStop(0, 'rgba(210,245,255,0.9)');
  rg.addColorStop(0.25, 'rgba(110,215,255,0.5)');
  rg.addColorStop(0.6, 'rgba(70,170,255,0.16)');
  rg.addColorStop(1, 'rgba(60,150,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  return tex(c);
}

export function makeContactShadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(128, 128, 6, 128, 128, 126);
  rg.addColorStop(0, 'rgba(40,60,90,0.42)');
  rg.addColorStop(0.45, 'rgba(40,60,90,0.20)');
  rg.addColorStop(1, 'rgba(40,60,90,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  return tex(c);
}
