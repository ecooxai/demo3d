import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const digest = b => createHash('sha256').update(b).digest('hex');
const expectedMain = '2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a';
if (digest(await readFile(path.join(root, 'src/main.js'))) !== expectedMain) throw new Error('141 integration wrapper needs its frozen main.');
const report = { iteration: 141, score: 77, status: 'Running', expectedMain, cases: [], errors: [],
  scope: 'Accepted140 upper-lip relief and141 outward crown material; cached preparation across explicit native WebGPU, WebGL and native WebGPU.' };
const save = () => writeFile(path.join(qa, 'integrated141-native.json'), JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
let page;
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => report.errors.push({ type: 'pageerror', message: e.message }));
  page.on('console', m => { if (m.type() === 'error') report.errors.push({ type: 'console', message: m.text().slice(0, 1600) }); });
  await page.goto('http://127.0.0.1:8766/?backend=webgpu', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 60000 });
  report.setup = await page.evaluate(async () => {
    const p = window.portrait, demand = (v, msg) => { if (!v) throw new Error(msg); };
    demand(p.ready && p.renderer.backend?.isWebGPUBackend, 'Native WebGPU unavailable; no fallback is allowed.');
    demand(p.state.iteration === 141 && p.state.score === 77, 'Unexpected accepted state.');
    demand(p.state.width === 900 && p.state.height === 1200 && p.state.antialiasing === 2, 'Unexpected output settings.');
    demand(p.renderer.toneMapping === 7 && p.renderer.toneMappingExposure === 1.4, 'Accepted display changed.');
    demand(p.state.mouthContinuity130?.strength === 1 && p.state.upperLipRelief140?.applied && p.state.upperLipRelief140?.strength === 1, 'Accepted lip preparation missing.');
    const upper = p.model.getObjectByName('upper-lip'), crown = p.model.getObjectByName('Continuous parted crown with longitudinal fiber flow'),
      mass = p.model.getObjectByName('Overlapping layered S-wave hair around front back and shoulders');
    demand(upper?.isMesh && crown?.isMesh && mass?.isMesh && crown.material !== mass.material, 'Crown material ownership changed.');
    demand(crown.material.side === 0 && crown.material.shadowSide === 2 && mass.material.side === 2, 'Accepted crown-facing isolation changed.');
    demand(p.model.getObjectByName('closed-mouth-crease').visible === false, 'Independent mouth tube was restored.');
    demand(document.querySelector('#page-title').textContent.includes('GPT-6 Astra'), 'Creator title missing.');
    p.setView('front'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
    const fingerprint = async a => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
      new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength))), b => b.toString(16).padStart(2, '0')).join('');
    const attrs = [], objects = [];
    for (const mesh of [upper, crown]) {
      objects.push({ mesh, geometry: mesh.geometry, material: mesh.material, maps: Object.fromEntries(Object.entries(mesh.material).filter(([, v]) => v?.isTexture)) });
      for (const [name, a] of [...Object.entries(mesh.geometry.attributes), ['index', mesh.geometry.index]]) if (a)
        attrs.push({ mesh, name, a, array: a.array, hash: await fingerprint(a) });
    }
    const metrics = { mouth130: p.state.mouthContinuity130, upper140: p.state.upperLipRelief140, crown100: p.state.referenceCrown, crown141: p.state.crownFacing141 };
    window.integrated141 = { objects, attrs, fingerprint, metrics, massMaterial: mass.material };
    return { nativeWebGPU: true, outputResolution: [p.state.width, p.state.height], internalRender: p.state.internalRender,
      iteration: p.state.iteration, score: p.state.score, title: document.querySelector('#page-title').textContent,
      upperLip140: p.state.upperLipRelief140, crownFacing141: p.state.crownFacing141, protectedAttributes: attrs.length,
      upperBoundAttributeBytes: [...Object.values(upper.geometry.attributes), upper.geometry.index].reduce((n, a) => n + a.array.byteLength, 0),
      hairTriangles: p.model.getObjectByName('Original reference-directed chestnut layered groom')?.userData.triangles,
      heapMiB: performance.memory?.usedJSHeapSize / 1048576 };
  });
  for (const [pass, backend, views] of [['webgpu', 'webgpu', ['front', 'detail']], ['explicit-webgl', 'webgl', ['front', 'detail']], ['webgpu-return', 'webgpu', ['front']]]) {
    if (pass !== 'webgpu') {
      await page.evaluate(async backend => {
        const p = window.portrait; await p.initialize(backend);
        if (!p.ready || (backend === 'webgpu' ? !p.renderer.backend?.isWebGPUBackend : !p.renderer.isWebGLRenderer))
          throw new Error('Explicit backend change failed: ' + backend);
      }, backend);
    }
    const result = { pass, explicitlyRequestedBackend: backend, captures: [] };
    for (const view of views) {
      const state = await page.evaluate(async view => {
        const p = window.portrait; p.setView(view); p.renderNow();
        if (p.renderer.backend?.isWebGPUBackend) await p.renderer.backend.device.queue.onSubmittedWorkDone();
        else if (p.renderer.getContext().getError() !== p.renderer.getContext().NO_ERROR) throw new Error('WebGL render error.');
        return { view, backend: p.state.backend, nativeWebGPU: !!p.renderer.backend?.isWebGPUBackend,
          explicitWebGL: !!p.renderer.isWebGLRenderer, cpuSubmissionMs: p.state.renderMs,
          internalRender: p.state.internalRender, camera: { position: p.camera.position.toArray(), target: p.controls.target.toArray(),
            frustum: [p.camera.left, p.camera.right, p.camera.top, p.camera.bottom], zoom: p.camera.zoom } };
      }, view);
      const file = 'integrated141-' + pass + '-' + view + '.png';
      const b = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, file), animations: 'disabled' });
      result.captures.push({ ...state, file: 'output/qa/' + file, bytes: b.length, sha256: digest(b) });
      if (pass === 'webgpu' && view === 'front') await page.screenshot({ path: path.join(qa, 'integrated141-webgpu-page.png'), fullPage: true, animations: 'disabled' });
    }
    result.integrity = await page.evaluate(async () => {
      const p = window.portrait, s = window.integrated141;
      const current = { mouth130: p.state.mouthContinuity130, upper140: p.state.upperLipRelief140, crown100: p.state.referenceCrown, crown141: p.state.crownFacing141 };
      for (const [key, value] of Object.entries(s.metrics)) if (current[key] !== value) throw new Error('Cached preparation repeated: ' + key);
      for (const o of s.objects) {
        if (o.mesh.geometry !== o.geometry || o.mesh.material !== o.material) throw new Error('Accepted resource was replaced across backend change.');
        for (const [key, value] of Object.entries(o.maps)) if (o.material[key] !== value) throw new Error('Accepted source texture binding changed.');
      }
      for (const r of s.attrs) {
        const a = r.name === 'index' ? r.mesh.geometry.index : r.mesh.geometry.getAttribute(r.name);
        if (a !== r.a || a.array !== r.array || await s.fingerprint(a) !== r.hash) throw new Error('Accepted attribute changed: ' + r.mesh.name + '.' + r.name);
      }
      const crown = s.objects[1].mesh;
      if (crown.material.side !== 0 || crown.material.shadowSide !== 2 || crown.material === s.massMaterial || s.massMaterial.side !== 2) throw new Error('Crown isolation changed.');
      return { exactCachedMetrics: Object.keys(s.metrics).length, exactAttributeBuffers: s.attrs.length,
        exactGeometryMaterialAndMapBindings: true, crownSide: crown.material.side, crownShadowSide: crown.material.shadowSide,
        massSide: s.massMaterial.side, heapMiB: performance.memory?.usedJSHeapSize / 1048576 };
    });
    const before = await page.evaluate(() => window.portrait.state.renderedFrames); await page.waitForTimeout(450);
    result.idleFrames = await page.evaluate(before => window.portrait.state.renderedFrames - before, before);
    if (result.idleFrames) throw new Error('Unexpected idle rendering.');
    report.cases.push(result); await save(); console.log(JSON.stringify({ pass, integrity: result.integrity, idleFrames: result.idleFrames }));
  }
  if (report.errors.length) throw new Error('Browser errors recorded.');
  report.status = 'Passed'; await save();
} catch (error) { report.status = 'Failed'; report.failure = String(error?.stack || error); await save(); throw error; }
finally { if (page) await page.close(); await browser.close(); }
