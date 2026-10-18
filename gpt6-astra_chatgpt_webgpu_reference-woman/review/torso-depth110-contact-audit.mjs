import fs from 'node:fs';
import assert from 'node:assert/strict';
import {THREE,Attr,Matrix4,I,mul,T,RY,RZ,point,object,attach,read,sha} from './torso-depth110-harness.mjs';

// Exact current source positions and accepted99 first. This tests triangle
// interpolation separately from the analytic field's global monotonicity.
const sourceFiles={candidate:'review/torso-depth-candidate110.js',hair:'src/hair-groom.js',cloth:'src/blouse.js',contact:'src/hair-contact.js',balance:'src/portrait-balance.js'};
const sources=Object.fromEntries(Object.entries(sourceFiles).map(([k,p])=>[k,{file:p,text:fs.readFileSync(p,'utf8')}]));
const {fieldAt}=new Function('Matrix4',read(sourceFiles.candidate)+'\nreturn {fieldAt};')(Matrix4);
const balance=new Function('Matrix4',read(sourceFiles.balance)+'\nreturn applyPortraitBalance;')(Matrix4);
const c=new Function('THREE',read(sourceFiles.cloth)+'\nreturn {surface,clothGeometry,torsoPoint,collarPoint,facingPoint,solidifyGrid,placketX,bodyAtXY,broadenShoulders,sampleBlouseFrontAtXY};')(THREE);
const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
const contact=new Function('sampleBlouseFrontAtXY',read(sourceFiles.contact)+'\nreturn createHairContact;')(c.sampleBlouseFrontAtXY);
const createHair=new Function('THREE','faceZ','createHairContact',read(sourceFiles.hair)+'\nreturn createGroomHair;')(THREE,faceZ,contact);
const H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17))),B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0)));
const started=performance.now(),cpuStart=process.cpuUsage();

// Independent separable basis: F=front*f+rear*r, where r is negative.
const s=t=>t*t*t*(t*(t*6-15)+10),tmp=new Float64Array(2),check=new Float64Array(4);
function basis(y,z,out){
 if(y<=-1.28||y>=1.6){out[0]=out[1]=0;return;}
 const w=y<-.10?s((y+1.28)/1.18):y>.10?1-s((y-.10)/1.50):1;
 out[0]=w*Math.exp(-(((z-.75)/.54)**2));out[1]=-w*Math.exp(-(((z+.55)/.54)**2));
}
const presets=[{strength:.5,front:.18,rear:.05},{strength:1,front:.24,rear:.08}];
let formulaChecks=0,maxFormulaDifference=0;
function convert(mesh,name){
 const p=mesh.geometry.getAttribute('position'),positions=new Float64Array(p.count*3),front=new Float64Array(p.count),rear=new Float64Array(p.count),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<p.count;i++){
  const q=point(mesh.matrixWorld,[p.getX(i),p.getY(i),p.getZ(i)]);positions.set(q,i*3);basis(q[1],q[2],tmp);front[i]=tmp[0];rear[i]=tmp[1];
  if(i%251===0){fieldAt(q[1],q[2],.24,.08,check);maxFormulaDifference=Math.max(maxFormulaDifference,Math.abs(check[0]-(.24*tmp[0]+.08*tmp[1])));formulaChecks++;}
  for(let k=0;k<3;k++){assert(Number.isFinite(q[k]));min[k]=Math.min(min[k],q[k]);max[k]=Math.max(max[k],q[k]);}
 }
 return{name,positions,front,rear,index:mesh.geometry.index.array,bounds:{min,max}};
}
function approximation(mesh){
 const {positions:p,front:f,rear:r,index:idx}=mesh,stats=presets.map(v=>({...v,maxEdgeMidpointError:0,maxCentroidError:0,edgeIncidencesAbovePoint001:0,centroidsAbovePoint001:0,worstEdge:null,worstCentroid:null}));
 for(let k=0;k<idx.length;k+=3){
  const ia=idx[k],ib=idx[k+1],ic=idx[k+2];
  for(let edge=0;edge<3;edge++){
   const i=edge===0?ia:edge===1?ib:ic,j=edge===0?ib:edge===1?ic:ia,y=(p[i*3+1]+p[j*3+1])*.5,z=(p[i*3+2]+p[j*3+2])*.5;
   basis(y,z,tmp);const ef=(f[i]+f[j])*.5-tmp[0],er=(r[i]+r[j])*.5-tmp[1];
   for(const row of stats){const error=Math.abs(row.front*ef+row.rear*er);if(error>.001)row.edgeIncidencesAbovePoint001++;if(error>row.maxEdgeMidpointError){row.maxEdgeMidpointError=error;row.worstEdge={triangle:k/3,edge:[i,j],point:[(p[i*3]+p[j*3])*.5,y,z]};}}
  }
  const y=(p[ia*3+1]+p[ib*3+1]+p[ic*3+1])/3,z=(p[ia*3+2]+p[ib*3+2]+p[ic*3+2])/3;
  basis(y,z,tmp);const ef=(f[ia]+f[ib]+f[ic])/3-tmp[0],er=(r[ia]+r[ib]+r[ic])/3-tmp[1];
  for(const row of stats){const error=Math.abs(row.front*ef+row.rear*er);if(error>.001)row.centroidsAbovePoint001++;if(error>row.maxCentroidError){row.maxCentroidError=error;row.worstCentroid={triangle:k/3,point:[(p[ia*3]+p[ib*3]+p[ic*3])/3,y,z]};}}
 }
 return{vertices:p.length/3,triangles:idx.length/3,bounds:mesh.bounds,edgeIncidences:idx.length,centroids:idx.length/3,presets:stats};
}

