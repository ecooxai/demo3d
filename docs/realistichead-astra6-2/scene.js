// Assemble indexed meshes into one draw call. Colors are working sRGB 0..1.
export async function loadPortrait(){
 const {buildSculpt}=await import('./sculpt.js');const s=buildSculpt();const {buildSurface}=await import('./surface.js'),{buildGarment}=await import('./garment.js');
 const meshes=[s,buildSurface(),buildGarment()].flat(3).filter(v=>v?.positions?.length);
 const count=meshes.reduce((a,m)=>a+m.positions.length/3,0), indexCount=meshes.reduce((a,m)=>a+(m.indices?.length||m.positions.length/3),0);const vertices=new Float32Array(count*12),indices=new Uint32Array(indexCount);let v=0,t=0;
 const names=[];
 for(const m of meshes){const p=m.positions,nvert=p.length/3,ind=m.indices?.length?m.indices:Uint32Array.from({length:nvert},(_,i)=>i),clr=m.colors??m.color??[.63,.40,.34];let n=m.normals;
 if(!n||n.length!==p.length){n=new Float32Array(p.length);for(let i=0;i<ind.length;i+=3){const a=ind[i]*3,b=ind[i+1]*3,c=ind[i+2]*3,ax=p[b]-p[a],ay=p[b+1]-p[a+1],az=p[b+2]-p[a+2],bx=p[c]-p[a],by=p[c+1]-p[a+1],bz=p[c+2]-p[a+2],nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;for(const k of [a,b,c]){n[k]+=nx;n[k+1]+=ny;n[k+2]+=nz;}}}
 const name=String(m.name||''),kind=m.material==='cornea'||/^eye [+-]?\d/i.test(name)?5:/^(scalp)/i.test(name)?1:/(hair|chestnut|flyaway|locks|tress|fringe|temple silk|temple strand|combed strand|crown strand)/i.test(name)?2:/(silver|metal|wire|gold|figaro)/i.test(name)?3:/(pendant|nacre|bead|pearl.*ear|ear.*pearl)/i.test(name)?4:/(skin|nose|pinna|face|cheek|eyelid|complexion|flesh|head.form|bust|hand|finger|neck|ear.shell)/i.test(name)?1:0;
 const perColor=clr.length>=p.length;for(let i=0;i<nvert;i++){const a=i*3,b=(v+i)*12,cc=perColor?a:0,mag=Math.hypot(n[a],n[a+1],n[a+2])||1;vertices[b]=p[a];vertices[b+1]=p[a+1];vertices[b+2]=p[a+2];vertices[b+3]=n[a]/mag;vertices[b+4]=n[a+1]/mag;vertices[b+5]=n[a+2]/mag;vertices[b+6]=clr[cc];vertices[b+7]=clr[cc+1];vertices[b+8]=clr[cc+2];vertices[b+9]=m.roughness??.57;vertices[b+10]=m.specular??.27;vertices[b+11]=kind;}
 for(let i=0;i<ind.length;i++)indices[t+i]=ind[i]+v;v+=nvert;t+=ind.length;names.push(name);}
 if(!indices.length)throw Error('No portrait meshes have been generated.');
 return {vertices,indices,names,totalVerts:count,totalTris:indexCount/3};}
export const norm=v=>{let d=Math.hypot(...v)||1;return v.map(x=>x/d)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export function lookAt(eye,target){const z=norm(eye.map((n,i)=>n-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
export function mul(a,b){let c=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)c[j*4+i]=a[i]*b[4*j]+a[4+i]*b[4*j+1]+a[8+i]*b[4*j+2]+a[12+i]*b[4*j+3];return c;}
export function perspective(vfov,aspect,near=.08,far=100){const f=1/Math.tan(vfov/2),nf=1/(near-far);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0];}
export function ortho(l,r,b,t,n,f){return [2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1];}
export const lightMatrix=mul(ortho(-2.5,2.5,-2.5,2.5,.1,11),lookAt([3.36,3.495,4.585],[0,-.11,0]));
