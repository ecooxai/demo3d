import { chromium } from 'playwright';
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

// Root-only native167 independent rounded-lock art gate. Production files are never
// modified. Accepted164 and deferred-tint ZERO are checked before the two
// identically isolated coarse pages. No fine rebuilding or export occurs.
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const acceptedMain = '88280af03c4be630968aca0763d3d430ec6699ae9533ba057015c53801d4ae55';
const acceptedHair = 'a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d';
const files = Object.fromEntries(await Promise.all([
  'review/crown167-baseline164-sources.json',
  'review/hair-groom-candidate167.js', 'review/front-locks-candidate167.js',
  'review/hair-color-candidate167.js', 'review/crown167-coarse-native.mjs',
].map(async p => [p, await readFile(p, 'utf8')])));
const frozenHash='e7dd2a195de5cc01db506e581eed147ff6caf6a01ab5c9fe562be253836b69f9';
if(hash(files['review/crown167-baseline164-sources.json'])!==frozenHash)throw Error('167 immutable164 dependency registry changed');
const frozen=JSON.parse(files['review/crown167-baseline164-sources.json']);
const baselineEntry=frozen.files['src/main.js'].contents;if(hash(baselineEntry)!==acceptedMain)throw Error('167 immutable164 main changed');
for(const[p,f]of Object.entries(frozen.files))if(hash(f.contents)!==f.sha256||Buffer.byteLength(f.contents)!==f.bytes)throw Error('167 frozen dependency integrity: '+p);
if(frozen.files['src/hair-groom.js'].sha256!==acceptedHair)throw Error('167 frozen groom is not accepted133');
const frozenAssets=await Promise.all([
 ['src/eye-contour-config.json','80c678db068d31d33b2ad0e23424419d029047038de6c19f044fa7869605bfb8'],
 ['reference/image1-color.jpg','ef577a4eb5a7da2ab153cb93d0540760f756c23cb8d8fcba7271d6bd15976174'],
].map(async([p,expected])=>{const b=await readFile(p),sha256=hash(b);if(sha256!==expected)throw Error('167 accepted164 non-JS dependency changed: '+p);return{path:p,bytes:b.length,sha256};}));
await mkdir('output/qa', { recursive: true });
let entry = baselineEntry;
function replace(a, b) {
  if (entry.split(a).length !== 2) throw Error('167 expected one main marker: ' + a.slice(0, 100));
  entry = entry.replace(a, b);
}
entry = "import {applyFrontLocks167,setCoarseIsolation167,getFrontLocks167QA,releaseFrontLocks167} from '../review/front-locks-candidate167.js';\n" + entry;
replace('createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1})',
  'createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,captureFront167:true})');
replace('        state.hairColor149=applyHairColor149(anatomicalHair);',
  '        // Review167 defers this exact one-time tint until after the optional sixth material exists.');
replace('      state.jawEar159=applyJawEar159(model,{strength:1,retainSourceForQA:false});', `      state.jawEar159=applyJawEar159(model,{strength:1,retainSourceForQA:false});
      const qaStart167=performance.now();
      window.crown167Before=await snapshot167();
      window.crown167OriginalIndices=captureIndexReferences167();
      state.frontLocks167=applyFrontLocks167(anatomicalHair,anatomicalHead,{strength:Number(new URLSearchParams(location.search).get('frontlocks167')||0)});
      state.hairColor149=applyHairColor149(anatomicalHair);
      window.crown167After=await snapshot167();
      if(new URLSearchParams(location.search).get('coarse167')==='1')state.coarseIsolation167=setCoarseIsolation167(anatomicalHair);
      refreshCounts167();
      state.reviewPreparation167Ms=performance.now()-qaStart167;`);
