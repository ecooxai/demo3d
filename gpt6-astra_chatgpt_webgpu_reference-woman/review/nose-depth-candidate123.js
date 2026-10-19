// Review only. Apply once AFTER the accepted reference illumination bake.
// No image/material changes, new topology, animation callbacks or GPU textures.
// Three objects arrive from the live viewer; this module needs no second Three.
const VERSION = 'bounded-canonical-nose-depth-123';
const CX = 0, CY = -.43, RX = .24, RY = .22, INNER = .20;
const Z0 = .25, Z1 = .45, FACTOR = .94, EYE_Y = .05, MAX_DEPTH = .024;
const HALO = 1.02, FRAME_TOLERANCE = 6e-7;
const NAMES = Object.freeze(['continuous-face', 'naris--1', 'naris-1']);
const applications = new WeakMap(), DEFAULT_OPTIONS = Object.freeze({ depth: 0 });
const ZERO = Object.freeze({ version: VERSION, depth: 0, applied: false, changedVertices: 0,
  privateGeometryCount: 0, privateAttributeBytes: 0, minimumJacobian: 1, elapsedMs: 0 });
const now = () => typeof performance === 'object' ? performance.now() : Date.now();
const step = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (-15 + 6 * t));
const slope = t => t > 0 && t < 1 ? 30 * t * t * (1 - t) * (1 - t) : 0;

export const NOSE_DEPTH123_SPEC = Object.freeze({ version: VERSION, center: Object.freeze([CX, CY]),
  radii: Object.freeze([RX, RY]), innerRadius: INNER, frontGate: Object.freeze([Z0, Z1]),
  compaction: FACTOR, eyeY: EYE_Y, maximumDepth: MAX_DEPTH, halo: HALO,
  frameTolerance: FRAME_TOLERANCE, targets: NAMES });

// [delta Z, d(delta)/d canonical X, d(delta)/d canonical Y, d(delta)/d head Z].
// The compact radial profile is C2 at both its small flat core and outer edge.
// These derivatives are in head-unit canonical coordinates, NOT normalized UV.
export function sampleNoseDepth123(x, y, z, depth, out) {
  out[0] = out[1] = out[2] = out[3] = 0;
  if (depth === 0 || z <= Z0) return out;
  const xx = (x - CX) / RX, yy = (y - CY) / RY, r = Math.hypot(xx, yy);
  if (r >= 1) return out;
  const t = (r - INNER) / (1 - INNER), w = 1 - step(t), wr = -slope(t) / (1 - INNER);
  const zt = (z - Z0) / (Z1 - Z0), gate = step(zt), gateZ = slope(zt) / (Z1 - Z0);
  const wx = r > 0 ? wr * xx / (r * RX) : 0, wy = r > 0 ? wr * yy / (r * RY) : 0;
  out[0] = -depth * w * gate; out[1] = -depth * wx * gate;
  out[2] = -depth * wy * gate; out[3] = -depth * w * gateZ;
  return out;
}

