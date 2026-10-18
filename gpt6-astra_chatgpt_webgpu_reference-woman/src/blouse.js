import * as THREE from 'three';

// Candidate98. Additional width belongs only to outer cotton and sleeves;
// the central neckline, collar, placket and buttons keep their coordinates.
const OUTER_WIDTH98=.12;
function outerWidth98(x){
  const a=Math.abs(x),q=Math.max(0,Math.min(1,(a-.84)/.76)),s=q*q*(3-2*q);
  const ds=q>0&&q<1?6*q*(1-q)/.76:0;
  return {x:x*(1+OUTER_WIDTH98*s),jacobian:1+OUTER_WIDTH98*s+OUTER_WIDTH98*a*ds};
}
function inverseOuterWidth98(x){
  if(OUTER_WIDTH98===0)return x;
  let old=x/(1+OUTER_WIDTH98);
  for(let i=0;i<7;i++){const sample=outerWidth98(old);old-=(sample.x-x)/sample.jacobian;}
  return old;
}


// Original procedural tailoring. No imported meshes, photographs or texture assets.
// Bust coordinate system: crown 4.47, chin 1.83, shoulder contour 1.37, crop -1.45.
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;
const smooth = (a,b,t) => { const q=clamp((t-a)/(b-a),0,1);return q*q*(3-2*q); };
const gauss=(v,s)=>Math.exp(-(v*v)/(s*s));
const BUTTON_Y=[.480,-.185,-.850];
// The reference has three widely spaced body buttons and a small rightward
// turn below the V; retain the same centre at both the opening and crop.
const placketX=y=>{const v=clamp((.780-y)/2.230,0,1);return -.022+.027*Math.sin(v*Math.PI)+.190*v*v+.084*smooth(0,.19,v);};
const FOLD_SLOPES=[.17,-.14,-.235],FOLD_LENGTHS=[.26,.33,.24],FOLD_OFFSETS=[-.031,.024,-.019];
const DRAPED_BUTTON_FOLDS=[
  {slope:.08,length:.21,offset:-.018,curve:.020,strength:.40},
  {slope:-.44,length:.39,offset:-.024,curve:.180,strength:1.00},
  {slope:.50,length:.33,offset:.052,curve:-.220,strength:.85}
];
const NECK_LEVELS=[
  [.69,.565,.565,.24,.006],[.87,.490,.474,.275,-.005],
  [1.08,.415,.369,.292,-.029],[1.32,.345,.317,.291,-.059],
  [1.56,.323,.283,.291,-.091],[1.81,.353,.258,.316,-.124],
  [2.08,.438,.239,.365,-.154]
];

function neckSection(y,k){
  let j=0;while(j<NECK_LEVELS.length-2&&y>NECK_LEVELS[j+1][0])j++;
  const b=NECK_LEVELS[j],c=NECK_LEVELS[j+1],a=NECK_LEVELS[Math.max(0,j-1)],d=NECK_LEVELS[Math.min(NECK_LEVELS.length-1,j+2)];
  const h=clamp((y-b[0])/(c[0]-b[0]),0,1),h2=h*h,h3=h2*h;
  const m0=(c[k]-a[k])/(c[0]-a[0])*(c[0]-b[0]),m1=(d[k]-b[k])/(d[0]-b[0])*(c[0]-b[0]);
  let value=(2*h3-3*h2+1)*b[k]+(h3-2*h2+h)*m0+(-2*h3+3*h2)*c[k]+(h3-h2)*m1;
  // Seat the upper ring inside the tilted mandible after the shoulder counter-roll.
  // Blend above the collar only; the shared neck/collar support remains unchanged.
  const seating=smooth(1.70,2.08,y);
  if(k===1)value-=.053*seating;
  if(k===4)value+=.024*seating;
  // The lower neck eases into the clavicles instead of continuing as a straight
  // column. The entire correction ends below the fixed jaw seating and UV span.
  const baseEase=gauss(y-1.02,.28)*(1-smooth(1.31,1.50,y));
  if(k===1)value+=.034*baseEase;
  if(k===2)value-=.009*gauss(y-.90,.20)*(1-smooth(1.25,1.48,y));
  return value;
}

function neckPoint(a,y){
  const c=Math.cos(a),s=Math.sin(a),x=neckSection(y,1)*s+neckSection(y,4);
  let z=(c>=0?neckSection(y,2)*Math.pow(c,1.15):neckSection(y,3)*c)-.020;
  if(c>0){
    const axis=.63-.17*smooth(.93,1.8,y);
    const tendon=.023*gauss(Math.abs(s)-axis,.17)*gauss(y-1.31,.43);
    const suprasternal=-.029*gauss(x+.042,.145)*gauss(y-1.115,.150);
    const clavicleLine=1.182-.17*Math.abs(x+.04);
    const clavicle=.019*gauss(y-clavicleLine,.079)*gauss(x+.04,.46)*(1-.45*gauss(x+.04,.07));
    const neckPlane=-.012*gauss(x+.075,.092)*gauss(y-1.48,.255);
    z+=tendon+(suprasternal+clavicle+neckPlane)*c*c;
  }
  return [x,y,z];
}

function neckFrontZ(x,y){
  if(y<.69||y>2.08)return -Infinity;
  const s=(x-neckSection(y,4))/neckSection(y,1);
  if(Math.abs(s)>=1)return -Infinity;
  return neckPoint(Math.asin(s),y)[2];
}

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
  [.27,1.395,.710,.548,.23,1.34,1.02],
  [.365,1.590,.738,.565,.025,1.08,.73],
  [.49,1.553,.764,.568,-.38,.34,.19],
  [.70,1.449,.722,.529,-.80,-.44,-.54],
  [1,1.365,.614,.486,-1.45,-1.45,-1.45]
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

