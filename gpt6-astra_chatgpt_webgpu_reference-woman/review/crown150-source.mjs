import fs from 'node:fs';
import {THREE,read,faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
import {Matrix4,I,mul,T,RY,RZ,point,object,attach,Group} from './torso-depth110-harness.mjs';
import {sourceHead147} from './eye-contour147-source.mjs';
import {sourceEar} from './near-ear115-source.mjs';
import {applyEyeContour147} from '../src/eye-contour.js';
export{THREE,read,Matrix4};
THREE.Matrix4=Matrix4;
const OriginalMaterial=THREE.MeshPhysicalMaterial;
THREE.MeshPhysicalMaterial=class extends OriginalMaterial{
 constructor(options={}){super(options);this.isMeshPhysicalMaterial=true;this.color=options.color instanceof THREE.Color?options.color.clone():new THREE.Color(options.color??'#ffffff');this.userData={};}
 clone(){const m=new THREE.MeshPhysicalMaterial({...this});m.color=this.color.clone();m.userData=JSON.parse(JSON.stringify(this.userData||{}));return m;}
 dispose(){}
};
const H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17))),inverse=H.clone().invert().elements,delta=[-.24*inverse[0],-.24*inverse[1],-.24*inverse[2]];
const frontText=read('review/front-root-candidate150.js');
export const front150=new Function('THREE',frontText+'\nreturn {createFrontCapture150,applyFrontRoot150,setCoarseIsolation150,restoreCoarseIsolation150,getFrontRoot150QA,releaseFrontRoot150,supportIndex,makeRoute,sampleCrown,currentOffset};')(THREE);
export function sourceGroom150({capture=true,baseline=false}={}){
 const source=read(baseline?'review/hair-groom-candidate133.js':'review/hair-groom-candidate150.js'),make=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','createFrontCapture150',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,front150.createFrontCapture150),groom=make({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,captureFront150:capture});
 groom.isObject3D=true;groom.matrixWorld=H;groom.updateWorldMatrix=()=>{};groom.remove=o=>{groom.children=groom.children.filter(x=>x!==o);};
 for(const mesh of groom.children){mesh.matrixWorld=H;mesh.parent=groom;mesh.geometry.userData??={};}
 const balance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4),model=object('model');model.add(groom);balance(model,{shiftX:-.24});
 groom.children[0].material.side=0;groom.children[0].material.shadowSide=2;return groom;
}
export function preparedHead150(){
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
