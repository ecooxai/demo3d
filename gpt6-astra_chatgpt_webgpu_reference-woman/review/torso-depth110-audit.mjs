import fs from 'node:fs';
import assert from 'node:assert/strict';
import {THREE,V,Attr,Geometry,Group,Mesh,Matrix4,I,mul,T,RY,RZ,point,object,attach,hash,read,matrixCount,sha} from './torso-depth110-harness.mjs';

const sourceText=fs.readFileSync('review/torso-depth-candidate110.js','utf8');
const {applyTorsoDepth110,fieldAt,amplitudes}=new Function('Matrix4',read('review/torso-depth-candidate110.js')+'\nreturn {applyTorsoDepth110,fieldAt,amplitudes};')(Matrix4);
const field=new Float64Array(4),delta=(y,z,s)=>{const a=amplitudes(s);fieldAt(y,z,...a,field);return field[0];};
const warp=(p,s)=>[p[0],p[1],p[2]+delta(p[1],p[2],s)];
const maxAbs=a=>Math.max(...a.map(Math.abs));
const started=performance.now(),cpuStart=process.cpuUsage();

// Zero does not touch scene state or allocate matrices. Repeated zero shares
// the frozen result and still permits a later nonzero application.
const zModel={isObject3D:true,traverse(){throw new Error('zero traversed');},updateWorldMatrix(){throw new Error('zero updated matrices');}};
const allocations=matrixCount(),zero=applyTorsoDepth110(zModel);
assert.equal(applyTorsoDepth110(zModel,{strength:0}),zero);assert.equal(matrixCount(),allocations);assert(Object.isFrozen(zero));

