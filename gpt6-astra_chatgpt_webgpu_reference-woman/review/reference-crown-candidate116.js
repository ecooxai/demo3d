import referenceURL from '../reference/image1-color.jpg';

// Isolated116: one registered source-color field on the actual crown and its
// visible root fibers. All source correspondences and hair-only boundaries are
// placed by eye in image1. There are no repeated tiles, row corridors, new
// surfaces, coverage edits, or camera-facing picture planes.
const VERSION='registered-source-crown-116-v1';
const states=new WeakMap();
const OFF=Object.freeze({version:VERSION,strength:0,status:'baseline',changed:false});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const encoded=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
const LINEAR=Float64Array.from({length:256},(_,i)=>linear(i/255));
const PHOTO_W=1024,PHOTO_H=1536,CROP_H=544;
const FOUNDATION=7685,SHEET=8385,NU=128,NV=64;
const ATLAS_W=2048,ATLAS_H=2048,CHART=992,GUTTER=16;
const CROWN='Continuous parted crown with longitudinal fiber flow';
const MASS='Overlapping layered S-wave hair around front back and shoulders';
const DETAIL='Independent fine crown lengths and silhouette strands';
const FIELD_W=512,FIELD_H=352,FIELD_X=-1.20,FIELD_Y=.14,FIELD_DX=2.45/(FIELD_W-1),FIELD_DY=1.58/(FIELD_H-1);

// side,u,v identify an actual point on the accepted3D crown. The paired x,y
// belong to the original1024x1536 reference. Each group follows a photographed
// clump from the part toward the temple, rather than an image scan line.
const LANDMARKS=[
 ['part-back',-1,.40,0,577,40],['part-high',-1,.50,0,583,51],
 ['part-mid',-1,.62,0,579,79],['part-turn',-1,.72,0,575,111],
 ['part-front',-1,.82,0,573,149],['part-low',-1,.90,0,565,188],
 ['part-tip',-1,.94,0,554,211],
 ['left-outer-high',-1,.50,.30,425,49],['left-outer-mid',-1,.50,.55,282,173],['left-outer-low',-1,.50,.80,218,341],
 ['left-wide-high',-1,.62,.30,468,82],['left-wide-mid',-1,.62,.55,352,167],['left-wide-low',-1,.62,.80,268,306],
 ['left-deep-high',-1,.72,.30,511,114],['left-deep-mid',-1,.72,.55,420,174],['left-deep-low',-1,.72,.80,338,265],['left-deep-end',-1,.72,.96,281,319],
 ['left-inner-high',-1,.82,.30,535,145],['left-inner-mid',-1,.82,.55,478,186],['left-inner-low',-1,.82,.80,420,234],
 ['left-front-high',-1,.90,.30,542,181],['left-front-mid',-1,.90,.55,506,201],['left-front-low',-1,.90,.80,470,226],
 ['right-outer-high',1,.50,.30,727,182],['right-outer-mid',1,.50,.55,805,346],
 ['right-wide-high',1,.62,.30,697,176],['right-wide-mid',1,.62,.55,773,313],['right-wide-low',1,.62,.80,816,462],
 ['right-deep-high',1,.72,.30,666,166],['right-deep-mid',1,.72,.55,730,269],['right-deep-low',1,.72,.80,777,394],
 ['right-inner-high',1,.82,.30,627,170],['right-inner-mid',1,.82,.55,671,233],['right-inner-low',1,.82,.80,709,312],
 ['right-front-high',1,.90,.30,584,189],['right-front-mid',1,.90,.55,611,222],['right-front-low',1,.90,.80,632,254]
];

