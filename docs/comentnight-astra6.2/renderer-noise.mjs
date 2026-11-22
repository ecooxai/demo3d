// A cache of a mathematical lattice, never an image asset. Supported WebGL2
// contexts may trade 1 MiB and one startup draw for fewer repeated hash calls.
const SIZE=256,HALF=128;
const NOISE_SIGNATURE='float skNoise(vec2 p) {';
const INNER='return mix(mix(skHash(i),';
const VS='#version 300 es\nprecision highp float;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2))*2.-1.;gl_Position=vec4(p,0.,1.);}';
export function describeSkyLattice(source){
 // This optional fast path recognizes exactly our project shader's lattice
 // contract. If a future sky uses another noise algorithm, use it unchanged.
 const start=source.indexOf('float skHash(vec2 p) {'),noise=source.indexOf(NOISE_SIGNATURE),ret=source.indexOf(INNER,noise);
 const end=source.indexOf('\n}',noise);if(start<0||noise<=start||ret<noise||ret>end)return null;
 const body=source.slice(noise,end).replace(/\s/g,'');
 const exact='floatskNoise(vec2p){vec2i=floor(p);vec2f=fract(p);f=f*f*(vec2(3.0)-2.0*f);returnmix(mix(skHash(i),skHash(i+vec2(1.0,0.0)),f.x),mix(skHash(i+vec2(0.0,1.0)),skHash(i+vec2(1.0)),f.x),f.y);';
 if(body!==exact)return null;
 const hash=source.slice(start,noise).trim();
 const tap=`if(all(greaterThanEqual(i,vec2(-128.0))) && all(lessThan(i,vec2(128.0)))) {
  vec4 c4=texelFetch(tnLattice,ivec2(i)+ivec2(128),0);
  return mix(mix(c4.x,c4.y,f.x),mix(c4.z,c4.w,f.x),f.y);
 }\n `;
 return {hash,shader:'uniform highp sampler2D tnLattice;\n'+source.slice(0,ret)+tap+source.slice(ret)};
}
export function trySkyLattice(gl,makeProgram,source){
 const began=performance.now();
 const skip=reason=>({enabled:false,reason,bytes:0,initMs:performance.now()-began});
 if(!gl.getExtension('EXT_color_buffer_float'))return skip('float render targets unavailable');
 if(gl.getParameter(gl.MAX_TEXTURE_SIZE)<SIZE)return skip('texture limit');
 const spec=describeSkyLattice(source);if(!spec)return skip('different sky noise');
 const viewport=gl.getParameter(gl.VIEWPORT),wasDepth=gl.isEnabled(gl.DEPTH_TEST),wasBlend=gl.isEnabled(gl.BLEND);
 let tex,fb,pg,okay=false;
 try{
  tex=gl.createTexture();fb=gl.createFramebuffer();if(!tex||!fb)throw Error('allocation unavailable');
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texStorage2D(gl.TEXTURE_2D,1,gl.RGBA32F,SIZE,SIZE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('float framebuffer incomplete');
  pg=makeProgram(VS,'#version 300 es\nprecision highp float;precision highp int;\n'+spec.hash+
   '\nout vec4 corners;void main(){vec2 i=floor(gl_FragCoord.xy)-vec2(128.);corners=vec4(skHash(i),skHash(i+vec2(1.,0.)),skHash(i+vec2(0.,1.)),skHash(i+vec2(1.)));}');
  gl.useProgram(pg);gl.bindTexture(gl.TEXTURE_2D,null);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.viewport(0,0,SIZE,SIZE);gl.drawArrays(gl.TRIANGLES,0,3);
  // The two-by-two validation checks a nonzero result and the relationship
  // between neighboring corner quadruples on THIS device, not a CPU hash.
  const a=new Float32Array(16);gl.readPixels(HALF+7,HALF+13,2,2,gl.RGBA,gl.FLOAT,a);
  if(gl.getError()!==gl.NO_ERROR||a.every(x=>x===0)||!a.every(x=>Number.isFinite(x)&&x>=0&&x<=1)||
      Math.abs(a[1]-a[4])>1e-6||Math.abs(a[2]-a[8])>1e-6||Math.abs(a[3]-a[12])>1e-6)throw Error('device float validation');
  okay=true;
  return {enabled:true,bytes:SIZE*SIZE*16,initMs:performance.now()-began,shader:spec.shader,
   bind(program){gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(gl.getUniformLocation(program,'tnLattice'),0)},
   dispose(){gl.deleteTexture(tex)}};
 }catch(e){return skip(String(e.message??e))}
 finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindTexture(gl.TEXTURE_2D,null);gl.useProgram(null);gl.viewport(...viewport);
  if(wasBlend)gl.enable(gl.BLEND);if(wasDepth)gl.enable(gl.DEPTH_TEST);
  if(pg)gl.deleteProgram(pg);if(fb)gl.deleteFramebuffer(fb);if(!okay&&tex)gl.deleteTexture(tex)}
}

