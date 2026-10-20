/**
 * tex.js — every texture in the project is painted here with Canvas2D.
 * Nothing is loaded from disk or the network.
 */
import * as THREE from 'three';
import { rng, lerp, clamp } from './geom.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function finish(c, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = aniso;
  tex.wrapS = tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  if (repeat) tex.repeat.set(repeat[0], repeat[1]);
  tex.needsUpdate = true;
  return tex;
}

/* ══════════════════════════════════════════════════════════════
   Toon gradient ramp — 4 hard steps, classic cel shading
   ══════════════════════════════════════════════════════════════ */
export function makeToonRamp(steps = [0.40, 0.62, 0.82, 1.0]) {
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((s, i) => {
    const v = Math.round(s * 255);
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  });
  const tex = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/* ══════════════════════════════════════════════════════════════
   Soft radial glow (halo aura, contact shadow)
   ══════════════════════════════════════════════════════════════ */
export function makeGlowTexture(inner = 'rgba(140,225,255,0.95)', outer = 'rgba(140,225,255,0)') {
  const c = canvas(256, 256), g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 8, 128, 128, 126);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.45, inner.replace(/[\d.]+\)$/, '0.35)'));
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return finish(c, { srgb: true });
}

/** Elliptical soft blob used as a fake contact shadow under the feet. */
export function makeBlobShadow() {
  const c = canvas(256, 256), g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 4, 128, 128, 124);
  grd.addColorStop(0, 'rgba(38,52,78,0.52)');
  grd.addColorStop(0.45, 'rgba(38,52,78,0.28)');
  grd.addColorStop(1, 'rgba(38,52,78,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return finish(c, { srgb: true });
}

/* ══════════════════════════════════════════════════════════════
   The painted face — large violet anime eyes on a curved patch
   Layout maps 1:1 onto the head's front surface:
     canvas top    → forehead (under the bangs)
     canvas bottom → chin
   ══════════════════════════════════════════════════════════════ */
