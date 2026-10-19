// Shared source/native audit of the concrete123 deformation risks. It reads
// original and candidate mesh data; it never changes geometry or normals.
import { NOSE_DEPTH123_SPEC as spec, sampleNoseDepth123 } from './nose-depth-candidate123.js';

const demand = (value, message) => { if (!value) throw new Error(message); };
const point = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
const xyz = (p, i) => [p.getX(i), p.getY(i), p.getZ(i)];
const sub = (a, b) => a.map((v, k) => v - b[k]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a); return l ? a.map(x => x / l) : a; };
const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(norm(a), norm(b))))) * 180 / Math.PI;
const canonical = (uv, i) => [2 * uv.getX(i) - 1, 2.85 * uv.getY(i) - 1.25];
const mix = (a, b, c, u, v) => a.map((x, k) => x * (1 - u - v) + b[k] * u + c[k] * v);

// Independent cofactor inverse-transpose, rather than repeating the candidate's
// Sherman–Morrison implementation. Columns hold derivatives of output position.
function transport(normal, columns) {
  const [a, b, c] = columns, x = cross(b, c), y = cross(c, a), z = cross(a, b), det = dot(a, x);
  return norm(x.map((value, i) => (value * normal[0] + y[i] * normal[1] + z[i] * normal[2]) / det));
}
function jacobian(sample, h, back) {
  const v = [back[8], back[9], back[10]], hg = [sample[1], sample[2] / spec.compaction, sample[3]];
  const g = [0, 4, 8].map(i => h[i] * hg[0] + h[i + 1] * hg[1] + h[i + 2] * hg[2]);
  return [0, 1, 2].map(axis => v.map((value, i) => (axis === i ? 1 : 0) + value * g[axis]));
}
function frame(head, mesh) {
  const h = mesh.matrixWorld.clone().multiplyMatrices(head.matrixWorld.clone().invert(), mesh.matrixWorld);
  return { h: h.elements.slice(), back: h.clone().invert().elements.slice() };
}

