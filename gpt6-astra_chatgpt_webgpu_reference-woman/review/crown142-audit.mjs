import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {construct142,fields142,THREE,read,faceZ,createCrownChart142} from './crown142-source.mjs';
import {createHairContact,fit} from './guide-placement118-source.mjs';
const sha=a=>crypto.createHash('sha256').update(ArrayBuffer.isView(a)?Buffer.from(a.buffer,a.byteOffset,a.byteLength):a).digest('hex');
const vec=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)],sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b,t=1)=>a.map((x,i)=>x+b[i]*t),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>a.map(x=>x/(len(a)||1)),arr=p=>[p.x,p.y,p.z];
const source=read('review/hair-groom-candidate133.js'),original=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118)({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1});
const off=construct142(0),on=construct142(1),chart=on.__chart142;
const report={version:'crown142-focused-actual-geometry',nativeArtPending:true,sourceHashes:Object.fromEntries(['review/hair-groom-candidate133.js','review/hair-groom-candidate142.js','review/crown-chart-candidate142.js','src/main.js'].map(p=>[p,sha(fs.readFileSync(p))])),counts:{off:off.userData.triangles,on:on.userData.triangles,offMiB:off.userData.geometryMiB,onMiB:on.userData.geometryMiB},timings:{original:original.userData.constructionMs,off:off.userData.constructionMs,on:on.userData.constructionMs},offExact:true,nonfinite:0,attributes:[],errors:[]};
function check(condition,message){if(!condition)report.errors.push(message);}
for(let m=0;m<5;m++){
 const b=original.children[m].geometry,z=off.children[m].geometry,g=on.children[m].geometry,row={mesh:original.children[m].name,unchanged:{}};
 for(const k of ['index',...Object.keys(b.attributes)]){
  const a=k==='index'?b.index:b.attributes[k],a0=k==='index'?z.index:z.attributes[k],a1=k==='index'?g.index:g.attributes[k];
  check(sha(a.array)===sha(a0.array),'Off geometry differs: '+m+'/'+k);if(sha(a.array)!==sha(a0.array))report.offExact=false;
  row.unchanged[k]=sha(a.array)===sha(a1.array);for(const x of a1.array)if(!Number.isFinite(x))report.nonfinite++;
  if(!['position','normal'].includes(k))check(row.unchanged[k],'Nonspatial attribute changed: '+m+'/'+k);
 }
 if(m===1||m===3)for(const[k,v]of Object.entries(row.unchanged))check(v,'Protected whole mesh changed: '+m+'/'+k);
 for(const prop of ['roughness','anisotropy','anisotropyRotation','metalness','specularIntensity','envMapIntensity','alphaTest','alphaToCoverage','side','transparent','opacity','depthWrite'])check(original.children[m].material[prop]===on.children[m].material[prop],'Material property changed: '+m+'/'+prop);
 for(const prop of ['map','normalMap']){const a=original.children[m].material[prop],b=on.children[m].material[prop];if(a?.image?.data)check(sha(a.image.data)===sha(b.image.data),'Texture bytes changed: '+m+'/'+prop);}
 report.attributes.push(row);
}
check(report.nonfinite===0,'Nonfinite mesh attributes.');
const cp=on.children[0].geometry.attributes.position,cn=on.children[0].geometry.attributes.normal,op=off.children[0].geometry.attributes.position,on0=off.children[0].geometry.attributes.normal,ci=on.children[0].geometry.index.array;
let protectedVertices=0,protectedPositionChanges=0,protectedNormalChanges=0,maxMove=0,minY=Infinity,maxX=-Infinity,minX=Infinity;
for(let i=0;i<cp.count;i++){
 const p=vec(cp,i),q=vec(op,i),move=len(sub(p,q));maxMove=Math.max(maxMove,move);
 if(on.__protectedCrown142[i]){protectedVertices++;if(move)protectedPositionChanges++;if(len(sub(vec(cn,i),vec(on0,i))))protectedNormalChanges++;}
 else{minY=Math.min(minY,p[1],q[1]);maxX=Math.max(maxX,p[0],q[0]);minX=Math.min(minX,p[0],q[0]);}
}
report.crownProtection={protectedVertices,protectedPositionChanges,protectedNormalChanges,maxMove,changedBounds:{minY,minX,maxX}};
check(protectedPositionChanges===0&&protectedNormalChanges===0,'Protected crown positions/normals differ.');
const poleIndices=new Set();for(const first of[7685,16070])for(let j=0;j<=64;j++)poleIndices.add(first+j*129+128);
const pole0=vec(cp,7685+128);let poleDistance=0,poleNormalDifference=0;
for(const i of poleIndices){poleDistance=Math.max(poleDistance,len(sub(vec(cp,i),pole0)));poleNormalDifference=Math.max(poleNormalDifference,len(sub(vec(cn,i),vec(cn,7685+128))));}
let baselineDegenerate=0,newPoleDegenerate=0,unexpectedDegenerate=0,minArea=Infinity,minSigned=Infinity,worstFace=null,minNormalLength=Infinity;
for(let f=0;f<ci.length/3;f++){
 const ids=[ci[f*3],ci[f*3+1],ci[f*3+2]],a=vec(cp,ids[0]),b=vec(cp,ids[1]),c=vec(cp,ids[2]),n=cross(sub(b,a),sub(c,a)),area=len(n),oa=vec(op,ids[0]),ob=vec(op,ids[1]),oc=vec(op,ids[2]),baseArea=len(cross(sub(ob,oa),sub(oc,oa)));
 if(baseArea<1e-13)baselineDegenerate++;
 if(area<1e-13){if(baseArea>=1e-13){if(ids.filter(i=>poleIndices.has(i)).length>=2)newPoleDegenerate++;else unexpectedDegenerate++;}continue;}
 if(ids.every(i=>on.__protectedCrown142[i]))continue;
 minArea=Math.min(minArea,area);
 const uv=on.children[0].geometry.attributes.uv,side=ids[0]<16070?-1:1,u=ids.reduce((s,i)=>s+uv.getX(i),0)/3,v=ids.reduce((s,i)=>s+uv.getY(i)/.73,0)/3;
 const analytical=arr(chart.normal(side,u,v)),signed=dot(n,analytical)/area;if(signed<minSigned){minSigned=signed;worstFace={f,side,u,v};}
}
for(let i=0;i<cn.count;i++)if(!on.__protectedCrown142[i])minNormalLength=Math.min(minNormalLength,len(vec(cn,i)));
report.actualCrownTriangles={baselineDegenerate,newPoleDegenerate,unexpectedDegenerate,minNondegenerateDoubleArea:minArea,minSignedAnalyticalNormal:minSigned,worstFace,minNormalLength,poleDistance,poleNormalDifference};
check(newPoleDegenerate===128&&unexpectedDegenerate===0,'Unexpected crown degeneration.');check(minSigned>0,'An emitted crown triangle opposes its analytic field.');check(poleDistance===0&&poleNormalDifference===0,'Closed pole is not welded.');

