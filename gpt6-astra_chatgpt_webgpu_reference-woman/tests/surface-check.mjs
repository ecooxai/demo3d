import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.evaluate(()=>{const p=window.portrait;p.model.traverse(o=>{if(o.name.includes('wispy fringe'))o.visible=false;});p.setView('left');p.renderNow();});
 await page.waitForTimeout(300);await page.locator('#viewport-wrap').screenshot({path:'output/qa/no-fringe-left.png'});
 await page.evaluate(()=>{const p=window.portrait;p.model.traverse(o=>{if(o.name.includes('wispy fringe'))o.visible=true;if(o.isMesh&&o.name.startsWith('Hair'))o.visible=false;});p.setView('front');p.renderNow();});
 await page.waitForTimeout(300);await page.locator('#viewport-wrap').screenshot({path:'output/qa/garment-current.png'});
 const changed=await page.evaluate(()=>{const p=window.portrait,mats=new Set(),names=[];p.model.traverse(o=>{if(o.isMesh&&!o.name.startsWith('Hair')){const a=Array.isArray(o.material)?o.material:[o.material];for(const m of a)if(m.color.r>.55&&m.color.g>.55&&m.color.b>.55&&!m.map){mats.add(m);names.push(o.name);}}});for(const m of mats){m.color.multiplyScalar(1.28);m.needsUpdate=true;}p.renderNow();return names;});
 await page.waitForTimeout(300);await page.locator('#viewport-wrap').screenshot({path:'output/qa/garment-white.png'});
 console.log(JSON.stringify({whitenedMeshes:changed}));
}finally{await browser.close();}
