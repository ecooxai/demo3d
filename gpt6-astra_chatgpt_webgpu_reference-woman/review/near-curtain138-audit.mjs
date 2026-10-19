import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {construct138,ids138,selected138,sourceBlouse,helper,cloth} from './near-curtain138-source.mjs';
import {modelPoint} from './lower-clump126-source.mjs';

const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const numbers=a=>{a=a.filter(Number.isFinite).sort((a,b)=>a-b);return{n:a.length,min:a[0]??null,p01:a[Math.floor(a.length*.01)]??null,median:a[Math.floor(a.length*.5)]??null,p90:a[Math.floor(a.length*.9)]??null,max:a.at(-1)??null};};
const meshSignatures=root=>root.children.map(m=>({name:m.name,index:hash(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,hash(a.array)])),map:m.material.map?hash(m.material.map.image.data):null,normalMap:m.material.normalMap?hash(m.material.normalMap.image.data):null}));
const time=performance.now();let legacy=construct138(false,{baseline:true}),legacySignatures=meshSignatures(legacy);console.log(JSON.stringify({stage:'legacy',elapsedMs:performance.now()-time,heapMiB:process.memoryUsage().heapUsed/1048576}));legacy=null;global.gc?.();
let off=construct138(false);assert.deepEqual(meshSignatures(off),legacySignatures);const before=off.children.map(m=>({name:m.name,p:m.geometry.attributes.position.array,n:m.geometry.attributes.normal.array,raw:m.__rawPosition,signature:legacySignatures.find(q=>q.name===m.name)})),oldRibbons=off.__ribbons.map(r=>({guide:r.guide,from:r.from,to:r.to})),offMeta=off.userData;off=null;global.gc?.();
console.log(JSON.stringify({stage:'off-byte-identical',elapsedMs:performance.now()-time,heapMiB:process.memoryUsage().heapUsed/1048576}));
const on=construct138(true),after=meshSignatures(on),groom=on.userData.nearCurtain138;
assert.equal(groom.attachedFibers,2191);assert.equal(groom.selectedGuides.length,67);assert.equal(on.userData.triangles-offMeta.triangles,groom.extraTriangles);
let nonfinite=0,normalError=0,zeroNormals=0,protectedChanges=0,upperChanges=0,totalChanged=0;const motions=[],componentCounts=[],upperExamples=[];
for(let mi=0;mi<on.children.length;mi++){
 const m=on.children[mi],g=m.geometry,a=g.attributes.position,n=g.attributes.normal,old=before[mi];
 if(mi!==2){assert.equal(hash(g.index.array),old.signature.index);for(const k of['color','uv'])assert.equal(hash(g.attributes[k].array),old.signature.attributes[k]);}assert.equal(after[mi].map,old.signature.map);assert.equal(after[mi].normalMap,old.signature.normalMap);
 const moving=mi===1||mi===2,mapping=new Int32Array(a.count);mapping.fill(-1);
 if(mi===2){let of=0,nf=0;for(const r of groom.fineRanges){for(let i=nf;i<r.newFrom;i++)mapping[i]=of+i-nf;for(let j=0;j<r.protectedPrefix;j++)mapping[r.newFrom+j]=r.oldFrom+j;of=r.oldFrom+r.oldCount;nf=r.newFrom+r.newCount;}for(let i=nf;i<a.count;i++)mapping[i]=of+i-nf;}
 let changed=0;
 for(let i=0;i<a.count;i++){
  const j=i*3,oldIndex=mi===2?mapping[i]:i,k=oldIndex*3,allow=moving&&(mi===1?selected138.has(Math.floor(i/549)):oldIndex<0),protectedUpper=oldIndex>=0&&old.raw[k+1]>=-1.05;
  const dp=oldIndex<0?1:Math.hypot(a.array[j]-old.p[k],a.array[j+1]-old.p[k+1],a.array[j+2]-old.p[k+2]),dn=oldIndex<0?0:Math.hypot(n.array[j]-old.n[k],n.array[j+1]-old.n[k+1],n.array[j+2]-old.n[k+2]);
  if(dp||dn){changed++;if(!allow)protectedChanges++;if(protectedUpper){upperChanges++;if(upperExamples.length<20)upperExamples.push({mesh:mi,vertex:i,rawY:old.raw[k+1],dp,dn});}}
  const length=Math.hypot(n.array[j],n.array[j+1],n.array[j+2]);if(length===0)zeroNormals++;else normalError=Math.max(normalError,Math.abs(length-1));if(!Number.isFinite(a.array[j]+a.array[j+1]+a.array[j+2]+length))nonfinite++;
  if(mi===1&&allow&&dp){const p0=modelPoint(...old.p.subarray(j,j+3)),p1=modelPoint(...a.array.subarray(j,j+3));motions.push({dx:p1[0]-p0[0],dy:p1[1]-p0[1],dz:p1[2]-p0[2],y:p1[1]});}
 }
 componentCounts.push({name:m.name,vertices:a.count,triangles:g.index.count/3,changed});totalChanged+=changed;
}
assert.equal(protectedChanges,0);assert.equal(upperChanges,0);assert.equal(nonfinite,0);assert(normalError<1e-6);

