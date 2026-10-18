import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 for(const variant of ['baseline','no-environment','no-cornea','lower-refraction']) {
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const data=await page.evaluate(variant=>{
   const p=window.portrait,materials=[];p.setScore(34,70);
   p.headPivot.traverse(o=>{
    if(o.name!=='transparent-corneal-dome')return;
    if(variant==='no-environment')o.material.envMapIntensity=0;
    if(variant==='no-cornea')o.visible=false;
    if(variant==='lower-refraction'){o.material.ior=1.1;o.material.thickness=.003;}
    o.material.needsUpdate=true;
    materials.push({ior:o.material.ior,thickness:o.material.thickness,environment:o.material.envMapIntensity,visible:o.visible});
   });
   p.setView('detail');p.renderNow();
   return {variant,materials,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true};
  },variant);
  await page.waitForTimeout(250);
  await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-34-${variant}-detail.png`});
  await page.evaluate(()=>{const p=window.portrait;p.camera.position.copy(p.controls.target).add(p.camera.position.clone().set(13,0,3));p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();});
  await page.waitForTimeout(250);
  await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-34-${variant}-oblique.png`});
  console.log(JSON.stringify(data));
 }
} finally { await browser.close(); }
