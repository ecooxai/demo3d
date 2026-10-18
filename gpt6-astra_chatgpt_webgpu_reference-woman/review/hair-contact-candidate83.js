import { sampleBlouseFrontAtXY } from './blouse.js';

// Guide-level contact with the authored blouse. The final deformation is a
// translation along model Z, preserving posed X/Y and each lock's cross-section.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
// The separate collar can stand .147 ahead of the body. Keep its measured
// envelope plus a margin clear until a collar-surface query is available.
const collarWeight=(x,y)=>1-(1-smooth(.84,.98,Math.abs(x)))*smooth(.44,.53,y);
const now=()=>performance.now();

function profile(nodes){
 const x=Float64Array.from(nodes,n=>n.y),v=Float64Array.from(nodes,n=>n.value),n=x.length,m=new Float64Array(n),d=new Float64Array(n-1);
 for(let i=0;i<n-1;i++)d[i]=(v[i+1]-v[i])/(x[i+1]-x[i]);
 m[0]=d[0];m[n-1]=d[n-2];
 for(let i=1;i<n-1;i++)if(d[i-1]*d[i]>0){const a=x[i]-x[i-1],b=x[i+1]-x[i],w1=2*b+a,w2=b+2*a;m[i]=(w1+w2)/(w1/d[i-1]+w2/d[i]);}
 return y=>{
  if(y<=x[0]||y>=x[n-1])return 0;
  let lo=0,hi=n-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(x[mid]>y)hi=mid;else lo=mid;}
  const h=x[hi]-x[lo],t=(y-x[lo])/h,t2=t*t,t3=t2*t;
  return(2*t3-3*t2+1)*v[lo]+(t3-2*t2+t)*h*m[lo]+(-2*t3+3*t2)*v[hi]+(t3-t2)*h*m[hi];
 };
}

function soften(nodes){
 // Smooth by moving away from the body, so no new contact violation is added.
 for(let pass=0;pass<2;pass++){
  const next=nodes.map(n=>n.value);
  for(let i=1;i<nodes.length-1;i++)next[i]=Math.max(next[i],(nodes[i-1].value+2*nodes[i].value+nodes[i+1].value)/4);
  for(let i=0;i<nodes.length;i++)nodes[i].value=next[i];
 }
 // Bound the depth change as the hair approaches and leaves the shoulder.
 for(let i=1;i<nodes.length;i++)nodes[i].value=Math.max(nodes[i].value,nodes[i-1].value-1.05*(nodes[i].y-nodes[i-1].y));
 for(let i=nodes.length-2;i>=0;i--)nodes[i].value=Math.max(nodes[i].value,nodes[i+1].value-1.05*(nodes[i+1].y-nodes[i].y));
}

