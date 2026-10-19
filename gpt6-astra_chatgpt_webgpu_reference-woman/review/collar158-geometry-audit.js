import {Matrix4} from 'three';
import {trianglesIntersect154} from './blouse-drape154-geometry-audit.js';

// Bounded actual-triangle gate for158. One small BVH over changed collar
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

function shellSeparation(record){
 const before=record.original.getAttribute('position'),after=record.candidate.getAttribute('position'),index=record.original.index.array,back=[];let minimumVertexSeparation=Infinity,minimumRatio=Infinity,maximumRatio=0;
 for(let i=0;i<1225;i++){const a=len(sub(xyz(before,i),xyz(before,i+1225))),b=len(sub(xyz(after,i),xyz(after,i+1225)));minimumVertexSeparation=Math.min(minimumVertexSeparation,b);minimumRatio=Math.min(minimumRatio,b/a);maximumRatio=Math.max(maximumRatio,b/a);}
 for(let id=2304;id<4608;id++){const a=triangle(before,index,id),b=triangle(after,index,id);back.push({id,before:a,after:b,bounds:union(box(a),box(b))});}
 const tree=makeBVH(back);let pairTests=0,beforePairs=0,afterPairs=0,newPairs=0,removedPairs=0;const examples=[];
 for(let id=0;id<2304;id++){const a=triangle(before,index,id),b=triangle(after,index,id);tree.query(union(box(a),box(b)),r=>{pairTests++;const old=trianglesIntersect154(a,r.before),next=trianglesIntersect154(b,r.after);if(old)beforePairs++;if(next)afterPairs++;if(old&&!next)removedPairs++;if(next&&!old){newPairs++;if(examples.length<8)examples.push([id,r.id]);}});}
 return{mesh:record.mesh.name,scope:'Actual2304 front triangles against2304 back triangles; closing side-wall triangles are not counted as self-intersections.',minimumVertexSeparation,minimumThicknessRatio:minimumRatio,maximumThicknessRatio:maximumRatio,pairTests,beforePairs,afterPairs,newPairs,removedPairs,examples};
}

function seamSupport(leaf,edge){
 const old=leaf.original.getAttribute('position'),next=leaf.candidate.getAttribute('position'),index=leaf.original.index.array,source=[],changed=[];
 for(let id=0;id<2304;id++){const a=triangle(old,index,id),b=triangle(next,index,id);source.push(a);changed.push(b);}
 const ringCenter=(p,j)=>{const out=[0,0,0];for(let k=0;k<4;k++)for(let c=0;c<3;c++)out[c]+=p.array[(j*5+k)*3+c]/4;return out;};
 const support=(triangles,p)=>{let best=null;for(const t of triangles){const z=zHit(t,p[0],p[1]);if(z!==null&&(best===null||Math.abs(p[2]-z)<Math.abs(best)))best=p[2]-z;}return best;};
 const a=edge.original.getAttribute('position'),b=edge.candidate.getAttribute('position');let beforeMissing=0,afterMissing=0,newMissing=0,maxPositiveBefore=-Infinity,maxPositiveAfter=-Infinity,maxAdditionalSeparation=-Infinity,matches=0;const examples=[];
 for(let j=0;j<=192;j++){
  const k=Math.floor(j/2),oldCenter=ringCenter(a,k),newCenter=ringCenter(b,k);if(j%2){const x=ringCenter(a,k+1),y=ringCenter(b,k+1);for(let c=0;c<3;c++){oldCenter[c]=(oldCenter[c]+x[c])*.5;newCenter[c]=(newCenter[c]+y[c])*.5;}}
  const d0=support(source,oldCenter),d1=support(changed,newCenter);if(d0===null)beforeMissing++;if(d1===null)afterMissing++;if(d0!==null&&d1===null)newMissing++;
  if(d0!==null)maxPositiveBefore=Math.max(maxPositiveBefore,d0);if(d1!==null)maxPositiveAfter=Math.max(maxPositiveAfter,d1);
  if(d0!==null&&d1!==null){matches++;const delta=d1-d0;maxAdditionalSeparation=Math.max(maxAdditionalSeparation,delta);if(delta>.001&&examples.length<8)examples.push({segment:j/2,before:d0,after:d1,delta});}
 }
 return{mesh:edge.mesh.name,scope:'193 actual edge-tube ring centers and emitted segment midpoints projected to actual own front-leaf triangles. Signed Z stand-off; not shortest distance or full tube-volume containment.',samples:193,matches,beforeMissing,afterMissing,newMissing,maxPositiveBefore:Number.isFinite(maxPositiveBefore)?maxPositiveBefore:null,maxPositiveAfter:Number.isFinite(maxPositiveAfter)?maxPositiveAfter:null,maxAdditionalSeparation:Number.isFinite(maxAdditionalSeparation)?maxAdditionalSeparation:null,examples};
}

