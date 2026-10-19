import fs from 'node:fs';
import {construct,read} from './lower-clump126-source.mjs';

// Narrow source-geometry diagnosis only: actual opaque root triangles above
// manually registered crown samples. No source-photo image analysis occurs.
const start=performance.now(),hair=construct(0,{baseline:true}),crown=hair.children[0];
const cr=Math.cos(-.17),sr=Math.sin(-.17),cy=Math.cos(.16),sy=Math.sin(.16);
const matrix=[cy*cr,sr,-sy*cr,0,-cy*sr,cr,sy*sr,0,sy,0,cy,0,.26,2.95,0,1];
const api=new Function(read('review/reference-crown-candidate116.js')+'\nreturn {makeRegistration,crownPoint,transformPoint,sourceDistance,spatialWeight};')();
const selected={position:crown.geometry.attributes.position,matrix},registration=api.makeRegistration(selected);
const nx=80,ny=64,x0=-1.25,y0=.10,dx=2.55/nx,dy=1.70/ny,bins=Array.from({length:nx*ny},()=>[]),triangles=[];
const point=new Float64Array(3),posed=new Float64Array(3),source=new Float64Array(6);
const edgePixels=[];
for(const meshIndex of[1,2]){
 const mesh=hair.children[meshIndex],p=mesh.geometry.attributes.position.array,ix=mesh.geometry.index.array;
 for(let t=0;t<ix.length;t+=3){
  const ids=[ix[t],ix[t+1],ix[t+2]];
  if(Math.max(...ids.map(i=>p[i*3+1]))<=.30)continue;
  const xyz=[];for(const i of ids){point.set(p.subarray(i*3,i*3+3));api.transformPoint(matrix,point,posed);xyz.push(...posed);}
  const loX=Math.min(xyz[0],xyz[3],xyz[6]),hiX=Math.max(xyz[0],xyz[3],xyz[6]),loY=Math.min(xyz[1],xyz[4],xyz[7]),hiY=Math.max(xyz[1],xyz[4],xyz[7]);
  const i0=Math.max(0,Math.floor((loX-x0)/dx)),i1=Math.min(nx-1,Math.floor((hiX-x0)/dx)),j0=Math.max(0,Math.floor((loY-y0)/dy)),j1=Math.min(ny-1,Math.floor((hiY-y0)/dy));
  if(i0>i1||j0>j1)continue;
  const den=(xyz[4]-xyz[7])*(xyz[0]-xyz[6])+(xyz[6]-xyz[3])*(xyz[1]-xyz[7]);if(Math.abs(den)<1e-13)continue;
  const id=triangles.length;triangles.push({meshIndex,triangle:t/3,xyz,den});
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)bins[j*nx+i].push(id);
 }
}
const counts={eligible:0,crownExposed:0,massAbove:0,detailAbove:0},examples=[];
for(const side of[-1,1])for(let j=2;j<47;j++)for(let i=23;i<48;i++){
 const u=(i+.37)/50,v=(j+.21)/50;api.crownPoint(selected.position.array,side,u,v,point);
 if(api.spatialWeight(point,matrix)<.50)continue;
 api.transformPoint(matrix,point,posed);registration.sample(posed[0],posed[1],source);if(api.sourceDistance(source[0],source[1])<10)continue;
 const bx=Math.floor((posed[0]-x0)/dx),by=Math.floor((posed[1]-y0)/dy);if(bx<0||bx>=nx||by<0||by>=ny)continue;
 counts.eligible++;let top=posed[2]+.00001,winner=null;
 for(const id of bins[by*nx+bx]){
  const tri=triangles[id],p=tri.xyz,a=((p[4]-p[7])*(posed[0]-p[6])+(p[6]-p[3])*(posed[1]-p[7]))/tri.den,b=((p[7]-p[1])*(posed[0]-p[6])+(p[0]-p[6])*(posed[1]-p[7]))/tri.den,c=1-a-b;
  if(Math.min(a,b,c)<-1e-8)continue;
  const z=a*p[2]+b*p[5]+c*p[8];if(z>top){top=z;winner=tri;}
 }
 if(!winner){counts.crownExposed++;continue;}
 counts[winner.meshIndex===1?'massAbove':'detailAbove']++;
 const src=[];for(let k=0;k<3;k++){registration.sample(winner.xyz[k*3],winner.xyz[k*3+1],source);src.push([source[0],source[1]]);}
 const longest=Math.max(...[0,1,2].map(k=>Math.hypot(src[k][0]-src[(k+1)%3][0],src[k][1]-src[(k+1)%3][1])));
 edgePixels.push(longest);if(examples.length<6)examples.push({side,u,v,meshIndex:winner.meshIndex,triangle:winner.triangle,longestSourceEdgePixels:longest});
}
edgePixels.sort((a,b)=>a-b);const quantile=q=>edgePixels[Math.min(edgePixels.length-1,Math.floor(q*edgePixels.length))]??null;
const report={candidate:132,native:false,method:'Actual projected MASS/DETAIL triangle point tests above manually registered front-crown surface samples; no image segmentation or source-pixel analysis',counts,estimatedCrownExposedFraction:counts.crownExposed/Math.max(1,counts.eligible),rootTriangleSourceEdgePixels:{median:quantile(.5),p95:quantile(.95),maximum:quantile(1)},examples,rootTrianglesBinned:triangles.length,elapsedMs:performance.now()-start,limitations:['Point-sampled geometric coverage is not a rasterized antialiased coverage measurement.','Existing crown sample positions use the accepted116 bilinear chart interpolation.','Thin opaque fine ribbons are counted geometrically; pixel filtering may reduce their visual dominance.','High-frequency source color must be sampled per fragment on any root layer receiving it; interpolation of RGB at these triangle vertices cannot preserve strand-scale detail.']};
fs.writeFileSync('review/reference-crown132-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
