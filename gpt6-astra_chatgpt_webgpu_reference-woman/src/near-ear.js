import { Matrix4 } from 'three';

// Isolated115: after accepted70 ear pigment, before99 portrait balance.
// Only the near/left closed ear shell moves. Its supported inner cartilage,
// face, other ear, hair, colors, UVs and triangle connectivity are retained.
const VERSION='near-ear-outer-cartilage-yaw-115';
const HINGE_X=-.73,HINGE_Z=.22,PIN_X=-.790,FULL_X=-.920;
const CONTACT_BAND=.005,SPAN=PIN_X-FULL_X;
const applications=new WeakMap(),DEFAULT_OPTIONS=Object.freeze({degrees:0});
const ZERO=Object.freeze({version:VERSION,degrees:0,applied:false,changedVertices:0,minimumJacobian:1,elapsedMs:0});
const now=()=>typeof performance==='object'?performance.now():Date.now();

// Head-local angular deformation and its2×2 X/Z Jacobian. Y is fixed.
// The inner strip has zero value, first derivative and second derivative.
function sample(x,z,theta,out){
 if(x>=PIN_X||theta===0){out[0]=x;out[1]=z;out[2]=1;out[3]=0;out[4]=0;out[5]=1;out[6]=1;out[7]=0;return;}
 const t=Math.min(1,(PIN_X-x)/SPAN),w=t*t*t*(t*(t*6-15)+10),wx=t<1?-30*t*t*(1-t)*(1-t)/SPAN:0;
 const a=theta*w,ax=theta*wx,c=Math.cos(a),s=Math.sin(a),qx=x-HINGE_X,qz=z-HINGE_Z,rx=c*qx+s*qz,rz=-s*qx+c*qz;
 out[0]=HINGE_X+rx;out[1]=HINGE_Z+rz;
 out[2]=c+ax*rz;out[3]=s;out[4]=-s-ax*rx;out[5]=c;
 out[6]=1+ax*qz;out[7]=w;
}

function frame(head,mesh){
 const h=head.matrixWorld.clone().invert(),m=new Matrix4().multiplyMatrices(h,mesh.matrixWorld),det=m.determinant();
 if(!Number.isFinite(det)||Math.abs(det)<1e-14)throw new Error('Near-ear mesh transforms must be finite and invertible.');
 const b=m.clone().invert();for(const a of[m.elements,b.elements])for(const x of a)if(!Number.isFinite(x))throw new Error('Nonfinite near-ear transform.');
 if(Math.max(Math.abs(m.elements[3]),Math.abs(m.elements[7]),Math.abs(m.elements[11]),Math.abs(m.elements[15]-1))>1e-12)throw new Error('Near-ear yaw requires affine transforms.');
 return{m:m.elements,b:b.elements};
}

// Build only triangles near the actual shell and its prospective posterior
// extent. Ray intersections use real continuous-face geometry, not an assumed
// ellipse or a floating coordinate landmark. The temporary arrays are released.
function supportSurface(head,face,bounds){
 const p=face.geometry?.getAttribute('position'),idx=face.geometry?.index;
 if(!p||p.itemSize!==3||!idx)throw new Error('Near-ear support requires the indexed continuous-face surface.');
 const {m}=frame(head,face),q=new Float64Array(p.count*3);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),j=i*3;
  q[j]=m[0]*x+m[4]*y+m[8]*z+m[12];q[j+1]=m[1]*x+m[5]*y+m[9]*z+m[13];q[j+2]=m[2]*x+m[6]*y+m[10]*z+m[14];
  if(!Number.isFinite(q[j]+q[j+1]+q[j+2]))throw new Error('Nonfinite facial support geometry.');
 }
 const selected=[];
 for(let k=0;k<idx.count;k+=3){
  const a=idx.getX(k)*3,b=idx.getX(k+1)*3,c=idx.getX(k+2)*3;
  if(Math.max(q[a],q[b],q[c])>=-.50)continue;
  if(Math.max(q[a+1],q[b+1],q[c+1])<bounds.minY-.012||Math.min(q[a+1],q[b+1],q[c+1])>bounds.maxY+.012||Math.max(q[a+2],q[b+2],q[c+2])<bounds.minZ-.012||Math.min(q[a+2],q[b+2],q[c+2])>bounds.maxZ+.012)continue;
  for(const i of[a,b,c])selected.push(q[i],q[i+1],q[i+2]);
 }
 if(!selected.length)throw new Error('No near-side facial support triangles intersect the ear region.');
 return new Float64Array(selected);
}
function supportAt(tri,y,z){
 let near=Infinity;
 for(let k=0;k<tri.length;k+=9){
  const ay=tri[k+1],az=tri[k+2],by=tri[k+4],bz=tri[k+5],cy=tri[k+7],cz=tri[k+8];
  if(y<Math.min(ay,by,cy)-1e-9||y>Math.max(ay,by,cy)+1e-9||z<Math.min(az,bz,cz)-1e-9||z>Math.max(az,bz,cz)+1e-9)continue;
  const den=(bz-cz)*(ay-cy)+(cy-by)*(az-cz);if(Math.abs(den)<1e-14)continue;
  const u=((bz-cz)*(y-cy)+(cy-by)*(z-cz))/den,v=((cz-az)*(y-cy)+(ay-cy)*(z-cz))/den,w=1-u-v;
  if(Math.min(u,v,w)<-1e-8)continue;
  near=Math.min(near,u*tri[k]+v*tri[k+3]+w*tri[k+6]);
 }return near;
}

