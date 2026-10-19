import fs from 'node:fs';
import assert from 'node:assert/strict';

// Review-only construction. The accepted118 source and RNG stream are the base.
if(!fs.existsSync('review/hair-groom-before124.js'))fs.writeFileSync('review/hair-groom-before124.js',fs.readFileSync('src/hair-groom.js','utf8'));
let source=fs.readFileSync('review/hair-groom-before124.js','utf8');
const replace=(from,to)=>{assert.equal(source.split(from).length,2,from.slice(0,100));source=source.replace(from,to);};
const helpers=String.raw`
//124 replaces the exposed front sheet and the separate fringe together. Each
// dense root and its fine ends uses one falling path; no short edge carriers.
function crownRetention124(u,v){
 const roi=smooth(.54,.62,u),start=.405+.031*Math.sin(u*27.4+.4)+.016*Math.sin(u*59.1),end=.655+.042*Math.sin(u*23.7+1.2);
 return (1-roi*smooth(start,end,v))*(1-smooth(.951,.986,u)*smooth(.035,.18,v));
}
function crownFiberEnd124(u,phase,end){
 const local=.515+.080*(.5+.5*Math.sin(u*41.3+phase*.73))+.033*Math.sin(u*69.7);
 return mix(end,local,smooth(.55,.63,u));
}
function patchCoverageMap124(){
 const w=256,h=1024,data=new Uint8Array(w*h*4),random=rng(124639),lanes=96,ends=[],phase=[];
 for(let k=0;k<lanes;k++){const q=random();ends.push(q<.28?.30+random()*.15:q<.77?.43+random()*.21:q<.95?.62+random()*.17:.79+random()*.18);phase.push(random()*TAU);}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w,v=y/(h-1),lane=Math.min(lanes-1,Math.floor(u*lanes)),q=u*lanes-lane,edge=.035+.020*Math.sin(v*7+phase[lane]);
  const fineEdge=smooth(0,edge,q)*(1-smooth(1-edge,1,q)),opening=mix(1,fineEdge,smooth(.17,.35,v));
  const alpha=opening*(1-smooth(ends[lane]-.028,ends[lane],v)),at=(y*w+x)*4;
  data[at]=data[at+1]=data[at+2]=254;data[at+3]=Math.round(255*alpha);
 }
 const t=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);t.wrapS=THREE.RepeatWrapping;t.wrapT=THREE.ClampToEdgeWrapping;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.anisotropy=8;t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;t.name='Original unequal longitudinal root-to-fringe coverage124';return t;
}
const patchFaceZ124=(forehead,x,y)=>y<.14?faceZ(x,inverseY(y)):forehead(x,y);
function fallingPatchCurve124(points,forehead,foreheadRoute){
 // Harmonic Y slopes keep every post-apex interval descending, while X/Z
 // retain broad bowed controls. This avoids105's exposed tangent hooks.
 const count=points.length,slopes=points.map((p,i)=>{
  const a=points[Math.max(0,i-1)],b=points[Math.min(count-1,i+1)],d=V((b.x-a.x)*.38,0,(b.z-a.z)*.38);
  if(i===0)d.y=points[1].y-p.y;else if(i===count-1)d.y=p.y-a.y;else{const l=p.y-a.y,r=b.y-p.y;d.y=l*r<=0?0:2*l*r/(l+r);}return d;
 });
 return{getPoint(t){
  t=clamp(t);const at=t*(count-1),i=Math.min(count-2,Math.floor(at)),q=at-i,q2=q*q,q3=q2*q,A=2*q3-3*q2+1,B=q3-2*q2+q,C=-2*q3+3*q2,D=q3-q2;
  const p=points[i].clone().multiplyScalar(A).addScaledVector(slopes[i],B).addScaledVector(points[i+1],C).addScaledVector(slopes[i+1],D);
  if(foreheadRoute){const clear=patchFaceZ124(forehead,p.x,p.y)+.032,delta=clear-p.z,gate=smooth(-.34,-.22,p.y)*(1-smooth(1.35,1.48,p.y));p.z+=.5*(delta+Math.hypot(delta,.004))*gate;}
  return p;
 },getTangent(t){return this.getPoint(Math.min(1,t+.0001)).sub(this.getPoint(Math.max(0,t-.0001))).normalize();}};
}
function buildCrownPatch124(crown,forehead,guides,coverage,fine){
 const random=rng(124719),base=new THREE.Color('#50413e'),families=[],stats={version:'shared-root-to-fringe-124',families:24,strands:0,upwardExposedSamples:0,minExposedStepY:Infinity,maxAttachmentDistance:0,minAttachmentRetention:1,minInnerClearance:Infinity,paths:[]};
 const roots=[ [.565,.605,.645,.684,.723,.764,.798,.835,.867,.895,.922,.944], [.558,.598,.641,.681,.725,.765,.801,.836,.870,.900,.927,.947] ];
 const counts=[ [50,54,50,54,60,126,112,76,92,44,53,43], [50,52,48,52,52,77,80,94,82,70,49,45] ];
 const ends=[ [[-.68,-.18],[-.60,.08],[-.48,.20],[-.40,.36],[-.30,.26],[-.23,.37],[-.10,.33]], [[.66,.05],[.53,.24],[.42,.34],[.26,.23],[.16,.36],[.04,.31],[-.07,.36]] ];
 const onGuide=(g,y)=>{let lo=0,hi=1;for(let j=0;j<22;j++){const t=(lo+hi)/2;if(g.c.getPoint(t).y>y)lo=t;else hi=t;}return g.c.getPoint((lo+hi)/2);};
 for(let s=0;s<2;s++)for(let k=0;k<12;k++){
  const side=s?1:-1,u=roots[s][k],outer=k<5,phase=k*2.399+s*.91,ps=[],halfU=(k===0?roots[s][1]-u:k===11?u-roots[s][10]:(roots[s][k+1]-roots[s][k-1])*.5)*.61;
  let exit=.54+.033*Math.sin(phase*.73);
  if(outer){const exitY=s?.90:.91;let lo=.25,hi=1;for(let j=0;j<22;j++){const v=(lo+hi)/2;if(crown(side,u,v,.006).y>exitY)lo=v;else hi=v;}exit=(lo+hi)/2;}
  for(const f of[.025,.19,.40,.68,1])ps.push(crown(side,u,exit*f,.003+.009*smooth(.10,.70,f)));
  const root=ps.at(-1),rootWidth=Math.max(.023,crown(side,clamp(u+halfU),exit,.012).sub(crown(side,clamp(u-halfU),exit,.012)).lengthSq()**.5*.54);
  if(outer){
   const q=clamp((u-(s?.44:.49))/(s?.22:.215)),g=guides[(s?91:58)+Math.round(q*(s?41:32))];
   for(const y of[.66,.36,.05,-.26,-.56]){const p=onGuide(g,y);p.z+=.008*(1-smooth(.36,-.56,y));ps.push(p);}
  }else{
   const [ex,ey]=ends[s][k-5],drop=root.y-ey,bow=(s?.038:-.020)+.020*Math.sin(phase*.73),lift=.042+.014*Math.sin(phase*.59);
   for(const a of[.22,.48,.76,1]){
    const x=mix(root.x,ex,a)+bow*Math.sin(Math.PI*a),y=mix(root.y,ey,a),z=patchFaceZ124(forehead,x,y)+.033+lift*Math.sin(Math.PI*a);ps.push(V(x,y,z));
   }
  }
  const c=fallingPatchCurve124(ps,forehead,!outer),rootT=4/(ps.length-1),color=base.clone().multiplyScalar(.985+.013*Math.sin(phase*.71)),g={side,u,k,outer,c,phase,rootT,exit,halfU,rootWidth,color,count:counts[s][k],tail:.83+.13*(.5+.5*Math.sin(phase*.61))};
  const widthAt=t=>{
   const v=exit*clamp(t/rootT),p=crown(side,clamp(u-halfU),v,.012),q=crown(side,clamp(u+halfU),v,.012),upper=Math.max(.012,Math.sqrt(q.sub(p).lengthSq())*.56);
   const endWidth=(outer?.029:.040)+.018*(.5+.5*Math.sin(phase*1.17)),lower=mix(rootWidth,endWidth,smooth(rootT,.80,t));
   return mix(upper,lower,smooth(rootT-.055,rootT+.055,t))*(.15+.85*smooth(0,.085,t))*(.008+.992*(1-smooth(.69+.06*Math.sin(phase),1,t)));
  };
  const widths=new Float64Array(129);for(let j=0;j<=128;j++)widths[j]=widthAt(j/128);g.width=t=>{const q=clamp(t)*128,j=Math.min(127,Math.floor(q));return mix(widths[j],widths[j+1],q-j);};
  stats.maxAttachmentDistance=Math.max(stats.maxAttachmentDistance,Math.sqrt(c.getPoint(0).sub(crown(side,u,exit*.025,.002)).lengthSq()));stats.minAttachmentRetention=Math.min(stats.minAttachmentRetention,crownRetention124(u,exit*.025));
  let prior=c.getPoint(rootT);for(let j=1;j<=160;j++){const p=c.getPoint(mix(rootT,1,j/160)),dy=prior.y-p.y;stats.minExposedStepY=Math.min(stats.minExposedStepY,dy);if(dy<-1e-7)stats.upwardExposedSamples++;if(!outer&&p.y<=1.32)stats.minInnerClearance=Math.min(stats.minInnerClearance,p.z-patchFaceZ124(forehead,p.x,p.y));prior=p;}
  stats.paths.push({side,u,outer,rootT,exit,root:[root.x,root.y,root.z],end:ps.at(-1).clone(),count:g.count});families.push(g);
 }
 for(const g of families){
  const steps=44,around=8,first=coverage.p.length/3;
  for(let j=0;j<=steps;j++){
   const t=j/steps,f=frame(g.c,t,true),w=g.width(t),height=(.0045+.0035*Math.sin(Math.PI*t))*(1-smooth(.73,1,t)),inset=-.007*(1-smooth(.02,.23,t));
   for(let k=0;k<=around;k++){
    const a=k/around*TAU,p=f.p.clone().addScaledVector(f.s,w*Math.cos(a)).addScaledVector(f.n,inset+height*Math.sin(a));
    vertex(coverage,p,g.color,k/around+g.phase*.173,Math.min(1,t/g.tail),1,false);
   }
   (coverage.normalSeams??=[]).push(first+j*9,first+j*9+8);
  }
  for(let j=0;j<steps;j++)for(let k=0;k<around;k++){const a=first+j*9+k,c=a+9;coverage.i.push(a,c,a+1,a+1,c,c+1);}
  for(let k=0;k<g.count;k++){
   const lane=(k+.12+random()*.76)/g.count*2-1,phase=g.phase+(random()-.5)*.8,loose=k%5===0,cutNoise=random(),end=(loose?.73:.59)+(loose?.27:.41)*Math.pow(cutNoise,.32),ps=[];
   for(let j=0;j<=24;j++){
    const t=j/24*end,f=frame(g.c,t,true),w=g.width(t),release=smooth(g.rootT-.04,.95,t),spread=lane*w*(loose?1.28:1.02)+.0032*Math.sin(t*8.3+phase)*Math.sin(Math.PI*t)+.015*Math.sin(phase*2.1)*release*release;
    const height=(.0053+.0042*Math.sqrt(Math.max(.01,1-lane*lane)))*Math.sin(Math.PI*clamp(t/.97))+.0014,point=f.p.clone().addScaledVector(f.s,spread).addScaledVector(f.n,height);ps.push(point);
   }
   const strand=fallingPatchCurve124(ps,forehead,!g.outer),width=(loose?.00026:.00029)+random()*.00011,color=g.color.clone().multiplyScalar(.978+random()*.032);
   ribbon(fine,strand,width,color,32,true,phase,.72+random()*.19,false);stats.strands++;
  }
 }
 return stats;
}
`;
replace('export function createGroomHair({headTilt=-.17,headShiftX=.26,shoulderContact=0,guidePlacement=0}={}){',helpers+'\nexport function createGroomHair({headTilt=-.17,headShiftX=.26,shoulderContact=0,guidePlacement=0,crownPatch124=0}={}){');
replace(" const start=performance.now(),root=new THREE.Group();root.name='Original reference-directed chestnut layered groom';"," const start=performance.now(),root=new THREE.Group(),patchActive124=Number(crownPatch124)>0;root.name='Original reference-directed chestnut layered groom';");
replace('const feather=1-smooth(.875,1,v)*smooth(.38,.56,u)*.999;','const feather=(1-smooth(.875,1,v)*smooth(.38,.56,u)*.999)*(patchActive124?crownRetention124(u,v):1);');
replace('const u=(k+.15+random()*.70)/1150,phase=random()*TAU,end=.985+random()*.015,ps=[];','const u=(k+.15+random()*.70)/1150,phase=random()*TAU,oldEnd=.985+random()*.015,end=patchActive124?crownFiberEnd124(u,phase,oldEnd):oldEnd,ps=[];');
replace('if(loose){const taperNoise=random();ribbon(fringe,strand,.00027+widthNoise*.00014,col,20,true,phase,.72+taperNoise*.18,false);','if(loose){const taperNoise=random();if(!patchActive124)ribbon(fringe,strand,.00027+widthNoise*.00014,col,20,true,phase,.72+taperNoise*.18,false);');
replace('else if(keepCore){roundFiber(fringe,strand,.00033+widthNoise*.00020,col,20,.69+.14*noise);','else if(keepCore){if(!patchActive124)roundFiber(fringe,strand,.00033+widthNoise*.00020,col,20,.69+.14*noise);');
replace('  ribbon(wisps,curve(ps),.00039+random()*.00023,pick().multiplyScalar(.93),24,true,k,.79);fiberCount++;',
'  const width=.00039+random()*.00023,col=pick().multiplyScalar(.93);if(!patchActive124||u<.56){ribbon(wisps,curve(ps),width,col,24,true,k,.79);fiberCount++;}');
replace(' const temple=farTempleLayer(crown,guides,mass,detail,headTilt);fiberCount+=temple.fibers;',
' const temple=farTempleLayer(crown,guides,mass,detail,headTilt);fiberCount+=temple.fibers;\n const coverage124=patchActive124?batch():null,patchStats124=patchActive124?buildCrownPatch124(crown,forehead,guides,coverage124,fringe):{version:"shared-root-to-fringe-124",enabled:false};\n if(patchActive124)fiberCount+=patchStats124.strands-fringeStats108.roundCores-fringeStats108.fineCompanions;');
replace(' root.children[root.children.length-2].renderOrder=3;root.children[root.children.length-1].renderOrder=4;',
' root.children[root.children.length-2].renderOrder=3;root.children[root.children.length-1].renderOrder=4;\n if(patchActive124){const coverageMaterial=fringeMaterial.clone();coverageMaterial.map=patchCoverageMap124();coverageMaterial.alphaTest=.12;coverageMaterial.alphaToCoverage=true;root.add(makeMesh(coverage124,coverageMaterial,"Continuous root-to-fringe replacement families124",headTilt,true,false));}');
replace(' root.userData.fringeDistribution108=fringeStats108;',
' root.userData.fringeDistribution108=fringeStats108;\n root.userData.crownPatch124={...patchStats124,enabled:patchActive124,strength:patchActive124?1:0,legacyFringeReplaced:patchActive124,forwardCrownAlphaReplaced:patchActive124,crownUV0Unchanged:true};\n if(patchActive124){root.userData.fringeStrands=patchStats124.strands;root.userData.roundedFringe=false;root.userData.source+=" The124 front patch replaces the old exposed sheet and fringe with shared dense-root and fine-end paths; its original procedural coverage is separate from100 source color.";}');
fs.writeFileSync('review/hair-groom-candidate124.js',source);
console.log(JSON.stringify({written:'review/hair-groom-candidate124.js',bytes:Buffer.byteLength(source)}));
