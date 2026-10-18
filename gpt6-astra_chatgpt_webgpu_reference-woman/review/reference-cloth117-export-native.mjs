import { chromium } from 'playwright';
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// One focused roundtrip of the selected 117 torso. Every preview uses the
// production offscreen render/resolve path; never compile at the screen target.
const root = path.resolve(import.meta.dirname, '..'), qa = path.join(root, 'output/qa');
await mkdir(qa, { recursive: true });
const source = await readFile(path.join(root, 'src/main.js'), 'utf8');
const marker = 'state.balance=applyPortraitBalance(model,{shiftX:-.24});';
const imports = [...source.matchAll(/^\s*import\s*\{[^}]*\bapplyReferenceCloth117\b[^}]*\}\s*from\s*['"][^'"]+['"]/gm)];
const calls = [...source.matchAll(/\bapplyReferenceCloth117\s*\(/g)];
let clothImport = '', instrumented = source, stateField = 'referenceCloth117';
if (!imports.length && !calls.length) {
  if (source.split(marker).length !== 2) throw new Error('Expected the unique accepted pre-balance cloth registration marker.');
  const ear = source.search(/\bapplyReferenceEarColor\s*\(/);
  if (ear < 0 || ear > source.indexOf(marker)) throw new Error('The selected cloth registration must follow the accepted ear preparation.');
  clothImport = "import {applyReferenceCloth117} from '../review/reference-cloth-candidate117.js';\n";
  instrumented = source.replace(marker, 'state.referenceCloth117=await applyReferenceCloth117(anatomicalBlouse,{strength:.5});\n      ' + marker);
} else if (imports.length === 1 && calls.length === 1) {
  const assignment = source.match(/\bstate\.(\w+)\s*=\s*await\s+applyReferenceCloth117\s*\(/);
  const ear = source.search(/\bapplyReferenceEarColor\s*\(/), balance = source.search(/\bapplyPortraitBalance\s*\(/);
  if (!assignment || ear < 0 || !(ear < calls[0].index && calls[0].index < balance)) throw new Error('The integrated cloth bake must be assigned to state after ear registration and before balance.');
  stateField = assignment[1];
} else throw new Error('Candidate 117 must have exactly one import/application, or neither.');
const entry = clothImport + "import {GLTFLoader as GLTFLoader117} from 'three/addons/loaders/GLTFLoader.js';\nimport {createPortraitExport as createPortraitExport117} from './export-portrait.js';\n" + instrumented +
  `\nwindow.exportCloth117={THREE,GLTFLoader:GLTFLoader117,createPortraitExport:createPortraitExport117,exportPortraitGLB,stateField:${JSON.stringify(stateField)}};\n`;
const bundle = path.join(qa, 'app-reference-cloth117-export.js');
await build({ stdin: { contents: entry, resolveDir: path.join(root, 'src'), sourcefile: 'main-reference-cloth117-export.js', loader: 'js' },
  bundle: true, format: 'iife', target: ['es2022'], minify: true, loader: { '.jpg': 'dataurl' }, outfile: bundle, logLevel: 'silent' });

async function installCloth117Audit() {
  const p = window.portrait, api = window.exportCloth117, T = api.THREE;
  const demand = (ok, message) => { if (!ok) throw new Error(message); };
  const same = (a, b, message) => demand(JSON.stringify(a) === JSON.stringify(b), message);
  const fingerprint = async array => {
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  };
  const torso = p.model.getObjectByName('blouse-continuous-torso-and-sleeves'), mat = torso?.material, geo = torso?.geometry;
  const bake = p.state[api.stateField];
  demand(torso?.isMesh && !Array.isArray(mat) && bake?.strength === .5, 'Expected the selected half-strength 117 torso.');
  demand(mat.map?.isDataTexture && mat.map.image.width === 1024 && mat.map.image.height === 1024, 'Expected the revised 1024-square cloth atlas.');
  same(mat.color.toArray(), [1, 1, 1], 'Run against the revised complete-base-color atlas with a legal white material factor.');
  demand(mat.bumpMap?.isDataTexture && mat.bumpScale > 0, 'Expected the accepted procedural cotton weave bump.');
  const report = { candidate: 117, scoreUnchanged: 76, strength: .5, scope: 'Selected torso only, serialized through the production exporter at its exact source world transform',
    bake, sourceChecks: [], visual: [], temporaryPreparation: null, roundtrip: null, cleanup: null };
  api.report = report;
  const objects = [], attributes = new Map(), textures = new Map();
  p.model.traverse(object => {
    objects.push({ object, geometry: object.geometry, material: object.material, children: object.children.slice() });
    if (object.geometry) for (const [key, attribute] of Object.entries({ ...object.geometry.attributes, index: object.geometry.index })) if (attribute) {
      if (!attributes.has(attribute)) attributes.set(attribute, { object, geometry: object.geometry, key, array: attribute.array, version: attribute.version,
        samples: [0, Math.floor(attribute.array.length / 3), Math.floor(attribute.array.length * 2 / 3), attribute.array.length - 1].map(i => [i, attribute.array[i]]) });
    }
  });
  const textureMetadata = texture => ({ channel: texture.channel, colorSpace: texture.colorSpace, flipY: texture.flipY,
    wrapS: texture.wrapS, wrapT: texture.wrapT, minFilter: texture.minFilter, magFilter: texture.magFilter, anisotropy: texture.anisotropy,
    offset: texture.offset.toArray(), repeat: texture.repeat.toArray(), center: texture.center.toArray(), rotation: texture.rotation, matrix: texture.matrix.toArray() });
  for (const [slot, texture] of Object.entries(mat)) if (texture?.isTexture) textures.set(texture, { slot, source: texture.source, image: texture.image, data: texture.image.data,
    version: texture.version, sourceVersion: texture.source.version, metadata: textureMetadata(texture), hash: await fingerprint(texture.image.data) });
  for (const attribute of [...Object.values(geo.attributes), geo.index]) attributes.get(attribute).hash = await fingerprint(attribute.array);
  const originalColor = mat.color.toArray(), originalBumpScale = mat.bumpScale, originalUserData = JSON.stringify(mat.userData);
  let sourceDisposals = 0;
  const sourceResources = new Set([geo, mat, ...textures.keys()]), sourceDispose = () => sourceDisposals++;
  for (const resource of sourceResources) resource.addEventListener('dispose', sourceDispose);
  const originalTorsoVisible = torso.visible, originalHeadVisible = p.headPivot.visible;
  let prepared, loaded, loadedTorso, exportRoot, cleaned = false;
  const canvases = new Set(), frameReferences = new Map();
  const decoded = new Map();
  function rgba(texture) {
    if (texture.image.data) return texture.image;
    if (decoded.has(texture)) return decoded.get(texture);
    const canvas = document.createElement('canvas'), image = texture.image;
    canvas.width = image.width; canvas.height = image.height; canvases.add(canvas);
    const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
    context.drawImage(image, 0, 0);
    const result = { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
    decoded.set(texture, result); return result;
  }
  async function unchanged(stage) {
    for (const item of objects) {
      demand(item.object.geometry === item.geometry && item.object.material === item.material, `${stage}: source object/material changed: ${item.object.name}`);
      demand(item.object.children.length === item.children.length && item.object.children.every((child, index) => child === item.children[index]), `${stage}: source hierarchy changed: ${item.object.name}`);
    }
    for (const [attribute, item] of attributes) {
      demand((item.key === 'index' ? item.geometry.index : item.geometry.getAttribute(item.key)) === attribute && attribute.array === item.array && attribute.version === item.version, `${stage}: source attribute reference/version changed: ${item.object.name}/${item.key}`);
      for (const [i, value] of item.samples) demand(Object.is(attribute.array[i], value), `${stage}: source attribute sample changed: ${item.object.name}/${item.key}/${i}`);
      if (item.hash) demand(await fingerprint(item.array) === item.hash, `${stage}: torso ${item.key} bytes changed.`);
    }
    for (const [texture, item] of textures) {
      demand(mat[item.slot] === texture && texture.source === item.source && texture.image === item.image && texture.image.data === item.data && texture.version === item.version && texture.source.version === item.sourceVersion, `${stage}: live ${item.slot} reference/version changed.`);
      same(textureMetadata(texture), item.metadata, `${stage}: live ${item.slot} sampler changed.`);
      demand(await fingerprint(item.data) === item.hash, `${stage}: live ${item.slot} bytes changed.`);
    }
    same(mat.color.toArray(), originalColor, `${stage}: source material color changed.`);
    demand(mat.bumpScale === originalBumpScale && JSON.stringify(mat.userData) === originalUserData && sourceDisposals === 0, `${stage}: source material metadata, bump scale or resource lifetime changed.`);
    report.sourceChecks.push({ stage, ok: true, originalObjects: objects.length, originalAttributes: attributes.size, fullTorsoAttributeHashes: 5, fullTextureHashes: textures.size });
  }

  api.roundtrip = async () => {
    torso.updateWorldMatrix(true, false);
    exportRoot = new T.Group(); exportRoot.name = 'GPT6_Astra_ChatGPT_WebGPU_Cloth117_Export_Audit';
    const proxy = new T.Mesh(geo, mat); proxy.name = torso.name; proxy.matrixAutoUpdate = false; proxy.matrix.copy(torso.matrixWorld);
    proxy.castShadow = torso.castShadow; proxy.receiveShadow = torso.receiveShadow; exportRoot.add(proxy); exportRoot.updateMatrixWorld(true);
    const preparedAt = performance.now(); prepared = api.createPortraitExport(exportRoot);
    const clone = prepared.model.getObjectByName(torso.name);
    demand(clone.geometry === geo && clone.material !== mat, 'Export preparation must share the large torso geometry and clone its material.');
    for (const slot of ['map', 'bumpMap']) {
      demand(clone.material[slot] !== mat[slot] && clone.material[slot].source !== mat[slot].source && clone.material[slot].image.data === mat[slot].image.data, `Prepared ${slot} must own metadata and share only immutable bytes.`);
      same(textureMetadata(clone.material[slot]), textureMetadata(mat[slot]), `Prepared ${slot} sampling changed.`);
    }
    const privateMaterials = new Set(), privateTextures = new Set();
    prepared.model.traverse(object => { if (object.material) { privateMaterials.add(object.material); for (const value of Object.values(object.material)) if (value?.isTexture) privateTextures.add(value); } });
    let disposedMaterials = 0, disposedTextures = 0;
    for (const material of privateMaterials) material.addEventListener('dispose', () => disposedMaterials++);
    for (const texture of privateTextures) texture.addEventListener('dispose', () => disposedTextures++);
    await unchanged('after-export-preparation');
    const preparationReport = structuredClone(prepared.report); prepared.dispose(); prepared = null;
    demand(disposedMaterials === privateMaterials.size && disposedTextures === privateTextures.size, 'Temporary export resources were not all disposed exactly once.');
    report.temporaryPreparation = { ...preparationReport, disposedMaterials, disposedTextures, milliseconds: performance.now() - preparedAt };
    await unchanged('after-preparation-disposal');
    const exportAt = performance.now(), buffer = await api.exportPortraitGLB(exportRoot), exportMs = performance.now() - exportAt;
    const header = new DataView(buffer);
    demand(header.getUint32(0, true) === 0x46546c67 && header.getUint32(4, true) === 2 && header.getUint32(8, true) === buffer.byteLength, 'Invalid focused GLB header.');
    await unchanged('after-glb-serialization');
    const loadAt = performance.now(); loaded = await new api.GLTFLoader().parseAsync(buffer, ''); const loadMs = performance.now() - loadAt;
    const json = loaded.parser.json, nodeIndex = json.nodes.findIndex(node => node.name === torso.name && node.mesh !== undefined);
    demand(nodeIndex >= 0 && json.meshes.length === 1, 'The focused GLB must contain exactly the torso mesh.');
    loadedTorso = await loaded.parser.getDependency('node', nodeIndex);
    demand(loadedTorso.isMesh && loaded.scene.getObjectById(loadedTorso.id) === loadedTorso && !Array.isArray(loadedTorso.material), 'Expected one actual loaded torso primitive.');
    const primitive = json.meshes[json.nodes[nodeIndex].mesh].primitives[0], definition = json.materials[primitive.material], material = loadedTorso.material;
    const factor = definition.pbrMetallicRoughness?.baseColorFactor || [1, 1, 1, 1];
    demand(factor.length === 4 && factor.every(value => Number.isFinite(value) && value >= 0 && value <= 1), 'GLB baseColorFactor is outside the legal range.');
    same(factor, [1, 1, 1, 1], 'The revised atlas should carry its full RGB with a white glTF factor.');
    same(material.color.toArray(), [1, 1, 1], 'Loaded cloth material factor changed.');
    demand(definition.pbrMetallicRoughness?.baseColorTexture && material.map, 'The focused GLB lost the cloth base-color atlas.');
    demand((definition.pbrMetallicRoughness.baseColorTexture.texCoord || 0) === 0, 'Base-color UV channel changed.');
    const bumpExtension = definition.extensions?.EXT_materials_bump;
    demand(json.extensionsUsed?.includes('EXT_materials_bump') && bumpExtension?.bumpTexture && material.bumpMap, 'Installed Three must retain the weave through EXT_materials_bump.');
    demand(bumpExtension.bumpFactor === mat.bumpScale && material.bumpScale === mat.bumpScale && (bumpExtension.bumpTexture.texCoord || 0) === mat.bumpMap.channel, 'Weave bump factor or UV channel changed.');
    demand(json.images.every(image => Number.isInteger(image.bufferView) && !image.uri), 'All focused GLB images must be embedded.');
    const geometryChecks = {};
    same(Object.keys(loadedTorso.geometry.attributes).sort(), Object.keys(geo.attributes).sort(), 'Loaded torso attribute set changed.');
    for (const [key, before] of Object.entries({ ...geo.attributes, index: geo.index })) {
      const after = key === 'index' ? loadedTorso.geometry.index : loadedTorso.geometry.getAttribute(key);
      demand(after?.count === before.count && after.itemSize === before.itemSize && after.array.length === before.array.length, `Loaded ${key} shape changed.`);
      let maxError = 0, differingValues = 0;
      for (let i = 0; i < before.array.length; i++) { const error = Math.abs(before.array[i] - after.array[i]); maxError = Math.max(maxError, error); if (error !== 0) differingValues++; }
      demand(Number.isFinite(maxError) && maxError <= (key === 'normal' ? 1e-6 : 0), `Loaded ${key} values changed: ${maxError}`);
      geometryChecks[key] = { count: before.count, values: before.array.length, maxError, differingValues };
    }
    const textureChecks = {};
    for (const slot of ['map', 'bumpMap']) {
      const before = mat[slot], after = material[slot], a = before.image, b = rgba(after);
      demand(a.width === b.width && a.height === b.height && a.data.length === b.data.length, `Loaded ${slot} dimensions changed.`);
      const samplerBefore = textureMetadata(before), samplerAfter = textureMetadata(after);
      // Texture anisotropy is a renderer setting; preserve its source value for
      // this controlled native comparison without altering any pixel data.
      delete samplerBefore.anisotropy; delete samplerAfter.anisotropy;
      after.updateMatrix(); samplerAfter.matrix = after.matrix.toArray();
      same(samplerAfter, samplerBefore, `Loaded ${slot} channel, orientation or UV sampling changed.`);
      let mismatches = 0, maxByteError = 0, flippedMismatches = 0;
      for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) for (let c = 0; c < 4; c++) {
        const at = (y * a.width + x) * 4 + c, error = Math.abs(a.data[at] - b.data[at]);
        if (error) mismatches++; maxByteError = Math.max(maxByteError, error);
        if (a.data[at] !== b.data[((a.height - 1 - y) * a.width + x) * 4 + c]) flippedMismatches++;
      }
      textureChecks[slot] = { width: a.width, height: a.height, mismatches, maxByteError, flippedMismatches, sourceHash: await fingerprint(a.data), loadedHash: await fingerprint(b.data), sourceAnisotropy: before.anisotropy, importedAnisotropy: after.anisotropy };
      demand(mismatches === 0, `Loaded opaque ${slot} bytes/orientation changed: ${JSON.stringify(textureChecks[slot])}`);
      after.anisotropy = before.anisotropy;
    }
    for (const key of ['roughness', 'metalness', 'opacity', 'alphaTest', 'side', 'vertexColors']) demand(material[key] === mat[key], `Loaded material ${key} changed.`);
    const sourceSheen = mat.sheenColor.toArray().map(value => value * mat.sheen), loadedSheen = material.sheenColor.toArray().map(value => value * material.sheen);
    demand(sourceSheen.every((value, index) => Math.abs(value - loadedSheen[index]) < 1e-7) && material.sheenRoughness === mat.sheenRoughness, 'Loaded effective cotton sheen changed.');
    loaded.scene.updateMatrixWorld(true);
    const sourceBounds = new T.Box3().setFromObject(torso), loadedBounds = new T.Box3().setFromObject(loadedTorso);
    const boundError = Math.max(...sourceBounds.min.toArray().map((value, i) => Math.abs(value - loadedBounds.min.getComponent(i))), ...sourceBounds.max.toArray().map((value, i) => Math.abs(value - loadedBounds.max.getComponent(i))));
    demand(Number.isFinite(boundError) && boundError < 1e-6, `Loaded torso world transform changed: ${boundError}`);
    const rendererSettings = ['alphaToCoverage', 'envMapIntensity', 'forceSinglePass', 'depthWrite'];
    for (const key of rendererSettings) material[key] = mat[key];
    loadedTorso.castShadow = torso.castShadow; loadedTorso.receiveShadow = torso.receiveShadow; loadedTorso.renderOrder = torso.renderOrder;
    loaded.scene.visible = false; p.scene.add(loaded.scene);
    await unchanged('after-load-and-hidden-attachment');
    report.roundtrip = { glbBytes: buffer.byteLength, meshCount: json.meshes.length, baseColorFactor: factor, extensionsUsed: json.extensionsUsed,
      bumpExtension, geometryChecks, textureChecks, sourceSheen, loadedSheen, boundError, matchedRendererSettings: rendererSettings,
      matchedTextureAnisotropy: true, sourceBumpPreservedThroughExtension: true, exportMs, loadMs };
    return report.roundtrip;
  };

  function setView(view) {
    if (view === 'garment') {
      p.headPivot.visible = false; p.setView('detail'); p.controls.target.set(0, .1, .2); p.camera.position.set(0, .1, 13.2);
      p.camera.zoom = .72; p.camera.updateProjectionMatrix(); p.camera.lookAt(p.controls.target); p.controls.update();
    } else { p.headPivot.visible = originalHeadVisible; p.setView('front'); }
  }
  function eyeRects(width, height) {
    const result = [], point = new T.Vector3();
    p.model.traverseVisible(object => {
      if (object.name !== 'transparent-corneal-dome') return;
      const pos = object.geometry.getAttribute('position'); let x0 = width, y0 = height, x1 = 0, y1 = 0;
      for (let i = 0; i < pos.count; i++) {
        point.fromBufferAttribute(pos, i).applyMatrix4(object.matrixWorld).project(p.camera);
        const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      result.push([Math.max(0, Math.floor(x0)), Math.max(0, Math.floor(y0)), Math.min(width, Math.ceil(x1)), Math.min(height, Math.ceil(y1))]);
    });
    demand(result.length === 2, 'Expected the two original source corneas for the front-view regression check.');
    return result;
  }
  function pixelStats(a, b, rect = [0, 0, a.width, a.height]) {
    let sum = 0, maximum = 0, overTwo = 0, pixels = 0, sourceLuma = 0, currentLuma = 0, sourceDark = 0, currentDark = 0;
    for (let y = rect[1]; y < rect[3]; y++) for (let x = rect[0]; x < rect[2]; x++) {
      const at = (y * a.width + x) * 4; let localMax = 0;
      for (let c = 0; c < 3; c++) { const difference = Math.abs(a.data[at + c] - b.data[at + c]); sum += difference; maximum = Math.max(maximum, difference); localMax = Math.max(localMax, difference); }
      const A = .2126 * a.data[at] + .7152 * a.data[at + 1] + .0722 * a.data[at + 2], B = .2126 * b.data[at] + .7152 * b.data[at + 1] + .0722 * b.data[at + 2];
      sourceLuma += A; currentLuma += B; sourceDark += A < 25; currentDark += B < 25; overTwo += localMax > 2; pixels++;
    }
    return { rect, pixels, rgbMAE: sum / (pixels * 3), maxByteDifference: maximum, changedPixelFractionOverTwo: overTwo / pixels,
      sourceMeanLuma: sourceLuma / pixels, currentMeanLuma: currentLuma / pixels, sourceDarkFraction: sourceDark / pixels, currentDarkFraction: currentDark / pixels };
  }
  api.capture = async (stage, view) => {
    if (stage === 'loaded') { demand(loadedTorso, 'Load the torso before comparison.'); torso.visible = false; loaded.scene.visible = true; }
    else { torso.visible = originalTorsoVisible; if (loaded) loaded.scene.visible = false; }
    setView(view); p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
    const bytes = await window.saveCloth117Frame(stage, view);
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }));
    const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height; canvases.add(canvas);
    const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' }); context.drawImage(bitmap, 0, 0); bitmap.close();
    const image = context.getImageData(0, 0, canvas.width, canvas.height); canvas.width = canvas.height = 0; canvases.delete(canvas);
    const frame = { width: image.width, height: image.height, data: image.data };
    if (stage === 'source') frameReferences.set(view, { ...frame, eyes: view === 'front' ? eyeRects(frame.width, frame.height) : [] });
    const baseline = frameReferences.get(view); demand(baseline && baseline.width === frame.width && baseline.height === frame.height, 'Compositor frame dimensions changed.');
    const comparison = pixelStats(baseline, frame), eyes = baseline.eyes.map(rect => pixelStats(baseline, frame, rect));
    for (const eye of eyes) {
      demand(eye.pixels > 100 && eye.sourceMeanLuma > 25, `Invalid source cornea patch: ${JSON.stringify(eye)}`);
      eye.severeBlackening = eye.currentMeanLuma / eye.sourceMeanLuma < .65 && eye.currentDarkFraction - eye.sourceDarkFraction > .1;
    }
    const result = { stage, view, width: frame.width, height: frame.height, ...comparison, eyes };
    report.visual.push(result);
    demand(!eyes.some(eye => eye.severeBlackening), `${stage}/${view}: original source-eye transmission changed.`);
    return result;
  };
  api.cleanup = async () => {
    if (cleaned) return report.cleanup;
    prepared?.dispose(); prepared = null;
    torso.visible = originalTorsoVisible; p.headPivot.visible = originalHeadVisible;
    const geometries = new Set(), materials = new Set(), maps = new Set(), images = new Set();
    if (loaded) {
      p.scene.remove(loaded.scene);
      loaded.scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) {
        materials.add(object.material); for (const texture of Object.values(object.material)) if (texture?.isTexture) { maps.add(texture); if (texture.image?.close) images.add(texture.image); }
      } });
    }
    for (const resource of [...geometries, ...materials, ...maps]) { demand(!sourceResources.has(resource), 'Loaded cleanup tried to dispose a live source resource.'); resource.dispose(); }
    for (const image of images) image.close();
    exportRoot?.clear(); loaded = null; cleaned = true;
    report.cleanup = { loadedGeometriesDisposed: geometries.size, loadedMaterialsDisposed: materials.size, loadedTexturesDisposed: maps.size,
      loadedImageBitmapsClosed: images.size, sourceDisposals, originalMaterialAndAtlasRestored: torso.material === mat && torso.material.map === mat.map, sourceVisibilityRestored: torso.visible === originalTorsoVisible && p.headPivot.visible === originalHeadVisible };
    try { await unchanged('after-loaded-torso-cleanup'); }
    finally {
      for (const resource of sourceResources) resource.removeEventListener('dispose', sourceDispose);
      for (const canvas of canvases) canvas.width = canvas.height = 0;
      canvases.clear(); decoded.clear();
    }
    return report.cleanup;
  };
  api.releaseReadbacks = () => frameReferences.clear();
  await unchanged('before-focused-export');
  return report;
}

