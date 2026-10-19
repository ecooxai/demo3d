import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Root-only promotion check: exact selected147 head buffers, once-only149
// colors, and cached resource ownership across explicitly chosen backends.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa');
await mkdir(qa,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const expectedMain='a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521';
if(hash(await readFile(path.join(root,'src/main.js')))!==expectedMain)throw Error('149 integration requires its selected frozen main.');
const selected147=JSON.parse(await readFile(path.join(root,'review/eye-contour147-native-report.json'),'utf8'));
if(selected147.status!=='Native OFF/ON checks passed; independent visual decision pending')throw Error('Missing original147 native evidence.');
const expectedHead=selected147.results[1].audit.privateAttributes.filter(r=>['position','normal'].includes(r.key));
const report={iteration:149,score:78,status:'Running',expectedMain,cases:[],errors:[],
  scope:'Selected147 eye contours plus149 uniform hair color. Source control hashes check promotion; artistic decisions remain separately recorded. Explicit native WebGPU to WebGL to native WebGPU, then a narrow CSS layout check.'};
const save=()=>writeFile(path.join(qa,'integrated149-native.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
let page;
try{
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push({type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text().slice(0,1600)});});
  await page.goto('http://127.0.0.1:8766/?backend=webgpu',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:60000});
  report.setup=await page.evaluate(async expected=>{
    const p=window.portrait,demand=(v,m)=>{if(!v)throw Error(m);};
    demand(p.ready&&p.renderer.backend?.isWebGPUBackend,'Native WebGPU unavailable; no automatic fallback.');
    demand(p.state.iteration===149&&p.state.score===78,'Selected iteration/score missing.');
    demand(p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'Default output changed.');
    demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4,'Selected display changed.');
    demand(p.state.eyeContour147?.applied&&p.state.eyeContour147.strength===1&&p.state.eyeContour147.retainSourceForQA===false&&p.state.eyeContour147.retainedSourceGeometryReferences===0,'Production147 retains QA originals or is missing.');
    demand(p.state.upperLipRelief140?.applied&&p.state.upperLipRelief140.strength===1&&p.state.mouthContinuity130?.strength===1,'Accepted lip preparation missing.');
    demand(p.state.hairColor149?.materials===5,'Selected hair color missing.');
    demand(document.querySelector('#page-title').textContent.includes('GPT-6 Astra'),'Creator name missing above model.');
    const crown=p.model.getObjectByName('Continuous parted crown with longitudinal fiber flow'),mass=p.model.getObjectByName('Overlapping layered S-wave hair around front back and shoulders'),hair=p.model.getObjectByName('Original reference-directed chestnut layered groom');
    demand(crown.material!==mass.material&&crown.material.side===0&&crown.material.shadowSide===2&&mass.material.side===2,'Accepted141 crown material ownership changed.');
    demand(!p.model.getObjectByName('closed-mouth-crease').visible,'Separate mouth tube returned.');
    p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
    const fingerprint=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
    const expectedQueues=new Map();for(const row of expected){const k=row.label+'|'+row.key;if(!expectedQueues.has(k))expectedQueues.set(k,[]);expectedQueues.get(k).push(row.sha256);}
    const objects=[],attrs=[],materials=new Set(),textures=new Set(),geometries=new Set(),disposals=[],listeners=[];
    p.model.traverse(mesh=>{if(!mesh.isMesh)return;const slots=Array.isArray(mesh.material)?mesh.material.slice():[mesh.material];objects.push({mesh,geometry:mesh.geometry,material:mesh.material,slots,maps:slots.map(m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture)))});geometries.add(mesh.geometry);for(const m of slots){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
    let promotedAttributes=0,promotedGeometries=0;
    for(const o of objects){
      const promoted=o.geometry.userData.eyeContour147?.version==='eye-contour-147';if(promoted)promotedGeometries++;
      for(const[name,a]of[...Object.entries(o.geometry.attributes),['index',o.geometry.index]])if(a){
        const digest=await fingerprint(a);attrs.push({mesh:o.mesh,name,a,array:a.array,version:a.version,hash:digest});
        if(promoted&&['position','normal'].includes(name)){
          const k=o.mesh.parent.name+'/'+o.mesh.name+'.private147|'+name,queue=expectedQueues.get(k);
          demand(queue?.length&&queue.shift()===digest,'Promoted147 buffer differs from selected native: '+k);promotedAttributes++;
        }
      }
    }
    demand(promotedGeometries===31&&promotedAttributes===62&&[...expectedQueues.values()].every(q=>!q.length),'147 promotion population differs.');
    for(const [kind,set]of[['geometry',geometries],['material',materials],['texture',textures]])for(const resource of set){const fn=()=>disposals.push(kind+':'+resource.name);resource.addEventListener('dispose',fn);listeners.push([resource,fn]);}
    const hairMaterials=[];hair.traverse(mesh=>{if(mesh.isMesh&&!hairMaterials.includes(mesh.material))hairMaterials.push(mesh.material);});
    demand(hairMaterials.length===5&&hairMaterials.every(m=>m.color.toArray().every((v,k)=>v===[.65,.69,.75][k])),'Uniform149 color differs or was applied twice.');
    const metrics={mouth130:p.state.mouthContinuity130,upper140:p.state.upperLipRelief140,crown100:p.state.referenceCrown,crown141:p.state.crownFacing141,eye147:p.state.eyeContour147,color149:p.state.hairColor149};
    window.integrated149={objects,attrs,fingerprint,metrics,crown,mass,hairMaterials,disposals,listeners};
    return{nativeWebGPU:true,iteration:p.state.iteration,score:p.state.score,title:document.querySelector('#page-title').textContent,output:[p.state.width,p.state.height],internal:p.state.internalRender,promotedGeometries,promotedAttributes,sourceMeshBindings:objects.length,protectedAttributes:attrs.length,eye147:p.state.eyeContour147,color149:p.state.hairColor149,hairTriangles:hair.userData.triangles,hairGeometryMiB:hair.userData.geometryMiB,heapMiB:performance.memory?.usedJSHeapSize/1048576};
  },expectedHead);
  for(const[pass,backend,views]of[['webgpu','webgpu',['front','detail','left','right','back']],['explicit-webgl','webgl',['front','detail']],['webgpu-return','webgpu',['front']]]){
    if(pass!=='webgpu')await page.evaluate(async backend=>{const p=window.portrait;await p.initialize(backend);if(!p.ready||(backend==='webgpu'?!p.renderer.backend?.isWebGPUBackend:!p.renderer.isWebGLRenderer))throw Error('Explicit renderer change failed: '+backend);},backend);
    const result={pass,explicitlyRequestedBackend:backend,captures:[]};
    for(const view of views){
      const frame=await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();if(p.renderer.backend?.isWebGPUBackend)await p.renderer.backend.device.queue.onSubmittedWorkDone();else if(p.renderer.getContext().getError()!==p.renderer.getContext().NO_ERROR)throw Error('WebGL error.');return{view,backend:p.state.backend,cpuSubmissionMs:p.state.renderMs,internal:p.state.internalRender,camera:{position:p.camera.position.toArray(),target:p.controls.target.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom}};},view);
      const file='integrated149-'+pass+'-'+view+'.png',b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});result.captures.push({...frame,file:'output/qa/'+file,bytes:b.length,sha256:hash(b)});
      if(pass==='webgpu'&&view==='front')await page.screenshot({path:path.join(qa,'integrated149-webgpu-page.png'),fullPage:true,animations:'disabled'});
    }
    result.integrity=await page.evaluate(async()=>{
      const p=window.portrait,s=window.integrated149,current={mouth130:p.state.mouthContinuity130,upper140:p.state.upperLipRelief140,crown100:p.state.referenceCrown,crown141:p.state.crownFacing141,eye147:p.state.eyeContour147,color149:p.state.hairColor149};
      for(const[k,v]of Object.entries(s.metrics))if(current[k]!==v)throw Error('Preparation repeated across renderer change: '+k);
      for(const o of s.objects){if(o.mesh.geometry!==o.geometry||o.mesh.material!==o.material)throw Error('Geometry/material binding changed: '+o.mesh.name);const slots=Array.isArray(o.material)?o.material:[o.material];if(slots.length!==o.slots.length||slots.some((m,i)=>m!==o.slots[i]))throw Error('Material slot changed.');for(let i=0;i<slots.length;i++)for(const[k,t]of Object.entries(o.maps[i]))if(slots[i][k]!==t)throw Error('Original texture binding changed.');}
      for(const r of s.attrs){const a=r.name==='index'?r.mesh.geometry.index:r.mesh.geometry.getAttribute(r.name);if(a!==r.a||a.array!==r.array||a.version!==r.version||await s.fingerprint(a)!==r.hash)throw Error('Attribute changed across rendering: '+r.mesh.name+'.'+r.name);}
      if(s.hairMaterials.some(m=>m.color.toArray().some((v,k)=>v!==[.65,.69,.75][k])))throw Error('Hair color compounded across renderer change.');
      if(s.crown.material.side!==0||s.crown.material.shadowSide!==2||s.mass.material.side!==2||s.disposals.length)throw Error('Crown ownership or original disposal changed.');
      return{exactCachedMetrics:Object.keys(s.metrics).length,exactAttributeBuffers:s.attrs.length,exactMeshBindings:s.objects.length,exactUniformHairColors:s.hairMaterials.length,originalDisposals:s.disposals.length,heapMiB:performance.memory?.usedJSHeapSize/1048576};
    });
    const before=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,before);if(result.idleFrames)throw Error('Unexpected idle rendering.');
    report.cases.push(result);await save();console.log(JSON.stringify({pass,integrity:result.integrity,idleFrames:result.idleFrames}));
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
  report.narrowLayout=await page.evaluate(()=>{const p=window.portrait,stage=document.querySelector('#viewport-wrap').getBoundingClientRect(),title=document.querySelector('#page-title').getBoundingClientRect();return{browserViewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,stage:{x:stage.x,y:stage.y,width:stage.width,height:stage.height},titleAboveStage:title.bottom<=stage.top,output:[p.renderer.domElement.width,p.renderer.domElement.height],renderer:p.state.backend,score:document.querySelector('#score-label').textContent,iteration:document.querySelector('#iteration-label').textContent,scope:'CSS layout in desktop Chrome at390px; not a physical phone performance measurement.'};});
  if(!report.narrowLayout.titleAboveStage||report.narrowLayout.documentWidth>392||report.narrowLayout.output[0]!==900||report.narrowLayout.output[1]!==1200)throw Error('Narrow layout or preserved render resolution failed.');
  await page.screenshot({path:path.join(qa,'integrated149-narrow-page.png'),fullPage:true,animations:'disabled'});
  await page.evaluate(()=>{for(const[r,fn]of window.integrated149.listeners)r.removeEventListener('dispose',fn);window.integrated149.listeners.length=0;});
  if(report.errors.length)throw Error('Browser errors recorded.');report.status='Passed';await save();
}catch(error){report.status='Failed';report.failure=String(error?.stack||error);await save();throw error;}
finally{if(page)await page.close();await browser.close();}
