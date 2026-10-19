// Isolated geometry-only review. Apply AFTER the accepted illumination bake.
// The crease visibility diagnostic is separate; this module never hides it.
const VERSION = 'outer-lip-continuity-130';
const NX = 100, NY = 16, HALF_WIDTH = .241, BORDER = .35, X_FULL = .18, X_END = .235;
const FACTOR = .94, EYE_Y = .05, LIP_STRENGTH = .06, FRAME_TOLERANCE = 1.2e-6;
const NAMES = Object.freeze(['upper-lip', 'lower-lip']);
const applications = new WeakMap();
const ZERO = Object.freeze({ version: VERSION, strength: 0, applied: false, privateGeometryCount: 0,
  privateAttributeBytes: 0, changedPositions: 0, changedNormals: 0, elapsedMs: 0 });
const now = () => typeof performance === 'object' ? performance.now() : Date.now();
const step = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (-15 + 6 * t));
const slope = t => t > 0 && t < 1 ? 30 * t * t * (1 - t) * (1 - t) : 0;
const gauss = (x, c, r) => Math.exp(-(((x - c) / r) ** 2));
const BORDER_RELIEF = .024 * BORDER * BORDER * (3 - 2 * BORDER) + .022 * Math.sin(Math.PI * BORDER);
const BORDER_TANGENT = BORDER * (.144 * BORDER * (1 - BORDER) + .022 * Math.PI * Math.cos(Math.PI * BORDER));
const BORDER_CURVATURE = BORDER * BORDER * (.144 * (1 - 2 * BORDER) - .022 * Math.PI * Math.PI * Math.sin(Math.PI * BORDER));
const C3 = 10 * BORDER_RELIEF - 4 * BORDER_TANGENT + BORDER_CURVATURE / 2;
const C4 = -15 * BORDER_RELIEF + 7 * BORDER_TANGENT - BORDER_CURVATURE;
const C5 = 6 * BORDER_RELIEF - 3 * BORDER_TANGENT + BORDER_CURVATURE / 2;

export const MOUTH_CONTINUITY130_SPEC = Object.freeze({ version: VERSION, targets: NAMES, grid: Object.freeze([NX, NY]),
  halfWidth: HALF_WIDTH, borderFraction: BORDER, cornerGate: Object.freeze([X_FULL, X_END]),
  compaction: FACTOR, lipStrength: LIP_STRENGTH, frameTolerance: FRAME_TOLERANCE,
  retainedBorderOffset: .001, materialChanged: false, creaseVisibilityChanged: false });

function segment(start, end, a, b, m0, m1) {
  const h = end - start;
  return [start, h, 2 * a - 2 * b + h * (m0 + m1), -3 * a + 3 * b - h * (2 * m0 + m1), h * m0, a];
}
// Exact original face.js Hermite segments traversed by the lips. UVs were
// assigned after this warp, before the accepted .94 and .06 Y deformations.
const LOWER = segment(-.96, -.639, -1.04, -.79, .39 / .541, .565 / .70);
const UPPER = segment(-.639, -.26, -.79, -.475, .565 / .70, .84 / .889);
function portraitY(y, out, offset) {
  const [start, h, a, b, c, d] = y <= -.639 ? LOWER : UPPER, t = (y - start) / h;
  out[offset] = ((a * t + b) * t + c) * t + d;
  out[offset + 1] = ((3 * a * t + 2 * b) * t + c) / h;
}

