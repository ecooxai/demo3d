import * as THREE from 'three';
import { CURTAIN143_COEFFICIENTS } from '../review/near-curtain143-coefficients.js';

// Isolated143. The common field is prepared offline against accepted geometry.
// Native construction only evaluates that field and the same existing86 stage.
const VERSION='continuous-near-curtain-143-v1';
const HEAD_Y=2.95,PIN=-2.15,FULL=-2.90,PROTECTED=-1.05,TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const S=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
const mix=(a,b,t)=>a+(b-a)*t;
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const IDS=[...Array.from({length:33},(_,k)=>58+k),...Array.from({length:6},(_,k)=>133+k),...Array.from({length:28},(_,k)=>172+k)];
const selected=new Set(IDS);
const OFF=Object.freeze({version:VERSION,enabled:false,changed:false});
export const CURTAIN143_SPEC=Object.freeze({version:VERSION,headTilt:-.17,headShiftX:.26,headY:HEAD_Y,headYaw:.16,guidePlacement:.5,contact:.35,pin:PIN,full:FULL,protectedY:PROTECTED,selectedGuides:IDS.slice(),baseFibers:2191,fieldTop:1.10,fieldBottom:-1.35});

function bernstein5(t){const s=1-t;return[s**5,5*t*s**4,10*t*t*s**3,10*t**3*s*s,5*t**4*s,t**5];}
function bezier(c,t){const b=bernstein5(clamp(t));let v=0;for(let i=0;i<6;i++)v+=b[i]*c[i];return v;}
function atY(c,y){
 let a=0,b=1;if(c.getPoint(a).y<y||c.getPoint(b).y>y)throw Error('143 entry height is outside a guide');
 for(let j=0;j<34;j++){const t=(a+b)*.5;if(c.getPoint(t).y>y)a=t;else b=t;}return(a+b)*.5;
}
function quintic(a,b,da,db,aa,ab,h){
 const c0=a,c1=da*h,c2=aa*h*h*.5,A=b-c0-c1-c2,B=db*h-c1-2*c2,C=ab*h*h-2*c2;
 return[c0,c1,c2,10*A-4*B+.5*C,-15*A+7*B-C,6*A-3*B+.5*C];
}
const polynomial=(c,t)=>c[0]+t*(c[1]+t*(c[2]+t*(c[3]+t*(c[4]+t*c[5]))));

