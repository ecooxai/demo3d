import * as THREE from 'three';

// Isolated150 coarse architecture. Legacy vertex arrays and materials are
// read-only; the only legacy geometry changes are reversible index selections.
const VERSION='continuous-front-root-150';
export const FRONT_MESH150='Continuous scalp-to-fringe member locks150';
const CROWN='Continuous parted crown with longitudinal fiber flow',MASS='Overlapping layered S-wave hair around front back and shoulders',DETAIL='Independent fine crown lengths and silhouette strands',FRINGE='Dense fine bowed brown fringe strands',WISPS='Sparse short temple edge and hairline wisps';
const captures=new WeakMap(),applications=new WeakMap(),isolations=new WeakMap();
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,addedTriangles:0,removedTriangles:0,addedGeometryBytes:0,addedTextureBytes:0,perFrameWork:0,elapsedMs:0});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const v=(x=0,y=0,z=0)=>[x,y,z],add=(a,b,s=1)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>{const l=len(a);if(l<1e-12)throw Error('150 zero direction');return a.map(q=>q/l);};
const attr=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)],finite=a=>a.every(Number.isFinite),now=()=>performance.now();
function find(root,name){let hit=null;root.traverse(o=>{if(o.name===name){if(hit)throw Error('150 duplicate '+name);hit=o;}});if(!hit)throw Error('150 missing '+name);return hit;}
function actualGroomStats(root){let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.index.count/3;bytes+=o.geometry.index.array.byteLength;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});return{triangles,geometryMiB:Number((bytes/1048576).toFixed(2))};}
function transform(a,p){return[a[0]*p[0]+a[4]*p[1]+a[8]*p[2]+a[12],a[1]*p[0]+a[5]*p[1]+a[9]*p[2]+a[13],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]+a[14]];}
function matrixTo(target,source){const a=new THREE.Matrix4().multiplyMatrices(target.matrixWorld.clone().invert(),source.matrixWorld);if(!Number.isFinite(a.determinant())||Math.abs(a.determinant())<1e-12||!finite(a.elements))throw Error('150 invalid affine frame');return a.elements;}
function arcTable(point,n=96,positions=null){const s=new Float64Array(n+1);let previous=point(0);if(positions)positions.set(previous,0);for(let i=1;i<=n;i++){const p=point(i/n);s[i]=s[i-1]+len(sub(p,previous));if(positions)positions.set(p,i*3);previous=p;}return s;}
function arcAt(table,t){const q=clamp(t)*(table.length-1),i=Math.min(table.length-2,Math.floor(q));return mix(table[i],table[i+1],q-i);}
function inverseArc(table,s){let lo=0,hi=table.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(table[m]<s)lo=m;else hi=m;}return(lo+clamp((s-table[lo])/(table[hi]-table[lo]||1)))/(table.length-1);}
const FAMILY_COUNTS=[7,4,3,5,3,2],COUNTS=[270,245,105,300,120,95],CUT_Y=[.30,.32,.33,.30,.27,.20];
const selected=new Map();
for(let group=0;group<6;group++){
 const used=new Set(),n=COUNTS[group],count=FAMILY_COUNTS[group],first=FAMILY_COUNTS.slice(0,group).reduce((s,n)=>s+n,0);
 const near=[2,92,182,32,152,252,5,115,225,48,78,108,100,130,160,176,196,216,228,248,268];
 for(let f=0;f<count;f++)for(let member=0;member<3;member++){
  const target=group===0?near[f*3+member]:Math.floor((f*3+member+.5)/(count*3)*n);let k=-1;
  for(let d=0;d<n&&k<0;d++)for(const q of[d?target-d:target,target+d])if(q>=0&&q<n&&!used.has(q)&&(q%4===0||(q*37+group*11)%13<10)){k=q;break;}
  if(k<0)throw Error('150 representative selection failed');used.add(k);selected.set(group+':'+k,{family:first+f,familyInGroup:f,member});
 }
}

