import {Matrix4} from 'three';

// Isolated154: one coarse roll in the original left front cotton. Apply after
// the accepted117 bake and before99. No material, UV, population or X/Y edit.
export const BLOUSE154_SPEC=Object.freeze({
 version:'blouse-drape-154',mesh:'blouse-continuous-torso-and-sleeves',
 nu:192,nv:112,vertices:21809,triangles:43008,
 d:Object.freeze([.18,.36,.56,.76]),y:Object.freeze([-.96,-.84,.22,.34]),
 radius:Object.freeze([.20,.27]),center:Object.freeze([-.209,-.44,.18]),
 crest:.006,trough:.028,crestWidth:Object.freeze([.105,.020]),
 troughWidth:Object.freeze([.060,.020]),troughOffset:Object.freeze([.105,.020]),
 description:'One bounded asymmetric roll along the existing middle-left button fold; all loose-panel X/Y and every other object remain unchanged.'
});
const applications=new WeakMap(),VERSION=BLOUSE154_SPEC.version;
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,changedVertices:0,changedNormals:0,privateGeometries:0,privateAttributeBytes:0,elapsedMs:0});
const demand=(condition,message)=>{if(!condition)throw Error('154 '+message);};
const clamp=v=>Math.max(0,Math.min(1,v));
const now=()=>typeof performance==='object'?performance.now():Date.now();

// Value and derivative pairs. Retain the source's cubic width/placket curves,
// rather than silently replacing their jets with the new fold's quintic gate.
function cubic(a,b,x){const t=clamp((x-a)/(b-a));return[t*t*(3-2*t),t>0&&t<1?6*t*(1-t)/(b-a):0];}
function quintic(a,b,x){const t=clamp((x-a)/(b-a));return[t*t*t*(t*(t*6-15)+10),t>0&&t<1?30*t*t*(1-t)*(1-t)/(b-a):0];}
function widen(x){
 const a=Math.abs(x),s=cubic(.20,.95,a),scale=1+.13*s[0],j=scale+.13*a*s[1],q=x*scale;
 const aq=Math.abs(q),o=cubic(.84,1.60,aq),outer=1+.12*o[0],jo=outer+.12*aq*o[1];
 return[q*outer,j*jo];
}

/** Exact C(Y), C'(Y): original placket followed by both accepted width maps. */
export function blousePlacket154(y,out){
 const raw=(.780-y)/2.230,v=clamp(raw),dv=raw>0&&raw<1?-1/2.230:0,s=cubic(0,.19,v);
 const x=-.022+.027*Math.sin(v*Math.PI)+.190*v*v+.084*s[0];
 const dx=(.027*Math.PI*Math.cos(v*Math.PI)+.380*v+.084*s[1])*dv,w=widen(x);
 out[0]=w[0];out[1]=w[1]*dx;return out;
}

/**
 * H,Hx,Hy and diagnostic d/r. Full C(Y)->d->Yc(d)->r chain included.
 * Z is absent, so the continuous spatial shear has determinant exactly1.
 * The compact support is C2; its active Y range avoids source clamp joints.
 */
export function blouseDrapeJet154(x,y,out){
 out.fill(0);const S=BLOUSE154_SPEC;
 if(y<=S.y[0]||y>=S.y[3])return out;
 const cp=[0,0];blousePlacket154(y,cp);const d=cp[0]-x;
 if(d<=S.d[0]||d>=S.d[3])return out;
 const yc=S.center[0]+S.center[1]*d+S.center[2]*d*d,ycd=S.center[1]+2*S.center[2]*d,r=y-yc;
 if(Math.abs(r)>=S.radius[1])return out;
 const a=quintic(S.d[0],S.d[1],d),b=quintic(S.d[2],S.d[3],d),yl=quintic(S.y[0],S.y[1],y),yh=quintic(S.y[2],S.y[3],y),rr=quintic(S.radius[0],S.radius[1],Math.abs(r)),w=quintic(S.d[0],S.d[3],d);
 const gd=a[0]*(1-b[0]),gdd=a[1]*(1-b[0])-a[0]*b[1],gy=yl[0]*(1-yh[0]),gyy=yl[1]*(1-yh[0])-yl[0]*yh[1],gr=1-rr[0],grr=-Math.sign(r)*rr[1];
 const wc=S.crestWidth[0]+S.crestWidth[1]*w[0],wcd=S.crestWidth[1]*w[1],wt=S.troughWidth[0]+S.troughWidth[1]*w[0],wtd=S.troughWidth[1]*w[1],off=S.troughOffset[0]+S.troughOffset[1]*w[0],offd=S.troughOffset[1]*w[1];
 const qc=r/wc,qt=(r+off)/wt,ec=Math.exp(-qc*qc),et=Math.exp(-qt*qt),f=S.crest*ec-S.trough*et;
 const fr=-2*S.crest*r/(wc*wc)*ec+2*S.trough*(r+off)/(wt*wt)*et;
 const fd=2*S.crest*qc*qc*wcd/wc*ec+2*S.trough*qt*(offd-qt*wtd)/wt*et;
 const hd=gy*gr*(gdd*f+gd*fd),hr=gd*gy*(grr*f+gr*fr),hy=gd*gr*gyy*f;
 out[0]=gd*gy*gr*f;
 out[1]=-hd+ycd*hr;
 out[2]=hy+cp[1]*hd+(1-ycd*cp[1])*hr;
 out[3]=d;out[4]=r;out[5]=1;return out;
}

