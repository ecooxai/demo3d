import {contactWitness155,validateInterfaceAccelerator155} from './jaw155-interface-geometry.js';
import {triangleDistanceSquared144} from './near-ear144-geometry.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const cases=[
  {name:'transverse edge/face intersection',a:[[0,0,0],[1,0,0],[0,1,0]],b:[[.2,.2,-1],[.2,.2,1],[.5,.2,0]],distance:0},
  {name:'coplanar containment',a:[[0,0,0],[1,0,0],[0,1,0]],b:[[.1,.1,0],[.2,.1,0],[.1,.2,0]],distance:0},
  {name:'parallel separation',a:[[0,0,0],[1,0,0],[0,1,0]],b:[[.1,.1,.02],[.2,.1,.02],[.1,.2,.02]],distance:.02},
  {name:'shared vertex',a:[[0,0,0],[1,0,0],[0,1,0]],b:[[0,0,0],[-1,0,0],[0,-1,0]],distance:0},
  {name:'edge/edge closest pair',a:[[0,0,0],[1,0,0],[0,-1,0]],b:[[.5,1,-1],[.5,1,1],[1,2,0]],distance:1},
];
const rows=[];
for(const c of cases){const a={p:c.a},b={p:c.b},w=contactWitness155(a,b),d=triangleDistanceSquared144(a,b);
  if(Math.abs(Math.sqrt(d)-c.distance)>1e-12||Math.abs(w.squared-d)>1e-12)throw Error('155 interface witness fixture failed: '+c.name);
  rows.push({name:c.name,distance:Math.sqrt(d),witnessSeparation:Math.sqrt(w.squared),kind:w.kind});}
const report={scope:'Only the new BVH, front-facing projection, one missing-AFTER-support branch and contact-witness localization; no portrait geometry fixture or repeat of155 field/normal/material tests.',
  bvh:validateInterfaceAccelerator155(),witnesses:rows,status:'Local deterministic accelerator/projection/support-loss/witness checks passed; actual native scene interfaces pending.',files:{}};
for(const name of['jaw155-interface-geometry.js','jaw155-interface-qa.js','jaw155-interface-native.mjs','jaw155-interface-local-check.mjs','near-ear144-geometry.mjs']){
  const b=await readFile(new URL(name,import.meta.url));report.files['review/'+name]={bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};}
await writeFile(new URL('jaw155-interface-local-check.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
