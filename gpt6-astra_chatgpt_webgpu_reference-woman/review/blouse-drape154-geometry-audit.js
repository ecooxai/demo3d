import {Matrix4} from 'three';

// Focused actual-triangle inspection for154. No source support query, source
// photograph sampling, material inference or scene-wide disjointness claim.
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a);
const at=(p,i)=>[p.getX(i),p.getY(i),p.getZ(i)],bounds=t=>[Math.min(...t.map(p=>p[0])),Math.min(...t.map(p=>p[1])),Math.min(...t.map(p=>p[2])),Math.max(...t.map(p=>p[0])),Math.max(...t.map(p=>p[1])),Math.max(...t.map(p=>p[2]))];
const overlaps=(a,b,e=1e-9)=>a[0]<=b[3]+e&&a[3]>=b[0]-e&&a[1]<=b[4]+e&&a[4]>=b[1]-e&&a[2]<=b[5]+e&&a[5]>=b[2]-e;
const pairBounds=(a,b)=>a.slice(0,3).map((v,i)=>Math.min(v,b[i])).concat(a.slice(3).map((v,i)=>Math.max(v,b[i+3])));

function segmentTriangle(p,q,t){
 const dir=sub(q,p),e1=sub(t[1],t[0]),e2=sub(t[2],t[0]),h=cross(dir,e2),det=dot(e1,h),scale=len(dir)*len(e1)*len(e2);
 if(Math.abs(det)<=Math.max(1e-25,scale*1e-10))return false;
 const inv=1/det,s=sub(p,t[0]),u=dot(s,h)*inv;if(u< -1e-9||u>1+1e-9)return false;
 const r=cross(s,e1),v=dot(dir,r)*inv;if(v< -1e-9||u+v>1+1e-9)return false;
 const k=dot(e2,r)*inv;return k>=-1e-9&&k<=1+1e-9;
}
function coplanarOverlap(a,b,n){
 const drop=Math.abs(n[0])>Math.abs(n[1])?(Math.abs(n[0])>Math.abs(n[2])?0:2):(Math.abs(n[1])>Math.abs(n[2])?1:2),axes=[0,1,2].filter(k=>k!==drop),p=a.map(v=>axes.map(k=>v[k])),q=b.map(v=>axes.map(k=>v[k]));
 const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),e=1e-12;
 const inside=(v,t)=>{const s=[orient(t[0],t[1],v),orient(t[1],t[2],v),orient(t[2],t[0],v)];return s.every(v=>v>=-e)||s.every(v=>v<=e);};
 if(p.some(v=>inside(v,q))||q.some(v=>inside(v,p)))return true;
 const between=(a,b,v)=>v[0]>=Math.min(a[0],b[0])-e&&v[0]<=Math.max(a[0],b[0])+e&&v[1]>=Math.min(a[1],b[1])-e&&v[1]<=Math.max(a[1],b[1])+e;
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){
  const a=p[i],b=p[(i+1)%3],c=q[j],d=q[(j+1)%3],s=orient(a,b,c),t=orient(a,b,d),u=orient(c,d,a),v=orient(c,d,b);
  if(((s>e&&t< -e)||(s< -e&&t>e))&&((u>e&&v< -e)||(u< -e&&v>e)))return true;
  if(Math.abs(s)<=e&&between(a,b,c)||Math.abs(t)<=e&&between(a,b,d)||Math.abs(u)<=e&&between(c,d,a)||Math.abs(v)<=e&&between(c,d,b))return true;
 }
 return false;
}
export function trianglesIntersect154(a,b){
 if(!overlaps(bounds(a),bounds(b)))return false;
 for(let k=0;k<3;k++)if(segmentTriangle(a[k],a[(k+1)%3],b)||segmentTriangle(b[k],b[(k+1)%3],a))return true;
 const n=cross(sub(a[1],a[0]),sub(a[2],a[0])),m=cross(sub(b[1],b[0]),sub(b[2],b[0])),nl=len(n),ml=len(m);
 if(nl<1e-16||ml<1e-16)return false;
 if(len(cross(n,m))<=nl*ml*1e-8&&Math.max(...b.map(p=>Math.abs(dot(n,sub(p,a[0])))/nl))<=1e-8)return coplanarOverlap(a,b,n);
 return false;
}
function zHit(t,x,y){
 const a=t[0],b=t[1],c=t[2],dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-dy*ex;
 if(Math.abs(det)<1e-16)return null;
 const u=((x-a[0])*ey-(y-a[1])*ex)/det,v=(dx*(y-a[1])-dy*(x-a[0]))/det;
 if(u< -1e-9||v< -1e-9||u+v>1+1e-9)return null;
 return a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]);
}