console.log(JSON.stringify({stage:'on-emitted',upperChanges,upperExamples,elapsedMs:performance.now()-time}));
const mass=on.children[1].geometry,detail=on.children[2].geometry,mp=mass.attributes.position,fp=detail.attributes.position,idx=mass.index.array,collar=helper.garmentObstacles(sourceBlouse()),bc=Math.cos(.045),bs=Math.sin(.045),bodyCache=new Map();
const body=(x,y)=>{const key=x.toFixed(5)+','+y.toFixed(5);if(bodyCache.has(key))return bodyCache.get(key);const q=cloth.sampleBlouseFrontAtXY(bc*x+bs*(y-1),-bs*x+bc*(y-1)+1);bodyCache.set(key,q);return q;};
const pm=i=>modelPoint(mp.getX(i),mp.getY(i),mp.getZ(i));
const pos=i=>[fp.getX(i),fp.getY(i),fp.getZ(i)];
const average=(a,b)=>a.map((x,i)=>(x+b[i])*.5),mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),length=a=>Math.hypot(...a);
const surface=(guide,t,theta)=>{
 const u=((theta/(Math.PI*2)%1)+1)%1*8,v=Math.max(0,Math.min(1,t))*60,i=Math.min(7,Math.floor(u)),j=Math.min(59,Math.floor(v)),x=u-i,y=v-j,a=guide*549+j*9+i,b=a+1,c=a+9,d=c+1,ids=x+y<=1?[a,c,b]:[b,c,d],w=x+y<=1?[1-x-y,y,x]:[1-y,1-x,x+y-1],pp=ids.map(pm),p=[0,0,0];for(let k=0;k<3;k++)for(let axis=0;axis<3;axis++)p[axis]+=w[k]*pp[k][axis];const n=cross(sub(pp[1],pp[0]),sub(pp[2],pp[0])),l=length(n);return{p,n:n.map(x=>x/l)};
};
const clothGaps=[],leafGaps=[],triangleAreas=[],ringOrientation=[],fineVertexDistances=[],fineChordDistances=[];let massClothPenetrations=0,massLeafPenetrations=0,minGuideDown=Infinity;
for(const gid of ids138){
 const g=on.__guides[gid];let prev=g.c.getPoint(0);for(let j=1;j<=180;j++){const p=g.c.getPoint(j/180);if(p.y<-1.34)minGuideDown=Math.min(minGuideDown,prev.y-p.y);prev=p;}
 for(let ti=gid*960;ti<(gid+1)*960;ti++){
  const aa=idx[ti*3],bb=idx[ti*3+1],cc=idx[ti*3+2],a=pm(aa),b=pm(bb),c=pm(cc),area=length(cross(sub(b,a),sub(c,a)))*.5;triangleAreas.push(area);
  if(on.children[1].__rawPosition[aa*3+1]>=-1.34&&on.children[1].__rawPosition[bb*3+1]>=-1.34&&on.children[1].__rawPosition[cc*3+1]>=-1.34)continue;
  // Every actual triangle centroid plus every third triangle edge midpoint.
  const samples=[a.map((x,i)=>(x+b[i]+c[i])/3)];if(ti%3===0)samples.push(average(a,b),average(b,c),average(c,a));
  for(const p of samples){const q=body(p[0],p[1]),l=collar.get(p[0],p[1]);if(q){const gap=(p[2]-q.point.z)*q.normal.z;clothGaps.push(gap);if(q.edgeWeight>.01&&gap<0)massClothPenetrations++;}if(l){const gap=p[2]-l.z;leafGaps.push(gap);if(gap<0)massLeafPenetrations++;}}
 }
 for(let j=1;j<60;j++){
  const center=pm(gid*549+j*9),prev=pm(gid*549+(j-1)*9),next=pm(gid*549+(j+1)*9),tangent=sub(next,prev),r0=sub(pm(gid*549+j*9+2),center),r1=sub(pm(gid*549+j*9+4),center),n=cross(r0,r1);ringOrientation.push(dot(n,tangent)/(length(n)*length(tangent)||1));
 }
}
for(const r of on.__ribbons){
 const p=r.curve.__surface138;if(!p)continue;
 const get=(t,point)=>{if(p.legacy.getPoint(t).y>-1.97)return null;const theta=Math.acos(Math.max(-1,Math.min(1,p.lane)))*(p.side>0?1:-1)+.018*Math.sin(t*11+p.phase),s=surface(r.guide,t*p.end,theta);return dot(sub(point,s.p),s.n);};
 const samples=r.samples??Array.from({length:r.steps+1},(_,j)=>j/r.steps);for(let j=0;j<samples.length;j++){const t=samples[j],q=modelPoint(...average(pos(r.from+j*2),pos(r.from+j*2+1))),d=get(t,q);if(d!==null)fineVertexDistances.push(d);if(j<samples.length-1){const b=modelPoint(...average(pos(r.from+(j+1)*2),pos(r.from+(j+1)*2+1))),m=get((t+samples[j+1])*.5,average(q,b));if(m!==null)fineChordDistances.push(m);}}
}
const result={native:false,sourceHarness:true,zeroByteIdentical:true,upperExamples,sourceScope:'Actual133 groom, accepted118.5,86.35; exact source collar/facing/placket including width. Native helper includes real seam/button meshes too. Body support is the actual106 analytic source queried at emitted Float32 triangles. Focused sampled checks, not a global continuous triangle intersection proof.',score:77,protectedChanges,upperChanges,totalChanged,nonfinite,normalError,zeroNormals,componentCounts,nearCurtain:groom,motion:{x:numbers(motions.map(p=>p.dx)),y:numbers(motions.map(p=>p.dy)),z:numbers(motions.map(p=>p.dz))},actualTriangles:{clothGap:numbers(clothGaps),leafGap:numbers(leafGaps),massClothPenetrations,massLeafPenetrations,area:numbers(triangleAreas),ringOrientation:numbers(ringOrientation),minimumGuideDownStep:minGuideDown},actualFine:{surfaceVertexDistance:numbers(fineVertexDistances),midChordDistance:numbers(fineChordDistances),vertexBehind:fineVertexDistances.filter(x=>x<-.0003).length,midChordBehind:fineChordDistances.filter(x=>x<-.0003).length},selectedFlyaways:on.__ribbons.filter(r=>selected138.has(r.guide)&&r.steps===24).map(r=>({guide:r.guide,from:r.from,to:r.to})),elapsedMs:performance.now()-time,memoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,+(v/1048576).toFixed(2)]))};
fs.writeFileSync('review/near-curtain138-native-layout.json',JSON.stringify({baselineSourceSHA:crypto.createHash('sha256').update(fs.readFileSync('src/hair-groom.js')).digest('hex'),massVertices:before[1].p.length/3,detailVertices:before[2].p.length/3,ranges:groom.fineRanges.map(r=>[r.oldFrom,r.oldCount,r.protectedPrefix])})+'\n');
fs.writeFileSync('review/near-curtain138-source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,nearCurtain:{...groom,families:undefined,fineRanges:undefined},componentCounts:undefined,selectedFlyaways:result.selectedFlyaways.length}));
