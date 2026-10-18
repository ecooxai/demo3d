import * as THREE from 'three';
import referenceURL from '../reference/image1-color.jpg';

// Candidate 107: the supplied photograph's real longitudinal strand contrast
// on the existing closed long locks. UV0 and all geometry stay untouched.
// Fine signal is unwrapped along two manually chosen curved hair-only strips.
// Circumference uses one periodic strip width; the existing per-lock UV phases
// provide variation without repeating the crown experiment's many cross tiles.
const VERSION='reference-lengths-strand-space-107-v1';
const MASS_NAME='Overlapping layered S-wave hair around front back and shoulders';
const DEFAULT_OPTIONS=Object.freeze({strength:1});
const ZERO_RESULT=Object.freeze({version:VERSION,strength:0,status:'baseline',changed:false});
const states=new WeakMap();
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const encoded=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
const LINEAR=Float64Array.from({length:256},(_,i)=>linear(i/255));
const PHOTO_WIDTH=1024,PHOTO_HEIGHT=1536,STRIP_WIDTH=96,STRIP_HEIGHT=2048;
const MAP_WIDTH=512,MAP_HEIGHT=1024,HEADROOM=.60,MAX_GAIN=1.64,MIN_GAIN=.60;
const SOURCE_PERIOD=.86,LOCK_ROWS=61,LOCK_COLUMNS=9,LOCK_VERTICES=LOCK_ROWS*LOCK_COLUMNS;