// Conservative dense-hair interiors only. Scalp, forehead, ear, fine fringe,
// white cloth and the exterior background are outside these visual polygons.
// The sampling filter has a further3.5px guard; influence fades over4..10px.
const SOURCE_HAIR=[
 [[565,24],[520,19],[465,23],[409,46],[349,85],[294,138],[254,201],[229,263],[213,325],[211,362],[229,371],[267,342],[322,297],[377,252],[431,211],[484,189],[533,177],[558,153],[569,122],[574,87],[577,62]],
 [[590,60],[646,68],[691,101],[733,150],[773,222],[803,307],[820,393],[826,475],[817,520],[795,512],[773,446],[747,375],[714,307],[676,245],[637,195],[601,160],[586,125],[583,95]]
];

function crownPoint(position,side,u,v,out){
 const x=clamp(u)*NU,y=clamp(v)*NV,ix=Math.min(NU-1,Math.floor(x)),iy=Math.min(NV-1,Math.floor(y)),fx=x-ix,fy=y-iy;
 const a=FOUNDATION+(side<0?0:SHEET)+iy*(NU+1)+ix,b=a+1,c=a+NU+1,d=c+1;
 for(let k=0;k<3;k++)out[k]=lerp(lerp(position[a*3+k],position[b*3+k],fx),lerp(position[c*3+k],position[d*3+k],fx),fy);
 return out;
}
function transformPoint(matrix,p,out){
 const x=p[0],y=p[1],z=p[2];
 out[0]=matrix[0]*x+matrix[4]*y+matrix[8]*z;
 out[1]=matrix[1]*x+matrix[5]*y+matrix[9]*z;
 out[2]=matrix[2]*x+matrix[6]*y+matrix[10]*z;
 return out;
}
function solve(matrix,values){
 const a=matrix.map((r,i)=>[...r,values[i]]),n=a.length;
 for(let k=0;k<n;k++){
  let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;
  if(Math.abs(a[pivot][k])<1e-12)throw new Error('Crown116 registration is singular');
  [a[k],a[pivot]]=[a[pivot],a[k]];const d=a[k][k];for(let j=k;j<=n;j++)a[k][j]/=d;
  for(let i=0;i<n;i++)if(i!==k){const f=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=f*a[k][j];}
 }
 return a.map(r=>r[n]);
}
const radial=r2=>r2<1e-16?0:r2*Math.log(r2);
function makeRegistration(selected){
 const p=new Float64Array(3),q=new Float64Array(3);
 const anchors=LANDMARKS.map(([name,side,u,v,sx,sy])=>{
  crownPoint(selected.position.array,side,u,v,p);transformPoint(selected.matrix,p,q);
  return{name,side,u,v,point:Array.from(p),planar:[q[0],q[1]],source:[sx,sy]};
 });
 const n=anchors.length,a=Array.from({length:n+3},()=>Array(n+3).fill(0));
 for(let i=0;i<n;i++){
  for(let j=0;j<n;j++)a[i][j]=radial((anchors[i].planar[0]-anchors[j].planar[0])**2+(anchors[i].planar[1]-anchors[j].planar[1])**2)+(i===j?.000015:0);
  a[i][n]=a[n][i]=1;a[i][n+1]=a[n+1][i]=anchors[i].planar[0];a[i][n+2]=a[n+2][i]=anchors[i].planar[1];
 }
 const cx=solve(a,[...anchors.map(p=>p.source[0]),0,0,0]),cy=solve(a,[...anchors.map(p=>p.source[1]),0,0,0]);
 function sample(x,y,out,derivatives=false){
  let sx=cx[n]+cx[n+1]*x+cx[n+2]*y,sy=cy[n]+cy[n+1]*x+cy[n+2]*y;
  let xx=cx[n+1],xy=cx[n+2],yx=cy[n+1],yy=cy[n+2];
  for(let i=0;i<n;i++){
   const dx=x-anchors[i].planar[0],dy=y-anchors[i].planar[1],r2=dx*dx+dy*dy,r=radial(r2);sx+=cx[i]*r;sy+=cy[i]*r;
   if(derivatives&&r2>1e-16){const f=2*(Math.log(r2)+1);xx+=cx[i]*dx*f;xy+=cx[i]*dy*f;yx+=cy[i]*dx*f;yy+=cy[i]*dy*f;}
  }
  out[0]=sx;out[1]=sy;if(derivatives){out[2]=xx;out[3]=xy;out[4]=yx;out[5]=yy;}return out;
 }
 const out=new Float64Array(6);let maxError=0;
 for(const p of anchors){sample(...p.planar,out);maxError=Math.max(maxError,Math.hypot(out[0]-p.source[0],out[1]-p.source[1]));}
 return{sample,anchors,maxAnchorErrorPixels:maxError,affineDeterminant:cx[n+1]*cy[n+2]-cx[n+2]*cy[n+1]};
}
function polygonDistance(poly,x,y){
 let inside=false,d2=Infinity;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i],dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy));
  d2=Math.min(d2,(x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2);
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return(inside?1:-1)*Math.sqrt(d2);
}
function sourceDistance(x,y){let d=-Infinity;for(const p of SOURCE_HAIR)d=Math.max(d,polygonDistance(p,x,y));return d;}
async function readReferencePixels116(){
 const photo=new Image();photo.decoding='async';photo.src=referenceURL;await photo.decode();
 if(photo.naturalWidth!==PHOTO_W||photo.naturalHeight!==PHOTO_H)throw new Error('Crown116 requires the original1024x1536 reference');
 const c=document.createElement('canvas');c.width=PHOTO_W;c.height=CROP_H;const ctx=c.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw new Error('Crown116 cannot decode the supplied reference');
 try{ctx.drawImage(photo,0,0);return ctx.getImageData(0,0,PHOTO_W,CROP_H).data;}finally{c.width=c.height=1;}
}
function sourceField(pixels){
 const w=PHOTO_W/2,h=CROP_H/2,data=new Float32Array(w*h*4),chroma=new Float64Array(3);
 let weightSum=0,logLuma=0,valid=0,minDistance=Infinity;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){
  const x=i*2+1,y=j*2+1,d=sourceDistance(x,y);if(d<3.5)continue;
  const at=(j*w+i)*4,confidence=smooth(4,10,d);let r=0,g=0,b=0;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const p=((y+dy)*PHOTO_W+x+dx)*4;r+=LINEAR[pixels[p]];g+=LINEAR[pixels[p+1]];b+=LINEAR[pixels[p+2]];
  }
  r/=25;g/=25;b/=25;data[at]=r;data[at+1]=g;data[at+2]=b;data[at+3]=confidence;
  const l=Math.max(1e-7,.2126*r+.7152*g+.0722*b);logLuma+=confidence*Math.log(l);weightSum+=confidence;
  for(let ch=0;ch<3;ch++)chroma[ch]+=confidence*Math.log(Math.max(1e-7,data[at+ch])/l);
  valid++;minDistance=Math.min(minDistance,d);
 }
 if(weightSum<500)throw new Error('Crown116 has insufficient hand-masked source hair');
 logLuma/=weightSum;for(let c=0;c<3;c++)chroma[c]/=weightSum;
 return{data,width:w,height:h,logLuma,chroma,metrics:{filteredSourcePixels:valid,filter:'5x5 linear-RGB mean at a2px stride',minimumSourcePolygonInset:minDistance,sourcePolygons:SOURCE_HAIR,globalLogLuma:logLuma,globalLogChroma:Array.from(chroma),allocatedBytes:data.byteLength}};
}
function sourceSample(field,x,y,out){
 const sx=(x-1)/2,sy=(y-1)/2;if(sx<0||sy<0||sx>=field.width-1||sy>=field.height-1)return false;
 const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,at=(iy*field.width+ix)*4,step=field.width*4;
 const ids=[at,at+4,at+step,at+step+4],weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
 let total=0;out[0]=out[1]=out[2]=0;
 for(let i=0;i<4;i++){const w=weights[i]*field.data[ids[i]+3];total+=w;for(let c=0;c<3;c++)out[c]+=w*field.data[ids[i]+c];}
 if(total<.000001)return false;for(let c=0;c<3;c++)out[c]/=total;
 out[3]=total;return true;
}
function registeredField(registration,source){
 const data=new Float32Array(FIELD_W*FIELD_H*3),p=new Float64Array(6),rgb=new Float64Array(4);
 let mapped=0,min=0,max=0,energy=0;
 for(let j=0;j<FIELD_H;j++)for(let i=0;i<FIELD_W;i++){
  registration.sample(FIELD_X+i*FIELD_DX,FIELD_Y+j*FIELD_DY,p);
  if(!sourceSample(source,p[0],p[1],rgb))continue;
  const l=Math.max(1e-7,.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]),lum=.64*Math.tanh(.90*(Math.log(l)-source.logLuma)/.64),at=(j*FIELD_W+i)*3;
  for(let c=0;c<3;c++){
   const color=.10*Math.tanh(.45*(Math.log(Math.max(1e-7,rgb[c])/l)-source.chroma[c])/.10),value=rgb[3]*(lum+color);
   data[at+c]=value;min=Math.min(min,value);max=Math.max(max,value);energy+=value*value;
  }
  mapped++;
 }
 // Existing root triangles are much longer than a photograph strand. Three
 // separable box passes approximate a Gaussian at the medium-clump scale;
 // every layer receives this SAME field, with100 retaining the fine grain.
 // This filters the registered hair-only signal, never neighboring skin pixels.
 const scratch=new Float32Array(data.length),radius=7,divisor=radius*2+1;
 const pass=(input,output,horizontal)=>{
  const lines=horizontal?FIELD_H:FIELD_W,length=horizontal?FIELD_W:FIELD_H,stride=horizontal?3:FIELD_W*3;
  for(let line=0;line<lines;line++)for(let c=0;c<3;c++){
   const first=(horizontal?line*FIELD_W:line)*3+c;let sum=0;
   for(let k=0;k<=radius;k++)sum+=input[first+k*stride];
   for(let k=0;k<length;k++){
    output[first+k*stride]=sum/divisor;
    if(k-radius>=0)sum-=input[first+(k-radius)*stride];
    if(k+radius+1<length)sum+=input[first+(k+radius+1)*stride];
   }
  }
 };
 for(let i=0;i<3;i++){pass(data,scratch,true);pass(scratch,data,false);}
 let filteredMin=0,filteredMax=0,filteredEnergy=0,filteredMapped=0;
 for(let i=0;i<data.length;i+=3){let used=false;for(let c=0;c<3;c++){const v=data[i+c];filteredMin=Math.min(filteredMin,v);filteredMax=Math.max(filteredMax,v);filteredEnergy+=v*v;used||=Math.abs(v)>1e-6;}if(used)filteredMapped++;}
 return{data,metrics:{grid:[FIELD_W,FIELD_H],planarBounds:[FIELD_X,FIELD_Y,FIELD_X+FIELD_DX*(FIELD_W-1),FIELD_Y+FIELD_DY*(FIELD_H-1)],mappedGridSamples:mapped,filteredMappedSamples:filteredMapped,rawLogGainRange:[min,max],logGainRange:[filteredMin,filteredMax],logGainRms:Math.sqrt(filteredEnergy/Math.max(1,filteredMapped*3)),mediumFilter:{passes:3,boxRadiusCells:radius,planarSigma:[Math.sqrt(radius*(radius+1))*FIELD_DX,Math.sqrt(radius*(radius+1))*FIELD_DY],reason:'Match existing root triangle interpolation while retaining coherent source clump tones'},allocatedBytes:data.byteLength,scratchBytes:scratch.byteLength}};
}
function sampleRegistered(field,x,y,out){
 const u=(x-FIELD_X)/FIELD_DX,v=(y-FIELD_Y)/FIELD_DY;
 if(u<0||v<0||u>=FIELD_W-1||v>=FIELD_H-1){out[0]=out[1]=out[2]=0;return false;}
 const ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy,a=(iy*FIELD_W+ix)*3,c=a+FIELD_W*3;
 for(let ch=0;ch<3;ch++)out[ch]=lerp(lerp(field.data[a+ch],field.data[a+3+ch],fx),lerp(field.data[c+ch],field.data[c+3+ch],fx),fy);
 return true;
}
function spatialWeight(p,m){
 if(p[1]<=.30)return 0;
 // A shared ellipsoid normal avoids unrelated fiber-facing masks. It depends
 // on the same3D point for every layer, with a broad side/back release.
 const nx=(p[0]-.012)/(.94*.94),ny=(p[1]-.327)/(1.302*1.302),nz=(p[2]+.077)/(.857*.857);
 const x=m[0]*nx+m[4]*ny+m[8]*nz,y=m[1]*nx+m[5]*ny+m[9]*nz,z=m[2]*nx+m[6]*ny+m[10]*nz;
 return smooth(.30,.62,p[1])*smooth(-.20,.34,z/(Math.hypot(x,y,z)||1));
}
function validate(hair){
 hair.updateWorldMatrix(true,true);const crown=hair.getObjectByName(CROWN),mass=hair.getObjectByName(MASS),detail=hair.getObjectByName(DETAIL);
 if(!crown?.isMesh||!mass?.isMesh||!detail?.isMesh)throw new Error('Crown116 requires the accepted crown, mass and detail meshes');
 const g=crown.geometry,m=crown.material,position=g.getAttribute('position'),color=g.getAttribute('color'),uv=g.getAttribute('uv'),uv1=g.getAttribute('uv1');
 if(position?.count!==FOUNDATION+2*SHEET||color?.count!==position.count||color.itemSize!==4||uv?.count!==position.count||uv1?.count!==position.count)throw new Error('Crown116 requires the unchanged108/100 crown topology');
 if(!m.map?.isDataTexture||m.map.channel!==1||m.map.image.width!==ATLAS_W||m.map.image.height!==ATLAS_H||!(m.map.image.data instanceof Uint8Array)||m.alphaMap?.channel!==0||m.normalMap?.channel!==0||m.userData?.referenceCrownMicrocontrast?.version!=='reference-crown-strand-space-100-v1')throw new Error('Crown116 requires the accepted100 UV1 atlas and UV0 coverage/normal maps');
 const matrix=Array.from(crown.matrixWorld.elements);
 for(const mesh of[mass,detail]){
  const c=mesh.geometry.getAttribute('color'),p=mesh.geometry.getAttribute('position');if(c?.count!==p?.count||c.itemSize!==3||!(c.array instanceof Float32Array))throw new Error('Crown116 requires existing root RGB buffers');
  for(let i=0;i<16;i++)if(Math.abs(mesh.matrixWorld.elements[i]-matrix[i])>1e-9)throw new Error('Crown116 root meshes must share the accepted hair transform');
 }
 return{crown,mass,detail,geometry:g,position,color,uv,uv1,matrix};
}
function auditMapping(selected,registration){
 const p=new Float64Array(3),q=new Float64Array(3),s=new Float64Array(6),m=selected.matrix;
 let tested=0,min=Infinity,max=-Infinity,nonpositive=0,rawMin=Infinity,rawMax=-Infinity;
 const orientation=Math.sign(registration.affineDeterminant);
 for(let i=FOUNDATION;i<selected.position.count;i++){
  for(let c=0;c<3;c++)p[c]=selected.position.array[i*3+c];if(spatialWeight(p,m)<.01)continue;
  transformPoint(m,p,q);registration.sample(q[0],q[1],s,true);if(sourceDistance(s[0],s[1])<4)continue;
  const det=s[2]*s[5]-s[3]*s[4],value=det/registration.affineDeterminant;
  tested++;min=Math.min(min,value);max=Math.max(max,value);rawMin=Math.min(rawMin,det);rawMax=Math.max(rawMax,det);if(!(orientation*det>0))nonpositive++;
 }
 if(tested<100||nonpositive)throw new Error(`Crown116 correspondence folds on its used surface: ${JSON.stringify({tested,nonpositive,min,max,rawMin,rawMax})}`);
 return{testedSurfaceVertices:tested,nonpositive,normalizedJacobian:[min,max],rawJacobian:[rawMin,rawMax],affineDeterminant:registration.affineDeterminant,maxAnchorErrorPixels:registration.maxAnchorErrorPixels,anchors:registration.anchors,method:'Thin-plate map on actual posed crown XY; Jacobian sampled at eligible crown vertices'};
}
function bake(selected,field,strength){
 const {crown,color,matrix}=selected,original=crown.material.map.image.data,atlas=new Uint8Array(original),p=new Float64Array(3),q=new Float64Array(3),logGain=new Float64Array(3),sourceValue=new Float64Array(3);
 let maximum=0,minGain=1,maxGain=1,mappedTexels=0;
 const gainsAt=(sideIndex,x,y,out)=>{
  const u=(x+.5)/CHART,v=(y+.5)/CHART;let weight=0;
  if(v<=.73){crownPoint(selected.position.array,sideIndex?1:-1,u,v/.73,p);weight=spatialWeight(p,matrix);}
  if(weight>0){transformPoint(matrix,p,q);sampleRegistered(field,q[0],q[1],logGain);}else logGain.fill(0);
  for(let c=0;c<3;c++)out[c]=Math.exp(strength*weight*logGain[c]);
 };
 for(let sideIndex=0;sideIndex<2;sideIndex++)for(let y=0;y<CHART;y++)for(let x=0;x<CHART;x++){
  const at=((GUTTER+y)*ATLAS_W+sideIndex*1024+GUTTER+x)*4;gainsAt(sideIndex,x,y,sourceValue);
  let changed=false;
  for(let c=0;c<3;c++){
   const gain=sourceValue[c];maximum=Math.max(maximum,LINEAR[original[at+c]]*gain);minGain=Math.min(minGain,gain);maxGain=Math.max(maxGain,gain);changed||=Math.abs(gain-1)>1e-5;
  }
  if(changed)mappedTexels++;
 }
 // Preserve HDR ratios inside RGB8 by one sheet-wide compensation, exactly as
 //100 already does. Foundation and atlas alpha remain byte-identical.
 const scale=Math.min(1,.985/Math.max(1e-9,maximum)),colors=new Float32Array(color.array);
 for(let i=FOUNDATION;i<color.count;i++)for(let c=0;c<3;c++){colors[i*4+c]/=scale;if(!Number.isFinite(colors[i*4+c])||colors[i*4+c]>1)throw new Error('Crown116 vertex headroom overflow');}
 let changedRGBBytes=0;
 for(let sideIndex=0;sideIndex<2;sideIndex++)for(let y=0;y<CHART;y++)for(let x=0;x<CHART;x++){
  const at=((GUTTER+y)*ATLAS_W+sideIndex*1024+GUTTER+x)*4;gainsAt(sideIndex,x,y,sourceValue);
  for(let c=0;c<3;c++){const value=LINEAR[original[at+c]]*sourceValue[c]*scale;if(!Number.isFinite(value)||value>1.000001||value<0)throw new Error('Crown116 has invalid atlas RGB');atlas[at+c]=Math.round(clamp(encoded(value))*255);if(atlas[at+c]!==original[at+c])changedRGBBytes++;}
 }
 for(let sideIndex=0;sideIndex<2;sideIndex++)for(let y=-GUTTER;y<CHART+GUTTER;y++)for(let x=-GUTTER;x<CHART+GUTTER;x++){
  if(x>=0&&x<CHART&&y>=0&&y<CHART)continue;
  const sx=clamp(x,0,CHART-1),sy=clamp(y,0,CHART-1),a=((GUTTER+sy)*ATLAS_W+sideIndex*1024+GUTTER+sx)*4,b=((GUTTER+y)*ATLAS_W+sideIndex*1024+GUTTER+x)*4;
  for(let c=0;c<3;c++)atlas[b+c]=atlas[a+c];
 }
 const roots=[];
 for(const mesh of[selected.mass,selected.detail]){
  const position=mesh.geometry.getAttribute('position'),c=mesh.geometry.getAttribute('color'),next=new Float32Array(c.array);let changed=0,minimum=1,maximum=1,lowestChangedY=Infinity;
  for(let i=0;i<position.count;i++){
   for(let ch=0;ch<3;ch++)p[ch]=position.array[i*3+ch];const weight=spatialWeight(p,matrix);if(weight===0)continue;
   transformPoint(matrix,p,q);sampleRegistered(field,q[0],q[1],logGain);let touched=false;
   for(let ch=0;ch<3;ch++){
    const gain=Math.exp(strength*weight*logGain[ch]),value=c.array[i*3+ch]*gain;
    if(!Number.isFinite(value)||value<0||value>1)throw new Error('Crown116 has invalid root RGB');next[i*3+ch]=value;minimum=Math.min(minimum,gain);maximum=Math.max(maximum,gain);touched||=next[i*3+ch]!==c.array[i*3+ch];
   }
   if(touched){changed++;lowestChangedY=Math.min(lowestChangedY,p[1]);}
  }
  roots.push({mesh,attribute:c,array:next,metrics:{name:mesh.name,changedVertices:changed,gainRange:[minimum,maximum],lowestChangedHeadLocalY:Number.isFinite(lowestChangedY)?lowestChangedY:null}});
 }
 return{atlas,colors,roots,metrics:{mappedAtlasTexels:mappedTexels,atlasGainRange:[minGain,maxGain],unscaledAtlasMaximum:maximum,atlasCompensation:scale,changedAtlasRGBBytes:changedRGBBytes,rootMeshes:roots.map(r=>r.metrics),temporaryGainBytes:0,atlasObjectReused:true,atlasDimensions:[ATLAS_W,ATLAS_H],geometryChanged:false,UV0Changed:false,UV1Changed:false,alphaChanged:false,normalMapsChanged:false,physicalSettingsChanged:false,additionalMeshes:0,additionalTriangles:0,additionalTextureBytes:0,perFrameCPUWork:0}};
}

