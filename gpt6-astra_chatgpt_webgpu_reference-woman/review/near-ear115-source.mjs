// Geometry-only source harness. No production imports or image assets execute.
import {THREE,V,Attr,Geometry,Matrix4,read} from './torso-depth110-harness.mjs';

// Ear source uses centripetal Catmull-Rom and200-segment arc-length lookup.
// Implement that math locally rather than substituting the older uniform groom
// curve. Native Three remains the final check for float-rounding equivalence.
class EarCurve{
 constructor(points,closed=false,type='centripetal',tension=.5){this.points=points;this.closed=closed;this.type=type;this.tension=tension;}
 getPoint(t){
  const ps=this.points,l=ps.length,p=(this.closed?l:l-1)*t;let i=Math.floor(p),u=p-i;
  if(!this.closed&&i===l-1){i=l-2;u=1;}
  const point=k=>this.closed?ps[(k%l+l)%l]:k<0?ps[0].clone().multiplyScalar(2).sub(ps[1]):k>=l?ps[l-1].clone().multiplyScalar(2).sub(ps[l-2]):ps[k];
  const p0=point(i-1),p1=point(i),p2=point(i+1),p3=point(i+2),distance=(a,b)=>((a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2)**.25;
  let d0=distance(p0,p1),d1=distance(p1,p2),d2=distance(p2,p3);if(d1<1e-4)d1=1;if(d0<1e-4)d0=d1;if(d2<1e-4)d2=d1;
  const out=new V();for(const k of['x','y','z']){
   const a=p0[k],b=p1[k],c=p2[k],d=p3[k],m0=((b-a)/d0-(c-a)/(d0+d1)+(c-b)/d1)*d1,m1=((c-b)/d1-(d-b)/(d1+d2)+(d-c)/d2)*d1;
   out[k]=(2*u*u*u-3*u*u+1)*b+(u*u*u-2*u*u+u)*m0+(-2*u*u*u+3*u*u)*c+(u*u*u-u*u)*m1;
  }return out;
 }
 getSpacedPoints(count){
  const lengths=[0];let old=this.getPoint(0),sum=0;
  for(let i=1;i<=200;i++){const p=this.getPoint(i/200);sum+=Math.hypot(p.x-old.x,p.y-old.y,p.z-old.z);lengths.push(sum);old=p;}
  return Array.from({length:count+1},(_,i)=>{const target=i/count*sum;let lo=0,hi=200;while(lo<hi){const m=(lo+hi)>>1;if(lengths[m]<target)lo=m+1;else hi=m;}const b=Math.max(1,lo),a=b-1,t=(target-lengths[a])/(lengths[b]-lengths[a]);return this.getPoint((a+t)/200);});
 }
}
THREE.Color.prototype.set=function(value){Object.assign(this,new THREE.Color(value));return this;};
// Pigment is not reconstructed for source art; only unchanged attribute bytes
// within each fixture are audited. Native keeps the actual accepted70 colors.
THREE.Color.prototype.offsetHSL=function(){return this;};
class EarMaterial{constructor(){this.color=new THREE.Color();this.sheenColor=new THREE.Color();this.emissive=new THREE.Color();}clone(){return new EarMaterial();}}
const EAR_THREE={...THREE,CatmullRomCurve3:EarCurve,MeshPhysicalMaterial:EarMaterial};
const earSource=new Function('THREE',read('src/ear.js')+'\nreturn createEar;')(EAR_THREE);
const face=new Function('THREE',read('src/face.js')+'\nreturn {profile,faceZ,portraitY};')(THREE);
const fit=new Function('Matrix4',read('src/portrait-proportions.js')+'\nreturn lowerFaceWarp;')(Matrix4);

export function sourceEar(side=-1){
 const group=earSource(side,null),mesh=group.children[0],p=mesh.geometry.getAttribute('position'),n=mesh.geometry.getAttribute('normal');
 for(let i=0;i<p.count;i++){const y=p.getY(i),f=fit(y),nx=n.getX(i),ny=n.getY(i)/(1+f.derivative),nz=n.getZ(i),l=Math.hypot(nx,ny,nz);p.setY(i,y+f.displacement);if(l)n.setXYZ(i,nx/l,ny/l,nz/l);}
 return mesh;
}

// The actual primary-face source grid, with the same Float32 roundings before
// portraitY and50. Eye holes are irrelevant to this near-side support region;
// retain only original grid triangles entirely on the negative-X side.
export function sourceHeadSide(){
 const nx=380,ny=290,p=new Float32Array((nx+1)*(ny+1)*3),index=[];
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const y=-1.18+j/ny*2.72,a=-Math.PI+i/nx*2*Math.PI,[w,front,rear]=face.profile(y),x=w*Math.sin(a),z=Math.cos(a)>=0?face.faceZ(x,y):rear*Math.cos(a),at=(j*(nx+1)+i)*3;p[at]=x;p[at+1]=y;p[at+2]=z;
 }
 for(let i=0;i<p.length;i+=3){p[i+1]=face.portraitY(p[i+1]);p[i+1]+=fit(p[i+1]).displacement;}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const a=j*(nx+1)+i,b=a+nx+1;
  if(Math.max(p[a*3],p[(a+1)*3],p[b*3],p[(b+1)*3])<-.5)index.push(a,a+1,b,b,a+1,b+1);
 }
 return new Geometry().setAttribute('position',new Attr(p,3)).setIndex(index);
}

export function sideSupportAt(geometry,y,z){
 const p=geometry.getAttribute('position'),idx=geometry.index;let x=Infinity,hits=0;
 for(let k=0;k<idx.count;k+=3){
  const a=idx.getX(k),b=idx.getX(k+1),c=idx.getX(k+2),ay=p.getY(a),az=p.getZ(a),by=p.getY(b),bz=p.getZ(b),cy=p.getY(c),cz=p.getZ(c);
  if(y<Math.min(ay,by,cy)-1e-9||y>Math.max(ay,by,cy)+1e-9||z<Math.min(az,bz,cz)-1e-9||z>Math.max(az,bz,cz)+1e-9)continue;
  const den=(bz-cz)*(ay-cy)+(cy-by)*(az-cz);if(Math.abs(den)<1e-14)continue;
  const u=((bz-cz)*(y-cy)+(cy-by)*(z-cz))/den,v=((cz-az)*(y-cy)+(ay-cy)*(z-cz))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-8)continue;
  x=Math.min(x,u*p.getX(a)+v*p.getX(b)+w*p.getX(c));hits++;
 }return{x,hits};
}

export {THREE,Attr,Geometry,Matrix4};
