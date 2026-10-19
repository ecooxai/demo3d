import {applyJawSilhouette155,releaseJawSilhouette155,getJawSilhouetteField155} from './jaw-silhouette-candidate155.js';
import {inspectJawInterfaces155} from './jaw155-interface-geometry.js';

const demand=(v,m)=>{if(!v)throw Error('155 interface '+m);};
const attributes=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');
const transform=m=>JSON.stringify([m.position.toArray(),m.quaternion.toArray(),m.scale.toArray()]);
function ancestor(mesh,name){for(let p=mesh;p;p=p.parent)if(p.name===name)return true;return false;}
function visible(mesh){for(let p=mesh;p;p=p.parent)if(!p.visible)return false;return true;}
function category(mesh){
  if(mesh.name==='ear-continuous-anatomical-shell'&&(ancestor(mesh,'left-ear')||ancestor(mesh,'right-ear')))return'ear';
  if(ancestor(mesh,'left-eye')||ancestor(mesh,'right-eye'))return'eye';
  if(ancestor(mesh,'Original reference-directed chestnut layered groom'))return'hair';
  if(ancestor(mesh,'original-tailored-white-cotton-blouse'))return'cloth';
  return null;
}
async function stamp(geometry,key,a,label){return{geometry,key,attribute:a,array:a.array,version:a.version,label,itemSize:a.itemSize,count:a.count,normalized:a.normalized,
  raw:await digest(a.array),logical:key==='index'?await digest(a.array instanceof Uint32Array?a.array:Uint32Array.from(a.array)):null};}

