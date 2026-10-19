import fs from 'node:fs';
import crypto from 'node:crypto';
const sourceFile='review/hair-groom-candidate133.js',target='review/hair-groom-candidate144.js';
let source=fs.readFileSync(sourceFile,'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
if(sha(source)!=='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d')throw Error('144 requires frozen133 groom.');
function replace(a,b){if(source.split(a).length!==2)throw Error('144 expected one marker: '+a.slice(0,100));source=source.replace(a,b);}
source="import { prepareNearEar144, regularSample144, flyawaySample144, nearEar144OffMetrics } from '../review/near-ear-route-candidate144.js';\n"+source;
replace('guidePlacement=0,diagonalFringe133=0}={})','guidePlacement=0,diagonalFringe133=0,nearEar144=0}={})');
replace(' // Fit only original lower front/inner/curl curves, before any lock surfaces.',
 ' const earRoute144=prepareNearEar144(guides,{strength:nearEar144,headTilt});\n // Fit only original lower front/inner/curl curves, before any lock surfaces.');
replace("  const count=g.kind==='front'?43:","  const baseline144=earRoute144?.baselineGuide(g);\n  const count=g.kind==='front'?43:");
replace('end=.935+random()*.065,ps=[],oldPs=g.original118?[]:null;',
 'end=.935+random()*.065,ps=[],oldPs=g.original118?[]:null,basePs144=baseline144?[]:null,oldBasePs144=baseline144?.original118?[]:null;');
replace('p.x+=.024*Math.sin(phase)*tip;p.y+=tipY;p.z+=.016*Math.cos(phase)*tip;ps.push(p);',
 'p.x+=.024*Math.sin(phase)*tip;p.y+=tipY;p.z+=.016*Math.cos(phase)*tip;ps.push(p);\n    if(basePs144)basePs144.push(regularSample144(baseline144,lockSection,t,end,lane,side,phase,tip,tipY));\n    if(oldBasePs144)oldBasePs144.push(regularSample144(baseline144.original118,lockSection,t,end,lane,side,phase,tip,tipY));');
replace('   ribbon(detail,oldPs?protectUpperFiber118(curve(ps),curve(oldPs)):curve(ps),.00063+random()*.00039,pick().lerp(new THREE.Color(\'#69564b\'),k%13===0?.40:0),28,g.front,phase,.85+random()*.10,g.deformEar);fiberCount++;',
 '   let strand144=oldPs?protectUpperFiber118(curve(ps),curve(oldPs)):curve(ps);\n   if(basePs144){const base144=oldBasePs144?protectUpperFiber118(curve(basePs144),curve(oldBasePs144)):curve(basePs144);strand144=earRoute144.regular(strand144,base144,{guide:g,section:lockSection,end,lane,side,phase});}\n   ribbon(detail,strand144,.00063+random()*.00039,pick().lerp(new THREE.Color(\'#69564b\'),k%13===0?.40:0),28,g.front,phase,.85+random()*.10,g.deformEar);fiberCount++;');
replace('const g=guides[Math.floor(random()*guides.length)],startT=.18+random()*.66,ps=[],oldPs=g.original118?[]:null,phase=random()*TAU;',
 'const g=guides[Math.floor(random()*guides.length)],startT=.18+random()*.66,ps=[],oldPs=g.original118?[]:null,phase=random()*TAU,baseline144=earRoute144?.baselineGuide(g),basePs144=baseline144?[]:null,oldBasePs144=baseline144?.original118?[]:null;');
replace('ps.push(p);if(oldPs){const f0=frame(g.original118.c,at,g.front);',
 'ps.push(p);if(basePs144)basePs144.push(flyawaySample144(baseline144,t,at,k,frame));if(oldBasePs144)oldBasePs144.push(flyawaySample144(baseline144.original118,t,at,k,frame));if(oldPs){const f0=frame(g.original118.c,at,g.front);');
replace('  ribbon(detail,oldPs?protectUpperFiber118(curve(ps),curve(oldPs)):curve(ps),.00045+random()*.00022,pick(),24,g.front,phase,.80,g.deformEar);fiberCount++;',
 '  let strand144=oldPs?protectUpperFiber118(curve(ps),curve(oldPs)):curve(ps);\n  if(basePs144){const base144=oldBasePs144?protectUpperFiber118(curve(basePs144),curve(oldBasePs144)):curve(basePs144);strand144=earRoute144.flyaway(strand144,base144,k);}\n  ribbon(detail,strand144,.00045+random()*.00022,pick(),24,g.front,phase,.80,g.deformEar);fiberCount++;');
replace(' const temple=farTempleLayer(crown,guides,mass,detail,headTilt);',' if(earRoute144)earRoute144.finish();\n const temple=farTempleLayer(crown,guides,mass,detail,headTilt);');
replace(' root.userData.fringeDistribution108=fringeStats108;',' root.userData.fringeDistribution108=fringeStats108;\n root.userData.nearEarRoute144=earRoute144?.metrics??nearEar144OffMetrics();');
fs.writeFileSync(target,source);
console.log(JSON.stringify({file:target,bytes:Buffer.byteLength(source),sha256:sha(source)}));
