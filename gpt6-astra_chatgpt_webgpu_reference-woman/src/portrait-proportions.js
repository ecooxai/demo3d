import { Matrix4 } from 'three';

// Apply after the reference atlases are assigned and before their illumination
// compensation. The geometry moves under its existing UVs; no color is rebaked.
const VERSION='reference-woman-proportions-50-v1';
const FACTOR=.94,EYE_Y=.05,FACE_BLEND=.18,NECK_START=1.70,NECK_END=2.00;
const headApplications=new WeakMap(),neckApplications=new WeakMap();
const clamp01=x=>Math.max(0,Math.min(1,x));
const now=()=>typeof performance==='object'?performance.now():Date.now();

function lowerFaceWarp(y){
  const t=clamp01((EYE_Y-y)/FACE_BLEND),w=t*t*(3-2*t);
  const dw=t>0&&t<1?-6*t*(1-t)/FACE_BLEND:0;
  return {
    displacement:-(1-FACTOR)*(y-EYE_Y)*w,
    derivative:-(1-FACTOR)*(w+(y-EYE_Y)*dw)
  };
}

function neckBlend(y){
  const t=clamp01((y-NECK_START)/(NECK_END-NECK_START));
  return {
    weight:t*t*(3-2*t),
    derivative:t>0&&t<1?6*t*(1-t)/(NECK_END-NECK_START):0
  };
}

function meshesIn(root){
  const meshes=[];
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry,position=geometry?.getAttribute('position');
    if(!position||position.itemSize!==3)throw new TypeError(`Missing 3D positions on ${mesh.name}.`);
    if(!geometry.getAttribute('normal'))geometry.computeVertexNormals();
    if(geometry.getAttribute('normal').count!==position.count)throw new TypeError(`Mismatched normals on ${mesh.name}.`);
    meshes.push(mesh);
  });
  if(!meshes.length)throw new TypeError(`No portrait meshes in ${root.name}.`);
  return meshes;
}

function separateSharedGeometry(meshes){
  const counts=new Map();
  for(const mesh of meshes)counts.set(mesh.geometry,(counts.get(mesh.geometry)||0)+1);
  // Each instance needs its own local deformation if descendants have different
  // transforms. Clone before changing any shared source, without copying maps.
  for(const mesh of meshes)if(counts.get(mesh.geometry)>1)mesh.geometry=mesh.geometry.clone();
}