function collectFrames(head) {
  head.updateWorldMatrix(true, true);
  const determinant = head.matrixWorld.determinant();
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) throw new Error('123 requires an invertible head frame.');
  if (head.userData?.portraitProportions?.factor !== FACTOR) throw new Error('123 requires the accepted .94 lower-face compaction.');
  const inverse = head.matrixWorld.clone().invert(), targets = [], counts = new Map();
  head.traverse(mesh => {
    if (!mesh.isMesh || !NAMES.includes(mesh.name)) return;
    counts.set(mesh.name, (counts.get(mesh.name) || 0) + 1);
    if (mesh.isSkinnedMesh || mesh.isInstancedMesh) throw new Error('123 expects the current static nasal meshes.');
    const original = mesh.geometry, p = original?.getAttribute('position'), n = original?.getAttribute('normal'), uv = original?.getAttribute('uv');
    if (!p || !n || !uv || p.itemSize !== 3 || n.itemSize !== 3 || uv.itemSize !== 2 || p.count !== n.count || p.count !== uv.count || !original.index
      || [p, n, uv].some(a => a.isInterleavedBufferAttribute || a.normalized) || !(p.array instanceof Float32Array) || !(n.array instanceof Float32Array))
      throw new Error(`123 requires explicit Float32 positions/normals and canonical UVs on ${mesh.name}.`);
    if (original.getAttribute('tangent') || Object.values(original.morphAttributes || {}).some(a => a.length)) throw new Error('123 does not alter authored tangents or morph targets.');
    const matrix = mesh.matrixWorld.clone().multiplyMatrices(inverse, mesh.matrixWorld), det = matrix.determinant();
    if (!Number.isFinite(det) || Math.abs(det) < 1e-12) throw new Error(`123 found a singular frame on ${mesh.name}.`);
    const h = matrix.elements.slice(), back = matrix.clone().invert().elements.slice();
    if ([...h, ...back].some(v => !Number.isFinite(v)) || Math.max(Math.abs(h[3]), Math.abs(h[7]), Math.abs(h[11]), Math.abs(h[15] - 1)) > 1e-12)
      throw new Error('123 supports finite affine mesh frames.');
    targets.push({ mesh, original, p, n, uv, h, back });
  });
  if (NAMES.some(name => counts.get(name) !== 1)) throw new Error('123 requires one continuous face and both original naris meshes.');
  return targets;
}

// UVs were assigned AFTER face.js portraitY and BEFORE the accepted .94 warp.
// In this nasal support the latter is fully linear. The cheek warp is identity
// for |X|<=.26, the lip warp lies below this support, and99 moves the whole head
// by one translation. Do not fit new slopes: verify these construction facts
// in the ACTUAL prepared geometry, allowing only one common head-space offset.
// The resulting canonical covectors are (1,0,0) and (0,1/.94,0) in head space.
function validateCanonicalFrame(targets) {
  let count = 0, sumX = 0, sumY = 0;
  const perMesh = [];
  for (const f of targets) {
    const { p, n, uv, h } = f; let samples = 0, frontSamples = 0, rearSamples = 0;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), u = uv.getX(i), v = uv.getY(i);
      if (!Number.isFinite(x + y + z + n.getX(i) + n.getY(i) + n.getZ(i) + u + v)) throw new Error(`123 found nonfinite source data on ${f.mesh.name}.`);
      const X = 2 * u - 1, Y = 2.85 * v - 1.25;
      if (Math.hypot((X - CX) / RX, (Y - CY) / RY) > HALO) continue;
      const xx = h[0] * x + h[4] * y + h[8] * z + h[12], yy = h[1] * x + h[5] * y + h[9] * z + h[13];
      const zz = h[2] * x + h[6] * y + h[10] * z + h[14];
      sumX += xx - X; sumY += yy - (EYE_Y + FACTOR * (Y - EYE_Y)); count++; samples++;
      if (zz >= Z1) frontSamples++; if (zz <= Z0) rearSamples++;
    }
    if (samples < 20 || frontSamples < 20) throw new Error(`123 cannot establish the complete nasal coordinate frame on ${f.mesh.name}.`);
    perMesh.push({ name: f.mesh.name, samples, frontSamples, rearSamples });
  }
  const offset = [sumX / count, sumY / count]; let maximumResidual = 0;
  for (const { mesh, p, uv, h } of targets) for (let i = 0; i < p.count; i++) {
    const X = 2 * uv.getX(i) - 1, Y = 2.85 * uv.getY(i) - 1.25;
    if (Math.hypot((X - CX) / RX, (Y - CY) / RY) > HALO) continue;
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const residual = Math.max(Math.abs(h[0] * x + h[4] * y + h[8] * z + h[12] - X - offset[0]),
      Math.abs(h[1] * x + h[5] * y + h[9] * z + h[13] - EYE_Y - FACTOR * (Y - EYE_Y) - offset[1]));
    maximumResidual = Math.max(maximumResidual, residual);
    if (residual > FRAME_TOLERANCE) throw new Error(`123 canonical frame drift on ${mesh.name} vertex${i}: residual ${residual}.`);
  }
  return { samples: count, perMesh, commonOffsetXY: offset, maximumResidual, tolerance: FRAME_TOLERANCE,
    canonicalXGradientHead: [1, 0, 0], canonicalYGradientHead: [0, 1 / FACTOR, 0], fittedSlopes: false };
}