const chrome = process.env.CHROME_PATH || path.resolve(root, '../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
const report = { candidate: 117, scoreUnchanged: 76, status: 'Running', browserErrors: [] };
let page;
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => report.browserErrors.push(error.message));
  await page.exposeFunction('saveCloth117Frame', async (stage, view) => {
    if (!['source', 'loaded', 'restored'].includes(stage) || !['front', 'garment'].includes(view)) throw new Error('Unknown cloth comparison frame.');
    await page.locator('#viewport-wrap').screenshot({ path: path.join(qa, `cloth117-export-${stage}-${view}.png`) });
    const bytes = await page.locator('#canvas-host canvas').screenshot();
    return Array.from(bytes); // Binary screenshot bytes remain inside the browser protocol, never stdout/base64.
  });
  await page.route('**/app.js', route => route.fulfill({ path: bundle, contentType: 'text/javascript' }));
  const url = new URL(process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/'); url.searchParams.set('cloth117', '.5');
  await page.goto(url.href, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.portrait?.ready || (window.portrait && !document.querySelector('#backend-gate').hidden), null, { timeout: 90000 });
  await page.evaluate(async () => {
    const p = window.portrait; if (!p.ready) throw new Error(document.querySelector('#gate-message').textContent);
    if (!p.renderer.backend?.isWebGPUBackend) throw new Error('The focused cloth comparison requires native WebGPU.');
    p.setScore(117, 76); p.startTurntable(false); p.setResolution(900, 1200); p.setAntialiasing(2); p.setView('front');
    p.renderNow(); await p.renderer.backend.device.queue.onSubmittedWorkDone();
  });
  await page.evaluate(installCloth117Audit);
  for (const view of ['front', 'garment']) await page.evaluate(view => window.exportCloth117.capture('source', view), view);
  await page.evaluate(() => window.exportCloth117.roundtrip());
  for (const view of ['front', 'garment']) await page.evaluate(view => window.exportCloth117.capture('loaded', view), view);
  await page.evaluate(() => window.exportCloth117.cleanup());
  await page.evaluate(() => window.exportCloth117.capture('restored', 'front'));
  Object.assign(report, await page.evaluate(() => window.exportCloth117.report));
  const frames = await page.evaluate(() => window.portrait.state.renderedFrames); await page.waitForTimeout(450);
  report.idleFrames = await page.evaluate(before => window.portrait.state.renderedFrames - before, frames);
  if (report.idleFrames !== 0 || report.browserErrors.length) throw new Error(`Unexpected idle rendering or browser error: ${JSON.stringify({ idleFrames: report.idleFrames, errors: report.browserErrors })}`);
  report.status = 'Technical checks passed; paired source/loaded torso images require root visual acceptance';
} catch (error) { report.status = 'Failed'; report.failure = error.message; throw error; }
finally {
  if (page) {
    try {
      if (await page.evaluate(() => Boolean(window.exportCloth117?.cleanup))) await page.evaluate(() => window.exportCloth117.cleanup());
    } catch (error) { report.cleanupFailure = error.message; report.status = 'Failed'; }
    try {
      const current = await page.evaluate(() => window.exportCloth117?.report || null); if (current) Object.assign(report, current);
      await page.evaluate(() => window.exportCloth117?.releaseReadbacks?.());
    } catch (error) { report.readbackFailure = error.message; }
    await page.close();
  }
  try { await browser.close(); } finally { await writeFile(path.join(qa, 'cloth117-export-native-result.json'), JSON.stringify(report, null, 2) + '\n'); }
  console.log(JSON.stringify({ candidate: 117, scoreUnchanged: 76, status: report.status, glbBytes: report.roundtrip?.glbBytes,
    atlas: report.roundtrip?.textureChecks?.map, weave: report.roundtrip?.textureChecks?.bumpMap, sourceChecks: report.sourceChecks?.map(check => ({ stage: check.stage, ok: check.ok })),
    visual: report.visual?.map(view => ({ stage: view.stage, view: view.view, rgbMAE: view.rgbMAE, maxByteDifference: view.maxByteDifference, eyes: view.eyes })), cleanup: report.cleanup,
    idleFrames: report.idleFrames, failure: report.failure, cleanupFailure: report.cleanupFailure }));
  if (report.cleanupFailure || report.readbackFailure) throw new Error(report.cleanupFailure || report.readbackFailure);
}
