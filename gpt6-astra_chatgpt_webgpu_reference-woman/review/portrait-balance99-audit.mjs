import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Source/API audit. Native Three/WebGPU art is evaluated separately by root.
const oldHarness=fs.readFileSync('review/hair-contact86-audit.mjs','utf8').split('const baseline=construct(')[0].replace(/^import[^\n]*\n/gm,'');
const h=new Function('fs','assert',oldHarness+'\nreturn {THREE,V,Attr,Geometry,Group,Mesh,read};')(fs,assert);
const {THREE,V,Attr,Geometry,Group,Mesh,read}=h;
V.prototype.crossVectors=function(a,b){return this.set(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);};
Attr.prototype.setX=function(i,x){this.array[i*this.itemSize]=x;return this;};
Attr.prototype.setY=function(i,x){this.array[i*this.itemSize+1]=x;return this;};
Attr.prototype.clone=function(){return new Attr(this.array.slice(),this.itemSize);};
const oldSetIndex=Geometry.prototype.setIndex;
Geometry.prototype.setIndex=function(i){if(i===null||i instanceof Attr){this.index=i;return this;}return oldSetIndex.call(this,i);};
Geometry.prototype.clone=function(){const g=new Geometry();for(const[k,a]of Object.entries(this.attributes))g.setAttribute(k,a.clone());g.index=this.index?.clone();return g;};
Geometry.prototype.dispose=function(){};
THREE.BufferAttribute=Attr;

let matrixAllocations=0;
class Matrix4{
 constructor(elements){matrixAllocations++;this.elements=elements?Array.from(elements):[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
 clone(){return new Matrix4(this.elements);}
 multiplyMatrices(a,b){const aa=a.elements,bb=b.elements,out=new Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let v=0;for(let k=0;k<4;k++)v+=aa[k*4+r]*bb[c*4+k];out[c*4+r]=v;}this.elements=out;return this;}
 determinant(){const a=Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>this.elements[c*4+r]));let det=1;for(let c=0;c<4;c++){let best=c;for(let r=c+1;r<4;r++)if(Math.abs(a[r][c])>Math.abs(a[best][c]))best=r;if(a[best][c]===0)return 0;if(best!==c){[a[best],a[c]]=[a[c],a[best]];det=-det;}const v=a[c][c];det*=v;for(let r=c+1;r<4;r++){const q=a[r][c]/v;for(let k=c+1;k<4;k++)a[r][k]-=q*a[c][k];}}return det;}
 invert(){const a=Array.from({length:4},(_,r)=>[...Array.from({length:4},(_,c)=>this.elements[c*4+r]),...Array.from({length:4},(_,c)=>r===c?1:0)]);for(let c=0;c<4;c++){let best=c;for(let r=c+1;r<4;r++)if(Math.abs(a[r][c])>Math.abs(a[best][c]))best=r;assert(Math.abs(a[best][c])>1e-15);[a[best],a[c]]=[a[c],a[best]];const v=a[c][c];for(let k=0;k<8;k++)a[c][k]/=v;for(let r=0;r<4;r++)if(r!==c){const q=a[r][c];for(let k=0;k<8;k++)a[r][k]-=q*a[c][k];}}this.elements=Array.from({length:16},(_,i)=>a[i%4][4+Math.floor(i/4)]);return this;}
}
const I=()=>new Matrix4(),mul=(a,b)=>new Matrix4().multiplyMatrices(a,b),T=(x,y,z)=>new Matrix4([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]);
const RY=t=>new Matrix4([Math.cos(t),0,-Math.sin(t),0,0,1,0,0,Math.sin(t),0,Math.cos(t),0,0,0,0,1]);
const RZ=t=>new Matrix4([Math.cos(t),Math.sin(t),0,0,-Math.sin(t),Math.cos(t),0,0,0,0,1,0,0,0,0,1]);
const point=(m,p)=>{const a=m.elements;return[a[0]*p[0]+a[4]*p[1]+a[8]*p[2]+a[12],a[1]*p[0]+a[5]*p[1]+a[9]*p[2]+a[13],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]+a[14]];};
function object(name,matrixWorld=I()){return{name,isObject3D:true,children:[],matrixWorld,add(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}},traverse(fn){const visit=n=>{fn(n);for(const c of n.children||[])visit(c);};visit(this);},updateWorldMatrix(){}};}
function attach(parent,name,geometry,matrixWorld,material={name:'audit-material',map:{source:'original'}}){const m=new Mesh(geometry,material);m.name=name;m.matrixWorld=matrixWorld;parent.add(m);return m;}
const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const source=read('review/portrait-balance-candidate99.js');
const {applyPortraitBalance,fieldAt}=new Function('Matrix4',source+'\nreturn {applyPortraitBalance,fieldAt};')(Matrix4);
const f=new Float64Array(3),weight=(x,y)=>{fieldAt(x,y,f);return f[0];};
const warp=(p,s)=>[p[0]+s*weight(p[0],p[1]),p[1],p[2]];
const maxAbs=a=>Math.max(...a.map(Math.abs));

