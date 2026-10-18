import * as THREE from 'three';

// Original procedural tailoring. No imported meshes, photographs or texture assets.
// Bust coordinate system: crown 4.47, chin 1.83, shoulder contour 1.37, crop -1.45.
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a,b,t) => { const q=clamp((t-a)/(b-a),0,1);return q*q*(3-2*q); };
const gauss=(v,s)=>Math.exp(-(v*v)/(s*s));
const BUTTON_Y=[.480,-.115,-.710,-1.305];
const placketX=y=>{const v=clamp((.780-y)/2.230,0,1);return -.022+.027*Math.sin(v*Math.PI)+.274*v*v;};

function surface(nu,nv,fn) {
  const positions=[],uvs=[],indices=[];
  for(let j=0;j<=nv;j++) for(let i=0;i<=nu;i++) {
    const u=i/nu,v=j/nv,p=fn(u,v);
    positions.push(p[0],p[1],p[2]);uvs.push(u,v);
  }
  for(let j=0;j<nv;j++) for(let i=0;i<nu;i++) {
    const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();
  return g;
}

function mesh(group,name,g,material) {
  if(material.vertexColors&&!g.getAttribute('color')){
    const colors=new Float32Array(g.getAttribute('position').count*3);colors.fill(1);g.setAttribute('color',new THREE.BufferAttribute(colors,3));
  }
  const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;
}

function weaveTexture() {
  const N=256,data=new Uint8Array(N*N*4);
  let seed=73581;
  const rand=()=> {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) {
    const twill=((x+y)%6)<3?2:-2;
    const warp=Math.sin(x*Math.PI*.5)*5;
    const weft=Math.sin(y*Math.PI*.5)*5;
    const f=Math.round(127+warp+weft+twill+(rand()-.5)*7),k=(y*N+x)*4;
    data[k]=data[k+1]=data[k+2]=f;data[k+3]=255;
  }
  const tex=new THREE.DataTexture(data,N,N,THREE.RGBAFormat);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(14,14);tex.needsUpdate=true;tex.anisotropy=4;return tex;
}

// Catmull interpolation preserves broad garment volumes without separate cylinders.
const torsoStations=[
  // along surface, half width, front depth, back depth, front y, side y, back y
  [0,.375,.555,.30,.780,1.58,1.74],
  [.12,.81,.636,.46,.49,1.52,1.42],
  [.28,1.43,.727,.56,.20,1.37,1.00],
  [.44,1.67,.754,.59,-.24,.56,.41],
  [.67,1.61,.724,.59,-.74,-.25,-.35],
  [1,1.49,.637,.54,-1.45,-1.45,-1.45]
];

function profile(t) {
  let n=0;while(n<torsoStations.length-2&&t>torsoStations[n+1][0])n++;
  const b=torsoStations[n],c=torsoStations[n+1],a=torsoStations[Math.max(0,n-1)],d=torsoStations[Math.min(torsoStations.length-1,n+2)];
  const h=clamp((t-b[0])/(c[0]-b[0]),0,1),h2=h*h,h3=h2*h;
  const out=[];
  for(let k=1;k<b.length;k++) {
    const v0=(c[k]-a[k])/(c[0]-a[0])*(c[0]-b[0]);
    const v1=(d[k]-b[k])/(d[0]-b[0])*(c[0]-b[0]);
    out.push((2*h3-3*h2+1)*b[k]+(h3-2*h2+h)*v0+(-2*h3+3*h2)*c[k]+(h3-h2)*v1);
  }
  return out;
}

function torsoPoint(u,t) {
  const a=u*TAU,s=Math.sin(a),c=Math.cos(a),p=profile(t);
  const x=p[0]*s;
  const front=c>=0;
  let y=mix(p[4],front?p[3]:p[5],Math.pow(Math.abs(c),1.32));
  // Cut a real V in the front pattern, with gently eased edges at the shirt body.
  if(front){const vY=p[3]+(p[4]-p[3])*Math.pow(Math.abs(s),.87);y=mix(y,vY,1-smooth(.035,.265,t));}
  y+=.042*s*Math.sin(Math.PI*t)*(1-smooth(.62,1,t));
  let z=(front?p[1]:p[2])*c;
  const gate=smooth(.12,.35,t)*(1-smooth(.94,1.0,t));
  if(front) {
    const ax=Math.abs(x);
    // Soft draped volume between the chest and waist, with generous unwrinkled areas.
    z+=.051*gauss(ax-.52,.43)*gauss(y+.22,.60)*Math.pow(c,.5);
    z+=.017*gauss(ax-.74,.48)*gauss(y+1.12,.36);
    // Folds follow garment tension around the sewn placket and button positions.
    let folds=0;
    for(let k=0;k<3;k++){
      const side=x>=placketX(y)?1:-1,dx=(x-placketX(BUTTON_Y[k]))*side;
      const centre=BUTTON_Y[k]-.065+(.11+.025*k)*dx+.095*dx*dx;
      const dist=y-centre,w=.023+.045*Math.max(0,dx);
      folds+=(.009+k*.002)*gauss(dx-.23,.39)*(gauss(dist,w)-.32*gauss(dist,w*2.65))*smooth(.06,.16,dx);
    }
    // Two long, slightly asymmetrical hanging folds retain the poplin's direction.
    const lineA=.80+.045*Math.sin(y*2.3+.6),lineB=1.17-.085*y;
    folds+=.011*(gauss(ax-lineA,.060)-.38*gauss(ax-lineA-.055,.095))*smooth(-1.45,-.8,y)*(1-smooth(.35,.9,y));
    folds+=.015*(gauss(ax-lineB,.060)-.38*gauss(ax-lineB-.055,.09))*gauss(y+.61,.69);
    const shoulderD=y-1.045+.29*(ax-1.25);
    folds+=.011*gauss(ax-1.36,.24)*(gauss(shoulderD,.047)-.35*gauss(shoulderD,.100));
    z+=folds*gate*Math.pow(c,.50);
    // The sleeve attachment is a soft inset instead of a periodic ribbed surface.
    z-=.025*gauss(ax-1.225-.025*y,.070)*smooth(.43,.67,t)*(1-smooth(.96,1,t));
  } else {
    const backFold=.009*gauss(x-.46-.025*y,.085)-.006*gauss(x+.57+.04*y,.100);
    z-=gate*(backFold+.007*gauss(x,.043)*gauss(y-.23,.66));
  }
  y+=.007*Math.sin(a*3.0+.4)*smooth(.50,.85,t)*(1-smooth(.93,1,t));
  return [x,y,z];
}

function frontAtY(y) {
  return bodyAtXY(0,y,true);
}

function bodyAtXY(x,y,front=true) {
  let lo=0,hi=1;
  for(let n=0;n<22;n++){
    const t=(lo+hi)/2,p=profile(t),a=Math.asin(clamp(x/p[0],-1,1));
    const point=torsoPoint((front?a:Math.PI-a)/TAU,t);
    if(point[1]>y)lo=t;else hi=t;
  }
  const t=(lo+hi)/2,a=Math.asin(clamp(x/profile(t)[0],-1,1));
  return torsoPoint((front?a:Math.PI-a)/TAU,t);
}

function bodyNormal(x,y) {
  const e=.0008,zx=(bodyAtXY(x+e,y)[2]-bodyAtXY(x-e,y)[2])/(2*e);
  const zy=(bodyAtXY(x,y+e)[2]-bodyAtXY(x,y-e)[2])/(2*e);
  return new THREE.Vector3(-zx,-zy,1).normalize();
}
const collarTipDepth=[bodyAtXY(-.674,.755)[2]+.027,bodyAtXY(.674,.755)[2]+.027];

function curveMesh(group,name,points,radius,mat,segments=64) {
  const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(group,name,new THREE.TubeGeometry(c,segments,radius,4,false),mat);
}

function collarPoint(side,u,v) {
  // A short spread collar rolls outward from the neck into a distinct pointed tip.
  // The inner bottom sits higher than the point, producing the diagonal cut edge.
  const topIn=new THREE.Vector3(.307,1.655,.092),topOut=new THREE.Vector3(.520,1.598,-.028);
  const bottomIn=new THREE.Vector3(.105,1.028,.564),bottomOut=new THREE.Vector3(.674,.755,.60);
  bottomOut.z=collarTipDepth[side<0?0:1];
  const inn=topIn.clone().lerp(bottomIn,v),out=topOut.clone().lerp(bottomOut,v);
  inn.x+=.072*Math.sin(v*Math.PI);inn.z-=.023*Math.sin(v*Math.PI);
  out.x+=.135*Math.sin(v*Math.PI);out.y+=.045*Math.sin(v*Math.PI);out.z+=.058*Math.sin(v*Math.PI);
  const p=inn.lerp(out,u);
  // Soft rolled turn, not a planar polygon, with a crisp supported point.
  p.z+=.085*Math.sin(u*Math.PI)*Math.sin(v*Math.PI*.90);
  p.y-=.019*Math.sin(u*Math.PI)*Math.sin(v*Math.PI);
  p.z+=.009*Math.sin(u*Math.PI*1.7)*Math.sin(v*Math.PI);
  p.x*=side;
  if(side<0){p.y+=.025*v;p.z-=.010*v;}
  return [p.x,p.y,p.z];
}

function solidifyGrid(g,nu,nv,depth=.006) {
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,N=p.count;
  const pp=[],nn=[],tt=[],ii=Array.from(g.index.array);
  for(let back=0;back<2;back++)for(let j=0;j<N;j++){
    pp.push(p.getX(j)-back*depth*n.getX(j),p.getY(j)-back*depth*n.getY(j),p.getZ(j)-back*depth*n.getZ(j));
    nn.push(n.getX(j)*(back?-1:1),n.getY(j)*(back?-1:1),n.getZ(j)*(back?-1:1));tt.push(uv.getX(j),uv.getY(j));
  }
  const src=Array.from(g.index.array);for(let j=0;j<src.length;j+=3)ii.push(N+src[j],N+src[j+2],N+src[j+1]);
  const boundary=[];
  for(let i=0;i<=nu;i++)boundary.push(i);
  for(let j=1;j<=nv;j++)boundary.push(j*(nu+1)+nu);
  for(let i=nu-1;i>=0;i--)boundary.push(nv*(nu+1)+i);
  for(let j=nv-1;j>0;j--)boundary.push(j*(nu+1));
  for(let j=0;j<boundary.length;j++){const a=boundary[j],b=boundary[(j+1)%boundary.length];ii.push(a,b,a+N,b,b+N,a+N);}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(nn,3));out.setAttribute('uv',new THREE.Float32BufferAttribute(tt,2));out.setIndex(ii);g.dispose();return out;
}

