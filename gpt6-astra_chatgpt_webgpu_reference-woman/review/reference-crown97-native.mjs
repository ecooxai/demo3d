import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Run from the project root on the native Mac. Uses the live accepted groom;
// only a late, posed crown color bake is injected into this isolated bundle.
const iteration=97,source=await readFile('src/main.js','utf8');
const marker='detailTarget.x=.02+state.pose.shiftX;';
if(source.split(marker).length!==2)throw new Error('Expected one accepted post-pose marker');
const entry="import {applyReferenceCrownMicrocontrast97} from '../review/reference-crown-candidate97.js';\n"+source.replace(marker,"state.referenceCrown=await applyReferenceCrownMicrocontrast97(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('crowncontrast')||0)});\n    "+marker);
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown-microcontrast97.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-reference-crown97.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const strength of [0,.5,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-reference-crown97.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?crowncontrast=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:45000});}
   catch(error){throw new Error(`Candidate 97 did not initialize: ${await page.locator('#gate-message').textContent()} / ${error.message}`);}
   const metrics=await page.evaluate(({iteration,strength})=>{
    const p=window.portrait;p.setScore(iteration,76);
    const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow');
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,strength,microcontrast:hair.userData.referenceCrownMicrocontrast||{strength:0,status:'baseline'},hairTriangles:hair.userData.triangles,crownVertices:crown.geometry.attributes.position.count,colorTexCoord:crown.material.map.channel??0,normalTexCoord:crown.material.normalMap.channel??0,coverageTexCoord:crown.material.alphaMap?.channel??null,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },{iteration,strength});
   if(!metrics.nativeWebGPU)throw new Error('Candidate 97 requires native WebGPU');
   for(const view of ['front','detail','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/reference-crown-97-${Math.round(strength*100)}-${view}.png`});
   }
   console.log(JSON.stringify({iteration,...metrics,errors}));
   if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