/** Optional constructor registry only; no source emission or RNG changes. */
export function createFrontCapture150({headTilt=-.17}={}){
 let workMs=0;const rows=[],members=[],detail=[],wisps=[];
 // All accepted FRINGE vertices explicitly bypass earDepth. Apply only their
 // existing inverse-gravity transform here, exactly as makeMesh does.
 const posed=point=>{const {x,y,z}=point,w=1-smooth(-1.64,.38,y),ay=-.16*w,az=-headTilt*w,xx=x*Math.cos(ay)+z*Math.sin(ay);return[xx*Math.cos(az)-y*Math.sin(az),xx*Math.sin(az)+y*Math.cos(az),-x*Math.sin(ay)+z*Math.cos(ay)];};
 return{detail,wisps,fringe(record){
  const started=now(),{group,k,strand,loose,first,indexStart}=record,point=t=>posed(strand.getPoint(t)),positions=new Float64Array(97*3),table=arcTable(point,96,positions),length=table.at(-1),target=CUT_Y[group];
  let cut=inverseArc(table,length*.85),reason='minimum15percent-tail';
  for(let i=1;i<table.length;i++){const a=(i-1)/(table.length-1),b=i/(table.length-1);if(positions[(i-1)*3+1]>target&&positions[i*3+1]<=target){let lo=a,hi=b;for(let j=0;j<22;j++){const m=(lo+hi)/2;if(point(m)[1]>target)lo=m;else hi=m;}const candidate=(lo+hi)/2;if(candidate<cut){cut=candidate;reason='target-height';}break;}}
  const row={group,k,first,indexStart,ring:loose?2:5,steps:20,indicesPerSegment:loose?6:24,cut,cutArc:arcAt(table,cut),length,reason,cutPoint:point(cut),firstKeptSegment:Math.ceil(cut*20)};rows.push(row);
  const pick=selected.get(group+':'+k);if(pick)members.push({...record,...pick,...row,point,table});workMs+=now()-started;
 },finish(groom){
  if(rows.length!==938||members.length!==72||detail.length!==575||wisps.length!==310)throw Error('150 registry population changed');
  const fringe=find(groom,FRINGE),p=fringe.geometry.attributes.position,anchors=[0,Math.floor(p.count/2),p.count-1].map(i=>({i,p:attr(p,i)}));
  const crown=find(groom,CROWN),color=crown.geometry.attributes.color,sourceColor=new Float32Array(2*129*3);for(let side=0;side<2;side++)for(let i=0;i<=128;i++)for(let k=0;k<3;k++)sourceColor[(side*129+i)*3+k]=color.array[((side?16070:7685)+i)*4+k];
  const record={rows,members:members.sort((a,b)=>a.family-b.family||a.member-b.member),detail,wisps,anchors,headTilt,captureMs:workMs,sourceColor};captures.set(groom,record);
  groom.userData.frontCapture150={version:VERSION,fringe:rows.length,members:members.length,detail:detail.length,wisps:wisps.length,captureMs:record.captureMs};
 }};
}

// Two-pass packed XY index of actual indexed front scalp/obstacle triangles.
// It holds triangle offsets, not copied head vertices or an analytic surface.
function supportIndex(groom,head){
 const start=now();groom.updateWorldMatrix(true,true);head.updateWorldMatrix(true,true);
 const records=[];
 head.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const scalp=mesh.name==='continuous-face',obstacle=mesh.name==='sculpted-eyelids'||mesh.name==='ear-continuous-anatomical-shell';if(!scalp&&!obstacle)return;
  const g=mesh.geometry,p=g.attributes.position,index=g.index;if(!p||!index||index.count>=1048576)throw Error('150 unsupported head layout');
  const ranges=scalp?(g.groups||[]).filter(q=>q.materialIndex===0).map(q=>[q.start,q.start+q.count]):[[0,index.count]];
  if(scalp&&!ranges.length)throw Error('150 requires actual front-material triangle membership');
  records.push({mesh,p,index,ranges,m:matrixTo(groom,mesh),scalp});
 });
 if(records.filter(r=>r.scalp).length!==1)throw Error('150 needs one continuous face');
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
function retireCrown(g){
 if(g.attributes.position.count!==24455||g.index.count!==47744*3)throw Error('150 legacy crown topology changed');
 const r=filteredIndex(g,k=>{const f=k/3;if(f<14976){const cell=Math.floor(f/2),i=cell%144,j=Math.floor(cell/144);return i>=54&&i<=89&&j>=32;}const side=f<14976+16384?0:1,cell=Math.floor((f-14976-side*16384)/2),i=cell%128;return i>=(side?96:97);});
 if(r.removed!==9504)throw Error('150 retirement count changed');return r;
}

