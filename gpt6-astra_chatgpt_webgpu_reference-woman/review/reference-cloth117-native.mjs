import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';

const source=await readFile('src/main.js','utf8'),marker='state.balance=applyPortraitBalance(model,{shiftX:-.24});';
if(source.split(marker).length!==2)throw new Error('Expected one accepted pre-balance marker.');
const selectedCall='state.referenceCloth117=await applyReferenceCloth117(anatomicalBlouse,{strength:.5});';
const reviewCall="state.referenceCloth117=await applyReferenceCloth117(anatomicalBlouse,{strength:Number(new URLSearchParams(location.search).get('cloth117')||0)});";
const existingCalls=[...source.matchAll(/\bapplyReferenceCloth117\s*\(/g)];
let entry;
if(existingCalls.length===1&&source.split(selectedCall).length===2){
 const ear=source.indexOf('state.referenceEar=await applyReferenceEarColor(');
 if(!(ear>=0&&ear<existingCalls[0].index&&existingCalls[0].index<source.indexOf(marker)))throw new Error('Integrated117 must remain after the ear bake and before99.');
 entry=source.replace(selectedCall,reviewCall);
}else if(existingCalls.length===0&&!/\bimport\s*\{[^}]*\bapplyReferenceCloth117\b/.test(source)){
 entry="import {applyReferenceCloth117} from '../review/reference-cloth-candidate117.js';\n"+source.replace(marker,reviewCall+'\n      '+marker);
}else throw new Error('Expected one selected117 application or none; refusing duplicate preparation.');
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-cloth117.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-cloth117.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const reports=[];
try{
 for(const strength of(process.env.CLOTH117_STRENGTHS||'0,.5,1').split(',').map(Number)){
  if(![0,.5,1].includes(strength))throw new Error('Unknown117 strength.');
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-cloth117.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?cloth117=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:45000});}catch(e){throw new Error(await page.locator('#gate-message').textContent());}
   const metrics=await page.evaluate(()=>{
    const p=window.portrait;p.setScore(117,76);
    const hash=a=>{let h=2166136261;for(const x of new Uint8Array(a.buffer,a.byteOffset,a.byteLength))h=Math.imul(h^x,16777619);return(h>>>0).toString(16);};
    const parts=[];p.model.traverse(o=>{if(o.isMesh)parts.push({name:o.name,attributes:Object.fromEntries(Object.entries(o.geometry.attributes).map(([k,a])=>[k,hash(a.array)])),index:hash(o.geometry.index.array)});});
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,bake:p.state.referenceCloth117,parts,heapMiB:Math.round(performance.memory.usedJSHeapSize/1048576)};
   });
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required.');
   if(reports.length&&JSON.stringify(metrics.parts)!==JSON.stringify(reports[0].parts))throw new Error('Cloth117 changed geometry, UV, normal, color or topology data.');
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(v=>{window.portrait.setView(v);window.portrait.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/cloth117-legal-${Math.round(strength*100)}-${view}.png`});
   }
   await page.evaluate(()=>{const p=window.portrait;p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();});
   await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/cloth117-legal-${Math.round(strength*100)}-garment.png`});
   if(errors.length)throw new Error(JSON.stringify(errors));reports.push({...metrics,errors});console.log(JSON.stringify({...metrics,parts:undefined,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/cloth117-legal-native-result.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
