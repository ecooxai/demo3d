import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';

// Isolated display-transform comparison. Scene illumination, photo-derived
// maps and all authored model geometry remain the current production version.
const source=await readFile('src/main.js','utf8');
const displayMarkers=['renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;','renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.4;'];
const foundDisplayMarkers=displayMarkers.filter(value=>source.includes(value));
if(foundDisplayMarkers.length!==1)throw new Error('Expected exactly one known display mapping');
const marker=foundDisplayMarkers[0];
if(source.split(marker).length!==2)throw new Error('128 expected one known display transform.');
const replacement="const displayMode128=Number(new URLSearchParams(location.search).get('display128')||0);const display128=[{name:'ACES',mapping:THREE.ACESFilmicToneMapping,exposure:1},{name:'Neutral1.4',mapping:THREE.NeutralToneMapping,exposure:1.4},{name:'Neutral1.7',mapping:THREE.NeutralToneMapping,exposure:1.7},{name:'AgX1.6',mapping:THREE.AgXToneMapping,exposure:1.6}][displayMode128];if(!display128)throw new Error('Unknown128 display mode');renderer.toneMapping=display128.mapping;renderer.toneMappingExposure=display128.exposure;state.display128={mode:displayMode128,...display128};";
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:source.replace(marker,replacement),resolveDir:path.resolve('src'),sourcefile:'main-display-response128.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-display-response128.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),reports=[];
try{
 for(const mode of[0,1,2,3]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,1200));});
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-display-response128.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?display128=${mode}`,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});
   const metrics=await page.evaluate(()=>{const p=window.portrait;p.setScore(128,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,display:p.state.display128,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null,width:p.state.width,height:p.state.height,antialiasing:p.state.antialiasing,guidePlacement:p.headPivot.getObjectByName('Original reference-directed chestnut layered groom').userData.guidePlacement118.strength};});
   if(!metrics.nativeWebGPU)throw new Error('128 requires native WebGPU.');
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);
    await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/display-response128-${mode}-${view}.png`});
   }
   if(errors.length)throw new Error(errors.join('\n'));reports.push({mode,...metrics,errors});console.log(JSON.stringify({iteration:128,mode,...metrics,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/display-response128-native-result.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
