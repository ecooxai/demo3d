import { faceZ } from './face.js';
import { sampleLipFrame130, sampleLipRelief130 } from './lip-continuity.js';

// One bounded on/off geometry study on the already accepted full130 lips.
// The existing authored normals are transported once; no new normal weld is
// applied. All source buffers and all materials/textures remain immutable.
const VERSION = 'upper-lip-relief-140';
const NX = 100, NY = 16, HALF_WIDTH = .241, END = .875, BLEND = .5;
const X_FULL = .18, X_END = .235, FRAME_TOLERANCE = 1.2e-6;
const applications = new WeakMap();
const now = () => typeof performance === 'object' ? performance.now() : Date.now();
const step = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (-15 + 6 * t));
const stepSlope = t => t > 0 && t < 1 ? 30 * t * t * (1 - t) * (1 - t) : 0;
const relief = v => .024 * v * v * (3 - 2 * v) + .022 * Math.sin(Math.PI * v);
const reliefSlope = v => .144 * v * (1 - v) + .022 * Math.PI * Math.cos(Math.PI * v);
const reliefCurvature = v => .144 * (1 - 2 * v) - .022 * Math.PI * Math.PI * Math.sin(Math.PI * v);
const VALUE = relief(END), TANGENT = END * reliefSlope(END), CURVATURE = END * END * reliefCurvature(END);
const C3 = 10 * VALUE - 4 * TANGENT + CURVATURE / 2;
const C4 = -15 * VALUE + 7 * TANGENT - CURVATURE;
const C5 = 6 * VALUE - 3 * TANGENT + CURVATURE / 2;
const ZERO = Object.freeze({ version: VERSION, strength: 0, applied: false, privateGeometryCount: 0,
  privateAttributeBytes: 0, changedPositions: 0, changedNormals: 0, elapsedMs: 0 });

export const UPPER_LIP_RELIEF140_SPEC = Object.freeze({ version: VERSION, target: 'upper-lip',
  grid: Object.freeze([NX, NY]), halfWidth: HALF_WIDTH, endFraction: END, blend: BLEND,
  cornerGate: Object.freeze([X_FULL, X_END]), quintic: Object.freeze([C3, C4, C5]),
  frameTolerance: FRAME_TOLERANCE, retainedBorderOffset: .001, minimumClearance: .00005,
  strengths: Object.freeze([0, 1]), normalOperation: 'One analytic inverse-transpose transport from accepted130 normals',
  materialChanged: false, textureChanged: false, extraAuthoredNormalEdit: false });

// [delta head Z, d(delta)/dx at fixed v, d(delta)/dv]. The comparison profile
// uses the fully repaired central130 curve; the same original C2 X gate then
// mixes that difference into the accepted tapered corner region. Both endpoint
// jets vanish. The explicit guards preserve exact stored endpoint buffers.
export function sampleUpperLipRelief140(x, v, out, scratch130) {
  out[0] = out[1] = out[2] = 0;
  if (v <= 0 || v >= END || Math.abs(x) >= X_END) return out;
  sampleLipRelief130(0, v, 1, scratch130);
  const current = relief(v) + scratch130[0], currentSlope = reliefSlope(v) + scratch130[2];
  const u = v / END, q = u * u * u * (C3 + u * (C4 + u * C5));
  const qSlope = u * u * (3 * C3 + u * (4 * C4 + u * 5 * C5)) / END;
  const t = x / HALF_WIDTH, w = 1 - t * t, wx = -2 * t / HALF_WIDTH;
  const gateT = (Math.abs(x) - X_FULL) / (X_END - X_FULL), gate = 1 - step(gateT);
  const gateX = -Math.sign(x) * stepSlope(gateT) / (X_END - X_FULL), difference = q - current;
  out[0] = BLEND * gate * w * difference;
  out[1] = BLEND * (gateX * w + gate * wx) * difference;
  out[2] = BLEND * gate * w * (qSlope - currentSlope);
  return out;
}

const point = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
function unit(x, y, z) {
  const length = Math.hypot(x, y, z);
  if (!Number.isFinite(length) || length < 1e-10) throw new Error('140 needs finite nonzero normals in its changed region.');
  return [x / length, y / length, z / length];
}

