import fs from 'node:fs';
import {sourceHead147,THREE,Attr,Geometry,Matrix4,I,mul,T,RY,RZ,point,object,attach} from './eye-contour147-source.mjs';
import {applyEyeContour147} from '../src/eye-contour.js';
import {applyJawSilhouette155} from './jaw-silhouette-candidate155.js';
export {THREE,Attr,Geometry,Matrix4,I,mul,T,RY,RZ,point,object,attach};
const clean=text=>text.replace(/^import[^\n]*\n/gm,'').replace(/export /g,'');
const read=file=>clean(fs.readFileSync(file,'utf8'));
const neckSource=new Function('THREE',read('src/blouse.js')+'\nreturn {createNeck};')(THREE);
const proportions=new Function('Matrix4',read('src/portrait-proportions.js')+'\nreturn {deformMeshes};')(Matrix4);
const pose=new Function('Matrix4',read('src/portrait-pose.js')+'\nreturn {neckFrames,translateNeck};')(Matrix4);
const balance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4);
function nameLookup(root){
  root.traverse(o=>{o.getObjectByName=function(name){let found=null;const visit=n=>{if(found)return;if(n.name===name){found=n;return;}for(const c of n.children||[])visit(c);};visit(this);return found;};o.isObject3D=true;o.userData??={};});return root;
}

/** Local source arithmetic only. Runtime162 always reads actual prepared159
 * Three buffers. This fixture has the exact source lower-head/neck grids and
 * accepted Float32 operation order; omitted face accessories/photographic maps
 * are not substitutes for the native complete-scene checks or artwork. */
export function preparedSource162(){
  const head=sourceHead147();applyEyeContour147(head,{strength:1});
  const H0=mul(T(0,2.95,0),mul(RY(.16),RZ(-.17))),B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0)));
  const raw=neckSource.createNeck().children[0],neck=object('original-neck-and-clavicle-transition',B),neckMesh=attach(neck,raw.name,raw.geometry,B,raw.material);
  proportions.deformMeshes([neckMesh],object('head-before-pose',H0),neck);
  pose.translateNeck(pose.neckFrames(neck,.26),.26);
  const neckModel=object('model');neckModel.add(neck);balance(neckModel,{shiftX:-.24});
  const model=object('source162-complete-selected-surfaces');model.add(head,neck);nameLookup(model);
  const face=model.getObjectByName('continuous-face');
  face.material=[{name:'source-only-front-face',roughness:.53,specularIntensity:.23,map:{source:'existing face atlas placeholder'},vertexColors:false},
    {name:'source-only-rear-face',roughness:.49,specularIntensity:.36,map:{source:'existing rear atlas placeholder'},vertexColors:false}];
  neckMesh.material={...neckMesh.material,vertexColors:false,roughness:.56,sheen:.025,map:{source:'existing neck atlas placeholder'}};
  const before={face:face.geometry,neck:neckMesh.geometry};
  const metrics155=applyJawSilhouette155(model,{strength:1,retainSourceForQA:true});
  // Native159 proves its face/neck output is exactly this unchanged155 helper.
  // This fixture deliberately does not synthesize missing complete-scene ears.
  return{model,head,face,neck:neckMesh,before,metrics155,scope:'Source arithmetic fixture of lower face/neck;155 is the unchanged face/neck component of159. Native162 reads all actual prepared159 source buffers.'};
}
