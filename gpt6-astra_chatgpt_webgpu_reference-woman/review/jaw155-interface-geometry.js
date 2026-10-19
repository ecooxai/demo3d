import { triangleDistanceSquared144 } from './near-ear144-geometry.mjs';

// Narrow, endpoint-only QA of the already accepted 155 shape. No retained
// geometry, textures, GPU resources, per-frame work, or source mutation.
export const INTERFACE155 = Object.freeze({
  contactWindow: .001, contactTolerance: 1e-8, earAttachmentBand: .005,
  rayCoincidenceTolerance: 1e-7, photoBinPixels: 16, maximumExamples: 12,
});
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  scale=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  clamp=x=>Math.max(0,Math.min(1,x)), norm=a=>Math.hypot(...a),
  unit=a=>{const n=norm(a);if(!(n>1e-12))throw Error('155 interface degenerate direction.');return scale(a,1/n);};
const emptyBox=()=>[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
function include(a,b){for(let k=0;k<3;k++){a[k]=Math.min(a[k],b[k]);a[k+3]=Math.max(a[k+3],b[k+3]);}return a;}
function boxDistance(a,ao,b,bo=0){let d=0;for(let k=0;k<3;k++){const v=Math.max(0,a[ao+k]-b[bo+k+3],b[bo+k]-a[ao+k+3]);d+=v*v;}return d;}
const point=(p,i)=>[p[i*3],p[i*3+1],p[i*3+2]];
function triangle(p,index,t,out){for(let k=0;k<3;k++){const j=index[t*3+k]*3;out.p[k][0]=p[j];out.p[k][1]=p[j+1];out.p[k][2]=p[j+2];}return out;}
const scratchTriangle=()=>({p:[[0,0,0],[0,0,0],[0,0,0]]});
function triangleBounds(p,index,t,out){
  const a=index[t*3]*3,b=index[t*3+1]*3,c=index[t*3+2]*3;
  for(let k=0;k<3;k++){out[k]=Math.min(p[a+k],p[b+k],p[c+k]);out[k+3]=Math.max(p[a+k],p[b+k],p[c+k]);}return out;
}
function unionTriangleBounds(a,b,index,t,out,tmp){triangleBounds(a,index,t,out);if(a!==b)include(out,triangleBounds(b,index,t,tmp));return out;}
function changedTriangle(a,b,index,t){for(let k=0;k<3;k++){const j=index[t*3+k]*3;for(let c=0;c<3;c++)if(a[j+c]!==b[j+c])return true;}return false;}
function triangleAreaSquared(p,index,t){
  const a=index[t*3]*3,b=index[t*3+1]*3,c=index[t*3+2]*3,
    ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2];
  return (uy*vz-uz*vy)**2+(uz*vx-ux*vz)**2+(ux*vy-uy*vx)**2;
}
function ledger(){
  let current=0,peak=0,allocated=0;const live=new Set();
  return{make(Type,n){const a=new Type(n);live.add(a);current+=a.byteLength;allocated+=a.byteLength;peak=Math.max(peak,current);return a;},
    drop(a){if(live.delete(a))current-=a.byteLength;},
    report:()=>({trackedTypedBufferPeakBytes:peak,trackedTypedBufferTotalAllocatedBytes:allocated,trackedTypedBuffersStillHeld:live.size,trackedTypedBytesStillHeld:current,
      interpretation:'Tracks audit-owned typed arrays only. Original/replacement geometry, JavaScript object overhead and renderer allocations are separate. Arrays are not returned or cached.'})};
}
function worldPositions(geometry,matrix,L){
  const a=matrix.elements,p=geometry.attributes.position,out=L.make(Float64Array,p.count*3);
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),j=i*3;
    out[j]=a[0]*x+a[4]*y+a[8]*z+a[12];out[j+1]=a[1]*x+a[5]*y+a[9]*z+a[13];out[j+2]=a[2]*x+a[6]*y+a[10]*z+a[14];
    if(!Number.isFinite(out[j]+out[j+1]+out[j+2]))throw Error('155 interface encountered nonfinite world positions.');
  }return out;
}
function projectPositions(p,axes,L){const out=L.make(Float64Array,p.length);for(let i=0;i<p.length;i+=3)for(let k=0;k<3;k++)out[i+k]=axes[k][0]*p[i]+axes[k][1]*p[i+1]+axes[k][2]*p[i+2];return out;}
function transformPositions(p,m,L){const out=L.make(Float64Array,p.length);for(let i=0;i<p.length;i+=3)for(let k=0;k<3;k++)out[i+k]=m[k]*p[i]+m[k+4]*p[i+1]+m[k+8]*p[i+2]+m[k+12];return out;}
function positionsBox(p){const out=emptyBox();for(let i=0;i<p.length;i+=3)for(let k=0;k<3;k++){out[k]=Math.min(out[k],p[i+k]);out[k+3]=Math.max(out[k+3],p[i+k]);}return out;}

