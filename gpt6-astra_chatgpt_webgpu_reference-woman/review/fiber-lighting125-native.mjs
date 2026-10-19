import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';

// Root-only comparison on the accepted portrait; node-control mode1 must match
// mode0 before any change is attributed to the fiber lighting itself.
const source=await readFile('src/main.js','utf8');
const marker='if(!skinIlluminationApplied){state.skinIllumination=compensateReferenceSkin(anatomicalHead,scene,{strength:.35});skinIlluminationApplied=true;}';
if(source.split(marker).length!==2)throw new Error('125 expected exactly one accepted illumination preparation.');
const entry="import {applyFiberLighting125,releaseFiberLighting125} from '../review/fiber-lighting-candidate125.js';\n"+source.replace(marker,marker+"\n      state.fiberLighting125=applyFiberLighting125(anatomicalHair,{mode:Number(new URLSearchParams(location.search).get('fiber125')||0)});")+"\nwindow.fiber125={releaseFiberLighting125};\n";
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-fiber-lighting125.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-fiber-lighting125.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),reports=[],baseline={};
const modes=process.env.FIBER125_MODES?process.env.FIBER125_MODES.split(',').map(Number):[0,1,2,3];
try{
 for(const mode of modes){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,1200));});
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-fiber-lighting125.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?fiber125=${mode}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});}
   catch(e){throw new Error(`125 initialization failed: ${await page.locator('#gate-message').textContent()} / ${errors.join(' | ')} / ${e.message}`);}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait;p.setScore(125,76);
    const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    const hash=array=>{let h=2166136261;const a=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619);return(h>>>0).toString(16);};
    const geometry=[];p.model.traverse(o=>{if(o.isMesh)geometry.push({name:o.name,attrs:Object.fromEntries(Object.entries({...o.geometry.attributes,index:o.geometry.index}).map(([k,a])=>[k,hash(a.array)]))});});
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,lighting:p.state.fiberLighting125,guidePlacement:hair.userData.guidePlacement118.strength,geometry,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   });
   if(!metrics.nativeWebGPU)throw new Error('125 requires native WebGPU.');
   if(reports.length&&JSON.stringify(metrics.geometry)!==JSON.stringify(reports[0].geometry))throw new Error('125 changed source geometry or attributes.');
   const controlDifference={};
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);
    await page.waitForTimeout(160);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/fiber-lighting125-${mode}-${view}.png`});
    if(errors.length)throw new Error(errors.join('\n'));
    if(mode===0||mode===1){
     const pixels=await page.evaluate(()=>{const p=window.portrait;p.renderNow();const c=document.createElement('canvas');c.width=p.renderer.domElement.width;c.height=p.renderer.domElement.height;const ctx=c.getContext('2d');ctx.drawImage(p.renderer.domElement,0,0);const bytes=ctx.getImageData(0,0,c.width,c.height).data;let h=2166136261,min=255,max=0;for(let i=0;i<bytes.length;i++){h=Math.imul(h^bytes[i],16777619);if(i%4!==3){min=Math.min(min,bytes[i]);max=Math.max(max,bytes[i]);}}return{hash:(h>>>0).toString(16),bytes:bytes.length,min,max};});
     if(pixels.max-pixels.min<50)throw new Error('125 compositor capture is not a nonuniform rendered portrait.');
     if(mode===0)baseline[view]=pixels;
     else if(baseline[view]){controlDifference[view]={exactHash:pixels.hash===baseline[view].hash,bytes:pixels.bytes};if(!controlDifference[view].exactHash)throw new Error(`125 node control compositor differs in${view}: ${JSON.stringify({baseline:baseline[view],control:pixels})}`);}
    }
   }
   await page.evaluate(async()=>{const p=window.portrait;let key,fill;p.scene.traverse(o=>{if(o.isDirectionalLight){if(o.castShadow)key=o;else if(o.position.z>0)fill=o;}});key.position.set(5.5,5,3.4);fill.position.set(-4,3,6);fill.intensity=.55;key.shadow.needsUpdate=true;p.renderer.shadowMap.needsUpdate=true;p.setView('front');p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();});
   await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/fiber-lighting125-${mode}-relight-front.png`});
   const cleanup=await page.evaluate(()=>{const p=window.portrait,hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');return window.fiber125.releaseFiberLighting125(hair);});
   if(errors.length)throw new Error(errors.join('\n'));
   reports.push({mode,...metrics,controlDifference,cleanup,errors});console.log(JSON.stringify({iteration:125,mode,...metrics,geometry:undefined,controlDifference,cleanup,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/fiber-lighting125-native-result.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
