import * as THREE from 'three';
import { emitClumpLock126, clumpSurface126 } from './lower-clump-sections126.js';
export { emitClumpLock126, clumpSurface126 };

// Shared family-coordinate revision of126. The actual section emitter and
// its exact triangle evaluator remain the preceding isolated implementation.
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
const randomFor=seed=>()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};
const ZERO=Object.freeze({enabled:false,strength:0,selectedGuides:0});
function point(s,g,q){
 const k=Math.min(7,Math.floor(q)),r=q-k,a=k/8*TAU,b=(k+1)/8*TAU,cs=Number.isInteger(q)?Math.cos(q/8*TAU):mix(Math.cos(a),Math.cos(b),r),sn=Number.isInteger(q)?Math.sin(q/8*TAU):mix(Math.sin(a),Math.sin(b),r);
 return s.f.p.clone().addScaledVector(s.f.s,g.w*s.shape*cs*s.undulate).addScaledVector(s.f.n,s.inset+s.depth*s.shape*sn);
}
function guideAtY(g,y){
 let lo=.25,hi=.96;for(let k=0;k<22;k++){const t=(lo+hi)/2;if(g.c.getPoint(t).y>y)lo=t;else hi=t;}return g.c.getPoint((lo+hi)/2);
}

function makeFamilies(guides){
 const families=[];
 for(const left of[true,false])for(let family=0;family<(left?11:14);family++){
  const start=(left?58:91)+family*3,ids=[start,start+1,start+2],r=randomFor((left?126731:126947)+family*8317),lobes=2+Math.floor(r()*3),weights=Array.from({length:lobes},()=>.65+.8*r()),dominant=Math.floor(r()*lobes);weights[dominant]*=1.65;
  const sum=weights.reduce((a,b)=>a+b,0),valleys=[];let at=-.84;
  for(let k=0;k<lobes-1;k++){at+=1.68*weights[k]/sum;valleys.push({center:at,width:.16+.09*r(),depth:.014+.010*r(),drift:(r()-.5)*.11,start:.10+.26*r(),end:.59+.27*r()});}
  const end=Math.max(...ids.map(id=>guides[id].tipY))+.15,onset=-1.71-.13*r(),full=-2.02-.16*r(),centers=new Float64Array(65),widths=new Float64Array(65);
  for(let j=0;j<65;j++){
   const y=mix(-1.64,-4.25,j/64),ps=ids.map(id=>guideAtY(guides[id],y)),center=ps.reduce((s,p)=>s+p.x,0)/3,half=Math.max(...ps.map((p,i)=>Math.abs(p.x-center)+guides[ids[i]].w));
   centers[j]=center;widths[j]=half;
  }
  families.push({left,family,ids,lobes,valleys,onset,full,end,centers,widths});
 }
 const sample=(f,y)=>{const v=clamp((y+1.64)/(-4.25+1.64))*64,j=Math.min(63,Math.floor(v)),r=v-j;return{center:mix(f.centers[j],f.centers[j+1],r),half:mix(f.widths[j],f.widths[j+1],r)};};
 function valleysAt(y){
  const out=[];for(const f of families){
   const w=smooth(f.onset,f.full,y)*(1-smooth(f.end+.42,f.end,y));if(w<=0)continue;
   const {center,half}=sample(f,y),along=clamp((y-f.onset)/(f.end-f.onset));
   for(const v of f.valleys){const lane=v.center+v.drift*smooth(v.start,v.end,along);out.push({family:f,center:center+lane*half,width:v.width*half,depth:v.depth*w,weight:w});}
  }return out;
 }
 function requested(x,y){
  if(y>=-1.64)return 0;let remaining=1;
  for(const f of families){
   const w=smooth(f.onset,f.full,y)*(1-smooth(f.end+.42,f.end,y));if(w<=0)continue;
   const {center,half}=sample(f,y);if(Math.abs(x-center)>half*1.1)continue;
   const along=clamp((y-f.onset)/(f.end-f.onset));
   for(const v of f.valleys){const at=center+(v.center+v.drift*smooth(v.start,v.end,along))*half,q=(x-at)/(v.width*half);if(Math.abs(q)<1){const k=1-q*q;remaining*=1-Math.min(.95,v.depth/.027*w*k*k*k);}}
  }
  // Smooth union keeps overlaps bounded without extra ribs at field crossings.
  return .027*(1-remaining);
 }
 return{families,valleysAt,requested};
}

