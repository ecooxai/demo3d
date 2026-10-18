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
function tuckEar(p){
 const w=Math.exp(-Math.pow((p.x+.857)/.148,4))*Math.exp(-Math.pow((p.y+.012)/.352,4));
 if(p.z>.072&&p.z<.49)p.z=mix(p.z,.068,w*.995);
 return p;
}
function crownField(forehead){
 return(side,u,v,lift=0)=>{
  const phi=side*Math.PI*(1-u),theta=sampleTable(side<0?leftEdge:rightEdge,Math.abs(phi));
  const partX=.188+.018*Math.sin(u*Math.PI),rootZ=mix(-.665,.625,u),rx=(partX-.012)/.94,rz=(rootZ+.077)/.857;
  const r=V(rx,Math.sqrt(Math.max(.025,1-rx*rx-rz*rz)),rz).normalize();
  const edge=V(Math.sin(theta)*Math.sin(phi),Math.cos(theta),Math.sin(theta)*Math.cos(phi));
  // Spherical interpolation avoids crown ridges where independent root curves
  // used to turn abruptly toward their separate long bundles.
  const angle=Math.acos(clamp(r.dot(edge),-1,1)),sin=Math.sin(angle),t=smooth(0,1,v);
  let n=sin<.00001?r.clone().lerp(edge,t).normalize():r.multiplyScalar(Math.sin((1-t)*angle)/sin).addScaledVector(edge,Math.sin(t*angle)/sin);
  const puff=(side<0?.026:.012)*Math.sin(v*Math.PI)*smooth(.12,.60,u);
  const p=V(.012+(.94+lift+puff)*n.x,.327+(1.302+lift*.35+puff)*n.y,-.077+(.857+lift+puff)*n.z);
  if(p.z>0&&p.y>.14&&p.y<1.43){const z=forehead(p.x,p.y),weight=smooth(.08,.24,z)*smooth(.16,.38,p.y)*(1-smooth(1.24,1.46,p.y));p.z=Math.max(p.z,mix(p.z,z+.021+lift,weight));}
  return tuckEar(p);
 };
}
function makeMaps(){
 const w=512,h=1024,p=new Uint8Array(w*h*4),n=new Uint8Array(w*h*4),r=rng(227819),lanes=192,shade=[],phase=[],tip=[];
 for(let i=0;i<lanes;i++){shade.push(.80+r()*.19);phase.push(r()*TAU);tip.push(.86+r()*.138);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/(h-1),lane=Math.min(lanes-1,Math.floor(u*lanes)),q=u*lanes-lane,ph=phase[lane],bend=.024*Math.sin(v*8+ph),ridge=Math.sin((q+bend)*TAU);
  const value=shade[lane]*(.969+.031*Math.cos((q+bend)*TAU))+.008*Math.sin(v*16+ph),k=(y*w+x)*4;
  p[k]=Math.round(255*value);p[k+1]=Math.round(254*value);p[k+2]=Math.round(254*value);
  p[k+3]=Math.round(255*(1-smooth(tip[lane]-.022,tip[lane],v)));
  const nx=.145*ridge,ny=.004*Math.cos(v*8+ph),len=Math.hypot(nx,ny,1);
  n[k]=Math.round(127.5*(nx/len+1));n[k+1]=Math.round(127.5*(ny/len+1));n[k+2]=Math.round(127.5*(1/len+1));n[k+3]=255;
 }
 const make=d=>{const t=new THREE.DataTexture(d,w,h,THREE.RGBAFormat);t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.ClampToEdgeWrapping;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;};
 const map=make(p),normalMap=make(n);map.colorSpace=THREE.SRGBColorSpace;map.name='Original cool chestnut continuous longitudinal fibers';normalMap.name='Original fine longitudinal hair relief';return{map,normalMap};
}
function batch(rgba=false){return{p:[],c:[],uv:[],i:[],rgba};}
function vertex(b,p,c,u,v,alpha=1){const at=b.p.length/3;b.p.push(p.x,p.y,p.z);b.c.push(c.r,c.g,c.b);if(b.rgba)b.c.push(alpha);b.uv.push(u,v);return at;}
function makeMesh(b,material,name,headTilt,castShadow=true){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,b.rgba?4:3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.i);
 // THREE's head Euler transform is Ry * Rz. The long hair follows gravity
 // using its inverse Rz * Ry below the neck, while roots keep the head pose.
 const p=g.attributes.position;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i),w=1-smooth(-1.64,.38,y),ay=-.16*w,az=-headTilt*w,cy=Math.cos(ay),sy=Math.sin(ay),cz=Math.cos(az),sz=Math.sin(az),xx=x*cy+z*sy;z=-x*sy+z*cy;p.setXYZ(i,xx*cz-y*sz,xx*sz+y*cz,z);}
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=castShadow;m.receiveShadow=true;return m;
}
const curve=points=>new THREE.CatmullRomCurve3(points.map(p=>p.isVector3?p:V(...p)),false,'catmullrom',.38);
function frame(c,t,front=false){
 const p=c.getPoint(t),d=c.getTangent(t).normalize();
 let n=front?V(p.x*.085,.025,1):V(p.x,.025,p.z+.077);
 if(n.lengthSq()<.01)n=V(0,0,-1);n.normalize();
 // At the crown, the true ellipsoid normal has a large vertical component.
 // A horizontal radial normal incorrectly tips each lock on its edge there.
 const scalp=V((p.x-.012)/(.94*.94),(p.y-.327)/(1.302*1.302),(p.z+.077)/(.857*.857)).normalize();
 n.lerp(scalp,smooth(.06,.68,p.y)).normalize();
 const side=d.clone().cross(n);if(side.lengthSq()<.001)side.set(1,0,0);else side.normalize();n=side.clone().cross(d).normalize();return{p,d,n,s:side};
}
function lockShape(t){return(.025+.975*smooth(0,.060,t))*(1-.988*smooth(.62,1,t));}
function longLock(b,g){
 const steps=60,around=8,first=b.p.length/3;
 for(let j=0;j<=steps;j++){
  const t=j/steps,f=frame(g.c,t,g.front),shape=lockShape(t),undulate=1+.045*Math.sin(t*9+g.phase);
  for(let k=0;k<=around;k++){
   const a=k/around*TAU,cs=Math.cos(a),sn=Math.sin(a),p=f.p.clone().addScaledVector(f.s,g.w*shape*cs*undulate).addScaledVector(f.n,g.d*shape*sn),shade=.974+.018*Math.sin(g.phase+k*.8+t*3);
   vertex(b,p,g.color.clone().multiplyScalar(shade),k/around+g.phase*.173,t);
  }
 }
 for(let j=0;j<steps;j++)for(let k=0;k<around;k++){const a=first+j*(around+1)+k,c=a+around+1;b.i.push(a,c,a+1,a+1,c,c+1);}
}
function ribbon(b,c,width,color,steps=28,front=true,phase=0,tip=.83){
 const first=b.p.length/3;
 for(let j=0;j<=steps;j++){
  const t=j/steps,f=frame(c,t,front),w=width*(.20+.80*smooth(0,.027,t))*(.02+.98*(1-smooth(tip,1,t)));
  const col=color.clone().multiplyScalar(.94+.045*smooth(0,.15,t)+.012*Math.sin(t*11+phase));
  vertex(b,f.p.clone().addScaledVector(f.s,-w),col,0,t*.74);vertex(b,f.p.clone().addScaledVector(f.s,w),col,1,t*.74);
 }
 for(let j=0;j<steps;j++){const a=first+j*2,c=a+2;b.i.push(a,a+1,c,a+1,c+1,c);}
}
function shoulderClearance(p,route=1){
 // Clearance changes depth, never the silhouette width. Hair follows the
 // front or back of a shoulder instead of springing sideways into a wing.
 const w=smooth(-1.43,-1.99,p.y);if(w<=0)return p;
 const rx=1.72-.10*smooth(-2.3,-3.9,p.y),rz=route>0?.81:.63;
 const boundary=rz*Math.sqrt(Math.max(0,1-Math.pow(p.x/rx,2)))+.018;
 if(route*p.z<boundary)p.z=mix(p.z,route*boundary,w*.97);
 return p;
}

