import {chromium} from 'playwright';
import {build} from 'esbuild';
import path from 'node:path';
await build({stdin:{contents:"export {MeshBasicMaterial} from 'three';",resolveDir:process.cwd(),sourcefile:'material-audit.js'},bundle:true,format:'iife',globalName:'PortraitMaterialAudit',outfile:'output/qa/material-audit.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 for(const variant of (process.argv[2]?process.argv[2].split(','):['baseline','unlit-crown-mass'])) {
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  await page.addScriptTag({path:'output/qa/material-audit.js'});
  console.log(JSON.stringify(await page.evaluate(variant=>{
   const p=window.portrait,meshes=[];
   p.headPivot.traverse(o=>{if(o.name.startsWith('Independent fine')&&variant.includes('no-detail'))o.visible=false;
    if(!o.isMesh||!(o.name.startsWith('Overlapping layered')||o.name.startsWith('Continuous parted')))return;
    meshes.push({name:o.name,castShadow:o.castShadow,receiveShadow:o.receiveShadow});
    if(variant.includes('no-shadow'))o.receiveShadow=false;
    if(variant.startsWith('unlit')){const m=o.material;o.material=new PortraitMaterialAudit.MeshBasicMaterial({map:variant.includes('no-map')?null:m.map,color:m.color,vertexColors:m.vertexColors,alphaTest:m.alphaTest,alphaToCoverage:m.alphaToCoverage,side:m.side,toneMapped:true});}
   });return {variant,meshes};
  },variant)));
  for(const v of ['detail','right']){await page.evaluate(v=>{window.portrait.setView(v);window.portrait.renderNow();},v);await page.waitForTimeout(150);await page.locator('#viewport-wrap').screenshot({path:`output/qa/crown-51-${variant}-${v}.png`});}
 }
}finally{await browser.close();}

