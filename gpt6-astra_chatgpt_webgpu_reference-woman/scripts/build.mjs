import { build } from 'esbuild';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'output');
await mkdir(output, { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ['src/main.js'],
  outfile: 'output/app.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  sourcemap: false,
  legalComments: 'eof',
  metafile: true,
}).then(async result => {
  const inputs = Object.keys(result.metafile.inputs);
  await writeFile(resolve(output, 'build-info.json'), JSON.stringify({
    project: 'GPT-6 Astra / ChatGPT / WebGPU / Reference Woman',
    built: new Date().toISOString(),
    sourceModules: inputs.filter(name => name.startsWith('src/')),
    bundledDependencies: ['three'],
    externalAssets: [],
    defaultBackend: 'WebGPU',
    backendFallback: 'User selection only',
    defaultResolution: [900, 1200],
    outputBytes: result.metafile.outputs['output/app.js']?.bytes,
  }, null, 2));
});
await copyFile(resolve(root, 'index.html'), resolve(output, 'index.html'));
await copyFile(resolve(root, 'src/style.css'), resolve(output, 'style.css'));
const license = await readFile(resolve(root, 'node_modules/three/LICENSE'), 'utf8');
await writeFile(resolve(output, 'THIRD-PARTY-NOTICES.txt'), `This viewer uses Three.js as a rendering library. All portrait geometry, procedural textures, environment, and interface are original to this project.\n\nThree.js\n${license}`);
console.log('Built offline viewer in output/ (app.js, index.html, style.css).');
