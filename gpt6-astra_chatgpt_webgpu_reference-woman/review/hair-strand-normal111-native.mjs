import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Native review on the Mac: baseline, private MASS normal field, then the same
// normal field plus weak fixed-U pigment. All views use the ordinary portrait
// render path. Never compile the scene separately at the default render target.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const source = await readFile(path.join(root, 'src/main.js'), 'utf8');
const marker = 'detailTarget.x=.02+state.pose.shiftX+state.balance.shiftX;';
const skinMarker = 'if(!skinIlluminationApplied){state.skinIllumination=compensateReferenceSkin(anatomicalHead,scene,{strength:.35});skinIlluminationApplied=true;}';
const readyMarker = 'state.backend=backend;state.ready=true;';
if ([marker, skinMarker, readyMarker].some(value => source.split(value).length !== 2) || source.includes('applyHairStrandNormal111')) throw new Error('Expected unique production balance, skin and renderer-ready markers, and no existing111 application.');
const modes = (process.env.STRAND111_MODES || '0,1,2').split(',').map(Number);
if (!modes.length || new Set(modes).size !== modes.length || modes.some(mode => ![0, 1, 2].includes(mode))) throw new Error('STRAND111_MODES must contain unique values from 0,1,2.');
const diagnosticOnly = process.env.STRAND111_DIAGNOSTIC_ONLY === '1';
const views = diagnosticOnly ? ['front'] : ['front', 'detail', 'left', 'right', 'back'];