// [canonical Y, prepared head Y without common translation, dY/dx, dY/dv,
// original mouth Y]. Here v=0 is the skin border and v=1 is the fixed seam.
// This is the actual construction chain, not an assumption that UV derivatives
// are posed XY derivatives. The native/source correspondence is checked below.
export function sampleLipFrame130(x, v, upper, out) {
  const t = x / HALF_WIDTH, w = Math.max(0, 1 - t * t), wx = -2 * t / HALF_WIDTH;
  const sy = -.639 + .008 * Math.abs(t) ** 1.8 + .003 * Math.cos(t * Math.PI) + .0035 * t;
  const syx = (.0144 * Math.abs(t) ** .8 * Math.sign(t) - .003 * Math.PI * Math.sin(t * Math.PI) + .0035) / HALF_WIDTH;
  const g0 = gauss(t, -.30, .28), g1 = gauss(t, .35, .25), g2 = gauss(t, -.025, .18);
  const cupid = .81 + .15 * g0 + .12 * g1 - .07 * g2;
  const cupidx = (.15 * (-2 * (t + .30) / (.28 * .28)) * g0 + .12 * (-2 * (t - .35) / (.25 * .25)) * g1
    - .07 * (-2 * (t + .025) / (.18 * .18)) * g2) / HALF_WIDTH;
  const radius = upper ? .088 * w ** .7 * cupid : .094 * w ** .72;
  const radiusX = w > 0 ? (upper ? .088 * (.7 * w ** (-.3) * wx * cupid + w ** .7 * cupidx) : .094 * .72 * w ** (-.28) * wx) : 0;
  const sign = upper ? 1 : -1, y = sy + sign * radius * (1 - v), yx = syx + sign * radiusX * (1 - v), yv = -sign * radius;
  portraitY(y, out, 0); const canonical = out[0], derivative = out[1];
  portraitY(sy, out, 2); const seam = EYE_Y + FACTOR * (out[2] - EYE_Y), seamX = FACTOR * out[3] * syx;
  const baseY = EYE_Y + FACTOR * (canonical - EYE_Y), baseX = FACTOR * derivative * yx, baseV = FACTOR * derivative * yv;
  const d = baseY - seam, distance = Math.abs(d), gate = step((distance - .003) / .010), gateD = slope((distance - .003) / .010) / .010;
  const xt = (Math.abs(x) - .145) / (.235 - .145), weight = 1 - step(xt), weightX = -Math.sign(x) * slope(xt) / (.235 - .145);
  // The accepted lip field's outer skin blend and Z gate are both identically
  // one on these lip grids. The full source correspondence and front Z guard
  // reject a source for which that construction fact no longer holds.
  const factor = weight * (gate + distance * gateD);
  out[0] = canonical; out[1] = baseY + LIP_STRENGTH * d * weight * gate;
  out[2] = baseX + LIP_STRENGTH * ((baseX - seamX) * factor + d * weightX * gate);
  out[3] = baseV * (1 + LIP_STRENGTH * factor); out[4] = y;
  return out;
}

// [delta head Z, d(delta)/dx at fixed v, d(delta)/dv, residual-normal weight].
// The original .001 border offset is retained outside the replaced relief.
// At full strength a quintic starts with zero relief/value/first/second
// derivatives and matches the original value/slope/curvature at v=.35. Its
// peak slope is lower than multiplying the old relief by a quintic gate.
export function sampleLipRelief130(x, v, strength, out) {
  out[0] = out[1] = out[2] = out[3] = 0;
  if (!strength || v >= BORDER || v < 0 || Math.abs(x) >= X_END) return out;
  const t = x / HALF_WIDTH, w = 1 - t * t, wx = -2 * t / HALF_WIDTH;
  const xt = (Math.abs(x) - X_FULL) / (X_END - X_FULL), edge = 1 - step(xt), edgeX = -Math.sign(x) * slope(xt) / (X_END - X_FULL);
  const tBorder = v / BORDER, q = 1 - step(tBorder);
  const relief = .024 * v * v * (3 - 2 * v) + .022 * Math.sin(Math.PI * v);
  const reliefV = .144 * v * (1 - v) + .022 * Math.PI * Math.cos(Math.PI * v);
  const repaired = tBorder * tBorder * tBorder * (C3 + tBorder * (C4 + C5 * tBorder));
  const repairedV = tBorder * tBorder * (3 * C3 + tBorder * (4 * C4 + 5 * C5 * tBorder)) / BORDER;
  out[0] = strength * edge * w * (repaired - relief);
  out[1] = strength * (edgeX * w + edge * wx) * (repaired - relief);
  out[2] = strength * edge * w * (repairedV - reliefV);
  out[3] = strength * edge * q;
  return out;
}

