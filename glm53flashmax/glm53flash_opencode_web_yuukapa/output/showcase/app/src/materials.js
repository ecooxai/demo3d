import * as THREE from 'three';

// ---------- palette (sampled by eye from reference image) ----------
export const P = {
  bg:          0xcde9f7,
  skin:        0xf9e2d8,   // warm peach (matches face canvas family)
  skinShade:   0xe7b9c4,
  hairTop:     0x4e4272,   // dark indigo root area
  hairMid:     0x5a4e82,
  hairTip:     0x8b7fb0,   // lighter violet tips
  lash:        0x352e50,
  eyeHi:       0xffffff,
  pajama:      0xd5f1fb,
  pajamaTrim:  0xf4fbff,
  shorts:      0xcdeefb,
  white:       0xffffff,
  whiteShade:  0xdfe7f2,
  pillow:      0xffffff,
  slipper:     0xf6f4f0,
  bow:         0xe97fb2,
  haloDark:    0x14161c,
  haloGlow:    0x4fd2ff,
  outlineHair: 0x2c2547,
  outlineSkin: 0x9c7f8d,
  outlineWhite:0xc9d6e6,
  outlineCloth:0x7fa8c2,
};

let _ramp = null;
let _rampSoft = null;
function buildRamp(steps) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 2;
  const g = c.getContext('2d');
  for (let i = 0; i < steps.length - 1; i++) {
    const [a, va] = steps[i], [b, vb] = steps[i + 1];
    const grd = g.createLinearGradient(a * 512, 0, b * 512, 0);
    grd.addColorStop(0, `rgb(${va},${va},${va})`);
    grd.addColorStop(1, `rgb(${va},${va},${va})`);
    g.fillStyle = grd; g.fillRect(a * 512, 0, (b - a) * 512, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}
export function toonRamp() {
  if (!_ramp) _ramp = buildRamp([
    [0, 255], [.26, 224], [.44, 196], [.60, 163], [.78, 128], [1, 96],
  ]);
  return _ramp;
}
export function toonRampSoft() {
  if (!_rampSoft) _rampSoft = buildRamp([
    [0, 255], [.30, 246], [.52, 234], [.72, 214], [.88, 192], [1, 172],
  ]);
  return _rampSoft;
}

let _rampCloth = null;
export function toonRampCloth() {
  // 7 gentle steps: cloth reads velvet-soft instead of banded pills
  if (!_rampCloth) _rampCloth = buildRamp([
    [0, 255], [.17, 250], [.33, 241], [.49, 228], [.65, 208], [.81, 184], [1, 160],
  ]);
  return _rampCloth;
}

let _rampBright = null;
export function toonRampBright() {
  // near-white cloth: stays bright, only gently shaded
  if (!_rampBright) _rampBright = buildRamp([
    [0, 255], [.22, 253], [.48, 248], [.72, 240], [.88, 230], [1, 214],
  ]);
  return _rampBright;
}

const _pool = new Map();
export function toon(color, { map = null, vertexColors = false, ramp = null, soft = null } = {}) {
  let rampTex = ramp || toonRamp();
  if (soft === true) rampTex = toonRampSoft();
  if (!ramp && !soft && soft === null) {
    // heuristic: near-white pale materials get the soft shading ramp
    const c = new THREE.Color(color);
    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    const spread = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
    if (lum > 0.9 && spread < 0.06) rampTex = toonRampSoft();
  }
  const key = `${color}|${map ? (map.uuid || map) : 'n'}|${vertexColors}|${rampTex.uuid}`;
  if (_pool.has(key)) return _pool.get(key);
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: rampTex,
    map: map || null,
    vertexColors,
  });
  _pool.set(key, m);
  return m;
}
