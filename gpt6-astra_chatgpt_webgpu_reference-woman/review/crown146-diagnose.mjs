// Read-only diagnosis of frozen142. No candidate or production geometry edits.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {fields142,construct142} from './crown142-source.mjs';

const {crown,chart}=fields142(),arr=p=>[p.x,p.y,p.z];
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const len=a=>Math.hypot(...a),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>a.map(x=>x/(len(a)||1)),dist=(a,b)=>len(sub(arr(a),arr(b)));
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(a,b)/(len(a)*len(b)))))*180/Math.PI;
const dz=n=>-Math.sin(.16)*Math.cos(-.17)*n[0]+Math.sin(.16)*Math.sin(-.17)*n[1]+Math.cos(.16)*n[2];
const derivative=(f,u,v,axis)=>{
 const h=1e-5,a=axis===0?[u-h,v]:[u,Math.max(0,v-h)],b=axis===0?[u+h,v]:[u,Math.min(1,v+h)];
 return sub(arr(f(...b)),arr(f(...a))).map(x=>x/(b[axis]-a[axis]));
};
const arc=(f,a,b)=>{let s=0,p=f(a);for(let i=1;i<=128;i++){const q=f(a+(b-a)*i/128);s+=dist(p,q);p=q;}return s;};
const coordinateSamples=[[-1,.90,.78],[-1,.93,.80],[-1,.95,.70],[-1,.97,.65],[-1,.985,.80],[-1,.993,.90],[1,.90,.80],[1,.93,.60],[1,.96,.50],[1,.985,.80]];
const metrics=coordinateSamples.map(([side,u,v])=>{
 const a=(u,v)=>crown(side,u,v,.002),b=(u,v)=>chart.point(side,u,v),du0=derivative(a,u,v,0),dv0=derivative(a,u,v,1),du1=derivative(b,u,v,0),dv1=derivative(b,u,v,1),n0=cross(du0,dv0).map(x=>x*side),n1=cross(du1,dv1).map(x=>x*side);
 return{side,u,v,old:arr(a(u,v)),on:arr(b(u,v)),growthMetricRatio:len(dv1)/len(dv0),transverseMetricRatio:len(du1)/len(du0),areaMetricRatio:len(n1)/len(n0),uvAngleBefore:angle(du0,dv0),uvAngleAfter:angle(du1,dv1),growthDirectionTurnDegrees:angle(dv0,dv1),normalTurnDegrees:angle(n0,n1),oldCameraFacing:dz(unit(n0)),onCameraFacing:dz(unit(n1))};
});
const releaseLengths=[];
for(const[side,us]of[[-1,[.83,.86,.90,.93,.95,.97,.985]],[1,[.86,.90,.93,.96,.985]]])for(const u of us){
 const a=v=>crown(side,u,v,.002),b=v=>chart.point(side,u,v),oldLength=arc(a,.875,1),onLength=arc(b,.875,1);
 releaseLengths.push({side,u,prefixV:chart.prefix(side,u),oldEndpoint:arr(a(1)),onEndpoint:arr(b(1)),oldReleaseArc:oldLength,onReleaseArc:onLength,ratio:onLength/oldLength});
}

// Actual frozen emitted CROWN buffers, including its computed vertex normals.
// Camera-facing is not ray-visible: occlusion by neighboring hair is not tested.
const off=construct142(0),on=construct142(1),g0=off.children[0].geometry,g1=on.children[0].geometry;
const p0=g0.attributes.position,p1=g1.attributes.position,n0=g0.attributes.normal,n1=g1.attributes.normal,uv=g0.attributes.uv,col=g0.attributes.color,index=g0.index.array;
const vec=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)],mean=(a,ids)=>ids.reduce((s,i)=>s.map((x,k)=>x+vec(a,i)[k]/3),[0,0,0]);
const facing={changedTriangles:0,offBackToOnFront:0,offFrontToOnBack:0,bothFront:0,bothBack:0,newFrontFullVertexAlpha:0,maximumVertexNormalTurnDegrees:0};
const weights={samples:0,offZeroToOnNonzero:0,offZeroToOnAboveHalf:0,maximumAbsoluteWeightDifference:0,examples:[]};
for(let k=144*52*6;k<index.length;k+=3){
 const ids=[index[k],index[k+1],index[k+2]];
 if(ids.every(i=>vec(p0,i).every((x,c)=>x===vec(p1,i)[c])))continue;
 const a0=vec(p0,ids[0]),b0=vec(p0,ids[1]),c0=vec(p0,ids[2]),a1=vec(p1,ids[0]),b1=vec(p1,ids[1]),c1=vec(p1,ids[2]),f0=cross(sub(b0,a0),sub(c0,a0)),f1=cross(sub(b1,a1),sub(c1,a1));
 if(len(f1)<1e-13||len(f0)<1e-13)continue;
 const front0=dz(f0)>0,front1=dz(f1)>0;
 facing.changedTriangles++;facing[front0?(front1?'bothFront':'offFrontToOnBack'):(front1?'offBackToOnFront':'bothBack')]++;
 if(!front0&&front1&&ids.every(i=>col.array[i*4+3]>.999))facing.newFrontFullVertexAlpha++;
 const m0=unit(mean(n0,ids)),m1=unit(mean(n1,ids));facing.maximumVertexNormalTurnDegrees=Math.max(facing.maximumVertexNormalTurnDegrees,angle(m0,m1));
 const u=ids.reduce((s,i)=>s+uv.getX(i),0)/3,v=ids.reduce((s,i)=>s+uv.getY(i)/.73,0)/3;
 const fixed=smooth(.31,.49,u)*smooth(.025,.13,v)*(1-smooth(.88,1,v));
 const w0=fixed*smooth(0,.42,dz(m0)),w1=fixed*smooth(0,.42,dz(m1));
 weights.samples++;weights.maximumAbsoluteWeightDifference=Math.max(weights.maximumAbsoluteWeightDifference,Math.abs(w1-w0));
 if(w0===0&&w1>0)weights.offZeroToOnNonzero++;
 if(w0===0&&w1>.5){weights.offZeroToOnAboveHalf++;if(weights.examples.length<5)weights.examples.push({triangle:k/3,u,v,off:w0,on:w1});}
}

const paths=['src/hair-groom.js','review/hair-groom-candidate142.js','review/crown-chart-candidate142.js','src/reference-crown.js','src/main.js'];
const report={version:'read-only-crown146-diagnosis',candidateImplemented:false,inputs:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')])),coordinateMetrics:metrics,releaseLengths,actualEmittedFacing:facing,atlas100NormalWeight:weights,limits:['Geometric and normal-weight measurements only; no photograph pixels are read.','Camera-facing classification uses actual emitted triangles and accepted head Ry(.16)Rz(-.17), but is not an occlusion or pixel-ownership test.','100 weighting is evaluated at triangle centroids from interpolated actual vertex normals; the native atlas uses dense grid samples, so these counts are explanatory samples, not changed-texel counts.','UV0, vertex-alpha and original coverage-map inputs were unchanged in142. Native final100 RGB can change because its normal-dependent contrast weight is rebaked.','Native art has already rejected142; no material, alpha or strength rescue is proposed.']};
fs.writeFileSync('review/crown146-diagnosis.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file:'review/crown146-diagnosis.json',facing,atlas100NormalWeight:weights,releaseRatios:releaseLengths.map(r=>({side:r.side,u:r.u,ratio:r.ratio})),coordinateSampleCount:metrics.length},null,2));
