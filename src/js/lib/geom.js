/**
 * geom.js — procedural geometry toolkit.
 * Every mesh in this project is generated here from mathematical definitions.
 * No external assets, no primitive soup.
 */
import * as THREE from 'three';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));

export function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}
export function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
export function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

/** Deterministic pseudo-random generator (mulberry32) — repeatable builds. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap value noise in 1D, C1 continuous — used for cloth wrinkles. */
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const h = (n) => {
    let t = (n + seed * 374761393) | 0;
    t = Math.imul(t ^ (t >>> 13), 1274126177);
    return ((t ^ (t >>> 16)) >>> 0) / 4294967296;
  };
  const u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
}

/* ─────────────────────────────────────────────────────────────
   Rotation-minimising frames along a polyline
   ───────────────────────────────────────────────────────────── */
export function computeFrames(points, up = new THREE.Vector3(0, 1, 0), closed = false) {
  const n = points.length;
  const tangents = [];
  for (let i = 0; i < n; i++) {
    let t;
    if (closed) {
      t = points[(i + 1) % n].clone().sub(points[(i - 1 + n) % n]);
    } else if (i === 0) t = points[1].clone().sub(points[0]);
    else if (i === n - 1) t = points[n - 1].clone().sub(points[n - 2]);
    else t = points[i + 1].clone().sub(points[i - 1]);
    if (t.lengthSq() < 1e-16) t = new THREE.Vector3(0, 1, 0);
    tangents.push(t.normalize());
  }

  /* initial frame: use whichever world axis is least aligned with the
     tangent so the reference is never (nearly) parallel to it */
  const t0 = tangents[0];
  const ax = Math.abs(t0.x), ay = Math.abs(t0.y), az = Math.abs(t0.z);
  let ref;
  if (ax <= ay && ax <= az) ref = new THREE.Vector3(1, 0, 0);
  else if (ay <= az) ref = new THREE.Vector3(0, 1, 0);
  else ref = new THREE.Vector3(0, 0, 1);
  let nrm = ref.clone().sub(t0.clone().multiplyScalar(ref.dot(t0)));
  if (nrm.lengthSq() < 1e-8) {
    nrm = up.clone().sub(t0.clone().multiplyScalar(up.dot(t0)));
    if (nrm.lengthSq() < 1e-8) nrm.set(0, 0, 1);
  }
  nrm.normalize();

  const normals = [nrm];
  const binormals = [new THREE.Vector3().crossVectors(t0, nrm).normalize()];

  /* rotation-minimising frames (double reflection) with a final
     re-orthogonalisation against the new tangent — without that the
     frame flips on nearly-straight curves */
  for (let i = 1; i < n; i++) {
    const tPrev = tangents[i - 1];
    const tCur = tangents[i];
    const v1 = tCur.clone().sub(tPrev);
    const c = v1.lengthSq();
    let nextN;
    if (c < 1e-12) {
      nextN = normals[i - 1].clone();
    } else {
      const nL = normals[i - 1].clone()
        .sub(v1.clone().multiplyScalar((2 * v1.dot(normals[i - 1])) / c));
      nextN = nL.sub(tCur.clone().multiplyScalar(nL.dot(tCur)));
      if (nextN.lengthSq() < 1e-12) {
        nextN = normals[i - 1].clone().sub(tCur.clone().multiplyScalar(normals[i - 1].dot(tCur)));
      }
      nextN.normalize();
    }
    normals.push(nextN);
    binormals.push(new THREE.Vector3().crossVectors(tCur, nextN).normalize());
  }
  return { tangents, normals, binormals };
}

/* ─────────────────────────────────────────────────────────────
   Sweep a profile along a polyline.
   profileFn(t, i) -> { rx, ry, twist }  (elliptical cross-section)
   ───────────────────────────────────────────────────────────── */
