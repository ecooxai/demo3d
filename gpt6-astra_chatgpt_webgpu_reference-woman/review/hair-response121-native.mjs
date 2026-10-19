import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';

// Review121 tests whether the physically shaded long locks can resolve the
// fixed-U rounded strand relief at a less diffuse optical response. It keeps
// source RGB, all geometry, the crown, fringe, wisps and existing fine material.
const source=await readFile('src/main.js','utf8');
const entry="import {applyHairStrandNormal111,releaseHairStrandNormal111} from '../review/hair-strand-normal-candidate111.js';\n"+source+
 '\nwindow.hairResponse121={applyHairStrandNormal111,releaseHairStrandNormal111};\n';
await mkdir('output/qa',{recursive:true});
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-hair-response121.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-hair-response121.js',logLevel:'silent'});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),reports=[];
try{
 for(const mode of[0,1,2]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-hair-response121.js',contentType:'text/javascript'}));
   await page.goto('http://127.0.0.1:8766/',{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});
   const metrics=await page.evaluate(mode=>{
    const p=window.portrait,api=window.hairResponse121,hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom');
    const mass=hair.getObjectByName('Overlapping layered S-wave hair around front back and shoulders');
    const others=hair.children.filter(o=>o!==mass).map(o=>({object:o,geometry:o.geometry,material:o.material}));
    const material=mass.material,geometry=mass.geometry;
    const attrs=Object.entries({...geometry.attributes,index:geometry.index}).map(([key,a])=>({key,a,array:a.array,version:a.version}));
    const baseline={roughness:material.roughness,specularIntensity:material.specularIntensity,anisotropy:material.anisotropy,normalScale:material.normalScale.toArray(),envMapIntensity:material.envMapIntensity};
    const normal=api.applyHairStrandNormal111(hair,{mode:mode?1:0});
    if(mode){
     const m=mass.material;
     m.roughness=mode===1?.40:.30;
     m.specularIntensity=mode===1?.58:.72;
     m.anisotropy=.85;
     m.normalScale.set(mode===1?.62:.85,.09);
     m.needsUpdate=true;
    }
    api.cleanup=()=>{
     const released=api.releaseHairStrandNormal111(hair);
     if(mass.material!==material||mass.geometry!==geometry)throw new Error('121 did not restore source MASS material/geometry.');
     for(const x of attrs)if((x.key==='index'?geometry.index:geometry.getAttribute(x.key))!==x.a||x.a.array!==x.array||x.a.version!==x.version)throw new Error('121 altered a source attribute.');
     for(const x of others)if(x.object.material!==x.material||x.object.geometry!==x.geometry)throw new Error('121 altered a protected hair mesh.');
     return{released,sourceReferencesAndVersionsRestored:true,protectedHairMeshes:others.length};
    };
    p.setScore(121,76);
    return{mode,nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,baseline,selected:{roughness:mass.material.roughness,specularIntensity:mass.material.specularIntensity,anisotropy:mass.material.anisotropy,normalScale:mass.material.normalScale.toArray(),envMapIntensity:mass.material.envMapIntensity},normal,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null};
   },mode);
   if(!metrics.nativeWebGPU)throw new Error('121 requires actual native WebGPU.');
   for(const view of['front','detail','left','right','back']){
    await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);
    await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-response121-${mode}-${view}.png`});
   }
   await page.evaluate(async()=>{
    const p=window.portrait;let key,fill;p.scene.traverse(o=>{if(o.isDirectionalLight){if(o.castShadow)key=o;else if(o.position.z>0)fill=o;}});
    if(!key||!fill)throw new Error('121 expected the accepted studio lights.');
    key.position.set(5.5,5,3.4);fill.position.set(-4,3,6);fill.intensity=.55;key.shadow.needsUpdate=true;if(p.renderer.shadowMap)p.renderer.shadowMap.needsUpdate=true;
    p.setView('front');p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();
   });
   await page.waitForTimeout(160);await page.locator('#viewport-wrap').screenshot({path:`output/qa/hair-response121-${mode}-relight-front.png`});
   const cleanup=await page.evaluate(()=>window.hairResponse121.cleanup());
   if(errors.length)throw new Error(JSON.stringify(errors));reports.push({...metrics,cleanup,errors});
   console.log(JSON.stringify({iteration:121,mode,selected:metrics.selected,nativeWebGPU:metrics.nativeWebGPU,heapMiB:metrics.heapMiB,normalMs:metrics.normal.constructionMs??0,cleanup,errors}));
  }finally{await page.close();}
 }
 await writeFile('output/qa/hair-response121-native-result.json',JSON.stringify(reports,null,2)+'\n');
}finally{await browser.close();}