const point = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
function unit(x, y, z) {
  const length = Math.hypot(x, y, z);
  if (!Number.isFinite(length) || length < 1e-10) throw new Error('130 requires finite nonzero shading normals.');
  return [x / length, y / length, z / length];
}
function headNormal(frame, attribute, i) {
  const b = frame.back, x = attribute.getX(i), y = attribute.getY(i), z = attribute.getZ(i);
  return unit(b[0] * x + b[1] * y + b[2] * z, b[4] * x + b[5] * y + b[6] * z, b[8] * x + b[9] * y + b[10] * z);
}
function putHeadNormal(frame, attribute, i, normal) {
  const h = frame.h, [x, y, z] = normal;
  attribute.setXYZ(i, ...unit(h[0] * x + h[1] * y + h[2] * z, h[4] * x + h[5] * y + h[6] * z, h[8] * x + h[9] * y + h[10] * z));
}

function collect(head) {
  if (head.userData?.portraitProportions?.factor !== FACTOR || head.userData?.lipThicknessRefinement?.strength !== LIP_STRENGTH)
    throw new Error('130 expects the accepted .94 proportions and .06 lip refinement.');
  head.updateWorldMatrix(true, true);
  if (!Number.isFinite(head.matrixWorld.determinant()) || Math.abs(head.matrixWorld.determinant()) < 1e-12) throw new Error('130 needs an invertible head frame.');
  const inverse = head.matrixWorld.clone().invert(), records = [], counts = new Map();
  head.traverse(mesh => {
    if (!mesh.isMesh || ![...NAMES, 'continuous-face'].includes(mesh.name)) return;
    counts.set(mesh.name, (counts.get(mesh.name) || 0) + 1);
    const original = mesh.geometry, p = original?.getAttribute('position'), n = original?.getAttribute('normal'), uv = original?.getAttribute('uv');
    if (!p || !n || !uv || p.itemSize !== 3 || n.itemSize !== 3 || uv.itemSize !== 2 || p.count !== n.count || p.count !== uv.count || !original.index
      || [p, n, uv].some(a => a.normalized || a.isInterleavedBufferAttribute) || mesh.isSkinnedMesh || mesh.isInstancedMesh)
      throw new Error(`130 needs explicit static position/normal/UV geometry on ${mesh.name}.`);
    if (original.getAttribute('tangent') || Object.values(original.morphAttributes || {}).some(a => a.length)) throw new Error('130 does not repair tangents or morph targets.');
    const matrix = mesh.matrixWorld.clone().multiplyMatrices(inverse, mesh.matrixWorld);
    if (!Number.isFinite(matrix.determinant()) || Math.abs(matrix.determinant()) < 1e-12) throw new Error('130 encountered a singular mesh frame.');
    const h = matrix.elements.slice(), back = matrix.clone().invert().elements.slice();
    if ([...h, ...back].some(v => !Number.isFinite(v)) || Math.max(Math.abs(h[3]), Math.abs(h[7]), Math.abs(h[11]), Math.abs(h[15] - 1)) > 1e-12)
      throw new Error('130 requires finite affine mesh frames.');
    records.push({ mesh, original, p, n, uv, h, back });
  });
  if ([...NAMES, 'continuous-face'].some(name => counts.get(name) !== 1)) throw new Error('130 needs exactly one original face and both original lip grids.');
  return { face: records.find(r => r.mesh.name === 'continuous-face'), lips: records.filter(r => NAMES.includes(r.mesh.name)) };
}

