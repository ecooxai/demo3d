import {chromium} from 'playwright';
import path from 'node:path';
const iteration=Number(process.argv[2]||60),score=Number(process.argv[3]||75);
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.evaluate(({iteration,score})=>window.portrait.setScore(iteration,score),{iteration,score});
 for(const view of ['front','left','right']){
  await page.evaluate(view=>{window.portrait.setView(view);window.portrait.renderNow();},view);
  await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-${iteration}-blouse-${view}.png`});
 }
 await page.evaluate(()=>{
  const p=window.portrait;p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);
  p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();
 });
 await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-${iteration}-blouse-garment.png`});
 if(errors.length)throw new Error(JSON.stringify(errors));
 console.log(JSON.stringify(await page.evaluate(()=>({result:'rendered',nativeWebGPU:window.portrait.renderer.backend.isWebGPUBackend===true,iteration:window.portrait.state.iteration,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null}))));
}finally{await browser.close();}

