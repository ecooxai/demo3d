// All positions are metres, Y up. These meshes are built in world space, without assets.
const TAU=Math.PI*2, s=Math.sin, c=Math.cos;
const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]), mul=(a,k)=>a.map(v=>v*k);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1));
function rgb(h){return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4})}
const mix=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
function random(seed){let st=seed|0;return ()=>((st=(Math.imul(st,1664525)+1013904223)|0)>>>0)/4294967296}
function forge(){
 let vert=[], norm=[], color=[];
 const cache=new Map();const colorOf=x=>typeof x!=='string'?x:(cache.get(x)||((v)=>(cache.set(x,v),v))(rgb(x)));
 function tri(a,b,d,paint,n=null,em=0){
   const f=unit(cross(sub(b,a),sub(d,a))); if(Math.hypot(...f)<.1)return;
   const p=colorOf(paint);for(const [i,v] of [a,b,d].entries()){vert.push(...v);norm.push(...(n?n[i]:f));color.push(...p)}
 }
 function quad(a,b,d,e,k){tri(a,b,d,k);tri(a,d,e,k)}
 function box(x,y,z,w,h,d,k){
  let X=x+w/2,Y=y+h/2,Z=z+d/2;x-=w/2;y-=h/2;z-=d/2;
  quad([x,y,Z],[X,y,Z],[X,Y,Z],[x,Y,Z],k);quad([X,y,z],[x,y,z],[x,Y,z],[X,Y,z],k);
  quad([X,y,Z],[X,y,z],[X,Y,z],[X,Y,Z],k);quad([x,y,z],[x,y,Z],[x,Y,Z],[x,Y,z],k);
  quad([x,Y,Z],[X,Y,Z],[X,Y,z],[x,Y,z],k);quad([x,y,z],[X,y,z],[X,y,Z],[x,y,Z],k);
 }
 function rod(a,b,r,k,n=7,rb=r){let z=unit(sub(b,a));if(Math.hypot(...z)<.5)return;
  const u=unit(cross(Math.abs(z[1])>.89?[1,0,0]:[0,1,0],z)),v=cross(z,u);
  let last=null; for(let j=0;j<=n;j++){const t=j*TAU/n,nn=add(mul(u,c(t)),mul(v,s(t))),p=add(a,mul(nn,r)),q=add(b,mul(nn,rb));
   if(last){const [l,h,ln]=last;tri(l,p,q,k,[ln,nn,nn]);tri(l,q,h,k,[ln,nn,ln]);tri(a,p,l,k);tri(b,h,q,k)} last=[p,q,nn];
  }
 }
 function line(points,r,k,n=6){for(let i=1;i<points.length;i++)rod(points[i-1],points[i],r,k,n)}
 // Ring profiles [height,xRadius,zRadius,xCenter,zCenter], waist radius can be zero.
 function loft(rings,k,n=20){const row=(a,i)=>{const t=i*TAU/n;return [(a[3]||0)+a[1]*s(t),a[0],(a[4]||0)+a[2]*c(t)]};
  const nn=(j,i)=>{let a=row(rings[j],i-1),b=row(rings[j],i+1),d=row(rings[Math.min(rings.length-1,j+1)],i),e=row(rings[Math.max(0,j-1)],i),v=unit(cross(sub(b,a),sub(d,e)));return Math.hypot(...v)>.5?v:[0,j?1:-1,0]};const normals=rings.map((_,j)=>Array.from({length:n},(_,i)=>nn(j,i)));
  for(let j=1;j<rings.length;j++){const lo=rings[j-1],hi=rings[j];
   for(let i=0;i<n;i++){const a=row(lo,i),b=row(lo,i+1),d=row(hi,i+1),e=row(hi,i);
    const paint=typeof k==='function'?k(j-1,(i+.5)*TAU/n):k;
    const aN=normals[j-1][i],bN=normals[j-1][(i+1)%n],dN=normals[j][(i+1)%n],eN=normals[j][i];tri(a,b,d,paint,[aN,bN,dN]);tri(a,d,e,paint,[aN,dN,eN])}}
  const l=rings[0],h=rings.at(-1);
  for(let i=0;i<n;i++){tri([l[3]||0,l[0],l[4]||0],row(l,i+1),row(l,i),typeof k==='function'?k(0,0):k);tri([h[3]||0,h[0],h[4]||0],row(h,i),row(h,i+1),typeof k==='function'?k(rings.length-2,0):k)}
 }
 function egg(p,sz,k,n=16,l=9){const rings=[];for(let i=0;i<=l;i++){let t=-Math.PI/2+Math.PI*i/l;rings.push([p[1]+sz[1]*s(t),sz[0]*c(t),sz[2]*c(t),p[0],p[2]])}loft(rings,k,n)}
 function ellipse(p,rx,ry,rz,k,thick=.012,n=40,ar=[0,TAU]){let q=null;for(let j=0;j<=n;j++){let t=ar[0]+(ar[1]-ar[0])*j/n;let a=[p[0]+rx*c(t),p[1]+ry*s(t),p[2]+rz*c(t)];if(q)rod(q,a,thick,k,6);q=a}}
 return {tri,quad,box,rod,line,loft,egg,ellipse,vert,norm,color}
}
function actor(g){
 const oldCount=g.vert.length;
 const {loft,egg,tri,rod,line,quad}=g;
 const ink='303444',hair='272a37',skin='9d8278',shi='6b6062',shoe='3a4047';
 // Real cloth volumes: quiet asymmetric weight on the left leg.
 for(const side of [-1,1]){
   const x=side*.082,dx=side*.020;
   loft([[.063,.046,.050,x+dx,-.009],[.11,.048,.049,x+dx,.008],[.20,.05,.058,x+.018*side,.010],[.35,.060,.068,x+.014*side,.005],[.45,.057,.069,x+.007*side,-.003],[.52,.066,.077,x+.003*side,.003],[.68,.079,.091,x,.005],[.81,.083,.101,x*.94,-.002],[.91,.083,.101,x*.89,-.01]],(j,t)=>s(t*3+j*.2)>.72?'454e58':'3d4651',16);
   for(const [y,w] of [[.13,.045],[.39,.053],[.452,.048],[.57,.053]]){const xo=x+side*.009;tri([xo-w,y,.055],[xo+w,y+.02,.057],[xo+w*.4,y+.009,.074],'4f5760')}
   // Extruded footprint places the sole on the roof, unlike an egg with
   // a single tangent point. Heel counter, vamp, tongue and stitching are
   // modeled separately but the lower tread remains unobtrusively dark.
   const SX=x+dx,foot=[[-.043,.052],[-.052,.035],[-.054,.005],[-.048,-.026],[-.057,-.075],[-.059,-.115],[-.048,-.140],[-.020,-.153],[.012,-.154],[.044,-.142],[.058,-.121],[.059,-.082],[.052,-.043],[.047,-.012],[.05,.027],[.041,.05],[.018,.060],[-.021,.06]];
   const sole=(P,h,sc)=>[SX+P[0]*sc,h,P[1]*sc-.006];for(let i=0;i<foot.length;i++){let A=foot[i],B=foot[(i+1)%foot.length];quad(sole(A,.0025,.994),sole(B,.0025,.994),sole(B,.016,1.01),sole(A,.016,1.01),'626e72');quad(sole(A,.016,1.01),sole(B,.016,1.01),sole(B,.025,1.00),sole(A,.025,1.00),'748086');tri([SX,.0025,-.045],sole(A,.0025,.994),sole(B,.0025,.994),'475259')}
   loft([[.022,.058,.104,SX,-.047],[.037,.059,.107,SX,-.049],[.05,.058,.100,SX,-.043],[.070,.054,.082,SX,-.032],[.088,.048,.059,SX,-.011],[.101,.044,.044,SX,.001],[.098,.041,.039,SX,.002]],(j,t)=>j<3?'414b55':(c(t)>.64?'53606a':'47515c'),19);
   line([[SX-.051,.040,-.108],[SX-.032,.054,-.123],[SX,.060,-.128],[SX+.032,.054,-.123],[SX+.051,.040,-.108]],.0018,'778386',5);
   line([[SX-.038,.069,-.043],[SX-.029,.088,-.042],[SX-.018,.098,-.033]],.0020,'77848a',5);
   for(let j=0;j<3;j++){let y=.077+j*.006,z=-.078+j*.017;rod([SX-.017,y,z],[SX+.018,y+.002,z+.006],.0022,'8b9290',5);rod([SX+.017,y,z],[SX-.018,y+.002,z+.006],.0022,'8b9290',5)}

 }
 loft([[.72,.118,.084,0,.0],[.78,.150,.102,0,-.007],[.89,.151,.10,0,-.007],[.95,.144,.09,0,0]],'414a55',22);
 const torso=[[.819,.144,.100,0,0],[.836,.154,.110,0,.002],[.863,.156,.111,0,.004],[.879,.164,.119,-.002,.006],[.932,.159,.106,-.006,.006],[1.041,.151,.103,-.007,.005],[1.135,.166,.113,-.004,.004],[1.224,.183,.124,-.002,.002],[1.30,.195,.121,0,-.002],[1.356,.183,.112,.002,-.001],[1.398,.137,.098,.003,.0],[1.425,.083,.075,.007,-.005]];
 const back='71828a',sidepanel='61727a',sleeve='394452',welt='616c72';
 loft(torso,(j,t)=>{let angle=Math.abs(Math.atan2(s(t),c(t)));if(j<2)return '545e63';if(angle>2.35)return '697c84';if(angle>1.27-j*.018)return sleeve;if(j>8&&angle>.66-(j-9)*.25)return sleeve;
   if(angle>.93)return sidepanel;return back},30);
 // Raglan yoke and tiny top-stitched seams curve over each shoulder.
 for(const side of [-1,1]){
  line([[.067*side,1.406,.049],[.10*side,1.382,.076],[.126*side,1.346,.088],[.147*side,1.303,.079],[.162*side,1.246,.062],[.171*side,1.213,.046]],.0039,welt,5);
  // Fastened pocket on each front quarter, side welt at the hand.
  line([[.103*side,1.042,-.087],[.130*side,.986,-.065],[.14*side,.96,-.051]],.006,'46515a',6);
  loft([[.779,.037,.037,.220*side,.018],[.804,.04,.042,.224*side,.02],[.827,.043,.044,.224*side,.018],[.875,.047,.053,.224*side,.023],[.964,.050,.055,.222*side,.025],[1.062,.054,.063,.218*side,.017],[1.119,.057,.069,.215*side,.00],[1.191,.060,.073,.204*side,-.005],[1.265,.061,.075,.196*side,-.003],[1.316,.056,.066,.184*side,-.006],[1.35,.046,.057,.161*side,-.005],[1.368,.027,.036,.144*side,-.006],[1.380,.008,.012,.128*side,-.007]],(j,t)=>j<2?'444d55':(c(t)>.65?'505c66':sleeve),18);
  for(const [y,x,z,w] of [[.86,.223,.065,.026],[.988,.219,.079,.035],[1.056,.212,.081,.034],[1.11,.211,.072,.025]]){tri([(x-w)*side,y+.016,z-.006],[(x+w)*side,y-.008,z-.005],[x*side,y+.003,z+.005],'687078')}
  // Hands, thumb and softly separated tapering fingers.
  // Palm normal faces the thigh. The knuckles run front-to-back, and the
  // four free finger lengths remain outside the palm volume in side view.
  const HX=.222*side,HZ=.002;loft([[.711,.012,.026,HX-.003*side,HZ],[.723,.018,.034,HX,HZ],[.744,.020,.037,HX+.001*side,HZ],[.761,.020,.034,HX+.002*side,HZ],[.777,.019,.029,HX,HZ+.003],[.794,.019,.023,HX-.002*side,HZ+.006]],skin,17);
  for(let k=0;k<4;k++){const zz=HZ+(k-1.5)*.0152,xk=HX+(.0009*s(k*1.4))*side,L=[.052,.062,.058,.044][k],Y=.726-.002*Math.abs(k-1.4);
   const P=[xk,Y,zz],Q=[xk+.0025*side,Y-L*.41,zz-.0015],R=[xk-.0025*side,Y-L*.75,zz-.0039],T=[xk-(.006+.0017*k)*side,Y-L,zz-.006];
   rod(P,Q,.0070-(k===3?.0007:0),skin,9,.0066);rod(Q,R,.0066,skin,9,.0059);rod(R,T,.0059,skin,9,.0049);egg(T,[.0051,.0048,.0049],skin,9,5);
   const n=[R[0]+.0052*side,R[1]-.0025,R[2]];egg(n,[.0016,.0058,.0036],'a49389',8,4);
  }
  const A=[HX-.009*side,.761,HZ-.025],B=[HX-.016*side,.748,HZ-.039],C=[HX-.018*side,.731,HZ-.044],D=[HX-.014*side,.717,HZ-.043];
  rod(A,B,.0108,skin,9,.0093);rod(B,C,.0093,skin,9,.0072);rod(C,D,.0072,skin,9,.0057);egg(D,[.006,.006,.006],skin,8,5);
  // Tender web between thumb and palm remains attached, without filling the
  // whole thumb-index gap or turning the hand silhouette into a mitten.
  tri(A,[HX-.010*side,.73,HZ-.027],B,skin);

 }
 line([[.004,.847,-.106],[-.004,1.17,-.116],[.006,1.39,-.096]],.0037,'49555c',5);
 loft([[1.378,.099,.077,.006,0],[1.412,.081,.071,.007,-.002],[1.436,.072,.064,.008,-.003]],'4b565e',20);
 loft([[1.406,.057,.049,.007,-.005],[1.468,.052,.044,.009,-.006],[1.505,.064,.052,.012,-.015]],'53565c',18);
 // Hand-shaped chin, cheeks, nose, lids and brows are present for alternate camera angles.
 loft([[1.465,.026,.037,.014,-.053],[1.483,.050,.054,.014,-.050],[1.511,.074,.075,.016,-.034],[1.55,.089,.086,.018,-.023],[1.597,.097,.094,.017,-.017],[1.635,.095,.091,.015,-.011],[1.671,.083,.079,.015,-.008],[1.694,.056,.056,.014,-.007]],skin,22);
 for(const side of [-1,1]){
   egg([.015+.095*side,1.556,-.004],[.016,.031,.02],skin,11,7);
   egg([.015+.105*side,1.555,-.005],[.006,.017,.012],shi,9,6);

 }
  // Nose root, tip and alae are a joined sectional volume. The bridge and
 // underplane project past the cheek shell even in the reverse silhouette.
 loft([[1.519,.006,.005,.013,-.112],[1.523,.012,.008,.013,-.116],[1.528,.017,.012,.013,-.120],[1.533,.014,.015,.013,-.128],[1.540,.011,.010,.013,-.125],[1.553,.008,.008,.013,-.116],[1.567,.005,.005,.013,-.108]],(j,t)=>j<2?'8b716d':(c(t)<-.38?'b09583':'9f8579'),16);
 for(const side of [-1,1]){const X=.013+side*.012;egg([X,1.527,-.117],[.008,.006,.008],'9d8275',10,6);egg([X,1.524,-.124],[.0038,.0018,.002],'736264',8,4)}
 // A restrained contact line under the lower lip and the angular chin point
 // make the teenager's profile readable without drawing a floating outline.
 loft([[1.478,.022,.008,.014,-.087],[1.483,.035,.010,.014,-.087],[1.491,.036,.008,.014,-.09],[1.498,.026,.006,.014,-.095]],'a48779',13);
 egg([.014,1.506,-.106],[.015,.0029,.0033],'956f70',11,5);egg([.014,1.501,-.105],[.013,.003,.0026],'b19586',11,5);
 for(const side of [-1,1]){
   let E=.015+side*.104;line([[E,1.567,-.015],[E+side*.002,1.57,-.008],[E+side*.003,1.563,.000],[E+side*.002,1.55,-.004],[E,1.545,-.010]],.0025,'9c8178',6);
 }

 line([[.001,1.505,-.104],[.012,1.504,-.106],[.029,1.506,-.101]],.0026,shi,5);
 // Hair cap falls lower at the nape. Shingled triangular curls share their
 // roots with the cap; facets point down and sideways, not away like a star.
 const scalp=(t,y,rx,rz)=>[.014+rx*s(t),y,-.006+rz*c(t)];
 const n=34,rows=[[1.528,.097,.09],[1.570,.111,.103],[1.635,.115,.108],[1.683,.101,.095],[1.718,.069,.064],[1.734,.022,.023]];
 const hp=(j,t)=>{const [y,rx,rz]=rows[j],front=(1-c(t))/2;
   return scalp(t,y+(j===0?.076:j===1?.033:0)*front+.004*s(3*t+j)+.009*s(t+.54)+.006*s(4*t+.9*j),rx,rz)};
 for(let j=1;j<rows.length;j++){for(let i=0;i<n;i++){let a=i*TAU/n,b=(i+1)*TAU/n;const verts=[hp(j-1,a),hp(j-1,b),hp(j,b),hp(j,a)],ns=verts.map(P=>unit([(P[0]-.014)*9.4,(P[1]-1.595)*6.8,(P[2]+.006)*10])),col=j>=4?'363946':hair;tri(verts[0],verts[1],verts[2],col,[ns[0],ns[1],ns[2]]);tri(verts[0],verts[2],verts[3],col,[ns[0],ns[2],ns[3]])}}
 for(let i=0;i<n;i++)tri(hp(5,i*TAU/n),hp(5,(i+1)*TAU/n),[.0,1.738,-.006],hair);
 const rng=random(741);for(let layer=0;layer<3;layer++){const count=[16,14,11][layer];
 for(let i=0;i<count;i++){let t=(i+.33*layer)*TAU/count+rng()*.055,dt=TAU/count*.71,front=(1-c(t))/2;
   let y=1.585+.045*layer+.036*front,rx=[.112,.113,.097][layer],rz=[.105,.105,.091][layer],sweep=.22*s(t*2.2+.45)+.27*s(t+.2)+.16*(rng()-.5);
   let a=scalp(t-dt,y+.021,rx*.955,rz*.96),b=scalp(t+dt,y+.017,rx*.963,rz*.96),m=scalp(t+.025,y-.002,rx+ .004,rz+.005),q=scalp(t+sweep,y-(.055+.016*rng()),rx+.009,rz+.008);
   if(layer===0&&c(t)>.2)q[1]-=.013+.022*rng();if(layer===0&&c(t)<-.40){let opening=Math.exp(-((t-3.65)**2)/.23)+.40*Math.exp(-((t-2.72)**2)/.21);q[1]+=.058*opening;q[0]+=.014*opening;q[2]+=.005*opening;}tri(a,m,q,['292d38','303540','383d48'][layer]);tri(m,b,q,['252833','2b303c','333844'][layer]);
 }}
 // Cowlicks grow along the crown and give the head an irregular silhouette.
 for(const [x,y,z,dx,dy,dz] of [[-.039,1.717,.012,-.037,.035,.016],[-.012,1.73,-.012,-.025,.022,-.005],[.044,1.711,-.022,.045,.015,-.014],[.062,1.688,.005,.052,.022,.004]]){let a=[x-.021,y-.009,z],b=[x+.020,y-.006,z-.016],m=[x,y+.003,z+.013],q=[x+dx,y+dy,z+dz];tri(a,m,q,'3c3f4d');tri(m,b,q,hair)}

 // Swept seam binding and well-worn crease valleys follow the actual back
 // and sleeve surfaces. Their ends taper out into cloth, not floating shards.
 const backAt=(x,h,zoff=.002)=>{let j=1;while(j<torso.length-1&&torso[j][0]<h)j++;let a=torso[j-1],b=torso[j],t=Math.min(1,Math.max(0,(h-a[0])/(b[0]-a[0]))),p=a.map((v,k)=>v+(b[k]-v)*t),u=(x-p[3])/p[1];return [x,h,p[4]+p[2]*Math.sqrt(Math.max(.018,1-u*u))+zoff]};
 function crease(path,w,shade,rim){
  let prev=null;
  for(let i=0;i<path.length;i++){let [x,h]=path[i],a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],N=Math.hypot(b[0]-a[0],b[1]-a[1])||1,weight=i===0||i===path.length-1?.08:Math.sin(Math.PI*(i+.36)/(path.length-.26)),nx=-(b[1]-a[1])/N*w*weight,ny=(b[0]-a[0])/N*w*weight;
   let lo=backAt(x-nx,h-ny,.0022),mid=backAt(x,h,.0034),hi=backAt(x+nx,h+ny,.0031+.0045*weight);
   if(prev){quad(prev[0],lo,mid,prev[1],shade);quad(prev[1],mid,hi,prev[2],rim)}prev=[lo,mid,hi];
  }
 }
 crease([[-.146,.91],[-.090,.898],[-.017,.892],[.052,.898],[.125,.912]],.0055,'46535c','73838a');
 crease([[-.145,.885],[-.088,.874],[-.013,.87],[.055,.873],[.143,.889]],.0042,'3d4b53','65777d');
 crease([[-.125,1.202],[-.113,1.17],[-.103,1.128],[-.100,1.104]],.0041,'505e64','718086');
 crease([[.106,1.232],[.103,1.203],[.096,1.168],[.093,1.128]],.0046,'4b5964','79878d');
 crease([[-.055,.959],[-.018,.956],[.032,.961],[.072,.972]],.0043,'53616b','7e8d91');
 crease([[.113,1.051],[.132,1.075],[.146,1.092]],.0035,'596871','758489');
 for(const sgn of [-1,1]){
   const path=[[.061,1.414],[.081,1.39],[.099,1.36],[.116,1.333],[.134,1.296],[.15,1.259],[.165,1.222]];
   line(path.map(([x,y])=>backAt(sgn*x,y,.0028)),.0032,'313d46',6);
   line(path.slice(1,6).map(([x,y])=>backAt(sgn*(x-.004),y,.0034)),.0018,sgn===-1?'87969b':'6b7b83',5);
   // A pair of narrow varying crescent folds, not solid ring stripes.
   for(const [y,rx,zz,tilt] of [[.968,.047,.077,.020],[1.047,.052,.078,-.018],[1.087,.052,.065,.016]]){
     const xx=.221*sgn;let P=((a,dy=0)=>[xx+rx*s(a)*sgn,y+tilt*s(a)+dy,.017+(zz-.017)*c(a)]);
     let prev=null;for(let i=0;i<=7;i++){let t=i/7,a=(t-.48)*1.71,amp=s(Math.PI*t)*.0065;let p=P(a),q=P(a,amp);p[2]+=.001;q[2]+=.0024;if(prev)quad(prev[0],p,q,prev[1],i<4?'3e4a55':'627182');prev=[p,q]}
   }
 }
 // Finite trouser knee darts and rear diagonal pocket welts are embedded in
 // the seat; their material stays subdued when the camera moves around.
 for(const side of [-1,1]){
  line([[.048*side,.842,.091],[.087*side,.834,.090],[.13*side,.824,.061]],.0028,'56616a',5);
  line([[.045*side,.832,.093],[.088*side,.823,.090],[.13*side,.816,.061]],.0040,'303944',6);
 }
 // Facial planes for the reverse camera: the eye geometry follows the skin,
 // not a floating, frontal face card. The iris is covered by the upper lid.
 const faceR=[[1.465,.026,.037,.014,-.053],[1.483,.050,.054,.014,-.050],[1.511,.074,.075,.016,-.034],[1.55,.089,.086,.018,-.023],[1.597,.097,.094,.017,-.017],[1.635,.095,.091,.015,-.011],[1.671,.083,.079,.015,-.008]];
 function face(x,y,off=.0028){let j=1;while(j<faceR.length-1&&y>faceR[j][0])j++;let a=faceR[j-1],b=faceR[j],t=(y-a[0])/(b[0]-a[0]),p=a.map((v,k)=>v+(b[k]-v)*t);return [x,y,p[4]-p[2]*Math.sqrt(Math.max(.015,1-((x-p[3])/p[1])**2))-off]}
 // Each eye is a shallow, curved set of pigmented panels on the zygomatic
 // surface. Positive relief is measured in millimetres: neither a second
 // eyeball nor cylindrical eyeliner should stand away from the profile.
 for(const side of [-1,1]){
   const X=.015+side*.044,Y=1.567;
   const pt=(u,v,h)=>face(X+side*u,Y+v,h);
   const stripe=(row,col)=>{for(let j=1;j<row.length;j++){let a=row[j-1],b=row[j];let q=[pt(a[0],a[1],a[3]),pt(b[0],b[1],b[3]),pt(b[0],b[2],b[4]),pt(a[0],a[2],a[4])];if(side<0)q.reverse();quad(...q,col)}};
   const eye=[[-.020,-.0002,-.0008,.0007,.0008],[-.012,.0048,-.0037,.00145,.0015],[-.003,.0068,-.0054,.0017,.0018],[.007,.0070,-.0049,.00165,.0017],[.015,.0047,-.0025,.0013,.0015],[.022,.0020,.0011,.0007,.0008]];
   stripe(eye,'b8aca2');
   // Vertical pupil under a partially lowered upper lid. Divide the disks
   // into surface-following fans; flattening a stock sphere leaves a visible
   // small coin standing away from the temple at oblique grazing angles.
   function disk(U,V,rx,ry,h,color){
     let mid=pt(U,V,h+.00017),n=14;
     for(let k=0;k<n;k++){let t=k*TAU/n,t1=(k+1)*TAU/n;let a=pt(U+rx*c(t),V+ry*s(t),h),b=pt(U+rx*c(t1),V+ry*s(t1),h);tri(mid,side<0?a:b,side<0?b:a,color)}
   }
   disk(-.0006,.0004,.0071,.0056,.0023,'514b4b');
   disk(-.0009,.0009,.0039,.0043,.00285,'302f36');
   disk(-.0021,.0026,.0014,.0011,.00335,'b5b9b9');
   stripe(eye.map((r,j)=>[r[0],r[1]+[.0010,.0020,.0024,.0025,.0019,.0011][j],r[1]-.0006,.0017,.0025]),'5c4b50');
   stripe(eye.map((r,j)=>[r[0],r[1]+[.0014,.0046,.0053,.0051,.0036,.0015][j],r[1]+.0015,.0008,.0014]),'ad8d7e');
   stripe([[-.017,.018,.017,.0009,.0011],[-.008,.0201,.0178,.0012,.0017],[.001,.0216,.0189,.0011,.0016],[.011,.0211,.0186,.0010,.0015],[.020,.0184,.0175,.0007,.0009]],'51444a');
 }
 tri(face(.014,1.552,.003),[.013,1.530,-.125],face(.004,1.526,.0032),'aa8a7d');
 line([face(.000,1.506,.004),face(.014,1.505,.0038),face(.028,1.508,.0032)],.0021,'765f65',5);
 // The front of the windbreaker has a slightly offset two-piece collar,
 // double zipper tape, real slider and two hand-warmer welt openings.
 function frontAt(x,y,o=.0025){let j=1;while(j<torso.length-1&&torso[j][0]<y)j++;let a=torso[j-1],b=torso[j],t=Math.min(1,Math.max(0,(y-a[0])/(b[0]-a[0]))),v=a.map((q,k)=>q+(b[k]-q)*t);return [x,y,v[4]-v[2]*Math.sqrt(Math.max(.028,1-((x-v[3])/v[1])**2))-o]}
 for(const side of [-1,1]){line([[.006*side,.842],[.002*side,.91],[-.002+side*.003,1.02],[-.005+side*.003,1.17],[.005*side,1.31],[.009*side,1.393]].map(([x,y])=>frontAt(x,y)),.0024,side<0?'3d4b53':'859093',6);
  line([[.142*side,1.015],[.128*side,.982],[.113*side,.957],[.095*side,.932]].map(([x,y])=>frontAt(x,y,.0038)),.0048,'46545b',6);
  line([[.136*side,1.013],[.123*side,.982],[.107*side,.957],[.092*side,.936]].map(([x,y])=>frontAt(x,y,.004)),.0023,'829095',5);
  line([[.042*side,1.397],[.068*side,1.373],[.104*side,1.340],[.128*side,1.311],[.149*side,1.267]].map(([x,y])=>frontAt(x,y)),.0026,'455664',6);
  for(const [x,y,rise] of [[.078,.897,.009],[.09,1.035,.019],[.107,1.082,-.022]]){const a=frontAt((x-.042)*side,y+.004),b=frontAt(x*side,y),q=frontAt((x+.036)*side,y+rise),d=frontAt(x*side,y-.005);tri(a,b,d,'66777e');tri(b,q,d,'556974')}
 }
 egg(frontAt(.007,1.351,.0058),[.005,.011,.003],'8c9695',8,5);
 line([frontAt(.009,1.35,.006),frontAt(.015,1.329,.009),frontAt(.011,1.325,.007)],.0023,'82908e',5);
 // Keep the feet planted whilst lengthening the legs and shortening the
 // jacket hem-to-collar proportion of this backlit teenage silhouette.
 const src=[0,.68,.84,1.22,1.415,1.75],dst=[0,.875,1.014,1.335,1.507,1.826];
 for(let i=oldCount+1;i<g.vert.length;i+=3){let y=g.vert[i],ox=g.vert[i-1],right=ox>0?1:-1,leg=Math.max(0,1-y/.90),arm=Math.min(1,Math.max(0,(Math.abs(ox)-.166)/.045))*Math.min(1,Math.max(0,(1.36-y)/.28))*Math.min(1,Math.max(0,(y-.55)/.12)),head=Math.min(1,Math.max(0,(y-1.44)/.07));g.vert[i-1]=ox*(.93-head*.075)+right*leg*.017+.010*Math.sin(y*1.9)-right*.003*arm;g.vert[i+1]+=right*(leg*.043+arm*.018);y+=right*arm*.018;let j=1;while(j<src.length-1&&y>src[j])j++;let k=(dst[j]-dst[j-1])/(src[j]-src[j-1]);g.vert[i]=dst[j-1]+(y-src[j-1])*k;let nn=unit([g.norm[i-1],g.norm[i]/k,g.norm[i+1]]);g.norm[i-1]=nn[0];g.norm[i]=nn[1];g.norm[i+1]=nn[2];}
 // Weight rests on the left hip. The head looks up the physical comet arc;
 // one sleeve hangs slightly forward while the other rests behind the hip.
 // Map old positions through a local Jacobian for normals so subtle profile
 // changes do not break the cel lighting. This runs only once at build time.
 const S=(a,b,v)=>{let t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t)};
 function posed(p){let [x,y,z]=p,sg=x>=0?1:-1,hs=S(1.46,1.56,y),limb=S(.162,.195,Math.abs(x))*S(.76,.84,y)*(1-S(1.34,1.43,y)),lax=1-S(.91,1.34,y);
   // Contrapposto is a few centimeters, not the exaggerated S-curve of a pose doll.
   let hip=-.042*Math.exp(-((y-1.015)**2)/.14),should=.017*Math.exp(-((y-1.48)**2)/.09);
   z+=limb*(sg<0?-.096:.029)*lax; x+=limb*(sg<0?-.008:.014)*lax;
   y+=limb*(sg<0?.014:-.004)*lax;let finger=limb*(1-S(.86,.94,y));z-=.014*finger;x-=.004*finger*sg;
   z+=(1-S(.16,.98,y))*(sg<0?-.009:.022);if(sg>0&&y<1.06){const knee=Math.exp(-((y-.53)**2)/.040);z-=.049*knee;x+=.011*knee;}x+=hip+should;
   if(hs>0){const px=.009,py=1.506,pz=-.014,dx=x-px,dy=y-py,dz=z-pz,th=.204*hs,ph=.196*hs,ct=c(th),st=s(th),cp=c(ph),sp=s(ph),Y=dy*ct-dz*st,Z=dy*st+dz*ct;
    x=px+dx*cp+Z*sp-.009*hs;y=py+Y;z=pz-dx*sp+Z*cp+.005*hs;
   }
   return [x,y,z]
 }
 for(let i=oldCount;i<g.vert.length;i+=3){const p=[g.vert[i],g.vert[i+1],g.vert[i+2]],q=posed(p),n=[g.norm[i],g.norm[i+1],g.norm[i+2]],u=unit(cross(n,Math.abs(n[1])<.88?[0,1,0]:[0,0,1])),v=cross(n,u),a=posed(add(p,mul(u,.00012))),b=posed(add(p,mul(v,.00012))),nn=unit(cross(sub(a,q),sub(b,q)));
   for(let k=0;k<3;k++){g.vert[i+k]=q[k];g.norm[i+k]=nn[k]}
 }

}function bicycle(g){
 const {rod,egg,ellipse,line,quad,tri,box}=g;
 // Roadster in local space, on its kickstand, parked along the skyline rail.
 // Wheelbase 1.06 m, thin mudguards, rod brakes, generator and cable loops.
 const iron='525a62',steel='99a4a3',al='b5b6a9',tire='272b36',paint='696d73',rubber='373c44';
 const front=.53,rear=-.53,ax=.306,R=.300;
 for(const x of [rear,front]){
   ellipse([x,ax,0],R,R,0,tire,.020,48);
   ellipse([x,ax,0],R-.024,R-.024,0,steel,.0085,42);
   rod([x,ax,-.046],[x,ax,.046],.0245,steel,12);
   for(let k=0;k<28;k++){const t=k*TAU/28,off=k%2?-.031:.031;rod([x+.014*c(t+.9),ax+.014*s(t+.9),off],[x+(R-.03)*c(t),ax+(R-.03)*s(t),.002],.0027,'929a9b',4)}
   ellipse([x,ax,0],R+.020,R+.020,0,'7a8182',.012,34,[x===rear?-.03:.18,x===rear?3.50:3.07]);
   for(const zz of [-.029,.029]){line([[x,ax,zz],[x-.19,ax+.237,zz],[x-.25,ax+.197,zz]],.0045,steel,5)}
 }
 const crank=[-.038,.283,0],headTop=[.391,.775,0],headLow=[.421,.650,0],seat=[-.217,.690,0],seatTop=[-.244,.780,0];
 rod(seat,crank,.022,paint,12);rod(headLow,crank,.025,paint,12);rod(seat,headTop,.019,paint,12);
 rod(headLow,headTop,.0205,iron,10);rod(seat,seatTop,.0155,steel,10);
 for(const z of [-.04,.04]){
  rod([rear,ax,z],seat,.011,paint,8);rod([rear,ax,z],crank,.012,paint,8);
  line([[front,ax,z],[front+.001,.348,z],[.477,.451,z*.91],[headLow[0],headLow[1],z*.47]],.0115,steel,8);
  rod([rear-.002,.317,z],[-.642,.641,z*1.8],.007,iron,7);
  rod([-.345,.641,z*1.8],[rear,.321,z],.007,steel,7);
 }
 for(const z of [-.067,.067])rod([-.75,.650,z],[-.356,.650,z],.0075,steel,6);
 for(let i=0;i<6;i++)rod([-.733+i*.071,.65,-.067],[-.733+i*.071,.65,.067],.005,steel,6);
 ellipse([-.038,.283,.047],.079,.079,0,steel,.008,25);ellipse([rear,ax,.042],.040,.040,0,steel,.006,18);
 line([[rear,.347,.045],[-.051,.359,.053],[.015,.346,.05],[.043,.289,.05],[.030,.240,.05],[rear,.272,.043]],.005,'53585c',6);
 rod([-.038,.283,-.066],[-.038,.283,.069],.015,iron,10);
 for(const side of [-1,1]){rod([-.038,.283,side*.067],[-.038+side*.11,.283-side*.046,side*.073],.009,steel,7);box(-.038+side*.11,.283-side*.046,side*.102,.05,.015,.078,rubber)}
 egg([-.241,.788,0],[.119,.034,.067],'35393b',17,6);
 egg([-.164,.786,-.002],[.054,.025,.037],'424542',13,5);
 // Tourer bar: turned inward ends, metal stem, rubber grips and one bell.
 line([headTop,[.376,.849,.003],[.428,.871,.014]],.013,steel,10);
 for(const side of [-1,1]){
    line([[.428,.871,.014],[.424,.875,.094*side],[.395,.886,.180*side],[.351,.878,.212*side],[.289,.875,.225*side]],.009,steel,7);
    rod([.343,.879,.213*side],[.282,.875,.228*side],.015,rubber,10);
    rod([.370,.873,.194*side],[.308,.851,.202*side],.0055,steel,6);
 }
 egg([.386,.901,.143],[.022,.011,.021],al,12,5);
 line([[.35,.866,-.19],[.405,.789,-.152],[.464,.73,-.080],[.471,.66,-.034],[.458,.606,-.024]],.004,tire,5);
 line([[.335,.865,.20],[.30,.818,.13],[.322,.731,.063],[.218,.723,.03],[-.17,.681,.035],[rear+.19,.525,.032]],.0037,tire,5);
 rod([rear-.175,.67,.00],[rear-.226,.677,.00],.018,'875651',7);
 egg([front-.077,.669,.014],[.031,.021,.021],'b0a88a',11,6);
 rod([-.195,.279,.014],[-.325,.007,.182],.008,iron,7);
 // Pressed-sheet steel, not round rails pretending to be a fender: the
 // rolled lips turn under the center ridge and remain visibly separated
 // from the turning rubber around each wheel.
 for(const cx of [rear,front]){
  const from=cx===rear?-.17:.10,to=cx===rear?3.37:3.01,n=37,arcs=[];
  for(let i=0;i<=n;i++){let a=from+(to-from)*i/n;
   const vertex=(dz,r)=>[cx+r*c(a),ax+r*s(a),dz];
   arcs.push([vertex(-.035,R+.016),vertex(-.027,R+.028),vertex(0,R+.032),vertex(.027,R+.028),vertex(.035,R+.016)])}
  for(let i=1;i<=n;i++)for(let k=0;k<4;k++)quad(arcs[i-1][k],arcs[i][k],arcs[i][k+1],arcs[i-1][k+1],k===0||k===3?'637374':(k===1?'83908c':'747e7b'));
  for(const zz of [-.035,.035]){let y=cx===rear?.613:.60;rod([cx,ax,zz],[cx-.115,y,zz],.004,'81908f',5)}
 }
 // Reverse-side chain case: shallow rolled hem, stamped inset, two screw
 // heads, drain notches and a subdued brush-metal highlight over the crank.
 const cover=(pts,z,paint)=>{let centroid=pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length],[0,0]);for(let i=0;i<pts.length;i++)tri([centroid[0],centroid[1],z],[pts[i][0],pts[i][1],z],[pts[(i+1)%pts.length][0],pts[(i+1)%pts.length][1],z],paint)};
 const outline=[[rear-.041,ax+.009],[rear-.038,ax+.029],[rear-.019,ax+.047],[-.30,.355],[-.091,.388],[-.019,.381],[.029,.352],[.054,.311],[.052,.285],[.034,.279],[.006,.313],[-.029,.327],[-.086,.329],[rear+.038,ax+.005],[rear-.018,ax-.010]];
 cover(outline,.062,'637579');cover(outline.map(([x,y])=>[(x+.27)*.968-.27,(y-.316)*.78+.316]),.064,'778385');
 for(let i=1;i<8;i++){let a=outline[i-1],b=outline[i];rod([a[0],a[1],.062],[b[0],b[1],.062],.0033,'8c9690',5)}
 for(const [xx,yy] of [[rear-.018,.332],[-.117,.349],[.018,.354]])rod([xx,yy,.063],[xx,yy,.068],.0046,'a1a29a',6);
 // Tiny stand plate and front brake calipers. Matte dark nickel against the
 // polished rims reads as mechanical assembly, not a wireframe toy.
 for(const side of [-1,1]){line([[.473,.626,side*.021],[.477,.597,side*.043],[.49,.574,side*.045]],.005,'889593',6);box(.489,.570,side*.039,.033,.014,.014,'495156')}
 box(-.325,.009,.179,.053,.013,.023,'515d60');

}
function bake(part,draw,pos=[0,0,0],yaw=0,scale=1){
 const g=forge();draw(g);const count=g.vert.length/3,vertices=new Float32Array(count*10),indices=new Uint32Array(count),cy=c(yaw),sy=s(yaw);
 for(let i=0;i<count;i++){const j=i*3,v=i*10,x=g.vert[j],z=g.vert[j+2],nx=g.norm[j],nz=g.norm[j+2];
  vertices[v]=pos[0]+scale*(cy*x+sy*z);vertices[v+1]=pos[1]+scale*g.vert[j+1];vertices[v+2]=pos[2]+scale*(-sy*x+cy*z);
  vertices[v+3]=cy*nx+sy*nz;vertices[v+4]=g.norm[j+1];vertices[v+5]=-sy*nx+cy*nz;
  vertices[v+6]=g.color[j];vertices[v+7]=g.color[j+1];vertices[v+8]=g.color[j+2];vertices[v+9]=1;indices[i]=i;
 }
 return {name:part,mode:'opaque',vertices,indices}
}
export function buildRooftop(){
 return [
   bake('figure',actor,[.083,0,0],-.065),
   bake('bicycle',bicycle,[-1.28,0,-1.73],3.03,.99),
   ...extraParts()
 ]
}

