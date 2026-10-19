import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {construct,cloth,rayGrid,modelPoint,rawToModel,originalRanges,familyClumps} from './lower-clump126-source.mjs';
const started=performance.now(),cpuStart=process.cpuUsage(),hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const snapshot=root=>root.children.map(m=>({name:m.name,index:hash(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,hash(a.array)]))}));
const baseline=construct(0,{baseline:true}),originalHash=snapshot(baseline);
let off=construct(0,{family:true});assert.deepEqual(snapshot(off),originalHash);off=null;global.gc?.();
assert.equal(familyClumps.prepareLowerClumps126(null,null,{strength:0}),familyClumps.prepareLowerClumps126(null,null));
assert.throws(()=>familyClumps.prepareLowerClumps126(null,null,{strength:1.2}),/strength/);
const next=construct(1,{family:true}),mass=next.children[1],oldMass=baseline.children[1],stats=next.userData.lowerClump126,oldRanges=originalRanges(290),ranges=stats.ranges,metrics={zeroGeometryByteIdentical:true,nonfinite:0,maxNormalError:0,zeroNormals:0,baselineZeroNormals:0,protectedComponents:0,protectedMassAttributes:0,protectedMassIndices:0,protectedUpperMassPosition:0,protectedUpperMassNormal:0,protectedUpperFinePosition:0,protectedUpperFineNormal:0,rearMassPositions:0,protectedFineAttributes:0,maxOriginalRingXY:0,maxOriginalRingRecession:0,negativeRecession:0,maxFineRawDelta:[0,0,0],massTriangleZeros:0,baselineMassTriangleZeros:0};
const selected=id=>id>=58&&id<=132;
for(let mi=0;mi<5;mi++){
 const m=next.children[mi],old=baseline.children[mi],p=m.geometry.attributes.position,n=m.geometry.attributes.normal,oldN=old.geometry.attributes.normal;
 for(let i=0;i<p.count;i++){
  if(!Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)+n.getX(i)+n.getY(i)+n.getZ(i)))metrics.nonfinite++;
  const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(l===0)metrics.zeroNormals++;else metrics.maxNormalError=Math.max(metrics.maxNormalError,Math.abs(l-1));
 }
 for(let i=0;i<oldN.count;i++)if(Math.hypot(oldN.getX(i),oldN.getY(i),oldN.getZ(i))===0)metrics.baselineZeroNormals++;
 if([0,3,4].includes(mi)){assert.deepEqual(snapshot({children:[m]}),snapshot({children:[old]}));metrics.protectedComponents++;}
 if(mi===2){
  assert.equal(p.count,old.geometry.attributes.position.count);assert.equal(hash(m.geometry.index.array),hash(old.geometry.index.array));
  for(const key of['color','uv'])assert.equal(hash(m.geometry.attributes[key].array),hash(old.geometry.attributes[key].array));
  const a=m.__rawPosition,b=old.__rawPosition;
  for(let i=0;i<p.count;i++){
   const k=i*3;if(b[k+1]>=-1.64){for(let q=0;q<3;q++){if(a[k+q]!==b[k+q])metrics.protectedUpperFinePosition++;if(n.array[k+q]!==oldN.array[k+q])metrics.protectedUpperFineNormal++;}}
   for(let q=0;q<3;q++)metrics.maxFineRawDelta[q]=Math.max(metrics.maxFineRawDelta[q],Math.abs(a[k+q]-b[k+q]));
  }
  const isChanged=i=>{if(i<114376||i>=301426)return false;return Math.floor((i-114376)%(43*58)/58)%7!==0;};
  for(const key of['position','normal','color','uv']){const aa=m.geometry.attributes[key],bb=old.geometry.attributes[key];for(let i=0;i<aa.count;i++)if(!isChanged(i))for(let q=0;q<aa.itemSize;q++)if(aa.array[i*aa.itemSize+q]!==bb.array[i*bb.itemSize+q])metrics.protectedFineAttributes++;}
 }
}
for(let id=0;id<290;id++){
 const r=ranges[id],b=oldRanges[id];assert.equal(r.guide,id);
 if(!selected(id)){
  assert.equal(r.to-r.from,b.to-b.from);
  for(const key of['position','normal','color','uv']){const a=mass.geometry.attributes[key],o=oldMass.geometry.attributes[key];for(let j=0;j<(r.to-r.from)*a.itemSize;j++)if(a.array[r.from*a.itemSize+j]!==o.array[b.from*a.itemSize+j])metrics.protectedMassAttributes++;}
  for(let j=0;j<(r.triangleTo-r.triangleFrom)*3;j++)if(mass.geometry.index.array[r.triangleFrom*3+j]-r.from!==oldMass.geometry.index.array[b.triangleFrom*3+j]-b.from)metrics.protectedMassIndices++;
  continue;
 }
 const d=next.__guides[id].clump126;
 for(let j=0;j<=60;j++)for(let k=0;k<=8;k++){
  const ni=d.ringStarts[j]+(j<d.firstDense?k:k<=4?k*5:20+k-4),oi=id*549+j*9+k,a=mass.__rawPosition,b=oldMass.__rawPosition;
  for(let q=0;q<2;q++)metrics.maxOriginalRingXY=Math.max(metrics.maxOriginalRingXY,Math.abs(a[ni*3+q]-b[oi*3+q]));
  const recession=b[oi*3+2]-a[ni*3+2];metrics.maxOriginalRingRecession=Math.max(metrics.maxOriginalRingRecession,recession);if(recession< -1e-7)metrics.negativeRecession++;
  if(k>=4)for(let q=0;q<3;q++)if(a[ni*3+q]!==b[oi*3+q])metrics.rearMassPositions++;
  if(b[oi*3+1]>=-1.64)for(let q=0;q<3;q++){if(a[ni*3+q]!==b[oi*3+q])metrics.protectedUpperMassPosition++;if(mass.geometry.attributes.normal.array[ni*3+q]!==oldMass.geometry.attributes.normal.array[oi*3+q])metrics.protectedUpperMassNormal++;}
 }
}
function zeroTriangles(mesh){const p=mesh.geometry.attributes.position.array,ix=mesh.geometry.index.array;let zero=0;for(let k=0;k<ix.length;k+=3){const a=ix[k]*3,b=ix[k+1]*3,c=ix[k+2]*3,ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2];if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)<1e-14)zero++;}return zero;}
metrics.massTriangleZeros=zeroTriangles(mass);metrics.baselineMassTriangleZeros=zeroTriangles(oldMass);
const rays=rayGrid(oldMass,oldRanges),bc=Math.cos(.045),bs=Math.sin(.045),clearance={samples:0,newPenetrations:0,worsenedInherited:0,minBefore:Infinity,minAfter:Infinity,maxWorsening:0},envelope={samples:0,outsideFront:0,outsideRear:0,maxFrontExcess:0,maxRearExcess:0,noOwnHit:0};
for(let id=58;id<=132;id++){
 const d=next.__guides[id].clump126;
 for(let j=d.firstDense;j<=60;j++)for(let k=1;k<20;k++){
  const ring=d.rings[j],q=ring.qs[k],lo=Math.floor(q),f=q-lo,oa=(id*549+j*9+lo)*3,ob=oa+3,raw=oldMass.__rawPosition,oldP={x:raw[oa]+(raw[ob]-raw[oa])*f,y:raw[oa+1]+(raw[ob+1]-raw[oa+1])*f,z:raw[oa+2]+(raw[ob+2]-raw[oa+2])*f},p=ring.positions[k];if(oldP.z-p.z<1e-6)continue;
  const idx=d.ringStarts[j]+k,attr=mass.geometry.attributes.position,after=modelPoint(attr.getX(idx),attr.getY(idx),attr.getZ(idx)),before=rawToModel(oldP,next.__contact),ray=rays.at(after[0],after[1]),h=ray?.hits.get(id);
  if(h){envelope.samples++;const front=after[2]-h.max,rear=h.min-after[2];envelope.maxFrontExcess=Math.max(envelope.maxFrontExcess,front);envelope.maxRearExcess=Math.max(envelope.maxRearExcess,rear);if(front>.0002)envelope.outsideFront++;if(rear>.0002)envelope.outsideRear++;}else envelope.noOwnHit++;
  const body=cloth.sampleBlouseFrontAtXY(bc*after[0]+bs*(after[1]-1),-bs*after[0]+bc*(after[1]-1)+1);if(!body||body.edgeWeight<.01)continue;
  const g0=(before[2]-body.point.z)*body.normal.z,g1=(after[2]-body.point.z)*body.normal.z;clearance.samples++;clearance.minBefore=Math.min(clearance.minBefore,g0);clearance.minAfter=Math.min(clearance.minAfter,g1);if(g0>=.001&&g1<-.001)clearance.newPenetrations++;if(g0<0&&g1<g0-.001)clearance.worsenedInherited++;clearance.maxWorsening=Math.max(clearance.maxWorsening,g0-g1);
 }
}
for(const key of['nonfinite','protectedMassAttributes','protectedMassIndices','protectedUpperMassPosition','protectedUpperMassNormal','protectedUpperFinePosition','protectedUpperFineNormal','rearMassPositions','protectedFineAttributes','negativeRecession'])assert.equal(metrics[key],0,key);
fs.writeFileSync('review/lower-clump126-audit-preflight.json',JSON.stringify({metrics,clearance,envelope},null,2)+'\n');
assert.equal(metrics.maxOriginalRingXY,0);assert.equal(metrics.zeroNormals,metrics.baselineZeroNormals);assert(metrics.maxNormalError<1e-6);assert.equal(metrics.massTriangleZeros,metrics.baselineMassTriangleZeros);assert.equal(clearance.newPenetrations,0);assert.equal(clearance.worsenedInherited,0);assert(envelope.maxFrontExcess<.001,'Refined contact interpolation exceeded the0.001 subpixel allowance.');assert.equal(envelope.outsideRear,0);assert.equal(stats.surfaceFineCurves,2700);
const cpu=process.cpuUsage(cpuStart),result={candidate:126,revision:'shared-family sections with attached fine paths',sourceOnly:true,metrics,clearance,envelope,geometry:{baseline:baseline.userData,candidate:next.userData},resources:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024},limitations:['Native Three/WebGPU images and timings remain authoritative.','The actual guide-triangle envelope and main blouse are sampled at changed section vertices; this is not an exhaustive intersection certificate.','The source harness deliberately retains ring records for diagnostics; production deletes support closures before fibers and ring records after them.','Zero compares all geometry attributes and indices; userData review metadata intentionally differs.']};
fs.writeFileSync('review/lower-clump126-source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,geometry:{baselineTriangles:baseline.userData.triangles,candidateTriangles:next.userData.triangles,baselineMiB:baseline.userData.geometryMiB,candidateMiB:next.userData.geometryMiB,clumps:{...stats,ranges:undefined}}}));
