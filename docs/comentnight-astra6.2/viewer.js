import {initRenderer} from './renderer.mjs';
import {buildSkyline} from './skyline.mjs';
import {buildRooftop} from './rooftop.mjs';

const $=id=>document.getElementById(id);
// Portrait leaves open sky between the hair silhouette and the twin comet paths. The landscape hero preserves the wide-reference camera.
const portraitHero={eye:[.18,1.465,4],target:[-.484,1.859,-1.2],fovY:55,caption:'The observer and bicycle anchor a vertical study of the comet and the city.'};
const presets=[
 {id:'hero',name:'Hero',caption:'The observer, the city, and the comet share one sightline.',eye:[0,1.7,4.6],target:[0,2.7,-1.2],fovY:48},
 {id:'west',name:'West · bicycle',caption:'A low three-quarter study from the bicycle side of the rooftop.',eye:[-2.8,1.45,3.2],target:[-.3,1.45,-.65],fovY:53},
 {id:'east',name:'East · utility hut',caption:'An oblique view past the utility hut toward the skyline.',eye:[1.8,2.05,3.45],target:[-.35,1.6,-1.05],fovY:55},
 {id:'reverse',name:'Reverse · fence',caption:'A reverse angle across the fence, looking back toward the observer.',eye:[-3.3,2.6,-1.9],target:[.1,1.1,.35],fovY:48}
];
const sizes={studio:[1200,900,'Studio'],'480':[854,480,'480p'],'1280':[1280,720,'720p'],'1080':[1920,1080,'1080p'],'2k':[2048,1080,'DCI 2K'],'4k':[3840,2160,'UHD 4K']};
let canvas=$('artwork'),renderer=null,backend=null,attempt=0,starting=false,sceneCache=null,lastError='',frameCount=0;
let width=900,height=1200,orientationMode='portrait',active=0,cam,changed=false,pointers=new Map(),gesture=null;
const motionSetting=matchMedia('(prefers-reduced-motion: reduce)');
let motion=!motionSetting.matches,motionOverride=false,t=0,last=null,raf=0,needsDraw=true;
const limit=(v,a,b)=>Math.min(b,Math.max(a,v));
const magnitude=d=>Math.hypot(...d);
const eye=()=>{let h=cam.radius*Math.cos(cam.pitch);return [cam.target[0]+h*Math.sin(cam.yaw),cam.target[1]+cam.radius*Math.sin(cam.pitch),cam.target[2]+h*Math.cos(cam.yaw)]};
function cameraFrame(){return {eye:eye(),target:[...cam.target],up:[0,1,0],fovY:cam.fovY,time:t,width,height}}
const poseButtons=presets.map((p,i)=>{const b=document.createElement('button');b.className='pose';b.type='button';b.dataset.pose=p.id;const ix=document.createElement('span');ix.className='index';ix.textContent=String(i+1).padStart(2,'0');const n=document.createElement('span');n.textContent=p.name;const m=document.createElement('span');m.className='mark';m.setAttribute('aria-hidden','true');b.append(ix,n,m);b.addEventListener('click',()=>setPose(i));$('poses').append(b);return b});
function setPose(which){const i=typeof which==='string'?presets.findIndex(p=>p.id===which):which;if(!Number.isInteger(i)||!presets[i])return false;
 active=i;const p=i===0&&orientationMode==='portrait'?{...presets[0],...portraitHero}:presets[i];let d=p.eye.map((x,k)=>x-p.target[k]),r=magnitude(d);cam={target:[...p.target],radius:r,yaw:Math.atan2(d[0],d[2]),pitch:Math.asin(d[1]/r),fovY:p.fovY};changed=false;poseButtons.forEach((b,j)=>{b.setAttribute('aria-pressed',String(j===i));b.lastChild.textContent=j===i?'•':''});$('caption').textContent=p.caption;$('plate').textContent='PLATE '+String(i+1).padStart(2,'0')+' / '+p.name.toUpperCase();requestDraw();return true}
