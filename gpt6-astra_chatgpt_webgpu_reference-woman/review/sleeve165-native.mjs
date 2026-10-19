import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root-only native OFF/ON165. Current164 production source is unchanged.
const CROSS_PAGE_TIMING_FIELDS165=Object.freeze([
 {collection:'materials',index:36,keys:['referenceCrownMicrocontrast','bakeMs']},
 {collection:'materials',index:36,keys:['referenceCrownMicrocontrast','elapsedMs']},
 {collection:'textures',index:0,keys:['bakeMs']},
]);
function normalizeCrossPageProtection165(signature){
 if(!signature||typeof signature!=='object')throw Error('165 cross-page signature is unavailable.');
 const normalized={...signature},owners=new Map(),excluded=[];
 for(const field of CROSS_PAGE_TIMING_FIELDS165){
  const {collection,index,keys}=field,ownerKey=collection+'/'+index,fullPath='protectedSignature/'+ownerKey+'/metadata/'+keys.join('/');
  let owner=owners.get(ownerKey);
  if(!owner){
   const rows=signature[collection],row=rows?.[index];
   if(!Array.isArray(rows)||!row||typeof row.metadata!=='string')throw Error('165 expected exact timing metadata owner: '+ownerKey);
   const metadata=JSON.parse(row.metadata);
   if(!metadata||typeof metadata!=='object'||Array.isArray(metadata)||JSON.stringify(metadata)!==row.metadata)throw Error('165 timing metadata is not canonical original JSON: '+ownerKey);
   if(normalized[collection]===rows)normalized[collection]=rows.slice();
   owner={row,metadata,collection,index};owners.set(ownerKey,owner);
  }
  let parent=owner.metadata;
  for(const key of keys.slice(0,-1)){
   if(!parent||typeof parent!=='object'||!Object.hasOwn(parent,key))throw Error('165 measured timing path is absent: '+fullPath);
   parent=parent[key];
  }
  const leaf=keys.at(-1);
  if(!parent||typeof parent!=='object'||!Object.hasOwn(parent,leaf))throw Error('165 measured timing leaf is absent: '+fullPath);
  const value=parent[leaf];
  if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error('165 measured timing must be finite and nonnegative: '+fullPath);
  excluded.push({path:fullPath,value});
  parent[leaf]='__cross_page_elapsed_ms_165__';
 }
 for(const owner of owners.values())normalized[owner.collection][owner.index]={...owner.row,metadata:JSON.stringify(owner.metadata)};
 return{signature:normalized,excluded};
}

const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(qa,{recursive:true});
const freeze=JSON.parse(await readFile(path.join(root,'review/sleeve165-manifest.json'),'utf8'));
for(const[file,r]of Object.entries(freeze.runtimeFiles)){const b=await readFile(path.join(root,file));if(b.length!==r.bytes||hash(b)!==r.sha256)throw Error('165 frozen runtime input changed: '+file);}
const main=await readFile(path.join(root,'src/main.js'),'utf8'),mainSHA='88280af03c4be630968aca0763d3d430ec6699ae9533ba057015c53801d4ae55',collar='state.collarRoll158=applyCollarRoll158(anatomicalBlouse,{strength:1,retainSourceForQA:false});',balance='state.balance=applyPortraitBalance(model,{shiftX:-.24});';
if(hash(main)!==mainSHA||main.split(collar).length!==2||main.split(balance).length!==2||main.indexOf(collar)>main.indexOf(balance)||main.includes('sleeve165QA'))throw Error('165 requires exact accepted164 and once-only158/99 markers.');
const entry="import {prepareSleeveQA165} from '../review/sleeve165-native-qa.js';\n"+main.replace(collar,collar+"\nwindow.sleeve165QA=await prepareSleeveQA165({blouse:anatomicalBlouse,model,state,strength:Number(new URLSearchParams(location.search).get('sleeve165')||0)});\nstate.sleeveFold165=window.sleeve165QA.metrics;").replace(balance,balance+'\nawait window.sleeve165QA.afterBalance(state.balance);');
const bundle=path.join(qa,'app-sleeve165.js'),built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'sleeve165-main-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent'});
const dependencyFiles=new Set(['src/main.js','review/sleeve165-native.mjs','review/sleeve165-manifest.json','package.json']);
for(const f of Object.keys(built.metafile.inputs))if(!f.includes('node_modules/')&&!f.endsWith('sleeve165-main-entry.js'))dependencyFiles.add(f);
const files={};for(const f of[...dependencyFiles].sort()){const b=await readFile(path.resolve(root,f));files[f]={bytes:b.length,sha256:hash(b)};}
const views=['front','garment','left','right','back','sleeve'],report={candidate:165,acceptedBase:164,scoreUnchanged:78,status:'Running',modes:[0,1],views,files,results:[],errors:[],
 harness:{wrapper:'review/sleeve165-native.mjs',sha256:files['review/sleeve165-native.mjs'].sha256,frozenRuntimeGuardCount:Object.keys(freeze.runtimeFiles).length,crossPageExclusions:CROSS_PAGE_TIMING_FIELDS165.map(f=>'protectedSignature/'+f.collection+'/'+f.index+'/metadata/'+f.keys.join('/')),scope:'Only the three measured elapsed-time leaves are normalized across fresh pages. All original per-page metadata/source checks and retained raw signatures remain strict.'},
 interpretation:'One coherent near-sleeve compression and return with existing seam attached through emitted torso triangles. Source164 materials/maps,154 central fold,158 collars and all other objects remain. Active154 geometry and attribute identities are preserved; only wholly private unrendered QA backups are disposed. A padded dent, obvious coarse crease, broken seam or negligible ordinary benefit are visual rejection risks. Numeric checks do not establish art acceptance or a score increase.'};