// Root control cells are exact, including their UV interpolation neighborhood.
const rootBounds=[[-1,.788643359743513,.8293653191262352,.7779979002472595],[-1,.8814453956620929,.9204154238967661,.7379999998877353],[-1,.9239197364983559,.9453063587789314,.5479852788801677],[1,.8453849688825907,.8849556601361647,.6779998368856489],[1,.8112218973432537,.8291282792114834,.5979973696357939],[1,.7604044663383526,.7778773244907873,.6379898531703563],[1,.701124213206813,.7269585688999537,.5479986819198178]];
let rootSamples=0,maxRootDelta=0;
for(const[side,a,b,vmax]of rootBounds)for(let i=0;i<=16;i++)for(let j=0;j<=16;j++){const u=a+(b-a)*i/16,v=vmax*j/16,p=chart.sample(side,u,v,.008),q=on.__crown142(side,u,v,.008);rootSamples++;maxRootDelta=Math.max(maxRootDelta,len(sub(arr(p),arr(q))));}
report.rootProtection={rootSamples,maxRootDelta};check(maxRootDelta===0,'Accepted133 crown root support changed.');

let minJac=Infinity,minScaledJac=Infinity,negativeJac=0,exposedRise=0,maxEarlyRise=0,worstJac=null;
for(const side of[-1,1])for(let i=1;i<240;i++){const u=.78+i*.22/240;for(let j=1;j<=100;j++){
 const v=j/100;if(chart.protectedPoint(side,u,v))continue;const h=.00001,du=chart.point(side,u+h,v).sub(chart.point(side,u-h,v)).multiplyScalar(1/(2*h)),dv=chart.point(side,u,Math.min(1,v+h)).sub(chart.point(side,u,v-h)).multiplyScalar(1/(Math.min(1,v+h)-(v-h))),n=du.clone().cross(dv).multiplyScalar(side),j0=n.dot(chart.poleNormal)/Math.sqrt(du.lengthSq()*dv.lengthSq());
 if(j0<minJac){minJac=j0;worstJac={side,u,v};}minScaledJac=Math.min(minScaledJac,n.dot(chart.poleNormal)/(1-u));if(j0<=0)negativeJac++;if(v>.8)exposedRise=Math.max(exposedRise,dv.y);else maxEarlyRise=Math.max(maxEarlyRise,dv.y);
}}
report.sharedField={minNormalizedJacobian:minJac,minPoleScaledSignedJacobian:minScaledJac,negativeJac,worstJac,maxExposedYDerivative:exposedRise,maxRetainedEarlyYDerivative:maxEarlyRise};check(negativeJac===0&&exposedRise<1e-6,'New exposed growth fold or signed chart fold.');

