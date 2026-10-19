import { sampleBlouseFrontAtXY } from '../src/blouse.js';

// Review-only118. Fit original guide paths before the lock sections and their
// dependent fine curves are constructed. No final mesh vertex warp is added.
const PIN_Y=-1.74,HEAD_Y=2.95,FULL_Y=.55;
const NX=12,NY=22,X0=-.24,Y0=-1.76,STEP_X=.24,STEP_Y=.16;
const CAPS=[.22,.32],CONTROL_COUNT=NX*NY;
// Root-approved narrow dependency extension. These four forward side locks
// have verified clearance; embedded side guides remain fixed obstacles.
const CLEAR_SIDE_GUIDES=[154,155,166,167];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const s5=t=>t*t*t*(t*(t*6-15)+10);
const fade=y=>y>=PIN_Y+HEAD_Y?0:y<=FULL_Y?1:s5((PIN_Y+HEAD_Y-y)/(PIN_Y+HEAD_Y-FULL_Y));
const OFF=Object.freeze({version:'coherent-lower-guides-118',strength:0,applied:false});

function sample(field,side,x,y){
 const gate=fade(y);if(gate===0)return 0;
 const u=clamp((Math.abs(x)-X0)/STEP_X,1,NX-2.000000001),v=clamp((y-Y0)/STEP_Y,1,NY-2.000000001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;
 const x0=(1-a)**3/6,x1=(3*a*a*a-6*a*a+4)/6,x2=(-3*a*a*a+3*a*a+3*a+1)/6,x3=a*a*a/6;
 const y0=(1-b)**3/6,y1=(3*b*b*b-6*b*b+4)/6,y2=(-3*b*b*b+3*b*b+3*b+1)/6,y3=b*b*b/6,c=field.coefficients[side];
 let k=(j-1)*NX+i-1;
 let pull=y0*(c[k]*x0+c[k+1]*x1+c[k+2]*x2+c[k+3]*x3);k+=NX;
 pull+=y1*(c[k]*x0+c[k+1]*x1+c[k+2]*x2+c[k+3]*x3);k+=NX;
 pull+=y2*(c[k]*x0+c[k+1]*x1+c[k+2]*x2+c[k+3]*x3);k+=NX;
 pull+=y3*(c[k]*x0+c[k+1]*x1+c[k+2]*x2+c[k+3]*x3);
 return pull*gate;
}

function fieldBasis(x,y,indices,values,dx,dy){
 const rawU=(Math.abs(x)-X0)/STEP_X,rawV=(y-Y0)/STEP_Y,u=clamp(rawU,1,NX-2.000000001),v=clamp(rawV,1,NY-2.000000001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;
 const wx=[(1-a)**3/6,(3*a*a*a-6*a*a+4)/6,(-3*a*a*a+3*a*a+3*a+1)/6,a*a*a/6],wy=[(1-b)**3/6,(3*b*b*b-6*b*b+4)/6,(-3*b*b*b+3*b*b+3*b+1)/6,b*b*b/6];
 const sx=rawU===u?Math.sign(x)/STEP_X:0,sy=rawV===v?1/STEP_Y:0;
 const xx=[-.5*(1-a)**2,1.5*a*a-2*a,-1.5*a*a+a+.5,.5*a*a],yy=[-.5*(1-b)**2,1.5*b*b-2*b,-1.5*b*b+b+.5,.5*b*b];
 const gate=fade(y),q=clamp((PIN_Y+HEAD_Y-y)/(PIN_Y+HEAD_Y-FULL_Y)),gateY=q>0&&q<1?-30*q*q*(q-1)*(q-1)/(PIN_Y+HEAD_Y-FULL_Y):0;
 let k=0;for(let row=0;row<4;row++)for(let col=0;col<4;col++,k++){
  indices[k]=(j+row-1)*NX+i+col-1;values[k]=gate*wx[col]*wy[row];dx[k]=gate*sx*xx[col]*wy[row];dy[k]=gate*sy*wx[col]*yy[row]+gateY*wx[col]*wy[row];
 }
}

function wrapGuide(original,field,side,strength){
 const ids=new Uint16Array(16),values=new Float64Array(16),dx=new Float64Array(16),dy=new Float64Array(16);
 return{
  debug:original.debug,
  getPoint(t){const p=original.getPoint(t);if(p.y>=PIN_Y)return p;p.z-=strength*sample(field,side,p.x,p.y+HEAD_Y);return p;},
  getTangent(t){
   const p=original.getPoint(t);if(p.y>=PIN_Y)return original.getTangent(t);
   return this.getPoint(Math.min(1,t+.0001)).sub(this.getPoint(Math.max(0,t-.0001))).normalize();
  },
  getFrame118(t,front,baseFrame){
   const f=baseFrame(original,t,front);if(f.p.y>=PIN_Y)return f;
   fieldBasis(f.p.x,f.p.y+HEAD_Y,ids,values,dx,dy);const c=field.coefficients[side];let pull=0,gx=0,gy=0;
   for(let k=0;k<16;k++){pull+=c[ids[k]]*values[k];gx+=c[ids[k]]*dx[k];gy+=c[ids[k]]*dy[k];}
   f.p.z-=strength*pull;
   // Transport the section axes with J, rather than rotating each wide lock
   // independently. The common map has det(J)=1 and leaves its X/Y footprint
   // and depth offsets unchanged. Normals are rebuilt from the swept surface.
   for(const a of[f.s,f.n,f.d])a.z-=strength*(gx*a.x+gy*a.y);
   f.d.normalize();return f;
  }
 };
}

// A fine curve interpolates between discrete surface samples. Retain its
// original upper samples while it eases onto the rebuilt lower lock frame.
// The .04 guard exceeds the ribbon radius, so source vertices above-1.64 stay
// exactly fixed even when Catmull-Rom support reaches a changed lower knot.
export function protectUpperFiber118(next,original){
 return{
  getPoint(t){
   const a=original.getPoint(t);if(a.y>=-1.68)return a;
   const b=next.getPoint(t);if(a.y<=-1.96)return b;
   return a.lerp(b,s5(clamp((-1.68-a.y)/.28)));
  },
  getTangent(t){
   const p=original.getPoint(t);if(p.y>=-1.68)return original.getTangent(t);
   return this.getPoint(Math.min(1,t+.0001)).sub(this.getPoint(Math.max(0,t-.0001))).normalize();
  }
 };
}

function supportSampler(sampleSurface){
 const STEP=.035,cache=new Map();let queries=0,hits=0;
 const at=(i,j)=>{
  const key=`${i},${j}`;if(cache.has(key))return cache.get(key);
  queries++;const p=sampleSurface(i*STEP,j*STEP),q=p?{z:p.point.z,nz:p.normal.z,weight:p.edgeWeight}:null;cache.set(key,q);return q;
 };
 return{
  get(x,y){
   const u=x/STEP,v=y/STEP,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,q=[at(i,j),at(i+1,j),at(i,j+1),at(i+1,j+1)];
   if(q.some(p=>!p)){
    queries++;const p=sampleSurface(x,y);if(!p)return null;hits++;return{z:p.point.z,nz:p.normal.z,weight:p.edgeWeight};
   }
   hits++;const w=[(1-a)*(1-b),a*(1-b),(1-a)*b,a*b];
   return{z:q.reduce((s,p,k)=>s+p.z*w[k],0),nz:Math.min(...q.map(p=>p.nz)),weight:Math.min(...q.map(p=>p.weight))};
  },
  metrics:()=>({queries,cacheEntries:cache.size,supportHits:hits,cacheStep:STEP})
 };
}

function fixedSideSupport(guides,section,contact,headShiftX){
 // Exact source triangles are temporary fit obstacles. A broad shared field
 // is fitted beneath their bounds; the lock paths do not follow hit changes.
 const STEP=.06,cells=new Map(),triangles=[],fixed=new Set();let lookups=0,hits=0,entries=0,inherited=0;
 const push=(p,a,b,c,id)=>{
  if(Math.max(p[a+1],p[b+1],p[c+1])>1.31)return;
  const ax=p[a],ay=p[a+1],bx=p[b],by=p[b+1],cx=p[c],cy=p[c+1],den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<1e-12)return;
  const t=new Float64Array([ax,ay,bx,by,cx,cy,p[a+2],p[b+2],p[c+2],1/den,id]);
  triangles.push(t);for(let j=Math.floor(Math.min(ay,by,cy)/STEP);j<=Math.floor(Math.max(ay,by,cy)/STEP);j++)for(let i=Math.floor(Math.min(ax,bx,cx)/STEP);i<=Math.floor(Math.max(ax,bx,cx)/STEP);i++){
   const key=`${i},${j}`;let row=cells.get(key);if(!row){row=[];cells.set(key,row);}row.push(t);entries++;
  }
 };
 for(let id=0;id<guides.length;id++){
  const g=guides[id],obstacle=g.kind==='side'&&!CLEAR_SIDE_GUIDES.includes(id)&&g.c.getPoint(.8).z>=.15,selected=['front','inner','curl'].includes(g.kind)||CLEAR_SIDE_GUIDES.includes(id);if(!obstacle&&!selected)continue;if(obstacle)fixed.add(id);const p=new Float64Array(61*9*3);
  for(let j=0;j<=60;j++){
   const {f,shape,depth,inset,undulate}=section(g,j/60);
   for(let k=0;k<=8;k++){
    const a=k*Math.PI/4,q=f.p.clone().addScaledVector(f.s,g.w*shape*Math.cos(a)*undulate).addScaledVector(f.n,inset+depth*shape*Math.sin(a)),x=q.x+headShiftX,y=q.y+HEAD_Y;
    p.set([x,y,q.z+contact.atModel(x,y,q.z)],(j*9+k)*3);
   }
  }
  for(let j=0;j<60;j++)for(let k=0;k<8;k++){const a=(j*9+k)*3,c=a+27;push(p,a,c,a+3,id);push(p,a+3,c,c+3,id);}
 }
 return{
  get(x,y,before,selectedId){
   lookups++;const row=cells.get(`${Math.floor(x/STEP)},${Math.floor(y/STEP)}`);if(!row)return null;const depths=new Map();
   let ownMin=Infinity;
   for(const t of row){const id=t[10];if(id!==selectedId&&!fixed.has(id))continue;const u=((t[3]-t[5])*(x-t[4])+(t[4]-t[2])*(y-t[5]))*t[9],v=((t[5]-t[1])*(x-t[4])+(t[0]-t[4])*(y-t[5]))*t[9],w=1-u-v;if(Math.min(u,v,w)<-1e-8)continue;const z=u*t[6]+v*t[7]+w*t[8];if(id===selectedId)ownMin=Math.min(ownMin,z);else depths.set(id,Math.max(depths.get(id)??-Infinity,z));}
   if(!Number.isFinite(ownMin))ownMin=before;
   // Bound only source intervals that were actually separate. Pinning a
   // front-facing point inside an already interleaved pair falsely freezes
   // an entire broad field, especially at the nearly stationary upper gate.
   let z=-Infinity,guide=-1;for(const[id,depth]of depths)if(depth<ownMin-.005&&depth>z){z=depth;guide=id;}else if(depth>=ownMin-.005)inherited++;
   if(guide<0)return null;hits++;return{z:before-(ownMin-z),guide};
  },
  metrics:()=>({triangles:triangles.length,cells:cells.size,cellEntries:entries,typedTriangleBytes:triangles.length*11*8,lookups,hits,inheritedOrCloserThan005Ignored:inherited})
 };
}

function project(coefficients,constraints){
 let adjusted=0,worst=0;
 for(const c of constraints){
  const a=coefficients[c.side];let value=0;for(let k=0;k<16;k++)value+=a[c.ids[k]]*c.weights[k];
  if(value<=c.limit+1e-12)continue;
  adjusted++;worst=Math.max(worst,value-c.limit);
  // Only lower nonnegative controls. Previously satisfied support inequalities
  // cannot become violated. Clipped controls are handled in the next pass.
  for(let pass=0;pass<17;pass++){
   let sum=0,den=0;for(let k=0;k<16;k++){const q=a[c.ids[k]],w=c.weights[k];sum+=q*w;if(q>0)den+=w*w;}
   if(sum<=c.limit+1e-12||den===0)break;
   const d=(sum-c.limit)/den;
   for(let k=0;k<16;k++){const id=c.ids[k];a[id]=Math.max(0,a[id]-d*c.weights[k]);}
  }
 }
 return{adjusted,worst};
}

export function fitLowerGuides118(guides,section,{strength=0,contact,headShiftX=.26,sampleSurface=sampleBlouseFrontAtXY}={}){
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new Error('118 guide strength must be within0..1.');
 if(strength===0)return OFF;
 if(!contact||Math.abs(contact.metrics.strength-.35)>1e-9)throw new Error('118 is calibrated to accepted86 shoulderContact .35.');
 if(guides.some(g=>g.original118))throw new Error('118 requires freshly authored guides.');
 const started=performance.now(),selected=guides.map((g,id)=>({g,id})).filter(({g,id})=>['front','inner','curl'].includes(g.kind)||CLEAR_SIDE_GUIDES.includes(id));
 if(selected.length!==150||CLEAR_SIDE_GUIDES.some(id=>guides[id]?.kind!=='side'))throw new Error(`118 expected146 front/curl/inner and4 clear side guides, received${selected.length}.`);
 const field={coefficients:CAPS.map(v=>new Float64Array(CONTROL_COUNT).fill(v))},constraints=[],sampler=supportSampler(sampleSurface),sideSupport=fixedSideSupport(guides,section,contact,headShiftX);
 const bc=Math.cos(.045),bs=Math.sin(.045),kinds={},range={min:Infinity,max:-Infinity};let testedRings=0,unsupportedRings=0,tightRings=0;
 for(const {g,id}of selected){
  kinds[g.kind]=(kinds[g.kind]??0)+1;const side=g.c.getPoint(.75).x<0?0:1;
  for(let j=0;j<=60;j++){
   const t=j/60,{f,shape,depth,inset,undulate}=section(g,t),gate=fade(f.p.y+HEAD_Y);if(gate===0)continue;
   let allowed=Infinity,hits=0,closest=Infinity;
   const ids0=new Uint16Array(16),basis=new Float64Array(16),dx=new Float64Array(16),dy=new Float64Array(16);fieldBasis(f.p.x,f.p.y+HEAD_Y,ids0,basis,dx,dy);
   // Five points span the rear half of the eight-sided source lock. The small
   // extra clearance covers support-grid interpolation and changed frames.
   for(const k of[0,4,5,6,7]){
    const a=k*Math.PI/4,p=f.p.clone().addScaledVector(f.s,g.w*shape*Math.cos(a)*undulate).addScaledVector(f.n,inset+depth*shape*Math.sin(a));
    if(p.y> -1.64)throw new Error('118 upper section guard is too narrow.');
    const x=p.x+headShiftX,y=p.y+HEAD_Y,bx=bc*x+bs*(y-1),by=-bs*x+bc*(y-1)+1,hit=sampler.get(bx,by);if(!hit||hit.weight<.01)continue;
    const before=p.z+contact.atModel(x,y,p.z),gap=(before-hit.z)*hit.nz;closest=Math.min(closest,gap);
    // An already tight source point contributes a zero-pull bound; this study
    // never attempts to repair or deepen an inherited intersection.
    const obstacle=sideSupport.get(x,y,before,id),target=Math.min(before,Math.max(hit.z+.052/Math.max(.35,hit.nz),obstacle?obstacle.z+.002:-Infinity));let pre=target;
    for(let n=0;n<7;n++)pre=target-contact.atModel(x,y,pre);
    const permitted=Math.max(0,p.z-pre);allowed=Math.min(allowed,permitted);hits++;
    // A transported section uses the first-order expansion at its guide.
    // Discarding negative basis terms gives a conservative upper bound for
    // nonnegative controls, so decreasing a control preserves every bound.
    const weights=new Float64Array(16);for(let n=0;n<16;n++)weights[n]=Math.max(0,basis[n]+dx[n]*(p.x-f.p.x)+dy[n]*(p.y-f.p.y));
    constraints.push({side,ids:ids0,weights,limit:permitted,guide:id,t,x:f.p.x,y:f.p.y+HEAD_Y,baselineGap:gap,sideObstacle:obstacle?.guide??null});
   }
   if(!hits){unsupportedRings++;continue;}
   testedRings++;if(allowed<.0001)tightRings++;
   range.min=Math.min(range.min,closest);range.max=Math.max(range.max,closest);
  }
 }
 const projections=[project(field.coefficients,constraints)];
 // Two broad smoothing passes remove isolated control dents. Projection after
 // each pass reinstates every support bound; no nearest-hit switching occurs.
 for(let pass=0;pass<2;pass++){
  for(const c of field.coefficients){const old=c.slice();for(let j=1;j<NY-1;j++)for(let i=1;i<NX-1;i++){const k=j*NX+i;c[k]=.50*old[k]+.125*(old[k-1]+old[k+1]+old[k-NX]+old[k+NX]);}}
  projections.push(project(field.coefficients,constraints));
 }
 let boundViolation=0;const movement=[[],[]];
 for(const c of constraints){let value=0;for(let k=0;k<16;k++)value+=field.coefficients[c.side][c.ids[k]]*c.weights[k];boundViolation=Math.max(boundViolation,value-c.limit);movement[c.side].push(strength*sample(field,c.side,c.x,c.y));}
 if(boundViolation>1e-9||field.coefficients.some(a=>Array.from(a).some(v=>!Number.isFinite(v)||v<0)))throw new Error('118 field preflight failed.');
 const quantiles=a=>{a.sort((x,y)=>x-y);return{samples:a.length,min:a[0],median:a[Math.floor(a.length*.5)],p90:a[Math.floor(a.length*.9)],max:a.at(-1)};};
 const metrics={version:'coherent-lower-guides-118',strength,applied:true,selectedGuides:150,originalSelectedGuides:146,clearSideGuides:CLEAR_SIDE_GUIDES,kinds,protectedSideGuides:20,protectedRearGuides:106,protectedFarTempleGuides:14,guidePinY:PIN_Y,protectedSourceY:-1.64,fullWeightModelY:FULL_Y,caps:CAPS,field:{nx:NX,ny:NY,stepX:STEP_X,stepY:STEP_Y},fieldBytes:CONTROL_COUNT*2*8,depthDerivative:1,testedRings,unsupportedRings,tightRings,baselineGapRange:range,normalClearanceTarget:.052,maximumBoundViolation:boundViolation,projection:projections,movement:movement.map(quantiles),movementBands:[0,1].flatMap(side=>[.9,.6,.3,0,-.3,-.6,-.9].map(y=>{const rows=constraints.filter(c=>c.side===side&&Math.abs(c.y-y)<.15);return{side,y,...quantiles(rows.map(c=>strength*sample(field,side,c.x,c.y)))};})),tightExamples:constraints.filter(c=>c.limit<.0001).sort((a,b)=>a.baselineGap-b.baselineGap).slice(0,8).map(c=>({guide:c.guide,t:c.t,x:c.x,y:c.y,gap:c.baselineGap})),support:sampler.metrics(),sideSupport:sideSupport.metrics(),fitMs:performance.now()-started};
 // Commit only after all source constraints are finite and satisfied. The
 // wrapper retains just the original guide and the compact control field.
 for(const {g}of selected){const original={...g};g.original118=original;g.c=wrapGuide(original.c,field,original.c.getPoint(.75).x<0?0:1,strength);}
 return metrics;
}
