import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import {createHead} from '../src/face.js';
const adapter=await navigator.gpu?.requestAdapter();if(!adapter)throw Error('WebGPU unavailable; explicit backend choice required');
const renderer=new WebGPURenderer({antialias:true,alpha:false});await renderer.init();if(!renderer.backend.isWebGPUBackend)throw Error('Automatic fallback rejected');
renderer.setSize(900,1200);renderer.setPixelRatio(1);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
document.body.appendChild(renderer.domElement);document.body.style.margin=0;
const scene=new THREE.Scene();scene.background=new THREE.Color('#c4ddea');
scene.add(new THREE.HemisphereLight('#f5fbff','#bab4ad',2.1));
for(const [x,y,z,intensity,col] of [[-3,5,5,3,'#fff3e9'],[4,2,3,1.25,'#dbe8ff'],[0,4,-4,2,'#ffffff']]){const l=new THREE.DirectionalLight(col,intensity);l.position.set(x,y,z);scene.add(l);}
const model=createHead();scene.add(model);
const camera=new THREE.PerspectiveCamera(30,.75,.1,50);camera.position.set(0,.30,6.4);camera.lookAt(0,.16,0);renderer.render(scene,camera);
window.faceTest={ready:true,renderer,scene,camera,model,async view(x,z){camera.position.set(x,.2,z);camera.lookAt(0,.1,0);renderer.render(scene,camera);}};