function deck(g){
 const {box,rod,quad,tri}=g,rng=random(29657);
 const left=-5.85,right=5.1,fore=-2.06,aft=6.75,w=right-left,dep=aft-fore;
 box((left+right)/2,-4.55,(fore+aft)/2,w,8.90,dep,'777b80');
 // Concrete with trowelled patches, expansion joints and narrow painted coping.
 box((left+right)/2,-.088,(fore+aft)/2,w+.08,.18,dep+.08,'7d8182');
 for(let x=left+.59;x<right;x+=1.06)box(x,.003,(fore+aft)/2,.012,.005,dep,'6a7376');
 for(let z=fore+.48;z<aft;z+=1.03)box((left+right)/2,.003,z,w,.005,.012,'6c777a');
 for(let i=0;i<76;i++){
  const x=left+.4+rng()*(w-.8),z=fore+.1+rng()*(dep-.3),r=.038+rng()*.21;
  tri([x,.009,z],[x+r*.22,.009,z+r*.24],[x+r,.009,z+.019],i%3?'7c8081':'7d8183');
 }
 function railing(a,b){const fenceStart=g.vert.length;const v=sub(b,a),len=Math.hypot(...v),dx=v[0]/len,dz=v[2]/len;const p=(t,h)=>[a[0]+dx*t,h,a[2]+dz*t];
  const isX=Math.abs(dx)>.5,mid=p(len/2,0);
  box(mid[0],.158,mid[2],isX?len+.10:.16,.316,isX?.16:len+.10,'757d7f');
  box(mid[0],.316,mid[2],isX?len+.12:.20,.049,isX?.2:len+.12,'969c9a');
  box(mid[0],.351,mid[2],isX?len+.10:.15,.024,isX?.15:len+.1,'515961');
  let bays=Math.ceil(len/1.44),div=len/bays;
  for(let i=0;i<=bays;i++){const q=p(i*div,.73);box(q[0],q[1],q[2],.040,.782,.043,'464d57');
    box(q[0],.375,q[2],.095,.037,.11,'777e80');box(q[0],1.113,q[2],.060,.035,.066,'636b71');
    if(i<bays)for(let j=1;j<10;j++){let t=p((i+j/10)*div,.726);box(t[0],t[1],t[2],isX?.016:.020,.726,isX?.020:.016,j%4?'48525e':'52616a')}
  }
  for(const [y,h,d,k] of [[1.125,.049,.054,'5c6770'],[1.152,.009,.047,'8d9699'],[.529,.035,.033,'525c66']])box(mid[0],y,mid[2],isX?len:d,h,isX?d:len,k);
  // The forward edge is four tenths of a metre deeper here. A modest
  // reduction in fence height keeps its skyline sightline, while the cycle
  // is genuinely parked farther away on the roof, not lifted into frame.
  for(let i=fenceStart;i<g.vert.length;i+=3){const z=g.vert[i+2],t=Math.max(0,Math.min(1,(1.15-z)/3.21));g.vert[i+1]*=1-.034*t;}
 }
 railing([left,0,fore],[right,0,fore]);railing([left,0,aft],[left,0,fore]);railing([right,0,fore],[right,0,aft]);railing([right,0,aft],[left,0,aft]);
 // Apartment fabric below the roof in the alternate orbit views.
 for(let i=0;i<3;i++){let y=-.20-2.78*i;box((left+right)/2,y,(fore+aft)/2,w+.19,.19,dep+.18,'949693')}
 for(let f=0;f<3;f++){let y=-1.72-f*2.74;
 for(let j=0;j<5;j++){let x=left+1.15+j*2.12;for(const zz of [fore-.013,aft+.013]){let sign=zz>0?1:-1;
   box(x,y,zz,1.29,1.35,.025,'414c59');box(x,y,zz+sign*.025,1.16,1.23,.025,(f+j)%5?'687b88':'909080');box(x,y,zz+sign*.043,.028,1.23,.028,'464e55');box(x,y-.67,zz+sign*.043,1.36,.064,.12,'a0a09c');
 }}
 for(let j=0;j<3;j++){let z=fore+1.20+2.70*j;box(left-.013,y,z,.024,1.32,1.4,'424d56');box(left-.031,y,z,.024,1.15,1.24,'64747f');box(left-.046,y,z,.023,1.16,.031,'50565f')}
 }
 // Rain scuppers, floor grates and the exterior rainwater stack.
 for(const [x,z] of [[-1.13,5.57],[.94,2.53],[4.7,6.4]]){box(x,.009,z,.22,.01,.15,'4c555d');for(let j=0;j<7;j++)box(x-.092+j*.030,.016,z,.009,.008,.13,'88908e')}
 for(const z of [fore+.24,aft-.20]){rod([left-.102,-8.95,z],[left-.102,-.15,z],.042,'747b80',8);for(let j=0;j<4;j++)box(left-.08,-.45-j*2.16,z,.14,.043,.11,'979a98')}
}
function hut(g){
 const {box,rod,line,tri,quad,egg}=g,rand=random(44829);const xl=1.64,xr=4.7,zb=-.80,zf=.39,roof=2.44;
 const X=(xl+xr)/2,Z=(zf+zb)/2;
 box(X,roof/2,Z,xr-xl,roof,zf-zb,'65747a');
 // Bands give the overhanging slab a clear eave shadow and an exposed cap.
 box(X,.087,Z,xr-xl+.028,.17,zf-zb+.028,'656e70');box(X,roof-.10,Z,xr-xl+.025,.067,zf-zb+.021,'737e7c');
 box(X,roof-.004,Z,xr-xl+.22,.130,zf-zb+.20,'656f72');box(X,roof+.066,Z,xr-xl+.27,.032,zf-zb+.24,'a3a7a0');
 box(X,roof+.089,Z,xr-xl+.11,.019,zf-zb+.07,'8a9390');
 // Hatches and double bolted doors, genuine inset/glazing-free door leaves.
 const cx=2.67,zz=zf+.034,dw=1.26,dh=2.04,lad='7b8784',dcol=['53615f','505b59'];
 box(cx,1.037,zz,dw+.107,dh+.08,.062,'454f51');
 for(const side of [-1,1]){let x=cx+side*(dw/4+.007);box(x,1.035,zz+.035,dw/2-.012,dh,.036,dcol[side<0?0:1]);
  box(x,1.960,zz+.058,dw/2-.097,.026,.012,lad);box(x,.15,zz+.057,dw/2-.095,.018,.011,'586564');
  for(let i=0;i<3;i++){let y=.34+i*.694;box(x+side*(dw*.25-.023),y,zz+.057,.029,.071,.021,'929b95')}
 }
 for(const x of [cx-dw/2-.027,cx+dw/2+.027])box(x,1.035,zz+.058,.044,dh+.076,.048,'87918a');
 box(cx,dh+.055,zz+.058,dw+.10,.045,.063,'90988f');box(cx,.030,zz+.076,dw+.12,.056,.13,'919a91');
 
 
 for(let j=0;j<8;j++){let y=.30+j*.039;box(cx+.405,y,zz+.062,.31,.014,.010,'566260');box(cx+.405,y+.008,zz+.065,.313,.006,.014,'8a9389')}
 // Japanese-format warning plates: border, red header, electrical pictogram,
 // and small block lettering drawn directly as geometric strokes.
 function placard(x,y,z,w,h,red){box(x,y,z,w,h,.014,'484f50');box(x,y,z+.010,w-.012,h-.012,.009,'d8d0ad');
  box(x,y+h*.31,z+.017,w*.86,h*.17,.009,red?'985d53':'53666c');
  for(let i=0;i<4;i++)for(let row=0;row<2;row++){let dx=x-w*.32+i*w*.19,dy=y+.01-row*h*.23;
    box(dx,dy,z+.018,w*.077,h*.035,.007,'686a64');box(dx-w*.021,dy-h*.044,z+.019,w*.018,h*.10,.008,'67685e');
    if((i+row)%2)box(dx+w*.026,dy-h*.07,z+.019,w*.035,h*.022,.007,'6b6c62');}}
 placard(cx+.34,1.45,zz+.062,.291,.196,false);box(cx-.135,1.39,zz+.065,.081,.396,.015,'adaa97');box(cx-.135,1.531,zz+.075,.057,.034,.012,'875d58');for(let i=0;i<7;i++){let yy=1.50-.045*i;box(cx-.137,yy,zz+.078,.037,.009,.006,'855951');box(cx-.134,yy-.012,zz+.079,.011,.031,.007,'785957');}
 
 // Electrical service with folds, flanges, lug screws and curved conduits.
 for(const [x,y,w,h] of [[4.10,1.25,.36,.44],[4.13,.78,.19,.26],[4.40,1.51,.32,.40]]){
   box(x,y,zf+.09,w,h,.145,'5f6b6d');box(x,y,zf+.165,w-.023,h-.028,.023,'7b8784');box(x,y+h/2+.016,zf+.102,w+.047,.038,.18,'95a09b');
   box(x+w*.31,y-.024,zf+.182,.018,.045,.015,'515c5d');
   for(const side of [-1,1])box(x+side*w*.35,y+h*.35,zf+.181,.013,.013,.009,'a4aaa0');
   line([[x-w*.22,y-h*.5,zf+.09],[x-w*.22,y-h*.5-.13,zf+.075],[x-w*.22-.06,y-h*.5-.18,zf+.06],[x-w*.22-.06,.10,zf+.06]],.017,'677476',8);
 }
 for(let j=0;j<3;j++){let y=2.25+j*.046;line([[4.57,y-.16,zf+.065],[4.57,y-.056,zf+.065],[4.39,y,zf+.065],[xl+.14,y,zf+.065],[xl-.044,y-.008,zf+.021],[xl-.046,y-.013,zb+.11]],.0135,'737e7c',8)}
 // External hut side: vent with slats, horizontal panel joints and runoff.
 const zzs=-.28;box(xl-.021,1.73,zzs,.037,.36,.46,'596564');
 for(let j=0;j<9;j++)box(xl-.046,1.56+j*.04,zzs,.041,.019,.417,'87918a');
 for(let i=0;i<42;i++){let x=xl+.085+rand()*(xr-xl-.17),y=rand()*2.57;
   if(x>cx-dw*.55&&x<cx+dw*.55&&y<2.14)continue;
   let l=.024+rand()*.13,w=.004+rand()*.018,z=zf+.0032;
   tri([x,y,z],[x+w,y-.011,z],[x+w*.47,y-l,z],i%4?'76817d':'909792')}
 for(let i=0;i<34;i++){let z=zb+.055+rand()*(zf-zb-.115),y=.30+rand()*2.24,h=.025+rand()*.19,w=.005+rand()*.02;
   tri([xl-.003,y,z],[xl-.003,y-.014,z+w],[xl-.003,y-h,z+w*.4],i%4?'78847f':'969b92')}
 // Patchy exposed undercoat on both steel leaves: overlapping irregular,
 // hand-built flecks, not a repeating texture.
 for(let i=0;i<172;i++){const X=cx+(rand()-.5)*(dw-.045),Y=.064+rand()*1.94;let w=.002+rand()*.018,h=.005+rand()*.028,Z=zz+.055;
  let p=[X,Y,Z],q=[X+w,Y+.003,Z],r=[X+w*.94,Y-h*.66,Z],a=[X+w*.26,Y-h,Z];quad(p,a,r,q,(i%3)?'4d5957':'68746b');
  if(i%7===0)tri([X,Y-h,Z+.001],[X+w*.27,Y-h*.9,Z+.001],[X+w*.1,Y-h*2.8,Z+.001],'54615d')}
 // Rear outside stair, pipe wall and a vent unit reward walking around.
 for(let j=0;j<5;j++)box(4.12,.06+.07*j,1.72-j*.21,.95,.12+.14*j,.22,j%2?'919894':'858e8b');
 for(const x of [3.64,4.60]){line([[x,1.03,1.8],[x,1.03,1.65],[x,1.60,.76],[x,1.60,.59]],.022,'828c89',8);for(let i=0;i<3;i++)rod([x,.08+i*.19,1.69-i*.43],[x,1.03+i*.235,1.69-i*.43],.015,'697775',7)}
 box(4.12,2.568,-.48,.77,.118,.39,'87938c');box(4.12,2.637,-.48,.82,.021,.432,'9aa197');
 for(let i=0;i<4;i++)box(4.12,2.527+.025*i,-.279,.63,.010,.012,'576864');
}function garden(g){
 const {box,rod,tri,quad,loft}=g;const rng=random(98461),soil='4c4747';
 const leafs=['566951','61745e','758269','455d53','667b61','829076','4d6558','70816a'];
 function leaf(a,b,w,col,phase){
   let d=unit(sub(b,a)),u=mul(unit(cross(d,Math.abs(d[1])<.96?[0,1,0]:[0,0,1])),w),mid=add(a,mul(sub(b,a),.47)),fold=add(mid,[0,.005,0]);
   let l=add(mid,u),r=sub(mid,u);
   tri(a,l,fold,col);tri(a,fold,r,col);tri(l,b,fold,col);tri(fold,b,r,leafs[(phase+2)%8]);
 }
 function planter(x,z,w,d,h,cl){box(x,h/2,z,w,h,d,cl);box(x,h-.025,z,w+.045,.065,d+.048,cl);box(x,h+.007,z,w-.058,.02,d-.06,soil);
  for(let j=0;j<4;j++){let xx=x-w*.36+j*w*.24;box(xx,.09,z+d*.501,.012,.081,.009,'78817c')}
 }
 const beds=[[-3.30,-.87,1.24,.46,.33,'857e72'],[-2.23,-.95,.71,.43,.28,'838782'],[-4.96,-.61,1.29,.50,.40,'777f79'],[-5.13,.66,.95,.47,.31,'797a6f'],[-3.81,3.83,.91,.45,.34,'878879'],[-5.13,4.78,1.16,.47,.35,'878478']];
 for(const [ix,bed] of beds.entries()){const [x,z,w,d,h,k]=bed;planter(x,z,w,d,h,k);
  for(let j=0;j<(ix===0?24:13);j++){let bx=x+(rng()-.5)*(w-.09),bz=z+(rng()-.5)*(d-.07),ht=(ix===0?.33:.25)+rng()*(ix===0?.62:.44);let ax=(rng()-.5)*.25,az=(rng()-.5)*.23,t=TAU*rng(),sway=(rng()-.5)*.10;
   let pt=f=>[bx+ax*f+sway*s(f*Math.PI),h+ht*f,bz+az*f];
   let stem='65725a';rod(pt(0),pt(.57),.007,stem,5,.0043);rod(pt(.57),pt(1),.004,stem,5,.0017);
   for(let l=0;l<8;l++){let f=.18+l*.095,angle=t+l*2.38+.16*rng(),sz=(1-f*.62)*(.095+rng()*.067),q=pt(f),b=[q[0]+c(angle)*sz,q[1]+.017+.053*rng(),q[2]+s(angle)*sz];
    leaf(q,b,(ix===1?.017:.022)+.006*rng(),leafs[Math.floor(rng()*8)],l);
    if(l<4){let q2=add(q,mul(sub(b,q),.59));leaf(q2,[b[0]+.017*c(angle-.89),b[1]+.015,b[2]+.041*s(angle-.89)],.013,'737f65',l)}
   }
  }
 }
 // Extra unglazed pot and a small spiky yucca distinguish shapes in silhouette.
 const px=-2.59,pz=-.51;loft([[.02,.105,.10,px,pz],[.06,.109,.104,px,pz],[.26,.150,.144,px,pz],[.29,.155,.148,px,pz]],'948378',15);
 for(let j=0;j<24;j++){const a=j*2.4,r=.13+rng()*.13,ht=.25+rng()*.38;leaf([px,.255,pz],[px+c(a)*r,.26+ht,pz+s(a)*r],.014,leafs[j%8],j)}
}
function equipment(g){
 const {box,rod,line,loft,egg}=g;
 // Non-hero side of the roof: ribbed service reservoir, overflow pipe, access
 // ladder and cooling units. Positions intentionally clear the key skyline.
 const x=3.74,z=4.57,r=.53;
 for(const dx of [-.34,.34])for(const dz of [-.31,.31])box(x+dx,.168,z+dz,.091,.34,.088,'737e7d');
 box(x,.32,z,1.15,.12,1.14,'707b79');
 loft([[.38,r*.86,r*.86,x,z],[.44,r,r,x,z],[1.47,r,r,x,z],[1.53,r*.97,r*.97,x,z],[1.61,r*.68,r*.68,x,z],[1.63,r*.44,r*.44,x,z]],'909a93',28);
 for(let j=0;j<4;j++)loft([[.48+j*.30,r+.005,r+.005,x,z],[.49+j*.30,r+.015,r+.015,x,z],[.515+j*.30,r+.015,r+.015,x,z],[.526+j*.30,r,r,x,z]],'788783',26);
 loft([[1.627,.167,.167,x,z],[1.66,.167,.167,x,z]],'747f7b',18);
 for(const dx of [-.16,.16])rod([x+dx,.19,z+.55],[x+dx,1.64,z+.55],.014,'939d99',7);
 for(let j=0;j<7;j++)rod([x-.16,.27+j*.192,z+.55],[x+.16,.27+j*.192,z+.55],.011,'909896',7);
 line([[x+.51,.73,z],[x+.72,.73,z],[x+.77,.67,z],[x+.77,.13,z],[x+.82,.087,z],[4.80,.087,z]],.037,'788482',8);
 for(let j=0;j<2;j++){let X=-3.83+j*.96,Z=5.76;box(X,.37,Z,.81,.65,.39,'939b97');box(X,.699,Z,.84,.027,.41,'a4aaa3');
   egg([X-.12,.37,Z-.201],[.235,.234,.010],'4d5b60',18,8);
   for(let i=0;i<10;i++){let y=-.20+i*.044,L=Math.sqrt(Math.max(0,.228**2-y*y));rod([X-.12-L,.37+y,Z-.222],[X-.12+L,.37+y,Z-.222],.003,'8b9391',5)}
   for(let i=0;i<9;i++)box(X+.253,.21+i*.025,Z-.206,.124,.009,.01,'677572');
 }
}

