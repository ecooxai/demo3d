import fs from 'node:fs';
import {construct143,ids143,selected143,THREE} from './near-curtain143-source.mjs';
import {modelPoint} from './lower-clump126-source.mjs';

const start=performance.now(),old=construct143(false,{baseline:true,massOnly:true,capture:true}),on=construct143(true,{massOnly:true,capture:true});
const arrays=g=>{const p=g.mesh.geometry.attributes.position,a=new Float64Array(p.count*3);for(let i=0;i<p.count;i++)a.set(modelPoint(p.getX(i),p.getY(i),p.getZ(i)),i*3);return a;};
const oldP=arrays(old),newP=arrays(on),index=on.mesh.geometry.index.array,p=on.mesh.geometry.attributes.position,n=on.mesh.geometry.attributes.normal,op=old.mesh.geometry.attributes.position,onormal=old.mesh.geometry.attributes.normal;
let protectedPositionChanges=0,protectedNormalChanges=0,upperPositionChanges=0,upperNormalChanges=0,nonfinite=0,maxNormalError=0;
for(let i=0;i<p.count;i++){
 const selected=selected143.has(Math.floor(i/549)),upper=old.mesh.__rawPosition[i*3+1]>=-1.05,sameP=[0,1,2].every(k=>p.array[i*3+k]===op.array[i*3+k]),sameN=[0,1,2].every(k=>n.array[i*3+k]===onormal.array[i*3+k]);
 if(!selected&&!sameP)protectedPositionChanges++;if(!selected&&!sameN)protectedNormalChanges++;if(upper&&!sameP)upperPositionChanges++;if(upper&&!sameN)upperNormalChanges++;
 const length=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));if(!Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)+length))nonfinite++;maxNormalError=Math.max(maxNormalError,Math.abs(length-1));
}
const point=(a,i)=>new THREE.Vector3(a[i*3],a[i*3+1],a[i*3+2]);
const centers=new Map();for(const gid of ids143){const g=on.guides[gid],a=[],b=[];for(let j=0;j<=60;j++){a.push(on.toModel(g.c.getPoint(j/60),g.deformEar));b.push(on.toModel(g.near143.original.c.getPoint(j/60),g.deformEar));}centers.set(gid,{old:b,new:a});}
const inspect=(array,ids,cs,gid)=>{
 const a=point(array,ids[0]),b=point(array,ids[1]),c=point(array,ids[2]),normal=b.clone().sub(a).cross(c.clone().sub(a)),center=new THREE.Vector3(),q=a.clone().addScaledVector(b,1).addScaledVector(c,1).multiplyScalar(1/3);
 for(const i of ids)center.addScaledVector(cs[Math.floor((i-gid*549)/9)],1/3);
 const radial=q.sub(center),area=Math.sqrt(normal.lengthSq()),r=Math.sqrt(radial.lengthSq());return{area,cosine:area*r>1e-16?normal.dot(radial)/(area*r):0};
};
let triangles=0,negativeOld=0,negativeNew=0,introducedNegative=0,minArea=Infinity,minCosine=Infinity;const failures=[];
for(const gid of ids143)for(let ti=gid*960;ti<(gid+1)*960;ti++){
 const j=Math.floor((ti-gid*960)/16),g=on.guides[gid];if(g.near143.original.c.getPoint((j+.5)/60).y>=-2.15)continue;
 const ids=[index[ti*3],index[ti*3+1],index[ti*3+2]],cs=centers.get(gid),a=inspect(oldP,ids,cs.old,gid),b=inspect(newP,ids,cs.new,gid);triangles++;minArea=Math.min(minArea,b.area);minCosine=Math.min(minCosine,b.cosine);
 if(a.cosine<-.001)negativeOld++;if(b.cosine<-.001){negativeNew++;if(a.cosine>=-.001){introducedNegative++;if(failures.length<20)failures.push({gid,triangle:ti,old:a,new:b});}}
}
const result={sourceOnly:true,score:77,selectedGuides:ids143.length,triangles,nonfinite,maxNormalError,protectedPositionChanges,protectedNormalChanges,upperPositionChanges,upperNormalChanges,minDoubleArea:minArea,minOutwardRadialCosine:minCosine,negativeOld,negativeNew,introducedNegative,failures,elapsedMs:performance.now()-start,scope:'Outward radial orientation on actual emitted lower MASS triangles relative to the weighted corresponding center-line ring positions after86. A negative case is a concrete local section fold candidate, not a global intersection proof.'};
fs.writeFileSync('review/near-curtain143-orientation.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
