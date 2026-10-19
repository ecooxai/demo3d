import {chromium} from 'playwright';
import {build} from 'esbuild';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root-only native pair on the complete accepted164 application. Existing159
// runs exactly once in main; this wrapper injects only the coarse162 annulus.
// No extra compileAsync, field-grid sweep, optical change, or fallback.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),sha=b=>createHash('sha256').update(b).digest('hex'),
  registryFile='review/chin162-baseline164.json',registry=JSON.parse(await readFile(path.join(root,registryFile),'utf8')),
  expectedMain='88280af03c4be630968aca0763d3d430ec6699ae9533ba057015c53801d4ae55',
  evidenceFile='review/integrated164-native.json',evidenceSHA='650743e8db6d3ac77d353c629cfff8a9e849f52a3c2655da3cbb744f4989cbed';
if(registry.candidate!==162||registry.acceptedBase!==164||registry.mainSHA256!==expectedMain)throw Error('162 registry is not the complete accepted164 baseline.');
for(const[file,row]of Object.entries(registry.files)){const b=await readFile(path.join(root,file));if(b.length!==row.bytes||sha(b)!==row.sha256)throw Error('162 frozen dependency changed: '+file);}
const evidenceBytes=await readFile(path.join(root,evidenceFile));
if(evidenceBytes.length!==449340||sha(evidenceBytes)!==evidenceSHA)throw Error('162 requires verified actual164 native provenance.');
const evidence=JSON.parse(evidenceBytes);
if(evidence.status!=='Passed'||evidence.iteration!==164||evidence.score!==78||evidence.errors.length||evidence.setup.attributes.length!==282||evidence.setup.meshBindings!==64)throw Error('162 actual164 native evidence is incomplete.');
const expected={attributes:evidence.setup.attributes,provenance:{file:evidenceFile,bytes:evidenceBytes.length,sha256:evidenceSHA,stage:'Complete selected164 after158/159, actual original attribute hashes; logical index storage comparison before first upload.'}},
  main=await readFile(path.join(root,'src/main.js'),'utf8'),marker='state.jawEar159=applyJawEar159(model,{strength:1,retainSourceForQA:false});';
if(sha(main)!==expectedMain||main.split(marker).length!==2||main.includes('applyChinJunction162'))throw Error('162 requires unchanged production164 with its existing once-only159 call.');
const injection=marker+'\nwindow.chin162QA=await prepareChinQA162({model,state,strength:Number(new URLSearchParams(location.search).get("chin162")||0),expected:'+JSON.stringify(expected)+'});\nstate.chinJunction162=window.chin162QA.metrics;\nrefreshCounts162();',
  entry="import {prepareChinQA162} from '../review/chin162-native-qa.js';\n"+main.replace(marker,injection)+
    '\nfunction refreshCounts162(){triangles=0;meshes=0;model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});if(state.ready)updateStats();}\nwindow.refreshCounts162=refreshCounts162;\n',
  bundle=path.join(qa,'app-chin162.js');
