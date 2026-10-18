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

const baseline=construct('review/hair-groom-candidate86.js',{shoulderContact:.5});
const buildStart=performance.now(),candidate=construct('review/hair-groom-candidate94.js',{shoulderContact:.5}),buildMs=performance.now()-buildStart;
let prefixByteMismatch=0,finite=true,changedIndices=0;const additions=[];
for(let m=0;m<baseline.children.length;m++){
 const a=baseline.children[m].geometry,b=candidate.children[m].geometry;
 for(const key of Object.keys(a.attributes)){
  const old=a.attributes[key].array,now=b.attributes[key].array,oa=new Uint8Array(old.buffer,old.byteOffset,old.byteLength),nb=new Uint8Array(now.buffer,now.byteOffset,now.byteLength);
  assert(nb.length>=oa.length);for(let i=0;i<oa.length;i++)if(oa[i]!==nb[i])prefixByteMismatch++;
 }
 for(let i=0;i<a.index.array.length;i++)if(a.index.array[i]!==b.index.array[i])changedIndices++;
 for(const attr of Object.values(b.attributes))for(const value of attr.array)if(!Number.isFinite(value))finite=false;
 additions.push({name:candidate.children[m].name,vertices:b.attributes.position.count-a.attributes.position.count,triangles:(b.index.count-a.index.count)/3});
}
assert.equal(prefixByteMismatch,0);assert.equal(changedIndices,0);assert(finite);
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function finalPoint(p){const w=1-smooth(-1.64,.38,p.y),ay=-.16*w,az=.17*w,x=p.x*Math.cos(ay)+p.z*Math.sin(ay),z=-p.x*Math.sin(ay)+p.z*Math.cos(ay),out=new V(x*Math.cos(az)-p.y*Math.sin(az),x*Math.sin(az)+p.y*Math.cos(az),z);const field=candidate.__contact,d=field.shift(out.x,out.y,out.z);return out.addScaledVector(new V(...field.axis),d);}
const mass=candidate.children[1].geometry,first=baseline.children[1].geometry.attributes.position.count,bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
let minNewX=Infinity,minNormalLength=Infinity,maxNormalLength=0,minTriangleArea=Infinity,zeroTriangles=0;
for(let i=first;i<mass.attributes.position.count;i++){
 for(let d=0;d<3;d++){const v=mass.attributes.position.array[i*3+d];bounds.min[d]=Math.min(bounds.min[d],v);bounds.max[d]=Math.max(bounds.max[d],v);}
 const n=mass.attributes.normal,l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));minNormalLength=Math.min(minNormalLength,l);maxNormalLength=Math.max(maxNormalLength,l);
 minNewX=Math.min(minNewX,mass.attributes.position.getX(i));
}
for(let i=baseline.children[1].geometry.index.count;i<mass.index.count;i+=3){
 const ids=[mass.index.array[i],mass.index.array[i+1],mass.index.array[i+2]],points=ids.map(j=>new V(mass.attributes.position.getX(j),mass.attributes.position.getY(j),mass.attributes.position.getZ(j))),area=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).lengthSq()**.5*.5;minTriangleArea=Math.min(minTriangleArea,area);if(area<1e-13)zeroTriangles++;
}
const centerRows=[];let upwardSteps=0,maxUpwardStep=0,maxCenterTurn=0;
for(let gi=276;gi<candidate.__guides.length;gi++){
 const g=candidate.__guides[gi],row={guide:gi,headPoints:[]};let prev=null,prevD=null;
 for(let j=0;j<=400;j++){
  const p=finalPoint(g.c.getPoint(j/400));
  if(prev){const d=p.clone().sub(prev),l=d.lengthSq()**.5;if(p.y>prev.y+.000001){upwardSteps++;maxUpwardStep=Math.max(maxUpwardStep,p.y-prev.y);}if(prevD&&l>1e-8)maxCenterTurn=Math.max(maxCenterTurn,Math.acos(Math.max(-1,Math.min(1,d.clone().normalize().dot(prevD))))*180/Math.PI);prevD=d.normalize();}
  if(j%80===0)row.headPoints.push({t:j/400,x:p.x,y:p.y,z:p.z});prev=p;
 }
 centerRows.push(row);
}
const result={sourceHarness:true,native:false,base:'frozen86',shoulderContact:.5,finite,prefixByteMismatch,changedOriginalIndices:changedIndices,geometry:{triangles:candidate.userData.triangles,MiB:candidate.userData.geometryMiB,constructionMs:candidate.userData.constructionMs},buildMs,additions,temple:candidate.userData.farTempleLayer,newMassBounds:bounds,minNewX,normalLength:{min:minNormalLength,max:maxNormalLength},minTriangleArea,zeroTriangles,upwardSteps,maxUpwardStep,maxCenterTurnDegrees:maxCenterTurn,contact:candidate.userData.shoulderContact,centerRows};
fs.writeFileSync('review/hair-temple94-source-audit.json',JSON.stringify(result,null,2)+'\n');
const {centerRows:rows,...summary}=result;console.log(JSON.stringify(summary));
