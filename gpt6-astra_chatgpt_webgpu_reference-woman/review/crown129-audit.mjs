import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';

const started=performance.now(),cpuStart=process.cpuUsage(),hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const load=file=>{
 let code=read(file).replace(' // Existing crown fibers gather into shared flowing families.', ' const detailRootStart124=detail.p.length;\n // Existing crown fibers gather into shared flowing families.')
 .replace(' // Retain94\'s accepted bowed trajectories.', ' const detailRootEnd124=detail.p.length;\n // Retain94\'s accepted bowed trajectories.')
 .replace('m.receiveShadow=true;return m;','m.receiveShadow=true;m.__raw129=new Float32Array(b.p);return m;')
 .replace(' return root;',' root.__ranges124={detailRootStart124,detailRootEnd124};return root;');
 return new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',code+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118);
};

function actualBurialAudit129(hair){
 const crown=hair.children[0].geometry,p=crown.attributes.position.array,colors=crown.attributes.color.array,ix=crown.index.array,nx=64,ny=80,x0=-1.1,y0=-.7,dx=2.2/nx,dy=2.4/ny,bins=Array.from({length:nx*ny},()=>[]);
 for(let f=144*52*6;f<ix.length;f+=3){const ids=[ix[f],ix[f+1],ix[f+2]],xs=ids.map(i=>p[i*3]),ys=ids.map(i=>p[i*3+1]),loX=Math.max(0,Math.floor((Math.min(...xs)-x0)/dx)),hiX=Math.min(nx-1,Math.floor((Math.max(...xs)-x0)/dx)),loY=Math.max(0,Math.floor((Math.min(...ys)-y0)/dy)),hiY=Math.min(ny-1,Math.floor((Math.max(...ys)-y0)/dy));for(let j=loY;j<=hiY;j++)for(let i=loX;i<=hiX;i++)bins[j*nx+i].push(f);}
 const ray=(x,y)=>{const i=Math.floor((x-x0)/dx),j=Math.floor((y-y0)/dy);if(i<0||i>=nx||j<0||j>=ny)return null;let nearest=null;for(const f of bins[j*nx+i]){const ia=ix[f],ib=ix[f+1],ic=ix[f+2],ax=p[ia*3],ay=p[ia*3+1],bx=p[ib*3],by=p[ib*3+1],cx=p[ic*3],cy=p[ic*3+1],den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-12)continue;const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-8)continue;const z=u*p[ia*3+2]+v*p[ib*3+2]+w*p[ic*3+2],alpha=u*colors[ia*4+3]+v*colors[ib*4+3]+w*colors[ic*4+3];if(z>.015&&(!nearest||z>nearest.z))nearest={z,alpha,triangle:f/3};}return nearest;};
 const result={exactTriangleQueries:0,frontFineOverStrongCap:0,minGapOverStrongCap:Infinity,examples:[],supportUnmaskedOverStrongCap:0,exposedFiberUpwardSteps:0,maxExposedRise:0};
 const fine=hair.children[3].geometry.attributes.position,fg=fine.array;
 for(let strand=0;strand<fine.count/66;strand++){
  let prev=null;for(let step=0;step<=32;step++){const i=(strand*66+step*2)*3,point=[(fg[i]+fg[i+3])*.5,(fg[i+1]+fg[i+4])*.5,(fg[i+2]+fg[i+5])*.5],hit=ray(point[0],point[1]);result.exactTriangleQueries++;
   if(hit&&hit.alpha>=.75){const gap=hit.z-point[2];result.minGapOverStrongCap=Math.min(result.minGapOverStrongCap,gap);if(gap<-.001){result.frontFineOverStrongCap++;if(result.examples.length<8)result.examples.push({strand,step,point,gap,hit});}}
   const exposed=!hit||hit.alpha<.15||point[2]>hit.z+.004;if(prev&&prev.exposed&&exposed&&point[1]-prev.point[1]>.003){result.exposedFiberUpwardSteps++;result.maxExposedRise=Math.max(result.maxExposedRise,point[1]-prev.point[1]);}prev={point,exposed};
  }
 }
 const support=hair.children[5].geometry,pb=support.attributes.position.array,cb=support.attributes.color.array;
 for(let i=0;i<pb.length;i+=3){if(cb[i/3*4+3]<=.05)continue;const hit=ray(pb[i],pb[i+1]);if(hit&&hit.alpha>=.75&&pb[i+2]>hit.z+.002)result.supportUnmaskedOverStrongCap++;}
 return result;
}

const options={headShiftX:.26,shoulderContact:.35,guidePlacement:.5},base=load('review/hair-groom-before124.js')(options),candidate=load('review/hair-groom-candidate129.js');
let off=candidate({...options,crownPatch129:0});
const allHashes=g=>g.children.map(m=>({name:m.name,index:hash(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,hash(a.array)]))}));
assert.deepEqual(allHashes(off),allHashes(base));off=null;global.gc?.();
const on=candidate({...options,crownPatch129:1}),meshes=[];
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
assert.equal(on.userData.crownPatch129.upwardExposedSamples,0);
assert(on.userData.triangles<=base.userData.triangles*1.08);
assert.deepEqual(on.userData.frontRootJoins,base.userData.frontRootJoins);
assert.deepEqual(on.userData.farTempleLayer,base.userData.farTempleLayer);
// Different preparation timestamps are excluded; the mathematical fit itself
// and its actual lower geometry were checked above.
const burial=actualBurialAudit129(on);
const cpu=process.cpuUsage(cpuStart),report={candidate:129,native:false,scoreUnchanged:77,zeroExact:true,baseSHA256:crypto.createHash('sha256').update(fs.readFileSync('review/hair-groom-before124.js')).digest('hex'),sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync('review/hair-groom-candidate129.js')).digest('hex'),options,base:{triangles:base.userData.triangles,geometryMiB:base.userData.geometryMiB},on:{triangles:on.userData.triangles,geometryMiB:on.userData.geometryMiB,constructionMs:on.userData.constructionMs,triangleChange:on.userData.triangles/base.userData.triangles-1,patch:on.userData.crownPatch129},meshes,burial,preservation:{mass:'All attributes and index exact; includes118 fitted lengths,86 contact and94 far temple',detail:'Exact lower prefix and protected suffix, all UV/color/index exact;2300 existing crown fibers keep their count and some front end positions change',crown:'Exact position/normal/index/UV0/RGB; forward vertex alpha deliberately withdrawn',changedAlpha,removedAlpha,legacyFringe:'Replaced, with legacy RNG draws consumed; new family strands and dense roots share paths',wisps:'Old front edge wisps withdrawn; accepted short temple wisps retained'},limitations:['Source-only numerical geometry check; native Three/WebGPU images decide visible quality.','Dense-root overlap follows original crown coordinates; no exhaustive alpha-filtered view-ray coverage certification before the first native glimpse.','100/104 coverage characterization must be rerun if the new CROWN alpha is accepted.','The source harness does not measure GPU cost or actual native heap.'],resources:{elapsedMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024}};
fs.writeFileSync('review/crown129-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({sourceOnly:true,zeroExact:true,base:report.base,on:{...report.on,patch:{...report.on.patch,paths:undefined}},meshes,preservation:report.preservation,resources:report.resources}));
