import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Shared volumetric contact86; frozen groom82 baseline and accepted cloth81.
const iteration=86;
const hair=await readFile('review/hair-groom-candidate86.js','utf8');
const contact=await readFile('review/hair-contact-candidate86.js','utf8');
const blouse=await readFile('review/blouse-candidate81.js','utf8');
const main=await readFile('src/main.js','utf8');
const marker=main.match(/createGroomHair\(\{headShiftX:\.26,shoulderContact:[.0-9]+\}\)/)?.[0];
if(main.split(marker).length!==2)throw new Error('Expected one default groom call');
const entry=main.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:Number(new URLSearchParams(location.search).get('contact')||0)})");
const loads={hair:0,blouse:0,contact:0};
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-contact-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-hair-contact${iteration}.js`,logLevel:'silent',plugins:[{name:'hair-contact-review',setup(b){
 b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>{loads.hair++;return{contents:hair,loader:'js',resolveDir:path.resolve('src')};});
 b.onLoad({filter:/[/\\]hair-contact\.js$/},()=>{loads.contact++;return{contents:contact,loader:'js',resolveDir:path.resolve('src')};});
 b.onLoad({filter:/[/\\]blouse\.js$/},()=>{loads.blouse++;return{contents:blouse,loader:'js',resolveDir:path.resolve('src')};});
}}]});
if(loads.hair!==1||loads.blouse!==1||loads.contact!==1)throw new Error('Expected one consistent hair and cloth module');
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const mode of [0,.5,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-hair-contact${iteration}.js`,contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?contact=${mode}`,{waitUntil:'networkidle',timeout:60000});
   await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});
   const metrics=await page.evaluate(async iteration=>{
    const p=window.portrait;p.setScore(iteration,76);
    const groom=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    const queue=p.renderer.backend.device?.queue,samples=[];
    if(queue)for(let i=0;i<6;i++){await queue.onSubmittedWorkDone();const start=performance.now();p.renderNow();await queue.onSubmittedWorkDone();samples.push(performance.now()-start);}
    samples.sort((a,b)=>a-b);
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,hair:groom.userData,queueCompleteMedianMs:samples.length?samples[Math.floor(samples.length/2)]:null,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },iteration);
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['front','detail','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);
    await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-contact-${iteration}-${mode}-${view}.png`});
   }
   console.log(JSON.stringify({iteration,mode,clothSource:81,...metrics,errors}));
   if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
