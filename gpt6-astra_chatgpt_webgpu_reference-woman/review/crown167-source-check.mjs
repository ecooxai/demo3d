import fs from 'node:fs';
import crypto from 'node:crypto';
import {THREE,front167,sourceGroom167,prepareCrownLayout167,preparedHead167} from './crown167-source.mjs';
const hash=a=>crypto.createHash('sha256').update(ArrayBuffer.isView(a)?Buffer.from(a.buffer,a.byteOffset,a.byteLength):a).digest('hex');
const paths=['src/main.js','src/hair-groom.js','review/front-locks-candidate167.js','review/hair-groom-candidate167.js','review/hair-color-candidate167.js','review/crown167-source.mjs','review/crown167-source-check.mjs'];
const report={iteration:167,acceptedIteration:164,acceptedScore:78,stage:'Source feasibility only; native visual gate pending',files:Object.fromEntries(paths.map(p=>{const b=fs.readFileSync(p);return[p,{bytes:b.length,sha256:hash(b)}];})),checks:{},status:'Running'};
const save=()=>fs.writeFileSync('review/crown167-source-check.json',JSON.stringify(report,null,2)+'\n');
function snapshot(g){const meshes=[];g.traverse(m=>{if(m.isMesh)meshes.push(m);});return meshes.map(m=>({name:m.name,index:{count:m.geometry.index.count,sha256:hash(m.geometry.index.array)},attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,{count:a.count,itemSize:a.itemSize,sha256:hash(a.array)}])),maps:Object.fromEntries(['map','normalMap'].filter(k=>m.material[k]?.image?.data).map(k=>[k,hash(m.material[k].image.data)]))}));}
try{
 let baseline=sourceGroom167({capture:false,baseline:true});const sourceBaseline=snapshot(baseline);baseline=null;global.gc?.();
 const groom=sourceGroom167(),captured=snapshot(groom);report.checks.originalSourceAndCapturedGeneratorExact=JSON.stringify(sourceBaseline)===JSON.stringify(captured);if(!report.checks.originalSourceAndCapturedGeneratorExact)throw Error('167 capture changed generated geometry/maps');
 prepareCrownLayout167(groom);const head=preparedHead167(),before=snapshot(groom),headBefore=snapshot(head),references=groom.children.map(m=>({mesh:m,geometry:m.geometry,material:m.material,attributes:{...m.geometry.attributes},index:m.geometry.index}));
 const zero=front167.applyFrontLocks167(groom,head,{strength:0});report.checks.zero={result:zero,exact:JSON.stringify(snapshot(groom))===JSON.stringify(before)};
 const started=performance.now();report.helper=front167.applyFrontLocks167(groom,head,{strength:1});report.sourceElapsedMs=performance.now()-started;
 const qa=front167.getFrontLocks167QA(groom),after=snapshot(groom),protectedChanges=[];
 for(let i=0;i<before.length;i++){if(JSON.stringify(before[i].attributes)!==JSON.stringify(after[i].attributes))protectedChanges.push(before[i].name+'/attributes');if(JSON.stringify(before[i].maps)!==JSON.stringify(after[i].maps))protectedChanges.push(before[i].name+'/maps');if(i!==0&&JSON.stringify(before[i].index)!==JSON.stringify(after[i].index))protectedChanges.push(before[i].name+'/index');const r=references[i];if(r.mesh.geometry!==r.geometry||r.mesh.material!==r.material||Object.entries(r.attributes).some(([k,a])=>r.mesh.geometry.attributes[k]!==a))protectedChanges.push(r.mesh.name+'/references');}
 if(JSON.stringify(headBefore)!==JSON.stringify(snapshot(head)))protectedChanges.push('head geometry');
 report.checks.protectedChanges=protectedChanges;report.records=qa.application.surface.records;
 const g=qa.application.mesh.geometry;let nonfinite=0;for(const a of Object.values(g.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;report.checks.emittedAllAttributesNonfinite=nonfinite;
 report.checks.coarse=front167.setCoarseIsolation167(groom).removedTriangles;front167.restoreCoarseIsolation167(groom);
 report.checks.release=front167.releaseFrontLocks167(groom);report.checks.restoredExact=JSON.stringify(before)===JSON.stringify(snapshot(groom));
 report.sourcePeakRssMiB=process.resourceUsage().maxRSS/1024;report.status='Complete; native shape decision pending';save();
 if(protectedChanges.length||nonfinite||!report.checks.restoredExact||!report.checks.zero.exact)throw Error('167 source preservation failed');
 console.log(JSON.stringify({checks:report.checks,helper:report.helper,records:report.records.map(({id,u,depthFitIterations,maximumControlDepthLift,maximumResidualZPenetration,maximumDepthStandOff,totalArcLength,controlPoints})=>({id,u,depthFitIterations,maximumControlDepthLift,maximumResidualZPenetration,maximumDepthStandOff,totalArcLength,controlPoints})),sourcePeakRssMiB:report.sourcePeakRssMiB}));
}catch(e){report.status='Failed';report.failure=String(e.stack||e);save();throw e;}
