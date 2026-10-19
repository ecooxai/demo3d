import fs from 'node:fs';
import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
import {Matrix4,I,mul,T,RY,RZ,point,object,attach,Group} from './torso-depth110-harness.mjs';
import {sourceHead147} from './eye-contour147-source.mjs';
import {sourceEar} from './near-ear115-source.mjs';
import {applyEyeContour147} from '../src/eye-contour.js';
export{THREE,read,Matrix4};
THREE.Matrix4=Matrix4;
THREE.Color.prototype.toArray=function(){return[this.r,this.g,this.b];};
const OriginalMaterial=THREE.MeshPhysicalMaterial;
THREE.MeshPhysicalMaterial=class extends OriginalMaterial{
 constructor(options={}){super(options);this.isMeshPhysicalMaterial=true;this.color=options.color instanceof THREE.Color?options.color.clone():new THREE.Color(options.color??'#ffffff');this.userData={};}
 clone(){const m=new THREE.MeshPhysicalMaterial({...this});m.color=this.color.clone();m.userData=JSON.parse(JSON.stringify(this.userData||{}));return m;}
 dispose(){}
};
const H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17))),inverse=H.clone().invert().elements,delta=[-.24*inverse[0],-.24*inverse[1],-.24*inverse[2]];
const frontText=read('review/front-root-candidate156.js');
export const front156=new Function('THREE',frontText+'\nreturn {createFrontCapture156,applyFrontRoot156,setCoarseIsolation156,restoreCoarseIsolation156,getFrontRoot156QA,releaseFrontRoot156,supportIndex,sampleCrown,currentOffset,makePlan156,makeSurface156,insidePolygon,crownAttributes};')(THREE);
export function sourceGroom156({capture=true,baseline=false}={}){
 const source=read(baseline?'review/hair-groom-candidate133.js':'review/hair-groom-candidate156.js'),make=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','createFrontCapture156',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,front156.createFrontCapture156),groom=make({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,captureFront156:capture});
 groom.isObject3D=true;groom.matrixWorld=H;groom.updateWorldMatrix=()=>{};groom.remove=o=>{groom.children=groom.children.filter(x=>x!==o);};
 for(const mesh of groom.children){mesh.matrixWorld=H;mesh.parent=groom;mesh.geometry.userData??={};}
 const balance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4),model=object('model');model.add(groom);balance(model,{shiftX:-.24});
 groom.children[0].material.side=0;groom.children[0].material.shadowSide=2;return groom;
}
// Geometry-only100 layout fixture. Native tests use the actual accepted image1
// bake. This fixture reproduces UV1, vertex compensation and coverage bytes;
// its channel1 RGB texture is a placeholder and is never judged as artwork.
export function prepareCrownLayout156(groom){
 const mesh=groom.children.find(m=>m.name==='Continuous parted crown with longitudinal fiber flow'),g=mesh.geometry,p=g.attributes.position,uv=g.attributes.uv,c=g.attributes.color,uv1=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){
  const u=uv.getX(i),v=uv.getY(i);
  if(i<7685){uv1[2*i]=(16+u*512)/2048;uv1[2*i+1]=(1040+v*1024)/2048;}
  else{const side=i<16070?0:1;uv1[2*i]=(side*1024+16+u*992)/2048;uv1[2*i+1]=(16+v*992)/2048;for(let k=0;k<3;k++)c.array[i*4+k]/=.60;}
 }
 g.setAttribute('uv1',new THREE.Float32BufferAttribute(uv1,2));
 const material=mesh.material,old=material.map,alpha=new Uint8Array(old.image.data.length);
 for(let i=0;i<alpha.length;i+=4)alpha[i]=alpha[i+1]=alpha[i+2]=old.image.data[i+3],alpha[i+3]=255;
 material.alphaMap=new THREE.DataTexture(alpha,old.image.width,old.image.height);material.alphaMap.channel=0;
 material.map={...old,image:old.image,channel:1,userData:{sourceFixture156:true}};
 material.userData={referenceCrownMicrocontrast:{sourceFixture156:true}};return groom;
}
export function preparedHead156(){
 const head=sourceHead147(),earSample=new Function('Matrix4',read('src/near-ear.js')+'\nreturn sample;')(Matrix4),out=new Float64Array(8);
 for(const side of[-1,1]){
  const source=sourceEar(side),g=source.geometry,p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++){
   let x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
   if(side<0){earSample(x,z,-25*Math.PI/180,out);const a=out[2],b=out[3],c=out[4],d=out[5],det=out[6],tx=(d*nx-c*nz)/det,tz=(-b*nx+a*nz)/det,l=Math.hypot(tx,ny,tz);x=out[0];z=out[1];nx=tx/l;ny/=l;nz=tz/l;}
   // Match the source115 Float32 write before the separate99 Float32 write.
   p.setXYZ(i,x,y,z);n.setXYZ(i,nx,ny,nz);p.setXYZ(i,p.getX(i)+delta[0],p.getY(i)+delta[1],p.getZ(i)+delta[2]);
  }
  const group=object(side<0?'left-ear':'right-ear',H);head.add(group);attach(group,source.name,g,H,source.material);
 }
 applyEyeContour147(head,{strength:1});return head;
}
