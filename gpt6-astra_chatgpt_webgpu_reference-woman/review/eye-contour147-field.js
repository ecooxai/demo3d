// A compact C2 field derived only from the accepted manual image1 controls.
// This source-only field does not alter a scene or read image pixels.
export function createEyeContourField147(config){
  const controls=config.controls,R=config.radiusPhotoPixels;
  if(!(R>0)||controls.length!==12)throw new Error('Unexpected147 controls.');
  const kernel=r=>r>=1?0:(1-r)**4*(4*r+1);
  const matrix=controls.map(a=>controls.map(b=>kernel(Math.hypot(a.at[0]-b.at[0],a.at[1]-b.at[1])/R)));
  function solve(values){
    const m=matrix.map((row,i)=>[...row,values[i]]),n=m.length;let minimumPivot=Infinity;
    for(let k=0;k<n;k++){
      let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(m[i][k])>Math.abs(m[pivot][k]))pivot=i;
      [m[k],m[pivot]]=[m[pivot],m[k]];const d=m[k][k];minimumPivot=Math.min(minimumPivot,Math.abs(d));
      if(Math.abs(d)<1e-10)throw new Error('Ill-conditioned147 field.');
      for(let j=k;j<=n;j++)m[k][j]/=d;
      for(let i=0;i<n;i++)if(i!==k){const f=m[i][k];for(let j=k;j<=n;j++)m[i][j]-=f*m[k][j];}
    }
    return{values:m.map(row=>row[n]),minimumPivot};
  }
  const sx=solve(controls.map(c=>c.delta[0])),sy=solve(controls.map(c=>c.delta[1])),cx=sx.values,cy=sy.values;
  function rawPhoto(x,y){
    let dx=0,dy=0,dxx=0,dxy=0,dyx=0,dyy=0;
    for(let i=0;i<controls.length;i++){
      const qx=x-controls[i].at[0],qy=y-controls[i].at[1],r=Math.hypot(qx,qy)/R;
      if(r>=1)continue;
      const f=kernel(r),d=-20*(1-r)**3/(R*R),gx=d*qx,gy=d*qy;
      dx+=cx[i]*f;dy+=cy[i]*f;dxx+=cx[i]*gx;dxy+=cx[i]*gy;dyx+=cy[i]*gx;dyy+=cy[i]*gy;
    }
    return{delta:[dx,dy],gradient:[dxx,dxy,dyx,dyy],determinant:(1+dxx)*(1+dyy)-dxy*dyx};
  }
  function photo(x,y){
    const [lo,hi]=config.lowerFadePhotoY;
    if(y>=hi)return{delta:[0,0],gradient:[0,0,0,0],determinant:1};
    const f=rawPhoto(x,y);if(y<=lo)return f;
    const t=(y-lo)/(hi-lo),w=1-t*t*t*(10+t*(-15+6*t)),dw=-30*t*t*(1-t)*(1-t)/(hi-lo),[dx,dy]=f.delta,[a,b,c,d]=f.gradient;
    const g=[w*a,w*b+dw*dx,w*c,w*d+dw*dy];
    return{delta:[w*dx,w*dy],gradient:g,determinant:(1+g[0])*(1+g[3])-g[1]*g[2]};
  }
  function depth(z){
    const [lo,hi]=config.depthGateWorldZ;
    if(z<=lo)return[0,0];if(z>=hi)return[1,0];
    const t=(z-lo)/(hi-lo);return[t*t*t*(10+t*(-15+6*t)),30*t*t*(1-t)*(1-t)/(hi-lo)];
  }
  const {a,b,worldOrigin,photoOrigin}=config.frame,den=a*a+b*b;
  function world(x,y,z,strength=1){
    const [w,dw]=depth(z);if(w===0)return{delta:[0,0,0],jacobian:[1,0,0,0,1,0,0,0,1],determinant:1,active:false};
    const px=photoOrigin[0]+a*(x-worldOrigin[0])+b*(y-worldOrigin[1]),py=photoOrigin[1]+b*(x-worldOrigin[0])-a*(y-worldOrigin[1]);
    const f=photo(px,py),[dx,dy]=f.delta,[g00,g01,g10,g11]=f.gradient;
    const vx=(a*dx+b*dy)/den,vy=(b*dx-a*dy)/den;
    // A^-1 gradient A, with A=[a,b;b,-a], is the common world XY derivative.
    const u00=g00*a+g01*b,u01=g00*b-g01*a,u10=g10*a+g11*b,u11=g10*b-g11*a;
    const m00=(a*u00+b*u10)/den,m01=(a*u01+b*u11)/den,m10=(b*u00-a*u10)/den,m11=(b*u01-a*u11)/den;
    const j=[1+strength*w*m00,strength*w*m01,strength*dw*vx,strength*w*m10,1+strength*w*m11,strength*dw*vy,0,0,1];
    return{delta:[strength*w*vx,strength*w*vy,0],jacobian:j,determinant:j[0]*j[4]-j[1]*j[3],active:dx!==0||dy!==0||f.gradient.some(v=>v!==0),photo:[px,py]};
  }
  return{photo,rawPhoto,world,depth,coefficients:{x:cx,y:cy},minimumPivot:Math.min(sx.minimumPivot,sy.minimumPivot),
    // Global Hessian entry bound for each displacement component. Used to
    // qualify dense sampled Jacobians; a source grid alone is not a proof.
    hessianEntryBounds:[cx,cy].map(c=>40/(R*R)*c.reduce((s,v)=>s+Math.abs(v),0))};
}
