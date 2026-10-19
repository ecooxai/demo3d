import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Read-only projection of the existing manually authored photo correspondences.
// This does not detect image features or treat atlas control points as new geometry truth.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa');
await mkdir(qa,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const expectedMain='2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a';
if(hash(await readFile(path.join(root,'src/main.js')))!==expectedMain)throw new Error('145 requires accepted141 main.');
const source=await readFile(path.join(root,'src/reference-skin.js'),'utf8');
const match=source.match(/const landmarks = \[([\s\S]*?)\n\];/);
if(!match)throw new Error('Missing existing manual photo correspondences.');
const landmarks=Array.from(match[1].matchAll(/\[([^\]]+)\]/g),m=>m[1].split(',').map(Number));
if(landmarks.length!==35||landmarks.some(row=>row.length!==4||row.some(x=>!Number.isFinite(x))))throw new Error('Unexpected manual correspondence table.');
const definitions=[
  [0,'near iris','brown-iris-and-pupil',-1],[1,'far iris','brown-iris-and-pupil',1],
  [2,'near outer canthus','sculpted-eyelids',-1],[3,'near inner canthus','sculpted-eyelids',-1],
  [4,'far inner canthus','sculpted-eyelids',1],[5,'far outer canthus','sculpted-eyelids',1],
  [6,'near upper aperture','sculpted-eyelids',-1],[7,'near lower aperture','sculpted-eyelids',-1],
  [8,'far upper aperture','sculpted-eyelids',1],[9,'far lower aperture','sculpted-eyelids',1],
  [10,'nose tip','continuous-face',0],[11,'nose bridge','continuous-face',0],
  [12,'near nasal wing','continuous-face',0],[13,'far nasal wing','continuous-face',0],
  [14,'mouth seam center','upper-lip',0],[15,'near mouth corner','upper-lip',0],
  [16,'far mouth corner','upper-lip',0],[17,'upper lip border','upper-lip',0],
  [18,'lower lip border','lower-lip',0],[19,'chin tip','continuous-face',0]
].map(([index,label,mesh,side])=>({index,label,mesh,side,canonical:landmarks[index].slice(0,2),photo:landmarks[index].slice(2)}));
const report={iteration:145,score:77,status:'Running',readOnly:true,expectedMain,
  referenceSkinSourceSHA256:hash(Buffer.from(source)),image1ColorSHA256:hash(await readFile(path.join(root,'reference/image1-color.jpg'))),
  scope:'Project existing manually authored atlas correspondences through actual accepted141 triangle surfaces. No source-image feature extraction, remapping, geometry change or camera adoption.',
  limitations:['The manual atlas correspondences approximate visible features. They are not independent anatomical measurements.','Rounded boundary controls within5e-6 UV of an existing vertex are reported explicitly with their UV offset; they are not triangle-interior hits.','A two-iris similarity removes global framing and roll only. Residuals can also reflect depth, yaw, hand placement and correspondence error.'],cases:[],errors:[]};
