import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root-only native OFF/ON159. The live157 preparation and ordinary rendering
// path are preserved. No field-grid rerun, extra compileAsync or fallback.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),sha=b=>createHash('sha256').update(b).digest('hex'),
  baselineName='review/jaw-ear159-baseline.json',baseline=JSON.parse(await readFile(path.join(root,baselineName),'utf8')),
  expectedMain='03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5',
  original155Name='review/jaw-silhouette155-native.json',original155SHA='e9f57d86ea02ea24d5271a71f516f4e5b0266e95eaa6b057b6877f254da0921a';
if(baseline.acceptedBase!==157||baseline.mainSHA256!==expectedMain)throw Error('159 requires the frozen accepted157 registry.');
for(const[file,expected]of Object.entries(baseline.files)){const b=await readFile(path.join(root,file));if(b.length!==expected.bytes||sha(b)!==expected.sha256)throw Error('159 baseline/dependency changed: '+file);}
const b155=await readFile(path.join(root,original155Name));if(b155.length!==337654||sha(b155)!==original155SHA)throw Error('159 requires actual155 output/certificate provenance.');
const actual155=JSON.parse(b155),original=actual155.results.find(q=>q.strength===1),selectedLabels=new Set(['anatomical-head/continuous-face','original-neck-and-clavicle-transition/neck-smooth-anatomical-surface','left-ear/ear-continuous-anatomical-shell','right-ear/ear-continuous-anatomical-shell']),
  expected={source:original.audit.sourceAttributes.filter(r=>selectedLabels.has(r.label)),faceNeck:original.audit.privateAttributes,certificate:original.risk.fieldCertificate,
    certificateSource:{file:original155Name,bytes:b155.length,sha256:original155SHA,qualification:'Same frozen field/config and exact current mouth bounds. Reuse the complete155 certificate; do not rerun its grid.'}};
if(expected.source.length!==20||expected.faceNeck.length!==10||!(expected.certificate.certifiedMinimumDeterminant>.02))throw Error('159 actual155 parity/certificate inventory changed.');
const main=await readFile(path.join(root,'src/main.js'),'utf8'),marker='state.eyelash151=applyEyelash151(anatomicalHead,{strength:1});';
if(sha(main)!==expectedMain||main.split(marker).length!==2||main.includes('applyJawSilhouette155')||main.includes('applyJawEar159'))throw Error('159 requires complete157 before any jaw integration.');
const injection=marker+'\nwindow.jawEar159QA=await prepareJawEarQA159({model,hair:anatomicalHair,state,strength:Number(new URLSearchParams(location.search).get("jawEar159")||0),expected:'+JSON.stringify(expected)+'});\nstate.jawEar159=window.jawEar159QA.metrics;',
  entry="import {prepareJawEarQA159} from '../review/jaw-ear159-native-qa.js';\n"+main.replace(marker,injection),bundle=path.join(qa,'app-jaw-ear159.js');
await mkdir(qa,{recursive:true});
const built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'jaw-ear159-main-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent'});
const names=new Set(['src/main.js','review/jaw-ear159-native.mjs',baselineName,original155Name,'review/integrated157-native.json','package.json']);
for(const f of Object.keys(built.metafile.inputs))if(!f.includes('node_modules/')&&!f.endsWith('jaw-ear159-main-entry.js'))names.add(f);
const files={};for(const f of[...names].sort()){const b=await readFile(path.resolve(root,f));files[f]={bytes:b.length,sha256:sha(b)};}
const views=['front','detail','left','right','back','ear-oblique'],report={candidate:159,acceptedBase:157,scoreUnchanged:78,status:'Running',modes:[0,1],views,files,results:[],errors:[],
  display:{nativeWebGPU:true,toneMapping:7,exposure:1.4,resolution:[900,1200],internal:[1800,2400],antialiasing:2,lighting:'soft'},
  scope:'Exact155 face/neck plus the same common field on both actual prepared ear shells. OFF/ON ordinary views and one fixed OFF lower-inner far-ear oblique. Existing155 global certificate and output hashes are reused; new risk is emitted ear geometry, co-moving face attachment and fixed hair contacts.'};
