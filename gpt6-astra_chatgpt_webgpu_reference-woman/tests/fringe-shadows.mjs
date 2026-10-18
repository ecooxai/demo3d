import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const source=await readFile('src/main.js','utf8'),marker='scene.add(ambient,key,fill,rim,key.target);';
if(!source.includes(marker))throw new Error('Light initialization marker changed');
// Configure casters before renderer initialization; changing them on a compiled
// WebGPU material can invalidate the current Three.js shadow attachment.
const candidate=source.replace(marker,marker+`
const reviewShadowSize=Number(new URLSearchParams(location.search).get('hairshadow')||1024);
if(reviewShadowSize>1024){
 key.shadow.mapSize.set(reviewShadowSize,reviewShadowSize);key.shadow.radius=2;
 key.shadow.normalBias=.002;key.shadow.bias=-.00005;
 anatomicalHair.traverse(o=>{if(o.name.startsWith('Dense fine bowed'))o.castShadow=true;});
}
`);
await build({stdin:{contents:candidate,resolveDir:path.resolve('src'),sourcefile:'main-shadow-review.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-fringe-shadow72.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-fringe-shadow72.js',contentType:'text/javascript'}));
 for(const size of [1024,2048,4096]){
  await page.goto(`http://127.0.0.1:8766/?hairshadow=${size}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  await page.evaluate(()=>window.portrait.setScore(72,76));
  for(const view of ['detail','front']){
   await page.evaluate(view=>{window.portrait.setView(view);window.portrait.renderNow();},view);await page.waitForTimeout(180);
   await page.locator('#viewport-wrap').screenshot({path:`output/qa/fringe-shadow-72-${size}-${view}.png`});
  }
  const metrics=await page.evaluate(async size=>{
   const p=window.portrait,q=p.renderer.backend.device?.queue,samples=[];if(q){for(let i=0;i<6;i++){await q.onSubmittedWorkDone();const begin=performance.now();p.renderNow();await q.onSubmittedWorkDone();samples.push(performance.now()-begin);}}
   samples.sort((a,b)=>a-b);return{size,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,queueCompleteMedianMs:samples.length?samples[Math.floor(samples.length/2)]:null,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
  },size);console.log(JSON.stringify(metrics));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
