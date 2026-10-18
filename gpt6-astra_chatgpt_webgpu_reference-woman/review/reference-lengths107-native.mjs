import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Isolated native review: live accepted main/groom, before the common balance
// operation. Only long-lock RGB texture/color compensation is added.
const iteration=107,marker='state.balance=applyPortraitBalance(model,';
let source=await readFile('src/main.js','utf8');
if(!source.includes('applyReferenceCrownMicrocontrast100')){
 const crownMarker='detailTarget.x=.02+state.pose.shiftX;';
 if(source.split(crownMarker).length!==2)throw new Error('Expected one accepted crown texture marker');
 source="import {applyReferenceCrownMicrocontrast100} from '../review/reference-crown-candidate100.js';\n"+source.replace(crownMarker,"state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});\n    "+crownMarker);
}
if(source.split(marker).length!==2)throw new Error('Expected one accepted pre-balance marker');
const entry="import {applyReferenceLengthsMicrocontrast107} from '../review/reference-lengths-candidate107.js';\n"+source.replace(marker,"state.referenceLengths=await applyReferenceLengthsMicrocontrast107(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('lengthscontrast')||0)});\n    "+marker);
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-reference-lengths107.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-reference-lengths107.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const strength of [0,.5,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-reference-lengths107.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?lengthscontrast=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:45000});}
   catch(error){throw new Error(`Candidate 107 did not initialize: ${await page.locator('#gate-message').textContent()} / ${error.message}`);}
   const metrics=await page.evaluate(({iteration,strength})=>{
    const p=window.portrait;p.setScore(iteration,76);
    const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),mass=hair.getObjectByName('Overlapping layered S-wave hair around front back and shoulders');
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,strength,microcontrast:hair.userData.referenceLengthsMicrocontrast||{strength:0,status:'baseline'},hairTriangles:hair.userData.triangles,massVertices:mass.geometry.attributes.position.count,colorTexCoord:mass.material.map.channel??0,normalTexCoord:mass.material.normalMap.channel??0,hasSeparateAlpha:!!mass.material.alphaMap,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },{iteration,strength});
   if(!metrics.nativeWebGPU)throw new Error('Candidate 107 requires native WebGPU');
   for(const view of ['front','detail','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/reference-lengths-107-${Math.round(strength*100)}-${view}.png`});
   }
   console.log(JSON.stringify({iteration,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
