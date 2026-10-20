#!/usr/bin/env node
/** Measure the reference image's key regions (skin, irises, hair, garment). */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const b64 = fs.readFileSync('assets/reference.png').toString('base64');
await page.setContent(`<img id="i" src="data:image/png;base64,${b64}">`);
await page.waitForFunction(() => document.getElementById('i').complete);

const res = await page.evaluate(() => {
  const img = document.getElementById('i');
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const W = c.width, H = c.height;
  const px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };

  const bbox = (test, x0, y0, x1, y1) => {
    let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1, n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (test(px(x, y))) { n++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
    }
    return n ? { minx, miny, maxx, maxy, w: maxx - minx, h: maxy - miny, n } : null;
  };

  const isSkin = ([r, g, b, a]) => a > 200 && r > 228 && g > 196 && b > 188 && r >= g && g >= b - 6 && (r - b) < 40;
  const isIris = ([r, g, b, a]) => a > 200 && b > 140 && r > 55 && r < 175 && g < 130 && b - r > 35;
  const isHair = ([r, g, b, a]) => a > 200 && b > 60 && b < 190 && r > 40 && r < 135 && b > r + 25 && g < 120;
  const isBlue = ([r, g, b, a]) => a > 200 && b > 200 && g > 195 && r > 160 && r < 245;

  return {
    size: [W, H],
    face: bbox(isSkin, 120, 120, 620, 520),
    irises: bbox(isIris, 150, 200, 600, 420),
    hairHead: bbox(isHair, 60, 60, 720, 560),
    hairAll: bbox(isHair, 0, 0, W, H),
    garment: bbox(isBlue, 60, 420, 700, 1300),
  };
});
console.log(JSON.stringify(res, null, 2));
await browser.close();
