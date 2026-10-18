import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';

// The newly integrated dual-UV atlas must survive explicit renderer changes
// without a second bake or a repeated model deformation.
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const report={iteration:112,score:76,checks:[],errors:[]};
async function snapshot(page,label){
 const r=await page.evaluate(async()=>{
  const p=window.portrait,c=p.model.getObjectByName('Continuous parted crown with longitudinal fiber flow');
  const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength)))).map(x=>x.toString(16).padStart(2,'0')).join('');
  return{backend:p.state.backend,nativeWebGPU:p.renderer.backend?.isWebGPUBackend===true,isWebGL:p.renderer.isWebGLRenderer===true,
   map:[c.material.map.image.width,c.material.map.image.height,c.material.map.channel],coverage:[c.material.alphaMap.image.width,c.material.alphaMap.image.height,c.material.alphaMap.channel],
   hashes:await Promise.all([c.geometry.attributes.position.array,c.geometry.attributes.color.array,c.geometry.attributes.uv.array,c.geometry.attributes.uv1.array,c.material.map.image.data,c.material.alphaMap.image.data].map(digest)),
   sameBake:p.state.referenceCrown===window.__backend112Bake,ready:p.ready};
 });
 assert.equal(r.ready,true,JSON.stringify({label,gate:await page.locator('#gate-message').textContent(),errors:report.errors}));assert.deepEqual(r.map,[2048,2048,1]);assert.deepEqual(r.coverage,[512,1024,0]);
 report.checks.push({label,...r});return r;
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.evaluate(()=>{window.__backend112Bake=window.portrait.state.referenceCrown;});
 const first=await snapshot(page,'initial-webgpu');assert.equal(first.nativeWebGPU,true);
 await page.evaluate(async()=>{await window.portrait.initialize('webgl');window.portrait.setView('detail');window.portrait.renderNow();});
 const gl=await snapshot(page,'explicit-webgl');assert.equal(gl.isWebGL,true);assert.equal(gl.sameBake,true);assert.deepEqual(gl.hashes,first.hashes);
 await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:'output/qa/integrated112-explicit-webgl-detail.png'});
 await page.evaluate(async()=>{await window.portrait.initialize('webgpu');window.portrait.setView('detail');window.portrait.renderNow();});
 const again=await snapshot(page,'explicit-return-webgpu');assert.equal(again.nativeWebGPU,true);assert.equal(again.sameBake,true);assert.deepEqual(again.hashes,first.hashes);
 await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:'output/qa/integrated112-return-webgpu-detail.png'});
 await page.close();
 const context=await browser.newContext({viewport:{width:900,height:1200}});
 await context.addInitScript(()=>Object.defineProperty(navigator,'gpu',{get:()=>undefined,configurable:true}));
 const gated=await context.newPage();gated.on('pageerror',e=>report.errors.push(e.message));
 await gated.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await gated.locator('#backend-gate').waitFor({state:'visible'});
 assert.equal(await gated.evaluate(()=>window.portrait.ready),false);assert.equal(await gated.locator('canvas').count(),0);
 await gated.evaluate(()=>{window.__backend112Bake=window.portrait.state.referenceCrown;});
 await gated.click('#choose-webgl');await gated.waitForFunction(()=>window.portrait.ready);
 const chosen=await snapshot(gated,'missing-webgpu-explicit-choice');assert.equal(chosen.isWebGL,true);assert.equal(chosen.sameBake,true);assert.deepEqual(chosen.hashes,first.hashes);
 await context.close();assert.deepEqual(report.errors,[]);report.result='passed';
 await writeFile('output/qa/crown100-backend-native.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({result:report.result,iteration:112,score:76,checks:report.checks.map(x=>({label:x.label,backend:x.backend,sameBake:x.sameBake})),hashesUnchanged:true,noAutomaticFallback:true,errors:report.errors}));
}finally{await browser.close();}

