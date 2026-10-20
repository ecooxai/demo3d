#!/usr/bin/env node
/** Geometry validation pass — finds meshes whose index range exceeds their vertex count. */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--enable-unsafe-webgpu', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 900, height: 1200 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/?backend=webgl&res=900x1200&hud=0', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 6000));

const bad = await page.evaluate(() => {
  const out = [];
  const app = window.__yuukapa?.app;
  if (!app) return [{ error: 'no app' }];
  app.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    const count = g.attributes.position?.count ?? 0;
    const idx = g.index;
    if (!idx) return;
    const arr = idx.array;
    let max = -1;
    for (let i = 0; i < arr.length; i++) if (arr[i] > max) max = arr[i];
    if (max >= count) {
      out.push({ name: o.name, parent: o.parent?.name, verts: count, maxIndex: max, idxLen: arr.length });
    }
  });
  return out;
});
console.log(JSON.stringify(bad, null, 2));
await browser.close();
