import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Root-only visibility attribution against the built live app. No source
// injection, geometry/material edits, screen-target compile or backend fallback.
// Mode 0 is the original source; mode 1 hides only closed-mouth-crease.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const url = new URL(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/');
url.searchParams.set('backend', 'webgpu');
const errors = [], report = { candidate: 130, check: 'mouth-crease-visibility-attribution', scoreUnchanged: 77,
  status: 'Running', resolution: [900, 1200], antialiasing: 2, views: ['front', 'detail', 'nose', 'nose-quarter'], captures: [], browserErrors: errors };
const persist = () => writeFile(path.join(qa, 'mouth130-visibility-native.json'), JSON.stringify(report, null, 2) + '\n');
let browser, page, failure;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
  page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', message => { if (message.type() === 'error') errors.push({ type: 'console', message: message.text().slice(0, 1800) }); });
  await page.goto(url.href, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 90000 });
  report.source = await page.evaluate(() => {
    const p = window.portrait;
    if (!p.ready) throw new Error(`130 initialization failed: ${document.querySelector('#gate-message').textContent}`);
    if (!p.renderer.backend?.isWebGPUBackend) throw new Error('130 requires native WebGPU; no automatic fallback is allowed.');
    const tubes = [], faces = [];
    p.model.traverse(object => { if (object.name === 'closed-mouth-crease') tubes.push(object); if (object.name === 'continuous-face') faces.push(object); });
    if (tubes.length !== 1 || !tubes[0].isMesh || faces.length !== 1 || !faces[0].isMesh) throw new Error('130 expects exactly one named crease mesh and one continuous face.');
    if (tubes[0].visible !== true) throw new Error('130 baseline crease is already hidden; an original visibility comparison is unavailable.');
    const face = faces[0], uv = face.geometry.getAttribute('uv'), position = face.geometry.getAttribute('position');
    let index = -1, distance = Infinity;
    // Exactly the original123 UV anchor and head-space position criterion.
    for (let i = 0; i < uv.count; i++) {
      if (position.getZ(i) < .45) continue;
      const x = 2 * uv.getX(i) - 1, y = 2.85 * uv.getY(i) - 1.25, d = x * x + (y + .475) ** 2;
      if (d < distance) { distance = d; index = i; }
    }
    if (index < 0) throw new Error('130 could not recover the original123 close-up anchor.');
    const target = p.camera.position.clone().set(position.getX(index), position.getY(index), position.getZ(index));
    face.localToWorld(target);
    window.mouthVisibility130 = { tube: tubes[0], originalVisible: tubes[0].visible, noseWorld: target.toArray() };
    p.setScore(130, 77); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2);
    return { namedCreaseCount: tubes.length, namedFaceCount: faces.length, originalVisible: tubes[0].visible, noseWorld: target.toArray(),
      backend: p.state.backend, nativeWebGPU: true, mapping: p.renderer.toneMapping, exposure: p.renderer.toneMappingExposure };
  });

  for (const mode of [0, 1]) for (const view of report.views) {
    const capture = await page.evaluate(async ({ mode, view }) => {
      const p = window.portrait, saved = window.mouthVisibility130;
      let count = 0;
      p.model.traverse(object => { if (object.name === 'closed-mouth-crease') { count++; if (object !== saved.tube) throw new Error('130 crease identity changed.'); } });
      if (count !== 1) throw new Error('130 named crease count changed.');
      saved.tube.visible = mode === 0 ? saved.originalVisible : false;
      if (view.startsWith('nose')) {
        p.setView('detail'); const target = saved.noseWorld, offset = view === 'nose-quarter' ? [6.0, 0, 11.53] : [0, 0, 13];
        p.controls.target.set(...target); p.camera.position.set(target[0] + offset[0], target[1], target[2] + offset[2]);
        p.camera.zoom = 2.6; p.camera.updateProjectionMatrix(); p.camera.lookAt(p.controls.target); p.controls.update();
      } else p.setView(view);
      p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
      return { mode, view, creaseVisible: saved.tube.visible, camera: p.camera.position.toArray(), target: p.controls.target.toArray(), zoom: p.camera.zoom,
        canvas: [p.renderer.domElement.width, p.renderer.domElement.height], internalSize: [p.state.internalRender.width, p.state.internalRender.height] };
    }, { mode, view });
    assert.equal(capture.creaseVisible, mode === 0); assert.deepEqual(capture.canvas, [900, 1200]); assert.deepEqual(capture.internalSize, [1800, 2400]);
    if (mode === 1) {
      const baseline = report.captures.find(item => item.mode === 0 && item.view === view);
      assert.deepEqual(capture.camera, baseline.camera); assert.deepEqual(capture.target, baseline.target); assert.equal(capture.zoom, baseline.zoom);
    }
    const file = `mouth130-tube-${mode}-${view}.png`;
    await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, file) });
    report.captures.push({ file, ...capture });
  }
} catch (error) { failure = error; report.failure = error.message; }
finally {
  if (page && !page.isClosed()) try {
    report.restoration = await page.evaluate(async () => {
      const saved = window.mouthVisibility130;
      if (!saved) return { initialized: false };
      saved.tube.visible = saved.originalVisible;
      const p = window.portrait; let count = 0;
      p.model.traverse(object => { if (object.name === 'closed-mouth-crease') { count++; if (object !== saved.tube) throw new Error('130 restoration crease identity changed.'); } });
      if (count !== 1 || saved.tube.visible !== saved.originalVisible) throw new Error('130 failed to restore original crease visibility.');
      p.setView('front'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
      return { initialized: true, namedCreaseCount: count, visibilityRestored: true, visible: saved.tube.visible };
    });
    if (!failure) assert.equal(report.restoration?.visibilityRestored, true);
  } catch (error) { report.restorationFailure = error.message; failure ||= error; }
  try { await browser?.close(); } catch (error) { report.browserCloseFailure = error.message; failure ||= error; }
  if (errors.length && !failure) failure = new Error(`130 browser errors: ${JSON.stringify(errors)}`);
  report.status = failure ? 'Failed' : 'Visibility and framing checks passed; visual attribution pending';
  if (failure) report.failure ||= failure.message;
  await persist();
}
if (failure) throw failure;
console.log(JSON.stringify({ candidate: 130, status: report.status, namedCreaseCount: report.source.namedCreaseCount,
  noseWorld: report.source.noseWorld, captures: report.captures.map(item => item.file), restoration: report.restoration, browserErrors: errors }));
