import fs from 'node:fs';
import assert from 'node:assert/strict';
import {applyMouthContinuity130,sampleLipFrame130,sampleLipRelief130} from '../src/lip-continuity.js';
import {THREE,Attr,Geometry,Matrix4,I,mul,T,RY,RZ,point,object,attach,read} from './torso-depth110-harness.mjs';
export {THREE,Attr,Geometry,Matrix4,I,mul,T,RY,RZ,point,object,attach};

// Reuse actual accepted face/lip source construction and add the four actual
// eye surfaces. This local geometry fixture omits tubes, glints, brows and ears;
// the native wrapper checks every actual head mesh and the unchanged groom.
const previous=fs.readFileSync('review/mouth-continuity130-audit.mjs','utf8'),begin=previous.indexOf('THREE.Color.prototype.offsetHSL'),end=previous.indexOf('function snapshot(head)');
assert(begin>=0&&end>begin);
let prefix=previous.slice(begin,end);
prefix=prefix.replace('profile,faceZ,orbitalRadius,portraitY,makeMouth,refineEarBed','profile,faceZ,orbitalRadius,portraitY,makeMouth,makeEye,refineEarBed');
prefix=prefix.replace('function initialWarp(geometry, isFace = false)', 'function initialWarp(geometry, isFace = false, keepUV = false)');
prefix=prefix.replace("geometry.setAttribute('uv', new Attr(uv, 2));", "if(!keepUV)geometry.setAttribute('uv', new Attr(uv, 2));\n  if(isFace){const front=[],back=[],index=geometry.index.array;for(let k=0;k<index.length;k+=3){const tri=[index[k],index[k+1],index[k+2]],average=tri.reduce((s,i)=>s+p.getZ(i),0)/3;(average>0?front:back).push(...tri);}geometry.setIndex([...front,...back]);geometry.groups=[];geometry.addGroup(0,front.length,0);geometry.addGroup(front.length,back.length,1);}");
const addEye="for (const mesh of face.makeMouth().children) attach(sourceHead, mesh.name, initialWarp(mesh.geometry), I(), mesh.material);";
assert(prefix.includes(addEye));
prefix=prefix.replace(addEye,addEye+"\nfor(const side of[-1,1])for(const mesh of face.makeEye(side,{name:'source-skin'},null).children){const m=attach(sourceHead,mesh.name,initialWarp(mesh.geometry,false,mesh.name==='transparent-corneal-dome'),I(),mesh.material);m.__side147=side;}");
prefix=prefix.replace('name: mesh.name, geometry: mesh.geometry, material: mesh.material','name: mesh.name, side: mesh.__side147||0, geometry: mesh.geometry, material: mesh.material');
prefix=prefix.replace('g.computeBoundingBox(); g.computeBoundingSphere(); attach(head, source.name, g, mul(headPose, frame), source.material);',"g.computeBoundingBox();g.computeBoundingSphere();const attached147=attach(head,source.name,g,mul(headPose,frame),source.material);attached147.__side147=source.side;");
function fixtureRead(file){
 let text=read(file);if(file!=='src/face.js')return text;
 const glints=text.indexOf(' // Small curved highlights describe'),grid=text.indexOf(' const pp=[],ii=[],cc=[],uu=[],NS=128,NR=12;'),done=text.indexOf(" g.add(mesh(exactFaceNormals(buffer(pp,ii,uu,cc)),skin,'sculpted-eyelids'));"),mouth=text.indexOf('function makeMouth');
 assert(glints>=0&&grid>glints&&done>grid&&mouth>done);
 const ending=" g.add(mesh(exactFaceNormals(buffer(pp,ii,uu,cc)),skin,'sculpted-eyelids'));";
 return text.slice(0,glints)+text.slice(grid,done+ending.length)+'\nreturn g;\n}\n'+text.slice(mouth);
}
const make=new Function('THREE','Attr','Geometry','Matrix4','I','mul','T','RY','RZ','point','object','attach','read','assert',prefix+'\nreturn {fixture,face,clearDisposals:()=>{disposed=[];},disposals:()=>disposed};');
const source=make(THREE,Attr,Geometry,Matrix4,I,mul,T,RY,RZ,point,object,attach,fixtureRead,assert);
// Match Three.clone metadata/layout semantics omitted by the old minimal mock.
const clone=Geometry.prototype.clone;
Geometry.prototype.clone=function(){const g=clone.call(this);g.userData=JSON.parse(JSON.stringify(this.userData||{}));g.groups=(this.groups||[]).map(x=>({...x}));g.drawRange={...(this.drawRange||{start:0,count:Infinity})};return g;};
const upper=new Function('faceZ','sampleLipFrame130','sampleLipRelief130',read('src/upper-lip-relief.js')+'\nreturn applyUpperLipRelief140;')(source.face.faceZ,sampleLipFrame130,sampleLipRelief130);
export function sourceHead147(frame=I()){
 const head=source.fixture(frame);applyMouthContinuity130(head,{strength:1});upper(head,{strength:1});source.clearDisposals();return head;
}
export const disposals147=()=>source.disposals();
export const clearDisposals147=()=>source.clearDisposals();
