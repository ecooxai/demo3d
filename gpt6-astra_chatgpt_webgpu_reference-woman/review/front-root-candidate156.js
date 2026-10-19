import * as THREE from 'three';

// Isolated156 coarse architecture. Legacy vertex arrays and materials are
// read-only; the only legacy geometry changes are reversible index selections.
const VERSION='connected-front-crown-156';
export const FRONT_MESH156='Connected crown-to-fringe banks156';
const CROWN='Continuous parted crown with longitudinal fiber flow',MASS='Overlapping layered S-wave hair around front back and shoulders',DETAIL='Independent fine crown lengths and silhouette strands',FRINGE='Dense fine bowed brown fringe strands',WISPS='Sparse short temple edge and hairline wisps';
const captures=new WeakMap(),applications=new WeakMap(),isolations=new WeakMap();
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,addedTriangles:0,removedTriangles:0,addedGeometryBytes:0,addedTextureBytes:0,perFrameWork:0,elapsedMs:0});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const v=(x=0,y=0,z=0)=>[x,y,z],add=(a,b,s=1)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>{const l=len(a);if(l<1e-12)throw Error('156 zero direction');return a.map(q=>q/l);};
const attr=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)],finite=a=>a.every(Number.isFinite),now=()=>performance.now();
const COUNTS156=[270,245,105,300,120,95,170];
export function createFrontCapture156({headTilt=-.17}={}){
 let workMs=0;const rows=[],detail=[],wisps=[],representatives=new Map();
 const posed=point=>{const{x,y,z}=point,w=1-smooth(-1.64,.38,y),ay=-.16*w,az=-headTilt*w,xx=x*Math.cos(ay)+z*Math.sin(ay);return[xx*Math.cos(az)-y*Math.sin(az),xx*Math.sin(az)+y*Math.cos(az),-x*Math.sin(ay)+z*Math.cos(ay)];};
 return{detail,wisps,fringe(record){
  const started=now(),{group,k,strand,loose,first,indexStart}=record,point=t=>posed(strand.getPoint(t));
  let cut=1,reason='released-entire-route';
  if(group===0){
   if(point(1)[1]<=.45){let lo=0,hi=1;for(let i=0;i<24;i++){const m=(lo+hi)/2;if(point(m)[1]>.45)lo=m;else hi=m;}cut=(lo+hi)/2;reason='retained133-below-Y.45';}
   else reason='short-companion-endpoint-only';
  }
  rows.push({group,k,first,indexStart,ring:loose?2:5,steps:20,indicesPerSegment:loose?6:24,cut,reason,firstKeptSegment:Math.ceil(cut*20),endpoint:point(1)});
  const previous=representatives.get(group),distance=Math.abs(k-(COUNTS156[group]-1)/2),principal=group!==0||strand.debug133?.kind==='principal';
  if(principal&&(!previous||distance<previous.distance))representatives.set(group,{...record,point,cut,distance});
  workMs+=now()-started;
 },finish(groom){
  const fringe=find(groom,FRINGE),p=fringe.geometry.attributes.position,anchors=[0,Math.floor(p.count/2),p.count-1].map(i=>({i,p:attr(p,i)}));
  if(representatives.size!==7)throw Error('156 cannot resolve all seven accepted fringe families');
  const record={rows,detail,wisps,representatives:[...representatives.values()].sort((a,b)=>a.group-b.group),anchors,headTilt,captureMs:workMs};captures.set(groom,record);
  groom.userData.frontCapture156={version:VERSION,fringe:rows.length,detail:detail.length,wisps:wisps.length,captureMs:workMs};
 }};
}
function find(root,name){let hit=null;root.traverse(o=>{if(o.name===name){if(hit)throw Error('156 duplicate '+name);hit=o;}});if(!hit)throw Error('156 missing '+name);return hit;}
function actualGroomStats(root){let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.index.count/3;bytes+=o.geometry.index.array.byteLength;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});return{triangles,geometryMiB:Number((bytes/1048576).toFixed(2))};}
function transform(a,p){return[a[0]*p[0]+a[4]*p[1]+a[8]*p[2]+a[12],a[1]*p[0]+a[5]*p[1]+a[9]*p[2]+a[13],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]+a[14]];}
function matrixTo(target,source){const a=new THREE.Matrix4().multiplyMatrices(target.matrixWorld.clone().invert(),source.matrixWorld);if(!Number.isFinite(a.determinant())||Math.abs(a.determinant())<1e-12||!finite(a.elements))throw Error('156 invalid affine frame');return a.elements;}
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
  const scalp=mesh.name==='continuous-face',obstacle=mesh.name==='sculpted-eyelids'||mesh.name==='ear-continuous-anatomical-shell';if(!scalp&&!obstacle)return;
  const g=mesh.geometry,p=g.attributes.position,index=g.index;if(!p||!index||index.count>=1048576)throw Error('156 unsupported head layout');
  const ranges=scalp?(g.groups||[]).filter(q=>q.materialIndex===0).map(q=>[q.start,q.start+q.count]):[[0,index.count]];
  if(scalp&&!ranges.length)throw Error('156 requires actual front-material triangle membership');
  records.push({mesh,p,index,ranges,m:matrixTo(groom,mesh),scalp});
 });
 if(records.filter(r=>r.scalp).length!==1)throw Error('156 needs one continuous face');
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
function currentOffset(groom,capture){const p=find(groom,FRINGE).geometry.attributes.position,delta=sub(attr(p,capture.anchors[0].i),capture.anchors[0].p);let max=0;for(const a of capture.anchors)max=Math.max(max,len(sub(sub(attr(p,a.i),a.p),delta)));if(max>4e-7)throw Error('156 fringe no longer has a uniform prepared-frame translation');return{delta,max};}

