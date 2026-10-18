import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sourceEar,sourceHeadSide} from './near-ear115-source.mjs';
import {Matrix4,I,mul,T,RY,RZ,point,object,attach,hash,read,matrixCount,sha} from './torso-depth110-harness.mjs';

const sourceText=fs.readFileSync('review/near-ear-candidate115.js','utf8');
const {applyNearEarYaw115,sample}=new Function('Matrix4',read('review/near-ear-candidate115.js')+'\nreturn {applyNearEarYaw115,sample};')(Matrix4);
const cpuStart=process.cpuUsage(),started=performance.now(),out=new Float64Array(8);
const warp=(p,degrees)=>{sample(p[0],p[2],degrees*Math.PI/180,out);return[out[0],p[1],out[1]];};
const nearBase=sourceEar(-1),farBase=sourceEar(1),faceBase=sourceHeadSide();
const zeroHead={isObject3D:true,traverse(){throw new Error('zero traversed');},updateWorldMatrix(){throw new Error('zero updated matrices');}},allocations=matrixCount(),zero=applyNearEarYaw115(zeroHead);
assert.equal(zero,applyNearEarYaw115(zeroHead,{degrees:0}));assert.equal(allocations,matrixCount());assert(Object.isFrozen(zero));

function expressedIn(geometry,matrix){
 const g=geometry.clone(),p=g.getAttribute('position'),n=g.getAttribute('normal'),inverse=matrix.clone().invert(),m=matrix.elements;
 for(let i=0;i<p.count;i++){
  p.setXYZ(i,...point(inverse,[p.getX(i),p.getY(i),p.getZ(i)]));
  if(n){const x=n.getX(i),y=n.getY(i),z=n.getZ(i),a=m[0]*x+m[1]*y+m[2]*z,b=m[4]*x+m[5]*y+m[6]*z,c=m[8]*x+m[9]*y+m[10]*z,l=Math.hypot(a,b,c);if(l)n.setXYZ(i,a/l,b/l,c/l);}
 }return g;
}
function fixture(internal=I(),{shared=false}={}){
 const outer=mul(T(.21,-.37,.52),mul(RY(.28),RZ(-.13))),head=object('anatomical-head',outer),left=object('left-ear',outer),right=object('right-ear',outer);head.add(left,right);
 const nearGeometry=expressedIn(nearBase.geometry,internal),near=attach(left,'ear-continuous-anatomical-shell',nearGeometry,mul(outer,internal),nearBase.material);
 const far=attach(right,'ear-continuous-anatomical-shell',shared?nearGeometry:farBase.geometry.clone(),outer,farBase.material),face=attach(head,'continuous-face',faceBase.clone(),outer);
 return{head,near,far,face,internal};
}
function snapshot(mesh){const g=mesh.geometry;return{mesh,g,material:mesh.material,attrs:Object.fromEntries(Object.entries(g.attributes).map(([k,a])=>[k,{ref:a,bytes:hash(a.array),array:a.array.slice()}])),index:g.index,indexHash:hash(g.index.array)};}
function checkOriginal(old){assert.equal(old.mesh.material,old.material);for(const[k,a]of Object.entries(old.attrs))assert.equal(hash(old.g.getAttribute(k).array),a.bytes);assert.equal(hash(old.g.index.array),old.indexHash);}
function topology(geometry){
 const idx=geometry.index,edges=new Map();let signedVolume=0,minArea=Infinity;const p=geometry.getAttribute('position');
 for(let i=0;i<idx.count;i+=3){
  const a=idx.getX(i),b=idx.getX(i+1),c=idx.getX(i+2);
  for(const[u,v]of[[a,b],[b,c],[c,a]]){const key=u<v?u+','+v:v+','+u;edges.set(key,(edges.get(key)||0)+1);}
  const ax=p.getX(a),ay=p.getY(a),az=p.getZ(a),bx=p.getX(b),by=p.getY(b),bz=p.getZ(b),cx=p.getX(c),cy=p.getY(c),cz=p.getZ(c);
  signedVolume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
  const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az;minArea=Math.min(minArea,Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)/2);
 }
 return{vertices:p.count,triangles:idx.count/3,edges:edges.size,badEdgeIncidences:[...edges.values()].filter(n=>n!==2).length,euler:p.count-edges.size+idx.count/3,signedVolume,minimumTriangleArea:minArea};
}
function projection(p,matrix){
 const camera=mul(RY(.16),RZ(-.17)),mins=[Infinity,Infinity],maxs=[-Infinity,-Infinity];
 for(let i=0;i<p.count;i++){const q=point(camera,point(matrix,[p.getX(i),p.getY(i),p.getZ(i)]));for(let k=0;k<2;k++){mins[k]=Math.min(mins[k],q[k]);maxs[k]=Math.max(maxs[k],q[k]);}}
 return{min:mins,max:maxs,width:maxs[0]-mins[0],height:maxs[1]-mins[1],scope:'Unoccluded whole-shell orthographic bbox; facial/hair occlusion is not predicted.'};
}

