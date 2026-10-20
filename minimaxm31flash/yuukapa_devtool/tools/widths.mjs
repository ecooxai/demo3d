#!/usr/bin/env node
/**
 * Silhouette width profile: for each height between the chin and the
 * feet, measure how wide the character is in the reference vs the render.
 */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const shot = process.argv[2] || 'review/iterations/front.png';
const out = process.argv[3] || 'review/widths.png';
const refB64 = fs.readFileSync('assets/reference.png').toString('base64');
const shotB64 = fs.readFileSync(shot).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#0f1424;color:#e8eefc;font-family:ui-monospace,monospace}
table{border-collapse:collapse;margin:8px}
td,th{border:1px solid #2a3350;padding:3px 9px;font-size:12px}
th{background:#1b2338}
canvas{border-radius:8px;margin:6px}
</style></head><body><div id="out"></div><script>
const REF="${refB64}",SHOT="${shotB64}";
const load=(s)=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src="data:image/png;base64,"+s;});
const profile=(img,chin,feet)=>{
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;
  const g=c.getContext('2d');g.drawImage(img,0,0);
  // detect a flat magenta background (the render's debug mode)
  const probe=g.getImageData(40,Math.round((chin+feet)/2),1,1).data;
  const flat = probe[0]>170 && probe[1]<95 && probe[2]>170;
  const rows=[];
  for(let k=0;k<=20;k++){
    const t=k/20, y=Math.round(lerp(chin,feet,t));
    const d=g.getImageData(0,y,img.width,1).data;
    let minx=-1,maxx=-1;
    if(flat){
      for(let x=26;x<img.width-26;x++){
        const i=x*4;
        const magenta = d[i]>180 && d[i+1]<90 && d[i+2]>180;
        if(!magenta){ if(minx<0)minx=x; maxx=x; }
      }
    } else {
      const samples=[];
      for(let x=0;x<8;x++){ const i=x*4; samples.push([d[i],d[i+1],d[i+2]]); }
      for(let x=img.width-8;x<img.width;x++){ const i=x*4; samples.push([d[i],d[i+1],d[i+2]]); }
      samples.sort((a,b)=>a[0]-b[0]);
      const bg=samples[Math.floor(samples.length/2)];
      for(let x=2;x<img.width-2;x++){
        const i=x*4;
        const diff=Math.abs(d[i]-bg[0])+Math.abs(d[i+1]-bg[1])+Math.abs(d[i+2]-bg[2]);
        if(diff>30){ if(minx<0)minx=x; maxx=x; }
      }
    }
    rows.push({t,y,left:minx,right:maxx,w:(minx<0?0:maxx-minx),cx:(minx<0?0:(minx+maxx)/2)});
  }
  return rows;
};
const lerp=(a,b,t)=>a+(b-a)*t;
(async()=>{
  const ref=await load(REF), sh=await load(SHOT);
  const R=profile(ref,400,2008);
  const S=profile(sh,270,1090);
  const scaleR=(R[0].right?1:1);
  // normalise widths by the chin->feet span
  const spanR=2008-400, spanS=1090-270;
  let html='<table><tr><th>t (0=chin,1=feet)</th><th>ref width px</th><th>ref m</th><th>render width px</th><th>render m</th><th>delta m</th><th>ref cx</th><th>render cx</th></tr>';
  for(let k=0;k<R.length;k++){
    const wr=R[k].w*0.000902, ws=S[k].w*(1.45/spanS);
    const cr=(R[k].cx-417)*0.000902, cs=(S[k].cx-450)*(1.45/spanS);
    html+=\`<tr><td>\${R[k].t.toFixed(2)}</td><td>\${R[k].w}</td><td>\${wr.toFixed(3)}</td><td>\${S[k].w}</td><td>\${ws.toFixed(3)}</td><td>\${(ws-wr>=0?'+':'')}\${(ws-wr).toFixed(3)}</td><td>\${cr.toFixed(3)}</td><td>\${cs.toFixed(3)}</td></tr>\`;
  }
  html+='</table>';
  document.getElementById('out').innerHTML=html;
  window.__done=true;
})();
</script></body></html>`;

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 900, height: 800 } });
const page = await browser.newPage();
await page.setContent(html);
await page.waitForFunction(() => window.__done === true, { timeout: 20000 });
const table = await page.evaluate(() => document.querySelector('table').outerHTML);
console.log(table.replace(/<\/?t[dh]>/g, ' | ').replace(/<\/tr>/g, '\n').replace(/<[^>]+>/g, ''));
await browser.close();
