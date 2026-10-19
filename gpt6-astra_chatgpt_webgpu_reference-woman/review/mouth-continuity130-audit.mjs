import fs from 'node:fs';
import assert from 'node:assert/strict';
import { applyMouthContinuity130, releaseMouthContinuity130, sampleLipFrame130, sampleLipRelief130, MOUTH_CONTINUITY130_SPEC as spec } from './mouth-continuity-candidate130.js';
import { THREE, Attr, Geometry, Matrix4, I, mul, T, RY, RZ, point, object, attach, hash, read, sha } from './torso-depth110-harness.mjs';

// Local source geometry audit. Actual live Three, materials, color atlas and
// native renderer are deliberately left to the root's focused comparison.
THREE.Color.prototype.offsetHSL = function () { return this; };
THREE.MeshStandardMaterial = THREE.MeshPhysicalMaterial;
Geometry.prototype.addGroup = function (start, count, materialIndex = 0) { (this.groups ||= []).push({ start, count, materialIndex }); };
Geometry.prototype.setDrawRange = function (start, count) { this.drawRange = { start, count }; };
Geometry.prototype.computeBoundingBox = function () {
  const p = this.getAttribute('position'), min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (let i = 0; i < p.count; i++) for (const [key, value] of [['x', p.getX(i)], ['y', p.getY(i)], ['z', p.getZ(i)]]) { min[key] = Math.min(min[key], value); max[key] = Math.max(max[key], value); }
  this.boundingBox = { min, max };
};
Geometry.prototype.computeBoundingSphere = function () {
  if (!this.boundingBox) this.computeBoundingBox();
  const center = Object.fromEntries(['x', 'y', 'z'].map(key => [key, (this.boundingBox.min[key] + this.boundingBox.max[key]) / 2])), p = this.getAttribute('position');
  let radius = 0; for (let i = 0; i < p.count; i++) radius = Math.max(radius, Math.hypot(p.getX(i) - center.x, p.getY(i) - center.y, p.getZ(i) - center.z));
  this.boundingSphere = { center, radius };
};
let disposed = [];
Geometry.prototype.dispose = function () { disposed.push({ geometry: this, attributes: { ...this.attributes }, index: this.index }); };

const sourceFaceText = read('src/face.js'), creaseLine = "group.add(mesh(tube(points,.0019,90,5),new THREE.MeshStandardMaterial({color:'#96605a',roughness:.65}),'closed-mouth-crease'));";
assert.equal(sourceFaceText.split(creaseLine).length, 2, 'The source crease construction changed.');
// Only the already-attributed tube is omitted from this geometry harness. The
// two actual source makeMouth grids and their computed normals run unchanged.
const face = new Function('THREE', sourceFaceText.replace(creaseLine, '') + '\nreturn {profile,faceZ,orbitalRadius,portraitY,makeMouth,refineEarBed};')(THREE);
const lowerFaceWarp = new Function('Matrix4', read('src/portrait-proportions.js') + '\nreturn lowerFaceWarp;')(Matrix4);
const applyCheek = new Function('Matrix4', read('src/face-refinement.js') + '\nreturn applyLowerCheekTaper;')(Matrix4);
const applyLip = new Function('Matrix4', read('src/lip-refinement.js') + '\nreturn applyLipThicknessRefinement;')(Matrix4);
const applyBalance = new Function('Matrix4', read('src/portrait-balance.js') + '\nreturn applyPortraitBalance;')(Matrix4);
const started = performance.now(), cpuStarted = process.cpuUsage();

