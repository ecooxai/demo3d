// Read-only accepted133 path sampling. Geometry emitters are omitted in memory;
// all upstream random draws and the accepted final133 curve construction remain.
import fs from 'node:fs';
import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
let source=read('review/hair-groom-candidate133.js');
for(const name of['longLock','ribbon','roundFiber'])source=source.replace(`function ${name}(`,`function unused146_${name}(`);
source+='\nfunction longLock(){} function ribbon(){} function roundFiber(){}';
source=source.replace(" const start=performance.now(),root=new THREE.Group();", " const captured146=[];const start=performance.now(),root=new THREE.Group();");
const marker='fringeStats108.sourceSlots++;';
if(source.split(marker).length!==2)throw Error('Accepted133 capture marker changed.');
source=source.replace(marker,marker+'captured146.push({group,k,side,u,v0,v1,root,strand,keepCore,loose});');
const stop=source.indexOf(' // Short edge hairs continue the crown tangent');
if(stop<0)throw Error('Accepted133 fringe boundary changed.');
source=source.slice(0,stop)+' return captured146;}\nfunction longLock(){} function ribbon(){} function roundFiber(){}';
const rows=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118)({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1});
const heights=[.74,.76,.78,.73,.63,.50],arr=p=>[p.x,p.y,p.z],results=[];
for(let group=0;group<6;group++){
 const rs=rows.filter(r=>r.group===group&&(r.keepCore||r.loose)),mid=rs[Math.floor(rs.length/2)],target=heights[group];let lo=0,hi=1;
 for(let i=0;i<30;i++){const t=(lo+hi)/2;if(mid.strand.getPoint(t).y>target)lo=t;else hi=t;}
 const t=(lo+hi)/2,p=mid.strand.getPoint(t),d=mid.strand.getTangent(t);
 results.push({group,sourceSlots:rows.filter(r=>r.group===group).length,emittedStrands:rs.length,medianK:mid.k,medianRootU:mid.u,oldLastRootV:mid.v1,rootStart:arr(mid.root[0]),oldLastRoot:arr(mid.root.at(-1)),proposedProtectedFromY:target,medianProtectedFromT:t,medianJoin:arr(p),medianJoinTangent:arr(d),lowerTerminal:arr(mid.strand.getPoint(1))});
}
const report={version:'read-only146-fringe-path-ownership',candidateImplemented:false,baseline:'Frozen accepted133 final curves',groups:results,notes:['No emitted positions, normals or source files are changed.','Heights are proposed ownership bounds, not an implemented shape. Each actual strand would receive its own fixed accepted-curve parameter cut.','Group0 cut is below its old133 start nearY .90, explicitly relaxing that upper part of133 while preserving the accepted diagonal through the outer brow/temple and all lower ends.','All six lower curves must be returned from the frozen original curve at the original t after their cuts; do not regenerate133 with a changed input curve.']};
fs.writeFileSync('review/crown146-root-probe.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
