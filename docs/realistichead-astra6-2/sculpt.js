// Original parametric portrait sculpture. Coordinates: +Y up, +Z face, eyes at .14, chin -.93.
const PI=Math.PI, TAU=PI*2, sin=Math.sin,cos=Math.cos,abs=Math.abs,exp=Math.exp,sq=x=>x*x,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), mix=(a,b,t)=>a+(b-a)*t, col=(a,b,t)=>a.map((x,i)=>mix(x,b[i],t)), sm=t=>(t=clamp(t))*t*(3-2*t), G=(x,y,x0,y0,sx,sy)=>exp(-sq((x-x0)/sx)-sq((y-y0)/sy)), unit=n=>{let d=Math.hypot(...n)||1;return n.map(x=>x/d)}, cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], sub=(a,b)=>a.map((v,i)=>v-b[i]);
// Shape-preserving Hermite interpolation avoids scalloped silhouettes at anatomical stations.
function sample(tab,x,k){if(x<=tab[0][0])return tab[0][k];let n=tab.length;if(x>=tab[n-1][0])return tab[n-1][k];let i=0;while(tab[i+1][0]<x)i++;let l=tab[i],r=tab[i+1],h=r[0]-l[0],m=(r[k]-l[k])/h,t=(x-l[0])/h;
const slope=(j)=>{if(!j||j===n-1)return m;let a=tab[j-1],b=tab[j],c=tab[j+1],h1=b[0]-a[0],h2=c[0]-b[0],s1=(b[k]-a[k])/h1,s2=(c[k]-b[k])/h2;if(s1*s2<=0)return 0;return 3*(h1+h2)/((2*h2+h1)/s1+(2*h1+h2)/s2)};return mix(l[k],r[k],t*t*(3-2*t))+h*t*(1-t)*((1-t)*slope(i)-t*slope(i+1))}
const CR=[[-.93,.001,.43,.432,.428],[-.912,.105,.411,.556,.309],[-.855,.246,.354,.660,.13],[-.77,.378,.272,.706,-.071],[-.68,.474,.176,.707,-.225],[-.59,.545,.092,.711,-.34],[-.46,.61,.02,.708,-.48],[-.30,.668,-.018,.727,-.59],[-.14,.708,-.052,.749,-.687],[.02,.728,-.063,.749,-.759],[.16,.735,-.067,.718,-.805],[.30,.746,-.064,.736,-.844],[.49,.756,-.058,.746,-.853],[.68,.745,-.054,.724,-.815],[.85,.701,-.065,.671,-.746],[.99,.607,-.07,.582,-.645],[1.10,.445,-.07,.435,-.518],[1.175,.235,-.07,.225,-.31],[1.20,.001,-.07,-.068,-.072]];
const NC=[[-1.78,1.32,-.075,.49,-.60],[-1.65,1.30,-.075,.48,-.60],[-1.50,1.15,-.075,.43,-.56],[-1.4,.88,-.075,.39,-.54],[-1.32,.595,-.075,.37,-.53],[-1.24,.43,-.075,.34,-.52],[-1.1,.35,-.075,.325,-.50],[-.95,.325,-.075,.34,-.50],[-.80,.317,-.065,.358,-.485],[-.66,.325,-.045,.4,-.46],[-.56,.335,-.045,.42,-.44]];
export const widthAt=y=>sample(CR,y,1);
const NO=[[-.48,0,.093],[-.36,.008,.091],[-.315,.033,.079],[-.287,.062,.073],[-.262,.116,.080],[-.238,.169,.095],[-.217,.198,.113],[-.194,.210,.116],[-.169,.202,.111],[-.137,.180,.100],[-.082,.154,.087],[-.017,.131,.079],[.06,.106,.078],[.13,.088,.083],[.21,.072,.087],[.28,.050,.093],[.36,.026,.102],[.49,.007,.115],[.63,0,.12]];
function feature(x,y){
 let a=abs(x),v=0;
 // Orbital bowl, zygomatic pad and temporal hollow.
 v-=.022*G(a,y,.305,.146,.224,.089)+.013*G(a,y,.49,.14,.09,.089);
 v+=.027*G(a,y,.32,.295,.23,.105)+.016*G(a,y,.31,-.012,.205,.104)+.062*G(a,y,.418,-.033,.212,.149)+.038*G(a,y,.43,-.197,.184,.174);
 v-=.021*G(a,y,.615,.25,.09,.18);
 // The bridge tapers at the nasion and broadens toward the rounded lobule.
 let nasal=sample(NO,y,1), nw=sample(NO,y,2),nx=x-.008*exp(-sq((y+.206)/.147)),na=abs(nx);v+=nasal*exp(-sq(nx/nw));
 v+=.062*G(na,y,.111,-.225,.047,.047)+.020*G(na,y,.085,-.211,.063,.067);
 let wing=.129+.026*exp(-sq((y+.221)/.040));v-=.010*exp(-sq((na-wing)/.017)-sq((y+.221)/.051));
 v-=.015*G(a,y,.143,-.268,.033,.035)+.012*G(a,y,.168,-.221,.035,.067);
 v+=.014*G(x,y,0,-.264,.035,.055);
 // Nasolabial sweep and philtrum columns; natural smile slightly asymmetrical.
 let fold=.167+.50*clamp(-y-.215,0,.31);
 v-=.009*exp(-sq((a-fold)/.036)-sq((y+.336)/.125));
 v+=.015*G(a,y,.051,-.338,.039,.077)-.008*G(x,y,0,-.341,.035,.071);
 v+=.035*G(a,y,.122,-.426,.174,.107)+.033*G(a,y,.256,-.434,.1,.081);
 v-=.020*G(x,y,0,-.497,.25,.094)+.014*G(a,y,.278,-.446,.042,.048);
 v+=.031*G(x,y,0,-.53,.278,.147);if(a<.271){let w=1-sq(a/.271),mid=mTop(x)-mGap(x)*.5;v-=.046*w*exp(-sq((y-mid)/(.026+.028*w)))}
 v-=.015*G(x,y,.001,-.650,.182,.054);
 v+=.027*G(x,y,.003,-.766,.178,.088);
 return v;
}
function baseZ(c,y,tab=CR){let m=sample(tab,y,2);return c>=0?m+(sample(tab,y,3)-m)*Math.pow(c,tab===CR?.70:.87):m-(m-sample(tab,y,4))*Math.pow(-c,.92)}
export function faceZ(x,y){let w=widthAt(y),c=Math.sqrt(Math.max(0,1-sq(x/w)));return baseZ(c,y)+feature(x,y)*sm(c/.50)}
export function headAt(a,y){let w=widthAt(y),c=cos(a),x=w*sin(a);return [x,y,baseZ(c,y)+(c>0?feature(x,y)*sm(c/.50):0)]}
function neckRelief(x,y,c){let a=abs(x);return c<=0?0:sm(c/.5)*(.018*G(a,y,.155+.44*(y+1.14),-1.10,.038,.24)-.024*G(x,y,0,-1.39,.098,.081)+.013*G(a,y,.28,-1.42,.22,.049))}
export function neckAt(a,y){let x=sample(NC,y,1)*sin(a),c=cos(a);return [x,y,baseZ(c,y,NC)+neckRelief(x,y,c)]}
export function neckZ(x,y){let c=Math.sqrt(Math.max(0,1-sq(x/sample(NC,y,1))));return baseZ(c,y,NC)+neckRelief(x,y,c)}
function skin(x,y,z){let ax=abs(x),cheek=G(ax,y,.438,-.116,.181,.127), blush=G(ax,y,.55,-.019,.13,.19),orb=G(ax,y,.34,.148,.202,.124),nose=G(x,y,0,-.22,.151,.118),vel=G(x,y,0,.54,.52,.63),mouth=G(ax,y,.249,-.46,.102,.077);
 let c=[.911,.741,.662],front=sm((z+.08)/.51);let pink=(.53*cheek+.33*blush+.30*nose+.20*mouth)*front;
 c=[c[0]+.018*pink+.014*vel*front,c[1]-.075*pink-.031*orb*front+.012*vel*front,c[2]-.026*pink-.009*orb*front+.018*vel*front];
 let fleck=(sin(x*78.2+y*54.9+z*23.1)*sin(x*49.7-y*81.1)*.0036+sin(x*13.7+y*31.2)*.0036)*front;let mott=field(x,y,z,13),fine=field(x,y,z,48),temp=field(x+1,y-2,z,6),ao=(.14*G(ax,y,.15,.026,.055,.158)+.10*G(ax,y,.152,-.219,.055,.126)+.095*G(ax,y,.62,.235,.125,.32))*front;c=col(c,[.77,.587,.539],ao);let subnasal=G(x,y,.005,-.253,.129,.044), noseTip=G(x,y,.008,-.205,.082,.052), sidePlane=G(ax,y,.096,-.100,.063,.126),corner=G(ax,y,.262,-.431,.029,.033), peri=G(ax,y,.172,-.529,.133,.109),lowerOrb=G(ax,y,.303,.031,.182,.076);
 c=col(c,[.989,.797,.731],.36*subnasal+.17*noseTip);c=col(c,[.723,.594,.641],.14*sidePlane+.10*lowerOrb);c=col(c,[.729,.458,.457],.26*corner+.069*peri);
 return [c[0]+fleck+.014*mott+.008*fine+.013*temp,c[1]+.8*fleck+.014*mott+.006*fine-.003*temp,c[2]+.6*fleck+.010*mott+.006*fine-.005*temp]}
