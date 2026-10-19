import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// One explicit WebGL page against the built production app. The accepted128
// display transform is shared by both backends; this checks its ordinary AA2
// linear-target resolve and direct AA1 output without another lifecycle suite.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const url = new URL(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/');
url.searchParams.set('backend', 'webgl');
const errors = [], report = { check: 'display128-explicit-webgl', status: 'Running', requestedBackend: 'webgl',
  expectedDisplay: { mapping: 7, name: 'NeutralToneMapping', exposure: 1.4 }, resolution: [900, 1200], captures: [], errors };
const persist = () => writeFile(path.join(qa, 'display128-webgl-check.json'), JSON.stringify(report, null, 2) + '\n');
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--use-angle=metal', '--disable-background-networking'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', message => { if (message.type() === 'error') errors.push({ type: 'console', message: message.text().slice(0, 1800) }); });
  await page.goto(url.href, { waitUntil: 'networkidle' });
  try { await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 90000 }); }
  catch (error) { throw new Error(`128 WebGL initialization: ${await page.locator('#gate-message').textContent()} / ${error.message}`); }
  await page.evaluate(() => {
    const p = window.portrait;
    if (!p.ready) throw new Error(`Explicit WebGL did not initialize: ${document.querySelector('#gate-message').textContent}`);
    p.startTurntable(false); p.setResolution(900, 1200);
  });

  for (const { antialiasing, view } of [{ antialiasing: 2, view: 'front' }, { antialiasing: 2, view: 'detail' }, { antialiasing: 1, view: 'front' }]) {
    const metrics = await page.evaluate(({ antialiasing, view }) => {
      const p = window.portrait;
      p.setAntialiasing(antialiasing); p.setView(view); p.renderNow();
      const gl=p.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
      return { requestedAA: antialiasing, view, backend: p.state.backend, isWebGLRenderer: p.renderer.isWebGLRenderer === true,
        gpu: {vendor:gl.getParameter(debug?debug.UNMASKED_VENDOR_WEBGL:gl.VENDOR),renderer:gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER)},
        mapping: p.renderer.toneMapping, exposure: p.renderer.toneMappingExposure,
        canvas: [p.renderer.domElement.width, p.renderer.domElement.height], stateSize: [p.state.width, p.state.height],
        internalSize: [p.state.internalRender.width, p.state.internalRender.height], targetRestored: p.renderer.getRenderTarget() === null,
        renderedFrames: p.state.renderedFrames, cpuSubmissionMs: p.state.renderMs,
        heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
    }, { antialiasing, view });
    assert.equal(metrics.backend, 'webgl'); assert.equal(metrics.isWebGLRenderer, true, 'The explicitly requested renderer must be WebGL.');
    assert.equal(metrics.mapping, 7, 'Installed r186 NeutralToneMapping must remain selected.');
    assert.equal(metrics.exposure, 1.4, 'Accepted128 exposure must remain1.4 in both AA paths.');
    assert.deepEqual(metrics.canvas, [900, 1200]); assert.deepEqual(metrics.stateSize, [900, 1200]);
    assert.deepEqual(metrics.internalSize, antialiasing === 2 ? [1800, 2400] : [900, 1200]);
    assert.equal(metrics.targetRestored, true, 'The ordinary resolve must restore the output render target.');
    const file = `display128-webgl-aa${antialiasing}-${view}.png`;
    await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, file) });
    report.captures.push({ file, ...metrics });
  }
  assert.deepEqual(errors, [], 'Explicit WebGL must complete without browser/shader errors.');
  report.status = 'Passed; three matched display captures ready for visual review';
  console.log(JSON.stringify(report));
} catch (error) { report.status = 'Failed'; report.failure = error.message; throw error; }
finally { try { await browser?.close(); } finally { await persist(); } }
