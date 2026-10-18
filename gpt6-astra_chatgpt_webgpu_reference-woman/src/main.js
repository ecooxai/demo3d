import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createHead } from './face.js';
import { applyReferenceSkin } from './reference-skin.js';
import { applyReferenceNeck } from './reference-neck.js';
import { compensateReferenceSkin } from './skin-illumination.js';
import { createHair } from './hair.js';
import { createFiberHair } from './hair-fibers.js';
import { createGroomHair } from './hair-groom.js';
import { createBlouse, createNeck } from './blouse.js';

const $ = (id) => document.getElementById(id);
const hairChoice=new URLSearchParams(location.search).get('hair')||'groom';
const fiberCandidate=hairChoice==='fibers';
const groomCandidate=hairChoice==='groom';
const coverageCandidate=hairChoice==='coverage';
const state = { backend: new URLSearchParams(location.search).get('backend') === 'webgl' ? 'webgl' : 'webgpu', width: 900, height: 1200, iteration: groomCandidate?33:coverageCandidate?32:fiberCandidate?25:27, score: groomCandidate?70:fiberCandidate?61:68, renderedFrames: 0, renderMs: 0, rotating: false, view: 'front', ready: false, lighting: 'soft' };
const scene = new THREE.Scene();
scene.background = new THREE.Color('#cbe3f3');
const model = new THREE.Group();
model.name = 'GPT-6_Astra_ChatGPT_WebGPU_Reference_Portrait';
const headPivot = new THREE.Group();
headPivot.name = 'Head_pose';
headPivot.position.y = 2.95;
headPivot.rotation.z = -0.17;
headPivot.rotation.y = 0.16;
const anatomicalHead=createHead();
const anatomicalHair=groomCandidate?createGroomHair():fiberCandidate?createFiberHair():createHair({coverage:coverageCandidate});
const skinReady=applyReferenceSkin(anatomicalHead).then(atlas=>{state.textureBakeMs=atlas.userData.bakeMs;return atlas;});
headPivot.add(anatomicalHead, anatomicalHair);
const bodyPose=new THREE.Group();bodyPose.name='Relaxed shoulder counterpose';
bodyPose.position.y=1;bodyPose.rotation.z=.045;
const anatomicalNeck=createNeck(),anatomicalBlouse=createBlouse();
anatomicalNeck.position.y=-1;anatomicalBlouse.position.y=-1;
bodyPose.add(anatomicalNeck,anatomicalBlouse);
model.add(headPivot,bodyPose);
const referenceReady=Promise.all([skinReady,applyReferenceNeck(anatomicalNeck)]);
scene.add(model);
let triangles = 0, meshes = 0;
model.traverse((object) => { if (object.isMesh) { meshes++; triangles += (object.geometry.index?.count || object.geometry.attributes.position.count) / 3; } });

