import { ROUTE144_COEFFICIENTS } from './near-ear144-coefficients.js';

// Isolated144. The original rooted curl138 and its existing dependent fine
// geometry take one compact upper-ear passage. No textures or new strands.
export const ROUTE144_SPEC=Object.freeze({
 version:'existing-rooted-near-ear-route-144',guide:138,side:-1,u:.680,
 top:.65,bottom:-.58,protectedLower:-1.05,
 fineTop:.76,fineTopFull:.60,fineBottomFull:-.48,fineBottom:-.70,
 regularRibbons:54,flyawaySlot:40,
 massRange:[75762,76311],regularRange:[317086,320218],flyawayRange:[610094,610144]
});
const OFF=Object.freeze({version:ROUTE144_SPEC.version,strength:0,applied:false});
const clamp=x=>Math.max(0,Math.min(1,x));
const s5=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};

function bezier(values,t){
 const s=1-t,s2=s*s,t2=t*t;
 return values[0]*s2*s2*s+5*values[1]*t*s2*s2+10*values[2]*t2*s2*s+
  10*values[3]*t2*t*s2+5*values[4]*t2*t2*s+values[5]*t2*t2*t;
}
function derivative(values,t,h){
 const s=1-t,s2=s*s,t2=t*t;
 return 5*((values[1]-values[0])*s2*s2+4*(values[2]-values[1])*t*s2*s+
  6*(values[3]-values[2])*t2*s2+4*(values[4]-values[3])*t2*t*s+
  (values[5]-values[4])*t2*t2)/h;
}

// Out is [dx,dz,d(dx)/dy,d(dz)/dy]. The field is exactly zero outside
// support; its value and first two derivatives meet zero at both endpoints.
export function sampleNearEar144(y,out,coefficients=ROUTE144_COEFFICIENTS){
 if(y<=ROUTE144_SPEC.bottom||y>=ROUTE144_SPEC.top){out.fill(0);return out;}
 const segments=coefficients.segments;
 let i=0;while(i<segments.length-1&&y>segments[i].y1)i++;
 const q=segments[i],h=q.y1-q.y0,t=clamp((y-q.y0)/h);
 out[0]=bezier(q.x,t);out[1]=bezier(q.z,t);out[2]=derivative(q.x,t,h);out[3]=derivative(q.z,t,h);
 return out;
}

function guardFine(next,baseline){
 const weight=y=>s5((ROUTE144_SPEC.fineTop-y)/(ROUTE144_SPEC.fineTop-ROUTE144_SPEC.fineTopFull))*
  s5((y-ROUTE144_SPEC.fineBottom)/(ROUTE144_SPEC.fineBottomFull-ROUTE144_SPEC.fineBottom));
 return{
  getPoint(t){
   const a=baseline.getPoint(t),w=weight(a.y);if(w===0)return a;
   const b=next.getPoint(t);return w===1?b:a.lerp(b,w);
  },
  getTangent(t){
   const a=baseline.getPoint(t);if(a.y>=ROUTE144_SPEC.fineTop||a.y<=ROUTE144_SPEC.fineBottom)return baseline.getTangent(t);
   return this.getPoint(Math.min(1,t+.0001)).sub(this.getPoint(Math.max(0,t-.0001))).normalize();
  }
 };
}