// Exact nearest-point distance to neighboring emitted host triangles, including
// straight ribbon mid-segments. The analytic field is only a UV search hint.
function closest(p,a,b,c){
 const ab=sub(b,a),ac=sub(c,a),ap=sub(p,a),d1=dot(ab,ap),d2=dot(ac,ap);if(d1<=0&&d2<=0)return a;
 const bp=sub(p,b),d3=dot(ab,bp),d4=dot(ac,bp);if(d3>=0&&d4<=d3)return b;
 const vc=d1*d4-d3*d2;if(vc<=0&&d1>=0&&d3<=0)return add(a,ab,d1/(d1-d3));
 const cp=sub(p,c),d5=dot(ab,cp),d6=dot(ac,cp);if(d6>=0&&d5<=d6)return c;
 const vb=d5*d2-d1*d6;if(vb<=0&&d2>=0&&d6<=0)return add(a,ac,d2/(d2-d6));
 const va=d3*d6-d5*d4;if(va<=0&&d4-d3>=0&&d5-d6>=0)return add(b,sub(c,b),(d4-d3)/(d4-d3+d5-d6));
 const denominator=1/(va+vb+vc);return add(add(a,ab,vb*denominator),ac,vc*denominator);
}
function host(p,side,u,v){
 const ix=Math.max(0,Math.min(127,Math.floor(u*128))),iy=Math.max(0,Math.min(63,Math.floor(v*64))),first=side<0?7685:16070;let best=null;
 for(let y=Math.max(0,iy-1);y<=Math.min(63,iy+1);y++)for(let x=Math.max(0,ix-1);x<=Math.min(127,ix+1);x++){
  const a=first+y*129+x,b=a+1,c=a+129,d=c+1;for(const ids of [[a,b,c],[b,d,c]]){
   const pa=vec(cp,ids[0]),pb=vec(cp,ids[1]),pc=vec(cp,ids[2]),n=cross(sub(pb,pa),sub(pc,pa)).map(x=>x*side);if(len(n)<1e-13)continue;const q=closest(p,pa,pb,pc),delta=sub(p,q),distance=dot(delta,delta);if(!best||distance<best.distance)best={distance,signed:dot(delta,unit(n)),triangle:ids};
  }
 }
 return best;
}
const dp=on.children[2].geometry.attributes.position,dp0=off.children[2].geometry.attributes.position,rows=on.__crownFibers142,ownedDetail=new Uint8Array(dp.count);
const clearance={changed:{samples:0,min:Infinity,buried:0,worst:null},protectedWithinOwned:{samples:0,min:Infinity,buried:0,worst:null},straightMidSegments:{samples:0,min:Infinity,buried:0,worst:null}};
for(const row of rows){
 for(let i=row.first;i<row.first+54;i++)ownedDetail[i]=1;
 for(let k=0;k<=52;k++){
  const t=k/52,q=row.params(t),j=Math.floor(k/2),mid=k%2===1,a0=vec(dp,row.first+j*2),b0=vec(dp,row.first+j*2+1),a=mid?add(a0,sub(vec(dp,row.first+(j+1)*2),a0),.5):a0,b=mid?add(b0,sub(vec(dp,row.first+(j+1)*2+1),b0),.5):b0,points=[a,add(a,sub(b,a),.5),b],key=chart.influence(row.side,q.u,q.v)>0?'changed':'protectedWithinOwned';
  for(const p of points){const hit=host(p,row.side,q.u,q.v);if(!hit)continue;for(const name of mid?[key,'straightMidSegments']:[key]){const r=clearance[name];r.samples++;if(hit.signed<r.min){r.min=hit.signed;r.worst={side:row.side,k:row.k,u:q.u,v:q.v,mid};}if(hit.signed<-.00001)r.buried++;}}
 }
}
let protectedDetailChanges=0,protectedDetailNormals=0;const dn=on.children[2].geometry.attributes.normal,dn0=off.children[2].geometry.attributes.normal;
for(let i=0;i<dp.count;i++)if(!ownedDetail[i]){if(len(sub(vec(dp,i),vec(dp0,i))))protectedDetailChanges++;if(len(sub(vec(dn,i),vec(dn0,i))))protectedDetailNormals++;}
report.actualRibbonHost={...clearance,ownedRows:rows.length,protectedDetailChanges,protectedDetailNormals};
check(protectedDetailChanges===0&&protectedDetailNormals===0,'Unowned DETAIL buffers changed.');
check(clearance.changed.buried===0,'A newly owned ribbon sample lies below its tessellated host.');

