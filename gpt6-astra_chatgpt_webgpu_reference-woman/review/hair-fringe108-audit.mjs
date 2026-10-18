import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const prefix=fs.readFileSync('review/hair-contact86-audit.mjs','utf8').split('const baseline=construct(')[0].replace(/^import[^\n]*\n/gm,'');
const {THREE,read,faceZ}=new Function('fs','assert',prefix+'\nreturn {THREE,read,faceZ};')(fs,assert);
const blouse=read('review/blouse-candidate98.js').replace('const OUTER_WIDTH98=0;','const OUTER_WIDTH98=.12;');
const sampleBlouseFrontAtXY=new Function('THREE',blouse+'\nreturn sampleBlouseFrontAtXY;')(THREE);
const createHairContact=new Function('sampleBlouseFrontAtXY',read('review/hair-contact-candidate86.js')+'\nreturn createHairContact;')(sampleBlouseFrontAtXY);
const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
function construct(file,debug=false){
 let source=read(file);
 if(debug){
  source=source.replace(',root=[];',',rootPoints=[];').replace('root.push(crown(side,u,v,','rootPoints.push(crown(side,u,v,').replace('curve([...root,...ps.slice(2)])','curve([...rootPoints,...ps.slice(2)])');
  source=source.replace('strand=curve(trim);if(loose)','strand=curve(trim);(root.__fringePaths??=[]).push(strand);if(loose)');
  source=source.replace('if(loose){const taperNoise=random();ribbon(fringe','if(loose){const taperNoise=random();(root.__fringePaths??=[]).push(strand);ribbon(fringe');
  source=source.replace('else if(keepCore){roundFiber(fringe','else if(keepCore){(root.__fringePaths??=[]).push(strand);roundFiber(fringe');
 }
 return new Function('THREE','faceZ','createHairContact',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact)({shoulderContact:.35});
}
const cpuStart=process.cpuUsage(),started=performance.now(),baseline=construct('review/hair-groom-candidate94.js',true),candidate=construct('review/hair-groom-candidate108.js',true),buildMs=performance.now()-started;
let finite=true,nonFringeByteMismatches=0;const meshes=[];
for(let m=0;m<candidate.children.length;m++){
 const old=baseline.children[m],now=candidate.children[m],g=now.geometry,before=old.geometry;
 for(const a of Object.values(g.attributes))for(const value of a.array)if(!Number.isFinite(value))finite=false;
 let changedAttributes=[];
 for(const key of Object.keys(before.attributes)){
  const a=before.getAttribute(key).array,b=g.getAttribute(key).array,same=a.byteLength===b.byteLength&&hash(a)===hash(b);if(!same)changedAttributes.push(key);
  if(m!==3)assert(same,`Non-fringe ${m}/${key} changed`);
 }
 const sameIndex=before.index.array.byteLength===g.index.array.byteLength&&hash(before.index.array)===hash(g.index.array);if(m!==3)assert(sameIndex);
 for(const key of['roughness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','transparent','opacity','alphaTest','side'])assert.equal(now.material[key],old.material[key]);
 for(const key of['map','normalMap'])if(old.material[key])assert.equal(hash(now.material[key].image.data),hash(old.material[key].image.data));
 meshes.push({name:now.name,vertices:g.getAttribute('position').count,triangles:g.index.count/3,vertexDelta:g.getAttribute('position').count-before.getAttribute('position').count,triangleDelta:(g.index.count-before.index.count)/3,changedAttributes,indexIdentical:sameIndex});
}
assert(finite);assert.equal(candidate.__fringePaths.length,candidate.userData.fringeStrands);assert(candidate.userData.fringeStrands<1305);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const face=new Function('THREE',read('src/face.js')+'\nreturn {profile,portraitY,faceZ};')(THREE);
const finalSkinY=y=>{const p=face.portraitY(y),q=clamp((.05-p)/.18),w=q*q*(3-2*q);return p-.06*(p-.05)*w;};
const oldY=y=>{let lo=-1.18,hi=1.54;for(let k=0;k<28;k++){const mid=(lo+hi)/2;if(finalSkinY(mid)<y)lo=mid;else hi=mid;}return(lo+hi)/2;};
const skinAt=(x,y)=>{if(y<-1.18||y>1.54)return null;const originalY=oldY(y),width=face.profile(originalY)[0];if(Math.abs(x)>width*.997)return null;return face.faceZ(x,originalY);};
function posed(p){const w=1-smooth(-1.64,.38,p.y),ay=-.16*w,az=.17*w,x=p.x*Math.cos(ay)+p.z*Math.sin(ay),z=-p.x*Math.sin(ay)+p.z*Math.cos(ay);return new THREE.Vector3(x*Math.cos(az)-p.y*Math.sin(az),x*Math.sin(az)+p.y*Math.cos(az),z);}
function geometryAudit(mesh){
 const p=mesh.geometry.getAttribute('position'),n=mesh.geometry.getAttribute('normal'),ix=mesh.geometry.index.array,bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let minNormal=Infinity,maxNormal=0,minGap=Infinity,penetratingVertices=0,testedVertices=0,minArea=Infinity,degenerateTriangles=0;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),normalLength=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));minNormal=Math.min(minNormal,normalLength);maxNormal=Math.max(maxNormal,normalLength);
  for(let axis=0;axis<3;axis++){const v=p.array[i*3+axis];bounds.min[axis]=Math.min(bounds.min[axis],v);bounds.max[axis]=Math.max(bounds.max[axis],v);}
  if(y>.14&&y<1.10){const skin=skinAt(x,y);if(skin!==null){const gap=z-skin;minGap=Math.min(minGap,gap);testedVertices++;if(gap<-.0005)penetratingVertices++;}}
 }
 for(let i=0;i<ix.length;i+=3){const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3,ux=p.array[b]-p.array[a],uy=p.array[b+1]-p.array[a+1],uz=p.array[b+2]-p.array[a+2],vx=p.array[c]-p.array[a],vy=p.array[c+1]-p.array[a+1],vz=p.array[c+2]-p.array[a+2],area=Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)*.5;minArea=Math.min(minArea,area);if(area<1e-14)degenerateTriangles++;}
 return{bounds,normalLength:{min:minNormal,max:maxNormal},skinProjection:{testedVertices,minimumZClearance:minGap,penetratingVertices,tolerance:.0005},minTriangleArea:minArea,degenerateTriangles};
}
const before=geometryAudit(baseline.children[3]),after=geometryAudit(candidate.children[3]);
function visibleTrajectoryAudit(strands){
 let sampledSegments=0,upwardSteps=0,maxUpwardStep=0,maxTurn=0;
 for(let k=0;k<strands.length;k+=7){let previous=null,direction=null;for(let j=0;j<=200;j++){
  const p=posed(strands[k].getPoint(j/200));
  if(p.y<.14||p.y>1.0){previous=null;direction=null;continue;}
  if(previous){const d=p.clone().sub(previous),unit=d.clone().normalize();sampledSegments++;if(p.y>previous.y+1e-7){upwardSteps++;maxUpwardStep=Math.max(maxUpwardStep,p.y-previous.y);}if(direction)maxTurn=Math.max(maxTurn,Math.acos(clamp(unit.dot(direction),-1,1))*180/Math.PI);direction=unit;}previous=p;
 }}
 return{sampledSegments,upwardSteps,maxUpwardStep,maximumAdjacentTurnDegrees:maxTurn};
}
const trajectoryBefore=visibleTrajectoryAudit(baseline.__fringePaths),trajectoryAfter=visibleTrajectoryAudit(candidate.__fringePaths);
assert(after.normalLength.min>.9999998);assert(after.normalLength.max<1.0000002);assert.equal(after.degenerateTriangles,0);assert.equal(trajectoryAfter.upwardSteps,0);assert(after.skinProjection.penetratingVertices<=before.skinProjection.penetratingVertices);
const cpu=process.cpuUsage(cpuStart),result={sourceHarness:true,native:false,base:'frozen94',cloth:'candidate98 width .12',shoulderContact:.35,balance:'not applied in this audit;99 is a later shared deformation',finite,nonFringeByteMismatches,unchangedCrownTopologyUVColorAndMaps:true,unchangedMassDetailWispsContactAndTemple:true,unchangedMaterials:true,meshes,baselineFringe:before,candidateFringe:after,fringeDistribution:candidate.userData.fringeDistribution108,trajectoryBefore,trajectoryAfter,geometry:{triangles:candidate.userData.triangles,MiB:candidate.userData.geometryMiB,constructionMs:candidate.userData.constructionMs},cost:{wallMs:buildMs,cpuMs:(cpu.user+cpu.system)/1000,rssMiB:process.memoryUsage().rss/1048576},limitations:['Source harness, not native Three/WebGPU; visual acceptance pending.','Skin projection checks the accepted50 head height and primary face surface for fringe vertices betweenY .14 and1.10, excluding the lateral silhouette; it is not an exhaustive accessory collision test.','Shared99 later preserves continuous geometry relations but may introduce bounded differences from separate triangle tessellations.']};
fs.writeFileSync('review/hair-fringe108-source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
