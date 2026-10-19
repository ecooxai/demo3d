import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sourceHead147,THREE,Attr,Geometry,Matrix4,I,mul,point,object,attach} from './eye-contour147-source.mjs';
import {applyEyeContour147} from '../src/eye-contour.js';
import {V151} from './eyelash-sweep151.js';
export {THREE,Attr,Geometry,Matrix4,I,mul,point,object,attach};
const {add,sub,scale,dot,cross}=V151,norm=a=>Math.hypot(...a),unit=a=>scale(a,1/norm(a));
const clean=s=>s.replace(/^import[^\n]*\n/gm,'').replace(/export /g,'');
const read=p=>clean(fs.readFileSync(p,'utf8'));

// Source-only geometry fixture. This small original curve implementation uses
// the declared centripetal Catmull-Rom construction, 200 arc-length divisions,
// finite tangent sampling and transported tube frames. Native installed Three
// remains the authority for exact source hashes and the complete scene.
class Curve151{
 constructor(points){this.points=points.map(p=>[p.x,p.y,p.z]);}
 getPoint(t){
  const ps=this.points,p=(ps.length-1)*t;let i=Math.floor(p),u=p-i;if(i===ps.length-1){i--;u=1;}
  const a=i?ps[i-1]:sub(scale(ps[0],2),ps[1]),b=ps[i],c=ps[i+1],d=i+2<ps.length?ps[i+2]:sub(scale(ps.at(-1),2),ps.at(-2));
  let t0=Math.sqrt(norm(sub(a,b))),t1=Math.sqrt(norm(sub(b,c))),t2=Math.sqrt(norm(sub(c,d)));if(t1<1e-4)t1=1;if(t0<1e-4)t0=t1;if(t2<1e-4)t2=t1;
  const out=b.map((v,k)=>{const m0=((b[k]-a[k])/t0-(c[k]-a[k])/(t0+t1)+(c[k]-b[k])/t1)*t1,m1=((c[k]-b[k])/t1-(d[k]-b[k])/(t1+t2)+(d[k]-c[k])/t2)*t1;return v+m0*u+(-3*v+3*c[k]-2*m0-m1)*u*u+(2*v-2*c[k]+m0+m1)*u*u*u;});
  return out;
 }
 getUtoTmapping(u){
  if(!this.lengths){this.lengths=[0];let previous=this.getPoint(0);for(let i=1;i<=200;i++){const next=this.getPoint(i/200);this.lengths.push(this.lengths.at(-1)+norm(sub(next,previous)));previous=next;}}
  const length=u*this.lengths.at(-1);let low=0,high=200;
  while(low<=high){const middle=Math.floor((low+high)/2),difference=this.lengths[middle]-length;if(difference<0)low=middle+1;else if(difference>0)high=middle-1;else{high=middle;break;}}
  const i=high;if(this.lengths[i]===length)return i/200;return(i+(length-this.lengths[i])/(this.lengths[i+1]-this.lengths[i]))/200;
 }
 getPointAt(u){return this.getPoint(this.getUtoTmapping(u));}
 getTangentAt(u){const t=this.getUtoTmapping(u);return unit(sub(this.getPoint(Math.min(1,t+.0001)),this.getPoint(Math.max(0,t-.0001))));}
}
function tube151(path,segments,radius,radial){
 const tangents=Array.from({length:segments+1},(_,i)=>path.getTangentAt(i/segments)),normals=[],binormals=[];let normal=[0,0,0],minimum=Infinity;
 for(let k=0;k<3;k++)if(Math.abs(tangents[0][k])<=minimum){minimum=Math.abs(tangents[0][k]);normal=[0,0,0];normal[k]=1;}
 normals.push(cross(tangents[0],unit(cross(tangents[0],normal))));binormals.push(cross(tangents[0],normals[0]));
 for(let i=1;i<=segments;i++){
  let n=normals[i-1].slice(),v=cross(tangents[i-1],tangents[i]);if(norm(v)>Number.EPSILON){v=unit(v);const a=Math.acos(Math.max(-1,Math.min(1,dot(tangents[i-1],tangents[i]))));n=add(add(scale(n,Math.cos(a)),scale(cross(v,n),Math.sin(a))),scale(v,dot(v,n)*(1-Math.cos(a))));}
  normals.push(n);binormals.push(cross(tangents[i],n));
 }
 const positions=[],normalValues=[],uv=[],indices=[];
 for(let j=0;j<=segments;j++)for(let k=0;k<=radial;k++){
  const a=k/radial*Math.PI*2,n=unit(add(scale(normals[j],-Math.cos(a)),scale(binormals[j],Math.sin(a)))),p=add(path.getPointAt(j/segments),scale(n,radius));positions.push(...p);normalValues.push(...n);uv.push(j/segments,k/radial);
 }
 for(let j=1;j<=segments;j++)for(let k=1;k<=radial;k++){const a=(radial+1)*(j-1)+k-1,b=(radial+1)*j+k-1,c=b+1,d=a+1;indices.push(a,b,d,b,c,d);}
 const g=new Geometry().setAttribute('position',new Attr(positions,3)).setAttribute('normal',new Attr(normalValues,3)).setAttribute('uv',new Attr(uv,2));g.setIndex(new Attr(new Uint16Array(indices),1));return g;
}
const localTHREE={...THREE,CatmullRomCurve3:Curve151,TubeGeometry:class{constructor(path,segments,radius,radial){return tube151(path,segments,radius,radial);}}};
function merge(geometries){
 const result=new Geometry();for(const name of['position','normal','uv'])result.setAttribute(name,new Attr(geometries.flatMap(g=>Array.from(g.getAttribute(name).array)),name==='uv'?2:3));
 let offset=0;const index=[];for(const g of geometries){for(const v of g.index.array)index.push(v+offset);offset+=g.getAttribute('position').count;}result.setIndex(new Attr(new Uint16Array(index),1));return result;
}
let text=read('src/face.js');const start=text.indexOf(' const sclera=new THREE.MeshPhysicalMaterial'),lashes=text.indexOf(' const lashes=[];'),tear=text.indexOf(' const tear=mesh(new THREE.SphereGeometry'),mouth=text.indexOf('function makeMouth');
assert(start>0&&lashes>start&&tear>lashes&&mouth>tear);
text=text.slice(0,start)+text.slice(lashes,tear)+' return g;\n}\n'+text.slice(mouth);
const source=new Function('THREE','mergeGeometries',text+'\nreturn {makeEye,portraitY};')(localTHREE,merge),lowerFaceWarp=new Function('Matrix4',read('src/portrait-proportions.js')+'\nreturn lowerFaceWarp;')(Matrix4),balance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4);

