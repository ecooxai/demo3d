import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {SourceTextModule} from 'node:vm';

// Local provenance/parse pass only. Never imports or executes the native file.
const root=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(root,f)),sha=b=>createHash('sha256').update(b).digest('hex'),
  stamp=f=>{const b=read(f);return{bytes:b.length,sha256:sha(b)};},
  mainSHA='88280af03c4be630968aca0763d3d430ec6699ae9533ba057015c53801d4ae55',
  actual164='review/integrated164-native.json',actualSHA='650743e8db6d3ac77d353c629cfff8a9e849f52a3c2655da3cbb744f4989cbed',
  jpegSHA='ef577a4eb5a7da2ab153cb93d0540760f756c23cb8d8fcba7271d6bd15976174';
if(stamp('src/main.js').sha256!==mainSHA||stamp(actual164).sha256!==actualSHA||stamp('reference/image1-color.jpg').sha256!==jpegSHA)throw Error('162 current164/sole-reference evidence changed.');
const actual=JSON.parse(read(actual164));if(actual.status!=='Passed'||actual.errors.length||actual.setup.attributes.length!==282)throw Error('162 native164 baseline is incomplete.');
const files=new Set(['index.html','src/style.css','package.json','reference/image1-color.jpg',actual164]),syntax=[];
function dependency(f){
  if(files.has(f)&&syntax.includes(f))return;files.add(f);
  if(!/\.(m?js)$/.test(f))return;
  if(syntax.includes(f))return;const source=String(read(f));new SourceTextModule(source,{identifier:f});syntax.push(f);
  const re=/\bfrom\s+['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]/g;
  for(const match of source.matchAll(re)){
    const spec=match[1]||match[2];if(!spec.startsWith('.'))continue;
    const absolute=path.resolve(root,path.dirname(f),spec),relative=path.relative(root,absolute).replaceAll('\\','/');
    if(relative.startsWith('../')||path.isAbsolute(relative))throw Error('162 project import escapes project: '+relative);
    dependency(relative);
  }
}
for(const f of['src/main.js','review/chin162-native.mjs','review/chin162-native-qa.js'])dependency(f);
if(files.has('reference/image1.png'))throw Error('162 must not require the local-only PNG on Mac.');
const registry={candidate:162,acceptedBase:164,scoreUnchanged:78,mainSHA256:mainSHA,
  qualification:'Exact current164 runtime and one original162 coarse annulus. Only the established image1-color.jpg is a runtime visual input. The local PNG and arithmetic fixtures are not native dependencies.',
  acceptedNativeEvidence:{file:actual164,...stamp(actual164)},files:Object.fromEntries([...files].sort().map(f=>[f,stamp(f)]))};
const registryName='review/chin162-baseline164.json';fs.writeFileSync(path.join(root,registryName),JSON.stringify(registry,null,2)+'\n');
const localNames=['review/chin162-local-check.mjs','review/chin162-source.mjs','review/chin162-local-check.json','review/chin162-section-plot.py','review/chin162-coarse-sections.json','review/chin162-coarse-sections.png','review/chin162-coarse-junction.obj','review/chin162-freeze.mjs'];
for(const f of localNames.filter(f=>/\.(m?js)$/.test(f)))new SourceTextModule(String(read(f)),{identifier:f});
const local=JSON.parse(read('review/chin162-local-check.json'));
if(local.controller.release.privateGeometriesDisposed!==3||local.geometry.closure.unpairedAfterSourceBoundary!==0||local.geometry.closure.inconsistentEdgeDirectionsAfterPairing!==0||local.geometry.opposedAuthoredTriangleNormals!==0)throw Error('162 source geometry/controller validation is incomplete.');
const transfer=['review/chin-junction-candidate162.js','review/chin162-loft.js','review/chin162-geometry-check.js','review/chin162-native-qa.js','review/chin162-native.mjs',registryName],
  manifest={candidate:162,acceptedBase:164,scoreUnchanged:78,status:'Frozen local geometry and native harness; no native162 render or art claim.',
    main:{file:'src/main.js',...stamp('src/main.js')},runtimeRegistry:{file:registryName,...stamp(registryName),guardedFiles:files.size},
    transferFiles:Object.fromEntries(transfer.map(f=>[f,stamp(f)])),alreadyPresentOnMac:[...files].filter(f=>!transfer.includes(f)).sort(),
    localEvidence:Object.fromEntries(localNames.map(f=>[f,stamp(f)])),syntaxParsed:syntax,
    nativeCommand:'node review/chin162-native.mjs',nativeOutput:'output/qa/chin162-native.json',
    sourceCommand:'node --experimental-vm-modules review/chin162-local-check.mjs',scope:'The first native pair is the art gate. No whole-scene contact, export or 155 field-grid audit is included.'};
fs.writeFileSync(path.join(root,'review/chin162-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'review/chin162-transfer-files.txt'),transfer.join('\n')+'\n');
console.log(JSON.stringify({candidate:162,status:manifest.status,syntaxModules:syntax.length,guardedRuntimeFiles:files.size,transferFiles:manifest.transferFiles,manifest:stamp('review/chin162-manifest.json')}));
