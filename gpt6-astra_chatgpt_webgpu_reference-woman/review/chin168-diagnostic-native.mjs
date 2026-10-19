import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// A narrow causal diagnostic after162's visible art rejection. Reuse the
// exact already-tested162 application. Geometry/UVs/maps/lights stay fixed.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(path.join(root,'review/chin168-manifest.json'),'utf8'));
for(const[file,row]of Object.entries(manifest.files)){const d=await readFile(path.join(root,file));if(d.length!==row.bytes||sha(d)!==row.sha256)throw Error('168 frozen dependency differs: '+file);}
const reg=JSON.parse(await readFile(path.join(root,'review/chin162-baseline164.json'),'utf8'));
for(const[file,row]of Object.entries(reg.files)){const d=await readFile(path.join(root,file));if(d.length!==row.bytes||sha(d)!==row.sha256)throw Error('168 inherited162 dependency differs: '+file);}
const sourceReport=JSON.parse(await readFile(path.join(root,'review/chin162-native-report.json'),'utf8'));
if(sourceReport.status!=='Native OFF/ON checks complete; independent coarse visual decision pending'||sourceReport.errors.length)throw Error('168 needs the completed frozen162 native evidence.');
const bundle=path.join(qa,'app-chin162.js'),bundleBytes=await readFile(bundle);
if(bundleBytes.length!==sourceReport.build.bytes||sha(bundleBytes)!==sourceReport.build.sha256)throw Error('168 prior162 application bundle differs.');
await mkdir(qa,{recursive:true});
const diagnostic=await build({absWorkingDir:root,stdin:{contents:"import {createChin168Diagnostic} from './review/chin168-diagnostic-qa.js'; window.createChin168Diagnostic=createChin168Diagnostic;",resolveDir:root,sourcefile:'chin168-entry.js'},bundle:true,format:'iife',target:['es2022'],minify:true,write:false,logLevel:'silent'});
const diagJS=diagnostic.outputFiles[0].contents,html=await readFile(path.join(root,'index.html')),css=await readFile(path.join(root,'src/style.css'));
const cameras={jaw:{position:[.008,2.1000000000000005,8.3],target:[.008,2.1,.3]},'jaw-oblique':{position:[-3.192,2.1,8.300000000000002],target:[.008,2.1,.3]}};
const report={iteration:168,acceptedBase:164,score:78,candidateUnderStudy:162,status:'Running',errors:[],cases:[],
  source:{report:manifest.files['review/chin162-native-report.json'],bundle:sourceReport.build,files:manifest.files},
  diagnosticBundle:{bytes:diagJS.length,sha256:sha(diagJS)},
  scope:'Uniform lit clay removes maps and vertex color on face, neck and optional162 band. Unlit retains existing maps and vertex colors while removing studio-light response. Fixed two cameras, native WebGPU, original162 geometry and maps. Diagnostic only; no production promotion or score increase.'};
const out=path.join(qa,'chin168-diagnostic-native.json'),save=()=>writeFile(out,JSON.stringify(report,null,2)+'\n');
let browser,page,failure;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
 for(const strength of[0,1]){
  const r={strength,captures:{}};report.cases.push(r);
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push({strength,type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')report.errors.push({strength,type:'console',message:m.text().slice(0,1800)});});
  const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('hair','groom');url.searchParams.set('chin162',String(strength));
  await page.route(url.origin+'/?**',route=>route.fulfill({body:html,contentType:'text/html'}));
  await page.route('**/app.js',route=>route.fulfill({body:bundleBytes,contentType:'text/javascript'}));
  await page.route('**/style.css',route=>route.fulfill({body:css,contentType:'text/css'}));
  await page.goto(url.href,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
  r.setup=await page.evaluate(async()=>{const p=window.portrait,q=window.chin162QA;if(!p?.ready||!q)throw Error('168 native WebGPU preparation blocked.');p.startTurntable(false);p.setResolution(900,1200);p.setAntialiasing(2);p.setScore(168,78);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('168-original-before-diagnostic',{hashImages:true});return{display:q.display(),metrics:q.metrics};});
  const capture=async key=>{const file='chin168-'+strength+'-'+key+'.png',d=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});const row={file:'output/qa/'+file,bytes:d.length,sha256:sha(d)};r.captures[key]=row;return row;};
  const original=await capture('original-front');
  await page.addScriptTag({content:Buffer.from(diagJS).toString('utf8')});
  r.diagnosticSetup=await page.evaluate(async()=>{window.chin168=window.createChin168Diagnostic(window.portrait.model);return window.chin168.begin();});
  for(const mode of['clay','unlit'])for(const[view,camera]of Object.entries(cameras)){
   const frame=await page.evaluate(async({mode,camera})=>{const p=window.portrait,d=window.chin168;d.setMode(mode);p.setView('detail');p.camera.left=-.63;p.camera.right=.63;p.camera.top=.84;p.camera.bottom=-.84;p.camera.zoom=1;p.camera.up.set(0,1,0);p.camera.position.fromArray(camera.position);p.controls.target.fromArray(camera.target);p.camera.lookAt(p.controls.target);p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await d.check('168-'+mode);return{position:p.camera.position.toArray(),target:p.controls.target.toArray(),up:p.camera.up.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom};},{mode,camera});
   const key=mode+'-'+view,c=await capture(key);c.camera=frame;
   if(strength&&JSON.stringify(frame)!==JSON.stringify(report.cases[0].captures[key].camera))throw Error('168 comparison camera differs: '+key);
  }
  const n=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);r.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,n);if(r.idleFrames)throw Error('168 unexpected idle rendering.');
  r.diagnosticCleanup=await page.evaluate(async()=>{const p=window.portrait,d=window.chin168;const result=await d.finish();await window.chin162QA.check('168-materials-restored',{hashImages:true});p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();return result;});
  r.diagnosticAudit=await page.evaluate(()=>window.chin168.audit);
  const restored=await capture('restored-original-front');r.materialRestoredFrontExact=restored.sha256===original.sha256;
  r.sourceCleanup=await page.evaluate(()=>window.chin162QA.finish('168-complete'));r.sourceAudit=await page.evaluate(()=>window.chin162QA.audit);
  if(report.errors.some(x=>x.strength===strength))throw Error('168 browser errors.');
  r.status='Diagnostic complete; visual interpretation pending';await save();
  console.log(JSON.stringify({iteration:168,strength,status:r.status,materialRestoredFrontExact:r.materialRestoredFrontExact,idleFrames:r.idleFrames,diagnosticCleanup:r.diagnosticCleanup,sourceCleanup:r.sourceCleanup}));
  await page.close();page=null;
 }
 report.status='Complete; diagnostic interpretation pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
 if(page){const r=report.cases.at(-1);try{r.finalCleanup=await page.evaluate(async()=>{const d=window.chin168;let diagnostic;if(d)diagnostic=await d.finish();const source=await window.chin162QA?.finish('168-finally');return{diagnostic,source};});}catch(error){r.cleanupFailure=String(error);failure||=error;}try{await page.close();}catch(error){failure||=error;}}
 try{await browser?.close();}catch(error){failure||=error;report.browserCloseFailure=String(error);}
 if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({iteration:168,status:report.status,score:78,errors:report.errors}));
