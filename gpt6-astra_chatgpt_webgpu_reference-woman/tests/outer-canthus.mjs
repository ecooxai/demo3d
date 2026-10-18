import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const iteration=Number(process.argv[2]||77),caps=process.argv.length>3?process.argv.slice(3).map(Number):[0,10,14];
if(!Number.isInteger(iteration)||caps.some(c=>!Number.isFinite(c)||c<0||c>40))throw new Error('Invalid bounded review options');
const source=await readFile('review/reference-skin-candidate77.js','utf8');
const marker='const OUTER_CANTHUS_LIFT_CAP = 14;';
if(!source.includes(marker))throw new Error('Outer-canthus cap marker changed');
const candidate=source.replace(marker,"const OUTER_CANTHUS_LIFT_CAP = Number(new URLSearchParams(location.search).get('outercap')||0);");
await build({entryPoints:['src/main.js'],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-outer-canthus${iteration}.js`,logLevel:'silent',plugins:[{name:'candidate-skin77',setup(b){b.onLoad({filter:/[/\\]reference-skin\.js$/},()=>({contents:candidate,loader:'js',resolveDir:path.resolve('src')}));}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const cap of caps){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-outer-canthus${iteration}.js`,contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?outercap=${cap}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(iteration=>{const p=window.portrait;p.setScore(iteration,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true};},iteration);if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['detail','quarter']){
    await page.evaluate(view=>{const p=window.portrait;p.setView('detail');if(view==='quarter'){const t=p.controls.target;p.camera.position.set(t.x+6,t.y,t.z+Math.sqrt(133));p.camera.lookAt(t);p.controls.update();}p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/outer-canthus-${iteration}-${cap}-${view}.png`});
   }
   console.log(JSON.stringify({cap,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
