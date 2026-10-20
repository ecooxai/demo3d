#!/usr/bin/env node
/** Full-page UI capture (hud + settings panel). */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = process.argv[2] || 'review/ui';
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars'],
  defaultViewport: { width: W, height: H } });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 160)); });
await page.goto('http://localhost:8123/?backend=webgl&res=900x1200', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__yuukapa?.ready === true, { timeout: 30000 }).catch(() => console.log('not ready'));
await new Promise(r => setTimeout(r, 2500));
await page.screenshot({ path: `${out}/ui-main.png` });
await page.evaluate(() => document.getElementById('gearBtn').click());
await new Promise(r => setTimeout(r, 700));
await page.screenshot({ path: `${out}/ui-panel.png` });
await page.evaluate(() => { document.getElementById('panelClose').click(); window.__yuukapa.setView('closeup'); });
await new Promise(r => setTimeout(r, 1600));
await page.screenshot({ path: `${out}/ui-closeup.png` });
console.log('captured', out);
await browser.close();
