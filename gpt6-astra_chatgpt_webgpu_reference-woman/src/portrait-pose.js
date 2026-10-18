import { Matrix4 } from 'three';

// Apply after applyPortraitProportions(), before skin illumination compensation.
// Move the complete head/hair pivot along world X; carry the neck's upper end
// with it while the lower neck and all existing UV coordinates stay in place.
const VERSION='reference-woman-pose-52-v1';
const BLEND_START=1.15,BLEND_END=1.95;
const headApplications=new WeakMap(),neckApplications=new WeakMap();
const clamp01=x=>Math.max(0,Math.min(1,x));
const now=()=>typeof performance==='object'?performance.now():Date.now();

function blendAt(y){
  const t=clamp01((y-BLEND_START)/(BLEND_END-BLEND_START));
  return {
    weight:t*t*(3-2*t),
    derivative:t>0&&t<1?6*t*(1-t)/(BLEND_END-BLEND_START):0
  };
}

function neckFrames(neck,shiftX){
  const meshes=[],toNeckRoot=neck.matrixWorld.clone().invert();
  neck.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const geometry=mesh.geometry,p=geometry?.getAttribute('position');
    if(!p||p.itemSize!==3)throw new TypeError(`Missing neck positions on ${mesh.name}.`);
    if(!geometry.getAttribute('normal'))geometry.computeVertexNormals();
    const n=geometry.getAttribute('normal');
    if(n.count!==p.count)throw new TypeError(`Mismatched neck normals on ${mesh.name}.`);
    for(const attribute of[p,n])for(const value of attribute.array)if(!Number.isFinite(value))throw new TypeError(`Non-finite neck data on ${mesh.name}.`);
    const toNeck=new Matrix4().multiplyMatrices(toNeckRoot,mesh.matrixWorld).elements;
    const inverse=mesh.matrixWorld.clone().invert().elements;
    // A world-X unit vector in the mesh's own coordinates. Its translation
    // component is deliberately omitted; normals and displacements are vectors.
    const direction=[inverse[0],inverse[1],inverse[2]];
    if(Math.hypot(...direction)===0)throw new Error('The neck transform is singular.');
    const coupling=direction[0]*toNeck[1]+direction[1]*toNeck[5]+direction[2]*toNeck[9];
    const minimumPossibleJacobian=Math.min(1,1+shiftX*coupling*1.5/(BLEND_END-BLEND_START));
    if(!(minimumPossibleJacobian>0))throw new RangeError('The requested head offset would invert the neck.');
    meshes.push({mesh,toNeck,direction});
  });
  if(!meshes.length)throw new TypeError('The neck group has no meshes.');
  const counts=new Map();
  for(const {mesh}of meshes)counts.set(mesh.geometry,(counts.get(mesh.geometry)||0)+1);
  let geometryClones=0;
  for(const {mesh}of meshes)if(counts.get(mesh.geometry)>1){mesh.geometry=mesh.geometry.clone();geometryClones++;}
  return {meshes,geometryClones};
}