await mkdir(qa,{recursive:true});
const built=await build({absWorkingDir:root,stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'chin162-main-entry.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,metafile:true,logLevel:'silent'});
const runtimeInputs=Object.keys(built.metafile.inputs).filter(f=>!f.includes('node_modules/')&&!f.endsWith('chin162-main-entry.js'));
for(const f of runtimeInputs)if(!registry.files[f])throw Error('162 unguarded project import: '+f);
const bundleBytes=await readFile(bundle),html=await readFile(path.join(root,'index.html')),css=await readFile(path.join(root,'src/style.css')),
  views=['front','detail','left','right','back','jaw','jaw-oblique'],
  close={jaw:{position:[.008,2.1000000000000005,8.3],target:[.008,2.1,.3]},'jaw-oblique':{position:[-3.192,2.1,8.300000000000002],target:[.008,2.1,.3]}},
  report={candidate:162,acceptedBase:164,scoreUnchanged:78,status:'Running',modes:[0,1],views,
    files:registry.files,build:{bytes:bundleBytes.length,sha256:sha(bundleBytes),projectInputs:runtimeInputs},
    nativeEvidence:expected.provenance,display:{nativeWebGPU:true,toneMapping:7,exposure:1.4,resolution:[900,1200],internal:[1800,2400],antialiasing:2,lighting:'soft'},
    closeFraming:{source:'Original160/161 matched jaw and oblique cameras; fixed constants on both pages, not recomputed from new geometry.',frustum:[-.63,.63,.84,-.84],cameras:close},
    scope:'One coarse connected lower-head/upper-neck annulus on actual164. Original face/neck attributes and all other meshes/materials/maps remain exact; only two index bands are retired and one shared-material annulus is added. Narrow emitted closure/section checks, source immutability and resource restoration; no whole-scene contact, export or repeated155 certificate audit.',
    results:[],errors:[]},output=path.join(qa,'chin162-native.json'),save=()=>writeFile(output,JSON.stringify(report,null,2)+'\n'),
  pngs=new Map();
let browser,page,failure,offFront=null,offRestored=null;

async function compareExistingPNG(page,a,b){
  if(a.sha256===b.sha256)return{exactPNG:true,decodedEqual:true,changedPixels:0,changedChannels:0,maximumChannelDifference:0,pixelsOutsideDetailControl:0};
  const data=await page.evaluate(async({a,b})=>{
    const read=async name=>{const response=await fetch('/__chin162_png/'+name);if(!response.ok)throw Error('162 failed to read an existing PNG for restoration comparison.');
      const bitmap=await createImageBitmap(await response.blob()),canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(bitmap,0,0);const r={width:bitmap.width,height:bitmap.height,pixels:ctx.getImageData(0,0,bitmap.width,bitmap.height).data};bitmap.close();return r;};
    const [A,B]=await Promise.all([read(a),read(b)]);if(A.width!==B.width||A.height!==B.height)return{decodedEqual:false,sizeMismatch:true};
    const wrap=document.querySelector('#viewport-wrap').getBoundingClientRect(),control=document.querySelector('#detail-toggle').getBoundingClientRect(),
      xScale=A.width/wrap.width,yScale=A.height/wrap.height,rect=[Math.floor((control.left-wrap.left)*xScale),Math.floor((control.top-wrap.top)*yScale),Math.ceil((control.right-wrap.left)*xScale)-1,Math.ceil((control.bottom-wrap.top)*yScale)-1],
      lo=[A.width,A.height],hi=[-1,-1],histogram={};
    let changedPixels=0,changedChannels=0,max=0,outside=0,sum=0;
    for(let i=0;i<A.pixels.length;i+=4){let changed=false;for(let k=0;k<4;k++){const d=Math.abs(A.pixels[i+k]-B.pixels[i+k]);sum+=d;max=Math.max(max,d);if(d){changed=true;changedChannels++;histogram[d]=(histogram[d]||0)+1;}}
      if(changed){changedPixels++;const n=i/4,x=n%A.width,y=Math.floor(n/A.width);lo[0]=Math.min(lo[0],x);lo[1]=Math.min(lo[1],y);hi[0]=Math.max(hi[0],x);hi[1]=Math.max(hi[1],y);if(x<rect[0]||x>rect[2]||y<rect[1]||y>rect[3])outside++;}
    }
    return{width:A.width,height:A.height,decodedEqual:changedPixels===0,changedPixels,changedChannels,maximumChannelDifference:max,meanAbsoluteChannelDifference:sum/A.pixels.length,
      bounds:changedPixels?[...lo,...hi]:null,channelDifferenceHistogram:histogram,detailControlRectangle:rect,pixelsOutsideDetailControl:outside,
      qualification:'Decoded existing screenshots, no scene rerender. The actual DOM detail-control rectangle is reported separately; full-compositor inequality is never described as a strict equality pass. Non-control differences require interpretation.'};
  },{a:path.basename(a.file),b:path.basename(b.file)});
  return{exactPNG:false,...data};
}

try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
  for(const strength of[0,1]){
    const result={strength,status:'Running',captures:{}};report.results.push(result);
    page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
    page.on('pageerror',e=>report.errors.push({strength,type:'pageerror',message:e.message}));
    page.on('console',m=>{if(m.type()==='error')report.errors.push({strength,type:'console',message:m.text().slice(0,1800)});});
    const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');url.searchParams.set('hair','groom');url.searchParams.set('chin162',String(strength));
    await page.route(url.origin+'/?**',r=>r.fulfill({body:html,contentType:'text/html'}));
    await page.route('**/app.js',r=>r.fulfill({path:bundle,contentType:'text/javascript'}));
    await page.route('**/style.css',r=>r.fulfill({body:css,contentType:'text/css'}));
    await page.route('**/__chin162_png/*',r=>{const b=pngs.get(path.basename(new URL(r.request().url()).pathname));return b?r.fulfill({body:b,contentType:'image/png'}):r.abort();});
    await page.goto(url.href,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:90000});
    result.setup=await page.evaluate(async()=>{
      const p=window.portrait,q=window.chin162QA;if(!q||!p?.ready)throw Error('162 preparation blocked: '+document.querySelector('#gate-message').textContent);
      q.display();p.startTurntable(false);p.setScore(162,78);p.setResolution(900,1200);p.setAntialiasing(2);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
      await q.check('ordinary-first-native-upload');return{display:q.display(),metrics:q.metrics,sourceBindings:q.audit.sourceMeshBindings,sourceAttributes:q.audit.sourceAttributeCount,geometry:q.audit.geometry,buffers:q.audit.buffers};
    });
    for(const view of views){
      const camera=await page.evaluate(async({view,close})=>{
        const p=window.portrait;
        if(close){p.setView('detail');p.camera.left=-.63;p.camera.right=.63;p.camera.top=.84;p.camera.bottom=-.84;p.camera.zoom=1;p.camera.up.set(0,1,0);p.camera.position.fromArray(close.position);p.controls.target.fromArray(close.target);p.camera.lookAt(p.controls.target);p.camera.updateProjectionMatrix();p.controls.update();}
        else p.setView(view);
        p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();window.chin162QA.display();
        return{position:p.camera.position.toArray(),target:p.controls.target.toArray(),up:p.camera.up.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom};
      },{view,close:close[view]||null});
      const file='chin162-'+strength+'-'+view+'.png',b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});
      result.captures[view]={file:'output/qa/'+file,bytes:b.length,sha256:sha(b),camera};
      if(strength&&JSON.stringify(camera)!==JSON.stringify(report.results[0].captures[view].camera))throw Error('162 matched camera changed: '+view);
      if(!strength&&view==='front'){offFront=result.captures[view];pngs.set(file,b);}
    }
    await page.evaluate(()=>window.chin162QA.check('after-native-views',{hashImages:true}));
    const n=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,n);
    if(result.idleFrames!==0)throw Error('162 added idle rendering.');
    result.restoration=await page.evaluate(async()=>{
      const p=window.portrait,q=window.chin162QA,r=await q.restore();window.refreshCounts162();p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();await q.check('ordinary-restored-source-upload',{hashImages:true});return r;
    });
    const restoredName='chin162-'+strength+'-restored-front.png',restoredBytes=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,restoredName),animations:'disabled'}),
      restored={file:'output/qa/'+restoredName,bytes:restoredBytes.length,sha256:sha(restoredBytes)};
    pngs.set(restoredName,restoredBytes);result.restoredCapture=restored;
    result.restoredVsInitialOFF=await compareExistingPNG(page,restored,offFront);
    if(strength)result.restoredVsRestoredOFF=await compareExistingPNG(page,restored,offRestored);else offRestored=restored;
    result.cleanup=await page.evaluate(()=>window.chin162QA.finish());result.audit=await page.evaluate(()=>window.chin162QA.audit);
    if(report.errors.some(e=>e.strength===strength))throw Error('162 browser errors recorded.');
    result.status='Native source/closure/resource checks complete; coarse art and compositor interpretation pending';
    await save();
    console.log(JSON.stringify({candidate:162,strength,status:result.status,helperMs:result.setup.metrics.elapsedMs,privateReplacementBytes:result.setup.metrics.privateAttributeBytes,
      closure:result.audit.geometry?.closure,minimumTriangleNormalCosine:result.audit.geometry?.minimumTriangleAuthoredNormalCosine,idleFrames:result.idleFrames,cleanup:result.cleanup,restoration:result.restoredVsInitialOFF}));
    await page.close();page=null;
  }
  report.status='Native OFF/ON checks complete; independent coarse visual decision pending';
}catch(error){failure=error;report.status='Failed';report.failure=String(error?.stack||error);}
finally{
  if(page){
    const result=report.results.at(-1);
    try{result.preparationFailure=await page.evaluate(()=>window.chin162PreparationFailure||null);
      if(await page.evaluate(()=>!!window.chin162QA)){result.finalCleanup=await page.evaluate(()=>window.chin162QA.finish('finally'));result.audit=await page.evaluate(()=>window.chin162QA.audit);}}
    catch(error){result.cleanupFailure=String(error);failure||=error;}
    try{await page.close();}catch(error){report.pageCloseFailure=String(error);failure||=error;}
  }
  try{await browser?.close();}catch(error){report.browserCloseFailure=String(error);failure||=error;}
  pngs.clear();if(failure||report.errors.length)report.status='Failed';await save();
}
if(failure)throw failure;
console.log(JSON.stringify({candidate:162,status:report.status,scoreUnchanged:78,errors:report.errors}));
