import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Isolated candidate bundle: production keeps the accepted head until review.
const source=(await readFile('src/main.js','utf8')).replace("import { applyLowerCheekTaper } from './face-refinement.js';\n",'').replace("    state.cheek=applyLowerCheekTaper(anatomicalHead,{strength:.025});\n",'');
const marker='state.proportions=applyPortraitProportions(anatomicalHead,anatomicalNeck);';
if(!source.includes(marker))throw new Error('Portrait initialization marker changed');
const candidate="import {applyLowerCheekTaper} from './face-refinement.js';\n"+source.replace(marker,
 marker+"\n    state.cheek=applyLowerCheekTaper(anatomicalHead,{strength:Number(new URLSearchParams(location.search).get('cheek')||0)});");
await build({stdin:{contents:candidate,resolveDir:path.resolve('src'),sourcefile:'main-cheek-review.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-face58.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-face58.js',contentType:'text/javascript'}));
 for(const strength of [0,.025,.04]){
  await page.goto(`http://127.0.0.1:8766/?cheek=${strength}`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready);
  const metrics=await page.evaluate(()=>{
   const p=window.portrait;p.setScore(58,75);
   return {nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,cheek:p.state.cheek,skin:p.state.skinIllumination};
  });
  if(!metrics.nativeWebGPU||!metrics.cheek)throw new Error('Candidate did not initialize');
  for(const view of ['front','detail','quarter']){
   await page.evaluate(view=>{
    const p=window.portrait;p.setView(view==='quarter'?'detail':view);
    if(view==='quarter'){const t=p.controls.target;p.camera.position.set(t.x+6,t.y,t.z+Math.sqrt(133));p.camera.lookAt(t);p.controls.update();}
    p.renderNow();
   },view);
   await page.waitForTimeout(180);
   await page.locator('#viewport-wrap').screenshot({path:`output/qa/cheek-58-${Math.round(strength*1000)}-${view}.png`});
  }
  console.log(JSON.stringify(metrics));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
