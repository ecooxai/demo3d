import * as THREE from 'three';

// Review-only MASS material experiment. A periodic cross-section of unequal,
// rounded fibre ridges is extruded along existing V; no lateral feature moves
// with V. Geometry supplies the large curl, while this map supplies fine relief.
const VERSION = 'mass-fixed-u-strand-normal-111-v1';
const MASS = 'Overlapping layered S-wave hair around front back and shoulders';
const WIDTH = 512, HEIGHT = 1024, RIDGES = 83, HEADROOM = .94, COLOR_AMPLITUDE = .045;
const applied = new WeakMap();
const OFF = Object.freeze({ version: VERSION, candidate: 111, mode: 0, changed: false, perFrameCPUWork: 0, extraGeometryBytes: 0, extraTextureBytes: 0 });
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const derivative = (a, b, x) => { const t = (x - a) / (b - a); return t > 0 && t < 1 ? 6 * t * (1 - t) / (b - a) : 0; };
const linear = x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
const encoded = x => x <= .0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - .055;
const LINEAR = Float64Array.from({ length: 256 }, (_, i) => linear(i / 255));
function random(seed) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function buildHairStrandProfile111() {
  const r = random(11170439), strands = [], rawWidths = [];
  for (let i = 0; i < RIDGES; i++) rawWidths.push(.55 + 1.8 * r() ** 1.7);
  const total = rawWidths.reduce((a, b) => a + b, 0);
  let start = 0;
  for (let i = 0; i < RIDGES; i++) {
    const width = i === RIDGES - 1 ? 1 - start : rawWidths[i] / total;
    strands.push({ start, width, center: .38 + .24 * r(), height: width * (.11 + .075 * r()),
      leftPower: 1.7 + 1.3 * r(), rightPower: 1.4 + 1.2 * r(), pigment: 2 * r() - 1 });
    start += width;
  }
  return { strands, count: RIDGES, seed: 11170439, longitudinalMetricRatio: .045 };
}

// Return physical cross-section height, dHeight/dU and an independent pigment
// signal. Both height and its first derivative join continuously around U.
export function sampleHairStrandProfile111(profile, u, out = new Float64Array(3)) {
  u -= Math.floor(u);
  const strands = profile.strands;
  let lo = 0, hi = strands.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (strands[mid].start <= u) lo = mid; else hi = mid - 1; }
  const strand = strands[lo], t = (u - strand.start) / strand.width, left = t <= strand.center;
  const reach = left ? strand.center : 1 - strand.center, power = left ? strand.leftPower : strand.rightPower;
  const q = clamp((left ? t : 1 - t) / reach), angle = q * Math.PI * .5, sin = Math.sin(angle);
  out[0] = strand.height * sin ** power;
  out[1] = (left ? 1 : -1) * strand.height * power * Math.PI / (2 * reach * strand.width) * sin ** (power - 1) * Math.cos(angle);
  const center = strand.start + strand.width * strand.center;
  const neighbor = strands[(lo + (u < center ? strands.length - 1 : 1)) % strands.length];
  let otherCenter = neighbor.start + neighbor.width * neighbor.center;
  if (u < center && otherCenter > center) otherCenter -= 1;
  if (u >= center && otherCenter < center) otherCenter += 1;
  const blend = u < center ? smooth(otherCenter, center, u) : smooth(center, otherCenter, u);
  out[2] = u < center ? neighbor.pigment * (1 - blend) + strand.pigment * blend : strand.pigment * (1 - blend) + neighbor.pigment * blend;
  return out;
}

export function strandEnvelope111(v) {
  const root = smooth(.008, .072, v), taper = 1 - .04 * smooth(.12, .94, v);
  return [root * taper, derivative(.008, .072, v) * taper - .04 * root * derivative(.12, .94, v)];
}