function currentOffset(groom,capture){const p=find(groom,FRINGE).geometry.attributes.position,delta=sub(attr(p,capture.anchors[0].i),capture.anchors[0].p);let max=0;for(const a of capture.anchors)max=Math.max(max,len(sub(sub(attr(p,a.i),a.p),delta)));if(max>4e-7)throw Error('150 fringe no longer has a uniform prepared-frame translation');return{delta,max};}

function sampleCrown(g,side,u,t){const a=g.attributes.position,first=side<0?7685:16070,x=clamp(u)*128,y=clamp(t)*64,i=Math.min(127,Math.floor(x)),j=Math.min(63,Math.floor(y)),dx=x-i,dy=y-j;return[0,1,2].map(k=>mix(mix(a.array[(first+j*129+i)*3+k],a.array[(first+j*129+i+1)*3+k],dx),mix(a.array[(first+(j+1)*129+i)*3+k],a.array[(first+(j+1)*129+i+1)*3+k],dx),dy));}
function hpoint(a,b,da,db,t){const t2=t*t,t3=t2*t,A=2*t3-3*t2+1,B=t3-2*t2+t,C=-2*t3+3*t2,D=t3-t2;return a.map((x,k)=>A*x+B*da[k]+C*b[k]+D*db[k]);}
function derivative(point,t,h=1e-5){const a=clamp(t-h),b=clamp(t+h);return sub(point(b),point(a)).map(x=>x/(b-a));}
function interpolate(points,slopes,t){let i=0;while(i<points.length-2&&t>points[i+1].t)i++;const a=points[i],b=points[i+1],h=b.t-a.t;return hpoint(a.p,b.p,slopes[i].map(x=>x*h),slopes[i+1].map(x=>x*h),(t-a.t)/h);}
function atHeight(point,y){let lo=0,hi=1;const first=point(0),last=point(1);if(y>=first[1])return first;if(y<=last[1])return last;for(let i=0;i<22;i++){const t=(lo+hi)/2;if(point(t)[1]>y)lo=t;else hi=t;}return point((lo+hi)/2);}
function crownAtHeight(g,side,u,y){let previous=sampleCrown(g,side,u,0);for(let i=1;i<=32;i++){const p=sampleCrown(g,side,u,i/32);if(previous[1]>=y&&p[1]<=y){const t=clamp((y-previous[1])/(p[1]-previous[1]));return previous.map((v,k)=>mix(v,p[k],t));}previous=p;}return null;}

