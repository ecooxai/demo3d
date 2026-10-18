import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const evidence = resolve(root, 'output/qa');
await mkdir(evidence, { recursive: true });
const base = process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/';
const chrome = process.env.CHROME_PATH || resolve(root, '../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1, acceptDownloads: true });
  const page = await context.newPage();
  const unexpectedErrors = [];
  page.on('pageerror', error => unexpectedErrors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.portrait?.ready, null, { timeout: 120000 });
  assert.equal(await page.evaluate(() => window.portrait.renderer.backend?.isWebGPUBackend), true, 'Default rendering must really use WebGPU');
  assert.deepEqual(await page.evaluate(() => [window.portrait.renderer.domElement.width,window.portrait.renderer.domElement.height]), [900,1200]);
  const initial = await page.evaluate(() => ({ frames: window.portrait.state.renderedFrames, meshes: window.portrait.model.children.length }));
  assert.equal(await page.evaluate(()=>Boolean(window.portrait.model.getObjectByName('anatomical-head')&&window.portrait.model.getObjectByName('original-neck-and-clavicle-transition')&&window.portrait.model.getObjectByName('original-tailored-white-cotton-blouse'))),true,'Head, neck and blouse must all be assembled');
  assert.deepEqual(await page.evaluate(()=>[window.portrait.state.internalRender.width,window.portrait.state.internalRender.height]),[1800,2400],'Smooth sampling should preserve a900x1200 output with higher internal detail');
  const pngSize=await page.evaluate(async()=>{const b=await window.portrait.capture({download:false});const i=await createImageBitmap(b);const size=[i.width,i.height];i.close();return size;});
  assert.deepEqual(pngSize,[900,1200],'PNG dimensions must follow the requested output resolution');
  await page.waitForTimeout(1600);
  const idleA = await page.evaluate(() => window.portrait.state.renderedFrames);
  await page.waitForTimeout(1000);
  const idleB = await page.evaluate(() => window.portrait.state.renderedFrames);
  assert.equal(idleA, idleB, 'Static portrait must stop submitting frames while idle');
  for (const view of ['front','left','right','back','detail']) {
    await page.evaluate(view => window.portrait.setView(view), view);
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => window.portrait.state.view), view);
    await page.locator('#viewport-wrap').screenshot({path:resolve(evidence,`gpt6-astra_chatgpt_webgpu-${view}.png`)});
  }
  await page.evaluate(() => window.portrait.setView('front'));
  await page.screenshot({ path: resolve(evidence,'gpt6-astra_chatgpt_webgpu-desktop.png'), fullPage: true });
  await page.evaluate(() => window.portrait.startTurntable(true));
  const before = await page.evaluate(() => window.portrait.camera.position.toArray());
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => window.portrait.camera.position.toArray());
  assert.notDeepEqual(before, after, 'Turntable must move the camera');
  await page.evaluate(() => { window.portrait.startTurntable(false); window.portrait.setView('front'); });

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#capture-button')]);
  assert.match(download.suggestedFilename(), /gpt6-astra_chatgpt_webgpu_portrait-front-showcase\.png/);
  await download.saveAs(resolve(evidence, download.suggestedFilename()));
  const glb = await page.evaluate(async () => {
    const blob=await window.portrait.exportGLB({download:false});
    const data=new Uint32Array(await blob.arrayBuffer(),0,3);
    return {bytes:blob.size,magic:data[0],version:data[1],declared:data[2]};
  });
  assert.equal(glb.magic,0x46546c67);assert.equal(glb.version,2);assert.equal(glb.bytes,glb.declared);

  await page.click('#settings-open');
  await page.selectOption('#resolution-select','1080');await page.selectOption('#orientation-select','landscape');
  await page.click('#apply-settings');
  assert.deepEqual(await page.evaluate(()=>[window.portrait.renderer.domElement.width,window.portrait.renderer.domElement.height]),[1440,1080]);
  await page.evaluate(()=>{window.portrait.setResolution(900,1200);window.portrait.setAntialiasing(1);window.portrait.renderNow();});
  assert.deepEqual(await page.evaluate(()=>[window.portrait.state.internalRender.width,window.portrait.state.internalRender.height]),[900,1200],'Native sampling must release the larger target');
  await page.evaluate(()=>{window.portrait.setAntialiasing(2);window.portrait.renderNow();});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,'Mobile layout must not scroll horizontally');
  await page.screenshot({path:resolve(evidence,'gpt6-astra_chatgpt_webgpu-mobile.png'),fullPage:true});
  assert.deepEqual(unexpectedErrors,[],'No uncaught browser errors are allowed');
  await context.close();

  const gatedContext=await browser.newContext({viewport:{width:900,height:1200}});
  await gatedContext.addInitScript(()=>Object.defineProperty(navigator,'gpu',{get:()=>undefined,configurable:true}));
  const gated=await gatedContext.newPage();await gated.goto(base,{waitUntil:'networkidle'});
  await gated.locator('#backend-gate').waitFor({state:'visible'});
  assert.equal(await gated.evaluate(()=>window.portrait.ready),false,'No WebGPU must block rather than silently select WebGL');
  assert.equal(await gated.locator('canvas').count(),0,'No fallback canvas should be created before user choice');
  await gated.click('#choose-webgl');
  await gated.waitForFunction(()=>window.portrait.ready,null,{timeout:120000});
  assert.equal(await gated.evaluate(()=>window.portrait.renderer.isWebGLRenderer),true,'Explicit user selection should enable WebGL');
  await gated.screenshot({path:resolve(evidence,'gpt6-astra_chatgpt_webgl-explicit.png'),fullPage:true});
  await gatedContext.close();
  console.log(JSON.stringify({ result:'passed', backend:'native WebGPU', views:5, idleFrames:idleB-idleA, glbBytes:glb.bytes, evidence:'output/qa/' },null,2));
} finally { await browser.close(); }
