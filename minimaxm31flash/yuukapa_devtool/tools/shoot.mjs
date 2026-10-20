#!/usr/bin/env node
/**
 * Headless Chrome capture harness for the Yuukapa viewer.
 *
 * node tools/shoot.mjs --out review/iter01 --views front,back,left,right,three4 \
 *      --backend webgl --w 900 --h 1200 [--settle 2500]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(__dirname, '..');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const outDir = path.resolve(PROJECT, String(arg('out', 'review/shot')));
const views = String(arg('views', 'front')).split(',').map((s) => s.trim()).filter(Boolean);
const backend = String(arg('backend', 'webgl'));
const W = Number(arg('w', 900));
const H = Number(arg('h', 1200));
const settle = Number(arg('settle', 2600));
const port = Number(arg('port', 8123));
const tag = String(arg('tag', ''));

fs.mkdirSync(outDir, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell' === 'never' ? false : true,
  args: [
    '--enable-unsafe-webgpu',
    '--enable-features=Vulkan,WebGPU',
    '--use-angle=metal',
    '--ignore-gpu-blocklist',
    '--enable-gpu-rasterization',
    '--hide-scrollbars',
    '--no-sandbox',
    `--window-size=${W},${H}`,
  ],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));

const url = `http://localhost:${port}/?backend=${backend}&res=${W}x${H}&hud=0&shot=1${arg('extra', '') ? '&' + String(arg('extra', '')) : ''}`;
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

let ready = false;
try {
  await page.waitForFunction(() => window.__yuukapa && window.__yuukapa.ready === true, { timeout: 30000 });
  ready = true;
} catch {
  logs.push('[harness] app did not signal ready within 30s');
}
await new Promise((r) => setTimeout(r, settle));

for (const view of views) {
  let ok = false;
  try {
    ok = await page.evaluate((v) => {
      if (window.__yuukapa && window.__yuukapa.setView) return window.__yuukapa.setView(v);
      return false;
    }, view);
  } catch (e) {
    logs.push(`[harness] setView(${view}) failed: ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 900));
  const file = path.join(outDir, `${view}${tag ? '-' + tag : ''}.png`);
  await page.screenshot({ path: file });
  console.log(`[shot] ${view} -> ${path.relative(PROJECT, file)} (setView=${ok})`);
}

const info = await page.evaluate(() => (window.__yuukapa ? window.__yuukapa.info() : null));
fs.writeFileSync(path.join(outDir, 'console.log'), logs.join('\n'));
fs.writeFileSync(path.join(outDir, 'info.json'), JSON.stringify({ ready, info, views, backend, W, H }, null, 2));
console.log(`[harness] ready=${ready} backend=${info?.backend ?? 'n/a'} fps=${info?.fps ?? 'n/a'}`);
if (logs.length) console.log('[harness] console tail:\n' + logs.slice(-25).join('\n'));

await browser.close();
