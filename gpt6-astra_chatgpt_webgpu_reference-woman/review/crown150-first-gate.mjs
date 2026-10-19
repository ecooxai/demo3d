import fs from 'node:fs';
import crypto from 'node:crypto';
import {sourceGroom150,preparedHead150,front150} from './crown150-source.mjs';
import {focusedChecks150} from './crown150-focused-checks.mjs';
const sha=a=>crypto.createHash('sha256').update(Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex'),start=performance.now();
const snapshot=root=>{const list=[];root.traverse(m=>{if(m.isMesh)list.push({name:m.name,attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,sha(a.array)])),index:sha(m.geometry.index.array)});});return list;};
let baseline=sourceGroom150({baseline:true,capture:false});const baselineSnapshot=snapshot(baseline);baseline=null;global.gc?.();
const hair=sourceGroom150(),head=preparedHead150(),before=snapshot(hair),headBefore=snapshot(head),userDataBefore=hair.userData;
if(JSON.stringify(before)!==JSON.stringify(baselineSnapshot))throw Error('Optional150 capture changed accepted133 geometry.');
const zero=front150.applyFrontRoot150(hair,null,{strength:0});if(zero!==front150.applyFrontRoot150(null,null,{strength:0})||hair.children.length!==5)throw Error('150 zero constructed new state.');
const metrics=front150.applyFrontRoot150(hair,head,{strength:1}),qa=front150.getFrontRoot150QA(hair),protectedChanges=[];
for(let i=0;i<5;i++)for(const[k,a]of Object.entries(hair.children[i].geometry.attributes))if(before[i].attributes[k]!==sha(a.array))protectedChanges.push(hair.children[i].name+'/'+k);
if(protectedChanges.length)throw Error('Protected150 source attributes changed: '+protectedChanges.join(', '));
const checks=focusedChecks150(hair,head,qa,front150),idempotent=metrics===front150.applyFrontRoot150(hair,head,{strength:1});
const isolation=front150.setCoarseIsolation150(hair),coarseTriangles=hair.userData.triangles,isolationIdempotent=isolation===front150.setCoarseIsolation150(hair),isolationIndexHashes=front150.getFrontRoot150QA(hair).isolation.changes.map(c=>({mesh:c.mesh.name,before:sha(c.old.array),coarse:sha(c.next.array)}));
front150.releaseFrontRoot150(hair);
const restoration={allGeometryExact:JSON.stringify(snapshot(hair))===JSON.stringify(before),originalUserDataReference:hair.userData===userDataBefore,headGeometryExact:JSON.stringify(snapshot(head))===JSON.stringify(headBefore),originalMeshCount:hair.children.length,idempotent,isolationIdempotent};
const report={iteration:150,stage:'source coarse gate; native art pending',metrics,protectedAttributeChanges:protectedChanges,captureMatchesAccepted133:true,zeroNoConstruction:true,isolation,isolationIndexHashes,coarseTriangles,checks,restoration,
 routes:qa.application.routes.map(r=>({group:r.group,k:r.k,family:r.family,member:r.member,u:r.u,R:r.R,A:r.A,B:r.B,C:r.C,bodyEntry:r.entry,rootMove:r.rootMove,bodyLift:r.bodyLift,length:r.total,cuts:r.cuts,sourceCut:r.cut,sourceCutArcFraction:r.cutArc/r.length})),
 elapsedMs:performance.now()-start,memoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,v/1048576])),maxRssMiB:process.resourceUsage().maxRSS/1024,
 qualifications:['Local harness uses actual source scalp and eye grids, actual115 ear mapping, accepted pose/balance and147 field. It omits unrelated brows/glints and reference RGB bakes. Native actual scene remains required.','No fine population has been rebuilt. The same old upstream ranges are hidden in the native pair.']};
fs.writeFileSync('review/crown150-first-gate.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,isolation:isolation.hidden.map(h=>({mesh:h.mesh,removedTriangles:h.removedTriangles})),checks:{...checks,cutCoverage:checks.cutCoverage.map(c=>({...c,uncoveredFacing:c.uncoveredFacing.length}))},routes:undefined}));
if(!restoration.allGeometryExact||!restoration.headGeometryExact||!restoration.originalUserDataReference||!idempotent||!isolationIdempotent||checks.supportChecks.chordMidpoints.penetrations||checks.supportChecks.triangleCentroids.penetrations||checks.joins.nonDescendingReleasedSamples)throw Error('150 focused source gate failed.');
