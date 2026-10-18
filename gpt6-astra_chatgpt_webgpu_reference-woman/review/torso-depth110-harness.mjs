import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Reuse the established source-only geometry/matrix harness, without executing
// its99 tests. Native Three and the complete scene are checked by root.
const source=fs.readFileSync('review/portrait-balance99-audit.mjs','utf8');
const boundary=source.indexOf("const source=read('review/portrait-balance-candidate99.js');");
assert(boundary>0,'The existing source harness boundary changed.');
const h=new Function('fs','assert','crypto',source.slice(0,boundary).replace(/^import[^\n]*\n/gm,'')+'\nreturn {THREE,V,Attr,Geometry,Group,Mesh,Matrix4,I,mul,T,RY,RZ,point,object,attach,hash,read,matrixCount:()=>matrixAllocations};')(fs,assert,crypto);
h.Attr.prototype.getW=function(i){return this.array[i*this.itemSize+3];};
export const {THREE,V,Attr,Geometry,Group,Mesh,Matrix4,I,mul,T,RY,RZ,point,object,attach,hash,read,matrixCount}=h;
export const clean=source=>source.replace(/^import[^\n]*\n/gm,'').replace(/export /g,'');
export const sha=source=>crypto.createHash('sha256').update(source).digest('hex');
