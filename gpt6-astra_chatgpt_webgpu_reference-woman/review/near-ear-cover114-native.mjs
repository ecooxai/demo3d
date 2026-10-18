import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const main=await readFile('src/main.js','utf8'),marker='detailTarget.x=.02+state.pose.shiftX;';
if(main.split(marker).length!==2)throw new Error('Expected one pre-balance marker');
const entry="import {attachNearEarCover114} from '../review/near-ear-cover-candidate114.js';\n"+main.replace(marker,"state.nearEarCover=attachNearEarCover114(anatomicalHair,{strength:Number(new URLSearchParams(location.search).get('near114')||0)});\n"+marker);
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-near114.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-near114.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{for(const strength of[0,1]){
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
 try{
  page.on('pageerror',e=>errors.push(e.message));await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-near114.js',contentType:'text/javascript'}));
  await page.goto('http://127.0.0.1:8766/?near114='+strength,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const metrics=await page.evaluate(()=>{const p=window.portrait;p.setScore(114,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,nearEar:p.state.nearEarCover,heapMiB:Math.round(performance.memory.usedJSHeapSize/1048576)};});
  if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
  for(const view of['front','detail','left','right','back']){await page.evaluate(view=>{window.portrait.setView(view);window.portrait.renderNow();},view);await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:'output/qa/near-ear114-'+strength+'-'+view+'.png'});}
  console.log(JSON.stringify({iteration:114,strength,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
 }finally{await page.close();}
}}finally{await browser.close();}
