import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Read-only owner diagnostic, frozen against accepted133 with full130 lips.
// It preserves corneas, source maps, geometry, UVs, display and scene lighting.
// Basic mode3 is a colour-pattern diagnostic, not a proposed eye material.
// Tone mapping and altered diffuse response prevent additive energy claims.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const digest = data => createHash('sha256').update(data).digest('hex');
const main = await readFile(path.join(root, 'src/main.js'), 'utf8');
const expectedMain = '73d1b1589a6cb942353bd5d7301af47680e7e5510fe6f140b4aaa5c233004136';
if (digest(main) !== expectedMain || !main.includes('diagonalFringe133:1')
  || !main.includes('state.mouthContinuity130=applyMouthContinuity130(anatomicalHead,{strength:1});')
  || !main.includes('renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.4;')
  || main.includes('applyLipEdgeMaterial135')) throw new Error('137 requires the frozen accepted133 main with full130 lips and no135 material.');
const modes = [0, 1, 2, 3], views = ['detail', 'eye-detail'];
const labels = ['Current iris and sclera', 'Only iris specular suppressed', 'Only sclera specular and clearcoat suppressed', 'Original mapped iris and sclera, unlit Basic diagnostic'];
const bundle = path.join(qa, 'app-eye-highlight-owner137.js');
await build({ stdin: { contents: main + '\nwindow.eye137Types={MeshBasicMaterial:THREE.MeshBasicMaterial};\n', resolveDir: path.join(root, 'src'), sourcefile: 'main-eye-highlight-owner137.js', loader: 'js' },
  bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, outfile: bundle, logLevel: 'silent' });
const files = ['src/main.js', 'src/face.js', 'src/reference-skin.js', 'src/skin-illumination.js', 'src/render-quality.js', 'review/eye-highlight-owner137-native.mjs'];
const hashes = Object.fromEntries(await Promise.all(files.map(async file => { const bytes = await readFile(path.join(root, file)); return [file, { bytes: bytes.length, sha256: digest(bytes) }]; })));
const report = { candidate: 137, status: 'Running', purpose: 'Attribute eye catchlight patterns to retained material surfaces and actual bound colour maps',
  scoreUnchanged: 77, display: { mapping: 7, exposure: 1.4, antialiasing: 2, resolution: [900, 1200] }, views, files: hashes, results: [], crops: [],
  interpretation: 'Compare feature location/shape and per-surface change. Basic mode removes diffuse lighting as well as physical reflections, and Neutral output is nonlinear; brightness differences are not additive light components.' };
