import {BufferAttribute,BufferGeometry,Mesh} from 'three';
import {CHIN162_LOFT,emitChinBand162} from './chin162-loft.js';

const applications=new WeakMap(),VERSION=CHIN162_LOFT.version;
const demand=(v,m)=>{if(!v)throw Error('162 '+m);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const bytes=g=>entries(g).reduce((n,[,a])=>n+a.array.byteLength,0);
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,privateGeometryCount:0,privateAttributeBytes:0,retainedSourceGeometryReferences:0,addedMeshes:0,addedTextures:0,perFrameWork:0,elapsedMs:0});
export const CHIN_JUNCTION162_SPEC=Object.freeze({...CHIN162_LOFT,targets:['continuous-face','neck-smooth-anatomical-surface'],
  materials:'Actual existing front/rear face slots and actual neck material; all original image1 maps and physical values remain unchanged.',
  ownership:'Remove face bands below row24 and neck bands above row32. Rebuild one connected annulus, including the existing neck row36-to32 continuation.',
  qualification:'Coarse original topology repair. No155/159 continuous-map certificate applies to its new emitted triangles or anatomy.'});
function frame(mesh){
  const a=mesh.matrixWorld.elements,det=mesh.matrixWorld.determinant();
  demand(Number.isFinite(det)&&det>1e-12&&a.every(Number.isFinite)&&Math.max(Math.abs(a[3]),Math.abs(a[7]),Math.abs(a[11]),Math.abs(a[15]-1))<1e-12,'requires finite orientation-preserving affine frames.');
  return{frame:a.slice(),inverse:mesh.matrixWorld.clone().invert().elements.slice()};
}
function gather(model){
  demand(model?.isObject3D,'requires the actual prepared model.');model.updateWorldMatrix(true,true);
  const head=model.getObjectByName('anatomical-head'),face=model.getObjectByName('continuous-face'),neck=model.getObjectByName('neck-smooth-anatomical-surface');
  demand(head&&face?.isMesh&&neck?.isMesh,'requires both original selected surfaces.');
  demand(face.geometry.userData.jawSilhouette155?.version==='jaw-silhouette-155'&&neck.geometry.userData.jawSilhouette155?.version==='jaw-silhouette-155','must run after the unchanged159 face/neck field.');
  demand(face.geometry.getAttribute('position').count===110871&&neck.geometry.getAttribute('position').count===3645,'source grid inventory changed.');
  demand(Array.isArray(face.material)&&face.material.length===2&&!Array.isArray(neck.material),'requires the two actual face slots and one neck material.');
  demand(face.visible&&neck.visible&&!model.getObjectByName('Connected submental skin junction162'),'requires the original visible surfaces without an existing162 band.');
  const sourceBuffers=new Set(),sourceAttributes=new Set();model.traverse(m=>{if(m.isMesh)for(const[,a]of entries(m.geometry)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}});
  const parts=[];
  for(const [mesh,kind,columns]of [[face,'face',380],[neck,'neck',80]]){
    const geometry=mesh.geometry,p=geometry.attributes.position,n=geometry.attributes.normal;
    demand(!mesh.isSkinnedMesh&&!mesh.isInstancedMesh&&p?.itemSize===3&&n?.itemSize===3&&p.count===n.count,'requires static normal/position geometry.');
    demand(geometry.attributes.uv?.itemSize===2&&geometry.attributes.color?.itemSize===3&&geometry.index,'requires the original UV0/color/index inventory.');
    demand(!geometry.attributes.tangent&&!Object.values(geometry.morphAttributes||{}).some(a=>a.length),'does not author tangent or morph data.');
    for(const[,a]of entries(geometry))demand(!a.isInterleavedBufferAttribute&&ArrayBuffer.isView(a.array),'requires independently cloneable buffers.');
    let owners=0;model.traverse(m=>{if(m.isMesh&&m.geometry===geometry)owners++;});demand(owners===1,'selected geometry has a second owner.');
    parts.push({mesh,geometry,kind,columns,...frame(mesh)});
  }
  return{parts,face,neck,sourceBuffers,sourceAttributes};
}
function privateCut(part,cut,sourceBuffers,sourceAttributes){
  const g=part.geometry.clone();let owned=false;
  try{
    for(const[name,a]of entries(g))demand(!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a),'cut clone retained an original '+name+' buffer.');owned=true;
    g.setIndex(new BufferAttribute(cut.index,1));g.clearGroups();for(const group of cut.groups)g.addGroup(group.start,group.count,group.materialIndex);
    g.userData={...g.userData,chinJunction162:{version:VERSION,role:part.kind+'-retained',faceRow:24,neckRow:32}};
    return g;
  }catch(e){if(owned)g.dispose();throw e;}
}

