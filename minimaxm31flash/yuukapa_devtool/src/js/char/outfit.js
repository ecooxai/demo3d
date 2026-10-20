/**
 * outfit.js — the light-blue cat-print pyjamas.
 * The garments are lofted shells that wrap the body rig, with a
 * scalloped bloomer hem, a notched collar, pearl buttons and a
 * piped chest pocket.
 */
import * as THREE from 'three';
import { loft, sweep, ellipseRing, roundedBox, superEllipsoid, clamp, lerp, smoothstep, rng } from '../lib/geom.js';

/* ── garment shells are described in "hips" space (y=0 at the hip line) ── */
const SHIRT_ROWS = [
  { y: 0.412, rx: 0.092, rz: 0.066, z: 0.000 },
  { y: 0.380, rx: 0.100, rz: 0.072, z: 0.000 },
  { y: 0.340, rx: 0.103, rz: 0.076, z: 0.002 },
  { y: 0.280, rx: 0.100, rz: 0.075, z: 0.002 },
  { y: 0.210, rx: 0.094, rz: 0.072, z: 0.000 },
  { y: 0.145, rx: 0.091, rz: 0.070, z: 0.000 },
  { y: 0.100, rx: 0.093, rz: 0.072, z: 0.002 },
  { y: 0.070, rx: 0.095, rz: 0.074, z: 0.004 },
  { y: 0.048, rx: 0.098, rz: 0.077, z: 0.005 },
  { y: 0.034, rx: 0.098, rz: 0.078, z: 0.005 },  // hem
  { y: 0.022, rx: 0.088, rz: 0.070, z: 0.005 },  // fold under
  { y: 0.010, rx: 0.081, rz: 0.065, z: 0.005 },
];

const SHORTS_ROWS = [
  { y: 0.150, rx: 0.086, rz: 0.069, z: 0.000 },
  { y: 0.110, rx: 0.095, rz: 0.076, z: 0.000 },
  { y: 0.065, rx: 0.104, rz: 0.084, z: 0.002 },
  { y: 0.015, rx: 0.110, rz: 0.091, z: 0.004 },
  { y: -0.042, rx: 0.116, rz: 0.097, z: 0.005 },   // puffy bloomer
  { y: -0.092, rx: 0.118, rz: 0.100, z: 0.005 },
  { y: -0.140, rx: 0.112, rz: 0.095, z: 0.005 },
  { y: -0.174, rx: 0.100, rz: 0.084, z: 0.005 },  // scalloped hem
  { y: -0.196, rx: 0.090, rz: 0.075, z: 0.005 },
  { y: -0.210, rx: 0.082, rz: 0.068, z: 0.005 },  // fold under
];

function sampleRows(rows, y) {
  if (y >= rows[0].y) return rows[0];
  for (let i = 0; i < rows.length - 1; i++) {
    if (y <= rows[i].y && y >= rows[i + 1].y) {
      const t = (rows[i].y - y) / (rows[i].y - rows[i + 1].y);
      return {
        y,
        rx: lerp(rows[i].rx, rows[i + 1].rx, t),
        rz: lerp(rows[i].rz, rows[i + 1].rz, t),
        z: lerp(rows[i].z, rows[i + 1].z, t),
      };
    }
  }
  return rows[rows.length - 1];
}

/** Front surface z of a garment at a given height and x. */
function frontZ(rows, y, x = 0) {
  const r = sampleRows(rows, y);
  const k = clamp(1 - (x / r.rx) ** 2, 0.02, 1);
  return r.z + r.rz * Math.sqrt(k) * (1 - 0.04);
}

const RING = 40;

