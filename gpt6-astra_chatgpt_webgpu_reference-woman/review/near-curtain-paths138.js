import * as THREE from 'three';
import { sampleBlouseFrontAtXY } from '../src/blouse.js';

// Isolated 138. All new lower surfaces and their fine paths belong to the same
// six families. Accepted 86 is included in planning and still applied once by
// the groom. The protected guides retain their already-computed 118.5 curves.
const VERSION='six-family-near-curtain-138-v1';
const HEAD_Y=2.95,PIN=-1.34,FULL=-1.97,PROTECTED=-1.05;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const S=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
const mix=(a,b,t)=>a+(b-a)*t;
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const IDS=[...Array.from({length:33},(_,k)=>58+k),...Array.from({length:6},(_,k)=>133+k),...Array.from({length:28},(_,k)=>172+k)];
const selected=new Set(IDS);
const OFF=Object.freeze({version:VERSION,enabled:false,changed:false});
const TAU=Math.PI*2;

// Pre-balance model X/Y, manually directed from the sole reference. The two
// dominant S sweeps turn at different heights. These are original 3D guides.
const FAMILIES=[
 {name:'A inner fall',share:.11,slots:[4,0,3],phase:.4,end:-.80,xy:[[1.61,-.66],[1.18,-.43],[.72,-.46],[.12,-.55],[-.42,-.68],[-.80,-.47]]},
 {name:'B inner return',share:.14,slots:[5,1,4],phase:1.8,end:-.97,xy:[[1.61,-.68],[1.18,-.54],[.78,-.53],[.20,-.64],[-.42,-.88],[-.97,-.60]]},
 {name:'C long inner S',share:.23,slots:[7,0,6],phase:.9,end:-1.10,xy:[[1.61,-.70],[1.18,-.67],[.66,-.62],[.10,-.78],[-.46,-1.13],[-1.10,-.78]]},
 {name:'D long outer S',share:.26,slots:[8,2,7],phase:2.6,end:-1.17,xy:[[1.61,-.71],[1.18,-.84],[.62,-.81],[.02,-1.08],[-.55,-1.49],[-1.17,-.98]]},
 {name:'E outer return',share:.17,slots:[6,2,5],phase:1.4,end:-.87,xy:[[1.61,-.73],[1.18,-.99],[.80,-.96],[.06,-1.21],[-.38,-1.53],[-.87,-1.13]]},
 {name:'F short release',share:.09,slots:[3,1,3],phase:3.5,end:-.65,xy:[[1.61,-.74],[1.18,-1.08],[.59,-1.15],[.02,-1.37],[-.28,-1.51],[-.65,-1.23]]}
];

