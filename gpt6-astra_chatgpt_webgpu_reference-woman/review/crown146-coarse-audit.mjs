import fs from 'node:fs';
import crypto from 'node:crypto';
import{construct146,THREE,read}from'./crown146-source.mjs';
const sha=a=>crypto.createHash('sha256').update(ArrayBuffer.isView(a)?Buffer.from(a.buffer,a.byteOffset,a.byteLength):a).digest('hex');
const vec=(a,i)=>[a.getX(i),a.getY(i),a.getZ(i)],arr=p=>[p.x,p.y,p.z],sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b,t=1)=>a.map((x,i)=>x+b[i]*t),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>a.map(x=>x/(len(a)||1));
const start=performance.now(),base=construct146(0,{baseline:true}),off=construct146(0),on=construct146(1),flow=on.__flow146;
const report={iteration:146,stage:'COARSE diagnostic only; no rebuilt dedicated crown/edge fibers',nativeArtPending:true,sourceHashes:Object.fromEntries(['review/hair-groom-candidate133.js','review/hair-groom-candidate146.js','review/crown-flow-candidate146.js','src/main.js','src/face.js'].map(p=>[p,sha(fs.readFileSync(p))])),errors:[],nonfinite:0,meshChecks:[],coarseIsolation:off.userData.coarseIsolation146};
const check=(yes,message)=>{if(!yes)report.errors.push(message);};
for(let m=0;m<5;m++){
 const original=base.children[m],zero=off.children[m],one=on.children[m],same={};
 for(const name of['index',...Object.keys(original.geometry.attributes)]){
  const a=name==='index'?original.geometry.index:original.geometry.attributes[name],b=name==='index'?zero.geometry.index:zero.geometry.attributes[name],c=name==='index'?one.geometry.index:one.geometry.attributes[name];
  check(sha(a.array)===sha(b.array),`OFF differs ${m}/${name}`);same[name]=sha(a.array)===sha(c.array);
  if(m!==0&&m!==3||!['position','normal'].includes(name))check(same[name],`Protected attribute changed ${m}/${name}`);
  for(const v of c.array)if(!Number.isFinite(v))report.nonfinite++;
 }
 for(const p of['roughness','anisotropy','anisotropyRotation','specularIntensity','envMapIntensity','alphaTest','alphaToCoverage','opacity','transparent','side','depthWrite'])check(original.material[p]===one.material[p],`Material changed ${m}/${p}`);
 for(const p of['map','normalMap'])if(original.material[p]?.image?.data)check(sha(original.material[p].image.data)===sha(one.material[p].image.data),`Pre100 map changed ${m}/${p}`);
 report.meshChecks.push({mesh:one.name,same,triangles:one.geometry.index.count/3,vertices:one.geometry.attributes.position.count});
}
check(report.nonfinite===0,'Nonfinite actual attributes');check(JSON.stringify(off.userData.coarseIsolation146)===JSON.stringify(on.userData.coarseIsolation146),'OFF/ON fine isolation differs');
report.pre100MapInputsEqual=true;report.post100MapQualification='Native100 uses current normals. The native pair must record final atlas hashes; RGB equality is not assumed.';
const cp=on.children[0].geometry.attributes.position,cn=on.children[0].geometry.attributes.normal,op=off.children[0].geometry.attributes.position,oldN=off.children[0].geometry.attributes.normal,ci=on.children[0].geometry.index.array,uv=on.children[0].geometry.attributes.uv;
const protect=on.__protectedCrown146,pole=new Set();for(const first of[7685,16070])for(let j=0;j<=64;j++)pole.add(first+j*129+128);
const crown={protectedVertices:0,protectedPositionChanges:0,protectedNormalChanges:0,changedMinimumY:Infinity,maximumMove:0,maximumPartXYChange:0,maximumPartDepthInset:0,baselineDegeneracies:0,newIntendedPoleDegeneracies:0,unexpectedDegeneracies:0,minTriangleDoubleArea:Infinity,minSignedFieldNormal:Infinity,minFrontFacingNormalZ:Infinity,poleMaxDistance:0,poleMaxNormalDifference:0};
for(let i=0;i<cp.count;i++){
 const move=len(sub(vec(cp,i),vec(op,i)));crown.maximumMove=Math.max(crown.maximumMove,move);
 if(protect[i]){crown.protectedVertices++;if(move)crown.protectedPositionChanges++;if(len(sub(vec(cn,i),vec(oldN,i))))crown.protectedNormalChanges++;}else crown.changedMinimumY=Math.min(crown.changedMinimumY,cp.getY(i),op.getY(i));
}
const tip=vec(cp,7685+128),tipN=vec(cn,7685+128);for(const i of pole){crown.poleMaxDistance=Math.max(crown.poleMaxDistance,len(sub(vec(cp,i),tip)));crown.poleMaxNormalDifference=Math.max(crown.poleMaxNormalDifference,len(sub(vec(cn,i),tipN)));}
for(const first of[7685,16070])for(let i=0;i<=128;i++){const at=first+i;crown.maximumPartXYChange=Math.max(crown.maximumPartXYChange,Math.hypot(cp.getX(at)-op.getX(at),cp.getY(at)-op.getY(at)));crown.maximumPartDepthInset=Math.max(crown.maximumPartDepthInset,op.getZ(at)-cp.getZ(at));}
const changedTriangles=[];
for(let f=0;f<ci.length/3;f++){
 const ids=[ci[f*3],ci[f*3+1],ci[f*3+2]],ps=ids.map(i=>vec(cp,i)),old=ids.map(i=>vec(op,i)),n=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0])),area=len(n),oldArea=len(cross(sub(old[1],old[0]),sub(old[2],old[0])));
 if(oldArea<1e-13)crown.baselineDegeneracies++;
 if(area<1e-13){if(oldArea>=1e-13){if(ids.filter(i=>pole.has(i)).length>=2)crown.newIntendedPoleDegeneracies++;else crown.unexpectedDegeneracies++;}continue;}
 if(ids.every(i=>protect[i]))continue;
 const side=ids[0]<16070?-1:1,u=ids.reduce((a,i)=>a+uv.getX(i),0)/3,v=ids.reduce((a,i)=>a+uv.getY(i)/.73,0)/3,N=arr(flow.normal(side,u,v)),signed=dot(n,N)/area;
 crown.minTriangleDoubleArea=Math.min(crown.minTriangleDoubleArea,area);crown.minSignedFieldNormal=Math.min(crown.minSignedFieldNormal,signed);crown.minFrontFacingNormalZ=Math.min(crown.minFrontFacingNormalZ,n[2]/area);
 if(signed<=0)check(false,`Actual triangle opposes field ${f}`);changedTriangles.push({f,ids,ps,n:unit(n),area:area*.5});
}
check(crown.protectedPositionChanges===0&&crown.protectedNormalChanges===0,'Protected CROWN region changed');check(crown.changedMinimumY>.38,'Owned CROWN enters protected lower/ear region');check(crown.maximumPartXYChange===0&&crown.maximumPartDepthInset<=.0350001,'Part position bound failed');check(crown.newIntendedPoleDegeneracies===128&&crown.unexpectedDegeneracies===0,'Unexpected sheet degeneracy');check(crown.poleMaxDistance===0&&crown.poleMaxNormalDifference===0,'Unwelded pole');report.crown=crown;

