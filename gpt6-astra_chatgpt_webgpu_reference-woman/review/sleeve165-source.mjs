import fs from 'node:fs';
import {cloth158,helper158,sourceCollar158,Matrix4,object,I,read} from './collar158-source.mjs';
export {Matrix4,object,I,read};
export const helper165=new Function('Matrix4',read('review/sleeve-fold-candidate165.js')+'\nreturn {SLEEVE165_SPEC,sleeveFoldJet165,createSleeveSeamField165,applySleeveFold165};')(Matrix4);
export function sourceSleeve165(){
 const group=sourceCollar158();helper158.applyCollarRoll158(group,{strength:1});
 // The same existing seam construction as addTailoring in src/blouse.js.
 // Build it in the original blouse chart and run the accepted width maps once.
 const seamGroup=object('source-left-sleeve-seam-165'),points=[];
 for(let i=0;i<=48;i++){
  const t=i/48,y=1.08+(-.52-1.08)*t,x=-(1.285+.125*Math.sin(t*Math.PI*.70)),p=cloth158.bodyAtXY(x,y);p[2]+=.003;points.push(p);
 }
 cloth158.curveMesh(seamGroup,'blouse-sleeve-attachment--1',points,.0021,{name:'original-sleeve-seam'},56);
 seamGroup.traverse(o=>{o.matrixWorld=I();});cloth158.broadenShoulders(seamGroup);
 group.add(...seamGroup.children);return group;
}
export const source165Scope='Actual accepted blouse construction, width maps,154 torso fold and158 collar shape, with the original48-control-point/56-segment left sleeve seam. The original curve/tube arithmetic uses the same small established local fixture as158. Installed Three/native exact buffers remain authoritative. No reference pixels or external assets are read.';
