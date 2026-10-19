import fs from 'node:fs';
import assert from 'node:assert/strict';
import {THREE,Attr,Geometry,Mesh,Matrix4,read,object,attach,I,mul,T,RZ} from './torso-depth110-harness.mjs';

// Narrow arithmetic integration check of the actual native QA's preparation,
// afterBalance and cleanup code. This is not a substitute for native Three
// event bindings/index upload; root's wrapper checks those in the live scene.
Matrix4.prototype.copy=function(m){this.elements=Array.from(m.elements);return this;};
Attr.prototype.setZ=function(i,z){this.array[i*this.itemSize+2]=z;return this;};
const eventStore=new WeakMap();
Geometry.prototype.addEventListener=function(type,fn){let m=eventStore.get(this);if(!m)eventStore.set(this,m=new Map());if(!m.has(type))m.set(type,new Set());m.get(type).add(fn);};
Geometry.prototype.removeEventListener=function(type,fn){eventStore.get(this)?.get(type)?.delete(fn);};
Geometry.prototype.dispose=function(){for(const fn of eventStore.get(this)?.get('dispose')||[])fn({type:'dispose',target:this});};
class ProxyGroup{
 constructor(){Object.assign(this,object('proxy'));this.matrix=I();}
 remove(child){this.children=this.children.filter(x=>x!==child);child.parent=null;}
 updateWorldMatrix(){this.matrixWorld=this.matrix.clone();for(const child of this.children)child.matrixWorld=mul(this.matrixWorld,child.matrix);}
}
// object() supplies its own no-op update; use an explicit constructor property.
class NativeProxyGroup extends ProxyGroup{constructor(){super();this.updateWorldMatrix=ProxyGroup.prototype.updateWorldMatrix;}}
class ProxyMesh extends Mesh{constructor(g,m){super(g,m);this.matrix=I();this.matrixWorld=I();}}
const helper=new Function('Matrix4',read('review/blouse-drape-candidate154.js')+';return {BLOUSE154_SPEC,blouseDrapeJet154,applyBlouseDrape154,releaseBlouseDrape154};')(Matrix4);
const balance=new Function('Matrix4',read('src/portrait-balance.js')+';return applyPortraitBalance;')(Matrix4);
const cloth=new Function('THREE',read('src/blouse.js')+';return {clothGeometry,broadenShoulders};')(THREE);
globalThis.window={};
const prepare=new Function('Group','Mesh','Matrix4','applyPortraitBalance','BLOUSE154_SPEC','blouseDrapeJet154','applyBlouseDrape154','releaseBlouseDrape154','inspectBlouseTriangles154',read('review/blouse-drape154-native-qa.js')+';return prepareBlouseQA154;')(NativeProxyGroup,ProxyMesh,Matrix4,balance,helper.BLOUSE154_SPEC,helper.blouseDrapeJet154,helper.applyBlouseDrape154,helper.releaseBlouseDrape154,()=>{throw Error('No extra geometry audit in the proxy test.');});
const B=mul(T(0,1,0),mul(RZ(.045),T(0,-1,0))),results=[];
for(const strength of[0,1]){
 const model=object('model'),blouse=object('original-tailored-white-cotton-blouse',B),g=cloth.clothGeometry(),mesh=attach(blouse,helper.BLOUSE154_SPEC.mesh,g,B),state={referenceCloth117:{strength:.5}};
 cloth.broadenShoulders(blouse);model.add(blouse);
 const q=await prepare({blouse,model,hair:object('unused-hair'),state,strength});state.balance=balance(model,{shiftX:-.24});await q.afterBalance(state.balance);
 if(strength)assert.deepEqual(q.audit.originalAfter99Attributes,results[0].originalAfter99Attributes);
 const cleanup=await q.cleanup('narrow-proxy-source-check');assert.equal(mesh.geometry,g);assert(cleanup.balancedOriginalRestored&&cleanup.privateDisposalsHaveNoSourceBindings);assert.equal(cleanup.originalResourceDisposals,0);
 results.push({strength,originalAfter99Attributes:q.audit.originalAfter99Attributes,protected:q.audit.afterBalanceProtection,proxy:q.audit.proxy,cleanup});
}
const report={candidate:154,passed:true,sourceOnly:true,scope:'Actual native QA prepare/afterBalance/cleanup invoked with the established arithmetic cloth grid, Matrix4 fixture and minimal dispose events. Both full balanced original attribute hashes match. Installed native Three buffer ownership and rendering remain root-only checks.',results};
fs.writeFileSync('review/blouse-drape154-proxy-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({candidate:154,passed:true,balancedOriginalAllAttributesExact:true,offProxy:results[0].proxy.used,onProxy:results[1].proxy.used,privateDisposals:results.map(r=>r.cleanup.privateGeometryDisposals),sourceDisposals:results.map(r=>r.cleanup.originalResourceDisposals)}));
