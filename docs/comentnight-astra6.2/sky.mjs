// Comet Night | Original angular atmosphere. The two dialects are generated from
// the same arithmetic to ensure matching horizons and meteor paths on both APIs.
// Positions in skComets are the perspective projection of a WORLD-SPACE ray
// onto a fixed oriented reference plane, not fragments or a screen overlay.
const source = `
float skHash(vec2 p) {
  vec3 q = fract(vec3(p.x,p.y,p.x)*vec3(.1031,.1099,.0973));
  q += vec3(dot(q,q.yzx+vec3(33.33)));
  return fract((q.x+q.y)*q.z);
}
float skNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f=f*f*(vec2(3.0)-2.0*f);
  return mix(mix(skHash(i),skHash(i+vec2(1.0,0.0)),f.x),mix(skHash(i+vec2(0.0,1.0)),skHash(i+vec2(1.0)),f.x),f.y);
}
float skF(vec2 p) {
  return .54*skNoise(p)+.27*skNoise(p*2.04+vec2(3.41,7.1))+.13*skNoise(p*4.13+vec2(9.11,1.7))+.06*skNoise(p*8.21);
}
// A deterministic cellular relief gives stratocumulus small scalloped turrets.
float skCumulus(vec2 p) {
  vec2 base=floor(p);
  vec2 f=fract(p);
  float nearv=2.0;
  for(int cy=-1;cy<=1;cy++){
    for(int cx=-1;cx<=1;cx++){
      vec2 n=vec2(float(cx),float(cy));
      vec2 cell=base+n;
      vec2 off=vec2(.18+.63*skHash(cell+vec2(7.1)),.18+.63*skHash(cell+vec2(2.8)));
      vec2 d=n+off-f;
      nearv=min(nearv,dot(d,d));
    }
  }
  return 1.0-smoothstep(.12,.78,sqrt(nearv));
}
float skBell(float x) {
  return exp(-x*x);
}
float skStars(vec2 p) {
  vec2 cell=floor(p);
  float v=skHash(cell);
  vec2 loc=vec2(skHash(cell+vec2(17.1,91.7)),skHash(cell+vec2(6.3,3.0)));
  vec2 d=fract(p)-(vec2(.24)+.52*loc);
  return smoothstep(.927,1.0,v)*exp(-dot(d,d)*83.0)*(.12+.58*skHash(cell+vec2(5.73)));
}
vec3 skComets(vec2 uv,float time) {
  float h=.543-uv.y;
  float k=max(-.03,h);
  float arc=.385+.244*k+.138*k*k;
  float dx=uv.x-arc;
  // Wake expands at two unequal shearing knots; the resolved emitter stays sharp.
  float swell=.70+.27*skBell((h-.255)*12.0)+.31*skBell((h-.508)*15.0);
  float fw=(.00056+.0045*smoothstep(.0,.25,h)+.0065*smoothstep(.18,.65,h))*swell;
  float tail=smoothstep(-.0025,.012,h)*(.98-.26*smoothstep(.22,.83,h))*(1.0-smoothstep(.7,1.12,h));
  vec3 c=vec3(0.0);
  // Turbulent shear windows are deliberately offset: a quiet needle, then two
  // partially separated curtains. Angular coordinates keep the wake locked to the sky.
  float lift=smoothstep(.087,.245,h);
  float knotA=skBell((h-.234)*19.7);
  float knotB=skBell((h-.497)*17.9);
  float bursts=.075+.98*knotA+.79*knotB;
  if(tail>0.0 && abs(dx)<.095) {
    float j=skNoise(vec2(h*16.0,time*.024+1.7))-.5;
    float thread=dx/fw;
    float weave=skNoise(vec2(thread*1.7+j,h*53.0+time*.029));
    float fleck=skNoise(vec2(thread*4.0,h*135.0-time*.035));
    float shift=(.15+.86*lift)*j;
    // Do not give the entire tail the full three-line spectrum. Electric color
    // hangs off a single pale spine, like fine plasma wires going in and out of view.
    float trailFill=tail*(.55+.45*weave);
    float driftA=thread+(.12+.76*lift)-shift;
    float driftB=thread-(.13+.72*lift)-.29*sin(h*23.1+.53)*lift+shift*.56;
    float spine=thread+.06+shift*.33;
    float ion=tail*(.21+.79*lift);
    c=vec3(.030,.106,.327)*exp(-abs(thread)*.66)*tail;
    c+=vec3(.027,.255,.78)*skBell(driftA*1.16)*trailFill;
    c+=vec3(.183,.070,.522)*skBell(driftB*1.38)*trailFill;
    c+=vec3(.095,.96,1.56)*skBell(driftA*(3.95+weave))*ion*(.12+.91*smoothstep(.18,.80,weave));
    c+=vec3(.67,.174,1.05)*skBell(driftB*(5.25+.95*weave))*ion*(.15+.88*smoothstep(.22,.75,fleck));
    c+=mix(vec3(.84,1.36,2.12),vec3(.67,.99,1.60),lift)*skBell(spine*(2.14+2.87*lift))*tail*(.79+.21*fleck);
    float plumelet=smoothstep(.026,.071,h)*(1.0-smoothstep(.122,.201,h))*(.33+.67*fleck);
    c+=vec3(.097,.051,.36)*skBell((thread+.93+.47*j)*1.80)*plumelet;
    float peel=thread+(.55+1.27*lift)+.47*sin(h*28.7)-shift*1.26;
    c+=vec3(.071,.996,1.41)*skBell(peel*5.83)*ion*(.11+.89*smoothstep(.26,.72,weave))*bursts;
    // A broad scallop of violet-blue afterglow lives on one side of the crystal dust.
    c+=vec3(.132,.044,.244)*skBell((thread-.88-.46*knotB)*.88)*bursts*ion*(.26+.74*fleck);
  }
  vec2 q=(uv-vec2(.385,.543))*vec2(1.7778,1.0);
  c+=vec3(.1,.45,1.3)*exp(-length(q)*150.0)+vec3(.83,1.08,1.5)*exp(-length(q)*565.0);
  c+=vec3(.72,1.18,1.75)*exp(-length(q*vec2(1.34,.89))*1240.0);
  float hp=.483-uv.y;
  float a=.496-.052*hp+.282*hp*hp;
  float w=.00032+.00038*max(hp,0.0);
  float side=uv.x-a;
  float t=smoothstep(-.002,.012,hp)*(1.0-smoothstep(.53,.82,hp));
  c+=mix(vec3(.085,.18,.55),vec3(.31,.12,.40),1.0-smoothstep(.0,.038,hp))*skBell(side/(w*1.1))*t;
  c+=vec3(.035,.13,.46)*skBell((side+w*1.5)/(w*2.7))*t;
  c+=vec3(.028,.045,.16)*exp(-abs(side)/(w*6.7))*t;
  vec2 b=(uv-vec2(.495,.483))*vec2(1.7778,1.0);
  float br=length(b);
  c+=vec3(.27,.025,.16)*exp(-br*105.0)+vec3(1.27,.33,.83)*exp(-br*210.0)+vec3(1.85,1.8,1.9)*exp(-br*625.0);
  c+=vec3(.26,.09,.16)*exp(-abs(b.y)*800.0-abs(b.x)*220.0)+vec3(.31,.15,.37)*exp(-abs(b.x)*880.0-abs(b.y)*169.0);
  // Tiny white-hot fragment, not a broad radial flare.
  c+=vec3(3.5,2.35,2.80)*exp(-length(vec2(b.x-b.y*.18,b.y*.58))*1120.0);
  if(br<.143) {
  vec2 gp=(uv-vec2(.495,.483))*vec2(410.0,202.0);
  vec2 ip=floor(gp);
  vec2 fp=fract(gp)-vec2(.13+.72*skHash(ip+vec2(2.2)),.13+.72*skHash(ip+vec2(7.7)));
  float sp=exp(-9.0*length(vec2(fp.x+fp.y*.28,fp.y*.48)));
  float fd=exp(-length(b*vec2(1.45,.68))*92.0)*smoothstep(.54,.88,skHash(ip));
  c+=vec3(1.8,.64,1.29)*sp*fd*(2.4+skHash(ip+vec2(2.71)));
  }
  // A shower of secondary needles has individually varying sizes and headings.
  if(uv.y<.64) {
  vec2 field=uv*vec2(7.0,6.0);
  vec2 tile=floor(field);
  vec2 local=fract(field)-vec2(.22+.54*skHash(tile+vec2(3.5)),.22+.54*skHash(tile+vec2(14.1)));
  float width=skHash(tile+vec2(12.1));
  vec2 aim=normalize(vec2((.417-uv.x)*1.67+(width-.5)*.16, .43+uv.y*.42));
  float along=dot(aim,local);
  float across=abs(dot(vec2(-aim.y,aim.x),local));
  float sl=.221+.285*width;
  float seg=smoothstep(-sl,0.0,along)*(1.0-smoothstep(.00,.024,along));
  float visible=smoothstep(.18,.71,skHash(tile))*(1.0-smoothstep(.46,.64,uv.y));
  c+=vec3(.07,.53,.83)*exp(-across/(.0032+.0037*width))*seg*visible;
  c+=vec3(.03,.13,.27)*exp(-across/.0109)*seg*visible;
  float red=smoothstep(.75,.78,skHash(tile+vec2(21.7)));
  c+=vec3(.64,.07,.28)*exp(-length(vec2(across,along))/.0080)*visible*red;
  }
  // Dust entrains on the lee side of each bend, not in a symmetric spray.
  // Cell centers never move frame to frame: brightness is angular, not screen noise.
  if(tail>0.0 && abs(dx)<.085 && h>.058) {
    float driftDust=fw*((.87-2.48*knotA)+.83*knotB+.69*sin(h*31.4));
    float falloff=abs(dx-driftDust)/(fw*(.79+1.14*knotA+.87*knotB)+.00043);
    float eddy=exp(-falloff*1.14)*bursts;
    vec2 dust=vec2((dx+.028*h)*262.0,h*157.0);
    vec2 ds=floor(dust);
    float choice=skHash(ds+vec2(15.3));
    vec2 off=fract(dust)-vec2(.18+.63*skHash(ds+vec2(5.13)),.17+.65*skHash(ds+vec2(7.81)));
    float radius=length(vec2(off.x+.23*off.y,.81*off.y));
    float crystal=exp(-radius*(10.4-3.6*choice))*smoothstep(.67,.967,choice);
    float tint=skHash(ds+vec2(2.49));
    vec3 glass=mix(vec3(.29,3.49,4.0),vec3(2.17,.93,2.93),smoothstep(.67,.93,tint));
    c+=glass*crystal*tail*eddy*(1.08+.83*choice);
  }
  // Resolving the pink head into several offset fragments avoids a lens-star icon.
  if(br<.123) {
  for(int si=0;si<9;si++){
    float id=float(si)+.7;
    vec2 o=vec2(skHash(vec2(id,3.0))-.5,skHash(vec2(id,14.0))-.5)*vec2(.012,.041)-vec2(.0,.0024);
    vec2 fp2=b-o;
    float spark=exp(-length(vec2(fp2.x+fp2.y*.27,fp2.y*.49))*1060.0);
    c+=vec3(3.0,.83,1.75)*spark;
  }
  }
  return c;
}
vec3 sceneSky(vec3 ray,float time) {
  float el=asin(clamp(ray.y,-1.0,1.0));
  float az=atan(ray.x,-ray.z);
  float e=max(el,0.0);
  float glow=exp(-e*10.0);
  float center=exp(-az*az*6.6);
  // A thin blue scattering layer hangs over a localized mauve city glow.
  float plume=skBell((az+.10)*4.5);
  vec3 horizon=mix(vec3(.061,.111,.199),vec3(.142,.176,.302),center);
  horizon+=vec3(.019,.005,.032)*plume;
  horizon*=.86+.14*skNoise(vec2(sin(az)*8.2,cos(az)*7.1));
  vec3 zenith=vec3(.0039,.0077,.0197);
  vec3 c=mix(zenith,horizon,glow);
  c+=vec3(.002,.007,.015)*skBell((e-.28)*3.0);
  float day=1.0-smoothstep(-.19,-.015,el);
  c=mix(c,vec3(.029,.039,.071),day*.74);
  float circ=(az+3.14159265)/6.2831853;
  float sx=ray.x*5.0+ray.z*2.71;
  float sz=ray.z*4.7-ray.x*1.3;
  vec2 sp=vec2(circ*390.0,el*60.0);
  if(e>.012) {
  float st=skStars(sp)+.32*skStars(sp*1.71+vec2(33.71));
  c+=vec3(.25,.34,.49)*st*smoothstep(.012,.38,e);
  }
  vec3 fwd=vec3(0.0,.1699069,-.9854602);
  float dist=dot(fwd,ray);
  float lane=0.0;
  if(dist>.28) {
    vec2 uv=vec2(.5+ray.x/(1.583035*dist),.5-dot(vec3(0.0,.9854602,.1699069),ray)/(.8904574*dist));
    c+=skComets(uv,time);
    lane=smoothstep(.355,.453,uv.y)*(1.0-smoothstep(.558,.637,uv.y))*(1.0-smoothstep(.083,.201,abs(uv.x-.430)));
  }
  // Two heights of broken stratocumulus. A warped broad field has distinct
  // masses and bays. A finer anisotropic field carves ragged silver rims.
  float drift=time*.0013;
  // Two oblique coordinate charts meet smoothly away from the hero direction.
  // These are sculpted angular cloud banks, not a screen texture.
  float wrap=smoothstep(1.48,2.38,abs(az));
  float longitude=mix(az,sin(az)*1.06+cos(az)*.36,wrap);
  vec2 low=vec2(longitude*7.6+drift,el*14.6+wrap*(cos(az)*3.75+sin(az)*1.04));
  vec2 warp=vec2(skF(low*.72+vec2(5.9)),skF(low*.81+vec2(16.4)));
  low+=vec2(.72,1.04)*(warp-vec2(.5));
  float bank=skF(low);
  float grains=skF(low*3.15+vec2(2.9));
  float fray=skNoise(low*16.3+vec2(24.16,7.8));
  float nubs=abs(2.0*skNoise(low*7.5+vec2(41.4))-1.0);
  float billow=skCumulus(vec2(longitude*23.0+drift,el*27.0+wrap*8.7)+warp*.58);
  vec2 grainUV=vec2(longitude*66.0+drift,el*74.0+wrap*16.0)+warp*3.7;
  float grit=.73*skNoise(grainUV)+.27*skNoise(grainUV*2.06+vec2(4.8));
  float crinkle=skNoise(vec2(longitude*194.0,el*192.0)+warp*12.1);
  bank+=(grains-.50)*.234+(fray-.50)*.055+(nubs-.48)*.042+(billow-.44)*.137+(grit-.50)*.126+(crinkle-.50)*.034;
  // Lift bulky foreground cumulus off the receding horizon, leaving room for thin decks.
  bank-=.218*(1.0-smoothstep(.135,.235,e));
  float upper=.187*skBell((el-.447-.035*sin(az*8.0)-.019*sin(az*17.0))*10.2);
  float bay=.198*skBell((el-.258-.026*sin(az*10.0))*9.7)*(.42+.58*skBell((az+.06)*2.0));
  bank+=upper+.038*smoothstep(.44,.73,e)-bay;
  // A deep central opening separates the upper deck from the slender low bands.
  bank-=.190*skBell((el-.163)*13.1)*skBell((az+.116)*4.9);
  bank-=.182*skBell((el-.358-.018*sin(az*7.0))*20.1)*skBell((az+.04)*4.9);
  // Erode only exposed upper-bank silhouettes. Interior paint stays coherent.
  float lip=skBell((bank-.536)*13.4)*smoothstep(.21,.39,e);
  float tooth=smoothstep(.32,.79,crinkle)*smoothstep(.24,.66,grit);
  bank+=lip*((tooth-.48)*.112+(billow-.51)*.043);
  float splinters=.5;
  if(lip>.07) {
    vec2 torn=vec2(longitude*283.0,el*358.0)+vec2(grit*2.75,crinkle*1.53);
    splinters=.68*skNoise(torn)+.32*skNoise(torn*2.25+vec2(18.6,7.4));
    bank+=lip*((splinters-.505)*.170);
  }
  // Open a bay downwind of the single tall deck; the low wisp below survives.
  float rift=skBell((el-.331)*11.2)*skBell((longitude+.130)*6.51)*(1.0-smoothstep(.371,.427,el));
  bank-=.205*rift;
  // Pressure troughs open local navy windows rather than uniformly lowering cover.
  bank-=.035*skBell((el-.291+.019*sin(longitude*11.0))*16.0)*smoothstep(.43,.68,warp.y);
  float grounded=smoothstep(-.047,.027,el);
  // Thin diffuse ice breaks away from a crisp water-rich interior. High-frequency
  // fibers affect the translucent edge without cutting equally hard pinholes in the core.
  float fleece=.48*grit+.30*grains+.22*crinkle;
  float humid=smoothstep(.19,.84,fleece);
  float fringe=(.15+.28*humid)*smoothstep(.425,.555,bank)*smoothstep(.17,.72,fleece);
  float dense=smoothstep(.497-.024*humid,.591+.012*humid,bank);
  float opacity=(dense+(1.0-dense)*fringe)*grounded*(1.0-.90*lane);
  // A second, lower bank is projected onto a shallow horizontal water layer.
  // The actual perspective makes distant breaks smaller without parallel
  // latitude lines; only the nearby deck carries distinct crown and belly light.
  if(el>.008 && el<.256) {
    float dep=1.0/(.085+max(ray.y,0.0));
    vec2 field=vec2(ray.x*2.38,ray.z*2.86+ray.x*.36)*dep+vec2(7.23+drift*.23,11.04+.49*(warp.x-.5)+.13*(grit-.5));
    float roll=skNoise(field);
    vec2 rip=field*2.51+vec2(4.8,1.94)+vec2(grains,grit)*.37;
    float rag=skNoise(rip);
    float foil=skNoise(rip*2.68+vec2(11.6,2.2));
    float depth=smoothstep(.041,.206,el);
    float core=roll+.42*(rag-.5)+.22*(foil-.5)+.30*(grit-.5)+.16*(crinkle-.5);
    float cap=.525+.15*smoothstep(.180,.254,el)+.04*skBell((el-.139)*55.0);
    float column=smoothstep(cap-.056,cap+.142,core);
    float rim=smoothstep(cap-.138,cap-.013,core)*(1.0-column);
    float shoulder=skNoise(field+vec2(-.033,.173+.051*depth));
    float lit=smoothstep(-.085,.205,roll-shoulder+.127*(rag-.45)+.085*(foil-.5));
    vec3 farBank=mix(vec3(.056,.088,.144),vec3(.114,.152,.221),lit);
    vec3 nearBank=mix(vec3(.023,.043,.076),vec3(.098,.143,.209),lit);
    vec3 bankLight=mix(farBank,nearBank,depth)+vec3(.013,.019,.026)*(rag-.44);
    float taperAz=-.176+.409*(el-.135);
    float quiet=skBell((longitude-taperAz)*43.0)+skBell((longitude+.010)*60.0)*skBell((el-.183)*17.0);
    float reach=(1.0-.90*min(1.0,quiet))*smoothstep(.008,.053,el)*(1.0-smoothstep(.198,.256,el));
    c=mix(c,bankLight,(column+.18*rim)*(.46+.41*depth)*reach);
  }
  if(opacity>.00001) {
  float body=smoothstep(.49,.72,bank);
  // The same bank can have an illuminated edge and a cold, shadowed belly.
  // Two low-frequency density taps estimate the incoming oblique sky light.
  float slope=skNoise(low+vec2(-.195,.255))-skNoise(low+vec2(.153,-.206));
  float fill=smoothstep(.19,.88,.50+1.69*slope+.47*(grains-.5)+.28*(body-.5));
  float fold=skNoise(low*2.36+vec2(-.13,.19))-skNoise(low*2.36+vec2(.16,-.23));
  float crest=smoothstep(-.33,.51,fold+.31*(grit-.5)+.22*(grains-.5));
  fill=clamp(.83*fill+.23*crest-.03,0.0,1.0);
  vec3 cloud=mix(vec3(.010,.018,.036),vec3(.105,.144,.219),fill);
  // Two-scale ridges collect cool light only on incoming slopes; no
  // evenly spaced cel bands or additive noise across clear air.
  float facet=smoothstep(.23,.77,.57*grit+.43*crinkle+.44*(billow-.46)+.29*(nubs-.43));
  float ridged=(facet-.45)*(.26+.65*crest)*(.48+.56*body);
  cloud+=vec3(.036,.049,.067)*ridged;
  cloud+=vec3(.012,.020,.042)*crest*smoothstep(.28,.73,body);
  cloud+=vec3(.010,.016,.026)*smoothstep(.28,.58,e);
  cloud+=vec3(.011,.020,.037)*(grains-.34)*3.9;
  // Reflected blue light collects at the ragged lower rim, not the entire cloud.
  float silver=skBell((bank-.532)*14.0)*(.25+.75*grains);
  cloud+=vec3(.017,.025,.039)*silver*(.30+.95*fill);
  cloud+=vec3(.017,.025,.034)*(billow-.44);
  cloud+=vec3(.019,.024,.037)*(skNoise(low*2.1+warp)-.50);
  cloud+=vec3(.024,.033,.042)*(grit-.50);
  // Slant light sees selected crowns; nearby overhangs stay in blue-black shadow.
  float edgeLight=lip*skBell((bank-.552)*13.6);
  cloud+=vec3(.024,.035,.052)*edgeLight*smoothstep(.53,.81,fill)*(.25+.79*tooth+.36*splinters);
  cloud*=1.0-.15*edgeLight*(1.0-smoothstep(.16,.52,fill));
  cloud+=vec3(.027,.038,.063)*glow;
  c=mix(c,cloud,opacity*.99);
  }
  vec2 high=vec2(longitude*8.2-drift*.49,el*36.2+warp.y*.79);
  float cirrus=skF(high);
  float strip=smoothstep(.604,.718,cirrus)*grounded*(1.0-smoothstep(.65,1.39,e));
  float sheetBreak=smoothstep(.23,.77,grains+.31*(grit-.50)+.28*(cirrus-.59));
  vec3 sheet=mix(vec3(.028,.049,.091),vec3(.085,.119,.187),fleece);
  c=mix(c,sheet+vec3(.025,.035,.054)*glow,strip*(.06+.42*sheetBreak)*(1.0-.78*lane)*(.42+.58*smoothstep(.146,.257,el)));
  c+=vec3(.026,.024,.038)*exp(-abs(el-.01)*18.1)*(.18+.82*center);
  // A long, ragged stratus bank crosses the lower blue wake. It belongs to the
  // sky sphere (and draws no light); displacement, rims and extinction share
  // one optical column. The dense lobes carry soft reflected blue-grey light.
  if(el>.197 && el<.323 && longitude>-.93 && longitude<.18) {
    float lon=longitude+drift*.043;
    float rag=skF(vec2(lon*43.0+6.43,el*96.0+1.82));
    float roll=skNoise(vec2(lon*22.0+7.71,2.24));
    float tuck=skNoise(vec2(lon*66.0+2.91,8.79));
    float seam=skNoise(vec2(lon*104.0+1.28,el*178.0+3.47));
    float chop=skNoise(vec2(lon*238.0+1.08,el*259.0+7.38));
    float mid=.249-.013*sin((lon+.17)*7.9)+.016*(roll-.5)+.007*(tuck-.5)+.003*(seam-.5);
    float limb=el-mid;
    float crown=.006+.016*roll+.011*tuck;
    float root=.004+.007*roll+.003*rag;
    float height=mix(root,crown,smoothstep(-.002,.003,limb));
    float plumeA=skBell((lon+.158)*6.38);
    float plumeB=skBell((lon+.48)*5.01);
    float plumeC=skBell((lon+.76)*5.49);
    float weight=max(plumeA,max(.94*plumeB,.79*plumeC));
    float breaks=skBell((lon+.31)*24.0)*.89+skBell((lon+.074)*39.0)*.32;
    float column=(.84+.52*roll+.21*tuck)*weight-abs(limb)/height+(rag-.50)*1.53+(seam-.50)*.52+(chop-.50)*.26-breaks;
    float vapor=smoothstep(-.47,.63,column);
    float opaque=smoothstep(.18,.80,column);
    float illumination=smoothstep(-.69,.66,limb/height+1.54*(rag-.5)+.83*(tuck-.5)+.65*(seam-.5));
    vec3 wisp=mix(vec3(.018,.033,.065),vec3(.104,.157,.237),illumination);
    float rim=smoothstep(.48,.82,.40*rag+.34*seam+.26*chop)*illumination;
    wisp+=vec3(.033,.045,.066)*rim+vec3(.019,.028,.041)*(rag-.43)*2.45;
    float overlap=(.30+.68*opaque)*vapor*weight;
    c=mix(c,wisp,overlap);
  }
  float air=exp(-max(e,0.0)*9.45)*smoothstep(-.16,.025,el);
  float cityAir=.72+.56*skBell((az+.26)*1.21);
  c+=vec3(.012,.075,.157)*air*cityAir;
  return max(c,vec3(0.0));
}
`;
// This intentionally tiny, closed vocabulary is not a general shader translator.
function wgsl(code) {
  const tags = {float:'f32',vec2:'vec2f',vec3:'vec3f'};
  return code.split('\n').map(line => {
    line=line.replace(/^(float|vec[23]) (\w+)\(([^)]*)\) \{$/,(_,ret,fn,args)=>
      'fn '+fn+'('+args.split(',').map(p=>{const [t,n]=p.trim().split(' ');return n+': '+tags[t]}).join(', ')+')->'+tags[ret]+' {');
    line=line.replace(/^(\s*)(float|vec[23]) ([A-Za-z]\w*)\s*=/,(_,s,t,n)=>s+'var '+n+': '+tags[t]+' =');
    line=line.replace(/for\(int (\w+)=/g,'for(var $1:i32=').replace(/float\((si|cx|cy)\)/g,'f32($1)');
    line=line.replace(/\bvec([23])\(/g,'vec$1f(').replace(/\batan\(/g,'atan2(').replace(/(?<![a-zA-Z0-9_])\.(\d+)/g,'0.$1');
    return line;
  }).join('\n');
}
export const skyGLSL=source;
export const skyWGSL=wgsl(source);
