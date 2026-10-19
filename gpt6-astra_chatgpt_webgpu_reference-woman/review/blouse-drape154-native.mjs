import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root-only single native OFF/ON art comparison on exact149. The sole helper
// insertion is after117/before99; its QA-only retained source receives one
// frame-identical proxy99 pass immediately after the ordinary model99 call.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(qa,{recursive:true});
const freeze=JSON.parse(await readFile(path.join(root,'review/blouse-drape154-manifest.json'),'utf8'));
for(const[file,r]of Object.entries(freeze.runtimeFiles)){const b=await readFile(path.join(root,file));if(b.length!==r.bytes||hash(b)!==r.sha256)throw Error('154 frozen runtime input changed: '+file);}
const main=await readFile(path.join(root,'src/main.js'),'utf8'),mainSHA='a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521',cloth='state.referenceCloth117=await applyReferenceCloth117(anatomicalBlouse,{strength:.5});',balance='state.balance=applyPortraitBalance(model,{shiftX:-.24});';
if(hash(main)!==mainSHA||main.split(cloth).length!==2||main.split(balance).length!==2||main.indexOf(cloth)>main.indexOf(balance)||main.includes('BlouseDrape154')||main.includes('blouse154QA'))throw Error('154 requires exact accepted149 and once-only117/99 markers.');
const entry="import {prepareBlouseQA154} from '../review/blouse-drape154-native-qa.js';\n"+main.replace(cloth,cloth+"\nwindow.blouse154QA=await prepareBlouseQA154({blouse:anatomicalBlouse,model,hair:anatomicalHair,state,strength:Number(new URLSearchParams(location.search).get('fold154')||0)});\nstate.blouseDrape154=window.blouse154QA.metrics;").replace(balance,balance+'\nawait window.blouse154QA.afterBalance(state.balance);');
const bundle=path.join(qa,'app-blouse-drape154.js'),built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'blouse-drape154-main-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent'});
const dependencyFiles=new Set(['src/main.js','review/blouse-drape154-native.mjs','review/blouse-drape154-manifest.json','package.json']);
for(const f of Object.keys(built.metafile.inputs))if(!f.includes('node_modules/')&&!f.endsWith('blouse-drape154-main-entry.js'))dependencyFiles.add(f);
const files={};for(const f of[...dependencyFiles].sort()){const b=await readFile(path.resolve(root,f));files[f]={bytes:b.length,sha256:hash(b)};}
const views=['front','detail','left','right','back','garment'],report={candidate:154,acceptedBase:149,scoreUnchanged:78,status:'Running',modes:[0,1],views,files,results:[],errors:[],
 interpretation:'One coarse asymmetric hollow/roll on254 existing torso vertices, with exact X/Y and protected buffers.117 atlas/material and all hair remain. The private replacement owns all its buffers. Numeric contact/resource checks precede independent native art acceptance; no overall score gain is presumed.'};
