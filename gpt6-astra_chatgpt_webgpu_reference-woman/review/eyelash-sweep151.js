// Original bounded deformation of the accepted three-sided lash sweeps.
// Pure math: no scene, renderer, texture, or persistent source-buffer access.
export const V151={
 add:(a,b)=>a.map((v,k)=>v+b[k]),sub:(a,b)=>a.map((v,k)=>v-b[k]),
 scale:(a,s)=>a.map(v=>v*s),dot:(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),
 cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
};
const {add,sub,scale,dot,cross}=V151,norm=a=>Math.hypot(...a),unit=a=>{const n=norm(a);if(!(n>1e-12))throw Error('151 zero sweep direction.');return scale(a,1/n);};
const mix=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t),clamp=x=>Math.max(0,Math.min(1,x));
export function smooth151(u){u=clamp(u);return{v:clamp(u*u*u*(10+u*(-15+6*u))),d:30*u*u*(1-u)*(1-u),dd:60*u*(1-u)*(1-2*u)};}

function spline(nodes){
 const count=nodes.length,n=count-1,h=1/n,second=Array.from({length:count},()=>[0,0,0]);
 for(let k=0;k<3;k++){
  const diagonal=new Array(count).fill(4),rhs=new Array(count).fill(0);diagonal[0]=diagonal[n]=1;
  for(let i=1;i<n;i++)rhs[i]=6*(nodes[i+1][k]-2*nodes[i][k]+nodes[i-1][k])/(h*h);
  for(let i=2;i<n;i++){const factor=1/diagonal[i-1];diagonal[i]-=factor;rhs[i]-=factor*rhs[i-1];}
  for(let i=n-1;i>0;i--)second[i][k]=(rhs[i]-second[i+1][k])/diagonal[i];
 }
 const pieces=[];
 for(let i=0;i<n;i++)pieces.push([nodes[i],scale(sub(sub(nodes[i+1],nodes[i]),scale(add(scale(second[i],2),second[i+1]),h*h/6)),1/h),scale(second[i],.5),scale(sub(second[i+1],second[i]),1/(6*h))]);
 const sample=u=>{
  u=clamp(u);const i=Math.min(n-1,Math.floor(u*n)),x=u-i*h,[a,b,c,d]=pieces[i];
  return{p:a.map((v,k)=>v+x*(b[k]+x*(c[k]+x*d[k]))),d:b.map((v,k)=>v+x*(2*c[k]+3*x*d[k])),dd:c.map((v,k)=>2*v+6*x*d[k])};
 };
 return{n,h,pieces,sample};
}
const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v;};
const polyAdd=(a,b)=>Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)+(b[i]||0));
const polyScale=(a,s)=>a.map(v=>v*s);
const polyMul=(a,b)=>{const c=new Array(a.length+b.length-1).fill(0);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)c[i+j]+=a[i]*b[j];return c;};
const polyPow=(a,p)=>{let b=[1];while(p--)b=polyMul(b,a);return b;};
const bernstein=p=>p.map((_,k)=>p.slice(0,k+1).reduce((sum,v,j)=>sum+v*choose(k,j)/choose(p.length-1,j),0));
const vectorBernstein=p=>{const q=[0,1,2].map(k=>bernstein(p.map(v=>v[k])));return q[0].map((_,i)=>q.map(a=>a[i]));};
function split(controls){
 let row=controls.map(p=>Array.isArray(p)?p.slice():p),left=[row[0]],right=[row.at(-1)];
 while(row.length>1){row=row.slice(0,-1).map((v,k)=>Array.isArray(v)?mix(v,row[k+1],.5):(v+row[k+1])*.5);left.push(row[0]);right.push(row.at(-1));}
 return[left,right.reverse()];
}
function lengthInterval(points,tolerance=2e-6,depth=0){
 const lower=norm(sub(points.at(-1),points[0])),upper=points.slice(1).reduce((s,p,i)=>s+norm(sub(p,points[i])),0);
 if(upper-lower<=tolerance||depth===16)return{lower,upper,leaves:1,depth};
 const [a,b]=split(points),x=lengthInterval(a,tolerance*.5,depth+1),y=lengthInterval(b,tolerance*.5,depth+1);
 return{lower:x.lower+y.lower,upper:x.upper+y.upper,leaves:x.leaves+y.leaves,depth:Math.max(x.depth,y.depth)};
}
const tangentData=(d,dd)=>{const length=norm(d);if(!(length>1e-9))throw Error('151 zero centerline derivative.');const t=scale(d,1/length);return{t,d:scale(sub(dd,scale(t,dot(t,dd))),1/length),length};};
function rotation(old,next){
 const v=cross(old.t,next.t),dv=add(cross(old.d,next.t),cross(old.t,next.d)),c=dot(old.t,next.t),dc=dot(old.d,next.t)+dot(old.t,next.d),den=1+c;
 if(!(den>.05))throw Error('151 shortest rotation approached an antiparallel tangent.');
 return{den,cosine:c,
  apply:x=>add(add(x,cross(v,x)),scale(cross(v,cross(v,x)),1/den)),
  derivative:x=>add(add(cross(dv,x),scale(add(cross(dv,cross(v,x)),cross(v,cross(dv,x))),1/den)),scale(cross(v,cross(v,x)),-dc/(den*den))),
 };
}

