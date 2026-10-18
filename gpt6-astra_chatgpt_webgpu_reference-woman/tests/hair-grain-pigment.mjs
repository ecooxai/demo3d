import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const iteration=89;
const source=await readFile('src/main.js','utf8');
const marker='const skinReady=';
if(source.split(marker).length!==2)throw new Error('Expected one skin-ready declaration');
const entry="import {applyOriginalHairGrain} from '../review/hair-grain-candidate89.js';\n"+source.replace(marker,"applyOriginalHairGrain(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('grain')||0)});\n"+marker);
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-grain-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-hair-grain${iteration}.js`,logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const strength of [0,.45,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-hair-grain${iteration}.js`,contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?grain=${strength}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(iteration=>{
    const p=window.portrait;p.setScore(iteration,76);const groom=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,pigment:groom.userData.originalStrandPigment||null,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },iteration);
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['front','detail','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-pigment-${iteration}-${Math.round(strength*100)}-${view}.png`});
   }
   console.log(JSON.stringify({iteration,strength,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