const secondaryClothGate=y=>smooth(-1.45,-1.27,y)*(1-smooth(.49,.565,y));

function buttonFoldEditWeight(x,y){
  // Retain the sewn placket, collar supports, sleeve wrap and crop exactly.
  // Only the loose front cotton between those fixed regions changes drape.
  return smooth(-1.42,-1.25,y)*(1-smooth(.47,.53,y))
    *(1-smooth(.84,.97,Math.abs(x)))*smooth(.115,.240,Math.abs(x-placketX(y)));
}

function drapedButtonFoldCentre(k,dx){
  const f=DRAPED_BUTTON_FOLDS[k];
  return BUTTON_Y[k]+f.offset+f.slope*dx+f.curve*dx*dx;
}

function secondaryClothRelief(x,y,front=true){
  const gate=secondaryClothGate(y);
  if(gate===0)return 0;
  const ax=Math.abs(x),cx=placketX(y);
  let folds=0;
  if(front){
    // Broad rolls carry the button tension into the loose cotton. The narrower
    // primary creases share these paths, so their shoulders form one fold.
    const side=x>=cx?1:-1,reshape=buttonFoldEditWeight(x,y);
    for(let k=0;k<3;k++){
      const dx=(x-placketX(BUTTON_Y[k]))*side,f=DRAPED_BUTTON_FOLDS[k];
      const centre=BUTTON_Y[k]+FOLD_OFFSETS[k]+FOLD_SLOPES[k]*dx+.045*dx*dx;
      const w=.065+.054*Math.max(0,dx),preferredSide=k===1?-1:1;
      const amplitude=(side===preferredSide?1:.25)*(.037-k*.0025);
      const oldPull=amplitude*gauss(dx-.24,FOLD_LENGTHS[k]+.115)*(gauss(y-centre,w)-.42*gauss(y-centre+.062,w*1.75))*smooth(.045,.15,dx);
      if(reshape===0){folds+=oldPull;continue;}
      const centre2=drapedButtonFoldCentre(k,dx),w2=.031+.150*Math.max(0,dx);
      const amplitude2=(side===preferredSide?1:.11)*(.037-k*.0025)*f.strength;
      const newPull=amplitude2*gauss(dx-.24,f.length+.115)*(gauss(y-centre2,w2)-.42*gauss(y-centre2+.062,w2*1.75))*smooth(.045,.15,dx);
      folds+=mix(oldPull,newPull,reshape);
    }
    // The narrow fold beside the placket turns into a broad hanging billow.
    const closeLine=cx+.144+.027*Math.sin(y*1.65+.4);
    folds+=.053*gauss(y+.29,.89)*(gauss(x-closeLine-.123,.137)-.86*gauss(x-closeLine,.057));
    const hangingLine=cx-.29-.100*smooth(-1.08,.31,y)+.035*Math.sin(y*2.10+.4);
    folds+=.051*gauss(y+.37,.88)*(gauss(x-hangingLine,.155)-.62*gauss(x-hangingLine+.126,.098));
    // One low diagonal gather carries the unequal drape into the cropped waist.
    const lowerPull=y+.99+.35*(x+.13)+.10*(x+.13)*(x+.13);
    folds+=.045*gauss(x+.35,.47)*(gauss(lowerPull,.132)-.43*gauss(lowerPull+.110,.212));
    const sleeveLine=(x<0?1.31:1.38)+(x<0?.095:.14)*(y+.33);
    folds+=.033*gauss(y+(x<0?.50:.28),.74)*(gauss(ax-sleeveLine,.125)-.53*gauss(ax-sleeveLine+.112,.078));
  }else{
    // Unequal loose folds on the back stay broad under the hanging hair.
    const a=x-.44-.038*y,b=x+.58+.025*y;
    folds+=.032*gauss(y+.39,.86)*(gauss(a,.165)-.52*gauss(a+.135,.107));
    folds+=.027*gauss(y+.62,.76)*(gauss(b,.185)-.46*gauss(b-.16,.12));
    const sleeveLine=1.27+.07*(y+.4);
    folds+=.025*gauss(y+.39,.78)*(gauss(ax-sleeveLine,.16)-.46*gauss(ax-sleeveLine+.13,.105));
  }
  // Bounded broad relief keeps the established silhouette and dies out before
  // the collar and the closed lower crop. No random wrinkle field is added.
  const bound=folds>=0?.053:.060;
  return gate*bound*Math.tanh(folds/bound);
}

function shoulderClothRelief(x,y,front=true){
  const ax=Math.abs(x),outer=smooth(.98,1.14,ax)*(1-smooth(1.53,1.67,ax));
  if(outer===0)return 0;
  const crop=smooth(-1.40,-1.12,y),left=x<0;
  // Unequal diagonal compressions turn from the shoulder seam onto the sleeve.
  // Their broad rolls carry the cloth's weight; the lower trough is shorter.
  const first=y-(left?1.08:1.015)+(left?.92:1.05)*(ax-1.24);
  const second=y-(left?.61:.53)+(left?.76:.94)*(ax-1.33);
  let folds=.076*gauss(ax-1.34,.31)*(gauss(first,.142)-.68*gauss(first+.132,.093));
  folds+=(left?.044:.035)*gauss(ax-1.43,.25)*(gauss(second,.134)-.57*gauss(second+.112,.079));
  if(!front)folds*=.60;
  return outer*crop*.072*Math.tanh(folds/.072);
}

