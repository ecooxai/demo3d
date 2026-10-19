import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Parent-only native OFF/ON comparison. Fresh pages use the ordinary accepted
// preparation/render path. No extra compileAsync, display sweep or fallback.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(qa,{recursive:true});
const main=await readFile(path.join(root,'src/main.js'),'utf8'),expectedMain='a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521',expectedGroom='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d';
const fieldConfig=JSON.parse(await readFile(path.join(root,'review/jaw-silhouette155-config.json'),'utf8'));
if(fieldConfig.baseMainSHA256!==expectedMain||hash(await readFile(path.join(root,'review/jaw-silhouette152-native.json')))!==fieldConfig.measurementSHA256)throw Error('155 actual152 projection provenance changed.');
const marker='state.eyeContour147=applyEyeContour147(anatomicalHead,{strength:1});';
if(hash(main)!==expectedMain||hash(await readFile(path.join(root,'src/hair-groom.js')))!==expectedGroom||main.split(marker).length!==2||main.includes('applyJawSilhouette155')||!main.includes('renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.4;'))throw Error('155 requires frozen accepted149 main/133 groom, full140/147 and Neutral1.4.');
const injection=marker+"\nwindow.jawSilhouette155QA=await prepareJawSilhouetteQA155({model,scene,hair:anatomicalHair,strength:Number(new URLSearchParams(location.search).get('jaw155')||0)});\nstate.jawSilhouette155=window.jawSilhouette155QA.metrics;";
const entry="import {prepareJawSilhouetteQA155} from '../review/jaw-silhouette155-native-qa.js';\n"+main.replace(marker,injection),bundle=path.join(qa,'app-jaw-silhouette155.js');
const built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'jaw-silhouette155-main-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent'});
const files=new Set(['src/main.js','review/jaw-silhouette155-native.mjs','review/jaw-silhouette155-config.json','review/jaw-silhouette152-native.json','package.json']);
for(const file of Object.keys(built.metafile.inputs))if(!file.includes('node_modules/')&&!file.endsWith('jaw-silhouette155-main-entry.js'))files.add(file);
const manifest={};for(const file of[...files].sort()){const bytes=await readFile(path.resolve(root,file));manifest[file]={bytes:bytes.length,sha256:hash(bytes)};}
const views=['front','detail','left','right','back','jaw','jaw-oblique'],report={candidate:155,status:'Running',scoreUnchanged:78,acceptedBase:149,modes:[0,1],views,files:manifest,
 display:{nativeWebGPU:true,toneMapping:7,exposure:1.4,resolution:[900,1200],internal:[1800,2400],antialiasing:2,lighting:'soft'},results:[],errors:[],
 interpretation:'Only the actual face and neck are changed by a common compact field. A broad10.5 percent low-order horizontal contraction uses gradual500to650 upper entry,760to880 lower release and the exact current-lip shield. Eleven152 sampled side records are comparison diagnostics only; there is no scattered target fit. The hidden chin control and occluded near lower rows are excluded. Native views judge the emitted jaw/neck shape and unchanged hair relationship.'};
