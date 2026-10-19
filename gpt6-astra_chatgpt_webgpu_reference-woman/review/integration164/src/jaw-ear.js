import {applyJawSilhouette155,releaseJawSilhouette155,getJawSilhouetteField155} from './jaw-silhouette.js';

//159 composes the unchanged155 field with the actual prepared ear shells.
// The frozen155 helper remains the sole author of face/neck replacement data.
const VERSION='common-jaw-ear-field-159',applications=new WeakMap();
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,privateGeometryCount:0,privateAttributeBytes:0,retainedSourceGeometryReferences:0,perFrameWork:0,addedDraws:0,addedTextureBytes:0,elapsedMs:0});
const demand=(v,m)=>{if(!v)throw Error('159 '+m);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
export const JAW_EAR159_SPEC=Object.freeze({version:VERSION,strengths:Object.freeze([0,1]),field:'Exact imported155 field/config and actual unchanged140 mouth bounds',
  scope:Object.freeze(['continuous-face','neck-smooth-anatomical-surface','left-ear/ear-continuous-anatomical-shell','right-ear/ear-continuous-anatomical-shell']),
  maximumWorldDisplacement:.10,maximumWorldZRoundoff:6e-7,
  normalOperation:'Actual post115/147 authored normals transported by the same world inverse transpose as155, through each actual mesh frame',
  qualification:'The common injective map preserves the continuously mapped relationship. Linear emitted triangles and contact with fixed hair require separate native checks.'});

function collectEars(model){
  demand(model?.isObject3D,'requires the complete prepared model.');model.updateWorldMatrix(true,true);
  const head=model.getObjectByName('anatomical-head'),records=[],sourceBuffers=new Set(),sourceAttributes=new Set();
  demand(head,'requires the prepared anatomical head.');
  model.traverse(m=>{if(m.isMesh)for(const[,a]of entries(m.geometry)){sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);}});
  for(const side of['left-ear','right-ear']){
    const group=head.getObjectByName(side),shells=[];group?.traverse(m=>{if(m.isMesh&&m.name==='ear-continuous-anatomical-shell')shells.push(m);});
    demand(shells.length===1,'requires one actual shell under '+side+'.');const mesh=shells[0],original=mesh.geometry,p=original.getAttribute('position'),n=original.getAttribute('normal');
    demand(p?.itemSize===3&&n?.itemSize===3&&p.count===5282&&n.count===p.count&&original.index?.count===31680,'frozen ear inventory changed on '+side+'.');
    demand(!mesh.isSkinnedMesh&&!mesh.isInstancedMesh&&!p.normalized&&!n.normalized&&p.array instanceof Float32Array&&n.array instanceof Float32Array,'requires explicit static Float32 ears.');
    demand(!original.getAttribute('tangent')&&!Object.values(original.morphAttributes||{}).some(v=>v.length),'does not alter morph/tangent data.');
    for(const[,a]of entries(original))demand(!a.isInterleavedBufferAttribute&&ArrayBuffer.isView(a.array),'requires independently cloneable attributes.');
    let owners=0;model.traverse(m=>{if(m.isMesh&&m.geometry===original)owners++;});demand(owners===1,'ear has an unexpected shared geometry owner.');
    const matrix=mesh.matrixWorld,det=matrix.determinant(),a=matrix.elements.slice();
    demand(Number.isFinite(det)&&Math.abs(det)>1e-12&&a.every(Number.isFinite)&&Math.max(Math.abs(a[3]),Math.abs(a[7]),Math.abs(a[11]),Math.abs(a[15]-1))<1e-12,'requires a finite invertible affine ear frame.');
    records.push({name:side,mesh,original,p,n,a,inverse:matrix.clone().invert().elements.slice()});
  }
  return{records,sourceBuffers,sourceAttributes};
}

