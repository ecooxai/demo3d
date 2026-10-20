import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const page = await browser.newPage();
await page.setViewport({width:900,height:1200});
await page.goto('http://127.0.0.1:4173/?backend=webgl&capture=1',{waitUntil:'networkidle0'});
await page.waitForFunction(()=>document.body.dataset.ready==='true');
await new Promise(r=>setTimeout(r,700));
await page.evaluate(()=>window.__YUUKAPA__.setView('back'));
await new Promise(r=>setTimeout(r,1200));
const report = await page.evaluate(() => {
 const T=window.__YUUKAPA__; const meshes=[];
 T.character.root.traverse(o=>{ if(o.isMesh) meshes.push({name:o.name, mat:o.material?.color?.getHexString?.(), pos:o.position.toArray().map(n=>+n.toFixed(2)), geo:o.geometry?.attributes?.position?.count, vis:o.visible}); });
 return {meshes, camera:T.camera.position.toArray()};
});
console.log(JSON.stringify(report,null,2));
let data=await page.evaluate(()=>document.querySelector('#scene').toDataURL('image/png'));fs.writeFileSync('output/iteration-001/back-debug.png',Buffer.from(data.split(',')[1],'base64'));
// hide back locks other than cape: hide all hair meshes except cape? identify by material 4a3894 and geometry counts
await page.evaluate(()=>{
 const T=window.__YUUKAPA__; const list=[];
 T.character.root.traverse(o=>{ if(o.isMesh && o.material?.color?.getHexString?.()==='4a3894') list.push(o); });
 console.log('sheet count', list.length);
 // highlight sheets red
 list.forEach((o,i)=>{ o.material=o.material.clone(); o.material.color.set(i===0?0xff0000:0x00ff00); o.material.emissive?.set(0x444444); });
});
await new Promise(r=>setTimeout(r,300));
data=await page.evaluate(()=>document.querySelector('#scene').toDataURL('image/png'));fs.writeFileSync('output/iteration-001/back-sheets-red.png',Buffer.from(data.split(',')[1],'base64'));
await browser.close();
