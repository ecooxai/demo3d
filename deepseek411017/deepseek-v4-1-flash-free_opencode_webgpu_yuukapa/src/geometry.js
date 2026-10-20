import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * Builds a smooth, capped loft from horizontal elliptical rings.
 * Each ring: { y, rx, rz, cx = 0, cz = 0 }
 */
export function makeLoftGeometry(rings, radialSegments = 64, caps = true, uvRepeat = [1, 1]) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const cols = radialSegments + 1;
  const ascending = rings[rings.length - 1].y >= rings[0].y;

  for (let r = 0; r < rings.length; r += 1) {
    const ring = rings[r];
    for (let i = 0; i <= radialSegments; i += 1) {
      const a = (i / radialSegments) * Math.PI * 2;
      positions.push(
        (ring.cx ?? 0) + Math.cos(a) * ring.rx,
        ring.y,
        (ring.cz ?? 0) + Math.sin(a) * ring.rz,
      );
      uvs.push((i / radialSegments) * uvRepeat[0], (r / (rings.length - 1)) * uvRepeat[1]);
    }
  }

  for (let r = 0; r < rings.length - 1; r += 1) {
    for (let i = 0; i < radialSegments; i += 1) {
      const a = r * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (ascending) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
  }

  if (caps) {
    const bottom = rings[0];
    const top = rings[rings.length - 1];
    const bottomCenter = positions.length / 3;
    positions.push(bottom.cx ?? 0, bottom.y, bottom.cz ?? 0);
    uvs.push(0.5, 0);
    const topCenter = positions.length / 3;
    positions.push(top.cx ?? 0, top.y, top.cz ?? 0);
    uvs.push(0.5, 1);

    for (let i = 0; i < radialSegments; i += 1) {
      const a = i;
      const b = i + 1;
      if (ascending) {
        indices.push(bottomCenter, b, a);
        const topA = (rings.length - 1) * cols + i;
        indices.push(topCenter, topA, topA + 1);
      } else {
        indices.push(bottomCenter, a, b);
        const topA = (rings.length - 1) * cols + i;
        indices.push(topCenter, topA + 1, topA);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * A round, tapered tube following a Catmull-Rom curve. Ideal for limbs and piping.
 */
export function makeTubeGeometry(points, radii, tubularSegments = 32, radialSegments = 10) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments;
    const p = curve.getPointAt(t);
    const n = frames.normals[Math.min(i, tubularSegments)];
    const b = frames.binormals[Math.min(i, tubularSegments)];
    const radius = sampleProfile(radii, t);

    for (let j = 0; j <= radialSegments; j += 1) {
      const a = (j / radialSegments) * Math.PI * 2;
      positions.push(
        p.x + n.x * Math.cos(a) * radius + b.x * Math.sin(a) * radius,
        p.y + n.y * Math.cos(a) * radius + b.y * Math.sin(a) * radius,
        p.z + n.z * Math.cos(a) * radius + b.z * Math.sin(a) * radius,
      );
      uvs.push(i / tubularSegments, j / radialSegments);
    }
  }

  const cols = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const start = curve.getPointAt(0);
  const end = curve.getPointAt(1);
  const startIndex = positions.length / 3;
  positions.push(start.x, start.y, start.z);
  uvs.push(0.5, 0.5);
  const endIndex = positions.length / 3;
  positions.push(end.x, end.y, end.z);
  uvs.push(0.5, 0.5);

  for (let j = 0; j < radialSegments; j += 1) {
    indices.push(startIndex, j, j + 1);
    const top = tubularSegments * cols + j;
    indices.push(endIndex, top + 1, top);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Flat, tapered, ribbon-like hair lock with a rounded cross section.
 * Facing controls which direction the lock's thickness points.
 */
export function makeHairLockGeometry(points, widths, thicknesses, facingCenter, tubularSegments = 36, radialSegments = 8) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments;
    const p = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    let facing = p.clone().sub(facingCenter);
    facing.sub(tangent.clone().multiplyScalar(facing.dot(tangent)));
    if (facing.lengthSq() < 0.0001) facing.set(0, 0, 1);
    facing.normalize();
    const side = new THREE.Vector3().crossVectors(tangent, facing).normalize();
    if (side.lengthSq() < 0.0001) side.set(1, 0, 0);
    const width = sampleProfile(widths, t);
    const thickness = sampleProfile(thicknesses, t);

    for (let j = 0; j <= radialSegments; j += 1) {
      const a = (j / radialSegments) * Math.PI * 2;
      positions.push(
        p.x + side.x * Math.cos(a) * width + facing.x * Math.sin(a) * thickness,
        p.y + side.y * Math.cos(a) * width + facing.y * Math.sin(a) * thickness,
        p.z + side.z * Math.cos(a) * width + facing.z * Math.sin(a) * thickness,
      );
      uvs.push(i / tubularSegments, j / radialSegments);
    }
  }

  const cols = radialSegments + 1;
  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const start = curve.getPointAt(0);
  const end = curve.getPointAt(1);
  const startIndex = positions.length / 3;
  positions.push(start.x, start.y, start.z);
  uvs.push(0.5, 0.5);
  const endIndex = positions.length / 3;
  positions.push(end.x, end.y, end.z);
  uvs.push(0.5, 0.5);
  for (let j = 0; j < radialSegments; j += 1) {
    indices.push(startIndex, j, j + 1);
    const top = tubularSegments * cols + j;
    indices.push(endIndex, top + 1, top);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Closed scalloped ring, used for the pajama hems and cuffs.
 */
export function makeScallopedRing(radiusX, radiusZ, y, scallops = 9, amplitude = 0.035, tubeRadius = 0.018, centerX = 0, centerZ = 0) {
  const points = [];
  const count = scallops * 4;
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const wave = Math.max(0, Math.sin(a * scallops)) * amplitude;
    points.push(new THREE.Vector3(
      centerX + Math.cos(a) * (radiusX + wave),
      y + Math.sin(a * scallops) * amplitude * 0.32,
      centerZ + Math.sin(a) * (radiusZ + wave),
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  return new THREE.TubeGeometry(curve, count * 3, tubeRadius, 6, true);
}

export function sampleProfile(profile, t) {
  if (!Array.isArray(profile)) return profile;
  if (profile.length === 1) return profile[0];
  const scaled = THREE.MathUtils.clamp(t, 0, 1) * (profile.length - 1);
  const lo = Math.floor(scaled);
  const hi = Math.min(profile.length - 1, lo + 1);
  const m = scaled - lo;
  const eased = m * m * (3 - 2 * m);
  return THREE.MathUtils.lerp(profile[lo], profile[hi], eased);
}

export function createRoundedBox(width, height, depth, radius = 0.1, segments = 5) {
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

export function alignObjectToDirection(object, direction, length = null) {
  const dir = direction.clone().normalize();
  object.quaternion.setFromUnitVectors(Y_AXIS, dir);
  if (length !== null) object.position.copy(dir.multiplyScalar(length * 0.5));
}

export function makePetalShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.84, -height * 0.04, width * 0.76, height * 0.62, width * 0.15, height);
  shape.bezierCurveTo(width * 0.04, height * 0.76, -width * 0.04, height * 0.76, -width * 0.12, height);
  shape.bezierCurveTo(-width * 0.68, height * 0.56, -width * 0.82, -height * 0.04, 0, 0);
  return shape;
}

export function smoothstep(min, max, value) {
  const t = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Continuous hair-fringe shell that hugs an ellipsoid head.
 * The lower edge is a smooth, controllable hairline rather than a row of separate teeth.
 */
export function makeHairFringeGeometry({
  radiusX = 0.63,
  radiusY = 0.74,
  radiusZ = 0.63,
  centerY = 0.025,
  centerZ = -0.012,
  angleMin = -1.18,
  angleMax = 1.18,
  topTheta = 0.12,
  rows = 30,
  cols = 72,
  bottomY = () => 0.16,
} = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= rows; j += 1) {
    const t = j / rows;
    const eased = Math.pow(t, 0.92);
    for (let i = 0; i <= cols; i += 1) {
      const u = i / cols;
      const a = THREE.MathUtils.lerp(angleMin, angleMax, u);
      const edge = bottomY(a, u);
      const cosTheta = THREE.MathUtils.clamp((edge - centerY) / radiusY, -0.995, 0.995);
      const thetaEdge = Math.acos(cosTheta);
      const theta = THREE.MathUtils.lerp(topTheta, thetaEdge, eased);
      const sinTheta = Math.sin(theta);
      positions.push(
        Math.sin(a) * sinTheta * radiusX,
        centerY + Math.cos(theta) * radiusY,
        centerZ + Math.cos(a) * sinTheta * radiusZ,
      );
      uvs.push(u, 1 - t);
    }
  }

  const stride = cols + 1;
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const a = j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * A long, flowing hair cape built from continuous bands. Designed to sit behind
 * the body with scalloped tips, so the back reads as a groomed mass instead of
 * a stack of disconnected strips.
 */
export function makeHairCapeGeometry({
  topY = 0.54,
  radiusTopX = 0.5,
  radiusTopZ = 0.42,
  centerTopZ = -0.04,
  bottomY = -3.08,
  radiusBottomX = 0.63,
  radiusBottomZ = 0.26,
  centerBottomZ = -0.42,
  angleMin = -1.24,
  angleMax = 1.24,
  rows = 44,
  cols = 72,
  tipWave = 0.18,
} = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= rows; j += 1) {
    const t = j / rows;
    const eased = Math.pow(t, 0.9);
    for (let i = 0; i <= cols; i += 1) {
      const u = i / cols;
      const a = THREE.MathUtils.lerp(angleMin, angleMax, u);
      const side = Math.abs(a) / Math.max(0.0001, angleMax);
      const localBottom = bottomY - tipWave * Math.pow(Math.abs(Math.sin(a * 3.6 + 0.2)), 1.4) - 0.16 * side;
      const y = THREE.MathUtils.lerp(topY, localBottom, eased);
      const flare = Math.sin(Math.PI * Math.min(1, t * 1.04));
      const rx = THREE.MathUtils.lerp(radiusTopX, radiusBottomX, t) + flare * 0.09;
      const rz = THREE.MathUtils.lerp(radiusTopZ, radiusBottomZ, t);
      const cz = THREE.MathUtils.lerp(centerTopZ, centerBottomZ, t);
      positions.push(
        Math.sin(a) * rx,
        y,
        cz - Math.cos(a) * rz,
      );
      uvs.push(u, 1 - t);
    }
  }

  const stride = cols + 1;
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const a = j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Soft cushion: a rounded box whose faces bulge toward the centre, so the
 * pillow reads as stuffed fabric instead of a rigid slab.
 */
export function makePillowGeometry(width = 1.6, height = 1.88, depth = 0.5, radius = 0.26, segments = 20) {
  const geometry = new RoundedBoxGeometry(width, height, depth, segments, radius);
  const position = geometry.attributes.position;
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const nx = THREE.MathUtils.clamp(x / halfW, -1, 1);
    const ny = THREE.MathUtils.clamp(y / halfH, -1, 1);
    const bulge = 1 + 0.5 * Math.pow(1 - nx * nx, 1.15) * Math.pow(1 - ny * ny, 1.15);
    const cornerSettle = 1 - 0.18 * Math.pow(nx * ny, 2);
    position.setZ(i, z * bulge * cornerSettle);
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
