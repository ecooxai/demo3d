import {boundedLashSweep151,V151} from './eyelash-sweep151.js';

const VERSION='existing-lash-sweep-151',applications=new WeakMap();
const {add,sub,scale,dot,cross}=V151,norm=a=>Math.hypot(...a),unit=a=>{const length=norm(a);if(!(length>1e-12))throw Error('151 invalid direction.');return scale(a,1/length);};
const entries=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const xyz=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)];
const point=(a,p)=>[a[0]*p[0]+a[4]*p[1]+a[8]*p[2]+a[12],a[1]*p[0]+a[5]*p[1]+a[9]*p[2]+a[13],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]+a[14]];
const linear=(a,p)=>[a[0]*p[0]+a[4]*p[1]+a[8]*p[2],a[1]*p[0]+a[5]*p[1]+a[9]*p[2],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]];
const transpose=(a,p)=>[a[0]*p[0]+a[1]*p[1]+a[2]*p[2],a[4]*p[0]+a[5]*p[1]+a[6]*p[2],a[8]*p[0]+a[9]*p[1]+a[10]*p[2]];
const demand=(v,m)=>{if(!v)throw Error('151 '+m);};
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,privateGeometryCount:0,privateAttributeBytes:0,perFrameWork:0,elapsedMs:0});
export const EYELASH151_SPEC=Object.freeze({version:VERSION,strengths:Object.freeze([0,1]),target:'individual-eyelashes',meshCount:2,fibers:80,vertices:2064,triangles:2616,rootRingVertices:320,
 maximumContinuousDisplacement:.016,maximumLengthRatio:1.02,tipRadiusRatio:.08,addedDraws:0,addedTextures:0,perFrameWork:0,
 interpretation:'Private deformation of existing post147 lash tubes. All margins, menisci, eyelids, iris/cornea, optics, UVs and indices are unchanged.'});

function frame(head,mesh){
 const inverseHead=head.matrixWorld.clone().invert(),matrix=mesh.matrixWorld.clone().multiplyMatrices(inverseHead,mesh.matrixWorld),a=matrix.elements.slice(),det=matrix.determinant();
 demand(Number.isFinite(det)&&Math.abs(det)>1e-12&&a.every(Number.isFinite)&&Math.abs(a[3])+Math.abs(a[7])+Math.abs(a[11])+Math.abs(a[15]-1)<1e-12,'requires finite invertible affine mesh frames.');
 return{a,inverse:matrix.clone().invert().elements.slice()};
}
function parts151(){
 const out=[];let vertex=0,triangle=0;
 for(let i=0;i<40;i++){
  const upper=i<29,index=upper?i:i-29,segments=upper?6:4,count=(segments+1)*4;
  out.push({upper,index,segments,vertex,vertices:count,triangle,triangles:segments*6});vertex+=count;triangle+=segments*6;
 }
 return out;
}
export const lashParts151=()=>parts151();