function collect(head) {
  if (head.userData?.portraitProportions?.factor !== .94 || head.userData?.lipThicknessRefinement?.strength !== .06)
    throw new Error('140 requires accepted .94 proportions and .06 lip thickness.');
  head.updateWorldMatrix(true, true);
  if (!Number.isFinite(head.matrixWorld.determinant()) || Math.abs(head.matrixWorld.determinant()) < 1e-12)
    throw new Error('140 requires an invertible head frame.');
  const inverse = head.matrixWorld.clone().invert(), records = [], counts = new Map();
  head.traverse(mesh => {
    if (!mesh.isMesh || !['continuous-face', 'upper-lip'].includes(mesh.name)) return;
    counts.set(mesh.name, (counts.get(mesh.name) || 0) + 1);
    const original = mesh.geometry, p = original?.getAttribute('position'), n = original?.getAttribute('normal'), uv = original?.getAttribute('uv');
    if (!p || !n || !uv || !original.index || p.itemSize !== 3 || n.itemSize !== 3 || uv.itemSize !== 2 || p.count !== n.count || p.count !== uv.count
      || [p, n, uv].some(a => a.normalized || a.isInterleavedBufferAttribute) || mesh.isSkinnedMesh || mesh.isInstancedMesh)
      throw new Error(`140 requires explicit indexed static attributes on ${mesh.name}.`);
    if (original.getAttribute('tangent') || Object.values(original.morphAttributes || {}).some(a => a.length))
      throw new Error('140 does not modify tangent or morph-target data.');
    const matrix = mesh.matrixWorld.clone().multiplyMatrices(inverse, mesh.matrixWorld);
    if (!Number.isFinite(matrix.determinant()) || Math.abs(matrix.determinant()) < 1e-12) throw new Error('140 encountered a singular mesh frame.');
    const h = matrix.elements.slice(), back = matrix.clone().invert().elements.slice();
    if ([...h, ...back].some(v => !Number.isFinite(v)) || Math.max(Math.abs(h[3]), Math.abs(h[7]), Math.abs(h[11]), Math.abs(h[15] - 1)) > 1e-12)
      throw new Error('140 requires finite affine mesh frames.');
    records.push({ mesh, original, p, n, uv, h, back });
  });
  if (counts.get('upper-lip') !== 1 || counts.get('continuous-face') !== 1) throw new Error('140 needs one accepted upper lip and one continuous face.');
  return { lip: records.find(r => r.mesh.name === 'upper-lip'), face: records.find(r => r.mesh.name === 'continuous-face') };
}

function validateAccepted130(f) {
  if (f.p.count !== (NX + 1) * (NY + 1) || f.original.index.count !== NX * NY * 6)
    throw new Error('140 upper-lip topology changed.');
  const frame = new Float64Array(5), correction = new Float64Array(4), offsets = [], sum = [0, 0, 0];
  let maximumUVResidual = 0;
  for (let row = 0; row <= NY; row++) for (let col = 0; col <= NX; col++) {
    const i = row * (NX + 1) + col, x = -HALF_WIDTH + 2 * HALF_WIDTH * col / NX, v = row / NY;
    sampleLipFrame130(x, v, true, frame); sampleLipRelief130(x, v, 1, correction);
    const expectedZ = faceZ(x, frame[4]) + .001 + Math.max(0, 1 - (x / HALF_WIDTH) ** 2) * relief(v) + correction[0];
    const actual = point(f.h, f.p.getX(i), f.p.getY(i), f.p.getZ(i)), offset = [actual[0] - x, actual[1] - frame[1], actual[2] - expectedZ];
    if (!Number.isFinite(actual[0] + actual[1] + actual[2] + f.n.getX(i) + f.n.getY(i) + f.n.getZ(i)) || actual[2] < .48)
      throw new Error('140 encountered nonfinite or unsupported rear-facing lip data.');
    const residual = Math.max(Math.abs(2 * f.uv.getX(i) - 1 - x), Math.abs(2.85 * f.uv.getY(i) - 1.25 - frame[0]));
    maximumUVResidual = Math.max(maximumUVResidual, residual);
    if (residual > FRAME_TOLERANCE) throw new Error(`140 canonical UV/grid correspondence changed at vertex ${i}.`);
    offsets.push(offset); for (let axis = 0; axis < 3; axis++) sum[axis] += offset[axis];
  }
  const commonOffset = sum.map(v => v / offsets.length); let maximumXYResidual = 0, maximumZResidual = 0;
  for (const offset of offsets) {
    maximumXYResidual = Math.max(maximumXYResidual, Math.abs(offset[0] - commonOffset[0]), Math.abs(offset[1] - commonOffset[1]));
    maximumZResidual = Math.max(maximumZResidual, Math.abs(offset[2] - commonOffset[2]));
  }
  if (Math.max(maximumXYResidual, maximumZResidual) > FRAME_TOLERANCE)
    throw new Error('140 source is not the accepted full130 lip under one common head-space translation.');
  for (let row = 0, k = 0; row < NY; row++) for (let col = 0; col < NX; col++) {
    const a = row * (NX + 1) + col, b = a + NX + 1;
    for (const expected of [a, b, a + 1, a + 1, b, b + 1]) if (f.original.index.getX(k++) !== expected)
      throw new Error('140 source upper-lip triangle order changed.');
  }
  return { samples: offsets.length, commonOffset, maximumUVResidual, maximumXYResidual, maximumZResidual,
    tolerance: FRAME_TOLERANCE, fittedSlopes: false, baselineProfile: 'Accepted full130, including its corner gate' };
}

