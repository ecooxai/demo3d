#!/usr/bin/env node
/**
 * Attribute consistency check: every attribute of a geometry must have the
 * same vertex count as the position attribute, and every index must be
 * inside that range. Mismatches show up in WebGL as
 * "Vertex buffer is not big enough for the draw call".
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 800, height: 1000 },
});
const page = await browser.newPage();
await page.goto('http://localhost:8123/?backend=webgl&res=800x1000&hud=0', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 5000));

const report = await page.evaluate(() => {
  const app = window.__yuukapa.app;
  const out = [];
  const seen = new Set();
  app.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    const p = g.attributes.position;
    if (!p) { out.push({ name: o.name, err: 'no position attribute' }); return; }
    const counts = {};
    for (const k in g.attributes) counts[k] = g.attributes[k].count;
    let maxIdx = -1;
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) if (a[i] > maxIdx) maxIdx = a[i]; }
    const key = o.name + JSON.stringify(counts) + maxIdx;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ name: o.name || '(unnamed)', verts: p.count, attrs: counts, maxIdx, idxType: g.index ? g.index.array.constructor.name : 'none' });
  });
  return out;
});

let bad = 0;
for (const r of report) {
  const counts = Object.values(r.attrs);
  const uniq = [...new Set(counts)];
  const problems = [];
  if (uniq.length > 1) problems.push('attribute count mismatch');
  if (r.maxIdx >= r.verts) problems.push('index out of range');
  if (problems.length) { bad++; console.log('BAD ', JSON.stringify(r), problems.join(', ')); }
}
console.log(`checked ${report.length} distinct geometries — ${bad} problem(s)`);
await browser.close();
process.exit(bad ? 1 : 0);
