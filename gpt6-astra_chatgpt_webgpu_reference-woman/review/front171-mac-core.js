import * as THREE from 'three';

// Only accepted-source capture, prepared-head lookup, and reversible old-index
// retirement are reused from the frozen167 study. No167 lock emitter is present.
const VERSION='accepted-source-capture-for-fibers-171';

const CROWN='Continuous parted crown with longitudinal fiber flow',MASS='Overlapping layered S-wave hair around front back and shoulders',DETAIL='Independent fine crown lengths and silhouette strands',FRINGE='Dense fine bowed brown fringe strands',WISPS='Sparse short temple edge and hairline wisps';
const captures=new WeakMap(),applications=new WeakMap(),isolations=new WeakMap();
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,addedTriangles:0,removedTriangles:0,addedGeometryBytes:0,addedTextureBytes:0,perFrameWork:0,elapsedMs:0});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const v=(x=0,y=0,z=0)=>[x,y,z],add=(a,b,s=1)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>{const l=len(a);if(l<1e-12)throw Error('167 zero direction');return a.map(q=>q/l);};
const attr=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)],finite=a=>a.every(Number.isFinite),now=()=>performance.now();
const COUNTS167=[270,245,105,300,120,95,170];
export function createFrontCapture167({headTilt=-.17}={}){
 let workMs=0;const rows=[],detail=[],wisps=[],representatives=new Map();
 const posed=point=>{const{x,y,z}=point,w=1-smooth(-1.64,.38,y),ay=-.16*w,az=-headTilt*w,xx=x*Math.cos(ay)+z*Math.sin(ay);return[xx*Math.cos(az)-y*Math.sin(az),xx*Math.sin(az)+y*Math.cos(az),-x*Math.sin(ay)+z*Math.cos(ay)];};
 return{detail,wisps,fringe(record){
  const started=now(),{group,k,strand,loose,first,indexStart}=record,point=t=>posed(strand.getPoint(t));
  let cut=group===6?0:1,reason=group===6?'protected-group6':'released-entire-route';
  if(group===0){
   if(point(1)[1]<=.45){let lo=0,hi=1;for(let i=0;i<24;i++){const m=(lo+hi)/2;if(point(m)[1]>.45)lo=m;else hi=m;}cut=(lo+hi)/2;reason='retained133-below-Y.45';}
   else reason='short-companion-endpoint-only';
  }
  rows.push({group,k,first,indexStart,ring:loose?2:5,steps:20,indicesPerSegment:loose?6:24,cut,reason,firstKeptSegment:Math.ceil(cut*20),endpoint:point(1)});
  const previous=representatives.get(group),distance=Math.abs(k-(COUNTS167[group]-1)/2),principal=group!==0||strand.debug133?.kind==='principal';
  if(principal&&(!previous||distance<previous.distance))representatives.set(group,{...record,point,cut,distance});
  workMs+=now()-started;
 },finish(groom){
  const fringe=find(groom,FRINGE),p=fringe.geometry.attributes.position,anchors=[0,Math.floor(p.count/2),p.count-1].map(i=>({i,p:attr(p,i)}));
  if(representatives.size!==7)throw Error('167 cannot resolve all seven accepted fringe families');
  const record={rows,detail,wisps,representatives:[...representatives.values()].sort((a,b)=>a.group-b.group),anchors,headTilt,captureMs:workMs};captures.set(groom,record);
  groom.userData.frontCapture167={version:VERSION,fringe:rows.length,detail:detail.length,wisps:wisps.length,captureMs:workMs};
 }};
}
function find(root,name){let hit=null;root.traverse(o=>{if(o.name===name){if(hit)throw Error('167 duplicate '+name);hit=o;}});if(!hit)throw Error('167 missing '+name);return hit;}
function actualGroomStats(root){let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.index.count/3;bytes+=o.geometry.index.array.byteLength;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});return{triangles,geometryMiB:Number((bytes/1048576).toFixed(2))};}
function transform(a,p){return[a[0]*p[0]+a[4]*p[1]+a[8]*p[2]+a[12],a[1]*p[0]+a[5]*p[1]+a[9]*p[2]+a[13],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]+a[14]];}
function matrixTo(target,source){const a=new THREE.Matrix4().multiplyMatrices(target.matrixWorld.clone().invert(),source.matrixWorld);if(!Number.isFinite(a.determinant())||Math.abs(a.determinant())<1e-12||!finite(a.elements))throw Error('167 invalid affine frame');return a.elements;}
function arcTable(point,n=96,positions=null){const s=new Float64Array(n+1);let previous=point(0);if(positions)positions.set(previous,0);for(let i=1;i<=n;i++){const p=point(i/n);s[i]=s[i-1]+len(sub(p,previous));if(positions)positions.set(p,i*3);previous=p;}return s;}
function arcAt(table,t){const q=clamp(t)*(table.length-1),i=Math.min(table.length-2,Math.floor(q));return mix(table[i],table[i+1],q-i);}
function inverseArc(table,s){let lo=0,hi=table.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(table[m]<s)lo=m;else hi=m;}return(lo+clamp((s-table[lo])/(table[hi]-table[lo]||1)))/(table.length-1);}

