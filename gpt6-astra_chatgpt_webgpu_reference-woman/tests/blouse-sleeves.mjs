import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Sleeve106 shares its changed source with the contact query.
const iteration=106;
const blousePath=path.resolve('src/blouse.js');
let main=await readFile('src/main.js','utf8');
if(!main.includes('applyReferenceCrownMicrocontrast100')){const marker='detailTarget.x=.02+state.pose.shiftX;';if(main.split(marker).length!==2)throw new Error('Expected crown texture marker');main="import {applyReferenceCrownMicrocontrast100} from '../review/reference-crown-candidate100.js';\n"+main.replace(marker,"state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});\n    "+marker);}
for(const mode of ['baseline','candidate']){
 const source=await readFile(mode==='candidate'?'review/blouse-candidate106.js':'src/blouse.js','utf8');
 let loads=0;
 await build({stdin:{contents:main,resolveDir:path.resolve('src'),sourcefile:'main-sleeve106.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-blouse-sleeves${iteration}-${mode}.js`,logLevel:'silent',plugins:[{name:`blouse-sleeves-${mode}`,setup(b){
  b.onLoad({filter:/[/\\]blouse\.js$/},args=>{
   if(path.resolve(args.path)!==blousePath)return;
   loads++;
   return{contents:source,loader:'js',resolveDir:path.dirname(blousePath)};
  });
 }}]});
 if(loads!==1)throw new Error(`Expected one blouse module for ${mode}`);
}
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const mode of ['baseline','candidate']){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-blouse-sleeves${iteration}-${mode}.js`,contentType:'text/javascript'}));
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(iteration=>{
    const p=window.portrait;p.setScore(iteration,76);
    let triangles=0,meshes=0;p.model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,triangles,meshes,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },iteration);
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['front','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);
    await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/blouse-sleeves-${iteration}-${mode}-${view}.png`});
   }
   await page.evaluate(()=>{
    const p=window.portrait;p.headPivot.visible=false;p.setView('detail');
    p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;
    p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();
   });
   await page.waitForTimeout(180);
   await page.locator('#viewport-wrap').screenshot({path:`output/qa/blouse-sleeves-${iteration}-${mode}-garment.png`});
   console.log(JSON.stringify({iteration,mode,...metrics,errors}));
   if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
