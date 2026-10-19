import fs from 'node:fs';
import {THREE,read,Matrix4,object,attach,I} from './torso-depth110-harness.mjs';
export {THREE,read};
THREE.Matrix4=Matrix4;

const cloth=new Function('THREE',read('src/blouse.js')+'\nreturn {surface,solidifyGrid,torsoPoint,collarPoint,facingPoint,broadenShoulders,placketX,bodyAtXY,sampleBlouseFrontAtXY};')(THREE);
export {cloth};
const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
const contact=new Function('sampleBlouseFrontAtXY',read('src/hair-contact.js')+'\nreturn createHairContact;')(cloth.sampleBlouseFrontAtXY);
const fit=new Function('sampleBlouseFrontAtXY',read('src/lower-guide-placement.js')+'\nreturn {fitLowerGuides118,protectUpperFiber118};')(cloth.sampleBlouseFrontAtXY);
const makeHelper143=coefficients=>new Function('THREE','sampleBlouseFrontAtXY','CURTAIN143_COEFFICIENTS',read('review/near-curtain-paths143.js')+'\nreturn {prepareNearCurtain143,nearSection143,nearCurtainRawVertex143,attachNearFiber143,attachNearFlyaway143,CURTAIN143_SPEC,lateral143,field143,entryJet,pointAtHeight};')(THREE,cloth.sampleBlouseFrontAtXY,coefficients);
const coefficientText=read('review/near-curtain143-coefficients.js');
export const frozen143=new Function(coefficientText+';return CURTAIN143_COEFFICIENTS;')();
export const helper=makeHelper143(frozen143);
export {makeHelper143};

// Exact accepted collar/facing/placket source triangles, with the same width
// transform. Native143 reads the full real blouse including its small seams.
// The omitted local button batches are central and outside this near curtain.
export function sourceBlouse({includeBody=false}={}){
 const group=object('original-tailored-white-cotton-blouse');
 const add=(name,g)=>attach(group,name,g,I());
 if(includeBody)add('blouse-continuous-torso-and-sleeves',cloth.surface(192,112,cloth.torsoPoint));
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

export function construct143(enabled,{baseline=false,massOnly=false,capture=true,coefficients=frozen143}={}){
 let source=read(baseline?'review/hair-groom-base143.js':'review/hair-groom-candidate143.js');
 if(capture)source=source.replace('m.receiveShadow=true;return m;','m.receiveShadow=true;m.__rawPosition=new Float32Array(b.p);return m;');
 source='let currentOwner143=null;const ribbons143=[];\n'+source;
 source=source.replace(' const first=b.p.length/3;\n for(let j=0;j<=steps;j++){',' const first=b.p.length/3;\n if(currentOwner143!==null)ribbons143.push({guide:currentOwner143,from:first,to:first+(steps+1)*2,steps,curve:c,width,phase,tip,deformEar});\n for(let j=0;j<=steps;j++){');
 source=source.replace(' if(samples)c.recordRange143(first,samples);',' if(samples)c.recordRange143(first,samples);\n if(currentOwner143!==null)ribbons143.push({guide:currentOwner143,from:first,to:first+(last+1)*2,steps,last,samples,curve:c,width,phase,tip,deformEar});');
 source=source.replace("  const count=g.kind==='front'?43:","  currentOwner143=guides.indexOf(g);\n  const count=g.kind==='front'?43:");
 source=source.replace(' // Existing crown fibers gather',' currentOwner143=null;\n // Existing crown fibers gather');
 source=source.replace('  for(let j=0;j<=12;j++){const t=j/12,at=', '  currentOwner143=guides.indexOf(g);\n  for(let j=0;j<=12;j++){const t=j/12,at=');
 source=source.replace(' const temple=farTempleLayer(', ' currentOwner143=null;\n const temple=farTempleLayer(');
 if(massOnly){const end=source.indexOf(" // Fine surface strands share each lock's shape");if(end<0)throw Error('143 source boundary changed.');source=source.slice(0,end)+" const mesh=makeMesh(mass,material,'MASS',headTilt,true,true,contact);return{mesh,guides,section:lockSection,contact,toModel:typeof toModel143==='undefined'?null:toModel143,metrics:typeof nearCurtainResult143==='undefined'?null:nearCurtainResult143};}";}
 else source=source.replace(' return root;',' root.__guides=guides;root.__section=lockSection;root.__contact=contact;root.__ribbons=ribbons143;root.__toModel=typeof toModel143===\'undefined\'?null:toModel143;return root;');
 const activeHelper=makeHelper143(coefficients),injected={...activeHelper};
 if(capture)injected.attachNearFiber143=(g,legacy,parameters)=>{const c=activeHelper.attachNearFiber143(g,legacy,parameters);if(g.near143)c.__surface143={g,legacy,...parameters};return c;};
 return new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',...Object.keys(injected),source+'\nreturn createGroomHair;')(THREE,faceZ,contact,fit.fitLowerGuides118,fit.protectUpperFiber118,...Object.values(injected))({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,nearCurtain143:enabled,});
}

export const ids143=[...Array.from({length:33},(_,k)=>58+k),...Array.from({length:6},(_,k)=>133+k),154,155,...Array.from({length:28},(_,k)=>172+k)];
export const selected143=new Set(ids143);
