import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Read-only geometry study. All photo coordinates are the existing manually
// authored controls; no source-image pixels or features are analyzed.
const root=path.resolve(import.meta.dirname,'..'),qa=path.join(root,'output/qa');
await mkdir(qa,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const expectedMain='a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521';
if(hash(await readFile(path.join(root,'src/main.js')))!==expectedMain)throw Error('152 requires accepted149 source.');
const skin=await readFile(path.join(root,'src/reference-skin.js'),'utf8');
const table=name=>{const s=skin.match(new RegExp('const '+name+'\\s*=\\s*\\[([\\s\\S]*?)\\n\\];'));if(!s)throw Error('Missing existing table: '+name);return Array.from(s[1].matchAll(/\[([^\]]+)\]/g),m=>m[1].split(',').map(Number));};
const landmarks=table('landmarks'),manualRows=table('jawSkinRows');
if(landmarks.length!==35||manualRows.length!==8)throw Error('Manual controls changed.');
const report={iteration:152,acceptedIteration:149,score:78,readOnly:true,expectedMain,status:'Running',
  scope:'Actual projected continuous-head silhouette and conservative geometric occlusion at existing manual lower-face rows, aligned only by the two accepted iris centers. No geometry, albedo, camera or quality adoption.',
  limitations:['Existing skin-only atlas bounds are manual approximations, not independently measured silhouette truth.','The full projected head boundary is evaluated from its indexed triangles. Occlusion probes are slightly inward at sampled rows, not all-pixel silhouette certification.','Closer hair triangles are reported conservatively without alpha/cutout or A2C visibility evaluation. Native overlay inspection must decide whether that material is visibly covering the outline.','Matching two irises removes scale, roll and translation; it does not establish correct yaw, depth or anatomy.'],manualRows,cases:[],errors:[]};