// Median BVH over flat triangle bounds. Leaves contain at most 16 triangles;
// every nonroot leaf has at least 8, bounding node allocation in advance.
function makeBVH(bounds,n,L){
  if(!n)return{query(){},dispose(){},nodes:0};
  const order=L.make(Uint32Array,n),capacity=n<=16?1:2*Math.ceil(n/8),nodeBox=L.make(Float64Array,capacity*6),
    starts=L.make(Uint32Array,capacity),ends=L.make(Uint32Array,capacity),left=L.make(Int32Array,capacity),right=L.make(Int32Array,capacity);
  for(let i=0;i<n;i++)order[i]=i;left.fill(-1);right.fill(-1);let nodes=0;
  const center=(i,k)=>bounds[order[i]*6+k]+bounds[order[i]*6+k+3];
  function select(lo,hi,target,axis){
    while(lo<hi){let i=lo,j=hi;const pivot=center((lo+hi)>>1,axis);
      while(i<=j){while(center(i,axis)<pivot)i++;while(center(j,axis)>pivot)j--;if(i<=j){const v=order[i];order[i]=order[j];order[j]=v;i++;j--;}}
      if(target<=j)hi=j;else if(target>=i)lo=i;else return;
    }
  }
  function build(lo,hi){
    const id=nodes++;if(id>=capacity)throw Error('155 interface BVH allocation bound failed.');const off=id*6;
    for(let k=0;k<3;k++){nodeBox[off+k]=Infinity;nodeBox[off+k+3]=-Infinity;}
    for(let i=lo;i<hi;i++){const a=order[i]*6;for(let k=0;k<3;k++){nodeBox[off+k]=Math.min(nodeBox[off+k],bounds[a+k]);nodeBox[off+k+3]=Math.max(nodeBox[off+k+3],bounds[a+k+3]);}}
    starts[id]=lo;ends[id]=hi;
    if(hi-lo>16){let axis=0;for(let k=1;k<3;k++)if(nodeBox[off+k+3]-nodeBox[off+k]>nodeBox[off+axis+3]-nodeBox[off+axis])axis=k;const mid=(lo+hi)>>1;select(lo,hi-1,mid,axis);left[id]=build(lo,mid);right[id]=build(mid,hi);}
    return id;
  }
  build(0,n);
  function query(box,pad,visit){const limit=pad*pad;function walk(node){if(boxDistance(nodeBox,node*6,box)>limit)return;
    if(left[node]<0){for(let i=starts[node];i<ends[node];i++){const row=order[i];if(boxDistance(bounds,row*6,box)<=limit)visit(row);}}
    else{walk(left[node]);walk(right[node]);}}
    walk(0);
  }
  return{query,nodes,dispose(){for(const a of[order,nodeBox,starts,ends,left,right])L.drop(a);}};
}
function triangleSet(before,after,index,L,{onlyChanged=false,roi=null,projected=false}={}){
  const selected=[],box=emptyBox(),tmp=emptyBox(),all=emptyBox();let omittedDegenerate=0;
  for(let t=0;t<index.length/3;t++){
    if(onlyChanged&&!changedTriangle(before,after,index,t))continue;
    unionTriangleBounds(before,after,index,t,box,tmp);if(projected){box[2]=0;box[5]=0;}
    if(roi&&boxDistance(box,0,roi)>0)continue;
    if(!projected&&triangleAreaSquared(before,index,t)<1e-26){omittedDegenerate++;continue;}
    selected.push(t);include(all,box);
  }
  const ids=L.make(Uint32Array,selected.length),bounds=L.make(Float64Array,selected.length*6);ids.set(selected);selected.length=0;
  for(let r=0;r<ids.length;r++){unionTriangleBounds(before,after,index,ids[r],box,tmp);if(projected){box[2]=0;box[5]=0;}bounds.set(box,r*6);}
  const bvh=makeBVH(bounds,ids.length,L);
  return{ids,bounds,bvh,before,after,index,box:all,omittedDegenerate,dispose(){bvh.dispose();L.drop(ids);L.drop(bounds);}};
}

