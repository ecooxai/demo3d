import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Reuse the project's original geometry-math harness, then model the Texture
// Source/copy semantics needed here. This is a source audit, not a GPU render.
const prefix = fs.readFileSync('review/hair-contact86-audit.mjs', 'utf8').split('const sampleBlouseFrontAtXY=')[0].replace(/^import[^\n]*\n/gm, '');
const { THREE, read, faceZ } = new Function('fs', 'assert', prefix + '\nreturn {THREE,read,faceZ};')(fs, assert);
const clockStart = performance.now(), cpuStart = process.cpuUsage();
class Vector2 { constructor(x = 0, y = 0) { this.x = x; this.y = y; } clone() { return new Vector2(this.x, this.y); } copy(v) { this.x = v.x; this.y = v.y; return this; } toArray() { return [this.x, this.y]; } }
class Matrix3 { constructor() { this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1]; } clone() { const m = new Matrix3(); m.elements = this.elements.slice(); return m; } }
class TextureSource { constructor(data) { this.data = data; this.version = 0; } set needsUpdate(value) { if (value) this.version++; } }
class Texture {
  constructor(data, width = 1, height = 1, format = 1023) {
    Object.assign(this, { isTexture: true, isDataTexture: true, source: new TextureSource({ data, width, height }), version: 0,
      format, type: 1009, channel: 0, colorSpace: '', wrapS: 1001, wrapT: 1001, minFilter: 1003, magFilter: 1003,
      anisotropy: 1, flipY: false, generateMipmaps: false, unpackAlignment: 1, offset: new Vector2(), repeat: new Vector2(1, 1), center: new Vector2(), rotation: 0,
      matrix: new Matrix3(), matrixAutoUpdate: true, userData: {}, name: '', disposeCount: 0 });
  }
  get image() { return this.source.data; }
  set needsUpdate(value) { if (value) { this.version++; this.source.needsUpdate = true; } }
  copy(other) { for (const key of Object.keys(this)) if (key !== 'version' && key !== 'disposeCount') this[key] = other[key]; for (const key of ['offset', 'repeat', 'center', 'matrix']) this[key] = other[key].clone(); this.userData = structuredClone(other.userData); this.needsUpdate = true; return this; }
  dispose() { this.disposeCount++; }
}
class Material {
  constructor(values = {}) { Object.assign(this, { userData: {}, normalScale: new Vector2(1, 1), disposeCount: 0 }, values); }
  clone() { const m = new Material({ ...this, userData: structuredClone(this.userData), disposeCount: 0 }); if (this.normalScale) m.normalScale = this.normalScale.clone(); return m; }
  dispose() { this.disposeCount++; }
}
Object.assign(THREE, { Vector2, TextureSource, DataTexture: Texture, MeshPhysicalMaterial: Material, RGBAFormat: 1023, UnsignedByteType: 1009,
  RepeatWrapping: 1000, ClampToEdgeWrapping: 1001, LinearFilter: 1006, LinearMipmapLinearFilter: 1008, SRGBColorSpace: 'srgb', NoColorSpace: '' });
