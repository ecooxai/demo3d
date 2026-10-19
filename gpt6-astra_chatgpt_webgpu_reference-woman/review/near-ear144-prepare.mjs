import fs from 'node:fs';
import crypto from 'node:crypto';
import {THREE,read} from './torso-depth110-harness.mjs';

// Offline route fit only. Native construction reads these small coefficients;
// it does not rebuild the ear, query collisions or solve a fit every frame.
const begin=performance.now(),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const sourcePath='review/hair-groom-candidate133.js',raw=fs.readFileSync(sourcePath,'utf8');
if(sha(raw)!=='a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d')throw Error('144 frozen source changed.');
const faceZ=new Function('THREE',read('src/face.js')+'\nreturn faceZ;')(THREE);
let source=read(sourcePath);source=source.slice(0,source.indexOf(' // Fit only original lower front/inner/curl curves'))+'return {guides};}';
const guide=new Function('THREE','faceZ',source+'\nreturn createGroomHair;')(THREE,faceZ)({}).guides[138];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const balance=[-.24*Math.cos(.16)*Math.cos(-.17),.24*Math.cos(.16)*Math.sin(-.17),-.24*Math.sin(.16)];
const targetPath=process.argv[2]||'review/near-ear144-route-targets.json',targetSource=fs.readFileSync(targetPath,'utf8');
const requested=JSON.parse(targetSource);
if(requested.length!==8||requested[0][0]!==-.58||requested.at(-1)[0]!==.65)throw Error('144 approved compact scope changed.');
function atHeight(y){let lo=0,hi=1;for(let k=0;k<44;k++){const t=(lo+hi)/2;if(guide.c.getPoint(t).y>y)lo=t;else hi=t;}return guide.c.getPoint((lo+hi)/2);}
const nodes=requested.map(([y,x,z])=>{
 const p=atHeight(y),w=1-smooth(-1.64,.38,y),cy=Math.cos(-.16*w),sy=Math.sin(-.16*w),cz=Math.cos(.17*w),sz=Math.sin(.17*w),xr=cy*p.x+sy*p.z;
 const before=[cz*xr-sz*y+balance[0],sz*xr+cz*y+balance[1],-sy*p.x+cy*p.z+balance[2]];
 if(x===null)return{y,x:0,z:0,before,target:before.slice()};
 const rx=(x-balance[0]+sz*y)/cz,rz=z-balance[2],ax=cy*rx-sy*rz,az=sy*rx+cy*rz;
 return{y,x:ax-p.x,z:az-p.z,before,target:[x,sz*rx+cz*y+balance[1],z]};
});
function solve(A){
 const n=A.length;
 for(let k=0;k<n;k++){let pivot=k;for(let j=k+1;j<n;j++)if(Math.abs(A[j][k])>Math.abs(A[pivot][k]))pivot=j;[A[k],A[pivot]]=[A[pivot],A[k]];const v=A[k][k];if(Math.abs(v)<1e-14)throw Error('144 fit singular');for(let j=k;j<=n;j++)A[k][j]/=v;for(let i=0;i<n;i++)if(i!==k){const d=A[i][k];for(let j=k;j<=n;j++)A[i][j]-=d*A[k][j];}}
 return A.map(r=>r[n]);
}
function component(key){
 const n=nodes.length,A=Array.from({length:n},()=>new Float64Array(n+1));
 const h0=nodes[1].y-nodes[0].y,h1=nodes[n-1].y-nodes[n-2].y;
 A[0][0]=2*h0;A[0][1]=h0;A[0][n]=6*(nodes[1][key]-nodes[0][key])/h0;
 A[n-1][n-2]=h1;A[n-1][n-1]=2*h1;A[n-1][n]=-6*(nodes[n-1][key]-nodes[n-2][key])/h1;
 for(let i=1;i<n-1;i++){const a=nodes[i].y-nodes[i-1].y,b=nodes[i+1].y-nodes[i].y;A[i][i-1]=a;A[i][i]=2*(a+b);A[i][i+1]=b;A[i][n]=6*((nodes[i+1][key]-nodes[i][key])/b-(nodes[i][key]-nodes[i-1][key])/a);}
 const dd=solve(A),d=nodes.map((p,i)=>{if(i===n-1)return 0;const h=nodes[i+1].y-p.y;return(nodes[i+1][key]-p[key])/h-h*(2*dd[i]+dd[i+1])/6;});
 d[0]=0;dd[0]=dd[n-1]=0;
 return nodes.slice(0,-1).map((p,i)=>{const q=nodes[i+1],h=q.y-p.y;return[p[key],p[key]+h*d[i]/5,p[key]+2*h*d[i]/5+h*h*dd[i]/20,q[key]-2*h*d[i+1]/5+h*h*dd[i+1]/20,q[key]-h*d[i+1]/5,q[key]];});
}
const x=component('x'),z=component('z'),segments=nodes.slice(0,-1).map((p,i)=>({y0:p.y,y1:nodes[i+1].y,x:x[i],z:z[i]}));
// Convex-hull subdivision supplies a certified continuous norm bracket for
// the stored polynomial field, independent of a sampling resolution.
function half(v){const rows=[v.map(p=>p.slice())];for(let n=5;n>0;n--){const a=rows.at(-1);rows.push(a.slice(0,-1).map((p,i)=>p.map((q,k)=>(q+a[i+1][k])*.5)));}return[rows.map(r=>r[0]),rows.map(r=>r.at(-1)).reverse()];}
let lower=0,upper=0,subdivisions=0;const queue=segments.map(s=>s.x.map((x,i)=>[x,s.z[i]]));
while(queue.length){const points=queue.pop(),lo=Math.max(Math.hypot(...points[0]),Math.hypot(...points[5])),hi=Math.max(...points.map(p=>Math.hypot(...p)));lower=Math.max(lower,lo);if(hi<=lower+1e-9){upper=Math.max(upper,hi);continue;}const children=half(points);subdivisions++;for(const child of children)queue.push(child);if(subdivisions>100000)throw Error('144 continuous-bound subdivision did not converge');}
upper=Math.max(upper,lower);
const data={version:'existing-rooted-near-ear-route-144',nodes,segments,balance,continuousBound:{lower,upper,tolerance:1e-9,subdivisions,method:'Convex-hull subdivision of 2D quintic Bezier displacement'},sourceGuide:{id:138,u:guide.scalpRoot.u,width:guide.w,depth:guide.d,cuts:guide.c.debug.cuts},sourceHashes:{groom:sha(raw),ear:sha(fs.readFileSync('src/ear.js')),ear115:sha(fs.readFileSync('src/near-ear.js')),targets:sha(targetSource)}};
data.fingerprint=sha(JSON.stringify({nodes,segments}));
fs.writeFileSync('review/near-ear144-coefficients.js','// Offline original geometric route144; no image or outside asset data.\nexport const ROUTE144_COEFFICIENTS = '+JSON.stringify(data,null,2)+';\n');
console.log(JSON.stringify({fingerprint:data.fingerprint,continuousBound:data.continuousBound,nodes:data.nodes.map(n=>({y:n.y,dx:n.x,dz:n.z,target:n.target})),elapsedMs:performance.now()-begin,peakRSSMiB:process.resourceUsage().maxRSS/1024}));