// Closest/contact witnesses are calculated only for changed contact identities.
// They localize the actual contact, rather than the centroid of a long triangle.
function closestPoint(p,a,b,c){
  const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);if(d1<=0&&d2<=0)return a.slice();
  const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return b.slice();
  const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0)return add(a,scale(ab,d1/(d1-d3)));
  const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return c.slice();
  const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0)return add(a,scale(ac,d2/(d2-d6)));
  const va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0)return add(b,scale(sub(c,b),(d4-d3)/(d4-d3+d5-d6)));
  const sum=va+vb+vc;if(Math.abs(sum)<1e-30)return[a,b,c].reduce((best,q)=>dot(sub(p,q),sub(p,q))<dot(sub(p,best),sub(p,best))?q:best,a).slice();
  return add(a,add(scale(ab,vb/sum),scale(ac,vc/sum)));
}
function closestSegments(p1,q1,p2,q2){
  const d1=sub(q1,p1),d2=sub(q2,p2),r=sub(p1,p2),a=dot(d1,d1),e=dot(d2,d2),f=dot(d2,r);let s=0,t=0;
  if(a<=1e-24&&e<=1e-24)return[p1.slice(),p2.slice()];
  if(a<=1e-24)t=clamp(f/e);else{const c=dot(d1,r);if(e<=1e-24)s=clamp(-c/a);else{const b=dot(d1,d2),den=a*e-b*b;s=den>1e-30?clamp((b*f-c*e)/den):0;t=(b*s+f)/e;if(t<0){t=0;s=clamp(-c/a);}else if(t>1){t=1;s=clamp((b-c)/a);}}}
  return[add(p1,scale(d1,s)),add(p2,scale(d2,t))];
}
function segmentHit(p,q,a,b,c){
  const d=sub(q,p),e1=sub(b,a),e2=sub(c,a),h=cross(d,e2),den=dot(e1,h);if(Math.abs(den)<1e-18)return null;
  const s=sub(p,a),u=dot(s,h)/den;if(u<0||u>1)return null;const v=dot(d,cross(s,e1))/den;if(v<0||u+v>1)return null;
  const t=dot(e2,cross(s,e1))/den;return t>=0&&t<=1?add(p,scale(d,t)):null;
}
export function contactWitness155(a,b){
  for(let i=0;i<3;i++){const hit=segmentHit(a.p[i],a.p[(i+1)%3],...b.p)||segmentHit(b.p[i],b.p[(i+1)%3],...a.p);if(hit)return{moving:hit,obstacle:hit.slice(),squared:0,kind:'edge/triangle intersection'};}
  let best={squared:Infinity};const consider=(p,q)=>{const d=dot(sub(p,q),sub(p,q));if(d<best.squared)best={moving:p.slice(),obstacle:q.slice(),squared:d,kind:'closest points within contact tolerance'};};
  for(let i=0;i<3;i++){consider(a.p[i],closestPoint(a.p[i],...b.p));consider(closestPoint(b.p[i],...a.p),b.p[i]);for(let j=0;j<3;j++)consider(...closestSegments(a.p[i],a.p[(i+1)%3],b.p[j],b.p[(j+1)%3]));}return best;
}
function bins(){const b=new Map();return{add(photo){const x=Math.floor(photo[0]/INTERFACE155.photoBinPixels),y=Math.floor(photo[1]/INTERFACE155.photoBinPixels),key=x+':'+y;let q=b.get(key);if(!q){q={photoBounds:[x*16,(x+1)*16,y*16,(y+1)*16],count:0};b.set(key,q);}q.count++;return key;},values:()=>[...b.values()].sort((a,b)=>a.photoBounds[2]-b.photoBounds[2]||a.photoBounds[0]-b.photoBounds[0])};}
function materialSummary(mesh){const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];return list.map(m=>({name:m.name,type:m.type,side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,vertexColors:m.vertexColors,alphaMap:!!m.alphaMap,map:!!m.map,depthWrite:m.depthWrite,
  interpretation:'Contact tests use geometry regardless of alpha coverage or view-dependent visibility.'}));}
