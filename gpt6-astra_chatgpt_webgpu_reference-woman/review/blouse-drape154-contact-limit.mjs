import fs from 'node:fs';
import {Matrix4,read} from './torso-depth110-harness.mjs';
const block=JSON.parse(fs.readFileSync('review/blouse-drape154-contact-block-018.json','utf8')),coarse=JSON.parse(fs.readFileSync('review/blouse-drape154-coarse-data.json','utf8')),a0=block.spec.crest;
const current=read('review/blouse-drape-candidate154.js'),matches=current.match(/crest:\.\d+,trough:/g);
if(matches?.length!==1)throw Error('154 bound requires one explicit crest coefficient.');
const marker=`crest:${a0.toFixed(3).replace(/^0/, '')},trough:`,source=current.replace(matches[0],marker);
const spec=new Function('Matrix4',source+';return BLOUSE154_SPEC;')(Matrix4);
if(JSON.stringify(spec)!==JSON.stringify(block.spec))throw Error('154 bounded field changed beyond the diagnosed crest coefficient.');
const api=s=>new Function('Matrix4',s+';return blouseDrapeJet154;')(Matrix4),f0=api(source),f1=api(source.replace(marker,'crest:1,trough:'));
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function overlap(a,b){
 let p=a.map(v=>v.slice(0,2));const sign=Math.sign(orient(...b));
 for(let k=0;k<3;k++){
  const c=b[k],d=b[(k+1)%3],q=[];
  for(let i=0;i<p.length;i++){
   const s=p[i],t=p[(i+1)%p.length],ds=sign*orient(c,d,s),dt=sign*orient(c,d,t),ins=ds>=-1e-13,int=dt>=-1e-13;
   if(ins)q.push(s);if(ins!==int){const z=ds/(ds-dt);q.push([s[0]+z*(t[0]-s[0]),s[1]+z*(t[1]-s[1])]);}
  }
  p=q;if(!p.length)break;
 }
 return p;
}
function bary(t,p){const d=orient(...t),u=orient(t[0],p,t[2])/d,v=orient(t[0],t[1],p)/d;return[1-u-v,u,v];}
const rows=[];let bound=Infinity;
for(const ex of block.hairRisk.triangleContacts.examples){
 const ids=coarse.index.slice(ex.bodyTriangle*3,ex.bodyTriangle*3+3),ec=ids.map(i=>{const x=coarse.before[i*3],y=coarse.before[i*3+1],b=new Float64Array(6),c=new Float64Array(6);f0(x,y,b);f1(x,y,c);return(c[0]-b[0])/(1-a0);});
 for(const p of overlap(ex.body,ex.hair)){
  const wb=bary(ex.body,p),wh=bary(ex.hair,p),zb=wb.reduce((s,w,i)=>s+w*ex.body[i][2],0),zh=wh.reduce((s,w,i)=>s+w*ex.hair[i][2],0),w=wb.reduce((s,v,i)=>s+v*ec[i],0);
  if(w<=1e-9)continue;const a=(zh-zb+a0*w-.0005)/w;bound=Math.min(bound,a);rows.push({bodyTriangle:ex.bodyTriangle,hairTriangle:ex.hairTriangle,point:p,currentGap:zh-zb,crestWeight:w,coefficientUpperBound:a});
 }
}
const report={candidate:154,source:'Exact projected overlap vertices of all stored new contact pairs from the blocked .018 coarse surface.',currentCoefficient:a0,margin:.0005,minimumCrestCoefficientBound:bound,proposedCrest:Math.max(0,Math.floor(bound*1000)/1000),samples:rows.length,rows,qualification:'Bound concerns these observed newly crossing front pairs. A complete focused triangle check must still confirm no new pair elsewhere after the restrained coefficient; no pair tolerance is changed.'};
fs.writeFileSync('review/blouse-drape154-contact-limit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