/**
 * Negative degrees rotate the free rim posteriorly around the head Y axis.
 * Native comparison presets are0/-15/-25; -35 is an audit stress limit.
 * A fresh head is required to compare a different nonzero setting.
 */
export function applyNearEarYaw115(head,options=DEFAULT_OPTIONS){
 const degrees=Number(options.degrees??0);
 if(!Number.isFinite(degrees)||degrees>0||degrees< -35)throw new RangeError('Near-ear yaw must be between-35 and0 degrees.');
 if(!head?.isObject3D)throw new TypeError('Pass the anatomical head group.');
 const previous=applications.get(head);
 if(previous){if(previous.degrees!==degrees)throw new Error('Near-ear yaw already differs; compare a freshly built head.');return previous.metrics;}
 if(degrees===0)return ZERO;
 const started=now(),theta=degrees*Math.PI/180;
 head.updateWorldMatrix(true,true);
 const det=head.matrixWorld.determinant();if(!Number.isFinite(det)||Math.abs(det)<1e-14)throw new Error('The head transform must be invertible.');
 let ear=null,face=null,earCount=0;
 head.traverse(o=>{
  if(!o.isMesh)return;if(o.name==='continuous-face')face=o;
  if(o.name!=='ear-continuous-anatomical-shell')return;
  for(let p=o;p&&p!==head;p=p.parent)if(p.name==='left-ear'){ear=o;earCount++;break;}
 });
 if(earCount!==1||!face)throw new Error('Expected one near/left ear shell and the existing continuous-face mesh.');
 if(ear.isSkinnedMesh||ear.isInstancedMesh)throw new Error('Near-ear yaw expects the current explicit static shell.');
 const original=ear.geometry,p=original.getAttribute('position'),n=original.getAttribute('normal');
 if(!p||!n||p.itemSize!==3||n.itemSize!==3||p.count!==n.count||p.isInterleavedBufferAttribute||n.isInterleavedBufferAttribute||p.normalized||n.normalized||!original.index)throw new Error('Unsupported near-ear position/normal storage.');
 if(original.getAttribute('tangent')||Object.values(original.morphAttributes||{}).some(a=>a.length))throw new Error('The accepted near-ear shell has no authored tangents or morph targets.');
 const {m,b}=frame(head,ear),points=new Float64Array(p.count*3),out=new Float64Array(8),bounds={minY:Infinity,maxY:-Infinity,minZ:Infinity,maxZ:-Infinity};
 const metrics={version:VERSION,degrees,applied:true,hinge:{x:HINGE_X,z:HINGE_Z},pinX:PIN_X,fullTurnX:FULL_X,vertices:p.count,triangles:original.index.count/3,changedVertices:0,pinnedVertices:0,embeddedVertices:0,nearSurfaceVertices:0,anchoredVertices:0,supportedVerticesMoved:0,minimumEmbeddedX:Infinity,minimumNearSurfaceX:Infinity,minimumJacobian:1,analyticMinimumJacobian:1,maximumJacobian:1,maximumPosteriorDisplacement:0,maximumAnteriorDisplacement:0,maximumLateralDisplacement:0,maximumHeadYRoundoff:0,maximumNormalLengthError:0,zeroNormalsPreserved:0,newlyEmbeddedVertices:0,maximumNewEmbedding:0,sourceAttachmentTriangles:0,stagedAttributeBytes:p.array.byteLength+n.array.byteLength,elapsedMs:0};
 let minZ=Infinity;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(!Number.isFinite(x+y+z+n.getX(i)+n.getY(i)+n.getZ(i)))throw new Error('Nonfinite original near-ear geometry.');
  const xx=m[0]*x+m[4]*y+m[8]*z+m[12],yy=m[1]*x+m[5]*y+m[9]*z+m[13],zz=m[2]*x+m[6]*y+m[10]*z+m[14];points[i*3]=xx;points[i*3+1]=yy;points[i*3+2]=zz;
  sample(xx,zz,theta,out);if(!(out[6]>.45))throw new Error('Near-ear yaw would exceed its local compression budget.');
  metrics.minimumJacobian=Math.min(metrics.minimumJacobian,out[6]);metrics.maximumJacobian=Math.max(metrics.maximumJacobian,out[6]);minZ=Math.min(minZ,zz);
  bounds.minY=Math.min(bounds.minY,yy);bounds.maxY=Math.max(bounds.maxY,yy);bounds.minZ=Math.min(bounds.minZ,zz,out[1]);bounds.maxZ=Math.max(bounds.maxZ,zz,out[1]);
 }
 metrics.analyticMinimumJacobian=1-Math.abs(theta)*1.875/SPAN*Math.max(0,HINGE_Z-minZ);
 if(metrics.analyticMinimumJacobian<=.40)throw new Error('Near-ear yaw lacks a comfortable conservative shell bound.');
 const triangles=supportSurface(head,face,bounds),supports=new Float64Array(p.count);metrics.sourceAttachmentTriangles=triangles.length/9;
 for(let i=0;i<p.count;i++){
  const x=points[i*3],y=points[i*3+1],z=points[i*3+2],surface=supportAt(triangles,y,z);supports[i]=surface;
  if(!Number.isFinite(surface))throw new Error('A near-ear vertex has no actual facial support ray.');
  const margin=x-surface;
  if(margin>=0){metrics.embeddedVertices++;metrics.minimumEmbeddedX=Math.min(metrics.minimumEmbeddedX,x);}
  if(Math.abs(margin)<=CONTACT_BAND){metrics.nearSurfaceVertices++;metrics.minimumNearSurfaceX=Math.min(metrics.minimumNearSurfaceX,x);}
  if(margin>=-CONTACT_BAND){metrics.anchoredVertices++;if(x<PIN_X)throw new Error('The pinned strip misses an actual ear/face attachment vertex.');}
  if(x>=PIN_X)metrics.pinnedVertices++;
 }
 if(metrics.embeddedVertices<16||metrics.nearSurfaceVertices<8)throw new Error('The proposed hinge lacks an established ear/face attachment.');

 let staged;
 try{
  staged=original.clone();for(const name of Object.keys(original.attributes))if(name!=='position'&&name!=='normal')staged.setAttribute(name,original.getAttribute(name));staged.setIndex(original.index);
  const pp=staged.getAttribute('position'),nn=staged.getAttribute('normal');
  for(let i=0;i<p.count;i++){
   const x=points[i*3],y=points[i*3+1],z=points[i*3+2];sample(x,z,theta,out);if(out[7]===0)continue;
   const xx=out[0],zz=out[1],a=out[2],c=out[3],d=out[4],e=out[5],jac=out[6];
   const oldX=p.getX(i),oldY=p.getY(i),oldZ=p.getZ(i),dx=xx-x,dz=zz-z;
   // Add inverse-linear displacement, retaining exact untouched coordinates.
   pp.setXYZ(i,oldX+b[0]*dx+b[8]*dz,oldY+b[1]*dx+b[9]*dz,oldZ+b[2]*dx+b[10]*dz);
   const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),hx=b[0]*nx+b[1]*ny+b[2]*nz,hy=b[4]*nx+b[5]*ny+b[6]*nz,hz=b[8]*nx+b[9]*ny+b[10]*nz;
   const tx=(e*hx-d*hz)/jac,ty=hy,tz=(-c*hx+a*hz)/jac;
   const lx=m[0]*tx+m[1]*ty+m[2]*tz,ly=m[4]*tx+m[5]*ty+m[6]*tz,lz=m[8]*tx+m[9]*ty+m[10]*tz,length=Math.hypot(lx,ly,lz);
   if(!Number.isFinite(length+pp.getX(i)+pp.getY(i)+pp.getZ(i)))throw new Error('Nonfinite staged near-ear geometry.');
   if(length){nn.setXYZ(i,lx/length,ly/length,lz/length);const error=Math.abs(Math.hypot(nn.getX(i),nn.getY(i),nn.getZ(i))-1);if(error>2e-6)throw new Error('A staged ear normal failed unit-length validation.');metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,error);}else metrics.zeroNormalsPreserved++;
   metrics.changedVertices++;metrics.maximumPosteriorDisplacement=Math.max(metrics.maximumPosteriorDisplacement,-dz);metrics.maximumAnteriorDisplacement=Math.max(metrics.maximumAnteriorDisplacement,dz);metrics.maximumLateralDisplacement=Math.max(metrics.maximumLateralDisplacement,Math.abs(dx));
   const lx2=pp.getX(i)-oldX,ly2=pp.getY(i)-oldY,lz2=pp.getZ(i)-oldZ;metrics.maximumHeadYRoundoff=Math.max(metrics.maximumHeadYRoundoff,Math.abs(m[1]*lx2+m[5]*ly2+m[9]*lz2));
   const beforeMargin=x-supports[i],afterSupport=supportAt(triangles,y,zz);if(!Number.isFinite(afterSupport))throw new Error('The rotated cartilage leaves the audited facial support region.');
   if(beforeMargin< -CONTACT_BAND&&xx>afterSupport){metrics.newlyEmbeddedVertices++;metrics.maximumNewEmbedding=Math.max(metrics.maximumNewEmbedding,xx-afterSupport);}
  }
  if(metrics.maximumAnteriorDisplacement>1e-10)throw new Error('The negative yaw moved free cartilage anteriorly.');
  pp.needsUpdate=true;nn.needsUpdate=true;staged.computeBoundingBox();staged.computeBoundingSphere();
 }catch(error){staged?.dispose();throw error;}
 ear.geometry=staged;metrics.elapsedMs=now()-started;applications.set(head,{degrees,metrics});return metrics;
}
