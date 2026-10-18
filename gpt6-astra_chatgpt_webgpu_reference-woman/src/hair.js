import * as THREE from 'three';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
function rng(seed=14771){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
const curve=p=>new THREE.CatmullRomCurve3(p.map(a=>a.isVector3?a:V(...a)),false,'catmullrom',.4);
const batch=()=>({p:[],c:[],u:[],i:[]});
const smooth=(a,b,t)=>{t=THREE.MathUtils.clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);};
function vert(b,p,c,uv){let k=b.p.length/3;b.p.push(p.x,p.y,p.z);b.c.push(c.r,c.g,c.b);b.u.push(uv?uv[0]:p.x*.5,uv?uv[1]:p.y*.2);return k;}
function quad(b,a,c,d,e){b.i.push(a,c,e,c,d,e);}
function mesh(b,m,name){let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setIndex(b.i);g.computeVertexNormals();g.computeBoundingSphere();let o=new THREE.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;return o;}
function frame(c,t,front){
 let p=c.getPoint(t),d=c.getTangent(t).normalize();
 let radial=V(p.x,.035,p.z+.08).normalize(),n=radial;
 if(front){let crown=smooth(-1.50,.25,p.y);n=V(p.x*.12,.035,1).normalize().lerp(radial,crown).normalize();}
 if(n.lengthSq()<.01)n=V(0,.2,1);n.normalize();
 let axis=d.clone().cross(n);if(axis.lengthSq()<.001)axis=V(1,0,0);else axis.normalize();
 return{p,s:axis,n:axis.clone().cross(d).normalize()};
}
function ribbon(b,c,w,color,front=false,phase=0,steps=46,across=6,thin=false){
 let first=b.p.length/3,base=new THREE.Color(color);
 for(let j=0;j<=steps;j++){
  let t=j/steps,f=frame(c,t,front);
  // Both the root and tip converge into neighboring locks instead of cut cards.
  let taper=smooth(0,thin?.025:.09,t)*(.0001+.9999*(1-smooth(thin?.86:.60,thin?1:.90,t)));
  for(let k=0;k<=across;k++){
   let u=k/across*2-1,bulge=thin?0:(1-u*u)*.004*(.6+.4*Math.sin(t*Math.PI));
   let p=f.p.clone().addScaledVector(f.s,u*w*taper).addScaledVector(f.n,bulge+(thin?.013:.0009*Math.sin(k/across*39+phase)));
   let light=.90+.065*Math.sin(k/across*17+phase)+.025*Math.cos(t*13+phase);
   vert(b,p,base.clone().multiplyScalar(light),[k/across,t]);
  }
 }
 for(let j=0;j<steps;j++)for(let k=0;k<across;k++){let a=first+j*(across+1)+k;quad(b,a,a+across+1,a+across+2,a+1);}
}
function fiberMaps(){
 const width=512,height=1024,pixels=new Uint8Array(width*height*4),normals=new Uint8Array(width*height*4),rand=rng(328171);
 for(let i=0;i<width*height;i++){let k=i*4;pixels[k]=205;pixels[k+1]=201;pixels[k+2]=199;pixels[k+3]=0;normals[k]=normals[k+1]=128;normals[k+2]=normals[k+3]=255;}
 // Each card carries 26 independently shaped, independently terminating fibers.
 for(let fiber=0;fiber<26;fiber++){
  let center=(fiber+.24+rand()*.5)/26,widthPx=2.6+rand()*1.6,end=.70+rand()*.292,start=rand()*.025,phase=rand()*TAU;
  let shade=.68+rand()*.27,bend=.0015+rand()*.0023;
  for(let y=Math.floor(start*height);y<Math.floor(end*height);y++){
   let v=y/height,tip=1-smooth(end-.075,end,v),radius=widthPx*(.18+.82*tip),xcenter=width*(center+bend*Math.sin(v*11+phase)+.0012*Math.sin(v*29+phase*1.7));
   let fade=smooth(start,start+.016,v)*tip;
   for(let x=Math.max(0,Math.floor(xcenter-radius-1));x<=Math.min(width-1,Math.ceil(xcenter+radius+1));x++){
    let dist=(x+.5-xcenter)/Math.max(.35,radius),alpha=(1-smooth(.40,1,Math.abs(dist)))*.98*fade,k=(y*width+x)*4;
    if(alpha*255<=pixels[k+3])continue;
    let variation=shade*(.92+.08*Math.sin(v*17+phase));
    pixels[k]=Math.round(255*variation);pixels[k+1]=Math.round(252*variation);pixels[k+2]=Math.round(248*variation);pixels[k+3]=Math.round(255*alpha);
    let nx=.34*dist,ny=.01*Math.sin(v*9+phase),inv=1/Math.hypot(nx,ny,1);
    normals[k]=Math.round(127.5*(nx*inv+1));normals[k+1]=Math.round(127.5*(ny*inv+1));normals[k+2]=Math.round(127.5*(inv+1));
   }
  }
 }
 const make=data=>{let t=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;};
 let map=make(pixels),normalMap=make(normals);map.colorSpace=THREE.SRGBColorSpace;map.name='26 original alpha-tested mathematical hair fibers';normalMap.name='Original tangential fiber normals';return{map,normalMap};
}
// Four crossed, independently offset strand cards surround each guide curve.
function volumeLock(b,c,width,color,front,phase,steps=38,depth=.025){
 for(let layer=0;layer<4;layer++){
  let angle=[0,.89,-.86,1.55][layer]+.11*Math.sin(phase),co=Math.cos(angle),si=Math.sin(angle),first=b.p.length/3,base=new THREE.Color(color),across=2;
  for(let j=0;j<=steps;j++){
   let t=j/steps,f=frame(c,t,front),shape=smooth(0,.038,t)*(1-.43*smooth(.62,1,t));
   let sideways=f.s.clone().multiplyScalar(co).addScaledVector(f.n,si),normal=f.n.clone().multiplyScalar(co).addScaledVector(f.s,-si);
   let center=f.p.clone().addScaledVector(f.s,(layer-1.5)*width*.27*shape+.005*Math.sin(t*17+phase+layer)).addScaledVector(f.n,(layer%2?1:-1)*depth*.48*shape);
   for(let k=0;k<=across;k++){
    let u=k/across*2-1,p=center.clone().addScaledVector(sideways,u*width*.76*shape).addScaledVector(normal,(1-u*u)*.0035*shape);
    vert(b,p,base.clone().multiplyScalar(.94+.045*Math.sin(phase+layer*.9)),[k/across,t]);
   }
  }
  for(let j=0;j<steps;j++)for(let k=0;k<across;k++){let a=first+j*(across+1)+k;quad(b,a,a+across+1,a+across+2,a+1);}
 }
}
function scalp(theta,phi,offset=0){return V(.015+(.916+offset)*Math.sin(theta)*Math.sin(phi),.36+1.31*Math.cos(theta),-.065+(.84+offset)*Math.sin(theta)*Math.cos(phi));}
function foundation(b){
 let col=new THREE.Color('#352925'),az=84,lat=28,start=b.p.length/3;
 for(let j=0;j<=lat;j++)for(let k=0;k<=az;k++){
  let phi=k/az*TAU,limit=2.32-1.30*Math.pow(Math.max(0,Math.cos(phi)),2.2)-.72*Math.exp(-Math.pow((phi-4.91)/.42,4));
  vert(b,scalp(j/lat*limit,phi),col.clone().multiplyScalar(.95+.035*Math.sin(phi*41)),[k/az,j/lat]);
 }
 for(let j=0;j<lat;j++)for(let k=0;k<az;k++){let a=start+j*(az+1)+k;quad(b,a,a+az+1,a+az+2,a+1);}
 const angular=68,down=30;start=b.p.length/3;
 for(let j=0;j<=down;j++)for(let k=0;k<=angular;k++){
  let t=j/down,phi=1.16+k/angular*(TAU-2.43),lower=smooth(.54,1,t),radius=.66+.245*Math.sin(t*Math.PI*.83)-.12*lower;
  let y=.95-3.32*t+.10*Math.sin(phi*3.1)*lower,z=-.075+Math.cos(phi)*(.64+.14*Math.sin(t*Math.PI)-.06*lower);
  vert(b,V(Math.sin(phi)*radius,y,z),col.clone().multiplyScalar(.87+.07*Math.sin(phi*21)),[k/angular,t]);
 }
 for(let j=0;j<down;j++)for(let k=0;k<angular;k++){let a=start+j*(angular+1)+k;quad(b,a,a+angular+1,a+angular+2,a+1);}
}
export function createHair(){
 let root=new THREE.Group();root.name='Original layered alpha-tested strand-card hair';
 let random=rng(),shell=batch(),locks=batch(),strands=batch(),bangs=batch(),paths=[];
 let maps=fiberMaps();
 let mat=new THREE.MeshPhysicalMaterial({vertexColors:true,map:maps.map,normalMap:maps.normalMap,normalScale:new THREE.Vector2(.66,.20),alphaTest:.12,alphaToCoverage:true,transparent:false,roughness:.54,metalness:0,side:THREE.DoubleSide,anisotropy:.72,anisotropyRotation:Math.PI*.5,clearcoat:.015,specularIntensity:.31});
 let fineMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.58,transparent:true,opacity:.62,depthWrite:false,side:THREE.DoubleSide,alphaToCoverage:true});
 let shellMat=mat.clone();shellMat.map=null;shellMat.normalMap=null;shellMat.alphaTest=0;shellMat.alphaToCoverage=false;shellMat.anisotropy=0;shellMat.roughness=.72;shellMat.specularIntensity=.12;
 foundation(shell);
 // Independent rounded rear wave groups replace the entire skirt-like foundation.
 for(let k=0;k<42;k++){
  let phi=.84+k/41*(TAU-2.03)+(random()-.5)*.028,side=Math.sin(phi),back=Math.cos(phi),phase=k*.67,amp=.075+.070*random();
  const pt=(y,r,zr,w)=>V(side*r+amp*Math.sin(w+phase),y,-.075+back*zr+.075*Math.cos(w+phase)*smooth(.4,2.8,-y));
  let end=-3.55+.18*Math.sin(k*2.07)+.17*Math.sin(phi*2.2);
  let ps=[scalp(.07+(k%3)*.02,phi,.003),scalp(.47,phi,.012),scalp(.98,phi,.027),scalp(1.55,phi,.032),pt(-.52,.98,.87,0),pt(-1.36,1.10,.92,.8),pt(-2.13,1.22,.89,2),pt(-2.81,1.16,.84,3.2),pt(end+.21,.99,.75,4.3),pt(end,.91,.71,4.8)];
  let c=curve(ps),w=.079+random()*.020;
  volumeLock(locks,c,w,k%4?'#60483c':'#6a5145',false,phase,40,.023+random()*.010);
  paths.push({c,w,front:false,phase:k});
 }
 // Front lengths overlap as several fuller, differently phased waves over the chest.
 for(let side of[-1,1])for(let k=0;k<19;k++){
  let q=k/18,phase=k*.83+(side<0?.4:1.1),left=side<0,phi=side*((left?.88:.62)+q*(left?.89:.98));
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
  let c=curve(ps),w=.067+.035*random();
  volumeLock(locks,c,w,k%4?'#60483f':'#6b5246',true,phase,44,.026+.010*random());
  paths.push({c,w,front:true,phase:k+side});
 }
 let colors=['#473932','#5d493d','#493a32','#695345','#3c302a','#71594a'];
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
 for(let {c,w,front,phase}of paths)addFine(c,w,front,3,phase);
 // Thin locks follow the scalp before separating into curved wisps over the brow.
 let bs=[
 [.080,[[.17,1.63,.15],[-.09,1.49,.41],[-.40,1.22,.63],[-.64,.80,.66],[-.72,.30,.61],[-.74,-.08,.57]]],
 [.051,[[.18,1.63,.16],[-.02,1.46,.44],[-.25,1.18,.68],[-.44,.76,.76],[-.62,.16,.70],[-.71,-.52,.59]]],
 [.019,[[.19,1.61,.17],[.04,1.42,.46],[-.07,1.11,.69],[-.19,.77,.79],[-.30,.26,.76]]],
 [.013,[[.20,1.61,.17],[.13,1.43,.48],[.06,1.07,.71],[-.01,.76,.79],[-.11,.17,.78]]],
 [.014,[[.21,1.61,.16],[.24,1.42,.47],[.23,1.09,.70],[.19,.79,.79],[.10,.23,.78]]],
 [.009,[[.23,1.60,.16],[.29,1.39,.46],[.33,1.10,.67],[.34,.84,.75],[.27,.39,.78]]],
 [.010,[[.24,1.60,.14],[.38,1.31,.48],[.44,1.05,.65],[.47,.84,.72],[.45,.49,.72]]],
 [.065,[[.25,1.59,.13],[.50,1.35,.39],[.69,1.08,.51],[.82,.69,.51],[.88,.20,.52],[.89,-.35,.56]]],
 [.009,[[-.36,1.15,.66],[-.55,.72,.72],[-.68,.17,.69],[-.74,-.54,.61],[-.78,-1.3,.66],[-.83,-2.06,.77]]]
 ];
 bs.forEach(([w,ps],k)=>{
  let c=curve(ps);ribbon(bangs,c,w,k%2?'#483338':'#3c2d32',true,k*2.8,40,4);addFine(c,w,true,w>.04?13:7,k);
  if(w<.025)for(let j=0;j<3;j++){
   let d=ps.map((p,n)=>[p[0]+(j-1)*.013*smooth(0,ps.length-1,n),p[1]+.022*Math.sin(j+n)-(n===ps.length-1?.035*j:0),p[2]+.009]);
   ribbon(strands,curve(d),.0010,colors[(k+j)%colors.length],true,j+k,26,1,true);
  }
 });
 // Fine continuous crown fibers cover the forehead foundation and reveal the part.
 for(let k=0;k<30;k++){
  let phi=-1.18+k/29*2.22,lim=2.27-1.25*Math.pow(Math.max(0,Math.cos(phi)),2.3);
  let ps=[];for(let j=0;j<=8;j++){let theta=.075+j/8*(lim-.075);ps.push(scalp(theta,phi,.008));}
  let c=curve(ps);ribbon(bangs,c,.038,'#3b2d32',true,k*.9,28,3);addFine(c,.035,true,5,k);
 }
 for(let k=0;k<28;k++){let side=k%2?-1:1,t=(k%14)/13,y=1.15-t*4,x=side*(.94+.18*Math.sin(t*Math.PI)),z=.14+.6*random();let c=curve([[x,y,z],[x+side*.028,y-.2,z+.018],[x+side*.055,y-.49,z+.012],[x+side*.01,y-.78,z-.02]]);ribbon(strands,c,.0008,'#523d40',true,k,16,1,true);}
 root.add(mesh(shell,shellMat,'Hair rounded scalp foundation'),mesh(locks,mat,'Hair 320 crossed original strand cards'),mesh(bangs,mat,'Hair diagonal parted bangs'),mesh(strands,fineMat,'Hair fine geometric strands'));
 root.children[3].castShadow=false;
 let triangles=0;root.traverse(o=>{if(o.isMesh)triangles+=o.geometry.index.count/3;});
 root.userData={procedural:true,triangles,source:'Supplied portrait only; original crossed geometry and 26-fiber alpha textures',coordinateSystem:'+Z front; head local crown 1.67, tips about -4.0'};
 return root;
}
