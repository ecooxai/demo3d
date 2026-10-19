import {Matrix4} from 'three';

// Isolated158. Four existing collar leaf/edge meshes; after117/154, before99.
// Original maps, material factors, color/UV/index bytes and all other objects
// remain. The production helper retains no original geometry by default.
export const COLLAR158_SPEC=Object.freeze({
 version:'collar-free-leaf-roll-158',iteration:158,
 meshes:Object.freeze(['blouse-left-spread-collar','blouse-left-collar-edge','blouse-right-spread-collar','blouse-right-collar-edge']),
 protectedFolds:Object.freeze(['blouse-left-collar-fold','blouse-right-collar-fold']),
 // The original underside of UV row v=.1875 reaches ambient-chart v=.21780.
 // A .22 onset protects that same promised upper strip on both closed faces.
 transverse:Object.freeze([.20,.62]),longitudinal:Object.freeze([.22,.58]),
 returnGate:Object.freeze([.55,.95]),left:Object.freeze({height:.060,return:.025}),right:Object.freeze({height:.045,return:.020}),
 chartBounds:Object.freeze([-.08,1.08]),minimumJacobian:.70,
 description:'One broad unequal free-leaf camber reaching the lower edge, with a bounded curved point return and a fixed inner/upper collar strip.'
});
const applications=new WeakMap(),VERSION=COLLAR158_SPEC.version;
const ZERO=Object.freeze({version:VERSION,strength:0,applied:false,privateGeometries:0,privateAttributeBytes:0,changedVertices:0,changedNormals:0,elapsedMs:0});
const demand=(value,message)=>{if(!value)throw Error('158 '+message);},clamp=x=>Math.max(0,Math.min(1,x));
const now=()=>typeof performance==='object'?performance.now():Date.now();
const attributes=g=>[...Object.entries(g.attributes),['index',g.index]].filter(([,a])=>a);
const bytes=g=>attributes(g).reduce((sum,[,a])=>sum+a.array.byteLength,0);
function cubic(a,b,x){const t=clamp((x-a)/(b-a));return[t*t*(3-2*t),t>0&&t<1?6*t*(1-t)/(b-a):0];}
function quintic(a,b,x){const t=clamp((x-a)/(b-a));return[t*t*t*(10+t*(-15+6*t)),t>0&&t<1?30*t*t*(1-t)*(1-t)/(b-a):0];}
function widened(x){const a=Math.abs(x),c=cubic(.20,.95,a),scale=1+.13*c[0],j=scale+.13*a*c[1],q=x*scale,o=cubic(.84,1.60,Math.abs(q)),s=1+.12*o[0];return[q*s,j*(s+.12*Math.abs(q)*o[1])];}
function originalX(x){let a=x/1.09;for(let k=0;k<9;k++){const w=widened(a),d=(w[0]-x)/w[1];a-=d;if(Math.abs(d)<2e-15)break;}return a;}

/** Exact unrounded source X/Y chart, including both existing width maps.
 * Z support is deliberately absent: source collarPoint X/Y never depend on it.
 * out=[X,Y,Xu,Xv,Yu,Yv,det(DC)]. */
export function collarChart158(side,u,v,out){
 const sv=Math.sin(Math.PI*v),cv=Math.PI*Math.cos(Math.PI*v),su=Math.sin(Math.PI*u),cu=Math.PI*Math.cos(Math.PI*u);
 const roll=cubic(0,.38,v),U=1-roll[0],Ud=-roll[1],late=cubic(.45,1,v),fv=cubic(.20,.52,v),fu=cubic(.08,.27,u),end=cubic(.35,1,v),drop=side<0?.030:.022,dy=side<0?-.022:.018;
 const width=.170+.285*v+.060*sv+.035*U,wd=.285+.060*cv+.035*Ud;
 const raw=side*(.315-.057*v+.025*sv+u*width),rxu=side*width,rxv=side*(-.057+.025*cv+u*wd),wide=widened(raw);
 const ease=fu[0]*(.28+.72*u),eu=fu[1]*(.28+.72*u)+.72*fu[0];
 const y=1.625-.470*v-.012*sv+u*(-.029-.521*v+.142*sv)-.105*(.65+.35*u)*U+.015*su*U+.045*su*late[0]-drop*fv[0]*ease*end[0]+dy*v;
 const yu=-.029-.521*v+.142*sv-.03675*U+.015*cu*U+.045*cu*late[0]-drop*fv[0]*eu*end[0];
 const yv=-.470-.012*cv+u*(-.521+.142*cv)-.105*(.65+.35*u)*Ud+.015*su*Ud+.045*su*late[1]-drop*ease*(fv[1]*end[0]+fv[0]*end[1])+dy;
 out[0]=wide[0];out[1]=y;out[2]=wide[1]*rxu;out[3]=wide[1]*rxv;out[4]=yu;out[5]=yv;out[6]=out[2]*yv-out[3]*yu;return out;
}

