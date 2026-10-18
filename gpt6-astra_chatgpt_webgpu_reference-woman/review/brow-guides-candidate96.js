// Original eyebrow flow. The same irregular guides supply the painted fine
// hairs and the sparse true geometry; positions are final head coordinates.
// No feature detector, additional image, or external asset is used.
export function createBrowGuides(side,count=680){
  const s=side<0?-1:1;
  let seed=s<0?619503:881927;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const guides=[];
  for(let i=0;i<count;i++){
    const t=random(),envelope=Math.pow(Math.sin(Math.PI*t),.30);
    const width=.033*envelope*(1-.60*t);
    const x=s*(.14+t*.49);
    const center=.228+.048*Math.sin(t*Math.PI*.88)-.028*t+.0015*Math.sin(t*Math.PI*3.3+s*.7)*envelope;
    const y=center+width*(random()+random()-1)*.90;
    const length=(.010+.019*random())*(1-.15*t);
    const angle=.92*Math.pow(1-t,1.8)-.16*t+.28*(random()-.5);
    const dx=s*length*Math.cos(angle),dy=length*Math.sin(angle);
    const bend=.004*(random()-.5);
    guides.push({t,root:[x,y],control:[x+dx*.47,y+dy*.53+bend],tip:[x+dx,y+dy],
      radius:(.00046+.00042*random())*(1-.45*t),opacity:.075+.19*random(),lineWidth:.30+.40*random()});
  }
  return guides;
}