function makeRoute(member,crown,capture,offset,support,metrics){
 const {group,familyInGroup:f,member:m,side,cut}=member,count=FAMILY_COUNTS[group],q=count>1?f/(count-1):.5,phase=member.family*2.399+.57*m;
 const ranges=[[.758,.837],[.847,.907],[.919,.949],[.946,.857],[.842,.802],[.785,.752]],u=mix(...ranges[group],q)+(m-1)*.0026+.0011*Math.sin(phase),oldRoot=sampleCrown(crown,side,u,0),source=t=>add(member.point(t),offset),C=source(cut);
 const seed=oldRoot.slice();seed[0]+=side*(.0075+.0015*Math.sin(phase));const scalp=support.nearestScalp(seed);
 if(!scalp)throw Error('150 root has no actual scalp support '+group+'/'+f+'/'+m);
 const rootGap=.0105+.0020*(.5+.5*Math.sin(phase)),depth=.0025+.0025*(.5+.5*Math.cos(phase*.71)),R=add(scalp.p,scalp.n,rootGap+depth*.30);
 const rootMove=len(sub(R,oldRoot));metrics.maximumRootDisplacement=Math.max(metrics.maximumRootDisplacement,rootMove);if(rootMove>.160001)throw Error('150 actual root displacement exceeds .16: '+rootMove);
 // The short root arch grows into the existing crown volume. Its endpoint is
 // private to this member; the remaining route is strictly descending in Y.
 const border=group===0?(f<2?1:f===2?.35:0):group===5&&f===count-1?1:0,boundaryU=(side<0?97/128:96/128)+(m-1)*.0016+(group===0&&f===1?.0013:0),flowU=border===1?boundaryU:u;
 const A=sampleCrown(crown,side,flowU,.072+.013*Math.sin(phase));A[0]+=side*(border===1?.0015:.008+.003*Math.sin(phase));A[2]+=border===1?.0015:.005+.003*Math.sin(phase*.81);
 if(A[1]<C[1]+.22)throw Error('150 inadequate root-to-trace span');
 const h=A[1]-C[1],points=[{t:0,p:A}],releaseY=side<0?.76:.59,releaseEdge=border===1?crownAtHeight(crown,side,flowU,Math.max(releaseY,C[1]+.22)):null;
 const intermediate=border===1?[.12,.27,.46,.67,.84,clamp((A[1]-releaseY)/h,.08,.92)].sort((a,b)=>a-b).filter((t,i,a)=>!i||t-a[i-1]>.012):[.31,.66];
 for(const t of intermediate){
  const y=mix(A[1],C[1],t),accepted=atHeight(source,y),edge=crownAtHeight(crown,side,flowU,y);let x=accepted[0];
  // The released upper source bow is only a direction guide. A boundary
  // member leaves its edge toward the retained trace directly, rather than
  // first returning inward to an obsolete upstream point and making a hook.
  if(releaseEdge&&y<releaseEdge[1])x=mix(releaseEdge[0],C[0],clamp((releaseEdge[1]-y)/(releaseEdge[1]-C[1])));
  const edgeWeight=border===1?smooth(C[1]+.06,Math.max(C[1]+.22,releaseY),y):border*(1-smooth(.46,.94,t));
  if(edge)x=mix(x,edge[0]+side*.0015,edgeWeight);
  x+=(m-1)*.0035*Math.sin(t*Math.PI)+.003*Math.sin(phase)*Math.sin(t*Math.PI);
  const hit=support.at(x,y),gap=.027+.028*Math.sin(t*Math.PI)+.004*Math.sin(phase*.83);let z=hit?hit.p[2]+gap/Math.max(.4,hit.n[2]):accepted[2];
  if(edge&&border)z=mix(z,Math.max(z,edge[2]+(border===1?.0015:.006)),edgeWeight);
  points.push({t,p:[x,y,z]});
 }
 points.push({t:1,p:C});
 const oldD=derivative(source,cut),slopes=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];return sub(b.p,a.p).map(x=>x/(b.t-a.t));});
 if(oldD[1]>=-1e-6)throw Error('150 retained trace is not descending');slopes[slopes.length-1]=oldD.map(x=>x*(-h/oldD[1]));
 for(const s of slopes)s[1]=-h;
 let lift=0;
 const body=t=>{const p=interpolate(points,slopes,t),w=16*t*t*(1-t)*(1-t);p[2]+=lift*w;return p;};
 // A broad smooth correction resolves finite-width support between controls.
 // There is no per-vertex Z clamp and no individually fitted piecewise depth.
 for(let pass=0;pass<2;pass++)for(let i=1;i<32;i++){
  const t=i/32,p=body(t),hit=support.at(p[0],p[1]);if(!hit)continue;const need=hit.p[2]+.014/Math.max(.35,hit.n[2])+depth-p[2],w=16*t*t*(1-t)*(1-t);if(need>0&&w>.018)lift+=need/w;
 }
 metrics.maximumSmoothBodyLift=Math.max(metrics.maximumSmoothBodyLift,lift);if(lift>.105)throw Error('150 body requires excessive support correction '+lift);
 // Do not force a tight turn back through the old crown entry. Advance the
 // private entry along the same descending body until chord and outgoing flow
 // agree. This is a geometric angle bound, not a different artistic variant.
 let entry=0;if(border!==1)for(let i=0;i<=20;i++){entry=i*.01;const p=body(entry),d=unit(derivative(body,entry));if(dot(unit(sub(p,R)),d)>.57)break;}
 const B=body(entry),bodyD=unit(derivative(body,entry)),rootDistance=len(sub(B,R)),rootD=unit(add(unit(sub(B,R)),scalp.n,.20));
 let rootPoint=t=>hpoint(R,B,rootD.map(x=>x*rootDistance*.96),bodyD.map(x=>x*rootDistance*1.15),t),S=null;
 if(border===1){
  // The retained cut is above the actual scalp. These nine existing members
  // first arch into that old volume, then follow its boundary before joining
  // their own unequal descending traces. There is no extra carrier surface.
  const edge=t=>sampleCrown(crown,side,flowU,t);S=edge(.0018);S[2]+=.0015;
  const d=unit(derivative(edge,.0018)),l0=len(sub(S,R)),l1=len(sub(B,S)),c=l0/(l0+l1),da=scalp.n.map(x=>x*l0*.80),db=d.map(x=>x*l0*.90),dc=d.map(x=>x*l1*.90),dd=bodyD.map(x=>x*l1);
  rootPoint=t=>t<c?hpoint(R,S,da,db,t/c):hpoint(S,B,dc,dd,(t-c)/(1-c));
 }
 const bodyPoint=t=>body(mix(entry,1,t)),tailPoint=t=>source(mix(cut,1,t));
 const segments=[rootPoint,bodyPoint,tailPoint],tables=segments.map((s,i)=>arcTable(s,i===0?32:64)),lengths=tables.map(t=>t.at(-1)),total=lengths.reduce((s,x)=>s+x,0),cuts=[0,lengths[0]/total,(lengths[0]+lengths[1])/total,1];
 const point=t=>{t=clamp(t);let i=t<=cuts[1]?0:t<=cuts[2]?1:2;const s=(t-cuts[i])*total;return segments[i](inverseArc(tables[i],clamp(s,0,lengths[i])));};
 let rootSampling=null;if(border===1){rootSampling=new Float64Array(97);let previous=point(0),oldDirection=unit(derivative(point,0));for(let i=1;i<=96;i++){const t=cuts[1]*i/96,p=point(t),d=unit(derivative(point,t)),turn=Math.acos(clamp(dot(oldDirection,d),-1,1));rootSampling[i]=rootSampling[i-1]+len(sub(p,previous))+.05*turn;previous=p;oldDirection=d;}}
 const widest=.0105+.0105*(.5+.5*Math.sin(phase*.61+.5)),halfWidth=widest*[1,.72,.50][m],taperDistance=.17+.19*(.5+.5*Math.sin(member.family*1.19+m*.73)),shape=t=>{
  const s=t*total,traceStart=cuts[2]*total,tail=1-smooth(traceStart,Math.min(total,traceStart+.22),s),core=1-smooth(Math.max(lengths[0]+.08,traceStart-taperDistance),traceStart,s),rootGrow=.22+.78*smooth(0,lengths[0]+.07,s);
  return{width:rootGrow*(halfWidth*core+.00065*(1-core)*tail+.000035*(1-tail)),depth:rootGrow*(depth*core+.00045*(1-core)*tail+.000025*(1-tail))};
 };
 const ci=(side<0?0:129)+Math.round(u*128),color=[0,1,2].map(k=>capture.sourceColor[ci*3+k]);
 return{...member,u,phase,R,A,B,C,S,entry,rootRows:border===1?12:8,rootSampling,boundaryOverlap:border===1,rootMove,rootGap,depth,point,shape,total,cuts,segments,tables,source,color,bodyLift:lift,rootNormal:scalp.n};
}

