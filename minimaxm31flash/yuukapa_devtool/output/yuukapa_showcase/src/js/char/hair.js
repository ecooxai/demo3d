/**
 * hair.js — procedural anime hair.
 * Every lock is a swept ribbon along a spline with its own width
 * profile, flat-face orientation and a root→tip colour gradient.
 *
 * The mass is built in three layers:
 *   1. a scalp shell that hides the skull
 *   2. bangs that sweep over the brow
 *   3. a long mane that falls past the knees
 */
import * as THREE from 'three';
import { sweep, clamp, lerp, smoothstep, rng } from '../lib/geom.js';
import { headSurface, headDir, headNormal, HEAD } from './head.js';

const C_ROOT = new THREE.Color(0x1d1738);
const C_MID = new THREE.Color(0x352a68);
const C_TIP = new THREE.Color(0x534590);
const C_SHEEN = new THREE.Color(0x6d5db0);
const C_HALO = new THREE.Color(0x5f8fd8);

/** the hair sits proud of the skull and is wider than it is deep */
const HAIR_SCALE_X = 1.30;
const HAIR_SCALE_Z = 1.10;

const _c = new THREE.Color();

/**
 * Per-vertex hair shading: dark root, lighter tip, plus a specular
 * band that runs across the whole mane at a constant height.
 */
function hairColor(y, t, out) {
  out.copy(C_ROOT).lerp(C_MID, smoothstep(0.02, 0.30, t));
  out.lerp(C_TIP, smoothstep(0.30, 1.0, t) * 0.9);
  const band = Math.exp(-Math.pow((y - (HEAD.center.y + 0.075)) / 0.048, 2));
  const band2 = Math.exp(-Math.pow((y - (HEAD.center.y + 0.020)) / 0.026, 2)) * 0.45;
  const s = clamp(band * 0.55 + band2, 0, 1);
  out.lerp(C_SHEEN, s * 0.38);
  // cyan bounce from the halo overhead
  const glow = clamp((y - (HEAD.center.y + 0.055)) / 0.075, 0, 1);
  out.lerp(C_HALO, glow * glow * 0.30);
  return out;
}

/** Build one hair lock mesh. */
function lockMesh(points, normals, {
  width = 0.026, thickness = 0.0075, radial = 9,
  widthFn = null, twistFn = null,
} = {}) {
  const geo = sweep(points, {
    radial,
    frameNormals: normals,
    profile: (t) => {
      let w = width;
      if (widthFn) w = widthFn(t);
      const th = thickness * (0.30 + 0.70 * Math.sin(Math.PI * Math.pow(clamp(t, 0, 1), 0.5)));
      return { rx: w, ry: th, twist: twistFn ? twistFn(t) : 0 };
    },
    colorFn: (t, i) => {
      const c = hairColor(points[i].y, t, _c);
      return [c.r, c.g, c.b];
    },
    uvFn: (t, i, j) => [j / radial, t],
  });
  return geo;
}

/** Sample a Catmull-Rom through control points. */
function spline(ctrl, count) {
  const curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
  return curve.getSpacedPoints(count - 1);
}

/** Hair surface point: head surface pushed out and slightly enlarged. */
function hairPoint(az, el, inflate = 0) {
  const p = headSurface(az, el, inflate);
  p.x *= HAIR_SCALE_X;
  p.z *= HAIR_SCALE_Z;
  return p;
}

/* ══════════════════════════════════════════════════════════════
   Build
   ══════════════════════════════════════════════════════════════ */
