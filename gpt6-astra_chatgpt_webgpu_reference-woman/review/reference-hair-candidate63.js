import referenceURL from '../reference/image1-color.jpg';

// Candidate 63. The only sampled image is the user's reference. These manually
// bounded charts describe hair interiors, not a segmentation or a new surface.
// Colors attach to the existing crown and mass vertices; authored fine fibers,
// fringe, geometry, UVs, alpha, materials and their procedural maps stay intact.
// Call after the accepted head/neck pose has updated world matrices.
const VERSION = 'reference-hair-color-63-v1';
const states = new WeakMap();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const WIDTH = 64, HEIGHT = 96, BIT_STEP = 128;
const IMAGE_WIDTH = 1024, IMAGE_HEIGHT = 1536;
const VIEW_WIDTH = 796, VIEW_HEIGHT = 1061, VIEW_SPAN = 6.4, VIEW_CENTER_Y = 1.55;
const MESH_NAMES = new Set([
  'Continuous parted crown with longitudinal fiber flow',
  'Overlapping layered S-wave hair around front back and shoulders',
]);
const toLinear = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const x = i / 255;
  toLinear[i] = x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
}

// Rows: accepted-57 viewer Y, viewer hair left/right, reference Y, and a
// conservative reference hair-only left/right corridor. Fine edge strands,
// scalp/skin, the visible ear, white cloth, and the transparent background are
// deliberately outside the sampled corridors. The source corridors are inset
// more than the modeled silhouette, so only interior hair color is transferred.
const CHART_ROWS = [
  { name: 'left-crown', rows: [
    [36, 423, 506, 50, 438, 557], [64, 377, 535, 94, 362, 562],
    [105, 338, 536, 158, 306, 528], [155, 307, 487, 242, 270, 465],
    [205, 290, 412, 307, 248, 380], [232, 286, 335, 346, 231, 260],
  ] },
  { name: 'right-crown', rows: [
    [38, 508, 530, 55, 586, 620], [75, 536, 572, 130, 625, 694],
    [120, 548, 604, 220, 682, 755], [180, 557, 612, 320, 718, 795],
    [245, 573, 611, 420, 732, 813], [302, 573, 604, 510, 714, 832],
  ] },
  { name: 'left-lengths', rows: [
    [233, 268, 303, 370, 208, 237], [300, 261, 311, 482, 189, 252],
    [390, 256, 315, 630, 174, 301], [488, 235, 353, 790, 165, 317],
    [598, 211, 355, 945, 170, 305], [705, 195, 336, 1110, 145, 270],
    [810, 183, 323, 1270, 119, 251], [905, 187, 324, 1400, 144, 251],
    [968, 235, 316, 1470, 226, 260],
  ] },
  { name: 'right-lengths', rows: [
    [260, 575, 614, 445, 739, 808], [370, 564, 622, 620, 707, 839],
    [485, 562, 647, 790, 642, 881], [595, 561, 695, 950, 624, 901],
    [710, 569, 731, 1110, 688, 894], [824, 567, 719, 1280, 712, 870],
    [918, 564, 672, 1410, 664, 790], [968, 551, 632, 1470, 654, 730],
  ] },
];

// Small, visually chosen interior-hair anchors establish a common color level.
// They do not locate features or inspect the image for masks or correspondences.
const ANCHORS = [[390,150],[325,220],[740,265],[761,410],
  [240,740],[218,1055],[682,845],[793,1120],[792,1300]];

function makeChart(spec) {
  const rows = spec.rows;
  const slopes = rows.map((r, i) => r.map((v, column) => {
    if (!column) return 1;
    if (!i) return (rows[1][column] - v) / (rows[1][0] - r[0]);
    if (i === rows.length - 1) return (v - rows[i - 1][column]) / (r[0] - rows[i - 1][0]);
    const a = rows[i - 1], b = rows[i + 1], h0 = r[0] - a[0], h1 = b[0] - r[0];
    const d0 = (v - a[column]) / h0, d1 = (b[column] - v) / h1;
    return d0 * d1 <= 0 ? 0 : 3 * (h0 + h1) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
  }));
  return { ...spec, slopes, min: rows[0][0], max: rows.at(-1)[0], field: null };
}

function rowAt(chart, y, out) {
  const rows = chart.rows;
  let i = 0;
  while (i < rows.length - 2 && y > rows[i + 1][0]) i++;
  const a = rows[i], b = rows[i + 1], h = b[0] - a[0], t = clamp((y - a[0]) / h);
  const t2 = t * t, t3 = t2 * t;
  out[0] = y;
  for (let k = 1; k < 6; k++) {
    out[k] = (2*t3-3*t2+1)*a[k] + (t3-2*t2+t)*h*chart.slopes[i][k]
      + (-2*t3+3*t2)*b[k] + (t3-t2)*h*chart.slopes[i+1][k];
  }
}

