import {applyEyelash151,releaseEyelash151,lashParts151,EYELASH151_SPEC} from './eyelash-candidate151.js';
import {inspectEyelashes151} from './eyelash151-geometry-audit.js';

// Root-only native QA. Snapshot the complete accepted149 scene before151 and
// before its first ordinary GPU upload. No QA code is promoted to production.
const demand=(condition,message)=>{if(!condition)throw Error('151 '+message);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');
const logical=a=>a instanceof Uint32Array?a:Uint32Array.from(a);
const transforms=o=>JSON.stringify([o.position.toArray(),o.quaternion.toArray(),o.scale.toArray()]);
const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
const maps=m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture));
const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('151 unsupported original texture image in QA: '+t.name);})();
async function attributeRecord(geometry,key,a,label){return{geometry,key,a,array:a.array,version:a.version,label,type:a.array.constructor.name,bytes:a.array.byteLength,itemSize:a.itemSize,count:a.count,normalized:a.normalized,usage:a.usage,gpuType:a.gpuType,raw:await digest(a.array),logical:key==='index'?await digest(logical(a.array)):null};}
const summary=q=>({label:q.label,key:q.key,type:q.type,bytes:q.bytes,values:q.array.length,version:q.version,sha256:q.raw,indexLogicalSHA256:q.logical});

