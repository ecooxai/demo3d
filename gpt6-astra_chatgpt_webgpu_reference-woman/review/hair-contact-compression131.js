import { Matrix4 } from 'three';
import { sampleBlouseFrontAtXY } from '../src/blouse.js';

// Original131 study: compress only positive hair depth above a smooth
// garment-support envelope. The body and model X/Y do not move. This differs
// from118's common translation: close inner layers can stay in place while
// outer layers approach them without reversing continuous depth order.
const VERSION='monotone-hair-contact-131';
const applications=new WeakMap();
const STEP=.12,NX=39,NY=34,X0=-2.28,Y0=-1.80;
const PIN_Y=1.31,FULL_Y=.55,CLEARANCE=.032,ENVELOPE_MARGIN=.010,HINGE=.035;
const clamp=x=>Math.max(0,Math.min(1,x));
const s5=t=>t*t*t*(t*(t*6-15)+10);
const ds5=t=>30*t*t*(1-t)*(1-t);
const OFF=Object.freeze({version:VERSION,strength:0,applied:false});

function makeSupport(){
 const started=performance.now(),raw=new Float64Array(NX*NY).fill(NaN),weight=new Float64Array(NX*NY),height=new Float64Array(NX*NY);
 const c=Math.cos(.045),s=Math.sin(.045);let hits=0;
 for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
  const x=X0+i*STEP,y=Y0+j*STEP,k=j*NX+i;
  // The accepted blouse is rotated around model point (0,1,0). Apply131
  // before balance99, so the existing original query remains the right frame.
  const q=sampleBlouseFrontAtXY(c*x+s*(y-1),-s*x+c*(y-1)+1);
  if(!q||!Number.isFinite(q.point.z)||!Number.isFinite(q.edgeWeight)||q.edgeWeight<=0)continue;
  raw[k]=q.point.z;weight[k]=clamp(q.edgeWeight);hits++;
 }
 for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){
  const k=j*NX+i;if(weight[k]===0)continue;let top=raw[k];
  // A local upper envelope avoids copying individual cloth folds into hair.
  // It is a sampled support estimate, not an exhaustive collision proof.
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){
   const ii=i+di,jj=j+dj;if(ii<0||ii>=NX||jj<0||jj>=NY)continue;
   const v=raw[jj*NX+ii];if(Number.isFinite(v))top=Math.max(top,v);
  }
  height[k]=top+ENVELOPE_MARGIN+CLEARANCE;
 }
 if(hits<100)throw new Error('131 could not sample the accepted blouse support.');
 const wx=new Float64Array(4),wy=new Float64Array(4),dx=new Float64Array(4),dy=new Float64Array(4);
 const basis=(t,w,d)=>{w[0]=(1-t)**3/6;w[1]=(3*t*t*t-6*t*t+4)/6;w[2]=(-3*t*t*t+3*t*t+3*t+1)/6;w[3]=t*t*t/6;d[0]=-.5*(1-t)**2/STEP;d[1]=(1.5*t*t-2*t)/STEP;d[2]=(-1.5*t*t+t+.5)/STEP;d[3]=.5*t*t/STEP;};
 return{
  metrics:{grid:[NX,NY],step:STEP,sampledHits:hits,clearance:CLEARANCE,envelopeMargin:ENVELOPE_MARGIN,temporaryFieldBytes:raw.byteLength+weight.byteLength+height.byteLength,samplingMs:performance.now()-started},
  sample(x,y,out){
   const u=(x-X0)/STEP,v=(y-Y0)/STEP,i=Math.floor(u),j=Math.floor(v);
   if(i<1||j<1||i>=NX-2||j>=NY-2){out.fill(0);return false;}
   basis(u-i,wx,dx);basis(v-j,wy,dy);let a=0,ax=0,ay=0,w=0,gx=0,gy=0;
   for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const k=(j+row-1)*NX+i+col-1,valid=weight[k];if(valid===0)continue;
    const b=valid*wx[col]*wy[row],bx=valid*dx[col]*wy[row],by=valid*wx[col]*dy[row];
    w+=b;gx+=bx;gy+=by;a+=b*height[k];ax+=bx*height[k];ay+=by*height[k];
   }
   if(w===0){out.fill(0);return false;}
   const z=a/w;out[0]=z;out[1]=(ax-z*gx)/w;out[2]=(ay-z*gy)/w;out[3]=w;out[4]=gx;out[5]=gy;return true;
  }
 };
}

