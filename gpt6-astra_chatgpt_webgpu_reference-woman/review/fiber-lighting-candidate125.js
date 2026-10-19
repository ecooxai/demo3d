import * as THREE from 'three';
import {MeshPhysicalNodeMaterial} from 'three/webgpu';
import {bitangentView,normalView,positionViewDirection,diffuseColor,float,vec3} from 'three/tsl';

// Original review-only fiber response. Two bounded, shifted longitudinal
// reflection lobes replace part of the direct surface specular response.
// This is an artistic fiber approximation, not a measured hair scattering model.
// Source maps, alpha coverage, geometry, indirect light and material parameters
// remain unchanged. Standard glTF/WebGL appearance is not certified by this study.
const active=new WeakMap();
const names=new Set(['Continuous parted crown with longitudinal fiber flow','Overlapping layered S-wave hair around front back and shoulders']);

function evaluateFiberDirect125(standardDirect,strength,input,builder){
  const {lightDirection,lightColor,reflectedLight}=input;
  const previous=reflectedLight.directSpecular.toVar();
  standardDirect(input,builder);
  const standardIncrement=reflectedLight.directSpecular.sub(previous).toVar();
  // UV0 V follows root-to-end flow on both accepted crown sheets and lock tubes.
  // Use its derivative frame and remove the shading-normal component. The
  // bounded fallback handles degenerate pole derivatives without division by0.
  const raw=bitangentView.sub(normalView.mul(bitangentView.dot(normalView)));
  const axis=normalView.y.abs().lessThan(.9).select(vec3(0,1,0),vec3(1,0,0));
  const fallback=normalView.cross(axis).normalize();
  const squared=raw.dot(raw);
  const tangent=squared.greaterThan(1e-10).select(raw.mul(squared.max(1e-10).inverseSqrt()),fallback).toVar();
  const half=lightDirection.add(positionViewDirection).normalize().toVar();
  const shiftedA=tangent.add(normalView.mul(-.075)).normalize();
  const shiftedB=tangent.add(normalView.mul(.13)).normalize();
  const dotA=shiftedA.dot(half),dotB=shiftedB.dot(half);
  const lobeA=float(1).sub(dotA.mul(dotA)).max(0).pow(38);
  const lobeB=float(1).sub(dotB.mul(dotB)).max(0).pow(10);
  const facing=normalView.dot(lightDirection).max(0);
  // A narrow neutral surface reflection and a broader pigment-tinted reflection.
  // Neither lobe exceeds its explicit coefficient; no procedural pigment is added.
  const tint=diffuseColor.rgb.max(vec3(0)).sqrt();
  const fiber=vec3(.055,.058,.062).mul(lobeA).add(tint.mul(.12).mul(lobeB));
  const target=lightColor.mul(facing).mul(fiber);
  reflectedLight.directSpecular.assign(previous.add(standardIncrement.mul(1-strength)).add(target.mul(strength)));
 }

class FiberNodeMaterial125 extends MeshPhysicalNodeMaterial{
 constructor(){super();this.fiberStrength125=0;}
 setupLightingModel(){
  // Keep the renderer's bundled TSL instance. Importing its source-only lighting
  // class alongside three/webgpu creates a second node registry and invalid WGSL.
  const lighting=super.setupLightingModel(),strength=this.fiberStrength125;
  if(strength>0){const originalDirect=lighting.direct.bind(lighting);lighting.direct=(input,builder)=>evaluateFiberDirect125(originalDirect,strength,input,builder);}
  return lighting;
 }
}

export function applyFiberLighting125(hair,{mode=0}={}){
 if(![0,1,2,3].includes(mode))throw new Error('125 mode must be0/1/2/3.');
 if(active.has(hair))throw new Error('125 needs a fresh groom for each comparison.');
 const start=performance.now(),records=[];
 if(mode===0)return{mode,applied:false,strength:0,ownedMaterials:0,retainedTextureBytes:0,constructionMs:0};
 const strength=mode===1?0:mode===2?.5:1;
 try{
  hair.traverse(mesh=>{
   if(!mesh.isMesh||!names.has(mesh.name))return;
   if(Array.isArray(mesh.material)||!mesh.material.isMeshPhysicalMaterial)throw new Error('125 expects one physical material on each target.');
   const original=mesh.material,material=new FiberNodeMaterial125();
   // Copy regular physical properties without overwriting the new node slots
   // with undefined fields from a non-node source material.
   THREE.MeshPhysicalMaterial.prototype.copy.call(material,original);
   material.fiberStrength125=strength;material.name=original.name+' / fiber response125';
   material.needsUpdate=true;
   const geometry=mesh.geometry,attributes=Object.entries({...geometry.attributes,index:geometry.index}).map(([key,attribute])=>({key,attribute,array:attribute.array,version:attribute.version}));
   records.push({mesh,original,material,geometry,attributes});mesh.material=material;
  });
  if(records.length!==2)throw new Error('125 expected exactly the accepted crown and MASS.');
 }catch(error){for(const r of records){r.mesh.material=r.original;r.material.dispose();}throw error;}
 active.set(hair,records);
 return{mode,applied:true,strength,ownedMaterials:records.length,retainedTextureBytes:0,constructionMs:performance.now()-start,targets:records.map(r=>({name:r.mesh.name,sourceType:r.original.type,candidateType:r.material.type,mapShared:r.material.map===r.original.map,alphaMapShared:r.material.alphaMap===r.original.alphaMap,normalMapShared:r.material.normalMap===r.original.normalMap,alphaTest:r.material.alphaTest,roughness:r.material.roughness,specularIntensity:r.material.specularIntensity,anisotropy:r.material.anisotropy}))};
}

export function releaseFiberLighting125(hair){
 const records=active.get(hair);if(!records)return{released:false};
 for(const r of records){
  if(r.mesh.geometry!==r.geometry)throw new Error('125 source geometry reference changed.');
  for(const a of r.attributes){
   const current=a.key==='index'?r.geometry.index:r.geometry.getAttribute(a.key);
   if(current!==a.attribute||current.version!==a.version)throw new Error('125 source attribute changed.');
   if(current.array!==a.array){
    // Installed nativeWebGPU widens Uint16 indices on their first upload.
    const exactFirstUpload=a.key==='index'&&a.array instanceof Uint16Array&&current.array instanceof Uint32Array&&a.version===0&&current.array.length===a.array.length&&current.array.every((v,i)=>v===a.array[i]);
    if(!exactFirstUpload)throw new Error('125 source buffer changed.');
   }
  }
  r.mesh.material=r.original;r.material.dispose();
 }
 active.delete(hair);return{released:true,restoredMaterials:records.length,geometryAndSourceAttributesPreserved:true,borrowedTexturesDisposed:false};
}