function bakeNormal111(profile) {
  const data = new Uint8Array(WIDTH * HEIGHT * 4), heights = new Float64Array(WIDTH), slopes = new Float64Array(WIDTH), pigment = new Float64Array(WIDTH), point = new Float64Array(3);
  let heightMean = 0, pigmentMean = 0, pigmentMin = Infinity, pigmentMax = -Infinity;
  for (let x = 0; x < WIDTH; x++) {
    sampleHairStrandProfile111(profile, (x + .5) / WIDTH, point);
    heights[x] = point[0]; slopes[x] = point[1]; pigment[x] = point[2];
    heightMean += point[0] / WIDTH; pigmentMean += point[2] / WIDTH;
    pigmentMin = Math.min(pigmentMin, point[2]); pigmentMax = Math.max(pigmentMax, point[2]);
  }
  const pigmentScale = Math.max(pigmentMax - pigmentMean, pigmentMean - pigmentMin);
  for (let x = 0; x < WIDTH; x++) pigment[x] = (pigment[x] - pigmentMean) / pigmentScale;
  let maxUnitError = 0, minimumZ = 1, maxTangentX = 0, maxTangentY = 0, tangentEnergy = 0;
  for (let y = 0; y < HEIGHT; y++) {
    const [amplitude, dAmplitude] = strandEnvelope111((y + .5) / HEIGHT);
    for (let x = 0; x < WIDTH; x++) {
      const sx = -slopes[x] * amplitude, sy = -(heights[x] - heightMean) * dAmplitude * profile.longitudinalMetricRatio;
      const length = Math.hypot(sx, sy, 1), nx = sx / length, ny = sy / length, nz = 1 / length, at = (y * WIDTH + x) * 4;
      data[at] = Math.round(127.5 * (nx + 1)); data[at + 1] = Math.round(127.5 * (ny + 1)); data[at + 2] = Math.round(127.5 * (nz + 1)); data[at + 3] = 255;
      maxUnitError = Math.max(maxUnitError, Math.abs(Math.hypot(data[at] / 127.5 - 1, data[at + 1] / 127.5 - 1, data[at + 2] / 127.5 - 1) - 1));
      minimumZ = Math.min(minimumZ, nz); maxTangentX = Math.max(maxTangentX, Math.abs(nx)); maxTangentY = Math.max(maxTangentY, Math.abs(ny)); tangentEnergy += nx * nx;
    }
  }
  return { data, pigment, metrics: { ridgeCount: RIDGES, widthTexels: [Math.min(...profile.strands.map(s => s.width * WIDTH)), Math.max(...profile.strands.map(s => s.width * WIDTH))],
    rawMaxTangentX: maxTangentX, rawMaxTangentY: maxTangentY, rawRmsTangentX: Math.sqrt(tangentEnergy / (WIDTH * HEIGHT)), minimumUnitZ: minimumZ,
    quantizedUnitLengthErrorMax: maxUnitError, rootFadeV: [.008, .072], lengthAmplitudeRangeAfterRoot: [.96, 1], lateralFeatureDisplacement: 0,
    crossSection: 'Unequal rounded fibre domes with independent left/right curvature; periodic C1 height and slope',
    longitudinalVariation: 'One root fade and a four-percent monotone amplitude taper; no U warp, cycles, photographs or per-strand V phase' } };
}

