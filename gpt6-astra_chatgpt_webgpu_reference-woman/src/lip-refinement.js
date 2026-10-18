import { Matrix4 } from 'three';

// Candidate 62: restore a little vertical lip thickness after the accepted
// lower-face compaction. The existing seam, photographed UVs, depth and gloss
// remain fixed. Apply after portrait-proportions.js and face-refinement.js.
const VERSION='reference-woman-lip-thickness-62-v1';
const COMPACTION=.94,EYE_Y=.05,HALF_WIDTH=.241;
const X_FULL=.145,X_END=.235,SEAM_LOCK=.003,SEAM_BLEND=.010,SKIN_BLEND=.050;
const MAX_STRENGTH=.08,MAX_LIP_RADIUS=.10;
const applications=new WeakMap();
const targetNames=new Set(['continuous-face','upper-lip','lower-lip']);
const now=()=>typeof performance==='object'?performance.now():Date.now();
function step(t){if(t<=0)return 0;if(t>=1)return 1;return t*t*t*(10+t*(-15+6*t));}
function slope(t){return t>0&&t<1?30*t*t*(1-t)*(1-t):0;}

// Exactly the two portraitY Hermite segments traversed by the authored lips.
// Each stores [input start, length, cubic, quadratic, linear, constant].
function segment(start,end,a,b,m0,m1){
  const h=end-start;
  return [start,h,2*a-2*b+h*(m0+m1),-3*a+3*b-h*(2*m0+m1),h*m0,a];
}
const LOWER=segment(-.96,-.639,-1.04,-.79,.39/.541,.565/.70);
const UPPER=segment(-.639,-.26,-.79,-.475,.565/.70,.84/.889);
function warpedMouthY(y,out,offset){
  const [start,h,a,b,c,d]=y<=-.639?LOWER:UPPER,t=(y-start)/h;
  out[offset]=EYE_Y+COMPACTION*(((a*t+b)*t+c)*t+d-EYE_Y);
  out[offset+1]=COMPACTION*((3*a*t+2*b)*t+c)/h;
}
function gaussian(t,m,r){return Math.exp(-(((t-m)/r)**2));}
function gaussianSlope(t,m,r,value){return -2*(t-m)/(r*r)*value;}

// Writes [seam Y, seam dY/dX, upper radius, upper radius derivative,
// lower radius, lower radius derivative] in the current compacted head frame.
// X_END<HALF_WIDTH keeps all fractional edge-power derivatives finite and
// leaves an exact fixed corner band. Candidate 58 is identity for |X|<=.26.
function mouthProfile(x,out){
  const t=x/HALF_WIDTH,w=1-t*t,dtdx=1/HALF_WIDTH,dwdx=-2*t*dtdx;
  const sy=-.639+.008*Math.abs(t)**1.8+.003*Math.cos(t*Math.PI)+.0035*t;
  const dsy=(.0144*Math.abs(t)**.8*Math.sign(t)-.003*Math.PI*Math.sin(t*Math.PI)+.0035)*dtdx;
  const g0=gaussian(t,-.30,.28),g1=gaussian(t,.35,.25),g2=gaussian(t,-.025,.18);
  const cupid=.81+.15*g0+.12*g1-.07*g2;
  const dcupid=(.15*gaussianSlope(t,-.30,.28,g0)+.12*gaussianSlope(t,.35,.25,g1)
    -.07*gaussianSlope(t,-.025,.18,g2))*dtdx;
  const upper=sy+.088*w**.7*cupid,lower=sy-.094*w**.72;
  const dupper=dsy+.088*(.7*w**(-.3)*dwdx*cupid+w**.7*dcupid);
  const dlower=dsy-.094*.72*w**(-.28)*dwdx;
  warpedMouthY(sy,out,0);warpedMouthY(upper,out,2);warpedMouthY(lower,out,4);
  const seam=out[0],dseam=out[1]*dsy;
  out[3]=out[3]*dupper-dseam;out[2]-=seam;
  out[5]=dseam-out[5]*dlower;out[4]=seam-out[4];out[1]=dseam;
  return out;
}