export async function prepareEyelashQA151({head,model,hair,state,strength}){
 demand(strength===0||strength===1,'native wrapper must choose explicit OFF/ON.');model.updateWorldMatrix(true,true);
 const originals=[],headRecords=[],geometries=new Map(),materials=new Map(),textures=new Map(),attributes=[],prepared=new Map(),sourceBuffers=new Set(),sourceAttributes=new Set(),listeners=[],originalDispose=[],privateDispose=[],widenings=new Map(),headSet=new Set();
 const previousStateKeys=['mouthContinuity130','upperLipRelief140','eyeContour147','hairColor149','nearEarYaw115','balance'],previousState=new Map(previousStateKeys.map(key=>[key,{value:state[key],json:JSON.stringify(state[key])}]));
 let released=false,resourcesReleased=false;
 try{
 const watch=(resource,label,original=true)=>{const fn=()=>{if(original)originalDispose.push(label);else privateDispose.push({label,sourceBuffers:entries(resource).filter(([,a])=>sourceBuffers.has(a.array.buffer)).length,sourceAttributes:entries(resource).filter(([,a])=>sourceAttributes.has(a)).length});};resource.addEventListener('dispose',fn);listeners.push([resource,fn]);};
 head.traverse(o=>headSet.add(o));
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;const geometry=mesh.geometry,material=mesh.material,label=`${mesh.parent.name}/${mesh.name}`;
  const r={mesh,geometry,material,materialSlots:Array.isArray(material)?material.slice():null,parent:mesh.parent,label,visible:mesh.visible,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,renderOrder:mesh.renderOrder,transform:transforms(mesh)};originals.push(r);if(headSet.has(mesh))headRecords.push(r);
  if(!geometries.has(geometry)){geometries.set(geometry,{label,metadata:JSON.stringify(geometry.userData),groups:JSON.stringify(geometry.groups),drawRange:JSON.stringify(geometry.drawRange),names:Object.keys(geometry.attributes),bounds:[geometry.boundingBox?JSON.stringify(geometry.boundingBox):null,geometry.boundingSphere?JSON.stringify(geometry.boundingSphere):null]});watch(geometry,label+'.geometry');}
  for(const[,a]of entries(geometry)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}
  for(const m of Array.isArray(material)?material:[material]){
   if(!materials.has(m)){materials.set(m,{label,values:physical(m),metadata:JSON.stringify(m.userData),maps:maps(m)});watch(m,label+'.material');}
   for(const[slot,t]of Object.entries(m))if(t?.isTexture&&!textures.has(t)){textures.set(t,{label:`${label}.${slot}`,source:t.source,image:t.image,data:t.image?.data,version:t.version,sourceVersion:t.source.version,metadata:JSON.stringify(t.userData),sampler:sampler(t)});watch(t,`${label}.${slot}`);}
  }
 });
 for(const[g,r]of geometries)for(const[key,a]of entries(g))attributes.push(await attributeRecord(g,key,a,r.label));
 for(const[t,r]of textures)r.hash=await digest(pixels(t));
 const lashRecords=headRecords.filter(r=>r.mesh.name==='individual-eyelashes'),upper=headRecords.find(r=>r.mesh.name==='upper-lip'),lower=headRecords.find(r=>r.mesh.name==='lower-lip'),face=headRecords.find(r=>r.mesh.name==='continuous-face');
 demand(lashRecords.length===2&&new Set(lashRecords.map(r=>r.parent.name)).size===2,'needs the two accepted original lash owners.');
 demand(lashRecords.every(r=>r.geometry.userData.eyeContour147?.version==='eye-contour-147'),'accepted147 lash deformation is missing.');
 for(const lash of lashRecords)for(const name of['sculpted-eyelids','upper-lash-margin','lower-waterline','lower-tear-meniscus','scleral-globe','transparent-corneal-dome','brown-iris-and-pupil'])demand(headRecords.filter(r=>r.parent===lash.parent&&r.mesh.name===name).length===1,'missing actual retained ocular obstacle: '+lash.parent.name+'/'+name);
 demand(upper&&lower&&upper.geometry.userData.upperLipRelief140?.version==='upper-lip-relief-140','accepted140 mouth is missing.');
 demand(face&&Array.isArray(face.material)&&face.material.length===2,'expected front/rear continuous-face slots changed.');
 for(const[key,r]of previousState)demand(r.value!==undefined,'missing accepted cached preparation: '+key);
 const beforePrimitives=originals.reduce((s,r)=>s+(r.geometry.index?.count||r.geometry.getAttribute('position').count)/3,0),metrics=applyEyelash151(head,{strength,retainSourceForQA:true});
 demand(applyEyelash151(head,{strength,retainSourceForQA:true})===metrics,'cached application identity changed.');
 let exactRootVertices=0;
 for(const r of originals){
  if(r.mesh.geometry!==r.geometry){
   demand(lashRecords.includes(r),'changed geometry outside the two existing lash meshes.');const geometry=r.mesh.geometry;
   const row={geometry,original:r.geometry,label:r.label,attributes:[]};prepared.set(geometry,row);watch(geometry,r.label+'.private151',false);
   demand(Object.keys(geometry.attributes).join('|')===Object.keys(r.geometry.attributes).join('|')&&JSON.stringify(geometry.groups)===JSON.stringify(r.geometry.groups)&&JSON.stringify(geometry.drawRange)===JSON.stringify(r.geometry.drawRange),'changed attribute layout, groups or draw range.');
   for(const[key,a]of entries(geometry)){
    demand(!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a),'private geometry retains a source GPU buffer.');
    const q=await attributeRecord(geometry,key,a,r.label+'.private151');row.attributes.push(q);
    if(!['position','normal'].includes(key)){const old=attributes.find(x=>x.geometry===r.geometry&&x.key===key);demand(q.raw===old.raw,'private '+key+' changed source bytes.');}
   }
  }
  if(lashRecords.includes(r))for(const part of lashParts151())for(let k=0;k<4;k++){
   const vertex=part.vertex+k;for(const name of['position','normal'])for(let c=0;c<3;c++)demand(Object.is(r.geometry.getAttribute(name).array[vertex*3+c],r.mesh.geometry.getAttribute(name).array[vertex*3+c]),'changed an accepted147 root-ring component.');exactRootVertices++;
  }
 }
 demand(prepared.size===(strength?2:0)&&exactRootVertices===320,'private/root inventory changed.');
 demand(upper.mesh.geometry===upper.geometry&&lower.mesh.geometry===lower.geometry,'changed the accepted mouth geometry.');
 const audit={candidate:151,strength,scoreUnchanged:78,spec:EYELASH151_SPEC,metrics,sourceMeshes:originals.length,headMeshes:headRecords.length,sourceGeometryCount:geometries.size,sourceAttributeCount:attributes.length,sourceTextureCount:textures.size,sourceMaterialCount:materials.size,exactRootVertices,protected140GeometryReferences:true,protected147CachedMetric:true,faceMaterialSlots:face.material.length,primitiveCount:beforePrimitives,
  sourceAttributes:attributes.map(summary),privateAttributes:[...prepared.values()].flatMap(r=>r.attributes.map(summary)),sourceImages:[...textures].map(([t,r])=>({label:r.label,size:[t.image.width,t.image.height],version:r.version,sourceVersion:r.sourceVersion,sha256:r.hash})),sourcePhysicalMaterials:[...materials].map(([m,r])=>({label:r.label,name:m.name,physical:JSON.parse(r.values)})),originalDispose,privateDispose,checkpoints:[],sourceSnapshot:'After accepted149 cached preparation, immediately after147 and before151/first GPU upload.',
  retention:'Original objects are retained solely for this native QA. Production defaults to no retained source geometry references. Source array records/listeners are released after cleanup. No QA snapshot code enters production.'};
 let expectedGeometry=new Map(originals.map(r=>[r.mesh,r.mesh.geometry]));
 async function inspect(q,stage,allowUpload){
  const current=q.key==='index'?q.geometry.index:q.geometry.getAttribute(q.key);demand(current===q.a,`attribute reference changed: ${q.label}.${q.key} at ${stage}.`);
  demand(current.itemSize===q.itemSize&&current.count===q.count&&current.normalized===q.normalized&&current.usage===q.usage&&current.gpuType===q.gpuType&&current.version===q.version,`attribute layout/version changed: ${q.label}.${q.key} at ${stage}.`);
  demand(await digest(q.array)===q.raw,`recorded source bytes changed: ${q.label}.${q.key} at ${stage}.`);
  if(current.array!==q.array){
   const widened=allowUpload&&q.key==='index'&&current.normalized===false&&(q.array instanceof Uint16Array||q.array instanceof Uint8Array)&&current.array instanceof Uint32Array&&await digest(current.array)===q.logical;
   demand(widened,`unexplained array replacement: ${q.label}.${q.key} at ${stage}.`);
   widenings.set(q.label+'.'+q.key,{label:q.label,key:q.key,from:q.type,to:current.array.constructor.name,values:current.array.length,extraCPUBytes:current.array.byteLength-q.bytes,firstStage:widenings.get(q.label+'.'+q.key)?.firstStage||stage,logicalValuesExact:true});
  }else demand(await digest(current.array)===q.raw,`bound source bytes changed: ${q.label}.${q.key}.`);
 }
 async function check(stage,{allowUpload=true}={}){
  demand(!resourcesReleased,'QA source records were already released.');
  for(const r of originals)demand(r.mesh.geometry===expectedGeometry.get(r.mesh)&&r.mesh.material===r.material&&r.mesh.parent===r.parent&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.renderOrder===r.renderOrder&&transforms(r.mesh)===r.transform&&(!r.materialSlots||r.materialSlots.every((m,k)=>r.mesh.material[k]===m)&&r.mesh.material.length===r.materialSlots.length),'object binding/flag/transform changed: '+r.label);
  for(const[g,r]of geometries){
   demand(JSON.stringify(g.userData)===r.metadata&&JSON.stringify(g.groups)===r.groups&&JSON.stringify(g.drawRange)===r.drawRange&&Object.keys(g.attributes).join('|')===r.names.join('|'),'source geometry metadata/layout changed: '+r.label);
   if(r.bounds[0]!==null)demand(JSON.stringify(g.boundingBox)===r.bounds[0],'source bounding box changed: '+r.label);
   if(r.bounds[1]!==null)demand(JSON.stringify(g.boundingSphere)===r.bounds[1],'source bounding sphere changed: '+r.label);
  }
  for(const q of attributes)await inspect(q,stage,allowUpload);if(!released)for(const r of prepared.values())for(const q of r.attributes)await inspect(q,stage,allowUpload);
  for(const[m,r]of materials){const now=maps(m);demand(physical(m)===r.values&&JSON.stringify(m.userData)===r.metadata&&Object.keys(now).length===Object.keys(r.maps).length&&Object.entries(r.maps).every(([k,t])=>now[k]===t),'source material changed: '+r.label);}
  for(const[t,r]of textures)demand(t.source===r.source&&t.image===r.image&&t.image?.data===r.data&&t.version===r.version&&t.source.version===r.sourceVersion&&sampler(t)===r.sampler&&JSON.stringify(t.userData)===r.metadata&&await digest(pixels(t))===r.hash,'source texture/sampler changed: '+r.label);
  for(const[key,r]of previousState)demand(state[key]===r.value&&JSON.stringify(state[key])===r.json,'accepted cached preparation changed: '+key);
  demand(originalDispose.length===0,'disposed original resources.');
  demand(originals.reduce((s,r)=>s+(r.mesh.geometry.index?.count||r.mesh.geometry.getAttribute('position').count)/3,0)===beforePrimitives,'primitive inventory changed.');
  audit.checkpoints.push({stage,sourceAttributes:attributes.length,privateAttributes:released?0:audit.privateAttributes.length,sourceImages:textures.size,indexWidenings:widenings.size,originalDisposals:originalDispose.length,acceptedCacheIdentities:previousState.size,passed:true});return audit.checkpoints.at(-1);
 }
 await check('after-application-before-native-upload',{allowUpload:false});
 function display(){const p=window.portrait;demand(p.ready&&p.renderer.backend?.isWebGPUBackend,'requires native WebGPU; no fallback is performed.');demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.lighting==='soft'&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted display changed.');demand(p.renderer.domElement.width===900&&p.renderer.domElement.height===1200&&p.state.internalRender.width===1800&&p.state.internalRender.height===2400,'native output/AA size changed.');return{nativeWebGPU:true,toneMapping:p.renderer.toneMapping,exposure:p.renderer.toneMappingExposure,output:[900,1200],internal:[1800,2400]};}
 function risk(){
  demand(!released,'cannot inspect151 after restoration.');const fringes=[];hair.traverse(o=>{if(o.isMesh&&o.name==='Dense fine bowed brown fringe strands')fringes.push(o);});demand(fringes.length===1,'accepted133 fringe obstacle changed.');
  const geometry=inspectEyelashes151(headRecords,fringes[0]);audit.geometryRisk=geometry;
  demand(geometry.orientation.every(r=>r.newDegenerate===0&&r.newRadialReversals===0),'introduced a finite-triangle degeneration/reversal.');
  const currentCPU=[...prepared].reduce((sum,[g])=>sum+entries(g).reduce((s,[,a])=>s+a.array.byteLength,0),0),gpuEstimate=[...prepared].reduce((sum,[g])=>sum+entries(g).reduce((s,[,a])=>{let bytes=a.array.byteLength;if(a.normalized===false&&[Uint8Array,Uint16Array,Int8Array,Int16Array].includes(a.array.constructor))bytes=a.array.length*4;return s+Math.ceil(bytes/4)*4;},0),0),oldReplacementCPU=[...new Set([...prepared.values()].map(r=>r.original))].reduce((sum,g)=>sum+entries(g).reduce((s,[,a])=>s+a.array.byteLength,0),0);
  audit.buffers={privateReplacementCPUBytesBeforeUpload:metrics.privateAttributeBytes,privateReplacementCPUBytesAfterUpload:currentCPU,privateGPUAttributeAllocationEstimate:gpuEstimate,originalReplacementCPUBytesRetainedForThisQA:oldReplacementCPU,originalReplacementGPUBytesUploadedByThisTestBefore151:0,retainedByHelperInProduction:0,productionBeforeFirstUpload:true,additionalGeometryDraws:0,additionalTextures:0,
   interpretation:'Replacement totals are not equal permanent CPU/GPU increases. Production uploads the replacement instead of the old lash attributes and retains no old geometry through151. This QA intentionally retains originals for restoration. Existing upstream owners may retain their own references. GPU estimate covers attribute/index allocation, not renderer cache overhead.'};
  const contacts={ocularRootNewPairs:geometry.ocularContacts.reduce((s,r)=>s+r.rootStrip.newContactPairs,0),ocularDistalNewPairs:geometry.ocularContacts.reduce((s,r)=>s+r.distal.newContactPairs,0),fringeRootNewPairs:geometry.fringeContacts.reduce((s,r)=>s+r.rootStrip.newContactPairs,0),fringeDistalNewPairs:geometry.fringeContacts.reduce((s,r)=>s+r.distal.newContactPairs,0)};
  return{display:display(),metrics,geometryRisk:geometry,contacts,buffers:audit.buffers,interpretation:'Contact identities are reported relative to the inherited accepted147/149 intersections. Numeric success does not assert globally disjoint lashes or visible artistic gain; root/distal and fringe changes require the paired eye review.'};
 }
 async function cleanup(stage='complete'){
  if(resourcesReleased)return{released:false,qaReferencesAlreadyReleased:true};let pending;try{await check(stage+'-before-release');}catch(error){pending=error;}
  const expected=prepared.size,before=privateDispose.length,result=releaseEyelash151(head);released=true;expectedGeometry=new Map(originals.map(r=>[r.mesh,r.geometry]));
  try{demand(result.privateGeometriesDisposed===(strength?expected:0),'private release count differs.');demand(privateDispose.length-before===(strength?expected:0)&&privateDispose.every(d=>d.sourceAttributes===0&&d.sourceBuffers===0),'cleanup reached shared GPU buffers.');await check(stage+'-after-release');}catch(error){pending||=error;}
  audit.indexWidenings=[...widenings.values()];audit.cleanup={...result,sourceReferencesRestored:originals.every(r=>r.mesh.geometry===r.geometry),sourceDisposals:originalDispose.length,privateGeometryDisposals:privateDispose.length,qaSourceRecordsReleased:true};
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);listeners.length=0;originals.length=0;headRecords.length=0;attributes.length=0;prepared.clear();geometries.clear();materials.clear();textures.clear();sourceBuffers.clear();sourceAttributes.clear();headSet.clear();expectedGeometry.clear();previousState.clear();resourcesReleased=true;
  if(pending)throw pending;return audit.cleanup;
 }
 return{audit,metrics,display,check,risk,cleanup};
 }catch(error){
  let cleanup,cleanupError;try{cleanup=releaseEyelash151(head);}catch(failure){cleanupError=String(failure);}
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);
  window.eyelash151PreparationFailure={message:error.message,cleanup,cleanupError,originalDisposals:originalDispose.slice(),privateDisposals:privateDispose.slice()};
  originals.length=headRecords.length=attributes.length=listeners.length=0;prepared.clear();geometries.clear();materials.clear();textures.clear();sourceBuffers.clear();sourceAttributes.clear();previousState.clear();
  throw error;
 }
}
