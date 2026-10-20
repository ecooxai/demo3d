import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/* ────────────────────────────────────────────────────────────
   sweepEllipse
   A curved lock / limb / ribbon with a variable elliptical
   cross-section. Frames are parallel-transported to avoid the
   twisting artefacts you get from naive Frenet frames.
   ──────────────────────────────────────────────────────────── */
export function sweepEllipse(points, options = {}) {
  const {
    tubularSegments = 32,
    radialSegments = 10,
    width = 0.1,
    thickness = 0.04,
    widthFn,
    thicknessFn,
    sideHint = V(1, 0, 0),
    sideHintFn = null,
    colorRoot = 0xffffff,
    colorMid = null,
    colorTip = 0xffffff,
    edgeShade = 0.16,
    capStart = false,
    capEnd = false,
    closed = false,
    uOffset = 0,
  } = options;

  const curve = points instanceof THREE.CatmullRomCurve3
    ? points
    : new THREE.CatmullRomCurve3(points, closed, 'centripetal', 0.5);

  const segs = Math.max(2, tubularSegments);
  const rads = Math.max(3, radialSegments);

  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  const indices = [];

  const cRoot = new THREE.Color(colorRoot);
  const cMid = new THREE.Color(colorMid ?? colorRoot);
  const cTip = new THREE.Color(colorTip);

  let prevSide = null;

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    // choose a stable width axis
    let side = sideHintFn ? sideHintFn(t, tangent).clone() : sideHint.clone();
    side.sub(tangent.clone().multiplyScalar(side.dot(tangent)));
    if (side.lengthSq() < 1e-7) {
      side.set(0, 0, 1).sub(tangent.clone().multiplyScalar(tangent.z));
    }
    side.normalize();
    if (prevSide && side.dot(prevSide) < 0) side.negate();
    prevSide = side.clone();

    const normal = new THREE.Vector3().crossVectors(tangent, side).normalize();
    const w = Math.max(0.0006, (widthFn ? widthFn(t) : width)) * 0.5;
    const th = Math.max(0.0004, (thicknessFn ? thicknessFn(t) : thickness)) * 0.5;

    for (let j = 0; j <= rads; j++) {
      const a = (j / rads) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const pos = p.clone()
        .addScaledVector(side, ca * w)
        .addScaledVector(normal, sa * th);
      const n = side.clone().multiplyScalar(ca / w)
        .add(normal.clone().multiplyScalar(sa / th))
        .normalize();

      positions.push(pos.x, pos.y, pos.z);
      normals.push(n.x, n.y, n.z);
      uvs.push(uOffset + t, j / rads);

      let col;
      if (t < 0.5) col = cRoot.clone().lerp(cMid, t / 0.5);
      else col = cMid.clone().lerp(cTip, (t - 0.5) / 0.5);
      const shade = 1 - edgeShade * Math.max(0, Math.abs(ca) - 0.2);
      colors.push(col.r * shade, col.g * shade, col.b * shade);
    }
  }

  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < rads; j++) {
      const a = i * (rads + 1) + j;
      const b = (i + 1) * (rads + 1) + j;
      const c = (i + 1) * (rads + 1) + j + 1;
      const d = i * (rads + 1) + j + 1;
      indices.push(a, d, b, b, d, c);
    }
  }

  const addCap = (end) => {
    const i = end ? segs : 0;
    const t = end ? 1 : 0;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize().multiplyScalar(end ? 1 : -1);
    const centerIndex = positions.length / 3;
    positions.push(p.x, p.y, p.z);
    normals.push(tangent.x, tangent.y, tangent.z);
    uvs.push(end ? 1 : 0, 0.5);
    const col = end ? cTip : cRoot;
    colors.push(col.r, col.g, col.b);
    for (let j = 0; j < rads; j++) {
      const a = i * (rads + 1) + j;
      const b = i * (rads + 1) + j + 1;
      if (end) indices.push(centerIndex, a, b);
      else indices.push(centerIndex, b, a);
    }
  };

  if (capStart) addCap(false);
  if (capEnd) addCap(true);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/* ── lofted rings (torso, shorts, head cap, etc.) ────────── */
/**
 * rings: [{ y, rx, rz, cx?, cz?, tiltX?, tiltZ?, shape? }]
 */