export function makeFaceTexture() {
  const S = 1024;
  const c = canvas(S, S), g = c.getContext('2d');
  g.clearRect(0, 0, S, S);
  g.lineJoin = 'round'; g.lineCap = 'round';

  const CX = S / 2;
  const EYE_Y = 356;     // eye centre line
  const EYE_HW = 178;    // eye half width
  const EYE_HH = 122;    // eye half height
  const EYE_DX = 300;    // eye centre offset from face centre

  /* ── soft forehead shadow cast by the bangs ── */
  const fg = g.createLinearGradient(0, 0, 0, 330);
  fg.addColorStop(0, 'rgba(96,84,140,0.34)');
  fg.addColorStop(0.55, 'rgba(120,106,166,0.13)');
  fg.addColorStop(1, 'rgba(140,126,186,0)');
  g.fillStyle = fg; g.fillRect(0, 0, S, 330);

  /* ── blush ── */
  const blush = (bx, by, rx, ry, a = 1) => {
    const gr = g.createRadialGradient(bx, by, 2, bx, by, rx);
    gr.addColorStop(0, `rgba(255,146,158,${0.40 * a})`);
    gr.addColorStop(0.55, `rgba(255,163,173,${0.20 * a})`);
    gr.addColorStop(1, 'rgba(255,180,190,0)');
    g.save();
    g.translate(bx, by); g.scale(1, ry / rx); g.translate(-bx, -by);
    g.fillStyle = gr; g.beginPath(); g.arc(bx, by, rx, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  blush(CX - 300, 470, 150, 92);
  blush(CX + 300, 470, 150, 92);

  // anime blush hatching
  g.save();
  g.strokeStyle = 'rgba(246,132,150,0.40)';
  g.lineWidth = 3.2;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const bx = CX + side * (250 + i * 17), by = 432 + i * 13;
      g.beginPath(); g.moveTo(bx - 12, by + 16); g.lineTo(bx + 12, by - 10); g.stroke();
    }
  }
  g.restore();

  /* ── eye painting ── */
  function drawEye(cx, outward) {
    const hw = EYE_HW, hh = EYE_HH;
    g.save();
    g.translate(cx, EYE_Y);
    g.scale(outward, 1);

    // --- eye-white lens path
    const lens = new Path2D();
    lens.moveTo(-hw, 0.20 * hh);
    lens.bezierCurveTo(-hw * 0.55, 0.86 * hh, hw * 0.42, 0.95 * hh, hw, -0.04 * hh);
    lens.bezierCurveTo(hw * 0.58, -0.98 * hh, -hw * 0.52, -1.04 * hh, -hw, 0.20 * hh);
    lens.closePath();

    g.save();
    g.clip(lens);
    g.fillStyle = '#fffdfe';
    g.fillRect(-hw * 1.2, -hh * 1.4, hw * 2.4, hh * 2.8);

    // --- iris
    const ix = 0.04 * hw, iy = -0.04 * hh;
    const irx = 0.95 * hw, iry = 1.10 * hh;
    const gr = g.createLinearGradient(0, iy - iry, 0, iy + iry);
    gr.addColorStop(0.00, '#25184d');
    gr.addColorStop(0.16, '#452a95');
    gr.addColorStop(0.40, '#6a44c8');
    gr.addColorStop(0.62, '#8f6fe0');
    gr.addColorStop(0.82, '#b39ef2');
    gr.addColorStop(1.00, '#ded2fd');
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2); g.fill();

    // iris striations
    g.globalAlpha = 0.30;
    g.strokeStyle = '#2f2066'; g.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      g.beginPath();
      g.moveTo(ix + Math.cos(a) * irx * 0.42, iy + Math.sin(a) * iry * 0.42);
      g.lineTo(ix + Math.cos(a) * irx * 0.98, iy + Math.sin(a) * iry * 0.98);
      g.stroke();
    }
    g.globalAlpha = 1;

    // pupil
    const pg = g.createRadialGradient(ix, iy - iry * 0.25, 2, ix, iy - iry * 0.25, iry * 0.62);
    pg.addColorStop(0, 'rgba(35,22,72,0.85)');
    pg.addColorStop(1, 'rgba(35,22,72,0)');
    g.fillStyle = pg;
    g.beginPath(); g.ellipse(ix, iy - iry * 0.22, irx * 0.5, iry * 0.5, 0, 0, Math.PI * 2); g.fill();

    // bright crescent at the bottom of the iris
    g.save();
    g.globalCompositeOperation = 'lighter';
    const cg = g.createRadialGradient(ix, iy + iry * 0.55, 2, ix, iy + iry * 0.55, iry * 0.8);
    cg.addColorStop(0, 'rgba(226,214,255,0.95)');
    cg.addColorStop(1, 'rgba(226,214,255,0)');
    g.fillStyle = cg;
    g.beginPath(); g.ellipse(ix, iy + iry * 0.5, irx * 0.75, iry * 0.6, 0, 0, Math.PI * 2); g.fill();
    g.restore();

    // dark iris rim
    g.strokeStyle = 'rgba(36,24,74,0.85)'; g.lineWidth = 9;
    g.beginPath(); g.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2); g.stroke();

    // --- highlights
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = '#ffffff';
    g.save();
    g.translate(-0.40 * hw, -0.50 * hh); g.rotate(-0.35);
    g.beginPath(); g.ellipse(0, 0, 0.30 * hw, 0.24 * hh, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.beginPath(); g.ellipse(0.30 * hw, 0.48 * hh, 0.115 * hw, 0.13 * hh, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.85;
    g.beginPath(); g.ellipse(0.52 * hw, -0.18 * hh, 0.08 * hw, 0.10 * hh, 0, 0, Math.PI * 2); g.fill();
    g.restore();
    g.restore(); // end iris clip

    // --- upper lash: tapered filled ribbon
    const b0 = [-hw * 1.02, 0.24 * hh];
    const b1 = [-hw * 0.55, -1.06 * hh];
    const b2 = [hw * 0.58, -1.00 * hh];
    const b3 = [hw * 1.04, -0.06 * hh];
    const upperPts = [];
    const NS = 30;
    for (let i = 0; i <= NS; i++) {
      const t = i / NS, mt = 1 - t;
      const x = mt * mt * mt * b0[0] + 3 * mt * mt * t * b1[0] + 3 * mt * t * t * b2[0] + t * t * t * b3[0];
      const y = mt * mt * mt * b0[1] + 3 * mt * mt * t * b1[1] + 3 * mt * t * t * b2[1] + t * t * t * b3[1];
      upperPts.push({ x, y });
    }
    g.beginPath();
    g.moveTo(upperPts[0].x, upperPts[0].y);
    for (let i = 1; i < upperPts.length; i++) g.lineTo(upperPts[i].x, upperPts[i].y);
    // offset back with varying thickness (thin at inner corner, thick at outer)
    for (let i = upperPts.length - 1; i >= 0; i--) {
      const p = upperPts[i];
      const prev = upperPts[Math.max(0, i - 1)];
      const next = upperPts[Math.min(upperPts.length - 1, i + 1)];
      const dx = next.x - prev.x, dy = next.y - prev.y;
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l, ny = dx / l;
      const t = i / (upperPts.length - 1);
      const w = lerp(0.055, 0.30, Math.pow(t, 1.35)) * hh;
      g.lineTo(p.x + nx * w, p.y + ny * w);
    }
    g.closePath();
    g.fillStyle = '#241a45';
    g.fill();

    // --- outer corner lash spikes
    g.fillStyle = '#241a45';
    const spikes = [[1.0, 0.55], [1.12, 0.34], [1.02, 0.16]];
    for (const [ox, oy] of spikes) {
      g.beginPath();
      g.moveTo(hw * 0.86, -0.30 * hh);
      g.quadraticCurveTo(hw * (1.0 + ox * 0.16), -hh * (0.6 + oy * 0.5), hw * (1.02 + ox * 0.1), -hh * (0.18 + oy * 0.5));
      g.quadraticCurveTo(hw * 1.0, -hh * 0.05, hw * 0.86, -0.24 * hh);
      g.closePath(); g.fill();
    }

    // --- lower lid line
    g.strokeStyle = 'rgba(120,86,140,0.55)';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(-hw * 0.86, 0.26 * hh);
    g.bezierCurveTo(-hw * 0.5, 0.80 * hh, hw * 0.40, 0.88 * hh, hw * 0.96, -0.02 * hh);
    g.stroke();

    // --- lower-lid highlight
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 7;
    g.beginPath();
    g.moveTo(-hw * 0.30, 0.62 * hh);
    g.quadraticCurveTo(hw * 0.16, 0.76 * hh, hw * 0.52, 0.52 * hh);
    g.stroke();

    g.restore();
  }

  drawEye(CX - EYE_DX, -1);
  drawEye(CX + EYE_DX, 1);

  /* ── eyebrows ── */
  const brow = (cx, dir) => {
    g.save(); g.translate(cx, EYE_Y); g.scale(dir, 1);
    g.beginPath();
    g.moveTo(-150, -168);
    g.quadraticCurveTo(10, -232, 158, -196);
    g.quadraticCurveTo(30, -206, -150, -150);
    g.closePath();
    g.fillStyle = 'rgba(74,58,128,0.92)';
    g.fill();
    g.restore();
  };
  brow(CX - EYE_DX, -1);
  brow(CX + EYE_DX, 1);

  /* ── nose: tiny soft mark ── */
  g.save();
  g.translate(CX, 528);
  const ng = g.createRadialGradient(0, 0, 1, 0, 0, 26);
  ng.addColorStop(0, 'rgba(226,150,150,0.55)');
  ng.addColorStop(1, 'rgba(226,150,150,0)');
  g.fillStyle = ng;
  g.beginPath(); g.ellipse(0, 4, 17, 9, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(205,128,132,0.72)'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(-13, -2); g.quadraticCurveTo(0, 8, 13, -2); g.stroke();
  g.restore();

  /* ── mouth: small cat-mouth ── */
  g.save();
  g.translate(CX, 668);
  g.strokeStyle = '#b85f7d';
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(-34, -8);
  g.quadraticCurveTo(-17, 16, 0, 0);
  g.quadraticCurveTo(17, 16, 34, -8);
  g.stroke();
  g.fillStyle = 'rgba(232,140,160,0.42)';
  g.beginPath();
  g.moveTo(-34, -8); g.quadraticCurveTo(-17, 16, 0, 0);
  g.quadraticCurveTo(17, 16, 34, -8); g.quadraticCurveTo(0, 10, -34, -8);
  g.closePath(); g.fill();
  g.restore();

  return finish(c, { srgb: true });
}

/* ══════════════════════════════════════════════════════════════
   Pajama cat print — seamless tile
   ══════════════════════════════════════════════════════════════ */
export function makePajamaTexture() {
  const S = 512;
  const c = canvas(S, S), g = c.getContext('2d');
  const rand = rng(20260419);

  // base cloth
  g.fillStyle = '#dff1f8';
  g.fillRect(0, 0, S, S);

  // subtle weave
  g.globalAlpha = 0.05;
  g.strokeStyle = '#5f8ba6';
  g.lineWidth = 1;
  for (let i = 0; i < S; i += 4) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(S, i); g.stroke();
  }
  g.globalAlpha = 1;

  const drawCat = (cx, cy, size, style) => {
    const ear = size * 0.52;
    const headR = size * 0.62;
    const path = new Path2D();
    // left ear
    path.moveTo(cx - headR * 0.92, cy - headR * 0.30);
    path.lineTo(cx - headR * 0.86, cy - headR * 0.30 - ear);
    path.quadraticCurveTo(cx - headR * 0.30, cy - headR * 1.02, cx - headR * 0.18, cy - headR * 0.62);
    // right ear
    path.quadraticCurveTo(cx + headR * 0.30, cy - headR * 1.02, cx + headR * 0.86, cy - headR * 0.30 - ear);
    path.lineTo(cx + headR * 0.92, cy - headR * 0.30);
    path.quadraticCurveTo(cx + headR * 1.05, cy + headR * 0.55, cx, cy + headR * 0.92);
    path.quadraticCurveTo(cx - headR * 1.05, cy + headR * 0.55, cx - headR * 0.92, cy - headR * 0.30);
    path.closePath();

    if (style === 'solid') {
      g.fillStyle = 'rgba(150,190,214,0.85)';
      g.fill(path);
    } else {
      g.fillStyle = 'rgba(233,248,253,0.92)';
      g.fill(path);
      g.strokeStyle = '#ffffff';
      g.lineWidth = size * 0.075;
      g.stroke(path);
    }

    // inner ears
    if (style !== 'solid') {
      g.fillStyle = '#f6a9c6';
      const earIn = (s) => {
        g.beginPath();
        g.moveTo(cx + s * headR * 0.72, cy - headR * 0.42);
        g.lineTo(cx + s * headR * 0.70, cy - headR * 0.42 - ear * 0.62);
        g.quadraticCurveTo(cx + s * headR * 0.36, cy - headR * 0.80, cx + s * headR * 0.26, cy - headR * 0.60);
        g.closePath(); g.fill();
      };
      earIn(-1); earIn(1);

      // eyes
      g.fillStyle = '#ffffff';
      g.beginPath(); g.ellipse(cx - headR * 0.34, cy + headR * 0.02, headR * 0.13, headR * 0.17, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(cx + headR * 0.34, cy + headR * 0.02, headR * 0.13, headR * 0.17, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(96,74,150,0.55)';
      g.beginPath(); g.ellipse(cx - headR * 0.34, cy + headR * 0.03, headR * 0.07, headR * 0.10, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(cx + headR * 0.34, cy + headR * 0.03, headR * 0.07, headR * 0.10, 0, 0, Math.PI * 2); g.fill();

      // nose + mouth
      g.fillStyle = '#f49cbb';
      g.beginPath(); g.ellipse(cx, cy + headR * 0.36, headR * 0.10, headR * 0.075, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(150,110,150,0.5)'; g.lineWidth = size * 0.035;
      g.beginPath();
      g.moveTo(cx, cy + headR * 0.36);
      g.quadraticCurveTo(cx - headR * 0.18, cy + headR * 0.56, cx - headR * 0.30, cy + headR * 0.46);
      g.moveTo(cx, cy + headR * 0.36);
      g.quadraticCurveTo(cx + headR * 0.18, cy + headR * 0.56, cx + headR * 0.30, cy + headR * 0.46);
      g.stroke();
    }
  };

  // 2×2 cells so the tile is seamless
  const cells = 2;
  const cell = S / cells;
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      const cx = (i + 0.5) * cell + (rand() - 0.5) * 24;
      const cy = (j + 0.5) * cell + (rand() - 0.5) * 24;
      const size = cell * 0.40;
      const style = rand() < 0.30 ? 'solid' : 'line';
      drawCat(cx, cy, size, style);
      if (rand() < 0.5) {
        const bx = cx + (rand() - 0.5) * cell * 0.5;
        const by = cy + (rand() - 0.5) * cell * 0.5;
        g.fillStyle = 'rgba(255,255,255,0.75)';
        g.beginPath(); g.arc(bx, by, size * 0.055, 0, Math.PI * 2); g.fill();
      }
    }
  }

  return finish(c, { srgb: true, repeat: [1, 1] });
}

/* ══════════════════════════════════════════════════════════════
   Woven cotton — subtle fibre noise for the pillow and bedding
   ══════════════════════════════════════════════════════════════ */
export function makeFabricTexture() {
  const S = 256;
  const c = canvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, S, S);
  const rand = rng(4242);
  g.globalAlpha = 0.055;
  for (let i = 0; i < 2600; i++) {
    const x = rand() * S, y = rand() * S;
    const l = 2 + rand() * 7;
    g.strokeStyle = rand() > 0.5 ? '#9fb0c4' : '#ffffff';
    g.lineWidth = 1 + rand();
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + l * (rand() - 0.5), y + l * (rand() - 0.5));
    g.stroke();
  }
  g.globalAlpha = 1;
  return finish(c, { srgb: true, repeat: [1, 1] });
}

