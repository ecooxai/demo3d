import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=await readFile('src/main.js','utf8');
const marker='detailTarget.x=.02+state.pose.shiftX;';
if(!source.includes(marker))throw new Error('Portrait pose initialization marker changed');
const candidate="import {applyReferenceHairColor} from '../review/reference-hair-candidate63.js';\n"+source.replace(marker,
 marker+"\n    state.referenceHair=await applyReferenceHairColor(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('haircolor')||0)});");
await build({stdin:{contents:candidate,resolveDir:path.resolve('src'),sourcefile:'main-hair-color-review.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-hair-color68.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-hair-color68.js',contentType:'text/javascript'}));
 for(const strength of [0,.5,1]){
  await page.goto(`http://127.0.0.1:8766/?haircolor=${strength}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const metrics=await page.evaluate(()=>{const p=window.portrait;p.setScore(68,76);return {nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,hair:p.state.referenceHair};});
  if(!metrics.nativeWebGPU||!metrics.hair)throw new Error('Candidate did not initialize');
  for(const view of ['front','detail','right','back']){
   await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);
   await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-color-68-${Math.round(strength*100)}-${view}.png`});
  }
  console.log(JSON.stringify(metrics));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
