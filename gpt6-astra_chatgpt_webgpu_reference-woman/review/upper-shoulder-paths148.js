import * as THREE from 'three';
import { UPPER148_COEFFICIENTS } from '../review/upper-shoulder148-native-coefficients.js';

// Isolated 148 coarse study. A shared model-space depth corridor transports
// the accepted guide paths and their original closed sections before meshing.
// No second 118 fit, depth compression, material edit or new carrier surface.
const VERSION='shared-upper-shoulder-148-native-v3';
const IDS=[...Array.from({length:33},(_,i)=>58+i),...Array.from({length:6},(_,i)=>133+i),...Array.from({length:8},(_,i)=>148+i),...Array.from({length:28},(_,i)=>172+i)];
const OFF=Object.freeze({version:VERSION,enabled:false,changed:false});
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=x=>Math.max(0,Math.min(1,x));
const S=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
const S3=x=>{const t=clamp(x);return t*t*(3-2*t);};

// These are authored coarse coefficients, not a fit performed at startup.
// The lower zero band includes an initial normal-neighborhood guard; the
// source audit checks actual emitted vertices/normals at model Y <= .55.
export const UPPER148_SPEC=Object.freeze({version:VERSION,selectedGuides:IDS.slice(),baseFibers:2415,top:2.17,fullTop:1.45,fullBottom:1.30,bottom:.69,peak:.18,headY:2.95,headShiftX:.26,headTilt:-.17,headYaw:.16,guidePlacement:.5,contact:.35,protectedLowerY:.55,protectedUpperY:2.30});
export const UPPER148_GRID=Object.freeze({nx:9,ny:11,x0:-1.75,y0:.25,step:.25});

export function upperBasis148(x,y,spec=UPPER148_SPEC){
 const gate=y>=spec.top||y<=spec.bottom?0:S((spec.top-y)/(spec.top-spec.fullTop))*S((y-spec.bottom)/(spec.fullBottom-spec.bottom));
 const g=UPPER148_GRID,u=Math.max(1,Math.min(g.nx-2.000000001,(x-g.x0)/g.step)),v=Math.max(1,Math.min(g.ny-2.000000001,(y-g.y0)/g.step)),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,wx=[(1-a)**3/6,(3*a*a*a-6*a*a+4)/6,(-3*a*a*a+3*a*a+3*a+1)/6,a*a*a/6],wy=[(1-b)**3/6,(3*b*b*b-6*b*b+4)/6,(-3*b*b*b+3*b*b+3*b+1)/6,b*b*b/6],ids=new Uint16Array(16),weights=new Float64Array(16);
 for(let row=0,k=0;row<4;row++)for(let col=0;col<4;col++,k++){ids[k]=(j+row-1)*g.nx+i+col-1;weights[k]=gate*wx[col]*wy[row];}return{ids,weights,gate};
}

export function upperPull148(x,y,spec=UPPER148_SPEC){
 if(y>=spec.top||y<=spec.bottom)return 0;
 const b=upperBasis148(x,y,spec),c=UPPER148_COEFFICIENTS.values;let pull=0;for(let k=0;k<16;k++)pull+=b.weights[k]*c[b.ids[k]];return pull;
}