function sampleCrown(g,side,u,t){const a=g.attributes.position,first=side<0?7685:16070,x=clamp(u)*128,y=clamp(t)*64,i=Math.min(127,Math.floor(x)),j=Math.min(63,Math.floor(y)),dx=x-i,dy=y-j;return[0,1,2].map(k=>mix(mix(a.array[(first+j*129+i)*3+k],a.array[(first+j*129+i+1)*3+k],dx),mix(a.array[(first+(j+1)*129+i)*3+k],a.array[(first+(j+1)*129+i+1)*3+k],dx),dy));}
function hpoint(a,b,da,db,t){const t2=t*t,t3=t2*t,A=2*t3-3*t2+1,B=t3-2*t2+t,C=-2*t3+3*t2,D=t3-t2;return a.map((x,k)=>A*x+B*da[k]+C*b[k]+D*db[k]);}
function derivative(point,t,h=1e-5){const a=clamp(t-h),b=clamp(t+h);return sub(point(b),point(a)).map(x=>x/(b-a));}
function interpolate(points,slopes,t){let i=0;while(i<points.length-2&&t>points[i+1].t)i++;const a=points[i],b=points[i+1],h=b.t-a.t;return hpoint(a.p,b.p,slopes[i].map(x=>x*h),slopes[i+1].map(x=>x*h),(t-a.t)/h);}
function atHeight(point,y){let lo=0,hi=1;const first=point(0),last=point(1);if(y>=first[1])return first;if(y<=last[1])return last;for(let i=0;i<22;i++){const t=(lo+hi)/2;if(point(t)[1]>y)lo=t;else hi=t;}return point((lo+hi)/2);}
function crownAtHeight(g,side,u,y){let previous=sampleCrown(g,side,u,0);for(let i=1;i<=32;i++){const p=sampleCrown(g,side,u,i/32);if(previous[1]>=y&&p[1]<=y){const t=clamp((y-previous[1])/(p[1]-previous[1]));return previous.map((v,k)=>mix(v,p[k],t));}previous=p;}return null;}