function sleeveWarpX(x,y){
  // A depth-only fold vanishes at the sleeve's side. This small transverse
  // component wraps the same compression around it, clear of collar supports.
  return x+Math.sign(x)*.55*shoulderClothRelief(x,y,true);
}

function sleeveSourceX(x,y){
  if(Math.abs(x)<=.98||Math.abs(x)>=1.72||y<=-1.40)return x;
  // Invert the bounded monotone warp before looking up the authored body.
  // Sleeve seams and their normals therefore use the deformed cloth itself.
  let source=x;
  for(let i=0;i<4;i++){
    const e=.0001,d=(sleeveWarpX(source+e,y)-sleeveWarpX(source-e,y))/(2*e);
    source-=(sleeveWarpX(source,y)-x)/d;
  }
  return source;
}

function fabricRelief(x,y) {
  const ax=Math.abs(x),side=x>=placketX(y)?1:-1,reshape=buttonFoldEditWeight(x,y);
  let folds=0;
  for(let k=0;k<3;k++){
    const dx=(x-placketX(BUTTON_Y[k]))*side,f=DRAPED_BUTTON_FOLDS[k];
    const centre=BUTTON_Y[k]+FOLD_OFFSETS[k]+FOLD_SLOPES[k]*dx+.045*dx*dx;
    const dist=y-centre,w=.028+.034*Math.max(0,dx);
    const preferredSide=k===1?-1:1,amplitude=(side===preferredSide?1:.35)*(.022-k*.0015);
    const oldPull=amplitude*gauss(dx-.18,FOLD_LENGTHS[k])*(gauss(dist,w)-.30*gauss(dist,w*2.50))*smooth(.045,.14,dx);
    if(reshape===0){folds+=oldPull;continue;}
    const dist2=y-drapedButtonFoldCentre(k,dx),w2=.018+.080*Math.max(0,dx);
    const amplitude2=(side===preferredSide?1:.12)*(.022-k*.0015)*f.strength;
    const newPull=amplitude2*gauss(dx-.21,f.length)*(gauss(dist2,w2)-.30*gauss(dist2+.034,w2*1.80))*smooth(.045,.14,dx);
    // Blend complete height fields, not their path parameters: the taper stays
    // smooth while turning away from the unchanged sewn center strip.
    folds+=mix(oldPull,newPull,reshape);
  }
  const lineA=(x<0?.81:.87)+.045*Math.sin(y*2.1+(x<0?.6:1.7)),lineB=(x<0?1.15:1.22)-.070*y;
  folds+=(x<0?.019:.013)*(gauss(ax-lineA,.079)-.36*gauss(ax-lineA-.065,.118))*smooth(-1.45,-.8,y)*(1-smooth(.35,.9,y));
  folds+=(x<0?.021:.027)*(gauss(ax-lineB,.086)-.34*gauss(ax-lineB-.07,.125))*gauss(y+(x<0?.61:.31),.73);
  const shoulderD=y-(x<0?1.04:.945)+(x<0?.31:.44)*(ax-1.25);
  folds+=(x<0?.026:.032)*gauss(ax-1.34,.26)*(gauss(shoulderD,.072)-.34*gauss(shoulderD,.144));
  // A broad sleeve fold remains legible around the outside of the hair silhouette.
  const sleeveLine=(x<0?1.43:1.48)+(x<0?.10:.16)*(y+.4);
  folds+=.023*gauss(y+(x<0?.55:.24),.68)*(gauss(ax-sleeveLine,.083)-.34*gauss(ax-sleeveLine-.08,.14));
  // Unequal diagonal gathers descend from the underarm and ease toward the waist.
  const underarmD=y-.10+.57*(x+.68);
  folds+=.026*gauss(x+.84,.41)*(gauss(underarmD,.073)-.29*gauss(underarmD-.085,.14));
  const waistD=y+.98+.33*(x+.13);
  folds+=.029*gauss(x+.49,.45)*(gauss(waistD,.091)-.31*gauss(waistD-.094,.17));
  // One shallow compression leaves room for unbroken cloth below the collar.
  const collarD=y-.57+.49*(x+.40);
  folds+=.014*gauss(x+.44,.22)*(gauss(collarD,.054)-.31*gauss(collarD-.065,.103));
  return folds+secondaryClothRelief(x,y,true)+shoulderClothRelief(x,y,true);
}

function clothFoldOcclusion(x,y,front=true){
  const height=(a,b)=>front?fabricRelief(a,b):secondaryClothRelief(a,b,false)+shoulderClothRelief(a,b,false);
  const h=height(x,y),e=.082,l=height(x-e,y),r=height(x+e,y),u=height(x,y+e),d=height(x,y-e);
  // Occlusion is positive only where neighboring cotton rises around a hollow.
  // It is independent of the viewing direction and leaves exposed crests bright.
  const hollow=Math.max(0,(l+r+u+d)*.25-h),wall=Math.max(0,Math.max(l,r,u,d)-h);
  return clamp(hollow*2.8+wall*1.65,0,.19);
}

function roundedShoulderWeight(c){
  const join=.62;
  if(c>=join)return Math.pow(c,1.32);
  // An even polynomial has finite curvature at the crest and matches the
  // surrounding section's value, slope and curvature at the join.
  const q=c/join,q2=q*q;
  return Math.pow(join,1.32)*q2*(1.5678-.7956*q2+.2278*q2*q2);
}