function centerOnEmitted(row,v,attribute){
 const t=Math.min(1,v/row.params(1).v),at=t*26,j=Math.min(25,Math.floor(at)),q=at-j;
 const a=add(vec(attribute,row.first+j*2),vec(attribute,row.first+j*2+1)).map(x=>x*.5),b=add(vec(attribute,row.first+(j+1)*2),vec(attribute,row.first+(j+1)*2+1)).map(x=>x*.5);
 return add(a,sub(b,a),q);
}
function transverse(field,side,u,v){
 const h=.00002,du=sub(arr(field(side,u+h,v)),arr(field(side,u-h,v))),dv=sub(arr(field(side,u,v+h)),arr(field(side,u,v-h)));
 return unit(add(du,dv,-dot(du,dv)/dot(dv,dv)));
}
const ordering={tested:0,pureClosingTested:0,pureClosingReversals:0,baselineReversals:0,onReversals:0,newReversals:0,crossLayerNewReversals:0,sameLayerNewReversals:0,minNewReversalNormalSeparation:Infinity,maxNewReversalTransverseMagnitude:0,minPureClosingGap:Infinity,minPureClosingEdgeGap:Infinity,newReversalExamples:[],pureClosingExamples:[]};
for(let i=0;i<rows.length-1;i++){
 const a=rows[i],b=rows[i+1];if(a.side!==b.side||b.k!==a.k+1)continue;
 for(let j=1;j<=24;j++){
  const v=j*.98/24,u=(a.u+b.u)/2;if(chart.influence(a.side,u,v)===0)continue;
  const axis=transverse((s,u,v)=>chart.point(s,u,v),a.side,u,v),oldAxis=transverse((s,u,v)=>on.__crown142(s,u,v,.002),a.side,u,v),gap=dot(sub(centerOnEmitted(b,v,dp),centerOnEmitted(a,v,dp)),axis),oldGap=dot(sub(centerOnEmitted(b,v,dp0),centerOnEmitted(a,v,dp0)),oldAxis);
  ordering.tested++;if(oldGap<-.000001)ordering.baselineReversals++;if(gap<-.000001)ordering.onReversals++;
  if(gap<-.000001&&oldGap>=-.000001){ordering.newReversals++;const crossLayer=(a.k%6===0)!==(b.k%6===0),normalSeparation=Math.abs(dot(sub(centerOnEmitted(b,v,dp),centerOnEmitted(a,v,dp)),arr(chart.normal(a.side,u,v))));if(crossLayer)ordering.crossLayerNewReversals++;else ordering.sameLayerNewReversals++;ordering.minNewReversalNormalSeparation=Math.min(ordering.minNewReversalNormalSeparation,normalSeparation);ordering.maxNewReversalTransverseMagnitude=Math.max(ordering.maxNewReversalTransverseMagnitude,-gap);if(ordering.newReversalExamples.length<12)ordering.newReversalExamples.push({side:a.side,k:a.k,u,v,gap,oldGap,crossLayer,normalSeparation});}
  if(a.u>.96){ordering.pureClosingTested++;ordering.minPureClosingGap=Math.min(ordering.minPureClosingGap,gap);ordering.minPureClosingEdgeGap=Math.min(ordering.minPureClosingEdgeGap,gap-a.width-b.width);if(gap<=0){ordering.pureClosingReversals++;ordering.pureClosingExamples.push({side:a.side,k:a.k,u,v,gap,oldGap,qa:a.params(v/a.params(1).v),qb:b.params(v/b.params(1).v),directGap:dot(sub(arr(b.curve.getPoint(v/b.params(1).v)),arr(a.curve.getPoint(v/a.params(1).v))),axis)});}}
 }
}
let minimumPolePlaneDot=1;
for(const side of[-1,1])for(let j=1;j<20;j++)minimumPolePlaneDot=Math.min(minimumPolePlaneDot,chart.normal(side,1-.00001,j/20).dot(chart.poleNormal));
report.actualRibbonOrdering={...ordering,minimumPolePlaneDot};
check(ordering.pureClosingReversals===0,'A newly closed front fiber family reverses emitted lateral order.');
check(minimumPolePlaneDot>.999,'The first-order pole fan is not in one common tangent plane.');