/** Build the pyjama shirt. */
function buildShirt(M) {
  const rings = SHIRT_ROWS.map((r, ri) => {
    const ring = [];
    const t = ri / (SHIRT_ROWS.length - 1);
    // soft vertical folds make the loose cotton read as cloth
    const foldAmp = 0.020 * smoothstep(0.15, 0.9, 1 - t);
    for (let j = 0; j < RING; j++) {
      const a = (j / RING) * Math.PI * 2;
      const fold = 1 + foldAmp * (Math.cos(a * 5 + 0.6) * 0.6 + Math.cos(a * 3 - 1.1) * 0.4);
      const x = Math.sin(a) * r.rx * fold;
      const z = Math.cos(a) * r.rz * fold + r.z;
      ring.push(new THREE.Vector3(x, r.y, z));
    }
    return ring;
  });
  const geo = loft(rings, {
    capStart: true, capEnd: true,
    colorFn: (rowT) => {
      // gentle occlusion towards the hem and under the arms
      const k = lerp(1.0, 0.86, Math.pow(1 - rowT, 2.2));
      return [k, k, k];
    },
  });
  const m = new THREE.Mesh(geo, M.pajama);
  m.name = 'shirt';
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Build the bloomer shorts with the scalloped hem. */
function buildShorts(M) {
  const LOBES = 15;
  const HEM_LOBES = 15;
  const rings = SHORTS_ROWS.map((r, ri) => {
    const ring = [];
    const isHem = ri >= SHORTS_ROWS.length - 3;
    for (let j = 0; j < RING; j++) {
      const a = (j / RING) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const wave = isHem ? Math.cos(a * LOBES) : 0;
      const amp = ri === SHORTS_ROWS.length - 3 ? 1.0 : ri === SHORTS_ROWS.length - 2 ? 0.75 : 0;
      const k = 1 + wave * 0.055 * amp;
      const x = sa * r.rx * k;
      const z = ca * r.rz * k + r.z;
      const y = r.y + (ri === SHORTS_ROWS.length - 3 ? wave * 0.022 : 0);
      ring.push(new THREE.Vector3(x, y, z));
    }
    return ring;
  });
  const geo = loft(rings, {
    capStart: true, capEnd: true,
    colorFn: (rowT) => {
      // the scalloped lobes are a deeper blue than the body
      const dark = rowT > 0.80 ? lerp(1.0, 0.66, (rowT - 0.80) / 0.20) : 1.0;
      const k = lerp(1.02, 0.97, rowT) * dark;
      return [k, k, k];
    },
  });
  const m = new THREE.Mesh(geo, M.pajama);
  m.name = 'shorts';
  m.castShadow = true;
  m.receiveShadow = true;

  // rounded scallop lobes hanging off the hem
  const group = new THREE.Group();
  group.add(m);
  const hem = SHORTS_ROWS[SHORTS_ROWS.length - 3];
  for (let i = 0; i < HEM_LOBES; i++) {
    const a = (i / HEM_LOBES) * Math.PI * 2 + 0.1;
    const lobe = new THREE.Mesh(
      superEllipsoid(0.026, 0.022, 0.026, 0.8, 0.8, 16, 12),
      M.scallop
    );
    lobe.position.set(Math.sin(a) * hem.rx * 1.01, hem.y - 0.010, Math.cos(a) * hem.rz * 1.01);
    lobe.scale.set(1, 1, 1);
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  }
  group.name = 'shorts';
  return group;
}

/** Short sleeve that hugs the upper arm. */
function buildSleeve(M) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector3(0, lerp(0.072, -0.140, t), 0));
  }
  const geo = sweep(pts, {
    radial: 24,
    profile: (t) => {
      const r = lerp(0.058, 0.043, smoothstep(0, 0.75, t));
      const round = t > 0.86 ? 1 - 0.55 * Math.pow((t - 0.86) / 0.14, 2) : 1;
      return { rx: r * round, ry: r * round };
    },
    capStart: true, capEnd: true,
    colorFn: (t) => { const k = lerp(1.0, 0.90, t); return [k, k, k]; },
  });
  const m = new THREE.Mesh(geo, M.pajama);
  m.name = 'sleeve';
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** White notched collar: a band round the neck plus two lapels. */
function buildCollar(M) {
  const g = new THREE.Group();
  g.name = 'collar';

  // band around the neck (chest-local space, neck sits at y = 0.28)
  const rows = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const ring = [];
    for (let j = 0; j < 40; j++) {
      const a = (j / 40) * Math.PI * 2;
      const front = Math.max(0, Math.cos(a));
      // the front dips into the V opening
      const dip = front * front * 0.075;
      const rx = lerp(0.040, 0.058, t) * (1 + 0.10 * front * t);
      const rz = lerp(0.038, 0.055, t) * (1 + 0.10 * front * t);
      const x = Math.sin(a) * rx;
      const z = Math.cos(a) * rz;
      const y = lerp(0.305, 0.268, t) - dip;
      ring.push(new THREE.Vector3(x, y, z));
    }
    rows.push(ring);
  }
  const band = new THREE.Mesh(loft(rows, { closed: true, capStart: false, capEnd: false }), M.collar);
  band.castShadow = true;
  band.receiveShadow = true;
  g.add(band);

  // the open neckline: a V of bare chest framed by the collar
  const V = [
    { x: 0.003, y: 0.288 },
    { x: 0.010, y: 0.262 },
    { x: 0.016, y: 0.232 },
    { x: 0.021, y: 0.202 },
    { x: 0.024, y: 0.176 },
  ];
  const vEdge = (t) => {
    // sample the V polyline
    const f = t * (V.length - 1);
    const i = Math.min(V.length - 2, Math.floor(f));
    const k = f - i;
    return new THREE.Vector3(
      lerp(V[i].x, V[i + 1].x, k),
      lerp(V[i].y, V[i + 1].y, k),
      0
    );
  };
  {
    const rows = 16;
    const vp = [], vIdx = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows;
      const e = vEdge(t);
      const halfW = e.x;
      const fy = e.y - 0.16;
      const zc = frontZ(SHIRT_ROWS, fy, 0) + 0.0035;
      const zl = frontZ(SHIRT_ROWS, fy, halfW) + 0.0035;
      vp.push(-halfW, e.y, zl, 0, e.y, zc, halfW, e.y, zl);
    }
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < 2; j++) {
        const a = i * 3 + j, b = i * 3 + j + 1;
        const c = (i + 1) * 3 + j + 1, d = (i + 1) * 3 + j;
        vIdx.push(a, d, b, b, d, c);
      }
    }
    const vGeo = new THREE.BufferGeometry();
    vGeo.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3));
    vGeo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((vp.length / 3) * 2).fill(0), 2));
    vGeo.setIndex(vIdx);
    vGeo.computeVertexNormals();
    const chest = new THREE.Mesh(vGeo, M.skin);
    chest.name = 'neckline';
    chest.receiveShadow = true;
    g.add(chest);
  }

  // collar flaps: flat white strips that run along the V
  for (const s of [-1, 1]) {
    const rows = 16;
    const fp = [], fIdx = [];
    for (let i = 0; i <= rows; i++) {
      const t = i / rows;
      const e = vEdge(t);
      // outward direction in the chest plane
      const e2 = vEdge(Math.min(1, t + 0.02));
      const dir = new THREE.Vector3(e2.x - e.x, e2.y - e.y, 0);
      if (dir.lengthSq() < 1e-9) dir.set(s, -0.4, 0);
      dir.normalize();
      const out = new THREE.Vector3(-dir.y * s, dir.x * s, 0).normalize();
      const w = lerp(0.021, 0.009, Math.pow(t, 0.7));
      const fy = e.y - 0.16;
      for (let j = 0; j <= 1; j++) {
        const x = s * e.x + out.x * w * j;
        const y = e.y + out.y * w * j;
        const z = frontZ(SHIRT_ROWS, fy, Math.abs(x)) + 0.0045 + 0.002 * (1 - j);
        fp.push(x, y, z);
      }
    }
    for (let i = 0; i < rows; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2 + 1, d = (i + 1) * 2;
      if (s > 0) fIdx.push(a, d, b, b, d, c);
      else fIdx.push(a, b, d, b, c, d);
    }
    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
    fGeo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((fp.length / 3) * 2).fill(0), 2));
    fGeo.setIndex(fIdx);
    fGeo.computeVertexNormals();
    const flap = new THREE.Mesh(fGeo, M.collar);
    flap.name = 'collarFlap';
    flap.castShadow = true;
    flap.receiveShadow = true;
    g.add(flap);
  }

  return g;
}

