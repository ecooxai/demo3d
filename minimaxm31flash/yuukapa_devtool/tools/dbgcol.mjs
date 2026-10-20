import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox','--use-angle=metal','--ignore-gpu-blocklist'], defaultViewport: { width: 900, height: 1200 } });
const p = await b.newPage();
await p.goto('http://localhost:8123/?backend=webgl&res=900x1200&hud=0&anim=0&view=front', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 4500));
await p.evaluate(() => {
  const app = window.__yuukapa.app;
  app.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name === 'neckline') o.material = new (o.material.constructor)({ color: 0xff0000, gradientMap: o.material.gradientMap });
    if (o.name === 'collarFlap') o.material = new (o.material.constructor)({ color: 0x00ff00, gradientMap: o.material.gradientMap });
  });
  app.frame();
});
await new Promise(r => setTimeout(r, 1200));
await p.screenshot({ path: 'review/dbg-colors.png', clip: { x: 300, y: 240, width: 320, height: 320 } });
await b.close();
console.log('ok');
