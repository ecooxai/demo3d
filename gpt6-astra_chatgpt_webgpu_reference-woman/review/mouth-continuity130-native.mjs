import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Root-only native geometry comparison, bundling the LIVE production main.
// The accepted130 tube is already hidden. Source atlas/materials remain exact.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const source = await readFile(path.join(root, 'src/main.js'), 'utf8');
const marker = 'if(!skinIlluminationApplied){state.skinIllumination=compensateReferenceSkin(anatomicalHead,scene,{strength:.35});skinIlluminationApplied=true;}';
if (source.split(marker).length !== 2 || source.includes('applyMouthContinuity130') || !source.includes('scenePreparationPromise??=')
  || !source.includes('mouthCrease130.visible=false;state.mouthCrease130={hidden:true}')) throw new Error('130 expects the live cached preparation with accepted tube hidden and no existing border repair.');
const strengths = (process.env.MOUTH130_STRENGTHS || '0,.5,1').split(',').map(Number);
if (!strengths.length || new Set(strengths).size !== strengths.length || strengths.some(value => ![0, .5, 1].includes(value))) throw new Error('MOUTH130_STRENGTHS must select unique strengths from0,.5,1.');
const views = ['front', 'detail', 'left', 'right', 'back', 'nose', 'nose-quarter'];

