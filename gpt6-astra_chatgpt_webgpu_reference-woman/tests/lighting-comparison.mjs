import { chromium } from 'playwright';
import path from 'node:path';

const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>console.log('ERROR',e.message));
  await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready);
  for(const variant of ['wide-fill','skin-bounce','balanced']) {
    const metrics=await page.evaluate(variant=>{
      const p=window.portrait;
      p.setLighting('soft');
      const ambient=p.scene.children.find(o=>o.isAmbientLight),[key,fill,rim]=p.scene.children.filter(o=>o.isDirectionalLight);
      key.position.set(-3.8,6.5,7);fill.position.set(4,3,5);rim.intensity=1;
      const presets={
        'wide-fill':{ambient:1.35,key:.92,fill:.85,rim:.6,bounce:0},
        'skin-bounce':{ambient:.8,key:1.65,fill:1.15,rim:1,bounce:.10},
        'balanced':{ambient:1.10,key:1.05,fill:1.00,rim:.75,bounce:.04}
      };
      const a=presets[variant];ambient.intensity=a.ambient;key.intensity=a.key;fill.intensity=a.fill;rim.intensity=a.rim;
      if(variant!=='skin-bounce'){key.position.set(-3,6,8);fill.position.set(4,3,8);}
      const seen=new Set();
      p.headPivot.traverse(o=>{
        if(!o.isMesh||!['continuous-face','sculpted-eyelids','upper-lip','lower-lip'].includes(o.name))return;
        for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.map&&!seen.has(m)){
          seen.add(m);m.emissiveMap=m.map;m.emissive.set('#ffffff');m.emissiveIntensity=a.bounce;m.specularIntensity=.23;m.bumpScale=.0015;m.needsUpdate=true;
        }
      });
      p.setView('detail');p.renderNow();
      return {variant,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,materials:seen.size,lights:a};
    },variant);
    await page.waitForTimeout(350);
    await page.locator('#viewport-wrap').screenshot({path:`output/qa/lighting-${variant}-detail.png`});
    console.log(JSON.stringify(metrics));
  }
} finally { await browser.close(); }
