import * as THREE from 'three';
import referenceURL from '../reference/image1-color.jpg';

// A bounded color study on the existing 3D torso. The two source polygons are
// manually placed inside visible cotton; the placket, buttons, hair and skin
// are outside them. This is photographic shading, not measured cloth albedo.
const PATCHES=[
 [[338,1064],[416,1080],[425,1140],[426,1250],[440,1340],[451,1440],[425,1506],[298,1506],[300,1450],[292,1390],[310,1340],[320,1240],[320,1150]],
 [[535,1052],[585,1019],[602,1120],[610,1250],[583,1340],[595,1420],[611,1506],[542,1506],[532,1410],[515,1350],[510,1250],[501,1150]]
];
const N=1024,NU=192,NV=112,NEUTRAL=230,applications=new WeakMap();
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const q=clamp((x-a)/(b-a));return q*q*(3-2*q);};
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const encoded=x=>255*(x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055);
const HEADROOM=linear(NEUTRAL/255);
const placketX=y=>{const v=clamp((.780-y)/2.230);return -.022+.027*Math.sin(v*Math.PI)+.190*v*v+.084*smooth(0,.19,v);};
const centerX=y=>y>=-.185?471+(y+.185)/.665*(459-471):500+(y+.850)/.665*(471-500);

function interiorDistance(x,y,polygon){
 let inside=false,distance=Infinity;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i],dx=b[0]-a[0],dy=b[1]-a[1];
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  const t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy));
  distance=Math.min(distance,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));
 }
 return inside?distance:0;
}

