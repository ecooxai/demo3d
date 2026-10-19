import fs from 'node:fs';
import assert from 'node:assert/strict';
import {helper165 as H,sourceSleeve165,source165Scope,Matrix4,read,object} from './sleeve165-source.mjs';
import {attach,mul,T,RY,RZ,balance158} from './collar158-source.mjs';
import {constructFull148} from './upper-shoulder148-full-source.mjs';
const intersect=new Function('Matrix4',read('review/blouse-drape154-geometry-audit.js')+'\nreturn trianglesIntersect154;')(Matrix4),inspect=new Function('Matrix4','trianglesIntersect154',read('review/sleeve165-geometry-audit.js')+'\nreturn inspectSleeveTriangles165;')(Matrix4,intersect),started=performance.now(),cpu=process.cpuUsage();
const blouse=sourceSleeve165(),records=[],jet=new Float64Array(7);
const seamField=H.createSleeveSeamField165(blouse.children.find(m=>m.name===H.SLEEVE165_SPEC.meshes[0]).geometry,blouse.children.find(m=>m.name===H.SLEEVE165_SPEC.meshes[1]).geometry),seamJet=new Float64Array(8);
for(const mesh of blouse.children)if(H.SLEEVE165_SPEC.meshes.includes(mesh.name)){
 const p=mesh.geometry.attributes.position,ownedIndices=[],isSeam=mesh.name===H.SLEEVE165_SPEC.meshes[1];for(let i=0;i<p.count;i++){if(isSeam)seamField.sample(p.getX(i),p.getY(i),p.getZ(i),seamJet);else H.sleeveFoldJet165(p.getX(i),p.getY(i),p.getZ(i),jet);if(isSeam?seamJet[6]:jet[4])ownedIndices.push(i);}
 records.push({mesh,original:mesh.geometry.clone(),candidate:mesh.geometry,ownedIndices});
}
const metrics=H.applySleeveFold165(blouse,{strength:1}),B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0))),headFrame=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17))),model=object('source-model165'),proxy=object('unrendered165-backup99',B);
blouse.matrixWorld=B;for(const m of blouse.children)m.matrixWorld=B;for(const r of records)attach(proxy,r.mesh.name,r.original,B,r.mesh.material);
const hairStart=performance.now(),raw=constructFull148(false,{baseline:true,capture:false}),hairMs=performance.now()-hairStart,hair=object('fixed-accepted133-hair165',headFrame);
for(const m of raw.children)attach(hair,m.name,m.geometry,headFrame,m.material);
model.add(blouse,hair);balance158(model,{shiftX:-.24});balance158(proxy,{shiftX:-.24});
const risk=inspect({blouse,model,records}),usage=process.cpuUsage(cpu),report={iteration:165,scoreUnchanged:78,status:'Actual source-frame contact study; native complete-scene arrays remain authoritative.',scope:source165Scope,metrics,risk,resources:{hairConstructionMs:hairMs,totalElapsedMs:performance.now()-started,cpuMs:(usage.user+usage.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024}};
fs.writeFileSync('review/sleeve165-contact-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,risk:{...risk,contacts:{...risk.contacts,beforeIDs:undefined,afterIDs:undefined,newIDs:undefined,removedIDs:undefined}}}));
assert.equal(risk.nonfinite+risk.newDegenerate+risk.reversed,0);assert.equal(risk.contacts.newPairs,0,'165 introduces actual fixed-hair or fixed-blouse triangle contacts.');assert.equal(risk.seamSupport.newMissing+risk.seamSupport.newInside,0,'165 loses sampled existing seam support.');assert(risk.seamSupport.maxAdditionalSeparation<.002&&risk.seamSupport.maxAdditionalInset>-.001,'165 seam interpolation creates an excessive additional gap/inset.');