// Two-pass packed XY index of actual indexed front scalp/obstacle triangles.
// It holds triangle offsets, not copied head vertices or an analytic surface.
function supportIndex(groom,head){
 const start=now();groom.updateWorldMatrix(true,true);head.updateWorldMatrix(true,true);
 const records=[];
 head.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const scalp=mesh.name==='continuous-face',obstacle=['sculpted-eyelids','scleral-globe','transparent-corneal-dome','ear-continuous-anatomical-shell'].includes(mesh.name);if(!scalp&&!obstacle)return;
  const g=mesh.geometry,p=g.attributes.position,index=g.index;if(!p||!index||index.count>=1048576)throw Error('167 unsupported head layout');
  const ranges=scalp?(g.groups||[]).filter(q=>q.materialIndex===0).map(q=>[q.start,q.start+q.count]):[[0,index.count]];
  if(scalp&&!ranges.length)throw Error('167 requires actual front-material triangle membership');
  records.push({mesh,p,index,ranges,m:matrixTo(groom,mesh),scalp});
 });
 if(records.filter(r=>r.scalp).length!==1)throw Error('167 needs one continuous face');
 const nx=48,ny=52,box=[-1.32,1.03,-.80,1.68],counts=new Uint32Array(nx*ny),cellX=x=>clamp(Math.floor((x-box[0])/(box[1]-box[0])*nx),0,nx-1),cellY=y=>clamp(Math.floor((y-box[2])/(box[3]-box[2])*ny),0,ny-1),tri=(r,k)=>[0,1,2].map(j=>transform(r.m,attr(r.p,r.index.getX(k+j))));
 let triangles=0;
 function visit(fn){for(let r=0;r<records.length;r++){const record=records[r];for(const[start,end]of record.ranges)for(let k=start;k<end;k+=3){const ps=tri(record,k),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);if(hiX<box[0]||loX>box[1]||hiY<box[2]||loY>box[3])continue;const n=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));if(n[2]<=1e-13)continue;fn(r*1048576+k,cellX(loX),cellX(hiX),cellY(loY),cellY(hiY));}}}
 visit((id,x0,x1,y0,y1)=>{triangles++;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)counts[y*nx+x]++;});
 const offsets=new Uint32Array(counts.length+1);for(let i=0;i<counts.length;i++)offsets[i+1]=offsets[i]+counts[i];
 const entries=new Uint32Array(offsets.at(-1)),cursor=offsets.slice(0,-1);
 visit((id,x0,x1,y0,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const cell=y*nx+x;entries[cursor[cell]++]=id;}});
 const metrics={triangles,records:records.map(r=>({name:r.mesh.name,scalp:r.scalp,groups:r.ranges})),indexBytes:offsets.byteLength+entries.byteLength,queries:0,misses:0,buildMs:now()-start};
 function at(x,y,scalpOnly=false){
  metrics.queries++;if(x<box[0]||x>box[1]||y<box[2]||y>box[3]){metrics.misses++;return null;}
  const cell=cellY(y)*nx+cellX(x);let hit=null;
  for(let q=offsets[cell];q<offsets[cell+1];q++){
   const id=entries[q],r=records[Math.floor(id/1048576)];if(scalpOnly&&!r.scalp)continue;
   const k=id%1048576,[a,b,c]=tri(r,k),den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-14)continue;
   const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,w=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,t=1-u-w;if(Math.min(u,w,t)<-1e-7)continue;
   const z=u*a[2]+w*b[2]+t*c[2];if(hit&&hit.p[2]>=z)continue;const n=unit(cross(sub(b,a),sub(c,a)));hit={p:[x,y,z],n,scalp:r.scalp,name:r.mesh.name,triangleOffset:k,bary:[u,w,t]};
  }
  if(!hit)metrics.misses++;return hit;
 }
 function nearestScalp(target){
  let best=null,distance=Infinity;
  for(const dy of[0,-.025,-.05,-.075,-.10]){const hit=at(target[0],target[1]+dy,true);if(hit&&hit.n[2]>.10){const d=len(sub(hit.p,target));if(d<distance){best=hit;distance=d;}}}
  if(!best)return null;
  for(const step of[.035,.018,.008,.003]){const center=best.p;for(const dx of[-step,0,step])for(const dy of[-step,0,step]){const hit=at(center[0]+dx,center[1]+dy,true);if(!hit||hit.n[2]<.10)continue;const d=len(sub(hit.p,target));if(d<distance){best=hit;distance=d;}}}
  return best;
 }
 return{at,nearestScalp,metrics};
}


