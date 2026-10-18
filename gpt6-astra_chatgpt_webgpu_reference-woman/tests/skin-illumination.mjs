import { chromium } from 'playwright';
import path from 'node:path';
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1350},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('ERROR',e.message));
 await page.goto('http://127.0.0.1:8766/?hair=coverage',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.portrait?.ready);
 const digest=()=>page.evaluate(async()=>{const face=window.portrait.headPivot.getObjectByName('continuous-face'),canvas=face.material[0].map.image,data=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;const hash=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');});
 await page.evaluate(()=>window.portrait.applySkinCompensation(0));
 const original=await digest();
 for(const strength of [0,.35,.7]) {
  const metrics=await page.evaluate(strength=>{const p=window.portrait;const m=p.applySkinCompensation(strength);p.setView('detail');p.renderNow();return m;},strength);
  await page.waitForTimeout(300);await page.locator('#viewport-wrap').screenshot({path:`output/qa/skin-compensation-${Math.round(strength*100)}.png`});
  console.log(JSON.stringify(metrics));
 }
 await page.evaluate(()=>window.portrait.applySkinCompensation(0));
 const restored=await digest();console.log(JSON.stringify({restoreExact:original===restored,original,restored}));
 if(original!==restored)throw new Error('Skin calibration failed exact restore');
} finally { await browser.close(); }
