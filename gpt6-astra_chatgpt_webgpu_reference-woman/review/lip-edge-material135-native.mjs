import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Root-only native A/B. Bundle the LIVE app with accepted full130 geometry.
// This does not export, change lighting/eyes, or compile a separate screen path.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const source = await readFile(path.join(root, 'src/main.js'), 'utf8');
const marker = 'state.mouthContinuity130=applyMouthContinuity130(anatomicalHead,{strength:1});';
const illumination = 'if(!skinIlluminationApplied){state.skinIllumination=compensateReferenceSkin(anatomicalHead,scene,{strength:.35});skinIlluminationApplied=true;}';
if (source.split(marker).length !== 2 || source.split(illumination).length !== 2 || source.indexOf(marker) < source.indexOf(illumination)
  || !source.includes('scenePreparationPromise??=') || !source.includes('mouthCrease130.visible=false;state.mouthCrease130={hidden:true}')
  || source.includes('applyLipEdgeMaterial135')) throw new Error('135 expects live cached preparation, hidden tube and one accepted full130 call after illumination, without135 already applied.');
const modes = (process.env.LIP135_MODES || '0,1').split(',').map(Number);
if (!modes.length || new Set(modes).size !== modes.length || modes.some(value => ![0, 1].includes(value))) throw new Error('LIP135_MODES must select unique modes from0,1.');
const views = ['front', 'detail', 'left', 'right', 'back', 'nose', 'nose-quarter'];