// Reconstruct the actual original head grid and Float32 roundings, rather than
// judging clearance solely against the candidate's own envelope. All owned
// samples lie above Y=.38; lower-face50/58 and lip130/140 are identity there.
const face=new Function('THREE',read('src/face.js')+'\nreturn{profile,faceZ,portraitY,orbitalRadius};')(THREE),hp=new Float32Array(381*291*3),headTriangles=[];
for(let j=0;j<=290;j++)for(let i=0;i<=380;i++){
 const y=-1.18+j/290*2.72,a=-Math.PI+i/380*Math.PI*2,[w,,rear]=face.profile(y),x=w*Math.sin(a),z=Math.cos(a)>=0?face.faceZ(x,y):rear*Math.cos(a),at=(j*381+i)*3;hp[at]=x;hp[at+1]=y;hp[at+2]=z;
}
const hvec=i=>[hp[i*3],hp[i*3+1],hp[i*3+2]];
for(let j=0;j<290;j++)for(let i=0;i<380;i++){
 const a=j*381+i,b=a+381,midX=(hp[a*3]+hp[(a+1)*3]+hp[b*3]+hp[(b+1)*3])/4,midY=(hp[a*3+1]+hp[b*3+1])/2,midZ=hp[a*3+2],cutEye=midZ>0&&[-1,1].some(s=>face.orbitalRadius(midX,midY,s)<1.20);
 if(!cutEye&&face.portraitY(hp[b*3+1])>.35)headTriangles.push([a,a+1,b],[b,a+1,b+1]);
}
for(let i=0;i<hp.length;i+=3)hp[i+1]=face.portraitY(hp[i+1]);
function indexXY(triangles,nx=72,ny=72){
 const box={x0:-1.04,x1:1.04,y0:.34,y1:1.70},bins=Array.from({length:nx*ny},()=>[]),cell=(x,y)=>[Math.max(0,Math.min(nx-1,Math.floor((x-box.x0)/(box.x1-box.x0)*nx))),Math.max(0,Math.min(ny-1,Math.floor((y-box.y0)/(box.y1-box.y0)*ny)))];
 for(const tri of triangles){const x0=Math.min(...tri.ps.map(p=>p[0])),x1=Math.max(...tri.ps.map(p=>p[0])),y0=Math.min(...tri.ps.map(p=>p[1])),y1=Math.max(...tri.ps.map(p=>p[1])),a=cell(x0,y0),b=cell(x1,y1);if(x1<box.x0||x0>box.x1||y1<box.y0||y0>box.y1)continue;for(let y=a[1];y<=b[1];y++)for(let x=a[0];x<=b[0];x++)bins[y*nx+x].push(tri);}
 return(x,y)=>{if(x<box.x0||x>box.x1||y<box.y0||y>box.y1)return[];const q=cell(x,y),hits=[];for(const tri of bins[q[1]*nx+q[0]]){const[a,b,c]=tri.ps,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-14)continue;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-7)continue;hits.push({...tri,z:u*a[2]+v*b[2]+w*c[2],bary:[u,v,w]});}return hits;};
}
const headAt=indexXY(headTriangles.map(ids=>({ps:ids.map(hvec)}))),support={crown:{samples:0,hits:0,minimumGap:Infinity,maximumGap:-Infinity,penetrations:0},fringe:{samples:0,hits:0,minimumGap:Infinity,maximumGap:-Infinity,penetrations:0}};
function headCheck(p,kind,where){const r=support[kind];r.samples++;const hits=headAt(p[0],p[1]);if(!hits.length)return;r.hits++;const z=Math.max(...hits.map(h=>h.z)),gap=p[2]-z;if(gap<r.minimumGap){r.minimumGap=gap;r.worst=where;}r.maximumGap=Math.max(r.maximumGap,gap);if(gap<-.0005)r.penetrations++;}
for(let i=0;i<cp.count;i++)if(!protect[i])headCheck(vec(cp,i),'crown',{vertex:i});
for(const t of changedTriangles)for(const w of[[1/3,1/3,1/3],[.5,.5,0],[.5,0,.5],[0,.5,.5]])headCheck([0,1,2].map(k=>w.reduce((s,b,i)=>s+b*t.ps[i][k],0)),'crown',{face:t.f,bary:w});
const fp=on.children[3].geometry.attributes.position,fn=on.children[3].geometry.attributes.normal,fp0=off.children[3].geometry.attributes.position,fn0=off.children[3].geometry.attributes.normal,owned=new Uint8Array(fp.count),fringe={emittedStrands:0,protectedPositionChanges:0,protectedNormalChanges:0,upwardUpperSteps:0,maximumUpperRise:0,maximumRootFreeTangentAngle:0,maximumGeometricCurvatureJump:0,maximumChordTurnAtCut:0,baselineMaximumChordTurnAtCut:0};
for(const row of flow.metrics.fringeRows){for(let j=0;j<=20;j++)if(j/20<row.cut)for(let k=0;k<row.ring;k++)owned[row.first+j*row.ring+k]=1;fringe.emittedStrands++;}
for(let i=0;i<fp.count;i++)if(owned[i])headCheck(vec(fp,i),'fringe',{vertex:i});else{if(len(sub(vec(fp,i),vec(fp0,i))))fringe.protectedPositionChanges++;if(len(sub(vec(fn,i),vec(fn0,i))))fringe.protectedNormalChanges++;}
const tangent=(c,t,h=.000005)=>unit(sub(arr(c.getPoint(t+h)),arr(c.getPoint(t-h)))),angle=(a,b)=>Math.acos(Math.max(-1,Math.min(1,dot(unit(a),unit(b)))))*180/Math.PI;
function curvature(c,t){const h=.0001,a=arr(c.getPoint(t-h)),b=arr(c.getPoint(t)),d=arr(c.getPoint(t+h)),v=sub(d,a).map(x=>x/(2*h)),dd=add(sub(d,b),sub(a,b)).map(x=>x/(h*h));return len(cross(v,dd))/Math.pow(len(v),3);}
for(const path of on.__fringePaths146){const d=path.debug146;if(!d.emitted)continue;let old=path.getPoint(0);for(let j=1;j<=80;j++){const p=path.getPoint(d.cut*j/80),rise=p.y-old.y;if(rise>1e-6){fringe.upwardUpperSteps++;fringe.maximumUpperRise=Math.max(fringe.maximumUpperRise,rise);}old=p;}
 fringe.maximumRootFreeTangentAngle=Math.max(fringe.maximumRootFreeTangentAngle,angle(tangent(path,d.tBreak-.00002),tangent(path,d.tBreak+.00002)));
 fringe.maximumGeometricCurvatureJump=Math.max(fringe.maximumGeometricCurvatureJump,Math.abs(curvature(path,d.cut-.0003)-curvature(d.original,d.cut+.0003)));
 const j=Math.ceil(d.cut*20),center=(p,k)=>{let q=[0,0,0];for(let a=0;a<d.ring;a++)q=add(q,vec(p,d.first+k*d.ring+a),1/d.ring);return q;};
 if(j>0&&j<20){fringe.maximumChordTurnAtCut=Math.max(fringe.maximumChordTurnAtCut,angle(sub(center(fp,j),center(fp,j-1)),sub(center(fp,j+1),center(fp,j))));fringe.baselineMaximumChordTurnAtCut=Math.max(fringe.baselineMaximumChordTurnAtCut,angle(sub(center(fp0,j),center(fp0,j-1)),sub(center(fp0,j+1),center(fp0,j))));}
}
check(fringe.protectedPositionChanges===0&&fringe.protectedNormalChanges===0,'Accepted downstream fringe rows differ');check(fringe.upwardUpperSteps===0,'Upper fringe hook/rise');check(support.crown.penetrations===0&&support.fringe.penetrations===0,'New emitted geometry penetrates actual head samples');report.fringe={...fringe,joinType:'C1; curvature is measured, not claimed equal',maximumCutTangentAngle:flow.metrics.maximumCutTangentAngle,maximumAdjacentLowerNormalAngle:flow.metrics.maximumAdjacentLowerNormalAngle,shortEndCuts:flow.metrics.shortEndCuts};report.actualHeadSupport=support;

