import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const hash=b=>createHash('sha256').update(b).digest('hex');
const wrapperPath='review/collar158-native-timing.mjs',source=await readFile(wrapperPath,'utf8'),original=await readFile('review/collar158-native.mjs','utf8'),summary=JSON.parse(await readFile('review/collar158-protection-failure-summary.json','utf8')),manifestBytes=await readFile('review/collar158-manifest.json'),manifest=JSON.parse(manifestBytes);
const begin='// BEGIN narrow cross-page timing normalization158.',end='// END narrow cross-page timing normalization158.';
assert.equal(source.split(begin).length,2);assert.equal(source.split(end).length,2);
const body=source.slice(source.indexOf(begin),source.indexOf(end)+end.length),normalize=vm.runInNewContext(body+'\nnormalizeCrossPageProtection158;');
const make=()=>({objects:[{label:'preserved-model',transform:[1,0,0]}],geometries:[{attributes:[{sha256:'unchanged-original-buffer'}]}],materials:Array.from({length:37},(_,i)=>({label:'material'+i,physical:'unchanged-physical',maps:{map:0},metadata:JSON.stringify(i===36?{referenceCrownMicrocontrast:{bakeMs:summary.items[0].before,elapsedMs:summary.items[1].before,version:'accepted100',gain:1},otherMs:123}:{bakeMs:123})})),textures:[{label:'texture0',sha256:'unchanged-map-pixels',sampler:{channel:1},metadata:JSON.stringify({bakeMs:summary.items[2].before,width:2048,otherMs:123})},{label:'texture1',metadata:JSON.stringify({bakeMs:123}),sha256:'second-map'}]});
const copy=x=>JSON.parse(JSON.stringify(x)),setTiming=(signature,i,value)=>{const item=summary.items[i],parts=item.path.split('/'),row=signature[parts[1]][Number(parts[2])],data=JSON.parse(row.metadata);let parent=data;for(const key of parts.slice(4,-1))parent=parent[key];parent[parts.at(-1)]=value;row.metadata=JSON.stringify(data);};
const before=make(),after=copy(before);for(let i=0;i<3;i++)setTiming(after,i,summary.items[i].after);
const beforeRaw=JSON.stringify(before),afterRaw=JSON.stringify(after),left=normalize(before),right=normalize(after);
assert.notEqual(beforeRaw,afterRaw);assert.equal(JSON.stringify(left.signature),JSON.stringify(right.signature));assert.equal(JSON.stringify(before),beforeRaw);assert.equal(JSON.stringify(after),afterRaw);
assert.deepEqual(JSON.parse(JSON.stringify(left.excluded)),summary.items.map(r=>({path:r.path,value:r.before})));assert.deepEqual(JSON.parse(JSON.stringify(right.excluded)),summary.items.map(r=>({path:r.path,value:r.after})));
const acceptedIndividual=[];for(let i=0;i<3;i++){const variant=copy(before);setTiming(variant,i,summary.items[i].after);assert.equal(JSON.stringify(normalize(variant).signature),JSON.stringify(left.signature));acceptedIndividual.push(summary.items[i].path);}
const rejected=[];function mustDiffer(name,change){const variant=copy(after);change(variant);assert.notEqual(JSON.stringify(normalize(variant).signature),JSON.stringify(left.signature),name);rejected.push(name);}
const metadataChange=(row,field,value)=>{const data=JSON.parse(row.metadata);data[field]=value;row.metadata=JSON.stringify(data);};
mustDiffer('adjacent material bakeMs',s=>metadataChange(s.materials[35],'bakeMs',456));
mustDiffer('adjacent texture bakeMs',s=>metadataChange(s.textures[1],'bakeMs',456));
mustDiffer('same crown metadata otherMs',s=>metadataChange(s.materials[36],'otherMs',456));
mustDiffer('same texture metadata otherMs',s=>metadataChange(s.textures[0],'otherMs',456));
mustDiffer('crown version',s=>{const d=JSON.parse(s.materials[36].metadata);d.referenceCrownMicrocontrast.version='changed';s.materials[36].metadata=JSON.stringify(d);});
mustDiffer('material physical values',s=>s.materials[36].physical='changed');
mustDiffer('texture pixels',s=>s.textures[0].sha256='changed');
mustDiffer('texture sampler',s=>s.textures[0].sampler.channel=0);
mustDiffer('geometry buffer',s=>s.geometries[0].attributes[0].sha256='changed');
mustDiffer('object transform',s=>s.objects[0].transform[2]=.1);
const malformed=[];for(const [name,change]of[
 ['missing measured leaf',s=>{const d=JSON.parse(s.materials[36].metadata);delete d.referenceCrownMicrocontrast.bakeMs;s.materials[36].metadata=JSON.stringify(d);}],
 ['non-numeric measured leaf',s=>setTiming(s,0,'193.2')],
 ['nonfinite serialized measured leaf',s=>setTiming(s,0,Infinity)],
 ['negative measured leaf',s=>setTiming(s,0,-1)],
 ['noncanonical metadata text',s=>s.materials[36].metadata+=' '],
]){const v=copy(before);change(v);assert.throws(()=>normalize(v));malformed.push(name);}
const deepFreeze=o=>{Object.freeze(o);for(const v of Object.values(o))if(v&&typeof v==='object'&&!Object.isFrozen(v))deepFreeze(v);return o;};normalize(deepFreeze(copy(before)));
const runtimeGuards=[];for(const[file,r]of Object.entries(manifest.runtimeFiles)){const b=await readFile(file);assert.equal(b.length,r.bytes,file);assert.equal(hash(b),r.sha256,file);runtimeGuards.push(file);}assert.equal(runtimeGuards.length,39);
const guardLine=original.split('\n').find(s=>s.startsWith('for(const[file,r]of Object.entries(freeze.runtimeFiles))'));assert.ok(source.includes(guardLine));assert.equal(hash(original),'bdbe94135d229e98e3e5430bff8f2657565bd67a2165a2fd94639be222e441fe');
assert.ok(source.includes("'review/collar158-native-timing.mjs','review/collar158-manifest.json'"));assert.ok(source.includes("sha256:files['review/collar158-native-timing.mjs'].sha256"));assert.ok(source.includes("path.join(qa,'collar158-native-timing-result.json')"));assert.ok(!source.includes("path.join(qa,'collar158-native-result.json')"));
const report={scope:'Pure normalization check only; no browser, renderer, bundle, geometry fixture or production edits.',wrapper:{path:wrapperPath,bytes:Buffer.byteLength(source),sha256:hash(source)},originalWrapperSHA256:hash(original),manifestSHA256:hash(manifestBytes),frozenRuntimeGuardCount:runtimeGuards.length,originalRuntimeGuardLoopExact:true,perPageQAFileSHA256:manifest.runtimeFiles['review/collar158-native-qa.js'].sha256,measuredDifferenceFields:summary.items.length,measuredTimings:summary.items,normalizationEqualForExactlyMeasuredChanges:true,eachMeasuredFieldAccepted:acceptedIndividual,otherDifferencesPreserved:rejected,malformedInputsRejected:malformed,rawSignaturesUnchanged:true,deepFrozenInputAccepted:true,ownWrapperHashInNativeProvenance:true,separateNativeResult:'output/qa/collar158-native-timing-result.json',nativeRun:false};
await writeFile('review/collar158-timing-normalization-check.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({wrapper:report.wrapper,guardCount:runtimeGuards.length,measuredFields:summary.items.length,otherDifferencesPreserved:rejected.length,malformedInputsRejected:malformed.length,rawSignaturesUnchanged:true,nativeRun:false}));
