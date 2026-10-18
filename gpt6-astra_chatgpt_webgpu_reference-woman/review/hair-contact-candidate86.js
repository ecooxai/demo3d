import { sampleBlouseFrontAtXY } from './blouse.js';

// One smooth spatial warp is shared by every lock and its surface fibers.
// It compresses front depth gently without reversing the order of hair layers.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(t*(t*6-15)+10);};
const roundPositive=(d,tau=.08)=>{if(d<=0)return 0;if(d>=tau)return d-tau*.5;const t=d/tau;return tau*(t*t*t-.5*t*t*t*t);};
// Rounded linear cores reduce curvature across coarse lock triangles while
// retaining C2 joins and a fully excluded collar interior.
const ramp=(x,from,to,tau)=>(roundPositive(x-from,tau)-roundPositive(x-to,tau))/(to-from);
const collarWeight=(x,y)=>1-(1-ramp(Math.abs(x),.84,1.14,.16))*ramp(y,-.20,.39,.14);

function clothField(sampleSurface){
 const started=performance.now(),step=.06,x0=-1.92,y0=-1.50,nx=65,ny=55,size=nx*ny,depth=new Float64Array(size),raw=new Float32Array(size),weight=new Float32Array(size),seen=new Uint8Array(size),queue=new Int32Array(size);
 let tail=0,queries=0,queryMs=0;
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const index=j*nx+i,start=performance.now(),hit=sampleSurface(x0+i*step,y0+j*step);queries++;queryMs+=performance.now()-start;
  if(!hit)continue;
  depth[index]=hit.point.z+.045/hit.normal.z+.008;raw[index]=hit.edgeWeight;seen[index]=1;queue[tail++]=index;
 }
 const valid=tail;
 // Finite nearest-sample extension only supplies height outside support. A
 // separate eroded weight controls attraction, so missing samples add no pull.
 for(let head=0;head<tail;head++){
  const index=queue[head],x=index%nx,y=Math.floor(index/nx);
  for(const [dx,dy]of[[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx<0||xx>=nx||yy<0||yy>=ny)continue;const at=yy*nx+xx;if(seen[at])continue;seen[at]=1;depth[at]=depth[index];queue[tail++]=at;}
 }
 // A wide distance fade removes the narrow support cliffs that would be
 // poorly represented by the existing mesh's length segments.
 const distance=new Float64Array(size),diagonal=step*Math.SQRT2;
 for(let i=0;i<size;i++)distance[i]=raw[i]>.001?100:0;
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const k=j*nx+i;let d=distance[k];if(i)d=Math.min(d,distance[k-1]+step);if(j)d=Math.min(d,distance[k-nx]+step);if(i&&j)d=Math.min(d,distance[k-nx-1]+diagonal);if(j&&i<nx-1)d=Math.min(d,distance[k-nx+1]+diagonal);distance[k]=d;
 }
 for(let j=ny-1;j>=0;j--)for(let i=nx-1;i>=0;i--){
  const k=j*nx+i;let d=distance[k];if(i<nx-1)d=Math.min(d,distance[k+1]+step);if(j<ny-1)d=Math.min(d,distance[k+nx]+step);if(i<nx-1&&j<ny-1)d=Math.min(d,distance[k+nx+1]+diagonal);if(j<ny-1&&i)d=Math.min(d,distance[k+nx-1]+diagonal);distance[k]=d;
 }
 for(let j=2;j<ny-2;j++)for(let i=2;i<nx-2;i++){
  let w=1;for(let y=j-2;y<=j+2;y++)for(let x=i-2;x<=i+2;x++)w=Math.min(w,raw[y*nx+x]);weight[j*nx+i]=w*ramp(distance[j*nx+i],.10,.50,.16);
 }
 // Nonnegative tensor B-spline weights keep both fields C2 across cell joins.
 function sample(x,y){
  const u=(x-x0)/step,v=(y-y0)/step,i=Math.floor(u),j=Math.floor(v);
  if(i<1||j<1||i>nx-3||j>ny-3)return{depth:0,weight:0};
  const a=u-i,b=v-j,a2=a*a,a3=a2*a,b2=b*b,b3=b2*b;
  const wx=[(1-a)**3/6,(3*a3-6*a2+4)/6,(-3*a3+3*a2+3*a+1)/6,a3/6],wy=[(1-b)**3/6,(3*b3-6*b2+4)/6,(-3*b3+3*b2+3*b+1)/6,b3/6];
  let z=0,w=0;
  for(let row=0;row<4;row++){const k=(j+row-1)*nx+i-1;for(let col=0;col<4;col++){const f=wx[col]*wy[row];z+=depth[k+col]*f;w+=weight[k+col]*f;}}
  return{depth:z,weight:clamp(w)};
 }
 return{sample,metrics:{grid:[nx,ny],gridStep:step,clothQueries:queries,validClothQueries:valid,queryMs:Number(queryMs.toFixed(1)),preparationMs:Number((performance.now()-started).toFixed(1)),fieldKiB:Number(((depth.byteLength+weight.byteLength)/1024).toFixed(1))}};
}

export function createHairContact({headTilt=-.17,headShiftX=.26,headY=2.95,strength=1,sampleSurface=sampleBlouseFrontAtXY}={}){
 strength=clamp(Number(strength));
 const field=clothField(sampleSurface),yaw=.16,cy=Math.cos(yaw),sy=Math.sin(yaw),cr=Math.cos(headTilt),sr=Math.sin(headTilt),bc=Math.cos(.045),bs=Math.sin(.045),axis=[-sy*cr,sy*sr,cy];
 const metrics={version:'shared-cloth-depth-86',strength,minimumDepthDerivative:1-.40*strength,...field.metrics,movedVertices:0,maxDepthPull:0};
 function atModel(x,y,z,amount=strength){
  const vertical=smooth(-.95,-.20,y)*(1-smooth(1.22,1.92,y));if(vertical===0)return 0;
  const bx=bc*x+bs*(y-1),by=-bs*x+bc*(y-1)+1,collar=collarWeight(bx,by);if(collar===0)return 0;
  const support=field.sample(bx,by);if(support.weight===0)return 0;
  return-.40*clamp(amount)*vertical*collar*support.weight*roundPositive(z-support.depth);
 }
 function shift(x,y,z){
  const rx=x*cr-y*sr,px=headShiftX+rx*cy+z*sy,py=headY+x*sr+y*cr,pz=-rx*sy+z*cy,d=atModel(px,py,pz);
  if(d<-.000001){metrics.movedVertices++;metrics.maxDepthPull=Math.max(metrics.maxDepthPull,-d);}return d;
 }
 return{shift,axis,atModel,fieldAtBlouse:field.sample,metrics};
}
