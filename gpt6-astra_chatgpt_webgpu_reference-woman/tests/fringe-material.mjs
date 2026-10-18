import {chromium} from 'playwright';
import {build} from 'esbuild';
import path from 'node:path';
await build({stdin:{contents:"export {MeshLambertMaterial} from 'three';",resolveDir:process.cwd(),sourcefile:'fringe-audit.js'},bundle:true,format:'iife',globalName:'FringeAudit',outfile:'output/qa/fringe-audit.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const variant of ['baseline','fringe-soft','fringe-matte','fringe-diffuse','physical-no-detail','physical-white-map']){
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);await page.addScriptTag({path:'output/qa/fringe-audit.js'});
  const info=await page.evaluate(variant=>{
   const p=window.portrait;let maps=new Set(),changes=[];
   p.headPivot.traverse(o=>{
    if(o.name.startsWith('Dense fine bowed')){
     const m=o.material;
     if(variant==='fringe-soft'){m.roughness=.70;m.specularIntensity=.15;m.anisotropy=.25;m.anisotropyRotation=Math.PI/2;m.envMapIntensity=.15;changes.push('soft strand-aligned reflection');}
     if(variant==='fringe-matte'){m.roughness=.90;m.specularIntensity=0;m.anisotropy=0;m.envMapIntensity=0;changes.push('reflection minimized');}
     if(variant==='fringe-diffuse'){o.material=new FringeAudit.MeshLambertMaterial({color:m.color,vertexColors:true,side:m.side});changes.push('diffuse only');}
    }
    if(o.name.startsWith('Independent fine')&&variant==='physical-no-detail'){o.visible=false;changes.push('fine detail hidden');}
    if((o.name.startsWith('Overlapping layered')||o.name.startsWith('Continuous parted'))&&variant==='physical-white-map')maps.add(o.material.map);
   });
   for(const map of maps){const d=map.image.data;for(let i=0;i<d.length;i+=4)d[i]=d[i+1]=d[i+2]=255;map.needsUpdate=true;changes.push('RGB white, original alpha preserved');}
   p.setScore(55,70);return{variant,changes};
  },variant);
  const views=variant.startsWith('physical')?['detail','right']:['detail'];
  for(const v of views){await page.evaluate(v=>{window.portrait.setView(v);window.portrait.renderNow();},v);await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/material-55-${variant}-${v}.png`});}
  console.log(JSON.stringify(info));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
