import {Matrix4} from 'three';
import {trianglesIntersect154} from './blouse-drape154-geometry-audit.js';

// Bounded actual-triangle gate for165. One small BVH over changed sleeve
// triangle union boxes, then a single pass over nearby fixed mesh triangles.
// No photographic sampling, implicit torso query, or repeated support grid.
const xyz=(p,i)=>[p.getX(i),p.getY(i),p.getZ(i)],sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a);
const box=t=>[Math.min(...t.map(p=>p[0])),Math.min(...t.map(p=>p[1])),Math.min(...t.map(p=>p[2])),Math.max(...t.map(p=>p[0])),Math.max(...t.map(p=>p[1])),Math.max(...t.map(p=>p[2]))];
const union=(a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.min(a[2],b[2]),Math.max(a[3],b[3]),Math.max(a[4],b[4]),Math.max(a[5],b[5])];
const overlap=(a,b,pad=1e-9)=>a[0]<=b[3]+pad&&a[3]>=b[0]-pad&&a[1]<=b[4]+pad&&a[4]>=b[1]-pad&&a[2]<=b[5]+pad&&a[5]>=b[2]-pad;
const empty=()=>[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
function makeBVH(rows){
 let nodes=0;const build=items=>{nodes++;const bounds=items.reduce((b,r)=>union(b,r.bounds),empty());if(items.length<=16)return{bounds,items};let axis=0;for(let k=1;k<3;k++)if(bounds[k+3]-bounds[k]>bounds[axis+3]-bounds[axis])axis=k;items.sort((a,b)=>(a.bounds[axis]+a.bounds[axis+3])-(b.bounds[axis]+b.bounds[axis+3]));const middle=items.length>>1;return{bounds,left:build(items.slice(0,middle)),right:build(items.slice(middle))};};
 const root=build(rows.slice());return{nodes,query(bounds,visit){const walk=node=>{if(!overlap(node.bounds,bounds))return;if(node.items){for(const r of node.items)if(overlap(r.bounds,bounds))visit(r);}else{walk(node.left);walk(node.right);}};walk(root);}};
}
function triangle(p,index,t){return[index[t*3],index[t*3+1],index[t*3+2]].map(i=>xyz(p,i));}
function zHit(t,x,y){const[a,b,c]=t,dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],d=dx*ey-dy*ex;if(Math.abs(d)<1e-16)return null;const u=((x-a[0])*ey-(y-a[1])*ex)/d,v=(dx*(y-a[1])-dy*(x-a[0]))/d;if(u< -1e-9||v< -1e-9||u+v>1+1e-9)return null;return a[2]+u*(b[2]-a[2])+v*(c[2]-a[2]);}
const positionFrame=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
function quickBounds(g,m){const b=g.boundingBox;if(!b?.min||!b?.max)return null;const corners=[];for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z])corners.push(positionFrame(m,[x,y,z]));return box(corners);}

