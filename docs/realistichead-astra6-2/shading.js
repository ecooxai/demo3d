// Both graphics backends implement the same studio, with a fixed world-space key.
export const glslBG=`
vec3 backdrop(vec2 uv){
 float halo=exp(-2.0*dot((uv-vec2(.62,.63))*vec2(1.1,.75),(uv-vec2(.62,.63))*vec2(1.1,.75)));
 vec3 col=mix(vec3(.665,.684,.858),vec3(.861,.850,.974),halo);
 float a=uv.x*1.8+uv.y*.89, b=uv.x*.7-uv.y*.86;
 col+=vec3(.032,.030,.040)*(smoothstep(-.03,.43,a-.60)-smoothstep(.34,.74,a-.60));
 col-=vec3(.061,.057,.032)*exp(-19.*abs(b+.53))*(.3+.7*uv.y);
 float foldR=uv.x+uv.y*.46-1.26;float foldL=uv.x-.85*uv.y+.64;
 col-=vec3(.095,.105,.07)*smoothstep(-.026,.022,foldR)*exp(-4.*abs(foldR))*(.4+.6*uv.y);
 col+=vec3(.042,.038,.047)*exp(-16.*abs(foldL))*(.3+.7*uv.y);
 col-=vec3(.032,.027,.015)*smoothstep(.36,.78,length((uv-vec2(.53,.57))*vec2(1.2,.8)));
 col+=vec3(.014)*sin(5.1*a+1.4*uv.y);return clamp(col,0.,1.);
}`;
export const wgslBG=`
fn backdrop(uv:vec2f)->vec3f{
 let d=(uv-vec2f(.62,.63))*vec2f(1.1,.75);
 let halo=exp(-2.*dot(d,d));var col=mix(vec3f(.665,.684,.858),vec3f(.861,.850,.974),halo);
 let a=uv.x*1.8+uv.y*.89;let b=uv.x*.7-uv.y*.86;
 col+=vec3f(.032,.030,.040)*(smoothstep(-.03,.43,a-.60)-smoothstep(.34,.74,a-.60));
 col-=vec3f(.061,.057,.032)*exp(-19.*abs(b+.53))*(.3+.7*uv.y);
 let foldR=uv.x+uv.y*.46-1.26;let foldL=uv.x-.85*uv.y+.64;
 col-=vec3f(.095,.105,.07)*smoothstep(-.026,.022,foldR)*exp(-4.*abs(foldR))*(.4+.6*uv.y);
 col+=vec3f(.042,.038,.047)*exp(-16.*abs(foldL))*(.3+.7*uv.y);
 col-=vec3f(.032,.027,.015)*smoothstep(.36,.78,length((uv-vec2f(.53,.57))*vec2f(1.2,.8)));
 col+=vec3f(.014)*sin(5.1*a+1.4*uv.y);return clamp(col,vec3f(0),vec3f(1));
}`;
const glNoise=`
float hash21(vec2 p){vec3 a=fract(vec3(p.x,p.y,p.x)*.1031);a+=vec3(dot(a,a.yzx+vec3(33.33)));return fract((a.x+a.y)*a.z);}
float tissueNoise(vec2 p){vec2 i=floor(p),d=fract(p);d=d*d*(vec2(3.)-2.*d);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),d.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.)),d.x),d.y);}
vec3 skinDetail(vec3 pos,vec3 c){vec2 uv=pos.xy+pos.z*vec2(.341,.213);float tissue=tissueNoise(uv*49.)-.5;float fine=tissueNoise(uv*240.);float pores=pow(max(0.,.59-fine),2.5);float mottling=tissueNoise(uv*14.)-.5;
return c*(vec3(.963,.989,.989)+vec3(.052,.038,.029)*tissue+vec3(.033,.019,.012)*mottling-vec3(.20,.17,.16)*pores);}
`;
const wgNoise=`
fn hash21(p:vec2f)->f32{var a=fract(vec3f(p.x,p.y,p.x)*.1031);a+=vec3f(dot(a,a.yzx+vec3f(33.33)));return fract((a.x+a.y)*a.z);}
fn tissueNoise(p:vec2f)->f32{let i=floor(p);var d=fract(p);d=d*d*(vec2f(3.)-2.*d);return mix(mix(hash21(i),hash21(i+vec2f(1.,0.)),d.x),mix(hash21(i+vec2f(0.,1.)),hash21(i+vec2f(1.)),d.x),d.y);}
fn skinDetail(pos:vec3f,c:vec3f)->vec3f{let uv=pos.xy+pos.z*vec2f(.341,.213);let tissue=tissueNoise(uv*49.)-.5;let fine=tissueNoise(uv*240.);let pores=pow(max(0.,.59-fine),2.5);let mottling=tissueNoise(uv*14.)-.5;
return c*(vec3f(.963,.989,.989)+vec3f(.052,.038,.029)*tissue+vec3f(.033,.019,.012)*mottling-vec3f(.20,.17,.16)*pores);}
`;
// Lighting expressed in a small common scalar/vector dialect for identical GL/WGPU response.
const body=`
 CONST N=normalize(norm);
 CONST V=normalize(eye-pos);
 CONST L=normalize(V3(.96,1.03,1.31));
 CONST F=normalize(V3(-.85,.22,.86));
 CONST R=normalize(V3(.55,.98,-.74));
 CONST H=normalize(L+V);
 CONST nl=dot(N,L);
 CONST hemi=clamp(N.y*.45+.55,0.,1.);
 CONST wrap=clamp((nl+.27)/1.27,0.,1.);
 CONST skin=(1.-step(.45,abs(kind-1.)));
 CONST hair=(1.-step(.45,abs(kind-2.)));
 CONST metal=(1.-step(.45,abs(kind-3.)));
 CONST pearl=(1.-step(.45,abs(kind-4.)));
 CONST glass=(1.-step(.45,abs(kind-5.)));
 CONST shadow=mix(.68,1.,visibility);
 CONST ambient=mix(V3(.34,.345,.417),V3(.505,.534,.664),hemi);
 CONST diffuse=ambient+shadow*(V3(.80,.696,.59)*wrap+V3(.13,.15,.215)*max(dot(N,F),0.))+V3(.16,.13,.125)*pow(max(dot(N,R),0.),2.);
 CONST edge=pow(1.-clamp(dot(N,V),0.,1.),3.);
 CONST gloss=mix(135.,9.,rough*rough);
 CONST shine=pow(max(dot(H,N),0.),gloss)*(.16+.48*pow(1.-rough,2.))*spec*shadow*(1.-.27*skin);
 CONST shell=skin*.029*clamp(1.-abs(nl+.14)*1.18,0.,1.);
 CONST rim=pow(max(dot(N,R),0.),3.)*(.17+.4*edge);
 CONST base=pow(max(albedo,V3(0.)),V3(2.2));
 CONST silk=pow(max(dot(N,normalize(V3(.35,.66,.81))),0.),12.)*.12+pow(max(dot(N,normalize(V3(-.57,.73,.49))),0.),18.)*.055;
 VAR c=base*diffuse+V3(1.,.88,.80)*shine+V3(1.,.26,.11)*shell*sqrt(base)+V3(1.,.78,.61)*rim*(.016+.082*hair+.024*pearl+.007*skin);
 c+=hair*silk*V3(.39,.22,.15);
 if(hair>.5){
 CONST flow=normalize(V3(sign(pos.x)*mix(.10,.88,smoothstep(.40,1.12,pos.y)),-1.,-.28));
 CONST strand=normalize(flow-N*dot(flow,N)+V3(.0001));
 CONST kd=clamp(dot(strand,H)+.12,-1.,1.);
 CONST band=pow(max(0.,1.-kd*kd),14.)*max(nl,0.)*shadow;
 c+=V3(.045,.025,.016)*band;
 }
 if(glass+metal+pearl>.5){
 CONST mirror=reflect(-V,N);
 CONST windowDir=dot(mirror,normalize(V3(-.47,.65,.76)));
 CONST tall=smoothstep(.965,.984,windowDir);
 CONST edgeBox=smoothstep(.992,.998,windowDir);
 c+=V3(.90,.88,1.)*((.10*metal+.16*pearl)*tall+.16*glass*edgeBox);
 }
 c+=metal*(V3(.16,.14,.13)*pow(max(dot(N,R),0.),6.)+V3(.21,.22,.27)*edge);
 c+=pearl*(V3(.07,.047,.07)*edge+V3(.035,.042,.068)*hemi);
 if(glass>.5){
 CONST corneal=normalize(V3(pos.x-sign(pos.x)*.306,(pos.y-.147)*.95,.121));
 CONST optic=reflect(-V,corneal);
 CONST catchlight=smoothstep(.988,.998,dot(optic,normalize(V3(-.48,.52,.83))));
 CONST catchSmall=smoothstep(.997,.9995,dot(optic,normalize(V3(-.21,.44,.89))));
 c+=V3(.64,.64,.66)*catchlight+V3(.32,.33,.36)*catchSmall;
 }
 if(skin>.5){c *= skinDetail(pos,V3(1.));}
 RETURN pow(clamp(c,V3(0.),V3(1.)),V3(1./2.2));`;
export const glslLit=glNoise+'vec3 illuminate(vec3 norm,vec3 pos,vec3 eye,vec3 albedo,float rough,float spec,float kind,float visibility){'+body.replaceAll('CONST ','').replaceAll('VAR ','').replaceAll('V3','vec3').replaceAll('RETURN','return').replace(/(\b(?:N|V|L|F|R|H|ambient|diffuse|base|c|flow|strand|mirror|corneal|optic))=/g,'vec3 $1=').replace(/\b(nl|hemi|wrap|skin|hair|metal|pearl|glass|shadow|edge|gloss|shine|shell|rim|silk|kd|band|windowDir|tall|edgeBox|catchlight|catchSmall)=/g,'float $1=')+'}';
export const wgslLit=wgNoise+'fn illuminate(norm:vec3f,pos:vec3f,eye:vec3f,albedo:vec3f,rough:f32,spec:f32,kind:f32,visibility:f32)->vec3f{'+body.replaceAll('CONST ','let ').replaceAll('VAR ','var ').replaceAll('V3','vec3f').replaceAll('RETURN','return')+'}';
