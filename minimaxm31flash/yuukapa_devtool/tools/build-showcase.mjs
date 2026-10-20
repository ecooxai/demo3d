#!/usr/bin/env node
/**
 * Builds the showcase copy of the app into ./output/yuukapa_showcase/
 * with a prominent creator credit (big white type on black).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'output', 'yuukapa_showcase');

const MODEL = 'minimax-m3.1-flash';
const AGENT = 'opencode';
const TOOL = 'web · three.js r186 WebGPU/TSL';

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
copyDir(path.join(ROOT, 'src'), path.join(OUT, 'src'));
copyDir(path.join(ROOT, 'vendor'), path.join(OUT, 'vendor'));
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.copyFileSync(path.join(ROOT, 'assets', 'reference.png'), path.join(OUT, 'assets', 'reference.png'));

// inject the credit overlay into the showcase entry page
const idxPath = path.join(OUT, 'src', 'index.html');
let html = fs.readFileSync(idxPath, 'utf8');

const credit = `
<!-- showcase credit -->
<div id="creditBar" class="credit-bar">
  <div class="credit-inner">
    <span class="credit-model">${MODEL}</span>
    <span class="credit-sep">·</span>
    <span class="credit-agent">${AGENT}</span>
    <span class="credit-sep">·</span>
    <span class="credit-tool">${TOOL}</span>
  </div>
  <div class="credit-sub">Yuukapa — procedurally modelled anime character, 100&#37; generated from scratch</div>
</div>
<style>
.credit-bar{
  position:fixed;left:0;right:0;bottom:0;z-index:60;
  background:#000;color:#fff;text-align:center;
  padding:14px 18px 15px;
  font-family:"Inter","SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  box-shadow:0 -12px 40px rgba(0,0,0,.35);
}
.credit-inner{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}
.credit-model{font-size:clamp(22px,3.2vw,40px);font-weight:800;letter-spacing:.02em;color:#fff;line-height:1}
.credit-agent{font-size:clamp(20px,2.8vw,34px);font-weight:800;letter-spacing:.06em;color:#fff;line-height:1}
.credit-tool{font-size:clamp(13px,1.4vw,18px);font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#9fb4ff;line-height:1}
.credit-sep{font-size:clamp(16px,2vw,26px);color:#55607a;line-height:1}
.credit-sub{margin-top:7px;font-size:clamp(10px,1.05vw,13px);letter-spacing:.1em;text-transform:uppercase;color:#8d94a8}
@media (max-width:640px){.credit-sep{display:none}.credit-inner{gap:8px}}
</style>
`;

html = html.replace('</body>', credit + '\n</body>');
fs.writeFileSync(idxPath, html);

// a tiny README for the showcase bundle
fs.writeFileSync(path.join(OUT, 'README.md'), `# Yuukapa — showcase build

Created by **${MODEL}** with the **${AGENT}** agent (${TOOL}).

Open \`src/index.html\` through a local web server (ES modules need http://):

\`\`\`bash
npx serve .        # or: python3 -m http.server
\`\`\`

The viewer supports a WebGPU backend with an explicit WebGL 2 fallback,
a resolution switcher (900x1200 default up to 4K), free orbit, and capture.
`);

console.log('[showcase] built', path.relative(ROOT, OUT));
