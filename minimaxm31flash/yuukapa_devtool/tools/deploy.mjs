#!/usr/bin/env node
/**
 * Assembles the deployable site and publishes it to surge.sh.
 *
 * The published tree keeps every URL that has ever been referenced working:
 *   /                                   landing page
 *   /src/index.html                    the viewer
 *   /yuukapa_showcase/src/index.html   the credited showcase copy
 *   /yuukapa_..._showcase.mp4          the 60 s clip (full quality)
 *   /yuukapa_..._showcase_web.mp4      the 60 s clip (web-optimised)
 *   /credit.png                        the creator credit strip
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'output');
const DOMAIN = process.argv[2] || 'yuukapa-minimax-m31-flash.surge.sh';
const SITE = process.argv[3] || '/tmp/yuukapa-site';

const FULL_MP4 = 'yuukapa_minimax-m31-flash_opencode_showcase.mp4';
const WEB_MP4 = 'yuukapa_minimax-m31-flash_opencode_showcase_web.mp4';

fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });

const copyTree = (from, to) => {
  const st = fs.statSync(from);
  if (st.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from)) copyTree(path.join(from, e), path.join(to, e));
  } else {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
};

const cp = (from, to) => copyTree(path.join(ROOT, from), path.join(SITE, to));

// landing page
cp('output/site/index.html', 'index.html');
// the viewer (self-contained showcase bundle)
cp('output/yuukapa_showcase/src', 'src');
// an alias copy under the original showcase folder name
cp('output/yuukapa_showcase', 'yuukapa_showcase');
// the clips, under both names
cp(`output/${FULL_MP4}`, FULL_MP4);
if (fs.existsSync(path.join(OUT, WEB_MP4))) cp(`output/${WEB_MP4}`, WEB_MP4);
cp('output/credit.png', 'credit.png');
// the reference image, for provenance
cp('assets/reference.png', 'assets/reference.png');

console.log('[deploy] site tree:');
const walk = (d, prefix = '') => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(d, e.name), prefix + e.name + '/');
    else console.log(`  ${prefix}${e.name}`);
  }
};
walk(SITE);

console.log(`[deploy] publishing to https://${DOMAIN}/`);
execFileSync('npx', ['--yes', 'surge@0.46.0', './', '--domain', DOMAIN], {
  cwd: SITE,
  stdio: ['ignore', 'ignore', 'pipe'],
  env: { ...process.env, SURGE_LOGLEVEL: 'info' },
});
console.log('[deploy] done');
