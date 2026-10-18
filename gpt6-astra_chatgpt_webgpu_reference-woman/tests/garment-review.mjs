import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.evaluate(()=>{const p=window.portrait;p.headPivot.traverse(o=>{if(o.name.startsWith('Dense fine bowed')){o.material.roughness=.90;o.material.specularIntensity=0;o.material.anisotropy=0;o.material.envMapIntensity=0;}});p.setScore(56,70);p.setView('front');p.renderNow();});
 await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:'output/qa/iteration-56-blouse-front.png'});
 await page.evaluate(()=>{const p=window.portrait;p.headPivot.visible=false;p.setView('detail');p.controls.target.set(0,.1,.2);p.camera.position.set(0,.1,13.2);p.camera.zoom=.72;p.camera.updateProjectionMatrix();p.camera.lookAt(p.controls.target);p.controls.update();p.renderNow();});
 await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:'output/qa/iteration-56-blouse-garment.png'});
 if(errors.length)throw new Error(JSON.stringify(errors));console.log(JSON.stringify({result:'rendered',comparison:'Three body buttons and shaped placket; runtime matte fringe only for reviewing the garment.'}));
}finally{await browser.close();}
