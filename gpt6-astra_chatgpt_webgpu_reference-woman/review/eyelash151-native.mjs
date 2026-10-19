import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Parent-only native OFF/ON comparison. Two fresh pages use the current149
// ordinary preparation/render path, with151 once immediately after147.
// No extra compileAsync, display/optical sweep, or backend fallback.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(qa,{recursive:true});
const frozen=JSON.parse(await readFile(path.join(root,'review/eyelash151-manifest.json'),'utf8'));
for(const[file,expected]of Object.entries(frozen.runtimeFiles)){const b=await readFile(path.join(root,file));if(b.length!==expected.bytes||hash(b)!==expected.sha256)throw Error('151 frozen runtime input changed: '+file);}
const main=await readFile(path.join(root,'src/main.js'),'utf8'),expectedMain='a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521',expectedGroom='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d',marker='state.eyeContour147=applyEyeContour147(anatomicalHead,{strength:1});';
if(hash(main)!==expectedMain||hash(await readFile(path.join(root,'src/hair-groom.js')))!==expectedGroom||main.split(marker).length!==2||main.includes('applyEyelash151')||!main.includes('renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.4;'))throw Error('151 requires exact accepted149 main, frozen groom,147 and Neutral1.4.');
const cameras=JSON.parse(await readFile(path.join(root,'review/eyelash151-cameras.json'),'utf8'));
if(cameras.sourceSHA256!=='375db921d8e72a999eba9d0d2bcf1959362c251298a81f311c2ec61ff739c6e8'||cameras.sourceMode!==0)throw Error('151 fixed camera provenance changed.');
const injection=marker+"\nwindow.eyelash151QA=await prepareEyelashQA151({head:anatomicalHead,model,hair:anatomicalHair,state,strength:Number(new URLSearchParams(location.search).get('lash151')||0)});\nstate.eyelash151=window.eyelash151QA.metrics;";
const entry="import {prepareEyelashQA151} from '../review/eyelash151-native-qa.js';\n"+main.replace(marker,injection),bundle=path.join(qa,'app-eyelash151.js');
const built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'eyelash151-main-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent'});
const files=new Set(['src/main.js','review/eyelash151-native.mjs','review/eyelash151-cameras.json','review/eyelash151-manifest.json','package.json']);
for(const file of Object.keys(built.metafile.inputs))if(!file.includes('node_modules/')&&!file.endsWith('eyelash151-main-entry.js'))files.add(file);
const manifest={};for(const file of[...files].sort()){const b=await readFile(path.resolve(root,file));manifest[file]={bytes:b.length,sha256:hash(b)};}
const views=['front','detail','left','right','eye','eye-oblique'],report={candidate:151,status:'Running',scoreUnchanged:78,acceptedBase:149,modes:[0,1],views,files:manifest,cameraProvenance:cameras,
 display:{nativeWebGPU:true,toneMapping:7,exposure:1.4,resolution:[900,1200],internal:[1800,2400],antialiasing:2,lighting:'soft'},results:[],errors:[],
 interpretation:'Only the two existing individual-eyelashes geometries change.80 fibers and all320 accepted147 root-ring vertices remain. Full original mesh/material/map data are protected. Actual ocular/fringe contacts are compared with the inherited baseline, including new identities. These numeric checks do not establish artistic gain. No atlas/optical/margin/meniscus edit.'};
