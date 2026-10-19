import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Root-only integration check. Verify the exact selected native buffers for
// every scene attribute, then cached ownership across explicitly chosen backends.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa');
await mkdir(qa,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(path.join(root,'review/integrated157-manifest.json'),'utf8'));
if(manifest.iteration!==157||manifest.score!==78||manifest.status!=='Selected components ready for integration')throw Error('157 requires a completed selection manifest.');
for(const file of manifest.files)if(hash(await readFile(path.join(root,file.file)))!==file.sha256)throw Error('157 source guard: '+file.file);
const expectedMain=manifest.files.find(r=>r.file==='src/main.js')?.sha256;
if(!expectedMain)throw Error('157 manifest lacks main source.');
async function evidence(row){const bytes=await readFile(path.join(root,row.file));if(hash(bytes)!==row.sha256)throw Error('157 native evidence changed: '+row.file);return JSON.parse(bytes);}
const baseline=await evidence(manifest.baselineEvidence),expectedAttributes=baseline.results.find(r=>r.strength===1).audit.sourceAttributes.map(r=>({...r}));
const promoted=[];
for(const selection of manifest.selectedEvidence){
 const native=await evidence(selection),on=native.results.find(r=>r.strength===1);
 const rows=selection.iteration===154?on?.audit?.privateAfter99Attributes:on?.audit?.privateAttributes;
 if(!rows?.length)throw Error('157 missing selected native buffers: '+selection.file);
 for(const row of rows){
  const label=selection.iteration===154?'original-tailored-white-cotton-blouse/blouse-continuous-torso-and-sleeves':row.label.replace(new RegExp('\\.private'+selection.iteration+'$'),'');
  if(selection.iteration===154?row.label!=='balanced-private154-torso':label===row.label)throw Error('157 private label differs: '+row.label);
  const matches=expectedAttributes.filter(r=>r.label===label&&r.key===row.key);
  if(matches.length!==1)throw Error('157 ambiguous selected attribute: '+label+'.'+row.key);
  Object.assign(matches[0],row,{label});
 }
 promoted.push({iteration:selection.iteration,privateAttributes:rows.length,meshes:selection.iteration===154?on.audit.metrics.privateGeometries:on.audit.metrics.privateGeometryCount});
}
if(expectedAttributes.length!==282)throw Error('157 baseline attribute population changed.');
const report={iteration:157,score:78,status:'Running',expectedMain,selected:promoted,cases:[],errors:[],
  scope:'Selected native151 lashes and154 cloth.155 jaw remains deferred because the focused interface audit found far-ear directional support releases. Exact full-scene attributes and production source-retention checks; explicit WebGPU to WebGL to WebGPU and narrow CSS layout. Artistic decisions are separately recorded.'};
