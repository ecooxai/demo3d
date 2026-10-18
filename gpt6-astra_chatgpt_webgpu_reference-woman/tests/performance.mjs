import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Run on the Mac: node tests/performance.mjs [--4k]
// Optional overrides: PORTRAIT_URL, CHROME_PATH, PORTRAIT_BENCH_4K=1.
// Timings include JS submission + waiting for prior GPU queue work to finish.
// They are not GPU timestamp-query measurements or compositor/presentation FPS.
const root = resolve(import.meta.dirname, '..');
const base = process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/';
const chrome = process.env.CHROME_PATH || resolve(root, '../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const standalone = resolve(root, 'output/gpt6-astra_chatgpt_webgpu_reference-woman.html');
const include4K = process.argv.includes('--4k') || process.env.PORTRAIT_BENCH_4K === '1';
const execFileAsync = promisify(execFile);
const rounded = (n, digits = 2) => Number.isFinite(n) ? +n.toFixed(digits) : null;
const mib = n => rounded(n / 1048576);
const result = { status: 'running' };
let browser;

async function chromeMemory(browserCDP, pageCDP) {
  const heap = await pageCDP.send('Runtime.getHeapUsage');
  const memory = { jsHeapMiB: mib(heap.usedSize), jsHeapCapacityMiB: mib(heap.totalSize) };
  // Process RSS adds a useful OS observation without pretending JS heap is total RAM.
  // Shared resident pages may occur in more than one process; GPU VRAM is not measured.
  try {
    const { processInfo } = await browserCDP.send('SystemInfo.getProcessInfo');
    const ids = processInfo.map(p => p.id).filter(id => Number.isInteger(id) && id > 0);
    const { stdout } = await execFileAsync('ps', ['-o', 'pid=,rss=', '-p', ids.join(',')], { maxBuffer: 16384 });
    const rows = stdout.trim().split('\n').map(line => line.trim().split(/\s+/).map(Number));
    const rssKiB = rows.reduce((sum, row) => sum + (Number.isFinite(row[1]) ? row[1] : 0), 0);
    memory.summedChromeProcessRssMiB = rounded(rssKiB / 1024);
    memory.chromeProcessCount = rows.length;
  } catch {
    memory.summedChromeProcessRssMiB = null;
  }
  assert.ok(Number.isFinite(heap.usedSize) && heap.usedSize > 0, 'Chrome must provide a valid JS heap observation');
  return memory;
}

async function ready(page, url) {
  await page.addInitScript(() => {
    window.__portraitBenchTiming = {};
    window.addEventListener('portrait-ready', () => {
      window.__portraitBenchTiming.readyMs = performance.now();
      // The application has already requested its first frame before this event.
      requestAnimationFrame(() => {
        const queue = window.portrait?.renderer?.backend?.device?.queue;
        if (queue?.onSubmittedWorkDone) queue.onSubmittedWorkDone().then(() => {
          window.__portraitBenchTiming.firstFrameQueueCompleteMs = performance.now();
        }).catch(() => {});
      });
    }, { once: true });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.portrait?.ready, null, { timeout: 120000 });
  assert.equal(await page.evaluate(() => window.portrait.renderer.backend?.isWebGPUBackend), true, 'Benchmark requires native WebGPU; compatibility rendering is not accepted');
  await page.waitForFunction(() => Number.isFinite(window.__portraitBenchTiming.firstFrameQueueCompleteMs), null, { timeout: 120000 });
}

async function settle(page) {
  await page.evaluate(() => {
    const p = window.portrait;
    p.startTurntable(false);
    p.controls.enableDamping = false;
    p.controls.update();
    p.renderNow();
  });
  await page.waitForTimeout(300);
  await page.evaluate(async () => { await window.portrait.renderer.backend.device.queue.onSubmittedWorkDone(); });
}

async function benchmarkResolution(page, pageCDP, browserCDP, width, height, samples) {
  await page.evaluate(([w, h]) => { window.portrait.setResolution(w, h); }, [width, height]);
  await settle(page);
  const timings = await page.evaluate(async (count) => {
    const p = window.portrait, { renderer, scene, camera } = p;
    const queue = renderer.backend.device.queue;
    if (typeof queue?.onSubmittedWorkDone !== 'function') throw new Error('GPU queue completion is unavailable');
    // Two unmeasured warmups eliminate one-time compilation from the repeated-frame samples.
    // The optional 4K probe intentionally records one frame after resize, without extra warmups.
    const warmups = count > 1 ? 2 : 0;
    for (let i = 0; i < warmups; i++) { renderer.render(scene, camera); await queue.onSubmittedWorkDone(); }
    const uiFramesBefore = p.state.renderedFrames, durations = [];
    for (let i = 0; i < count; i++) {
      const start = performance.now();
      renderer.render(scene, camera);
      await queue.onSubmittedWorkDone();
      durations.push(performance.now() - start);
    }
    durations.sort((a, b) => a - b);
    const middle = Math.floor(count / 2);
    return {
      width: renderer.domElement.width, height: renderer.domElement.height,
      samples: count, warmupFrames: warmups,
      medianMs: count % 2 ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2,
      p95Ms: durations[Math.max(0, Math.ceil(count * .95) - 1)],
      minMs: durations[0], maxMs: durations[count - 1],
      concurrentUiFrames: p.state.renderedFrames - uiFramesBefore,
    };
  }, samples);
  assert.equal(timings.width, width); assert.equal(timings.height, height);
  assert.equal(timings.concurrentUiFrames, 0, 'Demand-render frames must not overlap the sequential benchmark');
  for (const key of ['medianMs', 'p95Ms', 'minMs', 'maxMs']) {
    assert.ok(Number.isFinite(timings[key]) && timings[key] >= 0, `${key} must be finite`);
    timings[key] = rounded(timings[key]);
  }
  return { ...timings, memory: await chromeMemory(browserCDP, pageCDP) };
}

try {
  browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking', '--no-first-run'],
  });
  const browserCDP = await browser.newBrowserCDPSession();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message.slice(0, 300)));
  await ready(page, base);
  result.nativeWebGPU = true;
  result.startup = await page.evaluate(() => ({
    navigationToReadyMs: +window.__portraitBenchTiming.readyMs.toFixed(2),
    firstFrameQueueCompleteMs: +window.__portraitBenchTiming.firstFrameQueueCompleteMs.toFixed(2),
    textureBakeMs: Number.isFinite(window.portrait.state.textureBakeMs) ? +window.portrait.state.textureBakeMs.toFixed(2) : null,
  }));
  const saved = await page.evaluate(() => ({ width: window.portrait.state.width, height: window.portrait.state.height, damping: window.portrait.controls.enableDamping, view: window.portrait.state.view }));
  const pageCDP = await context.newCDPSession(page);
  result.geometry = await page.evaluate(() => {
    const geometries = new Set(), materials = new Set(), textures = new Set(), arrays = new Set();
    let meshes = 0, visibleMeshes = 0, triangles = 0, visibleTriangles = 0, attributeBytes = 0;
    window.portrait.scene.traverse(object => {
      if (!object.isMesh) return;
      meshes++;
      let visible = true;
      for (let parent = object; parent; parent = parent.parent) if (!parent.visible) visible = false;
      const g = object.geometry, instances = object.isInstancedMesh ? object.count : 1;
      const count = Math.floor((g.index?.count || g.attributes.position.count) / 3) * instances;
      triangles += count;
      if (visible) { visibleMeshes++; visibleTriangles += count; }
      if (!geometries.has(g)) {
        geometries.add(g);
        for (const attribute of [...Object.values(g.attributes), g.index].filter(Boolean)) {
          const array = attribute.isInterleavedBufferAttribute ? attribute.data.array : attribute.array;
          if (array && !arrays.has(array.buffer)) { arrays.add(array.buffer); attributeBytes += array.buffer.byteLength; }
        }
      }
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material || materials.has(material)) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    return { meshes, visibleMeshes, triangles, visibleTriangles, uniqueGeometries: geometries.size, uniqueMaterials: materials.size, uniqueTextures: textures.size, geometryArrayMiB: +(attributeBytes / 1048576).toFixed(2) };
  });
  assert.ok(result.geometry.visibleTriangles > 0, 'The scene must contain visible geometry');
  try {
    await page.evaluate(() => window.portrait.setView('front'));
    await settle(page);
    const idleBefore = await page.evaluate(() => window.portrait.state.renderedFrames);
    await page.waitForTimeout(1200);
    const idleAfter = await page.evaluate(() => window.portrait.state.renderedFrames);
    result.idle = { observedMs: 1200, renderedFrames: idleAfter - idleBefore };
    assert.equal(result.idle.renderedFrames, 0, 'Idle portrait must stop submitting frames');
    result.benchmarks = [];
    result.benchmarks.push(await benchmarkResolution(page, pageCDP, browserCDP, 900, 1200, 30));
    result.benchmarks.push(await benchmarkResolution(page, pageCDP, browserCDP, 1280, 1707, 30));
    if (include4K) result.benchmarks.push(await benchmarkResolution(page, pageCDP, browserCDP, 3072, 4096, 1));
  } finally {
    await page.evaluate(({ width, height, damping, view }) => {
      const p = window.portrait;
      p.setResolution(width, height); p.setView(view); p.controls.enableDamping = damping; p.renderNow();
    }, saved);
    await page.evaluate(async () => { await window.portrait.renderer.backend.device.queue.onSubmittedWorkDone(); });
  }
  assert.deepEqual(errors, [], 'No uncaught errors during benchmarking');
  await context.close();

  // A separate, offline context loads the actual self-contained file directly.
  // No local server response, cache, external script, sidecar image, or font is needed.
  const standaloneStat = await stat(standalone);
  const offlineContext = await browser.newContext({ offline: true, viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const offlinePage = await offlineContext.newPage();
  const fileURL = pathToFileURL(standalone).href;
  const unexpectedRequests = [], offlineErrors = [];
  offlinePage.on('request', request => {
    const url = request.url();
    if (url !== fileURL && !url.startsWith('data:') && !url.startsWith('blob:')) unexpectedRequests.push(url.slice(0, 220));
  });
  offlinePage.on('pageerror', error => offlineErrors.push(error.message.slice(0, 300)));
  await ready(offlinePage, fileURL);
  await settle(offlinePage);
  await offlinePage.waitForTimeout(350);
  assert.deepEqual(unexpectedRequests, [], 'Standalone HTML must not request network or sidecar assets');
  assert.deepEqual(offlineErrors, [], 'Standalone HTML must execute without uncaught errors while offline');
  result.offlineStandalone = {
    loadedFromFile: true, networkOffline: true, nativeWebGPU: true, externalOrSidecarRequests: unexpectedRequests.length,
    htmlMiB: mib(standaloneStat.size),
  };
  await offlineContext.close();
  result.measurement = 'Sequential CPU submission-to-GPU-queue-completion latency; not GPU timestamps or presentation FPS. RSS sums Chrome processes; shared pages may repeat. GPU memory is not measured.';
  result.status = 'passed';
} catch (error) {
  result.status = 'failed';
  result.error = String(error?.message || error).slice(0, 900);
} finally {
  if (browser) await browser.close().catch(() => {});
}

console.log(JSON.stringify(result));
if (result.status !== 'passed') process.exitCode = 1;
