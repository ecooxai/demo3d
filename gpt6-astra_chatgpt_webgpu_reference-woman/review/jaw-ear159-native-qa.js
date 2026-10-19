import {applyJawEar159,releaseJawEar159,JAW_EAR159_SPEC} from './jaw-ear-candidate159.js';
import {getJawSilhouetteField155} from './jaw-silhouette-candidate155.js';
import {inspectJawGeometry155} from './jaw-silhouette155-geometry-audit.js';
import {inspectJawEarInterfaces159} from './jaw-ear159-geometry.js';

const demand=(v,m)=>{if(!v)throw Error('159 QA '+m);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const hash=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),n=>n.toString(16).padStart(2,'0')).join('');
const logical=a=>a instanceof Uint32Array?a:Uint32Array.from(a);
const transform=m=>JSON.stringify([m.position.toArray(),m.quaternion.toArray(),m.scale.toArray(),m.matrixWorld.elements]);
const label=m=>m.parent.name+'/'+m.name;
function activeVisible(m){for(let p=m;p;p=p.parent)if(!p.visible)return false;return true;}
async function stamp(g,key,a,name){return{g,key,attribute:a,array:a.array,version:a.version,itemSize:a.itemSize,count:a.count,normalized:a.normalized,name,
  raw:await hash(a.array),logical:key==='index'?await hash(logical(a.array)):null};}
const summary=r=>({label:r.name,key:r.key,type:r.array.constructor.name,bytes:r.array.byteLength,values:r.array.length,sha256:r.raw,indexLogicalSHA256:r.logical});
function bytes(g){return entries(g).reduce((s,[,a])=>s+a.array.byteLength,0);}
function zeroNormals(records,original){let count=0;for(const r of records){const a=(original?r.geometry:r.mesh.geometry).getAttribute('normal');for(let i=0;i<a.count;i++)if(a.getX(i)===0&&a.getY(i)===0&&a.getZ(i)===0)count++;}return count;}

