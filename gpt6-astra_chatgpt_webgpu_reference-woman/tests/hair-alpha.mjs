import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
page.on('pageerror',e=>console.log('ERROR',e.message));
await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
await page.evaluate(()=>{const p=window.portrait,materials=new Set();p.model.traverse(o=>{if(o.isMesh&&o.name.startsWith('Hair')&&o.material.map)materials.add(o.material);});for(const m of materials){m.transparent=true;m.opacity=1;m.alphaTest=.008;m.alphaToCoverage=false;m.depthWrite=false;m.forceSinglePass=true;m.needsUpdate=true;}p.setScore(17,63);});
for(const v of ['front','detail','back']){await page.evaluate(v=>{window.portrait.setView(v);window.portrait.renderNow();},v);await page.waitForTimeout(600);await page.locator('#viewport-wrap').screenshot({path:'output/qa/iteration-17-alpha-'+v+'.png'});}
console.log('Smooth alpha material comparison rendered');
}finally{await browser.close();}
