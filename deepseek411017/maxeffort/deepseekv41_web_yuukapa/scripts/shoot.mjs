import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4180/';
const outDir = process.env.OUT_DIR || 'output';
mkdirSync(outDir, { recursive: true });

const views = (process.env.VIEWS || 'front,three-quarter,profile,back').split(',');
const res = process.env.RES || '900x1200';
const backend = process.env.BACKEND || 'webgl';
const tag = process.env.TAG || 'iter01';

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--ignore-gpu-blocklist',
    '--enable-webgl',
    '--use-angle=metal',
    '--enable-unsafe-webgpu',
    '--disable-gpu-sandbox',
    '--font-render-hinting=none',
  ],
});
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (msg) => {
  const text = msg.text();
  if (!text.includes('GPU stall due to ReadPixels')) logs.push(`[${msg.type()}] ${text}`);
});
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

await page.goto(`${BASE}?backend=${backend}&res=${res}&view=front&clean=1`, { waitUntil: 'networkidle', timeout: 60000 });
try {
  await page.waitForFunction('window.__YUU__ && window.__YUU__.ready', null, { timeout: 60000 });
} catch (e) {
  console.log('READY TIMEOUT');
}
console.log('backend:', await page.evaluate(() => window.__YUU__?.backend ?? null).catch(() => null));
await page.waitForTimeout(1400);

for (const view of views) {
  await page.evaluate((v) => window.__YUU__?.setView(v, true), view);
  await page.waitForTimeout(450);
  const canvas = page.locator('#scene');
  await canvas.screenshot({ path: `${outDir}/${tag}_${view}.png` });
  console.log('saved', `${outDir}/${tag}_${view}.png`);
}

// Full UI screenshot
if (process.env.UI === '1') {
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page2.on('pageerror', (e) => logs.push(`[ui pageerror] ${e.message}`));
  await page2.goto(`${BASE}?backend=${backend}&res=${res}&view=front`, { waitUntil: 'networkidle', timeout: 60000 });
  try { await page2.waitForFunction('window.__YUU__ && window.__YUU__.ready', null, { timeout: 60000 }); } catch {}
  await page2.waitForTimeout(1600);
  await page2.screenshot({ path: `${outDir}/${tag}_ui.png` });
  console.log('saved', `${outDir}/${tag}_ui.png`);
  await page2.close();
}

console.log('--- console ---');
console.log(logs.slice(-60).join('\n'));
await browser.close();
