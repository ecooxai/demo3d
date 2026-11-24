// Original procedural tailoring and jewellery for the portrait bust.
// Photograph-informed design only; all shapes, colours and details are geometric.
const TAU=2*Math.PI, clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const mix=(a,b,t)=>a+(b-a)*t, ease=t=>t*t*(3-2*t);
const vadd=(a,b,s=1)=>a.map((v,i)=>v+s*b[i]);
const scale=(a,s)=>a.map(v=>v*s), delta=(a,b)=>vadd(a,b,-1);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>scale(a,1/(Math.hypot(...a)||1));
const profile=[[-.66,.325,.40,-.46],[-.95,.325,.34,-.50],[-1.10,.35,.325,-.50],[-1.24,.43,.34,-.52],[-1.32,.595,.37,-.53],[-1.40,.88,.39,-.54],[-1.50,1.15,.43,-.56],[-1.65,1.30,.48,-.60],[-1.78,1.32,.49,-.60]];
function fallbackNeck(a,y){
  let j=0; while(j+2<profile.length && y<profile[j+1][0])j++;
  const from=profile[j],to=profile[j+1],t=clamp((y-from[0])/(to[0]-from[0]));
  const [w,f,b]=[1,2,3].map(i=>mix(from[i],to[i],t));
  const c=Math.cos(a);
  return [w*Math.sin(a),y,-.075+(c>0?f+.075:-.075-b)*c];
}
function sampleNeck(a,y){
  const point=globalThis.HeadSculpt?.neckAt?.(a,y);
  return point && point.length===3 && [...point].every(Number.isFinite)?[...point]:fallbackNeck(a,y);
}
function cubicKnots(val,knots){
  let i=0; while(i+2<knots.length && val>knots[i+1][0])i++;
  const [a,A]=knots[i], [b,B]=knots[i+1],
        [a0,A0]=knots[Math.max(0,i-1)], [b1,B1]=knots[Math.min(knots.length-1,i+2)];
  const t=clamp((val-a)/(b-a)), t2=t*t, t3=t2*t;
  const m0=(B-A0)/(b-a0)*(b-a),m1=(B1-A)/(b1-a)*(b-a);
  return (2*t3-3*t2+1)*A+(t3-2*t2+t)*m0+(-2*t3+3*t2)*B+(t3-t2)*m1;
}
const opening=[[0,-1.721],[.13,-1.658],[.26,-1.553],[.43,-1.453],[.63,-1.373],[.84,-1.318],[1.1,-1.307],[1.42,-1.324],[1.70,-1.330],[2.05,-1.300],[2.48,-1.245],[2.84,-1.227],[Math.PI,-1.225]];
const lapelDepth=[[0,.058],[.20,.093],[.43,.118],[.63,.124],[.92,.117],[1.20,.126],[1.55,.143],[1.95,.175],[2.20,.26],[2.45,.35],[2.75,.365],[Math.PI,.365]];
const skirt=-1.779;
function top(a){return cubicKnots(Math.abs(a),opening);}
function blousePoint(a,y,offset=0){
  const s=Math.sin(a), c=Math.cos(a), ang=Math.abs(a), t=clamp((y-top(a))/(skirt-top(a)));
  // Wall offset encloses the chest. Radius puffs only at the outer armhole;
  // fractional waves are eased away from the neckline for clean attachment.
  const lateral=Math.exp(-Math.pow((ang-1.50)/.40,2));
  const puff=lateral*Math.pow(Math.sin(Math.PI*t*.86),1.35)
             *(.076+.018*Math.sin(19*a+11*t)+.014*Math.sin(33*a-7*t));
  const sideY=lateral*.046*Math.pow(Math.sin(Math.PI*t),1.5);
  const fwd=lateral*.028*Math.sin(22*a+5*t)*Math.sin(Math.PI*t)*Math.max(0,c+.32);
  const [x,yy,z]=sampleNeck(a,y), dr=.017+puff+offset;
  return [x+s*dr,yy+sideY,z+c*dr+fwd];
}
function collarPoint(a,v,offset=0){
  const start=top(a), depth=cubicKnots(Math.abs(a),lapelDepth);
  const y=Math.max(skirt,start-depth*v);
  const rim=.016*Math.exp(-Math.pow((v-.09)/.11,2))+.007*Math.exp(-Math.pow((v-.96)/.095,2));
  return blousePoint(a,y,.014+rim+offset);
}
function mesh(name,roughness=.5,specular=.35){return {name,positions:[],colors:[],indices:[],roughness,specular};}
function patch(m,nu,nv,fn,col,rev=false){
  const base=m.positions.length/3;
  for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){
    m.positions.push(...fn(i/nu,j/nv));
    m.colors.push(...col(i/nu,j/nv));
  }
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){
    const a=base+i*(nv+1)+j,b=a+nv+1;
    if(rev)m.indices.push(a,a+1,b,b,a+1,b+1);
    else m.indices.push(a,b,a+1,b,b+1,a+1);
  }
}
function tint(rgb,amt){return rgb.map((n,i)=>clamp(n+amt*(i===0?.84:1)));}
function tube(m,path,r,col,N=128,M=6){
  patch(m,N,M,(t,v)=>{
    const p=path(t),T=unit(delta(path(clamp(t+.0002)),path(clamp(t-.0002))));
    const N=unit(cross(T, Math.abs(T[2])<.91?[0,0,1]:[0,1,0])), B=cross(T,N), a=v*TAU;
    const R=typeof r==='function'?r(t,v):r;
    return vadd(vadd(p,N,R*Math.cos(a)),B,R*Math.sin(a));
  },typeof col==='function'?col:()=>col,true);
}
function orb(m,p,r,col,segments=26,rings=16){
  patch(m,segments,rings,(u,v)=>{
    const a=TAU*u,b=Math.PI*v,off=Math.sin(b), irreg=1+.022*Math.cos(a*3+b*2)*off;
    return [p[0]+r[0]*Math.cos(a)*off*irreg,p[1]+r[1]*Math.cos(b)*irreg,p[2]+r[2]*Math.sin(a)*off*irreg];
  },(u,v)=>tint(col,.028*Math.cos(v*Math.PI)+.009*Math.sin(u*TAU)*Math.sin(v*Math.PI)));
}
const ang=u=>mix(-Math.PI,Math.PI,u);
const white=[.931,.913,.938], teal=[.053,.528,.676], trim=[.930,.931,.963];
function buildCloth(result){
  const dress=mesh('Pearl white puff sleeve blouse',.65,.31), collar=mesh('Lagoon blue sailor collar',.42,.41), stripe=mesh('Ivory inset collar stripe',.53,.31);
  const edging=mesh('Woven neckline and edge piping',.49,.34);
  patch(dress,144,36,(u,v)=>{const a=ang(u);return blousePoint(a,mix(top(a)+.002,skirt,v));},(u,v)=>{
    const a=ang(u),wing=Math.exp(-Math.pow((Math.abs(a)-1.50)/.43,2));
    const folds=.020*Math.sin(31*a-10*v)*v*wing+.015*Math.cos(21*a+7*v)*v*wing;
    return tint(white,folds-.022*v+.005*Math.sin(82*a+105*v));
  },true);
  patch(collar,144,25,(u,v)=>collarPoint(ang(u),v),(u,v)=>{
    const a=ang(u), wave=.016*Math.cos(21*a+6*v)+.008*Math.sin(104*a-19*v);
    return tint(teal,wave+.029*Math.sin(v*Math.PI)-.055*Math.pow(v,7));
  },true);
  patch(stripe,144,8,(u,v)=>collarPoint(ang(u),mix(.611,.774,v),.0038),(u,v)=>{
    return tint(trim,.008*Math.sin(33*ang(u)+4*v)-.011*Math.pow(Math.abs(v-.5)*2,4));
  },true);
  tube(edging,u=>collarPoint(ang(u),.075,.004),.0032,[.104,.621,.751],162,6);
  tube(edging,u=>collarPoint(ang(u),.963,.002),.0033,[.046,.435,.582],162,6);
  result.push(dress,collar,stripe,edging);
}
const silver=[.746,.778,.830], silverWarm=[.844,.824,.809], nacre=[.955,.902,.843];
function chainPoint(a,id){
  const fac=Math.pow((1+Math.cos(a+(id===0?.12:-.225)))/2,id===0?2.06:2.75);
  const y=(id===0?-1.172:-1.152)-fac*(id===0?.413:.325);
  const p=sampleNeck(a,y), dr=.020;
  return [p[0]+Math.sin(a)*dr,p[1],p[2]+Math.cos(a)*dr];
}
function buildJewels(result){
  const links=mesh('Fine silver figaro necklace and setting',.27,.75), pearls=mesh('Ivory nacre pendants',.24,.77);
  const path=id=>u=>chainPoint(ang(u),id);
  for(let id=0;id<2;id++){
    // Tiny alternating links: just enough metallic variation to read at portrait scale.
    tube(links,path(id),(t,v)=>.0034+.0010*Math.cos(t*TAU*104)*Math.cos(v*TAU*2),
      (t,v)=>tint(id===0?silver:silverWarm,.079*Math.cos(t*TAU*104)+.043*Math.cos(v*TAU)),286,6);
    const clasp=chainPoint(Math.PI,id);
    orb(links,clasp,[.016,.006,.006],silver,14,8);
  }
  for(let id=0;id<2;id++){
    const at=id===0?-.118:.226,a=chainPoint(at,id),r=id===0?.042:.021;
    // The ornaments stand naturally clear of skin as the chest curves forward.
    const c=[a[0],a[1]-r-(id===0?.022:.010),a[2]+(id===0?.045:.028)];
    const linkR=id===0?.010:.0056;
    tube(links,t=>[a[0]+linkR*Math.cos(t*TAU),a[1]-.010+linkR*Math.sin(t*TAU),a[2]+.010],id===0?.0028:.0022,silverWarm,34,7);
    tube(links,t=>[mix(a[0],c[0],t),mix(a[1]-.013,c[1]+r*.77,t),mix(a[2]+.010,c[2],t)],id===0?.0046:.0035,silverWarm,12,7);
    orb(links,[c[0],c[1]+r*.81,c[2]],[r*.38,r*.29,r*.36],silverWarm,19,10);
    orb(pearls,c,[r*.92,r,r*.87],id===0?nacre:[.946,.917,.894]);
  }
  result.push(links,pearls);
}
function normalsFor(m){
  const {positions:p,indices}=m,n=new Float32Array(p.length);
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3,
          A=[p[a],p[a+1],p[a+2]],B=[p[b],p[b+1],p[b+2]],C=[p[c],p[c+1],p[c+2]],
          d=cross(delta(B,A),delta(C,A));
    for(const j of [a,b,c]){ n[j]+=d[0];n[j+1]+=d[1];n[j+2]+=d[2]; }
  }
  for(let j=0;j<n.length;j+=3){const l=Math.hypot(n[j],n[j+1],n[j+2]);if(l>1e-8){n[j]/=l;n[j+1]/=l;n[j+2]/=l;}else {n[j]=0;n[j+1]=1;n[j+2]=0;}}
  return n;
}
export function buildGarment(){
  const pieces=[];
  buildCloth(pieces);
  buildJewels(pieces);
  for(const m of pieces)m.normals=normalsFor(m);
  return pieces;
}
globalThis.HeadGarment={build:buildGarment};

