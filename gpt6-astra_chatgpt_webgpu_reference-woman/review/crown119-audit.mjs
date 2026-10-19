import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const prefix=fs.readFileSync('review/hair-contact86-audit.mjs','utf8').split('const baseline=construct(')[0].replace(/^import[^\n]*\n/gm,'');
const {THREE,read,faceZ}=new Function('fs','assert',prefix+'\nreturn {THREE,read,faceZ};')(fs,assert);
const sampleBlouseFrontAtXY=new Function('THREE',read('src/blouse.js')+'\nreturn sampleBlouseFrontAtXY;')(THREE);
const createHairContact=new Function('sampleBlouseFrontAtXY',read('review/hair-contact-candidate86.js')+'\nreturn createHairContact;')(sampleBlouseFrontAtXY);
const load=file=>new Function('THREE','faceZ','createHairContact',read(file)+'\nreturn {createGroomHair,crownField,foreheadField'+(file.includes('119')?',partedCrown119':'')+'};')(THREE,faceZ,createHairContact);
const original=load('review/hair-groom-candidate108.js'),candidate=load('review/hair-groom-candidate119.js');
const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const fileHash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const physical=mat=>JSON.stringify(Object.fromEntries(['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','specularColor','envMapIntensity','normalScale','alphaTest','alphaToCoverage','side','transparent','opacity','depthWrite','forceSinglePass','vertexColors'].map(k=>[k,mat[k]])));
const options={headShiftX:.26,shoulderContact:.35};
const before=performance.now(),base=original.createGroomHair(options),baseHashes=base.children.map(m=>Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,v])=>[k,hash(v.array)])));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],sub=(a,b)=>a.map((x,i)=>x-b[i]);
const vector=(a,i)=>[a[i*3],a[i*3+1],a[i*3+2]],norm=a=>Math.hypot(...a);
function areaAudit(g,old){
 const p=g.attributes.position.array,q=old.attributes.position.array,ix=g.index.array;
 let nonfinite=0,flips=0,minNormalCosine=1,minAreaRatio=Infinity,maxAreaRatio=0,tested=0,worst=null;
 // The original closed foundation is excluded; duplicated pole rows contain
 // intentional degenerate triangles. All actual sheet triangles are checked.
 for(let t=144*52*6;t<ix.length;t+=3){
  const ids=[ix[t],ix[t+1],ix[t+2]],a=ids.map(i=>vector(q,i)),b=ids.map(i=>vector(p,i)),x=cross(sub(a[1],a[0]),sub(a[2],a[0])),y=cross(sub(b[1],b[0]),sub(b[2],b[0])),oldArea=norm(x),area=norm(y);
  if(oldArea<1e-12)continue;tested++;const cosine=dot(x,y)/(oldArea*area),ratio=area/oldArea;
  if(!Number.isFinite(cosine)||!Number.isFinite(ratio))nonfinite++;
  if(cosine<=0)flips++;
  if(cosine<minNormalCosine){minNormalCosine=cosine;worst={triangle:t/3,ids,cosine,ratio};}
  minAreaRatio=Math.min(minAreaRatio,ratio);maxAreaRatio=Math.max(maxAreaRatio,ratio);
 }
 return{tested,nonfinite,flips,minNormalCosine,minAreaRatio,maxAreaRatio,worst};
}
function hitTriangle(o,d,a,b,c){
 const e1=sub(b,a),e2=sub(c,a),p=cross(d,e2),det=dot(e1,p);if(Math.abs(det)<1e-12)return null;
 const t=sub(o,a),u=dot(t,p)/det;if(u<0||u>1)return null;const q=cross(t,e1),v=dot(d,q)/det;if(v<0||u+v>1)return null;
 const distance=dot(e2,q)/det;return distance>1e-7?{distance,u,v}:null;
}
function supportAudit(g){
 const p=g.attributes.position.array,ix=g.index.array,left=7685,right=left+8385;
 let count=0,unsupported=0,minDepth=Infinity,maxDepth=0,maxWidth=0;const failures=[];
 for(let i=0;i<128;i++)for(const fraction of [0,.25,.5,.75]){
  const l0=vector(p,left+i),l1=vector(p,left+i+1),r0=vector(p,right+i),r1=vector(p,right+i+1),l=l0.map((v,k)=>v+(l1[k]-v)*fraction),r=r0.map((v,k)=>v+(r1[k]-v)*fraction),width=norm(sub(r,l));if(width<1e-6)continue;
  maxWidth=Math.max(maxWidth,width);
  for(const t of [.08,.28,.5,.72,.92]){
   const o=l.map((v,k)=>v+(r[k]-v)*t),n=[(o[0]-.012)/(.94*.94),(o[1]-.327)/(1.302*1.302),(o[2]+.077)/(.857*.857)],length=norm(n),d=n.map(v=>-v/length);let nearest=null;
   for(let f=0;f<144*52*6;f+=3){const h=hitTriangle(o,d,vector(p,ix[f]),vector(p,ix[f+1]),vector(p,ix[f+2]));if(h&&(!nearest||h.distance<nearest.distance))nearest={...h,triangle:f/3};}
   count++;if(!nearest||nearest.distance>.065){unsupported++;failures.push({u:(i+fraction)/128,t,width,nearest});}else{minDepth=Math.min(minDepth,nearest.distance);maxDepth=Math.max(maxDepth,nearest.distance);}
  }
 }
 return{count,unsupported,minDepth,maxDepth,maxWidth,failures};
}
const runs=[];
for(const strength of [0,.5,1]){
 let hair=candidate.createGroomHair({...options,crownStructure119:strength});
 const meshes=[];
 for(let m=0;m<hair.children.length;m++){
  const g=hair.children[m].geometry,b=base.children[m].geometry;
  assert.equal(physical(hair.children[m].material),physical(base.children[m].material));
  for(const slot of ['map','normalMap']){const a=hair.children[m].material[slot],z=base.children[m].material[slot];assert.equal(Boolean(a),Boolean(z));if(a)assert.equal(hash(a.image.data),hash(z.image.data));}
  assert.equal(g.index.count,b.index.count);assert.equal(hash(g.index.array),hash(b.index.array));
  for(const k of ['uv','color'])assert.equal(hash(g.attributes[k].array),baseHashes[m][k],`${m} ${k}`);
  const p=g.attributes.position.array,q=b.attributes.position.array,n=g.attributes.normal.array,oldN=b.attributes.normal.array;
  let changed=0,maximum=0,protectedChanged=0,protectedMaximum=0,protectedNormalsChanged=0,protectedNormalMaximum=0,minChangedY=Infinity,finite=true;const protectedWorst=[];
  for(let i=0;i<p.length;i+=3){
   const d=Math.hypot(p[i]-q[i],p[i+1]-q[i+1],p[i+2]-q[i+2]);
   if(d>1e-9){changed++;minChangedY=Math.min(minChangedY,q[i+1]);maximum=Math.max(maximum,d);}
   if(q[i+1]<=1.05){if(d>1e-9){protectedChanged++;if(protectedWorst.length<12||d>protectedWorst.at(-1).distance){protectedWorst.push({vertex:i/3,original:vector(q,i/3),distance:d});protectedWorst.sort((a,b)=>b.distance-a.distance);protectedWorst.length=Math.min(12,protectedWorst.length);}}protectedMaximum=Math.max(protectedMaximum,d);const dn=Math.hypot(n[i]-oldN[i],n[i+1]-oldN[i+1],n[i+2]-oldN[i+2]);if(dn>1e-7)protectedNormalsChanged++;protectedNormalMaximum=Math.max(protectedNormalMaximum,dn);}
   finite&&=Number.isFinite(p[i])&&Number.isFinite(p[i+1])&&Number.isFinite(p[i+2])&&Number.isFinite(n[i])&&Number.isFinite(n[i+1])&&Number.isFinite(n[i+2]);
  }
  assert(finite);
  if(strength===0)for(const k of ['position','normal'])assert.equal(hash(g.attributes[k].array),baseHashes[m][k],`${m} baseline ${k}`);
  meshes.push({mesh:hair.children[m].name,vertices:p.length/3,changed,maximum,minChangedY,protectedY:1.05,protectedChanged,protectedMaximum,protectedWorst,protectedNormalsChanged,protectedNormalMaximum,finite});
 }
 assert.deepEqual(hair.userData.frontRootJoins,base.userData.frontRootJoins);
 assert.equal(hair.userData.individualStrands,base.userData.individualStrands);
 const area=areaAudit(hair.children[0].geometry,base.children[0].geometry),support=strength?supportAudit(hair.children[0].geometry):null;
 assert.equal(area.nonfinite,0);assert.equal(area.flips,0);if(support)assert.equal(support.unsupported,0);
 for(const mesh of meshes)assert.equal(mesh.protectedChanged,0,`${mesh.mesh}: protected lower positions moved`);
 runs.push({strength,metadata:hair.userData.crownStructure119,triangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,constructionMs:hair.userData.constructionMs,meshes,area,support});
 hair=null;global.gc?.();
}
const report={candidate:119,native:false,scoreUnchanged:76,sourceSHA256:fileHash('review/hair-groom-candidate119.js'),baseSHA256:fileHash('review/hair-groom-candidate108.js'),preservation:{zero:'All geometry attributes are byte-identical to108',allStrengths:'Same index, UV0, RGBA/color, strand count and procedural map/normal-map bytes; physical material settings unchanged',protectedPositions:'All mesh positions with original localY≤1.05 are exact',normalBoundary:'Recomputed normals on triangles straddling the upper cutoff can change slightly; see measured maxima',crown100:'Its existing normal-facing color mask is reevaluated on the new geometry; UV1 layout/alpha contract is unchanged'},runs,elapsedMs:performance.now()-before,peakRSSMiB:process.resourceUsage().maxRSS/1024};
fs.writeFileSync('review/crown119-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
