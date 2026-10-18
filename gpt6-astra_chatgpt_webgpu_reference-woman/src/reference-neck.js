import * as THREE from 'three';
import referenceURL from '../reference/image1-color.jpg';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};

// Manually chosen skin-only neck cross-sections in the uploaded reference.
// This is a cylindrical color bake on the independently modeled neck surface.
const neckRows=[[720,389,556],[770,350,566],[840,353,558],[900,365,537],[940,388,509],[980,415,478],[1012,440,446]];
function sourceSpan(y){
  y=clamp(y,neckRows[0][0],neckRows.at(-1)[0]);let i=0;while(i<neckRows.length-2&&y>neckRows[i+1][0])i++;
  const a=neckRows[i],b=neckRows[i+1],t=(y-a[0])/(b[0]-a[0]);
  return[a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t];
}
export async function applyReferenceNeck(group){
  const source=new Image();source.src=referenceURL;await source.decode();
  const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;
  const cx=canvas.getContext('2d',{willReadFrequently:true});cx.drawImage(source,0,0);const pixels=cx.getImageData(0,0,canvas.width,canvas.height).data;
  const width=512,height=768,data=new Uint8Array(width*height*4);
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
    const v=j/(height-1),theta=i/(width-1)*Math.PI*2,front=Math.cos(theta),sy=1012-v*292,[left,right]=sourceSpan(sy),sx=left+(right-left)*(.5+.43*Math.sin(theta));
    const x=Math.floor(sx),y=Math.floor(sy),fx=sx-x,fy=sy-y,p=(y*canvas.width+x)*4,k=(j*width+i)*4;
    const shade=1-.045*smooth((v-.68)/.32)-.025*Math.sin(theta)**2,base=[225,188,172].map(c=>c*shade),weight=.92*smooth(front/.7);
    for(let ch=0;ch<3;ch++){
      const value=(pixels[p+ch]*(1-fx)+pixels[p+4+ch]*fx)*(1-fy)+(pixels[p+canvas.width*4+ch]*(1-fx)+pixels[p+canvas.width*4+4+ch]*fx)*fy;
      data[k+ch]=base[ch]*(1-weight)+value*weight;
    }
    data[k+3]=255;
  }
  const map=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);map.colorSpace=THREE.SRGBColorSpace;map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.generateMipmaps=true;map.anisotropy=8;map.needsUpdate=true;
  map.name='Skin color from image1 neck, with manually authored skin-only bounds';
  group.traverse(o=>{if(o.isMesh&&o.name==='neck-smooth-anatomical-surface'){o.material.map=map;o.material.color.set('#ffffff');o.material.vertexColors=false;o.material.roughness=.56;o.material.sheen=.025;o.material.needsUpdate=true;}});
  group.userData.skinSource='Only user image 1; frontal neck colors follow manually selected neck skin and blend into authored hidden surfaces.';
}