function disposePrivateGeometry(geometry) {
  // r186 Geometries.onDispose also deletes attributes retained by RenderObject,
  // even if they were removed from geometry.attributes. Every staged attribute
  // AND its index is private, so the actual handler cannot delete source data.
  geometry.dispose();
}

function stageGeometry(original) {
  const staged = new original.constructor();
  try {
    staged.name = original.name; staged.type = original.type;
    staged.userData = { ...original.userData };
    for (const [key, attribute] of Object.entries(original.attributes)) staged.setAttribute(key, attribute.clone());
    staged.setIndex(original.index.clone());
    for (const group of original.groups || []) staged.addGroup(group.start, group.count, group.materialIndex);
    staged.setDrawRange(original.drawRange?.start || 0, original.drawRange?.count ?? Infinity);
    return staged;
  } catch (error) { disposePrivateGeometry(staged); throw error; }
}

/**
 * Review depths0/.012/.024 in original head units. Geometry-only displacement
 * Z'=Z+delta preserves canonical and anatomical X/Y; the current aligned local
 * X/Y Float32 values also remain exact. Oblique mesh-frame fixtures preserve
 * anatomical X/Y to Float32 precision instead of assuming those local axes.
 *
 * Let A be the actual mesh→head linear map, g=A^T grad_head(delta), v=A^-1 eZ.
 * J=I+v g^T, detJ=1+delta_Z, and n'=n-g(v·n)/detJ before normalization.
 * The smooth front gate gives the conservative bound detJ>=1-depth*1.875/.20,
 * which is .775 at.024; the actual front nasal surface has gate1 and detJ1.
 * Original source attributes stay byte-identical. Three private geometries own
 * ALL of their buffers; only position/normal values change. This also makes the
 * actual r186 cached-attribute disposal safe. All staging completes before any
 * mesh is replaced. releaseNoseDepth123 restores original geometry references.
 */