Object.assign(THREE.Float32BufferAttribute.prototype, { version: 0, usage: 35044, normalized: false, name: '', setUsage(value) { this.usage = value; return this; } });
THREE.Group.prototype.getObjectByName = function (name) { return this.children.find(mesh => mesh.name === name); };
const api = new Function('THREE', read('review/hair-strand-normal-candidate111.js') + '\nreturn {applyHairStrandNormal111,releaseHairStrandNormal111,buildHairStrandProfile111,sampleHairStrandProfile111,strandEnvelope111};')(THREE);
const build = new Function('THREE', 'faceZ', 'createHairContact', read('src/hair-groom.js') + '\nreturn createGroomHair;')(THREE, faceZ, () => { throw new Error('The material source audit does not deform geometry.'); });
const hair = build({ shoulderContact: 0 }), mass = hair.getObjectByName('Overlapping layered S-wave hair around front back and shoulders');
const hash = array => crypto.createHash('sha256').update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength)).digest('hex');
const materialSettings = m => Object.fromEntries(['normalScale', 'roughness', 'anisotropy', 'anisotropyRotation', 'specularIntensity', 'specularColor', 'envMapIntensity', 'alphaTest', 'alphaToCoverage', 'side', 'vertexColors'].map(key => [key, key === 'normalScale' ? m[key].toArray() : m[key]]));
const sampler = t => Object.fromEntries(['format', 'type', 'channel', 'colorSpace', 'wrapS', 'wrapT', 'minFilter', 'magFilter', 'anisotropy', 'flipY', 'generateMipmaps', 'unpackAlignment', 'rotation'].map(key => [key, t[key]]));
const meshes = hair.children.map(mesh => ({ mesh, geometry: mesh.geometry, material: mesh.material, attributes: { ...mesh.geometry.attributes }, index: mesh.geometry.index }));
const arrays = new Map(), textures = new Map();
for (const record of meshes) {
  for (const a of [...Object.values(record.attributes), record.index]) arrays.set(a.array, hash(a.array));
  for (const t of Object.values(record.material)) if (t?.isTexture && !textures.has(t)) textures.set(t, { source: t.source, image: t.image, data: t.image.data, version: t.version, sourceVersion: t.source.version, hash: hash(t.image.data) });
}
const originalMaterial = mass.material, originalColor = mass.geometry.getAttribute('color');
function sourceUnchanged() {
  for (const [array, before] of arrays) assert.equal(hash(array), before, 'Original geometry array bytes changed');
  for (const [t, before] of textures) {
    assert.equal(t.source, before.source); assert.equal(t.image, before.image); assert.equal(t.image.data, before.data);
    assert.equal(t.version, before.version); assert.equal(t.source.version, before.sourceVersion); assert.equal(hash(t.image.data), before.hash); assert.equal(t.disposeCount, 0);
  }
  for (const record of meshes) {
    assert.equal(record.mesh.geometry, record.geometry); assert.equal(record.mesh.geometry.index, record.index);
    if (record.mesh !== mass) assert.equal(record.mesh.material, record.material);
    for (const [key, attribute] of Object.entries(record.attributes)) if (record.mesh !== mass || key !== 'color') assert.equal(record.geometry.getAttribute(key), attribute);
  }
}

const profile = api.buildHairStrandProfile111(), sample = (u, v) => api.sampleHairStrandProfile111(profile, u, v);
let seamError = 0, derivativeError = 0;
for (const u of [-.137, 0, .109, .791, 1, 1.248]) {
  const a = sample(u), b = sample(u + 1); for (let k = 0; k < 3; k++) seamError = Math.max(seamError, Math.abs(a[k] - b[k]));
}
for (const s of profile.strands) for (const t of [.09, .22, .41, .61, .87]) {
  const u = s.start + s.width * t, h = 1e-8;
  derivativeError = Math.max(derivativeError, Math.abs((sample(u + h)[0] - sample(u - h)[0]) / (2 * h) - sample(u)[1]));
}
assert(seamError < 1e-11); assert(derivativeError < 1e-6);
const widths = profile.strands.map(s => s.width), averageWidth = 1 / profile.count;
const widthCV = Math.sqrt(widths.reduce((sum, w) => sum + (w - averageWidth) ** 2, 0) / widths.length) / averageWidth;
assert(widthCV > .25 && widthCV < .65, 'Cross-section spacing must be irregular and bounded');
const off = api.applyHairStrandNormal111(hair, { mode: 0 });
assert.equal(off, api.applyHairStrandNormal111(hair, { mode: 0 })); assert.equal(mass.material, originalMaterial); assert.equal(mass.geometry.getAttribute('color'), originalColor); sourceUnchanged();

