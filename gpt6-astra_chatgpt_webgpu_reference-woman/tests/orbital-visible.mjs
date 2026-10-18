import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.addScriptTag({path:'output/qa/face-shading-audit.js'});
 const result=await page.evaluate(async()=>{
  const p=window.portrait;p.setView('detail');p.renderNow();p.scene.updateMatrixWorld(true);p.camera.updateMatrixWorld(true);
  const head=p.model.getObjectByName('anatomical-head'),meshes=[];head.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});
  const xyList=[[601,580],[613,602],[615,558],[581,565]],ray=new FaceAudit.Raycaster(),hits=[];
  for(const xy of xyList){ray.setFromCamera(new FaceAudit.Vector2(xy[0]/796*2-1,1-xy[1]/1061*2),p.camera);hits.push({xy,hits:ray.intersectObjects(meshes,false).slice(0,4).map(h=>({mesh:h.object.name,uv:h.uv?.toArray(),worldZ:h.point.z,head:head.worldToLocal(h.point.clone()).toArray()}))});}
  const pixels=[];
  for(const [iteration,cap]of[[77,0],[77,14],[79,24],[79,40]]){
   const source=new Image();source.src=`/qa/outer-canthus-${iteration}-${cap}-detail.png`;await source.decode();const c=document.createElement('canvas');c.width=source.naturalWidth;c.height=source.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(source,0,0);
   pixels.push({cap,size:[c.width,c.height],values:xyList.map(xy=>({xy,rgb:Array.from(ctx.getImageData(xy[0],xy[1],1,1).data)}))});c.width=c.height=1;
  }
  return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,hits,pixels};
 });console.log(JSON.stringify(result));
}finally{await browser.close();}