const points=[[-1,-1.5,.5],[-.5,-1.28,.7],[.4,-1.03,.75],[-.3,-.70,-.55],[.2,0,.75],[1,.4,1.14],[0,.6,-.17],[.3,.96,.5],[0,1.24,.75],[-.2,1.6,.7],[0,2.4,.2]];
function geometry(ps=points){
 const g=new Geometry().setAttribute('position',new Attr(ps.flat(),3)).setAttribute('normal',new Attr(ps.flatMap((_,i)=>{const a=[.3+.07*i,.5-.04*i,.8],l=Math.hypot(...a);return a.map(v=>v/l);}),3));
 g.setAttribute('uv',new Attr(ps.flatMap((_,i)=>[i/ps.length,.37]),2));g.setAttribute('uv1',new Attr(ps.flatMap((_,i)=>[.15,i/ps.length]),2));g.setAttribute('color',new Attr(ps.flatMap(()=>[.3,.4,.5]),3));g.setIndex([0,1,2,2,3,4,4,5,6]);return g;
}
function snapshot(mesh){
 const g=mesh.geometry;return{mesh,g,positions:g.getAttribute('position').array.slice(),normals:g.getAttribute('normal').array.slice(),others:Object.fromEntries(Object.entries(g.attributes).filter(([k])=>!['position','normal','tangent'].includes(k)).map(([k,a])=>[k,{attribute:a,hash:hash(a.array)}])),index:g.index,indexHash:g.index?hash(g.index.array):null,material:mesh.material};
}
function exactAttachments(old){
 const g=old.mesh.geometry;assert.equal(old.mesh.material,old.material);assert.equal(g.index,old.index);if(g.index)assert.equal(hash(g.index.array),old.indexHash);
 for(const[k,o]of Object.entries(old.others)){assert.equal(g.getAttribute(k),o.attribute);assert.equal(hash(o.attribute.array),o.hash);}
 // Every original buffer remains untouched, even if its mesh has changed.
 assert.equal(hash(old.g.getAttribute('position').array),hash(old.positions));assert.equal(hash(old.g.getAttribute('normal').array),hash(old.normals));
}
const transforms=[I(),mul(T(.1,-.2,.3),mul(RY(.34),RZ(-.2))),new Matrix4([1.4,.1,0,0,.18,.7,.05,0,.08,-.12,1.7,0,.2,.1,-.1,1]),new Matrix4([-1.2,.17,.06,0,.11,1.4,.2,0,0,.13,.65,0,-.4,.2,.1,1])];
let maxPositionConjugacy=0,maxNormalAngle=0,maxProtectedByteChanges=0,sharedCloneCount=0;
for(const strength of[.5,1]){
 const outer=mul(T(.31,-.27,.2),mul(RZ(.22),new Matrix4([1.3,0,0,0,0,.8,0,0,0,0,1.1,0,0,0,0,1]))),model=object('model',outer),before=[],shared=geometry();
 for(let k=0;k<transforms.length;k++){const g=k<2?shared:geometry(),mesh=attach(model,'synthetic-'+k,g,mul(outer,transforms[k]));before.push({...snapshot(mesh),mat:transforms[k]});}
 const metrics=applyTorsoDepth110(model,{strength});sharedCloneCount+=metrics.sharedGeometryClones;
 assert.notEqual(before[0].mesh.geometry,before[1].mesh.geometry);
 for(const old of before){
  exactAttachments(old);const g=old.mesh.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal'),inverse=old.mat.clone().invert(),e=2e-5;
  for(let i=0;i<p.count;i++){
   const pp=Array.from(old.positions.subarray(i*3,i*3+3)),nn=Array.from(old.normals.subarray(i*3,i*3+3)),q=point(old.mat,pp),actual=point(old.mat,[p.getX(i),p.getY(i),p.getZ(i)]),expected=warp(q,strength);
   maxPositionConjugacy=Math.max(maxPositionConjugacy,maxAbs(actual.map((v,k)=>v-expected[k])));
   if(q[1]>=1.6||q[1]<=-1.28)for(let k=0;k<3;k++)if(p.array[i*3+k]!==old.positions[i*3+k]||n.array[i*3+k]!==old.normals[i*3+k])maxProtectedByteChanges++;
   const jac=Array.from({length:3},(_,axis)=>{const a=pp.slice(),b=pp.slice();a[axis]+=e;b[axis]-=e;const pa=point(inverse,warp(point(old.mat,a),strength)),pb=point(inverse,warp(point(old.mat,b),strength));return pa.map((v,k)=>(v-pb[k])/(2*e));});
   const J=new Matrix4([jac[0][0],jac[0][1],jac[0][2],0,jac[1][0],jac[1][1],jac[1][2],0,jac[2][0],jac[2][1],jac[2][2],0,0,0,0,1]).invert().elements;
   const want=[J[0]*nn[0]+J[1]*nn[1]+J[2]*nn[2],J[4]*nn[0]+J[5]*nn[1]+J[6]*nn[2],J[8]*nn[0]+J[9]*nn[1]+J[10]*nn[2]],l=Math.hypot(...want),have=[n.getX(i),n.getY(i),n.getZ(i)],al=Math.hypot(...have);
   const cosine=want.reduce((s,v,k)=>s+v*have[k],0)/(l*al);maxNormalAngle=Math.max(maxNormalAngle,Math.acos(Math.min(1,Math.max(-1,cosine)))*180/Math.PI);
  }
 }
 const bytes=before.map(o=>[hash(o.mesh.geometry.getAttribute('position').array),hash(o.mesh.geometry.getAttribute('normal').array)]);
 assert.equal(applyTorsoDepth110(model,{strength}),metrics);assert.throws(()=>applyTorsoDepth110(model,{strength:0}),/freshly built model/);assert.throws(()=>applyTorsoDepth110(model,{strength:strength===1?.5:1}),/freshly built model/);
 before.forEach((o,i)=>assert.deepEqual([hash(o.mesh.geometry.getAttribute('position').array),hash(o.mesh.geometry.getAttribute('normal').array)],bytes[i]));
}
assert(maxPositionConjugacy<4e-7);assert(maxNormalAngle<.00002);assert.equal(maxProtectedByteChanges,0);

