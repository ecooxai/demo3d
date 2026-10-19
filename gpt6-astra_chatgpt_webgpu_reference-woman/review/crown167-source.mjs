import fs from 'node:fs';
import {THREE,read,Matrix4,prepareCrownLayout156,preparedHead156} from './crown156-source.mjs';
import {faceZ,createHairContact,fit} from './guide-placement118-source.mjs';
import {mul,T,RY,RZ,object} from './torso-depth110-harness.mjs';
import {createJawSilhouetteField155} from './jaw-silhouette155-field.js';
export {THREE,read,Matrix4};
const H=mul(T(.26,2.95,0),mul(RY(.16),RZ(-.17)));
const frontText=read('review/front-locks-candidate167.js');
export const front167=new Function('THREE',frontText+'\nreturn {createFrontCapture167,applyFrontLocks167,setCoarseIsolation167,restoreCoarseIsolation167,getFrontLocks167QA,releaseFrontLocks167,supportIndex,sampleCrown,currentOffset,buildRoute167,makeRoundedLocks167,retireCrown167,SPECS167,retainedRootRows167,RIBBON167_SPEC,INTENDED_RAIL167};')(THREE);
export function sourceGroom167({capture=true,baseline=false}={}){
 const source=read(baseline?'src/hair-groom.js':'review/hair-groom-candidate167.js'),make=new Function('THREE','faceZ','createHairContact','fitLowerGuides118','protectUpperFiber118','createFrontCapture167',source+'\nreturn createGroomHair;')(THREE,faceZ,createHairContact,fit.fitLowerGuides118,fit.protectUpperFiber118,front167.createFrontCapture167),groom=make({headShiftX:.26,shoulderContact:.35,guidePlacement:.5,diagonalFringe133:1,captureFront167:capture});
 groom.isObject3D=true;groom.matrixWorld=H;groom.updateWorldMatrix=()=>{};groom.remove=o=>{groom.children=groom.children.filter(x=>x!==o);};
 for(const mesh of groom.children){mesh.matrixWorld=H;mesh.parent=groom;mesh.geometry.userData??={};}
 const balance=new Function('Matrix4',read('src/portrait-balance.js')+'\nreturn applyPortraitBalance;')(Matrix4),model=object('model');model.add(groom);balance(model,{shiftX:-.24});
 groom.children[0].material.side=0;groom.children[0].material.shadowSide=2;return groom;
}
export const prepareCrownLayout167=prepareCrownLayout156;
// Local source fixture applies the exact frozen159 field to actual indexed
// prepared147 face/115 ears. The selected native159 mouth box supplies its
// unchanged shield; unrelated lip/lash/cloth meshes are not source fixtures.
export function preparedHead167(){
 const head=preparedHead156(),config=JSON.parse(fs.readFileSync('review/jaw-silhouette155-config.json','utf8')),field=createJawSilhouetteField155(config,[439.3194607999864,565.7529824434536,636.594098471038,678.0730536583047]);
 head.traverse(mesh=>{
  if(!mesh.isMesh||!['continuous-face','ear-continuous-anatomical-shell'].includes(mesh.name))return;
  const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,a=mesh.matrixWorld.elements,inverse=mesh.matrixWorld.clone().invert().elements;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i),wx=a[0]*x+a[4]*y+a[8]*z+a[12],wy=a[1]*x+a[5]*y+a[9]*z+a[13],wz=a[2]*x+a[6]*y+a[10]*z+a[14],s=field.world(wx,wy,wz);if(!s.active)continue;
   const[dx,dy]=s.delta,j=s.jacobian,det=s.determinant;p.setXYZ(i,x+inverse[0]*dx+inverse[4]*dy,y+inverse[1]*dx+inverse[5]*dy,z+inverse[2]*dx+inverse[6]*dy);
   if(nx===0&&ny===0&&nz===0)continue;
   const ux=inverse[0]*nx+inverse[1]*ny+inverse[2]*nz,uy=inverse[4]*nx+inverse[5]*ny+inverse[6]*nz,uz=inverse[8]*nx+inverse[9]*ny+inverse[10]*nz,vx=(j[4]*ux-j[3]*uy)/det,vy=(-j[1]*ux+j[0]*uy)/det,vz=uz-j[2]*vx-j[5]*vy,tx=a[0]*vx+a[1]*vy+a[2]*vz,ty=a[4]*vx+a[5]*vy+a[6]*vz,tz=a[8]*vx+a[9]*vy+a[10]*vz,length=Math.hypot(tx,ty,tz);n.setXYZ(i,tx/length,ty/length,tz/length);
  }
 });return head;
}
