import * as THREE from 'three';
import referenceURL from '../reference/image1-color.jpg';

// Candidate 93: fine-to-medium reference strand contrast on the real crown.
// Only this supplied photo is decoded. The correspondence corridors are placed
// by eye; no feature detection, segmentation, external assets or image planes.
const VERSION='reference-crown-microcontrast-93-v1';
const states=new WeakMap();
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const encoded=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
const LINEAR=Float64Array.from({length:256},(_,i)=>linear(i/255));
const PHOTO_WIDTH=1024,PHOTO_HEIGHT=1536,PHOTO_CROP_HEIGHT=544;
const VIEW_WIDTH=796,VIEW_HEIGHT=1061,VIEW_SPAN=6.4,VIEW_CENTER_Y=1.55;
const FOUNDATION_VERTICES=145*53,SHEET_VERTICES=129*65,NU=128,NV=64;
const ATLAS_WIDTH=2048,ATLAS_HEIGHT=2048,CHART_SIZE=992,GUTTER=16,HEADROOM=.60;
const CROWN_NAME='Continuous parted crown with longitudinal fiber flow';

// Viewer Y / viewer left-right / photo Y / photo interior left-right.
// These interior corridors follow the large left sweep and the smaller right
// fall. Pale scalp at the part, skin, ear and background are outside them.
const CHART_ROWS=[
 {name:'left-crown',side:-1,rows:[
  [26,438,492,34,483,554],[36,423,506,50,438,557],
  [64,377,535,94,362,562],[105,338,536,158,306,528],
  [155,307,487,242,270,465],[205,290,412,307,248,380],
  [232,286,335,346,231,260]
 ]},
 {name:'right-crown',side:1,rows:[
  [38,508,530,65,604,625],[75,536,572,130,634,698],
  [120,548,604,220,682,755],[180,557,612,320,725,795],
  [245,573,611,420,740,813],[302,573,604,510,746,827]
 ]}
];

