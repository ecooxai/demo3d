import {THREE,read} from './torso-depth110-harness.mjs';
import {sourceEar} from './near-ear115-source.mjs';
export {THREE,read};
const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
const cloth=new Function('THREE',read('src/blouse.js')+'\nreturn {sampleBlouseFrontAtXY};')(THREE);
const createHairContact=new Function('sampleBlouseFrontAtXY',read('src/hair-contact.js')+'\nreturn createHairContact;')(cloth.sampleBlouseFrontAtXY);
const fit=new Function('sampleBlouseFrontAtXY',read('src/lower-guide-placement.js')+'\nreturn {fitLowerGuides118,protectUpperFiber118};')(cloth.sampleBlouseFrontAtXY);
export const coefficients=new Function(read('review/near-ear144-coefficients.js')+'\nreturn ROUTE144_COEFFICIENTS;')();
export const helper=new Function('ROUTE144_COEFFICIENTS',read('review/near-ear-route-candidate144.js')+'\nreturn {prepareNearEar144,regularSample144,flyawaySample144,nearEar144OffMetrics,sampleNearEar144,ROUTE144_SPEC};')(coefficients);

export function construct144(strength,{baseline=false,selectedOnly=false,capture=true}={}){
 let source=read(baseline?'review/hair-groom-candidate133.js':'review/hair-groom-candidate144.js');
 if(capture)source=source.replace('m.receiveShadow=true;return m;','m.receiveShadow=true;m.__rawPosition=new Float32Array(b.p);return m;');
 source='let currentOwner144=null;const ribbons144=[];\n'+source;
 source=source.replace(' const first=b.p.length/3;\n for(let j=0;j<=steps;j++){',' const first=b.p.length/3;\n if(currentOwner144===138)ribbons144.push({guide:currentOwner144,from:first,to:first+(steps+1)*2,steps,curve:c,width,phase,tip,deformEar});\n for(let j=0;j<=steps;j++){');
 source=source.replace("  const count=g.kind==='front'?43:","  currentOwner144=guides.indexOf(g);\n  const count=g.kind==='front'?43:");
 source=source.replace(' // Existing crown fibers gather',' currentOwner144=null;\n // Existing crown fibers gather');
 source=source.replace('  for(let j=0;j<=12;j++){const t=j/12,at=', '  currentOwner144=guides.indexOf(g);\n  for(let j=0;j<=12;j++){const t=j/12,at=');
 source=source.replace(' const temple=farTempleLayer(', ' currentOwner144=null;\n const temple=farTempleLayer(');
 if(selectedOnly){
  const stop=source.indexOf(' // Fit only original lower front/inner/curl curves');
  source=source.slice(0,stop)+"const selected=batch();longLock(selected,guides[138]);const mesh=makeMesh(selected,material,'Selected original guide138',headTilt,true,true,null);return{mesh,guides,section:lockSection,route:typeof earRoute144==='undefined'?null:earRoute144};}";
 }else source=source.replace(' return root;',' root.__guides=guides;root.__section=lockSection;root.__contact=contact;root.__ribbons144=ribbons144;root.__route144=typeof earRoute144===\'undefined\'?null:earRoute144;return root;');
 return new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',...Object.keys(helper),source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,...Object.values(helper))({headShiftX:.26,shoulderContact:selectedOnly?0:.35,guidePlacement:.5,diagonalFringe133:1,nearEar144:strength});
}

export const balance144=[-.24*Math.cos(.16)*Math.cos(-.17),.24*Math.cos(.16)*Math.sin(-.17),-.24*Math.sin(.16)];
// Exact current115 ear source with the same Float32 yaw and99 roundings.
export function acceptedEar144(){
 const mesh=sourceEar(-1),p=mesh.geometry.getAttribute('position');
 const sample=new Function(read('src/near-ear.js')+'\nreturn sample;')(),out=new Float64Array(8);
 for(let i=0;i<p.count;i++){sample(p.getX(i),p.getZ(i),-25*Math.PI/180,out);p.setXYZ(i,Math.fround(out[0])+balance144[0],p.getY(i)+balance144[1],Math.fround(out[1])+balance144[2]);}
 return mesh.geometry;
}
export function toPostHead144(mesh){
 const p=mesh.geometry.getAttribute('position'),xyz=new Float32Array(p.array.length);
 for(let i=0;i<p.count;i++)for(let k=0;k<3;k++)xyz[i*3+k]=p.array[i*3+k]+balance144[k];
 return xyz;
}
