import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {helper158 as H,sourceCollar158,balance158,Matrix4,read,object,attach,I,mul,T,RY,RZ,point} from './collar158-source.mjs';
import {sourceNeck148} from './upper-shoulder148-source.mjs';
import {constructFull148} from './upper-shoulder148-full-source.mjs';
const intersect=new Function('Matrix4',read('review/blouse-drape154-geometry-audit.js')+'\nreturn trianglesIntersect154;')(Matrix4);
const inspect=new Function('Matrix4','trianglesIntersect154',read('review/collar158-geometry-audit.js')+'\nreturn inspectCollarTriangles158;')(Matrix4,intersect);
const started=performance.now(),cpu=process.cpuUsage(),blouse=sourceCollar158(),records=[],work=H.collarWorkspace158(),jet=new Float64Array(14);
for(const mesh of blouse.children)if(H.COLLAR158_SPEC.meshes.includes(mesh.name)){
 const p=mesh.geometry.attributes.position,side=mesh.name.includes('-left-')?-1:1,ownedIndices=[];
 for(let i=0;i<p.count;i++){H.collarMap158(side,p.getX(i),p.getY(i),p.getZ(i),jet,work);if(jet[12])ownedIndices.push(i);}
 records.push({mesh,original:mesh.geometry,ownedIndices});
}
const metrics=H.applyCollarRoll158(blouse,{strength:1,retainSourceForQA:true});for(const r of records)r.candidate=r.mesh.geometry;
const B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0))),headFrame=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17))),model=object('source-model158'),proxy=object('unrendered-original-collar158',B),neck=sourceNeck148();neck.name='original-neck-and-clavicle-transition';neck.matrixWorld=B;for(const m of neck.children)m.matrixWorld=B;
blouse.matrixWorld=B;for(const m of blouse.children)m.matrixWorld=B;for(const r of records)attach(proxy,r.mesh.name,r.original,B,r.mesh.material);
const hairStart=performance.now(),raw=constructFull148(false,{baseline:true,capture:false}),hairMs=performance.now()-hairStart,hair=object('original-fixed-hair158',headFrame);
for(const mesh of raw.children)attach(hair,mesh.name,mesh.geometry,headFrame,mesh.material);
model.add(blouse,neck,hair,proxy);const balance=balance158(model,{shiftX:-.24});model.children.splice(model.children.indexOf(proxy),1);
const risk=inspect({blouse,model,records}),usage=process.cpuUsage(cpu),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

// Small reproducible geometry sheet data only. Compact the actual nearby
// triangles, not the entire groom. This JSON is local-only and not transferred.
const previous=JSON.parse(fs.readFileSync('review/collar158-coarse-data.json','utf8'));
const compact=(mesh,toBlouse,kind)=>{const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,idx=mesh.geometry.index.array,mapping=new Map(),position=[],normal=[],index=[];for(let t=0;t<idx.length;t+=3){const ids=[idx[t],idx[t+1],idx[t+2]],ps=ids.map(i=>point(toBlouse,[p.getX(i),p.getY(i),p.getZ(i)]));if(Math.max(...ps.map(p=>p[1]))<.40||Math.min(...ps.map(p=>p[1]))>1.69||Math.max(...ps.map(p=>p[0]))<-.98||Math.min(...ps.map(p=>p[0]))>.98||Math.max(...ps.map(p=>p[2]))<-.04)continue;for(let k=0;k<3;k++){const id=ids[k];if(!mapping.has(id)){mapping.set(id,position.length/3);position.push(...ps[k]);const a=toBlouse.elements;normal.push(a[0]*n.getX(id)+a[4]*n.getY(id)+a[8]*n.getZ(id),a[1]*n.getX(id)+a[5]*n.getY(id)+a[9]*n.getZ(id),a[2]*n.getX(id)+a[6]*n.getY(id)+a[10]*n.getZ(id));}index.push(mapping.get(id));}}return{name:mesh.name,kind,position,normal,index};};
const invB=B.clone().invert();previous.context=[];
for(const mesh of blouse.children)if(!H.COLLAR158_SPEC.meshes.includes(mesh.name))previous.context.push(compact(mesh,I(),'cloth'));
for(const mesh of neck.children)previous.context.push(compact(mesh,I(),'skin'));
for(const mesh of hair.children)if(mesh.name==='Overlapping layered S-wave hair around front back and shoulders')previous.context.push(compact(mesh,mul(invB,headFrame),'hair'));
for(const d of previous.changed){const r=records.find(r=>r.mesh.name===d.name);d.before=Array.from(r.original.attributes.position.array);d.after=Array.from(r.candidate.attributes.position.array);d.normalBefore=Array.from(r.original.attributes.normal.array);d.normalAfter=Array.from(r.candidate.attributes.normal.array);}
previous.scope+=' All plotted components include the single accepted99 pass; source hair MASS is context only, full groom triangles enter the interface gate.';
fs.writeFileSync('review/collar158-coarse-data.json',JSON.stringify(previous));
const passed=risk.nonfinite+ risk.newDegenerate+risk.reversed+risk.contacts.newPairs+risk.shells.reduce((s,r)=>s+r.newPairs,0)===0&&risk.seams.every(s=>s.newMissing===0&&(s.maxAdditionalSeparation??0)<.001);
const report={iteration:158,scoreUnchanged:78,status:passed?'Coarse current-source nearby-triangle checks passed; native art pending':'Concrete coarse interface blocker; no native-ready claim',metrics,risk,resources:{hairConstructionMs:hairMs,totalElapsedMs:performance.now()-started,cpuMs:(usage.user+usage.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024},sourceHashes:Object.fromEntries(['src/main.js','src/blouse.js','src/blouse-drape.js','src/hair-groom.js','src/portrait-balance.js','review/collar158-proposal.md','review/collar-roll-candidate158.js','review/collar158-geometry-audit.js','review/collar158-source.mjs','review/collar158-contact-audit.mjs'].map(f=>[f,sha(f)]))};
fs.writeFileSync('review/collar158-contact-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,sourceHashes:undefined,risk:{...risk,contacts:{...risk.contacts,beforeIDs:undefined,afterIDs:undefined,newIDs:undefined,removedIDs:undefined}}}));
H.releaseCollarRoll158(blouse);assert(passed,'158 actual nearby-triangle or emitted seam interface needs a bounded source correction.');
