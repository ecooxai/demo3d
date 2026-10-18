import { Matrix4 } from 'three';

// Review-only common model-space deformation. Apply after portrait-balance99
// and before skin illumination. No geometry, material or texture is added.
const VERSION='shared-torso-depth-110';
// Broad Y transitions are intentional: the earlier .70-high fades produced
// long-lock triangle interpolation crossings despite a monotone field.
const BOTTOM_ZERO=-1.28,BOTTOM_FULL=-.10,TOP_FULL=.10,TOP_ZERO=1.60;
const FRONT_Z=.75,REAR_Z=-.55,DEPTH_WIDTH=.54;
const MAX_GAUSSIAN_SLOPE=Math.SQRT2*Math.exp(-.5)/DEPTH_WIDTH;
const applications=new WeakMap(),DEFAULT_OPTIONS=Object.freeze({strength:0});
const ZERO_RESULT=Object.freeze({version:VERSION,strength:0,frontPeak:0,rearPeak:0,applied:false,meshes:0,vertices:0,changedVertices:0,minimumJacobian:1,maximumJacobian:1,elapsedMs:0});
const now=()=>typeof performance==='object'?performance.now():Date.now();
const smooth=t=>t*t*t*(t*(t*6-15)+10);
const slope=t=>30*t*t*(1-t)*(1-t);

// The middle preset is deliberately a mild +.18/-.05 rather than an exact
// half-amplitude copy. Both intervals interpolate continuously from zero.
function amplitudes(strength){
 return strength<=.5?[.36*strength,.10*strength]:[.18+.12*(strength-.5),.05+.06*(strength-.5)];
}

// out = [displacement, d(displacement)/dY, d(displacement)/dZ, Y weight].
// Gaussian depth profiles are C-infinity; the compact Y envelope is C2.
function fieldAt(y,z,front,rear,out){
 if(y<=BOTTOM_ZERO||y>=TOP_ZERO){out[0]=out[1]=out[2]=out[3]=0;return;}
 let w=1,dy=0;
 if(y<BOTTOM_FULL){const t=(y-BOTTOM_ZERO)/(BOTTOM_FULL-BOTTOM_ZERO);w=smooth(t);dy=slope(t)/(BOTTOM_FULL-BOTTOM_ZERO);}
 else if(y>TOP_FULL){const t=(y-TOP_FULL)/(TOP_ZERO-TOP_FULL);w=1-smooth(t);dy=-slope(t)/(TOP_ZERO-TOP_FULL);}
 const f=(z-FRONT_Z)/DEPTH_WIDTH,r=(z-REAR_Z)/DEPTH_WIDTH;
 const ef=Math.exp(-f*f),er=Math.exp(-r*r),depth=front*ef-rear*er;
 out[0]=w*depth;out[1]=dy*depth;
 out[2]=w*(-2*front*f*ef+2*rear*r*er)/DEPTH_WIDTH;out[3]=w;
}

function componentOf(mesh,model){
 for(let p=mesh;p&&p!==model;p=p.parent){
  if(p.name==='anatomical-head')return 'protected-head';
  if(p.name==='original-neck-and-clavicle-transition')return 'neck';
 }
 const n=mesh.name||'';
 if(/button/.test(n))return 'buttons';
 if(/collar|facing/.test(n))return 'collar-and-facing';
 if(/placket/.test(n))return 'placket';
 if(/crown with/.test(n))return 'hair-crown';
 if(/Overlapping layered/.test(n))return 'hair-mass';
 if(/Independent fine/.test(n))return 'hair-fine';
 if(/fringe|wisps/.test(n))return 'hair-fringe-and-wisps';
 if(/blouse/.test(n))return 'blouse';
 return 'other';
}

/**
 * F(X,Y,Z)=(X,Y,Z+D(Y,Z)). The two depth peaks add torso volume while
 * displacing outer hair less; front-to-back order is strictly monotone.
 * Strength 0 is a true no-op before matrices, traversal or allocations.
 * Repeating a nonzero strength returns the same metrics; changing it requires
 * a fresh model. All changed geometry is staged and checked before commit.
 */