function torsoPoint(u,t) {
  const a=u*TAU,s=Math.sin(a),c=Math.cos(a),p=profile(t);
  const x=p[0]*s;
  const front=c>=0,co=Math.abs(c),endY=front?p[3]:p[5];
  const shoulder=smooth(.06,.19,t)*(1-smooth(.47,.68,t));
  const roundedEnd=mix((p[3]+p[5])*.5,endY,smooth(0,.62,co));
  const roundedY=mix(p[4],roundedEnd,roundedShoulderWeight(co));
  let y=mix(mix(p[4],endY,Math.pow(co,1.32)),roundedY,shoulder);
  // Cut a real V in the front pattern, with gently eased edges at the shirt body.
  if(front){
    const q=Math.abs(s),opening=q*(.28+.72*Math.pow(q,.38));
    const vY=p[3]+(p[4]-p[3])*opening;
    y=mix(y,vY,1-smooth(.035,.265,t));
  }
  // Ease the upper corner down to the collar roll on both sides of the seam.
  // A sharp top corner used to remain visible as a white tooth at the neck.
  y-=.026*smooth(.67,.95,Math.abs(s))*(1-smooth(.03,.18,t));
  y-=.022*shoulder*Math.pow(1-smooth(0,.62,co),2);
  y+=.042*s*Math.sin(Math.PI*t)*(1-smooth(.62,1,t));
  let z=(front?p[1]:p[2])*c;
  const gate=smooth(.12,.35,t)*(1-smooth(.94,1.0,t));
  if(front) {
    const ax=Math.abs(x);
    // Soft draped volume between the chest and waist, with generous unwrinkled areas.
    z+=.078*gauss(ax-.51,.45)*gauss(y+.20,.62)*c;
    z+=.017*gauss(ax-.74,.48)*gauss(y+1.12,.36)*c;
    z+=fabricRelief(x,y)*gate*c;
    // Hanging sleeves turn away from the chest plane after the shoulder seam.
    z-=.105*c*smooth(1.11,1.47,ax)*gauss(y-.26,.91);
    // The sleeve attachment is a soft inset instead of a periodic ribbed surface.
    const armSeam=1.205+.062*y;
    z-=.063*gauss(ax-armSeam,.102)*smooth(.39,.61,t)*(1-smooth(.96,1,t))*c;
  } else {
    const backFold=.021*gauss(x-.46-.025*y,.098)-.014*gauss(x+.57+.04*y,.118);
    z-=gate*(backFold+.014*gauss(x,.062)*gauss(y-.23,.66)+(secondaryClothRelief(x,y,false)+shoulderClothRelief(x,y,false))*Math.abs(c));
    z+=.060*Math.abs(c)*smooth(1.13,1.48,Math.abs(x))*gauss(y-.20,.91);
  }
  y+=.007*Math.sin(a*3.0+.4)*smooth(.50,.85,t)*(1-smooth(.93,1,t));
  return [sleeveWarpX(x,y),y,z];
}

function frontAtY(y) {
  return bodyAtXY(0,y,true);
}

function bodyAtXY(x,y,front=true) {
  const sourceX=sleeveSourceX(x,y);
  let lo=0,hi=1;
  for(let n=0;n<22;n++){
    const t=(lo+hi)/2,p=profile(t),a=Math.asin(clamp(sourceX/p[0],-1,1));
    const point=torsoPoint((front?a:Math.PI-a)/TAU,t);
    if(point[1]>y)lo=t;else hi=t;
  }
  const t=(lo+hi)/2,a=Math.asin(clamp(sourceX/profile(t)[0],-1,1));
  return torsoPoint((front?a:Math.PI-a)/TAU,t);
}

function bodyNormal(x,y) {
  const e=.0008,zx=(bodyAtXY(x+e,y)[2]-bodyAtXY(x-e,y)[2])/(2*e);
  const zy=(bodyAtXY(x,y+e)[2]-bodyAtXY(x,y-e)[2])/(2*e);
  return new THREE.Vector3(-zx,-zy,1).normalize();
}

function contactBroadening(x){
  const a=Math.abs(x),q=clamp((a-.20)/.75,0,1),s=q*q*(3-2*q);
  const ds=q>0&&q<1?6*q*(1-q)/.75:0,scale=1+.13*s;
  return {x:x*scale,jacobian:scale+.13*a*ds};
}

function contactSourceX(x){
  let source=x/1.13;
  for(let i=0;i<4;i++){
    const b=contactBroadening(source);
    source-=(b.x-x)/b.jacobian;
  }
  return source;
}

function contactSurfacePoint(x,y){
  // Broad bounds only reject impossible inputs; the residual below checks the
  // actual folded shoulder/opening instead of extending its clamped boundary.
  if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1.90||y< -1.45||y>1.75)return null;
  const sourceX=contactSourceX(x),p=bodyAtXY(sourceX,y,true);
  const px=contactBroadening(p[0]).x,residual=Math.hypot(px-x,p[1]-y);
  if(!Number.isFinite(p[2])||!Number.isFinite(residual)||residual>.001)return null;
  return {x:px,y:p[1],z:p[2],sourceX,residual};
}

/**
 * Sample the front torso/sleeves in final blouse-local coordinates, after the
 * sleeve warp and shoulder broadening. This is a pure source-surface query;
 * it creates no mesh or texture and applies no Object3D/world transformation.
 * The separate collar, facing, placket, buttons and seams are not included.
 *
 * Returns null outside support or when normal.z <= .35. Otherwise returns
 * {point: Vector3, normal: Vector3, edgeWeight: number, xyResidual: number}.
 * edgeWeight fades over .045 local units at open edges and normal.z .35-.65;
 * a valid sample may have zero weight. Callers should blend attraction by it.
 */
