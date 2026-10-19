import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
import {sourceEar,Matrix4} from './near-ear115-source.mjs';

const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
function construct(file,strength=0){
 let source=read(file);
 if(strength){source='const captured133=[];\n'+source;source=source.replace('  return final;','  captured133.push(final);return final;');source=source.replace(' return root;',' root.__paths133=captured133;return root;');}
 return new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118)({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:strength});
}
const start=performance.now(),cpu0=process.cpuUsage(),baseline=construct('src/hair-groom.js'),off=construct('review/hair-groom-candidate133.js'),on=construct('review/hair-groom-candidate133.js',1);
const meshReport=[];
for(let i=0;i<baseline.children.length;i++){
 const a=baseline.children[i].geometry,b=off.children[i].geometry,c=on.children[i].geometry,changes=[];
 for(const [key,attr]of Object.entries(a.attributes)){
  assert.equal(hash(attr.array),hash(b.attributes[key].array),`Off changed ${i}/${key}`);
  for(const v of c.attributes[key].array)assert(Number.isFinite(v));
  if(hash(attr.array)!==hash(c.attributes[key].array))changes.push(key);
  if(i!==3||!['position','normal'].includes(key))assert.equal(hash(attr.array),hash(c.attributes[key].array),`Protected ${i}/${key}`);
 }
 assert.equal(hash(a.index.array),hash(b.index.array));assert.equal(hash(a.index.array),hash(c.index.array));
 for(const key of['roughness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','alphaTest','transparent','opacity','side'])assert.equal(baseline.children[i].material[key],on.children[i].material[key]);
 for(const key of['map','normalMap'])if(baseline.children[i].material[key])assert.equal(hash(baseline.children[i].material[key].image.data),hash(on.children[i].material[key].image.data));
 meshReport.push({name:on.children[i].name,vertices:c.attributes.position.count,triangles:c.index.count/3,changedAttributes:changes});
}
const range=on.userData.diagonalFringe133.vertices;
for(const key of['position','normal'])assert.equal(hash(baseline.children[3].geometry.attributes[key].array.subarray(range*3)),hash(on.children[3].geometry.attributes[key].array.subarray(range*3)),`Other fringe families changed ${key}`);

// Evaluate the actual original face equation through the accepted50 Y warp
// and invert the58 X taper. The recessed ear bed is not needed as an outer
// support envelope; it lies inside this analytical surface.
const face=new Function('THREE',read('src/face.js')+'\nreturn {profile,portraitY,faceZ};')(THREE),taper=new Function('Matrix4',read('src/face-refinement.js')+'\nreturn taperSample;')(Matrix4);
const clamp=x=>Math.max(0,Math.min(1,x));
function canonicalY(y){let a=-1.18,b=1.54;for(let i=0;i<24;i++){const m=(a+b)/2,p=face.portraitY(m),t=clamp((.05-p)/.18),q=p-.06*(p-.05)*t*t*(3-2*t);if(q<y)a=m;else b=m;}return(a+b)/2;}
const tap=new Float64Array(4);
function faceAt(x,y){
 const yy=canonicalY(y),w=face.profile(yy)[0];let xx=x;
 for(let i=0;i<5;i++){if(Math.abs(xx)>=w*.9999)return null;const z=face.faceZ(xx,yy);taper(xx,y,z,.025,tap);xx=x-tap[0];}
 if(Math.abs(xx)>=w*.9999)return null;
 return face.faceZ(xx,yy);
}