const save=()=>writeFile(path.join(qa,'jaw-silhouette152-native.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
let page;
try{
  page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text().slice(0,1600));});
  await page.goto('http://127.0.0.1:8766/?backend=webgpu',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.portrait?.ready||(window.portrait&&!document.querySelector('#backend-gate').hidden),null,{timeout:60000});
  for(const view of ['front','detail']){
    const result=await page.evaluate(async({view,landmarks,manualRows})=>{
      const p=window.portrait,demand=(v,s)=>{if(!v)throw Error(s);};
      demand(p.ready&&p.renderer.backend?.isWebGPUBackend,'Native WebGPU unavailable. No fallback.');
      demand(p.state.iteration===149&&p.state.score===78&&p.state.eyeContour147?.applied,'Wrong accepted scene.');
      demand(p.renderer.toneMapping===7&&p.renderer.toneMappingExposure===1.4&&p.state.antialiasing===2,'Display changed.');
      document.querySelector('#jaw152-overlay')?.remove();p.setView(view);p.renderNow();await p.renderer.backend.device.queue.onSubmittedWorkDone();p.model.updateMatrixWorld(true);
      const started=performance.now(),head=p.model.getObjectByName('continuous-face'),neck=p.model.getObjectByName('neck-smooth-anatomical-surface');
      demand(head&&neck,'Expected head/neck absent.');
      const digest=async a=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength))),x=>x.toString(16).padStart(2,'0')).join('');
      const protectedBindings=[];p.model.traverse(m=>{if(m.isMesh)protectedBindings.push({mesh:m,geometry:m.geometry,material:m.material});});
      const protectedAttrs=[];for(const mesh of [head,neck])for(const[key,a]of [...Object.entries(mesh.geometry.attributes),['index',mesh.geometry.index]])if(a)protectedAttrs.push({mesh,key,a,array:a.array,version:a.version,hash:await digest(a)});
      const projected=world=>{const v=world.clone().project(p.camera);return[(v.x*.5+.5)*p.state.width,(.5-v.y*.5)*p.state.height,v.z];};
      const irisCenters=landmarks.slice(0,2).map(([x,y,px,py],i)=>{
        const candidates=[];p.model.traverse(m=>{if(m.isMesh&&m.name==='brown-iris-and-pupil')candidates.push(m);});
        const mesh=candidates.find(m=>Math.sign(m.geometry.attributes.uv.getX(0)-.5)===(i?1:-1)),g=mesh.geometry,uv=g.attributes.uv,pos=g.attributes.position,index=g.index,u=(x+1)/2,v=(y+1.25)/2.85;
        let found=null;
        for(let k=0;k<index.count;k+=3){
          const ids=[index.getX(k),index.getX(k+1),index.getX(k+2)],a=ids.map(j=>[uv.getX(j),uv.getY(j)]),den=(a[1][1]-a[2][1])*(a[0][0]-a[2][0])+(a[2][0]-a[1][0])*(a[0][1]-a[2][1]);if(Math.abs(den)<1e-18)continue;
          const b0=((a[1][1]-a[2][1])*(u-a[2][0])+(a[2][0]-a[1][0])*(v-a[2][1]))/den,b1=((a[2][1]-a[0][1])*(u-a[2][0])+(a[0][0]-a[2][0])*(v-a[2][1]))/den,b2=1-b0-b1;if(Math.min(b0,b1,b2)<-2e-6)continue;
          const q=mesh.position.clone().set(0,0,0);for(let j=0;j<3;j++){q.x+=[b0,b1,b2][j]*pos.getX(ids[j]);q.y+=[b0,b1,b2][j]*pos.getY(ids[j]);q.z+=[b0,b1,b2][j]*pos.getZ(ids[j]);}q.applyMatrix4(mesh.matrixWorld);found={photo:[px,py],world:q.toArray(),pixel:projected(q)};break;
        }
        demand(found,'Iris center interpolation failed.');return found;
      });
      const [ia,ib]=irisCenters,dx=ib.pixel[0]-ia.pixel[0],dy=ib.pixel[1]-ia.pixel[1],qx=ib.photo[0]-ia.photo[0],qy=ib.photo[1]-ia.photo[1],den=dx*dx+dy*dy,
        ar=(qx*dx+qy*dy)/den,ai=(qy*dx-qx*dy)/den,photoFromPixel=a=>[ia.photo[0]+ar*(a[0]-ia.pixel[0])-ai*(a[1]-ia.pixel[1]),ia.photo[1]+ai*(a[0]-ia.pixel[0])+ar*(a[1]-ia.pixel[1]),a[2]],
        pixelFromPhoto=a=>{const x=a[0]-ia.photo[0],y=a[1]-ia.photo[1],d=ar*ar+ai*ai;return[ia.pixel[0]+(ar*x+ai*y)/d,ia.pixel[1]+(-ai*x+ar*y)/d];};
      const cache=new Map();
      function data(mesh){
        if(cache.has(mesh))return cache.get(mesh);
        const g=mesh.geometry,a=g.attributes.position,out=new Float64Array(a.count*3),v=mesh.position.clone();
        for(let j=0;j<a.count;j++){v.fromBufferAttribute(a,j).applyMatrix4(mesh.matrixWorld);out.set(photoFromPixel(projected(v)),3*j);}
        const row={mesh,position:out,index:g.index,triangles:g.index.count/3};cache.set(mesh,row);return row;
      }
      const h=data(head),active=new Set(Array.from(h.index.array));
      let lowest=-1;for(const j of active)if(lowest<0||h.position[3*j+1]>h.position[3*lowest+1])lowest=j;
      const recordVertex=j=>({vertex:j,photo:Array.from(h.position.slice(3*j,3*j+2)),depth:h.position[3*j+2],local:head.position.clone().fromBufferAttribute(head.geometry.attributes.position,j).toArray(),world:head.position.clone().fromBufferAttribute(head.geometry.attributes.position,j).applyMatrix4(head.matrixWorld).toArray()});
      const scanYs=[...new Set([...manualRows.map(r=>r[0]),...Array.from({length:35},(_,j)=>590+j*5)])].sort((a,b)=>a-b),contours=[];
      for(const y of scanYs){let left=null,right=null;
        for(let t=0;t<h.index.count;t+=3){const ids=[h.index.getX(t),h.index.getX(t+1),h.index.getX(t+2)],ys=ids.map(j=>h.position[3*j+1]);if(y<Math.min(...ys)||y>Math.max(...ys))continue;
          for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],ay=h.position[3*a+1],by=h.position[3*b+1];if(Math.abs(by-ay)<1e-12)continue;const f=(y-ay)/(by-ay);if(f<-1e-10||f>1+1e-10)continue;
            const x=h.position[3*a]*(1-f)+h.position[3*b]*f,z=h.position[3*a+2]*(1-f)+h.position[3*b+2]*f,hit={x,y,depth:z,triangle:t/3,edge:[a,b],fraction:f};if(!left||x<left.x)left=hit;if(!right||x>right.x)right=hit;
          }
        }
        const manual=manualRows.find(r=>r[0]===y);contours.push({y,left,right,manual:manual?{left:manual[1],right:manual[2]}:null,residual:manual&&left?{left:left.x-manual[1],right:right.x-manual[2]}:null});
      }
      const probes=[];for(const r of contours.filter(r=>r.manual&&r.left))for(const side of ['left','right'])probes.push({row:r.y,side,photo:[r[side].x+(side==='left'?.25:-.25),r.y]});
      const lo=recordVertex(lowest);probes.push({row:lo.photo[1],side:'lowest-inward',photo:[lo.photo[0],lo.photo[1]-.25]});
      const candidateMeshes=protectedBindings.map(x=>x.mesh).filter(m=>{for(let q=m;q;q=q.parent)if(!q.visible)return false;return true;});
      function nearest(row,point){const p2=row.position,index=row.index;let best=null;
        for(let t=0;t<index.count;t+=3){const a=index.getX(t)*3,b=index.getX(t+1)*3,c=index.getX(t+2)*3,ax=p2[a],ay=p2[a+1],bx=p2[b],by=p2[b+1],cx=p2[c],cy=p2[c+1],x=point[0],y=point[1];if(x<Math.min(ax,bx,cx)||x>Math.max(ax,bx,cx)||y<Math.min(ay,by,cy)||y>Math.max(ay,by,cy))continue;
          const d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(d)<1e-14)continue;const u=((by-cy)*(x-cx)+(cx-bx)*(y-cy))/d,v=((cy-ay)*(x-cx)+(ax-cx)*(y-cy))/d,w=1-u-v;if(Math.min(u,v,w)<-1e-9)continue;const z=u*p2[a+2]+v*p2[b+2]+w*p2[c+2];if(!best||z<best.depth)best={mesh:row.mesh.name,triangle:t/3,depth:z,barycentric:[u,v,w]};
        }return best;
      }
      for(const mesh of candidateMeshes){const row=data(mesh);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(let j=0;j<row.position.length;j+=3){minX=Math.min(minX,row.position[j]);maxX=Math.max(maxX,row.position[j]);minY=Math.min(minY,row.position[j+1]);maxY=Math.max(maxY,row.position[j+1]);}
        for(const q of probes){if(q.photo[0]<minX||q.photo[0]>maxX||q.photo[1]<minY||q.photo[1]>maxY)continue;const hit=nearest(row,q.photo);if(!hit)continue;if(mesh===head)q.headHit=hit;if(mesh===neck)q.neckHit=hit;if(!q.nearestGeometricHit||hit.depth<q.nearestGeometricHit.depth)q.nearestGeometricHit=hit;}
      }
      for(const q of probes)q.headIsNearestGeometry=!!q.headHit&&q.nearestGeometricHit?.mesh===head.name;
      const atlasChinUV=[(landmarks[19][0]+1)/2,(landmarks[19][1]+1.25)/2.85],uv=head.geometry.attributes.uv,pos=head.geometry.attributes.position;let chin=-1,d2=Infinity;
      const front=new Set();for(const group of head.geometry.groups.filter(g=>g.materialIndex===0))for(let j=group.start;j<group.start+group.count;j++)front.add(head.geometry.index.getX(j));
      for(const j of front){const d=(uv.getX(j)-atlasChinUV[0])**2+(uv.getY(j)-atlasChinUV[1])**2;if(d<d2-1e-20||(Math.abs(d-d2)<1e-20&&(chin<0||pos.getZ(j)>pos.getZ(chin)))){d2=d;chin=j;}}
      const chinRecord=recordVertex(chin),chinProbe=[chinRecord.photo[0],chinRecord.photo[1]],chinHits=candidateMeshes.map(m=>nearest(data(m),chinProbe)).filter(Boolean).sort((a,b)=>a.depth-b.depth).slice(0,5);
      for(const o of protectedBindings)demand(o.mesh.geometry===o.geometry&&o.mesh.material===o.material,'Read-only binding changed.');for(const r of protectedAttrs){const a=r.key==='index'?r.mesh.geometry.index:r.mesh.geometry.getAttribute(r.key);demand(a===r.a&&a.array===r.array&&a.version===r.version&&await digest(a)===r.hash,'Read-only attribute changed.');}
      const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.id='jaw152-overlay';svg.setAttribute('viewBox',`0 0 ${p.state.width} ${p.state.height}`);Object.assign(svg.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'5'});
      const line=(pts,color,width)=>{const e=document.createElementNS(ns,'polyline');e.setAttribute('points',pts.map(pixelFromPhoto).map(x=>x.join(',')).join(' '));e.setAttribute('fill','none');e.setAttribute('stroke',color);e.setAttribute('stroke-width',width);svg.append(e);};
      line(manualRows.map(r=>[r[1],r[0]]),'#00a8b0',1.4);line(manualRows.map(r=>[r[2],r[0]]),'#00a8b0',1.4);
      for(const side of ['left','right'])line(contours.filter(r=>r[side]).map(r=>[r[side].x,r.y]),'#e84940',1);
      const label=document.createElementNS(ns,'text');label.setAttribute('x','24');label.setAttribute('y','74');label.setAttribute('fill','#133343');label.setAttribute('font-size','14');label.textContent='152 read-only: teal manual photo bounds / red head geometry';svg.append(label);document.querySelector('#viewport-wrap').append(svg);
      return{view,output:[p.state.width,p.state.height],irisCenters,similarity:{a:ar,b:ai,originPixel:ia.pixel,originPhoto:ia.photo},lowestProjectedHead:lo,frontAtlasChinControl:{...chinRecord,manualPhoto:landmarks[19].slice(2),uvDistance:Math.sqrt(d2),nearestGeometricHits:chinHits},contours,occlusionProbes:probes,protectedMeshBindings:protectedBindings.length,protectedHeadNeckAttributes:protectedAttrs.length,temporaryProjectionBytes:[...cache.values()].reduce((s,x)=>s+x.position.byteLength,0),studyMs:performance.now()-started,heapMiB:performance.memory?.usedJSHeapSize/1048576};
    },{view,landmarks,manualRows});
    const file='jaw-silhouette152-'+view+'-overlay.png',b=await page.locator('#viewport-wrap').screenshot({path:path.join(qa,file),animations:'disabled'});result.capture={file:'output/qa/'+file,bytes:b.length,sha256:hash(b)};report.cases.push(result);await save();console.log(JSON.stringify({view,lowestProjectedHead:result.lowestProjectedHead,manualRowResiduals:result.contours.filter(r=>r.manual),studyMs:result.studyMs,temporaryProjectionBytes:result.temporaryProjectionBytes}));
  }
  await page.evaluate(()=>document.querySelector('#jaw152-overlay')?.remove());
  if(report.errors.length)throw Error('Browser errors recorded.');report.status='Passed read-only projection and sampled geometric occlusion';await save();
}catch(error){report.status='Failed';report.failure=String(error?.stack||error);await save();throw error;}
finally{if(page)await page.close();await browser.close();}