function hash(i,j,k=0){let n=Math.sin(i*127.1+j*311.7+k*73.13)*43758.5453123;return n-Math.floor(n)}
function field(x,y,z,s){x=x*s+27.13;y=y*s+141.31;z=z*s+31.72;let i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),a=sm(x-i),b=sm(y-j),c=sm(z-k);return mix(mix(mix(hash(i,j,k),hash(i+1,j,k),a),mix(hash(i,j+1,k),hash(i+1,j+1,k),a),b),mix(mix(hash(i,j,k+1),hash(i+1,j,k+1),a),mix(hash(i,j+1,k+1),hash(i+1,j+1,k+1),a),b),c)-.50}
const M=[];
function grid(name,nu,nv,pos,color,opts={}){let p=[],n=[],cs=[],idx=[],norm=opts.sign||1;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){let u=i/nu,v=j/nv,P=pos(u,v);p.push(...P);cs.push(...color(u,v,P))}let at=(i,j)=>{let b=(j*(nu+1)+i)*3;return [p[b],p[b+1],p[b+2]]};for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){let d=sub(at(opts.wrap?(i===nu?1:i+1):Math.min(nu,i+1),j),at(opts.wrap?(i===0?nu-1:i-1):Math.max(0,i-1),j)),e=sub(at(i,Math.min(nv,j+1)),at(i,Math.max(0,j-1))),N=unit(cross(d,e));let s=typeof norm==='function'?norm(i/nu,j/nv,at(i,j),N):norm;n.push(...N.map(t=>s*t));if(i<nu&&j<nv){let a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;if(s>0)idx.push(a,b,c,b,d,c);else idx.push(a,c,b,b,c,d)}}
const m={name,positions:new Float32Array(p),normals:new Float32Array(n),colors:new Float32Array(cs),indices:new Uint32Array(idx),material:opts.material||'skin',roughness:opts.roughness??.57,specular:opts.specular??.25};M.push(m);return m}
function eyeY(t,upper,side){let s=Math.pow(Math.max(0,sin(PI*t)),.77),l=mix(.120,.149,t)+(side<0?-.0045:.0040);return l+(upper?(.063-.006*t)*s:-(.032+.004*t)*s)}
function eyeDepth(a,y){return .730-.300*(a-.30)-.103*sq((a-.295)/.230)-1.96*sq(y-.140)}
export function eyePoint(side,t,upper=true){t=clamp(t);let a=mix(.128,.493,t),y=eyeY(t,upper,side);return [side*a,y,eyeDepth(a,y)]}
function lidP(side,theta,v){let t=(1-cos(theta))*.5,up=sin(theta)>=0,e=eyePoint(side,t,up),q=Math.max(0,sin(PI*t)),end=cos(theta),ex=.057+(!up?.006:0), ax=abs(e[0])-end*ex*v,win=Math.pow(q,.48),oy=(up?.117:-.119)*win*v, y=e[1]+oy,z0=e[2]+.0023,z1=faceZ(side*ax,y)+.0008;
let blend=sm(v),z=mix(z0,z1,blend)+sq(sin(PI*v))*(.003+.009*q)*(up?1:.66);return [side*ax,y,z]}
function lidC(side,theta,v,P){let t=(1-cos(theta))*.5,up=sin(theta)>=0,q=Math.max(0,sin(PI*t)),base=skin(...P);
let sh=up?.19*exp(-sq((v-.45)/.23))*q:.09*exp(-sq((v-.27)/.19))*q;
let c=col(base,up?[.52,.316,.304]:[.64,.372,.36],sh);if(up){let fold=.205*exp(-sq((v-(.48+.05*t))/.044))*Math.pow(q,.70);c=col(c,[.446,.29,.27],fold);let dark=.94*(1-sm((v-(.065+.031*t))/.047))*sm(t/.11)*sm((1.02-t)/.10);c=col(c,[.137,.075,.067],dark)}else {let edge=(.62+.38*Math.pow(q,.6))*exp(-sq((v-.042)/.055));c=col(c,[.455,.234,.265],.75*edge);c=col(c,[.985,.768,.725],.33*exp(-sq((v-.007)/.018))*Math.pow(q,.55))}
return c}
function irisC(a,y,side){let cx=.306+(side<0?.002:0),cy=.147+(side<0?-.003:.003),rr=Math.hypot(a-cx,(y-cy)*1.04)/.0715,dx=a-cx,dy=(y-cy)*1.04,angle=Math.atan2(dy,dx),q=sm((a-.128)/.095)*sm((.493-a)/.071);
let u=(a-.128)/.365,yt=eyeY(u,true,side),yb=eyeY(u,false,side),h=clamp((y-yb)/(yt-yb||1)),under=.27*exp(-sq((1-h)/.40)),shade=clamp(under+.10*(1-q));
let c=col([.919,.869,.819],[.70,.509,.513],(1-q)*.55+shade);let lower=1-sm(h/.105);c=col(c,[.85,.624,.604],lower*(.24+.40*(1-q)));let pink=1-sm((u-.013)/.080);c=col(c,[.789,.465,.467],pink*(.43+.29*sin(PI*h))); c=col(c,[.98,.779,.75],pink*.29*exp(-sq((h-.36)/.13)));
if(rr>1.0){let branch=.70*sin(u*24+2*sin(u*36))+1.2*(1-h);let vein=exp(-sq((sin(7*h+branch+.36*side))/.07))*(1-q)*sm((rr-1)/.38);c=col(c,[.804,.561,.592],.12*vein)}
if(rr<1.036){let r=rr,ang=angle,irregular=sin(ang*11)*.020+sin(ang*27)*.014+sin(ang*49)*.008,lim=sm((r-.79-irregular)/.16);
 let spoke=.5+.5*sin(ang*97+3.3*sin(ang*23)+rr*4.7+sin(rr*12+ang*15)),fib=.5+.5*sin(ang*161+.9*sin(rr*19+ang*21)+rr*4),crypt=sm((sin(ang*37+rr*9+sin(ang*19))-.18)/.8)*exp(-sq((r-.665)/.17)),cuff=exp(-sq((r-(.526+irregular*1.8))/.042));
 let ir=col([.208,.145,.132],[.458,.326,.253],clamp(.23+.33*spoke+.10*fib+.17*cuff-.21*crypt));ir=col(ir,[.100,.079,.073],lim*.92);
 ir=col(ir,[.061,.048,.047],1-sm((r-.374-irregular*.21)/.062));ir=col(ir,[.112,.083,.091],.36*sm((h-.46)/.45));c=col(c,ir,1-sm((r-.965)/.071))}
 // Broad, broken studio reflections on the wet cornea rather than a white painted dot.
 let gx=side*dx, gx1=(gx+.017)/.013,gy1=(dy-.0255)/.0073,w=exp(-Math.pow(abs(gx1),3.2)-Math.pow(abs(gy1+.22*gx1),3.1));
 let secondary=exp(-sq((gx+.004)/.0040)-sq((dy-.023)/.0061)), rim=exp(-sq((rr-.80)/.105)-sq((dy+.033)/.013))*sm((.042-abs(gx))/.025);
 c=col(c,[.912,.931,.953],.82*w+.25*secondary);c=col(c,[.890,.803,.742],.24*rim);
 let horizon=exp(-sq((dy+.020+gx*.075)/.0080)-sq((gx-.009)/.031)),broken=.52+.48*sm((sin(gx*355+dy*72)+.6)/1.2);
 c=col(c,[.873,.859,.870],.50*horizon*broken*(1-sm((rr-.77)/.18)));return c}
