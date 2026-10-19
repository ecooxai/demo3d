import fs from 'node:fs';
import {construct,cloth,fit,read} from './guide-placement118-source.mjs';

// Read-only dependency probe. Expose the candidate control field only in this
// local evaluator; production/candidate files retain no diagnostic callbacks.
const probe=new Function('sampleBlouseFrontAtXY',read('review/guide-placement-candidate118.js').replace('return metrics;','metrics.__field=field;return metrics;')+'\nreturn {fitLowerGuides118,sample};')(cloth.sampleBlouseFrontAtXY);
const originalFit=fit.fitLowerGuides118;fit.fitLowerGuides118=probe.fitLowerGuides118;
const h=construct(1,{pathsOnly:true});fit.fitLowerGuides118=originalFit;
const bc=Math.cos(.045),bs=Math.sin(.045),rows=[],sides=[];
const at=(p)=>{const x=p.x+.26,y=p.y+2.95,s=cloth.sampleBlouseFrontAtXY(bc*x+bs*(y-1),-bs*x+bc*(y-1)+1);return s&&s.edgeWeight>=.01?{x,y,s,z:p.z+h.contact.atModel(x,y,p.z)}:null;};
for(let id=148;id<172;id++){
 const g=h.guides[id];if(g.c.getPoint(.8).z<0)continue;
 const side=g.c.getPoint(.75).x<0?0:1,points=[];
 for(let j=0;j<=60;j++){
  const t=j/60,{f,shape,depth,inset,undulate}=h.section(g,t);if(f.p.y>=-1.74)continue;
  for(const k of[0,4,5,6,7]){
   const a=k*Math.PI/4,p=f.p.clone().addScaledVector(f.s,g.w*shape*Math.cos(a)*undulate).addScaledVector(f.n,inset+depth*shape*Math.sin(a)),s=at(p);if(!s)continue;
   const pull=probe.sample(h.metrics.__field,side,p.x,p.y+2.95),z=p.z-pull+h.contact.atModel(s.x,s.y,p.z-pull);
   points.push({y:s.y,before:(s.z-s.s.point.z)*s.s.normal.z,after:(z-s.s.point.z)*s.s.normal.z,pull});
  }
 }
 const min=a=>Math.min(...a),median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
 sides.push({guide:id,side:side===0?'left':'right',samples:points.length,baselineInside:points.filter(p=>p.before<-.001).length,minBaseline:min(points.map(p=>p.before)),newInsideIfCarried:points.filter(p=>p.before>=.001&&p.after<-.001).length,worsenedInheritedIfCarried:points.filter(p=>p.before<0&&p.after<p.before-.001).length,minAfterIfCarried:min(points.map(p=>p.after))});
 for(const y of[.9,.6,.3,0,-.3,-.6]){const a=points.filter(p=>Math.abs(p.y-y)<.15);if(a.length)rows.push({guide:id,side:side===0?'left':'right',y,medianBefore:median(a.map(p=>p.before)),medianAfterIfCarried:median(a.map(p=>p.after)),medianProposedPull:median(a.map(p=>p.pull))});}
}
const result={sourceOnly:true,geometryUnmodified:true,note:'Hypothetical exact common field at protected side points. This does not apply a candidate sweep to those guides.',sides,rows};
fs.writeFileSync('review/guide-placement118-dependency.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({sides,rows:rows.filter(p=>p.y===.6)}));
