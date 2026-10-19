import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
export {THREE,read,faceZ};
export function construct136(strength=1,{coverageOnly=false}={}){
 const implementation=new Function(read('review/crown-departure-candidate136.js')+'\nreturn applyCrownDeparture136;')();
 const apply=args=>implementation({...args,coverageOnly});
 let source=read('review/hair-groom-candidate136.js');
 source=source.replace(' return root;',' root.__departure136=departure136;root.__rows136=crownRows136;root.__bows136=bowReferences136;root.__forehead136=forehead;root.__crown136=crown;return root;');
 const make=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','applyCrownDeparture136',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,apply);
 return make({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,crownDeparture136:strength});
}
