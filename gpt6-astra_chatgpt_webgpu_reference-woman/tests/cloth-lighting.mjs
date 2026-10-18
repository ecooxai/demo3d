import { chromium } from 'playwright';
import path from 'node:path';

const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 for(const variant of ['baseline','cotton-albedo','window']) {
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  await page.evaluate(variant=>{
   const p=window.portrait;p.setScore(44,71);
   if(variant!=='baseline'){
    const seen=new Set();p.model.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(!seen.has(m)&&['blouse-cotton','blouse-collar-poplin','blouse-cotton-placket','blouse-ivory-stitching'].includes(m.name)){seen.add(m);m.color.multiplyScalar(1/1.28);}});
   }
   if(variant==='window'){
    const ambient=p.scene.children.find(o=>o.isAmbientLight),[key,fill,rim]=p.scene.children.filter(o=>o.isDirectionalLight);
    ambient.intensity=.65;key.intensity=1.8;key.position.set(-5,6.5,6);fill.intensity=.55;rim.intensity=.60;p.scene.environmentIntensity=.45;
   }
   p.setView('front');p.renderNow();
  },variant);
  await page.waitForTimeout(250);await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-44-${variant}-front.png`});
  await page.evaluate(()=>{
   const p=window.portrait;p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();
  });
  await page.waitForTimeout(250);await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-44-${variant}-garment.png`});
  console.log(JSON.stringify({variant}));
 }
} finally {await browser.close();}