/** Button placket down the centre front. */
function buildPlacket(M) {
  const g = new THREE.Group();
  g.name = 'placket';

  const ctrl = [];
  const ys = [0.395, 0.330, 0.250, 0.170, 0.090, 0.020];
  for (const y of ys) {
    const fy = y - 0.16;
    ctrl.push(new THREE.Vector3(0, y, frontZ(SHIRT_ROWS, fy, 0) + 0.003));
  }
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
  const pts = curve.getSpacedPoints(20);
  const nrm = pts.map(() => new THREE.Vector3(0, 0, 1));
  const geo = sweep(pts, {
    radial: 6,
    frameNormals: nrm,
    profile: () => ({ rx: 0.0075, ry: 0.003 }),
    capStart: true, capEnd: true,
  });
  const strip = new THREE.Mesh(geo, M.pajamaPlain);
  strip.castShadow = true;
  g.add(strip);

  // pearl buttons
  const btnGeo = superEllipsoid(0.0048, 0.0048, 0.0026, 0.75, 0.75, 14, 10);
  [0.370, 0.298, 0.226, 0.154, 0.082, 0.020].forEach((y, i) => {
    const fy = y - 0.16;
    const b = new THREE.Mesh(btnGeo, M.button);
    b.position.set(0, y, frontZ(SHIRT_ROWS, fy, 0) + 0.010);
    b.castShadow = true;
    g.add(b);
  });

  return g;
}

