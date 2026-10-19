import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {sha164,loadEvidence164} from './evidence.mjs';

// Root-only check AFTER the reviewed seven-file164 stage has been applied and
// the ordinary project build has completed. It reads the served production
// bundle; it does not route a candidate, retain source meshes, or run field grids.
const root=path.resolve(import.meta.dirname,'../..'),qa=path.join(root,'output/qa');
await mkdir(qa,{recursive:true});
const demand=(value,message)=>{if(!value)throw Error('164 '+message);};
const manifest=JSON.parse(await readFile(path.join(root,'review/integration164/manifest.json'),'utf8'));
demand(manifest.iteration===164&&manifest.acceptedBase===157&&manifest.score===78&&manifest.status==='Staged selected components; native integration pending','selection manifest differs');
for(const row of[...manifest.runtimeFiles,...manifest.verificationFiles]){
 const bytes=await readFile(path.join(root,row.file));demand(bytes.length===row.bytes&&sha164(bytes)===row.sha256,'source guard: '+row.file);
}
const expectedMain=manifest.runtimeFiles.find(r=>r.file==='src/main.js')?.sha256;
demand(expectedMain==='88280af03c4be630968aca0763d3d430ec6699ae9533ba057015c53801d4ae55','missing frozen164 main');
const expected=await loadEvidence164(root);
const [app,html,css,buildBytes]=await Promise.all(['app.js','index.html','style.css','build-info.json'].map(file=>readFile(path.join(root,'output',file))));
const buildInfo=JSON.parse(buildBytes);
demand(sha164(html)===manifest.runtimeFiles.find(r=>r.file==='index.html')?.sha256&&sha164(css)===manifest.runtimeFiles.find(r=>r.file==='src/style.css')?.sha256,'output HTML/CSS is stale');
for(const file of['src/main.js','src/collar-roll.js','src/jaw-ear.js','src/jaw-silhouette.js','src/jaw-silhouette155-field.js','src/jaw-silhouette155-config.json'])demand(buildInfo.sourceModules.includes(file),'ordinary build is missing '+file);
demand(buildInfo.outputBytes===app.length&&buildInfo.defaultBackend==='WebGPU','ordinary build metadata differs');
const report={iteration:164,score:78,acceptedBase:157,status:'Running',expectedMain,selected:expected.summary,
 sourceEvidence:manifest.nativeEvidence,attributeSubstitutions:expected.replacements,build:{bytes:app.length,sha256:sha164(app),built:buildInfo.built},cases:[],errors:[],
 scope:'Selected158 collar and common159 face/neck/ears on157. All282 actual attributes,64 logical indices, material values/maps, geometry bindings and production cache identities are compared across WebGPU, explicitly requested WebGL, and WebGPU return. No component field/contact grid is rerun. Combined art and the partly hair-occluded far ear remain separately assessed.'};
