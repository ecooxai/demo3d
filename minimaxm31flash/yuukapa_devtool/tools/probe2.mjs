#!/usr/bin/env node
/** Probe 2: is positionNode applied, and is normalLocal non-zero in the vertex stage? */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 600, height: 800 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('http://localhost:8123/?backend=webgl&res=600x800&hud=0', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 4000));

// read back the pixel colour at the character's chest with three different shells
const probe = await page.evaluate(async () => {
  const app = window.__yuukapa.app;
  const canvas = app.canvas;
  const gl = app.renderer.backend?.gl;
  const out = {};

  const sample = async (label) => {
    await app.frame();
    const c = document.createElement('canvas');
    c.width = canvas.width; c.height = canvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    const px = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height * 0.45), 1, 1).data;
    out[label] = [px[0], px[1], px[2]];
  };

  // 1. as-is
  await sample('current');

  // 2. constant offset positionNode
  const TSL = await import('/vendor/three/three.tsl.js');
  let shell = null;
  app.scene.traverse((o) => { if (o.name === 'outline' && !shell) shell = o; });
  shell.material.positionNode = TSL.positionLocal.add(TSL.vec3(0, 0.05, 0));
  shell.material.needsUpdate = true;
  await sample('constOffset');

  // 3. normal-based with big thickness
  shell.material.positionNode = TSL.positionLocal.add(TSL.normalLocal.mul(0.05));
  shell.material.needsUpdate = true;
  await sample('normalOffset');
  return out;
});
console.log(JSON.stringify(probe, null, 2));
await browser.close();