function loftRoutes(routes,support){
 const positions=[],uv=[],colors=[],indices=[],seams=[],rows=[],centerSamples=new Float32Array(routes.length*49*3),metrics={vertices:0,triangles:0,nonfinite:0,minimumTriangleDoubleArea:Infinity,minimumOutwardRadialDot:Infinity,invertedSideTriangles:0,maximumNeighborTurnDegrees:0,maximumNormalLengthError:0,rootSamples:0,rootMinimumGap:Infinity,rootPenetrations:0,releasedSamples:0,releasedMinimumGap:Infinity,releasedPenetrations:0,protectedTraceSamples:0,protectedTraceMinimumGap:Infinity,protectedTracePenetrations:0,unsupportedSamples:0};
 for(const route of routes){
  const first=positions.length/3,centers=[],frames=[];let oldSide=null;
  for(let j=0;j<=48;j++){
   const nr=route.rootRows,t=j<=nr?route.cuts[1]*(route.rootSampling?inverseArc(route.rootSampling,route.rootSampling.at(-1)*j/nr):j/nr):mix(route.cuts[1],1,(j-nr)/(48-nr)),p=route.point(t),d=unit(derivative(route.point,t,.00003));let normal;
   if(oldSide){const side0=sub(oldSide,dot(oldSide,d)===0?[0,0,0]:d.map(x=>x*dot(oldSide,d)));normal=unit(cross(unit(side0),d));}
   else{const n=route.rootNormal;normal=unit(sub(n,d.map(x=>x*dot(n,d))));}
   let s=unit(cross(d,normal));normal=unit(cross(s,d));oldSide=s;
   if(frames.length){const angle=Math.acos(clamp(dot(frames.at(-1).d,d),-1,1))*180/Math.PI;if(angle>metrics.maximumNeighborTurnDegrees){metrics.maximumNeighborTurnDegrees=angle;metrics.worstTurn={group:route.group,family:route.family,member:route.member,row:j,t,oldT:frames.at(-1).t,previous:frames.at(-1).p,point:p};}}
   const shape=route.shape(t);centers.push(p);centerSamples.set(p,((route.family*3+route.member)*49+j)*3);frames.push({p,d,n:normal,s,t});
   for(let k=0;k<=6;k++){
    const a=k/6*Math.PI*2,q=add(add(p,s,shape.width*Math.cos(a)),normal,shape.depth*Math.sin(a));positions.push(...q);uv.push(k/6+route.phase*.173,t);colors.push(...route.color);
   }
   seams.push([first+j*7,first+j*7+6]);rows.push({member:route.family*3+route.member,row:j,t,first:first+j*7,root:t<=route.cuts[1],protected:t>=route.cuts[2]});
  }
  for(let j=0;j<48;j++)for(let k=0;k<6;k++){const a=first+j*7+k,b=a+7;indices.push(a,b,a+1,a+1,b,b+1);}
  const startCap=positions.length/3;positions.push(...centers[0]);uv.push(.5,0);colors.push(...route.color);const endCap=positions.length/3;positions.push(...centers.at(-1));uv.push(.5,1);colors.push(...route.color);
  for(let k=0;k<6;k++){indices.push(startCap,first+k,first+k+1);const a=first+48*7+k;indices.push(endCap,a+1,a);}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal;
 for(const[a,b]of seams){const q=add(attr(n,a),attr(n,b)),l=len(q);if(l>1e-12){const qn=q.map(x=>x/l);n.setXYZ(a,...qn);n.setXYZ(b,...qn);}}
 for(const a of Object.values(g.attributes))for(const x of a.array)if(!Number.isFinite(x))metrics.nonfinite++;
 for(let i=0;i<n.count;i++)metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,Math.abs(len(attr(n,i))-1));
 for(let k=0;k<g.index.count;k+=3){const a=attr(p,g.index.getX(k)),b=attr(p,g.index.getX(k+1)),c=attr(p,g.index.getX(k+2)),normal=cross(sub(b,a),sub(c,a)),area=len(normal);metrics.minimumTriangleDoubleArea=Math.min(metrics.minimumTriangleDoubleArea,area);
  const route=Math.floor(k/(588*3)),local=k%(588*3);if(local<576*3){const row=Math.floor(local/(12*3)),second=Math.floor(local/3)%2,at=(route*49+row)*3,A=Array.from(centerSamples.subarray(at,at+3)),B=Array.from(centerSamples.subarray(at+3,at+6)),center=A.map((x,i)=>mix(x,B[i],second?2/3:1/3)),radial=sub(a.map((x,i)=>(x+b[i]+c[i])/3),center),value=dot(normal,radial)/(area*len(radial));if(value<metrics.minimumOutwardRadialDot){metrics.minimumOutwardRadialDot=value;metrics.worstRadial={route,row,triangle:k/3,value};}if(value<=0)metrics.invertedSideTriangles++;}
 }
 for(const row of rows)for(const j of[0,1,2,3,4,5]){
  const q=attr(p,row.first+j),hit=support.at(q[0],q[1]);if(!hit){metrics.unsupportedSamples++;continue;}
  const gap=(q[2]-hit.p[2])*hit.n[2],kind=row.root?'root':row.protected?'protectedTrace':'released';metrics[kind+'Samples']++;metrics[kind+'MinimumGap']=Math.min(metrics[kind+'MinimumGap'],gap);if(gap<-.0005)metrics[kind+'Penetrations']++;
 }
 metrics.vertices=p.count;metrics.triangles=g.index.count/3;g.computeBoundingBox();g.computeBoundingSphere();return{geometry:g,metrics,rows};
}

