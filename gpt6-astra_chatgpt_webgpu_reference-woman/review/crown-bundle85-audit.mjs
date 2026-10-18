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
const construct=(file,options={})=>{
 let source=read(file),candidate=source.includes('addCrownBundleLayer85');
 source=source.replace(' // Existing crown fibers gather', ' const __fiberFirst=detail.p.length/3;\n // Existing crown fibers gather');
 source=source.replace(' // Round cores and sparse companions', ' const __fiberEnd=detail.p.length/3;\n // Round cores and sparse companions');
 if(candidate)source=source.replace('  const bundle85=crownBundleLayer85.assign(side,u,k);','  const bundle85=crownBundleLayer85.assign(side,u,k);\n (root.__fiberRecords??=[]).push({side,k,u,phase,end,host:bundle85});');
 const expose='root.__fiberRange=[__fiberFirst,__fiberEnd];root.__guideOrder=guides.map(g=>({id:g.id,kind:g.kind,root:g.scalpRoot}));';
 source=source.replace('return root;',expose+(candidate?'root.__crownRaw=crownBatch.p;root.__crownLayer=crownBundleLayer85;root.__crown=crown;root.__forehead=forehead;root.__fiberRaw=Float64Array.from(detail.p.slice(__fiberFirst*3,__fiberEnd*3));':'')+'return root;');
 return new Function('THREE','faceZ','createHairContact',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact)(options);
};
const start=performance.now(),cpuStart=process.cpuUsage();
const baseline=construct('review/hair-groom-candidate83.js');
const candidateStart=performance.now();
const candidate=construct('review/hair-groom-candidate85.js');
const constructionMs=performance.now()-candidateStart;
const metrics=candidate.userData.crownBundleStructure;
assert.equal(metrics.bundles,48);assert.equal(metrics.addedVertices,17808);assert.equal(metrics.addedTriangles,31488);
assert.equal(candidate.children.length,baseline.children.length);
assert.deepEqual(candidate.__guideOrder,baseline.__guideOrder);
assert.deepEqual(candidate.userData.frontRootJoins,baseline.userData.frontRootJoins);
assert.equal(candidate.userData.shoulderContact,undefined,'Contact remains off by default');
const mismatches={mass:0,fringe:0,wisps:0,oldCrown:0,unrelatedDetail:0,detailColorsUV:0};
function countMismatch(a,b,first=0,end=a.length){let n=0;for(let i=first;i<end;i++)if(a[i]!==b[i])n++;return n;}
function sameMesh(index,label){
 const a=baseline.children[index].geometry,b=candidate.children[index].geometry;
 for(const key of Object.keys(a.attributes)){assert.equal(a.attributes[key].array.length,b.attributes[key].array.length);mismatches[label]+=countMismatch(a.attributes[key].array,b.attributes[key].array);}
 assert.equal(a.index.count,b.index.count);mismatches[label]+=countMismatch(a.index.array,b.index.array);
}
sameMesh(1,'mass');sameMesh(3,'fringe');sameMesh(4,'wisps');
const oldCrown=baseline.children[0].geometry,newCrown=candidate.children[0].geometry;
for(const key of Object.keys(oldCrown.attributes))mismatches.oldCrown+=countMismatch(oldCrown.attributes[key].array,newCrown.attributes[key].array);
mismatches.oldCrown+=countMismatch(oldCrown.index.array,newCrown.index.array);
const oldDetail=baseline.children[2].geometry,newDetail=candidate.children[2].geometry;
assert.deepEqual(candidate.__fiberRange,baseline.__fiberRange);
for(const key of Object.keys(oldDetail.attributes)){
 const a=oldDetail.attributes[key],b=newDetail.attributes[key];assert.equal(a.array.length,b.array.length);
 if(key==='position'||key==='normal'){
  mismatches.unrelatedDetail+=countMismatch(a.array,b.array,0,candidate.__fiberRange[0]*a.itemSize);
  mismatches.unrelatedDetail+=countMismatch(a.array,b.array,candidate.__fiberRange[1]*a.itemSize,a.array.length);
 }else mismatches.detailColorsUV+=countMismatch(a.array,b.array);
}
mismatches.unrelatedDetail+=countMismatch(oldDetail.index.array,newDetail.index.array);
for(const [key,value]of Object.entries(mismatches))assert.equal(value,0,`${key} must stay byte-identical`);
assert.equal(candidate.userData.individualStrands,baseline.userData.individualStrands);
for(let i=0;i<candidate.children.length;i++){
 const a=baseline.children[i].material,b=candidate.children[i].material;
 for(const key of['roughness','specularIntensity','envMapIntensity','anisotropy','alphaTest','alphaToCoverage','transparent','opacity','depthWrite','side'])assert.equal(a[key],b[key],`Unchanged material ${i}:${key}`);
 for(const key of['map','normalMap'])if(a[key])assert.equal(countMismatch(a[key].image.data,b[key].image.data),0,`Unchanged procedural map ${i}:${key}`);
}
let finiteValues=0;
for(const mesh of candidate.children){
 const geometry=mesh.geometry;
 for(const attr of Object.values(geometry.attributes))for(const value of attr.array){assert(Number.isFinite(value));finiteValues++;}
 for(const value of geometry.index.array)assert(value>=0&&value<geometry.attributes.position.count);
}
const p=newCrown.attributes.position,n=newCrown.attributes.normal,idx=newCrown.index.array;
const groups=candidate.__crownLayer.groups.flat();
let badEdges=0,badDirections=0,degenerateTriangles=0,minTriangleArea=Infinity,minSignedVolume=Infinity,inwardBundles=0;
for(const g of groups){
 const edges=new Map(),canonical=i=>{const local=i-g.first;if(local<41*9&&local%9===8)return i-8;return i;};let signedVolume=0;
 for(let at=g.indexFirst;at<g.indexFirst+1968;at+=3){
  const tri=[idx[at],idx[at+1],idx[at+2]],a=tri[0],b=tri[1],c=tri[2];
  const x1=p.getX(b)-p.getX(a),y1=p.getY(b)-p.getY(a),z1=p.getZ(b)-p.getZ(a),x2=p.getX(c)-p.getX(a),y2=p.getY(c)-p.getY(a),z2=p.getZ(c)-p.getZ(a);
  const area=.5*Math.hypot(y1*z2-z1*y2,z1*x2-x1*z2,x1*y2-y1*x2);minTriangleArea=Math.min(minTriangleArea,area);if(area<1e-13)degenerateTriangles++;
  signedVolume+=(p.getX(a)*(p.getY(b)*p.getZ(c)-p.getZ(b)*p.getY(c))+p.getY(a)*(p.getZ(b)*p.getX(c)-p.getX(b)*p.getZ(c))+p.getZ(a)*(p.getX(b)*p.getY(c)-p.getY(b)*p.getX(c)))/6;
  for(let k=0;k<3;k++){const x=canonical(tri[k]),y=canonical(tri[(k+1)%3]),key=x<y?`${x}:${y}`:`${y}:${x}`,e=edges.get(key)??[0,0];e[0]++;e[1]+=x<y?1:-1;edges.set(key,e);}
 }
 for(const [count,direction]of edges.values()){if(count!==2)badEdges++;if(direction!==0)badDirections++;}
 // The thin tubes follow a curved bed and need not be convex in cross section.
 // Closed consistent winding plus positive signed volume determines orientation.
 minSignedVolume=Math.min(minSignedVolume,signedVolume);if(signedVolume<=0){inwardBundles++;console.log(JSON.stringify({negativeBundleVolume:{side:g.side,u:g.u,v0:g.v0,v1:g.v1,halfWidth:g.halfWidth,depth:g.depth,lift:g.lift,signedVolume}}));}
}
assert.equal(badEdges,0,'Closed manifold after each ring seam is identified');
assert.equal(badDirections,0,'Consistent face winding');
assert.equal(degenerateTriangles,0,'No zero-area bundle triangles');
assert.equal(inwardBundles,0,'All closed bundle shells must have outward orientation');
let foreheadProbes=0,minForeheadGap=Infinity,foreheadPenetrations=0;
for(let i=metrics.vertexFirst;i<metrics.vertexFirst+metrics.addedVertices;i++){
 const x=candidate.__crownRaw[i*3],y=candidate.__crownRaw[i*3+1],z=candidate.__crownRaw[i*3+2];
 if(Math.abs(x)<.83&&y>.24&&y<1.40&&z>.20){const gap=z-candidate.__forehead(x,y);foreheadProbes++;minForeheadGap=Math.min(minForeheadGap,gap);if(gap<0)foreheadPenetrations++;}
}
assert.equal(foreheadPenetrations,0,'New bundles cannot penetrate the forehead');
const envelope=geometry=>{
 const p=geometry.attributes.position,b={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
 const cr=Math.cos(-.17),sr=Math.sin(-.17),cy=Math.cos(.16),sy=Math.sin(.16);
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),px=(x*cr-y*sr)*cy+z*sy,py=x*sr+y*cr;b.minX=Math.min(b.minX,px);b.maxX=Math.max(b.maxX,px);b.minY=Math.min(b.minY,py);b.maxY=Math.max(b.maxY,py);}
 return b;
};
const beforeEnvelope=envelope(oldCrown),afterEnvelope=envelope(newCrown);
const expansion={left:Math.max(0,beforeEnvelope.minX-afterEnvelope.minX),right:Math.max(0,afterEnvelope.maxX-beforeEnvelope.maxX),top:Math.max(0,afterEnvelope.maxY-beforeEnvelope.maxY),bottom:Math.max(0,beforeEnvelope.minY-afterEnvelope.minY)};