function chart93(rows){
 const slopes=rows.map((row,i)=>row.map((value,k)=>{
  if(!k)return 1;
  if(!i)return(rows[1][k]-value)/(rows[1][0]-row[0]);
  if(i===rows.length-1)return(value-rows[i-1][k])/(row[0]-rows[i-1][0]);
  const a=rows[i-1],b=rows[i+1],h0=row[0]-a[0],h1=b[0]-row[0];
  const d0=(value-a[k])/h0,d1=(b[k]-value)/h1;
  return d0*d1<=0?0:3*(h0+h1)/((2*h1+h0)/d0+(h1+2*h0)/d1);
 }));
 return{rows,slopes,min:rows[0][0],max:rows.at(-1)[0]};
}
function row93(chart,y,out){
 const rows=chart.rows;let i=0;while(i<rows.length-2&&y>rows[i+1][0])i++;
 const a=rows[i],b=rows[i+1],h=b[0]-a[0],t=clamp((y-a[0])/h),t2=t*t,t3=t2*t;
 out[0]=y;
 for(let k=1;k<a.length;k++)out[k]=(2*t3-3*t2+1)*a[k]+(t3-2*t2+t)*h*chart.slopes[i][k]+(-2*t3+3*t2)*b[k]+(t3-t2)*h*chart.slopes[i+1][k];
 return out;
}
function normalMatrix93(m){
 const a=m[0],b=m[4],c=m[8],d=m[1],e=m[5],f=m[9],g=m[2],h=m[6],i=m[10];
 const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
 if(!Number.isFinite(det)||Math.abs(det)<1e-12)throw new Error('Crown world matrix is singular');
 return[(e*i-f*h)/det,(f*g-d*i)/det,(d*h-e*g)/det,(c*h-b*i)/det,(a*i-c*g)/det,(b*g-a*h)/det,(b*f-c*e)/det,(c*d-a*f)/det,(a*e-b*d)/det];
}
function sampleGrid93(position,normal,side,u,v,out){
 const x=clamp(u)*NU,y=clamp(v)*NV,ix=Math.min(NU-1,Math.floor(x)),iy=Math.min(NV-1,Math.floor(y)),fx=x-ix,fy=y-iy;
 const first=FOUNDATION_VERTICES+(side<0?0:SHEET_VERTICES),a=first+iy*(NU+1)+ix,b=a+1,c=a+NU+1,d=c+1;
 for(let ch=0;ch<3;ch++){
  out[ch]=lerp(lerp(position[a*3+ch],position[b*3+ch],fx),lerp(position[c*3+ch],position[d*3+ch],fx),fy);
  out[ch+3]=lerp(lerp(normal[a*3+ch],normal[b*3+ch],fx),lerp(normal[c*3+ch],normal[d*3+ch],fx),fy);
 }
}
function validateCrown93(hair){
 const crown=hair.getObjectByName(CROWN_NAME);
 if(!crown?.isMesh||Array.isArray(crown.material))throw new Error('Candidate 93 expects the accepted single-material crown');
 const geometry=crown.geometry,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv'),color=geometry.getAttribute('color');
 if(position?.count!==FOUNDATION_VERTICES+2*SHEET_VERTICES||normal?.count!==position.count||uv?.count!==position.count||color?.count!==position.count||color.itemSize!==4)throw new Error('Candidate 93 requires the unchanged accepted crown topology and RGBA colors');
 if(geometry.getAttribute('uv1'))throw new Error('The candidate UV1 channel is already occupied');
 const material=crown.material,base=material.map;
 if(!base?.isDataTexture||base.image.width!==512||base.image.height!==1024||!(base.image.data instanceof Uint8Array)||material.alphaMap||(base.channel??0)!==0||(material.normalMap?.channel??0)!==0)throw new Error('Candidate 93 requires the accepted crown RGBA8/UV0 maps');
 for(let sideIndex=0;sideIndex<2;sideIndex++)for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){
  const k=FOUNDATION_VERTICES+sideIndex*SHEET_VERTICES+j*(NU+1)+i;
  if(Math.abs(uv.array[k*2]-i/NU)>1e-6||Math.abs(uv.array[k*2+1]-j/NV*.73)>1e-6)throw new Error('Accepted crown UV grid changed');
 }
 return{crown,geometry,position,normal,uv,color,material,base};
}
async function readReferencePixels93(){
 const photo=new Image();photo.decoding='async';photo.src=referenceURL;await photo.decode();
 if(photo.naturalWidth!==PHOTO_WIDTH||photo.naturalHeight!==PHOTO_HEIGHT)throw new Error('Candidate 93 requires the supplied 1024 by 1536 reference');
 const canvas=document.createElement('canvas');canvas.width=PHOTO_WIDTH;canvas.height=PHOTO_CROP_HEIGHT;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Reference color decoding is unavailable');
 try{ctx.drawImage(photo,0,0);return ctx.getImageData(0,0,PHOTO_WIDTH,PHOTO_CROP_HEIGHT).data;}
 finally{canvas.width=canvas.height=1;}
}

