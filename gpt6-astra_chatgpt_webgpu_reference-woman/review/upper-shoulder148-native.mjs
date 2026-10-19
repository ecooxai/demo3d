import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root runs this single isolated OFF/ON comparison on the Mac. Both modes use
// accepted149:147 eyes,149 tint,140 lips,141 crown facing,100 crown,118.5,
//86.35, balance99 and Neutral1.4. No original source file is replaced.
const expectedMain='a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521',expectedGroom='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d',sha=b=>createHash('sha256').update(b).digest('hex'),source=await readFile('src/main.js','utf8'),groom=await readFile('review/hair-groom-candidate148.js','utf8'),layout=JSON.parse(await readFile('review/upper-shoulder148-native-layout.json','utf8'));
if(sha(source)!==expectedMain||layout.sourceHashes['src/main.js']!==expectedMain||layout.baselineSourceSHA!==expectedGroom)throw Error('148 requires the frozen accepted149 baseline.');
for(const [file,expected]of Object.entries(layout.sourceHashes))if(sha(await readFile(file))!==expected)throw Error('148 source/pose guard changed: '+file);
const marker='createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1})';
if(source.split(marker).length!==2)throw Error('148 requires exactly one original groom constructor.');
const entry=source.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,upperShoulder148:new URLSearchParams(location.search).get('upper148')==='1'})");
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-upper-shoulder148.js',loader:'js'},plugins:[{name:'isolated-upper-shoulder148',setup(builder){builder.onLoad({filter:/[/\\]src[/\\]hair-groom\.js$/},()=>({contents:groom,loader:'js',resolveDir:path.resolve('src')}));}}],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-upper-shoulder148.js',logLevel:'silent'});
const report={iteration:148,score:78,acceptedIteration:149,status:'running',scope:'One common upper near-shoulder depth field on existing owned MASS and dependent fibers. Original geometry counts, lower ends, protected regions, materials/maps and118.5/86.35 retained. Coarse GO only; no production or quality acceptance.',sourceHashes:layout.sourceHashes,cases:[],errors:[]},out='output/qa/upper-shoulder148-native-result.json',save=()=>writeFile(out,JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const enabled of[false,true]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',error=>errors.push('pageerror: '+error.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,1800));});
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-upper-shoulder148.js',contentType:'text/javascript'}));
   const navigationStarted=Date.now();
   await page.goto(`http://127.0.0.1:8766/?backend=webgpu&upper148=${enabled?1:0}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});}catch(error){throw Error('148 native initialization failed: '+await page.locator('#gate-message').textContent()+' / '+error.message);}
   const metrics=await page.evaluate(async({enabled,layout})=>{
    const p=window.portrait,require=(ok,message)=>{if(!ok)throw Error(message);};
    require(p.ready&&p.renderer.backend.isWebGPUBackend===true,'148 requires native WebGPU, without fallback.');
    require(p.state.iteration===149&&p.state.score===78&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2&&p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4,'148 accepted149 display or state changed.');
    require(p.state.upperLipRelief140?.strength===1&&p.state.eyeContour147?.strength===1&&p.state.crownFacing141?.side===0&&p.state.crownFacing141?.shadowSide===2&&JSON.stringify(p.state.hairColor149?.linearDiffuseMultiplier)===JSON.stringify([.65,.69,.75]),'148 accepted149 preparation missing.');
    p.startTurntable(false);p.setScore(148,78);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
    const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),change=hair?.userData.upperShoulder148;
    require(hair?.children.length===5&&Boolean(change?.enabled)===enabled,'148 groom selection/population mismatch.');
    const hash=(a,ranges=[[0,a.count]])=>{let h=2166136261;for(const[from,to]of ranges){const bytes=new Uint8Array(a.array.buffer,a.array.byteOffset+from*a.itemSize*a.array.BYTES_PER_ELEMENT,(to-from)*a.itemSize*a.array.BYTES_PER_ELEMENT);for(let i=0;i<bytes.length;i++)h=Math.imul(h^bytes[i],16777619);}return(h>>>0).toString(16);};
    const shaPixels=async t=>{const im=t.image,a=im.data??im.getContext('2d',{willReadFrequently:true}).getImageData(0,0,im.width,im.height).data;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');};
    const materials=[],maps=[],mapIndex=new Map(),protectedParts=[],protectedHair={},counts=[];let vertices=0,triangles=0,nonfinite=0,normalError=0,zeroNormals=0;
    const meshList=[];p.model.traverse(o=>{if(o.isMesh)meshList.push(o);});
    for(const o of meshList){
     const g=o.geometry,a=g.attributes.position,n=g.attributes.normal,mi=hair.children.indexOf(o),moving=mi===1||mi===2;vertices+=a.count;triangles+=(g.index?.count??a.count)/3;
     for(let i=0;i<a.count;i++){const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(!Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)+l))nonfinite++;else if(l===0)zeroNormals++;else normalError=Math.max(normalError,Math.abs(l-1));}
     if(!moving)protectedParts.push({name:o.name,index:g.index?hash(g.index):null,attributes:Object.fromEntries(Object.entries(g.attributes).map(([key,a])=>[key,hash(a)]))});
     else{
      require(a.count===(mi===1?layout.massVertices:layout.detailVertices),'148 MASS/DETAIL source layout changed.');
      const ranges=layout.protectedRanges[mi];require(Array.isArray(ranges)&&ranges.length>0,'148 protected source ranges missing.');
      protectedHair[o.name]={attributes:Object.fromEntries(Object.entries(g.attributes).map(([key,a])=>[key,hash(a,ranges)])),immutable:{index:hash(g.index),...Object.fromEntries(Object.entries(g.attributes).filter(([key])=>key!=='position'&&key!=='normal').map(([key,a])=>[key,hash(a)]))}};
     }
     if(mi>=0){
      counts.push({name:o.name,vertices:a.count,triangles:g.index.count/3});const m=o.material;
      require(!Array.isArray(m),'148 hair material unexpectedly became an array.');
      const settings={name:o.name,color:m.color.toArray(),roughness:m.roughness,metalness:m.metalness,anisotropy:m.anisotropy,anisotropyRotation:m.anisotropyRotation,specularIntensity:m.specularIntensity,specularColor:m.specularColor?.toArray(),envMapIntensity:m.envMapIntensity,alphaTest:m.alphaTest,alphaToCoverage:m.alphaToCoverage,side:m.side,shadowSide:m.shadowSide,normalScale:m.normalScale?.toArray(),transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,vertexColors:m.vertexColors};
      settings.maps={};for(const key of['map','normalMap','alphaMap']){const tex=m[key];if(!tex)continue;if(!mapIndex.has(tex)){mapIndex.set(tex,maps.length);maps.push({name:tex.name,width:tex.image.width,height:tex.image.height,hash:await shaPixels(tex),channel:tex.channel,wrapS:tex.wrapS,wrapT:tex.wrapT,colorSpace:tex.colorSpace});}settings.maps[key]=mapIndex.get(tex);}
      materials.push(settings);
     }
    }
    if(enabled)require(change.attachedFibers===layout.attachedFibers&&change.attachedFlyaways===layout.attachedFlyaways&&change.extraVertices===0&&change.extraTriangles===0&&change.coefficientFingerprint===layout.coefficientFingerprint,'148 ownership/count/field guard changed.');
    return{enabled,nativeWebGPU:true,score:78,exposure:p.renderer.toneMappingExposure,toneMapping:p.renderer.toneMapping,guidePlacement:hair.userData.guidePlacement118.strength,shoulderContact:hair.userData.shoulderContact.strength,upperShoulder:change,constructionMs:hair.userData.constructionMs,geometryMiB:hair.userData.geometryMiB,hairTriangles:hair.userData.triangles,vertices,triangles,counts,nonfinite,normalError,zeroNormals,protectedParts,protectedHair,materials,maps,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   },{enabled,layout});
   metrics.navigationToReadyMs=Date.now()-navigationStarted;
   if(metrics.nonfinite||metrics.normalError>2e-5||metrics.guidePlacement!==.5||metrics.shoulderContact!==.35)throw Error('148 native finite/normal/once-only preparation failed.');
   if(report.cases.length)for(const key of['vertices','triangles','counts','protectedParts','protectedHair','materials','maps','zeroNormals'])if(JSON.stringify(metrics[key])!==JSON.stringify(report.cases[0][key]))throw Error('148 altered protected '+key);
   const cameraSnapshot=()=>{const p=window.portrait,c=p.camera;return{numeric:[...c.position.toArray(),...c.quaternion.toArray(),...c.up.toArray(),...p.controls.target.toArray(),c.zoom,c.left,c.right,c.top,c.bottom,c.near,c.far],state:{view:p.state.view,width:p.state.width,height:p.state.height,lighting:p.state.lighting,backend:p.state.backend,rotating:p.state.rotating,antialiasing:p.state.antialiasing,toneMapping:p.renderer.toneMapping,exposure:p.renderer.toneMappingExposure}};};
   let frontState;
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(160);
    await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:`output/qa/upper-shoulder148-${enabled?100:0}-${view}.png`});if(view==='front')frontState=await page.evaluate(cameraSnapshot);
   }
   await page.evaluate(async()=>{const p=window.portrait;p.setView('front');p.controls.target.set(-.68,1.55,.32);p.camera.position.set(-8.9,1.82,8.9);p.camera.zoom=2.65;p.camera.lookAt(p.controls.target);p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
   await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:`output/qa/upper-shoulder148-${enabled?100:0}-shoulder.png`});
   metrics.frontFrameCost=await page.evaluate(async()=>{const p=window.portrait;p.startTurntable(false);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();const cpu=[],queued=[];for(let i=0;i<8;i++){const a=performance.now();p.renderNow();const b=performance.now();await p.renderer.backend.device.queue.onSubmittedWorkDone();cpu.push(b-a);queued.push(performance.now()-a);}const summary=a=>{a.sort((a,b)=>a-b);return{samples:a.length,minMs:a[0],medianMs:a[Math.floor(a.length/2)],maxMs:a.at(-1)};};return{cpuSubmission:summary(cpu),cpuThroughSubmittedGPUQueue:summary(queued),resolution:[p.state.width,p.state.height],antialiasing:p.state.antialiasing,scope:'Eight warm front submissions and GPU queue completion. A variable paired timing is not proof of speedup or a mobile FPS benchmark.'};});
   const restored=await page.evaluate(cameraSnapshot),maxCameraDifference=Math.max(...restored.numeric.map((x,i)=>Math.abs(x-frontState.numeric[i]))),stateExact=JSON.stringify(restored.state)===JSON.stringify(frontState.state);
   metrics.restoration={stateExact,maxCameraDifference,passed:stateExact&&maxCameraDifference<1e-12,scope:'Exact front camera, target, projection and render/UI state restored. No pixel-identity claim for the changing performance label.'};
   if(!metrics.restoration.passed)throw Error('148 front restoration failed.');
   await page.locator('#viewport-wrap').screenshot({animations:'disabled',path:`output/qa/upper-shoulder148-${enabled?100:0}-restored-front.png`});
   const idleStart=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);metrics.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,idleStart);if(metrics.idleFrames!==0)throw Error('148 introduced idle rendering.');
   if(errors.length)throw Error(JSON.stringify(errors));metrics.errors=errors;report.cases.push(metrics);await save();
   console.log(JSON.stringify({...metrics,protectedParts:undefined,protectedHair:undefined,materials:undefined,maps:undefined,upperShoulder:metrics.upperShoulder?{...metrics.upperShoulder,fineRanges:undefined}:null}));
  }finally{await page.close();}
 }
 report.status='native-complete-art-pending';await save();
}catch(error){report.status='failed';report.errors.push(error.stack??String(error));await save();throw error;}
finally{await browser.close();}