function contactRow(part,mesh,positions,field){
  const limit=INTERFACE155.contactTolerance**2,window2=INTERFACE155.contactWindow**2,index=mesh.geometry.index.array,
    out={moving:part.name,obstacle:mesh.name,parent:mesh.parent.name,
      movingTriangles:part.set.ids.length,allObstacleTriangles:index.length/3,boundsOverlappingObstacleTriangles:0,exactPairs:0,
      beforeContacts:0,afterContacts:0,retainedContacts:0,newContacts:0,removedContacts:0,
      minimumBeforeWithinWindow:null,minimumAfterWithinWindow:null,newPairIDs:[],removedPairIDs:[],newContactExamples:[],removedContactExamples:[],materials:materialSummary(mesh)},
    box=emptyBox(),old=scratchTriangle(),next=scratchTriangle(),obstacle=scratchTriangle(),newBins=bins(),removedBins=bins(),seenNew=new Set(),seenRemoved=new Set();
  let oldMin=Infinity,nextMin=Infinity;
  for(let t=0;t<index.length/3;t++){
    triangleBounds(positions,index,t,box);if(boxDistance(part.set.box,0,box)>window2)continue;out.boundsOverlappingObstacleTriangles++;
    if(triangleAreaSquared(positions,index,t)<1e-26)continue;triangle(positions,index,t,obstacle);
    part.set.bvh.query(box,INTERFACE155.contactWindow,row=>{
      const movingID=part.set.ids[row];triangle(part.before,part.index,movingID,old);triangle(part.after,part.index,movingID,next);
      const d0=triangleDistanceSquared144(old,obstacle),d1=triangleDistanceSquared144(next,obstacle);out.exactPairs++;
      if(!Number.isFinite(d0+d1)||d0<0||d1<0)throw Error('155 interface triangle distance is invalid.');
      if(d0<=window2)oldMin=Math.min(oldMin,d0);if(d1<=window2)nextMin=Math.min(nextMin,d1);
      const a=d0<=limit,b=d1<=limit;if(a)out.beforeContacts++;if(b)out.afterContacts++;if(a&&b)out.retainedContacts++;
      if(a===b)return;
      const w=contactWitness155(b?next:old,obstacle);if(w.squared>4*limit)throw Error('155 contact witness does not match the established contact.');
      const center=scale(add(w.moving,w.obstacle),.5),photo=field.project(center[0],center[1]),which=b?newBins:removedBins,key=which.add(photo),seen=b?seenNew:seenRemoved,
        examples=b?out.newContactExamples:out.removedContactExamples;
      if(b){out.newContacts++;out.newPairIDs.push(movingID,t);}else{out.removedContacts++;out.removedPairIDs.push(movingID,t);}
      if(!seen.has(key)&&examples.length<INTERFACE155.maximumExamples){seen.add(key);examples.push({movingTriangle:movingID,obstacleTriangle:t,beforeDistance:Math.sqrt(d0),afterDistance:Math.sqrt(d1),worldContact:center,photoContact:photo,witnessKind:w.kind,witnessSeparation:Math.sqrt(w.squared)});}
    });
  }
  out.minimumBeforeWithinWindow=Number.isFinite(oldMin)?Math.sqrt(oldMin):null;out.minimumAfterWithinWindow=Number.isFinite(nextMin)?Math.sqrt(nextMin):null;
  out.newContactPhotoBins=newBins.values();out.removedContactPhotoBins=removedBins.values();
  out.pairIdentityFormat='Flat alternating moving-triangle, obstacle-triangle IDs. Every new/removed endpoint pair is retained; examples are limited and spatial bins include every changed pair.';
  return out;
}