function addCollar(group,side,cloth,seamMat) {
  const n=side>0?'right':'left';
  const g=surface(22,32,(u,v)=>collarPoint(side,u,v));
  if(side<0){const idx=g.index;for(let i=0;i<idx.count;i+=3){const b=idx.getX(i+1);idx.setX(i+1,idx.getX(i+2));idx.setX(i+2,b);}g.computeVertexNormals();}
  mesh(group,`blouse-${n}-spread-collar`,solidifyGrid(g,22,32),cloth);
  const edge=[];for(let j=0;j<=28;j++){const p=collarPoint(side,.985,j/28);p[2]+=.001;edge.push(p);}
  for(let j=1;j<=20;j++){const p=collarPoint(side,1-j/20,.985);p[2]+=.001;edge.push(p);}
  curveMesh(group,`blouse-${n}-collar-edge`,edge,.0037,seamMat,88);
  const roll=[];for(let j=0;j<=36;j++){const p=collarPoint(side,.12,j/36);p[2]+=.002;roll.push(p);}
  curveMesh(group,`blouse-${n}-collar-fold`,roll,.0045,cloth,64);
}

function batchButtons(group) {
  group.updateMatrixWorld(true);const batches=new Map();
  group.traverse(o=>{
    if(!o.isMesh)return;
    if(!batches.has(o.material))batches.set(o.material,{p:[],n:[],uv:[],idx:[]});
    const b=batches.get(o.material),g=o.geometry.clone().applyMatrix4(o.matrixWorld),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,offset=b.p.length/3;
    for(let i=0;i<p.count;i++){b.p.push(p.getX(i),p.getY(i),p.getZ(i));b.n.push(n.getX(i),n.getY(i),n.getZ(i));b.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0);}
    if(g.index)for(const i of g.index.array)b.idx.push(offset+i);else for(let i=0;i<p.count;i++)b.idx.push(offset+i);
    g.dispose();
  });
  group.clear();
  for(const [material,b]of batches){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.idx);mesh(group,`buttons-batched-${material.name||'thread'}`,g,material);}
}