// Zero exits before traversal or matrices; repeated nonzero is byte-idempotent.
const zeroModel={isObject3D:true,traverse(){throw new Error('zero traversed');},updateWorldMatrix(){throw new Error('zero updated matrices');}};
const allocated=matrixAllocations,z0=applyPortraitBalance(zeroModel),z1=applyPortraitBalance(zeroModel,{shiftX:0});
assert.equal(matrixAllocations,allocated);assert.equal(z0,z1);

const samples=[[-2.0,.2,.5],[-1.7,.6,.8],[-1.325,1,.4],[-1.2,1.6,.4],[-.7,1.5,.6],[0,3,.2],[.9,.8,.3],[1.3,1.7,.3],[1.7,.7,.7],[2.0,.5,.6],[1.8,2.1,.4]];
function geometry(points=samples){const g=new Geometry().setAttribute('position',new Attr(points.flat(),3)).setAttribute('normal',new Attr(points.flatMap((_,i)=>{const a=[.3+.07*i,.5-.04*i,.8],l=Math.hypot(...a);return a.map(v=>v/l);}),3));g.setAttribute('uv',new Attr(points.flatMap((_,i)=>[i/points.length,.37]),2));g.setAttribute('color',new Attr(points.flatMap(()=>[.3,.4,.5]),3));g.setIndex([0,1,2,2,3,4,4,5,6]);return g;}
const transforms=[I(),mul(T(.1,-.2,.3),mul(RY(.34),RZ(-.2))),new Matrix4([1.4,.1,0,0,.18,.7,.05,0,.08,-.12,1.7,0,.2,.1,-.1,1]),new Matrix4([-1.2,.17,.06,0,.11,1.4,.2,0,.0,.13,.65,0,-.4,.2,.1,1])];
let maxPositionConjugacy=0,maxNormalAngle=0,topologyAttributesPreserved=true,sharedCloneCount=0;
for(const shiftX of[-.12,-.24]){
 const outer=mul(T(.31,-.27,.2),mul(RZ(.22),new Matrix4([1.3,0,0,0,0,.8,0,0,0,0,1.1,0,0,0,0,1]))),model=object('model',outer),before=[];
 const shared=geometry();
 for(let k=0;k<transforms.length;k++){
  const mat=transforms[k],g=k<2?shared:geometry(),mesh=attach(model,'synthetic-'+k,g,mul(outer,mat));
  before.push({mesh,mat,positions:g.getAttribute('position').array.slice(),normals:g.getAttribute('normal').array.slice(),uv:g.getAttribute('uv'),color:g.getAttribute('color'),index:g.index,material:mesh.material,uvHash:hash(g.getAttribute('uv').array),colorHash:hash(g.getAttribute('color').array),indexHash:hash(g.index.array)});
 }
 const metrics=applyPortraitBalance(model,{shiftX});sharedCloneCount+=metrics.clonedSharedGeometries;
 assert.notEqual(before[0].mesh.geometry,before[1].mesh.geometry);
 for(const old of before){
  const g=old.mesh.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal'),inverse=old.mat.clone().invert(),e=2e-5;
  assert.equal(g.getAttribute('uv'),old.uv);assert.equal(g.getAttribute('color'),old.color);assert.equal(g.index,old.index);assert.equal(old.mesh.material,old.material);
  assert.equal(hash(old.uv.array),old.uvHash);assert.equal(hash(old.color.array),old.colorHash);assert.equal(hash(old.index.array),old.indexHash);
  for(let i=0;i<p.count;i++){
   const original=Array.from(old.positions.subarray(i*3,i*3+3)),normal=Array.from(old.normals.subarray(i*3,i*3+3)),actual=point(old.mat,[p.getX(i),p.getY(i),p.getZ(i)]),expect=warp(point(old.mat,original),shiftX);
   maxPositionConjugacy=Math.max(maxPositionConjugacy,maxAbs(actual.map((v,k)=>v-expect[k])));
   const jac=Array.from({length:3},(_,axis)=>{const a=original.slice(),b=original.slice();a[axis]+=e;b[axis]-=e;const pa=point(inverse,warp(point(old.mat,a),shiftX)),pb=point(inverse,warp(point(old.mat,b),shiftX));return pa.map((v,k)=>(v-pb[k])/(2*e));});
   const J=new Matrix4([jac[0][0],jac[0][1],jac[0][2],0,jac[1][0],jac[1][1],jac[1][2],0,jac[2][0],jac[2][1],jac[2][2],0,0,0,0,1]).invert().elements;
   const nn=[J[0]*normal[0]+J[1]*normal[1]+J[2]*normal[2],J[4]*normal[0]+J[5]*normal[1]+J[6]*normal[2],J[8]*normal[0]+J[9]*normal[1]+J[10]*normal[2]],l=Math.hypot(...nn),a=[n.getX(i),n.getY(i),n.getZ(i)],al=Math.hypot(...a);
   const cos=nn.reduce((sum,v,k)=>sum+v*a[k],0)/(l*al);maxNormalAngle=Math.max(maxNormalAngle,Math.acos(Math.min(1,Math.max(-1,cos)))*180/Math.PI);
  }
 }
 const snapshots=before.map(o=>[hash(o.mesh.geometry.getAttribute('position').array),hash(o.mesh.geometry.getAttribute('normal').array)]);
 assert.equal(applyPortraitBalance(model,{shiftX}),metrics);
 assert.throws(()=>applyPortraitBalance(model,{shiftX:shiftX*.5}),/freshly built model/);
 before.forEach((o,i)=>assert.deepEqual([hash(o.mesh.geometry.getAttribute('position').array),hash(o.mesh.geometry.getAttribute('normal').array)],snapshots[i]));
}
assert(maxPositionConjugacy<4e-7);assert(maxNormalAngle<.00002);