export function sweep(points, {
  radial = 12,
  profile = () => ({ rx: 0.02, ry: 0.02 }),
  up = new THREE.Vector3(0, 1, 0),
  closed = false,
  capStart = true,
  capEnd = true,
  colorFn = null,          // (t, i, j) -> [r,g,b]
  uvFn = null,             // (t, i, j) -> [u,v]
  frameNormals = null,     // optional per-point "flat-face" direction
} = {}) {
  const n = points.length;
  let tangents, normals, binormals;
  if (frameNormals) {
    // user supplied flat-face direction: normal = that direction made
    // perpendicular to the tangent, binormal = tangent x normal
    tangents = [];
    for (let i = 0; i < n; i++) {
      let t;
      if (closed) t = points[(i + 1) % n].clone().sub(points[(i - 1 + n) % n]);
      else if (i === 0) t = points[1].clone().sub(points[0]);
      else if (i === n - 1) t = points[n - 1].clone().sub(points[n - 2]);
      else t = points[i + 1].clone().sub(points[i - 1]);
      tangents.push(t.normalize());
    }
    normals = []; binormals = [];
    for (let i = 0; i < n; i++) {
      const t = tangents[i];
      let nn = frameNormals[i].clone();
      nn.addScaledVector(t, -nn.dot(t));
      if (nn.lengthSq() < 1e-9) nn.set(0, 0, 1).addScaledVector(t, -t.z);
      nn.normalize();
      normals.push(nn);
      binormals.push(new THREE.Vector3().crossVectors(t, nn).normalize());
    }
  } else {
    ({ tangents, normals, binormals } = computeFrames(points, up, closed));
  }
  const rings = n;
  const radialCount = closed ? radial : radial;
  const verts = [];
  const uvs = [];
  const cols = [];
  const idx = [];

  for (let i = 0; i < rings; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const p = profile(t, i);
    const rx = p.rx, ry = p.ry === undefined ? p.rx : p.ry;
    const twist = p.twist || 0;
    const P = points[i], N = normals[i], B = binormals[i];
    for (let j = 0; j < radialCount; j++) {
      const a = (j / radialCount) * Math.PI * 2 + twist;
      const ca = Math.cos(a), sa = Math.sin(a);
      const v = new THREE.Vector3()
        .copy(P)
        .addScaledVector(B, ca * rx)   // rx = width  (across the ribbon)
        .addScaledVector(N, sa * ry);  // ry = thickness (through the ribbon)
      verts.push(v.x, v.y, v.z);
      if (uvFn) { const uv = uvFn(t, i, j); uvs.push(uv[0], uv[1]); }
      else uvs.push(j / radialCount, t);
      if (colorFn) { const c = colorFn(t, i, j); cols.push(c[0], c[1], c[2]); }
      else cols.push(1, 1, 1);
    }
  }
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < radialCount; j++) {
      const j2 = (j + 1) % radialCount;
      const a = i * radialCount + j;
      const b = i * radialCount + j2;
      const c = (i + 1) * radialCount + j2;
      const d = (i + 1) * radialCount + j;
      idx.push(a, d, b, b, d, c);
    }
  }
  if (closed) {
    // join the final ring back to the first
    const last = (rings - 1) * radialCount;
    for (let j = 0; j < radialCount; j++) {
      const j2 = (j + 1) % radialCount;
      const a = last + j, b = last + j2;
      const c = j2, d = j;
      idx.push(a, d, b, b, d, c);
    }
  }

  // caps
  const addCap = (ringIndex, flip) => {
    const base = verts.length / 3;
    const P = points[ringIndex];
    verts.push(P.x, P.y, P.z);
    if (uvFn) uvs.push(0.5, 0.5); else uvs.push(0.5, ringIndex === 0 ? 0 : 1);
    if (colorFn) { const c = colorFn(ringIndex === 0 ? 0 : 1, ringIndex, 0); cols.push(c[0], c[1], c[2]); }
    else cols.push(1, 1, 1);
    const t = ringIndex === 0 ? 0 : 1;
    const p = profile(t, ringIndex);
    for (let j = 0; j < radialCount; j++) {
      const j2 = (j + 1) % radialCount;
      const src = ringIndex * radialCount + j;
      const src2 = ringIndex * radialCount + j2;
      if (flip) idx.push(base, src, src2);
      else idx.push(base, src2, src);
    }
  };
  if (!closed) {
    if (capStart) addCap(0, true);
    if (capEnd) addCap(rings - 1, false);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ─────────────────────────────────────────────────────────────
   Loft: connect a list of equal-length rings.
   ───────────────────────────────────────────────────────────── */
export function loft(rings, {
  closed = false,
  capStart = false,
  capEnd = false,
  colorFn = null,      // (rowT, colT, ringIndex) -> [r,g,b]
  uvFn = null,         // (rowT, colT, ringIndex) -> [u,v]
  smooth = true,
} = {}) {
  const rows = rings.length, cols = rings[0].length;
  // ring order may run bottom→top or top→bottom; detect it so the
  // surface always ends up with outward-facing normals
  const avgY = (ring) => { let s = 0; for (const p of ring) s += p.y; return s / ring.length; };
  const inverted = avgY(rings[rows - 1]) < avgY(rings[0]);
  const verts = [], uvs = [], cols_ = [], idx = [];
  for (let i = 0; i < rows; i++) {
    const rowT = rows === 1 ? 0 : i / (rows - 1);
    for (let j = 0; j < cols; j++) {
      const colT = j / cols;
      const v = rings[i][j];
      verts.push(v.x, v.y, v.z);
      if (uvFn) { const uv = uvFn(rowT, colT, i); uvs.push(uv[0], uv[1]); }
      else uvs.push(colT, rowT);
      if (colorFn) { const c = colorFn(rowT, colT, i); cols_.push(c[0], c[1], c[2]); }
      else cols_.push(1, 1, 1);
    }
  }
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const j2 = (j + 1) % cols;
      const a = i * cols + j, b = i * cols + j2;
      const c = (i + 1) * cols + j2, d = (i + 1) * cols + j;
      if (inverted) idx.push(a, d, b, b, d, c);
      else idx.push(a, b, d, b, c, d);
    }
  }
  if (closed) {
    // stitch the last row round to the first
    const base = (rows - 1) * cols;
    for (let j = 0; j < cols; j++) {
      const j2 = (j + 1) % cols;
      const a = base + j, b = base + j2;
      const c = j2, d = j;
      if (inverted) idx.push(a, d, b, b, d, c);
      else idx.push(a, b, d, b, c, d);
    }
  }
  const cap = (ringIndex, flip) => {
    const ring = rings[ringIndex];
    const c = new THREE.Vector3();
    ring.forEach((p) => c.add(p));
    c.divideScalar(ring.length);
    const start = verts.length / 3;
    verts.push(c.x, c.y, c.z);
    uvs.push(0.5, 0.5);
    cols_.push(1, 1, 1);
    for (let j = 0; j < cols; j++) {
      const j2 = (j + 1) % cols;
      const a = ringIndex * cols + j, b = ringIndex * cols + j2;
      if (flip) idx.push(start, b, a); else idx.push(start, a, b);
    }
  };
  if (capStart) cap(0, !inverted);
  if (capEnd) cap(rows - 1, inverted);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols_, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ─────────────────────────────────────────────────────────────
   Elliptical ring generator (used for torso / garment lofts)
   ───────────────────────────────────────────────────────────── */
