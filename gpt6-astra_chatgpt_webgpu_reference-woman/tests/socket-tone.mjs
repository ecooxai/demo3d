import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
await build({entryPoints:['src/main.js'],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-socket61.js',logLevel:'silent',plugins:[{name:'isolated-socket-cap',setup(build){
 build.onLoad({filter:/src\/reference-skin\.js$/},async args=>{
  let source=await readFile(args.path,'utf8');const marker='Math.min(14,Math.max(0,(socketTone-broad)*.50))';
  if(!source.includes(marker))throw new Error('Socket cap marker changed');
  source=source.replace(marker,"Math.min(Number(new URLSearchParams(location.search).get('socketcap')||14),Math.max(0,(socketTone-broad)*.50))");
  return {contents:source,loader:'js'};
 });
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-socket61.js',contentType:'text/javascript'}));
 for(const cap of [14,20,26]){
  await page.goto(`http://127.0.0.1:8766/?socketcap=${cap}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const result=await page.evaluate(cap=>{const p=window.portrait;p.setScore(61,75);return {cap,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,cheek:p.state.cheek?.strength};},cap);
  for(const view of ['detail','quarter']){
   await page.evaluate(view=>{const p=window.portrait;p.setView('detail');if(view==='quarter'){const t=p.controls.target;p.camera.position.set(t.x+6,t.y,t.z+Math.sqrt(133));p.camera.lookAt(t);p.controls.update();}p.renderNow();},view);
   await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/socket-61-${cap}-${view}.png`});
  }
  console.log(JSON.stringify(result));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