const save=()=>writeFile(path.join(qa,'integrated157-native.json'),JSON.stringify(report,null,2)+'\n');
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
    demand(p.state.iteration===157&&p.state.score===78,'Selected iteration/score missing.');
    demand(p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'Default output changed.');
    demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4,'Selected display changed.');
    demand(p.state.eyeContour147?.applied&&p.state.eyeContour147.strength===1&&p.state.eyeContour147.retainSourceForQA===false&&p.state.eyeContour147.retainedSourceGeometryReferences===0,'Production147 retains QA originals or is missing.');
    for(const [name,version,count]of [['eyelash151','existing-lash-sweep-151',2],...(expected.jaw155?[['jawSilhouette155','jaw-silhouette-155',2]]:[])]){
      const m=p.state[name];demand(m?.applied&&m.strength===1&&m.version===version&&m.privateGeometryCount===count&&m.retainSourceForQA===false&&m.retainedSourceGeometryReferences===0,'Production preparation or zero source retention missing: '+name);
    }
    if(expected.cloth154){const m=p.state.blouseDrape154;demand(m?.applied&&m.version==='blouse-drape-154'&&m.strength===1&&m.privateGeometries===1&&m.retainsSourceForQA===false,'Production154 preparation or retention differs.');}
    demand(p.state.upperLipRelief140?.applied&&p.state.upperLipRelief140.strength===1&&p.state.mouthContinuity130?.strength===1,'Accepted lip preparation missing.');
    demand(p.state.hairColor149?.materials===5,'Selected hair color missing.');
    demand(document.querySelector('#page-title').textContent.includes('GPT-6 Astra'),'Creator name missing above model.');
    const crown=p.model.getObjectByName('Continuous parted crown with longitudinal fiber flow'),mass=p.model.getObjectByName('Overlapping layered S-wave hair around front back and shoulders'),hair=p.model.getObjectByName('Original reference-directed chestnut layered groom');
    demand(crown.material!==mass.material&&crown.material.side===0&&crown.material.shadowSide===2&&mass.material.side===2,'Accepted141 crown material ownership changed.');
    demand(!p.model.getObjectByName('closed-mouth-crease').visible,'Separate mouth tube returned.');
    p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
    const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
    const fingerprint=a=>digest(a.array);
    const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid','version'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
    const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
    const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('157 unsupported selected texture image: '+t.name);})();
    const expectedQueues=new Map();for(const row of expected.attributes){const k=row.label+'|'+row.key;if(!expectedQueues.has(k))expectedQueues.set(k,[]);expectedQueues.get(k).push(row);}
    const logicalIndexFingerprint=async a=>{const values=Uint32Array.from(a.array);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(values.buffer))),b=>b.toString(16).padStart(2,'0')).join('');};
    const objects=[],attrs=[],materials=new Set(),textures=new Set(),geometries=new Set(),disposals=[],listeners=[];
    p.model.traverse(mesh=>{if(!mesh.isMesh)return;const slots=Array.isArray(mesh.material)?mesh.material.slice():[mesh.material];objects.push({mesh,geometry:mesh.geometry,material:mesh.material,slots,maps:slots.map(m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture)))});geometries.add(mesh.geometry);for(const m of slots){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
    let matchedNativeAttributes=0,logicalIndexComparisons=0;const promotedGeometries={eye147:0,eyelash151:0,jaw155:0,cloth154:0};
    for(const o of objects){
      if(o.geometry.userData.eyeContour147?.version==='eye-contour-147')promotedGeometries.eye147++;
      if(o.geometry.userData.eyelash151?.version==='existing-lash-sweep-151')promotedGeometries.eyelash151++;
      if(o.geometry.userData.jawSilhouette155?.version==='jaw-silhouette-155')promotedGeometries.jaw155++;
      if(o.geometry.userData.blouseDrape154?.version==='blouse-drape-154')promotedGeometries.cloth154++;
      for(const[name,a]of[...Object.entries(o.geometry.attributes),['index',o.geometry.index]])if(a){
        const digest=await fingerprint(a);attrs.push({mesh:o.mesh,name,a,array:a.array,version:a.version,hash:digest});
        const k=o.mesh.parent.name+'/'+o.mesh.name+'|'+name,queue=expectedQueues.get(k);demand(queue?.length,'Missing expected native attribute: '+k);const native=queue.shift();
        if(name==='index'&&native.indexLogicalSHA256){demand(await logicalIndexFingerprint(a)===native.indexLogicalSHA256,'Selected logical index differs: '+k);logicalIndexComparisons++;}
        else demand(digest===native.sha256,'Selected native attribute differs: '+k);
        matchedNativeAttributes++;
      }
    }
    demand(matchedNativeAttributes===282&&[...expectedQueues.values()].every(q=>!q.length)&&promotedGeometries.eye147===31&&promotedGeometries.eyelash151===2&&promotedGeometries.jaw155===(expected.jaw155?2:0)&&promotedGeometries.cloth154===(expected.cloth154?1:0),'157 selected geometry/attribute population differs.');
    const materialAppearance=[],textureAppearance=[];
    for(const material of materials)materialAppearance.push({material,physical:physical(material),metadata:JSON.stringify(material.userData)});
    for(const texture of textures)textureAppearance.push({texture,source:texture.source,image:texture.image,data:texture.image?.data,width:texture.image.width,height:texture.image.height,sampler:sampler(texture),metadata:JSON.stringify(texture.userData),hash:await digest(pixels(texture))});
    // Store only hashes of temporary pixel reads; do not retain canvas copies.
    for(const [kind,set]of[['geometry',geometries],['material',materials],['texture',textures]])for(const resource of set){const fn=()=>disposals.push(kind+':'+resource.name);resource.addEventListener('dispose',fn);listeners.push([resource,fn]);}
    const hairMaterials=[];hair.traverse(mesh=>{if(mesh.isMesh&&!hairMaterials.includes(mesh.material))hairMaterials.push(mesh.material);});
    demand(hairMaterials.length===5&&hairMaterials.every(m=>m.color.toArray().every((v,k)=>v===[.65,.69,.75][k])),'Uniform149 color differs or was applied twice.');
    const metrics=Object.fromEntries(Object.entries({mouth130:p.state.mouthContinuity130,upper140:p.state.upperLipRelief140,crown100:p.state.referenceCrown,crown141:p.state.crownFacing141,eye147:p.state.eyeContour147,color149:p.state.hairColor149,eyelash151:p.state.eyelash151,jaw155:p.state.jawSilhouette155,cloth154:p.state.blouseDrape154}).filter(([,v])=>v!==undefined));
    window.integrated157={objects,attrs,fingerprint,metrics,crown,mass,hairMaterials,disposals,listeners,digest,physical,sampler,pixels,materialAppearance,textureAppearance};
    return{nativeWebGPU:true,iteration:p.state.iteration,score:p.state.score,title:document.querySelector('#page-title').textContent,output:[p.state.width,p.state.height],internal:p.state.internalRender,promotedGeometries,matchedNativeAttributes,logicalIndexComparisons,sourceMeshBindings:objects.length,protectedAttributes:attrs.length,eye147:p.state.eyeContour147,color149:p.state.hairColor149,eyelash151:p.state.eyelash151,jaw155:p.state.jawSilhouette155,cloth154:p.state.blouseDrape154,hairTriangles:hair.userData.triangles,hairGeometryMiB:hair.userData.geometryMiB,heapMiB:performance.memory?.usedJSHeapSize/1048576};
  },{attributes:expectedAttributes,cloth154:manifest.selectedEvidence.some(r=>r.iteration===154),jaw155:manifest.selectedEvidence.some(r=>r.iteration===155)});
  for(const[pass,backend,views]of[['webgpu','webgpu',['front','detail','left','right','back']],['explicit-webgl','webgl',['front','detail']],['webgpu-return','webgpu',['front']]]){
    if(pass!=='webgpu')await page.evaluate(async backend=>{const p=window.portrait;await p.initialize(backend);if(!p.ready||(backend==='webgpu'?!p.renderer.backend?.isWebGPUBackend:!p.renderer.isWebGLRenderer))throw Error('Explicit renderer change failed: '+backend);},backend);
    const result={pass,explicitlyRequestedBackend:backend,captures:[]};
    for(const view of views){
      const frame=await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();if(p.renderer.backend?.isWebGPUBackend)await p.renderer.backend.device.queue.onSubmittedWorkDone();else if(p.renderer.getContext().getError()!==p.renderer.getContext().NO_ERROR)throw Error('WebGL error.');return{view,backend:p.state.backend,cpuSubmissionMs:p.state.renderMs,internal:p.state.internalRender,camera:{position:p.camera.position.toArray(),target:p.controls.target.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom}};},view);
      const file='integrated157-'+pass+'-'+view+'.png',b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});result.captures.push({...frame,file:'output/qa/'+file,bytes:b.length,sha256:hash(b)});
      if(pass==='webgpu'&&view==='front')await page.screenshot({path:path.join(qa,'integrated157-webgpu-page.png'),fullPage:true,animations:'disabled'});
    }
    result.integrity=await page.evaluate(async()=>{
      const p=window.portrait,s=window.integrated157,current={mouth130:p.state.mouthContinuity130,upper140:p.state.upperLipRelief140,crown100:p.state.referenceCrown,crown141:p.state.crownFacing141,eye147:p.state.eyeContour147,color149:p.state.hairColor149,eyelash151:p.state.eyelash151,jaw155:p.state.jawSilhouette155,cloth154:p.state.blouseDrape154};
      for(const[k,v]of Object.entries(s.metrics))if(current[k]!==v)throw Error('Preparation repeated across renderer change: '+k);
      for(const o of s.objects){if(o.mesh.geometry!==o.geometry||o.mesh.material!==o.material)throw Error('Geometry/material binding changed: '+o.mesh.name);const slots=Array.isArray(o.material)?o.material:[o.material];if(slots.length!==o.slots.length||slots.some((m,i)=>m!==o.slots[i]))throw Error('Material slot changed.');for(let i=0;i<slots.length;i++)for(const[k,t]of Object.entries(o.maps[i]))if(slots[i][k]!==t)throw Error('Original texture binding changed.');}
      for(const r of s.attrs){const a=r.name==='index'?r.mesh.geometry.index:r.mesh.geometry.getAttribute(r.name);if(a!==r.a||a.array!==r.array||a.version!==r.version||await s.fingerprint(a)!==r.hash)throw Error('Attribute changed across rendering: '+r.mesh.name+'.'+r.name);}
      for(const r of s.materialAppearance)if(s.physical(r.material)!==r.physical||JSON.stringify(r.material.userData)!==r.metadata)throw Error('Material values changed across rendering: '+r.material.name);
      for(const r of s.textureAppearance){const t=r.texture;if(t.source!==r.source||t.image!==r.image||t.image?.data!==r.data||t.image.width!==r.width||t.image.height!==r.height||s.sampler(t)!==r.sampler||JSON.stringify(t.userData)!==r.metadata||await s.digest(s.pixels(t))!==r.hash)throw Error('Texture pixels/sampler changed across rendering: '+t.name);}
      if(s.hairMaterials.some(m=>m.color.toArray().some((v,k)=>v!==[.65,.69,.75][k])))throw Error('Hair color compounded across renderer change.');
      if(s.crown.material.side!==0||s.crown.material.shadowSide!==2||s.mass.material.side!==2||s.disposals.length)throw Error('Crown ownership or original disposal changed.');
      return{exactCachedMetrics:Object.keys(s.metrics).length,exactAttributeBuffers:s.attrs.length,exactMeshBindings:s.objects.length,exactMaterialValues:s.materialAppearance.length,exactTextureImagesAndSamplers:s.textureAppearance.length,exactUniformHairColors:s.hairMaterials.length,originalDisposals:s.disposals.length,heapMiB:performance.memory?.usedJSHeapSize/1048576};
    });
    const before=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,before);if(result.idleFrames)throw Error('Unexpected idle rendering.');
    report.cases.push(result);await save();console.log(JSON.stringify({pass,integrity:result.integrity,idleFrames:result.idleFrames}));
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
  report.narrowLayout=await page.evaluate(()=>{const p=window.portrait,stage=document.querySelector('#viewport-wrap').getBoundingClientRect(),title=document.querySelector('#page-title').getBoundingClientRect();return{browserViewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,stage:{x:stage.x,y:stage.y,width:stage.width,height:stage.height},titleAboveStage:title.bottom<=stage.top,output:[p.renderer.domElement.width,p.renderer.domElement.height],renderer:p.state.backend,score:document.querySelector('#score-label').textContent,iteration:document.querySelector('#iteration-label').textContent,scope:'CSS layout in desktop Chrome at390px; not a physical phone performance measurement.'};});
  if(!report.narrowLayout.titleAboveStage||report.narrowLayout.documentWidth>392||report.narrowLayout.output[0]!==900||report.narrowLayout.output[1]!==1200)throw Error('Narrow layout or preserved render resolution failed.');
  await page.screenshot({path:path.join(qa,'integrated157-narrow-page.png'),fullPage:true,animations:'disabled'});
  await page.evaluate(()=>{for(const[r,fn]of window.integrated157.listeners)r.removeEventListener('dispose',fn);window.integrated157.listeners.length=0;});
  if(report.errors.length)throw Error('Browser errors recorded.');report.status='Passed';await save();
}catch(error){report.status='Failed';report.failure=String(error?.stack||error);await save();throw error;}
finally{try{if(page)await page.close();}finally{await browser.close();}}
