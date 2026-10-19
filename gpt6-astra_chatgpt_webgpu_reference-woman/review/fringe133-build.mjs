import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// Isolated original geometry study. The accepted source and every rejected
// candidate stay unchanged; this script writes only the133 review module.
let source=fs.readFileSync('src/hair-groom.js','utf8');
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),'b75e9b72d44a5a51d88c3aa280842321b3e75ae8b6dc242ad9df7db79e024822');
const helper=String.raw`
//133 replaces only the first108 fringe family. The retained prefix is the
// exact accepted bowed path; the lower fall is authored in final head space.
function diagonalFamily133(headTilt){
 const metrics={version:'single-diagonal-fringe-133',strength:1,sourceSlots:0,principal:0,shortCompanions:0,templeCompanions:0,maximumInverseError:0,maximumStartCorrection:0,minimumEndY:Infinity,maximumEndY:-Infinity};
 const posed=p=>{const w=1-smooth(-1.64,.38,p.y),a=-.16*w,b=-headTilt*w,x=p.x*Math.cos(a)+p.z*Math.sin(a),z=-p.x*Math.sin(a)+p.z*Math.cos(a);return V(x*Math.cos(b)-p.y*Math.sin(b),x*Math.sin(b)+p.y*Math.cos(b),z);};
 const authored=p=>{let y=p.y;for(let i=0;i<10;i++){const b=-headTilt*(1-smooth(-1.64,.38,y));y=-p.x*Math.sin(b)+p.y*Math.cos(b);}const w=1-smooth(-1.64,.38,y),a=-.16*w,b=-headTilt*w,x=p.x*Math.cos(b)+p.y*Math.sin(b),q=V(x*Math.cos(a)-p.z*Math.sin(a),y,x*Math.sin(a)+p.z*Math.cos(a)),check=posed(q);metrics.maximumInverseError=Math.max(metrics.maximumInverseError,Math.hypot(check.x-p.x,check.y-p.y,check.z-p.z));return q;};
 const uncompact=y=>{if(y>=.05)return y;if(y<=-.1192)return .05+(y-.05)/.94;let a=-.13,b=.05;for(let i=0;i<34;i++){const m=(a+b)/2,yy=m-.06*(m-.05)*smooth(.05,-.13,m);if(yy<y)a=m;else b=m;}return(a+b)/2;};
 // Actual original facial function with accepted50 vertical coordinates.
 // The small58 cheek narrowing makes this a conservative anterior envelope.
 const skin=(x,y)=>{const target=uncompact(y);let a=-1.18,b=1.54;for(let i=0;i<34;i++){const m=(a+b)/2;if(warpedY(m)<target)a=m;else b=m;}return faceZ(x,(a+b)/2);};
 const softMax=(a,b,e=.006)=>(a+b+Math.hypot(a-b,e))*.5;
 const principal=[[.96,-.365],[.76,-.435],[.48,-.542],[.17,-.627],[-.10,-.684],[-.33,-.713],[-.55,-.718]];
 const temple=[[.96,-.365],[.74,-.473],[.51,-.652],[.32,-.766],[.15,-.827],[-.14,-.838]];
 function atY(table,y){
  let i=0;while(i<table.length-2&&y<table[i+1][0])i++;
  const a=table[i],b=table[i+1],p=table[Math.max(0,i-1)],q=table[Math.min(table.length-1,i+2)],h=a[0]-b[0],t=clamp((a[0]-y)/h),m0=(b[1]-p[1])/(p[0]-b[0]),m1=(q[1]-a[1])/(a[0]-q[0]);
  return(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*h*m1;
 }
 function decorate(original,{k,lane,noise,endNoise,phase,loose}){
  const kind=k%10===2?'temple':k%11===5?'short':'principal';
  metrics.sourceSlots++;metrics[kind==='principal'?'principal':kind==='temple'?'templeCompanions':'shortCompanions']++;
  const startY=.90+.012*Math.sin(phase*.71),endY=kind==='temple'?.225-.335*endNoise:kind==='short'?.285-.43*endNoise:-.495+.36*Math.pow(Math.abs(lane),.72)+.065*(endNoise-.5);
  metrics.minimumEndY=Math.min(metrics.minimumEndY,endY);metrics.maximumEndY=Math.max(metrics.maximumEndY,endY);
  let lo=0,hi=1;for(let i=0;i<26;i++){const t=(lo+hi)/2;if(posed(original.getPoint(t)).y>startY)lo=t;else hi=t;}
  const start=(lo+hi)/2,p0=posed(original.getPoint(start)),e=.00002,d0=posed(original.getPoint(start+e)).sub(posed(original.getPoint(start-e))).multiplyScalar(1/(2*e)),drop=p0.y-endY,a=-d0.y*(1-start)/drop;
  // Exponential progress is strictly descending for any positive starting
  // slope; short companions need not clamp away the accepted join tangent.
  let r0=-16,r1=16;for(let i=0;i<38;i++){const r=(r0+r1)/2,q=Math.abs(r)<1e-8?1:r/Math.expm1(r);if(q>a)r0=r;else r1=r;}const rate=(r0+r1)/2;
  function uncorrected(s){
   const fall=Math.abs(rate)<1e-7?s:Math.expm1(rate*s)/Math.expm1(rate),y=p0.y-drop*fall;
   const outer=Math.abs(lane),width=kind==='principal'?.012+.018*Math.exp(-Math.pow((y-.38)/.52,2)):kind==='short'?.010+.007*Math.exp(-Math.pow((y-.42)/.44,2)):.007+.004*Math.sin(s*Math.PI);
   let x=atY(kind==='temple'?temple:principal,y)+lane*width+(noise-.5)*.005*Math.sin(s*Math.PI);
   if(kind==='short')x+=(k%2?1:-1)*(.027+.011*noise)*smooth(0,.36,s);
   let z=skin(x,y)+.026+.016*Math.exp(-Math.pow((y-.48)/.44,2));
   if(kind==='temple'){
    // A few narrow fibers pass over the existing upper cartilage. This is a
    // smooth bowed passage, with no broad strip or new opaque ear covering.
    const upperEar=.260+.082*smooth(-.15,.50,y)+.003*Math.sin(phase),weight=smooth(-.64,-.735,x);
    z=mix(z,softMax(z,upperEar,.035),weight);
   }else z=softMax(z,.251+.006*noise);
   z+=(loose?.005:.0025)*Math.sin(s*Math.PI)*Math.sin(phase*.83);
   return V(x,y,z);
  }
  const target0=uncorrected(0),targetD=uncorrected(e).sub(target0).multiplyScalar(1/e),delta=p0.clone().sub(target0),slope=V(d0.x*(1-start)-targetD.x,0,d0.z*(1-start)-targetD.z);
  metrics.maximumStartCorrection=Math.max(metrics.maximumStartCorrection,Math.hypot(delta.x,delta.z));
  const final={getPoint(t){
   if(t<=start)return original.getPoint(t);
   const s=clamp((t-start)/(1-start)),p=uncorrected(s),retain=1-smooth(0,.42,p0.y-p.y);
   p.x+=(delta.x+s*slope.x)*retain;p.z+=(delta.z+s*slope.z)*retain;
   return authored(p);
  },getTangent(t){if(t<start-.0001)return original.getTangent(t);const a=Math.max(0,t-.0001),b=Math.min(1,t+.0001);return this.getPoint(b).sub(this.getPoint(a)).normalize();}};
  final.debug133={kind,start,startY:p0.y,endY,lane,original,posed};
  return final;
 }
 return{decorate,metrics};
}

`;
source=source.replace('export function createGroomHair(',helper+'export function createGroomHair(');
source=source.replace('shoulderContact=0,guidePlacement=0}={})','shoulderContact=0,guidePlacement=0,diagonalFringe133=0}={})');
source=source.replace(" const fringeStats108={roundCores:0", " const diagonal133=Number(diagonalFringe133)>0?diagonalFamily133(headTilt):null;\n const fringeStats108={roundCores:0");
const strand='strand=curve(trim),widthNoise=random(),keepCore=';
assert.equal(source.split(strand).length,2);
source=source.replace(strand,"strand=diagonal133&&group===0?diagonal133.decorate(curve(trim),{k,lane,noise,endNoise,phase,loose}):curve(trim),widthNoise=random(),keepCore=");
const boundary='  }\n }\n // Short edge hairs continue the crown tangent into sparse outer wisps.';
assert.equal(source.split(boundary).length,2);
source=source.replace(boundary,'  }\n  if(group===0&&diagonal133){diagonal133.metrics.vertices=fringe.p.length/3;diagonal133.metrics.indices=fringe.i.length;}\n }\n // Short edge hairs continue the crown tangent into sparse outer wisps.');
source=source.replace(' root.userData.fringeDistribution108=fringeStats108;',' root.userData.fringeDistribution108=fringeStats108;\n root.userData.diagonalFringe133=diagonal133?diagonal133.metrics:{version:\'single-diagonal-fringe-133\',strength:0};');
fs.writeFileSync('review/hair-groom-candidate133.js',source);
console.log(JSON.stringify({bytes:Buffer.byteLength(source),sha256:crypto.createHash('sha256').update(source).digest('hex')}));
