import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// Independent source-only triangle audit. This never calls applyPortraitBalance,
// modifies production geometry, or claims native rendering/collision coverage.
// Run: node --expose-gc review/portrait-balance99-contact-audit.mjs
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  harness: 'review/hair-contact86-audit.mjs', face: 'src/face.js',
  hair: 'review/hair-groom-candidate94.js', contact: 'review/hair-contact-candidate86.js',
  blouse81: 'review/blouse-candidate81.js', blouse98: 'review/blouse-candidate98.js',
  balance: 'review/portrait-balance-candidate99.js',
};
const sources = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, fs.readFileSync(path.join(project, file), 'utf8')]));
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const clean = text => text.replace(/^import[^\n]*\n/gm, '').replace(/export /g, '');
const prefixEnd = sources.harness.indexOf('const read=');
assert(prefixEnd > 0, 'Existing source harness prefix changed.');
const { THREE, Attr } = new Function(clean(sources.harness.slice(0, prefixEnd)) + '\nreturn {THREE,Attr};')();
Attr.prototype.setX = function (i, x) { this.array[i * this.itemSize] = x; return this; };
const faceZ = new Function('THREE', clean(sources.face) + '\nreturn faceZ;')(THREE);
const sourceFieldAt = new Function(clean(sources.balance) + '\nreturn fieldAt;')();
const sourceFieldOut = new Float64Array(3);
let maximumSourceFormulaDifference = 0, formulaChecks = 0;
const SHIFTS = [0, -.12, -.24];
const clamp01 = x => Math.max(0, Math.min(1, x));
function smoother(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function weight(x, y) {
  if (Math.abs(x) <= .90 || y >= 2.00) return 1;
  return 1 - smoother(clamp01((Math.abs(x) - .90) / .85)) * (1 - smoother(clamp01((y - 1.30) / .70)));
}
function checkFormula(x, y) {
  sourceFieldAt(x, y, sourceFieldOut);
  maximumSourceFormulaDifference = Math.max(maximumSourceFormulaDifference, Math.abs(sourceFieldOut[0] - weight(x, y)));
  formulaChecks++;
}

const cy = Math.cos(.16), sy = Math.sin(.16), cr = Math.cos(-.17), sr = Math.sin(-.17);
const bc = Math.cos(.045), bs = Math.sin(.045);
function toModel(mesh, kind, name) {
  const source = mesh.geometry.getAttribute('position').array;
  const positions = new Float64Array(source.length), weights = new Float64Array(source.length / 3);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < source.length; i += 3) {
    const x = source[i], y = source[i + 1], z = source[i + 2];
    if (kind === 'hair') {
      const rx = x * cr - y * sr;
      positions[i] = .26 + rx * cy + z * sy;
      positions[i + 1] = 2.95 + x * sr + y * cr;
      positions[i + 2] = -rx * sy + z * cy;
    } else {
      positions[i] = bc * x - bs * (y - 1);
      positions[i + 1] = 1 + bs * x + bc * (y - 1);
      positions[i + 2] = z;
    }
    weights[i / 3] = weight(positions[i], positions[i + 1]);
    if ((i / 3) % 311 === 0) checkFormula(positions[i], positions[i + 1]);
    for (let axis = 0; axis < 3; axis++) {
      assert(Number.isFinite(positions[i + axis]));
      min[axis] = Math.min(min[axis], positions[i + axis]);
      max[axis] = Math.max(max[axis], positions[i + axis]);
    }
  }
  return { name, positions, weights, index: mesh.geometry.index.array, bounds: { min, max } };
}

