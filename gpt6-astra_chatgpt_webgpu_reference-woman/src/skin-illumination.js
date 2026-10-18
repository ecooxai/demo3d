import * as THREE from 'three';

// Optional, reversible compensation for the broad diffuse illumination that is
// applied a second time to photographed skin. This is an approximation of the
// current studio lighting, not a recovery of physically measured skin albedo.
// It changes neither the atlas correspondences nor the authored geometry.
const originals = new WeakMap();
const FIELD_WIDTH = 192;
const FIELD_HEIGHT = 288;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const luminance = c => .2126 * c.r + .7152 * c.g + .0722 * c.b;
const linear = Float32Array.from({ length: 256 }, (_, i) => {
  const x = i / 255;
  return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
});
const encoded = Uint8ClampedArray.from({ length: 65536 }, (_, i) => {
  const x = i / 65535;
  return 255 * (x <= .0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - .055);
});

function studioIrradiance(scene) {
  const directional = [], hemisphere = [];
  // The original procedural environment has broad gray studio panels. A small
  // constant approximates its diffuse contribution; no image analysis is used.
  let constant = scene.environment ? (scene.environmentIntensity ?? 1) * Math.PI * .18 : 0;
  scene.traverseVisible(light => {
    if (!light.isLight || light.intensity <= 0) return;
    if (light.isAmbientLight) constant += luminance(light.color) * light.intensity;
    if (light.isDirectionalLight) {
      light.target.updateWorldMatrix(true, false);
      const direction = new THREE.Vector3().setFromMatrixPosition(light.matrixWorld)
        .sub(new THREE.Vector3().setFromMatrixPosition(light.target.matrixWorld)).normalize();
      directional.push({ x: direction.x, y: direction.y, z: direction.z,
        power: luminance(light.color) * light.intensity });
    }
    if (light.isHemisphereLight) {
      const direction = new THREE.Vector3().setFromMatrixPosition(light.matrixWorld).normalize();
      hemisphere.push({ x: direction.x, y: direction.y, z: direction.z,
        sky: luminance(light.color) * light.intensity,
        ground: luminance(light.groundColor) * light.intensity });
    }
  });
  const sample = (x, y, z) => {
    let irradiance = constant;
    for (const light of directional)
      irradiance += light.power * Math.max(0, x * light.x + y * light.y + z * light.z);
    for (const light of hemisphere) {
      const t = clamp((x * light.x + y * light.y + z * light.z) * .5 + .5, 0, 1);
      irradiance += light.ground * (1 - t) + light.sky * t;
    }
    return Math.max(.0001, irradiance);
  };
  return { sample, directionalCount: directional.length, hemisphereCount: hemisphere.length, constant };
}

function rasterizeFace(face, atlas, width, height) {
  const geometry = face.geometry;
  const { position, normal, uv } = geometry.attributes;
  const index = geometry.index;
  if (!position || !normal || !uv || !index) throw new Error('Skin compensation requires an indexed face with normals and atlas UVs.');
  const count = width * height;
  const depth = new Float32Array(count).fill(-Infinity);
  const nx = new Float32Array(count), ny = new Float32Array(count), nz = new Float32Array(count);
  const px = new Float32Array(count), py = new Float32Array(count);
  const validity = new Uint8Array(count);
  const materials = Array.isArray(face.material) ? face.material : [face.material];
  const groups = geometry.groups.length ? geometry.groups : [{ start: 0, count: index.count, materialIndex: 0 }];
  let triangles = 0;
  for (const group of groups) {
    if (materials[group.materialIndex]?.map !== atlas) continue;
    for (let offset = group.start; offset < group.start + group.count; offset += 3) {
      const a = index.getX(offset), b = index.getX(offset + 1), c = index.getX(offset + 2);
      const za = position.getZ(a), zb = position.getZ(b), zc = position.getZ(c);
      if (za + zb + zc <= 0) continue;
      const ax = uv.getX(a) * (width - 1), ay = (1 - uv.getY(a)) * (height - 1);
      const bx = uv.getX(b) * (width - 1), by = (1 - uv.getY(b)) * (height - 1);
      const cx = uv.getX(c) * (width - 1), cy = (1 - uv.getY(c)) * (height - 1);
      const area = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (!Number.isFinite(area) || Math.abs(area) < 1e-8) continue;
      const x0 = Math.max(0, Math.ceil(Math.min(ax, bx, cx))), x1 = Math.min(width - 1, Math.floor(Math.max(ax, bx, cx)));
      const y0 = Math.max(0, Math.ceil(Math.min(ay, by, cy))), y1 = Math.min(height - 1, Math.floor(Math.max(ay, by, cy)));
      const inv = 1 / area;
      triangles++;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) * inv;
        const v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) * inv;
        const w = 1 - u - v;
        if (u < -1e-5 || v < -1e-5 || w < -1e-5) continue;
        const k = y * width + x, z = u * za + v * zb + w * zc;
        if (z <= depth[k]) continue;
        const X = u * normal.getX(a) + v * normal.getX(b) + w * normal.getX(c);
        const Y = u * normal.getY(a) + v * normal.getY(b) + w * normal.getY(c);
        const Z = u * normal.getZ(a) + v * normal.getZ(b) + w * normal.getZ(c);
        const length = Math.hypot(X, Y, Z);
        if (!Number.isFinite(length) || length < .5 || Z <= .05) continue;
        depth[k] = z; nx[k] = X / length; ny[k] = Y / length; nz[k] = Z / length;
        px[k] = u * position.getX(a) + v * position.getX(b) + w * position.getX(c);
        py[k] = u * position.getY(a) + v * position.getY(b) + w * position.getY(c);
        validity[k] = 1;
      }
    }
  }
  // Inward distance fades the correction before either the eye apertures or
  // the atlas silhouette. The nearest valid texel is also left unmodified.
  const distance = new Uint8Array(count);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const k = y * width + x;
    distance[k] = validity[k] && x && y && x < width - 1 && y < height - 1
      ? Math.min(12, distance[k - 1] + 1, distance[k - width] + 1) : 0;
  }
  for (let y = height - 2; y > 0; y--) for (let x = width - 2; x > 0; x--) {
    const k = y * width + x;
    if (validity[k]) distance[k] = Math.min(distance[k], distance[k + 1] + 1, distance[k + width] + 1);
  }
  return { nx, ny, nz, px, py, validity, distance, triangles };
}

