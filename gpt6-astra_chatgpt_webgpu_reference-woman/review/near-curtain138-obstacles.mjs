import fs from 'node:fs';
import {construct138,ids138,helper,THREE} from './near-curtain138-source.mjs';
import {modelPoint} from './lower-clump126-source.mjs';

// One focused actual-triangle check against the protected near side locks.
// It does not claim all hair triangles are globally disjoint: authored cores
// overlap within each family, and their own inherited roots remain protected.
const start=performance.now(),a=construct138(true,{massOnly:true}),p=a.mesh.geometry.attributes.position,index=a.mesh.geometry.index.array,field=helper.triangleField();
const intervals=Array.from({length:12},(_,k)=>({guide:148+k,front:helper.triangleField(),back:helper.triangleField()}));
const point=i=>{const q=modelPoint(p.getX(i),p.getY(i),p.getZ(i));return new THREE.Vector3(...q);};
for(let gid=148;gid<=159;gid++)for(let ti=gid*960;ti<(gid+1)*960;ti++){const q=[point(index[ti*3]),point(index[ti*3+1]),point(index[ti*3+2])],r=intervals[gid-148];field.add(...q,gid);r.front.add(...q,gid);r.back.add(...q.map(p=>new THREE.Vector3(p.x,p.y,-p.z)),gid);}
const inside=(q,r)=>{const front=r.front.get(q.x,q.y),back=r.back.get(q.x,q.y);if(!front||!back)return 0;const lo=-back.z,hi=front.z;return Math.max(0,Math.min(q.z-lo,hi-q.z));};
let actualInside=0,introducedInside=0,worsenedInside=0,maxInsideDepth=0,maxInsideWorsening=0;const actualFailures=[],pairs=new Map();
const oldPoints=new Map(),oldPoint=(gid,offset)=>{
 const key=gid*549+offset;if(oldPoints.has(key))return oldPoints.get(key);
 const g=a.guides[gid].near138.original,j=Math.floor(offset/9),k=offset%9,s=a.guides[gid].near138.baseSection(g,j/60),ang=k*Math.PI/4,q=s.f.p.clone().addScaledVector(s.f.s,g.w*s.shape*Math.cos(ang)*s.undulate).addScaledVector(s.f.n,s.inset+s.depth*s.shape*Math.sin(ang)),m=a.toModel(q,g.deformEar);oldPoints.set(key,m);return m;
};
let samples=0,hits=0,negative=0,newOrWorse=0,minimum=Infinity,maximumWorsening=0,minimumFull=Infinity;const failures=[];
for(const gid of ids138)for(let ti=gid*960;ti<(gid+1)*960;ti++){
 const ids=[index[ti*3],index[ti*3+1],index[ti*3+2]],j=Math.floor((ti-gid*960)/16),sourceY=a.guides[gid].near138.original.c.getPoint((j+.5)/60).y;if(sourceY>=-1.34)continue;
 const points=ids.map(point),weights=[[1/3,1/3,1/3]];if(ti%3===0)weights.push([.5,.5,0],[0,.5,.5],[.5,0,.5]);
 for(const w of weights){const q=new THREE.Vector3();points.forEach((v,i)=>q.addScaledVector(v,w[i]));samples++;const h=field.get(q.x,q.y);if(!h||h.z<=.12)continue;hits++;const gap=q.z-h.z;minimum=Math.min(minimum,gap);if(sourceY<=-1.97)minimumFull=Math.min(minimumFull,gap);for(const interval of intervals){const depth=inside(q,interval);if(depth<=.0003)continue;actualInside++;maxInsideDepth=Math.max(maxInsideDepth,depth);const old=new THREE.Vector3();ids.forEach((id,i)=>old.addScaledVector(oldPoint(gid,id-gid*549),w[i]));const previous=inside(old,interval),worse=depth-previous;maxInsideWorsening=Math.max(maxInsideWorsening,worse);const key=gid+'/'+interval.guide;let pair=pairs.get(key);if(!pair){pair={guide:gid,side:interval.guide,samples:0,introduced:0,worsened:0,maximumDepth:0,maximumWorsening:0};pairs.set(key,pair);}pair.samples++;pair.maximumDepth=Math.max(pair.maximumDepth,depth);pair.maximumWorsening=Math.max(pair.maximumWorsening,worse);if(previous<=.0003){introducedInside++;pair.introduced++;}if(worse>.003){worsenedInside++;pair.worsened++;}if(previous<=.0003||worse>.003)actualFailures.push({guide:gid,side:interval.guide,sourceY,point:[q.x,q.y,q.z],depth,previous,worsening:worse});}
  if(gap>=-.003)continue;negative++;
  const old=new THREE.Vector3();ids.forEach((id,i)=>old.addScaledVector(oldPoint(gid,id-gid*549),w[i]));const oldHit=field.get(old.x,old.y),oldGap=oldHit&&oldHit.z>.12?old.z-oldHit.z:null,worse=oldGap===null?-gap:oldGap-gap;
  maximumWorsening=Math.max(maximumWorsening,worse);if(oldGap===null||worse>.003){newOrWorse++;if(failures.length<24)failures.push({guide:gid,side:h.label,sourceY,point:[q.x,q.y,q.z],gap,oldGap,worsening:worse});}
 }
}
const result={native:false,sourceHarness:true,score:77,samples,hits,minimumSideFrontSeparation:Number.isFinite(minimum)?minimum:null,minimumFullyJoinedSeparation:Number.isFinite(minimumFull)?minimumFull:null,negativeSamples:negative,newOrWorseSamples:newOrWorse,maximumWorsening,failures,closedSideIntervals:{actualInside,introducedInside,worsenedInside,maximumDepth:maxInsideDepth,maximumWorsening:maxInsideWorsening,pairs:Array.from(pairs.values()),worst:actualFailures.sort((a,b)=>b.worsening-a.worsening).slice(0,24)},scope:'Actual emitted Float32 MASS triangles after86 against the actual fixed148–159 MASS triangles, triangle centroids and selected edge midpoints. Compares any negative hits with the corresponding accepted118.5 old section. No global proof of arbitrary inter-family triangle disjointness.',elapsedMs:performance.now()-start,heapMiB:process.memoryUsage().heapUsed/1048576};
fs.writeFileSync('review/near-curtain138-obstacles.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