async function auditApply111(hair, mode) {
  const demand = (condition, message) => { if (!condition) throw new Error(message); };
  const fingerprint = async array => {
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
    return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
  };
  const mass = hair.getObjectByName('Overlapping layered S-wave hair around front back and shoulders');
  demand(mass?.isMesh, 'Missing accepted MASS mesh.');
  const originalMaterial = mass.material, originalColor = mass.geometry.getAttribute('color');
  const objects = [], arrays = new Map(), maps = new Map();
  const materialSettings = material => Object.fromEntries(['normalScale', 'roughness', 'metalness', 'anisotropy', 'anisotropyRotation', 'specularIntensity', 'specularColor', 'envMapIntensity', 'alphaTest', 'alphaToCoverage', 'side', 'vertexColors', 'transparent', 'opacity', 'depthWrite', 'forceSinglePass', 'color'].map(key => [key, material[key]?.toArray ? material[key].toArray() : material[key]]));
  const textureSettings = texture => ({ channel: texture.channel, format: texture.format, type: texture.type, colorSpace: texture.colorSpace,
    wrapS: texture.wrapS, wrapT: texture.wrapT, minFilter: texture.minFilter, magFilter: texture.magFilter, anisotropy: texture.anisotropy,
    flipY: texture.flipY, generateMipmaps: texture.generateMipmaps, unpackAlignment: texture.unpackAlignment, rotation: texture.rotation,
    offset: texture.offset.toArray(), repeat: texture.repeat.toArray(), center: texture.center.toArray(), matrix: texture.matrix.toArray() });
  hair.traverse(object => {
    objects.push({ object, geometry: object.geometry, material: object.material, children: object.children.slice(), attributes: { ...object.geometry?.attributes }, index: object.geometry?.index });
    if (object.geometry) for (const [key, attribute] of [...Object.entries(object.geometry.attributes), ['index', object.geometry.index]]) if (attribute) {
      if (!arrays.has(attribute)) arrays.set(attribute, { array: attribute.array, version: attribute.version, itemSize: attribute.itemSize, count: attribute.count, normalized: attribute.normalized, usage: attribute.usage, isIndex: key === 'index', labels: [] });
      const record = arrays.get(attribute); record.isIndex &&= key === 'index';
      record.labels.push({ mesh: object.name, geometry: object.geometry.uuid, attribute: key });
    }
    for (const material of object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []) for (const value of Object.values(material)) if (value?.isTexture && !maps.has(value)) maps.set(value, { source: value.source, image: value.image, array: value.image?.data, version: value.version, sourceVersion: value.source.version, settings: textureSettings(value) });
  });
  for (const [attribute, record] of arrays) record.hash = await fingerprint(attribute.array);
  for (const [texture, record] of maps) if (record.array) record.hash = await fingerprint(record.array);
  const report = { mode, checkpoints: [], nativeIndexWidenings: [],
    attributeBaseline: [...arrays.values()].map(record => ({ labels: record.labels, type: record.array.constructor.name, length: record.array.length, bytes: record.array.byteLength, hash: record.hash, version: record.version, itemSize: record.itemSize, count: record.count })),
    nativeIndexPolicy: 'Only the installed r186 first-upload Uint16-to-Uint32 index conversion is permitted, after native WebGPU initialization. Every index value and retained original-array byte must remain exact; attribute objects, versions and all Float32 arrays remain strict.' };
  window.hairStrandAudit111 = { report };
  const settings = JSON.stringify(materialSettings(originalMaterial)), mapSettings = textureSettings(originalMaterial.map), normalSettings = textureSettings(originalMaterial.normalMap);
  const metrics = applyHairStrandNormal111(hair, { mode });
  const material = mass.material, activeColor = mass.geometry.getAttribute('color');
  demand(JSON.stringify(materialSettings(material)) === settings, '111 changed an accepted material setting.');
  demand(JSON.stringify(textureSettings(material.normalMap)) === JSON.stringify(normalSettings), '111 changed normal UV sampling.');
  demand(JSON.stringify(textureSettings(material.map)) === JSON.stringify(mapSettings), '111 changed color UV sampling.');
  demand(material.normalMap.image.width === 512 && material.normalMap.image.height === 1024, 'Unexpected111 normal dimensions.');
  if (mode === 0) demand(material === originalMaterial && activeColor === originalColor, 'Mode0 must be a true no-op.');
  else demand(material !== originalMaterial && material.normalMap !== originalMaterial.normalMap && material.normalMap.source !== originalMaterial.normalMap.source && material.normalMap.image.data !== originalMaterial.normalMap.image.data, '111 normal texture must be private to MASS.');
  if (mode < 2) demand(material.map === originalMaterial.map && activeColor === originalColor, 'Normal-only111 changed color.');
  else demand(material.map !== originalMaterial.map && material.map.source !== originalMaterial.map.source && activeColor !== originalColor && activeColor.array !== originalColor.array && activeColor.array.byteLength === originalColor.array.byteLength, 'Mode2 must replace only private RGB resources at the same dimensions.');
  const normal = material.normalMap.image.data;
  let unitError = 0, normalMinimumZ = 1, rootNonNeutral = 0, alphaMismatches = 0, vertexCompensationError = 0;
  for (let i = 0; i < normal.length; i += 4) {
    const x = normal[i] / 127.5 - 1, y = normal[i + 1] / 127.5 - 1, z = normal[i + 2] / 127.5 - 1;
    demand(Number.isFinite(x + y + z) && normal[i + 3] === 255, 'Normal field must be finite and opaque.');
    unitError = Math.max(unitError, Math.abs(Math.hypot(x, y, z) - 1)); normalMinimumZ = Math.min(normalMinimumZ, z);
    if (mode && i < 8 * 512 * 4 && (normal[i] !== 128 || normal[i + 1] !== 128 || normal[i + 2] !== 255)) rootNonNeutral++;
    if (material.map.image.data[i + 3] !== originalMaterial.map.image.data[i + 3]) alphaMismatches++;
  }
  for (let i = 0; i < activeColor.count; i++) for (let channel = 0; channel < activeColor.itemSize; channel++) {
    const at = i * activeColor.itemSize + channel, compensation = mode === 2 && channel < 3 ? .94 : 1;
    demand(Number.isFinite(activeColor.array[at]), 'Nonfinite vertex color.');
    vertexCompensationError = Math.max(vertexCompensationError, Math.abs(activeColor.array[at] * compensation - originalColor.array[at]));
    if (channel === 3) demand(activeColor.array[at] === originalColor.array[at], 'Vertex alpha changed.');
  }
  demand(unitError < .0068 && normalMinimumZ > .65 && rootNonNeutral === 0 && alphaMismatches === 0 && vertexCompensationError < 2e-8, '111 unit-normal, coverage or vertex-color check failed.');

  async function unchanged(stage, { restored = false, nativeIndexUpload = false } = {}) {
    const violations = [], attributeChanges = [];
    const check = (condition, message, detail) => { if (!condition) violations.push({ message, ...detail }); };
    for (const record of objects) {
      const detail = { mesh: record.object.name };
      check(record.object.geometry === record.geometry && record.object.geometry?.index === record.index, 'Geometry/index attribute object reference changed.', detail);
      check(record.object.children.length === record.children.length && record.object.children.every((child, i) => child === record.children[i]), 'Scene objects were added or replaced.', detail);
      if (record.object !== mass || restored) check(record.object.material === record.material, 'Another mesh material changed or MASS was not restored.', detail);
      for (const [key, attribute] of Object.entries(record.attributes)) if (record.object !== mass || key !== 'color' || mode !== 2 || restored) check(record.geometry.getAttribute(key) === attribute, 'Protected attribute object reference changed.', { ...detail, attribute: key });
    }
    if (nativeIndexUpload) demand(window.portrait?.renderer?.backend?.isWebGPUBackend, 'Only native WebGPU can explain an index upload conversion.');
    for (const [attribute, record] of arrays) {
      const result = await inspectHairAttribute111(attribute, record, { stage, nativeIndexUpload, fingerprint });
      if (result.changed) attributeChanges.push({ ...result.detail, violations: result.violations });
      if (result.firstNativeWidening) report.nativeIndexWidenings.push(result.detail);
      if (!result.ok) violations.push({ message: result.violations.join(' '), ...result.detail });
    }
    for (const [texture, record] of maps) {
      const detail = { texture: texture.name, beforeVersion: record.version, afterVersion: texture.version, beforeSourceVersion: record.sourceVersion, afterSourceVersion: texture.source.version };
      check(texture.source === record.source && texture.image === record.image && texture.image?.data === record.array && texture.version === record.version && texture.source.version === record.sourceVersion, 'Original texture/source reference or version changed.', detail);
      check(JSON.stringify(textureSettings(texture)) === JSON.stringify(record.settings), 'Original texture UV sampling changed.', detail);
      if (record.array) { const hash = await fingerprint(record.array); check(hash === record.hash, 'Original texture bytes changed.', { ...detail, beforeHash: record.hash, afterHash: hash }); }
    }
    const checkpoint = { stage, ok: !violations.length, renderedFrames: window.portrait?.state?.renderedFrames ?? 0,
      originalAttributesChecked: arrays.size, originalTexturesChecked: maps.size, attributeChanges, violations };
    report.checkpoints.push(checkpoint);
    if (violations.length) throw new Error(`111 integrity failure at ${stage}: ${JSON.stringify(violations)}`);
    return checkpoint;
  }
  await unchanged('immediately-after-candidate-apply');
  let disposedMaterials = 0, disposedTextures = 0;
  if (mode) {
    material.addEventListener('dispose', () => disposedMaterials++);
    material.normalMap.addEventListener('dispose', () => disposedTextures++);
    if (mode === 2) material.map.addEventListener('dispose', () => disposedTextures++);
  }
  Object.assign(report, { sourceHashesUnchanged: true, noExtraObjectsOrGeometry: true, otherMeshesUnchanged: true, unitError, normalMinimumZ, rootNonNeutral, alphaMismatches, vertexCompensationError,
    normalHash: await fingerprint(normal), meshes: objects.filter(record => record.object.isMesh).length,
    massVertices: mass.geometry.getAttribute('position').count, triangles: objects.reduce((sum, record) => sum + (record.geometry ? (record.geometry.index?.count ?? record.geometry.getAttribute('position').count) / 3 : 0), 0) });
  window.hairStrandAudit111 = { report, checkpoint: (stage, nativeIndexUpload = false) => unchanged(stage, { nativeIndexUpload }), release: async () => {
    let beforeError, afterError;
    try { await unchanged('before-candidate-release'); } catch (error) { beforeError = error; }
    const released = releaseHairStrandNormal111(hair);
    try { await unchanged('after-candidate-release', { restored: true }); } catch (error) { afterError = error; }
    demand(released === (mode !== 0) && disposedMaterials === (mode ? 1 : 0) && disposedTextures === mode, '111 failed resource cleanup.');
    report.cleanup = { materialAndColorReferencesRestored: mass.material === originalMaterial && mass.geometry.getAttribute('color') === originalColor, originalArrayHashesUnchanged: !beforeError && !afterError,
      exactIndexValues: !beforeError && !afterError, nativeIndexWidenings: report.nativeIndexWidenings.length,
      nativeIndexByteDelta: report.nativeIndexWidenings.reduce((sum, item) => sum + item.after.bytes - item.before.bytes, 0), disposedMaterials, disposedTextures };
    if (beforeError || afterError) throw beforeError || afterError;
    return report.cleanup;
  } };
  return metrics;
}

