import { build } from 'esbuild';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const evidence = resolve(root, 'output/qa');
const bundle = resolve(evidence, 'glb-audit.js');
await mkdir(evidence, { recursive: true });
await build({
  absWorkingDir: root,
  stdin: {
    contents: "export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; export { createPortraitExport } from './src/export-portrait.js'; export { Box3, Vector3 } from 'three';",
    resolveDir: root,
    sourcefile: 'glb-roundtrip-entry.js',
  },
  outfile: bundle, bundle: true, format: 'iife', globalName: 'GLBAudit',
  platform: 'browser', target: ['es2022'], minify: true, logLevel: 'silent',
});

const base = process.env.PORTRAIT_URL || 'http://127.0.0.1:8766/';
const chrome = process.env.CHROME_PATH || resolve(root, '../../../../../Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--enable-unsafe-webgpu', '--use-angle=metal', '--disable-background-networking'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1350 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.portrait?.ready, null, { timeout: 120000 });
  await page.addScriptTag({ path: bundle });
  const result = await page.evaluate(async () => {
    const { GLTFLoader, createPortraitExport, Box3, Vector3 } = window.GLBAudit;
    const portrait = window.portrait, model = portrait.model;
    const require = (condition, message) => { if (!condition) throw new Error(message); };
    const equal = (a, b, message) => require(JSON.stringify(a) === JSON.stringify(b), message);
    const close = (a, b, tolerance, message) => require(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance, `${message}: ${a} vs ${b}`);
    const samples = (length, count = 37) => [...new Set(Array.from({ length: Math.min(count, length) }, (_, i) => Math.floor(i * (length - 1) / Math.max(1, Math.min(count, length) - 1))))];
    const asMaterials = object => object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    require(portrait.renderer.backend?.isWebGPUBackend === true, 'The audit must start from the actual native WebGPU viewer.');
    portrait.startTurntable(false);

    const geometryRecords = new Map(), materialRecords = new Map(), textureRecords = new Map(), objectRecords = [];
    const pixelReaders = new Map(), ownedPixelCanvases = new Set();
    function readPixels(texture) {
      if (pixelReaders.has(texture)) return pixelReaders.get(texture);
      const image = texture.image;
      require(image?.width > 0 && image?.height > 0, `Texture dimensions: ${texture.name}`);
      let read;
      if (image.data) {
        require(image.data.length === image.width * image.height * 4, `Expected original RGBA8 texture: ${texture.name}`);
        read = (x, y) => Array.from(image.data.subarray((y * image.width + x) * 4, (y * image.width + x) * 4 + 4));
      } else {
        let canvas = image;
        if (!image.getContext) {
          canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
          ownedPixelCanvases.add(canvas);
          canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' }).drawImage(image, 0, 0);
        }
        const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
        read = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);
      }
      const reader = { width: image.width, height: image.height, read };
      pixelReaders.set(texture, reader);
      return reader;
    }
    function pixelSamples(texture) {
      const reader = readPixels(texture);
      return samples(reader.width * reader.height, 29).map(i => {
        const x = i % reader.width, y = Math.floor(i / reader.width);
        return { x, y, rgba: reader.read(x, y) };
      });
    }
    function textureMetadata(texture) {
      return {
        colorSpace: texture.colorSpace, flipY: texture.flipY, channel: texture.channel,
        wrapS: texture.wrapS, wrapT: texture.wrapT, minFilter: texture.minFilter, magFilter: texture.magFilter,
        anisotropy: texture.anisotropy, rotation: texture.rotation, matrixAutoUpdate: texture.matrixAutoUpdate,
        repeat: texture.repeat.toArray(), offset: texture.offset.toArray(), center: texture.center.toArray(), matrix: texture.matrix.toArray(),
      };
    }
    function attributeRecord(attribute) {
      const array = attribute.array || attribute.data.array;
      return { attribute, array, version: attribute.version, dataVersion: attribute.data?.version,
        values: samples(array.length).map(index => [index, array[index]]) };
    }
    model.traverse(object => {
      const entry = { object, geometry: object.geometry, material: object.material, materials: asMaterials(object).slice() };
      objectRecords.push(entry);
      if (object.geometry && !geometryRecords.has(object.geometry)) {
        const geometry = object.geometry;
        geometryRecords.set(geometry, {
          attributes: Object.entries(geometry.attributes).map(([name, attribute]) => [name, attributeRecord(attribute)]),
          index: geometry.index ? attributeRecord(geometry.index) : null,
        });
      }
      for (const material of entry.materials) {
        if (materialRecords.has(material)) continue;
        const slots = Object.entries(material).filter(([, value]) => value?.isTexture);
        materialRecords.set(material, { version: material.version, slots, normalScale: material.normalScale?.toArray() });
        for (const [, texture] of slots) if (!textureRecords.has(texture)) {
          textureRecords.set(texture, { source: texture.source, image: texture.image, data: texture.image?.data,
            version: texture.version, sourceVersion: texture.source.version, metadata: textureMetadata(texture), pixels: pixelSamples(texture) });
        }
      }
    });
    function assertLiveUnchanged(stage) {
      for (const record of objectRecords) {
        require(record.object.geometry === record.geometry && record.object.material === record.material, `${stage}: live object references changed.`);
        const current = asMaterials(record.object);
        require(current.length === record.materials.length && current.every((material, i) => material === record.materials[i]), `${stage}: live material array changed.`);
      }
      const checkAttribute = (current, record, label) => {
        require(current === record.attribute && (current.array || current.data.array) === record.array, `${stage}: ${label} array identity changed.`);
        require(current.version === record.version && current.data?.version === record.dataVersion, `${stage}: ${label} version changed.`);
        for (const [index, value] of record.values) require(Object.is(record.array[index], value), `${stage}: ${label} values changed.`);
      };
      for (const [geometry, record] of geometryRecords) {
        equal(Object.keys(geometry.attributes), record.attributes.map(([name]) => name), `${stage}: attribute set changed.`);
        for (const [name, attribute] of record.attributes) checkAttribute(geometry.getAttribute(name), attribute, name);
        if (record.index) checkAttribute(geometry.index, record.index, 'index'); else require(!geometry.index, `${stage}: index appeared.`);
      }
      for (const [material, record] of materialRecords) {
        require(material.version === record.version, `${stage}: live material version changed.`);
        equal(material.normalScale?.toArray(), record.normalScale, `${stage}: live normal scale changed.`);
        for (const [slot, texture] of record.slots) require(material[slot] === texture, `${stage}: live ${slot} replaced.`);
      }
      for (const [texture, record] of textureRecords) {
        require(texture.source === record.source && texture.image === record.image && texture.image?.data === record.data, `${stage}: live texture source changed.`);
        require(texture.version === record.version && texture.source.version === record.sourceVersion, `${stage}: live texture/source version changed.`);
        equal(textureMetadata(texture), record.metadata, `${stage}: live texture metadata changed.`);
        for (const pixel of record.pixels) equal(readPixels(texture).read(pixel.x, pixel.y), pixel.rgba, `${stage}: live texture pixels changed.`);
      }
    }

    let prepared = null, loaded = null;
    const preparationStart = performance.now();
    try {
      prepared = createPortraitExport(model);
      const preparedObjects = [];
      prepared.model.traverse(object => preparedObjects.push(object));
      require(preparedObjects.length === objectRecords.length, 'Export preparation changed the hierarchy.');
      const cloneMaterials = new Set(), cloneTextures = new Set();
      const disposal = { materials: 0, textures: 0 };
      let normalSampleCount = 0, preparationNormalError = 0;
      for (let i = 0; i < objectRecords.length; i++) {
        const original = objectRecords[i], clone = preparedObjects[i];
        require(clone !== original.object && clone.geometry === original.geometry, 'Preparation must clone nodes and share geometry.');
        const nextMaterials = asMaterials(clone);
        require(nextMaterials.length === original.materials.length, 'Material slot count changed in preparation.');
        for (let j = 0; j < nextMaterials.length; j++) {
          const sourceMaterial = original.materials[j], material = nextMaterials[j];
          require(material !== sourceMaterial, 'Export material still aliases the preview.');
          cloneMaterials.add(material);
          for (const [slot, sourceTexture] of materialRecords.get(sourceMaterial).slots) {
            const texture = material[slot];
            require(texture !== sourceTexture && texture.source !== sourceTexture.source, `Export ${slot} source is shared with preview.`);
            equal(textureMetadata(texture), textureMetadata(sourceTexture), `Export ${slot} metadata changed.`);
            cloneTextures.add(texture);
            if (slot !== 'normalMap' && sourceTexture.isDataTexture) {
              require(texture.isDataTexture && texture.image.data === sourceTexture.image.data, 'Original albedo/cloth/neck RGBA must remain an unchanged data array.');
            }
          }
          if (sourceMaterial.normalMap?.isDataTexture) {
            require(material.normalMap.isCanvasTexture && !material.normalMap.isDataTexture, 'Exporter normal input must support drawImage.');
            const reader = readPixels(material.normalMap), scalar = Math.max(Math.abs(sourceMaterial.normalScale.x), Math.abs(sourceMaterial.normalScale.y));
            for (const pixel of pixelSamples(sourceMaterial.normalMap)) {
              const rgba = reader.read(pixel.x, pixel.y);
              for (let ch = 0; ch < 2; ch++) {
                const originalValue = (pixel.rgba[ch] / 127.5 - 1) * sourceMaterial.normalScale.getComponent(ch);
                const convertedValue = (rgba[ch] / 127.5 - 1) * material.normalScale.getComponent(ch);
                const error = Math.abs(originalValue - convertedValue);
                require(error <= scalar / 255 + 1e-12, 'Normal scale baking exceeded its byte-quantization bound.');
                preparationNormalError = Math.max(preparationNormalError, error);
              }
              require(rgba[2] === pixel.rgba[2] && rgba[3] === pixel.rgba[3], 'Normal Z/alpha changed during preparation.');
              normalSampleCount++;
            }
          }
        }
      }
      require(normalSampleCount > 0, 'The procedural hair normal map was not exercised.');
      for (const material of cloneMaterials) material.addEventListener('dispose', () => disposal.materials++);
      for (const texture of cloneTextures) texture.addEventListener('dispose', () => disposal.textures++);
      const preparationReport = structuredClone(prepared.report);
      assertLiveUnchanged('after preparation');
      prepared.dispose(); prepared = null;
      require(disposal.materials === cloneMaterials.size && disposal.textures === cloneTextures.size, 'Temporary export resources were not all disposed.');
      assertLiveUnchanged('after preparation disposal');
      const preparationMs = performance.now() - preparationStart;

      const sourceMeshes = [];
      function sourceTree(object, path = []) {
        if (!object.visible) return;
        const currentPath = [...path, object.name];
        if (object.isMesh) sourceMeshes.push({ object, path: currentPath });
        for (const child of object.children) sourceTree(child, currentPath);
      }
      sourceTree(model);
      const exportStart = performance.now();
      let blob = await portrait.exportGLB({ download: false });
      const bytes = blob.size, data = await blob.arrayBuffer(); blob = null;
      const exportMs = performance.now() - exportStart, header = new DataView(data);
      require(header.getUint32(0, true) === 0x46546c67 && header.getUint32(4, true) === 2 && header.getUint32(8, true) === bytes, 'Invalid GLB header or length.');
      assertLiveUnchanged('after binary export');
      const loadStart = performance.now();
      loaded = await new GLTFLoader().parseAsync(data, '');
      const loadMs = performance.now() - loadStart, json = loaded.parser.json;
      require((json.images || []).every(image => Number.isInteger(image.bufferView) && !image.uri), 'GLB images must be embedded, without external asset dependencies.');
      const exportedMeshes = [];
      function exportedTree(index, path = []) {
        const node = json.nodes[index], currentPath = [...path, node.name || ''];
        if (node.mesh !== undefined) exportedMeshes.push({ index, node, path: currentPath });
        for (const child of node.children || []) exportedTree(child, currentPath);
      }
      for (const index of json.scenes[json.scene || 0].nodes) exportedTree(index);
      equal(exportedMeshes.map(entry => entry.path), sourceMeshes.map(entry => entry.path), 'Visible mesh names or their hierarchy changed in the GLB.');

      function boundsAndTriangles(objects) {
        const bounds = new Box3(), local = new Box3(), point = new Vector3();
        let triangles = 0;
        for (const object of objects) {
          const geometry = object.geometry, position = geometry.getAttribute('position');
          require(position?.count > 0, `Missing positions: ${object.name}`);
          local.makeEmpty();
          for (let i = 0; i < position.count; i++) {
            point.fromBufferAttribute(position, i);
            require(Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z), `Nonfinite loaded/source position: ${object.name}`);
            local.expandByPoint(point);
          }
          local.applyMatrix4(object.matrixWorld); bounds.union(local);
          triangles += (geometry.index?.count || position.count) / 3;
        }
        const values = [...bounds.min.toArray(), ...bounds.max.toArray()];
        require(values.every(Number.isFinite) && values[3] > values[0] && values[4] > values[1] && values[5] > values[2], 'Portrait bounds are invalid or flat.');
        return { triangles, bounds: values };
      }
      loaded.scene.updateMatrixWorld(true);
      const loadedMeshes = [];
      loaded.scene.traverseVisible(object => { if (object.isMesh) loadedMeshes.push(object); });
      const expectedPrimitives = exportedMeshes.reduce((sum, entry) => sum + json.meshes[entry.node.mesh].primitives.length, 0);
      require(loadedMeshes.length === expectedPrimitives, 'Loaded primitive count changed (including the split front/rear face materials).');
      const sourceStats = boundsAndTriangles(sourceMeshes.map(entry => entry.object));
      const loadedStats = boundsAndTriangles(loadedMeshes);
      require(loadedStats.triangles === sourceStats.triangles, 'Roundtrip changed the visible triangle count.');
      sourceStats.bounds.forEach((value, i) => close(loadedStats.bounds[i], value, 2e-5, 'World bounds changed'));

      let uvSamples = 0, colorPixelSamples = 0, normalPixelSamples = 0, roundtripNormalError = 0, opaqueColorError = 0;
      const checkedTexturePairs = new Set();
      for (let i = 0; i < sourceMeshes.length; i++) {
        const source = sourceMeshes[i].object, definition = json.meshes[exportedMeshes[i].node.mesh];
        const loadedDefinition = await loaded.parser.getDependency('mesh', exportedMeshes[i].node.mesh);
        const primitives = loadedDefinition.isMesh ? [loadedDefinition] : loadedDefinition.children.filter(child => child.isMesh);
        require(primitives.length === definition.primitives.length, `Loaded mesh primitives missing: ${source.name}`);
        const sourceMaterials = asMaterials(source);
        for (let j = 0; j < primitives.length; j++) {
          const primitive = primitives[j], geometry = primitive.geometry;
          for (const name of ['position', 'uv']) {
            const before = source.geometry.getAttribute(name), after = geometry.getAttribute(name);
            if (!before) { require(!after, `Unexpected ${name}: ${source.name}`); continue; }
            require(after?.count === before.count && after.itemSize === before.itemSize, `${name} dimensions changed: ${source.name}`);
            const methods = ['getX', 'getY', 'getZ', 'getW'];
            for (const index of samples(before.count, 23)) for (let ch = 0; ch < before.itemSize; ch++) {
              close(after[methods[ch]](index), before[methods[ch]](index), 1e-7, `Roundtrip ${name}: ${source.name}`);
              if (name === 'uv') uvSamples++;
            }
          }
          const group = Array.isArray(source.material) ? source.geometry.groups[j] : null;
          const sourceMaterial = sourceMaterials[group?.materialIndex || 0], material = primitive.material;
          require(!Array.isArray(material), 'Each glTF primitive should have one material.');
          if (sourceMaterial.anisotropy > 0) {
            close(material.anisotropy, sourceMaterial.anisotropy, 1e-12, 'Hair material anisotropy changed');
            close(material.anisotropyRotation, sourceMaterial.anisotropyRotation, 1e-12, 'Hair anisotropy direction changed');
          }
          for (const slot of ['map', 'normalMap']) {
            const sourceTexture = sourceMaterial[slot];
            if (!sourceTexture) continue;
            const texture = material[slot]; require(texture, `Missing loaded ${slot}: ${source.name}`);
            require(texture.flipY === false, `glTF ${slot} should use the exported image orientation.`);
            require(texture.colorSpace === sourceTexture.colorSpace && texture.channel === sourceTexture.channel, `Loaded ${slot} color space/UV channel changed.`);
            for (const key of ['wrapS', 'wrapT']) require(texture[key] === sourceTexture[key], `Loaded ${slot} wrapping changed.`);
            for (const key of ['repeat', 'offset']) sourceTexture[key].toArray().forEach((value, n) => close(texture[key].getComponent(n), value, 1e-12, `Loaded ${slot} ${key}`));
            close(texture.rotation, sourceTexture.rotation, 1e-12, `Loaded ${slot} rotation`);
            const pairKey = `${sourceTexture.uuid}:${texture.uuid}:${slot}:${sourceMaterial.normalScale?.toArray()}:${material.normalScale?.toArray()}`;
            if (checkedTexturePairs.has(pairKey)) continue;
            checkedTexturePairs.add(pairKey);
            const reader = readPixels(texture), sourceReader = readPixels(sourceTexture);
            require(reader.width === sourceReader.width && reader.height === sourceReader.height, 'Authored texture dimensions changed in the GLB.');
            for (const pixel of pixelSamples(sourceTexture)) {
              const y = sourceTexture.flipY ? reader.height - 1 - pixel.y : pixel.y;
              const rgba = reader.read(pixel.x, y);
              require(rgba[3] === pixel.rgba[3], `Loaded ${slot} alpha/orientation changed.`);
              if (slot === 'normalMap') {
                const scalar = Math.max(Math.abs(sourceMaterial.normalScale.x), Math.abs(sourceMaterial.normalScale.y));
                for (let ch = 0; ch < 2; ch++) {
                  const originalValue = (pixel.rgba[ch] / 127.5 - 1) * sourceMaterial.normalScale.getComponent(ch);
                  const loadedValue = (rgba[ch] / 127.5 - 1) * material.normalScale.getComponent(ch);
                  const error = Math.abs(originalValue - loadedValue);
                  require(error <= scalar / 255 + 1e-12, 'Loaded normal direction/scale exceeded its byte-quantization bound.');
                  roundtripNormalError = Math.max(roundtripNormalError, error);
                }
                require(rgba[2] === pixel.rgba[2], 'Loaded normal Z changed.');
                normalPixelSamples++;
              } else {
                // Canvas/PNG may round RGB when alpha is partial. Check opaque
                // RGB exactly within one byte; alpha and row orientation always.
                if (pixel.rgba[3] === 255) for (let ch = 0; ch < 3; ch++) {
                  const error = Math.abs(rgba[ch] - pixel.rgba[ch]);
                  require(error <= 1, 'Opaque albedo color or texture row orientation changed.');
                  opaqueColorError = Math.max(opaqueColorError, error);
                }
                colorPixelSamples++;
              }
            }
          }
        }
      }
      require(uvSamples > 0 && colorPixelSamples > 0 && normalPixelSamples > 0, 'Roundtrip UV/color/normal checks were not exercised.');
      assertLiveUnchanged('after GLTFLoader roundtrip');
      return {
        result: 'passed', backend: 'native WebGPU', glbBytes: bytes,
        visibleSourceMeshes: sourceMeshes.length, loadedPrimitiveMeshes: loadedMeshes.length,
        triangles: loadedStats.triangles, bounds: loadedStats.bounds,
        geometryBuffersSharedDuringPreparation: true, liveReferencesAndSamplesUnchanged: true,
        preparation: preparationReport, uvSamples, colorPixelSamples, normalPixelSamples,
        preparationNormalError, roundtripNormalError, opaqueColorError,
        embeddedImages: json.images?.length || 0,
        milliseconds: { preparation: Math.round(preparationMs), export: Math.round(exportMs), load: Math.round(loadMs) },
        heapMiB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
      };
    } finally {
      prepared?.dispose();
      if (loaded) {
        const geometries = new Set(), materials = new Set(), textures = new Set(), images = new Set();
        loaded.scene.traverse(object => {
          if (object.geometry) geometries.add(object.geometry);
          for (const material of asMaterials(object)) {
            materials.add(material);
            for (const value of Object.values(material)) if (value?.isTexture) { textures.add(value); if (value.image?.close) images.add(value.image); }
          }
        });
        for (const geometry of geometries) geometry.dispose();
        for (const material of materials) material.dispose();
        for (const texture of textures) texture.dispose();
        for (const image of images) image.close();
      }
      for (const canvas of ownedPixelCanvases) { canvas.width = 0; canvas.height = 0; }
    }
  });
  assert.deepEqual(errors, [], 'The targeted roundtrip must not cause uncaught browser errors.');
  await writeFile(resolve(evidence, 'gpt6-astra_chatgpt_webgpu-glb-roundtrip.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
