import {chromium} from 'playwright';
import path from 'node:path';

const browser=await chromium.launch({
  executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']
});
try{
  for(const variant of ['baseline','atlas','soft']){
    const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.portrait?.ready);
    const metrics=await page.evaluate(variant=>{
      const p=window.portrait,brow=p.model.getObjectByName('tapered-brow-hairs');
      if(!brow)throw new Error('Expected existing three-dimensional brow fibers');
      if(variant==='atlas')brow.visible=false;
      if(variant==='soft'){
        const original=brow.material.color.clone();
        brow.material.color.set('#b49589').lerp(original,.45);
      }
      p.setScore(92,76);
      return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,visible:brow.visible,color:brow.material.color.getHexString(),vertices:brow.geometry.attributes.position.count};
    },variant);
    if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
    for(const view of ['front','detail']){
      await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);
      await page.waitForTimeout(160);
      await page.locator('#viewport-wrap').screenshot({path:`output/qa/eyebrow-92-${variant}-${view}.png`});
    }
    console.log(JSON.stringify({iteration:92,variant,...metrics,errors}));
    await page.close();
    if(errors.length)throw new Error(JSON.stringify(errors));
  }
}finally{await browser.close();}