function interpolateProjected(p,index,t,x,y){
  const a=index[t*3]*3,b=index[t*3+1]*3,c=index[t*3+2]*3,den=(p[b+1]-p[c+1])*(p[a]-p[c])+(p[c]-p[b])*(p[a+1]-p[c+1]);
  // Positive winding is the front-facing surface along the projected +depth.
  if(den<=1e-14)return null;
  const u=((p[b+1]-p[c+1])*(x-p[c])+(p[c]-p[b])*(y-p[c+1]))/den,v=((p[c+1]-p[a+1])*(x-p[c])+(p[a]-p[c])*(y-p[c+1]))/den,w=1-u-v;
  return Math.min(u,v,w)>=-1e-9?{depth:u*p[a+2]+v*p[b+2]+w*p[c+2],barycentric:[u,v,w]}:null;
}
function planarROI(points){const b=positionsBox(points);b[2]=b[5]=0;for(const k of[0,1]){b[k]-=1e-9;b[k+3]+=1e-9;}return b;}
function planarHits(set,x,y,visit){const box=[x,y,0,x,y,0];set.bvh.query(box,1e-9,row=>{const t=set.ids[row];for(const [name,p]of[['before',set.before],['after',set.after]]){const hit=interpolateProjected(p,set.index,t,x,y);if(hit)visit(name,t,hit);}});}
function materialSlotFor(geometry,triangle){const offset=triangle*3;return geometry.groups.find(g=>offset>=g.start&&offset<g.start+g.count)?.materialIndex||0;}

