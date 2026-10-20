import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true,
  args: ['--no-sandbox','--use-angle=metal','--ignore-gpu-blocklist'], defaultViewport: {width:600,height:800} });
const page = await browser.newPage();
await page.goto('http://localhost:8123/?backend=webgl&res=600x800&hud=0', { waitUntil: 'domcontentloaded' });
await new Promise(r=>setTimeout(r,4000));
const res = await page.evaluate(() => {
  const app = window.__yuukapa.app;
  const out = {};
  const find = (n) => { let m=null; app.scene.traverse(o=>{ if(o.name===n && !m) m=o; }); return m; };
  for (const n of ['shin','upperArm','fore','skull']) {
    const m = find(n);
    if (!m) { out[n]='missing'; continue; }
    const shell = m.children.find(c=>c.name==='outline');
    const sp = m.geometry.attributes.position, shp = shell?.geometry.attributes.position;
    let maxd = 0;
    for (let i=0;i<sp.count;i++){
      const d = Math.hypot(shp.getX(i)-sp.getX(i), shp.getY(i)-sp.getY(i), shp.getZ(i)-sp.getZ(i));
      if (d>maxd) maxd=d;
    }
    out[n] = { verts: sp.count, shellVerts: shp?.count, maxDelta: +maxd.toFixed(5), side: shell?.material.side, depthWrite: shell?.material.depthWrite, renderOrder: shell?.renderOrder, po: shell?.material.polygonOffset };
  }
  return out;
});
console.log(JSON.stringify(res,null,2));
await browser.close();
