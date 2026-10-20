#!/usr/bin/env node
/** Bisect which mesh group triggers the GL draw errors. */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 600, height: 800 },
});
const page = await browser.newPage();
let errs = [];
page.on('console', (m) => { const t = m.text(); if (/GL_INVALID|too many errors/.test(t)) errs.push(t); });
await page.goto('http://localhost:8123/?backend=webgl&res=600x800&hud=0&anim=0', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 5000));
errs = [];

const groups = await page.evaluate(() => {
  const app = window.__yuukapa.app;
  const names = [];
  app.character.rig.root.traverse((o) => { if (o.isMesh && o.name) names.push(o.name); });
  return [...new Set(names)];
});

console.log('meshes:', groups.length);

for (const name of groups) {
  errs = [];
  await page.evaluate((n) => {
    const app = window.__yuukapa.app;
    app.character.rig.root.traverse((o) => { if (o.isMesh) o.visible = (o.name === n || o.parent?.name === n); });
  }, name);
  await new Promise((r) => setTimeout(r, 350));
  if (errs.length) console.log(`  ERR ${name}: ${errs.length} (${errs[0].slice(0, 90)})`);
}
await browser.close();