// Shared, monotone physical-height boundary curves. Unequal flow controls
// influence the whole curtain continuously; no guide is assigned a bundle.
const OUTLINE=[
 [1.80,-.58,-.79],[1.40,-.42,-.99],[.95,-.39,-1.13],
 [.48,-.51,-1.29],[.02,-.74,-1.51],[-.38,-.94,-1.62],
 [-.72,-.86,-1.47],[-1.08,-.55,-1.12],[-1.35,-.39,-.89]
];
function smoothCurve(rows){
 const r=rows.slice().sort((a,b)=>a[0]-b[0]),n=r.length,d=new Float64Array(n),aa=new Float64Array(n),segments=[];
 for(let i=0;i<n;i++){if(i===0)d[i]=(r[1][1]-r[0][1])/(r[1][0]-r[0][0]);else if(i===n-1)d[i]=(r[i][1]-r[i-1][1])/(r[i][0]-r[i-1][0]);else{const l=(r[i][1]-r[i-1][1])/(r[i][0]-r[i-1][0]),rr=(r[i+1][1]-r[i][1])/(r[i+1][0]-r[i][0]);d[i]=(r[i+1][1]-r[i-1][1])/(r[i+1][0]-r[i-1][0]);aa[i]=2*(rr-l)/(r[i+1][0]-r[i-1][0]);}}
 for(let i=0;i<n-1;i++)segments.push(quintic(r[i][1],r[i+1][1],d[i],d[i+1],aa[i],aa[i+1],r[i+1][0]-r[i][0]));
 return y=>{if(y<=r[0][0])return r[0][1]+d[0]*(y-r[0][0]);if(y>=r[n-1][0])return r[n-1][1]+d[n-1]*(y-r[n-1][0]);let i=0;while(i<n-2&&y>r[i+1][0])i++;return polynomial(segments[i],(y-r[i][0])/(r[i+1][0]-r[i][0]));};
}
const innerOutline=smoothCurve(OUTLINE.map(([y,x])=>[y,x])),outerOutline=smoothCurve(OUTLINE.map(([y,x,z])=>[y,z]));
export function lateral143(q,Y){
 q=clamp(q);const h=1.4-Y,c=[0,.15+.016*Math.sin(h*2.5+.1),.35+.020*Math.sin(h*2.1+1.1),.61+.021*Math.sin(h*2.8+2),.85+.015*Math.sin(h*1.8+.6),1],shifts=[-.02,.060,.065,-.02,-.07,-.07],release=S((.45-Y)/.70);
 const x=c.map((u,i)=>{const y=Y+shifts[i]*release,inner=innerOutline(y),outer=outerOutline(y);return inner+(outer-inner)*u;});
 return bezier(x,q);
}
export function field143(data,q,Y){
 const bq=bernstein5(clamp(q)),by=bernstein5(clamp((CURTAIN143_SPEC.fieldTop-Y)/(CURTAIN143_SPEC.fieldTop-CURTAIN143_SPEC.fieldBottom)));let z=0;
 for(let j=0;j<6;j++)for(let i=0;i<6;i++)z+=bq[i]*by[j]*data.z[j*6+i];
 return V(lateral143(q,Y)-.26,Y-HEAD_Y,z);
}
const targetEnd=q=>-.77-.34*Math.exp(-(((q-.27)/.25)**2))-.20*Math.exp(-(((q-.78)/.19)**2));
function layerPoint(data,s,q,Y){
 const p=field143(data,q,Y),loose=S((.18-Y)/.65);
 if(s.layer===0)p.z+=.025+.008*Math.sin(q*7.7+Y*.65);
 else if(s.layer===2)p.z-=.040+.004*Math.cos(q*5.3);
 else{p.x+=.030*Math.sin((.25-Y)*2.1+s.phase)*loose;p.z+=.038+.028*Math.sin((.10-Y)*1.5+s.phase*.43)*loose;}
 return p;
}
function heightState(original,end){
 const t0=atY(original,FULL),T=1-t0,L=T*.30,e=.0001,p=original.getPoint(t0),a=original.getPoint(t0-e),b=original.getPoint(t0+e),v0=-(b.y-a.y)/(2*e),a0=-(b.y-2*p.y+a.y)/(e*e),drop=FULL-end;
 const v1=(drop-v0*L*.5-a0*L*L/20)/(T-L*.5);
 const IS=t=>t**6-3*t**5+2.5*t**4,IM=t=>t*t*.5-t**3+.75*t**4-.20*t**5;
 const value=t=>{if(t<=t0)return original.getPoint(t).y;const dt=t-t0,s=Math.min(1,dt/L),dist=v0*Math.min(dt,L)+(v1-v0)*L*IS(s)+a0*L*L*IM(s)+v1*Math.max(0,dt-L);return FULL-dist;};
 let minimumSpeed=Infinity;for(let k=0;k<=32;k++){const s=k/32;minimumSpeed=Math.min(minimumSpeed,v0+(v1-v0)*S(s)+a0*L*s*(1-s)**3);}
 if(!(minimumSpeed>.08))throw Error('143 height schedule reverses');return{value,t0,minimumSpeed,endError:Math.abs(value(1)-end)};
}
function entryJet(original){
 const e=.002,a=original.getPoint(atY(original,PIN-e)),p=original.getPoint(atY(original,PIN)),b=original.getPoint(atY(original,PIN+e));
 return{p,d:b.clone().sub(a).multiplyScalar(.5/e),a:b.clone().addScaledVector(a,1).addScaledVector(p,-2).multiplyScalar(1/(e*e))};
}
function pointAtHeight(s,y,acceptedPoint=null){
 if(y<=FULL)return layerPoint(s.data,s,s.q,y+HEAD_Y);
 if(s.data.joinMode==='delay-depth'){
  const old=acceptedPoint??s.original.c.getPoint(atY(s.original.c,y)),zPin=s.data.depthPin??-2.60,w=S((zPin-y)/(zPin-FULL)),target=layerPoint(s.data,s,s.q,y+HEAD_Y);
  return V(polynomial(s.joinX,clamp((y-PIN)/(FULL-PIN))),y,mix(old.z,target.z,w));
 }
 const u=clamp((y-PIN)/(FULL-PIN)),peak=s.data.joinPeak??.34,release=S(u/peak)*(1-S((u-peak)/(1-peak))),lift=s.data.joinZ?bezier(s.data.joinZ,s.q)*release:0;
 return V(polynomial(s.joinX,u),y,polynomial(s.joinZ,u)+lift);
}
export function nearSection143(g,t){
 const s=g.near143,old=s.baseSection(s.original,t),p0=s.original.c.getPoint(t);
 if(p0.y>=PIN)return old;
 const p=g.c.getPoint(t),Y=p.y+HEAD_Y,w=S((PIN-p.y)/(PIN-FULL)),d=g.c.getTangent(t).normalize(),e=.0005;
 const pa=layerPoint(s.data,s,clamp(s.q-e),Y),pb=layerPoint(s.data,s,clamp(s.q+e),Y),along=pb.sub(pa),arc=Math.sqrt(along.lengthSq())/Math.max(1e-8,Math.min(1,s.q+e)-Math.max(0,s.q-e));
 let side=along.addScaledVector(d,-along.dot(d));if(side.lengthSq()<1e-8)side=old.f.s.clone();else side.normalize();
 side=old.f.s.clone().lerp(side,w).addScaledVector(d,-old.f.s.clone().lerp(side,w).dot(d)).normalize();const n=side.clone().cross(d).normalize(),f={p,d,s:side,n};
 const spacing=arc/(s.layer===2?28:32),wide=s.layer===0?clamp(spacing*(.83+.07*Math.sin(s.q*8.3)),.023,.039):s.layer===2?clamp(spacing*.96,.030,.052):clamp(spacing*.70,.020,.032);
 const distance=Y-s.endModel,taper=.004+.996*S(distance/s.tipExtent),shape=mix(old.shape,taper,w);
 return{f,shape,root:old.root,depth:s.original.d,inset:old.inset,undulate:mix(old.undulate,1+.014*Math.sin(Y*2.7+s.q*6.1),w),width:mix(s.original.w,wide,w)};
}

