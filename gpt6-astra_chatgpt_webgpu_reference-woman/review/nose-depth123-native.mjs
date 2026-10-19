import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Root-only native comparison, bundled against LIVE production main122 plus
// accepted guide118. Nothing is written to src or the production app bundle.
// Use the ordinary AA2 render path: never compile the scene at screen target.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const source = await readFile(path.join(root, 'src/main.js'), 'utf8');
const skinMarker = 'if(!skinIlluminationApplied){state.skinIllumination=compensateReferenceSkin(anatomicalHead,scene,{strength:.35});skinIlluminationApplied=true;}';
const readyMarker = 'state.backend=backend;state.ready=true;';
if ([skinMarker, readyMarker].some(value => source.split(value).length !== 2) || source.includes('applyNoseDepth123')) throw new Error('123 expects unique accepted skin/renderer markers and no existing123 application.');
if (!(source.indexOf('state.balance=applyPortraitBalance(') < source.indexOf(skinMarker) && source.includes('scenePreparationPromise??='))) throw new Error('123 must follow the live accepted one-time preparation and illumination.');
const depths = (process.env.NOSE123_DEPTHS || '0,.012,.024').split(',').map(Number);
if (!depths.length || new Set(depths).size !== depths.length || depths.some(value => ![0, .012, .024].includes(value))) throw new Error('NOSE123_DEPTHS must select unique depths from0,.012,.024.');
const views = ['front', 'detail', 'left', 'right', 'back', 'nose', 'nose-quarter'];