export const collarWorkspace158=()=>({chart:new Float64Array(7),next:new Float64Array(7),inverse:new Float64Array(5)});

/** Bounded one-dimensional inverse after undoing the exact width maps.
 * The original X coordinate is affine in u at fixed v, so no nearest-grid
 * lookup or camera projection is required. Also valid for thin back/seam offsets.
 * out=[u,v,XY residual,Newton iterations,source chart determinant]. */
export function collarInverse158(side,x,y,out,work=collarWorkspace158()){
 const raw=side*originalX(x),c=work.chart;let v=Math.max(-.04,Math.min(1.04,(1.535-y)/.95)),u=0,iterations=0;
 for(let k=0;k<16;k++){
  const upper=1-cubic(0,.38,v)[0],s=Math.sin(Math.PI*v),inner=.315-.057*v+.025*s,width=.170+.285*v+.060*s+.035*upper;
  u=(raw-inner)/width;collarChart158(side,u,v,c);const residual=c[1]-y;iterations=k+1;
  if(Math.abs(residual)<2e-13)break;
  const derivative=c[5]-c[4]*c[3]/c[2];demand(Number.isFinite(derivative)&&Math.abs(derivative)>.02,'singular original collar chart.');
  const step=residual/derivative;v-=Math.max(-.18,Math.min(.18,step));
 }
 // The final iteration may have updated v. Re-evaluate u and the residual.
 const upper=1-cubic(0,.38,v)[0],s=Math.sin(Math.PI*v),inner=.315-.057*v+.025*s,width=.170+.285*v+.060*s+.035*upper;
 u=(raw-inner)/width;collarChart158(side,u,v,c);
 const residual=Math.hypot(c[0]-x,c[1]-y),lo=COLLAR158_SPEC.chartBounds[0],hi=COLLAR158_SPEC.chartBounds[1];
 demand(Number.isFinite(u+v+residual+c[6])&&residual<1e-9&&u>lo&&u<hi&&v>lo&&v<hi,'actual vertex leaves the guarded collar chart: '+JSON.stringify({side,u,v,residual,x,y}));
 out[0]=u;out[1]=v;out[2]=residual;out[3]=iterations;out[4]=c[6];return out;
}

/** Map/analytic spatial Jacobian in the existing blouse-local frame.
 * out=[X',Y',Z',Jxx,Jxy,Jyx,Jyy,Jzx,Jzy,detJ,u,v,owned,residual].
 * Jxz=Jyz=0,Jzz=1. The same ambient map reaches fronts, backs and edge tubes. */