// Deliberately modeled from the reference-prop silhouettes, not painted cards.
function foregroundEquipment(g){
 const {box,rod,line,loft,egg,quad,tri}=g;
 // Large stone planter/windbreak entrance, chipped copings, and vines draped
 // over the short right return. Roof garden opens into a narrower service path.
 const x0=-5.74,x1=-1.82,z0=-.21,z1=.59,h=1.025,wall='657079';
 box((x0+x1)/2,h/2,z1,x1-x0,h,.15,wall);box(x1-.067,h/2,(z0+z1)/2,.14,h,z1-z0,wall);
 box((x0+x1)/2,h+.02,z1,x1-x0+.11,.069,.228,'9ba4a2');box(x1-.067,h+.02,(z0+z1)/2,.22,.069,z1-z0+.19,'8e9899');
 box((x0+x1)/2,h-.073,z1+.039,x1-x0+.041,.041,.147,'48565e');
 // A separate planter lip behind the parapet catches the cool sky and runs
 // diagonally to the hero screen's left edge.
 box((-5.78-2.79)/2,.86,.19,2.99,.11,.167,'9aa4a2');
 for(let j=0;j<4;j++){let z=.40-j*.141;box(x1+.019,.557,z,.03,.68,.053,'6f777b')}
 const rng=random(6255),cl=['4e6857','546e58','65765d','637d67','405b52'];
 function vineLeaf(p,ang,size,k){
  const u=[c(ang),0,s(ang)],v=[-s(ang),0,c(ang)],P=(f,w,h=0)=>add(add(add(p,mul(u,size*f)),mul(v,size*w)),[0,size*(-.80*f+h),0]),
  base=P(.02,0),lobeL=P(.17,-.58,.035),notchL=P(.39,-.30,.027),flareL=P(.54,-.35,.01),tip=P(1,0,-.025),flareR=P(.57,.31,.014),notchR=P(.36,.28,.016),lobeR=P(.17,.51,.04),rib=P(.42,-.018,.18);
  const shade=mix(rgb(k),rgb('344d47'),.16);const rim=[base,lobeL,notchL,flareL,tip,flareR,notchR,lobeR];for(let i=0;i<rim.length;i++)tri(rim[i],rib,rim[(i+1)%rim.length],i<4?k:shade)
 }
 for(let j=0;j<25;j++){let start=-1.7-rng()*1.73,a=rng()*TAU,len=.14+rng()*.38,off=(rng()-.5)*.15;
   let p=[start,h+.094,z1-.03],sides=5+Math.floor(rng()*4);
   for(let i=1;i<=sides;i++){let t=i/sides,q=[start+off*t+.029*s(a+t*4),h+.099-len*t*t,z1+.02+Math.min(t*2,1)*.092];
     rod(p,q,.0035,'546550',5);vineLeaf(q,i*2.4+a,.035+rng()*.037,cl[(i+j)%5]);p=q}
 }
 // Slatted refuse shelter with a weathered corrugated canopy below the right
 // utility boxes. Behind it accidental greenery climbs the shaded conduit side.
 const binStart=g.vert.length,x=1.53,z=.26;
 box(x,.35,z,.47,.67,.60,'576766');box(x,.04,z,.58,.08,.69,'77827b');
 for(const side of [-1,1]){box(x+side*.267,.385,z,.035,.66,.64,'51616a');for(let j=0;j<8;j++)box(x+side*.284,.38,z-.27+j*.078,.019,.57,.028,'75827e')}
 // Corrugations are a folded continuous 0.9 mm steel sheet, not a row
 // of tubes. Opening silhouettes are visible only beneath the windward lip.
 const span=.690,left=x-span/2,zBack=z-.376,zFront=z+.379,waves=11,cols=77;
 const sheet=(u,v,dy=0)=>{let xx=left+span*u,zz=zBack+(zFront-zBack)*v;
   let h=.795-v*.070+.010*c(TAU*waves*u)+.0026*s(5.2*u+.9*v)+dy;return [xx,h,zz]};
 for(let i=0;i<cols;i++){let a=i/cols,b=(i+1)/cols;
   for(let j=0;j<3;j++){let lo=j/3,hi=(j+1)/3;quad(sheet(a,lo),sheet(a,hi),sheet(b,hi),sheet(b,lo),i%7<3?'6c797a':'647274')}
   quad(sheet(a,1),sheet(a,1,-.007),sheet(b,1,-.007),sheet(b,1),i%7<4?'637475':'536166');
   quad(sheet(b,0),sheet(b,0,-.006),sheet(a,0,-.006),sheet(a,0),'5c6d6f');
 }
 for(const u of [0,1])quad(sheet(u,0),sheet(u,1),sheet(u,1,-.009),sheet(u,0,-.009),'67777b');
 for(const t of [1/11,5/11,9/11])for(const v of [.13,.79]){let p=sheet(t,v);rod([p[0],p[1],p[2]],[p[0],p[1]+.004,p[2]],.006,'899390',6)}
 box(x,.704,z+.28,.64,.027,.032,'516469');

 for(let j=binStart;j<g.vert.length;j+=3){g.vert[j+1]*=1.28;const N=unit([g.norm[j],g.norm[j+1]/1.28,g.norm[j+2]]);for(let k=0;k<3;k++)g.norm[j+k]=N[k]}
 for(let i=0;i<55;i++){const side=i%2?1:-1,bx=x+side*(.25+.095*rng()),bz=z+.33-.6*rng(),ht=.14+rng()*.63,ux=(rng()-.5)*.16,uz=(rng()-.5)*.14;
   const base=[bx,.04,bz],top=[bx+ux,ht,bz+uz];rod(base,top,.004,'435b50',5);
   for(let j=0;j<5;j++){let t=.23+j*.145,p=add(base,mul(sub(top,base),t));vineLeaf(p,i*1.7+j*2.24,.023+rng()*.031,cl[(j+i)%5])}
 }
}
function sidePanels(g){
 const {box,line,rod,quad,tri}=g;const x=1.641,wrap='6e7e82',shadow='3f5059';
 // Side-mounted meter cabinets at roof lip and waist height, not window cards.
 for(const [z,y,w,h,depth] of [[-.46,2.20,.44,.41,.21],[-.12,2.30,.29,.39,.13],[-.49,1.49,.37,.35,.18],[-.06,1.39,.45,.52,.22]]){
  box(x-depth/2,y,z,depth,h,w,shadow);box(x-depth-.012,y,z,.029,h-.025,w-.023,wrap);
  box(x-depth*.55,y+h*.5+.014,z,depth+.06,.037,w+.046,'8a9294');
  for(const v of [-1,1]){box(x-depth-.033,y+h*.35,z+v*w*.37,.006,.016,.016,'a0a4a0');}
  for(let i=0;i<2;i++){let dz=(i-.5)*.075;line([[x-depth*.73,y-h*.50,z+dz],[x-depth*.73-.013,y-h*.5-.15,z+dz],[x-depth*.73-.004,y-h*.5-.22,z+dz+.067],[x-.075,.89,z+dz+.12],[x-.055,.84,z+dz+.10],[x-.036,.836,z+dz+.025]],.012,'46575b',7)}
 }
 // Strong layered cantilever, plus raised flush fluorescent fixture above
 // the doors; dark daylight glazing, not a brightly illuminated light.
 box(3.22,2.29,.53,2.46,.19,.55,'47585f');box(3.22,2.407,.53,2.52,.047,.59,'6c7e82');
 box(3.22,2.43,.53,2.55,.022,.61,'8d999b');
 box(2.66,2.10,.56,.68,.069,.21,'4f5f64');box(2.66,2.084,.674,.58,.057,.017,'899595');
 for(const xx of [2.339,2.981])box(xx,2.11,.57,.028,.075,.21,'728189');
}
function vhf(g){
 const {rod,box,line,quad}=g,x=1.97,z=-.38,base=2.57,metal='515c69';
 // Two distinctly angled rooftop Yagis in profile. Each uses a real folded
 // mesh reflector and open boom, so aperture stays transparent in close-ups.
 box(x,base,z,.18,.039,.16,'798387');rod([x,base,z],[x,4.78,z],.014,'4b5966',10,.008);
 for(let i=0;i<3;i++){let a=.6+i*TAU/3,xx=x+.26*c(a),zz=z+.26*s(a);rod([xx,base+.018,zz],[x,3.03,z],.009,'66717a',7);box(xx,base+.025,zz,.064,.03,.07,'87918d')}
 box(x,2.989,z+.009,.207,.159,.126,'52616b');box(x-.083,2.99,z+.08,.009,.15,.016,'8d969a');
 box(x,3.19,z,.074,.069,.064,'586772');
 function unitY(y,L,count,scale){const u=unit([.90,-.54,.18]),v=unit([.29,-.06,-.955]);const origin=[x,y,z],p=(j,w=0,h=0)=>add(add(add(origin,mul(u,j)),mul(v,w)),[0,h,0]);
  const tail=-L*.58,end=L*.42;rod(p(tail),p(end),.0062*scale,'46525e',7);
  for(let j=0;j<count;j++){let t=tail+(end-tail-.13)*j/(count-1),width=(.088+.060*j/count)*scale;
    rod(p(t,-width),p(t,width),.0045*scale,metal,5)}
  for(const side of [-1,1])line([p(-.04,side*.095),p(.19,side*.09,-.018),p(end,side*.10),p(end+.075,side*.10,.008)],.0042,'475663',5);
  const W=.18*scale,H=.166*scale,fold=.075*scale;const mesh=(w,h)=>p(end+fold*(1-Math.abs(h)/H),w,h);
  for(let i=0;i<=6;i++){let w=(i/3-1)*W;line([mesh(w,-H),mesh(w,0),mesh(w,H)],.0043*scale,'465360',5)}
  for(let j=0;j<=8;j++){let h=(j/4-1)*H;rod(mesh(-W,h),mesh(W,h),.0039*scale,'475663',5)}
  line([p(.17,-.042),p(.18,-.045,-.10),p(.29,-.016,-.19),p(.38,.02,-.21),p(end,.018,-.18)],.0038,'505b63',5);
 }
 unitY(4.19,.92,18,1);unitY(3.71,.66,11,.72);
 // Two coax loops are looser than the tensioned stays below.
 line([[x+.014,4.23,z],[x+.06,4.07,z+.029],[x+.13,3.93,z+.065],[x+.135,3.82,z+.072],[x+.09,3.75,z+.071],[x+.029,3.78,z+.048]],.0042,'414e5a',5);
 for(const [dx,dz] of [[1.43,.17],[.85,-.25]])line([[x+.047,4.21,z],[x+dx*.40,3.20,z+dz*.4],[x+dx,base+.02,z+dz]],.0045,'50606a',5);
 line([[x+.03,3.55,z],[x+.18,3.29,z+.055],[x+.36,3.13,z+.024],[x+.297,3.078,z],[x+.13,2.99,z],[x-.01,2.80,z]],.0039,'475863',5);
}function wildShrubs(g){
 const {rod,line,tri,quad}=g,rnd=random(7288),col=['405e51','5e785b','6a8569','37594c','789178','4e7059'],trunk='4a504a';
 function leaf(p,t,size,tilt,wind,shade){
  const u=[c(t),0,s(t)],v=[-s(t),0,c(t)],w=size*(.22+.12*rnd());let end=add(p,add(mul(u,size),[0,tilt*size,0])),tip=add(end,[wind*.01,-.22*size,0]),mid=add(p,add(mul(u,size*.5),[0,(tilt+.24)*size*.53,0])),hi=add(mid,[0,.010,0]),l=add(mid,mul(v,w)),r=sub(mid,mul(v,w));tri(p,l,hi,shade);tri(l,tip,hi,shade);tri(p,hi,r,col[1]);tri(hi,tip,r,shade)
 }
 function broad(x,z,h,r,base,seed){
  const start=[x,base,z],top=[x+r*.15,base+h,z+.03];
  const spine=t=>[x+r*.19*s(t*2.6+seed)*t,base+h*t,z+r*.16*c(t*2.4+seed)*t];for(let k=1;k<5;k++)rod(spine((k-1)/4),spine(k/4),(.019-.0028*k),trunk,7,.016-.0026*k);
  for(let j=0;j<25;j++){let f=.25+j*.028,a=seed+j*2.4+(rnd()-.5)*.66,len=(.26+.52*s(f*2.9))*r*(.62+.40*rnd()),w=spine(f),sl=.03+.09*rnd(),mid=add(w,[len*c(a)*.60,sl,len*s(a)*.60]),q=add(w,[len*c(a),sl+.04,len*s(a)]);
   line([w,mid,q],.0045,'52604c',5);leaf(q,a,.076+rnd()*.072,-.44+.4*rnd(),1,col[j%6]);
   for(let k=0;k<5;k++){let v=add(w,mul(sub(q,w),.29+k*.14)),angle=a+(k%2?1:-1)*(.60+.35*rnd());leaf(v,angle,.065+rnd()*.078,-.30+.72*rnd(),1,col[(k+j)%6])}
  }
 }
 function fern(x,z,h,r,base,count){
  for(let j=0;j<count;j++){let t=j*2.4+rnd()*.4,L=r*(.5+.65*rnd()),H=h*(.54+.60*rnd()),p=u=>[x+c(t)*L*u,base+H*(.98*s(u*2.28)+.045*u),z+s(t)*L*u];
   for(let i=1;i<6;i++)rod(p((i-1)/5),p(i/5),.0045*(1-i*.1),'69765d',5);
   for(let k=1;k<=10;k++){let u=k*.091,q=p(u),size=.025+.10*s(u*3.06);for(const side of [-1,1]){
     let a=t+side*(1.08-.46*u),d=[c(a)*size,size*(.40-.38*u),s(a)*size],e=add(q,d),m=add(q,mul(d,.52)),v=[-.020*s(a)*s(u*Math.PI),.004,.020*c(a)*s(u*Math.PI)];tri(q,add(m,v),e,col[(j+k)%6]);tri(q,e,sub(m,v),col[(j+k+2)%6])}
   }
  }
 }
 broad(-2.22,-.86,1.24,.39,.31,3.2);broad(-2.75,-.81,.96,.36,.31,1.7);broad(-2.93,-.30,.78,.32,.49,2.3);broad(-1.99,-.51,.81,.27,.34,4.8);
 fern(-1.89,-.42,1.03,.55,.27,26);fern(-2.28,-.48,.72,.41,.27,15);fern(-1.83,-.85,.65,.45,.28,17);
 broad(1.76,.46,.75,.25,.13,.8);broad(1.54,.21,.48,.22,.08,3.1);
}
function reverseServices(g){
 const {box,rod,line,tri,ellipse}=g,steel='84908d',dark='55666a';const x=4.69;
 // Sleeved pipe runs and elbows on small concrete sleepers at building edge.
 for(let i=0;i<3;i++){
  const xx=x-i*.104;line([[xx,.21,.92],[xx,.21,3.64],[xx-.032,.22,3.71],[xx-.087,.23,3.75],[3.81,.23,3.75],[3.76,.29,3.78],[3.76,.54,3.78]],.031-i*.004,steel,8);
  for(let z=1.05;z<3.72;z+=.55){rod([xx,.21,z-.022],[xx,.21,z+.022],.039-i*.004,'777f79',8);box(xx,.145,z,.064,.123,.056,'697778')}
 }
 for(let z=1.15;z<3.6;z+=.69)box(x-.10,.06,z,.44,.12,.14,'858c84');
 // A maintenance valve and two independent disconnect boxes distinguish the
 // service area from the distant buildings even in rear macro views.
 rod([x-.09,.21,2.49],[x-.09,.42,2.49],.024,dark,8);const cx=x-.09,cz=2.49;
 for(let j=1;j<=16;j++){let a=(j-1)*TAU/16,b=j*TAU/16;rod([cx+.105*c(a),.43,cz+.105*s(a)],[cx+.105*c(b),.43,cz+.105*s(b)],.009,'8a6257',6);if(j%4===0)rod([cx,.428,cz],[cx+.102*c(b),.428,cz+.102*s(b)],.007,'8a6257',6)}
 for(const [X,Z] of [[2.2,-.925],[2.93,-.925]]){box(X,1.37,Z,.52,.57,.14,'657675');box(X,1.37,Z-.083,.48,.534,.031,'84918d');box(X,1.68,Z-.013,.58,.042,.199,'9aa19a');box(X-.18,1.37,Z-.105,.020,.075,.018,'424f55');
  for(const side of [-1,1])line([[X+side*.12,1.08,Z],[X+side*.12,.86,Z],[X+side*.12+.08,.80,Z],[X+side*.12+.08,.38,Z]],.017,dark,8)}
 // Streaked repaired roof panels, inlaid and correctly upward facing, not
 // nearly coplanar dark-overlay triangles.
 for(let j=0;j<4;j++){const X=-3.58+j*.63,Z=4.20+j*.19;box(X,.012,Z,.42,.012,.085,j%2?'748082':'727b7c')}
}function extraParts(){return [bake('rooftop',g=>{deck(g);finishes(g,true)}),bake('hut',g=>{hut(g);sidePanels(g);finishes(g);plaqueAndLatch(g)}),bake('antenna',vhf),bake('plantings',g=>{garden(g);wildShrubs(g);foregroundEquipment(g);thicket(g)}),bake('utility',g=>{equipment(g);reverseServices(g);serviceGround(g)})]}

