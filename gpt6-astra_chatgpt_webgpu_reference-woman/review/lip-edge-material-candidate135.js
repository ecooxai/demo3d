import * as THREE from 'three';

// Review-only physical-material response study on the accepted full130 lips.
// UV0 and all authored geometry values stay fixed. One shared linear RGBA8 map
// supplies clearcoat in R and roughness in G through a dedicated texel-centered
// UV1. All temporary geometry buffers are private for actual r186 disposal.
const VERSION = 'lip-edge-material-135', NX = 100, NY = 16, SIZE = 128;
const HALF_WIDTH = .241, X_FULL = .18, X_END = .235, BORDER = .35;
const LIP_ROUGHNESS = .44, FACE_ROUGHNESS = .53, LIP_CLEARCOAT = .12;
const NAMES = Object.freeze(['upper-lip', 'lower-lip']);
const applications = new WeakMap();
const step = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (-15 + 6 * t));
const now = () => typeof performance === 'object' ? performance.now() : Date.now();
const centralRoughness = FACE_ROUGHNESS * Math.round(255 * LIP_ROUGHNESS / FACE_ROUGHNESS) / 255;

export const LIP_EDGE_MATERIAL135_SPEC = Object.freeze({ version: VERSION, targets: NAMES,
  geometryVersion: 'outer-lip-continuity-130', geometryStrength: 1, grid: Object.freeze([NX, NY]),
  size: Object.freeze([SIZE, SIZE]), mapBytes: SIZE * SIZE * 4, channel: 1,
  halfWidth: HALF_WIDTH, cornerGate: Object.freeze([X_FULL, X_END]), borderFraction: BORDER,
  roughness: Object.freeze([LIP_ROUGHNESS, FACE_ROUGHNESS]), clearcoat: LIP_CLEARCOAT,
  centralQuantizedRoughness: centralRoughness, centralRoughnessBias: centralRoughness - LIP_ROUGHNESS,
  maxRoughnessTexelQuantization: FACE_ROUGHNESS / 510, maxClearcoatTexelQuantization: LIP_CLEARCOAT / 510,
  mipmaps: false, filtering: 'linear', mapColorSpace: 'linear numerical data',
  channels: Object.freeze({ R: 'clearcoat / 0.12', G: 'roughness / 0.53', B: 'unused zero', A: 'opaque' }) });

// Grid v=0 is the outer border and v=1 is the protected mouth closure.
export function sampleLipEdgeMask135(u, v) {
  const x = HALF_WIDTH * (2 * u - 1);
  return (1 - step((Math.abs(x) - X_FULL) / (X_END - X_FULL))) * (1 - step(v / BORDER));
}

export function makeLipEdgePixels135() {
  const data = new Uint8Array(SIZE * SIZE * 4);
  let maximumRoughnessTexelError = 0, maximumClearcoatTexelError = 0;
  for (let j = 0; j < SIZE; j++) for (let i = 0; i < SIZE; i++) {
    const m = sampleLipEdgeMask135(i / (SIZE - 1), j / (SIZE - 1)), roughness = LIP_ROUGHNESS + (FACE_ROUGHNESS - LIP_ROUGHNESS) * m;
    const k = 4 * (j * SIZE + i); data[k] = Math.round(255 * (1 - m)); data[k + 1] = Math.round(255 * roughness / FACE_ROUGHNESS);
    data[k + 2] = 0; data[k + 3] = 255;
    maximumRoughnessTexelError = Math.max(maximumRoughnessTexelError, Math.abs(FACE_ROUGHNESS * data[k + 1] / 255 - roughness));
    maximumClearcoatTexelError = Math.max(maximumClearcoatTexelError, Math.abs(LIP_CLEARCOAT * data[k] / 255 - LIP_CLEARCOAT * (1 - m)));
  }
  return { data, width: SIZE, height: SIZE, maximumRoughnessTexelError, maximumClearcoatTexelError };
}

// Endpoints lie at the first/last texel centers, so the sampled map interpolates
// the intended parameter grid rather than stretching it by half a texel.
export function lipEdgeUV135(u, v) { return [(.5 + (SIZE - 1) * u) / SIZE, (.5 + (SIZE - 1) * v) / SIZE]; }

