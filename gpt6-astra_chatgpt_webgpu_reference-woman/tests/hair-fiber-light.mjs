import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const mode of ['baseline','soft','bright']){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(mode=>{const p=window.portrait;p.setScore(82,76);const mesh=p.scene.getObjectByName('Independent fine crown lengths and silhouette strands');if(!mesh)throw new Error('Fine hair missing');const m=mesh.material;if(mode==='soft'){m.roughness=.45;m.specularIntensity=.55;m.envMapIntensity=.55;m.anisotropy=.75;}if(mode==='bright'){m.roughness=.38;m.specularIntensity=.75;m.envMapIntensity=.65;m.anisotropy=.80;}return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,roughness:m.roughness,specularIntensity:m.specularIntensity,envMapIntensity:m.envMapIntensity,anisotropy:m.anisotropy};},mode);
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['detail','front','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-fiber-light-82-${mode}-${view}.png`});
   }
   console.log(JSON.stringify({mode,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
