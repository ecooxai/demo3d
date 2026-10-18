import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Focused source harness; the parent runs real Three/WebGPU separately.
const prefix=fs.readFileSync('review/hair-contact86-audit.mjs','utf8').split('const baseline=construct(')[0].replace(/^import[^\n]*\n/gm,'');
const {THREE,read,faceZ}=new Function('fs','assert',prefix+'\nreturn {THREE,read,faceZ};')(fs,assert);
THREE.DataTexture.prototype.isDataTexture=true;THREE.DataTexture.prototype.channel=0;
THREE.SRGBColorSpace='srgb';THREE.NoColorSpace='';
THREE.Group.prototype.getObjectByName=function(name){return this.children.find(o=>o.name===name);};
THREE.Group.prototype.updateWorldMatrix=function(){};
const sampleBlouseFrontAtXY=new Function('THREE',read('src/blouse.js')+'\nreturn sampleBlouseFrontAtXY;')(THREE);
const createHairContact=new Function('sampleBlouseFrontAtXY',read('review/hair-contact-candidate86.js')+'\nreturn createHairContact;')(sampleBlouseFrontAtXY);
const buildGroom=new Function('THREE','faceZ','createHairContact',read('review/hair-groom-candidate108.js')+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact);
const cr=Math.cos(-.17),sr=Math.sin(-.17),cy=Math.cos(.16),sy=Math.sin(.16),pose=[cy*cr,sr,-sy*cr,0,-cy*sr,cr,sy*sr,0,sy,0,cy,0,.26,2.95,0,1];
const hash=a=>crypto.createHash('sha256').update(a).digest('hex');
const arrayHash=a=>hash(new Uint8Array(a.buffer,a.byteOffset,a.byteLength));
const sourceFiles=['reference/image1.png','reference/image1-color.jpg','src/main.js','src/hair-groom.js','src/blouse.js','src/reference-crown.js','review/hair-groom-candidate108.js','review/reference-crown-candidate100.js'];
const beforeSources=Object.fromEntries(sourceFiles.map(p=>[p,hash(fs.readFileSync(p))]));
const pixelsBuffer=fs.readFileSync(0),photoPixels=new Uint8ClampedArray(pixelsBuffer.buffer,pixelsBuffer.byteOffset,pixelsBuffer.byteLength);
assert.equal(photoPixels.length,1024*544*4);
const source100=read('review/reference-crown-candidate100.js').replace(/async function readReferencePixels100\(\)\{[\s\S]*?\n\}/,'async function readReferencePixels100(){return photoPixels;}');
const baseAPI=new Function('THREE','photoPixels',source100+'\nreturn {applyReferenceCrownMicrocontrast100};')(THREE,photoPixels);
const counter={reads:0};
const source116=read('review/reference-crown-candidate116.js').replace(/async function readReferencePixels116\(\)\{[\s\S]*?\n\}/,'async function readReferencePixels116(){counter.reads++;return photoPixels;}');
const api=new Function('photoPixels','counter',source116+'\nreturn {applyRegisteredCrownColor116,makeRegistration,sourceDistance,spatialWeight,transformPoint,sourceField,registeredField,sampleRegistered};')(photoPixels,counter);
const physical=mat=>JSON.stringify(Object.fromEntries(['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','specularColor','envMapIntensity','normalScale','alphaTest','alphaToCoverage','side','transparent','opacity','depthWrite','forceSinglePass','vertexColors'].map(k=>[k,mat[k]])));
const snapshot=hair=>hair.children.map(mesh=>({mesh,geometry:mesh.geometry,material:mesh.material,physical:physical(mesh.material),attributes:Object.fromEntries(Object.entries(mesh.geometry.attributes).map(([k,a])=>[k,{attribute:a,array:a.array,hash:arrayHash(a.array)}])),index:arrayHash(mesh.geometry.index.array),normalMap:mesh.material.normalMap,normalMapHash:mesh.material.normalMap?arrayHash(mesh.material.normalMap.image.data):null,alphaMap:mesh.material.alphaMap,alphaMapHash:mesh.material.alphaMap?arrayHash(mesh.material.alphaMap.image.data):null}));
const verifyShape=(hair,snap)=>{
 assert.equal(hair.children.length,snap.length);
 for(let i=0;i<snap.length;i++){
  const a=hair.children[i],b=snap[i];assert.equal(a,b.mesh);assert.equal(a.geometry,b.geometry);assert.equal(a.material,b.material);assert.equal(physical(a.material),b.physical);assert.equal(arrayHash(a.geometry.index.array),b.index);
  assert.deepEqual(Object.keys(a.geometry.attributes),Object.keys(b.attributes));
  for(const[k,v]of Object.entries(b.attributes)){const now=a.geometry.attributes[k];assert.equal(now,v.attribute);assert.equal(now.array,v.array);if(k!=='color'||i>=3)assert.equal(arrayHash(now.array),v.hash,`${a.name} ${k}`);}
  assert.equal(a.material.normalMap,b.normalMap);assert.equal(a.material.alphaMap,b.alphaMap);
  if(b.normalMap)assert.equal(arrayHash(b.normalMap.image.data),b.normalMapHash);
  if(b.alphaMap)assert.equal(arrayHash(b.alphaMap.image.data),b.alphaMapHash);
 }
};
const started=performance.now(),cpuStart=process.cpuUsage(),runs=[];
let propertyReads=0;
const poison=new Proxy({}, {get(){propertyReads++;throw new Error('Zero strength accessed the groom');}});
const off=await api.applyRegisteredCrownColor116(poison,{strength:0});assert.equal(off.status,'baseline');assert.equal(propertyReads,0);assert.equal(counter.reads,0);
assert.equal(await api.applyRegisteredCrownColor116(poison,{strength:0}),off);
for(const strength of[.65,1]){
 let hair=buildGroom({headShiftX:.26,shoulderContact:.35});for(const mesh of hair.children)mesh.matrixWorld={elements:pose};
 await baseAPI.applyReferenceCrownMicrocontrast100(hair,{strength:1});
 const crown=hair.children[0],map=crown.material.map,mapData=new Uint8Array(map.image.data),snap=snapshot(hair),colors=hair.children.map(m=>new Float32Array(m.geometry.attributes.color.array));
 const original100Metadata=crown.material.userData.referenceCrownMicrocontrast;
 const offBefore=counter.reads,offActual=await api.applyRegisteredCrownColor116(hair,{strength:0});assert.equal(offActual,off);assert.equal(counter.reads,offBefore);verifyShape(hair,snap);assert.equal(arrayHash(map.image.data),arrayHash(mapData));
 const result=await api.applyRegisteredCrownColor116(hair,{strength});verifyShape(hair,snap);assert.equal(crown.material.map,map);assert.equal(crown.material.userData.referenceCrownMicrocontrast,original100Metadata);
 let atlasAlphaMismatches=0,foundationRGBMismatches=0,vertexAlphaMismatches=0,lowerRootRGBMismatches=0,finite=true;
 for(let i=0;i<mapData.length;i+=4)if(mapData[i+3]!==map.image.data[i+3])atlasAlphaMismatches++;
 for(let i=2048*1024*4;i<mapData.length;i++)if(mapData[i]!==map.image.data[i])foundationRGBMismatches++;
 const crownColor=crown.geometry.attributes.color.array;
 for(let i=0;i<crownColor.length/4;i++){if(crownColor[i*4+3]!==colors[0][i*4+3])vertexAlphaMismatches++;if(i<7685)for(let c=0;c<3;c++)assert.equal(crownColor[i*4+c],colors[0][i*4+c]);}
 const rootMapping={tested:0,nonpositive:0,minNormalizedJacobian:Infinity,maxNormalizedJacobian:-Infinity};
 const registration=api.makeRegistration({position:crown.geometry.attributes.position,matrix:pose}),p=new Float64Array(3),q=new Float64Array(3),mapped=new Float64Array(6);
 for(let m=0;m<hair.children.length;m++){
  const mesh=hair.children[m];for(const attr of Object.values(mesh.geometry.attributes))for(const v of attr.array)finite&&=Number.isFinite(v);
  if(m!==1&&m!==2)continue;
  const pos=mesh.geometry.attributes.position,col=mesh.geometry.attributes.color.array;
  for(let i=0;i<pos.count;i++){
   if(pos.getY(i)<=.30)for(let c=0;c<3;c++)if(col[i*3+c]!==colors[m][i*3+c])lowerRootRGBMismatches++;
   if(i%7||col[i*3]===colors[m][i*3])continue;
   for(let c=0;c<3;c++)p[c]=pos.array[i*3+c];api.transformPoint(pose,p,q);registration.sample(q[0],q[1],mapped,true);
   if(api.sourceDistance(mapped[0],mapped[1])<4)continue;
   const det=(mapped[2]*mapped[5]-mapped[3]*mapped[4])/registration.affineDeterminant;rootMapping.tested++;rootMapping.minNormalizedJacobian=Math.min(rootMapping.minNormalizedJacobian,det);rootMapping.maxNormalizedJacobian=Math.max(rootMapping.maxNormalizedJacobian,det);if(!(det>0))rootMapping.nonpositive++;
  }
 }
 assert.equal(atlasAlphaMismatches,0);assert.equal(foundationRGBMismatches,0);assert.equal(vertexAlphaMismatches,0);assert.equal(lowerRootRGBMismatches,0);assert(finite);assert.equal(rootMapping.nonpositive,0);
 const interpolation=[];
 if(strength===1){
  const field=api.registeredField(registration,api.sourceField(photoPixels)),logGain=new Float64Array(3);
  for(const m of[1,2]){
   const g=hair.children[m].geometry,ix=g.index.array,pos=g.attributes.position.array,after=g.attributes.color.array,before=colors[m],errors=[];let worst=null;
   // Actual triangle color interpolation versus the common3D field at its
   // interior. This probes a remaining render risk, not the vertex setter.
   for(let t=0;t<ix.length;t+=3*17){
    const ids=[ix[t],ix[t+1],ix[t+2]];for(let c=0;c<3;c++)p[c]=(pos[ids[0]*3+c]+pos[ids[1]*3+c]+pos[ids[2]*3+c])/3;
    const weight=api.spatialWeight(p,pose);if(weight<.05)continue;api.transformPoint(pose,p,q);api.sampleRegistered(field,q[0],q[1],logGain);
    if(Math.max(...logGain.map(Math.abs))<.005)continue;
    let error=0;for(let c=0;c<3;c++){const expected=Math.exp(weight*logGain[c]),actual=(after[ids[0]*3+c]+after[ids[1]*3+c]+after[ids[2]*3+c])/(before[ids[0]*3+c]+before[ids[1]*3+c]+before[ids[2]*3+c]);error=Math.max(error,Math.abs(actual/expected-1));}
    errors.push(error);if(!worst||error>worst.relativeError)worst={triangle:t/3,headLocalPoint:Array.from(p),relativeError:error};
   }
   errors.sort((a,b)=>a-b);interpolation.push({mesh:hair.children[m].name,testedTriangles:errors.length,medianRelativeError:errors[Math.floor(errors.length*.5)],p95RelativeError:errors[Math.floor(errors.length*.95)],p99RelativeError:errors[Math.floor(errors.length*.99)],worst});
  }
 }
 const sameHashes=hair.children.map(m=>arrayHash(m.geometry.attributes.color.array)),sameMap=arrayHash(map.image.data),reads=counter.reads;
 assert.equal(await api.applyRegisteredCrownColor116(hair,{strength}),result);assert.equal(counter.reads,reads);assert.equal(arrayHash(map.image.data),sameMap);for(let i=0;i<hair.children.length;i++)assert.equal(arrayHash(hair.children[i].geometry.attributes.color.array),sameHashes[i]);
 await assert.rejects(api.applyRegisteredCrownColor116(hair,{strength:strength===1?.65:1}),/fresh grooms/);
 assert(result.mapping.normalizedJacobian[0]>0);assert(result.mappedAtlasTexels>100000);assert(result.rootMeshes.every(m=>m.changedVertices>1000));
 runs.push({strength,metrics:result,rootMapping,interpolation,preservation:{geometryObjectsAndAttributes:'same references',positionNormalIndexUV0UV1:'exact bytes',fringeWisps:'all exact bytes',physicalSettings:'exact',normalAndCoverageMaps:'same references and bytes',atlasAlphaMismatches,foundationRGBMismatches,vertexAlphaMismatches,lowerRootRGBMismatches,atlasObject:'same reference',sameStrength:'exact same result,bytes and no source decode',differentStrength:'rejects before mutation',finite},geometry:{triangles:hair.userData.triangles,MiB:hair.userData.geometryMiB}});
 hair=null;global.gc?.();
}
for(const p of sourceFiles)assert.equal(hash(fs.readFileSync(p)),beforeSources[p],`Source file changed: ${p}`);
const cpu=process.cpuUsage(cpuStart),report={candidate:116,native:false,scoreUnchanged:76,base:'frozen108 geometry with accepted100 atlas, current112 cloth/contact; before99 balance',zero:{propertyReads,sourceReads:0,returnsSharedBaselineResult:true},runs,sourceFiles:beforeSources,cost:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRSSMiB:process.resourceUsage().maxRSS/1024,memoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,v/1048576]))},limitations:['This harness does not render native Three/WebGPU.','Jacobian checks sample the used crown vertices and every seventh changed root vertex, not a formal global proof.','Manual photo polygons establish hair-only intent; their visual placement must be judged in the source and native renders.','Atlas headroom compensation retains linear RGB ratios but entails RGB8 rounding on neutral sheet texels.','The source color contains photographic illumination; the changed-light native comparison is necessary.']};
fs.writeFileSync('review/reference-crown116-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidate:116,zero:report.zero,runs:runs.map(r=>({strength:r.strength,elapsedMs:r.metrics.elapsedMs,mappedAtlasTexels:r.metrics.mappedAtlasTexels,atlasGainRange:r.metrics.atlasGainRange,atlasCompensation:r.metrics.atlasCompensation,sourcePixels:r.metrics.sourceField.filteredSourcePixels,sourceJacobian:r.metrics.mapping.normalizedJacobian,rootMapping:r.rootMapping,interpolation:r.interpolation,rootMeshes:r.metrics.rootMeshes,preservation:r.preservation,geometry:r.geometry})),cost:report.cost,report:'review/reference-crown116-audit.json'}));
