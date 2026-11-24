/* Bespoke portrait groom. All surfaces, guides and pigments are generated from
 * parametric geometry. No photographed/textured shell or downloaded asset. */
const PI=Math.PI,TAU=2*PI, sin=Math.sin,cos=Math.cos,abs=Math.abs;
const lim=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const sm=(a,b,x)=>{const t=lim((x-a)/(b-a));return t*t*(3-2*t)};
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], unit=a=>mul(a,1/(Math.sqrt(dot(a,a))||1)),lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
const mat=(name,roughness,specular)=>({name,positions:[],normals:[],colors:[],indices:[],roughness,specular});
function vert(m,p,n,c){let i=m.positions.length/3;m.positions.push(...p);m.normals.push(...n);m.colors.push(...c.map(x=>lim(x)));return i}
function quad(m,i,j,k,l){m.indices.push(i,j,k,i,k,l)}
function smoothPath(pts,t){
 let x=lim(t)*(pts.length-1),i=Math.min(pts.length-2,Math.floor(x)),f=x-i;
 let a=pts[Math.max(0,i-1)],b=pts[i],c=pts[i+1],d=pts[Math.min(pts.length-1,i+2)];
 return b.map((q,j)=>.5*((2*q)+(-a[j]+c[j])*f+(2*a[j]-5*q+4*c[j]-d[j])*f*f+(-a[j]+3*q-3*c[j]+d[j])*f*f*f));
}
function sampleNorm(fn,t,h=.003){return unit(sub(fn(lim(t+h)),fn(lim(t-h))))}
function frame(fn,t,facing=[0,0,1]){
 const tang=sampleNorm(fn,t);let w=cross(tang,facing);
 if(dot(w,w)<.004)w=cross(tang,[0,1,0]);w=unit(w);return [w,unit(cross(w,tang)),tang];
}
function strip(m,fn,normal,width,color,N=16){
 let base=m.positions.length/3;for(let i=0;i<=N;i++){let t=i/N,p=fn(t),n=unit(normal(t,p)),tg=sampleNorm(fn,t),w=unit(cross(tg,n)),r=width(t);vert(m,add(p,mul(w,-r)),n,color(t));vert(m,add(p,mul(w,r)),n,color(t));if(i)quad(m,base+i*2-2,base+i*2-1,base+i*2+1,base+i*2)}
}
// Material pigment lives in the fiber coordinate, not a projected screen space.
function fiberColor(g,light=.0){g=lim(g,-1,1);return [.260+.099*g+.066*light,.149+.071*g+.042*light,.126+.055*g+.034*light]}
function tube(m,fn,radii,pigment,N=45,K=16,facing=[0,0,1]){
 const base=m.positions.length/3;
 for(let i=0;i<=N;i++){
  const t=i/N,p=fn(t),[U,V]=frame(fn,t,facing),[a,b]=radii(t);
  for(let j=0;j<=K;j++){let th=TAU*j/K,ct=cos(th),st=sin(th);
   const pos=add(p,add(mul(U,ct*a),mul(V,st*b))),n=unit(add(mul(U,ct/Math.max(.0001,a)),mul(V,st/Math.max(.0001,b))));
   vert(m,pos,n,pigment(t,th,n));if(i&&j){const q=base+i*(K+1)+j;quad(m,q-K-2,q-K-1,q,q-1)}
  }
 }
}
function sphere(m,c,radii,color,N=12,K=16){
 let base=m.positions.length/3;for(let i=0;i<=N;i++){let a=PI*i/N;for(let j=0;j<=K;j++){let b=TAU*j/K,n=[sin(a)*cos(b),cos(a),sin(a)*sin(b)],p=n.map((v,k)=>c[k]+v*radii[k]);vert(m,p,unit(n.map((v,k)=>v/radii[k])),typeof color==='function'?color(n):color);if(i&&j){let q=base+i*(K+1)+j;quad(m,q-K-2,q-K-1,q,q-1)}}}
}
export function buildSurface(){
 const H=globalThis.HeadSculpt;if(!H||!H.faceZ||!H.headAt||!H.eyePoint){return []}
 let seed=0x25a5cc9;const rnd=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
 const res=[],M=(name,r,s)=>{let m=mat(name,r,s);res.push(m);return m};
 const fz=(x,y)=>H.faceZ(x,y);
 const scalp=(theta,y)=>H.headAt(theta,lim(y,-.925,1.19997));
 // Surface fans start on a slightly meandering off-center sagittal part.
 // Sweeping a normalized directional arc keeps both temples connected to an
 // actual full occipital/nape volume when viewed from the side or behind.
 const seam=u=>-.051+.030*sm(.15,.83,u)+.0065*sin(72*u)+.0031*sin(153*u);
 function sweepDir(s,u,p){
  u=lim(u);p=lim(p);let a=mix(.708,3.925,u);
  const root=[0,sin(a),cos(a)],eTh=mix(1.30,PI,u),eY=mix(-.255,-.700,sm(0,.95,u))+.027*s*sin(PI*u),eRad=Math.sqrt(1-eY*eY);
  const end=[sin(eTh)*eRad,eY,cos(eTh)*eRad];
  let v=lerp(root,end,p);v[0]+=(.26+.125*sin(a))*sin(PI*p)*(1-sm(.82,1,u));
  v[1]+=(.36-.24*sm(.40,1,u))*sin(PI*p)*(1-sm(.82,1,u));
  v[2]-=.050*sin(PI*p)*sin(PI*u);
  v=unit(v);return [Math.atan2(v[0],v[2]),.25+.950*v[1]];
 }
 function crownRaw(s,u,p){
  let [theta,y]=sweepDir(s,u,p);
  if(u<.34){
    const front=sweepDir(s,0,p),a0=(s>0?.91:1.01)*p+.019*sin(PI*p)+.025*sin(2*PI*p),y0=mix(.25+.95*sin(.708),-.015,p)+.025*sin(PI*p)+.023*sin(2*PI*p);
    const w=1-sm(0,.34,u);theta+=(a0-front[0])*w;y+=(y0-front[1])*w;
  }
  theta*=s;y=lim(y,-.92,1.19998);let q=scalp(theta,y);
  let side=abs(sin(theta)),up=sm(.35,1.16,y);
  let mid=sin(PI*p),grooves=(.0048*sin(89*u+3*p)+.0030*sin(176*u-2*p)+.0014*sin(397*u+6*p))*Math.min(1,5*p);
  grooves*=1-.86*sm(.36,.67,u);let radial=.028+.073*side+(s>0?.046:-.020)*side**3*(1-sm(.51,.90,y))*(1-sm(.46,.79,u))+.055*side*sm(.20,.73,p)+.025*sm(.5,.93,u)+grooves;
  radial*=1-sm(1.075,1.20,y);const partWidth=.0031*(1-sm(.39,.70,u))*(1+.33*sin(107*u));
  q=[q[0]+sin(theta)*radial*(.62+.38*(1-up))+seam(u)*(1-sm(0,.7,p))+s*partWidth*(1-sm(0,.1,p)),
    q[1]+(.038+.072*up+.024*mid)*(.78+.22*up)+grooves*up+(.032+(s>0?.024:0))*Math.exp(-(((u-.26)/.18)**2+((p-.19)/.15)**2)),
    q[2]+cos(theta)*radial*(.60+.40*(1-up))];
  if(u<.115){
    // Sink the anterior hem into the genuine forehead rather than leaving a
    // thick detached cap. Localized unevenness prevents a ruler-cut edge.
    const w=(1-sm(0,.115,u))*(1-sm(.74,.98,p));
    const yq=q[1]+(-.018+.004*sin(37*p)+.0022*sin(91*p))*w;const xq=q[0]+s*(.005*sin(36*p)+.002*sin(83*p))*w;
    q=[xq,yq,mix(q[2],fz(xq,yq)+.008,w)];
  }
  return q;
 }
 // Sample the shell once, then use the same differentiable-enough field for
 // microfibers. It avoids reevaluating the complete facial sculpt for every
 // strand edge, preserves the face while scrubbing, and is deterministic.
 const UMAP=220,PMAP=60,maps={};
 for(const s of [-1,1]){
  const P=[],N=[];maps[s]=[P,N];
  const idx=(i,j)=>Math.max(0,Math.min(UMAP,i))*(PMAP+1)+Math.max(0,Math.min(PMAP,j));
  for(let i=0;i<=UMAP;i++)for(let j=0;j<=PMAP;j++)P.push(crownRaw(s,i/UMAP,j/PMAP));
  for(let i=0;i<=UMAP;i++)for(let j=0;j<=PMAP;j++){
   const du=sub(P[idx(i+1,j)],P[idx(i-1,j)]),dp=sub(P[idx(i,j+1)],P[idx(i,j-1)]),q=P[idx(i,j)];
   const out=unit([q[0],q[1]-.25,q[2]+.06]);let n=unit(cross(du,dp));if(dot(n,n)<.5)n=out;if(dot(n,out)<0)n=mul(n,-1);N.push(n);
  }
 }
 function field(s,u,p,channel){
  const A=maps[s][channel],x=lim(u)*UMAP,y=lim(p)*PMAP,i=Math.min(UMAP-1,Math.floor(x)),j=Math.min(PMAP-1,Math.floor(y)),a=x-i,b=y-j,idx=i*(PMAP+1)+j;
  const p0=A[idx],p1=A[idx+PMAP+1],p2=A[idx+1],p3=A[idx+PMAP+2],wa=(1-a)*(1-b),wb=a*(1-b),wc=(1-a)*b,wd=a*b;
  return [p0[0]*wa+p1[0]*wb+p2[0]*wc+p3[0]*wd,p0[1]*wa+p1[1]*wb+p2[1]*wc+p3[1]*wd,p0[2]*wa+p1[2]*wb+p2[2]*wc+p3[2]*wd];
 }
 const crown=(s,u,p)=>field(s,u,p,0),crownN=(s,u,p)=>unit(field(s,u,p,1));
 // Final lengths of the updo curl around the mastoid and descend toward the
 // nape. This continuation eliminates an arbitrary cut below the temples.
 function skirt(s,u,t){
   u=lim(u);t=lim(t);const start=crown(s,u,1),d=sweepDir(s,u,1);
   const a0=d[0]+((s>0?.91:1.01)-sweepDir(s,0,1)[0])*(1-sm(0,.34,u));
   const a1=a0+(PI-a0)*(.49+.24*sin(PI*u))+.055*sin(PI*u)*sin(5*u);
   const a=mix(a0,a1,t)+.025*sin(2*PI*t+u*4)*sin(PI*t);
   let endY=(s>0?-.50:-.34)-(.69+(s>0?-.50:-.34))*sm(0,.73,u);
   endY+=.037*sin(5.1*u+1.2*s)+.014*sin(23*u+.7*s)+.006*sin(97*u);
   const earLift=(s<0?.19:.079)*(1-sm(.16,.43,u));const Y=mix(start[1],endY,t)+(earLift-.030)*sin(PI*t)*(1-sm(.62,1,u));
   const S=scalp(s*a,Y),B=scalp(s*a0,start[1]),D=sub(start,B);
   const loose=.045*sin(PI*t)*(.60+.40*sin(PI*u))+.012*t;
   const q=add(S,add(mul(D,(1-t)**.74),[s*sin(a)*loose,-.010*sin(PI*t),cos(a)*loose]));
   const drape=sm(.26,.79,u)*sm(.28,1,t);q[2]-=.103*drape;q[0]+=.027*drape;return q;
 }
 function skirtN(s,u,t){
   let du=sub(skirt(s,lim(u+.001),t),skirt(s,lim(u-.001),t)),dt=sub(skirt(s,u,lim(t+.002)),skirt(s,u,lim(t-.002)));
   let n=unit(cross(du,dt)),q=skirt(s,u,t),out=unit([q[0],q[1]*.15,q[2]+.06]);if(dot(n,n)<.5)n=out;if(dot(n,out)<0)n=mul(n,-1);return n;
 }
 const rearPhase=(sp,u)=>sp-.74*(u-.39)+.038*sin(9*u+3.1*sp);
 function sheenColor(s,u,p,g,sheen){
    const r=sm(.37,.64,u),v=rearPhase(s*p,u);
    g=mix(g,.24*sin(40*v+1.3*u)+.16*sin(81*v-1.5*u)+.08*sin(139*v)+.08*sin(14*v+u),r);
    const h=(s>0?1:.28)*(1-sm(.28,.54,u))*Math.exp(-((p-.30-.105*sin(10*u)-.026*sin(41*u))**2)/.014);
    const cool=(s<0?.91:.43)*(.36+.64*sm(.28,.82,p))*(.39+.61*(1-h));
    const c=fiberColor(g-.12,sheen+.59*h);c[0]+=.056*h;c[1]+=.044*h+.001*cool;c[2]+=.035*h+.033*cool;return c;
 }
 const part=M('Scalp • irregular center part',.8,.12);
 for(let i=0;i<=155;i++){
  let u=i/155,c=mix(.43,.19,sm(.35,.67,u)),n=crownN(1,u,0);for(let s of [-1,1]){let p=crown(s,u,0);p=add(p,mul(n,-.001));p[0]+=s*.0010;vert(part,p,n,[c,c*.70,c*.59])}if(i)quad(part,i*2-2,i*2-1,i*2+1,i*2)
 }
 for(let s of [-1,1]){
  const shell=M('Chestnut • '+(s<0?'left':'right')+' swept undergroom',.51,.32),U=196,P=48;
  for(let i=0;i<=U;i++)for(let j=0;j<=P;j++){
    let u=i/U,p=j/P,q=crown(s,u,p),n=crownN(s,u,p);
    let g=.27*sin(183*u+4*p)+.16*sin(91*u+2*p)+.12*sin(528*u-2*p)+.12*sin(41*u+2*p)+.09*sin(37*u-5*p);
    let sheen=.65*Math.exp(-Math.pow((p-.31-.14*sin(5*u))/.17,2))*(.38+.62*sm(-.6,.8,n[1]))+.09*sin(5*p);
    vert(shell,q,n,sheenColor(s,u,p,g,sheen));if(i&&j){let q0=i*(P+1)+j;quad(shell,q0-P-2,q0-P-1,q0,q0-1)}
  }
  const skirtMesh=M('Chestnut • tucked nape '+s,.55,.265);
  const SU=141,ST=17;
  for(let i=0;i<=SU;i++)for(let j=0;j<=ST;j++){
    let u=i/SU,t=j/ST,q=skirt(s,u,t),n=skirtN(s,u,t);
    if(t<.15)n=unit(lerp(crownN(s,u,1),n,sm(0,.15,t)));
    let g=.27*sin(183*u+4+2*t)+.16*sin(91*u+2+t)+.12*sin(528*u-2+t)+.12*sin(41*u+2+t);
    vert(skirtMesh,q,n,sheenColor(s,u,1+t*.25,g-.09,.01));
    if(i&&j){let z=i*(ST+1)+j;quad(skirtMesh,z-ST-2,z-ST-1,z,z-1)}
  }
  const gl=M('Combed strands • '+s,.55,.26);
  for(let k=0;k<220;k++){
   let u0=(k+rnd()*.8)/221*.62,p0=.002+.12*rnd()**2,p1=.81+.185*rnd(),phase=TAU*rnd(),scale=.00085+.0024*rnd()**2,shade=rnd(),jitter=.0003+.0014*rnd();
   const uv=t=>[lim(u0+jitter*sin(9*t+phase)*sin(PI*t)),mix(p0,p1,t)];
   const fn=t=>{const [u,p]=uv(t),n=crownN(s,u,p);return add(crown(s,u,p),mul(n,.0025))};
   strip(gl,fn,t=>{let [u,p]=uv(t);return crownN(s,u,p)},t=>scale*(.1+.9*(sin(PI*t)**.44)),t=>fiberColor(mix(-.62,.91,shade),.08+.29*(sin(PI*t)**2)),29);
  }
  // Wispy frontal root hairs bridge the irregular hairline into the skin.
  const baby=M('Hairline • feathered fine roots '+s,.78,.08);
  for(let k=0;k<125;k++){
   const p0=.038+.878*(k+rnd()*.74)/125,run=.018+.046*rnd(),edge=crown(s,.001,p0),penetr=.002+.011*rnd()**1.4,phase=rnd()*TAU,shade=rnd(),w=.00058+.00092*rnd();
   const fn=t=>{const p=lim(p0+run*(t-.31)),u=Math.max(0,.026*(t-.41));let Q=crown(s,u,p),fac=1-sm(0,.72,t);Q[0]-=s*penetr*fac*(.26+.81*p);Q[1]-=penetr*fac*(.88-.51*p)+.0025*sin(PI*t)*sin(5*t+phase);if(u<.004)Q[2]=Math.max(Q[2],fz(Q[0],Q[1])+.009);Q[2]+=.0012;return Q};
   strip(baby,fn,()=>[s*.25,.06,1],t=>w*(.08+.92*(sin(PI*t)**.68)),t=>fiberColor(mix(-.20,.91,shade),.23+.45*(1-t)),9);
  }
 }
 // Occipital fibers travel DOWN the back of the head toward the right tie.
 // They cross the center plane instead of creating mirrored horizontal rings.
 const occ=M('Chestnut • occipital cross-combing',.54,.23);
 for(let k=0;k<218;k++){
  let a=(k+rnd()*.71)/218*2.09-1.16,ph=rnd()*TAU,u0=.25+.21*rnd(),u1=.79+.205*rnd(),w=.00078+.00178*rnd(),g=mix(-.62,.72,rnd());
  const at=t=>{let u=mix(u0,u1,t),sp=a+.74*(u-.39)-.037*sin(9*u+3.1*a)+.008*sin(13*u+ph);sp=lim(sp,-.998,.998);let s=sp<0?-1:1,p=abs(sp),n=crownN(s,u,p);return [add(crown(s,u,p),mul(n,.0028)),n]};
  strip(occ,t=>at(t)[0],t=>at(t)[1],t=>w*(.10+.90*(sin(PI*t)**.60)),()=>fiberColor(g,.14),28);
 }
 const brows=M('Brows • naturally inclined strokes',.83,.095);
 const browFine=M('Brows • peripheral filaments',.79,.095);
 for(let s of [-1,1]){
   const browY=t=>.311+.064*sin(PI*lim(t)*.94)-.012*t+(s>0?.008:0)+.008*t*t;
   const bx=t=>s*(.142+.374*t);
   const normalAt=(x,y)=>unit([-(fz(x+.001,y)-fz(x-.001,y))/.002,-(fz(x,y+.001)-fz(x,y-.001))/.002,1]);
   const skin=(x,y,z)=>H.skinColor?H.skinColor(x,y,z):[.930,.743,.678];
   const shadow=M('Skin • eyebrow undergrowth '+s,.58,.23);
   const brBase=t=>(.015+.0155*(sin(PI*t)**.66))*(1-sm(.62,1,t)*.76);
   const rows=11,cols=60;
   for(let i=0;i<=cols;i++)for(let j=0;j<=rows;j++){
    let t=i/cols,across=j/rows*2-1,x=bx(t),wiggle=.0018*sin(81*t+s)+.0012*sin(49*t-s),y=browY(t)+across*(brBase(t)*1.38)+wiggle,z=fz(x,y)+.0023;
    let gradient=Math.exp(-3.25*across*across)*(1-abs(across)**3),density=(.49+.23*sin(PI*t)**.8)*sm(0,.10,t)*(1-sm(.82,1,t))*(1+.055*sin(t*147+across*8));
    let c=lerp(skin(x,y,z),[.278,.172,.150],gradient*density);vert(shadow,[x,y,z],normalAt(x,y),c);if(i&&j){let k=i*(rows+1)+j;quad(shadow,k-rows-2,k-rows-1,k,k-1)}
   }
   for(let i=0;i<141;i++){
     let t0=(i+rnd()*.75)/144,thin=.00060+.00095*rnd(),tLen=mix(.022,.082,t0)+rnd()*.037;
     let bw=brBase(t0),bias=rnd()*1.65-.93;
     let y0=browY(t0)+bw*bias,rise=(.007+.011*rnd())*(1-sm(.12,.87,t0)),hairshade=rnd();
     if(i%12===0){thin*=.72;bias=(rnd()<.5?-1:1)*1.01;y0=browY(t0)+bw*bias}
     const path=f=>{let t=lim(t0+tLen*f),x=bx(t),y=mix(y0,browY(t)+bw*(bias*.59+.23*(1-t0)),f)+rise*f*(1.14-.42*f),z=fz(x,y)+.0050+.0008*sin(PI*f);return [x,y,z]};
     let C=lerp([.300,.190,.168],[.489,.341,.294],hairshade),w=thin*(.35+.65*sin(PI*lim(t0,.04,.94))**.32);
     strip(i%9===0?browFine:brows,path,(t,p)=>normalAt(p[0],p[1]),f=>w*(.12+.88*(1-f)**.48),()=>C,7);
   }
 }
 const lashes=M('Lashes • individually tapered and curled',.40,.27);
 const grounding=M('Lash line • natural brown-black',.52,.16);
 for(let s of [-1,1])for(let upper of [true,false]){
   const e=t=>H.eyePoint(s,lim(t,.004,.996),upper);
   const N=upper?45:21;
   strip(grounding,t=>{let [x,y,z]=e(.024+t*.97);return[x,y+(upper?.001:-.0005),z+.0025]},()=>[s*.14,.03,1],t=>(upper?.0049:.0015)*(.09+.91*sin(PI*lim(t,.001,.999))**.52),t=>upper?[.105,.059,.065]:[.30,.19,.19],45);
   for(let i=0;i<N;i++){
     let t=.055+.917*(i+rnd()*.83)/N,O=e(t),spread=(.003+.057*t)*(.75+.56*rnd()),L=(upper?(.012+.027*sin(PI*t*.8)):(.004+.010*sin(PI*t)))*(.76+.58*rnd());
     let dir=upper?1:-1,sz=(upper?.026:.014)*(.61+.67*rnd()),lean=upper?spread:spread*.58;
     const path=f=>[O[0]+s*(lean*f+.0027*sin(PI*f)),O[1]+dir*(L*(.42*f+.58*f*f))+(upper?.001:-.001),O[2]+.0035+sz*(f+.26*sin(PI*f))];
     let shade=rnd(),C=upper?lerp([.063,.037,.041],[.18,.102,.105],shade):lerp([.18,.103,.11],[.33,.213,.191],shade);
     strip(lashes,path,()=>[s*.12,.04,1],f=>(upper?.0017:.0009)*(.13+.87*(1-f)**.63),()=>C,8);
   }
 }
 // Broad lobes with a real elliptical section and fine contour filaments;
 // unlike billboards these change thickness and preserve silhouette on orbit.
 const lobes=M('Temple silks • solid lock volumes',.47,.32);
 const fibers=M('Silk flyaways • chestnut and toasted umber',.55,.24);
 function lock(path,radii,opts={}){
  let {seed:phase=0,base=-.10,light=.12,K=20,N=42,filaments=24,facing=[0,0,1],mesh=lobes,details=fibers}=opts;
  const fn=typeof path==='function'?path:t=>smoothPath(path,t);
  const pigment=(t,th)=>fiberColor(base+.19*sin(5*th+phase+1.3*t)+.14*sin(11*th-phase+2*t)+.15*cos(3*th+.8*t),light+.18*Math.exp(-((t-.33)**2)/.09));
  tube(mesh,fn,radii,pigment,N,K,facing);
  for(let k=0;k<filaments;k++){
    const a=(k+rnd()*.65)/filaments*TAU,sw=.047+.09*rnd(),ph=rnd()*PI*2,p0=.005+.10*rnd()**2,p1=.83+.16*rnd(),shade=mix(-.65,.87,rnd()),w=.00075+.00145*rnd();
    const param=q=>mix(p0,p1,q);
    const at=q=>{let t=param(q),p=fn(t),[U,V]=frame(fn,t,facing),[rx,ry]=radii(t),th=a+sw*sin(t*6+ph),C=cos(th),S=sin(th);return [add(p,add(mul(U,C*(rx+.0015)),mul(V,S*(ry+.0015)))),unit(add(mul(U,C/Math.max(.0004,rx)),mul(V,S/Math.max(.0004,ry))))]};
    strip(details,q=>at(q)[0],q=>at(q)[1],q=>w*(.13+.87*(sin(PI*q)**.5)),()=>fiberColor(shade,light+.17),25);
  }
 }
 const frontP=(s,x,y,z)=>[x*s,y,Math.max(z,fz(x*s,y)+.018)];
 for(let s of [-1,1]){
  const right=s>0;
  // Fine cheek-framing lengths lie in front of the temporal mass; asymmetry
  // includes a short tucked left curl and a fuller right sweep into the braid.
  let ctl=[
   [s*.092,1.243,.304],[s*.251,1.108,.515],frontP(s,.378,.854,.620),
   frontP(s,right?.442:.464,.608,.648),frontP(s,right?.510:.506,.335,right?.635:.632),
   frontP(s,right?.545:.573,.080,.605),frontP(s,right?.565:.586,-.175,.590),
   frontP(s,right?.546:.560,-.415,.583),frontP(s,right?.516:.510,-.628,.550),
   [s*(right?.489:.464),right?-.763:-.736,right?.573:.526],
   [s*(right?.511:.405),right?-.881:-.843,right?.559:.495]
  ];
  for(const P of ctl){let fold=sm(.47,.90,P[1]);P[2]-=.067*fold;P[0]-=s*.015*fold}
  const profile=t=>{let root=sm(0,.20,t),fade=(1-t)**(right?.67:.85),fat=(right?.054:.0375)*root*fade*(1+.23*sin(PI*t));return [Math.max(.0013,.011*(1-t)+fat),Math.max(.0008,.0065*(1-t)+fat*.46)]};
  lock(ctl,profile,{seed:right?.7:2.2,base:right?.13:-.03,light:.16,N:54,K:22,filaments:right?41:32});
  // Outer wing sweeps up behind the ear rather than remaining a straight wig.
  const wing=right?
  [[.18,1.205,.22],[.432,1.028,.48],[.606,.776,.477],[.723,.505,.375],[.794,.249,.248],[.825,.056,.097],[.796,-.101,-.045],[.728,-.207,-.217],[.57,-.309,-.397]]:
  [[.18,1.205,.22],[.440,1.022,.42],[.613,.753,.418],[.713,.51,.303],[.765,.328,.177],[.776,.221,.050],[.766,.182,-.095],[.732,.114,-.235],[.601,-.065,-.414]];
  const wctl=wing.map(([x,y,z])=>[s*(x-.022*sm(.50,.95,y)),y,z-.047*sm(.50,.95,y)]);
  lock(wctl,t=>{const f=.0048+.050*sin(PI*lim(t,.001,.999))**.83;return [f*(right?1.18:.83),f*.58]},{seed:right?1.5:5,base:-.18,light:.14,filaments:27,N:44,K:16});
  // Offset tapered companion lengths break the two cords into separate tapered
  // clusters. Only the right side is full and gathered; the left is tucked.
  for(let sideLock=0;sideLock<(right?3:2);sideLock++){
    const off=(sideLock+1)*.0135*(right?1.2:.82),root=.05*sideLock;
    const bend=sideLock*.012;
    const extra=[[.17+root,1.190-.011*sideLock,.319],[.34+root,.986,.473],[.431+off,.728,.590],[.506+off,.469,.597],[.557+off,.182,.545],[.597+off,-.079,.475],[.613+off+bend,-.312,.455],[.587+off,-.470-.035*sideLock,.463],[.527+off-bend,-.641-.030*sideLock,.492],[.517+off-bend,-.751-.041*sideLock,.531]].map(([x,y,z])=>[s*x,y,Math.max(z,fz(s*x,y)+.010)]);
    for(const P of extra){let fold=sm(.47,.91,P[1]);P[2]-=.060*fold;P[0]-=s*.016*fold}
    if(!right)extra.splice(7);
    const rr=(right?.020:.012)*(1-.15*sideLock);
    lock(extra,t=>{let r=.0008+rr*(.55+.45*sin(PI*t))*(1-sm(.38,1,t)*.97);return [r,.43*r]},{seed:5+sideLock*.81,base:-.12+.12*sideLock,light:.23,N:37,K:13,filaments:9});
  }
  if(right){
    // The photograph's image-right temple is fuller: shafts sweep away from
    // the face, sag just below the ear and then turn toward the loose side tie.
    // These are dissimilar asymmetric sweeps, not a reflected pair of ropes.
    for(let h=0;h<4;h++){
      const d=.020*h, ph=h*.7,guide=[[.37+d*.3,.943,.517],[.515+d*.27,.748,.554],[.625+d*.75,.532,.478],[.691+d*.82,.332,.421],[.741+d,.123,.315],[.777+d*.75,-.060,.184],[.751+d*.91,-.222,.097],[.685+d*.54,-.376,.064],[.626+d*.19,-.491,-.042],[.617+d*.32,-.564,-.108]];
      const fn=t=>{let v=smoothPath(guide,t);v[2]-=.067*sm(.45,.90,v[1]);v[0]+=.009*sin(PI*t)*sin(6*t+ph);return v};
      const rr=(.034+.007*(h%2))* (1-h*.065);
      lock(fn,t=>{let r=.0013+rr*(sin(PI*t)**.57)*(1-.52*sm(.53,.91,t));return [r,r*.62]},{seed:ph+3,base:-.024-.056*h,light:.19,N:36,K:15,filaments:11});
    }
  }
  // Independent downy flyaways around temples, fine enough not to read as bangs.
  for(let j=0;j<40;j++){
    const base=.14+.48*rnd(),start=lim(base+.04*rnd(),0,.8),end=lim(start+.23+.30*rnd(),0,1),a=rnd()*TAU,amp=.008+.047*rnd()**1.5,w=.00061+.00075*rnd(),bias=rnd();
    const path=t=>{let p=smoothPath(j%3?ctl:wctl,mix(start,end,t)),b=sin(PI*t)**.62;p[0]+=s*(amp*(.30+sin(5*t+a))+.013)*b;p[1]+=.010*b*sin(a+4*t);p[2]+=(.022+.016*sin(a+t*4))*b;return p};
    strip(fibers,path,()=>[s*.32,.04,.94],t=>w*(.09+.91*(1-t)**.54),()=>fiberColor(mix(-.5,.52,bias),.06),23);
  }
 }
 // Nape gathers: three continuous lobes trade front/back order as they travel
 // down the right shoulder; all three remain fully modeled from the rear.
 const gather=M('Low side braid • interlaced chestnut',.53,.27);
 const ribbon=M('Binding • smoked umber silk',.74,.15);
 const axis=t=>smoothPath([[.48,-.235,-.559],[.638,-.432,-.420],[.672,-.646,-.246],[.667,-.871,-.077],[.626,-1.083,.080],[.565,-1.285,.162],[.495,-1.483,.213],[.455,-1.59,.216]],t);
 for(let k=0;k<3;k++){
  const phase=k*TAU/3+.25;
  const braid=t=>{let p=axis(t),[U,V]=frame(axis,t),a=t*TAU*1.95+phase,r=(.071-.033*t)*(1-sm(.65,1,t)*.96);return add(p,add(mul(U,cos(a)*r),mul(V,sin(a)*r*.72)))};
  lock(braid,t=>{let r=(.080-.035*t)*(1-sm(.67,.98,t)*.98);return [r,r*.78]},{seed:k*2.11,base:-.20+.10*k,light:.10,mesh:gather,N:60,K:16,filaments:20});
 }
 const tieC=axis(.79);sphere(ribbon,tieC,[.048,.019,.040],[.158,.105,.105],7,16);
 // Twist at the occiput hides center joins and takes the nape into the braid.
 const nape=M('Chestnut • gathered nape core',.61,.20);
 sphere(nape,[.073,-.427,-.402],[.476,.179,.243],n=>fiberColor(-.32+.17*sin(n[0]*44+6*n[1]),.05),18,44);
 for(let k=0;k<5;k++){
  const h=k*.031,tail=[[-.49+.041*k,-.27+h,-.485-.014*k],[-.384,-.360+h,-.589-.011*k],[-.153,-.467+h,-.625-.01*k],[.077,-.522+h,-.623-.009*k],[.301,-.487+h,-.590],[.474,-.430+h,-.516],[.572,-.394+h,-.426]];
  lock(tail,t=>{let r=.011+(.039-.003*k)*sin(PI*t)**.63;return [r,r*.65]},{base:-.15-.065*k,seed:2+k*.72,mesh:gather,light:.08,N:35,K:13,filaments:10,facing:[0,.12,-1]});
 }
 const gold=M('Rose gold • fine headpiece wire',.25,.83),pearl=M('Freshwater pearls • luminous nacre',.27,.74);
 for(let s of [-1,1]){
  const right=s>0;
  const pts=right?[[.272,1.190,.215],[.415,1.235,.235],[.585,1.315,.196],[.769,1.348,.133],[.805,1.335,.115],[.810,1.220,.111],[.786,1.038,.127],[.731,.814,.178]]:[[-.437,1.094,.233],[-.596,1.138,.232],[-.772,1.154,.190],[-.922,1.142,.136],[-.953,1.117,.126],[-.913,1.001,.133],[-.836,.838,.154],[-.768,.721,.185]];
  const fn=t=>smoothPath(pts,t);
  tube(gold,fn,()=>[.0042,.0042],()=>[.71,.526,.392],53,8);
  for(let k=0;k<10;k++){
   const t=lim((k+.21)/9.5+.011*sin(k*13+s),0,1),p=fn(t),r=(k%3===0?.0255:k%3===1?.021:.018)*(right?1.04:.96);
   sphere(pearl,p,[r*(.91+.12*rnd()),r*(1.02+.19*rnd()),r],n=>{const a=dot(n,unit([-.7,.7,.6])),v=.031*(1-a);return [.954+v*.25,.865+v*.82,.815+v*1.15]},9,14);
  }
 }
 // A handful of loose individual hairs break the scalp contour without noise.
 const soft=M('Outline • baby hairs and crown wisps',.64,.17);
 for(let s of [-1,1])for(let k=0;k<58;k++){
  let u0=.015+.87*rnd(),p0=.01+.45*rnd(),p1=lim(p0+.19+.43*rnd()),phase=rnd()*TAU,amp=.007+.033*rnd()**2,w=.00052+.00065*rnd(),shade=mix(-.46,.72,rnd()),d=.002+.018*rnd();
  const at=t=>{let u=lim(u0+d*sin(PI*t)*sin(t*5+phase)),p=mix(p0,p1,t),n=crownN(s,u,p),q=crown(s,u,p);return [add(q,mul(n,amp*sin(PI*t)**.7+.001)),n]};
  strip(soft,t=>at(t)[0],t=>at(t)[1],t=>w*(.12+.88*sin(PI*t)**.46),()=>fiberColor(shade,.12),24);
 }
 // Interrupted center part: small crossover filaments occasionally bridge
 // the pale scalp sliver; neither side is a mathematically polished mirror.
 for(let k=0;k<39;k++){
   const u0=.008+.473*(k+rnd()*.72)/39,sp0=.008+.035*rnd(),sp1=.020+.037*rnd(),turn=k%3===0?-1:1,delta=.009+.037*rnd(),g=-.5+.92*rnd(),w=.00078+.00062*rnd();
   const at=t=>{let sp=turn*mix(-sp0,sp1,t),u=lim(u0+delta*t),s=sp<0?-1:1,n=crownN(s,u,abs(sp)),p=crown(s,u,abs(sp));return [add(p,mul(n,.0016+.0020*sin(PI*t))),n]};
   strip(soft,t=>at(t)[0],t=>at(t)[1],t=>w*(.11+.89*(sin(PI*t)**.55)),()=>fiberColor(g,.23),12);
 }
 // A few fine looped fibers crest beyond the smooth silhouette in true 3-D.
 // Four-sided microfibers stay legible from profile as well as the front.
 for(let s of [-1,1])for(let k=0;k<(s<0?16:19);k++){
  let isCrown=k<(s<0?4:3),u0=isCrown?.16+.19*rnd():.04+.31*rnd(),p0=isCrown?.004+.14*rnd():.15+.30*rnd(),p1=lim(p0+(isCrown?.095:.112)+(isCrown?.17:.33)*rnd()**1.2);
  const phase=rnd()*TAU,amp=(isCrown?.030:.024)+(isCrown?.046:.063)*rnd()**1.35,g=.05+.85*rnd(),w=.00043+.00046*rnd();
  const fn=t=>{let p=mix(p0,p1,t),u=lim(u0+.028*sin(PI*t)*sin(4*t+phase)),n=crownN(s,u,p),q=crown(s,u,p),arch=sin(PI*t)**.85,warp=add(mul(n,amp*arch),[s*.009*sin(PI*t*2+phase)*arch,.004*arch*sin(5*t+phase),.002*arch]);return add(q,warp)};
  tube(soft,fn,t=>{let r=w*(.12+.88*(sin(PI*t)**.55));return [r,r]},()=>lerp(fiberColor(g,.24),[.54,.44,.51],.31),24,4);
 }
 return res;
}

