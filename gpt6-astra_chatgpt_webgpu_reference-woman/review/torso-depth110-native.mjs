import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

// Root runs this on Mac against the existing preview server. Fresh models
// include the live accepted pose, balance, crown texture, cloth and contact.
const iteration=110,marker='if(!skinIlluminationApplied){';
const source=await readFile('src/main.js','utf8');
if(source.split(marker).length!==2)throw new Error('Expected one pre-illumination marker.');
const balanceAt=source.indexOf('state.balance=applyPortraitBalance(model,');
if(balanceAt<0||balanceAt>source.indexOf(marker))throw new Error('The expected balance/illumination order changed.');
const entry="import {applyTorsoDepth110} from '../review/torso-depth-candidate110.js';\n"+source.replace(marker,"state.torsoDepth110=applyTorsoDepth110(model,{strength:Number(new URLSearchParams(location.search).get('torsodepth')||0)});\n      "+marker);
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-torso-depth110.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-torso-depth110.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const results=[];
try{
 for(const strength of[0,.5,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-torso-depth110.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?torsodepth=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:45000});}
   catch(error){throw new Error(`Candidate110 did not initialize: ${await page.locator('#gate-message').textContent()} / ${error.message}`);}
   const metrics=await page.evaluate(({iteration,strength})=>{
    const p=window.portrait;p.setScore(iteration,76);
    const hash=array=>{let h=2166136261;const a=new Uint8Array(array.buffer,array.byteOffset,array.byteLength);for(let i=0;i<a.length;i++)h=Math.imul(h^a[i],16777619);return(h>>>0).toString(16);};
    const parts=[];let meshes=0,vertices=0,triangles=0,nonfinite=0,zeroNormals=0,maxNormalLengthError=0;
    p.model.traverse(o=>{
     if(!o.isMesh)return;meshes++;
     const g=o.geometry,a=g.attributes.position,n=g.attributes.normal;vertices+=a.count;triangles+=(g.index?.count??a.count)/3;
     for(let i=0;i<a.count;i++){
      if(!Number.isFinite(a.getX(i)+a.getY(i)+a.getZ(i)+n.getX(i)+n.getY(i)+n.getZ(i)))nonfinite++;
      const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(l===0)zeroNormals++;else maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(l-1));
     }
     let head=false;for(let q=o;q&&q!==p.model;q=q.parent)if(q.name==='anatomical-head')head=true;
     parts.push({name:o.name,vertices:a.count,triangles:(g.index?.count??a.count)/3,position:head?hash(a.array):null,normal:head?hash(n.array):null,index:g.index?hash(g.index.array):null,attributes:Object.fromEntries(Object.entries(g.attributes).filter(([k])=>!['position','normal','tangent'].includes(k)).map(([k,v])=>[k,hash(v.array)]))});
    });
    return{iteration,strength,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,depth:p.state.torsoDepth110,meshes,vertices,triangles,nonfinite,zeroNormals,maxNormalLengthError,parts,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },{iteration,strength});
   if(!metrics.nativeWebGPU)throw new Error('Candidate110 requires native WebGPU.');
   if(metrics.nonfinite||metrics.maxNormalLengthError>2e-5)throw new Error('Native candidate110 geometry/normal validation failed.');
   if(results.length){
    const baseline=results[0];
    for(const key of['meshes','vertices','triangles','zeroNormals'])if(metrics[key]!==baseline[key])throw new Error(`Candidate110 changed ${key}.`);
    if(JSON.stringify(metrics.parts)!==JSON.stringify(baseline.parts))throw new Error('Candidate110 changed protected head, UV/color, or topology hashes.');
   }
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/torso-depth-110-${Math.round(strength*100)}-${view}.png`});
   }
   await page.evaluate(()=>{const p=window.portrait;p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();});
   await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/torso-depth-110-${Math.round(strength*100)}-garment.png`});
   if(errors.length)throw new Error(JSON.stringify(errors));results.push({...metrics,errors});
   console.log(JSON.stringify({...metrics,parts:undefined,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/torso-depth110-native-audit.json',JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
