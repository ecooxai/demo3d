#!/usr/bin/env node
/** Renders the creator credit strip used by the showcase video. */
import puppeteer from 'puppeteer-core';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const out = process.argv[2] || 'output/credit.png';
const W = Number(process.argv[3] || 1280);
const H = Number(process.argv[4] || 96);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:#000;width:${W}px;height:${H}px;overflow:hidden}
.bar{display:flex;align-items:center;justify-content:center;gap:16px;height:${H}px;
  font-family:"Inter","SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.m{font-size:${Math.round(H * 0.42)}px;font-weight:800;color:#fff;letter-spacing:.02em}
.a{font-size:${Math.round(H * 0.38)}px;font-weight:800;color:#fff;letter-spacing:.06em}
.t{font-size:${Math.round(H * 0.20)}px;font-weight:700;color:#9fb4ff;letter-spacing:.16em;text-transform:uppercase}
.s{font-size:${Math.round(H * 0.32)}px;color:#55607a}
</style></head><body><div class="bar">
<span class="m">minimax-m3.1-flash</span><span class="s">·</span>
<span class="a">opencode</span><span class="s">·</span>
<span class="t">web · three.js r186 webgpu/tsl</span>
</div></body></html>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'], defaultViewport: { width: W, height: H } });
const page = await browser.newPage();
await page.setContent(html);
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: out });
await browser.close();
console.log('[credit] wrote', out);