const matrixCases=[I(),new Matrix4([1.12,.09,.03,0,.12,.83,-.05,0,.06,.08,1.24,0,.04,-.03,.02,1]),new Matrix4([-1.14,.07,.02,0,.1,1.12,.04,0,.03,.11,.81,0,.04,-.03,.02,1])];
const configs=[{degrees:-15,matrix:0},{degrees:-25,matrix:0},{degrees:-35,matrix:0},{degrees:-25,matrix:1},{degrees:-25,matrix:2}];
const cases=[];let maxNormalAngle=0,maxPositionError=0,maxYError=0,maxEdgeInterpolationError=0;
for(const cfg of configs){
 const f=fixture(matrixCases[cfg.matrix],{shared:cfg.matrix===1}),nearBefore=snapshot(f.near),farBefore=snapshot(f.far),faceBefore=snapshot(f.face),oldTopology=topology(f.near.geometry),beforeProjection=projection(f.near.geometry.getAttribute('position'),f.internal),metrics=applyNearEarYaw115(f.head,{degrees:cfg.degrees});
 checkOriginal(nearBefore);checkOriginal(farBefore);checkOriginal(faceBefore);assert.equal(f.far.geometry,farBefore.g);assert.equal(f.face.geometry,faceBefore.g);assert.notEqual(f.near.geometry,nearBefore.g);
 const g=f.near.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal'),inverse=f.internal.clone().invert();
 assert.equal(g.index,nearBefore.index);for(const k of['uv','color']){assert.equal(g.getAttribute(k),nearBefore.attrs[k].ref);assert.equal(hash(g.getAttribute(k).array),nearBefore.attrs[k].bytes);}
 let pinnedByteChanges=0,nonfinite=0,normalError=0,maxDeltaZ=-Infinity,minDeltaZ=Infinity;
 for(let i=0;i<p.count;i++){
  const old=Array.from(nearBefore.attrs.position.array.subarray(i*3,i*3+3)),q=point(f.internal,old),a=point(f.internal,[p.getX(i),p.getY(i),p.getZ(i)]),expected=warp(q,cfg.degrees),oldN=Array.from(nearBefore.attrs.normal.array.subarray(i*3,i*3+3));
  maxYError=Math.max(maxYError,Math.abs(a[1]-q[1]));maxPositionError=Math.max(maxPositionError,...a.map((v,k)=>Math.abs(v-expected[k])));maxDeltaZ=Math.max(maxDeltaZ,a[2]-q[2]);minDeltaZ=Math.min(minDeltaZ,a[2]-q[2]);
  if(q[0]>=-.790)for(let k=0;k<3;k++)if(p.array[i*3+k]!==old[k]||n.array[i*3+k]!==oldN[k])pinnedByteChanges++;
  if(!Number.isFinite(a[0]+a[1]+a[2]+n.getX(i)+n.getY(i)+n.getZ(i)))nonfinite++;
  const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(l)normalError=Math.max(normalError,Math.abs(l-1));
  if(i%41===0){
   const e=1e-5,jac=Array.from({length:3},(_,axis)=>{const a=old.slice(),b=old.slice();a[axis]+=e;b[axis]-=e;const aa=point(inverse,warp(point(f.internal,a),cfg.degrees)),bb=point(inverse,warp(point(f.internal,b),cfg.degrees));return aa.map((v,k)=>(v-bb[k])/(2*e));});
   const J=new Matrix4([jac[0][0],jac[0][1],jac[0][2],0,jac[1][0],jac[1][1],jac[1][2],0,jac[2][0],jac[2][1],jac[2][2],0,0,0,0,1]).invert().elements;
   const want=[J[0]*oldN[0]+J[1]*oldN[1]+J[2]*oldN[2],J[4]*oldN[0]+J[5]*oldN[1]+J[6]*oldN[2],J[8]*oldN[0]+J[9]*oldN[1]+J[10]*oldN[2]],have=[n.getX(i),n.getY(i),n.getZ(i)],dot=want.reduce((sum,v,k)=>sum+v*have[k],0)/(Math.hypot(...want)*Math.hypot(...have));maxNormalAngle=Math.max(maxNormalAngle,Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI);
  }
 }
 const idx=g.index;let edgeError=0;
 if(cfg.matrix===0)for(let k=0;k<idx.count;k+=3)for(const [a,b]of[[idx.getX(k),idx.getX(k+1)],[idx.getX(k+1),idx.getX(k+2)],[idx.getX(k+2),idx.getX(k)]]){
  const orig=nearBefore.attrs.position.array,mid=[(orig[a*3]+orig[b*3])*.5,(orig[a*3+1]+orig[b*3+1])*.5,(orig[a*3+2]+orig[b*3+2])*.5],exact=warp(mid,cfg.degrees),interp=[(p.getX(a)+p.getX(b))*.5,(p.getY(a)+p.getY(b))*.5,(p.getZ(a)+p.getZ(b))*.5];edgeError=Math.max(edgeError,Math.hypot(...interp.map((v,i)=>v-exact[i])));
 }
 maxEdgeInterpolationError=Math.max(maxEdgeInterpolationError,edgeError);
 const afterTopology=topology(g);assert.equal(afterTopology.badEdgeIncidences,0);assert.equal(afterTopology.euler,2);assert(afterTopology.minimumTriangleArea>0);assert.equal(afterTopology.vertices,oldTopology.vertices);assert.equal(afterTopology.triangles,oldTopology.triangles);assert(afterTopology.signedVolume/oldTopology.signedVolume>.60);
 assert.equal(pinnedByteChanges,0);assert.equal(nonfinite,0);assert(normalError<2e-6);assert(maxDeltaZ<3e-7);assert(metrics.maximumPosteriorDisplacement>0);assert.equal(metrics.supportedVerticesMoved,0);
 const posHash=hash(p.array),normalHash=hash(n.array);assert.equal(applyNearEarYaw115(f.head,{degrees:cfg.degrees}),metrics);assert.throws(()=>applyNearEarYaw115(f.head,{degrees:0}),/freshly built head/);assert.equal(hash(p.array),posHash);assert.equal(hash(n.array),normalHash);
 cases.push({...cfg,metrics,pinnedByteChanges,normalError,beforeProjection,afterProjection:projection(p,f.internal),topology:afterTopology,volumeRatio:afterTopology.signedVolume/oldTopology.signedVolume,maximumEdgeInterpolationError:edgeError});global.gc?.();
}
assert(maxPositionError<3e-7);assert(maxYError<2e-7);assert(maxNormalAngle<.0002);