function deformMeshes(meshes,head,neckRoot=null){
  const toHeadRoot=head.matrixWorld.clone().invert();
  const toNeckRoot=neckRoot?neckRoot.matrixWorld.clone().invert():null;
  const world=head.matrixWorld.elements,headYAxisWorldLength=Math.hypot(world[4],world[5],world[6]);
  const metrics={
    meshes:meshes.length,vertices:0,changedVertices:0,
    maximumLocalDisplacement:0,maximumWorldDisplacement:0,
    minimumJacobian:1,maximumJacobian:1,maximumNormalLengthError:0,
    untouchedLowerNeckVertices:0,zeroSourceNormalsPreserved:0
  };
  for(const mesh of meshes){
    const geometry=mesh.geometry,p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
    const toHead=new Matrix4().multiplyMatrices(toHeadRoot,mesh.matrixWorld);
    const fromHead=toHead.clone().invert(),h=toHead.elements,back=fromHead.elements;
    const neck=toNeckRoot?new Matrix4().multiplyMatrices(toNeckRoot,mesh.matrixWorld).elements:null;
    // A unit step along the head's local Y axis expressed in this mesh's space.
    const vx=back[4],vy=back[5],vz=back[6],localAxisLength=Math.hypot(vx,vy,vz);
    metrics.vertices+=p.count;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const headY=h[1]*x+h[5]*y+h[9]*z+h[13],warp=lowerFaceWarp(headY);
      let weight=1,weightDerivative=0;
      if(neck){
        const neckY=neck[1]*x+neck[5]*y+neck[9]*z+neck[13],blend=neckBlend(neckY);
        weight=blend.weight;weightDerivative=blend.derivative;
        if(neckY<=NECK_START)metrics.untouchedLowerNeckVertices++;
      }
      if(weight===0||warp.displacement===0)continue;
      const amount=weight*warp.displacement;
      const gx=weight*warp.derivative*h[1]+(neck?warp.displacement*weightDerivative*neck[1]:0);
      const gy=weight*warp.derivative*h[5]+(neck?warp.displacement*weightDerivative*neck[5]:0);
      const gz=weight*warp.derivative*h[9]+(neck?warp.displacement*weightDerivative*neck[9]:0);
      // J = I + v grad(amount)^T. Its inverse transpose retains the authored
      // normals, including the analytic eye normals, under the blended warp.
      const determinant=1+gx*vx+gy*vy+gz*vz;
      if(!Number.isFinite(determinant)||determinant<=0)throw new Error('Portrait deformation inverted a surface.');
      const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),projection=(vx*nx+vy*ny+vz*nz)/determinant;
      const xx=nx-gx*projection,yy=ny-gy*projection,zz=nz-gz*projection,length=Math.hypot(xx,yy,zz);
      if(!Number.isFinite(length))throw new Error(`Invalid portrait normal on ${mesh.name}.`);
      p.setXYZ(i,x+vx*amount,y+vy*amount,z+vz*amount);
      if(length>0)n.setXYZ(i,xx/length,yy/length,zz/length);
      else metrics.zeroSourceNormalsPreserved++;
      metrics.changedVertices++;
      metrics.maximumLocalDisplacement=Math.max(metrics.maximumLocalDisplacement,Math.abs(amount)*localAxisLength);
      metrics.maximumWorldDisplacement=Math.max(metrics.maximumWorldDisplacement,Math.abs(amount)*headYAxisWorldLength);
      metrics.minimumJacobian=Math.min(metrics.minimumJacobian,determinant);
      metrics.maximumJacobian=Math.max(metrics.maximumJacobian,determinant);
      if(length>0)metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1));
    }
    p.needsUpdate=true;n.needsUpdate=true;
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
  }
  return metrics;
}

/**
 * Compact the accepted lower-face proportions once, then carry the upper neck
 * through the same deformation in posed head space. At neck Y >= 2.00 the join
 * and jaw undergo one identical, invertible mapping; their original containment
 * is preserved. The transition ends at Y = 1.70, above the fixed collar support.
 * Object poses, UVs, colors, materials, and the hair are not modified.
 */
export function applyPortraitProportions(head,neck){
  if(!head?.isObject3D||!neck?.isObject3D)throw new TypeError('Pass the anatomical head and neck groups.');
  const start=now(),oldHead=headApplications.get(head),oldNeck=neckApplications.get(neck);
  if(oldNeck&&oldNeck.head!==head)throw new Error('This neck has already been fitted to a different head.');
  if(oldHead&&oldNeck)return {version:VERSION,factor:FACTOR,alreadyApplied:true,head:oldHead,neck:oldNeck.metrics,elapsedMs:0};

  head.updateWorldMatrix(true,true);neck.updateWorldMatrix(true,true);
  const headMeshes=oldHead?[]:meshesIn(head),neckMeshes=oldNeck?[]:meshesIn(neck);
  separateSharedGeometry([...headMeshes,...neckMeshes]);
  let headMetrics=oldHead,neckMetrics=oldNeck?.metrics;
  if(!headMetrics){
    headMetrics=deformMeshes(headMeshes,head);
    headApplications.set(head,headMetrics);
    head.userData.portraitProportions={version:VERSION,factor:FACTOR,eyeLine:EYE_Y,blendHeight:FACE_BLEND};
  }
  if(!neckMetrics){
    neckMetrics=deformMeshes(neckMeshes,head,neck);
    neckApplications.set(neck,{head,metrics:neckMetrics});
    neck.userData.portraitProportions={version:VERSION,fit:'Follow compacted jaw in posed head space',blendStart:NECK_START,blendEnd:NECK_END};
  }
  return {version:VERSION,factor:FACTOR,alreadyApplied:false,head:headMetrics,neck:neckMetrics,elapsedMs:now()-start};
}