export function inspectSleeveTriangles165({blouse,model,records}){
 const started=performance.now(),affected=[],targets=new Set(records.map(r=>r.mesh)),owners=new Map(records.map(r=>[r.mesh.name,r]));let nonfinite=0,newDegenerate=0,reversed=0,minTriangleCosine=1,minAreaRatio=Infinity,maxAreaRatio=0;
 for(const record of records){
  const p=record.original.getAttribute('position'),q=record.candidate.getAttribute('position'),index=record.original.index.array,owned=new Set(record.ownedIndices);
  if(p.count!==q.count||index.length!==record.candidate.index.count)throw Error('165 actual target triangle inventory changed.');
  for(const v of q.array)if(!Number.isFinite(v))nonfinite++;
  for(let id=0;id<index.length/3;id++){
   const ids=[index[id*3],index[id*3+1],index[id*3+2]];if(ids.every(i=>!owned.has(i)))continue;
   const a=triangle(p,index,id),b=triangle(q,index,id),na=cross(sub(a[1],a[0]),sub(a[2],a[0])),nb=cross(sub(b[1],b[0]),sub(b[2],b[0])),la=len(na),lb=len(nb);
   if(la>1e-15){const ratio=lb/la;minAreaRatio=Math.min(minAreaRatio,ratio);maxAreaRatio=Math.max(maxAreaRatio,ratio);if(lb<1e-15)newDegenerate++;else{const c=dot(na,nb)/(la*lb);minTriangleCosine=Math.min(minTriangleCosine,c);if(c<=0)reversed++;}}
   affected.push({mesh:record.mesh.name,id,before:a,after:b,bounds:union(box(a),box(b))});
  }
 }
 // The same pre99 source-owned index sets define OFF and ON. This includes
 // tiny normal-only entries and makes all inherited pair counts comparable.
 if(!affected.length)throw Error('165 no candidate-owned triangles for the focused interface gate.');
 const totalBox=affected.reduce((b,r)=>union(b,r.bounds),empty()),tree=makeBVH(affected);blouse.updateWorldMatrix(true,true);model.updateWorldMatrix(true,true);const inverse=new Matrix4().copy(blouse.matrixWorld).invert();
 for(const r of records){const frame=new Matrix4().multiplyMatrices(inverse,r.mesh.matrixWorld).elements;if(Math.max(...frame.map((v,i)=>Math.abs(v-(i%5===0?1:0))))>1e-12)throw Error('165 actual interface requires asserted sleeve-to-blouse identity.');}
 const inventory=[],beforeIDs=[],afterIDs=[],newIDs=[],removedIDs=[],examples=[];let totalSceneTriangles=0,nearbyTriangles=0,pairTests=0,peakPositionBytes=0;
 model.traverse(mesh=>{
  if(!mesh.isMesh||targets.has(mesh))return;const g=mesh.geometry,p=g?.getAttribute('position'),index=g?.index?.array;if(!p||!index)return;
  totalSceneTriangles+=index.length/3;const m=new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld).elements,quick=quickBounds(g,m);if(quick&&!overlap(quick,totalBox))return;
  const positions=new Float64Array(p.count*3);peakPositionBytes=Math.max(peakPositionBytes,positions.byteLength);const pointsBox=empty();for(let i=0;i<p.count;i++){const q=positionFrame(m,xyz(p,i));for(let k=0;k<3;k++){positions[i*3+k]=q[k];pointsBox[k]=Math.min(pointsBox[k],q[k]);pointsBox[k+3]=Math.max(pointsBox[k+3],q[k]);}}
  if(!overlap(pointsBox,totalBox))return;
  let nearby=0,oldCount=0,newCount=0,added=0,removed=0;
  for(let t=0;t<index.length;t+=3){
   const a=index[t]*3,b=index[t+1]*3,c=index[t+2]*3,bb=[Math.min(positions[a],positions[b],positions[c]),Math.min(positions[a+1],positions[b+1],positions[c+1]),Math.min(positions[a+2],positions[b+2],positions[c+2]),Math.max(positions[a],positions[b],positions[c]),Math.max(positions[a+1],positions[b+1],positions[c+1]),Math.max(positions[a+2],positions[b+2],positions[c+2])];
   if(!overlap(bb,totalBox))continue;nearby++;const tri=[[positions[a],positions[a+1],positions[a+2]],[positions[b],positions[b+1],positions[b+2]],[positions[c],positions[c+1],positions[c+2]]];
   tree.query(bb,r=>{
    pairTests++;const before=trianglesIntersect154(r.before,tri),after=trianglesIntersect154(r.after,tri),id=r.mesh+':'+r.id+' / '+mesh.name+':'+t/3;
    if(before){beforeIDs.push(id);oldCount++;}if(after){afterIDs.push(id);newCount++;}if(before&&!after){removedIDs.push(id);removed++;}if(after&&!before){newIDs.push(id);added++;if(examples.length<16)examples.push({pair:id,sleeve:r.after,fixed:tri});}
   });
  }
  nearbyTriangles+=nearby;inventory.push({mesh:mesh.name,triangles:index.length/3,nearbyTriangles:nearby,beforePairs:oldCount,afterPairs:newCount,newPairs:added,removedPairs:removed});
 });
 const torso=owners.get('blouse-continuous-torso-and-sleeves'),seam=owners.get('blouse-sleeve-attachment--1');
 const seamSupport=inspectSleeveSeam165(torso,seam);
 return{iteration:165,scope:'Actual owned sleeve and seam triangles against actual fixed scene triangles in their before/after union. One BVH plus one nearby-mesh pass. Full changed triangle-pair identities are retained. The two co-deformed owners are additionally checked by signed emitted seam-center support against the actual before/after torso at each corresponding moved X/Y. These are finite sampled checks, not a global disjointness certificate.',affectedTriangles:affected.length,nonfinite,newDegenerate,reversed,minTriangleCosine,minAreaRatio,maxAreaRatio,unionBounds:totalBox,bvhNodes:tree.nodes,totalSceneTriangles,nearbyTriangles,pairTests,obstacleInventory:inventory,contacts:{beforePairs:beforeIDs.length,afterPairs:afterIDs.length,newPairs:newIDs.length,removedPairs:removedIDs.length,retainedPairs:beforeIDs.length-removedIDs.length,beforeIDs,afterIDs,newIDs,removedIDs,examples},seamSupport,resources:{peakSingleTransformedPositionBytes:peakPositionBytes,persistentBuffersAfterReturn:0,extraSceneGeometry:0,elapsedMs:performance.now()-started}};
}

