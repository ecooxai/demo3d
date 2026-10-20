#!/usr/bin/env node
/** Links the vendored three.js build into node_modules so the tools can import it. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const dir = path.join(ROOT, 'node_modules', 'three');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
  name: 'three', version: '0.186.1', type: 'module',
  main: './three.webgpu.js',
  exports: { '.': './three.webgpu.js', './tsl': './three.tsl.js', './webgpu': './three.webgpu.js', './addons/*': './addons/*' },
}, null, 2));
for (const f of ['three.webgpu.js', 'three.core.js', 'three.tsl.js']) {
  const link = path.join(dir, f);
  if (fs.existsSync(link) || fs.lstatSync(link, { throwIfNoEntry: false })) { try { fs.unlinkSync(link); } catch (e) { /* ignore */ } }
  fs.symlinkSync(path.join(ROOT, 'vendor', 'three', f), link);
}
const addons = path.join(dir, 'addons');
try { fs.unlinkSync(addons); } catch (e) { /* ignore */ }
fs.symlinkSync(path.join(ROOT, 'vendor', 'three', 'addons'), addons);
console.log('[link-three] node_modules/three → vendor/three');
