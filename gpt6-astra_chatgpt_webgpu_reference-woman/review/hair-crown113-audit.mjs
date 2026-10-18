import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const prefix=fs.readFileSync('review/hair-contact86-audit.mjs','utf8').split('const baseline=construct(')[0].replace(/^import[^\n]*\n/gm,'');
const {THREE,read,faceZ}=new Function('fs','assert',prefix+'\nreturn {THREE,read,faceZ};')(fs,assert);
const blouse=read('review/blouse-candidate98.js').replace('const OUTER_WIDTH98=0;','const OUTER_WIDTH98=.12;');
const sampleBlouseFrontAtXY=new Function('THREE',blouse+'\nreturn sampleBlouseFrontAtXY;')(THREE);
const createHairContact=new Function('sampleBlouseFrontAtXY',read('review/hair-contact-candidate86.js')+'\nreturn createHairContact;')(sampleBlouseFrontAtXY);
const hash=a=>crypto.createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const equal=(a,b)=>a.byteLength===b.byteLength&&hash(a)===hash(b);
function construct(file){
 let source=read(file);
 source=source.replace(' // Existing crown fibers gather',' const crownFineStart109=detail.p.length/3;\n // Existing crown fibers gather');
 source=source.replace(' // Retain94\'s accepted bowed',' root.__crownFineRange=[crownFineStart109,detail.p.length/3];\n // Retain94\'s accepted bowed');
 source=source.replace('const roots109=layeredRoots109(crown,detail);','const roots109=layeredRoots109(crown,detail);root.__newRootPaths=roots109.paths;');
 return new Function('THREE','faceZ','createHairContact',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact)({shoulderContact:.35});
}
const started=performance.now(),cpuStart=process.cpuUsage(),baseline=construct('review/hair-groom-candidate108.js'),candidate=construct('review/hair-groom-candidate113.js');
assert.deepEqual(candidate.__crownFineRange,baseline.__crownFineRange);
const meshes=[],changedFine={vertices:0,maximumDisplacement:0,minimumY:Infinity,maximumY:-Infinity};let finite=true,alphaChanged=0,alphaRange=[1,0];
for(let m=0;m<candidate.children.length;m++){
 const now=candidate.children[m],g=now.geometry,old=baseline.children[m]?.geometry;
 for(const a of Object.values(g.attributes))for(const v of a.array)if(!Number.isFinite(v))finite=false;
 const changes=[];
 if(old){
  for(const key of Object.keys(old.attributes)){
   const a=old.attributes[key].array,b=g.attributes[key].array;if(!equal(a,b))changes.push(key);
   if([1,3,4].includes(m)||m===0&&key!=='color')assert(equal(a,b),`Unexpected change in mesh${m}/${key}`);
  }
  if(m!==2)assert(equal(g.index.array,old.index.array),`Index${m} changed`);
  for(const key of['roughness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','transparent','opacity','alphaTest','alphaToCoverage','side'])assert.equal(now.material[key],baseline.children[m].material[key]);
  for(const key of['map','normalMap'])if(baseline.children[m].material[key])assert(equal(now.material[key].image.data,baseline.children[m].material[key].image.data));
 }
 meshes.push({name:now.name,vertices:g.attributes.position.count,triangles:g.index.count/3,changedAttributes:changes});
}
assert(finite);
const c0=baseline.children[0].geometry.attributes.color,c1=candidate.children[0].geometry.attributes.color,uv=candidate.children[0].geometry.attributes.uv;
for(let i=0;i<c1.count;i++){
 for(let ch=0;ch<3;ch++)assert.equal(c0.array[i*4+ch],c1.array[i*4+ch]);
 const a=c1.array[i*4+3],b=c0.array[i*4+3];assert(a>=0&&a<=b+1e-7);alphaRange[0]=Math.min(alphaRange[0],a);alphaRange[1]=Math.max(alphaRange[1],a);
 if(a!==b){alphaChanged++;assert(i>=7685);assert(uv.getX(i)>.668&&uv.getX(i)<.977);assert(uv.getY(i)/.73>.60);}
}
const d0=baseline.children[2].geometry,d1=candidate.children[2].geometry,[first,last]=candidate.__crownFineRange;
for(const key of ['color','uv'])assert(equal(d0.attributes[key].array,d1.attributes[key].array.subarray(0,d0.attributes[key].array.length)));
assert(equal(d0.index.array,d1.index.array.subarray(0,d0.index.array.length)));
for(let i=0;i<d0.attributes.position.count;i++){
 let delta=0;for(let ch=0;ch<3;ch++)delta+=(d1.attributes.position.array[i*3+ch]-d0.attributes.position.array[i*3+ch])**2;
 if(delta>0){assert(i>=first&&i<last);changedFine.vertices++;changedFine.maximumDisplacement=Math.max(changedFine.maximumDisplacement,Math.sqrt(delta));changedFine.minimumY=Math.min(changedFine.minimumY,d1.attributes.position.getY(i));changedFine.maximumY=Math.max(changedFine.maximumY,d1.attributes.position.getY(i));}
 if(i<first||i>=last)for(let ch=0;ch<3;ch++)assert.equal(d1.attributes.normal.array[i*3+ch],d0.attributes.normal.array[i*3+ch]);
}
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const face=new Function('THREE',read('src/face.js')+'\nreturn {profile,portraitY,faceZ};')(THREE);
const skinY=y=>{const p=face.portraitY(y),q=clamp((.05-p)/.18),w=q*q*(3-2*q);return p-.06*(p-.05)*w;};
const originalY=y=>{let a=-1.18,b=1.54;for(let j=0;j<28;j++){const c=(a+b)/2;if(skinY(c)<y)a=c;else b=c;}return(a+b)/2;};
function checkGeometry(g,firstVertex=0){
 const p=g.attributes.position,n=g.attributes.normal,index=g.index.array,report={vertices:0,skinTested:0,skinPenetrations:0,minimumSkinClearance:Infinity,normalLength:[Infinity,0],minimumTriangleArea:Infinity,degenerateTriangles:0,bounds:{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]}};
 for(let i=firstVertex;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),l=Math.hypot(n.getX(i),n.getY(i),n.getZ(i));report.vertices++;report.normalLength[0]=Math.min(report.normalLength[0],l);report.normalLength[1]=Math.max(report.normalLength[1],l);
  for(let k=0;k<3;k++){report.bounds.min[k]=Math.min(report.bounds.min[k],p.array[i*3+k]);report.bounds.max[k]=Math.max(report.bounds.max[k],p.array[i*3+k]);}
  if(y>.14&&y<1.50){const oy=originalY(y),width=face.profile(oy)[0];if(Math.abs(x)<width*.997){const gap=z-face.faceZ(x,oy);report.skinTested++;report.minimumSkinClearance=Math.min(report.minimumSkinClearance,gap);if(gap<-.0005)report.skinPenetrations++;}}
 }
 for(let i=0;i<index.length;i+=3){
  if(index[i]<firstVertex||index[i+1]<firstVertex||index[i+2]<firstVertex)continue;
  const a=index[i]*3,b=index[i+1]*3,c=index[i+2]*3,ux=p.array[b]-p.array[a],uy=p.array[b+1]-p.array[a+1],uz=p.array[b+2]-p.array[a+2],vx=p.array[c]-p.array[a],vy=p.array[c+1]-p.array[a+1],vz=p.array[c+2]-p.array[a+2],area=.5*Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx);
  report.minimumTriangleArea=Math.min(report.minimumTriangleArea,area);if(area<1e-14)report.degenerateTriangles++;
 }
 assert(report.normalLength[0]>.9999998&&report.normalLength[1]<1.0000002);assert.equal(report.degenerateTriangles,0);return report;
}

