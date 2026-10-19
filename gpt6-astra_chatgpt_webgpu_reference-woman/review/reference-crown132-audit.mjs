import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {THREE,read,construct} from './lower-clump126-source.mjs';

// One focused source bake; parent owns the native visual comparison.
THREE.DataTexture.prototype.isDataTexture=true;THREE.DataTexture.prototype.channel=0;
THREE.SRGBColorSpace='srgb';THREE.NoColorSpace='';
THREE.Group.prototype.getObjectByName=function(name){return this.children.find(o=>o.name===name);};
THREE.Group.prototype.updateWorldMatrix=function(){};
const raw=fs.readFileSync(0),pixels=new Uint8ClampedArray(raw.buffer,raw.byteOffset,raw.byteLength);assert.equal(pixels.length,1024*544*4);
const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const cr=Math.cos(-.17),sr=Math.sin(-.17),cy=Math.cos(.16),sy=Math.sin(.16),pose=[cy*cr,sr,-sy*cr,0,-cy*sr,cr,sy*sr,0,sy,0,cy,0,.26,2.95,0,1];
const source100=read('src/reference-crown.js').replace(/async function readReferencePixels100\(\)\{[\s\S]*?\n\}/,'async function readReferencePixels100(){return pixels;}');
const baseAPI=new Function('THREE','pixels',source100+'\nreturn {applyReferenceCrownMicrocontrast100,sampleBase100};')(THREE,pixels);
const reads={count:0},source132=read('review/reference-crown-candidate132.js').replace(/async function readReferencePixels132\(\)\{[\s\S]*?\n\}/,'async function readReferencePixels132(){reads.count++;return pixels;}');
const api=new Function('pixels','reads',source132+'\nreturn {applyRegisteredCrownReplacement132,baseFromFoundation132,polygonDistance,LANDMARKS,SOURCE_HAIR};')(pixels,reads);
const oldAPI=new Function(read('review/reference-crown-candidate116.js')+'\nreturn {LANDMARKS,SOURCE_HAIR};')();
assert.deepEqual(api.LANDMARKS,oldAPI.LANDMARKS);assert.deepEqual(api.SOURCE_HAIR[0].slice(1),oldAPI.SOURCE_HAIR[0].slice(1));
assert.deepEqual(api.SOURCE_HAIR[1].slice(0,3),oldAPI.SOURCE_HAIR[1].slice(0,3));assert.deepEqual(api.SOURCE_HAIR[1].slice(9),oldAPI.SOURCE_HAIR[1].slice(9));
const correctedExteriorPoints=[[1,770,226],[1,808,395],[0,560,30]].map(([side,x,y])=>({side,x,y,signedDistance:api.polygonDistance(api.SOURCE_HAIR[side],x,y)}));
assert(correctedExteriorPoints.every(p=>p.signedDistance<0),'Observed pale exterior must be outside the locally corrected polygons');
let propertyReads=0;const poison=new Proxy({}, {get(){propertyReads++;throw new Error('132 zero accessed the groom');}});
const off=await api.applyRegisteredCrownReplacement132(poison,{strength:0});assert.equal(propertyReads,0);assert.equal(reads.count,0);assert.equal(off.status,'baseline');
const start=performance.now(),cpuStart=process.cpuUsage(),hair=construct(0,{baseline:true});for(const mesh of hair.children)mesh.matrixWorld={elements:pose};
const originalBase=hair.children[0].material.map;
await baseAPI.applyReferenceCrownMicrocontrast100(hair,{strength:1});
const crown=hair.children[0],map=crown.material.map,originalPixels=new Uint8Array(map.image.data),metadata100=crown.material.userData.referenceCrownMicrocontrast;
const snapshot=hair.children.map(mesh=>({mesh,geometry:mesh.geometry,material:mesh.material,attributes:Object.fromEntries(Object.entries(mesh.geometry.attributes).map(([key,a])=>[key,{ref:a,array:a.array,hash:hash(a.array)}])),index:hash(mesh.geometry.index.array),normalMap:mesh.material.normalMap,normalHash:mesh.material.normalMap?hash(mesh.material.normalMap.image.data):null,alphaMap:mesh.material.alphaMap,alphaHash:mesh.material.alphaMap?hash(mesh.material.alphaMap.image.data):null}));
const a=new Float64Array(3),b=new Float64Array(3);let maximumRecoveredBaseError=0;
for(const u of[0,.03,.4,.65,.9,1])for(const v of[0,.05,.4,.70,.729]){
 baseAPI.sampleBase100(originalBase,u,v,a);api.baseFromFoundation132(originalPixels,u,v,b);
 for(let ch=0;ch<3;ch++)maximumRecoveredBaseError=Math.max(maximumRecoveredBaseError,Math.abs(a[ch]-b[ch]));
}
assert.equal(maximumRecoveredBaseError,0);
assert.equal(await api.applyRegisteredCrownReplacement132(hair,{strength:0}),off);assert.equal(reads.count,0);assert.equal(hash(map.image.data),hash(originalPixels));
const result=await api.applyRegisteredCrownReplacement132(hair,{strength:1});
assert.equal(crown.material.map,map);assert.equal(crown.material.userData.referenceCrownMicrocontrast,metadata100);
for(let i=0;i<snapshot.length;i++){
 const old=snapshot[i],mesh=hair.children[i];assert.equal(mesh,old.mesh);assert.equal(mesh.geometry,old.geometry);assert.equal(mesh.material,old.material);assert.equal(hash(mesh.geometry.index.array),old.index);
 assert.deepEqual(Object.keys(mesh.geometry.attributes),Object.keys(old.attributes));
 for(const[key,entry]of Object.entries(old.attributes)){const attr=mesh.geometry.attributes[key];assert.equal(attr,entry.ref);assert.equal(attr.array,entry.array);assert.equal(hash(attr.array),entry.hash,`${mesh.name} ${key}`);}
 assert.equal(mesh.material.normalMap,old.normalMap);assert.equal(mesh.material.alphaMap,old.alphaMap);
 if(old.normalMap)assert.equal(hash(mesh.material.normalMap.image.data),old.normalHash);
 if(old.alphaMap)assert.equal(hash(mesh.material.alphaMap.image.data),old.alphaHash);
}
let alphaMismatches=0,foundationMismatches=0;
for(let i=0;i<originalPixels.length;i+=4)if(originalPixels[i+3]!==map.image.data[i+3])alphaMismatches++;
for(let i=2048*1024*4;i<originalPixels.length;i++)if(originalPixels[i]!==map.image.data[i])foundationMismatches++;
assert.equal(alphaMismatches,0);assert.equal(foundationMismatches,0);assert.equal(reads.count,1);
const sameData=map.image.data,sameHash=hash(sameData);assert.equal(await api.applyRegisteredCrownReplacement132(hair,{strength:1}),result);assert.equal(map.image.data,sameData);assert.equal(hash(sameData),sameHash);assert.equal(reads.count,1);
await assert.rejects(api.applyRegisteredCrownReplacement132(hair,{strength:.5}),/fresh grooms/);assert.equal(hash(map.image.data),sameHash);
assert(result.mappedAtlasTexels>50000);assert(result.maximumLinearAtlasRGB<=1);assert(result.sourceGainRange[0]>=.42-1e-6&&result.sourceGainRange[1]<=1.60+1e-6);
assert.equal(result.mapping.nonpositive,0);