function tweak(dx=0,dy=0,scale=1){cam.yaw-=dx;cam.pitch=limit(cam.pitch+dy,-1.40,1.40);cam.radius=limit(cam.radius*scale,.70,28);changed=true;requestDraw()}
function resetPointers(){pointers.clear();gesture=null}
function geometry(){const pts=[...pointers.values()];if(!pts.length)return null;if(pts.length===1)return {x:pts[0][0],y:pts[0][1],d:0,count:1};let a=pts[0],b=pts[1];return {x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,d:Math.hypot(a[0]-b[0],a[1]-b[1]),count:2}}
function attachInput(c){
 c.addEventListener('pointerdown',e=>{if(panMode||(e.pointerType==='mouse'&&e.button!==0))return;c.focus({preventScroll:true});c.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);gesture=geometry()});
 c.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);let g=geometry();if(gesture&&g.count===gesture.count){let factor=Math.PI/Math.max(250,Math.min(c.clientWidth,c.clientHeight));tweak((g.x-gesture.x)*factor,(g.y-gesture.y)*factor,g.count===2&&g.d>2&&gesture.d>2?gesture.d/g.d:1)}gesture=g});
 const end=e=>{pointers.delete(e.pointerId);gesture=geometry()};['pointerup','pointercancel','lostpointercapture'].forEach(k=>c.addEventListener(k,end));
 c.addEventListener('wheel',e=>{if(panMode||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;e.preventDefault();let d=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?c.clientHeight:1);tweak(0,0,Math.exp(limit(d,-300,300)*.0015))},{passive:false});
 c.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setPan(true);$('panToggle').focus();return}if(panMode)return;let v=e.shiftKey ? .16 : .06;switch(e.key){case'ArrowLeft':tweak(-v);break;case'ArrowRight':tweak(v);break;case'ArrowUp':tweak(0,v);break;case'ArrowDown':tweak(0,-v);break;case'=':case'+':tweak(0,0,.91);break;case'-':case'_':tweak(0,0,1/.91);break;case'Home':setPose(0);break;default:return}e.preventDefault()});
 c.addEventListener('tiamat-device-lost',e=>{if(c===canvas&&backend==='webgpu')handleLoss(e.detail?.message||String(e.detail||'WebGPU device lost.'))});
 c.addEventListener('webglcontextlost',e=>{if(c!==canvas||backend!=='webgl2')return;e.preventDefault();handleLoss('WebGL2 context was lost. You can retry the renderer.')});
}
function setDimensions(key,orientation){
 if(!Object.hasOwn(sizes,key)||!['landscape','portrait'].includes(orientation))return false;
 const changedOrientation=orientation!==orientationMode;orientationMode=orientation;let portrait=orientation==='portrait';['orientation','resolution'].forEach((id,i)=>{$(id).value=i===0?orientation:key});
 for(let option of $('resolution').options){let [x,y,label]=sizes[option.value];option.textContent=label+' · '+(portrait?y:x)+' × '+(portrait?x:y)}
 let [x,y]=sizes[key];[width,height]=portrait?[y,x]:[x,y];document.documentElement.style.setProperty('--display-w',width+'px');document.documentElement.style.setProperty('--display-h',height+'px');
 $('frame').style.aspectRatio=width+' / '+height;document.documentElement.style.setProperty('--render-aspect',String(width/height));updatePreviewMode();
 if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
 if(changedOrientation&&active===0)setPose(0);syncScroll();
 try{renderer?.resize(width,height)}catch(err){handleLoss(err.message)}
 $('sizeReadout').textContent='Canvas: '+width+' × '+height+' px';requestDraw();return true
}
const rail=$('artScroll'),viewport=$('artViewport');
const panButtons=[['scrollLeft',-1,0],['scrollRight',1,0],['scrollUp',0,-1],['scrollDown',0,1]];
let panMode=false,maxX=0,maxY=0;
function setPan(value,announce=true){
 panMode=value;resetPointers();viewport.dataset.pan=String(value);
 const button=$('panToggle');
 button.setAttribute('aria-pressed',String(value));button.textContent=value?'Orbit scene':'Pan mode';
 canvas.tabIndex=!value&&$('gate').hidden?0:-1;
 if(announce)$('renderAnnounce').textContent=value?'Pan mode on. Swipe to scroll the frame or page. Use Orbit scene to resume.':'Orbit mode on. Drag or pinch to inspect the scene.';
}
$('panToggle').addEventListener('click',()=>setPan(!panMode));
function updatePreviewMode(){const v=$('fitPreview').checked?'fit':'literal';$('frame').dataset.preview=v;viewport.dataset.preview=v}
function syncScroll(){
 const x=Math.max(0,rail.scrollWidth-rail.clientWidth),y=Math.max(0,rail.scrollHeight-rail.clientHeight);
 if(x>2&&Math.abs(x-maxX)>2)rail.scrollLeft=x*(maxX>2?Math.min(1,rail.scrollLeft/maxX):.5);
 if(y>2&&Math.abs(y-maxY)>2)rail.scrollTop=y*(maxY>2?Math.min(1,rail.scrollTop/maxY):.58);
 maxX=x;maxY=y;
 $('frameNavigation').hidden=(x<=2&&y<=2)||!$('gate').hidden;
 syncScrollButtons();
}
function syncScrollButtons(){
 for(const [id,dx,dy] of panButtons){
  const button=$(id);button.hidden=dx?maxX<=2:maxY<=2;
  button.disabled=dx<0?rail.scrollLeft<2:dx>0?rail.scrollLeft>=maxX-2:dy<0?rail.scrollTop<2:rail.scrollTop>=maxY-2;
 }
}
for(const [id,dx,dy] of panButtons)$(id).addEventListener('click',()=>rail.scrollBy({left:dx*Math.max(115,rail.clientWidth*.32),top:dy*Math.max(115,rail.clientHeight*.38),behavior:motion?'smooth':'instant'}));
$('fitPreview').addEventListener('change',()=>{updatePreviewMode();syncScroll()});
rail.addEventListener('scroll',syncScrollButtons,{passive:true});
new ResizeObserver(syncScroll).observe(rail);
function setMotion(value,manual=true){if(manual)motionOverride=true;motion=Boolean(value);last=null;$('pause').setAttribute('aria-pressed',String(!motion));$('pause').textContent=motion?'Pause motion':'Resume motion';requestDraw()}
motionSetting.addEventListener?.('change',e=>{if(!motionOverride)setMotion(!e.matches,false)});
function requestDraw(){needsDraw=true;if(renderer&&!raf&&!document.hidden)raf=requestAnimationFrame(tick)}
function tick(now){raf=0;if(!renderer||document.hidden){last=null;return}if(motion&&last!==null)t+=Math.min(.10,(now-last)/1000);last=now;
 try{if(needsDraw||motion){renderer.render(cameraFrame());frameCount++;needsDraw=false}}catch(err){handleLoss(err?.message||String(err));return}
 if(motion)raf=requestAnimationFrame(tick)
}
const pretty=m=>m==='webgpu'?'WebGPU':'WebGL2';
const alternate=m=>m==='webgpu'?'webgl2':'webgpu';
function status(text,announcement=text){$('engine').textContent=text;$('engineChip').textContent=text;$('renderAnnounce').textContent=announcement}
function gate(title,note,{retry=null,other=null}={}){
 $('gate').hidden=false;canvas.inert=true;canvas.tabIndex=-1;rail.tabIndex=-1;$('panToggle').hidden=true;
 $('gateTitle').textContent=title;$('gateNote').textContent=note;$('gateNote').removeAttribute('title');
 for(const [id,mode,verb] of [['gateRetry',retry,'Retry '],['fallback',other,'Use ']]){
  const b=$(id);b.hidden=!mode;b.dataset.mode=mode||'';if(mode)b.textContent=verb+pretty(mode);
 }
 syncScroll();
}
function unlock(){
 $('gate').hidden=true;canvas.inert=false;rail.tabIndex=0;$('panToggle').hidden=false;setPan(panMode,false);syncScroll();
}
function engineButton(mode,verb){const b=$('engineSwitch');b.dataset.mode=mode;b.textContent=verb+pretty(mode)}
function handleLoss(message){
 const was=backend;if(!was)return;
 const recover=document.activeElement===canvas;
 lastError=String(message);cancelAnimationFrame(raf);raf=0;backend=null;
 const old=renderer;renderer=null;$('savePNG').disabled=true;try{old?.dispose()}catch{}
 gate('Renderer interrupted',pretty(was)+' stopped. Retry it or choose '+pretty(alternate(was))+'.',{retry:was,other:alternate(was)});
 $('gateNote').title=lastError;
 status('Renderer interrupted',pretty(was)+' stopped. Restart it with Retry '+pretty(was)+' or choose '+pretty(alternate(was))+'.');
 engineButton(was,'Retry ');$('engineSwitch').disabled=starting;
 if(recover&&!starting)$('gateRetry').focus({preventScroll:true});
}
function getScene(){if(!sceneCache)sceneCache={meshes:[...buildSkyline(),...buildRooftop()]};return sceneCache}
async function start(mode){
 if(!['webgpu','webgl2'].includes(mode)||starting)return false;
 const isSceneFocus=[canvas,$('gateRetry'),$('fallback')].includes(document.activeElement);
 const origin=(isSceneFocus||document.activeElement===$('engineSwitch'))?document.activeElement:null;
 const controls=[$('engineSwitch'),$('fallback'),$('gateRetry')];
 const id=++attempt;starting=true;const label=pretty(mode);
 for(const b of controls)b.disabled=true;
 if(!renderer)gate('Preparing the scene','Starting '+label+' on this device.');
 status('Starting '+label);
 const c=canvas.cloneNode(false);c.width=width;c.height=height;let next=null,restore=null;
 try{
  next=await initRenderer(c,mode);if(id!==attempt){next.dispose();return false}
  next.setScene(getScene());next.resize(width,height);next.render(cameraFrame());
  const old=renderer;renderer=next;backend=mode;next=null;canvas.replaceWith(c);canvas=c;attachInput(c);
  try{old?.dispose()}catch{}
  unlock();$('savePNG').disabled=false;lastError='';$('engine').removeAttribute('title');
  status(label+' active',label+' active. The artwork is ready.');engineButton(alternate(mode),'Switch to ');
  if(origin)restore=isSceneFocus?(panMode?$('panToggle'):canvas):$('engineSwitch');
  last=null;requestDraw();return true;
 }catch(err){
  try{next?.dispose()}catch{}lastError=String(err?.message||err);
  if(renderer){
   status(pretty(backend)+' active',label+' unavailable. Still using '+pretty(backend)+'.');
   $('engine').title=lastError;if(origin)restore=origin;
  }else{
   const other=alternate(mode);
   gate(label+' unavailable','This browser could not start '+label+'. Choose '+pretty(other)+' or retry '+label+'.',{retry:mode,other});
   $('gateNote').title=lastError;status(label+' unavailable','Could not start '+label+'. Choose '+pretty(other)+' or retry '+label+'.');engineButton(mode,'Retry ');
   if(origin)restore=isSceneFocus?(origin===$('fallback')?$('fallback'):$('gateRetry')):$('engineSwitch');
  }
  return false;
 }finally{
  starting=false;for(const b of controls)b.disabled=false;
  if(restore&&(document.activeElement===origin||document.activeElement===document.body))restore.focus({preventScroll:true});
 }
}
for(const id of ['fallback','gateRetry','engineSwitch'])$(id).addEventListener('click',e=>start(e.currentTarget.dataset.mode));
$('recenter').addEventListener('click',()=>setPose(0));$('pause').addEventListener('click',()=>setMotion(!motion));
$('wideHero').addEventListener('click',()=>{setDimensions('1080','landscape');setPose(0)});
['resolution','orientation'].forEach(id=>$(id).addEventListener('change',()=>setDimensions($('resolution').value,$('orientation').value)));
document.addEventListener('visibilitychange',()=>{last=null;if(document.hidden){cancelAnimationFrame(raf);raf=0}else requestDraw()});
setPose(0);setDimensions('studio','portrait');setMotion(motion,false);
const getState=()=>({backend,starting,lastError,width,height,preset:presets[active].id,orientation:orientationMode,camera:cameraFrame(),motion,changed,frameCount,info:renderer?.info||null});
function capturePNG(){if(!renderer)throw Error('Renderer is not active');renderer.render(cameraFrame());return canvas.toDataURL('image/png')}
$('savePNG').addEventListener('click',()=>{
 const btn=$('savePNG'),status=$('saveStatus');
 if(!renderer||btn.disabled)return;
 btn.disabled=true;status.textContent='Preparing PNG…';
 const filename='comet-tiamat-'+presets[active].id+'-'+width+'x'+height+'.png';
 try{
  renderer.render(cameraFrame());
  canvas.toBlob(blob=>{
   btn.disabled=!renderer;
   if(!blob){status.textContent='Could not save the image. Try again.';return}
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),2000);status.textContent='PNG ready.';
  },'image/png');
 }catch{btn.disabled=!renderer;status.textContent='Could not save the image. Try again.'}
});
window.tiamatViewer=Object.freeze({setPose,setDimensions,setMotion,getState,capturePNG});
start('webgpu');

