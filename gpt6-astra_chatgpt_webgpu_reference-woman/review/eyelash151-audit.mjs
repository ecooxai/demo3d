import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sourceHead151,source151Interpretation,Matrix4,mul,point} from './eyelash151-source.mjs';
import {applyEyelash151,releaseEyelash151,lashParts151,EYELASH151_SPEC} from './eyelash-candidate151.js';
import {createLashSweep151,V151,smooth151} from './eyelash-sweep151.js';
import {inspectEyelashes151,worldPositions151} from './eyelash151-geometry-audit.js';

const {add,sub,scale,dot,cross}=V151,norm=a=>Math.hypot(...a),unit=a=>scale(a,1/norm(a));
const hash=a=>createHash('sha256').update(ArrayBuffer.isView(a)?new Uint8Array(a.buffer,a.byteOffset,a.byteLength):a).digest('hex');
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const xyz=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)];
const snapshots=head=>{const out=[];head.traverse(mesh=>{if(mesh.isMesh)out.push({mesh,geometry:mesh.geometry,material:mesh.material,metadata:JSON.stringify(mesh.geometry.userData),attributes:entries(mesh.geometry).map(([key,a])=>({key,a,array:a.array,version:a.version,hash:hash(a.array)}))});});return out;};
function unchanged(rows){for(const r of rows){assert.equal(r.mesh.material,r.material);assert.equal(JSON.stringify(r.geometry.userData),r.metadata);for(const q of r.attributes){assert.equal(q.key==='index'?r.geometry.index:r.geometry.getAttribute(q.key),q.a);assert.equal(q.a.array,q.array);assert.equal(q.a.version,q.version);assert.equal(hash(q.array),q.hash);}}}
const zeroHead={traverse(){throw Error('OFF traversed');},updateWorldMatrix(){throw Error('OFF updated matrices');}};
assert.equal(applyEyelash151(zeroHead,{strength:0}),applyEyelash151(zeroHead,{strength:0}));
const started=performance.now(),head=sourceHead151(),rows=snapshots(head),allBuffers=new Set(rows.flatMap(r=>r.attributes.map(q=>q.array.buffer))),materials=rows.map(r=>r.material);
const metrics=applyEyelash151(head,{strength:1,retainSourceForQA:true});
assert.equal(applyEyelash151(head,{strength:1,retainSourceForQA:true}),metrics);unchanged(rows);
let exactRootVertices=0,privateBytes=0,privateBuffers=0;
for(const r of rows){
 if(r.mesh.name!=='individual-eyelashes'){assert.equal(r.mesh.geometry,r.geometry);continue;}
 assert.notEqual(r.mesh.geometry,r.geometry);
 for(const[key,a]of entries(r.mesh.geometry)){
  assert(!allBuffers.has(a.array.buffer));privateBuffers++;privateBytes+=a.array.byteLength;
  if(!['position','normal'].includes(key))assert.equal(hash(a.array),hash((key==='index'?r.geometry.index:r.geometry.getAttribute(key)).array));
 }
 for(const part of lashParts151())for(let k=0;k<4;k++){
  const i=part.vertex+k;for(const name of['position','normal'])for(let c=0;c<3;c++)assert(Object.is(r.geometry.getAttribute(name).array[i*3+c],r.mesh.geometry.getAttribute(name).array[i*3+c]));exactRootVertices++;
 }
}
assert.equal(exactRootVertices,320);assert.equal(privateBytes,81744);assert.equal(privateBuffers,8);
const geometry=inspectEyelashes151(rows);
assert(geometry.orientation.every(r=>r.newDegenerate===0&&r.newRadialReversals===0));
assert(geometry.ocularContacts.every(r=>r.rootStrip.newContactPairs===0&&r.distal.newContactPairs===0));

