#!/usr/bin/env node
/** Count WebGL errors under different feature combinations to isolate a fault. */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--enable-unsafe-webgpu', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 900, height: 1200 },
});

for (const q of ['outline=0&rim=0&shadows=0', 'outline=0&rim=1&shadows=0', 'outline=1&rim=0&shadows=0', 'outline=1&rim=1&shadows=1']) {
  const page = await browser.newPage();
  let errs = 0;
  page.on('console', (m) => { if (/GL_INVALID|too many errors|ERROR/.test(m.text())) errs++; });
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  await page.goto(`http://localhost:8123/?backend=webgl&res=900x1200&hud=0&${q}`, { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 5000));
  const info = await page.evaluate(() => window.__yuukapa?.info());
  console.log(`${q.padEnd(34)} glErrors=${String(errs).padStart(4)}  ready=${info ? 'y' : 'n'}`);
  await page.close();
}
await browser.close();