/** Called after live accepted147, once, before the first ordinary GPU upload. */
export async function prepareJaw155InterfaceQA({model,views}){
  model.updateWorldMatrix(true,true);
  const head=model.getObjectByName('anatomical-head'),names=new Set(['continuous-face','neck-smooth-anatomical-surface']),records=[],selected=[],obstacles=[],stamps=[],privateStamps=[],
    allSourceBuffers=new Set(),allSourceAttributes=new Set(),watched=new Set(),listeners=[],originalDisposals=[],privateDisposals=[],widenings=new Map(),field=getJawSilhouetteField155(model);
  let restored=false,finished=false,findings=null,metrics;
  const watch=(g,label,isPrivate=false)=>{if(watched.has(g))return;watched.add(g);const fn=()=>{if(isPrivate)privateDisposals.push({label,sharedAttributes:attributes(g).filter(([,a])=>allSourceAttributes.has(a)).length,sharedBuffers:attributes(g).filter(([,a])=>allSourceBuffers.has(a.array.buffer)).length});else originalDisposals.push(label);};g.addEventListener('dispose',fn);listeners.push([g,fn]);};
  try{
    model.traverse(mesh=>{if(!mesh.isMesh)return;const r={mesh,geometry:mesh.geometry,material:mesh.material,slots:Array.isArray(mesh.material)?mesh.material.slice():null,label:mesh.parent.name+'/'+mesh.name,
      parent:mesh.parent,visible:mesh.visible,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,renderOrder:mesh.renderOrder,transform:transform(mesh),worldMatrix:JSON.stringify(mesh.matrixWorld.elements),expected:mesh.geometry};records.push(r);
      if(names.has(mesh.name))selected.push(r);const c=category(mesh);if(c&&visible(mesh))obstacles.push({mesh,category:c});
      for(const[,a]of attributes(mesh.geometry)){allSourceBuffers.add(a.array.buffer);allSourceAttributes.add(a);}
      watch(mesh.geometry,r.label);
    });
    demand(selected.length===2&&selected.every(r=>r.mesh.geometry.index),'needs exactly the actual indexed face and neck.');
    demand(obstacles.filter(r=>r.category==='ear').length===2&&obstacles.filter(r=>r.category==='hair').length===5,'accepted ear/groom inventory changed.');
    const touched=new Set([...selected.map(r=>r.mesh),...obstacles.map(r=>r.mesh)]);
    for(const r of records)if(touched.has(r.mesh))for(const key of names.has(r.mesh.name)?['position','normal','index']:['position','index']){
      const a=key==='index'?r.geometry.index:r.geometry.getAttribute(key);demand(a,'required '+key+' missing on '+r.label);stamps.push(await stamp(r.geometry,key,a,r.label));
    }
    metrics=applyJawSilhouette155(model,{strength:1,retainSourceForQA:true});
    demand(applyJawSilhouette155(model,{strength:1,retainSourceForQA:true})===metrics,'once-only cached result changed.');
    demand(metrics.privateGeometryCount===2&&metrics.privateAttributeBytes===7704240,'frozen155 replacement inventory changed.');
    for(const r of selected){r.expected=r.mesh.geometry;demand(r.expected!==r.geometry,'selected155 geometry was not replaced.');
      for(const[,a]of attributes(r.expected))demand(!allSourceBuffers.has(a.array.buffer)&&!allSourceAttributes.has(a),'replacement geometry shares an original GPU attribute.');
      watch(r.expected,r.label+'.private155',true);
      for(const key of['position','normal','index'])privateStamps.push(await stamp(r.expected,key,key==='index'?r.expected.index:r.expected.getAttribute(key),r.label+'.private155'));
    }
    const audit={candidate:155,acceptedBase:149,acceptedScore:78,metrics,sourceMeshBindings:records.length,selectedMeshes:selected.map(r=>r.label),
      sourcePositionIndexStamps:stamps.length,privatePositionNormalIndexStamps:privateStamps.length,
      obstacleInventory:obstacles.map(r=>({category:r.category,mesh:r.mesh.name,parent:r.mesh.parent.name,vertices:r.mesh.geometry.attributes.position.count,triangles:r.mesh.geometry.index.count/3})),
      checkpoints:[],originalDisposals,privateDisposals,
      scope:'One actual OFF/ON geometry pair from retained source/replacement references in the same prepared scene. No repeat of155 field certificates, normal-orientation gates, texture hashes, optical sweeps or full-view captures.',
      retention:'The two original selected geometries are retained only for this QA. The audit allocates CPU-only spatial structures, releases them after findings, restores original bindings, and disposes only the two wholly private replacements.'};
    async function inspectStamp(q,stage,allowUpload=true){
      const a=q.key==='index'?q.geometry.index:q.geometry.getAttribute(q.key);demand(a===q.attribute&&a.version===q.version&&a.itemSize===q.itemSize&&a.count===q.count&&a.normalized===q.normalized,'attribute identity/layout/version changed at '+stage+': '+q.label+'.'+q.key);
      demand(await digest(q.array)===q.raw,'recorded source bytes changed: '+q.label+'.'+q.key);
      if(a.array!==q.array){const widened=allowUpload&&q.key==='index'&&!a.normalized&&(q.array instanceof Uint16Array||q.array instanceof Uint8Array)&&a.array instanceof Uint32Array&&await digest(a.array)===q.logical;
        demand(widened,'unexplained array replacement: '+q.label+'.'+q.key);widenings.set(q.label+'.'+q.key,{label:q.label,key:q.key,from:q.array.constructor.name,to:a.array.constructor.name,values:a.array.length,logicalValuesExact:true});
      }else demand(await digest(a.array)===q.raw,'bound bytes changed: '+q.label+'.'+q.key);
    }
    async function check(stage,allowUpload=true){
      demand(!finished,'source records have already been released.');model.updateWorldMatrix(true,true);
      for(const r of records)demand(r.mesh.geometry===(restored?r.geometry:r.expected)&&r.mesh.material===r.material&&r.mesh.parent===r.parent&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.renderOrder===r.renderOrder&&transform(r.mesh)===r.transform&&JSON.stringify(r.mesh.matrixWorld.elements)===r.worldMatrix&&(!r.slots||r.mesh.material.length===r.slots.length&&r.slots.every((m,k)=>r.mesh.material[k]===m)),'changed unrelated binding/flag/transform: '+r.label);
      for(const q of stamps)await inspectStamp(q,stage,allowUpload);if(!restored)for(const q of privateStamps)await inspectStamp(q,stage,allowUpload);
      demand(originalDisposals.length===0,'disposed an original geometry.');
      const entry={stage,sourceBindings:records.length,sourceDataStamps:stamps.length,privateDataStamps:restored?0:privateStamps.length,exactValueIndexWidenings:widenings.size,passed:true};audit.checkpoints.push(entry);return entry;
    }
    await check('after155-before-first-native-upload',false);
    function display(){const p=window.portrait;demand(p?.ready&&p.renderer.backend?.isWebGPUBackend===true,'requires actual native WebGPU; no fallback.');
      demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.lighting==='soft'&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted display changed.');
      return{nativeWebGPU:true,toneMapping:7,exposure:1.4,resolution:[900,1200],antialiasing:2,heapMiB:performance.memory?.usedJSHeapSize/1048576};
    }
    async function inspect(){demand(!restored&&!finished,'requires the live frozen155 replacement.');if(findings)return findings;
      display();model.updateWorldMatrix(true,true);
      findings=await inspectJawInterfaces155({selected,obstacles,head,field,views,onProgress:p=>console.log('jaw155-interface '+JSON.stringify(p))});
      demand(findings.allocations.trackedTypedBuffersStillHeld===0,'audit retained its temporary typed arrays.');audit.findingsReady=true;return findings;
    }
    async function restore(stage='complete'){
      if(restored)return audit.restoration;let pending;try{await check(stage+'-before-restore');}catch(error){pending=error;}
      const r=releaseJawSilhouette155(model);restored=true;audit.restoration={...r,sourceReferencesRestored:records.every(q=>q.mesh.geometry===q.geometry),originalDisposals:originalDisposals.length};
      demand(r.privateGeometriesDisposed===2&&privateDisposals.length===2&&privateDisposals.every(r=>r.sharedAttributes===0&&r.sharedBuffers===0),'private cleanup reached shared resources or wrong geometry count.');
      await check(stage+'-after-restore');if(pending)throw pending;return audit.restoration;
    }
    async function finish(stage='complete'){
      if(finished)return{qaReferencesAlreadyReleased:true};let pending;
      try{if(!restored)await restore(stage);await check(stage+'-final-source-check');}catch(error){pending=error;}
      audit.indexWidenings=[...widenings.values()];audit.cleanup={...audit.restoration,qaSourceReferencesReleased:true};
      for(const[g,fn]of listeners)g.removeEventListener('dispose',fn);listeners.length=0;records.length=selected.length=obstacles.length=stamps.length=privateStamps.length=0;
      allSourceBuffers.clear();allSourceAttributes.clear();watched.clear();touched.clear();finished=true;
      if(pending)throw pending;return audit.cleanup;
    }
    return{audit,metrics,display,check,inspect,restore,finish};
  }catch(error){
    let cleanup,cleanupError;try{cleanup=releaseJawSilhouette155(model);}catch(e){cleanupError=String(e);}
    for(const[g,fn]of listeners)g.removeEventListener('dispose',fn);listeners.length=0;records.length=selected.length=obstacles.length=stamps.length=privateStamps.length=0;allSourceBuffers.clear();allSourceAttributes.clear();watched.clear();
    window.jaw155InterfacePreparationFailure={message:error.message,cleanup,cleanupError,originalDisposals:originalDisposals.slice(),privateDisposals:privateDisposals.slice()};throw error;
  }
}
