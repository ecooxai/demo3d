import * as THREE from 'three';

// Isolated167 coarse architecture. Legacy vertex arrays and materials are
// read-only; the only legacy geometry changes are reversible index selections.
const VERSION='independent-rounded-front-locks-167';
export const FRONT_MESH167='Original independently bowed rounded front locks167';
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

// Each volume has an independently authored root, cubic bend and end. The
// shared functions below evaluate frames and fit depth; no neighboring route
// or common-height direction correction is used.
const U_FIRST167=77/128,ROOT_RETIRED_COLUMN167=80;
export const RIBBON167_SPEC=Object.freeze({architecture:'Twelve closed, flattened oval locks; retained original part overlap',locks:12,left:7,right:5,along:64,around:12,retiredColumns:[80,127],mapV:[0,.80],rootRetainedRows:'u-dependent 6..17 rows; original position, color, UV0, UV1 and normals untouched',source:'Only original image1 guides these original independent coarse curves.'});
export const INTENDED_RAIL167=Object.freeze([[-.84,.59],[-.60,.94],[-.23,1.04],[.09,1.10],[.355,1.00],[.572,.845],[.76,.48]].map(Object.freeze));
const blend3=(a,b,t)=>a.map((x,k)=>mix(x,b[k],t));
function cubic(a,b,c,d,t){const r=1-t;return a.map((x,k)=>r*r*r*x+3*r*r*t*b[k]+3*r*t*t*c[k]+t*t*t*d[k]);}
function cubicDerivative(a,b,c,d,t){const r=1-t;return a.map((x,k)=>3*r*r*(b[k]-x)+6*r*t*(c[k]-b[k])+3*t*t*(d[k]-c[k]));}
const SPECS167=Object.freeze([
 {id:'L0',side:-1,u:.620,end:[-.864,.43,.30],width:.111,depth:.018,handle:.76,fall:.40,taper:.72,phase:.3},
 {id:'L1',side:-1,u:.677,end:[-.844,.12,.37],width:.112,depth:.019,handle:.73,fall:.56,taper:.62,phase:2.1},
 {id:'L2',side:-1,u:.739,end:[-.701,-.38,.56],width:.101,depth:.019,handle:.62,fall:.68,taper:.53,phase:4.6},
 {id:'L3',side:-1,u:.799,end:[-.502,.065,.65],width:.096,depth:.018,handle:.47,fall:.60,taper:.62,phase:1.4},
 {id:'L4',side:-1,u:.860,end:[-.308,.24,.665],width:.076,depth:.015,handle:.36,fall:.48,taper:.57,phase:5.3},
 {id:'L5',side:-1,u:.917,end:[-.132,.29,.665],width:.062,depth:.012,handle:.24,fall:.45,taper:.50,phase:3.2},
 {id:'L6',side:-1,u:.978,end:[.006,.50,.650],width:.047,depth:.010,handle:.15,fall:.34,taper:.48,phase:6.1},
 {id:'R0',side:1,u:.624,end:[.865,.28,.255],width:.107,depth:.017,handle:.70,fall:.48,taper:.74,phase:1.1},
 {id:'R1',side:1,u:.705,end:[.766,.25,.405],width:.104,depth:.018,handle:.60,fall:.50,taper:.66,phase:4.1},
 {id:'R2',side:1,u:.797,end:[.590,.30,.570],width:.090,depth:.016,handle:.46,fall:.48,taper:.56,phase:2.8},
 {id:'R3',side:1,u:.886,end:[.378,.36,.660],width:.071,depth:.013,handle:.30,fall:.42,taper:.52,phase:5.7},
 {id:'R4',side:1,u:.973,end:[.187,.54,.655],width:.050,depth:.010,handle:.17,fall:.30,taper:.47,phase:.7},
].map(x=>Object.freeze({...x,end:Object.freeze(x.end)})));
const smoother=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
function posed167(p,headTilt){const[x,y,z]=p,w=1-smooth(-1.64,.38,y),ay=-.16*w,az=-headTilt*w,xx=x*Math.cos(ay)+z*Math.sin(ay);return[xx*Math.cos(az)-y*Math.sin(az),xx*Math.sin(az)+y*Math.cos(az),-x*Math.sin(ay)+z*Math.cos(ay)];}
function scalpNormal167(p,delta){const q=sub(p,delta);return unit([(q[0]-.012)/(.94*.94),(q[1]-.327)/(1.302*1.302),(q[2]+.077)/(.857*.857)]);}
function buildRoute167(spec,crown,delta,support,headTilt){
 const g=crown.geometry,root=sampleCrown(g,spec.side,spec.u,.035),rootNormal=scalpNormal167(root,delta),a=add(root,rootNormal,-.012),oldDirection=unit(sub(sampleCrown(g,spec.side,spec.u,.041),sampleCrown(g,spec.side,spec.u,.029))),down=unit([spec.side*.65,-.56,.32]),rootDirection=unit(blend3(oldDirection,down,smoother(.855,.99,spec.u))),b=add(a,rootDirection,spec.handle),d=add(posed167(spec.end,headTilt),delta),endDirection=unit([spec.side*.12,-1,-.08]),c=add(d,endDirection,-spec.fall);
 // These are four fixed control points. Head support does not project each
 // evaluated surface point or insert a common Y transition into the curves.
 for(const q of[b,c,d]){const h=support.at(q[0],q[1]);if(h)q[2]=Math.max(q[2],h.p[2]+spec.depth+.028);}
 const controls=[a,b,c,d],before=controls.map(q=>q.slice()),metrics={id:spec.id,u:spec.u,side:spec.side,depthFitIterations:0,maximumControlDepthLift:0,maximumResidualZPenetration:0,maximumDepthStandOff:0,sourceControlPoints:before,controlPoints:null};
 const center=t=>cubic(...controls,t),tangent=t=>unit(cubicDerivative(...controls,t));
 function frame(t){const p=center(t),D=tangent(t),scalp=scalpNormal167(p,delta),N0=unit(blend3([0,0,1],scalp,smoother(.48,1.30,p[1]-delta[1]))),S=unit(cross(D,N0)),N=unit(cross(S,D));return{p,D,S,N};}
 function section(t,k){const f=frame(t),q=k/12,angle=q*Math.PI*2,rootScale=.045+.955*smoother(0,.14,t),tipScale=1-smoother(spec.taper,1,t),width=spec.width*rootScale*tipScale*(1+.055*Math.sin(t*4.7+spec.phase)*Math.sin(Math.PI*t)),depth=spec.depth*rootScale*tipScale*(.92+.08*Math.cos(t*3.3+spec.phase)),wander=.0055*Math.sin(Math.PI*t)**2*Math.sin(t*4.1+spec.phase),p=add(add(add(f.p,f.S,wander),f.S,width*Math.cos(angle)),f.N,depth*Math.sin(angle));return{p,f,width,depth};}
 // Resolve only observed depth overlap with the actual prepared head. A
 // violation changes the cubic control depths; the resulting whole curve is
 // still a single smooth polynomial with its own, unequal bend.
 for(let pass=0;pass<7;pass++){
  let worst=0,adjust=[0,0,0];
  for(let row=3;row<=48;row++){const t=row/48,r=1-t,B=[3*r*r*t,3*r*t*t,t*t*t];for(let k=0;k<12;k+=2){const p=section(t,k).p,h=support.at(p[0],p[1]);if(!h)continue;const miss=h.p[2]+.008-p[2];if(miss<=.0001)continue;worst=Math.max(worst,miss);const norm=B.reduce((s,b)=>s+b*b,0);for(let j=0;j<3;j++)adjust[j]=Math.max(adjust[j],miss*B[j]/norm);}}
  if(!worst)break;for(let j=0;j<3;j++)controls[j+1][2]+=adjust[j]*1.06;metrics.depthFitIterations++;
 }
 metrics.controlPoints=controls.map(q=>q.slice());metrics.maximumControlDepthLift=Math.max(...controls.map((q,i)=>q[2]-before[i][2]));
 if(metrics.maximumControlDepthLift>.15)throw Error('167 curve needs excessive control depth displacement: '+JSON.stringify(metrics));
 return{spec,controls,center,tangent,frame,section,metrics};
}
function makeRoundedLocks167(crown,capture,delta,support){
 const start=now(),P=[],UV=[],C=[],I=[],records=[],routes=[],N=64,K=12,base=new THREE.Color('#50413e'),metrics={vertices:0,triangles:0,nonfinite:0,degenerateTriangles:0,normalOpposedTriangles:0,minimumTriangleNormalAgreement:Infinity,maximumControlDepthLift:0,minimumSampledHeadDepthClearance:Infinity,sampledHeadHits:0,sampledHeadMisses:0,sampledHeadOverlap:0};
 for(const spec of SPECS167){
  const route=buildRoute167(spec,crown,delta,support,capture.headTilt),first=P.length/3,indexStart=I.length,shade=.96+.045*Math.sin(spec.u*17+.8)+.012*Math.sin(spec.u*79),arc=arcTable(route.center,128),total=arc.at(-1),parameters=[];
  for(let row=0;row<N;row++){
   const t=inverseArc(arc,total*row/N);parameters.push(t);
   for(let k=0;k<=K;k++){
    const sample=route.section(t,k),p=sample.p,alpha=1-smoother(.95,1,row/N);P.push(...p);UV.push(k/K+spec.phase*.173,.80*row/N);C.push(base.r*shade,base.g*shade,base.b*shade,alpha);
    if(!finite(p))metrics.nonfinite++;
    if(row>=4&&row%3===0&&k%2===0&&k<K){const h=support.at(p[0],p[1]);if(h){const clearance=p[2]-h.p[2];metrics.sampledHeadHits++;metrics.minimumSampledHeadDepthClearance=Math.min(metrics.minimumSampledHeadDepthClearance,clearance);route.metrics.maximumResidualZPenetration=Math.max(route.metrics.maximumResidualZPenetration,-clearance);route.metrics.maximumDepthStandOff=Math.max(route.metrics.maximumDepthStandOff,clearance);if(clearance<-.001)metrics.sampledHeadOverlap++;}else metrics.sampledHeadMisses++;}
   }
  }
  const tip=P.length/3,endpoint=route.center(1);P.push(...endpoint);UV.push(.5+spec.phase*.173,.80);C.push(base.r*shade,base.g*shade,base.b*shade,0);
  const root=P.length/3,rootPoint=route.center(0);P.push(...rootPoint);UV.push(.5+spec.phase*.173,0);C.push(base.r*shade,base.g*shade,base.b*shade,1);
  // One orientation is used for the whole tubular surface. This is not
  // per-triangle flipping to conceal a folded parameterization.
  const a=first+20*(K+1),b=a+1,c=a+K+1,normal=cross(sub(P.slice(c*3,c*3+3),P.slice(a*3,a*3+3)),sub(P.slice(b*3,b*3+3),P.slice(a*3,a*3+3))),radial=sub(P.slice(a*3,a*3+3),route.center(parameters[20])),forward=dot(normal,radial)>0;
  const face=(a,b,c)=>{if(forward)I.push(a,b,c);else I.push(a,c,b);};
  for(let row=0;row<N-1;row++)for(let k=0;k<K;k++){const a=first+row*(K+1)+k,b=a+K+1;face(a,b,a+1);face(a+1,b,b+1);}
  for(let k=0;k<K;k++){face(first+(N-1)*(K+1)+k,tip,first+(N-1)*(K+1)+k+1);face(root,first+k,first+k+1);}
  const record={...spec,first,vertexCount:(K+1)*N+2,indexStart,indexCount:I.length-indexStart,parameters,totalArcLength:total,...route.metrics};records.push(record);routes.push(route);metrics.maximumControlDepthLift=Math.max(metrics.maximumControlDepthLift,route.metrics.maximumControlDepthLift);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C,4));g.setIndex(I);g.computeVertexNormals();
 const normals=g.attributes.normal;
 for(const record of records)for(let row=0;row<N;row++){const a=record.first+row*(K+1),b=a+K,n=unit(add(attr(normals,a),attr(normals,b)));normals.setXYZ(a,...n);normals.setXYZ(b,...n);}
 const tangents=[];
 for(const[ri,record]of records.entries()){
  const route=routes[ri];for(let row=0;row<N;row++)for(let k=0;k<=K;k++){
   const i=record.first+row*(K+1)+k,n=attr(normals,i),angle=k/K*Math.PI*2,f=route.frame(record.parameters[row]),raw=add(f.S.map(x=>-x*Math.sin(angle)*specWidth(record,row)),f.N,Math.cos(angle)*specDepth(record,row)),tangent=unit(sub(raw,n.map(x=>x*dot(raw,n)))),hand=dot(cross(n,tangent),f.D)<0?-1:1;tangents.push(...tangent,hand);
  }
  for(const t of[1,0]){const i=record.first+(K+1)*N+(t===1?0:1),n=attr(normals,i),f=route.frame(t),raw=f.S,tangent=unit(sub(raw,n.map(x=>x*dot(raw,n))));tangents.push(...tangent,dot(cross(n,tangent),f.D)<0?-1:1);}
 }
 function specWidth(record,row){const t=record.parameters[row],r=.045+.955*smoother(0,.14,t),q=1-smoother(record.taper,1,t);return record.width*r*q*(1+.055*Math.sin(t*4.7+record.phase)*Math.sin(Math.PI*t));}
 function specDepth(record,row){const t=record.parameters[row],r=.045+.955*smoother(0,.14,t),q=1-smoother(record.taper,1,t);return record.depth*r*q*(.92+.08*Math.cos(t*3.3+record.phase));}
 g.setAttribute('tangent',new THREE.Float32BufferAttribute(tangents,4));g.computeBoundingBox();g.computeBoundingSphere();
 for(let k=0;k<I.length;k+=3){const ids=I.slice(k,k+3),ps=ids.map(i=>attr(g.attributes.position,i)),n=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0])),area=len(n);if(area<1e-12){metrics.degenerateTriangles++;continue;}const average=add(add(attr(normals,ids[0]),attr(normals,ids[1])),attr(normals,ids[2])),agreement=dot(n,average)/(area*len(average));metrics.minimumTriangleNormalAgreement=Math.min(metrics.minimumTriangleNormalAgreement,agreement);if(agreement<=0)metrics.normalOpposedTriangles++;}
 metrics.vertices=P.length/3;metrics.triangles=I.length/3;metrics.geometryBytes=g.index.array.byteLength+Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,0);metrics.elapsedMs=now()-start;return{geometry:g,metrics,records,routes};
}
function retainedRootRows167(u,side){return Math.round(8+7*(1-smoother(.64,.98,u))+2*Math.sin(u*31+(side<0?.6:1.9)));}
function retireCrown167(g){
 if(g.attributes.position.count!==24455||g.index.count!==47744*3)throw Error('167 legacy crown layout changed');
 const cut=filteredIndex(g,k=>{const face=k/3;if(face<14976)return false;const local=face-14976,side=local<16384?-1:1,cell=Math.floor((local%16384)/2),column=cell%128,row=Math.floor(cell/128);return column>=ROOT_RETIRED_COLUMN167&&row>=retainedRootRows167((column+.5)/128,side);});return cut;
}
export function applyFrontLocks167(groom,head,{strength=0}={}){
 if(strength!==0&&strength!==1)throw Error('167 has only one coarse OFF/ON mode');const previous=applications.get(groom);if(previous){if(strength!==1)throw Error('167 already applied; use a fresh groom');return previous.metrics;}if(!strength)return ZERO;
 const capture=captures.get(groom);if(!capture)throw Error('167 needs its optional accepted-source capture');const started=now(),crown=find(groom,CROWN),mass=find(groom,MASS),material=mass.material;
 if(!material.isMeshPhysicalMaterial||material.color.toArray().some(x=>x!==1)||material.alphaMap||!material.map||!material.normalMap)throw Error('167 requires the exact untinted ordinary MASS material');
 const{delta,max}=currentOffset(groom,capture),support=supportIndex(groom,head),surface=makeRoundedLocks167(crown,capture,delta,support),cut=retireCrown167(crown.geometry),privateMaterial=material.clone();privateMaterial.userData={};
 if(surface.metrics.nonfinite||surface.metrics.degenerateTriangles||surface.metrics.normalOpposedTriangles)throw Error('167 invalid emitted ribbon orientation: '+JSON.stringify(surface.metrics));
 const mesh=new THREE.Mesh(surface.geometry,privateMaterial);mesh.name=FRONT_MESH167;mesh.castShadow=mass.castShadow;mesh.receiveShadow=mass.receiveShadow;groom.add(mesh);crown.geometry.setIndex(cut.next);
 const metrics={version:VERSION,strength:1,applied:true,sourceCaptureMs:capture.captureMs,preparedTranslation:delta,translationAnchorResidual:max,...surface.metrics,removedTriangles:cut.removed,addedTriangles:surface.metrics.triangles,addedTextureBytes:0,perFrameWork:0,support:{...support.metrics},phaseMs:{headIndex:support.metrics.buildMs,lockEmission:surface.metrics.elapsedMs},elapsedMs:now()-started,spec:RIBBON167_SPEC};
 const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),frontLocks167:metrics};applications.set(groom,{metrics,capture,crown,cut,mesh,support,surface,originalUserData});return metrics;
}
export function setCoarseIsolation167(groom,enabled=true){
 if(!enabled)return restoreCoarseIsolation167(groom);const old=isolations.get(groom);if(old)return old.metrics;
 const capture=captures.get(groom);if(!capture)throw Error('167 coarse isolation needs capture');const changes=[],metrics={version:'coarse-hidden-upstream167',hidden:[]};
 for(const[name,rows]of[[DETAIL,capture.detail],[WISPS,capture.wisps]]){
  const mesh=find(groom,name),owned=new Uint8Array(mesh.geometry.attributes.position.count);for(const row of rows)owned.fill(1,row.first,row.first+row.count);
  const cut=filteredIndex(mesh.geometry,(k,index)=>{const a=owned[index.getX(k)],b=owned[index.getX(k+1)],c=owned[index.getX(k+2)];if(a||b||c){if(!(a&&b&&c))throw Error('167 fine ownership cuts a triangle');return true;}return false;});changes.push({mesh,...cut});metrics.hidden.push({mesh:name,removedTriangles:cut.removed,rows});
 }
 const fringe=find(groom,FRINGE),ranges=capture.rows.map(r=>({group:r.group,k:r.k,start:r.indexStart,count:r.firstKeptSegment*r.indicesPerSegment,cut:r.cut,cutArc:r.cutArc,length:r.length,firstKeptSegment:r.firstKeptSegment}));let r=0;
 const cut=filteredIndex(fringe.geometry,k=>{while(r<ranges.length&&k>=ranges[r].start+ranges[r].count)r++;return r<ranges.length&&k>=ranges[r].start&&k<ranges[r].start+ranges[r].count;});changes.push({mesh:fringe,...cut});metrics.hidden.push({mesh:FRINGE,removedTriangles:cut.removed,ranges});
 metrics.additionalDiagnosticIndexBytes=changes.reduce((s,c)=>s+c.next.array.byteLength,0);metrics.removedTriangles=changes.reduce((s,c)=>s+c.removed,0);
 for(const change of changes)change.mesh.geometry.setIndex(change.next);const originalUserData=groom.userData;groom.userData={...originalUserData,...actualGroomStats(groom),coarseIsolation167:metrics};isolations.set(groom,{changes,metrics,originalUserData});return metrics;
}
export function restoreCoarseIsolation167(groom){const old=isolations.get(groom);if(!old)return{restored:false};for(const c of old.changes)c.mesh.geometry.setIndex(c.old);groom.userData=old.originalUserData;isolations.delete(groom);return{restored:true};}
export function getFrontLocks167QA(groom){return{capture:captures.get(groom),application:applications.get(groom),isolation:isolations.get(groom)};}
export function releaseFrontLocks167(groom){restoreCoarseIsolation167(groom);const a=applications.get(groom);if(!a)return{released:false};a.crown.geometry.setIndex(a.cut.old);groom.remove(a.mesh);a.mesh.geometry.dispose();a.mesh.material.dispose();groom.userData=a.originalUserData;applications.delete(groom);return{released:true};}
