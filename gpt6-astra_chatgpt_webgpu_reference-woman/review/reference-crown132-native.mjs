import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';

// Live accepted main, including full130 mouth continuity.132 replaces only
// crown atlas RGB after100 and before99. No frozen groom/material substitution.
const main=await readFile('src/main.js','utf8');
const marker='if(groomCandidate)state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});';
if(main.split(marker).length!==2||main.includes('applyRegisteredCrownReplacement132'))throw new Error('132 expected one clean accepted100 preparation point');
const entry="import {applyRegisteredCrownReplacement132} from '../review/reference-crown-candidate132.js';\n"+main.replace(marker,marker+"\n      if(groomCandidate)state.registeredCrown132=await applyRegisteredCrownReplacement132(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('crown132')||0)});");
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown132-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-crown132.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),reports=[];
const strengths=process.argv.includes('--half')?[0,.5,1]:[0,1];let baselineProtection;
try{
 for(const strength of strengths){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,1400));});
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-crown132.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?crown132=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});}catch(e){throw new Error(`132 initialization: ${await page.locator('#gate-message').textContent()} / ${errors.join(' / ')} / ${e.message}`);}
   const metrics=await page.evaluate(async()=>{
    const p=window.portrait;p.setScore(132,77);const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow'),m=crown.material;
    const digest=async array=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(array.buffer,array.byteOffset,array.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');
    const protection={meshes:[],coverage:await digest(m.alphaMap.image.data),normalMap:await digest(m.normalMap.image.data),foundation:await digest(m.map.image.data.subarray(2048*1024*4)),channels:[m.map.channel,m.alphaMap.channel,m.normalMap.channel],atlasDimensions:[m.map.image.width,m.map.image.height],metadata100:m.userData.referenceCrownMicrocontrast.version,exportAlphaMerge:m.userData.referenceCrownMicrocontrast.export.requiresExportOnlyAlphaMerge};
    // A single attribute fingerprint compares the untouched live scene across
    // fresh pages; it does not add meshes or invoke a separate render path.
    for(const mesh of hair.children){
     if(!mesh.isMesh)continue;const attributes={};for(const[key,a]of Object.entries(mesh.geometry.attributes))attributes[key]=await digest(a.array);
     const material=mesh.material,physical=Object.fromEntries(['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','alphaTest','alphaToCoverage','side','transparent','opacity','depthWrite'].map(k=>[k,material[k]]));
     protection.meshes.push({name:mesh.name,attributes,index:await digest(mesh.geometry.index.array),physical});
    }
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,result:p.state.registeredCrown132,display:{toneMapping:p.renderer.toneMapping,exposure:p.renderer.toneMappingExposure},mouthContinuity:p.state.mouthContinuity130?.strength??null,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,resolution:[p.state.width,p.state.height],antialiasing:p.state.antialiasing,internal:p.state.internalRender,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null,protection};
   });
   if(!metrics.nativeWebGPU||metrics.result.strength!==strength||metrics.display.toneMapping!==7||metrics.display.exposure!==1.4)throw new Error('132 requires native WebGPU, requested strength and accepted Neutral1.4 display');
   const protectedJSON=JSON.stringify(metrics.protection);if(strength===0)baselineProtection=protectedJSON;else if(protectedJSON!==baselineProtection)throw new Error('132 changed protected live geometry, colors, coverage, normal maps, materials or atlas layout');
   const captures=[];
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);
    await page.waitForTimeout(180);const file=`output/qa/registered-crown132-${Math.round(strength*100)}-${view}.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push(file);
   }
   const relight=await page.evaluate(async()=>{
    const p=window.portrait;let key=null,fill=null;p.scene.traverse(o=>{if(o.isDirectionalLight){if(o.castShadow)key=o;else if(o.position.z>0)fill=o;}});
    if(!key||!fill)throw new Error('132 expected accepted studio key and fill');
    key.position.set(5.5,5,3.4);fill.position.set(-4,3,6);fill.intensity=.55;key.shadow.needsUpdate=true;if(p.renderer.shadowMap)p.renderer.shadowMap.needsUpdate=true;
    p.setView('detail');p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();return{key:key.position.toArray(),fill:fill.position.toArray(),fillIntensity:fill.intensity};
   });
   await page.waitForTimeout(180);const file=`output/qa/registered-crown132-${Math.round(strength*100)}-relight-detail.png`;await page.locator('#viewport-wrap').screenshot({path:file});captures.push(file);
   if(errors.length)throw new Error(JSON.stringify(errors));
   reports.push({iteration:132,strength,...metrics,relight,captures,errors});
   console.log(JSON.stringify({iteration:132,strength,nativeWebGPU:metrics.nativeWebGPU,elapsedMs:metrics.result.elapsedMs??0,bakeMs:metrics.result.bakeMs??0,mappedAtlasTexels:metrics.result.mappedAtlasTexels??0,hairTriangles:metrics.hairTriangles,geometryMiB:metrics.geometryMiB,heapMiB:metrics.heapMiB,protectionMatched:true,captures,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/reference-crown132-native-result.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
