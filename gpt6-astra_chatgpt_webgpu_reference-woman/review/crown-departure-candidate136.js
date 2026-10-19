// Original geometry study136. Existing crown fibers leave the opaque bed and
// continue into the accepted bowed flow. No added fibers, carrier surfaces,
// materials, source-image sampling, or random draws.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const noise=x=>{const y=Math.sin(x*12.9898+Math.sin(x*.731)*9.123)*43758.5453;return y-Math.floor(y);};

export function applyCrownDeparture136({THREE,crown,crownBatch,detail,fringe,rows,bows,frame,forehead,strength=1,coverageOnly=false}){
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new RangeError('Crown departure136 strength must be0..1');
 if(strength===0)return{version:'crown-departure136',strength,changed:false};
 const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 const curve=ps=>new THREE.CatmullRomCurve3(ps,false,'catmullrom',.38);
 const chosen=[];
 const report={version:'crown-departure136',strength,changed:true,additionalStrands:0,additionalTriangles:0,changedFibers:0,rerootedFibers:0,changedPositions:0,changedAlpha:0,maximumDisplacement:0,maximumRootCorrection:0,bridgeSamples:[],ribbonRanges:[],upwardExposedSteps:0,maxExposedRise:0,minimumForeheadClearance:Infinity,maximumForeheadClearance:0};
 const median=Array.from({length:7},(_,group)=>bows.filter(b=>b.group===group).sort((a,b)=>Math.abs(a.lane)-Math.abs(b.lane))[0]);
 if(median.some(b=>!b))throw new Error('136 requires all seven accepted fringe families');
 const returnSamples=Array.from({length:65},(_,i)=>crown(-1,1,i/64,.006).lerp(crown(1,1,i/64,.006),.5));
 function returnAtY(y){
  let a=0,b=returnSamples.length-1;while(b-a>1){const m=(a+b)>>1;if(returnSamples[m].y<y)a=m;else b=m;}
  const p=returnSamples[a],q=returnSamples[b],before=returnSamples[Math.max(0,a-1)],after=returnSamples[Math.min(returnSamples.length-1,b+1)],h=q.y-p.y,s=(y-p.y)/h;
  const m0=V((q.x-before.x)/(q.y-before.y),1,(q.z-before.z)/(q.y-before.y)),m1=V((after.x-p.x)/(after.y-p.y),1,(after.z-p.z)/(after.y-p.y));
  if(s<0)return p.clone().addScaledVector(m0,y-p.y);
  if(s>1)return q.clone().addScaledVector(m1,y-q.y);
  const s2=s*s,s3=s2*s;return p.clone().multiplyScalar(2*s3-3*s2+1).addScaledVector(q,-2*s3+3*s2).addScaledVector(m0,h*(s3-2*s2+s)).addScaledVector(m1,h*(s3-s2));
 }

 // Use the already accepted visible portions of the actual strand curves.
 // Selecting the final descending crossing avoids their covered root turns.
 function atY(c,y){
  let left=0,right=1,found=false,prev=c.getPoint(0);
  for(let i=1;i<=80;i++){const t=i/80,p=c.getPoint(t);if(prev.y>=y&&p.y<=y){left=(i-1)/80;right=t;found=true;}prev=p;}
  if(!found){const a=c.getPoint(0),b=c.getPoint(1);return Math.abs(a.y-y)<Math.abs(b.y-y)?a:b;}
  for(let i=0;i<25;i++){const m=(left+right)*.5;if(c.getPoint(m).y>y)left=m;else right=m;}
  return c.getPoint((left+right)*.5);
 }
 // A compact sampled lookup avoids repeatedly searching1305 original curves.
 const yMin=.42,yMax=1.42,ny=241,lookup=median.map(b=>Array.from({length:ny},(_,i)=>atY(b.c,mix(yMin,yMax,i/(ny-1)))));
 function sampleBow(group,y){const t=clamp((y-yMin)/(yMax-yMin))*(ny-1),i=Math.min(ny-2,Math.floor(t));return lookup[group][i].clone().lerp(lookup[group][i+1],t-i);}
 const bowCeiling=1.05,bowAnchors=lookup.map((_,i)=>sampleBow(i,bowCeiling)),bowSlopes=lookup.map((_,i)=>sampleBow(i,bowCeiling+.002).sub(sampleBow(i,bowCeiling-.002)).multiplyScalar(250));
 // Above the accepted visible bow, extend its descending tangent. Searching
 // the old covered root there can jump between its multiple Y crossings.
 function bow(group,y){return y>bowCeiling?bowAnchors[group].clone().addScaledVector(bowSlopes[group],y-bowCeiling):sampleBow(group,y);}
 function between(a,b,t,y){return bow(a,y).lerp(bow(b,y),clamp(t));}
 function destination(row,y){
  const u=row.u;let p;
  if(row.side<0){
   if(u<.90)p=between(0,1,(u-.810)/.090,y);
   else if(u<.936)p=between(1,2,(u-.90)/.036,y);
   else p=bow(2,y).lerp(bow(2,y).lerp(bow(3,y),.5),(u-.936)/.064);
  }else{
   if(u<.820)p=between(5,4,(u-.770)/.050,y);
   else if(u<.865)p=between(4,3,(u-.820)/.045,y);
   else p=bow(3,y).lerp(bow(2,y).lerp(bow(3,y),.5),(u-.865)/.135);
  }
  // Fine, independently varied companions remain between the principal lanes.
  const spread=(noise(row.k*1.371+row.side*9.7)-.5)*.028;
  p.x+=spread*(.5+.5*smooth(.5,1.2,y));p.z+=.0025*Math.sin(row.phase+y*7.1);
  if(row.returnFactor){
   const samples=returnSamples,q=returnAtY(y);
   q.x+=row.side*(1-row.u)*.78;
   const bridge=row.returnFactor*smooth(samples[0].y-.15,samples[0].y+.025,y)*(1-smooth(samples.at(-1).y+.025,samples.at(-1).y+.13,y));
   p.lerp(q,bridge);
  }
  p.y=y;return p;
 }
 const rawD=(c,t)=>{const h=.00004,a=Math.max(0,t-h),b=Math.min(1,t+h);return c.getPoint(b).sub(c.getPoint(a)).multiplyScalar(1/(b-a));};
 function progressRate(slope){let a=-24,b=24;for(let i=0;i<48;i++){const r=(a+b)*.5,f=Math.abs(r)<1e-8?1:r/Math.expm1(r);if(f>slope)a=r;else b=r;}return(a+b)*.5;}

 for(const row of rows){
  const edge=row.side<0?.790:.928,full=row.side<0?.825:.947,weight=strength*smooth(edge,full,row.u);
  if(weight===0)continue;
  // Saturating compression is C2 at .90 and remains monotone in u. The
  // upward-return roots become earlier descending roots instead of visible U's.
  const returnFactor=smooth(.943,.971,row.u),mappedU0=row.u>.90?.90+.035*Math.tanh((row.u-.90)/.035):row.u;
  const mappedU=mix(mappedU0,.89+.020*Math.tanh((row.u-.89)/.020),returnFactor),route={...row,returnFactor};
  let rootCurve=row.c;
  if(row.u>.90){
   const ps=row.points.map((p,i)=>p.clone().addScaledVector(crown(row.side,mappedU,i/20*row.end,.006).sub(crown(row.side,row.u,i/20*row.end,.006)),1));
   rootCurve=curve(ps);report.rerootedFibers++;
  }
  const startV=mix(.595+.055*noise(row.k*.797+row.side*13.2),.25,returnFactor),t0=startV/row.end,p0=rootCurve.getPoint(t0),d0=rawD(rootCurve,t0);
  if(d0.y>=-.004)throw new Error('136 departure must begin after its covered apex');
  const oldEnd=row.c.getPoint(1),central=.72+.18*noise(row.k*.491+row.phase),endY=Math.max(.52,Math.min(p0.y-.17,mix(oldEnd.y-.19+.065*noise(row.k*.37),central,smooth(.90,.965,row.u))));
  const drop=p0.y-endY,rate=progressRate(-d0.y*(1-t0)/drop),den=Math.expm1(rate),q0=destination(route,p0.y),delta=p0.clone().sub(q0),h=.0005;
  const dq=destination(route,p0.y-h).sub(destination(route,p0.y+h)).multiplyScalar(1/(2*h));
  const slope=V(-d0.x/d0.y-dq.x,0,-d0.z/d0.y-dq.z),release=Math.min(mix(.32,.12,returnFactor),drop*.86);
  report.maximumRootCorrection=Math.max(report.maximumRootCorrection,Math.hypot(delta.x,delta.z));
  const next={getPoint(t){
   if(t<=t0)return rootCurve.getPoint(t);
   const s=(t-t0)/(1-t0),f=Math.abs(rate)<1e-8?s:Math.expm1(rate*s)/den,y=p0.y-drop*f,q=destination(route,y),r=clamp((p0.y-y)/release),r2=r*r,r3=r2*r;
   const a=1-3*r2+2*r3,b=release*(r-2*r2+r3);
   q.x+=delta.x*a+slope.x*b;q.z+=delta.z*a+slope.z*b;
   const floor=forehead(q.x,q.y)+.026,zGap=floor-q.z;
   // Smooth support correction is zero at the old covered join and stays small
   // because the destinations are existing forehead bows.
   q.z+=.5*(zGap+Math.hypot(zGap,.003))*smooth(0,.12,p0.y-y);
   return q;
  },getTangent(t){return rawD(this,t).normalize();}};
  const frontRoot=crown(row.side,mappedU,.012,.001),frontQ=destination(route,frontRoot.y),frontDelta=frontRoot.clone().sub(frontQ),frontD=rawD(rootCurve,.06),frontDQ=destination(route,frontRoot.y-h).sub(destination(route,frontRoot.y+h)).multiplyScalar(1/(2*h)),frontRelease=.16;
  const frontSlope=V(clamp(-frontD.x/Math.min(-.004,frontD.y),-1.4,1.4)-frontDQ.x,0,clamp(-frontD.z/Math.min(-.004,frontD.y),-.8,1.2)-frontDQ.z);
  const front={getPoint(t){
   const y=mix(frontRoot.y,endY,t),q=destination(route,y),r=clamp((frontRoot.y-y)/frontRelease),r2=r*r,r3=r2*r,a=1-3*r2+2*r3,b=frontRelease*(r-2*r2+r3);
   q.x+=frontDelta.x*a+frontSlope.x*b;q.z+=frontDelta.z*a+frontSlope.z*b;
   const gap=forehead(q.x,q.y)+.026-q.z;q.z+=.5*(gap+Math.hypot(gap,.003))*smooth(0,.09,frontRoot.y-y);return q;
  }};
  const final={getPoint(t){
   const p=next.getPoint(t);if(returnFactor)p.lerp(front.getPoint(t),returnFactor);p.lerp(row.c.getPoint(t),1-weight);
   // A bounded depth compression keeps released fine hair close to the
   // forehead. At a fixed patch weight it is monotone in Z and preserves XY.
   // Covered upper roots and accepted FRINGE geometry are left intact.
   const floor=forehead(p.x,p.y)+.035,excess=p.z-floor,w=weight*(1-smooth(1.09,1.24,p.y));
   if(excess>0)p.z-=w*(excess-excess/Math.sqrt(1+(excess/.050)**2));
   return p;
  },getTangent(t){return rawD(this,t).normalize();}};
  const tip=mix(.96,.78+.12*noise(row.k*.573+row.side*2.3),weight),first=row.first;
  let prev=null;
  for(let j=0;j<=26;j++){
   const t=j/26,f=frame(final,t,false),w=row.width*(.20+.80*smooth(0,.027,t))*(.02+.98*(1-smooth(tip,1,t)));
   for(let k=0;k<2;k++){
    const p=f.p.clone().addScaledVector(f.s,k?w:-w),at=(first+j*2+k)*3,old=V(detail.p[at],detail.p[at+1],detail.p[at+2]);
    if(t<=t0&&row.u<=.90&&f.p.y>=1.24)continue;
    const distance=Math.hypot(p.x-old.x,p.y-old.y,p.z-old.z);report.maximumDisplacement=Math.max(report.maximumDisplacement,distance);
    if(distance>1e-12){detail.p[at]=p.x;detail.p[at+1]=p.y;detail.p[at+2]=p.z;report.changedPositions++;}
   }
   if(t>t0){
    const gap=f.p.z-forehead(f.p.x,f.p.y);report.minimumForeheadClearance=Math.min(report.minimumForeheadClearance,gap);report.maximumForeheadClearance=Math.max(report.maximumForeheadClearance,gap);
    if(prev&&f.p.y>prev.y+.00001){report.upwardExposedSteps++;report.maxExposedRise=Math.max(report.maxExposedRise,f.p.y-prev.y);}
    prev=f.p;
   }
  }
  report.changedFibers++;report.ribbonRanges.push([first,first+54]);chosen.push({...row,c:final,startT:t0,endY,weight,tip,next136:next,front136:front,returnFactor});
 }

 // The source-only prerequisite was measured before any alpha edit. Keep the
 // weak right bridge covered; withdraw the main left transition and the small
 // front return. The latter is a head-local volume, so it also removes the
 // second sheet behind the return even where that sheet has a different UV.
 function withdrawal(side,u,v,p){
  const left=side<0?smooth(.801,.829,u)*(1-smooth(.915,.946,u)):0;
  const start=.565+.080*smooth(.895,.942,u)+.014*Math.sin(u*79+.7),end=.854+.024*Math.sin(u*47+.4)+.022*smooth(.91,.945,u);
  const flow=left*smooth(start,end,v),center=returnAtY(p.y).x;
  const tip=(1-smooth(.027,.064,Math.abs(p.x-center)))*smooth(1.00,1.032,p.y)*(1-smooth(1.132,1.209,p.y))*smooth(.515,.575,p.z);
  return strength*(1-(1-flow)*(1-tip));
 }
 report.maximumWithdrawal=0;
 if(!coverageOnly)for(const side of[-1,1]){
  const first=side<0?7685:16070;
  for(let j=0;j<=64;j++)for(let i=0;i<=128;i++){
   const vertex=first+j*129+i,p=V(crownBatch.p[vertex*3],crownBatch.p[vertex*3+1],crownBatch.p[vertex*3+2]),amount=withdrawal(side,i/128,j/64,p),at=vertex*4+3;
   if(amount<=1e-12)continue;
   const old=crownBatch.c[at],next=old*(1-amount);if(Math.abs(old-next)>1e-12){crownBatch.c[at]=next;report.changedAlpha++;report.maximumWithdrawal=Math.max(report.maximumWithdrawal,amount);}
  }
 }
 report.coveragePending=false;
 report.withdrawalScope='Main image-left front sweep plus the small overlapping front-return volume; the weak right transition remains covered.';
 report.protected='FRINGE133 and all of MASS/WISPS are exact. CROWN keeps position, normal, UV, RGB and index. No front-crown fiber at left u<=.790 or right u<=.928 changes.';
 report.materialRisk='Existing physical DETAIL material is retained on the extensions and may make forehead fibers glint more than the matte accepted FRINGE.';
 report.coverageOnly=coverageOnly;
 report.mask136=withdrawal;
 report.chosen=chosen;
 return report;
}