// Resolve the few remaining projected overlaps using actual finite triangles.
// Positive depth separation alone at one center sample is not sufficient.
function triangles(row,attribute){const out=[];for(let j=0;j<26;j++){const a=row.first+j*2,b=a+2;for(const ids of[[a,a+1,b],[a+1,b+1,b]])out.push(ids.map(i=>vec(attribute,i)));}return out;}
function intersects(a,b){
 for(let axis=0;axis<3;axis++)if(Math.max(...a.map(p=>p[axis]))<Math.min(...b.map(p=>p[axis]))-1e-10||Math.max(...b.map(p=>p[axis]))<Math.min(...a.map(p=>p[axis]))-1e-10)return false;
 const ea=[sub(a[1],a[0]),sub(a[2],a[1]),sub(a[0],a[2])],eb=[sub(b[1],b[0]),sub(b[2],b[1]),sub(b[0],b[2])],na=cross(ea[0],ea[1]),nb=cross(eb[0],eb[1]),axes=[na,nb,...ea.flatMap(x=>eb.map(y=>cross(x,y))),...ea.map(x=>cross(na,x)),...eb.map(x=>cross(nb,x))];
 for(const axis of axes){if(len(axis)<1e-16)continue;const n=unit(axis),pa=a.map(p=>dot(p,n)),pb=b.map(p=>dot(p,n));if(Math.max(...pa)<Math.min(...pb)-1e-10||Math.max(...pb)<Math.min(...pa)-1e-10)return false;}return true;
}
function components(contacts){const pending=new Set(contacts.map((_,i)=>i)),out=[];while(pending.size){const i=pending.values().next().value;pending.delete(i);const group=[contacts[i]];for(let q=0;q<group.length;q++)for(const j of [...pending])if(Math.abs(group[q][0]-contacts[j][0])<=2&&Math.abs(group[q][1]-contacts[j][1])<=2){pending.delete(j);group.push(contacts[j]);}out.push(group);}return out;}
const pairTests=[];let newPhysicalIntersections=0,newPhysicalComponents=0;
for(const event of ordering.newReversalExamples){
 const a=rows.find(r=>r.side===event.side&&r.k===event.k),b=rows.find(r=>r.side===event.side&&r.k===event.k+1);if(pairTests.some(r=>r.side===a.side&&r.k===a.k))continue;
 const at=triangles(a,dp),bt=triangles(b,dp),a0=triangles(a,dp0),b0=triangles(b,dp0);let baseline=0,current=0,newCount=0,newOwned=0;const examples=[],baselineContacts=[],currentContacts=[];
 for(let i=0;i<52;i++)for(let j=0;j<52;j++){
  const before=intersects(a0[i],b0[j]),after=intersects(at[i],bt[j]);if(before){baseline++;baselineContacts.push([i,j]);}if(after){current++;currentContacts.push([i,j]);}
  if(after&&!before){newCount++;const t=(Math.floor(i/2)+.5)/26,q=a.params(t),r=b.params((Math.floor(j/2)+.5)/26),owned=chart.influence(a.side,q.u,q.v)>0||chart.influence(b.side,r.u,r.v)>0;if(owned)newOwned++;if(examples.length<8)examples.push({a:i,b:j,owned,u:q.u,v:q.v});}
 }
 const oldComponents=components(baselineContacts),newComponents=components(currentContacts),unmatched=newComponents.filter(group=>!group.some(([i,j])=>baselineContacts.some(([i0,j0])=>Math.abs(i-i0)<=2&&Math.abs(j-j0)<=2)));
 newPhysicalIntersections+=newOwned;newPhysicalComponents+=unmatched.length;pairTests.push({side:a.side,k:a.k,baselineIntersections:baseline,onIntersections:current,newIntersections:newCount,newOwnedIntersections:newOwned,baselineContactComponents:oldComponents.length,onContactComponents:newComponents.length,newContactComponents:unmatched.length,baselineContacts,currentContacts,examples});
}
report.actualRibbonOrdering.projectedOverlapTrianglePairs={pairs:pairTests,newOwnedTrianglePairs:newPhysicalIntersections,newContactComponents:newPhysicalComponents,trianglePairsPerFiberPair:2704,separationTolerance:1e-10,matching:'An existing contact may move across its immediately adjacent emitted quad; separate new contact regions fail.'};
check(newPhysicalComponents===0,'A projected order change creates an actual new ribbon contact region.');

