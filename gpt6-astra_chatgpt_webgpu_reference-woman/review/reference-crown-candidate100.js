import * as THREE from 'three';
import referenceURL from '../reference/image1-color.jpg';

// Candidate 100: manually unwrapped source-hair strips follow the real crown's
// root-to-edge UV v. Screen rows do not participate in the color correspondence.
// Only the supplied photo is sampled. No photo planes, feature detection,
// synthetic grain, new geometry, altered coverage, or changes to normal UVs.
const VERSION='reference-crown-strand-space-100-v1';
const states=new WeakMap();
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const encoded=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
const LINEAR=Float64Array.from({length:256},(_,i)=>linear(i/255));
const PHOTO_WIDTH=1024,PHOTO_HEIGHT=1536,PHOTO_CROP_HEIGHT=544;
const FOUNDATION_VERTICES=145*53,SHEET_VERTICES=129*65,NU=128,NV=64;
const ATLAS_WIDTH=2048,ATLAS_HEIGHT=2048,CHART_SIZE=992,GUTTER=16,HEADROOM=.60;
const STRIP_WIDTH=96,STRIP_HEIGHT=768;
const CROWN_NAME='Continuous parted crown with longitudinal fiber flow';

// Hand-chosen centerline x/y and half-width in the original photo. The complete
// curved strips are inside dense hair, stopping before scalp/ear/skin/background.
// Widths narrow near the part and lower left temple. Each path follows a visible
// source bundle; its perpendicular coordinate is across strands, never image x.
const SOURCE_STRIPS=[
 {name:'left-crown-strand-strip',side:-1,points:[
  [540,73,18],[493,80,22],[446,95,24],[411,120,26],
  [376,152,26],[348,185,25],[322,220,24],[302,253,23],
  [286,286,21],[265,312,18]
 ]},
 {name:'right-crown-strand-strip',side:1,points:[
  [638,120,18],[680,164,20],[715,212,22],[745,270,23],
  [768,340,22],[782,410,20],[790,480,18]
 ]}
];

// Unequal, overlapping cross-strand tiles. About four tiles cover the visible
// front half of each sheet. Along-strand phase changes are constant per tile;
// they cannot make the source grain bend across the crown growth direction.
// Each source strip remains almost its original longitudinal scale. No along-v
// repetition, transverse waves, or stretched whole-photograph highlights.
const STRAND_TILES=[
 [-.045,.100,-.017,.895,false],[.082,.098,.021,.862,true],
 [.207,.096,-.006,.911,false],[.336,.100,.034,.862,false],
 [.458,.097,-.022,.908,true],[.584,.099,.013,.878,false],
 [.706,.099,-.031,.923,true],[.836,.100,.028,.867,false],
 [.964,.101,-.008,.904,true],[1.092,.102,.016,.876,false]
];