export function ellipseRing(cx, cy, cz, rx, rz, count, opts = {}) {
  const { squashFront = 0, tilt = 0, warp = null, yJitter = 0 } = opts;
  const ring = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    let x = sa * rx;
    let z = ca * rz;
    if (squashFront !== 0 && ca > 0) z *= 1 - squashFront * ca;
    if (warp) { const w = warp(a, i / count); x += w.x; z += w.z; }
    const y = cy + (yJitter ? yJitter * Math.sin(a * 3) : 0);
    ring.push(new THREE.Vector3(cx + x, y, cz + z + tilt * x));
  }
  return ring;
}

/* ─────────────────────────────────────────────────────────────
   Sculpted sphere — deform a sphere by a callback for organic shapes
   ───────────────────────────────────────────────────────────── */
export function sculptedSphere(radius, widthSeg, heightSeg, sculpt) {
  const geo = new THREE.SphereGeometry(radius, widthSeg, heightSeg);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    sculpt(v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ─────────────────────────────────────────────────────────────
   Patch of a sculpted sphere — used for the face decal.
   Rows follow elevation, columns follow azimuth; the u coordinate
   is normalised per row so the painted face never skews.
   ───────────────────────────────────────────────────────────── */
export function sculptedPatch(radius, {
  elev = [-1.4, 0.62],
  azimuthScale = 1.0,
  rows = 48, cols = 64,
  sculpt = null,
  offset = 0.0,
  ovalProfile = null,
} = {}) {
  const verts = [], uvs = [], idx = [];
  const dir = new THREE.Vector3();
  for (let i = 0; i < rows; i++) {
    const rowT = i / (rows - 1);
    const e = lerp(elev[0], elev[1], rowT);
    const ce = Math.cos(e), se = Math.sin(e);
    let A = azimuthScale * (1.0 + e * 0.06);
    if (ovalProfile) A *= ovalProfile(rowT);
    for (let j = 0; j < cols; j++) {
      const colT = j / (cols - 1);
      const a = (colT * 2 - 1) * A;
      dir.set(Math.sin(a) * ce, se, Math.cos(a) * ce);
      const v = dir.clone().multiplyScalar(radius);
      if (sculpt) sculpt(v);
      if (offset) v.addScaledVector(dir, offset);
      verts.push(v.x, v.y, v.z);
      uvs.push(colT, rowT);
    }
  }
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = i * cols + j + 1;
      const c = (i + 1) * cols + j + 1, d = (i + 1) * cols + j;
      idx.push(a, b, d, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/* ─────────────────────────────────────────────────────────────
   Super-ellipsoid — pillows, bows, soft props
   ───────────────────────────────────────────────────────────── */
export function superEllipsoid(w, h, d, e1 = 0.45, e2 = 0.45, segU = 40, segV = 24) {
  const geo = new THREE.SphereGeometry(1, segU, segV);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const sgnPow = (x, p) => Math.sign(x) * Math.pow(Math.abs(x), p);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const u = v.x * Math.PI;      // longitude -π..π
    const t = v.y * Math.PI / 2;  // latitude -π/2..π/2
    const cu = sgnPow(Math.cos(t), e1), su = sgnPow(Math.sin(t), e1);
    const cu2 = sgnPow(Math.cos(u), e2), su2 = sgnPow(Math.sin(u), e2);
    v.set(w * cu * cu2, h * su, d * cu * su2);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ─────────────────────────────────────────────────────────────
   Rounded box (for palms, plackets, soles)
   ───────────────────────────────────────────────────────────── */
export function roundedBox(w, h, d, r, seg = 4) {
  const geo = new THREE.BoxGeometry(w, h, d, seg, seg, seg);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const rr = Math.min(r, hx, hy, hz);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const cx = clamp(v.x, -(hx - rr), hx - rr);
    const cy = clamp(v.y, -(hy - rr), hy - rr);
    const cz = clamp(v.z, -(hz - rr), hz - rr);
    const dx = v.x - cx, dy = v.y - cy, dz = v.z - cz;
    const len = Math.hypot(dx, dy, dz);
    if (len > 1e-6) {
      const s = rr / len;
      v.set(cx + dx * s, cy + dy * s, cz + dz * s);
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/* ─────────────────────────────────────────────────────────────
   Cat-ear profile (used for the collar and hair accessories)
   ───────────────────────────────────────────────────────────── */
export function catEarShape(size = 0.05) {
  const s = new THREE.Shape();
  s.moveTo(-size, 0);
  s.quadraticCurveTo(-size * 0.85, size * 1.1, -size * 0.1, size * 1.25);
  s.quadraticCurveTo(size * 0.65, size * 1.15, size, 0);
  return s;
}

/* ─────────────────────────────────────────────────────────────
   Merge helper — concatenates geometries sharing the same layout
   ───────────────────────────────────────────────────────────── */
export function mergeGeometries(list) {
  let vCount = 0, iCount = 0;
  const hasColor = list.every((g) => g.attributes.color);
  const hasUV = list.every((g) => g.attributes.uv);
  for (const g of list) {
    vCount += g.attributes.position.count;
    iCount += g.index ? g.index.count : g.attributes.position.count;
  }
  const pos = new Float32Array(vCount * 3);
  const nor = new Float32Array(vCount * 3);
  const uv = hasUV ? new Float32Array(vCount * 2) : null;
  const col = hasColor ? new Float32Array(vCount * 3) : null;
  const idx = vCount > 65535 ? new Uint32Array(iCount) : new Uint16Array(iCount);
  let vo = 0, io = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal;
    const u = g.attributes.uv, c = g.attributes.color;
    pos.set(p.array.subarray(0, p.count * 3), vo * 3);
    if (n) nor.set(n.array.subarray(0, n.count * 3), vo * 3);
    if (uv && u) uv.set(u.array.subarray(0, u.count * 2), vo * 2);
    if (col && c) col.set(c.array.subarray(0, c.count * 3), vo * 3);
    if (g.index) {
      const gi = g.index.array;
      for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
      io += gi.length;
    } else {
      for (let i = 0; i < p.count; i++) idx[io + i] = i + vo;
      io += p.count;
    }
    vo += p.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  return geo;
}

/* ─────────────────────────────────────────────────────────────
   CatmullRom sampling helper
   ───────────────────────────────────────────────────────────── */
export function sampleSpline(points, count, tension = 0.5) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', tension);
  return curve.getSpacedPoints(count - 1);
}

/* ─────────────────────────────────────────────────────────────
   Orientation helper: aim a +Y group along a direction
   ───────────────────────────────────────────────────────────── */
export function orientAlong(obj, from, to) {
  const dir = to.clone().sub(from).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  obj.quaternion.copy(q);
  return obj;
}
