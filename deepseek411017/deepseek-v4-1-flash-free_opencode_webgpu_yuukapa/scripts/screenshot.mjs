import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const outDir = path.resolve('output/iteration-005');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-angle=metal',
    '--hide-scrollbars',
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });

const logs = [];
page.on('console', (msg) => {
  if (['error', 'warning'].includes(msg.type())) logs.push(`${msg.type()}: ${msg.text()}`);
});
page.on('pageerror', (error) => logs.push(`pageerror: ${error.message}`));

await page.goto('http://127.0.0.1:4173/?backend=webgl&capture=1', { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 60000 });
await page.evaluate(() => {
  document.querySelector('#stage-loading')?.classList.add('is-hidden');
});
await new Promise((resolve) => setTimeout(resolve, 1600));

await page.screenshot({ path: path.join(outDir, 'ui-front.png') });

await page.evaluate(() => { window.__YUUKAPA__.scene.traverse((o) => { if (o.userData?.isOutline) o.visible = false; }); });
await new Promise((resolve) => setTimeout(resolve, 500));
await page.screenshot({ path: path.join(outDir, 'ui-no-outline.png') });
const noOutlineData = await page.evaluate(() => document.querySelector('#scene').toDataURL('image/png'));
fs.writeFileSync(path.join(outDir, 'render-no-outline.png'), Buffer.from(noOutlineData.split(',')[1], 'base64'));
await page.evaluate(() => { window.__YUUKAPA__.scene.traverse((o) => { if (o.userData?.isOutline) o.visible = true; }); });

const stage = await page.$('#stage');
await stage.screenshot({ path: path.join(outDir, 'stage-front.png') });

const dataUrl = await page.evaluate(() => document.querySelector('#scene').toDataURL('image/png'));
const base64 = dataUrl.split(',')[1];
fs.writeFileSync(path.join(outDir, 'render-front.png'), Buffer.from(base64, 'base64'));

for (const view of ['left', 'back', 'right']) {
  await page.evaluate((name) => window.__YUUKAPA__.setView(name), view);
  await new Promise((resolve) => setTimeout(resolve, 1300));
  const data = await page.evaluate(() => document.querySelector('#scene').toDataURL('image/png'));
  fs.writeFileSync(path.join(outDir, `render-${view}.png`), Buffer.from(data.split(',')[1], 'base64'));
  const el = await page.$('#stage');
  await el.screenshot({ path: path.join(outDir, `stage-${view}.png`) });
}

const meta = await page.evaluate(() => ({
  resolution: window.__YUUKAPA__.resolution(),
  score: window.__YUUKAPA__.score(),
  renderer: window.__YUUKAPA__.backend,
}));

fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify({ meta, logs }, null, 2));
console.log(JSON.stringify({ meta, logs, outDir }, null, 2));

await browser.close();
