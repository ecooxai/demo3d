import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Candidate 73 is substituted only in this review bundle.
const blousePath = path.resolve('src/blouse.js');
const candidatePath = path.resolve('review/blouse-candidate73.js');
let candidateLoads = 0;
await build({
  entryPoints: ['src/main.js'], bundle: true, format: 'iife', target: ['es2022'],
  minify: true, loader: {'.jpg': 'dataurl'},
  outfile: 'output/qa/app-blouse-drape73.js', logLevel: 'silent',
  plugins: [{name: 'blouse-drape-73-review', setup(builder) {
    builder.onLoad({filter: /[/\\]blouse\.js$/}, async args => {
      if (path.resolve(args.path) !== blousePath) return;
      candidateLoads++;
      return {contents: await readFile(candidatePath, 'utf8'), loader: 'js', resolveDir: path.dirname(blousePath)};
    });
  }}],
});
if (candidateLoads !== 1) throw new Error('Blouse candidate 73 must be substituted exactly once');

const browser = await chromium.launch({
  executablePath: path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'],
});
try {
  const page = await browser.newPage({viewport: {width: 1440, height: 1350}, deviceScaleFactor: 1});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/app.js', route => route.fulfill({path: 'output/qa/app-blouse-drape73.js', contentType: 'text/javascript'}));
  await page.goto('http://127.0.0.1:8766/', {waitUntil: 'networkidle'});
  await page.waitForFunction(() => window.portrait?.ready);
  const nativeWebGPU = await page.evaluate(() => {
    const p = window.portrait;
    p.setScore(73, 76);
    return p.renderer.backend.isWebGPUBackend === true;
  });
  if (!nativeWebGPU) throw new Error('Blouse candidate 73 requires native WebGPU');

  for (const view of ['front', 'left', 'right', 'back']) {
    await page.evaluate(view => {
      const p = window.portrait;
      p.setView(view);
      p.renderNow();
    }, view);
    await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path: `output/qa/blouse-drape-73-${view}.png`});
  }
  await page.evaluate(() => {
    const p = window.portrait;
    p.headPivot.visible = false;
    p.setView('detail');
    p.controls.target.set(0, .1, .2);
    p.camera.position.set(0, .1, 13.2);
    p.camera.zoom = .72;
    p.camera.updateProjectionMatrix();
    p.camera.lookAt(p.controls.target);
    p.controls.update();
    p.renderNow();
  });
  await page.waitForTimeout(180);
  await page.locator('#viewport-wrap').screenshot({path: 'output/qa/blouse-drape-73-garment.png'});
  if (errors.length) throw new Error(JSON.stringify(errors));
  console.log(JSON.stringify(await page.evaluate(() => ({
    result: 'rendered', candidate: 73,
    nativeWebGPU: window.portrait.renderer.backend.isWebGPUBackend === true,
    iteration: window.portrait.state.iteration,
    heapMiB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
  }))));
} finally {
  await browser.close();
}
