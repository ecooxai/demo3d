import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Review102: keep the moderate blouse width and reduce the shared contact pull.
// The exact same blouse module supplies the visible geometry and contact query.
const blouse=(await readFile('review/blouse-candidate98.js','utf8')).replace('const OUTER_WIDTH98=0;','const OUTER_WIDTH98=.12;');
const originalMain=await readFile('src/main.js','utf8');
const contactSetting=originalMain.match(/shoulderContact:[.0-9]+/)?.[0];
if(!contactSetting)throw new Error('Expected a production contact setting');
const strengths=[.35,.25];
for(const strength of strengths){
  const main=originalMain.replace(contactSetting,`shoulderContact:${strength}`);
  await build({stdin:{contents:main,resolveDir:path.resolve('src'),sourcefile:'main.js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-blouse-contact102-${strength}.js`,logLevel:'silent',plugins:[{name:'moderate-blouse-contact102',setup(b){
    b.onLoad({filter:/[/\\]blouse\.js$/},()=>({contents:blouse,loader:'js',resolveDir:path.resolve('src')}));
  }}]});
}
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
  for(const strength of strengths){
    const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
    try{
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-blouse-contact102-${strength}.js`,contentType:'text/javascript'}));
      await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
      const metrics=await page.evaluate(()=>{
        const p=window.portrait,hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
        let finite=true,triangles=0;
        p.model.traverse(m=>{if(!m.isMesh)return;const a=m.geometry.attributes.position;triangles+=(m.geometry.index?.count||a.count)/3;for(const x of a.array)finite&&=Number.isFinite(x);});
        p.setScore(102,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,finite,triangles,contact:hair.userData.shoulderContact,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
      });
      if(!metrics.nativeWebGPU||!metrics.finite)throw new Error('Native finite geometry required');
      for(const view of ['front','left','right','back']){
        await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
        await page.locator('#viewport-wrap').screenshot({path:`output/qa/blouse-contact-102-${Math.round(strength*100)}-${view}.png`});
      }
      console.log(JSON.stringify({iteration:102,width:.12,strength,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
    }finally{await page.close();}
  }
}finally{await browser.close();}