entry += String.raw`
async function digest167(a){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');}
function captureIndexReferences167(){const rows=[];for(const root of[anatomicalHair,anatomicalHead])root.traverse(mesh=>{if(mesh.isMesh){const attribute=mesh.geometry.index;rows.push({mesh,attribute,array:attribute.array});}});return rows;}
async function snapshot167(){
 const result={hair:[],head:[],maps:{},materials:[]};
 for(const[root,key]of[[anatomicalHair,'hair'],[anatomicalHead,'head']]){
  const meshes=[];root.traverse(m=>{if(m.isMesh)meshes.push(m);});
  for(const mesh of meshes){const attrs={};for(const[k,a]of Object.entries(mesh.geometry.attributes))attrs[k]={itemSize:a.itemSize,count:a.count,sha256:await digest167(a.array)};const index=mesh.geometry.index,array=index.array,raw=await digest167(array),logical=array instanceof Uint32Array?raw:await digest167(new Uint32Array(array));result[key].push({name:mesh.name,attributes:attrs,index:logical,indexCount:index.count,indexStorage:{arrayType:array.constructor.name,bytes:array.byteLength,rawSHA256:raw},groups:mesh.geometry.groups});}
 }
 const crown=anatomicalHair.getObjectByName('Continuous parted crown with longitudinal fiber flow');
 for(const name of['map','alphaMap','normalMap']){const t=crown.material[name],im=t?.image;if(!im?.data)throw Error('167 expected actual post100 '+name+' DataTexture');result.maps[name]={name:t.name,width:im.width,height:im.height,channel:t.channel||0,sha256:await digest167(im.data),colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,generateMipmaps:t.generateMipmaps,flipY:t.flipY,matrixAutoUpdate:t.matrixAutoUpdate,matrix:t.matrix.toArray(),offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),rotation:t.rotation};}
 for(const mesh of anatomicalHair.children){const m=mesh.material;result.materials.push({name:mesh.name,color:m.color.toArray(),settings:Object.fromEntries(['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','alphaTest','alphaToCoverage','side','shadowSide','transparent','opacity','depthWrite','vertexColors'].map(k=>[k,m[k]])),normalScale:m.normalScale.toArray(),specularColor:m.specularColor.toArray()});}
 return result;
}
function refreshCounts167(){triangles=0;meshes=0;model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});if(state.ready)updateStats();}
window.crownReview167={snapshot:snapshot167,qa:()=>getFrontLocks167QA(anatomicalHair),release:()=>{const result=releaseFrontLocks167(anatomicalHair);refreshCounts167();scene.traverse(l=>{if(l.isLight&&l.shadow)l.shadow.needsUpdate=true;});return result;}};
`;
const common = { bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, logLevel: 'silent' };
function frozenPlugin(candidate=false){return{name:'immutable164-for167',setup(b){
 b.onLoad({filter:/\.(js|json)$/},args=>{
  const relative=path.relative(path.resolve('.'),args.path).replaceAll('\\','/');
  if(!frozen.files[relative])return;
  if(candidate&&relative==='src/hair-groom.js')return{contents:files['review/hair-groom-candidate167.js'],loader:'js',resolveDir:path.resolve('src')};
  if(candidate&&relative==='src/hair-color.js')return{contents:files['review/hair-color-candidate167.js'],loader:'js',resolveDir:path.resolve('review')};
  return{contents:frozen.files[relative].contents,loader:relative.endsWith('.json')?'json':'js',resolveDir:path.dirname(args.path)};
 });
}};}
await build({...common,stdin:{contents:baselineEntry,resolveDir:path.resolve('src'),sourcefile:'accepted164-review.js',loader:'js'},outfile:'output/qa/app-crown167-accepted.js',plugins:[frozenPlugin(false)]});
await build({...common,stdin:{contents:entry,resolveDir:path.resolve('src'),sourcefile:'crown167-coarse-review.js',loader:'js'},outfile:'output/qa/app-crown167-coarse.js',plugins:[frozenPlugin(true)]});