const wp=on.children[4].geometry.attributes.position,wp0=off.children[4].geometry.attributes.position,wn=on.children[4].geometry.attributes.normal,wn0=off.children[4].geometry.attributes.normal,ownedWisps=new Uint8Array(wp.count);
for(const r of chart.metrics.frontWispRows)for(let i=r.first;i<r.first+50;i++)ownedWisps[i]=1;
let protectedWispPositionChanges=0,protectedWispNormalChanges=0;for(let i=0;i<wp.count;i++)if(!ownedWisps[i]){if(len(sub(vec(wp,i),vec(wp0,i))))protectedWispPositionChanges++;if(len(sub(vec(wn,i),vec(wn0,i))))protectedWispNormalChanges++;}
report.wisps={changed:chart.metrics.frontWispRows.length,perSide:Object.fromEntries([-1,1].map(side=>{const rs=chart.metrics.frontWispRows.filter(r=>r.side===side);return[side,{kRange:[rs[0].k,rs.at(-1).k],uRange:[rs[0].u,rs.at(-1).u]}];})),protectedWispPositionChanges,protectedWispNormalChanges,templeEarAndFlyawaysProtected:true};
check(protectedWispPositionChanges===0&&protectedWispNormalChanges===0,'Unowned WISPS changed.');
report.metadata=on.userData.crownChart142;report.pass=report.errors.length===0;
fs.writeFileSync('review/crown142-source-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
process.exitCode=report.pass?0:1;
