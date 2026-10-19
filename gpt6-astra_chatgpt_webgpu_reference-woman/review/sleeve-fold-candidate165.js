import {Matrix4} from 'three';

// One bounded coarse fold in the existing near sleeve. Apply after117/154/158
// and before99. Keep154's live geometry identity: stage p/n values privately,
// then commit to the same two unique attribute bindings. No disposal occurs.
export const SLEEVE165_SPEC=Object.freeze({
 version:'near-sleeve-compression-165',
 meshes:Object.freeze(['blouse-continuous-torso-and-sleeves','blouse-sleeve-attachment--1']),
 direction:Object.freeze([-.55,0,Math.sqrt(1-.55*.55)]),
 outerX:Object.freeze([1.20,1.65,2.14,2.30]),
 y:Object.freeze([-.12,.04,1.10,1.30]),
 z:Object.freeze([-.32,-.04]),
 center:Object.freeze([.778,-.70,.12,1.80]),
 radius:Object.freeze([.34,.44]),
 trough:.045,troughWidth:.140,crest:.014,crestWidth:.180,crestOffset:.20,
 description:'One curved diagonal left-sleeve compression crease and restrained broad return; existing topology, seam, UV, colors, materials and154 binding remain intact.'
});
const VERSION=SLEEVE165_SPEC.version,applications=new WeakMap();
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,changedVertices:0,changedNormals:0,stagedAttributeBytes:0,retainedSourceGeometryReferences:0,extraVertices:0,extraTriangles:0,extraDraws:0,extraTextures:0,elapsedMs:0});
const demand=(condition,message)=>{if(!condition)throw Error('165 '+message);};
const now=()=>typeof performance==='object'?performance.now():Date.now();
function gate(a,b,x){const q=(x-a)/(b-a),t=Math.max(0,Math.min(1,q));return[t*t*t*(10+t*(-15+6*t)),q>0&&q<1?30*t*t*(1-t)*(1-t)/(b-a):0];}

/** H,Hx,Hy,Hz,owned,r,det. Coordinates are the actual widened blouse frame. */
export function sleeveFoldJet165(x,y,z,out){
 out.fill(0);out[6]=1;const S=SLEEVE165_SPEC,D=-x;
 if(D<=S.outerX[0]||D>=S.outerX[3]||y<=S.y[0]||y>=S.y[3]||z<=S.z[0])return out;
 const d=D-S.center[3],yc=S.center[0]+S.center[1]*d+S.center[2]*d*d,ycD=S.center[1]+2*S.center[2]*d,r=y-yc;
 if(Math.abs(r)>=S.radius[1])return out;
 const al=gate(S.outerX[0],S.outerX[1],D),ah=gate(S.outerX[2],S.outerX[3],D),yl=gate(S.y[0],S.y[1],y),yh=gate(S.y[2],S.y[3],y),zg=gate(S.z[0],S.z[1],z),rr=gate(S.radius[0],S.radius[1],Math.abs(r)),
  a=al[0]*(1-ah[0]),aD=al[1]*(1-ah[0])-al[0]*ah[1],b=yl[0]*(1-yh[0]),by=yl[1]*(1-yh[0])-yl[0]*yh[1],c=zg[0],cz=zg[1],g=1-rr[0],gr=-Math.sign(r)*rr[1],
  qc=(r+S.crestOffset)/S.crestWidth,qt=r/S.troughWidth,ec=Math.exp(-qc*qc),et=Math.exp(-qt*qt),
  f=S.crest*ec-S.trough*et,fr=-2*S.crest*(r+S.crestOffset)/(S.crestWidth*S.crestWidth)*ec+2*S.trough*r/(S.troughWidth*S.troughWidth)*et,
  hD=aD*b*c*g*f,hr=a*b*c*(gr*f+g*fr),hy=a*by*c*g*f,hz=a*b*cz*g*f;
 out[0]=a*b*c*g*f;
 out[1]=-hD+ycD*hr;
 out[2]=hy+hr;
 out[3]=hz;
 out[4]=1;out[5]=r;
 out[6]=1+S.direction[0]*out[1]+S.direction[2]*out[3];
 return out;
}

/**
 * Transport the existing seam through its actual emitted supporting cloth.
 * The torso remains the analytic C2 field sampled on its original triangles.
 * A seam point uses the affine X/Z displacement of its source XY triangle,
 * extended along Z. This retains the actual source stand-off without an
 * arbitrary lift. The two scalar gradients use the rounded emitted vertex
 * displacements, so their triangular Jacobian is exact for that affine chart.
 * Returned scratch rows are temporary and never enter the production cache.
 */
