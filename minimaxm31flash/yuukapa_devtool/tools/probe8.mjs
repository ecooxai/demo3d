import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox','--use-angle=metal','--ignore-gpu-blocklist'], defaultViewport: { width: 900, height: 1200 } });
const p = await b.newPage();
await p.goto('http://localhost:8123/?backend=webgl&res=900x1200&hud=0&anim=0&view=right', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 4500));
const out = await p.evaluate(() => {
  const app = window.__yuukapa.app;
  app.scene.updateMatrixWorld(true);
  const proj = (o) => {
    const w = new (app.camera.position.constructor)();
    w.setFromMatrixPosition(o.matrixWorld);
    w.project(app.camera);
    return [Math.round((w.x*0.5+0.5)*app.canvas.width), Math.round((-w.y*0.5+0.5)*app.canvas.height), +w.z.toFixed(2)];
  };
  const r = app.character.rig;
  return {
    cam: app.camera.position.toArray().map(v=>+v.toFixed(2)),
    shoulderR: proj(r.arms.R.shoulder), elbowR: proj(r.arms.R.elbow), wristR: proj(r.arms.R.wrist),
    shoulderL: proj(r.arms.L.shoulder), elbowL: proj(r.arms.L.elbow), wristL: proj(r.arms.L.wrist),
  };
});
console.log(JSON.stringify(out));
await b.close();