function sampleBlouseFrontAtXYBase98(x,y){
  const p=contactSurfacePoint(x,y);
  if(!p)return null;
  const normal=bodyNormal(p.sourceX,y);
  normal.x/=contactBroadening(p.sourceX).jacobian;
  normal.normalize();
  if(!Number.isFinite(normal.x)||!Number.isFinite(normal.y)||!Number.isFinite(normal.z)||normal.z<=.35)return null;
  const radius=.045;
  let edgeDistance=radius;
  for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
    if(contactSurfacePoint(x+dx*radius,y+dy*radius))continue;
    // Refine only near a missing neighbor. No mesh, global sampling grid or
    // mutable cache is needed, and arbitrary shoulder heights stay supported.
    let lo=0,hi=radius;
    for(let i=0;i<8;i++){
      const distance=(lo+hi)*.5;
      if(contactSurfacePoint(x+dx*distance,y+dy*distance))lo=distance;else hi=distance;
    }
    edgeDistance=Math.min(edgeDistance,lo);
  }
  const edgeWeight=smooth(.002,radius,edgeDistance)*smooth(.35,.65,normal.z);
  return {point:new THREE.Vector3(p.x,p.y,p.z),normal,edgeWeight,xyResidual:p.residual};
}

const collarTipDepth=[bodyAtXY(-.713,.583)[2]+.022,bodyAtXY(.713,.623)[2]+.022];

function curveMesh(group,name,points,radius,mat,segments=64) {
  const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return mesh(group,name,new THREE.TubeGeometry(c,segments,radius,4,false),mat);
}

function supportedDepth(x,y,z,clearance){
  const roundedLift=d=>.5*(d+Math.sqrt(d*d+.003*.003));
  const skin=neckFrontZ(x,y);
  if(Number.isFinite(skin))z+=roundedLift(skin+clearance-z);
  const shirt=bodyAtXY(x,y),distance=Math.hypot(shirt[0]-x,shirt[1]-y);
  // A hard inside/outside test created one-row steps where the collar crossed
  // the shirt opening. Taper contact continuously through that narrow region.
  const contact=1-smooth(.003,.055,distance);
  return z+contact*roundedLift(shirt[2]+clearance-z);
}

function collarPoint(side,u,v) {
  // The folded leaf ends above the opening on its inside and lower on its outside.
  // A separate facing follows the V, so no broad horizontal join crosses the chest.
  const topIn=new THREE.Vector3(.315,1.625,.072),topOut=new THREE.Vector3(.485,1.596,-.055);
  const bottomIn=new THREE.Vector3(.258,1.155,.602),bottomOut=new THREE.Vector3(.713,.605,.60);
  bottomOut.z=collarTipDepth[side<0?0:1];
  const inn=topIn.clone().lerp(bottomIn,v),out=topOut.clone().lerp(bottomOut,v);
  inn.x+=.025*Math.sin(v*Math.PI);inn.y-=.012*Math.sin(v*Math.PI);inn.z+=.040*Math.sin(v*Math.PI);
  out.x+=.085*Math.sin(v*Math.PI);out.y+=.130*Math.sin(v*Math.PI);out.z+=.024*Math.sin(v*Math.PI);
  const p=inn.lerp(out,u);
  // Turn the upper collar outward instead of leaving a squared upright wall.
  // This roll fades above the existing free edge and opening connection.
  const upperRoll=1-smooth(0,.38,v);
  p.x+=.035*u*upperRoll;
  p.y-=.105*(.65+.35*u)*upperRoll;
  p.y+=.015*Math.sin(u*Math.PI)*upperRoll;
  p.z+=(.13*(.30+.70*u)+.026*Math.sin(u*Math.PI))*upperRoll;
  p.y+=.045*Math.sin(u*Math.PI)*smooth(.45,1,v);
  p.z+=.055*Math.sin(u*Math.PI)*Math.sin(v*Math.PI*.92);
  p.z+=.010*Math.sin(u*Math.PI*1.65)*Math.sin(v*Math.PI);
  p.z+=(side<0?.014:-.009)*Math.sin(u*Math.PI)*gauss(v-.72,.22);
  // The free leaf hangs from its upper roll with a broad, unequal bend. Its
  // neckline edge and upper attachment stay fixed while the outer tip relaxes.
  const freeLeaf=smooth(.20,.52,v)*smooth(.08,.27,u);
  const bend=collarLeafBend(side,u,v);
  p.y-=(side<0?.030:.022)*freeLeaf*(.28+.72*u)*smooth(.35,1,v);
  p.z+=bend;
  p.x*=side;
  p.y+=(side<0?-.022:.018)*v;
  if(side<0)p.z-=.008*v;
  // The collar is a separate folded layer. Test its entire surface against both
  // the shirt and the tilted neck instead of supporting only its pointed tip.
  const arch=Math.sin(v*Math.PI);
  const clearance=.015+.064*arch*(.35+.65*u)+.066*Math.pow(1-u,1.40)*smooth(.50,1,v)+.015*Math.sin(u*Math.PI)*smooth(.30,1,v);
  p.z=supportedDepth(p.x,p.y,p.z,clearance);
  return [p.x,p.y,p.z];
}

function collarLeafBend(side,u,v){
  const free=smooth(.20,.52,v)*smooth(.08,.27,u);
  const rollLine=.54+(side<0?.085:-.055)*(v-.56);
  const across=u-rollLine;
  // One soft roll rises beside a shallow trough; no embossed crease or edge tint.
  return free*Math.sin(v*Math.PI)*((side<0?.055:.047)*gauss(across-.13,.22)-.029*gauss(across+.065,.14));
}

