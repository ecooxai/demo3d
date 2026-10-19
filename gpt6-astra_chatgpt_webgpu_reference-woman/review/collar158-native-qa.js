import {Group,Mesh,Matrix4} from 'three';
import {applyPortraitBalance} from '../src/portrait-balance.js';
import {COLLAR158_SPEC,collarWorkspace158,collarMap158,applyCollarRoll158,releaseCollarRoll158} from './collar-roll-candidate158.js';
import {inspectCollarTriangles158} from './collar158-geometry-audit.js';

// Review-only source retention. Four unrendered originals receive the same
// one99 pass through a frame-identical proxy; production158 retains none.
const demand=(v,s)=>{if(!v)throw Error('158 '+s);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');
const logical=a=>a instanceof Uint32Array?a:Uint32Array.from(a);
const transform=o=>JSON.stringify([o.position.toArray(),o.quaternion.toArray(),o.scale.toArray()]);
const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
const maps=m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture));
const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('158 unsupported existing texture image: '+t.name);})();
const geometryMeta=g=>JSON.stringify({userData:g.userData,groups:g.groups,drawRange:g.drawRange,names:Object.keys(g.attributes),bounds:[g.boundingBox,g.boundingSphere]});
const identityResidual=m=>Math.max(...m.elements.map((v,i)=>Math.abs(v-(i%5===0?1:0))));
async function record(g,key,a,label){return{g,key,a,array:a.array,label,type:a.array.constructor.name,bytes:a.array.byteLength,version:a.version,itemSize:a.itemSize,count:a.count,normalized:a.normalized,usage:a.usage,gpuType:a.gpuType,raw:await digest(a.array),logical:key==='index'?await digest(logical(a.array)):null};}
const summary=r=>({label:r.label,key:r.key,type:r.type,bytes:r.bytes,values:r.array.length,version:r.version,sha256:r.raw,indexLogicalSHA256:r.logical});