function collect(head, geometry130) {
  if (!head?.isObject3D) throw new TypeError('135 requires the anatomical head.');
  if (geometry130?.version !== LIP_EDGE_MATERIAL135_SPEC.geometryVersion || geometry130.strength !== 1 || geometry130.applied !== true)
    throw new Error('135 requires the accepted full130 geometry metrics.');
  const records = [];
  head.traverse(mesh => {
    if (!mesh.isMesh || !NAMES.includes(mesh.name)) return;
    const geometry = mesh.geometry, material = mesh.material, position = geometry?.getAttribute('position'), normal = geometry?.getAttribute('normal'), uv = geometry?.getAttribute('uv');
    if (mesh.isSkinnedMesh || mesh.isInstancedMesh || !material?.isMeshPhysicalMaterial || Array.isArray(material)
      || !position || !normal || !uv || position.count !== (NX + 1) * (NY + 1) || normal.count !== position.count || uv.count !== position.count
      || position.itemSize !== 3 || normal.itemSize !== 3 || uv.itemSize !== 2 || !geometry.index || geometry.index.count !== NX * NY * 6
      || geometry.getAttribute('uv1') || Object.values(geometry.morphAttributes || {}).some(values => values.length)
      || Object.values(geometry.attributes).some(attribute => attribute.isInterleavedBufferAttribute)
      || geometry.index.isInterleavedBufferAttribute) throw new Error(`135 encountered an unsupported lip layout: ${mesh.name}.`);
    if (material.roughness !== LIP_ROUGHNESS || material.clearcoat !== LIP_CLEARCOAT || material.clearcoatRoughness !== .30
      || material.specularIntensity !== .23 || material.roughnessMap || material.clearcoatMap || !material.map || material.map.channel !== 0)
      throw new Error(`135 requires the accepted unmodified lip material: ${mesh.name}.`);
    // This relationship was guarded through130's actual preparation chain.
    //135 only adds an independent coordinate field; it never rewrites UV0.
    for (let row = 0; row <= NY; row++) for (let col = 0; col <= NX; col++) {
      const i = row * (NX + 1) + col, x = -HALF_WIDTH + 2 * HALF_WIDTH * col / NX;
      if (Math.abs(2 * uv.getX(i) - 1 - x) > 1.2e-6) throw new Error(`135 original lip grid/UV0 correspondence changed: ${mesh.name}.`);
    }
    records.push({ mesh, originalGeometry: geometry, originalMaterial: material });
  });
  if (records.length !== 2 || NAMES.some(name => records.filter(record => record.mesh.name === name).length !== 1)) throw new Error('135 needs exactly the original upper and lower lip.');
  return records;
}

function cloneGeometry(original) {
  const geometry = new THREE.BufferGeometry();
  try {
    geometry.name = original.name; geometry.userData = { ...original.userData };
    for (const [key, attribute] of Object.entries(original.attributes)) geometry.setAttribute(key, attribute.clone());
    geometry.setIndex(original.index.clone());
    for (const group of original.groups || []) geometry.addGroup(group.start, group.count, group.materialIndex);
    geometry.setDrawRange(original.drawRange.start, original.drawRange.count);
    geometry.boundingBox = original.boundingBox?.clone() || null; geometry.boundingSphere = original.boundingSphere?.clone() || null;
    const uv1 = new Float32Array((NX + 1) * (NY + 1) * 2);
    for (let row = 0; row <= NY; row++) for (let col = 0; col <= NX; col++) {
      const k = (row * (NX + 1) + col) * 2, uv = lipEdgeUV135(col / NX, row / NY); uv1[k] = uv[0]; uv1[k + 1] = uv[1];
    }
    geometry.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
    geometry.userData.lipEdgeMaterial135 = { version: VERSION, coordinateChannel: 1, originalAttributesUnchanged: true };
    return geometry;
  } catch (error) { geometry.dispose(); throw error; }
}

