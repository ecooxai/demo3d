import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>console.log('ERROR',e.message));
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready);
  for(const variant of ['diffuse','core','depth']) {
    await page.evaluate(variant=>{
      const p=window.portrait;
      p.model.traverse(o=>{
        if(!o.isMesh||!o.name.startsWith('Hair'))return;
        const mats=Array.isArray(o.material)?o.material:[o.material];
        for(const m of mats){m.roughness=1;m.specularIntensity=0;m.anisotropy=0;m.clearcoat=0;m.needsUpdate=true;}
        o.visible=variant!=='core'||o.name.includes('core');
        if(variant==='depth')for(const m of mats)if(m.map){m.transparent=false;m.alphaTest=.06;m.depthWrite=true;m.alphaToCoverage=true;m.needsUpdate=true;}
      });
      p.setView('back');p.renderNow();
    },variant);
    await page.waitForTimeout(400);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-diagnostic-${variant}.png`});
  }
  console.log('Hair diffuse/core/depth diagnostics complete');
} finally { await browser.close(); }