// C2 interpolation by physical height, with shared nodal derivatives. Values
// are sampled directly; there is no row-wise nearest-support displacement.
function spline(rows){
 const q=rows.map(p=>p.slice()).sort((a,b)=>a[0]-b[0]),n=q.length,d=new Float64Array(n),a=new Float64Array(n);
 for(let i=0;i<n;i++){
  if(i===0)d[i]=(q[1][1]-q[0][1])/(q[1][0]-q[0][0]);
  else if(i===n-1)d[i]=(q[i][1]-q[i-1][1])/(q[i][0]-q[i-1][0]);
  else{const l=(q[i][1]-q[i-1][1])/(q[i][0]-q[i-1][0]),r=(q[i+1][1]-q[i][1])/(q[i+1][0]-q[i][0]);d[i]=(q[i+1][1]-q[i-1][1])/(q[i+1][0]-q[i-1][0]);a[i]=2*(r-l)/(q[i+1][0]-q[i-1][0]);}
 }
 return x=>{
  if(x<=q[0][0])return q[0][1]+d[0]*(x-q[0][0]);
  if(x>=q[n-1][0])return q[n-1][1]+d[n-1]*(x-q[n-1][0]);
  let i=0;while(i<n-2&&x>q[i+1][0])i++;
  const h=q[i+1][0]-q[i][0],t=(x-q[i][0])/h,c0=q[i][1],c1=d[i]*h,c2=a[i]*h*h*.5;
  const A=q[i+1][1]-c0-c1-c2,B=d[i+1]*h-c1-2*c2,C=a[i+1]*h*h-2*c2;
  const c3=10*A-4*B+.5*C,c4=-15*A+7*B-C,c5=6*A-3*B+.5*C;
  return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*c5))));
 };
}
function atY(c,y){
 let previous=c.getPoint(0);
 for(let j=1;j<=160;j++){
  const hi=j/160,p=c.getPoint(hi);
  if(previous.y>=y&&p.y<=y){let a=(j-1)/160,b=hi;for(let n=0;n<22;n++){const t=(a+b)/2;if(c.getPoint(t).y>y)a=t;else b=t;}return(a+b)/2;}
  previous=p;
 }
 throw new Error('138 cannot locate a protected guide height '+y);
}
function heightPath(original,end){
 const t0=atY(original,PIN),T=1-t0,L=T*.30,e=.0001,p=original.getPoint(t0),a=original.getPoint(t0-e),b=original.getPoint(t0+e);
 const v0=-(b.y-a.y)/(2*e),a0=-(b.y-2*p.y+a.y)/(e*e),drop=PIN-end;
 const v1=(drop-v0*L*.5-a0*L*L/20)/(T-L*.5);
 if(!(v0>0&&v1>.10))throw new Error('138 height schedule would reverse');
 const IS=t=>t**6-3*t**5+2.5*t**4,IM=t=>t*t*.5-t**3+.75*t**4-.20*t**5;
 const value=t=>{
  if(t<=t0)return original.getPoint(t).y;
  const dt=t-t0,s=Math.min(1,dt/L),distance=v0*Math.min(dt,L)+(v1-v0)*L*IS(s)+a0*L*L*IM(s)+v1*Math.max(0,dt-L);
  return PIN-distance;
 };
 let minimumSpeed=Infinity;
 for(let k=0;k<=32;k++){const s=k/32,v=v0+(v1-v0)*S(s)+a0*L*s*(1-s)**3;minimumSpeed=Math.min(minimumSpeed,v);}
 if(!(minimumSpeed>.08))throw new Error('138 shoulder height speed is not positive');
 return{value,t0,tFull:atY(original,FULL),minimumSpeed,endError:Math.abs(value(1)-end)};
}
function triangleField(){
 const step=.075,cells=new Map();let count=0;
 const add=(a,b,c,label)=>{
  if(Math.min(a.x,b.x,c.x)>.10||Math.max(a.x,b.x,c.x)<-1.95||Math.min(a.y,b.y,c.y)>1.75||Math.max(a.y,b.y,c.y)<-1.45)return;
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-13)return;
  const t=[a.x,a.y,b.x,b.y,c.x,c.y,a.z,b.z,c.z,1/den,label];count++;
  for(let j=Math.floor(Math.min(a.y,b.y,c.y)/step);j<=Math.floor(Math.max(a.y,b.y,c.y)/step);j++)for(let i=Math.floor(Math.min(a.x,b.x,c.x)/step);i<=Math.floor(Math.max(a.x,b.x,c.x)/step);i++){
   const key=i+','+j;let row=cells.get(key);if(!row){row=[];cells.set(key,row);}row.push(t);
  }
 };
 return{add,get(x,y){const row=cells.get(Math.floor(x/step)+','+Math.floor(y/step));let z=-Infinity,label=null;if(!row)return null;for(const t of row){const u=((t[3]-t[5])*(x-t[4])+(t[4]-t[2])*(y-t[5]))*t[9],v=((t[5]-t[1])*(x-t[4])+(t[0]-t[4])*(y-t[5]))*t[9],w=1-u-v;if(Math.min(u,v,w)<-1e-8)continue;const q=u*t[6]+v*t[7]+w*t[8];if(q>z){z=q;label=t[10];}}return label===null?null:{z,label};},metrics:()=>({triangles:count,cells:cells.size})};
}
function garmentObstacles(blouse){
 if(!blouse?.isObject3D)throw new Error('138 requires the actual accepted blouse as read-only support');
 blouse.updateWorldMatrix(true,true);const inv=blouse.matrixWorld.clone().invert(),field=triangleField(),bc=Math.cos(.045),bs=Math.sin(.045);
 blouse.traverse(mesh=>{
  if(!mesh.isMesh||!/collar|facing|placket|button/.test(mesh.name))return;
  const m=new THREE.Matrix4().multiplyMatrices(inv,mesh.matrixWorld).elements,p=mesh.geometry.getAttribute('position'),idx=mesh.geometry.index;if(!p||!idx)return;
  const out=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),xx=m[0]*x+m[4]*y+m[8]*z+m[12],yy=m[1]*x+m[5]*y+m[9]*z+m[13],zz=m[2]*x+m[6]*y+m[10]*z+m[14];out.push(V(bc*xx-bs*(yy-1),1+bs*xx+bc*(yy-1),zz));}
  for(let i=0;i<idx.count;i+=3)field.add(out[idx.getX(i)],out[idx.getX(i+1)],out[idx.getX(i+2)],mesh.name);
 });
 return field;
}
function rawGrid(g,section){
 const p=new Float64Array(61*9*3);
 for(let j=0;j<=60;j++){
  const s=section(g,j/60),width=s.width??g.w;
  for(let k=0;k<=8;k++){const a=k*Math.PI/4,q=s.f.p.clone().addScaledVector(s.f.s,width*s.shape*Math.cos(a)*s.undulate).addScaledVector(s.f.n,s.inset+s.depth*s.shape*Math.sin(a));p.set([q.x,q.y,q.z],(j*9+k)*3);}
 }
 return p;
}
function gridNormal(p){
 const n=new Float64Array(p.length);
 const tri=(a,b,c)=>{const ab=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],ac=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]],v=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];for(const k of[a,b,c])for(let d=0;d<3;d++)n[k+d]+=v[d];};
 for(let j=0;j<60;j++)for(let k=0;k<8;k++){const a=(j*9+k)*3,c=a+27;tri(a,c,a+3);tri(a+3,c,c+3);}
 for(let j=0;j<=60;j++){const a=j*27,b=a+24;for(let k=0;k<3;k++)n[a+k]=n[b+k]=n[a+k]+n[b+k];}
 for(let i=0;i<n.length;i+=3){const l=Math.hypot(n[i],n[i+1],n[i+2])||1;n[i]/=l;n[i+1]/=l;n[i+2]/=l;}
 return n;
}
function sampleGrid(g,t,angle){
 const state=g.near138,p=state.grid,n=state.normals,u=((angle/TAU%1)+1)%1*8,v=clamp(t)*60,i=Math.min(7,Math.floor(u)),j=Math.min(59,Math.floor(v)),x=u-i,y=v-j,a=(j*9+i)*3,b=a+3,c=a+27,d=c+3;
 const ids=x+y<=1?[a,c,b]:[b,c,d],w=x+y<=1?[1-x-y,y,x]:[1-y,1-x,x+y-1],point=V(),normal=V();
 for(let k=0;k<3;k++){const q=ids[k],s=w[k];point.x+=s*p[q];point.y+=s*p[q+1];point.z+=s*p[q+2];normal.x+=s*n[q];normal.y+=s*n[q+1];normal.z+=s*n[q+2];}
 return{point,normal:normal.normalize()};
}