function stageEar(record,field,sourceBuffers,sourceAttributes){
  const {name,p,n,a,inverse}=record;
  const row={name,vertices:p.count,triangles:record.original.index.count/3,activeVertices:0,changedPositions:0,changedNormals:0,exactOutsideVertices:0,zeroNormalsPreserved:0,
    minimumSampledJacobian:Infinity,maximumSampledJacobian:-Infinity,maximumWorldDisplacement:0,maximumWorldZRoundoff:0,maximumWorldFieldRoundoff:0,maximumNormalLengthError:0,privateAttributeBytes:0};
  let geometry,whollyPrivate=false,pp,nn;
  try{
    geometry=record.original.clone();
    for(const[key,q]of entries(geometry))demand(!sourceBuffers.has(q.array.buffer)&&!sourceAttributes.has(q),'clone retained a source binding: '+name+'.'+key);
    whollyPrivate=true;pp=geometry.getAttribute('position');nn=geometry.getAttribute('normal');
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
      demand(Number.isFinite(x+y+z+nx+ny+nz),'encountered nonfinite ear input.');
      const wx=a[0]*x+a[4]*y+a[8]*z+a[12],wy=a[1]*x+a[5]*y+a[9]*z+a[13],wz=a[2]*x+a[6]*y+a[10]*z+a[14],s=field.world(wx,wy,wz);
      if(!s.active){row.exactOutsideVertices++;continue;}
      row.activeVertices++;const[dx,dy]=s.delta,j=s.jacobian,det=s.determinant;
      demand(det>.02&&Math.hypot(dx,dy)<.10,'exceeded the frozen155 field bound.');
      row.minimumSampledJacobian=Math.min(row.minimumSampledJacobian,det);row.maximumSampledJacobian=Math.max(row.maximumSampledJacobian,det);
      // These position and normal equations are the unchanged155 operations.
      // Add the inverse-linear displacement, preserving exact inactive values.
      pp.setXYZ(i,x+inverse[0]*dx+inverse[4]*dy,y+inverse[1]*dx+inverse[5]*dy,z+inverse[2]*dx+inverse[6]*dy);
      const qx=pp.getX(i),qy=pp.getY(i),qz=pp.getZ(i),lx=qx-x,ly=qy-y,lz=qz-z,
        ax=a[0]*lx+a[4]*ly+a[8]*lz,ay=a[1]*lx+a[5]*ly+a[9]*lz,az=a[2]*lx+a[6]*ly+a[10]*lz;
      row.maximumWorldDisplacement=Math.max(row.maximumWorldDisplacement,Math.hypot(ax,ay,az));row.maximumWorldZRoundoff=Math.max(row.maximumWorldZRoundoff,Math.abs(az));
      row.maximumWorldFieldRoundoff=Math.max(row.maximumWorldFieldRoundoff,Math.hypot(ax-dx,ay-dy,az));
      if(qx!==x||qy!==y||qz!==z)row.changedPositions++;
      if(nx===0&&ny===0&&nz===0){row.zeroNormalsPreserved++;continue;}
      const ux=inverse[0]*nx+inverse[1]*ny+inverse[2]*nz,uy=inverse[4]*nx+inverse[5]*ny+inverse[6]*nz,uz=inverse[8]*nx+inverse[9]*ny+inverse[10]*nz,
        vx=(j[4]*ux-j[3]*uy)/det,vy=(-j[1]*ux+j[0]*uy)/det,vz=uz-j[2]*vx-j[5]*vy,
        tx=a[0]*vx+a[1]*vy+a[2]*vz,ty=a[4]*vx+a[5]*vy+a[6]*vz,tz=a[8]*vx+a[9]*vy+a[10]*vz,length=Math.hypot(tx,ty,tz);
      demand(Number.isFinite(length)&&length>1e-12,'normal transport became singular.');nn.setXYZ(i,tx/length,ty/length,tz/length);
      row.maximumNormalLengthError=Math.max(row.maximumNormalLengthError,Math.abs(Math.hypot(nn.getX(i),nn.getY(i),nn.getZ(i))-1));
      if(nn.getX(i)!==nx||nn.getY(i)!==ny||nn.getZ(i)!==nz)row.changedNormals++;
    }
    demand(row.maximumWorldZRoundoff<=6e-7&&row.maximumWorldFieldRoundoff<=1e-6&&row.maximumNormalLengthError<=2e-6,'exceeded the unchanged155 Float32/normal tolerances.');
    if(!row.activeVertices){row.minimumSampledJacobian=null;row.maximumSampledJacobian=null;}
    pp.needsUpdate=true;nn.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();
    geometry.userData={...record.original.userData,jawEar159:{version:VERSION,fieldVersion:'jaw-silhouette-155',strength:1}};
    row.privateAttributeBytes=entries(geometry).reduce((s,[,q])=>s+q.array.byteLength,0);
    return{...record,geometry,metrics:row};
  }catch(error){if(whollyPrivate)geometry.dispose();throw error;}
}

