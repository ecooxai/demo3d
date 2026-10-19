import fs from 'node:fs';
import {THREE,read} from './torso-depth110-harness.mjs';
export {THREE,read};
export const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
export const cloth=new Function('THREE',read('src/blouse.js')+'\nreturn {sampleBlouseFrontAtXY,surface,clothGeometry,torsoPoint,collarPoint,facingPoint,solidifyGrid,broadenShoulders};')(THREE);
export const createHairContact=new Function('sampleBlouseFrontAtXY',read('src/hair-contact.js')+'\nreturn createHairContact;')(cloth.sampleBlouseFrontAtXY);
export const fit=new Function('sampleBlouseFrontAtXY',read('review/guide-placement-candidate118.js')+'\nreturn {fitLowerGuides118,protectUpperFiber118};')(cloth.sampleBlouseFrontAtXY);

export function construct(strength,{baseline=false,pathsOnly=false}={}){
 let source=read(baseline?'src/hair-groom.js':'review/hair-groom-candidate118.js');
 if(pathsOnly){
  source=source.replace('guides.push(g);longLock(mass,g);return g;','guides.push(g);return g;');
  const stop=source.indexOf(baseline?' // Fine surface strands share each lock':' for(const g of guides)longLock(mass,g);');
  if(stop<0)throw Error('118 source-only path boundary changed.');
  source=source.slice(0,stop)+'return {guides,section:lockSection,contact,metrics:typeof guidePlacement118!=="undefined"?guidePlacement118:null};}';
 }else{
  source=source.replace('m.receiveShadow=true;return m;','m.receiveShadow=true;m.__rawPosition=new Float32Array(b.p);return m;');
  source=source.replace(' return root;',' root.__guides=guides;root.__section=lockSection;root.__contact=contact;return root;');
 }
 return new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118)({headShiftX:.26,shoulderContact:.35,guidePlacement:strength});
}
export const metadata=()=>Object.fromEntries(['src/hair-groom.js','src/hair-contact.js','src/blouse.js','review/hair-groom-candidate118.js','review/guide-placement-candidate118.js'].map(p=>[p,{bytes:fs.statSync(p).size}]));