const save=()=>writeFile(path.join(qa,'eyelash151-native.json'),JSON.stringify(report,null,2)+'\n');
let browser,page,failure;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
 for(const strength of[0,1]){
  const result={strength,status:'Running',captures:{}};report.results.push(result);
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push({strength,type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')report.errors.push({strength,type:'console',message:m.text().slice(0,1800)});});
  await page.route('**/app.js',route=>route.fulfill({path:bundle,contentType:'text/javascript'}));
  const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('lash151',String(strength));
  await page.goto(url.href,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
  result.setup=await page.evaluate(async()=>{
   const p=window.portrait,q=window.eyelash151QA;if(!p.ready||!q)throw Error('151 preparation blocked: '+document.querySelector('#gate-message').textContent);
   p.setScore(151,78);p.startTurntable(false);p.setResolution(900,1200);p.setAntialiasing(2);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('ordinary-first-native-upload');
   return{...q.display(),metrics:q.metrics,sourceMeshes:q.audit.sourceMeshes,headMeshes:q.audit.headMeshes,sourceAttributes:q.audit.sourceAttributeCount,sourceTextures:q.audit.sourceTextureCount,exactRootVertices:q.audit.exactRootVertices,protected140:q.audit.protected140GeometryReferences,heapMiB:performance.memory?.usedJSHeapSize/1048576};
  });
  for(const view of views){
   const camera=await page.evaluate(async({view,fixed})=>{
    const p=window.portrait,q=window.eyelash151QA;
    if(fixed){p.setView('detail');[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom]=fixed.frustum;p.camera.zoom=fixed.zoom;p.camera.up.fromArray(fixed.up);p.camera.position.fromArray(fixed.position);p.controls.target.fromArray(fixed.target);p.camera.lookAt(p.controls.target);p.camera.updateProjectionMatrix();p.controls.update();}else p.setView(view);
    p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();q.display();
    return{position:p.camera.position.toArray(),target:p.controls.target.toArray(),up:p.camera.up.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom};
   },{view,fixed:cameras.cameras[view]||null});
   const file=`eyelash151-${strength}-${view}.png`,bytes=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file)});
   result.captures[view]={file:`output/qa/${file}`,bytes:bytes.length,sha256:hash(bytes),camera};
   if(strength&&JSON.stringify(camera)!==JSON.stringify(report.results[0].captures[view].camera))throw Error('151 matched camera differs on '+view);
  }
  await page.evaluate(()=>window.eyelash151QA.check('after-native-views'));
  const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);
  result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,frames);if(result.idleFrames!==0)throw Error('151 added idle rendering.');
  result.risk=await page.evaluate(()=>window.eyelash151QA.risk());
  result.cleanup=await page.evaluate(()=>window.eyelash151QA.cleanup('complete'));result.audit=await page.evaluate(()=>window.eyelash151QA.audit);
  await page.evaluate(async()=>{const p=window.portrait;p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
  const file=`eyelash151-${strength}-restored-front.png`,bytes=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file)});
  result.restoredFront={file:`output/qa/${file}`,bytes:bytes.length,sha256:hash(bytes),matchesOriginalOffCompositor:hash(bytes)===report.results[0].captures.front.sha256,interpretation:'Captured through the ordinary renderer after exact source geometry restoration. Encoded compositor equality is reported, not a hard full-page gate: prior tests observed tiny overlay-button differences. Any visible portrait difference requires review.'};
  if(report.errors.some(e=>e.strength===strength))throw Error('151 browser errors recorded.');
  result.status='Native source/geometry checks passed; art pending';await save();
  console.log(JSON.stringify({candidate:151,strength,status:result.status,helperMs:result.setup.metrics.elapsedMs,privateReplacementBytes:result.setup.metrics.privateAttributeBytes,rootVertices:result.setup.exactRootVertices,contacts:result.risk.contacts,sourceAttributes:result.setup.sourceAttributes,idleFrames:result.idleFrames,cleanup:result.cleanup,restoredCompositorExact:result.restoredFront.matchesOriginalOffCompositor}));
  await page.close();page=null;
 }
 report.status='Native OFF/ON source and geometry checks passed; independent visual decision pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
 if(page){
  const result=report.results.at(-1);
  try{result.preparationFailure=await page.evaluate(()=>window.eyelash151PreparationFailure||null);if(await page.evaluate(()=>!!window.eyelash151QA)){result.finalCleanup=await page.evaluate(()=>window.eyelash151QA.cleanup('finally'));result.audit=await page.evaluate(()=>window.eyelash151QA.audit);}}
  catch(error){result.cleanupFailure=String(error);failure||=error;}
  try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
 }
 try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
 if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:151,status:report.status,scoreUnchanged:78,errors:report.errors}));
