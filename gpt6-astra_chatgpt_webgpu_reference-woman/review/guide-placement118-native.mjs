import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

// Root-only native comparison. The live accepted scene remains intact, with
// only the groom constructor supplied by this isolated118 review candidate.
const iteration=118,markers=['createGroomHair({headShiftX:.26,shoulderContact:.35})','createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5})'];
const source=await readFile('src/main.js','utf8'),groom=await readFile('review/hair-groom-candidate118.js','utf8');
const present=markers.filter(marker=>source.includes(marker));
if(present.length!==1||source.split(present[0]).length!==2)throw new Error('Expected exactly one accepted .26/.35 groom constructor, with or without selected guidePlacement .5.');
const marker=present[0];
if(!groom.includes('guidePlacement=0')||!groom.includes('fitLowerGuides118'))throw new Error('Missing118 isolated guide implementation.');
const entry=source.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:Number(new URLSearchParams(location.search).get('guidefit')||0)})");
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-guide-placement118.js',loader:'js'},plugins:[{name:'isolated-lower-guide-placement118',setup(builder){builder.onLoad({filter:/[/\\]src[/\\]hair-groom\.js$/},()=>({contents:groom,loader:'js',resolveDir:path.resolve('src')}));}}],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-guide-placement118.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const results=[];
try{
 for(const strength of[0,.5,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-guide-placement118.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?guidefit=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}
   catch(error){throw new Error(`Candidate118 did not initialize: ${await page.locator('#gate-message').textContent()} / ${error.message}`);}
   const metrics=await page.evaluate(({iteration,strength})=>{
    const p=window.portrait;p.setScore(iteration,76);
    const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    if(!hair)throw new Error('Missing accepted groom group.');
    const hash=array=>{let h=2166136261;const a=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619);return(h>>>0).toString(16);};
    const parts=[],protectedSegments=[],hairMeshes=new Set();hair.traverse(o=>{if(o.isMesh)hairMeshes.add(o);});
    let meshes=0,vertices=0,triangles=0,hairTriangles=0,nonfinite=0,normalError=0,zeroNormals=0;
    p.model.traverse(o=>{
     if(!o.isMesh)return;meshes++;const g=o.geometry,a=g.attributes.position,n=g.attributes.normal,isHair=hairMeshes.has(o),meshIndex=hair.children.indexOf(o),moving=isHair&&(meshIndex===1||meshIndex===2);vertices+=a.count;triangles+=(g.index?.count??a.count)/3;if(isHair)hairTriangles+=(g.index?.count??a.count)/3;
     for(let i=0;i<a.count;i++){if(!Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)+n.getX(i)+n.getY(i)+n.getZ(i)))nonfinite++;const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(l===0)zeroNormals++;else normalError=Math.max(normalError,Math.abs(l-1));}
     parts.push({name:o.name,vertices:a.count,triangles:(g.index?.count??a.count)/3,index:g.index?hash(g.index.array):null,attributes:Object.fromEntries(Object.entries(g.attributes).filter(([key])=>!moving||!['position','normal'].includes(key)).map(([key,a])=>[key,hash(a.array)]))});
     if(moving){
      const sideStart=348406,sideSize=28*58;
      const ranges=meshIndex===1?[[0,58*549],[148*549,154*549],[156*549,166*549],[168*549,172*549],[228*549,290*549]]:[[0,114376],[sideStart,sideStart+6*sideSize],[sideStart+8*sideSize,sideStart+18*sideSize],[sideStart+20*sideSize,sideStart+24*sideSize],[439350,483894],[483894,608094],[612394,646260]];
      for(const [from,to]of ranges){if(to>a.count)throw new Error('118 protected range exceeds source geometry.');protectedSegments.push({name:o.name,from,to,attributes:Object.fromEntries(['position','normal'].map(key=>[key,hash(g.attributes[key].array.subarray(from*3,to*3))]))});}
     }
    });
    return{iteration,strength,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,guidePlacement:hair.userData.guidePlacement118,constructionMs:hair.userData.constructionMs,geometryMiB:hair.userData.geometryMiB,meshes,vertices,triangles,hairTriangles,nonfinite,normalError,zeroNormals,parts,protectedSegments,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },{iteration,strength});
   if(!metrics.nativeWebGPU)throw new Error('Candidate118 requires native WebGPU.');
   if(metrics.nonfinite||metrics.normalError>2e-5)throw new Error('Candidate118 native finite/unit-normal check failed.');
   if(results.length){
    const baseline=results[0];for(const key of['meshes','vertices','triangles','hairTriangles','zeroNormals'])if(metrics[key]!==baseline[key])throw new Error(`Candidate118 changed ${key}.`);
    if(JSON.stringify(metrics.parts)!==JSON.stringify(baseline.parts))throw new Error('Candidate118 changed protected components, colors, UVs or topology.');
    if(JSON.stringify(metrics.protectedSegments)!==JSON.stringify(baseline.protectedSegments))throw new Error('Candidate118 changed protected side/back/far/crown strands.');
   }
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/guide-placement-118-${Math.round(strength*100)}-${view}.png`});
   }
   if(errors.length)throw new Error(JSON.stringify(errors));results.push({...metrics,errors});console.log(JSON.stringify({...metrics,parts:undefined,protectedSegments:undefined,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/guide-placement118-native-audit.json',JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