// Optional authored tangents are transported forwards, normalised and kept
// orthogonal to the inverse-transpose normal without changing handedness.
const tangentModel=object('tangent-test'),tg=geometry();
const tn=tg.getAttribute('normal'),ta=[];
for(let i=0;i<tn.count;i++){const x=tn.getY(i),y=-tn.getX(i),l=Math.hypot(x,y);ta.push(x/l,y/l,0,i%2?1:-1);}
tg.setAttribute('tangent',new Attr(ta,4));const tm=attach(tangentModel,'tangent-mesh',tg,transforms[2]);applyTorsoDepth110(tangentModel,{strength:1});
let maxTangentOrthogonality=0;
for(let i=0;i<tn.count;i++){const n=tm.geometry.getAttribute('normal'),t=tm.geometry.getAttribute('tangent');assert.equal(t.getW(i),ta[i*4+3]);maxTangentOrthogonality=Math.max(maxTangentOrthogonality,Math.abs(n.getX(i)*t.getX(i)+n.getY(i)*t.getY(i)+n.getZ(i)*t.getZ(i)));}
assert(maxTangentOrthogonality<2e-7);

// Both input failure after an earlier valid mesh and failure while cloning a
// later mesh must leave every original reference and byte unchanged.
for(const mode of['late-input-nan','late-clone-failure','protected-head','singular']){
 const model=object('failure-'+mode),good=attach(model,'first-valid',geometry(),I()),badGeometry=geometry(),bad=attach(model,'last-invalid',badGeometry,I()),goodBefore=snapshot(good),badBefore=snapshot(bad);
 if(mode==='late-input-nan')badGeometry.getAttribute('normal').array[1]=NaN;
 if(mode==='late-clone-failure')badGeometry.clone=()=>{throw new Error('intentional late staging failure');};
 if(mode==='protected-head'){const headRoot=object('anatomical-head');headRoot.parent=model;bad.parent=headRoot;}
 if(mode==='singular')bad.matrixWorld=new Matrix4(new Array(16).fill(0));
 const badPositionHash=hash(badGeometry.getAttribute('position').array),badNormalHash=hash(badGeometry.getAttribute('normal').array);
 assert.throws(()=>applyTorsoDepth110(model,{strength:1}));assert.equal(good.geometry,goodBefore.g);exactAttachments(goodBefore);assert.equal(bad.geometry,badBefore.g);assert.equal(hash(badGeometry.getAttribute('position').array),badPositionHash);assert.equal(hash(badGeometry.getAttribute('normal').array),badNormalHash);
}

// Analytic derivatives checked against independent differences throughout the
// active domain, including all four C2 transition boundaries.
const fieldResults=[];
for(const strength of[.5,1]){
 const [front,rear]=amplitudes(strength);let minJac=Infinity,maxJac=-Infinity,maxDy=0,maxDelta=0,maxDerivativeError=0,orderPairs=0,minSampleGapRatio=Infinity;
 for(let yi=0;yi<=340;yi++)for(let zi=0;zi<=480;zi++){
  const y=-1.5+yi*.01,z=-2.4+zi*.01;fieldAt(y,z,front,rear,field);const d=field[0],dy=field[1],dz=field[2];minJac=Math.min(minJac,1+dz);maxJac=Math.max(maxJac,1+dz);maxDy=Math.max(maxDy,Math.abs(dy));maxDelta=Math.max(maxDelta,Math.abs(d));
  if(yi%11===0&&zi%13===0){const e=1e-5,fy=(delta(y+e,z,strength)-delta(y-e,z,strength))/(2*e),fz=(delta(y,z+e,strength)-delta(y,z-e,strength))/(2*e);maxDerivativeError=Math.max(maxDerivativeError,Math.abs(fy-dy),Math.abs(fz-dz));}
  const dzStep=.007,d2=delta(y,z+dzStep,strength),ratio=(dzStep+d2-d)/dzStep;minSampleGapRatio=Math.min(minSampleGapRatio,ratio);assert(ratio>.49);orderPairs++;
 }
 let boundaryFirstDerivative=0,boundarySecondDerivative=0;
 for(const y of[-1.28,-.10,.10,1.60])for(const z of[-.55,.75,1.14]){const e=1e-5,d=delta(y,z,strength),a=delta(y-e,z,strength),b=delta(y+e,z,strength);boundaryFirstDerivative=Math.max(boundaryFirstDerivative,Math.abs((b-a)/(2*e)));boundarySecondDerivative=Math.max(boundarySecondDerivative,Math.abs((a+b-2*d)/(e*e)));}
 assert(maxDerivativeError<2e-8);assert(boundaryFirstDerivative<1e-7);assert(boundarySecondDerivative<.0002);
 fieldResults.push({strength,frontPeak:front,rearPeak:rear,conservativeMinimumJacobian:1-(front+rear)*Math.SQRT2*Math.exp(-.5)/.54,sampledMinimumJacobian:minJac,sampledMaximumJacobian:maxJac,maximumYShear:maxDy,maximumDisplacement:maxDelta,maximumFiniteDifferenceDerivativeError:maxDerivativeError,sampledOrderedPairs:orderPairs,minimumSampleGapRatio:minSampleGapRatio,boundaryFirstDerivative,boundarySecondDerivative});
}