async function prepareLipEdgeAudit135(head, model, geometry130, strength) {
  const demand = (condition, message) => { if (!condition) throw new Error(message); };
  const fingerprint = async array => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(array.buffer, array.byteOffset, array.byteLength))), value => value.toString(16).padStart(2, '0')).join('');
  const targets = new Set(['upper-lip', 'lower-lip']), objects = [], originals = [], arrays = new Map(), materials = new Map(), textures = new Map();
  const allSourceAttributes = new Set(), allSourceBuffers = new Set(), privateRecords = [], activeMaterials = new Map(), sourceDisposeListeners = [];
  const disposal = { geometries: [], materials: 0, maps: 0, originalResources: [] };
  const settings = material => Object.fromEntries(Object.entries(material).filter(([key, value]) => !['id', 'uuid', 'name'].includes(key)
    && (value === null || ['number', 'boolean', 'string'].includes(typeof value) || value?.isColor || value?.isVector2 || value?.isVector3 || value?.isVector4))
    .map(([key, value]) => [key, value?.toArray ? value.toArray() : value]));
  const bindings = material => Object.fromEntries(Object.entries(material).filter(([, value]) => value?.isTexture));
  const mapSettings = texture => ({ channel: texture.channel, format: texture.format, type: texture.type, colorSpace: texture.colorSpace,
    wrapS: texture.wrapS, wrapT: texture.wrapT, minFilter: texture.minFilter, magFilter: texture.magFilter, anisotropy: texture.anisotropy,
    flipY: texture.flipY, generateMipmaps: texture.generateMipmaps, premultiplyAlpha: texture.premultiplyAlpha, unpackAlignment: texture.unpackAlignment,
    rotation: texture.rotation, offset: texture.offset.toArray(), repeat: texture.repeat.toArray(), center: texture.center.toArray(),
    matrixAutoUpdate: texture.matrixAutoUpdate, manualMatrix: texture.matrixAutoUpdate ? null : texture.matrix.toArray() });
  const pixels = texture => texture.image?.data?.buffer ? texture.image.data
    : texture.image?.getContext ? texture.image.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, texture.image.width, texture.image.height).data
      : (() => { throw new Error('135 cannot inspect this existing source image.'); })();
  function recordAttributes(mesh, geometry, scope) {
    for (const [key, attribute] of [...Object.entries(geometry.attributes), ['index', geometry.index]]) if (attribute) arrays.set(attribute,
      { array: attribute.array, version: attribute.version, itemSize: attribute.itemSize, count: attribute.count, normalized: attribute.normalized,
        usage: attribute.usage, isIndex: key === 'index', labels: [{ mesh: mesh.name, attribute: key, scope }] });
  }
  function watchOriginal(resource, label) {
    const callback = () => disposal.originalResources.push(label); resource.addEventListener('dispose', callback); sourceDisposeListeners.push([resource, callback]);
  }
  let creaseCount = 0, face;
  model.traverse(object => {
    if (!object.isMesh) return;
    objects.push({ object, geometry: object.geometry, material: object.material, visible: object.visible,
      attributes: { ...object.geometry.attributes }, index: object.geometry.index,
      transform: JSON.stringify([object.position.toArray(), object.quaternion.toArray(), object.scale.toArray()]) });
    for (const attribute of [...Object.values(object.geometry.attributes), object.geometry.index]) if (attribute) { allSourceAttributes.add(attribute); allSourceBuffers.add(attribute.array.buffer); }
    if (object.name === 'closed-mouth-crease') { creaseCount++; demand(object.visible === false, '135 needs the accepted tube hidden.'); }
    if (object.name === 'continuous-face') { demand(!face, '135 expected one face.'); face = object; }
    if (!targets.has(object.name) && object.name !== 'continuous-face') return;
    if (targets.has(object.name)) {
      originals.push({ mesh: object, geometry: object.geometry, material: object.material,
        bounds: JSON.stringify([object.geometry.boundingBox, object.geometry.boundingSphere]), groups: JSON.stringify(object.geometry.groups), drawRange: JSON.stringify(object.geometry.drawRange) });
      recordAttributes(object, object.geometry, 'source'); watchOriginal(object.geometry, `${object.name}.geometry`);
    }
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!materials.has(material)) {
        materials.set(material, { settings: JSON.stringify(settings(material)), maps: bindings(material), metadata: JSON.stringify(material.userData) });
        watchOriginal(material, `${object.name}.material`);
      }
      for (const [slot, texture] of Object.entries(material)) if (texture?.isTexture && !textures.has(texture)) {
        textures.set(texture, { source: texture.source, image: texture.image, version: texture.version, sourceVersion: texture.source.version,
          settings: JSON.stringify(mapSettings(texture)), metadata: JSON.stringify(texture.userData), label: `${object.name}.${slot}` });
        watchOriginal(texture, `${object.name}.${slot}`);
      }
    }
  });
  demand(creaseCount === 1 && face && originals.length === 2 && [...targets].every(name => originals.filter(record => record.mesh.name === name).length === 1), '135 requires the accepted face, hidden crease and two lip grids.');
  demand(geometry130.applied && geometry130.strength === 1 && geometry130.version === 'outer-lip-continuity-130', '135 baseline is not accepted full130.');
  for (const [attribute, record] of arrays) record.hash = await fingerprint(attribute.array);
  for (const [texture, record] of textures) record.hash = await fingerprint(pixels(texture));
  const sourceSignature = { attributes: [...arrays.values()].map(record => ({ labels: record.labels, hash: record.hash, length: record.array.length })),
    materials: [...materials.values()].map(record => ({ settings: record.settings, metadata: record.metadata })),
    images: [...textures.values()].map(record => ({ label: record.label, hash: record.hash, settings: record.settings })) };
  const uv = face.geometry.getAttribute('uv'), position = face.geometry.getAttribute('position');
  let noseIndex = -1, noseDistance = Infinity;
  for (let i = 0; i < uv.count; i++) {
    if (position.getZ(i) < .45) continue;
    const x = 2 * uv.getX(i) - 1, y = 2.85 * uv.getY(i) - 1.25, distance = x * x + (y + .475) ** 2;
    if (distance < noseDistance) { noseDistance = distance; noseIndex = i; }
  }
  demand(noseIndex >= 0, '135 could not recover the original123/130 nose anchor.');
  const noseWorld = face.localToWorld(head.position.clone().set(position.getX(noseIndex), position.getY(noseIndex), position.getZ(noseIndex))).toArray();
  const report = { strength, scoreUnchanged: 77, geometry130: { version: geometry130.version, strength: geometry130.strength, applied: geometry130.applied },
    sourceSignature, noseWorld, checkpoints: [], nativeIndexWidenings: [], disposal,
    scope: 'Exact accepted lip attribute bytes, source material values/maps/images, all scene mesh geometry/material/attribute references and transforms. No export or broad geometry regression study.' };
  let released = false, packed, packedRecord;

  async function checkpoint(stage, allowUpload = true) {
    for (const record of objects) {
      const active = privateRecords.find(value => value.mesh === record.object), expected = !released && active;
      demand(record.object.geometry === (expected ? active.geometry : record.geometry), `135 geometry reference changed on ${record.object.name}.`);
      demand(record.object.material === (expected ? active.material : record.material), `135 material reference changed on ${record.object.name}.`);
      demand(record.object.visible === record.visible && JSON.stringify([record.object.position.toArray(), record.object.quaternion.toArray(), record.object.scale.toArray()]) === record.transform, `135 changed visibility/transform on ${record.object.name}.`);
      demand(record.geometry.index === record.index && Object.keys(record.geometry.attributes).length === Object.keys(record.attributes).length
        && Object.entries(record.attributes).every(([key, attribute]) => record.geometry.getAttribute(key) === attribute), `135 modified original geometry bindings on ${record.object.name}.`);
    }
    for (const [attribute, record] of arrays) {
      const check = await inspectAttribute135(attribute, record, { stage, nativeIndexUpload: allowUpload, fingerprint });
      if (!check.ok) { report.integrityFailure = { ...check.detail, violations: check.violations }; throw new Error('135 lip source/private attribute integrity failed; see exact diagnostics.'); }
      if (check.firstNativeWidening) report.nativeIndexWidenings.push(check.detail);
    }
    for (const record of originals) demand(JSON.stringify([record.geometry.boundingBox, record.geometry.boundingSphere]) === record.bounds
      && JSON.stringify(record.geometry.groups) === record.groups && JSON.stringify(record.geometry.drawRange) === record.drawRange, '135 changed original bounds, groups or draw range.');
    for (const [material, record] of [...materials, ...activeMaterials]) {
      demand(JSON.stringify(settings(material)) === record.settings && JSON.stringify(material.userData) === record.metadata, '135 material values or metadata changed after preparation.');
      const current = bindings(material); demand(Object.keys(current).length === Object.keys(record.maps).length && Object.entries(record.maps).every(([key, texture]) => current[key] === texture), '135 changed a checked texture binding.');
    }
    for (const [texture, record] of textures) demand(texture.source === record.source && texture.image === record.image && texture.version === record.version
      && texture.source.version === record.sourceVersion && JSON.stringify(mapSettings(texture)) === record.settings && JSON.stringify(texture.userData) === record.metadata
      && await fingerprint(pixels(texture)) === record.hash, `135 modified source image/sampler ${record.label}.`);
    if (packed) demand(packed.source === packedRecord.source && packed.image === packedRecord.image && packed.version === packedRecord.version
      && packed.source.version === packedRecord.sourceVersion && JSON.stringify(mapSettings(packed)) === packedRecord.settings
      && await fingerprint(packed.image.data) === packedRecord.hash, '135 changed its prepared packed response field.');
    demand(disposal.originalResources.length === 0, '135 disposed an original resource.');
    report.checkpoints.push({ stage, exactLipAttributes: arrays.size, exactSourceImages: textures.size, exactSourceMaterials: materials.size, ok: true });
  }
  window.lipEdgeAudit135 = { report, checkpoint, async release() {
    if (released) return report.cleanup;
    let beforeError; try { await checkpoint('before-release'); } catch (error) { beforeError = error; }
    const cleanup = releaseLipEdgeMaterial135(head); released = true;
    report.cleanup = { ...cleanup, sourceReferencesRestored: originals.every(record => record.mesh.geometry === record.geometry && record.mesh.material === record.material),
      originalResourcesDisposed: disposal.originalResources.length, privateGeometryDisposals: disposal.geometries.length,
      privateMaterialDisposals: disposal.materials, privateMapDisposals: disposal.maps };
    demand(report.cleanup.sourceReferencesRestored && disposal.geometries.length === privateRecords.length
      && disposal.materials === privateRecords.length && disposal.maps === (packed ? 1 : 0)
      && disposal.geometries.every(record => record.originalBufferBindings === 0), '135 failed fully private cleanup or source restoration.');
    await checkpoint('after-release'); if (beforeError) throw beforeError; return report.cleanup;
  }, unwatch() { for (const [resource, callback] of sourceDisposeListeners) resource.removeEventListener('dispose', callback); } };

  const metrics = applyLipEdgeMaterial135(head, { strength, geometry130 }); report.metrics = metrics;
  let exactCopiedBytes = 0, exactUV1Values = 0;
  if (strength) for (const original of originals) {
    const { mesh } = original, geometry = mesh.geometry, material = mesh.material;
    demand(geometry !== original.geometry && material !== original.material, '135 needs private geometry and material clones.');
    demand(JSON.stringify([geometry.boundingBox, geometry.boundingSphere]) === original.bounds && JSON.stringify(geometry.groups) === original.groups
      && JSON.stringify(geometry.drawRange) === original.drawRange, '135 changed geometric bounds, draw range or groups.');
    demand(Object.keys(geometry.attributes).length === Object.keys(original.geometry.attributes).length + 1 && !original.geometry.getAttribute('uv1'), '135 changed more than the dedicated UV1 binding.');
    for (const [key, attribute] of [...Object.entries(original.geometry.attributes), ['index', original.geometry.index]]) {
      const active = key === 'index' ? geometry.index : geometry.getAttribute(key);
      demand(active.itemSize === attribute.itemSize && active.count === attribute.count && active.normalized === attribute.normalized
        && active.array.constructor === attribute.array.constructor && await fingerprint(active.array) === await fingerprint(attribute.array), `135 changed original ${key} values.`);
      exactCopiedBytes += active.array.byteLength;
    }
    for (const attribute of [...Object.values(geometry.attributes), geometry.index]) demand(!allSourceAttributes.has(attribute) && !allSourceBuffers.has(attribute.array.buffer), '135 temporary geometry shares an original buffer.');
    const uv1 = geometry.getAttribute('uv1'); demand(uv1.itemSize === 2 && uv1.count === 1717, '135 UV1 layout is incorrect.');
    for (let row = 0; row <= 16; row++) for (let col = 0; col <= 100; col++) {
      const i = row * 101 + col, value = lipEdgeUV135(col / 100, row / 16);
      demand(uv1.getX(i) === Math.fround(value[0]) && uv1.getY(i) === Math.fround(value[1]), '135 UV1 is not the intended texel-centered coordinate field.'); exactUV1Values += 2;
    }
    const originalSettings = settings(original.material), activeSettings = settings(material);
    for (const key of Object.keys(originalSettings)) if (!['roughness', 'roughnessMap', 'clearcoatMap', 'version'].includes(key)) demand(JSON.stringify(activeSettings[key]) === JSON.stringify(originalSettings[key]), `135 changed unrelated material field ${key}.`);
    demand(material.roughness === .53 && material.clearcoat === .12 && material.roughnessMap === material.clearcoatMap, '135 physical scalar factors/packing changed.');
    for (const [slot, texture] of Object.entries(original.material)) if (texture?.isTexture) demand(material[slot] === texture, `135 changed source texture ${slot}.`);
    if (packed) demand(packed === material.roughnessMap, '135 should share one packed map across both lips.'); else packed = material.roughnessMap;
    activeMaterials.set(material, { settings: JSON.stringify(settings(material)), maps: bindings(material), metadata: JSON.stringify(material.userData) });
    privateRecords.push({ mesh, geometry, material }); recordAttributes(mesh, geometry, 'private');
    geometry.addEventListener('dispose', () => disposal.geometries.push({ mesh: mesh.name,
      originalBufferBindings: [...Object.values(geometry.attributes), geometry.index].filter(attribute => allSourceAttributes.has(attribute) || allSourceBuffers.has(attribute.array.buffer)).length }));
    material.addEventListener('dispose', () => { disposal.materials++; });
  }
  if (packed) {
    demand(packed.isDataTexture && packed.channel === 1 && packed.colorSpace === THREE.NoColorSpace && packed.format === THREE.RGBAFormat && packed.type === THREE.UnsignedByteType
      && packed.minFilter === THREE.LinearFilter && packed.magFilter === THREE.LinearFilter && packed.wrapS === THREE.ClampToEdgeWrapping && packed.wrapT === THREE.ClampToEdgeWrapping
      && packed.flipY === false && packed.generateMipmaps === false && packed.premultiplyAlpha === false
      && packed.image.width === 128 && packed.image.height === 128 && packed.image.data.byteLength === 65536, '135 packed map format, orientation, filtering or size differs.');
    const baked = makeLipEdgePixels135(); demand(await fingerprint(baked.data) === await fingerprint(packed.image.data), '135 native packed bytes differ from the pure field.');
    packedRecord = { source: packed.source, image: packed.image, version: packed.version, sourceVersion: packed.source.version,
      settings: JSON.stringify(mapSettings(packed)), hash: await fingerprint(packed.image.data) };
    packed.addEventListener('dispose', () => { disposal.maps++; });
    report.packedMap = { hash: packedRecord.hash, properties: mapSettings(packed), bytes: packed.image.data.byteLength, metadata: packed.userData };
  }
  for (const [attribute, record] of arrays) if (!record.hash) record.hash = await fingerprint(attribute.array);
  report.geometry = { exactCopiedSourceBytes: exactCopiedBytes, exactUV1Values, extraGroups: 0, sourcePositionNormalUV0ColorIndexChanged: false };
  await checkpoint('prepared-before-renderer', false); return metrics;
}

