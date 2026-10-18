import * as THREE from 'three';
import { faceZ } from './face.js';

// Original reference-directed groom. The crown is a continuous pair of flow
// surfaces. Overlapping, shallow three-dimensional locks continue the flow over
// the shoulders; the individual strands supply detail, not silhouette coverage.
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
function earDepth(x,y,z){
 // One smooth final deformation replaces the former repeated tuck and hard
 // z=.49 cutoff, which folded triangles into a bright chip above the ear.
 const w=Math.exp(-Math.pow((x+.857)/.167,4))*Math.exp(-Math.pow((y+.005)/.410,4));
 if(w<.000001)return z;
 // Compress depth monotonically at the entrance, then release it smoothly.
 // A rising displacement gate can invert the surface even when it is smooth.
 const target=z>.070?.070+.026*Math.tanh((z-.070)/.026):z;
 return z-(z-target)*w*(1-smooth(.47,.70,z))*.995;
}
function crownField(forehead){
 return(side,u,v,lift=0)=>{
  const phi=side*Math.PI*(1-u),theta=sampleTable(side<0?leftEdge:rightEdge,Math.abs(phi));
  const partX=.185+.028*Math.sin(u*Math.PI)+.009*Math.sin(u*Math.PI*8),rootZ=mix(-.665,.625,u),rx=(partX-.012)/.94,rz=(rootZ+.077)/.857;
  const r=V(rx,Math.sqrt(Math.max(.025,1-rx*rx-rz*rz)),rz).normalize();
  const edge=V(Math.sin(theta)*Math.sin(phi),Math.cos(theta),Math.sin(theta)*Math.cos(phi));
  // Spherical interpolation avoids crown ridges where independent root curves
  // used to turn abruptly toward their separate long bundles.
  const angle=Math.acos(clamp(r.dot(edge),-1,1)),sin=Math.sin(angle),t=clamp(v);
  let n=sin<.00001?r.clone().lerp(edge,t).normalize():r.multiplyScalar(Math.sin((1-t)*angle)/sin).addScaledVector(edge,Math.sin(t*angle)/sin);
  const puff=(side<0?.026:.012)*Math.sin(v*Math.PI)*smooth(.12,.60,u);
  const p=V(.012+(.94+lift+puff)*n.x,.327+(1.302+lift*.35+puff)*n.y,-.077+(.857+lift+puff)*n.z);
  if(p.z>0&&p.y>.14&&p.y<1.43){const z=forehead(p.x,p.y),weight=smooth(.08,.24,z)*smooth(.16,.38,p.y)*(1-smooth(1.24,1.46,p.y));p.z=Math.max(p.z,mix(p.z,z+.021+lift,weight));}
  return p;
 };
}
function makeMaps(){
 const w=512,h=1024,p=new Uint8Array(w*h*4),n=new Uint8Array(w*h*4),f=new Uint8Array(w*h*4),r=rng(227819),lanes=192,shade=[],phase=[],tip=[];
 // Near-white grain keeps the mapped mass and unmapped real fibers at the same
 // mean albedo. The unchanged alpha and normal relief provide the fine texture.
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
function makeMesh(b,material,name,headTilt,castShadow=true,deformEar=true){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,b.rgba?4:3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.i);
 // THREE's head Euler transform is Ry * Rz. The long hair follows gravity
 // using its inverse Rz * Ry below the neck, while roots keep the head pose.
 const p=g.attributes.position;let untucked=0;
 for(let i=0;i<p.count;i++){const skip=b.untucked?.[untucked]===i;if(skip)untucked++;let x=p.getX(i),y=p.getY(i),z=deformEar&&!skip?earDepth(x,y,p.getZ(i)):p.getZ(i),w=1-smooth(-1.64,.38,y),ay=-.16*w,az=-headTilt*w,cy=Math.cos(ay),sy=Math.sin(ay),cz=Math.cos(az),sz=Math.sin(az),xx=x*cy+z*sy;z=-x*sy+z*cy;p.setXYZ(i,xx*cz-y*sz,xx*sz+y*cz,z);}
 g.computeVertexNormals();
 if(b.seam||b.normalSeams){
  const n=g.attributes.normal,weld=(a,c)=>{const x=n.getX(a)+n.getX(c),y=n.getY(a)+n.getY(c),z=n.getZ(a)+n.getZ(c),l=Math.hypot(x,y,z)||1;n.setXYZ(a,x/l,y/l,z/l);n.setXYZ(c,x/l,y/l,z/l);};
  if(b.seam)for(let i=0;i<=128;i++)weld(b.seam[0]+i,b.seam[1]+i);
  if(b.normalSeams)for(let i=0;i<b.normalSeams.length;i+=2)weld(b.normalSeams[i],b.normalSeams[i+1]);
 }
 g.computeBoundingBox();g.computeBoundingSphere();const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=castShadow;m.receiveShadow=true;return m;
}
const curve=points=>new THREE.CatmullRomCurve3(points.map(p=>p.isVector3?p:V(...p)),false,'catmullrom',.38);
function frame(c,t,front=false){
 const p=c.getPoint(t),d=c.getTangent(t).normalize();
 let n=front?V(p.x*.085,.025,1):V(p.x,.025,p.z+.077);
 if(n.lengthSq()<.01)n=V(0,0,-1);n.normalize();
 // At the crown, the true ellipsoid normal has a large vertical component.
 // A horizontal radial normal incorrectly tips each lock on its edge there.
 const scalp=V((p.x-.012)/(.94*.94),(p.y-.327)/(1.302*1.302),(p.z+.077)/(.857*.857)).normalize();
 // Keep the frame wrapped around the temple and ear before the lengths turn
 // over the chest. A front-facing frame here produces a planar sideburn flap.
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
 const f=frame(g.c,t,g.front),shape=lockShape(t,g,f.p),phase=g.phase;
 // An opaque lock grows out of the common crown surface. Its root begins
 // inside that surface, and its depth develops along its own flow. No common
 // height or alpha cutoff can create a horizontal ring around the head.
 const root=g.scalpRoot?(1-smooth(.035+.012*Math.sin(phase),.32+.045*Math.sin(phase*.71+.6),t))*smooth(-.20,.20,f.p.y):0;
 return{f,shape,root,depth:g.d*(1-.97*root),inset:-.021*root,undulate:1+.045*Math.sin(t*9+phase)};
}
function longLock(b,g){
 const steps=60,around=8,first=b.p.length/3;
 for(let j=0;j<=steps;j++){
  const t=j/steps,{f,shape,root,depth,inset,undulate}=lockSection(g,t),base=g.color.clone();if(g.crownColor)base.lerp(g.crownColor,root);
  for(let k=0;k<=around;k++){
   const a=k/around*TAU,cs=Math.cos(a),sn=Math.sin(a),p=f.p.clone().addScaledVector(f.s,g.w*shape*cs*undulate).addScaledVector(f.n,inset+depth*shape*sn),shade=mix(.974+.018*Math.sin(g.phase+k*.8+t*3),1,root);
   vertex(b,p,base.clone().multiplyScalar(shade),k/around+g.phase*.173,t,1,g.deformEar);
  }
 }
 for(let j=0;j<steps;j++)for(let k=0;k<around;k++){const a=first+j*(around+1)+k,c=a+around+1;b.i.push(a,c,a+1,a+1,c,c+1);}
}
function ribbon(b,c,width,color,steps=28,front=true,phase=0,tip=.83,deformEar=true){
 const first=b.p.length/3;
 for(let j=0;j<=steps;j++){
  const t=j/steps,f=frame(c,t,front),w=width*(.20+.80*smooth(0,.027,t))*(.02+.98*(1-smooth(tip,1,t)));
  const col=color.clone().multiplyScalar(.94+.045*smooth(0,.15,t)+.012*Math.sin(t*11+phase));
  vertex(b,f.p.clone().addScaledVector(f.s,-w),col,0,t*.74,1,deformEar);vertex(b,f.p.clone().addScaledVector(f.s,w),col,1,t*.74,1,deformEar);
 }
 for(let j=0;j<steps;j++){const a=first+j*2,c=a+2;b.i.push(a,a+1,c,a+1,c+1,c);}
}
function roundFiber(b,c,r,color,steps=20){
 const first=b.p.length/3;
 for(let j=0;j<=steps;j++){const t=j/steps,f=frame(c,t,true),radius=r*(.35+.65*smooth(0,.03,t))*(.035+.965*(1-smooth(.79,1,t)));for(let k=0;k<=4;k++){const a=k*TAU/4,p=f.p.clone().addScaledVector(f.s,radius*Math.cos(a)).addScaledVector(f.n,radius*Math.sin(a));vertex(b,p,color,k/4,t*.74,1,false);}(b.normalSeams??=[]).push(first+j*5,first+j*5+4);}
 for(let j=0;j<steps;j++)for(let k=0;k<4;k++){const a=first+j*5+k,c=a+5;b.i.push(a,c,a+1,a+1,c,c+1);}
}
function shoulderClearance(p,route=1){
 // Clearance changes depth, never the silhouette width. Hair follows the
 // front or back of a shoulder instead of springing sideways into a wing.
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
 // The original right guides descended below the ear, then reversed upward
 // to a fixed control point. Exact crown flow now joins two monotonic passages
 // with matching tangent directions, then the unchanged lower drape spline.
 const left=side<0,q=clamp((u-(left?.49:.44))/(left?.215:.22)),exitY=left?.76+.10*q:.83+.075*q;
 let lo=.22,hi=1;for(let j=0;j<22;j++){const v=(lo+hi)/2;if(crown(side,u,v,.008).y>exitY)lo=v;else hi=v;}const exit=(lo+hi)/2;
 const scalp={getPoint:t=>crown(side,u,mix(.22,exit,t),.008),getTangent(t){const v=mix(.22,exit,t);return crown(side,u,v+.0001,.008).sub(crown(side,u,v-.0001,.008)).normalize();}};
 // Replace the six sampled crown knots and fixed upper-ear knot; retain the
 // lower-ear knot and every shoulder, wave, and tip control point after it.
 const tail=curve(points.slice(7)),a=scalp.getPoint(1),b=V(side*(left?.919+.008*q:.858+.042*q),left?.27:.17,left?.078:.355-.030*q),c=tail.getPoint(0),slope=d=>d.multiplyScalar(1/Math.max(.025,-d.y));
 const m0=slope(scalp.getTangent(1)),m1=V(side*.015,-1,left?0:.025),m2=slope(tail.getTangent(0)),segments=[scalp,hermiteFall(a,b,m0,m1),hermiteFall(b,c,m1,m2),tail],lengths=[];
 for(const s of segments){let sum=0,p=s.getPoint(0);for(let j=1;j<=24;j++){const n=s.getPoint(j/24);sum+=Math.hypot(n.x-p.x,n.y-p.y,n.z-p.z);p=n;}lengths.push(sum);}
 const total=lengths.reduce((a,b)=>a+b,0),cuts=[0];for(const l of lengths)cuts.push(cuts[cuts.length-1]+l/total);cuts[4]=1;
 const locate=t=>{t=clamp(t);let i=0;while(i<3&&t>cuts[i+1])i++;return[i,clamp((t-cuts[i])/(cuts[i+1]-cuts[i]))];};
 return{getPoint(t){const[i,v]=locate(t);return segments[i].getPoint(v);},getTangent(t){const[i,v]=locate(t);return segments[i].getTangent(v);},debug:{side,u,exitV:exit,crownExit:[a.x,a.y,a.z],upperEar:[b.x,b.y,b.z],lowerJoin:[c.x,c.y,c.z],cuts}};
}

