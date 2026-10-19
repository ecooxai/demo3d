import { triangleDistanceSquared144 } from './near-ear144-geometry.mjs';

// Review-only159 uses the frozen155 BVH/witness primitives below. The new
// interface code measures moving ears against fixed hair and the co-moving face.
export const INTERFACE159 = Object.freeze({
  contactWindow: .001, contactTolerance: 1e-8, earAttachmentBand: .005,
  rayCoincidenceTolerance: 1e-7, photoBinPixels: 16, maximumExamples: 12,
});
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  scale=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  clamp=x=>Math.max(0,Math.min(1,x)), norm=a=>Math.hypot(...a),
  unit=a=>{const n=norm(a);if(!(n>1e-12))throw Error('159 interface degenerate direction.');return scale(a,1/n);};
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
    if(!Number.isFinite(out[j]+out[j+1]+out[j+2]))throw Error('159 interface encountered nonfinite world positions.');
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
    const id=nodes++;if(id>=capacity)throw Error('159 interface BVH allocation bound failed.');const off=id*6;
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
export function contactWitness159(a,b){
  for(let i=0;i<3;i++){const hit=segmentHit(a.p[i],a.p[(i+1)%3],...b.p)||segmentHit(b.p[i],b.p[(i+1)%3],...a.p);if(hit)return{moving:hit,obstacle:hit.slice(),squared:0,kind:'edge/triangle intersection'};}
  let best={squared:Infinity};const consider=(p,q)=>{const d=dot(sub(p,q),sub(p,q));if(d<best.squared)best={moving:p.slice(),obstacle:q.slice(),squared:d,kind:'closest points within contact tolerance'};};
  for(let i=0;i<3;i++){consider(a.p[i],closestPoint(a.p[i],...b.p));consider(closestPoint(b.p[i],...a.p),b.p[i]);for(let j=0;j<3;j++)consider(...closestSegments(a.p[i],a.p[(i+1)%3],b.p[j],b.p[(j+1)%3]));}return best;
}
function bins(){const b=new Map();return{add(photo){const x=Math.floor(photo[0]/INTERFACE159.photoBinPixels),y=Math.floor(photo[1]/INTERFACE159.photoBinPixels),key=x+':'+y;let q=b.get(key);if(!q){q={photoBounds:[x*16,(x+1)*16,y*16,(y+1)*16],count:0};b.set(key,q);}q.count++;return key;},values:()=>[...b.values()].sort((a,b)=>a.photoBounds[2]-b.photoBounds[2]||a.photoBounds[0]-b.photoBounds[0])};}
function materialSummary(mesh){const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];return list.map(m=>({name:m.name,type:m.type,side:m.side,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,vertexColors:m.vertexColors,alphaMap:!!m.alphaMap,map:!!m.map,depthWrite:m.depthWrite,
  interpretation:'Contact tests use geometry regardless of alpha coverage or view-dependent visibility.'}));}

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

