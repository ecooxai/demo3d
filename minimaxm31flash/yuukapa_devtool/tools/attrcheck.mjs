#!/usr/bin/env node
/** Attribute consistency check across every geometry in the scene. */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 600, height: 800 },
});
const page = await browser.newPage();
await page.goto('http://localhost:8123/?backend=webgl&res=600x800&hud=0&anim=0', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 5000));

const report = await page.evaluate(() => {
  const app = window.__yuukapa.app;
  const out = [];
  const seen = new Set();
  app.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    const pos = g.attributes.position;
    if (!pos) { out.push({ name: o.name, err: 'no position' }); return; }
    const info = { name: o.name, mat: o.material?.type, vcolor: !!o.material?.vertexColors, pos: pos.count, attrs: {} };
    for (const k in g.attributes) info.attrs[k] = g.attributes[k].count;
    let maxIdx = -1;
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) if (a[i] > maxIdx) maxIdx = a[i]; }
    info.maxIdx = maxIdx;
    info.idxType = g.index ? g.index.array.constructor.name : 'none';
    const key = JSON.stringify(info);
    if (!seen.has(key)) { seen.add(key); out.push(info); }
  });
  return out;
});
for (const r of report) {
  const counts = Object.values(r.attrs);
  const uniq = [...new Set(counts)];
  const bad = r.maxIdx >= r.pos || uniq.length > 1;
  if (bad) console.log('BAD', JSON.stringify(r));
}
console.log('total distinct geometries:', report.length);
await browser.close();