// Manual x/y / half-width in the sole source photo. The left strip follows the
// coherent upper ear-side run; the right follows the dense inner fall. These
// stop before lower photographed families cross, so actual fine signal remains
// longitudinal. Neither strip reaches skin, clothing, background or sparse tips.
const SOURCE_STRIPS=[
 {name:'left-long-strand-strip',side:-1,points:[
  [246,525,16],[240,575,19],[223,650,20],[199,722,20],
  [175,786,19],[163,838,18],[156,887,16]
 ]},
 {name:'right-long-strand-strip',side:1,points:[
  [746,520,18],[753,600,21],[750,690,23],[746,775,23],
  [751,855,23],[764,930,22],[782,996,21],[809,1052,18]
 ]}
];
function sourcePath107(points){
 let length=0;
 const rows=points.map((p,i)=>{if(i)length+=Math.hypot(p[0]-points[i-1][0],p[1]-points[i-1][1]);return[length,...p];});
 const slopes=rows.map((row,i)=>row.map((value,k)=>{
  if(!k)return 1;
  if(!i)return(rows[1][k]-value)/(rows[1][0]-row[0]);
  if(i===rows.length-1)return(value-rows[i-1][k])/(row[0]-rows[i-1][0]);
  const a=rows[i-1],b=rows[i+1],h0=row[0]-a[0],h1=b[0]-row[0],d0=(value-a[k])/h0,d1=(b[k]-value)/h1;
  return d0*d1<=0?0:3*(h0+h1)/((2*h1+h0)/d0+(h1+2*h0)/d1);
 }));
 return{rows,slopes,length};
}
function samplePath107(path,t,out){
 const s=clamp(t)*path.length,rows=path.rows;let i=0;
 while(i<rows.length-2&&s>rows[i+1][0])i++;
 const a=rows[i],b=rows[i+1],h=b[0]-a[0],v=clamp((s-a[0])/h),v2=v*v,v3=v2*v;
 for(let k=1;k<4;k++)out[k-1]=(2*v3-3*v2+1)*a[k]+(v3-2*v2+v)*h*path.slopes[i][k]+(-2*v3+3*v2)*b[k]+(v3-v2)*h*path.slopes[i+1][k];
 const derivative=k=>((6*v2-6*v)*a[k]+(3*v2-4*v+1)*h*path.slopes[i][k]+(-6*v2+6*v)*b[k]+(3*v2-2*v)*h*path.slopes[i+1][k])/h;
 const dx=derivative(1),dy=derivative(2),n=Math.hypot(dx,dy);
 if(!Number.isFinite(n)||n<1e-8)throw new Error('Manual source strand path has an invalid tangent');
 out[3]=-dy/n;out[4]=dx/n;return out;
}
function sourceLuma107(pixels,x,y){
 if(x<0||y<0||x>=PHOTO_WIDTH-1||y>=PHOTO_HEIGHT-1)throw new Error('Manual source strand strip left the decoded photo interior');
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a=(iy*PHOTO_WIDTH+ix)*4,b=a+4,c=a+PHOTO_WIDTH*4,d=c+4;
 const luma=p=>.2126*LINEAR[pixels[p]]+.7152*LINEAR[pixels[p+1]]+.0722*LINEAR[pixels[p+2]];
 return lerp(lerp(luma(a),luma(b),fx),lerp(luma(c),luma(d),fx),fy);
}
function unwrapSourceStrip107(spec,pixels){
 const path=sourcePath107(spec.points),w=STRIP_WIDTH,h=STRIP_HEIGHT,luma=new Float32Array(w*h),halfWidths=new Float64Array(h),p=new Float64Array(5);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,sourceLength=0,previous=null,widthSum=0;
 for(let y=0;y<h;y++){
  samplePath107(path,(y+.5)/h,p);halfWidths[y]=p[2];widthSum+=p[2]*2;
  if(previous)sourceLength+=Math.hypot(p[0]-previous[0],p[1]-previous[1]);previous=[p[0],p[1]];
  for(let x=0;x<w;x++){
   const q=((x+.5)/w*2-1)*p[2],sx=p[0]+p[3]*q,sy=p[1]+p[4]*q;
   luma[y*w+x]=sourceLuma107(pixels,sx,sy);
   minX=Math.min(minX,sx);maxX=Math.max(maxX,sx);minY=Math.min(minY,sy);maxY=Math.max(maxY,sy);
  }
 }
 // The accepted two-band extraction is retained in source-pixel units,
 // now after unwrapping. A near 3-pixel mean retains fine strand contrast;
 // the smaller 3-to-10-pixel group term prevents flat, identical hair lanes.
 const sum=new Float64Array((w+1)*(h+1));
 for(let y=0;y<h;y++){let total=0;const before=y*(w+1),line=(y+1)*(w+1);for(let x=0;x<w;x++){total+=luma[y*w+x];sum[line+x+1]=sum[before+x+1]+total;}}
 const mean=(x,y,rx,ry)=>{const x0=Math.max(0,x-rx),y0=Math.max(0,y-ry),x1=Math.min(w,x+rx+1),y1=Math.min(h,y+ry+1);return(sum[y1*(w+1)+x1]-sum[y0*(w+1)+x1]-sum[y1*(w+1)+x0]+sum[y0*(w+1)+x0])/((x1-x0)*(y1-y0));};
 const signal=new Float32Array(w*h),alongPixelsPerSourcePixel=h/sourceLength,nearY=Math.max(1,Math.round(3*alongPixelsPerSourcePixel)),farY=Math.max(1,Math.round(10*alongPixelsPerSourcePixel));
 let minimum=Infinity,maximum=-Infinity,energy=0,fineEnergy=0,groupEnergy=0,nearShoulder=0;
 for(let y=0;y<h;y++){
  const scaleX=w/(2*halfWidths[y]),nearX=Math.max(1,Math.round(3*scaleX)),farX=Math.max(1,Math.round(10*scaleX));
  for(let x=0;x<w;x++){
   const at=y*w+x,logLuma=Math.log(Math.max(1e-6,luma[at])),nearMean=Math.log(Math.max(1e-6,mean(x,y,nearX,nearY))),groupMean=Math.log(Math.max(1e-6,mean(x,y,farX,farY)));
   const fine=logLuma-nearMean,group=nearMean-groupMean,residual=.92*fine+.16*group;
   const value=.48*Math.tanh(residual/.62);signal[at]=value;
   minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);energy+=value*value;fineEnergy+=fine*fine;groupEnergy+=group*group;if(Math.abs(value)>.432)nearShoulder++;
  }
 }
 return{signal,width:w,height:h,metrics:{name:spec.name,manualCenterline:spec.points,sourceBounds:[minX,minY,maxX,maxY],sourceLengthPixels:sourceLength,meanSourceWidthPixels:widthSum/h,unwrappedWidth:w,unwrappedHeight:h,sampledTexels:w*h,logContrastMin:minimum,logContrastMax:maximum,logContrastRms:Math.sqrt(energy/(w*h)),fineResidualRms:Math.sqrt(fineEnergy/(w*h)),groupResidualRms:Math.sqrt(groupEnergy/(w*h)),nearShoulderFraction:nearShoulder/(w*h),localMeanRadiiSourcePixels:[3,10],fineWeight:.92,groupWeight:.16}};
}
function sampleStrip107(strip,u,v){
 const x=clamp(u)*(strip.width-1),y=clamp(v)*(strip.height-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,w=strip.width,a=iy*w+ix,b=iy*w+Math.min(w-1,ix+1),c=Math.min(strip.height-1,iy+1)*w+ix,d=Math.min(strip.height-1,iy+1)*w+Math.min(w-1,ix+1);
 return lerp(lerp(strip.signal[a],strip.signal[b],fx),lerp(strip.signal[c],strip.signal[d],fx),fy);
}

function samplePeriodic107(strip,u,v){
 const wrapped=u-Math.floor(u),center=.5+(wrapped-.5)*SOURCE_PERIOD;
 let value=0,total=0;
 // Adjacent copies overlap only at the circular seam. Their source width and
 // along-strand direction remain fixed; the normalized window is C1 periodic.
 for(const offset of [-SOURCE_PERIOD,0,SOURCE_PERIOD]){
  const q=center+offset;if(q<=0||q>=1)continue;
  const weight=Math.sin(Math.PI*q)**2;value+=weight*sampleStrip107(strip,q,v);total+=weight;
 }
 if(total<.01)throw new Error('Source strip circular blend has insufficient overlap');
 return value/total;
}
function sampleLengthField107(strips,u,v){
 const along=.018+.96*clamp((v-.20)/.80);
 // Each contributes real, independent photographed strands. A fixed phase
 // offset prevents the two strips from reinforcing identical dark groups.
 const left=samplePeriodic107(strips[0],u+.137,along),right=samplePeriodic107(strips[1],u+.563,.02+.96*along);
 return .62*left+.38*right;
}
function validateLengths107(hair){
 const mass=hair?.getObjectByName(MASS_NAME);
 if(!mass?.isMesh||Array.isArray(mass.material))throw new Error('Candidate 107 expects the accepted single-material long-lock mesh');
 const geometry=mass.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv'),color=geometry.getAttribute('color');
 if(!position||position.count%LOCK_VERTICES||normal?.count!==position.count||uv?.count!==position.count||color?.count!==position.count||color.itemSize!==3)throw new Error('Candidate 107 requires unchanged 61-by-9 closed locks and RGB vertex colors');
 const material=mass.material,base=material.map;
 if(!base?.isDataTexture||base.image.width!==MAP_WIDTH||base.image.height!==MAP_HEIGHT||!(base.image.data instanceof Uint8Array)||(base.channel??0)!==0||(material.normalMap?.channel??0)!==0||material.alphaMap)throw new Error('Candidate 107 requires the accepted RGBA8/UV0 maps and inline alpha');
 for(let first=0;first<position.count;first+=LOCK_VERTICES){
  const phase=uv.array[first*2];
  for(let row=0;row<LOCK_ROWS;row++)for(let column=0;column<LOCK_COLUMNS;column++){
   const i=first+row*LOCK_COLUMNS+column;
   if(Math.abs(uv.array[i*2]-phase-column/8)>3e-6||Math.abs(uv.array[i*2+1]-row/60)>1e-6)throw new Error('Accepted long-lock UV grid changed');
  }
 }
 return{mass,geometry,position,normal,uv,color,material,base,lockCount:position.count/LOCK_VERTICES};
}
async function readReferencePixels107(){
 const photo=new Image();photo.decoding='async';photo.src=referenceURL;await photo.decode();
 if(photo.naturalWidth!==PHOTO_WIDTH||photo.naturalHeight!==PHOTO_HEIGHT)throw new Error('Candidate 107 requires the supplied 1024 by 1536 reference');
 const canvas=document.createElement('canvas');canvas.width=PHOTO_WIDTH;canvas.height=PHOTO_HEIGHT;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Reference color decoding is unavailable');
 try{ctx.drawImage(photo,0,0);return ctx.getImageData(0,0,PHOTO_WIDTH,PHOTO_HEIGHT).data;}
 finally{canvas.width=canvas.height=1;}
}
function bakeLengths107(selected,pixels,strength){
 const started=performance.now(),{base,color,lockCount}=selected,strips=SOURCE_STRIPS.map(spec=>unwrapSourceStrip107(spec,pixels));
 const original=base.image.data,map=new Uint8Array(original),colors=new Float32Array(color.array),gains=new Float64Array(MAP_WIDTH),weights=new Float64Array(MAP_WIDTH);
 const metrics={version:VERSION,strength,lockCount,sourceStrips:strips.map(s=>s.metrics),sourceSignalBytes:strips.reduce((n,s)=>n+s.signal.byteLength,0),mapping:'One periodic source-strip width across existing circumference U; source strand arc along guide V',sourcePeriod:SOURCE_PERIOD,sourceMix:[.62,.38],rootFadeV:[.18,.36],tipFadeV:[.89,1],normalization:'Original-luminance-weighted arithmetic gain is exactly one on each texture row before RGBA8 quantization',headroom:HEADROOM};
 let gainMin=1,gainMax=1,logEnergy=0,changedTexels=0,compressionMin=1,rowMeanErrorMax=0,quantizedRowMeanErrorMax=0,compressedRows=0,alphaMismatches=0;
 for(let y=0;y<MAP_HEIGHT;y++){
  const v=y/(MAP_HEIGHT-1),fade=smooth(.18,.36,v)*(1-smooth(.89,1,v));let sum=0,total=0,minimum=Infinity,maximum=-Infinity;
  for(let x=0;x<MAP_WIDTH;x++){
   const i=(y*MAP_WIDTH+x)*4,sourceWeight=.2126*LINEAR[original[i]]+.7152*LINEAR[original[i+1]]+.0722*LINEAR[original[i+2]],gain=fade?Math.exp(strength*fade*sampleLengthField107(strips,(x+.5)/MAP_WIDTH,v)):1;
   gains[x]=gain;weights[x]=sourceWeight;sum+=gain*sourceWeight;total+=sourceWeight;minimum=Math.min(minimum,gain);maximum=Math.max(maximum,gain);
  }
  const mean=sum/total,low=minimum/mean,high=maximum/mean;
  // Compression around one preserves row brightness while bounding highlights
  // below RGBA8 headroom. It does not clip individual strands or change alpha.
  const compression=Math.min(1,high>1?(MAX_GAIN-1)/(high-1):1,low<1?(1-MIN_GAIN)/(1-low):1);
  if(compression<.999999)compressedRows++;compressionMin=Math.min(compressionMin,compression);
  let actualMean=0,encodedMean=0;
  for(let x=0;x<MAP_WIDTH;x++){
   const i=(y*MAP_WIDTH+x)*4,gain=1+(gains[x]/mean-1)*compression;
   if(fade){changedTexels++;gainMin=Math.min(gainMin,gain);gainMax=Math.max(gainMax,gain);logEnergy+=Math.log(gain)**2;}
   actualMean+=gain*weights[x];
   for(let ch=0;ch<3;ch++){
    const value=LINEAR[original[i+ch]]*HEADROOM*gain;
    if(!Number.isFinite(value)||value<0||value>1)throw new Error('Long-hair signal exceeded exportable color range');
    map[i+ch]=Math.round(clamp(encoded(value))*255);
   }
   encodedMean+=(.2126*LINEAR[map[i]]+.7152*LINEAR[map[i+1]]+.0722*LINEAR[map[i+2]])/HEADROOM;
   if(map[i+3]!==original[i+3])alphaMismatches++;
  }
  rowMeanErrorMax=Math.max(rowMeanErrorMax,Math.abs(actualMean/total-1));
  quantizedRowMeanErrorMax=Math.max(quantizedRowMeanErrorMax,Math.abs(encodedMean/total-1));
 }
 let vertexColorMin=Infinity,vertexColorMax=-Infinity;
 for(let i=0;i<colors.length;i++){
  colors[i]/=HEADROOM;if(!Number.isFinite(colors[i])||colors[i]<0||colors[i]>1)throw new Error('Compensated long-hair vertex RGB is outside exportable range');
  vertexColorMin=Math.min(vertexColorMin,colors[i]);vertexColorMax=Math.max(vertexColorMax,colors[i]);
 }
 Object.assign(metrics,{gainMin,gainMax,logGainRms:Math.sqrt(logEnergy/Math.max(1,changedTexels)),changedTexels,compressedRows,compressionMin,rowMeanErrorMax,quantizedRowMeanErrorMax,alphaMismatches,vertexColorRange:[vertexColorMin,vertexColorMax],bakeMs:performance.now()-started,textureBytes:map.byteLength,replacedColorBytes:colors.byteLength,netRetainedTextureBytes:0,netRetainedAttributeBytes:0,estimatedNetMipmappedGPUBytes:0,sourcePixelBytes:pixels.byteLength,geometryPositionsChanged:false,originalUV0Changed:false,normalFieldChanged:false,coverageBytesChanged:false,additionalMeshes:0,additionalTriangles:0,additionalMaterialDraws:0,perFrameCPUWork:0,export:{baseColorTexCoord:0,normalTexCoord:0,inlineRGBAAlpha:true,requiresAlphaMerge:false,maxMapDimension:1024}});
 return{map,colors,metrics};
}
function lengthTexture107(data,base){
 const texture=new THREE.DataTexture(data,MAP_WIDTH,MAP_HEIGHT,THREE.RGBAFormat);
 for(const key of ['wrapS','wrapT','minFilter','magFilter','generateMipmaps','anisotropy','flipY','unpackAlignment'])texture[key]=base[key];
 texture.name='Reference-only normalized long-hair strand contrast / original UV0 and alpha';texture.channel=0;texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}
export function applyReferenceLengthsMicrocontrast107(hair,options=DEFAULT_OPTIONS){
 const strength=options.strength??1;
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Long-hair strength must be within [0,1]');
 const prior=states.get(hair);if(prior){if(prior.strength!==strength)throw new Error('Compare candidate 107 strengths on fresh grooms');return prior.promise;}
 if(strength===0)return ZERO_RESULT;
 const selected=validateLengths107(hair),state={strength,promise:null};states.set(hair,state);
 state.promise=(async()=>{
  const started=performance.now(),pixels=await readReferencePixels107(),result=bakeLengths107(selected,pixels,strength);
  const material=selected.material.clone();material.map=lengthTexture107(result.map,selected.base);material.needsUpdate=true;
  selected.geometry.setAttribute('color',new THREE.Float32BufferAttribute(result.colors,3));selected.mass.material=material;
  result.metrics.elapsedMs=performance.now()-started;result.metrics.status='applied';result.metrics.changed=true;
  material.userData={...material.userData,referenceLengthsMicrocontrast:result.metrics};hair.userData.referenceLengthsMicrocontrast=result.metrics;
  return result.metrics;
 })().catch(error=>{states.delete(hair);throw error;});
 return state.promise;
}
