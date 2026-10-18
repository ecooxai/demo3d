import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const iteration=Number(process.argv[2]||95);
if(![95,96].includes(iteration))throw new Error('Expected frozen brow95 or96');
const face=await readFile(`review/face-candidate${iteration}.js`,'utf8');
const skin=await readFile(`review/reference-skin-candidate${iteration}.js`,'utf8');
await build({entryPoints:['src/main.js'],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-brow${iteration}.js`,logLevel:'silent',plugins:[{name:'original-brow-flow95',setup(b){
  b.onResolve({filter:/brow-guides\.js$/},()=>({path:path.resolve(`review/brow-guides-candidate${iteration}.js`)}));
  b.onLoad({filter:/[/\\]face\.js$/},()=>({contents:face,loader:'js',resolveDir:path.resolve('src')}));
  b.onLoad({filter:/[/\\]reference-skin\.js$/},()=>({contents:skin,loader:'js',resolveDir:path.resolve('src')}));
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
  for(const variant of ['baseline','candidate']){
    const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
    try{
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      if(variant==='candidate')await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-brow${iteration}.js`,contentType:'text/javascript'}));
      await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
      await page.waitForFunction(()=>window.portrait?.ready);
      const metrics=await page.evaluate(iteration=>{
        const p=window.portrait,brow=p.model.getObjectByName('tapered-brow-hairs');
        const positions=brow.geometry.attributes.position.array;
        p.setScore(iteration,76);
        return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,finite:positions.every(Number.isFinite),browVertices:brow.geometry.attributes.position.count,browTriangles:brow.geometry.index.count/3,skinBakeMs:p.state.textureBakeMs};
      },iteration);
      if(!metrics.nativeWebGPU||!metrics.finite)throw new Error('Native finite geometry required');
      for(const view of ['front','detail']){
        await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);
        await page.waitForTimeout(180);
        await page.locator('#viewport-wrap').screenshot({path:`output/qa/brow-flow-${iteration}-${variant}-${view}.png`});
      }
      console.log(JSON.stringify({iteration,variant,...metrics,errors}));
      if(errors.length)throw new Error(JSON.stringify(errors));
    }finally{await page.close();}
  }
}finally{await browser.close();}