function validateFrames(lips) {
  const sample = new Float64Array(5), rows = [], sum = [0, 0]; let count = 0, maximumUVResidual = 0;
  for (const f of lips) {
    if (f.p.count !== (NX + 1) * (NY + 1) || f.original.index.count !== NX * NY * 6) throw new Error(`130 lip topology changed on ${f.mesh.name}.`);
    const upper = f.mesh.name === 'upper-lip';
    for (let row = 0; row <= NY; row++) for (let col = 0; col <= NX; col++) {
      const i = row * (NX + 1) + col, x = -HALF_WIDTH + 2 * HALF_WIDTH * col / NX, v = row / NY;
      sampleLipFrame130(x, v, upper, sample);
      const uvResidual = Math.max(Math.abs(2 * f.uv.getX(i) - 1 - x), Math.abs(2.85 * f.uv.getY(i) - 1.25 - sample[0]));
      maximumUVResidual = Math.max(maximumUVResidual, uvResidual);
      const p = point(f.h, f.p.getX(i), f.p.getY(i), f.p.getZ(i));
      if (!Number.isFinite(p[0] + p[1] + p[2] + f.n.getX(i) + f.n.getY(i) + f.n.getZ(i)) || p[2] < .48)
        throw new Error('130 needs finite, front-facing original lip positions beyond the accepted lip Z gate.');
      sum[0] += p[0] - x; sum[1] += p[1] - sample[1]; count++;
      rows.push([f.mesh.name, i, p[0] - x, p[1] - sample[1]]);
      if (uvResidual > FRAME_TOLERANCE) throw new Error(`130 source UV/grid correspondence changed on ${f.mesh.name} vertex${i}.`);
    }
    for (let row = 0, k = 0; row < NY; row++) for (let col = 0; col < NX; col++) {
      const a = row * (NX + 1) + col, b = a + NX + 1, expected = upper ? [a, b, a + 1, a + 1, b, b + 1] : [a, a + 1, b, b, a + 1, b + 1];
      for (const index of expected) if (f.original.index.getX(k++) !== index) throw new Error(`130 source triangle order changed on ${f.mesh.name}.`);
    }
  }
  const offset = sum.map(value => value / count); let maximumXYResidual = 0;
  for (const [name, i, x, y] of rows) {
    const residual = Math.max(Math.abs(x - offset[0]), Math.abs(y - offset[1])); maximumXYResidual = Math.max(maximumXYResidual, residual);
    if (residual > FRAME_TOLERANCE) throw new Error(`130 accepted UV-to-head correspondence drifted on ${name} vertex${i}: ${residual}.`);
  }
  return { samples: count, commonOffsetXY: offset, maximumUVResidual, maximumXYResidual, tolerance: FRAME_TOLERANCE, fittedSlopes: false };
}

