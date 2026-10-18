import * as THREE from 'three';
import { faceZ } from './face.js';

// Original groom: a continuous opaque hair mass supplies coverage at portrait
// resolution; independently groomed fine ribbons supply its surface fibers.
// Every map below is mathematical. No hair photograph or external asset is used.
const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
function rng(seed=981447){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
const warp=[[-1.18,-1.18],[-.96,-1.04],[-.639,-.79],[-.26,-.475],[.25,.050],[.67,.505],[1.12,1.06],[1.54,1.54]];
function warpedY(y){let i=0;while(i<warp.length-2&&y>warp[i+1][0])i++;const p=warp[i],q=warp[i+1],a=warp[Math.max(0,i-1)],b=warp[Math.min(warp.length-1,i+2)],h=q[0]-p[0],t=(y-p[0])/h,m0=(q[1]-a[1])/(q[0]-a[0]),m1=(b[1]-p[1])/(b[0]-p[0]);return(2*t*t*t-3*t*t+1)*p[1]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*q[1]+(t*t*t-t*t)*h*m1;}
function inverseY(y){let lo=-1.18,hi=1.54;for(let i=0;i<18;i++){let m=(lo+hi)/2;if(warpedY(m)<y)lo=m;else hi=m;}return(lo+hi)/2;}
function foreheadSampler(){
 const nx=145,ny=113,dx=1.8/(nx-1),dy=1.4/(ny-1),d=new Float32Array(nx*ny);
 for(let j=0;j<ny;j++){let y=inverseY(.12+j*dy);for(let i=0;i<nx;i++)d[j*nx+i]=faceZ(-.9+i*dx,y);}
 return(x,y)=>{const u=clamp((x+.9)/dx,0,nx-1.00001),v=clamp((y-.12)/dy,0,ny-1.00001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;return(1-b)*((1-a)*d[j*nx+i]+a*d[j*nx+i+1])+b*((1-a)*d[(j+1)*nx+i]+a*d[(j+1)*nx+i+1]);};
}
function scalp(theta,phi,lift=0){const s=Math.sin(theta),c=Math.cos(theta);return[.012+(.88+lift)*s*Math.sin(phi),.335+(1.267+lift*.25)*c,-.083+(.818+lift)*s*Math.cos(phi)];}
function rootAt(z,side=1,lane=0){const q=(z+.083)/.848;return[.19+side*(.014+lane*.035),.348+1.272*Math.sqrt(Math.max(.03,1-q*q))-.025,z];}
function controls(points){const a=new Float32Array(points.length*3);for(let i=0;i<points.length;i++)a.set(points[i],i*3);return a;}
function sample(points,t,out){const n=points.length/3,s=clamp(t)*(n-1),i=Math.min(n-2,Math.floor(s)),u=s-i,u2=u*u,u3=u2*u,a=Math.max(0,i-1)*3,b=i*3,c=(i+1)*3,d=Math.min(n-1,i+2)*3;for(let k=0;k<3;k++){const p0=points[a+k],p1=points[b+k],p2=points[c+k],p3=points[d+k];out[k]=.5*(2*p1+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u2+(-p0+3*p1-3*p2+p3)*u3);}}
function compensate(p,headTilt){const w=1-smooth(-1.65,.42,p[1]),ay=-.16*w,az=-headTilt*w,cy=Math.cos(ay),sy=Math.sin(ay),cz=Math.cos(az),sz=Math.sin(az),x=p[0]*cy+p[2]*sy,z=-p[0]*sy+p[2]*cy;p[0]=x*cz-p[1]*sz;p[1]=x*sz+p[1]*cz;p[2]=z;}
function frame(points,t,front){
 const p=[0,0,0],a=[0,0,0],b=[0,0,0];sample(points,t,p);sample(points,Math.max(0,t-.0002),a);sample(points,Math.min(1,t+.0002),b);
 const tangent=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();
 let normal=new THREE.Vector3(front?p[0]*.07:p[0],.04,front?1:p[2]+.08).normalize();
 if(normal.lengthSq()<.01)normal.set(0,0,1);
 const sideways=new THREE.Vector3().crossVectors(tangent,normal).normalize();
 if(sideways.lengthSq()<.01)sideways.set(1,0,0);normal.crossVectors(sideways,tangent).normalize();
 return{p,t:tangent,s:sideways,n:normal};
}
function maps(){
 const w=512,h=1024,p=new Uint8Array(w*h*4),n=new Uint8Array(w*h*4),rand=rng(52341),lanes=128,shades=[],ends=[],phases=[];
 for(let i=0;i<lanes;i++){shades.push(.82+rand()*.17);ends.push(.86+rand()*.139);phases.push(rand()*TAU);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/(h-1),lane=Math.min(lanes-1,Math.floor(u*lanes)),q=u*lanes-lane,phase=phases[lane];
  const bend=.026*Math.sin(v*9+phase),ridge=Math.cos((q+bend)*TAU),shade=shades[lane]*(.962+.038*ridge)+.014*Math.sin(v*18+phase);
  const tip=1-smooth(ends[lane]-.021,ends[lane],v),edge=smooth(0,.018,u)*(1-smooth(.982,1,u));
  const k=(y*w+x)*4;p[k]=Math.round(255*clamp(shade));p[k+1]=Math.round(253*clamp(shade));p[k+2]=Math.round(254*clamp(shade));p[k+3]=Math.round(255*tip*edge);
  const nx=.115*Math.sin((q+bend)*TAU),ny=.004*Math.cos(v*9+phase),len=Math.hypot(nx,ny,1);n[k]=Math.round(127.5*(nx/len+1));n[k+1]=Math.round(127.5*(ny/len+1));n[k+2]=Math.round(127.5*(1/len+1));n[k+3]=255;
 }
 function make(data){const t=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;}
 const map=make(p),normalMap=make(n);map.colorSpace=THREE.SRGBColorSpace;map.name='Original continuous mathematical hair lanes and feathered tips';normalMap.name='Original fine longitudinal cuticle normal field';return{map,normalMap};
}
const batch=()=>({p:[],c:[],uv:[],i:[]});
function vertex(b,p,c,uv){const i=b.p.length/3;b.p.push(p[0],p[1],p[2]);b.c.push(c.r,c.g,c.b);b.uv.push(uv[0],uv[1]);return i;}
function mesh(b,material,name){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.i);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();const o=new THREE.Mesh(g,material);o.name=name;o.castShadow=true;o.receiveShadow=true;return o;}
function patch(b,groom,headTilt){
 const steps=64,around=10,start=b.p.length/3;
 for(let j=0;j<=steps;j++){
  const t=j/steps,f=frame(groom.c,t,groom.front),shape=(.055+.945*smooth(0,.075,t))*(1-.89*smooth(.79,1,t));
  for(let k=0;k<=around;k++){
   const a=k/around*TAU,cs=Math.cos(a),sn=Math.sin(a),wr=groom.w*shape*(1+.018*Math.sin(t*31+groom.phase));
   const p=[f.p[0]+f.s.x*wr*cs+f.n.x*groom.d*shape*sn,f.p[1]+f.s.y*wr*cs+f.n.y*groom.d*shape*sn,f.p[2]+f.s.z*wr*cs+f.n.z*groom.d*shape*sn];
   compensate(p,headTilt);vertex(b,p,groom.color,[k/around,t]);
  }
 }
 for(let j=0;j<steps;j++)for(let k=0;k<around;k++){const a=start+j*(around+1)+k,c=a+around+1;b.i.push(a,c,a+1,a+1,c,c+1);}
}
function cap(b,forehead,headTilt){
 const az=144,lat=46,start=b.p.length/3,base=new THREE.Color('#443338');
 for(let j=0;j<=lat;j++)for(let k=0;k<=az;k++){
  const phi=k/az*TAU,front=Math.max(0,Math.cos(phi)),ear=Math.exp(-Math.pow((phi-4.80)/.42,4));
  const limit=2.21-1.12*Math.pow(front,2.15)-.66*ear+.012*Math.sin(phi*43),theta=j/lat*limit,p=scalp(theta,phi,.006);
  if(front>.25&&p[1]>.14&&p[1]<1.42){const z=forehead(p[0],p[1]);p[2]=Math.max(p[2],z+.019*smooth(.09,.23,z));}
  compensate(p,headTilt);const c=base.clone().multiplyScalar(.94+.035*Math.sin(phi*3.7));vertex(b,p,c,[k/az,j/lat*.76]);
 }
 for(let j=0;j<lat;j++)for(let k=0;k<az;k++){const a=start+j*(az+1)+k,c=a+az+1;b.i.push(a,c,a+1,a+1,c,c+1);}
}
class RibbonBatch {
 constructor(counts,material,name,headTilt){
  this.nv=counts.reduce((s,[n,steps])=>s+n*(steps+1)*2,0);this.ni=counts.reduce((s,[n,steps])=>s+n*steps*6,0);
  this.p=new Float32Array(this.nv*3);this.n=new Float32Array(this.nv*3);this.c=new Float32Array(this.nv*3);this.uv=new Float32Array(this.nv*2);this.i=new Uint32Array(this.ni);
  this.v=0;this.e=0;this.strands=0;this.material=material;this.name=name;this.headTilt=headTilt;this.samples=new Float32Array(55*3);this.directions=new Float32Array(55*3);
 }
 groom(g,steps,random,color){
  const lane=random()*2-1,angle=random()*TAU,end=.885+random()*.114,phase=random()*TAU,offset=lane*g.w,normalSide=Math.sin(angle)>=0?1:-1;
  for(let j=0;j<=steps;j++){
   const t=j/steps,f=frame(g.c,t*end,g.front),grow=smooth(0,.11,t),fan=(.80+.20*Math.cos(t*1.8)),wave=.003*Math.sin(t*33+phase)+.0011*Math.sin(t*69+phase*1.4);
   const depth=normalSide*(g.d*Math.sqrt(Math.max(.01,1-lane*lane))+.0045);
   const p=[f.p[0]+f.s.x*(offset*grow*fan+wave)+f.n.x*depth*grow,f.p[1]+f.s.y*(offset*grow*fan+wave)+f.n.y*depth*grow,f.p[2]+f.s.z*(offset*grow*fan+wave)+f.n.z*depth*grow];
   const tip=smooth(.69,1,t);p[0]+=.018*Math.sin(phase)*tip;p[1]+=.025*Math.cos(phase*1.4)*tip;p[2]+=.012*Math.cos(phase)*tip;
   compensate(p,this.headTilt);this.samples.set(p,j*3);this.directions.set([f.n.x*normalSide,f.n.y*normalSide,f.n.z*normalSide],j*3);
  }
  this.emit(steps,.00125+random()*.00065,color,phase,.89+random()*.06);
 }
 curve(points,steps,width,color,phase,{hug=null,end=1}={}){
  const p=[0,0,0];
  for(let j=0;j<=steps;j++){
   const t=j/steps;sample(points,t*end,p);p[0]+=.0013*Math.sin(t*31+phase)*Math.sin(t*Math.PI);
   if(hug){const z=hug(p[0],Math.max(.17,p[1])),weight=smooth(.14,.33,p[1])*(1-smooth(1.22,1.48,p[1]))*smooth(.07,.20,z);p[2]+=(z+.014-p[2])*weight;}
   compensate(p,this.headTilt);this.samples.set(p,j*3);this.directions.set([0,0,1],j*3);
  }
  this.emit(steps,width,color,phase,.83);
 }
 emit(steps,width,color,phase,tip){
  const first=this.v,p=this.samples;
  for(let j=0;j<=steps;j++){
   const at=j*3,a=Math.max(0,j-1)*3,b=Math.min(steps,j+1)*3,t=j/steps;
   let tx=p[b]-p[a],ty=p[b+1]-p[a+1],tz=p[b+2]-p[a+2],l=Math.hypot(tx,ty,tz)||1;tx/=l;ty/=l;tz/=l;
   let nx=this.directions[at],ny=this.directions[at+1],nz=this.directions[at+2],dot=nx*tx+ny*ty+nz*tz;nx-=tx*dot;ny-=ty*dot;nz-=tz*dot;l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
   let sx=ty*nz-tz*ny,sy=tz*nx-tx*nz,sz=tx*ny-ty*nx;l=Math.hypot(sx,sy,sz)||1;sx/=l;sy/=l;sz/=l;
   const r=width*(.15+.85*smooth(0,.023,t))*(.055+.945*(1-smooth(tip,1,t))),shade=.91+.085*smooth(0,.13,t)+.014*Math.sin(t*7+phase);
   for(let k=0;k<2;k++){const side=k?1:-1,v=this.v++,q=v*3;this.p[q]=p[at]+sx*r*side;this.p[q+1]=p[at+1]+sy*r*side;this.p[q+2]=p[at+2]+sz*r*side;this.n[q]=nx;this.n[q+1]=ny;this.n[q+2]=nz;this.c[q]=color.r*shade;this.c[q+1]=color.g*shade;this.c[q+2]=color.b*shade;this.uv[v*2]=t;this.uv[v*2+1]=k;}
  }
  for(let j=0;j<steps;j++){const a=first+j*2,b=a+2;this.i[this.e++]=a;this.i[this.e++]=a+1;this.i[this.e++]=b;this.i[this.e++]=a+1;this.i[this.e++]=b+1;this.i[this.e++]=b;}
  this.strands++;
 }
 finish(){
  if(this.v!==this.nv||this.e!==this.ni)throw new Error('Dense groom allocation mismatch');
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.BufferAttribute(this.n,3));g.setAttribute('color',new THREE.BufferAttribute(this.c,3));g.setAttribute('uv',new THREE.BufferAttribute(this.uv,2));g.setIndex(new THREE.BufferAttribute(this.i,1));g.computeBoundingBox();g.computeBoundingSphere();
  const o=new THREE.Mesh(g,this.material);o.name=this.name;o.castShadow=false;o.receiveShadow=true;o.userData={independentFineRibbons:this.strands};return o;
 }
 bytes(){return this.p.byteLength+this.n.byteLength+this.c.byteLength+this.uv.byteLength+this.i.byteLength;}
}

