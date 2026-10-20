#!/usr/bin/env node
/** Probe: hair material + vertex colours + rendered pixel. */
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
  const out = {};
  let bang = null, cap = null;
  app.character.hair.traverse(o => { if (o.name === 'bang0' && !bang) bang = o; if (o.name === 'hairCap' && !cap) cap = o; });
  const m = bang.material;
  out.mat = { type: m.type, vertexColors: m.vertexColors, color: m.color.getHexString(), gradientMap: !!m.gradientMap };
  const c = bang.geometry.attributes.color;
  out.vcol0 = [c.getX(0).toFixed(3), c.getY(0).toFixed(3), c.getZ(0).toFixed(3)];
  out.vcolMid = [c.getX(Math.floor(c.count / 2)).toFixed(3), c.getY(Math.floor(c.count / 2)).toFixed(3), c.getZ(Math.floor(c.count / 2)).toFixed(3)];
  out.vcolLast = [c.getX(c.count - 1).toFixed(3), c.getY(c.count - 1).toFixed(3), c.getZ(c.count - 1).toFixed(3)];
  out.capVcol = [cap.geometry.attributes.color.getX(100).toFixed(3), cap.geometry.attributes.color.getY(100).toFixed(3), cap.geometry.attributes.color.getZ(100).toFixed(3)];

  // rendered pixel on the hair (upper-left of the head) and on the pajama
  await app.frame();
  const cv = app.canvas;
  const c2 = document.createElement('canvas');
  c2.width = cv.width; c2.height = cv.height;
  const ctx = c2.getContext('2d');
  ctx.drawImage(cv, 0, 0);
  const px = (x, y) => { const d = ctx.getImageData(x, y, 1, 1).data; return `${d[0]},${d[1]},${d[2]}`; };
  out.pxHairCrown = px(430, 130);
  out.pxCheek = px(390, 700);
  out.pxNeck = px(400, 820);
  out.pxArm = px(250, 480);
  out.pxIris = px(355, 600);
  out.pxShirt = px(420, 1000);
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();
