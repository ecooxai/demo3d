import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const page = await browser.newPage();
await page.setViewport({width:1000,height:1300});
await page.goto('http://127.0.0.1:4173/?backend=webgl&capture=1',{waitUntil:'networkidle0'});
await page.waitForFunction(()=>document.body.dataset.ready==='true');
await new Promise(r=>setTimeout(r,800));
const picks = await page.evaluate(async () => {
  const T = window.__YUUKAPA__;
  const THREE = T.THREE;
  const raycaster = new THREE.Raycaster();
  const results = [];
  for (const [x,y] of [[0,0.22],[0,0.05],[0,-0.05],[-0.28,0.08],[0.28,0.08]]) {
    raycaster.setFromCamera(new THREE.Vector2(x,y), T.camera);
    const hits = raycaster.intersectObjects(T.scene.children, true).filter(h=>!h.object.userData?.isOutline);
    results.push({x,y,hits:hits.slice(0,6).map(h=>({name:h.object.name, mat:h.object.material?.type, color:h.object.material?.color?.getHexString?.(), map:!!h.object.material?.map, p:h.point.toArray().map(n=>+n.toFixed(2))}))});
  }
  return results;
});
console.log(JSON.stringify(picks,null,2));
await browser.close();
