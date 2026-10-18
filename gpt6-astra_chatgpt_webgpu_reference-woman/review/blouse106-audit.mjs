import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// The same audit runs with real Three on the Mac. In the local draft workspace
// the existing arithmetic harness validates source surfaces, not native output.
let THREE,native=false;
try { THREE=await import('three'); native=true; }
catch(error){
  if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;
  const source=fs.readFileSync('review/hair-contact86-audit.mjs','utf8')
    .split('const faceZ=')[0].replace(/^import[^\n]*\n/gm,'');
  THREE=new Function('fs','assert',source+'\nreturn THREE;')(fs,assert);
  THREE.Vector3.prototype.crossVectors=function(a,b){return this.set(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);};
  THREE.Vector3.prototype.negate=function(){return this.multiplyScalar(-1);};
  THREE.Float32BufferAttribute.prototype.setX=function(i,x){this.array[i*this.itemSize]=x;return this;};
  THREE.Float32BufferAttribute.prototype.setY=function(i,x){this.array[i*this.itemSize+1]=x;return this;};
  THREE.BufferGeometry.prototype.dispose=function(){};
  THREE.BufferAttribute=THREE.Float32BufferAttribute;
}

const files=['review/blouse-candidate102.js','review/blouse-candidate106.js'];
const source=files.map(file=>fs.readFileSync(file,'utf8'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const exports='createBlouse,createNeck,torsoPoint,bodyAtXY,bodyNormal,sleeveWarpX,sleeveSourceX,contactBroadening,outerWidth98,sampleBlouseFrontAtXY,clothGeometry,surface,solidifyGrid,collarPoint,facingPoint,neckPoint,broadenShoulders,placketX,shoulderClothRelief';
const apis=source.map(s=>new Function('THREE',s.replace(/^import[^\n]*\n/gm,'').replace(/\bexport /g,'')+'\nreturn {'+exports+'};')(THREE));
const [base,next]=apis;
const scope=s=>s.replace(/function shoulderClothRelief[\s\S]*?(?=\nfunction sleeveWarpX)/,'<sleeve-field>\n')
  .replace(/group\.userData\.design='[^']*';/,'<description>');
assert.equal(scope(source[0]),scope(source[1]),'Only the sleeve relief and design description may change.');
assert(source[1].includes('const OUTER_WIDTH98=.12;'));

const xyz=(p,i)=>[p.getX(i),p.getY(i),p.getZ(i)];
const sub=(a,b)=>a.map((v,k)=>v-b[k]);
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
const norm=a=>Math.hypot(...a);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>a.map(v=>v/(norm(a)||1));
const widened=(api,p)=>[api.outerWidth98(api.contactBroadening(p[0]).x).x,p[1],p[2]];
const at=(api,u,t)=>widened(api,api.torsoPoint((u+1)%1,t));
const tangentNormal=(api,u,t)=>{
  const e=.00002,du=sub(at(api,u+e,t),at(api,u-e,t)),dv=sub(at(api,u,Math.min(1,t+e)),at(api,u,Math.max(0,t-e)));
  return unit(cross(dv,du));
};
const build=api=>{
  const start=performance.now(),g=api.clothGeometry(),group=new THREE.Group(),m=new THREE.Mesh(g,{name:'audit-cotton'});
  group.add(m);api.broadenShoulders(group);
  return {g,ms:performance.now()-start};
};
const cpuStart=process.cpuUsage(),start=performance.now(),before=build(base),after=build(next);
const a=before.g,b=after.g,ap=a.attributes.position,bp=b.attributes.position,an=a.attributes.normal,bn=b.attributes.normal;
assert.deepEqual(a.index.array,b.index.array);assert.deepEqual(a.attributes.uv.array,b.attributes.uv.array);
assert.equal(ap.count,bp.count);
let changedVertices=0,protectedVertices=0,maxPositionDelta=0,maxNormalLengthError=0,minNormalDot=1,maxColorDelta=0;
const maxAxisDelta=[0,0,0],bounds=[Array(3).fill(Infinity).concat(Array(3).fill(-Infinity)),Array(3).fill(Infinity).concat(Array(3).fill(-Infinity))];
for(let i=0;i<ap.count;i++){
  const p=xyz(ap,i),q=xyz(bp,i),d=sub(q,p),n=xyz(bn,i),raw=base.torsoPoint((i%193)/192,Math.floor(i/193)/112);
  const moved=norm(d);if(moved>1e-8)changedVertices++;
  maxPositionDelta=Math.max(maxPositionDelta,moved);for(let k=0;k<3;k++)maxAxisDelta[k]=Math.max(maxAxisDelta[k],Math.abs(d[k]));
  assert.equal(q[1],p[1]);
  for(const v of [...q,...n])assert(Number.isFinite(v));
  minNormalDot=Math.min(minNormalDot,dot(unit(xyz(an,i)),unit(n)));
  maxNormalLengthError=Math.max(maxNormalLengthError,Math.abs(norm(n)-1));
  if(Math.abs(raw[0])<=.95||raw[1]<=-1.40){assert.deepEqual(q,p);protectedVertices++;}
  for(let k=0;k<3;k++){
    maxColorDelta=Math.max(maxColorDelta,Math.abs(a.attributes.color.array[i*3+k]-b.attributes.color.array[i*3+k]));
    bounds[0][k]=Math.min(bounds[0][k],p[k]);bounds[0][k+3]=Math.max(bounds[0][k+3],p[k]);
    bounds[1][k]=Math.min(bounds[1][k],q[k]);bounds[1][k+3]=Math.max(bounds[1][k+3],q[k]);
  }
}
assert(changedVertices>100);assert(maxNormalLengthError<1e-7);
assert(maxPositionDelta<.040);assert(minNormalDot>.80);
assert(Math.abs((bounds[1][3]-bounds[1][0])-(bounds[0][3]-bounds[0][0]))<.003);
let triangles=0,reversedTriangles=0,minAreaRatio=Infinity,maxAreaRatio=0,minTriangleNormalDot=1;
for(let i=0;i<a.index.count;i+=3){
  const ids=[a.index.getX(i),a.index.getX(i+1),a.index.getX(i+2)],p=ids.map(j=>xyz(ap,j)),q=ids.map(j=>xyz(bp,j));
  const old=cross(sub(p[1],p[0]),sub(p[2],p[0])),now=cross(sub(q[1],q[0]),sub(q[2],q[0]));
  if(norm(old)<1e-12)continue;triangles++;
  const cosine=dot(unit(old),unit(now)),ratio=norm(now)/norm(old);
  if(cosine<=0)reversedTriangles++;minTriangleNormalDot=Math.min(minTriangleNormalDot,cosine);
  minAreaRatio=Math.min(minAreaRatio,ratio);maxAreaRatio=Math.max(maxAreaRatio,ratio);
}
assert.equal(reversedTriangles,0);

// Compare actual protected source surfaces, not merely their function text.
let protectedSurfaceSamples=0;
const same=(p,q)=>{assert.deepEqual(p,q);protectedSurfaceSamples++;};
for(const side of [-1,1]){
  for(let v=0;v<=48;v++)for(let u=0;u<=24;u++)same(base.collarPoint(side,u/24,v/48),next.collarPoint(side,u/24,v/48));
  for(let v=0;v<=48;v++)for(let u=0;u<=8;u++)same(base.facingPoint(side,u/8,v/48),next.facingPoint(side,u/8,v/48));
}
for(let j=0;j<=44;j++)for(let i=0;i<=80;i++)same(base.neckPoint(i/80*Math.PI*2,.69+j/44*1.39),next.neckPoint(i/80*Math.PI*2,.69+j/44*1.39));
for(let i=0;i<=192;i++){same(base.torsoPoint(i/192,0),next.torsoPoint(i/192,0));same(base.torsoPoint(i/192,1),next.torsoPoint(i/192,1));}
for(let j=0;j<=74;j++)for(let i=0;i<=10;i++){
  const v=j/74,y=.780-2.23*v,x=base.placketX(y)+(i/10-.5)*(.174+.014*v);
  same(base.bodyAtXY(x,y),next.bodyAtXY(x,y));
}
for(const y of [.480,-.185,-.850]){
  const x=base.placketX(y);assert.equal(x,next.placketX(y));same(base.bodyAtXY(x,y),next.bodyAtXY(x,y));
  same(Object.values(base.bodyNormal(x,y)),Object.values(next.bodyNormal(x,y)));
}

// Independently differentiate the inverse sleeve warp over its whole support.
let warpSamples=0,minWarpJacobian=Infinity,maxWarpJacobian=0,maxInverseError=0,maxSleeveXDelta=0;
for(let iy=0;iy<=105;iy++)for(let ix=0;ix<=98;ix++){
  const y=-1.45+iy*.03,x=-1.76+ix*(3.52/98),e=1e-5;
  const j=(next.sleeveWarpX(x+e,y)-next.sleeveWarpX(x-e,y))/(2*e),actual=next.sleeveWarpX(x,y),recovered=next.sleeveSourceX(actual,y);
  assert(Number.isFinite(j));minWarpJacobian=Math.min(minWarpJacobian,j);maxWarpJacobian=Math.max(maxWarpJacobian,j);
  maxInverseError=Math.max(maxInverseError,Math.abs(recovered-x));maxSleeveXDelta=Math.max(maxSleeveXDelta,Math.abs(actual-base.sleeveWarpX(x,y)));warpSamples++;
}
assert(minWarpJacobian>.55);assert(maxInverseError<1e-8);

// Query the same independent parameter samples on each widened source surface.
// Tangent normals are taken from u/t offsets, independently of bodyNormal's XY
// derivatives. Exact triangle chord deviations are recorded separately below.
const surfaceQueries=apis.map(api=>{
  let samples=0,misses=0,maxPositionError=0,maxNormalError=0,maxXYResidual=0,maxUnitNormalError=0;
  let worstPosition=null,worstNormal=null;
  for(let j=4;j<112;j+=3)for(let i=1;i<192;i+=3){
    const u=i/192,t=j/112;if(Math.cos(u*Math.PI*2)<=0)continue;
    const p=at(api,u,t),normal=tangentNormal(api,u,t);if(normal[2]<.40)continue;
    const hit=api.sampleBlouseFrontAtXY(p[0],p[1]);if(!hit){misses++;continue;}
    const q=[hit.point.x,hit.point.y,hit.point.z],n=[hit.normal.x,hit.normal.y,hit.normal.z];
    const pe=norm(sub(p,q)),ne=norm(sub(normal,n));
    if(pe>maxPositionError){maxPositionError=pe;worstPosition={u,t,p,q};}
    if(ne>maxNormalError){maxNormalError=ne;worstNormal={u,t,p,normal,n};}
    assert(hit.edgeWeight>=0&&hit.edgeWeight<=1);for(const v of [...q,...n,hit.edgeWeight,hit.xyResidual])assert(Number.isFinite(v));
    maxXYResidual=Math.max(maxXYResidual,hit.xyResidual);maxUnitNormalError=Math.max(maxUnitNormalError,Math.abs(norm(n)-1));samples++;
  }
  assert(samples>400);assert(maxPositionError<.001);assert(maxNormalError<.012);assert(maxXYResidual<.001);assert(maxUnitNormalError<1e-12);
  return {samples,misses,maxPositionError,maxNormalError,maxXYResidual,maxUnitNormalError,worstPosition,worstNormal};
});
const chordQueries=[a,b].map((g,k)=>{
  const p=g.attributes.position,idx=g.index,api=apis[k];let samples=0,maxDepthDifference=0,worst=null;
  for(let i=0;i<idx.count;i+=33){
    const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)],v=ids.map(j=>xyz(p,j)),centre=[0,1,2].map(axis=>v.reduce((s,q)=>s+q[axis]/3,0));
    if(centre[2]<=0||Math.abs(centre[0])<1.10)continue;
    const hit=api.sampleBlouseFrontAtXY(centre[0],centre[1]);if(!hit||hit.normal.z<.45)continue;
    const error=Math.abs(hit.point.z-centre[2]);if(error>maxDepthDifference){maxDepthDifference=error;worst={triangle:i/3,centre,surfaceZ:hit.point.z};}samples++;
  }
  assert(samples>100);return {samples,maxDepthDifference,worst};
});
assert(surfaceQueries[1].misses<=surfaceQueries[0].misses);
assert(chordQueries[1].maxDepthDifference<.010,'A sleeve fold must stay within the native mesh chord budget.');

