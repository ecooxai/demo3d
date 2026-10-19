import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
import {construct136} from './crown136-source.mjs';
import {project136} from './crown136-coverage.mjs';

const started=performance.now(),cpuStart=process.cpuUsage(),hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const fileHash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const make133=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',read('review/hair-groom-candidate133.js')+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118);
const options={headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1};
const baseline=make133(options),zero=construct136(0),on=construct136(1),patch=on.__departure136;
const baselineHashes=baseline.children.map(m=>({index:hash(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,hash(a.array)]))}));
const protectedVertices=new Uint8Array(on.children[2].geometry.attributes.position.count);protectedVertices.fill(1);
for(const [start,end]of patch.ribbonRanges)protectedVertices.fill(0,start,end);
const meshes=[];
for(let m=0;m<baseline.children.length;m++){
 const a=baseline.children[m],b=zero.children[m],c=on.children[m],ga=a.geometry,gz=b.geometry,g=c.geometry;
 assert.equal(hash(gz.index.array),baselineHashes[m].index);assert.equal(hash(g.index.array),baselineHashes[m].index);
 for(const k of Object.keys(ga.attributes))assert.equal(hash(gz.attributes[k].array),baselineHashes[m].attributes[k],`136 zero ${m}/${k}`);
 for(const k of['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','specularColor','envMapIntensity','normalScale','alphaTest','alphaToCoverage','side','transparent','opacity','depthWrite','vertexColors'])assert.equal(JSON.stringify(c.material[k]),JSON.stringify(a.material[k]),`material ${m}/${k}`);
 for(const k of['map','normalMap']){assert.equal(Boolean(c.material[k]),Boolean(a.material[k]));if(a.material[k])assert.equal(hash(c.material[k].image.data),hash(a.material[k].image.data),`map ${m}/${k}`);}
 let nonfinite=0,changedPositionComponents=0,changedNormalComponents=0,maximumDisplacement=0;
 for(const attr of Object.values(g.attributes))for(const v of attr.array)if(!Number.isFinite(v))nonfinite++;
 assert.equal(nonfinite,0);
 for(const key of['position','normal','uv','color']){
  const x=g.attributes[key].array,y=ga.attributes[key].array,item=g.attributes[key].itemSize;
  for(let i=0;i<x.length;i++){
   if(x[i]===y[i])continue;
   if(key==='position')changedPositionComponents++;if(key==='normal')changedNormalComponents++;
   if(m===0){assert.equal(key,'color','Only CROWN alpha may change');assert.equal(i%4,3,'CROWN RGB is protected');}
   else if(m===2){assert(key==='position'||key==='normal','DETAIL color and UV are protected');assert.equal(protectedVertices[Math.floor(i/item)],0,'DETAIL outside selected ribbons is exact');}
   else assert.fail(`Protected mesh ${m}/${key} changed`);
  }
 }
 const p=g.attributes.position.array,q=ga.attributes.position.array;
 for(let i=0;i<p.length;i+=3)maximumDisplacement=Math.max(maximumDisplacement,Math.hypot(p[i]-q[i],p[i+1]-q[i+1],p[i+2]-q[i+2]));
 meshes.push({name:c.name,vertices:g.attributes.position.count,triangles:g.index.count/3,nonfinite,changedPositionComponents,changedNormalComponents,maximumDisplacement});
}
assert.equal(on.userData.triangles,baseline.userData.triangles);
assert.equal(on.userData.geometryMiB,baseline.userData.geometryMiB);
let minNormalLength=Infinity,maxNormalLength=0,changedNormalVertices=0;
const dn=on.children[2].geometry.attributes.normal.array;
for(let i=0;i<protectedVertices.length;i++)if(!protectedVertices[i]){const length=Math.hypot(dn[i*3],dn[i*3+1],dn[i*3+2]);assert(length>.99&&length<1.01);minNormalLength=Math.min(minNormalLength,length);maxNormalLength=Math.max(maxNormalLength,length);changedNormalVertices++;}
let minAlpha=1,maxAlpha=0;const ca=on.children[0].geometry.attributes.color.array;
for(let i=3;i<ca.length;i+=4){assert(ca[i]>=0&&ca[i]<=1);minAlpha=Math.min(minAlpha,ca[i]);maxAlpha=Math.max(maxAlpha,ca[i]);}

const motion={sampledPaths:patch.chosen.length,upwardAfterApex:0,maxRise:0,maximumAdjacentTurnDegrees:0,maximumJoinTangentDegrees:0,maximumJoinStep:0,worstTurn:null};
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,(a.x*b.x+a.y*b.y+a.z*b.z)/(Math.hypot(a.x,a.y,a.z)*Math.hypot(b.x,b.y,b.z)))))*180/Math.PI;
for(const r of patch.chosen){
 let a=r.c.getPoint(0),previous=null,maximumY=a.y,apex=0;
 for(let j=1;j<=100;j++){const p=r.c.getPoint(j/100);if(p.y>maximumY){maximumY=p.y;apex=j;}}
 for(let j=1;j<=100;j++){
  const p=r.c.getPoint(j/100),d=p.clone().sub(a);
  if(j>apex&&d.y>1e-6){motion.upwardAfterApex++;motion.maxRise=Math.max(motion.maxRise,d.y);}
  if(previous&&j/100>r.startT){const turn=angle(previous,d);if(turn>motion.maximumAdjacentTurnDegrees){motion.maximumAdjacentTurnDegrees=turn;motion.worstTurn={side:r.side,u:r.u,k:r.k,t:j/100,point:[p.x,p.y,p.z]};}}
  previous=d;a=p;
 }
 const t=r.startT,h=1e-6,p=r.c.getPoint(t),left=p.clone().sub(r.c.getPoint(t-h)),right=r.c.getPoint(t+h).sub(p);
 motion.maximumJoinStep=Math.max(motion.maximumJoinStep,Math.hypot(left.x,left.y,left.z),Math.hypot(right.x,right.y,right.z));motion.maximumJoinTangentDegrees=Math.max(motion.maximumJoinTangentDegrees,angle(left,right));
}
assert.equal(motion.upwardAfterApex,0);

