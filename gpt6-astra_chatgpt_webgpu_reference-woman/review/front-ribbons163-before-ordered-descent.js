import * as THREE from 'three';

// Isolated163 coarse architecture. Legacy vertex arrays and materials are
// read-only; the only legacy geometry changes are reversible index selections.
const VERSION='regular-overlapping-front-ribbons-163';
export const FRONT_MESH163='Original ordered crown-to-fringe ribbons163';
const CROWN='Continuous parted crown with longitudinal fiber flow',MASS='Overlapping layered S-wave hair around front back and shoulders',DETAIL='Independent fine crown lengths and silhouette strands',FRINGE='Dense fine bowed brown fringe strands',WISPS='Sparse short temple edge and hairline wisps';
const captures=new WeakMap(),applications=new WeakMap(),isolations=new WeakMap();
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,addedTriangles:0,removedTriangles:0,addedGeometryBytes:0,addedTextureBytes:0,perFrameWork:0,elapsedMs:0});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const v=(x=0,y=0,z=0)=>[x,y,z],add=(a,b,s=1)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>{const l=len(a);if(l<1e-12)throw Error('163 zero direction');return a.map(q=>q/l);};
const attr=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)],finite=a=>a.every(Number.isFinite),now=()=>performance.now();
const COUNTS163=[270,245,105,300,120,95,170];
export function createFrontCapture163({headTilt=-.17}={}){
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
  const previous=representatives.get(group),distance=Math.abs(k-(COUNTS163[group]-1)/2),principal=group!==0||strand.debug133?.kind==='principal';
  if(principal&&(!previous||distance<previous.distance))representatives.set(group,{...record,point,cut,distance});
  workMs+=now()-started;
 },finish(groom){
  const fringe=find(groom,FRINGE),p=fringe.geometry.attributes.position,anchors=[0,Math.floor(p.count/2),p.count-1].map(i=>({i,p:attr(p,i)}));
  if(representatives.size!==7)throw Error('163 cannot resolve all seven accepted fringe families');
  const record={rows,detail,wisps,representatives:[...representatives.values()].sort((a,b)=>a.group-b.group),anchors,headTilt,captureMs:workMs};captures.set(groom,record);
  groom.userData.frontCapture163={version:VERSION,fringe:rows.length,detail:detail.length,wisps:wisps.length,captureMs:workMs};
 }};
}
function find(root,name){let hit=null;root.traverse(o=>{if(o.name===name){if(hit)throw Error('163 duplicate '+name);hit=o;}});if(!hit)throw Error('163 missing '+name);return hit;}
function actualGroomStats(root){let triangles=0,bytes=0;root.traverse(o=>{if(!o.isMesh)return;triangles+=o.geometry.index.count/3;bytes+=o.geometry.index.array.byteLength;for(const a of Object.values(o.geometry.attributes))bytes+=a.array.byteLength;});return{triangles,geometryMiB:Number((bytes/1048576).toFixed(2))};}
function transform(a,p){return[a[0]*p[0]+a[4]*p[1]+a[8]*p[2]+a[12],a[1]*p[0]+a[5]*p[1]+a[9]*p[2]+a[13],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]+a[14]];}
function matrixTo(target,source){const a=new THREE.Matrix4().multiplyMatrices(target.matrixWorld.clone().invert(),source.matrixWorld);if(!Number.isFinite(a.determinant())||Math.abs(a.determinant())<1e-12||!finite(a.elements))throw Error('163 invalid affine frame');return a.elements;}
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
  const g=mesh.geometry,p=g.attributes.position,index=g.index;if(!p||!index||index.count>=1048576)throw Error('163 unsupported head layout');
  const ranges=scalp?(g.groups||[]).filter(q=>q.materialIndex===0).map(q=>[q.start,q.start+q.count]):[[0,index.count]];
  if(scalp&&!ranges.length)throw Error('163 requires actual front-material triangle membership');
  records.push({mesh,p,index,ranges,m:matrixTo(groom,mesh),scalp});
 });
 if(records.filter(r=>r.scalp).length!==1)throw Error('163 needs one continuous face');
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
function currentOffset(groom,capture){const p=find(groom,FRINGE).geometry.attributes.position,delta=sub(attr(p,capture.anchors[0].i),capture.anchors[0].p);let max=0;for(const a of capture.anchors)max=Math.max(max,len(sub(sub(attr(p,a.i),a.p),delta)));if(max>4e-7)throw Error('163 fringe no longer has a uniform prepared-frame translation');return{delta,max};}