function supportField(guides,section){
 const started=performance.now(),raw=[],ids=[],front=[],nx=80,ny=84,x0=-1.85,y0=-4.35,dx=3.7/nx,dy=(4.35-1.64)/ny,bins=Array.from({length:nx*ny},()=>[]);
 const append=(a,b,c,id,isFront)=>{
  if(Math.min(a.y,b.y,c.y)>=-1.64||Math.max(a.y,b.y,c.y)<y0||Math.max(a.z,b.z,c.z)<.08)return;
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-13)return;
  const index=ids.length;raw.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z,1/den);ids.push(id);front.push(isFront?1:0);
  const i0=Math.max(0,Math.floor((Math.min(a.x,b.x,c.x)-x0)/dx)),i1=Math.min(nx-1,Math.floor((Math.max(a.x,b.x,c.x)-x0)/dx)),j0=Math.max(0,Math.floor((Math.min(a.y,b.y,c.y)-y0)/dy)),j1=Math.min(ny-1,Math.floor((Math.max(a.y,b.y,c.y)-y0)/dy));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)bins[j*nx+i].push(index);
 };
 for(let id=0;id<guides.length;id++){
  const g=guides[id],selected=id>=58&&id<=132;let old=null;
  for(let j=0;j<=60;j++){
   const s=section(g,j/60),ring=Array.from({length:9},(_,k)=>point(s,g,k));
   if(old)for(let k=0;k<8;k++){const moving=selected&&k<4;append(old[k],ring[k],old[k+1],id,moving);append(old[k+1],ring[k],ring[k+1],id,moving);}old=ring;
  }
 }
 const data=new Float64Array(raw),guideIds=new Uint16Array(ids),frontFlags=new Uint8Array(front),stamp=new Uint32Array(276),high=new Float64Array(276),rear=new Float64Array(276),seen=[];let generation=0,queries=0;
 const at=(x,y,own=-1,z=Infinity)=>{
  queries++;const i=Math.floor((x-x0)/dx),j=Math.floor((y-y0)/dy);if(i<0||i>=nx||j<0||j>=ny)return{capacity:0,ownCapacity:0,front:-Infinity,fixed:-Infinity};
  generation++;seen.length=0;let maximum=-Infinity,fixed=-Infinity;
  for(const index of bins[j*nx+i]){
   const k=index*10,ax=data[k],ay=data[k+1],bx=data[k+3],by=data[k+4],cx=data[k+6],cy=data[k+7],u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))*data[k+9],v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))*data[k+9],w=1-u-v;if(Math.min(u,v,w)<-1e-8)continue;
   const depth=u*data[k+2]+v*data[k+5]+w*data[k+8],id=guideIds[index];maximum=Math.max(maximum,depth);
   if(id>=58&&id<=132){if(stamp[id]!==generation){stamp[id]=generation;seen.push(id);high[id]=rear[id]=-Infinity;}if(frontFlags[index])high[id]=Math.max(high[id],depth);else rear[id]=Math.max(rear[id],depth);}
   if(!frontFlags[index])fixed=Math.max(fixed,depth);
  }
  let capacity=Math.max(0,maximum-fixed),ownCapacity=0;
  for(const id of seen){
   const h=high[id],r=rear[id];if(!Number.isFinite(h))continue;const c=Number.isFinite(r)?.38*Math.max(0,h-r):0;
   capacity=Math.min(capacity,Math.max(0,maximum-h+c));if(id===own)ownCapacity=Math.max(0,z-(h-c));
  }
  return{capacity:Number.isFinite(capacity)?capacity:0,ownCapacity,front:maximum,fixed};
 };
 return{at,metrics:()=>({triangles:ids.length,queries,numericPayloadBytes:data.byteLength+guideIds.byteLength+frontFlags.byteLength+stamp.byteLength+high.byteLength+rear.byteLength,gridReferences:bins.reduce((s,b)=>s+b.length,0),constructionMs:+(performance.now()-started).toFixed(2)})};
}