const results = []; let normalHash = null;
for (const mode of [1, 2]) {
  const start = performance.now(), metrics = api.applyHairStrandNormal111(hair, { mode });
  const material = mass.material, normal = material.normalMap, data = normal.image.data;
  assert.notEqual(material, originalMaterial); assert.notEqual(normal, originalMaterial.normalMap); assert.notEqual(normal.source, originalMaterial.normalMap.source);
  assert.deepEqual(materialSettings(material), materialSettings(originalMaterial)); assert.deepEqual(sampler(normal), sampler(originalMaterial.normalMap));
  assert.equal(data.byteLength, 512 * 1024 * 4); assert.equal(api.applyHairStrandNormal111(hair, { mode }), metrics);
  assert.throws(() => api.applyHairStrandNormal111(hair, { mode: 0 }), /fresh groom/);
  let unitError = 0, minimumZ = 1, rootNonNeutral = 0, alphaMismatches = 0, slopeDerivativeError = 0;
  for (let y = 0; y < 1024; y++) for (let x = 0; x < 512; x++) {
    const at = (y * 512 + x) * 4, nx = data[at] / 127.5 - 1, ny = data[at + 1] / 127.5 - 1, nz = data[at + 2] / 127.5 - 1;
    assert(Number.isFinite(nx + ny + nz)); unitError = Math.max(unitError, Math.abs(Math.hypot(nx, ny, nz) - 1)); minimumZ = Math.min(minimumZ, nz);
    assert.equal(data[at + 3], 255);
    if (y < 8 && (data[at] !== 128 || data[at + 1] !== 128 || data[at + 2] !== 255)) rootNonNeutral++;
    if (material.map.image.data[at + 3] !== originalMaterial.map.image.data[at + 3]) alphaMismatches++;
    if ([128, 512, 896].includes(y)) {
      const u = (x + .5) / 512, h = 1e-8, finiteSlope = (sample(u + h)[0] - sample(u - h)[0]) / (2 * h);
      slopeDerivativeError = Math.max(slopeDerivativeError, Math.abs(nx / nz + finiteSlope * api.strandEnvelope111((y + .5) / 1024)[0]));
    }
  }
  assert(unitError < .0068 && minimumZ > .65); assert.equal(rootNonNeutral, 0); assert.equal(alphaMismatches, 0); assert(slopeDerivativeError < .013);
  const currentNormalHash = hash(data); if (normalHash) assert.equal(currentNormalHash, normalHash, 'Modes must use exactly the same normal field'); normalHash = currentNormalHash;
  let colorCompensationError = 0;
  if (mode === 1) { assert.equal(material.map, originalMaterial.map); assert.equal(mass.geometry.getAttribute('color'), originalColor); }
  else {
    assert.notEqual(material.map, originalMaterial.map); assert.deepEqual(sampler(material.map), sampler(originalMaterial.map));
    const color = mass.geometry.getAttribute('color'); assert.notEqual(color, originalColor); assert.equal(color.array.byteLength, originalColor.array.byteLength);
    for (let i = 0; i < color.array.length; i++) colorCompensationError = Math.max(colorCompensationError, Math.abs(color.array[i] * .94 - originalColor.array[i]));
    assert(colorCompensationError < 2e-8); assert(metrics.color.linearRowMeanRelativeErrorMax < 1e-12); assert(metrics.color.quantizedLinearRowMeanRelativeErrorMax < .006);
    assert(metrics.color.gainRange[0] > .95 && metrics.color.gainRange[1] < 1.05);
  }
  sourceUnchanged();
  const owned = mode === 2 ? [normal, material.map] : [normal];
  assert.equal(api.releaseHairStrandNormal111(hair), true); assert.equal(api.releaseHairStrandNormal111(hair), false);
  assert.equal(mass.material, originalMaterial); assert.equal(mass.geometry.getAttribute('color'), originalColor); assert.equal(material.disposeCount, 1);
  for (const texture of owned) assert.equal(texture.disposeCount, 1);
  sourceUnchanged();
  results.push({ mode, metrics, normalHash, independentChecks: { quantizedUnitError: unitError, minimumZ, rootNonNeutral, alphaMismatches,
    slopeAgainstFiniteHeightDerivativeError: slopeDerivativeError, colorCompensationError, sourceArraysAndTexturesUnchanged: true,
    otherMeshReferencesUnchanged: true, noExtraGeometry: true, releaseRestoresSourceAndDisposesOnlyOwnedResources: true }, auditMs: performance.now() - start });
}
const cpu = process.cpuUsage(cpuStart), report = { candidate: 111, scoreUnchanged: 76, native: false,
  source: 'Current production hair-groom.js, unposed and shoulderContact=0; material does not depend on either deformation',
  geometry: { meshes: hair.children.length, vertices: hair.children.reduce((n, m) => n + m.geometry.getAttribute('position').count, 0), triangles: hair.userData.triangles, massVertices: mass.geometry.getAttribute('position').count },
  profile: { count: profile.count, widthCoefficientOfVariation: widthCV, periodicSeamError: seamError, analyticSlopeFiniteDifferenceError: derivativeError },
  mode0NoOp: true, results, cost: { wallMs: performance.now() - clockStart, cpuMs: (cpu.user + cpu.system) / 1000, peakRSSMiB: process.resourceUsage().maxRSS / 1024, heapMiB: process.memoryUsage().heapUsed / 1048576 },
  limitations: ['Source harness is not native Three/WebGPU. Native three-mode art comparison remains required.', 'Encoded RGB row means have measured RGBA8 rounding error; normal-map vectors have measured RGBA8 quantization error.', 'Mode2 retains an additional private color texture and replaces the MASS RGB attribute at the same size.'] };
fs.writeFileSync('review/hair-strand-normal111-source-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
