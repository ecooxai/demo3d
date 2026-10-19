import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root-only native execution. One fresh accepted149 scene retains its actual
// OFF geometry, applies frozen155 once, and checks only the pending interfaces.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),hash=b=>createHash('sha256').update(b).digest('hex');
const baselineFile='review/jaw-silhouette155-native.json',baselineBytes=await readFile(path.join(root,baselineFile)),
  expectedNative='e9f57d86ea02ea24d5271a71f516f4e5b0266e95eaa6b057b6877f254da0921a',expectedMain='a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521';
if(baselineBytes.length!==337654||hash(baselineBytes)!==expectedNative)throw Error('155 interface requires the exact actual155 native report and source manifest.');
const baseline=JSON.parse(baselineBytes),required=Object.entries(baseline.files).filter(([f])=>f.startsWith('src/')||f.startsWith('reference/')||f==='package.json'||['review/jaw-silhouette-candidate155.js','review/jaw-silhouette155-field.js','review/jaw-silhouette155-config.json'].includes(f));
for(const [file,expected]of required){const bytes=await readFile(path.resolve(root,file));if(bytes.length!==expected.bytes||hash(bytes)!==expected.sha256)throw Error('155 interface frozen source changed: '+file);}
const main=await readFile(path.join(root,'src/main.js'),'utf8'),marker='state.eyeContour147=applyEyeContour147(anatomicalHead,{strength:1});';
if(hash(main)!==expectedMain||main.split(marker).length!==2||main.includes('applyJawSilhouette155'))throw Error('155 interface requires unchanged149 preparation and one accepted147 marker.');
const views=['detail','jaw-oblique'].map(name=>{const c=baseline.results[0].captures[name].camera;return{name,towardCamera:c.position.map((v,k)=>v-c.target[k]),up:c.up};});
if(views.some(v=>v.towardCamera.some(x=>!Number.isFinite(x))))throw Error('155 interface source camera is invalid.');
const entry="import {prepareJaw155InterfaceQA} from '../review/jaw155-interface-qa.js';\n"+main.replace(marker,marker+
  '\nwindow.jaw155InterfaceQA=await prepareJaw155InterfaceQA({model,views:'+JSON.stringify(views)+'});\nstate.jawSilhouette155=window.jaw155InterfaceQA.metrics;');
await mkdir(qa,{recursive:true});const bundle=path.join(qa,'app-jaw155-interface.js');
const built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'jaw155-interface-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent'});
const names=new Set(['src/main.js',baselineFile,'review/jaw155-interface-native.mjs','package.json']);
for(const file of Object.keys(built.metafile.inputs))if(!file.includes('node_modules/')&&!file.endsWith('jaw155-interface-entry.js'))names.add(file);
const files={};for(const name of[...names].sort()){const b=await readFile(path.resolve(root,name));files[name]={bytes:b.length,sha256:hash(b)};}
const report={candidate:155,acceptedBase:149,acceptedScore:78,status:'Running',sourceNative:{file:baselineFile,bytes:baselineBytes.length,sha256:expectedNative},files,
  cameraDirections:views,rendering:'Ordinary native WebGPU, Neutral1.4,900×1200,AA2. No added compileAsync or full-view captures.',
  pair:'One prepared scene; OFF comes from retained pre155 source geometries and ON from the exact frozen155 replacement, under the same unchanged mesh frames.',errors:[]};
const output=path.join(qa,'jaw155-interface-native.json'),save=()=>writeFile(output,JSON.stringify(report,null,2)+'\n');
let browser,page,failure;
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push({type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text().slice(0,1800)});else if(m.text().startsWith('jaw155-interface '))console.log(m.text());});
  await page.route('**/app.js',r=>r.fulfill({path:bundle,contentType:'text/javascript'}));
  const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('hair','groom');
  await page.goto(url.href,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
  report.setup=await page.evaluate(async()=>{const p=window.portrait,q=window.jaw155InterfaceQA;if(!q||!p?.ready)throw Error('155 interface preparation blocked: '+document.querySelector('#gate-message').textContent);
    q.display();p.startTurntable(false);p.setScore(155,78);p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('ordinary-first-native-upload');
    return{display:q.display(),helper:q.metrics,sourceBindings:q.audit.sourceMeshBindings,sourcePositionIndexStamps:q.audit.sourcePositionIndexStamps,obstacles:q.audit.obstacleInventory};});
  await save();
  report.interfaces=await page.evaluate(async()=>{const q=window.jaw155InterfaceQA,result=await q.inspect();await q.check('after-interface-measurements');return result;});
  await save();
  const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);report.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,frames);
  if(report.idleFrames!==0)throw Error('155 interface added idle rendering.');
  report.restoration=await page.evaluate(async()=>{const p=window.portrait,q=window.jaw155InterfaceQA,r=await q.restore();p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('ordinary-restored-source-upload');return r;});
  report.cleanup=await page.evaluate(()=>window.jaw155InterfaceQA.finish());
  report.audit=await page.evaluate(()=>window.jaw155InterfaceQA.audit);
  if(report.errors.length)throw Error('155 interface browser errors recorded.');
  report.status='Native interface measurements and source/cleanup checks complete; contact and support findings require interpretation.';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
  if(page){
    try{report.preparationFailure=await page.evaluate(()=>window.jaw155InterfacePreparationFailure||null);
      if(await page.evaluate(()=>!!window.jaw155InterfaceQA)){report.finalCleanup=await page.evaluate(()=>window.jaw155InterfaceQA.finish('finally'));report.audit=await page.evaluate(()=>window.jaw155InterfaceQA.audit);}
    }catch(error){report.cleanupFailure=String(error);failure||=error;}
    try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
  }
  try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
  if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:155,status:report.status,score:78,totals:report.interfaces?.totals,
  earSupport:report.interfaces?.earDirectionalSupport.map(r=>({ear:r.ear,baselineWithinAttachmentBand:r.baselineWithinAttachmentBand,becameOutsideAttachmentBand:r.becameOutsideAttachmentBand,lostAfterFaceHit:r.baselineAttachmentLostFaceHit,releasedAttachmentSamples:r.releasedBaselineAttachmentSamples,maximumAfterOffset:r.maximumAfterOffsetOfBaselineAttachmentSamples})),
  earRays:report.interfaces?.earFaceOnlyRays.map(r=>({ear:r.ear,view:r.view,newlyFaceUncoveredSamples:r.newlyFaceUncoveredSamples})),
  elapsedMs:report.interfaces?.elapsedMs,temporaryAllocations:report.interfaces?.allocations,idleFrames:report.idleFrames,cleanup:report.cleanup,errors:report.errors}));
