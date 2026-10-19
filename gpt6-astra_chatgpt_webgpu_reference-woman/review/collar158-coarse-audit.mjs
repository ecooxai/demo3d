import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {helper158 as H,sourceCollar158,source158Scope,cloth158,Matrix4,object,attach,I,read} from './collar158-source.mjs';

const started=performance.now(),cpu=process.cpuUsage(),hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex'),entries=g=>[...Object.entries(g.attributes),['index',g.index]],fingerprint=g=>Object.fromEntries(entries(g).map(([k,a])=>[k,hash(a.array)]));
const group=sourceCollar158(),targets=group.children.filter(m=>H.COLLAR158_SPEC.meshes.includes(m.name)),originals=targets.map(mesh=>({mesh,geometry:mesh.geometry,side:mesh.name.includes('-left-')?-1:1,hashes:fingerprint(mesh.geometry)})),protectedMeshes=group.children.filter(m=>!H.COLLAR158_SPEC.meshes.includes(m.name)).map(mesh=>({mesh,geometry:mesh.geometry,hashes:fingerprint(mesh.geometry)}));
const poison={traverse(){throw Error('zero traversed');},updateWorldMatrix(){throw Error('zero updated frames');}},zero=H.applyCollarRoll158(poison);assert.equal(zero,H.applyCollarRoll158(poison,{strength:0}));
const metrics=H.applyCollarRoll158(group,{strength:1,retainSourceForQA:true});assert.equal(metrics,H.applyCollarRoll158(group,{strength:1,retainSourceForQA:true}));assert.throws(()=>H.applyCollarRoll158(group,{strength:0}),/fresh blouse/);
const jet=new Float64Array(14),workspace=H.collarWorkspace158(),chart=new Float64Array(7),samples=[],changed=[];let protectedPositionChanges=0,protectedNormalChanges=0,immutableChanges=0,normalError=0,finite=true,totalBytes=0,maxChartSourceError=0,owned=0;
const xyz=(p,i)=>[p.getX(i),p.getY(i),p.getZ(i)],sub=(a,b)=>a.map((v,k)=>v-b[k]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),len=a=>Math.hypot(...a);
let newDegenerate=0,reversed=0,affectedTriangles=0,minAreaRatio=Infinity,maxAreaRatio=0,minTriangleCosine=1,maxChordError=0,minThicknessRatio=Infinity,maxThicknessRatio=0;
for(const r of originals){
 const p=r.geometry.attributes.position,n=r.geometry.attributes.normal,g=r.mesh.geometry,q=g.attributes.position,nn=g.attributes.normal,selected=new Set();
 assert.deepEqual(fingerprint(r.geometry),r.hashes);
 for(const[k,a]of entries(g)){const b=k==='index'?r.geometry.index:r.geometry.getAttribute(k);assert.notEqual(a,b);assert.notEqual(a.array.buffer,b.array.buffer);totalBytes+=a.array.byteLength;if(!['position','normal'].includes(k)&&hash(a.array)!==hash(b.array))immutableChanges++;}
 for(let i=0;i<p.count;i++){
  H.collarMap158(r.side,p.getX(i),p.getY(i),p.getZ(i),jet,workspace);if(jet[12]){selected.add(i);owned++;}else for(let k=0;k<3;k++){if(!Object.is(p.array[i*3+k],q.array[i*3+k]))protectedPositionChanges++;if(!Object.is(n.array[i*3+k],nn.array[i*3+k]))protectedNormalChanges++;}
  if(r.mesh.name.endsWith('spread-collar')&&(g.attributes.uv.getX(i)<=.20||g.attributes.uv.getY(i)<=.20))for(let k=0;k<3;k++){assert(Object.is(p.array[i*3+k],q.array[i*3+k]));assert(Object.is(n.array[i*3+k],nn.array[i*3+k]));}
  if(i%37===0&&jet[12])samples.push({side:r.side,position:xyz(p,i)});
  const l=Math.hypot(nn.getX(i),nn.getY(i),nn.getZ(i));finite&&=Number.isFinite(q.getX(i)+q.getY(i)+q.getZ(i)+l);if(l)normalError=Math.max(normalError,Math.abs(l-1));
 }
 if(r.mesh.name.endsWith('spread-collar')){
  for(let i=0;i<1225;i++){
   const a=len(sub(xyz(p,i),xyz(p,i+1225))),b=len(sub(xyz(q,i),xyz(q,i+1225)));minThicknessRatio=Math.min(minThicknessRatio,b/a);maxThicknessRatio=Math.max(maxThicknessRatio,b/a);
   const uv=r.geometry.attributes.uv;H.collarChart158(r.side,uv.getX(i),uv.getY(i),chart);const raw=cloth158.collarPoint(r.side,uv.getX(i),uv.getY(i));maxChartSourceError=Math.max(maxChartSourceError,Math.abs(chart[1]-raw[1]));
  }
 }
 const index=r.geometry.index.array;
 for(let t=0;t<index.length;t+=3){
  const ids=Array.from(index.subarray(t,t+3));if(ids.every(i=>!selected.has(i)))continue;affectedTriangles++;
  const a=ids.map(i=>xyz(p,i)),b=ids.map(i=>xyz(q,i)),na=cross(sub(a[1],a[0]),sub(a[2],a[0])),nb=cross(sub(b[1],b[0]),sub(b[2],b[0])),la=len(na),lb=len(nb);
  if(la>1e-15){const ratio=lb/la;minAreaRatio=Math.min(minAreaRatio,ratio);maxAreaRatio=Math.max(maxAreaRatio,ratio);if(lb<1e-15)newDegenerate++;else{const cos=dot(na,nb)/(la*lb);minTriangleCosine=Math.min(minTriangleCosine,cos);if(cos<=0)reversed++;}}
  for(const weights of[[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3]]){
   const a0=[0,1,2].map(k=>weights.reduce((s,w,j)=>s+w*a[j][k],0)),b0=[0,1,2].map(k=>weights.reduce((s,w,j)=>s+w*b[j][k],0));H.collarMap158(r.side,...a0,jet,workspace);maxChordError=Math.max(maxChordError,Math.hypot(jet[0]-b0[0],jet[1]-b0[1],jet[2]-b0[2]));
  }
 }
 changed.push({name:r.mesh.name,side:r.side,ownedIndices:[...selected],index:Array.from(index),before:Array.from(p.array),after:Array.from(q.array),normalBefore:Array.from(n.array),normalAfter:Array.from(nn.array)});
}
assert(finite);assert.equal(protectedPositionChanges+protectedNormalChanges+immutableChanges+newDegenerate+reversed,0);assert(normalError<1e-6);assert.equal(totalBytes,314608);assert.equal(totalBytes,metrics.privateAttributeBytes);assert(maxChartSourceError<1e-14);assert(maxChordError<.006,'existing coarse collar cuts do not resolve the bounded roll.');assert(minThicknessRatio>.80&&maxThicknessRatio<1.20,'collar shell thickness distorted.');
for(const r of protectedMeshes){assert.equal(r.mesh.geometry,r.geometry);assert.deepEqual(fingerprint(r.geometry),r.hashes);}

