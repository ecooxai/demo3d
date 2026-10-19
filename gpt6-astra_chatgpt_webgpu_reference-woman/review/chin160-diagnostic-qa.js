import * as THREE from 'three';

// Read-only material isolation of the actual accepted face/neck. No shape,
// source image, light, camera or texture data is generated or modified here.
const demand=(v,m)=>{if(!v)throw Error('Chin160: '+m);};
const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid','version'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));

export function createChin160Diagnostic(model){
 const records=[],selected=[],originals=new Set(),textures=new Set(),privateMaterials=new Set(),privatePairs=new Map(),listeners=[],disposals=[],attributes=[];
 let mode='original',begun=false,finished=false;
 model.traverse(mesh=>{if(!mesh.isMesh)return;
  const record={mesh,geometry:mesh.geometry,material:mesh.material,slots:Array.isArray(mesh.material)?mesh.material.slice():[mesh.material],transform:JSON.stringify(mesh.matrixWorld.elements)};
  records.push(record);
  if(['continuous-face','neck-smooth-anatomical-surface'].includes(mesh.name)){selected.push(record);for(const m of record.slots){originals.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}}
 });
 demand(selected.length===2,'expected actual face and neck.');
 const appearance=[],audit={iteration:160,acceptedBase:157,score:78,status:'Prepared',modes:[],checkpoints:[],sourceDisposals:disposals,
  interpretation:'Geometry and original appearance stay fixed. Uniform clay tests lit shape; unlit color tests the existing color map and vertex colors without studio lighting. These are diagnostic views, not selectable production appearances or a new quality score.'};
 function watch(r,label){const fn=()=>disposals.push(label);r.addEventListener('dispose',fn);listeners.push([r,fn]);}
 async function begin(){
  demand(!begun&&!finished,'begin once after the first native upload.');
  const p=window.portrait;demand(p.ready&&p.renderer.backend?.isWebGPUBackend,'requires native WebGPU; no fallback.');
  demand(p.state.iteration===157&&p.state.score===78&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'accepted157 display changed.');
  demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4,'accepted lighting changed.');
  for(const r of selected)for(const [key,a]of[...Object.entries(r.geometry.attributes),['index',r.geometry.index]])if(a)attributes.push({mesh:r.mesh,key,a,array:a.array,version:a.version,sha256:await digest(a.array)});
  for(const m of originals){appearance.push({m,physical:physical(m),maps:Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture))});watch(m,'material:'+m.name);}
  for(const t of textures)watch(t,'texture:'+t.name);
  for(const m of originals){
   const clay=m.clone();for(const[k,v]of Object.entries(clay))if(v?.isTexture)clay[k]=null;
   clay.name='chin160-uniform-clay';clay.color.set('#d6b6a3');clay.vertexColors=false;clay.roughness=.75;clay.metalness=0;clay.specularIntensity=.12;clay.clearcoat=0;clay.sheen=0;clay.emissive.set(0);clay.emissiveIntensity=0;
   const unlit=new THREE.MeshBasicMaterial({name:'chin160-existing-unlit-color',color:m.color.clone(),map:m.map,alphaMap:m.alphaMap,vertexColors:m.vertexColors,side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,depthWrite:m.depthWrite});
   privatePairs.set(m,{clay,unlit});privateMaterials.add(clay);privateMaterials.add(unlit);
  }
  begun=true;audit.status='Native diagnostic ready';audit.sourceMeshes=records.length;audit.selectedAttributes=attributes.length;audit.originalMaterials=originals.size;audit.originalTextures=textures.size;audit.privateMaterials=privateMaterials.size;
  await check('after-first-upload');return{...audit,disposals:disposals.slice()};
 }
 function setMode(next){
  demand(begun&&!finished&&['original','clay','unlit'].includes(next),'unknown mode or released resources.');
  for(const r of selected)r.mesh.material=next==='original'?r.material:(Array.isArray(r.material)?r.slots.map(m=>privatePairs.get(m)[next]):privatePairs.get(r.material)[next]);
  mode=next;if(!audit.modes.includes(next))audit.modes.push(next);return next;
 }
 async function check(stage){
  demand(begun&&!finished,'check requires active diagnostic.');
  for(const r of records){demand(r.mesh.geometry===r.geometry&&JSON.stringify(r.mesh.matrixWorld.elements)===r.transform,'geometry/frame changed: '+r.mesh.name);
   if(!selected.includes(r)||mode==='original')demand(r.mesh.material===r.material,'unrelated/restored material binding changed: '+r.mesh.name);
  }
  for(const r of attributes){const a=r.key==='index'?r.mesh.geometry.index:r.mesh.geometry.attributes[r.key];demand(a===r.a&&a.array===r.array&&a.version===r.version&&await digest(a.array)===r.sha256,'geometry data changed: '+r.mesh.name+'.'+r.key);}
  for(const r of appearance){demand(physical(r.m)===r.physical,'source material values changed.');for(const[k,t]of Object.entries(r.maps))demand(r.m[k]===t,'source map binding changed.');}
  demand(disposals.length===0,'an original material/texture was disposed.');
  const row={stage,mode,meshBindings:records.length,selectedAttributes:attributes.length,originalMaterials:appearance.length,originalDisposals:0,passed:true};audit.checkpoints.push(row);return row;
 }
 function restore(){if(finished)return;for(const r of selected)r.mesh.material=r.material;mode='original';}
 async function finish(){
  if(finished)return{alreadyReleased:true};restore();if(begun)await check('restored-before-private-disposal');
  const count=privateMaterials.size;for(const m of privateMaterials)m.dispose();
  for(const[r,fn]of listeners)r.removeEventListener('dispose',fn);listeners.length=0;
  audit.cleanup={originalBindingsRestored:selected.every(r=>r.mesh.material===r.material),privateMaterialsDisposed:count,originalDisposals:disposals.length,qaReferencesReleased:true};
  records.length=selected.length=attributes.length=appearance.length=0;originals.clear();textures.clear();privateMaterials.clear();privatePairs.clear();finished=true;return audit.cleanup;
 }
 return{audit,begin,setMode,check,restore,finish};
}
