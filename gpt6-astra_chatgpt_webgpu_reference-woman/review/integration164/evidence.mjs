import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// Only completed native fingerprints are read here. No component geometry,
// field solve, contact audit, texture construction or rendering is repeated.
const demand=(value,message)=>{if(!value)throw Error('164 evidence: '+message);};
export const sha164=bytes=>createHash('sha256').update(bytes).digest('hex');
const plainLabel=label=>label.replace(/^\d+:/,'');
const contentHash=row=>row.key==='index'?row.indexLogicalSHA256:row.sha256;
const fieldsEqual=(a,b)=>a.key===b.key&&a.values===b.values&&contentHash(a)===contentHash(b)&&
  (a.key==='index'||(a.type===b.type&&a.bytes===b.bytes));

export const EVIDENCE164=Object.freeze({
 integration157:{file:'review/integrated157-native.json',sha256:'757df6877443afb227f90e539b7456b5f07e28aa32a2e7491dadd3f31ee2caa5'},
 collar158:{file:'review/collar158-native-timing-result.json',sha256:'4c193ae9c8bacd829cdf839ed5f4e8ea2d8ac385f15e5f4770753ef030b279c0'},
 jaw159:{file:'review/jaw-ear159-native.json',sha256:'3c3a08201ad8397462b7e7f7d68d1421aa66352cb2a6e54f81cf612f984155f9'},
 visibility159:{file:'review/jaw-ear159-visibility-native.json',sha256:'676edcac05e0247525efaff4f966239e821c799c84153fd380ea875b02c6e2c1'},
});

export async function readNative164(root,row){
 const bytes=await readFile(path.join(root,row.file));demand(sha164(bytes)===row.sha256,'changed native evidence '+row.file);
 return JSON.parse(bytes);
}

