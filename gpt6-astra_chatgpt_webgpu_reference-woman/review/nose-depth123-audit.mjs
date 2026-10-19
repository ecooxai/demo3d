import fs from 'node:fs';
import assert from 'node:assert/strict';
import { applyNoseDepth123, releaseNoseDepth123, sampleNoseDepth123, NOSE_DEPTH123_SPEC as spec } from './nose-depth-candidate123.js';
import { auditNoseGeometry123 } from './nose-depth123-geometry-audit.js';
import { THREE, Attr, Geometry, Matrix4, I, mul, T, RY, RZ, point, object, attach, hash, read, matrixCount, sha } from './torso-depth110-harness.mjs';

// Geometry-only local source audit. The real face/naris formulas and accepted
// deformation functions are executed in the existing minimal source harness.
// No atlas, image sampling, browser, native Three or rendered verification here.
THREE.Color.prototype.offsetHSL = function () { return this; };
THREE.MeshStandardMaterial = THREE.MeshPhysicalMaterial;
Geometry.prototype.deleteAttribute = function (key) { delete this.attributes[key]; return this; };
Geometry.prototype.addGroup = function (start, count, materialIndex = 0) { (this.groups ||= []).push({ start, count, materialIndex }); };
Geometry.prototype.setDrawRange = function (start, count) { this.drawRange = { start, count }; };
Geometry.prototype.computeBoundingBox = function () {
  const p = this.getAttribute('position'), min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (let i = 0; i < p.count; i++) for (const [k, value] of [['x', p.getX(i)], ['y', p.getY(i)], ['z', p.getZ(i)]]) { min[k] = Math.min(min[k], value); max[k] = Math.max(max[k], value); }
  this.boundingBox = { min, max };
};
Geometry.prototype.computeBoundingSphere = function () {
  if (!this.boundingBox) this.computeBoundingBox();
  const center = Object.fromEntries(['x', 'y', 'z'].map(k => [k, (this.boundingBox.min[k] + this.boundingBox.max[k]) / 2]));
  const p = this.getAttribute('position'); let radius = 0;
  for (let i = 0; i < p.count; i++) radius = Math.max(radius, Math.hypot(p.getX(i) - center.x, p.getY(i) - center.y, p.getZ(i) - center.z));
  this.boundingSphere = { center, radius };
};
let disposed = [];
Geometry.prototype.dispose = function () { disposed.push({ geometry: this, attributes: { ...this.attributes }, index: this.index }); };

const face = new Function('THREE', read('src/face.js') + '\nreturn {profile,faceZ,orbitalRadius,portraitY,makeNostrils,refineEarBed};')(THREE);
const lowerFaceWarp = new Function('Matrix4', read('src/portrait-proportions.js') + '\nreturn lowerFaceWarp;')(Matrix4);
const applyCheek = new Function('Matrix4', read('src/face-refinement.js') + '\nreturn applyLowerCheekTaper;')(Matrix4);
const lipSample = new Function('Matrix4', read('src/lip-refinement.js') + '\nreturn lipSample;')(Matrix4);
const applyBalance = new Function('Matrix4', read('src/portrait-balance.js') + '\nreturn applyPortraitBalance;')(Matrix4);
const started = performance.now(), cpuStart = process.cpuUsage();

function primaryFace() {
  const pos = [], idx = [], ny = 290, nt = 380;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nt; i++) {
    const y = -1.18 + j / ny * 2.72, a = -Math.PI + i / nt * 2 * Math.PI, [w, , rear] = face.profile(y), x = w * Math.sin(a), z = Math.cos(a) >= 0 ? face.faceZ(x, y) : rear * Math.cos(a);
    pos.push(x, y, z);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nt; i++) {
    const a = j * (nt + 1) + i, b = a + nt + 1, x = (pos[a * 3] + pos[(a + 1) * 3] + pos[b * 3] + pos[(b + 1) * 3]) / 4, y = (pos[a * 3 + 1] + pos[b * 3 + 1]) / 2;
    if (!(pos[a * 3 + 2] > 0 && [-1, 1].some(s => face.orbitalRadius(x, y, s) < 1.20))) idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const geometry = new Geometry().setAttribute('position', new Attr(pos, 3)).setIndex(idx); geometry.computeVertexNormals();
  const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), e = .00012;
  for (let i = 0; i < p.count; i++) if (p.getZ(i) > 0 && Math.abs(p.getX(i)) < .73 && p.getY(i) > -.03 && p.getY(i) < .64) {
    const x = p.getX(i), y = p.getY(i), nx = -(face.faceZ(x + e, y) - face.faceZ(x - e, y)) / (2 * e), ny = -(face.faceZ(x, y + e) - face.faceZ(x, y - e)) / (2 * e), length = Math.hypot(nx, ny, 1);
    n.setXYZ(i, nx / length, ny / length, 1 / length);
  }
  geometry.setAttribute('color', new Attr(new Float32Array(p.count * 3).fill(.5), 3));
  geometry.addGroup(0, geometry.index.count, 0); geometry.setDrawRange(0, Infinity);
  return geometry;
}

