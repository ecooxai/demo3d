import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root runs this isolated comparison on the Mac. Current accepted118.5 groom,
// original hair materials, and live main128 display settings are retained.
const marker='createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5})';
const source=await readFile('src/main.js','utf8'),groom=await readFile('review/hair-groom-candidate126.js','utf8'),seed=await readFile('src/hair-groom.js');
if(createHash('sha256').update(seed).digest('hex')!=='b75e9b72d44a5a51d88c3aa280842321b3e75ae8b6dc242ad9df7db79e024822')throw Error('126 baseline groom changed; merge the isolated lower blocks before comparing.');
if(source.split(marker).length!==2)throw Error('Expected one accepted .26/.35/.5 groom constructor.');
const entry=source.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,lowerClumps:Number(new URLSearchParams(location.search).get('clump126')||0)})");
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-lower-clump126.js',loader:'js'},plugins:[{name:'isolated-lower-clump126',setup(builder){builder.onLoad({filter:/[/\\]src[/\\]hair-groom\.js$/},()=>({contents:groom,loader:'js',resolveDir:path.resolve('src')}));}}],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-lower-clump126.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const reports=[];
try{
 for(const strength of[0,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-lower-clump126.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?clump126=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}catch(error){throw Error(`126 initialization failed: ${await page.locator('#gate-message').textContent()} / ${error.message}`);}
   const metrics=await page.evaluate(strength=>{
    const p=window.portrait;p.setScore(126,77);const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');if(!hair)throw Error('Missing groom.');
    const hash=(a,ranges=[[0,a.count]])=>{let h=2166136261;for(const[from,to]of ranges){const bytes=new Uint8Array(a.array.buffer,a.array.byteOffset+from*a.itemSize*a.array.BYTES_PER_ELEMENT,(to-from)*a.itemSize*a.array.BYTES_PER_ELEMENT);for(let i=0;i<bytes.length;i++)h=Math.imul(h^bytes[i],16777619);}return(h>>>0).toString(16);};
    const masses=hair.userData.lowerClump126?.ranges||Array.from({length:290},(_,guide)=>({guide,from:guide*549,to:(guide+1)*549})),massSegments=masses.map(r=>[r.from,r.guide>=58&&r.guide<=132?r.from+24*9:r.to]);
    const fineSegments=[[0,114376],[301426,hair.children[2].geometry.attributes.position.count]];for(let g=0;g<75;g++)for(let k=0;k<43;k+=7){const from=114376+(g*43+k)*58;fineSegments.push([from,from+58]);}
    const protectedParts=[],protectedHair={},materials=[],hairMeshes=new Set(hair.children);let vertices=0,triangles=0,nonfinite=0,normalError=0,zeroNormals=0;
    p.model.traverse(o=>{
     if(!o.isMesh)return;const g=o.geometry,a=g.attributes.position,n=g.attributes.normal,mi=hair.children.indexOf(o),moving=mi===1||mi===2;vertices+=a.count;triangles+=(g.index?.count??a.count)/3;
     for(let i=0;i<a.count;i++){if(!Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)+n.getX(i)+n.getY(i)+n.getZ(i)))nonfinite++;const length=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(length===0)zeroNormals++;else normalError=Math.max(normalError,Math.abs(length-1));}
     if(!moving)protectedParts.push({name:o.name,index:g.index?hash(g.index):null,attributes:Object.fromEntries(Object.entries(g.attributes).map(([key,a])=>[key,hash(a)]))});
     if(mi===1||mi===2){const segments=mi===1?massSegments:fineSegments;protectedHair[o.name]={segments:Object.fromEntries(['position','normal','color','uv'].map(key=>[key,hash(g.attributes[key],segments)]))};if(mi===2)protectedHair[o.name].fullImmutable={index:hash(g.index),color:hash(g.attributes.color),uv:hash(g.attributes.uv)};}
     if(hairMeshes.has(o)){const m=o.material;materials.push({name:o.name,roughness:m.roughness,specularIntensity:m.specularIntensity,envMapIntensity:m.envMapIntensity,anisotropy:m.anisotropy,metalness:m.metalness,alphaTest:m.alphaTest,alphaToCoverage:m.alphaToCoverage,normalScale:m.normalScale?.toArray(),map:m.map?.name,normalMap:m.normalMap?.name});}
    });
    return{strength,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,score:77,exposure:p.renderer.toneMappingExposure,toneMapping:p.renderer.toneMapping,guidePlacement:hair.userData.guidePlacement118.strength,clumps:hair.userData.lowerClump126,constructionMs:hair.userData.constructionMs,geometryMiB:hair.userData.geometryMiB,hairTriangles:hair.userData.triangles,vertices,triangles,nonfinite,normalError,zeroNormals,protectedParts,protectedHair,materials,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   },strength);
   if(!metrics.nativeWebGPU||metrics.nonfinite||metrics.normalError>2e-5)throw Error('126 native WebGPU/finite/unit-normal gate failed.');
   if(reports.length){const old=reports[0];if(metrics.vertices-old.vertices!==metrics.clumps.extraVertices||metrics.triangles-old.triangles!==metrics.clumps.extraTriangles||metrics.clumps.extraTriangles>80000)throw Error('126 unexpected geometry counts or cost.');for(const key of['protectedParts','protectedHair','materials','zeroNormals'])if(JSON.stringify(metrics[key])!==JSON.stringify(old[key]))throw Error(`126 altered protected ${key}.`);if(metrics.clumps.surfaceFineCurves!==2700)throw Error('126 expected2700 attached front fine curves.');}
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(160);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/lower-clump126-${Math.round(strength*100)}-${view}.png`});
   }
   await page.evaluate(async()=>{const p=window.portrait;let key,fill;p.scene.traverse(o=>{if(o.isDirectionalLight){if(o.castShadow)key=o;else if(o.position.z>0)fill=o;}});if(!key||!fill)throw Error('Missing relight controls.');key.position.set(5.5,5,3.4);fill.position.set(-4,3,6);fill.intensity=.55;key.shadow.needsUpdate=true;p.renderer.shadowMap.needsUpdate=true;p.setView('front');p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();});
   await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/lower-clump126-${Math.round(strength*100)}-relight-front.png`});
   if(errors.length)throw Error(JSON.stringify(errors));reports.push({...metrics,errors});console.log(JSON.stringify({...metrics,protectedParts:undefined,protectedHair:undefined,materials:undefined,clumps:metrics.clumps?{...metrics.clumps,ranges:undefined}:null,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/lower-clump126-native-result.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