function makePackedMap(pixels) {
  const map = new THREE.DataTexture(pixels.data, SIZE, SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
  map.name = 'GPT-6 Astra / ChatGPT / WebGPU:135 original lip response field';
  map.channel = 1; map.colorSpace = THREE.NoColorSpace; map.flipY = false;
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; map.minFilter = map.magFilter = THREE.LinearFilter;
  map.generateMipmaps = false; map.anisotropy = 1; map.premultiplyAlpha = false; map.unpackAlignment = 1;
  map.userData.lipEdgeMaterial135 = { version: VERSION, provenance: 'Original procedural parameter field; no photographic pixels',
    packing: 'R clearcoat / .12, G roughness / .53, B unused0, A255', coordinateChannel: 1, centralRoughness,
    centralRoughnessBias: centralRoughness - LIP_ROUGHNESS, originalColorAtlasChanged: false };
  map.needsUpdate = true; return map;
}

/**
 * Apply once after the accepted full130 geometry inside scene preparation.
 * Strength0 is a no-op. Strength1 returns metrics directly and owns2 geometry
 * clones,2 material clones and1 shared map. Existing images/textures are shared
 * unchanged. No shader hooks, additional groups or per-frame work are added.
 */
export function applyLipEdgeMaterial135(head, { strength = 0, geometry130 } = {}) {
  if (![0, 1].includes(strength)) throw new RangeError('135 supports only the isolated baseline0 or response blend1.');
  const old = applications.get(head);
  if (old) { if (old.strength !== strength) throw new Error('135 requires release or a fresh head before changing modes.'); return old.metrics; }
  const originals = collect(head, geometry130);
  if (!strength) return { version: VERSION, strength, applied: false, geometryVersion: geometry130.version,
    privateGeometryCount: 0, privateMaterialCount: 0, privateMapCount: 0, privateGeometryBytes: 0, mapBytes: 0, elapsedMs: 0 };
  const started = now(), pixels = makeLipEdgePixels135(), staged = [], map = makePackedMap(pixels);
  try {
    for (const record of originals) {
      const geometry = cloneGeometry(record.originalGeometry), active = { ...record, geometry, material: null }; staged.push(active);
      active.material = record.originalMaterial.clone();
      active.material.roughness = FACE_ROUGHNESS; active.material.roughnessMap = map; active.material.clearcoatMap = map;
      active.material.userData = { ...record.originalMaterial.userData, lipEdgeMaterial135: { version: VERSION,
        originalRoughness: LIP_ROUGHNESS, edgeRoughness: FACE_ROUGHNESS, centralQuantizedRoughness: centralRoughness,
        originalClearcoat: LIP_CLEARCOAT, edgeClearcoat: 0, protectedCentralV: BORDER, cornerGate: [X_FULL, X_END],
        originalGeometryValuesUnchanged: true, originalUV0Unchanged: true, originalColorAtlasUnchanged: true } };
      active.material.needsUpdate = true;
    }
  } catch (error) { for (const record of staged) { record.geometry.dispose(); record.material?.dispose(); } map.dispose(); throw error; }
  const metrics = { version: VERSION, strength, applied: true, geometryVersion: geometry130.version, geometryStrength: geometry130.strength,
    privateGeometryCount: 2, privateMaterialCount: 2, privateMapCount: 1,
    privateGeometryBytes: staged.reduce((sum, record) => sum + Object.values(record.geometry.attributes).reduce((bytes, attribute) => bytes + attribute.array.byteLength, record.geometry.index.array.byteLength), 0),
    addedUV1Bytes: (NX + 1) * (NY + 1) * 2 * 4 * 2, mapBytes: pixels.data.byteLength,
    mapSize: [SIZE, SIZE], mapChannel: 1, mipmaps: false, shaderHooksAdded: false, extraDrawGroups: 0, perFrameWorkAdded: false,
    maximumRoughnessTexelError: pixels.maximumRoughnessTexelError, maximumClearcoatTexelError: pixels.maximumClearcoatTexelError,
    centralRoughness, centralRoughnessBias: centralRoughness - LIP_ROUGHNESS, centralClearcoat: LIP_CLEARCOAT,
    originalPositionNormalUV0ColorIndexValuesUnchanged: true, originalTexturesUnchanged: true, elapsedMs: now() - started };
  for (const record of staged) { record.mesh.geometry = record.geometry; record.mesh.material = record.material; }
  applications.set(head, { strength, staged, map, metrics }); return metrics;
}

export function releaseLipEdgeMaterial135(head) {
  const record = applications.get(head);
  if (!record) return { released: false, privateGeometriesDisposed: 0, privateMaterialsDisposed: 0, privateMapsDisposed: 0, geometryBytesReleased: 0, mapBytesReleased: 0 };
  for (const item of record.staged) if (item.mesh.geometry !== item.geometry || item.mesh.material !== item.material)
    throw new Error('135 refuses to release a lip object replaced by another study.');
  for (const item of record.staged) { item.mesh.geometry = item.originalGeometry; item.mesh.material = item.originalMaterial; }
  for (const item of record.staged) { item.geometry.dispose(); item.material.dispose(); }
  record.map.dispose(); applications.delete(head);
  return { released: true, privateGeometriesDisposed: 2, privateMaterialsDisposed: 2, privateMapsDisposed: 1,
    geometryBytesReleased: record.metrics.privateGeometryBytes, mapBytesReleased: record.metrics.mapBytes };
}
