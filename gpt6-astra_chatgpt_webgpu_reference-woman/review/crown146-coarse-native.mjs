import{chromium}from'playwright';
import{build}from'esbuild';
import{readFile,writeFile}from'node:fs/promises';
import path from'node:path';
import crypto from'node:crypto';

// Root-only native COARSE comparison. Both fresh pages hide the same exact
// owned old dedicated-crown/edge-wisp slots. This is a structural art gate,
// not production coverage or a proposed score increase. No source mutation.
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const main=await readFile('src/main.js','utf8'),hair=await readFile('review/hair-groom-candidate146.js','utf8'),helper=await readFile('review/crown-flow-candidate146.js','utf8');
const acceptedMain='2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a';
if(hash(main)!==acceptedMain)throw Error('Review146 requires accepted141 main; inspect later integration before changing the guard.');
const marker='createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1})';
if(main.split(marker).length!==2)throw Error('Expected the accepted133 groom constructor once.');
const entry=main.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,crownFlow146:Number(new URLSearchParams(location.search).get('crownflow146')||0)})");
await build({stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'main-crown146-coarse-review.js',loader:'js'},bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:'output/qa/app-crown146-coarse.js',logLevel:'silent',plugins:[{name:'isolated-coarse146',setup(b){b.onLoad({filter:/[/\\]hair-groom\.js$/},()=>({contents:hair,loader:'js',resolveDir:path.resolve('src')}));}}]});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']}),report=[];
let fixedJunctionTarget=null;
try{
 for(const strength of[0,1]){
  const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  try{
   await page.route('**/app.js',r=>r.fulfill({path:'output/qa/app-crown146-coarse.js',contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?crownflow146=${strength}`,{waitUntil:'networkidle'});
   try{await page.waitForFunction(()=>window.portrait?.ready,{},{timeout:60000});}catch(e){throw Error(`Coarse146 failed: ${await page.locator('#gate-message').textContent()} / ${e.message}`);}
   const metrics=await page.evaluate(async()=>{
    const p=window.portrait;p.setScore(146,77);document.querySelector('#iteration-label').textContent='146 · COARSE STUDY';document.querySelector('#score-label').innerHTML='77 <small>BASELINE</small>';
    const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.getObjectByName('Continuous parted crown with longitudinal fiber flow'),isolation=hair.userData.coarseIsolation146;
    if(!isolation||isolation.detail.length!==575||isolation.wisps.length!==310)throw Error('Coarse146 expected exact owned old fine ranges.');
    const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a)),b=>b.toString(16).padStart(2,'0')).join('');
    const hidden=[];
    for(const[name,rows]of[['Independent fine crown lengths and silhouette strands',isolation.detail],['Sparse short temple edge and hairline wisps',isolation.wisps]]){
     const mesh=hair.getObjectByName(name),g=mesh.geometry,index=g.index,owned=new Uint8Array(g.attributes.position.count);for(const r of rows)owned.fill(1,r.first,r.first+r.count);
     let keep=0,removed=0;for(let i=0;i<index.count;i+=3){const a=owned[index.array[i]],b=owned[index.array[i+1]],c=owned[index.array[i+2]];if(a||b||c){if(!(a&&b&&c))throw Error('Isolation would cut through a ribbon triangle');removed++;}else keep+=3;}
     const a=new index.array.constructor(keep);let at=0;for(let i=0;i<index.count;i+=3)if(!owned[index.array[i]]){a[at++]=index.array[i];a[at++]=index.array[i+1];a[at++]=index.array[i+2];}
     const next=new index.constructor(a,1);g.setIndex(next);
     hidden.push({mesh:name,ribbons:rows.length,removedTriangles:removed,originalIndexSHA256:await digest(index.array),coarseIndexSHA256:await digest(a),rows});
    }
    const maps={};for(const name of['map','alphaMap','normalMap']){
     const t=crown.material[name],im=t?.image;if(!im?.data)throw Error(`Expected post100 ${name} DataTexture`);
     maps[name]={name:t.name,width:im.width,height:im.height,channel:t.channel??0,sha256:await digest(im.data),colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter};
    }
    let nonfinite=0,coarseTriangles=0;hair.traverse(o=>{if(!o.isMesh)return;coarseTriangles+=o.geometry.index.count/3;for(const a of Object.values(o.geometry.attributes))for(const v of a.array)if(!Number.isFinite(v))nonfinite++;});
    p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();
    return{nativeWebGPU:p.renderer.backend.isWebGPUBackend===true,result:hair.userData.crownFlow146,guidePlacement:hair.userData.guidePlacement118.strength,diagonalFringe:hair.userData.diagonalFringe133.strength,side:crown.material.side,shadowSide:crown.material.shadowSide,upperLipRelief140:p.state.upperLipRelief140,hairTriangles:hair.userData.triangles,coarseTriangles,geometryMiB:hair.userData.geometryMiB,constructionMs:hair.userData.constructionMs,nonfinite,internal:p.state.internalRender,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null,hidden,post100Maps:maps,post100UV1SHA256:await digest(crown.geometry.attributes.uv1.array),post100ColorSHA256:await digest(crown.geometry.attributes.color.array)};
   });
   if(!metrics.nativeWebGPU||metrics.result.strength!==strength||metrics.nonfinite||metrics.guidePlacement!==.5||metrics.diagonalFringe!==1||metrics.side!==0||metrics.shadowSide!==2||!metrics.upperLipRelief140||metrics.coarseTriangles!==1070108)throw Error('Expected finite native146, exact coarse isolation and accepted118/133/140/141 settings.');
   const captures=[];
   const capture=async view=>{const file=`output/qa/crown146-coarse-${strength}-${view}.png`,buffer=await page.locator('#viewport-wrap').screenshot({path:file,animations:'disabled'});captures.push({view,path:file,sha256:hash(buffer)});};
   for(const view of['front','detail','left','right','back']){await page.evaluate(async view=>{const p=window.portrait;p.setView(view);p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();},view);await page.waitForTimeout(180);await capture(view);}
   const junctionCamera=await page.evaluate(async fixed=>{
    const p=window.portrait;p.setView('detail');const crown=p.headPivot.getObjectByName('Continuous parted crown with longitudinal fiber flow'),a=crown.geometry.attributes.position,i=7685+Math.round(.54*64)*129+Math.round(.85*128),target=p.camera.position.clone();
    if(fixed)target.set(...fixed);else{target.set(a.getX(i),a.getY(i)-.13,a.getZ(i));crown.localToWorld(target);}
    const direction=p.camera.position.clone().sub(p.controls.target);p.controls.target.copy(target);p.camera.position.copy(target).add(direction);p.camera.zoom=1.9;p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();return{target:target.toArray(),zoom:p.camera.zoom,baselineVertex:i};
   },fixedJunctionTarget);fixedJunctionTarget??=junctionCamera.target;
   await page.waitForTimeout(180);await capture('junction');
   await page.evaluate(async()=>{const p=window.portrait;p.setView('detail');p.renderNow();await p.renderer.backend.device?.queue.onSubmittedWorkDone();});await page.waitForTimeout(180);await capture('restored-detail');
   const strictRestoredDetail=captures.find(c=>c.view==='detail').sha256===captures.find(c=>c.view==='restored-detail').sha256;
   report.push({iteration:146,stage:'coarse diagnostic; baseline quality77 retained pending art',strength,mainSHA256:acceptedMain,hairSHA256:hash(hair),helperSHA256:hash(helper),...metrics,junctionCamera,captures,strictRestoredDetail,errors});
   console.log(JSON.stringify({iteration:146,stage:'coarse only',strength,nativeWebGPU:metrics.nativeWebGPU,result:metrics.result,constructionMs:metrics.constructionMs,heapMiB:metrics.heapMiB,coarseTriangles:metrics.coarseTriangles,post100Maps:metrics.post100Maps,captures:captures.map(c=>c.path),strictRestoredDetail,errors}));
   if(errors.length)throw Error(JSON.stringify(errors));
  }finally{await page.close();}
 }
 await writeFile('output/qa/crown146-coarse-native-report.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
