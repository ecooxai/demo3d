import * as THREE from 'three';
import { faceZ } from './face.js';

// Original strand groom. Every visible length is a tapered triangular tube;
// there are no photographed hair textures, alpha cards, or imported meshes.
const TAU=Math.PI*2, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
function rng(seed=821743){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
const faceWarp=[[-1.18,-1.18],[-.96,-1.04],[-.639,-.79],[-.26,-.475],[.25,.050],[.67,.505],[1.12,1.06],[1.54,1.54]];
function warpedY(y){
 let i=0;while(i<faceWarp.length-2&&y>faceWarp[i+1][0])i++;
 const p=faceWarp[i],q=faceWarp[i+1],a=faceWarp[Math.max(0,i-1)],b=faceWarp[Math.min(faceWarp.length-1,i+2)],h=q[0]-p[0],t=(y-p[0])/h;
 const m0=(q[1]-a[1])/(q[0]-a[0]),m1=(b[1]-p[1])/(b[0]-p[0]);
 return(2*t*t*t-3*t*t+1)*p[1]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*q[1]+(t*t*t-t*t)*h*m1;
}
function inverseY(y){let lo=-1.18,hi=1.54;for(let i=0;i<18;i++){let mid=(lo+hi)/2;if(warpedY(mid)<y)lo=mid;else hi=mid;}return(lo+hi)/2;}
function foreheadSampler(){
 const nx=145,ny=113,x0=-.90,y0=.12,dx=1.8/(nx-1),dy=1.40/(ny-1),data=new Float32Array(nx*ny);
 for(let j=0;j<ny;j++){const y=inverseY(y0+j*dy);for(let i=0;i<nx;i++)data[j*nx+i]=faceZ(x0+i*dx,y);}
 return(x,y)=>{
  const u=clamp((x-x0)/dx,0,nx-1.00001),v=clamp((y-y0)/dy,0,ny-1.00001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;
  return(1-b)*((1-a)*data[j*nx+i]+a*data[j*nx+i+1])+b*((1-a)*data[(j+1)*nx+i]+a*data[(j+1)*nx+i+1]);
 };
}
function scalp(theta,phi,lift=0){
 const s=Math.sin(theta),c=Math.cos(theta);
 return[.012+(.864+lift)*s*Math.sin(phi),.335+(1.267+lift*.3)*c,-.083+(.807+lift)*s*Math.cos(phi)];
}
function rootAt(z,side,spread){
 const x=.19+side*(.008+spread*.032),q=(z+.083)/.835;
 return[x,.348+1.272*Math.sqrt(Math.max(.02,1-q*q))-.033,z];
}
function sampleCurve(points,t,out){
 const n=points.length/3,s=clamp(t)*(n-1),i=Math.min(n-2,Math.floor(s)),u=s-i,u2=u*u,u3=u2*u;
 const a=Math.max(0,i-1)*3,b=i*3,c=(i+1)*3,d=Math.min(n-1,i+2)*3;
 for(let k=0;k<3;k++){
  const p0=points[a+k],p1=points[b+k],p2=points[c+k],p3=points[d+k];
  out[k]=(.5*(2*p1+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u2+(-p0+3*p1-3*p2+p3)*u3));
 }
}
function toControls(points){const a=new Float32Array(points.length*3);for(let i=0;i<points.length;i++)a.set(points[i],i*3);return a;}
function compensate(point,headTilt){
 const weight=1-smooth(-1.65,.42,point[1]),yaw=-.16*weight,az=-headTilt*weight;
 const cy=Math.cos(yaw),sy=Math.sin(yaw),cz=Math.cos(az),sz=Math.sin(az);
 const x=point[0]*cy+point[2]*sy,z=-point[0]*sy+point[2]*cy;
 point[0]=x*cz-point[1]*sz;point[1]=x*sz+point[1]*cz;point[2]=z;
}

class FiberBatch {
 constructor(counts,material,name,headTilt){
  this.vertexCount=counts.reduce((s,[n,segments])=>s+n*(segments+1)*3,0);
  this.indexCount=counts.reduce((s,[n,segments])=>s+n*segments*18,0);
  this.position=new Float32Array(this.vertexCount*3);this.normal=new Float32Array(this.vertexCount*3);
  this.color=new Float32Array(this.vertexCount*3);this.uv=new Float32Array(this.vertexCount*2);this.index=new Uint32Array(this.indexCount);
  this.vertex=0;this.element=0;this.material=material;this.name=name;this.headTilt=headTilt;
  this.samples=new Float32Array(64*3);this.tmp=[0,0,0];this.strands=0;
 }
 add(points,segments,options){
  const {radius,color,phase,end=1,frizz=.0028,hug=null,tip=.85}=options,p=this.samples;
  for(let j=0;j<=segments;j++){
   const t=j/segments;sampleCurve(points,t*end,this.tmp);
   const amplitude=Math.sin(t*Math.PI)*frizz;
   this.tmp[0]+=amplitude*(Math.sin(t*37+phase)+.35*Math.sin(t*73+phase*1.7));
   this.tmp[2]+=amplitude*(Math.sin(t*29+phase*1.3)+.25*Math.sin(t*61+phase));
   if(hug){
    const z=hug(this.tmp[0],Math.max(.14,this.tmp[1])),w=smooth(.14,.34,this.tmp[1])*(1-smooth(1.20,1.48,this.tmp[1]))*smooth(.065,.18,z);
    this.tmp[2]+=(z+.012+.002*Math.sin(phase)-this.tmp[2])*w;
   }
   compensate(this.tmp,this.headTilt);p.set(this.tmp,j*3);
  }
  const first=this.vertex;let nx=0,ny=0,nz=1;
  for(let j=0;j<=segments;j++){
   const at=j*3,a=Math.max(0,j-1)*3,b=Math.min(segments,j+1)*3,t=j/segments;
   let tx=p[b]-p[a],ty=p[b+1]-p[a+1],tz=p[b+2]-p[a+2],length=Math.hypot(tx,ty,tz)||1;tx/=length;ty/=length;tz/=length;
   let dot=nx*tx+ny*ty+nz*tz;nx-=tx*dot;ny-=ty*dot;nz-=tz*dot;
   length=Math.hypot(nx,ny,nz);
   if(length<.02){nx=1;ny=0;nz=0;dot=tx;nx-=tx*dot;ny-=ty*dot;nz-=tz*dot;length=Math.hypot(nx,ny,nz)||1;}
   nx/=length;ny/=length;nz/=length;
   const bx=ty*nz-tz*ny,by=tz*nx-tx*nz,bz=tx*ny-ty*nx;
   const r=radius*(.80+.20*smooth(0,.06,t))*(.06+.94*(1-smooth(tip,1,t)));
   const light=.86+.14*smooth(0,.22,t)-.035*smooth(.72,1,t);
   for(let k=0;k<3;k++){
    const angle=phase+k*TAU/3,co=Math.cos(angle),si=Math.sin(angle),vx=nx*co+bx*si,vy=ny*co+by*si,vz=nz*co+bz*si;
    const v=this.vertex++,q=v*3;this.position[q]=p[at]+vx*r;this.position[q+1]=p[at+1]+vy*r;this.position[q+2]=p[at+2]+vz*r;
    this.normal[q]=vx;this.normal[q+1]=vy;this.normal[q+2]=vz;
    this.color[q]=color.r*light;this.color[q+1]=color.g*light;this.color[q+2]=color.b*light;
    this.uv[v*2]=t;this.uv[v*2+1]=k/3;
   }
  }
  for(let j=0;j<segments;j++)for(let k=0;k<3;k++){
   const a=first+j*3+k,b=first+j*3+(k+1)%3,c=a+3,d=b+3;
   this.index[this.element++]=a;this.index[this.element++]=b;this.index[this.element++]=c;
   this.index[this.element++]=b;this.index[this.element++]=d;this.index[this.element++]=c;
  }
  this.strands++;
 }
 finish(){
  if(this.vertex!==this.vertexCount||this.element!==this.indexCount)throw new Error('Fiber groom allocation mismatch');
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(this.position,3));g.setAttribute('normal',new THREE.BufferAttribute(this.normal,3));
  g.setAttribute('color',new THREE.BufferAttribute(this.color,3));g.setAttribute('uv',new THREE.BufferAttribute(this.uv,2));g.setIndex(new THREE.BufferAttribute(this.index,1));
  g.computeBoundingBox();g.computeBoundingSphere();
  const m=new THREE.Mesh(g,this.material);m.name=this.name;m.castShadow=true;m.receiveShadow=true;
  m.userData={originalGeometricFibers:true,strands:this.strands,triangles:this.indexCount/3};return m;
 }
 bytes(){return this.position.byteLength+this.normal.byteLength+this.color.byteLength+this.uv.byteLength+this.index.byteLength;}
}
function shortScalp(headTilt){
 const angular=128,lat=34,p=[],c=[],uv=[],ix=[],color=new THREE.Color('#2c2125');
 for(let j=0;j<=lat;j++)for(let k=0;k<=angular;k++){
  const phi=k/angular*TAU,front=Math.max(0,Math.cos(phi)),ear=Math.exp(-Math.pow((phi-4.78)/.43,4));
  const edge=2.18-1.39*Math.pow(front,2.2)-.61*ear+.018*Math.sin(phi*31)+.006*Math.sin(phi*77);
  const q=scalp(j/lat*edge,phi,-.018);compensate(q,headTilt);p.push(...q);
  const shade=.92+.045*Math.sin(phi*5.2);c.push(color.r*shade,color.g*shade,color.b*shade);uv.push(k/angular,j/lat);
 }
 for(let j=0;j<lat;j++)for(let k=0;k<angular;k++){const a=j*(angular+1)+k,b=a+angular+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingSphere();
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.91,metalness:0,envMapIntensity:.20});
 const mesh=new THREE.Mesh(g,mat);mesh.name='Recessed short scalp occluder under the root fibers';mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

export function createFiberHair({headTilt=-.17,strandBudget=12000}={}){
 const started=typeof performance!=='undefined'?performance.now():Date.now(),root=new THREE.Group();root.name='Original individual-fiber chestnut groom';
 const n=Math.round(clamp(strandBudget,1800,24000)),random=rng(),forehead=foreheadSampler();
 const counts={back:Math.floor(n*.36),left:Math.floor(n*.205),right:Math.floor(n*.225),fringe:Math.floor(n*.145),temple:Math.floor(n*.015),crown:Math.floor(n*.04)};
 counts.flyaway=n-Object.values(counts).reduce((a,b)=>a+b,0);
 const material=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.53,metalness:0,anisotropy:.68,anisotropyRotation:0,specularIntensity:.26,specularColor:'#bba5ad',envMapIntensity:.54,clearcoat:0,side:THREE.FrontSide});
 const fringeMaterial=material.clone();fringeMaterial.roughness=.58;fringeMaterial.specularIntensity=.18;
 const lengths=new FiberBatch([[counts.back,38],[counts.left+counts.right,46],[counts.crown,26]],material,'9460 original cylindrical length and crown fibers',headTilt);
 const details=new FiberBatch([[counts.fringe,32],[counts.temple,36],[counts.flyaway,24]],fringeMaterial,'Independent fine fringe, temple hair, and flyaways',headTilt);
 const palette=['#302327','#39292c','#403034','#49373c','#35262a','#534047','#5d4850'].map(x=>new THREE.Color(x));
 const chooseColor=()=>{const u=random();return palette[u<.10?0:u<.35?1:u<.60?2:u<.81?3:u<.92?4:u<.98?5:6];};
 const radius=()=>.00061+random()*.00038;
 // A continuous rear horseshoe grows from a long part and wraps the full back.
 // Every strand retains its own cross-sectional offset through the lower curls.
 for(let k=0;k<counts.back;k++){
  const q=(k+random())/counts.back,phi=1.17+q*3.62,si=Math.sin(phi),co=Math.cos(phi),layer=random(),phase=random()*TAU;
  const rootZ=.13-.78*random(),r=rootAt(rootZ,si<0?-1:1,random()),offset=(layer-.5)*.16;
  const ps=[r,scalp(.50+.17*random(),phi,.015),scalp(1.04,phi,.042+layer*.035),scalp(1.54,phi,.038+layer*.075)];
  const ys=[-.46,-1.12,-1.82,-2.48,-3.12,-3.74,-4.02];
  for(let j=0;j<ys.length;j++){
   const y=ys[j],t=j/(ys.length-1),wave=Math.sin(t*5.3+phi*.86),rad=.925+.21*Math.sin(t*Math.PI*.94)+offset;
   let x=si*(rad+.055*wave),z=-.13+co*(.78+.075*Math.sin(t*Math.PI))+.045*Math.cos(t*5.1+phi*1.7);
   x+=.055*Math.sin(phi*3.2+t*5.2)*smooth(.10,.85,t);z+=offset*.55;
   if(si<-.70)z-=.15*(1-smooth(-.62,-.16,-y));
   ps.push([x,y+.065*Math.sin(phi*4.6)*smooth(.3,1,t),z]);
  }
  lengths.add(toControls(ps),38,{radius:radius(),color:chooseColor(),phase,end:.84+.16*Math.pow(random(),.38),frizz:.0016+random()*.0021,tip:.86+random()*.06});
 }
 function front(side,count){
  const left=side<0;
  for(let k=0;k<count;k++){
   const a=random()*TAU,rr=Math.sqrt(random()),ox=Math.cos(a)*rr*(left?.245:.280),oz=Math.sin(a)*rr*.135,phase=random()*TAU;
   const rootZ=.22-.61*random(),r=rootAt(rootZ,side,random()),sweep=Math.sin(a)*.035;
   let ps;
   if(left)ps=[r,[-.18+sweep,1.587,rootZ*.56+.155],[-.55+ox*.13,1.24,.42+oz*.35],[-.77+ox*.24,.74,.35+oz*.7],[-.855+ox*.27,.17,-.13+oz*.75],[-.86+ox*.35,-.45,-.18+oz],[-.90+ox*.62,-1.05,.14+oz],[-.95+ox,-1.66,.59+oz],[-1.14+ox,-2.29,.73+oz],[-1.25+ox,-2.95,.79+oz],[-1.10+ox*.98,-3.52,.72+oz],[-.88+ox*.92,-4.01,.58+oz],[-.75+ox*.88,-4.15,.51+oz]];
   else ps=[r,[.52+sweep,1.43,rootZ*.47+.27],[.765+ox*.15,.98,.40+oz*.4],[.865+ox*.26,.43,.31+oz*.7],[.89+ox*.36,-.22,.25+oz],[.905+ox*.58,-.89,.39+oz],[.98+ox*.88,-1.54,.64+oz],[1.13+ox,-2.15,.79+oz],[1.28+ox,-2.73,.85+oz],[1.22+ox,-3.28,.80+oz],[1.06+ox*.97,-3.76,.68+oz],[.87+ox*.91,-4.02,.57+oz]];
   // Neighboring strands share the broad wave but have gently drifting lanes.
   for(let j=4;j<ps.length;j++){
    const t=(j-4)/(ps.length-5),lane=.040*Math.sin(a*1.3+t*5.2)+.015*Math.sin(a*3.1+t*8.4);
    ps[j][0]+=lane*smooth(0,.4,t);ps[j][2]+=.021*Math.cos(a+t*7.2)*smooth(0,.4,t);
   }
   lengths.add(toControls(ps),46,{radius:radius(),color:chooseColor(),phase,end:.83+.17*Math.pow(random(),.38),frizz:.0016+random()*.0026,tip:.86+random()*.08});
  }
 }
 front(-1,counts.left);front(1,counts.right);
 // Shorter surface hairs flow with the part and overlap the long roots. They
 // end among existing lengths, so there is no rigid scalp edge or crown grid.
 for(let k=0;k<counts.crown;k++){
  const q=(k+random())/counts.crown,phi=.66+q*4.99,side=Math.sin(phi)<0?-1:1,phase=random()*TAU;
  const r=rootAt(.24-random()*.73,side,random()),ps=[r];
  for(let j=1;j<=8;j++)ps.push(scalp(.14+j/8*(1.85+random()*.05),phi+.035*Math.sin(j*.38),.014+.006*Math.sin(j*.5)));
  lengths.add(toControls(ps),26,{radius:.00061+random()*.00024,color:chooseColor(),phase,frizz:.0015,tip:.83,end:.90+random()*.10});
 }
 // Seven deliberately unequal locks: dense enough at their roots, separately
 // feathered at the brow. Skin remains visible between fine contiguous sweeps.
 const guides=[
  {x:-.65,y:-.24,w:.040,share:.24,lean:-.095},
  {x:-.43,y:.055,w:.044,share:.17,lean:-.028},
  {x:-.22,y:.145,w:.028,share:.085,lean:.020},
  {x:.040,y:.080,w:.036,share:.23,lean:.060},
  {x:.240,y:.225,w:.025,share:.105,lean:.078},
  {x:.420,y:.31,w:.020,share:.07,lean:.070},
  {x:.640,y:.070,w:.029,share:.10,lean:.045}
 ];
 let used=0;
 for(let group=0;group<guides.length;group++){
  const g=guides[group],count=group===guides.length-1?counts.fringe-used:Math.floor(counts.fringe*g.share);used+=count;
  for(let k=0;k<count;k++){
   const lane=((k+random())/count*2-1),offset=lane*g.w,phase=random()*TAU,zroot=.09+random()*.24,rootX=.176+(group-2.5)*.012+(random()-.5)*.018;
   const ps=[[rootX,1.569-(zroot-.1)*.15,zroot],[rootX-.048+g.lean*.35,1.385,.45],[.10+g.x*.30+g.lean,1.05,.64],[g.x*.66+g.lean,.64,.71],[g.x+offset*.7,g.y+.22,.69],[g.x+offset,g.y,.665]];
   for(let j=1;j<ps.length;j++){
    const t=j/(ps.length-1),p=ps[j];p[0]+=offset*smooth(0,.9,t)+.008*Math.sin(phase+t*5)*Math.sin(t*Math.PI);
    const z=forehead(p[0],Math.max(.19,p[1]));
    if(p[1]<1.3&&z>.12)p[2]=z+.016+(k%5)*.0009+(p[1]<.19?(.19-p[1])*.07:0);
   }
   const end=.79+.21*Math.pow(random(),.42);
   details.add(toControls(ps),32,{radius:.00058+random()*.00027,color:chooseColor(),phase,end,frizz:.0010+random()*.0011,hug:forehead,tip:.80+random()*.13});
  }
 }
 // The long left face-framing wisp descends in front of the ear, while the
 // dense lengths bend behind it. The right temple carries a softer fine veil.
 for(let k=0;k<counts.temple;k++){
  const left=k<counts.temple*.73,side=left?-1:1,q=random(),phase=random()*TAU,ox=(q-.5)*.038;
  const ps=left?[[.12,1.55,.25],[-.25,1.24,.52],[-.52,.73,.58],[-.65+ox,.22,.53],[-.72+ox,-.28,.40],[-.71+ox,-.88,.36],[-.67+ox,-1.42,.45],[-.80+ox,-1.81,.47]]:[[.24,1.53,.20],[.60,1.15,.43],[.78,.56,.40],[.81+ox,.03,.34],[.78+ox,-.55,.32],[.86+ox,-1.11,.43],[.92+ox,-1.57,.51]];
  details.add(toControls(ps),36,{radius:.00057+random()*.00024,color:chooseColor(),phase,end:.65+random()*.35,frizz:.0016,tip:.86});
 }
 for(let k=0;k<counts.flyaway;k++){
  const side=random()<.47?-1:1,level=random(),phase=random()*TAU;
  let ps;
  if(level<.37){const phi=side*(.7+random()*.75),t=.25+random()*.6;ps=[];for(let j=0;j<7;j++){let p=scalp(t+j*.13,phi,.025+.040*Math.sin(j/6*Math.PI));p[0]+=side*.012*Math.sin(j*.6);ps.push(p);}}
  else {const y=.45-random()*3.2,x=side*(.92+.28*smooth(.7,3,-y)),z=.10+random()*.67;ps=[[x,y,z],[x+side*.045,y-.21,z+.014],[x+side*.083,y-.48,z+.025],[x+side*.065,y-.77,z+.01],[x+side*.005,y-.93,z-.015]];}
  details.add(toControls(ps),24,{radius:.00050+random()*.00020,color:palette[3],phase,end:.86+random()*.14,frizz:.0020,tip:.75});
 }
 const scalpMesh=shortScalp(headTilt),lengthMesh=lengths.finish(),detailMesh=details.finish();
 lengthMesh.name=`${lengths.strands} individually tapered chestnut length and crown fibers`;
 detailMesh.castShadow=false;root.add(scalpMesh,lengthMesh,detailMesh);
 const triangles=lengthMesh.geometry.index.count/3+detailMesh.geometry.index.count/3+scalpMesh.geometry.index.count/3;
 let geometryBytes=lengths.bytes()+details.bytes();for(const a of Object.values(scalpMesh.geometry.attributes))geometryBytes+=a.array.byteLength;geometryBytes+=scalpMesh.geometry.index.array.byteLength;
 root.userData={procedural:true,individualFibers:n,triangles,geometryMiB:Number((geometryBytes/1048576).toFixed(2)),constructionMs:Number(((typeof performance!=='undefined'?performance.now():Date.now())-started).toFixed(1)),source:'Only the supplied portrait guided this original geometric fiber groom. No hair images, texture cards, or external meshes.',headTiltCompensation:headTilt,lowerHairYawCompensation:.16,coordinateSystem:'+Z front; local crown about 1.62, independently feathered lengths about -4.05'};
 return root;
}
