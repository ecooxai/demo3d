import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),hash=b=>createHash('sha256').update(b).digest('hex');
const main=await readFile(path.join(root,'src/main.js'),'utf8');
if(hash(main)!=='03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5')throw Error('160 requires accepted157 main.');
const selectedBytes=await readFile(path.join(root,'review/integrated157-native.json'));
if(hash(selectedBytes)!=='757df6877443afb227f90e539b7456b5f07e28aa32a2e7491dadd3f31ee2caa5')throw Error('160 requires actual157 evidence.');
const sourceManifest=JSON.parse(await readFile(path.join(root,'review/integrated157-manifest.json'),'utf8'));
for(const r of sourceManifest.files.filter(r=>r.file.startsWith('src/')||r.file.startsWith('reference/')||r.file==='package.json'))if(hash(await readFile(path.join(root,r.file)))!==r.sha256)throw Error('160 source guard: '+r.file);
const jawBytes=await readFile(path.join(root,'review/jaw-silhouette155-native.json'));
if(hash(jawBytes)!=='e9f57d86ea02ea24d5271a71f516f4e5b0266e95eaa6b057b6877f254da0921a')throw Error('160 fixed camera provenance changed.');
const jaw=JSON.parse(jawBytes),views=['jaw','jaw-oblique'].map(name=>({name,camera:jaw.results[0].captures[name].camera}));
const marker='state.eyelash151=applyEyelash151(anatomicalHead,{strength:1});';if(main.split(marker).length!==2)throw Error('160 preparation marker changed.');
const entry="import {createChin160Diagnostic} from '../review/chin160-diagnostic-qa.js';\n"+main.replace(marker,marker+'\n      window.chin160=createChin160Diagnostic(model);');
await mkdir(qa,{recursive:true});const bundle=path.join(qa,'app-chin160-diagnostic.js');
await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'chin160-diagnostic-entry.js',loader:'js'},outfile:bundle,bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},logLevel:'silent'});
const report={iteration:160,acceptedBase:157,score:78,status:'Running',scope:'Read-only actual chin/neck material isolation. Geometry, source maps, lights and ordinary preparation stay fixed. No candidate is being adopted.',files:{},views,cases:[],errors:[]};
for(const n of ['src/main.js','review/chin160-diagnostic-qa.js','review/chin160-diagnostic-native.mjs','review/integrated157-native.json','review/jaw-silhouette155-native.json']){const b=await readFile(path.join(root,n));report.files[n]={bytes:b.length,sha256:hash(b)};}
const output=path.join(qa,'chin160-diagnostic-native.json'),save=()=>writeFile(output,JSON.stringify(report,null,2)+'\n');
let browser,page,failure;
try{
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
 page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text().slice(0,1500));});
 await page.route('**/app.js',r=>r.fulfill({path:bundle,contentType:'text/javascript'}));await page.goto('http://127.0.0.1:8766/?backend=webgpu',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:60000});
 report.setup=await page.evaluate(async()=>{const p=window.portrait;if(!p.ready||!p.renderer.backend?.isWebGPUBackend)throw Error('Native WebGPU unavailable; no automatic fallback.');p.startTurntable(false);p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();const r=await window.chin160.begin();p.setScore(160,78);return r;});
 async function setCamera(view){return page.evaluate(async view=>{const p=window.portrait,c=view.camera;p.setView('detail');p.controls.target.fromArray(c.target);p.camera.position.fromArray(c.position);p.camera.up.fromArray(c.up);[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom]=c.frustum;p.camera.zoom=c.zoom;p.camera.lookAt(p.controls.target);p.camera.updateProjectionMatrix();p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();return{position:p.camera.position.toArray(),target:p.controls.target.toArray(),up:p.camera.up.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom};},view);}
 for(const mode of ['original','clay','unlit']){
  await page.evaluate(mode=>window.chin160.setMode(mode),mode);const row={mode,captures:[]};
  for(const view of views){const camera=await setCamera(view);const file='chin160-'+mode+'-'+view.name+'.png';const b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});row.captures.push({view:view.name,camera,file:'output/qa/'+file,bytes:b.length,sha256:hash(b)});}
  row.integrity=await page.evaluate(mode=>window.chin160.check('captured-'+mode),mode);report.cases.push(row);await save();
 }
 await page.evaluate(()=>window.chin160.restore());const camera=await setCamera(views[0]),b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,'chin160-restored-jaw.png'),animations:'disabled'});
 report.restoration={camera,file:'output/qa/chin160-restored-jaw.png',bytes:b.length,sha256:hash(b),matchesOriginalJaw:hash(b)===report.cases[0].captures[0].sha256};if(!report.restoration.matchesOriginalJaw)throw Error('160 restored image differs.');
 report.cleanup=await page.evaluate(()=>window.chin160.finish());report.audit=await page.evaluate(()=>window.chin160.audit);
 const before=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);report.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,before);if(report.idleFrames||report.errors.length)throw Error('160 errors or idle rendering.');report.status='Passed; diagnosis pending visual inspection';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
 if(page){try{report.finalCleanup=await page.evaluate(async()=>window.chin160?await window.chin160.finish():null);}catch(e){report.cleanupFailure=String(e);failure||=e;}try{await page.close();}catch(e){failure||=e;}}
 try{await browser?.close();}catch(e){failure||=e;}if(failure)report.status='Failed';await save();
}
if(failure)throw failure;console.log(JSON.stringify({iteration:160,status:report.status,captures:report.cases.reduce((n,r)=>n+r.captures.length,0),restoredPNGExact:report.restoration.matchesOriginalJaw,cleanup:report.cleanup,idleFrames:report.idleFrames,errors:report.errors}));