export function collarMap158(side,x,y,z,out,work=collarWorkspace158()){
 collarInverse158(side,x,y,work.inverse,work);const[u,v,residual]=work.inverse;
 out[0]=x;out[1]=y;out[2]=z;out[3]=out[6]=out[9]=1;out[4]=out[5]=out[7]=out[8]=out[12]=0;out[10]=u;out[11]=v;out[13]=residual;
 if(u<=.20||v<=.22)return out;
 const sideSpec=side<0?COLLAR158_SPEC.left:COLLAR158_SPEC.right,a=quintic(.20,.62,u),b=quintic(.22,.58,v),r=quintic(.55,.95,v),along=quintic(.35,1,v),w=a[0]*b[0],wu=a[1]*b[0],wv=a[0]*b[1];
 const vr=v-sideSpec.return*w*r[0],vru=-sideSpec.return*wu*r[0],vrv=1-sideSpec.return*(wv*r[0]+w*r[1]);
 const phase=Math.PI*(u-.20),s=Math.sin(phase),su=Math.PI*Math.cos(phase),t=.65+.35*along[0],tv=.35*along[1];
 const h=sideSpec.height*w*s*t,hu=sideSpec.height*(wu*s+w*su)*t,hv=sideSpec.height*s*(wv*t+w*tv);
 const c=work.chart,n=work.next;collarChart158(side,u,v,c);collarChart158(side,u,vr,n);
 const d=c[6],b00=n[2]+n[3]*vru,b01=n[3]*vrv,b10=n[4]+n[5]*vru,b11=n[5]*vrv;
 out[0]=n[0];out[1]=n[1];out[2]=z+h;
 out[3]=(b00*c[5]-b01*c[4])/d;out[4]=(-b00*c[3]+b01*c[2])/d;
 out[5]=(b10*c[5]-b11*c[4])/d;out[6]=(-b10*c[3]+b11*c[2])/d;
 out[7]=(hu*c[5]-hv*c[4])/d;out[8]=(-hu*c[3]+hv*c[2])/d;out[9]=out[3]*out[6]-out[4]*out[5];out[12]=1;
 demand(Number.isFinite(out[0]+out[1]+out[2]+out[3]+out[4]+out[5]+out[6]+out[7]+out[8]+out[9])&&out[9]>=COLLAR158_SPEC.minimumJacobian,'nonfinite or compressed collar map.');
 demand(h>=-.000001&&h<=sideSpec.height+.000001&&Math.hypot(out[0]-x,out[1]-y)<=.055,'approved collar roll/return bounds exceeded.');return out;
}

function identityFrame(blouse,mesh,inverse){
 const m=new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld).elements;let residual=0;
 for(let i=0;i<16;i++){demand(Number.isFinite(m[i]),'nonfinite mesh-to-blouse frame.');residual=Math.max(residual,Math.abs(m[i]-(i%5===0?1:0)));}
 demand(residual<1e-12,'collar mesh-to-blouse frame changed.');return residual;
}

