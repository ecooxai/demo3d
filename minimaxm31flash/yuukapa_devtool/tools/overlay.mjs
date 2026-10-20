#!/usr/bin/env node
/**
 * Silhouette overlay: scales the reference and the render to the same
 * chin→feet span, aligns the feet and tints one red / one cyan.
 */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const shot = process.argv[2] || 'review/iterations/front.png';
const out = process.argv[3] || 'review/overlay.png';
const refB64 = fs.readFileSync('assets/reference.png').toString('base64');
const shotB64 = fs.readFileSync(shot).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#10141f}
canvas{display:block}
</style></head><body><canvas id="c" width="1100" height="1000"></canvas><script>
const REF="${refB64}", SHOT="${shotB64}";
const load=(s)=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src="data:image/png;base64,"+s;});
const tint=(img,color)=>{const o=document.createElement('canvas');o.width=img.width;o.height=img.height;
 const g=o.getContext('2d');g.drawImage(img,0,0);g.globalCompositeOperation='source-in';
 g.fillStyle=color;g.fillRect(0,0,o.width,o.height);return o;};
(async()=>{
  const ref=await load(REF), sh=await load(SHOT);
  const c=document.getElementById('c'), g=c.getContext('2d');
  g.fillStyle='#10141f';g.fillRect(0,0,c.width,c.height);
  // reference: chin 400 -> feet 2008
  const refSpan=2008-400, target=880;
  const rs=target/refSpan;
  const rh=refSpan*rs, rw=ref.width*rs;
  g.globalAlpha=0.62; g.drawImage(tint(ref,'#ff5566'),0,400,ref.width,refSpan, 550-rw/2, 1000-target, rw, rh);
  // render: chin 270 -> feet 1090
  const shSpan=1090-270, ss=target/shSpan;
  const shh=sh.height*ss, shw=sh.width*ss;
  g.globalAlpha=0.62; g.drawImage(tint(sh,'#44ddff'),0,0,sh.width,sh.height, 550-shw/2, 1000-target-shh+shh-(1000-target), shw, shh);
  g.globalAlpha=1;
  g.fillStyle='#fff';g.font='600 16px sans-serif';
  g.fillText('RED = reference     CYAN = render',16,26);
  window.__done=true;
})();
</script></body></html>`;

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1100, height: 1000 } });
const page = await browser.newPage();
await page.setContent(html);
await page.waitForFunction(() => window.__done === true, { timeout: 20000 });
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
