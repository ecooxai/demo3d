import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PI=Math.PI, clamp=THREE.MathUtils.clamp;
const gauss=(x,m,s)=>Math.exp(-(((x-m)/s)**2));
const smooth=t=>t*t*(3-2*t);
const profiles=[
 [-1.18,.015,.20,.13],[-1.12,.20,.40,.25],[-1.01,.36,.51,.35],
 [-.83,.50,.56,.45],[-.61,.61,.58,.54],[-.36,.71,.59,.62],
 [-.10,.77,.58,.68],[.18,.79,.565,.71],[.45,.80,.58,.73],
 [.71,.775,.595,.72],[.96,.72,.56,.67],[1.18,.62,.46,.58],
 [1.37,.43,.29,.43],[1.50,.16,.10,.17],[1.54,.012,.01,.012]
];
function profile(y){
 let i=0;while(i<profiles.length-2&&y>profiles[i+1][0])i++;
 const p=profiles[i],q=profiles[i+1],t=clamp((y-p[0])/(q[0]-p[0]),0,1);
 const before=profiles[Math.max(0,i-1)],after=profiles[Math.min(profiles.length-1,i+2)];
 return [1,2,3].map(k=>{
  const h=q[0]-p[0], m0=(q[k]-before[k])/(q[0]-before[0]),m1=(after[k]-p[k])/(after[0]-p[0]);
  return (2*t*t*t-3*t*t+1)*p[k]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*q[k]+(t*t*t-t*t)*h*m1;
 });
}
function sculpt(x,y){
 let d=.058*gauss(Math.abs(x),.46,.24)*gauss(y,-.15,.28);
 d+=.052*gauss(Math.abs(x),.34,.22)*gauss(y,.52,.15);
 d-=.016*gauss(Math.abs(x),.35,.24)*gauss(y,.25,.15);
 d+=.143*gauss(x,0,.112)*gauss(y,.20,.36);
 d+=.143*gauss(x,0,.11)*gauss(y,-.095,.21);
 d+=.252*gauss(x,0,.125)*gauss(y,-.235,.115);
 d+=.096*gauss(Math.abs(x),.135,.068)*gauss(y,-.285,.073);
 d+=.044*gauss(x,0,.042)*gauss(y,-.352,.059);
 d-=.022*gauss(Math.abs(x),.108,.035)*gauss(y,-.32,.023);
 d+=.047*gauss(x,0,.31)*gauss(y,-.58,.17);
 d-=.012*gauss(x,0,.033)*gauss(y,-.46,.068);
 d+=.016*gauss(Math.abs(x),.053,.024)*gauss(y,-.46,.07);
 d+=.037*gauss(x,0,.24)*gauss(y,-.92,.13);
 d-=.014*gauss(x,0,.20)*gauss(y,-.79,.05);
 return d;
}
export function faceZ(x,y){
 const [w,front]=profile(y);
 return front*Math.sqrt(Math.max(.001,1-(x/w)**2))+sculpt(x,y);
}
const base=new THREE.Color('#e8bfae'),blush=new THREE.Color('#d9918e'),warm=new THREE.Color('#c39280');
function skinColor(x,y){
 const c=base.clone();
 c.lerp(blush,.20*gauss(Math.abs(x),.47,.22)*gauss(y,-.18,.22));
 c.lerp(warm,.12*gauss(Math.abs(x),.34,.25)*gauss(y,.35,.15));
 c.lerp(blush,.095*gauss(x,0,.15)*gauss(y,-.26,.15));
 const n=.004*Math.sin(x*123+y*213)*Math.sin(x*363-y*114);
 c.offsetHSL(0,0,n);return c;
}
function mesh(geo,mat,name){const o=new THREE.Mesh(geo,mat);o.name=name;o.castShadow=true;o.receiveShadow=true;return o;}
function buffer(pos,idx,uv,col){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 if(idx)g.setIndex(idx);
 if(uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 if(col)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 g.computeVertexNormals();return g;
}
function tube(points,radius,segments=30,radial=6){
 const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 return new THREE.TubeGeometry(c,segments,radius,radial,false);
}
function poreMap(){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d'),im=ctx.createImageData(1024,1024);
 let seed=1977;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){
  const i=(y*1024+x)*4,v=128+(rand()-.5)*32+3*Math.sin(x*.19)*Math.cos(y*.24);
  im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
 }
 ctx.putImageData(im,0,0);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function irisMap(){
 if(typeof document==='undefined')return null;
 const size=768,c=document.createElement('canvas');c.width=c.height=size;
 const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const dx=(x-size/2)/(size/2),dy=(y-size/2)/(size/2),r=Math.hypot(dx,dy),a=Math.atan2(dy,dx),i=(y*size+x)*4;
  const fibers=(Math.sin(a*151+5*Math.sin(r*19+a*17))*.5+Math.sin(a*263-r*13)*.3+Math.sin(a*87+r*18)*.2);
  const crypt=Math.sin(a*53+r*73)*Math.sin(a*71-r*21);
  const inner=gauss(r,.42,.12),limb=1-.75*smooth(clamp((r-.85)/.15,0,1));
  let R=(83+fibers*18+inner*24+crypt*5)*limb,G=(48+fibers*12+inner*12+crypt*4)*limb,B=(32+fibers*8+inner*4+crypt*3)*limb;
  if(r<.325){const e=smooth(clamp((r-.30)/.025,0,1));R=7*(1-e)+R*e;G=5*(1-e)+G*e;B=5*(1-e)+B*e;}
  im.data[i]=R;im.data[i+1]=G;im.data[i+2]=B;im.data[i+3]=255;
 }
 ctx.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function aperture(cx,s,a){
 const ca=Math.cos(a),sa=Math.sin(a),x=cx+.218*ca,y=.25+(sa>=0?.089:.067)*sa+.013*s*ca;
 const z=.477+Math.sqrt(Math.max(.003,.235**2-(x-cx)**2-(y-.25)**2));
 return [x,y,z+.004];
}
function makeEye(s,skin,texture){
 const cx=s*.342,cy=.25,g=new THREE.Group();g.name=s<0?'left-eye':'right-eye';
 const sclera=new THREE.MeshPhysicalMaterial({color:'#e9e3df',roughness:.27,metalness:0,clearcoat:.4,clearcoatRoughness:.09,specularIntensity:.55});
 const globe=mesh(new THREE.SphereGeometry(.235,56,40),sclera,'scleral-globe');globe.position.set(cx,cy,.477);g.add(globe);
 const pos=[],uv=[],idx=[],N=96,R=24,rad=.112;
 for(let j=0;j<=R;j++)for(let i=0;i<=N;i++){
  const r=j/R*rad,a=i/N*2*PI,xx=Math.cos(a)*r,yy=Math.sin(a)*r;
  pos.push(cx+xx,cy+yy,.477+Math.sqrt(.235**2-r*r)+.0025);uv.push(.5+xx/rad*.5,.5+yy/rad*.5);
 }
 for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const iris=new THREE.MeshPhysicalMaterial({color:texture?'#ffffff':'#4f2d1e',map:texture,roughness:.24,clearcoat:.8,clearcoatRoughness:.04,specularIntensity:.7});
 g.add(mesh(buffer(pos,idx,uv),iris,'brown-iris-and-pupil'));
 const pp=[],ii=[],cc=[],uu=[],NS=128,NR=12;
 const edgeWarm=new THREE.Color('#bd897c');
 for(let r=0;r<=NR;r++)for(let k=0;k<=NS;k++){
  const v=r/NR,a=k/NS*2*PI,[ix,iy,iz]=aperture(cx,s,a),ca=Math.cos(a),sa=Math.sin(a);
  const ox=cx+.311*ca,oy=cy+(sa>=0?.221:.181)*sa+.013*s*ca;
  const x=THREE.MathUtils.lerp(ix,ox,v),y=THREE.MathUtils.lerp(iy,oy,v),z=THREE.MathUtils.lerp(iz,faceZ(ox,oy)+.006,smooth(v))+.012*Math.sin(PI*v);
  pp.push(x,y,z);uu.push((Math.asin(clamp(x/profile(y)[0],-.999,.999))+PI)/(2*PI),(y+1.18)/2.72);
  const col=skinColor(x,y).lerp(edgeWarm,(1-v)**4*(sa>0?.20:.13));cc.push(col.r,col.g,col.b);
 }
 for(let r=0;r<NR;r++)for(let k=0;k<NS;k++){const a=r*(NS+1)+k,b=a+NS+1;ii.push(a,b,a+1,b,b+1,a+1);}
 g.add(mesh(buffer(pp,ii,uu,cc),skin,'sculpted-eyelids'));
 const rimMat=new THREE.MeshStandardMaterial({color:'#a06961',roughness:.51});
 const upper=[],lower=[],crease=[];
 for(let i=0;i<=64;i++){
  const a=i/64*PI,p=aperture(cx,s,a);upper.push([p[0],p[1],p[2]+.004]);
  const q=aperture(cx,s,PI+a);lower.push([q[0],q[1],q[2]+.004]);
  const ca=Math.cos(a),sa=Math.sin(a),v=.50,ox=cx+.311*ca,oy=cy+.221*sa+.013*s*ca;
  crease.push([THREE.MathUtils.lerp(p[0],ox,v),THREE.MathUtils.lerp(p[1],oy,v),THREE.MathUtils.lerp(p[2],faceZ(ox,oy)+.006,smooth(v))+.012*Math.sin(PI*v)+.001]);
 }
 g.add(mesh(tube(upper,.0048,64,5),rimMat,'upper-lash-margin'));
 g.add(mesh(tube(lower,.0032,64,5),new THREE.MeshStandardMaterial({color:'#c28c81',roughness:.42}),'lower-waterline'));
 g.add(mesh(tube(crease,.0028,64,4),new THREE.MeshStandardMaterial({color:'#b68473',roughness:.6}),'upper-lid-fold'));
 const lashes=[];
 for(let i=0;i<43;i++){
  const a=.11+(i/42)*(PI-.22),p=aperture(cx,s,a),outer=(1+s*Math.cos(a))/2,len=.021+.033*outer;
  lashes.push(tube([p,[p[0]+.009*s,p[1]+len*.45,p[2]+len*.65],[p[0]+.018*s,p[1]+len,p[2]+len*.8]],.0018,5,3));
 }
 for(let i=0;i<21;i++){
  const a=PI+.20+i/20*(PI-.4),p=aperture(cx,s,a),len=.014;
  lashes.push(tube([p,[p[0]+.004*s,p[1]-len*.65,p[2]+.011],[p[0]+.008*s,p[1]-len,p[2]+.012]],.00115,4,3));
 }
 const lashGeo=mergeGeometries(lashes);lashes.forEach(x=>x.dispose());
 g.add(mesh(lashGeo,new THREE.MeshStandardMaterial({color:'#30201b',roughness:.58}),'individual-eyelashes'));
 const tear=mesh(new THREE.SphereGeometry(.016,16,12),new THREE.MeshPhysicalMaterial({color:'#bb7c78',roughness:.34}),'lacrimal-caruncle');
 const ta=aperture(cx,s,s>0?PI:0);tear.position.set(...ta);tear.scale.set(1,.62,.46);g.add(tear);
 return g;
}
function makeMouth(){
 const group=new THREE.Group();group.name='closed-sculpted-lips';
 const upperCol=new THREE.Color('#b87171'),lowerCol=new THREE.Color('#d89390');
 const NX=100,NY=16;
 function seam(t){return -.639+.014*Math.abs(t)**1.8+.003*Math.cos(t*PI);}
 for(const upper of [true,false]){
  const p=[],idx=[],c=[],uv=[];
  for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){
   const t=-1+2*i/NX,x=.283*t,v=j/NY,w=Math.max(0,1-t*t),sy=seam(t);
   const cupid=(.70+.28*gauss(Math.abs(t),.34,.22)-.13*gauss(t,0,.13));
   const edge=upper?sy+.083*w**.7*cupid:sy-.084*w**.72;
   const y=THREE.MathUtils.lerp(edge,sy,v),z=faceZ(x,y)+.001+w*(.038*smooth(v)+.029*Math.sin(v*PI));
   p.push(x,y,z);uv.push(i/NX,j/NY);
   const col=skinColor(x,y).lerp(upper?upperCol:lowerCol,smooth(clamp(v*4,0,1))*.87);
   const grain=.006*Math.sin(i*2.399)*Math.sin(j/NY*PI);col.offsetHSL(0,0,grain);c.push(col.r,col.g,col.b);
  }
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i,b=a+NX+1;if(upper)idx.push(a,b,a+1,a+1,b,b+1);else idx.push(a,a+1,b,b,a+1,b+1);}
  group.add(mesh(buffer(p,idx,uv,c),new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.41,specularIntensity:.38,clearcoat:.12,clearcoatRoughness:.30,side:THREE.DoubleSide}),upper?'upper-lip':'lower-lip'));
 }
 const points=[];
 for(let i=0;i<=90;i++){const t=-1+2*i/90,x=t*.281,y=seam(t);points.push([x,y,faceZ(x,y)+.003+.037*(1-t*t)]);}
 group.add(mesh(tube(points,.0035,90,5),new THREE.MeshStandardMaterial({color:'#75403f',roughness:.65}),'closed-mouth-crease'));
 return group;
}
function makeNostrils(){
 const g=new THREE.Group();g.name='nose-cavities';
 for(const s of [-1,1]){
  const p=[],col=[],idx=[],N=40,R=7;
  for(let j=0;j<=R;j++)for(let i=0;i<=N;i++){
   const a=i/N*2*PI,r=j/R,x=s*.111+.040*r*Math.cos(a),y=-.323+.020*r*Math.sin(a)+s*.004*r*Math.cos(a);
   p.push(x,y,faceZ(x,y)+.0018);
   const c=new THREE.Color('#73483e').lerp(skinColor(x,y),smooth(clamp((r-.45)/.55,0,1))*.8);col.push(c.r,c.g,c.b);
  }
  for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;idx.push(a,a+1,b,b,a+1,b+1);}
  g.add(mesh(buffer(p,idx,null,col),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75,side:THREE.DoubleSide}),'naris-'+s));
 }
 return g;
}
function makeEar(s,skin){
 const g=new THREE.Group();g.name=s<0?'left-ear':'right-ear';
 const p=[],idx=[],col=[],uv=[],N=80,R=24;
 for(let j=0;j<=R;j++)for(let i=0;i<=N;i++){
  const a=i/N*2*PI,r=j/R,x=s*(.792+.128*r*Math.cos(a)),y=.055+.285*r*Math.sin(a);
  const z=.015+.019*r+.066*gauss(r,.83,.16)-.025*(1-r*r)+.025*Math.sin(a);
  p.push(x,y,z);const c=skinColor(x,y).lerp(new THREE.Color('#cb9388'),.22*(1-r));col.push(c.r,c.g,c.b);uv.push(i/N,j/R);
 }
 for(let j=0;j<R;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;if(s>0)idx.push(a,a+1,b,b,a+1,b+1);else idx.push(a,b,a+1,b,b+1,a+1);}
 const mat=skin.clone();mat.side=THREE.DoubleSide;mat.bumpMap=null;g.add(mesh(buffer(p,idx,uv,col),mat,'ear-cartilage'));
 const ridge=[];for(let i=0;i<=38;i++){const a=-PI*.6+i/38*PI*1.55;ridge.push([s*(.80+.063*Math.cos(a)),.04+.17*Math.sin(a),.055]);}
 g.add(mesh(tube(ridge,.012,38,7),new THREE.MeshStandardMaterial({color:'#e1af9f',roughness:.51}),'antihelix'));
 const tragus=mesh(new THREE.SphereGeometry(.031,18,12),new THREE.MeshStandardMaterial({color:'#ddb09f',roughness:.55}),'tragus');tragus.position.set(s*.744,-.012,.061);tragus.scale.set(.5,1,.7);g.add(tragus);
 return g;
}
function makeBrows(){
 const geo=[],g=new THREE.Group();g.name='individual-eyebrow-fibers';
 for(const s of [-1,1]){
  for(let i=0;i<220;i++){
   const t=i/219,r=(Math.sin(i*37.178)+1)/2,x=s*(.13+t*.49),y=.515+.061*Math.sin(t*PI*.88)-.045*t+.043*(r-.5)*(1-t*.65);
   const z=faceZ(x,y)+.009,len=.027+.020*(1-t);
   geo.push(tube([[x,y,z],[x+s*.013,y+len*.65,faceZ(x+s*.013,y+len*.65)+.012],[x+s*(.024+.010*t),y+len,faceZ(x+s*(.024+.010*t),y+len)+.009]],.00135*(1-.55*t),4,3));
  }
 }
 const merged=mergeGeometries(geo);geo.forEach(x=>x.dispose());g.add(mesh(merged,new THREE.MeshStandardMaterial({color:'#4b332c',roughness:.73}),'tapered-brow-hairs'));return g;
}
export function createHead({textures=true}={}){
 const root=new THREE.Group();root.name='anatomical-head';
 const pores=textures?poreMap():null;
 const skin=new THREE.MeshPhysicalMaterial({name:'skin-face',vertexColors:true,color:'#ffffff',roughness:.49,metalness:0,specularIntensity:.36,sheen:.08,sheenColor:'#ecc5bb',sheenRoughness:.8,bumpMap:pores,bumpScale:.0022});
 const pos=[],idx=[],uv=[],col=[],ny=260,nt=320;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nt;i++){
  const y=-1.18+j/ny*2.72,a=-PI+i/nt*2*PI,[w,f,b]=profile(y),co=Math.cos(a),x=w*Math.sin(a);
  let z=(co>=0?f:b)*co;if(co>0)z+=sculpt(x,y)*Math.pow(co,.8);
  pos.push(x,y,z);uv.push(i/nt,j/ny);const c=skinColor(x,y);col.push(c.r,col.g,col.b);
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nt;i++){
  const a=j*(nt+1)+i,b=a+nt+1;
  const midX=(pos[a*3]+pos[(a+1)*3]+pos[b*3]+pos[(b+1)*3])/4;
  const midY=(pos[a*3+1]+pos[b*3+1])/2,midZ=pos[a*3+2];
  const cutEye=midZ>0&&[-.342,.342].some(cx=>((midX-cx)/.293)**2+((midY-.25)/.19)**2<1);
  if(!cutEye)idx.push(a,a+1,b,b,a+1,b+1);
 }
 const head=mesh(buffer(pos,idx,uv,col),skin,'continuous-face');root.add(head);
 const iris=textures?irisMap():null;
 root.add(makeEye(-1,skin,iris),makeEye(1,skin,iris),makeMouth(),makeNostrils(),makeEar(-1,skin),makeEar(1,skin),makeBrows());
 root.userData={source:'Original procedural anatomical surface; no external geometry, photo projection, or downloaded textures.',featureUnits:'head local; chin -1.18, crown 1.54'};
 return root;
}
