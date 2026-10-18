import { Matrix4 } from 'three';

// Candidate 58: a controlled lower-cheek silhouette test on the accepted,
// compacted head. Apply after portrait-proportions.js. Existing atlas UVs stay
// attached; this module never reads the independent ear UVs or rebakes color.
const VERSION='reference-woman-lower-cheek-58-v1';
const COMPACTION=.94,EYE_Y=.05,MAX_STRENGTH=.08;
const applications=new WeakMap();
const now=()=>typeof performance==='object'?performance.now():Date.now();

// Quintic step: value, first derivative and second derivative join smoothly.
// Its derivative is nonnegative and at most 1.875 on [0,1].
function step(t){
  if(t<=0)return 0;if(t>=1)return 1;
  return t*t*t*(10+t*(-15+6*t));
}
function slope(t){return t>0&&t<1?30*t*t*(1-t)*(1-t):0;}

// Writes [head-X displacement, d/dX, d/dY, d/dZ] into one reusable scratch
// vector. No per-vertex baseline copies or allocations are required.
function taperSample(x,y,z,strength,out){
  out[0]=out[1]=out[2]=out[3]=0;
  if(strength===0)return out;
  const canonicalY=EYE_Y+(y-EYE_Y)/COMPACTION,u=Math.abs(x);
  if(canonicalY<=-1.10||canonicalY>=-.35||u<=.26||u>=.92)return out;

  const yi=(canonicalY+1.10)/.22,yo=(canonicalY+.70)/.35;
  const yIn=step(yi),yOut=1-step(yo),wy=yIn*yOut;
  const dwy=slope(yi)/.22*yOut-yIn*slope(yo)/.35;
  const xi=(u-.26)/.14,xo=(u-.76)/.16;
  const xIn=step(xi),xOut=1-step(xo),wx=xIn*xOut;
  const dwx=(slope(xi)/.14*xOut-xIn*slope(xo)/.16)*Math.sign(x);

  // The right pinna reaches canonical Y=-.4464044 and the existing recessed
  // head bed spans Y>=-.415, Z=-.125..+.215. Fix this entire attachment band,
  // including its lower lobe, with a smooth transition below/forward of it.
  // This guard is independent of X, so it does not weaken the determinant
  // bound. The left pinna is higher, entirely outside the Y support already.
  const ey=(canonicalY+.560)/.105,ez=(Math.abs(z-.045)-.190)/.055;
  const high=step(ey),side=1-step(ez),ear=1-high*side;
  if(ear===0)return out;
  const dearY=-slope(ey)/.105*side;
  const dearZ=high*slope(ez)/.055*Math.sign(z-.045);

  const scale=-strength,weight=wy*ear;
  out[0]=scale*x*wx*weight;
  out[1]=scale*(wx+x*dwx)*weight;
  out[2]=scale*x*wx*(dwy*ear+wy*dearY)/COMPACTION;
  out[3]=scale*x*wx*wy*dearZ;
  return out;
}

/**
 * Reduce lower-cheek width by up to strength (default 2.5%), preserving head
 * height/depth, atlas coordinates and object transforms. Only continuous-face
 * geometry is edited; eye/lip/ear meshes and materials remain untouched.
 *
 * Mathematical non-inversion bound:
 *   X' = X - s X Wx(X) Wy(Y) E(Y,Z), Y'=Y, Z'=Z.
 *   det(J) = 1 - s Wy E (Wx + X dWx/dX).
 * In the rising X transition |X|<=.40 and dWx/d|X|<=1.875/.14;
 * in the falling transition X dWx/dX<=0. Therefore everywhere
 *   det(J) >= 1 - s (1 + .40*1.875/.14).
 * It is >=.841071 at s=.025 and >=.745714 at s=.04, independent
 * of Y/Z blending. The allowed maximum .08 still guarantees >=.491428.
 * Affine mesh-coordinate changes preserve this determinant by similarity.
 *
 * Repeating the same call is a no-op. A different strength requires a fresh
 * model, rather than retaining large position/normal baseline buffers.
 */
