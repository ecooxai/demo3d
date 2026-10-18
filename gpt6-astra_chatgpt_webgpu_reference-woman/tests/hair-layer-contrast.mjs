import {chromium} from 'playwright';
import path from 'node:path';

// Review101 tests separation between the solid coverage and actual fine fibers.
// No geometry, UV, map, fringe, skin or lighting change is made.
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const coreFactor of [.70,.55]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(coreFactor=>{
    const p=window.portrait,changes=[];
    for(const name of ['Continuous parted crown with longitudinal fiber flow','Overlapping layered S-wave hair around front back and shoulders','Independent fine crown lengths and silhouette strands']){
     const mesh=p.headPivot.getObjectByName(name);if(!mesh)throw new Error('Missing hair layer '+name);
     const fine=name.startsWith('Independent'),color=mesh.geometry.attributes.color,m=mesh.material,factor=fine?1.30:coreFactor;
     let minimum=Infinity,maximum=-Infinity;
     for(let i=0;i<color.count;i++)for(let ch=0;ch<3;ch++){
      const at=i*color.itemSize+ch,value=color.array[at]*factor;
      if(!Number.isFinite(value)||value<0||value>1)throw new Error('Hair color out of range');
      color.array[at]=value;minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);
     }
     color.needsUpdate=true;
     if(!fine){m.roughness=.60;m.specularIntensity=.17;m.envMapIntensity=.25;}
     changes.push({name,factor,minimum,maximum,roughness:m.roughness,specularIntensity:m.specularIntensity,envMapIntensity:m.envMapIntensity});
    }
    p.setScore(101,76);p.renderNow();return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,changes};
   },coreFactor);
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['front','detail','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-layer-contrast-101-${Math.round(coreFactor*100)}-${view}.png`});
   }
   console.log(JSON.stringify({iteration:101,coreFactor,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
