import * as THREE from 'three';
import referenceURL from '../reference/image1-color.jpg';

// Every correspondence below is placed by visual inspection of the user's sole
// reference. This is a skin-color bake onto sculpted geometry, never a picture plane.
const landmarks = [
  [-.342,.050,448,432],[.342,.050,627,463],
  [-.527,.0637,397,424],[-.157,.0363,493,453],
  [.157,.0363,592,473],[.527,.0637,675,476],
  [-.342,.1342,448,414],[-.342,-.0113,449,451],
  [.342,.1342,630,444],[.342,-.0113,627,484],
  [0,-.475,534,579],[0,-.20,548,507],
  [-.113,-.537,504,583],[.113,-.537,558,591],
  [0,-.7875801,509,654],[-.241,-.7887897,445,642],[.241,-.7831514,568,662],
  [0,-.7310371,518,638],[0,-.8632664,508,680],
  [0,-1.18,507,750],[-.39,-1.01,407,710],[.39,-1.01,595,721],
  [-.60,-.79,356,636],[.60,-.79,650,656],
  [-.735,-.39,322,545],[.735,-.39,687,557],
  [-.76,.14,331,384],[.76,.14,701,429],
  [-.37,.22,445,385],[.37,.22,648,416],
  [0,.72,566,286],[-.58,.67,382,270],[.58,.67,698,311],
  [0,1.12,582,178],[0,1.54,580,20],
];

const smooth = t => { t = Math.max(0,Math.min(1,t)); return t*t*(3-2*t); };
const radial = r2 => r2 < 1e-14 ? 0 : r2 * Math.log(r2);

function solve(matrix,values) {
  const a = matrix.map((row,i)=>[...row,values[i]]), n=a.length;
  for(let k=0;k<n;k++) {
    let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(a[i][k])>Math.abs(a[pivot][k]))pivot=i;
    [a[k],a[pivot]]=[a[pivot],a[k]];
    const d=a[k][k]; if(Math.abs(d)<1e-12)throw new Error('Reference landmarks are singular');
    for(let j=k;j<=n;j++)a[k][j]/=d;
    for(let i=0;i<n;i++)if(i!==k){const factor=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=factor*a[k][j];}
  }
  return a.map(row=>row[n]);
}

function makeMapping() {
  const n=landmarks.length, matrix=Array.from({length:n+3},()=>Array(n+3).fill(0));
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++)matrix[i][j]=radial((landmarks[i][0]-landmarks[j][0])**2+(landmarks[i][1]-landmarks[j][1])**2)+(i===j?.00003:0);
    matrix[i][n]=matrix[n][i]=1;
    matrix[i][n+1]=matrix[n+1][i]=landmarks[i][0];
    matrix[i][n+2]=matrix[n+2][i]=landmarks[i][1];
  }
  const px=solve(matrix,[...landmarks.map(p=>p[2]),0,0,0]),py=solve(matrix,[...landmarks.map(p=>p[3]),0,0,0]);
  return (x,y)=>{
    let u=px[n]+px[n+1]*x+px[n+2]*y,v=py[n]+py[n+1]*x+py[n+2]*y;
    for(let i=0;i<n;i++){const r=radial((x-landmarks[i][0])**2+(y-landmarks[i][1])**2);u+=px[i]*r;v+=py[i]*r;}
    return [u,v];
  };
}

