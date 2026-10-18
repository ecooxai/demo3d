import * as THREE from 'three';

// Resolve a larger linear-light scene into the requested output canvas.
// The final pass applies the same display transform once; exports retain the
// selected dimensions, independent of internal antialiasing quality.
export function createPortraitOutput() {
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);
  camera.position.z=1;
  const material=new THREE.MeshBasicMaterial({color:'#ffffff',depthTest:false,depthWrite:false,toneMapped:true});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
  plane.frustumCulled=false;scene.add(plane);
  let target=null;
  function release(){if(target){material.map=null;target.dispose();target=null;}}
  return {
    render(renderer,portrait,cameraPortrait,width,height,quality=2){
      const scale=Math.max(1,Math.min(quality,4096/width,4096/height));
      if(scale<=1.00001){release();renderer.render(portrait,cameraPortrait);return {scale:1,width,height};}
      const rw=Math.round(width*scale),rh=Math.round(height*scale);
      if(!target){
        const Target=renderer.isWebGLRenderer?THREE.WebGLRenderTarget:THREE.RenderTarget;
        target=new Target(rw,rh,{type:THREE.HalfFloatType,colorSpace:THREE.LinearSRGBColorSpace,samples:4,generateMipmaps:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true,stencilBuffer:false});
        target.texture.name='Portrait linear-light antialiasing resolve';
        // Render-target image origins differ between the two explicitly chosen
        // backends. The scene geometry and saved output stay upright on both.
        const uv=plane.geometry.attributes.uv,position=plane.geometry.attributes.position;
        for(let i=0;i<uv.count;i++)uv.setY(i,(1+(renderer.isWebGLRenderer?1:-1)*position.getY(i))/2);
        uv.needsUpdate=true;
        material.map=target.texture;material.needsUpdate=true;
      }else if(target.width!==rw||target.height!==rh)target.setSize(rw,rh);
      const previous=renderer.getRenderTarget();
      try {
        renderer.setRenderTarget(target);renderer.render(portrait,cameraPortrait);
        renderer.setRenderTarget(previous);renderer.render(scene,camera);
      } finally {renderer.setRenderTarget(previous);}
      return {scale,width:rw,height:rh};
    },
    dispose(){release();plane.geometry.dispose();material.dispose();}
  };
}
