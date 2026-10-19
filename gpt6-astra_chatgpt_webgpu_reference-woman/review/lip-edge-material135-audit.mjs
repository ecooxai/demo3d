import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Focused numerical audit only. No Three fixture, renderer, photo analysis or
// claim of native material/source safety: the native A/B checks those paths.
const root = path.resolve(import.meta.dirname, '..'), file = path.join(root, 'review/lip-edge-material-candidate135.js');
const source = await readFile(file, 'utf8'), importLine = "import * as THREE from 'three';";
assert.equal(source.split(importLine).length, 2);
const { makeLipEdgePixels135, sampleLipEdgeMask135, lipEdgeUV135, LIP_EDGE_MATERIAL135_SPEC: spec } =
  await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(source.replace(importLine, 'const THREE = null;')));
const started = performance.now(), { data, width, height, maximumRoughnessTexelError, maximumClearcoatTexelError } = makeLipEdgePixels135();
assert.equal(data.byteLength, 65536); assert.equal(width, 128); assert.equal(height, 128);
const smooth = value => { const t = Math.max(0, Math.min(1, value)); return 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3; };
const mask = (u, v) => (1 - smooth((Math.abs(.241 * (2 * u - 1)) - .18) / .055)) * (1 - smooth(v / .35));
const ideal = (u, v) => { const m = mask(u, v); return [.12 * (1 - m), .44 + .09 * m]; };
function sampled(s, t) {
  const x = width * s - .5, y = height * t - .5, i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const clampX = value => Math.max(0, Math.min(width - 1, value)), clampY = value => Math.max(0, Math.min(height - 1, value));
  const at = (a, b, c) => data[4 * (clampY(b) * width + clampX(a)) + c] / 255;
  const filtered = c => ((1 - fx) * at(i, j, c) + fx * at(i + 1, j, c)) * (1 - fy) + ((1 - fx) * at(i, j + 1, c) + fx * at(i + 1, j + 1, c)) * fy;
  return [.12 * filtered(0), .53 * filtered(1)];
}

let exactCentralTexels = 0, maximumMaskFormulaDifference = 0;
for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
  const k = 4 * (j * width + i), u = i / (width - 1), v = j / (height - 1);
  assert.equal(data[k + 2], 0); assert.equal(data[k + 3], 255);
  const [cc, roughness] = ideal(u, v);
  assert.equal(data[k], Math.round(255 * cc / .12)); assert.equal(data[k + 1], Math.round(255 * roughness / .53));
  maximumMaskFormulaDifference = Math.max(maximumMaskFormulaDifference, Math.abs(mask(u, v) - sampleLipEdgeMask135(u, v)));
  if (v >= .35) { assert.equal(data[k], 255); assert.equal(data[k + 1], 212); exactCentralTexels++; }
}
assert(maximumMaskFormulaDifference < 1e-13);
assert(maximumRoughnessTexelError <= .53 / 510 + 1e-14); assert(maximumClearcoatTexelError <= .12 / 510 + 1e-14);

// Dense continuous sampling characterizes interpolation as well as byte error.
// This is a numerical study, not an exhaustive continuum maximum. The separate
// analytic bound uses |S''| <= 10sqrt(3)/3 and linear interpolation error M h²/8.
const grid = 1024, maxError = [0, 0], maxErrorAt = [null, null];
let protectedCentralClearcoatError = 0, protectedCentralRoughnessError = 0;
for (let j = 0; j <= grid; j++) for (let i = 0; i <= grid; i++) {
  const u = i / grid, v = j / grid, expected = ideal(u, v), actual = sampled(...lipEdgeUV135(u, v));
  for (let c = 0; c < 2; c++) { const error = Math.abs(actual[c] - expected[c]); if (error > maxError[c]) { maxError[c] = error; maxErrorAt[c] = [u, v]; } }
  if (v >= .35) {
    protectedCentralClearcoatError = Math.max(protectedCentralClearcoatError, Math.abs(actual[0] - .12));
    protectedCentralRoughnessError = Math.max(protectedCentralRoughnessError, Math.abs(actual[1] - spec.centralQuantizedRoughness));
  }
}
const maxSecond = 10 * Math.sqrt(3) / 3;
const interpolationMaskBound = maxSecond * ((.482 / .055) ** 2 + 1 / .35 ** 2) / (8 * 127 ** 2);
const continuousBounds = { clearcoat: .12 / 510 + .12 * interpolationMaskBound, roughness: .53 / 510 + .09 * interpolationMaskBound };
assert(maxError[0] <= continuousBounds.clearcoat); assert(maxError[1] <= continuousBounds.roughness);
assert(protectedCentralClearcoatError < 1e-14); assert(protectedCentralRoughnessError < 1e-14);

