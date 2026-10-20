import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const iteration = 'iteration-004';
const srcDir = path.resolve('output', iteration);
const outDir = path.resolve('output/showcase');
fs.mkdirSync(outDir, { recursive: true });

const shots = [
  ['render-front', 'FRONT'],
  ['render-left', 'LEFT'],
  ['render-back', 'BACK'],
  ['render-right', 'RIGHT'],
  ['ui-front', 'VIEWER UI'],
];

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars', '--allow-file-access-from-files'],
});

const page = await browser.newPage();

for (const [name, label] of shots) {
  const file = path.join(srcDir, `${name}.png`);
  if (!fs.existsSync(file)) {
    console.warn(`skip missing ${file}`);
    continue;
  }
  const data = fs.readFileSync(file).toString('base64');
  const wide = name === 'ui-front';
  const boardWidth = 1280;
  const html = `<!doctype html>
  <html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}
    html,body{margin:0;background:#000;font-family:"Helvetica Neue",Arial,sans-serif}
    .board{width:${boardWidth}px;background:#000}
    .art{width:100%;display:block;background:#000}
    .credit{padding:34px 48px 40px;background:#000;border-top:1px solid #232323}
    .model{color:#fff;font-size:54px;font-weight:700;letter-spacing:.055em;line-height:1.05}
    .agent{margin-top:12px;color:#d8d8d8;font-size:27px;font-weight:500;letter-spacing:.13em}
    .kind{float:right;color:#6f6f6f;font-size:20px;letter-spacing:.22em;margin-top:10px}
  </style></head>
  <body><div class="board">
    <img class="art" src="data:image/png;base64,${data}">
    <div class="credit">
      <span class="kind">${label}</span>
      <div class="model">DEEPSEEK V4.1 FLASH FREE</div>
      <div class="agent">AGENT · OPENCODE — WEBGPU / WEBGL</div>
    </div>
  </div></body></html>`;

  const htmlPath = path.join(outDir, `.${name}.html`);
  fs.writeFileSync(htmlPath, html);
  await page.setViewport({ width: boardWidth, height: 1200, deviceScaleFactor: 1 });
  await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
  await page.evaluate(() => new Promise((resolve) => {
    const img = document.querySelector('img');
    if (img.complete) resolve();
    else img.addEventListener('load', resolve, { once: true });
  }));
  const board = await page.$('.board');
  const suffix = wide ? 'ui' : label.toLowerCase().replace(/\s+/g, '-');
  const out = path.join(outDir, `yuukapa-${suffix}-showcase.png`);
  await board.screenshot({ path: out });
  fs.unlinkSync(htmlPath);
  console.log(`wrote ${out}`);
}

await browser.close();
