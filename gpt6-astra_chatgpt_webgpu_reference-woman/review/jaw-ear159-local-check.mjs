import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {SourceTextModule} from 'node:vm';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {validateMovingSupport159} from './jaw-ear159-geometry.js';

// Local-only checks. No Three renderer, portrait reconstruction, field-grid
// repetition or browser execution. Run with --experimental-vm-modules to parse
// the four modules without linking, evaluating or spawning a child process.
// The actual native pair remains required.
const root=path.resolve(import.meta.dirname,'..'),sha=b=>createHash('sha256').update(b).digest('hex'),
  read=async f=>readFile(path.join(root,f)),parse=async f=>JSON.parse(await read(f)),
  baseline=await parse('review/jaw-ear159-baseline.json');
const guarded=[];
for(const[file,e]of Object.entries(baseline.files)){
  const b=await read(file);assert.equal(b.length,e.bytes,file+' bytes');assert.equal(sha(b),e.sha256,file+' hash');guarded.push(file);
}
const syntaxFiles=['review/jaw-ear-candidate159.js','review/jaw-ear159-geometry.js','review/jaw-ear159-native-qa.js','review/jaw-ear159-native.mjs'];
for(const f of syntaxFiles)new SourceTextModule(String(await read(f)),{identifier:f});
const actual155=await parse('review/jaw-silhouette155-native.json'),actual157=await parse('review/integrated157-native.json'),
  selected=actual155.results.find(r=>r.strength===1),certificate=selected.risk.fieldCertificate,
  sourceLabels=new Set(['anatomical-head/continuous-face','original-neck-and-clavicle-transition/neck-smooth-anatomical-surface',
    'left-ear/ear-continuous-anatomical-shell','right-ear/ear-continuous-anatomical-shell']),
  source=selected.audit.sourceAttributes.filter(r=>sourceLabels.has(r.label));
assert.equal(actual157.status,'Passed');assert.equal(actual157.expectedMain,baseline.mainSHA256);
assert.equal(source.length,20);assert.equal(selected.audit.privateAttributes.length,10);
const imported155=['review/jaw-silhouette-candidate155.js','review/jaw-silhouette155-field.js','review/jaw-silhouette155-config.json','review/jaw-silhouette155-geometry-audit.js'];
for(const f of imported155)assert.deepEqual(baseline.files[f],actual155.files[f],f+' actual155 provenance');
assert.ok(certificate.certifiedMinimumDeterminant>.02&&certificate.maximumWorldDisplacementUpper<.10);
const main=String(await read('src/main.js')),marker='state.eyelash151=applyEyelash151(anatomicalHead,{strength:1});';
assert.equal(main.split(marker).length,2);assert.ok(!main.includes('applyJawSilhouette155')&&!main.includes('applyJawEar159'));
const movingQuery=validateMovingSupport159();assert.equal(movingQuery.allocations.trackedTypedBuffersStillHeld,0);
const replacementBeforeUpload=source.reduce((s,r)=>s+r.bytes,0),earBeforeUpload=source.filter(r=>r.label.includes('-ear/')).reduce((s,r)=>s+r.bytes,0),
  indexWideningEstimate=source.filter(r=>r.key==='index'&&(r.type==='Uint16Array'||r.type==='Uint8Array')).reduce((s,r)=>s+r.values*4-r.bytes,0);
const report={candidate:159,acceptedBase:157,scoreUnchanged:78,status:'Passed local provenance, syntax and moving-query regression; actual native geometry/art pending',
  guardedFileCount:guarded.length,guardedFiles:guarded,syntaxFiles,actual155SourceAttributeRows:source.length,actual155SelectedFaceNeckAttributeRows:selected.audit.privateAttributes.length,
  unchanged155Dependencies:imported155,accepted157NativeEvidence:baseline.acceptedNativeEvidence,
  reusedCertificate:{source:baseline.reused155Evidence,analyticMinimumDeterminant:certificate.analyticMinimumDeterminant,
    certifiedMinimumDeterminant:certificate.certifiedMinimumDeterminant,maximumWorldDisplacementUpper:certificate.maximumWorldDisplacementUpper,
    protectedMouthBox:certificate.protectedMouthBox,rerunGrid:false},
  movingQuery,
  storageEstimates:{replacementBeforeUpload,earBeforeUpload,faceNeckBeforeUpload:replacementBeforeUpload-earBeforeUpload,indexWideningEstimate,
    replacementAfterExpectedNativeIndexWidening:replacementBeforeUpload+indexWideningEstimate,
    temporaryOriginalCPUBytesRetainedByNativeQA:replacementBeforeUpload,originalReplacementGPUUploadsBefore159:0,
    productionSourceGeometryReferencesRetainedBy159:0,addedDraws:0,addedTextureBytes:0,addedPerFrameWork:0,
    qualification:'Byte estimates use actual155 source inventories with the same four selected157 meshes. The native wrapper verifies current source parity and reports actual replacement/index storage. Replacement size is not an equal permanent CPU/GPU increase; QA retains originals temporarily. Renderer overhead and unrelated existing caches are excluded.'},
  peerRead:{reviewer:'/root/quality_review_42',scope:'159 ear frame and normal composition, moved support-query coordinates and four-binding restore order',
    result:'No concrete normal-path math/frame, moved-query or restore-order blocker found; read-only, no extra tests.'},
  limitations:['No native renderer was run locally.','The common map certificate does not certify linear ear triangles or fixed-hair contacts.',
    'Native sampled attachment offsets remain directional quantities, not penetration depths or proof of a continuous weld.',
    'No artistic gain or score increase is inferred from these checks.']};
await writeFile(path.join(root,'review/jaw-ear159-local-check.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({candidate:159,status:report.status,guardedFiles:guarded.length,syntaxFiles:syntaxFiles.length,movingQuery,
  storageEstimates:report.storageEstimates}));