export function createGroomHair({headTilt=-.17}={}){
 const start=performance.now(),root=new THREE.Group();root.name='Original reference-directed chestnut layered groom';
 const random=rng(),forehead=foreheadField(),crown=crownField(forehead),maps=makeMaps(),crownBatch=batch(true),mass=batch(),detail=batch(),fringe=batch(),guides=[];
 const palette=['#4c403c','#554642','#433937','#5c4d49','#463b38','#51433f'].map(c=>new THREE.Color(c)),pick=()=>palette[Math.floor(random()*palette.length)].clone();
 const material=new THREE.MeshPhysicalMaterial({vertexColors:true,map:maps.map,normalMap:maps.normalMap,normalScale:new THREE.Vector2(.31,.09),roughness:.52,metalness:0,anisotropy:.65,anisotropyRotation:Math.PI*.5,specularIntensity:.38,specularColor:'#ffffff',envMapIntensity:.42,alphaTest:.10,alphaToCoverage:true,side:THREE.DoubleSide});
 const crownMaterial=material.clone();crownMaterial.roughness=.54;crownMaterial.specularIntensity=.35;
 const fineMaterial=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.49,metalness:0,anisotropy:.62,specularIntensity:.45,specularColor:'#ffffff',envMapIntensity:.36,side:THREE.DoubleSide});
 const fringeMaterial=fineMaterial.clone();fringeMaterial.transparent=true;fringeMaterial.opacity=.65;fringeMaterial.depthWrite=false;fringeMaterial.forceSinglePass=true;
 // The mathematical scalp foundation is fully closed around the back of the
 // part. It sits inside the directional crown sheets and closes their rear root
 // gap without introducing an untextured or exposed forehead cap.
 {
  const nu=144,nv=52,first=crownBatch.p.length/3,c=new THREE.Color('#493b37');
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
   const phi=-Math.PI+i/nu*TAU,edge=mix(.78+.10*Math.abs(Math.sin(phi)),2.20,smooth(.95,1.8,Math.abs(phi))),theta=j/nv*edge;
   const p=V(.012+.922*Math.sin(theta)*Math.sin(phi),.327+1.282*Math.cos(theta),-.077+.839*Math.sin(theta)*Math.cos(phi));
   vertex(crownBatch,p,c,i/nu,j/nv*.72,1);
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=first+j*(nu+1)+i,b=a+nu+1;crownBatch.i.push(a,b,a+1,a+1,b,b+1);}
 }
 // The two continuous crown sheets meet along a restrained off-center part.
 // Their UV-v direction is the direction of growth, including the large left sweep.
 for(const side of[-1,1]){
  const nu=128,nv=64,first=crownBatch.p.length/3;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
   const u=i/nu,v=j/nv,p=crown(side,u,v,.002),shade=.96+.045*Math.sin(u*17+.8)+.012*Math.sin(u*79),c=new THREE.Color(side<0?'#51423f':'#4f403d').multiplyScalar(shade);
   const feather=1-smooth(.875,1,v)*smooth(.38,.56,u)*.999;
   vertex(crownBatch,p,c,u,v*.73,feather);
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=first+j*(nu+1)+i,c=a+nu+1;if(side>0)crownBatch.i.push(a,a+1,c,a+1,c+1,c);else crownBatch.i.push(a,c,a+1,a+1,c,c+1);}
 }
 function guide(points,width,depth,color,front,phase,kind){const authored=new THREE.Color(color),base=new THREE.Color('#50413e');authored.lerp(base,.82);const g={c:curve(points),w:width,d:depth,color:authored,front,phase,kind};guides.push(g);longLock(mass,g);return g;}
 function rootPath(side,u){
  // Large locks begin under the flowing crown, leaving the part to its much
  // finer surface strands rather than making a row of raised lock roots.
  const ps=[];for(const v of[.22,.38,.55,.72,.88,1])ps.push(crown(side,u,v,.008));return ps;
 }
 function fallingRoot(side,u){
  // Long rear hair leaves the scalp near its greatest depth, before the scalp
  // curves inward toward the nape. The exit direction continues smoothly and
  // gradually becomes vertical, with no inward-then-outward ponytail join.
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
  const end=-3.48-.25*Math.sin(q*Math.PI*.89)+.24*Math.sin(Math.floor(k/3)*2.07+side)+.065*(k%3-1);
  for(let j=0;j<8;j++){
   const t=j/7,y=mix(-.68,end,t),f=smooth(0,.65,t),a=side*mix(Math.abs(phi),Math.max(1.89,Math.abs(phi)),smooth(.04,.49,t))+side*.028*Math.sin(t*4.3+phase),rx=.96+.27*Math.sin(t*Math.PI*.92)-.07*smooth(.80,1,t),rz=.88+.095*Math.sin(t*Math.PI),wave=(.062+.060*Math.abs(Math.sin(phase)))*Math.sin(t*6.9+phase)*f;
   const p=V(Math.sin(a)*rx+wave,y,-.09+Math.cos(a)*rz+.09*Math.sin(t*6.5+phase*.7)*f);shoulderClearance(p,-1);ps.push(p);
  }
  guide(ps,.077+random()*.016,.017+random()*.008,k%4?'#433631':'#4b3d36',false,phase,'back');
 }
 // Each front family contains neighboring fibers, while different families
 // overlap in depth and finish in different curls. This avoids one uniform fan.
 for(const side of[-1,1]){
  const left=side<0,count=left?33:42;
  for(let k=0;k<count;k++){
   const q=k/(count-1),family=Math.floor(k/3),lane=k%3-1,phase=family*2.399+(left?.55:1.72),u=(left?.49:.44)+q*(left?.215:.22),ps=rootPath(side,u);
   const end=(left?-3.90:-3.83)+.235*Math.sin(family*1.93+side)+.055*lane;
   const depth=.074*Math.sin(family*1.71)+.018*lane,amp=.075+.070*(.5+.5*Math.sin(family*1.41));
   const wave=t=>amp*Math.sin(t*6.2+phase),zWave=t=>depth+.065*Math.cos(t*5.4+phase);
   if(left)ps.push(
    [-.91-.018*q,-.28,.035-.02*q],[-.945-.022*q,-.78,.054+.012*q],
    [-.79-.24*q,-1.29,.36+.07*q],[-.64-.56*q+wave(.15),-1.90,.79+zWave(.15)],
    [-.68-.67*q+wave(.38),-2.48,.94+zWave(.38)],
    [-.81-.74*q+wave(.60),-3.05,1.00+zWave(.60)],
    [-.84-.58*q+wave(.75),end+.39,.98+zWave(.75)],
    [-.75-.46*q+wave(.88),end+.11,.89+zWave(.88)],
    [-.60-.40*q+wave(1),end+.055*Math.sin(family*1.3),.73+zWave(1)]);
   else ps.push(
    [.90+.028*q,-.28,.225-.04*q],[.95+.044*q,-.79,.275+.025*q],
    [.79+.34*q,-1.28,.47+.05*q],[.66+.67*q+wave(.15),-1.90,.88+zWave(.15)],
    [.66+.83*q+wave(.38),-2.45,1.02+zWave(.38)],
    [.82+.73*q+wave(.60),-3.01,1.09+zWave(.60)],
    [.79+.58*q+wave(.75),end+.40,1.00+zWave(.75)],
    [.64+.46*q+wave(.89),end+.11,.89+zWave(.89)],
    [.46+.43*q+wave(1),end+.08*Math.sin(family*1.6),.72+zWave(1)]);
   for(let j=6;j<ps.length;j++){const p=ps[j].isVector3?ps[j]:V(...ps[j]);if(left)tuckEar(p);if(p.y<-1.38)shoulderClearance(p);ps[j]=p;}
   guide(ps,.050+random()*.011,.022+random()*.015,k%5?'#493a33':'#514139',true,phase,'front');
  }
 }
 // A few visible shorter curl layers lie over the primary drape. Their arc
 // begins below the shoulder and turns back into the mass, rather than flaring
 // into isolated wings beside the neck.
 for(const side of[-1,1])for(let k=0;k<(side<0?6:9);k++){
  const q=k/(side<0?5:8),left=side<0,phase=k*2.23+side,end=-3.38-.48*q+.13*Math.sin(k*1.8),x=.69+q*.67,ps=rootPath(side,(left?.56:.51)+q*.12);
  ps.push([side*.96,-.38,left?.045:.24],[side*1.0,-.91,left?.14:.33],
   [side*(x-.03),-1.58,.68+.03*q],[side*(x+.13+.10*Math.sin(phase)),-2.15,.99+.075*Math.cos(phase)],
   [side*(x+.25+.09*Math.sin(phase+.9)),-2.62,1.10+.08*Math.sin(phase)],
   [side*(x+.19),end+.40,1.12+.06*Math.cos(phase)],
   [side*(x-.04),end+.09,.94+.06*Math.sin(phase+.7)],
   [side*(x-.17),end+.13,.79+.07*Math.cos(phase+1.1)]);
  for(let j=6;j<ps.length;j++){const p=ps[j].isVector3?ps[j]:V(...ps[j]);if(left)tuckEar(p);if(p.y<-1.38)shoulderClearance(p);ps[j]=p;}
  guide(ps,.030+random()*.018,.017+random()*.010,'#55443b',true,phase,'curl');
 }
 // Smaller side layers descend close to the head, then divide naturally
 // around the shoulder in depth. They do not expand into isolated outer wings.
 for(const side of[-1,1])for(let k=0;k<12;k++){
  const q=k/11,phase=Math.floor(k/2)*1.76+side,u=.43+q*.10,ps=fallingRoot(side,u),end=-3.30-.29*Math.sin(q*Math.PI)+.13*Math.sin(k*1.8),route=q<.65?1:-1;
  const first=ps[ps.length-1];
  for(let j=0;j<8;j++){
   const t=j/7,y=mix(-.68,end,t),x=side*(1.00+(.17+.09*q)*smooth(.04,.55,t)-.09*smooth(.66,1,t)+.035*Math.sin(t*5+phase)),z=mix(first.z,route*((route>0?.61+.25*q/.65:.57)+.055*Math.sin(t*4.1+phase)),smooth(0,.47,t));
   const p=V(x,y,z);shoulderClearance(p,route);ps.push(p);
  }
  guide(ps,.062+random()*.010,.016+random()*.006,k%4?'#40332e':'#4b3c34',false,phase,'side');
 }
 // Surface strands use an outward lift and individualized trailing trajectories.
 // They are deliberately a minority of the mass: coverage remains robust at 900px.
 let fiberCount=0;
 for(const g of guides){
  const count=g.kind==='front'?43:g.kind==='curl'?54:g.kind==='back'?34:28;
  for(let k=0;k<count;k++){
   const lane=(k+.1+random()*.8)/count*2-1,side=k%7===0?-1:1,phase=random()*TAU,end=.935+random()*.065,ps=[];
   for(let j=0;j<=18;j++){
    const t=j/18,f=frame(g.c,t*end,g.front),shape=lockShape(t*end),spread=lane*g.w*shape,depth=side*(g.d*Math.sqrt(Math.max(.01,1-lane*lane))+.0028)*shape;
    const tip=smooth(.70,1,t),p=f.p.clone().addScaledVector(f.s,spread+.0019*Math.sin(t*29+phase)).addScaledVector(f.n,depth);
    p.x+=.024*Math.sin(phase)*tip;p.y+=(random()-.5)*.018*tip;p.z+=.016*Math.cos(phase)*tip;ps.push(p);
   }
   ribbon(detail,curve(ps),.00063+random()*.00039,pick().lerp(new THREE.Color('#69564b'),k%13===0?.40:0),28,g.front,phase,.85+random()*.10);fiberCount++;
  }
 }
 // Fine crown lines follow the same exact flow field as the continuous sheets.
 for(const side of[-1,1])for(let k=0;k<1150;k++){
  const u=(k+.15+random()*.70)/1150,phase=random()*TAU,end=.985+random()*.015,ps=[];
  for(let j=0;j<=20;j++){const v=j/20*end,p=crown(side,clamp(u+.0007*Math.sin(v*7+phase)),v,.006+random()*.0014);ps.push(p);}
  ribbon(detail,curve(ps),.00048+random()*.00028,pick(),26,false,phase,.96);fiberCount++;
 }
 // Sparse, bowed fringe clumps reveal the forehead between individually swept
 // strands. They remain separate real geometry and do not obscure the eye sockets.
 const bangGuides=[
  {n:195,w:.042,end:[-.65,-.18],points:[[.16,1.40],[-.12,1.15],[-.36,.81],[-.53,.37],[-.65,-.18]]},
  {n:185,w:.043,end:[-.40,.065],points:[[.19,1.36],[.05,1.09],[-.17,.74],[-.31,.39],[-.40,.065]]},
  {n:90,w:.025,end:[-.22,.23],points:[[.22,1.34],[.16,1.11],[.03,.78],[-.12,.46],[-.22,.23]]},
  {n:230,w:.048,end:[.042,.13],points:[[.27,1.30],[.29,1.04],[.23,.76],[.135,.43],[.042,.13]]},
  {n:90,w:.022,end:[.24,.29],points:[[.30,1.29],[.38,1.04],[.38,.79],[.32,.53],[.24,.29]]},
  {n:70,w:.019,end:[.43,.33],points:[[.32,1.31],[.49,1.06],[.52,.78],[.48,.55],[.43,.33]]},
  {n:140,w:.035,end:[.65,.065],points:[[.33,1.36],[.57,1.11],[.69,.78],[.70,.39],[.65,.065]]}
 ];
 for(let group=0;group<bangGuides.length;group++){
  const g=bangGuides[group];
  for(let k=0;k<g.n;k++){
   const lane=(k+.12+random()*.76)/g.n*2-1,offset=lane*g.w,phase=random()*TAU,ps=[];
   for(let j=0;j<g.points.length;j++){
    const t=j/(g.points.length-1),x=g.points[j][0]+offset*(.18+1.10*t)+.022*Math.sin(phase+t*3.1)*Math.sin(t*Math.PI),y=g.points[j][1]+(random()-.5)*.045*t;
    const z=forehead(x,Math.max(.22,y))+.017+(k%4)*.0010+(y<.22?(.22-y)*.045:0);ps.push(V(x,y,z));
   }
   const c=curve(ps),end=.865+random()*.135,trim=[];for(let j=0;j<=20;j++)trim.push(c.getPoint(j/20*end));
   ribbon(fringe,curve(trim),.00045+random()*.00030,pick().multiplyScalar(.91),34,true,phase,.82+random()*.10);fiberCount++;
  }
 }
 // Short growth at the forehead edge softens the transition into bare skin.
 for(const side of[-1,1])for(let k=0;k<95;k++){
  const u=.66+(k+random())/95*.33,v0=.83+random()*.09,ps=[],a=crown(side,u,.985,.006),b=crown(side,u,1,.006),d=b.clone().sub(a).normalize(),extension=.045+random()*.12;
  for(let j=0;j<9;j++)ps.push(crown(side,u,mix(v0,1,j/8),.007));
  for(let j=1;j<=3;j++){
   const p=b.clone().addScaledVector(d,extension*j/3);p.z=forehead(p.x,Math.max(.22,p.y))+.019;ps.push(p);
  }
  ribbon(fringe,curve(ps),.00044+random()*.00022,pick(),24,true,k,.77);fiberCount++;
 }
 // Only a few fine temple strands cross in front of the exposed left ear.
 for(let k=0;k<22;k++){
  const q=k/21,ps=[[.09,1.32,.62],[-.29,1.02,.68],[-.52,.61,.58],[-.66,.15,.48],[-.75,-.34,.34],[-.81,-.72,.20],[-.84,-1.12,.23]];
  for(let j=0;j<ps.length;j++)ps[j][0]+=(q-.5)*.019;
  ribbon(fringe,curve(ps),.00050+random()*.00024,pick(),42,true,k*.2,.91);fiberCount++;
 }
 // Restrained isolated flyaways break the silhouette without a uniformly fuzzy rim.
 for(let k=0;k<86;k++){
  const g=guides[Math.floor(random()*guides.length)],startT=.18+random()*.66,ps=[],phase=random()*TAU;
  for(let j=0;j<=12;j++){const t=j/12,at=mix(startT,Math.min(1,startT+.24+random()*.03),t),f=frame(g.c,at,g.front),p=f.p.clone().addScaledVector(f.s,(k%2?1:-1)*g.w*(.83+.22*Math.sin(t*Math.PI))).addScaledVector(f.n,.011+.018*Math.sin(t*Math.PI));ps.push(p);}
  ribbon(detail,curve(ps),.00045+random()*.00022,pick(),24,g.front,phase,.80);fiberCount++;
 }
 root.add(makeMesh(crownBatch,crownMaterial,'Continuous parted crown with longitudinal fiber flow',headTilt),makeMesh(mass,material,'Overlapping layered S-wave hair around front back and shoulders',headTilt),makeMesh(detail,fineMaterial,'Independent fine crown lengths and silhouette strands',headTilt,false),makeMesh(fringe,fringeMaterial,'Bowed transparent-space fringe and fine left temple strands',headTilt,false));
 root.children[root.children.length-1].renderOrder=3;
 let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.index.count/3;bytes+=o.geometry.index.array.byteLength;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});
 root.userData={procedural:true,continuousCrownSheets:2,closedInsetScalp:true,originalLayeredLocks:guides.length,individualStrands:fiberCount,triangles,geometryMiB:Number((bytes/1048576).toFixed(2)),constructionMs:Number((performance.now()-start).toFixed(1)),source:'Only the supplied image guided this original 3D groom. All geometry and longitudinal hair maps were authored mathematically; no hair photos or external assets.',headTiltCompensation:headTilt,lowerHairYawCompensation:.16};
 return root;
}
