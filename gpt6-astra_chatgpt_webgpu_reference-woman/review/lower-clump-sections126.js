import * as THREE from 'three';

// Isolated126: replace only the lower illuminated face of the75 original
// front locks. The old rear four edges and all center curves remain intact.
const TAU=Math.PI*2,SQ=Math.SQRT1_2;
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth5=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
const randomFor=seed=>()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};
const ZERO=Object.freeze({enabled:false,strength:0,selectedGuides:0});
const point=(s,g,q)=>{
 const k=Math.min(7,Math.floor(q)),r=q-k,a=k/8*TAU,b=(k+1)/8*TAU;
 // Linear subdivisions of the original8-sided section stay inside its
 // actual polygon, including at the coarse-to-refined transition.
 const cs=Number.isInteger(q)?Math.cos(q/8*TAU):mix(Math.cos(a),Math.cos(b),r),sn=Number.isInteger(q)?Math.sin(q/8*TAU):mix(Math.sin(a),Math.sin(b),r),p=s.f.p.clone();
 return p.addScaledVector(s.f.s,g.w*s.shape*cs*s.undulate).addScaledVector(s.f.n,s.inset+s.depth*s.shape*sn);
};

function parameters(id,g){
 const left=id<91,local=id-(left?58:91),family=Math.floor(local/3),lane=local%3-1,r=randomFor((left?126731:126947)+family*8317),lobes=2+Math.floor(r()*3);
 const weights=Array.from({length:lobes},()=>.65+.8*r()),dominant=Math.floor(r()*lobes);weights[dominant]*=1.65;
 const sum=weights.reduce((a,b)=>a+b,0),valleys=[];let at=-.84;
 for(let k=0;k<lobes-1;k++){
  at+=1.68*weights[k]/sum;
  valleys.push({center:at+.016*lane,width:.13+.075*r(),depth:.012+.012*r(),drift:(r()-.5)*.11,start:.10+.26*r(),end:.59+.27*r()});
 }
 return{id,left,family,lobes,valleys,onset:-1.71-.13*r(),full:-2.02-.16*r(),release:.86+.05*r(),lane};
}

function recessAt(g,s,q,t,baseline,params,strength){
 if(q<=0||q>=4||baseline.y>=-1.64)return 0;
 const x=q<=1?mix(1,SQ,q):q<=2?mix(SQ,0,q-1):q<=3?mix(0,-SQ,q-2):mix(-SQ,-1,q-3);
 const along=clamp((s.f.p.y-params.onset)/(g.tipY-params.onset)),on=smooth5(params.onset,params.full,baseline.y),tip=1-smooth5(params.release,1,t);
 let depth=0;
 for(const v of params.valleys){
  const center=v.center+v.drift*smooth5(v.start,v.end,along),r=(x-center)/v.width;
  if(Math.abs(r)<1){const k=1-r*r;depth+=v.depth*k*k*k;}
 }
 const sn=q<=1?mix(0,SQ,q):q<=2?mix(SQ,1,q-1):q<=3?mix(1,SQ,q-2):mix(SQ,0,q-3);
 // Preserve at least24% of the local front half-depth. No outward crest or
 // negative front thickness is introduced, even where two valleys converge.
 return Math.min(depth,s.depth*sn*.76)*s.shape*on*tip*strength;
}

export function prepareLowerClumps126(guides,section,{strength=0}={}){
 if(strength===0)return ZERO;
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new Error('126 clump strength must be in[0,1].');
 if(guides.length!==276||guides.slice(58,133).some(g=>g.kind!=='front'))throw new Error('126 original front guide order changed.');
 const started=performance.now(),stats={enabled:true,strength,selectedGuides:75,lobes:{2:0,3:0,4:0},refinedRings:0,extraVertices:0,extraTriangles:0,maxRecess:0,maxSectionXY:[0,0],maxRearChange:0,maxProtectedChange:0,analyticFrontHalfDepthFloor:.24,temporarySectionBytes:0,constructionMs:0,ranges:[]};
 for(let id=58;id<=132;id++){
  const g=guides[id],params=parameters(id,g),rings=[];let firstDense=61,previousMax=Infinity;
  for(let j=0;j<=60;j++){
   const t=j/60,s=section(g,t),old=Array.from({length:9},(_,k)=>point(s,g,k)),maximumY=Math.max(...old.map(p=>p.y));
   if(firstDense===61&&previousMax< -1.68&&maximumY< -1.70)firstDense=j;
   const dense=j>=firstDense,qs=dense?[...Array.from({length:21},(_,k)=>k/5),5,6,7,8]:Array.from({length:9},(_,k)=>k),positions=[];
   for(const q of qs){
    const p=Number.isInteger(q)?old[q].clone():point(s,g,q),baseline=p.clone(),recess=recessAt(g,s,q,t,p,params,strength);
    if(recess)p.addScaledVector(s.f.n,-recess);
    if(baseline.y>=-1.64)stats.maxProtectedChange=Math.max(stats.maxProtectedChange,p.distanceTo? p.distanceTo(baseline):Math.hypot(p.x-baseline.x,p.y-baseline.y,p.z-baseline.z));
    if(q>=4)stats.maxRearChange=Math.max(stats.maxRearChange,Math.hypot(p.x-baseline.x,p.y-baseline.y,p.z-baseline.z));
    stats.maxRecess=Math.max(stats.maxRecess,recess);stats.maxSectionXY[0]=Math.max(stats.maxSectionXY[0],Math.abs(p.x-baseline.x));stats.maxSectionXY[1]=Math.max(stats.maxSectionXY[1],Math.abs(p.y-baseline.y));
    positions.push(p);
   }
   const frontEnd=dense?20:4,arc=new Float64Array(frontEnd+1);for(let k=1;k<=frontEnd;k++){const a=positions[k-1],b=positions[k];arc[k]=arc[k-1]+Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}const length=arc[frontEnd];for(let k=1;k<=frontEnd;k++)arc[k]/=length||1;
   rings.push({t,section:s,qs,positions,arc,frontEnd});previousMax=maximumY;
   if(dense){stats.refinedRings++;stats.extraVertices+=16;stats.extraTriangles+=j===firstDense?16:32;}
   stats.temporarySectionBytes+=positions.length*3*8+arc.byteLength+qs.length*8;
  }
  g.clump126={params,rings,firstDense,strength,section};stats.lobes[params.lobes]++;
 }
 stats.constructionMs=+(performance.now()-started).toFixed(2);return stats;
}

