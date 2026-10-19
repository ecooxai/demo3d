import measurement from './likeness145-native.json' with {type:'json'};
import config from './eye-contour147-config.json' with {type:'json'};
import {createEyeContourField147} from './eye-contour147-field.js';

export const controls147=measurement.cases.find(c=>c.view==='front').points.slice(0,20);
export function side147(mesh){
 if(mesh.__side147)return mesh.__side147;
 for(let p=mesh.parent;p;p=p.parent){if(p.name==='left-eye')return-1;if(p.name==='right-eye')return 1;}
 return 0;
}
export function photoXY147(world){
 const{a,b,worldOrigin,photoOrigin}=config.frame,x=world[0]-worldOrigin[0],y=world[1]-worldOrigin[1];
 return[photoOrigin[0]+a*x+b*y,photoOrigin[1]+b*x-a*y];
}
export function sampleStoredControls147(head,{requireBaseline=false}={}){
 const meshes=[];head.traverse(m=>{if(m.isMesh)meshes.push(m);});const field=createEyeContourField147(config),rows=[];
 for(const c of controls147){
  const candidates=meshes.filter(m=>m.name===c.mesh&&(!c.side||side147(m)===c.side));
  if(candidates.length!==1)throw Error(`147 stored control requires one ${c.label} surface.`);
  const mesh=candidates[0],g=mesh.geometry,p=g.getAttribute('position'),s=c.surface,m=mesh.matrixWorld.elements;
  const vertices=s.vertices||[s.vertex],weights=s.barycentric||[1];
  if(vertices.some(i=>!Number.isInteger(i)||i<0||i>=p.count))throw Error('147 stored control vertex outside geometry.');
  if(s.vertices&&s.vertices.some((v,k)=>g.index.getX(s.triangle*3+k)!==v))throw Error('147 stored front triangle order drifted: '+c.label);
  const local=[0,1,2].map(k=>vertices.reduce((sum,i,j)=>sum+p.array[i*3+k]*weights[j],0)),world=[0,1,2].map(k=>m[k]*local[0]+m[k+4]*local[1]+m[k+8]*local[2]+m[k+12]),photo=photoXY147(world),sourceWorld=s.world;
  const baselineWorldError=Math.hypot(...world.map((v,k)=>v-sourceWorld[k]));
  if(requireBaseline&&baselineWorldError>1e-6)throw Error('147 actual source control differs from corrected145: '+c.label);
  const control=config.controls.find(x=>x.index===c.index),target=control?control.at.map((v,k)=>v+control.delta[k]):null,
   analytic=field.world(...sourceWorld),continuousTarget=photoXY147(sourceWorld.map((v,k)=>v+analytic.delta[k]));
  rows.push({index:c.index,label:c.label,mesh:c.mesh,side:c.side,method:s.method,vertices,weights,world,photo,
   manualPhoto:c.photo,manualResidual:photo.map((v,k)=>v-c.photo[k]),fixedFieldControlTarget:target,
   controlResidual:target?photo.map((v,k)=>v-target[k]):null,
   continuousFieldTarget:continuousTarget,finiteTriangleResidual:photo.map((v,k)=>v-continuousTarget[k]),
   baselineWorldError,worldZChange:world[2]-sourceWorld[2]});
 }
 return{points:rows,frame:config.frame,provenance:'Corrected145 front triangle barycentric weights or explicitly rounded boundary vertices; same20 existing manual points; no new image extraction, UV search, camera fitting or visibility/ray claim.'};
}