function inspectSleeveSeam165(torso,seam){
 const sampleTriangles=g=>{const p=g.getAttribute('position'),idx=g.index.array,out=[];
  for(let id=0;id<idx.length/3;id++){const tri=triangle(p,idx,id),b=box(tri);if(b[3]<-2.25||b[0]>-1.20||b[4]<-.60||b[1]>1.18||b[5]<-.05)continue;out.push({id,tri,bounds:b});}return out;};
 const before=sampleTriangles(torso.original),after=sampleTriangles(torso.candidate),ap=seam.original.getAttribute('position'),bp=seam.candidate.getAttribute('position');
 const center=(p,j)=>{const r=[0,0,0];for(let k=0;k<4;k++)for(let c=0;c<3;c++)r[c]+=p.array[(j*5+k)*3+c]/4;return r;};
 const support=(rows,p)=>{let nearest=null;for(const row of rows){if(p[0]<row.bounds[0]-1e-9||p[0]>row.bounds[3]+1e-9||p[1]<row.bounds[1]-1e-9||p[1]>row.bounds[4]+1e-9)continue;const z=zHit(row.tri,p[0],p[1]);if(z!==null&&(!nearest||Math.abs(p[2]-z)<Math.abs(nearest.gap)))nearest={gap:p[2]-z,triangle:row.id};}return nearest;};
 let beforeMissing=0,afterMissing=0,newMissing=0,newInside=0,matched=0,minBefore=Infinity,minAfter=Infinity,maxBefore=-Infinity,maxAfter=-Infinity,maxAdditionalSeparation=-Infinity,maxAdditionalInset=0;const examples=[];
 for(let j=0;j<=112;j++){
  const k=Math.floor(j/2),a=center(ap,k),b=center(bp,k);if(j%2){const aa=center(ap,k+1),bb=center(bp,k+1);for(let c=0;c<3;c++){a[c]=(a[c]+aa[c])*.5;b[c]=(b[c]+bb[c])*.5;}}
  const old=support(before,a),next=support(after,b);if(!old)beforeMissing++;if(!next)afterMissing++;if(old&&!next)newMissing++;
  if(old){minBefore=Math.min(minBefore,old.gap);maxBefore=Math.max(maxBefore,old.gap);}if(next){minAfter=Math.min(minAfter,next.gap);maxAfter=Math.max(maxAfter,next.gap);}
  if(old&&next){matched++;const change=next.gap-old.gap;maxAdditionalSeparation=Math.max(maxAdditionalSeparation,change);maxAdditionalInset=Math.min(maxAdditionalInset,change);if(old.gap>=0&&next.gap<0)newInside++;if(Math.abs(change)>.001&&examples.length<16)examples.push({segment:j/2,before:old,after:next,beforePoint:a,afterPoint:b,change});}
 }
 const finite=x=>Number.isFinite(x)?x:null;
 return{scope:'113 existing seam ring centers/segment midpoints; before queries use old X/Y and after queries use actual moved X/Y. Signed Z offset to nearest actual front-torso triangle. Negative means center behind that directional support, not a signed volumetric penetration depth. Tube surfaces and changing pair identities require separate art interpretation.',samples:113,matched,beforeMissing,afterMissing,newMissing,newInside,minBefore:finite(minBefore),minAfter:finite(minAfter),maxBefore:finite(maxBefore),maxAfter:finite(maxAfter),maxAdditionalSeparation:finite(maxAdditionalSeparation),maxAdditionalInset,examples};
}
