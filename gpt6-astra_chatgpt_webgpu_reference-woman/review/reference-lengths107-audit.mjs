import fs from 'node:fs';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';

// Source-only validation harness. Native Three/WebGPU is checked by the parent.
class V {
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;this.isVector3=true;}
 clone(){return new V(this.x,this.y,this.z);} set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
 addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
 multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
 dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
 lengthSq(){return this.dot(this);} normalize(){return this.multiplyScalar(1/(Math.sqrt(this.lengthSq())||1));}
 cross(v){const{x,y,z}=this;return this.set(y*v.z-z*v.y,z*v.x-x*v.z,x*v.y-y*v.x);}
 lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this;}
}
class Curve {
 constructor(points,closed=false,type='catmullrom',tension=.5){this.points=points;this.tension=tension;}
 getPoint(t){
  const ps=this.points,l=ps.length,p=(l-1)*t;let i=Math.floor(p),w=p-i;
  if(i===l-1){i=l-2;w=1;}
  const p1=ps[i],p2=ps[i+1],p0=i>0?ps[i-1]:p1.clone().multiplyScalar(2).addScaledVector(p2,-1),p3=i+2<l?ps[i+2]:p2.clone().multiplyScalar(2).addScaledVector(p1,-1);
  const result=new V();for(const k of['x','y','z']){const v0=(p2[k]-p0[k])*this.tension,v1=(p3[k]-p1[k])*this.tension;result[k]=((2*p1[k]-2*p2[k]+v0+v1)*w+(-3*p1[k]+3*p2[k]-2*v0-v1))*w*w+v0*w+p1[k];}return result;
 }
 getTangent(t){const a=Math.max(0,t-.0001),b=Math.min(1,t+.0001);return this.getPoint(b).sub(this.getPoint(a)).normalize();}
}
const linear=s=>s<=.04045?s/12.92:((s+.055)/1.055)**2.4;
class Color {
 constructor(c='#ffffff'){if(c instanceof Color){Object.assign(this,c);return;}const n=Number.parseInt(String(c).replace('#',''),16);this.r=linear((n>>16&255)/255);this.g=linear((n>>8&255)/255);this.b=linear((n&255)/255);}
 clone(){return new Color(this);} multiplyScalar(s){this.r*=s;this.g*=s;this.b*=s;return this;}
 lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this;}
}
class Attr {
 constructor(array,itemSize){this.array=array instanceof Float32Array||array instanceof Uint32Array||array instanceof Uint16Array?array:new Float32Array(array);this.itemSize=itemSize;this.count=this.array.length/itemSize;}
 getX(i){return this.array[i*this.itemSize];}getY(i){return this.array[i*this.itemSize+1];}getZ(i){return this.array[i*this.itemSize+2];}
 setXYZ(i,x,y,z){const j=i*this.itemSize;this.array[j]=x;this.array[j+1]=y;this.array[j+2]=z;return this;}
}
class Geometry {
 constructor(){this.attributes={};}setAttribute(k,a){this.attributes[k]=a;return this;}getAttribute(k){return this.attributes[k];}
 setIndex(i){let max=0;for(const v of i)max=Math.max(max,v);this.index=new Attr(max>65535?new Uint32Array(i):new Uint16Array(i),1);return this;}
 computeVertexNormals(){const p=this.attributes.position.array,n=new Float32Array(p.length),idx=this.index.array;for(let i=0;i<idx.length;i+=3){const a=idx[i]*3,b=idx[i+1]*3,c=idx[i+2]*3,ax=p[c]-p[b],ay=p[c+1]-p[b+1],az=p[c+2]-p[b+2],bx=p[a]-p[b],by=p[a+1]-p[b+1],bz=p[a+2]-p[b+2],x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx;for(const j of[a,b,c]){n[j]+=x;n[j+1]+=y;n[j+2]+=z;}}for(let i=0;i<n.length;i+=3){const l=Math.hypot(n[i],n[i+1],n[i+2])||1;n[i]/=l;n[i+1]/=l;n[i+2]/=l;}this.attributes.normal=new Attr(n,3);}
 computeBoundingBox(){}computeBoundingSphere(){}
}
class Group{constructor(){this.children=[];this.userData={};}add(...o){this.children.push(...o);}traverse(f){f(this);for(const o of this.children)f(o);}}
class Mesh{constructor(geometry,material){this.geometry=geometry;this.material=material;this.isMesh=true;}}
class Mat{constructor(a={}){Object.assign(this,a);}clone(){return new Mat({...this});}}
class Texture{constructor(data,width,height){this.image={data,width,height};}}
const THREE={Vector3:V,Vector2:class{constructor(x,y){this.x=x;this.y=y;}},CatmullRomCurve3:Curve,Color,BufferGeometry:Geometry,Float32BufferAttribute:Attr,Group,Mesh,MeshPhysicalMaterial:Mat,DataTexture:Texture,MathUtils:{clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t},DoubleSide:2};
const read=p=>fs.readFileSync(p,'utf8').replace(/^import[^\n]*\n/gm,'').replace(/export /g,'');
// This harness uses the real accepted crown and actual pixels from the only
// supplied reference. JPEG bytes are decoded internally; no image/base64 data
// is printed and no additional visual source is opened.
Texture.prototype.isDataTexture=true;
Texture.prototype.isTexture=true;
Texture.prototype.channel=0;
Group.prototype.getObjectByName=function(name){return this.children.find(o=>o.name===name);};
Group.prototype.updateWorldMatrix=function(){};
THREE.SRGBColorSpace='srgb';THREE.NoColorSpace='';
const cr=Math.cos(-.17),sr=Math.sin(-.17),cy=Math.cos(.16),sy=Math.sin(.16);
const pose=[cy*cr,sr,-sy*cr,0,-cy*sr,cr,sy*sr,0,sy,0,cy,0,.26,2.95,0,1];
const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
const buildGroom=new Function('THREE','faceZ',read('review/hair-groom-candidate94.js')+'\nreturn createGroomHair;')(THREE,faceZ);
const makeGroom=()=>buildGroom({shoulderContact:0});
const photoBuffer=fs.readFileSync(0),photoPixels=new Uint8ClampedArray(photoBuffer.buffer,photoBuffer.byteOffset,photoBuffer.byteLength);
assert.equal(photoPixels.length,1024*1536*4);
const decoder={calls:0};let source=read('review/reference-lengths-candidate107.js');
source=source.replace(/async function readReferencePixels107\(\)\{[\s\S]*?\n\}/,'async function readReferencePixels107(){decoder.calls++;return photoPixels;}');
const api=new Function('THREE','photoPixels','decoder',source+'\nreturn {applyReferenceLengthsMicrocontrast107,validateLengths107,bakeLengths107,SOURCE_STRIPS,sourcePath107,samplePath107,unwrapSourceStrip107,samplePeriodic107,sampleLengthField107};')(THREE,photoPixels,decoder);
const sourcePathChecks=[];
for(const spec of api.SOURCE_STRIPS){
 const path=api.sourcePath107(spec.points),a=new Float64Array(5),b=new Float64Array(5),c=new Float64Array(5);
 let minJacobian=Infinity,maxJacobian=-Infinity,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let j=1;j<2048;j++){
  const t=j/2048,dt=.00001;api.samplePath107(path,t,a);api.samplePath107(path,t-dt,b);api.samplePath107(path,t+dt,c);
  for(const q of [-1,-.5,0,.5,1]){
   const dx=(c[0]+c[3]*q*c[2]-b[0]-b[3]*q*b[2])/(2*dt),dy=(c[1]+c[4]*q*c[2]-b[1]-b[4]*q*b[2])/(2*dt),cx=a[3]*a[2],cy=a[4]*a[2],jac=(dx*cy-dy*cx)/(path.length*a[2]);
   minJacobian=Math.min(minJacobian,jac);maxJacobian=Math.max(maxJacobian,jac);
   const x=a[0]+cx*q,y=a[1]+cy*q;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
 }
 assert(minJacobian>0,`${spec.name} manual curved strip must not fold`);assert(minX>=0&&minY>=0&&maxX<1023&&maxY<1535);
 sourcePathChecks.push({name:spec.name,minJacobian,maxJacobian,bounds:[minX,minY,maxX,maxY]});
}
const sourceStrips=api.SOURCE_STRIPS.map(spec=>api.unwrapSourceStrip107(spec,photoPixels));
let seamValueError=0,seamDerivativeError=0;
for(const strip of sourceStrips)for(let j=0;j<=100;j++){
 const v=j/100,h=.00001,a=api.samplePeriodic107(strip,0,v),b=api.samplePeriodic107(strip,1,v);
 seamValueError=Math.max(seamValueError,Math.abs(a-b));
 const dl=(api.samplePeriodic107(strip,0,v)-api.samplePeriodic107(strip,-h,v))/h,dr=(api.samplePeriodic107(strip,h,v)-api.samplePeriodic107(strip,0,v))/h;
 seamDerivativeError=Math.max(seamDerivativeError,Math.abs(dl-dr));
}
assert.equal(seamValueError,0);assert(seamDerivativeError<.2,'Circular source splice must not create a derivative jump');
if(process.argv.includes('--source-preview')){
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;}return(c^0xffffffff)>>>0;};
 const chunk=(type,data)=>{const tag=Buffer.from(type),header=Buffer.alloc(4),checksum=Buffer.alloc(4);header.writeUInt32BE(data.length);checksum.writeUInt32BE(crc(Buffer.concat([tag,data])));return Buffer.concat([header,tag,data,checksum]);};
 const w=224,h=1024,rgba=Buffer.alloc(h*(w*4+1));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const side=x<112?0:1,local=x-side*112-8,at=y*(w*4+1)+1+x*4;
  let c=210;if(local>=0&&local<96){const field=sourceStrips[side].signal,sample=(field[y*2*96+local]+field[(y*2+1)*96+local])*.5,value=Math.exp(sample)*.42;c=Math.round((value<=.0031308?12.92*value:1.055*value**(1/2.4)-.055)*255);}
  rgba[at]=rgba[at+1]=rgba[at+2]=c;rgba[at+3]=255;
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
 fs.writeFileSync('review/reference-lengths107-strip-inspection.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rgba)),chunk('IEND',Buffer.alloc(0))]));
 console.log(JSON.stringify({sourcePathChecks,seamValueError,seamDerivativeError,sourceStrips:sourceStrips.map(s=>s.metrics)}));process.exit(0);
}
const start=performance.now(),cpuStart=process.cpuUsage(),baseline=makeGroom(),massName='Overlapping layered S-wave hair around front back and shoulders',baselineMass=baseline.getObjectByName(massName),oldGeometry=baselineMass.geometry,oldMaterial=baselineMass.material;
const original={position:oldGeometry.attributes.position.array,normal:oldGeometry.attributes.normal.array,uv:oldGeometry.attributes.uv.array,color:oldGeometry.attributes.color.array,index:oldGeometry.index.array,map:oldMaterial.map.image.data};
const off=api.applyReferenceLengthsMicrocontrast107(baseline,{strength:0});
assert.equal(off,api.applyReferenceLengthsMicrocontrast107(baseline,{strength:0}));assert.equal(off.status,'baseline');assert.equal(decoder.calls,0);assert.equal(baselineMass.material,oldMaterial);assert.equal(baselineMass.geometry,oldGeometry);
const same=(a,b)=>{assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)if(a[i]!==b[i])throw new Error(`Attribute mismatch at ${i}`);};
const results=[];
for(const strength of [.5,1]){
 const hair=makeGroom(),mass=hair.getObjectByName(massName),geometry=mass.geometry,material=mass.material,others=hair.children.filter(mesh=>mesh!==mass).map(mesh=>({mesh,geometry:mesh.geometry,material:mesh.material,attributes:{...mesh.geometry.attributes}}));
 const oldUV1=geometry.getAttribute('uv1'),oldMapCopy=new Uint8Array(material.map.image.data),metrics=await api.applyReferenceLengthsMicrocontrast107(hair,{strength});
 for(const key of ['position','normal','uv'])same(original[key],geometry.attributes[key].array);
 same(original.index,geometry.index.array);same(oldMapCopy,material.map.image.data);assert.equal(geometry.getAttribute('uv1'),oldUV1);assert.equal(mass.geometry,geometry);assert.equal(mass.material.normalMap,material.normalMap);assert.equal(mass.material.normalScale,material.normalScale);assert.equal(mass.material.alphaMap,undefined);assert.equal(mass.material.map.channel,0);
 let coverageMismatches=0,compensatedVertexError=0;
 for(let i=3;i<original.map.length;i+=4)if(mass.material.map.image.data[i]!==original.map[i])coverageMismatches++;
 for(let i=0;i<original.color.length;i++){const value=geometry.attributes.color.array[i];assert(Number.isFinite(value)&&value>=0&&value<=1);compensatedVertexError=Math.max(compensatedVertexError,Math.abs(value*.60-original.color[i]));}
 assert.equal(coverageMismatches,0);assert(compensatedVertexError<1e-8);
 for(const key of ['wrapS','wrapT','minFilter','magFilter','generateMipmaps','anisotropy','flipY','unpackAlignment'])assert.equal(mass.material.map[key],material.map[key],`Sampler ${key}`);
 for(const key of ['roughness','specularIntensity','specularColor','envMapIntensity','anisotropy','anisotropyRotation','alphaTest','alphaToCoverage','transparent','opacity','depthWrite','side'])assert.equal(mass.material[key],material[key],`Material ${key}`);
 for(const other of others){assert.equal(other.mesh.geometry,other.geometry);assert.equal(other.mesh.material,other.material);for(const key of Object.keys(other.attributes))assert.equal(other.mesh.geometry.attributes[key],other.attributes[key]);}
 assert(metrics.rowMeanErrorMax<1e-12);assert(metrics.quantizedRowMeanErrorMax<.008);assert(metrics.gainMin>=.60-1e-12&&metrics.gainMax<=1.64+1e-12);assert(metrics.gainMin<.95&&metrics.gainMax>1.05);
 assert.equal(await api.applyReferenceLengthsMicrocontrast107(hair,{strength}),metrics);assert.throws(()=>api.applyReferenceLengthsMicrocontrast107(hair,{strength:0}),/fresh grooms/);
 results.push({strength,metrics,identity:{positionNormalUV0Index:'exact',UV1:'same reference',normalTextureAndSampler:'exact',materialSettings:'exact',nonMassMeshes:'same geometry, attributes and material references',coverageMismatches,compensatedVertexError,sameStrength:'same result'}});
 if(global.gc)global.gc();
}
const cpu=process.cpuUsage(cpuStart),usage=process.resourceUsage(),result={candidate:107,native:false,scoreUnchanged:76,offIdentical:true,offDecodeCalls:0,sourcePathChecks,seamValueError,seamDerivativeError,results,cost:{totalAuditWallMs:performance.now()-start,totalAuditCpuMs:(cpu.user+cpu.system)/1000,peakRSSMiB:usage.maxRSS/1024,currentMemoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,v/1048576]))},limitations:['Native ordinary-size, profile and back art review remains required.','Source hair-only strips were selected manually by vision; the path audit checks geometric folds and bounds only.','Whole-row mean is preserved; individual visible partial circumferences can vary with the accepted per-guide UV phase.','Original map and RGB attribute are replaced at unchanged dimensions; the temporary source arrays are discarded after construction.']};
fs.writeFileSync('review/reference-lengths107-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
