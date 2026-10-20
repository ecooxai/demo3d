import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------- vertex utility ----------
export function vertTint(geom, fn) {
  const pos = geom.attributes.position;
  const n = pos.count;
  const colors = new Float32Array(n * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    p.fromBufferAttribute(pos, i);
    const c = fn(p, i);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geom;
}

export function centerGeom(geom) {
  geom.computeBoundingBox();
  const c = new THREE.Vector3();
  geom.boundingBox.getCenter(c);
  geom.translate(-c.x, -c.y, -c.z);
  return { geom, center: c };
}

// ---------- swept ribbon (hair strands, blade shapes) ----------
// pts: Vector3[] anchor path; cross-section = rounded superellipse scaled (w,t)
export function ribbonGeometry(pts, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const N = o.segs || Math.max(24, pts.length * 10);
  const ringN = o.ringN || 14;
  const w0 = o.w ?? 0.05, t0 = o.t ?? 0.02;
  const wTip = o.wTip ?? w0 * 0.18, tTip = o.tTip ?? t0 * 0.55;
  const tipStart = o.tipStart ?? 0.6;   // where tapering begins
  const tipPow = o.tipPow ?? 1.6;
  const twist = o.twist ?? 0;
  const squash = o.squash ?? 0.72;      // superellipse exponent (squared body)
  const up = o.up ?? new THREE.Vector3(0, 1, 0);
  const bulgeS = o.bulgeS ?? 0, bulgeM = o.bulgeM ?? 0;

  const cp = [], ct = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    cp.push(curve.getPoint(u));
    ct.push(curve.getTangent(u).normalize());
  }

  const positions = [];
  const nrm = new THREE.Vector3(), bin = new THREE.Vector3();
  // choose starting cross normal: width axis should look horizontal-ish for strands
  let wAxis = Math.abs(ct[0].dot(up)) > 0.9
    ? new THREE.Vector3(1, 0, 0)
    : new THREE.Vector3().crossVectors(ct[0], up).normalize();
  if (wAxis.lengthSq() < 1e-8) wAxis.set(1, 0, 0);
  nrm.copy(wAxis);

  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const t = ct[i];
    // parallel transport width axis
    nrm.sub(t.clone().multiplyScalar(nrm.dot(t)));
    if (nrm.lengthSq() < 1e-8) {
      nrm.set(1, 0, 0);
      nrm.sub(t.clone().multiplyScalar(nrm.dot(t)));
    }
    nrm.normalize();
    bin.crossVectors(t, nrm).normalize();

    const taper = 1 - Math.pow(THREE.MathUtils.smoothstep(u, tipStart, 1), tipPow);
    const bulk = (1 + bulgeM * Math.sin(Math.PI * u) + bulgeS * (1 - THREE.MathUtils.smoothstep(u, 0, 0.3)));
    const w = THREE.MathUtils.lerp(wTip, w0, taper) * bulk;
    const th = THREE.MathUtils.lerp(t0, t0 * 0.75, taper) * bulk;
    const e = THREE.MathUtils.lerp(1.35, squash, taper);

    for (let j = 0; j < ringN; j++) {
      const a = (j / ringN) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const lo = (v, ex) => Math.sign(v) * Math.pow(Math.abs(v), ex);
      const x = lo(ca, e), z = lo(sa, e);
      positions.push(
        cp[i].x + nrm.x * x * w * 0.5 + bin.x * z * th * 0.5,
        cp[i].y + nrm.y * x * w * 0.5 + bin.y * z * th * 0.5,
        cp[i].z + nrm.z * x * w * 0.5 + bin.z * z * th * 0.5,
      );
    }
  }

  const indices = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < ringN; j++) {
      const a = i * ringN + j;
      const b = i * ringN + (j + 1) % ringN;
      const c = (i + 1) * ringN + j;
      const d = (i + 1) * ringN + (j + 1) % ringN;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

// geometry in world-local coords, centered for outline scaling; returns {geom, center, vertexCount}
export function ribbon(pts, o = {}) {
  const N = o.segs || Math.max(24, pts.length * 10);
  const ringN = o.ringN || 14;
  const g = ribbonGeometry(pts, o);
  if (o.colorA && o.colorB) {
    vertTint(g, (p, i) => {
      const ring = Math.floor(i / ringN);
      const u = (ring % (N + 1)) / N;
      const mix = THREE.MathUtils.smoothstep(u, o.gradStart ?? 0.42, 1);
      return new THREE.Color(o.colorA).lerp(new THREE.Color(o.colorB), mix);
    });
  }
  const r = centerGeom(g);
  return { ...r, count: r.geom.attributes.position.count };
}

// ---------- wavy trim strip (scallops) ----------
export function scallopHem(o) {
  const n = Math.max(72, (o.count || 10) * 9);
  const mid = o.mid ?? 2;
  const pos = [], idx = [];
  for (let r = 0; r <= mid; r++) {
    const t = r / mid;
    for (let si = 0; si <= n; si++) {
      const a = (si / n) * Math.PI * 2;
      const wv = 0.5 - 0.5 * Math.cos(o.count * a);
      const scallop = Math.pow(wv, o.scallopPow ?? 1.3);
      const hang = t * (0.55 + 0.45 * scallop);
      const rMul = 1 + (o.flare || 0) * t * t;
      pos.push(
        Math.cos(a) * o.rx * rMul,
        o.y - o.height * hang,
        Math.sin(a) * o.rz * rMul,
      );
    }
  }
  for (let r = 0; r < mid; r++) {
    for (let si = 0; si < n; si++) {
      const a = r * (n + 1) + si, b = a + 1;
      const c = (r + 1) * (n + 1) + si, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------- pillow ----------
export function pillowGeometry() {
  // big soft cushion: rounded slab, bulged face, pinched grip corner, fabric folds
  const g = new RoundedBoxGeometry(0.40, 0.62, 0.105, 14, 0.055);
  const pos = g.attributes.position;
  const v = new THREE.Vector3(), nn = new THREE.Vector3();
  const half = new THREE.Vector3(0.20, 0.31, 0.0525);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    nn.set(v.x / half.x, v.y / half.y, v.z / half.z);
    const len = nn.length();
    if (len > 1e-6) nn.divideScalar(len);
    const fz = Math.pow(Math.max(0, Math.abs(nn.z)), 1.4);
    // pillowy face bulge
    v.z *= 1 + 0.26 * fz;
    // pinched grip corner: top-left is squeezed by her fist
    const grip = THREE.MathUtils.smoothstep(-nn.x, 0.5, 1.0) * THREE.MathUtils.smoothstep(nn.y, 0.45, 1.0);
    v.z *= 1 - 0.62 * grip;
    v.x += 0.030 * grip;
    v.y -= 0.022 * grip;
    // soft fabric folds running down the face
    const fold = Math.sin(v.x * 27.0) * 0.55 + Math.sin(v.x * 13.5 + 1.2) * 0.32;
    v.z += fold * 0.0075 * fz;
    // a few deeper diagonal creases where the fabric folds over itself
    for (const [ax, ay, amp] of [[-0.055, 0.16, 0.013], [0.048, -0.12, 0.011], [0.012, 0.24, 0.009]]) {
      const d = (v.y - ay) - ax * 1.35;
      v.z -= Math.exp(-(d * d) / 0.00035) * amp * Math.sign(v.z || 1) * fz;
    }
    // the bottom edge droops and waves
    const low = THREE.MathUtils.smoothstep(-nn.y, 0.15, 1.0);
    v.y -= 0.035 * low * (1 - Math.abs(nn.x) * 0.8);
    v.y += Math.sin(v.x * 9.0) * 0.012 * low;
    // corners pinch out into soft points
    const corner = Math.pow(THREE.MathUtils.smoothstep(Math.abs(nn.x * nn.y), 0.5, 1.0), 1.3);
    v.multiplyScalar(1 + 0.06 * corner);
    v.z *= 1 - 0.10 * corner;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  const { geom, center } = centerGeom(g);
  return { geom, center };
}

// ---------- outline ----------
let _outlines = [];
export function runOutlines() { _outlines = []; }
export function addOutline(mesh, o = {}) {
  const { geom } = centerGeom(mesh.geometry);
  mesh.geometry = geom;
  const box = geom.boundingBox;
  const size = new THREE.Vector3();
  box.getSize(size);
  const base = Math.max(size.x, size.y, size.z, 0.02);
  const scl = 1 + (o.t ?? 0.011) * 2 / base;
  const mat = new THREE.MeshBasicMaterial({
    color: o.color ?? 0x2b2440, side: THREE.BackSide, fog: false,
  });
  const om = new THREE.Mesh(geom, mat);
  om.scale.setScalar(scl);
  om.renderOrder = 1;
  om.name = 'outline';
  mesh.add(om);
  _outlines.push(om);
  return om;
}
export function outlinesVisible(v) {
  for (const m of _outlines) m.visible = v;
}

// ---------- limbs ----------
export function limbBetween(p1, p2, r1, r2, mat) {
  const grp = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  const cap = new THREE.Mesh(
    new THREE.CapsuleGeometry((r1 + r2) / 2, Math.max(0.01, len - r1 - r2), 6, 18),
    mat,
  );
  cap.position.copy(mid);
  cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  grp.add(cap);
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(r1, 16, 12), mat);
  s1.position.copy(p1); grp.add(s1);
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(r2, 16, 12), mat);
  s2.position.copy(p2); grp.add(s2);
  return grp;
}