export function createFiberHair({headTilt=-.17,strandBudget=20000}={}){
 const start=performance.now(),root=new THREE.Group();root.name='Original dense asymmetric chestnut groom';
 const random=rng(),forehead=foreheadSampler(),texture=maps(),n=Math.round(clamp(strandBudget,3000,24000));
 const material=new THREE.MeshPhysicalMaterial({vertexColors:true,map:texture.map,normalMap:texture.normalMap,normalScale:new THREE.Vector2(.60,.22),roughness:.64,metalness:0,anisotropy:.28,anisotropyRotation:Math.PI/2,specularIntensity:.12,specularColor:'#bca2a6',envMapIntensity:.40,alphaTest:.16,alphaToCoverage:true,side:THREE.DoubleSide});
 const fineMaterial=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.61,metalness:0,anisotropy:.20,specularIntensity:.105,specularColor:'#bca6aa',envMapIntensity:.36,side:THREE.DoubleSide});
 const palette=['#48373c','#524045','#403137','#5a474c','#614d52','#473539'].map(c=>new THREE.Color(c));
 const choose=()=>palette[Math.floor(random()*palette.length)],mass=batch(),scalpMass=batch(),guides=[];
 cap(scalpMass,forehead,headTilt);
 function addGuide(ps,w,d,color,front,phase,kind){const g={c:controls(ps),w,d,color:new THREE.Color(color),front,phase,kind};guides.push(g);patch(mass,g,headTilt);}
 // Rear layers overlap by more than half their width, supplying continuous
 // coverage from the crown to the irregular lower perimeter in all rear views.
 for(let k=0;k<28;k++){
  const q=k/27,phi=1.11+q*3.83,si=Math.sin(phi),co=Math.cos(phi),phase=phi*1.35,zroot=.19-.81*q,r=rootAt(zroot,si<0?-1:1,.35);
  const ps=[r,scalp(.51,phi,.026),scalp(1.02,phi,.038),scalp(1.55,phi,.045)];
  const end=-3.53+.22*Math.sin(phi*2.1)+.12*Math.sin(k*1.71);
  for(let j=0;j<7;j++){const t=j/6,y=-.36+t*(end+.36),wave=Math.sin(t*5.6+phase),radius=.94+.18*Math.sin(t*Math.PI*.95)+.035*wave;ps.push([si*radius+.06*Math.sin(t*5.0+phi*2.7),y,-.11+co*(.79+.065*Math.sin(t*Math.PI))+.05*Math.cos(t*5.1+phase)]);}
  addGuide(ps,.155+random()*.018,.044+random()*.008,k%4?'#4e3b40':'#59464a',false,phase,'back');
 }
 // Unequal overlapping front waves. The left sweep tucks behind the ear,
 // opens into an outward curl, and turns inward late. The right fan is fuller.
 for(const side of[-1,1]){
  const left=side<0,count=left?9:12;
  for(let k=0;k<count;k++){
   const q=k/(count-1),phase=k*.64+(left?.2:1.3),r=rootAt(.23-.62*q,side,.3+q*.4),end=(left?-3.75:-3.76)+.20*Math.sin(k*1.79+.5)+.13*(q-.5),ps=[r];
   if(left)ps.push([-.12-.10*q,1.55,.24-.15*q],[-.51-.07*q,1.24,.44-.07*q],[-.745-.042*q,.68,.26-.15*q],[-.85-.035*q,.16,-.17-.05*q],[-.85-.035*q,-.43,-.14-.04*q],[-.77-.20*q,-1.06,.28+.10*q],[-.73-.28*q,-1.67,.70+.09*Math.cos(phase)],[-.85-.42*q,-2.29,.82+.06*Math.sin(phase)],[-1.05-.30*q,-2.96,.90+.07*Math.cos(phase+.9)],[-.86-.28*q,end+.31,.78+.08*Math.sin(phase+1.1)],[-.67-.21*q,end,.63+.055*Math.cos(phase+1.5)]);
   else ps.push([.45+.08*q,1.44,.29-.14*q],[.72+.07*q,1.02,.43-.07*q],[.84+.03*q,.45,.32-.08*q],[.86+.05*q,-.20,.25-.04*q],[.76+.30*q,-.90,.47+.08*q],[.66+.45*q,-1.53,.74+.075*Math.sin(phase)],[.66+.65*q,-2.13,.87+.08*Math.cos(phase)],[.85+.53*q,-2.79,.98+.07*Math.sin(phase+.8)],[.84+.43*q,end+.38,.87+.06*Math.cos(phase+1.2)],[.61+.32*q,end,.69+.07*Math.sin(phase+1.6)]);
   for(let j=6;j<ps.length;j++){const t=(j-6)/(ps.length-6);ps[j][0]+=.046*Math.sin(phase+t*4.3);ps[j][2]+=.025*Math.sin(phase*.8+t*6);}
   addGuide(ps,left?.123+random()*.014:.131+random()*.020,.037+random()*.015,k%3?'#513d41':'#5a4449',true,phase,'front');
  }
 }
 // Additional flowing crown growth covers the full root region without a
 // sparse isolated fan, while following the off-center part into the sides.
 for(let k=0;k<18;k++){
  const q=k/17,phi=.62+q*5.04,side=Math.sin(phi)<0?-1:1,ps=[rootAt(.23-.76*q,side,.65)];
  for(let j=0;j<9;j++)ps.push(scalp(.29+j/8*(1.84-.29),phi,.021+.007*Math.sin(j*.5)));
  addGuide(ps,.091,.022,k%3?'#4d3a40':'#59454b',false,q*5,'crown');
 }
 const fringeCount=Math.floor(n*.075),flyCount=Math.floor(n*.008),bodyCount=n-fringeCount-flyCount,bodyCounts={front:0,back:0,crown:0};
 const perGuide=guides.map(g=>g.kind==='front'?1.8:g.kind==='back'?1.15:.65),total=perGuide.reduce((a,b)=>a+b,0),alloc=[];let allocated=0;
 for(let i=0;i<guides.length;i++){const count=i===guides.length-1?bodyCount-allocated:Math.floor(bodyCount*perGuide[i]/total);alloc.push(count);allocated+=count;bodyCounts[guides[i].kind]+=count;}
 const fibers=new RibbonBatch([[bodyCounts.front,32],[bodyCounts.back,28],[bodyCounts.crown,24],[fringeCount,30],[flyCount,24]],fineMaterial,'Dense original surface fibers and independent forehead fringe',headTilt);
 for(let i=0;i<guides.length;i++){const g=guides[i],steps=g.kind==='front'?32:g.kind==='back'?28:24;for(let j=0;j<alloc[i];j++)fibers.groom(g,steps,random,choose());}
 const bangGuides=[{x:-.64,y:-.18,w:.040,share:.23,lean:-.06},{x:-.44,y:.055,w:.038,share:.17,lean:-.028},{x:-.23,y:.16,w:.023,share:.08,lean:.025},{x:.035,y:.10,w:.034,share:.24,lean:.058},{x:.23,y:.22,w:.022,share:.10,lean:.070},{x:.40,y:.31,w:.016,share:.065,lean:.075},{x:.62,y:.09,w:.026,share:.115,lean:.055}];
 let done=0;
 for(let group=0;group<bangGuides.length;group++){
  const g=bangGuides[group],count=group===bangGuides.length-1?fringeCount-done:Math.floor(fringeCount*g.share);done+=count;
  for(let k=0;k<count;k++){
   const lane=(k+random())/count*2-1,offset=lane*g.w,phase=random()*TAU,ps=[[.17+(group-3)*.014,1.57,.16+random()*.15],[.115+g.lean,1.35,.49],[.09+g.x*.34+g.lean,1.04,.65],[g.x*.70+g.lean,.66,.71],[g.x+offset,g.y+.21,.70],[g.x+offset*1.30,g.y,.68]];
   for(let j=1;j<ps.length;j++){const p=ps[j];p[0]+=offset*smooth(0,1,j/(ps.length-1));const z=forehead(p[0],Math.max(.19,p[1]));if(p[1]<1.32&&z>.1)p[2]=z+.017+(k%4)*.0011+(p[1]<.19?(.19-p[1])*.05:0);}
   fibers.curve(controls(ps),30,.00063+random()*.00034,choose(),phase,{hug:forehead,end:.82+random()*.18});
  }
 }
 for(let k=0;k<flyCount;k++){
  const side=k%2?-1:1,phase=random()*TAU;let ps;
  if(k<flyCount*.40){const phi=side*(.72+random()*.70),theta=.32+random()*.55;ps=[];for(let j=0;j<8;j++)ps.push(scalp(theta+j*.13,phi,.025+.025*Math.sin(j/7*Math.PI)));}
  else if(k<flyCount*.63){ps=[[.12,1.53,.29],[-.28,1.16,.54],[-.52,.62,.57],[-.66,.14,.53],[-.72,-.48,.40],[-.67,-1.07,.40],[-.76,-1.61,.51]];for(const p of ps)p[0]+=(random()-.5)*.024;}
  else {const y=.32-random()*3,x=side*(.91+.27*smooth(.8,3,-y)),z=.12+random()*.66;ps=[[x,y,z],[x+side*.035,y-.20,z+.015],[x+side*.06,y-.43,z+.018],[x+side*.038,y-.69,z],[x,y-.83,z-.02]];}
  fibers.curve(controls(ps),24,.00058+random()*.00026,choose(),phase,{end:.87+random()*.13});
 }
 const scalpMaterial=material.clone();scalpMaterial.alphaTest=0;scalpMaterial.alphaToCoverage=false;
 // A separate non-cutout color map keeps the scalp opaque at every UV seam.
 scalpMaterial.map=null;scalpMaterial.normalMap=texture.normalMap;scalpMaterial.roughness=.73;
 root.add(mesh(scalpMass,scalpMaterial,'Continuous fitted crown and nape coverage'),mesh(mass,material,'Overlapping asymmetric three-dimensional groom masses'),fibers.finish());
 let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.index.count/3;bytes+=o.geometry.index.array.byteLength;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});
 root.userData={procedural:true,individualFineRibbons:n,continuousGroomLayers:guides.length,triangles,geometryMiB:Number((bytes/1048576).toFixed(2)),constructionMs:Number((performance.now()-start).toFixed(1)),source:'Only the supplied reference; original continuous 3D groom masses, mathematical fiber maps, and independent geometric surface strands. No downloaded hair asset.',headTiltCompensation:headTilt,lowerHairYawCompensation:.16};
 return root;
}
