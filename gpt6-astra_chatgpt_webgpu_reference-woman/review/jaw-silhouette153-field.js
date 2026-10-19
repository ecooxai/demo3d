// Original153 field on actual152 visible jaw controls. No image pixel reads.
export function createJawSilhouetteField153(config,mouthBox){
 const controls=config.controls,R=config.radiusPhotoPixels;
 if(controls.length!==11||!(R>0)||mouthBox.length!==4||mouthBox.some(x=>!Number.isFinite(x)))throw Error('Invalid153 field inputs.');
 const kernel=r=>r>=1?0:(1-r)**4*(4*r+1),matrix=controls.map(a=>controls.map(b=>kernel(Math.hypot(a.at[0]-b.at[0],a.at[1]-b.at[1])/R)));
 const m=matrix.map((row,i)=>[...row,controls[i].delta]);let minimumPivot=Infinity;
 for(let k=0;k<m.length;k++){
  let pivot=k;for(let i=k+1;i<m.length;i++)if(Math.abs(m[i][k])>Math.abs(m[pivot][k]))pivot=i;
  [m[k],m[pivot]]=[m[pivot],m[k]];const d=m[k][k];minimumPivot=Math.min(minimumPivot,Math.abs(d));if(Math.abs(d)<1e-9)throw Error('153 field matrix is singular.');
  for(let j=k;j<=m.length;j++)m[k][j]/=d;
  for(let i=0;i<m.length;i++)if(i!==k){const a=m[i][k];for(let j=k;j<=m.length;j++)m[i][j]-=a*m[k][j];}
 }
 const coefficients=m.map(row=>row.at(-1)),sumAbsoluteCoefficients=coefficients.reduce((s,x)=>s+Math.abs(x),0),margin=config.mouthShieldMarginPhotoPixels,L=config.mouthShieldFadePhotoPixels,Ly=config.mouthShieldLowerFadePhotoPixels,
  protectedBox=[mouthBox[0]-margin,mouthBox[1]+margin,mouthBox[2]-margin,mouthBox[3]+margin];
 const smooth=(v,lo,hi)=>{if(v<=lo)return[0,0];if(v>=hi)return[1,0];const t=(v-lo)/(hi-lo);return[t*t*t*(10+t*(-15+6*t)),30*t*t*(1-t)*(1-t)/(hi-lo)];};
 function photo(x,y){
  const [uw,udy]=smooth(y,...config.upperFadePhotoY),[low,lowD]=smooth(y,...config.lowerFadePhotoY),lw=1-low,ldy=-lowD;
  if(!uw||!lw)return{delta:0,gradient:[0,0],determinant:1,active:false};
  let wx=0,dwx=0;
  if(x<protectedBox[0]){const t=smooth(protectedBox[0]-x,0,L);wx=t[0];dwx=-t[1];}
  else if(x>protectedBox[1]){const t=smooth(x-protectedBox[1],0,L);wx=t[0];dwx=t[1];}
  const [wy,dwy]=smooth(y,protectedBox[3],protectedBox[3]+Ly),shield=wx+(1-wx)*wy,sx=dwx*(1-wy),sy=(1-wx)*dwy;
  if(shield===0&&sx===0&&sy===0)return{delta:0,gradient:[0,0],determinant:1,active:false};
  let raw=0,gx=0,gy=0;
  for(let i=0;i<controls.length;i++){const qx=x-controls[i].at[0],qy=y-controls[i].at[1],r=Math.hypot(qx,qy)/R;if(r>=1)continue;const c=coefficients[i],d=-20*(1-r)**3/(R*R);raw+=c*kernel(r);gx+=c*d*qx;gy+=c*d*qy;}
  const w=uw*lw*shield,dxw=uw*lw*sx,dyw=(udy*lw+uw*ldy)*shield+uw*lw*sy,d=w*raw,dx=w*gx+dxw*raw,dy=w*gy+dyw*raw;
  return{delta:d,gradient:[dx,dy],determinant:1+dx,active:d!==0||dx!==0||dy!==0};
 }
 const {a,b,worldOrigin,photoOrigin}=config.frame,den=a*a+b*b;
 const project=(x,y)=>[photoOrigin[0]+a*(x-worldOrigin[0])+b*(y-worldOrigin[1]),photoOrigin[1]+b*(x-worldOrigin[0])-a*(y-worldOrigin[1])];
 function world(x,y,z,strength=1){
  const p=project(x,y),f=photo(...p),d=f.delta*strength,gx=f.gradient[0]*strength,gy=f.gradient[1]*strength,
   u0=gx*a+gy*b,u1=gx*b-gy*a;
  return{delta:[a*d/den,b*d/den,0],jacobian:[1+a*u0/den,a*u1/den,0,b*u0/den,1+b*u1/den,0,0,0,1],determinant:1+gx,active:f.active,photo:p};
 }
 // Conservative spatial derivative bounds for the determinant. A dense grid
 // plus these margins can certify positivity between its samples.
 const raw0=sumAbsoluteCoefficients,raw1=2.109375/R*raw0,raw2=40/(R*R)*raw0,
  maxD1=1.875/L,maxD1Y=1.875/Ly,maxD2=(10/Math.sqrt(3))/(L*L),verticalD1=1.875/Math.min(config.upperFadePhotoY[1]-config.upperFadePhotoY[0],config.lowerFadePhotoY[1]-config.lowerFadePhotoY[0]);
 const determinantGradientBounds=[raw2+2*maxD1*raw1+maxD2*raw0,
  raw2+(verticalD1+maxD1+maxD1Y)*raw1+(verticalD1*maxD1+maxD1*maxD1Y)*raw0];
 return{world,photo,project,minimumPivot,coefficients,sumAbsoluteCoefficients,protectedBox,determinantGradientBounds,
  displacementGradientBounds:[raw1+maxD1*raw0,raw1+(verticalD1+maxD1Y)*raw0],
  supportBounds:[Math.min(...controls.map(x=>x.at[0]))-R,Math.max(...controls.map(x=>x.at[0]))+R,Math.max(config.upperFadePhotoY[0],Math.min(...controls.map(x=>x.at[1]))-R),Math.min(config.lowerFadePhotoY[1],Math.max(...controls.map(x=>x.at[1]))+R)]};
}