export function applyFrontRoot150(groom,head,{strength=0}={}){
 if(strength!==0&&strength!==1)throw Error('150 is one coarse OFF/ON study');
 const previous=applications.get(groom);if(previous){if(strength!==previous.metrics.strength)throw Error('150 already applied; use a fresh groom');return previous.metrics;}if(!strength)return ZERO;
 const capture=captures.get(groom);if(!capture)throw Error('150 needs its optional constructor registry');
 const started=now(),crown=find(groom,CROWN),mass=find(groom,MASS);if(find(head,'continuous-face').geometry.userData?.eyeContour147?.version!=='eye-contour-147')throw Error('150 must run after actual147 head preparation');
 if(Array.isArray(mass.material)||!mass.material.isMeshPhysicalMaterial||mass.material.color.r!==1||mass.material.color.g!==1||mass.material.color.b!==1)throw Error('150 must clone the accepted untinted MASS before149');
 const {delta,max}=currentOffset(groom,capture),support=supportIndex(groom,head),metrics={version:VERSION,strength:1,applied:true,families:24,members:72,maximumRootDisplacement:0,maximumSmoothBodyLift:0,preparedTranslation:delta,translationAnchorResidual:max,sourceFringeRows:capture.rows.length,sourceCaptureMs:capture.captureMs,addedTextureBytes:0,perFrameWork:0};
 const routes=capture.members.map(m=>makeRoute(m,crown.geometry,capture,delta,support,metrics)),loft=loftRoutes(routes,support),cut=retireCrown(crown.geometry);
 if(loft.metrics.nonfinite||loft.metrics.triangles!==42336||loft.metrics.rootPenetrations||loft.metrics.releasedPenetrations||loft.metrics.invertedSideTriangles)throw Error('150 failed actual emitted geometry support: '+JSON.stringify(loft.metrics));
 const material=mass.material.clone();material.userData={};const mesh=new THREE.Mesh(loft.geometry,material);mesh.name=FRONT_MESH150;mesh.castShadow=mass.castShadow;mesh.receiveShadow=mass.receiveShadow;groom.add(mesh);crown.geometry.setIndex(cut.next);
 const bytes=g=>Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,g.index.array.byteLength);
 Object.assign(metrics,{addedTriangles:loft.metrics.triangles,removedTriangles:cut.removed,netTriangles:loft.metrics.triangles-cut.removed,addedGeometryBytes:bytes(loft.geometry)+cut.next.array.byteLength,geometry:loft.metrics,support:support.metrics,routeTableBytes:routes.reduce((s,r)=>s+r.tables.reduce((n,t)=>n+t.byteLength,0)+r.table.byteLength+(r.rootSampling?.byteLength||0),0),elapsedMs:now()-started});
 const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),continuousCrownSheets:0,partialCrownSheets:2,closedInsetScalp:false,opaqueBuriedRoots:false,frontRoot150:metrics};
 applications.set(groom,{metrics,capture,crown,cut,mesh,routes,support,rows:loft.rows,originalUserData});return metrics;
}

