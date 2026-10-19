import {applyChinJunction162,getChinJunctionQA162,releaseChinJunction162,CHIN_JUNCTION162_SPEC} from './chin-junction-candidate162.js';
import {checkChinGeometry162} from './chin162-geometry-check.js';
import {REVISION} from 'three';

// Temporary root-only instrumentation. The actual164 preparation has finished;
// no renderer has uploaded these buffers yet. No global field/contact rerun.
const demand=(v,m)=>{if(!v)throw Error('162 QA '+m);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const hash=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
const logical=a=>a instanceof Uint32Array?a:Uint32Array.from(a);
const transform=m=>JSON.stringify([m.position.toArray(),m.quaternion.toArray(),m.scale.toArray(),m.matrixWorld.elements]);
const metadata=g=>JSON.stringify({userData:g.userData,groups:g.groups,drawRange:g.drawRange,attributes:Object.keys(g.attributes)});
const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid','version'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
const mapBindings=m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture));
const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('162 unsupported original texture image '+t.name);})();
const byteCount=g=>entries(g).reduce((n,[,a])=>n+a.array.byteLength,0);
async function stamp(g,key,a,label){return{g,key,a,array:a.array,label,version:a.version,usage:a.usage,gpuType:a.gpuType,itemSize:a.itemSize,count:a.count,normalized:a.normalized,raw:await hash(a.array),logical:key==='index'?await hash(logical(a.array)):null};}
const summary=r=>({label:r.label,key:r.key,type:r.array.constructor.name,bytes:r.array.byteLength,values:r.array.length,version:r.version,sha256:r.raw,indexLogicalSHA256:r.logical});