function primaryFace() {
  const positions = [], indices = [], ny = 290, nt = 380;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nt; i++) {
    const y = -1.18 + j / ny * 2.72, a = -Math.PI + i / nt * 2 * Math.PI, [w, , rear] = face.profile(y), x = w * Math.sin(a), z = Math.cos(a) >= 0 ? face.faceZ(x, y) : rear * Math.cos(a);
    positions.push(x, y, z);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nt; i++) {
    const a = j * (nt + 1) + i, b = a + nt + 1, x = (positions[a * 3] + positions[(a + 1) * 3] + positions[b * 3] + positions[(b + 1) * 3]) / 4, y = (positions[a * 3 + 1] + positions[b * 3 + 1]) / 2;
    if (!(positions[a * 3 + 2] > 0 && [-1, 1].some(s => face.orbitalRadius(x, y, s) < 1.20))) indices.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geometry = new Geometry().setAttribute('position', new Attr(positions, 3)).setIndex(indices); geometry.computeVertexNormals();
  const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), e = .00012;
  for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0 && Math.abs(p.getX(i)) < .73 && p.getY(i) > -.03 && p.getY(i) < .64) {
    const x = p.getX(i), y = p.getY(i), nx = -(face.faceZ(x + e, y) - face.faceZ(x - e, y)) / (2 * e), ny = -(face.faceZ(x, y + e) - face.faceZ(x, y - e)) / (2 * e), length = Math.hypot(nx, ny, 1);
    n.setXYZ(i, nx / length, ny / length, 1 / length);
  }
  geometry.setAttribute('color', new Attr(new Float32Array(p.count * 3).fill(.5), 3)); geometry.addGroup(0, geometry.index.count, 0); geometry.setDrawRange(0, Infinity);
  return geometry;
}
function initialWarp(geometry, isFace = false) {
  const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), derivative = (face.portraitY(y + .0001) - face.portraitY(y - .0001)) / .0002;
    p.setY(i, face.portraitY(y)); const nx = n.getX(i), ny = n.getY(i) / Math.max(.3, derivative), nz = n.getZ(i), length = Math.hypot(nx, ny, nz);
    if (length) n.setXYZ(i, nx / length, ny / length, nz / length);
  }
  if (isFace) face.refineEarBed(geometry);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + 1) / 2; uv[i * 2 + 1] = (p.getY(i) + 1.25) / 2.85; }
  geometry.setAttribute('uv', new Attr(uv, 2));
  for (let i = 0; i < p.count; i++) {
    const warp = lowerFaceWarp(p.getY(i)), nx = n.getX(i), ny = n.getY(i) / (1 + warp.derivative), nz = n.getZ(i), length = Math.hypot(nx, ny, nz);
    p.setY(i, p.getY(i) + warp.displacement); if (length) n.setXYZ(i, nx / length, ny / length, nz / length);
  }
  geometry.computeBoundingBox(); geometry.computeBoundingSphere(); return geometry;
}

const sourceHead = object('anatomical-head'); sourceHead.userData = { portraitProportions: { factor: .94 } };
attach(sourceHead, 'continuous-face', initialWarp(primaryFace(), true), I());
for (const mesh of face.makeMouth().children) attach(sourceHead, mesh.name, initialWarp(mesh.geometry), I(), mesh.material);
applyCheek(sourceHead, { strength: .025 }); applyLip(sourceHead, { strength: .06 });
const headPose = mul(T(.26, 2.95, 0), mul(RY(.16), RZ(-.17))), model = object('model'); model.add(sourceHead);
sourceHead.matrixWorld = headPose; sourceHead.traverse(mesh => { if (mesh.isMesh) mesh.matrixWorld = headPose; }); applyBalance(model, { shiftX: -.24 });
const sourceTargets = sourceHead.children.map(mesh => ({ name: mesh.name, geometry: mesh.geometry, material: mesh.material }));

function fixture(frame = I()) {
  const head = object('anatomical-head', headPose); head.userData = { portraitProportions: { factor: .94 }, lipThicknessRefinement: { strength: .06 } };
  const inverse = frame.clone().invert(), m = frame.elements;
  for (const source of sourceTargets) {
    const g = source.geometry.clone(), p = g.getAttribute('position'), n = g.getAttribute('normal');
    g.groups = (source.geometry.groups || []).map(value => ({ ...value })); g.drawRange = { ...(source.geometry.drawRange || { start: 0, count: Infinity }) };
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, ...point(inverse, [p.getX(i), p.getY(i), p.getZ(i)]));
      const x = n.getX(i), y = n.getY(i), z = n.getZ(i), nx = m[0] * x + m[1] * y + m[2] * z, ny = m[4] * x + m[5] * y + m[6] * z, nz = m[8] * x + m[9] * y + m[10] * z, length = Math.hypot(nx, ny, nz);
      if (length) n.setXYZ(i, nx / length, ny / length, nz / length);
    }
    g.computeBoundingBox(); g.computeBoundingSphere(); attach(head, source.name, g, mul(headPose, frame), source.material);
  }
  return head;
}
function snapshot(head) {
  const records = [];
  head.traverse(mesh => { if (mesh.isMesh) records.push({ mesh, geometry: mesh.geometry, material: mesh.material, attributes: { ...mesh.geometry.attributes }, index: mesh.geometry.index,
    arrays: [...Object.entries(mesh.geometry.attributes), ['index', mesh.geometry.index]].map(([name, a]) => ({ name, attribute: a, array: a.array, hash: hash(a.array) })), bounds: JSON.stringify([mesh.geometry.boundingBox, mesh.geometry.boundingSphere]) }); });
  return records;
}
function unchanged(records, restored) {
  for (const old of records) {
    assert.equal(old.mesh.material, old.material); assert.deepEqual(old.geometry.attributes, old.attributes); assert.equal(old.geometry.index, old.index);
    assert.equal(JSON.stringify([old.geometry.boundingBox, old.geometry.boundingSphere]), old.bounds);
    if (restored || old.mesh.name === 'continuous-face') assert.equal(old.mesh.geometry, old.geometry);
    for (const saved of old.arrays) { assert.equal(saved.attribute.array, saved.array); assert.equal(hash(saved.array), saved.hash); }
  }
}
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], sub = (a, b) => a.map((v, i) => v - b[i]);

