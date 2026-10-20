#!/usr/bin/env node
/**
 * Records a 60 second showcase clip of the live app using MediaRecorder
 * inside headless Chrome, then muxes it to mp4 with ffmpeg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'output');
const DL = path.join(OUT, '_dl');
const SECONDS = Number(process.argv[2] || 60);
const W = Number(process.argv[3] || 1280);
const H = Number(process.argv[4] || 1600);
const BACKEND = process.argv[5] || 'webgpu';
const PAGE = process.argv[6] || '/';

fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(DL, { recursive: true, force: true });
fs.mkdirSync(DL, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--no-sandbox', '--enable-unsafe-webgpu', '--enable-features=Vulkan,WebGPU',
    '--use-angle=metal', '--ignore-gpu-blocklist', '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required',
  ],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 200)); });

const client = await page.createCDPSession();
await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });

await page.goto(`http://localhost:8123${PAGE}?backend=${BACKEND}&res=${W}x${H}&cine=1&hud=0`,
  { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForFunction(() => window.__yuukapa?.ready === true, { timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

console.log(`[video] recording ${SECONDS}s at ${W}x${H} on ${BACKEND}…`);

await page.evaluate(async (seconds) => {
  const app = window.__yuukapa.app;
  const stream = app.canvas.captureStream(30);
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((m) => MediaRecorder.isTypeSupported(m));
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 16e6 });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise((res) => { rec.onstop = res; });
  rec.start(500);
  window.__rec = rec;
  await new Promise((r) => setTimeout(r, seconds * 1000));
  rec.stop();
  await done;
  const blob = new Blob(chunks, { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'yuukapa_showcase.webm';
  document.body.appendChild(a);
  a.click();
}, SECONDS);

// wait for the download to land
const t0 = Date.now();
let file = null;
while (Date.now() - t0 < 30000) {
  const files = fs.readdirSync(DL).filter((f) => f.endsWith('.webm'));
  if (files.length) { file = path.join(DL, files[0]); break; }
  await new Promise((r) => setTimeout(r, 500));
}
if (!file) { console.error('[video] no recording produced'); await browser.close(); process.exit(1); }

const raw = path.join(OUT, 'yuukapa_minimax-m31-flash_opencode_showcase.webm');
fs.copyFileSync(file, raw);
console.log('[video] raw clip →', path.relative(ROOT, raw), (fs.statSync(raw).size / 1e6).toFixed(2), 'MB');

await browser.close();

// transcode to a widely playable mp4
const mp4 = path.join(OUT, 'yuukapa_minimax-m31-flash_opencode_showcase.mp4');
try {
  const { execFileSync } = await import('node:child_process');
  execFileSync('ffmpeg', ['-y', '-i', raw, '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', mp4],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  console.log('[video] mp4 →', path.relative(ROOT, mp4), (fs.statSync(mp4).size / 1e6).toFixed(2), 'MB');
} catch (e) {
  console.warn('[video] ffmpeg transcode failed:', e.message);
}
fs.rmSync(DL, { recursive: true, force: true });
