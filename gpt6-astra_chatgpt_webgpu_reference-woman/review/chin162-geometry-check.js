import {CHIN162_LOFT,V162,point162} from './chin162-loft.js';
const {sub,cross,dot,length,mix}=V162;
const demand=(v,m)=>{if(!v)throw Error('162 geometry '+m);};
const read=(a,i)=>[a[i*3],a[i*3+1],a[i*3+2]];
const keyUV=(v,u)=>'loft:'+v+':'+Math.round(((u%1+1)%1)*7600);
function logicalKey(q){
  if(q.source){const[kind,row,col]=q.source,n=kind==='face'?380:80;return kind+':'+row+':'+(col%n);}
  return keyUV(q.v,q.u);
}
function edge(a,b){return a<b?a+'|'+b:b+'|'+a;}
function sourcePoint(part,row,u){
  const n=part.columns,q=((u+(part.kind==='face'?.5:0))%1+1)%1*n,c=Math.floor(q),t=q-c,p=part.geometry.attributes.position;
  return point162(part.frame,mix(read(p.array,row*(n+1)+c),read(p.array,row*(n+1)+(c+1)%n),t));
}
export function checkChinGeometry162(out,{sections=false}={}){
  demand(out.debug,'requires temporary construction records.');
  const s=CHIN162_LOFT,{data,debug}=out,{face,neck}=debug.loft,canonical=debug.logical.map(logicalKey),edges=new Map(),groups=data.groups,
    metrics={candidate:162,scope:'Only emitted band topology, exact cut ownership, section shape and Float32 boundary agreement. No full-scene contact or render claim.',
      vertices:data.position.length/3,triangles:data.index.length/3,degenerateTriangles:0,opposedAuthoredTriangleNormals:0,minimumTriangleDoubleArea:Infinity,
      minimumTriangleAuthoredNormalCosine:1,maximumNormalLengthError:0,maximumLoftDerivativeError:0,maximumUpwardSectionDerivative:-Infinity,
      minimumSectionTangentLength:Infinity,minimumSampledRadialNormalCosine:1,maximumFrontDownwardDeparture:0,maximumCentralDownwardDeparture:0,
      maximumForwardDepartureAtExistingHeadY:0,frontEnvelopeSamples:0,sectionSamples:0,minimumRingWidth:Infinity,
      boundarySourceAttributesExact:true,originalFaceCutRow:s.faceRow,originalNeckCutRow:s.neckRow,materialJoinNeckRow:s.materialJoinNeckRow};
  for(const [name,a]of Object.entries(data))if(ArrayBuffer.isView(a))for(const x of a)demand(Number.isFinite(x),'nonfinite '+name+'.');
  for(let i=0;i<data.normal.length;i+=3)metrics.maximumNormalLengthError=Math.max(metrics.maximumNormalLengthError,Math.abs(Math.hypot(data.normal[i],data.normal[i+1],data.normal[i+2])-1));
  for(let k=0;k<data.index.length;k+=3){
    const ids=[data.index[k],data.index[k+1],data.index[k+2]];demand(ids.every(i=>i>=0&&i<metrics.vertices),'index outside vertex range.');
    const p=ids.map(i=>read(data.position,i)),n=cross(sub(p[1],p[0]),sub(p[2],p[0])),area=length(n),average=ids.map(i=>read(data.normal,i)).reduce((a,b)=>a.map((v,j)=>v+b[j]),[0,0,0]),cos=dot(n,average)/(area*length(average));
    if(area<1e-12)metrics.degenerateTriangles++;if(!(cos>0))metrics.opposedAuthoredTriangleNormals++;
    metrics.minimumTriangleDoubleArea=Math.min(metrics.minimumTriangleDoubleArea,area);metrics.minimumTriangleAuthoredNormalCosine=Math.min(metrics.minimumTriangleAuthoredNormalCosine,cos);
    for(let j=0;j<3;j++){const a=canonical[ids[j]],b=canonical[ids[(j+1)%3]],key=edge(a,b),r=edges.get(key)||{count:0,orientation:0};demand(a!==b,'collapsed logical edge.');r.count++;r.orientation+=a<b?1:-1;edges.set(key,r);}
  }
  const beforeBoundary={edges:edges.size,boundaryEdges:[...edges.values()].filter(r=>r.count===1).length,nonmanifold:[...edges.values()].filter(r=>r.count>2).length,
    inconsistentInteriorEdgeDirections:[...edges.values()].filter(r=>r.count===2&&r.orientation!==0).length};
  // Pair only the two actual retained cut loops. No fake closing polygon or
  // cap is emitted; unrelated existing face apertures are outside this audit.
  for(const [cut,row,kind,n]of [[out.faceCut,s.faceRow,'face',380],[out.neckCut,s.neckRow,'neck',80]]){
    let paired=0;
    for(let k=0;k<cut.index.length;k+=3)for(let j=0;j<3;j++){
      const a0=cut.index[k+j],b0=cut.index[k+(j+1)%3];
      if(Math.floor(a0/(n+1))!==row||Math.floor(b0/(n+1))!==row)continue;
      const a=kind+':'+row+':'+(a0%(n+1)%n),b=kind+':'+row+':'+(b0%(n+1)%n),r=edges.get(edge(a,b));
      demand(r?.count===1,'missing/duplicate actual retained '+kind+' boundary edge.');r.count++;r.orientation+=a<b?1:-1;paired++;
    }
    demand(paired===n,'actual retained boundary inventory changed for '+kind+'.');
  }
  metrics.closure={...beforeBoundary,pairedFaceEdges:380,pairedNeckEdges:80,unpairedAfterSourceBoundary:[...edges.values()].filter(r=>r.count!==2).length,
    inconsistentEdgeDirectionsAfterPairing:[...edges.values()].filter(r=>r.orientation!==0).length,
    definition:'Exact opposite-direction pairing to edges of the actual retained source triangles by cyclic source vertex IDs; material and original UV seams are coincident duplicate vertices. Multiframe Float32 world-space gap is recorded separately.'};
  demand(metrics.closure.unpairedAfterSourceBoundary===0&&beforeBoundary.nonmanifold===0&&metrics.closure.inconsistentEdgeDirectionsAfterPairing===0,'annulus has a free/nonmanifold or inconsistently wound edge.');
  const expectedFace=24*380*2,expectedNeck=12*80*2;
  demand(out.faceCut.retiredTriangles===expectedFace&&out.neckCut.retiredTriangles===expectedNeck,'retired an unexpected band.');
  for(const [part,cut]of [[face,out.faceCut],[neck,out.neckCut]])for(const id of cut.index){const row=Math.floor(id/(part.columns+1));demand(part.kind==='face'?row>=24:row<=32,'retained a triangle in an owned removed band.');}
  for(let i=0;i<debug.logical.length;i++){
    const q=debug.logical[i];if(q.source?.[0]==='face'){
      const row=q.source[1],col=q.source[2],id=row*381+col;
      for(let k=0;k<3;k++){demand(data.position[i*3+k]===face.geometry.attributes.position.array[id*3+k],'top source position changed.');demand(data.normal[i*3+k]===face.geometry.attributes.normal.array[id*3+k],'top source normal changed.');demand(data.color[i*3+k]===face.geometry.attributes.color.array[id*3+k],'top source color changed.');}
      for(let k=0;k<2;k++)demand(data.uv[i*2+k]===face.geometry.attributes.uv.array[id*2+k],'top source UV changed.');
    }
  }
  const frameCenter=[-.16,0,-.01],sectionRecords=[];
  for(let j=0;j<80;j++){
    const u=j/80,section=debug.loft.section(u),old=Array.from({length:25},(_,row)=>sourcePoint(face,row,u)),points=[];
    for(let k=0;k<=200;k++){
      const v=k/200,p=section.sample(v),radial=[p.point[0]-frameCenter[0],0,p.point[2]-frameCenter[2]];
      metrics.maximumUpwardSectionDerivative=Math.max(metrics.maximumUpwardSectionDerivative,p.dv[1]);metrics.minimumSectionTangentLength=Math.min(metrics.minimumSectionTangentLength,length(p.dv));
      metrics.minimumSampledRadialNormalCosine=Math.min(metrics.minimumSampledRadialNormalCosine,dot(p.normal,radial)/length(radial));metrics.sectionSamples++;
      if(Math.cos(u*Math.PI*2)>.1){
        for(let r=0;r<old.length-1;r++){
          if((old[r][2]-p.point[2])*(old[r+1][2]-p.point[2])<=0&&Math.abs(old[r+1][2]-old[r][2])>1e-10){
            const y=old[r][1]+(old[r+1][1]-old[r][1])*(p.point[2]-old[r][2])/(old[r+1][2]-old[r][2]),down=y-p.point[1];
            metrics.maximumFrontDownwardDeparture=Math.max(metrics.maximumFrontDownwardDeparture,down);if(Math.cos(u*Math.PI*2)>=.85)metrics.maximumCentralDownwardDeparture=Math.max(metrics.maximumCentralDownwardDeparture,down);metrics.frontEnvelopeSamples++;break;
          }
        }
        for(let r=0;r<old.length-1;r++)if((old[r][1]-p.point[1])*(old[r+1][1]-p.point[1])<=0&&Math.abs(old[r+1][1]-old[r][1])>1e-10){
          const z=old[r][2]+(old[r+1][2]-old[r][2])*(p.point[1]-old[r][1])/(old[r+1][1]-old[r][1]);metrics.maximumForwardDepartureAtExistingHeadY=Math.max(metrics.maximumForwardDepartureAtExistingHeadY,p.point[2]-z);break;
        }
      }
      if(sections&&j%5===0)points.push({v,point:p.point,normal:p.normal});
      if(k%20===11){const e=1e-6,up=debug.loft.sample(u+e,v),um=debug.loft.sample(u-e,v),vp=section.sample(v+e),vm=section.sample(v-e);for(let axis=0;axis<3;axis++){
        metrics.maximumLoftDerivativeError=Math.max(metrics.maximumLoftDerivativeError,Math.abs((up.point[axis]-um.point[axis])/(2*e)-p.du[axis]),Math.abs((vp.point[axis]-vm.point[axis])/(2*e)-p.dv[axis]));
      }}
    }
    if(sections&&j%5===0)sectionRecords.push({u,anchors:section.anchors,old,points,
      retainedUpper:Array.from({length:9},(_,k)=>sourcePoint(face,s.faceRow+k,u)),
      oldNeck:Array.from({length:13},(_,k)=>sourcePoint(neck,s.neckRow+k,u))});
  }
  for(let k=0;k<=100;k++){
    const v=k/100,positive=debug.loft.sample(.25,v).point,negative=debug.loft.sample(.75,v).point;metrics.minimumRingWidth=Math.min(metrics.minimumRingWidth,positive[0]-negative[0]);
  }
  // Coarse shape gate, not a theorem about the complete scene: the independent
  // emitted triangles have positive orientation, and the sampled sections have
  // no upward return. Native art still decides the new anatomy and materials.
  demand(metrics.degenerateTriangles===0&&metrics.opposedAuthoredTriangleNormals===0,'emitted degenerate/opposed triangles.');
  demand(metrics.maximumUpwardSectionDerivative<0,'found a neck hook in a sampled section.');
  demand(metrics.maximumLoftDerivativeError<3e-5,'analytic derivative mismatch.');
  demand(out.metrics.maximumBoundaryWorldRounding<2e-7,'cut-loop gap exceeds Float32 rounding.');
  metrics.materialGroups=groups.map(g=>({...g,triangles:g.count/3}));metrics.boundary=out.metrics;
  return{metrics,sections:sectionRecords};
}