function initialWarpAndUV(geometry) {
  const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), derivative = (face.portraitY(y + .0001) - face.portraitY(y - .0001)) / .0002;
    p.setY(i, face.portraitY(y));
    const x = n.getX(i), yy = n.getY(i) / Math.max(.3, derivative), z = n.getZ(i), length = Math.hypot(x, yy, z);
    if (length) n.setXYZ(i, x / length, yy / length, z / length);
  }
  if (p.count > 100000) face.refineEarBed(geometry);
  for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + 1) / 2; uv[i * 2 + 1] = (p.getY(i) + 1.25) / 2.85; }
  geometry.setAttribute('uv', new Attr(uv, 2));
  for (let i = 0; i < p.count; i++) {
    const warp = lowerFaceWarp(p.getY(i)), x = n.getX(i), y = n.getY(i) / (1 + warp.derivative), z = n.getZ(i), length = Math.hypot(x, y, z);
    p.setY(i, p.getY(i) + warp.displacement); if (length) n.setXYZ(i, x / length, y / length, z / length);
  }
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return geometry;
}

const sourceHead = object('anatomical-head'); sourceHead.userData = { portraitProportions: { factor: .94 } };
const sourceFace = attach(sourceHead, 'continuous-face', initialWarpAndUV(primaryFace()), I());
for (const mesh of face.makeNostrils().children) attach(sourceHead, mesh.name, initialWarpAndUV(mesh.geometry), I(), mesh.material);
applyCheek(sourceHead, { strength: .025 });
const lfield = new Float64Array(4), lprofile = new Float64Array(6), faceP = sourceFace.geometry.getAttribute('position'), faceN = sourceFace.geometry.getAttribute('normal'), faceUV = sourceFace.geometry.getAttribute('uv');
let nasalHaloLipAffected = 0;
for (let i = 0; i < faceP.count; i++) {
  const x = faceP.getX(i), y = faceP.getY(i), z = faceP.getZ(i); lipSample(x, y, z, .06, lfield, lprofile);
  const cx = 2 * faceUV.getX(i) - 1, cy = 2.85 * faceUV.getY(i) - 1.25;
  if (Math.hypot(cx / .24, (cy + .43) / .22) <= spec.halo && lfield[0] !== 0) nasalHaloLipAffected++;
  if (!lfield[0]) continue;
  const nx = faceN.getX(i), ny = faceN.getY(i), nz = faceN.getZ(i), projection = ny / (1 + lfield[2]);
  const a = nx - lfield[1] * projection, b = ny - lfield[2] * projection, c = nz - lfield[3] * projection, length = Math.hypot(a, b, c);
  faceP.setY(i, y + lfield[0]); if (length) faceN.setXYZ(i, a / length, b / length, c / length);
}
assert.equal(nasalHaloLipAffected, 0, 'The existing lip warp must actually be identity throughout123 support+halo.');
const headPose = mul(T(.26, 2.95, 0), mul(RY(.16), RZ(-.17))), model = object('model'); model.add(sourceHead);
sourceHead.matrixWorld = headPose; sourceHead.traverse(mesh => { if (mesh.isMesh) mesh.matrixWorld = headPose; });
applyBalance(model, { shiftX: -.24 });
const sourceTargets = sourceHead.children.map(mesh => ({ name: mesh.name, geometry: mesh.geometry, material: mesh.material }));

