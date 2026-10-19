import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {construct144,acceptedEar144,toPostHead144,coefficients,helper} from './near-ear144-source.mjs';
import {triangleSoup144,surfaceClearance144,sweepOrientation144,sweepSelfIntersections144,ribbonOrientation144} from './near-ear144-geometry.mjs';

const start=performance.now(),cpuStart=process.cpuUsage(),hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex'),sha=a=>crypto.createHash('sha256').update(a).digest('hex');
const snapshot=g=>g.children.map(m=>({name:m.name,index:hash(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,hash(a.array)]))}));
let frozen=construct144(0,{baseline:true}),sourceHashes=snapshot(frozen),base=construct144(0);
assert.deepEqual(snapshot(base),sourceHashes,'144 off constructor must reproduce frozen133 exactly');
frozen=null;global.gc?.();
assert.equal(helper.prepareNearEar144(null,{strength:0}),null);assert.throws(()=>helper.prepareNearEar144(null,{strength:.5}),/off\/on/);
const enabledAt=performance.now(),next=construct144(1),constructionMs=performance.now()-enabledAt;
const ranges={1:[[75762,76311]],2:[[317086,320218],[610094,610144]]},owned=(mesh,i)=>(ranges[mesh]??[]).some(([a,b])=>i>=a&&i<b);
const result={iteration:144,score:77,sourceOnly:true,native:false,offMatchesFrozen133:true,coefficientFingerprint:coefficients.fingerprint,continuousCenterBound:coefficients.continuousBound,
 preparation:next.__route144.metrics,constructionMs,parts:[],protectedChanges:0,lowerPositionChanges:0,lowerNormalChanges:0,lowerVertexCount:0,rootPositionChanges:0,
 positionChanges:0,normalChanges:0,nonfinite:0,normalLengthError:0,maximumVertexDisplacement:0,maximumRawYChange:0};
