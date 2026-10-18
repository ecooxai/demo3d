import * as THREE from 'three';

// Isolated material experiment. Use the accepted100 source-derived strand
// contrast to vary microscopic roughness along the same UV1 strand field.
// Existing coverage, normals, colors, geometry and specular intensity stay fixed.
export function applyHairRoughness103(hair,{strength=0}={}){
 if(strength===0)return{strength,changed:false};
 const crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow'),material=crown?.material;
 if(hair.userData.referenceCrownMicrocontrast?.version!=='reference-crown-strand-space-100-v1'||!material?.map||material.map.channel!==1)throw new Error('Roughness103 requires the accepted100 crown atlas');
 if(!Number.isFinite(strength)||strength<0||strength>1.2)throw new Error('Unsupported roughness strength');
 const t0=performance.now(),source=material.map.image;
 if(source.width!==2048||source.height!==2048||!(source.data instanceof Uint8Array))throw new Error('Unexpected100 atlas');
 const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
 const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(source.width,source.height),lookup=new Float64Array(256);
 for(let i=0;i<256;i++){const s=i/255;lookup[i]=s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}
 let minimum=1,maximum=0;
 for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
  const at=(y*source.width+x)*4,gain=Math.max(.001,lookup[source.data[at+1]]/.60);
  const value=y<1024?Math.max(.38,Math.min(.72,.52-strength*.13*Math.log(gain)/.46)):.52;
  const byte=Math.round(value*255);pixels.data[at]=pixels.data[at+1]=pixels.data[at+2]=byte;pixels.data[at+3]=255;
  minimum=Math.min(minimum,byte/255);maximum=Math.max(maximum,byte/255);
 }
 ctx.putImageData(pixels,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.name='Original strand-coordinate crown roughness experiment103';texture.colorSpace=THREE.NoColorSpace;texture.channel=1;texture.flipY=false;texture.wrapS=THREE.ClampToEdgeWrapping;texture.wrapT=THREE.ClampToEdgeWrapping;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=8;
 material.roughness=1;material.roughnessMap=texture;material.needsUpdate=true;
 const result={strength,changed:true,minimum,maximum,canvasMiB:16,estimatedMipmappedGPUMiB:64/3,elapsedMs:performance.now()-t0};hair.userData.roughness103=result;return result;
}