function filteredIndex(g,remove){const old=g.index,keep=[];let removed=0;for(let k=0;k<old.count;k+=3){if(remove(k,old))removed++;else keep.push(old.getX(k),old.getX(k+1),old.getX(k+2));}return{old,next:new THREE.BufferAttribute(new old.array.constructor(keep),1),removed};}
function currentOffset(groom,capture){const p=find(groom,FRINGE).geometry.attributes.position,delta=sub(attr(p,capture.anchors[0].i),capture.anchors[0].p);let max=0;for(const a of capture.anchors)max=Math.max(max,len(sub(sub(attr(p,a.i),a.p),delta)));if(max>4e-7)throw Error('167 fringe no longer has a uniform prepared-frame translation');return{delta,max};}

function sampleCrown(g,side,u,t){const a=g.attributes.position,first=side<0?7685:16070,x=clamp(u)*128,y=clamp(t)*64,i=Math.min(127,Math.floor(x)),j=Math.min(63,Math.floor(y)),dx=x-i,dy=y-j;return[0,1,2].map(k=>mix(mix(a.array[(first+j*129+i)*3+k],a.array[(first+j*129+i+1)*3+k],dx),mix(a.array[(first+(j+1)*129+i)*3+k],a.array[(first+(j+1)*129+i+1)*3+k],dx),dy));}

export function retireUpstreamFibers171(groom,enabled=true){
 if(!enabled)return restoreUpstreamFibers171(groom);const old=isolations.get(groom);if(old)return old.metrics;
 const capture=captures.get(groom);if(!capture)throw Error('167 coarse isolation needs capture');const changes=[],metrics={version:'retired-original-upstream-fibers-171',hidden:[]};
 for(const[name,rows]of[[DETAIL,capture.detail],[WISPS,capture.wisps]]){
  const mesh=find(groom,name),owned=new Uint8Array(mesh.geometry.attributes.position.count);for(const row of rows)owned.fill(1,row.first,row.first+row.count);
  const cut=filteredIndex(mesh.geometry,(k,index)=>{const a=owned[index.getX(k)],b=owned[index.getX(k+1)],c=owned[index.getX(k+2)];if(a||b||c){if(!(a&&b&&c))throw Error('167 fine ownership cuts a triangle');return true;}return false;});changes.push({mesh,...cut});metrics.hidden.push({mesh:name,removedTriangles:cut.removed,rows});
 }
 const fringe=find(groom,FRINGE),ranges=capture.rows.map(r=>({group:r.group,k:r.k,start:r.indexStart,count:r.firstKeptSegment*r.indicesPerSegment,cut:r.cut,cutArc:r.cutArc,length:r.length,firstKeptSegment:r.firstKeptSegment}));let r=0;
 const cut=filteredIndex(fringe.geometry,k=>{while(r<ranges.length&&k>=ranges[r].start+ranges[r].count)r++;return r<ranges.length&&k>=ranges[r].start&&k<ranges[r].start+ranges[r].count;});changes.push({mesh:fringe,...cut});metrics.hidden.push({mesh:FRINGE,removedTriangles:cut.removed,ranges});
 metrics.replacementIndexBytes=changes.reduce((s,c)=>s+c.next.array.byteLength,0);metrics.removedTriangles=changes.reduce((s,c)=>s+c.removed,0);
 for(const change of changes)change.mesh.geometry.setIndex(change.next);const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),replacedUpstreamFibers171:metrics};isolations.set(groom,{changes,metrics,originalUserData});return metrics;
}
export function restoreUpstreamFibers171(groom){const old=isolations.get(groom);if(!old)return{restored:false};for(const c of old.changes)c.mesh.geometry.setIndex(c.old);groom.userData=old.originalUserData;isolations.delete(groom);return{restored:true};}

export function getFrontCapture171(groom){return captures.get(groom);}
export function forgetFrontCapture171(groom){captures.delete(groom);}
export function forgetUpstreamRestore171(groom){isolations.delete(groom);}
export function cutFrontalCrown171(g){
 if(g.attributes.position.count!==24455||g.index.count!==47744*3)throw Error('171 original crown layout changed');
 return filteredIndex(g,k=>{const face=k/3;if(face<14976)return false;const local=face-14976,cell=Math.floor((local%16384)/2),column=cell%128,row=Math.floor(cell/128);return column>=78&&row>=2;});
}
export {find,actualGroomStats,currentOffset,supportIndex,sampleCrown};
