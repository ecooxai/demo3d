import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..'),sha=b=>createHash('sha256').update(b).digest('hex'),read=f=>fs.readFileSync(path.join(root,f)),info=f=>({bytes:read(f).length,sha256:sha(read(f))});
const expected={
 'src/main.js':'03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5',
 'src/blouse.js':'02b15fe9bbdfa428be27fd0f9ed44f7171b3178056b32c9586b8cf63a1da63a6',
 'src/hair-groom.js':'a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d',
 'review/collar158-proposal.md':'51cd08b781f216ca78d5ffbfbc7a58a57da530d01efc8047d36c8b5fdb0d09b8'
};
for(const[f,s]of Object.entries(expected))assert.equal(sha(read(f)),s,'Accepted157/proposal source changed: '+f);
const main=read('src/main.js').toString(),drape='state.blouseDrape154=applyBlouseDrape154(anatomicalBlouse,{strength:1});',balance='state.balance=applyPortraitBalance(model,{shiftX:-.24});';
assert.equal(main.split(drape).length,2);assert.equal(main.split(balance).length,2);assert(main.indexOf(drape)<main.indexOf(balance));
const entry="import {prepareCollarQA158} from '../review/collar158-native-qa.js';\n"+main.replace(drape,drape+"\nwindow.collar158QA=await prepareCollarQA158({blouse:anatomicalBlouse,model,state,strength:Number(new URLSearchParams(location.search).get('collar158')||0)});\nstate.collarRoll158=window.collar158QA.metrics;").replace(balance,balance+'\nawait window.collar158QA.afterBalance(state.balance);');
const entryFile='review/collar158-injected-main-check.js';fs.writeFileSync(path.join(root,entryFile),entry);
const native=['review/collar-roll-candidate158.js','review/collar158-geometry-audit.js','review/collar158-native-qa.js','review/collar158-native.mjs','review/blouse-drape154-geometry-audit.js'];
const local=['review/collar158-source.mjs','review/collar158-coarse-audit.mjs','review/collar158-contact-audit.mjs','review/collar158-proxy-audit.mjs','review/collar158-freeze.mjs'];
for(const f of[...native,...local,entryFile]){const r=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});assert.equal(r.status,0,f+' syntax failed: '+r.stderr);}
const coarse=JSON.parse(read('review/collar158-coarse-audit.json')),contact=JSON.parse(read('review/collar158-contact-audit.json')),proxy=JSON.parse(read('review/collar158-proxy-audit.json'));
assert(contact.risk.contacts.newPairs===0&&contact.risk.nonfinite===0&&contact.risk.reversed===0&&contact.risk.newDegenerate===0&&proxy.passed);
assert(contact.risk.oppositeSides.every(r=>r.minimumAxisGap>0)&&contact.risk.shells.every(r=>r.newPairs===0&&r.minimumVertexSeparation>.0035)&&contact.risk.seams.every(r=>r.newMissing===0&&r.maxAdditionalSeparation<.001));
for(const[f,s]of Object.entries(contact.sourceHashes))assert.equal(sha(read(f)),s,'Passing interface audit no longer describes '+f);
assert.equal(coarse.metrics.privateAttributeBytes,314608);assert.equal(coarse.metrics.sourceTriangles,11328);
const dependencies=new Set(),scan=f=>{
 if(dependencies.has(f))return;dependencies.add(f);if(!/\.[cm]?js$/.test(f))return;
 const text=read(f).toString(),rx=/\bimport\s+(?:[^'";\n]*?\s+from\s*)?['"](\.[^'"]+)['"]/g;
 for(const m of text.matchAll(rx)){const next=path.relative(root,path.resolve(root,path.dirname(f),m[1])).replaceAll(path.sep,'/');assert(!next.startsWith('../'),'Runtime import escaped project.');scan(next);}
};
for(const f of['src/main.js',...native])scan(f);
const evidence=['review/collar158-proposal.md','review/collar158-coarse-audit.json','review/collar158-contact-audit.json','review/collar158-proxy-audit.json','review/collar158-coarse-view.png','review/collar158-coarse-view.py',...local];
const manifest={candidate:158,status:'Frozen source-ready for one root-only native OFF/ON art comparison',acceptedBase:157,scoreUnchanged:78,productionEdited:false,proposal:info('review/collar158-proposal.md'),runtimeFiles:Object.fromEntries([...dependencies].sort().map(f=>[f,info(f)])),sourceEvidence:Object.fromEntries(evidence.map(f=>[f,info(f)])),
 nativeTransferFiles:[...native,'review/collar158-manifest.json','review/collar158-handoff.md','review/collar158-proposal.md','review/collar158-coarse-audit.json','review/collar158-contact-audit.json','review/collar158-proxy-audit.json','review/collar158-coarse-view.png'],
 localChecks:{modulesSyntaxPassed:native.length+local.length,injectedMainSyntaxPassed:true,after154MarkerCount:1,after99ProxyMarkerCount:1,sourceOwnedVertices:coarse.metrics.ownedVertices,actualSourceOwnedTriangles:contact.risk.affectedTriangles,sourceFixedTrianglePairs:contact.risk.contacts,oppositeSides:contact.risk.oppositeSides,balancedOriginalAttributesExact:true,privateDisposals:[0,4],originalDisposals:[0,0],noNativeExecutionLocally:true},
 resources:{sourcePrivateReplacementBytes:314608,expectedAfterIndexWideningBytes:382576,extraVertices:0,extraTriangles:0,extraTextures:0,extraDraws:0,extraPerFrameWork:0,qaProxyIsUnrendered:true,productionRetainsOriginals:false,sourceHelperMs:contact.metrics.elapsedMs,fullSourceFixture:contact.resources},
 runtime:'Existing project Three/esbuild/Playwright and root-owned native Chrome. The local arithmetic harness verifies source geometry only; no downloaded dependencies or other assets were used.',
 exclusions:'The reproducible coarse-data mesh JSON, injected-main syntax copy and prior grooming fixture datasets remain local; they are not native runtime dependencies or transfer assets.'};
fs.writeFileSync(path.join(root,'review/collar158-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({candidate:158,status:manifest.status,nativeFiles:native.length,runtimeInputs:dependencies.size,syntaxChecks:native.length+local.length+1,sourceFixedContacts:contact.risk.contacts.newPairs,privateBytes:314608,proposalSHA256:manifest.proposal.sha256}));