const save=()=>writeFile(path.join(qa,'sleeve165-native-result.json'),JSON.stringify(report,null,2)+'\n');
const contentRows=rows=>rows.map(r=>({label:r.label,key:r.key,values:r.values,type:r.key==='index'?'logical-index':r.type,sha256:r.key==='index'?r.indexLogicalSHA256:r.sha256}));
const native164Bytes=await readFile(path.join(root,'output/qa/integrated164-native.json'));
if(hash(native164Bytes)!=='650743e8db6d3ac77d353c629cfff8a9e849f52a3c2655da3cbb744f4989cbed')throw Error('165 completed164 native evidence changed.');
const native164=JSON.parse(native164Bytes);if(native164.status!=='Passed'||native164.setup.attributes.length!==282)throw Error('165 incomplete native164 baseline.');
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
  const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('sleeve165',String(strength));
  const nav=Date.now();await page.goto(url.href,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
  result.navigationToReadyIncludingQAms=Date.now()-nav;
  result.setup=await page.evaluate(async()=>{
   const p=window.portrait,q=window.sleeve165QA;if(!p?.ready||!q)throw Error('165 preparation blocked: '+document.querySelector('#gate-message').textContent);
   q.display({accepted:true});
   await p.renderer.backend.device.queue.onSubmittedWorkDone();const t=performance.now(),snapshot=await q.finalize(),qaFinalSnapshotMs=performance.now()-t;
   p.startTurntable(false);p.setScore(165,78);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
   const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
   if(hair?.userData.guidePlacement118?.strength!==.5||hair?.userData.shoulderContact?.strength!==.35||hair?.userData.diagonalFringe133?.strength!==1)throw Error('165 hair once-only baseline changed.');
   return{...snapshot,qaFinalSnapshotMs,balancedOriginal:q.audit.sourceAfter99Attributes,constructionMs:hair.userData.constructionMs,hairTriangles:hair.userData.triangles,hairGeometryMiB:hair.userData.geometryMiB,heapMiB:performance.memory?.usedJSHeapSize/1048576};
  });
  if(!strength){
   const actual=await page.evaluate(()=>window.sleeve165QA.audit.finalAttributes);
   if(JSON.stringify(contentRows(actual))!==JSON.stringify(contentRows(native164.setup.attributes)))throw Error('165 OFF differs from the actual282-attribute accepted164 scene.');
   result.accepted164Comparison={attributes:282,logicalIndices:64,exact:true};
  }
  if(strength){
   const untreated=normalizeCrossPageProtection165(report.results[0].audit.protectedSignature),treated=normalizeCrossPageProtection165(result.setup.protectedSignature);
   result.crossPageTimingNormalization={scope:'Cross-fresh-page comparison only; raw per-page signatures are retained unchanged in audit.',excluded:untreated.excluded.map((r,i)=>({path:r.path,before:r.value,after:treated.excluded[i].value}))};
   if(JSON.stringify(treated.signature)!==JSON.stringify(untreated.signature))throw Error('165 altered a protected model buffer/material/map/transform beyond the three measured timing leaves.');
   if(JSON.stringify(contentRows(result.setup.balancedOriginal))!==JSON.stringify(contentRows(report.results[0].audit.sourceAfter99Attributes)))throw Error('165 private backup proxy does not match actual164 balanced baseline values.');
   result.protectedComparison='Exact across both fresh cases except the three explicitly recorded elapsed-time leaves; every baseline sleeve/seam attribute after the99 proxy and all per-page metadata/source checks remain exact.';
  }
  delete result.setup.protectedSignature;delete result.setup.balancedOriginal;
  let frontState;
  for(const view of views){
   await page.evaluate(async view=>{
    const p=window.portrait;p.headPivot.visible=true;
    if(view==='garment'){
     p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();
    }else if(view==='sleeve'){
     p.headPivot.visible=false;p.setView('detail');p.controls.target.set(-1.72,.78,.22);p.camera.position.set(-5.10,1.20,10.10);p.camera.zoom=1.55;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();
    }else p.setView(view);
    p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();window.sleeve165QA.display();
   },view);
   const camera=await page.evaluate(cameraSnapshot),file='sleeve165-'+(strength?100:0)+'-'+view+'.png',b=await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:path.join(qa,file)});
   result.captures[view]={file:'output/qa/'+file,bytes:b.length,sha256:hash(b),camera};if(view==='front')frontState=camera;
   if(strength&&JSON.stringify(camera)!==JSON.stringify(report.results[0].captures[view].camera))throw Error('165 matched camera differs at '+view);
  }
  await page.evaluate(async()=>{const p=window.portrait;p.headPivot.visible=true;p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
  await page.evaluate(()=>window.sleeve165QA.check('after-six-native-views'));
  result.risk=await page.evaluate(()=>window.sleeve165QA.risk());
  result.frontFrameCost=await page.evaluate(async()=>{
   const p=window.portrait,cpu=[],queued=[];for(let i=0;i<8;i++){const a=performance.now();p.renderNow();const b=performance.now();await p.renderer.backend.device.queue.onSubmittedWorkDone();cpu.push(b-a);queued.push(performance.now()-a);}
   const summarize=a=>{a.sort((x,y)=>x-y);return{samples:a.length,minMs:a[0],medianMs:a[Math.floor(a.length/2)],maxMs:a.at(-1)};};
   return{cpuSubmission:summarize(cpu),cpuThroughSubmittedGPUQueue:summarize(queued),scope:'Eight warm normal front renders at900x1200/AA2. Pair variation is not evidence of a speedup or a mobile FPS benchmark.'};
  });
  result.cleanup=await page.evaluate(()=>window.sleeve165QA.cleanup('complete'));result.audit=await page.evaluate(()=>window.sleeve165QA.audit);
  await page.evaluate(async()=>{const p=window.portrait;p.headPivot.visible=true;p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
  const restored=await page.evaluate(cameraSnapshot),maxCameraDifference=Math.max(...restored.numeric.map((v,i)=>Math.abs(v-frontState.numeric[i]))),stateExact=JSON.stringify(restored.state)===JSON.stringify(frontState.state);
  result.restoration={stateExact,maxCameraDifference,balancedOriginalValuesRestored:result.cleanup.balancedOriginalValuesRestored};
  if(!stateExact||maxCameraDifference>1e-12||!result.cleanup.balancedOriginalValuesRestored)throw Error('165 front/camera/balanced original value restoration failed.');
  const file='sleeve165-'+(strength?100:0)+'-restored-front.png',b=await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:path.join(qa,file)});
  result.restoredFront={file:'output/qa/'+file,bytes:b.length,sha256:hash(b),matchesUntreatedFront:hash(b)===report.results[0].captures.front.sha256,matchesUntreatedRestored:strength?hash(b)===report.results[0].restoredFront.sha256:true,qualification:'Exact original geometry/source restoration is separately enforced. Encoded compositor equality is reported; any portrait-visible mismatch requires inspection rather than dismissal as UI.'};
  const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,frames);
  if(result.idleFrames!==0||report.errors.some(e=>e.strength===strength))throw Error('165 browser errors or idle rendering recorded.');
  result.status='Native technical checks passed; art pending';await save();
  console.log(JSON.stringify({candidate:165,strength,status:result.status,helperMs:result.setup.metrics.elapsedMs,stagedPNBytes:result.setup.metrics.stagedAttributeBytes,retainedProductionBytes:result.setup.metrics.stagedBytesRetained,qaPrivateBytes:result.setup.buffers.qaPrivateBytes,proxyMs:result.setup.proxy.elapsedMs,owned:result.setup.owned,fixedContacts:{before:result.risk.contacts.beforePairs,after:result.risk.contacts.afterPairs,new:result.risk.contacts.newPairs},seamSupport:result.risk.seamSupport,idleFrames:result.idleFrames,restoredCompositorExact:result.restoredFront.matchesUntreatedRestored,errors:report.errors.filter(e=>e.strength===strength)}));
  await page.close();page=null;
 }
 report.status='Native OFF/ON complete; independent art decision pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
 if(page){const result=report.results.at(-1);
  try{result.preparationFailure=await page.evaluate(()=>window.sleeve165PreparationFailure||null);if(await page.evaluate(()=>!!window.sleeve165QA)){result.finalCleanup=await page.evaluate(()=>window.sleeve165QA.cleanup('finally'));result.audit=await page.evaluate(()=>window.sleeve165QA.audit);}}
  catch(error){result.cleanupFailure=String(error);failure||=error;}
  try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
 }
 try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
 if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:165,status:report.status,scoreUnchanged:78,errors:report.errors}));