let nativeProtectedMeshes=null,nativeMeshCount=null;
if(native){
  const groups=apis.map(api=>api.createBlouse()),meshes=groups.map(group=>{const rows=[];group.traverse(o=>{if(o.isMesh)rows.push(o);});return rows;});
  assert.equal(meshes[0].length,meshes[1].length);nativeMeshCount=meshes[1].length;nativeProtectedMeshes=[];
  for(let i=0;i<meshes[0].length;i++){
    const [p,q]=[meshes[0][i],meshes[1][i]];assert.equal(p.name,q.name);
    assert.deepEqual(p.geometry.index?.array,q.geometry.index?.array);
    for(const name of Object.keys(q.geometry.attributes))for(const v of q.geometry.attributes[name].array)assert(Number.isFinite(v));
    if(/collar|facing|placket|button|finished-neckline|finished-bust-base|bust-crop-hem/.test(p.name)){
      for(const name of Object.keys(p.geometry.attributes))assert.deepEqual(p.geometry.attributes[name].array,q.geometry.attributes[name].array);
      nativeProtectedMeshes.push(p.name);
    }
    assert.equal(p.material.roughness,q.material.roughness);assert.deepEqual(p.material.color,q.material.color);
    if(p.material.bumpMap)assert.deepEqual(p.material.bumpMap.image.data,q.material.bumpMap.image.data);
  }
  const necks=apis.map(api=>api.createNeck().children[0].geometry);
  for(const name of Object.keys(necks[0].attributes))assert.deepEqual(necks[0].attributes[name].array,necks[1].attributes[name].array);
  for(const group of groups)group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
}