export function createSleeveSeamField165(torso,seam){
 const p=torso.getAttribute('position'),index=torso.index.array,sp=seam.getAttribute('position'),jet=new Float64Array(7),delta=new Float64Array(p.count*2),rows=[];
 const low=[Infinity,Infinity],high=[-Infinity,-Infinity];
 for(let i=0;i<sp.count;i++){low[0]=Math.min(low[0],sp.getX(i));low[1]=Math.min(low[1],sp.getY(i));high[0]=Math.max(high[0],sp.getX(i));high[1]=Math.max(high[1],sp.getY(i));}
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);sleeveFoldJet165(x,y,z,jet);
  delta[i*2]=Math.fround(x+SLEEVE165_SPEC.direction[0]*jet[0])-x;
  delta[i*2+1]=Math.fround(z+SLEEVE165_SPEC.direction[2]*jet[0])-z;
 }
 for(let t=0;t<index.length;t+=3){
  const ids=[index[t],index[t+1],index[t+2]],x=ids.map(i=>p.getX(i)),y=ids.map(i=>p.getY(i)),z=ids.map(i=>p.getZ(i)),xmin=Math.min(...x),xmax=Math.max(...x),ymin=Math.min(...y),ymax=Math.max(...y);
  if(xmax<low[0]||xmin>high[0]||ymax<low[1]||ymin>high[1]||Math.max(...z)<0)continue;
  const ax=x[1]-x[0],ay=y[1]-y[0],bx=x[2]-x[0],by=y[2]-y[0],det=ax*by-ay*bx;if(Math.abs(det)<1e-16)continue;
  const dx=ids.map(i=>delta[i*2]),dz=ids.map(i=>delta[i*2+1]),gradient=v=>[((v[1]-v[0])*by-(v[2]-v[0])*ay)/det,(ax*(v[2]-v[0])-bx*(v[1]-v[0]))/det],gx=gradient(dx),gz=gradient(dz);
  rows.push({id:t/3,x,y,z,xmin,xmax,ymin,ymax,ax,ay,bx,by,det,dx,dz,gx,gz,owned:dx.some(v=>v!==0)||dz.some(v=>v!==0)});
 }
 demand(rows.length>0,'seam has no actual torso support charts.');
 return{rows,typedScratchBytes:delta.byteLength,sample(x,y,z,out){
  out.fill(0);out[7]=1;let best=null,distance=Infinity,bu=0,bv=0;
  for(const row of rows){
   if(x<row.xmin-1e-9||x>row.xmax+1e-9||y<row.ymin-1e-9||y>row.ymax+1e-9)continue;
   const xx=x-row.x[0],yy=y-row.y[0],u=(xx*row.by-yy*row.bx)/row.det,v=(row.ax*yy-row.ay*xx)/row.det;
   if(u< -1e-9||v< -1e-9||u+v>1+1e-9)continue;
   const hit=row.z[0]+u*(row.z[1]-row.z[0])+v*(row.z[2]-row.z[0]),gap=Math.abs(z-hit);
   if(gap<distance){best=row;distance=gap;bu=u;bv=v;}
  }
  demand(best&&distance<.04,'seam vertex lost its original nearby front-triangle support.');
  if(!best.owned)return out;
  out[0]=best.dx[0]+bu*(best.dx[1]-best.dx[0])+bv*(best.dx[2]-best.dx[0]);
  out[1]=best.dz[0]+bu*(best.dz[1]-best.dz[0])+bv*(best.dz[2]-best.dz[0]);
  out[2]=best.gx[0];out[3]=best.gx[1];out[4]=best.gz[0];out[5]=best.gz[1];out[6]=1;out[7]=1+out[2];return out;
 }};
}

