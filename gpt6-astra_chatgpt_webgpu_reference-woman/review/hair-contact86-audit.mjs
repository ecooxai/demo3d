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
const createHairContact=new Function('sampleBlouseFrontAtXY',read('review/hair-contact-candidate86.js')+'\nreturn createHairContact;')(sampleBlouseFrontAtXY);
function construct(file,options={}){const source=read(file).replace('return root;','root.__guides=guides;root.__contact=typeof contact!=="undefined"?contact:null;return root;');return new Function('THREE','faceZ','createHairContact',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact)(options);}
const baseline=construct('review/hair-groom-candidate82.js');
let off=construct('review/hair-groom-candidate86.js',{shoulderContact:0});
let mismatch=0;
for(let i=0;i<baseline.children.length;i++)for(const key of Object.keys(baseline.children[i].geometry.attributes)){
 const a=baseline.children[i].geometry.attributes[key].array,b=off.children[i].geometry.attributes[key].array;assert.equal(a.byteLength,b.byteLength);
 const ab=new Uint8Array(a.buffer,a.byteOffset,a.byteLength),bb=new Uint8Array(b.buffer,b.byteOffset,b.byteLength);for(let j=0;j<ab.length;j++)if(ab[j]!==bb[j])mismatch++;
}
assert.equal(mismatch,0);off=null;global.gc?.();
const cpuStart=process.cpuUsage(),buildStart=performance.now(),fitted=construct('review/hair-groom-candidate86.js',{shoulderContact:1}),buildWall=performance.now()-buildStart,buildCpu=process.cpuUsage(cpuStart);
const yaw=.16,roll=-.17,cy=Math.cos(yaw),sy=Math.sin(yaw),cr=Math.cos(roll),sr=Math.sin(roll),bc=Math.cos(.045),bs=Math.sin(.045);
function model(p,i){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),rx=x*cr-y*sr;return{x:.26+rx*cy+z*sy,y:2.95+x*sr+y*cr,z:-rx*sy+z*cy};}
const field=fitted.__contact;
let maxXY=0,maxZ=0,finite=true,halfLinearity=0;
const changedMeshes=[];
for(let m=0;m<fitted.children.length;m++){
 const mesh=fitted.children[m],b=baseline.children[m].geometry.attributes.position,a=mesh.geometry.attributes.position;let altered=0;
 for(const attr of Object.values(mesh.geometry.attributes))for(const v of attr.array)if(!Number.isFinite(v))finite=false;
 for(let i=0;i<a.count;i++){const p=model(a,i),q=model(b,i);maxXY=Math.max(maxXY,Math.abs(p.x-q.x),Math.abs(p.y-q.y));maxZ=Math.max(maxZ,Math.abs(p.z-q.z));if(Math.abs(p.z-q.z)>1e-6)altered++;if(i%311===0)halfLinearity=Math.max(halfLinearity,Math.abs(field.atModel(q.x,q.y,q.z,.5)-field.atModel(q.x,q.y,q.z,1)*.5));}
 changedMeshes.push({name:mesh.name,altered});
}
assert(finite);assert(maxXY<1e-6);assert.equal(halfLinearity,0);
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const collar=(x,y)=>1-(1-smooth(.84,.98,Math.abs(x)))*smooth(.44,.53,y);
const a=fitted.children[1].geometry.attributes.position,b=baseline.children[1].geometry.attributes.position;
const ringArea=(p,first)=>{let x=0,y=0,z=0;for(let k=0;k<8;k++){const a=model(p,first+k),b=model(p,first+(k+1)%8);x+=(a.y-b.y)*(a.z+b.z);y+=(a.z-b.z)*(a.x+b.x);z+=(a.x-b.x)*(a.y+b.y);}return Math.hypot(x,y,z)/2;};
let probed=0,minGap=Infinity,penetrations=0,newPenetrations=0,excludedChanges=0,minRingRatio=Infinity,maxRingRatio=0,collapsedRings=0,rearAltered=0;
const failures=[],clearanceRows=[],inheritedGuide149=[];
for(let gid=0;gid<(process.argv.includes('--order-only')?0:fitted.__guides.length);gid++){
 const g=fitted.__guides[gid],rows=new Map();
 for(let j=0;j<=60;j++){
  const first=gid*549+j*9,p=model(a,first),old=model(b,first);
  if(gid===149&&j>=57){let minBefore=Infinity,minAfter=Infinity,maxShift=0;for(let k=0;k<8;k++){const q=model(a,first+k),r=model(b,first+k),x=bc*q.x+bs*(q.y-1),y=-bs*q.x+bc*(q.y-1)+1,hit=sampleBlouseFrontAtXY(x,y);if(hit){minBefore=Math.min(minBefore,(r.z-hit.point.z)*hit.normal.z);minAfter=Math.min(minAfter,(q.z-hit.point.z)*hit.normal.z);}maxShift=Math.max(maxShift,Math.abs(q.z-r.z));}inheritedGuide149.push({ring:j,minBefore,minAfter,maxShift});}
  if(Math.abs(p.z-old.z)>.000001&&(g.kind==='back'||g.kind==='inner-back'))rearAltered++;
  if(Math.abs(p.z-old.z)>.002){const before=ringArea(b,first),after=ringArea(a,first);if(before>1e-10){const ratio=after/before;minRingRatio=Math.min(minRingRatio,ratio);maxRingRatio=Math.max(maxRingRatio,ratio);if(ratio<.2)collapsedRings++;}}
  for(let k=0;k<8;k++){
   const i=first+k,p=model(a,i),old=model(b,i),pull=old.z-p.z;if(pull<.002)continue;
   const x=bc*p.x+bs*(p.y-1),y=-bs*p.x+bc*(p.y-1)+1;if(collar(x,y)<.00001){excludedChanges++;continue;}
   const hit=sampleBlouseFrontAtXY(x,y);if(!hit||hit.edgeWeight<.01)continue;
   const gap=(p.z-hit.point.z)*hit.normal.z,before=(old.z-hit.point.z)*hit.normal.z;probed++;minGap=Math.min(minGap,gap);
   if(gap<0){penetrations++;if(before>=0)newPenetrations++;if(failures.length<12)failures.push({gid,j,k,gap,before});}
   if(p.y<=1.3&&p.y>=-.15&&j/60<=.72&&collar(x,y)>.999&&hit.edgeWeight>.99&&pull>.01){const row=rows.get(j)??{after:Infinity,before:Infinity,guide:gid,ring:j};row.after=Math.min(row.after,gap);row.before=Math.min(row.before,before);rows.set(j,row);}
  }
 }
 clearanceRows.push(...rows.values());
}
clearanceRows.sort((a,b)=>a.after-b.after);
const backGap={rings:clearanceRows.length,medianAfter:clearanceRows[Math.floor(clearanceRows.length*.5)]?.after,p95After:clearanceRows[Math.floor(clearanceRows.length*.95)]?.after,maxAfter:clearanceRows.at(-1),maxBefore:Math.max(...clearanceRows.map(r=>r.before))};
// Same-XY depth order of actual MASS triangle hits, including distinct locks.
const nx=75,ny=57,xmin=-1.75,ymin=-.55,dx=3.70/nx,dy=2.40/ny,rays=Array.from({length:nx*ny},()=>[]),index=baseline.children[1].geometry.index.array;
const before=new Float64Array(b.count*3),afterZ=new Float64Array(a.count);
for(let i=0;i<b.count;i++){const p=model(b,i);before[i*3]=p.x;before[i*3+1]=p.y;before[i*3+2]=p.z;afterZ[i]=model(a,i).z;}
let rayHits=0;
for(let t=0;t<index.length;t+=3){
 const ids=[index[t],index[t+1],index[t+2]],a0=ids[0]*3,b0=ids[1]*3,c0=ids[2]*3,ax=before[a0],ay=before[a0+1],bx=before[b0],by=before[b0+1],cx=before[c0],cyy=before[c0+1];
 const den=(by-cyy)*(ax-cx)+(cx-bx)*(ay-cyy);if(Math.abs(den)<1e-12)continue;
 const xlo=Math.max(0,Math.ceil((Math.min(ax,bx,cx)-xmin)/dx-.5)),xhi=Math.min(nx-1,Math.floor((Math.max(ax,bx,cx)-xmin)/dx-.5)),ylo=Math.max(0,Math.ceil((Math.min(ay,by,cyy)-ymin)/dy-.5)),yhi=Math.min(ny-1,Math.floor((Math.max(ay,by,cyy)-ymin)/dy-.5));
 for(let j=ylo;j<=yhi;j++)for(let i=xlo;i<=xhi;i++){
  const x=xmin+(i+.5)*dx,y=ymin+(j+.5)*dy,u=((by-cyy)*(x-cx)+(cx-bx)*(y-cyy))/den,v=((cyy-ay)*(x-cx)+(ax-cx)*(y-cyy))/den,w=1-u-v;
  if(Math.min(u,v,w)<-1e-8)continue;
  const z=u*before[a0+2]+v*before[b0+2]+w*before[c0+2],f=u*afterZ[ids[0]]+v*afterZ[ids[1]]+w*afterZ[ids[2]];
  if(z<.10||z>1.4)continue;rays[j*nx+i].push({guide:Math.floor(t/3/960),triangle:t/3,z,f});rayHits++;
 }
}
let eligiblePairs=0,inversions=0,maxReversal=0,maxInterpolationError=0,hitRays=0,halfInversions=0,halfMaxReversal=0,halfAnyInversions=0,halfMinimumGap=Infinity,maximumOrderPreservingStrength=1;let worstInterpolation=null,worstReversal=null;const inversionExamples=[];
for(let k=0;k<rays.length;k++){
 const hits=rays[k];if(!hits.length)continue;hitRays++;hits.sort((a,b)=>a.z-b.z);
 const x=xmin+(k%nx+.5)*dx,y=ymin+(Math.floor(k/nx)+.5)*dy;
 for(const h of hits){const exact=h.z+field.atModel(x,y,h.z),error=Math.abs(h.f-exact);if(error>maxInterpolationError){maxInterpolationError=error;const t=h.triangle*3;worstInterpolation={x,y,...h,exact,error,vertices:[index[t],index[t+1],index[t+2]].map(i=>({x:before[i*3],y:before[i*3+1],z:before[i*3+2],after:afterZ[i]}))};}}
 for(let i=0;i<hits.length;i++)for(let j=i+1;j<hits.length;j++){
  const a=hits[i],b=hits[j];if(a.guide===b.guide||b.z-a.z<.003)continue;eligiblePairs++;
  const g0=b.z-a.z,dg=b.f-a.f-g0;if(dg<0)maximumOrderPreservingStrength=Math.min(maximumOrderPreservingStrength,g0/-dg);
  const half=(a.z+a.f-b.z-b.f)*.5;if(half>.001){halfInversions++;halfMaxReversal=Math.max(halfMaxReversal,half);}
  halfMinimumGap=Math.min(halfMinimumGap,-half);if(half>0)halfAnyInversions++;
  if(a.f-b.f>.001){inversions++;if(a.f-b.f>maxReversal){maxReversal=a.f-b.f;worstReversal={x,y,a,b};}if(inversionExamples.length<10)inversionExamples.push({x,y,a:a.guide,b:b.guide,before:b.z-a.z,after:b.f-a.f});}
 }
}
// Direct numerical verification of the global derivative and spatial shear.
let minDepthDerivative=Infinity,maxShear=0,seamError=0,maxDelta=0;
for(let j=0;j<=42;j++)for(let i=0;i<=62;i++)for(const z of[.20,.35,.50,.70,.90,1.10]){
 const x=-1.75+i*3.5/62,y=-.45+j*2.25/42,e=.0001,d=field.atModel(x,y,z),dd=1+(field.atModel(x,y,z+e)-field.atModel(x,y,z-e))/(2*e),gx=(field.atModel(x+e,y,z)-field.atModel(x-e,y,z))/(2*e),gy=(field.atModel(x,y+e,z)-field.atModel(x,y-e,z))/(2*e);minDepthDerivative=Math.min(minDepthDerivative,dd);maxShear=Math.max(maxShear,Math.hypot(gx,gy));maxDelta=Math.max(maxDelta,-d);
}
for(let j=3;j<51;j+=3)for(let i=3;i<61;i+=3){const bx=-1.92+i*.06,by=-1.50+j*.06,e=1e-7;for(const [vx,vy]of[[1,0],[0,1]]){const a=field.fieldAtBlouse(bx-vx*e,by-vy*e),b=field.fieldAtBlouse(bx+vx*e,by+vy*e);seamError=Math.max(seamError,Math.abs(a.depth-b.depth),Math.abs(a.weight-b.weight));}}
const result={sourceHarness:true,native:false,cloth:'frozen81',defaultByteMismatch:mismatch,finite,maxPosedXYChange:maxXY,maxDepthChange:maxZ,halfStrengthLinearityError:halfLinearity,changedMeshes,rearAlteredRings:rearAltered,geometry:{triangles:fitted.userData.triangles,MiB:fitted.userData.geometryMiB,constructionMs:fitted.userData.constructionMs},buildCost:{wallMs:buildWall,cpuMs:(buildCpu.user+buildCpu.system)/1000},contact:fitted.userData.shoulderContact,ringAudit:{probed,minGap,penetrations,newPenetrations,excludedChanges,minAreaRatio:minRingRatio,maxAreaRatio:maxRingRatio,collapsedRings,backGap,failures,inheritedGuide149},orderingAudit:{rays:hitRays,hits:rayHits,eligiblePairs,minimumOriginalGap:.003,countedReversalTolerance:.001,inversions,maxReversal,halfInversions,halfMaxReversal,halfAnyInversions,halfMinimumGap,maximumOrderPreservingStrength,maxInterpolationError,worstInterpolation,worstReversal,inversionExamples},fieldAudit:{minimumDepthDerivative:minDepthDerivative,maxXYShear:maxShear,maxDepthPull:maxDelta,cellBoundarySampleDifference:seamError},memoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,+(v/1048576).toFixed(1)]))};
fs.writeFileSync(process.argv.includes('--order-only')?'review/hair-contact86-order-audit.json':'review/hair-contact86-source-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
