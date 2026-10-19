import fs from 'node:fs';
import crypto from 'node:crypto';
const base='review/hair-groom-candidate133.js',out='review/hair-groom-candidate136.js';
let source=fs.readFileSync(base,'utf8');
const expected='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d';
if(crypto.createHash('sha256').update(source).digest('hex')!==expected)throw new Error('Frozen133 base changed');
function replace(a,b){if(source.split(a).length!==2)throw new Error('136 expected one marker: '+a.slice(0,100));source=source.replace(a,b);}
source="import { applyCrownDeparture136 } from '../review/crown-departure-candidate136.js';\n"+source;
replace('guidePlacement=0,diagonalFringe133=0}={})','guidePlacement=0,diagonalFringe133=0,crownDeparture136=0}={})');
replace(' // Existing crown fibers gather into shared flowing families.',' const crownRows136=[],bowReferences136=[];\n let departure136=null;\n // Existing crown fibers gather into shared flowing families.');
replace('ribbon(detail,curve(ps),.00048+random()*.00028,pick(),26,false,phase,.96);fiberCount++;','const fiberCurve=curve(ps),fiberWidth=.00048+random()*.00028,fiberColor=pick(),first136=detail.p.length/3;\n  ribbon(detail,fiberCurve,fiberWidth,fiberColor,26,false,phase,.96);fiberCount++;\n  if(crownDeparture136)crownRows136.push({side,k,u,phase,end,points:ps,c:fiberCurve,width:fiberWidth,first:first136});');
replace('fringeStats108.sourceSlots++;','fringeStats108.sourceSlots++;\n   if(crownDeparture136)bowReferences136.push({group,lane,u,c:strand,loose,keepCore});');
replace(' // Short edge hairs continue the crown tangent into sparse outer wisps.',' if(crownDeparture136)departure136=applyCrownDeparture136({THREE,crown,crownBatch,detail,fringe,rows:crownRows136,bows:bowReferences136,frame,forehead,strength:crownDeparture136});\n // Short edge hairs continue the crown tangent into sparse outer wisps.');
replace(' root.userData.fringeDistribution108=fringeStats108;',' root.userData.fringeDistribution108=fringeStats108;\n if(departure136){root.userData.crownDeparture136={...departure136};delete root.userData.crownDeparture136.chosen;delete root.userData.crownDeparture136.mask136;delete root.userData.crownDeparture136.ribbonRanges;}');
fs.writeFileSync(out,source);
console.log(JSON.stringify({file:out,bytes:Buffer.byteLength(source),sha256:crypto.createHash('sha256').update(source).digest('hex')}));
