import config from './eye-contour147-config.json' with {type:'json'};
import {applyEyeContour147,releaseEyeContour147,EYE_CONTOUR147_SPEC} from './eye-contour-candidate147.js';
import {createEyeContourField147} from './eye-contour147-field.js';
import {inspectEyeContourGeometry147} from './eye-contour147-geometry-audit.js';
import {sampleStoredControls147,side147} from './eye-contour147-controls.js';

// Root-only native instrumentation. Imported only by the review bundle.
// Snapshots are made after accepted140 and before147/first GPU upload. They
// retain original objects temporarily; all are released after this comparison.
const demand=(condition,message)=>{if(!condition)throw Error('147 '+message);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');
const logical=a=>a instanceof Uint32Array?a:Uint32Array.from(a);
const transforms=o=>JSON.stringify([o.position.toArray(),o.quaternion.toArray(),o.scale.toArray()]);
const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
const maps=m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture));
const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('147 unsupported original texture image in QA: '+t.name);})();
async function attributeRecord(geometry,key,a,label){return{geometry,key,a,array:a.array,version:a.version,label,type:a.array.constructor.name,bytes:a.array.byteLength,itemSize:a.itemSize,count:a.count,normalized:a.normalized,usage:a.usage,gpuType:a.gpuType,raw:await digest(a.array),logical:key==='index'?await digest(logical(a.array)):null};}
const attributeSummary=q=>({label:q.label,key:q.key,type:q.type,bytes:q.bytes,values:q.array.length,version:q.version,sha256:q.raw,indexLogicalSHA256:q.logical});