export function nearSection138(g,t){
 const s=g.near138,old=s.baseSection(s.original,t),p0=s.original.c.getPoint(t);
 if(p0.y>=PIN)return old;
 const weight=S((PIN-p0.y)/(PIN-FULL)),f=s.frame(g.c,t,g.front),y=f.p.y+HEAD_Y,span=s.family.widthAt(y),width=Math.max(.008,span*s.widthRatio),distance=y-s.endModel;
 const taper=.005+.995*S(distance/s.tipExtent),depth=Math.max(.0058,Math.min(.0165,width*(.38+.075*Math.sin(s.phase)))),shape=mix(old.shape,taper,weight);
 return{f,shape,root:old.root,depth:mix(old.depth,depth,weight),inset:old.inset,undulate:mix(old.undulate,1+.018*Math.sin((y-s.endModel)*3.1+s.phase),weight),width:mix(s.original.w,width,weight)};
}

export function prepareNearCurtain138(guides,baseSection,{enabled=false,contact,headShiftX=.26,blouse,frame,toModel}={}){
 if(!enabled)return OFF;
 if(enabled!==true&&enabled!==1)throw new Error('138 compares only off/on');
 if(guides.length!==276||!contact||Math.abs(contact.metrics.strength-.35)>1e-9||IDS.some(id=>!guides[id]?.original118)||guides.some(g=>g.near138))throw new Error('138 requires a fresh accepted 118.5/86.35 source');
 const started=performance.now(),collar=garmentObstacles(blouse),sides=triangleField(),bc=Math.cos(.045),bs=Math.sin(.045),families=FAMILIES.map((f,id)=>({...f,id,width:f.share*.91,x:spline(f.xy),zRows:null,zRaw:null,near:[]}));
 const supportCache=new Map();let clothQueries=0;
 const clothAt=(x,y)=>{const key=x.toFixed(5)+','+y.toFixed(5);if(supportCache.has(key))return supportCache.get(key);const bx=bc*x+bs*(y-1),by=-bs*x+bc*(y-1)+1,h=sampleBlouseFrontAtXY(bx,by);clothQueries++;const q=h?{z:h.point.z,nz:h.normal.z,weight:h.edgeWeight}:null;supportCache.set(key,q);return q;};
 const bodyRaw=(x,y,z)=>{let q=z;for(let i=0;i<10;i++)q=z-contact.atModel(x,y,q);return q;};
 for(let id=148;id<=159;id++){
  const g=guides[id],grid=rawGrid(g,baseSection),p=[];
  for(let i=0;i<grid.length;i+=3)p.push(toModel(V(grid[i],grid[i+1],grid[i+2]),g.deformEar));
  for(let j=0;j<60;j++)for(let k=0;k<8;k++){const a=j*9+k,c=a+9;sides.add(p[a],p[c],p[a+1],id);sides.add(p[a+1],p[c],p[c+1],id);}
 }
 let cursor=[58,133,172];
 for(const family of families){
  family.widthAt=y=>family.width*(.72+.30*Math.sin(Math.PI*clamp((1.30-y)/(1.30-family.end))));
  for(let layer=0;layer<3;layer++)for(let k=0;k<family.slots[layer];k++){
   const id=cursor[layer]++,g=guides[id],original={...g},count=family.slots[layer],lane=count===1?0:(k/(count-1)*2-1),phase=id*1.731+family.phase;
   const endModel=family.end+(layer===1?.17+.12*(.5+.5*Math.sin(phase)):layer===2?.04:0)+.043*Math.sin(phase*.73);
   const height=heightPath(original.c,endModel-HEAD_Y),state={id,family,original,baseSection,frame,layer,lane,phase,endModel,height,widthRatio:(layer===0?.64:layer===1?.42:.67)/Math.max(2,count-1)*(1+.20*Math.sin(phase*.53)),tipExtent:layer===1?.28:.30+.18*(.5+.5*Math.sin(phase*.71))};
   family.near.push(state);g.near138=state;
  }
 }
 if(cursor[0]!==91||cursor[1]!==139||cursor[2]!==200)throw new Error('138 source slots changed');
 const clearance=(family,y)=>.075+.042*(.5+.5*Math.sin((y+.55)*2.2+family.phase));
 for(const family of families){
  family.zRows=family.xy.map(([y,x],i)=>{
   if(i===0){const g=family.near[Math.floor(family.near.length/2)].original,p=g.c.getPoint(atY(g.c,PIN));return[y,p.z];}
   let z=-Infinity;
   for(const lane of[-.52,-.26,0,.26,.52]){
    const xx=x+lane*family.widthAt(y),body=clothAt(xx,y),leaf=collar.get(xx,y),side=sides.get(xx,y);
    if(body&&body.weight>.01)z=Math.max(z,body.z+clearance(family,y)/body.nz+.047);
    if(leaf)z=Math.max(z,leaf.z+.073);
    if(side&&side.z>.12)z=Math.max(z,side.z+.063);
   }
   if(!Number.isFinite(z))z=.74+.055*Math.sin(family.phase+y*1.1);
   z+=family.id>=4?.035*S((.30-y)/.7):0;
   return[y,bodyRaw(x,y,z)];
  });
  family.zRaw=spline(family.zRows);
 }
 for(const id of IDS){
  const g=guides[id],s=g.near138,original=s.original.c;
  g.c={debug:original.debug,getPoint(t){
   if(t<=s.height.t0)return original.getPoint(t);
   const y=s.height.value(t),Y=y+HEAD_Y,f=s.family,span=f.widthAt(Y),lane=s.lane;
   const drift=.030*Math.sin((1.25-Y)*2.1+s.phase)*Math.sin(Math.PI*clamp((1.40-Y)/(1.40-s.endModel)));
   const x=f.x(Y)+(lane*.40+drift)*span;
   const layerZ=s.layer===2?-.020-.008*Math.cos(lane*Math.PI):s.layer===1?.029:.009+.012*Math.cos(lane*Math.PI*.5);
   const z=f.zRaw(Y)+layerZ+.005*Math.sin(s.phase+(1.3-Y)*1.5),q=V(x-headShiftX,y,z);
   if(t>=s.height.tFull)return q;
   const p=original.getPoint(t),w=S((PIN-p.y)/(PIN-FULL));q.x=mix(p.x,q.x,w);q.z=mix(p.z,q.z,w);return q;
  },getTangent(t){if(t<=s.height.t0)return original.getTangent(t);return this.getPoint(Math.min(1,t+.00005)).sub(this.getPoint(Math.max(0,t-.00005))).normalize();}};
 }
 // Raise only the smooth family control values when a complete section needs
 // room. The six-node curve cannot follow individual cloth wrinkles.
 const corrections=[];let finalSamples=[];
 for(let pass=0;pass<3;pass++){
  const raises=families.map(f=>new Float64Array(f.zRows.length)),samples=[];
  for(const id of IDS){const g=guides[id],s=g.near138;for(let j=0;j<=60;j++){
   const t=j/60,sec=nearSection138(g,t);if(s.original.c.getPoint(t).y>=FULL)continue;
   for(const k of[0,1,3,4,5,6,7]){
    const a=k*Math.PI/4,p=sec.f.p.clone().addScaledVector(sec.f.s,sec.width*sec.shape*Math.cos(a)*sec.undulate).addScaledVector(sec.f.n,sec.inset+sec.depth*sec.shape*Math.sin(a)),m=toModel(p,g.deformEar),body=clothAt(m.x,m.y),leaf=collar.get(m.x,m.y),side=sides.get(m.x,m.y);
    const bodyGap=body?(m.z-body.z)*body.nz:null,leafGap=leaf?m.z-leaf.z:null,sideGap=side?m.z-side.z:null;
    samples.push({id,t,x:m.x,y:m.y,z:m.z,bodyGap,leafGap,sideGap,side:side?.label??null});
    let need=0;if(body&&body.weight>.01)need=Math.max(need,.061/body.nz-(m.z-body.z));if(leaf)need=Math.max(need,.032-(m.z-leaf.z));if(side&&side.z>.12)need=Math.max(need,.018-(m.z-side.z));
    if(need>.0005){const f=s.family,rows=f.zRows,Y=p.y+HEAD_Y;let n=0;while(n<rows.length-2&&Y<rows[n+1][0])n++;for(const index of[n,n+1])if(index>0)raises[f.id][index]=Math.max(raises[f.id][index],need/.86+.003);}
   }
  }}
  finalSamples=samples;let max=0;for(const a of raises)for(const v of a)max=Math.max(max,v);corrections.push({pass,maximumRawLift:max});
  if(max<.0005||pass===2)break;
  for(const f of families){for(let i=1;i<f.zRows.length;i++)f.zRows[i][1]+=raises[f.id][i];f.zRaw=spline(f.zRows);}
 }
 for(const id of IDS){const g=guides[id],s=g.near138;s.grid=rawGrid(g,nearSection138);s.normals=gridNormal(s.grid);}
 const quantiles=a=>{a=a.filter(Number.isFinite).sort((a,b)=>a-b);return{samples:a.length,min:a[0]??null,median:a[Math.floor(a.length*.5)]??null,p90:a[Math.floor(a.length*.9)]??null,max:a.at(-1)??null};};
 const metrics={version:VERSION,enabled:true,changed:true,selectedGuides:IDS.slice(),baseFibers:2191,attachedFibers:0,attachedFlyaways:0,protectedSourceY:PROTECTED,deformationPinY:PIN,fullJoinY:FULL,retainedContact:.35,second118Fit:false,extraDrawCalls:0,extraTextures:0,extraVertices:0,extraTriangles:0,families:families.map(f=>({name:f.name,slots:f.slots,width:f.width,end:f.end,xy:f.xy,zRows:f.zRows})),heightMinimumSpeed:Math.min(...IDS.map(id=>guides[id].near138.height.minimumSpeed)),heightEndError:Math.max(...IDS.map(id=>guides[id].near138.height.endError)),support:{clothQueries,cacheEntries:supportCache.size,garment:collar.metrics(),fixedSides:sides.metrics(),bodyGap:quantiles(finalSamples.map(p=>p.bodyGap)),leafGap:quantiles(finalSamples.map(p=>p.leafGap)),sideGap:quantiles(finalSamples.map(p=>p.sideGap)),failures:finalSamples.filter(p=>(p.bodyGap!==null&&p.bodyGap<0)||(p.leafGap!==null&&p.leafGap<0)||(p.sideGap!==null&&p.sideGap<-.003)).slice(0,12)},corrections,temporaryGridBytes:IDS.length*61*9*3*8*2,preparationMs:performance.now()-started};
 for(const id of IDS)guides[id].near138.metrics=metrics;
 return metrics;
}

