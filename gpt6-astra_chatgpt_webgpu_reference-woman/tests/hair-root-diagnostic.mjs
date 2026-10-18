import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const variant of ['baseline','mass-no-shadow','mass-crown-no-shadow','mass-flat-color']) {
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const info=await page.evaluate(variant=>{
   const p=window.portrait,changed=[];
   p.headPivot.traverse(o=>{
    const mass=o.name.startsWith('Overlapping layered'),crown=o.name.startsWith('Continuous parted');
    if((mass&&variant.includes('no-shadow'))||(crown&&variant==='mass-crown-no-shadow')){o.castShadow=false;changed.push(o.name+' shadow off');}
    if(mass&&variant==='mass-flat-color'){
     const c=o.material.color.clone().set('#50413e'),a=o.geometry.attributes.color;
     for(let i=0;i<a.count;i++)a.setXYZ(i,c.r,c.g,c.b);a.needsUpdate=true;changed.push(o.name+' color uniform');
    }
   });
   p.renderer.shadowMap.needsUpdate=true;
   return {variant,changed,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,proportions:p.state.proportions};
  },variant);
  for(const view of ['detail','right']){
   await page.evaluate(v=>{window.portrait.setView(v);window.portrait.renderNow();},view);await page.waitForTimeout(200);
   await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-root-51-${variant}-${view}.png`});
  }
  console.log(JSON.stringify(info));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
} finally {await browser.close();}