function validate(geometry){
 const p=geometry?.getAttribute('position'),n=geometry?.getAttribute('normal'),uv=geometry?.getAttribute('uv'),index=geometry?.index;
 demand(geometry?.userData?.eyeContour147?.version==='eye-contour-147','requires the accepted147 private lash geometry.');
 demand(p?.count===1032&&n?.count===1032&&p.itemSize===3&&n.itemSize===3&&uv?.count===1032&&uv.itemSize===2&&index?.count===3924,'original lash population/layout changed.');
 demand(!geometry.getAttribute('tangent')&&!Object.values(geometry.morphAttributes||{}).some(a=>a.length),'does not modify tangent or morph data.');
 for(const [key,a]of entries(geometry))demand(!a.isInterleavedBufferAttribute&&ArrayBuffer.isView(a.array)&&(!['position','normal','uv'].includes(key)||a.array instanceof Float32Array),'requires explicit original float attributes.');
 for(const part of parts151()){
  for(let j=0;j<=part.segments;j++)for(let k=0;k<4;k++){
   const v=part.vertex+j*4+k;demand(Math.abs(uv.getX(v)-j/part.segments)<1e-7&&Math.abs(uv.getY(v)-k/3)<1e-7,'known tube UV/ring cuts changed.');
  }
  let cursor=part.triangle*3;
  for(let j=1;j<=part.segments;j++)for(let k=1;k<=3;k++){
   const a=part.vertex+4*(j-1)+k-1,b=part.vertex+4*j+k-1,c=b+1,d=a+1;
   for(const value of[a,b,d,b,c,d])demand(index.getX(cursor++)===value,'known original tube index order changed.');
  }
 }
}
function bedFrame(record,part){
 const {bed,bedFrame:matrix,side}=record,p=bed.geometry.getAttribute('position'),n=bed.geometry.getAttribute('normal'),i=part.index,
  angle=part.upper?.11+((i+.13*Math.sin(i*2.399))/28)*(Math.PI-.22):Math.PI+.20+(i+.10*Math.sin(i*1.73))/10*(Math.PI-.4),t=angle/Math.PI/2*128,j=Math.floor(t),f=t-j,
  at=(row,col)=>point(matrix.a,xyz(p,row*129+((col%128+128)%128))),normal=col=>transpose(matrix.inverse,xyz(n,(col%128+128)%128)),lerp=(a,b)=>add(scale(a,1-f),scale(b,f));
 const N=unit(lerp(normal(j),normal(j+1))),raw=lerp(sub(at(0,j+1),at(0,j-1)),sub(at(0,j+2),at(0,j))),out=lerp(sub(at(1,j),at(0,j)),sub(at(1,j+1),at(0,j+1)));
 let T=unit(sub(raw,scale(N,dot(raw,N))));if(T[0]*side<0)T=scale(T,-1);
 let E=unit(cross(N,T));if(dot(E,out)<0)E=scale(E,-1);
 demand(dot(E,out)>1e-6&&Math.abs(dot(E,T))<1e-8,'cannot establish the accepted outward eyelid frame.');
 return{E,T,N};
}
function fiberData(record,part){
 const p=record.original.getAttribute('position'),centers=[],axesA=[],axesB=[];
 for(let j=0;j<=part.segments;j++){
  const a=[0,1,2].map(k=>point(record.frame.a,xyz(p,part.vertex+j*4+k))),center=scale(add(add(a[0],a[1]),a[2]),1/3);
  centers.push(center);axesA.push(sub(a[0],center));axesB.push(scale(sub(a[1],a[2]),1/Math.sqrt(3)));
  const seam=point(record.frame.a,xyz(p,part.vertex+j*4+3));demand(norm(sub(seam,a[0]))<2e-7,'source radial seam is unexpectedly split.');
 }
 return{centers,axesA,axesB,...bedFrame(record,part),upper:part.upper,side:record.side,index:part.index};
}
function sectionAudit(sweep,segments){
 let minimumJacobianLower=Infinity,minimumSourceVolume=Infinity,minimumTargetVolume=Infinity,minimumRotationDenominator=2,sections=0;
 for(let i=0;i<=segments*8;i++){
  const u=i/(segments*8),a=sweep.sample(u,0,0),b=sweep.sample(u,1,0),c=sweep.sample(u,0,1),sign=Math.sign(a.sourceDeterminant),old=a.sourceDeterminant,
   next=old*a.determinant,oldRadius=Math.hypot(b.sourceDeterminant-old,c.sourceDeterminant-old),nextRadius=Math.hypot(b.sourceDeterminant*b.determinant-next,c.sourceDeterminant*c.determinant-next),oldMin=sign*old-oldRadius,nextMin=sign*next-nextRadius;
  demand(oldMin>1e-16&&nextMin>1e-19,'a sampled full radial section became singular or reversed.');
  minimumSourceVolume=Math.min(minimumSourceVolume,oldMin);minimumTargetVolume=Math.min(minimumTargetVolume,nextMin);minimumJacobianLower=Math.min(minimumJacobianLower,nextMin/(sign*old+oldRadius));minimumRotationDenominator=Math.min(minimumRotationDenominator,1+a.rotationCosine);sections++;
 }
 return{sections,minimumJacobianLower,minimumSourceVolume,minimumTargetVolume,minimumRotationDenominator,
  interpretation:'Longitudinal sample sections; each determinant is affine in radial disk coordinates, so its reported angular/disk minimum is exact for that section. This is not a global interval proof of the volume Jacobian.'};
}

