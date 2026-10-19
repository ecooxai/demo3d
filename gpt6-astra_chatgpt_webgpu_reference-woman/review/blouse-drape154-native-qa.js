import {Group,Mesh,Matrix4} from 'three';
import {applyPortraitBalance} from '../src/portrait-balance.js';
import {BLOUSE154_SPEC,blouseDrapeJet154,applyBlouseDrape154,releaseBlouseDrape154} from './blouse-drape-candidate154.js';
import {inspectBlouseTriangles154} from './blouse-drape154-geometry-audit.js';

// Isolated native QA only.154 runs after117/before99. An ON-only, unrendered
// frame-identical proxy carries the retained original through unchanged99 once
// so cleanup restores the actual accepted balanced blouse, not its raw source.
const demand=(v,s)=>{if(!v)throw Error('154 '+s);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');
const logical=a=>a instanceof Uint32Array?a:Uint32Array.from(a);
const transform=o=>JSON.stringify([o.position.toArray(),o.quaternion.toArray(),o.scale.toArray()]);
const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
const maps=m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture));
const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('154 unsupported original texture image: '+t.name);})();
async function record(g,key,a,label){return{g,key,a,array:a.array,label,type:a.array.constructor.name,bytes:a.array.byteLength,version:a.version,itemSize:a.itemSize,count:a.count,normalized:a.normalized,usage:a.usage,gpuType:a.gpuType,raw:await digest(a.array),logical:key==='index'?await digest(logical(a.array)):null};}
const summary=r=>({label:r.label,key:r.key,type:r.type,bytes:r.bytes,values:r.array.length,version:r.version,sha256:r.raw,indexLogicalSHA256:r.logical});
const geometryMeta=g=>JSON.stringify({userData:g.userData,groups:g.groups,drawRange:g.drawRange,names:Object.keys(g.attributes),bounds:[g.boundingBox,g.boundingSphere]});
const identityResidual=m=>Math.max(...m.elements.map((v,i)=>Math.abs(v-(i%5===0?1:0))));

