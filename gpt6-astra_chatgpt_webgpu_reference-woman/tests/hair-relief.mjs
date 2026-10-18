import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const scale of [.31,1,2]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(scale=>{const p=window.portrait;p.setScore(80,76);let changed=0;p.scene.traverse(o=>{if(o.name==='Continuous parted crown with longitudinal fiber flow'||o.name==='Overlapping layered S-wave hair around front back and shoulders'){o.material.normalScale.set(scale,.09);changed++;}});return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,changed};},scale);
   if(!metrics.nativeWebGPU||metrics.changed!==2)throw new Error('Hair normal-scale diagnostic initialization failed');
   for(const view of ['detail','front','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-relief-80-${Math.round(scale*100)}-${view}.png`});
   }
   console.log(JSON.stringify({scale,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
