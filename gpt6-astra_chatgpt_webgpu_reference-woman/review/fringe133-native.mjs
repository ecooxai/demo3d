import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Current live130 portrait, accepted118 lower placement and100 crown color.
//133 changes only the first108 fringe family; no cap or material variant.
const main=await readFile('src/main.js','utf8'),hair=await readFile('review/hair-groom-candidate133.js','utf8');
const marker='createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5})';
if(main.split(marker).length!==2)throw new Error('Expected the accepted118 groom constructor exactly once');
const entry=main.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:Number(new URLSearchParams(location.search).get('diagonalfringe133')||0)})");
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-fringe133-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-fringe133.js',logLevel:'silent',plugins:[{name:'isolated-fringe133',setup(b){
 b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),report=[];
try{
 for(const strength of[0,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-fringe133.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?diagonalfringe133=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}catch(e){throw new Error(`Fringe133 failed: ${await page.locator('#gate-message').textContent()} / ${e.message}`);}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait;p.setScore(133,77);const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    let nonfinite=0;hair.traverse(o=>{if(o.isMesh)for(const a of Object.values(o.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;});
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,result:hair.userData.diagonalFringe133,guidePlacement:hair.userData.guidePlacement118.strength,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,constructionMs:hair.userData.constructionMs,nonfinite,internal:p.state.internalRender,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   });
   if(!metrics.nativeWebGPU||metrics.result.strength!==strength||metrics.nonfinite||metrics.guidePlacement!==.5)throw new Error('Expected native WebGPU, finite133 geometry and accepted118 placement');
   const captures=[];
   const capture=async view=>{const file=`output/qa/fringe133-${strength}-${view}.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push({view,path:file,sha256:crypto.createHash('sha256').update(await readFile(file)).digest('hex')});};
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(180);await capture(view);
   }
   const junctionCamera=await page.evaluate(async()=>{
    const p=window.portrait;p.setView('detail');const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow'),a=crown.geometry.attributes.position,i=7685+Math.round(.54*64)*133+Math.round(.85*128);
    const target=p.camera.position.clone().set(a.getX(i),a.getY(i)-.13,a.getZ(i));crown.localToWorld(target);const direction=p.camera.position.clone().sub(p.controls.target);p.controls.target.copy(target);p.camera.position.copy(target).add(direction);p.camera.zoom=1.9;p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();return{target:target.toArray(),zoom:p.camera.zoom};
   });
   await page.waitForTimeout(180);await capture('junction');
   if(strength===1&&process.argv.includes('--isolate')){
    await page.evaluate(()=>{const p=window.portrait,hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),fringe=hair.getObjectByName('Dense fine bowed brown fringe strands');fringe.geometry.setDrawRange(0,hair.userData.diagonalFringe133.indices);});
    for(const view of['detail','left']){await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(180);await capture('group0-only-'+view);}
   }
   report.push({iteration:133,strength,...metrics,junctionCamera,captures,errors});if(errors.length)throw new Error(JSON.stringify(errors));
   console.log(JSON.stringify({iteration:133,strength,...metrics,result:{...metrics.result,paths:undefined},captures:captures.map(c=>c.path),errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/fringe133-native-report.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