function approximation(mesh) {
  const { positions: p, weights: w, index: idx } = mesh;
  let maxMid = 0, maxCentroid = 0, worstMid = null, worstCentroid = null;
  const midpointThresholdCounts = [0, 0], centroidThresholdCounts = [0, 0];
  for (let k = 0; k < idx.length; k += 3) {
    const ia = idx[k], ib = idx[k + 1], ic = idx[k + 2], a = ia * 3, b = ib * 3, c = ic * 3;
    // All edge incidences are evaluated; shared indexed edges are intentionally
    // repeated. These maxima therefore include every actual triangle edge.
    for (let edge = 0; edge < 3; edge++) {
      const i = edge === 0 ? ia : edge === 1 ? ib : ic;
      const j = edge === 0 ? ib : edge === 1 ? ic : ia;
      const x = (p[i * 3] + p[j * 3]) * .5, y = (p[i * 3 + 1] + p[j * 3 + 1]) * .5;
      const error = Math.abs((w[i] + w[j]) * .5 - weight(x, y));
      if (.24 * error > .001) midpointThresholdCounts[0]++;
      if (.24 * error > .0005) midpointThresholdCounts[1]++;
      if (error > maxMid) {
        maxMid = error;
        worstMid = { triangle: k / 3, edge: [i, j], point: [x, y, (p[i * 3 + 2] + p[j * 3 + 2]) * .5], weightError: error };
      }
    }
    const x = (p[a] + p[b] + p[c]) / 3, y = (p[a + 1] + p[b + 1] + p[c + 1]) / 3;
    const error = Math.abs((w[ia] + w[ib] + w[ic]) / 3 - weight(x, y));
    if (.24 * error > .001) centroidThresholdCounts[0]++;
    if (.24 * error > .0005) centroidThresholdCounts[1]++;
    if (error > maxCentroid) {
      maxCentroid = error;
      worstCentroid = { triangle: k / 3, point: [x, y, (p[a + 2] + p[b + 2] + p[c + 2]) / 3], weightError: error };
    }
  }
  return {
    vertices: p.length / 3, triangles: idx.length / 3, bounds: mesh.bounds,
    edgeIncidencesEvaluated: idx.length, centroidsEvaluated: idx.length / 3,
    byShift: SHIFTS.map(shiftX => ({ shiftX, maximumMidpointXError: Math.abs(shiftX) * maxMid, maximumCentroidXError: Math.abs(shiftX) * maxCentroid })),
    fullShiftThresholdCounts: { thresholds: [.001, .0005], edgeIncidences: midpointThresholdCounts, centroids: centroidThresholdCounts },
    worstMidpoint: worstMid, worstCentroid,
  };
}

