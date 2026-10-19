import fs from 'node:fs';
import crypto from 'node:crypto';
const path='review/hair-groom-candidate133.js';
let source=fs.readFileSync(path,'utf8');
if(crypto.createHash('sha256').update(source).digest('hex')!=='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d')throw Error('156 requires frozen accepted133.');
function replace(a,b){if(source.split(a).length!==2)throw Error('156 expected one marker: '+a.slice(0,100));source=source.replace(a,b);}
source="import { createFrontCapture156 } from '../review/front-root-candidate156.js';\n"+source;
replace('guidePlacement=0,diagonalFringe133=0}={})','guidePlacement=0,diagonalFringe133=0,captureFront156=false}={})');
replace(" const palette=['#4c403c'"," const capture156=captureFront156?createFrontCapture156({headTilt}):null;\n const palette=['#4c403c'");
replace('  ribbon(detail,curve(ps),.00048+random()*.00028,pick(),26,false,phase,.96);fiberCount++;',"  if(capture156&&u>=.615)capture156.detail.push({side,k,u,first:detail.p.length/3,count:54});\n  ribbon(detail,curve(ps),.00048+random()*.00028,pick(),26,false,phase,.96);fiberCount++;");
replace('   // Advance every accepted random draw, including omitted cores,',"   if(capture156&&(loose||keepCore))capture156.fringe({group,k,side,u,strand,loose,first:fringe.p.length/3,indexStart:fringe.i.length});\n   // Advance every accepted random draw, including omitted cores,");
replace('  ribbon(wisps,curve(ps),.00039+random()*.00023,pick().multiplyScalar(.93),24,true,k,.79);fiberCount++;',"  if(capture156&&u>=.615)capture156.wisps.push({side,k,u,first:wisps.p.length/3,count:50});\n  ribbon(wisps,curve(ps),.00039+random()*.00023,pick().multiplyScalar(.93),24,true,k,.79);fiberCount++;");
replace(' return root;',' if(capture156)capture156.finish(root);\n return root;');
fs.writeFileSync('review/hair-groom-candidate156.js',source);
console.log(JSON.stringify({file:'review/hair-groom-candidate156.js',bytes:Buffer.byteLength(source),sha256:crypto.createHash('sha256').update(source).digest('hex')}));
