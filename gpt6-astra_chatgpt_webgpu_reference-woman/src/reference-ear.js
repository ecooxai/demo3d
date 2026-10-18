import referenceURL from '../reference/image1-color.jpg';

// Candidate 70: a small, source-only pigment field on the accepted ear shells.
// These are manually selected skin patches from image 1. No photograph is
// projected onto the ear, and no hair, silhouette, highlight, or shadow texture
// is created. The hidden upper bowl/right ear use a restrained color inference.
const VERSION = 'reference-ear-color-70-v1';
const IMAGE_WIDTH = 1024, IMAGE_HEIGHT = 1536;
const BIT_STEP = 256;
const states = new WeakMap();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ellipse = (u, v, x, y, rx, ry) => Math.exp(-(((u - x) / rx) ** 2 + ((v - y) / ry) ** 2));
const luma = rgb => .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
const linear = value => { const x = value / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; };
const encoded = value => Math.round(255 * (value <= .0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - .055));
const floatScratch = new Float32Array(1);
const bitsScratch = new Uint32Array(floatScratch.buffer);
let palettePromise;

// Patch entries are [center X, center Y, radius X, radius Y], in the supplied
// 1024 x 1536 image. Small elliptical footprints avoid adjacent fine hair.
// The exposed lower concha/crease supplies only a compressed warm tone; its
// photographic shade is not treated as measured physical skin albedo.
const PATCHES = {
  cheek: [[358, 518, 2, 2], [359, 505, 2, 2]],
  lobule: [[280, 491, 2, 2], [284, 498, 2, 2], [286, 502, 2, 2]],
  helix: [[262, 351, 2, 1], [264, 352, 1, 1]],
  concha: [[267, 443, 2, 2], [269, 458, 2, 2]],
  fold: [[277, 453, 2, 2], [281, 469, 2, 2]],
};
const HELIX = [[-.68, .46], [-.68, .72], [-.19, .90], [.40, .83],
  [.72, .55], [.82, .15], [.65, -.30], [.34, -.66], [-.07, -.84]];

function patchColor(source, canvas, context, spec) {
  const [cx, cy, rx, ry] = spec, scaleX = source.naturalWidth / IMAGE_WIDTH, scaleY = source.naturalHeight / IMAGE_HEIGHT;
  const left = Math.floor((cx - rx) * scaleX), top = Math.floor((cy - ry) * scaleY);
  const width = Math.max(1, Math.ceil((cx + rx + 1) * scaleX) - left);
  const height = Math.max(1, Math.ceil((cy + ry + 1) * scaleY) - top);
  canvas.width = width; canvas.height = height;
  context.drawImage(source, left, top, width, height, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height).data, samples = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dx = ((left + x + .5) / scaleX - cx - .5) / (rx + .35);
    const dy = ((top + y + .5) / scaleY - cy - .5) / (ry + .35), radius = dx * dx + dy * dy;
    if (radius > 1) continue;
    const at = (y * width + x) * 4;
    if (data[at + 3] < 250) continue;
    const rgb = [linear(data[at]), linear(data[at + 1]), linear(data[at + 2])], value = luma(rgb);
    // Guard against an unexpected transparent/black source edge. Selection is
    // manual; this is not a full-image skin or hair classifier.
    if (value < .035) continue;
    samples.push({ rgb, value, weight: Math.exp(-1.4 * radius) });
  }
  if (samples.length < 3) throw new Error('A manually selected ear patch contains too little source skin color.');
  samples.sort((a, b) => a.value - b.value);
  // Trim a few dark strand outliers and bright highlight pixels, then average.
  const begin = Math.floor(samples.length * .20), end = Math.max(begin + 1, Math.ceil(samples.length * .90));
  const rgb = [0, 0, 0]; let total = 0;
  for (let i = begin; i < end; i++) {
    const sample = samples[i]; total += sample.weight;
    for (let ch = 0; ch < 3; ch++) rgb[ch] += sample.rgb[ch] * sample.weight;
  }
  for (let ch = 0; ch < 3; ch++) rgb[ch] /= total;
  return { rgb, sampledPixels: samples.length, pixelBufferBytes: data.byteLength };
}

function relativeTone(rgb, anchor, brightnessScale, brightnessLimit, chromaScale, chromaLimit) {
  const y = Math.max(1e-6, luma(rgb)), referenceY = Math.max(1e-6, luma(anchor));
  const brightness = brightnessLimit * Math.tanh(brightnessScale * Math.log(y / referenceY) / brightnessLimit);
  return rgb.map((value, ch) => {
    const ratio = Math.log(Math.max(1e-6, value / y) / Math.max(1e-6, anchor[ch] / referenceY));
    return brightness + chromaLimit * Math.tanh(chromaScale * ratio / chromaLimit);
  });
}

