import fs from 'node:fs';
import assert from 'node:assert/strict';
import {construct,rayGrid,originalRanges} from './lower-clump126-source.mjs';
const started=performance.now(),baseline=construct(0,{baseline:true,massOnly:true}),candidate=construct(1,{massOnly:true,family:true});
const a=rayGrid(baseline.mesh,originalRanges()),b=rayGrid(candidate.mesh,candidate.metrics.ranges),shared=candidate.guides[58].clump126.shared;
const values={requested:[],capacityAllowed:[],capacityFraction:[],actualRelief:[],expectedContactRelief:[],meshRetainedFraction:[]},counts={samples:0,originallyFrontVisible:0,hiddenByFixed:0,capacityBelow002:0,actualAbove006:0,actualAbove010:0,meshBelowHalfTarget:0},examples=[];
for(let row=0;row<=33;row++){
 const y=-2.10-row*.05;
 for(const v of shared.valleysAt(y)){
  if(v.weight<.80)continue;const x=v.center,f=shared.fieldAt(x,y),before=a.at(x+.26,y+2.95),after=b.at(x+.26,y+2.95);if(!before||!after||!Number.isFinite(before.front+after.front))continue;counts.samples++;
  if(before.frontGuide<58||before.frontGuide>132){counts.hiddenByFixed++;continue;}
  counts.originallyFrontVisible++;values.requested.push(f.requested);values.capacityAllowed.push(f.common);values.capacityFraction.push(f.common/Math.max(1e-9,f.requested));
  if(f.common<.002)counts.capacityBelow002++;
  const actual=before.front-after.front,oldDepth=f.front,nextDepth=f.front-f.common,expected=oldDepth+candidate.contact.atModel(x+.26,y+2.95,oldDepth)-nextDepth-candidate.contact.atModel(x+.26,y+2.95,nextDepth);
  values.actualRelief.push(actual);values.expectedContactRelief.push(expected);if(expected>.001)values.meshRetainedFraction.push(actual/expected);
  if(actual>=.006)counts.actualAbove006++;if(actual>=.010)counts.actualAbove010++;if(expected>.003&&actual<expected*.5){counts.meshBelowHalfTarget++;if(examples.length<12)examples.push({family:v.family.family,left:v.family.left,x,y,originalGuide:before.frontGuide,nextGuide:after.frontGuide,requested:f.requested,capacity:f.capacity,common:f.common,actual,expected});}
 }
}
const distribution=a=>{a.sort((a,b)=>a-b);return{count:a.length,min:a[0],p25:a[Math.floor((a.length-1)*.25)],median:a[Math.floor((a.length-1)*.5)],p75:a[Math.floor((a.length-1)*.75)],max:a.at(-1),mean:a.reduce((s,v)=>s+v,0)/a.length};};
const result={candidate:126,revision:'shared-family-coordinate field',sourceOnly:true,strength:1,counts,distributions:Object.fromEntries(Object.entries(values).map(([k,v])=>[k,distribution(v)])),examples,geometry:{...candidate.metrics,ranges:undefined},resources:{elapsedMs:performance.now()-started,peakRssMiB:process.resourceUsage().maxRSS/1024},limitations:['Finite front-facing source-triangle rays, excluding alpha and fine ribbons; native appearance remains authoritative.','Capacity uses raw baseline triangle intersections and a conservative24% vertical half-depth floor; native/contact triangle interpolation is measured separately.','The field preserves each original rear and contour ring point; complete normals, protected range and garment checks follow only if useful exposed depth remains.']};
assert.equal(candidate.metrics.maxProtectedChange,0);assert.equal(candidate.metrics.maxRearChange,0);assert.deepEqual(candidate.metrics.maxSectionXY,[0,0]);
fs.writeFileSync('review/lower-clump126-family-exposure.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,examples:result.examples.slice(0,4)}));