function photoSample(pixels, width, height, sx, sy, out) {
  // A compact five-tap average avoids baking subpixel photograph noise into
  // the coarse loft mesh. Its footprint stays inside the manual corridors.
  out[0] = out[1] = out[2] = 0;
  const offsets = [[0,0,4],[-2,0,1],[2,0,1],[0,-2,1],[0,2,1]];
  for (const [dx, dy, weight] of offsets) {
    const x = clamp((sx + dx) * width / IMAGE_WIDTH, 0, width - 1.00001);
    const y = clamp((sy + dy) * height / IMAGE_HEIGHT, 0, height - 1.00001);
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const at = (iy * width + ix) * 4, below = at + width * 4;
    for (let ch = 0; ch < 3; ch++) {
      const top = toLinear[pixels[at + ch]] * (1 - fx) + toLinear[pixels[at + 4 + ch]] * fx;
      const bottom = toLinear[pixels[below + ch]] * (1 - fx) + toLinear[pixels[below + 4 + ch]] * fx;
      out[ch] += weight * (top * (1 - fy) + bottom * fy) / 8;
    }
  }
}

async function referenceFields() {
  const source = new Image();
  source.decoding = 'async';
  source.src = referenceURL;
  await source.decode();
  const width = source.naturalWidth, height = source.naturalHeight;
  if (width < 2 || height < 2 || Math.abs(width / height - IMAGE_WIDTH / IMAGE_HEIGHT) > .001) {
    throw new Error('Candidate 63 requires the supplied portrait reference in its original aspect ratio.');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not read the supplied reference colors.');
  try {
    context.drawImage(source, 0, 0);
    const pixels = context.getImageData(0, 0, width, height).data;
    const rgb = new Float64Array(3), anchor = new Float64Array(3);
    let anchorLogLuma = 0;
    for (const [x, y] of ANCHORS) {
      photoSample(pixels, width, height, x, y, rgb);
      const luma = Math.max(1e-6, .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]);
      anchorLogLuma += Math.log(luma) / ANCHORS.length;
      for (let ch = 0; ch < 3; ch++) anchor[ch] += Math.log(Math.max(1e-6, rgb[ch]) / luma) / ANCHORS.length;
    }
    const charts = CHART_ROWS.map(makeChart), row = new Float64Array(6);
    for (const chart of charts) {
      chart.field = new Float32Array(WIDTH * HEIGHT * 3);
      for (let j = 0; j < HEIGHT; j++) {
        rowAt(chart, chart.min + (chart.max - chart.min) * j / (HEIGHT - 1), row);
        for (let i = 0; i < WIDTH; i++) {
          const u = .06 + .88 * i / (WIDTH - 1);
          photoSample(pixels, width, height, row[4] + (row[5] - row[4]) * u, row[3], rgb);
          const luma = Math.max(1e-6, .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]);
          // Strong compression keeps photographic illumination subordinate to
          // the actual 3D light rig. Full strength is about .76–1.33, including
          // chroma; it does not replace authored albedo with the photograph.
          const lum = .24 * Math.tanh(.32 * (Math.log(luma) - anchorLogLuma) / .24);
          for (let ch = 0; ch < 3; ch++) {
            const chroma = .04 * Math.tanh(.15 * (Math.log(Math.max(1e-6, rgb[ch]) / luma) - anchor[ch]) / .04);
            chart.field[(j * WIDTH + i) * 3 + ch] = lum + chroma;
          }
        }
      }
    }
    return { charts, pixelBufferBytes: pixels.byteLength,
      lookupBytes: charts.reduce((sum, chart) => sum + chart.field.byteLength, 0) };
  } finally {
    // Neither the decoded image nor this CPU canvas is retained by the state.
    canvas.width = canvas.height = 1;
  }
}

function fieldSample(chart, u, v, out) {
  const x = clamp(u) * (WIDTH - 1), y = clamp(v) * (HEIGHT - 1);
  const ix = Math.min(WIDTH - 2, Math.floor(x)), iy = Math.min(HEIGHT - 2, Math.floor(y));
  const fx = x - ix, fy = y - iy, at = (iy * WIDTH + ix) * 3, below = at + WIDTH * 3;
  for (let ch = 0; ch < 3; ch++) {
    const top = chart.field[at + ch] * (1 - fx) + chart.field[at + 3 + ch] * fx;
    const bottom = chart.field[below + ch] * (1 - fx) + chart.field[below + 3 + ch] * fx;
    out[ch] = top * (1 - fy) + bottom * fy;
  }
}