export function prepareNearCurtain143(guides,baseSection,{enabled=false,contact,headShiftX=.26,headTilt=-.17,frame,toModel}={}){
 if(!enabled)return OFF;
 const data=CURTAIN143_COEFFICIENTS;
 if((enabled!==true&&enabled!==1)||!data||data.version!==VERSION||!Array.isArray(data.z)||data.z.length!==36||data.z.some(x=>!Number.isFinite(x)))throw Error('143 needs frozen valid field coefficients and off/on selection');
 if(data.joinZ&&(!Array.isArray(data.joinZ)||data.joinZ.length!==6||data.joinZ.some(x=>!Number.isFinite(x))))throw Error('143 common transition controls are invalid');
 if(data.joinPeak!==undefined&&!(data.joinPeak>.05&&data.joinPeak<.95))throw Error('143 transition peak is invalid');
 if(headTilt!==-.17||headShiftX!==.26||guides.length!==276||contact?.metrics.strength!==.35||IDS.some(id=>!guides[id]?.original118)||guides.some(g=>g.near143))throw Error('143 source/pose or single118/86 ownership differs');
 const started=performance.now();
 for(const id of IDS){
  const g=guides[id],original={...g},layer=id<91?0:id<139?1:2,q=layer===0?(id-58)/32:layer===2?(id-172+.5)/28:[.12,.33,.51,.69,.86,.96][id-133],phase=id*1.731;
  const endModel=targetEnd(q)+(layer===2?.075+.020*Math.sin(phase*.61):layer===1?.15+.055*Math.sin(phase*.73):.025*Math.sin(phase*.71)),height=heightState(original.c,endModel-HEAD_Y),jet=entryJet(original.c);
  const s={id,q,phase,layer,original,baseSection,frame,data,endModel,height,tPin:atY(original.c,PIN),tipExtent:layer===1?.27:layer===2?.24:.30+.045*Math.sin(q*6.4),metrics:null};
  const e=.001,p=layerPoint(data,s,q,FULL+HEAD_Y),a=layerPoint(data,s,q,FULL+HEAD_Y-e),b=layerPoint(data,s,q,FULL+HEAD_Y+e),d=b.clone().sub(a).multiplyScalar(.5/e),acc=b.clone().addScaledVector(a,1).addScaledVector(p,-2).multiplyScalar(1/(e*e)),h=FULL-PIN;
  s.joinX=quintic(jet.p.x,p.x,jet.d.x,d.x,jet.a.x,acc.x,h);s.joinZ=quintic(jet.p.z,p.z,jet.d.z,d.z,jet.a.z,acc.z,h);
  g.near143=s;g.c={debug:original.c.debug,getPoint(t){if(t<=s.tPin)return original.c.getPoint(t);return pointAtHeight(s,height.value(t),original.c.getPoint(t));},getTangent(t){if(t<=s.tPin)return original.c.getTangent(t);return this.getPoint(Math.min(1,t+.00005)).sub(this.getPoint(Math.max(0,t-.00005))).normalize();}};
 }
 for(const id of IDS){const g=guides[id],s=g.near143;s.grid=rawGrid(g,nearSection143);s.normals=gridNormal(s.grid);}
 const metrics={version:VERSION,enabled:true,changed:true,selectedGuides:IDS.slice(),baseFibers:2191,attachedFibers:0,attachedFlyaways:0,protectedSourceY:PROTECTED,deformationPinY:PIN,fullJoinY:FULL,retainedContact:.35,second118Fit:false,extraDrawCalls:0,extraTextures:0,extraVertices:0,extraTriangles:0,coefficientFingerprint:data.fingerprint??'source-preparation',coefficientCount:36,fieldSpecification:data.specification??null,heightMinimumSpeed:Math.min(...IDS.map(id=>guides[id].near143.height.minimumSpeed)),heightEndError:Math.max(...IDS.map(id=>guides[id].near143.height.endError)),temporaryGridBytes:IDS.length*61*9*3*8*2,preparationMs:performance.now()-started};
 for(const id of IDS)guides[id].near143.metrics=metrics;return metrics;
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
 const state=g.near143,p=state.grid,n=state.normals,u=((angle/TAU%1)+1)%1*8,v=clamp(t)*60,i=Math.min(7,Math.floor(u)),j=Math.min(59,Math.floor(v)),x=u-i,y=v-j,a=(j*9+i)*3,b=a+3,c=a+27,d=c+3;
 const ids=x+y<=1?[a,c,b]:[b,c,d],w=x+y<=1?[1-x-y,y,x]:[1-y,1-x,x+y-1],point=V(),normal=V();
 for(let k=0;k<3;k++){const q=ids[k],s=w[k];point.x+=s*p[q];point.y+=s*p[q+1];point.z+=s*p[q+2];normal.x+=s*n[q];normal.y+=s*n[q+1];normal.z+=s*n[q+2];}
 return{point,normal:normal.normalize()};
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
 const s=g.near143;
 let lastProtected=-1;for(let j=0;j<=baselineSteps;j++)if(legacy.getPoint(j/baselineSteps).y>=PROTECTED-.004)lastProtected=j;
 const fixedT=lastProtected<0?-1:Math.min(1,(lastProtected+1)/baselineSteps),pinY=fixedT<0?PIN:Math.min(PIN,legacy.getPoint(fixedT).y);
 const c={getPoint(t){const old=legacy.getPoint(t);if(t<=fixedT||old.y>=pinY)return old;const weight=S((pinY-old.y)/.18);return old.lerp(sampler(t),weight);},getTangent(t){const old=legacy.getPoint(t);if(t<=fixedT||old.y>=pinY)return legacy.getTangent(t);return this.getPoint(Math.min(1,t+.00005)).sub(this.getPoint(Math.max(0,t-.00005))).normalize();}};
 c.parameters143=steps=>{
  if(steps!==baselineSteps)throw Error('143 fine source sampling changed');
  const old=Array.from({length:steps+1},(_,j)=>j/steps),events=triangleEvents(at,angle).filter(t=>t>fixedT+1e-9&&t>0&&t<1),all=old.concat(events).sort((a,b)=>a-b),cuts=all.filter((t,i)=>i===0||t-all[i-1]>1e-5),out=[0];if(cuts.at(-1)!==1){if(1-cuts.at(-1)<1e-5)cuts.pop();cuts.push(1);}
  const refine=(a,b,pa,pb,depth)=>{if(a<fixedT-1e-9){out.push(b);return;}const m=(a+b)*.5,p=c.getPoint(m),chord=pa.clone().lerp(pb,.5);if(depth<4&&Math.hypot(p.x-chord.x,p.y-chord.y,p.z-chord.z)>.00055){refine(a,m,pa,p,depth+1);refine(m,b,p,pb,depth+1);}else out.push(b);};
  for(let j=0;j<cuts.length-1;j++)refine(cuts[j],cuts[j+1],c.getPoint(cuts[j]),c.getPoint(cuts[j+1]),0);
  c.extraVertices143=(out.length-steps-1)*2;return out;
 };
 c.recordRange143=(from,samples)=>{
  const m=s.metrics,extra=c.extraVertices143,oldFrom=from-m.extraVertices;
  (m.fineRanges??=[]).push({guide:s.id,oldFrom,newFrom:from,oldCount:(baselineSteps+1)*2,newCount:samples.length*2,protectedPrefix:Math.min(baselineSteps+1,lastProtected+1)*2});
  m.extraVertices+=extra;m.extraTriangles+=extra;m.extraGeometryBytes=m.extraVertices*44+m.extraTriangles*12;
 };
 return c;
}
export function attachNearFiber143(g,legacy,{lane,side,phase,end}){
 if(!g.near143)return legacy;
 g.near143.metrics.attachedFibers++;
 const at=t=>t*end,angle=t=>Math.acos(clamp(lane,-1,1))*(side>0?1:-1)+.018*Math.sin(t*11+phase);
 return transferCurve(g,legacy,t=>{
  const q=sampleGrid(g,at(t),angle(t));
  return q.point.addScaledVector(q.normal,.0018*(.3+.7*S(t/.12)));
 },at,angle,28);
}
export function attachNearFlyaway143(g,legacy,parameters,phase){
 if(!g.near143)return legacy;
 g.near143.metrics.attachedFlyaways++;
 const at=t=>{const v=clamp(t)*(parameters.length-1),i=Math.min(parameters.length-2,Math.floor(v));return mix(parameters[i],parameters[i+1],S(v-i));},angle=t=>(Math.cos(phase)>0?0:Math.PI)+.08*Math.sin(t*Math.PI);
 return transferCurve(g,legacy,t=>{
  const q=sampleGrid(g,at(t),angle(t));
  return q.point.addScaledVector(q.normal,.009+.014*Math.sin(t*Math.PI));
 },at,angle,24);
}

export function nearCurtainRawVertex143(g,j,k){
 const p=g.near143.grid,i=(j*9+k)*3;return V(p[i],p[i+1],p[i+2]);
}
