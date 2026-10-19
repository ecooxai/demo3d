import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Root-only native comparison: accepted133/full130, then the approved single
// half-profile blend. No parameter sweep, material change or export test.
// Apply after the ordinary baseline frame has completed its native uploads.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const main = await readFile(path.join(root, 'src/main.js'), 'utf8');
const expectedMain = '73d1b1589a6cb942353bd5d7301af47680e7e5510fe6f140b4aaa5c233004136';
const marker = 'state.mouthContinuity130=applyMouthContinuity130(anatomicalHead,{strength:1});';
if (digest(main) !== expectedMain || main.split(marker).length !== 2 || !main.includes('diagonalFringe133:1')
  || !main.includes('renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.4;')
  || main.includes('applyLipEdgeMaterial135') || main.includes('applyUpperLipRelief140'))
  throw new Error('140 requires frozen accepted133, full130 lips, Neutral1.4, and no135 or140 already applied.');
const modes = [0, 1], views = ['front', 'detail', 'left', 'right', 'back', 'lip', 'lip-quarter'];
const bridge = "\nwindow.upperLip140Bridge={head:anatomicalHead,apply:applyUpperLipRelief140,release:releaseUpperLipRelief140,spec:UPPER_LIP_RELIEF140_SPEC};\n";
const entry = "import {applyUpperLipRelief140,releaseUpperLipRelief140,UPPER_LIP_RELIEF140_SPEC} from '../review/upper-lip-relief-candidate140.js';\n" + main + bridge;
const bundle = path.join(qa, 'app-upper-lip-relief140.js');
await build({ stdin: { contents: entry, resolveDir: path.join(root, 'src'), sourcefile: 'main-upper-lip-relief140.js', loader: 'js' },
  bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, outfile: bundle, logLevel: 'silent' });
const files = ['src/main.js', 'src/face.js', 'src/lip-continuity.js', 'src/render-quality.js',
  'review/upper-lip-relief-candidate140.js', 'review/upper-lip-relief140-audit.mjs',
  'review/upper-lip-relief140-source-audit.json', 'review/upper-lip-relief140-native.mjs'];
const hashes = Object.fromEntries(await Promise.all(files.map(async file => {
  const bytes = await readFile(path.join(root, file)); return [file, { bytes: bytes.length, sha256: digest(bytes) }];
})));
const report = { candidate: 140, status: 'Running', acceptedBase: 133, acceptedMouthContinuity130: 1, scoreUnchanged: 77,
  modes, views, display: { mapping: 7, exposure: 1.4, resolution: [900, 1200], antialiasing: 2, lighting: 'soft' }, files: hashes, results: [],
  interpretation: 'Only the fixed inward upper-lip relief and its analytically transported accepted130 normals change. The authored-normal transport audit and finite-triangle geometry audit are separate. Art gain is pending these native images.' };