// Intersect the actual tessellated outer crown in head-local XY at each final
// carrier ring. This checks coverage and depth, not just its analytic path.
function checkBuriedEnds(root){
 const crown=root.children[0].geometry,body=root.children[5].geometry,p=crown.attributes.position,uv=crown.attributes.uv,colors=crown.attributes.color,index=crown.index.array,q=body.attributes.position,texture=root.children[0].material.map.image,triangles=[];
 const bins=Array.from({length:48*40},()=>[]),xmin=-1.05,ymin=.30,dx=2.1/48,dy=1.4/40;
 for(let k=0;k<index.length;k+=3){
  const a=index[k],b=index[k+1],c=index[k+2];
  const ax=p.getX(a),ay=p.getY(a),bx=p.getX(b),by=p.getY(b),cx=p.getX(c),cy=p.getY(c),den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-12)continue;
  const t={a,b,c,ax,ay,bx,by,cx,cy,den},id=triangles.length;triangles.push(t);
  const x0=clamp(Math.floor((Math.min(ax,bx,cx)-xmin)/dx),0,47),x1=clamp(Math.floor((Math.max(ax,bx,cx)-xmin)/dx),0,47),y0=clamp(Math.floor((Math.min(ay,by,cy)-ymin)/dy),0,39),y1=clamp(Math.floor((Math.max(ay,by,cy)-ymin)/dy),0,39);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)bins[y*48+x].push(id);
 }
 const mapAlpha=(u,v)=>{
  const w=texture.width,h=texture.height,x=(u-Math.floor(u))*w-.5,y=clamp(v*h-.5,0,h-1),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const sample=(xx,yy)=>texture.data[(clamp(yy,0,h-1)*w+((xx%w)+w)%w)*4+3]/255;
  return(sample(ix,iy)*(1-fx)+sample(ix+1,iy)*fx)*(1-fy)+(sample(ix,iy+1)*(1-fx)+sample(ix+1,iy+1)*fx)*fy;
 };
 const count=q.count/297;assert.equal(count,39);
 const report={carriers:count,ringsPerCarrier:3,testedVertices:0,unsupportedVertices:0,exposedVertices:0,minimumDepthBelowCrown:Infinity,maximumDepthBelowCrown:0,minimumEffectiveBedAlpha:1,examples:[]};
 for(let g=0;g<count;g++)for(let j=30;j<=32;j++)for(let lane=0;lane<8;lane++){
  const i=g*297+j*9+lane,x=q.getX(i),y=q.getY(i),z=q.getZ(i),bx=clamp(Math.floor((x-xmin)/dx),0,47),by=clamp(Math.floor((y-ymin)/dy),0,39);let hit=null,front=null;
  for(const id of bins[by*48+bx]){
   const t=triangles[id],a=((t.by-t.cy)*(x-t.cx)+(t.cx-t.bx)*(y-t.cy))/t.den,b=((t.cy-t.ay)*(x-t.cx)+(t.ax-t.cx)*(y-t.cy))/t.den,c=1-a-b;if(Math.min(a,b,c)<-1e-7)continue;
   const depth=a*p.getZ(t.a)+b*p.getZ(t.b)+c*p.getZ(t.c),u=a*uv.getX(t.a)+b*uv.getX(t.b)+c*uv.getX(t.c),v=a*uv.getY(t.a)+b*uv.getY(t.b)+c*uv.getY(t.c),vertexAlpha=a*colors.array[t.a*4+3]+b*colors.array[t.b*4+3]+c*colors.array[t.c*4+3],alpha=vertexAlpha*mapAlpha(u,v);
   if(!front||depth>front.depth)front={depth,alpha,u,v};
   // Several charts can overlap in XY. A translucent foremost chart must not
   // hide a second, opaque supporting crown layer in this diagnostic.
   if(depth>z+.001&&(!hit||alpha>hit.alpha))hit={depth,alpha,u,v};
  }
  report.testedVertices++;if(!hit){report.unsupportedVertices++;if(report.examples.length<20&&!report.examples.some(e=>e.carrier===g))report.examples.push({carrier:g,ring:j,lane,x,y,z,front});continue;}
  const gap=hit.depth-z;report.minimumDepthBelowCrown=Math.min(report.minimumDepthBelowCrown,gap);report.maximumDepthBelowCrown=Math.max(report.maximumDepthBelowCrown,gap);report.minimumEffectiveBedAlpha=Math.min(report.minimumEffectiveBedAlpha,hit.alpha);if(gap<=.001||hit.alpha<.50){report.exposedVertices++;if(report.examples.length<20&&!report.examples.some(e=>e.carrier===g))report.examples.push({carrier:g,ring:j,lane,x,y,z,gap,alpha:hit.alpha,uv:[hit.u,hit.v]});}
 }
 if(report.unsupportedVertices||report.exposedVertices)console.log(JSON.stringify({carrierEndBurialFailure:report}));
 assert.equal(report.unsupportedVertices,0);assert.equal(report.exposedVertices,0);return report;
}