const report = { iteration: 167, acceptedIteration: 164, acceptedScore: 78, stage: 'Coarse art gate only; no production quality claim', files: Object.fromEntries(Object.entries(files).map(([p,s]) => [p, { bytes: Buffer.byteLength(s), sha256: hash(s) }])),frozenAssets,cases: [], status: 'Running' };
const reportPath = 'output/qa/crown167-coarse-native-report.json';
const save = () => writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'] });
const pngs = new Map();
let fixedJunctionTarget = null, accepted = null;
async function comparePNG(page, actual, expected) {
  if (actual.sha256 === expected.sha256) return { exactPNG: true, decodedEqual: true, changedPixels: 0, maximumChannelDifference: 0 };
  return { exactPNG: false, ...await page.evaluate(async paths => {
    const read=async p=>{const response=await fetch('/__qa167_png/'+p);if(!response.ok)throw Error('167 PNG diagnostic fetch failed');const image=await createImageBitmap(await response.blob()),canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const r={width:image.width,height:image.height,data:ctx.getImageData(0,0,image.width,image.height).data};image.close();return r;};
    const [a,b]=await Promise.all(paths.map(read));if(a.width!==b.width||a.height!==b.height)return{decodedEqual:false,sizeMismatch:true};let changedPixels=0,changedChannels=0,max=0,sum=0,minX=a.width,minY=a.height,maxX=-1,maxY=-1;
    for(let i=0;i<a.data.length;i+=4){let changed=false;for(let k=0;k<4;k++){const d=Math.abs(a.data[i+k]-b.data[i+k]);max=Math.max(max,d);sum+=d;if(d){changed=true;changedChannels++;}}if(changed){changedPixels++;const p=i/4,x=p%a.width,y=Math.floor(p/a.width);minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
    return{decodedEqual:changedPixels===0,changedPixels,changedChannels,maximumChannelDifference:max,meanAbsoluteChannelDifference:sum/a.data.length,bounds:changedPixels?[minX,minY,maxX,maxY]:null};
  }, [path.basename(actual.path), path.basename(expected.path)]) };
}
try {
  for (const spec of [
    { name: 'accepted', strength: null, coarse: false },
    { name: 'zero-control', strength: 0, coarse: false },
    { name: '0', strength: 0, coarse: true },
    { name: '1', strength: 1, coarse: true },
  ]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
    const c = { ...spec, errors: [], captures: [] }; report.cases.push(c);
    page.on('pageerror', e => c.errors.push({ type: 'pageerror', message: e.message }));
    page.on('console', m => { if (m.type() === 'error') c.errors.push({ type: 'console', message: m.text().slice(0, 1800) }); });
    try {
      await page.route('**/__qa167_png/*', r => { const key = path.basename(new URL(r.request().url()).pathname), b = pngs.get(key); return b ? r.fulfill({ body: b, contentType: 'image/png' }) : r.abort(); });
      await page.route('**/style.css', r=>r.fulfill({body:frozen.files['src/style.css'].contents,contentType:'text/css'}));
      await page.route(/^http:\/\/127\.0\.0\.1:8766\/\?/,r=>r.fulfill({body:frozen.files['index.html'].contents,contentType:'text/html'}));
      await page.route('**/app.js', r => r.fulfill({ path: spec.strength === null ? 'output/qa/app-crown167-accepted.js' : 'output/qa/app-crown167-coarse.js', contentType: 'text/javascript' }));
      await page.goto(`http://127.0.0.1:8766/?backend=webgpu&frontlocks167=${spec.strength || 0}&coarse167=${spec.coarse ? 1 : 0}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 60000 });
      c.setup = await page.evaluate(async spec => {
        const p=window.portrait,require=(v,m)=>{if(!v)throw Error(m);};
        require(p.ready&&p.renderer.backend?.isWebGPUBackend===true,'167 requires actual native WebGPU; no fallback.');
        require(p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2&&p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4,'167 accepted display changed.');
        require(p.state.jawEar159?.strength===1&&p.state.collarRoll158?.strength===1&&p.state.eyelash151?.strength===1&&p.state.blouseDrape154?.strength===1&&p.state.eyeContour147?.strength===1&&p.state.upperLipRelief140?.strength===1&&p.state.crownFacing141?.side===0&&p.state.crownFacing141?.shadowSide===2,'167 accepted164 head/cloth preparation missing.');
        const hair=p.headPivot.getObjectByName('Original reference-directed chestnut layered groom'),crown=hair.children[0],qa=window.crownReview167?.qa(),old=window.crown167Before,post=window.crown167After;
        p.startTurntable(false);let nonfinite=0,actualTriangles=0,attributeBytes=0,indexBytes=0;hair.traverse(m=>{if(!m.isMesh)return;actualTriangles+=m.geometry.index.count/3;indexBytes+=m.geometry.index.array.byteLength;for(const a of Object.values(m.geometry.attributes)){attributeBytes+=a.array.byteLength;for(const x of a.array)if(!Number.isFinite(x))nonfinite++;}});
        require(!nonfinite,'167 native emitted nonfinite attributes.');
        const protectedChanges=[];
        if(old){for(let i=0;i<5;i++){if(JSON.stringify(old.hair[i].attributes)!==JSON.stringify(post.hair[i].attributes))protectedChanges.push(old.hair[i].name+'/attributes');if(i!==0&&old.hair[i].index!==post.hair[i].index)protectedChanges.push(old.hair[i].name+'/index');}
          if(JSON.stringify(old.head)!==JSON.stringify(post.head))protectedChanges.push('prepared-head');if(JSON.stringify(old.maps)!==JSON.stringify(post.maps))protectedChanges.push('post100-maps');
          for(let i=0;i<5;i++){if(JSON.stringify(old.materials[i].settings)!==JSON.stringify(post.materials[i].settings)||JSON.stringify(old.materials[i].normalScale)!==JSON.stringify(post.materials[i].normalScale)||JSON.stringify(old.materials[i].specularColor)!==JSON.stringify(post.materials[i].specularColor))protectedChanges.push(old.materials[i].name+'/non-color-settings');if(!post.materials[i].color.every((x,k)=>x===old.materials[i].color[k]*[.65,.69,.75][k]))protectedChanges.push(old.materials[i].name+'/149-factor');}
          require(!protectedChanges.length,'167 changed protected prepared state: '+protectedChanges.join(', '));
        }
        if(spec.coarse){p.setScore(167,78);document.querySelector('#iteration-label').textContent='167 · COARSE STUDY';document.querySelector('#score-label').innerHTML='78 <small>BASELINE</small>';require(qa?.capture?.rows.length===1079&&qa.capture.detail.length===885&&qa.capture.wisps.length===484,'167 coarse slot registry changed.');const expected=1114888-qa.isolation.metrics.removedTriangles+(qa.application?qa.application.metrics.addedTriangles-qa.application.metrics.removedTriangles:0);require(actualTriangles===expected,'167 coarse triangle count does not match its independently retained index inventory.');}
        require(p.state.hairColor149.materials===(spec.strength?6:5),'167 tint was not applied to exactly five/six materials.');
        require(hair.userData.guidePlacement118.strength===.5&&hair.userData.diagonalFringe133.strength===1,'167 accepted lower/diagonal placement changed.');
        const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),b=>b.toString(16).padStart(2,'0')).join(''),maps={};
        for(const name of['map','alphaMap','normalMap']){const t=crown.material[name],im=t.image;maps[name]={name:t.name,width:im.width,height:im.height,channel:t.channel||0,sha256:await digest(im.data),colorSpace:t.colorSpace,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,generateMipmaps:t.generateMipmaps,flipY:t.flipY,matrixAutoUpdate:t.matrixAutoUpdate,matrix:t.matrix.toArray(),offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),rotation:t.rotation};}
        const newMesh=qa?.application?.mesh,mass=hair.children[1];
        if(newMesh)require(newMesh.material!==crown.material&&newMesh.material.map===mass.material.map&&!newMesh.material.alphaMap&&newMesh.material.normalMap===mass.material.normalMap&&newMesh.material.normalScale.equals(mass.material.normalScale)&&!newMesh.geometry.attributes.uv1&&!newMesh.material.userData.referenceCrownMicrocontrast&&newMesh.material.color.toArray().every((x,k)=>x===[.65,.69,.75][k]),'167 private material/tint/map ownership invalid.');
        if(newMesh){const A=newMesh.material,B=mass.material;for(const k of ['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','alphaTest','alphaToCoverage','side','transparent','opacity','depthWrite','vertexColors'])require(A[k]===B[k],'167 private MASS setting differs: '+k);require(A.specularColor.equals(B.specularColor),'167 private specularColor differs');}
        const privateMaterial=newMesh?{source:'Untinted original MASS clone; single149 tint; ordinary UV0 maps, no100 metadata',mapName:newMesh.material.map.name,normalName:newMesh.material.normalMap.name,normalScale:newMesh.material.normalScale.toArray(),settings:Object.fromEntries(['roughness','anisotropy','anisotropyRotation','specularIntensity','alphaTest','alphaToCoverage'].map(k=>[k,newMesh.material[k]])),color:newMesh.material.color.toArray()}:null;
        window.crown167NativeRefs={meshes:hair.children.slice(0,5).map(m=>({mesh:m,geometry:m.geometry,material:m.material,attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,{attribute:a,array:a.array}]))})),head:p.headPivot.getObjectByName('anatomical-head'),maps:Object.fromEntries(['map','alphaMap','normalMap'].map(k=>[k,crown.material[k]]))};
        p.setView('detail');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
        return{nativeWebGPU:true,nonfinite,actualTriangles,geometryMiB:(attributeBytes+indexBytes)/1048576,constructionMs:hair.userData.constructionMs,constructorCaptureMs:hair.userData.frontCapture167?.captureMs||0,helper:p.state.frontLocks167||null,reviewPreparationMs:p.state.reviewPreparation167Ms||0,heapMiB:performance.memory?performance.memory.usedJSHeapSize/1048576:null,protectedChanges,post100Maps:maps,post100UV1SHA256:await digest(crown.geometry.attributes.uv1.array),post100ColorSHA256:await digest(crown.geometry.attributes.color.array),isolation:qa?.isolation?.metrics||null,hairMetadata:{continuousCrownSheets:hair.userData.continuousCrownSheets,partialCrownSheets:hair.userData.partialCrownSheets||0,closedInsetScalp:hair.userData.closedInsetScalp},tint:p.state.hairColor149,privateMaterial,internal:p.state.internalRender,sourceBefore:old||null,sourceAfter:post||null};
      }, spec);
      await page.waitForTimeout(180);
      const capture = async view => {
        const file = `output/qa/crown167-coarse-${spec.name}-${view}.png`, b = await page.locator('#viewport-wrap').screenshot({ path: file, animations: 'disabled' }), item = { view, path: file, bytes: b.length, sha256: hash(b) };
        pngs.set(path.basename(file), b); c.captures.push(item); return item;
      };
      const view = async name => { await page.evaluate(async name => { const p=window.portrait;p.setView(name);p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone(); }, name); await page.waitForTimeout(180); return capture(name); };
      for (const name of spec.coarse ? ['front','detail','left','right','back'] : ['front','detail']) await view(name);
      if (spec.strength === null) accepted = c;
      if (spec.name === 'zero-control') {
        c.acceptedBaselineComparison = {};
        for (const name of ['front','detail']) c.acceptedBaselineComparison[name] = await comparePNG(page, c.captures.find(p=>p.view===name), accepted.captures.find(p=>p.view===name));
        c.post100MatchesAccepted = JSON.stringify(c.setup.post100Maps) === JSON.stringify(accepted.setup.post100Maps) && c.setup.post100UV1SHA256 === accepted.setup.post100UV1SHA256 && c.setup.post100ColorSHA256 === accepted.setup.post100ColorSHA256;
        if (!c.post100MatchesAccepted) throw Error('167 ZERO changed actual post100 data.');
      }
      if (spec.coarse) {
        c.junctionCamera = await page.evaluate(async fixed => {
          const p=window.portrait;p.setView('detail');const crown=p.headPivot.getObjectByName('Continuous parted crown with longitudinal fiber flow'),a=crown.geometry.attributes.position,i=7685+Math.round(.54*64)*129+Math.round(.85*128),target=p.camera.position.clone();
          if(fixed)target.set(...fixed);else{target.set(a.getX(i),a.getY(i)-.13,a.getZ(i));crown.localToWorld(target);}const direction=p.camera.position.clone().sub(p.controls.target);p.controls.target.copy(target);p.camera.position.copy(target).add(direction);p.camera.zoom=1.9;p.camera.lookAt(target);p.camera.updateProjectionMatrix();p.controls.update();p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();return{target:target.toArray(),zoom:1.9,baselineVertex:i};
        }, fixedJunctionTarget);
        fixedJunctionTarget ??= c.junctionCamera.target;
        await page.waitForTimeout(180); await capture('junction');
        await page.evaluate(async()=>{const p=window.portrait;p.setView('detail');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();});await page.waitForTimeout(180);
        c.coarseCameraRestoration = await comparePNG(page, await capture('restored-detail'), c.captures.find(p=>p.view==='detail'));
        c.release = await page.evaluate(async () => {
          const p=window.portrait,qa=window.crownReview167,refs=window.crown167NativeRefs,before=window.crown167Before,release=qa.release(),issues=[];
          // The restored original Uint16 CROWN may widen only during this
          // first ordinary upload. Check logical values after that render.
          p.setScore(164,78);p.setView('detail');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
          const after=await qa.snapshot(),logical=rows=>rows.map(({indexStorage,...r})=>r),indexStorageChanges=[];
          if(JSON.stringify(logical(before.hair))!==JSON.stringify(logical(after.hair)))issues.push('original geometry/index values');if(JSON.stringify(logical(before.head))!==JSON.stringify(logical(after.head)))issues.push('head geometry/index values');
          for(const key of['hair','head'])for(let i=0;i<before[key].length;i++){const a=before[key][i],b=after[key][i];if(JSON.stringify(a.indexStorage)!==JSON.stringify(b.indexStorage)){const allowed=a.indexStorage.arrayType==='Uint16Array'&&b.indexStorage.arrayType==='Uint32Array'&&a.index===b.index&&a.indexCount===b.indexCount;indexStorageChanges.push({mesh:a.name,before:a.indexStorage,after:b.indexStorage,exactLogicalValues:a.index===b.index,documentedEngineWidening:allowed});if(!allowed)issues.push(a.name+'/unexpected index storage change');}}
          for(const r of refs.meshes){if(r.mesh.geometry!==r.geometry||r.mesh.material!==r.material)issues.push(r.mesh.name+'/binding');for(const[k,a]of Object.entries(r.attributes))if(r.mesh.geometry.attributes[k]!==a.attribute||r.mesh.geometry.attributes[k].array!==a.array)issues.push(r.mesh.name+'/'+k+'/reference');}
          const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),b=>b.toString(16).padStart(2,'0')).join('');
          let row=0;for(const key of['hair','head'])for(const original of before[key]){const r=window.crown167OriginalIndices[row++],current=r.mesh.geometry.index;const originalBytesExact=await digest(r.array)===original.indexStorage.rawSHA256,sameAttribute=current===r.attribute,sameArray=current.array===r.array,allowedWidening=r.array instanceof Uint16Array&&current.array instanceof Uint32Array&&Array.from(r.array).every((x,i)=>x===current.array[i])&&r.array.length===current.array.length;if(!originalBytesExact||!sameAttribute||(!sameArray&&!allowedWidening))issues.push(original.name+'/original index identity or values');}
          const crown=refs.meshes[0].mesh;for(const[k,t]of Object.entries(refs.maps))if(crown.material[k]!==t)issues.push(k+'/texture reference');
          if(JSON.stringify(before.maps)!==JSON.stringify(after.maps))issues.push('post100 maps');
          return{...release,issues,indexStorageChanges,originalIndexAttributesRetained:window.crown167OriginalIndices.every(r=>r.mesh.geometry.index===r.attribute),originalDetachedIndexBytesExact:!issues.some(s=>s.includes('original index')),restoredTriangles:after.hair.reduce((s,m)=>s+m.indexCount/3,0),after};
        });
        await page.waitForTimeout(180);c.releasedBaselineComparison = await comparePNG(page, await capture('released-detail'), accepted.captures.find(p=>p.view==='detail'));
        if(c.release.issues.length||c.release.restoredTriangles!==1114888)throw Error('167 source restoration failed: '+c.release.issues.join(', '));
      }
      const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(350);c.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,frames);if(c.idleFrames)throw Error('167 introduced idle rendering.');
      if(c.errors.length)throw Error('167 browser error: '+JSON.stringify(c.errors));
      await save();
      console.log(JSON.stringify({case:c.name,nativeWebGPU:c.setup.nativeWebGPU,hairTriangles:c.setup.actualTriangles,geometryMiB:c.setup.geometryMiB,constructionMs:c.setup.constructionMs,helperMs:c.setup.helper?.elapsedMs||0,heapMiB:c.setup.heapMiB,baseline:c.acceptedBaselineComparison,coarseRestoration:c.coarseCameraRestoration,releasedBaseline:c.releasedBaselineComparison,errors:c.errors}));
    } finally { await page.close(); }
  }
  const pair=report.cases.filter(c=>c.coarse);report.post100PairExact=pair.every(c=>JSON.stringify(c.setup.post100Maps)===JSON.stringify(accepted.setup.post100Maps)&&c.setup.post100UV1SHA256===accepted.setup.post100UV1SHA256&&c.setup.post100ColorSHA256===accepted.setup.post100ColorSHA256);
  if(!report.post100PairExact)throw Error('167 native pair changed actual post100 data.');
  report.status='Complete; coarse visual decision pending';await save();
} catch (error) { report.status='Failed';report.failure=String(error?.stack||error);await save();throw error; }
finally { await browser.close(); }