function translateNeck(frames,shiftX){
  const metrics={
    meshes:frames.meshes.length,geometryClones:frames.geometryClones,vertices:0,
    changedVertices:0,unchangedLowerNeckVertices:0,fullyTranslatedVertices:0,
    maximumLocalDisplacement:0,maximumWorldDisplacement:0,
    minimumJacobian:1,maximumJacobian:1,maximumNormalLengthError:0,
    zeroSourceNormalsPreserved:0
  };
  for(const {mesh,toNeck,direction}of frames.meshes){
    const geometry=mesh.geometry,p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
    const [vx,vy,vz]=direction,axisLength=Math.hypot(vx,vy,vz);
    metrics.vertices+=p.count;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const neckY=toNeck[1]*x+toNeck[5]*y+toNeck[9]*z+toNeck[13],blend=blendAt(neckY);
      if(neckY<=BLEND_START)metrics.unchangedLowerNeckVertices++;
      if(blend.weight===0||shiftX===0)continue;
      const amount=shiftX*blend.weight,gain=shiftX*blend.derivative;
      const gx=gain*toNeck[1],gy=gain*toNeck[5],gz=gain*toNeck[9];
      // J = I + v grad(amount)^T; use the exact inverse transpose for normals.
      const determinant=1+vx*gx+vy*gy+vz*gz;
      const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),projection=(vx*nx+vy*ny+vz*nz)/determinant;
      const xx=nx-gx*projection,yy=ny-gy*projection,zz=nz-gz*projection,length=Math.hypot(xx,yy,zz);
      p.setXYZ(i,x+vx*amount,y+vy*amount,z+vz*amount);
      if(length>0)n.setXYZ(i,xx/length,yy/length,zz/length);
      else metrics.zeroSourceNormalsPreserved++;
      metrics.changedVertices++;
      if(blend.weight===1)metrics.fullyTranslatedVertices++;
      metrics.maximumLocalDisplacement=Math.max(metrics.maximumLocalDisplacement,Math.abs(amount)*axisLength);
      metrics.maximumWorldDisplacement=Math.max(metrics.maximumWorldDisplacement,Math.abs(amount));
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
 * Set the accepted lateral head pose once. The offset is measured along world X
 * even if the portrait's parent is rotated or scaled. Neck-local Y <= 1.15 stays
 * unchanged; Y >= 1.95 follows the full translation and preserves the fitted jaw
 * join. A second call with the same groups and shift leaves geometry untouched.
 * Use a fresh portrait for a different shift, avoiding cumulative deformation.
 */
export function applyPortraitPose(headPivot,neck,{shiftX=.26}={}){
  if(!headPivot?.isObject3D||!neck?.isObject3D)throw new TypeError('Pass the complete head pivot and anatomical neck.');
  if(!Number.isFinite(shiftX))throw new TypeError('shiftX must be a finite world-space distance.');
  const start=now(),oldHead=headApplications.get(headPivot),oldNeck=neckApplications.get(neck);
  if(oldHead&&oldHead.shiftX!==shiftX)throw new Error('This head already has a different pose offset; use a fresh portrait.');
  if(oldNeck&&(oldNeck.headPivot!==headPivot||oldNeck.shiftX!==shiftX))throw new Error('This neck is already fitted to a different pose.');
  if(oldHead&&oldNeck)return {version:VERSION,shiftX,alreadyApplied:true,head:oldHead.metrics,neck:oldNeck.metrics,elapsedMs:0};

  headPivot.updateWorldMatrix(true,true);neck.updateWorldMatrix(true,true);
  const inverseParent=headPivot.parent?headPivot.parent.matrixWorld.clone().invert():new Matrix4();
  const parent=inverseParent.elements,localOffset=[shiftX*parent[0],shiftX*parent[1],shiftX*parent[2]];
  if(Math.hypot(parent[0],parent[1],parent[2])===0)throw new Error('The head parent transform is singular.');
  const frames=oldNeck?null:neckFrames(neck,shiftX);
  let neckMetrics=oldNeck?.metrics,headMetrics=oldHead?.metrics;
  if(!neckMetrics){
    neckMetrics=translateNeck(frames,shiftX);
    neckApplications.set(neck,{headPivot,shiftX,metrics:neckMetrics});
    neck.userData.portraitPose={version:VERSION,shiftX,space:'world X',blendStart:BLEND_START,blendEnd:BLEND_END,metrics:neckMetrics};
  }
  if(!headMetrics){
    const before=headPivot.matrixWorld.elements.slice(12,15);
    headPivot.position.set(headPivot.position.x+localOffset[0],headPivot.position.y+localOffset[1],headPivot.position.z+localOffset[2]);
    headPivot.updateWorldMatrix(true,true);
    const after=headPivot.matrixWorld.elements;
    headMetrics={localOffset,actualWorldDelta:[after[12]-before[0],after[13]-before[1],after[14]-before[2]]};
    headApplications.set(headPivot,{shiftX,metrics:headMetrics});
    headPivot.userData.portraitPose={version:VERSION,shiftX,space:'world X',metrics:headMetrics};
  }
  return {version:VERSION,shiftX,alreadyApplied:false,head:headMetrics,neck:neckMetrics,elapsedMs:now()-start};
}
