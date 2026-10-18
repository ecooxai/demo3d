import {chromium} from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const shift of [0,.20,.26,.32]){
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
  const result=await page.evaluate(shift=>{
   const p=window.portrait,neck=p.model.getObjectByName('original-neck-and-clavicle-transition');
   p.model.updateMatrixWorld(true);const neckInverse=neck.matrixWorld.clone().invert();let changed=0,minJacobian=1;
   neck.traverse(m=>{if(!m.isMesh)return;const g=m.geometry,a=g.attributes.position,n=g.attributes.normal,toNeck=neckInverse.clone().multiply(m.matrixWorld).elements,b=m.matrixWorld.clone().invert().elements,v=[b[0],b[1],b[2]];
    for(let i=0;i<a.count;i++){
     const x=a.getX(i),y=a.getY(i),z=a.getZ(i),ny=toNeck[1]*x+toNeck[5]*y+toNeck[9]*z+toNeck[13],t=Math.max(0,Math.min(1,(ny-1.15)/.80)),w=t*t*(3-2*t),dw=t>0&&t<1?6*t*(1-t)/.80:0;
     if(w===0||shift===0)continue;const gradient=[shift*dw*toNeck[1],shift*dw*toNeck[5],shift*dw*toNeck[9]],det=1+v[0]*gradient[0]+v[1]*gradient[1]+v[2]*gradient[2];if(det<=0)throw new Error('Pose inverted neck');minJacobian=Math.min(minJacobian,det);
     const proj=(v[0]*n.getX(i)+v[1]*n.getY(i)+v[2]*n.getZ(i))/det,nx=n.getX(i)-gradient[0]*proj,nn=n.getY(i)-gradient[1]*proj,nz=n.getZ(i)-gradient[2]*proj,len=Math.hypot(nx,nn,nz);a.setXYZ(i,x+shift*w*v[0],y+shift*w*v[1],z+shift*w*v[2]);n.setXYZ(i,nx/len,nn/len,nz/len);changed++;
    }a.needsUpdate=true;n.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();
   });p.headPivot.position.x+=shift;p.model.updateMatrixWorld(true);p.setScore(52,74);return{shift,changed,minJacobian};
  },shift);
  for(const v of ['front','detail']){await page.evaluate(v=>{window.portrait.setView(v);window.portrait.renderNow();},v);await page.waitForTimeout(180);await page.locator('#viewport-wrap').screenshot({path:`output/qa/pose-52-${Math.round(shift*100)}-${v}.png`});}
  console.log(JSON.stringify(result));
 }
 if(errors.length)throw new Error(JSON.stringify(errors));
}finally{await browser.close();}