async function prepareMouthAudit130(head, model, strength) {
  const demand = (condition, message) => { if (!condition) throw new Error(message); };
  const fingerprint = async array => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(array.buffer, array.byteOffset, array.byteLength))), value => value.toString(16).padStart(2, '0')).join('');
  const targets = new Set(['upper-lip', 'lower-lip']), audited = new Set([...targets, 'continuous-face']);
  const objects = [], originals = [], arrays = new Map(), materials = new Map(), textures = new Map(), privateRecords = [], disposed = [];
  const settings = material => Object.fromEntries(Object.entries(material).filter(([key, value]) => !['id', 'uuid', 'name'].includes(key)
    && (value === null || ['number', 'boolean', 'string'].includes(typeof value) || value?.isColor || value?.isVector2 || value?.isVector3 || value?.isVector4))
    .map(([key, value]) => [key, value?.toArray ? value.toArray() : value]));
  const mapSettings = texture => ({ channel: texture.channel, format: texture.format, type: texture.type, colorSpace: texture.colorSpace,
    wrapS: texture.wrapS, wrapT: texture.wrapT, minFilter: texture.minFilter, magFilter: texture.magFilter, anisotropy: texture.anisotropy,
    flipY: texture.flipY, generateMipmaps: texture.generateMipmaps, premultiplyAlpha: texture.premultiplyAlpha, unpackAlignment: texture.unpackAlignment,
    rotation: texture.rotation, offset: texture.offset.toArray(), repeat: texture.repeat.toArray(), center: texture.center.toArray(),
    matrixAutoUpdate: texture.matrixAutoUpdate, manualMatrix: texture.matrixAutoUpdate ? null : texture.matrix.toArray() });
  const pixels = texture => texture.image?.data?.buffer ? texture.image.data
    : texture.image?.getContext ? texture.image.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, texture.image.width, texture.image.height).data
      : (() => { throw new Error('130 cannot hash this source texture image.'); })();
  function recordAttributes(mesh, geometry, scope) {
    for (const [key, attribute] of [...Object.entries(geometry.attributes), ['index', geometry.index]]) if (attribute) {
      const prior = arrays.get(attribute);
      if (prior) { prior.labels.push({ mesh: mesh.name, attribute: key, scope }); continue; }
      arrays.set(attribute, { array: attribute.array, version: attribute.version, itemSize: attribute.itemSize, count: attribute.count, normalized: attribute.normalized,
        usage: attribute.usage, isIndex: key === 'index', labels: [{ mesh: mesh.name, attribute: key, scope }] });
    }
  }
  let creaseCount = 0;
  model.traverse(object => {
    if (!object.isMesh) return;
    objects.push({ object, geometry: object.geometry, material: object.material, attributes: { ...object.geometry.attributes }, index: object.geometry.index,
      visible: object.visible, position: object.position.toArray(), quaternion: object.quaternion.toArray(), scale: object.scale.toArray() });
    if (object.name === 'closed-mouth-crease') { creaseCount++; demand(object.visible === false, '130 geometry comparison must start with the accepted tube hidden.'); }
    if (!audited.has(object.name)) return;
    originals.push({ mesh: object, geometry: object.geometry, bounds: JSON.stringify([object.geometry.boundingBox, object.geometry.boundingSphere]) });
    recordAttributes(object, object.geometry, 'source');
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!materials.has(material)) materials.set(material, { settings: JSON.stringify(settings(material)), maps: Object.fromEntries(Object.entries(material).filter(([, value]) => value?.isTexture)) });
      for (const [slot, texture] of Object.entries(material)) if (texture?.isTexture && !textures.has(texture)) textures.set(texture,
        { source: texture.source, image: texture.image, version: texture.version, sourceVersion: texture.source.version,
          settings: JSON.stringify(mapSettings(texture)), label: `${object.name}.${slot}` });
    }
  });
  demand(creaseCount === 1 && originals.length === 3 && [...audited].every(name => originals.filter(record => record.mesh.name === name).length === 1), '130 needs one accepted hidden crease, one face and both lip grids.');
  for (const [attribute, record] of arrays) record.hash = await fingerprint(attribute.array);
  for (const [texture, record] of textures) record.hash = await fingerprint(pixels(texture));
  const sourceSignature = { arrays: [...arrays.values()].map(record => ({ labels: record.labels, hash: record.hash, length: record.array.length })),
    textures: [...textures.values()].map(record => ({ label: record.label, hash: record.hash, settings: record.settings })) };
  const face = originals.find(record => record.mesh.name === 'continuous-face').mesh, uv = face.geometry.getAttribute('uv'), position = face.geometry.getAttribute('position');
  let noseIndex = -1, noseDistance = Infinity;
  for (let i = 0; i < uv.count; i++) {
    if (position.getZ(i) < .45) continue;
    const x = 2 * uv.getX(i) - 1, y = 2.85 * uv.getY(i) - 1.25, d = x * x + (y + .475) ** 2;
    if (d < noseDistance) { noseDistance = d; noseIndex = i; }
  }
  demand(noseIndex >= 0, '130 cannot recover the original123 close-up anchor.');
  // Use an existing Three vector constructor from the live head; no second copy.
  const noseWorld = face.localToWorld(head.position.clone().set(position.getX(noseIndex), position.getY(noseIndex), position.getZ(noseIndex))).toArray();
  const report = { strength, scoreUnchanged: 77, sourceSignature, noseWorld, checkpoints: [], nativeIndexWidenings: [], geometry: null,
    scope: 'Exact original face/lip buffers, materials and shared atlas bytes; every other scene mesh retains its geometry/attribute/material references and visibility. Private index widening is allowed only after exact value comparison.' };
  let released = false;
  const sourceAttributes = new Set(arrays.keys()), sourceBuffers = new Set([...arrays.keys()].map(attribute => attribute.array.buffer));

  function inspectGeometry() {
    let positionChanges = 0, normalChanges = 0, localXYChanges = 0, exactCoreNormals = 0, exactProtectedValues = 0, minimumTriangleNormalDot = 1, projectedOrientationFlips = 0;
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], sub = (a, b) => a.map((v, i) => v - b[i]);
    for (const record of originals) {
      if (!targets.has(record.mesh.name)) continue;
      const original = record.geometry, active = record.mesh.geometry, p = active.getAttribute('position'), n = active.getAttribute('normal'), op = original.getAttribute('position'), on = original.getAttribute('normal');
      demand(p.count === op.count && active.index.count === original.index.count, '130 changed lip topology/counts.');
      for (const [name, attribute] of [...Object.entries(active.attributes), ['index', active.index]]) if (!['position', 'normal'].includes(name)) {
        const before = name === 'index' ? original.index : original.getAttribute(name);
        demand(attribute.array.length === before.array.length, '130 changed protected attribute length.');
        for (let i = 0; i < attribute.array.length; i++) demand(attribute.array[i] === before.array[i], `130 changed protected ${name} values.`);
        exactProtectedValues += attribute.array.length;
      }
      for (let i = 0; i < p.count; i++) {
        const row = Math.floor(i / 101), col = i % 101, x = -.241 + .482 * col / 100, fixed = row / 16 >= .35 || Math.abs(x) >= .235;
        const a = [p.getX(i), p.getY(i), p.getZ(i)], b = [op.getX(i), op.getY(i), op.getZ(i)], nn = [n.getX(i), n.getY(i), n.getZ(i)], oldN = [on.getX(i), on.getY(i), on.getZ(i)];
        demand([...a, ...nn].every(Number.isFinite), '130 produced nonfinite geometry.');
        if (a[0] !== b[0] || a[1] !== b[1]) localXYChanges++;
        const moved = a.some((value, axis) => value !== b[axis]), changedN = nn.some((value, axis) => value !== oldN[axis]);
        if (moved) positionChanges++; if (changedN) { normalChanges++; demand(Math.abs(Math.hypot(...nn) - 1) < 1e-6, '130 normals are not unit length.'); }
        if (fixed || row === 0) demand(!moved, '130 changed protected core/corner/border positions.');
        if (fixed) { demand(!changedN, '130 changed core/corner authored normals.'); exactCoreNormals++; }
      }
      for (let k = 0; k < active.index.count; k += 3) {
        const ids = [active.index.getX(k), active.index.getX(k + 1), active.index.getX(k + 2)], a = ids.map(i => [op.getX(i), op.getY(i), op.getZ(i)]), b = ids.map(i => [p.getX(i), p.getY(i), p.getZ(i)]);
        const na = cross(sub(a[1], a[0]), sub(a[2], a[0])), nb = cross(sub(b[1], b[0]), sub(b[2], b[0])), la = Math.hypot(...na), lb = Math.hypot(...nb);
        if (la < 1e-13) continue; demand(lb > 1e-13, '130 created a degenerate lip triangle.');
        minimumTriangleNormalDot = Math.min(minimumTriangleNormalDot, na.reduce((sum, value, axis) => sum + value * nb[axis], 0) / (la * lb));
        if (Math.abs(na[2]) > 1e-12 && na[2] * nb[2] <= 0) projectedOrientationFlips++;
      }
      for (const bounds of [active.boundingBox?.min, active.boundingBox?.max, active.boundingSphere?.center]) if (bounds) demand(bounds.toArray().every(Number.isFinite), '130 bounds are not finite.');
    }
    demand(localXYChanges === 0 && projectedOrientationFlips === 0 && minimumTriangleNormalDot > 0, '130 changed the live lip XY projection/orientation.');
    return { positionChanges, normalChanges, localXYChanges, exactCoreNormals, exactProtectedValues, minimumTriangleNormalDot, projectedOrientationFlips };
  }
  async function checkpoint(stage, allowUpload = true) {
    for (const record of objects) {
      const { object } = record, privateRecord = privateRecords.find(item => item.mesh === object);
      demand(object.geometry === (!released && privateRecord ? privateRecord.geometry : record.geometry), `130 geometry reference drift: ${object.name}.`);
      demand(object.material === record.material && object.visible === record.visible, `130 material/visibility drift: ${object.name}.`);
      demand(JSON.stringify([object.position.toArray(), object.quaternion.toArray(), object.scale.toArray()]) === JSON.stringify([record.position, record.quaternion, record.scale]), '130 changed an object transform.');
      for (const [name, attribute] of Object.entries(record.attributes)) demand(record.geometry.getAttribute(name) === attribute, '130 replaced an original attribute binding.');
      demand(record.geometry.index === record.index, '130 replaced an original index binding.');
    }
    for (const [attribute, record] of arrays) {
      const check = await inspectAttribute130(attribute, record, { stage, nativeIndexUpload: allowUpload, fingerprint });
      if (!check.ok) { report.integrityFailure = { ...check.detail, violations: check.violations }; throw new Error('130 source/private buffer integrity failed; see exact attribute diagnostics.'); }
      if (check.firstNativeWidening) report.nativeIndexWidenings.push(check.detail);
    }
    for (const record of originals) demand(JSON.stringify([record.geometry.boundingBox, record.geometry.boundingSphere]) === record.bounds, '130 changed original source bounds.');
    for (const [material, record] of materials) {
      demand(JSON.stringify(settings(material)) === record.settings, '130 changed the accepted material response.');
      const current = Object.fromEntries(Object.entries(material).filter(([, value]) => value?.isTexture));
      demand(Object.keys(current).length === Object.keys(record.maps).length && Object.entries(record.maps).every(([key, value]) => current[key] === value), '130 changed a source texture binding.');
    }
    for (const [texture, record] of textures) demand(texture.source === record.source && texture.image === record.image && texture.version === record.version
      && texture.source.version === record.sourceVersion && JSON.stringify(mapSettings(texture)) === record.settings && await fingerprint(pixels(texture)) === record.hash, '130 changed a source atlas/map or sampler.');
    report.checkpoints.push({ stage, exactBuffers: arrays.size, exactSourceImages: textures.size, exactMaterials: materials.size, ok: true });
  }
  window.mouthAudit130 = { report, checkpoint, async release() {
    let beforeError; try { await checkpoint('before-release'); } catch (error) { beforeError = error; }
    const cleanup = releaseMouthContinuity130(head); released = true;
    report.cleanup = { ...cleanup, sourceReferencesRestored: originals.every(record => record.mesh.geometry === record.geometry),
      disposed: disposed.map(record => ({ mesh: record.mesh, attributes: record.attributes, originalBufferBindings: record.originalBufferBindings })) };
    demand(report.cleanup.sourceReferencesRestored && disposed.length === privateRecords.length && disposed.every(record => record.originalBufferBindings === 0), '130 failed private-only resource cleanup.');
    await checkpoint('after-release'); if (beforeError) throw beforeError; return report.cleanup;
  } };
  const metrics = applyMouthContinuity130(head, { strength }); report.metrics = metrics;
  if (strength) for (const record of originals.filter(item => targets.has(item.mesh.name))) {
    const geometry = record.mesh.geometry; demand(geometry !== record.geometry, '130 did not create private lip geometry.');
    for (const attribute of [...Object.values(geometry.attributes), geometry.index]) demand(!sourceAttributes.has(attribute) && !sourceBuffers.has(attribute.array.buffer), '130 temporary geometry shares an original buffer.');
    privateRecords.push({ mesh: record.mesh, geometry }); recordAttributes(record.mesh, geometry, 'private');
    geometry.addEventListener('dispose', () => {
      const attributes = [...Object.values(geometry.attributes), geometry.index];
      disposed.push({ mesh: record.mesh.name, attributes: attributes.length, originalBufferBindings: attributes.filter(attribute => sourceAttributes.has(attribute) || sourceBuffers.has(attribute.array.buffer)).length });
    });
  }
  for (const [attribute, record] of arrays) if (!record.hash) record.hash = await fingerprint(attribute.array);
  report.geometry = inspectGeometry(); await checkpoint('prepared-before-renderer', false); return metrics;
}