export async function applyReferenceCloth117(blouse,{strength=0}={}){
 const started=performance.now();
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Cloth117 strength must be in [0,1].');
 if(strength===0)return Object.freeze({iteration:117,strength:0,applied:false,elapsedMs:0});
 const old=applications.get(blouse);
 if(old){if(old.strength!==strength)throw new Error('Compare cloth117 on a fresh blouse.');return old.metrics;}
 const torso=blouse.getObjectByName('blouse-continuous-torso-and-sleeves');
 if(!torso?.isMesh||Array.isArray(torso.material)||torso.material.map)throw new Error('Expected the original untextured cotton torso material.');
 const geometry=torso.geometry,p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv;
 if(p.count!==(NU+1)*(NV+1)||n.count!==p.count||uv.count!==p.count)throw new Error('Unexpected torso grid.');
 for(let j=0;j<=NV;j++)for(let i=0;i<=NU;i++){
  const k=j*(NU+1)+i;
  if(Math.abs(uv.getX(k)-i/NU)>1e-6||Math.abs(uv.getY(k)-j/NV)>1e-6)throw new Error('Torso UV layout changed.');
 }
 const source=new Image();source.src=referenceURL;await source.decode();
 if(source.naturalWidth!==1024||source.naturalHeight!==1536)throw new Error('Expected the sole supplied image1 dimensions.');
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0);
 const photo=ctx.getImageData(0,0,1024,1536).data;
 const field=new Float32Array(N*N*4),mean=[0,0,0];let weightSum=0,sourceSamples=0,minimumSourceRGB=255;
 // Sample the same two triangles as the real grid, so the color field follows
 // the actual pre-balance cloth coordinates without changing UVs or geometry.
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const u=x/(N-1)*NU,v=y/(N-1)*NV,i=Math.min(NU-1,Math.floor(u)),j=Math.min(NV-1,Math.floor(v)),fu=u-i,fv=v-j;
  const a=j*(NU+1)+i,b=a+1,c=a+NU+1,d=c+1;
  const ids=fu+fv<=1?[a,b,c]:[b,c,d],weights=fu+fv<=1?[1-fu-fv,fu,fv]:[1-fv,1-fu,fu+fv-1];
  let X=0,Y=0,Z=0,nz=0;
  for(let k=0;k<3;k++){X+=p.getX(ids[k])*weights[k];Y+=p.getY(ids[k])*weights[k];Z+=p.getZ(ids[k])*weights[k];nz+=n.getZ(ids[k])*weights[k];}
  if(Z<=0||nz<=.45||Y>.70||Y< -1.48)continue;
  const sx=centerX(Y)+250*(X-placketX(Y)),sy=1088-(Y-.480)*(162/.665);
  if(sx<270||sx>640||sy<1010||sy>1510)continue;
  const mask=smooth(0,18,Math.max(...PATCHES.map(poly=>interiorDistance(sx,sy,poly))))*smooth(.45,.85,nz);
  if(mask<=0)continue;
  const ix=Math.floor(sx),iy=Math.floor(sy),tx=sx-ix,ty=sy-iy,at=(y*N+x)*4;
  for(let ch=0;ch<3;ch++){
   const raw=(1-ty)*((1-tx)*photo[(iy*1024+ix)*4+ch]+tx*photo[(iy*1024+ix+1)*4+ch])+ty*((1-tx)*photo[((iy+1)*1024+ix)*4+ch]+tx*photo[((iy+1)*1024+ix+1)*4+ch]);
   minimumSourceRGB=Math.min(minimumSourceRGB,raw);
   const rgb=linear(raw/255);field[at+ch]=rgb;mean[ch]+=mask*rgb;
  }
  field[at+3]=mask;weightSum+=mask;sourceSamples++;
 }
 if(sourceSamples<1000||minimumSourceRGB<100)throw new Error('Cloth117 correspondence left the intended clean cotton regions.');
 for(let c=0;c<3;c++)mean[c]/=weightSum;
 const pixels=new Uint8Array(N*N*4);let minGain=1,maxGain=1,changed=0,gainSum=0;
 for(let i=0;i<N*N;i++){
  const at=i*4,mask=field[at+3];let altered=false;
  for(let c=0;c<3;c++){
   const gain=mask?1+strength*mask*.22*Math.tanh(Math.log(field[at+c]/mean[c])/.22):1;
   if(!Number.isFinite(gain))throw new Error('Nonfinite cloth117 gain.');
   minGain=Math.min(minGain,gain);maxGain=Math.max(maxGain,gain);if(mask)gainSum+=gain;
   const value=Math.round(encoded(HEADROOM*gain));pixels[at+c]=value;altered ||= value!==NEUTRAL;
  }
  pixels[at+3]=255;if(altered)changed++;
 }
 const map=new THREE.DataTexture(pixels,N,N,THREE.RGBAFormat);map.colorSpace=THREE.SRGBColorSpace;
 map.wrapS=THREE.RepeatWrapping;map.wrapT=THREE.ClampToEdgeWrapping;map.generateMipmaps=true;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.anisotropy=8;map.needsUpdate=true;
 map.name='Image1 manually registered cotton-panel shading117';
 const original=torso.material,material=original.clone();material.map=map;material.color.multiplyScalar(1/HEADROOM);material.needsUpdate=true;
 const metrics=Object.freeze({iteration:117,strength,applied:true,source:'Only user-supplied image1; two manual cotton interiors, photographic shading not measured albedo',sourceSamples,minimumSourceRGB,normalizationRGB:mean,changedAtlasTexels:changed,minGain,maxGain,meanSampleGain:gainSum/(3*sourceSamples),atlas:[N,N],additionalCPUTextureMiB:4,estimatedGPUMipMiB:16/3,temporaryFieldMiB:16,geometryChanged:false,uvChanged:false,elapsedMs:performance.now()-started});
 torso.material=material;applications.set(blouse,{strength,metrics,torso,original,material,map});
 return metrics;
}

export function releaseReferenceCloth117(blouse){
 const saved=applications.get(blouse);if(!saved)return false;
 if(saved.torso.material!==saved.material)throw new Error('Cloth117 material changed before release.');
 saved.torso.material=saved.original;saved.material.dispose();saved.map.dispose();applications.delete(blouse);return true;
}