// Bilinear stochastic painting on the *surfaces* of the steel leaves and wall.
// Triangles carry interpolated linear albedo. No downloaded textures or image data.
function finishes(g,floorOnly=false){
 const {box,rod,line,egg,tri}=g;
 const hash=(i,j,seed)=>{let h=Math.imul(i,1597334677)^Math.imul(j,3812015801)^seed;h=Math.imul(h^(h>>>15),2246822519);return ((h^(h>>>13))>>>0)/4294967295};
 const sm=t=>t*t*(3-2*t);
 function noise(u,v,seed){let i=Math.floor(u),j=Math.floor(v),a=sm(u-i),b=sm(v-j),x=hash(i,j,seed)*(1-a)+hash(i+1,j,seed)*a,y=hash(i,j+1,seed)*(1-a)+hash(i+1,j+1,seed)*a;return x*(1-b)+y*b}
 function panel(origin,U,V,n,cols,rows,c1,c2,seed,pattern){
  const low=rgb(c1),hi=rgb(c2),rgbv=[],pts=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){let u=i/cols,v=j/rows,warp=noise(u*4,v*5,seed)*.3,
   a=noise(u*4.7,v*5.1,seed)+.58*noise(u*11+warp,v*18,seed+713)+.22*noise(u*53,v*37,seed+27);
   let streak=noise(u*22+warp*.21,v*2.8,seed+3),t=.14+.67*(a/1.8)+.15*(streak-.5)+(pattern?pattern(u,v,streak):0);
   pts.push(add(add(origin,mul(U,u)),mul(V,v)));rgbv.push(mix(low,hi,Math.min(1,Math.max(0,t))));
  }
  function f(a,b,d){tri(pts[a],pts[b],pts[d],rgbv[a],[n,n,n]);const off=g.color.length-9;for(let k=0;k<3;k++){g.color[off+3+k]=rgbv[b][k];g.color[off+6+k]=rgbv[d][k]}}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let id=j*(cols+1)+i;f(id,id+1,id+cols+2);f(id,id+cols+2,id+cols+1)}
 }
 // Subtle natural value modulation across concrete bays, with capillary
 // darkening at edges and water staining concentrated beside real drains.
 if(floorOnly){panel([-5.845,.0034,-2.051],[10.939,0,0],[0,0,8.795],[0,1,0],59,48,'68767a','929b97',63275,(u,v,st)=>{
  const edge=Math.min(u,1-u,v,1-v),sink=.30*Math.exp(-((u-.63)**2/.0025+(v-.04)**2/.002))+.22*Math.exp(-((u-.11)**2/.003+(v-.06)**2/.008));
  return .055*s(u*8+v*3)-.24*Math.exp(-edge*17)-sink+.07*(st-.5)});return;}
 // Cool, muted olive-gray fire doors: drier around the central top, darker at
 // edges and rain-marked near the threshold. A thin wet edge on the jamb
 // catches blue city light while the recessed gap stays dark.
 const xc=2.67,zc=.4786,dw=1.26;for(const side of [-1,1]){let x=xc+side*(dw/4+.007),w=dw/2-.018,lat=side>0?5168:4811;
 panel([x-w/2,.022,zc],[w,0,0],[0,2.025,0],[0,0,1],24,54,'414f4e','879085',lat,(u,v,st)=>.17*Math.sin(v*Math.PI)-.35*Math.exp(-Math.min(u,1-u)*15)-.18*Math.exp(-v*10)-.20*Math.max(0,st-.50));
 }
 panel([1.638,0,-.795],[0,0,1.177],[0,2.42,0],[-1,0,0],35,54,'536569','879799',48791,(u,v,st)=>.19*s(v*2.4)-.32*Math.exp(-v*5)-.19*Math.exp(-(1-v)*9)-.26*Math.max(0,st-.6));
 panel([1.644,.005,.3925],[3.051,0,0],[0,2.42,0],[0,0,1],52,44,'4b5d62','7f9090',252185,(u,v,st)=>.09*s(v*2.5)-.20*Math.exp(-v*6)-.32*Math.exp(-(1-v)*7)-.24*Math.max(0,st-.6));
 // Asymmetrical door scars: grouped chips, e.g. where hands use the latch,
 // plaster blisters beneath conduit, scuffed sill and old rain stains.
 const rng=random(89116),colors=['48534f','394847','69766f','7b8170','58665d'];
 for(const [cx,cy,R,N] of [[2.22,1.78,.106,24],[2.33,.62,.086,18],[2.57,1.04,.039,16],[3.11,1.52,.1,21],[3.16,.23,.07,14],[2.34,.12,.17,20]]){
  for(let j=0;j<N;j++){let a=rng()*TAU,r=R*Math.sqrt(rng()),x=cx+r*c(a),y=cy+r*s(a),w=.003+rng()*.015,h=.003+rng()*.021;
   tri([x,y,.4818],[x+w*.20,y-h,.4818],[x+w,y-h*.38,.4818],colors[j%colors.length]);if(j%4===0)tri([x+w*.10,y-h*.4,.482],[x+w*.37,y-h*.68,.482],[x+w*.23,y-h*(2+rng()),.482],'515c51')}
 }
 // Return around the primary door doubles the apparent frame depth; no
 // painted black outline is used to stand in for the physical reveal.
 const edge=xc-dw/2-.046;
 box(edge,.998,.463,.015,1.956,.050,'526069');box(edge+.015,1.026,.466,.009,2.009,.07,'859293');
 for(const side of [-1,1]){let xx=xc+side*(dw/2-.018);for(const y of [.26,.84,1.73]){rod([xx,y-.018,.479],[xx,y+.027,.479],.009,'8d9183',8);box(xx-side*.018,y,.482,.020,.034,.007,'677168')}}
 // Vertical Japanese maintenance warning, drawn here from individual
 // stroke paths (立入禁止), including its red no-entry pictogram above.
 const plateX=2.535,plateY=1.39,pz=.506;
 box(plateX,plateY,pz,.074,.386,.006,'aca891');box(plateX,plateY+.177,pz+.004,.042,.011,.003,'8b8c73');
 let icon=plateY+.127,r=.021;for(let j=1;j<=16;j++){let a=(j-1)*TAU/16,b=j*TAU/16;rod([plateX+r*c(a),icon+r*s(a),pz+.009],[plateX+r*c(b),icon+r*s(b),pz+.009],.0038,'955b58',5)}
 rod([plateX-.015,icon+.016,pz+.010],[plateX+.015,icon-.016,pz+.010],.0034,'955b58',5);
 const chars=[
 [[[3.8,8],[4.6,6.8]],[[1.0,6.2],[7.1,6.2]],[[2,5.4],[3.1,2.1]],[[5.9,5.5],[4.9,1.9]],[[.5,1.3],[7.6,1.3]]],
 [[[2.4,7.7],[4.3,6.2],[5.7,3.3],[7.5,1.2]],[[4.4,6.4],[3.6,4.7],[2.5,2.7],[.8,1.2]]],
 [[[1.8,8],[1.8,4.7]],[[.1,7.1],[3.5,7.1]],[[1.8,6.8],[.1,5.1]],[[1.9,6.8],[3.3,5.5]],[[5.7,8],[5.7,4.7]],[[4.1,7.1],[7.6,7.1]],[[5.6,6.8],[4.1,5.1]],[[5.9,6.8],[7.8,5.1]],[[1.7,4.0],[6.3,4.0]],[[.7,3.0],[7.3,3.0]],[[4.1,3],[4.1,.6],[3.1,.8]],[[2.3,2.2],[1.1,1.0]],[[5.9,2.2],[7.1,1]]],
 [[[4.2,8],[4.2,1.1]],[[4.2,5.4],[7.1,5.4]],[[1.8,5.3],[1.8,1.1]],[[.4,1.1],[7.7,1.1]]]];
 for(let k=0;k<4;k++)for(const stroke of chars[k])line(stroke.map(([ux,uy])=>[plateX+(ux-4)*.0071,plateY+.052-k*.053+(uy-4)*.0059,pz+.010]),.0021,'884e4e',4);
 // Projecting rainproof fixture with chamfered lens, hood side-cheeks and
 // sockets. Its dark cloudy glass receives ambient light; it is switched off.
 let X=2.66,Y=2.141,Z=.637;box(X,Y+.045,Z,.703,.033,.195,'53636c');box(X,Y-.016,Z+.078,.628,.082,.047,'71818a');
 box(X,Y-.012,Z+.104,.551,.047,.009,'9aabaa');box(X,Y-.038,Z+.106,.545,.007,.01,'596e7b');
 for(const ss of [-1,1]){box(X+ss*.318,Y+.005,Z+.070,.027,.099,.092,'78878b');rod([X+ss*.327,Y+.032,Z+.115],[X+ss*.327,Y+.032,Z+.122],.006,'a0a5a4',7)}
 // Details are wrapped onto the outward and forward-facing surfaces, so
 // the service box doesn't become a flat black rectangle in the hero angle.
 for(const [z,y,w,h,depth] of [[-.46,2.20,.44,.41,.21],[-.12,2.30,.29,.39,.13],[-.49,1.49,.37,.35,.18],[-.06,1.39,.45,.52,.22]]){
  const far=1.641-depth-.027,front=z+w/2+.004;
  panel([far,y-h*.46,z-w*.42],[0,0,w*.84],[0,h*.90,0],[-1,0,0],7,11,'536567','7e8c89',Math.floor(y*999),(u,v)=>-.16*(1-v));
  box(1.641-depth*.56,y,front,depth*.78,h*.83,.013,'5a6b70');box(1.641-depth*.56,y-.01,front+.009,depth*.56,h*.70,.009,'728487');
  if(y<1.7){let xx=1.641-depth*.56;egg([xx,y+.035,front+.020],[.045,.044,.007],'425c69',12,6);
    egg([xx-.002,y+.035,front+.027],[.033,.031,.003],'829ba0',12,6);rod([xx-.015,y+.032,front+.032],[xx+.009,y+.049,front+.032],.0027,'44545b',5);
    box(xx,y-.093,front+.021,.049,.026,.008,'8b8774');}
  for(const dy of [-1,1]){box(1.641-depth*.83,y+dy*h*.36,front+.018,.013,.015,.007,'a0aaa2');rod([far-.012,y+dy*.06,z+w*.31],[far-.012,y+dy*.06,z+w*.36],.007,'87918b',7)}
 }
}function thicket(g){
 const {rod,tri,quad,box}=g,rng=random(169799);
 // A Japanese mock-orange style branching evergreen: dark interior foliage
 // cushions interleaved with distinct curled leaves in the moonlight.
 const deep=['334b42','395648','456150','425b4c','50674e'],lit=['627d61','718a71','5d7a68','526e56','819478'];
 // Interiors are made of crossed leafy branch sprays, not hidden sphere
 // approximations: held-out side and reverse views see a real irregular
 // envelope, with gaps and differently hanging tips even inside the crown.
 function innerSpray(p,ax,ay,az,phase){
  const k=Math.floor(phase*23),branch=[p[0]-.017*c(phase),p[1]-.038,p[2]-.017*s(phase)];let paint;
  for(let j=0;j<9;j++){const a=phase+j*2.39+.25*s(j*2.1+phase),f=(j+.6)/9,d=.25+.57*c(f*Math.PI/2),R=[p[0]+ax*d*c(a),p[1]+ay*(.05+.75*f),p[2]+az*d*s(a)];
   if(j%3===0)rod(branch,R,.0022,'475b4c',4,.0014);paint=deep[(j+k)%deep.length];
   blade(R,a,(.56+.41*(1-f))*ax,(.20+.034*(j%3))*ax,-.64+.52*f,paint);}
 }
 const sideShades=new Map();function blade(p,ang,L,W,pitch,shade){
  let u=[c(ang),0,s(ang)],v=[-s(ang),0,c(ang)],point=(t,sw,h)=>add(add(add(p,mul(u,t*L)),mul(v,sw*W)),[0,h*L,0]),
  a=p,b=point(.38,-1,.38*pitch+.11),d=point(.79,-.59,.79*pitch+.06),tip=point(1,0,pitch-.08),e=point(.68,.83,.68*pitch+.11),f=point(.29,.77,.29*pitch+.065),ridge=point(.5,.015,.50*pitch+.17);
  const alt=sideShades.get(shade)||mix(rgb(shade),rgb('334b4b'),.12);sideShades.set(shade,alt);tri(a,ridge,b,shade);tri(b,ridge,d,shade);tri(d,ridge,tip,shade);tri(tip,ridge,e,alt);tri(e,ridge,f,alt);tri(f,ridge,a,alt);
 }
 function shrub(x,y,z,R,H,N){
  for(let j=0;j<N;j++){let t=j*2.4+rng()*.5,f=(j+.6)/N,r=R*(.23+.77*Math.sqrt(1-f)),bx=x+c(t)*r*rng(),bz=z+s(t)*r*rng(),by=y+H*(.27+f*.73)+(rng()-.5)*.10;
   const p=[bx,by,bz],scale=.65+.5*rng();innerSpray(p,.083*scale,.048*scale,.084*scale,t);
   rod([x+(bx-x)*.44,by-.27,z+(bz-z)*.47],p,.0047,'4d5045',5);
   for(let i=0;i<12;i++){let ang=i*2.39+t+(rng()-.5)*.40,v=(i+.45)/12,rad=(.033+.050*Math.sqrt(1-v*v))*(.79+.32*rng()),q=[bx+rad*c(ang),by-.012+.054*v+.008*s(i+t),bz+rad*s(ang)];
    blade(q,ang,.049+.067*rng(),.014+.013*rng(),-.62+.70*v+.14*(rng()-.5),lit[(i+j)%5])}

  }
 }
 shrub(-2.45,.64,-.77,.55,.85,27);shrub(-2.07,.49,-.69,.38,.62,16);shrub(-2.96,.69,-.80,.50,.50,14);
 shrub(-1.84,.22,-.47,.33,.60,14);shrub(1.72,.17,.54,.22,.61,11);
 // Smaller ivy clusters bridge behind and in front of the planter coping,
 // wrapping the outer corner rather than hanging on evenly spaced strings.
 for(let i=0;i<68;i++){let t=rng(),x=-1.9-t*.95+(.5-rng())*.13,z=.665+rng()*.054,y=.99-.37*t*t+.13*rng();
   if(i%4===0)blade([x,y,z],rng()*TAU,.046,.020,-.57,deep[(i+1)%5]);blade([x,y,z],rng()*TAU,.048+.037*rng(),.019+.01*rng(),-.55,deep[i%5])}
}

