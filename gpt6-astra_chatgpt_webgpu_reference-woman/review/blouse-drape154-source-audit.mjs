import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {THREE,Attr,Geometry,Matrix4,read,object,attach,I,mul,T,RY,RZ} from './torso-depth110-harness.mjs';

// Local arithmetic source fixture only. Root uses actual Three and all current
// native meshes in the separate wrapper. No source photograph pixels are read.
Matrix4.prototype.copy=function(m){this.elements=Array.from(m.elements);return this;};
Attr.prototype.setZ=function(i,z){this.array[i*this.itemSize+2]=z;return this;};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=a=>sha(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));
const helper=new Function('Matrix4',read('review/blouse-drape-candidate154.js')+'\nreturn {BLOUSE154_SPEC,blousePlacket154,blouseDrapeJet154,applyBlouseDrape154,releaseBlouseDrape154};')(Matrix4);
const riskAPI=new Function('Matrix4',read('review/blouse-drape154-geometry-audit.js')+'\nreturn {inspectBlouseTriangles154,trianglesIntersect154};')(Matrix4);
const cloth=new Function('THREE',read('src/blouse.js')+'\nreturn {clothGeometry,broadenShoulders,placketX,contactBroadening,outerWidth98};')(THREE);
const applyBalance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4),started=performance.now(),cpu=process.cpuUsage();
const B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0))),H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17)));
const group=object('original-tailored-white-cotton-blouse'),g=cloth.clothGeometry(),mesh=attach(group,helper.BLOUSE154_SPEC.mesh,g,I());cloth.broadenShoulders(group);
const entries=g=>[...Object.entries(g.attributes),['index',g.index]],fingerprint=g=>Object.fromEntries(entries(g).map(([k,a])=>[k,hash(a)])),sourceFingerprints=fingerprint(g);
const zero={traverse(){throw Error('zero traversed');},updateWorldMatrix(){throw Error('zero updated matrices');}},z0=helper.applyBlouseDrape154(zero),z1=helper.applyBlouseDrape154(zero,{strength:0});assert.equal(z0,z1);
const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,jet=new Float64Array(6),owned=[];
for(let i=0;i<p.count;i++){helper.blouseDrapeJet154(p.getX(i),p.getY(i),jet);if(uv.getX(i)>.75&&uv.getX(i)<1&&p.getZ(i)>0&&jet[5])owned.push(i);}
assert.equal(owned.length,254);
const metrics=helper.applyBlouseDrape154(group,{strength:1,retainSourceForQA:true}),candidate=mesh.geometry;
assert.equal(helper.applyBlouseDrape154(group,{strength:1,retainSourceForQA:true}),metrics);
assert.throws(()=>helper.applyBlouseDrape154(group,{strength:0}),/fresh blouse/);
assert.deepEqual(fingerprint(g),sourceFingerprints);
const selected=new Set(owned),q=candidate.attributes.position,nn=candidate.attributes.normal;
let xyChanges=0,protectedPositionChanges=0,protectedNormalChanges=0,normalError=0,nonfinite=0,privateBytes=0;
for(const[k,a]of entries(candidate)){
 const b=k==='index'?g.index:g.getAttribute(k);assert.notEqual(a,b);assert.notEqual(a.array.buffer,b.array.buffer);assert.equal(a.array.constructor,b.array.constructor);privateBytes+=a.array.byteLength;
 if(k!=='position'&&k!=='normal')assert.equal(hash(a),hash(b));
}
for(let i=0;i<p.count;i++){
 if(!Object.is(q.getX(i),p.getX(i))||!Object.is(q.getY(i),p.getY(i)))xyChanges++;
 if(!selected.has(i))for(let k=0;k<3;k++){if(!Object.is(p.array[i*3+k],q.array[i*3+k]))protectedPositionChanges++;if(!Object.is(n.array[i*3+k],nn.array[i*3+k]))protectedNormalChanges++;}
 const l=Math.hypot(nn.getX(i),nn.getY(i),nn.getZ(i));normalError=Math.max(normalError,Math.abs(l-1));if(!Number.isFinite(q.getX(i)+q.getY(i)+q.getZ(i)+l))nonfinite++;
}
assert.equal(xyChanges+protectedPositionChanges+protectedNormalChanges+nonfinite,0);assert(normalError<1e-6);assert.equal(privateBytes,metrics.privateAttributeBytes);

