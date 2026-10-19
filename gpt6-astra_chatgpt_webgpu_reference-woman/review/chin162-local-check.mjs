import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SourceTextModule} from 'node:vm';
import {preparedSource162,THREE,Attr,Geometry,Matrix4,I} from './chin162-source.mjs';
import {CHIN162_LOFT,emitChinBand162,point162} from './chin162-loft.js';
import {checkChinGeometry162} from './chin162-geometry-check.js';
const sha=a=>createHash('sha256').update(a).digest('hex'),hash=a=>sha(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)),read=f=>fs.readFileSync(f),started=performance.now(),cpuStarted=process.cpuUsage();
const actualBytes=read('review/jaw-ear159-native.json');assert.equal(sha(actualBytes),'3c3a08201ad8397462b7e7f7d68d1421aa66352cb2a6e54f81cf612f984155f9');
const actual=JSON.parse(actualBytes).results.find(r=>r.strength===1).audit.privateAttributes;
const fixture=preparedSource162(),{model,face,neck}=fixture;
const parity=[];
for(const [mesh,label,keys]of [[face,'anatomical-head/continuous-face.private159',['position','uv','index']],[neck,'original-neck-and-clavicle-transition/neck-smooth-anatomical-surface.private159',['position','normal','uv','index']]])for(const key of keys){
  const a=key==='index'?mesh.geometry.index:mesh.geometry.attributes[key],e=actual.find(r=>r.label===label&&r.key===key);assert(e);
  assert.equal(key==='index'?hash(Uint32Array.from(a.array)):hash(a.array),key==='index'?e.indexLogicalSHA256:e.sha256,label+'.'+key);parity.push({label,key,sha256:key==='index'?e.indexLogicalSHA256:e.sha256});
}
const part=(mesh,kind,columns)=>({geometry:mesh.geometry,frame:mesh.matrixWorld.elements,inverse:mesh.matrixWorld.clone().invert().elements,kind,columns});
const out=emitChinBand162(part(face,'face',380),part(neck,'neck',80),{retainDebug:true}),shape=checkChinGeometry162(out,{sections:true});
assert(shape.metrics.maximumFrontDownwardDeparture<.02,'Source section exceeded the .02 downward envelope at matched source depth.');
assert(shape.metrics.minimumSampledRadialNormalCosine>0,'Sampled annular section has an inward radial turn.');
// Native actual materials/buffers are checked separately. This arithmetic
// fixture adds just the Object3D methods required to exercise controller
// ownership; it does not simulate renderer disposal or claim a GPU test.
Matrix4.prototype.copy=function(a){this.elements=a.elements.slice();return this;};
Geometry.prototype.clearGroups=function(){this.groups=[];};
model.traverse(o=>{o.visible=true;o.matrix=I();o.matrixAutoUpdate=true;o.layers={mask:1};o.castShadow=true;o.receiveShadow=true;o.renderOrder=0;o.frustumCulled=true;o.remove=function(n){this.children=this.children.filter(q=>q!==n);n.parent=null;};});
class Mesh162 extends THREE.Mesh{constructor(g,m){super(g,m);this.matrix=I();this.matrixWorld=I();this.layers={mask:1};this.children=[];this.visible=true;}}
const text=String(read('review/chin-junction-candidate162.js')),clean=text.replace(/^import[^\n]*\n/gm,'').replace(/export /g,'');
const api=new Function('BufferAttribute','BufferGeometry','Mesh','CHIN162_LOFT','emitChinBand162',clean+'\nreturn {applyChinJunction162,releaseChinJunction162,getChinJunctionQA162};')(Attr,Geometry,Mesh162,CHIN162_LOFT,emitChinBand162);
const snapshots=[];model.traverse(m=>{if(m.isMesh)snapshots.push({mesh:m,geometry:m.geometry,material:m.material,arrays:[...Object.entries(m.geometry.attributes),['index',m.geometry.index]].map(([k,a])=>({k,a,array:a.array,hash:hash(a.array)}))});});
const buffers=new Set(snapshots.flatMap(r=>r.arrays.map(q=>q.array.buffer))),disposals=[];
Geometry.prototype.dispose=function(){assert.equal(face.geometry,snapshots.find(r=>r.mesh===face).geometry,'Both originals must be installed before first disposal.');assert.equal(neck.geometry,snapshots.find(r=>r.mesh===neck).geometry);disposals.push(this);for(const a of[...Object.values(this.attributes),this.index])assert(!buffers.has(a.array.buffer),'Private disposal reached a source buffer.');};
const zero={isObject3D:true,updateWorldMatrix(){throw Error('OFF traversed');}};assert.equal(api.applyChinJunction162(zero,{strength:0}),api.applyChinJunction162(zero));
const metrics=api.applyChinJunction162(model,{strength:1,retainSourceForQA:true});assert.equal(api.applyChinJunction162(model,{strength:1,retainSourceForQA:true}),metrics);
const state=api.getChinJunctionQA162(model);assert.equal(state.band.material[0],face.material[0]);assert.equal(state.band.material[1],face.material[1]);assert.equal(state.band.material[2],neck.material);
for(const r of snapshots){assert.equal(r.mesh.material,r.material);for(const q of r.arrays){assert.equal(q.a.array,q.array);assert.equal(hash(q.array),q.hash);}}
for(const r of state.staged)for(const [k,a]of Object.entries(r.geometry.attributes)){assert(!buffers.has(a.array.buffer));assert.equal(hash(a.array),hash(r.original.attributes[k].array),'Every original vertex attribute stays exact.');}
const release=api.releaseChinJunction162(model);assert.equal(release.privateGeometriesDisposed,3);assert.equal(disposals.length,3);assert(!model.getObjectByName('Connected submental skin junction162'));
for(const r of snapshots){assert.equal(r.mesh.geometry,r.geometry);for(const q of r.arrays){assert.equal(q.a.array,q.array);assert.equal(hash(q.array),q.hash);}}
const syntaxFiles=['review/chin162-loft.js','review/chin162-geometry-check.js','review/chin-junction-candidate162.js'];
for(const file of['review/chin162-native-qa.js','review/chin162-native.mjs'])if(fs.existsSync(file))syntaxFiles.push(file);
for(const file of syntaxFiles)new SourceTextModule(String(read(file)),{identifier:file});
const cpu=process.cpuUsage(cpuStarted),files=Object.fromEntries([...new Set([...syntaxFiles,'review/chin162-source.mjs','review/chin162-local-check.mjs','src/main.js','src/face.js','src/blouse.js','review/jaw-ear159-native.json'])].map(file=>{const b=read(file);return[file,{bytes:b.length,sha256:sha(b)}];}));
const report={candidate:162,scoreUnchanged:78,status:'Local source geometry/controller checks passed; native art pending',sourcePositionAndTopologyParity:parity,
  geometry:shape.metrics,controller:{metrics,zeroNoTraversal:true,cachedIdentity:true,originalBuffersUnchanged:true,originalBindingsRestored:true,fullyPrivateDisposal:true,release},
  envelopeInterpretation:'At matched original head-section depth, all sampled forward sections fit within .02 extra downward displacement. The separate same-Y forward projection is reported, not hidden; it describes the steep curved profile at a different correspondence and is not a measured forward translation.',
  limitations:['Full face authored-normal hash differs in the older local fixture; the native helper copies actual retained boundary normals and the native QA checks original data exactly.',
    'No native renderer, actual material appearance, whole-scene contact, global watertightness, or score gain was tested locally.',
    'Quintic section joins are C2 in the loft direction; periodic Catmull interpolation of the sampled source rings is C1 around the ring.',
    'Mathematical cut positions are source positions. A shared render frame gives a separately measured Float32 world gap below1e-7; this is not bit-identical multiframe world evaluation.'],
  cost:{wallMs:performance.now()-started,cpuMs:(cpu.user+cpu.system)/1000,peakRSSMiB:process.resourceUsage().maxRSS/1024},files};
fs.writeFileSync('review/chin162-local-check.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('review/chin162-coarse-sections.json',JSON.stringify({metrics:shape.metrics,sections:shape.sections},null,2)+'\n');
const obj=[];for(let i=0;i<out.data.position.length;i+=3)obj.push('v '+point162(face.matrixWorld.elements,Array.from(out.data.position.slice(i,i+3))).join(' '));for(let i=0;i<out.data.index.length;i+=3)obj.push('f '+Array.from(out.data.index.slice(i,i+3),i=>i+1).join(' '));fs.writeFileSync('review/chin162-coarse-junction.obj',obj.join('\n')+'\n');
console.log(JSON.stringify({candidate:162,status:report.status,geometry:shape.metrics,controller:report.controller.metrics,cleanup:release,cost:report.cost}));
