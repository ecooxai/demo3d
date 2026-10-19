import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// Pure JavaScript/source-contract checks only. Actual Three/GLTF/WebGPU checks
// are performed by the separately runnable focused native117/120 comparison.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const [base, candidate, native, main, blouse] = await Promise.all([
  'src/export-portrait.js', 'review/export-portrait-candidate120.js', 'review/reference-cloth117-export-native.mjs', 'src/main.js', 'src/blouse.js',
].map(file => readFile(path.join(root, file), 'utf8')));
const hash = value => createHash('sha256').update(value).digest('hex');
const begin = candidate.indexOf('  // Candidate 120: Three r186 exports'), end = candidate.indexOf('  function cloneMaterial', begin);
assert(begin >= 0 && end > begin, 'Missing isolated sheen normalization block.');
const normalizedBase = (candidate.slice(0, begin) + candidate.slice(end))
  .replace('normalScaleBakes: [], alphaMerges: [], sheenFactorBakes: []', 'normalScaleBakes: [], alphaMerges: []')
  .replace('    normalizeSheen120(source, material);\n', '');
assert.equal(normalizedBase, base, '120 must preserve the complete production104 exporter except the report, normalization function and call.');
const normalize = new Function('source', 'material', 'report', candidate.slice(candidate.indexOf('  function normalizeSheen120', begin), end) + '\nnormalizeSheen120(source, material);');
class Color {
  constructor(values) { [this.r, this.g, this.b] = values; }
  toArray() { return [this.r, this.g, this.b]; }
  copy(other) { [this.r, this.g, this.b] = other.toArray(); return this; }
  multiplyScalar(value) { this.r *= value; this.g *= value; this.b *= value; return this; }
}
const cases = [];
function runCase(name, { scalar, color = [.8,.55,.25], physical = true, mapped = false, reject = false }) {
  const texture = { name: 'original-fixture', version: 7, source: { version: 3 }, bytes: [17,82,221,255] };
  const source = { name, isMeshPhysicalMaterial: physical, sheen: scalar, sheenColor: new Color(color), sheenRoughness: .83,
    sheenColorMap: mapped ? texture : null, sheenRoughnessMap: mapped ? texture : null };
  const material = { ...source, sheenColor: new Color(color) }, report = { sheenFactorBakes: [] };
  const sourceState = JSON.stringify(source), colorReference = source.sheenColor;
  if (reject) {
    assert.throws(() => normalize(source, material, report), /invalid sheen scalar|outside glTF/);
    assert.equal(material.sheen, scalar); assert.deepEqual(material.sheenColor.toArray(), color); assert.equal(report.sheenFactorBakes.length, 0);
  } else {
    normalize(source, material, report);
    const active = physical && scalar > 0;
    assert.equal(material.sheen, active ? 1 : scalar);
    assert.deepEqual(material.sheenColor.toArray(), color.map(value => value * (active ? scalar : 1)));
    assert.equal(report.sheenFactorBakes.length, active ? 1 : 0);
    let maxEffectiveProductError = 0;
    for (const sample of [[1,1,1], [0,0,0], [.003,.54,.97], [.9,.002,.23]]) for (let c = 0; c < 3; c++) {
      const original = color[c] * scalar * sample[c], prepared = material.sheenColor.toArray()[c] * material.sheen * sample[c];
      maxEffectiveProductError = Math.max(maxEffectiveProductError, Math.abs(original - prepared));
    }
    assert(maxEffectiveProductError <= 1e-15, `${name}: mapped physical product changed.`);
    assert.equal(material.sheenColorMap, source.sheenColorMap); assert.equal(material.sheenRoughnessMap, source.sheenRoughnessMap);
    if (active) {
      assert.equal(report.sheenFactorBakes[0].colorMapPresent, mapped);
      assert.equal(report.sheenFactorBakes[0].texturePixelsChanged, false);
      assert.equal(report.sheenFactorBakes[0].allocatedPixelBytes, 0);
    }
  }
  assert.equal(source.sheenColor, colorReference); assert.equal(JSON.stringify(source), sourceState, `${name}: live source changed.`);
  cases.push({ name, rejectedWithoutMutation: reject, sourceUnchanged: true, passed: true });
}
runCase('cotton-positive-scalar', { scalar: .105 });
runCase('positive-with-color-and-roughness-map', { scalar: .37, mapped: true });
runCase('zero-with-color-and-roughness-map', { scalar: 0, mapped: true });
runCase('positive-black-sheen', { scalar: .5, color: [0,0,0] });
runCase('unit-scalar', { scalar: 1 });
runCase('scalar-above-one-with-bounded-effective-color', { scalar: 2, color: [.1,.25,.49] });
runCase('nonphysical-material-no-op', { scalar: .37, physical: false, mapped: true });
runCase('reject-negative-scalar', { scalar: -.1, reject: true });
runCase('reject-NaN-scalar', { scalar: NaN, reject: true });
runCase('reject-infinite-scalar', { scalar: Infinity, reject: true });
runCase('reject-out-of-range-effective-color', { scalar: 2, reject: true });
runCase('reject-negative-effective-color', { scalar: .5, color: [-.1,.5,.5], reject: true });
runCase('reject-nonfinite-effective-color', { scalar: .5, color: [.5,NaN,.5], reject: true });