// X/Y ray positions are invariant. Store every triangle hit in typed linked
// arrays rather than allocating one JS object per potential collision.
const grid={xMin:-2.25,xMax:2.25,yMin:-1.55,yMax:1.65,nx:164,ny:128};grid.dx=(grid.xMax-grid.xMin)/grid.nx;grid.dy=(grid.yMax-grid.yMin)/grid.ny;
const rayCount=grid.nx*grid.ny;
class Hits{
 constructor(){this.head=new Int32Array(rayCount).fill(-1);this.z=new Float64Array(8192);this.f=new Float64Array(8192);this.r=new Float64Array(8192);this.tri=new Int32Array(8192);this.next=new Int32Array(8192);this.count=0;}
 add(ray,z,f,r,tri){if(this.count===this.z.length)for(const k of['z','f','r','tri','next']){const a=new this[k].constructor(this[k].length*2);a.set(this[k]);this[k]=a;}const i=this.count++;this.z[i]=z;this.f[i]=f;this.r[i]=r;this.tri[i]=tri;this.next[i]=this.head[ray];this.head[ray]=i;}
}
function rasterize(mesh){
 const {positions:p,front:f,rear:r,index:idx}=mesh,hits=new Hits(),maxError=[0,0];let edgeOn=0;
 for(let k=0;k<idx.length;k+=3){
  const ia=idx[k],ib=idx[k+1],ic=idx[k+2],a=ia*3,b=ib*3,c=ic*3,ax=p[a],ay=p[a+1],bx=p[b],by=p[b+1],cx=p[c],cy=p[c+1],den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
  if(Math.abs(den)<1e-12){edgeOn++;continue;}
  const xlo=Math.max(0,Math.ceil((Math.min(ax,bx,cx)-grid.xMin)/grid.dx-.5)),xhi=Math.min(grid.nx-1,Math.floor((Math.max(ax,bx,cx)-grid.xMin)/grid.dx-.5)),ylo=Math.max(0,Math.ceil((Math.min(ay,by,cy)-grid.yMin)/grid.dy-.5)),yhi=Math.min(grid.ny-1,Math.floor((Math.max(ay,by,cy)-grid.yMin)/grid.dy-.5));
  for(let yi=ylo;yi<=yhi;yi++)for(let xi=xlo;xi<=xhi;xi++){
   const x=grid.xMin+(xi+.5)*grid.dx,y=grid.yMin+(yi+.5)*grid.dy,u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den,w=1-u-v;
   if(Math.min(u,v,w)<-1e-8)continue;
   const z=u*p[a+2]+v*p[b+2]+w*p[c+2],ff=u*f[ia]+v*f[ib]+w*f[ic],rr=u*r[ia]+v*r[ib]+w*r[ic];
   basis(y,z,tmp);for(let i=0;i<presets.length;i++)maxError[i]=Math.max(maxError[i],Math.abs(presets[i].front*(ff-tmp[0])+presets[i].rear*(rr-tmp[1])));
   hits.add(yi*grid.nx+xi,z,ff,rr,k/3);
  }
 }
 return{hits,metrics:{name:mesh.name,triangleHits:hits.count,skippedEdgeOn:edgeOn,maximumHitInterpolationErrorByPreset:maxError}};
}
function order(a,b,{self=false,excludeSameGuide=false,label}){
 const stats=presets.map(v=>({...v,anyReversals:0,reversalsAbovePoint001:0,maximumReversal:0,minimumGapAfter:Infinity,minimumExactGapAfter:Infinity,maximumGapReduction:0,worst:null}));
 let overlappingRays=0,pairs=0,closePairs=0,minBefore=Infinity;
 for(let ray=0;ray<rayCount;ray++){
  if(a.head[ray]<0||b.head[ray]<0)continue;overlappingRays++;
  const y=grid.yMin+(Math.floor(ray/grid.nx)+.5)*grid.dy;
  for(let i=a.head[ray];i>=0;i=a.next[i])for(let j=self?a.next[i]:b.head[ray];j>=0;j=b.next[j]){
   if(excludeSameGuide&&Math.floor(a.tri[i]/960)===Math.floor(b.tri[j]/960))continue;
   const signed=a.z[i]-b.z[j],gap=Math.abs(signed);if(gap<.003)continue;
   pairs++;if(gap<.03)closePairs++;minBefore=Math.min(minBefore,gap);const sign=Math.sign(signed),df=sign*(a.f[i]-b.f[j]),dr=sign*(a.r[i]-b.r[j]);
   basis(y,a.z[i],tmp);const af=tmp[0],ar=tmp[1];basis(y,b.z[j],tmp);const ef=sign*(af-tmp[0]),er=sign*(ar-tmp[1]);
   for(const row of stats){
    const after=gap+row.front*df+row.rear*dr,exact=gap+row.front*ef+row.rear*er;row.minimumGapAfter=Math.min(row.minimumGapAfter,after);row.minimumExactGapAfter=Math.min(row.minimumExactGapAfter,exact);row.maximumGapReduction=Math.max(row.maximumGapReduction,gap-after);
    if(after<0)row.anyReversals++;if(after<-.001)row.reversalsAbovePoint001++;
    if(-after>row.maximumReversal){row.maximumReversal=-after;row.worst={rayX:grid.xMin+(ray%grid.nx+.5)*grid.dx,rayY:y,aTriangle:a.tri[i],bTriangle:b.tri[j],aZ:a.z[i],bZ:b.z[j],originalGap:gap,after,continuousAfter:exact};}
   }
  }
 }
 assert(pairs>0,`No source triangle pairs for ${label}.`);
 return{label,overlappingRays,eligiblePairs:pairs,closePairsBelowPoint03:closePairs,minimumOriginalGap:minBefore,requiredGap:.003,excludeSameGuide,presets:stats};
}

