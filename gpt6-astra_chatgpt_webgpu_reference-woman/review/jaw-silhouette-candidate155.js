import config155 from './jaw-silhouette155-config.json' with { type: 'json' };
import {createJawSilhouetteField155} from './jaw-silhouette155-field.js';

// One155 OFF/ON study on the continuous face and upper neck under one common
// field. Materials, atlases, hair, eyes, lips and rendering remain unchanged.
const VERSION='jaw-silhouette-155',applications=new WeakMap();
const MAX_WORLD_DISPLACEMENT=.10,MAX_WORLD_Z_ROUNDOFF=6e-7;
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,privateGeometryCount:0,privateAttributeBytes:0,changedPositions:0,changedNormals:0,perFrameWork:0,elapsedMs:0});
const now=()=>typeof performance==='object'?performance.now():Date.now();

export const JAW_SILHOUETTE155_SPEC=Object.freeze({version:VERSION,strengths:Object.freeze([0,1]),
 scope:Object.freeze(['continuous-face','neck-smooth-anatomical-surface']),fieldKind:config155.fieldKind,contractionGain:config155.contractionGain,centerPhotoX:config155.centerPhotoX,
 displacementWorldUpper:MAX_WORLD_DISPLACEMENT,worldZRoundoffTolerance:MAX_WORLD_Z_ROUNDOFF,
 normalOperation:'World inverse transpose through each actual affine mesh frame; exact zero normals remain zero',
 metadata:'Photo Y and world Z remain fixed. Current lip geometry supplies an exact zero-deformation shield. The common field preserves the continuous head-neck relationship; emitted triangles and appearance are checked separately.'});

function affine(mesh){
 const matrix=mesh.matrixWorld;
 if(!matrix?.isMatrix4&&typeof matrix?.determinant!=='function')throw Error('155 requires a current mesh matrixWorld.');
 const determinant=matrix.determinant(),a=matrix.elements.slice();
 if(!Number.isFinite(determinant)||Math.abs(determinant)<1e-12||a.some(v=>!Number.isFinite(v))||Math.max(Math.abs(a[3]),Math.abs(a[7]),Math.abs(a[11]),Math.abs(a[15]-1))>1e-12)
  throw Error('155 requires invertible finite affine mesh frames.');
 return{a,inverse:matrix.clone().invert().elements.slice()};
}

function collect(model){
 if(!model?.isObject3D)throw Error('155 requires the complete prepared model.');
 const head=model.getObjectByName('anatomical-head'),face=model.getObjectByName('continuous-face'),neck=model.getObjectByName('neck-smooth-anatomical-surface');
 if(!head||!face||!neck||face.geometry.userData.eyeContour147?.version!=='eye-contour-147')throw Error('155 requires the selected147 face and actual neck.');
 if(head.userData?.portraitProportions?.factor!==.94)throw Error('155 requires accepted proportions.');
 const lips=['upper-lip','lower-lip'].map(name=>head.getObjectByName(name));
 if(lips.some(m=>!m?.isMesh)||lips[0].geometry.userData.upperLipRelief140?.version!=='upper-lip-relief-140')throw Error('155 requires the complete selected140 lips.');
 model.updateWorldMatrix(true,true);
 const {a,b,worldOrigin,photoOrigin}=config155.frame,mouthBox=[Infinity,-Infinity,Infinity,-Infinity];
 for(const mesh of lips){const p=mesh.geometry.attributes.position,m=mesh.matrixWorld.elements;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),wx=m[0]*x+m[4]*y+m[8]*z+m[12],wy=m[1]*x+m[5]*y+m[9]*z+m[13],px=photoOrigin[0]+a*(wx-worldOrigin[0])+b*(wy-worldOrigin[1]),py=photoOrigin[1]+b*(wx-worldOrigin[0])-a*(wy-worldOrigin[1]);mouthBox[0]=Math.min(mouthBox[0],px);mouthBox[1]=Math.max(mouthBox[1],px);mouthBox[2]=Math.min(mouthBox[2],py);mouthBox[3]=Math.max(mouthBox[3],py);}
 }
 if(mouthBox.some(x=>!Number.isFinite(x)))throw Error('155 mouth bounds are invalid.');
 const sourceBuffers=new Set(),records=[];
 for(const mesh of [face,neck]){
  const original=mesh.geometry,p=original.getAttribute('position'),n=original.getAttribute('normal');
  if(!p||!n||p.itemSize!==3||n.itemSize!==3||p.count!==n.count||mesh.isSkinnedMesh||mesh.isInstancedMesh||p.normalized||n.normalized||p.isInterleavedBufferAttribute||n.isInterleavedBufferAttribute||!(p.array instanceof Float32Array)||!(n.array instanceof Float32Array))throw Error('155 requires explicit static Float32 geometry.');
  if(original.getAttribute('tangent')||Object.values(original.morphAttributes||{}).some(v=>v.length))throw Error('155 does not modify tangent or morph data.');
  let owners=0;model.traverse(m=>{if(m.isMesh&&m.geometry===original)owners++;});if(owners!==1)throw Error('155 selected geometry has an unexpected shared owner.');
  for(const attribute of [...Object.values(original.attributes),original.index].filter(Boolean)){if(attribute.isInterleavedBufferAttribute||!ArrayBuffer.isView(attribute.array))throw Error('155 attributes are not privately cloneable.');sourceBuffers.add(attribute.array.buffer);}
  records.push({original,p,n,...affine(mesh),meshes:[mesh],name:mesh.name});
 }
 return{records,sourceBuffers,meshCount:2,originalGeometries:2,mouthBox};
}