function sourcePath100(points){
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
function samplePath100(path,t,out){
 const s=clamp(t)*path.length,rows=path.rows;let i=0;
 while(i<rows.length-2&&s>rows[i+1][0])i++;
 const a=rows[i],b=rows[i+1],h=b[0]-a[0],v=clamp((s-a[0])/h),v2=v*v,v3=v2*v;
 for(let k=1;k<4;k++)out[k-1]=(2*v3-3*v2+1)*a[k]+(v3-2*v2+v)*h*path.slopes[i][k]+(-2*v3+3*v2)*b[k]+(v3-v2)*h*path.slopes[i+1][k];
 const derivative=k=>((6*v2-6*v)*a[k]+(3*v2-4*v+1)*h*path.slopes[i][k]+(-6*v2+6*v)*b[k]+(3*v2-2*v)*h*path.slopes[i+1][k])/h;
 const dx=derivative(1),dy=derivative(2),n=Math.hypot(dx,dy);
 if(!Number.isFinite(n)||n<1e-8)throw new Error('Manual source strand path has an invalid tangent');
 out[3]=-dy/n;out[4]=dx/n;return out;
}
function sourceLuma100(pixels,x,y){
 if(x<0||y<0||x>=PHOTO_WIDTH-1||y>=PHOTO_CROP_HEIGHT-1)throw new Error('Manual source strand strip left the decoded photo interior');
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a=(iy*PHOTO_WIDTH+ix)*4,b=a+4,c=a+PHOTO_WIDTH*4,d=c+4;
 const luma=p=>.2126*LINEAR[pixels[p]]+.7152*LINEAR[pixels[p+1]]+.0722*LINEAR[pixels[p+2]];
 return lerp(lerp(luma(a),luma(b),fx),lerp(luma(c),luma(d),fx),fy);
}
function unwrapSourceStrip100(spec,pixels){
 const path=sourcePath100(spec.points),w=STRIP_WIDTH,h=STRIP_HEIGHT,luma=new Float32Array(w*h),halfWidths=new Float64Array(h),p=new Float64Array(5);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,sourceLength=0,previous=null,widthSum=0;
 for(let y=0;y<h;y++){
  samplePath100(path,(y+.5)/h,p);halfWidths[y]=p[2];widthSum+=p[2]*2;
  if(previous)sourceLength+=Math.hypot(p[0]-previous[0],p[1]-previous[1]);previous=[p[0],p[1]];
  for(let x=0;x<w;x++){
   const q=((x+.5)/w*2-1)*p[2],sx=p[0]+p[3]*q,sy=p[1]+p[4]*q;
   luma[y*w+x]=sourceLuma100(pixels,sx,sy);
   minX=Math.min(minX,sx);maxX=Math.max(maxX,sx);minY=Math.min(minY,sy);maxY=Math.max(maxY,sy);
  }
 }
 // The candidate-97 two-band extraction is retained in source-pixel units,
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
function sampleStrip100(strip,u,v){
 const x=clamp(u)*(strip.width-1),y=clamp(v)*(strip.height-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,w=strip.width,a=iy*w+ix,b=iy*w+Math.min(w-1,ix+1),c=Math.min(strip.height-1,iy+1)*w+ix,d=Math.min(strip.height-1,iy+1)*w+Math.min(w-1,ix+1);
 return lerp(lerp(strip.signal[a],strip.signal[b],fx),lerp(strip.signal[c],strip.signal[d],fx),fy);
}
function sampleStrandField100(strip,u,v){
 let signal=0,total=0;
 for(const [center,radius,phase,alongScale,reverse] of STRAND_TILES){
  const q=(u-center)/radius;if(Math.abs(q)>=1)continue;
  const weight=(1+Math.cos(Math.PI*q))*.5,cross=.05+.90*(q*.5+.5),along=.05+phase+v*alongScale;
  signal+=weight*sampleStrip100(strip,reverse?1-cross:cross,along);total+=weight;
 }
 if(total<1e-6)throw new Error('Strand-space tile coverage has a gap');
 return signal/total;
}
function normalMatrix100(m){
 const a=m[0],b=m[4],c=m[8],d=m[1],e=m[5],f=m[9],g=m[2],h=m[6],i=m[10];
 const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
 if(!Number.isFinite(det)||Math.abs(det)<1e-12)throw new Error('Crown world matrix is singular');
 return[(e*i-f*h)/det,(f*g-d*i)/det,(d*h-e*g)/det,(c*h-b*i)/det,(a*i-c*g)/det,(b*g-a*h)/det,(b*f-c*e)/det,(c*d-a*f)/det,(a*e-b*d)/det];
}
function sampleGrid100(position,normal,side,u,v,out){
 const x=clamp(u)*NU,y=clamp(v)*NV,ix=Math.min(NU-1,Math.floor(x)),iy=Math.min(NV-1,Math.floor(y)),fx=x-ix,fy=y-iy;
 const first=FOUNDATION_VERTICES+(side<0?0:SHEET_VERTICES),a=first+iy*(NU+1)+ix,b=a+1,c=a+NU+1,d=c+1;
 for(let ch=0;ch<3;ch++){
  out[ch]=lerp(lerp(position[a*3+ch],position[b*3+ch],fx),lerp(position[c*3+ch],position[d*3+ch],fx),fy);
  out[ch+3]=lerp(lerp(normal[a*3+ch],normal[b*3+ch],fx),lerp(normal[c*3+ch],normal[d*3+ch],fx),fy);
 }
}
function validateCrown100(hair){
 const crown=hair.getObjectByName(CROWN_NAME);
 if(!crown?.isMesh||Array.isArray(crown.material))throw new Error('Candidate 100 expects the accepted single-material crown');
 const geometry=crown.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv'),color=geometry.getAttribute('color');
 if(position?.count!==FOUNDATION_VERTICES+2*SHEET_VERTICES||normal?.count!==position.count||uv?.count!==position.count||color?.count!==position.count||color.itemSize!==4)throw new Error('Candidate 100 requires the unchanged accepted crown topology and RGBA colors');
 if(geometry.getAttribute('uv1'))throw new Error('The candidate UV1 channel is already occupied');
 const material=crown.material,base=material.map;
 if(!base?.isDataTexture||base.image.width!==512||base.image.height!==1024||!(base.image.data instanceof Uint8Array)||material.alphaMap||(base.channel??0)!==0||(material.normalMap?.channel??0)!==0)throw new Error('Candidate 100 requires the accepted crown RGBA8/UV0 maps');
 for(let sideIndex=0;sideIndex<2;sideIndex++)for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){
  const k=FOUNDATION_VERTICES+sideIndex*SHEET_VERTICES+j*(NU+1)+i;
  if(Math.abs(uv.array[k*2]-i/NU)>1e-6||Math.abs(uv.array[k*2+1]-j/NV*.73)>1e-6)throw new Error('Accepted crown UV grid changed');
 }
 return{crown,geometry,position,normal,uv,color,material,base};
}
async function readReferencePixels100(){
 const photo=new Image();photo.decoding='async';photo.src=referenceURL;await photo.decode();
 if(photo.naturalWidth!==PHOTO_WIDTH||photo.naturalHeight!==PHOTO_HEIGHT)throw new Error('Candidate 100 requires the supplied 1024 by 1536 reference');
 const canvas=document.createElement('canvas');canvas.width=PHOTO_WIDTH;canvas.height=PHOTO_CROP_HEIGHT;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Reference color decoding is unavailable');
 try{ctx.drawImage(photo,0,0);return ctx.getImageData(0,0,PHOTO_WIDTH,PHOTO_CROP_HEIGHT).data;}
 finally{canvas.width=canvas.height=1;}
}

function sampleBase100(base,u,v,out){
 const {width:w,height:h,data}=base.image,x=(u-Math.floor(u))*w-.5,y=clamp(v*h-.5,0,h-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const xa=(ix+w)%w,xb=(ix+1+w)%w,ya=iy,yb=Math.min(h-1,iy+1);
 for(let ch=0;ch<3;ch++)out[ch]=lerp(lerp(LINEAR[data[(ya*w+xa)*4+ch]],LINEAR[data[(ya*w+xb)*4+ch]],fx),lerp(LINEAR[data[(yb*w+xa)*4+ch]],LINEAR[data[(yb*w+xb)*4+ch]],fx),fy);
}
function texture100(data,width,height,source,name,channel,colorSpace){
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 for(const key of['wrapS','wrapT','minFilter','magFilter','generateMipmaps','anisotropy','flipY','unpackAlignment'])texture[key]=source[key];
 texture.name=name;texture.channel=channel;texture.colorSpace=colorSpace;texture.needsUpdate=true;return texture;
}
function bakeAtlas100(selected,pixels,strength){
 const started=performance.now(),{crown,position,normal,uv,color,base}=selected,strips=SOURCE_STRIPS.map(spec=>unwrapSourceStrip100(spec,pixels));
 const m=Array.from(crown.matrixWorld.elements),nm=normalMatrix100(m);
 const atlas=new Uint8Array(ATLAS_WIDTH*ATLAS_HEIGHT*4);atlas.fill(255);
 const metric={version:VERSION,strength,sourceRegions:'Two manually authored curved hair-only strips',sourceStrips:strips.map(s=>s.metrics),sourceSignalBytes:strips.reduce((sum,s)=>sum+s.signal.byteLength,0),mapping:'Cross-strand tile coordinate follows crown UV u; rectified source arc follows crown UV v/.73',screenRowMapping:false,tileCount:STRAND_TILES.length,visibleFrontTileCountApprox:4,charts:[],atlasWidth:ATLAS_WIDTH,atlasHeight:ATLAS_HEIGHT,headroom:HEADROOM};
 const p=new Float64Array(6),rgb=new Float64Array(3);
 for(let sideIndex=0;sideIndex<2;sideIndex++){
  const spec=SOURCE_STRIPS[sideIndex],strip=strips[sideIndex],originX=sideIndex*1024+GUTTER,originY=GUTTER;
  let mapped=0,weightSum=0,weightedGain=0,minimum=1,maximum=1,logEnergy=0;
  for(let y=0;y<CHART_SIZE;y++)for(let x=0;x<CHART_SIZE;x++){
   const u=(x+.5)/CHART_SIZE,v=(y+.5)/CHART_SIZE,flowV=v/.73;let gain=1,weight=0;
   if(flowV<1&&u>.31){
    sampleGrid100(position.array,normal.array,spec.side,u,flowV,p);
    const nx=nm[0]*p[3]+nm[1]*p[4]+nm[2]*p[5],ny=nm[3]*p[3]+nm[4]*p[4]+nm[5]*p[5],nz=nm[6]*p[3]+nm[7]*p[4]+nm[8]*p[5],facing=nz/(Math.hypot(nx,ny,nz)||1);
    weight=smooth(.31,.49,u)*smooth(.00,.42,facing)*smooth(.025,.13,flowV)*(1-smooth(.88,1,flowV));
    if(weight>0){
     const sample=sampleStrandField100(strip,u,flowV);gain=Math.exp(strength*weight*sample);
     mapped++;weightSum+=weight;weightedGain+=weight*gain;logEnergy+=weight*(Math.log(gain))**2;minimum=Math.min(minimum,gain);maximum=Math.max(maximum,gain);
    }
   }
   sampleBase100(base,u,v,rgb);const at=((originY+y)*ATLAS_WIDTH+originX+x)*4;
   for(let ch=0;ch<3;ch++){const value=rgb[ch]*HEADROOM*gain;if(value>1)throw new Error('Crown strand-space contrast exceeded RGBA8 headroom');atlas[at+ch]=Math.round(clamp(encoded(value))*255);}
  }
  for(let y=-GUTTER;y<CHART_SIZE+GUTTER;y++)for(let x=-GUTTER;x<CHART_SIZE+GUTTER;x++){
   if(x>=0&&x<CHART_SIZE&&y>=0&&y<CHART_SIZE)continue;
   const sx=clamp(x,0,CHART_SIZE-1),sy=clamp(y,0,CHART_SIZE-1),from=((originY+sy)*ATLAS_WIDTH+originX+sx)*4,to=((originY+y)*ATLAS_WIDTH+originX+x)*4;
   atlas[to]=atlas[from];atlas[to+1]=atlas[from+1];atlas[to+2]=atlas[from+2];atlas[to+3]=255;
  }
  metric.charts.push({name:spec.name,mappedTexels:mapped,weightedMeanGain:weightedGain/Math.max(1,weightSum),gainMin:minimum,gainMax:maximum,logGainRms:Math.sqrt(logEnergy/Math.max(1,weightSum))});
 }
 // The inset foundation keeps its original vertex RGB and an exact texel copy
 // of its original color lookup. It uses only v<=.72 of this baseline chart.
 for(let y=1024;y<ATLAS_HEIGHT;y++)for(let x=0;x<544;x++){
  const sx=((x-GUTTER)%512+512)%512,sy=clamp(y-1040,0,1023),a=(sy*512+sx)*4,b=(y*ATLAS_WIDTH+x)*4;
  atlas[b]=base.image.data[a];atlas[b+1]=base.image.data[a+1];atlas[b+2]=base.image.data[a+2];atlas[b+3]=255;
 }
 const uv1=new Float32Array(uv.array.length),colors=new Float32Array(color.array),coverage=new Uint8Array(base.image.data.length);
 for(let i=0;i<color.count;i++){
  const u=uv.array[i*2],v=uv.array[i*2+1];
  if(i<FOUNDATION_VERTICES){uv1[i*2]=(GUTTER+u*512)/ATLAS_WIDTH;uv1[i*2+1]=(1040+v*1024)/ATLAS_HEIGHT;}
  else{
   const sideIndex=i<FOUNDATION_VERTICES+SHEET_VERTICES?0:1;
   uv1[i*2]=(sideIndex*1024+GUTTER+u*CHART_SIZE)/ATLAS_WIDTH;uv1[i*2+1]=(GUTTER+v*CHART_SIZE)/ATLAS_HEIGHT;
   for(let ch=0;ch<3;ch++){colors[i*4+ch]/=HEADROOM;if(colors[i*4+ch]>1)throw new Error('Compensated crown vertex RGB is outside exportable range');}
  }
 }
 for(let i=0;i<coverage.length;i+=4){coverage[i]=coverage[i+1]=coverage[i+2]=base.image.data[i+3];coverage[i+3]=255;}
 metric.bakeMs=performance.now()-started;
 metric.allocatedTextureBytes=atlas.byteLength+coverage.byteLength;
 metric.addedUVBytes=uv1.byteLength;
 metric.replacedColorBytes=colors.byteLength;
 metric.netTypedTextureAndAttributeBytes=atlas.byteLength+uv1.byteLength;
 metric.estimatedNetMipmappedGPUBytes=atlas.byteLength*4/3+uv1.byteLength;
 metric.sourcePixelBytes=pixels.byteLength;
 metric.geometryPositionsChanged=false;metric.originalUV0Changed=false;metric.normalFieldChanged=false;metric.coverageBytesChanged=false;
 metric.additionalMeshes=0;metric.additionalTriangles=0;metric.additionalMaterialDraws=0;metric.perFrameCPUWork=0;
 metric.export={baseColorTexCoord:1,normalTexCoord:0,coverageTexCoord:0,requiresExportOnlyAlphaMerge:true,maxAtlasDimension:2048,note:'The live material keeps source alpha in a UV0 alphaMap. Before shipping GLB, merge those alpha samples into the UV1 base-color atlas and omit alphaMap on the export-only clone. The normal map and its UV0 channel remain unchanged.'};
 return{atlas,coverage,uv1,colors,metric};
}

export async function applyReferenceCrownMicrocontrast100(hair,{strength=1}={}){
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Crown strength must be within [0,1]');
 const prior=states.get(hair);if(prior){if(prior.strength!==strength)throw new Error('Compare candidate 100 strengths on fresh grooms');return prior.promise;}
 if(strength===0)return{version:VERSION,strength,status:'baseline',changed:false};
 const selected=validateCrown100(hair),state={strength,promise:null};states.set(hair,state);
 state.promise=(async()=>{
  const started=performance.now();hair.updateWorldMatrix(true,true);
  const pixels=await readReferencePixels100(),result=bakeAtlas100(selected,pixels,strength);
  const atlas=texture100(result.atlas,ATLAS_WIDTH,ATLAS_HEIGHT,selected.base,'Reference-only strand-space crown contrast / UV1',1,THREE.SRGBColorSpace);
  const coverage=texture100(result.coverage,512,1024,selected.base,'Exact accepted crown coverage / UV0',0,THREE.NoColorSpace);
  const material=selected.material.clone();material.map=atlas;material.alphaMap=coverage;material.needsUpdate=true;
  // Commit only after the full bake and range checks succeed.
  selected.geometry.setAttribute('uv1',new THREE.Float32BufferAttribute(result.uv1,2));
  selected.geometry.setAttribute('color',new THREE.Float32BufferAttribute(result.colors,4));
  selected.crown.material=material;
  result.metric.elapsedMs=performance.now()-started;result.metric.status='applied';result.metric.changed=true;
  material.userData={...material.userData,referenceCrownMicrocontrast:result.metric};
  hair.userData.referenceCrownMicrocontrast=result.metric;return result.metric;
 })();
 try{return await state.promise;}catch(error){states.delete(hair);throw error;}
}