// Derivative checks use four actual accepted lash ring sets. The independent
// finite differences test the declared sweep; they are distinct from the
// real-triangle orientation and inherited ocular contact checks above.
const derivative={fibers:0,samples:0,maximumSourceDerivativeError:0,maximumTargetDerivativeError:0,maximumNormalCovectorResidual:0,minimumFiniteDifferenceNormalDot:1,maximumDenseDisplacement:0,maximumBoundExcess:0,maximumRootJetError:0};
for(const r of rows.filter(r=>r.mesh.name==='individual-eyelashes'))for(const part of[lashParts151()[13],lashParts151()[34]]){
 const matrix=mul(head.matrixWorld.clone().invert(),r.mesh.matrixWorld),p=r.geometry.getAttribute('position'),centers=[],axesA=[],axesB=[];
 for(let j=0;j<=part.segments;j++){const ring=[0,1,2].map(k=>point(matrix,xyz(p,part.vertex+j*4+k))),center=scale(add(add(ring[0],ring[1]),ring[2]),1/3);centers.push(center);axesA.push(sub(ring[0],center));axesB.push(scale(sub(ring[1],ring[2]),1/Math.sqrt(3)));}
 const sweep=createLashSweep151({centers,axesA,axesB,E:[0,part.upper?1:-1,0],T:[r.mesh.parent.name==='left-eye'?-1:1,0,0],upper:part.upper,side:r.mesh.parent.name==='left-eye'?-1:1,index:part.index}),bounds=sweep.bounds();derivative.fibers++;
 const root=sweep.sample(0,.4,.3);for(let j=0;j<3;j++)derivative.maximumRootJetError=Math.max(derivative.maximumRootJetError,norm(sub(root.oldColumns[j],root.newColumns[j])));assert.equal(root.q,1);assert.equal(sweep.sample(1,.4,.3).q,.08);
 for(let j=1;j<48;j++)for(const theta of[.2,1.6,3.8]){
  const u=j/48,radius=.9,r0=radius*Math.cos(theta),s0=radius*Math.sin(theta),sample=sweep.sample(u,r0,s0),step=1e-6,old=[],next=[];
  for(let axis=0;axis<3;axis++){
   const plus=[u,r0,s0],minus=plus.slice();plus[axis]+=step;minus[axis]-=step;const a=sweep.sample(...plus),b=sweep.sample(...minus);
   old.push(scale(sub(a.source,b.source),.5/step));next.push(scale(sub(a.position,b.position),.5/step));
   derivative.maximumSourceDerivativeError=Math.max(derivative.maximumSourceDerivativeError,norm(sub(old[axis],sample.oldColumns[axis])));
   derivative.maximumTargetDerivativeError=Math.max(derivative.maximumTargetDerivativeError,norm(sub(next[axis],sample.newColumns[axis])));
  }
  const n0=unit(cross(old[0],add(scale(old[1],-s0),scale(old[2],r0)))),n1=sample.normal(n0),finite=unit(cross(next[0],add(scale(next[1],-s0),scale(next[2],r0))));
  derivative.minimumFiniteDifferenceNormalDot=Math.min(derivative.minimumFiniteDifferenceNormalDot,dot(unit(n1),finite));
  for(let k=0;k<3;k++)derivative.maximumNormalCovectorResidual=Math.max(derivative.maximumNormalCovectorResidual,Math.abs(dot(sample.newColumns[k],n1)-dot(sample.oldColumns[k],n0)));
  derivative.samples++;
 }
 for(let j=0;j<=160;j++)for(let k=0;k<12;k++){const sample=sweep.sample(j/160,Math.cos(k*Math.PI/6),Math.sin(k*Math.PI/6)),d=norm(sample.delta);derivative.maximumDenseDisplacement=Math.max(derivative.maximumDenseDisplacement,d);derivative.maximumBoundExcess=Math.max(derivative.maximumBoundExcess,d-bounds.surfaceDisplacementUpper);}
}
assert(derivative.maximumSourceDerivativeError<1e-7&&derivative.maximumTargetDerivativeError<1e-7&&derivative.maximumNormalCovectorResidual<1e-12&&derivative.minimumFiniteDifferenceNormalDot>1-1e-7&&derivative.maximumBoundExcess===0&&derivative.maximumRootJetError<1e-12);
assert(smooth151(0).d===0&&smooth151(1).d===0&&smooth151(0).dd===0&&smooth151(1).dd===0);