async function readPalette() {
  const source = new Image(); source.decoding = 'async'; source.src = referenceURL;
  await source.decode();
  if (source.naturalWidth < 2 || source.naturalHeight < 2
    || Math.abs(source.naturalWidth / source.naturalHeight - IMAGE_WIDTH / IMAGE_HEIGHT) > .001) {
    throw new Error('The ear color layer requires image 1 in its original portrait aspect ratio.');
  }
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not read the supplied ear color patches.');
  const colors = {}, summaries = {}; let sampledPixels = 0, largestPixelBufferBytes = 0;
  try {
    for (const [name, patches] of Object.entries(PATCHES)) {
      const rgb = [0, 0, 0];
      for (const spec of patches) {
        const sample = patchColor(source, canvas, context, spec);
        sampledPixels += sample.sampledPixels;
        largestPixelBufferBytes = Math.max(largestPixelBufferBytes, sample.pixelBufferBytes);
        for (let ch = 0; ch < 3; ch++) rgb[ch] += sample.rgb[ch] / patches.length;
      }
      colors[name] = rgb; summaries[name] = rgb.map(encoded);
    }
    return {
      // The common ear/cheek relationship is deliberately weak. Local hue and
      // luminance differences are also bounded so lighting remains geometric.
      common: relativeTone(colors.lobule, colors.cheek, .30, .095, .12, .022),
      helix: relativeTone(colors.helix, colors.lobule, .18, .075, .14, .025),
      concha: relativeTone(colors.concha, colors.lobule, .19, .135, .16, .033),
      fold: relativeTone(colors.fold, colors.lobule, .17, .070, .14, .023),
      summaries, sampledPixels, largestPixelBufferBytes,
    };
  } finally {
    canvas.width = 1; canvas.height = 1;
    source.removeAttribute?.('src');
  }
}

function palette() {
  if (!palettePromise) palettePromise = readPalette().catch(error => { palettePromise = null; throw error; });
  return palettePromise;
}

function helixWeight(u, v) {
  let nearest = Infinity;
  const x = u * .128, y = v * .29554290750644;
  for (let i = 1; i < HELIX.length; i++) {
    const a = HELIX[i - 1], b = HELIX[i], ax = a[0] * .128, ay = a[1] * .29554290750644;
    const dx = (b[0] - a[0]) * .128, dy = (b[1] - a[1]) * .29554290750644;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy));
    nearest = Math.min(nearest, (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2);
  }
  return Math.exp(-nearest / (.033 * .033));
}

function collectEars(head) {
  const entries = [], seen = new Set();
  head.traverse(mesh => {
    if (!mesh.isMesh || mesh.name !== 'ear-continuous-anatomical-shell') return;
    const geometry = mesh.geometry, color = geometry.getAttribute('color'), uv = geometry.getAttribute('uv');
    const normal = geometry.getAttribute('normal'), position = geometry.getAttribute('position');
    if (!color || !(color.array instanceof Float32Array) || ![3, 4].includes(color.itemSize)
      || !uv || !normal || !position || color.count !== uv.count || color.count !== normal.count || color.count !== position.count
      || color.isInterleavedBufferAttribute || uv.isInterleavedBufferAttribute || normal.isInterleavedBufferAttribute) {
      throw new Error('The optional ear color layer expects the accepted ear shell with Float32 vertex colors, UVs, and normals.');
    }
    if (seen.has(color)) return;
    seen.add(color);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.some(material => !material?.vertexColors)) throw new Error('The accepted ear material must retain vertex colors.');
    entries.push({ mesh, color, array: color.array, bits: new Uint32Array(color.array.buffer, color.array.byteOffset, color.array.length),
      position, uv, normal, version: color.version, positionVersion: position.version, uvVersion: uv.version, normalVersion: normal.version,
      offsets: new Int16Array(color.count * 3), appliedStrength: 0 });
  });
  if (!entries.length) throw new Error('No accepted anatomical ear shells were found in this head.');
  return entries;
}

