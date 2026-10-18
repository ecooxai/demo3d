import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// One native candidate100 + export104 roundtrip. The controlled images replace
// only the crown with its loaded GLB counterpart, using the same studio lighting
// and renderer-specific shadow/alpha-to-coverage settings as the live crown.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const source = await readFile(path.join(root, 'src/main.js'), 'utf8');
const marker = 'detailTarget.x=.02+state.pose.shiftX;';
const oldImport = "import { exportPortraitGLB } from './export-portrait.js';";
if (source.split(oldImport).length !== 2) throw new Error('Expected the unique accepted export import.');
const crownImports = [...source.matchAll(/^\s*import\s*\{[^}]*\bapplyReferenceCrownMicrocontrast100\b[^}]*\}\s*from\s*['"][^'"]+['"]/gm)];
const crownCalls = [...source.matchAll(/\bapplyReferenceCrownMicrocontrast100\s*\(/g)];
let crownImport = '', instrumented = source.replace(oldImport, "import {exportPortraitGLB,createPortraitExport} from '../review/export-portrait-candidate104.js';");
if (crownImports.length === 0 && crownCalls.length === 0) {
  if (source.split(marker).length !== 2) throw new Error('Expected the unique pre-balance crown injection marker.');
  crownImport = "import {applyReferenceCrownMicrocontrast100} from '../review/reference-crown-candidate100.js';\n";
  instrumented = instrumented.replace(marker, 'state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});\n    ' + marker);
} else if (crownImports.length === 1 && crownCalls.length === 1) {
  // Reuse the accepted production bake; importing or applying it twice would
  // distort the source comparison and replace the UV0 coverage source again.
  const balanceIndex = source.search(/\bapplyPortraitBalance\s*\(/);
  if (balanceIndex >= 0 && crownCalls[0].index > balanceIndex) throw new Error('Candidate100 must be baked before the common portrait balance translation.');
} else throw new Error('Candidate100 must have exactly one import and application, or neither.');
const entry = crownImport + "import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';\n" + instrumented +
  '\nwindow.exportAudit104={createPortraitExport,GLTFLoader,THREE};';
const bundle = path.join(qa, 'app-export-portrait104.js');
await build({ stdin: { contents: entry, resolveDir: path.join(root, 'src'), sourcefile: 'main-export-portrait104.js', loader: 'js' }, bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, outfile: bundle, logLevel: 'silent' });
const chrome = process.env.CHROME_PATH || path.resolve(root, '../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/app.js', route => route.fulfill({ path: bundle, contentType: 'text/javascript' }));
  await page.goto(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/', { waitUntil: 'networkidle' });
  try { await page.waitForFunction(() => window.portrait?.ready, null, { timeout: 90000 }); }
  catch (error) { throw new Error(`Candidate104 initialization: ${await page.locator('#gate-message').textContent()} / ${error.message}`); }
  await page.evaluate(() => {
    const p = window.portrait;
    if (!p.renderer.backend?.isWebGPUBackend) throw new Error('Native WebGPU is required.');
    p.setScore(104, 76); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2);
  });
  for (const view of ['front', 'detail', 'right']) {
    await page.evaluate(async view => { const p = window.portrait; p.setView(view); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); }, view);
    await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `export104-source-${view}.png`) });
  }

  // A whole-scene compile at the default target is not part of the portrait's
  // offscreen resolve path. Track the original corneas at each export boundary
  // so a GPU-state regression cannot pass merely because source bytes match.
  // The optional final compile probe deliberately tests the removed call after
  // the original scene has been restored; it never changes the eye materials.
  await page.exposeFunction('saveExport104Checkpoint', async label => {
    if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Invalid diagnostic stage.');
    // WebGPU's presentation canvas is not preserved for a later drawImage.
    // Read the compositor screenshot instead; bytes stay inside the test's
    // browser protocol and are never printed or converted to a base64 string.
    const png = await page.locator('#canvas-host canvas').screenshot({ path: path.join(qa, `export104-diagnostic-${label}-detail.png`) });
    return Array.from(png);
  });
  await page.evaluate(() => {
    const p = window.portrait, api = window.exportAudit104, references = new Map(), corneas = [];
    p.model.traverseVisible(object => {
      if (object.name === 'transparent-corneal-dome') corneas.push(object);
    });
    if (corneas.length !== 2 || corneas.some(object => object.material.transmission !== 1)) throw new Error('Expected the two original transmitting corneas.');
    const readback = document.createElement('canvas');
    const context = readback.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
    api.transmissionCheckpoints = [];
    api.checkpoint = async label => {
      p.setView('detail'); p.renderNow();
      await p.renderer.backend.device.queue.onSubmittedWorkDone();
      const canvas = p.renderer.domElement;
      const png = await window.saveExport104Checkpoint(label);
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(png)], { type: 'image/png' }));
      readback.width = bitmap.width; readback.height = bitmap.height;
      context.drawImage(bitmap, 0, 0); bitmap.close();
      const raster = context.getImageData(0, 0, readback.width, readback.height).data;
      let frameTotal = 0, frameMaximum = 0, frameSamples = 0;
      for (let i = 0; i < raster.length; i += 4 * 97) {
        const value = .2126 * raster[i] + .7152 * raster[i + 1] + .0722 * raster[i + 2];
        frameTotal += value; frameMaximum = Math.max(frameMaximum, value); frameSamples++;
      }
      const point = new api.THREE.Vector3();
      const eyes = corneas.map((object, index) => {
        let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
        object.updateWorldMatrix(true, false);
        const position = object.geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
          point.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld).project(p.camera);
          const x = (point.x + 1) * readback.width / 2, y = (1 - point.y) * readback.height / 2;
          left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        const x = Math.max(0, Math.floor(left) - 1), y = Math.max(0, Math.floor(top) - 1);
        const width = Math.min(readback.width - x, Math.ceil(right) + 2 - x), height = Math.min(readback.height - y, Math.ceil(bottom) + 2 - y);
        if (![x, y, width, height].every(Number.isFinite) || width < 3 || height < 3) throw new Error('Invalid projected cornea readback.');
        const data = context.getImageData(x, y, width, height).data;
        const previous = references.get(object), rect = [x, y, width, height];
        if (previous && JSON.stringify(rect) !== JSON.stringify(previous.rect)) throw new Error('The eye comparison camera/geometry moved.');
        let luminance = 0, dark = 0, absoluteError = 0;
        for (let i = 0; i < data.length; i += 4) {
          const value = .2126 * data[i] + .7152 * data[i + 1] + .0722 * data[i + 2];
          luminance += value; if (value < 25) dark++;
          if (previous) for (let channel = 0; channel < 3; channel++) absoluteError += Math.abs(data[i + channel] - previous.data[i + channel]);
        }
        const pixels = data.length / 4, meanLuminance = luminance / pixels, darkFraction = dark / pixels;
        if (!previous) {
          references.set(object, { rect, data: data.slice(), meanLuminance, darkFraction });
        }
        const luminanceRatio = previous ? meanLuminance / previous.meanLuminance : 1;
        const darkFractionIncrease = previous ? darkFraction - previous.darkFraction : 0;
        return { eye: index, rect, meanLuminance, darkFraction, luminanceRatio, darkFractionIncrease,
          rgbMeanAbsoluteError: absoluteError / (pixels * 3),
          severeBlackening: luminanceRatio < .65 && darkFractionIncrease > .10 };
      });
      const result = { stage: label, eyes, severeBlackening: eyes.some(eye => eye.severeBlackening),
        baselineValid: label !== 'baseline' || eyes.every(eye => eye.meanLuminance >= 25),
        readback: { source: 'Playwright compositor PNG', size: [readback.width, readback.height], canvasSize: [canvas.width, canvas.height],
          frameSampleMeanLuminance: frameTotal / frameSamples, frameSampleMaxLuminance: frameMaximum },
        sourceCorneaTransmissionUnchanged: corneas.every(object => object.material.transmission === 1),
        activeTarget: p.renderer.getRenderTarget() === null ? 'screen-after-resolve' : 'unexpected-target' };
      api.transmissionCheckpoints.push(result);
      return result;
    };
    api.releaseReadback = () => { references.clear(); readback.width = readback.height = 0; };
  });
  const baseline = await page.evaluate(() => window.exportAudit104.checkpoint('baseline'));
  await writeFile(path.join(qa, 'export104-transmission-baseline.json'), JSON.stringify(baseline, null, 2));
  if (!baseline.baselineValid) throw new Error(`Baseline compositor eye readback is too dark: ${JSON.stringify(baseline)}. See the saved baseline PNG and coordinates.`);

  const report = await page.evaluate(async () => {
    const p = window.portrait, api = window.exportAudit104;
    const name = 'Continuous parted crown with longitudinal fiber flow', crown = p.model.getObjectByName(name);
    const demand = (ok, message) => { if (!ok) throw new Error(message); };
    const same = (a, b, message) => demand(JSON.stringify(a) === JSON.stringify(b), message);
    demand(crown?.material.userData.referenceCrownMicrocontrast.version === 'reference-crown-strand-space-100-v1', 'Missing candidate100 crown.');
    const mat = crown.material, geo = crown.geometry, atlas = mat.map, coverage = mat.alphaMap, normal = mat.normalMap;
    const textures = new Map(), objects = [], attributes = new Map();
    const fingerprint = async array => {
      const view = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      const digest = await crypto.subtle.digest('SHA-256', view);
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    };
    const textureMetadata = t => ({ channel: t.channel, colorSpace: t.colorSpace, flipY: t.flipY, wrapS: t.wrapS, wrapT: t.wrapT,
      minFilter: t.minFilter, magFilter: t.magFilter, anisotropy: t.anisotropy, offset: t.offset.toArray(), repeat: t.repeat.toArray(),
      center: t.center.toArray(), rotation: t.rotation, matrix: t.matrix.toArray() });
    p.model.traverse(object => {
      const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
      objects.push({ object, geometry: object.geometry, material: object.material, materials: materials.slice() });
      if (object.geometry) for (const [key, attribute] of Object.entries({ ...object.geometry.attributes, index: object.geometry.index })) {
        if (attribute) attributes.set(attribute, { geometry: object.geometry, key, array: attribute.array, version: attribute.version,
          samples: [0, Math.floor(attribute.array.length / 3), Math.floor(attribute.array.length * 2 / 3), attribute.array.length - 1].map(i => [i, attribute.array[i]]) });
      }
      for (const material of materials) for (const [slot, texture] of Object.entries(material)) if (texture?.isTexture && !textures.has(texture)) {
        textures.set(texture, { material, slot, source: texture.source, image: texture.image, array: texture.image?.data,
          version: texture.version, sourceVersion: texture.source.version, metadata: textureMetadata(texture) });
      }
    });
    const fullHashes = new Map();
    for (const attribute of [...Object.values(geo.attributes), geo.index]) fullHashes.set(attribute.array, await fingerprint(attribute.array));
    for (const texture of [atlas, coverage, normal]) fullHashes.set(texture.image.data, await fingerprint(texture.image.data));
    const originalMetadata = JSON.stringify(mat.userData), originalScale = mat.normalScale.toArray();
    async function unchanged(stage) {
      for (const record of objects) {
        demand(record.object.geometry === record.geometry && record.object.material === record.material, `${stage}: live object/material reference changed.`);
        const current = record.object.material ? (Array.isArray(record.object.material) ? record.object.material : [record.object.material]) : [];
        demand(current.length === record.materials.length && current.every((m, i) => m === record.materials[i]), `${stage}: material slots changed.`);
      }
      for (const [attribute, record] of attributes) {
        demand((record.key === 'index' ? record.geometry.index : record.geometry.attributes[record.key]) === attribute && attribute.array === record.array && attribute.version === record.version, `${stage}: geometry/attribute identity or version changed.`);
        for (const [i, value] of record.samples) demand(Object.is(record.array[i], value), `${stage}: live attribute samples changed.`);
      }
      for (const [texture, record] of textures) {
        demand(record.material[record.slot] === texture && texture.source === record.source && texture.image === record.image && texture.image?.data === record.array, `${stage}: source texture references changed.`);
        demand(texture.version === record.version && texture.source.version === record.sourceVersion, `${stage}: live texture/source update version changed.`);
        same(textureMetadata(texture), record.metadata, `${stage}: texture sampling changed.`);
      }
      for (const [array, hash] of fullHashes) demand(await fingerprint(array) === hash, `${stage}: crown attributes or texture bytes changed.`);
      demand(JSON.stringify(mat.userData) === originalMetadata, `${stage}: source material metadata changed.`);
      same(mat.normalScale.toArray(), originalScale, `${stage}: original unequal normal scale changed.`);
    }
    // Independent normalized RGBA bilinear sampler; data are in texture row
    // order. Coverage is linear green, and base-color alpha is always linear.
    const sample = (image, u, v, channel) => {
      const w = image.width, h = image.height, x = (u - Math.floor(u)) * w - .5, y = Math.max(0, Math.min(h - 1, v * h - .5));
      const left = Math.floor(x), top = Math.floor(y), rx = x - left, ry = y - top;
      let value = 0;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
        const xx = ((left + dx) % w + w) % w, yy = Math.min(h - 1, top + dy);
        value += image.data[(yy * w + xx) * 4 + channel] * (dx ? rx : 1 - rx) * (dy ? ry : 1 - ry);
      }
      return value / 255;
    };
    let prepared = null, loaded = null;
    const readCanvases = new Set(), decoded = new Map();
    function rgbaImage(texture) {
      if (texture.image.data) return texture.image;
      if (decoded.has(texture)) return decoded.get(texture);
      const image = texture.image, canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      readCanvases.add(canvas);
      const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
      context.drawImage(image, 0, 0);
      const record = { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
      decoded.set(texture, record); return record;
    }
    function disposeLoaded() {
      if (!loaded) return;
      const geometries = new Set(), materials = new Set(), maps = new Set(), images = new Set();
      loaded.scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) {
          materials.add(material);
          for (const value of Object.values(material)) if (value?.isTexture) { maps.add(value); if (value.image?.close) images.add(value.image); }
        }
      });
      for (const geometry of geometries) geometry.dispose(); for (const material of materials) material.dispose();
      for (const texture of maps) texture.dispose(); for (const image of images) image.close();
    }
    let release = null;
    try {
      const prepStart = performance.now(); prepared = api.createPortraitExport(p.model);
      const clone = prepared.model.getObjectByName(name), merged = clone.material.map;
      demand(clone.geometry === geo && clone.material !== mat && clone.material.alphaMap === null, 'Crown must share geometry and merge only its cloned material.');
      demand(merged !== atlas && merged.source !== atlas.source && merged.image.data !== atlas.image.data, 'Merged color/alpha data must be independently owned.');
      demand(merged.channel === 1 && clone.material.normalMap.channel === 0, 'UV1 color / UV0 normal binding changed.');
      same(textureMetadata(merged), textureMetadata(atlas), 'Atlas sampler changed.');
      demand(clone.geometry.attributes.color === geo.attributes.color && clone.geometry.attributes.uv === geo.attributes.uv && clone.geometry.attributes.uv1 === geo.attributes.uv1, 'Vertex alpha or UV buffers must remain shared.');
      let rgbMismatches = 0, incorrectAlphaTexels = 0, maxQuantizationError = 0;
      const original = atlas.image.data, output = merged.image.data;
      for (let y = 0; y < 2048; y++) for (let x = 0; x < 2048; x++) {
        const at = (y * 2048 + x) * 4;
        for (let ch = 0; ch < 3; ch++) if (original[at + ch] !== output[at + ch]) rgbMismatches++;
        let expected = original[at + 3] / 255;
        if (y < 1024) expected *= sample(coverage.image, (x + .5 - (x < 1024 ? 16 : 1040)) / 992, (y + .5 - 16) / 992, 1);
        else if (x < 544) expected *= sample(coverage.image, (x + .5 - 16) / 512, (y + .5 - 1040) / 1024, 1);
        if (output[at + 3] !== Math.round(expected * 255)) incorrectAlphaTexels++;
        maxQuantizationError = Math.max(maxQuantizationError, Math.abs(output[at + 3] / 255 - expected));
      }
      demand(rgbMismatches === 0 && incorrectAlphaTexels === 0 && maxQuantizationError <= .5 / 255 + 1e-12, 'Merged atlas does not match its independent inverse/sampler audit.');
      const disposableMaterials = new Set(), disposableTextures = new Set();
      prepared.model.traverse(object => {
        for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) {
          disposableMaterials.add(material); for (const value of Object.values(material)) if (value?.isTexture) disposableTextures.add(value);
        }
      });
      let materialDisposals = 0, textureDisposals = 0;
      for (const material of disposableMaterials) material.addEventListener('dispose', () => materialDisposals++);
      for (const texture of disposableTextures) texture.addEventListener('dispose', () => textureDisposals++);
      const preparation = structuredClone(prepared.report), preparationMs = performance.now() - prepStart;
      await unchanged('after preparation'); prepared.dispose(); prepared = null;
      demand(materialDisposals === disposableMaterials.size && textureDisposals === disposableTextures.size, 'Export-only resources did not all receive dispose.');
      await unchanged('after preparation disposal');
      await api.checkpoint('after-preparation-disposal');

      const startExport = performance.now(), blob = await p.exportGLB({ download: false }), buffer = await blob.arrayBuffer();
      const exportMs = performance.now() - startExport;
      const head = new DataView(buffer);
      demand(head.getUint32(0, true) === 0x46546c67 && head.getUint32(4, true) === 2 && head.getUint32(8, true) === blob.size, 'Invalid GLB header.');
      await api.checkpoint('after-glb-export');
      const startLoad = performance.now(); loaded = await new api.GLTFLoader().parseAsync(buffer, '');
      const loadMs = performance.now() - startLoad, json = loaded.parser.json;
      await api.checkpoint('after-glb-load');
      demand(json.images.every(image => Number.isInteger(image.bufferView) && !image.uri), 'GLB must embed every image.');
      const nodeIndex = json.nodes.findIndex(node => node.name === name && node.mesh !== undefined);
      demand(nodeIndex >= 0, 'Crown node missing from GLB.');
      const loadedCrown = await loaded.parser.getDependency('node', nodeIndex), loadedMat = loadedCrown.material;
      demand(loadedCrown.isMesh && !Array.isArray(loadedMat), 'Expected one loaded crown primitive.');
      demand(loaded.scene.getObjectById(loadedCrown.id) === loadedCrown, 'Loaded crown node is not the actual scene instance.');
      const materialDef = json.materials[json.meshes[json.nodes[nodeIndex].mesh].primitives[0].material];
      demand(materialDef.pbrMetallicRoughness.baseColorTexture.texCoord === 1 && (materialDef.normalTexture.texCoord || 0) === 0 && !loadedMat.alphaMap, 'GLB color/normal UV channels or alpha-map removal failed.');
      demand(loadedMat.alphaTest === mat.alphaTest && loadedMat.opacity === mat.opacity, 'Material cutoff/opacity changed.');
      for (const key of ['position', 'uv', 'uv1', 'color']) {
        const before = geo.getAttribute(key), after = loadedCrown.geometry.getAttribute(key);
        demand(after?.count === before.count && after.itemSize === before.itemSize, `Loaded ${key} shape changed.`);
        for (let i = 0; i < before.array.length; i++) demand(Math.abs(before.array[i] - after.array[i]) <= 1e-7, `Loaded ${key} values changed.`);
      }
      const loadedAtlas = rgbaImage(loadedMat.map), loadedNormal = rgbaImage(loadedMat.normalMap);
      demand(loadedAtlas.width === 2048 && loadedAtlas.height === 2048 && loadedMat.map.flipY === false && loadedMat.normalMap.flipY === false, 'Loaded atlas dimensions/orientation changed.');
      for (const [before, after] of [[atlas, loadedMat.map], [normal, loadedMat.normalMap]]) {
        for (const key of ['channel', 'colorSpace', 'flipY', 'wrapS', 'wrapT', 'minFilter', 'magFilter', 'rotation']) demand(before[key] === after[key], `Loaded sampler ${key} changed.`);
        same(before.offset.toArray(), after.offset.toArray(), 'Loaded UV offset changed.');
        same(before.repeat.toArray(), after.repeat.toArray(), 'Loaded UV repeat changed.');
      }
      let opaqueColorError = 0, partialColorError = 0, potentiallyVisibleColorError = 0, alphaByteMismatches = 0;
      for (let i = 0; i < output.length; i += 4) {
        if (loadedAtlas.data[i + 3] !== output[i + 3]) alphaByteMismatches++;
        for (let ch = 0; ch < 3; ch++) {
          const error = Math.abs(loadedAtlas.data[i + ch] - original[i + ch]);
          if (output[i + 3] === 255) opaqueColorError = Math.max(opaqueColorError, error);
          else if (output[i + 3] > 0) partialColorError = Math.max(partialColorError, error);
          if (output[i + 3] / 255 >= mat.alphaTest) potentiallyVisibleColorError = Math.max(potentiallyVisibleColorError, error);
        }
      }
      demand(alphaByteMismatches === 0 && opaqueColorError <= 1, 'GLB PNG changed coverage bytes or opaque color.');
      let normalError = 0;
      for (let i = 0; i < normal.image.data.length; i += 4) {
        for (let ch = 0; ch < 2; ch++) {
          const a = (normal.image.data[i + ch] / 127.5 - 1) * mat.normalScale.getComponent(ch);
          const b = (loadedNormal.data[i + ch] / 127.5 - 1) * loadedMat.normalScale.getComponent(ch);
          normalError = Math.max(normalError, Math.abs(a - b));
        }
        demand(normal.image.data[i + 2] === loadedNormal.data[i + 2] && loadedNormal.data[i + 3] === 255, 'Loaded crown normal Z/alpha changed.');
      }
      demand(normalError <= Math.max(Math.abs(mat.normalScale.x), Math.abs(mat.normalScale.y)) / 255 + 1e-12, 'Normal direction/unequal-scale repair regressed.');

      // Barycentric interpolation uses the actual Float32 sheet UVs and vertex
      // alpha. The measured filtering loss is reported separately from correct
      // texel construction; a small changed fraction is not visual acceptance.
      const uv0 = geo.attributes.uv.array, uv1 = geo.attributes.uv1.array, colors = geo.attributes.color.array;
      const sampledPoint = new Float64Array(3), measuredPoint = new Float64Array(8);
      function chartPoint(u, v, side = 0) {
        const ix = Math.min(127, Math.floor(u * 128)), iy = Math.min(63, Math.floor(v / .73 * 64));
        const a = 7685 + side * 8385 + iy * 129 + ix, b = a + 1, c = a + 129, d = c + 1;
        const fx = Math.max(0, Math.min(1, (u - uv0[a * 2]) / (uv0[b * 2] - uv0[a * 2])));
        const fy = Math.max(0, Math.min(1, (v - uv0[a * 2 + 1]) / (uv0[c * 2 + 1] - uv0[a * 2 + 1])));
        const first = fx + fy <= 1 ? a : b, second = fx + fy <= 1 ? b : c, third = fx + fy <= 1 ? c : d;
        const w0 = fx + fy <= 1 ? 1 - fx - fy : 1 - fy, w1 = fx + fy <= 1 ? fx : 1 - fx, w2 = fx + fy <= 1 ? fy : fx + fy - 1;
        sampledPoint[0] = uv1[first * 2] * w0 + uv1[second * 2] * w1 + uv1[third * 2] * w2;
        sampledPoint[1] = uv1[first * 2 + 1] * w0 + uv1[second * 2 + 1] * w1 + uv1[third * 2 + 1] * w2;
        sampledPoint[2] = colors[first * 4 + 3] * w0 + colors[second * 4 + 3] * w1 + colors[third * 4 + 3] * w2;
        return sampledPoint;
      }
      function measure(u, v, side = 0) {
        const point = chartPoint(u, v, side), before = sample(coverage.image, u, v, 1), after = sample(loadedAtlas, point[0], point[1], 3);
        const originalEffective = before * point[2] * mat.opacity, exportedEffective = after * point[2] * loadedMat.opacity;
        measuredPoint[0] = before; measuredPoint[1] = after; measuredPoint[2] = point[2];
        measuredPoint[3] = originalEffective; measuredPoint[4] = exportedEffective;
        measuredPoint[5] = Math.abs(before - after); measuredPoint[6] = Math.abs(originalEffective - exportedEffective);
        measuredPoint[7] = Number((originalEffective >= mat.alphaTest) !== (exportedEffective >= loadedMat.alphaTest));
        return measuredPoint;
      }
      let seed = 104;
      const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
      const characterize = (lowV, highV) => {
        const count = 500000; let rawSquares = 0, effectiveSquares = 0, rawMax = 0, effectiveMax = 0, cutoffChanges = 0;
        for (let i = 0; i < count; i++) {
          const m = measure(random(), lowV + (highV - lowV) * random(), i % 2);
          rawSquares += m[5] * m[5]; effectiveSquares += m[6] * m[6];
          rawMax = Math.max(rawMax, m[5]); effectiveMax = Math.max(effectiveMax, m[6]); cutoffChanges += m[7];
        }
        return { samples: count, rawRms: Math.sqrt(rawSquares / count), effectiveRms: Math.sqrt(effectiveSquares / count), rawMax, effectiveMax, cutoffChanges, cutoffFraction: cutoffChanges / count };
      };
      const uniform = characterize(0, .73), releaseBand = characterize(.63, .73);
      const worstUV = [.8740234375, .66064453125], worstValues = measure(...worstUV);
      const worst = Object.fromEntries(['before', 'after', 'vertexAlpha', 'originalEffective', 'exportedEffective', 'rawError', 'effectiveError', 'cutoffChanged'].map((key, i) => [key, key === 'cutoffChanged' ? Boolean(worstValues[i]) : worstValues[i]]));
      demand(uniform.rawRms < .0060 && uniform.effectiveRms < .0033 && uniform.cutoffFraction < .0005, 'Uniform coverage error exceeds the measured candidate104 resampling envelope.');
      demand(releaseBand.rawRms < .0160 && releaseBand.effectiveRms < .0090 && releaseBand.cutoffFraction < .0030, 'Release-band error exceeds the measured resampling envelope.');
      demand(worst.rawError < .263 && worst.effectiveError < .230 && worst.cutoffChanged, 'Known isolated resampling maximum was not characterized as expected.');
      let foundationError = 0;
      for (let j = 0; j <= 100; j++) for (let i = 0; i <= 100; i++) {
        const u = i / 100 * .30, v = j / 100 * .72;
        foundationError = Math.max(foundationError, Math.abs(sample(coverage.image, u, v, 1) - sample(loadedAtlas, (16 + u * 512) / 2048, (1040 + v * 1024) / 2048, 3)));
      }
      demand(foundationError < 1e-12, 'Foundation coverage should retain its exact 1:1 sampling.');
      await unchanged('after GLB load/coverage audit');

      // The controlled visual comparison changes only the crown. These preview
      // settings are not glTF material fields; restore them for equal rendering.
      const renderSettings = ['alphaToCoverage', 'envMapIntensity', 'forceSinglePass', 'depthWrite'];
      for (const key of renderSettings) loadedMat[key] = mat[key];
      loadedMat.map.anisotropy = atlas.anisotropy; loadedMat.normalMap.anisotropy = normal.anisotropy;
      loadedCrown.castShadow = crown.castShadow; loadedCrown.receiveShadow = crown.receiveShadow;
      loaded.scene.traverse(object => { if (object.isMesh) object.visible = object === loadedCrown; });
      loaded.scene.visible = false; p.scene.add(loaded.scene);
      await api.checkpoint('loaded-scene-hidden');
      release = async () => {
        crown.visible = true; p.scene.remove(loaded.scene);
        disposeLoaded();
        for (const canvas of readCanvases) canvas.width = canvas.height = 0;
        await unchanged('after visual comparison cleanup');
      };
      window.exportAudit104.showLoaded = async () => {
        crown.visible = false; loaded.scene.visible = true;
        // Compile new render objects through the same offscreen target used by
        // every production frame. A separate default-target compile can disturb
        // transmission viewport-texture state in the installed WebGPU renderer.
        p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
      };
      window.exportAudit104.cleanup = release;
      return { candidate: 104, scoreUnchanged: 76, nativeWebGPU: true, result: 'technical checks passed; visual acceptance pending',
        glbBytes: blob.size, sourceHashesUnchanged: true, rgbMismatches, incorrectAlphaTexels, maxQuantizationError,
        preparation, disposedMaterials: materialDisposals, disposedTextures: textureDisposals,
        alphaByteMismatches, opaqueColorError, partialColorError, potentiallyVisibleColorError, normalError, foundationError,
        coverage: { uniform, releaseBand, worst: { uv0: worstUV, ...worst }, lossless: false },
        visualComparison: { replacement: 'loaded crown only', matchedRendererSettings: renderSettings, matchedTextureAnisotropicFiltering: true, matchedShadows: true, compilation: 'normal portrait offscreen render path', views: ['front', 'detail', 'right'], resolution: [900, 1200] },
        milliseconds: { preparation: preparationMs, export: exportMs, load: loadMs },
        limitations: ['Coverage resampling changes isolated peaks and some cutoff decisions.', 'The numeric envelope describes correctness of this approximation, not visual acceptance.', 'Mipmapping, anisotropic filtering and alpha-to-coverage require the native comparison images.'] };
    } finally {
      prepared?.dispose();
      if (!release) {
        disposeLoaded();
        for (const canvas of readCanvases) canvas.width = canvas.height = 0;
      }
    }
  });
  try {
    await page.evaluate(() => window.exportAudit104.showLoaded());
    await page.evaluate(() => window.exportAudit104.checkpoint('loaded-crown'));
    for (const view of ['front', 'detail', 'right']) {
      await page.evaluate(async view => { const p = window.portrait; p.setView(view); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); }, view);
      await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `export104-loaded-crown-${view}.png`) });
    }
  } finally { await page.evaluate(() => window.exportAudit104.cleanup?.()); }
  await page.evaluate(() => window.exportAudit104.checkpoint('restored-source'));
  const probeScreenCompile = process.env.EXPORT104_COMPILE_PROBE === '1';
  if (probeScreenCompile) await page.evaluate(async () => {
    const p = window.portrait;
    if (p.renderer.getRenderTarget() !== null) throw new Error('The diagnostic compile probe requires the original screen target.');
    await p.renderer.compileAsync(p.scene, p.camera);
    await window.exportAudit104.checkpoint('screen-compile-probe');
  });
  report.transmission = await page.evaluate(() => {
    const checkpoints = window.exportAudit104.transmissionCheckpoints;
    const normal = checkpoints.filter(stage => stage.stage !== 'screen-compile-probe');
    const probe = checkpoints.find(stage => stage.stage === 'screen-compile-probe');
    window.exportAudit104.releaseReadback();
    return { checkpoints, normalPathPreserved: normal.every(stage => !stage.severeBlackening),
      firstBlackenedStage: checkpoints.find(stage => stage.severeBlackening)?.stage || null,
      screenCompileProbeRan: Boolean(probe), screenCompileReproducedBlackening: Boolean(probe?.severeBlackening),
      scope: 'Original source corneas, unchanged eye art; projected pixel patches detect severe blackening, while full images remain the visual review.' };
  });
  report.browserErrors = errors;
  await writeFile(path.join(qa, 'export-portrait104-native.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (!report.transmission.normalPathPreserved) throw new Error(`Candidate104 changed source-eye transmission at ${report.transmission.firstBlackenedStage}; see stage images/report.`);
  if (errors.length) throw new Error(`Candidate104 browser errors: ${JSON.stringify(errors)}`);
} finally { await browser.close(); }
