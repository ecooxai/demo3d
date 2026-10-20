import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const url = process.argv[2] || 'https://yuukapa-deepseek-v41-flash.surge.sh/';
const outDir = path.resolve('output/iteration-005');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--use-angle=metal'],
});

const report = {};
for (const [label, query] of [['auto', ''], ['webgl', '?backend=webgl&capture=1']]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto(`${url}${query}`, { waitUntil: 'networkidle0', timeout: 90000 });
  const result = await page.evaluate(async () => {
    const deadline = Date.now() + 25000;
    while (!document.body.dataset.ready && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200));
    return {
      ready: document.body.dataset.ready === 'true',
      backend: window.__YUUKAPA__?.backend ?? null,
      score: window.__YUUKAPA__?.score?.() ?? null,
      resolution: window.__YUUKAPA__?.resolution?.() ?? null,
    };
  });
  if (result.ready) {
    await page.evaluate(() => document.querySelector('#stage-loading')?.classList.add('is-hidden'));
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outDir, `live-deploy-${label}.png`) });
  }
  report[label] = { ...result, logs };
  await page.close();
}
fs.writeFileSync(path.join(outDir, 'live-deploy.json'), JSON.stringify({ url, report }, null, 2));
console.log(JSON.stringify({ url, report }, null, 2));
await browser.close();