export function inspectCollarTriangles158({blouse,model,records}){
 const started=performance.now(),affected=[],targets=new Set(records.map(r=>r.mesh)),owners=new Map(records.map(r=>[r.mesh.name,r]));let nonfinite=0,newDegenerate=0,reversed=0,minTriangleCosine=1,minAreaRatio=Infinity,maxAreaRatio=0;
 for(const record of records){
  const p=record.original.getAttribute('position'),q=record.candidate.getAttribute('position'),index=record.original.index.array,owned=new Set(record.ownedIndices);
  if(p.count!==q.count||index.length!==record.candidate.index.count)throw Error('158 actual target triangle inventory changed.');
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
 if(!affected.length)throw Error('158 no candidate-owned triangles for the focused interface gate.');
 const totalBox=affected.reduce((b,r)=>union(b,r.bounds),empty()),tree=makeBVH(affected);blouse.updateWorldMatrix(true,true);model.updateWorldMatrix(true,true);const inverse=new Matrix4().copy(blouse.matrixWorld).invert();
 for(const r of records){const frame=new Matrix4().multiplyMatrices(inverse,r.mesh.matrixWorld).elements;if(Math.max(...frame.map((v,i)=>Math.abs(v-(i%5===0?1:0))))>1e-12)throw Error('158 actual interface requires asserted collar-to-blouse identity.');}
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
    if(before){beforeIDs.push(id);oldCount++;}if(after){afterIDs.push(id);newCount++;}if(before&&!after){removedIDs.push(id);removed++;}if(after&&!before){newIDs.push(id);added++;if(examples.length<16)examples.push({pair:id,collar:r.after,fixed:tri});}
   });
  }
  nearbyTriangles+=nearby;inventory.push({mesh:mesh.name,triangles:index.length/3,nearbyTriangles:nearby,beforePairs:oldCount,afterPairs:newCount,newPairs:added,removedPairs:removed});
 });
 const shells=[],seams=[];for(const side of['left','right']){const leaf=owners.get('blouse-'+side+'-spread-collar'),edge=owners.get('blouse-'+side+'-collar-edge');shells.push(shellSeparation(leaf));seams.push(seamSupport(leaf,edge));}
 // The opposite leaf/edge assembly is also owned, so it was deliberately not
 // included in the fixed-scene pass. Its complete vertex X intervals are
 // disjoint in this bounded study, which excludes every inter-side triangle.
 const oppositeSides=[];for(const key of['original','candidate']){let leftMax=-Infinity,rightMin=Infinity;for(const r of records){const p=r[key].getAttribute('position'),left=r.mesh.name.includes('-left-');for(let i=0;i<p.count;i++)if(left)leftMax=Math.max(leftMax,p.getX(i));else rightMin=Math.min(rightMin,p.getX(i));}const gap=rightMin-leftMax;if(!(gap>0))throw Error('158 opposite collar assemblies no longer have disjoint X bounds.');oppositeSides.push({state:key==='original'?'before':'after',leftMaximumX:leftMax,rightMinimumX:rightMin,minimumAxisGap:gap,scope:'Complete leaf and edge-tube vertex X bounds; positive separation excludes actual opposite-side triangle intersections.'});}
 return{iteration:158,scope:'Actual owned collar triangles versus fixed scene triangles whose3D boxes overlap their before/after union; one BVH and one nearby-geometry pass. Stored pair identities distinguish inherited intersections from introduced ones. Actual own-leaf front/back triangles and sampled emitted edge-tube support are checked separately. Opposite owned sides have an explicit complete-vertex separating-axis bound. No global scene-disjointness claim.',affectedTriangles:affected.length,nonfinite,newDegenerate,reversed,minTriangleCosine,minAreaRatio,maxAreaRatio,unionBounds:totalBox,bvhNodes:tree.nodes,totalSceneTriangles,nearbyTriangles,pairTests,obstacleInventory:inventory,contacts:{beforePairs:beforeIDs.length,afterPairs:afterIDs.length,newPairs:newIDs.length,removedPairs:removedIDs.length,retainedPairs:beforeIDs.length-removedIDs.length,beforeIDs,afterIDs,newIDs,removedIDs,examples},shells,seams,oppositeSides,resources:{peakSingleTransformedPositionBytes:peakPositionBytes,persistentBuffersAfterReturn:0,extraSceneGeometry:0,elapsedMs:performance.now()-started}};
}