// This independent intended dense region is authored before either the
// candidate polygons or their triangulation. Coordinates are unbalanced,
// posed head-local XY. Its upper/sides use the ORIGINAL u=.625 attachment.
export const INTENDED_RAIL156=Object.freeze([
 [-.84,.59],[-.60,.94],[-.23,1.04],[.09,1.10],[.355,1.00],[.572,.845],[.76,.48]
].map(Object.freeze));
const U0=80/128,UC=88/128;
function crownAttributes(g,side,u,t){
 const first=side<0?7685:16070,x=clamp(u)*128,y=clamp(t)*64,i=Math.min(127,Math.floor(x)),j=Math.min(63,Math.floor(y)),a=x-i,b=y-j,ids=[first+j*129+i,first+j*129+i+1,first+(j+1)*129+i,first+(j+1)*129+i+1],out={};
 for(const name of['position','normal','uv','uv1','color']){const at=g.attributes[name];if(!at)throw Error('156 needs prepared crown '+name);out[name]=Array.from({length:at.itemSize},(_,k)=>mix(mix(at.array[ids[0]*at.itemSize+k],at.array[ids[1]*at.itemSize+k],a),mix(at.array[ids[2]*at.itemSize+k],at.array[ids[3]*at.itemSize+k],a),b));}
 return out;
}
const area2=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function insidePolygon(q,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i].p||poly[i],b=poly[j].p||poly[j];if(((a[1]>q[1])!==(b[1]>q[1]))&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function segmentDistance(q,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((q[0]-a[0])*dx+(q[1]-a[1])*dy)/(dx*dx+dy*dy||1));return Math.hypot(q[0]-a[0]-t*dx,q[1]-a[1]-t*dy);}
function scalarRail(table,y){
 let i=0;while(i<table.length-2&&y<table[i+1][0])i++;const a=table[i],b=table[i+1],p=table[Math.max(0,i-1)],q=table[Math.min(table.length-1,i+2)],h=a[0]-b[0],t=clamp((a[0]-y)/h),s0=(b[1]-p[1])/(p[0]-b[0]),s1=(q[1]-a[1])/(a[0]-q[0]);
 return(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*h*s0+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*h*s1;
}
function sourceAtY(row,y){
 let previous=row.point(1);if(y<=previous[1])return previous;
 for(let i=95;i>=0;i--){const p=row.point(i/96);if(p[1]>=y&&previous[1]<=y){let lo=i/96,hi=(i+1)/96;for(let k=0;k<20;k++){const m=(lo+hi)/2;if(row.point(m)[1]>y)lo=m;else hi=m;}return row.point((lo+hi)/2);}previous=p;}return row.point(0);
}
function attachmentEnvelope156(g){
 const nx=48,ny=48,box=[-1.25,.80,-.10,1.65],cells=Array.from({length:nx*ny},()=>[]),rows=[],cx=x=>clamp(Math.floor((x-box[0])/(box[1]-box[0])*nx),0,nx-1),cy=y=>clamp(Math.floor((y-box[2])/(box[3]-box[2])*ny),0,ny-1),p=g.attributes.position,uv=g.attributes.uv;
 for(let k=14976*3;k<g.index.count;k+=3){const cell=Math.floor(((k/3-14976)%16384)/2),i=cell%128;if(i<80||i>104)continue;const ids=[g.index.getX(k),g.index.getX(k+1),g.index.getX(k+2)],q=ids.map(i=>attr(p,i)),ar=area2(...q);if(ar<=1e-12)continue;const ri=rows.length;rows.push({q,u:ids.map(i=>uv.getX(i)),ar});const xs=q.map(v=>v[0]),ys=q.map(v=>v[1]);for(let y=cy(Math.min(...ys));y<=cy(Math.max(...ys));y++)for(let x=cx(Math.min(...xs));x<=cx(Math.max(...xs));x++)cells[y*nx+x].push(ri);}
 return(x,y)=>{if(x<box[0]||x>box[1]||y<box[2]||y>box[3])return null;let best=null;for(const i of cells[cy(y)*nx+cx(x)]){const r=rows[i],b=[area2([x,y],r.q[1],r.q[2])/r.ar,area2(r.q[0],[x,y],r.q[2])/r.ar];b[2]=1-b[0]-b[1];if(Math.min(...b)<-1e-7)continue;const z=r.q.reduce((s,p,j)=>s+b[j]*p[2],0);if(!best||z>best.z)best={z,u:r.u.reduce((s,u,j)=>s+b[j]*u,0)};}return best;};
}
function makePlan156(crown,capture,offset,support){
 const g=crown.geometry,rows=capture.representatives,groups=[0,1,3,4,6],roots=[.98,1.01,1.04,.94,.57],widths=[.032,.042,.038,.038,.027];
 const envelope=attachmentEnvelope156(g),upperZ=(x,y)=>{const hit=support.at(x,y),old=envelope(x,y);if(!hit)return old?.z??null;const Y=y-offset[1],X=x-offset[0],volume=.026/Math.max(.48,hit.n[2])+.047*smooth(.82,1.30,Y)+.013*Math.exp(-(((X+.37)/.46)**2)-(((Y-1.17)/.34)**2)),headZ=hit.p[2]+volume,retain=old?1-smooth(UC+.022,UC+.112,old.u):0;return old?mix(headZ,Math.max(headZ,old.z),retain):headZ;};
 const xy=[
  [[1.25,.08],[1.07,-.20],[.95,-.35],[.78,-.40]],
  [[1.28,.16],[1.08,.045],[.82,-.14],[.58,-.28]],
  [[1.28,.185],[1.17,.235],[1.04,.295],[.80,.287]],
  [[1.31,.28],[1.13,.38],[.97,.447],[.75,.447]],
  [[1.31,.37],[1.10,.58],[.95,.671],[.72,.695]]
 ];
 const branches=groups.map((group,b)=>{
  const original=rows[group],end=original.point(1),points=xy[b].slice();
  for(const y of(group===0?[.65,.45,.20,0,end[1]]:[.55,.40,end[1]])){if(y>=points.at(-1)[0])continue;const p=sourceAtY(original,y);points.push([p[1],p[0]]);}
  if(Math.abs(points.at(-1)[0]-end[1])>1e-8)points.push([end[1],end[0]]);
  const point=y=>{const x=group===0&&y<=.45?sourceAtY(original,y)[0]:scalarRail(points,y);let z=upperZ(x+offset[0],y+offset[1])??sourceAtY(original,Math.min(y,original.point(0)[1]))[2]+offset[2];if(group===0&&y<=.45)z=sourceAtY(original,y)[2]+offset[2];return[x+offset[0],y+offset[1],z];};
  const rootY=roots[b],endY=end[1],length=arcTable(t=>point(mix(rootY,endY,t)),64),total=length.at(-1);
  const width=y=>{const f=clamp((rootY-y)/(rootY-endY)),tip=1-smooth(.78,1,f);return widths[b]*(.90+.10*Math.sin(f*Math.PI))*(.30+.70*tip)*Math.sqrt(Math.max(0,1-f**8));};
  return{group,b,original,point,rootY,endY,width,total,length,end:add(end,offset),sourceEndpoint:end};
 });
 const node=(p,side,u,vv,kind,extra={})=>({p,side,uv:[u,vv],kind,...extra});
 const part=[];
 for(let i=88;i<=115;i+=3){const q=crownAttributes(g,-1,i/128,0);part.push(node(q.position,-1,i/128,0,'part',{old:q}));}
 const last=part.at(-1),pY=last.p[1]-offset[1];
 for(const y of[1.19,1.14,1.09])if(y<pY){const p=branches[2].point(y);p[2]=upperZ(p[0],p[1])??p[2];part.push(node(p,-1,mix(last.uv[0],1,clamp((pY-y)/(pY-1.09))),.73*.11*smooth(1.19,1.09,y),'part'));}
 for(let k=1;k<=18;k++){const y=mix(1.09,branches[2].endY,k/18),p=branches[2].point(y);part.push(node(p,-1,1,.73*mix(.11,1,k/18),'central-seam'));}
 const exterior=side=>{
  const a=[];for(let k=0;k<=12;k++){const u=mix(UC,.749,k/12),q=crownAttributes(g,side,u,1);a.push(node(q.position,side,u,.73,'exterior',{old:q}));}return a;
 };
 function edge(b,sign,startU,tipU,reverse=false,half=false){
  const branch=branches[b],out=[],n=24;
  for(let k=0;k<=n;k++){const f=k/n,y=mix(branch.rootY,branch.endY,f),center=branch.point(y),p=center.slice(),w=branch.width(y);p[0]+=sign*w;p[2]=upperZ(p[0],p[1])??p[2];if(branch.group===0&&y<=.45){const a=support.at(center[0],center[1]),e=support.at(p[0],p[1]);p[2]=a&&e?e.p[2]+(center[2]-a.p[2])*a.n[2]/Math.max(.25,e.n[2]):center[2];}const growth=mix(b===4?.86:.60,1,arcAt(branch.length,f)/branch.total);out.push(node(p,b<=1?-1:1,mix(startU,tipU,f),.73*growth,'outline',{branch:b,f}));}
  return reverse?out.reverse():out;
 }
 const cleft=(x,y,side,u)=>{const p=[x+offset[0],y+offset[1],0];p[2]=upperZ(p[0],p[1])??.55;return node(p,side,u,.73*.60,'outline',{cleft:true});};
 const leftEdge=[...exterior(-1),...edge(0,-1,.770,.807),...edge(0,1,.838,.807,true).slice(1),cleft(-.23,1.01,-1,.852),...edge(1,-1,.866,.902),...edge(1,1,.936,.902,true).slice(1),cleft(.09,1.07,-1,.955),...edge(2,-1,.974,1)];
 // The far continuation overlaps the retained side crown in projection.
 // Its outer side is the shared attachment boundary, not a second returning
 // lobe crossing that boundary. Its inner edge still follows group6 to its
 // accepted endpoint and the protected side volume supplies the outer bank.
 const rightCorner=crownAttributes(g,1,UC,1);
 const rightEdge=[...edge(2,1,.974,1,true),cleft(.355,.97,1,.943),...edge(3,-1,.925,.883),...edge(3,1,.840,.883,true).slice(1),cleft(.572,.815,1,.808),...edge(4,-1,.796,.784),node(rightCorner.position,1,UC,.73,'attachment',{j:64,old:rightCorner})];
 // Curved clefts and fair long connectors belong to the same occupied net.
 // Do not leave the coarse boundary as a few long straight chord edges.
 function fairOutline(input){
  const rounded=[];
  for(let i=0;i<input.length;i++){
   const q=input[i],a=input[i-1],b=input[i+1];
   if(!q.cleft||!a||!b){rounded.push(q);continue;}
   const da=len(sub(a.p,q.p)),db=len(sub(b.p,q.p)),d=Math.min(.034,da*.25,db*.25),A={...q,p:q.p.map((x,k)=>mix(x,a.p[k],d/da)),uv:q.uv.map((x,k)=>mix(x,a.uv[k],d/da))},B={...q,p:q.p.map((x,k)=>mix(x,b.p[k],d/db)),uv:q.uv.map((x,k)=>mix(x,b.uv[k],d/db))};
   for(let k=0;k<=6;k++){const t=k/6,p=A.p.map((x,j)=>(1-t)**2*x+2*t*(1-t)*q.p[j]+t*t*B.p[j]),uv=A.uv.map((x,j)=>(1-t)**2*x+2*t*(1-t)*q.uv[j]+t*t*B.uv[j]);p[2]=upperZ(p[0],p[1])??p[2];rounded.push({...q,p,uv});}
  }
  const result=[];
  for(let i=0;i<rounded.length;i++){
   const a=rounded[i],b=rounded[i+1];result.push(a);if(!b)continue;
   const length=Math.hypot(a.p[0]-b.p[0],a.p[1]-b.p[1]),n=Math.ceil(length/.034);
   if(n<2)continue;
   const previous=rounded[Math.max(0,i-1)],next=rounded[Math.min(rounded.length-1,i+2)],direction=(p,q)=>{const d=sub(q,p),l=Math.hypot(d[0],d[1]);return l?d.map(x=>x/l):sub(b.p,a.p).map(x=>x/length);},ta=direction(previous.p,b.p),tb=direction(a.p,next.p),scale=length*.82;
   for(let k=1;k<n;k++){const t=k/n,p=hpoint(a.p,b.p,ta.map(x=>x*scale),tb.map(x=>x*scale),t),uv=a.uv.map((x,j)=>mix(x,b.uv[j],t));if(!(a.old&&b.old)&&p[1]>offset[1]+.45)p[2]=upperZ(p[0],p[1])??p[2];result.push({p,uv,kind:'outline',side:a.side});}
  }
  return result;
 }
 const oldAttachment=side=>Array.from({length:65},(_,j)=>{const q=crownAttributes(g,side,UC,j/64);return node(q.position,side,UC,j/64*.73,'attachment',{j,old:q});});
 const dedupe=a=>a.filter((q,i)=>!i||len(sub(q.p,a[i-1].p))>1e-8).filter((q,i,a)=>i!==a.length-1||len(sub(q.p,a[0].p))>1e-8);
 const polygons=[
  {side:-1,boundary:dedupe([...oldAttachment(-1),...fairOutline(leftEdge).slice(1),...part.slice().reverse().slice(1)])},
  {side:1,boundary:dedupe([...part.map(q=>({...q,side:1,...(q.old?{old:crownAttributes(g,1,q.uv[0],0)}:{})})),...fairOutline(rightEdge).slice(1),...oldAttachment(1).reverse().slice(1)])}
 ];
 const denseRail=INTENDED_RAIL156.map(([x,y])=>[x+offset[0],y+offset[1]]),dense=[];
 for(let j=0;j<=64;j++){const p=sampleCrown(g,-1,U0,j/64);if(p[1]>=denseRail[0][1])dense.push(p.slice(0,2));}
 dense.push(...denseRail);
 for(let j=64;j>=0;j--){const p=sampleCrown(g,1,U0,j/64);if(p[1]>=denseRail.at(-1)[1])dense.push(p.slice(0,2));}
 return{polygons,branches,part,upperZ,denseRegion:dense,denseRail,offset,source:'Original149 attachment and predeclared head-space cleft rail; independent of emitted156 triangles'};
}

function fitPlate(controls){
 const unique=new Map();for(const c of controls){const key=Math.round(c[0]*1e7)+':'+Math.round(c[1]*1e7);if(!unique.has(key))unique.set(key,c);}
 const points=[...unique.values()],n=points.length,m=n+3,A=Array.from({length:m},()=>new Float64Array(m+1)),kernel=r2=>r2<1e-20?0:r2*Math.log(r2)*.5;
 for(let i=0;i<n;i++){const a=points[i];for(let j=0;j<n;j++){const b=points[j];A[i][j]=kernel((a[0]-b[0])**2+(a[1]-b[1])**2)+(i===j?2e-10:0);}A[i][n]=A[n][i]=1;A[i][n+1]=A[n+1][i]=a[0];A[i][n+2]=A[n+2][i]=a[1];A[i][m]=a[2];}
 for(let c=0;c<m;c++){let row=c;for(let i=c+1;i<m;i++)if(Math.abs(A[i][c])>Math.abs(A[row][c]))row=i;if(Math.abs(A[row][c])<1e-14)throw Error('156 singular smooth control net');[A[c],A[row]]=[A[row],A[c]];for(let i=c+1;i<m;i++){const f=A[i][c]/A[c][c];if(!f)continue;A[i][c]=0;for(let j=c+1;j<=m;j++)A[i][j]-=f*A[c][j];}}
 const w=new Float64Array(m);for(let i=m-1;i>=0;i--){let t=A[i][m];for(let j=i+1;j<m;j++)t-=A[i][j]*w[j];w[i]=t/A[i][i];}
 const at=(x,y)=>{let z=w[n]+x*w[n+1]+y*w[n+2],dx=w[n+1],dy=w[n+2];for(let i=0;i<n;i++){const a=x-points[i][0],b=y-points[i][1],r2=a*a+b*b;if(r2<1e-20)continue;const l=Math.log(r2);z+=w[i]*r2*l*.5;dx+=w[i]*a*(l+1);dy+=w[i]*b*(l+1);}return{z,normal:unit([-dx,-dy,1])};};
 let residual=0;for(const p of points)residual=Math.max(residual,Math.abs(at(p[0],p[1]).z-p[2]));return{at,controls:points.length,bytes:points.length*3*8+w.byteLength,maximumControlResidual:residual};
}

function triangulatePolygon(boundary,vertices){
 let ids=boundary.map(q=>q.id),area=0;for(let i=0;i<ids.length;i++){const a=vertices[ids[i]].p,b=vertices[ids[(i+1)%ids.length]].p;area+=a[0]*b[1]-a[1]*b[0];}if(area<0)ids.reverse();
 const out=[];let tries=0;
 while(ids.length>3){let ear=-1,best=-Infinity;for(let i=0;i<ids.length;i++){const a=vertices[ids[(i+ids.length-1)%ids.length]].p,b=vertices[ids[i]].p,c=vertices[ids[(i+1)%ids.length]].p,ar=area2(a,b,c);if(ar<=1e-12)continue;let blocked=false;for(let j=0;j<ids.length;j++){if(j===i||j===(i+1)%ids.length||j===(i+ids.length-1)%ids.length)continue;const p=vertices[ids[j]].p;if(area2(a,b,p)>=-1e-12&&area2(b,c,p)>=-1e-12&&area2(c,a,p)>=-1e-12){blocked=true;break;}}if(!blocked){const score=ar/(len(sub(a,b))*len(sub(b,c))+1e-15);if(score>best){best=score;ear=i;}}}
  if(ear<0)throw Error('156 invalid/non-simple front ownership polygon ('+ids.length+' vertices remain)');const a=ids[(ear+ids.length-1)%ids.length],b=ids[ear],c=ids[(ear+1)%ids.length];out.push([a,b,c]);ids.splice(ear,1);if(++tries>4000)throw Error('156 polygon clipping did not finish');
 }out.push(ids);return out;
}
function refineTriangles(triangles,vertices,boundaryEdges,field){
 let current=triangles;const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 for(let pass=0;pass<7;pass++){
  const mids=new Map();for(const t of current)for(let k=0;k<3;k++){const a=t[k],b=t[(k+1)%3],s=key(a,b);if(boundaryEdges.has(s)||mids.has(s))continue;const p=vertices[a].p,q=vertices[b].p;if(Math.hypot(p[0]-q[0],p[1]-q[1])>.065){const v={p:p.map((x,j)=>(x+q[j])*.5),uv:vertices[a].uv.map((x,j)=>(x+vertices[b].uv[j])*.5),side:vertices[a].side,kind:'interior'};v.p[2]=field.at(v.p[0],v.p[1]).z;mids.set(s,vertices.length);vertices.push(v);}}
  if(!mids.size)break;const next=[];for(const[a,b,c]of current){const ab=mids.get(key(a,b)),bc=mids.get(key(b,c)),ca=mids.get(key(c,a)),count=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);
   if(!count)next.push([a,b,c]);else if(count===3)next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);
   else if(count===1){if(ab!==undefined)next.push([a,ab,c],[ab,b,c]);else if(bc!==undefined)next.push([b,bc,a],[bc,c,a]);else next.push([c,ca,b],[ca,a,b]);}
   else if(ab===undefined)next.push([a,b,ca],[b,bc,ca],[ca,bc,c]);else if(bc===undefined)next.push([b,c,ab],[c,ca,ab],[ab,ca,a]);else next.push([c,a,bc],[a,ab,bc],[bc,ab,b]);
  }current=next;if(current.length>15000)throw Error('156 refinement exceeds coarse budget');
 }return current;
}