function bakeColor111(original, sourceColor, pigment) {
  const data = original.image.data.slice(), gains = new Float64Array(WIDTH), values = new Float64Array(WIDTH);
  let gainMin = Infinity, gainMax = -Infinity, meanError = 0, quantizedMeanError = 0, alphaMismatches = 0;
  for (let y = 0; y < HEIGHT; y++) {
    const [amplitude] = strandEnvelope111((y + .5) / HEIGHT);
    let before = 0, proposed = 0;
    for (let x = 0; x < WIDTH; x++) {
      const at = (y * WIDTH + x) * 4;
      if (data[at] !== data[at + 1] || data[at] !== data[at + 2]) throw new Error('Candidate111 expects the original neutral MASS modulation map.');
      values[x] = LINEAR[data[at]]; gains[x] = 1 + COLOR_AMPLITUDE * pigment[x] * amplitude;
      before += values[x]; proposed += values[x] * gains[x];
    }
    const normalization = before / proposed;
    let idealSum = 0, encodedSum = 0;
    for (let x = 0; x < WIDTH; x++) {
      const at = (y * WIDTH + x) * 4, gain = gains[x] * normalization, value = values[x] * HEADROOM * gain;
      if (!(value >= 0 && value <= 1)) throw new Error('Candidate111 color headroom is insufficient.');
      const byte = Math.round(encoded(value) * 255);
      data[at] = data[at + 1] = data[at + 2] = byte;
      idealSum += values[x] * gain; encodedSum += LINEAR[byte] / HEADROOM;
      gainMin = Math.min(gainMin, gain); gainMax = Math.max(gainMax, gain);
      if (data[at + 3] !== original.image.data[at + 3]) alphaMismatches++;
    }
    meanError = Math.max(meanError, Math.abs(idealSum / before - 1));
    quantizedMeanError = Math.max(quantizedMeanError, Math.abs(encodedSum / before - 1));
  }
  const colors = sourceColor.array.slice(); let compensationError = 0;
  for (let i = 0; i < sourceColor.count; i++) for (let channel = 0; channel < 3; channel++) {
    const at = i * sourceColor.itemSize + channel;
    colors[at] /= HEADROOM;
    if (!Number.isFinite(colors[at]) || colors[at] < 0 || colors[at] > 1) throw new Error('Candidate111 compensated vertex RGB is outside [0,1].');
    compensationError = Math.max(compensationError, Math.abs(colors[at] * HEADROOM - sourceColor.array[at]));
  }
  return { data, colors, metrics: { headroom: HEADROOM, targetPigmentAmplitude: COLOR_AMPLITUDE, gainRange: [gainMin, gainMax],
    linearRowMeanRelativeErrorMax: meanError, quantizedLinearRowMeanRelativeErrorMax: quantizedMeanError, alphaMismatches,
    vertexCompensationErrorMax: compensationError, replacedVertexColorBytes: colors.byteLength,
    pigmentField: 'Independent fixed-U periodic pigment signal; it contains no baked light or reference-photo pattern',
    normalization: 'Original-linear-albedo-weighted mean of each complete U row; finite RGBA8 error is measured separately' } };
}

function validate111(hair) {
  const mass = hair?.getObjectByName(MASS), geometry = mass?.geometry, material = mass?.material;
  if (!mass?.isMesh || Array.isArray(material) || !geometry?.getAttribute('uv') || !geometry.getAttribute('color')) throw new Error('Candidate111 requires the accepted MASS mesh.');
  for (const [slot, space] of [['normalMap', THREE.NoColorSpace], ['map', THREE.SRGBColorSpace]]) {
    const t = material[slot], image = t?.image;
    if (!t?.isDataTexture || t.format !== THREE.RGBAFormat || t.type !== THREE.UnsignedByteType || !(image?.data instanceof Uint8Array) || image.width !== WIDTH || image.height !== HEIGHT || image.data.length !== WIDTH * HEIGHT * 4 || t.channel !== 0 || t.colorSpace !== space) throw new Error(`Candidate111 requires the accepted RGBA8 UV0 ${slot}.`);
    if (t.wrapS !== THREE.RepeatWrapping || t.wrapT !== THREE.ClampToEdgeWrapping || t.flipY !== false || t.repeat.x !== 1 || t.repeat.y !== 1 || t.offset.x !== 0 || t.offset.y !== 0 || t.rotation !== 0) throw new Error('Candidate111 requires the original periodic-U, clamped-V mapping.');
  }
  if (![3, 4].includes(geometry.getAttribute('color').itemSize) || ![material.normalScale.x, material.normalScale.y].every(Number.isFinite)) throw new Error('Unsupported MASS color or normal scale.');
  return { mass, geometry, material, color: geometry.getAttribute('color') };
}