const carriers=checkGeometry(candidate.children[5].geometry),newFine=checkGeometry(d1,d0.attributes.position.count);
assert.equal(carriers.skinPenetrations,0);assert.equal(newFine.skinPenetrations,0);
const prior109=construct('review/hair-groom-candidate109.js');
for(const key of Object.keys(candidate.children[2].geometry.attributes))assert(equal(candidate.children[2].geometry.attributes[key].array,prior109.children[2].geometry.attributes[key].array),`109 fine geometry changed: ${key}`);
assert(equal(candidate.children[2].geometry.index.array,prior109.children[2].geometry.index.array));
const burial=checkBuriedEnds(candidate);
const cpu=process.cpuUsage(cpuStart),result={native:false,sourceHarness:true,base:'frozen108',cloth:'width98 .12 with unchanged86 contact .35',finite,meshes,crown:{positionsNormalsUV0IndexRGBMapsExact:true,foundationExact:true,vertexAlphaChanged:alphaChanged,alphaRange,textureCoverageBytesUnchanged:true,export104LayoutUnchanged:true},fine:{oldCrownRange:[first,last],changed:changedFine,oldOtherFibersExact:true,appended:newFine},newCarriers:carriers,transition:candidate.userData.crownTransition113,unchangedMassFringeWispsContactTemple:true,unchangedMaterials:true,fine109FullyExact:true,carrierEndBurial:burial,geometry:{triangles:candidate.userData.triangles,triangleDelta:candidate.userData.triangles-baseline.userData.triangles,MiB:candidate.userData.geometryMiB,MiBDelta:Number((candidate.userData.geometryMiB-baseline.userData.geometryMiB).toFixed(2)),constructionMs:candidate.userData.constructionMs},cost:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,rssMiB:process.memoryUsage().rss/1048576},limitations:['Source harness is not native Three/WebGPU; art acceptance requires five native views.','Skin clearance is a projected primary-face check on new geometry, excluding the outer silhouette and accessory meshes.','Crown vertex-alpha changes need native104 edge review even though UV charts and its alpha merge algorithm are unchanged.']};
fs.writeFileSync('review/hair-crown113-source-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
