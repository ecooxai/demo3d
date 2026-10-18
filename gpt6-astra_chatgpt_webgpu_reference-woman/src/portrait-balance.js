import { Matrix4 } from 'three';

// Apply after the existing portrait pose and geometry refinements, before
// illumination compensation. Every surface uses one model-local spatial map.
const VERSION='shared-portrait-balance-99';
const INNER_X=.90,OUTER_X=1.75,LOW_Y=1.30,HIGH_Y=2.00;
const MAX_X_GRADIENT=1.875/(OUTER_X-INNER_X);
const applications=new WeakMap();
const DEFAULT_OPTIONS=Object.freeze({shiftX:0});
const ZERO_RESULT=Object.freeze({version:VERSION,shiftX:0,applied:false,meshes:0,vertices:0,changedVertices:0,minimumJacobian:1,maximumJacobian:1,elapsedMs:0});
const clamp01=x=>Math.max(0,Math.min(1,x));
const now=()=>typeof performance==='object'?performance.now():Date.now();

function fieldAt(x,y,out){
 if(Math.abs(x)<=INNER_X||y>=HIGH_Y){out[0]=1;out[1]=out[2]=0;return;}
 const tx=clamp01((Math.abs(x)-INNER_X)/(OUTER_X-INNER_X));
 const ty=clamp01((y-LOW_Y)/(HIGH_Y-LOW_Y));
 const sx=tx*tx*tx*(tx*(tx*6-15)+10),sy=ty*ty*ty*(ty*(ty*6-15)+10);
 const dx=30*tx*tx*(1-tx)*(1-tx)/(OUTER_X-INNER_X);
 const dy=30*ty*ty*(1-ty)*(1-ty)/(HIGH_Y-LOW_Y);
 out[0]=1-sx*(1-sy);out[1]=-Math.sign(x)*dx*(1-sy);out[2]=sx*dy;
}

function rigidComponent(mesh,model){
 for(let node=mesh;node&&node!==model;node=node.parent){
  if(node.name==='anatomical-head')return 'head';
  if(node.name==='original-neck-and-clavicle-transition')return 'neck';
 }
 const name=mesh.name||'';
 if(/collar|facing/.test(name))return 'collar-and-facing';
 if(/placket|button/.test(name))return 'placket-and-buttons';
 return null;
}

/**
 * X' = X + shiftX*w(X,Y); Y and Z are fixed in model-local coordinates.
 * Repeating the same nonzero application returns its original metrics. A
 * different shift requires a fresh model, so comparisons cannot accumulate.
 * Shift zero returns a shared result before traversal, matrices or allocation.
 */