// Finite differences test the frame and relief derivatives separately. The
// accepted grid/UV correspondence is checked against the actual source above.
let maximumFrameDerivativeError = 0, maximumReliefDerivativeError = 0;
for (const upper of [true, false]) for (let ix = 0; ix < 27; ix++) for (let iv = 0; iv < 17; iv++) {
  const x = -.229 + ix / 26 * .458, v = .003 + iv / 16 * .343, e = 2e-7, a = new Float64Array(5), b = new Float64Array(5), sample = new Float64Array(5);
  sampleLipFrame130(x, v, upper, sample);
  sampleLipFrame130(x + e, v, upper, a); sampleLipFrame130(x - e, v, upper, b); maximumFrameDerivativeError = Math.max(maximumFrameDerivativeError, Math.abs((a[1] - b[1]) / (2 * e) - sample[2]));
  sampleLipFrame130(x, v + e, upper, a); sampleLipFrame130(x, v - e, upper, b); maximumFrameDerivativeError = Math.max(maximumFrameDerivativeError, Math.abs((a[1] - b[1]) / (2 * e) - sample[3]));
  sampleLipRelief130(x, v, 1, sample);
  sampleLipRelief130(x + e, v, 1, a); sampleLipRelief130(x - e, v, 1, b); maximumReliefDerivativeError = Math.max(maximumReliefDerivativeError, Math.abs((a[0] - b[0]) / (2 * e) - sample[1]));
  sampleLipRelief130(x, v + e, 1, a); sampleLipRelief130(x, v - e, 1, b); maximumReliefDerivativeError = Math.max(maximumReliefDerivativeError, Math.abs((a[0] - b[0]) / (2 * e) - sample[2]));
}
assert(maximumFrameDerivativeError < 1e-7); assert(maximumReliefDerivativeError < 1e-8);
const profileBounds = { maximumPositiveDisplacement: 0, maximumDepthReduction: 0, minimumRepairedSlope: Infinity, maximumRepairedSlope: 0, fixedBorderDerivativeError: 0 };
for (let i = 0; i <= 1400; i++) {
  const v = spec.borderFraction * i / 1400, value = new Float64Array(4); sampleLipRelief130(0, v, 1, value);
  const sourceSlope = .144 * v * (1 - v) + .022 * Math.PI * Math.cos(Math.PI * v), derivative = sourceSlope + value[2];
  profileBounds.maximumPositiveDisplacement = Math.max(profileBounds.maximumPositiveDisplacement, value[0]);
  profileBounds.maximumDepthReduction = Math.max(profileBounds.maximumDepthReduction, -value[0]);
  profileBounds.minimumRepairedSlope = Math.min(profileBounds.minimumRepairedSlope, derivative); profileBounds.maximumRepairedSlope = Math.max(profileBounds.maximumRepairedSlope, derivative);
  if (i === 0) profileBounds.fixedBorderDerivativeError = Math.abs(derivative);
}
assert(profileBounds.maximumPositiveDisplacement < 1e-12 && profileBounds.minimumRepairedSlope >= -1e-12 && profileBounds.fixedBorderDerivativeError < 1e-12,
  'The replacement relief must stay inward, rise monotonically and depart tangentially from the fixed border.');
const zero = { isObject3D: true, traverse() { throw new Error('zero traversed'); }, updateWorldMatrix() { throw new Error('zero allocated matrices'); } };
assert.equal(applyMouthContinuity130(zero), applyMouthContinuity130(zero, { strength: 0 }));