export async function prepareBlouseQA154({blouse,model,hair,state,strength}){
 demand(strength===0||strength===1,'use explicit OFF/ON.');
 const started=performance.now(),matches=[];blouse.traverse(o=>{if(o.isMesh&&o.name===BLOUSE154_SPEC.mesh)matches.push(o);});
 demand(matches.length===1,'missing unique original torso.');
 const mesh=matches[0],original=mesh.geometry,material=mesh.material,clothMetric=state.referenceCloth117;
 demand(clothMetric?.strength===.5,'accepted117 bake must precede154.');
 demand(state.balance===undefined,'154 must precede the one ordinary99 pass.');
 const owned=[],jet=new Float64Array(6),p=original.getAttribute('position'),uv=original.getAttribute('uv');
 for(let i=0;i<p.count;i++){blouseDrapeJet154(p.getX(i),p.getY(i),jet);if(uv.getX(i)>.75&&uv.getX(i)<1&&p.getZ(i)>0&&jet[5])owned.push(i);}
 demand(owned.length===254,'compact ownership changed.');
 const ownedSet=new Set(owned),sourceBuffers=new Set(),sourceAttributes=new Set(),preOriginal=[],postOriginal=[],postPrivate=[],finalAttributes=[],objects=[],geometries=new Map(),materials=new Map(),textures=new Map(),listeners=[],watched=new Set(),originalDispose=[],privateDispose=[],widenings=new Map(),previousState=new Map();
 let metrics,candidate,released=false,referencesReleased=false,balanced=false,finalized=false,finalSignature=null,proxyMetrics=null,proxyMs=0;
 model.traverse(o=>{if(o.isMesh)for(const[,a]of entries(o.geometry)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}});
 const watch=(r,label,isOriginal=true)=>{
  if(watched.has(r))return;watched.add(r);
  const fn=()=>{if(isOriginal)originalDispose.push(label);else privateDispose.push({label,sourceBuffers:entries(r).filter(([,a])=>sourceBuffers.has(a.array.buffer)).length,sourceAttributes:entries(r).filter(([,a])=>sourceAttributes.has(a)).length});};
  r.addEventListener('dispose',fn);listeners.push([r,fn]);
 };
 watch(original,'retained-original-torso');
 const audit={candidate:154,strength,scoreUnchanged:78,spec:BLOUSE154_SPEC,ownedVertices:owned.length,originalDispose,privateDispose,checkpoints:[],
  retention:'Only native QA retains the old torso. Before first upload an unrendered frame-identical proxy receives unchanged99 once. Production helper retains no old geometry. Cleanup swaps the balanced original back and disposes only the all-private replacement.',
  contactScope:'Changed torso strips versus actual fixed groom triangles, plus projected vertex/edge/centroid gaps. Continuous determinant1 is not a global intersection certificate.'};
 async function inspect(r,stage,allowUpload=true){
  const a=r.key==='index'?r.g.index:r.g.getAttribute(r.key);
  demand(a===r.a&&a.itemSize===r.itemSize&&a.count===r.count&&a.normalized===r.normalized&&a.usage===r.usage&&a.gpuType===r.gpuType&&a.version===r.version,'attribute binding/layout/version changed: '+r.label+'.'+r.key+' at '+stage);
  demand(await digest(r.array)===r.raw,'retained array changed: '+r.label+'.'+r.key+' at '+stage);
  if(a.array!==r.array){
   demand(allowUpload&&r.key==='index'&&!a.normalized&&(r.array instanceof Uint16Array||r.array instanceof Uint8Array)&&a.array instanceof Uint32Array&&await digest(a.array)===r.logical,'unexplained array replacement: '+r.label+'.'+r.key);
   widenings.set(r.label+'.'+r.key,{label:r.label,key:r.key,from:r.type,to:a.array.constructor.name,extraCPUBytes:a.array.byteLength-r.bytes,logicalValuesExact:true});
  }else demand(await digest(a.array)===r.raw,'bound array changed: '+r.label+'.'+r.key);
 }
 function exactProtected(){
  const a=original.getAttribute('position'),b=candidate.getAttribute('position'),na=original.getAttribute('normal'),nb=candidate.getAttribute('normal');
  let xy=0,position=0,normal=0;
  for(let i=0;i<a.count;i++){
   if(!Object.is(a.getX(i),b.getX(i))||!Object.is(a.getY(i),b.getY(i)))xy++;
   if(!ownedSet.has(i))for(let k=0;k<3;k++){if(!Object.is(a.array[3*i+k],b.array[3*i+k]))position++;if(!Object.is(na.array[3*i+k],nb.array[3*i+k]))normal++;}
  }
  demand(xy+position+normal===0,'X/Y or unowned p/n changed.');return{xyChanges:xy,unownedPositionChanges:position,unownedNormalChanges:normal};
 }
 function releaseRecords(){
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);
  listeners.length=preOriginal.length=postOriginal.length=postPrivate.length=finalAttributes.length=objects.length=0;
  watched.clear();geometries.clear();materials.clear();textures.clear();sourceBuffers.clear();sourceAttributes.clear();previousState.clear();referencesReleased=true;
 }
 try{
  for(const[key,a]of entries(original))preOriginal.push(await record(original,key,a,'torso-before154'));
  metrics=applyBlouseDrape154(blouse,{strength,retainSourceForQA:true});candidate=mesh.geometry;
  demand(applyBlouseDrape154(blouse,{strength,retainSourceForQA:true})===metrics,'same-argument cached result changed.');
  for(const r of preOriginal)await inspect(r,'immediately-after154',false);
  if(strength){
   demand(candidate!==original,'ON requires a private torso.');watch(candidate,'private-torso154',false);
   for(const[key,a]of entries(candidate)){
    demand(!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a),'replacement shares an original GPU binding: '+key);
    if(!['position','normal'].includes(key))demand(await digest(a.array)===preOriginal.find(r=>r.key===key).raw,'private '+key+' values changed.');
   }
  }else demand(candidate===original,'OFF changed geometry binding.');
  audit.metrics=metrics;audit.beforeBalanceProtection=exactProtected();audit.sourceAttributesBefore154=preOriginal.map(summary);
  audit.preparationMs=performance.now()-started;

  async function afterBalance(balance){
   demand(!balanced&&!finalized,'99 QA continuation may run only once.');
   demand(state.balance===balance&&balance.version==='shared-portrait-balance-99'&&balance.shiftX===-.24,'ordinary accepted99 result changed.');
   demand(state.referenceCloth117===clothMetric,'117 cache identity changed.');
   model.updateWorldMatrix(true,true);blouse.updateWorldMatrix(true,true);
   const inverse=new Matrix4().copy(model.matrixWorld).invert(),toModel=new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);
   demand(identityResidual(model.matrixWorld)<1e-12,'QA original proxy requires accepted identity model frame.');
   const local=new Matrix4().multiplyMatrices(new Matrix4().copy(blouse.matrixWorld).invert(),mesh.matrixWorld);
   demand(identityResidual(local)<1e-12,'torso-to-blouse frame drifted.');
   if(strength){
    for(const r of preOriginal)await inspect(r,'detached-original-before99-proxy',false);
    const proxy=new Group(),proxyMesh=new Mesh(original,material),t=performance.now();
    proxy.name='unrendered154-original99-proxy';proxyMesh.name=mesh.name;proxyMesh.matrixAutoUpdate=false;proxyMesh.matrix.copy(toModel);proxy.add(proxyMesh);proxy.updateWorldMatrix(true,true);
    demand(Math.max(...proxyMesh.matrixWorld.elements.map((v,i)=>Math.abs(v-toModel.elements[i])))<1e-14,'unrendered99 proxy is not frame-identical.');
    try{proxyMetrics=applyPortraitBalance(proxy,{shiftX:-.24});}
    finally{proxy.remove(proxyMesh);}
    proxyMs=performance.now()-t;
    demand(proxyMesh.geometry===original&&proxyMetrics.meshes===1&&proxyMetrics.vertices===21809&&proxyMetrics.clonedSharedGeometries===0,'proxy99 changed original ownership/count.');
   }
   audit.afterBalanceProtection=exactProtected();
   for(const[key,a]of entries(original))postOriginal.push(await record(original,key,a,'balanced-original-torso'));
   if(strength)for(const[key,a]of entries(candidate))postPrivate.push(await record(candidate,key,a,'balanced-private154-torso'));
   for(const r of postOriginal)if(!['position','normal'].includes(r.key))demand(r.raw===preOriginal.find(v=>v.key===r.key).raw,'99 changed an immutable torso attribute.');
   for(const r of postPrivate)if(!['position','normal'].includes(r.key))demand(r.raw===postOriginal.find(v=>v.key===r.key).raw,'private immutable torso differs after99.');
   audit.originalAfter99Attributes=postOriginal.map(summary);audit.privateAfter99Attributes=postPrivate.map(summary);
   audit.proxy={used:!!strength,rendered:false,extraDraws:0,frameResidual:identityResidual(local),singleUnchanged99Pass:!!strength,metrics:proxyMetrics,elapsedMs:proxyMs};
   preOriginal.length=0;balanced=true;return audit.proxy;
  }

  function display({accepted=false}={}){
   const p=window.portrait;demand(p?.ready&&p.renderer.backend?.isWebGPUBackend,'requires native WebGPU; no fallback.');
   demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.lighting==='soft'&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted Neutral1.4 display changed.');
   demand(p.renderer.domElement.width===900&&p.renderer.domElement.height===1200&&p.state.internalRender.width===1800&&p.state.internalRender.height===2400,'native output/AA changed.');
   demand(p.state.referenceCloth117===clothMetric&&p.state.crownFacing141?.side===0&&p.state.crownFacing141?.shadowSide===2&&p.state.balance?.shiftX===-.24&&p.state.eyeContour147?.strength===1,'accepted preparations changed.');
   if(accepted)demand(p.state.iteration===149&&p.state.score===78,'requires unmodified accepted149 score before setting154.');
   return{nativeWebGPU:true,toneMapping:7,exposure:1.4,output:[900,1200],internal:[1800,2400],antialiasing:2};
  }

  async function maskedHash(a,key){
   if(!['position','normal'].includes(key))return key==='index'?digest(logical(a.array)):digest(a.array);
   const copy=new a.array.constructor(a.array);
   for(const i of owned)if(key==='position')copy[i*3+2]=0;else copy.fill(0,i*3,i*3+3);
   return digest(copy);
  }

  async function finalize(){
   demand(balanced&&!finalized&&!released,'final snapshot requires one completed99 pass.');display({accepted:true});
   for(const r of postOriginal)await inspect(r,'first-native-upload');for(const r of postPrivate)await inspect(r,'first-native-upload');
   audit.afterUploadProtection=exactProtected();
   const materialIds=new Map(),textureIds=new Map(),geometryIds=new Map();
   model.traverse(o=>{
    if(!o.isMesh)return;const g=o.geometry,label=objects.length+':'+o.parent.name+'/'+o.name;
    objects.push({mesh:o,g,material:o.material,slots:Array.isArray(o.material)?o.material.slice():null,parent:o.parent,label,visible:o.visible,castShadow:o.castShadow,receiveShadow:o.receiveShadow,renderOrder:o.renderOrder,transform:transform(o)});
    if(!geometries.has(g)){geometries.set(g,{label,metadata:geometryMeta(g)});geometryIds.set(g,geometryIds.size);watch(g,label+'.geometry',g!==candidate||!strength);}
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
     if(!materials.has(m)){materials.set(m,{label,physical:physical(m),metadata:JSON.stringify(m.userData),maps:maps(m)});materialIds.set(m,materialIds.size);watch(m,label+'.material');}
     for(const[slot,t]of Object.entries(m))if(t?.isTexture&&!textures.has(t)){textures.set(t,{label:label+'.'+slot,source:t.source,image:t.image,data:t.image?.data,version:t.version,sourceVersion:t.source.version,metadata:JSON.stringify(t.userData),sampler:sampler(t)});textureIds.set(t,textureIds.size);watch(t,label+'.'+slot);}
    }
   });
   for(const[g,r]of geometries)for(const[key,a]of entries(g))finalAttributes.push(await record(g,key,a,r.label));
   for(const[t,r]of textures)r.hash=await digest(pixels(t));
   for(const key of['referenceCloth117','mouthContinuity130','upperLipRelief140','eyeContour147','hairColor149','nearEarYaw115','balance','referenceCrown','crownFacing141']){demand(state[key]!==undefined,'missing accepted final preparation: '+key);previousState.set(key,{value:state[key],json:JSON.stringify(state[key])});}
   const signature={objects:[],geometries:[],materials:[],textures:[]};
   for(const r of objects)signature.objects.push({label:r.label,geometry:geometryIds.get(r.g),materials:(r.slots||[r.material]).map(m=>materialIds.get(m)),transform:r.transform,visible:r.visible,castShadow:r.castShadow,receiveShadow:r.receiveShadow,renderOrder:r.renderOrder});
   for(const[g,r]of geometries){
    const row={label:r.label,groups:g.groups,drawRange:g.drawRange,attributes:[]};
    for(const[key,a]of entries(g))row.attributes.push({key,count:a.count,itemSize:a.itemSize,normalized:a.normalized,sha256:g===candidate?await maskedHash(a,key):key==='index'?await digest(logical(a.array)):await digest(a.array)});
    signature.geometries.push(row);
   }
   for(const[m,r]of materials)signature.materials.push({label:r.label,physical:r.physical,maps:Object.fromEntries(Object.entries(r.maps).map(([k,t])=>[k,textureIds.get(t)]))});
   for(const[t,r]of textures)signature.textures.push({label:r.label,size:[t.image.width,t.image.height],sampler:r.sampler,sha256:r.hash});
   finalSignature=signature;finalized=true;
   audit.sourceMeshes=objects.length;audit.sourceGeometries=geometries.size;audit.sourceAttributeCount=finalAttributes.length;audit.sourceMaterials=materials.size;audit.sourceTextures=textures.size;
   audit.finalAttributes=finalAttributes.map(summary);audit.sourceImages=signature.textures;audit.protectedSignature=signature;
   audit.primitiveCount=objects.reduce((s,r)=>s+(r.g.index?.count||r.g.getAttribute('position').count)/3,0);
   const privateCPU=strength?entries(candidate).reduce((s,[,a])=>s+a.array.byteLength,0):0;
   audit.buffers={privateReplacementCPUBytesBeforeUpload:metrics.privateAttributeBytes,privateReplacementCPUBytesAfterUpload:privateCPU,privateGPUAttributeBytesEstimate:privateCPU,originalTorsoRetainedForThisQABytes:entries(original).reduce((s,[,a])=>s+a.array.byteLength,0),originalTorsoUploadedBefore154:0,retainedByHelperInProductionBytes:0,extraVertices:0,extraTriangles:0,extraDraws:0,extraTextures:0,interpretation:'The full private replacement includes UV/color/index bindings. Production uploads it instead of the old torso and retains no old torso through154. QA retains the old geometry for exact restoration. GPU estimate covers arrays after renderer index widening, not cache overhead.'};
   await check('final-scene-first-native-upload');
   return{display:display(),metrics,preparationMs:audit.preparationMs,proxy:audit.proxy,buffers:audit.buffers,ownedVertices:owned.length,sourceMeshes:objects.length,sourceAttributes:finalAttributes.length,protectedSignature:signature};
  }

  async function check(stage){
   demand(finalized&&!referencesReleased,'final QA snapshot unavailable.');
   for(const r of objects){
    const expected=r.mesh===mesh&&released?original:r.g;
    demand(r.mesh.geometry===expected&&r.mesh.material===r.material&&r.mesh.parent===r.parent&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.renderOrder===r.renderOrder&&transform(r.mesh)===r.transform&&(!r.slots||r.slots.length===r.mesh.material.length&&r.slots.every((m,i)=>r.mesh.material[i]===m)),'object binding/flags changed: '+r.label);
   }
   for(const r of finalAttributes)if(!(released&&strength&&r.g===candidate))await inspect(r,stage);
   for(const r of postOriginal)await inspect(r,stage);
   if(!released)for(const r of postPrivate)await inspect(r,stage);
   for(const[g,r]of geometries)if(!(released&&strength&&g===candidate))demand(geometryMeta(g)===r.metadata,'geometry metadata/bounds changed: '+r.label);
   for(const[m,r]of materials){const current=maps(m);demand(physical(m)===r.physical&&JSON.stringify(m.userData)===r.metadata&&Object.keys(current).length===Object.keys(r.maps).length&&Object.entries(r.maps).every(([k,t])=>current[k]===t),'material changed: '+r.label);}
   for(const[t,r]of textures)demand(t.source===r.source&&t.image===r.image&&t.image?.data===r.data&&t.version===r.version&&t.source.version===r.sourceVersion&&sampler(t)===r.sampler&&JSON.stringify(t.userData)===r.metadata&&await digest(pixels(t))===r.hash,'texture/sampler changed: '+r.label);
   for(const[key,r]of previousState)demand(state[key]===r.value&&JSON.stringify(state[key])===r.json,'accepted cache identity changed: '+key);
   demand(originalDispose.length===0,'disposed an original resource.');
   audit.checkpoints.push({stage,attributes:finalAttributes.length,images:textures.size,acceptedCacheIdentities:previousState.size,indexWidenings:widenings.size,passed:true});return audit.checkpoints.at(-1);
  }

  function risk(){
   demand(finalized&&!released,'risk requires current candidate before restoration.');
   const result=inspectBlouseTriangles154({blouse,mesh,sourceGeometry:original,candidateGeometry:candidate,hair,ownedIndices:owned});audit.geometryRisk=result;
   demand(result.nonfinite+result.newDegenerate+result.reversed===0,'actual torso triangles failed finite/orientation gate.');
   demand(result.triangleContacts.newPairs===0&&result.sampledDepth.newCrossings===0,'actual native fixed hair introduced a new contact/crossing.');
   return result;
  }

  async function cleanup(stage='complete'){
   if(referencesReleased)return{released:false,qaReferencesAlreadyReleased:true};
   let failure;try{if(finalized)await check(stage+'-before-release');}catch(error){failure=error;}
   const result=releaseBlouseDrape154(blouse);released=true;
   try{
    demand(mesh.geometry===original&&result.privateGeometriesDisposed===(strength?1:0),'original torso restoration failed.');
    demand(privateDispose.length===(strength?1:0)&&privateDispose.every(r=>r.sourceBuffers===0&&r.sourceAttributes===0),'private cleanup reached a source GPU binding.');
    if(finalized)await check(stage+'-after-release');
   }catch(error){failure||=error;}
   audit.indexWidenings=[...widenings.values()];audit.cleanup={...result,balancedOriginalRestored:balanced&&mesh.geometry===original,originalResourceDisposals:originalDispose.length,privateGeometryDisposals:privateDispose.length,privateDisposalsHaveNoSourceBindings:privateDispose.every(r=>r.sourceBuffers===0&&r.sourceAttributes===0),qaRecordsReleased:true};
   releaseRecords();candidate=null;if(failure)throw failure;return audit.cleanup;
  }
  return{audit,metrics,afterBalance,display,finalize,check,risk,cleanup,get protectedSignature(){return finalSignature;}};
 }catch(error){
  let result,cleanupError;try{result=releaseBlouseDrape154(blouse);}catch(e){cleanupError=String(e);}
  window.blouse154PreparationFailure={message:error.message,cleanup:result,cleanupError,balanced,originalDisposals:originalDispose.slice(),privateDisposals:privateDispose.slice()};releaseRecords();throw error;
 }
}
