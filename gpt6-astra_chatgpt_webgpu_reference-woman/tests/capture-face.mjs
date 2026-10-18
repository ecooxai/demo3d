import {chromium} from 'playwright';import path from 'node:path';import fs from 'node:fs/promises';
await fs.mkdir('output/qa',{recursive:true});
const browser=await chromium.launch({executablePath:path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless:true,args:['--enable-unsafe-webgpu','--use-angle=metal','--disable-background-networking']});
const page=await browser.newPage({viewport:{width:900,height:1200},deviceScaleFactor:1});page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log(m.type(),m.text().slice(0,600));});page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
await page.goto('http://127.0.0.1:8766/face-check.html');await page.waitForFunction(()=>window.faceTest?.ready,{timeout:60000});
await page.screenshot({path:'output/qa/face-front.png'});
await page.evaluate(()=>window.faceTest.view(5.8,3.0));await page.screenshot({path:'output/qa/face-profile.png'});
console.log(JSON.stringify(await page.evaluate(()=>({backend:window.faceTest.renderer.backend.constructor.name,triangles:window.faceTest.renderer.info.render.triangles,drawCalls:window.faceTest.renderer.info.render.calls}))));
await browser.close();
