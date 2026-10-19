import fs from 'node:fs';
import assert from 'node:assert/strict';
import { applyMouthContinuity130, releaseMouthContinuity130, sampleLipFrame130, sampleLipRelief130 } from '../src/lip-continuity.js';
import { THREE, Attr, Geometry, Matrix4, I, mul, T, RY, RZ, point, object, attach, read, hash, sha } from './torso-depth110-harness.mjs';

// Reuse only the accepted130 source fixture construction. It executes actual
// makeMouth code and accepted geometry transforms; its old audit loop is not
// rerun. Native Three/material/atlas/render validation remains a separate test.
const previous = fs.readFileSync('review/mouth-continuity130-audit.mjs', 'utf8');
const begin = previous.indexOf('THREE.Color.prototype.offsetHSL'), end = previous.indexOf('function snapshot(head)');
assert(begin >= 0 && end > begin);
const factory = new Function('THREE', 'Attr', 'Geometry', 'Matrix4', 'I', 'mul', 'T', 'RY', 'RZ', 'point', 'object', 'attach', 'read', 'assert',
  previous.slice(begin, end) + '\nreturn {fixture,face,clearDisposals:()=>{disposed=[];},disposals:()=>disposed};');
const source = factory(THREE, Attr, Geometry, Matrix4, I, mul, T, RY, RZ, point, object, attach, read, assert);
const helperText = fs.readFileSync('review/upper-lip-relief-candidate140.js', 'utf8');
const api = new Function('faceZ', 'sampleLipFrame130', 'sampleLipRelief130', read('review/upper-lip-relief-candidate140.js')
  + '\nreturn {applyUpperLipRelief140,releaseUpperLipRelief140,sampleUpperLipRelief140,UPPER_LIP_RELIEF140_SPEC,indexFace};')(source.face.faceZ, sampleLipFrame130, sampleLipRelief130);
const { applyUpperLipRelief140, releaseUpperLipRelief140, sampleUpperLipRelief140, UPPER_LIP_RELIEF140_SPEC: spec } = api;
const started = performance.now(), cpuStarted = process.cpuUsage();
const unit = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const angle = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(unit(a), unit(b))))) * 180 / Math.PI;
const xyz = (a, i) => [a.getX(i), a.getY(i), a.getZ(i)];
const sample = (x, v) => sampleUpperLipRelief140(x, v, new Float64Array(3), new Float64Array(4));

const zeroHead = { isObject3D: true, traverse() { throw new Error('140 zero traversed'); }, updateWorldMatrix() { throw new Error('140 zero built matrices'); } };
assert.equal(applyUpperLipRelief140(zeroHead), applyUpperLipRelief140(zeroHead, { strength: 0 }));
assert.throws(() => applyUpperLipRelief140(zeroHead, { strength: .5 }), /single approved on\/off/);
let maximumDerivativeError = 0, maximumInward = 0, maximumOutward = 0, maximumSupportJetError = 0;
for (let i = 0; i <= 10000; i++) { const v = spec.endFraction * i / 10000, d = sample(0, v)[0]; maximumInward = Math.max(maximumInward, -d); maximumOutward = Math.max(maximumOutward, d); }
for (const x of [-.234, -.217, -.18, -.10, 0, .10, .18, .217, .234]) for (const v of [.007, .061, .133, .245, .349, .351, .47, .62, .81, .867]) {
  const s = sample(x, v), e = 2e-7;
  maximumDerivativeError = Math.max(maximumDerivativeError, Math.abs((sample(x + e, v)[0] - sample(x - e, v)[0]) / (2 * e) - s[1]),
    Math.abs((sample(x, v + e)[0] - sample(x, v - e)[0]) / (2 * e) - s[2]));
}
for (const x of [-.23, -.18, 0, .18, .23]) for (const v of [0, .875, 1]) assert.deepEqual(Array.from(sample(x, v)), [0, 0, 0]);
for (const x of [-.25, -.241, -.235, .235, .241, .25]) for (const v of [.1, .3, .6]) assert.deepEqual(Array.from(sample(x, v)), [0, 0, 0]);
for (const v of [.35]) {
  const e = 1e-7, a = sample(0, v - e), b = sample(0, v + e);
  maximumSupportJetError = Math.max(maximumSupportJetError, Math.abs(a[0] - b[0]), Math.abs(a[2] - b[2]));
}
assert(maximumDerivativeError < 2e-9); assert(maximumSupportJetError < 2e-7); assert(maximumOutward === 0 && maximumInward < .006904);

