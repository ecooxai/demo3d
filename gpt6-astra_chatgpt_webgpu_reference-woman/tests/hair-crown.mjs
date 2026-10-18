import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const iteration=Number(process.argv[2]||69);
if(!Number.isInteger(iteration)||iteration<1)throw new Error('Pass a numeric candidate iteration');
const contact=await readFile(`review/hair-contact-candidate${iteration<=91?83:86}.js`,'utf8');
const main=await readFile('src/main.js','utf8');
let entry=iteration<=91?main.replace(/shoulderContact:[.0-9]+/,'shoulderContact:0'):main;
// Later groom comparisons include artistically accepted100 while its export
// adapter is still being staged. Do not apply it twice after integration.
if(iteration>=105&&!entry.includes('applyReferenceCrownMicrocontrast100')){
 const marker='detailTarget.x=.02+state.pose.shiftX;';
 if(entry.split(marker).length!==2)throw new Error('Expected one pre-balance texture marker');
 entry="import {applyReferenceCrownMicrocontrast100} from '../review/reference-crown-candidate100.js';\n"+entry.replace(marker,"state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});\n    "+marker);
}
const hair=await readFile(`review/hair-groom-candidate${iteration}.js`,'utf8');
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-hair-crown${iteration}.js`,logLevel:'silent',plugins:[{name:'candidate-hair69',setup(b){b.onLoad({filter:/[/\\]hair-contact\.js$/},()=>({contents:contact,loader:'js',resolveDir:path.resolve('src')}));b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-hair-crown${iteration}.js`,contentType:'text/javascript'}));
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 const metrics=await page.evaluate(iteration=>{const p=window.portrait;p.setScore(iteration,76);const h=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom').userData;return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,hairTriangles:h.triangles,hairGeometryMiB:h.geometryMiB,hairConstructionMs:h.constructionMs,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};},iteration);
 if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
 for(const view of ['front','detail','left','right','back']){
  await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
  await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-crown-${iteration}-${view}.png`});
 }
 console.log(JSON.stringify({candidate:iteration,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