const injectionStart = native.indexOf("const marker = 'state.balance="), injectionEnd = native.indexOf('const bundle =', injectionStart);
assert(injectionStart >= 0 && injectionEnd > injectionStart);
const instrument = new Function('source', 'exportModule', 'exportSelection', native.slice(injectionStart, injectionEnd) + '\nreturn {entry, stateField};');
const marker = 'state.balance=applyPortraitBalance(model,{shiftX:-.24});';
const injectionCases = [];
for (const selection of ['production', 'candidate120']) {
  const module = selection === 'production' ? './export-portrait.js' : '../review/export-portrait-candidate120.js';
  const result = instrument(main, module, selection);
  assert.equal((result.entry.match(/\bapplyReferenceCloth117\s*\(/g) || []).length, 1);
  assert(result.entry.includes(`from ${JSON.stringify(module)};`));
  assert(result.entry.includes('exportPortraitGLB:exportPortraitGLB117'));
  assert(result.entry.includes(`exportSelection:${JSON.stringify(selection)}`));
  assert(result.entry.indexOf('applyReferenceEarColor(') < result.entry.indexOf('applyReferenceCloth117('));
  assert(result.entry.indexOf('applyReferenceCloth117(') < result.entry.indexOf(marker));
  const filename = path.join(qa, `cloth117-export-${selection}-syntax-check.js`);
  await writeFile(filename, result.entry);
  const checked = spawnSync(process.execPath, ['--check', filename], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr); injectionCases.push({ name: `current115-${selection}`, passed: true });
}
const clothImport = "import {applyReferenceCloth117} from '../review/reference-cloth-candidate117.js';\n";
const clothCall = 'state.acceptedCloth117=await applyReferenceCloth117(anatomicalBlouse,{strength:.5});\n';
const integrated = clothImport + main.replace(marker, clothCall + marker);
assert.equal(instrument(integrated, './export-portrait.js', 'production').stateField, 'acceptedCloth117');
injectionCases.push({ name: 'already-integrated-reused-once', passed: true });
for (const [name, source] of [
  ['import-without-application', clothImport + main],
  ['duplicate-application', clothImport + main.replace(marker, clothCall + clothCall + marker)],
  ['application-before-ear', clothImport + clothCall + main],
  ['application-after-balance', clothImport + main.replace(marker, marker + clothCall)],
]) { assert.throws(() => instrument(source, './export-portrait.js', 'production')); injectionCases.push({ name, rejected: true, passed: true }); }
assert(native.includes("if (!['production', 'candidate120'].includes(exportSelection)) throw new Error"), 'Reject an unsupported export override.');
assert(!/\.compileAsync\s*\(/.test(native), 'Do not compile at the screen target.');
assert(native.includes('65890d8e1e597ccf18cd4b2fa1d819c10759670ab25e0ab418b934698eed5501'), 'Preserve the original native117 failure provenance.');
for (const file of ['review/export-portrait-candidate120.js', 'review/reference-cloth117-export-native.mjs']) {
  const checked = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' }); assert.equal(checked.status, 0, checked.stderr);
}

// These named source counterexamples make the bounded-absorption limitation
// conclusive without pretending that a dependency-free script rendered a mesh.
assert(blouse.includes("placketMat.color.set('#e5e6ed')") && blouse.includes("collarMat.color.set('#e2e4eb')"));
assert(blouse.includes('colors.fill(1)') && blouse.includes('fabric.color.multiplyScalar(1.28)'));
assert(blouse.includes("curveMesh(group,`blouse-${n}-collar-fold`,roll,.0016,cloth,80)"));
assert(blouse.includes("mesh(group,'blouse-curved-centre-placket',solidifyGrid(surface(10,74"));
const linear = value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
const factors = Object.fromEntries(Object.entries({ cotton: [214,217,227], collar: [226,228,235], placket: [229,230,237] })
  .map(([name, bytes]) => [name, bytes.map(value => 1.28 * linear(value / 255))]));
const boundedAbsorption = {
  method: 'For each channel, Cprime=min(C,1), Vprime=C*V/Cprime (unchanged zero channel). Feasible only if every product C*V is within [0,1]. Preserve the alpha component and share all geometry buffers except one export-only Float32 RGB attribute.',
  interpolation: 'Multiplication by a constant commutes with barycentric interpolation. Only Float32 re-encoding error is introduced where the bound holds.',
  factors,
  knownWhiteVertexCounterexamples: [
    { meshes: ['blouse-left-collar-fold', 'blouse-right-collar-fold'], material: 'collar', vertexRGB: [1,1,1], product: factors.collar },
    { meshes: ['blouse-curved-centre-placket'], material: 'placket', vertexRGB: [1,1,1], product: factors.placket },
  ],
  maximumPermittedVertexRGBToAbsorb: Object.fromEntries(['collar','placket'].map(name => [name, factors[name].map(value => Math.min(1, 1 / value))])),
  allMeshesExactBoundedConversionFeasible: false,
  reason: 'The demonstrated effective albedos exceed one. Products of legal baseColorFactor, normalized vertex COLOR_0 and ordinary base-color texture values cannot reproduce them exactly. No clipping or unrelated material workaround is included in120.',
  evidenceType: 'Current authored source constants and explicit white vertex initialization; not a native vertex traversal.',
};
const report = {
  candidate: 120, artisticScoreUnchanged: 76, scope: 'Export-only scalar-sheen normalization; dependency-free source/math checks',
  sourceHashes: { production104: hash(base), candidate120: hash(candidate), native117WithOverride: hash(native), main115: hash(main), blouse: hash(blouse) },
  originalFrozen117Test: { bytes: 29492, sha256: '65890d8e1e597ccf18cd4b2fa1d819c10759670ab25e0ab418b934698eed5501', nativeFailure: 'Loaded effective cotton sheen changed' },
  complete104CodePreserved: true, normalizationCases: cases, injectionCases,
  syntaxChecked: ['candidate120', 'native117', 'generated-production-entry', 'generated-candidate120-entry'],
  noStandaloneCompile: true, boundedAbsorption,
  nativeVerification: 'Pending root Mac execution: CLOTH117_EXPORT_MODULE=candidate120 node review/reference-cloth117-export-native.mjs',
};
await writeFile(path.join(root, 'review/export-portrait120-audit-result.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ candidate: 120, status: 'Pure checks passed; native verification pending', normalizationCases: cases.length,
  injectionCases: injectionCases.length, complete104CodePreserved: true, collarFactors: factors.collar, placketFactors: factors.placket, sourceHashes: report.sourceHashes }));