const cpu=process.cpuUsage(cpuStart);
const result={candidate:106,nativeThree:native,sourceOnlyHarness:!native,visualScore:76,visualAcceptance:'pending native art review',baseline:files[0],candidateFile:files[1],sha256:source.map(hash),scope:'Only shoulderClothRelief and design description changed; OUTER_WIDTH98 remains .12.',
 geometry:{vertices:ap.count,triangles:a.index.count/3,changedVertices,protectedVertices,maxPositionDelta,maxAxisDelta,minNormalDot,maxNormalLengthError,maxColorDelta,bounds,widthDelta:(bounds[1][3]-bounds[1][0])-(bounds[0][3]-bounds[0][0]),trianglesAudited:triangles,reversedTriangles,minAreaRatio,maxAreaRatio,minTriangleNormalDot},
 protection:{protectedSurfaceSamples,centralSourceXLimit:.95,fixedCropY:-1.40,nativeMeshCount,nativeProtectedMeshes},
 inverse:{warpSamples,minWarpJacobian,maxWarpJacobian,maxInverseError,maxSleeveXDelta},surfaceQueries,chordQueries,
 cost:{baselineClothMs:before.ms,candidateClothMs:after.ms,totalWallMs:performance.now()-start,totalCpuMs:(cpu.user+cpu.system)/1000,rssMiB:process.memoryUsage().rss/1048576}};
fs.writeFileSync('review/blouse106-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({candidate:result.candidate,nativeThree:native,geometry:result.geometry,protection:result.protection,inverse:result.inverse,surfaceQueries:surfaceQueries.map(({worstPosition,worstNormal,...row})=>row),chordQueries:chordQueries.map(({worst,...row})=>row),cost:result.cost}));