function improveChartDiagonals(triangles,vertices,boundaryEdges){
 const key=(a,b)=>a<b?a+':'+b:b+':'+a,sign=t=>area2(...t.map(i=>vertices[i].uv))*(vertices[t[0]].side<0?-1:1),geo=t=>area2(...t.map(i=>vertices[i].p));let flips=0;
 for(let pass=0;pass<8;pass++){
  const edges=new Map();for(let i=0;i<triangles.length;i++){const t=triangles[i];for(let k=0;k<3;k++){const a=t[k],b=t[(k+1)%3],s=key(a,b);if(boundaryEdges.has(s))continue;const rows=edges.get(s)||[];rows.push({i,a,b,c:t[(k+2)%3]});edges.set(s,rows);}}
  let changed=0;const touched=new Set();
  for(const rows of edges.values()){
   if(rows.length!==2)continue;const[A,B]=rows;if(touched.has(A.i)||touched.has(B.i)||sign(triangles[A.i])>1e-12&&sign(triangles[B.i])>1e-12)continue;
   const t=[A.c,B.c,A.b],q=[B.c,A.c,A.a];if(geo(t)<=1e-12||geo(q)<=1e-12||sign(t)<=1e-12||sign(q)<=1e-12)continue;
   triangles[A.i]=t;triangles[B.i]=q;touched.add(A.i);touched.add(B.i);changed++;
  }flips+=changed;if(!changed)break;
 }
 return{flips};
}
function fairPhysicalTriangulation(triangles,vertices,boundaryEdges){
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;let flips=0,passes=0;
 for(;passes<28;passes++){
  const edges=new Map();for(let i=0;i<triangles.length;i++){const t=triangles[i];for(let k=0;k<3;k++){const a=t[k],b=t[(k+1)%3],s=key(a,b);if(boundaryEdges.has(s))continue;const rows=edges.get(s)||[];rows.push({i,a,b,c:t[(k+2)%3]});edges.set(s,rows);}}
  const touched=new Set();let changed=0;
  for(const rows of edges.values()){
   if(rows.length!==2)continue;const[A,B]=rows;if(touched.has(A.i)||touched.has(B.i))continue;const t=[A.c,B.c,A.b],q=[B.c,A.c,A.a];if(area2(...t.map(i=>vertices[i].p))<=1e-13||area2(...q.map(i=>vertices[i].p))<=1e-13)continue;
   const d=vertices[B.c].p,a=sub(vertices[A.a].p,d),b=sub(vertices[A.b].p,d),c=sub(vertices[A.c].p,d),det=(a[0]*a[0]+a[1]*a[1])*(b[0]*c[1]-b[1]*c[0])-(b[0]*b[0]+b[1]*b[1])*(a[0]*c[1]-a[1]*c[0])+(c[0]*c[0]+c[1]*c[1])*(a[0]*b[1]-a[1]*b[0]);if(det<=1e-14)continue;
   triangles[A.i]=t;triangles[B.i]=q;touched.add(A.i);touched.add(B.i);changed++;
  }flips+=changed;if(!changed)break;
 }return{flips,passes};
}
function solveGrowthChart(vertices,triangles){
 const neighbors=Array.from({length:vertices.length},()=>new Set());for(const t of triangles)for(let k=0;k<3;k++){neighbors[t[k]].add(t[(k+1)%3]);neighbors[t[(k+1)%3]].add(t[k]);}
 const moving=[],id=new Int32Array(vertices.length).fill(-1);for(let i=0;i<vertices.length;i++)if(vertices[i].kind==='interior'){id[i]=moving.length;moving.push(i);}
 const N=moving.length,degree=new Float64Array(N),adj=[],boundary=[];for(let j=0;j<N;j++){const ns=[...neighbors[moving[j]]];degree[j]=ns.length;adj.push(Int32Array.from(ns.filter(i=>id[i]>=0).map(i=>id[i])));boundary.push(ns.filter(i=>id[i]<0));}
 const apply=(x,out)=>{for(let i=0;i<N;i++){let y=degree[i]*x[i];for(const j of adj[i])y-=x[j];out[i]=y;}};const stats=[];
 for(let channel=0;channel<2;channel++){
  const x=Float64Array.from(moving.map(i=>vertices[i].uv[channel])),rhs=Float64Array.from(boundary.map(ns=>ns.reduce((s,i)=>s+vertices[i].uv[channel],0))),r=new Float64Array(N),d=new Float64Array(N),Ad=new Float64Array(N);apply(x,Ad);let rz=0;for(let i=0;i<N;i++){r[i]=rhs[i]-Ad[i];d[i]=r[i]/degree[i];rz+=r[i]*d[i];}let iterations=0,residual=0;
  for(;iterations<500&&rz>1e-22;iterations++){apply(d,Ad);let den=0;for(let i=0;i<N;i++)den+=d[i]*Ad[i];if(!(den>0))break;const a=rz/den;let next=0;for(let i=0;i<N;i++){x[i]+=a*d[i];r[i]-=a*Ad[i];next+=r[i]*r[i]/degree[i];}const b=next/rz;for(let i=0;i<N;i++)d[i]=r[i]/degree[i]+b*d[i];rz=next;}
  for(let i=0;i<N;i++){vertices[moving[i]].uv[channel]=x[i];residual=Math.max(residual,Math.abs(r[i]));}stats.push({channel,iterations,maximumLaplacianResidual:residual});
 }return{interiorVertices:N,channels:stats};
}

