import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PI=Math.PI, clamp=THREE.MathUtils.clamp;
const gauss=(x,m,s)=>Math.exp(-(((x-m)/s)**2));
const smooth=t=>t*t*(3-2*t);
const profiles=[
 [-1.18,.015,.20,.13],[-1.12,.160,.40,.25],[-1.01,.311,.51,.35],
 [-.83,.454,.56,.45],[-.61,.593,.58,.54],[-.36,.71,.59,.62],
 [-.10,.77,.58,.68],[.18,.79,.565,.71],[.45,.80,.58,.73],
 [.71,.775,.595,.72],[.96,.72,.56,.67],[1.18,.62,.46,.58],
 [1.37,.43,.29,.43],[1.50,.16,.10,.17],[1.54,.012,.01,.012]
];
function profile(y){
 let i=0;while(i<profiles.length-2&&y>profiles[i+1][0])i++;
 const p=profiles[i],q=profiles[i+1],t=clamp((y-p[0])/(q[0]-p[0]),0,1);
 const before=profiles[Math.max(0,i-1)],after=profiles[Math.min(profiles.length-1,i+2)];
 const dimensions=[1,2,3].map(k=>{
  const h=q[0]-p[0], m0=(q[k]-before[k])/(q[0]-before[0]),m1=(after[k]-p[k])/(after[0]-p[0]);
  return (2*t*t*t-3*t*t+1)*p[k]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*q[k]+(t*t*t-t*t)*h*m1;
 });
 // A rounded chin cap meets the lower-face spline with the same width and tangent.
 // This changes the silhouette itself without changing the crown/chin bounds or tessellation.
 if(y<profiles[1][0]){
  const h=profiles[1][0]-profiles[0][0],u=clamp(y-profiles[0][0],0,h);
  const w0=profiles[0][1],w1=profiles[1][1],slope=(profiles[2][1]-w0)/(profiles[2][0]-profiles[0][0]);
  const b=(2*w1*slope*h-(w1*w1-w0*w0))/(h*h),a=(w1*w1-w0*w0-b*h*h)/h;
  dimensions[0]=Math.sqrt(w0*w0+a*u+b*u*u);
 }
 return dimensions;
}
function sculpt(x,y){
 let d=.058*gauss(Math.abs(x),.46,.24)*gauss(y,-.15,.28);
 d+=.050*gauss(Math.abs(x),.34,.25)*gauss(y,.04,.23);
 d+=.018*gauss(Math.abs(x),.34,.25)*gauss(y,.41,.14);
 d-=.022*gauss(Math.abs(x),.35,.25)*gauss(y,.25,.16);
 d+=.126*gauss(x,0,.124)*gauss(y,.20,.37);
 d+=.090*gauss(x,0,.125)*gauss(y,-.095,.23);
 const nasalBlend=1-smooth(clamp((y+.04)/.13,0,1));
 // Compact the local edit below the orbits, preserving the established eye and corneal surfaces.
 d+=(.169-.019*nasalBlend)*gauss(x,0,.134+.005*nasalBlend)*gauss(y,-.237,.128+.004*nasalBlend);
 d+=(.073-.005*nasalBlend)*gauss(Math.abs(x),.143,.077+.006*nasalBlend)*gauss(y,-.285,.093+.010*nasalBlend);
 d+=(.031-.002*nasalBlend)*gauss(x,0,.057+.004*nasalBlend)*gauss(y,-.345,.071+.007*nasalBlend);
 d-=(.009-.0025*nasalBlend)*gauss(Math.abs(x),.112,.047+.007*nasalBlend)*gauss(y,-.327,.031+.005*nasalBlend);
 d+=.037*gauss(x,0,.31)*gauss(y,-.58,.17);
 d-=.003*gauss(x,0,.046)*gauss(y,-.46,.080);
 d+=.004*gauss(Math.abs(x),.055,.033)*gauss(y,-.46,.085);
 d+=.035*gauss(x,0,.265)*gauss(y,-.93,.16);
 d-=.010*gauss(x,0,.225)*gauss(y,-.79,.067);
 return d;
}
function roundedSection(c,p){
 const join=.40;
 if(c>=join)return Math.pow(c,p);
 // Match value, first derivative and second derivative at the transition.
 // The finite slope at the side avoids a flat superellipse strip at the jaw.
 const t=c/join,a=(p-3)*(p-5)/8,b=(p-1)*(5-p)/4,d=(p-1)*(p-3)/8;
 return Math.pow(join,p)*t*(a+t*t*(b+d*t*t));
}
function unblendedZ(x,y){
 const [w,front]=profile(y);
 const co=Math.sqrt(Math.max(0,1-(x/w)**2));
 return front*roundedSection(co,.62)+sculpt(x,y)*roundedSection(co,.8);
}
function orbitalRadius(x,y,s){
 const cx=s*.342,X=(x-cx)/.185,dy=y-.25-.013*s*X,Y=Math.abs(dy/(dy>=0?.080:.058));
 return (Y+Math.sqrt(Y*Y+4*X*X))/2;
}
function eyeSurfaceZ(x,y,s){
 const dx=(x-s*.342)/.185,dy=y-.25;
 return unblendedZ(x,.25)+.027*Math.max(0,1-dx*dx)-.90*dy*dy+.0015;
}
export function faceZ(x,y){
 let z=unblendedZ(x,y);
 for(const s of [-1,1]){
  const cx=s*.342,q=orbitalRadius(x,y,s);
  if(q<1.82){
   const dx=x-cx,dy=y-.25;
   const ca=clamp(dx/(.185*Math.max(.001,q)),-1,1),a=Math.atan2(Math.sign(dy-.013*s*dx/.185)*Math.sqrt(Math.max(0,1-ca*ca)),ca);
   const [ex,ey,ez]=aperture(cx,s,a);
   const weight=1-smooth(clamp((q-1)/.82,0,1));
   z+=(ez-unblendedZ(ex,ey))*weight;
  }
 }
 return z;
}
function exactFaceNormals(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal,e=.00012;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i);
  const normal=new THREE.Vector3(-(faceZ(x+e,y)-faceZ(x-e,y))/(2*e),-(faceZ(x,y+e)-faceZ(x,y-e))/(2*e),1).normalize();
  n.setXYZ(i,normal.x,normal.y,normal.z);
 }
 return geometry;
}
const base=new THREE.Color('#e8bfae'),blush=new THREE.Color('#d9918e'),warm=new THREE.Color('#c39280');
export function skinColor(x,y){
 const c=base.clone();
 c.lerp(blush,.28*gauss(Math.abs(x),.47,.22)*gauss(y,-.18,.22));
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
 const ca=Math.cos(a),sa=Math.sin(a),x=cx+.185*ca,y=.25+(sa>=0?.080:-.058)*sa*sa+.013*s*ca;
 const z=eyeSurfaceZ(x,y,s);
 return [x,y,z+.004];
}
function makeEye(s,skin,texture){
 const cx=s*.342,cy=.25,g=new THREE.Group();g.name=s<0?'left-eye':'right-eye';
 const sclera=new THREE.MeshPhysicalMaterial({color:'#d9d4d0',roughness:.40,metalness:0,clearcoat:.03,clearcoatRoughness:.22,specularIntensity:.20,envMapIntensity:.45});
 const sp=[],si=[],su=[],SN=96,SR=24;
 for(let j=0;j<=SR;j++)for(let i=0;i<=SN;i++){
  const r=j/SR,a=i/SN*2*PI,[ex,ey]=aperture(cx,s,a),x=THREE.MathUtils.lerp(cx,ex,r),y=THREE.MathUtils.lerp(cy,ey,r);
  sp.push(x,y,eyeSurfaceZ(x,y,s)+.0003);su.push(.5+(x-cx)/.48,.5+(y-cy)/.48);
 }
 for(let j=0;j<SR;j++)for(let i=0;i<SN;i++){
  const a=j*(SN+1)+i,b=a+SN+1;
  for(const tri of [[a,b,a+1],[b,b+1,a+1]]){
   const x=tri.reduce((v,k)=>v+sp[k*3],0)/3-cx,y=tri.reduce((v,k)=>v+sp[k*3+1],0)/3-cy;
   if(x*x+y*y>.100*.100)si.push(...tri);
  }
 }
 const globe=mesh(buffer(sp,si,su),sclera,'scleral-globe');g.add(globe);
 const pos=[],corneaPos=[],uv=[],idx=[],N=112,R=28,rad=.107;
 for(let j=0;j<=R;j++)for(let i=0;i<=N;i++){
  const r=j/R*rad,a=i/N*2*PI,xx=Math.cos(a)*r,yy=Math.sin(a)*r;
  const x=cx+xx,y=cy+yy,q=r/rad,edge=smooth(clamp((1-orbitalRadius(x,y,s))/.21,0,1)),surface=eyeSurfaceZ(x,y,s);
  // The pigmented iris sits behind the transparent corneal dome, with a shallow pupil cup.
  pos.push(x,y,surface+.0025-.012*(1-q*q)*edge);
  corneaPos.push(x,y,surface+.0030+.027*(1-q*q)*edge);
  uv.push(.5+xx/rad*.5,.5+yy/rad*.5);
 }
 for(let j=0;j<R;j++)for(let i=0;i<N;i++){
  const a=j*(N+1)+i,b=a+N+1;
  for(const tri of [[a,b,a+1],[b,b+1,a+1]]){
   const mx=tri.reduce((v,k)=>v+pos[k*3],0)/3,my=tri.reduce((v,k)=>v+pos[k*3+1],0)/3,t=(mx-cx)/.185,h=Math.max(0,1-t*t);
   if(my<cy+.080*h+.013*s*t-.001&&my>cy-.058*h+.013*s*t+.001)idx.push(...tri);
  }
 }
 const iris=new THREE.MeshPhysicalMaterial({color:texture?'#ffffff':'#4f2d1e',map:texture,roughness:.48,clearcoat:0,specularIntensity:.10,envMapIntensity:.40});
 g.add(mesh(buffer(pos,idx,uv),iris,'brown-iris-and-pupil'));
 // The cornea is one moist dielectric surface; an additional clearcoat would
 // duplicate its reflections and make the photographed eye color look glazed.
 const corneaMaterial=new THREE.MeshPhysicalMaterial({name:'corneal-tear-film',color:'#ffffff',roughness:.075,metalness:0,transmission:1,thickness:.009,ior:1.376,specularIntensity:.75,clearcoat:0,attenuationColor:'#fff8f0',attenuationDistance:2,envMapIntensity:.45,depthWrite:false});
 const cornea=mesh(buffer(corneaPos,idx,uv),corneaMaterial,'transparent-corneal-dome');
 cornea.castShadow=false;cornea.receiveShadow=false;cornea.renderOrder=2;g.add(cornea);
 // Small curved highlights describe the studio softboxes reflected by the tear film.
 // They are authored geometry, so their placement remains correct through all views.
 const highlight=new THREE.MeshBasicMaterial({color:'#fffdf8',transparent:true,opacity:.86,depthWrite:false});
 for(const [dx,dy,r,opacity] of [[-.033,.033,.0115,.90],[.039,-.026,.004,.48]]){
  const glint=mesh(new THREE.SphereGeometry(r,16,10),highlight.clone(),'corneal-softbox-reflection');
  glint.material.opacity=opacity;glint.position.set(cx+dx,cy+dy,eyeSurfaceZ(cx+dx,cy+dy,s)+.007);
  glint.scale.set(1,.78,.20);g.add(glint);
 }

 const pp=[],ii=[],cc=[],uu=[],NS=128,NR=12;
 const edgeWarm=new THREE.Color('#bd897c');
 for(let r=0;r<=NR;r++)for(let k=0;k<=NS;k++){
  const v=r/NR,a=k/NS*2*PI,[ix,iy,iz]=aperture(cx,s,a),ca=Math.cos(a),sa=Math.sin(a);
  const ox=cx+(ix-cx)*1.42,oy=cy+(iy-cy)*1.42;
  const x=THREE.MathUtils.lerp(ix,ox,v),y=THREE.MathUtils.lerp(iy,oy,v),z=faceZ(x,y)+.00035;
  pp.push(x,y,z);uu.push((Math.asin(clamp(x/profile(y)[0],-.999,.999))+PI)/(2*PI),(y+1.18)/2.72);
  const col=skinColor(x,y).lerp(edgeWarm,(1-v)**4*(sa>0?.20:.13));cc.push(col.r,col.g,col.b);
 }
 for(let r=0;r<NR;r++)for(let k=0;k<NS;k++){const a=r*(NS+1)+k,b=a+NS+1;ii.push(a,b,a+1,b,b+1,a+1);}
 g.add(mesh(exactFaceNormals(buffer(pp,ii,uu,cc)),skin,'sculpted-eyelids'));
 const rimMat=new THREE.MeshStandardMaterial({color:'#684b41',roughness:.79});
 const upper=[],lower=[],crease=[];
 for(let i=0;i<=64;i++){
  const a=i/64*PI,p=aperture(cx,s,a);upper.push([p[0],p[1],p[2]+.0005]);
  const q=aperture(cx,s,PI+a);lower.push([q[0],q[1],q[2]+.0004]);
  const ca=Math.cos(a),sa=Math.sin(a),v=.63,ox=cx+(p[0]-cx)*1.42,oy=cy+(p[1]-cy)*1.42;
  crease.push([THREE.MathUtils.lerp(p[0],ox,v),THREE.MathUtils.lerp(p[1],oy,v),faceZ(THREE.MathUtils.lerp(p[0],ox,v),THREE.MathUtils.lerp(p[1],oy,v))+.00015]);
 }
 g.add(mesh(tube(upper,.00115,64,5),rimMat,'upper-lash-margin'));
 g.add(mesh(tube(lower,.00080,64,5),new THREE.MeshPhysicalMaterial({color:'#b58b80',roughness:.46,clearcoat:0,specularIntensity:.16,envMapIntensity:.45}),'lower-waterline'));
 const tearLine=lower.map(p=>[p[0],p[1]+.0003,p[2]+.0006]);
 const tearFilm=mesh(tube(tearLine,.00055,64,5),new THREE.MeshPhysicalMaterial({color:'#eed1c3',roughness:.14,clearcoat:0,specularIntensity:.20,envMapIntensity:.30,transparent:true,opacity:.065,depthWrite:false}),'lower-tear-meniscus');
 tearFilm.castShadow=false;g.add(tearFilm);
 const creaseCurve=crease.slice(7,58),creaseGeo=tube(creaseCurve,.00065,48,4),cp=creaseGeo.attributes.position,path=creaseGeo.parameters.path;
 for(let k=0;k<cp.count;k++){
  const t=Math.floor(k/5)/48,center=path.getPointAt(t),taper=Math.sin(PI*t)**.7;
  cp.setXYZ(k,center.x+(cp.getX(k)-center.x)*taper,center.y+(cp.getY(k)-center.y)*taper,center.z+(cp.getZ(k)-center.z)*taper);
 }
 creaseGeo.computeVertexNormals();
 const creaseMesh=mesh(creaseGeo,new THREE.MeshStandardMaterial({color:'#a27b6b',roughness:.84,transparent:true,opacity:.28,depthWrite:false}),'upper-lid-fold');
 creaseMesh.castShadow=false;g.add(creaseMesh);
 const lashes=[];
 for(let i=0;i<29;i++){
  const a=.11+((i+.13*Math.sin(i*2.399))/28)*(PI-.22),p=aperture(cx,s,a),outer=(1+s*Math.cos(a))/2,len=(.013+.026*outer)*(.75+.25*Math.sin(i*2.399)**2);
  lashes.push(tube([p,[p[0]+Math.cos(a)*len*.25,p[1]+len*.45,p[2]+len*.65],[p[0]+Math.cos(a)*len*.5,p[1]+len,p[2]+len*.8]],.00095,6,3));
 }
 for(let i=0;i<11;i++){
  const a=PI+.20+(i+.10*Math.sin(i*1.73))/10*(PI-.4),p=aperture(cx,s,a),len=.014;
  lashes.push(tube([p,[p[0]+.004*s,p[1]-len*.65,p[2]+.011],[p[0]+.008*s,p[1]-len,p[2]+.012]],.00065,4,3));
 }
 const lashGeo=mergeGeometries(lashes);lashes.forEach(x=>x.dispose());
 g.add(mesh(lashGeo,new THREE.MeshStandardMaterial({color:'#53423b',roughness:.58}),'individual-eyelashes'));
 const tear=mesh(new THREE.SphereGeometry(.011,16,12),new THREE.MeshPhysicalMaterial({color:'#bb7c78',roughness:.52,specularIntensity:.18}),'lacrimal-caruncle');
 const ta=aperture(cx,s,s>0?PI:0);tear.position.set(...ta);tear.scale.set(1,.62,.46);g.add(tear);
 return g;
}
function makeMouth(){
 const group=new THREE.Group();group.name='closed-sculpted-lips';
 const upperCol=new THREE.Color('#b87c78'),lowerCol=new THREE.Color('#d79993');
 const NX=100,NY=16;
 function seam(t){return -.639+.008*Math.abs(t)**1.8+.003*Math.cos(t*PI)+.0035*t;}
 for(const upper of [true,false]){
  const p=[],idx=[],c=[],uv=[];
  for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){
   const t=-1+2*i/NX,x=.241*t,v=j/NY,w=Math.max(0,1-t*t),sy=seam(t);
   const cupid=(.81+.15*gauss(t,-.30,.28)+.12*gauss(t,.35,.25)-.07*gauss(t,-.025,.18));
   const edge=upper?sy+.088*w**.7*cupid:sy-.094*w**.72;
   const y=THREE.MathUtils.lerp(edge,sy,v),z=faceZ(x,y)+.001+w*(.024*smooth(v)+.022*Math.sin(v*PI));
   p.push(x,y,z);uv.push(i/NX,j/NY);
   const col=skinColor(x,y).lerp(upper?upperCol:lowerCol,smooth(clamp(v*2.4,0,1))*.80);
   const grain=.006*Math.sin(i*2.399)*Math.sin(j/NY*PI);col.offsetHSL(0,0,grain);c.push(col.r,col.g,col.b);
  }
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=j*(NX+1)+i,b=a+NX+1;if(upper)idx.push(a,b,a+1,a+1,b,b+1);else idx.push(a,a+1,b,b,a+1,b+1);}
  group.add(mesh(buffer(p,idx,uv,c),new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.41,specularIntensity:.38,clearcoat:.12,clearcoatRoughness:.30,side:THREE.DoubleSide}),upper?'upper-lip':'lower-lip'));
 }
 const points=[];
 for(let i=0;i<=90;i++){const t=-1+2*i/90,x=t*.240,y=seam(t);points.push([x,y,faceZ(x,y)+.0018+.024*(1-t*t)]);}
 group.add(mesh(tube(points,.0019,90,5),new THREE.MeshStandardMaterial({color:'#96605a',roughness:.65}),'closed-mouth-crease'));
 return group;
}
function makeNostrils(){
 const g=new THREE.Group();g.name='nose-cavities';
 for(const s of [-1,1]){
  const p=[],col=[],idx=[],N=48,R=10;
  for(let j=0;j<=R;j++)for(let i=0;i<=N;i++){
   const a=i/N*2*PI,r=j/R,x=s*.113+.036*r*Math.cos(a),y=-.333+.014*r*Math.sin(a)+s*.005*r*Math.cos(a);
   p.push(x,y,faceZ(x,y)+.0018);
   const c=new THREE.Color('#8a584b').lerp(skinColor(x,y),smooth(clamp((r-.45)/.55,0,1))*.8);col.push(c.r,c.g,c.b);
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
 const browColor=new THREE.Color('#5d443b');
 for(const s of [-1,1]){
  const bp=[],bi=[],bc=[],N=80,M=8;
  const browY=t=>.509+.054*Math.sin(t*PI*.88)-.037*t;
  for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){
   const t=i/N,v=j/M*2-1,x=s*(.14+t*.49),width=.023*(Math.sin(PI*t)**.35)*(1-.45*t),y=browY(t)+v*width;
   const color=skinColor(x,y).lerp(browColor,.36*(1-v*v)**1.5*Math.sin(PI*t)**.20);
   bp.push(x,y,faceZ(x,y)+.0006);bc.push(color.r,color.g,color.b);
  }
  for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;bi.push(a,b,a+1,b,b+1,a+1);}
  g.add(mesh(exactFaceNormals(buffer(bp,bi,null,bc)),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.74,side:THREE.DoubleSide}),'soft-brow-underlayer'));
  for(let i=0;i<155;i++){
   const t=(i+.3*Math.sin(i*3.18))/155,r=(Math.sin(i*137.178)+1)/2,x=s*(.14+t*.49);
   const width=.039*Math.sin(PI*t)**.30*(1-.56*t),y=browY(t)+width*(r-.5);
   const dx=s*(.008+.028*smooth(t)),dy=(.026*(1-t)**1.25-.006*t)*(.6+.4*r);
   const points=[[x,y,faceZ(x,y)+.0018],[x+dx*.55,y+dy*.70,faceZ(x+dx*.55,y+dy*.70)+.0031],[x+dx,y+dy,faceZ(x+dx,y+dy)+.0018]];
   const fiber=tube(points,.00090*(1-.63*t),5,3),fp=fiber.attributes.position,path=fiber.parameters.path;
   for(let k=0;k<fp.count;k++){
    const u=Math.floor(k/4)/5,center=path.getPointAt(u),taper=1-.89*u;
    fp.setXYZ(k,center.x+(fp.getX(k)-center.x)*taper,center.y+(fp.getY(k)-center.y)*taper,center.z+(fp.getZ(k)-center.z)*taper);
   }
   fiber.computeVertexNormals();geo.push(fiber);
  }
 }
 const merged=mergeGeometries(geo);geo.forEach(x=>x.dispose());g.add(mesh(merged,new THREE.MeshStandardMaterial({color:'#674d41',roughness:.83}),'tapered-brow-hairs'));return g;
}
// Preserve the crown and chin while restoring the reference's forehead and lower-face proportions.
const landmarkWarp=[[-1.18,-1.18],[-.96,-1.04],[-.639,-.79],[-.26,-.475],[.25,.050],[.67,.505],[1.12,1.06],[1.54,1.54]];
function portraitY(y){
 if(y<=-1.18||y>=1.54)return y;
 let i=0;while(i<landmarkWarp.length-2&&y>landmarkWarp[i+1][0])i++;
 const p=landmarkWarp[i],q=landmarkWarp[i+1],prev=landmarkWarp[Math.max(0,i-1)],next=landmarkWarp[Math.min(landmarkWarp.length-1,i+2)],h=q[0]-p[0],t=(y-p[0])/h;
 const m0=(q[1]-prev[1])/(q[0]-prev[0]),m1=(next[1]-p[1])/(next[0]-p[0]);
 return (2*t*t*t-3*t*t+1)*p[1]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*q[1]+(t*t*t-t*t)*h*m1;
}
function refineProportions(root){
 root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(!o.isMesh)return;
  const g=o.geometry;g.applyMatrix4(o.matrixWorld);
  const p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++){
   const y=p.getY(i),dy=(portraitY(y+.0001)-portraitY(y-.0001))/.0002;
   p.setY(i,portraitY(y));
   const normal=new THREE.Vector3(n.getX(i),n.getY(i)/Math.max(.3,dy),n.getZ(i)).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);
  }
  o.position.set(0,0,0);o.quaternion.identity();o.scale.set(1,1,1);o.updateMatrix();
  g.computeBoundingSphere();
 });
}
export function createHead({textures=true}={}){
 const root=new THREE.Group();root.name='anatomical-head';
 const pores=textures?poreMap():null;
 const skin=new THREE.MeshPhysicalMaterial({name:'skin-face',vertexColors:true,color:'#ffffff',roughness:.49,metalness:0,specularIntensity:.36,sheen:.08,sheenColor:'#ecc5bb',sheenRoughness:.8,bumpMap:pores,bumpScale:.0022});
 const pos=[],idx=[],uv=[],col=[],ny=290,nt=380;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nt;i++){
  const y=-1.18+j/ny*2.72,a=-PI+i/nt*2*PI,[w,f,b]=profile(y),co=Math.cos(a),x=w*Math.sin(a);
  let z=co>=0?faceZ(x,y):b*co;
  pos.push(x,y,z);uv.push(i/nt,j/ny);const c=skinColor(x,y);col.push(c.r,c.g,c.b);
 }
 for(let j=0;j<ny;j++)for(let i=0;i<nt;i++){
  const a=j*(nt+1)+i,b=a+nt+1;
  const midX=(pos[a*3]+pos[(a+1)*3]+pos[b*3]+pos[(b+1)*3])/4;
  const midY=(pos[a*3+1]+pos[b*3+1])/2,midZ=pos[a*3+2];
  const cutEye=midZ>0&&[-1,1].some(s=>orbitalRadius(midX,midY,s)<1.20);
  if(!cutEye)idx.push(a,a+1,b,b,a+1,b+1);
 }
 const faceGeometry=buffer(pos,idx,uv,col);
 const pp=faceGeometry.attributes.position,nn=faceGeometry.attributes.normal,e=.00012;
 for(let k=0;k<pp.count;k++)if(pp.getZ(k)>0&&Math.abs(pp.getX(k))<.73&&pp.getY(k)>-.03&&pp.getY(k)<.64){
  const x=pp.getX(k),y=pp.getY(k),n=new THREE.Vector3(-(faceZ(x+e,y)-faceZ(x-e,y))/(2*e),-(faceZ(x,y+e)-faceZ(x,y-e))/(2*e),1).normalize();nn.setXYZ(k,n.x,n.y,n.z);
 }
 const head=mesh(faceGeometry,skin,'continuous-face');root.add(head);
 const iris=textures?irisMap():null;
 root.add(makeEye(-1,skin,iris),makeEye(1,skin,iris),makeMouth(),makeNostrils(),makeEar(-1,skin),makeEar(1,skin),makeBrows());
 refineProportions(root);
 root.getObjectByName('individual-eyebrow-fibers').position.y=-.10;
 const leftEar=root.getObjectByName('left-ear');leftEar.position.set(-.045,.13,.16);
 root.userData={source:'Original procedural anatomical surface. Skin and eye color can be baked separately from the sole user-supplied reference; no external geometry.',featureUnits:'head local; chin -1.18, crown 1.54'};
 return root;
}
