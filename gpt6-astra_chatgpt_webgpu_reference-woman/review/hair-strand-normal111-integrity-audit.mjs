import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { inspectHairAttribute111 } from './hair-strand-normal111-integrity.js';

const fingerprint = async array => crypto.createHash('sha256').update(new Uint8Array(array.buffer, array.byteOffset, array.byteLength)).digest('hex');
const make = async (array, isIndex = true) => {
  const attribute = { array, version: 0, itemSize: isIndex ? 1 : 3, count: array.length / (isIndex ? 1 : 3), normalized: false, usage: 35044 };
  const before = { ...attribute, hash: await fingerprint(array), isIndex, labels: [{ mesh: 'Controlled audit fixture', attribute: isIndex ? 'index' : 'position' }] };
  return { attribute, before };
};
const inspect = (fixture, nativeIndexUpload = false, stage = 'controlled-native-upload') => inspectHairAttribute111(fixture.attribute, fixture.before, { fingerprint, nativeIndexUpload, stage });
const checks = [];

let fixture = await make(new Uint16Array([0, 2, 1, 2, 3, 1]));
assert.equal((await inspect(fixture)).ok, true); checks.push('Exact no-op bytes, reference and version pass.');
fixture.attribute.array = new Uint32Array(fixture.before.array);
assert.equal((await inspect(fixture)).ok, false); checks.push('Index widening before an explicitly native upload stage fails.');
const widened = await inspect(fixture, true);
assert.equal(widened.ok, true); assert.equal(widened.firstNativeWidening, true);
assert.equal(widened.detail.indexValuesCompared, 6); assert.equal(widened.detail.indexValuesExact, true);
assert.equal(widened.detail.before.version, widened.detail.after.version);
assert.equal(widened.detail.originalArrayHashNow, fixture.before.hash);
assert.notEqual(widened.detail.after.hash, fixture.before.hash);
checks.push('Documented Uint16-to-Uint32 first upload passes only after all index values and original bytes match.');
assert.equal((await inspect(fixture, false, 'candidate-release')).ok, true);
checks.push('An already verified native array remains valid during strict cleanup.');
fixture.attribute.array = new Uint32Array(fixture.attribute.array);
assert.equal((await inspect(fixture, true)).ok, false); checks.push('A second even byte-identical index array replacement fails.');

fixture = await make(new Uint16Array([0, 1, 2]));
fixture.attribute.array = new Uint32Array([0, 2, 1]);
const reordered = await inspect(fixture, true);
assert.equal(reordered.ok, false); assert.equal(reordered.detail.indexValueMismatches, 2);
checks.push('Changed triangle winding fails with exact first mismatches.');
fixture = await make(new Uint16Array([0, 0xffff, 2]));
fixture.attribute.array = new Uint32Array([0, 0xffffffff, 2]);
assert.equal((await inspect(fixture, true)).ok, false); checks.push('Primitive-restart index remapping fails for these triangle meshes.');
fixture = await make(new Uint16Array([0, 1, 2]));
fixture.attribute.array = new Uint32Array(fixture.before.array); fixture.before.array[1] = 2;
assert.equal((await inspect(fixture, true)).ok, false); checks.push('Mutation of the retained original index bytes fails.');

fixture = await make(new Float32Array([.1, .2, .3, .4, .5, .6]), false);
fixture.attribute.array = fixture.attribute.array.slice();
assert.equal((await inspect(fixture, true)).ok, false); checks.push('A byte-identical Float32 geometry array replacement fails.');
fixture = await make(new Float32Array([.1, .2, .3]), false);
fixture.attribute.array[0] += .01;
assert.equal((await inspect(fixture, true)).ok, false); checks.push('Any Float32 source value mutation fails.');
fixture = await make(new Float32Array([.1, .2, .3]), false);
fixture.attribute.version++;
const version = await inspect(fixture, true);
assert.equal(version.ok, false); assert.equal(version.detail.classification, 'unexpected-version-only-change');
checks.push('Version-only changes are explicitly distinguished and still fail.');
fixture = await make(new Uint16Array([0, 1, 2]));
fixture.attribute.array = new Uint32Array(fixture.before.array); fixture.attribute.count++;
assert.equal((await inspect(fixture, true)).ok, false); checks.push('Layout/count changes cannot hide behind native widening.');

// Exercise the actual installed r186 CPU conversion branch against a tiny
// in-memory GPU-buffer fixture. This is source execution, not a native render.
const installedPath = [new URL('../output/qa/three111/WebGPUAttributeUtils.js', import.meta.url),
  new URL('../node_modules/three/src/renderers/webgpu/utils/WebGPUAttributeUtils.js', import.meta.url)].find(file => fs.existsSync(file));
let installedSourceCheck = { ran: false, reason: 'Installed dependency source is absent; pure integrity cases above still ran.' };
if (installedPath) {
  const installed = fs.readFileSync(installedPath, 'utf8');
  const body = installed.replace(/^import[^\n]*\n/gm, '').replace('export default WebGPUAttributeUtils;', 'return WebGPUAttributeUtils;');
  class Descriptor { reset() {} }
  const AttributeUtils = new Function('GPUBufferDescriptor', 'GPUCommandEncoderDescriptor', 'Float16BufferAttribute', 'GPUBufferUsage', body)(Descriptor, Descriptor, class {}, { INDEX: 16 });
  const data = new WeakMap(); let allocations = 0;
  const backend = { get(attribute) { if (!data.has(attribute)) data.set(attribute, {}); return data.get(attribute); },
    device: { createBuffer(descriptor) { allocations++; const buffer = new ArrayBuffer(descriptor.size); return { getMappedRange: () => buffer, unmap() {} }; } } };
  const utility = new AttributeUtils(backend);
  fixture = await make(new Uint16Array([0, 2, 1, 2, 3, 1]));
  utility.createAttribute(fixture.attribute, 16);
  const actualWidening = await inspect(fixture, true, 'actual-installed-createAttribute-CPU');
  assert.equal(actualWidening.ok, true); assert.equal(actualWidening.firstNativeWidening, true); assert.equal(fixture.attribute.version, 0);
  const nativeArray = fixture.attribute.array; utility.createAttribute(fixture.attribute, 16); assert.equal(fixture.attribute.array, nativeArray);
  fixture = await make(new Float32Array([.1, .2, .3]), false); utility.createAttribute(fixture.attribute, 32);
  assert.equal((await inspect(fixture, true)).detail.classification, 'unchanged');
  fixture = await make(new Uint16Array([0, 0xffff, 2])); utility.createAttribute(fixture.attribute, 16);
  assert.equal((await inspect(fixture, true)).ok, false);
  installedSourceCheck = { ran: true, sourceSHA256: crypto.createHash('sha256').update(installed).digest('hex'), fixtureAllocations: allocations,
    indexWidening: actualWidening.detail, float32Unchanged: true, primitiveRestartRemapRejected: true,
    limitation: 'The installed CPU method ran with a minimal in-memory GPU buffer; no native GPU or image validation occurred.' };
  checks.push('Actual installed createAttribute widens indices once without a version increment; Float32 remains exact and restart remapping is rejected.');
}
console.log(JSON.stringify({ candidate: 111, sourceOnly: true, scoreUnchanged: 76, result: 'PASS', checks, installedSourceCheck }, null, 2));