const output=path.join(qa,'jaw-ear159-native.json'),save=()=>writeFile(output,JSON.stringify(report,null,2)+'\n');
let browser,page,failure,fixedCenter=null;
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
  for(const strength of[0,1]){
    const result={strength,status:'Running',captures:{}};report.results.push(result);
    page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
    page.on('pageerror',e=>report.errors.push({strength,type:'pageerror',message:e.message}));
    page.on('console',m=>{if(m.type()==='error')report.errors.push({strength,type:'console',message:m.text().slice(0,1800)});else if(m.text().startsWith('jaw-ear159 '))console.log(m.text());});
    await page.route('**/app.js',r=>r.fulfill({path:bundle,contentType:'text/javascript'}));
    const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('hair','groom');url.searchParams.set('jawEar159',String(strength));
    await page.goto(url.href,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
    result.setup=await page.evaluate(async()=>{const p=window.portrait,q=window.jawEar159QA;if(!q||!p?.ready)throw Error('159 preparation blocked: '+document.querySelector('#gate-message').textContent);
      q.display();p.startTurntable(false);p.setScore(159,78);p.setResolution(900,1200);p.setAntialiasing(2);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('ordinary-first-native-upload');
      return{display:q.display(),metrics:q.metrics,closeCenter:q.closeCenter,sourceBindings:q.audit.sourceMeshBindings,sourceAttributes:q.audit.sourceAttributeCount,faceNeckParity:q.audit.faceNeckOutputParityWith155,certificateReuse:q.audit.certificateReuse};});
    if(fixedCenter===null)fixedCenter=result.setup.closeCenter;
    if(result.setup.closeCenter.some((v,k)=>Math.abs(v-fixedCenter[k])>1e-8))throw Error('159 fixed OFF ear anchor differs between fresh pages.');
    for(const view of views){
      const camera=await page.evaluate(async({view,center})=>{const p=window.portrait;
        if(view==='ear-oblique'){
          p.setView('detail');const target=p.model.position.clone().fromArray(center),span=1.10,aspect=p.state.width/p.state.height;
          p.camera.left=-span*aspect/2;p.camera.right=span*aspect/2;p.camera.top=span/2;p.camera.bottom=-span/2;p.camera.zoom=1;p.camera.up.set(0,1,0);
          p.camera.position.copy(target).add(p.model.position.clone().set(-3.2,0,8));p.controls.target.copy(target);p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();
        }else p.setView(view);
        p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();window.jawEar159QA.display();
        return{position:p.camera.position.toArray(),target:p.controls.target.toArray(),up:p.camera.up.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom};
      },{view,center:fixedCenter});
      const file=`jaw-ear159-${strength}-${view}.png`,b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file)});
      result.captures[view]={file:'output/qa/'+file,bytes:b.length,sha256:sha(b),camera};
      if(strength&&JSON.stringify(camera)!==JSON.stringify(report.results[0].captures[view].camera))throw Error('159 matched camera changed: '+view);
    }
    await page.evaluate(()=>window.jawEar159QA.check('after-native-views'));
    result.risk=await page.evaluate(()=>window.jawEar159QA.risk());await save();
    const n=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,n);
    if(result.idleFrames!==0)throw Error('159 added idle rendering.');
    result.restoration=await page.evaluate(async()=>{const p=window.portrait,q=window.jawEar159QA,r=await q.restore();p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('ordinary-restored-source-upload');return r;});
    result.cleanup=await page.evaluate(()=>window.jawEar159QA.finish());result.audit=await page.evaluate(()=>window.jawEar159QA.audit);
    if(report.errors.some(e=>e.strength===strength))throw Error('159 browser errors recorded.');
    result.status='Native source/geometry/resource checks complete; interface and art decision pending';await save();
    console.log(JSON.stringify({candidate:159,strength,status:result.status,helperMs:result.setup.metrics.elapsedMs,privateReplacementBytes:result.setup.metrics.privateAttributeBytes,
      ears:result.risk.interfaces?.earDirectionalSupport.map(r=>({ear:r.ear,baselineBand:r.baselineWithinAttachmentBand,released:r.releasedBaselineAttachmentSamples,lostHits:r.baselineAttachmentLostFaceHit,maxAfterOffset:r.maximumAfterOffsetOfBaselineAttachmentSamples})),orientation:result.risk.geometry?.orientation,idleFrames:result.idleFrames,cleanup:result.cleanup}));
    await page.close();page=null;
  }
  report.status='Native OFF/ON checks complete; independent interface and visual interpretation pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
  if(page){const result=report.results.at(-1);
    try{result.preparationFailure=await page.evaluate(()=>window.jawEar159PreparationFailure||null);
      if(await page.evaluate(()=>!!window.jawEar159QA)){result.finalCleanup=await page.evaluate(()=>window.jawEar159QA.finish('finally'));result.audit=await page.evaluate(()=>window.jawEar159QA.audit);}}
    catch(error){result.cleanupFailure=String(error);failure||=error;}
    try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
  }
  try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
  if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:159,status:report.status,scoreUnchanged:78,errors:report.errors}));
