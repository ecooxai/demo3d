// World-space geometry. Y up, triangle-list topology, straight-alpha linear RGBA.
// Builders have no module/global state: one material can be batched across objects.
export const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const unit=a=>{const l=Math.hypot(...a);return l?a.map(x=>x/l):[0,0,0]};
// Typed append-only chunks avoid boxed/double array growth while constructing large districts.
class FloatStream{
 constructor(T){this.T=T;this.chunks=[];this.part=new T(32768);this.used=0;this.length=0}
 push(...values){let i=0;while(i<values.length){if(this.used===32768){this.chunks.push(this.part);this.part=new this.T(32768);this.used=0}
 const n=Math.min(values.length-i,32768-this.used),end=i+n;while(i<end)this.part[this.used++]=values[i++];}this.length+=values.length;return this.length}
 finish(){const out=new this.T(this.length);let offset=0;for(const part of this.chunks){out.set(part,offset);offset+=32768}out.set(this.part.subarray(0,this.used),offset);return out}
}
export class MeshBuilder{
  constructor(){this.vertices=new FloatStream(Float32Array);this.indices=new FloatStream(Uint32Array)}
  vertex(p,n,c){const i=this.vertices.length/10;this.vertices.push(...p,...n,c[0],c[1],c[2],c[3]??1);return i}
  tri(a,b,c,col){const n=unit(cross(sub(b,a),sub(c,a))),i=this.vertex(a,n,col);this.vertex(b,n,col);this.vertex(c,n,col);this.indices.push(i,i+1,i+2);return this}
  quad(a,b,c,d,col){const n=unit(cross(sub(b,a),sub(c,a))),i=this.vertex(a,n,col);this.vertex(b,n,col);this.vertex(c,n,col);this.vertex(d,n,col);this.indices.push(i,i+1,i+2,i,i+2,i+3);return this}
  box(p,size,col){const [x,y,z]=p,[dx,dy,dz]=size.map(v=>v/2),v=[];for(const [i,j,k] of [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]])v.push([x+i*dx,y+j*dy,z+k*dz]);for(const [a,b,c,d] of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]])this.quad(v[a],v[b],v[c],v[d],col);return this}
  cylinder(a,b,r,col,segments=12){if(!(r>0)||Math.hypot(...sub(b,a))<1e-8)return this;const n=unit(sub(b,a)),u=unit(cross(n,Math.abs(n[1])<.8?[0,1,0]:[1,0,0])),v=cross(n,u);const p=(c,k)=>c.map((q,j)=>q+r*(u[j]*Math.cos(k)+v[j]*Math.sin(k)));for(let j=0;j<segments;j++){const t=j*Math.PI*2/segments,s=(j+1)*Math.PI*2/segments,a0=p(a,t),a1=p(a,s),b0=p(b,t),b1=p(b,s);this.quad(a0,a1,b1,b0,col);this.tri(a,a1,a0,col);this.tri(b,b0,b1,col)}return this}
  sphere(p,radii,col,segments=12,rings=8){const r=typeof radii==='number'?[radii,radii,radii]:radii,i0=this.vertices.length/10;for(let v=0;v<=rings;v++)for(let u=0;u<=segments;u++){const a=u*2*Math.PI/segments,b=v*Math.PI/rings,dr=[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];this.vertex(p.map((x,i)=>x+dr[i]*r[i]),unit(dr.map((x,i)=>x/Math.max(1e-8,r[i]))),col)}for(let y=0;y<rings;y++)for(let x=0;x<segments;x++){const a=i0+y*(segments+1)+x,b=a+segments+1;if(y>0)this.indices.push(a,a+1,b);if(y<rings-1)this.indices.push(a+1,b+1,b)}return this}
  build(mode='opaque'){return {vertices:this.vertices.finish(),indices:this.indices.finish(),mode}}
}