// Writes [head-Y displacement, d/dX, d/dY, d/dZ] into reusable scratch.
// Every target mesh uses this same spatial field, including the skin beneath
// the lip borders. At the border its depth gate is identically one, preserving
// their original tiny separation instead of independently scaling lip meshes.
function lipSample(x,y,z,strength,out,profile){
  out[0]=out[1]=out[2]=out[3]=0;
  const absX=Math.abs(x);
  if(strength===0||absX>=X_END||z<=.28||y<=-.90||y>=-.58)return out;
  mouthProfile(x,profile);
  const d=y-profile[0],distance=Math.abs(d),sign=Math.sign(d);
  if(distance<=SEAM_LOCK)return out;
  const radius=d>0?profile[2]:profile[4],radiusX=d>0?profile[3]:profile[5];
  if(distance>=radius+SKIN_BLEND)return out;

  const xt=(absX-X_FULL)/(X_END-X_FULL),wx=1-step(xt);
  const dwx=-slope(xt)/(X_END-X_FULL)*Math.sign(x);
  const vt=(distance-radius)/SKIN_BLEND,v=1-step(vt),vd=-slope(vt)/SKIN_BLEND;
  const gt=(distance-SEAM_LOCK)/SEAM_BLEND,g=step(gt),gd=slope(gt)/SEAM_BLEND;
  const zt=(z-.28)/.16,f=step(zt),df=slope(zt)/.16;
  const distanceX=-sign*profile[1];
  const vx=vd*(distanceX-radiusX),gx=gd*distanceX;
  const core=wx*v*g,coreX=dwx*v*g+wx*(vx*g+v*gx);
  const coreY=wx*sign*(vd*g+v*gd);
  out[0]=strength*d*core*f;
  out[1]=strength*(-profile[1]*core+d*coreX)*f;
  out[2]=strength*(core+d*coreY)*f;
  out[3]=strength*d*core*df;
  return out;
}

/**
 * Restore up to 6% lip thickness around the existing closed-mouth seam.
 * strength may be 0..0.08 for isolated fresh-model comparisons. X/Z, object
 * transforms, UVs, material/gloss, mouth-crease geometry and every other mesh
 * are untouched. A fixed .003 head-unit seam band also retains its normals.
 *
 * The common mapping is Y'=Y+s d Wx V G F, with d=Y-seam(X).
 * det(J)=1+s Wx F [VG+|d|(V'G+VG')]. Only V' can be negative;
 * |V'|<=1.875/.05 and |d|<=radius+.05. The source's two Hermite
 * segments and lip powers bound radius below .10, hence
 *   det(J)>=1-s*(.10+.05)*1.875/.05 = 1-5.625s.
 * The floor is .775/.6625/.55 at s=.04/.06/.08 respectively.
 * The seam and depth transitions cannot lower that bound. Each mesh's
 * authored normals are carried through the analytic inverse transpose.
 *
 * Same-argument repeats are no-ops. A different strength requires a fresh
 * model, avoiding retained position/normal baseline buffers.
 */
