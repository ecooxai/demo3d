import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// BEGIN narrow cross-page timing normalization158.
// The original per-page QA and raw signatures remain strict and unmodified.
const CROSS_PAGE_TIMING_FIELDS158=Object.freeze([
 {collection:'materials',index:36,keys:['referenceCrownMicrocontrast','bakeMs']},
 {collection:'materials',index:36,keys:['referenceCrownMicrocontrast','elapsedMs']},
 {collection:'textures',index:0,keys:['bakeMs']},
]);
function normalizeCrossPageProtection158(signature){
 if(!signature||typeof signature!=='object')throw Error('158 cross-page signature is unavailable.');
 const normalized={...signature},owners=new Map(),excluded=[];
 for(const field of CROSS_PAGE_TIMING_FIELDS158){
  const {collection,index,keys}=field,ownerKey=collection+'/'+index,fullPath='protectedSignature/'+ownerKey+'/metadata/'+keys.join('/');
  let owner=owners.get(ownerKey);
  if(!owner){
   const rows=signature[collection],row=rows?.[index];
   if(!Array.isArray(rows)||!row||typeof row.metadata!=='string')throw Error('158 expected exact timing metadata owner: '+ownerKey);
   const metadata=JSON.parse(row.metadata);
   if(!metadata||typeof metadata!=='object'||Array.isArray(metadata)||JSON.stringify(metadata)!==row.metadata)throw Error('158 timing metadata is not canonical original JSON: '+ownerKey);
   if(normalized[collection]===rows)normalized[collection]=rows.slice();
   owner={row,metadata,collection,index};owners.set(ownerKey,owner);
  }
  let parent=owner.metadata;
  for(const key of keys.slice(0,-1)){
   if(!parent||typeof parent!=='object'||!Object.hasOwn(parent,key))throw Error('158 measured timing path is absent: '+fullPath);
   parent=parent[key];
  }
  const leaf=keys.at(-1);
  if(!parent||typeof parent!=='object'||!Object.hasOwn(parent,leaf))throw Error('158 measured timing leaf is absent: '+fullPath);
  const value=parent[leaf];
  if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('158 measured timing must be finite and nonnegative: '+fullPath);
  excluded.push({path:fullPath,value});
  parent[leaf]='__cross_page_elapsed_ms_158__';
 }
 for(const owner of owners.values())normalized[owner.collection][owner.index]={...owner.row,metadata:JSON.stringify(owner.metadata)};
 return{signature:normalized,excluded};
}
// END narrow cross-page timing normalization158.

// Root-only OFF/ON art comparison on exact accepted157. No production source
// replacement: insert158 after117/154, then carry the four QA originals through
// one frame-identical99 proxy immediately after the ordinary full model99 pass.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(qa,{recursive:true});
const freeze=JSON.parse(await readFile(path.join(root,'review/collar158-manifest.json'),'utf8'));
for(const[file,r]of Object.entries(freeze.runtimeFiles)){const b=await readFile(path.join(root,file));if(b.length!==r.bytes||hash(b)!==r.sha256)throw Error('158 frozen runtime input changed: '+file);}
const main=await readFile(path.join(root,'src/main.js'),'utf8'),mainSHA='03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5',drape='state.blouseDrape154=applyBlouseDrape154(anatomicalBlouse,{strength:1});',balance='state.balance=applyPortraitBalance(model,{shiftX:-.24});';
if(hash(main)!==mainSHA||main.split(drape).length!==2||main.split(balance).length!==2||main.indexOf(drape)>main.indexOf(balance)||main.includes('collar158QA')||main.includes('collarRoll158'))throw Error('158 requires exact accepted157 and once-only154/99 markers.');
const entry="import {prepareCollarQA158} from '../review/collar158-native-qa.js';\n"+main.replace(drape,drape+"\nwindow.collar158QA=await prepareCollarQA158({blouse:anatomicalBlouse,model,state,strength:Number(new URLSearchParams(location.search).get('collar158')||0)});\nstate.collarRoll158=window.collar158QA.metrics;").replace(balance,balance+'\nawait window.collar158QA.afterBalance(state.balance);');
const bundle=path.join(qa,'app-collar158-timing.js'),built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'collar158-main-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent'});
const dependencyFiles=new Set(['src/main.js','review/collar158-native.mjs','review/collar158-native-timing.mjs','review/collar158-manifest.json','package.json']);
for(const f of Object.keys(built.metafile.inputs))if(!f.includes('node_modules/')&&!f.endsWith('collar158-main-entry.js'))dependencyFiles.add(f);
const files={};for(const f of[...dependencyFiles].sort()){const b=await readFile(path.resolve(root,f));files[f]={bytes:b.length,sha256:hash(b)};}
const views=['front','garment','left','right','back','collar-oblique'],report={candidate:158,acceptedBase:157,scoreUnchanged:78,status:'Running',modes:[0,1],views,files,results:[],errors:[],
 harness:{wrapper:'review/collar158-native-timing.mjs',sha256:files['review/collar158-native-timing.mjs'].sha256,originalFrozenWrapperSHA256:files['review/collar158-native.mjs'].sha256,frozenRuntimeGuardCount:Object.keys(freeze.runtimeFiles).length,crossPageExclusions:CROSS_PAGE_TIMING_FIELDS158.map(f=>'protectedSignature/'+f.collection+'/'+f.index+'/metadata/'+f.keys.join('/')),scope:'Only the three measured elapsed-time leaves are normalized across fresh pages. All original per-page metadata/source checks and retained raw signatures remain strict.'},
 interpretation:'One broad unequal camber and bounded point return on the four existing closed collar leaf/edge meshes.117 colors/maps,154 torso fold and all other components remain. Complete private copies own all their buffers. The old beneathCollar body shading and a free-edge fin are explicit visual rejection risks. Numeric/contact/resource checks do not establish art acceptance or a score increase.'};