// Transient local index of the actual accepted face triangles. Every query
// intersects their current HEAD-XY projection, rather than assuming that a
// same-UV point remains the same XY after the nonlinear lip-Y deformation.
function indexUnderlyingFace(face, lips) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity], uvBounds = bounds.slice();
  for (const f of lips) for (let i = 0; i < f.p.count; i++) {
    const [x, y] = point(f.h, f.p.getX(i), f.p.getY(i), f.p.getZ(i)), u = 2 * f.uv.getX(i) - 1, v = 2.85 * f.uv.getY(i) - 1.25;
    bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y); bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
    uvBounds[0] = Math.min(uvBounds[0], u); uvBounds[1] = Math.min(uvBounds[1], v); uvBounds[2] = Math.max(uvBounds[2], u); uvBounds[3] = Math.max(uvBounds[3], v);
  }
  for (let i = 0; i < 4; i++) { bounds[i] += i < 2 ? -.004 : .004; uvBounds[i] += i < 2 ? -.025 : .025; }
  const cols = 32, rows = 16, cells = Array.from({ length: cols * rows }, () => []), triangles = [];
  const bx = x => Math.max(0, Math.min(cols - 1, Math.floor((x - bounds[0]) / (bounds[2] - bounds[0]) * cols)));
  const by = y => Math.max(0, Math.min(rows - 1, Math.floor((y - bounds[1]) / (bounds[3] - bounds[1]) * rows)));
  const { p, n, uv } = face, index = face.original.index;
  for (let k = 0; k < index.count; k += 3) {
    // Most head triangles are outside the small mouth rectangle. Reject them
    // without allocating arrays, normals or projected triangle records.
    const ia = index.getX(k), ib = index.getX(k + 1), ic = index.getX(k + 2);
    const ua = 2 * uv.getX(ia) - 1, ub = 2 * uv.getX(ib) - 1, uc = 2 * uv.getX(ic) - 1;
    const va = 2.85 * uv.getY(ia) - 1.25, vb = 2.85 * uv.getY(ib) - 1.25, vc = 2.85 * uv.getY(ic) - 1.25;
    if (Math.max(ua, ub, uc) < uvBounds[0] || Math.min(ua, ub, uc) > uvBounds[2]
      || Math.max(va, vb, vc) < uvBounds[1] || Math.min(va, vb, vc) > uvBounds[3]) continue;
    const ids = [ia, ib, ic], us = [[ua, va], [ub, vb], [uc, vc]];
    const ps = ids.map(i => point(face.h, p.getX(i), p.getY(i), p.getZ(i)));
    if (Math.min(...ps.map(v => v[2])) < .40) continue;
    const [a, b, c] = ps, determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(determinant) < 1e-14) continue;
    const minX = Math.min(a[0], b[0], c[0]), maxX = Math.max(a[0], b[0], c[0]), minY = Math.min(a[1], b[1], c[1]), maxY = Math.max(a[1], b[1], c[1]);
    if (maxX < bounds[0] || minX > bounds[2] || maxY < bounds[1] || minY > bounds[3]) continue;
    const triangle = { k, ps, ns: ids.map(i => headNormal(face, n, i)), us, determinant }; triangles.push(triangle);
    for (let y = by(minY); y <= by(maxY); y++) for (let x = bx(minX); x <= bx(maxX); x++) cells[y * cols + x].push(triangle);
  }
  if (!triangles.length) throw new Error('130 cannot locate the actual underlying mouth-area face triangles.');
  return { triangles: triangles.length, cells: cells.length, sample(x, y, withNormal = true) {
    let best = null;
    for (const tri of cells[by(y) * cols + bx(x)]) {
      const [a, b, c] = tri.ps;
      const wa = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / tri.determinant;
      const wb = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / tri.determinant, wc = 1 - wa - wb;
      if (Math.min(wa, wb, wc) < -2e-7) continue;
      const weights = [wa, wb, wc], z = weights.reduce((sum, w, i) => sum + w * tri.ps[i][2], 0);
      if (best && best.z >= z) continue;
      const normal = withNormal ? unit(...[0, 1, 2].map(axis => weights.reduce((sum, w, i) => sum + w * tri.ns[i][axis], 0))) : null;
      best = { z, normal, triangle: tri.k / 3, canonicalUV: withNormal ? [0, 1].map(axis => weights.reduce((sum, w, i) => sum + w * tri.us[i][axis], 0)) : null };
    }
    if (!best) throw new Error(`130 face-projection query missed at (${x}, ${y}).`);
    return best;
  } };
}

function stageGeometry(original) {
  const geometry = new original.constructor();
  try {
    geometry.name = original.name; geometry.type = original.type; geometry.userData = { ...original.userData };
    for (const [key, attribute] of Object.entries(original.attributes)) geometry.setAttribute(key, attribute.clone());
    geometry.setIndex(original.index.clone());
    for (const group of original.groups || []) geometry.addGroup(group.start, group.count, group.materialIndex);
    geometry.setDrawRange(original.drawRange?.start || 0, original.drawRange?.count ?? Infinity);
    return geometry;
  } catch (error) { geometry.dispose(); throw error; }
}

