import fs from 'node:fs';
import {construct,metadata} from './guide-placement118-source.mjs';
const start=performance.now(),cpuStart=process.cpuUsage(),h=construct(1,{pathsOnly:true});
let protectedMismatch=0,maxCenterXY=0;const rows=[];
for(let i=0;i<h.guides.length;i++){
 const g=h.guides[i];if(!g.original118)continue;
 for(let j=0;j<=256;j++){
  const t=j/256,a=g.c.getPoint(t),b=g.original118.c.getPoint(t);
  maxCenterXY=Math.max(maxCenterXY,Math.abs(a.x-b.x),Math.abs(a.y-b.y));
  if(b.y>=-1.64&&(a.x!==b.x||a.y!==b.y||a.z!==b.z))protectedMismatch++;
 }
 for(const y of[.9,.6,.3,0,-.3,-.6,-.9]){
  const target=y-2.95;if(g.original118.c.getPoint(1).y>target)continue;let lo=0,hi=1;
  for(let j=0;j<24;j++){const t=(lo+hi)/2;if(g.original118.c.getPoint(t).y>target)lo=t;else hi=t;}
  const t=(lo+hi)/2,a=g.c.getPoint(t),b=g.original118.c.getPoint(t),x=b.x+.26;
  const old=b.z+h.contact.atModel(x,y,b.z),next=a.z+h.contact.atModel(x,y,a.z);
  rows.push({side:b.x<0?'left':'right',kind:g.kind,y,pull:old-next});
 }
}
const stats=a=>{a.sort((x,y)=>x-y);return{n:a.length,min:a[0],median:a[Math.floor(a.length/2)],max:a.at(-1)};};
const rowsByHeight=['left','right'].flatMap(side=>[.9,.6,.3,0,-.3,-.6,-.9].map(y=>({side,y,...stats(rows.filter(r=>r.side===side&&r.y===y).map(r=>r.pull))})));
const cpu=process.cpuUsage(cpuStart),result={sourceOnly:true,native:false,sources:metadata(),fit:h.metrics,maxGuideCenterXYChange:maxCenterXY,protectedGuideMismatch:protectedMismatch,post86CenterPullByModelY:rowsByHeight,cost:{wallMs:performance.now()-start,cpuMs:(cpu.user+cpu.system)/1000,peakRssMiB:process.resourceUsage().maxRSS/1024}};
fs.writeFileSync('review/guide-placement118-study.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
