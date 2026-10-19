import fs from 'node:fs';
import {construct143,selected143,THREE,sourceBlouse,cloth} from './near-curtain143-source.mjs';
import {helper} from './near-curtain138-source.mjs';
import {modelPoint} from './lower-clump126-source.mjs';

// Focused post-emission diagnosis: actual old/new fine chords against their
// corresponding old/new MASS triangles, with opaque-envelope visibility.
const started=performance.now();let old=construct143(false);
const oldMass=old.children[1].geometry,oldFine=old.children[2].geometry.attributes.position,oldRows=new Map(old.__ribbons.map(r=>[r.from,{from:r.from,steps:r.steps}]));
old=null;global.gc?.();const on=construct143(true),mass=on.children[1].geometry,fine=on.children[2].geometry.attributes.position;
const vector=a=>new THREE.Vector3(...a),sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const point=(a,i)=>modelPoint(a.getX(i),a.getY(i),a.getZ(i));
const center=(a,from,j)=>mix(point(a,from+j*2),point(a,from+j*2+1),.5);
const oldAt=(row,t)=>{const v=t*row.steps,j=Math.min(row.steps-1,Math.floor(v));return mix(center(oldFine,row.from,j),center(oldFine,row.from,j+1),v-j);};
const surface=(mesh,guide,t,theta)=>{
 const u=((theta/(2*Math.PI)%1)+1)%1*8,v=Math.max(0,Math.min(1,t))*60,i=Math.min(7,Math.floor(u)),j=Math.min(59,Math.floor(v)),x=u-i,y=v-j,a=guide*549+j*9+i,b=a+1,c=a+9,d=c+1,ids=x+y<=1?[a,c,b]:[b,c,d],w=x+y<=1?[1-x-y,y,x]:[1-y,1-x,x+y-1],pp=ids.map(k=>point(mesh.attributes.position,k)),p=[0,0,0];
 for(let k=0;k<3;k++)for(let axis=0;axis<3;axis++)p[axis]+=w[k]*pp[k][axis];const nn=cross(sub(pp[1],pp[0]),sub(pp[2],pp[0])),l=Math.hypot(...nn);return{p,n:nn.map(x=>x/l)};
};
const ranges=new Map(on.userData.nearCurtain143.fineRanges.map(r=>[r.newFrom,r])),negative=[],transition=[],full=[],newFloating=[],bodyRows=[];
const bc=Math.cos(.045),bs=Math.sin(.045),bodyCache=new Map();
const bodyAt=(p)=>{const key=p[0].toFixed(5)+','+p[1].toFixed(5);let q=bodyCache.get(key);if(q===undefined){q=cloth.sampleBlouseFrontAtXY(bc*p[0]+bs*(p[1]-1),-bs*p[0]+bc*(p[1]-1)+1)??null;bodyCache.set(key,q);}return q;};
for(const r of on.__ribbons){
 if(!selected143.has(r.guide))continue;
 const info=r.curve.__surface143,range=ranges.get(r.from),prior=oldRows.get(range.oldFrom),samples=r.samples??Array.from({length:r.steps+1},(_,j)=>j/r.steps);
 const record=(t,p,kind)=>{
  if(!info)return;const oldY=info.legacy.getPoint(t).y;if(oldY>=-2.15)return;
  const angle=Math.acos(Math.max(-1,Math.min(1,info.lane)))*(info.side>0?1:-1)+.018*Math.sin(t*11+info.phase),s=surface(mass,r.guide,t*info.end,angle),s0=surface(oldMass,r.guide,t*info.end,angle),p0=oldAt(prior,t),d=dot(sub(p,s.p),s.n),d0=dot(sub(p0,s0.p),s0.n),row={guide:r.guide,t,hostT:t*info.end,oldY,kind,point:p,oldPoint:p0,distance:d,previous:d0,delta:d-d0};
  (oldY<=-2.50?full:transition).push(row);if(d<0)negative.push(row);if(oldY>-2.50&&d-d0>.003)newFloating.push(row);
 };
 for(let j=0;j<samples.length;j++){
  const t=samples[j],p=center(fine,r.from,j);record(t,p,'vertex');
  if(j<samples.length-1)record((t+samples[j+1])*.5,mix(p,center(fine,r.from,j+1),.5),'chord');
  // A concrete extra cloth check on all moved flyaways and the newly owned
  // rear fibers, including both emitted ribbon edges. Other base fibers use
  // the already checked MASS clearance and <=.0018 surface-normal stand-off.
  if(r.steps===24||r.guide===154||r.guide===155)for(let edge=0;edge<2;edge++){
   const pp=point(fine,r.from+j*2+edge);if(pp[1]>=.80)continue;const q=bodyAt(pp);if(q&&q.edgeWeight>.01)bodyRows.push({guide:r.guide,t,gap:(pp[2]-q.point.z)*q.normal.z,point:pp});
  }
 }
}
const c45=Math.SQRT1_2,projects={front:v=>new THREE.Vector3(v.x,v.y,v.z),back:v=>new THREE.Vector3(v.x,v.y,-v.z),nearProfile:v=>new THREE.Vector3(-v.z,v.y,-v.x),farProfile:v=>new THREE.Vector3(-v.z,v.y,v.x),nearQuarter:v=>new THREE.Vector3(c45*(v.x+v.z)-.35,v.y,c45*(-v.x+v.z)),farQuarter:v=>new THREE.Vector3(c45*(v.x-v.z),v.y,c45*(v.x+v.z))},fields=Object.fromEntries(Object.keys(projects).map(k=>[k,helper.triangleField()]));
const a=mass.attributes.position,uv=mass.attributes.uv,index=mass.index.array;
const ownFields=new Map([...new Set(negative.map(r=>r.guide))].map(id=>[id,{before:{front:helper.triangleField(),back:helper.triangleField()},after:{front:helper.triangleField(),back:helper.triangleField()}}]));
for(const[id,fields]of ownFields)for(const[key,geometry]of[['before',oldMass],['after',mass]])for(let ti=id*960;ti<(id+1)*960;ti++){
 const ind=geometry.index.array,pp=[ind[ti*3],ind[ti*3+1],ind[ti*3+2]].map(i=>vector(point(geometry.attributes.position,i)));
 fields[key].front.add(...pp,id);fields[key].back.add(...pp.map(p=>new THREE.Vector3(p.x,p.y,-p.z)),id);
}
const interval=(field,p)=>{const f=field.front.get(p[0],p[1]),b=field.back.get(p[0],p[1]);if(!f||!b)return{inside:false,missing:true,depth:null};const depth=Math.min(f.z-p[2],p[2]+b.z);return{inside:depth>0,missing:false,depth};};
for(const r of negative){const f=ownFields.get(r.guide);r.actualHost=interval(f.after,r.point);r.oldHost=interval(f.before,r.oldPoint);}
for(let i=0;i<index.length;i+=3){
 const ids=[index[i],index[i+1],index[i+2]],pp=ids.map(j=>vector(point(a,j)));if(Math.min(...pp.map(p=>p.y))>1.1||Math.max(...pp.map(p=>p.y))<-1.35||Math.max(...ids.map(j=>uv.getY(j)))>.83)continue;
 for(const[k,project]of Object.entries(projects))fields[k].add(...pp.map(project),Math.floor(ids[0]/549));
}
const summarize=a=>{const d=a.map(r=>r.distance).sort((a,b)=>a-b),prior=a.map(r=>r.previous).sort((a,b)=>a-b);return{samples:a.length,minimum:d[0]??null,maximum:d.at(-1)??null,priorMinimum:prior[0]??null,negative:a.filter(r=>r.distance<0).length,negativeBelow0003:a.filter(r=>r.distance<-.0003).length,introducedNegative:a.filter(r=>r.distance<0&&r.previous>=0).length,worsenedBelow0003:a.filter(r=>r.distance<-.0003&&r.delta<-.0003).length,worst:a.slice().sort((a,b)=>a.distance-b.distance).slice(0,8)};};
const visibility=(rows)=>Object.fromEntries(Object.entries(fields).map(([name,field])=>{
 const hits=rows.map(r=>{const p=projects[name](vector(r.point)),h=field.get(p.x,p.y);return{...r,cover:h?h.z-p.z:null,coverGuide:h?.label};}),valid=hits.filter(r=>r.cover!==null).sort((a,b)=>a.cover-b.cover);
 return[name,{samples:hits.length,missing:hits.length-valid.length,minimumCover:valid[0]?.cover??null,uncovered:valid.filter(r=>r.cover<=0).length,nearBoundary:valid.filter(r=>r.cover>0&&r.cover<.001).length,closest:valid.slice(0,10)}];
}));
const hairExposure=visibility(negative),blouse=sourceBlouse({includeBody:true});
blouse.traverse(m=>{if(!m.isMesh)return;const a=m.geometry.attributes.position,ind=m.geometry.index.array,pp=[];for(let i=0;i<a.count;i++)pp.push(new THREE.Vector3(bc*a.getX(i)-bs*(a.getY(i)-1),1+bs*a.getX(i)+bc*(a.getY(i)-1),a.getZ(i)));for(let i=0;i<ind.length;i+=3){const p=[pp[ind[i]],pp[ind[i+1]],pp[ind[i+2]]];if(Math.min(...p.map(v=>v.y))>1.1||Math.max(...p.map(v=>v.y))<-1.35)continue;for(const[k,project]of Object.entries(projects))fields[k].add(...p.map(project),m.name);}});
bodyRows.sort((a,b)=>a.gap-b.gap);
const inside=negative.filter(r=>r.actualHost.inside),introduced=inside.filter(r=>!r.oldHost.inside),result={sourceOnly:true,score:77,transition:summarize(transition),fullyAttached:summarize(full),actualHostIntervals:{negativePlaneSamples:negative.length,inside:inside.length,outside:negative.length-inside.length,introducedInside:introduced.length,maximumInsideDepth:Math.max(0,...inside.map(r=>r.actualHost.depth)),insideExposure:visibility(inside),introducedExposure:visibility(introduced),outsideExamples:negative.filter(r=>!r.actualHost.inside).sort((a,b)=>a.distance-b.distance).slice(0,8)},newFloating:{samples:newFloating.length,maximumIncrease:Math.max(0,...newFloating.map(r=>r.delta)),worst:newFloating.sort((a,b)=>b.delta-a.delta).slice(0,8)},fineBody:{samples:bodyRows.length,minGap:bodyRows[0]?.gap??null,penetrations:bodyRows.filter(r=>r.gap<0).length,worst:bodyRows.slice(0,8)},hairExposure,modelExposure:visibility(negative),elapsedMs:performance.now()-started,heapMiB:process.memoryUsage().heapUsed/1048576,scope:'Fine centers and segment midpoints against actual corresponding old/new host triangle planes, then exact per-host closed front/back triangle-ray intervals for every negative-plane sample. A negative value is reported with its actual sign, not accepted by a pixel-size tolerance. An infinite triangle-plane extension is distinguished from inside a closed host. Visibility uses only fully opaque existing MASS triangles (UVv<=.83); model exposure adds exact opaque blouse geometry. Counts are sampled points, not a global intersection proof. The focused cloth check includes both ribbon edges of owned rear companions and all moved flyaways.'};
fs.writeFileSync('review/near-curtain143-fine-transition.json',JSON.stringify(result,null,2)+'\n');
const compactViews=views=>Object.fromEntries(Object.entries(views).map(([k,v])=>[k,{...v,closest:v.closest.slice(0,1)}]));
console.log(JSON.stringify({...result,actualHostIntervals:{...result.actualHostIntervals,outsideExamples:result.actualHostIntervals.outsideExamples.slice(0,2),insideExposure:compactViews(result.actualHostIntervals.insideExposure),introducedExposure:compactViews(result.actualHostIntervals.introducedExposure)},transition:{...result.transition,worst:result.transition.worst.slice(0,2)},fullyAttached:{...result.fullyAttached,worst:result.fullyAttached.worst.slice(0,2)},newFloating:{...result.newFloating,worst:result.newFloating.worst.slice(0,2)},fineBody:{...result.fineBody,worst:result.fineBody.worst.slice(0,1)},hairExposure:undefined,modelExposure:undefined}));