// Literal texture inspection only, not a synthetic render or new visual asset.
const crc=bytes=>{let c=0xffffffff;for(const byte of bytes){c^=byte;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return(c^0xffffffff)>>>0;};
const chunk=(type,data)=>{const tag=Buffer.from(type),length=Buffer.alloc(4),checksum=Buffer.alloc(4);length.writeUInt32BE(data.length);checksum.writeUInt32BE(crc(Buffer.concat([tag,data])));return Buffer.concat([length,tag,data,checksum]);};
const w=2048,h=752,scan=Buffer.alloc(h*(w*4+1));for(let y=0;y<h;y++)scan.set(map.image.data.subarray(y*w*4,(y+1)*w*4),y*(w*4+1)+1);
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
fs.writeFileSync('review/reference-crown132-atlas-inspection.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]));
const cpu=process.cpuUsage(cpuStart),report={candidate:132,native:false,scoreUnchanged:77,base:'Live accepted118.5 groom with100 crown atlas; before99 balance',result,preservation:{manual116Landmarks:'exact',sourceBoundaries:'Right inner chain and20 of21 left vertices exact116',rightExterior:'Only six visually overreaching outer vertices corrected',leftTopExterior:'Only (565,24) corrected to (552,35) after manual source crop',correctedExteriorPoints,geometryObjectsAndAllAttributesAndIndices:'same references and exact bytes',allRootAndCrownVertexColors:'exact bytes',allMaterials:'same objects',normalAndCoverageMaps:'same references and bytes',alphaMismatches,foundationMismatches,original100Metadata:'same object',maximumRecoveredBaseError,zeroGroomPropertyReads:propertyReads,sourceDecodes:reads.count,sameStrength:'same result and pixels without repeat decode',differentStrength:'rejects before mutation',retainedExtraMapsOrAttributes:0},cost:{wallMs:performance.now()-start,cpuMs:(cpu.user+cpu.system)/1000,peakRSSMiB:process.resourceUsage().maxRSS/1024},inspection:'review/reference-crown132-atlas-inspection.png',limitations:['No native rendering or visual score is provided by this source bake.','The numerator retains original photo detail but includes some illumination; alternate-light native review remains necessary.','Overlying root fibers stay unchanged, as documented by the separate small coverage study.','Existing104 exporter compatibility follows unchanged atlas/channel/metadata semantics; no extra export study is warranted before art acceptance.']};
fs.writeFileSync('review/reference-crown132-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidate:132,result:{elapsedMs:result.elapsedMs,bakeMs:result.bakeMs,mappedAtlasTexels:result.mappedAtlasTexels,replacedInteriorTexels:result.replacedInteriorTexels,gain:result.sourceGainRange,maximumLinear:result.maximumLinearAtlasRGB,source:result.sourceField,footprint:result.sourcePixelsPerAtlasTexel,mapping:result.mapping.normalizedJacobian},preservation:report.preservation,cost:report.cost,report:'review/reference-crown132-audit.json'}));