// The accepted115 ear shell, generated from the original ear sculpture and
// transformed with its exact existing yaw function. Bin real triangles in XY.
const ear=sourceEar(-1),ep=ear.geometry.attributes.position,ei=ear.geometry.index.array,sampleYaw=new Function('Matrix4',read('src/near-ear.js')+'\nreturn sample;')(Matrix4),yaw=new Float64Array(8);
for(let i=0;i<ep.count;i++){sampleYaw(ep.getX(i),ep.getZ(i),-25*Math.PI/180,yaw);ep.setXYZ(i,yaw[0],ep.getY(i),yaw[1]);}
const box={x0:-.99,x1:-.70,y0:-.36,y1:.31,nx:40,ny:56},bins=Array.from({length:box.nx*box.ny},()=>[]),cell=(x,y)=>[Math.max(0,Math.min(box.nx-1,Math.floor((x-box.x0)/(box.x1-box.x0)*box.nx))),Math.max(0,Math.min(box.ny-1,Math.floor((y-box.y0)/(box.y1-box.y0)*box.ny)))];
for(let i=0;i<ei.length;i+=3){const a=ei[i],b=ei[i+1],c=ei[i+2],x0=Math.min(ep.getX(a),ep.getX(b),ep.getX(c)),x1=Math.max(ep.getX(a),ep.getX(b),ep.getX(c)),y0=Math.min(ep.getY(a),ep.getY(b),ep.getY(c)),y1=Math.max(ep.getY(a),ep.getY(b),ep.getY(c)),u=cell(x0,y0),v=cell(x1,y1);for(let y=u[1];y<=v[1];y++)for(let x=u[0];x<=v[0];x++)bins[y*box.nx+x].push(i);}
function earAt(x,y){
 if(x<box.x0||x>box.x1||y<box.y0||y>box.y1)return null;
 const q=cell(x,y);let z=-Infinity;
 for(const i of bins[q[1]*box.nx+q[0]]){const a=ei[i],b=ei[i+1],c=ei[i+2],ax=ep.getX(a),ay=ep.getY(a),bx=ep.getX(b),by=ep.getY(b),cx=ep.getX(c),cy=ep.getY(c),den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-13)continue;const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-8)continue;z=Math.max(z,u*ep.getZ(a)+v*ep.getZ(b)+w*ep.getZ(c));}
 return Number.isFinite(z)?z:null;
}
const traj={sourcePaths:on.__paths133.length,emittedPaths:0,sampledSegments:0,upwardSteps:0,maximumUpwardStep:0,maximumAdjacentTurnDegrees:0,maximumRootPositionError:0,maximumJoinPositionError:0,maximumJoinTangentDegrees:0,faceSamples:0,minimumFaceGap:Infinity,maximumFaceGap:0,maximumNearestSupportGap:0,maximumPrincipalLowerGap:0,facePenetrations:0,earSamples:0,minimumEarGap:Infinity,maximumEarGap:0,earPenetrations:0,unsupportedLowerSamples:0,endpoints:[],representative:[]};
let minNormal=Infinity,maxNormal=0;
const pos=on.children[3].geometry.attributes.position,norm=on.children[3].geometry.attributes.normal;
for(let i=0;i<range;i++){const l=Math.hypot(norm.getX(i),norm.getY(i),norm.getZ(i));minNormal=Math.min(minNormal,l);maxNormal=Math.max(maxNormal,l);}
for(let k=0;k<on.__paths133.length;k++){
 const path=on.__paths133[k],d=path.debug133,emit=k%4===0||(k*37)%13<10;
 if(!emit)continue;traj.emittedPaths++;
 let old=null,oldDirection=null;
 for(let j=0;j<=100;j++){
  const t=j/100,p=d.posed(path.getPoint(t));assert(Number.isFinite(p.x+p.y+p.z));
  if(t<d.start-.001){const b=d.posed(d.original.getPoint(t));traj.maximumRootPositionError=Math.max(traj.maximumRootPositionError,Math.hypot(p.x-b.x,p.y-b.y,p.z-b.z));}
  if(t>d.start&&p.y<.88){
   const f=faceAt(p.x,p.y),e=earAt(p.x,p.y);
   if(f!==null){const gap=p.z-f;traj.faceSamples++;traj.minimumFaceGap=Math.min(traj.minimumFaceGap,gap);if(gap>traj.maximumFaceGap){traj.maximumFaceGap=gap;traj.maximumFaceGapAt={k,kind:d.kind,t,x:p.x,y:p.y,z:p.z,earSupport:e};}if(gap<-.0005)traj.facePenetrations++;}
   if(e!==null){const gap=p.z-e;traj.earSamples++;traj.minimumEarGap=Math.min(traj.minimumEarGap,gap);traj.maximumEarGap=Math.max(traj.maximumEarGap,gap);if(gap<-.0005)traj.earPenetrations++;}
   if(f!==null||e!==null){const gap=p.z-Math.max(f??-Infinity,e??-Infinity);traj.maximumNearestSupportGap=Math.max(traj.maximumNearestSupportGap,gap);if(d.kind==='principal'&&p.y<.75)traj.maximumPrincipalLowerGap=Math.max(traj.maximumPrincipalLowerGap,gap);}
   if(f===null&&e===null&&p.y<.4)traj.unsupportedLowerSamples++;
  }
  if(old&&p.y<.94){const dx=p.x-old.x,dy=p.y-old.y,dz=p.z-old.z,l=Math.hypot(dx,dy,dz),v=[dx/l,dy/l,dz/l];traj.sampledSegments++;if(dy>1e-6){traj.upwardSteps++;traj.maximumUpwardStep=Math.max(traj.maximumUpwardStep,dy);}if(oldDirection){const dot=Math.max(-1,Math.min(1,v[0]*oldDirection[0]+v[1]*oldDirection[1]+v[2]*oldDirection[2])),angle=Math.acos(dot)*180/Math.PI;if(angle>traj.maximumAdjacentTurnDegrees){traj.maximumAdjacentTurnDegrees=angle;traj.maximumTurnAt={k,kind:d.kind,t,x:p.x,y:p.y,z:p.z,start:d.start};}}oldDirection=v;}old=p;
 }
 const p=path.getPoint(d.start),p0=d.original.getPoint(d.start);traj.maximumJoinPositionError=Math.max(traj.maximumJoinPositionError,Math.hypot(p.x-p0.x,p.y-p0.y,p.z-p0.z));
 const a=path.getTangent(d.start+.00002),b=d.original.getTangent(d.start-.00002);traj.maximumJoinTangentDegrees=Math.max(traj.maximumJoinTangentDegrees,Math.acos(Math.max(-1,Math.min(1,a.dot(b))))*180/Math.PI);
 const end=d.posed(path.getPoint(1));traj.endpoints.push({k,kind:d.kind,x:end.x,y:end.y,z:end.z});
 if([2,5,51,100,151,200].includes(k))traj.representative.push({k,kind:d.kind,points:Array.from({length:11},(_,i)=>{const p=d.posed(path.getPoint(i/10));return[p.x,p.y,p.z];})});
}
assert.equal(traj.sourcePaths,270);assert.equal(traj.upwardSteps,0);assert.equal(traj.maximumRootPositionError,0);assert.equal(traj.maximumJoinPositionError,0);assert(minNormal>.9999997&&maxNormal<1.0000003);
const cpu=process.cpuUsage(cpu0),report={sourceHarness:true,native:false,baseline:'accepted118.5,108 fringe,contact86.35',offByteIdentical:true,protectedNonFringeExact:true,otherSixFringeFamiliesExact:true,sameIndicesUVColorMapsMaterialsAndCounts:true,meshReport,geometry:on.userData,trajectory:traj,normalLength:{min:minNormal,max:maxNormal},cost:{elapsedMs:performance.now()-start,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024},limitations:['Source harness; native Three/WebGPU and art remain untested.','Face clearance uses the original equation through50 and58 rather than the rendered triangulation; the recessed ear bed is a conservative inner change.','Ear clearance uses real original ear triangles through50 and115, with source/native rounding possible.','Only sampled path centers are clearance-checked; narrow round/ribbon cross-sections and triangle interpolation receive native visual review.','Existing upper buried prefix is preserved and not claimed collision-free by this lower-path test.']};
fs.writeFileSync('review/fringe133-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,trajectory:{...traj,endpoints:undefined,representative:undefined},geometry:{...on.userData,frontRootJoins:undefined,shoulderContact:undefined,guidePlacement118:undefined}}));
