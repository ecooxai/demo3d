import * as THREE from 'three';

// Original procedural tailoring. No imported meshes, photographs or texture assets.
// Bust coordinate system: crown 4.47, chin 1.83, shoulder contour 1.37, crop -1.45.
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a,b,t) => { const q=clamp((t-a)/(b-a),0,1);return q*q*(3-2*q); };

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
  let z=(front?p[1]:p[2])*c;
  const gate=smooth(.14,.40,t)*(1-smooth(.90,1.0,t));
  if(front) {
    const ax=Math.abs(x);
    // Shallow cloth buckling from the shoulder, placket and underarm, never embossed stripes.
    const vertical=.017*Math.sin(x*21+y*2.8)*Math.exp(-Math.pow((ax-.95)/.60,2));
    const diagonal=.025*Math.sin(y*13.5+ax*10)*Math.exp(-Math.pow((ax-1.30)/.24,2));
    const hem=.018*Math.sin(y*15+ax*5)*smooth(.65,.93,t);
    const placketTension=.014*Math.sin(y*15.8-ax*11)*Math.exp(-ax*4.0);
    z+=.70*(vertical+diagonal+hem+placketTension)*gate*Math.pow(c,.45);
    // Long underarm channel defines sleeves in one coherent garment surface.
    z-=.036*Math.exp(-Math.pow((ax-1.22)/.070,2))*smooth(.45,.69,t)*(1-smooth(.96,1,t));
  } else {
    z-=.70*gate*(.009*Math.sin(x*14+y*3)+.012*Math.sin(y*10+x*6));
  }
  y+=.007*Math.sin(a*3.0+.4)*smooth(.50,.85,t)*(1-smooth(.93,1,t));
  return [x,y,z];
}

function frontAtY(y) {
  let lo=0,hi=1;for(let n=0;n<20;n++){const t=(lo+hi)/2;if(profile(t)[3]>y)lo=t;else hi=t;}
  return torsoPoint(0,(lo+hi)/2);
}

function curveMesh(group,name,points,radius,mat,segments=64) {
  const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(group,name,new THREE.TubeGeometry(c,segments,radius,4,false),mat);
}

function collarPoint(side,u,v) {
  // A short spread collar rolls outward from the neck into a distinct pointed tip.
  // The inner bottom sits higher than the point, producing the diagonal cut edge.
  const topIn=new THREE.Vector3(.285,1.565,.130),topOut=new THREE.Vector3(.455,1.545,.050);
  const bottomIn=new THREE.Vector3(.115,1.025,.540),bottomOut=new THREE.Vector3(.565,.740,.690);
  const inn=topIn.clone().lerp(bottomIn,v),out=topOut.clone().lerp(bottomOut,v);
  inn.x+=.083*Math.sin(v*Math.PI);inn.z-=.038*Math.sin(v*Math.PI);
  out.x+=.112*Math.sin(v*Math.PI);out.y+=.030*Math.sin(v*Math.PI);out.z+=.035*Math.sin(v*Math.PI);
  const p=inn.lerp(out,u);
  // Soft rolled turn, not a planar polygon, with a crisp supported point.
  p.z+=.074*Math.sin(u*Math.PI)*Math.sin(v*Math.PI*.88);
  p.y-=.012*Math.sin(u*Math.PI)*Math.sin(v*Math.PI);
  p.x*=side;
  if(side<0){p.y+=.028*v;p.z-=.014*v;}
  return [p.x,p.y,p.z];
}

function addCollar(group,side,cloth,seamMat) {
  const n=side>0?'right':'left';
  const g=surface(24,38,(u,v)=>collarPoint(side,u,v));
  if(side<0){const idx=g.index;for(let i=0;i<idx.count;i+=3){const b=idx.getX(i+1);idx.setX(i+1,idx.getX(i+2));idx.setX(i+2,b);}g.computeVertexNormals();}
  mesh(group,`blouse-${n}-spread-collar`,g,cloth);
  const edge=[];for(let j=0;j<=28;j++){const p=collarPoint(side,.985,j/28);p[2]+=.001;edge.push(p);}
  for(let j=1;j<=20;j++){const p=collarPoint(side,1-j/20,.985);p[2]+=.001;edge.push(p);}
  curveMesh(group,`blouse-${n}-collar-edge`,edge,.0037,seamMat,88);
  const roll=[];for(let j=0;j<=36;j++){const p=collarPoint(side,.12,j/36);p[2]+=.002;roll.push(p);}
  curveMesh(group,`blouse-${n}-collar-fold`,roll,.0045,cloth,64);
}

function addButtons(group,buttonMat,holeMat,threadMat) {
  const buttonGeometry=new THREE.CylinderGeometry(.042,.041,.013,48,1,false);
  const edgeGeometry=new THREE.TorusGeometry(.0345,.0026,5,40);
  const wellGeometry=new THREE.CircleGeometry(.0057,12);
  const threadGeometry=new THREE.CylinderGeometry(.0017,.0017,.016,5);
  for(let i=0;i<4;i++) {
    const y=.480-i*.595,p=frontAtY(y),x=.018+.034*Math.pow((.780-y)/2.230,2);
    const button=new THREE.Group();button.name=`blouse-ivory-four-hole-button-${i+1}`;button.position.set(x,y,p[2]+.037);
    const disc=mesh(button,'button-pearl-disc',buttonGeometry,buttonMat);disc.rotation.x=Math.PI/2;
    const rim=mesh(button,'button-rounded-rim',edgeGeometry,buttonMat);rim.position.z=.009;
    for(const sx of[-1,1])for(const sy of[-1,1]) {
      const hole=mesh(button,'recessed-button-hole',wellGeometry,holeMat);hole.position.set(sx*.0105,sy*.0105,.0083);
    }
    for(const sx of[-1,1]){
      const thread=mesh(button,'ivory-button-thread',threadGeometry,threadMat);thread.position.set(sx*.0105,0,.0098);thread.rotation.z=.15;
    }
    group.add(button);
  }
}

