import fs from 'node:fs';
import {THREE,read} from './torso-depth110-harness.mjs';
export {THREE,read};
export const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
export const cloth=new Function('THREE',read('src/blouse.js')+'\nreturn {sampleBlouseFrontAtXY};')(THREE);
export const createHairContact=new Function('sampleBlouseFrontAtXY',read('src/hair-contact.js')+'\nreturn createHairContact;')(cloth.sampleBlouseFrontAtXY);
export const fit=new Function('sampleBlouseFrontAtXY',read('src/lower-guide-placement.js')+'\nreturn {fitLowerGuides118,protectUpperFiber118};')(cloth.sampleBlouseFrontAtXY);
export const clumps=new Function('THREE',read('review/lower-clump-sections126.js')+'\nreturn {prepareLowerClumps126,emitClumpLock126,clumpSurface126};')(THREE);

export const familyClumps=new Function('THREE','emitClumpLock126','clumpSurface126',read('review/lower-clump-sections126-family.js').replace(/export \{[^}]*\};/g,'')+'\nreturn {prepareLowerClumps126,emitClumpLock126,clumpSurface126,releaseClumpSupport126,attachClumpFine126,finishLowerClumps126};')(THREE,clumps.emitClumpLock126,clumps.clumpSurface126);

export function construct(strength,{baseline=false,massOnly=false,family=false}={}){
 const c=family?familyClumps:clumps;
 const release=family?c.releaseClumpSupport126:()=>{},attach=family?c.attachClumpFine126:(g,c)=>c,finish=()=>{};
 let source=read(baseline?'src/hair-groom.js':'review/hair-groom-candidate126.js');
 source=source.replace('m.receiveShadow=true;return m;','m.receiveShadow=true;m.__rawPosition=new Float32Array(b.p);return m;');
 if(massOnly){
  const end=source.indexOf(" // Fine surface strands share each lock's shape");if(end<0)throw new Error('126 MASS study boundary changed.');
  source=source.slice(0,end)+" const mesh=makeMesh(mass,material,'MASS',headTilt,true,true,contact); return {mesh,guides,section:lockSection,contact,metrics:typeof lowerClump126==='undefined'?null:lowerClump126};}";
 }else source=source.replace(' return root;',' root.__guides=guides;root.__section=lockSection;root.__contact=contact;return root;');
 return new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','prepareLowerClumps126','emitClumpLock126','clumpSurface126','releaseClumpSupport126','attachClumpFine126','finishLowerClumps126',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,c.prepareLowerClumps126,c.emitClumpLock126,c.clumpSurface126,release,attach,finish)({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,lowerClumps:strength});
}

const cr=Math.cos(-.17),sr=Math.sin(-.17),cy=Math.cos(.16),sy=Math.sin(.16);
export const modelPoint=(x,y,z)=>{const rx=x*cr-y*sr;return[.26+rx*cy+z*sy,2.95+x*sr+y*cr,-rx*sy+z*cy];};
export const rawToModel=(p,contact)=>[p.x+.26,p.y+2.95,p.z+(contact?contact.atModel(p.x+.26,p.y+2.95,p.z):0)];

// Reusable narrow orthographic ray grid. Every hit is evaluated on actual
// Float32 triangle positions after86 contact and the accepted head transform.
export function rayGrid(mesh,ranges,{axis=2,nx=92,ny=92}={}){
 const p=mesh.geometry.attributes.position,idx=mesh.geometry.index.array,xyz=new Float64Array(p.count*3),uAxis=axis===2?0:2,vAxis=1,umin=axis===2?-1.7:-1.1,umax=axis===2?2.1:1.6,vmin=-1.4,vmax=1.45,du=(umax-umin)/nx,dv=(vmax-vmin)/ny,bins=Array.from({length:nx*ny},()=>[]),triGuide=new Uint16Array(idx.length/3);
 for(let i=0;i<p.count;i++)xyz.set(modelPoint(p.getX(i),p.getY(i),p.getZ(i)),i*3);
 for(const r of ranges)for(let k=r.triangleFrom;k<r.triangleTo;k++)triGuide[k]=r.guide;
 for(let ti=0;ti<idx.length/3;ti++){
  const a=idx[ti*3]*3,b=idx[ti*3+1]*3,c=idx[ti*3+2]*3,us=[xyz[a+uAxis],xyz[b+uAxis],xyz[c+uAxis]],vs=[xyz[a+vAxis],xyz[b+vAxis],xyz[c+vAxis]],i0=Math.max(0,Math.floor((Math.min(...us)-umin)/du)),i1=Math.min(nx-1,Math.floor((Math.max(...us)-umin)/du)),j0=Math.max(0,Math.floor((Math.min(...vs)-vmin)/dv)),j1=Math.min(ny-1,Math.floor((Math.max(...vs)-vmin)/dv));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)bins[j*nx+i].push(ti);
 }
 return{xyz,idx,triGuide,at(u,v){
  const i=Math.floor((u-umin)/du),j=Math.floor((v-vmin)/dv);if(i<0||i>=nx||j<0||j>=ny)return null;
  const hits=new Map();
  for(const ti of bins[j*nx+i]){
   const a=idx[ti*3]*3,b=idx[ti*3+1]*3,c=idx[ti*3+2]*3,ax=xyz[a+uAxis],ay=xyz[a+vAxis],bx=xyz[b+uAxis],by=xyz[b+vAxis],cx=xyz[c+uAxis],cy=xyz[c+vAxis],den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-13)continue;
   const w0=((by-cy)*(u-cx)+(cx-bx)*(v-cy))/den,w1=((cy-ay)*(u-cx)+(ax-cx)*(v-cy))/den,w2=1-w0-w1;if(Math.min(w0,w1,w2)<-1e-8)continue;
   const z=w0*xyz[a+axis]+w1*xyz[b+axis]+w2*xyz[c+axis],gid=triGuide[ti],old=hits.get(gid);if(!old)hits.set(gid,{min:z,max:z});else{old.min=Math.min(old.min,z);old.max=Math.max(old.max,z);}
  }
  let front=-Infinity,frontGuide=-1,rear=Infinity,rearGuide=-1;for(const[guide,h]of hits){if(h.max>front){front=h.max;frontGuide=guide;}if(h.min<rear){rear=h.min;rearGuide=guide;}}
  return{front,frontGuide,rear,rearGuide,hits};
 }};
}

export const originalRanges=(n=276)=>Array.from({length:n},(_,guide)=>({guide,from:guide*549,to:(guide+1)*549,triangleFrom:guide*960,triangleTo:(guide+1)*960,changed:false}));