export function prepareLowerClumps126(guides,section,{strength=0}={}){
 if(strength===0)return ZERO;
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new Error('126 clump strength must be in[0,1].');
 if(guides.length!==276||guides.slice(58,133).some(g=>g.kind!=='front'))throw new Error('126 original front guide order changed.');
 const started=performance.now(),bank=makeFamilies(guides),support=supportField(guides,section),stats={enabled:true,sharedFamilyCoordinates:true,strength,selectedGuides:75,families:25,lobes:{2:0,3:0,4:0},refinedRings:0,extraVertices:0,extraTriangles:0,maxRecess:0,maxSectionXY:[0,0],maxRearChange:0,maxProtectedChange:0,analyticVerticalHalfDepthFloor:.24,temporarySectionBytes:0,constructionMs:0,ranges:[],requestedSamples:0,capacityZeroSamples:0,sumRequested:0,sumActual:0};
 const fieldAt=(x,y,own=-1,z=Infinity)=>{
  const requested=bank.requested(x,y)*strength;if(requested<1e-8)return{requested:0,common:0,own:0,capacity:0};
  const cap=support.at(x,y,own,z),safe=cap.capacity*.94,common=safe<=0?0:requested/Math.pow(1+Math.pow(requested/safe,8),1/8);
  return{requested,common,own:Math.min(common,cap.ownCapacity*.995),capacity:safe,front:cap.front,fixed:cap.fixed};
 };
 const shared={...bank,fieldAt,support};
 for(let id=58;id<=132;id++){
  const g=guides[id],family=bank.families.find(f=>f.ids.includes(id)),rings=[];let firstDense=61,previousMax=Infinity;
  for(let j=0;j<=60;j++){
   const t=j/60,s=section(g,t),old=Array.from({length:9},(_,k)=>point(s,g,k)),maximumY=Math.max(...old.map(p=>p.y));
   if(firstDense===61&&previousMax< -1.68&&maximumY< -1.70)firstDense=j;
   const dense=j>=firstDense,qs=dense?[...Array.from({length:21},(_,k)=>k/5),5,6,7,8]:Array.from({length:9},(_,k)=>k),positions=[];
   for(const q of qs){
    const p=Number.isInteger(q)?old[q].clone():point(s,g,q),before=p.z;
    if(dense&&q>0&&q<4&&p.y< -1.64){const f=fieldAt(p.x,p.y,id,p.z);if(f.requested>1e-6){stats.requestedSamples++;stats.sumRequested+=f.requested;stats.sumActual+=f.own;if(f.own<.0002)stats.capacityZeroSamples++;}p.z-=f.own;}
    stats.maxRecess=Math.max(stats.maxRecess,before-p.z);if(q>=4)stats.maxRearChange=Math.max(stats.maxRearChange,Math.abs(before-p.z));if(p.y>=-1.64)stats.maxProtectedChange=Math.max(stats.maxProtectedChange,Math.abs(before-p.z));positions.push(p);
   }
   const frontEnd=dense?20:4,arc=new Float64Array(frontEnd+1);for(let k=1;k<=frontEnd;k++){const a=positions[k-1],b=positions[k];arc[k]=arc[k-1]+Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}const length=arc[frontEnd];for(let k=1;k<=frontEnd;k++)arc[k]/=length||1;
   rings.push({t,section:s,qs,positions,arc,frontEnd});previousMax=maximumY;
   if(dense){stats.refinedRings++;stats.extraVertices+=16;stats.extraTriangles+=j===firstDense?16:32;}stats.temporarySectionBytes+=positions.length*3*8+arc.byteLength+qs.length*8;
  }
  g.clump126={family,rings,firstDense,strength,section,shared,stats};stats.lobes[family.lobes]++;
 }
 stats.support=support.metrics();stats.constructionMs=+(performance.now()-started).toFixed(2);return stats;
}

export function releaseClumpSupport126(guides){
 const shared=guides[58]?.clump126?.shared;if(!shared)return;
 // The support grid is needed only while building the sections. Removing
 // both closures makes its typed payload and bins collectible before fibers.
 delete shared.fieldAt;delete shared.support;
}

export function attachClumpFine126(g,baseline,{lane,side,phase,end,tipSamples}){
 if(!g.clump126||side<0)return baseline;
 const d=g.clump126,yCurve=new THREE.CatmullRomCurve3(tipSamples.map(y=>new THREE.Vector3(0,y,0)),false,'catmullrom',.38);
 d.stats.surfaceFineCurves=(d.stats.surfaceFineCurves||0)+1;
 let protectedT=1;for(let j=1;j<=28;j++)if(baseline.getPoint((j-1)/28).y< -1.69){protectedT=j/28;break;}
 const getPoint=t=>{
  const old=baseline.getPoint(t),weight=smooth(protectedT,Math.min(1,protectedT+.07),t)*smooth(-1.69,-2.06,old.y)*(1-smooth(.92,1,t));if(weight<=0)return old;
  const at=Math.min(1,t*end),j=Math.min(59,Math.floor(at*60)),v=at*60-j,a=d.rings[j],b=d.rings[j+1];if(j<d.firstDense)return old;
  const shape=mix(a.section.shape,b.section.shape,v),undulate=mix(a.section.undulate,b.section.undulate,v),root=mix(a.section.root,b.section.root,v),width=Math.max(.008,g.w*shape*undulate),wander=.0019*Math.sin(t*29+phase)/width;
  const laneNow=Math.max(-.995,Math.min(.995,lane+wander)),s=clumpSurface126(g,at,laneNow,{withSection:false});if(!s)return old;
  const p=s.p,tip=(t<=.70?0:(t>=1?1:((t-.70)/.30)**2*(3-2*(t-.70)/.30))),ny=mix(a.section.f.n.y,b.section.f.n.y,v),nx=mix(a.section.f.n.x,b.section.f.n.x,v),nz=mix(a.section.f.n.z,b.section.f.n.z,v),offset=.0028*(1-.98*root)*shape;
  // The backbone is sampled on the actual triangulated front, then receives
  // the same small authored surface clearance and unequal trailing offsets.
  p.x+=nx*offset+.024*Math.sin(phase)*tip;p.y+=ny*offset+yCurve.getPoint(t).y;p.z+=nz*offset+.016*Math.cos(phase)*tip;
  return old.lerp(p,weight);
 };
 return{getPoint,getTangent(t){
  if(t<=protectedT+.00003||baseline.getPoint(t).y>=-1.66)return baseline.getTangent(t);
  const a=Math.max(0,t-.00002),b=Math.min(1,t+.00002);return getPoint(b).sub(getPoint(a)).normalize();
 }};
}

export function finishLowerClumps126(guides){
 for(let id=58;id<=132;id++)delete guides[id].clump126;
}
