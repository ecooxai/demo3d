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

function makeSkinAtlas(source) {
  const c=document.createElement('canvas');c.width=source.naturalWidth;c.height=source.naturalHeight;
  const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(source,0,0);
  const pixels=cx.getImageData(0,0,c.width,c.height).data;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1536;
  const context=canvas.getContext('2d'),out=context.createImageData(canvas.width,canvas.height),mapping=makeMapping();
  const base=[232,191,174];
  const sample=(x,y)=>{
    const [u,v]=mapping(x,y),ix=Math.max(0,Math.min(c.width-2,Math.floor(u))),iy=Math.max(0,Math.min(c.height-2,Math.floor(v))),fx=Math.max(0,Math.min(1,u-ix)),fy=Math.max(0,Math.min(1,v-iy)),p=(iy*c.width+ix)*4;
    return [0,1,2].map(ch=>(pixels[p+ch]*(1-fx)+pixels[p+4+ch]*fx)*(1-fy)+(pixels[p+c.width*4+ch]*(1-fx)+pixels[p+c.width*4+4+ch]*fx)*fy);
  };
  // Lateral transitions inherit a nearby skin tone from this same reference,
  // preserving a rounded cheek instead of a constant-color polygonal border.
  const edgeTints=Array.from({length:canvas.height},(_,j)=>{
    const y=1.6-j/(canvas.height-1)*2.85,w=widthAt(y);
    return [-1,1].map(side=>y<.14&&y>-1.18?sample(side*Math.max(.012,w-.12),y):base);
  });
  const foreheadColor=[0,0,0];
  for(let yy=343;yy<367;yy++)for(let xx=612;xx<634;xx++)for(let ch=0;ch<3;ch++)foreheadColor[ch]+=pixels[(yy*c.width+xx)*4+ch]/528;
  for(let j=0;j<canvas.height;j++)for(let i=0;i<canvas.width;i++) {
    const x=i/(canvas.width-1)*2-1,y=1.6-j/(canvas.height-1)*2.85,a=photoWeight(x,y),k=(j*canvas.width+i)*4;
    const edgeAmount=.72*smooth((.92-Math.abs(x))/.20)*smooth((y+1.21)/.12)*(1-smooth((y-.12)/.16));
    const lateral=base.map((v,ch)=>v*(1-edgeAmount)+edgeTints[j][x<0?0:1][ch]*edgeAmount);
    const rgb=a>0?sample(x,y):lateral;
    // Replace photographic fringe in the forehead color with clean skin; the
    // actual fringe is independent three-dimensional hair above this surface.
    const forehead=smooth((y-.15)/.095);
    const centralFringe=smooth((y-.055)/.075)*(1-smooth((Math.abs(x)-.075)/.085));
    const foreheadCoverage=Math.max(a,smooth((.92-Math.abs(x))/.20)*smooth((1.57-y)/.20));
    const clean=Math.max(forehead,centralFringe)*foreheadCoverage;
    const noise=(Math.sin(i*13.31+j*17.19)*43758.5453)%1*.48;
    const litSkin=foreheadColor.map((v,ch)=>v+(ch===0?-6:-9)*x+noise);
    const browT=(Math.abs(x)-.14)/.49;
    if(browT>0&&browT<1){
      const browY=.228+.048*Math.sin(browT*Math.PI*.88)-.028*browT;
      const width=.025*Math.sin(browT*Math.PI)**.30*(1-.4*browT);
      const shade=.38*Math.exp(-(((y-browY)/Math.max(.001,width))**2))*Math.sin(browT*Math.PI)**.25;
      for(let ch=0;ch<3;ch++)litSkin[ch]=litSkin[ch]*(1-shade)+[86,61,52][ch]*shade;
    }
    for(let ch=0;ch<3;ch++)out.data[k+ch]=(lateral[ch]*(1-a)+rgb[ch]*a)*(1-clean)+litSkin[ch]*clean;
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
  return texture;
}

function assignUV(geometry){
  const p=geometry.attributes.position,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)+1)/2;uv[i*2+1]=(p.getY(i)+1.25)/2.85;}
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
}

export async function applyReferenceSkin(head) {
  const source=new Image();source.src=referenceURL;await source.decode();
  const bakeStart=performance.now();
  const atlas=makeSkinAtlas(source);
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
    if(o.name==='scleral-globe'){mat.roughness=.40;mat.specularIntensity=.20;mat.clearcoat=.03;mat.clearcoatRoughness=.22;}
    if(o.name==='brown-iris-and-pupil'){mat.roughness=.48;mat.specularIntensity=.10;mat.clearcoat=0;}
    mat.needsUpdate=true;
    if(o.name==='continuous-face') {
      o.material=[mat,original];o.geometry.clearGroups();
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