function serviceGround(g){
 const {box,rod,quad}=g;
 // Narrow zinc strip and collection slots down the slope; water damage is
 // concentrated around real drains rather than spread evenly like wallpaper.
 for(const [x,z,L] of [[-5.58,2.53,8.10],[4.87,2.53,8.10]]){
   box(x,.0067,z,.09,.006,L,'526468');box(x-.044,.0105,z,.006,.006,L,'82928f');box(x+.044,.0105,z,.006,.006,L,'697b80');
   for(let j=0;j<10;j++){let zz=z-L*.47+j*L*.103;box(x,.0114,zz,.089,.005,.014,'8d9691')}}
 for(const [x,z] of [[1.04,-1.65],[-4.75,-1.67],[4.76,5.90]]){
   box(x,.012,z,.30,.012,.18,'565e62');box(x,.021,z,.277,.007,.165,'78817f');
   for(let i=0;i<9;i++){let xx=x-.116+i*.029;box(xx,.026,z,.013,.004,.12,'45565b')}
 }
 // Welded pipe unions and bolt flanges lead to a stand-off shutoff on the
 // water tank. A small cylindrical sight gauge and a lid lift loop help it
 // read as actual plumbing without filling a quiet roof with stray props.
 const x=3.74,z=4.57;
 for(const yy of [.68,1.43]){box(x-.524,yy,z-.174,.079,.043,.088,'647978');rod([x-.57,yy,z-.184],[x-.61,yy,z-.184],.013,'788887',7)}
 rod([x-.603,.68,z-.182],[x-.603,1.43,z-.182],.011,'a0aaa6',8);for(let j=0;j<6;j++)box(x-.617,.72+j*.118,z-.182,.017,.006,.031,'65797a');
 rod([x-.062,1.645,z],[x-.062,1.709,z],.009,'637775',7);rod([x-.062,1.709,z],[x+.062,1.709,z],.009,'637775',7);rod([x+.062,1.709,z],[x+.062,1.645,z],.009,'637775',7);
 for(let j=0;j<8;j++){let a=j*TAU/8,X=x+.145*c(a),Z=z+.145*s(a);rod([X,1.662,Z],[X,1.672,Z],.006,'88958f',6)}
}