const cases = [], oblique = mul(T(.08, -.04, .11), new Matrix4([1.23, .07, .02, 0, .13, .84, .05, 0, .08, -.04, 1.12, 0, 0, 0, 0, 1]));
for (const [strength, frameName, frame] of [[0, 'aligned', I()], [.5, 'aligned', I()], [1, 'aligned', I()], [1, 'oblique-nonuniform', oblique]]) {
  const head = fixture(frame), records = snapshot(head), sourceBuffers = new Set(records.flatMap(old => old.arrays.map(a => a.array.buffer))); disposed = [];
  const metrics = applyMouthContinuity130(head, { strength }), bytes = metrics.privateAttributeBytes;
  unchanged(records, !strength);
  let exactProtectedValues = 0, minimumTriangleNormalDot = 1, minimumAreaRatio = 1, newDegenerateTriangles = 0, maximumHeadXYChange = 0, protectedCoreNormals = 0,
    projectedOrientationFlips = 0, maximumProjectedAreaRelativeError = 0;
  const privateGeometries = [];
  for (const old of records) {
    if (!spec.targets.includes(old.mesh.name) || !strength) continue;
    const g = old.mesh.geometry, p = g.getAttribute('position'), n = g.getAttribute('normal'), oldP = old.geometry.getAttribute('position'), oldN = old.geometry.getAttribute('normal');
    privateGeometries.push(g); assert.notEqual(g, old.geometry);
    for (const [name, a] of [...Object.entries(g.attributes), ['index', g.index]]) {
      assert(!sourceBuffers.has(a.array.buffer), 'Every temporary attribute/index must be privately owned.');
      if (!['position', 'normal'].includes(name)) { assert.equal(hash(a.array), old.arrays.find(saved => saved.name === name).hash); exactProtectedValues += a.array.length; }
    }
    for (let i = 0; i < p.count; i++) {
      const col = i % 101, row = Math.floor(i / 101), x = -spec.halfWidth + 2 * spec.halfWidth * col / 100, protectedValue = row / 16 >= spec.borderFraction || Math.abs(x) >= spec.cornerGate[1];
      const source = point(frame, [oldP.getX(i), oldP.getY(i), oldP.getZ(i)]), active = point(frame, [p.getX(i), p.getY(i), p.getZ(i)]);
      maximumHeadXYChange = Math.max(maximumHeadXYChange, Math.abs(source[0] - active[0]), Math.abs(source[1] - active[1]));
      if (frameName === 'aligned') { assert.equal(p.getX(i), oldP.getX(i)); assert.equal(p.getY(i), oldP.getY(i)); }
      if (protectedValue || row === 0) assert.deepEqual([p.getX(i), p.getY(i), p.getZ(i)], [oldP.getX(i), oldP.getY(i), oldP.getZ(i)], 'Core, corners and original border positions must remain exact.');
      if (protectedValue) { assert.deepEqual([n.getX(i), n.getY(i), n.getZ(i)], [oldN.getX(i), oldN.getY(i), oldN.getZ(i)]); protectedCoreNormals++; }
    }
    for (let k = 0; k < g.index.count; k += 3) {
      const ids = [g.index.getX(k), g.index.getX(k + 1), g.index.getX(k + 2)], ps = ids.map(i => point(frame, [p.getX(i), p.getY(i), p.getZ(i)])), os = ids.map(i => point(frame, [oldP.getX(i), oldP.getY(i), oldP.getZ(i)]));
      const a = cross(sub(os[1], os[0]), sub(os[2], os[0])), b = cross(sub(ps[1], ps[0]), sub(ps[2], ps[0])), la = Math.hypot(...a), lb = Math.hypot(...b);
      if (la < 1e-13) continue; if (lb < 1e-13) newDegenerateTriangles++;
      minimumAreaRatio = Math.min(minimumAreaRatio, lb / la); minimumTriangleNormalDot = Math.min(minimumTriangleNormalDot, a.reduce((sum, value, axis) => sum + value * b[axis], 0) / (la * lb));
      if (Math.abs(a[2]) > 1e-12) { if (a[2] * b[2] <= 0) projectedOrientationFlips++; maximumProjectedAreaRelativeError = Math.max(maximumProjectedAreaRelativeError, Math.abs(b[2] / a[2] - 1)); }
    }
  }
  // Removing the old steep border necessarily rotates some triangle normals
  // by more than36 degrees. The meaningful nonfolding invariant is unchanged
  // head-XY orientation under a Z-only shear, not an arbitrary cosine>.8.
  assert.equal(newDegenerateTriangles, 0); assert.equal(projectedOrientationFlips, 0); assert(minimumTriangleNormalDot > 0); assert(maximumHeadXYChange < 6e-7);
  if (strength) {
    assert.equal(applyMouthContinuity130(head, { strength }), metrics); assert.throws(() => applyMouthContinuity130(head, { strength: strength / 3 }), /fresh head/);
    const result = releaseMouthContinuity130(head); assert.equal(result.privateGeometriesDisposed, 2); assert.equal(result.privateAttributeBytesReleased, bytes);
    assert.equal(disposed.length, 2); assert(disposed.every(event => privateGeometries.includes(event.geometry)));
    for (const event of disposed) for (const a of [...Object.values(event.attributes), event.index]) assert(!sourceBuffers.has(a.array.buffer), 'Cached-attribute disposal must never reach original buffers.');
  }
  unchanged(records, true);
  cases.push({ strength, frame: frameName, metrics, exactProtectedValues, protectedCoreNormals, minimumTriangleNormalDot, minimumAreaRatio, newDegenerateTriangles,
    projectedOrientationFlips, maximumProjectedAreaRelativeError, maximumHeadXYChange,
    sourceImmutable: true, sourceRestored: true, privateOnlyDisposal: true });
}

