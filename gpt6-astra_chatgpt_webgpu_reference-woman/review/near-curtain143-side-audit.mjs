import fs from 'node:fs';
import {construct143,ids143,THREE,sourceBlouse} from './near-curtain143-source.mjs';
import {helper} from './near-curtain138-source.mjs';
import {modelPoint} from './lower-clump126-source.mjs';

// Actual emitted Float32 triangles. The two newly owned rear companions are
// checked separately; changing their ownership does not erase intersections.
const start=performance.now(),old=construct143(false,{baseline:true,massOnly:true}),on=construct143(true,{massOnly:true});
const mesh=on.mesh.geometry,index=mesh.index.array,oldIndex=old.mesh.geometry.index.array;
const positions=g=>{const p=g.attributes.position,a=new Float64Array(p.count*3);for(let i=0;i<p.count;i++)a.set(modelPoint(p.getX(i),p.getY(i),p.getZ(i)),i*3);return a;};
const before=positions(old.mesh.geometry),after=positions(mesh),point=(a,i)=>new THREE.Vector3(a[i*3],a[i*3+1],a[i*3+2]);
const records=Array.from({length:12},(_,k)=>({id:148+k,kind:k===6||k===7?'rear-companion':'fixed',before:{front:helper.triangleField(),back:helper.triangleField()},after:{front:helper.triangleField(),back:helper.triangleField()}}));
for(const r of records)for(let ti=r.id*960;ti<(r.id+1)*960;ti++)for(const [name,a,ind] of[['before',before,oldIndex],['after',after,index]]){
 const p=[point(a,ind[ti*3]),point(a,ind[ti*3+1]),point(a,ind[ti*3+2])];r[name].front.add(...p,r.id);r[name].back.add(...p.map(v=>new THREE.Vector3(v.x,v.y,-v.z)),r.id);
}
const depth=(q,r)=>{const f=r.front.get(q.x,q.y),b=r.back.get(q.x,q.y);if(!f||!b)return 0;return Math.max(0,Math.min(q.z+b.z,f.z-q.z));};
const tally=()=>({samples:0,inside:0,introduced:0,worsened:0,maximumDepth:0,maximumNewDepth:0,maximumWorsening:0,fullyJoinedInside:0,fullyJoinedIntroduced:0,pairs:new Map(),examples:[]});
const total={fixed:tally(),rearCompanions:tally(),union:tally()};
const account=(out,active,prior,q,p,gid,sourceY,fullyJoined)=>{
 out.samples++;const current=Math.max(0,...active.map(r=>depth(q,r.after))),previous=Math.max(0,...prior.map(r=>depth(p,r.before)));if(current<=.0003)return;
 out.inside++;out.maximumDepth=Math.max(out.maximumDepth,current);if(fullyJoined)out.fullyJoinedInside++;
 const isNew=previous<=.0003,worse=current-previous;
 if(isNew){out.introduced++;out.maximumNewDepth=Math.max(out.maximumNewDepth,current);if(fullyJoined)out.fullyJoinedIntroduced++;}
 if(worse>.003){out.worsened++;out.maximumWorsening=Math.max(out.maximumWorsening,worse);}
 if(isNew||worse>.003){
  const hits=active.map(r=>({id:r.id,depth:depth(q,r.after)})).filter(r=>r.depth>.0003);
  for(const h of hits){const key=gid+'/'+h.id;let pair=out.pairs.get(key);if(!pair){pair={guide:gid,obstacle:h.id,samples:0,maximumDepth:0};out.pairs.set(key,pair);}pair.samples++;pair.maximumDepth=Math.max(pair.maximumDepth,h.depth);}
  out.examples.push({guide:gid,sourceY,point:[q.x,q.y,q.z],depth:current,previous,worsening:worse,fullyJoined,hits});
 }
};
for(const gid of ids143)for(let ti=gid*960;ti<(gid+1)*960;ti++){
 const ids=[index[ti*3],index[ti*3+1],index[ti*3+2]],j=Math.floor((ti-gid*960)/16),sourceY=on.guides[gid].near143.original.c.getPoint((j+.5)/60).y;if(sourceY>=-2.15)continue;
 const weights=[[1/3,1/3,1/3]];if(ti%3===0)weights.push([.5,.5,0],[0,.5,.5],[.5,0,.5]);
 const relevant=records.filter(r=>r.id!==gid),fixed=relevant.filter(r=>r.kind==='fixed'),rear=relevant.filter(r=>r.kind==='rear-companion');
 for(const w of weights){
  const q=new THREE.Vector3(),p=new THREE.Vector3();for(let i=0;i<3;i++){q.addScaledVector(point(after,ids[i]),w[i]);p.addScaledVector(point(before,ids[i]),w[i]);}
  const fullyJoined=q.y<=.05-.015;
  account(total.fixed,fixed,fixed,q,p,gid,sourceY,fullyJoined);
  account(total.rearCompanions,rear,rear,q,p,gid,sourceY,fullyJoined);
  account(total.union,relevant,relevant,q,p,gid,sourceY,fullyJoined);
 }
}
// A conservative source visibility diagnosis uses only existing, fully opaque
// MASS triangles (UV v<=.83, before any authored alpha-tip release). No new
// surface or tolerance is used to make the intersection counts disappear.
const c45=Math.SQRT1_2,projects={front:v=>new THREE.Vector3(v.x,v.y,v.z),back:v=>new THREE.Vector3(v.x,v.y,-v.z),nearProfile:v=>new THREE.Vector3(-v.z,v.y,-v.x),farProfile:v=>new THREE.Vector3(-v.z,v.y,v.x),nearQuarter:v=>new THREE.Vector3(c45*(v.x+v.z)-.35,v.y,c45*(-v.x+v.z)),farQuarter:v=>new THREE.Vector3(c45*(v.x-v.z),v.y,c45*(v.x+v.z))};
const fields=Object.fromEntries(Object.keys(projects).map(name=>[name,helper.triangleField()])),uv=mesh.attributes.uv;
for(let ti=0;ti<index.length/3;ti++){
 const ids=[index[ti*3],index[ti*3+1],index[ti*3+2]],p=ids.map(i=>point(after,i));
 if(Math.min(...p.map(v=>v.y))>1.10||Math.max(...p.map(v=>v.y))<0||Math.max(...ids.map(i=>uv.getY(i)))>.83)continue;
 const gid=Math.floor(ids[0]/549);for(const[name,project]of Object.entries(projects))fields[name].add(...p.map(project),gid);
}
const newPoints=total.union.examples.filter(p=>p.previous<=.0003),exposure={};
const visibility=(out)=>{for(const[name,field]of Object.entries(fields)){
 const rows=newPoints.map(p=>{const q=projects[name](new THREE.Vector3(...p.point)),h=field.get(q.x,q.y);return{guide:p.guide,point:p.point,coverGuide:h?.label??null,coverGap:h?h.z-q.z:null,intersectionDepth:p.depth};});
 const valid=rows.filter(r=>r.coverGap!==null).sort((a,b)=>a.coverGap-b.coverGap),values=valid.map(r=>r.coverGap);
 out[name]={samples:rows.length,missing:rows.length-valid.length,minimumCover:values[0]??null,medianCover:values[Math.floor(values.length*.5)]??null,within005:valid.filter(r=>r.coverGap<=.005).length,within010:valid.filter(r=>r.coverGap<=.010).length,externalCoverAtLeast010:valid.filter(r=>r.coverGap>.010&&r.coverGuide!==r.guide&&r.coverGuide!==154&&r.coverGuide!==155).length,closest:valid.slice(0,10)};
}};
visibility(exposure);
// The far profile can also be occluded by the actual opaque torso. Keep that
// evidence separate from the hair-only result instead of silently assuming it.
const blouse=sourceBlouse({includeBody:true}),br=Math.cos(.045),bs=Math.sin(.045);
blouse.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position,ind=m.geometry.index.array,points=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);points.push(new THREE.Vector3(br*x-bs*(y-1),1+bs*x+br*(y-1),z));}
 for(let i=0;i<ind.length;i+=3){const tri=[points[ind[i]],points[ind[i+1]],points[ind[i+2]]];if(Math.min(...tri.map(v=>v.y))>1.1||Math.max(...tri.map(v=>v.y))<0)continue;for(const[name,project]of Object.entries(projects))fields[name].add(...tri.map(project),m.name);}
});
const modelExposure={};visibility(modelExposure);
for(const s of Object.values(total)){s.pairs=Array.from(s.pairs.values()).sort((a,b)=>b.maximumDepth-a.maximumDepth);s.examples.sort((a,b)=>b.worsening-a.worsening);s.examples=s.examples.slice(0,30);}
const result={native:false,sourceOnly:true,score:77,ownership:ids143,rearCompanions:[154,155],fixedSideGuides:records.filter(r=>r.kind==='fixed').map(r=>r.id),protectedPin:-2.15,fullJoin:-2.90,tests:total,exposure,modelExposure,elapsedMs:performance.now()-start,heapMiB:process.memoryUsage().heapUsed/1048576,scope:'Actual emitted MASS triangle centroids and selected edge midpoints against actual front/back ray intervals. Old sample positions and old obstacle geometry both come from accepted133. Inside counts are samples, not unique intersection components; no global triangle-disjointness proof. Hair-only exposure includes fully opaque existing MASS triangles; modelExposure additionally includes the exact192x112 torso positions and collar/facing/placket triangles. No face/fine occlusion or native lighting acceptance is claimed.'};
fs.writeFileSync('review/near-curtain143-side-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,tests:Object.fromEntries(Object.entries(total).map(([k,v])=>[k,{...v,pairs:v.pairs.slice(0,4),examples:v.examples.slice(0,2)}])),exposure:Object.fromEntries(Object.entries(exposure).map(([k,v])=>[k,{...v,closest:v.closest.slice(0,1)}])),modelExposure:Object.fromEntries(Object.entries(modelExposure).map(([k,v])=>[k,{...v,closest:v.closest.slice(0,1)}]))}));
