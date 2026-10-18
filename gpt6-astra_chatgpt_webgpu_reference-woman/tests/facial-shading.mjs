import {chromium} from 'playwright';
import {build} from 'esbuild';
import path from 'node:path';
await build({stdin:{contents:"export {Raycaster,Vector2,MeshBasicMaterial} from 'three';",resolveDir:process.cwd(),sourcefile:'face-shading-audit.js'},bundle:true,format:'iife',globalName:'FaceAudit',outfile:'output/qa/face-shading-audit.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const variant of ['baseline','uniform-lit','unlit-map']){
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  await page.addScriptTag({path:'output/qa/face-shading-audit.js'});
  const metrics=await page.evaluate(variant=>{
   const p=window.portrait;p.setView('detail');const t=p.controls.target;p.camera.position.set(t.x+6,t.y,t.z+Math.sqrt(133));p.camera.lookAt(t);p.controls.update();
   const head=p.model.getObjectByName('anatomical-head'),face=head.getObjectByName('continuous-face');
   if(variant!=='baseline')head.traverse(o=>{
    if(!o.isMesh||!['continuous-face','sculpted-eyelids'].includes(o.name))return;
    const mats=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{
     if(variant==='unlit-map')return new FaceAudit.MeshBasicMaterial({map:m.map,color:'#ffffff',side:m.side});
     const c=m.clone();c.map=null;c.emissiveMap=null;c.emissiveIntensity=0;c.color.set('#e8bfae');c.vertexColors=false;return c;
    });o.material=Array.isArray(o.material)?mats:mats[0];
   });
   p.setScore(64,75);p.renderNow();p.scene.updateMatrixWorld(true);p.camera.updateMatrixWorld(true);
   const rays=new FaceAudit.Raycaster(),points=[];
   for(const xy of [[536,800],[550,810],[564,788],[564,571],[586,574]]){
    rays.setFromCamera(new FaceAudit.Vector2(xy[0]/796*2-1,1-xy[1]/1061*2),p.camera);const h=rays.intersectObject(face,false)[0];
    if(h){const local=head.worldToLocal(h.point.clone());points.push({screen:xy,uv:h.uv.toArray(),head:local.toArray(),material:h.face.materialIndex});}
   }
   return {variant,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,points};
  },variant);
  await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/face-shading-64-${variant}.png`});console.log(JSON.stringify(metrics));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