export function applyCollarRoll158(blouse,{strength=0,retainSourceForQA=false}={}){
 demand(strength===0||strength===1,'choose explicit OFF/ON on a fresh blouse.');const previous=applications.get(blouse);
 if(previous){demand(previous.strength===strength&&previous.retainSourceForQA===retainSourceForQA,'options changed; use a fresh blouse.');return previous.metrics;}
 if(strength===0)return ZERO;
 const started=now();demand(blouse?.isObject3D,'requires the existing blouse group.');blouse.updateWorldMatrix(true,true);
 const inverse=new Matrix4().copy(blouse.matrixWorld).invert(),records=[],folds=[],sourceBuffers=new Set(),sourceAttributes=new Set(),work=collarWorkspace158(),jet=new Float64Array(14),chart=new Float64Array(7);
 blouse.traverse(o=>{
  if(!o.isMesh)return;
  if(COLLAR158_SPEC.meshes.includes(o.name))records.push({mesh:o,original:o.geometry,side:o.name.includes('-left-')?-1:1,leaf:o.name.endsWith('-spread-collar')});
  if(COLLAR158_SPEC.protectedFolds.includes(o.name))folds.push(o);
 });
 demand(records.length===4&&new Set(records.map(r=>r.mesh.name)).size===4&&folds.length===2,'requires four unique original leaf/edge meshes and both protected fold tubes.');
 let frameResidual=0,maxFrontChartResidual=0;
 // Complete preflight occurs before any replacement is installed.
 for(const r of records){
  const {mesh,original:g,side,leaf}=r,p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');
  demand(!mesh.isSkinnedMesh&&!mesh.isInstancedMesh&&!Object.keys(g.morphAttributes||{}).length,'requires the original static collar meshes.');
  frameResidual=Math.max(frameResidual,identityFrame(blouse,mesh,inverse));
  demand(p?.itemSize===3&&n?.itemSize===3&&uv?.itemSize===2&&p.count===(leaf?2450:485)&&n.count===p.count&&uv.count===p.count&&g.index?.count===(leaf?14688:2304),'original collar topology changed: '+mesh.name);
  for(const[key,a]of attributes(g)){
   demand(!a.isInterleavedBufferAttribute&&a.array&&ArrayBuffer.isView(a.array),'unsupported collar attribute '+key);
   sourceBuffers.add(a.array.buffer);sourceAttributes.add(a);for(let k=0;k<a.array.length;k++)demand(Number.isFinite(a.array[k]),'nonfinite source collar '+key);
  }
  if(leaf)for(let i=0;i<1225;i++){
   demand(Math.abs(uv.getX(i)-(i%25)/24)<1e-6&&Math.abs(uv.getY(i)-Math.floor(i/25)/48)<1e-6,'original collar UV grid order changed.');
   collarChart158(side,uv.getX(i),uv.getY(i),chart);const residual=Math.hypot(chart[0]-p.getX(i),chart[1]-p.getY(i));maxFrontChartResidual=Math.max(maxFrontChartResidual,residual);
   demand(residual<4e-7,'source collar frame/layout changed; apply158 after117/154 before99.');
  }
  if(leaf)for(let i=0;i<p.count;i++)if(uv.getX(i)<=.20||uv.getY(i)<=.20){collarMap158(side,p.getX(i),p.getY(i),p.getZ(i),jet,work);demand(jet[12]===0,'the original front/back attachment strip entered the field.');}
 }
 let protectedFoldVertices=0;
 for(const mesh of folds){
  identityFrame(blouse,mesh,inverse);const side=mesh.name.includes('-left-')?-1:1,p=mesh.geometry.getAttribute('position');
  demand(p?.count===405,'protected fold tube topology changed.');
  for(let i=0;i<p.count;i++){collarMap158(side,p.getX(i),p.getY(i),p.getZ(i),jet,work);demand(jet[12]===0,'an actual protected collar-fold tube vertex enters the proposed field.');protectedFoldVertices++;}
 }
 const staged=[];let changedVertices=0,changedNormals=0,ownedVertices=0,minimumJacobian=1,maximumJacobian=1,maxDisplacement=0,maxXYReturn=0,maxHeight=0,maxNormalLengthError=0,minNormalCosine=1,zeroNormals=0,maxInverseResidual=0,sourceBytes=0,privateBytes=0;
 try{
  for(const r of records){
   const {original:g,side,mesh}=r,replacement=g.clone();staged.push({...r,replacement});
   for(const[key,a]of attributes(replacement)){const b=key==='index'?g.index:g.getAttribute(key);demand(!sourceBuffers.has(a.array.buffer)&&!sourceAttributes.has(a),'private replacement shares a disposable source binding: '+key);demand(a.itemSize===b.itemSize&&a.count===b.count&&a.normalized===b.normalized&&a.array.constructor===b.array.constructor,'private clone layout changed.');}
   const p=g.getAttribute('position'),n=g.getAttribute('normal'),q=replacement.getAttribute('position'),nn=replacement.getAttribute('normal');let changed=0,nchanged=0,owned=0,minJ=1,maxD=0;
   for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);collarMap158(side,x,y,z,jet,work);maxInverseResidual=Math.max(maxInverseResidual,jet[13]);if(!jet[12])continue;owned++;ownedVertices++;
    const d=Math.hypot(jet[0]-x,jet[1]-y,jet[2]-z);maxD=Math.max(maxD,d);maxDisplacement=Math.max(maxDisplacement,d);maxXYReturn=Math.max(maxXYReturn,Math.hypot(jet[0]-x,jet[1]-y));maxHeight=Math.max(maxHeight,jet[2]-z);minimumJacobian=Math.min(minimumJacobian,jet[9]);maximumJacobian=Math.max(maximumJacobian,jet[9]);minJ=Math.min(minJ,jet[9]);
    q.setXYZ(i,jet[0],jet[1],jet[2]);if(!Object.is(q.getX(i),x)||!Object.is(q.getY(i),y)||!Object.is(q.getZ(i),z))changed++;
    const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),oldLength=Math.hypot(nx,ny,nz);if(oldLength===0){zeroNormals++;continue;}
    const sx=nx-jet[7]*nz,sy=ny-jet[8]*nz,ax=(jet[6]*sx-jet[5]*sy)/jet[9],ay=(-jet[4]*sx+jet[3]*sy)/jet[9],az=nz,l=Math.hypot(ax,ay,az);demand(Number.isFinite(l)&&l>1e-12,'invalid exact inverse-transpose collar normal.');
    nn.setXYZ(i,ax/l,ay/l,az/l);if(!Object.is(nx,nn.getX(i))||!Object.is(ny,nn.getY(i))||!Object.is(nz,nn.getZ(i)))nchanged++;
    maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(Math.hypot(nn.getX(i),nn.getY(i),nn.getZ(i))-1));minNormalCosine=Math.min(minNormalCosine,(nx*ax+ny*ay+nz*az)/(oldLength*l));
   }
   demand(owned>0&&changed>0,'collar target has no useful changed vertices: '+mesh.name);if(changed)q.needsUpdate=true;if(nchanged)nn.needsUpdate=true;replacement.computeBoundingBox();replacement.computeBoundingSphere();replacement.userData={...replacement.userData,collarRoll158:{version:VERSION,strength}};
   r.metrics={mesh:mesh.name,sourceVertices:p.count,sourceTriangles:g.index.count/3,ownedVertices:owned,changedVertices:changed,changedNormals:nchanged,minimumJacobian:minJ,maxDisplacement:maxD,privateBytes:bytes(replacement)};
   changedVertices+=changed;changedNormals+=nchanged;sourceBytes+=bytes(g);privateBytes+=bytes(replacement);
  }
  const metrics=Object.freeze({version:VERSION,strength,applied:true,meshes:Object.freeze(records.map(r=>Object.freeze(r.metrics))),sourceVertices:5870,sourceTriangles:11328,ownedVertices,changedVertices,changedNormals,minimumJacobian,maximumJacobian,maxDisplacement,maxXYReturn,maxHeight,maxNormalLengthError,minNormalCosine,zeroNormalsPreserved:zeroNormals,maxInverseResidual,maxFrontChartResidual,meshToBlouseIdentityResidual:frameResidual,protectedFoldVertices,privateGeometries:4,sourceGeometryBytes:sourceBytes,privateAttributeBytes:privateBytes,retainsSourceForQA:retainSourceForQA,extraVertices:0,extraTriangles:0,extraMaps:0,extraDraws:0,elapsedMs:now()-started});
  for(const r of staged)r.mesh.geometry=r.replacement;
  applications.set(blouse,{strength,retainSourceForQA,records:staged.map(r=>({mesh:r.mesh,replacement:r.replacement,original:retainSourceForQA?r.original:null})),metrics});return metrics;
 }catch(error){for(const r of staged)r.replacement.dispose();throw error;}
}

/** QA only: retained originals must first receive the same single99 balance. */
export function releaseCollarRoll158(blouse){
 const record=applications.get(blouse);if(!record)return{released:false,privateGeometriesDisposed:0};
 demand(record.retainSourceForQA&&record.records.every(r=>r.original),'no retained QA originals are available.');
 for(const r of record.records)demand(r.mesh.geometry===r.replacement,'private collar binding changed before release.');
 // Restore all bindings before disposal so a cleanup exception cannot leave a
 // disposed replacement installed. All replacement attributes/index are private.
 for(const r of record.records)r.mesh.geometry=r.original;
 for(const r of record.records)r.replacement.dispose();applications.delete(blouse);
 return{released:true,privateGeometriesDisposed:record.records.length,sourceGeometriesRestored:true};
}
