import fs from 'node:fs';
import {construct136} from './crown136-source.mjs';

export function project136(x,y,z,degrees=0){
 const a=-.17,b=.16,t=degrees*Math.PI/180,xx=x*Math.cos(a)-y*Math.sin(a),yy=x*Math.sin(a)+y*Math.cos(a),X=xx*Math.cos(b)+z*Math.sin(b),Z=-xx*Math.sin(b)+z*Math.cos(b);
 return[X*Math.cos(t)-Z*Math.sin(t),yy,X*Math.sin(t)+Z*Math.cos(t)];
}
export function fiberCoverage136(hair,{resolution=750,radius=.018,views=[0,-35,35]}={}){
 const bounds=[-1.12,.29,1.16,1.70],width=Math.ceil((bounds[2]-bounds[0])*resolution),height=Math.ceil((bounds[3]-bounds[1])*resolution),rasters=[];
 const detail=hair.children[2].geometry,fringe=hair.children[3].geometry,rows=hair.__rows136.filter(r=>r.u>=.72);
 for(const view of views){
  const occupied=new Uint8Array(width*height);let triangles=0;
  const projected=(p,i)=>{const q=project136(p[i*3],p[i*3+1],p[i*3+2],view);return[(q[0]-bounds[0])*resolution,(q[1]-bounds[1])*resolution,q[2]];};
  const draw=(a,b,c)=>{
   const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-11)return;
   const x0=Math.max(0,Math.ceil(Math.min(a[0],b[0],c[0])-.5)),x1=Math.min(width-1,Math.floor(Math.max(a[0],b[0],c[0])-.5)),y0=Math.max(0,Math.ceil(Math.min(a[1],b[1],c[1])-.5)),y1=Math.min(height-1,Math.floor(Math.max(a[1],b[1],c[1])-.5));
   if(x0>x1||y0>y1)return;triangles++;
   const us=(b[1]-c[1])/den,vs=(c[1]-a[1])/den;
   for(let y=y0;y<=y1;y++){
    let u=((b[1]-c[1])*(x0+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den,v=((c[1]-a[1])*(x0+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den;
    for(let x=x0;x<=x1;x++,u+=us,v+=vs)if(u>=0&&v>=0&&u+v<=1)occupied[y*width+x]=1;
   }
  };
  const p=detail.attributes.position.array;
  for(const r of rows){let a=projected(p,r.first),b=projected(p,r.first+1);for(let j=0;j<26;j++){const c=projected(p,r.first+(j+1)*2),d=projected(p,r.first+(j+1)*2+1);draw(a,b,c);draw(b,d,c);a=c;b=d;}}
  const q=fringe.attributes.position.array,ix=fringe.index.array,cache=Array.from({length:q.length/3},(_,i)=>projected(q,i));
  for(let j=0;j<ix.length;j+=3)draw(cache[ix[j]],cache[ix[j+1]],cache[ix[j+2]]);
  const integral=new Uint32Array((width+1)*(height+1)),stride=width+1;
  for(let y=0;y<height;y++){let sum=0;for(let x=0;x<width;x++){sum+=occupied[y*width+x];integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+sum;}}
  const sample=(point,r=radius)=>{
   const q=project136(point[0],point[1],point[2],view),cx=(q[0]-bounds[0])*resolution,cy=(q[1]-bounds[1])*resolution,n=r*resolution;
   const x0=Math.max(0,Math.floor(cx-n)),x1=Math.min(width,Math.ceil(cx+n)),y0=Math.max(0,Math.floor(cy-n)),y1=Math.min(height,Math.ceil(cy+n));
   if(x0>=x1||y0>=y1)return null;
   return(integral[y1*stride+x1]-integral[y0*stride+x1]-integral[y1*stride+x0]+integral[y0*stride+x0])/((x1-x0)*(y1-y0));
  };
  rasters.push({view,triangles,sample});
 }
 return{resolution,radius,width,height,rasters};
}
export function crownSample136(hair,side,u,v){
 const p=hair.children[0].geometry.attributes.position.array,first=side<0?7685:16070,x=u*128,y=v*64,i=Math.min(127,Math.floor(x)),j=Math.min(63,Math.floor(y)),s=x-i,t=y-j;
 const ids=[first+j*129+i,first+j*129+i+1,first+(j+1)*129+i,first+(j+1)*129+i+1],w=[(1-s)*(1-t),s*(1-t),(1-s)*t,s*t];
 return[0,1,2].map(c=>ids.reduce((sum,k,n)=>sum+w[n]*p[k*3+c],0));
}
if(process.argv[1]?.endsWith('crown136-coverage.mjs')){
 const start=performance.now(),hair=construct136(1),coverage=fiberCoverage136(hair),table=[];
 for(const side of[-1,1])for(const u of[.79,.82,.86,.90,.93,.96,.985,1])for(const v of[.3,.5,.65,.75,.85,.925]){
  const point=crownSample136(hair,side,u,v),row={side,u,v,Y:+point[1].toFixed(4),coverage:coverage.rasters.map(r=>+r.sample(point).toFixed(3))};table.push(row);
 }
 const report={candidate:136,kind:'source-only projected fiber coverage before bed withdrawal',geometryChanged:true,bedAlphaChanged:hair.__departure136.changedAlpha,views:coverage.rasters.map(r=>r.view),resolution:coverage.resolution,radius:coverage.radius,trianglesRasterized:coverage.rasters.map(r=>r.triangles),changedFibers:hair.__departure136.changedFibers,table,elapsedMs:performance.now()-start,peakRssMiB:process.resourceUsage().maxRSS/1024};
 fs.writeFileSync('review/crown136-coverage-study.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({...report,table:table.filter(r=>r.u>=.90&&[.3,.65,.85].includes(r.v))}));
}
