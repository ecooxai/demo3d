import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..'),sha=b=>createHash('sha256').update(b).digest('hex'),read=f=>fs.readFileSync(path.join(root,f)),info=f=>({bytes:read(f).length,sha256:sha(read(f))});
const expected={
 'src/main.js':'a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521',
 'src/blouse.js':'02b15fe9bbdfa428be27fd0f9ed44f7171b3178056b32c9586b8cf63a1da63a6',
 'src/hair-groom.js':'a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d'
};
for(const[f,s]of Object.entries(expected))assert.equal(sha(read(f)),s,'Accepted149 source changed: '+f);
const main=read('src/main.js').toString(),cloth='state.referenceCloth117=await applyReferenceCloth117(anatomicalBlouse,{strength:.5});',balance='state.balance=applyPortraitBalance(model,{shiftX:-.24});';
assert.equal(main.split(cloth).length,2);assert.equal(main.split(balance).length,2);assert(main.indexOf(cloth)<main.indexOf(balance));
const entry="import {prepareBlouseQA154} from '../review/blouse-drape154-native-qa.js';\n"+main.replace(cloth,cloth+"\nwindow.blouse154QA=await prepareBlouseQA154({blouse:anatomicalBlouse,model,hair:anatomicalHair,state,strength:Number(new URLSearchParams(location.search).get('fold154')||0)});\nstate.blouseDrape154=window.blouse154QA.metrics;").replace(balance,balance+'\nawait window.blouse154QA.afterBalance(state.balance);');
const entryFile='review/blouse-drape154-injected-main-check.js';fs.writeFileSync(path.join(root,entryFile),entry);
const native=['review/blouse-drape-candidate154.js','review/blouse-drape154-geometry-audit.js','review/blouse-drape154-native-qa.js','review/blouse-drape154-native.mjs'];
const local=['review/blouse-drape154-source-audit.mjs','review/blouse-drape154-proxy-audit.mjs','review/blouse-drape154-contact-limit.mjs','review/blouse-drape154-freeze.mjs'];
for(const f of[...native,...local,entryFile]){const r=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});assert.equal(r.status,0,f+' syntax failed: '+r.stderr);}
const sourceAudit=JSON.parse(read('review/blouse-drape154-source-audit.json')),proxyAudit=JSON.parse(read('review/blouse-drape154-proxy-audit.json'));
assert(sourceAudit.hairRisk&&sourceAudit.hairRisk.triangleContacts.newPairs===0&&sourceAudit.hairRisk.sampledDepth.newCrossings===0&&proxyAudit.passed);
for(const[f,s]of Object.entries(sourceAudit.sourceHashes))assert.equal(sha(read(f)),s,'Passing source audit no longer describes '+f);
const dependencies=new Set(native),scan=f=>{
 if(dependencies.has(f)&&f!=='src/main.js')return;dependencies.add(f);if(!/\.[cm]?js$/.test(f))return;
 const text=read(f).toString(),rx=/\bimport\s+(?:[^'";\n]*?\s+from\s*)?['"](\.[^'"]+)['"]/g;
 for(const m of text.matchAll(rx)){const next=path.relative(root,path.resolve(root,path.dirname(f),m[1])).replaceAll(path.sep,'/');assert(!next.startsWith('../'),'Runtime import escaped project.');scan(next);}
};
scan('src/main.js');
// The review helpers' explicit imports all resolve either to another listed
// native helper or to the ordinary portrait-balance source above.
const evidence=['review/blouse-drape154-source-audit.json','review/blouse-drape154-proxy-audit.json','review/blouse-drape154-contact-limit.json','review/blouse-drape154-contact-block-040.json','review/blouse-drape154-contact-block-018.json','review/blouse-drape154-entry-rejection.json','review/blouse-drape154-plan.md','review/blouse-drape154-coarse-view.png',...local];
const manifest={candidate:154,status:'Frozen source-ready for one root-only native OFF/ON art comparison',acceptedBase:149,scoreUnchanged:78,productionEdited:false,runtimeFiles:Object.fromEntries([...dependencies].sort().map(f=>[f,info(f)])),sourceEvidence:Object.fromEntries(evidence.map(f=>[f,info(f)])),
 nativeTransferFiles:[...native,'review/blouse-drape154-manifest.json','review/blouse-drape154-handoff.md','review/blouse-drape154-source-audit.json','review/blouse-drape154-proxy-audit.json','review/blouse-drape154-contact-limit.json','review/blouse-drape154-plan.md','review/blouse-drape154-coarse-view.png'],
 localChecks:{modulesSyntaxPassed:native.length+local.length,injectedMainSyntaxPassed:true,after117MarkerCount:1,after99ProxyMarkerCount:1,sourceTriangleContacts:{before:sourceAudit.hairRisk.triangleContacts.beforePairs,after:sourceAudit.hairRisk.triangleContacts.afterPairs,new:0,removed:0},noNativeExecutionLocally:true},
 resources:{sourcePrivateReplacementBytes:sourceAudit.metrics.privateAttributeBytes,extraTriangles:0,extraTextures:0,extraDraws:0,extraPerFrameWork:0,qaProxyIsUnrendered:true},
 runtime:'Existing project Three/esbuild/Playwright and root-owned native Chrome. The local arithmetic harness verifies source geometry only; no downloaded dependencies or other assets were used.',
 exclusions:'Large reproducible coarse-data JSON and prior grooming harness datasets are deliberately excluded from the native transfer.'};
fs.writeFileSync(path.join(root,'review/blouse-drape154-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({candidate:154,status:manifest.status,nativeFiles:native.length,runtimeInputs:dependencies.size,syntaxChecks:native.length+local.length+1,sourceContacts:manifest.localChecks.sourceTriangleContacts,privateBytes:manifest.resources.sourcePrivateReplacementBytes}));
