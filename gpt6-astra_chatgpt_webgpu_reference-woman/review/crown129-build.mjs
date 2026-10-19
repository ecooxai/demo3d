import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const input=fs.readFileSync('review/hair-groom-candidate124.js','utf8');
assert.equal(crypto.createHash('sha256').update(input).digest('hex'),'e6ed556b74851ec6b383a27f639ca74e3e4d606070528db5010a91ef953fd811');
let source=input;
const replace=(a,b)=>{assert.equal(source.split(a).length,2,a.slice(0,100));source=source.replace(a,b);};
const helper=String.raw`
function retainedCrownField129(batch,map){
 // Rasterize the actual retained crown triangles in head-local frontal depth.
 // Vertex alpha and the original coverage map both participate. The inset
 // foundation is excluded; it must not mask the intentionally exposed forehead.
 const nx=192,ny=208,x0=-1.045,y0=-.65,dx=2.09/(nx-1),dy=2.35/(ny-1),depth=new Float64Array(nx*ny),alpha=new Float64Array(nx*ny),uv=batch.uv,colors=batch.c,positions=batch.p,index=batch.i;
 depth.fill(-Infinity);
 const texture=(u,v)=>{const im=map.image,w=im.width,h=im.height,x=((u%1+1)%1)*w-.5,y=clamp(v)*h-.5,i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j;let value=0;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const ix=((i+xx)%w+w)%w,iy=clamp(j+yy,0,h-1);value+=im.data[(iy*w+ix)*4+3]/255*(xx?a:1-a)*(yy?b:1-b);}return value;};
 let rasterSamples=0;
 for(let f=144*52*6;f<index.length;f+=3){
  const ids=[index[f],index[f+1],index[f+2]],a=ids[0]*3,b=ids[1]*3,c=ids[2]*3,ax=positions[a],ay=positions[a+1],bx=positions[b],by=positions[b+1],cx=positions[c],cy=positions[c+1],den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-12)continue;
  const az=earDepth(ax,ay,positions[a+2]),bz=earDepth(bx,by,positions[b+2]),cz=earDepth(cx,cy,positions[c+2]);
  const il=Math.max(0,Math.ceil((Math.min(ax,bx,cx)-x0)/dx)),ih=Math.min(nx-1,Math.floor((Math.max(ax,bx,cx)-x0)/dx)),jl=Math.max(0,Math.ceil((Math.min(ay,by,cy)-y0)/dy)),jh=Math.min(ny-1,Math.floor((Math.max(ay,by,cy)-y0)/dy));
  for(let j=jl;j<=jh;j++)for(let i=il;i<=ih;i++){
   const x=x0+i*dx,y=y0+j*dy,u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-8)continue;
   const at=j*nx+i,z=u*az+v*bz+w*cz;if(z<=.015||z<=depth[at])continue;
   const s=u*uv[ids[0]*2]+v*uv[ids[1]*2]+w*uv[ids[2]*2],t=u*uv[ids[0]*2+1]+v*uv[ids[1]*2+1]+w*uv[ids[2]*2+1];
   depth[at]=z;alpha[at]=clamp((u*colors[ids[0]*4+3]+v*colors[ids[1]*4+3]+w*colors[ids[2]*4+3])*texture(s,t));rasterSamples++;
  }
 }
 const weights=t=>[(1-t)**3/6,(3*t*t*t-6*t*t+4)/6,(-3*t*t*t+3*t*t+3*t+1)/6,t*t*t/6];
 return{metrics:{width:nx,height:ny,rasterSamples,bytes:depth.byteLength+alpha.byteLength,filter:'cubic B-spline, sixteen neighboring samples'},sample(x,y){
  const u=(x-x0)/dx,v=(y-y0)/dy;if(u<1||u>nx-3||v<1||v>ny-3)return null;
  const i=Math.floor(u),j=Math.floor(v),wx=weights(u-i),wy=weights(v-j);let retention=0,z=0,valid=0;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){const at=(j+row-1)*nx+i+col-1,w=wx[col]*wy[row];if(Number.isFinite(depth[at])){retention+=alpha[at]*w;z+=depth[at]*w;valid+=w;}}
  return valid>1e-6?{retention:clamp(retention),z:z/valid}:null;
 }};
}
function buryReplacement129(batch,field,isSupport){
 const stats={vertices:batch.p.length/3,moved:0,masked:0,maximumInwardOffset:0,strongRetentionSamples:0,minimumStrongDepthGap:Infinity};
 for(let i=0;i<batch.p.length;i+=3){
  let x=batch.p[i],y=batch.p[i+1],z=batch.p[i+2];const hit=field.sample(x,y);if(!hit)continue;
  const alphaIndex=i/3*4+3,beforeMask=1-smooth(.22,.75,hit.retention);
  if(isSupport){batch.c[alphaIndex]=Math.min(batch.c[alphaIndex],beforeMask);if(beforeMask<1)stats.masked++;}
  const r=hit.retention*(1-smooth(.055,.095,Math.abs(z-hit.z)));if(r<=.12)continue;
  // Restrict the map to neighboring crown support; a separate foreground bow
  // must not be attracted to a remote/deeper cap sharing its projection.
  // A level-Y inward direction keeps every emitted falling ordinate intact.
  const depth=.035*smooth(.12,.88,r),n=V((x-.012)/(.94*.94),0,(z+.077)/(.857*.857)).normalize();
  x-=n.x*depth;z-=n.z*depth;
  // Near fully retained roots, also keep the forward face beneath the actual
  // retained triangle depth. Every component receives this same spatial map.
  z-=Math.max(0,z-hit.z+.009)*smooth(.35,.75,r);
  stats.moved++;stats.maximumInwardOffset=Math.max(stats.maximumInwardOffset,Math.hypot(x-batch.p[i],y-batch.p[i+1],z-batch.p[i+2]));batch.p[i]=x;batch.p[i+1]=y;batch.p[i+2]=z;
  if(isSupport){const after=field.sample(x,y),gate=after?1-smooth(.22,.75,after.retention):1;batch.c[alphaIndex]=Math.min(batch.c[alphaIndex],gate);if(beforeMask===1&&gate<1)stats.masked++;}
  if(r>=.75){stats.strongRetentionSamples++;stats.minimumStrongDepthGap=Math.min(stats.minimumStrongDepthGap,hit.z-z);}
 }
 return stats;
}
`;
replace('export function createGroomHair({headTilt=-.17,headShiftX=.26,shoulderContact=0,guidePlacement=0,crownPatch124=0}={}){',helper+'\nexport function createGroomHair({headTilt=-.17,headShiftX=.26,shoulderContact=0,guidePlacement=0,crownPatch129=0}={}){');
replace('patchActive124=Number(crownPatch124)>0','patchActive124=Number(crownPatch129)>0');
replace("version:'shared-root-to-fringe-124',families:24,strands:0", "version:'retained-root-to-fringe-129',families:24,dominantForeheadFamilies:5,strands:0");
replace('const counts=[ [50,54,50,54,60,126,112,76,92,44,53,43], [50,52,48,52,52,77,80,94,82,70,49,45] ];',
'const counts=[ [50,54,50,54,60,148,22,136,18,119,17,11], [50,52,48,52,52,23,17,130,21,19,106,13] ];');
replace('const side=s?1:-1,u=roots[s][k],outer=k<5,phase=', 'const side=s?1:-1,u=roots[s][k],outer=k<5,dominant=s?[7,10].includes(k):[5,7,9].includes(k),phase=');
replace('const [ex,ey]=ends[s][k-5],drop=root.y-ey,bow=', 'const [ex,ey]=ends[s][k-5],drop=root.y-ey,bow='); // Assertion keeps the accepted bowed XY controls explicit.
replace('g={side,u,k,outer,c,phase,rootT,exit,halfU,rootWidth,color,count:counts[s][k],tail:.83+.13*(.5+.5*Math.sin(phase*.61))};',
'g={side,u,k,outer,dominant,c,phase,rootT,exit,halfU,rootWidth,color,count:counts[s][k],tail:(outer?.84:dominant?.91:.51)+.09*(.5+.5*Math.sin(phase*.61))};');
replace('return mix(upper,lower,smooth(rootT-.055,rootT+.055,t))*(.15+.85*smooth(0,.085,t))*(.008+.992*(1-smooth(.69+.06*Math.sin(phase),1,t)));',
'return mix(upper,lower,smooth(rootT-.055,rootT+.055,t))*(.15+.85*smooth(0,.085,t));');
replace('const t=j/steps,f=frame(g.c,t,true),w=g.width(t),height=',
'const t=j/steps,f=frame(g.c,t,true),w=g.width(t)*(.012+.988*(1-smooth(.77+.06*Math.sin(g.phase*.73),1,t))),height=');
replace('end=(loose?.73:.59)+(loose?.27:.41)*Math.pow(cutNoise,.32)',
'end=(g.dominant?.89:g.outer?.84:.78)+(g.dominant?.11:g.outer?.16:.22)*Math.pow(cutNoise,g.dominant?.63:.80)');
replace('const strand=fallingPatchCurve124(ps,forehead,!g.outer),width=',
'const strand=fallingPatchCurve124(ps,forehead,!g.outer),width='); // Burial occurs after this clearance step on the completed shared geometry.
replace('coverage124=patchActive124?batch():null','coverage124=patchActive124?batch(true):null');
replace(' if(patchActive124)fiberCount+=patchStats124.strands-fringeStats108.roundCores-fringeStats108.fineCompanions;',
' if(patchActive124){fiberCount+=patchStats124.strands-fringeStats108.roundCores-fringeStats108.fineCompanions;const retained=retainedCrownField129(crownBatch,maps.crownMap);patchStats124.retainedField=retained.metrics;patchStats124.supportBurial=buryReplacement129(coverage124,retained,true);patchStats124.fiberBurial=buryReplacement129(fringe,retained,false);}');
replace('"Continuous root-to-fringe replacement families124"','"Continuous root-to-fringe replacement families129"');
replace('root.userData.crownPatch124=', 'root.userData.crownPatch129=');
replace('The124 front patch replaces', 'The129 front patch replaces');
fs.writeFileSync('review/hair-groom-candidate129.js',source);
console.log(JSON.stringify({written:'review/hair-groom-candidate129.js',bytes:Buffer.byteLength(source)}));
