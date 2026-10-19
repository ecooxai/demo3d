// Pure triangle checks shared by the local source audit and root's native
// wrapper. Arrays must already use one common physical coordinate frame.
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const clamp=x=>Math.max(0,Math.min(1,x));
const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const point=(a,i)=>[a[i*3],a[i*3+1],a[i*3+2]];

export function triangleSoup144(position,index,{from=0,to=index.length/3,minY=-Infinity,maxY=Infinity}={}){
 const triangles=[];
 for(let t=from;t<to;t++){
  const ids=[index[t*3],index[t*3+1],index[t*3+2]],p=ids.map(i=>point(position,i));
  const min=[0,1,2].map(k=>Math.min(p[0][k],p[1][k],p[2][k])),max=[0,1,2].map(k=>Math.max(p[0][k],p[1][k],p[2][k]));
  if(max[1]<minY||min[1]>maxY)continue;
  triangles.push({id:t,ids,p,min,max});
 }
 return triangles;
}
function boxDistance(a,b){let d=0;for(let i=0;i<3;i++){const q=Math.max(0,a.min[i]-b.max[i],b.min[i]-a.max[i]);d+=q*q;}return d;}
function pointTriangle(p,a,b,c){
 const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);
 if(d1<=0&&d2<=0)return dot(ap,ap);
 const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return dot(bp,bp);
 const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0){const q=sub(p,lerp(a,b,d1/(d1-d3)));return dot(q,q);}
 const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return dot(cp,cp);
 const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0){const q=sub(p,lerp(a,c,d2/(d2-d6)));return dot(q,q);}
 const va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0){const q=sub(p,lerp(b,c,(d4-d3)/(d4-d3+d5-d6)));return dot(q,q);}
 const den=va+vb+vc;if(Math.abs(den)<1e-30)return Math.min(dot(ap,ap),dot(bp,bp),dot(cp,cp));
 const v=vb/den,w=vc/den,q=[p[0]-a[0]-ab[0]*v-ac[0]*w,p[1]-a[1]-ab[1]*v-ac[1]*w,p[2]-a[2]-ab[2]*v-ac[2]*w];return Math.max(0,dot(q,q));
}
function segmentSegment(p1,q1,p2,q2){
 const d1=sub(q1,p1),d2=sub(q2,p2),r=sub(p1,p2),a=dot(d1,d1),e=dot(d2,d2),f=dot(d2,r);let s=0,t=0;
 if(a<=1e-24&&e<=1e-24)return dot(r,r);
 if(a<=1e-24)t=clamp(f/e);
 else{
  const c=dot(d1,r);
  if(e<=1e-24)s=clamp(-c/a);
  else{const b=dot(d1,d2),den=a*e-b*b;s=den>1e-30?clamp((b*f-c*e)/den):0;t=(b*s+f)/e;if(t<0){t=0;s=clamp(-c/a);}else if(t>1){t=1;s=clamp((b-c)/a);}}
 }
 const q=sub(lerp(p1,q1,s),lerp(p2,q2,t));return Math.max(0,dot(q,q));
}
function segmentTriangle(p,q,a,b,c){
 const d=sub(q,p),e1=sub(b,a),e2=sub(c,a),h=cross(d,e2),det=dot(e1,h);
 if(Math.abs(det)<1e-18)return false;
 const s=sub(p,a),u=dot(s,h)/det;if(u<0||u>1)return false;
 const v=dot(d,cross(s,e1))/det;if(v<0||u+v>1)return false;
 const t=dot(e2,cross(s,e1))/det;return t>=0&&t<=1;
}
export function triangleDistanceSquared144(a,b){
 const p=a.p,q=b.p;
 for(let i=0;i<3;i++)if(segmentTriangle(p[i],p[(i+1)%3],...q)||segmentTriangle(q[i],q[(i+1)%3],...p))return 0;
 let distance=Infinity;
 for(let i=0;i<3;i++){distance=Math.min(distance,pointTriangle(p[i],...q),pointTriangle(q[i],...p));for(let j=0;j<3;j++)distance=Math.min(distance,segmentSegment(p[i],p[(i+1)%3],q[j],q[(j+1)%3]));}
 return distance;
}

export function surfaceClearance144(moving,obstacle,{threshold=1e-8,maximumExamples=8}={}){
 let squared=Infinity,pairs=0,broadPairs=0,intersections=0;let closest=null;const examples=[];
 for(const a of moving)for(const b of obstacle){
  broadPairs++;if(boxDistance(a,b)>Math.max(squared,threshold*threshold))continue;
  pairs++;const d=triangleDistanceSquared144(a,b);
  if(d<squared){squared=d;closest={movingTriangle:a.id,obstacleTriangle:b.id,movingVertices:a.p,obstacleVertices:b.p};}
  if(d<=threshold*threshold){intersections++;if(examples.length<maximumExamples)examples.push({movingTriangle:a.id,obstacleTriangle:b.id});}
 }
 return{triangles:moving.length,obstacleTriangles:obstacle.length,broadPairs,exactPairs:pairs,minimumDistance:Math.sqrt(squared),intersectionPairs:intersections,intersectionTolerance:threshold,closest,examples};
}

