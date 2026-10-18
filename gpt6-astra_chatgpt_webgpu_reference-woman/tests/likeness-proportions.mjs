import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 for(const factor of [1,.96,.94,.92]) {
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const metrics=await page.evaluate(factor=>{
   const p=window.portrait,head=p.headPivot.getObjectByName('anatomical-head');p.setScore(47,72);let maximumShift=0,changed=0;
   if(factor!==1)head.traverse(o=>{
    if(!o.isMesh)return;
    const a=o.geometry.attributes.position,n=o.geometry.attributes.normal;
    for(let i=0;i<a.count;i++){
     const y=a.getY(i),t=Math.max(0,Math.min(1,(.05-y)/.18)),w=t*t*(3-2*t),dw=t>0&&t<1?-6*t*(1-t)/.18:0;
     const yy=y-(1-factor)*(y-.05)*w,jac=1-(1-factor)*(w+(y-.05)*dw);
     if(yy!==y){a.setY(i,yy);changed++;maximumShift=Math.max(maximumShift,Math.abs(yy-y));const nx=n.getX(i),ny=n.getY(i)/jac,nz=n.getZ(i),l=Math.hypot(nx,ny,nz);n.setXYZ(i,nx/l,ny/l,nz/l);}
    }
    a.needsUpdate=true;n.needsUpdate=true;o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
   });
   p.renderNow();return {factor,maximumShift,changed,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true};
  },factor);
  for(const view of ['front','detail']){
   await page.evaluate(view=>window.portrait.setView(view),view);await page.waitForTimeout(200);
   await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-47-proportion-${Math.round(factor*100)}-${view}.png`});
  }
  console.log(JSON.stringify(metrics));
 }
} finally {await browser.close();}
