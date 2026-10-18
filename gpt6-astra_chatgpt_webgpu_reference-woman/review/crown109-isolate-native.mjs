import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Read-only native isolation of the accepted108 crown/forehead boundary.
// Fresh pages keep each visibility comparison independent.
const main=await readFile('src/main.js','utf8');
const hair=await readFile('review/hair-groom-candidate108.js','utf8');
const contact=await readFile('review/hair-contact-candidate86.js','utf8');
let entry=main;
if(!entry.includes('applyReferenceCrownMicrocontrast100')){
 const marker='detailTarget.x=.02+state.pose.shiftX;';
 if(entry.split(marker).length!==2)throw new Error('Expected one pre-balance100 marker');
 entry="import {applyReferenceCrownMicrocontrast100} from '../review/reference-crown-candidate100.js';\n"+entry.replace(marker,'state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});\n    '+marker);
}
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown109-isolation.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-crown109-isolation.js',logLevel:'silent',plugins:[{name:'isolate-accepted108',setup(b){
 b.onLoad({filter:/[/\\]hair-contact\.js$/},()=>({contents:contact,loader:'js',resolveDir:path.resolve('src')}));
 b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const cases=[['baseline',null,['detail']],['no-crown','Continuous parted crown with longitudinal fiber flow',['detail','right']],['no-mass','Overlapping layered S-wave hair around front back and shoulders',['detail','right']],['no-fine','Independent fine crown lengths and silhouette strands',['detail']]];
const report=[];
try{
 for(const [name,hidden,views]of cases){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-crown109-isolation.js',contentType:'text/javascript'}));
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready);
  const native=await page.evaluate(hidden=>{
   const p=window.portrait;p.setScore(109,76);
   if(hidden){const m=p.model.getObjectByName(hidden);if(!m)throw new Error('Missing isolation mesh '+hidden);m.visible=false;m.castShadow=false;}
   p.scene.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.needsUpdate=true;});
   if(p.renderer.shadowMap)p.renderer.shadowMap.needsUpdate=true;
   return p.renderer.backend.isWebGPUBackend===true;
  },hidden);
  if(!native)throw new Error('Native WebGPU required');
  for(const view of views){
   await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);
   await page.waitForTimeout(180);
   await page.locator('#viewport-wrap').screenshot({path:`output/qa/crown109-isolate-${name}-${view}.png`});
  }
  report.push({name,nativeWebGPU:native,errors});
  await page.close();
  if(errors.length)throw new Error(JSON.stringify({name,errors}));
 }
 console.log(JSON.stringify(report));
}finally{await browser.close();}