/* ══════════════════════════════════════════════════════════════
   Pillow case — soft cloud-like shading + fold creases
   ══════════════════════════════════════════════════════════════ */
export function makePillowTexture() {
  const S = 512;
  const c = canvas(S, S), g = c.getContext('2d');
  g.fillStyle = '#fbfdff';
  g.fillRect(0, 0, S, S);

  // gentle large-scale shading
  const gr = g.createLinearGradient(0, 0, S * 0.6, S);
  gr.addColorStop(0, 'rgba(214,226,240,0.45)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0)');
  gr.addColorStop(1, 'rgba(196,212,230,0.35)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);

  // creases
  const rand = rng(90210);
  g.globalAlpha = 0.5;
  for (let i = 0; i < 16; i++) {
    const x0 = rand() * S, y0 = rand() * S;
    const len = 60 + rand() * 190;
    const a = rand() * Math.PI;
    g.strokeStyle = 'rgba(176,196,218,0.6)';
    g.lineWidth = 1.5 + rand() * 3.5;
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo(
      x0 + Math.cos(a) * len * 0.5 + (rand() - 0.5) * 30,
      y0 + Math.sin(a) * len * 0.5 + (rand() - 0.5) * 30,
      x0 + Math.cos(a) * len, y0 + Math.sin(a) * len);
    g.stroke();
  }
  g.globalAlpha = 1;
  return finish(c, { srgb: true, repeat: [1, 1] });
}

/* ══════════════════════════════════════════════════════════════
   Hair strand sheen strip (subtle vertical banding)
   ══════════════════════════════════════════════════════════════ */
export function makeHairTexture() {
  const S = 64;
  const c = canvas(S, S), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, S, 0);
  gr.addColorStop(0.0, 'rgba(255,255,255,0.0)');
  gr.addColorStop(0.28, 'rgba(255,255,255,0.20)');
  gr.addColorStop(0.46, 'rgba(255,255,255,0.42)');
  gr.addColorStop(0.62, 'rgba(255,255,255,0.10)');
  gr.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return finish(c, { srgb: true, repeat: [1, 1] });
}