export function setCoarseIsolation150(groom,enabled=true){
 if(!enabled)return restoreCoarseIsolation150(groom);const old=isolations.get(groom);if(old)return old.metrics;
 const capture=captures.get(groom);if(!capture)throw Error('150 coarse isolation needs capture');const changes=[],metrics={version:'coarse-hidden-upstream150',hidden:[]};
 for(const[name,rows]of[[DETAIL,capture.detail],[WISPS,capture.wisps]]){
  const mesh=find(groom,name),owned=new Uint8Array(mesh.geometry.attributes.position.count);for(const row of rows)owned.fill(1,row.first,row.first+row.count);
  const cut=filteredIndex(mesh.geometry,(k,index)=>{const a=owned[index.getX(k)],b=owned[index.getX(k+1)],c=owned[index.getX(k+2)];if(a||b||c){if(!(a&&b&&c))throw Error('150 fine ownership cuts a triangle');return true;}return false;});changes.push({mesh,...cut});metrics.hidden.push({mesh:name,removedTriangles:cut.removed,rows});
 }
 const fringe=find(groom,FRINGE),ranges=capture.rows.map(r=>({group:r.group,k:r.k,start:r.indexStart,count:r.firstKeptSegment*r.indicesPerSegment,cut:r.cut,cutArc:r.cutArc,length:r.length,firstKeptSegment:r.firstKeptSegment}));let r=0;
 const cut=filteredIndex(fringe.geometry,k=>{while(r<ranges.length&&k>=ranges[r].start+ranges[r].count)r++;return r<ranges.length&&k>=ranges[r].start&&k<ranges[r].start+ranges[r].count;});changes.push({mesh:fringe,...cut});metrics.hidden.push({mesh:FRINGE,removedTriangles:cut.removed,ranges});
 metrics.additionalDiagnosticIndexBytes=changes.reduce((s,c)=>s+c.next.array.byteLength,0);metrics.removedTriangles=changes.reduce((s,c)=>s+c.removed,0);
 for(const change of changes)change.mesh.geometry.setIndex(change.next);const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),coarseIsolation150:metrics};isolations.set(groom,{changes,metrics,originalUserData});return metrics;
}
export function restoreCoarseIsolation150(groom){const old=isolations.get(groom);if(!old)return{restored:false};for(const c of old.changes)c.mesh.geometry.setIndex(c.old);groom.userData=old.originalUserData;isolations.delete(groom);return{restored:true};}
export function getFrontRoot150QA(groom){return{capture:captures.get(groom),application:applications.get(groom),isolation:isolations.get(groom)};}
export function releaseFrontRoot150(groom){restoreCoarseIsolation150(groom);const a=applications.get(groom);if(!a)return{released:false};a.crown.geometry.setIndex(a.cut.old);groom.remove(a.mesh);a.mesh.geometry.dispose();a.mesh.material.dispose();groom.userData=a.originalUserData;applications.delete(groom);return{released:true};}