let maximumFloat32UVError = 0, maximumGridClearcoatError = 0, maximumGridRoughnessError = 0, exactRootInteriorSamples = 0;
for (let row = 0; row <= 16; row++) for (let col = 0; col <= 100; col++) {
  const u = col / 100, v = row / 16, uv = lipEdgeUV135(u, v), fuv = uv.map(Math.fround), target = ideal(u, v), actual = sampled(...fuv);
  maximumFloat32UVError = Math.max(maximumFloat32UVError, Math.abs(fuv[0] - uv[0]), Math.abs(fuv[1] - uv[1]));
  maximumGridClearcoatError = Math.max(maximumGridClearcoatError, Math.abs(actual[0] - target[0]));
  maximumGridRoughnessError = Math.max(maximumGridRoughnessError, Math.abs(actual[1] - target[1]));
  if (row === 0 && Math.abs(.241 * (2 * u - 1)) <= .18 - .482 / 127) {
    assert.equal(actual[0], 0); assert.equal(actual[1], .53); exactRootInteriorSamples++;
  }
  if (v >= .35) { assert(Math.abs(actual[0] - .12) < 1e-14); assert(Math.abs(actual[1] - spec.centralQuantizedRoughness) < 1e-14); }
}
assert.equal(spec.centralQuantizedRoughness, .53 * 212 / 255);
assert.equal(spec.mapBytes, 65536); assert.equal(spec.channel, 1); assert.equal(spec.mipmaps, false);
const report = { candidate: 135, status: 'Focused packed-map numerical checks passed; native A/B and source cleanup pending', scoreUnchanged: 77,
  source: { path: 'review/lip-edge-material-candidate135.js', bytes: Buffer.byteLength(source), sha256: createHash('sha256').update(source).digest('hex') },
  map: { width, height, byteLength: data.byteLength, sha256: createHash('sha256').update(data).digest('hex'), mipmaps: false, channel: 1,
    colorSpace: 'NoColorSpace / linear data', filtering: 'Bilinear, endpoints at texel centers', alpha: 255, unusedBlue: 0 },
  measured: { maximumMaskFormulaDifference, maximumRoughnessTexelError, maximumClearcoatTexelError,
    samples: (grid + 1) ** 2, maximumInterpolatedClearcoatError: maxError[0], maximumInterpolatedRoughnessError: maxError[1],
    clearcoatMaximumAtUV: maxErrorAt[0], roughnessMaximumAtUV: maxErrorAt[1], exactCentralTexels,
    centralClearcoat: .12, centralRoughness: spec.centralQuantizedRoughness, centralRoughnessBias: spec.centralRoughnessBias,
    protectedCentralClearcoatError, protectedCentralRoughnessError, maximumFloat32UVError,
    maximumGridClearcoatError, maximumGridRoughnessError, exactRootInteriorSamples },
  analytic: { maskBilinearInterpolationBound: interpolationMaskBound, effectiveContinuousErrorBounds: continuousBounds,
    note: 'Bounds include independent RG byte quantization and ideal double-precision UV bilinear interpolation. Float32 grid encoding is measured separately.' },
  resources: { textureBytes: 65536, textureGPUBytesWithoutMipmaps: 65536, expectedAddedUV1Bytes: 27472,
    expectedPrivateGeometryBytesBeforeNativeIndexWidening: 216968, expectedExtraGroups: 0, perFrameWork: 0 },
  elapsedMs: performance.now() - started, peakRSSMiB: process.resourceUsage().maxRSS / 1024 };
await writeFile(path.join(root, 'review/lip-edge-material135-source-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ candidate: 135, status: report.status, map: report.map, measured: report.measured,
  analytic: report.analytic, elapsedMs: report.elapsedMs, peakRSSMiB: report.peakRSSMiB }));
