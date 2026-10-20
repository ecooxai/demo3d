import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const page = await browser.newPage();
await page.setViewport({width:1000,height:1300});
await page.goto('http://127.0.0.1:4173/?backend=webgl&capture=1',{waitUntil:'networkidle0'});
await page.waitForFunction(()=>document.body.dataset.ready==='true');
await new Promise(r=>setTimeout(r,500));
await page.evaluate(()=>{window.__YUUKAPA__.camera.position.set(0.3,7.0,8.5);window.__YUUKAPA__.controls.target.set(0,6.95,0.3);window.__YUUKAPA__.controls.update();});
await new Promise(r=>setTimeout(r,400));
const report = await page.evaluate(() => {
 const T=window.__YUUKAPA__; const out={head:null,hair:[]};
 T.character.root.traverse(o=>{
  if(o.isMesh && o.material?.color?.getHexString?.()==='f8d9d4') out.head={name:o.name,cast:o.castShadow,receive:o.receiveShadow,side:o.material.side, scale:o.scale.toArray()};
  if(o.isMesh && o.material?.color?.getHexString?.()==='3a2b73') out.hair.push({cast:o.castShadow,receive:o.receiveShadow});
 });
 return out;
});
console.log(JSON.stringify(report,null,2));
// hide hair meshes
await page.evaluate(()=>{
 const T=window.__YUUKAPA__;
 T.character.root.traverse(o=>{ if(o.isMesh && ['3a2b73','271b52','978add','c9c2ff'].includes(o.material?.color?.getHexString?.())) o.visible=false; });
});
await new Promise(r=>setTimeout(r,400));
let data=await page.evaluate(()=>document.querySelector('#scene').toDataURL('image/png'));fs.writeFileSync('output/iteration-001/face-no-hair.png',Buffer.from(data.split(',')[1],'base64'));
// disable shadows entirely
await page.evaluate(()=>{window.__YUUKAPA__.renderer.shadowMap.enabled=false;window.__YUUKAPA__.scene.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});});
await new Promise(r=>setTimeout(r,400));
data=await page.evaluate(()=>document.querySelector('#scene').toDataURL('image/png'));fs.writeFileSync('output/iteration-001/face-no-shadow.png',Buffer.from(data.split(',')[1],'base64'));
await browser.close();
