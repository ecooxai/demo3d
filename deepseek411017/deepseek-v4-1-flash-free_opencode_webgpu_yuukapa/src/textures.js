import * as THREE from 'three';

function canvas(size = 1024) {
  const element = document.createElement('canvas');
  element.width = size;
  element.height = size;
  return element;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Seamless-feeling hand-drawn cat pattern for the pajamas. No source imagery. */
export function makePajamaTexture() {
  const size = 1024;
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8ecdf3';
  ctx.fillRect(0, 0, size, size);

  const wash = ctx.createLinearGradient(0, 0, size, size);
  wash.addColorStop(0, 'rgba(255,255,255,0.16)');
  wash.addColorStop(0.46, 'rgba(255,255,255,0)');
  wash.addColorStop(1, 'rgba(120,190,232,0.1)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size, size);

  const cats = [
    [140, 160, 1.05, -0.12], [390, 120, 0.82, 0.18], [680, 170, 1.18, -0.08], [900, 80, 0.76, 0.2],
    [80, 470, 0.88, 0.15], [300, 420, 1.14, -0.16], [570, 430, 0.78, 0.08], [800, 470, 1.0, 0.2],
    [210, 760, 1.16, -0.18], [490, 720, 0.85, 0.16], [730, 760, 1.08, -0.13], [940, 640, 0.78, 0.1],
    [60, 930, 0.74, -0.1], [360, 950, 0.98, 0.12], [620, 990, 0.74, 0.2], [880, 930, 0.92, -0.18],
  ];

  for (const [x, y, scale, tilt] of cats) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);
    drawCat(ctx);
    ctx.restore();
  }

  const accents = [[250, 300], [525, 250], [905, 330], [112, 640], [675, 600], [465, 880], [1010, 820]];
  for (const [x, y] of accents) drawSparkle(ctx, x, y, 13, 'rgba(255,255,255,0.74)');

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function drawCat(ctx) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.98)';
  ctx.fillStyle = 'rgba(248,253,255,0.18)';
  ctx.lineWidth = 6.2;

  ctx.beginPath();
  ctx.moveTo(-48, -30);
  ctx.lineTo(-56, -68);
  ctx.lineTo(-20, -49);
  ctx.quadraticCurveTo(0, -58, 22, -49);
  ctx.lineTo(56, -68);
  ctx.lineTo(48, -28);
  ctx.bezierCurveTo(67, -10, 68, 20, 44, 38);
  ctx.quadraticCurveTo(0, 64, -44, 38);
  ctx.bezierCurveTo(-68, 18, -67, -10, -48, -30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,236,246,0.95)';
  ctx.beginPath();
  ctx.moveTo(-45, -52);
  ctx.lineTo(-50, -68);
  ctx.lineTo(-28, -55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(44, -52);
  ctx.lineTo(50, -68);
  ctx.lineTo(28, -55);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.arc(-21, -2, 4.2, 0, Math.PI * 2);
  ctx.arc(21, -2, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,158,203,1)';
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(-5, 4);
  ctx.quadraticCurveTo(0, -1, 5, 4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-3, 18);
  ctx.quadraticCurveTo(2, 20, 6, 17);
  ctx.stroke();

  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(255,255,255,0.78)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 27, 12);
    ctx.lineTo(side * 51, 5);
    ctx.moveTo(side * 28, 18);
    ctx.lineTo(side * 54, 18);
    ctx.moveTo(side * 27, 24);
    ctx.lineTo(side * 50, 31);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSparkle(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.quadraticCurveTo(r * 0.12, -r * 0.18, r, 0);
  ctx.quadraticCurveTo(r * 0.12, r * 0.18, 0, r);
  ctx.quadraticCurveTo(-r * 0.12, r * 0.18, -r, 0);
  ctx.quadraticCurveTo(-r * 0.12, -r * 0.18, 0, -r);
  ctx.fill();
  ctx.restore();
}

