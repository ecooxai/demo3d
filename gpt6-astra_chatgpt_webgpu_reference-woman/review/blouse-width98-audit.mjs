import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as THREE from 'three';

const threeURL=import.meta.resolve('three');
const base=await import('./blouse-candidate81.js');
let source=await readFile('review/blouse-candidate98.js','utf8');
assert.equal(source.split('const OUTER_WIDTH98=0;').length,2);
source=source.replace('const OUTER_WIDTH98=0;','const OUTER_WIDTH98=.12;').replace("from 'three'","from "+JSON.stringify(threeURL));
const next=await import('data:text/javascript,'+encodeURIComponent(source));
const old=base.createBlouse(),candidate=next.createBlouse();
const meshes=g=>{const result=[];g.traverse(x=>{if(x.isMesh)result.push(x);});return result;};
const a=meshes(old),b=meshes(candidate);assert.equal(a.length,b.length);
const field=x=>{const q=Math.max(0,Math.min(1,(Math.abs(x)-.84)/.76)),s=q*q*(3-2*q),ds=q>0&&q<1?6*q*(1-q)/.76:0;return{x:x*(1+.12*s),jacobian:1+.12*s+.12*Math.abs(x)*ds};};
let vertices=0,triangles=0,protectedVertices=0,changedVertices=0,maxPositionError=0,maxNormalError=0,maxNormalLengthError=0,minJacobian=Infinity,maxJacobian=0;
const protectedMeshes=[];
for(let m=0;m<a.length;m++){
 assert.equal(a[m].name,b[m].name);const ag=a[m].geometry,bg=b[m].geometry;
 assert.deepEqual(ag.index.array,bg.index.array);
 for(const name of Object.keys(ag.attributes))if(name!=='position'&&name!=='normal')assert.deepEqual(ag.attributes[name].array,bg.attributes[name].array);
 const ap=ag.attributes.position,bp=bg.attributes.position,an=ag.attributes.normal,bn=bg.attributes.normal;
 const protect=/collar|facing|placket|button|neckline/.test(a[m].name);
 if(protect)protectedMeshes.push(a[m].name);
 assert.equal(ap.count,bp.count);vertices+=ap.count;triangles+=ag.index.count/3;
 for(let i=0;i<ap.count;i++){
  const f=field(ap.getX(i));minJacobian=Math.min(minJacobian,f.jacobian);maxJacobian=Math.max(maxJacobian,f.jacobian);
  const target=new THREE.Vector3(an.getX(i)/f.jacobian,an.getY(i),an.getZ(i)).normalize();
  maxPositionError=Math.max(maxPositionError,Math.abs(bp.getX(i)-f.x));
  maxNormalError=Math.max(maxNormalError,target.distanceTo(new THREE.Vector3(bn.getX(i),bn.getY(i),bn.getZ(i))));
  maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(Math.hypot(bn.getX(i),bn.getY(i),bn.getZ(i))-1));
  assert.equal(bp.getY(i),ap.getY(i));assert.equal(bp.getZ(i),ap.getZ(i));
  for(const v of [bp.getX(i),bn.getX(i),bn.getY(i),bn.getZ(i)])assert(Number.isFinite(v));
  if(bp.getX(i)!==ap.getX(i))changedVertices++;
  if(protect){assert(Math.abs(ap.getX(i))<.84);assert.equal(bp.getX(i),ap.getX(i));protectedVertices++;}
 }
}
assert(minJacobian>=1);assert(maxPositionError<4e-7);assert(maxNormalError<2e-7);assert(maxNormalLengthError<1e-7);
let queries=0,maxQueryPositionError=0,maxQueryNormalError=0,maxResidual=0;
for(let y=-1.4;y<=1.6;y+=.075)for(let x=-1.78;x<=1.78;x+=.07){
 const sample=base.sampleBlouseFrontAtXY(x,y),f=field(x),actual=next.sampleBlouseFrontAtXY(f.x,y);
 if(!sample){assert.equal(actual,null);continue;}
 assert(actual);const target=sample.point.clone();target.x=field(target.x).x;
 const normal=sample.normal.clone();normal.x/=field(sample.point.x).jacobian;normal.normalize();
 maxQueryPositionError=Math.max(maxQueryPositionError,target.distanceTo(actual.point));maxQueryNormalError=Math.max(maxQueryNormalError,normal.distanceTo(actual.normal));maxResidual=Math.max(maxResidual,actual.xyResidual);queries++;
}
assert(queries>1000);assert(maxQueryPositionError<1e-8);assert(maxQueryNormalError<1e-8);assert(maxResidual<.001);
const result={candidate:98,outerWidth:.12,vertices,triangles,protectedVertices,protectedMeshes,changedVertices,minJacobian,maxJacobian,maxPositionError,maxNormalError,maxNormalLengthError,queries,maxQueryPositionError,maxQueryNormalError,maxResidual,geometryAndQueryAgree:true,finite:true};
await writeFile('review/blouse-width98-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
