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
const buildGroom=new Function('THREE','faceZ',read('review/hair-groom-candidate82.js')+'\nreturn createGroomHair;')(THREE,faceZ);
const makeGroom=()=>{const hair=buildGroom();for(const mesh of hair.children)mesh.matrixWorld={elements:pose};return hair;};
// Supply the top 1024x544 source RGBA bytes on stdin; the decoder runs outside Node.
const photoBuffer=fs.readFileSync(0);
const photoPixels=new Uint8ClampedArray(photoBuffer.buffer,photoBuffer.byteOffset,photoBuffer.byteLength);
assert.equal(photoPixels.length,1024*544*4);
let source=read('review/reference-crown-candidate100.js');
source=source.replace(/async function readReferencePixels100\(\)\{[\s\S]*?\n\}/,'async function readReferencePixels100(){return photoPixels;}');
const api=new Function('THREE','photoPixels',source+'\nreturn {applyReferenceCrownMicrocontrast100,validateCrown100,bakeAtlas100,SOURCE_STRIPS,STRAND_TILES,sourcePath100,samplePath100,unwrapSourceStrip100,sampleStrandField100};')(THREE,photoPixels);
// Only geometry of the manually authored source sampling is audited here.
// The hair-only choice itself was made by visual inspection of image1.
const sourcePathChecks=[];
for(const spec of api.SOURCE_STRIPS){
 const path=api.sourcePath100(spec.points),a=new Float64Array(5),b=new Float64Array(5),c=new Float64Array(5);
 let minJacobian=Infinity,maxJacobian=-Infinity,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let j=1;j<1024;j++){
  const t=j/1024,dt=.00001;api.samplePath100(path,t,a);api.samplePath100(path,t-dt,b);api.samplePath100(path,t+dt,c);
  for(const q of [-1,-.5,0,.5,1]){
   const dx=(c[0]+c[3]*q*c[2]-b[0]-b[3]*q*b[2])/(2*dt),dy=(c[1]+c[4]*q*c[2]-b[1]-b[4]*q*b[2])/(2*dt),cx=a[3]*a[2],cy=a[4]*a[2];
   // Positive along/cross determinant means the curved strip does not fold.
   const jac=(dx*cy-dy*cx)/(path.length*a[2]);minJacobian=Math.min(minJacobian,jac);maxJacobian=Math.max(maxJacobian,jac);
   const x=a[0]+cx*q,y=a[1]+cy*q;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
 }
 assert(minJacobian>0,`${spec.name} manual curved strip must not fold`);
 assert(minX>=0&&minY>=0&&maxX<1023&&maxY<543);
 sourcePathChecks.push({name:spec.name,minJacobian,maxJacobian,bounds:[minX,minY,maxX,maxY]});
}
let minTileWeight=Infinity;
for(let i=0;i<=10000;i++){
 const u=i/10000;let weight=0;
 for(const [center,radius]of api.STRAND_TILES){const q=(u-center)/radius;if(Math.abs(q)<1)weight+=(1+Math.cos(Math.PI*q))*.5;}
 minTileWeight=Math.min(minTileWeight,weight);
}
assert(minTileWeight>.2,'Overlap weights must cover all crown U without a seam gap');

if(process.argv.includes('--source-preview')){
 // Diagnostic of the sampled texture, not a render or an additional asset.
 const crc=bytes=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;}return(c^0xffffffff)>>>0;};
 const chunk=(type,data)=>{const tag=Buffer.from(type),header=Buffer.alloc(4),checksum=Buffer.alloc(4);header.writeUInt32BE(data.length);checksum.writeUInt32BE(crc(Buffer.concat([tag,data])));return Buffer.concat([header,tag,data,checksum]);};
 const w=224,h=768,rgba=Buffer.alloc(h*(w*4+1));
 const strips=api.SOURCE_STRIPS.map(spec=>api.unwrapSourceStrip100(spec,photoPixels));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const side=x<112?0:1,local=x-side*112-8,at=y*(w*4+1)+1+x*4;
  let c=210;if(local>=0&&local<96){const value=Math.exp(strips[side].signal[y*96+local])*.42;c=Math.round((value<=.0031308?12.92*value:1.055*value**(1/2.4)-.055)*255);}
  rgba[at]=rgba[at+1]=rgba[at+2]=c;rgba[at+3]=255;
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
 const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rgba)),chunk('IEND',Buffer.alloc(0))]);
 fs.writeFileSync('review/reference-crown100-strip-inspection.png',png);
 console.log(JSON.stringify({sourcePreview:'review/reference-crown100-strip-inspection.png',sourcePathChecks,minTileWeight}));
 process.exit(0);
}