// All studio illumination is drawn here; no photographic or external assets.
function studioEnvironment() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#626872'; ctx.fillRect(0, 0, 1024, 512);
  const panels = [[160,170,255,'#fff9ee'],[780,180,225,'#d7eaff'],[520,20,200,'#ffffff']];
  for (const [x,y,r,color] of panels) {
    const gradient = ctx.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,color); gradient.addColorStop(.28,color); gradient.addColorStop(1,'rgba(110,120,133,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0,0,1024,512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
scene.environment = studioEnvironment();
scene.environmentIntensity = .5;
const ambient = new THREE.AmbientLight('#ffffff', 1.10);
const key = new THREE.DirectionalLight('#fff5ed', 1.05); key.position.set(-3,6,8);
const fill = new THREE.DirectionalLight('#e8f0ff', 1.00); fill.position.set(4,3,8);
const rim = new THREE.DirectionalLight('#f6f4ff', .75); rim.position.set(2,5,-4);
key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.radius=4;key.shadow.blurSamples=8;key.shadow.bias=-.0002;key.shadow.normalBias=.012;key.shadow.camera.left=-3.4;key.shadow.camera.right=3.4;key.shadow.camera.top=3.8;key.shadow.camera.bottom=-3.8;key.shadow.camera.near=.5;key.shadow.camera.far=20;key.target.position.set(0,1.7,0);
scene.add(ambient,key,fill,rim,key.target);

const camera = new THREE.OrthographicCamera(-2.7,2.7,3.6,-3.6,.05,100);
camera.position.set(0,1.55,13);
camera.lookAt(0,1.55,0);
let renderer, controls, raf = 0, lastTimestamp = 0, toastTimer, initializing = false, skinIlluminationApplied=false;
const fullTarget = new THREE.Vector3(0,1.55,0);
const detailTarget = new THREE.Vector3(.02,3.03,.30);
const viewDirections = { front: [0,0,13], left: [-13,0,0], right: [13,0,0], back: [0,0,-13], detail: [0,0,13] };

function requestRender() {
  if (state.ready && !document.hidden && !raf) raf = requestAnimationFrame(renderFrame);
}
function renderFrame(timestamp = performance.now()) {
  raf = 0;
  if (!state.ready || document.hidden) return;
  const dt = Math.min((timestamp-lastTimestamp) / 1000 || 0, .05);
  lastTimestamp = timestamp;
  if (state.rotating) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), dt * .18);
    camera.position.copy(controls.target).add(offset);
  }
  const moved = controls.update();
  const begin = performance.now();
  renderer.render(scene,camera);
  state.renderMs = performance.now() - begin;
  state.renderedFrames++;
  if (state.renderedFrames % 60 === 0 || state.renderedFrames < 3) updateStats();
  if (state.rotating || moved) requestRender();
}
function updateStats() {
  $('performance-label').textContent = `${Math.round(triangles/1000)}k triangles · ${state.rotating ? 'turntable' : 'demand driven'}`;
  $('settings-stat').textContent = `${meshes.toLocaleString()} meshes · ${Math.round(triangles).toLocaleString()} triangles · ${state.renderMs.toFixed(1)} ms CPU submission${performance.memory ? ` · ${Math.round(performance.memory.usedJSHeapSize/1048576)} MB JS heap` : ''}`;
}
function updateProjection() {
  const verticalSpan = state.view === 'detail' ? 3.0 : 6.4;
  const aspect = state.width/state.height;
  // Keep the full bust visible when landscape orientation is requested.
  const viewHeight = Math.max(verticalSpan, (state.view === 'detail' ? 2.4 : 4.6)/aspect);
  camera.left = -viewHeight*aspect/2; camera.right = viewHeight*aspect/2;
  camera.top = viewHeight/2; camera.bottom = -viewHeight/2;
  camera.updateProjectionMatrix();
}
function applyResolution(width,height) {
  state.width=width; state.height=height;
  renderer?.setSize(width,height,false);
  const wrap=$('viewport-wrap');
  wrap.style.setProperty('--render-aspect', `${width} / ${height}`);
  wrap.style.setProperty('--render-width', `${Math.min(width,900)}px`);
  $('resolution-label').textContent=`${width} × ${height}`;
  updateProjection(); requestRender();
}
function setView(name='front') {
  if (!viewDirections[name]) throw new Error(`Unknown portrait view: ${name}`);
  state.view=name;
  const target=name==='detail'?detailTarget:fullTarget;
  if (controls) controls.target.copy(target);
  camera.position.copy(target).add(new THREE.Vector3(...viewDirections[name]));
  camera.zoom=1; camera.up.set(0,1,0); camera.lookAt(target);
  updateProjection();
  document.querySelectorAll('[data-view]').forEach(button=>{ const active=button.dataset.view===name;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active)); });
  $('detail-toggle').classList.toggle('active',name==='detail');
  $('detail-toggle').querySelector('span').textContent=name==='detail'?'FULL PORTRAIT':'FACE DETAIL';
  $('detail-toggle').setAttribute('aria-label',name==='detail'?'See full portrait':'See face detail');
  controls?.update(); requestRender();
  return name;
}
function startTurntable(enabled=true) {
  state.rotating=Boolean(enabled);
  $('turntable-toggle').setAttribute('aria-pressed',String(state.rotating));
  $('turntable-toggle').classList.toggle('active',state.rotating);
  updateStats(); requestRender();
}
function setScore(iteration,score) {
  if (!Number.isInteger(iteration)||iteration<1||!Number.isFinite(score)||score<0||score>100) throw new Error('Invalid iteration or quality score');
  state.iteration=iteration; state.score=score;
  $('iteration-label').textContent=`ITERATION ${String(iteration).padStart(2,'0')}`;
  $('score-label').innerHTML=`${score} <small>/ 100</small>`;
}
function notify(message) {
  clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false;
  toastTimer=setTimeout(()=>{$('toast').hidden=true;},4200);
}
function download(blob,name) {
  const url=URL.createObjectURL(blob); const anchor=document.createElement('a');
  anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
async function capture({download: shouldDownload=true, showcase=false}={}) {
  if (!state.ready) throw new Error('The renderer is not ready');
  renderer.render(scene,camera);
  let canvas=renderer.domElement;
  if (showcase) {
    const source=canvas;canvas=document.createElement('canvas');canvas.width=state.width;canvas.height=state.height+Math.round(state.height*.1);
    const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);ctx.fillStyle='#07090c';ctx.fillRect(0,state.height,state.width,canvas.height-state.height);
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=`600 ${Math.round(state.width*.031)}px Arial`;
    ctx.fillText('GPT-6 ASTRA PRO  /  CHATGPT  /  WEBGPU',state.width/2,state.height+(canvas.height-state.height)*.60);
  }
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));
  if(shouldDownload)download(blob,`gpt6-astra_chatgpt_webgpu_portrait-${state.view}${showcase?'-showcase':''}.png`);
  return blob;
}
async function exportGLB({download:shouldDownload=true}={}) {
  const exporter=new GLTFExporter();
  const data=await exporter.parseAsync(model,{binary:true,onlyVisible:true,maxTextureSize:2048});
  const blob=new Blob([data],{type:'model/gltf-binary'});
  if(shouldDownload)download(blob,'gpt6-astra_chatgpt_webgpu_reference-woman.glb');
  return blob;
}
function setLighting(name) {
  state.lighting=name;
  if(name==='warm') {key.color.set('#ffdfbd');fill.color.set('#e9e3f3');key.intensity=2.2;fill.intensity=.85;ambient.intensity=.75;rim.intensity=.8;scene.background.set('#e4e6df');}
  else if(name==='sculpture') {key.color.set('#ffffff');fill.color.set('#c4d7f1');key.intensity=2.8;fill.intensity=.4;ambient.intensity=.4;rim.intensity=1.0;scene.background.set('#ccdfe6');}
  else {key.color.set('#fff5ed');fill.color.set('#e8f0ff');key.intensity=1.05;fill.intensity=1.00;ambient.intensity=1.10;rim.intensity=.75;scene.background.set('#cbe3f3');}
  requestRender();
}
function setSettingsOpen(open) {
  $('settings-panel').hidden=!open;$('settings-shade').hidden=!open;
  $('settings-open').setAttribute('aria-expanded',String(open));
  if(open)$('settings-close').focus();else $('settings-open').focus();
}
async function initialize(backend=state.backend) {
  if(initializing)return; initializing=true;state.ready=false;
  cancelAnimationFrame(raf);raf=0;
  $('loading').hidden=false;$('backend-gate').hidden=true;
  $('backend-label').textContent=`INITIALIZING ${backend.toUpperCase()}`;
  try {
    await referenceReady;
    if(!skinIlluminationApplied){state.skinIllumination=compensateReferenceSkin(anatomicalHead,scene,{strength:.35});skinIlluminationApplied=true;}
    if(backend==='webgpu') {
      if(!navigator.gpu)throw new Error('WebGPU is not available in this browser or context. Use a supported browser on HTTPS or localhost, or choose WebGL below.');
      const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});
      if(!adapter)throw new Error('This device did not provide a WebGPU adapter. You can explicitly choose WebGL below.');
    }
    controls?.dispose();renderer?.dispose();renderer=undefined;
    let next;
    if(backend==='webgpu') {
      next=new WebGPURenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
      await next.init();
      if(!next.backend?.isWebGPUBackend){next.dispose();throw new Error('The renderer attempted a compatibility backend. WebGPU was requested, so rendering has stopped. Choose WebGL explicitly to continue.');}
    }else next=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
    renderer=next;renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label','Interactive three-dimensional portrait. Drag to orbit, scroll or pinch to zoom.');
    renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;
    $('canvas-host').replaceChildren(renderer.domElement);
    controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(state.view==='detail'?detailTarget:fullTarget);
    controls.enableDamping=true;controls.dampingFactor=.12;controls.enablePan=false;
    controls.rotateSpeed=.65;controls.zoomSpeed=.8;controls.minZoom=.6;controls.maxZoom=3;
    controls.minPolarAngle=.20;controls.maxPolarAngle=Math.PI-.20;
    controls.addEventListener('change',requestRender);
    controls.addEventListener('start',()=>{$('drag-hint').classList.add('dismissed');});
    renderer.domElement.addEventListener('keydown',event=>{const names=['front','left','back','right'];const idx=names.indexOf(state.view);if(event.key==='ArrowRight'||event.key==='ArrowLeft'){setView(names[(idx+(event.key==='ArrowRight'?1:3)+4)%4]);event.preventDefault();}else if(event.key==='Home'){setView('front');event.preventDefault();}});
    state.backend=backend;state.ready=true;
    $('backend-select').value=backend;$('backend-label').textContent=backend==='webgpu'?'WEBGPU · LIVE 3D':'WEBGL · LIVE 3D';
    applyResolution(state.width,state.height);setView(state.view);updateStats();
    $('loading').hidden=true;requestRender();
    window.dispatchEvent(new CustomEvent('portrait-ready',{detail:{backend}}));
  }catch(error){
    console.error('Portrait renderer:',error);
    state.ready=false;$('loading').hidden=true;$('backend-gate').hidden=false;
    $('gate-message').textContent=error.message||String(error);$('backend-label').textContent='RENDERER CHOICE REQUIRED';
  }finally{initializing=false;}
}

