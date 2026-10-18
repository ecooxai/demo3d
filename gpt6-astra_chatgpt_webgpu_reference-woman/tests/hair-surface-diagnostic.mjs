import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 for(const variant of ['baseline','without-mass','without-detail','without-crown']) {
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const info=await page.evaluate(variant=>{
   const p=window.portrait,hidden=[];
   p.headPivot.traverse(o=>{
    if((variant==='without-mass'&&o.name.startsWith('Overlapping layered'))||(variant==='without-detail'&&o.name.startsWith('Independent fine'))||(variant==='without-crown'&&o.name.startsWith('Continuous parted'))){o.visible=false;hidden.push(o.name);}
   });
   p.setView('detail');p.renderNow();return {variant,hidden,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true};
  },variant);
  await page.waitForTimeout(200);await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-surface-42-${variant}.png`});console.log(JSON.stringify(info));
 }
} finally {await browser.close();}