// Intersect actual bundle triangles, independently of the analytic top surface.
const raw=candidate.__crownRaw;
function rayTriangle(o,d,a,b,c){
 const ax=raw[a*3],ay=raw[a*3+1],az=raw[a*3+2],e1x=raw[b*3]-ax,e1y=raw[b*3+1]-ay,e1z=raw[b*3+2]-az,e2x=raw[c*3]-ax,e2y=raw[c*3+1]-ay,e2z=raw[c*3+2]-az;
 const hx=d.y*e2z-d.z*e2y,hy=d.z*e2x-d.x*e2z,hz=d.x*e2y-d.y*e2x,det=e1x*hx+e1y*hy+e1z*hz;
 if(Math.abs(det)<1e-12)return Infinity;const inv=1/det,sx=o.x-ax,sy=o.y-ay,sz=o.z-az,u=(sx*hx+sy*hy+sz*hz)*inv;if(u<0||u>1)return Infinity;
 const qx=sy*e1z-sz*e1y,qy=sz*e1x-sx*e1z,qz=sx*e1y-sy*e1x,v=(d.x*qx+d.y*qy+d.z*qz)*inv;if(v<0||u+v>1)return Infinity;
 const t=(e2x*qx+e2y*qy+e2z*qz)*inv;return t>=0?t:Infinity;
}
let fiberProbes=0,fiberHits=0,minFiberGap=Infinity,maxFiberGap=-Infinity,fiberPenetrations=0;
const fiberFailures=[];
for(let k=0;k<candidate.__fiberRecords.length;k++){
 const record=candidate.__fiberRecords[k];if(!record.host)continue;const g=record.host.g;
 for(const row of[9,13,17]){
  const v=row/26*record.end,f=candidate.__crownLayer.sampleRow(g,v);
  if(v<g.v0+.14||v>g.v1-.14||f.visible<.999)continue;
  const section=Math.floor((v-g.v0)/(g.v1-g.v0)*40),begin=g.indexFirst+Math.max(0,section-2)*48,end=g.indexFirst+Math.min(40,section+3)*48;
  for(const side of[0,1]){
   const at=(k*54+row*2+side)*3,point=new V(candidate.__fiberRaw[at],candidate.__fiberRaw[at+1],candidate.__fiberRaw[at+2]),origin=point.clone().addScaledVector(f.n,.05),direction=f.n.clone().multiplyScalar(-1);let hit=Infinity;
   for(let t=begin;t<end;t+=3)hit=Math.min(hit,rayTriangle(origin,direction,idx[t],idx[t+1],idx[t+2]));
   fiberProbes++;if(!Number.isFinite(hit)||hit>.15)continue;
   const gap=hit-.05;fiberHits++;minFiberGap=Math.min(minFiberGap,gap);maxFiberGap=Math.max(maxFiberGap,gap);
   if(gap<-.00015){fiberPenetrations++;if(fiberFailures.length<8)fiberFailures.push({fiber:k,row,side,gap});}
  }
 }
}
assert(fiberHits>1000,'Sufficient independent fiber clearance samples');
assert.equal(fiberPenetrations,0,'Attached fibers must clear their actual host triangles');
const geometryBytes=mesh=>mesh.geometry.index.array.byteLength+Object.values(mesh.geometry.attributes).reduce((sum,a)=>sum+a.array.byteLength,0);
const totalBytes=root=>root.children.reduce((sum,m)=>sum+geometryBytes(m),0);
const cpu=process.cpuUsage(cpuStart);
const result={candidate:85,sourceHarness:true,native:false,scoreUnchanged:76,metrics,mismatches,finiteValues,topology:{badEdges,badDirections,degenerateTriangles,minTriangleArea,minSignedVolume,inwardBundles},foreheadClearance:{foreheadProbes,minForeheadGap,foreheadPenetrations},frontEnvelope:{before:beforeEnvelope,after:afterEnvelope,expansion},fiberClearance:{fiberProbes,fiberHits,minFiberGap,maxFiberGap,fiberPenetrations,fiberFailures},cost:{addedTypedGeometryBytes:totalBytes(candidate)-totalBytes(baseline),addedTriangles:candidate.userData.triangles-baseline.userData.triangles,crownIndexBytes:newCrown.index.array.BYTES_PER_ELEMENT,constructionMs,totalAuditWallMs:performance.now()-start,totalAuditCpuMs:(cpu.user+cpu.system)/1000},memoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([key,value])=>[key,+(value/1048576).toFixed(1)]))};
fs.writeFileSync('review/crown-bundle85-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
