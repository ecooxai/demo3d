import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=await readFile('src/main.js','utf8'),marker='scene.add(ambient,key,fill,rim,key.target);';
if(!source.includes(marker))throw new Error('Light marker changed');
const candidate=source.replace(marker,marker+`
const shadowNormalBias=Number(new URLSearchParams(location.search).get('normalbias')||.012);
key.shadow.mapSize.set(2048,2048);key.shadow.radius=8;
key.shadow.normalBias=shadowNormalBias;key.shadow.bias=-.0002;
anatomicalHair.traverse(o=>{if(o.name.startsWith('Dense fine bowed'))o.castShadow=true;});
`);
await build({stdin:{contents:candidate,resolveDir:path.resolve('src'),sourcefile:'main-shadow-soft-review.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-fringe-shadow74.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const bias of [.012,.005]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-fringe-shadow74.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?normalbias=${bias}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(()=>{const p=window.portrait;p.setScore(74,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true};});if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['detail','front']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/fringe-shadow-74-${Math.round(bias*1000)}-${view}.png`});
   }
   console.log(JSON.stringify({bias,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
