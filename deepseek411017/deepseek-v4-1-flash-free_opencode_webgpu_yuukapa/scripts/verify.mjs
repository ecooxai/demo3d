import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const outDir = path.resolve('output/iteration-005');
fs.mkdirSync(outDir, { recursive: true });
const report = {};

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-unsafe-webgpu',
    '--ignore-gpu-blocklist',
    '--use-angle=metal',
    '--hide-scrollbars',
  ],
});

async function probe(label, query, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const logs = [];
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) logs.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`));

  await page.goto(`http://127.0.0.1:4173/${query}`, { waitUntil: 'networkidle0', timeout: 60000 });
  const result = await page.evaluate(async () => {
    const gpu = typeof navigator.gpu !== 'undefined';
    let adapter = false;
    if (gpu) {
      try {
        adapter = Boolean(await navigator.gpu.requestAdapter());
      } catch {
        adapter = false;
      }
    }
    const deadline = Date.now() + 20000;
    while (!document.body.dataset.ready && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return {
      hasGpuApi: gpu,
      hasAdapter: adapter,
      ready: document.body.dataset.ready === 'true',
      backend: window.__YUUKAPA__?.backend ?? null,
      score: window.__YUUKAPA__?.score?.() ?? null,
      resolution: window.__YUUKAPA__?.resolution?.() ?? null,
      promptVisible: !document.querySelector('#backend-prompt')?.hidden,
      promptOpen: document.querySelector('#backend-prompt')?.open ?? false,
      fatalVisible: !document.querySelector('#fatal-screen')?.hidden,
    };
  });

  if (result.ready) {
    await page.evaluate(() => document.querySelector('#stage-loading')?.classList.add('is-hidden'));
    await new Promise((resolve) => setTimeout(resolve, 1400));
    const stage = await page.$('#stage');
    if (stage) await stage.screenshot({ path: path.join(outDir, `${label}-stage.png`) });
    await page.screenshot({ path: path.join(outDir, `${label}-ui.png`) });
  } else {
    await page.screenshot({ path: path.join(outDir, `${label}-ui.png`) });
  }

  report[label] = { ...result, logs };
  await page.close();
}

await probe('webgpu', '?backend=webgpu&capture=1', { width: 1440, height: 1200, deviceScaleFactor: 1 });
await probe('webgl', '?backend=webgl&capture=1', { width: 1440, height: 1200, deviceScaleFactor: 1 });
await probe('auto', '', { width: 1440, height: 1200, deviceScaleFactor: 1 });
await probe('mobile', '?backend=webgl&capture=1', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

fs.writeFileSync(path.join(outDir, 'verify.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
