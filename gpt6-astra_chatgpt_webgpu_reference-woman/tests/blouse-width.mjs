import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const candidate=await readFile('review/blouse-candidate98.js','utf8');
const strengths=[0,.12,.20];
if(candidate.split('const OUTER_WIDTH98=0;').length!==2)throw new Error('Expected one isolated outer-width setting');
for(const strength of strengths){
  const blouse=candidate.replace('const OUTER_WIDTH98=0;',`const OUTER_WIDTH98=${strength};`);
  await build({entryPoints:['src/main.js'],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:`output/qa/app-blouse-width98-${strength}.js`,logLevel:'silent',plugins:[{name:'outer-blouse-width98',setup(b){
    b.onLoad({filter:/[/\\]blouse\.js$/},()=>({contents:blouse,loader:'js',resolveDir:path.resolve('src')}));
  }}]});
}
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
  for(const strength of strengths){
    const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
    try{
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/app.js',route=>route.fulfill({path:`output/qa/app-blouse-width98-${strength}.js`,contentType:'text/javascript'}));
      await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
      const metrics=await page.evaluate(()=>{
        const p=window.portrait,g=p.model.getObjectByName('original-tailored-white-cotton-blouse'),hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
        let finite=true,minX=Infinity,maxX=-Infinity;
        g.traverse(m=>{if(!m.isMesh)return;const a=m.geometry.attributes.position;for(let i=0;i<a.count;i++){finite&&=Number.isFinite(a.getX(i))&&Number.isFinite(a.getY(i))&&Number.isFinite(a.getZ(i));minX=Math.min(minX,a.getX(i));maxX=Math.max(maxX,a.getX(i));}});
        p.setScore(98,76);return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,finite,localWidth:maxX-minX,contact:hair.userData.shoulderContact};
      });
      if(!metrics.nativeWebGPU||!metrics.finite)throw new Error('Native finite geometry required');
      for(const view of ['front','left','right','back']){
        await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
        await page.locator('#viewport-wrap').screenshot({path:`output/qa/blouse-width-98-${Math.round(strength*100)}-${view}.png`});
      }
      console.log(JSON.stringify({iteration:98,strength,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
    }finally{await page.close();}
  }
}finally{await browser.close();}
