// One inspectable annular loft. Input is the actual prepared159 source data;
// this module does not know about a renderer, images, or global application state.
export const CHIN162_LOFT=Object.freeze({faceRow:24,faceColumns:380,neckRow:32,neckColumns:80,
  middle:.48,frontGuideFaceRow:4,frontGuideCosine:[.10,.85],frontMiddleHeightFraction:.24,frontMiddleVerticalTangent:.35,faceJetRows:20,sideFaceJetRows:2,middleJetRows:8,neckJetRows:2,
  faceRings:[0,.07,.16,.26,.37,.48,.60,.73,.85,.94,1],neckRows:[36,35,34,33,32],
  materialJoinNeckRow:36,forwardDownEnvelope:.02,version:'connected-chin-neck-coarse-162'});
const TAU=Math.PI*2,add=(a,b)=>a.map((v,k)=>v+b[k]),sub=(a,b)=>a.map((v,k)=>v-b[k]),scale=(a,s)=>a.map(v=>v*s),mix=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t),
  dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=a=>Math.hypot(...a),unit=a=>{const l=length(a);if(!(l>1e-12))throw Error('162 singular normal/section derivative.');return scale(a,1/l);};
export const V162={add,sub,scale,mix,dot,cross,length,unit};
const mod=(i,n)=>(i%n+n)%n;
const read=(a,i)=>Array.from({length:a.itemSize},(_,k)=>a.array[i*a.itemSize+k]);
export function point162(a,p){return[a[0]*p[0]+a[4]*p[1]+a[8]*p[2]+a[12],a[1]*p[0]+a[5]*p[1]+a[9]*p[2]+a[13],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]+a[14]];}
export function vector162(a,p){return[a[0]*p[0]+a[4]*p[1]+a[8]*p[2],a[1]*p[0]+a[5]*p[1]+a[9]*p[2],a[2]*p[0]+a[6]*p[1]+a[10]*p[2]];}
function catmull(p0,p1,p2,p3,t){
  const n=p1.length,value=[],derivative=[];
  for(let k=0;k<n;k++){
    const a=p1[k],b=(p2[k]-p0[k])*.5,c=p0[k]-2.5*p1[k]+2*p2[k]-.5*p3[k],d=.5*(p3[k]-p0[k])+1.5*(p1[k]-p2[k]);
    value[k]=a+t*(b+t*(c+t*d));derivative[k]=b+t*(2*c+3*t*d);
  }
  return{value,derivative};
}
function ring(part,row,u,key='position'){
  const n=part.columns,p=part.geometry.attributes[key],phase=part.kind==='face'?.5:0,q=mod(u+phase,1)*n;
  let col=Math.floor(q),t=q-col;if(t<1e-11)t=0;else if(1-t<1e-11){col++;t=0;}
  const cols=[col-1,col,col+1,col+2].map(v=>row*(n+1)+mod(v,n));
  const s=catmull(...cols.map(i=>read(p,i)),t);s.derivative=scale(s.derivative,n);
  if(key==='position'){s.value=point162(part.frame,s.value);s.derivative=vector162(part.frame,s.derivative);}
  return s;
}
function sourceRow(part,row,u,key='uv'){
  const maximum=part.kind==='face'?290:44,r=Math.max(0,Math.min(maximum,row)),i=Math.floor(r),t=r-i;
  return mix(ring(part,i,u,key).value,ring(part,Math.min(maximum,i+1),u,key).value,t);
}
function quintic(p0,p1,m0,m1,a0,a1,h,t){
  const value=[],derivative=[],second=[];
  for(let k=0;k<3;k++){
    const c0=p0[k],c1=m0[k]*h,c2=.5*a0[k]*h*h,P=p1[k]-c0-c1-c2,D=m1[k]*h-c1-2*c2,A=a1[k]*h*h-2*c2,
      c3=10*P-4*D+.5*A,c4=-15*P+7*D-A,c5=6*P-3*D+.5*A;
    value[k]=c0+t*(c1+t*(c2+t*(c3+t*(c4+t*c5))));
    derivative[k]=(c1+t*(2*c2+t*(3*c3+t*(4*c4+t*5*c5))))/h;
    second[k]=(2*c2+t*(6*c3+t*(12*c4+t*20*c5)))/(h*h);
  }
  return{value,derivative,second};
}
export function createChinLoft162(face,neck){
  const s=CHIN162_LOFT,zero=[0,0,0];
  function section(u){
    const A=ring(face,s.faceRow,u),F1=ring(face,s.faceRow+1,u),F2=ring(face,s.faceRow+2,u),B=ring(neck,s.materialJoinNeckRow,u),N1=ring(neck,s.materialJoinNeckRow-1,u),N2=ring(neck,s.materialJoinNeckRow-2,u),Q=ring(face,s.frontGuideFaceRow,u),Q1=ring(face,s.frontGuideFaceRow+1,u),Q0=ring(face,s.frontGuideFaceRow-1,u),
      c=Math.cos(u*TAU),x=(c-s.frontGuideCosine[0])/(s.frontGuideCosine[1]-s.frontGuideCosine[0]),t=Math.max(0,Math.min(1,x)),w=t*t*t*(10+t*(-15+6*t)),
      dw=x>0&&x<1?30*t*t*(1-t)*(1-t)*(-TAU*Math.sin(u*TAU))/(s.frontGuideCosine[1]-s.frontGuideCosine[0]):0,
      faceJet=s.sideFaceJetRows+(s.faceJetRows-s.sideFaceJetRows)*w,faceJetU=(s.faceJetRows-s.sideFaceJetRows)*dw;
    const records={};
    for(const key of['value','derivative']){
      const a=A[key],b=B[key],f1=F1[key],f2=F2[key],n1=N1[key],n2=N2[key],q=Q[key],L=mix(a,b,s.middle),L0=mix(A.value,B.value,s.middle),
        guide=[L[0],b[1]+s.frontMiddleHeightFraction*(a[1]-b[1]),q[2]],guide0=[L0[0],B.value[1]+s.frontMiddleHeightFraction*(A.value[1]-B.value[1]),Q.value[2]],
        oldTangent=scale(sub(Q1[key],Q0[key]),-.5*s.middleJetRows),oldTangent0=scale(sub(Q1.value,Q0.value),-.5*s.middleJetRows),
        middleTangent=[b[0]-a[0],s.frontMiddleVerticalTangent*(b[1]-a[1]),oldTangent[2]],middleTangent0=[B.value[0]-A.value[0],s.frontMiddleVerticalTangent*(B.value[1]-A.value[1]),oldTangent0[2]],
        middleCorrection=key==='derivative'?scale(sub(middleTangent0,sub(B.value,A.value)),dw):zero;
      // Use the old front profile only for depth. Its narrow terminal ring is
      // not a viable circumferential neck guide: copying its X/Y produced an
      // actual fold. Endpoint-relative width/height keep one connected return.
      records[key]={A:a,B:b,K:add(mix(L,guide,w),key==='derivative'?scale(sub(guide0,L0),dw):zero),
        // Keep the exact boundary tangent direction. A twenty-row jet is
        // appropriate for the long chin return but overshoots the much
        // shorter side/back join; the same smooth angular gate reduces its
        // length there. Include the angular product rule in du.
        m0:add(scale(add(add(scale(a,-3),scale(f1,4)),scale(f2,-1)),-faceJet*.5),key==='derivative'?scale(add(add(scale(A.value,-3),scale(F1.value,4)),scale(F2.value,-1)),-faceJetU*.5):zero),
        m1:scale(add(add(scale(b,3),scale(n1,-4)),n2),-s.neckJetRows*.5),
        a0:add(scale(add(sub(a,scale(f1,2)),f2),faceJet*faceJet),key==='derivative'?scale(add(sub(A.value,scale(F1.value,2)),F2.value),2*faceJet*faceJetU):zero),
        a1:scale(add(sub(b,scale(n1,2)),n2),s.neckJetRows*s.neckJetRows),M:add(mix(sub(b,a),middleTangent,w),middleCorrection)};
    }
    function sample(v){
      if(!(v>=0&&v<=1))throw Error('162 loft parameter outside fixed band.');
      const first=v<=s.middle,h=first?s.middle:1-s.middle,t=first?v/h:(v-s.middle)/h;
      const evalRecord=r=>first?quintic(r.A,r.K,r.m0,r.M,r.a0,zero,h,t):quintic(r.K,r.B,r.M,r.m1,zero,r.a1,h,t),p=evalRecord(records.value),uJet=evalRecord(records.derivative);
      return{point:p.value,du:uJet.value,dv:p.derivative,dvv:p.second,normal:unit(cross(p.derivative,uJet.value))};
    }
    return{sample,anchors:records.value,frontWeight:w};
  }
  return{section,sample:(u,v)=>section(mod(u,1)).sample(v),face,neck};
}
function worldNormal(part,id){
  const n=read(part.geometry.attributes.normal,id),a=part.inverse;
  if(length(n)===0)throw Error('162 found a zero normal on a retained cut loop.');
  return unit([a[0]*n[0]+a[1]*n[1]+a[2]*n[2],a[4]*n[0]+a[5]*n[1]+a[6]*n[2],a[8]*n[0]+a[9]*n[1]+a[10]*n[2]]);
}
function localNormal(face,n){const a=face.frame;return unit([a[0]*n[0]+a[1]*n[1]+a[2]*n[2],a[4]*n[0]+a[5]*n[1]+a[6]*n[2],a[8]*n[0]+a[9]*n[1]+a[10]*n[2]]);}
export function cutIndex162(part){
  const {geometry:g,kind,columns:n}=part,cut=kind==='face'?CHIN162_LOFT.faceRow:CHIN162_LOFT.neckRow,source=g.index.array,groups=g.groups?.length?g.groups:[{start:0,count:source.length,materialIndex:0}],kept=[],resultGroups=[],retired=[],edgeMaterial=new Int8Array(n).fill(-1);
  for(const group of groups){const start=kept.length;
    for(let k=group.start;k<group.start+group.count;k+=3){
      const tri=[source[k],source[k+1],source[k+2]],rows=tri.map(i=>Math.floor(i/(n+1))),inside=kind==='face'?Math.min(...rows)>=cut:Math.max(...rows)<=cut;
      if(inside){kept.push(...tri);
        if(kind==='face'){
          const edge=tri.filter(i=>Math.floor(i/(n+1))===cut).map(i=>i%(n+1));
          if(edge.length===2&&Math.abs(edge[0]-edge[1])===1)edgeMaterial[Math.min(...edge)]=group.materialIndex;
        }
      }else retired.push(k/3);
    }
    if(kept.length>start)resultGroups.push({start,count:kept.length-start,materialIndex:group.materialIndex});
  }
  if(kind==='face'&&[...edgeMaterial].some(i=>i<0||i>1))throw Error('162 could not map every original two-material face cut edge.');
  return{index:new Uint32Array(kept),groups:resultGroups,retiredTriangles:retired.length,retiredTriangleIDs:retired,edgeMaterial};
}
export function emitChinBand162(face,neck,{retainDebug=false}={}){
  const s=CHIN162_LOFT,loft=createChinLoft162(face,neck),faceCut=cutIndex162(face),neckCut=cutIndex162(neck),positions=[],normals=[],uv=[],color=[],logical=[],faceRows=[],neckRows=[],indices=[[],[],[]],N=s.faceColumns;
  let maximumBoundaryWorldRounding=0,minimumBoundaryAuthoredNormalCosine=1;
  const cache=new Map();
  const sourceVertex=(part,row,i)=>row*(part.columns+1)+i;
  function emit(v,i,kind,neckRow=null){
    const part=kind==='face'?face:neck,count=v===1||kind==='neck'?s.neckColumns:N,u=kind==='face'?mod(i/count-.5,1):i/count,canonical=Math.round(mod(u,1)*N)%N,key=v+':'+canonical;
    let sample;
    if(v===1||kind==='neck')sample=loft.sample(mod(u,1),1);
    else{sample=cache.get(key);if(!sample){sample=loft.sample(canonical/N,v);cache.set(key,sample);}}
    let p=point162(face.inverse,sample.point),n=sample.normal;
    if(v===0||v===1||kind==='neck'){
      const boundPart=v===0?face:neck,row=v===0?s.faceRow:kind==='neck'?neckRow:s.materialJoinNeckRow,col=v===1&&kind==='face'?mod(i+s.neckColumns/2,s.neckColumns):i,
        id=sourceVertex(boundPart,row,col),actual=point162(boundPart.frame,read(boundPart.geometry.attributes.position,id));
      p=v===0?read(face.geometry.attributes.position,id):point162(face.inverse,actual);
      const authored=worldNormal(boundPart,id);if(kind!=='neck'||neckRow===s.materialJoinNeckRow)minimumBoundaryAuthoredNormalCosine=Math.min(minimumBoundaryAuthoredNormalCosine,dot(authored,n));n=authored;
      const rounded=point162(face.frame,p.map(Math.fround));maximumBoundaryWorldRounding=Math.max(maximumBoundaryWorldRounding,length(sub(rounded,actual)));
    }
    const localN=v===0?read(face.geometry.attributes.normal,sourceVertex(face,s.faceRow,i)):localNormal(face,n),index=positions.length/3;
    positions.push(...p);normals.push(...localN);
    // The seam is a deliberate chart switch on the rearward submental return,
    // never an image rebake. Source UV0/material objects remain untouched.
    const faceRow=v<=s.middle?s.faceRow+(s.frontGuideFaceRow-s.faceRow)*v/s.middle:
      s.frontGuideFaceRow*(1-v)/(1-s.middle),r=kind==='face'?faceRow:neckRow;
    let textureUV;
    if(v===0)textureUV=read(face.geometry.attributes.uv,sourceVertex(face,s.faceRow,i));
    else if(kind==='neck')textureUV=read(neck.geometry.attributes.uv,sourceVertex(neck,neckRow,i));
    else textureUV=sourceRow(face,r,u,'uv');
    uv.push(...textureUV);
    const c=v===0?read(face.geometry.attributes.color,sourceVertex(face,s.faceRow,i)):
      kind==='neck'?read(neck.geometry.attributes.color,sourceVertex(neck,neckRow,i)):
      part.geometry.attributes.color?sourceRow(part,Math.max(0,r),u,'color'):[1,1,1];color.push(...c.slice(0,3));
    logical.push({v,neckRow,u:mod(u,1),kind,source:v===0?['face',s.faceRow,i]:v===1||kind==='neck'?['neck',kind==='neck'?neckRow:s.materialJoinNeckRow,v===1&&kind==='face'?mod(i+s.neckColumns/2,s.neckColumns):i]:null});return index;
  }
  for(const v of s.faceRings)faceRows.push(Array.from({length:(v===1?s.neckColumns:N)+1},(_,i)=>emit(v,i,'face')));
  for(const row of s.neckRows)neckRows.push(Array.from({length:s.neckColumns+1},(_,i)=>emit(1,i,'neck',row)));
  function connect(rows,kind){for(let r=0;r<rows.length-1;r++){
    const a=rows[r],b=rows[r+1],na=a.length-1,nb=b.length-1;
    if(na===nb){for(let i=0;i<na;i++){const group=kind==='face'?faceCut.edgeMaterial[i]:2;indices[group].push(a[i],b[i],a[i+1],a[i+1],b[i],b[i+1]);}}
    else{
      // Monotone circular zipper: every original lower boundary edge occurs
      // exactly once; no 380-to80 boundary point is invented or dropped.
      let i=0,j=0;while(i<na||j<nb){const A=i<na?(i+1)/na:Infinity,B=j<nb?(j+1)/nb:Infinity;
        const group=kind==='face'?faceCut.edgeMaterial[Math.min(na-1,i)]:2;
        if(Math.abs(A-B)<1e-12){indices[group].push(a[i],b[j],a[i+1],a[i+1],b[j],b[j+1]);i++;j++;}
        else if(A<B){indices[group].push(a[i],b[j],a[i+1]);i++;}
        else{indices[group].push(a[i],b[j],b[j+1]);j++;}
      }
    }
  }}
  connect(faceRows,'face');connect(neckRows,'neck');
  const allIndices=[],groups=[];for(let i=0;i<3;i++){groups.push({start:allIndices.length,count:indices[i].length,materialIndex:i});allIndices.push(...indices[i]);}
  const data={position:new Float32Array(positions),normal:new Float32Array(normals),uv:new Float32Array(uv),color:new Float32Array(color),index:new Uint32Array(allIndices),groups};
  const metrics={version:s.version,vertices:data.position.length/3,triangles:data.index.length/3,retiredFaceTriangles:faceCut.retiredTriangles,retiredNeckTriangles:neckCut.retiredTriangles,
    maximumBoundaryWorldRounding,minimumBoundaryAuthoredNormalCosine,materialJoin:{upperLoftV:1,faceRow:0,neckRow:s.materialJoinNeckRow,faceSlots:[0,1],neckSlot:2},
    normalQualification:'Interior analytic loft derivatives. Top normals copied bit-exact; neck authored normals expressed in the shared face frame. Retained original boundary buffers never change. Geometric disagreement and Float32 world rounding are measured separately.'};
  return{data,faceCut,neckCut,metrics,debug:retainDebug?{loft,logical,faceRows,neckRows}:null};
}