const save=()=>writeFile(path.join(qa,'integrated164-native.json'),JSON.stringify(report,null,2)+'\n');
let browser,page;
try{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
 page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push({type:'pageerror',message:e.message}));
 page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text().slice(0,1800)});});
 const url=new URL(process.env.PORTRAIT_URL||'http://127.0.0.1:8766/');url.searchParams.set('backend','webgpu');
 const servedApp=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/app.js'),{timeout:30000}).then(response=>({response}),error=>({error}));
 await page.goto(url.href,{waitUntil:'networkidle'});
 const observedApp=await servedApp;demand(!observedApp.error,'ordinary app response failed: '+observedApp.error);const response=observedApp.response,servedBytes=await response.body();demand(response.ok()&&sha164(servedBytes)===sha164(app),'served app differs from the checked ordinary build');
 await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:60000});
 report.setup=await page.evaluate(async expected=>{
  const p=window.portrait,demand=(value,message)=>{if(!value)throw Error('164 '+message);};
  demand(p.ready&&p.renderer.backend?.isWebGPUBackend,'native WebGPU unavailable; no automatic fallback');
  demand(p.state.iteration===164&&p.state.score===78,'selected iteration/score missing');
  demand(p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'default output changed');
  demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4,'selected Neutral1.4 display changed');
  const eye=p.state.eyeContour147,lash=p.state.eyelash151,cloth=p.state.blouseDrape154,collar=p.state.collarRoll158,jaw=p.state.jawEar159;
  demand(eye?.applied&&eye.strength===1&&eye.retainSourceForQA===false&&eye.retainedSourceGeometryReferences===0,'production147 is absent or retains QA originals');
  demand(lash?.applied&&lash.version==='existing-lash-sweep-151'&&lash.strength===1&&lash.privateGeometryCount===2&&lash.retainSourceForQA===false&&lash.retainedSourceGeometryReferences===0,'production151 is absent or retains QA originals');
  demand(cloth?.applied&&cloth.version==='blouse-drape-154'&&cloth.strength===1&&cloth.privateGeometries===1&&cloth.retainsSourceForQA===false,'production154 preparation or retention differs');
  demand(collar?.applied&&collar.version==='collar-free-leaf-roll-158'&&collar.strength===1&&collar.privateGeometries===4&&collar.retainsSourceForQA===false&&collar.privateAttributeBytes===314608&&collar.extraVertices===0&&collar.extraTriangles===0&&collar.extraMaps===0&&collar.extraDraws===0,'production158 preparation or zero source retention differs');
  demand(jaw?.applied&&jaw.version==='common-jaw-ear-field-159'&&jaw.strength===1&&jaw.privateGeometryCount===4&&jaw.privateAttributeBytes===8295776&&jaw.retainSourceForQA===false&&jaw.retainedSourceGeometryReferences===0&&jaw.perFrameWork===0&&jaw.addedDraws===0&&jaw.addedTextureBytes===0,'production159 preparation or zero source retention differs');
  demand(jaw.faceNeck?.version==='jaw-silhouette-155'&&jaw.faceNeck.applied&&jaw.faceNeck.strength===1&&jaw.faceNeck.privateGeometryCount===2&&jaw.faceNeck.retainSourceForQA===false&&jaw.faceNeck.retainedSourceGeometryReferences===0,'nested155 retains source geometry or differs');
  demand(p.state.upperLipRelief140?.applied&&p.state.upperLipRelief140.strength===1&&p.state.mouthContinuity130?.strength===1,'accepted lips are absent');
  demand(p.state.hairColor149?.materials===5&&p.state.balance?.shiftX===-.24&&p.state.pose?.shiftX===.26,'accepted color/body/head preparation differs');
  demand(document.querySelector('#page-title').textContent.includes('GPT-6 Astra'),'creator name missing above model');
  demand(!window.collar158QA&&!window.jawEar159QA,'a component QA source-retention harness entered production');
  const crown=p.model.getObjectByName('Continuous parted crown with longitudinal fiber flow'),mass=p.model.getObjectByName('Overlapping layered S-wave hair around front back and shoulders'),hair=p.model.getObjectByName('Original reference-directed chestnut layered groom');
  demand(crown.material!==mass.material&&crown.material.side===0&&crown.material.shadowSide===2&&mass.material.side===2,'accepted141 crown ownership changed');
  demand(hair.userData.guidePlacement118?.strength===.5&&hair.userData.shoulderContact?.strength===.35&&hair.userData.diagonalFringe133?.strength===1,'accepted118/86/133 route preparation differs');
  demand(!p.model.getObjectByName('closed-mouth-crease').visible,'separate mouth tube returned');
  p.startTurntable(false);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
  const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
  const fingerprint=a=>digest(a.array),logicalIndexFingerprint=a=>digest(a.array instanceof Uint32Array?a.array:Uint32Array.from(a.array));
  const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid','version'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
  const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
  const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('164 unsupported selected texture image: '+t.name);})();
  const transform=o=>JSON.stringify([o.position.toArray(),o.quaternion.toArray(),o.scale.toArray()]);
  const geometryMetadata=g=>JSON.stringify({userData:g.userData,groups:g.groups,drawRange:g.drawRange,attributes:Object.keys(g.attributes)});
  const mapBindings=m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture));
  // These are the three actual fresh-run timing leaves identified by158. They
  // are normalized only against the earlier native run. The raw metadata is
  // retained below and must remain exactly unchanged inside this one page.
  function crossNativeMetadata(kind,index,raw,excluded){
   const value=JSON.parse(raw),paths=kind==='materials'&&index===36?[['referenceCrownMicrocontrast','bakeMs'],['referenceCrownMicrocontrast','elapsedMs']]:kind==='textures'&&index===0?[['bakeMs']]:[];
   for(const keys of paths){let parent=value;for(const key of keys.slice(0,-1)){demand(parent&&Object.hasOwn(parent,key),'measured timing owner is absent');parent=parent[key];}const leaf=keys.at(-1),timing=parent?.[leaf];demand(typeof timing==='number'&&Number.isFinite(timing)&&timing>=0,'measured timing leaf differs');excluded.push({kind,index,path:keys.join('/'),value:timing});parent[leaf]='__cross_native_elapsed_ms_164__';}
   return JSON.stringify(value);
  }
  const expectedRows=new Map(expected.attributes.map(r=>[r.label+'|'+r.key,r]));demand(expectedRows.size===282,'indexed native attribute labels are not unique');
  const objects=[],nodes=[],attrs=[],attributeSummaries=[],materials=new Set(),textures=new Set(),geometries=new Set(),disposals=[],listeners=[];
  p.model.traverse(node=>{nodes.push({node,parent:node.parent,transform:transform(node),visible:node.visible});if(!node.isMesh)return;const mesh=node,slots=Array.isArray(mesh.material)?mesh.material.slice():[mesh.material],label=objects.length+':'+mesh.parent.name+'/'+mesh.name;
   objects.push({mesh,label,geometry:mesh.geometry,material:mesh.material,slots,maps:slots.map(mapBindings),geometryMetadata:geometryMetadata(mesh.geometry),castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,renderOrder:mesh.renderOrder});geometries.add(mesh.geometry);
   for(const m of slots){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}
  });
  demand(objects.length===64&&geometries.size===64&&materials.size===50&&textures.size===10,'native geometry/material/texture population differs');
  const materialIds=new Map([...materials].map((m,i)=>[m,i])),textureIds=new Map([...textures].map((t,i)=>[t,i])),geometryIds=new Map([...geometries].map((g,i)=>[g,i]));
  let matchedNativeAttributes=0,logicalIndexComparisons=0;
  const promotedGeometries={eye147:0,eyelash151:0,cloth154:0,collar158:0,jaw155:0,ear159:0},selectedGeometries=new Set();
  for(let i=0;i<objects.length;i++){
   const o=objects[i],nativeObject=expected.appearance.objects[i],nativeGeometry=expected.appearance.geometries[i];
   const actualObject={label:o.label,geometry:geometryIds.get(o.geometry),materials:o.slots.map(m=>materialIds.get(m)),transform:transform(o.mesh),visible:o.mesh.visible,castShadow:o.castShadow,receiveShadow:o.receiveShadow,renderOrder:o.renderOrder};
   demand(JSON.stringify(actualObject)===JSON.stringify(nativeObject),'baseline mesh/frame/material ownership differs: '+o.label);
   demand(nativeGeometry.label===o.label&&JSON.stringify(o.geometry.groups)===JSON.stringify(nativeGeometry.groups)&&JSON.stringify(o.geometry.drawRange)===JSON.stringify(nativeGeometry.drawRange),'selected geometry groups/draw range differ: '+o.label);
   if(o.geometry.userData.eyeContour147?.version==='eye-contour-147')promotedGeometries.eye147++;
   if(o.geometry.userData.eyelash151?.version==='existing-lash-sweep-151')promotedGeometries.eyelash151++;
   if(o.geometry.userData.blouseDrape154?.version==='blouse-drape-154')promotedGeometries.cloth154++;
   if(o.geometry.userData.collarRoll158?.version==='collar-free-leaf-roll-158'){promotedGeometries.collar158++;selectedGeometries.add(o.geometry);}
   if(o.geometry.userData.jawSilhouette155?.version==='jaw-silhouette-155'){promotedGeometries.jaw155++;selectedGeometries.add(o.geometry);}
   if(o.geometry.userData.jawEar159?.version==='common-jaw-ear-field-159'){promotedGeometries.ear159++;selectedGeometries.add(o.geometry);}
   for(const[name,a]of[...Object.entries(o.geometry.attributes),['index',o.geometry.index]])if(a){
    const key=o.label+'|'+name,native=expectedRows.get(key),schema=nativeGeometry.attributes.find(r=>r.key===name);demand(native&&schema,'missing expected native attribute: '+key);
    demand(a.array.length===native.values&&a.count===schema.count&&a.itemSize===schema.itemSize&&a.normalized===schema.normalized,'selected attribute layout differs: '+key);
    const hash=await fingerprint(a),logical=name==='index'?await logicalIndexFingerprint(a):null;
    if(name==='index'){demand(logical===native.indexLogicalSHA256,'selected logical index differs: '+key);logicalIndexComparisons++;}
    else demand(a.array.constructor.name===native.type&&a.array.byteLength===native.bytes&&hash===native.sha256,'selected native attribute differs: '+key);
    attrs.push({mesh:o.mesh,geometry:o.geometry,label:o.label,name,a,array:a.array,version:a.version,itemSize:a.itemSize,count:a.count,normalized:a.normalized,usage:a.usage,gpuType:a.gpuType,hash});
    attributeSummaries.push({label:o.label,key:name,type:a.array.constructor.name,bytes:a.array.byteLength,values:a.array.length,version:a.version,sha256:hash,indexLogicalSHA256:logical});
    expectedRows.delete(key);matchedNativeAttributes++;
   }
  }
  demand(matchedNativeAttributes===282&&expectedRows.size===0&&logicalIndexComparisons===64&&promotedGeometries.eye147===31&&promotedGeometries.eyelash151===2&&promotedGeometries.cloth154===1&&promotedGeometries.collar158===4&&promotedGeometries.jaw155===2&&promotedGeometries.ear159===2&&selectedGeometries.size===8,'selected geometry/attribute population differs');
  const selectedAttrs=attrs.filter(r=>selectedGeometries.has(r.geometry));demand(selectedAttrs.length===38,'selected private attribute inventory differs');
  for(const row of selectedAttrs)demand(!attrs.some(other=>other.geometry!==row.geometry&&other.array.buffer===row.array.buffer),'selected replacement shares another geometry buffer: '+row.label+'.'+row.name);
  const materialAppearance=[],textureAppearance=[],appearanceSummary={materials:[],textures:[]},crossNativeTimingExclusions=[];
  for(const material of materials){
   const index=materialAppearance.length,native=expected.appearance.materials[index],metadata=JSON.stringify(material.userData),values=physical(material),maps=mapBindings(material);
   demand(values===native.physical&&JSON.stringify(Object.fromEntries(Object.entries(maps).map(([k,t])=>[k,textureIds.get(t)])))===JSON.stringify(native.maps),'material values/map ownership differ from accepted native157: '+index);
   const oldExcluded=[],newExcluded=[];demand(crossNativeMetadata('materials',index,metadata,newExcluded)===crossNativeMetadata('materials',index,native.metadata,oldExcluded),'material metadata differs beyond measured timings: '+index);
   crossNativeTimingExclusions.push(...newExcluded.map((r,i)=>({...r,baseline:oldExcluded[i].value})));
   materialAppearance.push({material,physical:values,metadata,maps});appearanceSummary.materials.push({label:native.label,physical:values,metadata,maps:native.maps});
  }
  for(const texture of textures){
   const index=textureAppearance.length,native=expected.appearance.textures[index],metadata=JSON.stringify(texture.userData),hash=await digest(pixels(texture));
   demand(texture.image.width===native.size[0]&&texture.image.height===native.size[1]&&sampler(texture)===native.sampler&&hash===native.sha256,'texture pixels/sampler differ from accepted native157: '+index);
   const oldExcluded=[],newExcluded=[];demand(crossNativeMetadata('textures',index,metadata,newExcluded)===crossNativeMetadata('textures',index,native.metadata,oldExcluded),'texture metadata differs beyond measured timings: '+index);
   crossNativeTimingExclusions.push(...newExcluded.map((r,i)=>({...r,baseline:oldExcluded[i].value})));
   textureAppearance.push({texture,source:texture.source,image:texture.image,data:texture.image?.data,width:texture.image.width,height:texture.image.height,sampler:sampler(texture),metadata,hash});appearanceSummary.textures.push({label:native.label,size:native.size,sampler:sampler(texture),metadata,sha256:hash});
  }
  demand(crossNativeTimingExclusions.length===3,'timing exclusion scope expanded');
  // Only hashes of temporary canvas pixel reads are retained.
  for(const[kind,set]of[['geometry',geometries],['material',materials],['texture',textures]])for(const resource of set){const fn=()=>disposals.push(kind+':'+resource.name);resource.addEventListener('dispose',fn);listeners.push([resource,fn]);}
  const hairMaterials=[];hair.traverse(mesh=>{if(mesh.isMesh&&!hairMaterials.includes(mesh.material))hairMaterials.push(mesh.material);});
  demand(hairMaterials.length===5&&hairMaterials.every(m=>m.color.toArray().every((v,k)=>v===[.65,.69,.75][k])),'uniform149 color differs or was applied twice');
  const metrics={mouth130:p.state.mouthContinuity130,upper140:p.state.upperLipRelief140,crown100:p.state.referenceCrown,crown141:p.state.crownFacing141,eye147:p.state.eyeContour147,color149:p.state.hairColor149,eyelash151:p.state.eyelash151,cloth154:p.state.blouseDrape154,collar158:p.state.collarRoll158,jaw159:p.state.jawEar159};
  demand(Object.values(metrics).every(Boolean),'one selected preparation result is missing');
  window.integrated164={objects,nodes,attrs,fingerprint,metrics,nestedJaw:jaw.faceNeck,crown,mass,hairMaterials,disposals,listeners,digest,physical,sampler,pixels,transform,geometryMetadata,mapBindings,materialAppearance,textureAppearance};
  return{nativeWebGPU:true,iteration:p.state.iteration,score:p.state.score,title:document.querySelector('#page-title').textContent,output:[p.state.width,p.state.height],internal:p.state.internalRender,promotedGeometries,matchedNativeAttributes,logicalIndexComparisons,meshBindings:objects.length,protectedAttributes:attrs.length,selectedPrivateAttributes:selectedAttrs.length,selectedPrivateGeometries:selectedGeometries.size,selectedPrivateBytesAfterUpload:selectedAttrs.reduce((sum,r)=>sum+r.array.byteLength,0),productionRetention:{collar158:collar.retainsSourceForQA,jaw159:jaw.retainSourceForQA,jaw159OriginalReferences:jaw.retainedSourceGeometryReferences,nested155:jaw.faceNeck.retainSourceForQA,nested155OriginalReferences:jaw.faceNeck.retainedSourceGeometryReferences,scope:'Metrics plus exact frozen production cache implementation; no source meshes are held by this integration harness. This is not a garbage-collector heap proof.'},eye147:eye,color149:p.state.hairColor149,eyelash151:lash,cloth154:cloth,collar158:collar,jaw159:jaw,attributes:attributeSummaries,appearance:appearanceSummary,crossNativeTimingExclusions,hairTriangles:hair.userData.triangles,hairGeometryMiB:hair.userData.geometryMiB,heapMiB:performance.memory?.usedJSHeapSize/1048576};
 },{attributes:expected.attributes,appearance:expected.appearance});
 for(const[pass,backend,views]of[['webgpu','webgpu',['front','detail','left','right','back']],['explicit-webgl','webgl',['front','detail']],['webgpu-return','webgpu',['front']]]){
  if(pass!=='webgpu')await page.evaluate(async backend=>{const p=window.portrait;await p.initialize(backend);if(!p.ready||(backend==='webgpu'?!p.renderer.backend?.isWebGPUBackend:!p.renderer.isWebGLRenderer))throw Error('Explicit renderer change failed: '+backend);},backend);
  const result={pass,explicitlyRequestedBackend:backend,captures:[]};
  for(const view of views){
   const frame=await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();if(p.renderer.backend?.isWebGPUBackend)await p.renderer.backend.device.queue.onSubmittedWorkDone();else if(p.renderer.getContext().getError()!==p.renderer.getContext().NO_ERROR)throw Error('WebGL error');return{view,backend:p.state.backend,cpuSubmissionMs:p.state.renderMs,internal:p.state.internalRender,camera:{position:p.camera.position.toArray(),target:p.controls.target.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom}};},view);
   const file='integrated164-'+pass+'-'+view+'.png',bytes=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});result.captures.push({...frame,file:'output/qa/'+file,bytes:bytes.length,sha256:sha164(bytes)});
   if(pass==='webgpu'&&view==='front')await page.screenshot({path:path.join(qa,'integrated164-webgpu-page.png'),fullPage:true,animations:'disabled'});
  }
  result.integrity=await page.evaluate(async()=>{
   const p=window.portrait,s=window.integrated164,current={mouth130:p.state.mouthContinuity130,upper140:p.state.upperLipRelief140,crown100:p.state.referenceCrown,crown141:p.state.crownFacing141,eye147:p.state.eyeContour147,color149:p.state.hairColor149,eyelash151:p.state.eyelash151,cloth154:p.state.blouseDrape154,collar158:p.state.collarRoll158,jaw159:p.state.jawEar159};
   for(const[k,v]of Object.entries(s.metrics))if(current[k]!==v)throw Error('Preparation repeated across renderer change: '+k);
   if(p.state.jawEar159.faceNeck!==s.nestedJaw||p.state.jawEar159.retainSourceForQA!==false||p.state.jawEar159.retainedSourceGeometryReferences!==0||p.state.jawEar159.faceNeck.retainSourceForQA!==false||p.state.jawEar159.faceNeck.retainedSourceGeometryReferences!==0||p.state.collarRoll158.retainsSourceForQA!==false)throw Error('Production retention/nested155 cache changed');
   for(const r of s.nodes)if(r.node.parent!==r.parent||s.transform(r.node)!==r.transform||r.node.visible!==r.visible)throw Error('Model hierarchy/pose/visibility changed: '+r.node.name);
   for(const o of s.objects){
    if(o.mesh.geometry!==o.geometry||o.mesh.material!==o.material||s.geometryMetadata(o.geometry)!==o.geometryMetadata||o.mesh.castShadow!==o.castShadow||o.mesh.receiveShadow!==o.receiveShadow||o.mesh.renderOrder!==o.renderOrder)throw Error('Geometry/material binding or metadata changed: '+o.mesh.name);
    const slots=Array.isArray(o.material)?o.material:[o.material];if(slots.length!==o.slots.length||slots.some((m,i)=>m!==o.slots[i]))throw Error('Material slot changed');
    for(let i=0;i<slots.length;i++){const maps=s.mapBindings(slots[i]);if(Object.keys(maps).length!==Object.keys(o.maps[i]).length||Object.entries(o.maps[i]).some(([k,t])=>maps[k]!==t))throw Error('Texture binding changed');}
   }
   for(const r of s.attrs){const a=r.name==='index'?r.mesh.geometry.index:r.mesh.geometry.getAttribute(r.name);if(a!==r.a||a.array!==r.array||a.version!==r.version||a.itemSize!==r.itemSize||a.count!==r.count||a.normalized!==r.normalized||a.usage!==r.usage||a.gpuType!==r.gpuType||await s.fingerprint(a)!==r.hash)throw Error('Attribute changed across rendering: '+r.mesh.name+'.'+r.name);}
   for(const r of s.materialAppearance)if(s.physical(r.material)!==r.physical||JSON.stringify(r.material.userData)!==r.metadata)throw Error('Material values/raw metadata changed across rendering: '+r.material.name);
   for(const r of s.textureAppearance){const t=r.texture;if(t.source!==r.source||t.image!==r.image||t.image?.data!==r.data||t.image.width!==r.width||t.image.height!==r.height||s.sampler(t)!==r.sampler||JSON.stringify(t.userData)!==r.metadata||await s.digest(s.pixels(t))!==r.hash)throw Error('Texture pixels/sampler/raw metadata changed across rendering: '+t.name);}
   if(s.hairMaterials.some(m=>m.color.toArray().some((v,k)=>v!==[.65,.69,.75][k])))throw Error('Hair color compounded across renderer change');
   if(s.crown.material.side!==0||s.crown.material.shadowSide!==2||s.mass.material.side!==2||s.disposals.length)throw Error('Crown ownership or original disposal changed');
   if(p.state.width!==900||p.state.height!==1200||p.state.antialiasing!==2||p.renderer.toneMapping!==7||p.renderer.toneMappingExposure!==1.4||p.state.iteration!==164||p.state.score!==78)throw Error('Selected display/state changed');
   return{exactCachedPreparations:Object.keys(s.metrics).length,exactNestedJawPreparation:true,exactAttributeBuffers:s.attrs.length,exactMeshBindings:s.objects.length,exactModelNodes:s.nodes.length,exactMaterialValues:s.materialAppearance.length,exactTextureImagesAndSamplers:s.textureAppearance.length,exactRawMetadataAcrossBackends:true,exactUniformHairColors:s.hairMaterials.length,productionOriginalReferences:0,originalDisposals:s.disposals.length,heapMiB:performance.memory?.usedJSHeapSize/1048576};
  });
  const before=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,before);demand(result.idleFrames===0,'unexpected idle rendering');
  report.cases.push(result);await save();console.log(JSON.stringify({iteration:164,pass,integrity:result.integrity,idleFrames:result.idleFrames}));
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 report.narrowLayout=await page.evaluate(()=>{const p=window.portrait,stage=document.querySelector('#viewport-wrap').getBoundingClientRect(),title=document.querySelector('#page-title').getBoundingClientRect();return{browserViewport:[innerWidth,innerHeight],documentWidth:document.documentElement.scrollWidth,stage:{x:stage.x,y:stage.y,width:stage.width,height:stage.height},titleAboveStage:title.bottom<=stage.top,output:[p.renderer.domElement.width,p.renderer.domElement.height],renderer:p.state.backend,score:document.querySelector('#score-label').textContent,iteration:document.querySelector('#iteration-label').textContent,scope:'CSS layout in desktop Chrome at390px; not a physical phone performance measurement.'};});
 demand(report.narrowLayout.titleAboveStage&&report.narrowLayout.documentWidth<=392&&report.narrowLayout.output[0]===900&&report.narrowLayout.output[1]===1200&&report.narrowLayout.iteration==='ITERATION 164','narrow layout or preserved output failed');
 await page.screenshot({path:path.join(qa,'integrated164-narrow-page.png'),fullPage:true,animations:'disabled'});
 const cleanup=await page.evaluate(()=>{const s=window.integrated164;for(const[r,fn]of s.listeners)r.removeEventListener('dispose',fn);const count=s.listeners.length;s.listeners.length=0;window.integrated164=null;return{removedQAListeners:count,productionGeometryDisposed:0,retainedQASourceGeometry:0,scope:'Only integration observer references are released; selected production geometry is not rolled back.'};});report.cleanup=cleanup;
 demand(report.errors.length===0,'browser errors recorded');report.status='Passed';await save();
}catch(error){report.status='Failed';report.failure=String(error?.stack||error);await save();throw error;}
finally{
 try{if(page&&!page.isClosed()){try{await page.evaluate(()=>{const s=window.integrated164;if(s){for(const[r,fn]of s.listeners)r.removeEventListener('dispose',fn);s.listeners.length=0;window.integrated164=null;}});}finally{await page.close();}}}
 finally{if(browser)await browser.close();}
}