function makeSurface156(crown,plan,support){
 const started=now(),phases={},g=crown.geometry,vertices=[],triangles=[],collarCount=[],collarMap=new Map(),controls=[];
 const key=(a,b)=>a<b?a+':'+b:b+':'+a;
 for(const side of[-1,1]){
  const first=vertices.length;for(let j=0;j<=64;j++)for(let i=80;i<=88;i++){const q=crownAttributes(g,side,i/128,j/64),id=vertices.length;vertices.push({p:q.position,uv:q.uv,side,kind:'collar',old:q,id});collarMap.set(side+':'+j+':'+i,id);}
  for(let j=0;j<64;j++)for(let i=0;i<8;i++){const a=first+j*9+i,b=a+9;if(side>0)triangles.push([a,a+1,b],[a+1,b+1,b]);else triangles.push([a,b,a+1],[a+1,b,b+1]);}
  collarCount.push(vertices.length-first);
  for(let j=0;j<=64;j+=2){controls.push(sampleCrown(g,side,UC,j/64));if(j&&j<64)controls.push(sampleCrown(g,side,90/128,j/64));}
 }
 const nCollar=vertices.length,outlineSegments=[],boundaryEdges=new Set();
 for(const poly of plan.polygons){
  for(let i=0;i<poly.boundary.length;i++){const q=poly.boundary[i];if(q.kind==='attachment')q.id=collarMap.get(poly.side+':'+q.j+':88');else if(len(sub(q.p,sampleCrown(g,poly.side,UC,0)))<1e-8)q.id=collarMap.get(poly.side+':0:88');else{q.id=vertices.length;vertices.push({...q,side:poly.side});}if(q.kind!=='attachment'&&(i%3===0||q.f===0||q.f===1||q.cleft))controls.push(q.p);}
  for(let i=0;i<poly.boundary.length;i++){const a=poly.boundary[i],b=poly.boundary[(i+1)%poly.boundary.length];boundaryEdges.add(key(a.id,b.id));if(a.kind==='outline'&&b.kind==='outline')outlineSegments.push([a.p,b.p]);}
 }
 // Sparse actual-head controls give the filled interior its shape. They are
 // independent of tessellation, and are not final-vertex depth clamps.
 for(let y=plan.offset[1]+.48;y<plan.offset[1]+1.49;y+=.12)for(let x=plan.offset[0]-.76;x<plan.offset[0]+.75;x+=.12){if(!plan.polygons.some(p=>insidePolygon([x,y],p.boundary)))continue;let distance=Infinity;for(const p of plan.polygons)for(let i=0;i<p.boundary.length;i++)distance=Math.min(distance,segmentDistance([x,y],p.boundary[i].p,p.boundary[(i+1)%p.boundary.length].p));if(distance<.045)continue;const z=plan.upperZ(x,y);if(z!==null)controls.push([x,y,z]);}
 for(const branch of plan.branches)for(let k=0;k<=12;k++){const p=branch.point(mix(branch.rootY,branch.endY,k/12));controls.push(p);}
 phases.controlsMs=now()-started;let mark=now();const field=fitPlate(controls);phases.smoothFieldSolveMs=now()-mark;mark=now();const fresh=[];for(const poly of plan.polygons)fresh.push(...triangulatePolygon(poly.boundary,vertices));phases.triangulationMs=now()-mark;mark=now();
 const refined=refineTriangles(fresh,vertices,boundaryEdges,field),physicalDiagonals=fairPhysicalTriangulation(refined,vertices,boundaryEdges);triangles.push(...refined);phases.refinementMs=now()-mark;mark=now();
 // Positive averaging keeps the boundary's actual growth coordinates and
 // smooths the interior chart; no pigment or material parameters are changed.
 const growthChart=solveGrowthChart(vertices,refined);
 const chartDiagonals=improveChartDiagonals(refined,vertices,boundaryEdges);triangles.length=2048;triangles.push(...refined);
 phases.uvSmoothingMs=now()-mark;mark=now();
 const pos=[],uv=[],uv1=[],color=[],normal=[],metrics={vertices:vertices.length,triangles:triangles.length,copiedCollarVertices:nCollar,copiedCollarTriangles:2048,fieldControls:field.controls,fieldBytes:field.bytes,temporarySolveBytes:(field.controls+3)*(field.controls+4)*8,maximumControlResidual:field.maximumControlResidual,minimumNewNormalGap:Infinity,minimumCopiedNormalGap:Infinity,supportSamples:0,supportMisses:0,newPenetrations:0,copiedPenetrations:0,nonfinite:0,negativeFrontArea:0,minimumFrontArea:Infinity,maximumEdgeLength:0,uvNegative:0,uvDegenerate:0,chartDiagonals,physicalDiagonals,growthChart,maximumBoundaryNormalDegrees:null};
 for(const q of vertices){
  if(!q.old&&q.kind==='interior')q.p[2]=field.at(q.p[0],q.p[1]).z;
  let alpha=1;if(!q.old){let d=Infinity;for(const[a,b]of outlineSegments)d=Math.min(d,segmentDistance(q.p,a,b));alpha=smooth(0,.008,d);if(q.kind==='part'||q.kind==='central-seam')alpha=1;}
  const old=q.old||crownAttributes(g,q.side,q.uv[0],clamp(q.uv[1]/.73));pos.push(...q.p);uv.push(...q.uv);uv1.push(...(q.old?q.old.uv1:[((q.side>0?1024:0)+16+q.uv[0]*992)/2048,(16+q.uv[1]*992)/2048]));color.push(old.color[0],old.color[1],old.color[2],q.old?old.color[3]:alpha);normal.push(...(q.old?q.old.normal:field.at(q.p[0],q.p[1]).normal));
  if(!finite(q.p)||!finite(q.uv))metrics.nonfinite++;
  if(q.kind!=='collar'){const hit=support.at(q.p[0],q.p[1]);if(hit){const gap=(q.p[2]-hit.p[2])*hit.n[2],old=!!q.old;metrics[old?'minimumCopiedNormalGap':'minimumNewNormalGap']=Math.min(metrics[old?'minimumCopiedNormalGap':'minimumNewNormalGap'],gap);metrics.supportSamples++;if(gap<-.0005)metrics[old?'copiedPenetrations':'newPenetrations']++;}else metrics.supportMisses++;}
 }
 for(let ti=2048;ti<triangles.length;ti++){const t=triangles[ti],a=vertices[t[0]],b=vertices[t[1]],c=vertices[t[2]],ar=area2(a.p,b.p,c.p),uva=area2(a.uv,b.uv,c.uv)*(a.side<0?-1:1);metrics.minimumFrontArea=Math.min(metrics.minimumFrontArea,ar);if(ar<=0)metrics.negativeFrontArea++;if(uva<-1e-12)metrics.uvNegative++;if(Math.abs(uva)<1e-12)metrics.uvDegenerate++;for(let k=0;k<3;k++)metrics.maximumEdgeLength=Math.max(metrics.maximumEdgeLength,len(sub(vertices[t[k]].p,vertices[t[(k+1)%3]].p)));}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('uv1',new THREE.Float32BufferAttribute(uv1,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(color,4));geometry.setIndex(triangles.flat());geometry.computeVertexNormals();
 const emittedNormals=geometry.attributes.normal,seams=new Map();for(let i=0;i<vertices.length;i++){const q=vertices[i];if(q.kind==='collar'||q.kind==='exterior'&&q.old){emittedNormals.setXYZ(i,...q.old.normal);continue;}if(q.kind==='part'||q.kind==='central-seam'){const key=q.p.map(x=>Math.round(x*1e7)).join(':'),rows=seams.get(key)||[];rows.push(i);seams.set(key,rows);}}
 for(const rows of seams.values())if(rows.length>1){const n=unit(rows.map(i=>attr(emittedNormals,i)).reduce((s,n)=>add(s,n),[0,0,0]));for(const i of rows)emittedNormals.setXYZ(i,...n);}geometry.computeBoundingSphere();
 metrics.geometryBytes=geometry.index.array.byteLength+Object.values(geometry.attributes).reduce((s,a)=>s+a.array.byteLength,0);
 phases.emittedAttributesAndVertexSupportMs=now()-mark;metrics.phases=phases;metrics.surfaceTotalMs=now()-started;
 return{geometry,vertices,triangles,field,metrics,outlineSegments,plan};
}

function retireCrown156(g){
 if(g.attributes.position.count!==24455||g.index.count!==47744*3)throw Error('156 legacy crown layout changed');
 const cut=filteredIndex(g,k=>{const f=k/3;if(f<14976)return false;const cell=Math.floor(((f-14976)%16384)/2);return cell%128>=80;});if(cut.removed!==12288)throw Error('156 index retirement changed');return cut;
}
export function applyFrontRoot156(groom,head,{strength=0}={}){
 if(strength!==0&&strength!==1)throw Error('156 has one coarse OFF/ON mode');const previous=applications.get(groom);if(previous){if(strength!==1)throw Error('156 already applied; use a fresh groom');return previous.metrics;}if(!strength)return ZERO;
 const capture=captures.get(groom);if(!capture)throw Error('156 needs its optional accepted-source registry');const started=now(),crown=find(groom,CROWN),material=crown.material;
 if(!find(head,'continuous-face').geometry.userData?.eyeContour147)throw Error('156 must run after actual147 preparation');
 if(!material.isMeshPhysicalMaterial||material.color.toArray().some(x=>x!==1)||!crown.geometry.attributes.uv1||!material.alphaMap)throw Error('156 needs prepared100 CROWN before the once-only149 tint');
 const{delta,max}=currentOffset(groom,capture),support=supportIndex(groom,head);let mark=now();const plan=makePlan156(crown,capture,delta,support),planMs=now()-mark,surface=makeSurface156(crown,plan,support),cut=retireCrown156(crown.geometry),privateMaterial=material.clone();privateMaterial.userData={};
 if(surface.metrics.nonfinite||surface.metrics.negativeFrontArea)throw Error('156 invalid emitted coarse surface: '+JSON.stringify(surface.metrics));
 const mesh=new THREE.Mesh(surface.geometry,privateMaterial);mesh.name=FRONT_MESH156;mesh.castShadow=crown.castShadow;mesh.receiveShadow=crown.receiveShadow;groom.add(mesh);crown.geometry.setIndex(cut.next);
 const metrics={version:VERSION,strength:1,applied:true,sourceCaptureMs:capture.captureMs,preparedTranslation:delta,translationAnchorResidual:max,...surface.metrics,planMs,removedTriangles:cut.removed,addedTriangles:surface.metrics.triangles,addedTextureBytes:0,perFrameWork:0,support:{...support.metrics},elapsedMs:now()-started};
 const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),continuousCrownSheets:0,partialCrownSheets:2,closedInsetScalp:true,frontRoot156:metrics};applications.set(groom,{metrics,capture,crown,cut,mesh,support,surface,plan,originalUserData});return metrics;
}



