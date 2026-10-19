import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Two additional images only. Reuse the completed159 bundle/preparation and
// its fixed OFF center/span. The camera offset changes from[-3.2,0,8] to
//[+3.2,0,8]. No interface audit, field grid, geometry edit or other view sweep.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),sha=b=>createHash('sha256').update(b).digest('hex'),
  actualName='review/jaw-ear159-native.json',actualBytes=375938,actualSHA='3c3a08201ad8397462b7e7f7d68d1421aa66352cb2a6e54f81cf612f984155f9',
  expectedMain='03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5';
const actualBuffer=await readFile(path.join(root,actualName));
if(actualBuffer.length!==actualBytes||sha(actualBuffer)!==actualSHA)throw Error('159 visibility requires the completed frozen native159 report.');
const actual=JSON.parse(actualBuffer),originalModes=new Map(actual.results.map(r=>[r.strength,r]));
if(actual.acceptedBase!==157||actual.scoreUnchanged!==78||actual.errors.length||originalModes.size!==2)throw Error('159 visibility completed source provenance changed.');
for(const[file,expected]of Object.entries(actual.files)){const b=await readFile(path.join(root,file));if(b.length!==expected.bytes||sha(b)!==expected.sha256)throw Error('159 visibility frozen runtime input changed: '+file);}

// The entry below is byte-identical to the completed159 entry construction.
// Rebuild in memory using its same sourcefile/outfile settings, demand equality
// with the existing compiled bundle, then route those existing bytes unchanged.
const baselineName='review/jaw-ear159-baseline.json',baseline=JSON.parse(await readFile(path.join(root,baselineName),'utf8')),
  original155Name='review/jaw-silhouette155-native.json',original155SHA='e9f57d86ea02ea24d5271a71f516f4e5b0266e95eaa6b057b6877f254da0921a';
if(baseline.acceptedBase!==157||baseline.mainSHA256!==expectedMain)throw Error('159 visibility requires accepted157.');
for(const[file,expected]of Object.entries(baseline.files)){const b=await readFile(path.join(root,file));if(b.length!==expected.bytes||sha(b)!==expected.sha256)throw Error('159 visibility baseline/dependency changed: '+file);}
const b155=await readFile(path.join(root,original155Name));if(b155.length!==337654||sha(b155)!==original155SHA)throw Error('159 visibility actual155 provenance changed.');
const actual155=JSON.parse(b155),original=actual155.results.find(q=>q.strength===1),selectedLabels=new Set(['anatomical-head/continuous-face','original-neck-and-clavicle-transition/neck-smooth-anatomical-surface','left-ear/ear-continuous-anatomical-shell','right-ear/ear-continuous-anatomical-shell']),
  expected={source:original.audit.sourceAttributes.filter(r=>selectedLabels.has(r.label)),faceNeck:original.audit.privateAttributes,certificate:original.risk.fieldCertificate,
    certificateSource:{file:original155Name,bytes:b155.length,sha256:original155SHA,qualification:'Same frozen field/config and exact current mouth bounds. Reuse the complete155 certificate; do not rerun its grid.'}};
if(expected.source.length!==20||expected.faceNeck.length!==10||!(expected.certificate.certifiedMinimumDeterminant>.02))throw Error('159 visibility actual155 certificate inventory changed.');
const main=await readFile(path.join(root,'src/main.js'),'utf8'),marker='state.eyelash151=applyEyelash151(anatomicalHead,{strength:1});';
if(sha(main)!==expectedMain||main.split(marker).length!==2||main.includes('applyJawSilhouette155')||main.includes('applyJawEar159'))throw Error('159 visibility requires unchanged complete157.');
const injection=marker+'\nwindow.jawEar159QA=await prepareJawEarQA159({model,hair:anatomicalHair,state,strength:Number(new URLSearchParams(location.search).get("jawEar159")||0),expected:'+JSON.stringify(expected)+'});\nstate.jawEar159=window.jawEar159QA.metrics;',
  entry="import {prepareJawEarQA159} from '../review/jaw-ear159-native-qa.js';\n"+main.replace(marker,injection),bundle=path.join(qa,'app-jaw-ear159.js');
const built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'jaw-ear159-main-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent',write:false}),
  previousBundle=await readFile(bundle),rebuilt=built.outputFiles.find(f=>path.resolve(f.path)===bundle)?.contents;
if(!rebuilt||rebuilt.length!==previousBundle.length||sha(rebuilt)!==sha(previousBundle))throw Error('159 visibility refuses a bundle different from completed159. Existing compiled files were not overwritten.');
const fixedCenter=originalModes.get(0).setup.closeCenter,span=1.10,offset=[3.2,0,8];
for(const r of originalModes.values())if(r.setup.closeCenter.some((v,k)=>Math.abs(v-fixedCenter[k])>1e-12))throw Error('159 completed OFF/ON centers disagree.');
const report={candidate:159,study:'opposite-side ear visibility only',acceptedBase:157,scoreUnchanged:78,status:'Running',
  provenance:{nativeReport:{file:actualName,bytes:actualBytes,sha256:actualSHA},wrapper:{file:'review/jaw-ear159-visibility-native.mjs',sha256:sha(await readFile(path.join(root,'review/jaw-ear159-visibility-native.mjs')))},
    existingBundle:{file:'output/qa/app-jaw-ear159.js',bytes:previousBundle.length,sha256:sha(previousBundle),inMemoryRebuildExact:true,originalBundleOverwritten:false},guardedRuntimeFiles:actual.files},
  camera:{fixedCenter,span,offset,source:'Same completed159 OFF lower-inner right-ear anchor and orthographic span; only the sign of camera X offset changes.'},
  scope:'Exactly one additional ear view in each fresh OFF/ON state. The original159 preparation, geometry, materials, maps, light and source checks remain. No q.risk call, interface audit, field certificate grid or other art views. Hair remains visible and untouched.',results:[],errors:[]};
