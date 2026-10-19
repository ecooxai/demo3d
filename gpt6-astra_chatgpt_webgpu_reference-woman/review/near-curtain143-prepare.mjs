import fs from 'node:fs';
import crypto from 'node:crypto';
import {construct143,sourceBlouse,cloth,helper,ids143,selected143} from './near-curtain143-source.mjs';
import {helper as supportHelper} from './near-curtain138-source.mjs';
import {modelPoint} from './lower-clump126-source.mjs';

const begin=performance.now(),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const baseline=construct143(false,{massOnly:true,capture:true}),spec=helper.CURTAIN143_SPEC,collar=supportHelper.garmentObstacles(sourceBlouse()),sides=supportHelper.triangleField();
const g0=baseline.mesh.geometry,p0=g0.attributes.position,idx=g0.index.array,xyz0=new Float64Array(p0.count*3);
for(let i=0;i<p0.count;i++)xyz0.set(modelPoint(p0.getX(i),p0.getY(i),p0.getZ(i)),i*3);
const point=(a,i)=>({x:a[i*3],y:a[i*3+1],z:a[i*3+2]});
for(let id=148;id<=159;id++)if(!selected143.has(id))for(let i=id*960*3;i<(id+1)*960*3;i+=3)sides.add(point(xyz0,idx[i]),point(xyz0,idx[i+1]),point(xyz0,idx[i+2]),id);
const bc=Math.cos(.045),bs=Math.sin(.045),body=(x,y)=>cloth.sampleBlouseFrontAtXY(bc*x+bs*(y-1),-bs*x+bc*(y-1)+1);
const B=t=>{const s=1-t;return[s**5,5*t*s**4,10*t*t*s**3,10*t**3*s*s,5*t**4*s,t**5];};
const basis=(q,Y)=>{const a=B(q),b=B((spec.fieldTop-Y)/(spec.fieldTop-spec.fieldBottom)),v=new Float64Array(36);for(let j=0;j<6;j++)for(let i=0;i<6;i++)v[j*6+i]=a[i]*b[j];return v;};
const targets=[];
for(let j=0;j<=28;j++)for(let i=0;i<=28;i++){
 const q=i/28,Y=spec.fieldTop+(spec.fieldBottom-spec.fieldTop)*j/28,X=helper.lateral143(q,Y),b=body(X,Y),leaf=collar.get(X,Y);let side=null;
 for(const dx of[-.045,0,.045])for(const dy of[-.025,0,.025]){const h=sides.get(X+dx,Y+dy);if(h&&(!side||h.z>side.z))side=h;}
 let target=b&&b.edgeWeight>.01?b.point.z+(.092+.016*Math.sin(q*4.2+Y*.8))/b.normal.z+.069:.73-.15*q+.035*Math.cos(Y*2.1);
 if(leaf)target=Math.max(target,leaf.z+.10);if(side&&side.z>.12)target=Math.max(target,side.z+.085);
 let raw=target;for(let n=0;n<12;n++)raw=target-baseline.contact.atModel(X,Y,raw);
 targets.push({q,Y,X,target,raw,basis:basis(q,Y),kind:leaf?'collar':side?'side':'cloth'});
}
function solve(weighted){
 const A=Array.from({length:36},()=>new Float64Array(37));
 const add=(v,value,weight)=>{for(let i=0;i<36;i++){A[i][36]+=v[i]*value*weight;for(let j=0;j<36;j++)A[i][j]+=v[i]*v[j]*weight;}};
 for(const row of weighted)add(row.basis,row.raw,row.weight??1);
 for(let j=0;j<6;j++)for(let i=0;i<4;i++){const v=new Float64Array(36);v[j*6+i]=1;v[j*6+i+1]=-2;v[j*6+i+2]=1;add(v,0,.10);}
 for(let j=0;j<4;j++)for(let i=0;i<6;i++){const v=new Float64Array(36);v[j*6+i]=1;v[(j+1)*6+i]=-2;v[(j+2)*6+i]=1;add(v,0,.13);}
 for(let i=0;i<36;i++)A[i][i]+=1e-7;
 for(let k=0;k<36;k++){let best=k;for(let j=k+1;j<36;j++)if(Math.abs(A[j][k])>Math.abs(A[best][k]))best=j;[A[k],A[best]]=[A[best],A[k]];const s=A[k][k];if(Math.abs(s)<1e-13)throw Error('143 field solve singular');for(let j=k;j<=36;j++)A[k][j]/=s;for(let i=0;i<36;i++)if(i!==k){const f=A[i][k];for(let j=k;j<=36;j++)A[i][j]-=f*A[k][j];}}
 return A.map(r=>r[36]);
}
let z=solve(targets),passes=[];
// Coupled convex support constraints, solved offline in the same smooth field.
// This never moves a completed guide or adds a separate per-family lift.
const H=Array.from({length:36},()=>new Float64Array(72));
for(const r of targets)for(let i=0;i<36;i++)for(let j=0;j<36;j++)H[i][j]+=r.basis[i]*r.basis[j];
const reg=(indices,w)=>{const c=[1,-2,1];for(let i=0;i<3;i++)for(let j=0;j<3;j++)H[indices[i]][indices[j]]+=w*c[i]*c[j];};
for(let j=0;j<6;j++)for(let i=0;i<4;i++)reg([j*6+i,j*6+i+1,j*6+i+2],.10);
for(let j=0;j<4;j++)for(let i=0;i<6;i++)reg([j*6+i,(j+1)*6+i,(j+2)*6+i],.13);
for(let i=0;i<36;i++){H[i][i]+=1e-7;H[i][36+i]=1;}
for(let k=0;k<36;k++){let best=k;for(let i=k+1;i<36;i++)if(Math.abs(H[i][k])>Math.abs(H[best][k]))best=i;[H[k],H[best]]=[H[best],H[k]];const v=H[k][k];for(let j=0;j<72;j++)H[k][j]/=v;for(let i=0;i<36;i++)if(i!==k){const d=H[i][k];for(let j=0;j<72;j++)H[i][j]-=d*H[k][j];}}
const constraints=targets.map(r=>{const direction=new Float64Array(36);for(let i=0;i<36;i++)for(let j=0;j<36;j++)direction[i]+=H[i][36+j]*r.basis[j];const norm=r.basis.reduce((s,b,i)=>s+b*direction[i],0);return{...r,direction,norm,bound:r.raw-.010,lambda:0};});
for(let k=0;k<220;k++){
 let maxViolation=0;for(const r of constraints){const value=r.basis.reduce((s,b,i)=>s+b*z[i],0),violation=r.bound-value,next=Math.max(0,r.lambda+violation/r.norm),delta=next-r.lambda;r.lambda=next;if(delta)for(let i=0;i<36;i++)z[i]+=delta*r.direction[i];maxViolation=Math.max(maxViolation,violation);}
 if(k%20===0||maxViolation<1e-6)passes.push({pass:k,maximumConstraintViolation:maxViolation});if(maxViolation<1e-6)break;
}
const sourceFiles=['review/hair-groom-base143.js','src/hair-groom.js','src/blouse.js','src/hair-contact.js','src/lower-guide-placement.js','src/face.js'],sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,sha(fs.readFileSync(file))]));
const data={version:spec.version,z,fingerprint:sha(JSON.stringify(z)),specification:{headTilt:-.17,headShiftX:.26,headY:2.95,headYaw:.16,guidePlacement:.5,contact:.35,pin:spec.pin,full:spec.full,bodyRoll:.045,sourceHashes},solve:{targets:targets.length,unknowns:36,passes}};
const solveMs=performance.now()-begin;
const changed=construct143(true,{massOnly:true,capture:true,coefficients:data}),g=changed.mesh.geometry,pp=g.attributes.position,nn=g.attributes.normal,xyz=new Float64Array(pp.count*3);
for(let i=0;i<pp.count;i++)xyz.set(modelPoint(pp.getX(i),pp.getY(i),pp.getZ(i)),i*3);
let nonfinite=0,normalError=0,protectedChanges=0,upperChanges=0;const distances=[],collarDistances=[],sideDistances=[];
for(let i=0;i<pp.count;i++){
 const length=Math.hypot(nn.getX(i),nn.getY(i),nn.getZ(i));if(!Number.isFinite(pp.getX(i)+pp.getY(i)+pp.getZ(i)+length))nonfinite++;if(length)normalError=Math.max(normalError,Math.abs(length-1));
 const moving=selected143.has(Math.floor(i/549)),same=[0,1,2].every(a=>pp.array[i*3+a]===p0.array[i*3+a]);if(!moving&&!same)protectedChanges++;if(baseline.mesh.__rawPosition[i*3+1]>=-1.05&&!same)upperChanges++;
}
for(const id of ids143)for(let ti=id*960;ti<(id+1)*960;ti++){
 const a=idx[ti*3]*3,b=idx[ti*3+1]*3,c=idx[ti*3+2]*3,Y=(xyz[a+1]+xyz[b+1]+xyz[c+1])/3;
 if(Y>1.78)continue;const X=(xyz[a]+xyz[b]+xyz[c])/3,Z=(xyz[a+2]+xyz[b+2]+xyz[c+2])/3,q=body(X,Y),leaf=collar.get(X,Y),side=sides.get(X,Y);
 if(q&&q.edgeWeight>.01)distances.push({id,Y,X,gap:(Z-q.point.z)*q.normal.z});if(leaf)collarDistances.push({id,Y,X,gap:Z-leaf.z});if(side)sideDistances.push({id,Y,X,gap:Z-side.z,side:side.label});
}
function intervals(array,Y){
 const spans=[];for(const id of ids143)for(let ti=id*960;ti<(id+1)*960;ti++){
  const v=[idx[ti*3],idx[ti*3+1],idx[ti*3+2]],cross=[];for(let e=0;e<3;e++){const a=v[e]*3,b=v[(e+1)%3]*3,ya=array[a+1],yb=array[b+1];if((Y>=Math.min(ya,yb)&&Y<Math.max(ya,yb))&&Math.abs(yb-ya)>1e-12){const t=(Y-ya)/(yb-ya);cross.push([array[a]+t*(array[b]-array[a]),array[a+2]+t*(array[b+2]-array[a+2])]);}}
  if(cross.length===2)spans.push([Math.min(cross[0][0],cross[1][0]),Math.max(cross[0][0],cross[1][0])]);
 }
 spans.sort((a,b)=>a[0]-b[0]);const merged=[];for(const a of spans){const p=merged.at(-1);if(p&&a[0]<=p[1]+1e-7)p[1]=Math.max(p[1],a[1]);else merged.push(a.slice());}const total=merged.reduce((s,a)=>s+a[1]-a[0],0),width=merged.at(-1)?.[1]-merged[0]?.[0],gaps=merged.slice(1).map((a,i)=>a[0]-merged[i][1]);return{Y,minX:merged[0]?.[0],maxX:merged.at(-1)?.[1],span:width,covered:total,fraction:total/width,components:merged.length,largestGap:Math.max(0,...gaps)};
}
const rows=[1.7,1.50,1.30,1.10,.85,.60,.30,0,-.3,-.55,-.75,-.95],coverage=rows.map(Y=>({Y,baseline:intervals(xyz0,Y),candidate:intervals(xyz,Y)}));
const stats=a=>{a=a.slice().sort((a,b)=>a-b);return{n:a.length,min:a[0]??null,median:a[Math.floor(a.length*.5)]??null,p90:a[Math.floor(a.length*.9)]??null,max:a.at(-1)??null};};
const report={sourceOnly:true,stage:'coarse-MASS-before-fine',score:77,coefficient:data,solveMs,coarseConstructionMs:changed.metrics.preparationMs,elapsedMs:performance.now()-begin,nonfinite,normalError,protectedChanges,upperChanges,coverage,cloth:stats(distances.map(r=>r.gap)),clothPenetrations:distances.filter(r=>r.gap<0).sort((a,b)=>a.gap-b.gap).slice(0,20),collar:stats(collarDistances.map(r=>r.gap)),collarPenetrations:collarDistances.filter(r=>r.gap<0).sort((a,b)=>a.gap-b.gap).slice(0,20),sideFrontEnvelope:stats(sideDistances.map(r=>r.gap)),sideExamples:sideDistances.filter(r=>r.gap<0).sort((a,b)=>a.gap-b.gap).slice(0,20),memoryMiB:Object.fromEntries(Object.entries(process.memoryUsage()).map(([k,v])=>[k,+(v/1048576).toFixed(2)]))};
fs.writeFileSync('review/near-curtain143-coefficients.js','// Frozen offline common-field solve. Native construction does not query support.\nexport const CURTAIN143_COEFFICIENTS = '+JSON.stringify(data,null,2)+';\n');
fs.writeFileSync('review/near-curtain143-coarse-audit.json',JSON.stringify(report,null,2)+'\n');
const visual={owned:ids143,fixedSides:Array.from({length:12},(_,i)=>148+i).filter(id=>!selected143.has(id)),index:Array.from(idx),baseline:Array.from(xyz0,v=>+v.toFixed(6)),candidate:Array.from(xyz,v=>+v.toFixed(6))};
fs.writeFileSync('review/near-curtain143-coarse-mesh.json',JSON.stringify(visual));
console.log(JSON.stringify({...report,coefficient:{fingerprint:data.fingerprint,solve:data.solve},sideExamples:report.sideExamples.slice(0,3)}));