export function createBlouse() {
  const group=new THREE.Group();group.name='original-tailored-white-cotton-blouse';
  const bump=weaveTexture();
  const cloth=new THREE.MeshPhysicalMaterial({name:'blouse-cotton',color:'#eef0f7',roughness:.76,metalness:0,bumpMap:bump,bumpScale:.0019,sheen:.24,sheenRoughness:.85,sheenColor:new THREE.Color('#e4e8f0'),side:THREE.DoubleSide});
  const placketMat=cloth.clone();placketMat.name='blouse-cotton-placket';placketMat.color.set('#f3f3f8');placketMat.roughness=.74;
  const seamMat=new THREE.MeshStandardMaterial({name:'blouse-ivory-stitching',color:'#e2e4ee',roughness:.87});
  mesh(group,'blouse-continuous-torso-and-sleeves',surface(144,88,torsoPoint),cloth);
  // Closed crop, inset half a millimetre to avoid coplanar shimmer on turntable views.
  const cap=[];for(let i=0;i<96;i++){const a=i/96*TAU;cap.push(new THREE.Vector2(1.49*Math.sin(a),.637*Math.cos(a)*(Math.cos(a)>0?1:.54/.637)));}
  const bottomGeo=new THREE.ShapeGeometry(new THREE.Shape(cap));bottomGeo.rotateX(Math.PI/2);bottomGeo.translate(0,-1.449,0);
  mesh(group,'blouse-finished-bust-base',bottomGeo,cloth);

  addCollar(group,-1,cloth,seamMat);addCollar(group,1,cloth,seamMat);
  // Raised centre placket shares exactly the body depth and remains closed below the V.
  mesh(group,'blouse-curved-centre-placket',surface(10,74,(u,v)=>{
    const y=mix(.780,-1.45,v),p=frontAtY(y),cx=.018+.034*v*v;
    return [cx+(u-.5)*.142,y,p[2]+.009+.004*Math.sin(u*Math.PI)];
  }),placketMat);
  for(const side of[-1,1]){
    const line=[];for(let i=0;i<=55;i++){const v=i/55,y=mix(.773,-1.446,v),p=frontAtY(y);line.push([.018+.034*v*v+side*.064,y,p[2]+.013]);}
    curveMesh(group,`blouse-placket-seam-${side}`,line,.0017,seamMat,76);
  }
  const hem=[];for(let i=0;i<=128;i++){const p=torsoPoint(i/128,.993);hem.push(p);}
  curveMesh(group,'blouse-bust-crop-hem',hem,.0034,seamMat,128);
  const buttonMat=new THREE.MeshPhysicalMaterial({name:'blouse-ivory-buttons',color:'#efeadc',roughness:.28,metalness:0,clearcoat:.28,clearcoatRoughness:.32});
  const holeMat=new THREE.MeshStandardMaterial({color:'#99958b',roughness:.8,side:THREE.DoubleSide});
  const threadMat=new THREE.MeshStandardMaterial({color:'#e9e5d9',roughness:.9});
  addButtons(group,buttonMat,holeMat,threadMat);
  group.userData.originalGeometry=true;
  group.userData.design='Short pointed spread collar, raised shoulder contour, woven cotton, curved placket and four original four-hole buttons.';
  return group;
}

export function createNeck() {
  const group=new THREE.Group();group.name='original-neck-and-clavicle-transition';
  const material=new THREE.MeshPhysicalMaterial({name:'skin-neck',color:'#e8bfae',roughness:.49,metalness:0,specularIntensity:.36,clearcoat:.025,clearcoatRoughness:.7});
  const levels=[
    [.70,.49,.575,.20,.008],
    [.82,.47,.507,.265,.004],
    [1.02,.405,.371,.29,-.008],
    [1.22,.352,.305,.29,-.025],
    [1.53,.307,.280,.285,-.057],
    [1.81,.32,.273,.30,-.086],
    [2.08,.375,.265,.33,-.106]
  ];
  function at(y,k){
    let j=0;while(j<levels.length-2&&y>levels[j+1][0])j++;
    const b=levels[j],c=levels[j+1],a=levels[Math.max(0,j-1)],d=levels[Math.min(levels.length-1,j+2)];
    const h=clamp((y-b[0])/(c[0]-b[0]),0,1),h2=h*h,h3=h2*h;
    const m0=(c[k]-a[k])/(c[0]-a[0])*(c[0]-b[0]),m1=(d[k]-b[k])/(d[0]-b[0])*(c[0]-b[0]);
    return (2*h3-3*h2+1)*b[k]+(h3-2*h2+h)*m0+(-2*h3+3*h2)*c[k]+(h3-h2)*m1;
  }
  const g=surface(112,56,(u,v)=>{
    const a=u*TAU,y=mix(.70,2.08,v),c=Math.cos(a),s=Math.sin(a);
    let x=at(y,1)*s+at(y,4),z=(c>=0?at(y,2):at(y,3))*c-.022;
    // Subtle sternocleidomastoid planes, fully continuous with the neck surface.
    if(c>0){const tendon=.010*Math.exp(-Math.pow((Math.abs(s)-.61)/.19,2))*Math.sin(v*Math.PI);z+=tendon;}
    return [x,y,z];
  });
  // Neck rings progress upward, opposite to the descending garment rings.
  const index=g.index;
  for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}
  g.computeVertexNormals();
  mesh(group,'neck-smooth-anatomical-surface',g,material);
  group.userData.originalGeometry=true;return group;
}