const persist = () => writeFile(path.join(qa, 'upper-lip-relief140-native.json'), JSON.stringify(report, null, 2) + '\n');
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
    const p = window.portrait, bridge = window.upperLip140Bridge;
    const demand = (condition, message) => { if (!condition) throw new Error(message); };
    demand(p.ready, `140 preparation failed: ${document.querySelector('#gate-message').textContent}`);
    demand(p.renderer.backend?.isWebGPUBackend === true, '140 requires native WebGPU; no fallback is performed.');
    demand(p.renderer.toneMapping === 7 && p.renderer.toneMappingExposure === 1.4 && p.state.lighting === 'soft', '140 requires accepted Neutral1.4 and soft lighting.');
    demand(p.state.mouthContinuity130?.applied && p.state.mouthContinuity130?.strength === 1 && bridge?.head?.isObject3D, '140 requires the accepted full130 head.');
    p.setScore(140, 77); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2); p.setView('front');
    p.model.updateWorldMatrix(true, true); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();

    const fingerprint = async data => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength))), value => value.toString(16).padStart(2, '0')).join('');
    const settings = material => Object.fromEntries(Object.entries(material).filter(([key, value]) => !['id', 'uuid', 'name'].includes(key)
      && (value === null || ['number', 'boolean', 'string'].includes(typeof value) || value?.isColor || value?.isVector2 || value?.isVector3 || value?.isVector4))
      .map(([key, value]) => [key, value?.toArray ? value.toArray() : value]));
    const mapBindings = material => Object.fromEntries(Object.entries(material).filter(([, value]) => value?.isTexture));
    const mapSettings = texture => ({ channel: texture.channel, format: texture.format, type: texture.type, colorSpace: texture.colorSpace,
      wrapS: texture.wrapS, wrapT: texture.wrapT, minFilter: texture.minFilter, magFilter: texture.magFilter, anisotropy: texture.anisotropy,
      flipY: texture.flipY, generateMipmaps: texture.generateMipmaps, premultiplyAlpha: texture.premultiplyAlpha, unpackAlignment: texture.unpackAlignment,
      rotation: texture.rotation, offset: texture.offset.toArray(), repeat: texture.repeat.toArray(), center: texture.center.toArray(),
      matrixAutoUpdate: texture.matrixAutoUpdate, manualMatrix: texture.matrixAutoUpdate ? null : texture.matrix.toArray() });
    const pixels = texture => texture.image?.data?.buffer ? texture.image.data
      : texture.image?.getContext ? texture.image.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, texture.image.width, texture.image.height).data
        : (() => { throw new Error('140 cannot inspect a bound source face/lip image.'); })();
    const transform = object => JSON.stringify([object.position.toArray(), object.quaternion.toArray(), object.scale.toArray()]);
    const entries = geometry => [...Object.entries(geometry.attributes), ['index', geometry.index]].filter(([, attribute]) => attribute);
    const objects = [], geometries = new Map(), records = [], materials = new Map(), textures = new Map(), originalAttributes = [];
    const allSourceAttributes = new Set(), allSourceBuffers = new Set(), sourceResources = new Set(), listeners = [];
    const originalDispose = [], privateDispose = [], targetNames = new Set(['continuous-face', 'upper-lip', 'lower-lip']);
    let active = null;
    const watch = (resource, label) => {
      if (!resource || sourceResources.has(resource)) return; sourceResources.add(resource);
      const callback = () => originalDispose.push(label); resource.addEventListener('dispose', callback); listeners.push([resource, callback]);
    };
    p.model.traverse(object => {
      if (!object.isMesh) return;
      const geometry = object.geometry, material = object.material, label = `${object.parent.name}/${object.name}`;
      objects.push({ object, geometry, material, materialSlots: Array.isArray(material) ? material.slice() : null,
        visible: object.visible, parent: object.parent, transform: transform(object),
        castShadow: object.castShadow, receiveShadow: object.receiveShadow });
      if (!geometries.has(geometry)) geometries.set(geometry, { label, index: geometry.index, attributes: { ...geometry.attributes },
        bounds: JSON.stringify([geometry.boundingBox, geometry.boundingSphere]), groups: JSON.stringify(geometry.groups),
        drawRange: JSON.stringify(geometry.drawRange), metadata: JSON.stringify(geometry.userData) });
      watch(geometry, `${label}.geometry`);
      for (const [, attribute] of entries(geometry)) {
        allSourceAttributes.add(attribute); allSourceBuffers.add(attribute.array.buffer);
      }
      for (const m of Array.isArray(material) ? material : [material]) {
        watch(m, `${label}.material`);
        for (const [slot, texture] of Object.entries(m)) if (texture?.isTexture) watch(texture, `${label}.${slot}`);
      }
      if (!targetNames.has(object.name)) return;
      if (object.name === 'continuous-face') demand(Array.isArray(material) && material.length === 2,
        '140 expects the original continuous-face front/rear material array.');
      else demand(!Array.isArray(material), `140 expects a single original material on ${object.name}.`);
      const record = { object, geometry, material, name: object.name, label }; records.push(record);
      for (const [key, attribute] of entries(geometry)) originalAttributes.push({ record, geometry, key, attribute, array: attribute.array,
        version: attribute.version, itemSize: attribute.itemSize, normalized: attribute.normalized, count: attribute.count, usage: attribute.usage, gpuType: attribute.gpuType });
      for (const [index, m] of (Array.isArray(material) ? material : [material]).entries()) {
        const materialLabel = Array.isArray(material) ? `${label}.material[${index}]` : label;
        if (!materials.has(m)) materials.set(m, { label: materialLabel, settings: JSON.stringify(settings(m)),
          bindings: mapBindings(m), metadata: JSON.stringify(m.userData) });
        for (const [slot, texture] of Object.entries(m)) if (texture?.isTexture && !textures.has(texture)) textures.set(texture,
          { label: `${materialLabel}.${slot}`, source: texture.source, image: texture.image, data: texture.image?.data,
            version: texture.version, sourceVersion: texture.source.version, settings: JSON.stringify(mapSettings(texture)), metadata: JSON.stringify(texture.userData) });
      }
    });
    for (const name of targetNames) demand(records.filter(record => record.name === name).length === 1, `140 requires exactly one ${name}.`);
    const upper = records.find(record => record.name === 'upper-lip'), lower = records.find(record => record.name === 'lower-lip');
    const creases = objects.filter(record => record.object.name === 'closed-mouth-crease');
    demand(creases.length === 1 && !creases[0].visible, '140 requires the accepted hidden independent mouth tube.');
    demand(upper.geometry.index.count === 9600 && upper.geometry.getAttribute('position').count === 1717, '140 upper-lip topology differs.');
    demand(upper.material.isMeshPhysicalMaterial && lower.material.isMeshPhysicalMaterial
      && upper.material.roughness === .44 && lower.material.roughness === .44
      && upper.material.clearcoat === .12 && lower.material.clearcoat === .12
      && !upper.material.roughnessMap && !lower.material.roughnessMap && !upper.material.clearcoatMap && !lower.material.clearcoatMap,
    '140 requires the unchanged original lip material, without rejected135 edge maps.');
    for (const record of originalAttributes) record.hash = await fingerprint(record.array);
    for (const [texture, record] of textures) record.hash = await fingerprint(pixels(texture));

    // Same original geometry-based close camera as139. Calculate it once before
    // deformation; the candidate cannot move its own comparison camera.
    const center = p.model.position.clone().set(0, 0, 0);
    for (const record of [upper, lower]) {
      demand(Boolean(record.geometry.boundingBox), '140 expects already computed full130 lip bounds.');
      center.add(record.object.localToWorld(record.geometry.boundingBox.getCenter(center.clone().set(0, 0, 0))));
    }
    center.multiplyScalar(.5);
    const environment = { texture: p.scene.environment, intensity: p.scene.environmentIntensity, background: p.scene.background.toArray() }, lighting = [];
    p.scene.traverse(light => { if (light.isLight) lighting.push({ light, intensity: light.intensity, color: light.color.toArray(),
      position: light.position.toArray(), quaternion: light.quaternion.toArray(), target: light.target?.position.toArray() }); });
    const audit = { spec: bridge.spec, sourceIteration: 133, closeupCenter: center.toArray(), sourceAttributeCount: originalAttributes.length,
      sourceImageCount: textures.size, sourceGeometryCount: geometries.size,
      sourceMaterialBindings: records.map(record => ({ surface: record.name, array: Array.isArray(record.material),
        slots: (Array.isArray(record.material) ? record.material : [record.material]).map((material, index) =>
          ({ index, uuid: material.uuid, name: material.name, type: material.type, maps: Object.keys(mapBindings(material)) })) })),
      sourceMaterials: [...materials].map(([material, record]) =>
        ({ label: record.label, type: material.type, values: settings(material), maps: Object.keys(record.bindings) })),
      sourceAttributes: originalAttributes.map(record => ({ surface: record.record.name, key: record.key, type: record.array.constructor.name,
        length: record.array.length, bytes: record.array.byteLength, version: record.version, sha256: record.hash })),
      sourceImages: [...textures].map(([texture, record]) => ({ label: record.label, size: [texture.image.width, texture.image.height],
        version: record.version, sourceVersion: record.sourceVersion, properties: mapSettings(texture), sha256: record.hash })),
      checkpoints: [], applications: [], originalDispose, privateDispose,
      snapshotStage: 'After the ordinary first native frame and GPU queue completion; index uploads have already settled.',
      normalInterpretation: 'Transported authored shading normals are retained as authored normals. Actual triangle orientation, areas and face clearance are measured independently by the helper; baseline authored/triangle disagreement is not a transport failure.' };

    async function inspectAttribute(record, stage, scope) {
      const { geometry, key, attribute, array } = record;
      const current = key === 'index' ? geometry.index : geometry.getAttribute(key);
      const currentHash = current?.array ? await fingerprint(current.array) : null;
      const violations = [];
      if (current !== attribute) violations.push('attribute reference');
      if (current?.array !== array) violations.push('typed array reference');
      if (current?.array?.constructor !== array.constructor) violations.push('typed array type');
      if (current?.version !== record.version) violations.push('attribute version');
      if (current?.itemSize !== record.itemSize || current?.normalized !== record.normalized || current?.count !== record.count
        || current?.usage !== record.usage || current?.gpuType !== record.gpuType) violations.push('layout/usage');
      if (currentHash !== record.hash) violations.push('full source bytes');
      if (violations.length) {
        audit.integrityFailure = { scope, stage, surface: record.record.name, attribute: key, violations,
          expected: { type: array.constructor.name, length: array.length, bytes: array.byteLength, version: record.version, sha256: record.hash },
          actual: { type: current?.array?.constructor.name, length: current?.array?.length, bytes: current?.array?.byteLength,
            version: current?.version, sha256: currentHash, sameAttribute: current === attribute, sameArray: current?.array === array } };
        throw new Error(`140 ${scope} integrity failed on ${record.record.name}.${key} at ${stage}: ${violations.join(', ')}.`);
      }
    }
    async function check(stage) {
      for (const record of objects) {
        const expected = active && record.object === upper.object ? active.geometry : record.geometry;
        demand(record.object.geometry === expected && record.object.material === record.material && record.object.parent === record.parent
          && (!record.materialSlots || (record.object.material.length === record.materialSlots.length
            && record.materialSlots.every((material, index) => record.object.material[index] === material)))
          && record.object.visible === record.visible && transform(record.object) === record.transform
          && record.object.castShadow === record.castShadow && record.object.receiveShadow === record.receiveShadow,
        `140 changed an unrelated reference, visibility or transform on ${record.object.name} at ${stage}.`);
      }
      for (const [geometry, record] of geometries) demand(geometry.index === record.index
        && Object.keys(geometry.attributes).length === Object.keys(record.attributes).length
        && Object.entries(record.attributes).every(([key, attribute]) => geometry.getAttribute(key) === attribute)
        && JSON.stringify([geometry.boundingBox, geometry.boundingSphere]) === record.bounds
        && JSON.stringify(geometry.groups) === record.groups && JSON.stringify(geometry.drawRange) === record.drawRange
        && JSON.stringify(geometry.userData) === record.metadata, `140 changed original geometry bindings/metadata on ${record.label} at ${stage}.`);
      for (const record of originalAttributes) await inspectAttribute(record, stage, 'original');
      if (active) for (const record of active.attributes) await inspectAttribute(record, stage, 'prepared private');
      for (const [material, record] of materials) {
        const current = mapBindings(material);
        demand(JSON.stringify(settings(material)) === record.settings && JSON.stringify(material.userData) === record.metadata
          && Object.keys(current).length === Object.keys(record.bindings).length
          && Object.entries(record.bindings).every(([slot, texture]) => current[slot] === texture), `140 changed source material ${record.label} at ${stage}.`);
      }
      for (const [texture, record] of textures) demand(texture.source === record.source && texture.image === record.image && texture.image?.data === record.data
        && texture.version === record.version && texture.source.version === record.sourceVersion
        && JSON.stringify(mapSettings(texture)) === record.settings && JSON.stringify(texture.userData) === record.metadata
        && await fingerprint(pixels(texture)) === record.hash, `140 changed source image/sampler ${record.label} at ${stage}.`);
      demand(p.scene.environment === environment.texture && p.scene.environmentIntensity === environment.intensity
        && JSON.stringify(p.scene.background.toArray()) === JSON.stringify(environment.background), `140 changed the environment at ${stage}.`);
      for (const record of lighting) demand(record.light.intensity === record.intensity
        && JSON.stringify([record.light.color.toArray(), record.light.position.toArray(), record.light.quaternion.toArray(), record.light.target?.position.toArray()])
        === JSON.stringify([record.color, record.position, record.quaternion, record.target]), `140 changed a source light at ${stage}.`);
      demand(p.renderer.backend?.isWebGPUBackend === true && p.renderer.toneMapping === 7 && p.renderer.toneMappingExposure === 1.4
        && p.state.lighting === 'soft' && p.state.antialiasing === 2 && p.state.width === 900 && p.state.height === 1200,
      `140 changed the accepted display/backend at ${stage}.`);
      demand(originalDispose.length === 0, `140 disposed an original resource at ${stage}.`);
      audit.checkpoints.push({ stage, exactOriginalAttributes: originalAttributes.length, exactPrivateAttributes: active?.attributes.length || 0,
        exactSourceImages: textures.size, originalResourcesDisposed: originalDispose.length, ok: true });
    }
    async function restore(stage) {
      let beforeError; try { await check(`${stage}-before-release`); } catch (error) { beforeError = error; }
      const expected = active, before = privateDispose.length, released = bridge.release(bridge.head); active = null;
      const cleanup = { stage, ...released, originalGeometryRestored: upper.object.geometry === upper.geometry,
        privateGeometryDisposalsThisCall: privateDispose.length - before, originalResourcesDisposed: originalDispose.length,
        fullyPrivateDisposedBindings: privateDispose.every(record => record.sharedSourceAttributes === 0 && record.sharedSourceBuffers === 0) };
      demand(cleanup.originalGeometryRestored && cleanup.privateGeometryDisposalsThisCall === (expected ? 1 : 0)
        && cleanup.fullyPrivateDisposedBindings && originalDispose.length === 0, `140 cleanup failed at ${stage}.`);
      if (expected) demand(released.privateAttributeBytesReleased === expected.metrics.privateAttributeBytes, '140 reported an incorrect private allocation release.');
      await check(`${stage}-after-release`); if (beforeError) throw beforeError; return cleanup;
    }
    async function setMode(strength) {
      demand(strength === 0 || strength === 1, '140 has exactly one approved on/off study.');
      await restore(`before-mode${strength}`);
      const metrics = bridge.apply(bridge.head, { strength }), result = { strength, metrics, copiedSourceBytes: 0,
        protectedVertices: 0, exactLocalXYValues: 0, localXYValues: 1717 * 2, extraDrawGroups: 0, privateMaterials: 0, privateTextures: 0 };
      audit.applications.push(result);
      if (strength) {
        const geometry = upper.object.geometry;
        active = { geometry, metrics, attributes: [] };
        demand(geometry !== upper.geometry, '140 requires one private upper-lip geometry.');
        geometry.addEventListener('dispose', () => privateDispose.push({ surface: upper.name,
          sharedSourceAttributes: entries(geometry).filter(([, attribute]) => allSourceAttributes.has(attribute)).length,
          sharedSourceBuffers: entries(geometry).filter(([, attribute]) => allSourceBuffers.has(attribute.array.buffer)).length,
          boundBytes: entries(geometry).reduce((sum, [, attribute]) => sum + attribute.array.byteLength, 0) }));
        demand(Object.keys(geometry.attributes).length === Object.keys(upper.geometry.attributes).length
          && JSON.stringify(geometry.groups) === JSON.stringify(upper.geometry.groups)
          && JSON.stringify(geometry.drawRange) === JSON.stringify(upper.geometry.drawRange), '140 changed attribute slots, draw groups or range.');
        for (const [key, original] of entries(upper.geometry)) {
          const attribute = key === 'index' ? geometry.index : geometry.getAttribute(key);
          demand(attribute && attribute.itemSize === original.itemSize && attribute.count === original.count && attribute.normalized === original.normalized
            && attribute.array.constructor === original.array.constructor && !allSourceAttributes.has(attribute) && !allSourceBuffers.has(attribute.array.buffer),
          `140 private ${key} layout/ownership changed.`);
          const hash = await fingerprint(attribute.array);
          if (!['position', 'normal'].includes(key)) {
            demand(hash === await fingerprint(original.array), `140 changed protected ${key} bytes.`); result.copiedSourceBytes += attribute.array.byteLength;
          }
          active.attributes.push({ record: upper, geometry, key, attribute, array: attribute.array, version: attribute.version,
            itemSize: attribute.itemSize, normalized: attribute.normalized, count: attribute.count, usage: attribute.usage, gpuType: attribute.gpuType, hash });
        }
        const beforeP = upper.geometry.getAttribute('position'), afterP = geometry.getAttribute('position');
        const beforeN = upper.geometry.getAttribute('normal'), afterN = geometry.getAttribute('normal');
        for (let row = 0; row <= 16; row++) for (let col = 0; col <= 100; col++) {
          const i = row * 101 + col, x = -.241 + .482 * col / 100;
          for (let axis = 0; axis < 2; axis++) if (Object.is(beforeP.array[3 * i + axis], afterP.array[3 * i + axis])) result.exactLocalXYValues++;
          if (row === 0 || row >= 14 || Math.abs(x) >= .235) {
            for (let axis = 0; axis < 3; axis++) demand(Object.is(beforeP.array[3 * i + axis], afterP.array[3 * i + axis])
              && Object.is(beforeN.array[3 * i + axis], afterN.array[3 * i + axis]), `140 changed fixed border, seam or corner vertex${i}.`);
            result.protectedVertices++;
          }
        }
        demand(result.protectedVertices === 456 && metrics.minimumRepairedClearance >= bridge.spec.minimumClearance
          && metrics.projectedOrientationFlips === 0 && metrics.minimumTriangleAreaRatio > 0
          && metrics.maximumOutwardDisplacement === 0 && metrics.maximumDepthReduction <= .006904
          && metrics.minimumJacobian > .9999999999 && metrics.maximumJacobian < 1.0000000001
          && metrics.extraAuthoredNormalEdit === false && metrics.materialChanged === false && metrics.textureChanged === false,
        '140 exceeded its guarded geometry/normal bounds.');
        demand(bridge.apply(bridge.head, { strength }) === metrics && upper.object.geometry === geometry, '140 once-call idempotence failed.');
        result.privateAttributeHashes = active.attributes.map(record => ({ key: record.key, type: record.array.constructor.name,
          bytes: record.array.byteLength, version: record.version, sha256: record.hash }));
      } else demand(upper.object.geometry === upper.geometry && !metrics.applied && metrics.privateGeometryCount === 0,
        '140 off mode changed the accepted geometry.');
      await check(`mode${strength}-selected-before-native-upload`); return result;
    }
    window.lipReliefAudit140 = { audit, center, check, restore, setMode,
      unwatch() { for (const [resource, callback] of listeners) resource.removeEventListener('dispose', callback); } };
    await check('native-baseline');
    return { nativeWebGPU: true, acceptedIteration: 133, displayedIteration: 140, sourceUpperIndexType: upper.geometry.index.array.constructor.name,
      sourceAttributeCount: originalAttributes.length, sourceImageCount: textures.size, closeupCenter: center.toArray(),
      display: { mapping: p.renderer.toneMapping, exposure: p.renderer.toneMappingExposure, lighting: p.state.lighting },
      heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
  });
  for (const strength of modes) {
    const result = { strength, captures: {} }; report.results.push(result);
    result.selection = await page.evaluate(value => window.lipReliefAudit140.setMode(value), strength);
    for (const view of views) {
      await page.evaluate(async view => {
        const p = window.portrait;
        if (view === 'lip' || view === 'lip-quarter') {
          p.setView('detail'); const center = window.lipReliefAudit140.center, span = 1.45, aspect = p.state.width / p.state.height;
          p.camera.left = -span * aspect / 2; p.camera.right = span * aspect / 2; p.camera.top = span / 2; p.camera.bottom = -span / 2;
          p.camera.zoom = 1; p.camera.up.set(0, 1, 0);
          p.camera.position.copy(center).add(p.model.position.clone().set(view === 'lip-quarter' ? 2.3 : 0, 0, 8));
          p.controls.target.copy(center); p.camera.lookAt(center); p.camera.updateProjectionMatrix(); p.controls.update();
        } else p.setView(view);
        p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        if (!p.renderer.backend?.isWebGPUBackend || p.renderer.domElement.width !== 900 || p.renderer.domElement.height !== 1200
          || p.state.internalRender.width !== 1800 || p.state.internalRender.height !== 2400)
          throw new Error('140 native backend or output/AA dimensions changed.');
      }, view);
      const file = `lip140-${strength}-${view}.png`, bytes = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, file) });
      result.captures[view] = { file: `output/qa/${file}`, bytes: bytes.length, sha256: digest(bytes) };
    }
    await page.evaluate(value => window.lipReliefAudit140.check(`mode${value}-after-native-views`), strength);
    const frames = await page.evaluate(() => window.portrait.state.renderedFrames); await page.waitForTimeout(450);
    result.idleFrames = await page.evaluate(value => window.portrait.state.renderedFrames - value, frames);
    if (result.idleFrames !== 0) throw new Error('140 unexpectedly added idle rendering.');
    result.cleanup = await page.evaluate(value => window.lipReliefAudit140.restore(`mode${value}-complete`), strength);
    result.status = 'Passed'; await persist();
    console.log(JSON.stringify({ candidate: 140, strength, status: result.status, helperMs: result.selection.metrics.elapsedMs,
      privateBytes: result.selection.metrics.privateAttributeBytes, minimumClearance: result.selection.metrics.minimumRepairedClearance,
      idleFrames: result.idleFrames, cleanup: result.cleanup }));
  }
  await page.evaluate(async () => {
    const p = window.portrait; p.setView('front'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
    await window.lipReliefAudit140.check('restored-source-native-frame');
  });
  const restored = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, 'lip140-restored-front.png') });
  report.restored = { file: 'output/qa/lip140-restored-front.png', sha256: digest(restored), matchesBaselineFrontPNG: digest(restored) === report.results[0].captures.front.sha256 };
  if (!report.restored.matchesBaselineFrontPNG) throw new Error('140 restored frontal compositor capture differs from its original matched baseline.');
  if (errors.length) throw new Error(`140 browser errors: ${JSON.stringify(errors)}`);
  report.status = 'Native source, bounded geometry and restoration checks passed; art review pending';
} catch (error) { failure = error; report.status = 'Failed'; report.failure = error.message; }
finally {
  if (page) {
    try { if (await page.evaluate(() => Boolean(window.lipReliefAudit140))) report.finalCleanup = await page.evaluate(() => window.lipReliefAudit140.restore('finally')); }
    catch (error) { report.cleanupFailure = error.message; failure ||= error; }
    try { report.audit = await page.evaluate(() => { const state = window.lipReliefAudit140; state?.unwatch(); return state?.audit || null; }); }
    catch (error) { report.auditFailure = error.message; failure ||= error; }
    try { await page.close(); } catch (error) { report.pageCloseFailure = error.message; failure ||= error; }
  }
  report.browserErrors = errors;
  try { await browser?.close(); } catch (error) { report.browserCloseFailure = error.message; failure ||= error; }
  if (failure || errors.length) report.status = 'Failed'; await persist();
}
if (failure) throw failure;
console.log(JSON.stringify({ candidate: 140, status: report.status, restored: report.restored, browserErrors: errors }));
