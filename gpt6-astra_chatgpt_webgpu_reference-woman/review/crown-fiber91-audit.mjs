import fs from 'node:fs';
import assert from 'node:assert/strict';

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
const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
const sampleBlouseFrontAtXY=new Function('THREE',read('review/blouse-candidate81.js')+'\nreturn sampleBlouseFrontAtXY;')(THREE);
const createHairContact=new Function('sampleBlouseFrontAtXY',read('review/hair-contact-candidate83.js')+'\nreturn createHairContact;')(sampleBlouseFrontAtXY);
const baseFile='review/hair-groom-candidate83.js',candidateFile='review/hair-groom-candidate91.js';
const original=fs.readFileSync(baseFile,'utf8'),modified=fs.readFileSync(candidateFile,'utf8');
// Verify all changes are confined to the new helper, one final append and metadata.
const restored=modified.replace(/\n\/\/ Candidate 91:[\s\S]*?(?=export function createGroomHair)/,'')
 .replace(' const crownFiberStructure91=addDenseCrownFibers91(detail,crown,palette);\n fiberCount+=crownFiberStructure91.addedCrownFibers;\n','')
 .replace(' root.userData.crownFiberStructure=crownFiberStructure91;\n','');
assert.equal(restored,original,'The complete original source remains unchanged');
function construct(file){
 let source=read(file);
 if(file===candidateFile){
  source=source.replace(' root.add(makeMesh(crownBatch',' root.__newFiberRaw=Float32Array.from(detail.p.slice(crownFiberStructure91.vertexFirst*3));root.__forehead=forehead;\n root.add(makeMesh(crownBatch');
 }
 source=source.replace('return root;','root.__guideOrder=guides.map(g=>({id:g.id,kind:g.kind,root:g.scalpRoot}));return root;');
 return new Function('THREE','faceZ','createHairContact',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact)();
}
const start=performance.now(),cpuStart=process.cpuUsage();
const baseline=construct(baseFile);
if(global.gc)global.gc();
const candidateStart=performance.now(),candidate=construct(candidateFile),constructionMs=performance.now()-candidateStart;
const metrics=candidate.userData.crownFiberStructure;
assert.equal(metrics.addedCrownFibers,10500);assert.equal(metrics.totalCrownFibers,12800);
assert.equal(metrics.addedVertices,651000);assert.equal(metrics.addedTriangles,630000);
assert.equal(metrics.opaqueHostsAdded,0);
assert.equal(candidate.children.length,baseline.children.length);
assert.deepEqual(candidate.__guideOrder,baseline.__guideOrder);
assert.deepEqual(candidate.userData.frontRootJoins,baseline.userData.frontRootJoins);
assert.equal(candidate.userData.shoulderContact,undefined,'Rejected contact stays off');
assert.equal(candidate.userData.individualStrands-baseline.userData.individualStrands,10500);
const mismatch={crown:0,mass:0,fringe:0,wisps:0,allOriginalDetail:0,materials:0,maps:0};
const countMismatch=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])n++;return n;};
for(const [i,label]of [[0,'crown'],[1,'mass'],[2,'allOriginalDetail'],[3,'fringe'],[4,'wisps']]){
 const a=baseline.children[i].geometry,b=candidate.children[i].geometry;
 for(const [name,attr]of Object.entries(a.attributes)){
  if(i!==2)assert.equal(attr.count,b.attributes[name].count);
  mismatch[label]+=countMismatch(attr.array,b.attributes[name].array);
 }
 if(i!==2)assert.equal(a.index.count,b.index.count);
 mismatch[label]+=countMismatch(a.index.array,b.index.array);
 const ma=baseline.children[i].material,mb=candidate.children[i].material;
 for(const prop of['roughness','specularIntensity','envMapIntensity','anisotropy','anisotropyRotation','alphaTest','alphaToCoverage','transparent','opacity','depthWrite','side'])if(ma[prop]!==mb[prop])mismatch.materials++;
 for(const prop of['map','normalMap'])if(ma[prop])mismatch.maps+=countMismatch(ma[prop].image.data,mb[prop].image.data);
}
for(const [label,n]of Object.entries(mismatch))assert.equal(n,0,`${label} byte/parameter identity`);
let finiteValues=0,invalidIndices=0;
for(const mesh of candidate.children){
 for(const a of Object.values(mesh.geometry.attributes))for(const x of a.array){assert(Number.isFinite(x));finiteValues++;}
 for(const x of mesh.geometry.index.array)if(x<0||x>=mesh.geometry.attributes.position.count)invalidIndices++;
}
assert.equal(invalidIndices,0);
const detail=candidate.children[2].geometry,p=detail.attributes.position,n=detail.attributes.normal,indices=detail.index.array;
let degenerates=0,minArea=Infinity,minNormalLength=Infinity,maxNormalLength=0,wrongFiberLinks=0;
for(let i=metrics.indexFirst;i<indices.length;i+=3){
 const a=indices[i],b=indices[i+1],c=indices[i+2];
 const fiber=Math.floor((a-metrics.vertexFirst)/62);
 if(Math.floor((b-metrics.vertexFirst)/62)!==fiber||Math.floor((c-metrics.vertexFirst)/62)!==fiber)wrongFiberLinks++;
 const ax=p.getX(b)-p.getX(a),ay=p.getY(b)-p.getY(a),az=p.getZ(b)-p.getZ(a),bx=p.getX(c)-p.getX(a),by=p.getY(c)-p.getY(a),bz=p.getZ(c)-p.getZ(a);
 const area=.5*Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx);minArea=Math.min(minArea,area);if(area<1e-14)degenerates++;
}
for(let i=metrics.vertexFirst;i<p.count;i++){const length=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));minNormalLength=Math.min(minNormalLength,length);maxNormalLength=Math.max(maxNormalLength,length);}
assert.equal(degenerates,0);assert.equal(wrongFiberLinks,0);assert(minNormalLength>.9999&&maxNormalLength<1.0001);
let foreheadProbes=0,minForeheadGap=Infinity,foreheadPenetrations=0,maxAdjacentTangentAngle=0;
const raw=candidate.__newFiberRaw;
for(let i=0;i<raw.length;i+=3){
 const x=raw[i],y=raw[i+1],z=raw[i+2];
 if(Math.abs(x)<.83&&y>.24&&y<1.40&&z>.20){const gap=z-candidate.__forehead(x,y);foreheadProbes++;minForeheadGap=Math.min(minForeheadGap,gap);if(gap<0)foreheadPenetrations++;}
}
assert.equal(foreheadPenetrations,0);
const center=(fiber,row)=>{const at=(fiber*62+row*2)*3;return new V((raw[at]+raw[at+3])*.5,(raw[at+1]+raw[at+4])*.5,(raw[at+2]+raw[at+5])*.5);};
let normalFlips=0,largeTangentTurns=0,minAdjacentNormalDot=1;const kinkRecords=[];
for(let fiber=0;fiber<10500;fiber++){
 let before=center(fiber,1).sub(center(fiber,0)).normalize();
 for(let row=1;row<30;row++){
  const after=center(fiber,row+1).sub(center(fiber,row)).normalize(),angle=Math.acos(Math.max(-1,Math.min(1,before.dot(after))));maxAdjacentTangentAngle=Math.max(maxAdjacentTangentAngle,angle);if(angle>.50){largeTangentTurns++;kinkRecords.push({fiber,row,angle,point:center(fiber,row)});}before=after;
 }
 for(let row=0;row<30;row++){
  const a=metrics.vertexFirst+fiber*62+row*2,b=a+2,dot=n.getX(a)*n.getX(b)+n.getY(a)*n.getY(b)+n.getZ(a)*n.getZ(b);minAdjacentNormalDot=Math.min(minAdjacentNormalDot,dot);if(dot<0)normalFlips++;
 }
}
assert.equal(normalFlips,0,'No abrupt strand normal reversals');
if(largeTangentTurns)console.log(JSON.stringify({kinkRecords,maxAdjacentTangentAngle}));
assert.equal(largeTangentTurns,0,'No large geometric strand kinks');
const bytes=root=>root.children.reduce((sum,m)=>sum+m.geometry.index.array.byteLength+Object.values(m.geometry.attributes).reduce((s,a)=>s+a.array.byteLength,0),0);
const actualBytes=bytes(candidate)-bytes(baseline),actualTriangles=candidate.userData.triangles-baseline.userData.triangles;
assert.equal(actualBytes,metrics.addedTypedGeometryBytes);assert.equal(actualTriangles,630000);
assert(actualBytes<=40*1048576);assert(actualTriangles<=750000);
const cpu=process.cpuUsage(cpuStart),memory=process.memoryUsage(),usage=process.resourceUsage();
const result={candidate:91,native:false,scoreUnchanged:76,sourceIsolation:true,metrics,mismatch,finiteValues,topology:{invalidIndices,degenerates,minArea,wrongFiberLinks,minNormalLength,maxNormalLength,normalFlips,minAdjacentNormalDot,maxAdjacentTangentAngle,largeTangentTurns},sampledForeheadClearance:{foreheadProbes,minForeheadGap,foreheadPenetrations},cost:{addedTriangles:actualTriangles,addedTypedGeometryBytes:actualBytes,addedTypedGeometryMiB:actualBytes/1048576,addedMeshes:0,materialChanges:0,perFrameWork:0,totalHairTriangles:candidate.userData.triangles,totalHairGeometryMiB:bytes(candidate)/1048576,constructionMs,totalAuditWallMs:performance.now()-start,totalAuditCpuMs:(cpu.user+cpu.system)/1000},memoryMiB:{...Object.fromEntries(Object.entries(memory).map(([k,v])=>[k,+(v/1048576).toFixed(1)])),peakRSS:+(usage.maxRSS/1024).toFixed(1)},limitations:['Source-only math harness; native Three/WebGPU render remains required.','Forehead clearance is sampled against the authored head field; it is not a global self-intersection proof.','More coverage can broaden fine-material highlights. Do not accept without front/detail and both side/back native comparison.']};
fs.writeFileSync('review/crown-fiber91-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