const start=performance.now(),cpuStart=process.cpuUsage();
const baseline=makeGroom(),baselineCrown=baseline.children[0],oldGeometry=baselineCrown.geometry,oldMaterial=baselineCrown.material;
const basePos=oldGeometry.attributes.position.array,baseNormal=oldGeometry.attributes.normal.array,baseUV=oldGeometry.attributes.uv.array,baseColor=oldGeometry.attributes.color.array,baseIndex=oldGeometry.index.array,baseMap=oldMaterial.map.image.data;
const offResult=await api.applyReferenceCrownMicrocontrast100(baseline,{strength:0});
assert.equal(offResult.status,'baseline');assert.equal(baselineCrown.material,oldMaterial);assert.equal(baselineCrown.geometry,oldGeometry);assert.equal(oldGeometry.getAttribute('uv1'),undefined);
const same=(a,b)=>{assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)if(a[i]!==b[i])throw new Error(`Attribute mismatch at ${i}`);};
const results=[];
for(const strength of [.5,1]){
 const hair=makeGroom(),crown=hair.children[0],geometry=crown.geometry,previous=crown.material;
 const references=hair.children.slice(1).map(mesh=>({geometry:mesh.geometry,material:mesh.material}));
 const metrics=await api.applyReferenceCrownMicrocontrast100(hair,{strength});
 assert.equal(crown.geometry,geometry);same(basePos,geometry.attributes.position.array);same(baseNormal,geometry.attributes.normal.array);same(baseUV,geometry.attributes.uv.array);same(baseIndex,geometry.index.array);
 assert.equal(crown.material.normalMap,previous.normalMap);same(oldMaterial.normalMap.image.data,crown.material.normalMap.image.data);
 assert.equal(crown.material.normalScale,previous.normalScale);
 assert.equal(crown.material.map.channel,1);assert.equal(crown.material.alphaMap.channel,0);assert.equal(crown.material.normalMap.channel,0);
 const color=geometry.attributes.color.array,uv1=geometry.attributes.uv1.array,coverage=crown.material.alphaMap.image.data,atlas=crown.material.map.image.data;
 let foundationRGBMismatches=0,alphaVertexMismatches=0,coverageMismatches=0,foundationTexelMismatches=0,colorRangeMin=Infinity,colorRangeMax=-Infinity;
 for(let i=0;i<24455;i++){
  if(color[i*4+3]!==baseColor[i*4+3])alphaVertexMismatches++;
  for(let ch=0;ch<3;ch++){const value=color[i*4+ch];assert(Number.isFinite(value)&&value>=0&&value<=1);colorRangeMin=Math.min(colorRangeMin,value);colorRangeMax=Math.max(colorRangeMax,value);if(i<7685&&value!==baseColor[i*4+ch])foundationRGBMismatches++;}
  assert(Number.isFinite(uv1[i*2])&&Number.isFinite(uv1[i*2+1]));assert(uv1[i*2]>=0&&uv1[i*2]<=1&&uv1[i*2+1]>=0&&uv1[i*2+1]<=1);
 }
 for(let i=0;i<baseMap.length;i+=4){if(coverage[i+1]!==baseMap[i+3])coverageMismatches++;assert.equal(coverage[i+3],255);}
 for(let y=0;y<752;y++)for(let x=0;x<512;x++)for(let ch=0;ch<3;ch++)if(atlas[((1040+y)*2048+16+x)*4+ch]!==baseMap[(y*512+x)*4+ch])foundationTexelMismatches++;
 assert.equal(foundationRGBMismatches,0);assert.equal(alphaVertexMismatches,0);assert.equal(coverageMismatches,0);assert.equal(foundationTexelMismatches,0);
 for(const key of ['wrapS','wrapT','minFilter','magFilter','generateMipmaps','anisotropy','flipY','unpackAlignment'])assert.equal(crown.material.alphaMap[key],previous.map[key],`Coverage sampler ${key}`);
 for(const prop of ['roughness','specularIntensity','envMapIntensity','anisotropy','anisotropyRotation','alphaTest','alphaToCoverage','transparent','opacity','depthWrite','side'])assert.equal(crown.material[prop],previous[prop]);
 for(let i=1;i<hair.children.length;i++){assert.equal(hair.children[i].geometry,references[i-1].geometry);assert.equal(hair.children[i].material,references[i-1].material);}
 const repeated=await api.applyReferenceCrownMicrocontrast100(hair,{strength});assert.equal(repeated,metrics);
 for(const chart of metrics.charts){assert(chart.mappedTexels>10000,`Visible source chart has adequate sample support: ${chart.name}`);assert(chart.gainMin<.92&&chart.gainMax>1.08,`Contrast must survive the local-mean removal: ${chart.name}`);}
 results.push({strength,metrics,identity:{foundationRGBMismatches,alphaVertexMismatches,coverageMismatches,foundationTexelMismatches,positionNormalUV0Index:'exact',normalTextureAndSampler:'exact',nonCrownMeshes:'same references',sameStrength:'same result'},colorRange:[colorRangeMin,colorRangeMax]});
 if(global.gc)global.gc();
}
const cpu=process.cpuUsage(cpuStart),usage=process.resourceUsage();
const result={candidate:100,native:false,scoreUnchanged:76,offIdentical:true,sourcePathChecks,minTileWeight,results,cost:{totalAuditWallMs:performance.now()-start,totalAuditCpuMs:(cpu.user+cpu.system)/1000,peakRSSMiB:usage.maxRSS/1024,currentMemoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,v/1048576]))},limitations:['Native shader/UV1/alphaMap comparison remains required.','The native alphaMap must be merged into UV1 atlas alpha on an export-only material before GLB shipping.','Foundation source texels/RGBA vertices are exact; atlas RGB mip filtering can differ at extreme minification. Coverage and normal maps remain on their exact original UV0 fields.']};
fs.writeFileSync('review/reference-crown100-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
