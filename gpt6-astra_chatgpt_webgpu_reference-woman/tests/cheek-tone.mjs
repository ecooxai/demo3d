import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
await build({entryPoints:['src/main.js'],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-cheek-tone65.js',logLevel:'silent',plugins:[{name:'isolated-cheek-tone',setup(build){
 build.onLoad({filter:/src\/reference-skin\.js$/},async args=>{
  let source=await readFile(args.path,'utf8');const marker='const outerCheek=.60*ellipse(.588,-.700,.142,.215);';
  if(!source.includes(marker))throw new Error('Outer cheek correction marker changed');
  source=source.replace(marker,"const outerCheek=Number(new URLSearchParams(location.search).get('outercheek')||0)*ellipse(.588,-.700,.142,.215);");
  return {contents:source,loader:'js'};
 });
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js',route=>route.fulfill({path:'output/qa/app-cheek-tone65.js',contentType:'text/javascript'}));
 for(const cap of [0,.60,.90]){
  await page.goto(`http://127.0.0.1:8766/?outercheek=${cap}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const result=await page.evaluate(cap=>{const p=window.portrait;p.setScore(65,75);return {cap,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,cheek:p.state.cheek?.strength};},cap);
  for(const view of ['detail','quarter']){
   await page.evaluate(view=>{const p=window.portrait;p.setView('detail');if(view==='quarter'){const t=p.controls.target;p.camera.position.set(t.x+6,t.y,t.z+Math.sqrt(133));p.camera.lookAt(t);p.controls.update();}p.renderNow();},view);
   await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/cheek-tone-65-${Math.round(cap*100)}-${view}.png`});
  }
  console.log(JSON.stringify(result));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
