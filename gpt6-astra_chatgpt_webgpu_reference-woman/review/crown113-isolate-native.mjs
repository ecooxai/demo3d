import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

// Isolate109's new release artifacts without changing the production sources.
const main=await readFile('src/main.js','utf8'),hair=await readFile('review/hair-groom-candidate109.js','utf8'),contact=await readFile('review/hair-contact-candidate86.js','utf8');
let entry=main;
if(!entry.includes('applyReferenceCrownMicrocontrast100')){
 const marker='detailTarget.x=.02+state.pose.shiftX;';if(entry.split(marker).length!==2)throw new Error('Expected one pre-balance100 marker');
 entry="import {applyReferenceCrownMicrocontrast100} from '../review/reference-crown-candidate100.js';\n"+entry.replace(marker,'state.referenceCrown=await applyReferenceCrownMicrocontrast100(anatomicalHair,{strength:1});\n    '+marker);
}
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown113-isolation.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-crown113-isolation.js',logLevel:'silent',plugins:[{name:'isolate109-release',setup(b){
 b.onLoad({filter:/[/\\]hair-contact\.js$/},()=>({contents:contact,loader:'js',resolveDir:path.resolve('src')}));
 b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));
}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),report=[];
try{
 for(const variant of['restore-alpha','hide-carriers','hide-added-fine']){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-crown113-isolation.js',contentType:'text/javascript'}));
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const native=await page.evaluate(variant=>{
   const p=window.portrait;p.setScore(113,76);
   if(variant==='restore-alpha'){
    const mesh=p.model.getObjectByName('Continuous parted crown with longitudinal fiber flow'),g=mesh.geometry,c=g.attributes.color,uv=g.attributes.uv;
    const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
    for(let i=0;i<c.count;i++)c.setW(i,i<7685?1:1-smooth(.875,1,uv.getY(i)/.73)*smooth(.38,.56,uv.getX(i))*.999);
    c.needsUpdate=true;
   }else if(variant==='hide-carriers'){
    const m=p.model.getObjectByName('Shallow overlapping crown root locks with staggered fine ends');if(!m)throw new Error('Missing109 carrier mesh');m.visible=false;m.castShadow=false;
   }else{
    const m=p.model.getObjectByName('Independent fine crown lengths and silhouette strands');if(m.geometry.index.count!==643128*3)throw new Error('109 DETAIL topology changed');m.geometry.setDrawRange(0,623976*3);
   }
   p.scene.traverse(o=>{if(o.isLight&&o.shadow)o.shadow.needsUpdate=true;});if(p.renderer.shadowMap)p.renderer.shadowMap.needsUpdate=true;
   p.setView('detail');p.renderNow();return p.renderer.backend.isWebGPUBackend===true;
  },variant);
  if(!native)throw new Error('Native WebGPU required');await page.waitForTimeout(180);
  await page.locator('#viewport-wrap').screenshot({path:`output/qa/crown113-isolate-${variant}-detail.png`});
  report.push({variant,nativeWebGPU:native,errors});await page.close();if(errors.length)throw new Error(JSON.stringify({variant,errors}));
 }
 console.log(JSON.stringify(report));
}finally{await browser.close();}