export function createGroomHair({headTilt=-.17}={}){
 const start=performance.now(),root=new THREE.Group();root.name='Original reference-directed chestnut layered groom';
 const random=rng(),forehead=foreheadField(),crown=crownField(forehead),maps=makeMaps(),crownBatch=batch(true),mass=batch(),detail=batch(),fringe=batch(),wisps=batch(),guides=[];
 const palette=['#4c403c','#554642','#433937','#5c4d49','#463b38','#51433f'].map(c=>new THREE.Color(c)),pick=()=>palette[Math.floor(random()*palette.length)].clone();
 const material=new THREE.MeshPhysicalMaterial({vertexColors:true,map:maps.map,normalMap:maps.normalMap,normalScale:new THREE.Vector2(.31,.09),roughness:.52,metalness:0,anisotropy:.65,anisotropyRotation:Math.PI*.5,specularIntensity:.38,specularColor:'#ffffff',envMapIntensity:.42,alphaTest:.10,alphaToCoverage:true,side:THREE.DoubleSide});
 const crownMaterial=material.clone();crownMaterial.map=maps.crownMap;
 const fineMaterial=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.52,metalness:0,anisotropy:.65,anisotropyRotation:Math.PI*.5,specularIntensity:.38,specularColor:'#ffffff',envMapIntensity:.42,alphaTest:.05,alphaToCoverage:true,side:THREE.DoubleSide});
 const fringeMaterial=fineMaterial.clone();fringeMaterial.alphaTest=0;fringeMaterial.alphaToCoverage=false;fringeMaterial.roughness=.90;fringeMaterial.specularIntensity=0;fringeMaterial.anisotropy=0;fringeMaterial.envMapIntensity=0;
 const wispMaterial=fringeMaterial.clone();wispMaterial.transparent=true;wispMaterial.depthWrite=false;wispMaterial.opacity=.65;wispMaterial.forceSinglePass=true;
 // The mathematical scalp foundation is fully closed around the back of the
 // part. It sits inside the directional crown sheets and closes their rear root
 // gap without introducing an untextured or exposed forehead cap.
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
 function guide(points,width,depth,color,front,phase,kind,scalpRoot=null){const authored=new THREE.Color(color),base=new THREE.Color('#50413e');authored.lerp(base,.82);const u=scalpRoot?.u,crownColor=scalpRoot?base.clone().multiplyScalar(.96+.045*Math.sin(u*17+.8)+.012*Math.sin(u*79)):null,joined=front&&!!scalpRoot,g={c:joined?continuousFrontRoot(crown,scalpRoot.side,u,points):curve(points),w:width,d:depth,color:authored,front,phase,kind,scalpRoot,crownColor,deformEar:!joined,tipY:points.at(-1).y??points.at(-1)[1]};guides.push(g);longLock(mass,g);return g;}
 function rootPath(side,u){
  // The large locks begin underneath the fine part fibers.
  const ps=[];for(const v of[.22,.38,.55,.72,.88,1])ps.push(crown(side,u,v,.008));return ps;
 }
 function fallingRoot(side,u){
  // Rear hair leaves near the greatest scalp depth, then its matched exit
  // tangent gradually turns downward through the nape.
  let lo=0,hi=1;
  for(let j=0;j<24;j++){const v=(lo+hi)/2;if(crown(side,u,v,.008).y>.39)lo=v;else hi=v;}
  const exit=(lo+hi)/2,ps=[];
  for(const f of[.22,.40,.60,.80,1])ps.push(crown(side,u,exit*f,.008));
  const end=ps[ps.length-1],a=crown(side,u,Math.max(0,exit-.002),.008),b=crown(side,u,Math.min(1,exit+.002),.008),dy=Math.max(.00001,a.y-b.y);
  const sx=clamp((b.x-a.x)/dy,-.45,.45),sz=clamp((b.z-a.z)/dy,-.45,.45);
  for(const drop of[.16,.36,.61]){const ease=.40*(1-Math.exp(-drop/.40));ps.push(V(end.x+sx*ease,end.y-drop,end.z+sz*ease));}
  return ps;
 }
 // Long rear layers have staggered levels and unequal shallow S-curves. Their
 // outer paths turn around the shoulders rather than intersecting a white sleeve.
 for(const side of[-1,1])for(let k=0;k<29;k++){
  const q=(k+.15+random()*.35)/29,u=.015+q*.565,phi=side*(Math.PI-u*Math.PI),phase=Math.floor(k/3)*2.399+(side<0?.35:1.4),ps=fallingRoot(side,u);
  const family=Math.floor(k/2),end=-3.84+.42*Math.pow(q,.9)+.17*Math.sin(family*2.13+side*.8)+.045*Math.sin(k*1.17),bend=.08*Math.sin(family*1.61+side*.8)+.035*Math.sin(k*.87);
  for(let j=0;j<8;j++){
   const t=j/7,y=mix(-.68,end,t),f=smooth(0,.65,t),a=side*mix(Math.abs(phi),Math.max(1.89,Math.abs(phi)),smooth(.04,.49,t))+side*.028*Math.sin(t*4.3+phase),rx=.96+.27*Math.sin(t*Math.PI*.92)-.07*smooth(.80,1,t),rz=.88+.095*Math.sin(t*Math.PI),wave=(.043+.032*Math.abs(Math.sin(phase)))*Math.sin(t*6.9+phase)*f;
   const turn=smooth(.59,1,t),p=V(Math.sin(a)*rx+wave+bend*turn,y,-.09+Math.cos(a)*rz+.09*Math.sin(t*6.5+phase*.7)*f+.043*Math.cos(family*1.61)*turn);shoulderClearance(p,-1);ps.push(p);
  }
  guide(ps,.077+random()*.016,.017+random()*.008,k%4?'#433631':'#4b3d36',false,phase,'back',{side,u});
 }
 // Each front family contains neighboring fibers, while different families
 // overlap in depth and finish in different curls. This avoids one uniform fan.
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
 // Smaller side layers descend close to the head, then divide naturally
 // around the shoulder in depth. They do not expand into isolated outer wings.
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
 // Fine surface strands share each lock's shape and vary at their trailing ends.
 let fiberCount=0;
 for(const g of guides){
  const count=g.kind==='front'?43:g.kind==='curl'?54:g.kind==='back'?34:(g.kind==='inner'||g.kind==='inner-back')?16:28;
  for(let k=0;k<count;k++){
   const lane=(k+.1+random()*.8)/count*2-1,side=k%7===0?-1:1,phase=random()*TAU,end=.935+random()*.065,ps=[];
   for(let j=0;j<=18;j++){
    const t=j/18,{f,shape,root,depth:sectionDepth,inset,undulate}=lockSection(g,t*end),spread=lane*g.w*shape*undulate,depth=side*(sectionDepth*Math.sqrt(Math.max(.01,1-lane*lane))+.0028*(1-.98*root))*shape;
    const tip=smooth(.70,1,t),p=f.p.clone().addScaledVector(f.s,spread+.0019*Math.sin(t*29+phase)).addScaledVector(f.n,inset+depth);
    p.x+=.024*Math.sin(phase)*tip;p.y+=(random()-.5)*.018*tip;p.z+=.016*Math.cos(phase)*tip;ps.push(p);
   }
   ribbon(detail,curve(ps),.00063+random()*.00039,pick().lerp(new THREE.Color('#69564b'),k%13===0?.40:0),28,g.front,phase,.85+random()*.10,g.deformEar);fiberCount++;
  }
 }
 // Fine crown lines follow the same exact flow field as the continuous sheets.
 for(const side of[-1,1])for(let k=0;k<1150;k++){
  const u=(k+.15+random()*.70)/1150,phase=random()*TAU,end=.985+random()*.015,ps=[];
  for(let j=0;j<=20;j++){const v=j/20*end,p=crown(side,clamp(u+.0007*Math.sin(v*7+phase)),v,.006+random()*.0014);ps.push(p);}
  ribbon(detail,curve(ps),.00048+random()*.00028,pick(),26,false,phase,.96);fiberCount++;
 }
 // Round core fibers gather into small unequal families. Sparse companion
 // strands vary in depth, bend, and length rather than filling a flat swath.
 const bangGuides=[
  {n:270,w:.075,u:.810,v:.76,points:[[.17,1.44],[-.12,1.20],[-.37,.90],[-.52,.48],[-.67,-.20]]},
  {n:245,w:.069,u:.900,v:.72,points:[[.21,1.42],[.03,1.18],[-.18,.85],[-.32,.46],[-.44,.12]]},
  {n:105,w:.043,u:.936,v:.53,points:[[.24,1.43],[.15,1.15],[.02,.80],[-.08,.46],[-.22,.22]]},
  {n:300,w:.068,u:.865,v:.66,points:[[.27,1.42],[.34,1.14],[.32,.83],[.22,.48],[.03,.20]]},
  {n:120,w:.037,u:.820,v:.58,points:[[.31,1.37],[.42,1.11],[.46,.83],[.40,.55],[.22,.24]]},
  {n:95,w:.031,u:.770,v:.62,points:[[.33,1.38],[.51,1.08],[.55,.77],[.54,.47],[.40,.16]]},
  {n:170,w:.045,u:.715,v:.53,points:[[.35,1.40],[.61,1.10],[.69,.75],[.71,.38],[.66,0]]}
 ];
 for(let group=0;group<bangGuides.length;group++){
  const g=bangGuides[group];
  for(let k=0;k<g.n;k++){
   const family=k%(group%2?9:8),phase=family*2.399+group*.71,loose=k%4===0,center=Math.sin(phase)*g.w*.82,spread=(random()-.5)*g.w*(loose?2.9:.23),lift=.068+.023*Math.cos(group*.91)+.012*Math.sin(phase),ps=[];
   for(let j=0;j<g.points.length;j++){
    const t=j/(g.points.length-1),bow=Math.sin(t*Math.PI),x=g.points[j][0]+center*(.15+.85*bow)+spread*(.12+.88*t)+.024*Math.sin(phase+t*4.4)*bow,y=g.points[j][1]+.026*Math.sin(phase)*t+(random()-.5)*.018*t;
    const z=forehead(x,Math.max(.22,y))+.024+lift*Math.pow(bow,.8)+.004*Math.sin(k*2.7)*bow+(y<.22?(.22-y)*.045:0);ps.push(V(x,y,z));
   }
   const side=group<3?-1:1,u=g.u+center*.15+spread*.08,root=[];
   for(let j=0;j<4;j++)root.push(crown(side,u,mix(.025,g.v,j/3),.009+.002*Math.sin(phase)));
   // Start on the real parted crown, not behind it at the forehead depth.
   // The original bowed lower controls and family-specific ends remain intact.
   const c=curve([...root,...ps.slice(2)]),cut=clamp(.88+.10*(.5+.5*Math.sin(phase+1.2))+(loose?-.06+random()*.12:-.01+random()*.05)+(group===0?.025:0)),end=1-(1-cut)*4/6,trim=[];
   for(let j=0;j<=20;j++){const p=c.getPoint(j/20*end),delta=forehead(p.x,Math.max(.22,p.y))+.040-p.z;p.z+=.5*(delta+Math.hypot(delta,.006))*smooth(.14,.26,p.y)*(1-smooth(1.37,1.48,p.y));trim.push(p);}
   const col=pick().lerp(new THREE.Color('#655652'),.16),strand=curve(trim);if(loose)ribbon(fringe,strand,.00031+random()*.00016,col,20,true,phase,.82+random()*.10,false);else roundFiber(fringe,strand,.00042+random()*.00024,col);fiberCount++;
  }
 }
 // Many short hairs continue the actual crown tangent across the edge. The
 // two lengths of transition blend the dense root into sparse outer wisps.
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
  const g=guides[Math.floor(random()*guides.length)],startT=.18+random()*.66,ps=[],phase=random()*TAU;
  for(let j=0;j<=12;j++){const t=j/12,at=mix(startT,Math.min(1,startT+.24+random()*.03),t),f=frame(g.c,at,g.front),p=f.p.clone().addScaledVector(f.s,(k%2?1:-1)*g.w*(.83+.22*Math.sin(t*Math.PI))).addScaledVector(f.n,.011+.018*Math.sin(t*Math.PI));ps.push(p);}
  ribbon(detail,curve(ps),.00045+random()*.00022,pick(),24,g.front,phase,.80,g.deformEar);fiberCount++;
 }
 root.add(makeMesh(crownBatch,crownMaterial,'Continuous parted crown with longitudinal fiber flow',headTilt),makeMesh(mass,material,'Overlapping layered S-wave hair around front back and shoulders',headTilt),makeMesh(detail,fineMaterial,'Independent fine crown lengths and silhouette strands',headTilt,false),makeMesh(fringe,fringeMaterial,'Dense fine bowed brown fringe strands',headTilt,false),makeMesh(wisps,wispMaterial,'Sparse short temple edge and hairline wisps',headTilt,false,false));
 root.children[root.children.length-2].renderOrder=3;root.children[root.children.length-1].renderOrder=4;
 let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.index.count/3;bytes+=o.geometry.index.array.byteLength;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});
 root.userData={procedural:true,continuousCrownSheets:2,closedInsetScalp:true,smoothSingleEarTuck:true,opaqueBuriedRoots:true,roundedFringe:true,fringeStrands:bangGuides.reduce((n,g)=>n+g.n,0),fiberSeamNormals:true,matchedMassFiberAlbedo:true,lowVarianceFiberAlbedo:true,originalLayeredLocks:guides.length,individualStrands:fiberCount,triangles,geometryMiB:Number((bytes/1048576).toFixed(2)),constructionMs:Number((performance.now()-start).toFixed(1)),source:'Only the supplied image guided this original 3D groom. All geometry and longitudinal hair maps were authored mathematically; no hair photos or external assets.',headTiltCompensation:headTilt,lowerHairYawCompensation:.16};
 root.userData.frontRootJoins=[90,91,114].map(id=>({guide:id,...guides[id].c.debug}));
 return root;
}