const save=()=>writeFile(path.join(qa,'likeness145-native.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
let page;
try{
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text().slice(0,1200));});
  await page.goto('http://127.0.0.1:8766/?backend=webgpu',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:60000});
  for(const view of ['front','detail']){
    const result=await page.evaluate(async({view,definitions})=>{
      const p=window.portrait;
      if(!p.ready||!p.renderer.backend?.isWebGPUBackend)throw new Error('Native WebGPU unavailable. No fallback.');
      if(p.state.iteration!==141||p.state.score!==77)throw new Error('Unexpected production state.');
      p.setView(view);p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();p.model.updateMatrixWorld(true);
      const started=performance.now(),points=[],frontVerticesByMesh=new Map();
      const project=world=>{const v=world.clone().project(p.camera);return[(v.x*.5+.5)*p.state.width,(.5-v.y*.5)*p.state.height];};
      for(const def of definitions){
        const candidates=[];p.model.traverse(o=>{if(o.isMesh&&o.name===def.mesh)candidates.push(o);});
        const mesh=candidates.find(o=>!def.side||Math.sign(o.geometry.getAttribute('uv').getX(0)-.5)===def.side);
        if(!mesh)throw new Error('Missing landmark mesh: '+def.label);
        const g=mesh.geometry,uv=g.getAttribute('uv'),pos=g.getAttribute('position'),idx=g.index,
          u=(def.canonical[0]+1)/2,v=(def.canonical[1]+1.25)/2.85;
        // The continuous face has separate front/rear material groups. Limit
        // both triangle and rounded-boundary queries to its visible front.
        const groups=def.mesh==='continuous-face'?g.groups.filter(x=>x.materialIndex===0):[{start:0,count:idx.count}];
        let eligible=null;
        if(def.mesh==='continuous-face'){
          eligible=frontVerticesByMesh.get(mesh);
          if(!eligible){eligible=new Set();for(const group of groups)for(let j=group.start;j<group.start+group.count;j++)eligible.add(idx.getX(j));frontVerticesByMesh.set(mesh,eligible);}
        }
        let best=null,nearestUV=Infinity,nearestIndex=-1,hits=0;
        for(let j=0;j<uv.count;j++){
          if(eligible&&!eligible.has(j))continue;
          const d=(uv.getX(j)-u)**2+(uv.getY(j)-v)**2;
          if(d<nearestUV-1e-20||(Math.abs(d-nearestUV)<1e-20&&(nearestIndex<0||pos.getZ(j)>pos.getZ(nearestIndex)))){nearestUV=d;nearestIndex=j;}
        }
        for(const group of groups)for(let j=group.start;j<group.start+group.count;j+=3){
          const ia=idx.getX(j),ib=idx.getX(j+1),ic=idx.getX(j+2),
            ax=uv.getX(ia),ay=uv.getY(ia),bx=uv.getX(ib),by=uv.getY(ib),cx=uv.getX(ic),cy=uv.getY(ic),
            den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);
          if(Math.abs(den)<1e-18)continue;
          const a=((by-cy)*(u-cx)+(cx-bx)*(v-cy))/den,b=((cy-ay)*(u-cx)+(ax-cx)*(v-cy))/den,c=1-a-b;
          if(Math.min(a,b,c)<-2e-6||Math.max(a,b,c)>1+2e-6)continue;
          const local=mesh.position.clone().set(a*pos.getX(ia)+b*pos.getX(ib)+c*pos.getX(ic),a*pos.getY(ia)+b*pos.getY(ib)+c*pos.getY(ic),a*pos.getZ(ia)+b*pos.getZ(ib)+c*pos.getZ(ic));
          const world=local.clone().applyMatrix4(mesh.matrixWorld);hits++;
          if(!best||local.z>best.local[2])best={method:'triangle UV interpolation',triangle:j/3,vertices:[ia,ib,ic],barycentric:[a,b,c],local:local.toArray(),world:world.toArray(),pixel:project(world)};
        }
        const nearestLocal=mesh.position.clone().fromBufferAttribute(pos,nearestIndex),nearest=nearestLocal.clone().applyMatrix4(mesh.matrixWorld);
        const nearestRecord={index:nearestIndex,uv:[uv.getX(nearestIndex),uv.getY(nearestIndex)],uvOffset:[uv.getX(nearestIndex)-u,uv.getY(nearestIndex)-v],uvDistance:Math.sqrt(nearestUV),local:nearestLocal.toArray(),world:nearest.toArray(),pixel:project(nearest)};
        if(!best&&nearestUV<=25e-12)best={method:'existing rounded-boundary UV vertex',vertex:nearestIndex,uvTolerance:5e-6,uvOffset:nearestRecord.uvOffset,local:nearestLocal.toArray(),world:nearest.toArray(),pixel:project(nearest)};
        points.push({...def,uv:[u,v],hits,covered:hits>0,matched:!!best,surface:best,nearestUVVertex:nearestRecord});
      }
      return{view,output:[p.state.width,p.state.height],nativeWebGPU:true,camera:{position:p.camera.position.toArray(),target:p.controls.target.toArray(),frustum:[p.camera.left,p.camera.right,p.camera.top,p.camera.bottom],zoom:p.camera.zoom},points,projectionMs:performance.now()-started,heapMiB:performance.memory?.usedJSHeapSize/1048576};
    },{view,definitions});
    const a=result.points[0],b=result.points[1];
    if(!a.covered||!b.covered)throw new Error('Actual iris centers are not in their mesh UV domain.');
    const pa=a.surface.pixel,pb=b.surface.pixel,qa0=a.photo,qb=b.photo,
      dx=pb[0]-pa[0],dy=pb[1]-pa[1],qx=qb[0]-qa0[0],qy=qb[1]-qa0[1],d=dx*dx+dy*dy,
      ar=(qx*dx+qy*dy)/d,ai=(qy*dx-qx*dy)/d;
    result.irisSimilarityToOriginalPhoto={a:ar,b:ai,scale:Math.hypot(ar,ai),rotationDegrees:Math.atan2(ai,ar)*180/Math.PI,originProjected:pa,originPhoto:qa0};
    for(const point of result.points)if(point.surface){
      const [x,y]=point.surface.pixel,sx=x-pa[0],sy=y-pa[1],mapped=[qa0[0]+ar*sx-ai*sy,qa0[1]+ai*sx+ar*sy];
      point.irisAlignedPhoto=mapped;point.residualPhotoPixels=[mapped[0]-point.photo[0],mapped[1]-point.photo[1]];
    }
    report.cases.push(result);await save();
    console.log(JSON.stringify({view,covered:result.points.filter(x=>x.covered).length,matched:result.points.filter(x=>x.matched).length,total:result.points.length,projectionMs:result.projectionMs,irisSimilarityToOriginalPhoto:result.irisSimilarityToOriginalPhoto,residuals:result.points.map(x=>({label:x.label,method:x.surface?.method,delta:x.residualPhotoPixels,nearestUVDistance:x.nearestUVVertex.uvDistance}))}));
  }
  if(report.errors.length)throw new Error('Browser errors recorded.');
  report.status='Passed';await save();
}catch(error){report.status='Failed';report.failure=String(error?.stack||error);await save();throw error;}
finally{if(page)await page.close();await browser.close();}
