import fs from 'node:fs';
import assert from 'node:assert/strict';
import {construct,clumps,rayGrid,rawToModel,originalRanges} from './lower-clump126-source.mjs';
const started=performance.now(),baseline=construct(0,{baseline:true,massOnly:true}),candidate=construct(1,{massOnly:true});
const a=rayGrid(baseline.mesh,originalRanges()),b=rayGrid(candidate.mesh,candidate.metrics.ranges);
const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
const SQ=Math.SQRT1_2,toQ=x=>x>=SQ?(1-x)/(1-SQ):x>=0?1+(SQ-x)/SQ:x>=-SQ?2-x/SQ:3+(-SQ-x)/(1-SQ);
const summary={candidate:126,sourceOnly:true,strength:1,samples:0,originallyExposed:0,stillExposed:0,filledByNeighbor:0,insignificantOwnRelief:0,hiddenOriginal:0,frontUsefulRelief:[],potentialOwnRelief:[],retainedFraction:[],blockers:{},guides:new Set(),examples:[]};
for(let id=58;id<=132;id++){
 const g=candidate.guides[id],d=g.clump126;
 for(let j=d.firstDense+2;j<57;j+=2){
  const t=j/60,s=candidate.section(g,t);if(s.f.p.y>d.params.full-.025||t>d.params.release-.02||s.shape<.28)continue;
  const along=clamp((s.f.p.y-d.params.onset)/(g.tipY-d.params.onset));
  for(const valley of d.params.valleys){
   const x=valley.center+valley.drift*smooth(valley.start,valley.end,along),q=toQ(x),p=clumps.clumpSurface126(g,t,1-q/2,{arcLength:false});if(!p)continue;
   const [mx,my]=rawToModel(p.p,candidate.contact),before=a.at(mx,my),after=b.at(mx,my);if(!before?.hits.has(id)||!after?.hits.has(id))continue;summary.samples++;
   const oldOwn=before.hits.get(id).max,newOwn=after.hits.get(id).max,potential=oldOwn-newOwn;
   if(oldOwn<before.front-.00075){summary.hiddenOriginal++;continue;}
   summary.originallyExposed++;summary.guides.add(id);
   if(potential<.001){summary.insignificantOwnRelief++;continue;}
   const visible=newOwn>=after.front-.0008,actual=before.front-after.front;
   summary[visible?'stillExposed':'filledByNeighbor']++;summary.frontUsefulRelief.push(actual);summary.potentialOwnRelief.push(potential);summary.retainedFraction.push(actual/potential);
   if(!visible){const key=`${after.frontGuide}:${candidate.guides[after.frontGuide].kind}`;summary.blockers[key]=(summary.blockers[key]||0)+1;if(summary.examples.length<12)summary.examples.push({guide:id,blocker:after.frontGuide,kind:candidate.guides[after.frontGuide].kind,x:mx,y:my,potential,actual});}
  }
 }
}
const distribution=a=>{a.sort((a,b)=>a-b);return{count:a.length,min:a[0],p25:a[Math.floor((a.length-1)*.25)],median:a[Math.floor((a.length-1)*.5)],p75:a[Math.floor((a.length-1)*.75)],max:a.at(-1),mean:a.reduce((s,v)=>s+v,0)/a.length};};
summary.visibleGuideCount=summary.guides.size;delete summary.guides;
for(const key of['frontUsefulRelief','potentialOwnRelief','retainedFraction'])summary[key]=distribution(summary[key]);
summary.exposedFraction=summary.originallyExposed/summary.samples;summary.remainingExposedFraction=summary.stillExposed/(summary.stillExposed+summary.filledByNeighbor);
summary.geometry={...candidate.metrics,ranges:undefined};summary.geometry.baselineTriangles=baseline.mesh.geometry.index.count/3;summary.geometry.actualTriangles=candidate.mesh.geometry.index.count/3;
summary.geometry.baselineVertices=baseline.mesh.geometry.attributes.position.count;summary.geometry.actualVertices=candidate.mesh.geometry.attributes.position.count;
summary.resources={elapsedMs:performance.now()-started,peakRssMiB:process.resourceUsage().maxRSS/1024};
summary.limitations=['Actual MASS triangle rays in source math harness; native Three and images remain authoritative.','The original non-target fine ribbons and material alpha are excluded from this early coverage check.','Only lower front-facing valley samples are evaluated; profiles and silhouette need the focused native views.'];
assert.equal(candidate.metrics.maxProtectedChange,0);assert.equal(candidate.metrics.maxRearChange,0);
fs.writeFileSync('review/lower-clump126-exposure.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