function fieldAt(support,x,y,z,strength,sample,out){
 out.fill(0);if(y>=PIN_Y||!support.sample(x,y,sample))return;
 const d=z-sample[0];if(d<=0)return;
 const u=clamp((PIN_Y-y)/(PIN_Y-FULL_Y)),gate=s5(u),gateY=u>0&&u<1?-ds5(u)/(PIN_Y-FULL_Y):0;
 const t=Math.min(1,d/HINGE),hp=s5(t),h=d>=HINGE?d-HINGE*.5:HINGE*(t**6-3*t**5+2.5*t**4);
 const w=sample[3]*gate,wx=sample[4]*gate,wy=sample[5]*gate+sample[3]*gateY;
 out[0]=-strength*w*h;
 out[1]=-strength*(wx*h-w*hp*sample[1]);
 out[2]=-strength*(wy*h-w*hp*sample[2]);
 out[3]=-strength*w*hp;
}

export function applyHairContact131(model,{strength=0}={}){
 if(!model?.isObject3D)throw new TypeError('131 needs the original portrait model.');
 if(!Number.isFinite(strength)||strength<0||strength>.9)throw new RangeError('131 strength must be within 0 through .9.');
 const prior=applications.get(model);if(prior){if(prior.strength!==strength)throw new Error('131 requires a fresh scene for a different strength.');return prior;}
 if(strength===0)return OFF;
 const started=performance.now(),hair=model.getObjectByName('Original reference-directed chestnut layered groom');
 if(!hair)throw new Error('131 requires the accepted groom.');
 model.updateWorldMatrix(true,true);
 const inverseModel=model.matrixWorld.clone().invert(),records=[],seen=new Set();
 hair.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const geometry=mesh.geometry,p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
  if(seen.has(geometry)||mesh.isInstancedMesh||mesh.isSkinnedMesh)throw new Error('131 expects unique static hair geometries.');seen.add(geometry);
  if(!p||!n||p.itemSize!==3||n.itemSize!==3||p.count!==n.count||p.isInterleavedBufferAttribute||n.isInterleavedBufferAttribute)throw new Error('131 requires explicit position and normal arrays.');
  const m=new Matrix4().multiplyMatrices(inverseModel,mesh.matrixWorld),det=m.determinant();if(!Number.isFinite(det)||Math.abs(det)<1e-12)throw new Error('131 has a singular hair transform.');
  records.push({mesh,geometry,p,n,m:m.elements,b:m.clone().invert().elements});
 });
 const support=makeSupport(),sample=new Float64Array(6),field=new Float64Array(4),staged=[];
 // A small finite-difference check targets the actual support interpolation,
 // positive-depth hinge and gate derivatives used by the normal transport.
 const check={samples:0,maximumGradientError:0},a0=new Float64Array(4),a1=new Float64Array(4),a2=new Float64Array(4),epsilon=1e-5;
 for(const x of[-1.4,-.85,.85,1.4])for(const y of[-.7,0,.65,1.2])for(const z of[.8,1.05]){
  const point=[x,y,z];fieldAt(support,x,y,z,strength,sample,a0);
  for(let axis=0;axis<3;axis++){
   point[axis]+=epsilon;fieldAt(support,...point,strength,sample,a1);point[axis]-=2*epsilon;fieldAt(support,...point,strength,sample,a2);point[axis]+=epsilon;
   check.maximumGradientError=Math.max(check.maximumGradientError,Math.abs((a1[0]-a2[0])/(2*epsilon)-a0[axis+1]));check.samples++;
  }
 }
 if(check.maximumGradientError>1e-5)throw new Error('131 support gradient validation failed.');
 const metrics={version:VERSION,strength,applied:true,pinModelY:PIN_Y,fullModelY:FULL_Y,hingeWidth:HINGE,conservativeMinimumJacobian:1-strength,minimumJacobian:1,maximumModelPull:0,meshes:records.length,changedMeshes:0,vertices:0,changedVertices:0,protectedUpperVertices:0,unchangedBelowSupport:0,stagingBytes:0,zeroNormalsPreserved:0,maximumNormalLengthError:0,support:support.metrics,retainedExtraGeometryBytes:0,retainedExtraTextureBytes:0,perFrameWork:false,meshChanges:[],elapsedMs:0};
 metrics.gradientCheck=check;
 for(const r of records){
  const{p,n,m,b}=r,vx=b[8],vy=b[9],vz=b[10];let positions,normals,count=0,maxPull=0;
  metrics.vertices+=p.count;
  for(let i=0;i<p.count;i++){
   const k=i*3,x=p.array[k],y=p.array[k+1],z=p.array[k+2],nx=n.array[k],ny=n.array[k+1],nz=n.array[k+2];
   if(!Number.isFinite(x+y+z+nx+ny+nz))throw new Error('131 found nonfinite source geometry.');
   const xx=m[0]*x+m[4]*y+m[8]*z+m[12],yy=m[1]*x+m[5]*y+m[9]*z+m[13],zz=m[2]*x+m[6]*y+m[10]*z+m[14];
   if(yy>=PIN_Y){metrics.protectedUpperVertices++;continue;}
   fieldAt(support,xx,yy,zz,strength,sample,field);const amount=field[0];
   if(amount===0){metrics.unchangedBelowSupport++;continue;}
   const gx=field[1]*m[0]+field[2]*m[1]+field[3]*m[2],gy=field[1]*m[4]+field[2]*m[5]+field[3]*m[6],gz=field[1]*m[8]+field[2]*m[9]+field[3]*m[10],det=1+vx*gx+vy*gy+vz*gz;
   if(!Number.isFinite(amount+gx+gy+gz+det)||det<1-strength-1e-10)throw new Error('131 failed its monotone-field bound.');
   if(!positions){positions=p.array.slice();normals=n.array.slice();metrics.stagingBytes+=positions.byteLength+normals.byteLength;}
   positions[k]=x+amount*vx;positions[k+1]=y+amount*vy;positions[k+2]=z+amount*vz;
   const projection=(vx*nx+vy*ny+vz*nz)/det,a=nx-gx*projection,bb=ny-gy*projection,c=nz-gz*projection,length=Math.hypot(a,bb,c);
   if(length>0){normals[k]=a/length;normals[k+1]=bb/length;normals[k+2]=c/length;metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,Math.abs(Math.hypot(normals[k],normals[k+1],normals[k+2])-1));}
   else metrics.zeroNormalsPreserved++;
   metrics.minimumJacobian=Math.min(metrics.minimumJacobian,det);maxPull=Math.max(maxPull,-amount);count++;
  }
  if(count){staged.push({...r,positions,normals});metrics.changedMeshes++;metrics.changedVertices+=count;metrics.maximumModelPull=Math.max(metrics.maximumModelPull,maxPull);}
  metrics.meshChanges.push({mesh:r.mesh.name,vertices:p.count,changedVertices:count,maximumModelPull:maxPull});
 }
 // Stage before committing. The existing attributes retain their identities;
 // only their owned positions/normals change before the first renderer exists.
 for(const r of staged){r.p.array.set(r.positions);r.n.array.set(r.normals);r.p.needsUpdate=true;r.n.needsUpdate=true;r.geometry.computeBoundingBox();r.geometry.computeBoundingSphere();}
 metrics.elapsedMs=performance.now()-started;applications.set(model,metrics);return metrics;
}