// A masked local mean removes broad photographic lighting while retaining
// aperiodic fine strands and real groups several source pixels across.
// Every contributing pixel lies inside a manually authored hair-only corridor.
function referenceSignal93(pixels){
 const w=PHOTO_WIDTH,h=PHOTO_CROP_HEIGHT,sourceCharts=CHART_ROWS.map(c=>chart93(c.rows.map(r=>[r[3],r[4],r[5]])));
 const mask=new Uint8Array(w*h),luma=new Float32Array(w*h),sum=new Float64Array((w+1)*(h+1)),count=new Uint32Array((w+1)*(h+1)),row=new Float64Array(3);
 let sourceHairPixels=0;
 for(let y=0;y<h;y++)for(const chart of sourceCharts){
  if(y<chart.min||y>chart.max)continue;row93(chart,y,row);
  const a=Math.ceil(row[1]+2),b=Math.floor(row[2]-2);
  for(let x=a;x<=b;x++){
   const at=y*w+x;if(mask[at])continue;const p=at*4;
   mask[at]=1;luma[at]=.2126*LINEAR[pixels[p]]+.7152*LINEAR[pixels[p+1]]+.0722*LINEAR[pixels[p+2]];sourceHairPixels++;
  }
 }
 for(let y=0;y<h;y++){
  let s=0,n=0;const before=y*(w+1),line=(y+1)*(w+1);
  for(let x=0;x<w;x++){const p=y*w+x;s+=luma[p];n+=mask[p];sum[line+x+1]=sum[before+x+1]+s;count[line+x+1]=count[before+x+1]+n;}
 }
 const area=(array,x0,y0,x1,y1)=>array[y1*(w+1)+x1]-array[y0*(w+1)+x1]-array[y1*(w+1)+x0]+array[y0*(w+1)+x0];
 const mean=(x,y,r)=>{const x0=Math.max(0,x-r),y0=Math.max(0,y-r),x1=Math.min(w,x+r+1),y1=Math.min(h,y+r+1);return area(sum,x0,y0,x1,y1)/Math.max(1,area(count,x0,y0,x1,y1));};
 const signal=new Float32Array(w*h);let minimum=Infinity,maximum=-Infinity,energy=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const at=y*w+x;if(!mask[at])continue;
  const localMean=.75*mean(x,y,22)+.25*mean(x,y,8);
  const residual=Math.log(Math.max(1e-6,luma[at]))-Math.log(Math.max(1e-6,localMean));
  signal[at]=.46*Math.tanh(1.15*residual/.46);minimum=Math.min(minimum,signal[at]);maximum=Math.max(maximum,signal[at]);energy+=signal[at]*signal[at];
 }
 return{signal,mask,metrics:{sourceHairPixels,logContrastMin:minimum,logContrastMax:maximum,logContrastRms:Math.sqrt(energy/sourceHairPixels),localMeanRadii:[8,22],sourceRegions:'Manually inset left and right crown interiors only'}};
}
function sampleSignal93(field,x,y){
 if(x<0||y<0||x>=PHOTO_WIDTH-1||y>=PHOTO_CROP_HEIGHT-1)return null;
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,a=iy*PHOTO_WIDTH+ix,b=a+1,c=a+PHOTO_WIDTH,d=c+1;
 if(!field.mask[a]||!field.mask[b]||!field.mask[c]||!field.mask[d])return null;
 return lerp(lerp(field.signal[a],field.signal[b],fx),lerp(field.signal[c],field.signal[d],fx),fy);
}
function sampleBase93(base,u,v,out){
 const {width:w,height:h,data}=base.image,x=(u-Math.floor(u))*w-.5,y=clamp(v*h-.5,0,h-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const xa=(ix+w)%w,xb=(ix+1+w)%w,ya=iy,yb=Math.min(h-1,iy+1);
 for(let ch=0;ch<3;ch++)out[ch]=lerp(lerp(LINEAR[data[(ya*w+xa)*4+ch]],LINEAR[data[(ya*w+xb)*4+ch]],fx),lerp(LINEAR[data[(yb*w+xa)*4+ch]],LINEAR[data[(yb*w+xb)*4+ch]],fx),fy);
}
function texture93(data,width,height,source,name,channel,colorSpace){
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 for(const key of['wrapS','wrapT','minFilter','magFilter','generateMipmaps','anisotropy','flipY','unpackAlignment'])texture[key]=source[key];
 texture.name=name;texture.channel=channel;texture.colorSpace=colorSpace;texture.needsUpdate=true;return texture;
}
function bakeAtlas93(selected,pixels,strength){
 const started=performance.now(),{crown,position,normal,uv,color,base}=selected,field=referenceSignal93(pixels);
 const m=Array.from(crown.matrixWorld.elements),nm=normalMatrix93(m),scale=VIEW_HEIGHT/VIEW_SPAN;
 const atlas=new Uint8Array(ATLAS_WIDTH*ATLAS_HEIGHT*4);atlas.fill(255);
 const metric={version:VERSION,strength,...field.metrics,charts:[],atlasWidth:ATLAS_WIDTH,atlasHeight:ATLAS_HEIGHT,headroom:HEADROOM};
 const p=new Float64Array(6),row=new Float64Array(6),rgb=new Float64Array(3);
 for(let sideIndex=0;sideIndex<2;sideIndex++){
  const spec=CHART_ROWS[sideIndex],chart=chart93(spec.rows),originX=sideIndex*1024+GUTTER,originY=GUTTER;
  let mapped=0,weightSum=0,weightedGain=0,minimum=1,maximum=1,logEnergy=0;
  for(let y=0;y<CHART_SIZE;y++)for(let x=0;x<CHART_SIZE;x++){
   const u=(x+.5)/CHART_SIZE,v=(y+.5)/CHART_SIZE;let gain=1,weight=0;
   if(v<=.73&&u>.30){
    sampleGrid93(position.array,normal.array,spec.side,u,v/.73,p);
    const wx=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],wy=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13];
    const vx=VIEW_WIDTH*.5+wx*scale,vy=VIEW_HEIGHT*.5+(VIEW_CENTER_Y-wy)*scale;
    if(vy>chart.min&&vy<chart.max){
     row93(chart,vy,row);const s=(vx-row[1])/(row[2]-row[1]);
     if(s>0&&s<1){
      const nx=nm[0]*p[3]+nm[1]*p[4]+nm[2]*p[5],ny=nm[3]*p[3]+nm[4]*p[4]+nm[5]*p[5],nz=nm[6]*p[3]+nm[7]*p[4]+nm[8]*p[5],facing=nz/(Math.hypot(nx,ny,nz)||1);
      weight=smooth(.30,.48,u)*smooth(.035,.43,facing)*smooth(0,.10,s)*smooth(0,.10,1-s)*smooth(chart.min,chart.min+11,vy)*(1-smooth(chart.max-16,chart.max,vy));
      if(weight>0){
       const sx=lerp(row[4],row[5],.035+.93*s),sample=sampleSignal93(field,sx,row[3]);
       if(sample!==null){gain=Math.exp(strength*weight*sample);mapped++;weightSum+=weight;weightedGain+=weight*gain;logEnergy+=weight*(Math.log(gain))**2;minimum=Math.min(minimum,gain);maximum=Math.max(maximum,gain);}
      }
     }
    }
   }
   sampleBase93(base,u,v,rgb);const at=((originY+y)*ATLAS_WIDTH+originX+x)*4;
   for(let ch=0;ch<3;ch++){const value=rgb[ch]*HEADROOM*gain;if(value>1)throw new Error('Crown microcontrast exceeded RGBA8 headroom');atlas[at+ch]=Math.round(clamp(encoded(value))*255);}
  }
  // Source-color chart gutters avoid cross-chart sampling at ordinary mips.
  // Coverage does not depend on these gutters: it retains its own UV0 map.
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

export async function applyReferenceCrownMicrocontrast93(hair,{strength=1}={}){
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Crown strength must be within [0,1]');
 const prior=states.get(hair);if(prior){if(prior.strength!==strength)throw new Error('Compare candidate 93 strengths on fresh grooms');return prior.promise;}
 if(strength===0)return{version:VERSION,strength,status:'baseline',changed:false};
 const selected=validateCrown93(hair),state={strength,promise:null};states.set(hair,state);
 state.promise=(async()=>{
  const started=performance.now();hair.updateWorldMatrix(true,true);
  const pixels=await readReferencePixels93(),result=bakeAtlas93(selected,pixels,strength);
  const atlas=texture93(result.atlas,ATLAS_WIDTH,ATLAS_HEIGHT,selected.base,'Reference-only irregular crown strand contrast / UV1',1,THREE.SRGBColorSpace);
  const coverage=texture93(result.coverage,512,1024,selected.base,'Exact accepted crown coverage / UV0',0,THREE.NoColorSpace);
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