// Validate complete overlap clipping on a small known planar geometry, not
// merely by comparing the runtime routine with itself on the portrait.
function flatRecord(positions, indices) {
  const g = new Geometry().setAttribute('position', new Attr(positions.flat(), 3)).setAttribute('uv', new Attr(positions.flatMap(p => [(p[0] + 1) / 2, (p[1] + 1.25) / 2.85]), 2)).setIndex(indices);
  return { original: g, p: g.getAttribute('position'), uv: g.getAttribute('uv'), h: I().elements };
}
const flatFace = flatRecord([[-1, -1, .5], [1, -1, .5], [1, 1, .5], [-1, 1, .5]], [0, 1, 2, 0, 2, 3]);
const testTriangle = [[-.4, -.3, .601], [.5, -.2, .703], [.2, .6, .809]], flatLip = flatRecord(testTriangle, [0, 1, 2]);
const planeResult = api.indexFace(flatFace, flatLip).clearance(testTriangle);
assert(Math.abs(planeResult.minimum - .101) < 1e-12); assert(Math.abs(planeResult.coverage - 1) < 1e-12); assert(planeResult.pieces === 2);

const invalid = source.fixture();
assert.throws(() => applyUpperLipRelief140(invalid, { strength: 1 }), /accepted full130 lip/);
const cases = [];
const oblique = mul(T(.08, -.04, .11), new Matrix4([1.23, .07, .02, 0, .13, .84, .05, 0, .08, -.04, 1.12, 0, 0, 0, 0, 1]));
for (const [label, frame] of [['accepted-frame', I()], ['oblique-nonuniform-frame', oblique]]) {
  const head = source.fixture(frame); applyMouthContinuity130(head, { strength: 1 });
  const originals = head.children.map(mesh => ({ mesh, geometry: mesh.geometry, material: mesh.material, userData: JSON.stringify(mesh.geometry.userData),
    bounds: JSON.stringify([mesh.geometry.boundingBox, mesh.geometry.boundingSphere]), attributes: { ...mesh.geometry.attributes }, index: mesh.geometry.index,
    arrays: [...Object.entries(mesh.geometry.attributes), ['index', mesh.geometry.index]].map(([name, a]) => ({ name, a, array: a.array, hash: hash(a.array), version: a.version })) }));
  const old = originals.find(r => r.mesh.name === 'upper-lip'), sourceBuffers = new Set(originals.flatMap(r => r.arrays.map(a => a.array.buffer)));
  source.clearDisposals(); const metrics = applyUpperLipRelief140(head, { strength: 1 }), active = old.mesh.geometry;
  assert.equal(applyUpperLipRelief140(head, { strength: 1 }), metrics); assert.throws(() => applyUpperLipRelief140(head, { strength: 0 }), /release or a fresh head/);
  assert.notEqual(active, old.geometry); assert.equal(metrics.privateGeometryCount, 1); assert.equal(metrics.projectedOrientationFlips, 0);
  assert(metrics.minimumRepairedClearance > .0009 && metrics.minimumFaceProjectionCoverage > .999999);
  const sourceExact = restored => {
    for (const r of originals) {
      assert.equal(r.mesh.material, r.material); assert.deepEqual(r.geometry.attributes, r.attributes); assert.equal(r.geometry.index, r.index);
      assert.equal(JSON.stringify(r.geometry.userData), r.userData); assert.equal(JSON.stringify([r.geometry.boundingBox, r.geometry.boundingSphere]), r.bounds);
      if (restored || r.mesh.name !== 'upper-lip') assert.equal(r.mesh.geometry, r.geometry);
      for (const a of r.arrays) { assert.equal(a.a.array, a.array); assert.equal(a.a.version, a.version); assert.equal(hash(a.array), a.hash); }
    }
  };
  sourceExact(false);
  for (const [name, a] of [...Object.entries(active.attributes), ['index', active.index]]) {
    assert(!sourceBuffers.has(a.array.buffer), `140 private ${name} shares an original buffer.`);
    if (!['position', 'normal'].includes(name)) assert.equal(hash(a.array), old.arrays.find(r => r.name === name).hash);
  }
  const p = active.getAttribute('position'), n = active.getAttribute('normal'), bp = old.geometry.getAttribute('position'), bn = old.geometry.getAttribute('normal');
  let protectedVertices = 0, maximumXYError = 0, maximumDisplacementAgreement = 0;
  for (let row = 0; row <= 16; row++) for (let col = 0; col <= 100; col++) {
    const i = row * 101 + col, x = -.241 + .482 * col / 100, v = row / 16, fixed = row === 0 || row >= 14 || Math.abs(x) >= .235;
    if (fixed) { assert.deepEqual(xyz(p, i), xyz(bp, i)); assert.deepEqual(xyz(n, i), xyz(bn, i)); protectedVertices++; }
    if (label === 'accepted-frame') { assert.equal(p.getX(i), bp.getX(i)); assert.equal(p.getY(i), bp.getY(i)); }
    const a = point(frame, xyz(bp, i)), b = point(frame, xyz(p, i));
    maximumXYError = Math.max(maximumXYError, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
    maximumDisplacementAgreement = Math.max(maximumDisplacementAgreement, Math.abs((b[2] - a[2]) - sample(x, v)[0]));
  }
  assert(maximumXYError < 6e-7 && maximumDisplacementAgreement < 2e-7);

  // Independently finite-difference the spatial deformation after inverting
  // the actual accepted XY map. This does not identify UV derivatives with
  // posed XY derivatives or just restate the analytic rank-one formula.
  const back = frame.clone().invert(), offset = metrics.frame.commonOffset;
  const solveV = (x, y) => {
    let lo = 0, hi = 1; const out = new Float64Array(5);
    for (let k = 0; k < 54; k++) { const mid = (lo + hi) / 2; sampleLipFrame130(x, mid, true, out); if (out[1] > y) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  };
  const deform = local => {
    const h = point(frame, local), x = h[0] - offset[0], v = solveV(x, h[1] - offset[1]);
    h[2] += sample(x, v)[0]; return point(back, h);
  };
  let maximumFDNormalError = 0, maximumFDJacobianError = 0;
  for (const row of [1, 3, 5, 7, 9, 11, 13]) for (const col of [8, 24, 41, 57, 73, 92]) {
    const i = row * 101 + col, x = -.241 + .482 * col / 100, v = row / 16, f = new Float64Array(5); sampleLipFrame130(x, v, true, f);
    const hp = point(frame, xyz(bp, i)), center = point(back, [x + offset[0], f[1] + offset[1], hp[2]]), columns = [], e = 2e-6;
    for (let axis = 0; axis < 3; axis++) { const a = center.slice(), b = center.slice(); a[axis] += e; b[axis] -= e; const fa = deform(a), fb = deform(b); columns.push(fa.map((w, j) => (w - fb[j]) / (2 * e))); }
    const [a, b, c] = columns, cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const bc = cross(b, c), ca = cross(c, a), ab = cross(a, b), determinant = dot(a, bc), normal = xyz(bn, i);
    const expected = unit([0, 1, 2].map(axis => (bc[axis] * normal[0] + ca[axis] * normal[1] + ab[axis] * normal[2]) / determinant));
    maximumFDNormalError = Math.max(maximumFDNormalError, ...expected.map((w, axis) => Math.abs(w - xyz(n, i)[axis])));
    maximumFDJacobianError = Math.max(maximumFDJacobianError, Math.abs(determinant - 1));
  }
  assert(maximumFDNormalError < 2e-6); assert(maximumFDJacobianError < 2e-7);

  // Authored-normal agreement with finite triangle normals is reported as a
  // separate characteristic. The accepted130 outer weld is deliberately kept.
  const bg = old.geometry.clone(), ag = active.clone(); bg.computeVertexNormals(); ag.computeVertexNormals();
  let beforeAuthoredVsGeometricMax = 0, afterAuthoredVsGeometricMax = 0;
  for (let row = 0; row <= 16; row++) for (let col = 2; col <= 98; col++) {
    const i = row * 101 + col;
    beforeAuthoredVsGeometricMax = Math.max(beforeAuthoredVsGeometricMax, angle(xyz(bn, i), xyz(bg.getAttribute('normal'), i)));
    afterAuthoredVsGeometricMax = Math.max(afterAuthoredVsGeometricMax, angle(xyz(n, i), xyz(ag.getAttribute('normal'), i)));
  }
  const cleanup = releaseUpperLipRelief140(head); sourceExact(true);
  const disposals = source.disposals(); assert.equal(disposals.length, 1); assert.equal(disposals[0].geometry, active);
  for (const a of [...Object.values(disposals[0].attributes), disposals[0].index]) assert(!sourceBuffers.has(a.array.buffer));
  assert.deepEqual(releaseUpperLipRelief140(head), { released: false, privateGeometriesDisposed: 0, privateAttributeBytesReleased: 0 });
  cases.push({ frame: label, metrics, protectedVertices, maximumXYError, maximumDisplacementAgreement, maximumFDNormalError, maximumFDJacobianError,
    normalComparison: { beforeAuthoredVsGeometricMax, afterAuthoredVsGeometricMax, interpretation: 'Descriptive finite-mesh comparison, separate from exact transported-normal agreement' },
    sourceBuffersExact: originals.reduce((s, r) => s + r.arrays.length, 0), privateBuffersOwned: true, cleanup });
  bg.dispose(); ag.dispose(); releaseMouthContinuity130(head);
}
const cpu = process.cpuUsage(cpuStarted);
const report = { candidate: 140, status: 'Source geometry/ownership checks passed; native art pending', scoreUnchanged: 77,
  files: Object.fromEntries(['review/upper-lip-relief-candidate140.js', 'review/upper-lip-relief140-audit.mjs', 'src/face.js', 'src/lip-continuity.js', 'src/lip-refinement.js', 'src/portrait-proportions.js', 'review/mouth-continuity130-audit.mjs', 'review/torso-depth110-harness.mjs'].map(file => [file, sha(fs.readFileSync(file))])),
  spec, analyticField: { maximumDerivativeError, maximumSupportJetError, maximumInward, maximumOutward, zeroSkipsTraversal: true, unprepared130Rejected: true },
  planarOverlapFixture: planeResult, cases, elapsedMs: performance.now() - started, cpuMs: (cpu.user + cpu.system) / 1000,
  memory: { heapMiB: process.memoryUsage().heapUsed / 1048576, rssMiB: process.memoryUsage().rss / 1048576 },
  limitations: 'The source harness models geometry, matrices and attributes. It does not run native Three, bake textures, evaluate materials or render images. The parent owns the single native on/off comparison.' };
fs.writeFileSync('review/upper-lip-relief140-source-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ candidate: 140, status: report.status, analyticField: report.analyticField,
  cases: cases.map(c => ({ frame: c.frame, privateBytes: c.metrics.privateAttributeBytes, changedPositions: c.metrics.changedPositions,
    minimumClearance: c.metrics.minimumRepairedClearance, minAreaRatio: c.metrics.minimumTriangleAreaRatio, maxFDNormalError: c.maximumFDNormalError,
    protectedVertices: c.protectedVertices, ownedCleanup: c.privateBuffersOwned, helperMs: c.metrics.elapsedMs })), elapsedMs: report.elapsedMs, cpuMs: report.cpuMs, memory: report.memory }));
