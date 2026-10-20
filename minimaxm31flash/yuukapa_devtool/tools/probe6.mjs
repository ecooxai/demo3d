import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox','--use-angle=metal','--ignore-gpu-blocklist'], defaultViewport: { width: 900, height: 1200 } });
const p = await b.newPage();
await p.goto('http://localhost:8123/?backend=webgl&res=900x1200&hud=0&anim=0', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 4500));
const out = await p.evaluate(() => {
  const app = window.__yuukapa.app;
  const THREE = app.scene.constructor;
  const res = [];
  app.scene.updateMatrixWorld(true);
  app.scene.traverse((o) => {
    if (!o.isMesh || o.name === 'rim' || o.name === 'outline') return;
    o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if (bb.min.y > 1.10 && bb.max.y < 1.42 && bb.min.x > -0.14 && bb.max.x < 0.14) {
      res.push({ name: o.name || '(unnamed)', mat: o.material.type, color: o.material.color?.getHexString(),
        x: [+bb.min.x.toFixed(3), +bb.max.x.toFixed(3)], y: [+bb.min.y.toFixed(3), +bb.max.y.toFixed(3)], z: [+bb.min.z.toFixed(3), +bb.max.z.toFixed(3)] });
    }
  });
  return res;
});
console.log(JSON.stringify(out, null, 1));
await b.close();