const faceWidth=[[-1.18,.035],[-1.08,.26],[-.91,.48],[-.65,.64],[-.35,.71],[0,.735],[.3,.72],[.55,.68],[.78,.55],[1.04,.15],[1.12,0]];
const widthSlopes=faceWidth.map((p,i)=>{
  if(i===0)return(faceWidth[1][1]-p[1])/(faceWidth[1][0]-p[0]);
  if(i===faceWidth.length-1)return(p[1]-faceWidth[i-1][1])/(p[0]-faceWidth[i-1][0]);
  const a=faceWidth[i-1],b=faceWidth[i+1],h0=p[0]-a[0],h1=b[0]-p[0],d0=(p[1]-a[1])/h0,d1=(b[1]-p[1])/h1;
  return d0*d1<=0?0:(3*(h0+h1))/((2*h1+h0)/d0+(h1+2*h0)/d1);
});
function widthAt(y){
  if(y<faceWidth[0][0]||y>faceWidth.at(-1)[0])return 0;
  let i=0;while(i<faceWidth.length-2&&y>faceWidth[i+1][0])i++;
  const a=faceWidth[i],b=faceWidth[i+1],h=b[0]-a[0],t=(y-a[0])/h;
  return(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*h*widthSlopes[i]+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*h*widthSlopes[i+1];
}
function photoWeight(x,y){
  return smooth((widthAt(y)-Math.abs(x))/.11);
}

// Hand-observed, skin-only bounds of the lower face in image 1. The TPS remains
// unchanged: these bounds only reject samples that cross from jaw skin to hair.
// In particular, the old (595,721) outer-jaw correspondence is outside the skin.
const jawSkinRows=[
  [625,356,654],[650,370,639],[675,387,623],[700,414,593],
  [720,449,568],[738,479,541],[750,502,515],[756,508,508]
];
function jawSampleConfidence(u,v){
  if(v<jawSkinRows[0][0])return 1;
  if(v>jawSkinRows.at(-1)[0])return 0;
  let i=0;while(i<jawSkinRows.length-2&&v>jawSkinRows[i+1][0])i++;
  const a=jawSkinRows[i],b=jawSkinRows[i+1],t=(v-a[0])/(b[0]-a[0]);
  const left=a[1]*(1-t)+b[1]*t,right=a[2]*(1-t)+b[2]*t;
  // Candidate 40: the photographed right-jaw edge also contains a soft brown
  // hair/contact-shadow fringe inside its darkest pixels. Reject that narrow
  // inner fringe with a wider blend, instead of mapping it as a crease across
  // the sculpted jaw. The left edge and upper-face sampling remain identical.
  const lowerRight=smooth((v-672)/28);
  const rightInset=14*lowerRight,rightFeather=12+10*lowerRight;
  return Math.min(smooth((u-left+2)/12),smooth((right-u+2-rightInset)/rightFeather));
}

// Candidate 43: the two remaining brown patches are inside valid photo bounds,
// not failures of the jaw silhouette mask. These compact supports address the
// broad photographic shading only; correspondences and photo weights stay put.
function localAlbedoWeights(x,y){
  const ellipse=(cx,cy,rx,ry)=>1-smooth((Math.hypot((x-cx)/rx,(y-cy)/ry)-.30)/.70);
  const innerCheek=.97*ellipse(.422,-.815,.158,.145);
  // Native quarter-view material isolation located a second photographed
  // cheek shadow outside the earlier support. Soften its broad tone only.
  const outerCheek=.60*ellipse(.588,-.700,.142,.215);
  const cheek=1-(1-innerCheek)*(1-outerCheek);
  const chin=.96*ellipse(-.012,-1.085,.230,.130)*smooth((y+1.176)/.048);
  return [cheek,chin];
}

// Canonical atlas-space eye contour. These are the two Hermite segments used
// by the accepted portrait warp around the eye, before any posed deformation.
function canonicalEyeY(y){
  const lower=y<=.25,h=lower?.51:.42,t=lower?(y+.26)/h:(y-.25)/h;
  const a=lower?-.475:.050,b=lower?.050:.505;
  const m0=lower?.84/.889:.98/.93,m1=lower?.98/.93:1.01/.87;
  return (2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*h*m0
    +(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*h*m1;
}
function sourceShadowWeights(x,y){
  // The photographed far-side socket is stretched beyond its canthus by the
  // TPS. Soften that diagonal wedge without moving any correspondence.
  const dx=x-.575,dy=y+.035;
  const q=Math.hypot((.55*dx+.835*dy)/.220,(.835*dx-.55*dy)/.140);
  let socket=1-smooth((q-.30)/.70);
  if(socket>0){
    // Enclose the complete authored eyelid ring (1.42 aperture radii), plus
    // waterline/lash margins. Inside it the source pixels remain exact.
    const w=.185*1.42,t=Math.max(-1,Math.min(1,(x-.342)/w)),h=1-t*t;
    const low=canonicalEyeY(.25+1.42*(-.058*h+.013*t));
    const high=canonicalEyeY(.25+1.42*(.080*h+.013*t));
    const distance=Math.max(Math.abs(x-.342)-w-.008,low-y-.012,y-high-.028);
    socket*=smooth(distance/.030);
  }
  const noseQ=Math.hypot((x-.115)/.088,(y+.315)/.225);
  const tipGuard=smooth((Math.hypot(x/.20,(y+.545)/.080)-1)/.45);
  const nose=(1-smooth((noseQ-.25)/.75))*smooth((x-.038)/.035)*tipGuard;
  return [socket,nose];
}

function makeSkinAtlas(source) {
  const c=document.createElement('canvas');c.width=source.naturalWidth;c.height=source.naturalHeight;
  const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(source,0,0);
  const pixels=cx.getImageData(0,0,c.width,c.height).data;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;
  const context=canvas.getContext('2d'),out=context.createImageData(canvas.width,canvas.height),mapping=makeMapping();
  const base=[232,191,174];
  const sampleSource=(u,v)=>{
    const ix=Math.max(0,Math.min(c.width-2,Math.floor(u))),iy=Math.max(0,Math.min(c.height-2,Math.floor(v))),fx=Math.max(0,Math.min(1,u-ix)),fy=Math.max(0,Math.min(1,v-iy)),p=(iy*c.width+ix)*4;
    return [0,1,2].map(ch=>(pixels[p+ch]*(1-fx)+pixels[p+4+ch]*fx)*(1-fy)+(pixels[p+c.width*4+ch]*(1-fx)+pixels[p+c.width*4+4+ch]*fx)*fy);
  };
  const foreheadColor=[0,0,0];
  for(let yy=343;yy<367;yy++)for(let xx=612;xx<634;xx++)for(let ch=0;ch<3;ch++)foreheadColor[ch]+=pixels[(yy*c.width+xx)*4+ch]/528;
  // Average small, manually chosen two-dimensional skin patches. Repeating a
  // single source sample along each output row produced horizontal cheek bands.
  // Smooth interpolation between these clean patch colors preserves broad tone
  // without extending photographic pores or stray hairs into long scan lines.
  const patch=(u,v,rx=9,ry=9)=>{
    const color=[0,0,0];let weight=0;
    for(let yy=-ry;yy<=ry;yy++)for(let xx=-rx;xx<=rx;xx++){
      const q=(xx/rx)**2+(yy/ry)**2;if(q>1)continue;
      const a=Math.exp(-2.5*q),rgb=sampleSource(u+xx,v+yy);weight+=a;
      for(let ch=0;ch<3;ch++)color[ch]+=rgb[ch]*a;
    }
    return color.map(v=>v/weight);
  };
  const lowerChin=patch(507,736,7,5);
  const toneRows=[
    [-1.25,lowerChin,lowerChin],
    [-1.07,patch(480,719,9,6),patch(537,724,9,6)],
    [-.92,patch(448,688,9,8),patch(573,688,9,8)],
    [-.69,patch(401,632),patch(609,631,8,9)],
    [-.44,patch(380,571,9,10),patch(633,568,9,10)],
    [-.23,patch(377,510,8,9),patch(642,526,8,9)],
    [.30,foreheadColor,foreheadColor],
    [1.60,foreheadColor,foreheadColor]
  ];
  const toneAt=(y,side)=>{
    let i=0;while(i<toneRows.length-2&&y>toneRows[i+1][0])i++;
    const a=toneRows[i],b=toneRows[i+1],t=smooth((y-a[0])/(b[0]-a[0]));
    return a[side+1].map((v,ch)=>v*(1-t)+b[side+1][ch]*t);
  };
  const edgeTints=Array.from({length:canvas.height},(_,j)=>{
    const y=1.6-j/(canvas.height-1)*2.85;return [toneAt(y,0),toneAt(y,1)];
  });
  const cleanLateral=(x,y,tints)=>{
    const side=smooth((x+.12)/.24),edge=tints[0].map((v,ch)=>v*(1-side)+tints[1][ch]*side);
    const amount=.72*smooth((.92-Math.abs(x))/.20)*smooth((y+1.21)/.12)*(1-smooth((y-.12)/.16));
    const upper=smooth((y-.02)/.28);
    return base.map((v,ch)=>(v*(1-amount)+edge[ch]*amount)*(1-upper)+(foreheadColor[ch]+(ch===0?-6:-9)*x)*upper);
  };
  // A small, smooth low-frequency field separates source pores from the baked
  // jaw/chin shadow. It is sampled only inside the two local supports above.
  // No new imagery is introduced: detail and replacement tones all come from
  // manually selected skin in image 1. The hidden-side color field is unchanged.
  const sourceToneField=(x0,y0,w,h)=>{
    const step=8,values=new Float32Array(w*h*3);
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){
      const rgb=patch(x0+i*step,y0+j*step,12,12),k=(j*w+i)*3;
      for(let ch=0;ch<3;ch++)values[k+ch]=rgb[ch];
    }
    return (u,v)=>{
      const sx=Math.max(0,Math.min(w-1,(u-x0)/step)),sy=Math.max(0,Math.min(h-1,(v-y0)/step));
      const i=Math.min(w-2,Math.floor(sx)),j=Math.min(h-2,Math.floor(sy));
      const fx=sx-i,fy=sy-j,k=(j*w+i)*3;
      return [0,1,2].map(ch=>(values[k+ch]*(1-fx)+values[k+3+ch]*fx)*(1-fy)
        +(values[k+w*3+ch]*(1-fx)+values[k+w*3+3+ch]*fx)*fy);
    };
  };
  const lowSource=sourceToneField(448,616,29,19);
  const chinTone=patch(499,719,11,9);
  // Candidate 49 uses brightness-only offsets, bounded well below full
  // de-lighting. Same-side clean skin guides the lift; the original broad
  // shadow, chromatic differences, and fine photograph details still remain.
  const orbitalSource=sourceToneField(552,424,22,23);
  const luminance=rgb=>.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
  const socketTone=luminance(patch(647,535,10,10));
  const noseTone=luminance(patch(599,550,12,13));
  for(let j=0;j<canvas.height;j++)for(let i=0;i<canvas.width;i++) {
    const x=i/(canvas.width-1)*2-1,y=1.6-j/(canvas.height-1)*2.85,a=photoWeight(x,y),k=(j*canvas.width+i)*4;
    const lateral=cleanLateral(x,y,edgeTints[j]);
    const sourceUV=a>0?mapping(x,y):null;
    const rgb=sourceUV?sampleSource(...sourceUV):lateral;
    // The centerline and lip region retain their original correspondences.
    // Only outer lower-jaw samples can be replaced by clean, source-derived tone.
    const jawRegion=smooth((-y-.74)/.09)*smooth((Math.abs(x)-.085)/.075);
    const safePhoto=a*(1-jawRegion*(1-(sourceUV?jawSampleConfidence(...sourceUV):1)));
    const templeBand=smooth((y+.53)/.12)*(1-smooth((y-.20)/.15));
    const templeClean=templeBand*(x<0?smooth((-x-.575)/.095):smooth((x-.65)/.08));
    const skinRGB=rgb.map((v,ch)=>v*(1-templeClean)+edgeTints[j][x<0?0:1][ch]*templeClean);
    const [cheekFix,chinFix]=localAlbedoWeights(x,y);
    if(sourceUV&&safePhoto>0&&(cheekFix>0||chinFix>0)){
      const broad=lowSource(...sourceUV);
      for(let ch=0;ch<3;ch++){
        // Retain small original texture variations, while preventing individual
        // dark hair/contact pixels from surviving as a second sharp crease.
        const detail=Math.max(-5,Math.min(5,rgb[ch]-broad[ch]));
        skinRGB[ch]=skinRGB[ch]*(1-cheekFix)+(lateral[ch]+detail)*cheekFix;
        skinRGB[ch]=skinRGB[ch]*(1-chinFix)+(chinTone[ch]+detail)*chinFix;
      }
    }
    if(sourceUV&&safePhoto>0&&x>.027&&x<.744&&y>-.540&&y<.165){
      const [socket,nose]=sourceShadowWeights(x,y);
      if(socket>0||nose>0){
        const broad=luminance(orbitalSource(...sourceUV));
        // Protect thin dark lash strokes relative to their local broad tone.
        // An absolute darkness threshold would also reject the shadow being
        // corrected. The exact eye guard above remains the primary protection.
        const pigmentGuard=smooth((luminance(rgb)-broad+22)/15);
        const socketLift=Math.min(14,Math.max(0,(socketTone-broad)*.50))*socket;
        const noseLift=Math.min(7,Math.max(0,(noseTone-broad)*.50))*nose;
        const lift=Math.max(socketLift,noseLift)*pigmentGuard;
        for(let ch=0;ch<3;ch++)skinRGB[ch]+=lift;
      }
    }
    // Replace photographic fringe in the forehead color with clean skin; the
    // actual fringe is independent three-dimensional hair above this surface.
    const forehead=smooth((y-.15)/.095);
    const centralFringe=smooth((y-.055)/.075)*(1-smooth((Math.abs(x)-.075)/.085));
    const outerFringe=smooth((-x-.51)/.07)*smooth((y-.07)/.05)*(1-smooth((y-.26)/.10));
    const foreheadCoverage=Math.max(a,smooth((.92-Math.abs(x))/.20)*smooth((1.57-y)/.20));
    const clean=Math.max(forehead,centralFringe,outerFringe)*foreheadCoverage;
    const noise=(Math.sin(i*13.31+j*17.19)*43758.5453)%1*.48;
    const litSkin=foreheadColor.map((v,ch)=>v+(ch===0?-6:-9)*x+noise);
    const browT=(Math.abs(x)-.14)/.49;
    if(browT>0&&browT<1){
      const browY=.228+.048*Math.sin(browT*Math.PI*.88)-.028*browT;
      const width=.025*Math.sin(browT*Math.PI)**.30*(1-.4*browT);
      const shade=.38*Math.exp(-(((y-browY)/Math.max(.001,width))**2))*Math.sin(browT*Math.PI)**.25;
      for(let ch=0;ch<3;ch++)litSkin[ch]=litSkin[ch]*(1-shade)+[86,61,52][ch]*shade;
    }
    const edgeMatch=(1-a)*smooth((Math.abs(x)-.59)/.15);
    for(let ch=0;ch<3;ch++){
      const faceColor=(lateral[ch]*(1-safePhoto)+skinRGB[ch]*safePhoto)*(1-clean)+litSkin[ch]*clean;
      out.data[k+ch]=faceColor*(1-edgeMatch)+lateral[ch]*edgeMatch;
    }
    out.data[k+3]=255;
  }
  context.putImageData(out,0,0);
  let seed=19073;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const tx=x=>(x+1)/2*(canvas.width-1),ty=y=>(1.6-y)/2.85*(canvas.height-1);
  for(const s of [-1,1])for(let i=0;i<680;i++){
    const t=random(),x=s*(.14+t*.49),y=.228+.048*Math.sin(t*Math.PI*.88)-.028*t+(random()-.5)*.045*Math.sin(t*Math.PI)**.3;
    const dx=s*(.007+.020*t),dy=.020*(1-t)**1.2-.004*t;
    context.strokeStyle=`rgba(72,49,43,${.08+random()*.20})`;context.lineWidth=.35+random()*.45;
    context.beginPath();context.moveTo(tx(x),ty(y));context.quadraticCurveTo(tx(x+dx*.5),ty(y+dy*.8),tx(x+dx),ty(y+dy));context.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  texture.name='Skin color from uploaded image 1, hand-landmarked onto original 3D sculpt';
  // A small clean atlas supplies only rear/lateral albedo. The rear material's
  // roughness, sheen, specular, bump and illumination settings remain unchanged.
  // Its boundary colors use exactly the same field as the frontal atlas edges.
  const rearCanvas=document.createElement('canvas');rearCanvas.width=256;rearCanvas.height=384;
  const rearContext=rearCanvas.getContext('2d'),rearPixels=rearContext.createImageData(256,384);
  for(let j=0;j<384;j++)for(let i=0;i<256;i++){
    const x=i/255*2-1,y=1.6-j/383*2.85,rgb=cleanLateral(x,y,[toneAt(y,0),toneAt(y,1)]),k=(j*256+i)*4;
    for(let ch=0;ch<3;ch++)rearPixels.data[k+ch]=rgb[ch];rearPixels.data[k+3]=255;
  }
  rearContext.putImageData(rearPixels,0,0);
  const rearTexture=new THREE.CanvasTexture(rearCanvas);rearTexture.colorSpace=THREE.SRGBColorSpace;rearTexture.anisotropy=8;
  rearTexture.name='Clean hidden-skin colors from image 1, continuous with the face perimeter';
  return {atlas:texture,rearAtlas:rearTexture};
}

function assignUV(geometry){
  const p=geometry.attributes.position,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)+1)/2;uv[i*2+1]=(p.getY(i)+1.25)/2.85;}
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
}

