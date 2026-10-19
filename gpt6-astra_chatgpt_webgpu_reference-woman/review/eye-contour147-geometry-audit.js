import config from './eye-contour147-config.json' with {type:'json'};
import {createEyeContourField147} from './eye-contour147-field.js';
import {triangleDistanceSquared144} from './near-ear144-geometry.mjs';

// QA only: actual finite triangles, independent of the authored normals.
// The narrow phase reuses the frozen, analytically fixture-checked triangle
// distance routine. The new BVH limits queries to the changed support.
const sub=(a,b)=>a.map((v,k)=>v-b[k]),dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const xyz=(a,i)=>[a[i*3],a[i*3+1],a[i*3+2]];
const overlap=(a,b,pad=0)=>a.min.every((v,k)=>v<=b.max[k]+pad&&a.max[k]+pad>=b.min[k]);
const emptyBox=()=>({min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});
const include=(a,b)=>{for(let k=0;k<3;k++){a.min[k]=Math.min(a.min[k],b.min[k]);a.max[k]=Math.max(a.max[k],b.max[k]);}return a;};
const box=p=>({min:[0,1,2].map(k=>Math.min(...p.map(v=>v[k]))),max:[0,1,2].map(k=>Math.max(...p.map(v=>v[k])))});
const changed=(a,b,i)=>a[i*3]!==b[i*3]||a[i*3+1]!==b[i*3+1]||a[i*3+2]!==b[i*3+2];

export function worldPositions147(geometry,matrix){
 const p=geometry.getAttribute('position'),m=matrix.elements||matrix,out=new Float64Array(p.count*3);
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);out[i*3]=m[0]*x+m[4]*y+m[8]*z+m[12];out[i*3+1]=m[1]*x+m[5]*y+m[9]*z+m[13];out[i*3+2]=m[2]*x+m[6]*y+m[10]*z+m[14];}
 return out;
}

export function triangleOrientation147(before,after,index,field=createEyeContourField147(config)){
 const report={changedTriangles:0,preexistingDegenerate:0,newDegenerate:0,opposedToTransportedGeometry:0,minimumAreaRatio:Infinity,minimumExpectedNormalDot:1,minimumArea:Infinity,examples:[]};
 for(let t=0;t<index.length;t+=3){
  const ids=[index[t],index[t+1],index[t+2]];if(!ids.some(i=>changed(before,after,i)))continue;
  report.changedTriangles++;const a=ids.map(i=>xyz(before,i)),b=ids.map(i=>xyz(after,i)),n0=cross(sub(a[1],a[0]),sub(a[2],a[0])),n1=cross(sub(b[1],b[0]),sub(b[2],b[0])),l0=Math.hypot(...n0),l1=Math.hypot(...n1);
  if(l0<1e-13){report.preexistingDegenerate++;continue;}
  if(l1<1e-13){report.newDegenerate++;continue;}
  report.minimumArea=Math.min(report.minimumArea,l1/2);report.minimumAreaRatio=Math.min(report.minimumAreaRatio,l1/l0);
  const c=[0,1,2].map(k=>(a[0][k]+a[1][k]+a[2][k])/3),sample=field.world(...c),j=sample.jacobian,d=sample.determinant,
   vx=(j[4]*n0[0]-j[3]*n0[1])/d,vy=(-j[1]*n0[0]+j[0]*n0[1])/d,vz=n0[2]-j[2]*vx-j[5]*vy,
   agreement=(vx*n1[0]+vy*n1[1]+vz*n1[2])/(Math.hypot(vx,vy,vz)*l1);
  report.minimumExpectedNormalDot=Math.min(report.minimumExpectedNormalDot,agreement);
  if(agreement<=0){report.opposedToTransportedGeometry++;if(report.examples.length<6)report.examples.push({triangle:t/3,agreement});}
 }
 if(!Number.isFinite(report.minimumAreaRatio))report.minimumAreaRatio=null;
 if(!Number.isFinite(report.minimumArea))report.minimumArea=null;
 return report;
}

function triangles(before,after,index,{onlyChanged=false,roi=null}={}){
 const out=[];
 for(let t=0;t<index.length;t+=3){
  const ids=[index[t],index[t+1],index[t+2]],isChanged=ids.some(i=>changed(before,after,i));if(onlyChanged&&!isChanged)continue;
  const p=ids.map(i=>xyz(before,i)),q=after===before?p:ids.map(i=>xyz(after,i)),bounds=include(box(p),box(q));
  if(roi&&!overlap(bounds,roi))continue;
  if(Math.hypot(...cross(sub(p[1],p[0]),sub(p[2],p[0])))<1e-13)continue;
  out.push({id:t/3,ids,before:{p},after:{p:q},changed:isChanged,...bounds});
 }
 return out;
}
function tree(list){
 if(!list.length)return null;const bounds=emptyBox();for(const t of list)include(bounds,t);
 if(list.length<=12)return{...bounds,list};
 const spans=bounds.max.map((v,k)=>v-bounds.min[k]),axis=spans.indexOf(Math.max(...spans));list.sort((a,b)=>(a.min[axis]+a.max[axis])-(b.min[axis]+b.max[axis]));
 const middle=list.length>>1;return{...bounds,left:tree(list.slice(0,middle)),right:tree(list.slice(middle))};
}
function query(node,bounds,pad,visit){if(!node||!overlap(node,bounds,pad))return;if(node.list){for(const t of node.list)if(overlap(t,bounds,pad))visit(t);}else{query(node.left,bounds,pad,visit);query(node.right,bounds,pad,visit);}}