// Analytic jet of the exact same frozen depth field. A scratch result is
// reused for all fine vertices; no full baseline geometry buffer is retained.
export function upperJet148(x,y,out,spec=UPPER148_SPEC){
 out[0]=out[1]=out[2]=0;if(y>=spec.top||y<=spec.bottom)return out;
 const a0=(spec.top-y)/(spec.top-spec.fullTop),b0=(y-spec.bottom)/(spec.fullBottom-spec.bottom),a=clamp(a0),b=clamp(b0),sa=S(a),sb=S(b),dsa=a0>0&&a0<1?-30*a*a*(1-a)*(1-a)/(spec.top-spec.fullTop):0,dsb=b0>0&&b0<1?30*b*b*(1-b)*(1-b)/(spec.fullBottom-spec.bottom):0,gate=sa*sb,dgate=dsa*sb+sa*dsb,g=UPPER148_GRID;
 const ur=(x-g.x0)/g.step,vr=(y-g.y0)/g.step,u=Math.max(1,Math.min(g.nx-2.000000001,ur)),v=Math.max(1,Math.min(g.ny-2.000000001,vr)),i=Math.floor(u),j=Math.floor(v),s=u-i,t=v-j;
 const wx=[(1-s)**3/6,(3*s*s*s-6*s*s+4)/6,(-3*s*s*s+3*s*s+3*s+1)/6,s*s*s/6],wy=[(1-t)**3/6,(3*t*t*t-6*t*t+4)/6,(-3*t*t*t+3*t*t+3*t+1)/6,t*t*t/6],dx=[-.5*(1-s)**2,1.5*s*s-2*s,-1.5*s*s+s+.5,.5*s*s],dy=[-.5*(1-t)**2,1.5*t*t-2*t,-1.5*t*t+t+.5,.5*t*t],ux=ur===u?1/g.step:0,vy=vr===v?1/g.step:0,c=UPPER148_COEFFICIENTS.values;
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const k=(j+row-1)*g.nx+i+col-1,q=c[k];
  out[0]+=gate*wx[col]*wy[row]*q;
  out[1]+=gate*dx[col]*ux*wy[row]*q;
  out[2]+=(dgate*wx[col]*wy[row]+gate*wx[col]*dy[row]*vy)*q;
 }
 return out;
}

// Exact smooth (pre-Float32 storage) version of the existing raw -> partial
// gravity compensation -> posed model -> 86 pipeline. The source/native
// audits separately measure the actual stored Float32 mesh residual.
export function upperTransform148({contact,headShiftX=.26,headTilt=-.17,earDepth,spec=UPPER148_SPEC}={}){
 if(!contact||typeof contact.atModel!=='function'||typeof earDepth!=='function')throw Error('148 requires the original contact and ear-depth functions.');
 const cy=Math.cos(.16),sy=Math.sin(.16),cr=Math.cos(headTilt),sr=Math.sin(headTilt);
 const gravity=y=>1-S3((y+1.64)/2.02);
 const metrics={forwardCalls:0,inverseCalls:0,maximumInverseResidual:0,maximumCenterXYResidual:0,maximumPull:0};
 function forward(p,deformEar=true){
  const x=p.x,y=p.y,z=deformEar?earDepth(x,y,p.z):p.z,w=gravity(y),ay=-.16*w,az=-headTilt*w,a=Math.cos(ay),b=Math.sin(ay),c=Math.cos(az),d=Math.sin(az),v=x*a+z*b,hz=-x*b+z*a,hx=v*c-y*d,hy=v*d+y*c,r=hx*cr-hy*sr,X=headShiftX+r*cy+hz*sy,Y=2.95+hx*sr+hy*cr,Z=-r*sy+hz*cy;
  metrics.forwardCalls++;return V(X,Y,Z+contact.atModel(X,Y,Z));
 }
 function inverse(p,deformEar=true){
  // 86 is monotone in Z and has derivative >= .86 at the accepted strength.
  let Z=p.z;for(let i=0;i<10;i++)Z=p.z-contact.atModel(p.x,p.y,Z);
  const X=p.x-headShiftX,Y=p.y-2.95,r=X*cy-Z*sy,hz=X*sy+Z*cy,hx=r*cr+Y*sr,hy=-r*sr+Y*cr;
  // Inverse Rz angle depends on the unknown original raw Y. This scalar
  // fixed-point equation is the same partial-gravity inverse used by 94/133.
  let y=hy;for(let i=0;i<14;i++){const az=-headTilt*gravity(y);y=-hx*Math.sin(az)+hy*Math.cos(az);}
  const w=gravity(y),ay=-.16*w,az=-headTilt*w,c=Math.cos(az),d=Math.sin(az),a=Math.cos(ay),b=Math.sin(ay),v=hx*c+hy*d,x=v*a-hz*b,ez=v*b+hz*a;
  let z=ez;
  if(deformEar){
   // The affected upper band only reaches the tail of the original ear
   // field. Newton's monotone scalar inverse also preserves that small term.
   for(let i=0;i<8;i++){
    const e=1e-5,value=earDepth(x,y,z)-ez;if(Math.abs(value)<2e-14)break;
    const derivative=(earDepth(x,y,z+e)-earDepth(x,y,z-e))/(2*e);
    if(!(derivative>.004)||!Number.isFinite(derivative))throw Error('148 original ear-depth inverse is not monotone.');
    z-=value/derivative;
   }
  }
  metrics.inverseCalls++;return V(x,y,z);
 }
 function move(raw,deformEar=true){
  const old=forward(raw,deformEar),pull=upperPull148(old.x,old.y,spec);if(pull===0)return raw;
  const target=old.clone();target.z-=pull;const out=inverse(target,deformEar),check=forward(out,deformEar);
  metrics.maximumPull=Math.max(metrics.maximumPull,pull);
  metrics.maximumInverseResidual=Math.max(metrics.maximumInverseResidual,Math.hypot(check.x-target.x,check.y-target.y,check.z-target.z));
  metrics.maximumCenterXYResidual=Math.max(metrics.maximumCenterXYResidual,Math.hypot(check.x-old.x,check.y-old.y));
  return out;
 }
 return{forward,inverse,move,metrics,spec};
}

