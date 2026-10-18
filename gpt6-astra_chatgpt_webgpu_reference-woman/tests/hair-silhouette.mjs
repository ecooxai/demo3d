import {chromium} from 'playwright';
import {build} from 'esbuild';
import path from 'node:path';
await build({stdin:{contents:"export {Raycaster,Vector2} from 'three';",resolveDir:process.cwd(),sourcefile:'hair-silhouette-audit.js'},bundle:true,format:'iife',globalName:'SilhouetteAudit',outfile:'output/qa/hair-silhouette-audit.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.addScriptTag({path:'output/qa/hair-silhouette-audit.js'});
 const result=await page.evaluate(()=>{
  const p=window.portrait;p.setView('back');p.renderNow();p.scene.updateMatrixWorld(true);p.camera.updateMatrixWorld(true);
  const mass=p.model.getObjectByName('Overlapping layered S-wave hair around front back and shoulders');
  const ray=new SilhouetteAudit.Raycaster(),hits=[];
  for(const box of [[.175,.205,.490,.540],[.700,.750,.490,.550]]){
   const counts=new Map();
   for(let i=0;i<=8;i++)for(let j=0;j<=12;j++){
    const x=box[0]+(box[1]-box[0])*i/8,y=box[2]+(box[3]-box[2])*j/12;
    ray.setFromCamera(new SilhouetteAudit.Vector2(x*2-1,1-y*2),p.camera);
    const h=ray.intersectObject(mass,false)[0];if(!h)continue;
    const guide=Math.floor(h.faceIndex/960),step=Math.floor(h.faceIndex%960/16),key=guide+':'+step;
    const row=counts.get(key)||{guide,step,count:0,screen:[x,y],point:h.point.toArray()};row.count++;counts.set(key,row);
   }
   hits.push({box,guides:[...counts.values()].sort((a,b)=>b.count-a.count).slice(0,20)});
  }
  return {nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,hits};
 });
 console.log(JSON.stringify(result));
}finally{await browser.close();}