await mkdir(qa,{recursive:true});
const output=path.join(qa,'jaw-ear159-visibility-native.json'),save=()=>writeFile(output,JSON.stringify(report,null,2)+'\n');
let browser,page,failure;
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
  for(const strength of[0,1]){
    const result={strength,status:'Running'};report.results.push(result);
    page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
    page.on('pageerror',e=>report.errors.push({strength,type:'pageerror',message:e.message}));
    page.on('console',m=>{if(m.type()==='error')report.errors.push({strength,type:'console',message:m.text().slice(0,1800)});});
    await page.route('**/app.js',r=>r.fulfill({body:previousBundle,contentType:'text/javascript'}));
    const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('hair','groom');url.searchParams.set('jawEar159',String(strength));
    await page.goto(url.href,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
    result.setup=await page.evaluate(async()=>{const p=window.portrait,q=window.jawEar159QA;if(!q||!p?.ready)throw Error('159 visibility preparation blocked: '+document.querySelector('#gate-message').textContent);
      q.display();if(p.state.iteration!==157||p.state.score!==78)throw Error('159 visibility requires accepted157 before review scoring.');
      p.startTurntable(false);p.setScore(159,78);p.setResolution(900,1200);p.setAntialiasing(2);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('visibility-first-native-upload');
      return{display:q.display(),metrics:q.metrics,closeCenter:q.closeCenter,sourceAttributes:q.audit.sourceAttributes,privateAttributes:q.audit.privateAttributes,certificateReuse:q.audit.certificateReuse};});
    const old=originalModes.get(strength);
    if(result.setup.closeCenter.some((v,k)=>Math.abs(v-fixedCenter[k])>1e-10))throw Error('159 visibility live OFF anchor changed.');
    if(JSON.stringify(result.setup.sourceAttributes)!==JSON.stringify(old.audit.sourceAttributes)||JSON.stringify(result.setup.privateAttributes)!==JSON.stringify(old.audit.privateAttributes))throw Error('159 visibility live source/private attributes differ from completed159.');
    result.exactAttributeParity={source:result.setup.sourceAttributes.length,private:result.setup.privateAttributes.length,matchesCompleted159:true};delete result.setup.sourceAttributes;delete result.setup.privateAttributes;
    result.camera=await page.evaluate(async({center,span,offset})=>{const p=window.portrait;p.setView('detail');
      const target=p.model.position.clone().fromArray(center),aspect=p.state.width/p.state.height;
      p.camera.left=-span*aspect/2;p.camera.right=span*aspect/2;p.camera.top=span/2;p.camera.bottom=-span/2;p.camera.zoom=1;p.camera.up.set(0,1,0);
      p.camera.position.copy(target).add(p.model.position.clone().fromArray(offset));p.controls.target.copy(target);p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();
      p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();window.jawEar159QA.display();
      return{position:p.camera.position.toArray(),target:p.controls.target.toArray(),up:p.camera.up.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom,headVisible:p.headPivot.visible};
    },{center:fixedCenter,span,offset});
    if(!result.camera.headVisible)throw Error('159 visibility cannot hide the original hair/head.');
    if(strength&&JSON.stringify(result.camera)!==JSON.stringify(report.results[0].camera))throw Error('159 visibility OFF/ON cameras differ.');
    const file=`jaw-ear159-visibility-${strength}-ear-oblique.png`,b=await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:path.join(qa,file)});
    result.capture={file:'output/qa/'+file,bytes:b.length,sha256:sha(b)};
    await page.evaluate(()=>window.jawEar159QA.check('after-opposite-side-ear-view'));
    const n=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,n);
    if(result.idleFrames!==0)throw Error('159 visibility added idle rendering.');
    result.restoration=await page.evaluate(async()=>{const p=window.portrait,q=window.jawEar159QA,r=await q.restore('visibility-complete');p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('visibility-restored-source-upload');return r;});
    result.cleanup=await page.evaluate(()=>window.jawEar159QA.finish('visibility-complete'));result.audit=await page.evaluate(()=>window.jawEar159QA.audit);
    if(!result.restoration.sourceReferencesRestored||result.restoration.originalDisposals!==0||report.errors.some(e=>e.strength===strength))throw Error('159 visibility source restoration/browser checks failed.');
    result.status='One additional native ear capture complete; source checks/restoration passed, visibility art pending';await save();
    console.log(JSON.stringify({candidate:159,study:'opposite-side ear visibility',strength,status:result.status,capture:result.capture,exactAttributeParity:result.exactAttributeParity,idleFrames:result.idleFrames,cleanup:result.cleanup}));
    await page.close();page=null;
  }
  report.status='Exactly two additional native ear views complete; independent attachment/art interpretation pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
  if(page){const result=report.results.at(-1);
    try{result.preparationFailure=await page.evaluate(()=>window.jawEar159PreparationFailure||null);if(await page.evaluate(()=>!!window.jawEar159QA)){result.finalCleanup=await page.evaluate(()=>window.jawEar159QA.finish('visibility-finally'));result.audit=await page.evaluate(()=>window.jawEar159QA.audit);}}
    catch(error){result.cleanupFailure=String(error);failure||=error;}
    try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
  }
  try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
  if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:159,study:'opposite-side ear visibility',status:report.status,scoreUnchanged:78,errors:report.errors}));