/** Apply once after147. Original geometries are retained only by explicit QA. */
export function applyEyelash151(head,{strength=0,retainSourceForQA=false}={}){
 demand(strength===0||strength===1,'supports only the approved OFF/ON comparison.');demand(typeof retainSourceForQA==='boolean','QA retention must be boolean.');
 const previous=head&&applications.get(head);if(previous){demand(previous.strength===strength,'needs restoration or a fresh head before switching.');return previous.metrics;}
 if(!strength)return ZERO;
 demand(head?.isObject3D&&head.name==='anatomical-head','requires anatomical-head.');head.updateWorldMatrix(true,true);
 const start=performance.now(),meshes=[],sourceBuffers=new Set();head.traverse(mesh=>{if(!mesh.isMesh)return;for(const[,a]of entries(mesh.geometry))sourceBuffers.add(a.array.buffer);if(mesh.name==='individual-eyelashes')meshes.push(mesh);});
 demand(meshes.length===2&&new Set(meshes.map(m=>m.parent?.name)).size===2,'requires exactly one lash mesh under each original eye.');
 const records=meshes.map(mesh=>{
  const side=mesh.parent.name==='left-eye'?-1:mesh.parent.name==='right-eye'?1:0;demand(side&&!Array.isArray(mesh.material)&&!mesh.isSkinnedMesh&&!mesh.isInstancedMesh,'unexpected lash owner or material binding.');validate(mesh.geometry);
  const bed=mesh.parent.children.find(o=>o.isMesh&&o.name==='sculpted-eyelids');demand(bed?.geometry.getAttribute('position')?.count===1677&&bed.geometry.userData.eyeContour147?.version==='eye-contour-147','accepted147 eyelid frame is missing.');
  return{mesh,side,original:mesh.geometry,frame:frame(head,mesh),bed,bedFrame:frame(head,bed)};
 });
 demand(records[0].original!==records[1].original,'unexpected shared left/right lash geometry.');
 const staged=[],metrics={version:VERSION,strength:1,applied:true,privateGeometryCount:0,privateAttributeBytes:0,fibers:0,vertices:2064,triangles:2616,exactRootVertices:0,changedPositions:0,changedNormals:0,
  maximumVertexHeadDisplacement:0,maximumContinuousDisplacementUpper:0,maximumLengthRatioUpper:0,maximumNormalLengthError:0,maximumSourceReconstructionError:0,minimumSampledSectionJacobian:Infinity,minimumTriangleAreaRatio:Infinity,minimumExpectedTriangleNormalDot:1,newDegenerateTriangles:0,reversedTriangles:0,
  retainSourceForQA,retainedSourceGeometryReferences:0,addedDraws:0,addedTextureBytes:0,perFrameWork:0,phaseMs:{bounds:0,sections:0,vertices:0,triangles:0},parts:[]};
 try{
  for(const record of records){
   const geometry=record.original.clone();demand(geometry!==record.original&&entries(geometry).every(([,a])=>!sourceBuffers.has(a.array.buffer)),'temporary geometry must wholly own every buffer.');
   staged.push({...record,geometry});geometry.userData={...record.original.userData,eyelash151:{version:VERSION,strength:1,fibers:40}};
   const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),oldP=record.original.getAttribute('position'),oldN=record.original.getAttribute('normal'),index=geometry.index;
   for(const part of parts151()){
    const data=fiberData(record,part);let phaseStarted=performance.now();const {sweep,bounds}=boundedLashSweep151(data);metrics.phaseMs.bounds+=performance.now()-phaseStarted;phaseStarted=performance.now();
    const sections=sectionAudit(sweep,part.segments);metrics.phaseMs.sections+=performance.now()-phaseStarted;phaseStarted=performance.now();const row={eye:record.mesh.parent.name,...part,...sweep.parameters,bounds,sections};
    metrics.parts.push(row);metrics.fibers++;metrics.maximumContinuousDisplacementUpper=Math.max(metrics.maximumContinuousDisplacementUpper,bounds.surfaceDisplacementUpper);metrics.maximumLengthRatioUpper=Math.max(metrics.maximumLengthRatioUpper,bounds.lengthRatioUpper);metrics.minimumSampledSectionJacobian=Math.min(metrics.minimumSampledSectionJacobian,sections.minimumJacobianLower);
    for(let j=0;j<=part.segments;j++)for(let k=0;k<4;k++){
     const vertex=part.vertex+j*4+k;if(j===0){metrics.exactRootVertices++;continue;}
     const angle=k%3/3*Math.PI*2,sample=sweep.sample(j/part.segments,Math.cos(angle),Math.sin(angle)),original=xyz(oldP,vertex),headPoint=point(record.frame.a,original),difference=norm(sub(headPoint,sample.source));
     metrics.maximumSourceReconstructionError=Math.max(metrics.maximumSourceReconstructionError,difference);demand(difference<2e-7,'ring reconstruction drifted from the accepted source.');
     const delta=linear(record.frame.inverse,sample.delta),result=add(original,delta);p.setXYZ(vertex,...result);
     const sourceNormal=xyz(oldN,vertex);demand(norm(sourceNormal)>1e-9,'an original lash normal is zero.');
     const headNormal=transpose(record.frame.inverse,sourceNormal),newNormal=unit(transpose(record.frame.a,sample.normal(headNormal)));n.setXYZ(vertex,...newNormal);
     metrics.maximumVertexHeadDisplacement=Math.max(metrics.maximumVertexHeadDisplacement,norm(linear(record.frame.a,sub(xyz(p,vertex),original))));
     metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,Math.abs(norm(xyz(n,vertex))-1));
     if(xyz(p,vertex).some((v,k)=>v!==original[k]))metrics.changedPositions++;if(xyz(n,vertex).some((v,k)=>v!==sourceNormal[k]))metrics.changedNormals++;
    }
    metrics.phaseMs.vertices+=performance.now()-phaseStarted;phaseStarted=performance.now();
    for(let tri=part.triangle;tri<part.triangle+part.triangles;tri++){
     const ids=[0,1,2].map(k=>index.getX(tri*3+k)),a=ids.map(v=>point(record.frame.a,xyz(oldP,v))),b=ids.map(v=>point(record.frame.a,xyz(p,v))),n0=cross(sub(a[1],a[0]),sub(a[2],a[0])),n1=cross(sub(b[1],b[0]),sub(b[2],b[0])),l0=norm(n0),l1=norm(n1);
     demand(l0>1e-13,'source lash triangle is degenerate.');if(l1<=1e-13){metrics.newDegenerateTriangles++;continue;}
     const u=ids.reduce((sum,v)=>sum+Math.floor((v-part.vertex)/4)/part.segments,0)/3,r=ids.reduce((sum,v)=>sum+Math.cos(((v-part.vertex)%4)%3/3*Math.PI*2),0)/3,s=ids.reduce((sum,v)=>sum+Math.sin(((v-part.vertex)%4)%3/3*Math.PI*2),0)/3,expected=sweep.sample(u,r,s).normal(n0),agreement=dot(expected,n1)/(norm(expected)*l1);
     metrics.minimumTriangleAreaRatio=Math.min(metrics.minimumTriangleAreaRatio,l1/l0);metrics.minimumExpectedTriangleNormalDot=Math.min(metrics.minimumExpectedTriangleNormalDot,agreement);if(agreement<=0)metrics.reversedTriangles++;
    }
    metrics.phaseMs.triangles+=performance.now()-phaseStarted;
   }
   demand(metrics.newDegenerateTriangles===0&&metrics.reversedTriangles===0,'introduced a finite-triangle degeneration or reversal.');
   p.needsUpdate=true;n.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();metrics.privateGeometryCount++;metrics.privateAttributeBytes+=entries(geometry).reduce((sum,[,a])=>sum+a.array.byteLength,0);
  }
  demand(metrics.fibers===80&&metrics.exactRootVertices===320&&metrics.maximumVertexHeadDisplacement<=.0160002&&metrics.maximumNormalLengthError<2e-6,'exceeded the approved output bounds.');
 }catch(error){for(const record of staged)record.geometry.dispose();throw error;}
 for(const record of staged)record.mesh.geometry=record.geometry;
 metrics.retainedSourceGeometryReferences=retainSourceForQA?staged.length:0;metrics.elapsedMs=performance.now()-start;applications.set(head,{strength,staged:retainSourceForQA?staged:null,metrics});return metrics;
}

export function releaseEyelash151(head){
 const record=head&&applications.get(head);if(!record)return{released:false,privateGeometriesDisposed:0,privateAttributeBytesReleased:0};
 demand(record.staged,'production151 retains no source copies; use a fresh head to undo it.');for(const part of record.staged)demand(part.mesh.geometry===part.geometry,'release dependent edits before151.');
 for(const part of record.staged)part.mesh.geometry=part.original;applications.delete(head);for(const part of record.staged)part.geometry.dispose();
 return{released:true,privateGeometriesDisposed:record.staged.length,privateAttributeBytesReleased:record.metrics.privateAttributeBytes};
}