function contactRow159(part,obstacle,positions,field){
  const limit=INTERFACE159.contactTolerance**2,window2=INTERFACE159.contactWindow**2,index=positions.index,
    out={moving:part.name,obstacle:obstacle.name,parent:obstacle.parent.name,earTriangles:part.set.ids.length,allObstacleTriangles:index.length/3,boundsOverlappingObstacleTriangles:0,exactPairs:0,
      beforeContacts:0,afterContacts:0,retainedContacts:0,newContacts:0,removedContacts:0,minimumBeforeWithinWindow:null,minimumAfterWithinWindow:null,
      newPairIDs:[],removedPairIDs:[],newContactExamples:[],removedContactExamples:[],materials:materialSummary(obstacle)},
    box=emptyBox(),tmp=emptyBox(),e0=scratchTriangle(),e1=scratchTriangle(),o0=scratchTriangle(),o1=scratchTriangle(),newBins=bins(),removedBins=bins(),seenNew=new Set(),seenRemoved=new Set();
  let min0=Infinity,min1=Infinity;
  for(let t=0;t<index.length/3;t++){
    unionTriangleBounds(positions.before,positions.after,index,t,box,tmp);if(boxDistance(part.set.box,0,box)>window2)continue;out.boundsOverlappingObstacleTriangles++;
    if(triangleAreaSquared(positions.before,index,t)<1e-26)continue;
    const otherChanged=positions.before!==positions.after&&changedTriangle(positions.before,positions.after,index,t);
    triangle(positions.before,index,t,o0);triangle(positions.after,index,t,o1);
    part.set.bvh.query(box,INTERFACE159.contactWindow,row=>{
      const id=part.set.ids[row];if(!part.changed[id]&&!otherChanged)return;
      triangle(part.before,part.index,id,e0);triangle(part.after,part.index,id,e1);
      const d0=triangleDistanceSquared144(e0,o0),d1=triangleDistanceSquared144(e1,o1);out.exactPairs++;
      if(!Number.isFinite(d0+d1)||d0<0||d1<0)throw Error('159 invalid endpoint triangle distance.');
      if(d0<=window2)min0=Math.min(min0,d0);if(d1<=window2)min1=Math.min(min1,d1);
      const a=d0<=limit,b=d1<=limit;if(a)out.beforeContacts++;if(b)out.afterContacts++;if(a&&b)out.retainedContacts++;if(a===b)return;
      const w=contactWitness159(b?e1:e0,b?o1:o0);if(w.squared>4*limit)throw Error('159 contact witness disagrees with the intersection test.');
      const world=scale(add(w.moving,w.obstacle),.5),photo=field.project(world[0],world[1]),which=b?newBins:removedBins,seen=b?seenNew:seenRemoved,key=which.add(photo),examples=b?out.newContactExamples:out.removedContactExamples;
      if(b){out.newContacts++;out.newPairIDs.push(id,t);}else{out.removedContacts++;out.removedPairIDs.push(id,t);}
      if(!seen.has(key)&&examples.length<INTERFACE159.maximumExamples){seen.add(key);examples.push({earTriangle:id,obstacleTriangle:t,beforeDistance:Math.sqrt(d0),afterDistance:Math.sqrt(d1),worldContact:world,photoContact:photo,witnessKind:w.kind,witnessSeparation:Math.sqrt(w.squared)});}
    });
  }
  out.minimumBeforeWithinWindow=Number.isFinite(min0)?Math.sqrt(min0):null;out.minimumAfterWithinWindow=Number.isFinite(min1)?Math.sqrt(min1):null;
  out.newContactPhotoBins=newBins.values();out.removedContactPhotoBins=removedBins.values();
  out.pairIdentityFormat='Every new/removed pair is stored as alternating ear-triangle, obstacle-triangle IDs. Only pairs with at least one actually changed triangle are evaluated. Actual witnesses locate every changed pair; examples are limited.';
  return out;
}

function endpointPlanarHits159(set,state,x,y,visit){
  set.bvh.query([x,y,0,x,y,0],1e-9,row=>{const t=set.ids[row],hit=interpolateProjected(set[state],set.index,t,x,y);if(hit)visit(t,hit);});
}

