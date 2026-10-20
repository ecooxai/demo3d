import { chromium } from 'playwright-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--ignore-gpu-blocklist','--enable-webgl','--use-angle=metal','--enable-unsafe-webgpu','--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 1400 } });
page.on('console', m => console.log('CONSOLE', m.type(), m.text()));
page.on('pageerror', e => console.log('PAGEERROR', e.message, e.stack?.split('\n').slice(0,4).join('\n')));
await page.goto('http://127.0.0.1:4180/?backend=webgl&res=900x1200&view=front&clean=1', { waitUntil: 'networkidle' });
await page.waitForTimeout(6000);
const info = await page.evaluate(() => ({
  hasApi: !!window.__YUU__,
  apiKeys: window.__YUU__ ? Object.keys(window.__YUU__) : null,
  ready: window.__YUU__?.ready,
  loaderDisplay: document.getElementById('loader')?.style.display,
  loaderClass: document.getElementById('loader')?.className,
  fallbackHidden: document.getElementById('stageFallback')?.hidden,
  canvas: (() => { const c = document.getElementById('scene'); const r = c?.getBoundingClientRect(); return c ? {w:c.width,h:c.height, cssW:r.width, cssH:r.height} : null; })(),
  stage: (() => { const s = document.querySelector('.stage')?.getBoundingClientRect(); return s ? {w:s.width,h:s.height} : null; })(),
  frame: (() => { const s = document.getElementById('stageFrame')?.getBoundingClientRect(); return s ? {w:s.width,h:s.height} : null; })(),
}));
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'output/debug_full.png' });
await browser.close();