function sampleCrown(g,side,u,t){const a=g.attributes.position,first=side<0?7685:16070,x=clamp(u)*128,y=clamp(t)*64,i=Math.min(127,Math.floor(x)),j=Math.min(63,Math.floor(y)),dx=x-i,dy=y-j;return[0,1,2].map(k=>mix(mix(a.array[(first+j*129+i)*3+k],a.array[(first+j*129+i+1)*3+k],dx),mix(a.array[(first+(j+1)*129+i)*3+k],a.array[(first+(j+1)*129+i+1)*3+k],dx),dy));}

const U_FIRST163=77/128,U_ROOT_END163=.947,ROOT_RETIRED_COLUMN163=80;
export const RIBBON163_SPEC=Object.freeze({ribbons:24,left:16,right:8,along:48,across:6,retiredColumns:[80,127],retiredRows:[0,63],retiredTriangles:12288,mapV:[0,.80],firstOriginalAlphaTransition:.838,partRootU:[U_FIRST163,U_ROOT_END163],maximumTransverseRelief:.006,source:'Only original image1 guides this original coarse flow field.'});
export const INTENDED_RAIL163=Object.freeze([[-.84,.59],[-.60,.94],[-.23,1.04],[.09,1.10],[.355,1.00],[.572,.845],[.76,.48]].map(Object.freeze));
const blend3=(a,b,t)=>a.map((x,k)=>mix(x,b[k],t));
function cubic(a,b,c,d,t){const r=1-t;return a.map((x,k)=>r*r*r*x+3*r*r*t*b[k]+3*r*t*t*c[k]+t*t*t*d[k]);}
function smoothRail(rows,s){let i=0;while(i<rows.length-2&&s>rows[i+1][0])i++;const a=rows[i],b=rows[i+1],p=rows[Math.max(0,i-1)],q=rows[Math.min(rows.length-1,i+2)],h=b[0]-a[0],t=clamp((s-a[0])/h),A=2*t*t*t-3*t*t+1,B=t*t*t-2*t*t+t,C=-2*t*t*t+3*t*t,D=t*t*t-t*t;return a.slice(1).map((x,k)=>A*x+B*h*(b[k+1]-p[k+1])/(b[0]-p[0])+C*b[k+1]+D*h*(q[k+1]-a[k+1])/(q[0]-a[0]));}
function targetByHeight(row){
 const points=Array.from({length:193},(_,i)=>row.point(i/192));
 return y=>{for(let i=points.length-2;i>=0;i--){const a=points[i],b=points[i+1];if(a[1]>=y&&b[1]<=y)return blend3(a,b,(a[1]-y)/(a[1]-b[1]||1));}return(y>points[0][1]?points[0]:points.at(-1)).slice();};
}
function makeFlow163(crown,capture,delta,support){
 const g=crown.geometry,principal=targetByHeight(capture.representatives[0]),source=side=>t=>sampleCrown(g,side,U_FIRST163,t),outer=new Map([[-1,source(-1)],[1,source(1)]]);
 const local=p=>sub(p,delta),current=p=>add(p,delta),end0=local(outer.get(-1)(1)),end1=local(outer.get(1)(1)),tip=principal(-.55);
 const ends={
  '-1':[[0,...end0],[.22,-.83,.04,.17],[.50,...tip],[.70,-.443,.16,.58],[.87,-.27,.31,.63],[1,-.085,.48,.64]],
  '1':[[0,...end1],[.25,.69,.09,.39],[.50,.50,.31,.55],[.73,.30,.38,.59],[.9,.045,.28,.66],[1,-.085,.48,.64]]
 };
 const supportMetrics={queries:0,misses:0,maximumSharedDepthLift:0,maximumPrincipalTargetCorrection:0};
 function base(side,s,t){
  const u=mix(U_FIRST163,U_ROOT_END163,s),root=local(sampleCrown(g,side,u,0)),end=smoothRail(ends[side],s),out=local(outer.get(side)(t));
  // The released front part stops before the old u=1 upward return. A broad
  // descending route begins immediately; no short protected-prefix hinge.
  const distance=Math.hypot(end[0]-root[0],end[1]-root[1]),dx=(side<0?-1:.68)*mix(.38,.17,s),dy=-mix(.095,.14,s),a=[root[0]+dx,root[1]+dy,root[2]+mix(.105,.035,s)],b=[mix(root[0],end[0],.77)+(side<0?-.035:.08)*(1-s),mix(root[1],end[1],.66),mix(root[2],end[2],.77)+.045];
  let p=cubic(root,a,b,end,t),outerWeight=1-smooth(0,.20,s);p=blend3(p,out,outerWeight);
  if(side<0){const w=Math.exp(-(((s-.50)/.085)**4))*(1-smooth(.35,.60,p[1]));if(w>0){const q=principal(p[1]);supportMetrics.maximumPrincipalTargetCorrection=Math.max(supportMetrics.maximumPrincipalTargetCorrection,len(sub(q,p))*w);p=blend3(p,q,w);}}
  return current(p);
 }
 function point(side,s,t){
  const p=base(side,s,t),Y=p[1]-delta[1],X=p[0]-delta[0],weight=smooth(.06,.22,s)*smooth(.02,.12,t)*(1-smooth(1.31,1.47,Y));
  // One shared depth field supports neighboring routes. The protected outer
  // near-ear route remains behind the ear; it is not attracted across it.
  const tucked=side<0?(1-smooth(.48,.67,Y))*smooth(.59,.76,-X)*(1-smooth(.22,.39,s)):0;
  if(weight>0&&tucked<1){supportMetrics.queries++;const h=support.at(p[0],p[1],true);if(h){const clearance=.027+.012*Math.sin(Math.PI*t),wanted=h.p[2]+clearance/Math.max(.40,h.n[2]),d=wanted-p[2],lift=.5*(d+Math.hypot(d,.007))*weight*(1-tucked);p[2]+=lift;supportMetrics.maximumSharedDepthLift=Math.max(supportMetrics.maximumSharedDepthLift,lift);}else supportMetrics.misses++;}
  return p;
 }
 return{point,base,principal,ends,supportMetrics,outer,delta};
}
function makeRibbons163(crown,capture,delta,support){
 const start=now(),flow=makeFlow163(crown,capture,delta,support),positions=[],normals=[],uvs=[],colors=[],tangents=[],indices=[],records=[],metrics={vertices:0,triangles:0,nonfinite:0,degenerateTriangles:0,reversedVisibleTriangles:0,minimumVisibleOrientation:Infinity,minimumVisibleUVArea:Infinity,maximumTangentOrthogonalityError:0,maximumTangentLengthError:0,minimumVertexNormalGap:Infinity,negativeVertexSupport:0,vertexSupportMisses:0,maximumRibbonWidth:0,maximumUVv:0,maximumRelief:0};
 const color=new THREE.Color('#50413e'),N=48,K=6;
 function sample(side,s,t,q,half,relief,end){
  const widthTaper=1-smooth(relief.taperStart*end,end,t),span=half*widthTaper,S=clamp(s+q*span),p=flow.point(side,S,t),a=flow.point(side,clamp(S-.0008),t),b=flow.point(side,clamp(S+.0008),t),c=flow.point(side,S,Math.max(0,t-.0008)),d=flow.point(side,S,Math.min(1,t+.0008));
  let n=cross(sub(b,a),sub(d,c)),reference=[p[0]-delta[0],(p[1]-delta[1]-.327)*.45,p[2]-delta[2]+.077];if(dot(n,reference)<0)n=n.map(x=>-x);if(len(n)<1e-12)n=unit(reference);else n=unit(n);
  const lift=relief.height*(1-q*q)*smooth(0,.085,t)*(1-smooth(.75*end,end,t));metrics.maximumRelief=Math.max(metrics.maximumRelief,lift);return{p:add(p,n,lift),n,ds:sub(b,a),dt:sub(d,c),span,S};
 }
 for(const side of[-1,1]){
  const count=side<0?16:8;
  for(let lane=0;lane<count;lane++){
   const s=(lane+.5)/count,half=.61/count,phase=(lane*2.399+side*.71),taperStart=clamp(.53+.20*Math.sin(phase)+.10*Math.cos(phase*.73),.40,.81),end=1-.025*(.5+.5*Math.sin(phase*1.3)),relief={height:.0036+.0018*(.5+.5*Math.sin(phase*.87)),taperStart},center=t=>flow.point(side,s,t*end),arc=arcTable(center,96),total=arc.at(-1),first=positions.length/3;
   const rootWidth=len(sub(flow.point(side,clamp(s-half),.20),flow.point(side,clamp(s+half),.20))),texCenter=side<0?.12+lane*.073:.23+lane*.117,texHalf=rootWidth*1.5,grid=[],parameters=[];
   // Positions are emitted once. Their actual regular-grid chords provide the
   // shading frame, avoiding repeated scalp queries for nested derivatives.
   for(let row=0;row<N;row++){
    const f=row/N,t=inverseArc(arc,total*f)*end;parameters.push(t);const ring=[];
    for(let col=0;col<=K;col++)ring.push(sample(side,s,t,col/K*2-1,half,relief,end));grid.push(ring);
   }
   const tipSample=sample(side,s,end,0,half,relief,end);let winding=1;
   for(let row=0;row<N;row++)for(let col=0;col<=K;col++){
    const f=row/N,q=col/K*2-1,samplePoint=grid[row][col],p=samplePoint.p,dq=sub(grid[row][Math.min(K,col+1)].p,grid[row][Math.max(0,col-1)].p),dt=sub(row<N-1?grid[row+1][col].p:tipSample.p,grid[Math.max(0,row-1)][col].p);let n=cross(dq,dt);if(dot(n,samplePoint.n)<0)n=n.map(x=>-x);n=unit(n);const tangent=unit(sub(dq,n.map(x=>x*dot(dq,n)))),hand=dot(cross(n,tangent),dt)<0?-1:1;
    const alpha=smooth(0,.11,1-Math.abs(q))*(1-smooth(.90,1,f)),shade=.985+.015*Math.sin(phase),V=.80*f;
    positions.push(...p);normals.push(...n);tangents.push(...tangent,hand);uvs.push(texCenter+q*texHalf,V);colors.push(color.r*shade,color.g*shade,color.b*shade,alpha);metrics.maximumUVv=Math.max(metrics.maximumUVv,V);metrics.maximumTangentOrthogonalityError=Math.max(metrics.maximumTangentOrthogonalityError,Math.abs(dot(n,tangent)));metrics.maximumTangentLengthError=Math.max(metrics.maximumTangentLengthError,Math.abs(len(tangent)-1));if(!finite([...p,...n,...tangent]))metrics.nonfinite++;
    if(row===4&&col===3)winding=dot(cross(dq,dt),n)>0?1:-1;
    if(alpha>.1&&row%3===0&&col%2===0){const hit=support.at(p[0],p[1]);if(hit){const gap=dot(sub(p,hit.p),hit.n);metrics.minimumVertexNormalGap=Math.min(metrics.minimumVertexNormalGap,gap);if(gap<-.001)metrics.negativeVertexSupport++;}else metrics.vertexSupportMisses++;}
    if(col===K)metrics.maximumRibbonWidth=Math.max(metrics.maximumRibbonWidth,len(sub(grid[row][0].p,p)));
   }
   const lastNormal=normals.slice((first+(N-1)*(K+1)+K/2)*3,(first+(N-1)*(K+1)+K/2)*3+3),lastDQ=sub(grid[N-1][K].p,grid[N-1][0].p),endTangent=unit(sub(lastDQ,lastNormal.map(x=>x*dot(lastDQ,lastNormal)))),lastDT=sub(tipSample.p,grid[N-1][K/2].p),tipIndex=positions.length/3;
   positions.push(...tipSample.p);normals.push(...lastNormal);tangents.push(...endTangent,dot(cross(lastNormal,endTangent),lastDT)<0?-1:1);uvs.push(texCenter,.80);colors.push(color.r,color.g,color.b,0);
   const indexStart=indices.length;for(let row=0;row<N-1;row++)for(let col=0;col<K;col++){const a=first+row*(K+1)+col,b=a+1,c=a+K+1,d=c+1;if(winding>0)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);}
   for(let col=0;col<K;col++){const a=first+(N-1)*(K+1)+col,b=a+1;if(winding>0)indices.push(a,b,tipIndex);else indices.push(a,tipIndex,b);}
   records.push({side,lane,s,half,end,taperStart,relief:relief.height,first,vertexCount:(K+1)*N+1,indexStart,indexCount:indices.length-indexStart,totalArcLength:total,rootWidth,uvCenter:texCenter,uvHalf:texHalf,parameters});
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,4));g.setAttribute('tangent',new THREE.Float32BufferAttribute(tangents,4));g.setIndex(indices);g.computeBoundingBox();g.computeBoundingSphere();
 for(let k=0;k<indices.length;k+=3){const ids=indices.slice(k,k+3),ps=ids.map(i=>positions.slice(i*3,i*3+3)),n=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0])),area=len(n),alpha=ids.reduce((s,i)=>s+colors[i*4+3],0)/3,average=unit(ids.map(i=>normals.slice(i*3,i*3+3)).reduce((s,n)=>add(s,n),[0,0,0]));if(area<1e-12)metrics.degenerateTriangles++;else if(alpha>.1){const value=dot(n,average)/area;metrics.minimumVisibleOrientation=Math.min(metrics.minimumVisibleOrientation,value);if(value<=0)metrics.reversedVisibleTriangles++;}const a=ids.map(i=>uvs.slice(i*2,i*2+2)),uva=Math.abs((a[1][0]-a[0][0])*(a[2][1]-a[0][1])-(a[1][1]-a[0][1])*(a[2][0]-a[0][0]));if(alpha>.1)metrics.minimumVisibleUVArea=Math.min(metrics.minimumVisibleUVArea,uva);}
 metrics.vertices=positions.length/3;metrics.triangles=indices.length/3;metrics.geometryBytes=g.index.array.byteLength+Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,0);metrics.flow=flow.supportMetrics;metrics.elapsedMs=now()-start;return{geometry:g,metrics,records,flow};
}
function retireCrown163(g){
 if(g.attributes.position.count!==24455||g.index.count!==47744*3)throw Error('163 legacy crown layout changed');
 const cut=filteredIndex(g,k=>{const face=k/3;if(face<14976)return false;const cell=Math.floor(((face-14976)%16384)/2);return cell%128>=ROOT_RETIRED_COLUMN163;});if(cut.removed!==12288)throw Error('163 exact retirement changed');return cut;
}
export function applyFrontRibbons163(groom,head,{strength=0}={}){
 if(strength!==0&&strength!==1)throw Error('163 has only one coarse OFF/ON mode');const previous=applications.get(groom);if(previous){if(strength!==1)throw Error('163 already applied; use a fresh groom');return previous.metrics;}if(!strength)return ZERO;
 const capture=captures.get(groom);if(!capture)throw Error('163 needs its optional accepted-source capture');const started=now(),crown=find(groom,CROWN),mass=find(groom,MASS),material=mass.material;
 if(!material.isMeshPhysicalMaterial||material.color.toArray().some(x=>x!==1)||material.alphaMap||!material.map||!material.normalMap)throw Error('163 requires the exact untinted ordinary MASS material');
 const{delta,max}=currentOffset(groom,capture),support=supportIndex(groom,head),surface=makeRibbons163(crown,capture,delta,support),cut=retireCrown163(crown.geometry),privateMaterial=material.clone();privateMaterial.userData={};
 if(surface.metrics.nonfinite||surface.metrics.degenerateTriangles||surface.metrics.reversedVisibleTriangles)throw Error('163 invalid emitted ribbon orientation: '+JSON.stringify(surface.metrics));
 const mesh=new THREE.Mesh(surface.geometry,privateMaterial);mesh.name=FRONT_MESH163;mesh.castShadow=mass.castShadow;mesh.receiveShadow=mass.receiveShadow;groom.add(mesh);crown.geometry.setIndex(cut.next);
 const metrics={version:VERSION,strength:1,applied:true,sourceCaptureMs:capture.captureMs,preparedTranslation:delta,translationAnchorResidual:max,...surface.metrics,removedTriangles:cut.removed,addedTriangles:surface.metrics.triangles,addedTextureBytes:0,perFrameWork:0,support:{...support.metrics},elapsedMs:now()-started,spec:RIBBON163_SPEC};
 const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),frontRibbons163:metrics};applications.set(groom,{metrics,capture,crown,cut,mesh,support,surface,originalUserData});return metrics;
}
export function setCoarseIsolation163(groom,enabled=true){
 if(!enabled)return restoreCoarseIsolation163(groom);const old=isolations.get(groom);if(old)return old.metrics;
 const capture=captures.get(groom);if(!capture)throw Error('163 coarse isolation needs capture');const changes=[],metrics={version:'coarse-hidden-upstream163',hidden:[]};
 for(const[name,rows]of[[DETAIL,capture.detail],[WISPS,capture.wisps]]){
  const mesh=find(groom,name),owned=new Uint8Array(mesh.geometry.attributes.position.count);for(const row of rows)owned.fill(1,row.first,row.first+row.count);
  const cut=filteredIndex(mesh.geometry,(k,index)=>{const a=owned[index.getX(k)],b=owned[index.getX(k+1)],c=owned[index.getX(k+2)];if(a||b||c){if(!(a&&b&&c))throw Error('163 fine ownership cuts a triangle');return true;}return false;});changes.push({mesh,...cut});metrics.hidden.push({mesh:name,removedTriangles:cut.removed,rows});
 }
 const fringe=find(groom,FRINGE),ranges=capture.rows.map(r=>({group:r.group,k:r.k,start:r.indexStart,count:r.firstKeptSegment*r.indicesPerSegment,cut:r.cut,cutArc:r.cutArc,length:r.length,firstKeptSegment:r.firstKeptSegment}));let r=0;
 const cut=filteredIndex(fringe.geometry,k=>{while(r<ranges.length&&k>=ranges[r].start+ranges[r].count)r++;return r<ranges.length&&k>=ranges[r].start&&k<ranges[r].start+ranges[r].count;});changes.push({mesh:fringe,...cut});metrics.hidden.push({mesh:FRINGE,removedTriangles:cut.removed,ranges});
 metrics.additionalDiagnosticIndexBytes=changes.reduce((s,c)=>s+c.next.array.byteLength,0);metrics.removedTriangles=changes.reduce((s,c)=>s+c.removed,0);
 for(const change of changes)change.mesh.geometry.setIndex(change.next);const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),coarseIsolation163:metrics};isolations.set(groom,{changes,metrics,originalUserData});return metrics;
}
export function restoreCoarseIsolation163(groom){const old=isolations.get(groom);if(!old)return{restored:false};for(const c of old.changes)c.mesh.geometry.setIndex(c.old);groom.userData=old.originalUserData;isolations.delete(groom);return{restored:true};}
export function getFrontRibbons163QA(groom){return{capture:captures.get(groom),application:applications.get(groom),isolation:isolations.get(groom)};}
export function releaseFrontRibbons163(groom){restoreCoarseIsolation163(groom);const a=applications.get(groom);if(!a)return{released:false};a.crown.geometry.setIndex(a.cut.old);groom.remove(a.mesh);a.mesh.geometry.dispose();a.mesh.material.dispose();groom.userData=a.originalUserData;applications.delete(groom);return{released:true};}