function privateTexture111(source, data, name) {
  // Texture.copy signals its Source; supply the independent Source first.
  const metadata = Object.create(source);
  metadata.source = new THREE.TextureSource({ data, width: WIDTH, height: HEIGHT });
  const texture = new THREE.DataTexture(); texture.copy(metadata); texture.name = name;
  return texture;
}

export function applyHairStrandNormal111(hair, { mode = 1 } = {}) {
  if (![0, 1, 2].includes(mode)) throw new Error('Candidate111 mode must be 0 (baseline), 1 (normal) or 2 (normal plus weak pigment).');
  const previous = applied.get(hair);
  if (previous) { if (previous.mode !== mode) throw new Error('Compare candidate111 modes on a fresh groom, or release the current mode first.'); return previous.metrics; }
  if (mode === 0) return OFF;
  const started = performance.now(), selected = validate111(hair), profile = buildHairStrandProfile111();
  const normal = bakeNormal111(profile), color = mode === 2 ? bakeColor111(selected.material.map, selected.color, normal.pigment) : null;
  const material = selected.material.clone(), owned = [];
  let colorAttribute = null;
  try {
    material.normalMap = privateTexture111(selected.material.normalMap, normal.data, 'Candidate111 MASS irregular fixed-U strand ridge normals'); owned.push(material.normalMap);
    if (color) {
      material.map = privateTexture111(selected.material.map, color.data, 'Candidate111 MASS weak fixed-U pigment with exact original alpha'); owned.push(material.map);
      colorAttribute = new THREE.Float32BufferAttribute(color.colors, selected.color.itemSize, selected.color.normalized);
      colorAttribute.name = selected.color.name; colorAttribute.setUsage(selected.color.usage);
    }
    const metrics = { version: VERSION, candidate: 111, mode, changed: true, source: 'Original procedural cross-section and pigment; no image assets sampled',
      normal: normal.metrics, color: color?.metrics || null, textureSize: [WIDTH, HEIGHT], normalScaleUnchanged: [material.normalScale.x, material.normalScale.y],
      extraTextureBytes: owned.length * WIDTH * HEIGHT * 4, estimatedExtraMipmappedGPUBytes: owned.length * WIDTH * HEIGHT * 4 * 4 / 3,
      replacedVertexColorBytes: color?.colors.byteLength || 0, retainedOriginalColorBytesForRelease: color?.colors.byteLength || 0,
      activeGeometryByteDelta: 0, extraGeometryBytes: 0, additionalVertices: 0, additionalTriangles: 0, additionalDraws: 0,
      preserves: { geometry: true, positions: true, geometricNormals: true, UV0: true, indices: true, textureAlpha: true, vertexAlpha: true, nonMassMeshes: true, lighting: true },
      perFrameCPUWork: 0, constructionMs: performance.now() - started, export: { standardMaterial: true, normalTexCoord: 0, baseColorTexCoord: 0, inlineRGBAAlpha: true } };
    material.userData = { ...material.userData, strandNormal111: metrics };
    if (colorAttribute) selected.geometry.setAttribute('color', colorAttribute);
    selected.mass.material = material;
    applied.set(hair, { mode, selected, material, owned, colorAttribute, metrics });
    return metrics;
  } catch (error) { material.dispose(); for (const texture of owned) texture.dispose(); throw error; }
}

export function releaseHairStrandNormal111(hair) {
  const record = applied.get(hair); if (!record) return false;
  if (record.selected.mass.material === record.material) record.selected.mass.material = record.selected.material;
  if (record.colorAttribute && record.selected.geometry.getAttribute('color') === record.colorAttribute) record.selected.geometry.setAttribute('color', record.selected.color);
  record.material.dispose(); for (const texture of record.owned) texture.dispose();
  applied.delete(hair); return true;
}
