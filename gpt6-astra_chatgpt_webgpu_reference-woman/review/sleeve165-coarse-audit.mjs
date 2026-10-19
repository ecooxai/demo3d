import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {helper165 as H,sourceSleeve165,source165Scope,Matrix4} from './sleeve165-source.mjs';
const started=performance.now(),cpu=process.cpuUsage(),hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex'),entries=g=>[...Object.entries(g.attributes),['index',g.index]],fingerprint=g=>Object.fromEntries(entries(g).map(([k,a])=>[k,hash(a.array)]));
const group=sourceSleeve165(),records=group.children.map(mesh=>({mesh,geometry:mesh.geometry,hashes:fingerprint(mesh.geometry),attributes:Object.fromEntries(entries(mesh.geometry)),p:new Float32Array(mesh.geometry.attributes.position.array),n:new Float32Array(mesh.geometry.attributes.normal.array)})),targets=records.filter(r=>H.SLEEVE165_SPEC.meshes.includes(r.mesh.name));
const seamField=H.createSleeveSeamField165(targets.find(r=>r.mesh.name===H.SLEEVE165_SPEC.meshes[0]).geometry,targets.find(r=>r.mesh.name===H.SLEEVE165_SPEC.meshes[1]).geometry),seamJet=new Float64Array(8),seamSamples=[];
const poison={traverse(){throw Error('zero traversal');},updateWorldMatrix(){throw Error('zero matrix');}},zero=H.applySleeveFold165(poison);assert.equal(zero,H.applySleeveFold165(poison,{strength:0}));
const metrics=H.applySleeveFold165(group,{strength:1});assert.equal(metrics,H.applySleeveFold165(group,{strength:1}));assert.throws(()=>H.applySleeveFold165(group,{strength:0}),/fresh blouse/);
const xyz=(a,i)=>Array.from(a.subarray(i*3,i*3+3)),sub=(a,b)=>a.map((v,k)=>v-b[k]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),len=a=>Math.hypot(...a),jet=new Float64Array(7),samples=[],changed=[];
let protectedChanges=0,protectedYChanges=0,immutableChanges=0,normalError=0,geometryOrAttributeIdentityChanges=0,affectedTriangles=0,newDegenerate=0,reversed=0,minAreaRatio=Infinity,maxAreaRatio=0,minTriangleCosine=1,maxChordError=0,maxChordSample=null,maxDisplacement=0,maxSilhouetteX=0,finite=true;
for(const r of records){
 const g=r.mesh.geometry,selected=new Set(),owned=H.SLEEVE165_SPEC.meshes.includes(r.mesh.name);if(g!==r.geometry)geometryOrAttributeIdentityChanges++;
 for(const[k,a]of entries(g)){if(a!==r.attributes[k]||a.array!==r.attributes[k].array)geometryOrAttributeIdentityChanges++;if(!owned||!['position','normal'].includes(k))if(hash(a.array)!==r.hashes[k])immutableChanges++;}
 if(!owned)continue;
 const q=g.attributes.position.array,nn=g.attributes.normal.array,p=r.p,n=r.n;
 for(let i=0;i<p.length/3;i++){
  const v=xyz(p,i),isSeam=r.mesh.name===H.SLEEVE165_SPEC.meshes[1];if(isSeam)seamField.sample(...v,seamJet);else H.sleeveFoldJet165(...v,jet);if(isSeam?seamJet[6]:jet[4]){selected.add(i);if(i%17===0)(isSeam?seamSamples:samples).push(v);}else for(let k=0;k<3;k++)if(!Object.is(q[i*3+k],p[i*3+k])||!Object.is(nn[i*3+k],n[i*3+k]))protectedChanges++;
  if(!Object.is(q[i*3+1],p[i*3+1]))protectedYChanges++;
  finite&&=xyz(q,i).concat(xyz(nn,i)).every(Number.isFinite);const l=len(xyz(nn,i));if(l)normalError=Math.max(normalError,Math.abs(l-1));
  maxDisplacement=Math.max(maxDisplacement,len(sub(xyz(q,i),v)));maxSilhouetteX=Math.max(maxSilhouetteX,Math.abs(q[i*3]-p[i*3]));
 }
 const idx=g.index.array;
 for(let t=0;t<idx.length;t+=3){
  const ids=Array.from(idx.subarray(t,t+3));if(ids.every(i=>!selected.has(i)))continue;affectedTriangles++;
  const a=ids.map(i=>xyz(p,i)),b=ids.map(i=>xyz(q,i)),na=cross(sub(a[1],a[0]),sub(a[2],a[0])),nb=cross(sub(b[1],b[0]),sub(b[2],b[0])),la=len(na),lb=len(nb);
  if(la>1e-15){if(lb<1e-15)newDegenerate++;else{minAreaRatio=Math.min(minAreaRatio,lb/la);maxAreaRatio=Math.max(maxAreaRatio,lb/la);const c=dot(na,nb)/(la*lb);minTriangleCosine=Math.min(minTriangleCosine,c);if(c<=0)reversed++;}}
  for(const w of[[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3]]){
   const v=[0,1,2].map(k=>w.reduce((s,z,j)=>s+z*a[j][k],0)),b0=[0,1,2].map(k=>w.reduce((s,z,j)=>s+z*b[j][k],0)),isSeam=r.mesh.name===H.SLEEVE165_SPEC.meshes[1];let exact;if(isSeam){seamField.sample(...v,seamJet);exact=[v[0]+seamJet[0],v[1],v[2]+seamJet[1]];}else{H.sleeveFoldJet165(...v,jet);exact=v.map((z,k)=>z+H.SLEEVE165_SPEC.direction[k]*jet[0]);}const error=len(sub(exact,b0));if(error>maxChordError){maxChordError=error;maxChordSample={mesh:r.mesh.name,triangle:t/3,indices:ids,point:v};}
  }
 }
 changed.push({name:r.mesh.name,vertices:p.length/3,index:Array.from(idx),before:Array.from(p),after:Array.from(q),normalBefore:Array.from(n),normalAfter:Array.from(nn),ownedIndices:[...selected]});
}
assert(finite);assert.equal(protectedChanges+protectedYChanges+immutableChanges+geometryOrAttributeIdentityChanges+newDegenerate+reversed,0);assert(normalError<1e-6);
let maxGradientError=0;const a=new Float64Array(7),b=new Float64Array(7),e=1e-6;
for(const v of samples){H.sleeveFoldJet165(...v,jet);for(let k=0;k<3;k++){const p=v.slice(),q=v.slice();p[k]+=e;q[k]-=e;H.sleeveFoldJet165(...p,a);H.sleeveFoldJet165(...q,b);maxGradientError=Math.max(maxGradientError,Math.abs((a[0]-b[0])/(2*e)-jet[k+1]));}}
assert(maxGradientError<1e-7,'full sleeve-field derivative mismatch.');
let maxSeamGradientError=0;const sa=new Float64Array(8),sb=new Float64Array(8);
for(const v of seamSamples){seamField.sample(...v,seamJet);for(let k=0;k<3;k++){const p=v.slice(),q=v.slice();p[k]+=e;q[k]-=e;seamField.sample(...p,sa);seamField.sample(...q,sb);maxSeamGradientError=Math.max(maxSeamGradientError,Math.abs((sa[0]-sb[0])/(2*e)-(k===0?seamJet[2]:k===1?seamJet[3]:0)),Math.abs((sa[1]-sb[1])/(2*e)-(k===0?seamJet[4]:k===1?seamJet[5]:0)));}}
assert(maxSeamGradientError<1e-7,'emitted supporting-triangle affine gradient mismatch.');
// One concrete late-input failure and one frame failure must not leave the
// earlier torso staged values committed. No broad parameter/field sweep.
const bad=sourceSleeve165(),badTorso=bad.children.find(m=>m.name===H.SLEEVE165_SPEC.meshes[0]),badSeam=bad.children.find(m=>m.name===H.SLEEVE165_SPEC.meshes[1]),unchanged=fingerprint(badTorso.geometry),frame=badSeam.matrixWorld;
badSeam.matrixWorld=new Matrix4([1,0,0,0,0,1,0,0,0,0,1,0,.001,0,0,1]);assert.throws(()=>H.applySleeveFold165(bad,{strength:1}),/frame/);assert.deepEqual(fingerprint(badTorso.geometry),unchanged);badSeam.matrixWorld=frame;
badSeam.geometry.attributes.normal.array[badSeam.geometry.attributes.normal.array.length-1]=NaN;assert.throws(()=>H.applySleeveFold165(bad,{strength:1}),/nonfinite/);assert.deepEqual(fingerprint(badTorso.geometry),unchanged);
const coarse={scope:source165Scope,spec:H.SLEEVE165_SPEC,changed,context:records.filter(r=>!H.SLEEVE165_SPEC.meshes.includes(r.mesh.name)).map(r=>({name:r.mesh.name,index:Array.from(r.geometry.index.array),position:Array.from(r.geometry.attributes.position.array),normal:Array.from(r.geometry.attributes.normal.array)}))};
fs.writeFileSync('review/sleeve165-coarse-data.json',JSON.stringify(coarse));
const usage=process.cpuUsage(cpu),report={iteration:165,scoreUnchanged:78,status:maxChordError<.007?'Coarse source geometry/normal checks; native appearance and actual fixed-hair contact pending.':'Original sleeve grid needs a broader single roll before native.',scope:source165Scope,metrics,protection:{protectedChanges,protectedYChanges,immutableChanges,geometryOrAttributeIdentityChanges,zeroNoop:true,idempotent:true,changedOptionRejected:true,wrongFrameAtomic:true,lateNonfiniteInputAtomic:true},normal:{samples:samples.length,maxGradientError,seamSamples:seamSamples.length,maxSeamGradientError,normalError},emitted:{affectedTriangles,newDegenerate,reversed,minAreaRatio,maxAreaRatio,minTriangleCosine,maxChordError,maxChordSample,maxDisplacement,maxSilhouetteX},resources:{elapsedMs:performance.now()-started,cpuMs:(usage.user+usage.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024}};
fs.writeFileSync('review/sleeve165-coarse-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
