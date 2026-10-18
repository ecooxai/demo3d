import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = await readFile(resolve(root, 'output/index.html'), 'utf8');
const css = await readFile(resolve(root, 'output/style.css'), 'utf8');
const bundle = await stat(resolve(root, 'output/app.js'));

assert.match(html, /GPT-6 Astra/);
assert.equal((html.match(/id="[^\"]+"/g)||[]).length, new Set(html.match(/id="[^\"]+"/g)||[]).size, 'UI IDs must be unique');
assert.ok(bundle.size > 100000 && bundle.size < 12000000, 'Viewer bundle should include Three.js and stay bounded');
assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\//, 'Viewer must have no external asset dependencies');
assert.doesNotMatch(css, /@import\s+url\(['"]?https?:/,'Styles must not fetch an external font or asset');
assert.match(html, /id="backend-gate"/,'Compatibility choice must be visible when WebGPU is unavailable');
assert.match(html, /id="choose-webgl"/,'User must be able to choose WebGL explicitly');
assert.match(css, /\[hidden\]\{display:none!important\}/,'Hidden renderer and settings overlays must not obscure the portrait');
console.log('Static viewer contract passed: local bundle, unique controls, accessible backend choice.');