function bake(entries, source) {
  let mappedVertices = 0, minimumGain = Infinity, maximumGain = 0;
  for (const entry of entries) {
    const { color, bits, uv, normal, offsets } = entry;
    for (let i = 0; i < color.count; i++) {
      const u = uv.getX(i) * 2 - 1, v = uv.getY(i) * 2 - 1;
      const front = smooth(-.25, .65, normal.getZ(i));
      const cup = clamp(.88 * ellipse(u, v, -.29, -.19, .36, .31)
        + .24 * ellipse(u, v, -.33, .24, .30, .22));
      const rim = .55 * helixWeight(u, v) * (1 - .65 * cup);
      const fold = .30 * ellipse(u, v, -.25, -.48, .25, .17)
        + .22 * ellipse(u, v, .13, .03, .19, .53);
      const lobule = .50 * ellipse(u, v, -.09, -.80, .60, .25);
      const denominator = Math.max(1, cup + rim + fold + lobule);
      for (let ch = 0; ch < 3; ch++) {
        const at = i * color.itemSize + ch, baseline = color.array[at];
        if (!Number.isFinite(baseline) || baseline <= 0 || baseline > 1) throw new Error('Ear colors must be positive finite linear Float32 values.');
        // Rear cartilage receives only a weak common hue. The single supplied
        // image does not establish a detailed rear-ear color map.
        const logGain = source.common[ch] * (.38 + .62 * front)
          + front * (cup * source.concha[ch] + rim * source.helix[ch] + fold * source.fold[ch]) / denominator;
        const gain = Math.exp(clamp(logGain, -.245, .070));
        minimumGain = Math.min(minimumGain, gain); maximumGain = Math.max(maximumGain, gain);
        floatScratch[0] = clamp(baseline * gain, 1e-6, 1);
        const offset = Math.round((bitsScratch[0] - bits[at]) / BIT_STEP);
        if (Math.abs(offset) > 32767) throw new Error('An ear color adjustment exceeded the bounded reversible storage range.');
        offsets[i * 3 + ch] = offset;
      }
      mappedVertices++;
    }
  }
  return { meshes: entries.length, mappedVertices, retainedBytes: entries.reduce((sum, entry) => sum + entry.offsets.byteLength, 0),
    minimumFullStrengthGain: Number(minimumGain.toFixed(5)), maximumFullStrengthGain: Number(maximumGain.toFixed(5)),
    sampledSourcePixels: source.sampledPixels, largestTransientPixelBufferBytes: source.largestPixelBufferBytes,
    sourcePatchColorsSRGB: source.summaries };
}

function validate(entry) {
  const geometry = entry.mesh.geometry;
  if (geometry.getAttribute('color') !== entry.color || entry.color.array !== entry.array || entry.color.version !== entry.version
    || geometry.getAttribute('position') !== entry.position || entry.position.version !== entry.positionVersion
    || geometry.getAttribute('uv') !== entry.uv || entry.uv.version !== entry.uvVersion
    || geometry.getAttribute('normal') !== entry.normal || entry.normal.version !== entry.normalVersion) {
    throw new Error('The ear geometry or colors changed after this color layer was prepared; apply it to a fresh accepted head.');
  }
}

function setStrength(entry, strength) {
  let changed = false;
  for (let i = 0; i < entry.color.count; i++) for (let ch = 0; ch < 3; ch++) {
    const offset = entry.offsets[i * 3 + ch];
    const before = Math.round(offset * entry.appliedStrength), after = Math.round(offset * strength);
    if (before === after) continue;
    const at = i * entry.color.itemSize + ch;
    // Positive Float32 bits are monotone. Integer steps restore the original
    // colors exactly, without retaining a second RGB buffer or accumulating
    // divide/multiply drift as the reviewer changes strength.
    entry.bits[at] += (after - before) * BIT_STEP; changed = true;
  }
  if (changed) entry.color.needsUpdate = true;
  entry.version = entry.color.version; entry.appliedStrength = strength;
}

/**
 * Optional pigment variation from image 1, applied to existing ear vertex RGB.
 * Call after the head's face color and geometry/pose setup, before first render.
 * strength 0 restores exact original Float32 bits; identical repeated strengths
 * are no-ops. Positions, normals, UVs, alpha, materials, and textures are untouched.
 * Both ears use the same inferred hue field, with weak variation on their backs.
 */
export async function applyReferenceEarColor(head, { strength = .5 } = {}) {
  if (!head?.isObject3D || !Number.isFinite(strength)) throw new TypeError('Pass the anatomical head and a finite ear color strength.');
  strength = clamp(strength);
  let state = states.get(head);
  if (!state) { state = { pending: Promise.resolve(), entries: null, strength: 0, metrics: null }; states.set(head, state); }
  const operation = state.pending.then(async () => {
    const start = performance.now();
    if (!state.entries && strength > 0) {
      const source = await palette(), entries = collectEars(head);
      const metrics = bake(entries, source); state.entries = entries; state.metrics = metrics;
    }
    const unchanged = strength === state.strength;
    if (state.entries) {
      for (const entry of state.entries) validate(entry);
      if (!unchanged) for (const entry of state.entries) setStrength(entry, strength);
    }
    state.strength = strength;
    const result = { version: VERSION, strength, status: unchanged ? 'unchanged' : strength ? 'applied' : 'baseline-restored',
      ...(state.metrics || { meshes: 0, mappedVertices: 0, retainedBytes: 0 }),
      elapsedMs: Number((performance.now() - start).toFixed(2)), baselineColorBytesRetained: 0,
      texturesAdded: 0, drawCallsAdded: 0, geometryChanged: false, normalsChanged: false, uvChanged: false, alphaChanged: false, materialsChanged: false,
      source: 'Only image 1: hand-selected visible left-ear skin patches; restrained, symmetric pigment inference on the original ear shells.' };
    head.userData.referenceEarColor = result;
    return result;
  });
  state.pending = operation.then(() => undefined, () => undefined);
  return operation;
}