const entry = "import {applyHairStrandNormal111,releaseHairStrandNormal111} from '../review/hair-strand-normal-candidate111.js';\nimport {inspectHairAttribute111} from '../review/hair-strand-normal111-integrity.js';\n" + auditApply111.toString() + '\n' +
  source.replace(marker, marker + "\n      if(groomCandidate)state.strandNormal111=await auditApply111(anatomicalHair,Number(new URLSearchParams(location.search).get('strandnormal')||0));")
    .replace(skinMarker, skinMarker + "\n      if(groomCandidate)await window.hairStrandAudit111.checkpoint('post-skin-preparation');")
    .replace(readyMarker, "if(groomCandidate)await window.hairStrandAudit111.checkpoint('renderer-initialized-before-first-frame');\n    " + readyMarker);
const bundle = path.join(qa, 'app-hair-strand-normal111.js');
await build({ stdin: { contents: entry, resolveDir: path.join(root, 'src'), sourcefile: 'main-hair-strand-normal111.js', loader: 'js' }, bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, outfile: bundle, logLevel: 'silent' });
const chrome = process.env.CHROME_PATH || path.resolve(root, '../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
const results = [];
const report = { candidate: 111, scoreUnchanged: 76, result: 'Running', diagnosticOnly, modes, results, views, resolution: [900, 1200], antialiasing: 2,
  limitations: ['This comparison does not establish visual improvement or AAA quality.', 'Mode2 preserves the complete-row linear mean before finite RGBA8 quantization; visible partial circumferences may have different local means.',
    'Native Three r186 widens Uint16 index storage during first upload. The diagnostic reports that conversion separately and verifies all values exactly; no geometry buffers are changed by the diagnostic.'] };
const persist = () => writeFile(path.join(qa, 'hair-strand-normal111-native.json'), JSON.stringify(report, null, 2) + '\n');
try {
  for (const mode of modes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const result = { mode, browserErrors: errors }; results.push(result);
    let modeError;
    try {
      await page.route('**/app.js', route => route.fulfill({ path: bundle, contentType: 'text/javascript' }));
      const url = new URL(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/'); url.searchParams.set('strandnormal', String(mode));
      await page.goto(url.href, { waitUntil: 'networkidle' });
      try { await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 90000 }); }
      catch (error) { throw new Error(`111 mode${mode} initialization: ${await page.locator('#gate-message').textContent()} / ${error.message}`); }
      Object.assign(result, await page.evaluate(() => {
        const p = window.portrait;
        if (!p.ready) throw new Error(`111 initialization: ${document.querySelector('#gate-message').textContent}`);
        if (!p.renderer.backend?.isWebGPUBackend) throw new Error('111 requires native WebGPU.');
        p.setScore(111, 76); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2);
        return { nativeWebGPU: true, metrics: p.state.strandNormal111, heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
      }));
      await page.evaluate(async () => {
        const p = window.portrait; p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        await window.hairStrandAudit111.checkpoint('first-native-webgpu-frame', true);
      });
      if (!diagnosticOnly) for (const view of views) {
        await page.evaluate(async view => {
          const p = window.portrait; p.setView(view); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
          await window.hairStrandAudit111.checkpoint(`after-native-view-${view}`, true);
        }, view);
        await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `hair-strand-normal111-mode${mode}-${view}.png`) });
      }
      const frames = await page.evaluate(() => window.portrait.state.renderedFrames);
      await page.waitForTimeout(450);
      result.idleFrames = await page.evaluate(before => window.portrait.state.renderedFrames - before, frames);
      if (result.idleFrames !== 0) throw new Error('111 added unexpected idle rendering.');
    } catch (error) {
      modeError = error; result.failure = error.message;
    } finally {
      try {
        if (await page.evaluate(() => Boolean(window.hairStrandAudit111?.release))) {
          try { result.cleanup = await page.evaluate(() => window.hairStrandAudit111.release()); }
          catch (error) { result.cleanupFailure = error.message; modeError ||= error; }
        }
        result.audit = await page.evaluate(() => window.hairStrandAudit111?.report || null);
      } catch (error) { result.diagnosticFailure = error.message; modeError ||= error; }
      finally {
        await page.close();
        result.status = modeError || errors.length ? 'Failed' : 'Passed';
        await persist();
      }
    }
    if (modeError) throw modeError;
    if (errors.length) throw new Error(`111 mode${mode} browser errors: ${JSON.stringify(errors)}`);
    console.log(JSON.stringify({ candidate: 111, scoreUnchanged: 76, mode, status: result.status, normalHash: result.audit.normalHash,
      idleFrames: result.idleFrames, checkpoints: result.audit.checkpoints.map(point => ({ stage: point.stage, ok: point.ok })),
      nativeIndexWidenings: result.audit.nativeIndexWidenings.map(item => ({ mesh: item.labels.map(label => label.mesh), attribute: 'index', stage: item.stage,
        beforeType: item.before.type, afterType: item.after.type, valuesCompared: item.indexValuesCompared, valuesExact: item.indexValuesExact, versionBefore: item.before.version, versionAfter: item.after.version })), cleanup: result.cleanup }));
  }
  const normalOnly = results.find(result => result.mode === 1), withColor = results.find(result => result.mode === 2);
  if (normalOnly && withColor && normalOnly.audit.normalHash !== withColor.audit.normalHash) throw new Error('Normal-only and color companion modes must share an identical normal field.');
  const nativeConversions = result => JSON.stringify(result.audit.nativeIndexWidenings.map(item => ({ labels: item.labels.map(label => [label.mesh, label.attribute]), before: [item.before.type, item.before.length, item.before.hash], after: [item.after.type, item.after.length, item.after.hash] })));
  if (results.some(result => nativeConversions(result) !== nativeConversions(results[0]))) throw new Error('Native index storage conversions differ between candidate modes.');
  report.result = diagnosticOnly ? 'Targeted native integrity diagnostic passed; visual review not run' : 'Technical checks passed; native art review pending';
} catch (error) {
  report.result = 'Failed'; report.failure = error.message; throw error;
} finally {
  try { await browser.close(); } finally { await persist(); }
}
