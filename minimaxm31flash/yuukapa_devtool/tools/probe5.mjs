#!/usr/bin/env node
/** Probe 5: isolate what brightens the hair. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist'], defaultViewport: { width: 900, height: 1200 } });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/?backend=webgl&res=900x1200&hud=0&anim=0', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 4500));

const res = await page.evaluate(async () => {
  const app = window.__yuukapa.app;
  const TSL = await import('/vendor/three/three.tsl.js');
  const out = {};
  const sample = async (label) => {
    await app.frame();
    const cv = app.canvas;
    const c2 = document.createElement('canvas');
    c2.width = cv.width; c2.height = cv.height;
    const ctx = c2.getContext('2d');
    ctx.drawImage(cv, 0, 0);
    const d = ctx.getImageData(430, 130, 1, 1).data;
    out[label] = `${d[0]},${d[1]},${d[2]}`;
  };
  await sample('baseline');

  // 1. kill the rim shells
  app.scene.traverse((o) => { if (o.name === 'rim') o.visible = false; });
  await sample('noRim');

  // 2. kill the outline shells
  app.scene.traverse((o) => { if (o.name === 'rim') o.visible = true; if (o.name === 'outline') o.visible = false; });
  await sample('noOutline');

  // 3. rim+outline back, but the hair material flat
  app.scene.traverse((o) => { if (o.name === 'outline') o.visible = true; });
  let hair = null;
  app.character.hair.traverse((o) => { if (o.name === 'bang0' && !hair) hair = o; });
  const savedVC = hair.material.vertexColors;
  hair.material.vertexColors = false;
  hair.material.needsUpdate = true;
  await sample('noVertexColors');
  hair.material.vertexColors = savedVC;
  hair.material.needsUpdate = true;

  // 4. what does the hair material look like?
  out.mat = { type: hair.material.type, isToon: !!hair.material.isMeshToonMaterial, color: hair.material.color.getHexString() };
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();