function earSupport159(face,ear,head,field,L){
  const inv=head.matrixWorld.clone().invert().elements,axisLength=Math.hypot(head.matrixWorld.elements[0],head.matrixWorld.elements[1],head.matrixWorld.elements[2]),
    side=ear.mesh.parent.name==='left-ear'?-1:1,axes=[[0,1,0],[0,0,side],[side,0,0]],
    f0=transformPositions(face.before,inv,L),f1=transformPositions(face.after,inv,L),e0=transformPositions(ear.before,inv,L),e1=transformPositions(ear.after,inv,L),
    a=projectPositions(f0,axes,L),b=projectPositions(f1,axes,L),s0=projectPositions(e0,axes,L),s1=projectPositions(e1,axes,L),roi=include(planarROI(s0),planarROI(s1)),
    set=triangleSet(a,b,face.index,L,{roi,projected:true}),out={ear:ear.mesh.parent.name,vertices:s0.length/3,
      beforeMissingFaceHit:0,afterMissingFaceHit:0,newlyMissingFaceHit:0,newlyAcquiredFaceHit:0,baselineWithinAttachmentBand:0,becameOutsideAttachmentBand:0,
      baselineAttachmentLostFaceHit:0,releasedBaselineAttachmentSamples:0,previouslyInsideBecameOutside:0,maximumAfterOffsetOfBaselineAttachmentSamples:null,largestIncreaseInAxialOffset:null,
      releasedSamplePhotoBins:[],lostFaceSupportPhotoBins:[],examples:[],lostFaceSupportExamples:[],
      interpretation:'Both face and ear samples use their own actual BEFORE/AFTER positions. The fixed head frame defines outward X; the front-facing directional face hit is recomputed at each moved ear sample. Positive offsets are directional, not signed shortest gaps. The0.005 baseline band is a sampled attachment diagnostic, not a continuous weld proof.'},releasedBins=bins(),lostBins=bins(),seenLost=new Set();
  let maximum=-Infinity,increase=-Infinity;const examples=[];
  for(let i=0;i<s0.length/3;i++){
    const p0=point(s0,i),p1=point(s1,i),hits={before:null,after:null};
    for(const[state,p]of[['before',p0],['after',p1]])endpointPlanarHits159(set,state,p[0],p[1],(t,h)=>{if(!hits[state]||h.depth>hits[state].depth)hits[state]={...h,triangle:t};});
    if(!hits.before)out.beforeMissingFaceHit++;if(!hits.after)out.afterMissingFaceHit++;
    if(!hits.before){if(hits.after)out.newlyAcquiredFaceHit++;continue;}
    const d0=(p0[2]-hits.before.depth)*axisLength,baseline=d0<=INTERFACE159.earAttachmentBand;if(baseline)out.baselineWithinAttachmentBand++;
    if(!hits.after){out.newlyMissingFaceHit++;if(baseline){out.baselineAttachmentLostFaceHit++;
      const w0=point(ear.before,i),w1=point(ear.after,i),photo=field.project(w1[0],w1[1]),key=lostBins.add(photo);releasedBins.add(photo);
      if(!seenLost.has(key)&&out.lostFaceSupportExamples.length<INTERFACE159.maximumExamples){seenLost.add(key);out.lostFaceSupportExamples.push({earVertex:i,worldBefore:w0,worldAfter:w1,photoAfter:photo,beforeAxialOffset:d0,afterAxialOffset:null,beforeFaceTriangle:hits.before.triangle,afterFaceTriangle:null});}
    }continue;}
    const d1=(p1[2]-hits.after.depth)*axisLength;increase=Math.max(increase,d1-d0);if(d0<=0&&d1>0)out.previouslyInsideBecameOutside++;
    if(baseline){maximum=Math.max(maximum,d1);if(d1>INTERFACE159.earAttachmentBand){out.becameOutsideAttachmentBand++;
      const w0=point(ear.before,i),w1=point(ear.after,i),photo=field.project(w1[0],w1[1]);releasedBins.add(photo);
      examples.push({earVertex:i,earUV:[ear.mesh.geometry.attributes.uv.getX(i),ear.mesh.geometry.attributes.uv.getY(i)],worldBefore:w0,worldAfter:w1,photoAfter:photo,beforeAxialOffset:d0,afterAxialOffset:d1,beforeFaceTriangle:hits.before.triangle,afterFaceTriangle:hits.after.triangle});}
    }
  }
  examples.sort((a,b)=>b.afterAxialOffset-a.afterAxialOffset);out.examples=examples.slice(0,INTERFACE159.maximumExamples);
  out.releasedSamplePhotoBins=releasedBins.values();out.lostFaceSupportPhotoBins=lostBins.values();out.releasedBaselineAttachmentSamples=out.becameOutsideAttachmentBand+out.baselineAttachmentLostFaceHit;
  out.maximumAfterOffsetOfBaselineAttachmentSamples=Number.isFinite(maximum)?maximum:null;out.largestIncreaseInAxialOffset=Number.isFinite(increase)?increase:null;
  set.dispose();for(const q of[f0,f1,e0,e1,a,b,s0,s1])L.drop(q);return out;
}

