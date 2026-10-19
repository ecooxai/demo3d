import * as THREE from 'three';
import { faceZ } from './face.js';
import { createHairContact } from './hair-contact.js';
import { fitLowerGuides118, protectUpperFiber118 } from './lower-guide-placement.js';
import { prepareUpperShoulder148, upperRawPoint148, recordUpperFiber148, applyUpperFiberMesh148 } from '../review/upper-shoulder-paths148.js';

// Original reference-directed groom: continuous crown, overlapping 3D locks,
// individual fibers and real coverage around both shoulders.
const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
function rng(seed=624829){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
const warp=[[-1.18,-1.18],[-.96,-1.04],[-.639,-.79],[-.26,-.475],[.25,.050],[.67,.505],[1.12,1.06],[1.54,1.54]];
function warpedY(y){let i=0;while(i<warp.length-2&&y>warp[i+1][0])i++;const p=warp[i],q=warp[i+1],a=warp[Math.max(0,i-1)],b=warp[Math.min(warp.length-1,i+2)],h=q[0]-p[0],t=(y-p[0])/h,m0=(q[1]-a[1])/(q[0]-a[0]),m1=(b[1]-p[1])/(b[0]-p[0]);return(2*t*t*t-3*t*t+1)*p[1]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*q[1]+(t*t*t-t*t)*h*m1;}
function inverseY(y){let lo=-1.18,hi=1.54;for(let i=0;i<18;i++){const m=(lo+hi)/2;if(warpedY(m)<y)lo=m;else hi=m;}return(lo+hi)/2;}
function foreheadField(){
 const nx=161,ny=121,dx=1.86/(nx-1),dy=1.4/(ny-1),data=new Float32Array(nx*ny);
 for(let j=0;j<ny;j++){const y=inverseY(.14+j*dy);for(let i=0;i<nx;i++)data[j*nx+i]=faceZ(-.93+i*dx,y);}
 return(x,y)=>{const u=clamp((x+.93)/dx,0,nx-1.00001),v=clamp((y-.14)/dy,0,ny-1.00001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;return mix(mix(data[j*nx+i],data[j*nx+i+1],a),mix(data[(j+1)*nx+i],data[(j+1)*nx+i+1],a),b);};
}
function sampleTable(table,t){let i=0;while(i<table.length-2&&t>table[i+1][0])i++;const a=table[i],b=table[i+1];return mix(a[1],b[1],smooth(a[0],b[0],t));}
const leftEdge=[[0,.84],[.35,1.01],[.70,1.27],[1.05,1.61],[1.30,1.77],[1.57,1.93],[1.95,2.19],[Math.PI,2.31]];
const rightEdge=[[0,.84],[.35,1.10],[.70,1.43],[1.05,1.77],[1.40,2.08],[1.85,2.23],[Math.PI,2.31]];
// Root coordinate, width, relief, bend, phase: unequal locks in the broad left
// sweep and finer right fall. Their field is shared by crown, roots and fibers.
const crownLocks=[
 [[.12,.064,.004,-.008,.4],[.28,.056,.005,.006,1.5],[.43,.050,.007,-.009,.9],[.56,.046,.010,.009,2.2],[.665,.039,.014,-.010,1.2],[.765,.042,.013,.008,2.9],[.858,.031,.011,-.006,1.9],[.928,.022,.008,.004,.5]],
 [[.12,.062,.004,.005,.8],[.30,.055,.006,-.006,2.2],[.465,.050,.006,.007,1.3],[.585,.041,.011,-.008,2.9],[.695,.037,.012,.006,.5],[.798,.040,.012,-.007,2.2],[.883,.029,.010,.004,1.5],[.943,.019,.006,-.003,2.9]]
];
const crownEnvelope=(u,v)=>Math.pow(Math.sin(Math.PI*v),2)*smooth(.03,.10,u)*(1-smooth(.90,.96,u));
function earDepth(x,y,z){
 // Smooth monotone compression keeps the left-ear surface unfolded.
 const w=Math.exp(-Math.pow((x+.857)/.167,4))*Math.exp(-Math.pow((y+.005)/.410,4));
 if(w<.000001)return z;
 // Release the compression gradually without reversing its depth derivative.
 const target=z>.070?.070+.026*Math.tanh((z-.070)/.026):z;
 return z-(z-target)*w*(1-smooth(.47,.70,z))*.995;
}
function crownField(forehead){
 return(side,u,v,lift=0)=>{
  // The deformation and its first derivatives vanish at part and edge.
  const envelope=crownEnvelope(u,v);let drift=0,relief=0;
  for(const[c,w,h,b,ph]of crownLocks[side<0?0:1]){const weight=Math.exp(-Math.pow((u-c)/w,2));drift+=weight*(.36*(c-u)+b*Math.sin(v*Math.PI+ph));relief+=weight*h*(.76+.24*Math.sin(v*Math.PI+ph));}
  u+=drift*envelope;
  const phi=side*Math.PI*(1-u),theta=sampleTable(side<0?leftEdge:rightEdge,Math.abs(phi));
  const partX=.185+.028*Math.sin(u*Math.PI)+.009*Math.sin(u*Math.PI*8),rootZ=mix(-.665,.625,u),rx=(partX-.012)/.94,rz=(rootZ+.077)/.857;
  const r=V(rx,Math.sqrt(Math.max(.025,1-rx*rx-rz*rz)),rz).normalize();
  const edge=V(Math.sin(theta)*Math.sin(phi),Math.cos(theta),Math.sin(theta)*Math.cos(phi));
  // Spherical interpolation maintains one continuous root-to-edge direction.
  const angle=Math.acos(clamp(r.dot(edge),-1,1)),sin=Math.sin(angle),t=clamp(v);
  let n=sin<.00001?r.clone().lerp(edge,t).normalize():r.multiplyScalar(Math.sin((1-t)*angle)/sin).addScaledVector(edge,Math.sin(t*angle)/sin);
  const puff=(side<0?.026:.012)*Math.sin(v*Math.PI)*smooth(.12,.60,u)+relief*envelope;
  const p=V(.012+(.94+lift+puff)*n.x,.327+(1.302+lift*.35+puff)*n.y,-.077+(.857+lift+puff)*n.z);
  if(p.z>0&&p.y>.14&&p.y<1.43){const z=forehead(p.x,p.y),weight=smooth(.08,.24,z)*smooth(.16,.38,p.y)*(1-smooth(1.24,1.46,p.y));p.z=Math.max(p.z,mix(p.z,z+.021+lift,weight));}
  return p;
 };
}
function makeMaps(){
 const w=512,h=1024,p=new Uint8Array(w*h*4),n=new Uint8Array(w*h*4),f=new Uint8Array(w*h*4),r=rng(227819),lanes=192,shade=[],phase=[],tip=[];
 // Near-white grain matches mass and real-fiber albedo; alpha and normals add detail.
 for(let i=0;i<lanes;i++){shade.push(.989+r()*.009);phase.push(r()*TAU);tip.push(.86+r()*.138);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/(h-1),lane=Math.min(lanes-1,Math.floor(u*lanes)),q=u*lanes-lane,ph=phase[lane],bend=.024*Math.sin(v*8+ph),ridge=Math.sin((q+bend)*TAU);
  const value=shade[lane]*(.999+.001*Math.cos((q+bend)*TAU))+.0002*Math.sin(v*16+ph),k=(y*w+x)*4;
  p[k]=p[k+1]=p[k+2]=Math.round(255*value);
  p[k+3]=Math.round(255*(1-smooth(tip[lane]-.022,tip[lane],v)));
  // Unequal fine ends follow the crown UV flow; its real fibers continue past
  // these distributed releases instead of meeting one opaque scalp boundary.
  const strand=Math.floor(u*384),release=.905+.075*(.5+.5*Math.sin(strand*12.9898+Math.sin(strand*.743)*8.13)),front=smooth(.50,.69,u),edge=1-smooth(mix(1.025,release-.013,front),mix(1.04,release,front),v/.73);
  f[k]=p[k];f[k+1]=p[k+1];f[k+2]=p[k+2];f[k+3]=Math.round(255*edge);
  const nx=.145*ridge,ny=.004*Math.cos(v*8+ph),len=Math.hypot(nx,ny,1);
  n[k]=Math.round(127.5*(nx/len+1));n[k+1]=Math.round(127.5*(ny/len+1));n[k+2]=Math.round(127.5*(1/len+1));n[k+3]=255;
 }
 const make=d=>{const t=new THREE.DataTexture(d,w,h,THREE.RGBAFormat);t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.ClampToEdgeWrapping;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;};
 const map=make(p),crownMap=make(f),normalMap=make(n);map.colorSpace=crownMap.colorSpace=THREE.SRGBColorSpace;map.name='Original cool chestnut continuous longitudinal fibers';crownMap.name='Original fine unequal crown-edge releases';normalMap.name='Original fine longitudinal hair relief';return{map,crownMap,normalMap};
}
function batch(rgba=false){return{p:[],c:[],uv:[],i:[],rgba};}
function vertex(b,p,c,u,v,alpha=1,deformEar=true){const at=b.p.length/3;b.p.push(p.x,p.y,p.z);b.c.push(c.r,c.g,c.b);if(b.rgba)b.c.push(alpha);b.uv.push(u,v);if(!deformEar)(b.untucked??=[]).push(at);return at;}
function makeMesh(b,material,name,headTilt,castShadow=true,deformEar=true,contact=null){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,b.rgba?4:3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.i);
 // Invert the Ry*Rz head pose below the neck so the lengths follow gravity.
 const p=g.attributes.position;let untucked=0;
 for(let i=0;i<p.count;i++){const skip=b.untucked?.[untucked]===i;if(skip)untucked++;let x=p.getX(i),y=p.getY(i),z=deformEar&&!skip?earDepth(x,y,p.getZ(i)):p.getZ(i),w=1-smooth(-1.64,.38,y),ay=-.16*w,az=-headTilt*w,cy=Math.cos(ay),sy=Math.sin(ay),cz=Math.cos(az),sz=Math.sin(az),xx=x*cy+z*sy;z=-x*sy+z*cy;const yy=xx*sz+y*cz;xx=xx*cz-y*sz;if(contact){const d=contact.shift(xx,yy,z);p.setXYZ(i,xx+contact.axis[0]*d,yy+contact.axis[1]*d,z+contact.axis[2]*d);}else p.setXYZ(i,xx,yy,z);}
 g.computeVertexNormals();
 if(b.seam||b.normalSeams){
  const n=g.attributes.normal,weld=(a,c)=>{const x=n.getX(a)+n.getX(c),y=n.getY(a)+n.getY(c),z=n.getZ(a)+n.getZ(c),l=Math.hypot(x,y,z)||1;n.setXYZ(a,x/l,y/l,z/l);n.setXYZ(c,x/l,y/l,z/l);};
  if(b.seam)for(let i=0;i<=128;i++)weld(b.seam[0]+i,b.seam[1]+i);
  if(b.normalSeams)for(let i=0;i<b.normalSeams.length;i+=2)weld(b.normalSeams[i],b.normalSeams[i+1]);
 }
 if(b.upper148)applyUpperFiberMesh148(g,b.upper148);
 g.computeBoundingBox();g.computeBoundingSphere();const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=castShadow;m.receiveShadow=true;return m;
}
const curve=points=>new THREE.CatmullRomCurve3(points.map(p=>p.isVector3?p:V(...p)),false,'catmullrom',.38);
function frame(c,t,front=false){
 const p=c.getPoint(t),d=c.getTangent(t).normalize();
 let n=front?V(p.x*.085,.025,1):V(p.x,.025,p.z+.077);
 if(n.lengthSq()<.01)n=V(0,0,-1);n.normalize();
 // Use a vertical ellipsoid normal at the crown.
 const scalp=V((p.x-.012)/(.94*.94),(p.y-.327)/(1.302*1.302),(p.z+.077)/(.857*.857)).normalize();
 // Wrap the frame around the temple before it turns over the chest.
 n.lerp(scalp,smooth(-1.08,.34,p.y)).normalize();
 const side=d.clone().cross(n);if(side.lengthSq()<.001)side.set(1,0,0);else side.normalize();n=side.clone().cross(d).normalize();return{p,d,n,s:side};
}
function lockShape(t,g,p){
 const back=g.kind==='inner-back'||g.kind==='back',inner=g.kind==='inner-back'||g.kind==='inner',seed=g.phase*1.37+(g.scalpRoot?.u??g.phase*.071)*31,variation=.5+.5*Math.sin(seed),tail=inner?.010:.004;
 // Rear roots occupy many spline knots. Taper by physical drop to the end,
 // preserving coverage through the lengths before each irregular fine finish.
 const extent=(inner?.27:.55)+(inner?.24:.46)*variation,start=inner?.79+.055*variation:.695+.10*variation;
 const fade=back?Math.pow(1-smooth(g.tipY+extent,g.tipY,p.y),inner?.80:.90+.30*variation):1-smooth(start,1,t);
 return(.025+.975*smooth(0,.060,t))*(tail+(1-tail)*fade);
}
function lockSection(g,t){
 const f=g.c.getFrame118?g.c.getFrame118(t,g.front,frame):frame(g.c,t,g.front),shape=lockShape(t,g,f.p),phase=g.phase;
 // Opaque roots grow from inside the crown along their own flow; no common-Y cutoff.
 const root=g.scalpRoot?(1-smooth(.035+.012*Math.sin(phase),.32+.045*Math.sin(phase*.71+.6),t))*smooth(-.20,.20,f.p.y):0;
 return{f,shape,root,depth:g.d*(1-.97*root),inset:-.021*root,undulate:1+.045*Math.sin(t*9+phase)};
}
function longLock(b,g){
 const steps=60,around=8,first=b.p.length/3;
 for(let j=0;j<=steps;j++){
  const t=j/steps,{f,shape,root,depth,inset,undulate}=lockSection(g.upper148?g.upper148.original:g,t),base=g.color.clone();if(g.crownColor)base.lerp(g.crownColor,root);
  for(let k=0;k<=around;k++){
   const a=k/around*TAU,cs=Math.cos(a),sn=Math.sin(a),p=upperRawPoint148(g,f.p.clone().addScaledVector(f.s,g.w*shape*cs*undulate).addScaledVector(f.n,inset+depth*shape*sn)),shade=mix(.974+.018*Math.sin(g.phase+k*.8+t*3),1,root);
   vertex(b,p,base.clone().multiplyScalar(shade),k/around+g.phase*.173,t,1,g.deformEar);
  }
 }
 for(let j=0;j<steps;j++)for(let k=0;k<around;k++){const a=first+j*(around+1)+k,c=a+around+1;b.i.push(a,c,a+1,a+1,c,c+1);}
}
function ribbon(b,c,width,color,steps=28,front=true,phase=0,tip=.83,deformEar=true,upperGuide148=null,upperKind148='regular'){
 const first=b.p.length/3;
 if(upperGuide148?.upper148)recordUpperFiber148(b,upperGuide148,first,(steps+1)*2,upperKind148);
 for(let j=0;j<=steps;j++){
  const t=j/steps,f=frame(c,t,front),w=width*(.20+.80*smooth(0,.027,t))*(.02+.98*(1-smooth(tip,1,t)));
  const col=color.clone().multiplyScalar(.94+.045*smooth(0,.15,t)+.012*Math.sin(t*11+phase));
  vertex(b,f.p.clone().addScaledVector(f.s,-w),col,0,t*.74,1,deformEar);vertex(b,f.p.clone().addScaledVector(f.s,w),col,1,t*.74,1,deformEar);
 }
 for(let j=0;j<steps;j++){const a=first+j*2,c=a+2;b.i.push(a,a+1,c,a+1,c+1,c);}
}
function roundFiber(b,c,r,color,steps=20,tip=.79){
 const first=b.p.length/3;
 for(let j=0;j<=steps;j++){const t=j/steps,f=frame(c,t,true),radius=r*(.35+.65*smooth(0,.03,t))*(.035+.965*(1-smooth(tip,1,t)));for(let k=0;k<=4;k++){const a=k*TAU/4,p=f.p.clone().addScaledVector(f.s,radius*Math.cos(a)).addScaledVector(f.n,radius*Math.sin(a));vertex(b,p,color,k/4,t*.74,1,false);}(b.normalSeams??=[]).push(first+j*5,first+j*5+4);}
 for(let j=0;j<steps;j++)for(let k=0;k<4;k++){const a=first+j*5+k,c=a+5;b.i.push(a,c,a+1,a+1,c,c+1);}
}
function shoulderClearance(p,route=1){
 // Route around the shoulder in depth, preserving silhouette width.
 const w=smooth(-1.43,-1.99,p.y);if(w<=0)return p;
 const rx=1.72-.10*smooth(-2.3,-3.9,p.y),rz=route>0?.81:.63;
 const boundary=rz*Math.sqrt(Math.max(0,1-Math.pow(p.x/rx,2)))+.018;
 const delta=boundary-route*p.z,soft=.5*(delta+Math.sqrt(delta*delta+.025*.025));p.z+=route*soft*w*.97;
 return p;
}
function hermiteFall(a,b,ma,mb){
 const h=a.y-b.y;
 return{getPoint(t){const t2=t*t,t3=t2*t,A=2*t3-3*t2+1,B=t3-2*t2+t,C=-2*t3+3*t2,D=t3-t2;return V(A*a.x+B*h*ma.x+C*b.x+D*h*mb.x,mix(a.y,b.y,t),A*a.z+B*h*ma.z+C*b.z+D*h*mb.z);},getTangent(t){const A=6*t*t-6*t,B=3*t*t-4*t+1,C=-A,D=3*t*t-2*t;return V(A*a.x+B*h*ma.x+C*b.x+D*h*mb.x,-h,A*a.z+B*h*ma.z+C*b.z+D*h*mb.z).normalize();}};
}
function continuousFrontRoot(crown,side,u,points){
 // Join exact crown flow to two monotonic passages and the lower drape, all C1.
 const left=side<0,q=clamp((u-(left?.49:.44))/(left?.215:.22)),exitY=left?.76+.10*q:.83+.075*q;
 let lo=.22,hi=1;for(let j=0;j<22;j++){const v=(lo+hi)/2;if(crown(side,u,v,.008).y>exitY)lo=v;else hi=v;}const exit=(lo+hi)/2;
 const scalp={getPoint:t=>crown(side,u,mix(.22,exit,t),.008),getTangent(t){const v=mix(.22,exit,t);return crown(side,u,v+.0001,.008).sub(crown(side,u,v-.0001,.008)).normalize();}};
 // The lower-ear knot begins the authored shoulder, wave and tip spline.
 const tail=curve(points.slice(7)),a=scalp.getPoint(1),b=V(side*(left?.919+.008*q:.858+.042*q),left?.27:.17,left?.078:.355-.030*q),c=tail.getPoint(0),slope=d=>d.multiplyScalar(1/Math.max(.025,-d.y));
 const m0=slope(scalp.getTangent(1)),m1=V(side*.015,-1,left?0:.025),m2=slope(tail.getTangent(0)),segments=[scalp,hermiteFall(a,b,m0,m1),hermiteFall(b,c,m1,m2),tail],lengths=[];
 for(const s of segments){let sum=0,p=s.getPoint(0);for(let j=1;j<=24;j++){const n=s.getPoint(j/24);sum+=Math.hypot(n.x-p.x,n.y-p.y,n.z-p.z);p=n;}lengths.push(sum);}
 const total=lengths.reduce((a,b)=>a+b,0),cuts=[0];for(const l of lengths)cuts.push(cuts[cuts.length-1]+l/total);cuts[4]=1;
 const locate=t=>{t=clamp(t);let i=0;while(i<3&&t>cuts[i+1])i++;return[i,clamp((t-cuts[i])/(cuts[i+1]-cuts[i]))];};
 return{getPoint(t){const[i,v]=locate(t);return segments[i].getPoint(v);},getTangent(t){const[i,v]=locate(t);return segments[i].getTangent(v);},debug:{side,u,exitV:exit,crownExit:[a.x,a.y,a.z],upperEar:[b.x,b.y,b.z],lowerJoin:[c.x,c.y,c.z],cuts}};
}

function farTempleLayer(crown,guides,mass,detail,headTilt){
 // Author this narrow fall against the final head and ear, then invert the
 // groom's existing gravity compensation. The main guides remain untouched.
 const random=rng(947221),layers=[],base=new THREE.Color('#50413e');let fibers=0,maxInverseError=0;
 const posed=p=>{const w=1-smooth(-1.64,.38,p.y),a=-.16*w,b=-headTilt*w,x=p.x*Math.cos(a)+p.z*Math.sin(a),z=-p.x*Math.sin(a)+p.z*Math.cos(a);return V(x*Math.cos(b)-p.y*Math.sin(b),x*Math.sin(b)+p.y*Math.cos(b),z);};
 const authored=p=>{let y=p.y;for(let k=0;k<9;k++){const b=-headTilt*(1-smooth(-1.64,.38,y));y=-p.x*Math.sin(b)+p.y*Math.cos(b);}const w=1-smooth(-1.64,.38,y),a=-.16*w,b=-headTilt*w,x=p.x*Math.cos(b)+p.y*Math.sin(b),v=V(x*Math.cos(a)-p.z*Math.sin(a),y,x*Math.sin(a)+p.z*Math.cos(a)),check=posed(v);maxInverseError=Math.max(maxInverseError,Math.hypot(check.x-p.x,check.y-p.y,check.z-p.z));return v;};
 const onLength=(g,y)=>{let lo=0,hi=1;for(let k=0;k<24;k++){const t=(lo+hi)/2;if(posed(g.c.getPoint(t)).y>y)lo=t;else hi=t;}return g.c.getPoint((lo+hi)/2);};
 for(let k=0;k<14;k++){
  const q=(k+.08*Math.sin(k*2.17))/13,phase=Math.floor(k/2)*2.399+k*.27,u=.676-.108*q,neighbor=guides[91+Math.round(q*41)],endY=-1.12-.075*Math.sin(phase+.7),exitY=.63+.10*q,ps=[];
  let lo=0,hi=1;for(let j=0;j<24;j++){const v=(lo+hi)/2;if(crown(1,u,v,.008).y>exitY)lo=v;else hi=v;}const exit=(lo+hi)/2;
  for(const t of[.25,.45,.65,.82,1])ps.push(crown(1,u,exit*t,.006));
  const bow=.005*Math.sin(phase),depth=.003*Math.cos(phase*.71);
  for(const p of[
   [.768+.149*q,.18+.010*Math.sin(phase),.336-.136*q+depth],
   [.765+.156*q+bow,-.13+.014*Math.sin(phase*.83),.313-.108*q+depth],
   [.774+.168*q+bow,-.39+.012*Math.sin(phase),.265-.019*q+depth],
   [.856+.123*q,-.61+.014*Math.cos(phase),.322+.028*q+depth]
  ])ps.push(authored(V(...p)));
  ps.push(onLength(neighbor,-.81-.020*Math.cos(phase)),onLength(neighbor,endY));
  const color=base.clone().multiplyScalar(.985+.012*Math.sin(phase*.63)),g={c:curve(ps),w:.0165+.0027*(.5+.5*Math.sin(phase)),d:.0105+.0020*(.5+.5*Math.cos(phase*.73)),color,front:true,phase,kind:'inner',scalpRoot:{side:1,u},crownColor:base.clone().multiplyScalar(.96+.045*Math.sin(u*17+.8)+.012*Math.sin(u*79)),deformEar:false,tipY:ps.at(-1).y,temple:true};
  const first=mass.p.length/3;longLock(mass,g);
  for(let j=0;j<=60;j++)(mass.normalSeams??=[]).push(first+j*9,first+j*9+8);
  layers.push(g);
  for(let strand=0;strand<28;strand++){
   const lane=(strand+.15+random()*.70)/28*2-1,ph=phase+random()*.55,end=.955+random()*.045,points=[];
   for(let j=0;j<=20;j++){
    const t=j/20,{f,shape,root,depth:sectionDepth,inset,undulate}=lockSection(g,t*end),spread=lane*g.w*shape*undulate,relief=(sectionDepth*Math.sqrt(Math.max(.01,1-lane*lane))+.0017*(1-.98*root))*shape;
    const p=f.p.clone().addScaledVector(f.s,spread+.00065*Math.sin(t*14+ph)).addScaledVector(f.n,inset+relief);points.push(p);
   }
   ribbon(detail,curve(points),.00048+random()*.00019,color.clone().multiplyScalar(.985+random()*.020),40,true,ph,.88+random()*.075,false);fibers++;
  }
  // A few longer fine ends lie within the neighboring fall below the lobe.
  if(k%2===0)for(let strand=0;strand<3;strand++){
   const points=[];for(let j=0;j<=20;j++){const t=j/20,f=frame(g.c,t,true),p=f.p.clone().addScaledVector(f.s,(strand-1)*g.w*.92).addScaledVector(f.n,.011*Math.sin(t*Math.PI));points.push(p);}
   ribbon(detail,curve(points),.00035+random()*.00012,color,40,true,phase+strand,.88,false);fibers++;
  }
 }
 guides.push(...layers);return{locks:layers.length,fibers,maxInverseError};
}


//133 replaces only the first108 fringe family. The retained prefix is the
// exact accepted bowed path; the lower fall is authored in final head space.
function diagonalFamily133(headTilt){
 const metrics={version:'single-diagonal-fringe-133',strength:1,sourceSlots:0,principal:0,shortCompanions:0,templeCompanions:0,maximumInverseError:0,maximumStartCorrection:0,minimumEndY:Infinity,maximumEndY:-Infinity};
 const posed=p=>{const w=1-smooth(-1.64,.38,p.y),a=-.16*w,b=-headTilt*w,x=p.x*Math.cos(a)+p.z*Math.sin(a),z=-p.x*Math.sin(a)+p.z*Math.cos(a);return V(x*Math.cos(b)-p.y*Math.sin(b),x*Math.sin(b)+p.y*Math.cos(b),z);};
 const authored=p=>{let y=p.y;for(let i=0;i<10;i++){const b=-headTilt*(1-smooth(-1.64,.38,y));y=-p.x*Math.sin(b)+p.y*Math.cos(b);}const w=1-smooth(-1.64,.38,y),a=-.16*w,b=-headTilt*w,x=p.x*Math.cos(b)+p.y*Math.sin(b),q=V(x*Math.cos(a)-p.z*Math.sin(a),y,x*Math.sin(a)+p.z*Math.cos(a)),check=posed(q);metrics.maximumInverseError=Math.max(metrics.maximumInverseError,Math.hypot(check.x-p.x,check.y-p.y,check.z-p.z));return q;};
 const uncompact=y=>{if(y>=.05)return y;if(y<=-.1192)return .05+(y-.05)/.94;let a=-.13,b=.05;for(let i=0;i<34;i++){const m=(a+b)/2,yy=m-.06*(m-.05)*smooth(.05,-.13,m);if(yy<y)a=m;else b=m;}return(a+b)/2;};
 // Actual original facial function with accepted50 vertical coordinates.
 // The small58 cheek narrowing makes this a conservative anterior envelope.
 const skin=(x,y)=>{const target=uncompact(y);let a=-1.18,b=1.54;for(let i=0;i<34;i++){const m=(a+b)/2;if(warpedY(m)<target)a=m;else b=m;}return faceZ(x,(a+b)/2);};
 const softMax=(a,b,e=.006)=>(a+b+Math.hypot(a-b,e))*.5;
 const principal=[[.96,-.365],[.76,-.435],[.48,-.542],[.17,-.627],[-.10,-.684],[-.33,-.713],[-.55,-.718]];
 const temple=[[.96,-.365],[.74,-.473],[.51,-.652],[.32,-.766],[.15,-.827],[-.14,-.838]];
 function atY(table,y){
  let i=0;while(i<table.length-2&&y<table[i+1][0])i++;
  const a=table[i],b=table[i+1],p=table[Math.max(0,i-1)],q=table[Math.min(table.length-1,i+2)],h=a[0]-b[0],t=clamp((a[0]-y)/h),m0=(b[1]-p[1])/(p[0]-b[0]),m1=(q[1]-a[1])/(a[0]-q[0]);
  return(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*h*m1;
 }
 function decorate(original,{k,lane,noise,endNoise,phase,loose}){
  const kind=k%10===2?'temple':k%11===5?'short':'principal';
  metrics.sourceSlots++;metrics[kind==='principal'?'principal':kind==='temple'?'templeCompanions':'shortCompanions']++;
  const startY=.90+.012*Math.sin(phase*.71),endY=kind==='temple'?.225-.335*endNoise:kind==='short'?.285-.43*endNoise:-.495+.36*Math.pow(Math.abs(lane),.72)+.065*(endNoise-.5);
  metrics.minimumEndY=Math.min(metrics.minimumEndY,endY);metrics.maximumEndY=Math.max(metrics.maximumEndY,endY);
  let lo=0,hi=1;for(let i=0;i<26;i++){const t=(lo+hi)/2;if(posed(original.getPoint(t)).y>startY)lo=t;else hi=t;}
  const start=(lo+hi)/2,p0=posed(original.getPoint(start)),e=.00002,d0=posed(original.getPoint(start+e)).sub(posed(original.getPoint(start-e))).multiplyScalar(1/(2*e)),drop=p0.y-endY,a=-d0.y*(1-start)/drop;
  // Exponential progress is strictly descending for any positive starting
  // slope; short companions need not clamp away the accepted join tangent.
  let r0=-16,r1=16;for(let i=0;i<38;i++){const r=(r0+r1)/2,q=Math.abs(r)<1e-8?1:r/Math.expm1(r);if(q>a)r0=r;else r1=r;}const rate=(r0+r1)/2;
  function uncorrected(s){
   const fall=Math.abs(rate)<1e-7?s:Math.expm1(rate*s)/Math.expm1(rate),y=p0.y-drop*fall;
   const outer=Math.abs(lane),width=kind==='principal'?.012+.018*Math.exp(-Math.pow((y-.38)/.52,2)):kind==='short'?.010+.007*Math.exp(-Math.pow((y-.42)/.44,2)):.007+.004*Math.sin(s*Math.PI);
   let x=atY(kind==='temple'?temple:principal,y)+lane*width+(noise-.5)*.005*Math.sin(s*Math.PI);
   if(kind==='short')x+=(k%2?1:-1)*(.027+.011*noise)*smooth(0,.36,s);
   let z=skin(x,y)+.026+.016*Math.exp(-Math.pow((y-.48)/.44,2));
   if(kind==='temple'){
    // A few narrow fibers pass over the existing upper cartilage. This is a
    // smooth bowed passage, with no broad strip or new opaque ear covering.
    const upperEar=.260+.082*smooth(-.15,.50,y)+.003*Math.sin(phase),weight=smooth(-.64,-.735,x);
    z=mix(z,softMax(z,upperEar,.035),weight);
   }else z=softMax(z,.251+.006*noise);
   z+=(loose?.005:.0025)*Math.sin(s*Math.PI)*Math.sin(phase*.83);
   return V(x,y,z);
  }
  const target0=uncorrected(0),targetD=uncorrected(e).sub(target0).multiplyScalar(1/e),delta=p0.clone().sub(target0),slope=V(d0.x*(1-start)-targetD.x,0,d0.z*(1-start)-targetD.z);
  metrics.maximumStartCorrection=Math.max(metrics.maximumStartCorrection,Math.hypot(delta.x,delta.z));
  const final={getPoint(t){
   if(t<=start)return original.getPoint(t);
   const s=clamp((t-start)/(1-start)),p=uncorrected(s),retain=1-smooth(0,.42,p0.y-p.y);
   p.x+=(delta.x+s*slope.x)*retain;p.z+=(delta.z+s*slope.z)*retain;
   return authored(p);
  },getTangent(t){if(t<start-.0001)return original.getTangent(t);const a=Math.max(0,t-.0001),b=Math.min(1,t+.0001);return this.getPoint(b).sub(this.getPoint(a)).normalize();}};
  final.debug133={kind,start,startY:p0.y,endY,lane,original,posed};
  return final;
 }
 return{decorate,metrics};
}

export function createGroomHair({headTilt=-.17,headShiftX=.26,shoulderContact=0,guidePlacement=0,diagonalFringe133=0,upperShoulder148=false}={}){
 const start=performance.now(),root=new THREE.Group();root.name='Original reference-directed chestnut layered groom';
 const random=rng(),forehead=foreheadField(),crown=crownField(forehead),maps=makeMaps(),crownBatch=batch(true),mass=batch(),detail=batch(),fringe=batch(),wisps=batch(),guides=[],contact=shoulderContact?createHairContact({headTilt,headShiftX,strength:shoulderContact}):null;
 const palette=['#4c403c','#554642','#433937','#5c4d49','#463b38','#51433f'].map(c=>new THREE.Color(c)),pick=()=>palette[Math.floor(random()*palette.length)].clone();
 const material=new THREE.MeshPhysicalMaterial({vertexColors:true,map:maps.map,normalMap:maps.normalMap,normalScale:new THREE.Vector2(.31,.09),roughness:.52,metalness:0,anisotropy:.65,anisotropyRotation:Math.PI*.5,specularIntensity:.38,specularColor:'#ffffff',envMapIntensity:.42,alphaTest:.10,alphaToCoverage:true,side:THREE.DoubleSide});
 const crownMaterial=material.clone();crownMaterial.map=maps.crownMap;
 const fineMaterial=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.38,metalness:0,anisotropy:.80,anisotropyRotation:Math.PI*.5,specularIntensity:.75,specularColor:'#ffffff',envMapIntensity:.65,alphaTest:.05,alphaToCoverage:true,side:THREE.DoubleSide});
 const fringeMaterial=fineMaterial.clone();fringeMaterial.alphaTest=0;fringeMaterial.alphaToCoverage=false;fringeMaterial.roughness=.90;fringeMaterial.specularIntensity=0;fringeMaterial.anisotropy=0;fringeMaterial.envMapIntensity=0;
 const wispMaterial=fringeMaterial.clone();wispMaterial.transparent=true;wispMaterial.depthWrite=false;wispMaterial.opacity=.65;wispMaterial.forceSinglePass=true;
 // Closed inset foundation fills the rear part beneath the directional sheets.
 {
  const nu=144,nv=52,first=crownBatch.p.length/3,c=new THREE.Color('#493b37');
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
   const phi=-Math.PI+i/nu*TAU,edge=mix(.78+.10*Math.abs(Math.sin(phi)),2.20,smooth(.95,1.8,Math.abs(phi))),theta=j/nv*edge;
   const p=V(.012+.922*Math.sin(theta)*Math.sin(phi),.327+1.282*Math.cos(theta),-.077+.839*Math.sin(theta)*Math.cos(phi));
   vertex(crownBatch,p,c,i/nu*.30,j/nv*.72,1);
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=first+j*(nu+1)+i,b=a+nu+1;crownBatch.i.push(a,b,a+1,a+1,b,b+1);}
 }
 const partRows=[];
 // The two continuous crown sheets meet along a restrained off-center part.
 // Their UV-v direction is the direction of growth, including the large left sweep.
 for(const side of[-1,1]){
  const nu=128,nv=64,first=crownBatch.p.length/3;partRows.push(first);
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
   const u=i/nu,v=j/nv,p=crown(side,u,v,.002),shade=.96+.045*Math.sin(u*17+.8)+.012*Math.sin(u*79),c=new THREE.Color('#50413e').multiplyScalar(shade);
   const feather=1-smooth(.875,1,v)*smooth(.38,.56,u)*.999;
   vertex(crownBatch,p,c,u,v*.73,feather);
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=first+j*(nu+1)+i,c=a+nu+1;if(side>0)crownBatch.i.push(a,a+1,c,a+1,c+1,c);else crownBatch.i.push(a,c,a+1,a+1,c,c+1);}
 }
 crownBatch.seam=partRows;
 function guide(points,width,depth,color,front,phase,kind,scalpRoot=null){const authored=new THREE.Color(color),base=new THREE.Color('#50413e');authored.lerp(base,.82);const u=scalpRoot?.u,crownColor=scalpRoot?base.clone().multiplyScalar(.96+.045*Math.sin(u*17+.8)+.012*Math.sin(u*79)):null,joined=front&&!!scalpRoot,g={c:joined?continuousFrontRoot(crown,scalpRoot.side,u,points):curve(points),w:width,d:depth,color:authored,front,phase,kind,scalpRoot,crownColor,deformEar:!joined,tipY:points.at(-1).y??points.at(-1)[1]};guides.push(g);return g;}
 function rootPath(side,u){
  // The large locks begin underneath the fine part fibers.
  const ps=[];for(const v of[.22,.38,.55,.72,.88,1])ps.push(crown(side,u,v,.008));return ps;
 }
 function fallingRoot(side,u){
  // Match the scalp-depth exit tangent, then turn downward through the nape.
  let lo=0,hi=1;
  for(let j=0;j<24;j++){const v=(lo+hi)/2;if(crown(side,u,v,.008).y>.39)lo=v;else hi=v;}
  const exit=(lo+hi)/2,ps=[];
  for(const f of[.22,.40,.60,.80,1])ps.push(crown(side,u,exit*f,.008));
  const end=ps[ps.length-1],a=crown(side,u,Math.max(0,exit-.002),.008),b=crown(side,u,Math.min(1,exit+.002),.008),dy=Math.max(.00001,a.y-b.y);
  const sx=clamp((b.x-a.x)/dy,-.45,.45),sz=clamp((b.z-a.z)/dy,-.45,.45);
  for(const drop of[.16,.36,.61]){const ease=.40*(1-Math.exp(-drop/.40));ps.push(V(end.x+sx*ease,end.y-drop,end.z+sz*ease));}
  return ps;
 }
 // Staggered rear S-curves turn around the shoulders.
 for(const side of[-1,1])for(let k=0;k<29;k++){
  const q=(k+.15+random()*.35)/29,u=.015+q*.565,phi=side*(Math.PI-u*Math.PI),phase=Math.floor(k/3)*2.399+(side<0?.35:1.4),ps=fallingRoot(side,u);
  const family=Math.floor(k/2),end=-3.84+.42*Math.pow(q,.9)+.17*Math.sin(family*2.13+side*.8)+.045*Math.sin(k*1.17),bend=.08*Math.sin(family*1.61+side*.8)+.035*Math.sin(k*.87);
  for(let j=0;j<8;j++){
   const t=j/7,y=mix(-.68,end,t),f=smooth(0,.65,t),a=side*mix(Math.abs(phi),Math.max(1.89,Math.abs(phi)),smooth(.04,.49,t))+side*.028*Math.sin(t*4.3+phase),rx=.96+.27*Math.sin(t*Math.PI*.92)-.07*smooth(.80,1,t),rz=.88+.095*Math.sin(t*Math.PI),wave=(.043+.032*Math.abs(Math.sin(phase)))*Math.sin(t*6.9+phase)*f;
   const turn=smooth(.59,1,t),p=V(Math.sin(a)*rx+wave+bend*turn,y,-.09+Math.cos(a)*rz+.09*Math.sin(t*6.5+phase*.7)*f+.043*Math.cos(family*1.61)*turn);shoulderClearance(p,-1);ps.push(p);
  }
  guide(ps,.077+random()*.016,.017+random()*.008,k%4?'#433631':'#4b3d36',false,phase,'back',{side,u});
 }
 // Front families overlap in depth and finish in unequal curls.
 for(const side of[-1,1]){
  const left=side<0,count=left?33:42;
  for(let k=0;k<count;k++){
   const q=k/(count-1),family=Math.floor(k/3),lane=k%3-1,phase=family*2.399+(left?.55:1.72),u=(left?.49:.44)+q*(left?.215:.22),ps=rootPath(side,u);
   const end=(left?-3.90:-3.83)+.235*Math.sin(family*1.93+side)+.055*lane;
   const depth=.042*Math.sin(family*1.71)+.010*lane,amp=.035+.032*(.5+.5*Math.sin(family*1.41)),curlPhase=q*4.4+(left?.55:1.72)+.55*Math.sin(family*1.93);
   const wave=t=>amp*Math.sin(t*6.2+curlPhase),zWave=t=>depth+.052*Math.cos(t*5.4+curlPhase);
   if(left)ps.push(
    [-.91-.018*q,-.28,.035-.02*q],[-.915-.018*q,-.78,.054+.012*q],
    [-.79-.24*q,-1.29,.36+.07*q],[-.64-.56*q+wave(.15),-1.90,.79+zWave(.15)],
    [-.68-.67*q+wave(.38),-2.48,.94+zWave(.38)],
    [-.81-.74*q+wave(.60),-3.05,1.00+zWave(.60)],
    [-.84-.58*q+wave(.75),end+.39,.98+zWave(.75)],
    [-.75-.46*q+wave(.88),end+.11,.89+zWave(.88)],
    [-.60-.40*q+wave(1),end+.055*Math.sin(family*1.3),.73+zWave(1)]);
   else ps.push(
    [.90+.028*q,-.28,.225-.04*q],[.91+.036*q,-.79,.330+.025*q],
    [.79+.20*q,-1.28,.47+.05*q],[.66+.59*q+wave(.15),-1.90,.88+zWave(.15)],
    [.66+.83*q+wave(.38),-2.45,1.02+zWave(.38)],
    [.82+.73*q+wave(.60),-3.01,1.09+zWave(.60)],
    [.79+.58*q+wave(.75),end+.40,1.00+zWave(.75)],
    [.64+.46*q+wave(.89),end+.11,.89+zWave(.89)],
    [.46+.43*q+wave(1),end+.08*Math.sin(family*1.6),.72+zWave(1)]);
   for(let j=6;j<ps.length;j++){const p=ps[j].isVector3?ps[j]:V(...ps[j]);if(p.y<-1.38)shoulderClearance(p);ps[j]=p;}
   guide(ps,.059+random()*.012,.022+random()*.015,k%5?'#493a33':'#514139',true,phase,'front',{side,u});
  }
 }
 // Short outer curls remain gathered at the neck, opening below the shoulders.
 for(const side of[-1,1])for(let k=0;k<(side<0?6:9);k++){
  const q=k/(side<0?5:8),left=side<0,phase=k*2.23+side,end=-3.38-.48*q+.13*Math.sin(k*1.8)+.09*Math.sin(k*1.57+side),x=.69+q*.67,u=(left?.56:.51)+q*.12,ps=rootPath(side,u);
  ps.push([side*.96,-.38,left?.045:.24],[side*.94,-.91,left?.10:.365],
   [side*(.70+.30*q),-1.58,.68+.03*q],[side*(.76+.53*q+.07*Math.sin(phase)),-2.15,.99+.060*Math.cos(phase)],
   [side*(.88+.57*q+.075*Math.sin(phase+.9)),-2.62,1.10+.065*Math.sin(phase)],
   [side*(x+.19),end+.40,1.12+.06*Math.cos(phase)],
   [side*(x-.04),end+.09,.94+.06*Math.sin(phase+.7)],
   [side*(x-.17),end+.13,.79+.07*Math.cos(phase+1.1)]);
  for(let j=6;j<ps.length;j++){const p=ps[j].isVector3?ps[j]:V(...ps[j]);if(p.y<-1.38)shoulderClearance(p);ps[j]=p;}
  guide(ps,.030+random()*.018,.017+random()*.010,'#55443b',true,phase,'curl',{side,u});
 }
 // Side layers descend close to the head and divide around the shoulder in depth.
 for(const side of[-1,1])for(let k=0;k<12;k++){
  const q=k/11,phase=Math.floor(k/2)*1.76+side,u=.43+q*.10,ps=fallingRoot(side,u),end=-3.30-.29*Math.sin(q*Math.PI)+.13*Math.sin(k*1.8),route=q<.65?1:-1;
  const first=ps[ps.length-1];
  for(let j=0;j<8;j++){
   const t=j/7,y=mix(-.68,end,t),x=side*(.935+(.17+.07*q)*smooth(.25,.78,t)-.07*smooth(.70,1,t)+.020*Math.sin(t*5+phase)),z=mix(first.z,route*((route>0?.61+.25*q/.65:.57)+.055*Math.sin(t*4.1+phase)),smooth(0,.47,t));
   const p=V(x,y,z);shoulderClearance(p,route);ps.push(p);
  }
  guide(ps,.041+random()*.006,.016+random()*.006,k%4?'#40332e':'#4b3c34',false,phase,'side',{side,u});
 }
 // Overlapping inner locks sustain quantity beneath the separate surface curls.
 for(const side of[-1,1])for(let k=0;k<28;k++){
  const q=k/27,left=side<0,phase=q*4.7+(left?.4:1.6),end=(left?-3.84:-3.78)+.10*Math.sin(q*9.1)+.055*Math.sin(k*1.8),ps=[];
  if(left)ps.push([-.917,-.27,.025],[-.925,-.79,.035],[-.82-.08*q,-1.29,.31],[-.68-.47*q,-1.90,.75],[-.71-.64*q,-2.47,.87],[-.84-.66*q,-3.03,.94],[-.81-.58*q,end+.38,.92],[-.72-.49*q,end+.10,.82],[-.61-.42*q,end,.71]);
  else ps.push([.888,-.27,.295],[.929,-.79,.285],[.81+.12*q,-1.29,.40],[.70+.53*q,-1.90,.81],[.71+.77*q,-2.46,.93],[.84+.70*q,-3.01,1.00],[.79+.60*q,end+.39,.94],[.65+.51*q,end+.10,.82],[.49+.45*q,end,.70]);
  for(let j=0;j<ps.length;j++){const p=V(...ps[j]),w=smooth(-.8,-2.2,p.y);p.x+=.032*Math.sin(phase+j*.43)*w;p.z-=.035;if(p.y<-1.38)shoulderClearance(p);ps[j]=p;}
  guide(ps,.083+random()*.010,.020,'#4a3c38',true,phase,'inner');
 }
 for(let k=0;k<48;k++){
  const q=k/47,phi=1.65+q*(TAU-3.30),phase=q*5.1,family=Math.floor(k/2),ps=[],end=-3.43-.35*Math.pow(Math.sin(Math.PI*q),.80)+.14*Math.sin(family*2.13+.7)+.045*Math.sin(k*1.17),bend=.055*Math.sin(family*1.61+.2);
  for(let j=0;j<10;j++){
   const t=j/9,y=mix(-.20,end,t),rx=.93+.25*Math.sin(t*Math.PI*.88)-.05*smooth(.78,1,t),rz=.82+.048*Math.sin(t*Math.PI),w=smooth(.10,.7,t);
   const turn=smooth(.64,1,t),p=V(Math.sin(phi)*rx+.028*Math.sin(t*5.5+phase)*w+bend*turn,y,-.06+Math.cos(phi)*rz+.025*Math.cos(t*5.2+phase)*w+.035*Math.cos(family*1.61+.2)*turn);shoulderClearance(p,-1);ps.push(p);
  }
  guide(ps,.108+random()*.014,.021,'#493b37',false,phase,'inner-back');
 }
 // Fit only original lower front/inner/curl curves, before any lock surfaces.
 const guidePlacement118=fitLowerGuides118(guides,lockSection,{strength:guidePlacement,contact,headShiftX});
 const upperShoulderResult148=prepareUpperShoulder148(guides,{enabled:upperShoulder148,contact,headShiftX,headTilt,guidePlacement,earDepth});
 for(const g of guides)longLock(mass,g);
 //148_COARSE_BOUNDARY — approved coarse field; original fine subdivisions below.
 // Fine surface strands share each lock's shape and vary at their trailing ends.
 let fiberCount=0;
 for(const currentGuide148 of guides){
  const g=currentGuide148.upper148?currentGuide148.upper148.original:currentGuide148;
  const count=g.kind==='front'?43:g.kind==='curl'?54:g.kind==='back'?34:(g.kind==='inner'||g.kind==='inner-back')?16:28;
  for(let k=0;k<count;k++){
   const lane=(k+.1+random()*.8)/count*2-1,side=k%7===0?-1:1,phase=random()*TAU,end=.935+random()*.065,ps=[],oldPs=g.original118?[]:null;
   for(let j=0;j<=18;j++){
    const t=j/18,{f,shape,root,depth:sectionDepth,inset,undulate}=lockSection(g,t*end),spread=lane*g.w*shape*undulate,depth=side*(sectionDepth*Math.sqrt(Math.max(.01,1-lane*lane))+.0028*(1-.98*root))*shape;
    const tip=smooth(.70,1,t),p=f.p.clone().addScaledVector(f.s,spread+.0019*Math.sin(t*29+phase)).addScaledVector(f.n,inset+depth);
    const tipY=(random()-.5)*.018*tip;
    p.x+=.024*Math.sin(phase)*tip;p.y+=tipY;p.z+=.016*Math.cos(phase)*tip;ps.push(p);
    if(oldPs){
     const old=lockSection(g.original118,t*end),spread0=lane*g.w*old.shape*old.undulate,depth0=side*(old.depth*Math.sqrt(Math.max(.01,1-lane*lane))+.0028*(1-.98*old.root))*old.shape;
     const q=old.f.p.clone().addScaledVector(old.f.s,spread0+.0019*Math.sin(t*29+phase)).addScaledVector(old.f.n,old.inset+depth0);
     q.x+=.024*Math.sin(phase)*tip;q.y+=tipY;q.z+=.016*Math.cos(phase)*tip;oldPs.push(q);
    }
   }
   ribbon(detail,oldPs?protectUpperFiber118(curve(ps),curve(oldPs)):curve(ps),.00063+random()*.00039,pick().lerp(new THREE.Color('#69564b'),k%13===0?.40:0),28,g.front,phase,.85+random()*.10,g.deformEar,currentGuide148);fiberCount++;
  }
 }
 // Existing crown fibers gather into shared flowing families. Shallow upper
 // layers cross neighboring lanes while roots and ends return to the common bed.
 for(const side of[-1,1])for(let k=0;k<1150;k++){
  const u=(k+.15+random()*.70)/1150,phase=random()*TAU,end=.985+random()*.015,ps=[];
  const locks=crownLocks[side<0?0:1];let family=locks[0];for(const f of locks)if(Math.abs(u-f[0])/f[1]<Math.abs(u-family[0])/family[1])family=f;
  const gathered=Math.exp(-Math.pow((u-family[0])/family[1],2)),upper=k%6===0;
  for(let j=0;j<=20;j++){const v=j/20*end,e=crownEnvelope(u,v),wander=e*((upper?.005:.0025)*Math.sin(v*3.7+family[4])+.0012*Math.sin(v*7+phase)),height=.0056+random()*.0004+e*(.004+.0075*gathered+(upper?.004:0)),p=crown(side,clamp(u+wander),v,height);ps.push(p);}
  ribbon(detail,curve(ps),.00048+random()*.00028,pick(),26,false,phase,.96);fiberCount++;
 }
 // Retain94's accepted bowed trajectories. Continuous lanes and thinner,
 // unequally tapered cores soften the isolated brush groups without new hooks.
 const bangGuides=[
  {n:270,w:.075,u:.810,v:.76,points:[[.17,1.44],[-.12,1.20],[-.37,.90],[-.52,.48],[-.67,-.20]]},
  {n:245,w:.069,u:.900,v:.72,points:[[.21,1.42],[.03,1.18],[-.18,.85],[-.32,.46],[-.44,.12]]},
  {n:105,w:.043,u:.936,v:.53,points:[[.24,1.43],[.15,1.15],[.02,.80],[-.08,.46],[-.22,.22]]},
  {n:300,w:.068,u:.865,v:.66,points:[[.27,1.42],[.34,1.14],[.32,.83],[.22,.48],[.03,.20]]},
  {n:120,w:.037,u:.820,v:.58,points:[[.31,1.37],[.42,1.11],[.46,.83],[.40,.55],[.22,.24]]},
  {n:95,w:.031,u:.770,v:.62,points:[[.33,1.38],[.51,1.08],[.55,.77],[.54,.47],[.40,.16]]},
  {n:170,w:.045,u:.715,v:.53,points:[[.35,1.40],[.61,1.10],[.69,.75],[.71,.38],[.66,0]]}
 ];
 const diagonal133=Number(diagonalFringe133)>0?diagonalFamily133(headTilt):null;
 const fringeStats108={roundCores:0,fineCompanions:0,omittedCores:0,sourceSlots:0,groups:[]};
 for(let group=0;group<bangGuides.length;group++){
  const g=bangGuides[group],row={group,roundCores:0,fineCompanions:0};fringeStats108.groups.push(row);
  for(let k=0;k<g.n;k++){
   // A stratified coordinate replaces the repeated8/9 lane centers. Nearby
   // cores retain a common bow while fine companions wander through its gaps.
   const noise=random(),q=(k+.15+.70*noise)/g.n*2-1,lane=q+.045*Math.sin(q*Math.PI*2.15+group*.71)*(1-q*q),phase=lane*Math.PI+group*.71+.18*(noise-.5),loose=k%4===0;
   const center=lane*g.w*.76,spread=(noise-.5)*g.w*(loose?2.55:.58),lift=.068+.023*Math.cos(group*.91)+.012*Math.sin(phase),ps=[];
   for(let j=0;j<g.points.length;j++){
    const t=j/(g.points.length-1),bow=Math.sin(t*Math.PI),x=g.points[j][0]+center*(.15+.85*bow)+spread*(.12+.88*t)+.024*Math.sin(phase+t*4.4)*bow,y=g.points[j][1]+.026*Math.sin(phase)*t+(random()-.5)*.018*t;
    const z=forehead(x,Math.max(.22,y))+.024+lift*Math.pow(bow,.8)+.004*Math.sin(k*2.7)*bow+(y<.22?(.22-y)*.045:0);ps.push(V(x,y,z));
   }
   const side=group<3?-1:1,u=g.u+center*.20+spread*.13,v0=.012+.064*(.5+.5*Math.sin(phase*1.37+group*.61))+(loose?.019:0),v1=g.v+.018*Math.sin(phase),root=[];
   for(let j=0;j<4;j++){const v=mix(v0,v1,j/3);root.push(crown(side,u,v,.003+.006*smooth(v0,v1,v)+.001*Math.sin(k*1.19)));}
   // Crown roots join bowed lower controls and unequal ends above the forehead.
   const endNoise=random(),c=curve([...root,...ps.slice(2)]),cut=clamp(.815+.235*endNoise+.025*Math.sin(phase+1.2)+(group===0?.025:0)),end=1-(1-cut)*4/6,trim=[];
   for(let j=0;j<=20;j++){const p=c.getPoint(j/20*end),delta=forehead(p.x,Math.max(.22,p.y))+.040-p.z;p.z+=.5*(delta+Math.hypot(delta,.006))*smooth(.14,.26,p.y)*(1-smooth(1.37,1.48,p.y));trim.push(p);}
   const col=pick().lerp(new THREE.Color('#655652'),.16),strand=diagonal133&&group===0?diagonal133.decorate(curve(trim),{k,lane,noise,endNoise,phase,loose}):curve(trim),widthNoise=random(),keepCore=(k*37+group*11)%13<10;fringeStats108.sourceSlots++;
   // Advance every accepted random draw, including omitted cores, so crown,
   // later wisps, flyaways and the far-temple layer stay byte-identical to94.
   if(loose){const taperNoise=random();ribbon(fringe,strand,.00027+widthNoise*.00014,col,20,true,phase,.72+taperNoise*.18,false);fringeStats108.fineCompanions++;row.fineCompanions++;fiberCount++;}
   else if(keepCore){roundFiber(fringe,strand,.00033+widthNoise*.00020,col,20,.69+.14*noise);fringeStats108.roundCores++;row.roundCores++;fiberCount++;}
   else fringeStats108.omittedCores++;
  }
  if(group===0&&diagonal133){diagonal133.metrics.vertices=fringe.p.length/3;diagonal133.metrics.indices=fringe.i.length;}
 }
 // Short edge hairs continue the crown tangent into sparse outer wisps.
 for(const side of[-1,1])for(let k=0;k<310;k++){
  const u=.51+(k+random())/310*.48,v0=.79+random()*.12,ps=[],a=crown(side,u,.982,.006),b=crown(side,u,1,.006),d=b.clone().sub(a).normalize(),extension=.07+random()*.18;
  for(let j=0;j<9;j++)ps.push(crown(side,u,mix(v0,1,j/8),.007));
  for(let j=1;j<=4;j++){
   const t=j/4,p=b.clone().addScaledVector(d,extension*t);p.y-=.025*t*t;
   if(p.z>.15&&p.y>.20)p.z=Math.max(p.z,forehead(p.x,Math.max(.22,p.y))+.023);ps.push(p);
  }
  ribbon(wisps,curve(ps),.00039+random()*.00023,pick().multiplyScalar(.93),24,true,k,.79);fiberCount++;
 }
 // Only a few fine temple strands cross in front of the exposed left ear.
 for(let k=0;k<22;k++){
  const q=k/21,phase=k*2.399,ps=[[.09,1.32,.62],[-.29,1.02,.68],[-.57,.61,.50],[-.78,.27,.33],[-.83,.055,.285],[-.825+.035*Math.sin(phase),-.06-.20*q,.275+.012*Math.cos(phase)]];
  for(let j=0;j<ps.length;j++){const t=j/(ps.length-1);ps[j][0]+=(q-.5)*(.014+.087*Math.sin(t*Math.PI));ps[j][1]+=.031*Math.sin(phase)*Math.sin(t*Math.PI);ps[j][2]+=.009*Math.cos(phase)*Math.sin(t*Math.PI);}
  const c=curve(ps),end=.84+.16*random(),trim=[];for(let j=0;j<=16;j++)trim.push(c.getPoint(j/16*end));
  ribbon(wisps,curve(trim),.00043+random()*.00022,pick(),42,true,k*.2,.88);fiberCount++;
 }
 // Restrained isolated flyaways break the silhouette without a uniformly fuzzy rim.
 for(let k=0;k<86;k++){
  const currentGuide148=guides[Math.floor(random()*guides.length)],g=currentGuide148.upper148?currentGuide148.upper148.original:currentGuide148,startT=.18+random()*.66,ps=[],oldPs=g.original118?[]:null,phase=random()*TAU;
  for(let j=0;j<=12;j++){const t=j/12,at=mix(startT,Math.min(1,startT+.24+random()*.03),t),f=g.c.getFrame118?g.c.getFrame118(at,g.front,frame):frame(g.c,at,g.front),p=f.p.clone().addScaledVector(f.s,(k%2?1:-1)*g.w*(.83+.22*Math.sin(t*Math.PI))).addScaledVector(f.n,.011+.018*Math.sin(t*Math.PI));ps.push(p);if(oldPs){const f0=frame(g.original118.c,at,g.front);oldPs.push(f0.p.clone().addScaledVector(f0.s,(k%2?1:-1)*g.w*(.83+.22*Math.sin(t*Math.PI))).addScaledVector(f0.n,.011+.018*Math.sin(t*Math.PI)));}}
  ribbon(detail,oldPs?protectUpperFiber118(curve(ps),curve(oldPs)):curve(ps),.00045+random()*.00022,pick(),24,g.front,phase,.80,g.deformEar,currentGuide148,'flyaway');fiberCount++;
 }
 const temple=farTempleLayer(crown,guides,mass,detail,headTilt);fiberCount+=temple.fibers;
 root.add(makeMesh(crownBatch,crownMaterial,'Continuous parted crown with longitudinal fiber flow',headTilt),makeMesh(mass,material,'Overlapping layered S-wave hair around front back and shoulders',headTilt,true,true,contact),makeMesh(detail,fineMaterial,'Independent fine crown lengths and silhouette strands',headTilt,false,true,contact),makeMesh(fringe,fringeMaterial,'Dense fine bowed brown fringe strands',headTilt,false),makeMesh(wisps,wispMaterial,'Sparse short temple edge and hairline wisps',headTilt,false,false));
 root.children[root.children.length-2].renderOrder=3;root.children[root.children.length-1].renderOrder=4;
 let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.index.count/3;bytes+=o.geometry.index.array.byteLength;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});
 root.userData={procedural:true,continuousCrownSheets:2,closedInsetScalp:true,smoothSingleEarTuck:true,opaqueBuriedRoots:true,roundedFringe:true,fringeStrands:fringeStats108.roundCores+fringeStats108.fineCompanions,fiberSeamNormals:true,matchedMassFiberAlbedo:true,lowVarianceFiberAlbedo:true,originalLayeredLocks:guides.length,individualStrands:fiberCount,triangles,geometryMiB:Number((bytes/1048576).toFixed(2)),constructionMs:Number((performance.now()-start).toFixed(1)),source:'Only the supplied image guided this original 3D groom. All geometry and longitudinal hair maps were authored mathematically; no hair photos or external assets.',headTiltCompensation:headTilt,lowerHairYawCompensation:.16};
 root.userData.frontRootJoins=[90,91,114].map(id=>({guide:id,...guides[id].c.debug}));
 root.userData.farTempleLayer=temple;
 root.userData.fringeDistribution108=fringeStats108;
 root.userData.diagonalFringe133=diagonal133?diagonal133.metrics:{version:'single-diagonal-fringe-133',strength:0};
 root.userData.guidePlacement118=guidePlacement118;
 root.userData.upperShoulder148=upperShoulderResult148;
 if(contact)root.userData.shoulderContact=contact.metrics;
 return root;
}