export function createHairContact({headTilt=-.17,headShiftX=.26,headY=2.95,sampleSurface=sampleBlouseFrontAtXY}={}){
 const yaw=.16,cy=Math.cos(yaw),sy=Math.sin(yaw),cr=Math.cos(headTilt),sr=Math.sin(headTilt),bodyRoll=.045,bc=Math.cos(bodyRoll),bs=Math.sin(bodyRoll);
 const axis=[-sy*cr,sy*sr,cy],metrics={version:'guide-blouse-contact-78',eligibleGuides:0,fittedGuides:0,clothQueries:0,validClothQueries:0,maxDepthPull:0,minProbeClearance:Infinity,preparationMs:0,queryMs:0,guides:[]};
 function posed(p){
  const w=1-smooth(-1.64,.38,p.y),a=-yaw*w,b=-headTilt*w,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
  const x=p.x*ca+p.z*sa,z=-p.x*sa+p.z*ca,xx=x*cb-p.y*sb,yy=x*sb+p.y*cb,rx=xx*cr-yy*sr;
  return{x:headShiftX+rx*cy+z*sy,y:headY+xx*sr+yy*cr,z:-rx*sy+z*cy};
 }
 const bodyXY=p=>({x:bc*p.x+bs*(p.y-1),y:-bs*p.x+bc*(p.y-1)+1});
 const mask=(x,y)=>{const b=bodyXY({x,y});return collarWeight(b.x,b.y);};
 function query(p){const b=bodyXY(p),start=now();metrics.clothQueries++;const hit=sampleSurface(b.x,b.y);metrics.queryMs+=now()-start;if(hit)metrics.validClothQueries++;return hit?{...hit,localX:b.x,localY:b.y}:null;}
 function prepare(g,section){
  if(!(g.front||g.kind==='side'&&g.c.getPoint(.65).z>.15))return null;
  const start=now();
  metrics.eligibleGuides++;
  const rows=[],constraints=[],gap=.032+.008*(.5+.5*Math.sin(g.phase))+(g.kind==='curl'?.003:0);
  for(let j=0;j<=60;j++){
   const t=j/60,{f,shape,depth,inset,undulate}=section(t),c=f.p.clone().addScaledVector(f.n,inset),p=posed(c),row={y:p.y,value:0};rows.push(row);
   const vertical=(1-smooth(1.30,1.72,p.y))*smooth(-.75,-.15,p.y);
   if(vertical<.00001||p.z<.12)continue;
   const halfW=g.w*shape*undulate,halfD=depth*shape,edges=[posed(c.clone().addScaledVector(f.s,-halfW)),posed(c.clone().addScaledVector(f.s,halfW))];
   let collar=1;
   for(const q of[p,...edges]){const b=bodyXY(q);collar=Math.min(collar,collarWeight(b.x,b.y));}
   if(collar<.00001)continue;
   const center=query(p);if(!center||center.edgeWeight<.0001)continue;
   // The tips stay free from attraction, but a pre-existing buried end still
   // receives the outward clearance correction instead of being half lifted.
   const weight=vertical*center.edgeWeight*collar*(1-smooth(.72,.96,t));
   let backExtent=0;
   for(let k=0;k<8;k++){const a=k*Math.PI/4,q=posed(c.clone().addScaledVector(f.s,halfW*Math.cos(a)).addScaledVector(f.n,halfD*Math.sin(a)));backExtent=Math.max(backExtent,p.z-q.z);}
   const probes=[{p,hit:center}];
   for(const q of edges){const hit=query(q);if(hit)probes.push({p:q,hit});}
   let required=-Infinity;
   for(const probe of probes){const nz=probe.hit.normal.z,limit=probe.hit.point.z+gap/nz+backExtent-p.z;required=Math.max(required,limit);constraints.push({y:probe.p.y,limit,nz,gap});}
   row.value=required<0?required*weight:required;
  }
  rows.sort((a,b)=>a.y-b.y);
  const nodes=[];
  for(const row of rows){if(nodes.length&&row.y-nodes.at(-1).y<.000001)nodes.at(-1).value=Math.max(nodes.at(-1).value,row.value);else nodes.push(row);}
  nodes.unshift({y:nodes[0].y-.05,value:0});nodes.push({y:nodes.at(-1).y+.05,value:0});
  soften(nodes);let sample=profile(nodes);
  // Width samples retain the same posed XY after fitting. Reuse their exact
  // cloth depths to lift the smooth field if interpolation gets too close.
  for(let pass=0;pass<2;pass++){
   let changed=false;
   for(const c of constraints){const correction=c.limit-sample(c.y);if(correction<=.0001)continue;let i=1;while(i<nodes.length-1&&nodes[i].y<c.y)i++;nodes[i-1].value+=correction+.001;nodes[i].value+=correction+.001;changed=true;}
   if(!changed)break;soften(nodes);sample=profile(nodes);
  }
  const pull=-Math.min(...nodes.map(n=>n.value));
  metrics.preparationMs=Number((metrics.preparationMs+now()-start).toFixed(1));
  if(pull<.002)return null;
  metrics.fittedGuides++;metrics.maxDepthPull=Math.max(metrics.maxDepthPull,pull);
  for(const c of constraints)metrics.minProbeClearance=Math.min(metrics.minProbeClearance,c.gap+(sample(c.y)-c.limit)*c.nz);
  if([58,74,90,91,114,132,137,199,227].includes(g.id))metrics.guides.push({id:g.id,kind:g.kind,maxPull:pull,samples:nodes.length});
  return{sample,axis,headY,headShiftX,cr,sr,cy,sy,mask};
 }
 return{prepare,metrics};
}
