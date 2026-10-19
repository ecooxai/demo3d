// Coarse146: one front surface field and earlier, long upper-fringe departures.
// Dedicated crown/edge fibers are deliberately not rebuilt at this stage.
export function createCrownFlow146({THREE,base,forehead}){
 const V=(x,y,z)=>new THREE.Vector3(x,y,z),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const mix=(a,b,t)=>a+(b-a)*t,sm=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*t*(10+t*(-15+6*t));};
 const length=p=>Math.hypot(p.x,p.y,p.z),arr=p=>[p.x,p.y,p.z];
 const cuts=[.74,.76,.78,.73,.63,.50],P=base(-1,1,0,.002);P.z-=.035;
 const metrics={version:'coordinated-coarse-crown146',stage:'coarse-only; owned old crown/edge fibers require later resampling',changedCrownVertices:0,changedFringeStrands:0,sourceSlots:0,maximumRootInset:0,maximumRootOutset:0,maximumUpperJoinError:0,maximumCutTangentAngle:0,maximumCutCurvatureJump:0,maximumDepthArch:0,minimumCubicYControlGap:Infinity,minimumLeftXControlGap:Infinity,shortEndCuts:0,fringeRows:[],coarseDetailRanges:[],coarseWispRanges:[],partTip:arr(P),protectedCutY:cuts};
 function scalar(xs,ys,endSlope){
  const n=xs.length,d=[],m=[];for(let i=0;i<n-1;i++)d[i]=(ys[i+1]-ys[i])/(xs[i+1]-xs[i]);m[0]=d[0];m[n-1]=endSlope??d[n-2];
  for(let i=1;i<n-1;i++){if(d[i-1]*d[i]<=0)m[i]=0;else{const a=xs[i]-xs[i-1],b=xs[i+1]-xs[i],w1=2*b+a,w2=b+2*a;m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);}}
  const value=x=>{let lo=0,hi=n-2;while(lo<hi){const mid=(lo+hi+1)>>1;if(x>=xs[mid])lo=mid;else hi=mid-1;}const i=lo,h=xs[i+1]-xs[i],t=clamp((x-xs[i])/h),t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h*m[i+1];};
  value.startSlope=m[0];return value;
 }
 // A single smooth support envelope gives all front chart limits one normal.
 // Root samples include every existing sheet's u grid coordinate exactly.
 const rootY=[],rootGap=[],rootX=[];
 for(let i=512;i>=352;i--){const u=i/512,r=base(-1,u,0,.002),inset=.035*sm(.86,.98,u);rootY.push(r.y);rootX.push(r.x);rootGap.push(r.z-inset-forehead(r.x,r.y));}
 const gapAtY=scalar(rootY,rootGap),partXAtY=scalar(rootY,rootX),gapP=rootGap[0];
 function support(x,y){
  let gap;
  if(y>=P.y)gap=gapAtY(y);else{
   const h=P.y-.38,t=clamp((y-.38)/h),t2=t*t,t3=t2*t;
   gap=(2*t3-3*t2+1)*.052+(-2*t3+3*t2)*gapP+(t3-t2)*h*gapAtY.startSlope;
  }
  const px=y>=P.y?partXAtY(y):P.x,away=Math.abs(x-px);
  gap*=1-.27*sm(.08,.58,away);
  const leftLift=.009*Math.exp(-Math.pow((x+.18)/.31,2))*sm(.04,.16,away)*sm(.70,.97,y)*(1-sm(1.25,1.45,y));
  return forehead(x,y)+gap+leftLift;
 }
 function root(side,u){const r=base(side,u,0,.002),inset=.035*sm(.86,.98,u);r.z-=inset;metrics.maximumRootInset=Math.max(metrics.maximumRootInset,inset);return r;}
 const rails={};
 for(const side of[-1,1]){
  const us=side<0?[.755,.80,.81,.85,.90,.935,.950,.972,.985,1]:[.745,.78,.82,.865,.90,.935,.956,.978,1];
  const ys=side<0?[base(side,.755,1,.002).y,.792,.820,.942,1.035,1.098,1.112,1.066,1.047,P.y]:[base(side,.745,1,.002).y,.575,.715,.900,.987,1.065,1.065,1.050,P.y];
  const xs=us.map(u=>base(side,u,1,.002).x);
  if(side<0){xs[7]=.025;xs[8]=.095;}else{xs[5]=.221;xs[6]=.204;xs[7]=.193;}
  xs[xs.length-1]=P.x;
  rails[side]={x:scalar(us,xs),y:scalar(us,ys),anchors:us.map((u,i)=>[u,xs[i],ys[i]])};
 }
 metrics.endpointRails=Object.fromEntries([-1,1].map(s=>[s,rails[s].anchors]));
 const active=(side,u)=>side<0?sm(.755,.790,u):sm(.745,.780,u);
 function end(side,u){if(u===1)return P.clone();const r=rails[side],x=r.x(u),y=r.y(u);return V(x,y,support(x,y));}
 function full(side,u,v){
  if(u===1)return P.clone();const r=root(side,u),e=end(side,u);
  if(v===0)return r;
  const s=1-v,fx=3*s*s*v*.40+3*s*v*v*.90+v*v*v,fy=3*s*s*v*.14+3*s*v*v*.55+v*v*v;
  const x=mix(r.x,e.x,fx),y=mix(r.y,e.y,fy),z=support(x,y);
  return V(x,y,z);
 }
 function point(side,u,v){u=clamp(u);v=clamp(v);const w=active(side,u);if(w===0)return base(side,u,v,.002);const p=full(side,u,v);return w===1?p:base(side,u,v,.002).lerp(p,w);}
 function normal(side,u,v){
  if(u>1-.000002){const h=.00002,x=P.x,y=P.y,n=V(-(support(x+h,y)-support(x-h,y))/(2*h),-(support(x,y+h)-support(x,y-h))/(2*h),1);return n.normalize();}
  const h=Math.min(.00002,(1-u)*.08),u0=Math.max(0,u-h),u1=Math.min(1,u+h),v0=Math.max(0,v-.00002),v1=Math.min(1,v+.00002);
  const du=point(side,u1,v).sub(point(side,u0,v)),dv=point(side,u,v1).sub(point(side,u,v0)),n=du.cross(dv).multiplyScalar(side);return n.lengthSq()>1e-24?n.normalize():V(0,0,1);
 }
 function sample(side,u,v,lift=.002){
  if(active(side,u)===0)return base(side,u,v,lift);const p=point(side,u,v);if(lift!==.002)p.addScaledVector(normal(side,u,v),lift-.002);return p;
 }
 const ownedVertex=(side,u,v)=>active(side,u)>0&&!(v===0&&u<=.86);
 const cubic=(a,b,c,d,t)=>{const s=1-t;return a.clone().multiplyScalar(s*s*s).addScaledVector(b,3*s*s*t).addScaledVector(c,3*s*t*t).addScaledVector(d,t*t*t);};
 function first(c,t,h=.00002){const a=Math.max(0,t-h),b=Math.min(1,t+h);return c.getPoint(b).sub(c.getPoint(a)).multiplyScalar(1/(b-a));}
 function second(c,t,h=.0003){return c.getPoint(t+h).addScaledVector(c.getPoint(t),-2).addScaledVector(c.getPoint(t-h),1).multiplyScalar(1/(h*h));}
 function decorateFringe({original,side,u,v0,v1,group,k,firstVertex,emitted,steps=20,ring=2}){
  if(group>=6)return original;metrics.sourceSlots++;
  let lo=0,hi=1;for(let i=0;i<30;i++){const t=(lo+hi)/2;if(original.getPoint(t).y>cuts[group])lo=t;else hi=t;}
  let cut=(lo+hi)/2;if(cut>.90){cut=.90;metrics.shortEndCuts++;}
  const J=original.getPoint(cut),Jd=first(original,cut),duration=cut*.58,tBreak=cut-duration,Q2=J.clone().addScaledVector(Jd,-duration/3);
  let depart=clamp(v1*.63,.20,.58),D,T;
  // These narrow roots share the bed's exact XY flow. A small depth offset
  // avoids amplifying the forehead table's derivative changes into lateral
  // or height oscillations; it is not an independent surface or backing.
  const rootLift=v=>.0045+.0035*sm(v0,depart,v),rootPoint=v=>{const p=point(side,u,v);p.z+=rootLift(v)-.002;return p;};
  for(let attempt=0;attempt<24;attempt++){
   D=rootPoint(depart);T=rootPoint(depart+.00002).sub(rootPoint(depart-.00002)).multiplyScalar(25000);
   if(D.y>Q2.y+.020&&(side>0||D.x>Q2.x+.018))break;depart=Math.max(v0+.025,depart-.012);
  }
  const Tlength=length(T),direction=T.clone().multiplyScalar(1/Tlength),chord=length(D.clone().sub(J));
  let handle=Math.min(chord*.17,.40*(D.y-Q2.y)/Math.max(.00001,-direction.y));
  if(side<0)handle=Math.min(handle,.42*(D.x-Q2.x)/Math.max(.00001,-direction.x));
  else if(direction.x>0)handle=Math.min(handle,(Math.max(D.x,J.x)+.060-D.x)/direction.x);
  const delta=depart-v0;
  handle=Math.max(.00006,Math.min(handle,1.40*delta*duration*Tlength/(3*tBreak)));const Q1=D.clone().addScaledVector(direction,handle);
  const beta=tBreak*3*handle/(duration*Tlength),m0=delta*1.55,m1=beta;
  const vAt=t=>{const q=clamp(t/tBreak),q2=q*q,q3=q2*q;return(2*q3-3*q2+1)*v0+(q3-2*q2+q)*m0+(-2*q3+3*q2)*depart+(q3-q2)*m1;};
  let arch=0;
  for(let i=1;i<32;i++){const s=i/32,p=cubic(D,Q1,Q2,J,s),shape=16*s*s*(1-s)*(1-s),need=forehead(p.x,p.y)+.024-p.z;arch=Math.max(arch,need/shape);}
  arch=Math.max(0,arch);metrics.maximumDepthArch=Math.max(metrics.maximumDepthArch,arch);
  const free=s=>{const p=cubic(D,Q1,Q2,J,s);p.z+=arch*16*s*s*(1-s)*(1-s);return p;};
  const c={getPoint(t){if(t>=cut)return original.getPoint(t);if(t<=tBreak)return rootPoint(vAt(t));return free((t-tBreak)/duration);},getTangent(t){if(t>=cut)return original.getTangent(t);return first(this,t).normalize();}};
  metrics.minimumCubicYControlGap=Math.min(metrics.minimumCubicYControlGap,D.y-Q1.y,Q1.y-Q2.y,Q2.y-J.y);
  if(side<0)metrics.minimumLeftXControlGap=Math.min(metrics.minimumLeftXControlGap,D.x-Q1.x,Q1.x-Q2.x,Q2.x-J.x);
  const newD=c.getPoint(cut-.00001).sub(c.getPoint(cut-.00002)).normalize(),oldD=original.getTangent(cut),angle=Math.acos(clamp(newD.dot(oldD),-1,1))*180/Math.PI;
  metrics.maximumCutTangentAngle=Math.max(metrics.maximumCutTangentAngle,angle);
  const newDD=second(c,cut-.0006),oldDD=second(original,cut+.0006);metrics.maximumCutCurvatureJump=Math.max(metrics.maximumCutCurvatureJump,length(newDD.sub(oldDD)));
  const j0=c.getPoint(tBreak-1e-7),j1=c.getPoint(tBreak+1e-7);metrics.maximumUpperJoinError=Math.max(metrics.maximumUpperJoinError,length(j0.sub(j1)));
  const row={group,k,side,u,cut,tBreak,depart,first:firstVertex,emitted,steps,ring,arch,join:arr(J)};
  if(emitted){metrics.changedFringeStrands++;metrics.fringeRows.push(row);}
  c.debug146={...row,original,controls:[D,Q1,Q2,J],rootPoint,vAt};return c;
 }
 function finishCrown(mesh,old,protectedVertices,partRows){
  const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,n0=old.geometry.attributes.normal;
  for(let i=0;i<n.count;i++)if(protectedVertices[i])n.setXYZ(i,n0.getX(i),n0.getY(i),n0.getZ(i));
  const pole=[];for(const first of partRows)for(let j=0;j<=64;j++)pole.push(first+j*129+128);
  const N=normal(-1,1,1);for(const i of pole)n.setXYZ(i,N.x,N.y,N.z);
  for(let i=0;i<=128;i++)if(i/128<=.86){const a=partRows[0]+i,b=partRows[1]+i;n.setXYZ(a,n0.getX(a),n0.getY(a),n0.getZ(a));n.setXYZ(b,n0.getX(b),n0.getY(b),n0.getZ(b));}
  n.needsUpdate=true;old.geometry.dispose?.();
 }
 function finishFringe(mesh,old,rows){
  const n=mesh.geometry.attributes.normal,n0=old.geometry.attributes.normal,p=mesh.geometry.attributes.position,p0=old.geometry.attributes.position;
  const owned=new Uint8Array(n.count);
  for(const row of rows)for(let j=0;j<=row.steps;j++)if(j/row.steps<row.cut)for(let k=0;k<row.ring;k++)owned[row.first+j*row.ring+k]=1;
  let exact=0,changed=0,lowerNormalJump=0;
  for(let i=0;i<n.count;i++){
   if(!owned[i]){p.setXYZ(i,p0.getX(i),p0.getY(i),p0.getZ(i));n.setXYZ(i,n0.getX(i),n0.getY(i),n0.getZ(i));exact++;}else changed++;
  }
  for(const row of rows){const j=Math.ceil(row.cut*row.steps);if(j<1||j>row.steps)continue;for(let k=0;k<row.ring;k++){const a=row.first+(j-1)*row.ring+k,b=row.first+j*row.ring+k;lowerNormalJump=Math.max(lowerNormalJump,Math.acos(clamp(n.getX(a)*n.getX(b)+n.getY(a)*n.getY(b)+n.getZ(a)*n.getZ(b),-1,1))*180/Math.PI);}}
  metrics.protectedFringeVertices=exact;metrics.changedFringeVertices=changed;metrics.maximumAdjacentLowerNormalAngle=lowerNormalJump;
  p.needsUpdate=n.needsUpdate=true;old.geometry.dispose?.();return owned;
 }
 return{point,sample,normal,root,end,support,active,ownedVertex,decorateFringe,finishCrown,finishFringe,metrics,P};
}