/**
 * Geometry-only outer-border repair. Every source geometry buffer is immutable;
 * both temporary geometries own every attribute/index because actual r186
 * disposal also deletes cached RenderObject attributes. Materials/maps stay
 * shared and unchanged. The continuous face is queried, never deformed.
 *
 * Current XY = (x + tx, preparedY(x,v) + ty). For delta=D(x,v),
 * delta_Y=D_v/Y_v and delta_X=D_x-D_v*Y_x/Y_v. This gives a head-Z shear with
 * detJ=1; normals first receive its exact inverse-transpose transport through
 * the actual mesh frame. A separately reported authored-normal residual then
 * aligns the outer boundary to the real underlying face normal and fades C2 to
 * zero by v=.35. The seam, central normals and fixed corner band remain exact.
 */
export function applyMouthContinuity130(head, { strength = 0 } = {}) {
  if (!head?.isObject3D) throw new TypeError('130 requires the anatomical head.');
  if (!Number.isFinite(strength) || strength < 0 || strength > 1) throw new RangeError('130 strength must lie between0 and1.');
  const old = applications.get(head);
  if (old) { if (old.strength !== strength) throw new Error('130 needs release or a fresh head before a different strength.'); return old.metrics; }
  if (!strength) return ZERO;
  const started = now(), { face, lips } = collect(head), frame = validateFrames(lips), underlying = indexUnderlyingFace(face, lips), staged = [];
  const metrics = { version: VERSION, strength, applied: true, frame, faceTrianglesIndexed: underlying.triangles, faceIndexCells: underlying.cells,
    privateGeometryCount: 2, privateAttributeBytes: 0, changedPositions: 0, changedNormals: 0, minimumJacobian: 1,
    maximumDepthReduction: 0, maximumAnatomicalXYRoundoff: 0, maximumNormalLengthError: 0,
    maximumAuthoredResidualDegrees: 0, interiorBoundaryNormalSamples: 0, maximumInteriorBoundaryNormalErrorDegrees: null,
    minimumBaselineClearance: Infinity, minimumRepairedClearance: Infinity, maximumClearanceReduction: 0, clearanceSamples: 0,
    perMesh: [], elapsedMs: 0, materialChanged: false, creaseVisibilityChanged: false,
    normalOperations: ['Analytic inverse-transpose transport', 'Separately bounded authored boundary-normal residual'] };
  const parameter = new Float64Array(5), relief = new Float64Array(4);
  try {
    for (const f of lips) {
      const geometry = stageGeometry(f.original), record = { mesh: f.mesh, original: f.original, geometry }; staged.push(record);
      const pp = geometry.getAttribute('position'), nn = geometry.getAttribute('normal'), upper = f.mesh.name === 'upper-lip';
      const residuals = [], boundaryFaceNormals = [], vx = f.back[8], vy = f.back[9], vz = f.back[10];
      let changedPositions = 0, changedNormals = 0;
      metrics.privateAttributeBytes += Object.values(geometry.attributes).reduce((sum, a) => sum + a.array.byteLength, geometry.index.array.byteLength);
      for (let row = 0; row <= NY; row++) for (let col = 0; col <= NX; col++) {
        const i = row * (NX + 1) + col, x = -HALF_WIDTH + 2 * HALF_WIDTH * col / NX, v = row / NY;
        sampleLipRelief130(x, v, strength, relief); if (!relief[3]) continue;
        sampleLipFrame130(x, v, upper, parameter);
        if (Math.abs(parameter[3]) < 1e-6) throw new Error('130 encountered a singular lip parameter frame.');
        const hy = relief[2] / parameter[3], hx = relief[1] - hy * parameter[2];
        const h = f.h, gx = h[0] * hx + h[1] * hy, gy = h[4] * hx + h[5] * hy, gz = h[8] * hx + h[9] * hy;
        const jac = 1 + vx * gx + vy * gy + vz * gz;
        if (Math.abs(jac - 1) > 1e-10) throw new Error('130 head-Z shear lost its determinant-one invariant.');
        const nx = f.n.getX(i), ny = f.n.getY(i), nz = f.n.getZ(i), dot = (vx * nx + vy * ny + vz * nz) / jac;
        nn.setXYZ(i, ...unit(nx - gx * dot, ny - gy * dot, nz - gz * dot));
        // Avoid rewriting the exactly fixed boundary when its displacement is0.
        if (relief[0] !== 0) pp.setXYZ(i, f.p.getX(i) + relief[0] * vx, f.p.getY(i) + relief[0] * vy, f.p.getZ(i) + relief[0] * vz);
        metrics.maximumDepthReduction = Math.max(metrics.maximumDepthReduction, -relief[0]);
        const dx = pp.getX(i) - f.p.getX(i), dy = pp.getY(i) - f.p.getY(i), dz = pp.getZ(i) - f.p.getZ(i);
        metrics.maximumAnatomicalXYRoundoff = Math.max(metrics.maximumAnatomicalXYRoundoff, Math.abs(h[0] * dx + h[4] * dy + h[8] * dz), Math.abs(h[1] * dx + h[5] * dy + h[9] * dz));
      }
      // Boundary source/candidate values are the same; its slope is repaired.
      // Residual correction is an authored normal weld, not another derivative.
      for (let col = 0; col <= NX; col++) {
        const x = -HALF_WIDTH + 2 * HALF_WIDTH * col / NX;
        if (Math.abs(x) >= X_END) { residuals.push([0, 0]); boundaryFaceNormals.push(null); continue; }
        const p = point(f.h, pp.getX(col), pp.getY(col), pp.getZ(col)), surface = underlying.sample(p[0], p[1]), n = headNormal(f, nn, col);
        if (n[2] < .08 || surface.normal[2] < .08) throw new Error('130 boundary normals no longer describe a forward mouth patch.');
        residuals.push([surface.normal[0] / surface.normal[2] - n[0] / n[2], surface.normal[1] / surface.normal[2] - n[1] / n[2]]);
        boundaryFaceNormals.push(surface.normal);
      }
      for (let row = 0; row <= NY; row++) for (let col = 0; col <= NX; col++) {
        const i = row * (NX + 1) + col, x = -HALF_WIDTH + 2 * HALF_WIDTH * col / NX, v = row / NY;
        sampleLipRelief130(x, v, strength, relief);
        if (relief[3]) {
          const n = headNormal(f, nn, i), r = residuals[col];
          if (n[2] < .08) throw new Error('130 repaired normals left the forward mouth hemisphere.');
          const corrected = unit(n[0] / n[2] + relief[3] * r[0], n[1] / n[2] + relief[3] * r[1], 1);
          metrics.maximumAuthoredResidualDegrees = Math.max(metrics.maximumAuthoredResidualDegrees, Math.acos(Math.max(-1, Math.min(1, n.reduce((sum, value, j) => sum + value * corrected[j], 0)))) * 180 / Math.PI);
          putHeadNormal(f, nn, i, corrected);
          if (row === 0 && strength === 1 && Math.abs(x) <= X_FULL) {
            const actual = headNormal(f, nn, i), target = boundaryFaceNormals[col];
            metrics.interiorBoundaryNormalSamples++;
            metrics.maximumInteriorBoundaryNormalErrorDegrees = Math.max(metrics.maximumInteriorBoundaryNormalErrorDegrees ?? 0,
              Math.acos(Math.max(-1, Math.min(1, actual.reduce((sum, value, j) => sum + value * target[j], 0)))) * 180 / Math.PI);
          }
        }
        if (pp.getX(i) !== f.p.getX(i) || pp.getY(i) !== f.p.getY(i) || pp.getZ(i) !== f.p.getZ(i)) changedPositions++;
        if (nn.getX(i) !== f.n.getX(i) || nn.getY(i) !== f.n.getY(i) || nn.getZ(i) !== f.n.getZ(i)) changedNormals++;
        if (!Number.isFinite(pp.getX(i) + pp.getY(i) + pp.getZ(i) + nn.getX(i) + nn.getY(i) + nn.getZ(i))) throw new Error('130 generated nonfinite lip data.');
        if (relief[3]) metrics.maximumNormalLengthError = Math.max(metrics.maximumNormalLengthError, Math.abs(Math.hypot(nn.getX(i), nn.getY(i), nn.getZ(i)) - 1));
      }
      // Actual endpoint triangles, their edge midpoints and centers must all
      // remain in front of the accepted face. This checks a real attachment
      // clearance, not only the analytic .001 authoring offset.
      const check = (ids, weights) => {
        const source = [0, 0, 0], active = [0, 0, 0];
        for (let j = 0; j < ids.length; j++) {
          const i = ids[j], a = point(f.h, f.p.getX(i), f.p.getY(i), f.p.getZ(i)), b = point(f.h, pp.getX(i), pp.getY(i), pp.getZ(i));
          for (let axis = 0; axis < 3; axis++) { source[axis] += weights[j] * a[axis]; active[axis] += weights[j] * b[axis]; }
        }
        const baseline = source[2] - underlying.sample(source[0], source[1], false).z, repaired = active[2] - underlying.sample(active[0], active[1], false).z;
        metrics.minimumBaselineClearance = Math.min(metrics.minimumBaselineClearance, baseline); metrics.minimumRepairedClearance = Math.min(metrics.minimumRepairedClearance, repaired);
        metrics.maximumClearanceReduction = Math.max(metrics.maximumClearanceReduction, baseline - repaired); metrics.clearanceSamples++;
        if (repaired < .00005) throw new Error(`130 lip-to-face triangle clearance is insufficient: ${repaired}.`);
      };
      for (let row = 0; row <= Math.ceil(NY * BORDER); row++) for (let col = 1; col < NX; col++) check([row * (NX + 1) + col], [1]);
      for (let k = 0; k < geometry.index.count; k += 3) {
        const ids = [geometry.index.getX(k), geometry.index.getX(k + 1), geometry.index.getX(k + 2)];
        if (ids.every(i => Math.floor(i / (NX + 1)) / NY >= BORDER) || ids.every(i => Math.abs(-HALF_WIDTH + 2 * HALF_WIDTH * (i % (NX + 1)) / NX) >= X_END)) continue;
        check(ids, [1 / 3, 1 / 3, 1 / 3]);
        check([ids[0], ids[1]], [.5, .5]); check([ids[1], ids[2]], [.5, .5]); check([ids[2], ids[0]], [.5, .5]);
      }
      pp.needsUpdate = true; nn.needsUpdate = true; geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      metrics.changedPositions += changedPositions; metrics.changedNormals += changedNormals;
      metrics.perMesh.push({ name: f.mesh.name, vertices: pp.count, triangles: geometry.index.count / 3, changedPositions, changedNormals, meshToHead: f.h, headToMesh: f.back });
    }
    if (metrics.maximumAnatomicalXYRoundoff > 6e-7 || metrics.maximumAuthoredResidualDegrees > 25) throw new Error('130 exceeded its bounded frame/normal correction support.');
  } catch (error) { for (const record of staged) record.geometry.dispose(); throw error; }
  for (const record of staged) record.mesh.geometry = record.geometry;
  metrics.elapsedMs = now() - started; applications.set(head, { strength, staged, metrics }); return metrics;
}

export function releaseMouthContinuity130(head) {
  const record = applications.get(head);
  if (!record) return { released: false, privateGeometriesDisposed: 0, privateAttributeBytesReleased: 0 };
  for (const item of record.staged) if (item.mesh.geometry !== item.geometry) throw new Error('130 refuses to release a geometry replaced by another study.');
  for (const item of record.staged) item.mesh.geometry = item.original;
  for (const item of record.staged) item.geometry.dispose();
  applications.delete(head);
  return { released: true, privateGeometriesDisposed: record.staged.length, privateAttributeBytesReleased: record.metrics.privateAttributeBytes };
}
