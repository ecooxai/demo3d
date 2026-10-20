#!/usr/bin/env node
/** Fresh-page bisect: measures GL errors for a single visible group. */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--use-angle=metal', '--ignore-gpu-blocklist'],
  defaultViewport: { width: 600, height: 800 },
});

async function measure(setup, label) {
  const page = await browser.newPage();
  let n = 0, first = '';
  page.on('console', (m) => { const t = m.text(); if (/GL_INVALID|too many errors/.test(t)) { n++; if (!first) first = t.slice(0, 100); } });
  page.on('pageerror', (e) => { if (!first) first = 'pageerror: ' + e.message.slice(0, 100); });
  await page.goto('http://localhost:8123/?backend=webgl&res=600x800&hud=0&anim=0', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 4000));
  if (setup) await page.evaluate(setup);
  await new Promise((r) => setTimeout(r, 1200));
  console.log(`${label.padEnd(26)} errors=${String(n).padStart(4)}  ${first}`);
  await page.close();
}

await measure(null, 'baseline');
await measure(() => { window.__yuukapa.app.scene.getObjectByName('sky').visible = false; }, 'no sky');
await measure(() => { window.__yuukapa.app.scene.getObjectByName('ground').visible = false; }, 'no ground');
await measure(() => { window.__yuukapa.app.scene.getObjectByName('sky').visible = false; window.__yuukapa.app.scene.getObjectByName('ground').visible = false; }, 'no sky+ground');
await measure(() => { window.__yuukapa.app.character.rig.root.visible = false; }, 'no character');
await measure(() => {
  window.__yuukapa.app.scene.traverse((o) => { if (o.name === 'rim') o.visible = false; });
}, 'no rim');
await browser.close();