function collarLeafOcclusion(side,u,v){
  const h=collarLeafBend(side,u,v),e=.07;
  const l=collarLeafBend(side,Math.max(0,u-e),v),r=collarLeafBend(side,Math.min(1,u+e),v);
  return clamp(Math.max(0,(l+r)*.5-h)*4.5,0,.085);
}

function facingPoint(side,u,v){
  const upperTurn=1-smooth(0,.25,v),edge=torsoPoint(side*(1-v)*.25,0);
  const x=edge[0]+side*u*(.062+.010*v-.012*upperTurn)+placketX(.780)*Math.pow(v,4);
  const y=edge[1]-.014*u*Math.sin(v*Math.PI)-(.012+.038*u)*upperTurn;
  const z=supportedDepth(x,y,edge[2],.008);
  return [x,y,z+.003*Math.sin(u*Math.PI)+.016*u*Math.sin(v*Math.PI)+.012*u*upperTurn];
}

function facingNormal(side,u,v){
  const e=.0007,a=facingPoint(side,u-e,v),b=facingPoint(side,u+e,v),c=facingPoint(side,u,v-e),d=facingPoint(side,u,v+e);
  const du=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),dv=new THREE.Vector3(d[0]-c[0],d[1]-c[1],d[2]-c[2]);
  const normal=new THREE.Vector3().crossVectors(dv,du).normalize();
  if(normal.z<0)normal.negate();return normal;
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
  const nu=24,nv=48,g=surface(nu,nv,(u,v)=>collarPoint(side,u,v));
  if(side<0){const idx=g.index;for(let i=0;i<idx.count;i+=3){const b=idx.getX(i+1);idx.setX(i+1,idx.getX(i+2));idx.setX(i+2,b);}g.computeVertexNormals();}
  const solid=solidifyGrid(g,nu,nv,.0045),colors=[],uv=solid.getAttribute('uv'),half=solid.getAttribute('position').count/2;
  for(let i=0;i<uv.count;i++){
    const u=uv.getX(i),v=uv.getY(i);
    const shade=.075*gauss(u-.075,.23)*(.38+.62*Math.sin(v*Math.PI))+.022*smooth(.73,1,v)+collarLeafOcclusion(side,u,v)+(i>=half?.125:0);
    colors.push(1-shade,1-shade*.98,1-shade*.78);
  }
  solid.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  mesh(group,`blouse-${n}-spread-collar`,solid,cloth);
  const edge=[];for(let j=0;j<=28;j++){const p=collarPoint(side,.985,j/28);p[2]+=.001;edge.push(p);}
  for(let j=1;j<=20;j++){const p=collarPoint(side,1-j/20,.985);p[2]+=.001;edge.push(p);}
  curveMesh(group,`blouse-${n}-collar-edge`,edge,.0026,seamMat,96);
  const roll=[];for(let j=0;j<=48;j++){const p=collarPoint(side,.12,mix(.035,.965,j/48));p[2]+=.001;roll.push(p);}
  curveMesh(group,`blouse-${n}-collar-fold`,roll,.0016,cloth,80);
}

function addFacing(group,side,cloth,seamMat){
  const n=side>0?'right':'left',g=surface(8,48,(u,v)=>facingPoint(side,u,v));
  if(side<0){const idx=g.index;for(let i=0;i<idx.count;i+=3){const b=idx.getX(i+1);idx.setX(i+1,idx.getX(i+2));idx.setX(i+2,b);}g.computeVertexNormals();}
  const uv=g.getAttribute('uv'),colors=[];
  for(let i=0;i<uv.count;i++){
    const u=uv.getX(i),v=uv.getY(i),shade=.045*Math.sin(v*Math.PI)*(.3+.7*u);
    colors.push(1-shade,1-shade*.985,1-shade*.80);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  mesh(group,`blouse-${n}-neck-opening-facing`,g,cloth);
  const seam=[];for(let j=0;j<=36;j++){const p=facingPoint(side,.90,mix(.10,1,j/36));p[2]+=.0018;seam.push(p);}
  curveMesh(group,`blouse-${n}-facing-stitch`,seam,.0014,seamMat,48);
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
  const bodyCount=BUTTON_Y.length;
  // A shallow dish and a rounded annular lip catch light as one continuous shell.
  const pearlProfile=[[0,-.0065],[.044,-.0065],[.055,-.0056],[.0595,-.0036],[.0615,-.0004],[.062,.0030],[.0606,.0065],[.0577,.0088],[.054,.0095],[.0505,.0087],[.0475,.0067],[.044,.0043],[.040,.0035],[0,.0035]];
  const buttonGeometry=new THREE.LatheGeometry(pearlProfile.map(p=>new THREE.Vector2(...p)),64);
  const collarButtonGeometry=new THREE.CylinderGeometry(.0555,.055,.0145,48,1,false);
  const collarEdgeGeometry=new THREE.TorusGeometry(.0465,.0032,6,40);
  const wellGeometry=new THREE.CircleGeometry(.0066,14);
  const threadGeometry=new THREE.CylinderGeometry(.00165,.00165,.022,6);
  for(let i=0;i<bodyCount+1;i++) {
    const isBody=i<bodyCount;
    const y=isBody?BUTTON_Y[i]:1.104,x=isBody?placketX(y):.180;
    const p=isBody?bodyAtXY(x,y):facingPoint(1,.68,.735);
    const button=new THREE.Group();button.name=`blouse-ivory-four-hole-button-${i+1}`;
    button.position.set(isBody?x:p[0],isBody?y:p[1],p[2]+.027);
    if(isBody)button.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),bodyNormal(x,y));
    else{button.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),facingNormal(1,.68,.735));button.scale.setScalar(.91);}
    if(isBody)button.rotateZ([.13,-.07,.09][i%3]);
    const disc=mesh(button,'button-pearl-disc',isBody?buttonGeometry:collarButtonGeometry,buttonMat);disc.rotation.x=Math.PI/2;
    if(!isBody){const rim=mesh(button,'button-rounded-rim',collarEdgeGeometry,buttonMat);rim.position.z=.0095;}
    for(const sx of[-1,1])for(const sy of[-1,1]) {
      const hole=mesh(button,'recessed-button-hole',wellGeometry,holeMat);hole.position.set(sx*.0132,sy*.0132,isBody?.0041:.0084);
    }
    for(const sx of[-1,1]){
      const thread=mesh(button,'ivory-button-thread',threadGeometry,threadMat);thread.position.set(sx*.0132,0,isBody?.0061:.0102);thread.rotation.z=.15;
    }
    allButtons.add(button);
  }
  batchButtons(allButtons);group.add(allButtons);
}

