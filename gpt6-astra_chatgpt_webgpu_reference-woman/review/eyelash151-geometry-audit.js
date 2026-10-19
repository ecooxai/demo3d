import {triangleDistanceSquared144} from './near-ear144-geometry.mjs';
import {lashParts151} from './eyelash-candidate151.js';
import {V151} from './eyelash-sweep151.js';
const {add,sub,scale,dot,cross}=V151,norm=a=>Math.hypot(...a),xyz=(a,i)=>[a[i*3],a[i*3+1],a[i*3+2]];
const box=p=>({min:[0,1,2].map(k=>Math.min(...p.map(v=>v[k]))),max:[0,1,2].map(k=>Math.max(...p.map(v=>v[k])))});
const empty=()=>({min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});
const include=(a,b)=>{for(let k=0;k<3;k++){a.min[k]=Math.min(a.min[k],b.min[k]);a.max[k]=Math.max(a.max[k],b.max[k]);}return a;};
const overlap=(a,b,pad=0)=>a.min.every((v,k)=>v<=b.max[k]+pad&&a.max[k]+pad>=b.min[k]);
export function worldPositions151(geometry,matrix){
 const a=matrix.elements,p=geometry.getAttribute('position'),out=new Float64Array(p.count*3);
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);out[i*3]=a[0]*x+a[4]*y+a[8]*z+a[12];out[i*3+1]=a[1]*x+a[5]*y+a[9]*z+a[13];out[i*3+2]=a[2]*x+a[6]*y+a[10]*z+a[14];}return out;
}
function triangles(before,after,index,{roi=null,frontGroups=null,parts=null}={}){
 const rows=[];let partIndex=0;
 for(let t=0;t<index.length;t+=3){
  if(frontGroups&&!frontGroups.some(g=>t>=g.start&&t<g.start+g.count))continue;
  const ids=[index[t],index[t+1],index[t+2]],a=ids.map(i=>xyz(before,i)),b=after===before?a:ids.map(i=>xyz(after,i)),bounds=include(box(a),box(b));if(roi&&!overlap(bounds,roi))continue;
  if(norm(cross(sub(a[1],a[0]),sub(a[2],a[0])))<1e-13)continue;
  let fiber=null,rootStrip=false;if(parts){while(partIndex<parts.length-1&&t/3>=parts[partIndex].triangle+parts[partIndex].triangles)partIndex++;fiber=parts[partIndex];rootStrip=t/3<fiber.triangle+6;}
  rows.push({id:t/3,ids,before:{p:a},after:{p:b},fiber:fiber?{upper:fiber.upper,index:fiber.index}:null,rootStrip,...bounds});
 }return rows;
}
function tree(list){
 if(!list.length)return null;const bounds=empty();for(const t of list)include(bounds,t);if(list.length<=12)return{...bounds,list};
 const spans=bounds.max.map((v,k)=>v-bounds.min[k]),axis=spans.indexOf(Math.max(...spans));list.sort((a,b)=>a.min[axis]+a.max[axis]-b.min[axis]-b.max[axis]);const mid=list.length>>1;
 return{...bounds,left:tree(list.slice(0,mid)),right:tree(list.slice(mid))};
}
function query(node,bounds,pad,visit){if(!node||!overlap(node,bounds,pad))return;if(node.list){for(const b of node.list)if(overlap(b,bounds,pad))visit(b);}else{query(node.left,bounds,pad,visit);query(node.right,bounds,pad,visit);}}
function contact(moving,obstacles,{window=.001,tolerance=1e-8,hierarchy=tree(obstacles.slice())}={}){
 const threshold=tolerance*tolerance,window2=window*window,row={movingTriangles:moving.length,obstacleTriangles:obstacles.length,window,tolerance,exactPairs:0,beforeContacts:0,afterContacts:0,newContactPairs:0,removedContactPairs:0,minimumBeforeWithinWindow:null,minimumAfterWithinWindow:null,examples:[]};let oldMin=Infinity,nextMin=Infinity;
 for(const a of moving)query(hierarchy,a,window,b=>{
  row.exactPairs++;const d0=triangleDistanceSquared144(a.before,b.before),d1=triangleDistanceSquared144(a.after,b.after),old=d0<=threshold,next=d1<=threshold;
  if(d0<=window2)oldMin=Math.min(oldMin,d0);if(d1<=window2)nextMin=Math.min(nextMin,d1);if(old)row.beforeContacts++;if(next)row.afterContacts++;
  if(!old&&next){row.newContactPairs++;if(row.examples.length<6)row.examples.push({movingTriangle:a.id,obstacleTriangle:b.id,fiber:a.fiber,rootStrip:a.rootStrip,beforeDistance:Math.sqrt(d0),afterDistance:Math.sqrt(d1)});}
  if(old&&!next)row.removedContactPairs++;
 });
 row.minimumBeforeWithinWindow=Number.isFinite(oldMin)?Math.sqrt(oldMin):null;row.minimumAfterWithinWindow=Number.isFinite(nextMin)?Math.sqrt(nextMin):null;return row;
}
function orientation(before,after,index){
 const out={triangles:index.length/3,changedTriangles:0,preexistingDegenerate:0,newDegenerate:0,newRadialReversals:0,minimumAreaRatio:Infinity,minimumArea:Infinity,minimumGeometricNormalDot:1,minimumRadialCosine:1};
 const centers=new Map(),center=(array,v,part)=>{const ring=Math.floor((v-part.vertex)/4),key=(array===before?'old:':'new:')+(part.vertex+ring*4);if(!centers.has(key))centers.set(key,scale(add(add(xyz(array,part.vertex+ring*4),xyz(array,part.vertex+ring*4+1)),xyz(array,part.vertex+ring*4+2)),1/3));return centers.get(key);};
 for(const part of lashParts151())for(let t=part.triangle;t<part.triangle+part.triangles;t++){
  const ids=[0,1,2].map(k=>index[t*3+k]),a=ids.map(i=>xyz(before,i)),b=ids.map(i=>xyz(after,i));if(ids.every(i=>[0,1,2].every(k=>before[i*3+k]===after[i*3+k])))continue;out.changedTriangles++;
  const n0=cross(sub(a[1],a[0]),sub(a[2],a[0])),n1=cross(sub(b[1],b[0]),sub(b[2],b[0])),l0=norm(n0),l1=norm(n1);if(l0<1e-13){out.preexistingDegenerate++;continue;}if(l1<1e-13){out.newDegenerate++;continue;}
  const r0=scale(ids.reduce((v,i)=>add(v,sub(xyz(before,i),center(before,i,part))),[0,0,0]),1/3),r1=scale(ids.reduce((v,i)=>add(v,sub(xyz(after,i),center(after,i,part))),[0,0,0]),1/3),old=dot(n0,r0)/(l0*norm(r0)),next=dot(n1,r1)/(l1*norm(r1));
  out.minimumArea=Math.min(out.minimumArea,l1/2);out.minimumAreaRatio=Math.min(out.minimumAreaRatio,l1/l0);out.minimumGeometricNormalDot=Math.min(out.minimumGeometricNormalDot,dot(n0,n1)/(l0*l1));out.minimumRadialCosine=Math.min(out.minimumRadialCosine,next);if(old>0&&next<=0)out.newRadialReversals++;
 }
 if(!out.changedTriangles){out.minimumAreaRatio=null;out.minimumArea=null;}return out;
}

