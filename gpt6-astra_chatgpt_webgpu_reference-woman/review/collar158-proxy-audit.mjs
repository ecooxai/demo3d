import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Mesh} from './torso-depth110-harness.mjs';
import {helper158 as H,sourceCollar158,balance158,Geometry,Matrix4,read,object,I,mul,T,RZ} from './collar158-source.mjs';

// Narrow integration check of the actual158 native QA prepare/afterBalance/
// cleanup path. The arithmetic fixture does not emulate a native GPU upload.
const eventStore=new WeakMap();
Geometry.prototype.addEventListener=function(type,fn){let m=eventStore.get(this);if(!m)eventStore.set(this,m=new Map());if(!m.has(type))m.set(type,new Set());m.get(type).add(fn);};
Geometry.prototype.removeEventListener=function(type,fn){eventStore.get(this)?.get(type)?.delete(fn);};
Geometry.prototype.dispose=function(){for(const fn of eventStore.get(this)?.get('dispose')||[])fn({type:'dispose',target:this});};
class ProxyGroup{
 constructor(){Object.assign(this,object('proxy'));this.matrix=I();this.updateWorldMatrix=ProxyGroup.prototype.updateWorldMatrix;}
 remove(child){this.children=this.children.filter(x=>x!==child);child.parent=null;}
 updateWorldMatrix(){this.matrixWorld=this.matrix.clone();for(const child of this.children)child.matrixWorld=mul(this.matrixWorld,child.matrix);}
}
class ProxyMesh extends Mesh{constructor(g,m){super(g,m);this.matrix=I();this.matrixWorld=I();}}
globalThis.window={};
const prepare=new Function('Group','Mesh','Matrix4','applyPortraitBalance','COLLAR158_SPEC','collarWorkspace158','collarMap158','applyCollarRoll158','releaseCollarRoll158','inspectCollarTriangles158',read('review/collar158-native-qa.js')+';return prepareCollarQA158;')(ProxyGroup,ProxyMesh,Matrix4,balance158,H.COLLAR158_SPEC,H.collarWorkspace158,H.collarMap158,H.applyCollarRoll158,H.releaseCollarRoll158,()=>{throw Error('No additional triangle audit in this proxy ownership check.');});
const B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0))),results=[];
for(const strength of[0,1]){
 const model=object('model'),blouse=sourceCollar158(),state={referenceCloth117:{strength:.5},blouseDrape154:{strength:1}};
 blouse.matrixWorld=B;for(const m of blouse.children)m.matrixWorld=B;model.add(blouse);
 const originals=blouse.children.filter(m=>H.COLLAR158_SPEC.meshes.includes(m.name)).map(m=>[m,m.geometry]);
 const q=await prepare({blouse,model,state,strength});state.collarRoll158=q.metrics;state.balance=balance158(model,{shiftX:-.24});await q.afterBalance(state.balance);
 if(strength)assert.deepEqual(q.audit.originalAfter99Attributes,results[0].originalAfter99Attributes);
 const cleanup=await q.cleanup('narrow-four-collar-proxy-source-check');assert(originals.every(([m,g])=>m.geometry===g));assert(cleanup.balancedOriginalsRestored&&cleanup.privateDisposalsHaveNoSourceBindings);assert.equal(cleanup.originalResourceDisposals,0);assert.equal(cleanup.privateGeometryDisposals,strength?4:0);
 results.push({strength,originalAfter99Attributes:q.audit.originalAfter99Attributes,protected:q.audit.afterBalanceProtection,proxy:q.audit.proxy,cleanup});
}
const report={candidate:158,passed:true,sourceOnly:true,scope:'Actual native QA prepare/afterBalance/cleanup invoked with accepted Float32 collars, actual99 and a minimal event fixture. All original attribute hashes agree after OFF/ON balance. Native Three upload/index widening, full-scene fingerprints and rendering remain root-only checks.',results};
fs.writeFileSync('review/collar158-proxy-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({candidate:158,passed:true,balancedOriginalAllAttributesExact:true,offProxy:results[0].proxy.used,onProxy:results[1].proxy.used,proxyMeshes:results[1].proxy.metrics.meshes,proxyVertices:results[1].proxy.metrics.vertices,privateDisposals:results.map(r=>r.cleanup.privateGeometryDisposals),sourceDisposals:results.map(r=>r.cleanup.originalResourceDisposals)}));
