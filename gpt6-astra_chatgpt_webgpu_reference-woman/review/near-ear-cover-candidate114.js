import * as THREE from 'three';

// A small original tucked layer reduces the exposed outer near-ear rim.
// Points are authored in the groom's final head-local coordinates, before99 balance.
const states=new WeakMap(),V=(x,y,z)=>new THREE.Vector3(x,y,z);
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
function random(seed){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
function frame(c,t){
 const p=c.getPoint(t),d=c.getTangent(t).normalize(),n=V(-.08,.01,1).normalize(),s=d.clone().cross(n).normalize();
 return{p,s,n:s.clone().cross(d).normalize()};
}
function batch(){return{p:[],c:[],uv:[],i:[]};}
function vert(b,p,c,u,v){const i=b.p.length/3;b.p.push(p.x,p.y,p.z);b.c.push(c.r,c.g,c.b);b.uv.push(u,v);return i;}
function shape(t,phase){return(.08+.92*smooth(0,.10,t))*(.018+.982*(1-smooth(.69+.06*Math.sin(phase),1,t)));}
function buildMesh(b,material,name,castShadow){
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.i);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 let normError=0;const n=g.attributes.normal;
 for(let i=0;i<n.count;i++)normError=Math.max(normError,Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1));
 if(!b.p.every(Number.isFinite)||normError>1e-5){g.dispose();throw new Error('Near-ear114 invalid geometry');}
 const m=new THREE.Mesh(g,material);m.name=name;m.castShadow=castShadow;m.receiveShadow=true;
 return{mesh:m,normError,bytes:g.attributes.position.array.byteLength+g.attributes.color.array.byteLength+g.attributes.normal.array.byteLength+g.attributes.uv.array.byteLength+g.index.array.byteLength};
}
export function attachNearEarCover114(hair,{strength=1}={}){
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Near-ear strength must be in[0,1]');
 if(!strength)return{strength,status:'baseline',changed:false};
 const prior=states.get(hair);if(prior){if(prior.strength!==strength)throw new Error('Near-ear comparison requires a fresh groom');return prior;}
 const started=performance.now(),mass=hair.getObjectByName('Overlapping layered S-wave hair around front back and shoulders'),detail=hair.getObjectByName('Independent fine crown lengths and silhouette strands');
 if(!mass?.isMesh||!detail?.isMesh)throw new Error('Near-ear114 requires the accepted groom');
 const core=batch(),fine=batch(),rand=random(114326),count=14,steps=48,base=new THREE.Color('#50413e');
 for(let k=0;k<count;k++){
  const q=k/(count-1),phase=k*2.399,spread=strength*(q-.5)+.5,depth=.0025*Math.sin(phase),color=base.clone().multiplyScalar(.98+.025*rand());
  const c=new THREE.CatmullRomCurve3([
   V(-.803-.068*spread,.635+.012*Math.sin(phase),.166-.034*spread),
   V(-.863-.050*spread,.378,.218+.018*spread),
   V(-.904-.062*spread,.205,.303+depth),
   V(-.918-.061*spread,-.018,.306+depth),
   V(-.921-.059*spread,-.178,.256+depth),
   V(-.930-.042*spread,-.344,.119+.008*spread),
   V(-.944-.027*spread,-.586-.068*rand(),.073+.010*spread)
  ],false,'catmullrom',.35),width=(.0058+.0012*rand())*strength,depthRadius=.0032*strength,start=core.p.length/3;
  for(let j=0;j<=steps;j++){const t=j/steps,f=frame(c,t),taper=shape(t,phase);for(let r=0;r<=8;r++){const a=r/8*Math.PI*2;vert(core,f.p.clone().addScaledVector(f.s,Math.cos(a)*width*taper).addScaledVector(f.n,Math.sin(a)*depthRadius*taper),color,r/8+phase*.173,t);}}
  for(let j=0;j<steps;j++)for(let r=0;r<8;r++){const a=start+j*9+r,b=a+9;core.i.push(a,b,a+1,a+1,b,b+1);}
  for(let strand=0;strand<18;strand++){
   const lane=(strand+.2+.6*rand())/18*2-1,radius=.00038+.00018*rand(),offset=.00055+.00025*rand(),points=[];
   for(let j=0;j<=32;j++){const t=j/32,f=frame(c,t),taper=shape(t,phase);points.push(f.p.clone().addScaledVector(f.s,lane*width*taper).addScaledVector(f.n,(depthRadius*Math.sqrt(Math.max(0,1-lane*lane))+offset)*taper));}
   const strandCurve=new THREE.CatmullRomCurve3(points,false,'catmullrom',.35),first=fine.p.length/3;
   for(let j=0;j<=32;j++){const t=j/32,f=frame(strandCurve,t),w=radius*strength*(.035+.965*(1-smooth(.68,1,t)));vert(fine,f.p.clone().addScaledVector(f.s,-w),color,0,t);vert(fine,f.p.clone().addScaledVector(f.s,w),color,1,t);}
   for(let j=0;j<32;j++){const a=first+j*2,b=a+2;fine.i.push(a,a+1,b,a+1,b+1,b);}
  }
 }
 const coreResult=buildMesh(core,mass.material,'Tucked near-ear rim locks114',true),fineResult=buildMesh(fine,detail.material,'Fine near-ear rim strands114',false);
 const group=new THREE.Group();group.name='Original near-ear tucked transition114';group.add(coreResult.mesh,fineResult.mesh);hair.add(group);
 const result={strength,status:'applied',changed:true,locks:count,fineStrands:count*18,addedTriangles:(core.i.length+fine.i.length)/3,geometryMiB:(coreResult.bytes+fineResult.bytes)/1048576,normalLengthError:Math.max(coreResult.normError,fineResult.normError),constructionMs:performance.now()-started,otherGeometryChanged:false,source:'Original geometric tucked strands guided only by supplied image1.'};
 hair.userData.nearEarCover114=result;states.set(hair,result);return result;
}
