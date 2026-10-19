import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Continuation of139: two fresh physical spec0/clearcoat0 pages compare
// only upper-lip shadow receiving. The clone is first compiled with its
// receiver flag already selected. No cast-shadow flag or light is changed.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const main = await readFile(path.join(root, 'src/main.js'), 'utf8');
if (!main.includes('state.mouthContinuity130=applyMouthContinuity130(anatomicalHead,{strength:1});')
  || !main.includes('diagonalFringe133:1') || main.includes('applyLipEdgeMaterial135')) throw new Error('139 requires accepted133/full130 without135.');
const hash = data => createHash('sha256').update(data).digest('hex'), report = [];
const expectedRestored = JSON.parse(await readFile(path.join(root, 'review/lip-band139-native-result.json'), 'utf8'))[0].restoredHash;
const browser = await chromium.launch({ executablePath: path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'] });
try {
  for (const mode of [2, 4]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 1600)); });
    try {
      await page.goto('http://127.0.0.1:8766/?backend=webgpu', { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.portrait?.ready, null, { timeout: 60000 });
      const setup = await page.evaluate(async mode => {
        const p = window.portrait;
        if (!p.renderer.backend.isWebGPUBackend || p.renderer.toneMapping !== 7 || p.renderer.toneMappingExposure !== 1.4
          || p.state.antialiasing !== 2 || p.state.width !== 900 || p.state.height !== 1200
          || p.state.mouthContinuity130?.strength !== 1) throw new Error('139 requires native WebGPU900x1200 AA2 Neutral1.4 full130.');
        const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
        const bufferHash = a => digest(new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength));
        const imageHash = texture => {
          const image = texture.image;
          if (image.data) return digest(new Uint8Array(image.data.buffer, image.data.byteOffset, image.data.byteLength));
          if (image.getContext) return digest(image.getContext('2d').getImageData(0, 0, image.width, image.height).data);
          throw new Error('139 unexpected bound map image.');
        };
        const lips = ['upper-lip', 'lower-lip'].map(n => p.model.getObjectByName(n));
        const template = p.model.getObjectByName('corneal-softbox-reflection');
        if (lips.some(o => !o?.isMesh || !o.material.isMeshPhysicalMaterial) || !template?.material.isMeshBasicMaterial || template.visible) throw new Error('139 missing original lips or hidden Basic template.');
        const records = [], maps = [], center = p.model.position.clone().set(0, 0, 0);
        p.model.updateWorldMatrix(true, true);
        for (const mesh of lips) {
          const original = mesh.material, geometry = mesh.geometry, attributes = [], sourceReceiver = mesh.receiveShadow;
          if (original.roughness !== .44 || original.specularIntensity !== .23 || original.clearcoat !== .12 || original.clearcoatRoughness !== .30) throw new Error('139 unexpected accepted lip material.');
          for (const [name, a] of [...Object.entries(geometry.attributes), ['index', geometry.index]]) if (a) attributes.push({ name, a, array: a.array, hash: await bufferHash(a) });
          for (const [, t] of Object.entries(original)) if (t?.isTexture && !maps.some(r => r.texture === t)) maps.push({ texture: t, image: t.image, hash: await imageHash(t) });
          geometry.computeBoundingBox(); const c = geometry.boundingBox.getCenter(center.clone().set(0, 0, 0)); center.add(mesh.localToWorld(c));
          const sourceScalars = Object.fromEntries(['roughness', 'metalness', 'clearcoat', 'clearcoatRoughness', 'specularIntensity', 'envMapIntensity', 'opacity', 'transparent', 'side', 'depthWrite', 'depthTest', 'toneMapped', 'vertexColors'].map(k => [k, original[k]]));
          const sourceMaps = Object.fromEntries(Object.entries(original).filter(([, t]) => t?.isTexture));
          let active = original;
          if (mode === 1 || mode === 2 || mode === 4) {
            active = original.clone(); active.clearcoat = 0;
            if (mode === 2 || mode === 4) active.specularIntensity = 0;
          } else if (mode === 3) {
            active = template.material.clone();
            for (const k of ['opacity', 'transparent', 'side', 'depthWrite', 'depthTest', 'depthFunc', 'toneMapped', 'vertexColors', 'fog', 'alphaTest', 'alphaToCoverage', 'premultipliedAlpha', 'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits']) active[k] = original[k];
            active.color.copy(original.color); active.map = original.map; active.alphaMap = original.alphaMap;
            active.envMap = null; active.lightMap = null; active.aoMap = null; active.reflectivity = 0;
          }
          if (mode === 4 && mesh.name === 'upper-lip') mesh.receiveShadow = false;
          if (active !== original) { active.name = 'Lip139 diagnostic mode ' + mode + ' / ' + mesh.name; active.needsUpdate = true; mesh.material = active; }
          records.push({ mesh, geometry, original, active, attributes, sourceScalars, sourceMaps, sourceReceiver, color: original.color.toArray() });
        }
        center.multiplyScalar(.5);
        window.lipBand139 = { records, maps, center, bufferHash, imageHash, mode };
        p.setScore(139, 77);
        return { iteration: 139, mode, nativeWebGPU: true, resolution: [900, 1200], antialiasing: 2, toneMapping: 7, exposure: 1.4,
          geometryStrength: p.state.mouthContinuity130.strength, center: center.toArray(), privateMaterialCount: mode ? 2 : 0,
          receivers: records.map(r => ({mesh:r.mesh.name, original:r.sourceReceiver, active:r.mesh.receiveShadow})),
          originalMaterials: records.map(r => ({ name: r.mesh.name, ...r.sourceScalars, color: r.color, map: r.original.map.name })),
          boundMaps: maps.map(r => ({ name: r.texture.name, size: [r.image.width, r.image.height], hash: r.hash })) };
      }, mode);
      const captures = [], hashes = {};
      for (const view of ['lip']) {
        await page.evaluate(async view => {
          const p = window.portrait; p.setView('detail');
          if (view !== 'detail') {
            const c = window.lipBand139.center, span = 1.45, aspect = p.state.width / p.state.height;
            p.camera.left = -span * aspect / 2; p.camera.right = span * aspect / 2; p.camera.top = span / 2; p.camera.bottom = -span / 2;
            p.camera.zoom = 1; p.camera.up.set(0, 1, 0); p.camera.position.copy(c).add(p.model.position.clone().set(view === 'lip-quarter' ? 2.3 : 0, 0, 8));
            p.controls.target.copy(c); p.camera.lookAt(c); p.camera.updateProjectionMatrix(); p.controls.update();
          }
          p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        }, view);
        await page.waitForTimeout(160);
        const file = 'lip-shadow139-' + mode + '-' + view + '.png';
        const bytes = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, file) });
        captures.push('output/qa/' + file); hashes[view] = hash(bytes);
      }
      const check = await page.evaluate(async () => {
        const p = window.portrait, s = window.lipBand139; let exactAttributes = 0, disposedMaterials = 0;
        for (const r of s.records) {
          const expectedReceiver = s.mode === 4 && r.mesh.name === 'upper-lip' ? false : r.sourceReceiver;
          if (r.mesh.receiveShadow !== expectedReceiver) throw new Error('139 shadow receiver mismatch');
          if (r.mesh.geometry !== r.geometry || r.mesh.material !== r.active || Object.entries(r.sourceScalars).some(([k, v]) => r.original[k] !== v)
            || r.original.color.toArray().some((x, i) => x !== r.color[i]) || Object.entries(r.sourceMaps).some(([k, t]) => r.original[k] !== t)) throw new Error('139 changed original geometry/material settings.');
          for (const a of r.attributes) {
            if ((a.name === 'index' ? r.geometry.index : r.geometry.getAttribute(a.name)) !== a.a || a.a.array !== a.array || await s.bufferHash(a.a) !== a.hash) throw new Error('139 changed original lip bytes or attribute references.');
            exactAttributes++;
          }
          r.mesh.receiveShadow = r.sourceReceiver; r.mesh.material = r.original;
        }
        for (const m of s.maps) if (m.texture.image !== m.image || await s.imageHash(m.texture) !== m.hash) throw new Error('139 changed original texture pixels.');
        p.setView('detail'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        for (const r of s.records) if (r.active !== r.original) { r.active.dispose(); disposedMaterials++; }
        return { exactAttributes, exactMaps: s.maps.length, sourceMaterialsRestored: true, disposedMaterials,
          heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
      });
      await page.waitForTimeout(160);
      const restored = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, 'lip-shadow139-' + mode + '-restored-detail.png') });
      const restoredHash = hash(restored), restoredMatchesBaseline = restoredHash === expectedRestored;
      if (errors.length || !restoredMatchesBaseline) throw new Error('139 diagnostic failed: ' + JSON.stringify({ errors, restoredMatchesBaseline }));
      const result = { ...setup, ...check, captures, hashes, restoredHash, restoredMatchesBaseline, errors };
      report.push(result); await writeFile(path.join(qa, 'lip-shadow139-native-result.json'), JSON.stringify(report, null, 2) + '\n');
      console.log(JSON.stringify({ iteration: 139, mode, nativeWebGPU: setup.nativeWebGPU, ...check, restoredMatchesBaseline, errors }));
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