export function applySleeveFold165(blouse,{strength=0}={}){
 demand(strength===0||strength===1,'choose explicit OFF/ON on a fresh blouse.');
 const old=applications.get(blouse);if(old){demand(old.strength===strength,'application changed; use a fresh blouse.');return old.metrics;}
 if(strength===0)return ZERO;
 const started=now();demand(blouse?.isObject3D,'requires the existing blouse group.');
 blouse.updateWorldMatrix(true,true);
 const matches=new Map(SLEEVE165_SPEC.meshes.map(name=>[name,[]]));
 blouse.traverse(mesh=>{if(mesh.isMesh&&matches.has(mesh.name))matches.get(mesh.name).push(mesh);});
 const owners=[];for(const name of SLEEVE165_SPEC.meshes){const found=matches.get(name);demand(found.length===1,'expected one '+name);owners.push(found[0]);}
 const inverse=new Matrix4().copy(blouse.matrixWorld).invert(),ownerGeometries=new Set(),ownerBuffers=new Set();
 let maximumFrameResidual=0;
 for(const mesh of owners){
  demand(!mesh.isSkinnedMesh&&!mesh.isInstancedMesh,'requires existing static meshes.');
  const frame=new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),a=frame.elements;
  for(let i=0;i<16;i++){demand(Number.isFinite(a[i]),'nonfinite frame.');maximumFrameResidual=Math.max(maximumFrameResidual,Math.abs(a[i]-(i%5===0?1:0)));}
  demand(maximumFrameResidual<1e-12,'mesh-to-blouse frame changed.');
  const g=mesh.geometry,p=g?.getAttribute('position'),n=g?.getAttribute('normal');
  demand(p?.itemSize===3&&n?.itemSize===3&&p.count===n.count&&g.index,'missing original p/n/index.');
  demand(!Object.keys(g.morphAttributes||{}).length,'unexpected morph attributes.');
  demand(!ownerGeometries.has(g),'owners share geometry.');ownerGeometries.add(g);
  for(const attr of[p,n]){demand(!attr.isInterleavedBufferAttribute&&attr.array instanceof Float32Array,'requires original separate Float32 p/n.');demand(!ownerBuffers.has(attr.array.buffer),'owners share writable p/n storage.');ownerBuffers.add(attr.array.buffer);}
 }
 for(const mesh of owners)for(const[key,attr]of[...Object.entries(mesh.geometry.attributes),['index',mesh.geometry.index]])if(!['position','normal'].includes(key)&&attr)demand(!ownerBuffers.has(attr.array.buffer),'immutable owned attribute aliases writable p/n.');
 // Include all actual scene owners when attached, so an outside geometry alias
 // cannot receive an unrequested in-place modification through shared p/n.
 let root=blouse;while(root.parent)root=root.parent;
 root.traverse(mesh=>{if(!mesh.isMesh||owners.includes(mesh))return;const g=mesh.geometry;
  demand(!ownerGeometries.has(g),'another mesh shares an owned geometry.');
  for(const attr of[...Object.values(g.attributes),g.index])if(attr)demand(!ownerBuffers.has(attr.array.buffer),'another mesh shares owned p/n storage.');
 });
 const torso=owners[0].geometry,p0=torso.getAttribute('position'),uv=torso.getAttribute('uv');
 demand(p0.count===21809&&torso.index.count===129024&&uv?.count===21809,'original torso grid changed.');
 demand(Math.abs(p0.getX(0))<1e-7&&Math.abs(p0.getY(0)-.780)<1e-6&&Math.abs(p0.getZ(0)-.5567750334739685)<1e-6,'requires accepted pre99 blouse coordinates.');
 demand(torso.userData?.blouseDrape154?.strength===1,'requires the accepted154 torso before165.');
 const seam=owners[1].geometry;demand(seam.getAttribute('position').count===285&&seam.index.count===1344,'left sleeve seam population changed.');
 const staged=[],jet=new Float64Array(7),seamJet=new Float64Array(8),direction=SLEEVE165_SPEC.direction,seamField=createSleeveSeamField165(torso,seam);
 let ownedVertices=0,changedVertices=0,changedNormals=0,minJacobian=1,maxJacobian=1,maxNormalLengthError=0,minNormalCosine=1,maxIn=0,maxOut=0,stagedAttributeBytes=0,maxGradient=0,maxSeamDisplacementGradient=0,zeroNormalsPreserved=0;
 for(const mesh of owners){
  const geometry=mesh.geometry,p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),q=new Float32Array(p.array),nn=new Float32Array(n.array),row={mesh,geometry,p,n,q,nn,owned:0,changedVertices:0,changedNormals:0};
  stagedAttributeBytes+=q.byteLength+nn.byteLength;
  for(let i=0;i<p.count;i++){
   const k=i*3,x=p.array[k],y=p.array[k+1],z=p.array[k+2],nx=n.array[k],ny=n.array[k+1],nz=n.array[k+2];
   demand(Number.isFinite(x+y+z+nx+ny+nz),'nonfinite source p/n.');
   const isSeam=mesh===owners[1];
   if(isSeam)seamField.sample(x,y,z,seamJet);else sleeveFoldJet165(x,y,z,jet);
   if(!(isSeam?seamJet[6]:jet[4]))continue;ownedVertices++;row.owned++;
   const h=isSeam?seamJet[1]/direction[2]:jet[0],hx=isSeam?0:jet[1],hy=isSeam?0:jet[2],hz=isSeam?0:jet[3],det=isSeam?seamJet[7]:jet[6];
   demand(Number.isFinite(h+hx+hy+hz+det)&&det>.45&&det<1.7,'fold exceeded finite/invertible bounds.');
   demand(h>=-.0450002&&h<=.0140002,'fold displacement exceeded bounds.');
   q[k]=x+(isSeam?seamJet[0]:direction[0]*h);q[k+2]=z+(isSeam?seamJet[1]:direction[2]*h);
   if(!Object.is(q[k],x)||!Object.is(q[k+2],z)){changedVertices++;row.changedVertices++;}
   const length=Math.hypot(nx,ny,nz);
   if(length===0){zeroNormalsPreserved++;continue;}
   const projection=(direction[0]*nx+direction[2]*nz)/det,
    ax=isSeam?(nx-seamJet[4]*nz)/det:nx-hx*projection,
    ay=isSeam?ny-seamJet[3]*ax-seamJet[5]*nz:ny-hy*projection,
    az=isSeam?nz:nz-hz*projection,ln=Math.hypot(ax,ay,az);
   demand(Number.isFinite(ln)&&ln>1e-12,'invalid transported normal.');
   nn[k]=ax/ln;nn[k+1]=ay/ln;nn[k+2]=az/ln;
   if(!Object.is(nn[k],nx)||!Object.is(nn[k+1],ny)||!Object.is(nn[k+2],nz)){changedNormals++;row.changedNormals++;}
   minJacobian=Math.min(minJacobian,det);maxJacobian=Math.max(maxJacobian,det);maxGradient=Math.max(maxGradient,Math.hypot(hx,hy,hz));
   if(isSeam)maxSeamDisplacementGradient=Math.max(maxSeamDisplacementGradient,Math.hypot(seamJet[2],seamJet[3],seamJet[4],seamJet[5]));
   maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(Math.hypot(nn[k],nn[k+1],nn[k+2])-1));
   minNormalCosine=Math.min(minNormalCosine,(nx*ax+ny*ay+nz*az)/(length*ln));maxIn=Math.min(maxIn,h);maxOut=Math.max(maxOut,h);
  }
  staged.push(row);
 }
 demand(changedVertices>250&&staged[1].changedVertices>5,'bounded sleeve field did not reach its expected owners.');
 // All validation and new numeric buffers are complete before this commit.
 // Keep geometry, attributes and ArrayBuffers identical for154 and the renderer.
 for(const row of staged){row.p.array.set(row.q);row.n.array.set(row.nn);if(row.changedVertices)row.p.needsUpdate=true;if(row.changedNormals)row.n.needsUpdate=true;row.geometry.computeBoundingBox();row.geometry.computeBoundingSphere();}
 const metrics=Object.freeze({version:VERSION,strength,applied:true,meshes:staged.map(r=>Object.freeze({name:r.mesh.name,vertices:r.p.count,triangles:r.geometry.index.count/3,ownedVertices:r.owned,changedVertices:r.changedVertices,changedNormals:r.changedNormals})),ownedVertices,changedVertices,changedNormals,minJacobian,maxJacobian,maxTorsoFieldGradient:maxGradient,maxSeamDisplacementGradient,maxInwardDisplacement:maxIn,maxOutwardDisplacement:maxOut,minNormalCosine,maxNormalLengthError,zeroNormalsPreserved,meshToBlouseIdentityResidual:maximumFrameResidual,stagedAttributeBytes,seamSupportCharts:seamField.rows.length,seamTemporaryTypedBytes:seamField.typedScratchBytes,stagedBytesRetained:0,retainedSourceGeometryReferences:0,geometryBindingsPreserved:true,attributeBindingsPreserved:true,extraVertices:0,extraTriangles:0,extraDraws:0,extraTextures:0,elapsedMs:now()-started});
 applications.set(blouse,{strength,metrics});return metrics;
}