function cloneForFrame(geometry, frame) {
  const g = geometry.clone(), inverse = frame.clone().invert(), m = frame.elements, p = g.getAttribute('position'), n = g.getAttribute('normal');
  g.groups = (geometry.groups || []).map(v => ({ ...v })); g.drawRange = { ...(geometry.drawRange || { start: 0, count: Infinity }) };
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, ...point(inverse, [p.getX(i), p.getY(i), p.getZ(i)]));
    const x = n.getX(i), y = n.getY(i), z = n.getZ(i), a = m[0] * x + m[1] * y + m[2] * z, b = m[4] * x + m[5] * y + m[6] * z, c = m[8] * x + m[9] * y + m[10] * z, length = Math.hypot(a, b, c);
    if (length) n.setXYZ(i, a / length, b / length, c / length);
  }
  g.computeBoundingBox(); g.computeBoundingSphere(); return g;
}
function fixture(frame = I()) {
  const head = object('anatomical-head', headPose); head.userData = { portraitProportions: { factor: .94 } };
  for (const part of sourceTargets) attach(head, part.name, cloneForFrame(part.geometry, frame), mul(headPose, frame), part.material);
  const originals = head.children.map(mesh => ({ mesh, geometry: mesh.geometry, material: mesh.material,
    hashes: Object.fromEntries(Object.entries(mesh.geometry.attributes).map(([name, attribute]) => [name, hash(attribute.array)])), indexHash: hash(mesh.geometry.index.array) }));
  return { head, originals };
}
function immutable(originals) {
  for (const r of originals) {
    assert.equal(r.mesh.material, r.material); assert.equal(hash(r.geometry.index.array), r.indexHash);
    for (const [name, fingerprint] of Object.entries(r.hashes)) assert.equal(hash(r.geometry.getAttribute(name).array), fingerprint);
  }
}
const zeroHead = { isObject3D: true, traverse() { throw Error('zero traversal'); }, updateWorldMatrix() { throw Error('zero matrix update'); } }, beforeAlloc = matrixCount();
assert.equal(applyNoseDepth123(zeroHead), applyNoseDepth123(zeroHead, { depth: 0 })); assert.equal(beforeAlloc, matrixCount());
assert(Object.isFrozen(applyNoseDepth123(zeroHead))); assert.equal(releaseNoseDepth123(zeroHead).released, false);

const frames = [I(), new Matrix4([1.12, .09, .03, 0, .12, .83, -.05, 0, .06, .08, 1.24, 0, .04, -.03, .02, 1]), new Matrix4([-1.14, .07, .02, 0, .1, 1.12, .04, 0, .03, .11, .81, 0, .04, -.03, .02, 1])];
const cases = [];
for (const [depth, frameIndex] of [[0, 0], [.012, 0], [.024, 0], [.024, 1], [.024, 2]]) {
  const { head, originals } = fixture(frames[frameIndex]); disposed = [];
  const metrics = applyNoseDepth123(head, { depth }), geometry = auditNoseGeometry123(head, originals, depth);
  immutable(originals); assert.equal(applyNoseDepth123(head, { depth }), metrics);
  if (depth) { assert.throws(() => applyNoseDepth123(head, { depth: 0 }), /fresh head/); originals.forEach(r => assert.notEqual(r.mesh.geometry, r.geometry)); }
  else originals.forEach(r => assert.equal(r.mesh.geometry, r.geometry));
  if (frameIndex === 0) assert.equal(geometry.localXYChangedValues, 0);
  const cleanup = releaseNoseDepth123(head); immutable(originals); originals.forEach(r => assert.equal(r.mesh.geometry, r.geometry));
  assert.equal(cleanup.privateGeometriesDisposed, depth ? 3 : 0); assert.equal(disposed.length, depth ? 3 : 0);
  for (const record of disposed) for (const original of originals) {
    assert.notEqual(record.index, original.geometry.index);
    for (const attribute of Object.values(record.attributes)) for (const source of Object.values(original.geometry.attributes)) { assert.notEqual(attribute, source); assert.notEqual(attribute.array, source.array); }
  }
  assert.equal(releaseNoseDepth123(head).released, false);
  cases.push({ depth, frameIndex, metrics, geometry, cleanup });
}