export function inspectBlouseTriangles154({blouse,mesh,sourceGeometry,candidateGeometry,hair,ownedIndices}){
 const started=performance.now(),selected=new Set(ownedIndices),old=sourceGeometry.getAttribute('position'),next=candidateGeometry.getAttribute('position'),idx=sourceGeometry.index.array,affected=[];
 if(old.count!==next.count||idx.length!==candidateGeometry.index.array.length)throw Error('154 triangle inventory changed.');
 let changed=0,nonfinite=0,newDegenerate=0,reversed=0,minCos=1,minAreaRatio=Infinity,maxAreaRatio=0;
 for(let i=0;i<old.count;i++)for(let k=0;k<3;k++){if(!Number.isFinite(next.array[i*3+k]))nonfinite++;if(old.array[i*3+k]!==next.array[i*3+k])changed++;}
 for(let t=0;t<idx.length;t+=3){
  const ids=[idx[t],idx[t+1],idx[t+2]];if(ids.every(i=>!selected.has(i)))continue;
  const a=ids.map(i=>at(old,i)),b=ids.map(i=>at(next,i)),na=cross(sub(a[1],a[0]),sub(a[2],a[0])),nb=cross(sub(b[1],b[0]),sub(b[2],b[0])),la=len(na),lb=len(nb);
  if(la>1e-15){const ratio=lb/la;minAreaRatio=Math.min(minAreaRatio,ratio);maxAreaRatio=Math.max(maxAreaRatio,ratio);if(lb<1e-15)newDegenerate++;else{const c=dot(na,nb)/(la*lb);minCos=Math.min(minCos,c);if(c<=0)reversed++;}}
  affected.push({id:t/3,ids,before:a,after:b,oldBounds:bounds(a),newBounds:bounds(b),union:pairBounds(bounds(a),bounds(b))});
 }
 const box=affected.reduce((b,t)=>b?pairBounds(b,t.union):t.union,null);if(!box)throw Error('154 no affected emitted strips.');
 blouse.updateWorldMatrix(true,true);hair.updateWorldMatrix(true,true);
 const inverse=new Matrix4().copy(blouse.matrixWorld).invert(),bodyFrame=new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld).elements;
 if(Math.max(...bodyFrame.map((v,i)=>Math.abs(v-(i%5===0?1:0))))>1e-12)throw Error('154 risk audit requires the same asserted torso frame.');
 const obstacles=[],inventory=[];let allHairTriangles=0,projectedCandidates=0;
 hair.traverse(o=>{
  if(!o.isMesh)return;const g=o.geometry,p=g.getAttribute('position'),index=g.index?.array;if(!index)throw Error('154 fixed hair is not indexed.');
  const m=new Matrix4().multiplyMatrices(inverse,o.matrixWorld).elements,xyz=new Float64Array(p.count*3);
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);xyz[i*3]=m[0]*x+m[4]*y+m[8]*z+m[12];xyz[i*3+1]=m[1]*x+m[5]*y+m[9]*z+m[13];xyz[i*3+2]=m[2]*x+m[6]*y+m[10]*z+m[14];}
  let used=0;allHairTriangles+=index.length/3;
  for(let i=0;i<index.length;i+=3){
   const a=index[i]*3,b=index[i+1]*3,c=index[i+2]*3,x0=Math.min(xyz[a],xyz[b],xyz[c]),x1=Math.max(xyz[a],xyz[b],xyz[c]),y0=Math.min(xyz[a+1],xyz[b+1],xyz[c+1]),y1=Math.max(xyz[a+1],xyz[b+1],xyz[c+1]);
   if(x1<box[0]||x0>box[3]||y1<box[1]||y0>box[4])continue;
   const t=[[xyz[a],xyz[a+1],xyz[a+2]],[xyz[b],xyz[b+1],xyz[b+2]],[xyz[c],xyz[c+1],xyz[c+2]]],bb=[x0,y0,Math.min(xyz[a+2],xyz[b+2],xyz[c+2]),x1,y1,Math.max(xyz[a+2],xyz[b+2],xyz[c+2])];
   obstacles.push({mesh:o.name,id:i/3,t,bounds:bb});used++;
  }
  projectedCandidates+=used;inventory.push({mesh:o.name,triangles:index.length/3,projectedTriangles:used});
 });
 let pairTests=0,beforePairs=0,afterPairs=0,newPairs=0,removedPairs=0,retainedPairs=0,rayHits=0,rayNewCrossings=0,minForwardGapBefore=Infinity,minForwardGapAfter=Infinity;
 const examples=[],rayExamples=[];
 for(const body of affected){
  for(const h of obstacles){
   if(!overlaps(body.union,h.bounds))continue;pairTests++;
   const before=trianglesIntersect154(body.before,h.t),after=trianglesIntersect154(body.after,h.t);
   if(before)beforePairs++;if(after)afterPairs++;if(before&&after)retainedPairs++;if(before&&!after)removedPairs++;
   if(after&&!before){newPairs++;if(examples.length<16)examples.push({bodyTriangle:body.id,hairMesh:h.mesh,hairTriangle:h.id,body:body.after,hair:h.t});}
  }
  const samples=[[1,0,0],[0,1,0],[0,0,1],[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3]];
  for(const w of samples){
   const a=[0,1,2].map(k=>w.reduce((s,v,i)=>s+v*body.before[i][k],0)),b=[0,1,2].map(k=>w.reduce((s,v,i)=>s+v*body.after[i][k],0));
   for(const h of obstacles){
    if(a[0]<h.bounds[0]-1e-9||a[0]>h.bounds[3]+1e-9||a[1]<h.bounds[1]-1e-9||a[1]>h.bounds[4]+1e-9)continue;
    const z=zHit(h.t,a[0],a[1]);if(z===null)continue;const ga=z-a[2],gb=z-b[2];
    if(ga< -1e-8)continue;rayHits++;minForwardGapBefore=Math.min(minForwardGapBefore,ga);minForwardGapAfter=Math.min(minForwardGapAfter,gb);
    if(gb< -1e-8){rayNewCrossings++;if(rayExamples.length<12)rayExamples.push({bodyTriangle:body.id,hairMesh:h.mesh,hairTriangle:h.id,beforeGap:ga,afterGap:gb,point:b});}
   }
  }
 }
 return{stage:'Actual current mesh triangles in blouse-local coordinates; caller supplies equally posed/balanced source and candidate.',scope:'Only emitted torso triangles touching the owned band and fixed hair triangles whose XY boxes overlap their union. Actual triangle-pair tests include finite edges and coplanar overlap. Projected vertex/edge/centroid gaps are additional samples, not shortest-distance or global disjointness proofs.',ownedVertices:selected.size,affectedTriangles:affected.length,changedPositionComponents:changed,nonfinite,newDegenerate,reversed,minTriangleNormalCosine:minCos,minAreaRatio,maxAreaRatio,unionBounds:box,allHairTriangles,projectedCandidates,obstacleInventory:inventory,triangleContacts:{pairTests,beforePairs,afterPairs,newPairs,removedPairs,retainedPairs,examples},sampledDepth:{samplesPerBodyTriangle:7,forwardHairHits:rayHits,minForwardGapBefore:Number.isFinite(minForwardGapBefore)?minForwardGapBefore:null,minForwardGapAfter:Number.isFinite(minForwardGapAfter)?minForwardGapAfter:null,newCrossings:rayNewCrossings,examples:rayExamples},elapsedMs:performance.now()-started};
}