// Physical alpha-release travel and UV metrics: fixed samplers/alpha do not
// imply an unchanged footprint on the reauthored surface.
report.physicalFade=[];
for(const side of[-1,1])for(const u of[.78,.81,.865,.90,.935,.97,.985]){
 const arc=f=>{let sum=0,p=f(side,u,.875);for(let j=1;j<=32;j++){const q=f(side,u,.875+j*.125/32);sum+=len(sub(arr(q),arr(p)));p=q;}return sum;},oldArc=arc((s,u,v)=>on.__crown146(s,u,v,.002)),newArc=arc(flow.point);
 const at=v=>{const h=.00001,du=sub(arr(flow.point(side,u+h,v)),arr(flow.point(side,u-h,v))).map(x=>x/(2*h)),dv=sub(arr(flow.point(side,u,v+h)),arr(flow.point(side,u,v-h))).map(x=>x/(2*h));return{v,transverseMetric:len(du),growthMetric:len(dv),shearCos:dot(unit(du),unit(dv))};};
 report.physicalFade.push({side,u,oldPhysicalArc:oldArc,newPhysicalArc:newArc,ratio:newArc/oldArc,releaseStart:arr(flow.point(side,u,.875)),releaseEnd:arr(flow.point(side,u,1)),metrics:[at(.50),at(.90),at(.98)]});
}
// Centroid facing and actual triangle occlusion are separate. This limited
// geometry study tests the emitted head+CROWN surfaces only, not all scene
// fibers/materials or pixel visibility. UV alpha is sampled at base LOD.
const cy=Math.cos(.16),sy=Math.sin(.16),cz=Math.cos(-.17),sz=Math.sin(-.17),project=p=>[cy*cz*p[0]-cy*sz*p[1]+sy*p[2],sz*p[0]+cz*p[1],-sy*cz*p[0]+sy*sz*p[1]+cy*p[2]],viewZ=n=>-sy*cz*n[0]+sy*sz*n[1]+cy*n[2];
const projected=[];for(const ids of headTriangles){const ps=ids.map(i=>project(hvec(i)));if(cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]))[2]>0)projected.push({ps,kind:'head'});}
const color=on.children[0].geometry.attributes.color,map=on.children[0].material.map.image;
function alphaUV(u,v){const x=((u%1+1)%1)*map.width-.5,y=Math.max(0,Math.min(map.height-1,v*map.height-.5)),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,at=(i,j)=>map.data[(Math.max(0,Math.min(map.height-1,j))*map.width+(i%map.width+map.width)%map.width)*4+3]/255;return (at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy;}
function alpha(ids,b){const u=ids.reduce((s,i,k)=>s+uv.getX(i)*b[k],0),v=ids.reduce((s,i,k)=>s+uv.getY(i)*b[k],0),a=ids.reduce((s,i,k)=>s+color.array[i*4+3]*b[k],0);return a*alphaUV(u,v);}
for(let f=0;f<ci.length/3;f++){const ids=[ci[f*3],ci[f*3+1],ci[f*3+2]],ps=ids.map(i=>project(vec(cp,i)));if(cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]))[2]>1e-14)projected.push({ps,kind:'crown',f,ids});}
const occludeAt=indexXY(projected),visibility={changedNondegenerateTriangles:changedTriangles.length,cameraFacingTriangles:0,cameraFacingArea:0,sourceAlphaPassingCentroids:0,headOccludedCentroids:0,crownOccludedCentroids:0,unoccludedWithinTestedSurfaces:0,testedSurfaceCentroidAreas:{headOccluded:0,crownOccluded:0,unoccluded:0}};
for(const t of changedTriangles){if(viewZ(t.n)<=0)continue;visibility.cameraFacingTriangles++;visibility.cameraFacingArea+=t.area;const b=[1/3,1/3,1/3];if(alpha(t.ids,b)<.10)continue;visibility.sourceAlphaPassingCentroids++;const p=project(t.ps.reduce((s,p)=>add(s,p,1/3),[0,0,0])),hits=occludeAt(p[0],p[1]).filter(h=>h.z>p[2]+.00005&&(h.kind==='head'||h.f!==t.f&&alpha(h.ids,h.bary)>=.10)).sort((a,b)=>b.z-a.z);if(!hits.length){visibility.unoccludedWithinTestedSurfaces++;visibility.testedSurfaceCentroidAreas.unoccluded+=t.area;}else if(hits[0].kind==='head'){visibility.headOccludedCentroids++;visibility.testedSurfaceCentroidAreas.headOccluded+=t.area;}else{visibility.crownOccludedCentroids++;visibility.testedSurfaceCentroidAreas.crownOccluded+=t.area;}}
report.cameraFacingVsTestedOcclusion={...visibility,qualification:'Actual emitted triangle centroid rays against actual source head and CROWN only. Not pixel coverage, not all-scene occlusion; sparse/unrelated hair may cover additional area. Native output remains decisive.'};
report.metrics=on.userData.crownFlow146;report.cost={sourceBaselineMs:base.userData.constructionMs,sourceOffMs:off.userData.constructionMs,sourceOnMs:on.userData.constructionMs,elapsedMs:performance.now()-start,peakRssMiB:process.resourceUsage().maxRSS/1024,triangles:on.userData.triangles,geometryMiB:on.userData.geometryMiB};
report.limitations=['Coarse comparison hides only exact old owned crown/edge slots in both modes; it is not production coverage or quality acceptance.','Curve joins are C1 and protected emitted rows/normals are restored exactly; curvature is not identical.','Only actual vertices, triangle centroids/edge midpoints and sampled path segments are checked, not continuous global collisions.','The actual head support check is limited to the original upper head region where accepted later face deformations are identity.','Source field and map inputs pass independently of native100 atlas RGB; record the latter per mode.'];
report.pass=report.errors.length===0;fs.writeFileSync('review/crown146-coarse-source-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,coarseIsolation:{...report.coarseIsolation,detail:report.coarseIsolation.detail.length,wisps:report.coarseIsolation.wisps.length},physicalFade:undefined,metrics:undefined},null,2));process.exitCode=report.pass?0:1;
