import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

// Diagnostic134: isolate live corneal reflection and refraction from the
// catchlights already present in image1's registered eye colors. No maps,
// geometry, iris or sclera settings are modified. Modes1/2 are studies only.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const source = await readFile(path.join(root, 'src/main.js'), 'utf8');
if (!source.includes('mouthCrease130.visible=false;state.mouthCrease130={hidden:true}')
  || !source.includes('renderer.toneMapping=THREE.NeutralToneMapping;renderer.toneMappingExposure=1.4;')) {
  throw new Error('134 expects the accepted130 display and hidden mouth tube.');
}
const reports = [], digest = data => createHash('sha256').update(data).digest('hex');
const browser = await chromium.launch({ executablePath: path.resolve('../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
  headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal'] });
try {
  for (const mode of [0, 1, 2]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 1600)); });
    try {
      await page.goto('http://127.0.0.1:8766/?backend=webgpu', { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.portrait?.ready, null, { timeout: 60000 });
      const setup = await page.evaluate(async mode => {
        const p = window.portrait, corneas = [], irises = [], fakeGlints = [];
        p.model.updateWorldMatrix(true, true); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        p.model.traverse(o => {
          if (o.name === 'transparent-corneal-dome') corneas.push(o);
          if (o.name === 'brown-iris-and-pupil') irises.push(o);
          if (o.name === 'corneal-softbox-reflection') fakeGlints.push(o);
        });
        if (corneas.length !== 2 || irises.length !== 2 || fakeGlints.length !== 4 || fakeGlints.some(o => o.visible)) throw new Error('134 requires exactly two physical corneas and the four accepted hidden fake glints.');
        if (p.renderer.backend.isWebGPUBackend !== true || p.renderer.toneMapping !== 7 || p.renderer.toneMappingExposure !== 1.4
          || p.state.width !== 900 || p.state.height !== 1200 || p.state.antialiasing !== 2) throw new Error('134 requires current native WebGPU900x1200/AA2/Neutral1.4.');
        const records = corneas.map(o => ({ o, geometry: o.geometry, material: o.material, visible: o.visible,
          specularIntensity: o.material.specularIntensity, envMapIntensity: o.material.envMapIntensity,
          transmission: o.material.transmission, roughness: o.material.roughness, ior: o.material.ior,
          thickness: o.material.thickness, maps: Object.fromEntries(Object.entries(o.material).filter(([, v]) => v?.isTexture)) }));
        const attributes = [];
        for (const o of [...corneas, ...irises]) for (const [name, a] of [...Object.entries(o.geometry.attributes), ['index', o.geometry.index]]) if (a) {
          const bytes = new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength);
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
          attributes.push({ mesh: o, name, attribute: a, array: a.array, hash });
        }
        const center = p.model.position.clone().set(0, 0, 0);
        for (const iris of irises) { const a = iris.geometry.getAttribute('position'); center.add(iris.localToWorld(center.clone().set(a.getX(0), a.getY(0), a.getZ(0)))); }
        center.multiplyScalar(.5);
        window.cornea134 = { records, attributes, center, mode, initialLighting: p.state.lighting };
        for (const r of records) {
          if (mode === 1) { r.o.material.specularIntensity = 0; r.o.material.envMapIntensity = 0; }
          if (mode === 2) r.o.visible = false;
        }
        p.setScore(134, 77);
        return { mode, nativeWebGPU: true, display: { mapping: 7, exposure: 1.4 }, resolution: [900, 1200], antialiasing: 2,
          initialCorneas: records.map(r => ({ specularIntensity: r.specularIntensity, envMapIntensity: r.envMapIntensity,
            transmission: r.transmission, roughness: r.roughness, ior: r.ior, thickness: r.thickness })),
          eyeCenter: center.toArray(), geometryAndMapsChanged: false };
      }, mode);
      const captures = [], hashes = {};
      for (const view of ['front', 'detail', 'left', 'right', 'back', 'eye-detail', 'relit-detail']) {
        await page.evaluate(async view => {
          const p = window.portrait;
          if (view === 'relit-detail') { p.setLighting('sculpture'); p.setView('detail'); }
          else if (view === 'eye-detail') {
            p.setView('detail'); const c = window.cornea134.center, span = 1.6, aspect = p.state.width / p.state.height;
            p.camera.left = -span * aspect / 2; p.camera.right = span * aspect / 2; p.camera.top = span / 2; p.camera.bottom = -span / 2;
            p.camera.zoom = 1; p.camera.up.set(0, 1, 0); p.camera.position.copy(c).add(p.model.position.clone().set(0, 0, 8));
            p.controls.target.copy(c); p.camera.lookAt(c); p.camera.updateProjectionMatrix(); p.controls.update();
          } else p.setView(view);
          p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        }, view);
        await page.waitForTimeout(160);
        const file = `cornea134-${mode}-${view}.png`, bytes = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, file) });
        captures.push('output/qa/' + file); hashes[view] = digest(bytes);
      }
      const check = await page.evaluate(async () => {
        const p = window.portrait, s = window.cornea134;
        for (const a of s.attributes) {
          if ((a.name === 'index' ? a.mesh.geometry.index : a.mesh.geometry.getAttribute(a.name)) !== a.attribute || a.attribute.array !== a.array) throw new Error('134 changed an original eye attribute reference.');
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength))), b => b.toString(16).padStart(2, '0')).join('');
          if (hash !== a.hash) throw new Error('134 changed original eye geometry bytes.');
        }
        for (const r of s.records) {
          if (r.o.geometry !== r.geometry || r.o.material !== r.material || r.material.transmission !== r.transmission
            || r.material.roughness !== r.roughness || r.material.ior !== r.ior || r.material.thickness !== r.thickness
            || Object.entries(r.maps).some(([k, t]) => r.material[k] !== t)) throw new Error('134 changed a protected cornea property.');
          r.o.visible = r.visible; r.material.specularIntensity = r.specularIntensity; r.material.envMapIntensity = r.envMapIntensity;
        }
        p.setLighting(s.initialLighting); p.setView('front'); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
        return { originalEyeAttributesExact: s.attributes.length, originalMapsAndProtectedPropertiesExact: true,
          originalCorneaPropertiesRestored: true, heapMiB: performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null };
      });
      await page.waitForTimeout(160);
      const restored = await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `cornea134-${mode}-restored-front.png`) });
      if (errors.length) throw new Error(errors.join('\n'));
      const report = { ...setup, ...check, captures, hashes, restoredFrontHash: digest(restored),
        restoredFrontMatchesBaseline: digest(restored) === (reports[0]?.hashes.front || hashes.front), errors };
      reports.push(report); await writeFile(path.join(qa, 'cornea-optics134-native.json'), JSON.stringify(reports, null, 2) + '\n');
      console.log(JSON.stringify({ ...setup, ...check, restoredFrontHash: report.restoredFrontHash, errors }));
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
