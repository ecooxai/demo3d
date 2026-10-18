import {chromium} from 'playwright';
import {build} from 'esbuild';
import path from 'node:path';
await build({stdin:{contents:"export {Raycaster,Vector2,Vector3,Triangle} from 'three';",resolveDir:process.cwd(),sourcefile:'hairline-surface-audit.js'},bundle:true,format:'iife',globalName:'HairlineAudit',outfile:'output/qa/hairline-surface-audit.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);await page.addScriptTag({path:'output/qa/hairline-surface-audit.js'});
 const result=await page.evaluate(()=>{
  const p=window.portrait;p.setView('detail');p.renderNow();p.scene.updateMatrixWorld(true);p.camera.updateMatrixWorld(true);
  const targets=['Continuous parted crown with longitudinal fiber flow','Overlapping layered S-wave hair around front back and shoulders'].map(n=>p.model.getObjectByName(n));
  const ray=new HairlineAudit.Raycaster(),rows=[];
  for(const xy of [[.50,.17],[.50,.19],[.24,.28],[.24,.31],[.67,.18],[.82,.27]]){
   ray.setFromCamera(new HairlineAudit.Vector2(xy[0]*2-1,1-xy[1]*2),p.camera);
   const hits=ray.intersectObjects(targets,false).slice(0,5).map(h=>{
    const o=h.object,g=o.geometry,lp=o.worldToLocal(h.point.clone()),v=g.attributes.position,c=g.attributes.color;
    const a=new HairlineAudit.Vector3().fromBufferAttribute(v,h.face.a),b=new HairlineAudit.Vector3().fromBufferAttribute(v,h.face.b),cc=new HairlineAudit.Vector3().fromBufferAttribute(v,h.face.c);
    const bc=HairlineAudit.Triangle.getBarycoord(lp,a,b,cc,new HairlineAudit.Vector3()),alpha=c.itemSize===4?bc.x*c.getW(h.face.a)+bc.y*c.getW(h.face.b)+bc.z*c.getW(h.face.c):1;
    const crown=o.name.startsWith('Continuous');return{surface:crown?(h.faceIndex<14976?'crown-foundation':'crown-flow-sheet'):'mass',faceIndex:h.faceIndex,guide:crown?null:Math.floor(h.faceIndex/960),world:h.point.toArray(),local:lp.toArray(),uv:h.uv.toArray(),vertexAlpha:alpha};
   });rows.push({xy,hits});
  }return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,rows};
 });console.log(JSON.stringify(result));
}finally{await browser.close();}
