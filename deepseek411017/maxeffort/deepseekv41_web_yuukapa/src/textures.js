import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────
   Tiny deterministic RNG so every capture is byte-identical.
   All imagery below is painted from scratch on a <canvas>.
   ──────────────────────────────────────────────────────────── */
export function mulberry32(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function tex(canvas, { srgb = true, repeat = null, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = aniso;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.needsUpdate = true;
  return t;
}

/* ── cat-print pajama fabric ─────────────────────────────── */
export function makePajamaFabric() {
  const S = 1024;
  const [c, x] = canvas2d(S, S);
  const rnd = mulberry32(7341);

  // base cloth: cool, powdery sky blue
  const base = x.createLinearGradient(0, 0, S, S);
  base.addColorStop(0, '#c4e8ff');
  base.addColorStop(0.42, '#b6e0fc');
  base.addColorStop(0.75, '#acd9f8');
  base.addColorStop(1, '#bce3fd');
  x.fillStyle = base;
  x.fillRect(0, 0, S, S);

  // mottled softness
  for (let i = 0; i < 34; i++) {
    const g = x.createRadialGradient(
      rnd() * S, rnd() * S, 0,
      rnd() * S, rnd() * S, 90 + rnd() * 230
    );
    g.addColorStop(0, `rgba(255,255,255,${0.025 + rnd() * 0.05})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
  }

  // woven micro texture
  x.globalAlpha = 0.05;
  for (let i = 0; i < S; i += 3) {
    x.strokeStyle = i % 6 === 0 ? '#ffffff' : '#8fc8ee';
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke();
  }
  for (let i = 0; i < S; i += 4) {
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke();
  }
  x.globalAlpha = 1;

  // one white sleeping-cat face
  function catFace(cx, cy, s, rot, alpha) {
    x.save();
    x.translate(cx, cy);
    x.rotate(rot);
    x.scale(s, s);
    x.strokeStyle = `rgba(255,255,255,${alpha})`;
    x.fillStyle = `rgba(255,255,255,${alpha})`;
    x.lineWidth = 8;
    x.lineJoin = 'round';
    x.lineCap = 'round';

    // ears + head, one continuous outline
    x.beginPath();
    x.moveTo(-82, -38);
    x.quadraticCurveTo(-92, -92, -52, -96);   // left ear
    x.quadraticCurveTo(-38, -74, -28, -68);
    x.quadraticCurveTo(0, -76, 28, -68);       // forehead
    x.quadraticCurveTo(38, -74, 52, -96);
    x.quadraticCurveTo(92, -92, 82, -38);      // right ear
    x.quadraticCurveTo(94, 12, 58, 50);
    x.quadraticCurveTo(30, 80, 0, 80);         // cheeks / chin
    x.quadraticCurveTo(-30, 80, -58, 50);
    x.quadraticCurveTo(-94, 12, -82, -38);
    x.stroke();

    // inner ears
    x.fillStyle = 'rgba(248,186,210,0.72)';
    x.beginPath();
    x.moveTo(-69, -60); x.quadraticCurveTo(-71, -82, -51, -83); x.quadraticCurveTo(-45, -67, -54, -55); x.closePath(); x.fill();
    x.beginPath();
    x.moveTo(69, -60); x.quadraticCurveTo(71, -82, 51, -83); x.quadraticCurveTo(45, -67, 54, -55); x.closePath(); x.fill();

    // sleeping eyes
    x.strokeStyle = 'rgba(244,176,202,0.82)';
    x.lineWidth = 5.4;
    x.beginPath(); x.arc(-32, 4, 12, 0.15, Math.PI - 0.15); x.stroke();
    x.beginPath(); x.arc(32, 4, 12, 0.15, Math.PI - 0.15); x.stroke();

    // nose + mouth
    x.fillStyle = 'rgba(244,173,200,0.86)';
    x.beginPath();
    x.moveTo(0, 24); x.quadraticCurveTo(-7, 32, 0, 35); x.quadraticCurveTo(7, 32, 0, 24); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.62)';
    x.lineWidth = 3.4;
    x.beginPath(); x.moveTo(0, 36); x.quadraticCurveTo(-8, 47, -15, 38); x.stroke();
    x.beginPath(); x.moveTo(0, 36); x.quadraticCurveTo(8, 47, 15, 38); x.stroke();

    // whiskers
    x.strokeStyle = 'rgba(255,255,255,0.48)';
    x.lineWidth = 2.6;
    x.beginPath(); x.moveTo(-38, 34); x.quadraticCurveTo(-70, 28, -82, 20); x.stroke();
    x.beginPath(); x.moveTo(-38, 42); x.quadraticCurveTo(-68, 48, -80, 54); x.stroke();
    x.beginPath(); x.moveTo(38, 34); x.quadraticCurveTo(70, 28, 82, 20); x.stroke();
    x.beginPath(); x.moveTo(38, 42); x.quadraticCurveTo(68, 48, 80, 54); x.stroke();

    // blush
    x.fillStyle = 'rgba(247,186,210,0.4)';
    x.beginPath(); x.ellipse(-47, 29, 18, 9, 0.12, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(47, 29, 18, 9, -0.12, 0, Math.PI * 2); x.fill();
    x.restore();
  }

  const cols = 4, rows = 4, cell = S / cols;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const off = row % 2 ? cell * 0.5 : 0;
      const cx = (col * cell + cell * 0.5 + off) % S;
      const cy = row * cell + cell * 0.5;
      const s = 0.42 + rnd() * 0.09;
      const rot = (rnd() - 0.5) * 0.24;
      catFace(cx, cy, s, rot, 0.82 + rnd() * 0.12);
    }
  }

  // scattered stars / dots / tiny hearts
  for (let i = 0; i < 34; i++) {
    const px = rnd() * S, py = rnd() * S;
    x.save();
    x.translate(px, py);
    x.rotate(rnd() * Math.PI);
    x.fillStyle = rnd() > 0.55 ? 'rgba(247,193,214,0.55)' : 'rgba(255,255,255,0.52)';
    if (i % 5 === 0) {
      x.beginPath();
      const s = 5 + rnd() * 6;
      x.moveTo(0, -s); x.quadraticCurveTo(0, 0, s, 0); x.quadraticCurveTo(0, 0, 0, s);
      x.quadraticCurveTo(0, 0, -s, 0); x.quadraticCurveTo(0, 0, 0, -s); x.fill();
    } else if (i % 3 === 0) {
      x.beginPath(); x.ellipse(0, 0, 4.5, 3, 0, 0, Math.PI * 2); x.fill();
    } else {
      x.beginPath(); x.arc(0, 0, 2.4 + rnd() * 2.5, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }

  // gentle edge vignette to give the cloth a rendered falloff
  const vg = x.createRadialGradient(S * 0.5, S * 0.5, S * 0.2, S * 0.5, S * 0.5, S * 0.78);
  vg.addColorStop(0, 'rgba(255,255,255,0)');
  vg.addColorStop(1, 'rgba(125,180,225,0.10)');
  x.fillStyle = vg;
  x.fillRect(0, 0, S, S);

  return tex(c, { repeat: [1, 1] });
}

/* ── cloth bump / roughness noise ───────────────────────── */
export function makeClothNoise() {
  const S = 256;
  const [c, x] = canvas2d(S, S);
  const rnd = mulberry32(991);
  const img = x.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const n = 118 + rnd() * 34;
    img.data[i * 4] = n;
    img.data[i * 4 + 1] = n;
    img.data[i * 4 + 2] = n;
    img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // faint threads
  x.globalAlpha = 0.2;
  for (let i = 0; i < S; i += 4) {
    x.strokeStyle = '#ffffff';
    x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke();
    x.strokeStyle = '#888888';
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke();
  }
  const t = tex(c, { srgb: false, repeat: [7, 7] });
  return t;
}

/* ── face: eye ───────────────────────────────────────────── */
/* ── face: eye ───────────────────────────────────────────── */
/* Mapped so that the texture exactly covers the almond lid:
   y = 0 is the top edge of the eye, y = H the lower edge,
   x = 0 is the inner corner and x = W the outer corner.      */
export function makeEyeTexture(mirror = false) {
  const W = 768, H = 512;
  const [c, x] = canvas2d(W, H);
  const lerp = (a, b, t) => a + (b - a) * t;


  // ── sclera ───────────────────────────────────────────────
  const sg = x.createLinearGradient(0, 0, 0, H);
  sg.addColorStop(0, '#efe7f4');
  sg.addColorStop(0.30, '#ffffff');
  sg.addColorStop(0.72, '#fffdfd');
  sg.addColorStop(1, '#f7e4e4');
  x.fillStyle = sg;
  x.fillRect(0, 0, W, H);

  // inner-corner warmth
  const warm = x.createRadialGradient(40, 300, 6, 60, 300, 250);
  warm.addColorStop(0, 'rgba(255,183,196,0.68)');
  warm.addColorStop(1, 'rgba(255,183,196,0)');
  x.fillStyle = warm;
  x.fillRect(0, 0, W, H);

  // ── iris ─────────────────────────────────────────────────
  const ix = 388, iy = 250, irx = 250, iry = 234;
  x.save();
  x.beginPath();
  x.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2);
  x.clip();

  const base = x.createLinearGradient(0, iy - iry, 0, iy + iry);
  base.addColorStop(0, '#2b2065');
  base.addColorStop(0.26, '#42318f');
  base.addColorStop(0.55, '#6a58c9');
  base.addColorStop(0.78, '#9d8bf1');
  base.addColorStop(1, '#cfc4ff');
  x.fillStyle = base;
  x.fillRect(ix - irx, iy - iry, irx * 2, iry * 2);

  // radial fibres
  for (let i = 0; i < 108; i++) {
    const a = (i / 108) * Math.PI * 2;
    const r0 = 54 + Math.sin(i * 7.3) * 12;
    const r1 = irx * (0.66 + ((i * 37) % 29) / 100);
    x.strokeStyle = i % 3 === 0 ? 'rgba(206,192,255,0.22)' : 'rgba(28,18,70,0.20)';
    x.lineWidth = i % 4 === 0 ? 3.4 : 1.7;
    x.beginPath();
    x.moveTo(ix + Math.cos(a) * r0, iy + Math.sin(a) * r0 * 1.02);
    x.lineTo(ix + Math.cos(a + 0.06) * r1, iy + Math.sin(a + 0.06) * r1 * 1.04);
    x.stroke();
  }

  // luminous lower crescent (the liquid light in the iris)
  const lower = x.createRadialGradient(ix, iy + 132, 10, ix, iy + 108, 190);
  lower.addColorStop(0, 'rgba(233,222,255,0.98)');
  lower.addColorStop(0.35, 'rgba(168,140,255,0.62)');
  lower.addColorStop(1, 'rgba(120,96,230,0)');
  x.fillStyle = lower;
  x.beginPath();
  x.ellipse(ix, iy + 128, 190, 96, 0, 0, Math.PI * 2);
  x.fill();

  // lid shadow hanging over the top of the iris
  const topShadow = x.createLinearGradient(0, iy - iry, 0, iy + 20);
  topShadow.addColorStop(0, 'rgba(16,10,44,0.72)');
  topShadow.addColorStop(0.55, 'rgba(26,16,64,0.22)');
  topShadow.addColorStop(1, 'rgba(26,16,64,0)');
  x.fillStyle = topShadow;
  x.fillRect(ix - irx, iy - iry, irx * 2, iry + 40);

  // limbal ring
  x.strokeStyle = 'rgba(14,9,38,0.9)';
  x.lineWidth = 16;
  x.beginPath();
  x.ellipse(ix, iy, irx - 7, iry - 7, 0, 0, Math.PI * 2);
  x.stroke();
  x.restore();

  // ── pupil ────────────────────────────────────────────────
  x.save();
  x.beginPath();
  x.ellipse(ix, iy + 10, 84, 138, 0, 0, Math.PI * 2);
  x.clip();
  const pupil = x.createRadialGradient(ix - 18, iy - 26, 6, ix, iy + 16, 130);
  pupil.addColorStop(0, '#3a2a68');
  pupil.addColorStop(0.45, '#180f38');
  pupil.addColorStop(1, '#07040f');
  x.fillStyle = pupil;
  x.fillRect(ix - 90, iy - 130, 180, 280);
  x.restore();

  // magenta core beneath the pupil, like the reference art
  const core = x.createRadialGradient(ix + 2, iy + 74, 2, ix + 2, iy + 74, 44);
  core.addColorStop(0, 'rgba(236,124,196,0.6)');
  core.addColorStop(0.45, 'rgba(196,72,150,0.26)');
  core.addColorStop(1, 'rgba(180,60,140,0)');
  x.fillStyle = core;
  x.beginPath();
  x.ellipse(ix + 2, iy + 76, 36, 50, 0, 0, Math.PI * 2);
  x.fill();

  // ── glints ───────────────────────────────────────────────
  function glint(px, py, r, alpha = 1) {
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(255,255,255,${alpha})`);
    g.addColorStop(0.42, `rgba(255,252,255,${alpha * 0.9})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
  glint(302, 156, 74, 1);
  glint(468, 330, 30, 0.9);
  glint(430, 120, 17, 0.6);

  x.fillStyle = 'rgba(255,255,255,0.95)';
  x.beginPath();
  x.moveTo(468, 300); x.quadraticCurveTo(476, 322, 498, 330);
  x.quadraticCurveTo(476, 338, 468, 360); x.quadraticCurveTo(460, 338, 438, 330);
  x.quadraticCurveTo(460, 322, 468, 300); x.fill();

  // ── sleepy upper lid + lash mass ─────────────────────────
  // lower edge of the eyelid: a shallow arc that droops again
  // at the outer corner, like the reference art.
  const lidEdge = (t) => 512 * (0.58 - 0.20 * Math.sin(Math.PI * Math.pow(t, 0.8)) + 0.06 * t * t);
  x.beginPath();
  x.moveTo(-30, 300);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    x.lineTo(lerp(-30, W + 30, t), lidEdge(t));
  }
  x.lineTo(W + 30, -60);
  x.lineTo(-30, -60);
  x.closePath();
  const lashGrad = x.createLinearGradient(0, 0, 0, 150);
  lashGrad.addColorStop(0, '#2b1a3d');
  lashGrad.addColorStop(0.55, '#241631');
  lashGrad.addColorStop(1, '#31203f');
  x.fillStyle = lashGrad;
  x.fill();

  // lash flick past the outer corner
  x.beginPath();
  x.moveTo(W - 116, 200);
  x.quadraticCurveTo(W - 26, 196, W + 20, 168);
  x.quadraticCurveTo(W - 10, 232, W - 92, 262);
  x.closePath();
  x.fillStyle = '#241631';
  x.fill();

  // soft shadow the lash casts down the eye
  const castShadow = x.createLinearGradient(0, 200, 0, 360);
  castShadow.addColorStop(0, 'rgba(52,34,72,0.34)');
  castShadow.addColorStop(1, 'rgba(52,34,72,0)');
  x.fillStyle = castShadow;
  x.fillRect(0, 200, W, 170);

  // ── lower lid ────────────────────────────────────────────
  x.strokeStyle = 'rgba(168,106,126,0.34)';
  x.lineWidth = 7;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(W * 0.24, 470);
  x.bezierCurveTo(W * 0.48, 498, W * 0.72, 486, W * 0.9, 424);
  x.stroke();

  const lowerShade = x.createLinearGradient(0, H, 0, H - 110);
  lowerShade.addColorStop(0, 'rgba(198,128,146,0.20)');
  lowerShade.addColorStop(1, 'rgba(198,128,146,0)');
  x.fillStyle = lowerShade;
  x.fillRect(0, H - 120, W, 120);

  // wet-line highlight along the very bottom edge
  x.strokeStyle = 'rgba(255,255,255,0.34)';
  x.lineWidth = 5;
  x.beginPath();
  x.moveTo(W * 0.14, H - 34);
  x.bezierCurveTo(W * 0.44, H - 12, W * 0.7, H - 20, W * 0.86, H - 66);
  x.stroke();

  if (mirror) {
    const [mc, mx] = canvas2d(W, H);
    mx.translate(W, 0);
    mx.scale(-1, 1);
    mx.drawImage(c, 0, 0);
    return tex(mc, { aniso: 16 });
  }
  return tex(c, { aniso: 16 });
}
/* ── mouth / blush ──────────────────────────────────────── */
export function makeMouthTexture() {
  const [c, x] = canvas2d(256, 128);
  x.clearRect(0, 0, 256, 128);

  // soft rose lower lip, very subtle
  const lip = x.createRadialGradient(128, 84, 3, 128, 84, 54);
  lip.addColorStop(0, 'rgba(233,158,175,0.42)');
  lip.addColorStop(1, 'rgba(233,158,175,0)');
  x.fillStyle = lip;
  x.beginPath(); x.ellipse(128, 86, 42, 16, 0, 0, Math.PI * 2); x.fill();

  // pencil-thin mouth line with a gentle cupid dip
  x.lineCap = 'round';
  x.strokeStyle = 'rgba(150,88,104,0.92)';
  x.lineWidth = 6.5;
  x.beginPath();
  x.moveTo(78, 62);
  x.quadraticCurveTo(96, 50, 116, 58);
  x.quadraticCurveTo(128, 64, 140, 58);
  x.quadraticCurveTo(160, 50, 178, 64);
  x.stroke();

  // shallow shade under the line
  x.strokeStyle = 'rgba(176,118,132,0.35)';
  x.lineWidth = 4;
  x.beginPath();
  x.moveTo(92, 70);
  x.quadraticCurveTo(128, 82, 164, 72);
  x.stroke();

  return tex(c, { aniso: 8 });
}

export function makeBlushTexture() {
  const [c, x] = canvas2d(256, 256);
  const g = x.createRadialGradient(128, 128, 2, 128, 128, 126);
  g.addColorStop(0, 'rgba(255,165,188,0.52)');
  g.addColorStop(0.4, 'rgba(255,173,197,0.32)');
  g.addColorStop(0.7, 'rgba(255,185,205,0.11)');
  g.addColorStop(1, 'rgba(255,190,210,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  // tiny blush streaks
  x.strokeStyle = 'rgba(238,144,172,0.16)';
  x.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    x.beginPath();
    x.moveTo(92, 122 + i * 8);
    x.quadraticCurveTo(128, 112 + i * 8, 166, 124 + i * 8);
    x.stroke();
  }
  return tex(c);
}

/* ── glow / feather / sparkle sprites ───────────────────── */
export function makeGlowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(196,231,255,0.55)') {
  const [c, x] = canvas2d(256, 256);
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, inner);
  g.addColorStop(0.18, mid);
  g.addColorStop(0.55, 'rgba(160,215,255,0.14)');
  g.addColorStop(1, 'rgba(160,215,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return tex(c);
}

export function makeSparkleTexture() {
  const [c, x] = canvas2d(256, 256);
  x.translate(128, 128);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 70);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(222,240,255,0.9)');
  g.addColorStop(1, 'rgba(190,225,255,0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(0, 0, 70, 0, Math.PI * 2); x.fill();

  x.fillStyle = 'rgba(255,255,255,0.98)';
  x.beginPath();
  x.moveTo(0, -118);
  x.quadraticCurveTo(10, -16, 118, 0);
  x.quadraticCurveTo(10, 16, 0, 118);
  x.quadraticCurveTo(-10, 16, -118, 0);
  x.quadraticCurveTo(-10, -16, 0, -118);
  x.fill();
  return tex(c);
}

export function makeFeatherTexture() {
  const [c, x] = canvas2d(256, 512);
  x.translate(128, 256);
  x.rotate(-0.06);

  // barbs
  for (let i = 0; i < 26; i++) {
    const y = -200 + i * 16;
    const w = Math.sin((i / 25) * Math.PI) * 74 + 10;
    x.strokeStyle = `rgba(255,255,255,${0.35 + 0.3 * Math.sin((i / 25) * Math.PI)})`;
    x.lineWidth = 3.2;
    x.beginPath();
    x.moveTo(0, y);
    x.quadraticCurveTo(-w * 0.55, y - 18, -w, y - 44);
    x.stroke();
    x.beginPath();
    x.moveTo(0, y);
    x.quadraticCurveTo(w * 0.55, y - 18, w, y - 44);
    x.stroke();
  }
  // downy core
  const g = x.createLinearGradient(0, -240, 0, 240);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.75)');
  g.addColorStop(1, 'rgba(255,255,255,0.08)');
  x.strokeStyle = g;
  x.lineWidth = 7;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(0, -245);
  x.bezierCurveTo(18, -80, -16, 90, 8, 244);
  x.stroke();
  x.strokeStyle = 'rgba(214,236,255,0.4)';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(0, -245);
  x.bezierCurveTo(18, -80, -16, 90, 8, 244);
  x.stroke();
  return tex(c);
}

/* ── dreamy sky gradient (background sphere) ─────────────── */
export function makeSkyTexture() {
  const W = 1024, H = 1024;
  const [c, x] = canvas2d(W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f4fbff');
  g.addColorStop(0.24, '#e4f3ff');
  g.addColorStop(0.48, '#d2eafd');
  g.addColorStop(0.72, '#bedff8');
  g.addColorStop(0.9, '#b3d4ef');
  g.addColorStop(1, '#a9c9e4');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  // warm bloom upper-right
  const warm = x.createRadialGradient(W * 0.76, H * 0.18, 20, W * 0.76, H * 0.18, W * 0.52);
  warm.addColorStop(0, 'rgba(255,235,240,0.5)');
  warm.addColorStop(1, 'rgba(255,235,240,0)');
  x.fillStyle = warm;
  x.fillRect(0, 0, W, H);

  // huge, ultra-soft cloud belts
  x.save();
  x.filter = 'blur(46px)';
  const rnd = mulberry32(522);
  for (let i = 0; i < 24; i++) {
    const cx = rnd() * W;
    const cy = H * (0.3 + rnd() * 0.62);
    const rx = 110 + rnd() * 250;
    const ry = 26 + rnd() * 54;
    x.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.12})`;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, (rnd() - 0.5) * 0.2, 0, Math.PI * 2); x.fill();
  }
  x.restore();

  // pin-prick stars in the upper region
  const rnd2 = mulberry32(97);
  for (let i = 0; i < 90; i++) {
    const px = rnd2() * W;
    const py = rnd2() * H * 0.4;
    const a = 0.12 + rnd2() * 0.5;
    x.fillStyle = `rgba(255,255,255,${a})`;
    x.beginPath(); x.arc(px, py, 0.7 + rnd2() * 1.6, 0, Math.PI * 2); x.fill();
  }

  // very soft vignette at the lower edge
  const vg = x.createLinearGradient(0, H * 0.72, 0, H);
  vg.addColorStop(0, 'rgba(142,184,220,0)');
  vg.addColorStop(1, 'rgba(128,166,204,0.28)');
  x.fillStyle = vg;
  x.fillRect(0, 0, W, H);
  return tex(c);
}

/* ── studio environment for reflections ──────────────────── */
export function makeEnvironmentTexture() {
  const W = 1024, H = 512;
  const [c, x] = canvas2d(W, H);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f6fbff');
  g.addColorStop(0.45, '#dcefff');
  g.addColorStop(0.55, '#c9e4fa');
  g.addColorStop(0.8, '#a9cbe8');
  g.addColorStop(1, '#8baac8');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  x.save();
  x.filter = 'blur(18px)';
  // key box light
  x.fillStyle = 'rgba(255,252,246,0.98)';
  x.beginPath(); x.ellipse(W * 0.22, H * 0.32, 120, 74, -0.1, 0, Math.PI * 2); x.fill();
  // cool rim softbox
  x.fillStyle = 'rgba(188,224,255,0.9)';
  x.beginPath(); x.ellipse(W * 0.74, H * 0.4, 150, 82, 0.06, 0, Math.PI * 2); x.fill();
  // tiny warm bounce
  x.fillStyle = 'rgba(255,226,230,0.55)';
  x.beginPath(); x.ellipse(W * 0.55, H * 0.22, 92, 52, 0, 0, Math.PI * 2); x.fill();
  x.restore();

  // horizon glow line
  const hz = x.createLinearGradient(0, H * 0.52, 0, H * 0.66);
  hz.addColorStop(0, 'rgba(255,255,255,0)');
  hz.addColorStop(0.5, 'rgba(255,255,255,0.65)');
  hz.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = hz;
  x.fillRect(0, 0, W, H);

  const t = tex(c, { srgb: true });
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

/* ── in-world model nameplate ────────────────────────────── */
export function makeNameplateTexture() {
  const W = 1024, H = 300;
  const [c, x] = canvas2d(W, H);

  const r = 54;
  x.save();
  x.shadowColor = 'rgba(47, 84, 129, 0.24)';
  x.shadowBlur = 28;
  x.shadowOffsetY = 10;
  x.beginPath();
  x.roundRect(14, 14, W - 28, H - 28, r);
  const bg = x.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, 'rgba(255,255,255,0.78)');
  bg.addColorStop(1, 'rgba(242,251,255,0.54)');
  x.fillStyle = bg;
  x.fill();
  x.restore();

  x.strokeStyle = 'rgba(255,255,255,0.95)';
  x.lineWidth = 3;
  x.beginPath(); x.roundRect(14, 14, W - 28, H - 28, r); x.stroke();
  x.strokeStyle = 'rgba(108, 154, 211, 0.22)';
  x.lineWidth = 1;
  x.beginPath(); x.roundRect(20, 20, W - 40, H - 40, r - 6); x.stroke();

  // eyebrow
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = 'rgba(68, 106, 160, 0.72)';
  x.font = '600 22px "Avenir Next", "Helvetica Neue", sans-serif';
  x.letterSpacing = '7px';
  x.fillText('M O D E L   ·   P R O C E D U R A L   S T U D Y', W / 2, 86);

  // name
  x.fillStyle = '#26344f';
  x.font = '600 70px "Avenir Next", "Helvetica Neue", sans-serif';
  x.letterSpacing = '3px';
  x.fillText('DEEPSEEK V4.1 FLASH', W / 2, 160);

  // divider + sub
  x.strokeStyle = 'rgba(110, 159, 230, 0.4)';
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(W * 0.24, 217); x.lineTo(W * 0.76, 217); x.stroke();

  x.fillStyle = 'rgba(74, 107, 150, 0.8)';
  x.font = '500 22px "Avenir Next", "Helvetica Neue", sans-serif';
  x.letterSpacing = '5px';
  x.fillText('Y U U   ·   S L E E P I N G   S T A R   —   0 0 1', W / 2, 252);

  // ornaments
  x.fillStyle = 'rgba(238, 181, 206, 0.9)';
  x.font = '26px serif';
  x.letterSpacing = '0px';
  x.fillText('✦', W * 0.155, 152);
  x.fillText('✦', W * 0.845, 152);

  return tex(c, { aniso: 16 });
}

/* ── soft contact shadow decal ───────────────────────────── */
export function makeShadowTexture() {
  const [c, x] = canvas2d(512, 512);
  const g = x.createRadialGradient(256, 256, 10, 256, 256, 250);
  g.addColorStop(0, 'rgba(55, 77, 121, 0.42)');
  g.addColorStop(0.36, 'rgba(60, 86, 132, 0.28)');
  g.addColorStop(0.7, 'rgba(65, 93, 140, 0.09)');
  g.addColorStop(1, 'rgba(65, 93, 140, 0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 512, 512);
  return tex(c);
}

export function makeSoftCloudTexture() {
  const [c, x] = canvas2d(512, 512);
  const rnd = mulberry32(81);
  x.save();
  x.filter = 'blur(26px)';
  for (let i = 0; i < 20; i++) {
    const px = 90 + rnd() * 330;
    const py = 190 + rnd() * 150;
    const r = 40 + rnd() * 90;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(255,255,255,${0.18 + rnd() * 0.2})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
  x.restore();
  return tex(c);
}