export async function prepareEyeContourQA147({head,model,scene,hair,strength}){
 demand(strength===0||strength===1,'native wrapper must choose explicit OFF/ON.');model.updateWorldMatrix(true,true);
 const originals=[],headRecords=[],geometries=new Map(),materials=new Map(),textures=new Map(),attributes=[],prepared=new Map(),sourceBuffers=new Set(),sourceAttributes=new Set(),listeners=[],originalDispose=[],privateDispose=[],widenings=new Map(),field=createEyeContourField147(config);
 let released=false,resourcesReleased=false;
 try{
 const watch=(resource,label,original=true)=>{const fn=()=>{if(original)originalDispose.push(label);else privateDispose.push({label,sourceBuffers:entries(resource).filter(([,a])=>sourceBuffers.has(a.array.buffer)).length,sourceAttributes:entries(resource).filter(([,a])=>sourceAttributes.has(a)).length});};resource.addEventListener('dispose',fn);listeners.push([resource,fn]);};
 const headSet=new Set();head.traverse(o=>headSet.add(o));
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;const geometry=mesh.geometry,material=mesh.material,label=`${mesh.parent.name}/${mesh.name}`;
  const record={mesh,geometry,material,materialSlots:Array.isArray(material)?material.slice():null,parent:mesh.parent,label,side:side147(mesh),visible:mesh.visible,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,renderOrder:mesh.renderOrder,transform:transforms(mesh)};originals.push(record);if(headSet.has(mesh))headRecords.push(record);
  if(!geometries.has(geometry)){geometries.set(geometry,{label,metadata:JSON.stringify(geometry.userData),groups:JSON.stringify(geometry.groups),drawRange:JSON.stringify(geometry.drawRange),names:Object.keys(geometry.attributes),bounds:[geometry.boundingBox?JSON.stringify(geometry.boundingBox):null,geometry.boundingSphere?JSON.stringify(geometry.boundingSphere):null]});watch(geometry,label+'.geometry');}
  for(const[,a]of entries(geometry)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}
  for(const m of Array.isArray(material)?material:[material]){
   if(!materials.has(m)){materials.set(m,{label,values:physical(m),metadata:JSON.stringify(m.userData),maps:maps(m)});watch(m,label+'.material');}
   for(const[slot,t]of Object.entries(m))if(t?.isTexture&&!textures.has(t)){textures.set(t,{label:`${label}.${slot}`,source:t.source,image:t.image,data:t.image?.data,version:t.version,sourceVersion:t.source.version,metadata:JSON.stringify(t.userData),sampler:sampler(t)});watch(t,`${label}.${slot}`);}
  }
 });
 for(const[g,r]of geometries)for(const[key,a]of entries(g))attributes.push(await attributeRecord(g,key,a,r.label));
 for(const[t,r]of textures)r.hash=await digest(pixels(t));
 const originalControls=sampleStoredControls147(head,{requireBaseline:true}),upper=headRecords.find(r=>r.mesh.name==='upper-lip'),lower=headRecords.find(r=>r.mesh.name==='lower-lip');
 demand(upper&&lower&&upper.geometry.userData.upperLipRelief140?.version==='upper-lip-relief-140','actual accepted140 upper-lip geometry is missing.');
 const closeCenter=[0,1,2].map(k=>(originalControls.points[0].world[k]+originalControls.points[1].world[k])/2),beforePrimitiveCount=originals.reduce((s,r)=>s+(r.geometry.index?.count||r.geometry.getAttribute('position').count)/3,0);
 const metrics=applyEyeContour147(head,{strength,retainSourceForQA:true});
 demand(applyEyeContour147(head,{strength,retainSourceForQA:true})===metrics,'cached application identity changed.');
 for(const r of originals)if(r.mesh.geometry!==r.geometry){
  demand(headSet.has(r.mesh),'changed an object outside anatomical-head.');const geometry=r.mesh.geometry;if(prepared.has(geometry))continue;
  const row={geometry,original:r.geometry,label:r.label,attributes:[]};prepared.set(geometry,row);watch(geometry,r.label+'.private147',false);
  demand(Object.keys(geometry.attributes).join('|')===Object.keys(r.geometry.attributes).join('|')&&JSON.stringify(geometry.groups)===JSON.stringify(r.geometry.groups)&&JSON.stringify(geometry.drawRange)===JSON.stringify(r.geometry.drawRange),'changed attribute layout, groups or draw range.');
  for(const[key,a]of entries(geometry)){
   demand(!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a),'private geometry retains a source GPU buffer.');
   const q=await attributeRecord(geometry,key,a,r.label+'.private147');row.attributes.push(q);
   if(!['position','normal'].includes(key)){const original=attributes.find(x=>x.geometry===r.geometry&&x.key===key);demand(q.raw===original.raw,'private '+key+' changed source bytes.');}
  }
 }
 demand(upper.mesh.geometry===upper.geometry&&lower.mesh.geometry===lower.geometry,'changed the accepted mouth geometry reference.');
 let outsideVertices=0,zeroBefore=0,zeroAfter=0;
 for(const r of headRecords){
  const a=r.geometry.getAttribute('position'),b=r.mesh.geometry.getAttribute('position'),n=r.geometry.getAttribute('normal'),m=r.mesh.geometry.getAttribute('normal'),matrix=r.mesh.matrixWorld.elements;
  for(let i=0;i<a.count;i++){
   const x=a.getX(i),y=a.getY(i),z=a.getZ(i),w=[0,1,2].map(k=>matrix[k]*x+matrix[k+4]*y+matrix[k+8]*z+matrix[k+12]);
   const zero=n.getX(i)===0&&n.getY(i)===0&&n.getZ(i)===0,nextZero=m.getX(i)===0&&m.getY(i)===0&&m.getZ(i)===0;if(zero)zeroBefore++;if(nextZero)zeroAfter++;if(zero)demand(nextZero,'changed an unused zero normal.');
   if(!field.world(...w).active){outsideVertices++;for(let k=0;k<3;k++)demand(Object.is(a.array[i*3+k],b.array[i*3+k])&&Object.is(n.array[i*3+k],m.array[i*3+k]),'changed an outside-support position/normal component.');}
  }
 }
 demand(zeroBefore===zeroAfter,'zero-normal population changed.');
 const audit={candidate:147,strength,scoreUnchanged:77,spec:EYE_CONTOUR147_SPEC,metrics,originalControls,controls:sampleStoredControls147(head),closeCenter,
  sourceMeshes:originals.length,headMeshes:headRecords.length,sourceGeometryCount:geometries.size,sourceAttributeCount:attributes.length,sourceTextureCount:textures.size,
  exactOutsideVertices:outsideVertices,zeroNormalsBefore:zeroBefore,zeroNormalsAfter:zeroAfter,accepted140GeometryReferenceExact:true,primitiveCount:beforePrimitiveCount,
  sourceAttributes:attributes.map(attributeSummary),privateAttributes:[...prepared.values()].flatMap(r=>r.attributes.map(attributeSummary)),
  sourceImages:[...textures].map(([t,r])=>({label:r.label,size:[t.image.width,t.image.height],version:r.version,sourceVersion:r.sourceVersion,sha256:r.hash})),
  originalDispose,privateDispose,checkpoints:[],sourceSnapshot:'After cached accepted140 preparation, before147 and before any renderer upload.',
  retention:'The helper retains source geometry only because this native QA opts in. Production defaults to retaining metrics only. Source array records and listeners are released after cleanup; no QA copies enter production.'};
 let expectedGeometry=new Map(originals.map(r=>[r.mesh,r.mesh.geometry]));
 async function inspect(q,stage,allowUpload){
  const current=q.key==='index'?q.geometry.index:q.geometry.getAttribute(q.key);demand(current===q.a,`attribute reference changed: ${q.label}.${q.key} at ${stage}.`);
  demand(current.itemSize===q.itemSize&&current.count===q.count&&current.normalized===q.normalized&&current.usage===q.usage&&current.gpuType===q.gpuType&&current.version===q.version,`attribute layout/version changed: ${q.label}.${q.key} at ${stage}.`);
  demand(await digest(q.array)===q.raw,`original recorded bytes changed: ${q.label}.${q.key} at ${stage}.`);
  if(current.array!==q.array){
   const widened=allowUpload&&q.key==='index'&&current.normalized===false&&(q.array instanceof Uint16Array||q.array instanceof Uint8Array)&&current.array instanceof Uint32Array&&await digest(current.array)===q.logical;
   demand(widened,`unexplained array replacement: ${q.label}.${q.key} at ${stage}.`);
   widenings.set(q.label+'.'+q.key,{label:q.label,key:q.key,from:q.type,to:current.array.constructor.name,values:current.array.length,extraCPUBytes:current.array.byteLength-q.bytes,firstStage:widenings.get(q.label+'.'+q.key)?.firstStage||stage,logicalValuesExact:true});
  }else demand(await digest(current.array)===q.raw,`bound source bytes changed: ${q.label}.${q.key}.`);
 }
 async function check(stage,{allowUpload=true}={}){
  demand(!resourcesReleased,'QA source records already released.');
  for(const r of originals)demand(r.mesh.geometry===expectedGeometry.get(r.mesh)&&r.mesh.material===r.material&&r.mesh.parent===r.parent&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.renderOrder===r.renderOrder&&transforms(r.mesh)===r.transform&&(!r.materialSlots||r.materialSlots.every((m,k)=>r.mesh.material[k]===m)&&r.mesh.material.length===r.materialSlots.length),'unrelated object binding/flag/transform changed: '+r.label);
  for(const[g,r]of geometries){
   demand(JSON.stringify(g.userData)===r.metadata&&JSON.stringify(g.groups)===r.groups&&JSON.stringify(g.drawRange)===r.drawRange&&Object.keys(g.attributes).join('|')===r.names.join('|'),'source geometry metadata/layout changed: '+r.label);
   if(r.bounds[0]!==null)demand(JSON.stringify(g.boundingBox)===r.bounds[0],'source bounding box changed: '+r.label);
   if(r.bounds[1]!==null)demand(JSON.stringify(g.boundingSphere)===r.bounds[1],'source bounding sphere changed: '+r.label);
  }
  for(const q of attributes)await inspect(q,stage,allowUpload);if(!released)for(const r of prepared.values())for(const q of r.attributes)await inspect(q,stage,allowUpload);
  for(const[m,r]of materials){const now=maps(m);demand(physical(m)===r.values&&JSON.stringify(m.userData)===r.metadata&&Object.keys(now).length===Object.keys(r.maps).length&&Object.entries(r.maps).every(([k,t])=>now[k]===t),'source material changed: '+r.label);}
  for(const[t,r]of textures)demand(t.source===r.source&&t.image===r.image&&t.image?.data===r.data&&t.version===r.version&&t.source.version===r.sourceVersion&&sampler(t)===r.sampler&&JSON.stringify(t.userData)===r.metadata&&await digest(pixels(t))===r.hash,'source texture/sampler changed: '+r.label);
  demand(originalDispose.length===0,'disposed original resources.');
  audit.checkpoints.push({stage,sourceAttributes:attributes.length,privateAttributes:released?0:audit.privateAttributes.length,sourceImages:textures.size,indexWidenings:widenings.size,originalDisposals:originalDispose.length,passed:true});return audit.checkpoints.at(-1);
 }
 await check('after-application-before-native-upload',{allowUpload:false});
 function display(){const p=window.portrait;demand(p.ready&&p.renderer.backend?.isWebGPUBackend,'requires native WebGPU; no fallback is performed.');demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.lighting==='soft'&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted display changed.');demand(p.renderer.domElement.width===900&&p.renderer.domElement.height===1200&&p.state.internalRender.width===1800&&p.state.internalRender.height===2400,'native output/AA size changed.');return{nativeWebGPU:true,toneMapping:p.renderer.toneMapping,exposure:p.renderer.toneMappingExposure,output:[900,1200],internal:[1800,2400]};}
 function risk(){
  demand(!released,'cannot inspect147 after restoration.');const hairs=[];hair.traverse(o=>{if(o.isMesh)hairs.push(o);});
  const geometry=inspectEyeContourGeometry147(headRecords,hairs);audit.geometryRisk=geometry;
  demand(geometry.orientation.every(r=>r.newDegenerate===0&&r.opposedToTransportedGeometry===0),'introduced a finite-triangle degeneration/reversal.');
  const targets=audit.controls.points.slice(0,12);audit.maximumControlResidual=Math.max(...targets.map(r=>Math.hypot(...r.controlResidual)));
  if(strength)demand(audit.maximumControlResidual<.01,'actual fixed-control residual exceeds the bounded interpolation allowance.');
  const currentCPU=[...prepared].reduce((sum,[g])=>sum+entries(g).reduce((s,[,a])=>s+a.array.byteLength,0),0),gpuEstimate=[...prepared].reduce((sum,[g])=>sum+entries(g).reduce((s,[,a])=>{let bytes=a.array.byteLength;if(a.normalized===false&&[Uint8Array,Uint16Array,Int8Array,Int16Array].includes(a.array.constructor))bytes=a.array.length*4;return s+Math.ceil(bytes/4)*4;},0),0),oldReplacementCPU=[...new Set([...prepared.values()].map(r=>r.original))].reduce((sum,g)=>sum+entries(g).reduce((s,[,a])=>s+a.array.byteLength,0),0);
  audit.buffers={privateReplacementCPUBytesBeforeUpload:metrics.privateAttributeBytes,privateReplacementCPUBytesAfterUpload:currentCPU,privateGPUAttributeAllocationEstimate:gpuEstimate,
   originalReplacementCPUBytesRetainedForThisQA:oldReplacementCPU,originalReplacementGPUBytesUploadedByThisTestBefore147:0,
   retainedByHelperInProduction:0,productionBeforeFirstUpload:true,additionalGeometryDraws:0,additionalTextures:0,
   interpretation:'Replacement totals are not an equal permanent CPU/GPU increase: production drops this helper\'s old CPU references before the first upload and uploads the replacement instead. Other preexisting owners may retain their own originals. QA deliberately keeps originals for restoration. GPU estimate covers attribute/index buffers, not renderer cache overhead.'};
  return{display:display(),metrics,geometryRisk:geometry,maximumControlResidual:audit.maximumControlResidual,buffers:audit.buffers};
 }
 async function cleanup(stage='complete'){
  if(resourcesReleased)return{released:false,qaReferencesAlreadyReleased:true};
  let pending;try{await check(stage+'-before-release');}catch(error){pending=error;}
  const expected=prepared.size,before=privateDispose.length,result=releaseEyeContour147(head);released=true;expectedGeometry=new Map(originals.map(r=>[r.mesh,r.geometry]));
  try{demand(result.privateGeometriesDisposed===(strength?expected:0),'private release count differs.');demand(privateDispose.length-before===(strength?expected:0)&&privateDispose.every(d=>d.sourceAttributes===0&&d.sourceBuffers===0),'cleanup reached shared GPU buffers.');await check(stage+'-after-release');}catch(error){pending||=error;}
  audit.indexWidenings=[...widenings.values()];audit.cleanup={...result,sourceReferencesRestored:originals.every(r=>r.mesh.geometry===r.geometry),sourceDisposals:originalDispose.length,privateGeometryDisposals:privateDispose.length,qaSourceRecordsReleased:true};
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);listeners.length=0;originals.length=0;headRecords.length=0;attributes.length=0;prepared.clear();geometries.clear();materials.clear();textures.clear();sourceBuffers.clear();sourceAttributes.clear();headSet.clear();expectedGeometry.clear();resourcesReleased=true;
  if(pending)throw pending;return audit.cleanup;
 }
 return{audit,metrics,closeCenter,display,check,risk,cleanup};
 }catch(error){
  let cleanup,cleanupError;try{cleanup=releaseEyeContour147(head);}catch(failure){cleanupError=String(failure);}
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);
  window.eyeContour147PreparationFailure={message:error.message,cleanup,cleanupError,originalDisposals:originalDispose.slice(),privateDisposals:privateDispose.slice()};
  originals.length=headRecords.length=attributes.length=listeners.length=0;prepared.clear();geometries.clear();materials.clear();textures.clear();sourceBuffers.clear();sourceAttributes.clear();
  throw error;
 }
}