export function sourceHead151(meshFrame=I()){
 const head=sourceHead147(meshFrame),bySide=new Map();
 for(const side of[-1,1]){const group=object(side<0?'left-eye':'right-eye',head.matrixWorld);head.add(group);bySide.set(side,group);}
 for(const mesh of head.children.slice())if(mesh.isMesh&&mesh.__side147){head.children.splice(head.children.indexOf(mesh),1);bySide.get(mesh.__side147).add(mesh);}
 const temporary=object('anatomical-head',head.matrixWorld),model=object('model');model.add(temporary);
 for(const side of[-1,1]){
  const mesh=source.makeEye(side,{},null).children[0],g=mesh.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
  for(let i=0;i<p.count;i++){
   const y=p.getY(i),derivative=(source.portraitY(y+.0001)-source.portraitY(y-.0001))/.0002,normal=unit([n.getX(i),n.getY(i)/Math.max(.3,derivative),n.getZ(i)]);p.setY(i,source.portraitY(y));n.setXYZ(i,...normal);
   const warp=lowerFaceWarp(p.getY(i));p.setY(i,p.getY(i)+warp.displacement);n.setXYZ(i,...unit([n.getX(i),n.getY(i)/(1+warp.derivative),n.getZ(i)]));
  }
  attach(temporary,'individual-eyelashes',g,head.matrixWorld,mesh.material).__side151=side;
 }
 balance(model,{shiftX:-.24});
 for(const mesh of temporary.children){
  const g=mesh.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal'),inverse=meshFrame.clone().invert(),a=meshFrame.elements;
  for(let i=0;i<p.count;i++){p.setXYZ(i,...point(inverse,[p.getX(i),p.getY(i),p.getZ(i)]));const v=[n.getX(i),n.getY(i),n.getZ(i)];n.setXYZ(i,...unit([a[0]*v[0]+a[1]*v[1]+a[2]*v[2],a[4]*v[0]+a[5]*v[1]+a[6]*v[2],a[8]*v[0]+a[9]*v[1]+a[10]*v[2]]));}
  mesh.matrixWorld=mul(head.matrixWorld,meshFrame);bySide.get(mesh.__side151).add(mesh);g.computeBoundingBox();g.computeBoundingSphere();
 }
 applyEyeContour147(head,{strength:1});return head;
}
export const source151Interpretation='Source face/eyelid/lash coordinates and accepted deformation code with a small local centripetal-curve/tube fixture. This is not installed Three or a renderer. Native151 audits the complete actual149 scene and its unchanged source arrays.';
