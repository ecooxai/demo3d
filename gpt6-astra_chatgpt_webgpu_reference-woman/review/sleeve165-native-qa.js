import {Group,Mesh,Matrix4} from 'three';
import {applyPortraitBalance} from '../src/portrait-balance.js';
import {SLEEVE165_SPEC,sleeveFoldJet165,createSleeveSeamField165,applySleeveFold165} from './sleeve-fold-candidate165.js';
import {inspectSleeveTriangles165} from './sleeve165-geometry-audit.js';

// Native-only QA backups are wholly private and never rendered. The active
//154 torso geometry/attributes retain their identities throughout165 and QA.
const demand=(v,s)=>{if(!v)throw Error('165 '+s);},entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a),logical=a=>a instanceof Uint32Array?a:Uint32Array.from(a);
const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');
const transform=o=>JSON.stringify([o.position.toArray(),o.quaternion.toArray(),o.scale.toArray()]);
const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid','version'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
const maps=m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture));
const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('165 unsupported existing texture image '+t.name);})();
const geometryMeta=g=>JSON.stringify({userData:g.userData,groups:g.groups,drawRange:g.drawRange,names:Object.keys(g.attributes),bounds:[g.boundingBox,g.boundingSphere]}),identity=m=>Math.max(...m.elements.map((v,i)=>Math.abs(v-(i%5===0?1:0))));
async function record(g,key,a,label){return{g,key,a,array:a.array,label,type:a.array.constructor.name,bytes:a.array.byteLength,version:a.version,itemSize:a.itemSize,count:a.count,normalized:a.normalized,usage:a.usage,gpuType:a.gpuType,raw:await digest(a.array),logical:key==='index'?await digest(logical(a.array)):null};}
const summary=r=>({label:r.label,key:r.key,type:r.type,bytes:r.bytes,values:r.array.length,version:r.version,sha256:r.raw,indexLogicalSHA256:r.logical});
const preparationKeys=['referenceCloth117','blouseDrape154','collarRoll158','mouthContinuity130','upperLipRelief140','eyeContour147','eyelash151','jawEar159','hairColor149','nearEarYaw115','balance','referenceCrown','crownFacing141'];

