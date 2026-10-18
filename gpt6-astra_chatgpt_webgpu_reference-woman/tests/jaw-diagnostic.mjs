import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 for(const variant of ['hair-hidden','uniform-lit','unlit-atlas']) {
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  await page.evaluate(variant=>{
   const p=window.portrait;
   for(const o of p.headPivot.children)if(o.name!=='anatomical-head')o.visible=false;
   if(variant!=='hair-hidden'){
    const seen=new Set();
    p.headPivot.getObjectByName('anatomical-head').traverse(o=>{
     if(!o.isMesh||!['continuous-face','sculpted-eyelids'].includes(o.name))return;
     for(const m of Array.isArray(o.material)?o.material:[o.material])if(!seen.has(m)){
      seen.add(m);
      if(variant==='uniform-lit'){m.map=null;m.emissiveMap=null;m.emissiveIntensity=0;m.color.set('#e8bfae');m.vertexColors=false;}
      if(variant==='unlit-atlas'&&m.map){m.emissiveMap=m.map;m.emissive.set('#ffffff');m.emissiveIntensity=1;m.map=null;m.color.set('#000000');m.specularIntensity=0;m.sheen=0;}
      m.needsUpdate=true;
     }
    });
   }
   p.setView('detail');p.camera.position.copy(p.controls.target).add(p.camera.position.clone().set(13,0,3));p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();
  },variant);
  await page.waitForTimeout(250);
  await page.locator('#viewport-wrap').screenshot({path:`output/qa/jaw-${variant}.png`});
  console.log(JSON.stringify({variant}));
 }
} finally {await browser.close();}
