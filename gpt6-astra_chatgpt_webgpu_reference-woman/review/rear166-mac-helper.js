// New Mac recovery of the documented166 field after the auxiliary runner outage.
// This is not a claim of byte identity to the inaccessible original local freeze.
// Original guides, authored maps, random draws and upper point/tangent values survive.
const channels166=[[-.80,.24,.033,.045,.35],[-.43,.21,.067,.060,1.75],[-.05,.29,.055,.035,2.90],[.34,.23,.080,.055,.95],[.73,.22,.037,.045,2.20]];
const drops166=[[0,.62,.20],[-.62,.24,.055],[.46,.22,.040]];
function gate166(y,a,b){
 const t=(y-a)/(b-a);if(t<=0)return[0,0];if(t>=1)return[1,0];
 return[t*t*t*(10+t*(-15+6*t)),30*t*t*(1-t)*(1-t)/(b-a)];
}
export function isRear166(g){return g.kind==='back'||g.kind==='inner-back';}
export function rearField166(x,y,kind,strength=1){
 if(!strength||y>=-.75)return{dy:0,dz:0,yx:0,yy:1,zx:0,zy:0,determinant:1};
 const[L,Ly]=gate166(y,-1.65,-3.35),[W,Wy]=gate166(y,-.75,-2.10);let B=0,Bx=0,R=0,Rx=0,Ry=0;
 for(const[c,w,h]of drops166){const q=(x-c)/w,e=h*Math.exp(-q*q);B+=e;Bx+=e*(-2*q/w);}
 for(const[c,w,h,d,phase]of channels166){const a=1.8*(y+1.1)+phase,center=c+d*Math.sin(a),cy=d*1.8*Math.cos(a),q=(x-center)/w,e=h*Math.exp(-q*q);R+=e;Rx+=e*(-2*q/w);Ry+=e*(2*q/w)*cy;}
 const s=strength,layer=kind==='inner-back'?.65:1,yy=1-s*Ly*B;
 return{dy:-s*L*B,dz:-s*W*R*layer,yx:-s*L*Bx,yy,zx:-s*W*Rx*layer,zy:-s*(Wy*R+W*Ry)*layer,determinant:yy};
}
export function applyRearFlow166(guides,{strength=0}={}){
 const started=performance.now(),s=Number(strength);if(!Number.isFinite(s)||s<0||s>1)throw Error('166 strength outside [0,1]');
 const metrics={version:'rear-flow-166-mac-recovery',strength:s,guideCount:0,outer:0,inner:0,maximumSampledDrop:0,maximumSampledDepth:0,minimumSampledDeterminant:1,upperPointTangentIdentity:true,scope:'Guide field only; sampled bounds do not certify every swept triangle or interface.'};
 if(!s){metrics.elapsedMs=performance.now()-started;return metrics;}
 for(const g of guides){
  if(!isRear166(g))continue;if(g.c.getFrame118)throw Error('166 unexpected rear custom frame');
  const original=g.c,kind=g.kind;
  g.c={getPoint(t){const p=original.getPoint(t);if(p.y>=-.75)return p;const f=rearField166(p.x,p.y,kind,s);p.y+=f.dy;p.z+=f.dz;return p;},getTangent(t){const p=original.getPoint(t),d=original.getTangent(t);if(p.y>=-.75)return d;const f=rearField166(p.x,p.y,kind,s),x=d.x,y=d.y,z=d.z;return d.set(x,f.yx*x+f.yy*y,f.zx*x+f.zy*y+z).normalize();}};
  g.tipY=g.c.getPoint(1).y;metrics.guideCount++;if(kind==='back')metrics.outer++;else metrics.inner++;
  for(let j=0;j<=64;j++){const p=original.getPoint(j/64),f=rearField166(p.x,p.y,kind,s);metrics.maximumSampledDrop=Math.max(metrics.maximumSampledDrop,-f.dy);metrics.maximumSampledDepth=Math.max(metrics.maximumSampledDepth,-f.dz);metrics.minimumSampledDeterminant=Math.min(metrics.minimumSampledDeterminant,f.determinant);}
 }
 if(metrics.guideCount!==106||metrics.outer!==58||metrics.inner!==48)throw Error('166 rear guide inventory changed');
 metrics.elapsedMs=performance.now()-started;return metrics;
}
