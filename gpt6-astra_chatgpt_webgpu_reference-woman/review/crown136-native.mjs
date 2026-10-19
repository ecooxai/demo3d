import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Live133 portrait, accepted100 atlas,118 placement and133 bowed fringe.
//136 changes existing front crown fiber positions and the matched bed alpha.
// This wrapper is for the root's native Mac renderer; it never edits src/.
const main=await readFile('src/main.js','utf8'),hair=await readFile('review/hair-groom-candidate136.js','utf8');
const marker='createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1})';
if(main.split(marker).length!==2)throw new Error('Expected the accepted133 groom constructor exactly once');
const entry=main.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,crownDeparture136:Number(new URLSearchParams(location.search).get('crowndeparture136')||0)})");
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown136-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-crown136.js',logLevel:'silent',plugins:[{name:'isolated-crown136',setup(b){
 b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),report=[];
try{
 for(const strength of[0,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-crown136.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?crowndeparture136=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}catch(e){throw new Error(`Crown136 failed: ${await page.locator('#gate-message').textContent()} / ${e.message}`);}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait;p.setScore(136,77);const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    let nonfinite=0;hair.traverse(o=>{if(o.isMesh)for(const a of Object.values(o.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;});
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,result:hair.userData.crownDeparture136||{version:'crown-departure136',strength:0,changed:false},guidePlacement:hair.userData.guidePlacement118.strength,diagonalFringe:hair.userData.diagonalFringe133.strength,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,constructionMs:hair.userData.constructionMs,nonfinite,internal:p.state.internalRender,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   });
   if(!metrics.nativeWebGPU||metrics.result.strength!==strength||metrics.nonfinite||metrics.guidePlacement!==.5||metrics.diagonalFringe!==1)throw new Error('Expected native WebGPU, finite136 geometry and accepted118/133 options');
   const captures=[];
   const capture=async view=>{const file=`output/qa/crown136-${strength}-${view}.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push({view,path:file,sha256:crypto.createHash('sha256').update(await readFile(file)).digest('hex')});};
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(180);await capture(view);
   }
   const junctionCamera=await page.evaluate(async()=>{
    const p=window.portrait;p.setView('detail');const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow'),a=crown.geometry.attributes.position;
    // CROWN sheet stride is129. Both strengths use the same unchanged vertex.
    const i=7685+Math.round(.54*64)*129+Math.round(.85*128),target=p.camera.position.clone().set(a.getX(i),a.getY(i)-.13,a.getZ(i));
    crown.localToWorld(target);const direction=p.camera.position.clone().sub(p.controls.target);p.controls.target.copy(target);p.camera.position.copy(target).add(direction);p.camera.zoom=1.9;p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();return{target:target.toArray(),zoom:p.camera.zoom,vertex:i};
   });
   await page.waitForTimeout(180);await capture('junction');
   report.push({iteration:136,strength,...metrics,junctionCamera,captures,errors});
   console.log(JSON.stringify({iteration:136,strength,...metrics,captures:captures.map(c=>c.path),errors}));
   if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
 await writeFile('output/qa/crown136-native-report.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