function sameMatrix(a, b) {
  for (let i = 0; i < 16; i++) if (Math.abs(a[i] - b[i]) > 1e-9) return false;
  return true;
}

function eligibleMeshes(hair) {
  hair.updateWorldMatrix(true, true);
  const entries = [], colorsSeen = new Map();
  let sharedColorBuffers = 0;
  hair.traverse(mesh => {
    if (!mesh.isMesh || !MESH_NAMES.has(mesh.name)) return;
    const position = mesh.geometry?.getAttribute('position'), color = mesh.geometry?.getAttribute('color');
    if (!position || !color || color.isInterleavedBufferAttribute || !(color.array instanceof Float32Array)
      || color.count !== position.count || ![3, 4].includes(color.itemSize)) {
      throw new Error('Candidate 63 expects existing Float32 RGB or RGBA vertex colors on the groom.');
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.some(m => !m?.vertexColors)) throw new Error('Candidate 63 requires the groom’s existing vertex-color materials.');
    const matrix = new Float64Array(mesh.matrixWorld.elements), prior = colorsSeen.get(color.array);
    if (prior) {
      if (!sameMatrix(prior.matrix, matrix) || prior.position !== position || prior.color !== color) {
        throw new Error('A shared color buffer has conflicting projection transforms; no geometry will be cloned.');
      }
      sharedColorBuffers++;
      return;
    }
    const entry = { mesh, position, color, matrix, array: color.array,
      bits: new Uint32Array(color.array.buffer, color.array.byteOffset, color.array.length),
      offsets: null, version: color.version, appliedStrength: 0 };
    entries.push(entry); colorsSeen.set(color.array, entry);
  });
  if (!entries.length) throw new Error('Candidate 63 could not find the authored crown and hair-mass meshes.');
  return { entries, sharedColorBuffers };
}

function bakeOffsets(entries, charts) {
  const row = new Float64Array(6), sample = new Float64Array(3), logarithms = new Float64Array(3);
  const scratch = new Float32Array(1), scratchBits = new Uint32Array(scratch.buffer);
  const metrics = { eligibleVertices: 0, mappedVertices: 0, modifiedComponents: 0,
    minFullMultiplier: 1, maxFullMultiplier: 1, maxRelativeQuantizationError: 0, retainedBytes: 0 };
  for (const entry of entries) {
    const { position, color, matrix: m, array, bits } = entry;
    entry.offsets = new Int16Array(color.count * 3);
    metrics.eligibleVertices += color.count;
    metrics.retainedBytes += entry.offsets.byteLength;
    for (let i = 0; i < color.count; i++) {
      const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
      const wx = m[0]*x + m[4]*y + m[8]*z + m[12];
      const wy = m[1]*x + m[5]*y + m[9]*z + m[13];
      const wz = m[2]*x + m[6]*y + m[10]*z + m[14];
      const px = VIEW_WIDTH / 2 + wx * VIEW_HEIGHT / VIEW_SPAN;
      const py = VIEW_HEIGHT / 2 - (wy - VIEW_CENTER_Y) * VIEW_HEIGHT / VIEW_SPAN;
      const crown = 1 - smooth(240, 370, py);
      const front = smooth(-.10 - .22*crown, .65 - .31*crown, wz);
      if (front < .0001) continue;
      logarithms[0] = logarithms[1] = logarithms[2] = 0;
      let weightSum = 0;
      for (const chart of charts) {
        if (py < chart.min || py > chart.max) continue;
        rowAt(chart, py, row);
        const u = (px - row[1]) / (row[2] - row[1]);
        if (u <= 0 || u >= 1) continue;
        const weight = smooth(0, .13, u) * (1 - smooth(.87, 1, u))
          * smooth(chart.min, chart.min + 18, py) * (1 - smooth(chart.max - 20, chart.max, py));
        if (weight < .0001) continue;
        fieldSample(chart, u, (py - chart.min) / (chart.max - chart.min), sample);
        for (let ch = 0; ch < 3; ch++) logarithms[ch] += sample[ch] * weight;
        weightSum += weight;
      }
      if (weightSum < .0001) continue;
      const influence = front / Math.max(1, weightSum);
      let changed = false;
      for (let ch = 0; ch < 3; ch++) {
        const at = i * color.itemSize + ch, base = array[at];
        if (!(base > 1e-12) || !Number.isFinite(base)) continue;
        const factor = Math.exp(logarithms[ch] * influence), target = base * factor;
        scratch[0] = target;
        const offset = Math.round((scratchBits[0] - bits[at]) / BIT_STEP);
        if (offset < -32767 || offset > 32767) throw new Error('Bounded hair-color offset exceeded its compact representation.');
        entry.offsets[i * 3 + ch] = offset;
        if (!offset) continue;
        scratchBits[0] = bits[at] + offset * BIT_STEP;
        const multiplier = scratch[0] / base;
        metrics.minFullMultiplier = Math.min(metrics.minFullMultiplier, multiplier);
        metrics.maxFullMultiplier = Math.max(metrics.maxFullMultiplier, multiplier);
        metrics.maxRelativeQuantizationError = Math.max(metrics.maxRelativeQuantizationError, Math.abs(scratch[0] / target - 1));
        metrics.modifiedComponents++; changed = true;
      }
      if (changed) metrics.mappedVertices++;
    }
  }
  return metrics;
}