function triangleEvents(at,angle){
 const u=t=>angle(t)/TAU*8,v=t=>at(t)*60,out=[0,1],bisect=(fn,a,b,target)=>{const rising=fn(b)>fn(a);for(let i=0;i<22;i++){const m=(a+b)*.5;if((fn(m)<target)===rising)a=m;else b=m;}return(a+b)*.5;};
 for(const fn of[u,v])for(let j=0;j<72;j++){
  const a=j/72,b=(j+1)/72,x=fn(a),y=fn(b),lo=Math.ceil(Math.min(x,y)+1e-10),hi=Math.floor(Math.max(x,y)-1e-10);
  for(let k=lo;k<=hi;k++)out.push(bisect(fn,a,b,k));
 }
 out.sort((a,b)=>a-b);const cuts=out.filter((t,i)=>i===0||t-out[i-1]>1e-9),diagonals=[];
 for(let j=0;j<cuts.length-1;j++){
  const a=cuts[j],b=cuts[j+1],m=(a+b)*.5,i=Math.floor(u(m)),row=Math.floor(v(m)),f=t=>u(t)-i+v(t)-row-1,fa=f(a+1e-11),fb=f(b-1e-11);
  if(fa*fb<0)diagonals.push(bisect(f,a,b,0));
 }
 return cuts.concat(diagonals).sort((a,b)=>a-b);
}
function transferCurve(g,legacy,sampler,at,angle,baselineSteps){
 const s=g.near138;
 let lastProtected=-1;for(let j=0;j<=baselineSteps;j++)if(legacy.getPoint(j/baselineSteps).y>=PROTECTED-.004)lastProtected=j;
 const fixedT=lastProtected<0?-1:Math.min(1,(lastProtected+1)/baselineSteps),pinY=fixedT<0?PIN:Math.min(PIN,legacy.getPoint(fixedT).y);
 const c={getPoint(t){const old=legacy.getPoint(t);if(t<=fixedT||old.y>=pinY)return old;const weight=S((pinY-old.y)/.18);return old.lerp(sampler(t),weight);},getTangent(t){const old=legacy.getPoint(t);if(t<=fixedT||old.y>=pinY)return legacy.getTangent(t);return this.getPoint(Math.min(1,t+.00005)).sub(this.getPoint(Math.max(0,t-.00005))).normalize();}};
 c.parameters138=steps=>{
  if(steps!==baselineSteps)throw Error('138 fine source sampling changed');
  const old=Array.from({length:steps+1},(_,j)=>j/steps),events=triangleEvents(at,angle).filter(t=>t>fixedT+1e-9&&t>0&&t<1),all=old.concat(events).sort((a,b)=>a-b),cuts=all.filter((t,i)=>i===0||t-all[i-1]>1e-5),out=[0];if(cuts.at(-1)!==1){if(1-cuts.at(-1)<1e-5)cuts.pop();cuts.push(1);}
  const refine=(a,b,pa,pb,depth)=>{if(a<fixedT-1e-9){out.push(b);return;}const m=(a+b)*.5,p=c.getPoint(m),chord=pa.clone().lerp(pb,.5);if(depth<4&&Math.hypot(p.x-chord.x,p.y-chord.y,p.z-chord.z)>.00055){refine(a,m,pa,p,depth+1);refine(m,b,p,pb,depth+1);}else out.push(b);};
  for(let j=0;j<cuts.length-1;j++)refine(cuts[j],cuts[j+1],c.getPoint(cuts[j]),c.getPoint(cuts[j+1]),0);
  c.extraVertices138=(out.length-steps-1)*2;return out;
 };
 c.recordRange138=(from,samples)=>{
  const m=s.metrics,extra=c.extraVertices138,oldFrom=from-m.extraVertices;
  (m.fineRanges??=[]).push({guide:s.id,oldFrom,newFrom:from,oldCount:(baselineSteps+1)*2,newCount:samples.length*2,protectedPrefix:Math.min(baselineSteps+1,lastProtected+1)*2});
  m.extraVertices+=extra;m.extraTriangles+=extra;m.extraGeometryBytes=m.extraVertices*44+m.extraTriangles*12;
 };
 return c;
}
export function attachNearFiber138(g,legacy,{lane,side,phase,end}){
 if(!g.near138)return legacy;
 g.near138.metrics.attachedFibers++;
 const at=t=>t*end,angle=t=>Math.acos(clamp(lane,-1,1))*(side>0?1:-1)+.018*Math.sin(t*11+phase);
 return transferCurve(g,legacy,t=>{
  const q=sampleGrid(g,at(t),angle(t));
  return q.point.addScaledVector(q.normal,.0018*(.3+.7*S(t/.12)));
 },at,angle,28);
}
export function attachNearFlyaway138(g,legacy,parameters,phase){
 if(!g.near138)return legacy;
 g.near138.metrics.attachedFlyaways++;
 const at=t=>{const v=clamp(t)*(parameters.length-1),i=Math.min(parameters.length-2,Math.floor(v));return mix(parameters[i],parameters[i+1],S(v-i));},angle=t=>(Math.cos(phase)>0?0:Math.PI)+.08*Math.sin(t*Math.PI);
 return transferCurve(g,legacy,t=>{
  const q=sampleGrid(g,at(t),angle(t));
  return q.point.addScaledVector(q.normal,.009+.014*Math.sin(t*Math.PI));
 },at,angle,24);
}

export function nearCurtainRawVertex138(g,j,k){
 const p=g.near138.grid,i=(j*9+k)*3;return V(p[i],p[i+1],p[i+2]);
}
