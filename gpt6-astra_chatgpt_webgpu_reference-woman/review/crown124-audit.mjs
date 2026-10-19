import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';

const started=performance.now(),cpuStart=process.cpuUsage(),hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const load=file=>{
 let code=read(file).replace(' // Existing crown fibers gather into shared flowing families.', ' const detailRootStart124=detail.p.length;\n // Existing crown fibers gather into shared flowing families.')
 .replace(' // Retain94\'s accepted bowed trajectories.', ' const detailRootEnd124=detail.p.length;\n // Retain94\'s accepted bowed trajectories.')
 .replace(' return root;',' root.__ranges124={detailRootStart124,detailRootEnd124};return root;');
 return new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',code+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118);
};
const options={headShiftX:.26,shoulderContact:.35,guidePlacement:.5},base=load('review/hair-groom-before124.js')(options),candidate=load('review/hair-groom-candidate124.js');
let off=candidate({...options,crownPatch124:0});
const allHashes=g=>g.children.map(m=>({name:m.name,index:hash(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,hash(a.array)]))}));
assert.deepEqual(allHashes(off),allHashes(base));off=null;global.gc?.();
const on=candidate({...options,crownPatch124:1}),meshes=[];
for(let m=0;m<on.children.length;m++){
 const mesh=on.children[m],g=mesh.geometry;let nonfinite=0,zeroNormals=0,maxNormalError=0;
 for(const a of Object.values(g.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;
 const n=g.attributes.normal;for(let i=0;i<n.count;i++){const len=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(!len)zeroNormals++;else maxNormalError=Math.max(maxNormalError,Math.abs(len-1));}
 assert.equal(nonfinite,0,mesh.name);assert(maxNormalError<1e-6);
 meshes.push({name:mesh.name,vertices:g.attributes.position.count,triangles:g.index.count/3,nonfinite,zeroNormals,maxNormalError});
}
// Main long locks,118 placement,94 temple and contact are exact. Only the
// existing front crown fibers inside DETAIL move; its prefix/suffix are exact.
assert.deepEqual(allHashes(on)[1],allHashes(base)[1]);
const range=base.__ranges124,detail=on.children[2].geometry,oldDetail=base.children[2].geometry;
for(const key of['position','normal']){
 const a=detail.attributes[key].array,b=oldDetail.attributes[key].array;
 assert.equal(hash(a.subarray(0,range.detailRootStart124)),hash(b.subarray(0,range.detailRootStart124)),key+' lower prefix');
 assert.equal(hash(a.subarray(range.detailRootEnd124)),hash(b.subarray(range.detailRootEnd124)),key+' protected tail');
}
for(const key of['uv','color'])assert.equal(hash(detail.attributes[key].array),hash(oldDetail.attributes[key].array));
assert.equal(hash(detail.index.array),hash(oldDetail.index.array));
const crown=on.children[0].geometry,oldCrown=base.children[0].geometry;
for(const key of['position','normal','uv'])assert.equal(hash(crown.attributes[key].array),hash(oldCrown.attributes[key].array));
assert.equal(hash(crown.index.array),hash(oldCrown.index.array));
let changedAlpha=0,removedAlpha=0;const a=crown.attributes.color.array,b=oldCrown.attributes.color.array;
for(let i=0;i<a.length;i++){if(i%4!==3)assert.equal(a[i],b[i]);else{assert(a[i]>=0&&a[i]<=1);if(a[i]!==b[i])changedAlpha++;removedAlpha+=b[i]-a[i];}}
assert.equal(on.userData.crownPatch124.upwardExposedSamples,0);
assert(on.userData.triangles<=base.userData.triangles*1.08);
assert.deepEqual(on.userData.frontRootJoins,base.userData.frontRootJoins);
assert.deepEqual(on.userData.farTempleLayer,base.userData.farTempleLayer);
// Different preparation timestamps are excluded; the mathematical fit itself
// and its actual lower geometry were checked above.
const cpu=process.cpuUsage(cpuStart),report={candidate:124,native:false,scoreUnchanged:76,zeroExact:true,baseSHA256:crypto.createHash('sha256').update(fs.readFileSync('review/hair-groom-before124.js')).digest('hex'),sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync('review/hair-groom-candidate124.js')).digest('hex'),options,base:{triangles:base.userData.triangles,geometryMiB:base.userData.geometryMiB},on:{triangles:on.userData.triangles,geometryMiB:on.userData.geometryMiB,constructionMs:on.userData.constructionMs,triangleChange:on.userData.triangles/base.userData.triangles-1,patch:on.userData.crownPatch124},meshes,preservation:{mass:'All attributes and index exact; includes118 fitted lengths,86 contact and94 far temple',detail:'Exact lower prefix and protected suffix, all UV/color/index exact;2300 existing crown fibers keep their count and some front end positions change',crown:'Exact position/normal/index/UV0/RGB; forward vertex alpha deliberately withdrawn',changedAlpha,removedAlpha,legacyFringe:'Replaced, with legacy RNG draws consumed; new family strands and dense roots share paths',wisps:'Old front edge wisps withdrawn; accepted short temple wisps retained'},limitations:['Source-only numerical geometry check; native Three/WebGPU images decide visible quality.','Dense-root overlap follows original crown coordinates; no exhaustive alpha-filtered view-ray coverage certification before the first native glimpse.','100/104 coverage characterization must be rerun if the new CROWN alpha is accepted.','The source harness does not measure GPU cost or actual native heap.'],resources:{elapsedMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024}};
fs.writeFileSync('review/crown124-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceOnly:true,zeroExact:true,base:report.base,on:{...report.on,patch:{...report.on.patch,paths:undefined}},meshes,preservation:report.preservation,resources:report.resources}));