function earSupport(face,ear,head,field,L){
  const inv=head.matrixWorld.clone().invert().elements,old=transformPositions(face.before,inv,L),next=transformPositions(face.after,inv,L),earWorld=worldPositions(ear.geometry,ear.matrixWorld,L),earHead=transformPositions(earWorld,inv,L),
    side=ear.parent.name==='left-ear'?-1:1,axisLength=Math.hypot(head.matrixWorld.elements[0],head.matrixWorld.elements[1],head.matrixWorld.elements[2]),
    axes=[[0,1,0],[0,0,side],[side,0,0]],a=projectPositions(old,axes,L),b=projectPositions(next,axes,L),samples=projectPositions(earHead,axes,L),set=triangleSet(a,b,face.index,L,{roi:planarROI(samples),projected:true}),
    out={ear:ear.parent.name,vertices:ear.geometry.attributes.position.count,faceTrianglesInProjectedEarBounds:set.ids.length,
      lateralAxisWorld:[head.matrixWorld.elements[0],head.matrixWorld.elements[1],head.matrixWorld.elements[2]].map(v=>v*side/axisLength),
      beforeMissingFaceHit:0,afterMissingFaceHit:0,newlyMissingFaceHit:0,newlyAcquiredFaceHit:0,baselineWithinAttachmentBand:0,becameOutsideAttachmentBand:0,baselineAttachmentLostFaceHit:0,releasedBaselineAttachmentSamples:0,previouslyInsideBecameOutside:0,
      largestIncreaseInAxialOffset:null,maximumAfterOffsetOfBaselineAttachmentSamples:null,releasedSamplePhotoBins:[],lostFaceSupportPhotoBins:[],lostFaceSupportExamples:[],examples:[],
      interpretation:'All fixed ear vertices are sampled against the outermost front-facing face surface along actual head-local outward X. Positive offset is outward of that directional support; it is not a signed shortest distance or penetration depth. Baseline attachment candidates lie inside or within0.005 world units outward. Missing AFTER hits are counted separately as lost directional support, with no infinite or inferred numeric gap. Released bins include both finite offsets beyond the band and missing AFTER support. This does not prove an anatomical weld or continuous attachment.'},releasedBins=bins(),lostBins=bins(),seenLost=new Set();
  let largest=-Infinity,maxAfter=-Infinity;const examples=[];
  for(let i=0;i<samples.length/3;i++){
    const p=point(samples,i),hits={before:null,after:null};planarHits(set,p[0],p[1],(name,t,h)=>{if(!hits[name]||h.depth>hits[name].depth)hits[name]={...h,triangle:t};});
    if(!hits.before)out.beforeMissingFaceHit++;if(!hits.after)out.afterMissingFaceHit++;
    if(!hits.before){if(hits.after)out.newlyAcquiredFaceHit++;continue;}
    const d0=(p[2]-hits.before.depth)*axisLength,baselineAttachment=d0<=INTERFACE155.earAttachmentBand;
    if(baselineAttachment)out.baselineWithinAttachmentBand++;
    if(!hits.after){
      out.newlyMissingFaceHit++;
      if(baselineAttachment){
        out.baselineAttachmentLostFaceHit++;const w=point(earWorld,i),photo=field.project(w[0],w[1]),key=lostBins.add(photo);releasedBins.add(photo);
        if(!seenLost.has(key)&&out.lostFaceSupportExamples.length<INTERFACE155.maximumExamples){seenLost.add(key);out.lostFaceSupportExamples.push({earVertex:i,earUV:[ear.geometry.attributes.uv.getX(i),ear.geometry.attributes.uv.getY(i)],world:w,photo,beforeAxialOffset:d0,afterAxialOffset:null,beforeFaceTriangle:hits.before.triangle,afterFaceTriangle:null,transition:'baseline attachment candidate → no AFTER front-facing face hit'});}
      }
      continue;
    }
    const d1=(p[2]-hits.after.depth)*axisLength;largest=Math.max(largest,d1-d0);
    if(d0<=0&&d1>0)out.previouslyInsideBecameOutside++;
    if(baselineAttachment){maxAfter=Math.max(maxAfter,d1);
      if(d1>INTERFACE155.earAttachmentBand){out.becameOutsideAttachmentBand++;const w=point(earWorld,i),photo=field.project(w[0],w[1]);releasedBins.add(photo);
        examples.push({earVertex:i,earUV:[ear.geometry.attributes.uv.getX(i),ear.geometry.attributes.uv.getY(i)],world:w,photo,beforeAxialOffset:d0,afterAxialOffset:d1,
          beforeFaceTriangle:hits.before.triangle,afterFaceTriangle:hits.after.triangle});}
    }
  }
  examples.sort((a,b)=>b.afterAxialOffset-a.afterAxialOffset);out.examples=examples.slice(0,INTERFACE155.maximumExamples);out.releasedSamplePhotoBins=releasedBins.values();out.lostFaceSupportPhotoBins=lostBins.values();out.releasedBaselineAttachmentSamples=out.becameOutsideAttachmentBand+out.baselineAttachmentLostFaceHit;
  out.largestIncreaseInAxialOffset=Number.isFinite(largest)?largest:null;out.maximumAfterOffsetOfBaselineAttachmentSamples=Number.isFinite(maxAfter)?maxAfter:null;
  set.dispose();for(const v of[old,next,earWorld,earHead,a,b,samples])L.drop(v);return out;
}
function earFaceRays(face,ear,view,field,L){
  const forward=unit(view.towardCamera),right=unit(cross(view.up||[0,1,0],forward)),up=cross(forward,right),axes=[right,up,forward],
    a=projectPositions(face.before,axes,L),b=projectPositions(face.after,axes,L),world=worldPositions(ear.geometry,ear.matrixWorld,L),samples=projectPositions(world,axes,L),
    set=triangleSet(a,b,face.index,L,{roi:planarROI(samples),projected:true}),out={ear:ear.parent.name,view:view.name,towardCamera:forward,vertices:samples.length/3,
      faceTrianglesInProjectedEarBounds:set.ids.length,transitionCounts:{},newlyFaceUncoveredSamples:0,newlyFaceCoveredSamples:0,newlyUncoveredPhotoBins:[],examples:[],
      interpretation:'Front-facing continuous-face triangles only, sampled at every fixed ear vertex. Rays use the already-rendered orthographic view directions. Face-ahead, coincident, face-behind and no-hit are explicit. Ear self-occlusion, hair, alpha coverage, lighting and pixel visibility are excluded; these are not whole-scene visibility or burial claims.'},newBins=bins(),seen=new Set();
  const eps=INTERFACE155.rayCoincidenceTolerance;
  for(let i=0;i<samples.length/3;i++){
    const p=point(samples,i),hit={before:{ahead:null,behind:null,coincident:null},after:{ahead:null,behind:null,coincident:null}};
    planarHits(set,p[0],p[1],(name,t,h)=>{const d=h.depth-p[2],kind=d>eps?'ahead':d< -eps?'behind':'coincident',q=hit[name][kind];
      if(!q||Math.abs(d)<Math.abs(q.offset))hit[name][kind]={triangle:t,materialSlot:materialSlotFor(face.original,t),offset:d};});
    const classify=q=>q.ahead?'faceAhead':q.coincident?'faceAtSample':q.behind?'faceBehind':'noFaceHit',s0=classify(hit.before),s1=classify(hit.after),key=s0+'→'+s1;
    out.transitionCounts[key]=(out.transitionCounts[key]||0)+1;
    if(s0==='faceAhead'&&!['faceAhead','faceAtSample'].includes(s1)){
      out.newlyFaceUncoveredSamples++;const w=point(world,i),photo=field.project(w[0],w[1]),bin=newBins.add(photo);
      if(!seen.has(bin)&&out.examples.length<INTERFACE155.maximumExamples){seen.add(bin);out.examples.push({earVertex:i,earUV:[ear.geometry.attributes.uv.getX(i),ear.geometry.attributes.uv.getY(i)],world:w,photo,before:hit.before,after:hit.after,beforeClass:s0,afterClass:s1});}
    }
    if(s1==='faceAhead'&&!['faceAhead','faceAtSample'].includes(s0))out.newlyFaceCoveredSamples++;
  }
  out.newlyUncoveredPhotoBins=newBins.values();set.dispose();for(const v of[a,b,world,samples])L.drop(v);return out;
}

