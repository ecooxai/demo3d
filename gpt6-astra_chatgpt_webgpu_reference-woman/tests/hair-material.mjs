import { chromium } from 'playwright';
import path from 'node:path';

const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>console.log('ERROR',e.message));
  for (const variant of (process.argv[2]==='highlight'?['white-reflection','fiber-reflection']:['baseline','balanced-color','soft-gloss','strong-gloss'])) {
    await page.goto('http://127.0.0.1:8766/?hair=coverage',{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.portrait?.ready);
    const metrics=await page.evaluate(variant=>{
      const p=window.portrait,changed=[];
      p.setScore(31,68);
      p.headPivot.traverse(o=>{
        if(!o.isMesh||!['Hair 366 fine layered continuous strand cards','Hair fine parted crown layers'].includes(o.name))return;
        const m=o.material;
        if(variant!=='baseline') {
          const color=o.geometry.attributes.color,avg=[0,0,0];
          for(let i=0;i<color.count;i++){avg[0]+=color.getX(i);avg[1]+=color.getY(i);avg[2]+=color.getZ(i);}
          avg.forEach((x,i)=>avg[i]=x/color.count);
          const target=m.color.clone().set('#51413c');
          for(let i=0;i<color.count;i++)color.setXYZ(i,target.r*(.94+.06*color.getX(i)/avg[0]),target.g*(.94+.06*color.getY(i)/avg[1]),target.b*(.94+.06*color.getZ(i)/avg[2]));
          color.needsUpdate=true;
        }
        if(variant==='soft-gloss'){m.roughness=.55;m.specularIntensity=.22;m.anisotropy=.65;m.envMapIntensity=.35;}
        if(variant==='strong-gloss'){m.roughness=.45;m.specularIntensity=.40;m.anisotropy=.85;m.envMapIntensity=.40;}
        if(variant==='white-reflection'||variant==='fiber-reflection'){m.roughness=.38;m.specularIntensity=1;m.specularColor.set('#ffffff');m.anisotropy=.85;m.envMapIntensity=.65;}
        if(variant==='fiber-reflection')m.normalScale.set(.55,.08);
        m.needsUpdate=true;
        changed.push({mesh:o.name,roughness:m.roughness,specularIntensity:m.specularIntensity,anisotropy:m.anisotropy});
      });
      return {variant,changed,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true};
    },variant);
    for(const view of ['front','detail','back']){
      await page.evaluate(view=>{window.portrait.setView(view);window.portrait.renderNow();},view);
      await page.waitForTimeout(250);
      await page.locator('#viewport-wrap').screenshot({path:`output/qa/iteration-31-${variant}-${view}.png`});
    }
    console.log(JSON.stringify(metrics));
  }
} finally {await browser.close();}