export function loft(rings, options = {}) {
  const {
    radialSegments = 48,
    capTop = false,
    capBottom = false,
    colorA = null,
    colorB = null,
    bottomDarken = 0,
    topDarken = 0,
    vScale = 1,
    staticUv = false,
    wrinkle = null,
    uRepeat = 1,
  } = options;

  const positions = [];
  const normals = [];
  const uvs = [];
  const colors = [];
  const indices = [];

  const cA = colorA ? new THREE.Color(colorA) : null;
  const cB = colorB ? new THREE.Color(colorB) : null;

  const nRings = rings.length;
  const h0 = rings[0].y;
  const h1 = rings[nRings - 1].y;

  for (let i = 0; i < nRings; i++) {
    const ring = rings[i];
    const t = nRings === 1 ? 0 : i / (nRings - 1);
    for (let j = 0; j <= radialSegments; j++) {
      const a = (j / radialSegments) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const shape = ring.shape ? ring.shape(a, t) : 1;
      let r = 1;
      if (wrinkle) r += wrinkle(a, t) * (Math.sin(t * Math.PI) * 0.9 + 0.1);
      const x = (ring.cx ?? 0) + ca * ring.rx * shape * r;
      const z = (ring.cz ?? 0) + sa * ring.rz * shape * r;
      const y = ring.y + (ring.dy ?? 0) * Math.abs(ca) * 0.1;
      positions.push(x, y, z);
      // approximate outward normal (ignoring dy)
      const nx = ca / Math.max(0.0001, ring.rx);
      const nz = sa / Math.max(0.0001, ring.rz);
      const len = Math.hypot(nx, nz) || 1;
      normals.push(nx / len, 0.06, nz / len);
      uvs.push(staticUv ? (j / radialSegments) * uRepeat : (j / radialSegments) * uRepeat, t * vScale);
      if (cA && cB) {
        const col = cA.clone().lerp(cB, t);
        const dark = bottomDarken * Math.pow(t, 2) + topDarken * Math.pow(1 - t, 2);
        colors.push(col.r * (1 - dark), col.g * (1 - dark), col.b * (1 - dark));
      }
    }
  }

  for (let i = 0; i < nRings - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = (i + 1) * (radialSegments + 1) + j + 1;
      const d = i * (radialSegments + 1) + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const addCap = (ringIndex, up) => {
    const ring = rings[ringIndex];
    const t = ringIndex / (nRings - 1);
    const centerIndex = positions.length / 3;
    positions.push(ring.cx ?? 0, ring.y, ring.cz ?? 0);
    normals.push(0, up ? 1 : -1, 0);
    uvs.push(0.5, up ? 0 : 1);
    if (cA && cB) {
      const col = cA.clone().lerp(cB, t);
      colors.push(col.r, col.g, col.b);
    }
    const base = ringIndex * (radialSegments + 1);
    for (let j = 0; j < radialSegments; j++) {
      if (up) indices.push(centerIndex, base + j + 1, base + j);
      else indices.push(centerIndex, base + j, base + j + 1);
    }
  };

  if (capTop) addCap(0, true);
  if (capBottom) addCap(nRings - 1, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  if (cA && cB) geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/* ── deformed head ───────────────────────────────────────── */
export function makeHeadGeometry(center, scale) {
  const geo = new THREE.SphereGeometry(1, 96, 72);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const ny = v.y;
    // anime skull: broad cranium, tapered jaw, subtle chin
    const below = Math.max(0, -ny);
    const taper = 1 - 0.36 * Math.pow(below, 1.25) - 0.05 * Math.pow(below, 5);
    let x = v.x * taper;
    let z = v.z * taper;
    let y = ny;
    // cheeks
    const cheek = Math.exp(-Math.pow((ny + 0.24) / 0.26, 2)) * Math.exp(-Math.pow(v.x / 0.6, 2));
    x *= 1 + cheek * 0.05;
    // flatten the face plane a touch
    if (z > 0) z *= 0.93;
    // jaw / chin volume
    const chin = Math.exp(-Math.pow((ny + 0.72) / 0.2, 2)) * Math.max(0, z) * Math.exp(-Math.pow(v.x / 0.32, 2));
    z += chin * 0.10;
    y -= Math.max(0, -ny) * 0.038;
    pos.setXYZ(i, x * scale.x + center.x, y * scale.y + center.y, z * scale.z + center.z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/* ── expand geometry along normals for an ink outline ───── */
export function makeOutlineGeometry(geometry, thickness = 0.006) {
  const g = geometry.clone();
  const pos = g.attributes.position;
  let nor = g.attributes.normal;
  if (!nor) {
    g.computeVertexNormals();
    nor = g.attributes.normal;
  }
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) + nor.getX(i) * thickness,
      pos.getY(i) + nor.getY(i) * thickness,
      pos.getZ(i) + nor.getZ(i) * thickness
    );
  }
  pos.needsUpdate = true;
  g.computeBoundingSphere();
  return g;
}

/* ── convenient outlined mesh pair ──────────────────────── */
export function outlined(mesh, outlineMat, thickness = 0.006) {
  const group = new THREE.Group();
  group.name = (mesh.name || 'mesh') + '_outlined';
  const outline = new THREE.Mesh(makeOutlineGeometry(mesh.geometry, thickness), outlineMat);
  outline.name = (mesh.name || 'mesh') + '_ink';
  outline.renderOrder = -1;
  outline.matrixAutoUpdate = true;
  outline.position.copy(mesh.position);
  outline.quaternion.copy(mesh.quaternion);
  outline.scale.copy(mesh.scale);
  mesh.position.set(0, 0, 0);
  mesh.quaternion.identity();
  mesh.scale.set(1, 1, 1);
  group.add(outline, mesh);
  return group;
}

/* ── flat almond shape with normalised UVs ───────────────── */
export function makeAlmondGeometry(width = 0.19, height = 0.145, curve = 0.012) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  shape.moveTo(-w, -h * 0.1);
  shape.bezierCurveTo(-w * 0.62, h * 0.92, w * 0.55, h, w, h * 0.1);
  shape.bezierCurveTo(w * 0.55, -h * 0.88, -w * 0.5, -h * 0.98, -w, -h * 0.1);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape, 48);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;

  // UV the actual bounds of the almond, so a lid texture fills the whole shape
  const outline = shape.getPoints(64);
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
  for (const p of outline) {
    xMin = Math.min(xMin, p.x); xMax = Math.max(xMax, p.x);
    yMin = Math.min(yMin, p.y); yMax = Math.max(yMax, p.y);
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, -curve * (Math.pow(x / w, 2) * 0.6 + Math.pow(y / h, 2) * 0.4));
    uv.setXY(i, (x - xMin) / (xMax - xMin), (y - yMin) / (yMax - yMin));
  }
  geo.computeVertexNormals();
  return geo;
}