function eyes(side){grid('Eye '+side,124,48,(t,v)=>{let a=mix(.128,.493,t),y=mix(eyeY(t,false,side),eyeY(t,true,side),v);return [side*a,y,eyeDepth(a,y)]},(u,v,p)=>irisC(abs(p[0]),p[1],side),{sign:side,material:'cornea',roughness:.20,specular:.38});
grid('Orbital eyelids '+side,146,34,(u,v)=>lidP(side,TAU*u,v),(u,v,p)=>lidC(side,TAU*u,v,p),{sign:side,wrap:true,roughness:.55});
}
function skull(){grid('Continuous head and face',264,201,(u,v)=>headAt(TAU*u,mix(-.93,1.2,v)),(u,v,p)=>skin(...p),{wrap:true});grid('Neck and clavicle',128,78,(u,v)=>neckAt(TAU*u,mix(-1.78,-.56,v)),(u,v,p)=>{let c=skin(...p);return col(c,[.69,.492,.437],.095+.14*sm((p[1]+1.12)/.44))},{wrap:true});}
const WM=.271;
function mTop(x){let a=clamp(abs(x)/WM);return -.451+.019*Math.pow(a,1.45)+.0051*x/WM-.002*exp(-sq(x/.043))}
function mGap(x){let a=clamp(abs(x)/WM);return .091*Math.pow(Math.max(0,1-a*a),.76)}
function mLow(x){return mTop(x)-mGap(x)}
function lipHeight(x,upper){let a=clamp(abs(x)/WM),w=Math.pow(Math.max(0,1-a*a),.67);return upper?w*(.045+.017*exp(-sq((a-.30)/.217))+.008*exp(-sq(a/.68))):w*(.073+.021*exp(-sq(a/.73)))}
function mouthArc(x){let a=clamp(abs(x)/WM);return .766-.083*a*a+.002*x/WM}
function oralZ(x,y){let q=clamp((y-mLow(x))/(mGap(x)||1));return Math.max(faceZ(x,y)+.0016,mouthArc(x)-.030-.008*sin(PI*q)*(1-sq(x/WM)))}
function lipP(x,v,upper){let a=clamp(abs(x)/WM),w=Math.pow(Math.max(0,1-a*a),.60),y0=upper?mTop(x):mLow(x), y=y0+(upper?1:-1)*lipHeight(x,upper)*v,edge=Math.max(oralZ(x,y0)+.002,mix(faceZ(x,y0)+.0020,mouthArc(x)+.004*w,sm((1-a)/.135))),z=mix(edge,faceZ(x,y)+.001,sm(v))+sq(sin(PI*v))*w*(upper?.014:.017);
z+=.00032*w*sq(sin(v*PI))*sin(x*401+sin(x*139)+1.7*v);return [x,y,z]}
function lipColor(x,v,P,upper){let a=clamp(abs(x)/WM),w=1-a*a,gr=.5+.5*sin(x*433+1.8*sin(x*146)+v*3.4),pop=sm((1-a)/.42);let base=upper?[.894,.493,.525]:[.906,.447,.545],c=col(base,[.666,.276,.319],.18*a+.17*(1-sm(v/.23))+.065*(1-gr)*sin(PI*v));c=col(c,[.998,.651,.695],(upper?.11:.25)*pop*exp(-sq((v-.49)/.22))*(.48+.52*gr));c=col(c,[.657,.317,.365],.10*sm((a-.70)/.26)*(.7+.3*(1-v)));c=col(c,skin(...P),sm((v-.66)/.34)*.94+.075*Math.pow(a,5)*(1-sm((v-.69)/.31)));return c}
function mouth(){
 grid('Oral cavity',100,20,(u,v)=>{let x=WM*(2*u-1),y=mix(mLow(x),mTop(x),v),z=oralZ(x,y);return [x,y,z]},(u,v)=>col([.316,.141,.148],[.437,.186,.188],.32*sin(PI*u)*Math.max(0,1-v)),{material:'mouth',roughness:.77,specular:.09});
 for(let upper of [false,true])grid(upper?'Cupid bow and upper vermilion':'Lower vermilion',160,32,(u,v)=>lipP(WM*(u*2-1),v,upper),(u,v,p)=>lipColor(p[0],v,p,upper),{sign:upper?1:-1,material:'lips',roughness:.38,specular:.30});
 for(let side of [-1,1]){let lo=.0005;for(let k=0;k<5;k++){let width=[.068,.055,.050,.042,.028][k]+(.0011*sin(k*2.65+side)),cx=(lo+width/2)*side;lo+=width+.00048;
 grid('Upper dental crown '+side+'-'+k,28,20,(u,v)=>{let s=2*u-1,w0=1-.082*(1-sm(v/.17))-.065*sm((v-.84)/.16),x=cx+s*width*.5*w0;
 let exposed=([.085,.075,.065,.047,.032][k]+.0015*sin(k*1.2+side*2.1))*(1-.09*abs(x)/WM),top=mTop(x)+.0022,bottom=mTop(x)-exposed+.0057*Math.pow(abs(s),2.5)+.0027*side*s*(k===2?1:.51)+(k===2?-.0039*(1-s*s):.0008*sin(s*4+k)),y=mix(Math.max(bottom,mLow(x)+.0013),top,v);
 let z=mouthArc(x)-.019+.0036*(1-s*s)*(.74+.26*sin(PI*v))-.0018*sq((v-.45)*1.85)-.0045*Math.pow(abs(x)/WM,3);return [x,y,Math.max(z,oralZ(x,y)+.0017)]},(u,v,p)=>{let t=abs(2*u-1),a=abs(p[0])/WM,edge=.15*sm((t-.65)/.35)+.12*(1-sm(v/.15))+.18*sm((v-.67)/.33)+.24*a*a;let c=col([.973,.915,.841],[.824,.689,.615],edge+.34*a*a);c=col(c,[.778,.593,.552],.19*sm((v-.40)/.61)+.19*sm((a-.54)/.36)+.36*sm((a-.78)/.13));return col(c,[.848,.835,.786],.10*(1-sm(v/.17)))},{material:'enamel',roughness:.37,specular:.24});
 }}
}
function nostrils(){for(let side of [-1,1]){let cx=.1035;
 grid('Subtle nostril aperture '+side,58,12,(u,v)=>{let th=u*TAU,xx=.0305*cos(th)*v,yy=.0081*sin(th)*v,ax=cx+xx, y=-.259+.13*xx+yy-.0034*sq(xx/.031);let x=ax*side;return [x,y,faceZ(x,y)+.0017]},(u,v,p)=>{let q=1-sm(v),c=skin(...p);return col(c,[.382,.211,.194],(.15+.60*q)*(1-sm((v-.77)/.23)))},{wrap:true,sign:-side,roughness:.74,specular:.08});
}}
function ears(side){ // pinna body plus helical rim carved into a continuous outer surface, visible from the reverse.
 let cy=-.027,cz=-.050,wy=.249,wz=.138;
 function pin(u,v){let t=TAU*u,sy=sin(t),sz=cos(t),r=v;let y=cy+r*wy*sy,z=cz+r*wz*(1+.17*sy)*sz-r*.050*sy;let base=.738-.026*Math.max(0,-sy)*r;
 let Y=(y-cy)/wy,Z=(z-cz+.18*(y-cy))/wz,outer=.053*(.77+.23*sm((.68-sz)/1.35))*exp(-sq((r-(.806+.025*sy))/.110));
 let ridge=(coords,wide)=>{let best=12;for(let i=1;i<coords.length;i++){let a=coords[i-1],b=coords[i],dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((Z-a[0])*dx+(Y-a[1])*dy)/(dx*dx+dy*dy));best=Math.min(best,sq(Z-a[0]-dx*t)+sq(Y-a[1]-dy*t))}return exp(-best/sq(wide))};
 let anti=.035*ridge([[.01,-.51],[-.22,-.34],[-.36,-.03],[-.35,.22],[-.26,.42],[-.08,.61]],.125)+.022*ridge([[-.35,.19],[-.13,.34],[.17,.43]],.099);
 let bowl=-.016*G(Z,Y,.09,-.10,.40,.41)+.030*G(Z,Y,.49,-.117,.21,.19)+.018*G(Z,Y,.04,-.40,.21,.16)+.014*G(Z,Y,-.06,-.75,.42,.16);
 let x=base+(.018+.015*sy)*r+.010*(1-r)+outer+bowl+anti;return [side*x,y,z]}
 grid('Auricle outer bowl '+side,94,42,pin,(u,v,p)=>{let q=G(p[2],p[1],-.020,-.02,.089,.132),rim=exp(-sq((v-.79)/.14)),c=col(skin(...p),[.805,.460,.420],.14+.47*q+.16*G(p[2],p[1],.018,-.035,.029,.049));return col(c,[.976,.770,.680],.26*rim)},{wrap:true,sign:side,roughness:.56});
 grid('Auricle reverse '+side,94,26,(u,v)=>{let t=TAU*u,edge=pin(u,1),c=[.660*side,cy,cz],q=v;return [mix(c[0],edge[0],q)+side*.027*sin(PI*q),mix(c[1],edge[1],q),mix(c[2],edge[2],q)]},(u,v,p)=>col(skin(...p),[.845,.535,.49],.23),{wrap:true,sign:-side});

}
export function buildSculpt(){M.length=0;skull();ears(-1);ears(1);eyes(-1);eyes(1);nostrils();mouth();return M.slice()}
globalThis.HeadSculpt={build:buildSculpt,faceZ,widthAt,headAt,neckAt,neckZ,eyePoint,skinColor:skin};

