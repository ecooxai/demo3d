import {chromium} from 'playwright';
import path from 'node:path';

// Existing fine ribbons are widened symmetrically about their exact centers.
// Fringe, wisps, opaque hair forms and the last86 flyaways are unchanged.
const iteration=90;
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try{
 for(const widthScale of [1,2,3]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  try{
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
   const metrics=await page.evaluate(({iteration,widthScale})=>{
    const p=window.portrait;p.setScore(iteration,76);
    const mesh=p.headPivot.getObjectByName('Independent fine crown lengths and silhouette strands');
    const geometry=mesh.geometry,position=geometry.attributes.position;
    const end=position.count-86*50,crownStart=end-2300*54;
    if(crownStart<0||crownStart%58!==0||end%2)throw new Error('Unexpected accepted fine ribbon layout');
    let maxDisplacement=0;
    if(widthScale!==1){
     for(let i=0;i<end;i+=2){
      const at=i*3,bt=at+3;let d2=0;
      for(let ch=0;ch<3;ch++){
       const a=position.array[at+ch],b=position.array[bt+ch],center=(a+b)*.5,half=(b-a)*.5*widthScale;
       position.array[at+ch]=center-half;position.array[bt+ch]=center+half;d2+=(position.array[at+ch]-a)**2;
      }
      maxDisplacement=Math.max(maxDisplacement,Math.sqrt(d2));
     }
     position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
    }
    p.renderNow();
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,widthScale,maxDisplacement,longFibers:crownStart/58,crownFibers:2300,positions:position.count,heapMiB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};
   },{iteration,widthScale});
   if(!metrics.nativeWebGPU)throw new Error('Native WebGPU required');
   for(const view of ['front','detail','right','back']){
    await page.evaluate(view=>{const p=window.portrait;p.setView(view);p.renderNow();},view);await page.waitForTimeout(180);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-width-${iteration}-${widthScale}-${view}.png`});
   }
   console.log(JSON.stringify({iteration,...metrics,errors}));if(errors.length)throw new Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
}finally{await browser.close();}
