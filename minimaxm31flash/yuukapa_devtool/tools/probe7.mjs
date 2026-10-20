import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox','--use-angle=metal','--ignore-gpu-blocklist'], defaultViewport: { width: 900, height: 1200 } });
const p = await b.newPage();
await p.goto('http://localhost:8123/?backend=webgl&res=900x1200&hud=0&anim=0', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 4500));
const out = await p.evaluate(() => {
  const app = window.__yuukapa.app;
  app.scene.updateMatrixWorld(true);
  const v = (o) => { const w = new (o.position.constructor)(); w.setFromMatrixPosition(o.matrixWorld); return [w.x.toFixed(3), w.y.toFixed(3), w.z.toFixed(3)]; };
  const r = app.character.rig;
  return {
    shoulderR: v(r.arms.R.shoulder), elbowR: v(r.arms.R.elbow), wristR: v(r.arms.R.wrist),
    handTipR: v(r.arms.R.hand),
    shoulderL: v(r.arms.L.shoulder), elbowL: v(r.arms.L.elbow), wristL: v(r.arms.L.wrist),
    head: v(r.headPivot), chest: v(r.chest), hips: v(r.hips),
    kneeR: v(r.legs.R.knee), ankleR: v(r.legs.R.ankle),
  };
});
console.log(JSON.stringify(out, null, 1));
await b.close();
