import {chromium} from 'playwright';
import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Root-only native comparison. One fresh page per fixed mode avoids replacing
// live geometry or disturbing the accepted cornea/transmission render path.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa'),digest=a=>createHash('sha256').update(a).digest('hex');
await mkdir(qa,{recursive:true});
const main=await readFile(path.join(root,'src/main.js'),'utf8'),frozen=await readFile(path.join(root,'src/hair-groom.js'),'utf8');
if(digest(main)!=='2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a')throw Error('144 requires the frozen accepted141 main.');
if(digest(frozen)!=='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d')throw Error('144 requires the unchanged133 groom.');
let groom=await readFile(path.join(root,'review/hair-groom-candidate144.js'),'utf8');
const groomHash=digest(groom),marker='createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1})';
if(main.split(marker).length!==2)throw Error('144 expected one live accepted groom constructor.');
const rawMarker='m.receiveShadow=true;return m;';if(groom.split(rawMarker).length!==2)throw Error('144 raw geometry capture marker changed.');
// Only3731 raw-Y entries are retained by the QA bundle, so the native lower
// guard uses the real constructor data rather than an inferred posed height.
groom=groom.replace(rawMarker,`m.receiveShadow=true;
 const qaRanges144=name==='Overlapping layered S-wave hair around front back and shoulders'?[[75762,76311]]:name==='Independent fine crown lengths and silhouette strands'?[[317086,320218],[610094,610144]]:[];
 if(qaRanges144.length){m.userData.rawY144=[];for(const[a,bound]of qaRanges144)for(let i=a;i<bound;i++)m.userData.rawY144.push([i,Math.fround(b.p[i*3+1])]);}
 return m;`);
const entry=main.replace(marker,"createGroomHair({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,nearEar144:Number(new URLSearchParams(location.search).get('ear144')||0)})")+
 "\nimport * as geometry144 from '../review/near-ear144-geometry.mjs';\nwindow.geometry144=geometry144;\n";