function setStrength(entry, strength) {
  const { color, bits, offsets } = entry;
  if (entry.mesh.geometry.getAttribute('color') !== color || color.array !== entry.array
    || entry.mesh.geometry.getAttribute('position') !== entry.position || color.version !== entry.version) {
    throw new Error('The groom color/geometry changed after candidate 63 was baked; rebuild the optional bake for this groom.');
  }
  let changed = false;
  for (let i = 0; i < color.count; i++) for (let ch = 0; ch < 3; ch++) {
    const offset = offsets[i * 3 + ch];
    if (!offset) continue;
    const before = Math.round(offset * entry.appliedStrength) * BIT_STEP;
    const after = Math.round(offset * strength) * BIT_STEP;
    if (before === after) continue;
    // Positive Float32 bit patterns are monotone. Integer offsets are exactly
    // reversible, avoiding a full RGB baseline copy or divide/multiply drift.
    // Quantization is <=64 Float32 ULPs: below .001% relative color error.
    const at = i * color.itemSize + ch;
    bits[at] = bits[at] - before + after;
    changed = true;
  }
  if (changed) color.needsUpdate = true;
  entry.version = color.version;
  entry.appliedStrength = strength;
}

/**
 * Optional, source-only variation on the original crown and hair mass.
 * strength 0 restores the exact original Float32 color bits, even after many
 * adjustments; repeated strength calls are no-ops. Retained CPU storage is six
 * bytes per eligible vertex, with no copied baseline colors or GPU allocation.
 * The projection is baked in the accepted pose once and remains attached during
 * orbit/turntable motion. Rebuild this bake if the groom geometry itself changes.
 */
export async function applyReferenceHairColor(hair, { strength = .5 } = {}) {
  if (!hair?.isObject3D || !Number.isFinite(strength)) throw new TypeError('Pass the hair group and a finite color strength.');
  strength = clamp(strength);
  let state = states.get(hair);
  if (!state) { state = { pending: Promise.resolve(), entries: null, strength: 0, metrics: null }; states.set(hair, state); }
  const operation = state.pending.then(async () => {
    const start = performance.now();
    if (!state.entries && strength > 0) {
      const selected = eligibleMeshes(hair), source = await referenceFields();
      const metrics = bakeOffsets(selected.entries, source.charts);
      state.entries = selected.entries;
      state.metrics = { ...metrics, meshes: selected.entries.length, sharedColorBuffers: selected.sharedColorBuffers,
        transientPixelBufferBytes: source.pixelBufferBytes, transientLookupBytes: source.lookupBytes };
    }
    const unchanged = strength === state.strength;
    if (state.entries && !unchanged) for (const entry of state.entries) setStrength(entry, strength);
    state.strength = strength;
    const result = { version: VERSION, strength, status: unchanged ? 'unchanged' : strength ? 'applied' : 'baseline-restored',
      ...(state.metrics || { meshes: 0, eligibleVertices: 0, mappedVertices: 0, retainedBytes: 0 }),
      elapsedMs: Number((performance.now() - start).toFixed(2)), baselineColorBytesRetained: 0,
      texturesAdded: 0, drawCallsAdded: 0, geometryChanged: false, uvChanged: false, alphaChanged: false,
      source: 'Only reference/image1-color.jpg; hand-placed crown/front-length corridors; bounded color variation on original meshes.' };
    hair.userData.referenceHairColor = result;
    return result;
  });
  state.pending = operation.then(() => undefined, () => undefined);
  return operation;
}