async function auditApplyNose123(head, model, depth, THREE) {
  const demand = (condition, message) => { if (!condition) throw new Error(message); };
  const fingerprint = async array => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(array.buffer, array.byteOffset, array.byteLength))), value => value.toString(16).padStart(2, '0')).join('');
  const names = new Set(NOSE_DEPTH123_SPEC.targets), originals = [], objects = [], arrays = new Map(), maps = new Map(), materials = new Map();
  const scalarSettings = material => Object.fromEntries(Object.entries(material).filter(([key, value]) => !['id', 'uuid', 'name'].includes(key)
    && (value === null || ['number', 'boolean', 'string'].includes(typeof value) || value?.isColor || value?.isVector2 || value?.isVector3 || value?.isVector4))
    .map(([key, value]) => [key, value?.toArray ? value.toArray() : value]));
  const textureSettings = texture => ({ channel: texture.channel, format: texture.format, type: texture.type, colorSpace: texture.colorSpace,
    wrapS: texture.wrapS, wrapT: texture.wrapT, minFilter: texture.minFilter, magFilter: texture.magFilter, anisotropy: texture.anisotropy,
    flipY: texture.flipY, generateMipmaps: texture.generateMipmaps, premultiplyAlpha: texture.premultiplyAlpha, unpackAlignment: texture.unpackAlignment,
    rotation: texture.rotation, offset: texture.offset.toArray(), repeat: texture.repeat.toArray(), center: texture.center.toArray(),
    matrixAutoUpdate: texture.matrixAutoUpdate, manualMatrix: texture.matrixAutoUpdate ? null : texture.matrix.toArray() });
  const pixels = texture => {
    const image = texture.image;
    if (image?.data?.buffer) return image.data;
    if (image?.getContext) return image.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, image.width, image.height).data;
    throw new Error(`123 cannot hash the procedural source image of ${texture.name || texture.uuid}.`);
  };
  const addAttributes = (mesh, geometry, scope) => {
    for (const [key, attribute] of [...Object.entries(geometry.attributes), ['index', geometry.index]]) if (attribute) {
      if (!arrays.has(attribute)) arrays.set(attribute, { array: attribute.array, version: attribute.version, itemSize: attribute.itemSize, count: attribute.count,
        normalized: attribute.normalized, usage: attribute.usage, isIndex: key === 'index', labels: [] });
      const record = arrays.get(attribute); record.isIndex &&= key === 'index'; record.labels.push({ mesh: mesh.name, attribute: key, scope });
    }
  };
  model.updateWorldMatrix(true, true);
  model.traverse(object => {
    const record = { object, geometry: object.geometry, material: object.material, children: object.children.slice(), name: object.name,
      visible: object.visible, position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray(),
      attributes: { ...object.geometry?.attributes }, index: object.geometry?.index, groups: JSON.stringify(object.geometry?.groups),
      geometryBounds: object.geometry ? JSON.stringify([object.geometry.boundingBox, object.geometry.boundingSphere]) : null };
    objects.push(record);
    if (object.isMesh) {
      addAttributes(object, object.geometry, 'source');
      if (names.has(object.name)) originals.push({ mesh: object, geometry: object.geometry });
    }
    for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) {
      if (!materials.has(material)) materials.set(material, { scalar: JSON.stringify(scalarSettings(material)), maps: Object.fromEntries(Object.entries(material).filter(([, value]) => value?.isTexture)) });
      for (const [slot, texture] of Object.entries(material)) if (texture?.isTexture) {
        if (!maps.has(texture)) maps.set(texture, { source: texture.source, image: texture.image, version: texture.version, sourceVersion: texture.source.version,
          settings: JSON.stringify(textureSettings(texture)), labels: [] });
        maps.get(texture).labels.push({ mesh: object.name, slot });
      }
    }
  });
  demand(originals.length === 3, '123 native audit needs all three original target meshes.');
  for (const [attribute, record] of arrays) record.hash = await fingerprint(attribute.array);
  for (const [texture, record] of maps) record.hash = await fingerprint(pixels(texture));
  const sourceSignature = { geometry: [...arrays.values()].map(record => ({ labels: record.labels, type: record.array.constructor.name, length: record.array.length,
    itemSize: record.itemSize, normalized: record.normalized, hash: record.hash })), textures: [...maps.entries()].map(([texture, record]) => ({ labels: record.labels,
      width: texture.image.width, height: texture.image.height, hash: record.hash, settings: record.settings })) };
  const face = originals.find(record => record.mesh.name === 'continuous-face'), uv = face.geometry.getAttribute('uv'), position = face.geometry.getAttribute('position');
  let noseIndex = 0, noseDistance = Infinity;
  for (let i = 0; i < uv.count; i++) {
    if (position.getZ(i) < .45) continue;
    const x = 2 * uv.getX(i) - 1, y = 2.85 * uv.getY(i) - 1.25, d = x * x + (y + .475) ** 2;
    if (d < noseDistance) { noseDistance = d; noseIndex = i; }
  }
  const noseWorld = face.mesh.localToWorld(new THREE.Vector3(position.getX(noseIndex), position.getY(noseIndex), position.getZ(noseIndex))).toArray();
  const report = { depth, checkpoints: [], nativeIndexWidenings: [], sourceSignature, noseWorld, sourceMeshes: objects.filter(record => record.object.isMesh).length,
    sourceAttributes: arrays.size, sourceMaterials: materials.size, sourceTextures: maps.size,
    integrityScope: 'All original scene attribute references/bytes, every material binding/physical scalar, every procedural image byte/source/version and all object transforms. Only target geometry references are replaced; their fully private protected attributes/index must retain exact values.' };
  let metrics, released = false, privateGeometries = [], disposed = [];

  async function unchanged(stage, nativeIndexUpload = false) {
    const violations = [];
    const check = (condition, message, detail = {}) => { if (!condition) violations.push({ message, ...detail }); };
    for (const record of objects) {
      const { object } = record, isTarget = names.has(record.name), detail = { mesh: record.name };
      check(object.name === record.name && object.visible === record.visible && object.material === record.material, 'Object identity, visibility or material changed.', detail);
      check(object.children.length === record.children.length && object.children.every((child, i) => child === record.children[i]), 'Scene hierarchy changed.', detail);
      check(JSON.stringify(object.position.toArray()) === JSON.stringify(record.position) && JSON.stringify(object.quaternion.toArray()) === JSON.stringify(record.quaternion)
        && JSON.stringify(object.scale.toArray()) === JSON.stringify(record.scale), 'Object transform changed.', detail);
      if (!isTarget || !depth || released) check(object.geometry === record.geometry, 'Protected/restored geometry reference changed.', detail);
      else check(privateGeometries.some(item => item.mesh === object && item.geometry === object.geometry), 'Active target lost its private geometry.', detail);
      if (!record.geometry) continue;
      for (const [key, attribute] of Object.entries(record.attributes)) check(record.geometry.getAttribute(key) === attribute, 'Original attribute reference changed.', { ...detail, attribute: key });
      check(record.geometry.index === record.index && JSON.stringify(record.geometry.groups) === record.groups, 'Original index reference/material groups changed.', detail);
      check(JSON.stringify([record.geometry.boundingBox, record.geometry.boundingSphere]) === record.geometryBounds, 'Original geometry bounds changed.', detail);
    }
    for (const [attribute, record] of arrays) {
      const inspection = await inspectAttribute123(attribute, record, { stage, nativeIndexUpload, fingerprint });
      if (!inspection.ok) violations.push({ message: 'Attribute data/reference/version integrity failed.', ...inspection.detail, reasons: inspection.violations });
      if (inspection.firstNativeWidening) report.nativeIndexWidenings.push(inspection.detail);
    }
    for (const [material, record] of materials) {
      check(JSON.stringify(scalarSettings(material)) === record.scalar, 'Accepted material scalar/color/vector changed.', { material: material.name });
      const active = Object.fromEntries(Object.entries(material).filter(([, value]) => value?.isTexture));
      check(Object.keys(active).length === Object.keys(record.maps).length && Object.entries(record.maps).every(([slot, texture]) => active[slot] === texture), 'Accepted material texture binding changed.', { material: material.name });
    }
    for (const [texture, record] of maps) {
      check(texture.source === record.source && texture.image === record.image && texture.version === record.version && texture.source.version === record.sourceVersion,
        'Source texture/image/version changed.', { labels: record.labels });
      check(JSON.stringify(textureSettings(texture)) === record.settings && await fingerprint(pixels(texture)) === record.hash, 'Source sampler or procedural image bytes changed.', { labels: record.labels });
    }
    report.checkpoints.push({ stage, ok: !violations.length, violations });
    demand(!violations.length, `123 source integrity failed at ${stage}: ${JSON.stringify(violations.slice(0, 3))}`);
    return { stage, ok: true };
  }

  window.noseDepthAudit123 = { report, checkpoint: unchanged, release: async () => {
    if (released) return report.cleanup;
    let beforeError, afterError;
    try { await unchanged('before-release', Boolean(window.portrait?.renderer?.backend?.isWebGPUBackend)); } catch (error) { beforeError = error; }
    const cleanup = releaseNoseDepth123(head); released = true;
    try { await unchanged('after-release-before-source-render', Boolean(window.portrait?.renderer?.backend?.isWebGPUBackend)); } catch (error) { afterError = error; }
    report.cleanup = { ...cleanup, sourceGeometryReferencesRestored: originals.every(record => record.mesh.geometry === record.geometry),
      sourceBytesUnchanged: !beforeError && !afterError, disposalEvents: disposed,
      nativeIndexByteDeltaAtRelease: report.nativeIndexWidenings.reduce((sum, item) => sum + item.after.bytes - item.before.bytes, 0),
      resources: 'Temporary geometry owns every attribute and index. The actual r186 cached RenderObject disposal therefore cannot delete an original source buffer.' };
    demand(disposed.length === (depth ? 3 : 0) && disposed.every(record => record.originalBindings === 0), '123 disposal retained a shared source attribute/index.');
    if (beforeError || afterError) throw beforeError || afterError;
    return report.cleanup;
  } };

  metrics = applyNoseDepth123(head, { depth });
  const sourceAttributes = new Set([...arrays.keys()]);
  privateGeometries = depth ? originals.map(record => ({ mesh: record.mesh, geometry: record.mesh.geometry })) : [];
  for (const { mesh, geometry } of privateGeometries) {
    demand(geometry !== originals.find(record => record.mesh === mesh).geometry, '123 target must use a private geometry.');
    for (const attribute of [...Object.values(geometry.attributes), geometry.index]) demand(!sourceAttributes.has(attribute) && ![...sourceAttributes].some(source => source.array.buffer === attribute.array.buffer), '123 private geometry shares a source buffer.');
    addAttributes(mesh, geometry, 'candidate');
    geometry.addEventListener('dispose', () => {
      const attributes = [...Object.values(geometry.attributes), geometry.index].filter(Boolean);
      disposed.push({ mesh: mesh.name, attributes: attributes.length, originalBindings: attributes.filter(attribute => sourceAttributes.has(attribute)).length });
    });
  }
  for (const [attribute, record] of arrays) if (!record.hash) record.hash = await fingerprint(attribute.array);
  report.metrics = metrics;
  report.geometry = auditNoseGeometry123(head, originals, depth);
  demand(report.geometry.localXYChangedValues === 0, 'The live123 target meshes must retain exact local X/Y bytes.');
  await unchanged('after123-before-renderer');
  return metrics;
}

