import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// One uniform diffuse-color study on accepted141, under the selected128 display.
// Unlike101, every existing hair layer receives the same RGB multiplier; no
// relative layer gain, specular change, source sampling or geometry edit occurs.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa');
const sha=b=>createHash('sha256').update(b).digest('hex');
const expectedMain='2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a';
const expectedGroom='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d';
if(sha(await readFile(path.join(root,'src/main.js')))!==expectedMain||sha(await readFile(path.join(root,'src/hair-groom.js')))!==expectedGroom)throw Error('149 requires unchanged141 main and133 groom.');
await mkdir(qa,{recursive:true});
const report={iteration:149,score:77,acceptedIteration:141,status:'Running',linearDiffuseMultiplier:[.65,.69,.75],scope:'Uniform original hair material diffuse multiplier only. Not a measured albedo calibration. Geometry, vertex RGB/alpha, maps, specular response, light and display are unchanged.',cases:[],errors:[]};
const out=path.join(qa,'hair-color149-native.json'),save=()=>writeFile(out,JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
let page;
try{
 page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push({type:'pageerror',message:e.message}));
 page.on('console',m=>{if(m.type()==='error')report.errors.push({type:'console',message:m.text().slice(0,1600)});});
 await page.goto('http://127.0.0.1:8766/?backend=webgpu',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:60000});
 report.setup=await page.evaluate(async()=>{
  const p=window.portrait,require=(v,m)=>{if(!v)throw Error(m);};
  require(p.ready&&p.renderer.backend?.isWebGPUBackend,'149 requires native WebGPU. No fallback.');
  require(p.state.iteration===141&&p.state.score===77&&p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2&&p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4,'149 baseline state/display changed.');
  require(p.state.upperLipRelief140?.strength===1&&p.state.crownFacing141?.side===0&&p.state.crownFacing141?.shadowSide===2,'149 accepted preparation missing.');
  p.startTurntable(false);p.setScore(149,77);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
  const hair=p.model.getObjectByName('Original reference-directed chestnut layered groom');require(hair?.children.length===5,'149 original hair population changed.');
  const materials=new Map(),meshes=[],attrs=[],textures=new Map(),disposals={geometry:0,material:0,texture:0};
  const fingerprint=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),x=>x.toString(16).padStart(2,'0')).join('');
  const pixels=t=>t.image?.data||t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data;
  const settings=m=>JSON.stringify(Object.fromEntries(['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','alphaTest','alphaToCoverage','side','shadowSide','transparent','opacity','depthWrite','clearcoat','clearcoatRoughness','toneMapped','vertexColors'].map(k=>[k,m[k]]).concat(['specularColor','normalScale'].map(k=>[k,m[k]?.toArray?.()]))));
  for(const mesh of hair.children){
   require(mesh.isMesh&&!Array.isArray(mesh.material)&&mesh.material.isMeshPhysicalMaterial,'149 unexpected hair binding.');
   meshes.push({mesh,geometry:mesh.geometry,material:mesh.material,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow,visible:mesh.visible});
   mesh.geometry.addEventListener('dispose',()=>disposals.geometry++);
   for(const [name,a]of[...Object.entries(mesh.geometry.attributes),['index',mesh.geometry.index]])if(a)attrs.push({mesh,name,attribute:a,array:a.array,version:a.version,hash:await fingerprint(a.array)});
   const m=mesh.material;
   if(!materials.has(m)){
    const slots=Object.fromEntries(Object.entries(m).filter(([,t])=>t?.isTexture));materials.set(m,{name:mesh.name,color:m.color.clone(),settings:settings(m),slots});m.addEventListener('dispose',()=>disposals.material++);
    for(const t of Object.values(slots))if(!textures.has(t)){textures.set(t,{source:t.source,image:t.image,version:t.version,sourceVersion:t.source.version,hash:await fingerprint(pixels(t))});t.addEventListener('dispose',()=>disposals.texture++);}
   }
  }
  require(materials.size===5,'149 expects five distinct hair materials.');
  window.audit149={hair,materials,meshes,attrs,textures,disposals,fingerprint,pixels,settings,cached:[p.state.mouthContinuity130,p.state.upperLipRelief140,p.state.referenceCrown,p.state.crownFacing141],environment:p.scene.environment,environmentIntensity:p.scene.environmentIntensity};
  return{nativeWebGPU:true,output:[p.state.width,p.state.height],aa:p.state.antialiasing,exposure:p.renderer.toneMappingExposure,toneMapping:p.renderer.toneMapping,hairTriangles:hair.userData.triangles,geometryMiB:hair.userData.geometryMiB,attributes:attrs.length,textures:textures.size,materials:[...materials.values()].map(r=>({name:r.name,linearColor:r.color.toArray(),sRGBHex:r.color.getHexString()}))};
 });await save();
 const integrity=async expected=>page.evaluate(async expected=>{
  const s=window.audit149,p=window.portrait,require=(v,m)=>{if(!v)throw Error(m);};
  for(const r of s.meshes)require(r.mesh.geometry===r.geometry&&r.mesh.material===r.material&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow&&r.mesh.visible===r.visible,'149 mesh state changed.');
  for(const r of s.attrs){const a=r.name==='index'?r.mesh.geometry.index:r.mesh.geometry.attributes[r.name];require(a===r.attribute&&a.array===r.array&&a.version===r.version&&await s.fingerprint(a.array)===r.hash,'149 source geometry bytes changed.');}
  for(const [m,r]of s.materials){require(s.settings(m)===r.settings,'149 changed non-color hair settings.');const expectedColor=r.color.toArray().map((x,i)=>x*expected[i]);require(m.color.toArray().every((x,i)=>x===expectedColor[i]),'149 color multiplier mismatch.');for(const [k,t]of Object.entries(r.slots))require(m[k]===t,'149 texture binding changed.');}
  for(const [t,r]of s.textures)require(t.source===r.source&&t.image===r.image&&t.version===r.version&&t.source.version===r.sourceVersion&&await s.fingerprint(s.pixels(t))===r.hash,'149 map bytes or source changed.');
  require([p.state.mouthContinuity130,p.state.upperLipRelief140,p.state.referenceCrown,p.state.crownFacing141].every((r,i)=>r===s.cached[i]),'149 cached preparation changed.');
  require(p.scene.environment===s.environment&&p.scene.environmentIntensity===s.environmentIntensity,'149 environment changed.');
  require(Object.values(s.disposals).every(x=>x===0),'149 disposed original resources.');
  return{originalAttributeBuffers:s.attrs.length,originalMaterials:s.materials.size,originalTextures:s.textures.size,sourceBytesAndReferencesExact:true,nonColorMaterialSettingsExact:true,disposals:s.disposals};
 },expected);
 for(const mode of[0,1]){
  const factor=mode?report.linearDiffuseMultiplier:[1,1,1],c={mode,factor,captures:[]};report.cases.push(c);
  c.colors=await page.evaluate(factor=>{const s=window.audit149,p=window.portrait;for(const[m,r]of s.materials)m.color.setRGB(r.color.r*factor[0],r.color.g*factor[1],r.color.b*factor[2]);p.renderNow();return[...s.materials].map(([m,r])=>({name:r.name,linearColor:m.color.toArray(),sRGBHex:m.color.getHexString()}));},factor);
  for(const view of['front','detail','left','right','back','hair','hair-oblique']){
   const camera=await page.evaluate(async view=>{
    const p=window.portrait;p.setView(view.startsWith('hair')?'detail':view);
    if(view.startsWith('hair')){const target=p.controls.target;target.set(.12,3.91,.48);p.camera.position.copy(target).add(p.model.position.clone().set(view==='hair-oblique'?-4:0,.12,10));p.camera.zoom=1.65;p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();}
    p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();return{position:p.camera.position.toArray(),target:p.controls.target.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom};
   },view);
   const file=`hair-color149-${mode}-${view}.png`,b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});c.captures.push({view,file:'output/qa/'+file,bytes:b.length,sha256:sha(b),camera});await save();
  }
  c.integrity=await integrity(factor);const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);c.idleFrames=await page.evaluate(x=>window.portrait.state.renderedFrames-x,frames);if(c.idleFrames!==0)throw Error('149 introduced idle frames.');
 }
 await page.evaluate(async()=>{const s=window.audit149,p=window.portrait;for(const[m,r]of s.materials)m.color.copy(r.color);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});
 report.restoration=await integrity([1,1,1]);const b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,'hair-color149-restored-front.png'),animations:'disabled'});report.restoration.frontSHA256=sha(b);report.restoration.originalFrontSHA256=report.cases[0].captures[0].sha256;report.restoration.exactPNG=sha(b)===report.cases[0].captures[0].sha256;
 if(report.errors.length)throw Error('149 browser errors.');report.status='Passed';await save();console.log(JSON.stringify({status:report.status,setup:report.setup,cases:report.cases.map(c=>({mode:c.mode,factor:c.factor,colors:c.colors,integrity:c.integrity,idleFrames:c.idleFrames})),restoration:report.restoration,errors:report.errors}));
}catch(error){report.status='Failed';report.failure=String(error?.stack||error);await save();throw error;}
finally{if(page)await page.close();await browser.close();}