/* ── scalloped band for sleeve cuffs / shorts ruffles ───── */
export function scallopBand(options) {
  const {
    yTop = 1.78,
    yBottom = 1.74,
    rx = 0.17,
    rz = 0.17,
    cx = 0,
    cz = 0,
    scallops = 10,
    amp = 0.025,
    bulge = 0.012,
    segments = 96,
    material = null,
    phase = 0,
  } = options;

  const positions = [];
  const uvs = [];
  const indices = [];
  const rows = 4;

  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    for (let j = 0; j <= segments; j++) {
      const a = (j / segments) * Math.PI * 2;
      const edge = 1 + (Math.cos(scallops * a + phase) * 0.5 + 0.5) * amp * (t > 0.999 ? 1 : t * t);
      const flare = 1 + (bulge / rx) * t;
      const y = THREE.MathUtils.lerp(yTop, yBottom, t) + (Math.cos(scallops * a + phase) * 0.5 + 0.5) * amp * t * t;
      positions.push(cx + Math.cos(a) * rx * flare, y, cz + Math.sin(a) * rz * flare);
      uvs.push(j / segments, t);
    }
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = (i + 1) * (segments + 1) + j;
      const c = (i + 1) * (segments + 1) + j + 1;
      const d = i * (segments + 1) + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return material ? new THREE.Mesh(geo, material) : geo;
}