export function applyPortraitBalance(model,options=DEFAULT_OPTIONS){
 const shiftX=Number(options.shiftX??0);
 if(!Number.isFinite(shiftX))throw new TypeError('Portrait balance shift must be finite.');
 if(!model?.isObject3D)throw new TypeError('Pass the complete portrait model group.');
 const previous=applications.get(model);
 if(previous){
  if(previous.shiftX!==shiftX)throw new Error('This model already has a different portrait balance; compare a freshly built model.');
  return previous.metrics;
 }
 if(shiftX===0)return ZERO_RESULT;
 const analyticMinimumJacobian=1-Math.abs(shiftX)*MAX_X_GRADIENT;
 if(analyticMinimumJacobian<=.001)throw new RangeError('Portrait balance would fold its lateral transition.');

 const started=now(),records=[],counts=new Map(),groups={};
 model.updateWorldMatrix(true,true);
 const fromWorld=model.matrixWorld.clone().invert();
 if(!Number.isFinite(model.matrixWorld.determinant())||Math.abs(model.matrixWorld.determinant())<1e-14)throw new Error('The portrait model transform must be invertible.');
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;
  if(mesh.isInstancedMesh||mesh.isSkinnedMesh)throw new TypeError('Portrait balance expects the current explicit static meshes.');
  const geometry=mesh.geometry,p=geometry?.getAttribute('position'),n=geometry?.getAttribute('normal');
  if(!p||p.itemSize!==3||!n||n.itemSize!==3||n.count!==p.count)throw new TypeError(`Missing position or normal data on ${mesh.name}.`);
  const toModel=new Matrix4().multiplyMatrices(fromWorld,mesh.matrixWorld),det=toModel.determinant();
  if(!Number.isFinite(det)||Math.abs(det)<1e-14)throw new Error(`The transform of ${mesh.name} must be invertible.`);
  const inverse=toModel.clone().invert(),m=toModel.elements,b=inverse.elements,component=rigidComponent(mesh,model);
  for(const value of [...m,...b])if(!Number.isFinite(value))throw new Error(`Nonfinite transform on ${mesh.name}.`);
  const record={mesh,geometry,m,vx:b[0],vy:b[1],vz:b[2],component};
  records.push(record);counts.set(geometry,(counts.get(geometry)||0)+1);
  if(component&&!groups[component])groups[component]={meshes:0,vertices:0,minimumWeight:1,maximumWeight:0,bounds:{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]}};
 });
 if(!records.length)throw new TypeError('The portrait model contains no meshes.');

 // Check all inputs and rigid assembly vertices before modifying any geometry.
 // A changed outer-shirt variant must still include the entire opening here.
 const field=new Float64Array(3);
 for(const record of records){
  const {geometry,m,component}=record,p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),group=component?groups[component]:null;
  if(group)group.meshes++;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   if(!Number.isFinite(x+y+z+n.getX(i)+n.getY(i)+n.getZ(i)))throw new Error(`Nonfinite geometry on ${record.mesh.name}.`);
   if(!group)continue;
   const xx=m[0]*x+m[4]*y+m[8]*z+m[12],yy=m[1]*x+m[5]*y+m[9]*z+m[13],zz=m[2]*x+m[6]*y+m[10]*z+m[14];
   fieldAt(xx,yy,field);group.vertices++;group.minimumWeight=Math.min(group.minimumWeight,field[0]);group.maximumWeight=Math.max(group.maximumWeight,field[0]);
   for(let axis=0;axis<3;axis++){const value=axis===0?xx:axis===1?yy:zz;group.bounds.min[axis]=Math.min(group.bounds.min[axis],value);group.bounds.max[axis]=Math.max(group.bounds.max[axis],value);}
   if(field[0]!==1)throw new Error(`The uniform portrait balance region does not include all of ${component} (${record.mesh.name}).`);
  }
 }

 const metrics={version:VERSION,shiftX,applied:true,meshes:records.length,vertices:0,changedVertices:0,uniformVertices:0,transitionVertices:0,unchangedOuterVertices:0,clonedSharedGeometries:0,zeroNormalsPreserved:0,analyticMinimumJacobian,minimumJacobian:1,maximumJacobian:1,maximumModelDisplacement:0,maximumLocalDisplacement:0,maximumUpdatedNormalLengthError:0,rigidComponents:groups,elapsedMs:0};
 for(const record of records){
  const {mesh,m,vx,vy,vz}=record;let geometry=record.geometry;
  if(counts.get(geometry)>1){
   const original=geometry;geometry=original.clone();
   // Only position and normal storage must become instance-specific.
   for(const name of Object.keys(original.attributes))if(name!=='position'&&name!=='normal')geometry.setAttribute(name,original.getAttribute(name));
   geometry.setIndex(original.index);mesh.geometry=geometry;metrics.clonedSharedGeometries++;
  }
  const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),axisLength=Math.hypot(vx,vy,vz);let changed=false;
  metrics.vertices+=p.count;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),xx=m[0]*x+m[4]*y+m[8]*z+m[12],yy=m[1]*x+m[5]*y+m[9]*z+m[13];
   fieldAt(xx,yy,field);const w=field[0];
   if(w===0){metrics.unchangedOuterVertices++;continue;}
   if(w===1)metrics.uniformVertices++;else metrics.transitionVertices++;
   const amount=shiftX*w,gx=shiftX*(field[1]*m[0]+field[2]*m[1]),gy=shiftX*(field[1]*m[4]+field[2]*m[5]),gz=shiftX*(field[1]*m[8]+field[2]*m[9]);
   const determinant=1+vx*gx+vy*gy+vz*gz;
   metrics.minimumJacobian=Math.min(metrics.minimumJacobian,determinant);metrics.maximumJacobian=Math.max(metrics.maximumJacobian,determinant);
   p.setXYZ(i,x+amount*vx,y+amount*vy,z+amount*vz);changed=true;metrics.changedVertices++;
   // Sherman–Morrison inverse transpose of J = I + v*grad(amount)^T.
   // Keep the raw inverse-linear axis: normalizing it would break scale support.
   if(gx!==0||gy!==0||gz!==0){
    const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),projection=(vx*nx+vy*ny+vz*nz)/determinant;
    const a=nx-gx*projection,b=ny-gy*projection,c=nz-gz*projection,length=Math.hypot(a,b,c);
    if(length>0){n.setXYZ(i,a/length,b/length,c/length);metrics.maximumUpdatedNormalLengthError=Math.max(metrics.maximumUpdatedNormalLengthError,Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1));}
    else metrics.zeroNormalsPreserved++;
   }
   metrics.maximumModelDisplacement=Math.max(metrics.maximumModelDisplacement,Math.abs(amount));metrics.maximumLocalDisplacement=Math.max(metrics.maximumLocalDisplacement,Math.abs(amount)*axisLength);
  }
  if(changed){p.needsUpdate=true;n.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();}
 }
 metrics.elapsedMs=now()-started;
 applications.set(model,{shiftX,metrics});
 return metrics;
}