// Independent finite differences of the actual ambient map, including inverse
// source chart, longitudinal return, both width maps and all gates.
let maxJacobianError=0;const a=new Float64Array(14),b=new Float64Array(14),h=1e-6;
for(const s of samples){H.collarMap158(s.side,...s.position,jet,workspace);const J=[[jet[3],jet[4],0],[jet[5],jet[6],0],[jet[7],jet[8],1]];
 for(let k=0;k<3;k++){const p=s.position.slice(),q=p.slice();p[k]+=h;q[k]-=h;H.collarMap158(s.side,...p,a,workspace);H.collarMap158(s.side,...q,b,workspace);for(let row=0;row<3;row++)maxJacobianError=Math.max(maxJacobianError,Math.abs((a[row]-b[row])/(2*h)-J[row][k]));}
}
assert(maxJacobianError<2e-7,'analytic collar map Jacobian disagrees with finite differences.');

// A changed relative frame is rejected before any owner receives a clone.
const bad=sourceCollar158({includeBody:false}),badTarget=bad.children.find(m=>m.name===H.COLLAR158_SPEC.meshes[0]),oldBad=badTarget.geometry;badTarget.matrixWorld=new Matrix4([1,0,0,0,0,1,0,0,0,0,1,0,.01,0,0,1]);assert.throws(()=>H.applyCollarRoll158(bad,{strength:1}),/frame/);assert.equal(badTarget.geometry,oldBad);

const context=[];for(const r of protectedMeshes){const g=r.geometry,p=g.attributes.position,idx=g.index.array,indices=[];for(let t=0;t<idx.length;t+=3){const ids=[idx[t],idx[t+1],idx[t+2]],ys=ids.map(i=>p.getY(i)),xs=ids.map(i=>p.getX(i)),zs=ids.map(i=>p.getZ(i));if(Math.max(...ys)<.42||Math.min(...ys)>1.70||Math.min(...xs)>1.0||Math.max(...xs)<-1.0||Math.max(...zs)<-.05)continue;indices.push(...ids);}context.push({name:r.mesh.name,index:indices,position:Array.from(p.array),normal:Array.from(g.attributes.normal.array)});}
fs.writeFileSync('review/collar158-coarse-data.json',JSON.stringify({scope:source158Scope,spec:H.COLLAR158_SPEC,changed,context}));
const release=H.releaseCollarRoll158(group);assert.equal(release.privateGeometriesDisposed,4);for(const r of originals){assert.equal(r.mesh.geometry,r.geometry);assert.deepEqual(fingerprint(r.geometry),r.hashes);}
const usage=process.cpuUsage(cpu),report={iteration:158,status:'Coarse source shape and normal/resource checks passed; nearby contact and native art pending',scoreUnchanged:78,scope:source158Scope,metrics,protection:{owned,protectedPositionChanges,protectedNormalChanges,immutableChanges,allFourOriginalsUnmodified:true,otherMeshArraysExact:true,allReplacementBuffersPrivate:true,trueZeroNoop:true,sameArgumentIdempotent:true,changedArgumentRejected:true,wrongFrameAtomic:true,release},normal:{samples:samples.length,maxJacobianError,normalError,maxSourceYFormulaError:maxChartSourceError},emittedGeometry:{affectedTriangles,newDegenerate,reversed,minTriangleCosine,minAreaRatio,maxAreaRatio,maxChordError,minThicknessRatio,maxThicknessRatio,noNewTriangles:true},resources:{elapsedMs:performance.now()-started,cpuMs:(usage.user+usage.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024}};
fs.writeFileSync('review/collar158-coarse-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
