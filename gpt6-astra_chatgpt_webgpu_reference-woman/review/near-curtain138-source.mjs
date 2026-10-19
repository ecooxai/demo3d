import fs from 'node:fs';
import {THREE,read,Matrix4,object,attach,I} from './torso-depth110-harness.mjs';
export {THREE,read};
THREE.Matrix4=Matrix4;

const cloth=new Function('THREE',read('src/blouse.js')+'\nreturn {surface,solidifyGrid,collarPoint,facingPoint,broadenShoulders,placketX,bodyAtXY,sampleBlouseFrontAtXY};')(THREE);
export {cloth};
const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
const contact=new Function('sampleBlouseFrontAtXY',read('src/hair-contact.js')+'\nreturn createHairContact;')(cloth.sampleBlouseFrontAtXY);
const fit=new Function('sampleBlouseFrontAtXY',read('src/lower-guide-placement.js')+'\nreturn {fitLowerGuides118,protectUpperFiber118};')(cloth.sampleBlouseFrontAtXY);
const helper=new Function('THREE','sampleBlouseFrontAtXY',read('review/near-curtain-paths138.js')+'\nreturn {prepareNearCurtain138,nearSection138,nearCurtainRawVertex138,attachNearFiber138,attachNearFlyaway138,garmentObstacles,triangleField};')(THREE,cloth.sampleBlouseFrontAtXY);
export {helper};

// Exact accepted collar/facing/placket source triangles, with the same width
// transform. Native138 reads the full real blouse including its small seams.
// The omitted local button batches are central and outside this near curtain.
export function sourceBlouse(){
 const group=object('original-tailored-white-cotton-blouse');
 const add=(name,g)=>attach(group,name,g,I());
 for(const side of[-1,1]){
  const collar=cloth.surface(24,48,(u,v)=>cloth.collarPoint(side,u,v));
  if(side<0){for(let i=0;i<collar.index.count;i+=3){const b=collar.index.getX(i+1);collar.index.setX(i+1,collar.index.getX(i+2));collar.index.setX(i+2,b);}collar.computeVertexNormals();}
  add(`blouse-${side<0?'left':'right'}-spread-collar`,cloth.solidifyGrid(collar,24,48,.0045));
  const facing=cloth.surface(8,48,(u,v)=>cloth.facingPoint(side,u,v));
  if(side<0){for(let i=0;i<facing.index.count;i+=3){const b=facing.index.getX(i+1);facing.index.setX(i+1,facing.index.getX(i+2));facing.index.setX(i+2,b);}facing.computeVertexNormals();}
  add(`blouse-${side<0?'left':'right'}-neck-opening-facing`,facing);
 }
 add('blouse-curved-centre-placket',cloth.solidifyGrid(cloth.surface(10,74,(u,v)=>{const y=.780+(-1.45-.780)*v,cx=cloth.placketX(y),x=cx+(u-.5)*(.174+.014*v),p=cloth.bodyAtXY(x,y);return[x,y,p[2]+.007+.006*Math.sin(u*Math.PI)**.70];}),10,74,.0045));
 cloth.broadenShoulders(group);return group;
}

export function construct138(enabled,{baseline=false,massOnly=false,capture=true}={}){
 let source=read(baseline?'src/hair-groom.js':'review/hair-groom-candidate138.js');
 if(capture)source=source.replace('m.receiveShadow=true;return m;','m.receiveShadow=true;m.__rawPosition=new Float32Array(b.p);return m;');
 source='let currentOwner138=null;const ribbons138=[];\n'+source;
 source=source.replace(' const first=b.p.length/3;\n for(let j=0;j<=steps;j++){',' const first=b.p.length/3;\n if(currentOwner138!==null)ribbons138.push({guide:currentOwner138,from:first,to:first+(steps+1)*2,steps,curve:c,width,phase,tip,deformEar});\n for(let j=0;j<=steps;j++){');
 source=source.replace(' if(samples)c.recordRange138(first,samples);',' if(samples)c.recordRange138(first,samples);\n if(currentOwner138!==null)ribbons138.push({guide:currentOwner138,from:first,to:first+(last+1)*2,steps,last,samples,curve:c,width,phase,tip,deformEar});');
 source=source.replace("  const count=g.kind==='front'?43:","  currentOwner138=guides.indexOf(g);\n  const count=g.kind==='front'?43:");
 source=source.replace(' // Existing crown fibers gather',' currentOwner138=null;\n // Existing crown fibers gather');
 source=source.replace('  for(let j=0;j<=12;j++){const t=j/12,at=', '  currentOwner138=guides.indexOf(g);\n  for(let j=0;j<=12;j++){const t=j/12,at=');
 source=source.replace(' const temple=farTempleLayer(', ' currentOwner138=null;\n const temple=farTempleLayer(');
 if(massOnly){const end=source.indexOf(" // Fine surface strands share each lock's shape");if(end<0)throw Error('138 source boundary changed.');source=source.slice(0,end)+" const mesh=makeMesh(mass,material,'MASS',headTilt,true,true,contact);return{mesh,guides,section:lockSection,contact,toModel:typeof toModel138==='undefined'?null:toModel138,metrics:typeof nearCurtainResult138==='undefined'?null:nearCurtainResult138};}";}
 else source=source.replace(' return root;',' root.__guides=guides;root.__section=lockSection;root.__contact=contact;root.__ribbons=ribbons138;root.__toModel=typeof toModel138===\'undefined\'?null:toModel138;return root;');
 const injected={...helper};
 if(capture)injected.attachNearFiber138=(g,legacy,parameters)=>{const c=helper.attachNearFiber138(g,legacy,parameters);if(g.near138)c.__surface138={g,legacy,...parameters};return c;};
 return new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',...Object.keys(injected),source+'\nreturn createGroomHair;')(THREE,faceZ,contact,fit.fitLowerGuides118,fit.protectUpperFiber118,...Object.values(injected))({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,nearCurtain138:enabled,blouseSupport138:enabled?sourceBlouse():null});
}

export const ids138=[...Array.from({length:33},(_,k)=>58+k),...Array.from({length:6},(_,k)=>133+k),...Array.from({length:28},(_,k)=>172+k)];
export const selected138=new Set(ids138);