document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
$('detail-toggle').addEventListener('click',()=>setView(state.view==='detail'?'front':'detail'));
$('turntable-toggle').addEventListener('click',()=>startTurntable(!state.rotating));
$('capture-button').addEventListener('click',async()=>{try{await capture({showcase:true});notify('Portrait PNG saved.');}catch(error){notify(error.message);}});
$('export-button').addEventListener('click',async()=>{const button=$('export-button');button.disabled=true;notify('Preparing your 3D model…');try{await exportGLB();notify('GLB model saved.');}catch(error){console.error(error);notify(`Export failed: ${error.message}`);}finally{button.disabled=false;}});
$('settings-open').addEventListener('click',()=>setSettingsOpen(true));$('settings-close').addEventListener('click',()=>setSettingsOpen(false));$('settings-shade').addEventListener('click',()=>setSettingsOpen(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('settings-panel').hidden)setSettingsOpen(false);});
$('choose-webgl').addEventListener('click',()=>initialize('webgl'));$('retry-webgpu').addEventListener('click',()=>initialize('webgpu'));
$('apply-settings').addEventListener('click',async()=>{
  const sizes={'900':[900,1200],'1080':[1080,1440],'1280':[1280,1707],'2k':[2048,2731],'4k':[3072,4096]};
  let [width,height]=sizes[$('resolution-select').value];if($('orientation-select').value==='landscape')[width,height]=[height,width];
  applyResolution(width,height);setLighting($('lighting-select').value);
  const backend=$('backend-select').value;setSettingsOpen(false);
  if(backend!==state.backend||!state.ready)await initialize(backend);else requestRender();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{lastTimestamp=performance.now();requestRender();}});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);controls?.dispose();renderer?.dispose();});
window.portrait={scene,model,headPivot,camera,get renderer(){return renderer;},get controls(){return controls;},state,get ready(){return state.ready;},setView,render:requestRender,renderNow:()=>{cancelAnimationFrame(raf);raf=0;if(state.ready)renderFrame(performance.now());},exportGLB,capture,setScore,startTurntable,setLighting,setResolution:applyResolution,initialize,applySkinCompensation:strength=>{const metrics=compensateReferenceSkin(anatomicalHead,scene,{strength});requestRender();return metrics;}};
setScore(state.iteration,state.score);
initialize();
