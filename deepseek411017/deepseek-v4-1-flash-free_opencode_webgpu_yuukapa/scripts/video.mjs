import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import puppeteer from 'puppeteer-core';

const FPS = Number(process.env.FPS ?? 20);
const TITLE_SECONDS = 3;
const ORBIT_SECONDS = Number(process.env.ORBIT_SECONDS ?? 54);
const CREDIT_SECONDS = 3;
const WIDTH = 900;
const HEIGHT = 1200;

const root = process.cwd();
const frameDir = path.resolve('output/video-frames');
const outDir = path.resolve('output');
fs.rmSync(frameDir, { recursive: true, force: true });
fs.mkdirSync(frameDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-angle=metal',
    '--hide-scrollbars',
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

let counter = 0;
const writeBuffer = (buffer) => {
  const name = `frame-${String(counter).padStart(5, '0')}.jpg`;
  fs.writeFileSync(path.join(frameDir, name), buffer);
  counter += 1;
};

async function makeCard(title, subtitle, detail) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${WIDTH}px;height:${HEIGHT}px;background:#000;
      font-family:"Helvetica Neue",Arial,sans-serif;overflow:hidden}
    .card{width:${WIDTH}px;height:${HEIGHT}px;display:flex;flex-direction:column;
      justify-content:center;align-items:center;text-align:center;position:relative}
    .glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,#1d2b4a 0%,#05070d 58%,#000 100%)}
    .inner{position:relative;z-index:2}
    h1{color:#fff;font-size:64px;line-height:1.06;letter-spacing:.04em;margin:0;font-weight:800}
    h2{color:#cfd8ea;font-size:26px;letter-spacing:.24em;margin:22px 0 0;font-weight:500}
    p{color:#7f8aa4;font-size:18px;letter-spacing:.3em;margin:34px 0 0}
  </style></head><body><div class="card">
    <div class="glow"></div>
    <div class="inner"><h1>${title}</h1><h2>${subtitle}</h2><p>${detail}</p></div>
  </div></body></html>`;
  const htmlPath = path.resolve('output', '.card.html');
  fs.writeFileSync(htmlPath, html);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
  const buffer = await page.screenshot({ type: 'jpeg', quality: 92 });
  fs.unlinkSync(htmlPath);
  return buffer;
}

const title = await makeCard('DEEPSEEK V4.1 FLASH FREE', 'OPENCODE', 'YUU-KAPA — PILLOWLIGHT REVERIE');
for (let i = 0; i < TITLE_SECONDS * FPS; i += 1) writeBuffer(title);
console.log(`title frames: ${counter}`);

// Live scene
await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/?backend=webgl&capture=1', { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction(() => document.body.dataset.ready === 'true', { timeout: 60000 });
await page.evaluate(() => {
  document.querySelector('#stage-loading')?.classList.add('is-hidden');
});
await new Promise((resolve) => setTimeout(resolve, 1200));

const orbitFrames = ORBIT_SECONDS * FPS;
const started = Date.now();
for (let i = 0; i < orbitFrames; i += 1) {
  const t = i / orbitFrames;
  const angle = 0.06 + t * Math.PI * 2;
  const radius = 19.6 - Math.sin(t * Math.PI) * 1.0;
  const height = 4.6 + Math.sin(t * Math.PI * 2) * 0.22;
  const data = await page.evaluate(({ angle, radius, height }) => {
    const api = window.__YUUKAPA__;
    const { camera, controls, renderer, scene, THREE } = api;
    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    camera.lookAt(new THREE.Vector3(0.08, 4.25, 0));
    controls.target.set(0.08, 4.25, 0);
    controls.update();
    renderer.render(scene, camera);
    return document.querySelector('#scene').toDataURL('image/jpeg', 0.92);
  }, { angle, radius, height });
  writeBuffer(Buffer.from(data.split(',')[1], 'base64'));
  if (i % 120 === 0) {
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`orbit ${i}/${orbitFrames} · ${elapsed}s`);
  }
}

const credit = await makeCard('DEEPSEEK V4.1 FLASH FREE', 'CREATED WITH OPENCODE', 'PROCEDURAL WEBGPU / WEBGL CHARACTER STUDY');
for (let i = 0; i < CREDIT_SECONDS * FPS; i += 1) writeBuffer(credit);
console.log(`total frames: ${counter}`);

await browser.close();

const output = path.join(outDir, 'yuukapa_deepseek-v4.1-flash-free_opencode_60s.mp4');
const ff = spawnSync('ffmpeg', [
  '-y',
  '-framerate', String(FPS),
  '-i', path.join(frameDir, 'frame-%05d.jpg'),
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-crf', '19',
  '-preset', 'medium',
  '-movflags', '+faststart',
  output,
], { stdio: 'inherit' });

if (ff.status !== 0) {
  console.error('ffmpeg failed');
  process.exit(1);
}
console.log(`wrote ${output}`);
