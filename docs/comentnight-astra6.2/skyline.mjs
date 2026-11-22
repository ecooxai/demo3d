// Original three-dimensional city. Each district has an independent street rhythm,
// lit floors, dark service cores and rooftop silhouettes. No atlas or photograph.
import {MeshBuilder} from './geometry.mjs';
const TAU=Math.PI*2;
const rgb=(r,g,b)=>[r,g,b,1];
const shade=(c,k)=>rgb(c[0]*k,c[1]*k,c[2]*k);
const mix=(a,b,t)=>rgb(...a.slice(0,3).map((x,i)=>x+(b[i]-x)*t));
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function seeded(n){return ()=>{n|=0;n=n+0x6D2B79F5|0;let t=Math.imul(n^n>>>15,1|n);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
export function buildSkyline() {
  const rng=seeded(0x5459414d), terrain=new MeshBuilder(), mass=new MeshBuilder(), lit=new MeshBuilder(), fog=new MeshBuilder();
  const rr=(a,b)=>a+rng()*(b-a), num=(a,b)=>Math.floor(rr(a,b+1));
  const cw=[rgb(.36,.46,.69),rgb(.47,.50,.69),rgb(.75,.68,.72),rgb(.29,.40,.47),rgb(.63,.52,.33),rgb(.38,.55,.53),rgb(.49,.40,.62)];
  // Three concentric hill silhouettes, on a physical surface behind the city.
  for(let j=0;j<3;j++){
    const points=[],n=128,r=260+j*53;
    const col=[rgb(.093,.116,.206),rgb(.124,.143,.246),rgb(.156,.173,.289)][j];
    for(let i=0;i<=n;i++){const a=i/n*TAU;
      const y=r*(.014+.013*j+.012*Math.sin(3*a+2*j)+.008*Math.sin(7*a+j)+.006*Math.sin(16*a+2.1)+.0027*Math.cos(51*a+1.2*j));
      points.push([r*Math.sin(a),y,-r*Math.cos(a)]);}
    for(let i=1;i<=n;i++) {const a=points[i-1],b=points[i];terrain.quad([a[0],-26,a[2]],[b[0],-26,b[2]],b,a,col);}
  }
  function graded(mesh,pts,n,colors){
    const a=mesh.vertices.length/10;
    for(let i=0;i<4;i++)mesh.vertex(pts[i],n,colors[i]);
    mesh.indices.push(a,a+1,a+2,a,a+2,a+3);
  }
  function solid(x,z,w,d,base,roof,col){
    if(suppressPlain)return;
    const x0=x-w*.5,x1=x+w*.5,z0=z-d*.5,z1=z+d*.5;
    const spill=Math.exp(-Math.pow((x+5.6)/26,2)-Math.pow((z+76)/33,2))*.012;
    const violet=roof-base>4?Math.exp(-(((x+9.9)/11)**2+((z+69)/10)**2+((roof-.88)/3.3)**2))*.019:0;
    // Low street-side color follows the occluded alleys' existing masonry
    // instead of placing a luminous strip above the neighborhood.
    const spillable=w>2.4&&d>2.6&&roof-base>4.2&&z<-30&&z>-89&&x<1&&x>-57&&roof<4.2;
    const cold=spillable?.019*Math.exp(-(((x+28.3)/20)**2+((z+60)/19)**2+((roof-1.5)/3.2)**2)):0;
    const plum=spillable?.014*Math.exp(-(((x+9.7)/10.3)**2+((z+68.8)/11)**2+((roof-.42)/3.0)**2)):0;
    const facade=(pts,normal,k,side)=>{
      const g=shade(col,k),top=rgb(g[0]*1.38+.003+spill+violet*.66,g[1]*1.41+.004+spill*.6+violet*.21,g[2]*1.34+.009+spill*1.8+violet);
      const baseline=[shade(g,.70),shade(g,.81),top,shade(top,side)];
      if(cold>0||plum>0){
        const facing=.31+.69*Math.max(0,normal[0]*.70-normal[2]*.50);
        const night=baseline.map((c,i)=>{
          const loc=.68+.26*Math.sin(pts[i][0]*.19+pts[i][2]*.56),r=(i<2?.42:1)*facing*loc;
          return rgb(c[0]+r*(cold*.14+plum*.69),c[1]+r*(cold*.69+plum*.27),c[2]+r*(cold+plum));
        });
        graded(mass,pts,normal,night);
      }else graded(mass,pts,normal,baseline);
    };
    facade([[x0,base,z1],[x1,base,z1],[x1,roof,z1],[x0,roof,z1]],[0,0,1],.94,.91);
    facade([[x1,base,z0],[x0,base,z0],[x0,roof,z0],[x1,roof,z0]],[0,0,-1],.76,.93);
    facade([[x1,base,z1],[x1,base,z0],[x1,roof,z0],[x1,roof,z1]],[1,0,0],.68,.86);
    facade([[x0,base,z0],[x0,base,z1],[x0,roof,z1],[x0,roof,z0]],[-1,0,0],.99,.92);
    mass.quad([x0,roof,z1],[x1,roof,z1],[x1,roof,z0],[x0,roof,z0],shade(col,1.15));
  }
  // Anchor façade coordinates to the actual four sides. The two inward sides
  // are detailed; other sides receive silhouettes and roof machinery.
  function fac(x,z,w,d,y,side,off,dy,u,v,color,b=lit) {
    if(suppressPlain||y<visibleFloor)return;
    let p,ax;
    if(side===0){p=[x-w*.5+off,y+dy,z+d*.5+.007];ax=[1,0];}
    else if(side===1){p=[x+w*.5-off,y+dy,z-d*.5-.007];ax=[-1,0];}
    else if(side===2){p=[x+w*.5+.007,y+dy,z+d*.5-off];ax=[0,-1];}
    else{p=[x-w*.5-.007,y+dy,z-d*.5+off];ax=[0,1];}
    const [a,h,c]=p,du=u*ax[0],dv=u*ax[1];
    const pts=[p,[a+du,h,c+dv],[a+du,h+v,c+dv],[a,h+v,c]];
    if(b===lit){const n=side===0?[0,0,1]:side===1?[0,0,-1]:side===2?[1,0,0]:[-1,0,0];
      const occ=clamp((Math.sin(12.3*a+5.17*h+2.7*c)*.5+.5),0,1);
      // Ambient-lit glazing loses light under the lintel, and window corners
      // differ with blinds/alcoves. The mesh stays one quad per pane.
      graded(b,pts,n,[shade(color,.68+occ*.23),shade(color,.96),shade(color,.39+occ*.36),shade(color,.23+occ*.24)]);
    }else b.quad(...pts,color);
  }
  // The foreground is laid out on named parcels rather than a screen-space plate.
  // Entries are street (balcony), gallery (open stair), workshop (ribbon glass)
  // and mansion (postwar apartment) archetypes. The nearest raw procedural lots
  // are still sampled for layout, but receive this original shell and fittings.
  const featuredParcels=new Map([
    ['6,-28',2],['-14,-11',0],['-8,-16',1],['-21,-39',0],['-1,-31',0],
    ['-1,-45',3],['-20,-61',1],['-39,-51',3],['-32,-54',1],['-8,-30',2],
    ['14,-28',3],['13,-42',0],['-13,13',1],['15,9',2],['-8,17',3],['13,15',0],['-3,30',1],['16,24',2],['-22,22',3],['22,21',0]
  ]);
  let suppressPlain=false,visibleFloor=-Infinity;
  function residence(x,z,w,d,base,top,style,phase){
    const random=seeded(193913+phase*1163+Math.round(x*303)+Math.round(z*659));
    const skins=[rgb(.036,.064,.092),rgb(.048,.075,.083),rgb(.031,.045,.070),rgb(.055,.068,.072)];
    const shell=shade(skins[style],.82+random()*.38),shadow=shade(shell,.37),iron=rgb(.018,.029,.043);
    const cool=rgb(.34,.73,.83),warm=rgb(1.28,.67,.22),mint=rgb(.48,.70,.42),night=rgb(.012,.034,.047);
    const inside=[cool,warm,mint,rgb(.91,.77,.52),rgb(.44,.57,.89),rgb(.21,.48,.54)];
    const floorH=[1.11,1.19,.96,1.06][style],levels=Math.min(8,Math.floor((top-base)/floorH));
    solid(x,z,w,d,base,top,shell);
    // Four sides occupy their actual parcel boundaries, including the narrow
    // service façades. No window, rail, deck or spill tracks a camera.
    const frontSide=z<0?0:1, flank=x<0?2:3;
    for(let side=0;side<4;side++){
      const along=side===0?[1,0]:side===1?[-1,0]:side===2?[0,-1]:[0,1];
      const normal=[-along[1],along[0]],wide=side<2?w:d,deep=side<2?d:w;
      const ox=x+normal[0]*deep*.5-along[0]*wide*.5,oz=z+normal[1]*deep*.5-along[1]*wide*.5;
      const pt=(u,y,v)=>[ox+along[0]*u+normal[0]*v,y,oz+along[1]*u+normal[1]*v];
      // Surface light belongs to real planes: the undersides of concrete slabs
      // catch very little sky while their parapet tops and exposed ends do.
      const cube=(u,y,v,du,dh,dv,c)=>{
        const l=u-du*.5,h=u+du*.5,b=y-dh*.5,t=y+dh*.5,near=v+dv*.5,far=v-dv*.5;
        let a0=pt(l,b,near),a1=pt(h,b,near),a2=pt(h,t,near),a3=pt(l,t,near),
          b0=pt(l,b,far),b1=pt(h,b,far),b2=pt(h,t,far),b3=pt(l,t,far);
        const outward=side===0?.89:side===2?.73:side===3?.92:.68;
        mass.quad(a0,a1,a2,a3,shade(c,outward));mass.quad(b1,b0,b3,b2,shade(c,.60));
        mass.quad(a1,b1,b2,a2,shade(c,.68));mass.quad(b0,a0,a3,b3,shade(c,.82));
        mass.quad(a3,a2,b2,b3,shade(c,1.14));mass.quad(b0,b1,a1,a0,shade(c,.32));
      };
      const paint=(u,y,v,du,dh,c1,c2,c3,c4,mesh=mass)=>graded(mesh,[pt(u,y,v),pt(u+du,y,v),pt(u+du,y+dh,v),pt(u,y+dh,v)],[normal[0],0,normal[1]],[c1,c2,c3,c4]);
      const main=side===frontSide,returnSide=side===flank,sideLit=main||returnSide,facScale=main?1:returnSide?.70:.43;
      const gallery=main&&style===1,canopy=sideLit&&(style===0||style===3||gallery),outer=gallery?.62:style===3?.35:.47;
      const stairWidth=gallery?Math.min(1.28,wide*.235):0,start=.13+stairWidth;
      const n=Math.max(2,Math.round((wide-start)/(style===2?.96:1.36))),bw=(wide-start-.14)/n;
      const codes=Array.from({length:n},()=>Math.floor(random()*6));
      // Service spine and structural piers interrupt continuous row glazing.
      const strip=(main&&style===3)?(phase%2===0?0:n-1):-1;
      const bayWeights=Array.from({length:n},(_,i)=>1+.20*Math.sin(phase+side+i*2.23)+(style===2?.10:0)*Math.cos(i+side));
      const totalWeight=bayWeights.reduce((a,b)=>a+b),edges=[start];
      for(const weight of bayWeights)edges.push(edges[edges.length-1]+(wide-start-.14)*weight/totalWeight);
      for(let f=0;f<levels;f++){
        const y=top-(f+1)*floorH,gy=y+floorH*.16,gh=floorH*(style===2?.52:.62);
        const hall=canopy||(style===2&&f===0);
        if(hall){
          const span=wide-.045;cube(wide*.5,y+.034,outer*.46,span,.085,outer*1.04,shade(shell,1.42));
          paint(.04,y+.002,outer*.98+.011,span-.04,.043,shade(shell,.69),shade(shell,.81),shade(shell,1.22),shade(shell,.98));
          if(style===2){cube(wide*.5,y+floorH*.74,.125,wide,.079,.27,shade(shell,1.18));}
          else {
            // Some apartment houses use opaque half-parapets, others narrow
            // steel rails. One returned end and an offset utility partition
            // interrupt the long horizontal balcony strip at full scale.
            const lip=style===3?.31:(style===0?.16:.086);
            cube(wide*.5,y+.075+lip*.5,outer,wide-.06,lip,.053,shade(shell,.69));
            cube(wide*.5,y+.39,outer,wide-.08,.036,.042,shade(iron,1.32));
            for(let k=0;k<=n;k++){const u=clamp(edges[k],.08,wide-.08);cube(u,y+.228,outer,.039,.315,.041,iron);}
            if(style!==3)for(let k=0;k<n;k++)cube((edges[k]+edges[k+1])*.5,y+.223,outer,.027,.286,.030,shade(iron,1.10));
            for(const end of [.078,wide-.078])cube(end,y+.205,outer*.48,.056,.30,outer*.98,shade(shell,.80));
          }
        }
        for(let k=0;k<n;k++){
          const u=edges[k],bw=edges[k+1]-u,occupied=random(),windowKind=(codes[k]+f+phase)%5;
          const service=(k===strip),ratio=service?.30:style===2?(codes[k]%2===0?.72:.78):style===3?.58:.68;
          const wideGlass=bw*ratio,left=u+bw*(1-ratio)*.48,g=shade(shell,.48);
          let c=occupied<.30?shade(night,.72+random()*.38):occupied<.51?shade(inside[codes[k]],.10+random()*.18):shade(inside[(codes[k]+(f%3===0?1:0))%6],(.72+random()*.94)*facScale);
          if(style===2&&f%4===1)c=shade(c,.45);
          paint(left-.035,gy-.04,.012,wideGlass+.074,gh+.076,shadow,iron,g,shadow);
          const frame=sideLit?.037:.028;
          let widths=style===2?[.29,.32,.39]:windowKind===3?[.29,.71]:[.45,.55];let edge=0;
          for(let p=0;p<widths.length;p++){
            const ww=wideGlass*widths[p]-frame,u0=left+wideGlass*edge,draw=shade(c,p===0?.58+random()*.52:.75+random()*.42);
            // Reflector light pools at the back of the ceiling; cooler sill 
            // bounce and ragged curtain overlap avoid identical tinted panes.
            const edgeLight=canopy?.92:1.05;
            paint(u0,gy,.027,ww,gh,shade(draw,.51),shade(draw,.78),shade(draw,.59*edgeLight),shade(draw,.24),lit);
            if(occupied>.57&&sideLit&&windowKind!==1){
              const cw=ww*(.12+.31*random()); const cc=mix(draw,shadow,.78);
              paint(u0,gy+.01,.035,cw,gh-.015,shade(cc,.65),cc,shade(cc,.86),shade(cc,.63));
            }
            if(occupied>.78&&p===1&&sideLit){
              const book=ww*(.14+.17*random()),bc=mix(draw,shadow,.82);
              paint(u0+ww*.55,gy,.039,book,gh*(.17+random()*.18),bc,bc,bc,bc);
            }
            edge+=widths[p];
          }
          if((windowKind===1||windowKind===3)&&occupied>.36){
            const down=gh*(.13+.33*random()),cc=mix(shade(c,.50),shell,.63);
            paint(left,gy+gh-down,.044,wideGlass-frame,down,shade(cc,.54),shade(cc,.64),cc,shade(cc,.88));
          }
          if(canopy&&sideLit&&(f+k+phase)%4===0){
            cube(u+.04,y+.345,.19,.046,.56,.34,shade(shell,1.01));
            cube(u+bw*.82,y+.165,.158,bw*.215,.17,.19,shade(shell,.93));
          }
          if(canopy&&occupied>.65){
            // A warm bounce on the slab is localized to that room, never a
            // self-illuminating white stripe across the entire façade.
            const glow=mix(shell,c,style===3?.125:.158),v1=outer*.87,pts=[pt(left,y+.088,.05),pt(left+wideGlass,y+.088,.05),pt(left+wideGlass,y+.089,v1),pt(left,y+.089,v1)];
            graded(mass,pts,[0,1,0],[glow,shade(glow,.88),shade(shell,.67),shade(shell,.64)]);
          }
        }
        if(gallery){
          const u0=.13,u1=stairWidth-.08,nearV=.50,bot=y+.085,dh=floorH-.135;
          const a=(f&1)?u1:u0,b=(f&1)?u0:u1;
          for(let k=0;k<8;k++){const u=a+(b-a)*(k+.5)/8;
            cube(u,bot+dh*k/8,.36,Math.abs(b-a)/8+.012,.068,.45,shade(shell,k%2?1.10:1.02));}
          mass.cylinder(pt(a,bot+.41,nearV),pt(b,bot+dh+.41,nearV),.027,shade(iron,1.28),4);
          // Enclosed blue-glass return and overhanging half-landing give the
          // exposed flight a readably dark material behind its silhouette.
          cube(u0*.75,y+floorH*.55,.085,.082,floorH*1.02,.20,shade(shell,.68));
          cube((u0+u1)*.5,y+.70,.017,.20,.20,.041,shade(shell,.54));
          if(f%2===0)paint(.21,y+.80,.048,.16,.044,cool,cool,shade(cool,1.43),shade(cool,1.43),lit);
        }
        if(!hall&&f%3===1&&sideLit)cube(wide*.49,y+.04,.057,wide*.98,.052,.138,shade(shell,1.32));
      }
      // A downpipe, its elbows and brackets read vertically against floor lines.
      if((main&&style===3)||returnSide){
        cube(wide-.139,top-levels*floorH*.5,.102,.059,levels*floorH,.073,shade(shell,.58));
        for(let f=0;f<levels;f+=2)cube(wide-.14,top-(f+.48)*floorH,.091,.101,.047,.117,shade(shell,1.17));
      }
      cube(wide*.5,top+.075,-.032,wide,.135,.083,shade(shell,1.13));
    }
    const ax=x+w*(random()*.36-.18),az=z+d*(random()*.34-.17),rp=shade(shell,1.24);
    if(style===2){
      // Two low clerestories on old commercial parcels; most roofs have
      // blank tenement parapets instead, keeping the upper silhouette quiet.
      for(const sx of [-.23,.14]){
        const xx=x+w*sx,zz=z+d*.12;
        solid(xx,zz,w*.24,d*.21,top+.04,top+.24,shade(shell,.87));
        fac(xx,zz,w*.24,d*.21,top+.06,z<0?0:1,.04,0,w*.21,.14,shade(inside[phase%6],.095));
        solid(xx,zz,w*.26,d*.25,top+.24,top+.29,shade(shell,1.12));
      }
    }
    solid(ax,az,w*.18,d*.21,top+.015,top+.47,rp);
    if(style===1||style===3){
      const sx=x+w*(phase%2?.29:-.27),sz=z-d*.18,bh=top+.32;
      for(const a of [-.22,.22])for(const b of [-.19,.19])mass.box([sx+a,top+.163,sz+b],[.043,.32,.045],iron);
      if(style===1){
        mass.cylinder([sx,bh,sz],[sx,bh+.52,sz],.35,shade(shell,1.63),10);
        for(const v of [bh+.03,bh+.43])mass.cylinder([sx,v,sz],[sx,v+.036,sz],.371,shade(shell,1.04),10);
        mass.cylinder([sx,bh+.51,sz],[sx,bh+.58,sz],.17,shade(shell,1.32),8);
      }else{solid(sx,sz,.71,.54,bh,bh+.52,shade(shell,1.46));solid(sx,sz,.75,.59,bh+.51,bh+.55,rp);}
    }
  }

  function building(x,z,w,d,y0,top,type,rich,importance=1) {
    const range=Math.hypot(x,z), far=clamp(range/230,0,1);
    const atmosphere=.014+.055*far;
    let col=rgb(atmosphere*rr(.72,1.08),atmosphere*rr(1.34,1.62),atmosphere*rr(1.84,2.61));
    const choice=num(0,6), floors=rr(.94,1.30), light=rr(.38,1.72)*importance;
    const lot=featuredParcels.get(Math.round(x)+','+Math.round(z));
    suppressPlain=(lot!==undefined);
    visibleFloor=range>160?top-5.8:range>118?top-7.8:range>85?top-10.2:-Infinity;
    solid(x,z,w,d,y0,top,col);
    if(type===0||type===3||type===5) {
      const shift=rr(-.23,.23),cap=rr(.38,1.8);
      solid(x+w*shift,z,w*rr(.39,.73),d*rr(.5,.81),top,top+cap,shade(col,.90));
      if(type===3&&rng()<.54)solid(x+w*shift,z,w*.21,d*.24,top+cap,top+cap+rr(.27,1.2),shade(col,1.04));
    } else if(type===2) {
      solid(x,z,w*1.025,d*1.025,top-.32,top+.12,shade(col,1.23));
    }
    // Recessed balconies and projecting slab edges read as depth, not pixels.
    // A separate seed keeps the existing skyline layout invariant across refinements.
    const accent=seeded((Math.floor(x*213.1)*4231)^(Math.floor(z*398.3)*907));
    if(rich&&range<112&&accent()<.80&&!suppressPlain){
      const fz=z<0?1:-1,edge=z+d*.5*fz,dir=fz;
      if(type===0||type===2||type===4){
        const wide=w*(.67+accent()*.27),xoff=x+(accent()-.5)*(w-wide);
        for(let h=top-1.03;h>Math.max(y0,top-9);h-=1.45){
          solid(xoff,edge+.13*dir,wide,.30,h-.15,h,shade(col,1.28));
          solid(xoff,edge+.255*dir,wide,.055,h,h+.19,shade(col,.82));
          if(accent()>.40)solid(xoff,edge+.27*dir,wide,.05,h+.31,h+.34,shade(col,1.19));
        }
      } else {
        const k=accent()<.5?-.34:.34;
        solid(x+k*w,z,w*.092,d*1.02,Math.max(y0,top-9.4),top+.16,shade(col,1.19));
        if(accent()<.57)solid(x,z,w*1.015,d*1.02,top-.5,top-.36,shade(col,1.58));
      }
      if(accent()<.65){
        const rx=x+(accent()-.5)*w*.59,rz=z+(accent()-.5)*d*.61,ax=.38+accent()*.41;
        if(type===0||type===4){
          // Panel tanks on steel feet give the residential roofs scale.
          for(const xx of [-.37,.37])for(const zz of [-.29,.29])
            mass.box([rx+ax*xx,top+.17,rz+zz*ax],[.075,.33,.075],shade(col,.79));
          solid(rx,rz,ax,ax*.83,top+.34,top+.84,shade(col,2.14));
          solid(rx,rz,ax*1.04,ax*.88,top+.83,top+.89,shade(col,1.58));
          mass.box([rx-ax*.19,top+.92,rz],[.13,.08,.14],shade(col,1.19));
        }else{
          solid(rx,rz,ax,ax*.83,top+.02,top+.49,shade(col,1.63));
          if(accent()<.5)mass.cylinder([rx,top+.49,rz],[rx,top+.71,rz],ax*.34,shade(col,1.1),7);
        }
      }
    }
    if(rng()<.13&&rich){const pole=rr(.6,2.12);
      mass.box([x+w*.19,top+pole*.5,z],[.075,pole,.075],shade(col,.72));
      if(rng()<.38)lit.box([x+w*.19,top+pole,z],[.12,.09,.12],rgb(.68,.057,.078));}
    for(const side of [z<=0?0:1,x<0?2:3]){
      const wide=side<2?w:d;
      const cols=clamp(Math.floor(wide/rr(.65,1.12)),2,11), dx=wide/cols;
      const maxFloors=Math.min(19,Math.ceil((top-y0)/floors)-1);
      const balance=rr(.66,1.18);
      const windows=type===1?.82:type===4?.72:rr(.29,.57);
      const density=rich?rr(.39,.84):rr(.26,.59);
      const bcol=cw[choice];
      for(let f=0;f<maxFloors;f++) {
        const fy=top-floors*(f+.78);
        if(fy<y0+.1)break;
        if((type===2||type===4||type===5)&&f%2===0&&rich){
          fac(x,z,w,d,fy,side,wide*.03,-.13,wide*.94,.12,shade(col,type===2?1.72:1.52),mass);
        }
        if(type===5&&f%3===2)continue;
        const band=rr(.48,1.18)*((f===0&&rich&&type===2)?1.52:1), apartmentOff=rng()<.21;
        if(type===1&&rng()<.23 && !apartmentOff){
          fac(x,z,w,d,fy,side,dx*.17,0,wide-dx*.36,floors*.18,shade(bcol,light*band*.57));continue;
        }
        const core=type===4?Math.floor(cols*.45):-1;
        for(let n=0;n<cols;n++){
          if(n===core||rng()>(apartmentOff?.12:density))continue;
          const t=rng(),c=t<.15?cw[4]:t<.28?cw[5]:bcol;
          const pocket=rr(.58,1.48),nightfall=.79+.21*Math.sin(n*.85+x*.23)*Math.cos(f*1.07-z*.12);
          const v=shade(c,light*pocket*band*balance*nightfall*(range<95?1.24:1.12));
          const windowHeight=floors*rr(.24,.52), u=dx*(n+.13),ww=dx*windows;
          fac(x,z,w,d,fy,side,u,0,ww,windowHeight,v);
          if(range<70&&rich){
            // Keep temporal/city seeds untouched. Real rooms have mullions,
            // reveals and occluded upper transoms, instead of flat light tiles.
            if(ww>.43 && (type===2||type===1||type===5))fac(x,z,w,d,fy+.001,side,u+ww*.47,0,Math.max(.048,ww*.076),windowHeight,shade(col,.89),mass);
            fac(x,z,w,d,fy+.001,side,u,-.043,ww,.047,shade(col,1.8),mass);
          }
        }
      }
    }
    suppressPlain=false;visibleFloor=-Infinity;
    if(lot!==undefined)residence(x,z,w,d,y0,top,lot,Math.abs(Math.round(x*3+z*5)));
  }
  const rs=[19,30,45,63,84,107,137,171,205],steps=[6.9,7.1,7.1,7.0,7.3,7.4,7.6,7.7,8.2];
  for(let j=0;j<rs.length;j++){
    const radius=rs[j],count=Math.round(TAU*radius/steps[j]),phase=rr(0,TAU),far=radius/205;
    for(let k=0;k<count;k++){
      const a=phase+(k+rr(-.10,.10))/count*TAU,r=radius+rr(-1.8,1.8);
      const x=Math.sin(a)*r,z=-Math.cos(a)*r, aN=Math.atan2(x,-z);
      const civic=Math.exp(-Math.pow((aN+.05)/.19,2));
      const strip=.38+.62*(.5+.5*Math.cos(a*5.0+j*.68));
      const roof=-4.5+far*(10.2+5.8*strip)+rr(-2.6,3.8)+(far*.95+.05)*civic*rr(1.8,6.4);
      const front=Math.cos(a)>.58,rich=front||j<5;
      let w=rr(.58,.99)*steps[j],d=rr(3.0,6.2)*(1.0+.25*far);
      building(x,z,w,d,-18,roof-(r<68?1.7:0.5)*Math.exp(-Math.pow(aN/.34,2)),num(0,5),rich,(front?.96:.72)*(1+civic*.66));
    }
  }
  // A few individual pieces of recognizable infrastructure interrupt the block grid.
  function tvTower(x,z,b,h){
    const c=rgb(.069,.095,.139),warm=rgb(.27,.077,.099),lamp=rgb(2.2,.063,.107);
    const corners=(v,w)=>[[x-w,v,z-w],[x+w,v,z-w],[x+w,v,z+w],[x-w,v,z+w]];
    const levels=[[0,1.91],[.24,1.13],[.49,.72],[.67,.44],[.78,.18]].map(([t,w])=>corners(b+t*h,w));
    for(let level=1;level<levels.length;level++)for(let i=0;i<4;i++){
      const bot=levels[level-1],top=levels[level],next=(i+1)%4;
      mass.cylinder(bot[i],top[i],level<3?.12:.078,level%2?warm:c,5);
      mass.cylinder(bot[i],top[next],.055,shade(c,1.4),4);
      mass.cylinder(top[i],top[next],.06,warm,4);
    }
    for(const [t,w,d] of [[.47,1.40,.49],[.68,.96,.34]]){mass.box([x,b+h*t,z],[w,d,w],warm);lit.box([x,b+h*t+.16,z],[w*1.03,.11,w*1.03],rgb(.78,.62,.72));}
    // Central stepped communications skyscraper: the lantern sits over
    // occupied dark observation floors, not an open steel pylon. Its thin
    // spire, original survey anchor and restrained red obstruction lamps stay.
    const stories=[[.06,.28,1.67,1.53],[.28,.44,1.47,1.31],[.44,.55,1.17,1.07],
                   [.55,.65,.90,.77],[.65,.73,.55,.39],[.73,.78,.26,.14]];
    const skin=rgb(.040,.063,.095),trim=rgb(.102,.131,.152);
    for(let i=0;i<stories.length;i++){
      const [lo,hi,r1,r2]=stories[i],ya=b+h*lo,yb=b+h*hi,ca=corners(ya,r1),cb=corners(yb,r2);
      for(let j=0;j<4;j++){
        const nx=(j===1?1:j===3?-1:0),nz=(j===2?1:j===0?-1:0),p=(t,yy,offset=.018)=>{
          const u=(yy-ya)/(yb-ya),A=ca[j],B=ca[(j+1)%4],C=cb[j],D=cb[(j+1)%4];
          return [A[0]*(1-t)*(1-u)+B[0]*t*(1-u)+C[0]*(1-t)*u+D[0]*t*u+nx*offset,yy,
                  A[2]*(1-t)*(1-u)+B[2]*t*(1-u)+C[2]*(1-t)*u+D[2]*t*u+nz*offset];};
        const n=[nx,0,nz],wall=shade(skin,[.64,.81,1.16,.90][j]);
        graded(mass,[ca[j],ca[(j+1)%4],cb[(j+1)%4],cb[j]],n,[wall,shade(wall,.74),shade(wall,1.27),shade(wall,1.41)]);
        const nBay=i<3?6:i<5?4:2,levels=Math.floor((yb-ya)/.46);
        for(let f=0;f<levels;f++)for(let m=0;m<nBay;m++){
          const y=ya+.14+f*.46,t=(m+.23)/nBay,t2=(m+.70)/nBay;
          const litRoom=Math.sin(f*.81+m*1.18+j*.36+i*.87)>.08;
          const wt=litRoom?shade(i%2?rgb(.34,.40,.38):rgb(.22,.36,.44),(.48+.52*Math.abs(Math.cos(m*.61+f*.29)))):rgb(.067,.106,.141);
          graded(lit,[p(t,y),p(t2,y),p(t2,y+.205),p(t,y+.205)],n,[wt,shade(wt,.81),shade(wt,.63),shade(wt,.43)]);
        }
        if(i===1||i===3)mass.quad(p(.01,yb-.10,.032),p(.99,yb-.10,.032),p(.99,yb-.042,.032),p(.01,yb-.042,.032),i===3?rgb(.72,.071,.108):rgb(.41,.047,.075));
        for(const t of [.09,.91])if(i<4)mass.quad(p(t-.014,ya+.04),p(t+.014,ya+.04),p(t+.014,yb),p(t-.014,yb),trim);
      }
      mass.box([x,yb-.038,z],[r2*2.03,.087,r2*2.03],shade(trim,1.18));
      if(i===0||i===2||i===4)for(const sx of [-1,1])lit.box([x+sx*r2,yb+.016,z+r2],[.13,.064,.12],i===4?rgb(1.32,.058,.10):rgb(.94,.042,.080));
    }
    const pole=b+h*.78;mass.cylinder([x,pole,z],[x,b+h,z],.10,rgb(.74,.57,.66),8);
    for(let i=0;i<4;i++)lit.box([x,pole+h*.055*i,z],[.20,.21,.20],i%2?warm:lamp);
    lit.box([x,b+h+.1,z],[.30,.24,.30],lamp);
  }
  tvTower(-42.4,-128,-1.0,20.7);
  building(-4.2,-117,4.3,3.6,-17,11.65,3,true,1.71);
  building(-9.7,-130,5.3,5,-17,11.60,1,true,1.57);
  building(1.9,-126,3.4,4.3,-17,13.4,4,true,1.63);
  // Office slab glazing, set-back shoulders, mechanical crowns, and a tapered
  // hotel. Each illuminated floor has a dark column grid and color drift.
  function tower(x,z,w,d,top,variant,power) {
    const skins=[rgb(.044,.063,.093),rgb(.044,.063,.093),rgb(.063,.091,.130),
      rgb(.036,.062,.087),rgb(.038,.063,.082),rgb(.046,.065,.101),rgb(.046,.057,.085)];
    const col=skins[variant];
    if(variant===2){
      // A round, glazed hotel breaks up the rectilinear office slabs.
      const count=14,rx=w*.57,rz=d*.52,at=(a,b,t)=>[x+rx*Math.cos(a)*t,b,z+rz*Math.sin(a)*t];
      for(let i=0;i<count;i++){const a=i/count*TAU,b=(i+1)/count*TAU;
        mass.quad(at(a,-9,1),at(b,-9,1),at(b,top,1),at(a,top,1),shade(col,.8+.24*Math.cos(a-.7)));
        for(let f=0;f<(top+8)/.63;f++){
          const fy=top-(1+f)*.63; if(f%5===1&&i%4===0)continue;
          const ac=a+.033,bc=b-.037;
          // A darker glass curtain wall with a broken, vertical elevator lantern.
          // Its occupied accents live on the atrium's real face, not a white
          // exposure strip across the floors or a screen-space highlight.
          const low=clamp((f-5)/13,0,1);
          const suite=.58+.30*Math.cos(i*1.83+Math.floor(f/3)*.71);
          const atrium=(i===2||i===3||i===9||i===10)&&f>4&&f<14&&(f%4!==2);
          const lobby=atrium?(i===3||i===10?.45:.28):.0;
          const palette=mix(rgb(.203,.289,.43),rgb(.55,.37,.88),low);
          const con=shade(palette,power*(.27+.57*low)*suite+lobby);
          lit.quad(at(ac,fy,1.012),at(bc,fy,1.012),at(bc,fy+.31,1.012),at(ac,fy+.31,1.012),con);
          // An expressed diagrid wraps the round hotel, breaking up the successive
          // horizontal floors with real sloping mullions, not a flat front texture.
          if(f%2===0&&i%2===(f>>1)%2){
            const pa=at(a,fy+.30,1.017),pb=at(b,fy+1.19,1.017);
            mass.cylinder(pa,pb,.029,rgb(.165,.209,.31),4);
          }
        }
        mass.quad(at(a,top,1),at(b,top,1),at(b,top+1.32,.59),at(a,top+1.32,.59),shade(col,1.65));
        lit.quad(at(a,top+.15,.97),at(b,top+.15,.97),at(b,top+.23,.94),at(a,top+.23,.94),rgb(.63,.35,.68));
      }
      mass.cylinder([x,top+1.24,z],[x,top+1.69,z],w*.18,shade(col,1.34),12);return;
    }
    solid(x,z,w,d,-9,top,col);const l=top+8;
    const simple=variant<3,bandCol=rgb(.071,.092,.116),joint=rgb(.028,.041,.058);
    // Solid columns sit at the true boundary on exposed office faces. They
    // partition the short glass runs, so the silhouette is not just a new cap.
    if(variant===3||variant===5){
      const offsets=variant===3?[-.43,.32]:[-.16,.12];
      for(const q of offsets){
        solid(x+w*q,z,w*.043,d*1.016,top-5.58,top+.03,shade(col,1.36));
      }
    }
    if(variant===4)solid(x+w*.39,z+d*.017,w*.055,d*.99,top-5.1,top+.14,shade(col,1.17));
    if(variant===6)solid(x-w*.21,z,w*.053,d*1.014,top-6.6,top+.04,shade(col,.83));
    // Vertical service atria are occupants of their actual tower lot. Their
    // blue safety lighting frames the amber office floors around them.
    const glazed=x===-17.3?1:x===-9.5?2:x===-5.2?3:x===1.25?4:0;
    const shaft=glazed===1?[.61,.79]:glazed===2?[.39,.54]:null;
    const above=.60,below=glazed===1?top-8.15:top-8.95;
    if(shaft){
      const [a,b]=shaft,front=z+d*.5;
      const bay=rgb(.021,.035,.050),floor=rgb(.071,.100,.126);
      const x0=x+w*(a-.5),x1=x+w*(b-.5);
      const pillars=[x0-.037,x1+.037],face=front+.038;
      const draw=(xx,yy,zz,u,h,c,mesh)=>mesh.quad([xx,yy,zz],[xx+u,yy,zz],[xx+u,yy+h,zz],[xx,yy+h,zz],c);
      draw(x0-.042,below,front+.015,x1-x0+.084,top-above-below,bay,mass);
      for(const xx of pillars)draw(xx,below,face+.007,.063,top-above-below,shade(bay,1.25),mass);
      // Keep every glass floor on the recessed shaft face. Sills read at
      // 960px, and dark gaps cut where service landings have lights off.
      for(let f=0;f<(top-above-below)/.72-.27;f++){
        const yy=top-above-(f+1)*.72;
        const split=glazed===1?.59:.44,night=f%5===2?.69:f%3===1?1.13:.93;
        const warm=rgb(.43,.292,.171),cool=rgb(.21,.39,.51);
        const fade=.55+.31*Math.sin(.27+.43*f)**2+.18*clamp((f-2)/6,0,1);
        const tint=shade(f%4===0&&glazed===1?warm:cool,night*fade*(glazed===2?.93:1));
        draw(x0+.029,yy+.14,face,(x1-x0-.053)*split,.409,shade(tint,1.18),lit);
        draw(x0+.068+(x1-x0-.053)*split,yy+.14,face,(x1-x0-.072)*(1-split),.409,shade(tint,.78),lit);
        draw(x0+.028,yy+.111,face+.005,x1-x0-.058,.035,floor,mass);
      }
    }
    const cells=Math.max(4,Math.floor(w/.43));
    for(let f=0;f<l/.72-1;f++) {
      const y=top-(f+1)*.72,t=(top-y)/l;
      const fg=mix(variant===2?rgb(.25,.42,.48):rgb(.29,.38,.46),variant===2?rgb(.97,.76,1.45):rgb(.67,.55,.79),Math.min(1,t*1.55));
      for(let n=0;n<cells;n++)if(rng()>.13+.16*Math.pow(1-t,2)) {
        const rowGlow=.40+.60*clamp((t-.07)/.57,0,1);
        const group=Math.sin(f*.83+(n>>1)*1.37+x*.8);
        const suite=.40+.48*(.5+.5*group);
        const office=(Math.abs(x)<11&&group<-.52?.62:1)*suite;
        const k=power*rr(.39,1.2)*(.93+.49*t)*rowGlow*office,dx=w/cells;
        const center=(n+.48)/cells;
        if(shaft&&center>shaft[0]-.023&&center<shaft[1]+.023&&y>below-.18)continue;
        if(glazed&&f<14){
          // Variable office floor bands use one inner light scheme, not dots
          // scattered independently. The central core physically occludes them.
          const turn=glazed===3||glazed===4,even=(f+glazed)%6;
          const lane=(n+Math.floor(f/4)+glazed)%6;
          const occupied=(turn?even!==2:even!==0)&&(lane!==5||even===4);
          const hue=even===1||even===4||(glazed===3&&even!==5)?rgb(.465,.382,.274):rgb(.272,.392,.475);
          const lower=.48+.39*clamp((f-2)/7,0,1),order=n<cells*.48?1:.83;
          const energy=(occupied?1.39:.32)*lower*order*(.80+.23*Math.sin(f*.54+n*.62));
          const u=n*dx+(turn?.022:.043),v=turn?.285:.346,win=dx*(turn?.90:.77);
          fac(x,z,w,d,y,0,u,even===4?.025:0,win,v,shade(hue,energy));
          continue;
        }
        if(simple){fac(x,z,w,d,y,0,n*dx+.068,0,dx*.72,.31,shade(fg,k));continue;}
        const coupled=(variant===3&&n===1)||(variant===4&&n===cells-2)||(variant===5&&(n===1||n===cells-2));
        const broad=variant===6?f%4===0:variant===4?f%3===0:false;
        const leased=(n+3*f+variant)%5!==0;
        const temper=coupled?rgb(.44,.40,.31):variant===6?mix(rgb(.30,.38,.51),rgb(.57,.49,.36),((f+2)%6)/6):fg;
        const color=shade(temper,k*(leased?(coupled?1.13:broad?.91:.79):.29));
        const height=variant===3?.38:variant===5?.28:variant===6?.22:.25;
        fac(x,z,w,d,y,0,n*dx+.065,0,dx*(variant===6?.78:coupled?.63:.70),height,color);
      }
      // The near-facing side reflects the blue night. Lit offices occur by floor
      // and tenancy, not in a uniform checkerboard of two-dimensional holes.
      const side=x<0?2:3,columns=Math.max(3,Math.round(d/.48)),rw=d/columns;
      for(let i=0;i<columns;i++){
        const open=Math.sin(i*1.94+f*.88+x*.62)+Math.cos((i>>1)*.67+f*.67);
        const sc=open>.61?shade(mix(rgb(.21,.40,.49),rgb(.71,.62,.40),.46+.45*Math.sin(f*.8+i*.28)),(.36+.20*Math.cos(f*.88))*power):rgb(.054,.088,.130);
        const cadence=variant===3||variant===5?(i%3===1?.46:1):variant===6?(f%3===1?.53:1):1;
        if(glazed&&f<14&&i<Math.ceil(columns*.57)){
          const row=(f+glazed)%6,litFloor=row!==2&&row!==3,tone=row%2===0?rgb(.456,.367,.259):rgb(.255,.386,.464);
          const strength=litFloor?(.68+.14*Math.cos(f*.43+i*.41))*(.62+.38*clamp((f-2)/7,0,1)):.145;
          const u=(i+.04)*rw,win=rw*(glazed===3||glazed===4?.88:.75);
          fac(x,z,w,d,y,side,u,.0,win,.245,shade(tone,strength*(glazed===3?1:.76)));
        }else fac(x,z,w,d,y,side,(i+.12)*rw,0,rw*(simple?.72:variant===6?.77:.61),simple?.28:variant===6?.21:.27,shade(sc,cadence));
      }
      if(simple&&f%3===0){fac(x,z,w,d,y,0,w*.04,-.12,w*.92,.059,shade(fg,power*.43));}
      if(!simple&&f<(variant===6?10:7)&&f%2===(variant&1)){
        const slab=shade(bandCol,variant===6?.92:variant===4?.77:.63),off=variant===6?.014:.025;
        const frontage=variant===5?w*.33:w*.95;
        fac(x,z+off,w,d,y,0,w*.03,-.11,frontage,.068,slab,mass);
        if(variant===5)fac(x,z+off,w,d,y,0,w*.63,-.11,w*.33,.068,slab,mass);
      }
    }
    // Different roof machinery and mid-rise setbacks echo ordinary Tokyo
    // office buildings, not repeated luminous gables. All supports are mass.
    if(variant===3){
      // Flat telecommunications office, recessed penthouse + small box vents.
      solid(x,z,w*.99,d*.98,top,top+.78,shade(col,.95));
      solid(x,z,w*1.015,d*1.015,top+.76,top+.91,shade(col,1.09));
      solid(x+w*.19,z-d*.12,w*.30,d*.27,top+.91,top+1.07,shade(col,1.2));
      for(const dx of [-.38,.38])lit.box([x+w*dx,top+.88,z+d*.453],[.115,.064,.075],rgb(.94,.044,.09));
    }else if(variant===4) {
      // Elevator core is offset from the slimmer service court to its right.
      solid(x-w*.072,z+d*.07,w*.83,d*.72,top,top+.48,shade(col,1.03));
      solid(x-w*.205,z-d*.04,w*.54,d*.54,top+.43,top+1.39,shade(col,.95));
      solid(x-w*.208,z+d*.016,w*.56,d*.562,top+1.37,top+1.53,shade(col,1.14));
      solid(x+w*.27,z-d*.23,w*.29,d*.32,top+.01,top+.72,shade(col,.98));
      solid(x+w*.29,z-d*.24,w*.17,d*.20,top+.69,top+.86,shade(col,1.16));
    }else if(variant===5){
      // Two real independent lift overruns, separated by a narrow shadow bay.
      solid(x-w*.278,z+d*.046,w*.36,d*.65,top,top+.94,shade(col,.88));
      solid(x+w*.222,z-d*.035,w*.42,d*.56,top,top+.86,shade(col,1.07));
      solid(x-w*.279,z+d*.052,w*.34,d*.61,top+.92,top+1.04,shade(col,1.04));
      solid(x+w*.245,z-d*.028,w*.36,d*.51,top+.84,top+1.03,shade(col,.93));
      solid(x-w*.40,z+w*.01,w*.043,d*.15,top+1.03,top+1.22,shade(col,1.18));
      for(const u of [-.405,.359])lit.box([x+w*u,top+.964,z+d*.31],[.080,.041,.062],rgb(.82,.046,.078));
    }else if(variant===6){
      // Setback terrace and lift penthouse over occupied horizontal floors.
      solid(x-w*.063,z+d*.05,w*.88,d*.79,top,top+.34,shade(col,1.04));
      solid(x+w*.125,z-d*.06,w*.65,d*.67,top+.31,top+1.01,shade(col,.97));
      solid(x+w*.147,z-d*.06,w*.67,d*.69,top+.98,top+1.12,shade(col,.99));
      solid(x+w*.25,z-d*.105,w*.23,d*.29,top+1.11,top+1.48,shade(col,.87));
      solid(x+w*.26,z-d*.15,.060,.055,top+1.45,top+2.01,joint);
      solid(x+w*.06,z-d*.20,.055,.05,top+1.30,top+1.68,shade(joint,1.2));
      for(const u of [-.36,.355])lit.box([x+w*u,top+.302,z+d*.43],[.083,.047,.057],rgb(.79,.046,.082));
    }else {
      const caps=variant===1?3:2;
      for(let i=0;i<caps;i++)solid(x,z,w*(.9-i*.19),d*(.9-i*.16),top+i*.53,top+(i+1)*.53,shade(col,.95+i*.09));
    }
    if(variant===1){
      const aw=w*.45,ad=d*.29,yy=top+.92;
      mass.tri([x-aw,yy,z+ad],[x+aw,yy,z+ad],[x,yy+1.31,z],shade(col,1.91));
      mass.tri([x+aw,yy,z+ad],[x+aw,yy,z-ad],[x,yy+1.31,z],shade(col,1.29));
      for(const a of [-1,1])mass.cylinder([x+aw*a,yy,z+ad],[x,yy+1.31,z],.052,rgb(.23,.24,.23),5);
    }
    if(variant===2){mass.box([x,top+1.38,z],[.13,1.6,.13],rgb(.22,.25,.38));}
    // A low-key roof beacon stays bright; the whole roof edge does not glow.
    for(const k of [-.44,.44])lit.box([x+k*w,top+.06,z+d*.46],[.15,.079,.13],rgb(1.3,.085,.16));
  }
  tower(-36,-60,2.15,3.0,6.95,3,1.2);
  tower(-28,-62,2.1,3.6,6.85,1,1.27);
  tower(-24.3,-62.7,2.0,3,5.82,4,1.02);
  tower(-17.3,-94,4.1,3.3,8.00,0,2.15);
  tower(-9.5,-83,3.7,3.6,8.53,5,2.10);
  tower(-5.2,-77.5,3.4,3.4,8.45,6,2.38);
  tower(-2.0,-75.5,2.3,3.2,8.25,2,1.86);
  tower(1.25,-78,2.8,3.3,7.91,0,2.01);
  // Physically placed thin scattering volumes: alpha falls to zero around
  // every rim. Their separate depths let intervening buildings cut the glow.
  function vol(x,y,z,rx,ry,color,alpha,slope=0,shear=0) {
    const cuts=36,n=[0,0,1],mid=fog.vertex([x,y,z],n,[...color,alpha]);
    let inner=[];
    for(const r of [.16,.34,.57,.78,1]){
      const ring=[];
      for(let i=0;i<cuts;i++){
        const ang=i/cuts*TAU,u=r*Math.cos(ang),v=r*Math.sin(ang);
        // A skewed falloff follows slightly sloped streets. Different depths
        // naturally gate visibility behind their intervening roof silhouettes.
        ring.push(fog.vertex([x+rx*u+shear*v,y+ry*v+slope*u,z],n,[...color,alpha*Math.exp(-5.2*r*r)*(1-r*r)]));
      }
      for(let i=0;i<cuts;i++){const j=(i+1)%cuts;if(!inner.length)fog.indices.push(mid,ring[i],ring[j]);else fog.indices.push(inner[i],ring[i],ring[j],inner[i],ring[j],inner[j]);}
      inner=ring;
    }
  }
  // Main glass atrium and the freight-side station entrance are distinct
  // sources, with the service alley between them left in blue shadow.
  vol(-2.08,2.35,-73.45,4.8,5.5,[.231,.184,.467],.35);
  vol(-1.96,2.42,-73.04,1.89,3.83,[.415,.309,.678],.35);
  vol(-2.12,2.00,-72.83,.68,2.28,[.535,.416,.736],.15);
  // Lower station glow is reflection between the now-occupied blocks,
  // rather than a self-contained bright magenta spot pasted over the view.
  vol(-10.30,1.54,-78.83,10.3,2.88,[.337,.157,.436],.29,-.31,1.24);
  vol(-10.14,1.42,-78.47,4.95,1.96,[.312,.168,.487],.18,.25,-.77);
  vol(-6.90,.92,-75.23,15.7,2.46,[.18,.115,.37],.24,-.24,1.0);
  // Blue humid air and shop spill sit down the west streets, below roofs.
  vol(-30.4,1.53,-67.17,20.9,3.28,[.046,.233,.62],.31,.85,-1.33);
  vol(-19.1,.88,-62.12,12.5,2.58,[.054,.31,.482],.26,-.61,1.7);
  vol(10.0,.70,-81.32,11.8,3.40,[.067,.24,.40],.19);
  vol(-49.4,1.18,-80.2,20.2,3.51,[.042,.219,.58],.34,.58,-2.4);
  vol(-37.2,.39,-74.5,13.1,2.52,[.045,.293,.53],.26,-.88,2.7);
  vol(-11.2,1.01,-73.8,19.6,2.24,[.27,.153,.435],.15,.27,-1.2);
  // Apartment blocks in the middle-distance occupy actual street parcels.
  // Each visible unit has recessed glass doors, shuttered rooms, partition
  // walls and a slab-cast balcony rather than dots on a uniform box.
  function apartments(x,z,w,d,top,floors,phase){
    const archetype=[0,3,2,1,2,0,3,1,0,2][phase];
    residence(x,z,w,d,top-floors*1.23,top,archetype,phase+31);
  }
  [[-15.7,-39.2,5.4,3.5,-.94,5],[-23.5,-45.5,6.5,3.7,1.48,6],[-27.4,-54.1,5.7,3.4,1.95,6],[-8.4,-43.2,4.9,3.6,-.72,5],[-4.2,-53.0,4.6,2.85,1.21,6],[4.1,-51.1,4.8,3.12,1.41,6],[10.8,-45.6,6.25,3.4,-.13,5],[17.4,-57.2,5.8,3.5,1.76,5],[-12.2,31.1,5.4,3.1,-.68,5],[17.6,38.6,7.0,3.6,-.1,5]].forEach((v,i)=>apartments(...v,i));
  // Residential telephone/electric lines stay below the primary silhouette.
  // Sagging spans and narrow crossarms add scale in the side and reverse views.
  const poles=[[-18,-15,-3.2],[-25,-24,-1.8],[-35,-32,.2],[20,15,-3.8],[26,21,-2.5],[32,28,-.5],[-19,13,-2.9],[-25,19,-2.5],[-31,26,-1],[12,-30,-3.2],[21,-39,-2.2],[29,-47,-.3]];
  const pc=rgb(.044,.060,.081),wire=rgb(.025,.034,.047);
  for(let j=0;j<poles.length;j++){
    const [x,z,y]=poles[j];mass.cylinder([x,-9,z],[x,y,z],.083,pc,6);
    mass.box([x,y-.16,z],[1.22,.069,.08],pc);
    for(const xx of [-.5,0,.5]){mass.cylinder([x+xx,y-.12,z],[x+xx,y+.10,z],.047,shade(pc,2.4),5);}
    if(j%3!==0){const [ox,oz,oy]=poles[j-1];
      for(const xx of [-.5,0,.5]){
        let last=[ox+xx,oy+.066,oz];
        for(let k=1;k<=5;k++){const t=k/5,next=[ox+xx+(x-ox)*t,oy+(y-oy)*t+.066-.58*Math.sin(t*Math.PI),oz+(z-oz)*t];mass.cylinder(last,next,.014,wire,3);last=next;}
      }
    }
  }
  const meshes=[terrain.build(),mass.build(),lit.build('opaque'),fog.build('additive')];
  for(const m of meshes)m.unlit=true; meshes[3].name="City • station light in the night haze";
  meshes[0].name='City • receding foothills';meshes[1].name='City • nine architectural districts';meshes[2].name='City • inhabited windows and station lamps';
  return meshes;
}
