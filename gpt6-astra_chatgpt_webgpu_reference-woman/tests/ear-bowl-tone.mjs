import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Isolate the source-derived cup tone while preserving common, rim, and fold hue.
const iteration=87;
const source=await readFile('review/reference-ear-candidate70.js','utf8');
const oldCup='concha: relativeTone(colors.concha, colors.lobule, .19, .135, .16, .033)';
const oldBound='clamp(logGain, -.245, .070)';
if(source.split(oldCup).length!==2||source.split(oldBound).length!==2)throw new Error('Unexpected ear color source');
for(const [mode,scale,limit,bound]of [['baseline',.19,.135,-.245],['moderate',.28,.24,-.37],['deep',.38,.34,-.44]]){
 const code=source.replace(oldCup,`concha: relativeTone(colors.concha, colors.lobule, ${scale}, ${limit}, .16, .033)`).replace(oldBound,`clamp(logGain, ${bound}, .070)`);
 await build({entryPoints:['src/main.js'],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-ear-bowl${iteration}-${mode}.js`,logLevel:'silent',plugins:[{name:`ear-bowl-${mode}`,setup(b){b.onLoad({filter:/[/\\]reference-ear\.js$/},()=>({contents:code,loader:'js',resolveDir:path.resolve('src')}));}}]});
}
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const mode of ['baseline','moderate','deep']){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-ear-bowl${iteration}-${mode}.js`,contentType:'text/javascript'}));
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(iteration=>{
    const p=window.portrait;p.setScore(iteration,76);let min=Infinity,max=0,vertices=0;
    p.headPivot.traverse(o=>{if(o.isMesh&&o.name==='ear-continuous-anatomical-shell'){const c=o.geometry.attributes.color;vertices+=c.count;for(const x of c.array){if(!Number.isFinite(x)||x<0||x>1)throw new Error('Invalid ear pigment');min=Math.min(min,x);max=Math.max(max,x);}}});
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,earColorVertices:vertices,colorRange:[min,max],heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },iteration);
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['front','detail','left','right']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/ear-bowl-${iteration}-${mode}-${view}.png`});
   }
   console.log(JSON.stringify({iteration,mode,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