export function auditNoseGeometry123(head, originals, depth) {
  head.updateWorldMatrix(true, true);
  const report = { depth, targetMeshes: [], changedVertices: 0, outsideSupportPositionOrNormalChanges: 0, localXYChangedValues: 0,
    maximumAnatomicalXYError: 0, maximumPositionMapError: 0, maximumUnitNormalError: 0, minimumJacobian: 1,
    authoredShadingNormalTransport: { samples: 0, maximumComponentError: 0, maximumAngleDegrees: 0,
      comparison: 'Stored shading normals vs independent cofactor inverse-transpose of those same authored normals. This does not assert agreement with flat geometric normals.' },
    geometricFiniteDifference: { triangles: 0, maximumAngleDegrees: 0, maximumCanonicalTangentResidual: 0,
      comparison: 'Central differences of the continuous displaced position on each actual source triangle, parameterized by its actual barycentric position and UV interpolation, vs transported original flat triangle normal. Float32 UV-position residuals are reported separately.' },
    updatedTriangleOrientation: { triangles: 0, preexistingDegenerateTriangles: 0, newlyDegenerateTriangles: 0, invertedTriangles: 0, minimumDot: 1, minimumAreaRatio: Infinity,
      comparison: 'Actual deformed endpoint triangle cross product vs transported original flat triangle normal at its centroid. This checks endpoint mesh orientation separately from the continuous-field finite difference.' },
    bounds: [], narisAttachment: null };
  const records = originals.map(({ mesh, geometry }) => ({ mesh, original: geometry, active: mesh.geometry, ...frame(head, mesh) }));
  const f = new Float64Array(4);
  for (const record of records) {
    const { mesh, original, active, h, back } = record, p = original.getAttribute('position'), n = original.getAttribute('normal'), uv = original.getAttribute('uv');
    const pp = active.getAttribute('position'), nn = active.getAttribute('normal'), index = original.index;
    demand(pp.count === p.count && nn.count === n.count && active.index.count === index.count, `123 changed topology on ${mesh.name}.`);
    for (let i = 0; i < index.count; i++) demand(active.index.getX(i) === index.getX(i), `123 changed topology value on ${mesh.name} index${i}.`);
    for (const [key, attribute] of Object.entries(original.attributes)) if (key !== 'position' && key !== 'normal') {
      const current = active.getAttribute(key);
      demand(current.itemSize === attribute.itemSize && current.count === attribute.count && current.normalized === attribute.normalized && current.array.length === attribute.array.length, `123 changed protected ${key} layout on ${mesh.name}.`);
      for (let i = 0; i < attribute.array.length; i++) demand(current.array[i] === attribute.array[i], `123 changed protected ${key} value on ${mesh.name} at${i}.`);
    }
    demand(JSON.stringify(active.groups || []) === JSON.stringify(original.groups || []), `123 changed material groups on ${mesh.name}.`);
    const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    let changed = 0;
    for (let i = 0; i < p.count; i++) {
      const before = xyz(p, i), after = xyz(pp, i), oldHead = point(h, before), newHead = point(h, after), xy = canonical(uv, i);
      sampleNoseDepth123(xy[0], xy[1], oldHead[2], depth, f);
      const oldNormal = xyz(n, i), normal = xyz(nn, i), length = Math.hypot(...normal);
      demand([...after, ...normal].every(Number.isFinite), `123 nonfinite position/normal on ${mesh.name} vertex${i}.`);
      if (length) report.maximumUnitNormalError = Math.max(report.maximumUnitNormalError, Math.abs(length - 1));
      for (let k = 0; k < 3; k++) { bounds.min[k] = Math.min(bounds.min[k], after[k]); bounds.max[k] = Math.max(bounds.max[k], after[k]); }
      if (after[0] !== before[0]) report.localXYChangedValues++; if (after[1] !== before[1]) report.localXYChangedValues++;
      report.maximumAnatomicalXYError = Math.max(report.maximumAnatomicalXYError, Math.abs(newHead[0] - oldHead[0]), Math.abs(newHead[1] - oldHead[1]));
      report.maximumPositionMapError = Math.max(report.maximumPositionMapError, Math.abs(newHead[2] - oldHead[2] - f[0]));
      if (f[0] === 0) {
        for (let k = 0; k < 3; k++) if (after[k] !== before[k] || normal[k] !== oldNormal[k]) report.outsideSupportPositionOrNormalChanges++;
        continue;
      }
      changed++; report.minimumJacobian = Math.min(report.minimumJacobian, 1 + f[3]);
      if (Math.hypot(...oldNormal) === 0) { demand(length === 0, '123 changed a preexisting zero shading normal.'); continue; }
      const expected = transport(oldNormal, jacobian(f, h, back)), shade = report.authoredShadingNormalTransport;
      shade.samples++; shade.maximumAngleDegrees = Math.max(shade.maximumAngleDegrees, angle(expected, normal));
      shade.maximumComponentError = Math.max(shade.maximumComponentError, ...normal.map((v, k) => Math.abs(v - expected[k])));
    }
    const bb = active.boundingBox, sphere = active.boundingSphere;
    demand(bb && sphere && Number.isFinite(sphere.radius), `123 needs finite computed bounds on ${mesh.name}.`);
    const suppliedMin = ['x', 'y', 'z'].map(key => bb.min[key]), suppliedMax = ['x', 'y', 'z'].map(key => bb.max[key]);
    demand(suppliedMin.every((v, i) => Math.abs(v - bounds.min[i]) < 1e-7) && suppliedMax.every((v, i) => Math.abs(v - bounds.max[i]) < 1e-7), `123 bounding box does not match ${mesh.name}.`);
    let sphereExcess = 0;
    for (let i = 0; i < pp.count; i++) sphereExcess = Math.max(sphereExcess, Math.hypot(pp.getX(i) - sphere.center.x, pp.getY(i) - sphere.center.y, pp.getZ(i) - sphere.center.z) - sphere.radius);
    demand(sphereExcess < 1e-7, `123 bounding sphere excludes ${mesh.name}.`);
    report.bounds.push({ name: mesh.name, ...bounds, sphereRadius: sphere.radius, maximumSphereExcess: sphereExcess });
    report.targetMeshes.push({ name: mesh.name, vertices: p.count, triangles: index.count / 3, changedVertices: changed }); report.changedVertices += changed;

    for (let at = 0; at < index.count; at += 3) {
      const ids = [index.getX(at), index.getX(at + 1), index.getX(at + 2)], points = ids.map(i => xyz(p, i)), uvPoints = ids.map(i => canonical(uv, i));
      if (!uvPoints.some(([x, y], i) => Math.hypot((x - spec.center[0]) / spec.radii[0], (y - spec.center[1]) / spec.radii[1]) < 1.05 && point(h, points[i])[2] > spec.frontGate[0])) continue;
      const e1 = sub(points[1], points[0]), e2 = sub(points[2], points[0]), beforeNormal = cross(e1, e2), oldArea = Math.hypot(...beforeNormal);
      const check = report.updatedTriangleOrientation;
      if (oldArea < 1e-15) { check.preexistingDegenerateTriangles++; continue; }
      const activePoints = ids.map(i => xyz(pp, i)), afterNormal = cross(sub(activePoints[1], activePoints[0]), sub(activePoints[2], activePoints[0])), newArea = Math.hypot(...afterNormal);
      const center = mix(...points, 1 / 3, 1 / 3), xy = mix(...uvPoints, 1 / 3, 1 / 3);
      sampleNoseDepth123(xy[0], xy[1], point(h, center)[2], depth, f);
      const expectedFlat = transport(beforeNormal, jacobian(f, h, back));
      check.triangles++; if (newArea < 1e-15) check.newlyDegenerateTriangles++;
      const agreement = newArea ? dot(expectedFlat, norm(afterNormal)) : -1;
      if (agreement <= 0) check.invertedTriangles++; check.minimumDot = Math.min(check.minimumDot, agreement); check.minimumAreaRatio = Math.min(check.minimumAreaRatio, newArea / oldArea);

      // True geometric finite difference of the continuous position mapping.
      // UVs at perturbed barycentric points are interpolated from source UVs,
      // not recovered by assuming posed XYZ derivatives equal UV derivatives.
      const mapBary = (u, v) => {
        const q = mix(...points, u, v), st = mix(...uvPoints, u, v), z = point(h, q)[2], sample = new Float64Array(4);
        sampleNoseDepth123(st[0], st[1], z, depth, sample);
        return q.map((value, i) => value + sample[0] * back[8 + i]);
      };
      const u = .27, v = .31, eps = 1e-4, qa = mapBary(u + eps, v), qb = mapBary(u - eps, v), qc = mapBary(u, v + eps), qd = mapBary(u, v - eps);
      const geometric = cross(sub(qa, qb), sub(qc, qd)), q = mix(...points, u, v), st = mix(...uvPoints, u, v);
      sampleNoseDepth123(st[0], st[1], point(h, q)[2], depth, f);
      const transported = transport(beforeNormal, jacobian(f, h, back)), fd = report.geometricFiniteDifference;
      fd.triangles++; fd.maximumAngleDegrees = Math.max(fd.maximumAngleDegrees, angle(geometric, transported));
      const headPoints = points.map(q => point(h, q));
      for (let side = 1; side <= 2; side++) fd.maximumCanonicalTangentResidual = Math.max(fd.maximumCanonicalTangentResidual,
        Math.abs(uvPoints[side][0] - uvPoints[0][0] - (headPoints[side][0] - headPoints[0][0])),
        Math.abs(uvPoints[side][1] - uvPoints[0][1] - (headPoints[side][1] - headPoints[0][1]) / spec.compaction));
    }
  }
  demand(report.maximumPositionMapError < 3e-7 && report.maximumAnatomicalXYError < 3e-7, '123 position map does not match the bounded anatomical-Z field.');
  demand(report.outsideSupportPositionOrNormalChanges === 0 && report.maximumUnitNormalError < 2e-6, '123 changed protected source positions/normals or lost unit normals.');
  demand(report.authoredShadingNormalTransport.maximumComponentError < 1e-7, '123 authored shading-normal transport differs from the independent inverse-transpose.');
  demand(report.geometricFiniteDifference.maximumAngleDegrees < .03, '123 actual-triangle geometric finite difference disagrees with the canonical-frame derivative.');
  demand(!report.updatedTriangleOrientation.newlyDegenerateTriangles && !report.updatedTriangleOrientation.invertedTriangles && report.updatedTriangleOrientation.minimumDot > .95, '123 collapsed, inverted or excessively sheared an actual nasal triangle.');

  // Naris overlays were authored as faceZ+ .0018 before both Y warps. Compare
  // their real Z separation from the piecewise-linear face at the SAME UV.
  // A nonlinear field has a bounded endpoint-interpolation difference, so this
  // check reports the measured gap change and never calls it exact attachment.
  const faceRecord = records.find(record => record.mesh.name === 'continuous-face'), narisRecords = records.filter(record => record !== faceRecord);
  const fp = faceRecord.original.getAttribute('position'), fpp = faceRecord.active.getAttribute('position'), fuv = faceRecord.original.getAttribute('uv'), fi = faceRecord.original.index;
  const range = { min: [Infinity, Infinity], max: [-Infinity, -Infinity] };
  for (const r of narisRecords) { const uv = r.original.getAttribute('uv'); for (let i = 0; i < uv.count; i++) canonical(uv, i).forEach((v, k) => { range.min[k] = Math.min(range.min[k], v); range.max[k] = Math.max(range.max[k], v); }); }
  const triangles = [];
  for (let at = 0; at < fi.count; at += 3) {
    const ids = [fi.getX(at), fi.getX(at + 1), fi.getX(at + 2)], st = ids.map(i => canonical(fuv, i)), before = ids.map(i => point(faceRecord.h, xyz(fp, i)));
    if (before.some(q => q[2] < spec.frontGate[1]) || [0, 1].some(k => Math.max(...st.map(q => q[k])) < range.min[k] || Math.min(...st.map(q => q[k])) > range.max[k])) continue;
    triangles.push({ st, before, after: ids.map(i => point(faceRecord.h, xyz(fpp, i))) });
  }
  const attachment = { vertices: 0, supportTriangles: triangles.length, missedVertices: 0, minimumOriginalGapZ: Infinity, minimumDeformedGapZ: Infinity,
    maximumOriginalGapZ: -Infinity, maximumGapChangeZ: 0, maximumProjectedXYSeparationChange: 0,
    scope: 'Same-UV head-Z overlay separation against actual original/deformed continuous-face triangles. The finite nonzero gap change is endpoint resampling, not a change of UV registration.' };
  for (const record of narisRecords) {
    const p = record.original.getAttribute('position'), pp = record.active.getAttribute('position'), uv = record.original.getAttribute('uv');
    for (let i = 0; i < p.count; i++) {
      const xy = canonical(uv, i); let hit;
      for (const tri of triangles) {
        const [a, b, c] = tri.st, den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
        if (Math.abs(den) < 1e-15) continue;
        const wa = ((b[1] - c[1]) * (xy[0] - c[0]) + (c[0] - b[0]) * (xy[1] - c[1])) / den;
        const wb = ((c[1] - a[1]) * (xy[0] - c[0]) + (a[0] - c[0]) * (xy[1] - c[1])) / den, wc = 1 - wa - wb;
        if (Math.min(wa, wb, wc) < -1e-7) continue;
        hit = { before: mix(...tri.before, wb, wc), after: mix(...tri.after, wb, wc) }; break;
      }
      if (!hit) { attachment.missedVertices++; continue; }
      const before = point(record.h, xyz(p, i)), after = point(record.h, xyz(pp, i)), oldGap = before[2] - hit.before[2], newGap = after[2] - hit.after[2];
      attachment.vertices++; attachment.minimumOriginalGapZ = Math.min(attachment.minimumOriginalGapZ, oldGap); attachment.maximumOriginalGapZ = Math.max(attachment.maximumOriginalGapZ, oldGap);
      attachment.minimumDeformedGapZ = Math.min(attachment.minimumDeformedGapZ, newGap); attachment.maximumGapChangeZ = Math.max(attachment.maximumGapChangeZ, Math.abs(newGap - oldGap));
      for (let k = 0; k < 2; k++) attachment.maximumProjectedXYSeparationChange = Math.max(attachment.maximumProjectedXYSeparationChange, Math.abs((after[k] - hit.after[k]) - (before[k] - hit.before[k])));
    }
  }
  demand(!attachment.missedVertices && attachment.vertices > 1000 && attachment.minimumOriginalGapZ > 0 && attachment.minimumDeformedGapZ > 0, '123 lost an existing positive naris-to-face overlay separation.');
  demand(attachment.maximumGapChangeZ < .00015 && attachment.maximumProjectedXYSeparationChange < 3e-7, '123 exceeded the bounded naris endpoint interpolation/registration budget.');
  report.narisAttachment = attachment;
  return report;
}