// Use original source surfaces for garment and rigid-assembly envelopes.
const blouseText=read('review/blouse-candidate98.js');
const getCloth=width=>new Function('THREE',blouseText.replace('const OUTER_WIDTH98=0;',`const OUTER_WIDTH98=${width};`)+'\nreturn {surface,clothGeometry,solidifyGrid,collarPoint,facingPoint,broadenShoulders,neckPoint,placketX,bodyAtXY};')(THREE);
const face=new Function('THREE',read('src/face.js')+'\nreturn {profile,faceZ,portraitY,refineEarBed};')(THREE);
const fit=new Function('Matrix4',read('src/portrait-proportions.js')+'\nreturn {lowerFaceWarp,neckBlend};')(Matrix4);
const pose=new Function('Matrix4',read('src/portrait-pose.js')+'\nreturn blendAt;')(Matrix4);
const H0=mul(T(0,2.95,0),mul(RY(.16),RZ(-.17))),H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17))),B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0)));
const sourceResults=[];
for(const width of[0,.12,.20]){
 const c=getCloth(width),garment=new Group(),mat={name:'source-audit-material'},parts=[];
 const add=(name,g)=>{const m=new Mesh(g,mat);m.name=name;garment.add(m);parts.push(m);};
 add('blouse-continuous-torso-and-sleeves',c.clothGeometry());
 for(const side of[-1,1]){
  const g=c.surface(24,48,(u,v)=>c.collarPoint(side,u,v));
  if(side<0){for(let i=0;i<g.index.count;i+=3){const b=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,b);}g.computeVertexNormals();}
  add(`blouse-${side}-spread-collar`,c.solidifyGrid(g,24,48,.0045));
  add(`blouse-${side}-neck-opening-facing`,c.surface(8,48,(u,v)=>c.facingPoint(side,u,v)));
 }
 add('blouse-curved-centre-placket',c.solidifyGrid(c.surface(10,74,(u,v)=>{const y=.780+(-1.45-.780)*v,x=c.placketX(y)+(u-.5)*(.174+.014*v),p=c.bodyAtXY(x,y);return[x,y,p[2]+.007+.006*Math.sin(u*Math.PI)**.70];}),10,74,.0045));
 // Buttons and stitches remain well inside a conservative centre envelope.
 add('buttons-batched-audit-envelope',geometry([[-.3,-1.47,0],[.5,-1.47,.9],[-.3,1.7,0],[.5,1.7,.9]]));
 c.broadenShoulders(garment);
 const neck=c.surface(80,44,(u,v)=>c.neckPoint(u*Math.PI*2,.69+v*(2.08-.69))),np=neck.getAttribute('position'),toHead=mul(H0.clone().invert(),B),backB=B.clone().invert();
 for(let i=0;i<np.count;i++){
  const local=[np.getX(i),np.getY(i),np.getZ(i)],hy=point(toHead,local)[1],amount=fit.lowerFaceWarp(hy).displacement*fit.neckBlend(local[1]).weight;
  const mH=H0.elements,mB=backB.elements,worldDY=[mH[4]*amount,mH[5]*amount,mH[6]*amount],d=[mB[0]*worldDY[0]+mB[4]*worldDY[1]+mB[8]*worldDY[2],mB[1]*worldDY[0]+mB[5]*worldDY[1]+mB[9]*worldDY[2],mB[2]*worldDY[0]+mB[6]*worldDY[1]+mB[10]*worldDY[2]];
  local.forEach((_,k)=>local[k]+=d[k]);const posed=.26*pose(local[1]).weight;local[0]+=mB[0]*posed;local[1]+=mB[1]*posed;local[2]+=mB[2]*posed;np.setXYZ(i,...local);
 }
 neck.computeVertexNormals();
 const head=c.surface(380,290,(u,v)=>{const y=-1.18+v*2.72,a=-Math.PI+u*Math.PI*2,[w,front,rear]=face.profile(y),x=w*Math.sin(a),z=Math.cos(a)>=0?face.faceZ(x,y):rear*Math.cos(a);return[x,face.portraitY(y),z];});
 face.refineEarBed(head);const hp=head.getAttribute('position');for(let i=0;i<hp.count;i++)hp.setY(i,hp.getY(i)+fit.lowerFaceWarp(hp.getY(i)).displacement);head.computeVertexNormals();
 const accessory=geometry([[-.99,-.55,-.25],[.99,-.55,.95],[-.99,.65,-.25],[.99,.65,.95]].flatMap(p=>[p,[p[0],p[1],p[2]===.95?-.25:.95]]));
 for(const shiftX of[-.12,-.24]){
  const model=object('full-source-surfaces'),headRoot=object('anatomical-head'),neckRoot=object('original-neck-and-clavicle-transition');model.add(headRoot,neckRoot);
  attach(headRoot,'continuous-face',head.clone(),H);attach(headRoot,'facial-accessory-conservative-envelope',accessory.clone(),H);attach(neckRoot,'neck-smooth-anatomical-surface',neck.clone(),B);
  for(const m of parts)attach(model,m.name,m.geometry.clone(),B,m.material);
  const originals=[];model.traverse(m=>{if(m.isMesh)originals.push({m,positions:m.geometry.getAttribute('position').array.slice(),normals:m.geometry.getAttribute('normal').array.slice(),others:Object.fromEntries(Object.entries(m.geometry.attributes).filter(([k])=>!['position','normal'].includes(k)).map(([k,a])=>[k,{attribute:a,hash:hash(a.array)}])),index:m.geometry.index,indexHash:hash(m.geometry.index.array),material:m.material});});
  const metrics=applyPortraitBalance(model,{shiftX});let maximumYZChange=0,maximumXMapError=0,rigidNormalByteChanges=0,outerPositionByteChanges=0;
  for(const old of originals){
   const p=old.m.geometry.getAttribute('position'),n=old.m.geometry.getAttribute('normal');assert.equal(old.m.material,old.material);assert.equal(old.m.geometry.index,old.index);assert.equal(hash(old.index.array),old.indexHash);
   for(const[k,o]of Object.entries(old.others)){assert.equal(old.m.geometry.getAttribute(k),o.attribute);assert.equal(hash(o.attribute.array),o.hash);}
   for(let i=0;i<p.count;i++){
    const pp=Array.from(old.positions.subarray(i*3,i*3+3)),q=point(old.m.matrixWorld,pp),a=point(old.m.matrixWorld,[p.getX(i),p.getY(i),p.getZ(i)]),w=weight(q[0],q[1]);maximumYZChange=Math.max(maximumYZChange,Math.abs(a[1]-q[1]),Math.abs(a[2]-q[2]));maximumXMapError=Math.max(maximumXMapError,Math.abs(a[0]-q[0]-shiftX*w));
    if(w===1)for(let k=0;k<3;k++)if(n.array[i*3+k]!==old.normals[i*3+k])rigidNormalByteChanges++;
    if(w===0)for(let k=0;k<3;k++)if(p.array[i*3+k]!==old.positions[i*3+k])outerPositionByteChanges++;
   }
  }
  assert(maximumYZChange<2e-7);assert(maximumXMapError<2e-7);assert.equal(rigidNormalByteChanges,0);assert.equal(outerPositionByteChanges,0);
  sourceResults.push({width98:width,shiftX,metrics,maximumYZChange,maximumXMapError,rigidNormalByteChanges,outerPositionByteChanges});
 }
 global.gc?.();
}
// Rigid-region errors are caught before a single vertex is modified.
const invalid=object('model'),badHead=object('anatomical-head'),badGeometry=geometry([[1.4,1.3,0],[1.4,1.4,.1],[1.3,1.5,.2]]);invalid.add(badHead);attach(badHead,'head-out-of-envelope',badGeometry,I());const badHash=hash(badGeometry.getAttribute('position').array);assert.throws(()=>applyPortraitBalance(invalid,{shiftX:-.12}),/uniform portrait balance region/);assert.equal(hash(badGeometry.getAttribute('position').array),badHash);
const result={native:false,sourceHarness:true,zeroNoMatrixOrTraversal:true,sameShiftByteIdempotent:true,differentShiftRejectedBeforeMutation:true,rigidPreflightAtomic:true,topologyAttributesAndMaterialPreserved:topologyAttributesPreserved,sharedInstanceClones:sharedCloneCount,matrixCases:transforms.length,maximumPositionConjugacyError:maxPositionConjugacy,maximumFiniteDifferenceNormalAngleDegrees:maxNormalAngle,analyticMinimumJacobian:{zero:1,minus012:1-.12*1.875/.85,minus024:1-.24*1.875/.85},sourceSurfaceAudit:sourceResults,scope:'Exact81/98 main torso, collar/facing/placket surfaces; neck source surface with50/52 positions; primary head source geometry and conservative accessory envelope. Accessory envelope is not a reconstruction of all accessory topology. Native preflight checks every actual head/neck/collar/placket mesh before mutation. Hair/contact triangle approximation is independently audited in portrait-balance99-contact-audit.json.',memoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,+(v/1048576).toFixed(1)]))};
fs.writeFileSync('review/portrait-balance99-source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:'passed',maximumPositionConjugacyError:maxPositionConjugacy,maximumFiniteDifferenceNormalAngleDegrees:maxNormalAngle,analyticMinimumJacobian:result.analyticMinimumJacobian,sourceCases:sourceResults.map(r=>({width:r.width98,shift:r.shiftX,minimumJacobian:r.metrics.minimumJacobian,maximumYZChange:r.maximumYZChange,maximumXMapError:r.maximumXMapError,rigidComponents:r.metrics.rigidComponents,elapsedMs:r.metrics.elapsedMs})),memoryMiB:result.memoryMiB}));
