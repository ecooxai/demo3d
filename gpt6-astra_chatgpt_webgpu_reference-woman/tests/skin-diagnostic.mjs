import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.evaluate(()=>{
  const p=window.portrait;p.setView('detail');p.scene.children.find(o=>o.isDirectionalLight).castShadow=false;p.renderNow();
 });
 await page.waitForTimeout(300);await page.locator('#viewport-wrap').screenshot({path:'output/qa/skin-no-cast-shadow.png'});
 await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.evaluate(()=>{
  const p=window.portrait;p.setView('detail');
  p.headPivot.traverse(o=>{
   if(o.name==='transparent-corneal-dome'){o.material.specularIntensity=.25;o.material.envMapIntensity=.20;o.material.needsUpdate=true;}
  });p.renderNow();
 });
 await page.waitForTimeout(300);await page.locator('#viewport-wrap').screenshot({path:'output/qa/skin-muted-cornea.png'});
 await page.evaluate(()=>{
  const p=window.portrait,seen=new Set();
  p.headPivot.traverse(o=>{
   if(!o.isMesh||!['continuous-face','sculpted-eyelids'].includes(o.name))return;
   for(const m of Array.isArray(o.material)?o.material:[o.material])if(!seen.has(m)){
    seen.add(m);m.map=null;m.vertexColors=false;m.color.set('#e8bda9');m.needsUpdate=true;
   }
  });p.renderNow();
 });
 await page.waitForTimeout(300);await page.locator('#viewport-wrap').screenshot({path:'output/qa/skin-uniform-albedo.png'});
 console.log('Completed no-shadow, muted-cornea and uniform-albedo diagnostics on the same head.');
}finally{await browser.close();}
