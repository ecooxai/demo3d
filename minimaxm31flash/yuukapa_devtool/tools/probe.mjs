#!/usr/bin/env node
/** Probe: does positionNode + normalLocal actually expand geometry? */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 600, height: 800 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 200)); });
await page.goto('http://localhost:8123/?backend=webgl&res=600x800&hud=0', { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 4000));

const res = await page.evaluate(async () => {
  const app = window.__yuukapa.app;
  const THREE = app.scene.constructor === Object ? null : null;
  const out = {};
  // find the shirt mesh and inspect its outline child
  let shirt = null;
  app.scene.traverse((o) => { if (o.name === 'shirt') shirt = o; });
  const shell = shirt?.children.find((c) => c.name === 'outline');
  out.hasShell = !!shell;
  out.shellVisible = shell?.visible;
  out.shellMat = shell?.material?.type;
  out.posNode = !!shell?.material?.positionNode;
  // bounding boxes
  const bb = (m) => { m.geometry.computeBoundingBox(); return m.geometry.boundingBox; };
  out.shirtBB = bb(shirt);
  out.shellBB = bb(shell);
  // does the normal attribute exist?
  out.hasNormal = !!shirt.geometry.attributes.normal;
  out.normalCount = shirt.geometry.attributes.normal?.count;
  return out;
});
console.log(JSON.stringify(res, null, 2));
await browser.close();
