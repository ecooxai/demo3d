import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sourceHead147,disposals147,clearDisposals147,Matrix4,I,mul,T,point,object,attach,Geometry,Attr} from './eye-contour147-source.mjs';
import {applyEyeContour147,releaseEyeContour147,EYE_CONTOUR147_SPEC} from './eye-contour-candidate147.js';
import {createEyeContourField147} from './eye-contour147-field.js';
import {inspectEyeContourGeometry147,boundedContact147} from './eye-contour147-geometry-audit.js';
import {sampleStoredControls147,side147} from './eye-contour147-controls.js';
import config from './eye-contour147-config.json' with {type:'json'};

const started=performance.now(),cpuStart=process.cpuUsage(),hash=a=>createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex'),sha=b=>createHash('sha256').update(b).digest('hex');
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a),xyz=(p,i)=>[p.getX(i),p.getY(i),p.getZ(i)],field=createEyeContourField147(config);
const unit=v=>{const length=Math.hypot(...v);return v.map(x=>x/length);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
const snapshot=head=>{const out=[];head.traverse(mesh=>{if(mesh.isMesh)out.push({mesh,side:side147(mesh),label:`${side147(mesh)}/${mesh.name}`,geometry:mesh.geometry,material:mesh.material,metadata:JSON.stringify(mesh.geometry.userData),
 bounds:JSON.stringify([mesh.geometry.boundingBox,mesh.geometry.boundingSphere]),attributes:entries(mesh.geometry).map(([key,a])=>({key,a,array:a.array,version:a.version,hash:hash(a.array)}))});});return out;};
function exact(records,restored=false){for(const r of records){assert.equal(r.mesh.material,r.material);assert.equal(JSON.stringify(r.geometry.userData),r.metadata);assert.equal(JSON.stringify([r.geometry.boundingBox,r.geometry.boundingSphere]),r.bounds);if(restored)assert.equal(r.mesh.geometry,r.geometry);for(const q of r.attributes){assert.equal(q.key==='index'?r.geometry.index:r.geometry.getAttribute(q.key),q.a);assert.equal(q.a.array,q.array);assert.equal(q.a.version,q.version);assert.equal(hash(q.array),q.hash);}}}

const zero={isObject3D:true,traverse(){throw Error('zero traversed');},updateWorldMatrix(){throw Error('zero transformed');}};
assert.equal(applyEyeContour147(zero),applyEyeContour147(zero,{strength:0}));assert.throws(()=>applyEyeContour147(zero,{strength:.5}),/OFF\/ON/);
const cases=[],frames=[['accepted',I()],['oblique-nonuniform',mul(T(.08,-.04,.11),new Matrix4([1.23,.07,.02,0,.13,.84,.05,0,.08,-.04,1.12,0,0,0,0,1]))]];
for(const[name,frame]of frames){
 const head=sourceHead147(frame),records=snapshot(head),sources=new Set(records.flatMap(r=>r.attributes.map(a=>a.array.buffer))),originalControls=sampleStoredControls147(head,{requireBaseline:name==='accepted'}),upper=records.find(r=>r.mesh.name==='upper-lip'),lower=records.find(r=>r.mesh.name==='lower-lip');
 const metrics=applyEyeContour147(head,{strength:1,retainSourceForQA:true});assert.equal(applyEyeContour147(head,{strength:1,retainSourceForQA:true}),metrics);assert.throws(()=>applyEyeContour147(head,{strength:0}),/release or a fresh head/);exact(records);
 assert.equal(upper.mesh.geometry,upper.geometry);assert.equal(lower.mesh.geometry,lower.geometry);
 let exactOutside=0,zerosBefore=0,zerosAfter=0,privateBytes=0,maximumFDNormalError=0,fdNormals=0;
 const own=new Set();
 for(const r of records){
  const g=r.mesh.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal'),op=r.geometry.getAttribute('position'),on=r.geometry.getAttribute('normal'),m=r.mesh.matrixWorld,back=m.clone().invert();
  if(g!==r.geometry){own.add(g);for(const[key,a]of entries(g)){assert(!sources.has(a.array.buffer));privateBytes+=a.array.byteLength;if(!['position','normal'].includes(key))assert.equal(hash(a.array),r.attributes.find(q=>q.key===key).hash);}}
  for(let i=0;i<p.count;i++){
   const old=xyz(op,i),world=point(m,old),f=field.world(...world),normal=xyz(on,i),next=xyz(n,i);
   if(normal.every(x=>x===0)){zerosBefore++;assert.deepEqual(next,normal);}if(next.every(x=>x===0))zerosAfter++;
   if(!f.active){assert.deepEqual(xyz(p,i),old);assert.deepEqual(next,normal);exactOutside++;continue;}
   if(normal.every(x=>x===0)||i%97!==0)continue;
   // Differentiate the complete world/local point operation, then obtain its
   // cofactor normal transform independently. No assumed UV/frame equality.
   const deform=local=>{const w=point(m,local),d=field.world(...w).delta;return point(back,w.map((v,k)=>v+d[k]));},e=2e-6,columns=[];
   for(let axis=0;axis<3;axis++){const a=old.slice(),b=old.slice();a[axis]+=e;b[axis]-=e;const x=deform(a),y=deform(b);columns.push(x.map((v,k)=>(v-y[k])/(2*e)));}
   const[a,b,c]=columns,bc=cross(b,c),ca=cross(c,a),ab=cross(a,b),det=dot(a,bc),expected=unit([0,1,2].map(k=>(bc[k]*normal[0]+ca[k]*normal[1]+ab[k]*normal[2])/det));
   maximumFDNormalError=Math.max(maximumFDNormalError,...expected.map((v,k)=>Math.abs(v-next[k])));fdNormals++;
  }
 }
 assert.equal(zerosBefore,zerosAfter);assert.equal(privateBytes,metrics.privateAttributeBytes);assert(maximumFDNormalError<2e-6);
 const controls=sampleStoredControls147(head),geometry=inspectEyeContourGeometry147(records);
 assert(geometry.orientation.every(p=>p.newDegenerate===0&&p.opposedToTransportedGeometry===0));
 const maximumControlResidual=Math.max(...controls.points.slice(0,12).map(p=>Math.hypot(...p.controlResidual)));
 assert(maximumControlResidual<.01,'Actual triangle interpolation must stay within the explicitly measured bounded residual.');
 const cleanup=releaseEyeContour147(head);exact(records,true);assert.equal(cleanup.privateGeometriesDisposed,own.size);assert.equal(disposals147().length,own.size);
 for(const d of disposals147()){assert(own.has(d.geometry));for(const a of[...Object.values(d.attributes),d.index].filter(Boolean))assert(!sources.has(a.array.buffer));}
 assert.equal(releaseEyeContour147(head).released,false);
 cases.push({frame:name,metrics,exactOutsideVertices:exactOutside,zerosBefore,zerosAfter,fdNormals,maximumFDNormalError,maximumControlResidual,sourceImmutable:true,ownedCleanup:true,originalControls,controls,geometry,cleanup});
}

// A genuine sharing/atomicity case: two objects sharing one geometry/frame
// must share one safe clone; a differing frame must receive its own clone.
const mini=object('anatomical-head');mini.userData={portraitProportions:{factor:.94},lipThicknessRefinement:{strength:.06}};
const stub=new Geometry().setAttribute('position',new Attr([0,0,0],3)).setAttribute('normal',new Attr([0,0,1],3)).setIndex([0,0,0]);stub.userData={upperLipRelief140:{version:'upper-lip-relief-140',blend:.5,endFraction:.875}};attach(mini,'upper-lip',stub,I());
const points=[[-.20,3.07,.55],[-.17,3.07,.56],[-.17,3.04,.57],[-.20,3.04,.55]],shared=new Geometry().setAttribute('position',new Attr(points.flat(),3)).setAttribute('normal',new Attr(points.flatMap((p,i)=>i?[.1,.2,Math.sqrt(.95)]:[0,0,0]),3)).setAttribute('uv',new Attr([0,0,1,0,1,1,0,1],2)).setIndex([0,1,2,0,2,3]);
const a=attach(mini,'shared-a',shared,I()),b=attach(mini,'shared-b',shared,I()),c=attach(mini,'shared-c',shared,T(.02,0,0)),saved=snapshot(mini);clearDisposals147();
const sharing=applyEyeContour147(mini,{strength:1,retainSourceForQA:true});assert.equal(a.geometry,b.geometry);assert.notEqual(a.geometry,c.geometry);assert.equal(sharing.privateGeometryCount,2);releaseEyeContour147(mini);exact(saved,true);
const originalClone=shared.clone;shared.clone=()=>shared;assert.throws(()=>applyEyeContour147(mini,{strength:1,retainSourceForQA:true}),/original geometry/);assert.equal(disposals147().filter(d=>d.geometry===shared).length,0);exact(saved,true);shared.clone=originalClone;
const noRetention=applyEyeContour147(mini,{strength:1});assert.equal(noRetention.retainedSourceGeometryReferences,0);assert.equal(noRetention.retainSourceForQA,false);assert.throws(()=>releaseEyeContour147(mini),/does not retain source geometry/);

// BVH narrow-phase fixture: old gap .005, new actual intersecting triangle.
const tri=p=>({p}),p=[[-.2,-.2,0],[.2,-.2,0],[0,.2,0]],q=p.map(v=>[v[0],v[1],.005]),r=[[-.2,-.2,-.002],[.2,-.2,.002],[0,.2,0]],moving=[{id:0,before:tri(q),after:tri(r),min:[-.2,-.2,-.002],max:[.2,.2,.005]}],obstacle=[{id:0,before:tri(p),after:tri(p),min:[-.2,-.2,0],max:[.2,.2,0]}];
const contactFixture=boundedContact147(moving,obstacle,{window:.01});assert.equal(contactFixture.beforeContacts,0);assert.equal(contactFixture.afterContacts,1);assert.equal(contactFixture.newContactPairs,1);assert(Math.abs(contactFixture.minimumBeforeWithinWindow-.005)<1e-12);
const cpu=process.cpuUsage(cpuStart),files=['review/eye-contour-candidate147.js','review/eye-contour147-source.mjs','review/eye-contour147-controls.js','review/eye-contour147-geometry-audit.js','review/eye-contour147-applier-audit.mjs','review/eye-contour147-config.json','review/eye-contour147-field.js','review/likeness145-native.json','src/face.js','src/lip-continuity.js','src/upper-lip-relief.js'];
const report={candidate:147,status:'Source applier checks passed; complete native art pending',scoreUnchanged:77,native:false,spec:EYE_CONTOUR147_SPEC,cases,sharing:{sameFrameOneClone:true,differentFrameSeparateClone:true,sourceCloneRejectedWithoutDisposal:true,defaultProductionSourceRetention:false,metrics:sharing},contactFixture,
 cost:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRSSMiB:process.resourceUsage().maxRSS/1024},files:Object.fromEntries(files.map(file=>{const b=fs.readFileSync(file);return[file,{bytes:b.length,sha256:sha(b)}]})),
 limitations:'Source geometry harness reproduces actual continuous face, both accepted lips and four core eye surfaces in the accepted matrix chain. Its20 stored controls match corrected145 in the aligned frame. Tubes, eyebrows, ears, hidden glints, actual materials and groom contact are checked by the native wrapper, not this source-only harness. Private QA arrays are temporary. No render or art gain is claimed.'};
fs.writeFileSync('review/eye-contour147-applier-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidate:147,status:report.status,cost:report.cost,cases:cases.map(c=>({frame:c.frame,privateBytes:c.metrics.privateAttributeBytes,changed:c.metrics.changedPositions,maximumFDNormalError:c.maximumFDNormalError,maximumControlResidual:c.maximumControlResidual,triangleOrientation:c.geometry.orientation.map(p=>({surface:p.surface,area:p.minimumAreaRatio,dot:p.minimumExpectedNormalDot})),ocularContactChanges:c.geometry.ocularContacts.map(p=>({side:p.side,surfaces:p.surfaces,new:p.newContactPairs,before:p.beforeContacts,after:p.afterContacts}))}))}));