export function makeIrisTexture() {
  const size = 256;
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  const rim = ctx.createRadialGradient(size * 0.5, size * 0.5, 12, size * 0.5, size * 0.5, size * 0.5);
  rim.addColorStop(0, '#2b1d67');
  rim.addColorStop(0.44, '#4f37ae');
  rim.addColorStop(0.72, '#7569e5');
  rim.addColorStop(0.84, '#2a1c65');
  rim.addColorStop(1, 'rgba(24,15,56,0)');

  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fill();

  const lower = ctx.createRadialGradient(size * 0.46, size * 0.7, 4, size * 0.5, size * 0.55, size * 0.43);
  lower.addColorStop(0, 'rgba(255,205,255,0.95)');
  lower.addColorStop(0.38, 'rgba(176,136,255,0.66)');
  lower.addColorStop(1, 'rgba(71,45,166,0)');
  ctx.fillStyle = lower;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(37,22,88,0.56)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 42; i += 1) {
    const a = (i / 42) * Math.PI * 2 + Math.sin(i * 3.4) * 0.025;
    const r0 = 40 + (i % 4) * 6;
    const r1 = 108 + (i % 5) * 4;
    ctx.beginPath();
    ctx.moveTo(size / 2 + Math.cos(a) * r0, size / 2 + Math.sin(a) * r0);
    ctx.lineTo(size / 2 + Math.cos(a) * r1, size / 2 + Math.sin(a) * r1);
    ctx.stroke();
  }

  ctx.fillStyle = '#1c1147';
  ctx.beginPath();
  ctx.ellipse(size / 2, size / 2 + 2, 34, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  const shine = ctx.createRadialGradient(size * 0.39, size * 0.32, 2, size * 0.4, size * 0.33, 46);
  shine.addColorStop(0, 'rgba(255,255,255,1)');
  shine.addColorStop(0.24, 'rgba(255,247,255,0.8)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(size * 0.39, size * 0.32, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(size * 0.63, size * 0.66, 10, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function makeBlushTexture() {
  const size = 256;
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,135,165,0.72)');
  gradient.addColorStop(0.36, 'rgba(255,145,176,0.38)');
  gradient.addColorStop(1, 'rgba(255,160,186,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(255,111,150,0.34)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(76 + i * 20, 118);
    ctx.lineTo(104 + i * 20, 142);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeGlowTexture() {
  const size = 256;
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.12, 'rgba(183,244,255,0.78)');
  gradient.addColorStop(0.42, 'rgba(105,217,242,0.26)');
  gradient.addColorStop(1, 'rgba(105,217,242,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeStarTexture() {
  const size = 128;
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.translate(size / 2, size / 2);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.15, 'rgba(198,241,255,0.9)');
  gradient.addColorStop(0.5, 'rgba(129,211,255,0.17)');
  gradient.addColorStop(1, 'rgba(129,211,255,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 58 : 11;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeShadowTexture() {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(34,50,102,0.46)');
  gradient.addColorStop(0.32, 'rgba(50,72,128,0.24)');
  gradient.addColorStop(0.7, 'rgba(76,104,160,0.07)');
  gradient.addColorStop(1, 'rgba(76,104,160,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeLabelTexture(lines, options = {}) {
  const width = options.width ?? 1024;
  const height = options.height ?? 256;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const primary = lines[0] ?? '';
  const secondary = lines[1] ?? '';
  ctx.fillStyle = options.color ?? '#223254';
  ctx.font = `600 ${options.primarySize ?? 44}px "Avenir Next", Helvetica, sans-serif`;
  ctx.fillText(primary, width / 2, height * (secondary ? 0.4 : 0.52));
  if (secondary) {
    ctx.fillStyle = options.secondaryColor ?? 'rgba(57,72,103,0.72)';
    ctx.font = `500 ${options.secondarySize ?? 20}px "SFMono-Regular", Menlo, monospace`;
    ctx.letterSpacing = '8px';
    ctx.fillText(secondary, width / 2, height * 0.64);
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}


/** Painted anime face decal. Only facial features; the skin tone comes from the 3D head. */
export function makeFaceTexture() {
  const width = 1024;
  const height = 640;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Soft blush and the faintest plane-change under the cheeks.
  for (const [x, y, rx, ry, alpha] of [[186, 432, 128, 58, 0.5], [838, 432, 128, 58, 0.5]]) {
    ctx.save();
    ctx.translate(x, y);
    const blush = ctx.createRadialGradient(0, 0, 2, 0, 0, rx);
    blush.addColorStop(0, `rgba(255,112,154,${alpha * 0.9})`);
    blush.addColorStop(0.3, `rgba(255,133,168,${alpha * 0.42})`);
    blush.addColorStop(0.68, `rgba(255,150,180,${alpha * 0.12})`);
    blush.addColorStop(1, 'rgba(255,160,188,0)');
    ctx.fillStyle = blush;
    ctx.scale(1, ry / rx);
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(235,102,141,0.22)';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x - 44 + i * 22, y - 17);
      ctx.lineTo(x - 31 + i * 22, y + 5);
      ctx.stroke();
    }
  }

  const eyeY = 300;
  const eyeCenters = [267, 757];

  function eye(cx, outer) {
    const w = 158;
    const h = 112;
    ctx.save();
    ctx.translate(cx, eyeY);
    ctx.rotate(outer * 0.032);

    const eyePath = new Path2D();
    eyePath.moveTo(-w, 7);
    eyePath.bezierCurveTo(-w * 0.7, -h * 1.03, -w * 0.05, -h * 1.2, w * 0.58, -h * 0.79);
    eyePath.quadraticCurveTo(w * 0.99, -h * 0.37, w, 7);
    eyePath.bezierCurveTo(w * 0.58, h * 0.99, -w * 0.52, h * 0.95, -w, 7);
    eyePath.closePath();

    const sclera = ctx.createLinearGradient(0, -h, 0, h);
    sclera.addColorStop(0, '#eee8ff');
    sclera.addColorStop(0.42, '#fffbff');
    sclera.addColorStop(1, '#fff4f9');
    ctx.fillStyle = sclera;
    ctx.fill(eyePath);

    ctx.save();
    ctx.clip(eyePath);

    const iris = ctx.createRadialGradient(0, 9, 4, 0, 12, 106);
    iris.addColorStop(0, '#2b1a79');
    iris.addColorStop(0.25, '#4b34b4');
    iris.addColorStop(0.56, '#7b68e8');
    iris.addColorStop(0.8, '#a799ff');
    iris.addColorStop(0.93, '#47309a');
    iris.addColorStop(1, '#251856');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.ellipse(outer * -2, 11, 104, 113, 0, 0, Math.PI * 2);
    ctx.fill();

    const lowerGlow = ctx.createRadialGradient(outer * -12, 71, 2, 0, 57, 74);
    lowerGlow.addColorStop(0, 'rgba(255,214,255,0.98)');
    lowerGlow.addColorStop(0.42, 'rgba(199,156,255,0.5)');
    lowerGlow.addColorStop(1, 'rgba(87,54,174,0)');
    ctx.fillStyle = lowerGlow;
    ctx.beginPath();
    ctx.ellipse(0, 57, 80, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(56,33,130,0.33)';
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 32; i += 1) {
      const a = (i / 32) * Math.PI * 2 + Math.sin(i * 1.9) * 0.03;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 31, 11 + Math.sin(a) * 36);
      ctx.lineTo(Math.cos(a) * 88, 11 + Math.sin(a) * 94);
      ctx.stroke();
    }

    ctx.fillStyle = '#24154f';
    ctx.beginPath();
    ctx.ellipse(outer * -1, 12, 34, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#08030f';
    ctx.beginPath();
    ctx.ellipse(outer * -1, 12, 23, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    const catchLight = ctx.createRadialGradient(outer * -32, -32, 0, outer * -32, -32, 31);
    catchLight.addColorStop(0, 'rgba(255,255,255,1)');
    catchLight.addColorStop(0.42, 'rgba(255,246,255,0.94)');
    catchLight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = catchLight;
    ctx.beginPath();
    ctx.arc(outer * -32, -32, 31, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    ctx.ellipse(outer * 26, 55, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.beginPath();
    ctx.arc(outer * 38, -20, 7, 0, Math.PI * 2);
    ctx.fill();

    const lidShadow = ctx.createLinearGradient(0, -h, 0, -20);
    lidShadow.addColorStop(0, 'rgba(55,28,76,0.44)');
    lidShadow.addColorStop(0.72, 'rgba(81,43,98,0.13)');
    lidShadow.addColorStop(1, 'rgba(81,43,98,0)');
    ctx.fillStyle = lidShadow;
    ctx.fillRect(-w, -h * 1.3, w * 2, h * 1.2);

    ctx.restore();

    // Upper lash, heavy at the outer corner.
    const lashGradient = ctx.createLinearGradient(-w, 0, w, 0);
    lashGradient.addColorStop(0, '#211332');
    lashGradient.addColorStop(0.62, '#302042');
    lashGradient.addColorStop(1, '#49305f');
    ctx.strokeStyle = lashGradient;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-w * 0.99, 8);
    ctx.bezierCurveTo(-w * 0.7, -h * 0.98, -w * 0.05, -h * 1.15, w * 0.58, -h * 0.77);
    ctx.quadraticCurveTo(w * 0.98, -h * 0.37, w, 5);
    ctx.stroke();

    ctx.fillStyle = '#2a1947';
    ctx.beginPath();
    ctx.moveTo(-w * 0.99, 7);
    ctx.quadraticCurveTo(-w * 1.28, 12, -w * 1.4, -18);
    ctx.quadraticCurveTo(-w * 1.08, -11, -w * 0.98, -1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(99,63,124,0.5)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-w * 0.82, 20);
    ctx.bezierCurveTo(-w * 0.38, h * 0.87, w * 0.43, h * 0.87, w * 0.87, 12);
    ctx.stroke();

    // Lid crease.
    ctx.strokeStyle = 'rgba(159,95,128,0.24)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.9, -h * 0.97);
    ctx.bezierCurveTo(-w * 0.55, -h * 1.37, w * 0.36, -h * 1.33, w * 0.86, -h * 0.7);
    ctx.stroke();

    // Brows sit high and soft, partly hidden by the fringe.
    const brow = ctx.createLinearGradient(-w, 0, w, 0);
    brow.addColorStop(0, 'rgba(76,51,112,0.92)');
    brow.addColorStop(0.7, 'rgba(65,41,98,0.86)');
    brow.addColorStop(1, 'rgba(77,49,111,0.7)');
    ctx.strokeStyle = brow;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-w * 0.92, -h * 1.74);
    ctx.quadraticCurveTo(-w * 0.11, -h * 2.08, w * 0.91, -h * 1.57);
    ctx.stroke();

    ctx.restore();
  }

  eye(eyeCenters[0], -1);
  eye(eyeCenters[1], 1);

  // Nose: a tiny cool shadow without a full contour.
  const nose = ctx.createRadialGradient(512, 438, 1, 512, 438, 16);
  nose.addColorStop(0, 'rgba(214,140,150,0.3)');
  nose.addColorStop(1, 'rgba(214,140,150,0)');
  ctx.fillStyle = nose;
  ctx.beginPath();
  ctx.ellipse(512, 439, 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(186,116,130,0.2)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(505, 442);
  ctx.quadraticCurveTo(512, 447, 519, 442);
  ctx.stroke();

  // Small, softly lit mouth.
  ctx.fillStyle = 'rgba(201,107,135,0.17)';
  ctx.beginPath();
  ctx.ellipse(512, 527, 39, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,68,98,0.9)';
  ctx.lineWidth = 5.8;
  ctx.beginPath();
  ctx.moveTo(478, 522);
  ctx.quadraticCurveTo(512, 538, 546, 521);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(232,151,169,0.55)';
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(488, 531);
  ctx.quadraticCurveTo(512, 541, 536, 530);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/** Faint woven pillowcase fabric: soft rules, tiny star tufts, and a piped border feel. */
export function makePillowTexture() {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fbfdff';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(196,220,244,0.16)';
  ctx.lineWidth = 2;
  for (let i = -size; i < size * 2; i += 26) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(206,228,248,0.12)';
  ctx.lineWidth = 1.4;
  for (let i = -size; i < size * 2; i += 26) {
    ctx.beginPath();
    ctx.moveTo(i + size, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(186,214,240,0.3)';
  for (let y = 32; y < size; y += 64) {
    for (let x = 32; x < size; x += 64) {
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 8 : 3;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.3, 1.5);
  texture.anisotropy = 8;
  return texture;
}
