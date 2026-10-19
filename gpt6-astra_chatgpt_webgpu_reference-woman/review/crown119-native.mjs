import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Isolated native review: current accepted portrait, frozen108-based119 groom,
// accepted100 color and86 contact. No116 color and no lower-hair118 changes.
const main=await readFile('src/main.js','utf8'),hair=await readFile('review/hair-groom-candidate119.js','utf8'),contact=await readFile('review/hair-contact-candidate86.js','utf8'),color=await readFile('review/reference-crown-candidate100.js','utf8');
const marker='createGroomHair({headShiftX:.26,shoulderContact:.35})';
if(main.split(marker).length!==2)throw new Error('Expected one accepted102 groom constructor');
const entry=main.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,crownStructure119:Number(new URLSearchParams(location.search).get('crownstructure')||0)})");
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown119-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-crown119.js',logLevel:'silent',plugins:[{name:'isolated-crown119',setup(b){
 b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));
 b.onLoad({filter:/[/\\]hair-contact\.js$/},()=>({contents:contact,loader:'js',resolveDir:path.resolve('src')}));
 b.onLoad({filter:/[/\\]reference-crown\.js$/},()=>({contents:color,loader:'js',resolveDir:path.resolve('src')}));
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),report=[];
try{
 for(const strength of[0,.5,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-crown119.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?crownstructure=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}catch(e){throw new Error(`Crown119 failed: ${await page.locator('#gate-message').textContent()} / ${e.message}`);}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait;p.setScore(119,76);const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,result:hair.userData.crownStructure119,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,constructionMs:hair.userData.constructionMs,internal:p.state.internalRender,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   });
   if(!metrics.nativeWebGPU||metrics.result.strength!==strength)throw new Error('Native WebGPU and requested119 strength required');
   const captures=[];
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(180);
    const file=`output/qa/crown119-${Math.round(strength*100)}-${view}.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push({view,path:file,sha256:crypto.createHash('sha256').update(await readFile(file)).digest('hex')});
   }
   const partCamera=await page.evaluate(async()=>{
    const p=window.portrait;p.setView('detail');
    const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow'),a=crown.geometry.attributes.position,i=96,l=7685+i,r=16070+i;
    const target=p.camera.position.clone().set((a.getX(l)+a.getX(r))*.5,(a.getY(l)+a.getY(r))*.5,(a.getZ(l)+a.getZ(r))*.5);crown.localToWorld(target);target.x-=.05;target.y-=.13;
    const direction=p.camera.position.clone().sub(p.controls.target);p.controls.target.copy(target);p.camera.position.copy(target).add(direction);p.camera.zoom=2.15;p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();
    p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();return{target:target.toArray(),zoom:p.camera.zoom,path:'portrait.renderNow → render-quality supersampling → renderer.render'};
   });
   await page.waitForTimeout(180);const file=`output/qa/crown119-${Math.round(strength*100)}-part-detail.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push({view:'part-detail',path:file,sha256:crypto.createHash('sha256').update(await readFile(file)).digest('hex')});
   report.push({iteration:119,strength,...metrics,partCamera,captures,errors});if(errors.length)throw new Error(JSON.stringify(errors));
   console.log(JSON.stringify({iteration:119,strength,...metrics,captures:captures.map(c=>c.path),errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/crown119-native-report.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