/** Apply after live accepted147/151, once, before first renderer upload. */
export function applyJawEar159(model,{strength=0,retainSourceForQA=false}={}){
  demand(strength===0||strength===1,'is one OFF/ON study, not a parameter sweep.');demand(typeof retainSourceForQA==='boolean','requires an explicit QA-retention boolean.');
  const previous=model&&applications.get(model);if(previous){demand(previous.strength===strength,'needs release or a fresh model before switching strength.');return previous.metrics;}
  if(!strength)return ZERO;
  demand(model?.isObject3D,'requires the complete prepared model.');
  const started=performance.now(),face=model.getObjectByName('continuous-face'),neck=model.getObjectByName('neck-smooth-anatomical-surface');
  demand(face&&neck&&!face.geometry.userData.jawSilhouette155,'requires accepted157 before any155/159 application.');
  const field=getJawSilhouetteField155(model),{records,sourceBuffers,sourceAttributes}=collectEars(model),staged=[];
  let jawMetrics;
  try{for(const r of records)staged.push(stageEar(r,field,sourceBuffers,sourceAttributes));
    jawMetrics=applyJawSilhouette155(model,{strength:1,retainSourceForQA});
  }catch(error){for(const r of staged)r.geometry.dispose();throw error;}
  for(const r of staged)r.mesh.geometry=r.geometry;
  const metrics={version:VERSION,strength:1,applied:true,faceNeck:jawMetrics,earParts:staged.map(r=>r.metrics),
    selectedMeshes:4,privateGeometryCount:jawMetrics.privateGeometryCount+staged.length,
    privateAttributeBytes:jawMetrics.privateAttributeBytes+staged.reduce((s,r)=>s+r.metrics.privateAttributeBytes,0),
    earPrivateAttributeBytes:staged.reduce((s,r)=>s+r.metrics.privateAttributeBytes,0),
    maximumEarWorldDisplacement:Math.max(...staged.map(r=>r.metrics.maximumWorldDisplacement)),
    maximumEarWorldZRoundoff:Math.max(...staged.map(r=>r.metrics.maximumWorldZRoundoff)),
    maximumEarNormalLengthError:Math.max(...staged.map(r=>r.metrics.maximumNormalLengthError)),
    retainSourceForQA,retainedSourceGeometryReferences:retainSourceForQA?4:0,perFrameWork:0,addedDraws:0,addedTextureBytes:0,elapsedMs:performance.now()-started};
  applications.set(model,{strength:1,metrics,staged:retainSourceForQA?staged:null,jawBindings:retainSourceForQA?[[face,face.geometry],[neck,neck.geometry]]:null});return metrics;
}

/** Restore every original binding before the first private dispose event. */
export function releaseJawEar159(model){
  const r=model&&applications.get(model);if(!r)return{released:false,privateGeometriesDisposed:0,privateAttributeBytesReleased:0};
  demand(r.staged,'production159 does not retain its originals; use a fresh model to undo it.');
  for(const e of r.staged)demand(e.mesh.geometry===e.geometry,'requires dependent ear edits to be released first.');
  for(const[mesh,g]of r.jawBindings)demand(mesh.geometry===g,'requires dependent face/neck edits to be released first.');
  for(const e of r.staged)e.mesh.geometry=e.original;
  const jaw=releaseJawSilhouette155(model);for(const e of r.staged)e.geometry.dispose();applications.delete(model);
  return{released:true,privateGeometriesDisposed:jaw.privateGeometriesDisposed+r.staged.length,privateAttributeBytesReleased:r.metrics.privateAttributeBytes};
}