export async function prepareSleeveQA165({blouse,model,state,strength}){
 demand(strength===0||strength===1,'use explicit OFF/ON.');
 demand(state.referenceCloth117?.strength===.5&&state.blouseDrape154?.strength===1&&state.collarRoll158?.strength===1&&state.collarRoll158.retainsSourceForQA===false&&state.balance===undefined,'requires accepted117/154/158 before the one99 pass.');
 const started=performance.now(),sourceBuffers=new Set(),sourceAttributes=new Set(),records=[],targets=new Map(),pre=[],backupsAfter99=[],finalRows=[],objects=[],geometries=new Map(),materials=new Map(),textures=new Map(),prepared=new Map(),listeners=[],watched=new Set(),originalDispose=[],privateDispose=[];
 let metrics,balanced=false,finalized=false,released=false,cleared=false,proxyMs=0,proxyMetrics=null,protectedSignature=null;
 const originalPreparation={cloth:state.referenceCloth117,drape:state.blouseDrape154,collar:state.collarRoll158};
 model.traverse(o=>{if(o.isMesh)for(const[,a]of entries(o.geometry)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}});
 const watch=(resource,label,privateBackup=false)=>{if(watched.has(resource))return;watched.add(resource);const fn=()=>{if(privateBackup)privateDispose.push({label,originalBuffers:entries(resource).filter(([,a])=>sourceBuffers.has(a.array.buffer)).length,originalAttributes:entries(resource).filter(([,a])=>sourceAttributes.has(a)).length});else originalDispose.push(label);};resource.addEventListener('dispose',fn);listeners.push([resource,fn]);};
 try{
 for(const name of SLEEVE165_SPEC.meshes){const matches=[];blouse.traverse(o=>{if(o.isMesh&&o.name===name)matches.push(o);});demand(matches.length===1,'missing unique '+name);const mesh=matches[0],g=mesh.geometry;records.push({mesh,candidate:g,original:strength?g.clone():g,material:mesh.material,ownedIndices:[],owned:new Set(),attributes:new Map(entries(g)),restoredMeta:null});targets.set(g,records.at(-1));watch(g,name+'.active-original');}
 let field=createSleeveSeamField165(records[0].candidate,records[1].candidate);const jet=new Float64Array(7),sj=new Float64Array(8);
 for(const r of records){const p=r.candidate.getAttribute('position'),isSeam=r===records[1];for(let i=0;i<p.count;i++){if(isSeam)field.sample(p.getX(i),p.getY(i),p.getZ(i),sj);else sleeveFoldJet165(p.getX(i),p.getY(i),p.getZ(i),jet);if(isSeam?sj[6]:jet[4]){r.ownedIndices.push(i);r.owned.add(i);}}}
 field=null;
 }catch(error){
  let privateBackupsDisposed=0;
  for(const r of records)if(strength){
   const privateStorage=entries(r.original).every(([,a])=>!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a));
   if(privateStorage){r.original.dispose();privateBackupsDisposed++;}
  }
  window.sleeve165PreparationFailure={phase:'private-backup-and-owned-chart-setup',message:error.message,privateBackupsDisposed,originalDispose:originalDispose.slice()};
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);
  records.length=listeners.length=0;targets.clear();sourceBuffers.clear();sourceAttributes.clear();watched.clear();throw error;
 }
 const audit={candidate:165,strength,scoreUnchanged:78,spec:SLEEVE165_SPEC,originalDispose,privateDispose,checkpoints:[],
  retention:'Production165 retains metrics only and preserves154 active geometry/attribute identities. ON native QA alone clones all attributes/index into two detached backups, carries those through one frame-identical99 proxy, restores values into the same active p/n arrays, then disposes only private backups. Backups never enter the scene or renderer.',
  contactScope:'Actual emitted sleeve/seam triangles against nearby fixed scene triangles, plus old/new emitted seam support. Continuous positive Jacobian is a separate limit, not a global intersection certificate.'};

 async function inspect(r,stage,{restored=false}={}){
  const a=r.key==='index'?r.g.index:r.g.getAttribute(r.key),owner=targets.get(r.g),changed=restored&&strength&&owner&&['position','normal'].includes(r.key),expected=changed?backupsAfter99.find(x=>x.owner===owner&&x.key===r.key):r;
  demand(a===r.a&&a.itemSize===r.itemSize&&a.count===r.count&&a.normalized===r.normalized&&a.usage===r.usage&&a.gpuType===r.gpuType,'binding/layout changed '+r.label+'.'+r.key+' at '+stage);
  demand(a.version===r.version+(changed?1:0),'unexpected attribute version '+r.label+'.'+r.key+' at '+stage);
  if(r.key==='index')demand(a.array===r.array&&await digest(logical(a.array))===r.logical,'logical indices/storage changed '+r.label);
  else demand(a.array===r.array&&await digest(a.array)===expected.raw,'attribute values/storage changed '+r.label+'.'+r.key+' at '+stage);
 }
 function protectedValues(beforeBalance){
  let yChanges=0,positionChanges=0,normalChanges=0;
  for(const r of records){const p=r.original.getAttribute('position'),q=r.candidate.getAttribute('position'),n=r.original.getAttribute('normal'),nn=r.candidate.getAttribute('normal');
   for(let i=0;i<p.count;i++){if(beforeBalance&&!Object.is(p.getY(i),q.getY(i)))yChanges++;if(!r.owned.has(i))for(let k=0;k<3;k++){if(!Object.is(p.array[3*i+k],q.array[3*i+k]))positionChanges++;if(!Object.is(n.array[3*i+k],nn.array[3*i+k]))normalChanges++;}}
  }
  demand(yChanges+positionChanges+normalChanges===0,'protected blouse p/n changed.');return{blouseYChangesBefore99:beforeBalance?yChanges:null,unownedPositionChanges:positionChanges,unownedNormalChanges:normalChanges};
 }
 function releaseReferences(){
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);listeners.length=pre.length=backupsAfter99.length=finalRows.length=objects.length=records.length=0;
  targets.clear();geometries.clear();materials.clear();textures.clear();prepared.clear();sourceBuffers.clear();sourceAttributes.clear();watched.clear();cleared=true;
 }
 try{
  for(const r of records){
   for(const[key,a]of entries(r.candidate))pre.push({...await record(r.candidate,key,a,r.mesh.name),owner:r});
   if(strength){watch(r.original,r.mesh.name+'.private-QA-backup',true);for(const[key,a]of entries(r.original)){const b=key==='index'?r.candidate.index:r.candidate.getAttribute(key);demand(a!==b&&a.array!==b.array&&!sourceAttributes.has(a)&&!sourceBuffers.has(a.array.buffer),'QA clone shares disposable original '+r.mesh.name+'.'+key);demand(await digest(a.array)===await digest(b.array),'QA clone changed '+key);}}
  }
  metrics=applySleeveFold165(blouse,{strength});demand(applySleeveFold165(blouse,{strength})===metrics,'165 idempotence failed.');audit.metrics=metrics;
  for(const r of records){demand(r.mesh.geometry===r.candidate,'165 replaced154 geometry binding.');for(const[key,a]of entries(r.candidate))demand(a===r.attributes.get(key),'165 replaced an active attribute.');}
  for(const r of pre)if(!['position','normal'].includes(r.key))await inspect(r,'immediately-after165');
  audit.beforeBalanceProtection=protectedValues(true);audit.sourceAttributesBefore165=pre.map(summary);audit.preparationMs=performance.now()-started;

  async function afterBalance(balance){
   demand(!balanced&&!finalized&&state.balance===balance&&balance?.shiftX===-.24&&balance?.version==='shared-portrait-balance-99','requires one ordinary accepted99 result.');
   demand(state.referenceCloth117===originalPreparation.cloth&&state.blouseDrape154===originalPreparation.drape&&state.collarRoll158===originalPreparation.collar,'accepted cloth preparation identity changed.');
   model.updateWorldMatrix(true,true);demand(identity(model.matrixWorld)<1e-12,'unrendered backup proxy requires the accepted identity model.');
   if(strength){
    const proxy=new Group(),meshes=[],fromWorld=new Matrix4().copy(model.matrixWorld).invert(),t=performance.now();proxy.name='unrendered165-full-private-backup99';
    for(const r of records){const toModel=new Matrix4().multiplyMatrices(fromWorld,r.mesh.matrixWorld),m=new Mesh(r.original,r.material);m.name=r.mesh.name;m.matrixAutoUpdate=false;m.matrix.copy(toModel);proxy.add(m);meshes.push(m);}
    proxy.updateWorldMatrix(true,true);
    for(let i=0;i<records.length;i++)demand(Math.max(...meshes[i].matrixWorld.elements.map((v,k)=>Math.abs(v-records[i].mesh.matrixWorld.elements[k])))<1e-14,'backup99 frame differs.');
    try{proxyMetrics=applyPortraitBalance(proxy,{shiftX:-.24});}finally{for(const m of meshes)proxy.remove(m);}
    proxyMs=performance.now()-t;demand(proxyMetrics.meshes===2&&proxyMetrics.vertices===22094&&proxyMetrics.clonedSharedGeometries===0&&meshes.every((m,i)=>m.geometry===records[i].original),'backup proxy changed ownership/count.');
   }
   audit.afterBalanceProtection=protectedValues(false);
   for(const r of records){r.restoredMeta=geometryMeta(r.original);for(const[key,a]of entries(r.original))backupsAfter99.push({...await record(r.original,key,a,'balanced-baseline165-'+r.mesh.name),owner:r});}
   audit.sourceAfter99Attributes=backupsAfter99.map(summary);audit.proxy={executed:!!strength,elapsedMs:proxyMs,metrics:proxyMetrics,sceneDraws:0,uploads:0};balanced=true;
  }

  function display({accepted=false}={}){
   const p=window.portrait;demand(p?.ready&&p.renderer.backend?.isWebGPUBackend,'requires native WebGPU, no automatic fallback.');
   demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.lighting==='soft'&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted display changed.');
   demand(p.renderer.domElement.width===900&&p.renderer.domElement.height===1200&&p.state.internalRender.width===1800&&p.state.internalRender.height===2400,'output/internal render size changed.');
   demand(p.state.referenceCloth117===originalPreparation.cloth&&p.state.blouseDrape154===originalPreparation.drape&&p.state.collarRoll158===originalPreparation.collar&&p.state.jawEar159?.strength===1&&p.state.eyelash151?.strength===1&&p.state.crownFacing141?.side===0&&p.state.crownFacing141?.shadowSide===2,'selected164 preparations changed.');
   demand(p.state.collarRoll158.retainsSourceForQA===false&&p.state.jawEar159.retainSourceForQA===false&&p.state.jawEar159.retainedSourceGeometryReferences===0&&p.state.jawEar159.faceNeck.retainedSourceGeometryReferences===0,'production158/159 retained originals.');
   if(accepted)demand(p.state.iteration===164&&p.state.score===78,'requires unchanged164 before review score.');
   return{nativeWebGPU:true,toneMapping:7,exposure:1.4,output:[900,1200],internal:[1800,2400],antialiasing:2};
  }
  async function masked(g,key,a){
   const owner=targets.get(g);if(!owner||!['position','normal'].includes(key))return digest(key==='index'?logical(a.array):a.array);
   const copy=new a.array.constructor(a.array);for(const i of owner.ownedIndices)copy.fill(0,i*3,i*3+3);return digest(copy);
  }
  async function finalize(){
   demand(balanced&&!finalized&&!released,'final snapshot requires completed99.');display({accepted:true});
   const materialIds=new Map(),textureIds=new Map(),geometryIds=new Map();
   model.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,label=objects.length+':'+o.parent.name+'/'+o.name;
    objects.push({mesh:o,g,material:o.material,slots:Array.isArray(o.material)?o.material.slice():null,parent:o.parent,label,visible:o.visible,castShadow:o.castShadow,receiveShadow:o.receiveShadow,renderOrder:o.renderOrder,transform:transform(o)});
    if(!geometries.has(g)){geometries.set(g,{label,metadata:geometryMeta(g)});geometryIds.set(g,geometryIds.size);watch(g,label+'.geometry');}
    for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!materials.has(m)){materials.set(m,{label,physical:physical(m),metadata:JSON.stringify(m.userData),maps:maps(m)});materialIds.set(m,materialIds.size);watch(m,label+'.material');}
     for(const[slot,t]of Object.entries(m))if(t?.isTexture&&!textures.has(t)){textures.set(t,{label:label+'.'+slot,source:t.source,image:t.image,data:t.image?.data,version:t.version,sourceVersion:t.source.version,metadata:JSON.stringify(t.userData),sampler:sampler(t)});textureIds.set(t,textureIds.size);watch(t,label+'.'+slot);}
    }
   });
   for(const[g,r]of geometries)for(const[key,a]of entries(g))finalRows.push(await record(g,key,a,r.label));
   for(const[t,r]of textures)r.hash=await digest(pixels(t));
   for(const key of preparationKeys){demand(state[key]!==undefined,'missing selected164 preparation '+key);prepared.set(key,{value:state[key],json:JSON.stringify(state[key])});}
   const sig={objects:objects.map(r=>({label:r.label,geometry:geometryIds.get(r.g),materials:(r.slots||[r.material]).map(m=>materialIds.get(m)),transform:r.transform,visible:r.visible,castShadow:r.castShadow,receiveShadow:r.receiveShadow,renderOrder:r.renderOrder})),geometries:[],materials:[],textures:[]};
   for(const[g,r]of geometries){const a=[];for(const[key,v]of entries(g))a.push({key,count:v.count,itemSize:v.itemSize,normalized:v.normalized,sha256:await masked(g,key,v)});sig.geometries.push({label:r.label,groups:g.groups,drawRange:g.drawRange,attributes:a});}
   for(const[m,r]of materials)sig.materials.push({label:r.label,physical:r.physical,metadata:r.metadata,maps:Object.fromEntries(Object.entries(r.maps).map(([k,t])=>[k,textureIds.get(t)]))});
   for(const[t,r]of textures)sig.textures.push({label:r.label,size:[t.image.width,t.image.height],sampler:r.sampler,metadata:r.metadata,sha256:r.hash});
   demand(finalRows.length===282&&objects.length===64&&materials.size===50&&textures.size===10,'actual164 scene population changed.');
   audit.finalAttributes=finalRows.map(summary);audit.protectedSignature=sig;audit.owned=records.map(r=>({mesh:r.mesh.name,vertices:r.ownedIndices.length,indices:r.ownedIndices}));
   audit.buffers={activeGeometryReplacements:0,activeAttributeReplacements:0,additionalSceneBytes:0,productionStagedPNBytes:metrics.stagedAttributeBytes,productionTemporarySeamTypedBytes:metrics.seamTemporaryTypedBytes||0,productionRetainedSourceGeometries:0,qaPrivateGeometries:strength?2:0,qaPrivateBytes:strength?records.reduce((s,r)=>s+entries(r.original).reduce((n,[,a])=>n+a.array.byteLength,0),0):0,qaBackupUploads:0,extraVertices:0,extraTriangles:0,extraDraws:0,extraTextures:0};
   protectedSignature=sig;finalized=true;await check('first-native-upload');return{display:display(),metrics,buffers:audit.buffers,proxy:audit.proxy,owned:audit.owned.map(r=>({mesh:r.mesh,vertices:r.vertices})),protectedSignature:sig,baselineAttributes:audit.sourceAfter99Attributes};
  }
  async function check(stage){
   demand(finalized&&!cleared,'final QA records unavailable.');
   for(const r of objects)demand(r.mesh.geometry===r.g&&r.mesh.material===r.material&&r.mesh.parent===r.parent&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.renderOrder===r.renderOrder&&transform(r.mesh)===r.transform&&(!r.slots||r.slots.length===r.mesh.material.length&&r.slots.every((m,i)=>r.mesh.material[i]===m)),'object state/binding changed '+r.label);
   for(const r of finalRows)await inspect(r,stage,{restored:released});
   if(strength)for(const r of backupsAfter99)await inspect(r,stage+'-detached-backup');
   for(const[g,r]of geometries)demand(geometryMeta(g)===(released&&strength&&targets.has(g)?targets.get(g).restoredMeta:r.metadata),'geometry metadata/bounds changed '+r.label);
   for(const[m,r]of materials){const current=maps(m);demand(physical(m)===r.physical&&JSON.stringify(m.userData)===r.metadata&&Object.keys(current).length===Object.keys(r.maps).length&&Object.entries(r.maps).every(([k,t])=>current[k]===t),'material changed '+r.label);}
   for(const[t,r]of textures)demand(t.source===r.source&&t.image===r.image&&t.image?.data===r.data&&t.version===r.version&&t.source.version===r.sourceVersion&&sampler(t)===r.sampler&&JSON.stringify(t.userData)===r.metadata&&await digest(pixels(t))===r.hash,'texture source/sampler/pixels changed '+r.label);
   for(const[key,r]of prepared)demand(state[key]===r.value&&JSON.stringify(state[key])===r.json,'selected164 cached preparation changed '+key);
   demand(originalDispose.length===0,'disposed an active original resource.');audit.checkpoints.push({stage,attributes:finalRows.length,maps:textures.size,preparations:prepared.size,passed:true});return audit.checkpoints.at(-1);
  }
  function risk(){
   demand(finalized&&!released,'risk requires the still-applied candidate.');const r=inspectSleeveTriangles165({blouse,model,records});audit.geometryRisk=r;
   demand(r.nonfinite+r.newDegenerate+r.reversed===0,'actual sleeve triangle orientation/finite gate failed.');
   demand(r.contacts.newPairs===0,'new actual fixed-scene contact; inspect before art acceptance.');
   demand(r.seamSupport.newMissing+r.seamSupport.newInside===0&&r.seamSupport.maxAdditionalSeparation<.002&&r.seamSupport.maxAdditionalInset>-.001,'actual emitted seam attachment changed beyond the bounded source result.');return r;
  }
  async function cleanup(stage='complete'){
   if(cleared)return{released:false,qaReferencesAlreadyReleased:true};let failure;
   try{if(finalized)await check(stage+'-before-restore');}catch(e){failure=e;}
   try{
    if(strength&&!released)for(const r of records){
     demand(r.mesh.geometry===r.candidate,'165 active binding changed before restoration.');
     for(const key of['position','normal']){const a=r.candidate.getAttribute(key),b=r.original.getAttribute(key);demand(a===r.attributes.get(key)&&a.array.length===b.array.length,'165 restoration storage changed.');a.array.set(b.array);a.needsUpdate=true;}
     r.candidate.computeBoundingBox();r.candidate.computeBoundingSphere();
    }
    released=true;if(finalized)await check(stage+'-after-value-restore');
   }catch(e){failure||=e;}
   finally{if(strength)for(const r of records){try{r.original.dispose();}catch(e){failure||=e;}}}
   const result={released:true,balancedOriginalValuesRestored:balanced&&records.every(r=>r.mesh.geometry===r.candidate),activeBindingsPreserved:records.every(r=>r.mesh.geometry===r.candidate),originalResourceDisposals:originalDispose.length,privateGeometryDisposals:privateDispose.length,privateDisposalsHaveNoSourceBindings:privateDispose.every(r=>r.originalBuffers===0&&r.originalAttributes===0),qaRecordsReleased:true};
   audit.cleanup=result;
   try{demand(result.originalResourceDisposals===0&&result.privateGeometryDisposals===(strength?2:0)&&result.privateDisposalsHaveNoSourceBindings,'QA backup cleanup touched an original binding.');}catch(e){failure||=e;}
   releaseReferences();if(failure)throw failure;return result;
  }
  return{audit,metrics,afterBalance,display,finalize,check,risk,cleanup,get protectedSignature(){return protectedSignature;}};
 }catch(error){
  let restored=false,cleanupError;try{if(strength){for(const r of records){for(const key of['position','normal'])r.candidate.getAttribute(key).array.set(r.original.getAttribute(key).array);r.candidate.computeBoundingBox();r.candidate.computeBoundingSphere();r.original.dispose();}restored=true;}}catch(e){cleanupError=String(e);}
  window.sleeve165PreparationFailure={message:error.message,restored,balanced,cleanupError,originalDispose:originalDispose.slice(),privateDispose:privateDispose.slice()};releaseReferences();throw error;
 }
}
