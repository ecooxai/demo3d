import fs from 'node:fs';
import assert from 'node:assert/strict';
import {THREE,Attr,Geometry,Matrix4,read,object,attach,I,mul,T,RY,RZ,point} from './torso-depth110-harness.mjs';
export {THREE,Attr,Geometry,Matrix4,read,object,attach,I,mul,T,RY,RZ,point};
Matrix4.prototype.copy=function(m){this.elements=Array.from(m.elements);return this;};
Attr.prototype.setZ=function(i,z){this.array[i*this.itemSize+2]=z;return this;};

// Reuse only the small original centripetal-curve/tube arithmetic fixture from
// the accepted151 source audit. It does not execute its eye or native code.
const curveText=fs.readFileSync('review/eyelash151-source.mjs','utf8'),start=curveText.indexOf('class Curve151{'),end=curveText.indexOf('const localTHREE=');
assert(start>0&&end>start);
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),scale=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>Math.hypot(...a),unit=a=>scale(a,1/norm(a));
const {Curve151,tube151}=new Function('Geometry','Attr','add','sub','scale','dot','cross','norm','unit',curveText.slice(start,end)+'\nreturn {Curve151,tube151};')(Geometry,Attr,add,sub,scale,dot,cross,norm,unit);
const localTHREE={...THREE,CatmullRomCurve3:Curve151,TubeGeometry:class{constructor(path,segments,radius,radial){return tube151(path,segments,radius,radial);}}};
export const cloth158=new Function('THREE',read('src/blouse.js')+'\nreturn {addCollar,addFacing,clothGeometry,broadenShoulders,collarPoint,surface,solidifyGrid,torsoPoint,bodyAtXY,placketX,curveMesh};')(localTHREE);
export const helper158=new Function('Matrix4',read('review/collar-roll-candidate158.js')+'\nreturn {COLLAR158_SPEC,collarWorkspace158,collarChart158,collarInverse158,collarMap158,applyCollarRoll158,releaseCollarRoll158};')(Matrix4);
export const balance158=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4);

export function sourceCollar158({includeBody=true}={}){
 const group=object('original-tailored-white-cotton-blouse'),cloth={name:'source-collar-poplin',vertexColors:true},seam={name:'source-stitching',vertexColors:false};
 if(includeBody)attach(group,'blouse-continuous-torso-and-sleeves',cloth158.clothGeometry(),I(),cloth);
 for(const side of[-1,1]){cloth158.addFacing(group,side,cloth,seam);cloth158.addCollar(group,side,cloth,seam);}
 // Actual existing upper placket is a read-only nearby obstacle.
 const placket=cloth158.solidifyGrid(cloth158.surface(10,74,(u,v)=>{const y=.780+(-1.45-.780)*v,cx=cloth158.placketX(y),x=cx+(u-.5)*(.174+.014*v),p=cloth158.bodyAtXY(x,y);return[x,y,p[2]+.007+.006*Math.sin(u*Math.PI)**.70];}),10,74,.0045);
 attach(group,'blouse-curved-centre-placket',placket,I(),cloth);
 for(const mesh of group.children)mesh.matrixWorld=I();cloth158.broadenShoulders(group);
 if(includeBody){const apply154=new Function('Matrix4',read('src/blouse-drape.js')+'\nreturn applyBlouseDrape154;')(Matrix4);apply154(group,{strength:1});}
 return group;
}
export const source158Scope='Current accepted collar/facing/placket/torso source and154 positions with original Float32 geometry. The two edge/fold tubes use a local centripetal-curve arithmetic fixture. Actual installed Three/native buffers and nearby complete-scene triangles remain the final runtime authority. No reference image pixels are read.';