const save=()=>writeFile(path.join(qa,'blouse-drape154-native-result.json'),JSON.stringify(report,null,2)+'\n');
const cameraSnapshot=()=>{const p=window.portrait,c=p.camera;return{numeric:[...c.position.toArray(),...c.quaternion.toArray(),...c.up.toArray(),...p.controls.target.toArray(),c.zoom,c.left,c.right,c.top,c.bottom,c.near,c.far],state:{view:p.state.view,width:p.state.width,height:p.state.height,lighting:p.state.lighting,backend:p.state.backend,rotating:p.state.rotating,antialiasing:p.state.antialiasing,toneMapping:p.renderer.toneMapping,exposure:p.renderer.toneMappingExposure,headVisible:p.headPivot.visible}};};
let browser,page,failure;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
 for(const strength of[0,1]){
  const result={strength,status:'Running',captures:{}};report.results.push(result);
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push({strength,type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')report.errors.push({strength,type:'console',message:m.text().slice(0,1800)});});
  await page.route('**/app.js',route=>route.fulfill({path:bundle,contentType:'text/javascript'}));
  const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('fold154',String(strength));
  const nav=Date.now();await page.goto(url.href,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
  result.navigationToReadyIncludingQAms=Date.now()-nav;
  result.setup=await page.evaluate(async()=>{
   const p=window.portrait,q=window.blouse154QA;if(!p?.ready||!q)throw Error('154 preparation blocked: '+document.querySelector('#gate-message').textContent);
   q.display({accepted:true});
   if(p.state.upperLipRelief140?.strength!==1||JSON.stringify(p.state.hairColor149?.linearDiffuseMultiplier)!==JSON.stringify([.65,.69,.75]))throw Error('154 accepted140/149 preparation missing.');
   await p.renderer.backend.device.queue.onSubmittedWorkDone();const t=performance.now(),snapshot=await q.finalize(),qaFinalSnapshotMs=performance.now()-t;
   p.startTurntable(false);p.setScore(154,78);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
   const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
   if(hair?.userData.guidePlacement118?.strength!==.5||hair?.userData.shoulderContact?.strength!==.35||hair?.userData.diagonalFringe133?.strength!==1)throw Error('154 hair once-only baseline changed.');
   return{...snapshot,qaFinalSnapshotMs,balancedOriginal:q.audit.originalAfter99Attributes,constructionMs:hair.userData.constructionMs,hairTriangles:hair.userData.triangles,hairGeometryMiB:hair.userData.geometryMiB,heapMiB:performance.memory?.usedJSHeapSize/1048576};
  });
  if(strength){
   if(JSON.stringify(result.setup.protectedSignature)!==JSON.stringify(report.results[0].audit.protectedSignature))throw Error('154 altered a protected model buffer/material/map/transform.');
   if(JSON.stringify(result.setup.balancedOriginal)!==JSON.stringify(report.results[0].audit.originalAfter99Attributes))throw Error('154 retained QA proxy does not match the full accepted balanced original.');
   result.protectedComparison='Exact across both fresh cases, including every original torso byte after the99 proxy.';
  }
  delete result.setup.protectedSignature;delete result.setup.balancedOriginal;
  let frontState;
  for(const view of views){
   await page.evaluate(async view=>{
    const p=window.portrait;p.headPivot.visible=true;
    if(view==='garment'){
     p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();
    }else p.setView(view);
    p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();window.blouse154QA.display();
   },view);
   const camera=await page.evaluate(cameraSnapshot),file='blouse-drape154-'+(strength?100:0)+'-'+view+'.png',b=await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:path.join(qa,file)});
   result.captures[view]={file:'output/qa/'+file,bytes:b.length,sha256:hash(b),camera};if(view==='front')frontState=camera;
   if(strength&&JSON.stringify(camera)!==JSON.stringify(report.results[0].captures[view].camera))throw Error('154 matched camera differs at '+view);
  }
  await page.evaluate(async()=>{const p=window.portrait;p.headPivot.visible=true;p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
  await page.evaluate(()=>window.blouse154QA.check('after-six-native-views'));
  result.risk=await page.evaluate(()=>window.blouse154QA.risk());
  result.frontFrameCost=await page.evaluate(async()=>{
   const p=window.portrait,cpu=[],queued=[];for(let i=0;i<8;i++){const a=performance.now();p.renderNow();const b=performance.now();await p.renderer.backend.device.queue.onSubmittedWorkDone();cpu.push(b-a);queued.push(performance.now()-a);}
   const summarize=a=>{a.sort((x,y)=>x-y);return{samples:a.length,minMs:a[0],medianMs:a[Math.floor(a.length/2)],maxMs:a.at(-1)};};
   return{cpuSubmission:summarize(cpu),cpuThroughSubmittedGPUQueue:summarize(queued),scope:'Eight warm normal front renders at900x1200/AA2. Pair variation is not evidence of a speedup or a mobile FPS benchmark.'};
  });
  result.cleanup=await page.evaluate(()=>window.blouse154QA.cleanup('complete'));result.audit=await page.evaluate(()=>window.blouse154QA.audit);
  await page.evaluate(async()=>{const p=window.portrait;p.headPivot.visible=true;p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
  const restored=await page.evaluate(cameraSnapshot),maxCameraDifference=Math.max(...restored.numeric.map((v,i)=>Math.abs(v-frontState.numeric[i]))),stateExact=JSON.stringify(restored.state)===JSON.stringify(frontState.state);
  result.restoration={stateExact,maxCameraDifference,balancedOriginalRestored:result.cleanup.balancedOriginalRestored};
  if(!stateExact||maxCameraDifference>1e-12||!result.cleanup.balancedOriginalRestored)throw Error('154 front/camera/balanced-original restoration failed.');
  const file='blouse-drape154-'+(strength?100:0)+'-restored-front.png',b=await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:path.join(qa,file)});
  result.restoredFront={file:'output/qa/'+file,bytes:b.length,sha256:hash(b),matchesUntreatedFront:hash(b)===report.results[0].captures.front.sha256,matchesUntreatedRestored:strength?hash(b)===report.results[0].restoredFront.sha256:true,qualification:'Exact geometry/source restoration is separately enforced. Encoded compositor equality is reported; any portrait-visible mismatch requires inspection rather than dismissal as UI.'};
  const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,frames);
  if(result.idleFrames!==0||report.errors.some(e=>e.strength===strength))throw Error('154 browser errors or idle rendering recorded.');
  result.status='Native technical checks passed; art pending';await save();
  console.log(JSON.stringify({candidate:154,strength,status:result.status,helperMs:result.setup.metrics.elapsedMs,privateBytesBeforeUpload:result.setup.metrics.privateAttributeBytes,privateBytesAfterUpload:result.setup.buffers.privateReplacementCPUBytesAfterUpload,proxyMs:result.setup.proxy.elapsedMs,ownedVertices:result.setup.ownedVertices,hairContacts:result.risk.triangleContacts,actualCrossings:result.risk.sampledDepth.newCrossings,idleFrames:result.idleFrames,restoredCompositorExact:result.restoredFront.matchesUntreatedRestored,errors:report.errors.filter(e=>e.strength===strength)}));
  await page.close();page=null;
 }
 report.status='Native OFF/ON complete; independent art decision pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
 if(page){const result=report.results.at(-1);
  try{result.preparationFailure=await page.evaluate(()=>window.blouse154PreparationFailure||null);if(await page.evaluate(()=>!!window.blouse154QA)){result.finalCleanup=await page.evaluate(()=>window.blouse154QA.cleanup('finally'));result.audit=await page.evaluate(()=>window.blouse154QA.audit);}}
  catch(error){result.cleanupFailure=String(error);failure||=error;}
  try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
 }
 try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
 if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:154,status:report.status,scoreUnchanged:78,errors:report.errors}));