// Same physical accepted eye in a translated, sheared, nonuniform mesh frame.
// Float32 re-expression changes rounding; no exact-byte equivalence is claimed.
const alternate=sourceHead151(new Matrix4([.98,.035,-.06,0,-.025,1.06,.035,0,.02,-.01,.94,0,.09,-.03,.025,1])),alternateRows=snapshots(alternate),alternateMetrics=applyEyelash151(alternate,{strength:1,retainSourceForQA:true});
let maximumWorldPositionFrameDifference=0,maximumWorldNormalFrameDifference=0;
const worldNormal=(mesh,i)=>{const inverse=mesh.matrixWorld.clone().invert().elements,n=xyz(mesh.geometry.getAttribute('normal'),i);return unit([dot([inverse[0],inverse[1],inverse[2]],n),dot([inverse[4],inverse[5],inverse[6]],n),dot([inverse[8],inverse[9],inverse[10]],n)]);};
for(const r of rows.filter(r=>r.mesh.name==='individual-eyelashes')){
 const other=alternateRows.find(q=>q.mesh.name===r.mesh.name&&q.mesh.parent.name===r.mesh.parent.name).mesh,a=worldPositions151(r.mesh.geometry,r.mesh.matrixWorld),b=worldPositions151(other.geometry,other.matrixWorld);
 for(let i=0;i<a.length/3;i++){maximumWorldPositionFrameDifference=Math.max(maximumWorldPositionFrameDifference,Math.hypot(...[0,1,2].map(k=>a[i*3+k]-b[i*3+k])));maximumWorldNormalFrameDifference=Math.max(maximumWorldNormalFrameDifference,norm(sub(worldNormal(r.mesh,i),worldNormal(other,i))));}
}
assert(maximumWorldPositionFrameDifference<1e-6&&maximumWorldNormalFrameDifference<.003);unchanged(alternateRows);
const privateGeometry=rows.filter(r=>r.mesh.geometry!==r.geometry).map(r=>r.mesh.geometry),disposals=[];for(const g of privateGeometry)g.dispose=()=>disposals.push(g);
const cleanup=releaseEyelash151(head),alternateCleanup=releaseEyelash151(alternate);
assert.equal(cleanup.privateGeometriesDisposed,2);assert.equal(disposals.length,2);assert(rows.every(r=>r.mesh.geometry===r.geometry));unchanged(rows);unchanged(alternateRows);assert.deepEqual(rows.map(r=>r.mesh.material),materials);
assert.equal(releaseEyelash151(head).released,false);
const files=['src/main.js','src/face.js','src/eye-contour.js','src/eye-contour-field.js','src/eye-contour-config.json','review/eyelash-candidate151.js','review/eyelash-sweep151.js','review/eyelash151-source.mjs','review/eyelash151-geometry-audit.js','review/eyelash151-audit.mjs','review/near-ear144-geometry.mjs'];
const manifest=Object.fromEntries(files.map(file=>{const b=fs.readFileSync(file);return[file,{bytes:b.length,sha256:hash(b)}];}));
const report={candidate:151,status:'Local source, derivative and bounded contact checks passed; native art pending',scoreUnchanged:78,spec:EYELASH151_SPEC,sourceInterpretation:source151Interpretation,files:manifest,metrics,geometry,derivative,
 frameConjugacy:{maximumWorldPositionFrameDifference,maximumWorldNormalFrameDifference,alternateHelperMs:alternateMetrics.elapsedMs},
 preservation:{exactRootVertices,privateBytes,privateBuffers,sourceArraysAndVersionsExact:true,unrelatedGeometryBindingsExact:true,materialBindingsExact:true,topologyAndUVBytesExact:true,cleanup,alternateCleanup,sourceReferencesRestored:true},
 resourceInterpretation:'81,744 bytes replace existing lash buffers in the local Uint16 fixture. Native WebGPU can widen indices, making the private total 97,440 bytes. QA retains originals for restoration; production drops helper-owned originals before first upload. These are replacement totals, not equal permanent increases. No material/map/draw/per-frame allocation.',
 limitations:['The local fixture omits margins, menisci, glints, brows, ears and the groom. Native checks use the complete actual149 scene; source contact findings do not establish native clearance.','Root strips have inherited lid intersections (524 pair identities before,522 after here). Their root-ring vertices are exact; the rest of each first strip can move. No new root/distal ocular pair appears in this fixture.','The radial-section determinant bound is exact in the radial disk at sampled longitudinal cuts. It is not a global interval proof of the volume Jacobian.','Tip rings remain open and nonzero at 8% radius. No topology or cap was added.','Source safety and numeric controls do not establish artistic gain.'],elapsedMs:performance.now()-started,peakRSSMiB:process.resourceUsage().maxRSS/1024};
fs.writeFileSync('review/eyelash151-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidate:151,status:report.status,helperMs:metrics.elapsedMs,maxContinuousDisplacement:metrics.maximumContinuousDisplacementUpper,maxLengthRatio:metrics.maximumLengthRatioUpper,exactRootVertices,privateBytes,derivative,frameConjugacy:report.frameConjugacy,contactNewPairs:geometry.ocularContacts.reduce((s,r)=>s+r.rootStrip.newContactPairs+r.distal.newContactPairs,0),cleanup,elapsedMs:report.elapsedMs,peakRSSMiB:report.peakRSSMiB}));