export async function applyRegisteredCrownColor116(hair,{strength=1}={}){
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Crown116 strength must be within[0,1]');
 const prior=states.get(hair);if(prior){if(prior.strength!==strength)throw new Error('Compare Crown116 strengths on fresh grooms');return prior.promise;}
 if(strength===0)return OFF;
 const selected=validate(hair),state={strength,promise:null};states.set(hair,state);
 state.promise=(async()=>{
  const start=performance.now(),registration=makeRegistration(selected),mapping=auditMapping(selected,registration);
  const pixels=await readReferencePixels116(),source=sourceField(pixels),field=registeredField(registration,source),result=bake(selected,field,strength);
  // Mutate only after all mapping, bounds and finite-value checks succeed.
  selected.crown.material.map.image.data=result.atlas;selected.crown.material.map.needsUpdate=true;
  selected.color.array.set(result.colors);selected.color.needsUpdate=true;
  for(const r of result.roots){r.attribute.array.set(r.array);r.attribute.needsUpdate=true;}
  const metrics={version:VERSION,strength,status:'applied',changed:true,source:'Only reference/image1-color.jpg derived from uploaded image1',mapping,sourceField:source.metrics,registeredField:field.metrics,...result.metrics,elapsedMs:performance.now()-start};
  selected.crown.material.userData={...selected.crown.material.userData,registeredCrownColor116:metrics};hair.userData.registeredCrownColor116=metrics;return metrics;
 })();
 try{return await state.promise;}catch(error){states.delete(hair);throw error;}
}
