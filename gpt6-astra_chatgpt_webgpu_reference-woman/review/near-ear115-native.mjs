import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

// Root-only native comparison.115 is inserted into the live one-time scene
// preparation after70 pigment and before99 balance.110 remains absent.
const iteration=115,marker='state.balance=applyPortraitBalance(model,';
const source=await readFile('src/main.js','utf8');
if(source.split(marker).length!==2)throw new Error('Expected one accepted99 balance marker.');
const colorAt=source.indexOf('state.referenceEar=await applyReferenceEarColor(');
if(colorAt<0||colorAt>source.indexOf(marker))throw new Error('The expected70 pigment/99 balance order changed.');
const selectedCall='state.nearEarYaw115=applyNearEarYaw115(anatomicalHead,{degrees:-25});';
const reviewCall="state.nearEarYaw115=applyNearEarYaw115(anatomicalHead,{degrees:Number(new URLSearchParams(location.search).get('earyaw')||0)});";
const existingCalls=[...source.matchAll(/\bapplyNearEarYaw115\s*\(/g)];
let entry;
if(existingCalls.length===1&&source.split(selectedCall).length===2){
 if(!(colorAt<existingCalls[0].index&&existingCalls[0].index<source.indexOf(marker)))throw new Error('Integrated115 must remain after70 and before99.');
 entry=source.replace(selectedCall,reviewCall);
}else if(existingCalls.length===0&&!/\bimport\s*\{[^}]*\bapplyNearEarYaw115\b/.test(source)){
 entry="import {applyNearEarYaw115} from '../review/near-ear-candidate115.js';\n"+source.replace(marker,reviewCall+'\n      '+marker);
}else throw new Error('Expected one selected115 application or none; refusing duplicate preparation.');
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-near-ear115.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-near-ear115.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const results=[];
try{
 for(const degrees of[0,-15,-25]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-near-ear115.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?earyaw=${degrees}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:45000});}
   catch(error){throw new Error(`Candidate115 did not initialize: ${await page.locator('#gate-message').textContent()} / ${error.message}`);}
   const metrics=await page.evaluate(({iteration,degrees})=>{
    const p=window.portrait;p.setScore(iteration,76);
    const hash=array=>{let h=2166136261;const a=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619);return(h>>>0).toString(16);};
    const near=p.headPivot.getObjectByName('left-ear').getObjectByName('ear-continuous-anatomical-shell'),parts=[];
    let meshes=0,vertices=0,triangles=0,nonfinite=0,normalError=0,zeroNormals=0;
    p.model.traverse(o=>{
     if(!o.isMesh)return;meshes++;const g=o.geometry,a=g.attributes.position,n=g.attributes.normal;vertices+=a.count;triangles+=(g.index?.count??a.count)/3;
     for(let i=0;i<a.count;i++){if(!Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)+n.getX(i)+n.getY(i)+n.getZ(i)))nonfinite++;const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(l===0)zeroNormals++;else normalError=Math.max(normalError,Math.abs(l-1));}
     parts.push({name:o.name,near:o===near,vertices:a.count,triangles:(g.index?.count??a.count)/3,index:g.index?hash(g.index.array):null,attributes:Object.fromEntries(Object.entries(g.attributes).filter(([key])=>o!==near||!['position','normal'].includes(key)).map(([key,a])=>[key,hash(a.array)]))});
    });
    near.geometry.computeBoundingBox();const center=near.geometry.boundingBox.getCenter(p.camera.position.clone());near.localToWorld(center);
    return{iteration,degrees,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,ear:p.state.nearEarYaw115,earBounds:near.geometry.boundingBox,earCenter:center.toArray(),meshes,vertices,triangles,nonfinite,normalError,zeroNormals,parts,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },{iteration,degrees});
   if(!metrics.nativeWebGPU)throw new Error('Candidate115 requires native WebGPU.');
   if(metrics.nonfinite||metrics.normalError>2e-5)throw new Error('Candidate115 native finite/unit-normal check failed.');
   if(results.length){const baseline=results[0];for(const key of['meshes','vertices','triangles','zeroNormals'])if(metrics[key]!==baseline[key])throw new Error(`Candidate115 changed ${key}.`);if(JSON.stringify(metrics.parts)!==JSON.stringify(baseline.parts))throw new Error('Candidate115 changed protected geometry, colors, UVs or topology.');}
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/near-ear-115-${Math.abs(degrees)}-${view}.png`});
   }
   const center=results.length?results[0].earCenter:metrics.earCenter;
   await page.evaluate(center=>{
    const p=window.portrait;for(const o of p.headPivot.children)if(o.name!=='anatomical-head')o.visible=false;p.setView('detail');
    p.controls.target.set(...center);p.camera.position.set(center[0]-3.2,center[1],center[2]+5);p.camera.zoom=2.2;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();
   },center);
   await page.waitForTimeout(200);await page.locator('#viewport-wrap').screenshot({path:`output/qa/near-ear-115-${Math.abs(degrees)}-ear-oblique.png`});
   if(errors.length)throw new Error(JSON.stringify(errors));results.push({...metrics,errors});console.log(JSON.stringify({...metrics,parts:undefined,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/near-ear115-native-audit.json',JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
