// Read-only native probe. No copied geometry, material changes or renderer swaps.
export function createRearQA166(p){
 const demand=(v,m)=>{if(!v)throw Error('166 '+m);};
 const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
 const transform=o=>JSON.stringify([o.position.toArray(),o.quaternion.toArray(),o.scale.toArray()]);
 const physical=m=>JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k,v])=>!['id','uuid','version'].includes(k)&&(v===null||['number','boolean','string'].includes(typeof v)||v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4)).map(([k,v])=>[k,v?.toArray?v.toArray():v])));
 const sampler=t=>JSON.stringify({channel:t.channel,format:t.format,type:t.type,colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,flipY:t.flipY,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,rotation:t.rotation,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),matrixAutoUpdate:t.matrixAutoUpdate,manualMatrix:t.matrixAutoUpdate?null:t.matrix.toArray()});
 const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:(()=>{throw Error('166 unsupported image '+t.name);})();
 const mapBindings=m=>Object.fromEntries(Object.entries(m).filter(([,v])=>v?.isTexture));
 const objects=[],nodes=[],attrs=[],materials=[],textures=[],geometries=[],listeners=[],disposals=[];
 p.model.traverse(node=>{nodes.push({node,parent:node.parent,transform:transform(node),visible:node.visible});if(!node.isMesh)return;const slots=Array.isArray(node.material)?node.material.slice():[node.material],label=objects.length+':'+node.parent.name+'/'+node.name,g=node.geometry;
  objects.push({mesh:node,label,geometry:g,material:node.material,slots,castShadow:node.castShadow,receiveShadow:node.receiveShadow,renderOrder:node.renderOrder,metadata:JSON.stringify({userData:g.userData,groups:g.groups,drawRange:g.drawRange,attributes:Object.keys(g.attributes)})});if(!geometries.includes(g))geometries.push(g);
  for(const[k,a]of[...Object.entries(g.attributes),['index',g.index]])if(a)attrs.push({mesh:node,g,label,key:k,a,array:a.array,version:a.version,itemSize:a.itemSize,count:a.count,normalized:a.normalized,usage:a.usage,gpuType:a.gpuType});
  for(const m of slots)if(!materials.includes(m)){materials.push(m);for(const t of Object.values(m))if(t?.isTexture&&!textures.includes(t))textures.push(t);}
 });
 demand(objects.length===64&&geometries.length===64&&materials.length===50&&textures.length===10&&attrs.length===282,'unexpected accepted164 inventory');
 const materialState=materials.map(m=>({m,physical:physical(m),metadata:JSON.stringify(m.userData),maps:mapBindings(m)}));
 const textureState=textures.map(t=>({t,source:t.source,image:t.image,data:t.image?.data,sampler:sampler(t),metadata:JSON.stringify(t.userData)}));
 const keys=['mouthContinuity130','upperLipRelief140','referenceCrown','crownFacing141','eyeContour147','hairColor149','eyelash151','blouseDrape154','collarRoll158','jawEar159'];
 const cached=keys.map(k=>({key:k,value:p.state[k],json:JSON.stringify(p.state[k])}));demand(cached.every(x=>x.value),'missing preparation');
 const nestedJaw={value:p.state.jawEar159.faceNeck,json:JSON.stringify(p.state.jawEar159.faceNeck)};
 for(const[kind,list]of[['geometry',geometries],['material',materials],['texture',textures]])for(const resource of list){const f=()=>disposals.push(kind+':'+resource.name);resource.addEventListener('dispose',f);listeners.push([resource,f]);}
 const hair=p.model.getObjectByName('Original reference-directed chestnut layered groom'),ranges=hair.userData.rearFlow166.ranges;
 demand(ranges.mass.length===106&&ranges.detail.length===128,'range count');
 const rangeFor=m=>m.name==='Overlapping layered S-wave hair around front back and shoulders'?ranges.mass:m.name==='Independent fine crown lengths and silhouette strands'?ranges.detail:null;
 async function complement(a,ranges){
  const sorted=ranges.slice().sort((a,b)=>a.start-b.start),owned=sorted.reduce((n,r)=>n+r.count,0),copy=new a.array.constructor((a.count-owned)*a.itemSize);let from=0,to=0;
  for(const r of sorted){demand(r.start>=from&&r.start+r.count<=a.count,'overlapping/outside range');const chunk=a.array.subarray(from*a.itemSize,r.start*a.itemSize);copy.set(chunk,to);to+=chunk.length;from=r.start+r.count;}
  const last=a.array.subarray(from*a.itemSize);copy.set(last,to);to+=last.length;demand(to===copy.length,'complement inventory');return{values:copy.length,sha256:await digest(copy)};
 }
 async function capture(){
  const attributeRows=[],complements=[];let nonfinite=0,bytes=0,triangles=0;
  for(const r of attrs){const a=r.a;bytes+=a.array.byteLength;for(const x of a.array)if(!Number.isFinite(x))nonfinite++;const sha256=await digest(a.array),logical=r.key==='index'?await digest(a.array instanceof Uint32Array?a.array:Uint32Array.from(a.array)):null;
   attributeRows.push({label:r.label,key:r.key,type:a.array.constructor.name,bytes:a.array.byteLength,values:a.array.length,version:a.version,sha256,indexLogicalSHA256:logical,itemSize:a.itemSize,count:a.count,normalized:a.normalized});
   const ranges=rangeFor(r.mesh);if(ranges&&['position','normal'].includes(r.key))complements.push({label:r.label,key:r.key,...await complement(a,ranges)});
   if(r.key==='index')triangles+=a.count/3;
  }
  const appearance={materials:[],textures:[]};
  for(const m of materials)appearance.materials.push({physical:physical(m),metadata:JSON.stringify(m.userData),maps:Object.fromEntries(Object.entries(mapBindings(m)).map(([k,t])=>[k,textures.indexOf(t)]))});
  for(const t of textures)appearance.textures.push({size:[t.image.width,t.image.height],sampler:sampler(t),metadata:JSON.stringify(t.userData),sha256:await digest(pixels(t))});
  const meshRows=objects.map(o=>({label:o.label,geometry:geometries.indexOf(o.geometry),materials:o.slots.map(m=>materials.indexOf(m)),transform:transform(o.mesh),visible:o.mesh.visible,castShadow:o.mesh.castShadow,receiveShadow:o.mesh.receiveShadow,renderOrder:o.mesh.renderOrder,metadata:JSON.stringify({userData:o.geometry.userData,groups:o.geometry.groups,drawRange:o.geometry.drawRange,attributes:Object.keys(o.geometry.attributes)})}));
  const nodeRows=nodes.map(r=>({name:r.node.name,parent:nodes.findIndex(x=>x.node===r.node.parent),transform:transform(r.node),visible:r.node.visible}));
  return{attributes:attributeRows,appearance,meshes:meshRows,nodes:nodeRows,complements,nonfinite,geometryBytes:bytes,triangles,hairTriangles:hair.userData.triangles,cachedPreparations:cached.map(r=>({key:r.key,json:JSON.stringify(p.state[r.key])})),nestedJaw:JSON.stringify(p.state.jawEar159.faceNeck)};
 }
 function check(){
  const failures=[];
  for(const r of nodes)if(r.node.parent!==r.parent||transform(r.node)!==r.transform||r.node.visible!==r.visible)failures.push('node:'+r.node.name);
  for(const o of objects)if(o.mesh.geometry!==o.geometry||o.mesh.material!==o.material||o.slots.some((m,i)=>m!==(Array.isArray(o.mesh.material)?o.mesh.material[i]:o.mesh.material))||o.mesh.castShadow!==o.castShadow||o.mesh.receiveShadow!==o.receiveShadow||o.mesh.renderOrder!==o.renderOrder||JSON.stringify({userData:o.geometry.userData,groups:o.geometry.groups,drawRange:o.geometry.drawRange,attributes:Object.keys(o.geometry.attributes)})!==o.metadata)failures.push('binding:'+o.label);
  for(const r of attrs){const a=r.key==='index'?r.g.index:r.g.attributes[r.key];if(a!==r.a||a.array!==r.array||a.version!==r.version||a.itemSize!==r.itemSize||a.count!==r.count||a.normalized!==r.normalized||a.usage!==r.usage||a.gpuType!==r.gpuType)failures.push('attribute:'+r.label+'/'+r.key);}
  for(const r of materialState)if(physical(r.m)!==r.physical||JSON.stringify(r.m.userData)!==r.metadata||Object.entries(r.maps).some(([k,t])=>r.m[k]!==t))failures.push('material:'+r.m.name);
  for(const r of textureState)if(r.t.source!==r.source||r.t.image!==r.image||r.t.image?.data!==r.data||sampler(r.t)!==r.sampler||JSON.stringify(r.t.userData)!==r.metadata)failures.push('texture:'+r.t.name);
  for(const r of cached)if(p.state[r.key]!==r.value||JSON.stringify(p.state[r.key])!==r.json)failures.push('preparation:'+r.key);
  if(p.state.jawEar159.faceNeck!==nestedJaw.value||JSON.stringify(p.state.jawEar159.faceNeck)!==nestedJaw.json)failures.push('nested155');
  return{failures,disposals:disposals.slice(),attributes:attrs.length,meshes:objects.length,cachedPreparations:cached.length+1};
 }
 function release(){const state=check(),removed=listeners.length;for(const[r,f]of listeners)r.removeEventListener('dispose',f);listeners.length=objects.length=nodes.length=attrs.length=materials.length=textures.length=geometries.length=materialState.length=textureState.length=cached.length=0;return{...state,removedListeners:removed,scope:'Probe references released; no model resource disposed by this read-only study.'};}
 return{capture,check,release};
}