export async function applyReferenceSkin(head) {
  const source=new Image();source.src=referenceURL;await source.decode();
  const bakeStart=performance.now();
  const {atlas,rearAtlas}=makeSkinAtlas(source);
  atlas.userData.bakeMs=performance.now()-bakeStart;
  head.traverse(o=>{
    if(!o.isMesh)return;
    const eyeSurface=o.name==='scleral-globe'||o.name==='brown-iris-and-pupil';
    const skinSurface=o.name==='continuous-face'||o.name==='sculpted-eyelids'||o.name==='upper-lip'||o.name==='lower-lip'||o.name.startsWith('naris-')||eyeSurface;
    if(o.name==='soft-brow-underlayer'){o.visible=false;return;}
    if(o.name==='corneal-softbox-reflection'){o.visible=false;return;}
    if(!skinSurface)return;
    assignUV(o.geometry);
    const original=o.material,mat=original.clone();mat.map=atlas;mat.color.set('#ffffff');mat.vertexColors=false;
    mat.roughness=o.name.includes('lip')?.44:.53;mat.specularIntensity=.28;
    if(!eyeSurface&&!o.name.startsWith('naris-')){
      // A small diffuse fill prevents the source illumination and live key
      // from doubling the darkest skin transitions. Geometry remains lit.
      mat.emissiveMap=atlas;mat.emissive.set('#ffffff');mat.emissiveIntensity=.04;
      mat.specularIntensity=.23;mat.bumpScale=.0015;
    }
    if(o.name==='scleral-globe'){mat.roughness=.40;mat.specularIntensity=.20;mat.clearcoat=.03;mat.clearcoatRoughness=.22;}
    if(o.name==='brown-iris-and-pupil'){mat.roughness=.48;mat.specularIntensity=.10;mat.clearcoat=0;}
    mat.needsUpdate=true;
    if(o.name==='continuous-face') {
      const rear=original.clone();rear.map=rearAtlas;rear.color.set('#ffffff');rear.vertexColors=false;rear.needsUpdate=true;
      o.material=[mat,rear];o.geometry.clearGroups();
      const index=o.geometry.index,p=o.geometry.attributes.position,front=[],back=[];
      for(let i=0;i<index.count;i+=3){
        const z=(p.getZ(index.getX(i))+p.getZ(index.getX(i+1))+p.getZ(index.getX(i+2)))/3,target=z>0?front:back;
        target.push(index.getX(i),index.getX(i+1),index.getX(i+2));
      }
      o.geometry.setIndex([...front,...back]);
      o.geometry.addGroup(0,front.length,0);o.geometry.addGroup(front.length,back.length,1);
    } else o.material=mat;
  });
  head.userData.skinSource='Only the user-uploaded image 1, mapped with manually authored correspondences. Geometry is independently sculpted; hidden surfaces are constructed.';
  return atlas;
}
