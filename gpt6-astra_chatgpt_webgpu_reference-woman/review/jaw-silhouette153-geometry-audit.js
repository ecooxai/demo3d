import config from './jaw-silhouette153-config.json' with {type:'json'};

// Focused native QA only; no production renderer or per-frame work.
export function certifyJawField153(field){
 const started=performance.now(),bounds=field.supportBounds,step=.25,nx=Math.ceil((bounds[1]-bounds[0])/step),ny=Math.ceil((bounds[3]-bounds[2])/step);
 let minimum=Infinity,maximum=-Infinity,maximumDisplacement=0,where=null;
 for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
  const x=Math.min(bounds[1],bounds[0]+i*step),y=Math.min(bounds[3],bounds[2]+j*step),s=field.photo(x,y);
  if(s.determinant<minimum){minimum=s.determinant;where=[x,y];}maximum=Math.max(maximum,s.determinant);maximumDisplacement=Math.max(maximumDisplacement,Math.abs(s.delta));
 }
 const determinantGridMargin=step/2*field.determinantGradientBounds.reduce((s,x)=>s+x,0),displacementGridMargin=step/2*field.displacementGradientBounds.reduce((s,x)=>s+x,0),
  certifiedMinimum=minimum-determinantGridMargin,maximumWorldDisplacementUpper=(maximumDisplacement+displacementGridMargin)/Math.hypot(config.frame.a,config.frame.b);
 if(!(certifiedMinimum>.02)||!(maximumWorldDisplacementUpper<.10))throw Error('153 field positivity/displacement certificate failed.');
 return{gridStepPhotoPixels:step,samples:(nx+1)*(ny+1),bounds,protectedMouthBox:field.protectedBox,minimumSampledDeterminant:minimum,maximumSampledDeterminant:maximum,minimumLocation:where,
  determinantGradientBounds:field.determinantGradientBounds,determinantGridMargin,certifiedMinimumDeterminant:certifiedMinimum,maximumSampledPhotoDisplacement:maximumDisplacement,
  displacementGridMargin,maximumWorldDisplacementUpper,minimumPivot:field.minimumPivot,elapsedMs:performance.now()-started,
  interpretation:'The unchanged photo Y/world Z and a positive horizontal derivative make each complete X line monotone. The compact field is identity outside its support. This certifies the continuous map; emitted triangles and discrete interfaces remain separate checks.'};
}