export function setCoarseIsolation156(groom,enabled=true){
 if(!enabled)return restoreCoarseIsolation156(groom);const old=isolations.get(groom);if(old)return old.metrics;
 const capture=captures.get(groom);if(!capture)throw Error('156 coarse isolation needs capture');const changes=[],metrics={version:'coarse-hidden-upstream156',hidden:[]};
 for(const[name,rows]of[[DETAIL,capture.detail],[WISPS,capture.wisps]]){
  const mesh=find(groom,name),owned=new Uint8Array(mesh.geometry.attributes.position.count);for(const row of rows)owned.fill(1,row.first,row.first+row.count);
  const cut=filteredIndex(mesh.geometry,(k,index)=>{const a=owned[index.getX(k)],b=owned[index.getX(k+1)],c=owned[index.getX(k+2)];if(a||b||c){if(!(a&&b&&c))throw Error('156 fine ownership cuts a triangle');return true;}return false;});changes.push({mesh,...cut});metrics.hidden.push({mesh:name,removedTriangles:cut.removed,rows});
 }
 const fringe=find(groom,FRINGE),ranges=capture.rows.map(r=>({group:r.group,k:r.k,start:r.indexStart,count:r.firstKeptSegment*r.indicesPerSegment,cut:r.cut,cutArc:r.cutArc,length:r.length,firstKeptSegment:r.firstKeptSegment}));let r=0;
 const cut=filteredIndex(fringe.geometry,k=>{while(r<ranges.length&&k>=ranges[r].start+ranges[r].count)r++;return r<ranges.length&&k>=ranges[r].start&&k<ranges[r].start+ranges[r].count;});changes.push({mesh:fringe,...cut});metrics.hidden.push({mesh:FRINGE,removedTriangles:cut.removed,ranges});
 metrics.additionalDiagnosticIndexBytes=changes.reduce((s,c)=>s+c.next.array.byteLength,0);metrics.removedTriangles=changes.reduce((s,c)=>s+c.removed,0);
 for(const change of changes)change.mesh.geometry.setIndex(change.next);const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),coarseIsolation156:metrics};isolations.set(groom,{changes,metrics,originalUserData});return metrics;
}
export function restoreCoarseIsolation156(groom){const old=isolations.get(groom);if(!old)return{restored:false};for(const c of old.changes)c.mesh.geometry.setIndex(c.old);groom.userData=old.originalUserData;isolations.delete(groom);return{restored:true};}
export function getFrontRoot156QA(groom){return{capture:captures.get(groom),application:applications.get(groom),isolation:isolations.get(groom)};}
export function releaseFrontRoot156(groom){restoreCoarseIsolation156(groom);const a=applications.get(groom);if(!a)return{released:false};a.crown.geometry.setIndex(a.cut.old);groom.remove(a.mesh);a.mesh.geometry.dispose();a.mesh.material.dispose();groom.userData=a.originalUserData;applications.delete(groom);return{released:true};}