for(let mi=0;mi<base.children.length;mi++){
 const a=base.children[mi],b=next.children[mi],ga=a.geometry,gb=b.geometry,p=ga.attributes.position,q=gb.attributes.position,n=gb.attributes.normal;
 assert.equal(a.name,b.name);assert.equal(p.count,q.count);assert.equal(hash(ga.index.array),hash(gb.index.array));
 for(const key of['uv','color'])assert.equal(hash(ga.attributes[key].array),hash(gb.attributes[key].array),a.name+' '+key);
 const row={name:a.name,vertices:p.count,triangles:ga.index.count/3,changedPosition:0,changedNormal:0,index:hash(gb.index.array),color:hash(gb.attributes.color.array),uv:hash(gb.attributes.uv.array)};
 for(let i=0;i<p.count;i++){
  const offset=i*3,positionChanged=[0,1,2].some(k=>p.array[offset+k]!==q.array[offset+k]),normalChanged=[0,1,2].some(k=>ga.attributes.normal.array[offset+k]!==n.array[offset+k]);
  if(positionChanged){row.changedPosition++;result.positionChanges++;}if(normalChanged){row.changedNormal++;result.normalChanges++;}
  if(!owned(mi,i)&&(positionChanged||normalChanged))result.protectedChanges++;
  const rawY=a.__rawPosition[offset+1];
  if(owned(mi,i)&&rawY<=-1.05){result.lowerVertexCount++;if(positionChanged)result.lowerPositionChanges++;if(normalChanged)result.lowerNormalChanges++;}
  if(owned(mi,i)&&rawY>=.80&&positionChanged)result.rootPositionChanges++;
  if(owned(mi,i))result.maximumRawYChange=Math.max(result.maximumRawYChange,Math.abs(b.__rawPosition[offset+1]-rawY));
  const length=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(!Number.isFinite(q.getX(i)+q.getY(i)+q.getZ(i)+length))result.nonfinite++;if(length)result.normalLengthError=Math.max(result.normalLengthError,Math.abs(length-1));
  result.maximumVertexDisplacement=Math.max(result.maximumVertexDisplacement,Math.hypot(q.getX(i)-p.getX(i),q.getY(i)-p.getY(i),q.getZ(i)-p.getZ(i)));
 }
 for(const key of['map','normalMap','alphaMap']){
  const aa=a.material[key],bb=b.material[key];assert.equal(Boolean(aa),Boolean(bb));
  if(aa){assert.equal(aa.image.width,bb.image.width);assert.equal(aa.image.height,bb.image.height);assert.equal(hash(aa.image.data),hash(bb.image.data),a.name+' '+key+' bytes');}
 }
 const physical=['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','alphaTest','alphaToCoverage','side','transparent','depthWrite','opacity','forceSinglePass'];
 for(const key of physical)assert.equal(a.material[key],b.material[key],a.name+' '+key);
 result.parts.push(row);
}
for(const key of['protectedChanges','lowerPositionChanges','lowerNormalChanges','rootPositionChanges','nonfinite'])assert.equal(result[key],0,key);
assert(result.normalLengthError<2e-6);assert.equal(next.__ribbons144.length,55);
assert.deepEqual(next.__guides[138].c.debug.cuts,base.__guides[138].c.debug.cuts);
assert.equal(next.__guides[138].w,base.__guides[138].w);assert.equal(next.__guides[138].d,base.__guides[138].d);
const lower={guideSamples:0,fineSamples:0,guidePositionChanges:0,guideTangentChanges:0,finePositionChanges:0,fineTangentChanges:0},root={guideSamples:0,maximumPositionChange:0,maximumTangentChange:0};
const same=(a,b)=>a.x===b.x&&a.y===b.y&&a.z===b.z,distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const g0=base.__guides[138].c,g1=next.__guides[138].c;
for(let i=0;i<=2048;i++){
 const t=i/2048,a=g0.getPoint(t),b=g1.getPoint(t);
 if(a.y<=-1.05){lower.guideSamples++;if(!same(a,b))lower.guidePositionChanges++;if(!same(g0.getTangent(t),g1.getTangent(t)))lower.guideTangentChanges++;}
 if(t<=g0.debug.cuts[1]){root.guideSamples++;root.maximumPositionChange=Math.max(root.maximumPositionChange,distance(a,b));root.maximumTangentChange=Math.max(root.maximumTangentChange,distance(g0.getTangent(t),g1.getTangent(t)));}
}
for(let i=0;i<55;i++){
 const a=base.__ribbons144[i],b=next.__ribbons144[i];assert.deepEqual([a.from,a.to,a.steps,a.width,a.phase,a.tip,a.deformEar],[b.from,b.to,b.steps,b.width,b.phase,b.tip,b.deformEar]);
 for(let j=0;j<=512;j++){const t=j/512,p=a.curve.getPoint(t),q=b.curve.getPoint(t);if(p.y<=-1.05){lower.fineSamples++;if(!same(p,q))lower.finePositionChanges++;if(!same(a.curve.getTangent(t),b.curve.getTangent(t)))lower.fineTangentChanges++;}}
}
for(const key of['guidePositionChanges','guideTangentChanges','finePositionChanges','fineTangentChanges'])assert.equal(lower[key],0,key);
assert.equal(root.maximumPositionChange,0);assert.equal(root.maximumTangentChange,0);result.lowerContinuity=lower;result.rootContinuation=root;
const ear=acceptedEar144(),obstacle=triangleSoup144(ear.attributes.position.array,ear.index.array),mp0=toPostHead144(base.children[1]),mp1=toPostHead144(next.children[1]),mi=next.children[1].geometry.index.array;
const region={from:138*960,to:139*960,minY:-.60,maxY:.58};
const before=triangleSoup144(mp0,mi,region),after=triangleSoup144(mp1,mi,region);
result.massClearance={before:surfaceClearance144(before,obstacle),after:surfaceClearance144(after,obstacle)};
result.orientation=sweepOrientation144(mp0,mp1,mi,{from:138*960,to:139*960,vertexOffset:138*549});
result.selfIntersection=sweepSelfIntersections144(after,{firstTriangle:138*960});
const dp0=toPostHead144(base.children[2]),dp1=toPostHead144(next.children[2]),di=next.children[2].geometry.index.array;
const selectedIndices=[];for(let i=0;i<di.length;i+=3)if(owned(2,di[i]))selectedIndices.push(di[i],di[i+1],di[i+2]);
const fineBefore=triangleSoup144(dp0,selectedIndices,{minY:-.60,maxY:.58}),fineAfter=triangleSoup144(dp1,selectedIndices,{minY:-.60,maxY:.58});
result.fineClearance={before:surfaceClearance144(fineBefore,obstacle),after:surfaceClearance144(fineAfter,obstacle,{maximumExamples:80})};
result.fineOrientation=ribbonOrientation144(dp0,dp1,selectedIndices);
result.renderSurfaceDisplacementBound={upper:result.maximumVertexDisplacement,method:'For each matching actual render triangle, displacement at common barycentric coordinates is a convex combination of its vertex displacements. Their largest norm therefore bounds the entire piecewise-linear source/candidate surface correspondence.'};
fs.writeFileSync('review/near-ear144-source-audit-working.json',JSON.stringify({...result,status:'working-before-final-clearance-gates'},null,2)+'\n');
assert.equal(result.massClearance.after.intersectionPairs,0,'MASS/ear intersections');assert(result.massClearance.after.minimumDistance>.001,'MASS/ear clearance');
assert.equal(result.fineClearance.after.intersectionPairs,0,'fine/ear intersections');assert(result.fineClearance.after.minimumDistance>.0005,'fine/ear clearance');
assert.equal(result.orientation.newNegative,0);assert(result.orientation.minimumAreaRatio>.20);assert.equal(result.selfIntersection.intersectionPairs,0);
assert.equal(result.fineOrientation.newFoldedQuads,0);assert(result.fineOrientation.minimumAreaRatio>.20);assert(result.fineOrientation.minimumNormalAgreement>0);
assert.deepEqual(snapshot(base),sourceHashes,'original source bytes changed while auditing candidate');
result.sourceImmutable=true;
const cpu=process.cpuUsage(cpuStart);result.resources={wallMs:performance.now()-start,cpuMs:(cpu.user+cpu.system)/1000,peakRSSMiB:process.resourceUsage().maxRSS/1024};
result.files=Object.fromEntries(['src/main.js','review/hair-groom-candidate133.js','review/hair-groom-candidate144.js','review/near-ear-route-candidate144.js','review/near-ear144-coefficients.js'].map(p=>[p,{bytes:fs.statSync(p).size,sha256:sha(fs.readFileSync(p))}]));
result.limitations=['Source-only geometry harness; native Three and the assembled141 scene remain authoritative.','The triangle distances are Euclidean distances between the actual piecewise-linear render surfaces, not a signed normal-gap approximation.','The continuous center bound is distinct from the sampled rebuilt vertex maximum and does not claim a tight bound for every continuously swept section point.','Radial winding and nonadjacent strip intersections check actual selected MASS geometry; they do not predict whether the outer return will look like a strap.','Pigment HSL is stubbed in the local ear harness; no ear pigment is changed by144 and native uses the actual accepted ear.'];
fs.writeFileSync('review/near-ear144-source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,parts:result.parts.map(p=>({name:p.name,changedPosition:p.changedPosition,changedNormal:p.changedNormal})),massClearance:{before:result.massClearance.before.intersectionPairs,after:result.massClearance.after.minimumDistance},fineClearance:{before:result.fineClearance.before.intersectionPairs,after:result.fineClearance.after.minimumDistance},files:undefined,limitations:undefined}));