/** One cached preparation after actual159 and before first renderer upload. */
export function applyChinJunction162(model,{strength=0,retainSourceForQA=false}={}){
  demand(strength===0||strength===1,'is one OFF/ON study only.');demand(typeof retainSourceForQA==='boolean','requires a boolean QA retention option.');
  const old=model&&applications.get(model);if(old){demand(old.strength===strength,'requires release or a fresh model before switching.');return old.metrics;}
  if(!strength)return ZERO;
  const started=performance.now(),input=gather(model),[face,neck]=input.parts;
  const result=emitChinBand162(face,neck,{retainDebug:retainSourceForQA}),staged=[];let bandGeometry,band;
  try{
    staged.push({part:face,original:face.geometry,geometry:privateCut(face,result.faceCut,input.sourceBuffers,input.sourceAttributes)});
    staged.push({part:neck,original:neck.geometry,geometry:privateCut(neck,result.neckCut,input.sourceBuffers,input.sourceAttributes)});
    bandGeometry=new BufferGeometry();for(const[name,size]of [['position',3],['normal',3],['uv',2],['color',3]])bandGeometry.setAttribute(name,new BufferAttribute(result.data[name],size));
    bandGeometry.setIndex(new BufferAttribute(result.data.index,1));for(const group of result.data.groups)bandGeometry.addGroup(group.start,group.count,group.materialIndex);
    bandGeometry.userData={chinJunction162:{version:VERSION,role:'connected-annulus',faceRow:24,neckRow:32,materialJoinNeckRow:36}};
    bandGeometry.computeBoundingBox();bandGeometry.computeBoundingSphere();
    band=new Mesh(bandGeometry,[...input.face.material,input.neck.material]);band.name='Connected submental skin junction162';
    // Share the actual face's parent/local pose, so normal camera/model motion
    // carries the complete junction without a per-frame update or extra shader.
    band.matrix.copy(input.face.matrix);band.matrixAutoUpdate=false;band.matrixWorld.copy(input.face.matrixWorld);
    band.castShadow=input.face.castShadow;band.receiveShadow=input.face.receiveShadow;band.renderOrder=input.face.renderOrder;band.frustumCulled=input.face.frustumCulled;band.layers.mask=input.face.layers.mask;
    for(const[,a]of entries(bandGeometry))demand(!input.sourceBuffers.has(a.array.buffer),'band retained an original buffer.');
  }catch(error){for(const row of staged)row.geometry.dispose();bandGeometry?.dispose();throw error;}
  for(const row of staged)row.part.mesh.geometry=row.geometry;input.face.parent.add(band);
  const metrics={version:VERSION,strength:1,applied:true,privateGeometryCount:3,privateAttributeBytes:staged.reduce((n,r)=>n+bytes(r.geometry),bytes(bandGeometry)),
    retainedSourceGeometryReferences:retainSourceForQA?2:0,retainSourceForQA,addedMeshes:1,addedMaterialObjects:0,addedTextureObjects:0,addedTextureBytes:0,
    selectedSourceDrawGroups:staged.reduce((n,r)=>n+(r.original.groups.length||1),0),bandDrawGroups:3,perFrameWork:0,band:result.metrics,
    netTriangleChange:result.metrics.triangles-result.metrics.retiredFaceTriangles-result.metrics.retiredNeckTriangles,
    temporaryOriginalCPUBytes:retainSourceForQA?staged.reduce((n,r)=>n+bytes(r.original),0):0,elapsedMs:performance.now()-started};
  applications.set(model,{strength,metrics,band,staged:retainSourceForQA?staged:null,construction:retainSourceForQA?result:null});return metrics;
}

/** QA only: no construction/source arrays are retained by default. */
export function getChinJunctionQA162(model){const r=applications.get(model);demand(r?.staged&&r.construction,'temporary QA retention was not requested.');return{band:r.band,staged:r.staged,construction:r.construction};}
export function releaseChinJunction162(model){
  const r=model&&applications.get(model);if(!r)return{released:false,privateGeometriesDisposed:0,privateAttributeBytesReleased:0};
  demand(r.staged,'production162 retains no originals; use a fresh model to undo it.');
  for(const part of r.staged)demand(part.part.mesh.geometry===part.geometry,'release dependent162 edits first.');
  demand(r.band.parent,'band was detached outside its controller.');
  // All original bindings are restored before the first private disposal.
  for(const part of r.staged)part.part.mesh.geometry=part.original;r.band.parent.remove(r.band);
  for(const part of r.staged)part.geometry.dispose();r.band.geometry.dispose();applications.delete(model);
  return{released:true,privateGeometriesDisposed:3,privateAttributeBytesReleased:r.metrics.privateAttributeBytes,sourceBindingsRestored:2,temporaryConstructionReleased:true};
}