const bundle=path.join(qa,'app-near-ear144.js');
await build({stdin:{contents:entry,resolveDir:path.join(root,'src'),sourcefile:'main-near-ear144.js',loader:'js'},plugins:[{name:'isolated-existing-ear-route144',setup(builder){builder.onLoad({filter:/[/\\]src[/\\]hair-groom\.js$/},()=>({contents:groom,loader:'js',resolveDir:path.join(root,'src')}));}}],bundle:true,format:'iife',target:['es2022'],minify:true,loader:{'.jpg':'dataurl'},outfile:bundle,logLevel:'silent'});
const report={iteration:144,score:77,acceptedSource:141,status:'Running',mainSHA256:digest(main),frozenGroomSHA256:digest(frozen),candidateGroomSHA256:groomHash,cases:[],browserErrors:[]};
const reportPath=path.join(qa,'near-ear144-native.json'),save=()=>writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
let page;
try{
 for(const strength of[0,1]){
  const result={strength,status:'Running',captures:[]};report.cases.push(result);await save();
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.browserErrors.push({strength,type:'pageerror',message:e.message}));
  page.on('console',m=>{if(m.type()==='error')report.browserErrors.push({strength,type:'console',message:m.text().slice(0,1800)});});
  try{
   await page.route('**/app.js',route=>route.fulfill({path:bundle,contentType:'text/javascript'}));
   await page.goto(`http://127.0.0.1:8766/?backend=webgpu&ear144=${strength}`,{waitUntil:'networkidle'});
   await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:60000});
   result.setup=await page.evaluate(async({strength,baselineMass,baselineFine})=>{
    const p=window.portrait,demand=(v,m)=>{if(!v)throw Error(m);};
    demand(p.ready&&p.renderer.backend?.isWebGPUBackend,'Native WebGPU unavailable; no fallback is allowed.');
    demand(p.state.width===900&&p.state.height===1200&&p.state.antialiasing===2,'144 output settings changed.');
    demand(p.renderer.domElement.width===900&&p.renderer.domElement.height===1200,'144 actual output canvas dimensions changed.');
    demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4,'144 accepted display changed.');
    demand(p.state.iteration===141&&p.state.score===77,'144 accepted iteration/score changed.');
    demand(p.state.mouthContinuity130?.strength===1&&p.state.upperLipRelief140?.strength===1,'144 accepted lip preparation missing.');
    const hair=p.model.getObjectByName('Original reference-directed chestnut layered groom'),head=p.model.getObjectByName('anatomical-head'),ear=head?.getObjectByName('left-ear')?.getObjectByName('ear-continuous-anatomical-shell');
    const mass=hair?.children[1],detail=hair?.children[2],crown=hair?.children[0];
    demand(hair&&ear?.isMesh&&mass?.isMesh&&detail?.isMesh,'144 required original geometry missing.');
    demand(crown.material.side===0&&crown.material.shadowSide===2&&mass.material.side===2&&crown.material!==mass.material,'144 accepted141 crown isolation changed.');
    demand(hair.userData.nearEarRoute144?.strength===strength,'144 selected mode was not applied.');
    if(strength)demand(hair.userData.nearEarRoute144.regularRibbons===54&&JSON.stringify(hair.userData.nearEarRoute144.flyawaySlots)==='[40]','144 dependency population changed.');
    p.setScore(144,77);p.setView('front');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
    const fingerprint=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength))),v=>v.toString(16).padStart(2,'0')).join('');
    const pixels=t=>t.image?.data?.buffer?t.image.data:t.image?.getContext?t.image.getContext('2d',{willReadFrequently:true}).getImageData(0,0,t.image.width,t.image.height).data:null;
    const sampler=t=>JSON.stringify({channel:t.channel,colorSpace:t.colorSpace,flipY:t.flipY,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,anisotropy:t.anisotropy,generateMipmaps:t.generateMipmaps,premultiplyAlpha:t.premultiplyAlpha,unpackAlignment:t.unpackAlignment,offset:t.offset.toArray(),repeat:t.repeat.toArray(),center:t.center.toArray(),rotation:t.rotation,matrix:t.matrix.toArray()});
    const materials=new Map(),textures=new Map(),attrs=[],objects=[],parts=[],protectedSegments=[],lower=[],disposals={geometry:0,material:0,texture:0};
    const ranges=m=>m===mass?[[75762,76311]]:m===detail?[[317086,320218],[610094,610144]]:[];
    let number=0,nonfinite=0,normalError=0;
    const meshList=[];p.model.traverse(o=>{if(o.isMesh)meshList.push(o);});
    for(const mesh of meshList){
     const g=mesh.geometry,moving=ranges(mesh),label=`${number++}:${mesh.parent?.name}/${mesh.name}`,part={label,vertices:g.attributes.position.count,index:null,attributes:{}};
     objects.push({mesh,geometry:g,material:mesh.material,visible:mesh.visible,castShadow:mesh.castShadow,receiveShadow:mesh.receiveShadow});
     g.addEventListener('dispose',()=>disposals.geometry++);
     for(const [name,a]of[...Object.entries(g.attributes),['index',g.index]])if(a){
      const hash=await fingerprint(a.array);attrs.push({label:`${label}.${name}`,geometry:g,name,attribute:a,array:a.array,version:a.version,hash});
      if(name==='index')part.index={hash,count:a.count,type:a.array.constructor.name};
      else if(!moving.length||!['position','normal'].includes(name))part.attributes[name]={hash,itemSize:a.itemSize,count:a.count,type:a.array.constructor.name};
     }
     if(moving.length){
      let previous=0;for(const [a,b]of[...moving,[g.attributes.position.count,g.attributes.position.count]]){
       if(a>previous)for(const key of['position','normal'])protectedSegments.push({label,key,from:previous,to:a,hash:await fingerprint(g.attributes[key].array.subarray(previous*3,a*3))});previous=b;
      }
      const entries=mesh.userData.rawY144;demand(entries?.length===moving.reduce((s,[a,b])=>s+b-a,0),'144 native raw-Y ownership capture missing.');
      const indices=entries.filter(([,y])=>y<=-1.05).map(([i])=>i),record={label,indices};
      for(const key of['position','normal']){const values=new Float32Array(indices.length*3),a=g.attributes[key];indices.forEach((i,j)=>values.set(a.array.subarray(i*3,i*3+3),j*3));record[key]=await fingerprint(values);}lower.push(record);
      delete mesh.userData.rawY144;
     }
     const position=g.attributes.position,normal=g.attributes.normal;
     for(let i=0;i<position.count;i++){const length=Math.hypot(normal.getX(i),normal.getY(i),normal.getZ(i));if(!Number.isFinite(position.getX(i)+position.getY(i)+position.getZ(i)+length))nonfinite++;if(length)normalError=Math.max(normalError,Math.abs(length-1));}
     for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])if(!materials.has(material)){
      const textureSlots=Object.fromEntries(Object.entries(material).filter(([,v])=>v?.isTexture));
      const settings=JSON.stringify(Object.fromEntries(['roughness','metalness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','alphaTest','alphaToCoverage','side','shadowSide','transparent','depthWrite','opacity','forceSinglePass','clearcoat','clearcoatRoughness','sheen','transmission','ior','thickness','vertexColors','toneMapped'].map(k=>[k,material[k]]).concat(['color','specularColor','sheenColor','emissive','normalScale'].map(k=>[k,material[k]?.toArray?.()]))));
      materials.set(material,{label:`${label}.material${materials.size}`,settings,textureSlots});material.addEventListener('dispose',()=>disposals.material++);
      for(const [slot,t]of Object.entries(textureSlots))if(!textures.has(t)){
       const data=pixels(t);demand(data,'144 unexpected unreadable source texture: '+label+'.'+slot);
       textures.set(t,{label:`${label}.${slot}`,source:t.source,image:t.image,version:t.version,sourceVersion:t.source.version,settings:sampler(t),hash:await fingerprint(data),width:t.image.width,height:t.image.height});t.addEventListener('dispose',()=>disposals.texture++);
      }
     }
     parts.push(part);
    }
    demand(nonfinite===0&&normalError<2e-5,'144 invalid native positions or normals.');
    p.model.updateWorldMatrix(true,true);const inverse=head.matrixWorld.clone().invert(),v=p.model.position.clone();
    const posed=(mesh)=>{const a=mesh.geometry.attributes.position,out=new Float64Array(a.count*3);for(let i=0;i<a.count;i++){v.fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inverse);out.set([v.x,v.y,v.z],i*3);}return out;};
    const ep=posed(ear),mp=posed(mass),dp=posed(detail),bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
    for(let i=0;i<ep.length;i+=3)for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],ep[i+k]);bounds.max[k]=Math.max(bounds.max[k],ep[i+k]);}
    const center=v.set(...bounds.min.map((x,k)=>(x+bounds.max[k])*.5)).applyMatrix4(head.matrixWorld).clone(),util=window.geometry144;
    const obstacle=util.triangleSoup144(ep,ear.geometry.index.array),massTriangles=util.triangleSoup144(mp,mass.geometry.index.array,{from:138*960,to:139*960,minY:-.60,maxY:.58});
    const fineIndex=[],sourceIndex=detail.geometry.index.array;for(let i=0;i<sourceIndex.length;i+=3){const q=sourceIndex[i];if((q>=317086&&q<320218)||(q>=610094&&q<610144))fineIndex.push(q,sourceIndex[i+1],sourceIndex[i+2]);}
    const clearance={mass:util.surfaceClearance144(massTriangles,obstacle),fine:util.surfaceClearance144(util.triangleSoup144(dp,fineIndex,{minY:-.60,maxY:.58}),obstacle)};
    const massSweepPosition=Array.from(mp.subarray(75762*3,76311*3));
    const orientation=baselineMass?util.sweepOrientation144(baselineMass,massSweepPosition,Array.from(mass.geometry.index.array.subarray(132480*3,133440*3),i=>i-75762)):null;
    const fineSweepPosition=[...dp.subarray(317086*3,320218*3),...dp.subarray(610094*3,610144*3)];
    const fineOrientation=baselineFine?util.ribbonOrientation144(baselineFine,fineSweepPosition,fineIndex.map(i=>i<320218?i-317086:3132+i-610094)):null;
    const selfIntersection=util.sweepSelfIntersections144(massTriangles,{firstTriangle:132480});
    if(strength){demand(clearance.mass.intersectionPairs===0&&clearance.mass.minimumDistance>.001,'144 actual native MASS/ear clearance failed.');demand(clearance.fine.intersectionPairs===0&&clearance.fine.minimumDistance>.0005,'144 actual native fine/ear clearance failed.');}
    if(strength)demand(orientation?.newNegative===0&&orientation.afterNegative===0&&orientation.minimumAreaRatio>.20&&selfIntersection.intersectionPairs===0,'144 actual native swept triangle orientation/self-intersection failed.');
    if(strength)demand(fineOrientation?.newFoldedQuads===0&&fineOrientation.minimumAreaRatio>.20&&fineOrientation.minimumNormalAgreement>0,'144 actual native ribbon triangle orientation failed.');
    const cached={mouth130:p.state.mouthContinuity130,upper140:p.state.upperLipRelief140,crown100:p.state.referenceCrown,crown141:p.state.crownFacing141};
    window.audit144={fingerprint,pixels,sampler,materials,textures,attrs,objects,disposals,cached,center};
    return{nativeWebGPU:true,output:[p.state.width,p.state.height],aa:p.state.antialiasing,toneMapping:p.renderer.toneMapping,exposure:p.renderer.toneMappingExposure,
     route:hair.userData.nearEarRoute144,constructionMs:hair.userData.constructionMs,geometryMiB:hair.userData.geometryMiB,parts,protectedSegments,lower,nonfinite,normalError,
     earHeadBounds:bounds,clearance,orientation,fineOrientation,selfIntersection,massSweepPosition,fineSweepPosition,materialSettings:[...materials.values()].map(r=>({label:r.label,settings:r.settings,slots:Object.keys(r.textureSlots)})),textureImages:[...textures.values()].map(({label,hash,width,height,settings})=>({label,hash,width,height,settings})),
     snapshotCounts:{objects:objects.length,attributes:attrs.length,materials:materials.size,textures:textures.size},heapMiB:performance.memory?.usedJSHeapSize/1048576};
   },{strength,baselineMass:strength?report.cases[0].setup.massSweepPosition:null,baselineFine:strength?report.cases[0].setup.fineSweepPosition:null});
   if(strength){
    const baseline=report.cases[0].setup;
    for(const key of['parts','protectedSegments','lower','materialSettings','textureImages','earHeadBounds'])if(JSON.stringify(result.setup[key])!==JSON.stringify(baseline[key]))throw Error('144 changed protected native '+key);
   }
   for(const view of['front','detail','left','right','back','ear','ear-oblique']){
    const settings=await page.evaluate(async view=>{
     const p=window.portrait;p.setView(view.startsWith('ear')?'detail':view);
     if(view.startsWith('ear')){const c=window.audit144.center,span=1.24,aspect=p.state.width/p.state.height;p.camera.left=-span*aspect/2;p.camera.right=span*aspect/2;p.camera.top=span/2;p.camera.bottom=-span/2;p.camera.zoom=1;p.camera.up.set(0,1,0);p.camera.position.copy(c).add(p.model.position.clone().set(view==='ear-oblique'?-5:0,0,8));p.controls.target.copy(c);p.camera.lookAt(c);p.camera.updateProjectionMatrix();p.controls.update();}
     p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
     return{camera:{position:p.camera.position.toArray(),target:p.controls.target.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom},internalRender:p.state.internalRender,cpuSubmissionMs:p.state.renderMs};
    },view);
    const file=`near-ear144-${strength}-${view}.png`,bytes=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});
    result.captures.push({view,...settings,file:'output/qa/'+file,bytes:bytes.length,sha256:digest(bytes)});await save();
   }
   result.integrity=await page.evaluate(async()=>{
    const s=window.audit144,p=window.portrait,demand=(v,m)=>{if(!v)throw Error(m);};
    const cached={mouth130:p.state.mouthContinuity130,upper140:p.state.upperLipRelief140,crown100:p.state.referenceCrown,crown141:p.state.crownFacing141};
    for(const [k,v]of Object.entries(s.cached))demand(cached[k]===v,'144 cached preparation repeated: '+k);
    for(const r of s.objects)demand(r.mesh.geometry===r.geometry&&r.mesh.material===r.material&&r.mesh.visible===r.visible&&r.mesh.castShadow===r.castShadow&&r.mesh.receiveShadow===r.receiveShadow,'144 original object bindings/flags changed.');
    for(const r of s.attrs){const a=r.name==='index'?r.geometry.index:r.geometry.getAttribute(r.name);demand(a===r.attribute&&a.array===r.array&&a.version===r.version&&await s.fingerprint(a.array)===r.hash,'144 original attribute changed during views: '+r.label);}
    for(const [m,r]of s.materials)for(const [k,v]of Object.entries(r.textureSlots))demand(m[k]===v,'144 source material texture binding changed: '+r.label+'.'+k);
    for(const [t,r]of s.textures)demand(t.source===r.source&&t.image===r.image&&t.version===r.version&&t.source.version===r.sourceVersion&&s.sampler(t)===r.settings&&await s.fingerprint(s.pixels(t))===r.hash,'144 original image/sampler changed during views: '+r.label);
    demand(s.disposals.geometry===0&&s.disposals.material===0&&s.disposals.texture===0,'144 disposed original live resources.');
    return{cachedResults:Object.keys(cached).length,attributeBuffers:s.attrs.length,materialBindings:s.materials.size,textureImages:s.textures.size,sourceReferencesAndBytesExact:true,disposals:s.disposals,heapMiB:performance.memory?.usedJSHeapSize/1048576};
   });
   const frames=await page.evaluate(()=>window.portrait.state.renderedFrames);await page.waitForTimeout(450);
   result.idleFrames=await page.evaluate(n=>window.portrait.state.renderedFrames-n,frames);if(result.idleFrames!==0)throw Error('144 added idle rendering.');
   if(report.browserErrors.some(e=>e.strength===strength))throw Error('144 browser errors recorded.');
   result.status='Passed';await save();console.log(JSON.stringify({strength,status:result.status,constructionMs:result.setup.constructionMs,route:result.setup.route,clearance:{mass:result.setup.clearance.mass.minimumDistance,fine:result.setup.clearance.fine.minimumDistance},integrity:result.integrity,idleFrames:result.idleFrames}));
  }finally{await page.close();page=null;}
 }
 report.status='Passed';await save();
}catch(error){report.status='Failed';report.failure=String(error?.stack||error);await save();throw error;}
finally{if(page)await page.close();await browser.close();}
