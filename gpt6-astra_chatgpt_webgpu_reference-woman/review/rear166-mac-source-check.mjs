import fs from 'node:fs';
import crypto from 'node:crypto';
import {THREE,read,Matrix4} from './crown156-source.mjs';
import {faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
import {mul,T,RY,RZ,object} from './torso-depth110-harness.mjs';
const started=performance.now(),H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17)));
const hash=a=>crypto.createHash('sha256').update(a instanceof Uint8Array?a:Buffer.from(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const fileHash=p=>hash(fs.readFileSync(p));
const demand=(v,m)=>{if(!v)throw Error(m);};
demand(fileHash('src/hair-groom.js')==='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d','accepted groom changed');
demand(fileHash('review/rear166-mac-helper.js')==='4e85b69f3c3c8eedcbfa8a0812308279112b0713b879c73894ee0eebd04e33d0','helper changed');
demand(fileHash('review/hair-groom-candidate166-mac.js')==='b53671c4ff26700d4ae94de67fb172f0cbd4faaca08a043fd3540777d00a448a','candidate changed');
const helper=new Function(read('review/rear166-mac-helper.js')+'\nreturn {applyRearFlow166,isRear166,rearField166};')();
function make(strength,original=false){
 const text=read(original?'src/hair-groom.js':'review/hair-groom-candidate166-mac.js');
 const generator=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','applyRearFlow166','isRear166',text+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,helper.applyRearFlow166,helper.isRear166);
 const g=generator({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,rearFlow166:strength});
 g.isObject3D=true;g.matrixWorld=H;g.updateWorldMatrix=()=>{};
 for(const m of g.children){m.matrixWorld=H;m.parent=g;m.geometry.userData??={};}
 const balance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4),model=object('model');model.add(g);balance(model,{shiftX:-.24});return g;
}
const arrays=m=>[...Object.entries(m.geometry.attributes),['index',m.geometry.index]];
function capture(g){return g.children.map(m=>({name:m.name,attributes:Object.fromEntries(arrays(m).map(([k,a])=>[k,{type:a.array.constructor.name,itemSize:a.itemSize,count:a.count,sha256:hash(a.array)}])),maps:Object.fromEntries(['map','normalMap'].filter(k=>m.material[k]?.image?.data).map(k=>[k,hash(m.material[k].image.data)]))}));}
const base=make(0,true),baseCapture=capture(base);let zero=make(0);const zeroCapture=capture(zero);
demand(JSON.stringify(baseCapture)===JSON.stringify(zeroCapture),'ZERO changed original arrays or maps');
const ranges=zero.userData.rearFlow166.ranges;demand(ranges.mass.length===106&&ranges.detail.length===128,'range count changed');
demand(ranges.mass.reduce((n,r)=>n+r.count,0)===58194&&ranges.detail.reduce((n,r)=>n+r.count,0)===160020,'range size changed');
zero=null;global.gc?.();const on=make(1),onCapture=capture(on);
demand(JSON.stringify(ranges)===JSON.stringify(on.userData.rearFlow166.ranges),'range ownership differs');
const results=[],protectedChanges=[];
for(let m=0;m<base.children.length;m++){
 const a=base.children[m],b=on.children[m],owned=m===1?ranges.mass:m===2?ranges.detail:[],mask=new Uint8Array(a.geometry.attributes.position.count);
 for(const r of owned)mask.fill(1,r.start,r.start+r.count);
 const row={name:a.name,ownedVertices:mask.reduce((n,x)=>n+x,0),changed:{},newDegenerate:0,newOpposed:0,inheritedDegenerate:0,inheritedOpposed:0,affectedTriangles:0,maximumDisplacement:0,minimumAreaRatio:Infinity};
 for(const[k,aa]of arrays(a)){
  const bb=k==='index'?b.geometry.index:b.geometry.attributes[k];demand(aa.array.length===bb.array.length&&aa.itemSize===bb.itemSize,'attribute layout');
  let changed=0;for(let j=0;j<aa.array.length;j++){demand(Number.isFinite(bb.array[j]),'nonfinite output');if(aa.array[j]!==bb.array[j]){changed++;if(!['position','normal'].includes(k)||!mask[Math.floor(j/aa.itemSize)])protectedChanges.push(a.name+'/'+k+'/'+j);}}
  row.changed[k]=changed;
 }
 const p0=a.geometry.attributes.position.array,p1=b.geometry.attributes.position.array,n0=a.geometry.attributes.normal.array,n1=b.geometry.attributes.normal.array,idx=a.geometry.index.array;
 for(let j=0;j<mask.length;j++)if(mask[j])row.maximumDisplacement=Math.max(row.maximumDisplacement,Math.hypot(p1[j*3]-p0[j*3],p1[j*3+1]-p0[j*3+1],p1[j*3+2]-p0[j*3+2]));
 const tri=(p,n,ia,ib,ic)=>{const ax=p[ib]-p[ia],ay=p[ib+1]-p[ia+1],az=p[ib+2]-p[ia+2],bx=p[ic]-p[ia],by=p[ic+1]-p[ia+1],bz=p[ic+2]-p[ia+2],x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx,area=Math.hypot(x,y,z),nx=n[ia]+n[ib]+n[ic],ny=n[ia+1]+n[ib+1]+n[ic+1],nz=n[ia+2]+n[ib+2]+n[ic+2];return{area,degenerate:area<=1e-12,opposed:x*nx+y*ny+z*nz<0};};
 for(let k=0;k<idx.length;k+=3){const ia=idx[k],ib=idx[k+1],ic=idx[k+2];if(!mask[ia]&&!mask[ib]&&!mask[ic])continue;row.affectedTriangles++;const old=tri(p0,n0,ia*3,ib*3,ic*3),now=tri(p1,n1,ia*3,ib*3,ic*3);row.inheritedDegenerate+=Number(old.degenerate);row.inheritedOpposed+=Number(old.opposed);row.newDegenerate+=Number(now.degenerate&&!old.degenerate);row.newOpposed+=Number(now.opposed&&!old.opposed);if(old.area>1e-12)row.minimumAreaRatio=Math.min(row.minimumAreaRatio,now.area/old.area);}
 if(!row.affectedTriangles)row.minimumAreaRatio=null;results.push(row);
 demand(!row.newDegenerate&&!row.newOpposed,'new invalid affected triangle: '+row.name);
 demand(JSON.stringify(baseCapture[m].maps)===JSON.stringify(onCapture[m].maps),'map pixels changed');
}
demand(!protectedChanges.length,'changed outside rear-owned P/N');
const result={iteration:166,acceptedIteration:164,acceptedScore:78,provenance:'New Mac reconstruction of documented166 field after auxiliary executor outage; original local freeze not claimed byte-identical.',status:'Source essentials pass; native visual result pending',sourceFiles:Object.fromEntries(['src/hair-groom.js','review/rear166-mac-helper.js','review/hair-groom-candidate166-mac.js','review/rear166-mac-source-check.mjs'].map(p=>[p,{bytes:fs.statSync(p).size,sha256:fileHash(p)}])),zeroOriginalArraysAndMapsExact:true,ranges,protectedChanges,results,helper:on.userData.rearFlow166,sourceScope:'Indexed accepted authored source fixture, with118 and99. Full actual164 prepared scene is the separate native gate. No global contact, self-intersection or interface certification.',elapsedMs:performance.now()-started,rssMiB:process.memoryUsage().rss/1048576};
fs.writeFileSync('review/rear166-mac-source-check.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,zeroExact:true,ranges:{mass:ranges.mass.length,detail:ranges.detail.length},newDegenerate:results.reduce((n,x)=>n+x.newDegenerate,0),newOpposed:results.reduce((n,x)=>n+x.newOpposed,0),inheritedOpposed:results.reduce((n,x)=>n+x.inheritedOpposed,0),protectedChanges:protectedChanges.length,elapsedMs:result.elapsedMs,rssMiB:result.rssMiB}));