// An intentionally unsupported pin configuration must fail before replacing
// geometry. This checks actual face support rather than only the X constant.
for(const mode of['missing-face','bad-attachment','late-clone-failure','nonfinite-normal']){
 const f=fixture(),old=snapshot(f.near);
 if(mode==='missing-face')f.face.name='not-a-face';
 if(mode==='bad-attachment'){
  const p=f.face.geometry.getAttribute('position');let at=0;for(let i=1;i<p.count;i++)if(p.getX(i)<p.getX(at))at=i;
  f.near.geometry.getAttribute('position').setXYZ(0,p.getX(at)+.001,p.getY(at),p.getZ(at));
 }
 if(mode==='late-clone-failure')f.near.geometry.clone=()=>{throw new Error('intentional clone failure');};
 if(mode==='nonfinite-normal')f.near.geometry.getAttribute('normal').array[0]=NaN;
 const positionHash=hash(f.near.geometry.getAttribute('position').array),normalHash=hash(f.near.geometry.getAttribute('normal').array);assert.throws(()=>applyNearEarYaw115(f.head,{degrees:-25}));assert.equal(f.near.geometry,old.g);assert.equal(hash(f.near.geometry.getAttribute('position').array),positionHash);assert.equal(hash(f.near.geometry.getAttribute('normal').array),normalHash);
}
const cpu=process.cpuUsage(cpuStart),result={audit:'near-ear115-source',sourceOnly:true,native:false,candidate:{bytes:Buffer.byteLength(sourceText),sha256:sha(sourceText)},sourceInputs:Object.fromEntries(['src/ear.js','src/face.js','src/portrait-proportions.js'].map(p=>[p,{sha256:sha(fs.readFileSync(p,'utf8'))}])),zeroNoAllocationOrTraversal:true,sameAngleByteIdempotent:true,differentAngleRejected:true,atomicFailures:4,sharedGeometryIsolated:true,faceAndFarEarUnchanged:true,topologyColorUVIndexProtected:true,maximumPositionMapError:maxPositionError,maximumHeadYError:maxYError,maximumFiniteDifferenceNormalAngleDegrees:maxNormalAngle,maximumEdgeInterpolationError:maxEdgeInterpolationError,cases,limitations:['Source harness implements centripetal Catmull-Rom and200-sample arc-length lookup; native Three remains authoritative for exact rendering and geometry rounding.','Source pigment offsetHSL is stubbed; these tests establish unchanged color/UV attribute references, and the native test hashes actual accepted70 color bytes.','The face support grid is the original primary-face source with portraitY/50; only negative-X triangles are retained. Eye holes, far ear bed and lower-cheek taper lie outside the measured near-ear support region.','Closed topology, positive sampled Jacobians and dense edge probes do not replace native checks for cartilage shading, pinching, scalp burial or hair occlusion.','Projected bounds include the full unoccluded shell and cannot establish visible reference likeness.'],resources:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024}};
fs.writeFileSync('review/near-ear115-source-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:'passed',candidate:result.candidate,maxPositionError,maxYError,maxNormalAngle,maxEdgeInterpolationError,cases:cases.map(c=>({degrees:c.degrees,matrix:c.matrix,metrics:c.metrics,widthBefore:c.beforeProjection.width,widthAfter:c.afterProjection.width,volumeRatio:c.volumeRatio,edgeError:c.maximumEdgeInterpolationError})),resources:result.resources}));
