import referenceURL from '../reference/image1-color.jpg';

// Isolated132: full-resolution, nonrepeated source RGB replaces accepted100
// grain only inside the manually registered front-crown mask. Existing UV1,
// geometry, source-alpha UV0, normal maps, materials and root fibers stay fixed.
// Registration stays exact116. Only six right exterior vertices and one left
// top corner are corrected by vision where116 included pale exterior pixels.
const VERSION='registered-source-crown-replacement-132-v1';
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
const HEADROOM=.60,GAIN_MIN=.42,GAIN_MAX=1.60,LIGHT_RADIUS=56,SOURCE_INSET=6,SOURCE_FADE=12;

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
// The right inner/part boundary and20 of21 left vertices stay exact116. Manual
// crops exposed six overreaching right exterior vertices and one left top
// corner. A modest6px guard/fade6..12 preserves valid narrow source regions.
const SOURCE_HAIR=[
 [[552,35],[520,19],[465,23],[409,46],[349,85],[294,138],[254,201],[229,263],[213,325],[211,362],[229,371],[267,342],[322,297],[377,252],[431,211],[484,189],[533,177],[558,153],[569,122],[574,87],[577,62]],
 [[590,60],[646,68],[691,101],[727,150],[759,222],[785,307],[799,393],[807,475],[805,520],[795,512],[773,446],[747,375],[714,307],[676,245],[637,195],[601,160],[586,125],[583,95]]
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
  if(Math.abs(a[pivot][k])<1e-12)throw new Error('Crown132 registration is singular');
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
async function readReferencePixels132(){
 const photo=new Image();photo.decoding='async';photo.src=referenceURL;await photo.decode();
 if(photo.naturalWidth!==PHOTO_W||photo.naturalHeight!==PHOTO_H)throw new Error('Crown132 requires the original1024x1536 reference');
 const c=document.createElement('canvas');c.width=PHOTO_W;c.height=CROP_H;const ctx=c.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw new Error('Crown132 cannot decode the supplied reference');
 try{ctx.drawImage(photo,0,0);return ctx.getImageData(0,0,PHOTO_W,CROP_H).data;}finally{c.width=c.height=1;}
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
 if(!crown?.isMesh||!mass?.isMesh||!detail?.isMesh)throw new Error('Crown132 requires the accepted crown, mass and detail meshes');
 const g=crown.geometry,m=crown.material,position=g.getAttribute('position'),color=g.getAttribute('color'),uv=g.getAttribute('uv'),uv1=g.getAttribute('uv1');
 if(position?.count!==FOUNDATION+2*SHEET||color?.count!==position.count||color.itemSize!==4||uv?.count!==position.count||uv1?.count!==position.count)throw new Error('Crown132 requires the unchanged108/100 crown topology');
 if(!m.map?.isDataTexture||m.map.channel!==1||m.map.image.width!==ATLAS_W||m.map.image.height!==ATLAS_H||!(m.map.image.data instanceof Uint8Array)||m.alphaMap?.channel!==0||m.normalMap?.channel!==0||m.userData?.referenceCrownMicrocontrast?.version!=='reference-crown-strand-space-100-v1')throw new Error('Crown132 requires the accepted100 UV1 atlas and UV0 coverage/normal maps');
 const matrix=Array.from(crown.matrixWorld.elements);
 for(const mesh of[mass,detail]){
  const c=mesh.geometry.getAttribute('color'),p=mesh.geometry.getAttribute('position');if(c?.count!==p?.count||c.itemSize!==3||!(c.array instanceof Float32Array))throw new Error('Crown132 requires existing root RGB buffers');
  for(let i=0;i<16;i++)if(Math.abs(mesh.matrixWorld.elements[i]-matrix[i])>1e-9)throw new Error('Crown132 root meshes must share the accepted hair transform');
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
 if(tested<100||nonpositive)throw new Error(`Crown132 correspondence folds on its used surface: ${JSON.stringify({tested,nonpositive,min,max,rawMin,rawMax})}`);
 return{testedSurfaceVertices:tested,nonpositive,normalizedJacobian:[min,max],rawJacobian:[rawMin,rawMax],affineDeterminant:registration.affineDeterminant,maxAnchorErrorPixels:registration.maxAnchorErrorPixels,anchors:registration.anchors,method:'Thin-plate map on actual posed crown XY; Jacobian sampled at eligible crown vertices'};
}

function boundedGain132(relative){
 const delta=relative-1,span=delta>=0?GAIN_MAX-1:1-GAIN_MIN;
 return 1+span*Math.tanh(delta/span);
}

function sourceField132(pixels){
 const started=performance.now(),w=PHOTO_W,h=CROP_H,stride=(w+1)*4;
 const data=new Float32Array(w*h*4),sum=new Float64Array((w+1)*(h+1)*4),used=[];
 const boxes=SOURCE_HAIR.map(poly=>({poly,x0:Math.min(...poly.map(p=>p[0])),x1:Math.max(...poly.map(p=>p[0])),y0:Math.min(...poly.map(p=>p[1])),y1:Math.max(...poly.map(p=>p[1]))}));
 let weightSum=0,minimumInset=Infinity;
 for(let y=0;y<h;y++){
  let rr=0,gg=0,bb=0,ww=0;
  for(let x=0;x<w;x++){
   let distance=-Infinity;
   for(const box of boxes)if(x>=box.x0&&x<=box.x1&&y>=box.y0&&y<=box.y1)distance=Math.max(distance,polygonDistance(box.poly,x,y));
   const at=(y*w+x)*4,confidence=distance<SOURCE_INSET?0:smooth(SOURCE_INSET,SOURCE_FADE,distance);
   if(confidence>0){
    const r=LINEAR[pixels[at]],g=LINEAR[pixels[at+1]],b=LINEAR[pixels[at+2]];
    data[at]=r;data[at+1]=g;data[at+2]=b;data[at+3]=confidence;
    rr+=confidence*r;gg+=confidence*g;bb+=confidence*b;ww+=confidence;weightSum+=confidence;used.push(at);minimumInset=Math.min(minimumInset,distance);
   }
   const k=(y+1)*stride+(x+1)*4,previous=k-stride;
   sum[k]=sum[previous]+rr;sum[k+1]=sum[previous+1]+gg;sum[k+2]=sum[previous+2]+bb;sum[k+3]=sum[previous+3]+ww;
  }
 }
 if(weightSum<2000)throw new Error('Crown132 has insufficient manually masked source hair');
 const area=(x0,y0,x1,y1,ch)=>sum[y1*stride+x1*4+ch]-sum[y0*stride+x1*4+ch]-sum[y1*stride+x0*4+ch]+sum[y0*stride+x0*4+ch];
 let minRelative=Infinity,maxRelative=0,maximumRelativeSample=null;
 for(const at of used){
  const i=at/4,x=i%w,y=Math.floor(i/w),x0=Math.max(0,x-LIGHT_RADIUS),x1=Math.min(w,x+LIGHT_RADIUS+1),y0=Math.max(0,y-LIGHT_RADIUS),y1=Math.min(h,y+LIGHT_RADIUS+1),den=area(x0,y0,x1,y1,3);
  if(den<32)throw new Error('Crown132 broad illumination estimate has insufficient hair support');
  for(let ch=0;ch<3;ch++){
   const mean=area(x0,y0,x1,y1,ch)/den,relative=data[at+ch]/Math.max(1e-7,mean);
   if(!Number.isFinite(relative)||relative<0)throw new Error('Crown132 found invalid source-relative RGB');
   if(relative>maxRelative){maxRelative=relative;maximumRelativeSample={x,y,channel:ch,sourceLinear:data[at+ch],illuminationLinear:mean,relative};}
   data[at+ch]=relative;minRelative=Math.min(minRelative,relative);
  }
 }
 // A constant per-channel normalization retains mean linear gain1 after the
 // bounded response. It does not introduce a second spatially varying field.
 const calibration=new Float64Array([1,1,1]),means=new Float64Array(3),slopes=new Float64Array(3);let iterations=0,error=Infinity;
 for(;iterations<8;iterations++){
  means.fill(0);slopes.fill(0);
  for(const at of used)for(let ch=0;ch<3;ch++){
   const relative=data[at+ch],d=relative*calibration[ch]-1,span=d>=0?GAIN_MAX-1:1-GAIN_MIN,t=Math.tanh(d/span),weight=data[at+3];
   means[ch]+=weight*(1+span*t);slopes[ch]+=weight*relative*(1-t*t);
  }
  error=0;for(let ch=0;ch<3;ch++){means[ch]/=weightSum;slopes[ch]/=weightSum;error=Math.max(error,Math.abs(means[ch]-1));}
  if(error<1e-6)break;
  for(let ch=0;ch<3;ch++)calibration[ch]=clamp(calibration[ch]+(1-means[ch])/Math.max(1e-5,slopes[ch]),.1,10);
 }
 const minimum=[Infinity,Infinity,Infinity],maximum=[0,0,0],finalMean=[0,0,0];let energy=0,nearBounds=0;
 for(const at of used)for(let ch=0;ch<3;ch++){
  const gain=boundedGain132(data[at+ch]*calibration[ch]);data[at+ch]=gain;
  minimum[ch]=Math.min(minimum[ch],gain);maximum[ch]=Math.max(maximum[ch],gain);finalMean[ch]+=data[at+3]*gain;energy+=data[at+3]*Math.log(gain)**2;
  if(gain<GAIN_MIN+.02||gain>GAIN_MAX-.02)nearBounds++;
 }
 for(let ch=0;ch<3;ch++)finalMean[ch]/=weightSum;
 if(Math.max(...finalMean.map(v=>Math.abs(v-1)))>.0001)throw new Error('Crown132 linear source-gain normalization did not converge');
 return{data,width:w,height:h,metrics:{nativeSourceGrid:[w,h],validSourcePixels:used.length,weightedSourcePixels:weightSum,sourcePolygons:SOURCE_HAIR,sourcePolygonFadePixels:[SOURCE_INSET,SOURCE_FADE],minimumPolygonInsetPixels:minimumInset,numeratorFilter:'None: original source RGB at every photo pixel',illumination:'Hair-mask-normalized113x113 source-pixel RGB mean; only the denominator is broad',illuminationRadiusPixels:LIGHT_RADIUS,rawRelativeRange:[minRelative,maxRelative],maximumRelativeSample,gainBounds:[GAIN_MIN,GAIN_MAX],actualGainMin:minimum,actualGainMax:maximum,weightedLinearMean:finalMean,globalCalibration:Array.from(calibration),calibrationIterations:iterations+1,logGainRms:Math.sqrt(energy/(weightSum*3)),nearBoundFraction:nearBounds/(used.length*3),sourceSignalBytes:data.byteLength,temporaryIntegralBytes:sum.byteLength,temporaryIndexCount:used.length,sourcePreparationMs:performance.now()-started}};
}

function sampleSource132(field,x,y,out){
 out.fill(0);if(x<0||y<0||x>=field.width-1||y>=field.height-1)return false;
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,data=field.data,a=(iy*field.width+ix)*4,b=a+4,c=a+field.width*4,d=c+4;
 const wa=(1-fx)*(1-fy)*data[a+3],wb=fx*(1-fy)*data[b+3],wc=(1-fx)*fy*data[c+3],wd=fx*fy*data[d+3],total=wa+wb+wc+wd;
 if(total<1e-8)return false;
 for(let ch=0;ch<3;ch++)out[ch]=(wa*data[a+ch]+wb*data[b+ch]+wc*data[c+ch]+wd*data[d+ch])/total;
 out[3]=total;return true;
}

function crownTriangle132(position,side,u,v,out,du,dv){
 const x=clamp(u)*NU,y=clamp(v)*NV,ix=Math.min(NU-1,Math.floor(x)),iy=Math.min(NV-1,Math.floor(y)),fx=x-ix,fy=y-iy;
 const a=FOUNDATION+(side<0?0:SHEET)+iy*(NU+1)+ix,b=a+1,c=a+NU+1,d=c+1;
 // Both accepted sheet windings use the B-C diagonal. Derivatives are per
 // atlas pixel, including the original UV-v=.73*growthV relation.
 for(let ch=0;ch<3;ch++){
  const A=position[a*3+ch],B=position[b*3+ch],C=position[c*3+ch],D=position[d*3+ch];
  if(fx+fy<=1){out[ch]=A+(B-A)*fx+(C-A)*fy;du[ch]=(B-A)*NU/CHART;dv[ch]=(C-A)*NV/(.73*CHART);}
  else{out[ch]=D+(C-D)*(1-fx)+(B-D)*(1-fy);du[ch]=(D-C)*NU/CHART;dv[ch]=(D-B)*NV/(.73*CHART);}
 }
}

function baseFromFoundation132(atlas,u,v,out){
 const x=(u-Math.floor(u))*512-.5,y=clamp(v*1024-.5,0,1023),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 if(iy+1>=ATLAS_H-1040)throw new Error('Crown132 requested unavailable foundation source rows');
 const xa=(ix+512)%512,xb=(ix+1+512)%512,a=((1040+iy)*ATLAS_W+GUTTER+xa)*4,b=((1040+iy)*ATLAS_W+GUTTER+xb)*4,c=a+ATLAS_W*4,d=b+ATLAS_W*4;
 for(let ch=0;ch<3;ch++)out[ch]=lerp(lerp(LINEAR[atlas[a+ch]],LINEAR[atlas[b+ch]],fx),lerp(LINEAR[atlas[c+ch]],LINEAR[atlas[d+ch]],fx),fy);
}

function validate132(hair){
 const selected=validate(hair),{geometry,uv,uv1,color}=selected;
 if(selected.crown.material.userData.registeredCrownColor116)throw new Error('Crown132 requires accepted100 without rejected116');
 const index=geometry.index?.array,foundationIndices=144*52*6;
 if(!index||index.length!==foundationIndices+2*NU*NV*6)throw new Error('Crown132 requires the accepted closed-foundation/two-sheet index layout');
 for(let side=0;side<2;side++)for(let j=0;j<NV;j++)for(let i=0;i<NU;i++){
  const a=FOUNDATION+side*SHEET+j*(NU+1)+i,b=a+1,c=a+NU+1,d=c+1,at=foundationIndices+(side*NU*NV+j*NU+i)*6;
  const expected=side?[a,b,c,b,d,c]:[a,c,b,b,c,d];for(let k=0;k<6;k++)if(index[at+k]!==expected[k])throw new Error('Crown132 actual triangle diagonal changed');
 }
 for(let i=0;i<uv.count;i++){
  const u=uv.array[i*2],v=uv.array[i*2+1],foundation=i<FOUNDATION;
  const x=foundation?GUTTER+u*512:(i<FOUNDATION+SHEET?GUTTER:1024+GUTTER)+u*CHART,y=foundation?1040+v*1024:GUTTER+v*CHART;
  if(Math.abs(uv1.array[i*2]-x/ATLAS_W)>6e-8||Math.abs(uv1.array[i*2+1]-y/ATLAS_H)>6e-8)throw new Error('Crown132 accepted100 UV1 layout changed');
  for(let ch=0;ch<3;ch++){const value=color.array[i*4+ch];if(!Number.isFinite(value)||value<0||value>1)throw new Error('Crown132 existing vertex RGB is outside the legal material range');}
 }
 if(HEADROOM*GAIN_MAX>.985)throw new Error('Crown132 gain bound exceeds retained100 atlas headroom');
 return selected;
}

function bake132(selected,registration,source,strength){
 const started=performance.now(),{crown,position,matrix}=selected,original=crown.material.map.image.data,atlas=new Uint8Array(original);
 const p=new Float64Array(3),q=new Float64Array(3),du=new Float64Array(3),dv=new Float64Array(3),qu=new Float64Array(3),qv=new Float64Array(3),s=new Float64Array(6),gain=new Float64Array(4),tap=new Float64Array(4),base=new Float64Array(3);
 let mappedTexels=0,replacedInteriorTexels=0,changedRGBBytes=0,maximumLinear=0,minGain=Infinity,maxGain=0,aaTexels=0,minimumFootprint=Infinity,maximumFootprint=0,totalFootprint=0;
 const charts=[];
 for(let sideIndex=0;sideIndex<2;sideIndex++){
  let mapped=0,weightSum=0,energy=0;
  for(let y=0;y<CHART;y++)for(let x=0;x<CHART;x++){
   const u=(x+.5)/CHART,v=(y+.5)/CHART;if(v>.73)continue;
   crownTriangle132(position.array,sideIndex?1:-1,u,v/.73,p,du,dv);const spatial=spatialWeight(p,matrix);if(spatial===0)continue;
   transformPoint(matrix,p,q);registration.sample(q[0],q[1],s,true);if(!sampleSource132(source,s[0],s[1],gain))continue;
   transformPoint(matrix,du,qu);transformPoint(matrix,dv,qv);
   const sxu=s[2]*qu[0]+s[3]*qu[1],syu=s[4]*qu[0]+s[5]*qu[1],sxv=s[2]*qv[0]+s[3]*qv[1],syv=s[4]*qv[0]+s[5]*qv[1],footprint=Math.max(Math.hypot(sxu,syu),Math.hypot(sxv,syv));
   minimumFootprint=Math.min(minimumFootprint,footprint);maximumFootprint=Math.max(maximumFootprint,footprint);totalFootprint+=footprint;
   // Only locally minified source footprints receive four subtexel samples.
   // This is an atlas-pixel footprint filter, not a5x5 photo preblur or field blur.
   if(footprint>1.15){
    let r=0,g=0,b=0,w=0;
    for(const ox of[-.25,.25])for(const oy of[-.25,.25])if(sampleSource132(source,s[0]+ox*sxu+oy*sxv,s[1]+ox*syu+oy*syv,tap)){r+=tap[0]*tap[3];g+=tap[1]*tap[3];b+=tap[2]*tap[3];w+=tap[3];}
    if(w===0)continue;gain[0]=r/w;gain[1]=g/w;gain[2]=b/w;gain[3]=w*.25;aaTexels++;
   }
   const weight=strength*spatial*gain[3];if(weight===0)continue;
   baseFromFoundation132(original,u,v,base);const at=((GUTTER+y)*ATLAS_W+sideIndex*1024+GUTTER+x)*4;
   for(let ch=0;ch<3;ch++){
    const target=base[ch]*HEADROOM*gain[ch],value=lerp(LINEAR[original[at+ch]],target,weight);
    if(!Number.isFinite(value)||value<0||value>1)throw new Error('Crown132 replacement exceeded RGB8 headroom');
    const byte=Math.round(clamp(encoded(value))*255);atlas[at+ch]=byte;if(byte!==original[at+ch])changedRGBBytes++;
    maximumLinear=Math.max(maximumLinear,value);minGain=Math.min(minGain,gain[ch]);maxGain=Math.max(maxGain,gain[ch]);energy+=weight*Math.log(gain[ch])**2;
   }
   mapped++;mappedTexels++;weightSum+=weight;if(weight>.999)replacedInteriorTexels++;
  }
  charts.push({side:sideIndex?1:-1,mappedAtlasTexels:mapped,weightedTexels:weightSum,logGainRms:Math.sqrt(energy/Math.max(1,weightSum*3))});
 }
 // Copy only RGB to the existing sheet gutters. Alpha and the complete lower
 // foundation chart remain untouched; the original104 export layout is valid.
 let gutterRGBBytes=0;
 for(let sideIndex=0;sideIndex<2;sideIndex++)for(let y=-GUTTER;y<CHART+GUTTER;y++)for(let x=-GUTTER;x<CHART+GUTTER;x++){
  if(x>=0&&x<CHART&&y>=0&&y<CHART)continue;
  const sx=clamp(x,0,CHART-1),sy=clamp(y,0,CHART-1),a=((GUTTER+sy)*ATLAS_W+sideIndex*1024+GUTTER+sx)*4,b=((GUTTER+y)*ATLAS_W+sideIndex*1024+GUTTER+x)*4;
  for(let ch=0;ch<3;ch++){atlas[b+ch]=atlas[a+ch];if(atlas[b+ch]!==original[b+ch])gutterRGBBytes++;}
 }
 if(mappedTexels<50000)throw new Error('Crown132 has insufficient registered front-crown coverage');
 return{atlas,metrics:{mappedAtlasTexels:mappedTexels,replacedInteriorTexels,changedAtlasRGBBytes:changedRGBBytes,changedGutterRGBBytes:gutterRGBBytes,sourceGainRange:[minGain,maxGain],maximumLinearAtlasRGB:maximumLinear,charts,sourcePixelsPerAtlasTexel:{minimum:minimumFootprint,maximum:maximumFootprint,mean:totalFootprint/Math.max(1,mappedTexels),footprintFilteredTexels:aaTexels},textureReplacement:'Linear blend from accepted100 to original proceduralRGB*.60*registered relativeRGB; no multiplication by100 tiled contrast',proceduralBaseRecovery:'Exact original512x1024 RGB texels from the unchanged100 foundation chart; UV0 bilinear repeatU/clampV sampling',sampling:'Actual crown B-C triangles; direct full-resolution registered source RGB; bilinear sampling plus4 subtexel taps only where source footprint exceeds1.15px',atlasDimensions:[ATLAS_W,ATLAS_H],atlasObjectReused:true,stagingAtlasBytes:atlas.byteLength,retainedExtraTextureBytes:0,retainedExtraAttributeBytes:0,geometryChanged:false,rootRGBChanged:false,vertexRGBChanged:false,UV0Changed:false,UV1Changed:false,alphaChanged:false,normalMapsChanged:false,physicalSettingsChanged:false,additionalDrawCalls:0,perFrameCPUWork:false,bakeMs:performance.now()-started}};
}

export async function applyRegisteredCrownReplacement132(hair,{strength=1}={}){
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Crown132 strength must be within[0,1]');
 const prior=states.get(hair);if(prior){if(prior.strength!==strength)throw new Error('Compare Crown132 strengths on fresh grooms');return prior.promise;}
 if(strength===0)return OFF;
 const selected=validate132(hair),state={strength,promise:null};states.set(hair,state);
 state.promise=(async()=>{
  const start=performance.now(),registration=makeRegistration(selected),mapping=auditMapping(selected,registration),pixels=await readReferencePixels132(),source=sourceField132(pixels),result=bake132(selected,registration,source,strength);
  // All staging and finite/range checks complete before the sole pixel mutation.
  selected.crown.material.map.image.data=result.atlas;selected.crown.material.map.needsUpdate=true;
  const metrics={version:VERSION,strength,status:'applied',changed:true,source:'Only reference/image1-color.jpg derived from uploaded image1',mapping,sourceField:source.metrics,...result.metrics,elapsedMs:performance.now()-start,rootCoverageLimitation:'Overlying root/fine meshes keep their original RGB and shading. This field is per fragment only on the actual crown, not a shared vertex-color approximation.',export:'Existing100 metadata, UV1 layout and104 alpha-merge path are unchanged;132 adds no channel or export representation.'};
  selected.crown.material.userData={...selected.crown.material.userData,registeredCrownReplacement132:metrics};hair.userData.registeredCrownReplacement132=metrics;return metrics;
 })();
 try{return await state.promise;}catch(error){states.delete(hair);throw error;}
}
