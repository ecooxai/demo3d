#!/usr/bin/env node
/** Side-by-side at matched scale: reference vs the latest render. */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const shot = process.argv[2] || 'review/iterations/front.png';
const out = process.argv[3] || 'review/compare.png';
const refB64 = fs.readFileSync('assets/reference.png').toString('base64');
const shotB64 = fs.readFileSync(shot).toString('base64');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#0f1424;color:#fff;font-family:-apple-system,sans-serif}
.wrap{display:flex;gap:8px;padding:8px;align-items:flex-end}
figure{margin:0}
canvas{display:block;border-radius:10px}
figcaption{font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.75;padding:7px 2px}
</style></head><body><div class="wrap">
<figure><canvas id="a"></canvas><figcaption>reference</figcaption></figure>
<figure><canvas id="b"></canvas><figcaption>yuukapa · webgpu</figcaption></figure>
</div><script>
const REF="${refB64}",SHOT="${shotB64}";
const load=(s)=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src="data:image/png;base64,"+s;});
(async()=>{
  const ref=await load(REF), sh=await load(SHOT);
  const H=1000, SPAN=880;
  // reference: chin 400 -> feet 2008
  const rs=SPAN/(2008-400);
  const ca=document.getElementById('a'); ca.width=Math.round(ref.width*rs); ca.height=H+40;
  const ga=ca.getContext('2d');
  ga.fillStyle='#dceaf4'; ga.fillRect(0,0,ca.width,ca.height);
  ga.drawImage(ref,0,400,ref.width,1608, 0,0, ref.width*rs, SPAN);
  // render: chin 270 -> feet 1090
  const ss=SPAN/(1090-270);
  const cb=document.getElementById('b'); cb.width=Math.round(sh.width*ss); cb.height=H+40;
  const gb=cb.getContext('2d');
  gb.fillStyle='#dceaf4'; gb.fillRect(0,0,cb.width,cb.height);
  gb.drawImage(sh,0,0,sh.width,sh.height, (cb.width-sh.width*ss)/2, 0, sh.width*ss, sh.height*ss);
  window.__done=true;
})();
</script></body></html>`;

const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1400, height: 1100 } });
const page = await browser.newPage();
await page.setContent(html);
await page.waitForFunction(() => window.__done === true, { timeout: 20000 });
const box = await page.evaluate(() => { const r = document.querySelector('.wrap').getBoundingClientRect(); return { w: r.width, h: r.height }; });
await page.setViewport({ width: Math.ceil(box.w), height: Math.ceil(box.h) });
await page.screenshot({ path: out });
await browser.close();
console.log('wrote', out);
