#!/usr/bin/env node
/** Verify the deployed (cloud) build boots and renders. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const url = process.argv[2] || 'https://cdn.jsdelivr.net/gh/ecooxai/demo3d@yuukapa-deploy/src/index.html';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--enable-unsafe-webgpu', '--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars'],
  defaultViewport: { width: 1000, height: 1300 } });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 180)); });
page.on('requestfailed', (r) => errs.push('reqfail: ' + r.url().slice(0, 120)));
await page.goto(url + '?backend=webgpu&res=900x1200', { waitUntil: 'domcontentloaded', timeout: 60000 });
let ready = false;
try {
  await page.waitForFunction(() => window.__yuukapa?.ready === true, { timeout: 45000 });
  ready = true;
} catch { /* reported below */ }
await new Promise((r) => setTimeout(r, 3000));
const info = await page.evaluate(() => (window.__yuukapa ? window.__yuukapa.info() : null));
await page.screenshot({ path: process.argv[3] || 'review/deploy.png' });
console.log('url      :', url);
console.log('ready    :', ready);
console.log('info     :', JSON.stringify(info));
console.log('errors   :', errs.length ? errs.slice(0, 6).join('\n           ') : 'none');
await browser.close();
