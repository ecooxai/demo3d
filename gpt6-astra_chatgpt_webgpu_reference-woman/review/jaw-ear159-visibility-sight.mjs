import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sourceHead147,Matrix4,object,point} from './eye-contour147-source.mjs';
import {read} from './torso-depth110-harness.mjs';
import {sourceEar} from './near-ear115-source.mjs';
import {applyEyeContour147} from '../src/eye-contour.js';

// Camera planning only. Reuse the accepted source face and the actual far ear,
// verify their position hashes against the native159 OFF scene, then cast nine
// ear-anchor rays against the actual continuous-face triangles in two directions.
// This is not the interface/contact audit, a field grid, or a rendered hair test.
const sha=a=>createHash('sha256').update(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).digest('hex');
const native=JSON.parse(fs.readFileSync('review/jaw-ear159-native.json','utf8')),off=native.results.find(r=>r.strength===0),head=sourceHead147(),ear=sourceEar(1),frame=head.matrixWorld;
ear.matrixWorld=frame;
const balance=new Function('Matrix4',read('src/portrait-balance.js')+';return applyPortraitBalance;')(Matrix4),proxy=object('right-ear');proxy.add(ear);balance(proxy,{shiftX:-.24});
head.add(ear);applyEyeContour147(head,{strength:1});
const face=head.children.find(m=>m.name==='continuous-face'),expected=new Map(off.audit.sourceAttributes.map(r=>[r.label+'|'+r.key,r.sha256]));
const positionHashes={face:sha(face.geometry.attributes.position.array),ear:sha(ear.geometry.attributes.position.array)};
assert.equal(positionHashes.face,expected.get('anatomical-head/continuous-face|position'),'Camera planning face must match actual native157/159 OFF positions.');
assert.equal(positionHashes.ear,expected.get('right-ear/ear-continuous-anatomical-shell|position'),'Camera planning ear must match actual native157/159 OFF positions.');
const faceIndexLogicalSHA256=sha(Uint32Array.from(face.geometry.index.array)),earUVSHA256=sha(ear.geometry.attributes.uv.array);
assert.equal(faceIndexLogicalSHA256,off.audit.sourceAttributes.find(r=>r.label==='anatomical-head/continuous-face'&&r.key==='index').indexLogicalSHA256,'Camera planning must use the actual face triangle indices.');
assert.equal(earUVSHA256,expected.get('right-ear/ear-continuous-anatomical-shell|uv'),'Camera anchor selection must use actual native ear UV values.');
const p=face.geometry.attributes.position,idx=face.geometry.index.array,uv=ear.geometry.attributes.uv,ep=ear.geometry.attributes.position,world=new Float64Array(p.count*3),samples=[];
for(let i=0;i<p.count;i++)world.set(point(frame,[p.getX(i),p.getY(i),p.getZ(i)]),i*3);
for(const u of[.32,.39,.46])for(const v of[.08,.20,.33]){let id=-1,d=Infinity;for(let i=0;i<ep.count;i++){const q=(uv.getX(i)-u)**2+(uv.getY(i)-v)**2;if(q<d){d=q;id=i;}}samples.push({id,uv:[uv.getX(id),uv.getY(id)],world:point(frame,[ep.getX(id),ep.getY(id),ep.getZ(id)])});}
const sub=(a,b)=>a.map((v,k)=>v-b[k]),dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],vertex=i=>[world[i*3],world[i*3+1],world[i*3+2]],views=[];
for(const offset of[[-3.2,0,8],[3.2,0,8]]){
 const n=Math.hypot(...offset),direction=offset.map(v=>v/n),right=[direction[2],0,-direction[0]],center=off.setup.closeCenter,results=[];
 for(const sample of samples){let nearest=Infinity,hits=0,triangle=null;
  for(let t=0;t<idx.length;t+=3){const ids=[idx[t],idx[t+1],idx[t+2]];if(sample.world[1]<Math.min(...ids.map(i=>world[i*3+1]))-1e-9||sample.world[1]>Math.max(...ids.map(i=>world[i*3+1]))+1e-9)continue;
   const a=vertex(ids[0]),b=vertex(ids[1]),c=vertex(ids[2]),ab=sub(b,a),ac=sub(c,a),h=cross(direction,ac),den=dot(ab,h);if(Math.abs(den)<1e-14)continue;
   const s=sub(sample.world,a),u=dot(s,h)/den;if(u< -1e-9||u>1+1e-9)continue;const q=cross(s,ab),v=dot(direction,q)/den;if(v< -1e-9||u+v>1+1e-9)continue;const distance=dot(ac,q)/den;
   if(distance>1e-7){hits++;if(distance<nearest){nearest=distance;triangle=t/3;}}
  }
  const rel=sub(sample.world,center);results.push({...sample,faceAhead:hits>0,nearestFaceDistance:Number.isFinite(nearest)?nearest:null,faceTriangle:triangle,framing:{x:dot(rel,right),y:rel[1],inside:Math.abs(dot(rel,right))<.4125&&Math.abs(rel[1])<.55}});
 }
 views.push({cameraOffset:offset,samples:results,faceClear:results.filter(r=>!r.faceAhead).length,faceOccluded:results.filter(r=>r.faceAhead).length,allInsideFrustum:results.every(r=>r.framing.inside)});
}
assert(views[1].faceClear>views[0].faceClear&&views[1].allInsideFrustum,'The proposed opposite sight line must expose more of the actual ear-anchor samples.');
const result={candidate:159,study:'opposite-side visibility',passed:true,positionHashes,faceIndexLogicalSHA256,earUVSHA256,fixedCenter:off.setup.closeCenter,span:1.10,views,scope:'Nine actual lower-inner far-ear source samples; face/ear positions, face triangle indices and ear UV hashes equal the completed native159 OFF scene. Rays test the actual continuous-face triangles, treating both sides as potential occluders. Hair, ear self-occlusion, alpha and light are deliberately not certified; the two new native images decide actual visibility. No field/contact grid or other study was rerun.'};
fs.writeFileSync('review/jaw-ear159-visibility-sight.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({candidate:159,passed:true,positionHashes,fixedCenter:result.fixedCenter,views:views.map(v=>({offset:v.cameraOffset,faceClear:v.faceClear,faceOccluded:v.faceOccluded,allInsideFrustum:v.allInsideFrustum}))}));