export function sweepOrientation144(before,after,index,{from=0,to=index.length/3,vertexOffset=0}={}){
 let minimumArea=Infinity,minimumAreaRatio=Infinity,minimumRadialCosine=Infinity,beforeNegative=0,afterNegative=0,newNegative=0,movingTriangles=0,minimumNormalAgreement=1;
 const examples=[];
 const center=(array,ring)=>{const q=[0,0,0];for(let i=0;i<8;i++)for(let k=0;k<3;k++)q[k]+=array[(vertexOffset+ring*9+i)*3+k]/8;return q;};
 for(let ti=from;ti<to;ti++){
  const ids=[index[ti*3],index[ti*3+1],index[ti*3+2]],a=ids.map(i=>point(before,i)),b=ids.map(i=>point(after,i));
  if(ids.every(i=>[0,1,2].every(k=>before[i*3+k]===after[i*3+k])))continue;
  movingTriangles++;
  const n0=cross(sub(a[1],a[0]),sub(a[2],a[0])),n1=cross(sub(b[1],b[0]),sub(b[2],b[0])),l0=Math.sqrt(dot(n0,n0)),l1=Math.sqrt(dot(n1,n1));
  minimumArea=Math.min(minimumArea,l1*.5);minimumAreaRatio=Math.min(minimumAreaRatio,l1/l0);minimumNormalAgreement=Math.min(minimumNormalAgreement,dot(n0,n1)/(l0*l1));
  const r=ids.map(i=>Math.floor((i-vertexOffset)/9)),c0=r.map(j=>center(before,j)),c1=r.map(j=>center(after,j));
  const radial=(positions,centers)=>[0,1,2].map(k=>positions.reduce((sum,p,i)=>sum+p[k]-centers[i][k],0)/3);
  const r0=radial(a,c0),r1=radial(b,c1),v0=dot(n0,r0)/(l0*Math.sqrt(dot(r0,r0))),v1=dot(n1,r1)/(l1*Math.sqrt(dot(r1,r1)));
  minimumRadialCosine=Math.min(minimumRadialCosine,v1);if(v0<=0)beforeNegative++;if(v1<=0)afterNegative++;if(v0>0&&v1<=0){newNegative++;if(examples.length<8)examples.push({triangle:ti,before:v0,after:v1});}
 }
 return{movingTriangles,minimumArea,minimumAreaRatio,minimumRadialCosine,minimumNormalAgreement,beforeNegative,afterNegative,newNegative,examples,
  interpretation:'Area and winding of actual changed triangles; radial direction uses their own swept-ring centers. Normal agreement is geometric before/after rotation, not authored shading-normal error.'};
}

export function sweepSelfIntersections144(triangles,{firstTriangle=0}={}){
 let pairs=0,intersections=0;const examples=[];
 for(let i=0;i<triangles.length;i++)for(let j=i+1;j<triangles.length;j++){
  const a=triangles[i],b=triangles[j],ra=Math.floor((a.id-firstTriangle)/16),rb=Math.floor((b.id-firstTriangle)/16);
  if(Math.abs(ra-rb)<=1||boxDistance(a,b)>1e-18)continue;
  pairs++;if(triangleDistanceSquared144(a,b)<=1e-18){intersections++;if(examples.length<8)examples.push([a.id,b.id]);}
 }
 return{exactPairs:pairs,intersectionPairs:intersections,examples,scope:'Nonadjacent swept-ring strips; adjacent/shared-boundary pairs excluded.'};
}

export function ribbonOrientation144(before,after,index){
 let movingTriangles=0,minimumAreaRatio=Infinity,minimumArea=Infinity,minimumNormalAgreement=1,newFoldedQuads=0;
 let minimumPairedNormalAgreement=1;const previous=[null,null];
 for(let t=0;t<index.length/3;t++){
  const ids=[index[t*3],index[t*3+1],index[t*3+2]],a=ids.map(i=>point(before,i)),b=ids.map(i=>point(after,i));
  const changed=ids.some(i=>[0,1,2].some(k=>before[i*3+k]!==after[i*3+k]));
  const n0=cross(sub(a[1],a[0]),sub(a[2],a[0])),n1=cross(sub(b[1],b[0]),sub(b[2],b[0])),l0=Math.sqrt(dot(n0,n0)),l1=Math.sqrt(dot(n1,n1));
  if(changed){movingTriangles++;minimumArea=Math.min(minimumArea,l1*.5);minimumAreaRatio=Math.min(minimumAreaRatio,l1/l0);minimumNormalAgreement=Math.min(minimumNormalAgreement,dot(n0,n1)/(l0*l1));}
  if(t%2===0){previous[0]={n:n0,l:l0,changed};previous[1]={n:n1,l:l1};}
  else if(changed||previous[0].changed){
   const d0=dot(n0,previous[0].n)/(l0*previous[0].l),d1=dot(n1,previous[1].n)/(l1*previous[1].l);
   minimumPairedNormalAgreement=Math.min(minimumPairedNormalAgreement,d1);if(d0>0&&d1<=0)newFoldedQuads++;
  }
 }
 return{movingTriangles,minimumArea,minimumAreaRatio,minimumNormalAgreement,minimumPairedNormalAgreement,newFoldedQuads,
  interpretation:'Actual ribbon triangle areas and paired triangles within each original quad; before/after normal agreement is geometric rotation, not an authored-normal comparison.'};
}