export function applyNoseDepth123(head, options = DEFAULT_OPTIONS) {
  const depth = Number(options.depth ?? 0);
  if (!Number.isFinite(depth) || depth < 0 || depth > MAX_DEPTH) throw new RangeError('123 depth must be between0 and.024 head units.');
  if (!head?.isObject3D) throw new TypeError('123 requires the anatomical head.');
  const previous = applications.get(head);
  if (previous) { if (previous.depth !== depth) throw new Error('123 already differs; compare a fresh head or release the isolated study.'); return previous.metrics; }
  if (depth === 0) return ZERO;
  const started = now(), targets = collectFrames(head), frame = validateCanonicalFrame(targets), staged = [];
  const metrics = { version: VERSION, depth, applied: true, frame, changedVertices: 0, privateGeometryCount: 3,
    privateAttributeBytes: 0, positionNormalBytes: 0, unchangedAttributeIndexBytes: 0, minimumJacobian: 1, maximumJacobian: 1, guaranteedMinimumJacobian: 1 - depth * 1.875 / (Z1 - Z0),
    maximumHeadDisplacement: 0, maximumAnatomicalXYRoundoff: 0, maximumNormalLengthError: 0, zeroNormalsPreserved: 0, perMesh: [], elapsedMs: 0 };
  const sample = new Float64Array(4);
  try {
    for (const f of targets) {
      const { mesh, original, p, n, uv, h, back } = f, geometry = stageGeometry(original);
      staged.push({ mesh, original, geometry });
      const pp = geometry.getAttribute('position'), nn = geometry.getAttribute('normal'), vx = back[8], vy = back[9], vz = back[10];
      let changedVertices = 0, localXYChangedValues = 0;
      const positionNormalBytes = pp.array.byteLength + nn.array.byteLength;
      const allBytes = Object.values(geometry.attributes).reduce((sum, attribute) => sum + attribute.array.byteLength, geometry.index.array.byteLength);
      metrics.positionNormalBytes += positionNormalBytes; metrics.privateAttributeBytes += allBytes;
      metrics.unchangedAttributeIndexBytes += allBytes - positionNormalBytes;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), Z = h[2] * x + h[6] * y + h[10] * z + h[14];
        sampleNoseDepth123(2 * uv.getX(i) - 1, 2.85 * uv.getY(i) - 1.25, Z, depth, sample);
        const amount = sample[0]; if (amount === 0) continue;
        const hx = sample[1], hy = sample[2] / FACTOR, hz = sample[3];
        const gx = h[0] * hx + h[1] * hy + h[2] * hz, gy = h[4] * hx + h[5] * hy + h[6] * hz, gz = h[8] * hx + h[9] * hy + h[10] * hz;
        const jac = 1 + vx * gx + vy * gy + vz * gz;
        if (!Number.isFinite(jac) || jac < metrics.guaranteedMinimumJacobian - 1e-12) throw new Error('123 encountered an invalid displacement Jacobian.');
        const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i), dot = (vx * nx + vy * ny + vz * nz) / jac;
        const a = nx - gx * dot, b = ny - gy * dot, c = nz - gz * dot, length = Math.hypot(a, b, c);
        pp.setXYZ(i, x + amount * vx, y + amount * vy, z + amount * vz);
        if (length) nn.setXYZ(i, a / length, b / length, c / length); else metrics.zeroNormalsPreserved++;
        if (!Number.isFinite(length + pp.getX(i) + pp.getY(i) + pp.getZ(i))) throw new Error('123 produced nonfinite geometry.');
        const dx = pp.getX(i) - x, dy = pp.getY(i) - y, dz = pp.getZ(i) - z;
        metrics.maximumAnatomicalXYRoundoff = Math.max(metrics.maximumAnatomicalXYRoundoff,
          Math.abs(h[0] * dx + h[4] * dy + h[8] * dz), Math.abs(h[1] * dx + h[5] * dy + h[9] * dz));
        if (pp.getX(i) !== x) localXYChangedValues++; if (pp.getY(i) !== y) localXYChangedValues++;
        if (length) metrics.maximumNormalLengthError = Math.max(metrics.maximumNormalLengthError, Math.abs(Math.hypot(nn.getX(i), nn.getY(i), nn.getZ(i)) - 1));
        metrics.minimumJacobian = Math.min(metrics.minimumJacobian, jac); metrics.maximumJacobian = Math.max(metrics.maximumJacobian, jac);
        metrics.maximumHeadDisplacement = Math.max(metrics.maximumHeadDisplacement, -amount); changedVertices++;
      }
      if (!changedVertices) throw new Error(`123 did not reach the expected nasal surface on ${mesh.name}.`);
      pp.needsUpdate = true; nn.needsUpdate = true; geometry.computeBoundingBox(); geometry.computeBoundingSphere();
      metrics.changedVertices += changedVertices;
      metrics.perMesh.push({ name: mesh.name, vertices: p.count, triangles: original.index.count / 3, changedVertices, localXYChangedValues,
        meshToHead: h, headToMesh: back });
    }
  } catch (error) { for (const record of staged) disposePrivateGeometry(record.geometry); throw error; }
  for (const record of staged) record.mesh.geometry = record.geometry;
  metrics.elapsedMs = now() - started;
  applications.set(head, { depth, staged, metrics });
  return metrics;
}

export function releaseNoseDepth123(head) {
  const state = applications.get(head);
  if (!state) return { released: false, privateGeometriesDisposed: 0, privateAttributeBytesReleased: 0 };
  for (const record of state.staged) if (record.mesh.geometry !== record.geometry) throw new Error('123 cannot release a geometry replaced by another study.');
  for (const record of state.staged) record.mesh.geometry = record.original;
  for (const record of state.staged) disposePrivateGeometry(record.geometry);
  applications.delete(head);
  return { released: true, privateGeometriesDisposed: state.staged.length, privateAttributeBytesReleased: state.metrics.privateAttributeBytes };
}
