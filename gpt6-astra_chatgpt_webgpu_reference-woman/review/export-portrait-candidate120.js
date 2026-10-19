import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Three r186's normal-map handedness conversion uses drawImage directly. The
// portrait's normal maps are original RGBA8 DataTextures, whose image is a pixel
// record instead of a CanvasImageSource. Prepare temporary, export-only images;
// keep the considerably larger geometry buffers shared with the live model.
export function createPortraitExport(model) {
  const materials = new Map(), textures = new Map(), normalTextures = new Map();
  const ownedTextures = new Set(), ownedCanvases = new Set();
  const report = { materials: 0, textures: 0, normalCanvases: 0, sharedGeometries: 0, normalScaleBakes: [], alphaMerges: [], sheenFactorBakes: [] };
  let exportModel = null, disposed = false;

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const material of materials.values()) material.dispose();
    for (const texture of ownedTextures) texture.dispose();
    for (const canvas of ownedCanvases) { canvas.width = 0; canvas.height = 0; }
    exportModel?.clear();
    materials.clear(); textures.clear(); normalTextures.clear();
    ownedTextures.clear(); ownedCanvases.clear();
  }

  function copyTexture(source, image = source.image, asCanvas = false) {
    // Texture.copy sets needsUpdate and therefore increments Source.version.
    // Give it an independent Source *before* copying, avoiding even an update
    // bookkeeping change on the displayed texture. Share immutable pixel bytes.
    const metadata = Object.create(source);
    metadata.source = new THREE.TextureSource(source.isDataTexture && !asCanvas ? { ...image } : image);
    const texture = asCanvas ? new THREE.CanvasTexture(image) : new source.constructor();
    ownedTextures.add(texture);
    texture.copy(metadata);
    report.textures++;
    return texture;
  }

  function cloneTexture(source) {
    if (!textures.has(source)) textures.set(source, copyTexture(source));
    return textures.get(source);
  }

  function normalTexture(source, scaleX, scaleY) {
    if (![scaleX, scaleY].every(Number.isFinite)) throw new Error('Normal-map scale must be finite for GLB export.');
    const magnitudeX = Math.abs(scaleX), magnitudeY = Math.abs(scaleY);
    const bakeScale = magnitudeX !== magnitudeY;
    if (!source.isDataTexture && !bakeScale) return { texture: cloneTexture(source), scaleX, scaleY };

    // glTF has one normal scale. Bake unequal component magnitudes into the map
    // and keep the signs for GLTFExporter's geometry-specific handedness step.
    // Ratios <= 1 avoid clipping. RGBA8 rounding contributes at most scalar/255
    // to either scaled tangent component, before the shader normalizes it.
    const scalar = Math.max(magnitudeX, magnitudeY);
    const factorX = bakeScale ? magnitudeX / scalar : 1;
    const factorY = bakeScale ? magnitudeY / scalar : 1;
    const key = `${factorX}:${factorY}`;
    let variants = normalTextures.get(source);
    if (!variants) { variants = new Map(); normalTextures.set(source, variants); }
    let texture = variants.get(key);

    if (!texture) {
      const image = source.image;
      const width = image?.width, height = image?.height;
      if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
        throw new Error(`Normal map "${source.name || 'unnamed'}" has no exportable pixel dimensions.`);
      }
      const canvas = document.createElement('canvas');
      ownedCanvases.add(canvas);
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' });
      if (!context) throw new Error('A 2D canvas is required to export the authored normal maps.');
      let pixels;
      if (source.isDataTexture) {
        const bytes = image.data;
        if (source.format !== THREE.RGBAFormat || source.type !== THREE.UnsignedByteType ||
            !(bytes instanceof Uint8Array || bytes instanceof Uint8ClampedArray) || bytes.length !== width * height * 4) {
          throw new Error(`Normal map "${source.name || 'unnamed'}" must use the portrait's RGBA8 format for GLB export.`);
        }
        pixels = context.createImageData(width, height);
        pixels.data.set(bytes);
      } else {
        context.drawImage(image, 0, 0, width, height);
        pixels = context.getImageData(0, 0, width, height);
      }
      for (let i = 0; i < pixels.data.length; i += 4) {
        // All authored normal maps are opaque. Reject an unexpected alpha map
        // rather than silently lose its hidden RGB through canvas premultiplying.
        if (pixels.data[i + 3] !== 255) throw new Error(`Normal map "${source.name || 'unnamed'}" must be opaque for lossless canvas conversion.`);
        if (bakeScale) {
          pixels.data[i] = Math.round(127.5 + (pixels.data[i] - 127.5) * factorX);
          pixels.data[i + 1] = Math.round(127.5 + (pixels.data[i + 1] - 127.5) * factorY);
        }
      }
      context.putImageData(pixels, 0, 0);
      texture = copyTexture(source, canvas, true);
      variants.set(key, texture);
      report.normalCanvases++;
    }
    if (!bakeScale) return { texture, scaleX, scaleY };
    report.normalScaleBakes.push({ texture: source.name, original: [scaleX, scaleY], scalar, maxComponentError: scalar / 255 });
    return { texture, scaleX: scaleX < 0 ? -scalar : scalar, scaleY: scaleY < 0 ? -scalar : scalar };
  }

  // Candidate 100 alone uses an independent UV0 alphaMap with its UV1 atlas.
  // glTF has no second base-color alpha sampler. This export-only merge uses
  // the validated affine chart inverse; it never changes a live attribute/map.
  function needsCrownMerge104(material) {
    const metadata = material.userData?.referenceCrownMicrocontrast;
    if (!metadata?.export?.requiresExportOnlyAlphaMerge) return false;
    if (metadata.version !== 'reference-crown-strand-space-100-v1') {
      throw new Error('Unknown reference-crown atlas layout; refusing an incorrect alpha merge.');
    }
    return true;
  }

  function validateCrownMerge104(material, geometry) {
    const atlas = material.map, alpha = material.alphaMap;
    const rgba8 = (texture, width, height) => texture?.isDataTexture && texture.format === THREE.RGBAFormat &&
      texture.type === THREE.UnsignedByteType && texture.image.width === width && texture.image.height === height &&
      texture.image.data instanceof Uint8Array && texture.image.data.length === width * height * 4;
    if (!rgba8(atlas, 2048, 2048) || !rgba8(alpha, 512, 1024) || atlas.channel !== 1 || alpha.channel !== 0 ||
        atlas.colorSpace !== THREE.SRGBColorSpace || alpha.colorSpace !== THREE.NoColorSpace || material.normalMap?.channel !== 0) {
      throw new Error('Reference-crown export requires the accepted UV1 RGBA8 atlas and UV0 coverage/normal maps.');
    }
    for (const texture of [atlas, alpha]) {
      if (texture.flipY !== false || texture.wrapS !== THREE.RepeatWrapping || texture.wrapT !== THREE.ClampToEdgeWrapping ||
          texture.minFilter !== THREE.LinearMipmapLinearFilter || texture.magFilter !== THREE.LinearFilter ||
          texture.rotation !== 0 || texture.repeat.x !== 1 || texture.repeat.y !== 1 ||
          texture.offset.x !== 0 || texture.offset.y !== 0 || texture.center.x !== 0 || texture.center.y !== 0) {
        throw new Error('Reference-crown sampler/UV transform changed; its alpha inverse needs an explicit update.');
      }
      const identity = [1,0,0,0,1,0,0,0,1];
      if (!texture.matrix.elements.every((value, index) => value === identity[index])) {
        throw new Error('Reference-crown texture matrix is no longer the accepted identity.');
      }
    }
    const uv = geometry?.getAttribute('uv'), uv1 = geometry?.getAttribute('uv1'), color = geometry?.getAttribute('color');
    if (uv?.count !== 24455 || uv1?.count !== 24455 || color?.count !== 24455 || color.itemSize !== 4) {
      throw new Error('Reference-crown export requires the accepted foundation/two-sheet topology and vertex alpha.');
    }
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i), v = uv.getY(i), foundation = i < 7685;
      const x = foundation ? 16 + u * 512 : (i < 16070 ? 16 : 1040) + u * 992;
      const y = foundation ? 1040 + v * 1024 : 16 + v * 992;
      if (!Number.isFinite(u) || !Number.isFinite(v) || Math.abs(uv1.getX(i) - x / 2048) > 6e-8 || Math.abs(uv1.getY(i) - y / 2048) > 6e-8) {
        throw new Error('Reference-crown UV1 no longer matches the known affine UV0 chart mapping.');
      }
    }
  }

  function mergeCrownAlpha104(source) {
    const started = performance.now(), atlas = source.map, coverage = source.alphaMap.image;
    const data = atlas.image.data.slice();
    const width = coverage.width, height = coverage.height, bytes = coverage.data;
    const sample = (u, v) => {
      const x = (u - Math.floor(u)) * width - .5, y = Math.max(0, Math.min(height - 1, v * height - .5));
      const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      const xa = (ix + width) % width, xb = (ix + 1 + width) % width, yb = Math.min(height - 1, iy + 1);
      const a = bytes[(iy * width + xa) * 4 + 1], b = bytes[(iy * width + xb) * 4 + 1];
      const c = bytes[(yb * width + xa) * 4 + 1], d = bytes[(yb * width + xb) * 4 + 1];
      return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    };
    let texels = 0, partial = 0, transparent = 0, maxQuantizationError = 0;
    const write = (x, y, u, v) => {
      const at = (y * 2048 + x) * 4 + 3, exact = data[at] * sample(u, v) / 255;
      const value = Math.round(exact); data[at] = value;
      maxQuantizationError = Math.max(maxQuantizationError, Math.abs(value - exact) / 255);
      if (value === 0) transparent++; else if (value < 255) partial++;
      texels++;
    };
    // Extend the sampler through each full 16-pixel gutter. The original alpha
    // repeats U: clamping a chart's edge alpha would break the u=0/1 seam.
    for (let y = 0; y < 1024; y++) for (let x = 0; x < 2048; x++) {
      const originX = x < 1024 ? 16 : 1040;
      write(x, y, (x + .5 - originX) / 992, (y + .5 - 16) / 992);
    }
    // Foundation texel centers have an exact 1:1 inverse, including its gutters.
    for (let y = 1024; y < 2048; y++) for (let x = 0; x < 544; x++) {
      write(x, y, (x + .5 - 16) / 512, (y + .5 - 1040) / 1024);
    }
    const texture = copyTexture(atlas, { data, width: 2048, height: 2048 });
    const metrics = {
      version: 'reference-crown-alpha-export-104-v1', sourceVersion: 'reference-crown-strand-space-100-v1',
      atlasDimensions: [2048, 2048], sourceCoverageDimensions: [512, 1024],
      colorTexCoord: 1, normalTexCoord: 0, sourceCoverageTexCoord: 0, coverageChannel: 'green',
      mergedTexels: texels, partialAlphaTexels: partial, transparentTexels: transparent,
      maxTexelAlphaQuantizationError: maxQuantizationError, allocatedBytes: data.byteLength,
      foundationSampling: 'Exact source texel centers', sheetSampling: 'Bilinear source coverage through the affine chart inverse',
      gutterSampling: 'Extrapolated UV0 with original repeat-U/clamp-V',
      rgbBytesChanged: false, vertexAlphaChanged: false, liveAttributesChanged: false, perFrameWork: 0,
      limitation: 'Sheet resampling and glTF mip filtering can differ between original bilinear knots; validate effective coverage before acceptance.',
      milliseconds: performance.now() - started,
    };
    report.alphaMerges.push(metrics);
    return { texture, metrics };
  }

  // Candidate 120: Three r186 exports KHR_materials_sheen.sheenColorFactor
  // directly from sheenColor, while GLTFLoader restores the scalar sheen as 1.
  // Fold the scalar into the clone's linear color so the rendered product is
  // unchanged, including when sheenColorMap modulates it. No texture bake or
  // geometry copy is needed. A zero scalar stays zero, keeping the extension off.
  function normalizeSheen120(source, material) {
    if (!source.isMeshPhysicalMaterial) return;
    const scalar = source.sheen;
    if (!Number.isFinite(scalar) || scalar < 0) {
      throw new Error(`Material "${source.name || 'unnamed'}" has an invalid sheen scalar for GLB export.`);
    }
    if (scalar === 0) return;
    const color = source.sheenColor.toArray();
    const factor = color.map(component => component * scalar);
    if (!factor.every(component => Number.isFinite(component) && component >= 0 && component <= 1)) {
      throw new Error(`Material "${source.name || 'unnamed'}" has an effective sheen color outside glTF's [0, 1] range; no clipping was applied.`);
    }
    material.sheenColor.copy(source.sheenColor).multiplyScalar(scalar);
    material.sheen = 1;
    report.sheenFactorBakes.push({
      version: 'gltf-sheen-scalar-export-120-v1', material: source.name,
      originalScalar: scalar, originalColor: color, exportedScalar: 1, exportedColor: factor,
      colorMap: source.sheenColorMap?.name || null, colorMapPresent: Boolean(source.sheenColorMap),
      roughness: source.sheenRoughness, roughnessMapPresent: Boolean(source.sheenRoughnessMap),
      texturePixelsChanged: false, liveMaterialChanged: false, allocatedPixelBytes: 0, perFrameWork: 0,
    });
  }

  function cloneMaterial(source, geometry) {
    const mergeCrown = needsCrownMerge104(source);
    if (mergeCrown) validateCrownMerge104(source, geometry);
    if (materials.has(source)) return materials.get(source);
    const material = source.clone();
    materials.set(source, material);
    report.materials++;
    for (const [property, value] of Object.entries(source)) {
      if (value?.isTexture && property !== 'normalMap' && !(mergeCrown && (property === 'map' || property === 'alphaMap'))) material[property] = cloneTexture(value);
    }
    if (mergeCrown) {
      const merged = mergeCrownAlpha104(source);
      material.map = merged.texture;
      material.alphaMap = null;
      const metadata = material.userData.referenceCrownMicrocontrast;
      material.userData.referenceCrownMicrocontrast = {
        ...metadata,
        export: { ...metadata.export, requiresExportOnlyAlphaMerge: false, coverageMergedToBaseColor: true, coverageTexCoord: 1 },
        alphaMerge: merged.metrics,
      };
    }
    if (source.normalMap) {
      const prepared = normalTexture(source.normalMap, source.normalScale?.x ?? 1, source.normalScale?.y ?? 1);
      material.normalMap = prepared.texture;
      material.normalScale.set(prepared.scaleX, prepared.scaleY);
    }
    normalizeSheen120(source, material);
    return material;
  }

  try {
    exportModel = model.clone(true);
    exportModel.traverse(object => {
      if (object.geometry) report.sharedGeometries++;
      if (!object.material) return;
      object.material = Array.isArray(object.material) ? object.material.map(material => cloneMaterial(material, object.geometry)) : cloneMaterial(object.material, object.geometry);
    });
    return { model: exportModel, report, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

export async function exportPortraitGLB(model, { onlyVisible = true, maxTextureSize = 2048 } = {}) {
  const prepared = createPortraitExport(model);
  try {
    return await new GLTFExporter().parseAsync(prepared.model, { binary: true, onlyVisible, maxTextureSize });
  } finally {
    prepared.dispose();
  }
}
