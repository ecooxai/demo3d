import {trySkyLattice} from './renderer-noise.mjs';
/**
 * Native WebGPU + WebGL2, no dependencies, fallback, downloaded resources or
 * post-process libraries. Every pass shares the same linear illumination model.
 * Film transfer is applied explicitly exactly once (8-bit non-sRGB swapchain).
 */
import {skyGLSL,skyWGSL} from './sky.mjs';
import {unit,cross,sub} from './geometry.mjs';
const NEAR=.055,FAR=7200;
const ranks={opaque:0,emissive:1,alpha:2,additive:3};
export function cameraFrame({eye=[0,1.7,4.6],target=[0,2.7,-1.2],up=[0,1,0],fovY=48,time=0}={},w=900,h=1200){
  let forward=unit(sub(target,eye));if(!forward.some(Boolean)) forward=[0,0,-1];
  let right=unit(cross(forward,up));if(!right.some(Boolean))right=unit(cross(forward,Math.abs(forward[1])<.8?[0,1,0]:[1,0,0]));
  const upright=cross(right,forward),tan=Math.tan(Math.max(5,Math.min(150,fovY))*Math.PI/360);
  return Float32Array.of(...eye,time,...right,tan*w/h,...upright,tan,...forward,NEAR,FAR,1/w,1/h,0);
}
function prepare(scene){
 const arr=Array.isArray(scene)?scene:scene?.meshes;if(!Array.isArray(arr))throw Error('Scene must supply a mesh array.');
 return arr.filter(m=>m?.indices?.length).map(m=>{if(!(m.mode in ranks)&&m.mode!==undefined)throw Error('Unknown mesh mode '+m.mode);
  if(!(m.vertices instanceof Float32Array)||m.vertices.length%10||!(m.indices instanceof Uint32Array)||m.indices.length%3)throw Error('Invalid mesh layout: '+(m.name??'unnamed'));
  const mode=m.mode??'opaque';return {...m,mode,kind:({figure:1,rooftop:2,hut:3,bicycle:4,utility:5,plantings:5})[m.name]??0,unlit:!!m.unlit||mode==='emissive'||mode==='additive'};}).sort((a,b)=>ranks[a.mode]-ranks[b.mode]);
}
const gsHead=`#version 300 es
precision highp float;precision highp int;
layout(std140) uniform Frame{vec4 eyeTime;vec4 sideX;vec4 topY;vec4 frontN;vec4 farPx;};
`;
// Local contact radiance loss, in world metres. Real contact anchors come from
// the rooftop model. Analytic receiver shading avoids coplanar shadow decals,
// z-fighting and a scene-wide shadow-map pass; it is never applied to the sky/city.
function contactCode(wgsl){
 const v=wgsl?'vec2f':'vec2',F=wgsl?'f32':'float',decl=(n,args,body)=>wgsl?'fn '+n+'('+args.map(a=>a[0]+':'+a[1]).join(',')+')->f32{'+body+'}\n':'float '+n+'('+args.map(a=>a[1]+' '+a[0]).join(',')+'){'+body+'}\n';
 const def=(n,e)=>wgsl?'let '+n+'='+e+';':'vec2 '+n+'='+e+';';
 let s=decl('tnPatch',[['p',v],['c',v],['r',v]],def('q','(p-c)/r')+'return 1.-smoothstep(.01,1.,dot(q,q));');
 s+=decl('tnBoxContact',[['p',v],['c',v],['halfExt',v],['feather',F]],def('d','max(abs(p-c)-halfExt,'+v+'(0))')+'return 1.-smoothstep(0.,feather,length(d));');
 const ell=[[-.022,-.109,.096,.164,.32],[.194,.020,.096,.164,.32],[.13,.09,.32,.31,.14],[.20,.34,.27,.46,.12],[-1.80,-1.79,.099,.113,.51],[-.76,-1.67,.099,.113,.50],[-1.28,-1.62,.72,.27,.14],[1.56,.37,.45,.50,.48]];
 const boxes=[[3.17,-.205,1.53,.595,.45,.53],[-3.70,.19,2.04,.40,.25,.51],[-3.30,-.87,.48,.21,.18,.40],[-2.23,-.95,.44,.21,.18,.40],[-4.96,-.61,.51,.21,.18,.42],[-5.13,.66,.53,.22,.18,.42],[-3.81,3.83,.56,.22,.17,.43],[-5.13,4.78,.55,.22,.16,.41],[-3.35,5.76,1.05,.39,.31,.53]];
 const f=n=>Number(n).toFixed(4),xy=(a,b)=>v+'('+f(a)+','+f(b)+')';let b=wgsl?'var loss=0.;':'float loss=0.;';
 // True, flat anatomical soles. Concentrate occlusion at their physical edge
 // instead of darkening a wide circular patch beneath the stance.
 for(const [x,z,id] of [[-.022,-.109,'footL'],[.194,.020,'footR']]){b+=def(id,'p-'+xy(x,z))+'loss+=.49*(1.-smoothstep(.044,.079,length('+v+'('+id+'.x,max(abs('+id+'.y)-.055,0.)))));\n';}
 for(const [x,z,rx,rz,k] of ell)b+='loss+='+f(k)+'*tnPatch(p,'+xy(x,z)+','+xy(rx,rz)+');\n';
 for(const [x,z,rx,rz,soft,k] of boxes)b+='loss=max(loss,'+f(k)+'*tnBoxContact(p,'+xy(x,z)+','+xy(rx,rz)+','+f(soft)+'));\n';
 s+=decl('tnContact',[['p',v]],b+'return 1.-min(.85,loss);');return s;
}
// Local material responses; specialization means the city, transparent haze,
// sky and unrelated rooftop surfaces do not evaluate terrace lighting details.
function trimLight(wgsl){let s=`
 if(kind==1){
   // Sky/city light grazes the left raglan seam only, not an outline pass.
   float shoulder=smoothstep(1.33,1.44,pos.y)*(1.-smoothstep(1.51,1.555,pos.y));
   float side=smoothstep(-.03,.74,-n.x)*(.45+.55*max(0.,n.y));
   float cloth=(1.-smoothstep(.025,.23,pos.x))*(.42+.58*smoothstep(-.45,.76,n.z));
   // Diffuse night cloth faces away from the bright opening. Leave uncovered
   // face, neck and hands alone; silhouette value is not screen-coordinate based.
   float torso=smoothstep(.79,1.00,pos.y)*(1.-smoothstep(1.505,1.542,pos.y));
   float clothLee=smoothstep(-.42,.62,dot(n,vec3(.70,-.10,.70)));
   float innerArm=smoothstep(.05,.22,abs(pos.x-.083));
   surface*=1.-torso*(.125+.235*clothLee+.090*innerArm*clothLee);
   surface+=base*vec3(.064,.165,.295)*shoulder*side*cloth;
   // Only the raglan cap and nape can see the station's long, low luminous core.
   float stationFace=max(0.,dot(n,vec3(-.46,.12,-.88)));
   float cap=(.21+.79*max(n.y,0.))*(1.-smoothstep(.10,.245,pos.x));
   surface+=base*vec3(.126,.059,.226)*stationFace*cap*shoulder;
   // The distant neighborhood has a long low violet source to camera-left.
   // Hair daylight response is not shared with cloth or skin.
   float head=smoothstep(1.525,1.573,pos.y)*(1.-smoothstep(1.685,1.756,pos.y));
   float leftSide=1.-smoothstep(.035,.164,pos.x);
   float glancing=1.-abs(dot(n,-ray));float sourceSide=max(0.,dot(n,vec3(-.61,.16,-.776)));
   float darkHair=1.-smoothstep(.057,.116,dot(base,vec3(.25,.57,.18)));
   surface+=(base*vec3(.158,.066,.232)+vec3(.00115,.00037,.0022))*head*leftSide*sourceSide*(.27+.73*glancing*glancing)*darkHair;
   // A little less indirect fill on the sleeve facing away from the city.
   surface*=1.-.095*shoulder*smoothstep(.13,.225,pos.x)*max(0.,n.x);
 }else if(kind==2){
   if(abs(pos.y-.002)<.05 && abs(n.y)>.82 && abs(pos.x)<7. && abs(pos.z)<7.){// Four feet meet the slab, the plinth is elevated. Contact darkens
     // only the true edges. Projected shade and occluded skylight have separate widths.
     float tankDeck=tnBoxContact(pos.xz,vec2(3.74,4.57),vec2(.44,.42),.48);
     float tankFoot=1.-smoothstep(.012,.098,length(max(abs(abs(pos.xz-vec2(3.74,4.57))-vec2(.34,.31))-vec2(.046,.044),vec2(0.))));
     float tankProj=clamp(dot(pos.xz-vec2(3.74,4.57),vec2(.52,.85)),0.,1.06);
     float tankUmb=1.-smoothstep(.44,.63+.26*tankProj,length(pos.xz-vec2(3.74,4.57)-vec2(.52,.85)*tankProj));
     float baseContact=tnContact(pos.xz);
     surface*=baseContact*(1.-.62*tankDeck)*(1.-.76*tankFoot)*(1.-.36*tankUmb);
     // Night adaptation belongs to this concrete receiver only. Roof drains
     // collect moisture from seams: irregular broad spreading at a drain,
     // narrow dark edges, small blue reflections through the open sky.
     float jointX=abs(fract((pos.x+5.26)/1.06+.5)-.5)*1.06;
     float jointZ=abs(fract((pos.z+1.58)/1.03+.5)-.5)*1.03;
     float waterLine=1.-smoothstep(.009,.059,min(jointX,jointZ));
     float drainA=tnPatch(pos.xz,vec2(1.04,-1.63),vec2(.78,.69));
     float drainB=tnPatch(pos.xz,vec2(-4.75,-1.67),vec2(.64,1.14));
     float gutter=1.-smoothstep(.06,.52,min(abs(pos.x+5.58),abs(pos.x-4.87)));
     float catchment=max(max(drainA,drainB),gutter*.83);
     float oldMortar=1.-smoothstep(.153,.261,base.g);
     float tide=(.51+.49*sin(pos.z*4.1+pos.x*1.73+1.2*sin(pos.x*2.24)));
     // Rain holds in short disconnected reaches, not a uniformly inked grid.
     // The rarer saturated reach is confined to existing drainage hardware.
     float localWet=max(catchment,tankDeck*.75);
     float jointReach=.48+.13*tide+.39*localWet;
     float mortarAway=mix(oldMortar,.57,.64*waterLine*(1.-localWet));
     float damp=clamp(catchment*(.48+.52*tide)+waterLine*(.22+.40*tide)*jointReach+.22*mortarAway,0.,1.);
     float openEdge=(1.-smoothstep(-1.8,2.75,pos.z))*(1.-smoothstep(.35,3.5,abs(pos.x+.42)));
     float temper=.68+.18*(1.-mortarAway)+.13*openEdge;
     surface*=temper*(1.-.42*damp);
     float reflected=pow(max(0.,dot(reflect(ray,n),vec3(-.38,.41,-.829))),9.);
     surface+=vec3(.004,.009,.019)*reflected*damp*baseContact*(1.-tankDeck);
     // A broad high window in the sky gives the person and garden short shadows,
     // narrow at the shoe/coping and softer farther down the slab.
     float proj=clamp(dot(pos.xz-vec2(.087,-.03),vec2(.48,.877)),0.,.99);
     float wd=.073+.159*smoothstep(.05,.90,proj);
     float stanceAxis=length(pos.xz-vec2(.087,-.03)-vec2(.48,.877)*proj);
     float bodyShadow=(1.-smoothstep(wd,wd+.10+.13*proj,stanceAxis))*(1.-smoothstep(.67,1.22,proj));
     float gardenEdge=tnBoxContact(pos.xz-vec2(.23,.34),vec2(-3.70,.19),vec2(1.96,.38),.34);
     float northLight=.28+.10*openEdge;
     surface*=1.-northLight*max(bodyShadow,gardenEdge);
     
     // Short-range loss of skylight beside the back parapet/utility group.
     float setback=(1.-smoothstep(.02,.91,abs(pos.z-6.61)))*(1.-smoothstep(2.1,4.5,abs(pos.x+1.8)));
     surface*=1.-.105*setback;
     // Partial skylight blockage by the garden bed and cabin canopy. The
     // landings between structures remain exposed, even in a reverse view.
     float gardenShadow=(1.-smoothstep(.44,1.76,abs(pos.z-.51)))*(1.-smoothstep(.30,2.81,abs(pos.x+3.50)));
     float hoodShadow=(1.-smoothstep(.12,1.42,abs(pos.x-1.53)))*(1.-smoothstep(.28,1.61,abs(pos.z-.34)));
     float serviceShadow=(1.-smoothstep(.30,1.73,abs(pos.x+3.33)))*(1.-smoothstep(.35,1.36,abs(pos.z-5.58)));
     surface*=1.-.31*max(gardenShadow,max(hoodShadow,serviceShadow));
     // Partial loss of the VERY low, distant urban light behind the one-story
     // hut; broadening with distance, no noise, decal, or screen-space shadow.
     float castDepth=smoothstep(.37,.70,pos.z)*(1.-smoothstep(.76,2.67,pos.z));
     float castEdge=1.-smoothstep(1.24,2.12,abs(pos.x-(3.21+.12*pos.z)));
     float spillLoss=castDepth*castEdge;surface*=vec3(1.-.17*spillLoss,1.-.13*spillLoss,1.-.093*spillLoss);}
   // A narrow directional reflection on the actual north rail, broken where
   // structural/shrub shadows interrupt it. Sky-facing paint is brightest.
   if(pos.z>-2.13 && pos.z< -1.55 && pos.y>1.075 && pos.y<1.17){
     float crest=smoothstep(1.082,1.119,pos.y)*(.28+.72*max(n.y,0.));
     float railwash=.17+.48*(1.-smoothstep(.20,2.48,abs(pos.x+.38)))+.20*(1.-smoothstep(.1,.81,abs(pos.x+3.55)));
     surface+=base*vec3(.067,.230,.386)*crest*railwash;
     float urbanEdge=(1.-smoothstep(.32,2.1,abs(pos.x+.42)))*(.26+.74*max(0.,-n.z));
     surface+=base*vec3(.078,.035,.159)*crest*urbanEdge;
   }
 }else if(kind==3 && pos.x>1.29 && pos.x<4.74 && pos.y>.06 && pos.y<2.5){
   // Real projecting side cabinets were outside the former receiver bounds.
   // The housing caps catch the open sky; faces, lower lips and wall pockets
   // lose the broad overhead light. Do not paint a screen-space width outline.
   if(pos.x<1.637 && pos.z>-.73 && pos.z<.20 && pos.y>.79 && pos.y<2.55){
     float backing=smoothstep(1.45,1.63,pos.x);
     float under=smoothstep(.03,.86,-n.y);
     float outward=max(0.,-n.x);
     float shadowEnd=smoothstep(-.21,.19,pos.z)*max(n.z,0.);
     float plateEdge=pow(max(0.,dot(n,vec3(-.68,.66,-.32))),3.);
     surface*=1.-.48*under-.23*backing*(1.-under)-.17*shadowEnd;
     float catchMetal=smoothstep(.15,.35,base.g);
     surface+=(base*vec3(.046,.104,.184)+vec3(.0003,.0007,.0013))*plateEdge*(.34+.66*catchMetal);
     float wiring=(1.-smoothstep(.072,.148,base.g))*outward;
     surface*=1.-.24*wiring;
   }
   if(pos.x>1.632 && pos.x<1.647 && n.x<-.64 && pos.z>-.79 && pos.z<.33){
     float cabinetZ=1.-smoothstep(.225,.35,abs(pos.z+.245));
     float lostSky=max(1.-smoothstep(.21,.35,abs(pos.y-1.30)),1.-smoothstep(.16,.34,abs(pos.y-2.08)));
     surface*=1.-.57*cabinetZ*lostSky;
   }
   if(pos.z>.36 && pos.z<.53 && n.z>.6){
     float eave=smoothstep(1.30,2.21,pos.y)*smoothstep(1.84,2.15,pos.x)*(1.-smoothstep(4.38,4.61,pos.x));
     float jamb=1.-smoothstep(0.,.34,abs(pos.x-1.67));
     surface*=1.-.55*eave-.19*jamb;
     float dripEdge=(1.-smoothstep(.015,.16,abs(pos.x-3.34)))*smoothstep(.17,.71,pos.y)*(1.-smoothstep(1.27,1.95,pos.y));
     surface*=1.-.14*dripEdge;
     surface+=base*vec3(.009,.024,.043)*(1.-eave)*(1.-smoothstep(1.62,3.9,pos.x));
     // Slight damp blue bounce concentrated toward the city-facing return.
     float plate=(1.-smoothstep(.05,.49,abs(pos.x-2.08)))*smoothstep(.16,.68,pos.y)*(1.-smoothstep(1.59,2.18,pos.y));
     surface+=base*vec3(.007,.034,.052)*plate*(1.-eave);
   }else if(pos.x<1.69 && pos.z>-.84 && pos.z<.48 && n.x<-.58){
     float foot=smoothstep(.04,.52,pos.y);float sidewash=(1.-smoothstep(-.65,.44,pos.z))*.46+.54;
     surface+=base*vec3(.020,.052,.101)*sidewash*foot;
     surface*=1.-.22*smoothstep(1.80,2.44,pos.y);
   }
   // Edge beneath the projecting eave receives a weak lateral station reflection;
   // front-facing door field stays dark. The metal is never emissive.
   // Rolled, skyward cap at the actually modeled roof edge; the dark
   // underside and broad painted front wall never enter this mask.
   if(pos.y>2.22 && pos.z>-.92 && pos.z<.86){
     float shortRun=1.-smoothstep(.06,.46,abs(pos.x-1.73));
     float altitude=smoothstep(2.24,2.38,pos.y);float capFace=max(0.,dot(n,vec3(-.54,.775,-.32)));
     surface+=(base*vec3(.065,.135,.218)+vec3(.0003,.0007,.0013))*altitude*shortRun*capFace;
   }
   if(pos.y>1.91 && pos.z<.49 && pos.x<2.30){
     float frameGlow=(1.-smoothstep(.05,.52,abs(pos.x-1.68)))*smoothstep(1.91,2.22,pos.y);
     surface+=base*vec3(.031,.019,.077)*max(0.,dot(n,vec3(-.51,.09,-.85)))*frameGlow;
   }
 }else if(kind==4 && pos.y>.46 && pos.y<1.07){
   // A sparse long source picks out upward/backward steel hardware, not tires.
   float steel=smoothstep(.075,.27,dot(base,vec3(.25,.57,.18)));
   float sourceFacing=max(0.,dot(n,vec3(-.41,.17,-.90)));
   float smallGlint=(.30+.70*max(0.,n.y))*(.35+.65*(1.-abs(dot(n,-ray))));
   surface+=base*vec3(.084,.080,.191)*steel*sourceFacing*smallGlint;
 }else if(kind==5){
   // Concrete on the near planter reads as a dark mass. Only the faces
   // below its real coping lose the low city light. Green leaves excluded.
   if(pos.x< -1.69 && pos.x> -5.86 && pos.z>-.29 && pos.z<.71 && pos.y<1.10){
     float neutralStone=smoothstep(-.012,.027,base.b-base.g*.89);
     float upright=1.-smoothstep(.12,.66,abs(n.y));
     float closedSide=max(0.,dot(n,vec3(.29,-.04,.956)));
     float pocket=(1.-smoothstep(.83,1.038,pos.y))*(.76+.24*(1.-smoothstep(.09,.45,pos.y)));
     surface*=1.-neutralStone*upright*pocket*(.205+.43*closedSide);
     float lip=smoothstep(.993,1.042,pos.y)*max(n.y,0.)*(1.-smoothstep(.20,1.47,abs(pos.x+2.25)));
     surface+=base*vec3(.026,.052,.084)*neutralStone*lip;
   }
   if(abs(pos.x-3.74)<.72 && abs(pos.z-4.57)<.72 && pos.y>-.015 && pos.y<2.15){
     // Curved tank catches the city on ONE quadrant. Rib undersides and the
     // support frame remain shadowed. This is a material response, not bloom.
     float plinth=1.-smoothstep(.30,.43,pos.y);
     float underBelly=1.-smoothstep(.35,.64,pos.y);
     surface*=1.-plinth*.18-underBelly*(.17+.21*max(0.,-n.y));
     float sidewall=smoothstep(.30,.57,pos.y)*(1.-smoothstep(1.66,2.08,pos.y));
     float cool=max(0.,dot(n,vec3(-.55,.14,-.823)));
     float lee=max(0.,dot(n,vec3(.68,-.10,.724)));
     surface*=1.-.235*lee*sidewall;
     surface+=base*vec3(.046,.045,.103)*cool*(.24+.76*sidewall);
     float raised=smoothstep(.27,.77,n.y)*smoothstep(.46,1.43,pos.y);
     surface+=base*vec3(.017,.022,.045)*raised*cool;
     float hood=max(n.y,0.)*(.36+.64*max(0.,-n.x));
     float steelSpec=pow(max(0.,dot(reflect(ray,n),vec3(-.48,.65,-.59))),14.);
     surface+=vec3(.006,.013,.026)*steelSpec*(1.-plinth)+base*vec3(.035,.075,.13)*hood*(1.-underBelly);
     surface*=1.-.19*sidewall*max(0.,-n.y);
   }else if(pos.x<-.87 && pos.x> -5.9 && pos.z> -2.04 && pos.z<.64 && pos.y>.20){
     // A few upper leaf faces see the overhead opening between the parapet
     // and hut, while undersides in the same planting keep their dark mass.
     float green=clamp((base.g-.94*base.r)*10.,0.,1.);
     float source=max(0.,dot(n,vec3(-.39,.73,-.56)));
     float gap=(1.-smoothstep(.20,1.58,abs(pos.x+2.27)))*(1.-smoothstep(.32,1.01,abs(pos.z+.78)));
     float height=smoothstep(.35,.80,pos.y);
     surface+=(base*vec3(.043,.075,.138)+vec3(.0006,.0009,.0015))*green*gap*height*source*source*source;
     surface*=1.-.085*green*gap*(1.-height)*(1.-source);
   }
 }
`;return wgsl?s.replaceAll('float ','let ').replaceAll('vec3(','vec3f(').replaceAll('vec2(','vec2f('):s}
const gsFilm=contactCode(false)+`
vec3 tnFilm(vec3 inputRGB,vec2 pixel) {
 vec3 rgb=max(vec3(0),inputRGB);float y=dot(rgb,vec3(.2126,.7152,.0722));rgb=rgb*(1.+.09*y)/(1.+y);
 vec3 srgb=mix(12.92*rgb,1.055*pow(max(vec3(0),rgb),vec3(1./2.4))-.055,greaterThan(rgb,vec3(.0031308)));
 float grain=fract(52.9829189*fract(dot(floor(pixel),vec2(.06711056,.00583715))))-.5;
 return clamp(srgb+grain*(.8/255.),0.,1.);
}
vec3 tnLight(vec3 base,vec3 pos,vec3 norm,bool lit,int kind){
 float d=length(pos-eyeTime.xyz);vec3 ray=(pos-eyeTime.xyz)/max(d,.001);vec3 surface=base;
 if(lit){
 vec3 n=norm*inversesqrt(max(.0001,dot(norm,norm)));float hemi=clamp(n.y*.5+.5,0.,1.);
 vec3 amb=mix(vec3(.043,.054,.085),vec3(.206,.282,.389),hemi);
 float key=max(0.,dot(n,vec3(-.48,.65,-.59)));
 float edge=pow(clamp(1.-abs(dot(n,-ray)),0.,1.),3.)*(.24+.76*key);
 surface=base*(amb+vec3(.067,.097,.147)*key)+vec3(.010,.019,.036)*edge;
 ${trimLight(false)}
 }
 float haze=1.-exp(-d*.00085);
 vec3 atmos=mix(vec3(.021,.040,.086),vec3(.026,.062,.108),max(0.,-ray.z));
 return mix(surface,atmos,clamp(haze*.83,0.,.79));
}
`;
const gsSkyV=gsHead+`out vec2 vClip;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2))*2.-1.;vClip=p;gl_Position=vec4(p,1.,1.);}
`;
const gsSkyF=gsHead+gsFilm+skyGLSL+`
in vec2 vClip;out vec4 dest;
void main(){vec3 ray=normalize(frontN.xyz+sideX.xyz*(vClip.x*sideX.w)+topY.xyz*(vClip.y*topY.w));dest=vec4(tnFilm(sceneSky(ray,eyeTime.w),gl_FragCoord.xy),1.);}
`;
const gsMeshV=gsHead+`
layout(location=0) in vec3 p;layout(location=1) in vec3 normal;layout(location=2) in vec4 color;
out vec3 wPos;out vec3 wNormal;out vec4 tint;
void main(){wPos=p;wNormal=normal;tint=color;vec3 v=p-eyeTime.xyz;float z=dot(v,frontN.xyz);float n=frontN.w,f=farPx.x;gl_Position=vec4(dot(v,sideX.xyz)/sideX.w,dot(v,topY.xyz)/topY.w,((f+n)*z-2.*n*f)/(f-n),z);}
`;
const gsMeshF=gsHead+gsFilm+`
uniform bool uLit;uniform int uKind;in vec3 wPos;in vec3 wNormal;in vec4 tint;out vec4 dest;
void main(){dest=vec4(tnFilm(tnLight(tint.rgb,wPos,wNormal,uLit,uKind),gl_FragCoord.xy),clamp(tint.a,0.,1.));}
`;
const wsFrame=contactCode(true)+`
struct Frame{eyeTime:vec4f, sideX:vec4f, topY:vec4f, frontN:vec4f, farPx:vec4f};
@group(0) @binding(0) var<uniform> frame:Frame;
fn tnFilm(inputRGB:vec3f,pixel:vec2f)->vec3f{
 var rgb=max(inputRGB,vec3f(0));let y=dot(rgb,vec3f(.2126,.7152,.0722));rgb=rgb*(1.+.09*y)/(1.+y);
 let srgb=select(12.92*rgb,1.055*pow(max(rgb,vec3f(0)),vec3f(1./2.4))-.055,rgb>vec3f(.0031308));
 let grain=fract(52.9829189*fract(dot(floor(pixel),vec2f(.06711056,.00583715))))-.5;
 return clamp(srgb+grain*(.8/255.),vec3f(0),vec3f(1));
}
fn tnLight(base:vec3f,pos:vec3f,norm:vec3f,lit:bool,kind:i32)->vec3f{
 let d=length(pos-frame.eyeTime.xyz);let ray=(pos-frame.eyeTime.xyz)/max(d,.001);var surface=base;
 if(lit){
 let n=norm*inverseSqrt(max(.0001,dot(norm,norm)));let hemi=clamp(n.y*.5+.5,0.,1.);
 let amb=mix(vec3f(.043,.054,.085),vec3f(.206,.282,.389),hemi);
 let key=max(0.,dot(n,vec3f(-.48,.65,-.59)));
 let edge=pow(clamp(1.-abs(dot(n,-ray)),0.,1.),3.)*(.24+.76*key);
 surface=base*(amb+vec3f(.067,.097,.147)*key)+vec3f(.010,.019,.036)*edge;
 ${trimLight(true)}
 }
 let haze=1.-exp(-d*.00085);
 let atmos=mix(vec3f(.021,.040,.086),vec3f(.026,.062,.108),max(0.,-ray.z));
 return mix(surface,atmos,clamp(haze*.83,0.,.79));
}
`;
const wsSky=wsFrame+skyWGSL+`
struct SkyOut{@builtin(position) position:vec4f,@location(0) clip:vec2f};
@vertex fn vs(@builtin(vertex_index) idx:u32)->SkyOut{
 let p=vec2f(f32((idx<<1u)&2u),f32(idx&2u))*2.-1.;var o:SkyOut;o.clip=p;o.position=vec4f(p,1.,1);return o;
}
@fragment fn fs(i:SkyOut)->@location(0) vec4f{
 let ray=normalize(frame.frontN.xyz+frame.sideX.xyz*(i.clip.x*frame.sideX.w)+frame.topY.xyz*(i.clip.y*frame.topY.w));
 return vec4f(tnFilm(sceneSky(ray,frame.eyeTime.w),i.position.xy),1.);
}`;
const wsMesh=wsFrame+`
override tnKind:i32=0;
struct In{@location(0) p:vec3f,@location(1) n:vec3f,@location(2) color:vec4f};
struct Out{@builtin(position) position:vec4f,@location(0) wp:vec3f,@location(1) wn:vec3f,@location(2) color:vec4f};
@vertex fn vs(v:In)->Out{
 var o:Out;o.wp=v.p;o.wn=v.n;o.color=v.color;let rel=v.p-frame.eyeTime.xyz;let z=dot(rel,frame.frontN.xyz);let n=frame.frontN.w;let f=frame.farPx.x;
 o.position=vec4f(dot(rel,frame.sideX.xyz)/frame.sideX.w,dot(rel,frame.topY.xyz)/frame.topY.w,f*(z-n)/(f-n),z);return o;
}
fn shade(i:Out,lit:bool)->vec4f{return vec4f(tnFilm(tnLight(i.color.rgb,i.wp,i.wn,lit,tnKind),i.position.xy),clamp(i.color.a,0.,1.));}
@fragment fn fsLit(i:Out)->@location(0) vec4f{return shade(i,true);}
@fragment fn fsEmit(i:Out)->@location(0) vec4f{return shade(i,false);}
`;
function dimensions(w,h,max){w=Math.round(w);h=Math.round(h);if(!Number.isFinite(w+h)||Math.min(w,h)<1||Math.max(w,h)>max)throw RangeError('Resolution must be between 1 and '+max+' pixels.');return [w,h]}
function report(info,data){info.meshes=data.length;info.triangles=data.reduce((s,m)=>s+m.count/3,0);info.geometryBytes=data.reduce((s,m)=>s+m.bytes,0)}
export async function initRenderer(canvas,backend){
 if(backend==='webgl2')return makeGL(canvas);
 if(backend==='webgpu')return await makeGPU(canvas);
 throw Error('Choose WebGPU or WebGL2 explicitly.');
}
export const createRenderer=initRenderer;

