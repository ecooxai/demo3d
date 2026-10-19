import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
export {THREE,read,faceZ};
export const createCrownChart142=new Function(read('review/crown-chart-candidate142.js')+'\nreturn createCrownChart142;')();
export function fields142(){
 const source=read('review/hair-groom-candidate133.js');
 const fields=new Function('THREE','faceZ',source.slice(0,source.indexOf('function makeMaps()'))+'\nconst forehead=foreheadField();return{forehead,crown:crownField(forehead)};')(THREE,faceZ);
 return{...fields,chart:createCrownChart142({THREE,base:fields.crown,forehead:fields.forehead,strength:1})};
}
export function construct142(strength=1){
 let source=read('review/hair-groom-candidate142.js');
 source=source.replace('m.receiveShadow=true;return m;','m.receiveShadow=true;m.__rawPosition=new Float32Array(b.p);return m;');
 source=source.replace(' return root;',' root.__chart142=chart142;root.__crown142=crown;root.__forehead142=forehead;root.__crownFibers142=crownFibers142;root.__protectedCrown142=protectedCrown142;return root;');
 const make=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','createCrownChart142',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,createCrownChart142);
 return make({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,crownChart142:strength});
}