export async function prepareCollarQA158({blouse,model,state,strength}){
 demand(strength===0||strength===1,'requires explicit OFF/ON.');
 demand(state.referenceCloth117?.strength===.5&&state.blouseDrape154?.strength===1&&state.balance===undefined,'158 must follow117/154 and precede the single99 pass.');
 const started=performance.now(),clothMetric=state.referenceCloth117,drapeMetric=state.blouseDrape154,targets=[],sourceBuffers=new Set(),sourceAttributes=new Set(),preOriginal=[],postOriginal=[],postPrivate=[],finalAttributes=[],objects=[],geometries=new Map(),materials=new Map(),textures=new Map(),listeners=[],watched=new Set(),originalDispose=[],privateDispose=[],widenings=new Map(),previousState=new Map(),candidateOwners=new Map(),originalOwners=new Map();
 let metrics,balanced=false,finalized=false,released=false,referencesReleased=false,proxyMetrics=null,proxyMs=0,finalSignature=null;
 model.traverse(o=>{if(o.isMesh)for(const[,a]of entries(o.geometry)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}});
 const work=collarWorkspace158(),jet=new Float64Array(14);
 blouse.traverse(mesh=>{if(mesh.isMesh&&COLLAR158_SPEC.meshes.includes(mesh.name)){
  const original=mesh.geometry,p=original.getAttribute('position'),side=mesh.name.includes('-left-')?-1:1,ownedIndices=[];
  for(let i=0;i<p.count;i++){collarMap158(side,p.getX(i),p.getY(i),p.getZ(i),jet,work);if(jet[12])ownedIndices.push(i);}
  const r={mesh,original,candidate:null,material:mesh.material,side,ownedIndices,owned:new Set(ownedIndices)};targets.push(r);originalOwners.set(original,r);
 }});
 demand(targets.length===4&&new Set(targets.map(r=>r.mesh.name)).size===4,'requires four unique collar owners.');
 const watch=(resource,label,isOriginal=true)=>{
  if(watched.has(resource))return;watched.add(resource);
  const fn=()=>{if(isOriginal)originalDispose.push(label);else privateDispose.push({label,sourceBuffers:entries(resource).filter(([,a])=>sourceBuffers.has(a.array.buffer)).length,sourceAttributes:entries(resource).filter(([,a])=>sourceAttributes.has(a)).length});};
  resource.addEventListener('dispose',fn);listeners.push([resource,fn]);
 };
 for(const r of targets)watch(r.original,'retained-original-'+r.mesh.name);
 const audit={candidate:158,strength,scoreUnchanged:78,spec:COLLAR158_SPEC,ownedVertices:targets.reduce((s,r)=>s+r.ownedIndices.length,0),originalDispose,privateDispose,checkpoints:[],
  retention:'Only native QA retains four original collars. An unrendered frame-identical proxy carries them through the same99 once. Production158 retains zero old geometries. All original bindings are restored before all-private disposal.',
  contactScope:'Actual source-owned leaf/edge triangles against nearby fixed scene triangles. Front/back shell triangles and emitted seam support are separate checks; positive continuousJ is not a global triangle certificate.'};

 async function inspect(r,stage,allowUpload=true){
  const a=r.key==='index'?r.g.index:r.g.getAttribute(r.key);
  demand(a===r.a&&a.itemSize===r.itemSize&&a.count===r.count&&a.normalized===r.normalized&&a.usage===r.usage&&a.gpuType===r.gpuType&&a.version===r.version,'attribute binding/layout/version changed: '+r.label+'.'+r.key+' at '+stage);
  demand(await digest(r.array)===r.raw,'retained original array changed: '+r.label+'.'+r.key+' at '+stage);
  if(a.array!==r.array){demand(allowUpload&&r.key==='index'&&!a.normalized&&(r.array instanceof Uint16Array||r.array instanceof Uint8Array)&&a.array instanceof Uint32Array&&await digest(a.array)===r.logical,'unexplained attribute array replacement: '+r.label+'.'+r.key);widenings.set(r.label+'.'+r.key,{label:r.label,key:r.key,from:r.type,to:a.array.constructor.name,extraCPUBytes:a.array.byteLength-r.bytes,logicalValuesExact:true});}
  else demand(await digest(a.array)===r.raw,'bound array changed: '+r.label+'.'+r.key);
 }
 function protectedValues(){
  let positions=0,normals=0,originalStripPositions=0,originalStripNormals=0;
  for(const r of targets){
   const p=r.original.getAttribute('position'),q=r.candidate.getAttribute('position'),n=r.original.getAttribute('normal'),nn=r.candidate.getAttribute('normal'),uv=r.original.getAttribute('uv'),leaf=r.mesh.name.endsWith('spread-collar');
   for(let i=0;i<p.count;i++)for(let k=0;k<3;k++){
    const pc=!Object.is(p.array[i*3+k],q.array[i*3+k]),nc=!Object.is(n.array[i*3+k],nn.array[i*3+k]);
    if(!r.owned.has(i)){if(pc)positions++;if(nc)normals++;}
    if(leaf&&(uv.getX(i)<=.20||uv.getY(i)<=.20)){if(pc)originalStripPositions++;if(nc)originalStripNormals++;}
   }
  }
  demand(positions+normals+originalStripPositions+originalStripNormals===0,'unowned or original front/back attachment-strip values changed.');return{unownedPositionChanges:positions,unownedNormalChanges:normals,originalAttachmentPositionChanges:originalStripPositions,originalAttachmentNormalChanges:originalStripNormals};
 }
 function releaseRecords(){
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);
  listeners.length=preOriginal.length=postOriginal.length=postPrivate.length=finalAttributes.length=objects.length=0;watched.clear();geometries.clear();materials.clear();textures.clear();sourceBuffers.clear();sourceAttributes.clear();previousState.clear();candidateOwners.clear();originalOwners.clear();
  for(const r of targets){r.owned.clear();r.ownedIndices.length=0;r.original=r.candidate=r.material=r.mesh=null;}targets.length=0;referencesReleased=true;
 }
 try{
  for(const r of targets)for(const[key,a]of entries(r.original))preOriginal.push(await record(r.original,key,a,r.mesh.name+'-before158'));
  metrics=applyCollarRoll158(blouse,{strength,retainSourceForQA:true});demand(applyCollarRoll158(blouse,{strength,retainSourceForQA:true})===metrics,'same-option cached result changed.');
  for(const r of targets){
   r.candidate=r.mesh.geometry;candidateOwners.set(r.candidate,r);demand(strength?r.candidate!==r.original:r.candidate===r.original,'unexpected OFF/ON collar binding.');
   if(strength){watch(r.candidate,'private158-'+r.mesh.name,false);for(const[key,a]of entries(r.candidate)){demand(!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a),'private collar shares an original GPU binding.');if(!['position','normal'].includes(key))demand(await digest(a.array)===preOriginal.find(q=>q.g===r.original&&q.key===key).raw,'private immutable values changed.');}}
  }
  for(const r of preOriginal)await inspect(r,'immediately-after158',false);
  audit.metrics=metrics;audit.beforeBalanceProtection=protectedValues();audit.sourceAttributesBefore158=preOriginal.map(summary);audit.preparationMs=performance.now()-started;

  async function afterBalance(balance){
   demand(!balanced&&!finalized&&state.balance===balance&&balance.version==='shared-portrait-balance-99'&&balance.shiftX===-.24,'158 original continuation requires the one accepted99 result.');
   demand(state.referenceCloth117===clothMetric&&state.blouseDrape154===drapeMetric,'accepted117/154 cache changed.');model.updateWorldMatrix(true,true);blouse.updateWorldMatrix(true,true);
   demand(identityResidual(model.matrixWorld)<1e-12,'QA proxy requires the accepted identity model frame.');
   const inverse=new Matrix4().copy(model.matrixWorld).invert(),blouseInverse=new Matrix4().copy(blouse.matrixWorld).invert();
   if(strength){
    for(const r of preOriginal)await inspect(r,'detached-original-before99-proxy',false);
    const proxy=new Group(),proxyMeshes=[],t=performance.now();proxy.name='unrendered-four-collar158-original99-proxy';
    try{
     for(const r of targets){const local=new Matrix4().multiplyMatrices(blouseInverse,r.mesh.matrixWorld);demand(identityResidual(local)<1e-12,'collar-to-blouse frame drifted.');const toModel=new Matrix4().multiplyMatrices(inverse,r.mesh.matrixWorld),m=new Mesh(r.original,r.material);m.name=r.mesh.name;m.matrixAutoUpdate=false;m.matrix.copy(toModel);proxy.add(m);proxyMeshes.push({m,r,toModel});}
     proxy.updateWorldMatrix(true,true);for(const p of proxyMeshes)demand(Math.max(...p.m.matrixWorld.elements.map((v,i)=>Math.abs(v-p.toModel.elements[i])))<1e-14,'unrendered99 proxy is not frame-identical.');
     proxyMetrics=applyPortraitBalance(proxy,{shiftX:-.24});
     demand(proxyMetrics.meshes===4&&proxyMetrics.vertices===5870&&proxyMetrics.clonedSharedGeometries===0&&proxyMeshes.every(p=>p.m.geometry===p.r.original),'proxy99 changed original ownership/count.');
    }finally{for(const p of proxyMeshes)proxy.remove(p.m);}
    proxyMs=performance.now()-t;
   }
   audit.afterBalanceProtection=protectedValues();
   for(const r of targets){
    for(const[key,a]of entries(r.original))postOriginal.push(await record(r.original,key,a,'balanced-original-'+r.mesh.name));
    if(strength)for(const[key,a]of entries(r.candidate))postPrivate.push(await record(r.candidate,key,a,'balanced-private158-'+r.mesh.name));
   }
   for(const r of postOriginal)if(!['position','normal'].includes(r.key))demand(r.raw===preOriginal.find(p=>p.g===r.g&&p.key===r.key).raw,'99 changed immutable original collar values.');
   for(const r of postPrivate)if(!['position','normal'].includes(r.key)){const owner=candidateOwners.get(r.g);demand(r.raw===postOriginal.find(p=>p.g===owner.original&&p.key===r.key).raw,'private immutable collar differs after99.');}
   audit.originalAfter99Attributes=postOriginal.map(summary);audit.privateAfter99Attributes=postPrivate.map(summary);audit.proxy={used:!!strength,rendered:false,extraDraws:0,singleUnchanged99Pass:!!strength,metrics:proxyMetrics,elapsedMs:proxyMs};
   preOriginal.length=0;balanced=true;return audit.proxy;
  }

  function display({accepted=false}={}){
   const p=window.portrait;demand(p?.ready&&p.renderer.backend?.isWebGPUBackend,'requires native WebGPU; no fallback.');
   demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.lighting==='soft'&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted Neutral1.4 display changed.');
   demand(p.renderer.domElement.width===900&&p.renderer.domElement.height===1200&&p.state.internalRender.width===1800&&p.state.internalRender.height===2400,'native output/AA changed.');
   demand(p.state.referenceCloth117===clothMetric&&p.state.blouseDrape154===drapeMetric&&p.state.eyelash151?.strength===1&&p.state.eyeContour147?.strength===1&&p.state.upperLipRelief140?.strength===1&&p.state.crownFacing141?.side===0&&p.state.crownFacing141?.shadowSide===2&&p.state.balance?.shiftX===-.24,'selected157 preparations changed.');
   demand(JSON.stringify(p.state.hairColor149?.linearDiffuseMultiplier)===JSON.stringify([.65,.69,.75]),'accepted uniform hair tint changed.');
   if(accepted)demand(p.state.iteration===157&&p.state.score===78,'requires accepted157 score before setting158.');return{nativeWebGPU:true,toneMapping:7,exposure:1.4,output:[900,1200],internal:[1800,2400],antialiasing:2};
  }
  async function maskedHash(g,a,key){
   if(!['position','normal'].includes(key))return key==='index'?digest(logical(a.array)):digest(a.array);
   const owner=candidateOwners.get(g),copy=new a.array.constructor(a.array);for(const i of owner.ownedIndices)copy.fill(0,i*3,i*3+3);return digest(copy);
  }

  async function finalize(){
   demand(balanced&&!finalized&&!released,'final snapshot requires the completed99 pass.');display({accepted:true});
   for(const r of postOriginal)await inspect(r,'first-native-upload');for(const r of postPrivate)await inspect(r,'first-native-upload');audit.afterUploadProtection=protectedValues();
   const materialIds=new Map(),textureIds=new Map(),geometryIds=new Map();
   model.traverse(o=>{
    if(!o.isMesh)return;const g=o.geometry,label=objects.length+':'+o.parent.name+'/'+o.name;
    objects.push({mesh:o,g,material:o.material,slots:Array.isArray(o.material)?o.material.slice():null,parent:o.parent,label,visible:o.visible,castShadow:o.castShadow,receiveShadow:o.receiveShadow,renderOrder:o.renderOrder,transform:transform(o)});
    if(!geometries.has(g)){geometries.set(g,{label,metadata:geometryMeta(g)});geometryIds.set(g,geometryIds.size);watch(g,label+'.geometry',!strength||!candidateOwners.has(g));}
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
     if(!materials.has(m)){materials.set(m,{label,physical:physical(m),metadata:JSON.stringify(m.userData),maps:maps(m)});materialIds.set(m,materialIds.size);watch(m,label+'.material');}
     for(const[slot,t]of Object.entries(m))if(t?.isTexture&&!textures.has(t)){textures.set(t,{label:label+'.'+slot,source:t.source,image:t.image,data:t.image?.data,version:t.version,sourceVersion:t.source.version,metadata:JSON.stringify(t.userData),sampler:sampler(t)});textureIds.set(t,textureIds.size);watch(t,label+'.'+slot);}
    }
   });
   for(const[g,r]of geometries)for(const[key,a]of entries(g))finalAttributes.push(await record(g,key,a,r.label));for(const[t,r]of textures)r.hash=await digest(pixels(t));
   for(const key of['referenceCloth117','blouseDrape154','eyelash151','mouthContinuity130','upperLipRelief140','eyeContour147','hairColor149','nearEarYaw115','balance','referenceCrown','crownFacing141','collarRoll158']){demand(state[key]!==undefined,'missing accepted/candidate preparation: '+key);previousState.set(key,{value:state[key],json:JSON.stringify(state[key])});}
   const signature={objects:[],geometries:[],materials:[],textures:[]};
   for(const r of objects)signature.objects.push({label:r.label,geometry:geometryIds.get(r.g),materials:(r.slots||[r.material]).map(m=>materialIds.get(m)),transform:r.transform,visible:r.visible,castShadow:r.castShadow,receiveShadow:r.receiveShadow,renderOrder:r.renderOrder});
   for(const[g,r]of geometries){const row={label:r.label,groups:g.groups,drawRange:g.drawRange,attributes:[]};for(const[key,a]of entries(g))row.attributes.push({key,count:a.count,itemSize:a.itemSize,normalized:a.normalized,sha256:candidateOwners.has(g)?await maskedHash(g,a,key):key==='index'?await digest(logical(a.array)):await digest(a.array)});signature.geometries.push(row);}
   for(const[m,r]of materials)signature.materials.push({label:r.label,physical:r.physical,metadata:r.metadata,maps:Object.fromEntries(Object.entries(r.maps).map(([k,t])=>[k,textureIds.get(t)]))});
   for(const[t,r]of textures)signature.textures.push({label:r.label,size:[t.image.width,t.image.height],sampler:r.sampler,metadata:r.metadata,sha256:r.hash});
   finalSignature=signature;finalized=true;audit.sourceMeshes=objects.length;audit.sourceGeometries=geometries.size;audit.sourceAttributeCount=finalAttributes.length;audit.sourceMaterials=materials.size;audit.sourceTextures=textures.size;audit.finalAttributes=finalAttributes.map(summary);audit.sourceImages=signature.textures;audit.protectedSignature=signature;
   const privateCPU=strength?targets.reduce((s,r)=>s+entries(r.candidate).reduce((n,[,a])=>n+a.array.byteLength,0),0):0;
   const retainedPreUploadIndexBytes=[...postOriginal,...postPrivate].filter(r=>r.key==='index'&&r.a.array!==r.array).reduce((s,r)=>s+r.bytes,0);
   audit.buffers={privateReplacementCPUBytesBeforeUpload:metrics.privateAttributeBytes,privateReplacementCPUBytesAfterUpload:privateCPU,privateGPUAttributeBytesEstimate:privateCPU,originalCollarsRetainedForThisQABytes:targets.reduce((s,r)=>s+entries(r.original).reduce((n,[,a])=>n+a.array.byteLength,0),0),detachedPreUploadIndexBytesRetainedOnlyForQA:retainedPreUploadIndexBytes,originalCollarsUploadedBefore158:0,retainedByHelperInProductionBytes:0,extraVertices:0,extraTriangles:0,extraDraws:0,extraTextures:0,interpretation:'Full private copies include UV/color/index bindings. Production uploads replacements instead of originals and retains no source; this QA retains sources and old index arrays for verified restoration. GPU estimate excludes cache overhead. Fingerprint hashes/metadata and transient diagnostic arrays are not replacement geometry.'};
   await check('final-scene-first-native-upload');return{display:display(),metrics,preparationMs:audit.preparationMs,proxy:audit.proxy,buffers:audit.buffers,ownedVertices:audit.ownedVertices,sourceMeshes:objects.length,sourceAttributes:finalAttributes.length,protectedSignature:signature};
  }

  async function check(stage){
   demand(finalized&&!referencesReleased,'final QA snapshot unavailable.');
   for(const r of objects){const owner=candidateOwners.get(r.g),expected=owner&&released?owner.original:r.g;demand(r.mesh.geometry===expected&&r.mesh.material===r.material&&r.mesh.parent===r.parent&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.renderOrder===r.renderOrder&&transform(r.mesh)===r.transform&&(!r.slots||r.slots.length===r.mesh.material.length&&r.slots.every((m,i)=>r.mesh.material[i]===m)),'object binding/flags changed: '+r.label);}
   for(const r of finalAttributes)if(!(released&&strength&&candidateOwners.has(r.g)))await inspect(r,stage);
   for(const r of postOriginal)await inspect(r,stage);if(!released)for(const r of postPrivate)await inspect(r,stage);
   for(const[g,r]of geometries)if(!(released&&strength&&candidateOwners.has(g)))demand(geometryMeta(g)===r.metadata,'geometry metadata/bounds changed: '+r.label);
   for(const[m,r]of materials){const current=maps(m);demand(physical(m)===r.physical&&JSON.stringify(m.userData)===r.metadata&&Object.keys(current).length===Object.keys(r.maps).length&&Object.entries(r.maps).every(([k,t])=>current[k]===t),'material changed: '+r.label);}
   for(const[t,r]of textures)demand(t.source===r.source&&t.image===r.image&&t.image?.data===r.data&&t.version===r.version&&t.source.version===r.sourceVersion&&sampler(t)===r.sampler&&JSON.stringify(t.userData)===r.metadata&&await digest(pixels(t))===r.hash,'texture/sampler changed: '+r.label);
   for(const[key,r]of previousState)demand(state[key]===r.value&&JSON.stringify(state[key])===r.json,'accepted cached preparation changed: '+key);
   demand(originalDispose.length===0,'disposed an original resource.');audit.checkpoints.push({stage,attributes:finalAttributes.length,images:textures.size,acceptedCacheIdentities:previousState.size,indexWidenings:widenings.size,passed:true});return audit.checkpoints.at(-1);
  }
  function risk(){
   demand(finalized&&!released,'risk requires the current candidate.');const result=inspectCollarTriangles158({blouse,model,records:targets});audit.geometryRisk=result;
   demand(result.nonfinite+result.newDegenerate+result.reversed===0,'native emitted collar orientation failed.');demand(result.contacts.newPairs===0,'native collar introduces a fixed-scene triangle contact.');demand(result.shells.every(s=>s.newPairs===0&&s.minimumVertexSeparation>.0035),'native closed collar shell lost separation.');demand(result.seams.every(s=>s.newMissing===0&&(s.maxAdditionalSeparation??0)<.001),'native emitted collar edge tube lost its support.');return result;
  }
  async function cleanup(stage='complete'){
   if(referencesReleased)return{released:false,qaReferencesAlreadyReleased:true};let failure;try{if(finalized)await check(stage+'-before-release');}catch(error){failure=error;}
   let result;try{result=releaseCollarRoll158(blouse);released=true;}catch(error){failure||=error;}
   try{demand(targets.every(r=>r.mesh.geometry===r.original)&&result?.privateGeometriesDisposed===(strength?4:0),'four original collar bindings were not restored.');demand(privateDispose.length===(strength?4:0)&&privateDispose.every(r=>r.sourceBuffers===0&&r.sourceAttributes===0),'private cleanup reached an original GPU binding.');if(finalized)await check(stage+'-after-release');}catch(error){failure||=error;}
   audit.indexWidenings=[...widenings.values()];audit.cleanup={...result,balancedOriginalsRestored:balanced&&targets.every(r=>r.mesh.geometry===r.original),originalResourceDisposals:originalDispose.length,privateGeometryDisposals:privateDispose.length,privateDisposalsHaveNoSourceBindings:privateDispose.every(r=>r.sourceBuffers===0&&r.sourceAttributes===0),qaRecordsReleased:true};releaseRecords();if(failure)throw failure;return audit.cleanup;
  }
  return{audit,metrics,afterBalance,display,finalize,check,risk,cleanup,get protectedSignature(){return finalSignature;}};
 }catch(error){
  let result,cleanupError;try{result=releaseCollarRoll158(blouse);}catch(e){cleanupError=String(e);}window.collar158PreparationFailure={message:error.message,cleanup:result,cleanupError,balanced,originalDisposals:originalDispose.slice(),privateDisposals:privateDispose.slice()};releaseRecords();throw error;
 }
}