/** Piped chest pocket on the character's left. */
function buildPocket(M) {
  const g = new THREE.Group();
  g.name = 'pocket';

  const y = 0.170;               // chest-local
  const x = 0.036;
  const fy = y - 0.16;
  const z = frontZ(SHIRT_ROWS, fy, x);
  const n = new THREE.Vector3(x / 0.13, 0, (z - 0.002) / 0.10).normalize();

  const backing = new THREE.Mesh(roundedBox(0.062, 0.058, 0.006, 0.008, 3), M.collar);
  backing.position.set(x, y, z + 0.004);
  backing.lookAt(backing.position.clone().add(n));
  g.add(backing);

  const face = new THREE.Mesh(roundedBox(0.055, 0.050, 0.008, 0.006, 3), M.pajama);
  face.position.copy(backing.position).addScaledVector(n, 0.004);
  face.quaternion.copy(backing.quaternion);
  g.add(face);

  return g;
}

/* ══════════════════════════════════════════════════════════════
   Assemble
   ══════════════════════════════════════════════════════════════ */
export function buildOutfit(M, rig) {
  const g = new THREE.Group();
  g.name = 'outfit';

  const shirt = buildShirt(M);
  rig.hips.add(shirt);

  const shorts = buildShorts(M);
  rig.hips.add(shorts);

  const collar = buildCollar(M);
  rig.chest.add(collar);

  const placket = buildPlacket(M);
  rig.chest.add(placket);

  const pocket = buildPocket(M);
  rig.chest.add(pocket);

  for (const side of ['L', 'R']) {
    const sleeve = buildSleeve(M);
    sleeve.name = 'sleeve' + side;
    rig.arms[side].shoulder.add(sleeve);
  }

  return g;
}