// Temporary index of the actual accepted face triangles under this upper lip.
// Queries use current head XY. No same-UV/same-XY assumption is made for the
// already nonlinearly posed face. Only geometry depth is needed here.
function indexFace(face, lip) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity], uvBounds = bounds.slice();
  for (let i = 0; i < lip.p.count; i++) {
    const [x, y] = point(lip.h, lip.p.getX(i), lip.p.getY(i), lip.p.getZ(i)), u = 2 * lip.uv.getX(i) - 1, v = 2.85 * lip.uv.getY(i) - 1.25;
    bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y); bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
    uvBounds[0] = Math.min(uvBounds[0], u); uvBounds[1] = Math.min(uvBounds[1], v); uvBounds[2] = Math.max(uvBounds[2], u); uvBounds[3] = Math.max(uvBounds[3], v);
  }
  for (let i = 0; i < 4; i++) { bounds[i] += i < 2 ? -.004 : .004; uvBounds[i] += i < 2 ? -.025 : .025; }
  const cols = 32, rows = 16, cells = Array.from({ length: cols * rows }, () => []);
  const bx = x => Math.max(0, Math.min(cols - 1, Math.floor((x - bounds[0]) / (bounds[2] - bounds[0]) * cols)));
  const by = y => Math.max(0, Math.min(rows - 1, Math.floor((y - bounds[1]) / (bounds[3] - bounds[1]) * rows)));
  const { p, uv } = face, index = face.original.index; let count = 0;
  for (let k = 0; k < index.count; k += 3) {
    const ia = index.getX(k), ib = index.getX(k + 1), ic = index.getX(k + 2);
    const ua = 2 * uv.getX(ia) - 1, ub = 2 * uv.getX(ib) - 1, uc = 2 * uv.getX(ic) - 1;
    const va = 2.85 * uv.getY(ia) - 1.25, vb = 2.85 * uv.getY(ib) - 1.25, vc = 2.85 * uv.getY(ic) - 1.25;
    if (Math.max(ua, ub, uc) < uvBounds[0] || Math.min(ua, ub, uc) > uvBounds[2]
      || Math.max(va, vb, vc) < uvBounds[1] || Math.min(va, vb, vc) > uvBounds[3]) continue;
    const ps = [ia, ib, ic].map(i => point(face.h, p.getX(i), p.getY(i), p.getZ(i)));
    if (Math.min(...ps.map(v => v[2])) < .40) continue;
    const [a, b, c] = ps, determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(determinant) < 1e-14) continue;
    const minX = Math.min(a[0], b[0], c[0]), maxX = Math.max(a[0], b[0], c[0]), minY = Math.min(a[1], b[1], c[1]), maxY = Math.max(a[1], b[1], c[1]);
    if (maxX < bounds[0] || minX > bounds[2] || maxY < bounds[1] || minY > bounds[3]) continue;
    const triangle = { ps, determinant }; count++;
    for (let row = by(minY); row <= by(maxY); row++) for (let col = bx(minX); col <= bx(maxX); col++) cells[row * cols + col].push(triangle);
  }
  if (!count) throw new Error('140 cannot locate the actual face triangles below the upper lip.');
  const zAt = (ps, determinant, x, y) => {
    const [a, b, c] = ps;
    const wa = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / determinant;
    const wb = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / determinant;
    return wa * a[2] + wb * b[2] + (1 - wa - wb) * c[2];
  };
  return { triangles: count, cells: cells.length, clearance(ps) {
    const [a, b, c] = ps, determinant = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (Math.abs(determinant) < 1e-14) return null;
    const minX = Math.min(a[0], b[0], c[0]), maxX = Math.max(a[0], b[0], c[0]), minY = Math.min(a[1], b[1], c[1]), maxY = Math.max(a[1], b[1], c[1]);
    const candidates = new Set();
    for (let row = by(minY); row <= by(maxY); row++) for (let col = bx(minX); col <= bx(maxX); col++) for (const tri of cells[row * cols + col]) candidates.add(tri);
    let minimum = Infinity, vertices = 0, pieces = 0, area = 0;
    for (const tri of candidates) {
      // Clip the lip triangle against each real face triangle in head XY.
      // Both surfaces are affine over each resulting convex polygon, so their
      // minimum depth difference occurs at an intersection polygon vertex.
      let polygon = ps.map(p => [p[0], p[1]]);
      const direction = Math.sign(tri.determinant);
      for (let edge = 0; edge < 3 && polygon.length; edge++) {
        const start = tri.ps[edge], end = tri.ps[(edge + 1) % 3], dx = end[0] - start[0], dy = end[1] - start[1];
        const side = p => direction * (dx * (p[1] - start[1]) - dy * (p[0] - start[0]));
        const next = []; let previous = polygon.at(-1), previousSide = side(previous);
        for (const current of polygon) {
          const currentSide = side(current), inside = currentSide >= -1e-14, wasInside = previousSide >= -1e-14;
          if (inside !== wasInside) {
            const t = Math.max(0, Math.min(1, previousSide / (previousSide - currentSide)));
            next.push([previous[0] + t * (current[0] - previous[0]), previous[1] + t * (current[1] - previous[1])]);
          }
          if (inside) next.push(current);
          previous = current; previousSide = currentSide;
        }
        polygon = next;
      }
      if (polygon.length < 3) continue;
      let twiceArea = 0;
      for (let i = 0; i < polygon.length; i++) { const p = polygon[i], q = polygon[(i + 1) % polygon.length]; twiceArea += p[0] * q[1] - q[0] * p[1]; }
      const pieceArea = Math.abs(twiceArea) / 2;
      if (pieceArea < 1e-18) continue;
      area += pieceArea; pieces++;
      for (const [x, y] of polygon) {
        minimum = Math.min(minimum, zAt(ps, determinant, x, y) - zAt(tri.ps, tri.determinant, x, y)); vertices++;
      }
    }
    const expectedArea = Math.abs(determinant) / 2;
    if (!Number.isFinite(minimum) || area < expectedArea - Math.max(1e-14, expectedArea * 1e-6))
      throw new Error('140 upper-lip triangle is not completely covered by the accepted face projection.');
    return { minimum, vertices, pieces, coverage: area / expectedArea };
  } };
}