const model=object('source-contact-model'),hair=createHair({headShiftX:.26,shoulderContact:.35}),garment=new THREE.Group(),pieces=[];
for(const m of hair.children)attach(model,m.name,m.geometry,H,m.material);
const add=(name,g)=>{const mesh=new THREE.Mesh(g,{});mesh.name=name;garment.add(mesh);pieces.push(mesh);};
add('cloth',c.clothGeometry());
for(const side of[-1,1]){const g=c.surface(24,48,(u,v)=>c.collarPoint(side,u,v));if(side<0){for(let i=0;i<g.index.count;i+=3){const b=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,b);}g.computeVertexNormals();}add(`collar-${side}`,c.solidifyGrid(g,24,48,.0045));add(`facing-${side}`,c.surface(8,48,(u,v)=>c.facingPoint(side,u,v)));}
add('placket',c.solidifyGrid(c.surface(10,74,(u,v)=>{const y=.780+(-1.45-.780)*v,x=c.placketX(y)+(u-.5)*(.174+.014*v),p=c.bodyAtXY(x,y);return[x,y,p[2]+.007+.006*Math.sin(u*Math.PI)**.7];}),10,74,.0045));
c.broadenShoulders(garment);for(const m of pieces)attach(model,m.name,m.geometry,B,m.material);
balance(model,{shiftX:-.24});
const meshes=[];for(let k=0;k<model.children.length;k++){
 const m=model.children[k],name=k===0?'CROWN':k===1?'MASS':k===2?'DETAIL':k===3?'FRINGE':k===4?'WISPS':m.name;meshes.push(convert(m,name));
}
const approximations=Object.fromEntries(meshes.map(m=>[m.name,approximation(m)]));
const selected=Object.fromEntries(meshes.filter(m=>['MASS','DETAIL','cloth','collar--1','collar-1','facing--1','facing-1','placket'].includes(m.name)).map(m=>[m.name,rasterize(m)]));
const ordering=[order(selected.MASS.hits,selected.cloth.hits,{label:'MASS / primary cloth'}),order(selected.DETAIL.hits,selected.cloth.hits,{label:'DETAIL / primary cloth'}),order(selected.MASS.hits,selected.MASS.hits,{self:true,excludeSameGuide:true,label:'MASS / other MASS guide'}),order(selected.DETAIL.hits,selected.MASS.hits,{label:'DETAIL / MASS'})];
for(const name of['collar--1','collar-1','facing--1','facing-1','placket'])ordering.push(order(selected[name].hits,selected.cloth.hits,{label:name+' / primary cloth'}));
assert(maxFormulaDifference<1e-12);
const cpu=process.cpuUsage(cpuStart),result={audit:'torso-depth110-contact',sourceOnly:true,native:false,sources:Object.fromEntries(Object.entries(sources).map(([k,v])=>[k,{file:v.file,bytes:Buffer.byteLength(v.text),sha256:sha(v.text)}])),construction:'Current exact source108 groom, .35 contact, current106/102 cloth width.12, body/head pose, then actual99 function at-.24 on source Float32 geometry. No tessellation change.',formulaCheck:{samples:formulaChecks,maxDifference:maxFormulaDifference},grid,approximations,rayHits:Object.fromEntries(Object.entries(selected).map(([k,v])=>[k,v.metrics])),ordering,limitations:['Finite edge-midpoint/centroid/XY-ray probes are not an exhaustive continuous collision certificate.','Raw opaque source triangles are sampled regardless of hair alpha; shared-edge hit duplication is possible.','Ordering omits original gaps below.003 and compares only the listed components. Existing self-intersections are not repaired.','Collar/facing/placket primary surfaces are exact, but sewn tubes, detailed buttons, neck and face are outside this order audit; all native mesh positions/normals are separately preflighted.','The source harness supplies uniform Catmull-Rom and geometry math; native Three material rendering and full hidden-side anatomy require visual review.'],resources:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024,finalMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,+(v/1048576).toFixed(1)]))}};
fs.writeFileSync('review/torso-depth110-contact-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({formulaCheck:result.formulaCheck,approximations:Object.fromEntries(Object.entries(approximations).map(([k,v])=>[k,{triangles:v.triangles,presets:v.presets.map(p=>({strength:p.strength,edge:p.maxEdgeMidpointError,centroid:p.maxCentroidError,edgeAbove001:p.edgeIncidencesAbovePoint001}))}])),ordering,resources:result.resources}));
