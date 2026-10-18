import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Native Mac review bundle only.116 runs once after100 and before99, using
// frozen108 geometry. Every shot goes through the real portrait render path.
const main=await readFile('src/main.js','utf8'),hair=await readFile('review/hair-groom-candidate108.js','utf8'),contact=await readFile('review/hair-contact-candidate86.js','utf8'),baseColor=await readFile('review/reference-crown-candidate100.js','utf8');
const marker='if(groomCandidate)state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});';
if(main.split(marker).length!==2)throw new Error('Expected one accepted100 one-time preparation marker');
const entry="import {applyRegisteredCrownColor116} from '../review/reference-crown-candidate116.js';\n"+main.replace(marker,marker+"\n      if(groomCandidate)state.registeredCrown116=await applyRegisteredCrownColor116(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('registeredcrown')||0)});");
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-registered-crown116-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-registered-crown116.js',logLevel:'silent',plugins:[{name:'frozen108-and100-for116',setup(b){
 b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));
 b.onLoad({filter:/[/\\]hair-contact\.js$/},()=>({contents:contact,loader:'js',resolveDir:path.resolve('src')}));
 b.onLoad({filter:/[/\\]reference-crown\.js$/},()=>({contents:baseColor,loader:'js',resolveDir:path.resolve('src')}));
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),report=[];
try{
 for(const strength of[0,.65,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-registered-crown116.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?registeredcrown=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}catch(e){throw new Error(`Crown116 failed: ${await page.locator('#gate-message').textContent()} / ${e.message}`);}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait;p.setScore(116,76);const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,result:p.state.registeredCrown116,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,internal:p.state.internalRender,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   });
   if(!metrics.nativeWebGPU||metrics.result.strength!==strength)throw new Error('Native WebGPU and requested116 strength required');
   const captures=[];
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(180);
    const file=`output/qa/registered-crown116-${Math.round(strength*100)}-${view}.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push({view,path:file,sha256:crypto.createHash('sha256').update(await readFile(file)).digest('hex')});
   }
   const relight=await page.evaluate(async()=>{
    const p=window.portrait,lights=[];let key=null,fill=null;
    p.scene.traverse(o=>{if(o.isDirectionalLight){lights.push({position:o.position.toArray(),intensity:o.intensity,castShadow:o.castShadow});if(o.castShadow)key=o;else if(o.position.z>0)fill=o;}});
    if(!key||!fill)throw new Error('Expected actual studio key and fill');
    // Reposition the existing key, retaining materials, environment and exposure.
    key.position.set(5.5,5.0,3.4);fill.position.set(-4,3,6);fill.intensity=.55;
    key.shadow.needsUpdate=true;if(p.renderer.shadowMap)p.renderer.shadowMap.needsUpdate=true;
    p.setView('detail');p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();
    return{before:lights,after:{key:key.position.toArray(),fill:fill.position.toArray(),fillIntensity:fill.intensity},path:'portrait.renderNow → render-quality supersampling → renderer.render'};
   });
   await page.waitForTimeout(180);const file=`output/qa/registered-crown116-${Math.round(strength*100)}-relight-detail.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push({view:'relight-detail',path:file,sha256:crypto.createHash('sha256').update(await readFile(file)).digest('hex')});
   report.push({iteration:116,strength,...metrics,relight,captures,errors});if(errors.length)throw new Error(JSON.stringify(errors));
   console.log(JSON.stringify({iteration:116,strength,nativeWebGPU:metrics.nativeWebGPU,elapsedMs:metrics.result.elapsedMs??0,hairTriangles:metrics.hairTriangles,geometryMiB:metrics.geometryMiB,heapMiB:metrics.heapMiB,captures:captures.map(c=>c.path),errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/registered-crown116-native-report.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
