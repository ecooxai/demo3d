import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Read-only geometry ownership probe for the exposed near ear. This uses the
// accepted assembled133 scene; it does not modify geometry or infer image1 data.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa');
await mkdir(qa,{recursive:true});
const main=await readFile(path.join(root,'src/main.js'),'utf8');
if(createHash('sha256').update(main).digest('hex')!=='73d1b1589a6cb942353bd5d7301af47680e7e5510fe6f140b4aaa5c233004136')throw new Error('141 requires exact accepted133 source.');
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,1600));});
try{
 await page.goto('http://127.0.0.1:8766/?backend=webgpu',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.portrait?.ready,null,{timeout:60000});
 const report=await page.evaluate(async()=>{
  const p=window.portrait;
  if(!p.renderer.backend.isWebGPUBackend||p.state.width!==900||p.state.height!==1200||p.state.antialiasing!==2||p.renderer.toneMapping!==7||p.renderer.toneMappingExposure!==1.4||p.state.iteration!==133)throw new Error('141 unexpected accepted runtime.');
  const head=p.model.getObjectByName('anatomical-head'),hair=p.model.getObjectByName('Original reference-directed chestnut layered groom'),near=head.getObjectByName('left-ear');
  const ear=near?.getObjectByName('ear-continuous-anatomical-shell'),mass=hair?.getObjectByName('Overlapping layered S-wave hair around front back and shoulders');
  if(!ear?.isMesh||!mass?.isMesh)throw new Error('141 missing accepted near ear or MASS.');
  p.model.updateWorldMatrix(true,true);p.setView('detail');p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
  const inv=head.matrixWorld.clone().invert(),tmp=p.model.position.clone(),bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]},projected={min:[Infinity,Infinity],max:[-Infinity,-Infinity]};
  const ep=ear.geometry.getAttribute('position');
  for(let i=0;i<ep.count;i++){
   tmp.fromBufferAttribute(ep,i).applyMatrix4(ear.matrixWorld);const world=tmp.clone(),a=tmp.applyMatrix4(inv).toArray();
   a.forEach((v,k)=>{bounds.min[k]=Math.min(bounds.min[k],v);bounds.max[k]=Math.max(bounds.max[k],v);});
   world.project(p.camera);const xy=[(world.x*.5+.5)*900,(-world.y*.5+.5)*1200];xy.forEach((v,k)=>{projected.min[k]=Math.min(projected.min[k],v);projected.max[k]=Math.max(projected.max[k],v);});
  }
  const mp=mass.geometry.getAttribute('position'),guides=[];
  for(let id=58;id<=90;id+=4){
   const samples=[];
   for(let ring=0;ring<=60;ring++){
    const c=tmp.clone().set(0,0,0);
    for(let around=0;around<8;around++)c.add(tmp.fromBufferAttribute(mp,id*549+ring*9+around));
    c.multiplyScalar(1/8).applyMatrix4(mass.matrixWorld).applyMatrix4(inv);
    if(c.y>=bounds.min[1]-.15&&c.y<=bounds.max[1]+.22)samples.push({ring,head:c.toArray()});
   }
   guides.push({id,samples});
  }
  const center=tmp.clone().set((bounds.min[0]+bounds.max[0])*.5,(bounds.min[1]+bounds.max[1])*.5,(bounds.min[2]+bounds.max[2])*.5).applyMatrix4(head.matrixWorld);
  const records=[];p.model.traverse(o=>{if(o.isMesh)records.push({mesh:o,geometry:o.geometry,material:o.material,position:o.geometry.getAttribute('position'),normal:o.geometry.getAttribute('normal'),visible:o.visible});});
  window.earRoot141={center,records};
  p.setScore(141,77);
  return {iteration:141,acceptedSource:133,score:77,nativeWebGPU:true,earHeadBounds:bounds,earDetailPixelBounds:projected,nearFrontGuideCenters:guides,readOnlyGeometry:true};
 });
 report.captures=[];
 for(const view of ['ear']){
  await page.evaluate(async view=>{
   const p=window.portrait;p.setView('detail');
   if(view!=='detail'){
    const c=window.earRoot141.center,span=1.24,aspect=p.state.width/p.state.height;
    p.camera.left=-span*aspect/2;p.camera.right=span*aspect/2;p.camera.top=span/2;p.camera.bottom=-span/2;p.camera.zoom=1;p.camera.up.set(0,1,0);
    p.camera.position.copy(c).add(p.model.position.clone().set(view==='ear-oblique'?-5:0,0,8));p.controls.target.copy(c);p.camera.lookAt(c);p.camera.updateProjectionMatrix();p.controls.update();
   }
   p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();
  },view);
  await page.waitForTimeout(160);const f='ear-root141-rays-'+view+'.png';await page.locator('#viewport-wrap').screenshot({path:path.join(qa,f)});report.captures.push('output/qa/'+f);
 }

 report.manualRaySamples=await page.evaluate(()=>{
  const p=window.portrait,tmp=p.model.position.clone(),points=[[.434,.760],[.451,.803],[.450,.751],[.425,.740]],hits=points.map(point=>({point,hits:[]}));
  const names=new Set(['continuous-face','neck-smooth-anatomical-surface','ear-continuous-anatomical-shell','Overlapping layered S-wave hair around front back and shoulders','Continuous parted crown with longitudinal fiber flow']);
  p.model.traverse(mesh=>{
   if(!mesh.isMesh||!names.has(mesh.name))return;
   for(let o=mesh;o;o=o.parent)if(!o.visible)return;
   const g=mesh.geometry,pa=g.getAttribute('position'),idx=g.index,uv=g.getAttribute('uv'),color=g.getAttribute('color'),projected=new Float64Array(pa.count*3);
   for(let i=0;i<pa.count;i++){tmp.fromBufferAttribute(pa,i).applyMatrix4(mesh.matrixWorld).project(p.camera);const n=i*3;projected[n]=tmp.x*.5+.5;projected[n+1]=-.5*tmp.y+.5;projected[n+2]=tmp.z;}
   for(let k=0;k<idx.count;k+=3){
    const ia=idx.getX(k),ib=idx.getX(k+1),ic=idx.getX(k+2),a=ia*3,b=ib*3,c=ic*3,ax=projected[a],ay=projected[a+1],bx=projected[b],by=projected[b+1],cx=projected[c],cy=projected[c+1];
    const den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-14)continue;
    const group=g.groups.find(v=>k>=v.start&&k<v.start+v.count),mat=Array.isArray(mesh.material)?mesh.material[group?.materialIndex||0]:mesh.material;
    if((mat.side===0&&den>=0)||(mat.side===1&&den<=0))continue;
    for(const rec of hits){const[x,y]=rec.point;if(x<Math.min(ax,bx,cx)||x>Math.max(ax,bx,cx)||y<Math.min(ay,by,cy)||y>Math.max(ay,by,cy))continue;
     const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/den,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-9)continue;
     const bary=(at,ch)=>u*at.array[ia*at.itemSize+ch]+v*at.array[ib*at.itemSize+ch]+w*at.array[ic*at.itemSize+ch];
     rec.hits.push({mesh:mesh.name,parent:mesh.parent.name,triangle:k/3,guide:mesh.name.startsWith('Overlapping')?Math.floor(ia/549):null,depth:u*projected[a+2]+v*projected[b+2]+w*projected[c+2],material:mat.name,materialIndex:group?.materialIndex||0,frontFacing:den<0,color:color?Array.from({length:color.itemSize},(_,ch)=>bary(color,ch)):null,uv:uv?[bary(uv,0),bary(uv,1)]:null,materialColor:mat.color?.toArray(),alphaTest:mat.alphaTest,world:tmp.fromBufferAttribute(pa,ia).multiplyScalar(u).addScaledVector(p.model.position.clone().fromBufferAttribute(pa,ib),v).addScaledVector(p.model.position.clone().fromBufferAttribute(pa,ic),w).applyMatrix4(mesh.matrixWorld).toArray()});
    }
   }
  });
  for(const r of hits){r.hits.sort((a,b)=>a.depth-b.depth);r.totalHits=r.hits.length;r.hits=r.hits.slice(0,10);}return hits;
 });
 report.integrity=await page.evaluate(()=>{let exact=0;for(const r of window.earRoot141.records){if(r.mesh.geometry!==r.geometry||r.mesh.material!==r.material||r.geometry.getAttribute('position')!==r.position||r.geometry.getAttribute('normal')!==r.normal||r.mesh.visible!==r.visible)throw new Error('141 changed a model resource.');exact++;}return {originalMeshReferences:exact,heapMiB:performance.memory?.usedJSHeapSize/1048576};});
 report.errors=errors;if(errors.length)throw new Error(JSON.stringify(errors));
 await writeFile(path.join(qa,'ear-root141-rays-native-result.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({iteration:141,nativeWebGPU:report.nativeWebGPU,earHeadBounds:report.earHeadBounds,earDetailPixelBounds:report.earDetailPixelBounds,integrity:report.integrity,errors}));
}finally{await page.close();await browser.close();}
