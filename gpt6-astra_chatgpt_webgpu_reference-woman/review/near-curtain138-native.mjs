import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root runs one isolated off/on comparison on the Mac. Both pages retain live
//133, full130,100 crown,118.5 protected guides,86.35 and Neutral1.4 lighting.
// The same single blouse is constructed earlier solely for read-only planning.
const source=await readFile('src/main.js','utf8'),groom=await readFile('review/hair-groom-candidate138.js','utf8'),layout=JSON.parse(await readFile('review/near-curtain138-native-layout.json','utf8'));
const baseline=await readFile('src/hair-groom.js');if(createHash('sha256').update(baseline).digest('hex')!==layout.baselineSourceSHA)throw Error('138 protected baseline groom changed.');
const marker='createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1})';
for(const q of[marker,'const anatomicalHead=createHead();','anatomicalBlouse=createBlouse()'])if(source.split(q).length!==2)throw Error('138 expected exactly one live constructor: '+q);
const entry=source.replace('const anatomicalHead=createHead();','const anatomicalHead=createHead();\nconst blouseSupport138=createBlouse();').replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,nearCurtain138:new URLSearchParams(location.search).get('near138')==='1',blouseSupport138})").replace('anatomicalBlouse=createBlouse()','anatomicalBlouse=blouseSupport138');
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-near-curtain138.js',loader:'js'},plugins:[{name:'isolated-near-curtain138',setup(builder){builder.onLoad({filter:/[/\\]src[/\\]hair-groom\.js$/},()=>({contents:groom,loader:'js',resolveDir:path.resolve('src')}));}}],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-near-curtain138.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const reports=[];
try{
 for(const enabled of[false,true]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-near-curtain138.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?near138=${enabled?1:0}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}catch(error){throw Error(`138 initialization failed: ${await page.locator('#gate-message').textContent()} / ${error.message}`);}
   const metrics=await page.evaluate(({enabled,layout})=>{
    const p=window.portrait;p.setScore(138,77);const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');if(!hair)throw Error('Missing138 groom.');
    const change=hair.userData.nearCurtain138;if(Boolean(change?.enabled)!==enabled)throw Error('138 selection not applied.');
    const hash=(a,ranges=[[0,a.count]])=>{let h=2166136261;for(const[from,to]of ranges){const bytes=new Uint8Array(a.array.buffer,a.array.byteOffset+from*a.itemSize*a.array.BYTES_PER_ELEMENT,(to-from)*a.itemSize*a.array.BYTES_PER_ELEMENT);for(let i=0;i<bytes.length;i++)h=Math.imul(h^bytes[i],16777619);}return(h>>>0).toString(16);};
    const selected=new Set([...Array.from({length:33},(_,k)=>58+k),...Array.from({length:6},(_,k)=>133+k),...Array.from({length:28},(_,k)=>172+k)]),mass=hair.children[1].geometry,detail=hair.children[2].geometry,massSegments=[],detailSegments=[];
    if(mass.attributes.position.count!==layout.massVertices)throw Error('138 MASS layout changed.');
    for(let id=0;id<mass.attributes.position.count/549;id++)if(!selected.has(id))massSegments.push([id*549,(id+1)*549]);
    const rows=enabled?change.fineRanges:layout.ranges.map(([oldFrom,oldCount,protectedPrefix])=>({oldFrom,newFrom:oldFrom,oldCount,newCount:oldCount,protectedPrefix}));
    if(rows.length!==layout.ranges.length)throw Error('138 fine source slots changed.');
    let cursor=0;for(let i=0;i<rows.length;i++){const r=rows[i],expect=layout.ranges[i];if(r.oldFrom!==expect[0]||r.oldCount!==expect[1]||r.protectedPrefix!==expect[2])throw Error('138 protected fine prefix differs from source at '+i);if(cursor<r.newFrom)detailSegments.push([cursor,r.newFrom]);if(r.protectedPrefix)detailSegments.push([r.newFrom,r.newFrom+r.protectedPrefix]);cursor=r.newFrom+r.newCount;}if(cursor<detail.attributes.position.count)detailSegments.push([cursor,detail.attributes.position.count]);
    const protectedParts=[],protectedHair={},materials=[];let vertices=0,triangles=0,nonfinite=0,normalError=0,zeroNormals=0;
    p.model.traverse(o=>{
     if(!o.isMesh)return;const g=o.geometry,a=g.attributes.position,n=g.attributes.normal,mi=hair.children.indexOf(o),moving=mi===1||mi===2;vertices+=a.count;triangles+=(g.index?.count??a.count)/3;
     for(let i=0;i<a.count;i++){const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(!Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)+l))nonfinite++;if(l===0)zeroNormals++;else normalError=Math.max(normalError,Math.abs(l-1));}
     if(!moving)protectedParts.push({name:o.name,index:g.index?hash(g.index):null,attributes:Object.fromEntries(Object.entries(g.attributes).map(([key,a])=>[key,hash(a)]))});
     if(moving){const segments=mi===1?massSegments:detailSegments;protectedHair[o.name]={attributes:Object.fromEntries(Object.entries(g.attributes).map(([key,a])=>[key,hash(a,segments)]))};if(mi===1)protectedHair[o.name].fullImmutable={index:hash(g.index),color:hash(g.attributes.color),uv:hash(g.attributes.uv)};}
     if(mi>=0){const m=o.material;materials.push({name:o.name,roughness:m.roughness,specularIntensity:m.specularIntensity,envMapIntensity:m.envMapIntensity,anisotropy:m.anisotropy,metalness:m.metalness,alphaTest:m.alphaTest,alphaToCoverage:m.alphaToCoverage,normalScale:m.normalScale?.toArray(),map:m.map?.name,normalMap:m.normalMap?.name});}
    });
    return{enabled,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,score:77,exposure:p.renderer.toneMappingExposure,toneMapping:p.renderer.toneMapping,guidePlacement:hair.userData.guidePlacement118.strength,shoulderContact:hair.userData.shoulderContact.strength,nearCurtain:change,constructionMs:hair.userData.constructionMs,geometryMiB:hair.userData.geometryMiB,hairTriangles:hair.userData.triangles,vertices,triangles,nonfinite,normalError,zeroNormals,protectedParts,protectedHair,materials,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   },{enabled,layout});
   if(!metrics.nativeWebGPU||metrics.nonfinite||metrics.normalError>2e-5||metrics.guidePlacement!==.5||metrics.shoulderContact!==.35)throw Error('138 native backend, finite, normal or ownership gate failed.');
   if(reports.length){const old=reports[0];if(metrics.vertices-old.vertices!==metrics.nearCurtain.extraVertices||metrics.triangles-old.triangles!==metrics.nearCurtain.extraTriangles)throw Error('138 unexpected extra geometry.');for(const key of['protectedParts','protectedHair','materials','zeroNormals'])if(JSON.stringify(metrics[key])!==JSON.stringify(old[key]))throw Error('138 altered protected '+key);if(metrics.nearCurtain.attachedFibers!==2191)throw Error('138 expected2191 attached base fibers.');}
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(160);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/near-curtain138-${enabled?100:0}-${view}.png`});
   }
   await page.evaluate(async()=>{const p=window.portrait;p.setView('front');const target=p.controls.target;target.set(-.95,.25,.70);p.camera.position.set(-4.25,.40,12.70);p.camera.zoom=2.0;p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();});
   await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/near-curtain138-${enabled?100:0}-curtain.png`});
   metrics.frontFrameCost=await page.evaluate(async()=>{const p=window.portrait;p.state.rotating=false;p.setView('front');p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();const cpu=[],queued=[];for(let i=0;i<8;i++){const a=performance.now();p.renderNow();const b=performance.now();await p.renderer.backend.device?.queue.onSubmittedWorkDone();cpu.push(b-a);queued.push(performance.now()-a);}const summary=a=>{a.sort((a,b)=>a-b);return{samples:a.length,minMs:a[0],medianMs:a[Math.floor(a.length/2)],maxMs:a.at(-1)};};return{cpuSubmission:summary(cpu),cpuThroughSubmittedGPUQueue:summary(queued),resolution:[p.state.width,p.state.height],antialiasing:p.state.antialiasing,scope:'Eight warm front renders including GPU queue completion; this is a local diagnostic, not a mobile FPS benchmark.'};});
   if(errors.length)throw Error(JSON.stringify(errors));reports.push({...metrics,errors});
   console.log(JSON.stringify({...metrics,protectedParts:undefined,protectedHair:undefined,materials:undefined,nearCurtain:metrics.nearCurtain?{...metrics.nearCurtain,fineRanges:undefined,families:undefined}:null,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/near-curtain138-native-result.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