export function scallopEdgePoints(rx, rz, y, cx = 0, cz = 0, scallops = 10, amp = 0.02, segments = 128, phase = 0) {
  const pts = [];
  for (let j = 0; j < segments; j++) {
    const a = (j / segments) * Math.PI * 2;
    const yy = y + (Math.cos(scallops * a + phase) * 0.5 + 0.5) * amp;
    pts.push(V(cx + Math.cos(a) * rx, yy, cz + Math.sin(a) * rz));
  }
  return pts;
}

export function ringCurve(rx, rz, y, cx = 0, cz = 0, segments = 80, yWave = null) {
  const pts = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(V(cx + Math.cos(a) * rx, yWave ? y + yWave(a) : y, cz + Math.sin(a) * rz));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
}

/* ── puffy pillow ────────────────────────────────────────── */
export function makePillowGeometry(w = 0.9, h = 1.2, d = 0.3, seed = 4) {
  const geo = new THREE.SphereGeometry(1, 104, 76);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const n = 4.1;

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r2 = v.x * v.x + v.y * v.y;
    const angle = Math.atan2(v.y, v.x);
    // superellipse radial direction → squared-off plush pillow
    const c = Math.abs(Math.cos(angle));
    const s = Math.abs(Math.sin(angle));
    const superR = 1 / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
    const puff = 1 + 0.34 * Math.exp(-r2 * 3.2) + 0.07 * Math.cos(v.y * 9 + seed) * Math.exp(-r2 * 2);
    const edgeDent = 1 - 0.12 * Math.pow(Math.min(1, r2), 4);
    let x = Math.cos(angle) * superR * 0.5 * w * edgeDent;
    let y = Math.sin(angle) * superR * 0.5 * h * edgeDent;
    let z = v.z * 0.5 * d * puff;
    // folds radiating softly from the corners
    const fold = Math.sin(x * 22 + y * 8 + seed) * Math.cos(y * 17 - x * 5);
    z += fold * 0.006 * (1 - r2) * Math.max(0, 1 - Math.abs(v.z));
    // little pressed-in belly
    z -= 0.012 * Math.exp(-((x / (w * 0.35)) ** 2 + (y / (h * 0.35)) ** 2)) * Math.sign(v.z);
    pos.setXYZ(i, x, y, z);
  }

  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export function pillowSeamCurve(w = 0.9, h = 1.2, d = 0.3, inset = 0.02) {
  const pts = [];
  const segments = 120;
  const n = 4.1;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const c = Math.abs(Math.cos(a));
    const s = Math.abs(Math.sin(a));
    const superR = 1 / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
    pts.push(V(
      Math.cos(a) * superR * (0.5 * w - inset),
      Math.sin(a) * superR * (0.5 * h - inset),
      0
    ));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);
}

/* ── bevel and bend a 2D shape into a soft curved patch ─── */
export function softPatch(shape, { depth = 0.012, bevel = 0.008, curveX = 0.6, curveY = 0.25 } = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 3,
    curveSegments: 20,
  });
  geo.center();
  const pos = geo.attributes.position;
  const box = new THREE.Box3().setFromBufferAttribute(pos);
  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) - cx;
    const y = pos.getY(i) - cy;
    pos.setZ(i, pos.getZ(i) - (x * x * curveX + y * y * curveY));
  }
  geo.computeVertexNormals();
  return geo;
}

/* ── tapered limb with rounded joint caps ───────────────── */
export function limbGeometry(points, radii, options = {}) {
  const { radialSegments = 16, tubularSegments = 30 } = options;
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  const n = radii.length;
  const widthFn = (t) => {
    const f = t * (n - 1);
    const i = Math.min(n - 2, Math.floor(f));
    const k = f - i;
    const r = THREE.MathUtils.lerp(radii[i], radii[i + 1], k);
    return r * 2;
  };
  return sweepEllipse(curve, {
    tubularSegments,
    radialSegments,
    widthFn,
    thicknessFn: widthFn,
    sideHint: V(1, 0, 0),
    capStart: true,
    capEnd: true,
  });
}

/* ── smooth closed tube for trims ───────────────────────── */
export function trimTube(curve, radius = 0.004, material, tubularSegments = 160, radialSegments = 5) {
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, curve.closed);
  return new THREE.Mesh(geo, material);
}