function addButtons(group,buttonMat,holeMat,threadMat) {
  const allButtons=new THREE.Group();allButtons.name='original-batched-four-hole-pearl-buttons';
  const buttonGeometry=new THREE.CylinderGeometry(.0555,.055,.0145,48,1,false);
  const edgeGeometry=new THREE.TorusGeometry(.0465,.0032,6,40);
  const wellGeometry=new THREE.CircleGeometry(.0063,12);
  const threadGeometry=new THREE.CylinderGeometry(.0018,.0018,.018,5);
  for(let i=0;i<5;i++) {
    const y=i<4?BUTTON_Y[i]:1.104,x=i<4?placketX(y):.180;
    const p=i<4?bodyAtXY(x,y):collarPoint(1,.055,.865);
    const button=new THREE.Group();button.name=`blouse-ivory-four-hole-button-${i+1}`;
    button.position.set(i<4?x:p[0],i<4?y:p[1],p[2]+.027);
    if(i<4)button.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),bodyNormal(x,y));
    else{button.rotation.x=-.26;button.rotation.y=.22;button.scale.setScalar(.91);}
    const disc=mesh(button,'button-pearl-disc',buttonGeometry,buttonMat);disc.rotation.x=Math.PI/2;
    const rim=mesh(button,'button-rounded-rim',edgeGeometry,buttonMat);rim.position.z=.0095;
    for(const sx of[-1,1])for(const sy of[-1,1]) {
      const hole=mesh(button,'recessed-button-hole',wellGeometry,holeMat);hole.position.set(sx*.0125,sy*.0125,.0084);
    }
    for(const sx of[-1,1]){
      const thread=mesh(button,'ivory-button-thread',threadGeometry,threadMat);thread.position.set(sx*.0125,0,.0102);thread.rotation.z=.15;
    }
    allButtons.add(button);
  }
  batchButtons(allButtons);group.add(allButtons);
}