/** C/A/B are the accepted head-space ring centers and ellipse axes. */
export function createLashSweep151({centers,axesA,axesB,E,T,upper,side,index,amplitude=1}){
 if(centers.length!==axesA.length||centers.length!==axesB.length||![5,7].includes(centers.length))throw Error('151 changed the known ring inventory.');
 if(!(amplitude>=0&&amplitude<=1))throw Error('151 invalid bounded correction amplitude.');
 const C=spline(centers),A=spline(axesA),B=spline(axesB),root=centers[0],L=norm(sub(centers.at(-1),root)),axis=unit(sub(centers.at(-1),root));
 E=unit(E);T=unit(T);if(Math.abs(dot(E,T))>1e-7)throw Error('151 lash frame is not orthogonal.');
 const chosenK=upper?.71+.08*Math.sin(index*2.399+.5*side):.62+.13*Math.sin(index*1.73+.3*side),chosenBeta=(upper?.075:.04)*Math.sin(index*1.73+.7*side),k=1+(chosenK-1)*amplitude,beta=chosenBeta*amplitude;
 function center(u){
  const c=C.sample(u),w=smooth151(u),e=dot(sub(c.p,root),E),ed=dot(c.d,E),edd=dot(c.dd,E),delta=add(scale(E,(k-1)*e),scale(T,beta*L*u*u)),ddelta=add(scale(E,(k-1)*ed),scale(T,2*beta*L*u)),dddelta=add(scale(E,(k-1)*edd),scale(T,2*beta*L));
  return{old:c,p:add(c.p,scale(delta,w.v)),d:add(c.d,add(scale(delta,w.d),scale(ddelta,w.v))),dd:add(c.dd,add(add(scale(delta,w.dd),scale(ddelta,2*w.d)),scale(dddelta,w.v))),delta:scale(delta,w.v)};
 }
 function sample(u,r=1,s=0){
  u=clamp(u);const c=center(u),a=A.sample(u),b=B.sample(u),oldT=tangentData(c.old.d,c.old.dd),newT=tangentData(c.d,c.dd),rot=rotation(oldT,newT),w=smooth151(u),f=clamp(1-w.v),q=.08+.92*Math.pow(f,1.6),qd=f===0?0:-.92*1.6*Math.pow(f,.6)*w.d,
   v=add(scale(a.p,r),scale(b.p,s)),vd=add(scale(a.d,r),scale(b.d,s)),rv=rot.apply(v),oldD=add(c.old.d,vd),newD=add(c.d,add(add(scale(rv,qd),scale(rot.derivative(v),q)),scale(rot.apply(vd),q))),
   aa=scale(rot.apply(a.p),q),bb=scale(rot.apply(b.p),q),oldColumns=[oldD,a.p,b.p],newColumns=[newD,aa,bb],det0=dot(oldD,cross(a.p,b.p)),det1=dot(newD,cross(aa,bb)),ratio=det1/det0;
  if(!Number.isFinite(ratio)||Math.abs(det0)<1e-16||Math.abs(det1)<1e-19||!(ratio>1e-4))throw Error('151 singular or reversed tube-coordinate Jacobian.');
  return{u,q,oldCenter:c.old.p,center:c.p,source:add(c.old.p,v),position:add(c.p,rv.map(x=>x*q)),delta:add(c.delta,sub(scale(rv,q),v)),oldColumns,newColumns,determinant:ratio,sourceDeterminant:det0,rotationCosine:rot.cosine,
   normal:n=>{const rhs=oldColumns.map(column=>dot(column,n));return scale(add(add(scale(cross(aa,bb),rhs[0]),scale(cross(bb,newD),rhs[1])),scale(cross(newD,aa),rhs[2])),1/det1);},
  };
 }
 function bounds(){
  let surfaceUpper=0,centerUpper=0,sourceLower=0,sourceUpper=0,targetLower=0,targetUpper=0,rotationDenominatorLower=2,sourceSpeedLower=Infinity,targetSpeedLower=Infinity,leaves=0,lengthLeaves=0;
  for(let i=0;i<C.n;i++){
   const h=C.h,u0=i*h,U=[u0,h],w=polyAdd(polyAdd(polyScale(polyPow(U,3),10),polyScale(polyPow(U,4),-15)),polyScale(polyPow(U,5),6)),cp=C.pieces[i].map((p,j)=>scale(p,h**j)),ap=A.pieces[i].map((p,j)=>scale(p,h**j)),bp=B.pieces[i].map((p,j)=>scale(p,h**j)),ep=cp.map((p,j)=>dot(j===0?sub(p,root):p,E)),alpha=polyScale(polyMul(w,ep),k-1),gamma=polyScale(polyMul(w,polyPow(U,2)),beta*L),degree=Math.max(cp.length,alpha.length,gamma.length),target=Array.from({length:degree},(_,j)=>add(add(cp[j]||[0,0,0],scale(E,alpha[j]||0)),scale(T,gamma[j]||0))),
    cControl=vectorBernstein(cp),pControl=vectorBernstein(target),l0=lengthInterval(cControl),l1=lengthInterval(pControl);
   sourceLower+=l0.lower;sourceUpper+=l0.upper;targetLower+=l1.lower;targetUpper+=l1.upper;lengthLeaves+=l0.leaves+l1.leaves;
   let branches=[{a:bernstein(alpha),g:bernstein(gamma),A:vectorBernstein(ap),B:vectorBernstein(bp),v0:vectorBernstein(cp.slice(1).map((p,j)=>scale(p,(j+1)/h))),v1:vectorBernstein(target.slice(1).map((p,j)=>scale(p,(j+1)/h))),u0,u1:u0+h}];
   for(let depth=0;depth<3;depth++)branches=branches.flatMap(part=>{const parts=[{u0:part.u0,u1:(part.u0+part.u1)/2},{u0:(part.u0+part.u1)/2,u1:part.u1}];for(const name of['a','g','A','B','v0','v1']){const halves=split(part[name]);for(let j=0;j<2;j++)parts[j][name]=halves[j];}return parts;});
   for(const part of branches){
    leaves++;const dc=Math.hypot(Math.max(...part.a.map(Math.abs)),Math.max(...part.g.map(Math.abs))),radial=Math.hypot(Math.max(...part.A.map(norm)),Math.max(...part.B.map(norm))),qmax=.08+.92*Math.pow(clamp(1-smooth151(part.u0).v),1.6);
    centerUpper=Math.max(centerUpper,dc);surfaceUpper=Math.max(surfaceUpper,dc+(1+qmax)*radial);
    const low0=Math.min(...part.v0.map(v=>dot(v,axis))),low1=Math.min(...part.v1.map(v=>dot(v,axis))),high0=Math.max(...part.v0.map(norm)),high1=Math.max(...part.v1.map(norm));
    if(!(low0>1e-8&&low1>1e-8))throw Error('151 centerline derivative left its certified forward cone.');
    const m0=clamp(low0/high0),m1=clamp(low1/high1),cmin=m0*m1-Math.sqrt(Math.max(0,1-m0*m0))*Math.sqrt(Math.max(0,1-m1*m1));
    rotationDenominatorLower=Math.min(rotationDenominatorLower,1+cmin);sourceSpeedLower=Math.min(sourceSpeedLower,low0);targetSpeedLower=Math.min(targetSpeedLower,low1);
   }
  }
  if(!(rotationDenominatorLower>.05))throw Error('151 cannot bound its shortest rotation continuously.');
  return{surfaceDisplacementUpper:surfaceUpper+2e-12,centerDisplacementUpper:centerUpper+2e-12,sourceLength:{lower:sourceLower,upper:sourceUpper},targetLength:{lower:targetLower,upper:targetUpper},lengthRatioUpper:targetUpper/sourceLower,rotationDenominatorLower,sourceSpeedLower,targetSpeedLower,bernsteinLeaves:leaves,lengthBezierLeaves:lengthLeaves,
   interpretation:'Polynomial Bernstein hulls bound center displacement and ring radii continuously. Orthogonal rotation gives ||qR-I|| <= 1+q. Subdivided Bezier chords/control polygons enclose both centerline lengths. These are bounds on the declared interpolated sweep, not a replacement for finite-triangle/contact checks.'};
 }
 return{sample,center,bounds,parameters:{upper,side,index,chosenK,chosenBeta,k,beta,amplitude,rootSpan:L,root,tipRadiusRatio:.08,segments:C.n}};
}

export function boundedLashSweep151(options){
 let amplitude=1;
 for(let trial=0;trial<8;trial++){
  const sweep=createLashSweep151({...options,amplitude}),bounds=sweep.bounds();
  if(bounds.surfaceDisplacementUpper<=.016&&bounds.lengthRatioUpper<=1.02)return{sweep,bounds};
  amplitude*=.75;
 }
 throw Error('151 cannot meet the approved continuous displacement/length bounds.');
}