export function emitClumpLock126(b,g,vertex){
 const data=g.clump126,first=b.p.length/3,ringStarts=[];
 for(const ring of data.rings){
  const {t,section:s,qs,positions}=ring,base=g.color.clone();if(g.crownColor)base.lerp(g.crownColor,s.root);
  ringStarts.push(b.p.length/3);
  for(let k=0;k<qs.length;k++){
   const q=qs[k],lo=Math.floor(q),r=q-lo,shade0=mix(.974+.018*Math.sin(g.phase+lo*.8+t*3),1,s.root),shade1=mix(.974+.018*Math.sin(g.phase+(lo+1)*.8+t*3),1,s.root);
   vertex(b,positions[k],base.clone().multiplyScalar(mix(shade0,shade1,r)),q/8+g.phase*.173,t,1,g.deformEar);
  }
 }
 for(let j=0;j<60;j++){
  const a=data.rings[j],c=data.rings[j+1],A=ringStarts[j],C=ringStarts[j+1];
  if(a.qs.length===c.qs.length){for(let k=0;k<a.qs.length-1;k++)b.i.push(A+k,C+k,A+k+1,A+k+1,C+k,C+k+1);}
  else{
   // Subdivide the second original triangle along its lower edge. The
   // protected upper face is exactly the original triangle, not a new fan.
   for(let k=0;k<4;k++){b.i.push(A+k,C+k*5,A+k+1);for(let r=0;r<5;r++)b.i.push(A+k+1,C+k*5+r,C+k*5+r+1);}
   for(let k=4;k<8;k++){const q=20+k-4;b.i.push(A+k,C+q,A+k+1,A+k+1,C+q,C+q+1);}
  }
 }
 data.vertexStart=first;data.vertexEnd=b.p.length/3;data.ringStarts=ringStarts;
}

const arcQ=(ring,fraction)=>{
 const a=ring.arc,f=clamp(fraction);let k=0;while(k<a.length-2&&a[k+1]<f)k++;
 const r=(f-a[k])/Math.max(1e-12,a[k+1]-a[k]);return mix(ring.qs[k],ring.qs[k+1],r);
};

// A point on the actual triangulated126 front, with the same parametric
// diagonal as emitClumpLock126. Used by dependent fine paths and the audit.
export function clumpSurface126(g,t,lane,{arcLength=true,withSection=true}={}){
 const d=g.clump126,j=Math.min(59,Math.max(0,Math.floor(t*60))),v=clamp(t*60-j),a=d.rings[j],b=d.rings[j+1],fraction=clamp((1-lane)*.5);
 if(j<d.firstDense)return null;
 const q=arcLength?mix(arcQ(a,fraction),arcQ(b,fraction),v):4*fraction,k=Math.min(19,Math.floor(q*5)),u=clamp(q*5-k),A=a.positions[k],B=b.positions[k],C=a.positions[k+1],D=b.positions[k+1];
 const p=new THREE.Vector3();
 if(u+v<=1)p.set(A.x,A.y,A.z).multiplyScalar(1-u-v).addScaledVector(B,v).addScaledVector(C,u);
 else p.set(C.x,C.y,C.z).multiplyScalar(1-v).addScaledVector(B,1-u).addScaledVector(D,u+v-1);
 return{p,q,section:withSection?d.section(g,t):null,v,u,k,j};
}