export function inspectJawGeometry153(records,field){
 const started=performance.now(),orientation=[],contours=[];
 for(const row of records){
  const g0=row.geometry,g1=row.mesh.geometry,p0=g0.attributes.position,p1=g1.attributes.position,index=g0.index,m=row.mesh.matrixWorld.elements,
   a=new Float64Array(p0.count*3),b=new Float64Array(p0.count*3),changed=new Uint8Array(p0.count);
  let changedVertices=0,maxWorldZRoundoff=0,maxPhotoYRoundoff=0;
  for(let i=0;i<p0.count;i++){
   const x=p0.getX(i),y=p0.getY(i),z=p0.getZ(i),xx=p1.getX(i),yy=p1.getY(i),zz=p1.getZ(i),o=i*3;
   for(let k=0;k<3;k++){a[o+k]=m[k]*x+m[k+4]*y+m[k+8]*z+m[k+12];b[o+k]=m[k]*xx+m[k+4]*yy+m[k+8]*zz+m[k+12];}
   if(x!==xx||y!==yy||z!==zz){changed[i]=1;changedVertices++;maxWorldZRoundoff=Math.max(maxWorldZRoundoff,Math.abs(b[o+2]-a[o+2]));const q0=field.project(a[o],a[o+1]),q1=field.project(b[o],b[o+1]);maxPhotoYRoundoff=Math.max(maxPhotoYRoundoff,Math.abs(q1[1]-q0[1]));}
  }
  const out={mesh:row.mesh.name,vertices:p0.count,triangles:index.count/3,changedVertices,changedTriangles:0,inheritedDegenerate:0,newDegenerate:0,reversedToOriginal:0,opposedToTransportedGeometry:0,minimumAreaRatio:Infinity,minimumOriginalNormalCosine:1,minimumTransportedNormalCosine:1,maxWorldZRoundoff,maxPhotoYRoundoff};
  for(let t=0;t<index.count;t+=3){
   const ia=index.getX(t),ib=index.getX(t+1),ic=index.getX(t+2);if(!changed[ia]&&!changed[ib]&&!changed[ic])continue;out.changedTriangles++;
   const i=ia*3,j=ib*3,k=ic*3,ux=a[j]-a[i],uy=a[j+1]-a[i+1],uz=a[j+2]-a[i+2],vx=a[k]-a[i],vy=a[k+1]-a[i+1],vz=a[k+2]-a[i+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,
    Ux=b[j]-b[i],Uy=b[j+1]-b[i+1],Uz=b[j+2]-b[i+2],Vx=b[k]-b[i],Vy=b[k+1]-b[i+1],Vz=b[k+2]-b[i+2],Nx=Uy*Vz-Uz*Vy,Ny=Uz*Vx-Ux*Vz,Nz=Ux*Vy-Uy*Vx,l0=Math.hypot(nx,ny,nz),l1=Math.hypot(Nx,Ny,Nz);
   if(l0<1e-14){out.inheritedDegenerate++;continue;}if(l1<1e-14){out.newDegenerate++;continue;}
   const cosine=(nx*Nx+ny*Ny+nz*Nz)/(l0*l1);out.minimumOriginalNormalCosine=Math.min(out.minimumOriginalNormalCosine,cosine);out.minimumAreaRatio=Math.min(out.minimumAreaRatio,l1/l0);if(cosine<=0)out.reversedToOriginal++;
   const f=field.world((a[i]+a[j]+a[k])/3,(a[i+1]+a[j+1]+a[k+1])/3,(a[i+2]+a[j+2]+a[k+2])/3),J=f.jacobian,det=f.determinant,
    ex=(J[4]*nx-J[3]*ny)/det,ey=(-J[1]*nx+J[0]*ny)/det,ez=nz,le=Math.hypot(ex,ey,ez),c=(ex*Nx+ey*Ny+ez*Nz)/(le*l1);
   out.minimumTransportedNormalCosine=Math.min(out.minimumTransportedNormalCosine,c);if(c<=0)out.opposedToTransportedGeometry++;
  }
  if(!Number.isFinite(out.minimumAreaRatio))out.minimumAreaRatio=null;
  orientation.push(out);
  if(row.mesh.name==='continuous-face'){
   const pa=new Float64Array(p0.count*2),pb=new Float64Array(p0.count*2);for(let i=0;i<p0.count;i++){pa.set(field.project(a[i*3],a[i*3+1]),i*2);pb.set(field.project(b[i*3],b[i*3+1]),i*2);}
   for(const y of [...new Set(config.controls.map(c=>c.at[1]))]){
    const ranges=[];for(const p of[pa,pb]){let left=Infinity,right=-Infinity;
     for(let t=0;t<index.count;t+=3){const ids=[index.getX(t),index.getX(t+1),index.getX(t+2)],ys=ids.map(j=>p[j*2+1]);if(y<Math.min(...ys)||y>Math.max(...ys))continue;for(let k=0;k<3;k++){const i=ids[k]*2,j=ids[(k+1)%3]*2,dy=p[j+1]-p[i+1];if(Math.abs(dy)<1e-12)continue;const f=(y-p[i+1])/dy;if(f<0||f>1)continue;const x=p[i]*(1-f)+p[j]*f;left=Math.min(left,x);right=Math.max(right,x);}}
     ranges.push(Number.isFinite(left)?[left,right]:null);
    }
    const controls=config.controls.filter(c=>c.at[1]===y);contours.push({y,before:ranges[0],after:ranges[1],sourceVisibleSides:controls.map(c=>({side:c.label.split(' ')[0],manualX:c.manualX,rawDesignDelta:c.delta,analyticMaskedDelta:field.photo(...c.at).delta}))});
   }
  }
 }
 return{orientation,contours,elapsedMs:performance.now()-started,interpretation:'Actual indexed triangle areas and world geometric normals are compared separately from the continuous map certificate. Contours are the full projected head mesh;152 source-visible side probes define the fitting controls. Native views still judge the visible neck junction and hair relationship.'};
}