// Only the concrete input/frame risks need rejection checks. Both fail before
// source replacement; no broad synthetic renderer or texture suite is added.
const failedChecks = [];
for (const kind of ['wrong-lip-preparation', 'drifted-uv', 'wrong-triangle-order']) {
  const head = fixture(), lip = head.children.find(mesh => mesh.name === 'lower-lip');
  if (kind === 'wrong-lip-preparation') head.userData.lipThicknessRefinement.strength = .08;
  if (kind === 'drifted-uv') lip.geometry.getAttribute('uv').setX(100, .51);
  if (kind === 'wrong-triangle-order') lip.geometry.index.setX(3, 37);
  const records = snapshot(head); assert.throws(() => applyMouthContinuity130(head, { strength: 1 })); unchanged(records, true); failedChecks.push(kind);
}
{
  const head = fixture(), lower = head.children.find(mesh => mesh.name === 'lower-lip'), records = snapshot(head);
  const sourceBuffers = new Set(records.flatMap(record => record.arrays.map(saved => saved.array.buffer)));
  lower.geometry.getAttribute('position').clone = () => { throw new Error('130 simulated second-target clone failure'); }; disposed = [];
  assert.throws(() => applyMouthContinuity130(head, { strength: 1 }), /second-target clone failure/); unchanged(records, true);
  assert.equal(disposed.length, 2, 'Both the completed first clone and incomplete second clone must be released.');
  for (const event of disposed) for (const a of [...Object.values(event.attributes), event.index].filter(Boolean)) assert(!sourceBuffers.has(a.array.buffer));
  failedChecks.push('late-second-target-clone-failure');
}

const cpu = process.cpuUsage(cpuStarted), report = { native: false, sourceHarness: true, candidate: 130, scoreUnchanged: 77,
  scope: 'Actual source face topology and two source makeMouth grids, accepted portraitY/.94/.025/.06/balance chain. Harness omits the already-isolated crease and source RGB grain; native preview audits actual materials/atlas. No rendered art gain is claimed.',
  derivativeChecks: { maximumFrameDerivativeError, maximumReliefDerivativeError }, profileBounds, zeroNoTraversalOrMatrices: true, failedChecks, cases,
  cost: { wallMs: performance.now() - started, cpuMs: (cpu.user + cpu.system) / 1000, peakRSSMiB: process.resourceUsage().maxRSS / 1024 },
  files: Object.fromEntries(['src/face.js', 'src/lip-refinement.js', 'src/portrait-proportions.js', 'src/portrait-balance.js', 'review/mouth-continuity-candidate130.js', 'review/mouth-continuity130-audit.mjs'].map(file => { const content = fs.readFileSync(file); return [file, { bytes: content.length, sha256: sha(content) }]; })) };
fs.writeFileSync('review/mouth-continuity130-source-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ candidate: 130, status: 'Source geometry checks passed; native art pending', derivatives: report.derivativeChecks, cost: report.cost,
  cases: cases.map(row => ({ strength: row.strength, frame: row.frame, privateBytes: row.metrics.privateAttributeBytes, changedPositions: row.metrics.changedPositions,
    depthReduction: row.metrics.maximumDepthReduction, frameResidual: row.metrics.frame?.maximumXYResidual, minimumClearance: row.metrics.minimumRepairedClearance,
    authoredResidualDegrees: row.metrics.maximumAuthoredResidualDegrees, boundaryNormalError: row.metrics.maximumInteriorBoundaryNormalErrorDegrees, minimumTriangleNormalDot: row.minimumTriangleNormalDot })) }));