function smoothField(field, valid, width, height) {
  const radius = 5;
  const kernel = Float32Array.from({ length: radius * 2 + 1 }, (_, i) => Math.exp(-.5 * ((i - radius) / 2.4) ** 2));
  const pass = new Float32Array(field.length), passWeight = new Float32Array(field.length), result = new Float32Array(field.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sum = 0, weight = 0;
    for (let d = -radius; d <= radius; d++) {
      const xx = x + d;
      if (xx < 0 || xx >= width) continue;
      const k = y * width + xx, a = kernel[d + radius] * valid[k];
      sum += field[k] * a; weight += a;
    }
    const k = y * width + x; pass[k] = sum; passWeight[k] = weight;
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let sum = 0, weight = 0;
    for (let d = -radius; d <= radius; d++) {
      const yy = y + d;
      if (yy < 0 || yy >= height) continue;
      const k = yy * width + x, a = kernel[d + radius];
      sum += pass[k] * a; weight += passWeight[k] * a;
    }
    result[y * width + x] = weight ? sum / weight : 1;
  }
  return result;
}

/**
 * Call after applyReferenceSkin() and after the head and lights enter the scene.
 * This is an optional diagnostic: strength 0 restores the original bytes, and
 * every nonzero call starts from that same original, so changes never compound.
 * Re-run explicitly if the studio lighting or head pose changes; it is not an
 * animation callback. The shared eye/lip atlas remains unchanged in masked areas.
 */
