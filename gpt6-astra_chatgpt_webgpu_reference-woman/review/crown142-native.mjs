import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Root-only native comparison. Both fresh pages retain accepted141's cached
// upper-lip140 and CROWN FrontSide/DoubleSide-shadow preparation, plus all133
// bows,100 atlas,118 placement,.35 contact and99 balance. No production edits.
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const main=await readFile('src/main.js','utf8'),hair=await readFile('review/hair-groom-candidate142.js','utf8');
const acceptedMain='2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a';
if(hash(main)!==acceptedMain)throw Error('Review142 requires the frozen accepted141 main; inspect any later integration before changing this guard.');
const marker='createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1})';
if(main.split(marker).length!==2)throw Error('Expected the accepted133 groom constructor exactly once.');
const entry=main.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,crownChart142:Number(new URLSearchParams(location.search).get('crownchart142')||0)})");
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown142-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-crown142.js',logLevel:'silent',plugins:[{name:'isolated-crown142',setup(b){
 b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),report=[];
let fixedJunctionTarget=null;
try{
 for(const strength of[0,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-crown142.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?crownchart142=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}catch(e){throw Error(`Crown142 failed: ${await page.locator('#gate-message').textContent()} / ${e.message}`);}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait;p.setScore(142,77);const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow');
    let nonfinite=0;hair.traverse(o=>{if(o.isMesh)for(const a of Object.values(o.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;});
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,result:hair.userData.crownChart142||{version:'shared-front-crown-chart142',strength:0,changed:false},guidePlacement:hair.userData.guidePlacement118.strength,diagonalFringe:hair.userData.diagonalFringe133.strength,side:crown.material.side,shadowSide:crown.material.shadowSide,upperLipRelief140:p.state.upperLipRelief140,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,constructionMs:hair.userData.constructionMs,nonfinite,internal:p.state.internalRender,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   });
   if(!metrics.nativeWebGPU||metrics.result.strength!==strength||metrics.nonfinite||metrics.guidePlacement!==.5||metrics.diagonalFringe!==1||metrics.side!==0||metrics.shadowSide!==2||!metrics.upperLipRelief140)throw Error('Expected native WebGPU, finite142 geometry and accepted118/133/140/141 preparation.');
   const captures=[];
   const capture=async view=>{const file=`output/qa/crown142-${strength}-${view}.png`,buffer=await page.locator('#viewport-wrap').screenshot({path:file,animations:'disabled'});captures.push({view,path:file,sha256:hash(buffer)});};
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(180);await capture(view);
   }
   const junctionCamera=await page.evaluate(async fixed=>{
    const p=window.portrait;p.setView('detail');const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow'),a=crown.geometry.attributes.position;
    // Reuse the OFF world target on ON; the compared field itself moves.
    const i=7685+Math.round(.54*64)*129+Math.round(.85*128),target=p.camera.position.clone();
    if(fixed)target.set(...fixed);else{target.set(a.getX(i),a.getY(i)-.13,a.getZ(i));crown.localToWorld(target);}
    const direction=p.camera.position.clone().sub(p.controls.target);p.controls.target.copy(target);p.camera.position.copy(target).add(direction);p.camera.zoom=1.9;p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();return{target:target.toArray(),zoom:p.camera.zoom,baselineVertex:i};
   },fixedJunctionTarget);
   fixedJunctionTarget??=junctionCamera.target;
   await page.waitForTimeout(180);await capture('junction');
   // Camera restoration is reported strictly; it is separate from the fresh-
   // page off/on geometry comparison and never changes the acceptance score.
   await page.evaluate(async()=>{const p=window.portrait;p.setView('detail');p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();});
   await page.waitForTimeout(180);await capture('restored-detail');
   const strictRestoredDetail=captures.find(c=>c.view==='detail').sha256===captures.find(c=>c.view==='restored-detail').sha256;
   report.push({iteration:142,strength,mainSHA256:acceptedMain,...metrics,junctionCamera,captures,strictRestoredDetail,errors});
   console.log(JSON.stringify({iteration:142,strength,...metrics,captures:captures.map(c=>c.path),strictRestoredDetail,errors}));
   if(errors.length)throw Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
 await writeFile('output/qa/crown142-native-report.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
