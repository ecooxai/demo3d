import fs from 'node:fs';
import crypto from 'node:crypto';
import {THREE,read,Matrix4,preparedHead167} from './crown167-source.mjs';
import {faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
import {mul,T,RY,RZ,object} from './torso-depth110-harness.mjs';
const started=performance.now(),hash=a=>crypto.createHash('sha256').update(a instanceof Uint8Array?a:Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex'),demand=(v,m)=>{if(!v)throw Error('171 '+m);};
const strip=s=>s.replace(/^import .*$/gm,'').replace(/^export\s*\{[^}]*\};?\s*$/gm,'').replace(/\bexport\s+(?=(?:function|const|class)\b)/g,'');
const coreNames=['createFrontCapture167','find','actualGroomStats','currentOffset','supportIndex','sampleCrown','getFrontCapture171','forgetFrontCapture171','forgetUpstreamRestore171','cutFrontalCrown171','retireUpstreamFibers171','restoreUpstreamFibers171'];
const core=new Function('THREE',strip(fs.readFileSync('review/front171-mac-core.js','utf8'))+'\nreturn{'+coreNames.join(',')+'};')(THREE);
const api=new Function('THREE',...coreNames,strip(fs.readFileSync('review/front171-mac-fibers.js','utf8'))+'\nreturn{applyFrontFibers171,getFrontFibers171QA,releaseFrontFibers171};')(THREE,...coreNames.map(k=>core[k]));
const H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17)));
function make(original=false){
 const source=read(original?'src/hair-groom.js':'review/hair-groom-candidate171-mac.js'),generator=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','createFrontCapture167',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,core.createFrontCapture167),g=generator({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,captureFront167:!original});
 g.isObject3D=true;g.matrixWorld=H;g.updateWorldMatrix=()=>{};g.remove=o=>{g.children=g.children.filter(x=>x!==o);o.parent=null;};
 for(const m of g.children){m.matrixWorld=H;m.parent=g;m.geometry.userData??={};}
 const balance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4),model=object('model');model.add(g);balance(model,{shiftX:-.24});
 // Source fixture supplies the same numeric149 tint. Actual shader metadata,
 // maps and every prepared164 object are checked in the separate native gate.
 const mats=new Set(g.children.map(m=>m.material));for(const m of mats){m.color??=new THREE.Color('#ffffff');m.color.r=.65;m.color.g=.69;m.color.b=.75;}
 g.children[0].material.side=0;g.children[0].material.shadowSide=2;return g;
}
function capture(g){return g.children.map(m=>({name:m.name,attributes:Object.fromEntries([...Object.entries(m.geometry.attributes),['index',m.geometry.index]].map(([k,a])=>[k,{type:a.array.constructor.name,itemSize:a.itemSize,count:a.count,sha256:hash(a.array),indexLogicalSHA256:k==='index'?hash(a.array instanceof Uint32Array?a.array:Uint32Array.from(a.array)):null}])),maps:Object.fromEntries(['map','normalMap'].filter(k=>m.material[k]?.image?.data).map(k=>[k,hash(m.material[k].image.data)])),color:[m.material.color.r,m.material.color.g,m.material.color.b]}));}
const base=make(true),baseSnapshot=capture(base);let zero=make();const zeroResult=api.applyFrontFibers171(zero,null,{strength:0}),zeroSnapshot=capture(zero);demand(JSON.stringify(zeroSnapshot)===JSON.stringify(baseSnapshot),'ZERO changed original arrays/maps');core.forgetFrontCapture171(zero);zero=null;global.gc?.();
const groom=make(),before=capture(groom),legacy=groom.children.map(m=>({mesh:m,geometry:m.geometry,material:m.material,attributes:{...m.geometry.attributes},index:m.geometry.index})),head=preparedHead167(),metrics=api.applyFrontFibers171(groom,head,{strength:1,retainSourceForQA:true}),application=api.getFrontFibers171QA(groom),after=capture(groom);
demand(metrics.physicalFibers===2700&&metrics.crossRibbons===900&&metrics.vertices===525600&&metrics.addedTriangles===518400&&metrics.removedTriangles===194972,'geometry inventory');
demand(groom.children.length===6&&application.mesh.material===legacy[2].material,'shared fine material ownership');
demand(!metrics.nonfinite&&!metrics.degenerateTriangles&&!metrics.normalOpposedTriangles,'invalid new geometry');
const allowed=new Set(['Continuous parted crown with longitudinal fiber flow','Independent fine crown lengths and silhouette strands','Dense fine bowed brown fringe strands','Sparse short temple edge and hairline wisps']),changes=[];
for(let i=0;i<legacy.length;i++){
 const a=before[i],b=after[i],m=groom.children[i];demand(m===legacy[i].mesh&&m.geometry===legacy[i].geometry&&m.material===legacy[i].material,'legacy binding');
 for(const[k,v]of Object.entries(a.attributes))if(k==='index'&&allowed.has(a.name))changes.push({name:a.name,before:v,after:b.attributes[k]});else demand(JSON.stringify(v)===JSON.stringify(b.attributes[k]),'protected '+a.name+'/'+k);
 demand(JSON.stringify(a.maps)===JSON.stringify(b.maps)&&JSON.stringify(a.color)===JSON.stringify(b.color),'legacy map/tint');
 for(const[k,v]of Object.entries(legacy[i].attributes))demand(m.geometry.attributes[k]===v,'legacy attribute identity');
}
demand(changes.length===4,'legacy changed-index inventory');const again=api.applyFrontFibers171(groom,head,{strength:1,retainSourceForQA:true});demand(again===metrics&&groom.children.length===6,'non-idempotent');
let privateDisposals=0,materialDisposals=0;const pg=application.mesh.geometry,pd=pg.dispose.bind(pg);pg.dispose=()=>{privateDisposals++;pd();};const mat=application.mesh.material,md=mat.dispose?.bind(mat);mat.dispose=()=>{materialDisposals++;md?.();};
const release=api.releaseFrontFibers171(groom),restored=capture(groom);demand(JSON.stringify(restored)===JSON.stringify(before),'restored arrays/maps');demand(privateDisposals===1&&materialDisposals===0,'private/shared disposal');if(md)mat.dispose=md;else delete mat.dispose;
for(const r of legacy){demand(r.mesh.geometry===r.geometry&&r.mesh.material===r.material&&r.geometry.index===r.index,'restored legacy refs');for(const[k,a]of Object.entries(r.attributes))demand(r.geometry.attributes[k]===a,'restored attrs');}
demand(!core.getFrontCapture171(groom)&&!api.getFrontFibers171QA(groom),'source records retained after review release');
const files=['review/front171-mac-core.js','review/hair-groom-candidate171-mac.js','review/front171-mac-fibers.js','review/front171-mac-source-check.mjs'];
const report={iteration:171,acceptedIteration:164,acceptedScore:78,goalAchieved:false,status:'Source essentials pass; native art gate pending',provenance:'Root Mac construction after offline auxiliary executor and stalled agent handoffs. Uses only original image1-directed project geometry; no opaque167 emitter exists in the171 core.',files:Object.fromEntries(files.map(p=>{const b=fs.readFileSync(p);return[p,{bytes:b.length,sha256:hash(b)}];})),zeroOriginalArraysAndMapsExact:true,legacyAttributesAndMaterialBindingsExact:true,changedLegacyIndices:changes,metrics,release,privateDisposals,materialDisposals,restoredExact:true,sourceScope:'Actual authored indexed source fixture with118/99 and prepared147/159 head support. Numeric149 fine tint supplied directly; full actual164 metadata/maps and post100 are a native gate. Sparse head-support samples do not certify global collision clearance.',elapsedMs:performance.now()-started,rssMiB:process.memoryUsage().rss/1048576};
fs.writeFileSync('review/front171-mac-source-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,zeroExact:true,vertices:metrics.vertices,triangles:metrics.addedTriangles,removed:metrics.removedTriangles,nonfinite:metrics.nonfinite,degenerate:metrics.degenerateTriangles,opposed:metrics.normalOpposedTriangles,minimumNormalCosine:metrics.minimumNormalCosine,sampledSupport:metrics.sampledSupport,helperMs:metrics.elapsedMs,privateDisposals,materialDisposals,restoredExact:true,elapsedMs:report.elapsedMs,rssMiB:report.rssMiB}));
