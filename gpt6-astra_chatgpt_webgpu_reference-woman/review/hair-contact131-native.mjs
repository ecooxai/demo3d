import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';

// A bounded first rendered study. The continuous map is monotone, but actual
// independently triangulated hair/cloth intersections need a focused check
// if the appearance warrants adoption. No production source is replaced.
const source=await readFile('src/main.js','utf8'),marker='state.balance=applyPortraitBalance(model,{shiftX:-.24});';
if(source.split(marker).length!==2||source.includes('applyHairContact131'))throw new Error('131 expected one clean pre-balance preparation point.');
const entry="import {applyHairContact131} from '../review/hair-contact-compression131.js';\n"+source.replace(marker,"state.hairContact131=applyHairContact131(model,{strength:Number(new URLSearchParams(location.search).get('compression131')||0)});\n      "+marker);
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-contact131.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-contact131.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),reports=[];
try{
 for(const strength of[0,.65,.9]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,1400));});
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-contact131.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?compression131=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});}catch(e){throw new Error(`131 initialization: ${await page.locator('#gate-message').textContent()} / ${errors.join(' / ')} / ${e.message}`);}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait,hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');p.setScore(131,77);
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,display:{mapping:p.renderer.toneMapping,exposure:p.renderer.toneMappingExposure},compression:p.state.hairContact131,guidePlacement:hair.userData.guidePlacement118.strength,triangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,resolution:[p.state.width,p.state.height],antialiasing:p.state.antialiasing,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   });
   if(!metrics.nativeWebGPU||metrics.compression.strength!==strength||metrics.guidePlacement!==.5||metrics.display.mapping!==7||metrics.display.exposure!==1.4)throw new Error('131 expected native WebGPU, accepted display and original118.5 placement.');
   const captures=[];
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);
    await page.waitForTimeout(160);const file=`output/qa/compression131-${Math.round(strength*100)}-${view}.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push(file);
   }
   const idle=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(300);
   metrics.idleFrames=await page.evaluate(before=>window.portrait.state.renderedFrames-before,idle);
   if(errors.length||metrics.idleFrames!==0)throw new Error(JSON.stringify({errors,idleFrames:metrics.idleFrames}));
   reports.push({iteration:131,strength,...metrics,captures,errors});console.log(JSON.stringify({iteration:131,strength,...metrics,captures,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/hair-contact131-native.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