// Fixed Y/Z projections are invariant under candidate99. Linked typed arrays
// retain all triangle hits without a large object graph or an all-pairs BVH.
const GRID = { yMin: -1.50, yMax: 1.95, zMin: -.90, zMax: 1.40, yCount: 115, zCount: 92 };
GRID.dy = (GRID.yMax - GRID.yMin) / GRID.yCount;
GRID.dz = (GRID.zMax - GRID.zMin) / GRID.zCount;
const rayCount = GRID.yCount * GRID.zCount;
class Hits {
  constructor() {
    this.head = new Int32Array(rayCount).fill(-1);
    this.x = new Float64Array(8192); this.w = new Float64Array(8192);
    this.triangle = new Int32Array(8192); this.next = new Int32Array(8192);
    this.count = 0;
  }
  add(ray, x, w, triangle) {
    if (this.count === this.x.length) for (const key of ['x', 'w', 'triangle', 'next']) {
      const next = new this[key].constructor(this[key].length * 2); next.set(this[key]); this[key] = next;
    }
    const n = this.count++; this.x[n] = x; this.w[n] = w; this.triangle[n] = triangle;
    this.next[n] = this.head[ray]; this.head[ray] = n;
  }
}
function rasterize(mesh) {
  const { positions: p, weights: w, index: idx } = mesh, hits = new Hits();
  let maxWeightError = 0, skippedEdgeOnTriangles = 0, worst = null;
  for (let k = 0; k < idx.length; k += 3) {
    const ia = idx[k], ib = idx[k + 1], ic = idx[k + 2], a = ia * 3, b = ib * 3, c = ic * 3;
    const ay = p[a + 1], az = p[a + 2], by = p[b + 1], bz = p[b + 2], yy = p[c + 1], zz = p[c + 2];
    const den = (bz - zz) * (ay - yy) + (yy - by) * (az - zz);
    if (Math.abs(den) < 1e-12) { skippedEdgeOnTriangles++; continue; }
    const ylo = Math.max(0, Math.ceil((Math.min(ay, by, yy) - GRID.yMin) / GRID.dy - .5));
    const yhi = Math.min(GRID.yCount - 1, Math.floor((Math.max(ay, by, yy) - GRID.yMin) / GRID.dy - .5));
    const zlo = Math.max(0, Math.ceil((Math.min(az, bz, zz) - GRID.zMin) / GRID.dz - .5));
    const zhi = Math.min(GRID.zCount - 1, Math.floor((Math.max(az, bz, zz) - GRID.zMin) / GRID.dz - .5));
    for (let zi = zlo; zi <= zhi; zi++) for (let yi = ylo; yi <= yhi; yi++) {
      const y = GRID.yMin + (yi + .5) * GRID.dy, z = GRID.zMin + (zi + .5) * GRID.dz;
      const u = ((bz - zz) * (y - yy) + (yy - by) * (z - zz)) / den;
      const v = ((zz - az) * (y - yy) + (ay - yy) * (z - zz)) / den, q = 1 - u - v;
      if (Math.min(u, v, q) < -1e-8) continue;
      const x = u * p[a] + v * p[b] + q * p[c], iw = u * w[ia] + v * w[ib] + q * w[ic];
      const error = Math.abs(iw - weight(x, y));
      if (error > maxWeightError) { maxWeightError = error; worst = { triangle: k / 3, point: [x, y, z], weightError: error }; }
      hits.add(zi * GRID.yCount + yi, x, iw, k / 3);
    }
  }
  return { hits, metrics: { triangleHits: hits.count, skippedEdgeOnTriangles, byShift: SHIFTS.map(shiftX => ({ shiftX, maximumRayHitXError: Math.abs(shiftX) * maxWeightError })), worst } };
}
function auditOrder(mass, cloth) {
  const a = rasterize(mass), b = rasterize(cloth);
  const stats = SHIFTS.map(shiftX => ({ shiftX, reversalsAboveTolerance: 0, anyReversals: 0, maximumReversal: 0, minimumSignedGapAfter: Infinity, minimumExactContinuousGapAfter: Infinity, worstReversal: null }));
  let overlappingRays = 0, eligiblePairs = 0, closePairs = 0, minimumOriginalGap = Infinity;
  for (let ray = 0; ray < rayCount; ray++) {
    if (a.hits.head[ray] < 0 || b.hits.head[ray] < 0) continue;
    overlappingRays++;
    const y = GRID.yMin + (ray % GRID.yCount + .5) * GRID.dy;
    const z = GRID.zMin + (Math.floor(ray / GRID.yCount) + .5) * GRID.dz;
    for (let i = a.hits.head[ray]; i >= 0; i = a.hits.next[i]) for (let j = b.hits.head[ray]; j >= 0; j = b.hits.next[j]) {
      const ax = a.hits.x[i], bx = b.hits.x[j];
      // Opposite-side hits cannot reverse for |shift|<=.24 when either is in
      // the lateral transition; central points both translate uniformly.
      if (ax * bx < 0) continue;
      const signed = ax - bx, gap = Math.abs(signed);
      if (gap < .003) continue;
      eligiblePairs++; if (gap < .03) closePairs++;
      minimumOriginalGap = Math.min(minimumOriginalGap, gap);
      const sign = signed >= 0 ? 1 : -1;
      const difference = (a.hits.w[i] - b.hits.w[j]) * sign;
      const exactDifference = (weight(ax, y) - weight(bx, y)) * sign;
      for (const row of stats) {
        const after = gap + row.shiftX * difference, exactAfter = gap + row.shiftX * exactDifference;
        row.minimumSignedGapAfter = Math.min(row.minimumSignedGapAfter, after);
        row.minimumExactContinuousGapAfter = Math.min(row.minimumExactContinuousGapAfter, exactAfter);
        if (after < 0) row.anyReversals++;
        if (after < -.001) row.reversalsAboveTolerance++;
        if (-after > row.maximumReversal) {
          row.maximumReversal = -after;
          row.worstReversal = { rayY: y, rayZ: z, hairTriangle: a.hits.triangle[i], clothTriangle: b.hits.triangle[j], hairX: ax, clothX: bx, originalGap: gap, signedGapAfter: after, exactContinuousGapAfter: exactAfter, hairWeight: a.hits.w[i], clothWeight: b.hits.w[j] };
        }
      }
    }
  }
  assert(eligiblePairs > 0, 'No eligible hair/cloth triangle pairs were sampled.');
  return { grid: GRID, rays: rayCount, overlappingRays, eligibleTriangleHitPairs: eligiblePairs, pairsWithOriginalGapBelowPoint03: closePairs, minimumRequiredOriginalGap: .003, minimumObservedOriginalGap: minimumOriginalGap, countedReversalTolerance: .001, sameHemisphereOnly: true, mass: a.metrics, cloth: b.metrics, byShift: stats };
}

