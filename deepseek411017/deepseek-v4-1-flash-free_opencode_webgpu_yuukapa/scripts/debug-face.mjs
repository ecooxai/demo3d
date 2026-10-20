import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox','--enable-webgl','--ignore-gpu-blocklist','--use-angle=metal']});
const page = await browser.newPage();
await page.setViewport({width:1000,height:1300});
await page.goto('http://127.0.0.1:4173/?backend=webgl&capture=1',{waitUntil:'networkidle0'});
await page.waitForFunction(()=>document.body.dataset.ready==='true');
await new Promise(r=>setTimeout(r,800));
const data = await page.evaluate(() => {
  let found = null;
  window.__YUUKAPA__.character.root.traverse((o) => {
    if (o.isMesh && o.material?.map?.image?.width === 1024 && o.material.map.image.height === 640) found = o.material.map.image;
  });
  if (!found) return null;
  const c = document.createElement('canvas'); c.width=1024; c.height=640;
  const ctx = c.getContext('2d');
  ctx.fillStyle='#f8d9d4'; ctx.fillRect(0,0,1024,640);
  ctx.drawImage(found,0,0);
  return c.toDataURL('image/png');
});
if (data) fs.writeFileSync('output/iteration-001/face-texture.png', Buffer.from(data.split(',')[1],'base64'));
const close = await page.evaluate(() => {
  window.__YUUKAPA__.camera.position.set(0.3,7.0,8.5);
  window.__YUUKAPA__.controls.target.set(0,6.95,0.3);
  window.__YUUKAPA__.controls.update();
  return true;
});
await new Promise(r=>setTimeout(r,500));
const img = await page.evaluate(()=>document.querySelector('#scene').toDataURL('image/png'));
fs.writeFileSync('output/iteration-001/face-closeup.png', Buffer.from(img.split(',')[1],'base64'));
console.log(JSON.stringify({found:!!data,close}));
await browser.close();