function makeGL(canvas){
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
 if(!gl)throw Error('WebGL2 could not create a rendering context.');
 const makeProgram=(v,f)=>{
  const pg=gl.createProgram(),sh=[];try{for(const [type,src] of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){
   const s=gl.createShader(type);sh.push(s);gl.shaderSource(s,src);gl.compileShader(s);
   if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('GLSL: '+gl.getShaderInfoLog(s));gl.attachShader(pg,s);
  }gl.linkProgram(pg);if(!gl.getProgramParameter(pg,gl.LINK_STATUS))throw Error('WebGL2 link: '+gl.getProgramInfoLog(pg));}
  catch(e){gl.deleteProgram(pg);throw e}finally{for(const s of sh)gl.deleteShader(s)}
  const block=gl.getUniformBlockIndex(pg,'Frame');if(block!==gl.INVALID_INDEX)gl.uniformBlockBinding(pg,block,0);return pg;
 };
 let cache=trySkyLattice(gl,makeProgram,skyGLSL),sky;
 if(cache.enabled){try{sky=makeProgram(gsSkyV,gsSkyF.replace(skyGLSL,()=>cache.shader));cache.bind(sky)}
 catch(e){if(sky)gl.deleteProgram(sky);sky=null;cache.dispose();cache={enabled:false,reason:'cached program unavailable',bytes:0,initMs:cache.initMs}}}
 if(!sky)sky=makeProgram(gsSkyV,gsSkyF);
 const mesh=makeProgram(gsMeshV,gsMeshF),lit=gl.getUniformLocation(mesh,'uLit'),mat=gl.getUniformLocation(mesh,'uKind');
 const ub=gl.createBuffer();gl.bindBuffer(gl.UNIFORM_BUFFER,ub);gl.bufferData(gl.UNIFORM_BUFFER,80,gl.DYNAMIC_DRAW);gl.bindBufferBase(gl.UNIFORM_BUFFER,0,ub);
 const empty=gl.createVertexArray(),max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
 const info={backend:'webgl2',noiseCache:{enabled:cache.enabled,bytes:cache.bytes,initMs:cache.initMs,reason:cache.reason??null},maxDimension:max,frames:0,meshes:0,triangles:0,geometryBytes:0,antialias:gl.getContextAttributes()?.antialias??false};
 let data=[],gone=false,lost=false;
 const loss=e=>{e.preventDefault();lost=true;info.lost=true;canvas.dispatchEvent(new CustomEvent('tiamat-device-lost',{detail:'WebGL2 context was lost. Re-select a renderer to reconnect.'}))};
 canvas.addEventListener('webglcontextlost',loss);
 const free=list=>{for(const m of list){gl.deleteVertexArray(m.vao);gl.deleteBuffer(m.ib);gl.deleteBuffer(m.vb)}};
 function setScene(scene){
  if(gone||lost)throw Error('Renderer is not available.');const src=prepare(scene),next=[];
  try{for(const m of src){const vao=gl.createVertexArray(),vb=gl.createBuffer(),ib=gl.createBuffer();next.push({vao,vb,ib,mode:m.mode,kind:m.kind,unlit:m.unlit,count:m.indices.length,bytes:m.vertices.byteLength+m.indices.byteLength});
   gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,m.vertices,gl.STATIC_DRAW);
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,m.indices,gl.STATIC_DRAW);
   for(const [idx,size,offset] of [[0,3,0],[1,3,12],[2,4,24]]){gl.enableVertexAttribArray(idx);gl.vertexAttribPointer(idx,size,gl.FLOAT,false,40,offset)}
  }}catch(e){free(next);throw e}gl.bindVertexArray(null);free(data);data=next;report(info,data);
 }
 function resize(w,h){[w,h]=dimensions(w,h,max);if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;gl.viewport(0,0,w,h)}
 function render(camera={}){
  if(gone||lost)return false;if(camera.width!=null&&camera.height!=null&&(camera.width!==canvas.width||camera.height!==canvas.height))resize(camera.width,camera.height);
  const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;gl.viewport(0,0,w,h);
  gl.bindBuffer(gl.UNIFORM_BUFFER,ub);gl.bufferSubData(gl.UNIFORM_BUFFER,0,cameraFrame(camera,w,h));
  gl.colorMask(true,true,true,true);gl.depthMask(true);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);gl.useProgram(mesh);
  let last=-1,kind=-1,prev=null;
  const draw=m=>{if(prev!==m.mode){if(m.mode==='additive'||m.mode==='alpha'){
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,m.mode==='alpha'?gl.ONE_MINUS_SRC_ALPHA:gl.ONE,gl.ZERO,gl.ONE);gl.depthMask(false);
   }else{gl.disable(gl.BLEND);gl.depthMask(true)}prev=m.mode}
   if(kind!==m.kind){gl.uniform1i(mat,m.kind);kind=m.kind}const l=m.unlit?0:1;if(last!==l){gl.uniform1i(lit,l);last=l}
   gl.bindVertexArray(m.vao);gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_INT,0);};
  // Opaque visibility is solved first. The far sky shades only clear-depth
  // samples, then translucent city scatter blends onto the completed plate.
  let split=0;while(split<data.length&&ranks[data[split].mode]<2)draw(data[split++]);
  gl.useProgram(sky);gl.bindVertexArray(empty);gl.depthFunc(gl.EQUAL);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,3);
  gl.depthFunc(gl.LEQUAL);gl.useProgram(mesh);for(;split<data.length;split++)draw(data[split]);
  gl.bindVertexArray(null);gl.depthMask(true);gl.disable(gl.BLEND);info.frames++;return true;
 }
 function dispose(){if(gone)return;gone=true;canvas.removeEventListener('webglcontextlost',loss);free(data);data=[];cache.dispose?.();gl.deleteBuffer(ub);gl.deleteVertexArray(empty);gl.deleteProgram(mesh);gl.deleteProgram(sky);
  // Each switch creates a fresh canvas. Release this drawing buffer promptly, not after GC.
  gl.getExtension('WEBGL_lose_context')?.loseContext();
 }
 return {setScene,resize,render,dispose,destroy:dispose,info};
}
async function makeGPU(canvas){
 if(!globalThis.navigator?.gpu)throw Error('WebGPU is not available in this browser or origin. Choose WebGL2 to continue.');
 const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});if(!adapter)throw Error('No WebGPU adapter is available. Choose WebGL2 to continue.');
 const device=await adapter.requestDevice(),ctx=canvas.getContext('webgpu');if(!ctx){device.destroy();throw Error('Cannot open WebGPU canvas. Choose WebGL2 to continue.')}
 const format=navigator.gpu.getPreferredCanvasFormat(),max=device.limits.maxTextureDimension2D;
 const info={backend:'webgpu',maxDimension:max,frames:0,meshes:0,triangles:0,geometryBytes:0,antialias:false};
 let gone=false,lost=false,data=[],depth,dw=0,dh=0;
 device.lost.then(reason=>{lost=true;info.lost=true;if(!gone)canvas.dispatchEvent(new CustomEvent('tiamat-device-lost',{detail:'WebGPU device lost: '+reason.message}))});
 try{
 ctx.configure({device,format,alphaMode:'opaque',colorSpace:'srgb'});
 const module=async(source,label)=>{const mod=device.createShaderModule({code:source,label});if(mod.getCompilationInfo){const c=await mod.getCompilationInfo();const es=c.messages.filter(m=>m.type==='error');if(es.length)throw Error('WGSL '+label+': '+es.map(m=>m.lineNum+':'+m.linePos+' '+m.message).join('; '))}return mod};
 const [sSky,sMesh]=await Promise.all([module(wsSky,'Tiamat sky'),module(wsMesh,'Tiamat materials')]);
 const bgl=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:'uniform',minBindingSize:80}}]});
 const layout=device.createPipelineLayout({bindGroupLayouts:[bgl]}),ub=device.createBuffer({size:80,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 const bg=device.createBindGroup({layout:bgl,entries:[{binding:0,resource:{buffer:ub}}]});
 const vertexBuffers=[{arrayStride:40,attributes:[{shaderLocation:0,format:'float32x3',offset:0},{shaderLocation:1,format:'float32x3',offset:12},{shaderLocation:2,format:'float32x4',offset:24}]}];
 const pipeline=desc=>device.createRenderPipelineAsync(desc);
 const sky=await pipeline({label:'Sky • analytic radiance',layout,vertex:{module:sSky,entryPoint:'vs'},fragment:{module:sSky,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthCompare:'equal',depthWriteEnabled:false}});
 const pipes=new Map();
 // Opaque classes specialize the WGSL lighting branch; transparent pipelines stay light.
 await Promise.all(['opaqueL','opaqueE','opaqueK1','opaqueK2','opaqueK3','opaqueK4','opaqueK5','alphaL','alphaE','additiveE'].map(async key=>{
 const alpha=key.startsWith('alpha'),add=key.startsWith('additive'),target={format};if(alpha||add)target.blend={color:{srcFactor:'src-alpha',dstFactor:alpha?'one-minus-src-alpha':'one',operation:'add'},alpha:{srcFactor:'zero',dstFactor:'one',operation:'add'}};
 const p=await pipeline({label:'Scene • '+key,layout,vertex:{module:sMesh,entryPoint:'vs',buffers:vertexBuffers},fragment:{module:sMesh,entryPoint:key.endsWith('E')?'fsEmit':'fsLit',constants:{tnKind:key.includes('K')?Number(key.slice(-1)):0},targets:[target]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth24plus',depthCompare:'less-equal',depthWriteEnabled:!alpha&&!add}});pipes.set(key,p);
 }));
 const free=list=>{for(const m of list){m.vb.destroy();m.ib.destroy()}};
 const upload=(a,kind)=>{if(a.byteLength>device.limits.maxBufferSize)throw Error('Geometry batch exceeds the available WebGPU buffer size.');const b=device.createBuffer({size:a.byteLength,usage:kind,mappedAtCreation:true});new Uint8Array(b.getMappedRange()).set(new Uint8Array(a.buffer,a.byteOffset,a.byteLength));b.unmap();return b};
 function setScene(scene){if(gone||lost)throw Error('WebGPU device unavailable.');const src=prepare(scene),next=[];try{for(const m of src){const key=(m.mode==='emissive'?'opaque':m.mode)+(m.unlit?'E':m.mode==='opaque'&&m.kind?'K'+m.kind:'L'),vb=upload(m.vertices,GPUBufferUsage.VERTEX);let ib;try{ib=upload(m.indices,GPUBufferUsage.INDEX)}catch(e){vb.destroy();throw e}
  next.push({vb,ib,mode:m.mode,pipe:pipes.get(key),count:m.indices.length,bytes:m.vertices.byteLength+m.indices.byteLength});}
 }catch(e){free(next);throw e}free(data);data=next;report(info,data)}
 function resize(w,h){[w,h]=dimensions(w,h,max);if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
  if(!depth||dw!==w||dh!==h){depth?.destroy();depth=device.createTexture({label:'Scene depth',size:[w,h],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});dw=w;dh=h}}
 function render(camera={}){
 if(gone||lost)return false;resize(camera.width??canvas.width,camera.height??canvas.height);device.queue.writeBuffer(ub,0,cameraFrame(camera,dw,dh));
 const encoder=device.createCommandEncoder(),pass=encoder.beginRenderPass({colorAttachments:[{view:ctx.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store',clearValue:{r:0,g:0,b:0,a:1}}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'discard'}});
 pass.setBindGroup(0,bg);let prev=null;
 const draw=m=>{if(prev!==m.pipe){pass.setPipeline(m.pipe);prev=m.pipe}pass.setVertexBuffer(0,m.vb);pass.setIndexBuffer(m.ib,'uint32');pass.drawIndexed(m.count)};
 let split=0;while(split<data.length&&ranks[data[split].mode]<2)draw(data[split++]);
 pass.setPipeline(sky);pass.draw(3);prev=null;for(;split<data.length;split++)draw(data[split]);
 pass.end();device.queue.submit([encoder.finish()]);info.frames++;return true;
 }
 function dispose(){if(gone)return;gone=true;free(data);depth?.destroy();ub.destroy();ctx.unconfigure();device.destroy()}
 return {setScene,resize,render,dispose,destroy:dispose,info};
 }catch(e){gone=true;ctx.unconfigure();device.destroy();throw e}
}

