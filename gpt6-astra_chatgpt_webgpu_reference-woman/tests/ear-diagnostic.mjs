import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 await page.evaluate(()=>{
  const p=window.portrait;p.setView('detail');
  p.model.traverse(o=>{if(o.isMesh&&o.name.startsWith('Hair'))o.visible=false;});
  const ear=p.headPivot.getObjectByName('left-ear');
  const target=ear.children[0].geometry.boundingBox.getCenter(p.camera.position.clone());ear.localToWorld(target);
  p.controls.target.copy(target);p.camera.position.copy(target).add(p.camera.up.clone().set(-1.2,0,5));p.camera.zoom=2.8;p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();
 });
 await page.waitForTimeout(300);await page.locator('#viewport-wrap').screenshot({path:'output/qa/ear-anatomy-isolated.png'});
 console.log('Closed ear, attachment and local cartilage diagnostic complete.');
}finally{await browser.close();}