function clothGeometry() {
  const nu=192,nv=112,g=surface(nu,nv,torsoPoint),p=g.attributes.position,n=g.attributes.normal,colors=[];
  // Surface tangents prevent triangle-sized normal changes on the shoulder
  // and keep the wrapped centre seam continuous at both copies of the UV boundary.
  const e=.00013;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const u=i/nu,t=j/nv,ua=(u-e+1)%1,ub=(u+e)%1,ta=Math.max(0,t-e),tb=Math.min(1,t+e);
    const a=torsoPoint(ua,t),b=torsoPoint(ub,t),c=torsoPoint(u,ta),d=torsoPoint(u,tb);
    const du=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),dv=new THREE.Vector3(d[0]-c[0],d[1]-c[1],d[2]-c[2]);
    const normal=new THREE.Vector3().crossVectors(dv,du).normalize();n.setXYZ(j*(nu+1)+i,normal.x,normal.y,normal.z);
  }
  for(let i=0;i<p.count;i++){
    const y=p.getY(i),x=sleeveSourceX(p.getX(i),y),z=p.getZ(i),a=Math.abs(x);
    let shade=0;
    if(z>0){
      const fold=fabricRelief(x,y);
      const leafU=clamp((a-.258)/.455,0,1),leafEdge=mix(1.155,.605,leafU)+.045*Math.sin(leafU*Math.PI)+(x<0?-.022:.018);
      const beneathCollar=.17*gauss(y-(leafEdge-.040),.064)*smooth(.20,.275,a)*(1-smooth(.67,.78,a));
      const seamShade=.080*gauss(a-1.205-.062*y,.112)*gauss(y+.5,.91)+.082*gauss(x-placketX(y)-.103,.041);
      // Ambient attenuation follows the same rounded folds as the real geometry;
      // directional highlights and shadows remain the renderer's responsibility.
      shade=beneathCollar+seamShade+Math.max(0,-fold)*2.7+clothFoldOcclusion(x,y,true);
    }else{
      shade=.035*gauss(x,.083)*gauss(y-.25,.67)+.055*gauss(x+.57+.04*y,.080)*gauss(y+.15,.80);
      shade+=.032*gauss(y-(.77+.095*x*x),.035);
      shade+=Math.max(0,-secondaryClothRelief(x,y,false))*2.2+clothFoldOcclusion(x,y,false)*.78;
    }
    colors.push(clamp(1-shade,.62,1),clamp(1-shade*.985,.64,1),clamp(1-shade*.80,.70,1));
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

function broadenShoulders(group) {
  group.traverse(o=>{
    if(!o.isMesh)return;
    const g=o.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),a=Math.abs(x),q=clamp((a-.20)/.75,0,1),s=q*q*(3-2*q);
      const ds=(q>0&&q<1)?6*q*(1-q)/.75:0,scale=1+.13*s,jacobian=scale+.13*a*ds;
      const outer=outerWidth98(x*scale);
      p.setX(i,outer.x);
      const normal=new THREE.Vector3(n.getX(i)/(jacobian*outer.jacobian),n.getY(i),n.getZ(i)).normalize();n.setXYZ(i,normal.x,normal.y,normal.z);
    }
    p.needsUpdate=true;n.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
  });
}

