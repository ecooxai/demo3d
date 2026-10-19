import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {construct,cloth,THREE,fit,read} from './guide-placement118-source.mjs';
const started=performance.now(),cpuStart=process.cpuUsage();
const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const snapshots=g=>g.children.map(m=>({name:m.name,index:hash(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,hash(a.array)]))}));
const baseline=construct(0,{baseline:true}),baselineHash=snapshots(baseline);
let off=construct(0);assert.deepEqual(snapshots(off),baselineHash);off=null;global.gc?.();
assert.equal(fit.fitLowerGuides118(null,null,{strength:0}),fit.fitLowerGuides118(null,null));
const cases=[];
const cr=Math.cos(-.17),sr=Math.sin(-.17),cy=Math.cos(.16),sy=Math.sin(.16),bc=Math.cos(.045),bs=Math.sin(.045);
const model=(a,i)=>{const x=a.getX(i),y=a.getY(i),z=a.getZ(i),rx=x*cr-y*sr;return[.26+rx*cy+z*sy,2.95+x*sr+y*cr,-rx*sy+z*cy];};
const CLEAR_SIDES=[154,155,166,167];
const isSelected=(g,id)=>['front','inner','curl'].includes(g.kind)&&!g.temple||CLEAR_SIDES.includes(id);
const q=(a,f)=>{a.sort((x,y)=>x-y);return a[Math.floor((a.length-1)*f)];};

function meaningfulTurns(values,threshold=.035){
 let dir=0,extreme=values[0],count=0;
 for(const v of values){
  if(dir===0){if(v-extreme>threshold){dir=1;extreme=v;}else if(extreme-v>threshold){dir=-1;extreme=v;}}
  else if(dir>0){if(v>extreme)extreme=v;else if(extreme-v>threshold){count++;dir=-1;extreme=v;}}
  else if(v<extreme)extreme=v;else if(v-extreme>threshold){count++;dir=1;extreme=v;}
 }
 return count;
}