export function getJawSilhouetteField155(model){const {mouthBox}=collect(model);return createJawSilhouetteField155(config155,mouthBox);}

function privateClone(original,sourceBuffers){
 let geometry,whollyPrivate=false;
 try{
  geometry=original.clone();
  if(geometry===original)throw Error('155 clone returned the original geometry.');
  for(const [name,attribute]of[...Object.entries(geometry.attributes),['index',geometry.index]].filter(([,a])=>a)){
   if(sourceBuffers.has(attribute.array.buffer))throw Error('155 clone retained a shared source buffer: '+name);
  }
  whollyPrivate=true;
  geometry.userData={...original.userData,jawSilhouette155:{version:VERSION,strength:1}};
  return geometry;
 }catch(error){if(whollyPrivate)geometry.dispose();throw error;}
}

/** Apply once after147, inside the existing cached preparation promise. */
export function applyJawSilhouette155(model,{strength=0,retainSourceForQA=false}={}){
 if(strength!==0&&strength!==1)throw new RangeError('155 is the approved OFF/ON study only.');
 if(typeof retainSourceForQA!=='boolean')throw new TypeError('155 source retention must be an explicit QA boolean.');
 const previous=model&&applications.get(model);
 if(previous){if(previous.strength!==strength)throw Error('155 needs release or a fresh model before switching strength.');return previous.metrics;}
 if(!strength)return ZERO;
 const started=now(),{records,sourceBuffers,meshCount,originalGeometries,mouthBox}=collect(model),f=createJawSilhouetteField155(config155,mouthBox),staged=[];
 const metrics={version:VERSION,strength,applied:true,selectedMeshes:meshCount,mouthBox,protectedMouthBox:f.protectedBox,originalGeometries,privateGeometryCount:0,privateAttributeBytes:0,
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
    if(!Number.isFinite(x+y+z+nx+ny+nz))throw Error('155 encountered nonfinite source data on '+record.name);
    const wx=a[0]*x+a[4]*y+a[8]*z+a[12],wy=a[1]*x+a[5]*y+a[9]*z+a[13],wz=a[2]*x+a[6]*y+a[10]*z+a[14],s=f.world(wx,wy,wz);
    if(!s.active){row.exactOutside++;continue;}
    if(!geometry){geometry=privateClone(record.original,sourceBuffers);staged.push({...record,geometry});pp=geometry.getAttribute('position');nn=geometry.getAttribute('normal');}
    row.active++;const [dx,dy]=s.delta,j=s.jacobian,det=s.determinant;
    if(!(det>.02)||Math.hypot(dx,dy)>MAX_WORLD_DISPLACEMENT)throw Error('155 exceeded its candidate field bound; independent grid and triangle checks are required.');
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
    if(!Number.isFinite(length)||length<1e-12)throw Error('155 normal transport became singular.');
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
   throw Error('155 exceeded its Float32 storage/normal tolerance.');
  if(!staged.length)throw Error('155 found no active model geometry in the accepted world frame.');
 }catch(error){for(const record of staged)record.geometry.dispose();throw error;}
 for(const record of staged)for(const mesh of record.meshes)mesh.geometry=record.geometry;
 // Production preparation runs before the first renderer upload. Its old CPU
 // arrays need not be kept by this helper. The native audit explicitly opts in
 // to temporary source retention, restores it, then releases the QA records.
 metrics.retainedSourceGeometryReferences=retainSourceForQA?new Set(staged.map(r=>r.original)).size:0;
 metrics.elapsedMs=now()-started;applications.set(model,{strength,staged:retainSourceForQA?staged:null,metrics});return metrics;
}

/** Restore references first; dispose only the wholly private buffers. */
export function releaseJawSilhouette155(model){
 const record=model&&applications.get(model);
 if(!record)return{released:false,privateGeometriesDisposed:0,privateAttributeBytesReleased:0};
 if(!record.staged)throw Error('155 production application does not retain source geometry; use a fresh model to undo it.');
 for(const part of record.staged)for(const mesh of part.meshes)if(mesh.geometry!==part.geometry)throw Error('155 release requires its dependent geometry edits to be released first.');
 for(const part of record.staged)for(const mesh of part.meshes)mesh.geometry=part.original;
 applications.delete(model);for(const part of record.staged)part.geometry.dispose();
 return{released:true,privateGeometriesDisposed:record.staged.length,privateAttributeBytesReleased:record.metrics.privateAttributeBytes};
}