const cpuStart = process.cpuUsage(), started = performance.now();
function runVariant({ name, blouseKey, outerWidth, shoulderContact }) {
  const variantStarted = performance.now();
  let blouseSource = sources[blouseKey];
  if (blouseKey === 'blouse98') {
    assert(/const OUTER_WIDTH98=0;/.test(blouseSource));
    blouseSource = blouseSource.replace('const OUTER_WIDTH98=0;', `const OUTER_WIDTH98=${outerWidth};`);
  }
  const blouse = new Function('THREE', clean(blouseSource) + '\nreturn {surface,torsoPoint,broadenShoulders,sampleBlouseFrontAtXY};')(THREE);
  const createHairContact = new Function('sampleBlouseFrontAtXY', clean(sources.contact) + '\nreturn createHairContact;')(blouse.sampleBlouseFrontAtXY);
  const createGroomHair = new Function('THREE', 'faceZ', 'createHairContact', clean(sources.hair) + '\nreturn createGroomHair;')(THREE, faceZ, createHairContact);
  let hair = createGroomHair({ shoulderContact });
  assert(hair.children[1].name === 'Overlapping layered S-wave hair around front back and shoulders' && hair.children[2].name === 'Independent fine crown lengths and silhouette strands', 'Groom mesh order changed.');
  const mass = toModel(hair.children[1], 'hair', 'MASS');
  const detail = toModel(hair.children[2], 'hair', 'DETAIL');
  // clothGeometry() changes only normals/colors after this exact surface call.
  // The same source broadening is then applied to the Float32 positions once.
  let clothGroup = new THREE.Group();
  clothGroup.add(new THREE.Mesh(blouse.surface(192, 112, blouse.torsoPoint), {}));
  blouse.broadenShoulders(clothGroup);
  const cloth = toModel(clothGroup.children[0], 'body', 'cloth');
  hair = null; clothGroup = null; global.gc?.();
  const results = { name, blouseSource: files[blouseKey], effectiveBlouseSHA256: sha(blouseSource), outerWidth, shoulderContact, geometryConstruction: 'Exact source surface(192,112,torsoPoint), original Float32 storage and source broadenShoulders; only primary torso/sleeves mesh.', approximation: { MASS: approximation(mass), DETAIL: approximation(detail), cloth: approximation(cloth) }, ordering: auditOrder(mass, cloth) };
  results.elapsedMs = +(performance.now() - variantStarted).toFixed(1);
  return results;
}
const variants = [];
for (const variant of [
  { name: 'frozen81-contact0.5', blouseKey: 'blouse81', outerWidth: 0, shoulderContact: .5 },
  { name: 'candidate98-width0.12-contact0.35', blouseKey: 'blouse98', outerWidth: .12, shoulderContact: .35 },
]) { variants.push(runVariant(variant)); global.gc?.(); }
assert(maximumSourceFormulaDifference < 1e-12, 'Independent formula differs from source field.');
const cpu = process.cpuUsage(cpuStart);
const result = {
  audit: 'portrait-balance99-contact', sourceOnly: true, native: false,
  sources: Object.fromEntries(Object.entries(files).map(([key, file]) => [key, { file, sha256: sha(sources[key]), bytes: Buffer.byteLength(sources[key]) }])),
  shifts: SHIFTS, formula: 'Xprime=X+shiftX*(1-S5(abs(X);.90,1.75)*(1-S5(Y;1.30,2.00))); Y/Z fixed',
  sourceFormulaCheck: { samples: formulaChecks, maximumAbsoluteWeightDifference: maximumSourceFormulaDifference },
  variants,
  limitations: [
    'Hair uses the inherited source harness uniform Catmull-Rom implementation; native Three and material rendering are independently reviewed by the parent.',
    'Midpoints, centroids and finite Y/Z rays are bounded approximation probes, not an exhaustive continuous collision proof or an adaptive tessellation certificate.',
    'Ordering compares MASS with the primary blouse torso/sleeves only; separate collars, facings, buttons, seams, neck, and DETAIL-to-MASS attachment are outside this audit.',
    'Triangle-hit pair counts may include coincident shared-edge hits. Pairs start with absolute X gap at least .003 and have the same X hemisphere.',
    'The width .12 setting is substituted only in the in-memory candidate98 source; no frozen or production file is changed.',
  ],
  resources: { wallMs: +(performance.now() - started).toFixed(1), cpuMs: +((cpu.user + cpu.system) / 1000).toFixed(1), peakRssMiB: +(process.resourceUsage().maxRSS / 1024).toFixed(1), finalMemoryMiB: Object.fromEntries(Object.entries(process.memoryUsage()).map(([k, v]) => [k, +(v / 1048576).toFixed(1)])) },
};
const output = path.join(project, 'review/portrait-balance99-contact-audit.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ file: output, sourceFormulaCheck: result.sourceFormulaCheck, variants: variants.map(v => ({ name: v.name, approximation: Object.fromEntries(Object.entries(v.approximation).map(([key, value]) => [key, value.byShift])), ordering: { eligiblePairs: v.ordering.eligibleTriangleHitPairs, overlappingRays: v.ordering.overlappingRays, byShift: v.ordering.byShift }, elapsedMs: v.elapsedMs })), resources: result.resources }));