function crownRays(hair,px,py){
 const g=hair.children[0].geometry,p=g.attributes.position.array,uv=g.attributes.uv.array,c=g.attributes.color.array,ix=g.index.array,map=hair.children[0].material.map.image,points=[];
 for(let i=0;i<p.length;i+=3){const q=project136(p[i],p[i+1],p[i+2]);points.push(q[0]+.02,q[1]+2.95,q[2]);}
 const x=(px/796-.5)*2.4+.04,y=(.5-py/1061)*3.2+3.03,hits=[];
 const alpha=(u,v)=>{const x=u*512-.5,y=v*1024-.5,i=Math.floor(x),j=Math.floor(y),s=x-i,t=y-j,get=(a,b)=>map.data[(Math.max(0,Math.min(1023,b))*512+((a%512+512)%512))*4+3]/255;return(1-t)*((1-s)*get(i,j)+s*get(i+1,j))+t*((1-s)*get(i,j+1)+s*get(i+1,j+1));};
 for(let k=0;k<ix.length;k+=3){
  const ids=[ix[k],ix[k+1],ix[k+2]],q=ids.map(i=>[points[i*3],points[i*3+1],points[i*3+2]]),[a,b,c0]=q,den=(b[1]-c0[1])*(a[0]-c0[0])+(c0[0]-b[0])*(a[1]-c0[1]);if(Math.abs(den)<1e-12)continue;
  const s=((b[1]-c0[1])*(x-c0[0])+(c0[0]-b[0])*(y-c0[1]))/den,t=((c0[1]-a[1])*(x-c0[0])+(a[0]-c0[0])*(y-c0[1]))/den,r=1-s-t;if(Math.min(s,t,r)<-1e-7)continue;
  const weights=[s,t,r],get=(a,n,ch)=>ids.reduce((sum,i,k)=>sum+weights[k]*a[i*n+ch],0),z=get(points,3,2);if(z<0)continue;
  const U=get(uv,2,0),V=get(uv,2,1),coverage=get(c,4,3)*alpha(U,V);
  hits.push({triangle:k/3,side:ids[0]<7685?'foundation':ids[0]<16070?'left':'right',u:U,v:V/.73,coverage,z});
 }
 return hits.sort((a,b)=>b.z-a.z);
}
const wedgeSamples=[[527,198],[547,217]].map(([x,y])=>({detailPixel:[x,y],baseline:crownRays(baseline,x,y),candidate:crownRays(on,x,y)}));
const cpu=process.cpuUsage(cpuStart),publicPatch={...on.userData.crownDeparture136};
const report={candidate:136,native:false,scoreUnchanged:77,sourceSHA256:fileHash('review/hair-groom-candidate136.js'),helperSHA256:fileHash('review/crown-departure-candidate136.js'),base133SHA256:fileHash('review/hair-groom-candidate133.js'),liveSourceSHA256:fileHash('src/hair-groom.js'),zeroExact:true,options,geometry:{triangles:on.userData.triangles,geometryMiB:on.userData.geometryMiB,constructionMs:on.userData.constructionMs},patch:publicPatch,meshes,modifiedRibbonNormals:{vertices:changedNormalVertices,minLength:minNormalLength,maxLength:maxNormalLength},crownAlpha:{minAlpha,maxAlpha,changed:patch.changedAlpha},motion,wedgeSamples,prerequisite:JSON.parse(fs.readFileSync('review/crown136-prerequisite.json','utf8')),limitations:['Source-only geometry and sampled projected coverage; actual native front/detail and both profiles decide adoption.','Projected fiber coverage is measured in .036-unit windows, not a guarantee that every triangle or isolated pixel is safe.','The forehead support study tests emitted rings and ribbon edges;65 near-grazing samples in the -35 degree view are reported separately.','The accepted physical DETAIL material is unchanged and may produce brighter forehead glints than the matte FRINGE.','CROWN alpha changed deliberately;100/104 export coverage must be recharacterized only after a visible art gain.'],resources:{elapsedMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024}};
fs.writeFileSync('review/crown136-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,meshes:meshes.map(({name,...m})=>m),prerequisite:{changedFibers:report.prerequisite.changedFibers,changedAlpha:report.prerequisite.changedAlpha,support:report.prerequisite.support.views.map(({worst,missingExamples,...r})=>r)}}));
