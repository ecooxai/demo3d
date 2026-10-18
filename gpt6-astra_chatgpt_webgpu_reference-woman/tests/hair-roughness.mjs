import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

const source=await readFile('src/main.js','utf8'),marker='detailTarget.x=.02+state.pose.shiftX;';
if(source.split(marker).length!==2)throw new Error('Expected one pre-balance texture marker');
const entry="import {applyReferenceCrownMicrocontrast100} from '../review/reference-crown-candidate100.js';\nimport {applyHairRoughness103} from '../review/hair-roughness-candidate103.js';\n"+source.replace(marker,"state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});state.roughness103=applyHairRoughness103(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('roughness')||0)});\n    "+marker);
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-roughness103.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-hair-roughness103.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const strength of [0,.6,1.2]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-hair-roughness103.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?roughness=${strength}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(()=>{const p=window.portrait;p.setScore(103,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,roughness:p.state.roughness103,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};});
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['front','detail','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-roughness-103-${Math.round(strength*100)}-${view}.png`});
   }
   console.log(JSON.stringify({iteration:103,strength,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