/** Native review only: actual retained source/replacement arrays in, JSON out. */
export async function inspectJawEarInterfaces159({selected,hair,head,field,onProgress=()=>{}}){
  const started=performance.now(),L=ledger(),parts=[],rows=[],support=[],faceRecord=selected.find(r=>r.mesh.name==='continuous-face');let face=null;
  try{
    for(const r of selected.filter(r=>r.mesh.name==='ear-continuous-anatomical-shell')){
      const before=worldPositions(r.geometry,r.mesh.matrixWorld,L),after=worldPositions(r.mesh.geometry,r.mesh.matrixWorld,L),index=r.geometry.index.array,changed=L.make(Uint8Array,index.length/3);
      for(let t=0;t<changed.length;t++)changed[t]=changedTriangle(before,after,index,t)?1:0;
      parts.push({name:r.mesh.parent.name+'/'+r.mesh.name,mesh:r.mesh,before,after,index,changed,set:triangleSet(before,after,index,L)});
    }
    if(parts.length!==2||!faceRecord)throw Error('159 interface requires both actual ears and the actual face.');
    for(const mesh of hair){
      const p=worldPositions(mesh.geometry,mesh.matrixWorld,L),positions={before:p,after:p,index:mesh.geometry.index.array};
      for(const part of parts){const row=contactRow159(part,mesh,positions,field);row.category='moving-ear/fixed-hair';rows.push(row);}
      L.drop(p);onProgress({stage:'fixed-hair',mesh:mesh.name});await new Promise(resolve=>setTimeout(resolve,0));
    }
    face={before:worldPositions(faceRecord.geometry,faceRecord.mesh.matrixWorld,L),after:worldPositions(faceRecord.mesh.geometry,faceRecord.mesh.matrixWorld,L),index:faceRecord.geometry.index.array};
    for(const part of parts){const row=contactRow159(part,faceRecord.mesh,face,field);row.category='co-moving-ear/face';rows.push(row);support.push(earSupport159(face,part,head,field,L));onProgress({stage:'co-moving-face-and-support',ear:part.mesh.parent.name});}
    const changedEars=parts.map(p=>({ear:p.mesh.parent.name,changedTriangles:p.changed.reduce((s,v)=>s+v,0),allTriangles:p.changed.length,inheritedDegenerateOmitted:p.set.omittedDegenerate}));
    L.drop(face.before);L.drop(face.after);face=null;for(const p of parts){p.set.dispose();L.drop(p.before);L.drop(p.after);L.drop(p.changed);}parts.length=0;
    return{spec:INTERFACE159,changedEars,contacts:rows,earDirectionalSupport:support,allocations:L.report(),elapsedMs:performance.now()-started,
      interpretation:'Only the new moving-ear interfaces are measured. Hair is unchanged; face and ear endpoints both move under the same field. Counts include pairs with at least one changed triangle, not the complete scene. Unsigned distance is not penetration depth. No alpha/culling excuse removes contacts. Sampled support and limited witnesses do not certify continuous burial or visible coverage.'};
  }finally{if(face){L.drop(face.before);L.drop(face.after);}for(const p of parts){p.set.dispose();L.drop(p.before);L.drop(p.after);L.drop(p.changed);}}
}

// Small local regression for the new moving-query logic only.
export function validateMovingSupport159(){
  const L=ledger(),identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],matrix={elements:identity,clone:()=>({invert:()=>({elements:identity})})},index=new Uint32Array([0,1,2]),
    face={before:new Float64Array([0,0,0,0,1,0,0,0,1]),after:new Float64Array([-.05,2,0,-.05,3,0,-.05,2,1]),index},
    ear={before:new Float64Array([.001,.25,.25]),after:new Float64Array([-.049,2.25,.25]),mesh:{parent:{name:'right-ear'},geometry:{attributes:{uv:{getX:()=>.5,getY:()=>.5}}}}},
    q=earSupport159(face,ear,{matrixWorld:matrix},{project:(x,y)=>[x,y]},L);
  if(q.baselineWithinAttachmentBand!==1||q.releasedBaselineAttachmentSamples!==0||q.afterMissingFaceHit!==0||Math.abs(q.maximumAfterOffsetOfBaselineAttachmentSamples-.001)>1e-12)throw Error('159 moving support query failed to follow both surfaces.');
  return{movingQueryChecks:1,allocations:L.report(),qualification:'Synthetic common translation only; actual native ear/face geometry remains pending.'};
}