const save=()=>writeFile(path.join(qa,'collar158-native-timing-result.json'),JSON.stringify(report,null,2)+'\n');
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
  const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('collar158',String(strength));
  const nav=Date.now();await page.goto(url.href,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
  result.navigationToReadyIncludingQAms=Date.now()-nav;
  result.setup=await page.evaluate(async()=>{
   const p=window.portrait,q=window.collar158QA;if(!p?.ready||!q)throw Error('158 preparation blocked: '+document.querySelector('#gate-message').textContent);
   q.display({accepted:true});
   await p.renderer.backend.device.queue.onSubmittedWorkDone();const t=performance.now(),snapshot=await q.finalize(),qaFinalSnapshotMs=performance.now()-t;
   p.startTurntable(false);p.setScore(158,78);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
   const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
   if(hair?.userData.guidePlacement118?.strength!==.5||hair?.userData.shoulderContact?.strength!==.35||hair?.userData.diagonalFringe133?.strength!==1)throw Error('158 hair once-only baseline changed.');
   return{...snapshot,qaFinalSnapshotMs,balancedOriginal:q.audit.originalAfter99Attributes,constructionMs:hair.userData.constructionMs,hairTriangles:hair.userData.triangles,hairGeometryMiB:hair.userData.geometryMiB,heapMiB:performance.memory?.usedJSHeapSize/1048576};
  });
  if(strength){
   const untreated=normalizeCrossPageProtection158(report.results[0].audit.protectedSignature),treated=normalizeCrossPageProtection158(result.setup.protectedSignature);
   result.crossPageTimingNormalization={scope:'Cross-fresh-page comparison only; raw per-page signatures are retained unchanged in audit.',excluded:untreated.excluded.map((r,i)=>({path:r.path,before:r.value,after:treated.excluded[i].value}))};
   if(JSON.stringify(treated.signature)!==JSON.stringify(untreated.signature))throw Error('158 altered a protected model buffer/material/map/transform beyond the three measured timing leaves.');
   if(JSON.stringify(result.setup.balancedOriginal)!==JSON.stringify(report.results[0].audit.originalAfter99Attributes))throw Error('158 retained four-collar proxy does not match the full accepted balanced originals.');
   result.protectedComparison='Exact across both fresh cases except the three explicitly recorded elapsed-time leaves; every original collar attribute after the99 proxy and all per-page metadata/source checks remain exact.';
  }
  delete result.setup.protectedSignature;delete result.setup.balancedOriginal;
  let frontState;
  for(const view of views){
   await page.evaluate(async view=>{
    const p=window.portrait;p.headPivot.visible=true;
    if(view==='garment'){
     p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();
    }else if(view==='collar-oblique'){
     p.headPivot.visible=false;p.setView('detail');p.controls.target.set(-.24,1.10,.55);p.camera.position.set(-5.4,1.75,10.7);p.camera.zoom=1.65;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();
    }else p.setView(view);
    p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();window.collar158QA.display();
   },view);
   const camera=await page.evaluate(cameraSnapshot),file='collar158-timing-'+(strength?100:0)+'-'+view+'.png',b=await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:path.join(qa,file)});
   result.captures[view]={file:'output/qa/'+file,bytes:b.length,sha256:hash(b),camera};if(view==='front')frontState=camera;
   if(strength&&JSON.stringify(camera)!==JSON.stringify(report.results[0].captures[view].camera))throw Error('158 matched camera differs at '+view);
  }
  await page.evaluate(async()=>{const p=window.portrait;p.headPivot.visible=true;p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
  await page.evaluate(()=>window.collar158QA.check('after-six-native-views'));
  result.risk=await page.evaluate(()=>window.collar158QA.risk());
  result.frontFrameCost=await page.evaluate(async()=>{
   const p=window.portrait,cpu=[],queued=[];for(let i=0;i<8;i++){const a=performance.now();p.renderNow();const b=performance.now();await p.renderer.backend.device.queue.onSubmittedWorkDone();cpu.push(b-a);queued.push(performance.now()-a);}
   const summarize=a=>{a.sort((x,y)=>x-y);return{samples:a.length,minMs:a[0],medianMs:a[Math.floor(a.length/2)],maxMs:a.at(-1)};};
   return{cpuSubmission:summarize(cpu),cpuThroughSubmittedGPUQueue:summarize(queued),scope:'Eight warm normal front renders at900x1200/AA2. Pair variation is not evidence of a speedup or a mobile FPS benchmark.'};
  });
  result.cleanup=await page.evaluate(()=>window.collar158QA.cleanup('complete'));result.audit=await page.evaluate(()=>window.collar158QA.audit);
  await page.evaluate(async()=>{const p=window.portrait;p.headPivot.visible=true;p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
  const restored=await page.evaluate(cameraSnapshot),maxCameraDifference=Math.max(...restored.numeric.map((v,i)=>Math.abs(v-frontState.numeric[i]))),stateExact=JSON.stringify(restored.state)===JSON.stringify(frontState.state);
  result.restoration={stateExact,maxCameraDifference,balancedOriginalsRestored:result.cleanup.balancedOriginalsRestored};
  if(!stateExact||maxCameraDifference>1e-12||!result.cleanup.balancedOriginalsRestored)throw Error('158 front/camera/four balanced original restoration failed.');
  const file='collar158-timing-'+(strength?100:0)+'-restored-front.png',b=await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:path.join(qa,file)});
  result.restoredFront={file:'output/qa/'+file,bytes:b.length,sha256:hash(b),matchesUntreatedFront:hash(b)===report.results[0].captures.front.sha256,matchesUntreatedRestored:strength?hash(b)===report.results[0].restoredFront.sha256:true,qualification:'Exact original geometry/source restoration is separately enforced. Encoded compositor equality is reported; any portrait-visible mismatch requires inspection rather than dismissal as UI.'};
  const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,frames);
  if(result.idleFrames!==0||report.errors.some(e=>e.strength===strength))throw Error('158 browser errors or idle rendering recorded.');
  result.status='Native technical checks passed; art pending';await save();
  console.log(JSON.stringify({candidate:158,strength,status:result.status,helperMs:result.setup.metrics.elapsedMs,privateBytesBeforeUpload:result.setup.metrics.privateAttributeBytes,privateBytesAfterUpload:result.setup.buffers.privateReplacementCPUBytesAfterUpload,proxyMs:result.setup.proxy.elapsedMs,ownedVertices:result.setup.ownedVertices,fixedContacts:result.risk.contacts,oppositeAxisGap:result.risk.oppositeSides.map(r=>r.minimumAxisGap),shellMinimum:result.risk.shells.map(r=>r.minimumVertexSeparation),seamAdditional:result.risk.seams.map(r=>r.maxAdditionalSeparation),idleFrames:result.idleFrames,restoredCompositorExact:result.restoredFront.matchesUntreatedRestored,errors:report.errors.filter(e=>e.strength===strength)}));
  await page.close();page=null;
 }
 report.status='Native OFF/ON complete; independent art decision pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
 if(page){const result=report.results.at(-1);
  try{result.preparationFailure=await page.evaluate(()=>window.collar158PreparationFailure||null);if(await page.evaluate(()=>!!window.collar158QA)){result.finalCleanup=await page.evaluate(()=>window.collar158QA.cleanup('finally'));result.audit=await page.evaluate(()=>window.collar158QA.audit);}}
  catch(error){result.cleanupFailure=String(error);failure||=error;}
  try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
 }
 try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
 if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:158,status:report.status,scoreUnchanged:78,errors:report.errors}));
