import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Isolate the exposed inner crown behind the near earlobe. This is a material
// ownership diagnostic, not a change to the accepted rooted groom or ear shape.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa');
await mkdir(qa,{recursive:true});const hash=b=>createHash('sha256').update(b).digest('hex');
if(hash(await readFile(path.join(root,'src/main.js')))!=='73d1b1589a6cb942353bd5d7301af47680e7e5510fe6f140b4aaa5c233004136')throw new Error('141 requires exact accepted133.');
const report=[],browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const mode of[0,1,2]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,1600));});
  try{
   await page.goto('http://127.0.0.1:8766/?backend=webgpu',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});
   const setup=await page.evaluate(async mode=>{
    const p=window.portrait,crown=p.model.getObjectByName('Continuous parted crown with longitudinal fiber flow'),head=p.model.getObjectByName('anatomical-head'),ear=head.getObjectByName('left-ear')?.getObjectByName('ear-continuous-anatomical-shell');
    if(!p.renderer.backend.isWebGPUBackend||p.state.antialiasing!==2||p.renderer.toneMapping!==7||p.renderer.toneMappingExposure!==1.4||p.state.iteration!==133||!crown?.isMesh||!ear?.isMesh||crown.material.side!==2||crown.geometry.getAttribute('position').count!==24455)throw new Error('141 unexpected native scene.');
    p.model.updateWorldMatrix(true,true);p.setView('detail');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
    const original=crown.geometry,material=crown.material,attrs=[];
    const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
    for(const[name,a]of[...Object.entries(original.attributes),['index',original.index]])if(a)attrs.push({name,a,array:a.array,hash:await digest(a)});
    const maps=Object.fromEntries(Object.entries(material).filter(([,v])=>v?.isTexture)),side=material.side,shadowSide=material.shadowSide;
    ear.geometry.computeBoundingBox();const center=ear.geometry.boundingBox.getCenter(p.model.position.clone());ear.localToWorld(center);
    let activeGeometry=original,activeMaterial=material,privateMaterial=null;
    if(mode){
     privateMaterial=material.clone();privateMaterial.side=0;privateMaterial.shadowSide=2;privateMaterial.needsUpdate=true;
     privateMaterial.name='Crown141 outward face diagnostic';
     if(mode===1){
      activeGeometry=original.clone();activeGeometry.clearGroups();activeGeometry.addGroup(0,144*52*6,1);activeGeometry.addGroup(144*52*6,original.index.count-144*52*6,0);activeMaterial=[material,privateMaterial];
     }else activeMaterial=privateMaterial;
     crown.geometry=activeGeometry;crown.material=activeMaterial;
    }
    window.crownSides141={crown,original,material,activeGeometry,activeMaterial,privateMaterial,attrs,digest,maps,side,shadowSide,center,castShadow:crown.castShadow,receiveShadow:crown.receiveShadow};
    p.setScore(141,77);
    return {iteration:141,mode,nativeWebGPU:true,privateGeometry:mode===1,privateMaterial:!!mode,foundationIndexCount:144*52*6,sourceCrownGroups:original.groups.map(g=>({...g})),cameraCenter:center.toArray(),explicitShadowSide:mode?2:null};
   },mode);
   const captures=[],hashes={};
   for(const view of['detail','ear','ear-oblique']){
    await page.evaluate(async view=>{
     const p=window.portrait;p.setView('detail');
     if(view!=='detail'){
      const c=window.crownSides141.center,span=1.24,aspect=p.state.width/p.state.height;
      p.camera.left=-span*aspect/2;p.camera.right=span*aspect/2;p.camera.top=span/2;p.camera.bottom=-span/2;p.camera.zoom=1;p.camera.up.set(0,1,0);
      p.camera.position.copy(c).add(p.model.position.clone().set(view==='ear-oblique'?-5:0,0,8));p.controls.target.copy(c);p.camera.lookAt(c);p.camera.updateProjectionMatrix();p.controls.update();
     }
     p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
    },view);
    await page.waitForTimeout(160);const f='crown-sides141-'+mode+'-'+view+'.png',b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,f)});captures.push('output/qa/'+f);hashes[view]=hash(b);
   }
   const integrity=await page.evaluate(async()=>{
    const p=window.portrait,s=window.crownSides141;let exactAttributes=0;
    if(s.crown.geometry!==s.activeGeometry||s.crown.material!==s.activeMaterial||s.material.side!==s.side||s.material.shadowSide!==s.shadowSide||s.crown.castShadow!==s.castShadow||s.crown.receiveShadow!==s.receiveShadow)throw new Error('141 altered an original flag or reference.');
    for(const r of s.attrs){if((r.name==='index'?s.original.index:s.original.getAttribute(r.name))!==r.a||r.a.array!==r.array||await s.digest(r.a)!==r.hash)throw new Error('141 altered original attribute bytes.');exactAttributes++;}
    for(const[k,v]of Object.entries(s.maps))if(s.material[k]!==v)throw new Error('141 changed source map references.');
    s.crown.geometry=s.original;s.crown.material=s.material;
    p.setView('detail');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
    if(s.activeGeometry!==s.original)s.activeGeometry.dispose();if(s.privateMaterial)s.privateMaterial.dispose();
    return {exactAttributes,sourceMaps:Object.keys(s.maps),sourceRestored:true,privateGeometryDisposed:s.activeGeometry!==s.original,privateMaterialDisposed:!!s.privateMaterial,heapMiB:performance.memory?.usedJSHeapSize/1048576};
   });
   await page.waitForTimeout(160);const restored=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,'crown-sides141-'+mode+'-restored-detail.png')});
   const restoredHash=hash(restored),restoredMatchesBaseline=restoredHash===(report[0]?.hashes.detail||hashes.detail);
   const result={...setup,...integrity,captures,hashes,restoredHash,restoredMatchesBaseline,errors};report.push(result);
   await writeFile(path.join(qa,'crown-sides141-native-result.json'),JSON.stringify(report,null,2)+'\n');
   if(errors.length||!restoredMatchesBaseline)throw new Error(JSON.stringify({mode,errors,restoredMatchesBaseline,restoredHash,baseline:report[0].hashes.detail}));
   console.log(JSON.stringify({iteration:141,mode,...integrity,restoredMatchesBaseline,errors}));
  }finally{await page.close();}
 }
}finally{await browser.close();}
