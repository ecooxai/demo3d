import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {sha164,loadEvidence164,EVIDENCE164} from './evidence.mjs';

const root=path.resolve(import.meta.dirname,'../..'),folder=path.join(root,'review/integration164'),installed=process.argv.includes('--installed');
const demand=(value,message)=>{if(!value)throw Error('164 source check: '+message);};
demand(typeof vm.SourceTextModule==='function','run with node --experimental-vm-modules; parsing needs no child process or dependency execution');
const mapping=JSON.parse(await readFile(path.join(folder,'source-mapping.json'),'utf8')),manifest=JSON.parse(await readFile(path.join(folder,'manifest.json'),'utf8'));
demand(mapping.iteration===164&&mapping.rows.length===7&&manifest.iteration===164,'stage inventory changed');
const stagedByTarget=new Map(mapping.rows.map(row=>[row.target,row])),copies=[],dependencies=[],syntax=[];
function replaceOnce(text,from,to){demand(text.split(from).length===2,'nonunique exact replacement '+from);return text.replace(from,to);}
for(const row of mapping.rows){
 const bytes=await readFile(path.join(root,row.staged));demand(bytes.length===row.bytes&&sha164(bytes)===row.sha256,'staged content changed '+row.staged);
 let reconstructed=bytes.toString();const changes=row.importReplacements||row.exactReplacements||[];
 for(const change of changes.slice().reverse())reconstructed=replaceOnce(reconstructed,change.to,change.from);
 demand(Buffer.byteLength(reconstructed)===row.sourceBytes&&sha164(Buffer.from(reconstructed))===row.sourceSHA256,'copy is not the exact documented transformation '+row.target);
 if(row.source!==row.target||!installed){const source=await readFile(path.join(root,row.source));demand(source.length===row.sourceBytes&&sha164(source)===row.sourceSHA256,'frozen input changed '+row.source);}
 if(installed){const actual=await readFile(path.join(root,row.target));demand(sha164(actual)===row.sha256,'stage has not been installed '+row.target);}
 if(row.target.endsWith('.js')){
  new vm.SourceTextModule(bytes.toString(),{identifier:row.staged});syntax.push(row.staged);
  for(const match of bytes.toString().matchAll(/^\s*import[^\n]*?from\s+['"]([^'"]+)['"]/gm)){
   if(!match[1].startsWith('.'))continue;const target=path.posix.normalize(path.posix.join(path.posix.dirname(row.target),match[1]));
   const selected=stagedByTarget.get(target),file=selected?selected.staged:target;await readFile(path.join(root,file));dependencies.push({from:row.target,to:target,resolved:file});
  }
 }else if(row.target.endsWith('.json'))JSON.parse(bytes);
 copies.push({target:row.target,source:row.source,sourceSHA256:row.sourceSHA256,sha256:row.sha256,importSpecifierChanges:(row.importReplacements||[]).length,otherExactReplacements:(row.exactReplacements||[]).length});
}
for(const row of manifest.runtimeFiles){
 const staged=stagedByTarget.get(row.file),file=!installed&&staged?staged.staged:row.file,bytes=await readFile(path.join(root,file));
 demand(bytes.length===row.bytes&&sha164(bytes)===row.sha256,'runtime guard differs '+file);
}
for(const row of manifest.verificationFiles){const bytes=await readFile(path.join(root,row.file));demand(bytes.length===row.bytes&&sha164(bytes)===row.sha256,'verification source changed '+row.file);}
for(const name of['evidence.mjs','native.mjs','source-check.mjs']){new vm.SourceTextModule(await readFile(path.join(folder,name),'utf8'),{identifier:name});syntax.push('review/integration164/'+name);}
const main=await readFile(path.join(folder,'src/main.js'),'utf8'),collar=await readFile(path.join(folder,'src/collar-roll.js'),'utf8'),jaw=await readFile(path.join(folder,'src/jaw-ear.js'),'utf8'),face=await readFile(path.join(folder,'src/jaw-silhouette.js'),'utf8');
const order=['state.referenceCloth117=await applyReferenceCloth117','state.blouseDrape154=applyBlouseDrape154','state.collarRoll158=applyCollarRoll158','state.balance=applyPortraitBalance','state.mouthContinuity130=applyMouthContinuity130','state.upperLipRelief140=applyUpperLipRelief140','state.eyeContour147=applyEyeContour147','state.eyelash151=applyEyelash151','state.jawEar159=applyJawEar159'];
const indices=order.map(anchor=>{demand(main.split(anchor).length===2,'preparation must occur once '+anchor);return main.indexOf(anchor);});
demand(indices.every((value,index)=>index===0||value>indices[index-1]),'preparation order changed');
demand(main.includes('applyCollarRoll158(anatomicalBlouse,{strength:1,retainSourceForQA:false})')&&main.includes('applyJawEar159(model,{strength:1,retainSourceForQA:false})'),'production retention is not explicitly false');
demand(collar.includes('original:retainSourceForQA?r.original:null')&&jaw.includes('staged:retainSourceForQA?staged:null')&&jaw.includes('jawBindings:retainSourceForQA?[[face,face.geometry],[neck,neck.geometry]]:null')&&face.includes('staged:retainSourceForQA?staged:null'),'frozen zero-source-retention branches changed');
const evidence=await loadEvidence164(root);
const report={iteration:164,status:'Passed',mode:installed?'installed source':'staged source; production remains157',score:78,syntaxFiles:syntax,copies,virtualImportDependencies:dependencies,runtimeGuardFiles:manifest.runtimeFiles.length,preparationOrder:order,sourceRetention:{explicitProductionFalse:true,collarOriginalReferencesNull:true,jawEarStagingNull:true,jawEarOriginalBindingsNull:true,nested155StagingNull:true},nativeEvidence:Object.entries(EVIDENCE164).map(([role,row])=>({role,...row})),attributeMerge:evidence.summary,componentFieldOrContactReruns:0,localNativeExecution:false,rssMiB:process.memoryUsage().rss/1048576};
const destination=installed?path.join(root,'output/qa/integration164-source-check.json'):path.join(folder,'source-check-result.json');await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,mode:report.mode,syntaxFiles:syntax.length,runtimeGuardFiles:report.runtimeGuardFiles,selectedAttributes:evidence.summary.substitutedAttributes,exactBaselineAttributes:evidence.summary.unchangedBaselineAttributes,componentGridReruns:0,report:path.relative(root,destination)}));