export function applyTorsoDepth110(model,options=DEFAULT_OPTIONS){
 const strength=Number(options.strength??0);
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Torso depth strength must be in [0,1].');
 if(!model?.isObject3D)throw new TypeError('Pass the complete portrait model group.');
 const previous=applications.get(model);
 if(previous){if(previous.strength!==strength)throw new Error('Torso depth already differs; compare a freshly built model.');return previous.metrics;}
 if(strength===0)return ZERO_RESULT;
 const [frontPeak,rearPeak]=amplitudes(strength),analyticMinimumJacobian=1-(frontPeak+rearPeak)*MAX_GAUSSIAN_SLOPE;
 if(analyticMinimumJacobian<.45)throw new RangeError('The torso depth field exceeds its conservative derivative budget.');
 const started=now(),records=[],geometryUse=new Map(),groups={},field=new Float64Array(4);
 const metrics={version:VERSION,strength,frontPeak,rearPeak,applied:true,meshes:0,vertices:0,triangles:0,changedMeshes:0,changedVertices:0,protectedVertices:0,bottomVertices:0,zeroNormalsPreserved:0,geometryClones:0,sharedGeometryClones:0,stagedAttributeBytes:0,analyticMinimumJacobian,minimumJacobian:1,maximumJacobian:1,maximumShear:0,maximumModelDisplacement:0,maximumLocalDisplacement:0,maximumModelXYRoundoff:0,maximumUpdatedNormalLengthError:0,components:groups,elapsedMs:0};
 model.updateWorldMatrix(true,true);
 const modelDet=model.matrixWorld.determinant();
 if(!Number.isFinite(modelDet)||Math.abs(modelDet)<1e-14)throw new Error('The model transform must be finite and invertible.');
 const fromWorld=model.matrixWorld.clone().invert();
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;
  if(mesh.isInstancedMesh||mesh.isSkinnedMesh)throw new TypeError('Torso depth expects explicit static meshes.');
  const geometry=mesh.geometry,p=geometry?.getAttribute('position'),n=geometry?.getAttribute('normal'),t=geometry?.getAttribute('tangent');
  if(!p||!n||p.itemSize!==3||n.itemSize!==3||n.count!==p.count||p.isInterleavedBufferAttribute||n.isInterleavedBufferAttribute||p.normalized||n.normalized)throw new TypeError(`Unsupported position/normal storage on ${mesh.name}.`);
  if(t&&(t.itemSize!==4||t.count!==p.count||t.isInterleavedBufferAttribute||t.normalized))throw new TypeError(`Unsupported tangent storage on ${mesh.name}.`);
  if(Object.values(geometry.morphAttributes||{}).some(a=>a.length))throw new TypeError('Torso depth expects meshes without morph targets.');
  const toModel=new Matrix4().multiplyMatrices(fromWorld,mesh.matrixWorld),det=toModel.determinant();
  if(!Number.isFinite(det)||Math.abs(det)<1e-14)throw new Error(`Noninvertible transform on ${mesh.name}.`);
  const inverse=toModel.clone().invert(),m=toModel.elements,b=inverse.elements;
  for(const values of[m,b])for(const v of values)if(!Number.isFinite(v))throw new Error(`Nonfinite transform on ${mesh.name}.`);
  if(Math.max(Math.abs(m[3]),Math.abs(m[7]),Math.abs(m[11]),Math.abs(m[15]-1))>1e-12)throw new Error('Torso depth requires affine mesh transforms.');
  const component=componentOf(mesh,model);
  if(!groups[component])groups[component]={meshes:0,vertices:0,changedVertices:0,maximumDisplacement:0,minimumJacobian:1,maximumNormalAngleDegrees:0,zeroNormals:0,minimumY:Infinity,maximumY:-Infinity};
  records.push({mesh,geometry,m,vx:b[8],vy:b[9],vz:b[10],component,changed:false,staged:null});
  geometryUse.set(geometry,(geometryUse.get(geometry)||0)+1);
 });
 if(!records.length)throw new TypeError('The model contains no meshes.');

 // Input and deformation preflight: no geometry assignment or buffer mutation.
 for(const r of records){
  const {geometry,m,component}=r,p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),t=geometry.getAttribute('tangent'),group=groups[component];
  metrics.meshes++;group.meshes++;metrics.vertices+=p.count;metrics.triangles+=(geometry.index?.count??p.count)/3;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
   if(!Number.isFinite(x+y+z+nx+ny+nz))throw new Error(`Nonfinite input geometry on ${r.mesh.name}.`);
   if(t&&!Number.isFinite(t.getX(i)+t.getY(i)+t.getZ(i)+t.getW(i)))throw new Error(`Nonfinite input tangent on ${r.mesh.name}.`);
   const yy=m[1]*x+m[5]*y+m[9]*z+m[13],zz=m[2]*x+m[6]*y+m[10]*z+m[14];
   if(!Number.isFinite(yy+zz))throw new Error('The model-space input is nonfinite.');
   fieldAt(yy,zz,frontPeak,rearPeak,field);
   if(component==='protected-head'&&field[3]!==0)throw new Error('The protected anatomical head enters the torso depth envelope.');
   group.vertices++;group.minimumY=Math.min(group.minimumY,yy);group.maximumY=Math.max(group.maximumY,yy);
   if(yy>=TOP_ZERO)metrics.protectedVertices++;if(yy<=BOTTOM_ZERO)metrics.bottomVertices++;
   const jac=1+field[2];
   if(jac<analyticMinimumJacobian-1e-12||!Number.isFinite(jac+field[0]+field[1]))throw new Error('The torso field failed its derivative preflight.');
   metrics.minimumJacobian=Math.min(metrics.minimumJacobian,jac);metrics.maximumJacobian=Math.max(metrics.maximumJacobian,jac);metrics.maximumShear=Math.max(metrics.maximumShear,Math.abs(field[1]));group.minimumJacobian=Math.min(group.minimumJacobian,jac);
   if(field[0]!==0||field[1]!==0||field[2]!==0)r.changed=true;
  }
 }

 try{
  for(const r of records){
   if(!r.changed)continue;
   const {geometry:original,m,vx,vy,vz}=r,group=groups[r.component];
   const geometry=original.clone();r.staged=geometry;
   // The immutable UV/color/index buffers remain exact shared references.
   // Cloning changed position/normal data even for unique geometries makes
   // a failure on any later mesh atomic, and never mutates external instances.
   for(const name of Object.keys(original.attributes))if(!['position','normal','tangent'].includes(name))geometry.setAttribute(name,original.getAttribute(name));
   geometry.setIndex(original.index);
   const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),t=geometry.getAttribute('tangent'),axisLength=Math.hypot(vx,vy,vz);
   metrics.geometryClones++;metrics.sharedGeometryClones+=geometryUse.get(original)>1?1:0;
   metrics.stagedAttributeBytes+=p.array.byteLength+n.array.byteLength+(t?.array.byteLength||0);
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),yy=m[1]*x+m[5]*y+m[9]*z+m[13],zz=m[2]*x+m[6]*y+m[10]*z+m[14];
    fieldAt(yy,zz,frontPeak,rearPeak,field);
    const amount=field[0],dy=field[1],dz=field[2];
    if(amount===0&&dy===0&&dz===0)continue;
    const gx=dy*m[1]+dz*m[2],gy=dy*m[5]+dz*m[6],gz=dy*m[9]+dz*m[10],jac=1+dz;
    p.setXYZ(i,x+amount*vx,y+amount*vy,z+amount*vz);
    const px=p.getX(i),py=p.getY(i),pz=p.getZ(i);
    if(!Number.isFinite(px+py+pz))throw new Error(`Nonfinite staged position on ${r.mesh.name}.`);
    // Jlocal=I+inverse(M)*ez*gradLocal(D)^T. Its inverse transpose
    // is evaluated analytically; unnormalised inverse axis supports scaling.
    const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),oldLength=Math.hypot(nx,ny,nz),projection=(vx*nx+vy*ny+vz*nz)/jac;
    const a=nx-gx*projection,b=ny-gy*projection,c=nz-gz*projection,length=Math.hypot(a,b,c);
    if(!Number.isFinite(length))throw new Error(`Nonfinite staged normal on ${r.mesh.name}.`);
    if(length>0){
     n.setXYZ(i,a/length,b/length,c/length);
     const aa=n.getX(i),bb=n.getY(i),cc=n.getZ(i),storedLength=Math.hypot(aa,bb,cc),error=Math.abs(storedLength-1);
     if(error>2e-6)throw new Error('A staged normal failed unit-length validation.');
     metrics.maximumUpdatedNormalLengthError=Math.max(metrics.maximumUpdatedNormalLengthError,error);
     const cosine=(nx*aa+ny*bb+nz*cc)/(oldLength*storedLength);
     group.maximumNormalAngleDegrees=Math.max(group.maximumNormalAngleDegrees,Math.acos(Math.max(-1,Math.min(1,cosine)))*180/Math.PI);
    }else{metrics.zeroNormalsPreserved++;group.zeroNormals++;}
    if(t){
     const tx=t.getX(i),ty=t.getY(i),tz=t.getZ(i),gp=gx*tx+gy*ty+gz*tz;
     const ax=tx+vx*gp,ay=ty+vy*gp,az=tz+vz*gp,nx2=n.getX(i),ny2=n.getY(i),nz2=n.getZ(i),dot=ax*nx2+ay*ny2+az*nz2;
     const bx=ax-dot*nx2,by=ay-dot*ny2,bz=az-dot*nz2,tl=Math.hypot(bx,by,bz);
     if(!Number.isFinite(tl))throw new Error('A staged tangent is nonfinite.');
     if(tl>0)t.setXYZ(i,bx/tl,by/tl,bz/tl);
    }
    metrics.changedVertices++;group.changedVertices++;
    metrics.maximumModelDisplacement=Math.max(metrics.maximumModelDisplacement,Math.abs(amount));metrics.maximumLocalDisplacement=Math.max(metrics.maximumLocalDisplacement,Math.abs(amount)*axisLength);group.maximumDisplacement=Math.max(group.maximumDisplacement,Math.abs(amount));
    const dx=px-x,ddy=py-y,ddz=pz-z;
    metrics.maximumModelXYRoundoff=Math.max(metrics.maximumModelXYRoundoff,Math.abs(m[0]*dx+m[4]*ddy+m[8]*ddz),Math.abs(m[1]*dx+m[5]*ddy+m[9]*ddz));
   }
   p.needsUpdate=true;n.needsUpdate=true;if(t)t.needsUpdate=true;
   geometry.computeBoundingBox();geometry.computeBoundingSphere();
  }
 }catch(error){for(const r of records)r.staged?.dispose();throw error;}
 // Commit only after every staged mesh has passed. No retained baseline arrays.
 for(const r of records)if(r.staged){r.mesh.geometry=r.staged;metrics.changedMeshes++;}
 metrics.elapsedMs=now()-started;applications.set(model,{strength,metrics});
 return metrics;
}