export function createBlouse() {
  const group=new THREE.Group();group.name='original-tailored-white-cotton-blouse';
  const bump=weaveTexture();
  const cloth=new THREE.MeshPhysicalMaterial({name:'blouse-cotton',color:'#d6d9e3',vertexColors:true,roughness:.77,metalness:0,bumpMap:bump,bumpScale:.0021,sheen:.105,sheenRoughness:.87,sheenColor:new THREE.Color('#eff0f7'),side:THREE.DoubleSide});
  const collarMat=cloth.clone();collarMat.name='blouse-collar-poplin';collarMat.color.set('#e2e4eb');collarMat.roughness=.73;
  const placketMat=cloth.clone();placketMat.name='blouse-cotton-placket';placketMat.color.set('#e5e6ed');placketMat.roughness=.75;
  const seamMat=new THREE.MeshStandardMaterial({name:'blouse-ivory-stitching',color:'#cdd1dd',roughness:.87});
  // Calibrated in the assembled soft-light portrait: lift linear cotton albedo
  // while retaining the modeled relief and per-vertex ambient variation.
  for(const fabric of[cloth,collarMat,placketMat,seamMat])fabric.color.multiplyScalar(1.28);
  mesh(group,'blouse-continuous-torso-and-sleeves',clothGeometry(),cloth);
  // Closed crop, inset half a millimetre to avoid coplanar shimmer on turntable views.
  const cap=[];for(let i=0;i<96;i++){const p=torsoPoint(i/96,1);cap.push(new THREE.Vector2(p[0],p[2]));}
  const bottomGeo=new THREE.ShapeGeometry(new THREE.Shape(cap));bottomGeo.rotateX(Math.PI/2);bottomGeo.translate(0,-1.449,0);
  mesh(group,'blouse-finished-bust-base',bottomGeo,cloth);

  addFacing(group,-1,placketMat,seamMat);addFacing(group,1,placketMat,seamMat);
  addCollar(group,-1,collarMat,seamMat);addCollar(group,1,collarMat,seamMat);
  addTailoring(group,seamMat,cloth);
  // Raised centre placket shares exactly the body depth and remains closed below the V.
  mesh(group,'blouse-curved-centre-placket',solidifyGrid(surface(10,74,(u,v)=>{
    const y=mix(.780,-1.45,v),cx=placketX(y),x=cx+(u-.5)*(.174+.014*v),p=bodyAtXY(x,y);
    return [x,y,p[2]+.007+.006*Math.pow(Math.sin(u*Math.PI),.70)];
  }),10,74,.0045),placketMat);
  for(const side of[-1,1]){
    const line=[];for(let i=0;i<=55;i++){const v=i/55,y=mix(.773,-1.446,v),x=placketX(y)+side*(.077+.007*v),p=bodyAtXY(x,y);line.push([x,y,p[2]+.014]);}
    curveMesh(group,`blouse-placket-seam-${side}`,line,.0017,seamMat,76);
  }
  const hem=[];for(let i=0;i<=128;i++){const p=torsoPoint(i/128,.993);hem.push(p);}
  curveMesh(group,'blouse-bust-crop-hem',hem,.0034,seamMat,128);
  const buttonMat=new THREE.MeshPhysicalMaterial({name:'blouse-ivory-buttons',color:'#eee8dc',roughness:.31,metalness:0,clearcoat:.24,clearcoatRoughness:.30});
  const holeMat=new THREE.MeshStandardMaterial({name:'button-recesses',color:'#a49b8a',roughness:.8,side:THREE.DoubleSide});
  const threadMat=new THREE.MeshStandardMaterial({name:'button-threads',color:'#e9e5d9',roughness:.9});
  addButtons(group,buttonMat,holeMat,threadMat);
  // Widen the outer garment by 13%, easing to less than 2% at the neck opening.
  // Geometry, normals, seams and buttons all receive the same continuous transform.
  broadenShoulders(group);
  group.userData.originalGeometry=true;
  group.userData.design='Cotton blouse with sloping shoulders, a tapered waist and hanging sleeve planes; soft unequal collar leaves above a fixed open V facing; sparse tapered diagonal button folds that relax into the loose front cotton, with fixed shoulder compressions around the sleeves; sewn yoke/sleeves, a thin closed curved placket, three body buttons and an open facing button.';
  return group;
}

export function createNeck() {
  const group=new THREE.Group();group.name='original-neck-and-clavicle-transition';
  const material=new THREE.MeshPhysicalMaterial({name:'skin-neck',color:'#ffffff',vertexColors:true,roughness:.55,metalness:0,specularIntensity:.265,sheen:.050,sheenColor:new THREE.Color('#e5b5a5'),sheenRoughness:.84});
  const g=surface(80,44,(u,v)=>neckPoint(u*TAU,mix(.69,2.08,v)));
  // Neck rings progress upward, opposite to the descending garment rings.
  const index=g.index;
  for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}
  g.computeVertexNormals();
  const positions=g.getAttribute('position'),colors=[],base=new THREE.Color('#dbb0a1'),warm=new THREE.Color('#c49284'),jawShade=new THREE.Color('#b88377');
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),col=base.clone();
    const lateral=.13*gauss(Math.abs(x+.075)-.28,.11)*gauss(y-1.5,.65);
    const underJaw=.115*smooth(1.66,2.04,y)*(z>0?1:.35);
    const hollow=.105*gauss(x+.042,.122)*gauss(y-1.115,.130)*(z>0?1:0);
    const muscleValley=.055*gauss(x+.16,.091)*gauss(y-1.45,.29)*(z>0?1:0);
    const sideWrap=.075*smooth(-.10,.18,x)*gauss(y-1.45,.75)*(z>0?1:0);
    col.lerp(warm,lateral+hollow+muscleValley+sideWrap).lerp(jawShade,underJaw);
    const clavicleLight=.009*gauss(y-(1.182-.17*Math.abs(x+.04)),.060)*gauss(x+.04,.40)*(z>0?1:0);
    col.offsetHSL(0,0,clavicleLight);
    col.offsetHSL(0,0,.0015*Math.sin(x*133+y*215)*Math.sin(x*93-y*173));
    colors.push(col.r,col.g,col.b);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  mesh(group,'neck-smooth-anatomical-surface',g,material);
  group.userData.originalGeometry=true;return group;
}

// The contact field receives the identical widened surface used by the mesh.
export function sampleBlouseFrontAtXY(x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const sample=sampleBlouseFrontAtXYBase98(inverseOuterWidth98(x),y);
  if(!sample||OUTER_WIDTH98===0)return sample;
  const transform=outerWidth98(sample.point.x);
  sample.point.x=transform.x;sample.normal.x/=transform.jacobian;sample.normal.normalize();
  sample.xyResidual=Math.hypot(sample.point.x-x,sample.point.y-y);
  return sample;
}