export function boundedContact147(moving,obstacles,{window=.001,tolerance=1e-8,maximumExamples=6,preparedTree=null}={}){
 const hierarchy=preparedTree||tree(obstacles.slice()),threshold=tolerance*tolerance,window2=window*window;
 const out={movingTriangles:moving.length,obstacleTriangles:obstacles.length,exactPairs:0,window,tolerance,minimumBeforeWithinWindow:null,minimumAfterWithinWindow:null,beforeContacts:0,afterContacts:0,newContactPairs:0,removedContactPairs:0,examples:[]};
 let beforeMin=Infinity,afterMin=Infinity;
 for(const a of moving)query(hierarchy,a,window,b=>{
  out.exactPairs++;const d0=triangleDistanceSquared144(a.before,b.before),d1=triangleDistanceSquared144(a.after,b.after);
  if(d0<=window2)beforeMin=Math.min(beforeMin,d0);if(d1<=window2)afterMin=Math.min(afterMin,d1);
  const old=d0<=threshold,next=d1<=threshold;if(old)out.beforeContacts++;if(next)out.afterContacts++;
  if(!old&&next){out.newContactPairs++;if(out.examples.length<maximumExamples)out.examples.push({moving:a.id,obstacle:b.id,beforeDistance:Math.sqrt(d0),afterDistance:Math.sqrt(d1)});}
  if(old&&!next)out.removedContactPairs++;
 });
 out.minimumBeforeWithinWindow=Number.isFinite(beforeMin)?Math.sqrt(beforeMin):null;out.minimumAfterWithinWindow=Number.isFinite(afterMin)?Math.sqrt(afterMin):null;
 out.noPairMeaning='A null minimum certifies no evaluated surface pair within the stated window; it is not an unbounded global closest-point measurement.';
 return out;
}

/** Original records retain source geometry only for this QA call. */
export function inspectEyeContourGeometry147(records,hairMeshes=[]){
 const start=performance.now(),field=createEyeContourField147(config),parts=[],orientation=[],changedParts=[],roi=emptyBox();
 for(const r of records){
  const before=worldPositions147(r.geometry,r.mesh.matrixWorld),after=r.mesh.geometry===r.geometry?before:worldPositions147(r.mesh.geometry,r.mesh.matrixWorld),index=r.geometry.index?.array||Uint32Array.from({length:before.length/3},(_,i)=>i);
  const part={name:r.mesh.name,label:r.label||`${r.mesh.parent?.name}/${r.mesh.name}`,side:r.side||0,before,after,index};parts.push(part);
  if(after===before)continue;
  const finite=triangleOrientation147(before,after,index,field),moving=triangles(before,after,index,{onlyChanged:true});orientation.push({surface:part.label,...finite});
  if(moving.length){part.moving=moving;changedParts.push(part);for(const t of moving)include(roi,t);}
 }
 if(!changedParts.length)return{changedTriangles:0,orientation:[],ocularContacts:[],hairContacts:[],elapsedMs:performance.now()-start,privateQABuffersRetainedInReport:false};
 const padded={min:roi.min.map(v=>v-.001),max:roi.max.map(v=>v+.001)},ocularContacts=[];
 for(const side of[-1,1]){
  const get=name=>parts.find(p=>p.name===name&&(name==='continuous-face'||p.side===side));
  for(const [aName,bName]of[['brown-iris-and-pupil','transparent-corneal-dome'],['sculpted-eyelids','transparent-corneal-dome'],['sculpted-eyelids','scleral-globe'],['sculpted-eyelids','continuous-face']]){
   const a=get(aName),b=get(bName);if(!a||!b)continue;
   ocularContacts.push({side,surfaces:[aName,bName],...boundedContact147(a.moving||[],triangles(b.before,b.after,b.index,{roi:padded}))});
  }
 }
 const hairContacts=[];
 for(const mesh of hairMeshes){
  // One scan transforms a single hair mesh; triangles are retained only when
  // their actual world bounds meet the affected head support. Lower groom
  // triangles never enter the BVH or its narrow-phase pair comparisons.
  const positions=worldPositions147(mesh.geometry,mesh.matrixWorld),index=mesh.geometry.index.array,obstacles=triangles(positions,positions,index,{roi:padded});
  if(!obstacles.length){hairContacts.push({name:mesh.name,allTriangles:index.length/3,roiTriangles:0,parts:[]});continue;}
  const row={name:mesh.name,allTriangles:index.length/3,roiTriangles:obstacles.length,parts:[]},preparedTree=tree(obstacles.slice());
  for(const part of changedParts){
   const own=part.moving.filter(t=>overlap(t,padded));if(!own.length)continue;
   row.parts.push({surface:part.label,...boundedContact147(own,obstacles,{preparedTree})});
  }
  hairContacts.push(row);
 }
 return{changedTriangles:orientation.reduce((s,p)=>s+p.changedTriangles,0),affectedWorldBounds:roi,orientation,ocularContacts,hairContacts,
  authoredNormalInterpretation:'Finite-triangle normals are checked against transported baseline geometric normals at the original centroid. This does not compare authored normals with geometric normals or flatten them.',
  contactInterpretation:'Actual affected head triangles and bounds-overlapping static hair triangles only. Core ocular pairs are explicit. Pair changes are reported relative to preexisting contact, not silently declared new visual intersections.',
  elapsedMs:performance.now()-start,privateQABuffersRetainedInReport:false};
}