// Independent finite differences include C(Y), d, Yc(d), width variation and
// all gate derivatives. The full source C curve is tested separately as well.
let maxGradientError=0,maxPlacketValueError=0,maxPlacketGradientError=0,fieldSamples=0;
const at=(x,y)=>{const j=new Float64Array(6);helper.blouseDrapeJet154(x,y,j);return j;},cAt=y=>{const j=new Float64Array(2);helper.blousePlacket154(y,j);return j;};
const widened=x=>cloth.outerWidth98(cloth.contactBroadening(x).x).x;
for(let iy=0;iy<=70;iy++){
 const y=-1.42+iy*.03,c=cAt(y),e=1e-6;
 maxPlacketValueError=Math.max(maxPlacketValueError,Math.abs(c[0]-widened(cloth.placketX(y))));
 maxPlacketGradientError=Math.max(maxPlacketGradientError,Math.abs(c[1]-(cAt(y+e)[0]-cAt(y-e)[0])/(2*e)));
 for(let ix=0;ix<=40;ix++){
  const x=-.85+ix*.025,j=at(x,y),a=at(x+e,y),b=at(x-e,y),c=at(x,y+e),d=at(x,y-e);
  maxGradientError=Math.max(maxGradientError,Math.abs(j[1]-(a[0]-b[0])/(2*e)),Math.abs(j[2]-(c[0]-d[0])/(2*e)));fieldSamples++;
 }
}
assert(maxGradientError<2e-8);assert(maxPlacketValueError<1e-14);assert(maxPlacketGradientError<2e-8);

// Actual emitted strips: compare their linear vertex displacement with the
// continuous H at edge midpoints and triangle centers. No new cuts are added.
const xyz=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)],sub=(a,b)=>a.map((v,k)=>v-b[k]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),length=a=>Math.hypot(...a);
let affectedTriangles=0,newDegenerate=0,reversed=0,minTriangleCos=1,minAreaRatio=Infinity,maxAreaRatio=0,maxChordDeviation=0,chordSamples=0,worstChord=null;
for(let t=0;t<g.index.count;t+=3){
 const ids=Array.from(g.index.array.subarray(t,t+3));if(ids.every(i=>!selected.has(i)))continue;affectedTriangles++;
 const a=ids.map(i=>xyz(p,i)),b=ids.map(i=>xyz(q,i)),na=cross(sub(a[1],a[0]),sub(a[2],a[0])),nb=cross(sub(b[1],b[0]),sub(b[2],b[0])),la=length(na),lb=length(nb);
 if(la>1e-15){minAreaRatio=Math.min(minAreaRatio,lb/la);maxAreaRatio=Math.max(maxAreaRatio,lb/la);if(lb<1e-15)newDegenerate++;else{const c=dot(na,nb)/(la*lb);minTriangleCos=Math.min(minTriangleCos,c);if(c<=0)reversed++;}}
 for(const w of[[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3]]){
  const x=w.reduce((s,v,i)=>s+v*a[i][0],0),y=w.reduce((s,v,i)=>s+v*a[i][1],0),linear=w.reduce((s,v,i)=>s+v*(b[i][2]-a[i][2]),0),expected=at(x,y)[0],error=Math.abs(linear-expected);chordSamples++;
  if(error>maxChordDeviation){maxChordDeviation=error;worstChord={triangle:t/3,ids,x,y,linear,expected,error};}
 }
}
assert.equal(newDegenerate+reversed,0);assert(maxChordDeviation<.0045,'154 existing strips do not resolve the single roll; broaden it before native: '+JSON.stringify({maxChordDeviation,worstChord,minTriangleCos,minAreaRatio,maxAreaRatio}));

// Fail a changed relative frame atomically before a clone is installed.
const wrong=object('wrong'),wrongMesh=attach(wrong,helper.BLOUSE154_SPEC.mesh,g,RZ(.05));
assert.throws(()=>helper.applyBlouseDrape154(wrong,{strength:1}),/frame/);assert.equal(wrongMesh.geometry,g);

// Minimal intersection fixtures verify finite edges, coplanar overlap and
// disjoint coplanar triangles; actual hair tests follow only in --with-hair.
assert(riskAPI.trianglesIntersect154([[0,0,0],[1,0,0],[0,1,0]],[[.2,.2,-1],[.2,.2,1],[.6,.2,0]]));
assert(riskAPI.trianglesIntersect154([[0,0,0],[1,0,0],[0,1,0]],[[.2,.2,0],[.4,.2,0],[.2,.4,0]]));
assert(!riskAPI.trianglesIntersect154([[0,0,0],[1,0,0],[0,1,0]],[[2,2,0],[3,2,0],[2,3,0]]));

const coarse={sourceOnly:true,spec:helper.BLOUSE154_SPEC,ownedIndices:owned,vertices:p.count,index:Array.from(g.index.array),before:Array.from(p.array),after:Array.from(q.array),normalBefore:Array.from(n.array),normalAfter:Array.from(nn.array)};
fs.writeFileSync('review/blouse-drape154-coarse-data.json',JSON.stringify(coarse));

