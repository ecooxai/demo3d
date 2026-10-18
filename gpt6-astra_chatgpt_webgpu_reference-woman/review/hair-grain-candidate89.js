import * as THREE from 'three';

// Original strand-scale pigment variation. It retains each accepted map's
// exact alpha, UVs, and mean linear albedo; no photographic texture is sampled.
const applied=new WeakMap();
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const linear=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const encoded=x=>x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055;
function random(seed){return()=>{seed=(seed+0x6d2b79f5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=(t+Math.imul(t^t>>>7,61|t))^t;return((t^t>>>14)>>>0)/4294967296;};}

function strandMap(original,lanes,strength){
 const {data:old,width,height}=original.image;
 if(!(old instanceof Uint8Array)||old.length!==width*height*4)throw new Error('Expected original RGBA strand map');
 const data=new Uint8Array(old),r=random(487119),tone=[],phase=[],variation=[];
 for(let i=0;i<lanes;i++){tone.push((r()-.5)*1.45);phase.push(r()*Math.PI*2);variation.push(.75+.25*r());}
 let oldMean=0,newMean=0,total=0,minimum=Infinity,maximum=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=x/width*lanes,v=y/(height-1),lane=Math.min(lanes-1,Math.floor(u)),q=u-lane;
  const drift=.032*Math.sin(v*8+phase[lane]);
  const grain=tone[lane]+.20*Math.cos((q+drift)*Math.PI*2)+.09*Math.sin(v*13+phase[lane])*variation[lane];
  const value=.58*Math.exp(.65*strength*grain),byte=Math.round(clamp(encoded(value))*255),at=(y*width+x)*4;
  data[at]=data[at+1]=data[at+2]=byte;
  const weight=old[at+3]/255;
  oldMean+=linear(old[at]/255)*weight;newMean+=linear(byte/255)*weight;total+=weight;
  minimum=Math.min(minimum,value);maximum=Math.max(maximum,value);
 }
 const map=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 map.name=`Original ${lanes}-lane uneven hair pigment`;
 for(const key of ['wrapS','wrapT','minFilter','magFilter','generateMipmaps','anisotropy','flipY','unpackAlignment'])map[key]=original[key];
 map.colorSpace=THREE.SRGBColorSpace;map.offset.copy(original.offset);map.repeat.copy(original.repeat);map.center.copy(original.center);map.rotation=original.rotation;map.needsUpdate=true;
 return{map,compensation:oldMean/newMean,originalMean:oldMean/total,newMean:newMean/total,range:[minimum,maximum]};
}

export function applyOriginalHairGrain(hair,{strength=1}={}){
 if(!Number.isFinite(strength)||strength<0||strength>1)throw new Error('Hair grain strength must be in [0,1]');
 if(!strength)return{strength,changed:false};
 const prior=applied.get(hair);if(prior){if(prior.strength!==strength)throw new Error('Compare strengths on a fresh groom');return prior;}
 const start=performance.now(),metrics={strength,changed:true,maps:[],retainedMapBytes:0};
 for(const [name,lanes]of [['Continuous parted crown with longitudinal fiber flow',192],['Overlapping layered S-wave hair around front back and shoulders',24]]){
  const mesh=hair.getObjectByName(name);if(!mesh?.isMesh)throw new Error('Accepted groom mesh missing');
  const material=mesh.material,color=mesh.geometry.attributes.color;
  const result=strandMap(material.map,lanes,strength);
  for(let i=0;i<color.count;i++)for(let ch=0;ch<3;ch++){
   const at=i*color.itemSize+ch,value=color.array[at]*result.compensation;
   if(!Number.isFinite(value)||value<0||value>1)throw new Error('Compensated hair pigment outside exportable RGB');
   color.array[at]=value;
  }
  color.needsUpdate=true;material.map=result.map;
  if(lanes===24){material.normalMap=material.normalMap.clone();material.normalMap.repeat.x=.125;material.normalMap.needsUpdate=true;}
  material.needsUpdate=true;
  metrics.retainedMapBytes+=result.map.image.data.byteLength;
  metrics.maps.push({name,lanes,compensation:result.compensation,originalMean:result.originalMean,normalizedMean:result.newMean*result.compensation,range:result.range});
 }
 metrics.constructionMs=performance.now()-start;hair.userData.originalStrandPigment=metrics;applied.set(hair,metrics);return metrics;
}
