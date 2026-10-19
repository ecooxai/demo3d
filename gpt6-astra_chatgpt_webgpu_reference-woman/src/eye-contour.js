import config147 from './eye-contour-config.json' with { type: 'json' };
import {createEyeContourField147} from './eye-contour-field.js';

// One original-geometry OFF/ON study. This module changes only private static
// head geometry and never touches materials, atlases, hair or render methods.
const VERSION='eye-contour-147',applications=new WeakMap();
const MAX_WORLD_DISPLACEMENT=.073,MAX_WORLD_Z_ROUNDOFF=6e-7;
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,privateGeometryCount:0,privateAttributeBytes:0,changedPositions:0,changedNormals:0,perFrameWork:0,elapsedMs:0});
let cachedField;
const field=()=>cachedField??=createEyeContourField147(config147);
const now=()=>typeof performance==='object'?performance.now():Date.now();

export const EYE_CONTOUR147_SPEC=Object.freeze({version:VERSION,strengths:Object.freeze([0,1]),scope:'anatomical-head',
 radiusPhotoPixels:80,depthGateWorldZ:Object.freeze([.10,.35]),lowerFadePhotoY:Object.freeze([560,600]),
 displacementWorldUpper:MAX_WORLD_DISPLACEMENT,worldZRoundoffTolerance:MAX_WORLD_Z_ROUNDOFF,
 photoSliceDisplacementLipschitzUpper:.852369167436639,
 normalOperation:'World inverse transpose through each actual affine mesh frame; exact zero normals remain zero',
 metadata:'The continuous map leaves world Z fixed; Float32 storage roundoff is measured separately.'});

function affine(mesh){
 const matrix=mesh.matrixWorld;
 if(!matrix?.isMatrix4&&typeof matrix?.determinant!=='function')throw Error('147 requires a current mesh matrixWorld.');
 const determinant=matrix.determinant(),a=matrix.elements.slice();
 if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-12||a.some(v=>!Number.isFinite(v))||Math.max(Math.abs(a[3]),Math.abs(a[7]),Math.abs(a[11]),Math.abs(a[15]-1))>1e-12)
  throw Error('147 requires invertible finite affine mesh frames.');
 return{a,inverse:matrix.clone().invert().elements.slice()};
}

function collect(head){
 if(!head?.isObject3D||head.name!=='anatomical-head')throw Error('147 requires the anatomical-head group.');
 if(head.userData?.portraitProportions?.factor!==.94||head.userData?.lipThicknessRefinement?.strength!==.06)
  throw Error('147 requires the accepted proportions and lip refinement.');
 const lips=[];head.traverse(o=>{if(o.isMesh&&o.name==='upper-lip')lips.push(o);});
 const metadata=lips[0]?.geometry.userData?.upperLipRelief140;
 if(lips.length!==1||metadata?.version!=='upper-lip-relief-140'||metadata.blend!==.5||metadata.endFraction!==.875)
  throw Error('147 must run after the accepted140 upper-lip geometry.');
 head.updateWorldMatrix(true,true);
 const byGeometry=new Map(),records=[],sourceBuffers=new Set();let meshCount=0;
 head.traverse(mesh=>{
  if(!mesh.isMesh)return;meshCount++;
  const original=mesh.geometry,p=original?.getAttribute('position'),n=original?.getAttribute('normal');
  if(!p||!n||p.itemSize!==3||n.itemSize!==3||p.count!==n.count||mesh.isSkinnedMesh||mesh.isInstancedMesh||
    p.normalized||n.normalized||p.isInterleavedBufferAttribute||n.isInterleavedBufferAttribute||
    !(p.array instanceof Float32Array)||!(n.array instanceof Float32Array))throw Error('147 needs explicit static Float32 position/normal data on '+mesh.name);
  if(original.getAttribute('tangent')||Object.values(original.morphAttributes||{}).some(a=>a.length))throw Error('147 does not modify tangent or morph-target data.');
  for(const attribute of[...Object.values(original.attributes),original.index].filter(Boolean)){
   if(attribute.isInterleavedBufferAttribute||!ArrayBuffer.isView(attribute.array))throw Error('147 requires privately cloneable explicit attributes.');
   sourceBuffers.add(attribute.array.buffer);
  }
  const frame=affine(mesh),key=JSON.stringify(frame.a);let frames=byGeometry.get(original);
  if(!frames)byGeometry.set(original,frames=new Map());
  let record=frames.get(key);
  if(record){record.meshes.push(mesh);return;}
  record={original,p,n,...frame,meshes:[mesh],name:mesh.name};frames.set(key,record);records.push(record);
 });
 return{records,sourceBuffers,meshCount,originalGeometries:byGeometry.size};
}

