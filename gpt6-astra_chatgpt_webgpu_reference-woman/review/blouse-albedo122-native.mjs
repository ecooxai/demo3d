import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

// Review122 bounds the existing collar/placket's over-one blue material
// factors in the actual source appearance. It does not pretend that arbitrary
// HDR diffuse factors can be serialized exactly as ordinary glTF base color.
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),reports=[];
try{
 for(const mode of[0,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});
   const metrics=await page.evaluate(mode=>{
    const p=window.portrait,materials=new Set(),changes=[];
    p.model.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m)materials.add(m);});
    // Reproduce the exact106 palette on an app where122 is already integrated.
    // Refuse unknown later palette changes instead of relabeling them baseline.
    const originalColors={'blouse-collar-poplin':'#e2e4eb','blouse-cotton-placket':'#e5e6ed'};
    for(const m of materials)if(originalColors[m.name]){
     const original=m.color.clone().set(originalColors[m.name]).multiplyScalar(1.28).toArray(),actual=m.color.toArray();
     if(!actual.every((v,i)=>Math.abs(v-original[i])<1e-12)&&!actual.every((v,i)=>Math.abs(v-Math.min(1,original[i]))<1e-12))throw new Error('122 requires the known106 or bounded122 palette.');
     m.color.setRGB(...original);
    }
    const unboundedBefore=[...materials].filter(m=>m.color&&!m.color.toArray().every(v=>Number.isFinite(v)&&v>=0&&v<=1)).map(m=>({name:m.name,color:m.color.toArray()}));
    for(const m of materials){
     if(!['blouse-collar-poplin','blouse-cotton-placket'].includes(m.name))continue;
     const before=m.color.toArray();if(mode)m.color.setRGB(...before.map(v=>Math.min(1,v)));
     changes.push({name:m.name,before,after:m.color.toArray(),relativeChannelChange:m.color.toArray().map((v,i)=>v/before[i]-1)});
    }
    const unboundedAfter=[...materials].filter(m=>m.color&&!m.color.toArray().every(v=>Number.isFinite(v)&&v>=0&&v<=1)).map(m=>({name:m.name,color:m.color.toArray()}));
    if(changes.length!==2)throw new Error('122 expected exactly the shared collar and placket materials.');
    if(mode&&unboundedAfter.length)throw new Error('122 left an out-of-range base-color factor: '+JSON.stringify(unboundedAfter));
    p.setScore(122,76);
    return{iteration:122,mode,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,materials:materials.size,unboundedBefore,unboundedAfter,changes,extraGeometryBytes:0,extraTextureBytes:0,perFrameCPUWork:0,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   },mode);
   if(!metrics.nativeWebGPU)throw new Error('122 requires actual native WebGPU.');
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);
    await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/blouse-albedo122-${mode}-${view}.png`});
   }
   await page.evaluate(async()=>{const p=window.portrait;p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();});
   await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/blouse-albedo122-${mode}-garment.png`});
   if(errors.length)throw new Error(JSON.stringify(errors));reports.push({...metrics,errors});console.log(JSON.stringify({...metrics,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/blouse-albedo122-native-result.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