const save=()=>writeFile(path.join(qa,'jaw-silhouette155-native.json'),JSON.stringify(report,null,2)+'\n');
let browser,page,failure,fixedCenter=null;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
 for(const strength of[0,1]){
  const result={strength,status:'Running',captures:{}};report.results.push(result);
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push({strength,type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')report.errors.push({strength,type:'console',message:m.text().slice(0,1800)});});
  await page.route('**/app.js',route=>route.fulfill({path:bundle,contentType:'text/javascript'}));
  const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('jaw155',String(strength));
  await page.goto(url.href,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
  result.setup=await page.evaluate(async()=>{
   const p=window.portrait,q=window.jawSilhouette155QA;
   if(!p.ready||!q)throw Error('155 preparation blocked: '+document.querySelector('#gate-message').textContent);
   p.setScore(155,78);p.startTurntable(false);p.setResolution(900,1200);p.setAntialiasing(2);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
   await q.check('ordinary-first-native-upload');
   return{...q.display(),metrics:q.metrics,closeCenter:q.closeCenter,sourceMeshes:q.audit.sourceMeshes,selectedMeshes:q.audit.selectedMeshes,sourceAttributes:q.audit.sourceAttributeCount,sourceTextures:q.audit.sourceTextureCount,zeroNormalsBefore:q.audit.zeroNormalsBefore,zeroNormalsAfter:q.audit.zeroNormalsAfter,accepted140GeometryReferenceExact:q.audit.accepted140GeometryReferenceExact,heapMiB:performance.memory?.usedJSHeapSize/1048576};
  });
  if(fixedCenter===null)fixedCenter=result.setup.closeCenter;
  if(result.setup.closeCenter.some((v,k)=>Math.abs(v-fixedCenter[k])>1e-8))throw Error('155 fresh-page OFF source camera anchor changed.');
  for(const view of views){
   const camera=await page.evaluate(async({view,center})=>{
    const p=window.portrait,q=window.jawSilhouette155QA;
    if(view==='jaw'||view==='jaw-oblique'){
     p.setView('detail');const target=p.model.position.clone().fromArray(center),span=1.68,aspect=p.state.width/p.state.height;
     p.camera.left=-span*aspect/2;p.camera.right=span*aspect/2;p.camera.top=span/2;p.camera.bottom=-span/2;p.camera.zoom=1;p.camera.up.set(0,1,0);
     p.camera.position.copy(target).add(p.model.position.clone().set(view==='jaw-oblique'?-3.2:0,0,8));p.controls.target.copy(target);p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();
    }else p.setView(view);
    p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();q.display();
    return{position:p.camera.position.toArray(),target:p.controls.target.toArray(),up:p.camera.up.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom};
   },{view,center:fixedCenter});
   const file=`jaw-silhouette155-${strength}-${view}.png`,bytes=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file)});
   result.captures[view]={file:`output/qa/${file}`,bytes:bytes.length,sha256:hash(bytes),camera};
   if(strength&&JSON.stringify(camera)!==JSON.stringify(report.results[0].captures[view].camera))throw Error('155 matched camera differs on '+view);
  }
  await page.evaluate(()=>window.jawSilhouette155QA.check('after-native-views'));
  const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);
  result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,frames);if(result.idleFrames!==0)throw Error('155 added idle rendering.');
  result.risk=await page.evaluate(()=>window.jawSilhouette155QA.risk());
  result.cleanup=await page.evaluate(()=>window.jawSilhouette155QA.cleanup('complete'));
  result.audit=await page.evaluate(()=>window.jawSilhouette155QA.audit);
  if(report.errors.some(e=>e.strength===strength))throw Error('155 browser errors recorded.');
  result.status='Native checks passed; art pending';await save();
  console.log(JSON.stringify({candidate:155,strength,status:result.status,helperMs:result.setup.metrics.elapsedMs,privateReplacementBytes:result.setup.metrics.privateAttributeBytes,sourceAttributes:result.setup.sourceAttributes,fieldCertificate:result.risk.fieldCertificate,orientation:result.risk.geometryRisk.orientation,idleFrames:result.idleFrames,cleanup:result.cleanup}));
  await page.close();page=null;
 }
 report.status='Native OFF/ON checks passed; independent visual decision pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
 if(page){
  const result=report.results.at(-1);
  try{result.preparationFailure=await page.evaluate(()=>window.jawSilhouette155PreparationFailure||null);if(await page.evaluate(()=>!!window.jawSilhouette155QA)){result.finalCleanup=await page.evaluate(()=>window.jawSilhouette155QA.cleanup('finally'));result.audit=await page.evaluate(()=>window.jawSilhouette155QA.audit);}}
  catch(error){result.cleanupFailure=String(error);failure||=error;}
  try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
 }
 try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
 if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:155,status:report.status,scoreUnchanged:78,errors:report.errors}));