export function prepareUpperShoulder148(guides,{enabled=false,contact,headShiftX=.26,headTilt=-.17,guidePlacement=.5,earDepth,spec=UPPER148_SPEC}={}){
 if(!enabled)return OFF;
 if(enabled!==true&&enabled!==1)throw Error('148 coarse comparison is off/on only.');
 if(UPPER148_COEFFICIENTS.values.length!==UPPER148_GRID.nx*UPPER148_GRID.ny||UPPER148_COEFFICIENTS.values.some(v=>!Number.isFinite(v)||v<0||v>spec.peak+1e-12))throw Error('148 field coefficients are invalid.');
 if(guides.length!==276||headShiftX!==.26||headTilt!==-.17||guidePlacement!==.5||contact?.metrics.strength!==.35||guides.some(g=>g.upper148))throw Error('148 accepted source, pose, or single-application guard changed.');
 for(const id of IDS){const expected=id<91?'front':id<139?'curl':id<156?'side':'inner';if(guides[id]?.kind!==expected||(expected!=='side'&&!guides[id].original118))throw Error('148 guide ownership or the accepted 118 fit changed.');}
 const started=performance.now(),transform=upperTransform148({contact,headShiftX,headTilt,earDepth,spec}),metrics={version:VERSION,enabled:true,changed:true,stage:'original-MASS-and-dependent-fibers',selectedGuides:IDS.slice(),baseFibers:2415,attachedFibers:0,attachedFlyaways:0,changedFineVertices:0,coarseFineAllocation:0,extraVertices:0,extraTriangles:0,extraDrawCalls:0,extraTextures:0,second118Fit:false,retained86:.35,coefficientFingerprint:UPPER148_COEFFICIENTS.fingerprint,specification:{...spec},transport:transform.metrics,preparationMs:0,fiberTransportMs:0,fineRanges:[]};
 for(const id of IDS){
  const g=guides[id],original={...g};g.upper148={id,original,transform,metrics};
  g.c={debug:original.c.debug,getPoint(t){return transform.move(original.c.getPoint(t),original.deformEar);},getTangent(t){const raw=original.c.getPoint(t),at=transform.forward(raw,original.deformEar);if(upperPull148(at.x,at.y,spec)===0)return original.c.getTangent(t);return this.getPoint(Math.min(1,t+.00001)).sub(this.getPoint(Math.max(0,t-.00001))).normalize();}};
 }
 metrics.preparationMs=performance.now()-started;return metrics;
}

