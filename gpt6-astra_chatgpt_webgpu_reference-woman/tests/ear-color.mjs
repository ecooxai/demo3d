import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=(await readFile('src/main.js','utf8')).replace("import { applyReferenceEarColor } from './reference-ear.js';\n",'').replace('    state.referenceEar=await applyReferenceEarColor(anatomicalHead,{strength:1});\n',''),marker='detailTarget.x=.02+state.pose.shiftX;';
if(!source.includes(marker))throw new Error('Pose marker changed');
const candidate="import {applyReferenceEarColor} from './reference-ear.js';\n"+source.replace(marker,marker+"\n    state.referenceEar=await applyReferenceEarColor(anatomicalHead,{strength:Number(new URLSearchParams(location.search).get('earcolor')||0)});");
await build({stdin:{contents:candidate,resolveDir:path.resolve('src'),sourcefile:'main-ear-color-review.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-ear-color70.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const strength of [0,.5,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-ear-color70.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?earcolor=${strength}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(()=>{const p=window.portrait;p.setScore(70,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,ear:p.state.referenceEar};});
   if(!metrics.nativeWebGPU||!metrics.ear)throw new Error('Candidate initialization failed');
   for(const view of ['detail','left','right']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/ear-color-70-${Math.round(strength*100)}-${view}.png`});
   }
   console.log(JSON.stringify(metrics));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