const entry = "import {applyNoseDepth123,releaseNoseDepth123,NOSE_DEPTH123_SPEC} from '../review/nose-depth-candidate123.js';\n" +
  "import {auditNoseGeometry123} from '../review/nose-depth123-geometry-audit.js';\n" +
  "import {inspectHairAttribute111 as inspectAttribute123} from '../review/hair-strand-normal111-integrity.js';\n" + auditApplyNose123.toString() + '\n' +
  source.replace(skinMarker, skinMarker + "\n      state.noseDepth123=await auditApplyNose123(anatomicalHead,model,Number(new URLSearchParams(location.search).get('nose123')||0),THREE);")
    .replace(readyMarker, "await window.noseDepthAudit123.checkpoint('renderer-ready-before-first-frame');\n    " + readyMarker);
const bundle = path.join(qa, 'app-nose-depth123.js');
await build({ stdin: { contents: entry, resolveDir: path.join(root, 'src'), sourcefile: 'main-nose-depth123.js', loader: 'js' },
  bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, outfile: bundle, logLevel: 'silent' });
const sourceFiles = ['src/main.js', 'review/nose-depth-candidate123.js', 'review/nose-depth123-geometry-audit.js', 'review/nose-depth123-native.mjs', 'review/hair-strand-normal111-integrity.js'];
const hashes = Object.fromEntries(await Promise.all(sourceFiles.map(async file => { const content = await readFile(path.join(root, file)); return [file, { bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') }]; })));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
  args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
const report = { candidate: 123, scoreUnchanged: 76, status: 'Running', depths, views, resolution: [900, 1200], antialiasing: 2, files: hashes, results: [],
  limitations: ['Native technical checks do not establish a likeness gain. Root must review the matched renders.',
    'The single frontal reference cannot uniquely establish nose projection in profile.',
    'The small naris gap change is measured against actual endpoint triangles; coverage registration and original image bytes remain fixed.'] };
const persist = () => writeFile(path.join(qa, 'nose-depth123-native.json'), JSON.stringify(report, null, 2) + '\n');
try {
  for (const depth of depths) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 }), errors = [], result = { depth, browserErrors: errors };
    report.results.push(result); page.on('pageerror', error => errors.push(error.message)); let failure;
    try {
      await page.route('**/app.js', route => route.fulfill({ path: bundle, contentType: 'text/javascript' }));
      const url = new URL(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/'); url.searchParams.set('nose123', String(depth)); url.searchParams.set('backend', 'webgpu');
      await page.goto(url.href, { waitUntil: 'networkidle' });
      try { await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 90000 }); }
      catch (error) { throw new Error(`123 initialization: ${await page.locator('#gate-message').textContent()} / ${error.message}`); }
      Object.assign(result, await page.evaluate(() => {
        const p = window.portrait;
        if (!p.ready) throw new Error(`123 preparation failed: ${document.querySelector('#gate-message').textContent}`);
        if (!p.renderer.backend?.isWebGPUBackend) throw new Error('123 requires native WebGPU; no backend fallback is performed.');
        p.setScore(123, 76); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2);
        return { nativeWebGPU: true, metrics: p.state.noseDepth123, heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
      }));
      await page.evaluate(async () => { const p = window.portrait; p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); await window.noseDepthAudit123.checkpoint('first-native-webgpu-frame', true); });
      for (const view of views) {
        await page.evaluate(async view => {
          const p = window.portrait;
          if (view.startsWith('nose')) {
            p.setView('detail'); const target = window.noseDepthAudit123.report.noseWorld;
            p.controls.target.set(...target); const offset = view === 'nose-quarter' ? [6.0, 0, 11.53] : [0, 0, 13];
            p.camera.position.set(target[0] + offset[0], target[1], target[2] + offset[2]); p.camera.zoom = 2.6; p.camera.updateProjectionMatrix(); p.camera.lookAt(p.controls.target); p.controls.update();
          } else p.setView(view);
          p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        }, view);
        await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `nose123-${Math.round(depth * 1000)}-${view}.png`) });
      }
      await page.evaluate(() => window.noseDepthAudit123.checkpoint('after-all-native-views', true));
      const before = await page.evaluate(() => window.portrait.state.renderedFrames); await page.waitForTimeout(450);
      result.idleFrames = await page.evaluate(n => window.portrait.state.renderedFrames - n, before);
      if (result.idleFrames !== 0) throw new Error('123 unexpectedly added idle rendering.');
    } catch (error) { failure = error; result.failure = error.message; }
    finally {
      try {
        if (await page.evaluate(() => Boolean(window.noseDepthAudit123?.release))) {
          result.cleanup = await page.evaluate(() => window.noseDepthAudit123.release());
          if (!failure) {
            await page.evaluate(async () => { const p = window.portrait; p.setView('front'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); await window.noseDepthAudit123.checkpoint('restored-source-native-frame', true); });
            await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `nose123-${Math.round(depth * 1000)}-restored-front.png`) });
          }
        }
      } catch (error) { result.cleanupFailure = error.message; failure ||= error; }
      try { result.audit = await page.evaluate(() => window.noseDepthAudit123?.report || null); } catch (error) { result.reportFailure = error.message; failure ||= error; }
      finally { await page.close(); result.status = failure || errors.length ? 'Failed' : 'Passed'; await persist(); }
    }
    if (failure) throw failure; if (errors.length) throw new Error(`123 browser errors: ${JSON.stringify(errors)}`);
    const baseline = report.results[0];
    if (JSON.stringify(result.audit.sourceSignature) !== JSON.stringify(baseline.audit.sourceSignature)) throw new Error('123 fresh modes do not start with identical source geometry and source images.');
    if (JSON.stringify(result.audit.noseWorld) !== JSON.stringify(baseline.audit.noseWorld)) throw new Error('123 close-up framing drifted between source modes.');
    console.log(JSON.stringify({ candidate: 123, depth, status: result.status, scoreUnchanged: 76, privateBytes: result.metrics.privateAttributeBytes,
      changedVertices: result.audit.geometry.changedVertices, frameResidual: result.metrics.frame?.maximumResidual,
      minimumOrientationDot: result.audit.geometry.updatedTriangleOrientation.minimumDot, finiteDifferenceAngle: result.audit.geometry.geometricFiniteDifference.maximumAngleDegrees,
      maximumNarisGapChange: result.audit.geometry.narisAttachment.maximumGapChangeZ, checkpoints: result.audit.checkpoints.map(point => ({ stage: point.stage, ok: point.ok })),
      idleFrames: result.idleFrames, browserErrors: errors, cleanup: result.cleanup }));
  }
  report.status = 'Native geometry/source/cleanup checks passed; matched art review pending';
} catch (error) { report.status = 'Failed'; report.failure = error.message; throw error; }
finally { try { await browser.close(); } finally { await persist(); } }