export function upperRawPoint148(g,raw){return g.upper148?g.upper148.transform.move(raw,g.upper148.original.deformEar):raw;}

export function recordUpperFiber148(batch,g,first,count,kind='regular'){
 const state=g.upper148;if(!state)return;
 if(!Number.isInteger(first)||!Number.isInteger(count)||count<4||(kind!=='regular'&&kind!=='flyaway'))throw Error('148 fine source range changed.');
 const data=batch.upper148??=( {metrics:state.metrics,spec:state.transform.spec,ranges:[],applied:false} );
 if(data.metrics!==state.metrics||data.applied)throw Error('148 fine batch ownership or application order changed.');
 const last=data.ranges.at(-1);
 if(last&&last.id===state.id&&last.kind===kind&&last.first+last.count===first){last.count+=count;last.fibers++;}
 else data.ranges.push({id:state.id,kind,first,count,fibers:1});
 if(kind==='regular')state.metrics.attachedFibers++;else state.metrics.attachedFlyaways++;
}

// Fine positions are formed from the accepted original curve and ring cuts.
// After the original gravity/86 pass and normal calculation, the identical
// model-space shear is applied directly. Its inverse transpose retains the
// exact accepted normals outside the field, even at a long triangle's boundary.
export function applyUpperFiberMesh148(geometry,data){
 if(data.applied)throw Error('148 fine field cannot be applied twice.');
 const p=geometry.attributes.position,n=geometry.attributes.normal,spec=data.spec,jet=new Float64Array(3),cy=Math.cos(.16),sy=Math.sin(.16),cr=Math.cos(-.17),sr=Math.sin(-.17),started=performance.now();
 if(!p||!n||p.count!==n.count||data.metrics.attachedFibers!==2415)throw Error('148 fine population changed.');
 let previousEnd=0,changed=0;
 for(const r of data.ranges){if(r.first<previousEnd||r.first+r.count>p.count)throw Error('148 fine ranges overlap or exceed the source mesh.');previousEnd=r.first+r.count;}
 // Preflight precedes all mutation. The positive shear determinant is 1;
 // actual triangle orientation and contact are checked independently.
 for(const r of data.ranges)for(let i=r.first;i<r.first+r.count;i++)if(!Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)+n.getX(i)+n.getY(i)+n.getZ(i)))throw Error('148 source fine vertex is nonfinite.');
 for(const r of data.ranges)for(let i=r.first;i<r.first+r.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),h=x*cr-y*sr,X=.26+h*cy+z*sy,Y=2.95+x*sr+y*cr;
  upperJet148(X,Y,jet,spec);const pull=jet[0];if(pull===0)continue;
  p.setXYZ(i,x+sy*cr*pull,y-sy*sr*pull,z-cy*pull);
  const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),nr=nx*cr-ny*sr,mz=-nr*sy+nz*cy,mx=nr*cy+nz*sy+jet[1]*mz,my=nx*sr+ny*cr+jet[2]*mz;
  const hx=cy*cr*mx+sr*my-sy*cr*mz,hy=-cy*sr*mx+cr*my+sy*sr*mz,hz=sy*mx+cy*mz,l=Math.hypot(hx,hy,hz);
  if(l>0)n.setXYZ(i,hx/l,hy/l,hz/l);
  changed++;
 }
 data.applied=true;data.metrics.changedFineVertices=changed;data.metrics.fineRanges=data.ranges.map(r=>({...r}));data.metrics.fiberTransportMs=performance.now()-started;data.metrics.fineNormalTransport='analytic inverse transpose of the same model-space depth shear';
 p.needsUpdate=n.needsUpdate=true;
}