/** Live157 has completed115/140/147/151/154; no first GPU upload yet. */
export async function prepareJawEarQA159({model,hair,state,strength,expected}){
  demand(strength===0||strength===1,'requires the single approved OFF/ON pair.');model.updateWorldMatrix(true,true);
  const head=model.getObjectByName('anatomical-head'),records=[],selected=[],earRows=[],faceRows=[],sourceStamps=[],privateStamps=[],
    sourceBuffers=new Set(),sourceAttributes=new Set(),watched=new Set(),listeners=[],originalDispose=[],privateDispose=[],widenings=new Map(),materials=new Map(),cached=new Map(),
    field=getJawSilhouetteField155(model),hairMeshes=[];
  let metrics,restored=false,finished=false,riskResult=null,audit;
  const watch=(g,name,isPrivate=false)=>{if(watched.has(g))return;watched.add(g);const fn=()=>{
    if(isPrivate)privateDispose.push({label:name,sourceAttributes:entries(g).filter(([,a])=>sourceAttributes.has(a)).length,sourceBuffers:entries(g).filter(([,a])=>sourceBuffers.has(a.array.buffer)).length});
    else originalDispose.push(name);
  };g.addEventListener('dispose',fn);listeners.push([g,fn]);};
  const dropRecords=()=>{for(const[g,fn]of listeners)g.removeEventListener('dispose',fn);listeners.length=0;
    records.length=selected.length=earRows.length=faceRows.length=sourceStamps.length=privateStamps.length=hairMeshes.length=0;
    sourceBuffers.clear();sourceAttributes.clear();watched.clear();materials.clear();cached.clear();};
  try{
    demand(state.iteration===157&&state.score===78&&state.nearEarYaw115?.degrees===-25&&state.eyeContour147?.strength===1&&state.eyelash151?.strength===1&&state.blouseDrape154?.strength===1,'requires complete accepted157 preparation.');
    for(const key of['mouthContinuity130','upperLipRelief140','eyeContour147','eyelash151','blouseDrape154','nearEarYaw115','balance','hairColor149']){
      demand(state[key]!==undefined,'missing accepted preparation '+key);cached.set(key,{value:state[key],json:JSON.stringify(state[key])});
    }
    model.traverse(mesh=>{if(!mesh.isMesh)return;const r={mesh,geometry:mesh.geometry,expected:mesh.geometry,material:mesh.material,slots:Array.isArray(mesh.material)?mesh.material.slice():null,
      label:label(mesh),parent:mesh.parent,visible:mesh.visible,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,renderOrder:mesh.renderOrder,transform:transform(mesh)};records.push(r);
      if(mesh.name==='continuous-face'||mesh.name==='neck-smooth-anatomical-surface'){selected.push(r);faceRows.push(r);}
      if(mesh.name==='ear-continuous-anatomical-shell'&&['left-ear','right-ear'].includes(mesh.parent.name)){selected.push(r);earRows.push(r);}
      for(const[,a]of entries(mesh.geometry)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}watch(mesh.geometry,r.label);
      for(const m of r.slots||[r.material])if(!materials.has(m))materials.set(m,Object.entries(m).filter(([,v])=>v?.isTexture));
    });
    hair.traverse(m=>{if(m.isMesh&&activeVisible(m))hairMeshes.push(m);});
    demand(records.length===64&&faceRows.length===2&&earRows.length===2&&selected.length===4&&hairMeshes.length===5,'prepared157 mesh inventory changed.');
    const seenGeometries=new Set();for(const r of records)if(!seenGeometries.has(r.geometry)){seenGeometries.add(r.geometry);for(const[key,a]of entries(r.geometry))sourceStamps.push(await stamp(r.geometry,key,a,r.label));}seenGeometries.clear();
    const byExpected=new Map(expected.source.map(r=>[r.label+'|'+r.key,r]));
    for(const r of selected)for(const[key,a]of entries(r.geometry)){
      const e=byExpected.get(r.label+'|'+key);demand(e,'missing actual155 source provenance for '+r.label+'.'+key);
      demand((key==='index'?await hash(logical(a.array))===e.indexLogicalSHA256:await hash(a.array)===e.sha256),'accepted157 changed the original155 selected data: '+r.label+'.'+key);
    }byExpected.clear();
    demand(JSON.stringify(field.protectedBox)===JSON.stringify(expected.certificate.protectedMouthBox)&&Math.abs(field.analyticMinimumDeterminant-expected.certificate.analyticMinimumDeterminant)<1e-12,'unchanged155 field certificate does not match actual157 mouth/frame.');
    const right=earRows.find(r=>r.mesh.parent.name==='right-ear'),p=right.geometry.attributes.position,uv=right.geometry.attributes.uv,m=right.mesh.matrixWorld.elements,
      lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];let anchorSamples=0;
    for(let i=0;i<p.count;i++)if(uv.getX(i)>=.30&&uv.getX(i)<=.48&&uv.getY(i)>=.04&&uv.getY(i)<=.38){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);anchorSamples++;
      for(let k=0;k<3;k++){const w=m[k]*x+m[k+4]*y+m[k+8]*z+m[k+12];lo[k]=Math.min(lo[k],w);hi[k]=Math.max(hi[k],w);}}
    demand(anchorSamples>10&&lo.every(Number.isFinite)&&hi.every(Number.isFinite),'missing fixed OFF lower-inner-ear framing support.');
    const closeCenter=lo.map((v,k)=>(v+hi[k])/2),zerosBefore=zeroNormals(selected,true),originalBytes=selected.reduce((s,r)=>s+bytes(r.geometry),0);
    metrics=applyJawEar159(model,{strength,retainSourceForQA:true});
    demand(applyJawEar159(model,{strength,retainSourceForQA:true})===metrics,'cached159 identity changed.');
    for(const r of selected){r.expected=r.mesh.geometry;
      if(strength){demand(r.expected!==r.geometry,'ON did not replace '+r.label);for(const[key,a]of entries(r.expected))demand(!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a),'private clone shares a source GPU binding: '+r.label+'.'+key);watch(r.expected,r.label+'.private159',true);
        for(const[key,a]of entries(r.expected))privateStamps.push(await stamp(r.expected,key,a,r.label+'.private159'));
      }else demand(r.expected===r.geometry,'OFF altered geometry binding.');
    }
    const afterExpected=new Map(expected.faceNeck.map(r=>[r.label.replace('.private155','')+'|'+r.key,r]));
    if(strength)for(const r of faceRows)for(const[key,a]of entries(r.expected)){
      const e=afterExpected.get(r.label+'|'+key);demand(e&&(key==='index'?await hash(logical(a.array))===e.indexLogicalSHA256:await hash(a.array)===e.sha256),'face/neck output differs from actual selected155: '+r.label+'.'+key);
    }afterExpected.clear();
    let exactOutside=0;for(const r of earRows){const a=r.geometry.attributes.position,b=r.expected.attributes.position,n=r.geometry.attributes.normal,N=r.expected.attributes.normal,M=r.mesh.matrixWorld.elements;
      for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),s=field.world(M[0]*x+M[4]*y+M[8]*z+M[12],M[1]*x+M[5]*y+M[9]*z+M[13],M[2]*x+M[6]*y+M[10]*z+M[14]);
        if(!s.active){for(let k=0;k<3;k++)demand(Object.is(a.array[i*3+k],b.array[i*3+k])&&Object.is(n.array[i*3+k],N.array[i*3+k]),'inactive ear position/normal bytes changed.');exactOutside++;}}
      for(const[key,a]of entries(r.geometry))if(!['position','normal'].includes(key)){const b=key==='index'?r.expected.index:r.expected.attributes[key];demand(await hash(a.array)===await hash(b.array),'ear immutable '+key+' changed.');}
    }
    const zerosAfter=zeroNormals(selected,false);demand(zerosBefore===zerosAfter,'changed the selected unused zero-normal population.');
    audit={candidate:159,acceptedBase:157,scoreUnchanged:78,strength,spec:JAW_EAR159_SPEC,metrics,sourceMeshBindings:records.length,sourceAttributeCount:sourceStamps.length,
      privateAttributeCount:privateStamps.length,sourceAttributes:sourceStamps.map(summary),privateAttributes:privateStamps.map(summary),
      selectedSourceParityWith155:true,faceNeckOutputParityWith155:strength?true:'OFF source only',exactOutsideEarVertices:exactOutside,zeroNormalsBefore:zerosBefore,zeroNormalsAfter:zerosAfter,
      certificateReuse:{source:expected.certificateSource,actualMouthBoundsExact:true,analyticMinimum:field.analyticMinimumDeterminant,certifiedGlobalMinimum:expected.certificate.certifiedMinimumDeterminant,maximumWorldDisplacementUpper:expected.certificate.maximumWorldDisplacementUpper,rerunGrid:false},
      closeCenter,closeAnchorSamples:anchorSamples,closeFraming:'Fixed OFF bounds of existing right-ear UV0 lower-inner strip; camera only, no geometry row warp.',
      originalDispose,privateDispose,checkpoints:[],buffers:{privateReplacementCPUBytesBeforeUpload:strength?metrics.privateAttributeBytes:0,originalCPUBytesRetainedForQA:strength?originalBytes:0,originalReplacementGPUUploadsBefore159:0,
        addedDraws:0,addedTextureBytes:0,productionRetainsOriginals:false,interpretation:'Private totals are replacement storage. QA keeps originals temporarily; production drops this helper\'s originals before first upload. GPU estimates exclude renderer overhead.'}};
    async function inspectStamp(r,stage,allowUpload=true){const a=r.key==='index'?r.g.index:r.g.getAttribute(r.key);
      demand(a===r.attribute&&a.version===r.version&&a.itemSize===r.itemSize&&a.count===r.count&&a.normalized===r.normalized,'attribute identity/layout/version changed '+stage+': '+r.name+'.'+r.key);
      demand(await hash(r.array)===r.raw,'recorded original/private bytes changed: '+r.name+'.'+r.key);
      if(a.array!==r.array){const okay=allowUpload&&r.key==='index'&&!a.normalized&&(r.array instanceof Uint16Array||r.array instanceof Uint8Array)&&a.array instanceof Uint32Array&&await hash(a.array)===r.logical;
        demand(okay,'unexpected array replacement: '+r.name+'.'+r.key);widenings.set(r.name+'.'+r.key,{label:r.name,key:r.key,from:r.array.constructor.name,to:a.array.constructor.name,values:a.array.length,logicalValuesExact:true});}
    }
    async function check(stage,allowUpload=true){demand(!finished,'QA records were released.');model.updateWorldMatrix(true,true);
      for(const r of records)demand(r.mesh.geometry===(restored?r.geometry:r.expected)&&r.mesh.material===r.material&&r.mesh.parent===r.parent&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.renderOrder===r.renderOrder&&transform(r.mesh)===r.transform&&(!r.slots||r.mesh.material.length===r.slots.length&&r.slots.every((m,i)=>r.mesh.material[i]===m)),'unrelated binding/transform changed: '+r.label);
      for(const[m,list]of materials)for(const[key,t]of list)demand(m[key]===t,'changed an original texture reference: '+key);
      for(const[key,q]of cached)demand(state[key]===q.value&&JSON.stringify(state[key])===q.json,'changed accepted157 preparation '+key);
      for(const r of sourceStamps)await inspectStamp(r,stage,allowUpload);if(!restored)for(const r of privateStamps)await inspectStamp(r,stage,allowUpload);
      demand(originalDispose.length===0,'disposed original geometry.');const q={stage,sourceBindings:records.length,sourceAttributes:sourceStamps.length,privateAttributes:restored?0:privateStamps.length,indexWidenings:widenings.size,passed:true};audit.checkpoints.push(q);return q;
    }
    await check('after159-before-upload',false);
    function display(){const p=window.portrait;demand(p?.ready&&p.renderer.backend?.isWebGPUBackend===true,'requires actual native WebGPU without fallback.');
      demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.lighting==='soft'&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted display changed.');
      demand(p.renderer.domElement.width===900&&p.renderer.domElement.height===1200&&p.state.internalRender.width===1800&&p.state.internalRender.height===2400,'900×1200 AA2 render dimensions changed.');
      return{nativeWebGPU:true,toneMapping:7,exposure:1.4,output:[900,1200],internal:[1800,2400],antialiasing:2,heapMiB:performance.memory?.usedJSHeapSize/1048576};}
    async function risk(){demand(!restored&&!finished,'risk requires current replacement.');if(riskResult)return riskResult;
      if(!strength)return{baseline:true,interpretation:'The ON page measures actual retained OFF versus ON interface geometry. No duplicate OFF risk pass.'};
      await check('before-ear-risk');display();const geometry=inspectJawGeometry155(earRows,field);
      geometry.orientation.forEach((q,i)=>{q.ear=earRows[i].mesh.parent.name;});
      for(const q of geometry.orientation)demand(q.newDegenerate===0&&q.reversedToOriginal===0&&q.opposedToTransportedGeometry===0,'actual emitted ear triangles failed orientation: '+q.mesh);
      const interfaces=await inspectJawEarInterfaces159({selected,hair:hairMeshes,head,field,onProgress:q=>console.log('jaw-ear159 '+JSON.stringify(q))});
      demand(interfaces.allocations.trackedTypedBuffersStillHeld===0,'interface accelerator retains typed arrays.');
      audit.buffers.privateReplacementCPUBytesAfterUpload=selected.reduce((s,r)=>s+bytes(r.mesh.geometry),0);audit.buffers.privateGPUAttributeEstimate=audit.buffers.privateReplacementCPUBytesAfterUpload;
      riskResult={geometry,interfaces,certificateReuse:audit.certificateReuse,interpretation:'Ear triangle normals are geometric and separate from authored shading normals. New contact identities and sampled support need artistic/attachment interpretation; they are not an automatic zero-contact gate.'};await check('after-ear-risk');return riskResult;
    }
    async function restore(stage='complete'){if(restored)return audit.restoration;let pending;try{await check(stage+'-before-restore');}catch(error){pending=error;}
      const result=releaseJawEar159(model);restored=true;audit.restoration={...result,sourceReferencesRestored:records.every(r=>r.mesh.geometry===r.geometry),originalDisposals:originalDispose.length};
      demand(result.privateGeometriesDisposed===(strength?4:0)&&privateDispose.length===(strength?4:0)&&privateDispose.every(r=>r.sourceAttributes===0&&r.sourceBuffers===0),'cleanup reached a source GPU binding or wrong private count.');
      await check(stage+'-after-restore');if(pending)throw pending;return audit.restoration;
    }
    async function finish(stage='complete'){if(finished)return{qaReferencesAlreadyReleased:true};let pending;
      try{if(!restored)await restore(stage);await check(stage+'-final-check');}catch(error){pending=error;}
      audit.indexWidenings=[...widenings.values()];audit.cleanup={...audit.restoration,qaSourceRecordsReleased:true};dropRecords();finished=true;if(pending)throw pending;return audit.cleanup;
    }
    return{audit,metrics,closeCenter,display,check,risk,restore,finish};
  }catch(error){let cleanup,cleanupError;try{cleanup=releaseJawEar159(model);}catch(e){cleanupError=String(e);}dropRecords();
    window.jawEar159PreparationFailure={message:error.message,cleanup,cleanupError,originalDispose:originalDispose.slice(),privateDispose:privateDispose.slice()};throw error;
  }
}
