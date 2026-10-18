import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const hair=await readFile('review/hair-groom-candidate69.js','utf8');
await build({entryPoints:['src/main.js'],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-hair-crown69.js',logLevel:'silent',plugins:[{name:'candidate-hair69',setup(b){b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-hair-crown69.js',contentType:'text/javascript'}));
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 const metrics=await page.evaluate(()=>{const p=window.portrait;p.setScore(69,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};});
 if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
 for(const view of ['front','detail','left','right','back']){
  await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
  await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-crown-69-${view}.png`});
 }
 console.log(JSON.stringify({candidate:69,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