function clothGeometry() {
  const g=surface(128,76,torsoPoint),p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.abs(x);
    const shade=z>0?.022*gauss(a-1.225-.025*y,.085)*gauss(y+.5,.85)+.014*gauss(x-placketX(y)-.09,.026):.009*gauss(x,.07)*gauss(y-.25,.60);
    colors.push(1-shade,1-shade*.96,1-shade*.55);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return g;
}

function addTailoring(group,seamMat,cloth) {
  const neck=[];for(let i=0;i<=128;i++){const p=torsoPoint(i/128,0);neck.push(p);}
  curveMesh(group,'blouse-finished-neckline',neck,.0037,cloth,128);
  const yoke=[];for(let i=0;i<=70;i++){const x=mix(-1.30,1.30,i/70),y=.77+.095*x*x,p=bodyAtXY(x,y,false);p[2]-=.003;yoke.push(p);}
  curveMesh(group,'blouse-back-yoke-seam',yoke,.0021,seamMat,84);
  for(const side of[-1,1]){
    const seam=[];for(let i=0;i<=48;i++){const t=i/48,y=mix(1.08,-.52,t),x=side*(1.285+.125*Math.sin(t*Math.PI*.70)),p=bodyAtXY(x,y);p[2]+=.003;seam.push(p);}
    curveMesh(group,`blouse-sleeve-attachment-${side}`,seam,.0021,seamMat,56);
  }
}

export function createBlouse() {
  const group=new THREE.Group();group.name='original-tailored-white-cotton-blouse';
  const bump=weaveTexture();
  const cloth=new THREE.MeshPhysicalMaterial({name:'blouse-cotton',color:'#e6e7f0',vertexColors:true,roughness:.72,metalness:0,bumpMap:bump,bumpScale:.0021,sheen:.16,sheenRoughness:.82,sheenColor:new THREE.Color('#f4f2ff'),side:THREE.DoubleSide});
  const placketMat=cloth.clone();placketMat.name='blouse-cotton-placket';placketMat.color.set('#efeff5');placketMat.roughness=.73;
  const seamMat=new THREE.MeshStandardMaterial({name:'blouse-ivory-stitching',color:'#e2e4ee',roughness:.87});
  mesh(group,'blouse-continuous-torso-and-sleeves',clothGeometry(),cloth);
  // Closed crop, inset half a millimetre to avoid coplanar shimmer on turntable views.
  const cap=[];for(let i=0;i<96;i++){const a=i/96*TAU;cap.push(new THREE.Vector2(1.49*Math.sin(a),.637*Math.cos(a)*(Math.cos(a)>0?1:.54/.637)));}
  const bottomGeo=new THREE.ShapeGeometry(new THREE.Shape(cap));bottomGeo.rotateX(Math.PI/2);bottomGeo.translate(0,-1.449,0);
  mesh(group,'blouse-finished-bust-base',bottomGeo,cloth);

  addCollar(group,-1,cloth,seamMat);addCollar(group,1,cloth,seamMat);
  addTailoring(group,seamMat,cloth);
  // Raised centre placket shares exactly the body depth and remains closed below the V.
  mesh(group,'blouse-curved-centre-placket',surface(10,74,(u,v)=>{
    const y=mix(.780,-1.45,v),cx=placketX(y),x=cx+(u-.5)*(.174+.014*v),p=bodyAtXY(x,y);
    return [x,y,p[2]+.007+.006*Math.pow(Math.sin(u*Math.PI),.70)];
  }),placketMat);
  for(const side of[-1,1]){
    const line=[];for(let i=0;i<=55;i++){const v=i/55,y=mix(.773,-1.446,v),x=placketX(y)+side*(.077+.007*v),p=bodyAtXY(x,y);line.push([x,y,p[2]+.014]);}
    curveMesh(group,`blouse-placket-seam-${side}`,line,.0017,seamMat,76);
  }
  const hem=[];for(let i=0;i<=128;i++){const p=torsoPoint(i/128,.993);hem.push(p);}
  curveMesh(group,'blouse-bust-crop-hem',hem,.0034,seamMat,128);
  const buttonMat=new THREE.MeshPhysicalMaterial({name:'blouse-ivory-buttons',color:'#e6e0d1',roughness:.34,metalness:0,clearcoat:.18,clearcoatRoughness:.38});
  const holeMat=new THREE.MeshStandardMaterial({name:'button-recesses',color:'#a49b8a',roughness:.8,side:THREE.DoubleSide});
  const threadMat=new THREE.MeshStandardMaterial({name:'button-threads',color:'#e9e5d9',roughness:.9});
  addButtons(group,buttonMat,holeMat,threadMat);
  group.userData.originalGeometry=true;
  group.userData.design='Broad rolled spread collar, cut V neckline, soft cotton gathers, curved placket, sewn yoke/sleeves, four body buttons and open collar button.';
  return group;
}

