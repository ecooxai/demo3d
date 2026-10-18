import * as THREE from 'three';
import { faceZ } from './face.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
function rng(seed=14771){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
const curve=p=>new THREE.CatmullRomCurve3(p.map(a=>a.isVector3?a:V(...a)),false,'catmullrom',.4);
const batch=()=>({p:[],c:[],u:[],i:[]});
const smooth=(a,b,t)=>{t=THREE.MathUtils.clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);};
// faceZ describes the canonical sculpt; the rendered head uses this monotone
// landmark warp. Its inverse lets hair sit on the actual rendered forehead.
const faceWarp=[[-1.18,-1.18],[-.96,-1.04],[-.639,-.79],[-.26,-.475],[.25,.050],[.67,.505],[1.12,1.06],[1.54,1.54]];
function warpedY(y){
 if(y<=-1.18||y>=1.54)return y;
 let i=0;while(i<faceWarp.length-2&&y>faceWarp[i+1][0])i++;
 const p=faceWarp[i],q=faceWarp[i+1],prev=faceWarp[Math.max(0,i-1)],next=faceWarp[Math.min(faceWarp.length-1,i+2)],h=q[0]-p[0],t=(y-p[0])/h;
 const m0=(q[1]-prev[1])/(q[0]-prev[0]),m1=(next[1]-p[1])/(next[0]-p[0]);
 return(2*t*t*t-3*t*t+1)*p[1]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*q[1]+(t*t*t-t*t)*h*m1;
}
function canonicalY(y){
 if(y<=-1.18||y>=1.54)return y;
 let lo=-1.18,hi=1.54;
 for(let j=0;j<18;j++){let mid=(lo+hi)/2;if(warpedY(mid)<y)lo=mid;else hi=mid;}
 return(lo+hi)/2;
}
function hugForehead(p,gap=.013){
 // Never snap temple/cheek strands to the facial surface. Both eligibility
 // boundaries are smooth, including the side silhouette where faceZ reaches 0.
 let weight=smooth(.14,.36,p.y)*(1-smooth(1.23,1.53,p.y));
 if(weight>0){
  let z=faceZ(p.x,canonicalY(p.y));
  if(Number.isFinite(z))p.z=THREE.MathUtils.lerp(p.z,z+gap,weight*smooth(.065,.19,z));
 }
 return p;
}
function vert(b,p,c,uv,alpha=1){if(p.y>1.66)p.y=1.66+.015*Math.tanh((p.y-1.66)/.015);let k=b.p.length/3;b.p.push(p.x,p.y,p.z);b.c.push(c.r,c.g,c.b);if(b.rgba)b.c.push(alpha);b.u.push(uv?uv[0]:p.x*.5,uv?uv[1]:p.y*.2);return k;}
function quad(b,a,c,d,e){b.i.push(a,c,e,c,d,e);}
function mesh(b,m,name){let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,b.rgba?4:3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setIndex(b.i);g.computeVertexNormals();g.computeBoundingSphere();let o=new THREE.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;return o;}
function frame(c,t,front){
 let p=c.getPoint(t),d=c.getTangent(t).normalize();
 let radial=V(p.x,.035,p.z+.08).normalize(),n=radial;
 if(front){let crown=smooth(-1.50,.25,p.y);n=V(p.x*.12,.035,1).normalize().lerp(radial,crown).normalize();}
 if(n.lengthSq()<.01)n=V(0,.2,1);n.normalize();
 let axis=d.clone().cross(n);if(axis.lengthSq()<.001)axis=V(1,0,0);else axis.normalize();
 return{p,s:axis,n:axis.clone().cross(d).normalize()};
}
function ribbon(b,c,w,color,front=false,phase=0,steps=46,across=6,thin=false,hug=false){
 let first=b.p.length/3,base=new THREE.Color(color);
 for(let j=0;j<=steps;j++){
  let t=j/steps,f=frame(c,t,front);
  // Both the root and tip converge into neighboring locks instead of cut cards.
  let taper=smooth(0,thin?.025:.09,t)*(.0001+.9999*(1-smooth(thin?.86:.60,thin?1:.90,t)));
  for(let k=0;k<=across;k++){
   let u=k/across*2-1,bulge=thin?0:(1-u*u)*.004*(.6+.4*Math.sin(t*Math.PI));
   let p=f.p.clone().addScaledVector(f.s,u*w*taper).addScaledVector(f.n,bulge+(thin?.013:.0009*Math.sin(k/across*39+phase)));
   if(hug)hugForehead(p,.011+.002*Math.sin(phase+t*3));
   let light=.90+.065*Math.sin(k/across*17+phase)+.025*Math.cos(t*13+phase);
   vert(b,p,base.clone().multiplyScalar(light),[k/across,t]);
  }
 }
 for(let j=0;j<steps;j++)for(let k=0;k<across;k++){let a=first+j*(across+1)+k;quad(b,a,a+across+1,a+across+2,a+1);}
}
function fiberMaps(denseCoverage=false){
 const width=512,height=1024,pixels=new Uint8Array(width*height*4),normals=new Uint8Array(width*height*4),rand=rng(328171);
 for(let i=0;i<width*height;i++){let k=i*4;pixels[k]=205;pixels[k+1]=203;pixels[k+2]=207;pixels[k+3]=0;normals[k]=normals[k+1]=128;normals[k+2]=normals[k+3]=255;}
 // Dense continuous fibers overlap through the body of a lock, with only its
 // final few percent feathered. Smooth alpha blending preserves subpixel silk.
 const fiberCount=64;
 for(let fiber=0;fiber<fiberCount;fiber++){
  let center=(fiber+.18+rand()*.64)/fiberCount,widthPx=3.1+rand()*1.5,end=.929+rand()*.070,start=rand()*.011,phase=rand()*TAU;
  let shade=.81+rand()*.17,bend=.0010+rand()*.0019;
  for(let y=Math.floor(start*height);y<Math.floor(end*height);y++){
   let v=y/height,tip=1-smooth(end-.029,end,v),radius=widthPx*(.12+.88*tip),xcenter=width*(center+bend*Math.sin(v*8+phase)+.0007*Math.sin(v*23+phase*1.7));
   let fade=smooth(start,start+.009,v)*tip;
   for(let x=Math.max(0,Math.floor(xcenter-radius-1));x<=Math.min(width-1,Math.ceil(xcenter+radius+1));x++){
    let dist=(x+.5-xcenter)/Math.max(.35,radius),alpha=(1-smooth(.63,1,Math.abs(dist)))*.997*fade,k=(y*width+x)*4;
    if(alpha*255<=pixels[k+3])continue;
    let variation=shade*(.92+.08*Math.sin(v*17+phase));
    pixels[k]=Math.round(255*variation);pixels[k+1]=Math.round(250*variation);pixels[k+2]=Math.round(246*variation);pixels[k+3]=Math.round(255*alpha);
    let nx=.19*dist,ny=.01*Math.sin(v*9+phase),inv=1/Math.hypot(nx,ny,1);
    normals[k]=Math.round(127.5*(nx*inv+1));normals[k+1]=Math.round(127.5*(ny*inv+1));normals[k+2]=Math.round(127.5*(inv+1));
   }
  }
 }
 if(denseCoverage)for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/(width-1),v=y/(height-1),k=(y*width+x)*4;
  const body=smooth(0,.022,v)*(1-smooth(.77,.993,v))*smooth(0,.035,u)*(1-smooth(.965,1,u));
  pixels[k+3]=Math.max(pixels[k+3],Math.round(body*255));
 }
 const make=data=>{let t=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;};
 let map=make(pixels),normalMap=make(normals);map.colorSpace=THREE.SRGBColorSpace;map.name='64 original continuous mathematical hair fibers';normalMap.name='Original tangential fiber normals';return{map,normalMap};
}
// Thin, gently cambered layers follow each guide. Closely related outward
// normals avoid the broad metallic reflections of perpendicular crossed cards.
function volumeLock(b,c,width,color,front,phase,steps=38,depth=.025,layers=3){
 for(let layer=0;layer<layers;layer++){
  let angle=[-.24,.10,.32,-.07][layer]+.075*Math.sin(phase+layer),co=Math.cos(angle),si=Math.sin(angle),first=b.p.length/3,base=new THREE.Color(color),across=3;
  for(let j=0;j<=steps;j++){
   let t=j/steps,f=frame(c,t,front),shape=smooth(0,.030,t)*(1-.79*smooth(.69,1,t));
   let sideways=f.s.clone().multiplyScalar(co).addScaledVector(f.n,si),normal=f.n.clone().multiplyScalar(co).addScaledVector(f.s,-si);
   let center=f.p.clone().addScaledVector(f.s,(layer-(layers-1)/2)*width*.27*shape+.005*Math.sin(t*17+phase+layer)).addScaledVector(f.n,(layer%2?1:-1)*depth*.48*shape);
   for(let k=0;k<=across;k++){
    let u=k/across*2-1,p=center.clone().addScaledVector(sideways,u*width*.76*shape).addScaledVector(normal,(1-u*u)*width*.14*shape);
    vert(b,p,base.clone().multiplyScalar(.97+.018*Math.sin(phase+layer*.9)),[k/across,t]);
   }
  }
  for(let j=0;j<steps;j++)for(let k=0;k<across;k++){let a=first+j*(across+1)+k;quad(b,a,a+across+1,a+across+2,a+1);}
 }
}
function scalp(theta,phi,offset=0){
 let p=V(.015+(.916+offset)*Math.sin(theta)*Math.sin(phi),.36+1.31*Math.cos(theta),-.065+(.84+offset)*Math.sin(theta)*Math.cos(phi));
 let front=smooth(.42,.95,Math.cos(phi)),edge=smooth(.67,.99,theta)*(1-smooth(1.15,1.39,theta));
 if(front*edge>0){let contact=hugForehead(p.clone(),.018+offset);p.lerp(contact,front*edge);}
 return p;
}
function foundation(b,denseCoverage=false){
 let col=new THREE.Color('#352523'),az=128,lat=40,start=b.p.length/3;
 for(let j=0;j<=lat;j++)for(let k=0;k<=az;k++){
  let phi=k/az*TAU,front=Math.pow(Math.max(0,Math.cos(phi)),2.2),limit=2.32-1.195*front-.72*Math.exp(-Math.pow((phi-4.91)/.42,4))+front*(.010*Math.sin(phi*53)+.004*Math.sin(phi*137));
  let feather=1-Math.pow(Math.max(0,Math.cos(phi)),.65)*smooth(.79,1,j/lat);
  vert(b,scalp(j/lat*limit,phi),col.clone().multiplyScalar(.97+.014*Math.sin(phi*41)),[k/az,j/lat],feather);
 }
 for(let j=0;j<lat;j++)for(let k=0;k<az;k++){let a=start+j*(az+1)+k;quad(b,a,a+az+1,a+az+2,a+1);}
 const angular=68,down=30;start=b.p.length/3;
 for(let j=0;j<=down;j++)for(let k=0;k<=angular;k++){
  let t=j/down,phi=1.16+k/angular*(TAU-2.43),lower=smooth(.54,1,t),radius=.66+.15*Math.sin(t*Math.PI*.83)-.075*lower;
  // Only the nape needs an opaque core. Keeping it above the shoulder avoids
  // a dark cone or a blunt hem competing with the independently falling locks.
  let y=.82-(denseCoverage?1.28:2.13)*t+(.10*Math.sin(phi*3.1)+.025*Math.sin(phi*9.3))*lower;
  let z=-.075+Math.cos(phi)*(.64+.075*Math.sin(t*Math.PI)-.05*lower);
  vert(b,V(Math.sin(phi)*radius,y,z),col.clone().multiplyScalar(.87+.07*Math.sin(phi*21)),[k/angular,t]);
 }
 for(let j=0;j<down;j++)for(let k=0;k<angular;k++){let a=start+j*(angular+1)+k;quad(b,a,a+angular+1,a+angular+2,a+1);}
}
export function createHair({headTilt=-.17,coverage=false}={}){
 let root=new THREE.Group();root.name='Original chestnut hair with flowing geometric fringe';
 let random=rng(),shell=batch(),locks=batch(),strands=batch(),bangs=batch(),fringe=batch(),paths=[];shell.rgba=true;
 let maps=fiberMaps(coverage);
 let mat=new THREE.MeshPhysicalMaterial({vertexColors:true,map:maps.map,normalMap:maps.normalMap,normalScale:new THREE.Vector2(.055,.016),alphaTest:coverage?.10:.008,alphaToCoverage:coverage,transparent:!coverage,depthWrite:coverage,forceSinglePass:true,roughness:.71,metalness:0,side:THREE.DoubleSide,anisotropy:.08,anisotropyRotation:Math.PI*.5,clearcoat:0,specularIntensity:.075,specularColor:'#b49a8d',envMapIntensity:.28});
 let fineMat=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.64,specularIntensity:.10,specularColor:'#c2aba0',envMapIntensity:.25,transparent:true,opacity:.71,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});
 let fringeMat=fineMat.clone();fringeMat.opacity=.82;fringeMat.roughness=.68;fringeMat.specularIntensity=.07;
 let shellMat=mat.clone();shellMat.map=null;shellMat.normalMap=null;shellMat.alphaTest=0;shellMat.alphaToCoverage=false;shellMat.transparent=true;shellMat.depthWrite=false;shellMat.anisotropy=0;shellMat.roughness=1;shellMat.specularIntensity=0;shellMat.envMapIntensity=0;
 foundation(shell,coverage);
 // Independent rounded rear wave groups replace the entire skirt-like foundation.
 for(let k=0;k<64;k++){
  let phi=.84+k/63*(TAU-2.03)+(random()-.5)*.022,side=Math.sin(phi),back=Math.cos(phi),phase=phi*1.65+.20*Math.sin(k*1.3),amp=.05+.060*random();
  const pt=(y,r,zr,w)=>V(side*r+amp*Math.sin(w+phase),y,-.075+back*zr+.075*Math.cos(w+phase)*smooth(.4,2.8,-y));
  let end=-3.61+.14*Math.sin(k*.61)+.09*Math.sin(k*2.07)+.17*Math.sin(phi*2.2);
  let ps=[scalp(.07+(k%3)*.02,phi,.003),scalp(.47,phi,.012),scalp(.98,phi,.027),scalp(1.55,phi,.032),pt(-.52,.98,.87,0),pt(-1.36,1.10,.92,.8),pt(-2.13,1.22,.89,2),pt(-2.81,1.16,.84,3.2),pt(end+.21,.99,.75,4.3),pt(end,.91,.71,4.8)];
  let c=curve(ps),w=.071+random()*.017;
  volumeLock(locks,c,w*(coverage?1.04:1),k%4?'#543D38':'#624B45',false,phase,40,.023+random()*.010);
  paths.push({c,w,front:false,phase:k});
 }
 // Front lengths overlap as several fuller, differently phased waves over the chest.
 for(let side of[-1,1])for(let k=0;k<29;k++){
  let q=k/28,phase=k*.43+(side<0?.4:1.1),left=side<0,phi=side*((left?.88:.62)+q*(left?.89:.98));
  let end=-3.64-.28*Math.sin(q*Math.PI)+.18*Math.sin(k*1.91+side),inner=.46+q*.83;
  let ps=[scalp(.09+q*.025,phi,.006),scalp(.48,phi,.019),scalp(1.03,phi,.025),scalp(1.55,phi,.023),
   [side*(.83+q*.18),-.43,left?-.12+q*.03:.46-q*.27],
   [side*(.84+q*.21),-.99,left?.01+q*.07:.59-q*.14],
   [side*(.68+q*.59),-1.62,.68+q*.12],
   [side*(inner+.12*Math.sin(phase+.8)),-2.13,.88+.065*Math.cos(phase)],
   [side*(inner+.20*Math.sin(phase+2.1)),-2.70,.98+.075*Math.sin(phase+.8)],
   [side*(.44+q*.79+.15*Math.sin(phase+3.1)),end+.42,.88+.075*Math.cos(phase+1.4)],
   [side*(.40+q*.70+.13*Math.sin(phase+4)),end+.12,.79+.06*Math.cos(phase+2)],
   [side*(.42+q*.69+.10*Math.sin(phase+4.5)),end,.74+.06*Math.cos(phase+2.4)]];
  if(left)for(let point of ps){let p=point.isVector3?point:V(...point),spread=smooth(1.05,2.65,-p.y)*(.035+.30*q);p.x-=spread;if(!point.isVector3)point[0]=p.x;}
  let c=curve(ps),w=.046+.021*random();
  volumeLock(locks,c,w*(coverage?1.12:1),k%4?'#563F3A':'#654C46',true,phase,44,.026+.010*random());
  paths.push({c,w,front:true,phase:k+side});
 }
 let colors=['#4E3934','#5A413A','#46332E','#624941','#3D2C29','#6C5148'];
 function addFine(c,w,front,count,phase){
  for(let k=0;k<count;k++){
   let shift=((k+.15+random()*.70)/count*2-1)*w*.94;
   let endT=.92+random()*.075,tailX=(random()-.5)*.090,tailY=(random()-.5)*.13,tailZ=(random()-.5)*.045,ps=[];
   for(let j=0;j<=14;j++){
    let t=j/14,f=frame(c,t*endT,front);
    // Fibers keep their own spacing through the tips instead of all meeting at one blade.
    let spread=shift*smooth(0,.075,t)*(.80+.20*Math.cos(t*2));
    let tail=smooth(.64,1,t),noise=.003*Math.sin(t*27+k)+.0015*Math.sin(t*53+phase);
    ps.push(f.p.clone().addScaledVector(f.s,spread+noise).addScaledVector(f.n,.006).add(V(tailX*tail,tailY*tail,tailZ*tail)));
   }
   ribbon(strands,curve(ps),.0011+random()*.0010,colors[(k+phase+60)%colors.length],front,k+phase,27,1,true);
  }
 }
 for(let {c,w,front,phase}of paths)addFine(c,w,front,18,phase);
 // Seven separate, real geometric strand groups leave bare forehead between
 // their ends. There is no broad alpha card across the brow.
 const fringeGuides=[
  {x:-.63,y:-.21,w:.043,n:430,lean:-.16},
  {x:-.42,y:.08,w:.036,n:330,lean:-.060},
  {x:-.19,y:.19,w:.021,n:140,lean:.025},
  {x:.040,y:.13,w:.033,n:320,lean:.087},
  {x:.24,y:.26,w:.022,n:180,lean:.060},
  {x:.41,y:.35,w:.018,n:120,lean:.042},
  {x:.64,y:.05,w:.034,n:220,lean:.095}
 ];
 function geometricFringe(guide,group){
  const {x:ex,y:ey,w,n,lean}=guide;
  let guidePoints=[[.16+(group-3)*.024,1.619-group*.006,.153],
   [.13+lean*.35+(group-3)*.012,1.459,.365],
   [.105+ex*.27+lean,1.150,.625],
   [ex*.71+lean*.60,.725,.767-Math.abs(ex)*.04],
   [ex+.030*Math.sin(group*1.1),ey+.23,.796-Math.abs(ex)*.09],
   [ex,ey,.782-Math.abs(ex)*.13]];
  for(let point of guidePoints){
   let p=V(...point);
   if(p.y<.28)p.z=faceZ(p.x,canonicalY(.28))+.028+(.28-p.y)*.025;
   else hugForehead(p,.018);
   point[2]=p.z;
  }
  let guideCurve=curve(guidePoints);
  for(let k=0;k<n;k++){
   let side=(k+.12+random()*.76)/n*2-1,offset=side*w;
   let endT=.835+random()*.164,tail=(random()-.5)*.073,tipY=(random()-.5)*.11,phase=random()*TAU,ps=[];
   for(let j=0;j<=22;j++){
    let t=j/22,f=frame(guideCurve,t*endT,true);
    let spread=offset*smooth(0,.24,t)*(.55+.95*smooth(.30,1,t));
    let drift=.012*Math.sin(t*4.6+phase)*Math.sin(t*Math.PI);
    let p=f.p.clone().addScaledVector(f.s,spread+drift+tail*smooth(.49,1,t));
    p.y+=tipY*smooth(.62,1,t);hugForehead(p,.011+(k%4)*.0012);ps.push(p);
   }
   // These widths remain subpixel at portrait scale; opaque strand centers
   // naturally accumulate into a lock without a painted triangular blanket.
   let color=['#322221','#3B2A28','#4A3431','#523B36','#392725','#46312D'][(k+group*3)%6];
   ribbon(fringe,curve(ps),.00051+random()*.00037,color,true,k*.29+group,38,1,true,true);
  }
 }
 fringeGuides.forEach(geometricFringe);
 // A few independent temple wisps keep the exposed left ear and cheek clear.
 for(let k=0;k<28;k++){
  let q=k/27,points=[[.13,1.59,.22],[-.19,1.33,.55],[-.43,.90,.71],[-.61-q*.022,.32,.49],[-.68-q*.025,-.15,.40],[-.72-q*.018,-.68+.08*Math.sin(k),.31]];
  for(let j=1;j<4;j++){let p=hugForehead(V(...points[j]),.018);points[j][2]=p.z;}
  let c=curve(points);
  ribbon(fringe,c,.00053+random()*.00030,colors[k%colors.length],true,k,42,1,true,false);
 }
 // Fine continuous crown fibers cover the forehead foundation and reveal the part.
 for(let k=0;k<30;k++){
  let phi=-1.18+k/29*2.22,lim=2.27-1.25*Math.pow(Math.max(0,Math.cos(phi)),2.3);
  let ps=[];for(let j=0;j<=8;j++){let theta=.075+j/8*(lim-.075);ps.push(scalp(theta,phi,.008));}
  let c=curve(ps);ribbon(bangs,c,.038,'#46312D',true,k*.9,28,3);addFine(c,.035,true,5,k);
 }
 // Hundreds of individual crown fibers hide the scalp boundary in a soft,
 // uneven root transition, and supply fine texture without broad specular bands.
 for(let k=0;k<1800;k++){
  let phi=-Math.PI+(k+.15+random()*.65)/1800*TAU,front=Math.max(0,Math.cos(phi));
  let limit=2.32-1.195*Math.pow(front,2.2)-.72*Math.exp(-Math.pow(((phi+TAU)%TAU-4.91)/.42,4));
  let end=limit-.065+random()*.135,ps=[];
  for(let j=0;j<=16;j++){
   let t=j/16,theta=.09+t*(end-.09),angle=phi+.075*Math.sin(t*Math.PI)*Math.sin(phi+1.4);
   let p=scalp(theta,angle,.006+(k%5)*.0013);
   p.x+=.15*(1-smooth(.07,.65,theta));
   ps.push(p);
  }
  ribbon(strands,curve(ps),.00055+random()*.00035,colors[k%colors.length],false,k*.3,32,1,true);
 }
 for(let k=0;k<28;k++){let side=k%2?-1:1,t=(k%14)/13,y=1.15-t*4,x=side*(.94+.18*Math.sin(t*Math.PI)),z=.14+.6*random();let c=curve([[x,y,z],[x+side*.028,y-.2,z+.018],[x+side*.055,y-.49,z+.012],[x+side*.01,y-.78,z-.02]]);ribbon(strands,c,.0008,'#523d40',true,k,16,1,true);}
 root.add(mesh(shell,shellMat,'Hair feathered scalp and short nape core'),mesh(locks,mat,'Hair 366 fine layered continuous strand cards'),mesh(bangs,mat,'Hair fine parted crown layers'),mesh(strands,fineMat,'Hair fine geometric lengths and 1800 crown fibers'),mesh(fringe,fringeMat,'Hair seven full flowing fringe groups with 1740 strands'));
 root.children.forEach((o,i)=>o.renderOrder=i===0?0:i===4?3:2);
 root.children[3].castShadow=false;root.children[4].castShadow=false;
 // The head tilts, while gravity keeps the lengths below the neck upright.
 // These positions remain in head-local space; the parent applies headTilt afterward.
 let triangles=0;
 root.traverse(o=>{
  if(!o.isMesh)return;
  let positions=o.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   let x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),weight=1-smooth(-1.7,.4,y);
   x*=1-.055*weight;
   let angle=-headTilt*weight,co=Math.cos(angle),si=Math.sin(angle);
   positions.setXYZ(i,x*co-y*si,x*si+y*co,z);
  }
  positions.needsUpdate=true;o.geometry.computeVertexNormals();o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
  triangles+=o.geometry.index.count/3;
 });
 root.userData={procedural:true,triangles,source:'Supplied portrait only; original crossed geometry, 64-fiber smooth alpha textures, and seven actual geometric fringe groups',coordinateSystem:'+Z front; local crown about 1.67; gravity-compensated lower lengths',headTiltCompensation:headTilt};
 return root;
}
