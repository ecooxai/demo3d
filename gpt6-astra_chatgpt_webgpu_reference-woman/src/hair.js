import * as THREE from 'three';
const V=(x,y,z)=>new THREE.Vector3(x,y,z),TAU=Math.PI*2;
function rng(seed=14771){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}
const curve=p=>new THREE.CatmullRomCurve3(p.map(a=>a.isVector3?a:V(...a)),false,'catmullrom',.4);
const batch=()=>({p:[],c:[],u:[],i:[]});
function vert(b,p,c,uv){let k=b.p.length/3;b.p.push(p.x,p.y,p.z);b.c.push(c.r,c.g,c.b);b.u.push(uv?uv[0]:p.x*.5,uv?uv[1]:p.y*.2);return k;}
function quad(b,a,c,d,e){b.i.push(a,c,e,c,d,e);}
function mesh(b,m,name){let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setIndex(b.i);g.computeVertexNormals();g.computeBoundingSphere();let o=new THREE.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;return o;}
function frame(c,t,front){let p=c.getPoint(t),d=c.getTangent(t).normalize(),n=front?V(p.x*.15,.05,1):V(p.x,.02,p.z+.07);if(n.lengthSq()<.01)n=V(0,.2,1);n.normalize();let s=d.clone().cross(n);if(s.lengthSq()<.001)s=V(1,0,0);else s.normalize();return{p,s,n:s.clone().cross(d).normalize()};}
function ribbon(b,c,w,color,front=false,phase=0,steps=42,across=6,thin=false){let first=b.p.length/3,base=new THREE.Color(color);for(let j=0;j<=steps;j++){let t=j/steps,f=frame(c,t,front),taper=.06+.94*Math.pow(1-t,thin?.55:.36);for(let k=0;k<=across;k++){let u=k/across*2-1,bulge=thin?0:(1-u*u)*.024*(.5+.5*Math.sin(t*Math.PI));let p=f.p.clone().addScaledVector(f.s,u*w*taper).addScaledVector(f.n,bulge+(thin?.027:.0015*Math.sin(k/across*39+phase)));let light=.85+.1*Math.sin(k/across*17+phase)+.035*Math.cos(t*13+phase);vert(b,p,base.clone().multiplyScalar(light),[k/across,t]);}}for(let j=0;j<steps;j++)for(let k=0;k<across;k++){let a=first+j*(across+1)+k;quad(b,a,a+across+1,a+across+2,a+1);}}
function scalp(theta,phi,offset=0){return V(.015+(.916+offset)*Math.sin(theta)*Math.sin(phi),.36+1.31*Math.cos(theta),-.065+(.84+offset)*Math.sin(theta)*Math.cos(phi));}
function curtain(phi,t,inner=0){let radius=(.94+.17*Math.sin(t*Math.PI*.82)+.055*Math.sin(t*8+phi*3)*t)*(1-.17*t*t*t*t);return V(Math.sin(phi)*(radius-inner),1.04+(-4.85+.17*Math.cos(phi*4.3)+.08*Math.sin(phi*8))*t,-.085+Math.cos(phi)*((.865+.025*Math.sin(t*Math.PI))*(1-.18*t*t*t*t)-inner)+.045*Math.sin(t*6+phi*3)*t);}
function foundation(b){let col=new THREE.Color('#251b1e'),az=72,lat=22,start=b.p.length/3;for(let j=0;j<=lat;j++)for(let k=0;k<=az;k++){let phi=k/az*TAU,lim=2.27-1.25*Math.pow(Math.max(0,Math.cos(phi)),2.3);vert(b,scalp(j/lat*lim,phi),col.clone().multiplyScalar(.88+.08*Math.sin(phi*39)));}for(let j=0;j<lat;j++)for(let k=0;k<az;k++){let a=start+j*(az+1)+k;quad(b,a,a+az+1,a+az+2,a+1);}let n=64,m=36;start=b.p.length/3;for(let j=0;j<=m;j++)for(let k=0;k<=n;k++){let phi=.81+(TAU-1.62)*k/n;vert(b,curtain(phi,j/m),col.clone().multiplyScalar(.80+.14*Math.sin(phi*49)+.04*Math.sin(phi*87)));}for(let j=0;j<m;j++)for(let k=0;k<n;k++){let a=start+j*(n+1)+k;quad(b,a,a+n+1,a+n+2,a+1);}let back=b.p.length/3;for(let j=0;j<=m;j++)for(let k=0;k<=n;k++)vert(b,curtain(.81+(TAU-1.62)*k/n,j/m,.05),col.clone().multiplyScalar(.7));for(let j=0;j<m;j++)for(let k=0;k<n;k++){let a=back+j*(n+1)+k;b.i.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}for(let k=0;k<n;k++){let a=start+m*(n+1)+k,d=back+m*(n+1)+k;quad(b,a,a+1,d+1,d);}for(let j=0;j<m;j++)for(let k of[0,n]){let a=start+j*(n+1)+k,d=back+j*(n+1)+k;quad(b,a,d,d+n+1,a+n+1);}}
export function createHair(){
 let root=new THREE.Group();root.name='Original chestnut layered hair';
 let random=rng(),shell=batch(),locks=batch(),strands=batch(),bangs=batch(),paths=[];
 let mat=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.42,metalness:0,side:THREE.DoubleSide,anisotropy:.7,anisotropyRotation:Math.PI*.5,clearcoat:.06,clearcoatRoughness:.4,specularIntensity:.40});
 let fineMat=mat.clone();fineMat.roughness=.46;fineMat.specularIntensity=.3;
 foundation(shell);
 for(let k=0;k<30;k++){let phi=.79+k/29*(TAU-1.58)+(random()-.5)*.06;let ps=[scalp(.16+(k%4)*.055,phi),scalp(.68,phi),scalp(1.16,phi,.025)];for(let t of[.26,.56,.8,1]){let p=curtain(phi,t);p.addScaledVector(V(p.x,0,p.z+.08).normalize(),.045);ps.push(p);}let c=curve(ps),w=.12+random()*.025;ribbon(locks,c,w,k%5?'#3a292c':'#493336',false,k*1.8);paths.push({c,w,front:false,phase:k});}
 for(let side of[-1,1])for(let k=0;k<6;k++){let q=k/5;let ps=[[side*(.24+q*.18),1.58-q*.09,.20+q*.1],[side*(.68+q*.15),1.13,.57-q*.1],[side*(.83+q*.19),.35,.59+q*.055],[side*(.84+q*.18),-.72,.65+q*.1],[side*(.91+q*.21),-1.68,.72+q*.1],[side*(1.06+q*.18),-2.45,.79+q*.075],[side*(.97+q*.19),-3.12,.85+q*.03],[side*(.66+q*.30),-3.74+q*.25+.08*side,.78+q*.06],[side*(.59+q*.24),-3.91+q*.31+.08*side,.71+q*.05]];let c=curve(ps),w=.10+q*.025;ribbon(locks,c,w,k%3?'#3d2b2d':'#493337',true,k*2.4+side,46);paths.push({c,w,front:true,phase:k+side});}
 let colors=['#423133','#503c3d','#3a292d','#604749','#35262a','#6b5150'];
 function addFine(c,w,front,count,phase){for(let k=0;k<count;k++){let shift=((k+.2+random()*.6)/count*2-1)*w*.93,ps=[];for(let j=0;j<=10;j++){let t=j/10,f=frame(c,t,front);ps.push(f.p.clone().addScaledVector(f.s,shift*(.14+.86*Math.pow(1-t,.37))+.002*Math.sin(t*29+k)).addScaledVector(f.n,.006));}ribbon(strands,curve(ps),.0012+random()*.001,colors[(k+phase+60)%colors.length],front,k+phase,27,1,true);}}
 for(let {c,w,front,phase}of paths)addFine(c,w,front,9,phase);
 let bs=[
 [.132,[[.17,1.63,.23],[-.10,1.57,.48],[-.42,1.29,.65],[-.65,.83,.67],[-.75,.31,.61],[-.78,-.06,.56]]],
 [.096,[[.18,1.63,.25],[-.05,1.50,.61],[-.29,1.20,.74],[-.46,.79,.78],[-.64,.18,.72],[-.74,-.49,.59]]],
 [.047,[[.19,1.60,.29],[.03,1.39,.67],[-.10,1.10,.78],[-.24,.73,.80],[-.35,.44,.77]]],
 [.024,[[.21,1.61,.29],[.11,1.38,.69],[.03,.98,.81],[-.05,.67,.83],[-.16,.38,.78]]],
 [.029,[[.22,1.61,.28],[.23,1.39,.68],[.20,1.06,.81],[.12,.72,.83],[.025,.44,.79]]],
 [.019,[[.23,1.60,.26],[.29,1.39,.64],[.32,1.10,.77],[.29,.85,.80],[.20,.60,.80]]],
 [.022,[[.24,1.60,.25],[.39,1.30,.62],[.43,1.04,.73],[.42,.81,.75],[.37,.63,.73]]],
 [.09,[[.25,1.60,.20],[.52,1.41,.44],[.71,1.10,.57],[.83,.70,.53],[.89,.22,.51],[.90,-.31,.52]]],
 [.019,[[-.38,1.16,.72],[-.57,.72,.75],[-.71,.18,.70],[-.77,-.54,.61],[-.80,-1.3,.63],[-.85,-2.08,.72]]]
 ];
 bs.forEach(([w,ps],k)=>{let c=curve(ps);ribbon(bangs,c,w,k%2?'#453033':'#35272c',true,k*2.8,36,5);addFine(c,w,true,w>.06?11:5,k);});
 for(let k=0;k<28;k++){let side=k%2?-1:1,t=(k%14)/13,y=1.15-t*4,x=side*(.94+.18*Math.sin(t*Math.PI)),z=.14+.6*random();let c=curve([[x,y,z],[x+side*.028,y-.2,z+.018],[x+side*.055,y-.49,z+.012],[x+side*.01,y-.78,z-.02]]);ribbon(strands,c,.0008,'#523d40',true,k,16,1,true);}
 root.add(mesh(shell,mat,'Hair closed crown and rear volume'),mesh(locks,mat,'Hair flattened chestnut locks'),mesh(bangs,mat,'Hair diagonal parted bangs'),mesh(strands,fineMat,'Hair fine geometric strands'));
 let triangles=0;root.traverse(o=>{if(o.isMesh)triangles+=o.geometry.index.count/3;});
 root.userData={procedural:true,triangles,source:'Only supplied portrait; original geometry and colors',coordinateSystem:'+Z front; head local crown 1.67, tips about -4.0'};
 return root;
}
