import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Three r186's normal-map handedness conversion uses drawImage directly. The
// portrait's normal maps are original RGBA8 DataTextures, whose image is a pixel
// record instead of a CanvasImageSource. Prepare temporary, export-only images;
// keep the considerably larger geometry buffers shared with the live model.
export function createPortraitExport(model) {
  const materials = new Map(), textures = new Map(), normalTextures = new Map();
  const ownedTextures = new Set(), ownedCanvases = new Set();
  const report = { materials: 0, textures: 0, normalCanvases: 0, sharedGeometries: 0, normalScaleBakes: [] };
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

  function cloneMaterial(source) {
    if (materials.has(source)) return materials.get(source);
    const material = source.clone();
    materials.set(source, material);
    report.materials++;
    for (const [property, value] of Object.entries(source)) {
      if (value?.isTexture && property !== 'normalMap') material[property] = cloneTexture(value);
    }
    if (source.normalMap) {
      const prepared = normalTexture(source.normalMap, source.normalScale?.x ?? 1, source.normalScale?.y ?? 1);
      material.normalMap = prepared.texture;
      material.normalScale.set(prepared.scaleX, prepared.scaleY);
    }
    return material;
  }

  try {
    exportModel = model.clone(true);
    exportModel.traverse(object => {
      if (object.geometry) report.sharedGeometries++;
      if (!object.material) return;
      object.material = Array.isArray(object.material) ? object.material.map(cloneMaterial) : cloneMaterial(object.material);
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