export function compensateReferenceSkin(head, scene, { strength = .7 } = {}) {
  const start = performance.now();
  if (!Number.isFinite(strength)) throw new Error('Skin compensation strength must be finite.');
  strength = clamp(strength, 0, 1);
  const face = head.getObjectByName('continuous-face');
  const materials = face && (Array.isArray(face.material) ? face.material : [face.material]);
  const atlas = materials?.find(material => material.map?.isCanvasTexture)?.map;
  const canvas = atlas?.image;
  if (!face || !canvas?.getContext) throw new Error('Call compensateReferenceSkin after the reference face atlas has been baked.');
  const context = canvas.getContext('2d');
  let saved = originals.get(atlas);
  if (!saved) {
    saved = { source: context.getImageData(0, 0, canvas.width, canvas.height), width: canvas.width, height: canvas.height };
    originals.set(atlas, saved);
  }
  if (canvas.width !== saved.width || canvas.height !== saved.height) throw new Error('The face atlas dimensions changed after the original snapshot.');
  const metrics = { method: 'Bounded, low-frequency inverse of approximate live diffuse irradiance; not verified photographic albedo',
    strength, field: [FIELD_WIDTH, FIELD_HEIGHT], atlas: [canvas.width, canvas.height], applied: strength > 0,
    sourceSnapshotBytes: saved.source.data.byteLength, correctedTexels: 0, minGain: 1, maxGain: 1, meanGain: 1 };
  if (strength === 0) {
    context.putImageData(saved.source, 0, 0); atlas.needsUpdate = true;
    metrics.elapsedMs = performance.now() - start;
    head.userData.skinIllumination = metrics;
    return metrics;
  }
  scene.updateMatrixWorld(true); face.updateWorldMatrix(true, false);
  const field = rasterizeFace(face, atlas, FIELD_WIDTH, FIELD_HEIGHT);
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(face.matrixWorld).elements;
  const lights = studioIrradiance(scene);
  const forwardLength = Math.hypot(normalMatrix[6], normalMatrix[7], normalMatrix[8]);
  const reference = lights.sample(normalMatrix[6] / forwardLength, normalMatrix[7] / forwardLength, normalMatrix[8] / forwardLength);
  const irradiance = new Float32Array(field.validity.length);
  for (let k = 0; k < irradiance.length; k++) {
    if (!field.validity[k]) continue;
    const nx = field.nx[k], ny = field.ny[k], nz = field.nz[k];
    const X = normalMatrix[0] * nx + normalMatrix[3] * ny + normalMatrix[6] * nz;
    const Y = normalMatrix[1] * nx + normalMatrix[4] * ny + normalMatrix[7] * nz;
    const Z = normalMatrix[2] * nx + normalMatrix[5] * ny + normalMatrix[8] * nz;
    const length = Math.hypot(X, Y, Z);
    irradiance[k] = lights.sample(X / length, Y / length, Z / length);
  }
  const broad = smoothField(irradiance, field.validity, FIELD_WIDTH, FIELD_HEIGHT);
  const gain = new Float32Array(irradiance.length).fill(1);
  let validCount = 0;
  for (let k = 0; k < gain.length; k++) {
    if (!field.validity[k]) continue;
    validCount++;
    const x = field.px[k], y = field.py[k];
    const facing = smooth((field.nz[k] - .38) / .34);
    const interior = smooth((field.distance[k] - 1) / 3);
    const region = smooth((.72 - Math.abs(x)) / .12) * smooth((y + 1.14) / .16) * (1 - smooth((y - .30) / .18));
    // Raised lip and naris meshes share this atlas but have different normals
    // from the continuous face. Their feature positions are manually authored
    // in face.js; keep both their pigment and existing shading untouched.
    const mouth = smooth((Math.hypot(x / .30, (y + .795) / .135) - .80) / .35);
    const nostrils = smooth((Math.hypot(x / .20, (y + .545) / .078) - .70) / .70);
    let continuity = 1;
    for (const neighbor of [k - 1, k + 1, k - FIELD_WIDTH, k + FIELD_WIDTH]) {
      if (!field.validity[neighbor]) continue;
      const dot = field.nx[k] * field.nx[neighbor] + field.ny[k] * field.ny[neighbor] + field.nz[k] * field.nz[neighbor];
      continuity = Math.min(continuity, smooth((dot - .70) / .25));
    }
    const mask = facing * interior * region * mouth * nostrils * continuity;
    gain[k] = 1 + (clamp(reference / broad[k], .90, 1.25) - 1) * strength * mask;
  }
  const output = context.createImageData(canvas.width, canvas.height);
  output.data.set(saved.source.data);
  const xs = new Uint16Array(canvas.width), tx = new Float32Array(canvas.width);
  for (let x = 0; x < canvas.width; x++) {
    const u = x / (canvas.width - 1) * (FIELD_WIDTH - 1);
    xs[x] = Math.min(FIELD_WIDTH - 2, Math.floor(u)); tx[x] = u - xs[x];
  }
  let gainSum = 0;
  for (let y = 0; y < canvas.height; y++) {
    const v = y / (canvas.height - 1) * (FIELD_HEIGHT - 1), row = Math.min(FIELD_HEIGHT - 2, Math.floor(v)), ty = v - row;
    for (let x = 0; x < canvas.width; x++) {
      const k = row * FIELD_WIDTH + xs[x], fx = tx[x];
      const g = ((1 - fx) * gain[k] + fx * gain[k + 1]) * (1 - ty)
        + ((1 - fx) * gain[k + FIELD_WIDTH] + fx * gain[k + FIELD_WIDTH + 1]) * ty;
      if (Math.abs(g - 1) < 1e-7) continue;
      const p = (y * canvas.width + x) * 4;
      for (let channel = 0; channel < 3; channel++)
        output.data[p + channel] = encoded[Math.min(65535, Math.round(linear[saved.source.data[p + channel]] * g * 65535))];
      metrics.correctedTexels++; gainSum += g;
      metrics.minGain = Math.min(metrics.minGain, g); metrics.maxGain = Math.max(metrics.maxGain, g);
    }
  }
  context.putImageData(output, 0, 0); atlas.needsUpdate = true;
  metrics.meanGain = metrics.correctedTexels ? gainSum / metrics.correctedTexels : 1;
  metrics.validFieldTexels = validCount; metrics.frontTriangles = field.triangles;
  metrics.directionalLights = lights.directionalCount; metrics.hemisphereLights = lights.hemisphereCount;
  metrics.constantIrradiance = lights.constant; metrics.forwardIrradiance = reference;
  metrics.elapsedMs = performance.now() - start;
  head.userData.skinIllumination = metrics;
  return metrics;
}