export function createNeck() {
  const group=new THREE.Group();group.name='original-neck-and-clavicle-transition';
  const material=new THREE.MeshPhysicalMaterial({name:'skin-neck',color:'#ffffff',vertexColors:true,roughness:.53,metalness:0,specularIntensity:.28,sheen:.055,sheenColor:new THREE.Color('#e5b5a5'),sheenRoughness:.82});
  const levels=[
    [.69,.565,.565,.24,.006],
    [.87,.490,.474,.275,-.005],
    [1.08,.415,.369,.292,-.029],
    [1.32,.345,.317,.291,-.059],
    [1.56,.323,.283,.291,-.091],
    [1.81,.353,.258,.316,-.124],
    [2.08,.438,.239,.365,-.154]
  ];
  function at(y,k){
    let j=0;while(j<levels.length-2&&y>levels[j+1][0])j++;
    const b=levels[j],c=levels[j+1],a=levels[Math.max(0,j-1)],d=levels[Math.min(levels.length-1,j+2)];
    const h=clamp((y-b[0])/(c[0]-b[0]),0,1),h2=h*h,h3=h2*h;
    const m0=(c[k]-a[k])/(c[0]-a[0])*(c[0]-b[0]),m1=(d[k]-b[k])/(d[0]-b[0])*(c[0]-b[0]);
    return (2*h3-3*h2+1)*b[k]+(h3-2*h2+h)*m0+(-2*h3+3*h2)*c[k]+(h3-h2)*m1;
  }
  const g=surface(96,48,(u,v)=>{
    const a=u*TAU,y=mix(.69,2.08,v),c=Math.cos(a),s=Math.sin(a);
    let x=at(y,1)*s+at(y,4),z=(c>=0?at(y,2)*Math.pow(c,.90):at(y,3)*c)-.020;
    if(c>0){
      // Paired soft muscle planes fan from below the ears toward the clavicle.
      const axis=.63-.17*smooth(.93,1.8,y),tendon=.014*gauss(Math.abs(s)-axis,.17)*gauss(y-1.29,.48);
      const suprasternal=-.014*gauss(x+.018,.115)*gauss(y-.99,.145);
      const clavicle=.012*gauss(y-(.975-.14*Math.abs(x)),.057)*gauss(x,.55);
      z+=tendon+(suprasternal+clavicle)*c*c;
    }
    return [x,y,z];
  });
  // Neck rings progress upward, opposite to the descending garment rings.
  const index=g.index;
  for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}
  g.computeVertexNormals();
  const positions=g.getAttribute('position'),colors=[],base=new THREE.Color('#dbb0a1'),warm=new THREE.Color('#c49284'),jawShade=new THREE.Color('#b88377');
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),col=base.clone();
    const lateral=.13*gauss(Math.abs(x+.075)-.28,.11)*gauss(y-1.5,.65);
    const underJaw=.115*smooth(1.66,2.04,y)*(z>0?1:.35);
    col.lerp(warm,lateral).lerp(jawShade,underJaw);
    col.offsetHSL(0,0,.0015*Math.sin(x*133+y*215)*Math.sin(x*93-y*173));
    colors.push(col.r,col.g,col.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  mesh(group,'neck-smooth-anatomical-surface',g,material);
  group.userData.originalGeometry=true;return group;
}
