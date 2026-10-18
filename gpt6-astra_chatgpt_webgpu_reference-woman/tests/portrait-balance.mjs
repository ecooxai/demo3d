import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Native review99 uses the accepted102 width/contact and ear colors before
// moving the connected assembly; skin illumination is evaluated afterward.
const source=(await readFile('src/main.js','utf8')).replace("from './portrait-balance.js'","from '../review/portrait-balance-candidate99.js'");
const marker='state.balance=applyPortraitBalance(model,{shiftX:-.24});';
if(source.split(marker).length!==2)throw new Error('Expected one accepted balance application');
const entry=source.replace(marker,"state.balance=applyPortraitBalance(model,{shiftX:Number(new URLSearchParams(location.search).get('balance')||0)});");
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-balance99.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-portrait-balance99.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const shiftX of [0,-.12,-.24]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-portrait-balance99.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?balance=${shiftX}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:45000});}
   catch(e){throw new Error(`${await page.locator('#gate-message').textContent()} / ${e.message}`);}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait;p.setScore(99,76);
    const m=p.state.balance;let finite=true;
    p.model.traverse(o=>{if(o.isMesh)for(const key of ['position','normal'])for(const x of o.geometry.attributes[key].array)finite&&=Number.isFinite(x);});
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,finite,balance:m,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   });
   if(!metrics.nativeWebGPU||!metrics.finite)throw new Error('Native finite geometry required');
   for(const view of ['front','detail','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/portrait-balance-99-${Math.round(-shiftX*100)}-${view}.png`});
   }
   console.log(JSON.stringify({iteration:99,shiftX,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
