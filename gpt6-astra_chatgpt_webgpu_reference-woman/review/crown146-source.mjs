import{THREE,read,faceZ,createHairContact,fit}from'./guide-placement118-source.mjs';
export{THREE,read,faceZ};
export const createCrownFlow146=new Function(read('review/crown-flow-candidate146.js')+'\nreturn createCrownFlow146;')();
export function construct146(strength=1,{baseline=false}={}){
 let source=read(baseline?'review/hair-groom-candidate133.js':'review/hair-groom-candidate146.js');
 source=source.replace('m.receiveShadow=true;return m;','m.receiveShadow=true;m.__rawPosition=new Float32Array(b.p);return m;');
 if(!baseline)source=source.replace(' return root;',' root.__flow146=flow146;root.__fringePaths146=fringePaths146;root.__protectedCrown146=protectedCrown146;root.__crown146=crown;root.__forehead146=forehead;return root;');
 const make=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','createCrownFlow146',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,createCrownFlow146);
 return make({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,crownFlow146:strength});
}