// Same-XY rays are evaluated independently on each rebuilt triangle mesh.
// Compare distinct-guide depth intervals only where the source intervals were
// wholly separated; inherited overlaps do not count as newly created ones.
const GRID={nx:88,ny:76,x0:-1.65,y0:-1.25,dx:3.7/88,dy:2.65/76};
function rayIntervals(mesh){
 const p=mesh.geometry.attributes.position,idx=mesh.geometry.index.array,xyz=new Float64Array(p.count*3),rays=Array.from({length:GRID.nx*GRID.ny},()=>new Map());
 for(let i=0;i<p.count;i++)xyz.set(model(p,i),i*3);
 for(let k=0;k<idx.length;k+=3){
  const ai=idx[k]*3,bi=idx[k+1]*3,ci=idx[k+2]*3,ax=xyz[ai],ay=xyz[ai+1],bx=xyz[bi],by=xyz[bi+1],cx=xyz[ci],cy=xyz[ci+1];
  const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-12)continue;
  const minx=Math.max(0,Math.ceil((Math.min(ax,bx,cx)-GRID.x0)/GRID.dx-.5)),maxx=Math.min(GRID.nx-1,Math.floor((Math.max(ax,bx,cx)-GRID.x0)/GRID.dx-.5));
  const miny=Math.max(0,Math.ceil((Math.min(ay,by,cy)-GRID.y0)/GRID.dy-.5)),maxy=Math.min(GRID.ny-1,Math.floor((Math.max(ay,by,cy)-GRID.y0)/GRID.dy-.5));
  for(let j=miny;j<=maxy;j++)for(let i=minx;i<=maxx;i++){
   const x=GRID.x0+(i+.5)*GRID.dx,y=GRID.y0+(j+.5)*GRID.dy,u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den,w=1-u-v;
   if(Math.min(u,v,w)<-1e-9)continue;const z=u*xyz[ai+2]+v*xyz[bi+2]+w*xyz[ci+2];if(z<.15)continue;
   const gid=Math.floor(k/3/960),row=rays[j*GRID.nx+i],a=row.get(gid);if(a){a.min=Math.min(a.min,z);a.max=Math.max(a.max,z);}else row.set(gid,{min:z,max:z});
  }
 }
 return rays;
}
const baselineRays=rayIntervals(baseline.children[1]);
for(const strength of[.5,1]){
 const t0=performance.now();let next=construct(strength);
 const metrics={strength,fit:next.userData.guidePlacement118,geometry:next.userData,maximumRawSectionXY:[0,0],maximumPosedSectionXY:[0,0],maximumRawFineXY:[0,0],maxGuideCenterXY:0,protectedRawPositionChanges:0,protectedComponentChanges:0,sideBackFarMassChanges:0,protectedFineChanges:0,protectedFarFineChanges:0,nonfinite:0,maxNormalError:0,zeroNormals:0,maxInwardDisplacement:0,guideNewTurns:[],guideSamples:0};
 for(let m=0;m<5;m++){
  const a=next.children[m],b=baseline.children[m],p=a.geometry.attributes.position,old=b.geometry.attributes.position,n=a.geometry.attributes.normal;
  assert.equal(a.name,b.name);assert.equal(p.count,old.count);assert.equal(hash(a.geometry.index.array),hash(b.geometry.index.array));
  for(const key of['color','uv'])assert.equal(hash(a.geometry.attributes[key].array),hash(b.geometry.attributes[key].array));
  if([0,3,4].includes(m))for(const key of['position','normal'])if(hash(a.geometry.attributes[key].array)!==hash(b.geometry.attributes[key].array))metrics.protectedComponentChanges++;
  for(let i=0;i<p.count;i++){
   const raw=a.__rawPosition,base=b.__rawPosition,j=i*3;
   if(base[j+1]>=-1.64&&(raw[j]!==base[j]||raw[j+1]!==base[j+1]||raw[j+2]!==base[j+2]))metrics.protectedRawPositionChanges++;
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),l=Math.hypot(nx,ny,nz);
   if(!Number.isFinite(x+y+z+nx+ny+nz))metrics.nonfinite++;if(l===0)metrics.zeroNormals++;else metrics.maxNormalError=Math.max(metrics.maxNormalError,Math.abs(l-1));
   if(m===1){
    const gid=Math.floor(i/549),g=baseline.__guides[gid];if(!isSelected(g,gid)&&(x!==old.getX(i)||y!==old.getY(i)||z!==old.getZ(i)))metrics.sideBackFarMassChanges++;
    metrics.maximumRawSectionXY[0]=Math.max(metrics.maximumRawSectionXY[0],Math.abs(raw[j]-base[j]));metrics.maximumRawSectionXY[1]=Math.max(metrics.maximumRawSectionXY[1],Math.abs(raw[j+1]-base[j+1]));
    const q0=model(old,i),q1=model(p,i);metrics.maximumPosedSectionXY[0]=Math.max(metrics.maximumPosedSectionXY[0],Math.abs(q1[0]-q0[0]));metrics.maximumPosedSectionXY[1]=Math.max(metrics.maximumPosedSectionXY[1],Math.abs(q1[1]-q0[1]));metrics.maxInwardDisplacement=Math.max(metrics.maxInwardDisplacement,q0[2]-q1[2]);
   }else if(m===2){metrics.maximumRawFineXY[0]=Math.max(metrics.maximumRawFineXY[0],Math.abs(raw[j]-base[j]));metrics.maximumRawFineXY[1]=Math.max(metrics.maximumRawFineXY[1],Math.abs(raw[j+1]-base[j+1]));}
  }
 }
 let offset=0;const pa=next.children[2].geometry.attributes.position.array,pb=baseline.children[2].geometry.attributes.position.array;
 for(const [id,g]of baseline.__guides.slice(0,276).entries()){
  const count=g.kind==='front'?43:g.kind==='curl'?54:g.kind==='back'?34:(g.kind==='inner'||g.kind==='inner-back')?16:28,size=count*58*3;
  if(!isSelected(g,id))for(let i=offset;i<offset+size;i++)if(pa[i]!==pb[i])metrics.protectedFineChanges++;
  offset+=size;
 }
 // Existing crown fibers and the final413 far-temple fibers are independent.
 for(let i=offset;i<offset+2300*54*3;i++)if(pa[i]!==pb[i])metrics.protectedFineChanges++;
 for(let i=pa.length-413*82*3;i<pa.length;i++)if(pa[i]!==pb[i])metrics.protectedFarFineChanges++;
 for(let id=0;id<next.__guides.length;id++){
  const g=next.__guides[id],old=baseline.__guides[id],a=[],b=[];
  for(let j=0;j<=400;j++){
   const t=j/400,p=g.c.getPoint(t),q0=old.c.getPoint(t);metrics.guideSamples++;
   metrics.maxGuideCenterXY=Math.max(metrics.maxGuideCenterXY,Math.abs(p.x-q0.x),Math.abs(p.y-q0.y));
   if(q0.y>=-1.64)assert.deepEqual([p.x,p.y,p.z],[q0.x,q0.y,q0.z]);
   if(q0.y< -1.74&&q0.y> -3.65){a.push(p.z);b.push(q0.z);}
  }
  if(isSelected(g,id)&&a.length){const after=meaningfulTurns(a),before=meaningfulTurns(b);if(after>before)metrics.guideNewTurns.push({guide:id,kind:g.kind,before,after});}
 }
 assert.equal(metrics.nonfinite,0);assert(metrics.maxNormalError<1e-6);assert.equal(metrics.maxGuideCenterXY,0);
 for(const key of['protectedRawPositionChanges','protectedComponentChanges','sideBackFarMassChanges','protectedFineChanges','protectedFarFineChanges'])assert.equal(metrics[key],0,key);
 // Actual folded blouse queries at rebuilt rear-half ring vertices, with no
 // support-grid interpolation. Includes source alpha-zero tips deliberately.
 const clearance={samples:0,newPenetrations:0,worsenedInherited:0,minBefore:Infinity,minAfter:Infinity,maxWorsening:0,examples:[],bySide:[],clearSideGuides:CLEAR_SIDES.map(guide=>({guide,samples:0,minBefore:Infinity,minAfter:Infinity,maxPull:0}))},samples=[];
 const p=next.children[1].geometry.attributes.position,old=baseline.children[1].geometry.attributes.position;
 for(let gid=0;gid<276;gid++){
  if(!isSelected(baseline.__guides[gid],gid))continue;
  for(let j=0;j<=60;j++){
   let before=Infinity,after=Infinity,changed=0,yModel=0;
   for(const k of[0,4,5,6,7]){
    const i=gid*549+j*9+k,a=model(p,i),b=model(old,i);if(b[1]>1.31)continue;yModel=b[1];
    const h0=cloth.sampleBlouseFrontAtXY(bc*b[0]+bs*(b[1]-1),-bs*b[0]+bc*(b[1]-1)+1),h1=cloth.sampleBlouseFrontAtXY(bc*a[0]+bs*(a[1]-1),-bs*a[0]+bc*(a[1]-1)+1);if(!h0||!h1||Math.min(h0.edgeWeight,h1.edgeWeight)<.01)continue;
    const g0=(b[2]-h0.point.z)*h0.normal.z,g1=(a[2]-h1.point.z)*h1.normal.z;clearance.samples++;before=Math.min(before,g0);after=Math.min(after,g1);changed=Math.max(changed,b[2]-a[2]);clearance.minBefore=Math.min(clearance.minBefore,g0);clearance.minAfter=Math.min(clearance.minAfter,g1);
    const sideRecord=clearance.clearSideGuides.find(q=>q.guide===gid);if(sideRecord){sideRecord.samples++;sideRecord.minBefore=Math.min(sideRecord.minBefore,g0);sideRecord.minAfter=Math.min(sideRecord.minAfter,g1);sideRecord.maxPull=Math.max(sideRecord.maxPull,b[2]-a[2]);}
    const newHit=g0>=.001&&g1<-.001,worse=g0<0&&g1<g0-.001;if(newHit)clearance.newPenetrations++;if(worse)clearance.worsenedInherited++;if(newHit||worse){clearance.maxWorsening=Math.max(clearance.maxWorsening,g0-g1);if(clearance.examples.length<10)clearance.examples.push({guide:gid,ring:j,k,before:g0,after:g1});}
   }
   if(Number.isFinite(after))samples.push({side:baseline.__guides[gid].c.getPoint(.75).x<0?'left':'right',y:yModel,before,after,changed});
  }
 }
 for(const side of['left','right'])for(const y of[.9,.6,.3,0,-.3,-.6,-.9]){const a=samples.filter(s=>s.side===side&&Math.abs(s.y-y)<.15);if(a.length)clearance.bySide.push({side,y,rings:a.length,medianBefore:q(a.map(s=>s.before),.5),medianAfter:q(a.map(s=>s.after),.5),medianDepthChange:q(a.map(s=>s.changed),.5)});}
 metrics.clearance=clearance;
 const rays=rayIntervals(next.children[1]),pairs=new Map(),order={rays:0,separatedPairs:0,newOverlaps:0,newFullReversals:0,maxNewOverlap:0,maxFullReversal:0,byScope:{selectedSelected:0,selectedProtected:0,protectedProtected:0},overlapMagnitude:{under005:0,from005to02:0,from02to05:0,over05:0},worst:null,worstReversal:null,affectedPairs:[],examples:[]};
 for(let r=0;r<rays.length;r++){
  const a=baselineRays[r],b=rays[r];if(!a.size||!b.size)continue;order.rays++;
  const ids=Array.from(a.keys());for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
   const i0=ids[i],i1=ids[j];if(!b.has(i0)||!b.has(i1))continue;let a0=a.get(i0),a1=a.get(i1),b0=b.get(i0),b1=b.get(i1),g0=i0,g1=i1;
   if(a0.min>a1.max){[a0,a1]=[a1,a0];[b0,b1]=[b1,b0];[g0,g1]=[g1,g0];}
   if(a1.min-a0.max<.005)continue;order.separatedPairs++;const overlap=b0.max-b1.min;if(overlap>.003){
    const selectedCount=Number(isSelected(baseline.__guides[g0],g0))+Number(isSelected(baseline.__guides[g1],g1)),scope=selectedCount===2?'selectedSelected':selectedCount===1?'selectedProtected':'protectedProtected',reversal=b0.min-b1.max;
    const example={ray:r,x:GRID.x0+(r%GRID.nx+.5)*GRID.dx,y:GRID.y0+(Math.floor(r/GRID.nx)+.5)*GRID.dy,g0,g1,kinds:[baseline.__guides[g0].kind,baseline.__guides[g1].kind],scope,beforeGap:a1.min-a0.max,afterGap:-overlap,fullReversal:Math.max(0,reversal)};
    order.newOverlaps++;order.byScope[scope]++;order.overlapMagnitude[overlap<.005?'under005':overlap<.02?'from005to02':overlap<.05?'from02to05':'over05']++;
    if(overlap>order.maxNewOverlap){order.maxNewOverlap=overlap;order.worst=example;}
    if(reversal>.003){order.newFullReversals++;if(reversal>order.maxFullReversal){order.maxFullReversal=reversal;order.worstReversal=example;}}
    const key=[g0,g1].sort((a,b)=>a-b).join(':'),pair=pairs.get(key)||{guides:[g0,g1],kinds:example.kinds,scope,rayCount:0,fullReversals:0,maxOverlap:0,maxFullReversal:0};
    pair.rayCount++;pair.fullReversals+=Number(reversal>.003);pair.maxOverlap=Math.max(pair.maxOverlap,overlap);pair.maxFullReversal=Math.max(pair.maxFullReversal,reversal);pairs.set(key,pair);
    if(order.examples.length<8)order.examples.push(example);
   }
  }
 }
 order.affectedPairs=Array.from(pairs.values()).sort((a,b)=>b.maxOverlap-a.maxOverlap);order.uniqueAffectedPairs=pairs.size;
 metrics.order=order;metrics.wallMs=performance.now()-t0;cases.push(metrics);console.log(JSON.stringify({strength,fitMs:metrics.fit.fitMs,movement:metrics.fit.movement,maximumRawSectionXY:metrics.maximumRawSectionXY,maximumPosedSectionXY:metrics.maximumPosedSectionXY,maximumRawFineXY:metrics.maximumRawFineXY,protected:[metrics.protectedRawPositionChanges,metrics.sideBackFarMassChanges,metrics.protectedFineChanges,metrics.protectedFarFineChanges],newTurnCount:metrics.guideNewTurns.length,newTurns:metrics.guideNewTurns.slice(0,8),clearance,order:{...order,affectedPairs:order.affectedPairs.slice(0,12)},wallMs:metrics.wallMs}));
 next=null;global.gc?.();
}
const cpu=process.cpuUsage(cpuStart),result={sourceOnly:true,native:false,zeroByteIdentical:true,zeroNoTraversal:true,grid:GRID,sourceHashes:Object.fromEntries(['src/hair-groom.js','src/blouse.js','src/hair-contact.js','review/hair-groom-candidate118.js','review/guide-placement-candidate118.js'].map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),cases,limitations:['Source-only uniform Catmull-Rom and mesh math; native Three/WebGPU remains authoritative.','Finite rear-ring and XY-ray samples do not certify exhaustive surface intersections.','Hair alpha is ignored, including invisible taper-end geometry.','Order compares opaque per-guide intervals only when baseline intervals were fully separated; fine-detail/other-guide order is not exhaustively tested.','Clearance uses the main accepted blouse; separate collar geometry is checked by the native views.'],resources:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024,finalRssMiB:process.memoryUsage().rss/1048576}};
fs.writeFileSync('review/guide-placement118-source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:'completed',cases:cases.length,resources:result.resources}));