let hairRisk=null,hairConstructionMs=null,balancedProtected=true,balancedSourceHashes=null,balancedCandidateHashes=null;
if(process.argv.includes('--with-hair')){
 const {constructFull148}=await import('./upper-shoulder148-full-source.mjs');const t=performance.now(),rawHair=constructFull148(false,{baseline:true,capture:false});hairConstructionMs=performance.now()-t;
 const model=object('model'),hair=object('actual-accepted133-hair',H),sourceGroup=object('retained-source-blouse',B);group.matrixWorld=B;mesh.matrixWorld=B;
 const sourceMesh=attach(sourceGroup,helper.BLOUSE154_SPEC.mesh,g,B);for(const o of rawHair.children)attach(hair,o.name,o.geometry,H,o.material);model.add(group,sourceGroup,hair);
 // The detached original receives exactly the same unchanged99 source code as
 // the candidate. Native uses an unrendered proxy with this same single pass.
 applyBalance(model,{shiftX:-.24});
 for(let i=0;i<p.count;i++){
  assert(Object.is(q.getX(i),p.getX(i))&&Object.is(q.getY(i),p.getY(i)));
  if(!selected.has(i))for(let k=0;k<3;k++)if(!Object.is(p.array[i*3+k],q.array[i*3+k])||!Object.is(n.array[i*3+k],nn.array[i*3+k]))balancedProtected=false;
 }
 assert(balancedProtected);balancedSourceHashes=fingerprint(g);balancedCandidateHashes=fingerprint(candidate);
 hairRisk=riskAPI.inspectBlouseTriangles154({blouse:group,mesh,sourceGeometry:g,candidateGeometry:candidate,hair,ownedIndices:owned});
 assert.equal(hairRisk.newDegenerate+hairRisk.reversed+hairRisk.nonfinite,0);
 if(hairRisk.triangleContacts.newPairs||hairRisk.sampledDepth.newCrossings)fs.writeFileSync('review/blouse-drape154-contact-block.json',JSON.stringify({candidate:154,status:'Coarse contact block; no native-ready claim',spec:helper.BLOUSE154_SPEC,metrics,hairRisk},null,2)+'\n');
 assert.equal(hairRisk.triangleContacts.newPairs,0,'154 introduces an actual torso/hair triangle contact.');assert.equal(hairRisk.sampledDepth.newCrossings,0,'154 crosses a fixed projected hair surface.');
 assert.equal(sourceMesh.geometry,g);
}
const beforeRelease=mesh.geometry,release=helper.releaseBlouseDrape154(group);assert.equal(release.privateGeometriesDisposed,1);assert.equal(mesh.geometry,g);assert.notEqual(beforeRelease,g);
const files=['src/blouse.js','src/reference-cloth.js','src/hair-groom.js','src/hair-contact.js','src/lower-guide-placement.js','src/portrait-balance.js','review/blouse-drape-candidate154.js','review/blouse-drape154-geometry-audit.js','review/blouse-drape154-source-audit.mjs'];
const usage=process.cpuUsage(cpu),report={candidate:154,score:78,status:hairRisk?'Source coarse and actual fixed-hair checks passed; native art pending':'Coarse source checks passed; actual fixed-hair check pending',sourceOnly:true,sourceGeometry:'Exact current source sampling, Float32 arrays and analytic authored normals in the established arithmetic harness. Actual Three buffers/upload and full live scene are checked by the native wrapper.',spec:helper.BLOUSE154_SPEC,metrics,protection:{ownedVertices:owned.length,xyChanges,protectedPositionChanges,protectedNormalChanges,immutableAttributesExact:true,allReplacementBuffersPrivate:true,sourceBeforeApplicationHashes:sourceFingerprints,sourceUnmodifiedByHelper:true,balancedProtected,balancedSourceHashes,balancedCandidateHashes},normalTransport:{fieldSamples,maxGradientError,maxPlacketValueError,maxPlacketGradientError,normalError,continuousDeterminant:1},emittedCoarse:{affectedTriangles,newDegenerate,reversed,minTriangleCos,minAreaRatio,maxAreaRatio,chordSamples,maxChordDeviation,worstChord,subdivisionAdded:false},hairRisk,resources:{privateBytes,hairConstructionMs,elapsedMs:performance.now()-started,cpuMs:(usage.user+usage.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024},sourceHashes:Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(f))]))};
const out=hairRisk?'review/blouse-drape154-source-audit.json':'review/blouse-drape154-coarse-audit.json';fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,sourceHashes:undefined,protection:{...report.protection,sourceBeforeApplicationHashes:undefined,balancedSourceHashes:undefined,balancedCandidateHashes:undefined},hairRisk:hairRisk?{...hairRisk,triangleContacts:{...hairRisk.triangleContacts,examples:undefined},sampledDepth:{...hairRisk.sampledDepth,examples:undefined}}:null}));