/** Records are QA-only original geometry references; this retains none. */
export function inspectEyelashes151(records,fringe=null){
 const start=performance.now(),lashes=records.filter(r=>r.mesh.name==='individual-eyelashes'),orientationRows=[],ocular=[],hair=[];
 for(const record of lashes){
  const before=worldPositions151(record.geometry,record.mesh.matrixWorld),after=record.mesh.geometry===record.geometry?before:worldPositions151(record.mesh.geometry,record.mesh.matrixWorld),index=record.geometry.index.array,moving=triangles(before,after,index,{parts:lashParts151()}),bounds=empty();for(const t of moving)include(bounds,t);
  const roi={min:bounds.min.map(v=>v-.001),max:bounds.max.map(v=>v+.001)},root=moving.filter(t=>t.rootStrip),distal=moving.filter(t=>!t.rootStrip),eye=record.mesh.parent.name;
  orientationRows.push({eye,...orientation(before,after,index)});
  for(const name of['sculpted-eyelids','upper-lash-margin','lower-waterline','lower-tear-meniscus','scleral-globe','transparent-corneal-dome','brown-iris-and-pupil','continuous-face']){
   const obstacle=records.find(r=>r.mesh.name===name&&(name==='continuous-face'||r.mesh.parent.name===eye));if(!obstacle)continue;
   const positions=worldPositions151(obstacle.geometry,obstacle.mesh.matrixWorld),frontGroups=name==='continuous-face'?obstacle.geometry.groups.filter(g=>g.materialIndex===0):null,rows=triangles(positions,positions,obstacle.geometry.index.array,{roi,frontGroups}),hierarchy=tree(rows.slice());
   ocular.push({eye,obstacle:name,allObstacleTriangles:obstacle.geometry.index.count/3,roiObstacleTriangles:rows.length,rootStrip:contact(root,rows,{hierarchy}),distal:contact(distal,rows,{hierarchy})});
  }
  if(fringe){
   const positions=worldPositions151(fringe.geometry,fringe.matrixWorld),rows=triangles(positions,positions,fringe.geometry.index.array,{roi}),hierarchy=tree(rows.slice());
   hair.push({eye,obstacle:fringe.name,allObstacleTriangles:fringe.geometry.index.count/3,roiObstacleTriangles:rows.length,rootStrip:contact(root,rows,{hierarchy}),distal:contact(distal,rows,{hierarchy})});
  }
 }
 return{orientation:orientationRows,ocularContacts:ocular,fringeContacts:hair,elapsedMs:performance.now()-start,
  interpretation:'Actual finite triangles in one world frame. First strips contain the fixed root rings but their other rings can move; their contacts are reported separately, not silently excused. Distal changes are relative to the current147/149 baseline. Only bounds-overlapping ocular/front-face/fringe triangles enter the narrow phase. Null distances mean no evaluated pair within .001; they are not global clearance claims. Existing/new pair identities do not alone establish a visible artifact.',
  retainedQAGeometryArrays:false};
}
