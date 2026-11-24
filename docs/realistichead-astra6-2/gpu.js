import {glslBG,glslLit,wgslBG,wgslLit} from './shading.js';
const shadowRes=1536;
const wCommon=`
struct Studio { camera:mat4x4f, light:mat4x4f, eye:vec4f }
@group(0) @binding(0) var<uniform> u:Studio;
struct VIn { @location(0) p:vec3f, @location(1) n:vec3f,@location(2) c:vec3f,@location(3) m:vec3f }
fn clipGL(p:vec4f)->vec4f{return vec4f(p.xy,(p.z+p.w)*.5,p.w);}
`;
export async function makeGPU(canvas,mesh){
 if(!navigator.gpu)throw Error('WebGPU is not available in this browser or connection.');
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});if(!adapter)throw Error('No WebGPU adapter was offered by this browser.');
 const device=await adapter.requestDevice();const ctx=canvas.getContext('webgpu');if(!ctx){device.destroy();throw Error('The canvas could not use WebGPU.');}
 const format=navigator.gpu.getPreferredCanvasFormat();ctx.configure({device,format,alphaMode:'opaque'});
 const B=GPUBufferUsage,T=GPUTextureUsage;
 function buf(array,usage){const b=device.createBuffer({size:Math.max(4,array.byteLength),usage:usage|B.COPY_DST});device.queue.writeBuffer(b,0,array);return b}
 const vertex=buf(mesh.vertices,B.VERTEX),index=buf(mesh.indices,B.INDEX),uniform=device.createBuffer({size:144,usage:B.UNIFORM|B.COPY_DST});
 const options=[{arrayStride:48,attributes:[0,1,2,3].map((shaderLocation,i)=>({shaderLocation,format:'float32x3',offset:i*12}))}];
 async function shader(code){const m=device.createShaderModule({code});if(typeof m.getCompilationInfo==='function'){const inf=await m.getCompilationInfo();const err=inf.messages.filter(v=>v.type==='error');if(err.length)throw Error(err.map(e=>e.lineNum+': '+e.message).join('; ').slice(0,1200));}return m;}
 const depthModule=await shader(wCommon+`@vertex fn depthV(v:VIn)->@builtin(position) vec4f{return clipGL(u.light*vec4f(v.p,1.));}`);
 const sceneModule=await shader(wCommon+`
 @group(0) @binding(1) var shadowSampler:sampler_comparison;
 @group(0) @binding(2) var shadowTex:texture_depth_2d;
 struct Out{ @builtin(position) p:vec4f,@location(0) world:vec3f,@location(1) n:vec3f,@location(2) c:vec3f,@location(3) mat:vec3f,@location(4) sm:vec4f}
 @vertex fn mainV(v:VIn)->Out{var o:Out;o.p=clipGL(u.camera*vec4f(v.p,1.));o.world=v.p;o.n=v.n;o.c=v.c;o.mat=v.m;o.sm=clipGL(u.light*vec4f(v.p,1.));return o;}
 `+wgslLit+`
 @fragment fn mainF(s:Out)->@location(0) vec4f{
 let lc=s.sm.xyz/s.sm.w;let uv=lc.xy*vec2f(.5,-.5)+vec2f(.5);let dz=.00035+.0011*(1.-max(dot(normalize(s.n),normalize(vec3f(.96,1.03,1.31))),0.));
 var visibility=0.;for(var y:i32=-1;y<=1;y++){for(var x:i32=-1;x<=1;x++){visibility+=textureSampleCompareLevel(shadowTex,shadowSampler,uv+vec2f(f32(x),f32(y))*.0019,lc.z-dz);}}
 return vec4f(illuminate(s.n,s.world,u.eye.xyz,s.c,s.mat.x,s.mat.y,s.mat.z,visibility/9.),1.);}
 `);
 const bgMod=await shader(wgslBG+`struct Bgo{@builtin(position) p:vec4f,@location(0) uv:vec2f}
 @vertex fn bgV(@builtin(vertex_index) i:u32)->Bgo{let k=vec2f(f32((i<<1u)&2u),f32(i&2u));var o:Bgo;o.p=vec4f(k*2.-vec2f(1.),.99999,1.);o.uv=k;return o;}
 @fragment fn bgF(s:Bgo)->@location(0) vec4f{return vec4f(backdrop(s.uv),1.);}`);
 const depthPipe=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:depthModule,entryPoint:'depthV',buffers:options},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthCompare:'less',depthWriteEnabled:true,depthBias:1,depthBiasSlopeScale:1}});
 const shadowTex=device.createTexture({size:[shadowRes,shadowRes],format:'depth24plus',usage:T.RENDER_ATTACHMENT|T.TEXTURE_BINDING});
 const shadowView=shadowTex.createView(),sampler=device.createSampler({compare:'less-equal',minFilter:'linear',magFilter:'linear'});const depthGroup=device.createBindGroup({layout:depthPipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}}]});
 const cache=new Map();async function pipelines(samples){const scene=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:sceneModule,entryPoint:'mainV',buffers:options},fragment:{module:sceneModule,entryPoint:'mainF',targets:[{format}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'},multisample:{count:samples}});
 const bg=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:bgMod,entryPoint:'bgV'},fragment:{module:bgMod,entryPoint:'bgF',targets:[{format}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:false,depthCompare:'always'},multisample:{count:samples}});
 const group=device.createBindGroup({layout:scene.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}},{binding:1,resource:sampler},{binding:2,resource:shadowView}]});cache.set(samples,{scene,bg,group});}
 await Promise.all([pipelines(1),pipelines(4)]);
 let depth,color,lastSize='',shadowDirty=true;const u=new Float32Array(36);let disposed=false;
 device.lost.then(info=>{if(!disposed){window.dispatchEvent(new CustomEvent('portraitlost',{detail:info.message||'WebGPU device lost'}));}});
 return {backend:'WebGPU',draw(cam,light,eye){u.set(cam,0);u.set(light,16);u.set(eye,32);u[35]=1;device.queue.writeBuffer(uniform,0,u);
 let w=canvas.width,h=canvas.height,samples=w*h<=2500000?4:1,sz=w+'x'+h;if(sz!==lastSize){depth?.destroy();color?.destroy();depth=device.createTexture({size:[w,h],format:'depth24plus',sampleCount:samples,usage:T.RENDER_ATTACHMENT});color=samples===4?device.createTexture({size:[w,h],format,sampleCount:samples,usage:T.RENDER_ATTACHMENT}):null;lastSize=sz;}
 const encoder=device.createCommandEncoder();if(shadowDirty){const s=encoder.beginRenderPass({colorAttachments:[],depthStencilAttachment:{view:shadowView,depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});s.setPipeline(depthPipe);s.setBindGroup(0,depthGroup);s.setVertexBuffer(0,vertex);s.setIndexBuffer(index,'uint32');s.drawIndexed(mesh.indices.length);s.end();shadowDirty=false;}
 const swap=ctx.getCurrentTexture().createView();const att={view:color?color.createView():swap,clearValue:{r:.8,g:.8,b:.9,a:1},loadOp:'clear',storeOp:'store'};if(color)att.resolveTarget=swap;
 const pass=encoder.beginRenderPass({colorAttachments:[att],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'discard'}});
 const q=cache.get(samples);pass.setPipeline(q.bg);pass.draw(3);pass.setPipeline(q.scene);pass.setBindGroup(0,q.group);pass.setVertexBuffer(0,vertex);pass.setIndexBuffer(index,'uint32');pass.drawIndexed(mesh.indices.length);pass.end();device.queue.submit([encoder.finish()]);},
 destroy(){disposed=true;device.destroy();ctx.unconfigure();}};}