/** Actual prepared source references in, JSON-only findings out. */
export async function inspectJawInterfaces155({selected,obstacles,head,field,views,onProgress=()=>{}}){
  const started=performance.now(),L=ledger(),parts=[],rows=[],support=[],rays=[],heapStart=performance.memory?.usedJSHeapSize||null;let heapPeak=heapStart;
  const heap=()=>{const n=performance.memory?.usedJSHeapSize;if(n)heapPeak=Math.max(heapPeak||0,n);};
  try{
    for(const r of selected){
      const before=worldPositions(r.geometry,r.mesh.matrixWorld,L),after=worldPositions(r.mesh.geometry,r.mesh.matrixWorld,L),index=r.geometry.index.array,
        set=triangleSet(before,after,index,L,{onlyChanged:true});
      parts.push({name:r.mesh.name,original:r.geometry,mesh:r.mesh,before,after,index,set});
    }
    onProgress({stage:'changed-triangle-BVH',triangles:parts.map(p=>({name:p.name,triangles:p.set.ids.length,nodes:p.set.bvh.nodes}))});heap();
    for(const obstacle of obstacles){
      const mesh=obstacle.mesh,positions=worldPositions(mesh.geometry,mesh.matrixWorld,L),box=positionsBox(positions),overlapping=parts.filter(p=>p.set.ids.length&&boxDistance(p.set.box,0,box)<=INTERFACE155.contactWindow**2);
      if(!overlapping.length)rows.push({category:obstacle.category,obstacle:mesh.name,parent:mesh.parent.name,allObstacleTriangles:mesh.geometry.index.count/3,outsideAffectedBounds:true,beforeContacts:0,afterContacts:0,newContacts:0,removedContacts:0});
      else for(const p of overlapping){const row=contactRow(p,mesh,positions,field);row.category=obstacle.category;rows.push(row);}
      heap();L.drop(positions);onProgress({stage:'obstacle',category:obstacle.category,mesh:mesh.name,rows:rows.length});
      // Yield between original meshes without causing a render or keeping a
      // permanent callback. No controller or renderer lifecycle is altered.
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    const face=parts.find(p=>p.name==='continuous-face');if(!face)throw Error('155 interface continuous-face missing.');
    for(const r of obstacles.filter(r=>r.category==='ear')){
      support.push(earSupport(face,r.mesh,head,field,L));heap();
      for(const view of views){rays.push(earFaceRays(face,r.mesh,view,field,L));heap();}
      onProgress({stage:'ear-support-and-face-rays',ear:r.mesh.parent.name});
    }
    const changedTriangles=parts.map(p=>({mesh:p.name,triangles:p.set.ids.length,omittedInheritedDegenerate:p.set.omittedDegenerate,worldBounds:p.set.box}));
    for(const p of parts){p.set.dispose();L.drop(p.before);L.drop(p.after);}parts.length=0;
    return{spec:INTERFACE155,changedTriangles,contacts:rows,earDirectionalSupport:support,earFaceOnlyRays:rays,
      totals:{beforeContacts:rows.reduce((s,r)=>s+r.beforeContacts,0),afterContacts:rows.reduce((s,r)=>s+r.afterContacts,0),newContacts:rows.reduce((s,r)=>s+r.newContacts,0),removedContacts:rows.reduce((s,r)=>s+r.removedContacts,0)},
      allocations:{...L.report(),heapBeforeBytes:heapStart,heapObservedPeakBytes:heapPeak},elapsedMs:performance.now()-started,
      interpretation:'Endpoint contacts on actually changed finite face/neck triangles versus bounds-overlapping fixed ear/eye/hair/cloth triangles. Contact threshold uses unsigned distance, not penetration depth. Null near-distance values mean no evaluated pair within0.001; they are not unbounded clearance measurements. Alpha/culling do not remove triangles from contact counts. Actual witnesses locate changed contacts; a few examples never certify global burial. The common-field face/neck pair is not retested; both received the same verified world map, and the existing155 native art/orientation gates remain separate.'};
  }finally{for(const p of parts){p.set.dispose();L.drop(p.before);L.drop(p.after);}}
}

// Exposed only for the small local deterministic QA of this new accelerator.
export function validateInterfaceAccelerator155(){
  const L=ledger(),n=97,b=L.make(Float64Array,n*6);for(let i=0;i<n;i++){const x=(i*37%101)/17,y=(i*13%43)/19,z=(i*7%23)/29;b.set([x,y,z,x+.03+(i%3)*.02,y+.05,z+.04],i*6);}
  const tree=makeBVH(b,n,L);let checks=0;
  for(let j=0;j<21;j++){const q=[j*.27,.2+(j%5)*.17,.1, j*.27+.13,1.1,1.0],pad=j%2?.001:.08,expected=[];for(let i=0;i<n;i++)if(boxDistance(b,i*6,q)<=pad*pad)expected.push(i);const actual=[];tree.query(q,pad,i=>actual.push(i));actual.sort((a,b)=>a-b);if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('155 interface BVH omitted/duplicated a candidate.');checks++;}
  tree.dispose();L.drop(b);
  const indices=new Uint32Array([0,1,2]),front=new Float64Array([0,0,2,1,0,2,0,1,2]),back=new Float64Array([0,0,1,1,0,1,0,1,1]),
    hit0=interpolateProjected(front,indices,0,.25,.25),hit1=interpolateProjected(back,indices,0,.25,.25),reverse=new Uint32Array([0,2,1]);
  if(!hit0||!hit1||hit0.depth!==2||hit1.depth!==1||interpolateProjected(front,reverse,0,.25,.25)!==null||interpolateProjected(front,indices,0,2,2)!==null)throw Error('155 interface front-facing planar hit fixture failed.');
  const plane=triangleSet(front,back,indices,L,{projected:true}),hits=[];planarHits(plane,.25,.25,(name,t,h)=>hits.push([name,t,h.depth]));
  if(JSON.stringify(hits)!==JSON.stringify([['before',0,2],['after',0,1]]))throw Error('155 interface planar BVH lost an endpoint hit.');plane.dispose();
  // A single synthetic planar sample exercises the previously omitted loss
  // of AFTER support; this does not construct or approximate portrait geometry.
  const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],matrix={elements:identity,clone:()=>({invert:()=>({elements:identity})})},
    supportFace={before:new Float64Array([0,0,0,0,1,0,0,0,1]),after:new Float64Array([0,2,0,0,3,0,0,2,1]),index:indices},
    supportEar={parent:{name:'right-ear'},matrixWorld:matrix,geometry:{attributes:{position:{count:1,getX:()=>.001,getY:()=>.25,getZ:()=>.25},uv:{getX:()=>.5,getY:()=>.5}}}},
    lost=earSupport(supportFace,supportEar,{matrixWorld:matrix},{project:(x,y)=>[x,y]},L);
  if(lost.baselineWithinAttachmentBand!==1||lost.baselineAttachmentLostFaceHit!==1||lost.newlyMissingFaceHit!==1||lost.releasedBaselineAttachmentSamples!==1||lost.becameOutsideAttachmentBand!==0||lost.maximumAfterOffsetOfBaselineAttachmentSamples!==null||lost.lostFaceSupportExamples.length!==1||lost.releasedSamplePhotoBins.length!==1)throw Error('155 interface omitted a baseline attachment sample with missing AFTER support.');
  return{checks,planarChecks:5,supportLossChecks:1,allocations:L.report()};
}
