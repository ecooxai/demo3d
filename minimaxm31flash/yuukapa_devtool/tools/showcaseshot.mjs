#!/usr/bin/env node
/** Screenshot the showcase build (with the credit bar). */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = process.argv[2] || 'review/showcase';
const W = Number(process.argv[3] || 1280);
const H = Number(process.argv[4] || 1600);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--enable-unsafe-webgpu', '--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars'],
  defaultViewport: { width: W, height: H } });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:8123/output/yuukapa_showcase/src/index.html?backend=webgpu&res=${W}x${H}&hud=0`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__yuukapa?.ready === true, { timeout: 45000 }).catch(() => console.log('not ready'));
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: `${out}/showcase-front.png` });
await page.evaluate(() => window.__yuukapa.setView('three4'));
await new Promise(r => setTimeout(r, 1600));
await page.screenshot({ path: `${out}/showcase-three4.png` });
console.log('captured', out);
await browser.close();