export async function loadEvidence164(root){
 const [previous,collar,jaw,visibility]=await Promise.all(Object.values(EVIDENCE164).map(row=>readNative164(root,row)));
 demand(previous.iteration===157&&previous.score===78&&previous.status==='Passed'&&previous.errors.length===0,'157 was not completed');
 demand(previous.expectedMain==='03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5','157 main identity changed');
 demand(collar.candidate===158&&collar.acceptedBase===157&&collar.results.length===2&&collar.errors.length===0,'158 evidence base differs');
 demand(jaw.candidate===159&&jaw.acceptedBase===157&&jaw.results.length===2&&jaw.errors.length===0,'159 evidence base differs');
 demand(visibility.errors.length===0,'159 visibility evidence contains errors');
 const off=collar.results.find(r=>r.strength===0),on=collar.results.find(r=>r.strength===1),j0=jaw.results.find(r=>r.strength===0),j1=jaw.results.find(r=>r.strength===1);
 for(const r of[off,on,j0,j1])demand(r&&r.idleFrames===0,'native case is incomplete');
 const baseline=off.audit.finalAttributes.map(row=>({...row})),signature=off.audit.protectedSignature;
 demand(baseline.length===282&&signature.objects.length===64&&signature.geometries.length===64&&signature.materials.length===50&&signature.textures.length===10,'actual157 snapshot population differs');

 // integrated157 recorded a successful full-scene comparison, but did not keep
 // its282 individual hashes. The unmodified157 page in completed158 does; both
 // completed159 source snapshots must independently match all of those rows.
 for(const actual of[j0.audit.sourceAttributes,j1.audit.sourceAttributes]){
  const queues=new Map();for(const row of actual){const key=row.label+'|'+row.key;if(!queues.has(key))queues.set(key,[]);queues.get(key).push(row);}
  for(const row of baseline){const key=plainLabel(row.label)+'|'+row.key,source=queues.get(key)?.shift();demand(source&&fieldsEqual(row,source),'157 baseline differs at '+key);}
  demand(actual.length===282&&[...queues.values()].every(q=>!q.length),'157 source evidence has extra rows');
 }
 const expected=baseline.map(row=>({...row})),replacements=[];
 const selections=[
  {iteration:158,rows:on.audit.privateAfter99Attributes,count:18,meshCount:4,labels:new Set(['blouse-left-spread-collar','blouse-left-collar-edge','blouse-right-spread-collar','blouse-right-collar-edge']),label(row){demand(row.label.startsWith('balanced-private158-'),'wrong158 coordinate stage');const name=row.label.slice('balanced-private158-'.length);demand(this.labels.has(name),'unexpected158 owner');return'original-tailored-white-cotton-blouse/'+name;}},
  {iteration:159,rows:j1.audit.privateAttributes,count:20,meshCount:4,labels:new Set(['anatomical-head/continuous-face','original-neck-and-clavicle-transition/neck-smooth-anatomical-surface','left-ear/ear-continuous-anatomical-shell','right-ear/ear-continuous-anatomical-shell']),label(row){demand(row.label.endsWith('.private159'),'wrong159 private label');const label=row.label.slice(0,-'.private159'.length);demand(this.labels.has(label),'unexpected159 owner');return label;}},
 ];
 for(const selection of selections){
  demand(selection.rows.length===selection.count,'selected'+selection.iteration+' attribute count differs');const owners=new Set();
  for(const row of selection.rows){
   const label=selection.label(row),matches=expected.filter(r=>plainLabel(r.label)===label&&r.key===row.key);
   demand(matches.length===1,'ambiguous selected owner '+label+'.'+row.key);const old=matches[0],slot=old.label+'|'+row.key;
   demand(!replacements.some(r=>r.slot===slot),'two selected helpers own '+slot);
   demand(old.values===row.values&&(row.key==='index'||old.type===row.type&&old.bytes===row.bytes),'selected attribute layout changed '+slot);
   if(!['position','normal'].includes(row.key))demand(fieldsEqual(old,row),'selected helper changed protected color/UV/index '+slot);
   if(selection.iteration===158){const final=on.audit.finalAttributes.find(r=>r.label===old.label&&r.key===row.key);demand(final&&fieldsEqual(final,row),'158 post99 fingerprint is not final native output '+slot);}
   replacements.push({iteration:selection.iteration,slot,baselineSHA256:contentHash(old),selectedSHA256:contentHash(row),contentChanged:contentHash(old)!==contentHash(row)});
   Object.assign(old,row,{label:old.label});owners.add(label);
  }
  demand(owners.size===selection.meshCount,'selected owner population differs');
 }
 demand(replacements.length===38&&expected.length===282&&expected.filter(r=>r.key==='index').length===64,'combined population differs');
 for(const row of expected)demand(contentHash(row)&&/^[a-f0-9]{64}$/.test(contentHash(row)),'missing content fingerprint '+row.label+'.'+row.key);
 const nativeGeometry=signature.geometries.map(g=>({...g,attributes:g.attributes.map(a=>{
  const row=expected.find(r=>r.label===g.label&&r.key===a.key);demand(row,'missing actual attribute schema '+g.label+'.'+a.key);return{...a,sha256:contentHash(row)};
 })}));
 // Material version is an engine update counter, excluded by the accepted157
 // appearance comparator. All actual rendering values remain in the record.
 const appearance={objects:signature.objects,geometries:nativeGeometry,materials:signature.materials.map(m=>{const p=JSON.parse(m.physical);delete p.version;return{...m,physical:JSON.stringify(p)};}),textures:signature.textures};
 return{attributes:expected,appearance,replacements,summary:{baseline:'Actual unmodified157 native snapshot retained in completed158; all282 rows independently match both159 source snapshots',baselineAttributes:282,selectedCollarAttributes:18,selectedJawEarAttributes:20,substitutedAttributes:38,unchangedBaselineAttributes:244,contentChangedAttributes:replacements.filter(r=>r.contentChanged).length,meshBindings:64,logicalIndices:64,materialValues:50,textureImagesAndSamplers:10,collarPrivateBytesBeforeUpload:on.audit.metrics.privateAttributeBytes,collarPrivateBytesAfterUpload:on.audit.buffers.privateReplacementCPUBytesAfterUpload,jawEarPrivateBytesBeforeUpload:j1.audit.metrics.privateAttributeBytes,jawEarPrivateBytesAfterUpload:j1.audit.buffers.privateReplacementCPUBytesAfterUpload,componentFieldOrContactReruns:0}};
}
