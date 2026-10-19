import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ROUTE144_COEFFICIENTS as coefficients} from './near-ear144-coefficients.js';
import {sampleNearEar144,ROUTE144_SPEC,prepareNearEar144} from './near-ear-route-candidate144.js';
import {triangleSoup144,triangleDistanceSquared144,surfaceClearance144} from './near-ear144-geometry.mjs';

// These analytic fixtures check the geometry checker itself; they are separate
// from the actual source-surface audit and do not stand in for native rendering.
const soup=points=>triangleSoup144(new Float64Array(points.flat()),[0,1,2])[0];
const reference=soup([[0,0,0],[1,0,0],[0,1,0]]);
const fixtures=[
 ['parallel face gap',[[0,0,.005],[1,0,.005],[0,1,.005]],.005**2],
 ['crossing interiors',[[.2,.2,-1],[.8,.2,1],[.2,.8,1]],0],
 ['coplanar overlap',[[.2,.2,0],[.8,.2,0],[.2,.8,0]],0],
 ['coplanar disjoint',[[2,0,0],[3,0,0],[2,1,0]],1],
 ['separated in two axes',[[2,0,.005],[3,0,.005],[2,1,.005]],1+.005**2]
].map(([name,points,expected])=>{
 const triangle=soup(points),forward=triangleDistanceSquared144(reference,triangle),reverse=triangleDistanceSquared144(triangle,reference);
 assert(Math.abs(forward-expected)<1e-12,name);assert.equal(forward,reverse,name+' symmetry');
 return{name,expectedSquaredDistance:expected,actualSquaredDistance:forward};
});
const crossing=soup([[.2,.2,-1],[.8,.2,1],[.2,.8,1]]),separate=soup([[0,0,.005],[1,0,.005],[0,1,.005]]);
const clearance=surfaceClearance144([reference],[separate,crossing]);
assert.equal(clearance.intersectionPairs,1);assert.equal(clearance.minimumDistance,0);

const jet=(values,h,end)=>end?[values[5],5*(values[5]-values[4])/h,20*(values[5]-2*values[4]+values[3])/(h*h)]:
 [values[0],5*(values[1]-values[0])/h,20*(values[2]-2*values[1]+values[0])/(h*h)];
const continuity={value:0,firstDerivative:0,secondDerivative:0,endpointJetMaximum:0};
for(let i=0;i<coefficients.segments.length;i++){
 const q=coefficients.segments[i],h=q.y1-q.y0;
 for(const key of['x','z']){
  if(i){const previous=coefficients.segments[i-1],a=jet(previous[key],previous.y1-previous.y0,true),b=jet(q[key],h,false);
   for(let k=0;k<3;k++){const field=['value','firstDerivative','secondDerivative'][k];continuity[field]=Math.max(continuity[field],Math.abs(a[k]-b[k]));}
  }
  if(i===0)continuity.endpointJetMaximum=Math.max(continuity.endpointJetMaximum,...jet(q[key],h,false).map(Math.abs));
  if(i===coefficients.segments.length-1)continuity.endpointJetMaximum=Math.max(continuity.endpointJetMaximum,...jet(q[key],h,true).map(Math.abs));
 }
}
for(const [key,value]of Object.entries(continuity))assert(value<1e-11,'144 coefficient '+key);
const out=new Float64Array(4),left=new Float64Array(4),right=new Float64Array(4),epsilon=1e-6;
let derivativeMaximumError=0,sampledNormMaximum=0;
for(let i=1;i<4096;i++){
 const y=ROUTE144_SPEC.bottom+(ROUTE144_SPEC.top-ROUTE144_SPEC.bottom)*i/4096;
 sampleNearEar144(y,out);sampleNearEar144(y-epsilon,left);sampleNearEar144(y+epsilon,right);
 for(let k=0;k<2;k++)derivativeMaximumError=Math.max(derivativeMaximumError,Math.abs(out[k+2]-(right[k]-left[k])/(2*epsilon)));
 sampledNormMaximum=Math.max(sampledNormMaximum,Math.hypot(out[0],out[1]));
}
assert(derivativeMaximumError<1e-7,'144 analytic displacement derivative');
assert(sampledNormMaximum<=coefficients.continuousBound.upper,'144 continuous bound');
for(const y of[-2,ROUTE144_SPEC.bottom,ROUTE144_SPEC.top,2])assert.deepEqual(Array.from(sampleNearEar144(y,out)),[0,0,0,0]);
assert.equal(prepareNearEar144(null,{strength:0}),null);
assert.throws(()=>prepareNearEar144(null,{strength:.5}),/approved off\/on/);
const report={iteration:144,score:77,sourceOnly:true,native:false,status:'Passed',coefficientFingerprint:coefficients.fingerprint,
 fixtures,clearanceFixture:{minimumDistance:clearance.minimumDistance,intersectionPairs:clearance.intersectionPairs},
 continuity,finiteDifference:{samples:4095,step:epsilon,derivativeMaximumError},sampledNormMaximum,continuousCenterBound:coefficients.continuousBound,
 exactOutsideSupport:true,offIsNoOp:true,limitations:['The fixtures validate the triangle-distance utility, not the visual result.','The finite-difference derivative check is numerical; exact C2 joins are checked separately from endpoint polynomial jets.']};
fs.writeFileSync('review/near-ear144-contract.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