// Exact current source surfaces, placed with the existing head/body transforms.
// Geometry accessory envelopes are clearly separate from native full-scene QA.
V.prototype.negate=function(){return this.multiplyScalar(-1);};
const blouseText=fs.readFileSync('src/blouse.js','utf8'),hairText=fs.readFileSync('src/hair-groom.js','utf8');
const c=new Function('THREE',read('src/blouse.js')+'\nreturn {surface,torsoPoint,clothGeometry,solidifyGrid,collarPoint,facingPoint,facingNormal,bodyNormal,broadenShoulders,neckPoint,placketX,bodyAtXY,BUTTON_Y,sampleBlouseFrontAtXY};')(THREE);
const face=new Function('THREE',read('src/face.js')+'\nreturn {profile,faceZ,portraitY,refineEarBed};')(THREE);
const fit=new Function('Matrix4',read('src/portrait-proportions.js')+'\nreturn {lowerFaceWarp,neckBlend};')(Matrix4);
const pose=new Function('Matrix4',read('src/portrait-pose.js')+'\nreturn blendAt;')(Matrix4);
const balance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4);
const contact=new Function('sampleBlouseFrontAtXY',read('src/hair-contact.js')+'\nreturn createHairContact;')(c.sampleBlouseFrontAtXY);
const createHair=new Function('THREE','faceZ','createHairContact',read('src/hair-groom.js')+'\nreturn createGroomHair;')(THREE,face.faceZ,contact);
const H0=mul(T(0,2.95,0),mul(RY(.16),RZ(-.17))),H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17))),B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0)));
const garment=new Group(),parts=[],mat={name:'source-audit-material'};
const add=(name,g)=>{const m=new Mesh(g,mat);m.name=name;garment.add(m);parts.push(m);};
add('blouse-continuous-torso-and-sleeves',c.clothGeometry());
for(const side of[-1,1]){
 const g=c.surface(24,48,(u,v)=>c.collarPoint(side,u,v));if(side<0){for(let i=0;i<g.index.count;i+=3){const b=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,b);}g.computeVertexNormals();}
 add(`blouse-${side}-spread-collar`,c.solidifyGrid(g,24,48,.0045));add(`blouse-${side}-neck-opening-facing`,c.surface(8,48,(u,v)=>c.facingPoint(side,u,v)));
}
add('blouse-curved-centre-placket',c.solidifyGrid(c.surface(10,74,(u,v)=>{const y=.780+(-1.45-.780)*v,x=c.placketX(y)+(u-.5)*(.174+.014*v),p=c.bodyAtXY(x,y);return[x,y,p[2]+.007+.006*Math.sin(u*Math.PI)**.7];}),10,74,.0045));
// Sample a conservative shallow button disk at each actual placement and
// orientation; detailed holes/threads are covered by the native batched meshes.
for(let k=0;k<4;k++){
 const isBody=k<3,y=c.BUTTON_Y[k],x=isBody?c.placketX(y):0,center=isBody?c.bodyAtXY(x,y):c.facingPoint(1,.68,.735),normal=isBody?c.bodyNormal(x,y):c.facingNormal(1,.68,.735),up=new V(0,1,0),right=new V().crossVectors(up,normal).normalize(),vertical=new V().crossVectors(normal,right).normalize();center[2]+=.027;
 const g=c.surface(64,5,(u,v)=>{const radius=.062*v,angle=u*2*Math.PI,ax=radius*Math.cos(angle),ay=radius*Math.sin(angle);return[center[0]+ax*right.x+ay*vertical.x,center[1]+ax*right.y+ay*vertical.y,center[2]+ax*right.z+ay*vertical.z];});add('buttons-audit-disk-'+k,g);
}
// The exact source crop ring, with a fan interior, proves its envelope remains
// untouched; its triangulation is intentionally not a ShapeGeometry clone.
const capPoints=[[0,-1.449,0]];for(let i=0;i<=96;i++){const p=c.torsoPoint((i%96)/96,1);capPoints.push([p[0],-1.449,p[2]]);}const cap=geometry(capPoints);cap.setIndex(Array.from({length:96},(_,i)=>[0,i+1,i+2]).flat());add('blouse-finished-bust-base-audit-fan',cap);
c.broadenShoulders(garment);
const neck=c.surface(80,44,(u,v)=>c.neckPoint(u*2*Math.PI,.69+v*(2.08-.69))),np=neck.getAttribute('position'),toHead=mul(H0.clone().invert(),B),backB=B.clone().invert();
for(let i=0;i<np.count;i++){
 const local=[np.getX(i),np.getY(i),np.getZ(i)],hy=point(toHead,local)[1],amount=fit.lowerFaceWarp(hy).displacement*fit.neckBlend(local[1]).weight,mH=H0.elements,mB=backB.elements,worldDY=[mH[4]*amount,mH[5]*amount,mH[6]*amount],d=[mB[0]*worldDY[0]+mB[4]*worldDY[1]+mB[8]*worldDY[2],mB[1]*worldDY[0]+mB[5]*worldDY[1]+mB[9]*worldDY[2],mB[2]*worldDY[0]+mB[6]*worldDY[1]+mB[10]*worldDY[2]];
 local.forEach((_,k)=>local[k]+=d[k]);const posed=.26*pose(local[1]).weight;local[0]+=mB[0]*posed;local[1]+=mB[1]*posed;local[2]+=mB[2]*posed;np.setXYZ(i,...local);
}neck.computeVertexNormals();
const head=c.surface(380,290,(u,v)=>{const y=-1.18+v*2.72,a=-Math.PI+u*2*Math.PI,[w,front,rear]=face.profile(y),x=w*Math.sin(a),z=Math.cos(a)>=0?face.faceZ(x,y):rear*Math.cos(a);return[x,face.portraitY(y),z];});
face.refineEarBed(head);const hp=head.getAttribute('position');for(let i=0;i<hp.count;i++)hp.setY(i,hp.getY(i)+fit.lowerFaceWarp(hp.getY(i)).displacement);head.computeVertexNormals();
const hair=createHair({headShiftX:.26,shoulderContact:.35});
const sourceResults=[];
for(const strength of[.5,1]){
 const model=object('current-source-surfaces'),headRoot=object('anatomical-head'),neckRoot=object('original-neck-and-clavicle-transition');model.add(headRoot,neckRoot);
 attach(headRoot,'continuous-face',head.clone(),H);attach(neckRoot,'neck-smooth-anatomical-surface',neck.clone(),B);
 for(const m of parts)attach(model,m.name,m.geometry.clone(),B,m.material);
 for(const m of hair.children)attach(model,m.name,m.geometry.clone(),H,m.material);
 balance(model,{shiftX:-.24});const originals=[];model.traverse(m=>{if(m.isMesh)originals.push(snapshot(m));});
 const metrics=applyTorsoDepth110(model,{strength});let maximumXYChange=0,maximumMapError=0,protectedByteChanges=0,cropByteChanges=0,nonfinite=0,normalLengthError=0;
 for(const old of originals){
  exactAttachments(old);const p=old.mesh.geometry.getAttribute('position'),n=old.mesh.geometry.getAttribute('normal');
  for(let i=0;i<p.count;i++){
   const pp=Array.from(old.positions.subarray(i*3,i*3+3)),q=point(old.mesh.matrixWorld,pp),a=point(old.mesh.matrixWorld,[p.getX(i),p.getY(i),p.getZ(i)]),expected=warp(q,strength);
   maximumXYChange=Math.max(maximumXYChange,Math.abs(a[0]-q[0]),Math.abs(a[1]-q[1]));maximumMapError=Math.max(maximumMapError,maxAbs(a.map((v,k)=>v-expected[k])));
   if(!Number.isFinite(a[0]+a[1]+a[2]+n.getX(i)+n.getY(i)+n.getZ(i)))nonfinite++;
   const l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(l>0)normalLengthError=Math.max(normalLengthError,Math.abs(l-1));
   if(q[1]>=1.6||q[1]<=-1.28)for(let k=0;k<3;k++){const changed=p.array[i*3+k]!==old.positions[i*3+k]||n.array[i*3+k]!==old.normals[i*3+k];if(changed){if(q[1]>=1.6)protectedByteChanges++;else cropByteChanges++;}}
  }
 }
 assert(maximumXYChange<3e-7);assert(maximumMapError<3e-7);assert.equal(protectedByteChanges,0);assert.equal(cropByteChanges,0);assert.equal(nonfinite,0);assert(normalLengthError<2e-6);assert.equal(metrics.components['protected-head'].changedVertices,0);assert.equal(metrics.components['hair-crown'].changedVertices,0);
 sourceResults.push({strength,metrics,maximumXYChange,maximumMapError,protectedByteChanges,cropByteChanges,normalLengthError});global.gc?.();
}
const cpu=process.cpuUsage(cpuStart),result={audit:'torso-depth110-source',native:false,sourceOnly:true,candidate:{bytes:Buffer.byteLength(sourceText),sha256:sha(sourceText)},sourceVersions:{blouse:{bytes:Buffer.byteLength(blouseText),sha256:sha(blouseText)},hair:{bytes:Buffer.byteLength(hairText),sha256:sha(hairText)}},api:{zeroNoTraversalOrMatrices:true,zeroResultShared:true,sameStrengthByteIdempotent:true,differentStrengthRejected:true,atomicInputAndStagingFailures:4,originalBuffersNeverMutated:true,sharedGeometryClones:sharedCloneCount,topologyUV0UV1ColorMaterialsExact:true,affineCases:transforms.length,maximumPositionConjugacyError:maxPositionConjugacy,maximumFiniteDifferenceNormalAngleDegrees:maxNormalAngle,protectedByteChanges:maxProtectedByteChanges,maximumTangentNormalDot:maxTangentOrthogonality},field:fieldResults,sourceResults,scope:'Exact current cloth/collar/facing/placket surfaces and primary head; source neck with50/52 position fitting; complete current108 groom with.35 contact; accepted99 applied before110. Button disks are conservative placement/orientation samples, crop uses exact96-point contour with a fan, seam tubes and facial accessories are omitted. Native audit checks all actual scene meshes and original attachments. Triangle approximation and sampled order are checked separately.',resources:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024,finalMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,+(v/1048576).toFixed(1)]))}};
fs.writeFileSync('review/torso-depth110-source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:'passed',api:result.api,field:fieldResults,cases:sourceResults.map(r=>({strength:r.strength,minJac:r.metrics.minimumJacobian,meshes:r.metrics.meshes,vertices:r.metrics.vertices,triangles:r.metrics.triangles,changed:r.metrics.changedVertices,stagedMiB:r.metrics.stagedAttributeBytes/1048576,maxXY:r.maximumXYChange,mapError:r.maximumMapError,normalError:r.normalLengthError,components:r.metrics.components,elapsedMs:r.metrics.elapsedMs})),resources:result.resources}));
