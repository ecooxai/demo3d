// Original155 broad contour field. It does not interpolate the rejected153
// control deltas. The current lip box is protected by the same C2 shield.
export function createJawSilhouetteField155(config,mouthBox){
 const {contractionGain:g,centerPhotoX:C,outerLeftFadePhotoX:XL,outerRightFadePhotoX:XR,upperFadePhotoY:YU,lowerFadePhotoY:YL}=config,
  margin=config.mouthShieldMarginPhotoPixels,L=config.mouthShieldFadePhotoPixels,Ly=config.mouthShieldLowerFadePhotoPixels,
  protectedBox=[mouthBox[0]-margin,mouthBox[1]+margin,mouthBox[2]-margin,mouthBox[3]+margin];
 if(!(g>0&&g<.2)||mouthBox.length!==4||mouthBox.some(v=>!Number.isFinite(v))||!(XL[0]<XL[1]&&XL[1]<XR[0]&&XR[0]<XR[1])||!(YU[0]<YU[1]&&YU[1]<=YL[0]&&YL[0]<YL[1])||!(L>0&&Ly>0))throw Error('155 invalid broad contour configuration.');
 if(!(C>protectedBox[0]&&C<protectedBox[1]&&XL[1]<protectedBox[0]-L&&XR[0]>protectedBox[1]+L))throw Error('155 requires separated outer and mouth transitions around its center.');
 const smooth=(v,lo,hi)=>{if(v<=lo)return[0,0];if(v>=hi)return[1,0];const t=(v-lo)/(hi-lo);return[t*t*t*(10+t*(-15+6*t)),30*t*t*(1-t)*(1-t)/(hi-lo)];};
 const inactive=()=>({delta:0,gradient:[0,0],determinant:1,active:false});
 function photo(x,y){
  if(x<=XL[0]||x>=XR[1]||y<=YU[0]||y>=YL[1])return inactive();
  const [xu,xud]=smooth(x,...XL),[xd,xdd]=smooth(x,...XR),X=xu*(1-xd),Dx=xud*(1-xd)-xu*xdd,
   [yu,yud]=smooth(y,...YU),[yd,ydd]=smooth(y,...YL),Y=yu*(1-yd),Dy=yud*(1-yd)-yu*ydd;
  let wx=0,dwx=0;
  if(x<protectedBox[0]){const q=smooth(protectedBox[0]-x,0,L);wx=q[0];dwx=-q[1];}
  else if(x>protectedBox[1]){const q=smooth(x-protectedBox[1],0,L);wx=q[0];dwx=q[1];}
  const [wy,dwy]=smooth(y,protectedBox[3],protectedBox[3]+Ly),S=wx+(1-wx)*wy,Sx=dwx*(1-wy),Sy=(1-wx)*dwy;
  if(S===0&&Sx===0&&Sy===0)return inactive();
  const linear=C-x,delta=g*Y*X*S*linear,
   dx=g*Y*((Dx*S+X*Sx)*linear-X*S),dy=g*X*(Dy*S+Y*Sy)*linear;
  return{delta,gradient:[dx,dy],determinant:1+dx,active:delta!==0||dx!==0||dy!==0};
 }
 const {a,b,worldOrigin,photoOrigin}=config.frame,den=a*a+b*b;
 const project=(x,y)=>[photoOrigin[0]+a*(x-worldOrigin[0])+b*(y-worldOrigin[1]),photoOrigin[1]+b*(x-worldOrigin[0])-a*(y-worldOrigin[1])];
 function world(x,y,z,strength=1){
  const p=project(x,y),f=photo(...p),d=f.delta*strength,gx=f.gradient[0]*strength,gy=f.gradient[1]*strength,
   u0=gx*a+gy*b,u1=gx*b-gy*a;
  return{delta:[a*d/den,b*d/den,0],jacobian:[1+a*u0/den,a*u1/den,0,b*u0/den,1+b*u1/den,0,0,0,1],determinant:1+gx,active:f.active,photo:p};
 }
 // Bounds for d_xx and d_xy on the full compact support. The two outer
 // X transitions are disjoint, as are the two Y transitions. These are loose
 // product-rule bounds; the native certificate supplies measured grid extrema.
 const Q=Math.max(Math.abs(C-XL[0]),Math.abs(C-XR[1])),X1=1.875/Math.min(XL[1]-XL[0],XR[1]-XR[0]),
  X2=(10/Math.sqrt(3))/Math.min((XL[1]-XL[0])**2,(XR[1]-XR[0])**2),Y1=1.875/Math.min(YU[1]-YU[0],YL[1]-YL[0]),
  S1=1.875/L,S2=(10/Math.sqrt(3))/(L*L),SY1=1.875/Ly,
  W1=X1+S1,W2=X2+2*X1*S1+S2,WXY=(X1+S1)*SY1;
 const determinantGradientBounds=[g*(W2*Q+2*W1),g*(Y1*(W1*Q+1)+WXY*Q+SY1)],
  displacementGradientBounds=[g*(W1*Q+1),g*(Y1+SY1)*Q];
 // On the outer transitions X'*(C-x) is nonnegative. The mouth transitions
 // are separated and have the only negative extra X-derivative. This provides
 // an independent conservative global lower bound, not a fitted matrix pivot.
 const shieldQ=Math.max(Math.abs(C-(protectedBox[0]-L)),Math.abs(C-(protectedBox[1]+L))),analyticMinimumDeterminant=1-g*(1+shieldQ*S1);
 return{world,photo,project,protectedBox,kind:config.fieldKind,analyticMinimumDeterminant,determinantGradientBounds,displacementGradientBounds,
  supportBounds:[XL[0],XR[1],YU[0],YL[1]]};
}