// Actual-data guard and an allocation failure must leave all original geometry
// references/bytes intact. No native behavior is inferred from these fixtures.
let atomicFailures = 0;
for (const failure of ['wrong-factor', 'missing-naris', 'canonical-drift', 'nonfinite-normal', 'late-clone']) {
  const { head, originals } = fixture();
  if (failure === 'wrong-factor') head.userData.portraitProportions.factor = .92;
  if (failure === 'missing-naris') head.children[2].name = 'missing';
  if (failure === 'canonical-drift') head.children[2].geometry.getAttribute('position').array[0] += .001;
  if (failure === 'nonfinite-normal') head.children[2].geometry.getAttribute('normal').array[0] = NaN;
  if (failure === 'late-clone') head.children[2].geometry.getAttribute('normal').clone = () => { throw Error('intentional clone failure'); };
  const before = originals.map(r => Object.fromEntries(Object.entries(r.geometry.attributes).map(([k, a]) => [k, hash(a.array)])));
  assert.throws(() => applyNoseDepth123(head, { depth: .024 }));
  originals.forEach((r, i) => { assert.equal(r.mesh.geometry, r.geometry); for (const [k, fingerprint] of Object.entries(before[i])) assert.equal(hash(r.geometry.getAttribute(k).array), fingerprint); }); atomicFailures++;
}

// Analytic field derivatives and the gate's worst Jacobian are tested away
// from mesh vertices as well. These are kernel checks, distinct from the real
// source-triangle finite-difference geometry checks above.
const sample = new Float64Array(4), plus = new Float64Array(4), minus = new Float64Array(4);
let derivativeError = 0, minimumGateJacobian = 1;
for (let ix = -12; ix <= 12; ix++) for (let iy = -12; iy <= 12; iy++) for (const z of [-.4, .25, .30, .35, .40, .45, .8]) {
  const q = [ix / 12 * .25, -.43 + iy / 12 * .23, z]; sampleNoseDepth123(...q, .024, sample); minimumGateJacobian = Math.min(minimumGateJacobian, 1 + sample[3]);
  for (let axis = 0; axis < 3; axis++) { const a = q.slice(), b = q.slice(), e = 1e-6; a[axis] += e; b[axis] -= e;
    sampleNoseDepth123(...a, .024, plus); sampleNoseDepth123(...b, .024, minus); derivativeError = Math.max(derivativeError, Math.abs((plus[0] - minus[0]) / (2 * e) - sample[axis + 1])); }
}
assert(derivativeError < 1e-8); assert(Math.abs(minimumGateJacobian - .775) < 1e-12);
const cpu = process.cpuUsage(cpuStart), files = ['review/nose-depth-candidate123.js', 'review/nose-depth123-geometry-audit.js', 'review/nose-depth123-audit.mjs'];
const result = { candidate: 123, scoreUnchanged: 76, status: 'Source-only checks passed; native geometry and art pending', native: false,
  files: Object.fromEntries(files.map(file => [file, { bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) }])),
  sourceInputs: Object.fromEntries(['src/face.js', 'src/reference-skin.js', 'src/portrait-proportions.js', 'src/face-refinement.js', 'src/lip-refinement.js', 'src/portrait-balance.js'].map(file => [file, sha(fs.readFileSync(file))])),
  trueZeroBeforeMatrixAllocationOrTraversal: true, sourceBytesImmutableWhileActive: true, sourceReferencesRestoredExactly: true, privateOnlyDisposal: true,
  nasalHaloLipAffected, atomicFailures, fieldMaximumDerivativeError: derivativeError, minimumGateJacobian, cases,
  resources: { wallMs: performance.now() - started, cpuMs: (cpu.user + cpu.system) / 1000, peakRssMiB: process.resourceUsage().maxRSS / 1024 },
  limitations: ['The source harness reproduces the current face and both naris construction, Float32 positions/UVs and preceding geometric fields. It is not native Three.',
    'Local colors are test buffers or procedural source color with offsetHSL stubbed; the native test hashes the real accepted atlas, materials and all other scene geometry.',
    'The inverse-transpose check preserves authored shading normals; it does not claim they equal triangulation normals. A separate true geometric finite difference is reported.',
    'No photograph profile is available. The depth reduction is an artistic hypothesis, and a technical pass does not establish likeness gain.'] };
fs.writeFileSync('review/nose-depth123-source-audit.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ candidate: 123, status: result.status, fieldMaximumDerivativeError: derivativeError, minimumGateJacobian, atomicFailures,
  cases: cases.map(c => ({ depth: c.depth, frameIndex: c.frameIndex, changedVertices: c.geometry.changedVertices, frameResidual: c.metrics.frame?.maximumResidual,
    geometricAngleDegrees: c.geometry.geometricFiniteDifference.maximumAngleDegrees, minimumOrientationDot: c.geometry.updatedTriangleOrientation.minimumDot,
    maximumNarisGapChange: c.geometry.narisAttachment.maximumGapChangeZ, privateBytes: c.metrics.privateAttributeBytes, cleanup: c.cleanup })), resources: result.resources }));