const entry = "import {applyMouthContinuity130,releaseMouthContinuity130} from '../review/mouth-continuity-candidate130.js';\n" +
  "import {inspectHairAttribute111 as inspectAttribute130} from '../review/hair-strand-normal111-integrity.js';\n" + prepareMouthAudit130.toString() + '\n' +
  source.replace(marker, marker + "\n      state.mouthContinuity130=await prepareMouthAudit130(anatomicalHead,model,Number(new URLSearchParams(location.search).get('mouth130')||0));");
const bundle = path.join(qa, 'app-mouth-continuity130.js');
await build({ stdin: { contents: entry, resolveDir: path.join(root, 'src'), sourcefile: 'main-mouth-continuity130.js', loader: 'js' },
  bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, outfile: bundle, logLevel: 'silent' });
const files = ['src/main.js', 'review/mouth-continuity-candidate130.js', 'review/mouth-continuity130-native.mjs', 'review/hair-strand-normal111-integrity.js'];
const hashes = Object.fromEntries(await Promise.all(files.map(async file => { const bytes = await readFile(path.join(root, file)); return [file, { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }]; })));
const report = { candidate: 130, status: 'Running', scoreUnchanged: 77, sourceTubeHidden: true, strengths, views, resolution: [900, 1200], antialiasing: 2, files: hashes, results: [] };
const persist = () => writeFile(path.join(qa, 'mouth-continuity130-native.json'), JSON.stringify(report, null, 2) + '\n');
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
  for (const strength of strengths) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 }), errors = [], result = { strength, browserErrors: errors };
    report.results.push(result); let failure;
    page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message }));
    page.on('console', message => { if (message.type() === 'error') errors.push({ type: 'console', message: message.text().slice(0, 1800) }); });
    try {
      await page.route('**/app.js', route => route.fulfill({ path: bundle, contentType: 'text/javascript' }));
      const url = new URL(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/'); url.searchParams.set('backend', 'webgpu'); url.searchParams.set('mouth130', String(strength));
      await page.goto(url.href, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 90000 });
      result.setup = await page.evaluate(async () => {
        const p = window.portrait;
        if (!p.ready) throw new Error(`130 preparation failed: ${document.querySelector('#gate-message').textContent}`);
        if (!p.renderer.backend?.isWebGPUBackend) throw new Error('130 requires native WebGPU; no fallback is performed.');
        p.setScore(130, 77); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2);
        p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); await window.mouthAudit130.checkpoint('first-native-frame');
        return { nativeWebGPU: true, mapping: p.renderer.toneMapping, exposure: p.renderer.toneMappingExposure,
          heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
      });
      for (const view of views) {
        await page.evaluate(async view => {
          const p = window.portrait;
          if (view.startsWith('nose')) {
            p.setView('detail'); const target = window.mouthAudit130.report.noseWorld, offset = view === 'nose-quarter' ? [6.0, 0, 11.53] : [0, 0, 13];
            p.controls.target.set(...target); p.camera.position.set(target[0] + offset[0], target[1], target[2] + offset[2]); p.camera.zoom = 2.6;
            p.camera.updateProjectionMatrix(); p.camera.lookAt(p.controls.target); p.controls.update();
          } else p.setView(view);
          p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
          if (p.renderer.domElement.width !== 900 || p.renderer.domElement.height !== 1200 || p.state.internalRender.width !== 1800 || p.state.internalRender.height !== 2400) throw new Error('130 render dimensions changed.');
        }, view);
        await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `mouth130-border-${Math.round(strength * 100)}-${view}.png`) });
      }
      await page.evaluate(() => window.mouthAudit130.checkpoint('after-native-views'));
      const before = await page.evaluate(() => window.portrait.state.renderedFrames); await page.waitForTimeout(450);
      result.idleFrames = await page.evaluate(value => window.portrait.state.renderedFrames - value, before);
      if (result.idleFrames !== 0) throw new Error('130 unexpectedly added idle rendering.');
    } catch (error) { failure = error; result.failure = error.message; }
    finally {
      try {
        if (await page.evaluate(() => Boolean(window.mouthAudit130?.release))) {
          result.cleanup = await page.evaluate(() => window.mouthAudit130.release());
          if (!failure) {
            await page.evaluate(async () => { const p = window.portrait; p.setView('front'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone(); await window.mouthAudit130.checkpoint('restored-source-native-frame'); });
            await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `mouth130-border-${Math.round(strength * 100)}-restored-front.png`) });
          }
        }
      } catch (error) { result.cleanupFailure = error.message; failure ||= error; }
      try { result.audit = await page.evaluate(() => window.mouthAudit130?.report || null); } catch (error) { result.reportFailure = error.message; failure ||= error; }
      finally { await page.close(); result.status = failure || errors.length ? 'Failed' : 'Passed'; await persist(); }
    }
    if (failure) throw failure; if (errors.length) throw new Error(`130 browser errors: ${JSON.stringify(errors)}`);
    const baseline = report.results[0];
    if (JSON.stringify(result.audit.sourceSignature) !== JSON.stringify(baseline.audit.sourceSignature) || JSON.stringify(result.audit.noseWorld) !== JSON.stringify(baseline.audit.noseWorld)) throw new Error('130 source preparation or matched close-up framing differs between fresh modes.');
    console.log(JSON.stringify({ candidate: 130, strength, status: result.status, metrics: result.audit.metrics, geometry: result.audit.geometry,
      idleFrames: result.idleFrames, cleanup: result.cleanup, browserErrors: errors }));
  }
  report.status = 'Native geometry/source/cleanup checks passed; visual border review pending';
} catch (error) { report.status = 'Failed'; report.failure = error.message; throw error; }
finally { try { await browser?.close(); } finally { await persist(); } }
