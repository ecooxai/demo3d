import * as THREE from 'three';
import {find,actualGroomStats,currentOffset,supportIndex,sampleCrown,getFrontCapture171,forgetFrontCapture171,forgetUpstreamRestore171,cutFrontalCrown171,retireUpstreamFibers171,restoreUpstreamFibers171} from './front171-mac-core.js';
const VERSION='continuous-root-explicit-front-fibers-171-mac',applications=new WeakMap();
export const FRONT_MESH171='Original continuous root fan with tapered physical front fibers171';
const CROWN='Continuous parted crown with longitudinal fiber flow',DETAIL='Independent fine crown lengths and silhouette strands';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);},ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(10+t*(-15+6*t));};
const add=(a,b,s=1)=>[a[0]+b[0]*s,a[1]+b[1]*s,a[2]+b[2]*s],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],length=a=>Math.hypot(...a),unit=a=>{const l=length(a);if(l<1e-12)throw Error('171 zero direction');return a.map(x=>x/l);},blend=(a,b,t)=>a.map((x,k)=>mix(x,b[k],t));
const cubic=(c,t)=>{const r=1-t;return[0,1,2].map(k=>r*r*r*c[0][k]+3*r*r*t*c[1][k]+3*r*t*t*c[2][k]+t*t*t*c[3][k]);};
const derivative=(c,t)=>{const r=1-t;return[0,1,2].map(k=>3*r*r*(c[1][k]-c[0][k])+6*r*t*(c[2][k]-c[1][k])+3*t*t*(c[3][k]-c[2][k]));};
function random171(seed=817193){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
// Unequal reference-directed end families remain only as centerline endpoints.
// No closed167 mass, opaque carrier or wide-body geometry is emitted.
const families=[
 [{u:.620,end:[-.864,.43,.30],handle:.76,fall:.40,phase:.3},{u:.677,end:[-.844,.12,.37],handle:.73,fall:.56,phase:2.1},{u:.739,end:[-.701,-.38,.56],handle:.62,fall:.68,phase:4.6},{u:.799,end:[-.502,.065,.65],handle:.47,fall:.60,phase:1.4},{u:.860,end:[-.308,.24,.665],handle:.36,fall:.48,phase:5.3},{u:.917,end:[-.132,.29,.665],handle:.24,fall:.45,phase:3.2},{u:.978,end:[.006,.50,.650],handle:.15,fall:.34,phase:6.1}],
 [{u:.624,end:[.865,.28,.255],handle:.70,fall:.48,phase:1.1},{u:.705,end:[.766,.25,.405],handle:.60,fall:.50,phase:4.1},{u:.797,end:[.590,.30,.570],handle:.46,fall:.48,phase:2.8},{u:.886,end:[.378,.36,.660],handle:.30,fall:.42,phase:5.7},{u:.973,end:[.187,.54,.655],handle:.17,fall:.30,phase:.7}]
];
function endpoint171(side,u){const f=families[side<0?0:1];if(u<=f[0].u)return{...f[0],end:f[0].end.slice()};if(u>=f.at(-1).u)return{...f.at(-1),end:f.at(-1).end.slice()};let i=0;while(u>f[i+1].u)i++;const a=f[i],b=f[i+1],q=(u-a.u)/(b.u-a.u),t=q-.62*Math.sin(q*Math.PI*2)/(Math.PI*2);return{u,end:blend(a.end,b.end,t),handle:mix(a.handle,b.handle,t),fall:mix(a.fall,b.fall,t),phase:mix(a.phase,b.phase,t)};}
function posed171(p,tilt){const[x,y,z]=p,w=1-smooth(-1.64,.38,y),ay=-.16*w,az=-tilt*w,xx=x*Math.cos(ay)+z*Math.sin(ay);return[xx*Math.cos(az)-y*Math.sin(az),xx*Math.sin(az)+y*Math.cos(az),-x*Math.sin(ay)+z*Math.cos(ay)];}
function scalpNormal171(p,delta){const q=sub(p,delta);return unit([(q[0]-.012)/(.94*.94),(q[1]-.327)/(1.302*1.302),(q[2]+.077)/(.857*.857)]);}
function frame171(p,D,delta){const scalp=scalpNormal171(p,delta),normal0=unit(blend([0,0,1],scalp,ease(.48,1.30,p[1]-delta[1])));let side=cross(D,normal0);if(length(side)<1e-8)side=cross(D,[1,0,0]);if(length(side)<1e-8)side=cross(D,[0,1,0]);side=unit(side);return{S:side,N:unit(cross(side,D))};}
function lattice171(side,crown,delta,support,tilt){
 const routes=[],metrics={side,routes:65,maximumControlLift:0,maximumResidualPenetration:0,sampledSupportHits:0,sampledSupportMisses:0};
 for(let i=0;i<=64;i++){
  const u=mix(.590,.998,i/64),e=endpoint171(side,u),root=sampleCrown(crown.geometry,side,u,.016),normal=scalpNormal171(root,delta),a=add(root,normal,-.0015),old=unit(sub(sampleCrown(crown.geometry,side,u,.023),sampleCrown(crown.geometry,side,u,.009))),down=unit([side*.25,-.85,.34]),direction=unit(blend(old,down,ease(.78,.992,u))),b=add(a,direction,.62*e.handle+.05),d=add(posed171(e.end,tilt),delta),c=add(d,unit([side*.12,-1,-.08]),-.62*e.fall),controls=[a,b,c,d],before=controls.map(p=>p[2]);
  // Fit evaluated curve points. Control points are mathematical handles, not
  // physical samples to project onto the head. Every correction stays a whole cubic.
  for(let pass=0;pass<7;pass++){
   const adjustment=[0,0,0];let worst=0;
   for(let j=3;j<=64;j++){const t=j/64,r=1-t,p=cubic(controls,t),h=support.at(p[0],p[1]);if(!h)continue;const miss=h.p[2]+.012-p[2];if(miss<=.00004)continue;worst=Math.max(worst,miss);const B=[3*r*r*t,3*r*t*t,t*t*t],norm=dot(B,B);for(let k=0;k<3;k++)adjustment[k]=Math.max(adjustment[k],miss*B[k]/norm);}
   if(!worst)break;for(let k=0;k<3;k++)controls[k+1][2]+=adjustment[k]*1.04;
  }
  const lift=Math.max(...controls.map((p,k)=>p[2]-before[k]));metrics.maximumControlLift=Math.max(metrics.maximumControlLift,lift);if(lift>.35)throw Error('171 route needs excessive smooth depth correction: '+JSON.stringify({side,u,lift,controls}));
  for(let j=3;j<=64;j++){const p=cubic(controls,j/64),h=support.at(p[0],p[1]);if(h){metrics.sampledSupportHits++;metrics.maximumResidualPenetration=Math.max(metrics.maximumResidualPenetration,h.p[2]+.005-p[2]);}else metrics.sampledSupportMisses++;}
  routes.push({u,controls,phase:e.phase});
 }
 if(metrics.maximumResidualPenetration>.001)throw Error('171 unresolved lattice head overlap');return{routes,metrics};
}
function controlsAt171(lattice,u){const q=clamp((u-.590)/(.998-.590))*64,i=Math.min(63,Math.floor(q)),t=q-i;return lattice.routes[i].controls.map((p,k)=>blend(p,lattice.routes[i+1].controls[k],t));}
function makeFibers171(crown,capture,delta,support){
 const started=performance.now(),lattices=[lattice171(-1,crown,delta,support,capture.headTilt),lattice171(1,crown,delta,support,capture.headTilt)],counts=[1740,960],steps=72,physicalFibers=2700,crossRibbons=900,ribbons=physicalFibers+crossRibbons,vertices=ribbons*(steps+1)*2,triangles=ribbons*steps*2;
 const P=new Float32Array(vertices*3),N=new Float32Array(vertices*3),C=new Float32Array(vertices*3),UV=new Float32Array(vertices*2),I=new Uint32Array(triangles*3),random=random171();let vi=0,ii=0,sampledHits=0,sampledMisses=0,minimumSampledGap=Infinity,maximumSampledPenetration=0;
 const palette=['#4c403c','#554642','#433937','#5c4d49','#463b38','#51433f'],base=new THREE.Color('#50413e');
 for(let sideIndex=0;sideIndex<2;sideIndex++)for(let k=0;k<counts[sideIndex];k++){
  const u=mix(.590,.998,(k+.15+.70*random())/counts[sideIndex]),controls=controlsAt171(lattices[sideIndex],u),phase=random()*Math.PI*2,end=.825+.175*random(),width=.00050+.00047*random(),amplitude=.0008+.0017*random(),depthAmplitude=.0005+.0013*random(),color=new THREE.Color(palette[Math.floor(random()*palette.length)]).lerp(base,.82),value=.96+.07*random(),centers=[];
  for(let j=0;j<=steps;j++){const t=j/steps,at=t*end,p=cubic(controls,at),D=unit(derivative(controls,at)),f=frame171(p,D,delta),w=Math.sin(Math.PI*t)**2,drift=amplitude*w*(.7*Math.sin(t*4.1+phase)+.3*Math.sin(t*11.2+phase*.61)),depth=depthAmplitude*w*Math.sin(t*5.3+phase*.73),q=add(add(p,f.S,drift),f.N,depth);centers.push(q);
   if(k%35===0&&j>=4&&j%3===0){const h=support.at(q[0],q[1]);if(h){sampledHits++;minimumSampledGap=Math.min(minimumSampledGap,q[2]-h.p[2]);maximumSampledPenetration=Math.max(maximumSampledPenetration,h.p[2]-q[2]);}else sampledMisses++;}
  }
  for(let ribbon=0;ribbon<(k%3===0?2:1);ribbon++){
   const first=vi;
   for(let j=0;j<=steps;j++){
    const t=j/steps,p=centers[j],D=unit(sub(centers[Math.min(steps,j+1)],centers[Math.max(0,j-1)])),f=frame171(p,D,delta),axis=ribbon?f.N:f.S,faceNormal=ribbon?f.S.map(x=>-x):f.N,w=width*(.40+.60*smooth(0,.035,t))*(.006+.994*(1-ease(.69,1,t))),shade=value*(.96+.04*smooth(0,.15,t))*(1+.012*Math.sin(t*8.1+phase));
    for(const sign of [-1,1]){const q=add(p,axis,sign*w),n=unit(add(faceNormal,axis,sign*.48));P.set(q,vi*3);N.set(n,vi*3);C.set([color.r*shade,color.g*shade,color.b*shade],vi*3);UV.set([sign<0?0:1,t*.74],vi*2);vi++;}
   }
   for(let j=0;j<steps;j++){const a=first+j*2,b=a+2;I.set([a,a+1,b,a+1,b+1,b],ii);ii+=6;}
  }
 }
 if(vi!==vertices||ii!==I.length)throw Error('171 emitted inventory mismatch');
 let nonfinite=0,degenerateTriangles=0,normalOpposedTriangles=0,minimumNormalCosine=1,minimumDoubleArea=Infinity,normalLengthError=0;
 for(const a of [P,N,C,UV])for(const x of a)if(!Number.isFinite(x))nonfinite++;
 for(let i=0;i<N.length;i+=3)normalLengthError=Math.max(normalLengthError,Math.abs(Math.hypot(N[i],N[i+1],N[i+2])-1));
 for(let k=0;k<I.length;k+=3){const a=I[k]*3,b=I[k+1]*3,c=I[k+2]*3,x1=P[b]-P[a],y1=P[b+1]-P[a+1],z1=P[b+2]-P[a+2],x2=P[c]-P[a],y2=P[c+1]-P[a+1],z2=P[c+2]-P[a+2],nx=y1*z2-z1*y2,ny=z1*x2-x1*z2,nz=x1*y2-y1*x2,area=Math.hypot(nx,ny,nz),sx=N[a]+N[b]+N[c],sy=N[a+1]+N[b+1]+N[c+1],sz=N[a+2]+N[b+2]+N[c+2],l=Math.hypot(sx,sy,sz),d=nx*sx+ny*sy+nz*sz;minimumDoubleArea=Math.min(minimumDoubleArea,area);if(area<=1e-12)degenerateTriangles++;else if(l>1e-12){const cosine=d/(area*l);minimumNormalCosine=Math.min(minimumNormalCosine,cosine);if(cosine<=0)normalOpposedTriangles++;}}
 if(nonfinite||degenerateTriangles||normalOpposedTriangles||maximumSampledPenetration>.002)throw Error('171 invalid fiber surface: '+JSON.stringify({nonfinite,degenerateTriangles,normalOpposedTriangles,maximumSampledPenetration,minimumNormalCosine}));
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(P,3));geometry.setAttribute('normal',new THREE.BufferAttribute(N,3));geometry.setAttribute('color',new THREE.BufferAttribute(C,3));geometry.setAttribute('uv',new THREE.BufferAttribute(UV,2));geometry.setIndex(new THREE.BufferAttribute(I,1));geometry.computeBoundingBox();geometry.computeBoundingSphere();
 return{geometry,metrics:{physicalFibers,crossRibbons,ribbons,vertices,triangles,geometryBytes:P.byteLength+N.byteLength+C.byteLength+UV.byteLength+I.byteLength,steps,lattice:lattices.map(x=>x.metrics),sampledSupport:{hits:sampledHits,misses:sampledMisses,minimumGap:Number.isFinite(minimumSampledGap)?minimumSampledGap:null,maximumPenetration:maximumSampledPenetration,scope:'Sparse emitted center samples; not a global collision/clearance proof. Embedded root samples are excluded.'},nonfinite,degenerateTriangles,normalOpposedTriangles,minimumNormalCosine,minimumDoubleArea,normalLengthError,elapsedMs:performance.now()-started}};
}
export function applyFrontFibers171(groom,head,{strength=0,retainSourceForQA=true}={}){
 if(strength!==0&&strength!==1)throw Error('171 only supports its fixed OFF/ON art study');const previous=applications.get(groom);if(previous){if(strength!==1||previous.metrics.retainSourceForQA!==!!retainSourceForQA)throw Error('171 already applied with different options');return previous.metrics;}
 if(!strength)return{version:VERSION,strength:0,applied:false,addedTriangles:0,removedTriangles:0,addedGeometryBytes:0,addedTextureBytes:0,perFrameWork:0,elapsedMs:0};
 const started=performance.now(),capture=getFrontCapture171(groom);if(!capture)throw Error('171 needs its original-source capture');const crown=find(groom,CROWN),detail=find(groom,DETAIL),material=detail.material;
 if(!material.isMeshPhysicalMaterial||material.color.toArray().some((v,k)=>v!==[.65,.69,.75][k]))throw Error('171 requires the existing once-tinted fine material');
 const originalUserData=groom.userData,{delta,max}=currentOffset(groom,capture),support=supportIndex(groom,head),surface=makeFibers171(crown,capture,delta,support),cut=cutFrontalCrown171(crown.geometry),retired=retireUpstreamFibers171(groom);
 if(cut.removed!==12400||retired.removedTriangles!==182572)throw Error('171 original retirement inventory changed');
 const mesh=new THREE.Mesh(surface.geometry,material);mesh.name=FRONT_MESH171;mesh.castShadow=true;mesh.receiveShadow=true;mesh.renderOrder=detail.renderOrder;groom.add(mesh);crown.geometry.setIndex(cut.next);
 const metrics={version:VERSION,strength:1,applied:true,representation:'2700 tapered physical fiber ribbons with900 orthogonal cross ribbons; no opaque167 body',preparedTranslation:delta,translationAnchorResidual:max,...surface.metrics,addedTriangles:surface.metrics.triangles,removedTriangles:cut.removed+retired.removedTriangles,removedCrownTriangles:cut.removed,removedUpstreamTriangles:retired.removedTriangles,addedGeometryBytes:surface.metrics.geometryBytes,addedTextureBytes:0,newMaterialCount:0,materialSource:'Shared existing DETAIL material after single149 tint; no clone or repeated tint',castShadow:true,perFrameWork:0,retainSourceForQA:!!retainSourceForQA,support:{...support.metrics},elapsedMs:performance.now()-started};
 groom.userData={...groom.userData,...actualGroomStats(groom),frontFibers171:metrics};
 if(retainSourceForQA)applications.set(groom,{metrics,crown,cut,mesh,originalUserData});
 else{forgetUpstreamRestore171(groom);forgetFrontCapture171(groom);groom.userData.replacedUpstreamFibers171={version:retired.version,removedTriangles:retired.removedTriangles,hidden:retired.hidden.map(x=>({mesh:x.mesh,removedTriangles:x.removedTriangles}))};applications.set(groom,{metrics});}
 return metrics;
}
export function getFrontFibers171QA(groom){return applications.get(groom)||null;}
export function releaseFrontFibers171(groom){const a=applications.get(groom);if(!a)return{released:false};if(!a.mesh)throw Error('171 production mode holds no restoration source');a.crown.geometry.setIndex(a.cut.old);groom.remove(a.mesh);restoreUpstreamFibers171(groom);groom.userData=a.originalUserData;a.mesh.geometry.dispose();applications.delete(groom);forgetFrontCapture171(groom);return{released:true,privateGeometryDisposed:1,sharedMaterialDisposed:0,sourceCaptureReleased:true};}