const attributes=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const arrayBytes=g=>attributes(g).reduce((sum,[,a])=>sum+a.array.byteLength,0);

export function applyBlouseDrape154(blouse,{strength=0,retainSourceForQA=false}={}){
 demand(strength===0||strength===1,'choose explicit OFF/ON on a fresh blouse.');
 const old=applications.get(blouse);
 if(old){demand(old.strength===strength&&old.retainSourceForQA===retainSourceForQA,'application options changed; use a fresh blouse.');return old.metrics;}
 if(strength===0)return ZERO;
 const started=now();demand(blouse?.isObject3D,'requires the existing blouse group.');
 const matches=[];blouse.traverse(o=>{if(o.isMesh&&o.name===BLOUSE154_SPEC.mesh)matches.push(o);});
 demand(matches.length===1,'requires one original continuous torso owner.');
 const mesh=matches[0];demand(!mesh.isInstancedMesh&&!mesh.isSkinnedMesh,'requires the existing static torso.');
 blouse.updateWorldMatrix(true,true);
 const inverse=new Matrix4().copy(blouse.matrixWorld).invert(),frame=new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),m=frame.elements;
 let frameResidual=0;
 for(let i=0;i<16;i++){demand(Number.isFinite(m[i]),'nonfinite mesh-to-blouse frame.');frameResidual=Math.max(frameResidual,Math.abs(m[i]-(i%5===0?1:0)));}
 demand(frameResidual<1e-12,'torso mesh-to-blouse frame is not the accepted identity.');
 const original=mesh.geometry,p=original.getAttribute('position'),n=original.getAttribute('normal'),uv=original.getAttribute('uv'),index=original.index;
 demand(p?.itemSize===3&&n?.itemSize===3&&uv?.itemSize===2&&p.count===21809&&n.count===p.count&&uv.count===p.count&&index?.count===129024,'original torso grid changed.');
 demand(Math.abs(p.getX(0))<1e-7&&Math.abs(p.getY(0)-.780)<1e-6&&Math.abs(p.getZ(0)-.5567750334739685)<1e-6,'apply after117 and before99 on the original blouse coordinates.');
 demand(!Object.keys(original.morphAttributes||{}).length,'unexpected torso morph attributes.');
 const sourceArrays=new Set(),sourceAttributes=new Set();
 for(const[key,a]of attributes(original)){
  demand(!a.isInterleavedBufferAttribute&&a.array&&ArrayBuffer.isView(a.array),'unsupported source attribute '+key);
  sourceArrays.add(a.array.buffer);sourceAttributes.add(a);
  for(let k=0;k<a.array.length;k++)demand(Number.isFinite(a.array[k]),'nonfinite source '+key);
 }
 for(let j=0;j<=112;j++)for(let i=0;i<=192;i++){
  const k=j*193+i;demand(Math.abs(uv.getX(k)-i/192)<1e-6&&Math.abs(uv.getY(k)-j/112)<1e-6,'original torso UV order changed.');
 }
 let replacement;
 try{
  replacement=original.clone();
  demand(Object.keys(replacement.attributes).join('|')===Object.keys(original.attributes).join('|'),'clone changed attribute inventory.');
  for(const[key,a]of attributes(replacement)){
   const src=key==='index'?original.index:original.getAttribute(key);
   demand(!sourceArrays.has(a.array.buffer)&&!sourceAttributes.has(a),'replacement shares a disposable source GPU binding: '+key);
   demand(a.itemSize===src.itemSize&&a.count===src.count&&a.normalized===src.normalized&&a.array.constructor===src.array.constructor,'clone changed attribute layout: '+key);
  }
  const q=replacement.getAttribute('position'),nn=replacement.getAttribute('normal'),jet=new Float64Array(6);
  let changedVertices=0,changedNormals=0,ownedVertices=0,maxOut=0,maxIn=0,maxGradient=0,minNormalCosine=1,maxNormalLengthError=0,zeroNormals=0;
  for(let i=0;i<p.count;i++){
   const u=uv.getX(i),x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   if(!(u>.75&&u<1&&z>0))continue;
   blouseDrapeJet154(x,y,jet);if(!jet[5])continue;ownedVertices++;
   const[h,hx,hy]=jet;demand(Number.isFinite(h+hx+hy)&&h<=.0400000001&&h>=-.0280000001,'fold field exceeded its approved finite bounds.');
   if(h!==0){q.setZ(i,z+h);if(!Object.is(q.getZ(i),z))changedVertices++;}
   if(hx!==0||hy!==0){
    const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),oldLength=Math.hypot(nx,ny,nz);
    if(oldLength===0){zeroNormals++;continue;}
    const ax=nx-hx*nz,ay=ny-hy*nz,az=nz,len=Math.hypot(ax,ay,az);demand(Number.isFinite(len)&&len>1e-12,'invalid transported normal.');
    nn.setXYZ(i,ax/len,ay/len,az/len);
    if(!Object.is(nn.getX(i),nx)||!Object.is(nn.getY(i),ny)||!Object.is(nn.getZ(i),nz))changedNormals++;
    maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(Math.hypot(nn.getX(i),nn.getY(i),nn.getZ(i))-1));
    minNormalCosine=Math.min(minNormalCosine,(nx*ax+ny*ay+nz*az)/(oldLength*len));
   }
   maxOut=Math.max(maxOut,h);maxIn=Math.min(maxIn,h);maxGradient=Math.max(maxGradient,Math.hypot(hx,hy));
  }
  demand(ownedVertices===254&&changedVertices>150,'approved compact source ownership changed.');
  if(changedVertices)q.needsUpdate=true;if(changedNormals)nn.needsUpdate=true;
  replacement.computeBoundingBox();replacement.computeBoundingSphere();
  replacement.userData={...replacement.userData,blouseDrape154:{version:VERSION,strength}};
  const metrics=Object.freeze({version:VERSION,strength,applied:true,sourceVertices:p.count,sourceTriangles:index.count/3,ownedVertices,changedVertices,changedNormals,maxOutwardDisplacement:maxOut,maxInwardDisplacement:maxIn,maxGradient,minNormalCosine,maxNormalLengthError,zeroNormalsPreserved:zeroNormals,continuousJacobian:1,meshToBlouseIdentityResidual:frameResidual,privateGeometries:1,privateAttributeBytes:arrayBytes(replacement),sourceGeometryBytes:arrayBytes(original),privateAttributes:Object.freeze(attributes(replacement).map(([key,a])=>Object.freeze({key,type:a.array.constructor.name,count:a.count,itemSize:a.itemSize,bytes:a.array.byteLength}))),extraVertices:0,extraTriangles:0,extraTextures:0,extraDraws:0,retainsSourceForQA:retainSourceForQA,elapsedMs:now()-started});
  mesh.geometry=replacement;applications.set(blouse,{strength,retainSourceForQA,mesh,replacement,original:retainSourceForQA?original:null,metrics});return metrics;
 }catch(error){replacement?.dispose();throw error;}
}

// QA restores the retained original after carrying that detached geometry
// through the accepted99 transform once. Production does not retain a source
// geometry or call this release path. Never dispose a shared material or map.
export function releaseBlouseDrape154(blouse){
 const record=applications.get(blouse);if(!record)return{released:false,privateGeometriesDisposed:0};
 demand(record.retainSourceForQA&&record.original,'no retained QA source is available for restoration.');
 demand(record.mesh.geometry===record.replacement,'private torso binding changed before release.');
 record.mesh.geometry=record.original;record.replacement.dispose();applications.delete(blouse);
 return{released:true,privateGeometriesDisposed:1,sourceGeometryRestored:true};
}