export async function prepareChinQA162({model,state,strength,expected}){
  demand(strength===0||strength===1,'requires the single OFF/ON pair.');model.updateWorldMatrix(true,true);
  const records=[],nodes=[],sourceStamps=[],privateStamps=[],geometryRecords=new Map(),materialRecords=new Map(),textureRecords=new Map(),cached=new Map(),
    sourceBuffers=new Set(),sourceAttributes=new Set(),listeners=[],originalDispose=[],privateDispose=[],widenings=new Map();
  let metrics,audit,band=null,bandStamp=null,privateGeometries=[],restored=false,finished=false,geometryResult=null,sourceBytes=0;
  const watch=(resource,label,isPrivate=false)=>{
    const fn=()=>{
      if(!isPrivate){originalDispose.push(label);return;}
      privateDispose.push({label,sourceAttributes:entries(resource).filter(([,a])=>sourceAttributes.has(a)).length,
        sourceBuffers:entries(resource).filter(([,a])=>sourceBuffers.has(a.array.buffer)).length,
        allOriginalBindingsRestored:records.every(r=>r.mesh.geometry===r.geometry),bandDetached:!band?.parent});
    };
    resource.addEventListener('dispose',fn);listeners.push([resource,fn]);
  };
  const drop=()=>{
    for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);
    listeners.length=records.length=nodes.length=sourceStamps.length=privateStamps.length=privateGeometries.length=0;
    geometryRecords.clear();materialRecords.clear();textureRecords.clear();cached.clear();sourceBuffers.clear();sourceAttributes.clear();widenings.clear();
    band=null;bandStamp=null;expected=null;
  };
  try{
    demand(REVISION==='186','requires the installed r186 renderer contract used by the accepted native evidence.');
    demand(state.iteration===164&&state.score===78&&state.nearEarYaw115?.degrees===-25&&state.eyeContour147?.strength===1&&state.eyelash151?.strength===1&&state.blouseDrape154?.strength===1&&state.collarRoll158?.strength===1&&state.jawEar159?.strength===1,'requires the complete accepted164 preparation.');
    demand(state.jawEar159.retainSourceForQA===false&&state.jawEar159.retainedSourceGeometryReferences===0&&state.jawEar159.faceNeck.retainSourceForQA===false&&state.jawEar159.faceNeck.retainedSourceGeometryReferences===0,'159/nested155 production retention differs.');
    for(const key of['mouthContinuity130','upperLipRelief140','eyeContour147','eyelash151','blouseDrape154','collarRoll158','nearEarYaw115','balance','hairColor149','jawEar159']){
      demand(state[key]!==undefined,'missing accepted preparation '+key);cached.set(key,{value:state[key],json:JSON.stringify(state[key])});
    }
    model.traverse(node=>{
      nodes.push({node,parent:node.parent,visible:node.visible,transform:transform(node)});if(!node.isMesh)return;
      const mesh=node,g=mesh.geometry,label=records.length+':'+mesh.parent.name+'/'+mesh.name,slots=Array.isArray(mesh.material)?mesh.material.slice():[mesh.material],
        r={mesh,geometry:g,expected:g,label,parent:mesh.parent,visible:mesh.visible,material:mesh.material,slots,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,renderOrder:mesh.renderOrder,frustumCulled:mesh.frustumCulled,layers:mesh.layers.mask};
      records.push(r);
      if(!geometryRecords.has(g)){geometryRecords.set(g,{label,metadata:metadata(g)});watch(g,label+'.geometry');}
      for(const[,a]of entries(g)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}
      for(const m of slots){
        if(!materialRecords.has(m)){materialRecords.set(m,{label,physical:physical(m),metadata:JSON.stringify(m.userData),maps:mapBindings(m),version:m.version});watch(m,label+'.material');}
        for(const[key,t]of Object.entries(m))if(t?.isTexture&&!textureRecords.has(t)){
          textureRecords.set(t,{label:label+'.'+key,source:t.source,image:t.image,data:t.image?.data,version:t.version,sourceVersion:t.source.version,sampler:sampler(t),metadata:JSON.stringify(t.userData)});watch(t,label+'.'+key);
        }
      }
    });
    demand(records.length===64&&geometryRecords.size===64&&materialRecords.size===50&&textureRecords.size===10,'accepted164 scene inventory changed.');
    const face=records.find(r=>r.mesh.name==='continuous-face'),neck=records.find(r=>r.mesh.name==='neck-smooth-anatomical-surface'),
      ears=records.filter(r=>r.mesh.name==='ear-continuous-anatomical-shell'&&['left-ear','right-ear'].includes(r.mesh.parent.name)),
      upper=records.find(r=>r.mesh.name==='upper-lip'),lower=records.find(r=>r.mesh.name==='lower-lip');
    demand(face&&neck&&ears.length===2&&ears.every(r=>r.geometry.userData.jawEar159?.version==='common-jaw-ear-field-159'),'actual prepared159 face/neck/ears are missing.');
    demand(Array.isArray(face.material)&&face.material.length===2&&!Array.isArray(neck.material),'actual face material slots/neck material changed.');
    demand(upper&&lower&&upper.geometry.userData.upperLipRelief140?.version==='upper-lip-relief-140'&&!model.getObjectByName('closed-mouth-crease').visible,'accepted mouth geometry or hidden tube differs.');
    for(const[g,r]of geometryRecords)for(const[key,a]of entries(g))sourceStamps.push(await stamp(g,key,a,r.label));
    const expectedRows=new Map(expected.attributes.map(r=>[r.label+'|'+r.key,r]));demand(expectedRows.size===282&&sourceStamps.length===282,'actual164 provenance inventory changed.');
    for(const r of sourceStamps){
      const e=expectedRows.get(r.label+'|'+r.key);demand(e&&r.array.length===e.values,'missing or incompatible actual164 attribute '+r.label+'.'+r.key);
      demand(r.key==='index'?r.logical===e.indexLogicalSHA256:r.array.constructor.name===e.type&&r.array.byteLength===e.bytes&&r.raw===e.sha256,'actual164 prepared data differs: '+r.label+'.'+r.key);
      expectedRows.delete(r.label+'|'+r.key);
    }
    demand(expectedRows.size===0,'unmatched actual164 attributes.');expectedRows.clear();
    for(const[t,r]of textureRecords)r.hash=await hash(pixels(t));
    sourceBytes=byteCount(face.geometry)+byteCount(neck.geometry);
    const sourceTriangleCount=records.reduce((n,r)=>n+(r.geometry.index?.count||r.geometry.attributes.position.count)/3,0);
    metrics=applyChinJunction162(model,{strength,retainSourceForQA:true});
    demand(applyChinJunction162(model,{strength,retainSourceForQA:true})===metrics,'cached162 metric identity changed.');
    for(const r of records)r.expected=r.mesh.geometry;
    if(strength){
      const controller=getChinJunctionQA162(model);band=controller.band;privateGeometries=[...controller.staged.map(r=>r.geometry),band.geometry];
      demand(controller.staged.length===2&&controller.staged.every(r=>[face.mesh,neck.mesh].includes(r.part.mesh)),'candidate replaced another mesh.');
      demand(band.material.length===3&&band.material[0]===face.material[0]&&band.material[1]===face.material[1]&&band.material[2]===neck.material,'band did not reuse the exact three existing materials.');
      demand(band.parent===face.parent&&band.matrixAutoUpdate===false&&band.matrix.elements.every((v,k)=>v===face.mesh.matrix.elements[k]),'band is not in the actual face frame.');
      model.updateWorldMatrix(true,true);
      bandStamp={parent:band.parent,material:band.material,slots:band.material.slice(),metadata:metadata(band.geometry),transform:transform(band),castShadow:band.castShadow,receiveShadow:band.receiveShadow,renderOrder:band.renderOrder};
      for(const r of controller.staged){
        demand(r.part.mesh.geometry===r.geometry&&r.original!==r.geometry,'candidate private binding differs.');
        for(const[key,a]of Object.entries(r.geometry.attributes)){
          const old=r.original.attributes[key];demand(old&&await hash(a.array)===await hash(old.array),'candidate changed an original vertex attribute '+r.part.mesh.name+'.'+key);
        }
      }
      for(let i=0;i<privateGeometries.length;i++){
        const g=privateGeometries[i],label=i<2?controller.staged[i].part.mesh.name+'.private162':band.name;
        for(const[key,a]of entries(g)){demand(!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a),'private geometry shares an original GPU binding '+label+'.'+key);privateStamps.push(await stamp(g,key,a,label));}
        watch(g,label,true);
      }
      // Actual prepared164 geometry, not the older arithmetic fixture. This is
      // one narrow emitted-section/closure check and no whole-scene contact test.
      const geometryStarted=performance.now();geometryResult=checkChinGeometry162(controller.construction).metrics;
      geometryResult.elapsedMs=performance.now()-geometryStarted;
      demand(geometryResult.maximumFrontDownwardDeparture<.02&&geometryResult.minimumSampledRadialNormalCosine>0,'actual source section exceeds the stated bounded coarse shape.');
      demand(records.filter(r=>r.mesh.geometry!==r.geometry).length===2&&privateGeometries.length===3&&privateStamps.length===15,'candidate replacement inventory differs.');
    }else demand(records.every(r=>r.expected===r.geometry)&&!model.getObjectByName('Connected submental skin junction162'),'OFF altered scene geometry.');
    demand(upper.mesh.geometry===upper.geometry&&lower.mesh.geometry===lower.geometry&&ears.every(r=>r.mesh.geometry===r.geometry),'candidate moved the accepted mouth/ear geometry.');
    const activeTriangles=records.reduce((n,r)=>n+(r.expected.index?.count||r.expected.attributes.position.count)/3,0)+(band?band.geometry.index.count/3:0);
    demand(activeTriangles-sourceTriangleCount===(strength?-12220:0),'unexpected triangle ownership change.');
    audit={candidate:162,acceptedBase:164,scoreUnchanged:78,strength,spec:CHIN_JUNCTION162_SPEC,metrics,
      sourceMeshBindings:records.length,sourceGeometryCount:geometryRecords.size,sourceAttributeCount:sourceStamps.length,sourceMaterialCount:materialRecords.size,sourceTextureCount:textureRecords.size,
      sourceProvenance:expected.provenance,matchedNative164Attributes:sourceStamps.length,sourceAttributes:sourceStamps.map(summary),privateAttributes:privateStamps.map(summary),
      geometry:geometryResult,originalDispose,privateDispose,checkpoints:[],sourceTriangleCount,activeTriangleCount:activeTriangles,originalVertexArraysUnchanged:true,
      materialJoin:{newMesh:band?.name||null,faceFront:face.slots[0].name,faceRear:face.slots[1].name,neck:neck.material.name,
        chartSwitch:'At actual existing neck row36, after the submental return; face source row0 UV meets exact neck row36 UV. No map or physical response blend is made.',
        physical:[face.slots[0],face.slots[1],neck.material].map(m=>({name:m.name,physical:physical(m),maps:Object.keys(mapBindings(m))}))},
      sourceImages:[...textureRecords].map(([t,r])=>({label:r.label,size:[t.image.width,t.image.height],version:r.version,sourceVersion:r.sourceVersion,sha256:r.hash})),
      buffers:{privateReplacementCPUBytesBeforeUpload:strength?metrics.privateAttributeBytes:0,oldSelectedCPUBytesRetainedForThisQA:strength?sourceBytes:0,
        privateNetCPUBytesBeforeUpload:strength?metrics.privateAttributeBytes-sourceBytes:0,privateSourceGPUUploadsBeforeApplication:0,
        addedMeshes:strength?1:0,addedMaterialDrawGroups:strength?3:0,addedMaterials:0,addedTextures:0,perFrameWork:0,
        productionRetainsSourceByDefault:false,interpretation:'Replacement totals include the two full private attribute copies and new band. QA keeps the old selected CPU arrays temporarily; production defaults to dropping this helper’s original references before first upload. This is not a garbage-collector proof. GPU buffer estimates exclude renderer caches and draw overhead.'},
      envelopeQualification:'At matching original head-section depth, sampled extra downward departure is below .02. The separately recorded same-height forward projection is about .037, and is not a uniform .02 point-displacement guarantee.',
      limits:['No native art decision yet.','Exact local annulus boundary pairing is not a claim that all other source apertures are closed.','No whole-scene hair/cloth contact or export audit is included in this first coarse visual study.']};

    async function inspect(r,stage,allowUpload){
      const a=r.key==='index'?r.g.index:r.g.getAttribute(r.key);
      demand(a===r.a&&a.version===r.version&&a.usage===r.usage&&a.gpuType===r.gpuType&&a.itemSize===r.itemSize&&a.count===r.count&&a.normalized===r.normalized,'attribute identity/layout/version changed '+stage+': '+r.label+'.'+r.key);
      demand(await hash(r.array)===r.raw,'recorded source/private bytes changed: '+r.label+'.'+r.key);
      if(a.array!==r.array){
        const okay=allowUpload&&r.key==='index'&&!a.normalized&&(r.array instanceof Uint16Array||r.array instanceof Uint8Array)&&a.array instanceof Uint32Array&&await hash(a.array)===r.logical;
        demand(okay,'unexplained bound array replacement: '+r.label+'.'+r.key);
        widenings.set(r.label+'.'+r.key,{label:r.label,key:r.key,from:r.array.constructor.name,to:a.array.constructor.name,values:a.array.length,extraCPUBytes:a.array.byteLength-r.array.byteLength,logicalValuesExact:true});
      }
    }
    async function check(stage,{allowUpload=true,hashImages=false}={}){
      demand(!finished,'QA source records are released.');model.updateWorldMatrix(true,true);
      for(const n of nodes)demand(n.node.parent===n.parent&&n.node.visible===n.visible&&transform(n.node)===n.transform,'original node pose/visibility changed.');
      for(const r of records){
        const slots=Array.isArray(r.mesh.material)?r.mesh.material:[r.mesh.material];
        demand(r.mesh.geometry===(restored?r.geometry:r.expected)&&r.mesh.material===r.material&&r.mesh.parent===r.parent&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.renderOrder===r.renderOrder&&r.mesh.frustumCulled===r.frustumCulled&&r.mesh.layers.mask===r.layers&&slots.length===r.slots.length&&slots.every((m,i)=>m===r.slots[i]),'original binding/flag changed: '+r.label);
      }
      let count=0;model.traverse(o=>{if(o.isMesh)count++;});demand(count===64+(!restored&&strength?1:0),'unexpected scene mesh population.');
      for(const[g,r]of geometryRecords)demand(metadata(g)===r.metadata,'original geometry metadata changed: '+r.label);
      for(const r of sourceStamps)await inspect(r,stage,allowUpload);
      if(!restored){
        for(const r of privateStamps)await inspect(r,stage,allowUpload);
        if(band)demand(band.parent===bandStamp.parent&&band.material===bandStamp.material&&band.material.every((m,i)=>m===bandStamp.slots[i])&&metadata(band.geometry)===bandStamp.metadata&&transform(band)===bandStamp.transform&&band.castShadow===bandStamp.castShadow&&band.receiveShadow===bandStamp.receiveShadow&&band.renderOrder===bandStamp.renderOrder,'candidate band changed after preparation.');
      }
      for(const[m,r]of materialRecords){const maps=mapBindings(m);demand(physical(m)===r.physical&&JSON.stringify(m.userData)===r.metadata&&Object.keys(maps).length===Object.keys(r.maps).length&&Object.entries(r.maps).every(([k,t])=>maps[k]===t),'original material/texture binding changed: '+r.label);}
      for(const[t,r]of textureRecords){
        demand(t.source===r.source&&t.image===r.image&&t.image?.data===r.data&&t.version===r.version&&t.source.version===r.sourceVersion&&sampler(t)===r.sampler&&JSON.stringify(t.userData)===r.metadata,'original texture source/version/sampler changed: '+r.label);
        if(hashImages)demand(await hash(pixels(t))===r.hash,'original texture pixels changed: '+r.label);
      }
      for(const[key,r]of cached)demand(state[key]===r.value&&JSON.stringify(state[key])===r.json,'accepted cached preparation changed: '+key);
      demand(originalDispose.length===0,'disposed an original geometry/material/texture.');
      const row={stage,sourceBindings:records.length,sourceAttributes:sourceStamps.length,privateAttributes:restored?0:privateStamps.length,sourceImages:textureRecords.size,hashedImages:hashImages,indexWidenings:widenings.size,originalDisposals:originalDispose.length,passed:true};
      audit.checkpoints.push(row);return row;
    }
    await check('after162-before-native-upload',{allowUpload:false,hashImages:true});
    function display(){
      const p=window.portrait;demand(p?.ready&&p.renderer.backend?.isWebGPUBackend===true,'requires native WebGPU without automatic fallback.');
      demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.lighting==='soft'&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted display changed.');
      demand(p.renderer.domElement.width===900&&p.renderer.domElement.height===1200&&p.state.internalRender.width===1800&&p.state.internalRender.height===2400,'900×1200 AA2 output dimensions changed.');
      return{nativeWebGPU:true,toneMapping:7,exposure:1.4,output:[900,1200],internal:[1800,2400],antialiasing:2,heapMiB:performance.memory?.usedJSHeapSize/1048576};
    }
    async function restore(stage='complete'){
      if(restored)return audit.restoration;let pending;try{await check(stage+'-before-restore',{hashImages:true});}catch(error){pending=error;}
      const release=releaseChinJunction162(model);restored=true;
      audit.restoration={...release,sourceReferencesRestored:records.every(r=>r.mesh.geometry===r.geometry),bandAbsent:!model.getObjectByName('Connected submental skin junction162'),originalDisposals:originalDispose.length};
      demand(release.privateGeometriesDisposed===(strength?3:0)&&privateDispose.length===(strength?3:0)&&privateDispose.every(r=>r.sourceAttributes===0&&r.sourceBuffers===0&&r.allOriginalBindingsRestored&&r.bandDetached),'private cleanup count/ownership/order failed.');
      await check(stage+'-after-restore',{hashImages:true});if(pending)throw pending;return audit.restoration;
    }
    async function finish(stage='complete'){
      if(finished)return audit.cleanup;let pending;
      try{if(!restored)await restore(stage);await check(stage+'-final-check');}catch(error){pending=error;}
      audit.indexWidenings=[...widenings.values()];
      audit.materialVersionChanges=[...materialRecords].filter(([m,r])=>m.version!==r.version).map(([m,r])=>({label:r.label,before:r.version,after:m.version,physicalValuesAndMapsUnchanged:physical(m)===r.physical}));
      audit.buffers.privateReplacementCPUBytesAfterUpload=strength?privateGeometries.reduce((n,g)=>n+byteCount(g),0):0;
      audit.buffers.privateGPUAttributeAllocationEstimate=audit.buffers.privateReplacementCPUBytesAfterUpload;
      audit.cleanup={...audit.restoration,qaSourceRecordsReleased:true,constructionRecordsReleased:true,removedListeners:listeners.length};
      drop();finished=true;if(pending)throw pending;return audit.cleanup;
    }
    return{audit,metrics,display,check,restore,finish};
  }catch(error){
    let cleanup,cleanupError;try{cleanup=releaseChinJunction162(model);}catch(e){cleanupError=String(e);}
    drop();window.chin162PreparationFailure={message:error.message,cleanup,cleanupError,originalDispose:originalDispose.slice(),privateDispose:privateDispose.slice()};throw error;
  }
}