export function applyLowerCheekTaper(head,{strength=.025}={}){
  if(!head?.isObject3D)throw new TypeError('Pass the anatomical head group.');
  if(!Number.isFinite(strength)||strength<0||strength>MAX_STRENGTH)
    throw new RangeError('Lower-cheek strength must be between 0 and .08.');
  const previous=applications.get(head)||head.userData?.lowerCheekTaper;
  if(previous){
    if(previous.version!==VERSION||previous.strength!==strength)
      throw new Error('Create a fresh head to compare a different lower-cheek strength.');
    return {...previous,alreadyApplied:true,elapsedMs:0};
  }
  const sourceFactor=head.userData?.portraitProportions?.factor;
  if(sourceFactor!==undefined&&Math.abs(sourceFactor-COMPACTION)>1e-12)
    throw new Error('This taper expects the accepted .94 lower-face compaction.');

  const start=now(),targets=[],geometryUses=new Map();
  head.updateWorldMatrix(true,true);
  head.traverse(mesh=>{
    if(!mesh.isMesh)return;
    geometryUses.set(mesh.geometry,(geometryUses.get(mesh.geometry)||0)+1);
    if(mesh.name==='continuous-face')targets.push(mesh);
  });
  if(!targets.length)throw new Error('The anatomical head has no continuous-face mesh.');
  const headDet=head.matrixWorld.determinant();
  if(!Number.isFinite(headDet)||Math.abs(headDet)<1e-12)
    throw new Error('The anatomical head transform must be invertible.');
  const headInverse=head.matrixWorld.clone().invert();
  const world=head.matrixWorld.elements,worldXAxis=Math.hypot(world[0],world[1],world[2]);
  const frames=targets.map(mesh=>{
    const geometry=mesh.geometry,p=geometry?.getAttribute('position'),n=geometry?.getAttribute('normal');
    if(!p||p.itemSize!==3||!n||n.itemSize!==3||n.count!==p.count)
      throw new TypeError('The continuous face needs matching 3D positions and authored normals.');
    if(geometryUses.get(geometry)!==1)
      throw new Error('Use a fresh head with an unshared continuous-face geometry.');
    const toHead=new Matrix4().multiplyMatrices(headInverse,mesh.matrixWorld),det=toHead.determinant();
    if(!Number.isFinite(det)||Math.abs(det)<1e-12)
      throw new Error('The continuous-face transform must be invertible.');
    for(let i=0;i<p.count;i++){
      if(!Number.isFinite(p.getX(i))||!Number.isFinite(p.getY(i))||!Number.isFinite(p.getZ(i))
        ||!Number.isFinite(n.getX(i))||!Number.isFinite(n.getY(i))||!Number.isFinite(n.getZ(i)))
        throw new Error('The source face contains a non-finite position or normal.');
    }
    return {mesh,geometry,p,n,h:toHead.elements,back:toHead.clone().invert().elements};
  });
  const metrics={
    version:VERSION,strength,alreadyApplied:false,meshes:targets.length,vertices:0,
    changedVertices:0,maximumHeadDisplacement:0,maximumWorldDisplacement:0,
    minimumJacobian:1,maximumJacobian:1,
    guaranteedMinimumJacobian:1-strength*(1+.40*1.875/.14),
    maximumNormalLengthError:0,zeroSourceNormalsPreserved:0,
    canonicalYSupport:[-1.10,-.35],fullYInfluence:[-.88,-.70],
    centralXGuard:.26,outerXFade:[.76,.92],elapsedMs:0
  };
  const sample=new Float64Array(4);
  for(const {geometry,p,n,h,back} of frames){
    // The head X unit vector represented in this mesh's actual local frame.
    const vx=back[0],vy=back[1],vz=back[2];
    let changed=false;
    metrics.vertices+=p.count;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const X=h[0]*x+h[4]*y+h[8]*z+h[12];
      const Y=h[1]*x+h[5]*y+h[9]*z+h[13];
      const Z=h[2]*x+h[6]*y+h[10]*z+h[14];
      taperSample(X,Y,Z,strength,sample);
      const amount=sample[0];
      if(amount===0)continue;
      // Chain rule into mesh coordinates. J_local=I+v grad(amount)^T.
      const gx=sample[1]*h[0]+sample[2]*h[1]+sample[3]*h[2];
      const gy=sample[1]*h[4]+sample[2]*h[5]+sample[3]*h[6];
      const gz=sample[1]*h[8]+sample[2]*h[9]+sample[3]*h[10];
      const determinant=1+vx*gx+vy*gy+vz*gz;
      if(!Number.isFinite(determinant)||determinant<=0)
        throw new Error('Lower-cheek taper encountered an invalid Jacobian.');
      const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
      // Sherman-Morrison inverse transpose: authored normals are transported,
      // not replaced by triangulation-derived normals elsewhere on the face.
      const projection=(vx*nx+vy*ny+vz*nz)/determinant;
      const xx=nx-gx*projection,yy=ny-gy*projection,zz=nz-gz*projection;
      const length=Math.hypot(xx,yy,zz);
      if(!Number.isFinite(length))throw new Error('Invalid transported face normal.');
      p.setXYZ(i,x+vx*amount,y+vy*amount,z+vz*amount);
      if(length>0)n.setXYZ(i,xx/length,yy/length,zz/length);
      else metrics.zeroSourceNormalsPreserved++;
      changed=true;metrics.changedVertices++;
      metrics.maximumHeadDisplacement=Math.max(metrics.maximumHeadDisplacement,Math.abs(amount));
      metrics.maximumWorldDisplacement=Math.max(metrics.maximumWorldDisplacement,Math.abs(amount)*worldXAxis);
      metrics.minimumJacobian=Math.min(metrics.minimumJacobian,determinant);
      metrics.maximumJacobian=Math.max(metrics.maximumJacobian,determinant);
      if(length>0)metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,
        Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1));
    }
    if(changed){
      p.needsUpdate=true;n.needsUpdate=true;
      geometry.computeBoundingBox();geometry.computeBoundingSphere();
    }
  }
  metrics.elapsedMs=now()-start;
  applications.set(head,metrics);
  head.userData.lowerCheekTaper=metrics;
  return metrics;
}
