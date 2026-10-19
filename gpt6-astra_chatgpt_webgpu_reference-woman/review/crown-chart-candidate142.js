// Isolated142: one shared front chart, using the existing surface and fiber slots.
// The old nonzero u=1 return edge closes at the accepted part tip. No alpha,
// texture, material, strand population, fringe path or lower guide changes.
export function createCrownChart142({THREE,base,forehead,strength=1}){
 if(strength!==1)throw Error('Crown142 is an isolated off/on geometry prototype.');
 const V=(x,y,z)=>new THREE.Vector3(x,y,z),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const sm=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(10+t*(-15+6*t));};
 const lerp=(a,b,t)=>a+(b-a)*t,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const P=base(-1,1,0,.002),rootD=base(-1,1,0,.002).sub(base(-1,1-.000001,0,.002)).multiplyScalar(1e6);
 const poleNormal=V(0,rootD.z,-rootD.y).normalize();if(poleNormal.z<0)poleNormal.multiplyScalar(-1);
 const metrics={version:'shared-front-crown-chart142',strength:1,changed:true,extraVertices:0,extraTriangles:0,alphaUnchanged:true,sharedPole:[P.x,P.y,P.z],polePlane:[poleNormal.x,poleNormal.y,poleNormal.z],changedCrownVertices:0,changedCrownFibers:0,changedEdgeWisps:0,poleVertices:130,intendedAdditionalDegenerateTriangles:128,protectedFringe:'All accepted133 geometry and root footprints',frontFiberRows:[],frontWispRows:[]};

 // Shape-preserving scalar Hermite rails. Only the terminal Z derivative is
 // prescribed separately, so all chart controls have a common tangent plane.
 function scalar(xs,ys,endSlope){
  const n=xs.length,d=Array(n-1),m=Array(n);for(let i=0;i<n-1;i++)d[i]=(ys[i+1]-ys[i])/(xs[i+1]-xs[i]);
  m[0]=d[0];m[n-1]=endSlope??d[n-2];
  for(let i=1;i<n-1;i++){
   if(d[i-1]*d[i]<=0)m[i]=0;else{const a=xs[i]-xs[i-1],b=xs[i+1]-xs[i],w1=2*b+a,w2=b+2*a;m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);}
  }
  return x=>{let i=0;while(i<n-2&&x>xs[i+1])i++;const h=xs[i+1]-xs[i],t=clamp((x-xs[i])/h),t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h*m[i+1];};
 }
 const rails={};
 for(const side of[-1,1]){
  const us=side<0?[.80,.83,.86,.90,.93,.95,1]:[.84,.86,.90,.93,.96,1];
  const ys=side<0?[base(side,.80,1,.002).y,.840,.880,.910,.960,.995,P.y]:[base(side,.84,1,.002).y,.835,.875,.935,.995,P.y];
  const xs=us.map(u=>base(side,u,1,.002).x);xs[xs.length-1]=P.x;
  if(side>0){xs[3]=.223;xs[4]=.201;}
  const zs=us.map((u,i)=>i===0?base(side,u,1,.002).z:i===us.length-1?P.z:forehead(xs[i],ys[i])+.080);
  // Close the rail in the part-tip volume, rather than dipping to the forehead
  // and making a tight normal-offset fold immediately before the corner.
  if(side>0){zs[3]=.626;zs[4]=.635;}else zs[5]=.625;
  const dy=(ys.at(-1)-ys.at(-2))/(us.at(-1)-us.at(-2)),dx=(xs.at(-1)-xs.at(-2))/(us.at(-1)-us.at(-2));
  const dz=-(poleNormal.x*dx+poleNormal.y*dy)/poleNormal.z;
  rails[side]={us,x:scalar(us,xs),y:scalar(us,ys),z:scalar(us,zs,dz),anchors:us.map((u,i)=>[u,xs[i],ys[i],zs[i]]),endDerivative:[dx,dy,dz]};
 }
 metrics.endpointRails=Object.fromEntries([-1,1].map(s=>[s,{anchors:rails[s].anchors,endDerivative:rails[s].endDerivative}]));

 function prefix(side,u){
  if(side<0){if(u<=.835)return.805;if(u<.881)return lerp(.805,.765,sm(.835,.881,u));if(u<=.926)return.765;return lerp(.765,.575,sm(.926,.946,u));}
  return lerp(.625,.705,sm(.835,.845,u));
 }
 function full(side,u){return side<0?sm(.952,.980,u):sm(.890,.925,u);}
 function active(side,u){return side<0?sm(.800,.825,u):sm(.840,.860,u);}
 function protectedPoint(side,u,v){return active(side,u)===0||(full(side,u)===0&&v<=prefix(side,u));}
 function influence(side,u,v){
  if(protectedPoint(side,u,v))return 0;
  const b=prefix(side,u),a=active(side,u),f=full(side,u);
  // A smooth frame/lift handover accompanies the exact C1 geometric tail.
  return a*(f*sm(0,.12,v)+(1-f)*sm(b,Math.min(1,b+.10),v));
 }
 function end(side,u){if(u>=1)return P.clone();const r=rails[side];return V(r.x(u),r.y(u),r.z(u));}
 function bez(a,b,c,d,t){const s=1-t;return a.clone().multiplyScalar(s*s*s).addScaledVector(b,3*s*s*t).addScaledVector(c,3*s*t*t).addScaledVector(d,t*t*t);}
 function fullSpan(side,u,v){
  const r=base(side,u,0,.002),e=end(side,u),delta=e.clone().sub(r);
  // O((1-u)^2) relief cannot turn the closed corner into a conical fan.
  const arch=.010*Math.pow(clamp((1-u)/.08),2),b=r.clone().addScaledVector(delta,.20).addScaledVector(poleNormal,arch),c=r.clone().addScaledVector(delta,.72).addScaledVector(poleNormal,arch);
  return bez(r,b,c,e,v);
 }
 function tailSpan(side,u,v){
  const b=prefix(side,u);if(v<=b)return base(side,u,v,.002);
  const a=base(side,u,b,.002),e=end(side,u),eps=.00001,d=base(side,u,b+eps,.002).sub(base(side,u,b-eps,.002)).multiplyScalar(1/(2*eps));
  const q=(1-b)/3,c1=a.clone().addScaledVector(d,q),c2=e.clone().lerp(a,.25);
  return bez(a,c1,c2,e,(v-b)/(1-b));
 }
 function point(side,u,v){
  u=clamp(u);v=clamp(v);if(protectedPoint(side,u,v))return base(side,u,v,.002);if(u===1)return P.clone();
  const f=full(side,u),a=active(side,u),p=f===1?fullSpan(side,u,v):f===0?tailSpan(side,u,v):tailSpan(side,u,v).lerp(fullSpan(side,u,v),f);
  return a===1?p:base(side,u,v,.002).lerp(p,a);
 }
 function normal(side,u,v){
  if(u>1-.000002)return poleNormal.clone();
  const h=Math.min(.00002,(1-u)*.05),u0=Math.max(0,u-h),u1=Math.min(1,u+h),v0=Math.max(0,v-.00002),v1=Math.min(1,v+.00002);
  const du=point(side,u1,v).sub(point(side,u0,v)),dv=point(side,u,v1).sub(point(side,u,v0)),n=du.cross(dv).multiplyScalar(side);
  return n.lengthSq()>1e-28?n.normalize():poleNormal.clone();
 }
 function sample(side,u,v,lift=.002){
  if(protectedPoint(side,u,v))return base(side,u,v,lift);
  const p=point(side,u,v);if(lift===.002)return p;
  const a=influence(side,u,v),old=base(side,u,v,lift).sub(base(side,u,v,.002)),n=normal(side,u,v),collapse=clamp((1-u)/.010);
  // The original free upper layers can stand .02 away from the old scalp.
  // A bounded offset follows the tighter new chart without offset-surface
  // foldovers; protected prefixes retain their exact original lift.
  const boundedLift=lerp(lift-.002,.002*Math.tanh((lift-.002)/.002),full(side,u));
  return p.addScaledVector(old,1-a).addScaledVector(n,boundedLift*a*collapse);
 }
 function fiberCurve({side,u,samples,oldCurve,oldFrame,width,k,first}){
  if(active(side,u)===0)return{curve:oldCurve,width};
  // Original knot draws are retained; rebuilding is sampled directly from the
  // host rather than interpolated again through unconstrained XYZ controls.
  function params(t){const z=clamp(t)*20,i=Math.min(19,Math.floor(z)),q=z-i,a=samples[i],b=samples[i+1],rawU=lerp(a.u,b.u,q),wander=rawU-u,v=lerp(a.v,b.v,q),close=clamp((1-u)/.012)*(1-full(side,u)*influence(side,u,v));return{u:u+wander*close,v,lift:lerp(a.lift,b.lift,q)};}
  const curve={getPoint(t){
   const q=params(t),a=influence(side,q.u,q.v);if(a===0)return oldCurve.getPoint(t);
   const p=sample(side,q.u,q.v,q.lift),residual=oldCurve.getPoint(t).sub(base(side,q.u,q.v,q.lift));return p.addScaledVector(residual,1-a);
  },getTangent(t){const a=Math.max(0,t-.00002),b=Math.min(1,t+.00002);return this.getPoint(b).sub(this.getPoint(a)).normalize();}};
  curve.frame142=t=>{
   const q=params(t),a=influence(side,q.u,q.v);if(a===0)return oldFrame(oldCurve,t,false);
   const p=curve.getPoint(t),d=curve.getTangent(t),n=oldFrame(oldCurve,t,false).n.lerp(normal(side,q.u,q.v),a).normalize();
   const s=d.clone().cross(n);if(s.lengthSq()<1e-16)s.set(1,0,0);else s.normalize();return{p,d,s,n:s.clone().cross(d).normalize()};
  };
  // Fine ribbons narrow smoothly after leaving their exact retained prefix.
  // This preserves distinct layers where the new chart uses less transverse
  // space; it does not move their shared center paths or add opaque coverage.
  const freeRootWidth=side<0?sm(.952,.962,u):sm(.890,.895,u);
  curve.width142=t=>{const q=params(t);return 1-.45*Math.max(freeRootWidth,Math.sqrt(influence(side,q.u,q.v)));};
  const length=dist(point(side,u,0),point(side,u,1)),boundedWidth=Math.min(width,Math.max(.000008,length*.0075));
  metrics.changedCrownFibers++;metrics.frontFiberRows.push({side,k,u,first,width:boundedWidth,oldWidth:width});
  return{curve,width:boundedWidth,params};
 }
 function wispExtension(side,u,extension){const w=active(side,u);if(w===0)return extension;const length=dist(point(side,u,.79),point(side,u,1));return lerp(extension,Math.min(extension,.30*length),w);}
 function finishCrown(mesh,original,protectedVertices,partRows){
  const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,n0=original.geometry.attributes.normal,index=g.index.array;
  for(let i=0;i<n.count;i++)if(protectedVertices[i])n.setXYZ(i,n0.getX(i),n0.getY(i),n0.getZ(i));
  // A protected bank keeps its accepted part normal on both copies.
  for(let i=0;i<=128;i++){const a=partRows[0]+i,b=partRows[1]+i;if(protectedVertices[a]||protectedVertices[b]){n.setXYZ(a,n0.getX(a),n0.getY(a),n0.getZ(a));n.setXYZ(b,n0.getX(b),n0.getY(b),n0.getZ(b));}}
  const pole=new Set();for(const first of partRows)for(let j=0;j<=64;j++)pole.add(first+j*129+128);
  let nx=0,ny=0,nz=0,faces=0;
  for(let i=0;i<index.length;i+=3){const a=index[i],b=index[i+1],c=index[i+2];if(!pole.has(a)&&!pole.has(b)&&!pole.has(c))continue;
   const ux=p.getX(b)-p.getX(a),uy=p.getY(b)-p.getY(a),uz=p.getZ(b)-p.getZ(a),vx=p.getX(c)-p.getX(a),vy=p.getY(c)-p.getY(a),vz=p.getZ(c)-p.getZ(a),x=uy*vz-uz*vy,y=uz*vx-ux*vz,z=ux*vy-uy*vx;
   if(Math.hypot(x,y,z)>1e-16){nx+=x;ny+=y;nz+=z;faces++;}
  }
  const length=Math.hypot(nx,ny,nz);if(length<1e-12)throw Error('Crown142 pole has no finite incident normal.');nx/=length;ny/=length;nz/=length;
  if(nx*poleNormal.x+ny*poleNormal.y+nz*poleNormal.z<=0)throw Error('Crown142 pole orientation reversed.');
  for(const i of pole)n.setXYZ(i,nx,ny,nz);n.needsUpdate=true;
  metrics.poleNormal=[nx,ny,nz];metrics.poleIncidentNondegenerateFaces=faces;
  original.geometry.dispose?.();
 }
 return{sample,point,normal,prefix,influence,protectedPoint,active,fiberCurve,wispExtension,finishCrown,metrics,P,poleNormal};
}
