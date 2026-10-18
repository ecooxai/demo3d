import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 for(const side of ['left','right']){
  await page.evaluate(side=>{
   const p=window.portrait;for(const o of p.headPivot.children)if(o.name!=='anatomical-head')o.visible=false;p.setView('detail');
   const ear=p.headPivot.getObjectByName(side+'-ear').children[0],center=ear.geometry.boundingBox.getCenter(p.camera.position.clone());ear.localToWorld(center);
   p.controls.target.copy(center);p.camera.position.copy(center).add(center.clone().set(side==='left'?-1.2:1.2,0,5));p.camera.zoom=2.2;p.camera.updateProjectionMatrix();p.camera.lookAt(center);p.controls.update();p.renderNow();
  },side);
  await page.waitForTimeout(200);await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-45-ear-${side}-isolated.png`});
 }
 console.log(JSON.stringify({nativeWebGPU:await page.evaluate(()=>window.portrait.renderer.backend.isWebGPUBackend===true)}));
} finally {await browser.close();}
