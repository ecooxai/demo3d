// Source-only finite support, trace continuity and sampled cut-edge checks.
// No photograph pixels or production files are read or changed here.
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=a=>Math.hypot(...a),unit=a=>{const n=length(a);return a.map(x=>x/n);},mix=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),attr=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)];
const derivative=(p,t,h=1e-5)=>{const a=clamp(t-h),b=clamp(t+h);return sub(p(b),p(a)).map(x=>x/(b-a));};
const angle=(a,b)=>Math.acos(clamp(dot(unit(a),unit(b)),-1,1))*180/Math.PI;
function curvature(p,t,h=.0002){const a=p(Math.max(0,t-h)),b=p(t),c=p(Math.min(1,t+h)),da=sub(b,a),db=sub(c,b),la=length(da),lb=length(db);return 2*length(cross(da,db))/(la*lb*length(sub(c,a))||1);}
function transform(m,p){return[0,1,2].map(i=>m[i]*p[0]+m[4+i]*p[1]+m[8+i]*p[2]+m[12+i]);}
function arcAt(a,t){const x=clamp(t)*(a.length-1),i=Math.min(a.length-2,Math.floor(x));return a[i]+(a[i+1]-a[i])*(x-i);}

export function focusedChecks150(hair,head,qa,front150){
 const {application:a}=qa,{geometry:g}=a.mesh,p=g.attributes.position,index=g.index,support=a.support;
 const supportChecks={chordMidpoints:{samples:0,minimumNormalGap:Infinity,penetrations:0},triangleCentroids:{samples:0,minimumNormalGap:Infinity,penetrations:0},unsupported:[],minimumNormalZ:1};
 const check=(q,kind,owner)=>{const hit=support.at(q[0],q[1]);if(!hit){supportChecks.unsupported.push({...owner,kind,point:q});return;}const gap=(q[2]-hit.p[2])*hit.n[2],m=supportChecks[kind];m.samples++;m.minimumNormalGap=Math.min(m.minimumNormalGap,gap);if(gap<-.0005)m.penetrations++;supportChecks.minimumNormalZ=Math.min(supportChecks.minimumNormalZ,hit.n[2]);};
 for(let member=0;member<72;member++)for(let row=0;row<48;row+=4)for(const section of[1,3,5]){
  const first=member*345+row*7,ia=first+section,ib=ia+7;check(mix(attr(p,ia),attr(p,ib),.5),'chordMidpoints',{member,row,section});
  for(const half of[0,1]){const tri=member*588+row*12+section*2+half,ids=[0,1,2].map(j=>index.getX(tri*3+j)),q=ids.map(i=>attr(p,i)).reduce((s,q)=>s.map((x,k)=>x+q[k]/3),[0,0,0]);check(q,'triangleCentroids',{member,row,section,half});}
 }
 const joins={maximumRootBodyTangentDegrees:0,maximumBodyTraceTangentDegrees:0,maximumBodyTraceGeometricCurvatureJump:0,maximumTracePositionError:0,minimumRetainedSourceArcFraction:1,maximumArcTableSegmentRatio:0,nonDescendingReleasedSamples:0};
 for(const r of a.routes){
  joins.maximumRootBodyTangentDegrees=Math.max(joins.maximumRootBodyTangentDegrees,angle(derivative(r.segments[0],1),derivative(r.segments[1],0)));
  joins.maximumBodyTraceTangentDegrees=Math.max(joins.maximumBodyTraceTangentDegrees,angle(derivative(r.segments[1],1),derivative(r.segments[2],0)));
  joins.maximumBodyTraceGeometricCurvatureJump=Math.max(joins.maximumBodyTraceGeometricCurvatureJump,Math.abs(curvature(r.segments[1],.9995)-curvature(r.segments[2],.0005)));
  joins.minimumRetainedSourceArcFraction=Math.min(joins.minimumRetainedSourceArcFraction,1-r.cutArc/r.length);
  for(let k=0;k<=16;k++){const s=k/16,t=r.cuts[2]+arcAt(r.tables[2],s)/r.total;joins.maximumTracePositionError=Math.max(joins.maximumTracePositionError,length(sub(r.point(t),r.source(r.cut+(1-r.cut)*s))));}
  for(let k=0;k<32;k++)if(r.segments[1]((k+1)/32)[1]>r.segments[1](k/32)[1]+1e-9)joins.nonDescendingReleasedSamples++;
  for(const t of r.tables){const ds=Array.from(t.slice(1),(x,i)=>x-t[i]);joins.maximumArcTableSegmentRatio=Math.max(joins.maximumArcTableSegmentRatio,Math.max(...ds)/Math.min(...ds));}
 }
 const crown=a.crown.geometry,cp=crown.attributes.position,cn=crown.attributes.normal,edges=[];
 for(const side of[-1,1])for(let j=0;j<=64;j+=4){const u=side<0?97/128:96/128,i=(side<0?7685:16070)+j*129+(side<0?97:96);edges.push({kind:side<0?'left-sheet-cut':'right-sheet-cut',row:j,vertex:i,point:front150.sampleCrown(crown,side,u+.00015,j/64),normal:attr(cn,i)});}
 for(let i=54;i<=90;i+=3){const k=32*145+i;edges.push({kind:'foundation-lower-cut',column:i,vertex:k,point:attr(cp,k),normal:attr(cn,k)});}
 for(const i of[54,90])for(let j=34;j<=50;j+=4){const k=j*145+i;edges.push({kind:'foundation-side-cut',column:i,row:j,vertex:k,point:attr(cp,k),normal:attr(cn,k)});}
 // Ray-visible samples include actual head and the two surviving coarse hair
 // surfaces. Fine ribbons are omitted, making this a conservative hair-cover
 // estimate. Sampling base-level alpha is not a native footprint guarantee.
 const selected=[a.crown,hair.children.find(m=>m.name==='Overlapping layered S-wave hair around front back and shoulders'),a.mesh];
 const H=hair.matrixWorld,inv=H.clone().invert(),sources=selected.map(m=>({name:m.name,g:m.geometry,material:m.material,m:null}));
 head.traverse(m=>{if(m.isMesh&&['continuous-face','sculpted-eyelids','ear-continuous-anatomical-shell'].includes(m.name)){const matrix=inv.clone().multiplyMatrices(inv,m.matrixWorld);sources.push({name:m.name,g:m.geometry,material:m.material,m:matrix.elements,head:true});}});
 function alpha(s,ids,bary){const c=s.g.attributes.color,uv=s.g.attributes.uv,texture=s.material?.map;let alpha=c?.itemSize===4?ids.reduce((v,i,j)=>v+c.array[i*4+3]*bary[j],0):1;
  if(texture?.image?.data&&uv){const im=texture.image;let u=ids.reduce((v,i,j)=>v+uv.getX(i)*bary[j],0),v=ids.reduce((v0,i,j)=>v0+uv.getY(i)*bary[j],0);u-=Math.floor(u);v=clamp(v);const x=Math.min(im.width-1,Math.floor(u*im.width)),y=Math.min(im.height-1,Math.floor(v*im.height));alpha*=im.data[(y*im.width+x)*4+3]/255;}return alpha;
 }
 for(const edge of edges)edge.baselineAlpha=alpha(sources[0],[edge.vertex,edge.vertex,edge.vertex],[1,0,0]);
 const coverage=[];
 for(const[name,world]of[['front',[0,0,1]],['left',[-1,0,0]],['right',[1,0,0]]]){
  const e=inv.elements,d=unit([e[0]*world[0]+e[4]*world[1]+e[8]*world[2],e[1]*world[0]+e[5]*world[1]+e[9]*world[2],e[2]*world[0]+e[6]*world[1]+e[10]*world[2]]),x=unit(cross([0,1,0],d)),y=unit(cross(d,x)),project=p=>[dot(p,x),dot(p,y),dot(p,d)],q=edges.map(s=>({...s,q:project(s.point),facing:dot(s.normal,d)>.02,nearest:null}));
  const lo=[Math.min(...q.map(p=>p.q[0]))-.002,Math.min(...q.map(p=>p.q[1]))-.002],hi=[Math.max(...q.map(p=>p.q[0]))+.002,Math.max(...q.map(p=>p.q[1]))+.002];
  for(const s of sources){const position=s.g.attributes.position,ix=s.g.index,projected=new Float32Array(position.count*3);for(let i=0;i<position.count;i++)projected.set(project(s.m?transform(s.m,attr(position,i)):attr(position,i)),i*3);
   for(let k=0;k<ix.count;k+=3){const ids=[ix.getX(k),ix.getX(k+1),ix.getX(k+2)],A=Array.from(projected.subarray(ids[0]*3,ids[0]*3+3)),B=Array.from(projected.subarray(ids[1]*3,ids[1]*3+3)),C=Array.from(projected.subarray(ids[2]*3,ids[2]*3+3)),minX=Math.min(A[0],B[0],C[0]),maxX=Math.max(A[0],B[0],C[0]),minY=Math.min(A[1],B[1],C[1]),maxY=Math.max(A[1],B[1],C[1]);if(maxX<lo[0]||minX>hi[0]||maxY<lo[1]||minY>hi[1])continue;const den=(B[1]-C[1])*(A[0]-C[0])+(C[0]-B[0])*(A[1]-C[1]);if(Math.abs(den)<1e-13||(!s.head&&s.material.side===0&&den<=0))continue;
    for(const sample of q){const[u,v]=sample.q;if(u<minX||u>maxX||v<minY||v>maxY)continue;const a0=((B[1]-C[1])*(u-C[0])+(C[0]-B[0])*(v-C[1]))/den,b0=((C[1]-A[1])*(u-C[0])+(A[0]-C[0])*(v-C[1]))/den,c0=1-a0-b0;if(Math.min(a0,b0,c0)<-1e-6)continue;const z=A[2]*a0+B[2]*b0+C[2]*c0;if(sample.nearest?.z>=z||(!s.head&&alpha(s,ids,[a0,b0,c0])<(s.material.alphaTest||.05)))continue;sample.nearest={mesh:s.name,head:!!s.head,z,ahead:z-sample.q[2]};}
   }
  }
  const eligible=q.filter(s=>s.facing&&s.baselineAlpha>.1);
  coverage.push({view:name,samples:q.length,cameraFacing:q.filter(s=>s.facing).length,opaqueFacingCuts:eligible.length,coveredByCoarseHair:eligible.filter(s=>s.nearest&&!s.nearest.head).length,hairAheadOfOldCut:eligible.filter(s=>s.nearest&&!s.nearest.head&&s.nearest.ahead>.00005).length,occludedByActualHead:eligible.filter(s=>s.nearest?.head&&s.nearest.ahead>.00005).length,uncoveredFacing:eligible.filter(s=>!s.nearest||(s.nearest.head&&s.nearest.ahead<=.00005)).map(({q,normal,...s})=>s),qualification:'Only sampled opaque cut-boundary rays; base-level nearest alpha, no antialiasing/mipmap footprint. Hair behind the original cut but ahead of the actual head fills the retired side; its depth step can remain visible. Protected fine layers can add coverage. Camera-facing and actual foreground occlusion are classified separately.'});
 }
 return{supportChecks,joins,cutCoverage:coverage};
}