function stageGeometry(original) {
  const geometry = new original.constructor();
  try {
    geometry.name = original.name; geometry.type = original.type; geometry.userData = { ...original.userData,
      upperLipRelief140: { version: VERSION, blend: BLEND, endFraction: END } };
    for (const [name, attribute] of Object.entries(original.attributes)) geometry.setAttribute(name, attribute.clone());
    geometry.setIndex(original.index.clone());
    for (const group of original.groups || []) geometry.addGroup(group.start, group.count, group.materialIndex);
    geometry.setDrawRange(original.drawRange?.start || 0, original.drawRange?.count ?? Infinity);
    return geometry;
  } catch (error) { geometry.dispose(); throw error; }
}

/**
 * Called once on the accepted full130 head, after its prepared illumination.
 * Current head XY=(x+tx,Y130(x,v)+ty). Thus deltaY=Dv/Yv and
 * deltaX=Dx-Dv*Yx/Yv. J=I+eZ grad(delta)^T has determinant1; the local-frame
 * rank-one inverse transpose transports the current full130 authored normal.
 * The border/rows14..16/corners are skipped exactly. All private geometry
 * attributes and the index are copied because r186 disposal can delete cached
 * RenderObject bindings. Keep the applied geometry across backend switches.
 */
export function applyUpperLipRelief140(head, { strength = 0 } = {}) {
  if (!head?.isObject3D) throw new TypeError('140 requires the anatomical head.');
  if (strength !== 0 && strength !== 1) throw new RangeError('140 is the single approved on/off study: strength0 or1.');
  const old = applications.get(head);
  if (old) { if (old.strength !== strength) throw new Error('140 requires release or a fresh head before switching mode.'); return old.metrics; }
  if (!strength) return ZERO;
  const started = now(), { lip: f, face } = collect(head), frame = validateAccepted130(f), underlying = indexFace(face, f);
  const geometry = stageGeometry(f.original), pp = geometry.getAttribute('position'), nn = geometry.getAttribute('normal');
  const metrics = { version: VERSION, strength, applied: true, blend: BLEND, frame, privateGeometryCount: 1,
    privateAttributeBytes: Object.values(geometry.attributes).reduce((sum, a) => sum + a.array.byteLength, geometry.index.array.byteLength),
    changedPositions: 0, changedNormals: 0, maximumDepthReduction: 0, maximumOutwardDisplacement: 0,
    maximumAnatomicalXYRoundoff: 0, maximumNormalLengthError: 0, maximumTransportedNormalDegrees: 0,
    minimumJacobian: 1, maximumJacobian: 1, faceTrianglesIndexed: underlying.triangles, faceIndexCells: underlying.cells,
    minimumBaselineClearance: Infinity, minimumRepairedClearance: Infinity, clearanceIntersectionVertices: 0,
    clearanceIntersectionPolygons: 0, minimumFaceProjectionCoverage: 1,
    clearanceMethod: 'Full triangle/triangle XY intersection polygons; affine depth minima at their vertices',
    projectedOrientationFlips: 0, minimumTriangleAreaRatio: 1, maximumGeometricNormalTurnDegrees: 0,
    normalOperation: UPPER_LIP_RELIEF140_SPEC.normalOperation, extraAuthoredNormalEdit: false,
    materialChanged: false, textureChanged: false, meshToHead: f.h, headToMesh: f.back, elapsedMs: 0 };
  const parameter = new Float64Array(5), delta = new Float64Array(3), scratch130 = new Float64Array(4);
  try {
    const h = f.h, vx = f.back[8], vy = f.back[9], vz = f.back[10];
    for (let row = 0; row <= NY; row++) for (let col = 0; col <= NX; col++) {
      const i = row * (NX + 1) + col, x = -HALF_WIDTH + 2 * HALF_WIDTH * col / NX, v = row / NY;
      sampleUpperLipRelief140(x, v, delta, scratch130);
      if (delta[0] === 0 && delta[1] === 0 && delta[2] === 0) continue;
      if (delta[0] > 1e-12) throw new Error('140 unexpectedly expanded its inward-only relief.');
      sampleLipFrame130(x, v, true, parameter);
      if (Math.abs(parameter[3]) < 1e-6) throw new Error('140 encountered a singular lip XY parameter frame.');
      const dy = delta[2] / parameter[3], dx = delta[1] - dy * parameter[2];
      const gx = h[0] * dx + h[1] * dy, gy = h[4] * dx + h[5] * dy, gz = h[8] * dx + h[9] * dy;
      const determinant = 1 + vx * gx + vy * gy + vz * gz;
      if (Math.abs(determinant - 1) > 1e-10) throw new Error('140 Z shear lost its determinant-one invariant.');
      const nx = f.n.getX(i), ny = f.n.getY(i), nz = f.n.getZ(i), projection = (vx * nx + vy * ny + vz * nz) / determinant;
      const normal = unit(nx - gx * projection, ny - gy * projection, nz - gz * projection);
      pp.setXYZ(i, f.p.getX(i) + delta[0] * vx, f.p.getY(i) + delta[0] * vy, f.p.getZ(i) + delta[0] * vz);
      nn.setXYZ(i, ...normal);
      const sourceLength = Math.hypot(nx, ny, nz), dot = (nx * normal[0] + ny * normal[1] + nz * normal[2]) / sourceLength;
      metrics.maximumTransportedNormalDegrees = Math.max(metrics.maximumTransportedNormalDegrees, Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI);
      const px = pp.getX(i) - f.p.getX(i), py = pp.getY(i) - f.p.getY(i), pz = pp.getZ(i) - f.p.getZ(i);
      metrics.maximumAnatomicalXYRoundoff = Math.max(metrics.maximumAnatomicalXYRoundoff, Math.abs(h[0] * px + h[4] * py + h[8] * pz), Math.abs(h[1] * px + h[5] * py + h[9] * pz));
      metrics.maximumDepthReduction = Math.max(metrics.maximumDepthReduction, -delta[0]);
      metrics.maximumOutwardDisplacement = Math.max(metrics.maximumOutwardDisplacement, delta[0]);
      metrics.maximumNormalLengthError = Math.max(metrics.maximumNormalLengthError, Math.abs(Math.hypot(nn.getX(i), nn.getY(i), nn.getZ(i)) - 1));
      metrics.minimumJacobian = Math.min(metrics.minimumJacobian, determinant); metrics.maximumJacobian = Math.max(metrics.maximumJacobian, determinant);
      if (pp.getX(i) !== f.p.getX(i) || pp.getY(i) !== f.p.getY(i) || pp.getZ(i) !== f.p.getZ(i)) metrics.changedPositions++;
      if (nn.getX(i) !== nx || nn.getY(i) !== ny || nn.getZ(i) !== nz) metrics.changedNormals++;
    }
    const cross = (a, b, c) => { const u = b.map((v, i) => v - a[i]), v = c.map((w, i) => w - a[i]); return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; };
    for (let k = 0; k < geometry.index.count; k += 3) {
      const ids = [geometry.index.getX(k), geometry.index.getX(k + 1), geometry.index.getX(k + 2)];
      const a = ids.map(i => point(f.h, f.p.getX(i), f.p.getY(i), f.p.getZ(i))), b = ids.map(i => point(f.h, pp.getX(i), pp.getY(i), pp.getZ(i)));
      const before = cross(...a), after = cross(...b), l0 = Math.hypot(...before), l1 = Math.hypot(...after);
      if (l0 > 1e-12) {
        if (l1 <= 1e-12 || before[2] * after[2] <= 0) metrics.projectedOrientationFlips++;
        metrics.minimumTriangleAreaRatio = Math.min(metrics.minimumTriangleAreaRatio, l1 / l0);
        const dot = before.reduce((sum, value, i) => sum + value * after[i], 0) / (l0 * l1);
        metrics.maximumGeometricNormalTurnDegrees = Math.max(metrics.maximumGeometricNormalTurnDegrees, Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI);
      } else if (l1 > 1e-12) throw new Error('140 changed an originally degenerate fixed corner triangle.');
      const baseline = underlying.clearance(a), candidate = underlying.clearance(b);
      if (baseline && candidate) {
        metrics.minimumBaselineClearance = Math.min(metrics.minimumBaselineClearance, baseline.minimum);
        metrics.minimumRepairedClearance = Math.min(metrics.minimumRepairedClearance, candidate.minimum);
        metrics.clearanceIntersectionVertices += candidate.vertices; metrics.clearanceIntersectionPolygons += candidate.pieces;
        metrics.minimumFaceProjectionCoverage = Math.min(metrics.minimumFaceProjectionCoverage, candidate.coverage);
        if (candidate.minimum < UPPER_LIP_RELIEF140_SPEC.minimumClearance)
          throw new Error(`140 upper-lip triangle clearance is insufficient: ${candidate.minimum}.`);
      } else if (Boolean(baseline) !== Boolean(candidate)) throw new Error('140 changed a degenerate triangle projection.');
    }
    if (metrics.projectedOrientationFlips || metrics.maximumAnatomicalXYRoundoff > 6e-7 || metrics.maximumDepthReduction > .006904)
      throw new Error('140 exceeded its bounded geometry contract.');
    pp.needsUpdate = true; nn.needsUpdate = true; geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  } catch (error) { geometry.dispose(); throw error; }
  f.mesh.geometry = geometry; metrics.elapsedMs = now() - started;
  applications.set(head, { strength, mesh: f.mesh, original: f.original, geometry, metrics }); return metrics;
}

export function releaseUpperLipRelief140(head) {
  const record = applications.get(head);
  if (!record) return { released: false, privateGeometriesDisposed: 0, privateAttributeBytesReleased: 0 };
  if (record.mesh.geometry !== record.geometry) throw new Error('140 refuses to release a geometry replaced by another study.');
  record.mesh.geometry = record.original; record.geometry.dispose(); applications.delete(head);
  return { released: true, privateGeometriesDisposed: 1, privateAttributeBytesReleased: record.metrics.privateAttributeBytes };
}
