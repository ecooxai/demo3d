// Review-only attribute audit. Three r186 WebGPUAttributeUtils.createAttribute
// widens non-normalized Uint16 indices to Uint32 on first GPU upload. Keep the
// original bytes and every topology value exact; do not mistake that single,
// documented storage conversion for a candidate geometry edit.
export async function inspectHairAttribute111(attribute, before, { stage, nativeIndexUpload = false, fingerprint }) {
  const array = attribute.array, originalHash = await fingerprint(before.array);
  const currentHash = array === before.array ? originalHash : await fingerprint(array);
  const detail = { stage, labels: before.labels,
    before: { type: before.array.constructor.name, length: before.array.length, bytes: before.array.byteLength, hash: before.hash,
      version: before.version, itemSize: before.itemSize, count: before.count, normalized: before.normalized },
    after: { type: array.constructor.name, length: array.length, bytes: array.byteLength, hash: currentHash,
      version: attribute.version, itemSize: attribute.itemSize, count: attribute.count, normalized: attribute.normalized },
    originalArrayHashNow: originalHash, originalArrayBytesUnchanged: originalHash === before.hash,
    sameOriginalArrayReference: array === before.array, versionChanged: attribute.version !== before.version };
  const violations = [];
  if (originalHash !== before.hash) violations.push('Original source array bytes changed.');
  if (attribute.version !== before.version) violations.push('BufferAttribute.version changed; this is not explained by the installed WebGPU index widening.');
  if (attribute.itemSize !== before.itemSize || attribute.count !== before.count || attribute.normalized !== before.normalized || attribute.usage !== before.usage) violations.push('Attribute layout, count, normalization or usage changed.');

  let firstNativeWidening = false;
  if (array !== before.array) {
    const native = before.nativeIndex;
    if (native) {
      if (array !== native.array || currentHash !== native.hash) violations.push('The previously verified native Uint32 index array changed.');
      detail.indexValuesCompared = native.count;
      detail.indexValuesExact = array === native.array && currentHash === native.hash;
      detail.nativeIndexFirstStage = native.stage;
    } else {
      const eligible = nativeIndexUpload && before.isIndex && before.array.constructor === Uint16Array && array.constructor === Uint32Array
        && before.itemSize === 1 && before.normalized === false && !attribute.isInterleavedBufferAttribute && array.length === before.array.length;
      if (eligible) {
        let mismatches = 0; const firstMismatches = [];
        for (let i = 0; i < array.length; i++) if (array[i] !== before.array[i]) {
          mismatches++;
          if (firstMismatches.length < 4) firstMismatches.push({ at: i, before: before.array[i], after: array[i] });
        }
        detail.indexValuesCompared = array.length; detail.indexValueMismatches = mismatches;
        detail.indexValuesExact = mismatches === 0; detail.firstIndexMismatches = firstMismatches;
        if (mismatches) violations.push('Native index representation changed topology values, including any primitive-restart remap.');
        else if (!violations.length) {
          before.nativeIndex = { array, hash: currentHash, count: array.length, stage };
          firstNativeWidening = true;
        }
      } else violations.push('Unexpected array replacement outside the permitted first native Uint16-index upload.');
    }
  } else if (before.nativeIndex) violations.push('The verified native Uint32 index array was replaced by the original Uint16 array.');

  const changed = array !== before.array || attribute.version !== before.version || originalHash !== before.hash || violations.length > 0;
  detail.classification = violations.length ? (detail.versionChanged && array === before.array && originalHash === before.hash ? 'unexpected-version-only-change' : 'integrity-violation')
    : array !== before.array ? 'verified-native-index-widening' : 'unchanged';
  return { ok: violations.length === 0, changed, firstNativeWidening, detail, violations };
}