function plaqueAndLatch(g){
 const {tri,quad,box,rod,egg}=g,X=3.010,Y=1.45,Z=.517;
 // Content is legible, correctly ordered Japanese lettering: "高圧設備" /
 // "取扱注意". The eight original glyphs are individually stroked rather
 // than repeated pseudo-characters, and painted in low-contrast ink.
 const glyph={
 '高':['48 47','17 77','26 66 65 25 26','14 74 71','14 11','33 53 52 32 33'],
 '圧':['27 77','27 25 14 02','24 74','55 51','21 71'],
 '設':['17 27','07 37','15 25','14 24','13 33 31 11 13','47 67 66 76','47 46 35','45 75 64 53 42','44 53 72'],
 '備':['28 17 05','16 11','37 77','47 46','67 66','35 75','45 34 33','44 74 71','44 41','44 43 73','42 72','54 51'],
 '取':['07 47','17 11','37 31','16 36','14 34','01 42','47 77 65 54 43','56 65 73'],
 '扱':['17 15','06 36','14 23','12 32','25 21 11','47 67 56 76 64 42','46 45 34','54 65 73'],
 '注':['17 26','05 15','03 12 21','48 57','36 76','55 51','44 74','31 71'],
 '意':['48 57','27 77','36 45','66 55','16 76','25 65 63 23 25','24 64','12 01','31 30 60 61','42 51','62 71']};
 const strokes=(ch,x,y,size,color)=>{for(const poly of glyph[ch]){const pts=poly.split(' ').map(p=>[x+(+p[0]-4)*size/8,y+(+p[1]-4)*size/8]);for(let k=1;k<pts.length;k++){const a=pts[k-1],b=pts[k],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,w=size*.049,ox=-dy*w/len,oy=dx*w/len;quad([a[0]-ox,a[1]-oy,Z+.007],[b[0]-ox,b[1]-oy,Z+.007],[b[0]+ox,b[1]+oy,Z+.007],[a[0]+ox,a[1]+oy,Z+.007],color)}}};
 box(X,Y,Z,.273,.176,.009,'aaa995');box(X,Y+.068,Z+.005,.252,.004,.0019,'895e59');box(X,Y-.065,Z+.005,.252,.004,.0019,'926b63');
 for(const [j,txt] of ['高圧設備','取扱注意'].entries())for(const [i,ch] of [...txt].entries())strokes(ch,X+(i-1.5)*.052,Y+.030-j*.058,.043,j?'585d5c':'6b5b59');
 for(const side of [-1,1]){rod([X+side*.122,Y+.068,Z+.006],[X+side*.122,Y+.068,Z+.009],.0037,'83877b',6)}
 // Weathered circular lock rose, knob spindle and partially mirrored metal
 // button. The face is dark nickel with just a restrained cold edge.
 const kx=2.613,ky=1.092;
 rod([kx,ky,.479],[kx,ky,.490],.037,'505b5a',18);rod([kx,ky,.490],[kx,ky,.494],.032,'909b95',18);
 rod([kx,ky,.493],[kx,ky,.523],.014,'67777a',12);egg([kx,ky,.536],[.027,.028,.024],'7d9194',19,10);
 egg([kx-.008,ky+.011,.555],[.009,.003,.003],'a5ada4',9,5);box(kx,.994,.482,.020,.042,.007,'596867');box(kx,.994,.487,.004,.015,.004,'39484a');
}
