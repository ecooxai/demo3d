import {chromium} from 'playwright';
import path from 'node:path';import fs from 'node:fs/promises';
const iteration=process.argv[2]||'8',browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
try{
const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
let errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text().slice(0,300));});
await page.goto('http://127.0.0.1:8766/'+(process.argv[3]||''),{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:90000});
for(const view of ['front','left','right','back','detail']){
 await page.evaluate(v=>window.portrait.setView(v),view);await page.waitForTimeout(250);
 await page.locator('#viewport-wrap').screenshot({path:'output/qa/iteration-'+iteration+'-'+view+'.png'});
}
console.log(JSON.stringify(await page.evaluate(()=>({nativeWebGPU:window.portrait.renderer.backend.isWebGPUBackend===true,frameCount:window.portrait.state.renderedFrames,submitMs:window.portrait.state.renderMs,heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null,score:window.portrait.state.score}))));
if(errors.length)console.log('BROWSER ERRORS',JSON.stringify(errors));
}finally{await browser.close();}