export function applyLipThicknessRefinement(head,{strength=.06}={}){
  if(!head?.isObject3D)throw new TypeError('Pass the anatomical head group.');
  if(!Number.isFinite(strength)||strength<0||strength>MAX_STRENGTH)
    throw new RangeError('Lip thickness strength must be between 0 and .08.');
  const previous=applications.get(head)||head.userData?.lipThicknessRefinement;
  if(previous){
    if(previous.version!==VERSION||previous.strength!==strength)
      throw new Error('Create a fresh head to compare a different lip thickness.');
    return {...previous,alreadyApplied:true,elapsedMs:0};
  }
  const factor=head.userData?.portraitProportions?.factor;
  if(factor!==undefined&&Math.abs(factor-COMPACTION)>1e-12)
    throw new Error('This lip refinement expects the accepted .94 compaction.');
  const start=now(),targets=[],uses=new Map(),found=new Map();
  head.updateWorldMatrix(true,true);
  head.traverse(mesh=>{
    if(!mesh.isMesh)return;
    uses.set(mesh.geometry,(uses.get(mesh.geometry)||0)+1);
    if(targetNames.has(mesh.name)){targets.push(mesh);found.set(mesh.name,(found.get(mesh.name)||0)+1);}
  });
  if([...targetNames].some(name=>found.get(name)!==1))
    throw new Error('Refine one continuous-face, upper-lip and lower-lip together.');
  const hd=head.matrixWorld.determinant();
  if(!Number.isFinite(hd)||Math.abs(hd)<1e-12)throw new Error('The head transform must be invertible.');
  const headInverse=head.matrixWorld.clone().invert(),world=head.matrixWorld.elements;
  const worldYAxis=Math.hypot(world[4],world[5],world[6]);
  const frames=targets.map(mesh=>{
    const geometry=mesh.geometry,p=geometry?.getAttribute('position'),n=geometry?.getAttribute('normal');
    if(!p||p.itemSize!==3||!n||n.itemSize!==3||n.count!==p.count)
      throw new TypeError('Lip refinement needs matching positions and authored normals.');
    if(uses.get(geometry)!==1)throw new Error('Use a fresh head with unshared face and lip geometry.');
    const toHead=new Matrix4().multiplyMatrices(headInverse,mesh.matrixWorld),det=toHead.determinant();
    if(!Number.isFinite(det)||Math.abs(det)<1e-12)throw new Error('A face or lip transform is singular.');
    for(let i=0;i<p.count;i++)if(!Number.isFinite(p.getX(i))||!Number.isFinite(p.getY(i))||!Number.isFinite(p.getZ(i))
      ||!Number.isFinite(n.getX(i))||!Number.isFinite(n.getY(i))||!Number.isFinite(n.getZ(i)))
      throw new Error('The source face or lip contains a non-finite position or normal.');
    return {mesh,geometry,p,n,h:toHead.elements,back:toHead.clone().invert().elements};
  });
  const metrics={version:VERSION,strength,alreadyApplied:false,meshes:targets.length,vertices:0,changedVertices:0,
    perMesh:[],maximumHeadDisplacement:0,maximumWorldDisplacement:0,minimumJacobian:1,maximumJacobian:1,
    guaranteedMinimumJacobian:1-strength*(MAX_LIP_RADIUS+SKIN_BLEND)*1.875/SKIN_BLEND,
    maximumNormalLengthError:0,zeroSourceNormalsPreserved:0,seamLock:SEAM_LOCK,
    horizontalSupport:[-X_END,X_END],skinBlendDistance:SKIN_BLEND,elapsedMs:0};
  const sample=new Float64Array(4),profile=new Float64Array(6);
  for(const {mesh,geometry,p,n,h,back} of frames){
    const vx=back[4],vy=back[5],vz=back[6];
    let changedVertices=0;
    metrics.vertices+=p.count;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
      const X=h[0]*x+h[4]*y+h[8]*z+h[12],Y=h[1]*x+h[5]*y+h[9]*z+h[13],Z=h[2]*x+h[6]*y+h[10]*z+h[14];
      lipSample(X,Y,Z,strength,sample,profile);
      const amount=sample[0];if(amount===0)continue;
      const gx=sample[1]*h[0]+sample[2]*h[1]+sample[3]*h[2];
      const gy=sample[1]*h[4]+sample[2]*h[5]+sample[3]*h[6];
      const gz=sample[1]*h[8]+sample[2]*h[9]+sample[3]*h[10];
      const determinant=1+vx*gx+vy*gy+vz*gz;
      if(!Number.isFinite(determinant)||determinant<=0)throw new Error('Lip refinement encountered an invalid Jacobian.');
      const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),projection=(vx*nx+vy*ny+vz*nz)/determinant;
      const xx=nx-gx*projection,yy=ny-gy*projection,zz=nz-gz*projection,length=Math.hypot(xx,yy,zz);
      if(!Number.isFinite(length))throw new Error('Invalid transported lip/face normal.');
      p.setXYZ(i,x+vx*amount,y+vy*amount,z+vz*amount);
      if(length>0)n.setXYZ(i,xx/length,yy/length,zz/length);else metrics.zeroSourceNormalsPreserved++;
      changedVertices++;metrics.changedVertices++;
      metrics.maximumHeadDisplacement=Math.max(metrics.maximumHeadDisplacement,Math.abs(amount));
      metrics.maximumWorldDisplacement=Math.max(metrics.maximumWorldDisplacement,Math.abs(amount)*worldYAxis);
      metrics.minimumJacobian=Math.min(metrics.minimumJacobian,determinant);
      metrics.maximumJacobian=Math.max(metrics.maximumJacobian,determinant);
      if(length>0)metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,
        Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1));
    }
    if(changedVertices){p.needsUpdate=true;n.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();}
    metrics.perMesh.push({name:mesh.name,vertices:p.count,changedVertices});
  }
  metrics.elapsedMs=now()-start;applications.set(head,metrics);head.userData.lipThicknessRefinement=metrics;
  return metrics;
}
