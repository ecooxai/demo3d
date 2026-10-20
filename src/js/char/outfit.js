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
  { y: 0.400, rx: 0.100, rz: 0.080, z: 0.000 },
  { y: 0.372, rx: 0.121, rz: 0.092, z: 0.000 },
  { y: 0.330, rx: 0.130, rz: 0.099, z: 0.002 },
  { y: 0.270, rx: 0.129, rz: 0.098, z: 0.002 },
  { y: 0.200, rx: 0.121, rz: 0.093, z: 0.000 },
  { y: 0.140, rx: 0.118, rz: 0.092, z: 0.000 },
  { y: 0.085, rx: 0.128, rz: 0.100, z: 0.002 },
  { y: 0.045, rx: 0.142, rz: 0.110, z: 0.004 },
  { y: 0.015, rx: 0.150, rz: 0.117, z: 0.005 },
  { y: 0.000, rx: 0.152, rz: 0.119, z: 0.005 },  // hem
  { y: -0.012, rx: 0.143, rz: 0.112, z: 0.005 }, // fold under
  { y: -0.020, rx: 0.132, rz: 0.104, z: 0.005 },
];

const SHORTS_ROWS = [
  { y: 0.150, rx: 0.120, rz: 0.092, z: 0.000 },
  { y: 0.110, rx: 0.131, rz: 0.102, z: 0.000 },
  { y: 0.065, rx: 0.143, rz: 0.113, z: 0.002 },
  { y: 0.015, rx: 0.154, rz: 0.124, z: 0.004 },
  { y: -0.035, rx: 0.162, rz: 0.134, z: 0.005 },
  { y: -0.080, rx: 0.167, rz: 0.141, z: 0.005 },
  { y: -0.115, rx: 0.169, rz: 0.144, z: 0.005 },  // scalloped hem
  { y: -0.140, rx: 0.161, rz: 0.137, z: 0.005 },
  { y: -0.152, rx: 0.150, rz: 0.128, z: 0.005 },  // fold under
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
  const rings = SHIRT_ROWS.map((r) => ellipseRing(0, r.y, r.z, r.rx, r.rz, RING, { squashFront: 0.04 }));
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
      superEllipsoid(0.030, 0.026, 0.030, 0.85, 0.85, 16, 12),
      M.scallop
    );
    lobe.position.set(Math.sin(a) * hem.rx * 0.99, hem.y - 0.012, Math.cos(a) * hem.rz * 0.99);
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
    pts.push(new THREE.Vector3(0, lerp(0.045, -0.150, t), 0));
  }
  const geo = sweep(pts, {
    radial: 24,
    profile: (t) => {
      const r = lerp(0.052, 0.043, smoothstep(0, 0.8, t));
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
      const dip = front * front * 0.055;
      const rx = lerp(0.058, 0.074, t) * (1 + 0.10 * front * t);
      const rz = lerp(0.055, 0.070, t) * (1 + 0.10 * front * t);
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

  // lapels running down the chest
  for (const s of [-1, 1]) {
    const ctrl = [];
    const steps = [
      { x: 0.010, y: 0.284 },
      { x: 0.022, y: 0.250 },
      { x: 0.032, y: 0.210 },
      { x: 0.039, y: 0.172 },
      { x: 0.043, y: 0.140 },
    ];
    for (const st of steps) {
      const fy = st.y - 0.16;               // chest-local → hips-local
      const z = frontZ(SHIRT_ROWS, fy, st.x) + 0.004;
      ctrl.push(new THREE.Vector3(s * st.x, st.y, z));
    }
    const curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
    const pts = curve.getSpacedPoints(16);
    const nrm = pts.map(() => new THREE.Vector3(s * 0.28, 0, 0.96).normalize());
    const geo = sweep(pts, {
      radial: 8,
      frameNormals: nrm,
      profile: (t) => {
        const w = lerp(0.0135, 0.005, Math.pow(t, 0.85));
        return { rx: w, ry: 0.0055 };
      },
      capStart: true, capEnd: true,
    });
    const m = new THREE.Mesh(geo, M.collar);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
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
    profile: () => ({ rx: 0.0135, ry: 0.004 }),
    capStart: true, capEnd: true,
  });
  const strip = new THREE.Mesh(geo, M.collar);
  strip.castShadow = true;
  g.add(strip);

  // pearl buttons
  const btnGeo = superEllipsoid(0.0072, 0.0072, 0.0034, 0.75, 0.75, 14, 10);
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
  const x = 0.052;
  const fy = y - 0.16;
  const z = frontZ(SHIRT_ROWS, fy, x);
  const n = new THREE.Vector3(x / 0.13, 0, (z - 0.002) / 0.10).normalize();

  const backing = new THREE.Mesh(roundedBox(0.082, 0.076, 0.007, 0.010, 3), M.collar);
  backing.position.set(x, y, z + 0.004);
  backing.lookAt(backing.position.clone().add(n));
  g.add(backing);

  const face = new THREE.Mesh(roundedBox(0.073, 0.067, 0.009, 0.008, 3), M.pajama);
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
