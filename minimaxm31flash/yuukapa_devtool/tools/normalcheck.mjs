#!/usr/bin/env node
/** Normal-direction check: vertex normals must point away from the mesh centre. */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 600, height: 800 },
});
const page = await browser.newPage();
await page.goto('http://localhost:8123/?backend=webgl&res=600x800&hud=0&anim=0', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 4500));

const report = await page.evaluate(() => {
  const app = window.__yuukapa.app;
  const out = [];
  const seen = new Set();
  app.character.rig.root.traverse((o) => {
    if (!o.isMesh || o.name === 'rim' || o.name === 'outline') return;
    const g = o.geometry;
    const p = g.attributes.position, n = g.attributes.normal;
    if (!p || !n) { out.push({ name: o.name, err: 'missing attrs' }); return; }
    // centroid
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < p.count; i++) { cx += p.getX(i); cy += p.getY(i); cz += p.getZ(i); }
    cx /= p.count; cy /= p.count; cz /= p.count;
    let dot = 0, used = 0;
    for (let i = 0; i < p.count; i++) {
      const dx = p.getX(i) - cx, dy = p.getY(i) - cy, dz = p.getZ(i) - cz;
      const l = Math.hypot(dx, dy, dz);
      if (l < 1e-4) continue;
      dot += (dx * n.getX(i) + dy * n.getY(i) + dz * n.getZ(i)) / l;
      used++;
    }
    const avg = used ? dot / used : 0;

    // signed volume — positive means the winding faces outwards
    let vol = 0;
    const idx = g.index;
    if (idx) {
      const a = idx.array;
      for (let t = 0; t < a.length; t += 3) {
        const i0 = a[t], i1 = a[t + 1], i2 = a[t + 2];
        const x0 = p.getX(i0), y0 = p.getY(i0), z0 = p.getZ(i0);
        const x1 = p.getX(i1), y1 = p.getY(i1), z1 = p.getZ(i1);
        const x2 = p.getX(i2), y2 = p.getY(i2), z2 = p.getZ(i2);
        vol += x0 * (y1 * z2 - z1 * y2) - y0 * (x1 * z2 - z1 * x2) + z0 * (x1 * y2 - y1 * x2);
      }
      vol /= 6;
    }
    const key = o.name;
    if (!seen.has(key)) { seen.add(key); out.push({ name: o.name, avgDot: +avg.toFixed(3), vol: +vol.toFixed(6), verts: p.count }); }
  });
  return out;
});
report.sort((a, b) => (a.vol ?? 0) - (b.vol ?? 0));
for (const r of report) {
  const flag = (r.vol !== undefined && r.vol < -1e-9) ? '  <-- INVERTED' : (r.vol !== undefined && r.vol > 1e-9 ? '' : '  (open surface)');
  console.log(`${String(r.name).padEnd(16)} vol=${String(r.vol).padStart(12)} avgDot=${String(r.avgDot).padStart(7)}${flag}`);
}
await browser.close();