const persist = () => writeFile(path.join(qa, 'eye-highlight-owner137-native.json'), JSON.stringify(report, null, 2) + '\n');
let browser, page, failure;
const errors = [];
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
  page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', message => { if (message.type() === 'error') errors.push({ type: 'console', message: message.text().slice(0, 1800) }); });
  await page.route('**/app.js', route => route.fulfill({ path: bundle, contentType: 'text/javascript' }));
  const url = new URL(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/'); url.searchParams.set('backend', 'webgpu');
  await page.goto(url.href, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 90000 });
  report.setup = await page.evaluate(async () => {
    const p = window.portrait, demand = (condition, message) => { if (!condition) throw new Error(message); };
    demand(p.ready, `137 preparation failed: ${document.querySelector('#gate-message').textContent}`);
    demand(p.renderer.backend?.isWebGPUBackend === true, '137 requires native WebGPU; no fallback is performed.');
    demand(p.renderer.toneMapping === 7 && p.renderer.toneMappingExposure === 1.4 && p.state.lighting === 'soft', '137 requires the accepted Neutral1.4 display and soft lighting.');
    demand(p.state.mouthContinuity130?.applied && p.state.mouthContinuity130?.strength === 1, '137 requires accepted full130 geometry.');
    p.setScore(137, 77); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2); p.setView('detail');
    p.model.updateWorldMatrix(true, true); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
    const fingerprint = async data => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(data.buffer, data.byteOffset, data.byteLength))), value => value.toString(16).padStart(2, '0')).join('');
    const settings = material => Object.fromEntries(Object.entries(material).filter(([key, value]) => !['id', 'uuid', 'name'].includes(key)
      && (value === null || ['number', 'boolean', 'string'].includes(typeof value) || value?.isColor || value?.isVector2 || value?.isVector3 || value?.isVector4))
      .map(([key, value]) => [key, value?.toArray ? value.toArray() : value]));
    const mapBindings = material => Object.fromEntries(Object.entries(material).filter(([, value]) => value?.isTexture));
    const mapSettings = texture => ({ channel: texture.channel, colorSpace: texture.colorSpace, format: texture.format, type: texture.type,
      flipY: texture.flipY, premultiplyAlpha: texture.premultiplyAlpha, minFilter: texture.minFilter, magFilter: texture.magFilter,
      wrapS: texture.wrapS, wrapT: texture.wrapT, anisotropy: texture.anisotropy, generateMipmaps: texture.generateMipmaps,
      offset: texture.offset.toArray(), repeat: texture.repeat.toArray(), rotation: texture.rotation, center: texture.center.toArray(),
      matrixAutoUpdate: texture.matrixAutoUpdate, manualMatrix: texture.matrixAutoUpdate ? null : texture.matrix.toArray() });
    const imagePixels = texture => texture.image?.data?.buffer ? texture.image.data
      : texture.image?.getContext ? texture.image.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, texture.image.width, texture.image.height).data
        : (() => { throw new Error('137 cannot inspect an original eye texture image.'); })();
    const roleNames = ['brown-iris-and-pupil', 'scleral-globe', 'transparent-corneal-dome', 'corneal-softbox-reflection'];
    const records = [], objects = [], materials = new Map(), textures = new Map(), attributes = [], originalDispose = [], listeners = [], active = [];
    const key = object => `${object.parent.name}/${object.name}`;
    const watchOriginal = (resource, label) => { const callback = () => originalDispose.push(label); resource.addEventListener('dispose', callback); listeners.push([resource, callback]); };
    p.model.traverse(object => {
      if (!object.isMesh) return;
      objects.push({ object, geometry: object.geometry, material: object.material, visible: object.visible,
        transform: JSON.stringify([object.position.toArray(), object.quaternion.toArray(), object.scale.toArray()]) });
      if (!roleNames.includes(object.name)) return;
      const material = object.material; demand(!Array.isArray(material), '137 expects one material per eye surface.');
      const record = { object, role: object.name, label: key(object), geometry: object.geometry, material, visible: object.visible };
      records.push(record);
      if (!materials.has(material)) { materials.set(material, { settings: JSON.stringify(settings(material)), bindings: mapBindings(material), metadata: JSON.stringify(material.userData) }); watchOriginal(material, `${record.label}.material`); }
      for (const [slot, texture] of Object.entries(material)) if (texture?.isTexture && !textures.has(texture)) {
        textures.set(texture, { label: `${record.label}.${slot}`, source: texture.source, image: texture.image, version: texture.version, sourceVersion: texture.source.version,
          settings: JSON.stringify(mapSettings(texture)), metadata: JSON.stringify(texture.userData) }); watchOriginal(texture, `${record.label}.${slot}`);
      }
      if (object.name !== 'corneal-softbox-reflection') {
        watchOriginal(object.geometry, `${record.label}.geometry`);
        for (const [name, attribute] of [...Object.entries(object.geometry.attributes), ['index', object.geometry.index]]) if (attribute)
          attributes.push({ record, name, attribute, array: attribute.array, version: attribute.version, itemSize: attribute.itemSize, normalized: attribute.normalized, count: attribute.count });
      }
    });
    const irises = records.filter(record => record.role === 'brown-iris-and-pupil'), scleras = records.filter(record => record.role === 'scleral-globe');
    const corneas = records.filter(record => record.role === 'transparent-corneal-dome'), fakeGlints = records.filter(record => record.role === 'corneal-softbox-reflection');
    demand(irises.length === 2 && scleras.length === 2 && corneas.length === 2 && fakeGlints.length === 4 && fakeGlints.every(record => !record.visible), '137 expected two iris/sclera/cornea surfaces and four hidden fake glints.');
    for (const record of [...irises, ...scleras]) {
      const m = record.material, iris = record.role === 'brown-iris-and-pupil';
      demand(m.isMeshPhysicalMaterial && m.roughness === (iris ? .48 : .40) && m.specularIntensity === (iris ? .10 : .20)
        && m.envMapIntensity === (iris ? .40 : .45) && m.clearcoat === (iris ? 0 : .03) && m.transmission === 0 && m.metalness === 0
        && m.sheen === 0 && m.iridescence === 0 && !m.emissiveMap && m.emissive.r === 0 && m.emissive.g === 0 && m.emissive.b === 0
        && m.opacity === 1 && !m.transparent && m.vertexColors === false && m.toneMapped === true, `137 original response changed on ${record.label}.`);
      demand(m.map?.isCanvasTexture && m.map.channel === 0 && m.map.image.width === 1024 && m.map.image.height === 1536
        && m.map.offset.x === 0 && m.map.offset.y === 0 && m.map.repeat.x === 1 && m.map.repeat.y === 1 && m.map.rotation === 0
        && m.map.flipY === true && m.map.matrixAutoUpdate === true, '137 expects the original untransformed eye atlas on UV0.');
    }
    demand([...irises, ...scleras].every(record => record.material.map === irises[0].material.map), '137 expected the same bound source atlas on both eye layers.');
    for (const record of attributes) record.hash = await fingerprint(record.array);
    for (const [texture, record] of textures) record.hash = await fingerprint(imagePixels(texture));
    const center = p.model.position.clone().set(0, 0, 0);
    for (const record of irises) { const a = record.geometry.getAttribute('position'); center.add(record.object.localToWorld(center.clone().set(a.getX(0), a.getY(0), a.getZ(0)))); }
    center.multiplyScalar(.5);
    const lighting = [], environment = { texture: p.scene.environment, intensity: p.scene.environmentIntensity, lighting: p.state.lighting,
      background: p.scene.background.toArray(), exposure: p.renderer.toneMappingExposure, mapping: p.renderer.toneMapping };
    p.scene.traverse(light => { if (light.isLight) lighting.push({ light, intensity: light.intensity, color: light.color.toArray(),
      position: light.position.toArray(), quaternion: light.quaternion.toArray(), target: light.target?.position.toArray() }); });
    const audit = { sourceSurfaces: records.map(record => ({ role: record.role, label: record.label, visible: record.visible,
      materialType: record.material.type, materialValues: settings(record.material), color: record.material.color.toArray(),
      maps: Object.fromEntries(Object.entries(mapBindings(record.material)).map(([slot, texture]) => [slot, { uuid: texture.uuid, name: texture.name,
        imageSize: [texture.image.width, texture.image.height], properties: mapSettings(texture), sourcePixelHash: textures.get(texture).hash }])) })),
      eyeCenter: center.toArray(), checkpoints: [], materialModes: [], cloneDisposals: [], originalDispose,
      geometryCopies: 0, newTextures: 0, sourceAttributeCount: attributes.length, sourceImageCount: textures.size };

    async function check(stage) {
      for (const record of objects) {
        const current = active.find(item => item.record.object === record.object);
        demand(record.object.geometry === record.geometry && record.object.material === (current?.material || record.material)
          && record.object.visible === record.visible && JSON.stringify([record.object.position.toArray(), record.object.quaternion.toArray(), record.object.scale.toArray()]) === record.transform,
          `137 changed an unrelated object reference/visibility/transform on ${record.object.name}.`);
      }
      for (const record of attributes) demand((record.name === 'index' ? record.record.geometry.index : record.record.geometry.getAttribute(record.name)) === record.attribute
        && record.attribute.array === record.array && record.attribute.version === record.version && record.attribute.itemSize === record.itemSize
        && record.attribute.normalized === record.normalized && record.attribute.count === record.count && await fingerprint(record.array) === record.hash,
        `137 changed original eye geometry ${record.record.label}.${record.name}.`);
      for (const [material, record] of materials) {
        const current = mapBindings(material); demand(JSON.stringify(settings(material)) === record.settings && JSON.stringify(material.userData) === record.metadata
          && Object.keys(current).length === Object.keys(record.bindings).length && Object.entries(record.bindings).every(([slot, texture]) => current[slot] === texture), '137 mutated an original eye material or its map binding.');
      }
      for (const [texture, record] of textures) demand(texture.source === record.source && texture.image === record.image && texture.version === record.version
        && texture.source.version === record.sourceVersion && JSON.stringify(mapSettings(texture)) === record.settings && JSON.stringify(texture.userData) === record.metadata
        && await fingerprint(imagePixels(texture)) === record.hash, '137 changed original atlas bytes, texture identity or sampler state.');
      for (const item of active) demand(JSON.stringify(settings(item.material)) === item.settings && item.material.map === item.record.material.map
        && item.material.color.equals(item.record.material.color), '137 diagnostic material drifted after selection.');
      demand(p.scene.environment === environment.texture && p.scene.environmentIntensity === environment.intensity && p.state.lighting === environment.lighting
        && JSON.stringify(p.scene.background.toArray()) === JSON.stringify(environment.background) && p.renderer.toneMapping === environment.mapping
        && p.renderer.toneMappingExposure === environment.exposure, '137 changed the display or environment.');
      for (const record of lighting) demand(record.light.intensity === record.intensity && JSON.stringify(record.light.color.toArray()) === JSON.stringify(record.color)
        && JSON.stringify(record.light.position.toArray()) === JSON.stringify(record.position) && JSON.stringify(record.light.quaternion.toArray()) === JSON.stringify(record.quaternion)
        && JSON.stringify(record.light.target?.position.toArray()) === JSON.stringify(record.target), '137 changed a light.');
      demand(originalDispose.length === 0, '137 disposed an original resource.');
      audit.checkpoints.push({ stage, originalGeometryAttributesExact: attributes.length, originalMaterialsExact: materials.size, originalImagesExact: textures.size, ok: true });
    }
    async function restore(stage) {
      let error; try { await check(`${stage}-before-restore`); } catch (caught) { error = caught; }
      const expected = active.length, before = audit.cloneDisposals.length;
      for (const item of active) item.record.object.material = item.record.material;
      for (const item of active) item.material.dispose(); active.length = 0;
      demand(audit.cloneDisposals.length - before === expected, '137 did not dispose exactly its diagnostic materials.');
      await check(`${stage}-restored`); if (error) throw error;
      return { originalReferencesRestored: records.every(record => record.object.material === record.material), disposedMaterials: expected, originalResourcesDisposed: originalDispose.length };
    }
    async function setMode(mode) {
      demand([0, 1, 2, 3].includes(mode), '137 unknown diagnostic mode.'); await restore(`mode${mode}-entry`);
      const started = performance.now(), selected = mode === 1 ? irises : mode === 2 ? scleras : mode === 3 ? [...irises, ...scleras] : [], staged = [];
      try {
        for (const record of selected) {
          const original = record.material, material = mode === 3 ? new window.eye137Types.MeshBasicMaterial() : original.clone();
          const item = { record, material, settings: null }; staged.push(item);
          material.addEventListener('dispose', () => audit.cloneDisposals.push({ mode, label: record.label, type: material.type }));
          if (mode === 3) {
            material.map = original.map; material.color.copy(original.color);
            // Preserve the original surface's opacity/depth/face/output state.
            for (const field of ['side', 'opacity', 'transparent', 'alphaTest', 'alphaHash', 'depthTest', 'depthWrite', 'colorWrite', 'blending',
              'premultipliedAlpha', 'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits', 'toneMapped', 'vertexColors', 'fog', 'dithering']) material[field] = original[field];
            material.envMap = null; material.alphaMap = original.alphaMap;
          } else {
            material.specularIntensity = 0; if (mode === 2) material.clearcoat = 0;
            const before = settings(original), after = settings(material), changed = mode === 1 ? ['specularIntensity', 'version'] : ['specularIntensity', 'clearcoat', '_clearcoat', 'version'];
            for (const field of Object.keys(before)) if (!changed.includes(field)) demand(JSON.stringify(after[field]) === JSON.stringify(before[field]), `137 changed unrelated physical field ${field}.`);
            demand(material.envMapIntensity === original.envMapIntensity && material.roughness === original.roughness, '137 must retain physical roughness/environment gain.');
          }
          material.name = `137 diagnostic mode${mode}: ${record.label}`;
          material.needsUpdate = true;
          item.settings = JSON.stringify(settings(material));
        }
      } catch (error) { for (const item of staged) item.material.dispose(); throw error; }
      for (const item of staged) { active.push(item); item.record.object.material = item.material; }
      await check(`mode${mode}-selected`);
      const result = { mode, privateMaterials: active.length, elapsedMs: performance.now() - started,
        surfaces: [...irises, ...scleras].map(record => ({ label: record.label, type: record.object.material.type,
          materialValues: settings(record.object.material), sameSourceMap: record.object.material.map === record.material.map,
          sameSourceColor: record.object.material.color.equals(record.material.color) })) };
      audit.materialModes.push(result); return result;
    }
    async function crops() {
      const result = [];
      for (const record of irises) {
        const uv = record.geometry.getAttribute('uv'), index = record.geometry.index, bounds = [Infinity, Infinity, -Infinity, -Infinity];
        for (let k = 0; k < index.count; k++) {
          const i = index.getX(k), u = uv.getX(i), v = uv.getY(i); bounds[0] = Math.min(bounds[0], u); bounds[1] = Math.min(bounds[1], v); bounds[2] = Math.max(bounds[2], u); bounds[3] = Math.max(bounds[3], v);
        }
        const image = record.material.map.image, left = Math.max(0, Math.floor(bounds[0] * image.width) - 2), right = Math.min(image.width, Math.ceil(bounds[2] * image.width) + 2);
        const top = Math.max(0, Math.floor((1 - bounds[3]) * image.height) - 2), bottom = Math.min(image.height, Math.ceil((1 - bounds[1]) * image.height) + 2);
        const raw = image.getContext('2d', { willReadFrequently: true }).getImageData(left, top, right - left, bottom - top);
        const canvas = document.createElement('canvas'); canvas.width = raw.width; canvas.height = raw.height; canvas.getContext('2d').putImageData(raw, 0, 0);
        const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('137 could not encode a raw atlas crop.')), 'image/png'));
        result.push({ eye: record.object.parent.name, label: record.label, mapUUID: record.material.map.uuid, uvBounds: bounds,
          atlasSize: [image.width, image.height], rectangle: [left, top, raw.width, raw.height], sourceRGBAHash: await fingerprint(raw.data),
          note: 'Unaltered raw top-down atlas crop covering indexed iris UV0 plus2 source pixels; no scaling, recoloring or rebake.',
          pngBytes: Array.from(new Uint8Array(await blob.arrayBuffer())) });
      }
      await check('after-unaltered-atlas-crops'); return result;
    }
    window.eyeOwner137 = { audit, center, check, restore, setMode, crops,
      unwatch() { for (const [resource, callback] of listeners) resource.removeEventListener('dispose', callback); } };
    await check('native-baseline');
    return { nativeWebGPU: true, sourceIteration: 133, displayedDiagnosticIteration: 137, eyeCenter: center.toArray(),
      sourceSurfaceCount: records.length, originalEyeAttributes: attributes.length, originalAtlasCount: textures.size,
      display: { mapping: p.renderer.toneMapping, exposure: p.renderer.toneMappingExposure, lighting: p.state.lighting },
      sourceValues: audit.sourceSurfaces, heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
  });
  const crops = await page.evaluate(() => window.eyeOwner137.crops());
  for (const crop of crops) {
    const { pngBytes, ...metadata } = crop, file = `eye137-bound-atlas-${crop.eye}.png`, bytes = Buffer.from(pngBytes);
    await writeFile(path.join(qa, file), bytes); report.crops.push({ ...metadata, file: `output/qa/${file}`, bytes: bytes.length, pngSHA256: digest(bytes) });
  }
  for (const mode of modes) {
    const result = { mode, label: labels[mode], captures: {}, selection: await page.evaluate(value => window.eyeOwner137.setMode(value), mode) }; report.results.push(result);
    for (const view of views) {
      await page.evaluate(async view => {
        const p = window.portrait; p.setView('detail');
        if (view === 'eye-detail') {
          const center = window.eyeOwner137.center, span = 1.6, aspect = p.state.width / p.state.height;
          p.camera.left = -span * aspect / 2; p.camera.right = span * aspect / 2; p.camera.top = span / 2; p.camera.bottom = -span / 2;
          p.camera.zoom = 1; p.camera.up.set(0, 1, 0); p.camera.position.copy(center).add(p.model.position.clone().set(0, 0, 8));
          p.controls.target.copy(center); p.camera.lookAt(center); p.camera.updateProjectionMatrix(); p.controls.update();
        }
        p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        if (p.renderer.domElement.width !== 900 || p.renderer.domElement.height !== 1200 || p.state.internalRender.width !== 1800 || p.state.internalRender.height !== 2400) throw new Error('137 output/AA dimensions changed.');
      }, view);
      const file = `eye137-${mode}-${view}.png`, bytes = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, file) });
      result.captures[view] = { file: `output/qa/${file}`, bytes: bytes.length, sha256: digest(bytes) };
    }
    await page.evaluate(value => window.eyeOwner137.check(`mode${value}-after-views`), mode);
    result.cleanup = await page.evaluate(value => window.eyeOwner137.restore(`mode${value}-complete`), mode); result.status = 'Passed';
    await persist(); console.log(JSON.stringify({ candidate: 137, mode, label: result.label, status: result.status, selectionMs: result.selection.elapsedMs, cleanup: result.cleanup }));
  }
  await page.evaluate(async () => { const p = window.portrait; p.setView('detail'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); await window.eyeOwner137.check('restored-source-native-frame'); });
  const restored = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, 'eye137-restored-detail.png') });
  report.restored = { file: 'output/qa/eye137-restored-detail.png', sha256: digest(restored), matchesBaselineDetailPNG: digest(restored) === report.results[0].captures.detail.sha256 };
  if (!report.restored.matchesBaselineDetailPNG) throw new Error('137 restored detail differs from its original matched compositor capture.');
  const frames = await page.evaluate(() => window.portrait.state.renderedFrames); await page.waitForTimeout(450);
  report.idleFrames = await page.evaluate(value => window.portrait.state.renderedFrames - value, frames);
  if (report.idleFrames !== 0) throw new Error('137 unexpectedly added idle rendering.');
  if (errors.length) throw new Error(`137 browser errors: ${JSON.stringify(errors)}`);
  report.status = 'Native source, diagnostic material and restoration checks passed; visual owner interpretation pending';
} catch (error) { failure = error; report.status = 'Failed'; report.failure = error.message; }
finally {
  if (page) {
    try { if (await page.evaluate(() => Boolean(window.eyeOwner137))) report.finalCleanup = await page.evaluate(() => window.eyeOwner137.restore('finally')); }
    catch (error) { report.cleanupFailure = error.message; failure ||= error; }
    try { report.audit = await page.evaluate(() => { const state = window.eyeOwner137; state?.unwatch(); return state?.audit || null; }); }
    catch (error) { report.auditFailure = error.message; failure ||= error; }
    try { await page.close(); } catch (error) { report.pageCloseFailure = error.message; failure ||= error; }
  }
  report.browserErrors = errors;
  try { await browser?.close(); } catch (error) { report.browserCloseFailure = error.message; failure ||= error; }
  if (failure || errors.length) report.status = 'Failed'; await persist();
}
if (failure) throw failure;
console.log(JSON.stringify({ candidate: 137, status: report.status, crops: report.crops.map(crop => ({ eye: crop.eye, rectangle: crop.rectangle, file: crop.file })),
  restored: report.restored, idleFrames: report.idleFrames, browserErrors: errors }));
