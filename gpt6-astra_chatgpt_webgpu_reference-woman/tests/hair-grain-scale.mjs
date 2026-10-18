import {chromium} from 'playwright';
import path from 'node:path';

// Isolate normal-texture frequency on narrow MASS locks; crown stays unchanged.
const iteration=88;
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const [lanes,repeat]of [[192,1],[48,.25],[24,.125]]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(({iteration,repeat})=>{
    const p=window.portrait;p.setScore(iteration,76);
    const mass=p.headPivot.getObjectByName('Overlapping layered S-wave hair around front back and shoulders');
    const crown=p.headPivot.getObjectByName('Continuous parted crown with longitudinal fiber flow');
    const original=mass.material.normalMap;
    mass.material.normalMap=original.clone();mass.material.normalMap.repeat.x=repeat;
    mass.material.normalMap.needsUpdate=true;mass.material.needsUpdate=true;
    if(crown.material.normalMap!==original||crown.material.normalMap.repeat.x!==1)throw new Error('Crown normal texture changed');
    p.renderNow();
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,normalScale:mass.material.normalScale.toArray(),repeat:mass.material.normalMap.repeat.toArray(),heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },{iteration,repeat});
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['front','detail','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-grain-${iteration}-${lanes}-${view}.png`});
   }
   console.log(JSON.stringify({iteration,lanes,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