/** Prepare before118 and before all longLock/fine construction. */
export function prepareNearEar144(guides,{strength=0,headTilt=-.17,coefficients=ROUTE144_COEFFICIENTS}={}){
 if(strength!==0&&strength!==1)throw new RangeError('144 is the approved off/on route only.');
 if(strength===0)return null;
 if(headTilt!==-.17)throw new Error('144 coefficients require the accepted head tilt.');
 if(!Array.isArray(guides)||guides.length!==276)throw new Error('144 requires the frozen pre-temple guide order.');
 const g=guides[ROUTE144_SPEC.guide];
 if(g.original118||g.nearEar144)throw new Error('144 must precede118 on freshly authored guides.');
 if(g.kind!=='curl'||!g.front||g.deformEar!==false||g.scalpRoot?.side!==-1||Math.abs(g.scalpRoot.u-.680)>1e-13||
  Math.abs(g.w-.04420781457843259)>1e-13||Math.abs(g.d-.019444784147664908)>1e-13)throw new Error('144 selected guide or section changed.');
 const original={...g},c=original.c,out=new Float64Array(4),started=performance.now();
 const wrapped={
  debug:c.debug,
  getPoint(t){const p=c.getPoint(t);if(p.y<=ROUTE144_SPEC.bottom||p.y>=ROUTE144_SPEC.top)return p;sampleNearEar144(p.y,out,coefficients);p.x+=out[0];p.z+=out[1];return p;},
  getTangent(t){
   const p=c.getPoint(t);if(p.y<=ROUTE144_SPEC.bottom||p.y>=ROUTE144_SPEC.top)return c.getTangent(t);
   sampleNearEar144(p.y,out,coefficients);const d=c.getTangent(t);d.x+=out[2]*d.y;d.z+=out[3]*d.y;return d.normalize();
  }
 };
 g.c=wrapped;
 const metrics={version:ROUTE144_SPEC.version,strength,applied:true,guide:138,regularRibbons:0,flyawaySlots:[],
  sourceParameterCuts:c.debug.cuts.slice(),sourceRoot:c.debug.crownExit.slice(),sourceWidth:g.w,sourceDepth:g.d,
  support:[ROUTE144_SPEC.bottom,ROUTE144_SPEC.top],protectedLower:ROUTE144_SPEC.protectedLower,
  coefficientFingerprint:coefficients.fingerprint,continuousCenterBound:coefficients.continuousBound,
  centerMapDeterminant:1,originalMeshesAdded:0,originalStrandsAdded:0,perFrameWork:0,preparationMs:performance.now()-started};
 g.nearEar144={original,wrapped};
 let baseline=null;
 return{
  metrics,original,
  owns:other=>other===g,
  //118 owns the lower route. Reuse its exact current lower frame while
  // recovering the unmodified source upper frame for the fine guard.
  baselineGuide(other){
   if(other!==g)return null;if(baseline)return baseline;
   const lower=g.c,old=original.c;
   const hybrid={debug:old.debug,
    getPoint(t){return old.getPoint(t).y>ROUTE144_SPEC.bottom?old.getPoint(t):lower.getPoint(t);},
    getTangent(t){return old.getPoint(t).y>ROUTE144_SPEC.bottom?old.getTangent(t):lower.getTangent(t);},
    getFrame118(t,front,baseFrame){return old.getPoint(t).y>ROUTE144_SPEC.bottom?baseFrame(old,t,front):lower.getFrame118?lower.getFrame118(t,front,baseFrame):baseFrame(lower,t,front);}
   };
   baseline={...g,c:hybrid,original118:g.original118?original:null};
   delete baseline.nearEar144;return baseline;
  },
  regular(next,base,{guide,section,end,lane,side,phase}){
   metrics.regularRibbons++;
   // Preserve the existing ribbon/lane/phase/end and sample its upper points
   // on the actual swept parent. Interpolating nineteen Cartesian controls
   // through this bend otherwise cuts the rear companions through the pinna.
   const upper={
    getPoint(t){if(t>=.70)throw new Error('144 upper support entered the random tip band.');return regularSample144(guide,section,t,end,lane,side,phase,0,0);},
    getTangent(t){return this.getPoint(Math.min(.699999,t+.0001)).sub(this.getPoint(Math.max(0,t-.0001))).normalize();}
   };
   return guardFine(upper,base);
  },
  flyaway(next,base,slot){metrics.flyawaySlots.push(slot);if(slot!==40)throw new Error('144 flyaway dependency changed.');return guardFine(next,base);},
  finish(){if(metrics.regularRibbons!==54||metrics.flyawaySlots.length!==1||metrics.flyawaySlots[0]!==40)throw new Error('144 fine dependency population changed.');}
 };
}

export function nearEar144OffMetrics(){return OFF;}

// Exact original regular-fiber sample sequence, including its shared random
// tip offset. Calling this helper never advances the procedural RNG.
export function regularSample144(g,section,t,end,lane,side,phase,tip,tipY){
 const {f,shape,root,depth:sectionDepth,inset,undulate}=section(g,t*end),
  spread=lane*g.w*shape*undulate,depth=side*(sectionDepth*Math.sqrt(Math.max(.01,1-lane*lane))+.0028*(1-.98*root))*shape;
 const p=f.p.clone().addScaledVector(f.s,spread+.0019*Math.sin(t*29+phase)).addScaledVector(f.n,inset+depth);
 p.x+=.024*Math.sin(phase)*tip;p.y+=tipY;p.z+=.016*Math.cos(phase)*tip;return p;
}

export function flyawaySample144(g,t,at,k,baseFrame){
 const f=g.c.getFrame118?g.c.getFrame118(at,g.front,baseFrame):baseFrame(g.c,at,g.front);
 return f.p.clone().addScaledVector(f.s,(k%2?1:-1)*g.w*(.83+.22*Math.sin(t*Math.PI))).addScaledVector(f.n,.011+.018*Math.sin(t*Math.PI));
}