export function buildHair(M) {
  const root = new THREE.Group();
  root.name = 'hair';
  const rand = rng(77021);

  /* ── 1. scalp shell ─────────────────────────────────────── */
  {
    const rows = 30, colCount = 72;
    const verts = [], idx = [], uvs = [];
    const lower = (az) => 0.58 - 1.22 * Math.pow(0.5 - 0.5 * Math.cos(az), 1.3);
    for (let i = 0; i < rows; i++) {
      const rt = i / (rows - 1);
      for (let j = 0; j < colCount; j++) {
        const ct = j / colCount;
        const az = ct * Math.PI * 2;
        const lo = lower(az);
        const el = lerp(lo, 1.56, rt);
        // thickness grows towards the crown
        const thick = 0.003 + 0.017 * Math.pow(rt, 0.62) * (1 - 0.5 * Math.pow(1 - rt, 3));
        const p = hairPoint(az, el, thick);
        verts.push(p.x, p.y, p.z);
        uvs.push(ct * 3, rt * 2);
      }
    }
    for (let i = 0; i < rows - 1; i++) {
      for (let j = 0; j < colCount; j++) {
        const j2 = (j + 1) % colCount;
        const a = i * colCount + j, b = i * colCount + j2;
        const c = (i + 1) * colCount + j2, d = (i + 1) * colCount + j;
        idx.push(a, b, d, b, c, d);
      }
    }
    const capGeo = new THREE.BufferGeometry();
    capGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    capGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const cols = new Float32Array((verts.length / 3) * 3);
    for (let i = 0; i < verts.length / 3; i++) {
      const c = hairColor(verts[i * 3 + 1], 0.20, _c);
      cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
    }
    capGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    capGeo.setIndex(idx);
    capGeo.computeVertexNormals();
    const cap = new THREE.Mesh(capGeo, M.hair);
    cap.name = 'hairCap';
    cap.castShadow = true;
    cap.receiveShadow = true;
    root.add(cap);
  }

  /* ── 2. bangs: swept over the brow ─────────────────────── */
  {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      // a soft off-centre part, as in the reference
      const azRoot = lerp(-1.38, 1.34, t) + (rand() - 0.5) * 0.06;
      const jitter = (rand() - 0.5);

      // most locks stop just above the brow, a few fall past the cheek
      const long = Math.abs(t - 0.16) < 0.12 || Math.abs(t - 0.84) < 0.10;
      const elTip = long ? -0.06 - jitter * 0.16 : 0.26 + jitter * 0.16;

      const ctrl = [];
      ctrl.push(hairPoint(azRoot * 0.35, 1.22, 0.016));
      ctrl.push(hairPoint(azRoot * 0.66, 0.94, 0.017));
      ctrl.push(hairPoint(azRoot * 0.86, 0.58, 0.016));
      ctrl.push(hairPoint(azRoot * 0.97, 0.26, 0.015));
      ctrl.push(hairPoint(azRoot * 1.02, elTip * 0.5 + 0.12, 0.013));
      ctrl.push(hairPoint(azRoot * 1.07, elTip, 0.009));
      const tip = ctrl[ctrl.length - 1].clone();
      tip.z += 0.006; tip.x += azRoot * 0.008;
      ctrl.push(tip);

      const pts = spline(ctrl, 20);
      const nrm = pts.map((p, k) => {
        const u = k / (pts.length - 1);
        return headNormal(headDir(lerp(azRoot * 0.35, azRoot * 1.07, u), lerp(1.22, elTip, u)));
      });
      const w = 0.030 * (0.78 + 0.34 * Math.sin(t * Math.PI));
      const geo = lockMesh(pts, nrm, {
        width: w,
        thickness: 0.0085,
        radial: 9,
        widthFn: (u) => {
          const base = 0.26 + 0.74 * Math.pow(Math.sin(Math.PI * Math.pow(clamp(u, 0, 1), 0.45)), 0.5);
          const flare = 1 + 0.42 * smoothstep(0.35, 0.78, u);
          return w * base * flare * (1 - smoothstep(0.86, 1.0, u));
        },
        twistFn: (u) => Math.sin(u * 2.2) * 0.18,
      });
      const m = new THREE.Mesh(geo, M.hair);
      m.name = 'bang' + i;
      m.castShadow = true;
      m.receiveShadow = true;
      root.add(m);
    }
  }

  /* ── 3. side locks framing the face ─────────────────────── */
  for (const s of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      const spread = k === 0 ? 0.0 : 0.030;
      const ctrl = [];
      ctrl.push(hairPoint(s * (1.30 + k * 0.16), 0.58, 0.016));
      ctrl.push(hairPoint(s * (1.50 + k * 0.10), 0.22, 0.016));
      ctrl.push(hairPoint(s * (1.52 + k * 0.08), -0.22, 0.015));
      ctrl.push(new THREE.Vector3(s * (0.118 + spread), HEAD.center.y - 0.10, 0.038));
      ctrl.push(new THREE.Vector3(s * (0.126 + spread), HEAD.center.y - 0.23, 0.018));
      ctrl.push(new THREE.Vector3(s * (0.134 + spread), HEAD.center.y - 0.34, -0.002));
      const pts = spline(ctrl, 18);
      const nrm = pts.map(() => new THREE.Vector3(s * 0.52, 0, 0.85).normalize());
      const geo = lockMesh(pts, nrm, {
        width: 0.022, thickness: 0.008, radial: 9,
        widthFn: (u) => 0.022 * (0.42 + 0.58 * Math.sin(Math.PI * Math.pow(clamp(u, 0, 1), 0.45))) * (1 - smoothstep(0.88, 1, u)),
      });
      const m = new THREE.Mesh(geo, M.hair);
      m.name = 'sideLock' + s + k;
      m.castShadow = true;
      m.receiveShadow = true;
      root.add(m);
    }
  }

  /* ── 4. the mane: long back hair past the knees ─────────── */
  {
    const n = 30;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const beta = lerp(-1.62, 1.62, t) + (rand() - 0.5) * 0.05;
      const azRoot = Math.PI + beta;

      // the mane is heavier on the character's left (+X)
      const sideBias = 0.036 * Math.sin(t * Math.PI * 1.05);
      const rootX = Math.sin(azRoot) * 0.098;
      const endX = rootX * 1.30 + sideBias + (t - 0.5) * 0.13;

      const len = 0.62 + 0.60 * Math.sin(Math.PI * Math.pow(t, 0.85)) + (rand() - 0.5) * 0.08;

      const ctrl = [];
      ctrl.push(hairPoint(azRoot, 0.98, 0.016));
      ctrl.push(hairPoint(azRoot, 0.42, 0.017));
      ctrl.push(new THREE.Vector3(rootX * 1.04, HEAD.center.y - 0.01, -0.122 - 0.02 * Math.cos(beta)));
      ctrl.push(new THREE.Vector3(endX * 0.94, HEAD.center.y - 0.22, -0.142 - 0.03 * Math.cos(beta)));
      ctrl.push(new THREE.Vector3(endX * 1.02, HEAD.center.y - 0.24 - len * 0.52, -0.122 - 0.02 * Math.cos(beta)));
      ctrl.push(new THREE.Vector3(endX * 1.10, HEAD.center.y - 0.26 - len, -0.078 - 0.01 * Math.cos(beta)));

      const pts = spline(ctrl, 24);
      const nrm = pts.map((p) => {
        const n = new THREE.Vector3(p.x, 0, p.z);
        if (n.lengthSq() < 1e-6) n.set(0, 0, -1);
        return n.normalize();
      });
      const w = 0.046 + 0.022 * Math.sin(t * Math.PI);
      const geo = lockMesh(pts, nrm, {
        width: w, thickness: 0.010, radial: 8,
        widthFn: (u) => {
          const base = 0.62 + 0.38 * Math.sin(Math.PI * Math.pow(clamp(u, 0, 1), 0.4));
          return w * base * (1 - smoothstep(0.90, 1.0, u));
        },
        twistFn: (u) => Math.sin(u * 2.6 + t * 4.0) * 0.26,
      });
      const m = new THREE.Mesh(geo, M.hair);
      m.name = 'mane' + i;
      m.castShadow = true;
      m.receiveShadow = true;
      root.add(m);
    }
  }

  /* ── 5. the crown volume + a springy curl ───────────────── */
  {
    for (let i = 0; i < 5; i++) {
      const a = -0.9 + i * 0.45;
      const ctrl = [
        hairPoint(a, 1.25, 0.015),
        hairPoint(a * 0.8, 1.46, 0.020),
        new THREE.Vector3(Math.sin(a) * 0.06, HEAD.center.y + 0.135, Math.cos(a) * 0.07),
      ];
      const pts = spline(ctrl, 10);
      const nrm = pts.map((p) => {
        const n = new THREE.Vector3(p.x, 0, p.z);
        if (n.lengthSq() < 1e-6) n.set(0, 0, 1);
        return n.normalize();
      });
      const geo = lockMesh(pts, nrm, {
        width: 0.030, thickness: 0.010, radial: 8,
        widthFn: (u) => 0.030 * (0.55 + 0.45 * Math.sin(Math.PI * clamp(u, 0, 1))) * (1 - smoothstep(0.8, 1, u)),
      });
      const m = new THREE.Mesh(geo, M.hair);
      m.name = 'crown' + i;
      m.castShadow = true;
      root.add(m);
    }

    // the curl that springs off the crown
    const ctrl = [
      hairPoint(-1.05, 1.10, 0.014),
      new THREE.Vector3(-0.128, HEAD.center.y + 0.128, 0.012),
      new THREE.Vector3(-0.168, HEAD.center.y + 0.162, 0.046),
      new THREE.Vector3(-0.198, HEAD.center.y + 0.116, 0.076),
      new THREE.Vector3(-0.172, HEAD.center.y + 0.072, 0.092),
      new THREE.Vector3(-0.128, HEAD.center.y + 0.086, 0.080),
    ];
    const pts = spline(ctrl, 18);
    const nrm = pts.map(() => new THREE.Vector3(-0.25, 0, 0.97).normalize());
    const geo = lockMesh(pts, nrm, {
      width: 0.017, thickness: 0.007, radial: 8,
      widthFn: (u) => 0.017 * (0.5 + 0.5 * Math.sin(Math.PI * clamp(u, 0, 1))) * (1 - smoothstep(0.86, 1, u)),
    });
    const m = new THREE.Mesh(geo, M.hair);
    m.name = 'curl';
    m.castShadow = true;
    root.add(m);
  }

  /* ── 6. fly-away strands for silhouette life ────────────── */
  for (let i = 0; i < 6; i++) {
    const s = i % 2 === 0 ? -1 : 1;
    const az = s * (1.15 + rand() * 0.75);
    const ctrl = [
      hairPoint(az, 0.95, 0.012),
      new THREE.Vector3(s * (0.125 + rand() * 0.035), HEAD.center.y + 0.05, 0.02),
      new THREE.Vector3(s * (0.145 + rand() * 0.04), HEAD.center.y - 0.06, -0.01),
      new THREE.Vector3(s * (0.152 + rand() * 0.045), HEAD.center.y - 0.17 - rand() * 0.1, -0.03),
    ];
    const pts = spline(ctrl, 14);
    const nrm = pts.map((p) => {
      const n = new THREE.Vector3(p.x, 0, p.z);
      if (n.lengthSq() < 1e-6) n.set(0, 0, 1);
      return n.normalize();
    });
    const geo = lockMesh(pts, nrm, {
      width: 0.012, thickness: 0.005, radial: 6,
      widthFn: (u) => 0.012 * (1 - smoothstep(0.3, 1, u)) + 0.001,
    });
    const m = new THREE.Mesh(geo, M.hair);
    m.name = 'flyaway' + i;
    root.add(m);
  }

  return root;
}