const entry = "import {applyLipEdgeMaterial135,releaseLipEdgeMaterial135,lipEdgeUV135,makeLipEdgePixels135} from '../review/lip-edge-material-candidate135.js';\n"
  + "import {inspectHairAttribute111 as inspectAttribute135} from '../review/hair-strand-normal111-integrity.js';\n" + prepareLipEdgeAudit135.toString() + '\n'
  + source.replace(marker, marker + "\n      state.lipEdgeMaterial135=await prepareLipEdgeAudit135(anatomicalHead,model,state.mouthContinuity130,Number(new URLSearchParams(location.search).get('lip135')||0));");
const bundle = path.join(qa, 'app-lip-edge-material135.js');
await build({ stdin: { contents: entry, resolveDir: path.join(root, 'src'), sourcefile: 'main-lip-edge-material135.js', loader: 'js' },
  bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, outfile: bundle, logLevel: 'silent' });
const files = ['src/main.js', 'src/lip-continuity.js', 'review/lip-edge-material-candidate135.js', 'review/lip-edge-material135-native.mjs', 'review/hair-strand-normal111-integrity.js'];
const hashes = Object.fromEntries(await Promise.all(files.map(async file => { const bytes = await readFile(path.join(root, file)); return [file, { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }]; })));
const report = { candidate: 135, status: 'Running', scoreUnchanged: 77, acceptedGeometry130: 1, modes, views, resolution: [900, 1200], antialiasing: 2, files: hashes, results: [] };
const persist = () => writeFile(path.join(qa, 'lip-edge-material135-native.json'), JSON.stringify(report, null, 2) + '\n');
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
  for (const strength of modes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 }), errors = [], result = { strength, browserErrors: errors };
    report.results.push(result); let failure;
    page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message }));
    page.on('console', message => { if (message.type() === 'error') errors.push({ type: 'console', message: message.text().slice(0, 1800) }); });
    try {
      await page.route('**/app.js', route => route.fulfill({ path: bundle, contentType: 'text/javascript' }));
      const url = new URL(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/'); url.searchParams.set('backend', 'webgpu'); url.searchParams.set('lip135', String(strength));
      await page.goto(url.href, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 90000 });
      result.setup = await page.evaluate(async () => {
        const p = window.portrait;
        if (!p.ready) throw new Error(`135 preparation failed: ${document.querySelector('#gate-message').textContent}`);
        if (!p.renderer.backend?.isWebGPUBackend) throw new Error('135 requires native WebGPU; no fallback is performed.');
        p.setScore(135, 77); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2);
        p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); await window.lipEdgeAudit135.checkpoint('first-native-frame');
        return { nativeWebGPU: true, mapping: p.renderer.toneMapping, exposure: p.renderer.toneMappingExposure,
          heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
      });
      for (const view of views) {
        await page.evaluate(async view => {
          const p = window.portrait;
          if (view.startsWith('nose')) {
            p.setView('detail'); const target = window.lipEdgeAudit135.report.noseWorld, offset = view === 'nose-quarter' ? [6, 0, 11.53] : [0, 0, 13];
            p.controls.target.set(...target); p.camera.position.set(target[0] + offset[0], target[1], target[2] + offset[2]); p.camera.zoom = 2.6;
            p.camera.updateProjectionMatrix(); p.camera.lookAt(p.controls.target); p.controls.update();
          } else p.setView(view);
          p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
          if (p.renderer.domElement.width !== 900 || p.renderer.domElement.height !== 1200 || p.state.internalRender.width !== 1800 || p.state.internalRender.height !== 2400) throw new Error('135 render dimensions changed.');
        }, view);
        await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `lip135-${strength}-${view}.png`) });
      }
      await page.evaluate(() => window.lipEdgeAudit135.checkpoint('after-native-views'));
      const before = await page.evaluate(() => window.portrait.state.renderedFrames); await page.waitForTimeout(450);
      result.idleFrames = await page.evaluate(value => window.portrait.state.renderedFrames - value, before);
      if (result.idleFrames !== 0) throw new Error('135 unexpectedly added idle rendering.');
    } catch (error) { failure = error; result.failure = error.message; }
    finally {
      try {
        if (await page.evaluate(() => Boolean(window.lipEdgeAudit135?.release))) {
          result.cleanup = await page.evaluate(() => window.lipEdgeAudit135.release());
          if (!failure) {
            await page.evaluate(async () => { const p = window.portrait; p.setView('front'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); await window.lipEdgeAudit135.checkpoint('restored-source-native-frame'); });
            await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `lip135-${strength}-restored-front.png`) });
          }
        }
      } catch (error) { result.cleanupFailure = error.message; failure ||= error; }
      try { result.audit = await page.evaluate(() => { const audit = window.lipEdgeAudit135; audit?.unwatch(); return audit?.report || null; }); }
      catch (error) { result.reportFailure = error.message; failure ||= error; }
      finally { await page.close(); result.status = failure || errors.length ? 'Failed' : 'Passed'; await persist(); }
    }
    if (failure) throw failure; if (errors.length) throw new Error(`135 browser errors: ${JSON.stringify(errors)}`);
    const baseline = report.results[0];
    if (JSON.stringify(result.audit.sourceSignature) !== JSON.stringify(baseline.audit.sourceSignature) || JSON.stringify(result.audit.noseWorld) !== JSON.stringify(baseline.audit.noseWorld)) throw new Error('135 accepted source preparation or matched close-up framing differs between fresh modes.');
    console.log(JSON.stringify({ candidate: 135, strength, status: result.status, metrics: result.audit.metrics, geometry: result.audit.geometry,
      idleFrames: result.idleFrames, cleanup: result.cleanup, browserErrors: errors }));
  }
  report.status = 'Native A/B, unchanged source values and private cleanup passed; visual material review pending';
} catch (error) { report.status = 'Failed'; report.failure = error.message; throw error; }
finally { try { await browser?.close(); } finally { await persist(); } }