function privateClone(original,sourceBuffers){
 let geometry,whollyPrivate=false;
 try{
  geometry=original.clone();
  if(geometry===original)throw Error('147 clone returned the original geometry.');
  for(const [name,attribute]of[...Object.entries(geometry.attributes),['index',geometry.index]].filter(([,a])=>a)){
   if(sourceBuffers.has(attribute.array.buffer))throw Error('147 clone retained a shared source buffer: '+name);
  }
  whollyPrivate=true;
  geometry.userData={...original.userData,eyeContour147:{version:VERSION,strength:1}};
  return geometry;
 }catch(error){if(whollyPrivate)geometry.dispose();throw error;}
}

/** Apply once after140, inside the existing cached preparation promise. */
export function applyEyeContour147(head,{strength=0,retainSourceForQA=false}={}){
 if(strength!==0&&strength!==1)throw new RangeError('147 is the approved OFF/ON study only.');
 if(typeof retainSourceForQA!=='boolean')throw new TypeError('147 source retention must be an explicit QA boolean.');
 const previous=head&&applications.get(head);
 if(previous){if(previous.strength!==strength)throw Error('147 needs release or a fresh head before switching strength.');return previous.metrics;}
 if(!strength)return ZERO;
 const started=now(),f=field(),{records,sourceBuffers,meshCount,originalGeometries}=collect(head),staged=[];
 const metrics={version:VERSION,strength,applied:true,headMeshes:meshCount,originalGeometries,privateGeometryCount:0,privateAttributeBytes:0,
  changedPositions:0,changedNormals:0,activeVertices:0,exactOutsideVertices:0,zeroNormalsPreserved:0,
  maximumWorldDisplacement:0,maximumWorldZRoundoff:0,maximumWorldFieldRoundoff:0,maximumNormalLengthError:0,
  minimumSampledWorldJacobian:Infinity,maximumSampledWorldJacobian:-Infinity,sourceSharedGeometryInstances:meshCount-records.length,
  perFrameWork:0,addedDraws:0,addedTextureBytes:0,retainSourceForQA,retainedSourceGeometryReferences:0,parts:[]};
 try{
  for(const record of records){
   const {p,n,a,inverse}=record,row={name:record.name,instances:record.meshes.length,vertices:p.count,active:0,changedPositions:0,changedNormals:0,exactOutside:0,zeroNormalsPreserved:0};
   let geometry=null,pp=null,nn=null;
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
    if(!Number.isFinite(x+y+z+nx+ny+nz))throw Error('147 encountered nonfinite source data on '+record.name);
    const wx=a[0]*x+a[4]*y+a[8]*z+a[12],wy=a[1]*x+a[5]*y+a[9]*z+a[13],wz=a[2]*x+a[6]*y+a[10]*z+a[14],s=f.world(wx,wy,wz);
    if(!s.active){row.exactOutside++;continue;}
    if(!geometry){geometry=privateClone(record.original,sourceBuffers);staged.push({...record,geometry});pp=geometry.getAttribute('position');nn=geometry.getAttribute('normal');}
    row.active++;const [dx,dy]=s.delta,j=s.jacobian,det=s.determinant;
    if(!(det>.02)||Math.hypot(dx,dy)>MAX_WORLD_DISPLACEMENT)throw Error('147 exceeded its certified field bound.');
    metrics.minimumSampledWorldJacobian=Math.min(metrics.minimumSampledWorldJacobian,det);metrics.maximumSampledWorldJacobian=Math.max(metrics.maximumSampledWorldJacobian,det);
    // Add only the inverse-transformed displacement. This avoids an unnecessary
    // world/local position roundtrip and preserves the exact source outside support.
    pp.setXYZ(i,x+inverse[0]*dx+inverse[4]*dy,y+inverse[1]*dx+inverse[5]*dy,z+inverse[2]*dx+inverse[6]*dy);
    const qx=pp.getX(i),qy=pp.getY(i),qz=pp.getZ(i),lx=qx-x,ly=qy-y,lz=qz-z,
     ax=a[0]*lx+a[4]*ly+a[8]*lz,ay=a[1]*lx+a[5]*ly+a[9]*lz,az=a[2]*lx+a[6]*ly+a[10]*lz;
    metrics.maximumWorldDisplacement=Math.max(metrics.maximumWorldDisplacement,Math.hypot(ax,ay,az));
    metrics.maximumWorldZRoundoff=Math.max(metrics.maximumWorldZRoundoff,Math.abs(az));
    metrics.maximumWorldFieldRoundoff=Math.max(metrics.maximumWorldFieldRoundoff,Math.hypot(ax-dx,ay-dy,az));
    if(qx!==x||qy!==y||qz!==z)row.changedPositions++;
    if(nx===0&&ny===0&&nz===0){row.zeroNormalsPreserved++;continue;}
    // n_world=A^-T*n_local, followed by J^-T. J=[a b c;d e f;0 0 1].
    const ux=inverse[0]*nx+inverse[1]*ny+inverse[2]*nz,uy=inverse[4]*nx+inverse[5]*ny+inverse[6]*nz,uz=inverse[8]*nx+inverse[9]*ny+inverse[10]*nz,
     vx=(j[4]*ux-j[3]*uy)/det,vy=(-j[1]*ux+j[0]*uy)/det,vz=uz-j[2]*vx-j[5]*vy,
     tx=a[0]*vx+a[1]*vy+a[2]*vz,ty=a[4]*vx+a[5]*vy+a[6]*vz,tz=a[8]*vx+a[9]*vy+a[10]*vz,length=Math.hypot(tx,ty,tz);
    if(!Number.isFinite(length)||length<1e-12)throw Error('147 normal transport became singular.');
    nn.setXYZ(i,tx/length,ty/length,tz/length);
    metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,Math.abs(Math.hypot(nn.getX(i),nn.getY(i),nn.getZ(i))-1));
    if(nn.getX(i)!==nx||nn.getY(i)!==ny||nn.getZ(i)!==nz)row.changedNormals++;
   }
   if(geometry){
    pp.needsUpdate=true;nn.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();
    metrics.privateGeometryCount++;metrics.privateAttributeBytes+=Object.values(geometry.attributes).reduce((sum,q)=>sum+q.array.byteLength,geometry.index?.array.byteLength||0);
   }
   metrics.changedPositions+=row.changedPositions;metrics.changedNormals+=row.changedNormals;metrics.activeVertices+=row.active;
   metrics.exactOutsideVertices+=row.exactOutside;metrics.zeroNormalsPreserved+=row.zeroNormalsPreserved;metrics.parts.push(row);
  }
  if(metrics.maximumWorldZRoundoff>MAX_WORLD_Z_ROUNDOFF||metrics.maximumWorldFieldRoundoff>1e-6||metrics.maximumNormalLengthError>2e-6)
   throw Error('147 exceeded its Float32 storage/normal tolerance.');
  if(!staged.length)throw Error('147 found no active head geometry in the accepted world frame.');
 }catch(error){for(const record of staged)record.geometry.dispose();throw error;}
 for(const record of staged)for(const mesh of record.meshes)mesh.geometry=record.geometry;
 // Production preparation runs before the first renderer upload. Its old CPU
 // arrays need not be kept by this helper. The native audit explicitly opts in
 // to temporary source retention, restores it, then releases the QA records.
 metrics.retainedSourceGeometryReferences=retainSourceForQA?new Set(staged.map(r=>r.original)).size:0;
 metrics.elapsedMs=now()-started;applications.set(head,{strength,staged:retainSourceForQA?staged:null,metrics});return metrics;
}

/** Restore references first; dispose only the wholly private buffers. */
export function releaseEyeContour147(head){
 const record=head&&applications.get(head);
 if(!record)return{released:false,privateGeometriesDisposed:0,privateAttributeBytesReleased:0};
 if(!record.staged)throw Error('147 production application does not retain source geometry; use a fresh head to undo it.');
 for(const part of record.staged)for(const mesh of part.meshes)if(mesh.geometry!==part.geometry)throw Error('147 release requires its dependent geometry edits to be released first.');
 for(const part of record.staged)for(const mesh of part.meshes)mesh.geometry=part.original;
 applications.delete(head);for(const part of record.staged)part.geometry.dispose();
 return{released:true,privateGeometriesDisposed:record.staged.length,privateAttributeBytesReleased:record.metrics.privateAttributeBytes};
}
