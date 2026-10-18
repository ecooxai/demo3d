import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 for(const variant of ['baseline','subtle','defined']){
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  await page.evaluate(variant=>{
   const p=window.portrait;p.setScore(37,71);
   if(variant!=='baseline')p.headPivot.traverse(o=>{
    if(o.name!=='ear-continuous-anatomical-shell')return;
    const a=o.geometry.attributes.color,uv=o.geometry.attributes.uv,col=o.material.color.clone(),warm=col.clone().set('#bb7b6e'),strength=variant==='subtle'?.7:1.2;
    const ellipse=(u,v,cx,cy,rx,ry)=>Math.exp(-(((u-cx)/rx)**2+((v-cy)/ry)**2));
    for(let i=0;i<2689;i++){
     const u=uv.getX(i)*2-1,v=uv.getY(i)*2-1,concha=ellipse(u,v,-.25,-.14,.38,.24),canal=ellipse(u,v,-.49,-.18,.17,.13),fossa=ellipse(u,v,-.08,.48,.25,.18);
     col.setRGB(a.getX(i),a.getY(i),a.getZ(i));col.lerp(warm,strength*(.34*concha+.23*canal+.10*fossa));col.multiplyScalar(1-strength*(.07*concha+.05*canal));a.setXYZ(i,col.r,col.g,col.b);
    }
    a.needsUpdate=true;o.material.roughness=.54;o.material.specularIntensity=.24;
   });
   p.setView('detail');p.renderNow();
  },variant);
  await page.waitForTimeout(250);await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-37-ear-${variant}.png`});
  await page.evaluate(()=>{
   const p=window.portrait;for(const o of p.headPivot.children)if(o.name!=='anatomical-head')o.visible=false;
   const ear=p.headPivot.getObjectByName('left-ear').children[0],center=ear.geometry.boundingBox.getCenter(p.camera.position.clone());ear.localToWorld(center);
   p.controls.target.copy(center);p.camera.position.copy(center).add(center.clone().set(-1.2,0,5));p.camera.zoom=2.2;p.camera.updateProjectionMatrix();p.camera.lookAt(center);p.controls.update();p.renderNow();
  });
  await page.waitForTimeout(250);await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-37-ear-${variant}-isolated.png`});
  console.log(JSON.stringify({variant}));
 }
}finally{await browser.close();}
