/**
 * props.js — the character's belongings:
 * the frilled headband + bow, the glowing halo, the big pillow
 * and the fluffy slippers with their ribbon bows.
 */
import * as THREE from 'three';
import { sweep, loft, ellipseRing, superEllipsoid, roundedBox, noise1, clamp, lerp, smoothstep, rng } from '../lib/geom.js';
import { headSurface, headDir, HEAD } from './head.js';

/* ══════════════════════════════════════════════════════════════
   A cloth bow: two loops, a knot and two tails
   ══════════════════════════════════════════════════════════════ */
export function makeBow(M, {
  width = 0.16, height = 0.085, depth = 0.05,
  knot = 0.035, tails = true, tailLen = 0.16, color = M.pink,
} = {}) {
  const g = new THREE.Group();

  const loopPath = (side) => {
    const pts = [];
    const n = 32;
    const cx = 0.050 + width * 0.40;
    const rx = width * 0.38;
    const ry = height * 0.46;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const a = t * Math.PI * 2;
      // teardrop: a = 0 sits at the knot, a = π at the outer tip
      const x = side * (cx - rx * Math.cos(a));
      const y = ry * Math.sin(a);
      const z = depth * 0.42 * Math.sin(a * 2) * 0.85;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  };

  for (const side of [-1, 1]) {
    const pts = loopPath(side);
    // an open sweep: the two ends meet at the knot and are hidden by it,
    // which avoids the frame seam of a closed ribbon
    const geo = sweep(pts, {
      radial: 8,
      closed: false,
      capStart: true,
      capEnd: true,
      frameNormals: pts.map(() => new THREE.Vector3(0, 0, 1)),
      profile: (t) => {
        // the ribbon is thin where it meets the knot
        const pinch = 0.34 + 0.66 * Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
        const band = Math.max(0.014, width * 0.30);
        return { rx: band * pinch + 0.004, ry: 0.0080 * pinch + 0.003 };
      },
      up: new THREE.Vector3(0, 0, 1),
    });
    const m = new THREE.Mesh(geo, color);
    m.castShadow = true;
    g.add(m);
  }

  // knot
  const knotMesh = new THREE.Mesh(
    (() => {
      const geo = superEllipsoid(knot * 0.62, knot * 0.5, knot * 0.45, 0.6, 0.6, 20, 14);
      return geo;
    })(),
    color
  );
  knotMesh.position.z = 0.004;
  knotMesh.castShadow = true;
  g.add(knotMesh);

  // tails
  if (tails) {
    for (const side of [-1, 1]) {
      const ctrl = [
        new THREE.Vector3(side * 0.012, -0.004, 0.0),
        new THREE.Vector3(side * 0.030, -tailLen * 0.45, -0.012),
        new THREE.Vector3(side * 0.046, -tailLen * 0.85, -0.026),
        new THREE.Vector3(side * 0.040, -tailLen, -0.030),
      ];
      const curve = new THREE.CatmullRomCurve3(ctrl, false, 'catmullrom', 0.5);
      const pts = curve.getSpacedPoints(16);
      const geo = sweep(pts, {
        radial: 8,
        frameNormals: pts.map(() => new THREE.Vector3(0, 0, 1)),
        profile: (t) => ({ rx: 0.020 * (1 - 0.35 * t) * (1 - smoothstep(0.9, 1, t)), ry: 0.006 * (1 - 0.4 * t) }),
      });
      const m = new THREE.Mesh(geo, color);
      m.castShadow = true;
      g.add(m);
    }
  }

  return g;
}

/* ══════════════════════════════════════════════════════════════
   Frilled headband
   ══════════════════════════════════════════════════════════════ */
export function makeHeadband(M) {
  const g = new THREE.Group();
  g.name = 'headband';

  const rows = [];
  const R = 54;
  const LACE = 20;
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    // the band sits just above the brow and dips over the ears
    const el = lerp(0.70, 0.96, t);
    const ring = [];
    for (let j = 0; j < R; j++) {
      const az = (j / R) * Math.PI * 2;
      const wave = Math.cos(az * LACE);
      const p = headSurface(az, el, 0.020 + 0.004 * Math.sin(t * Math.PI));
      // the lower edge is scalloped like lace
      const scallop = (1 - t) * 0.009;
      p.x += Math.sin(az) * wave * scallop;
      p.z += Math.cos(az) * wave * scallop;
      p.y -= (1 - t) * (0.5 + 0.5 * wave) * 0.005;
      ring.push(p);
    }
    rows.push(ring);
  }
  const band = new THREE.Mesh(loft(rows, { closed: true, capStart: false, capEnd: false }), M.collar);
  band.castShadow = true;
  band.receiveShadow = true;
  g.add(band);

  return g;
}

/* ══════════════════════════════════════════════════════════════
   Halo — a dark ring with a cyan light inside it
   ══════════════════════════════════════════════════════════════ */
export function makeHalo(M) {
  const g = new THREE.Group();
  g.name = 'halo';

  const R = 0.172;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.013, 10, 96),
    M.haloRing
  );
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = false;
  g.add(ring);

  // inner light strip
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(R - 0.010, 0.0045, 8, 96),
    M.haloGlow
  );
  glow.rotation.x = Math.PI / 2;
  g.add(glow);

  // faint outer bloom
  const bloom = new THREE.Mesh(
    new THREE.TorusGeometry(R - 0.008, 0.018, 8, 72),
    new THREE.MeshBasicMaterial({
      color: 0x4fc8ff, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    })
  );
  bloom.rotation.x = Math.PI / 2;
  bloom.renderOrder = 3;
  g.add(bloom);

  // soft aura disc lying in the ring's plane
  const aura = new THREE.Mesh(
    new THREE.CircleGeometry(R * 2.15, 48),
    new THREE.MeshBasicMaterial({
      map: M.glowMap, color: 0x7fe4ff, transparent: true, opacity: 0.30,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  aura.rotation.x = -Math.PI / 2;
  aura.renderOrder = 2;
  g.add(aura);

  g.userData.spin = ring;
  g.userData.aura = aura;
  g.userData.glow = glow;
  g.userData.bloom = bloom;
  return g;
}

/* ══════════════════════════════════════════════════════════════
   The pillow — a plump quilt with a gathered corner
   ══════════════════════════════════════════════════════════════ */
export function makePillow(M, { w = 0.21, h = 0.30, d = 0.085, gather = new THREE.Vector3(-0.20, 0.29, 0) } = {}) {
  const geo = superEllipsoid(w, h, d, 0.72, 0.66, 48, 30);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const rand = rng(31337);

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // plump the middle, pinch the edges
    const edge = Math.max(
      Math.abs(v.x) / w, Math.abs(v.y) / h, Math.abs(v.z) / d
    );
    const bulge = 1 + 0.13 * (1 - Math.pow(edge, 1.7));
    v.multiplyScalar(bulge);

    // soft wrinkles
    const wrinkle =
      noise1(v.x * 7.0 + v.y * 3.0, 1) * 0.010 +
      noise1(v.y * 6.0 - v.z * 4.0, 2) * 0.009 +
      noise1(v.z * 9.0 + v.x * 2.0, 3) * 0.006;
    v.addScaledVector(v.clone().normalize(), wrinkle * (0.35 + 0.65 * (1 - edge)));

    // gather the corner that the hand holds
    const dist = v.distanceTo(gather);
    if (dist < 0.24) {
      const t = 1 - smoothstep(0.0, 0.24, dist);
      const pull = Math.pow(t, 1.7) * 0.30;
      const dir = v.clone().sub(gather).normalize();
      v.addScaledVector(dir, -pull * dist * 0.5);
      // soft radial folds around the pinch
      const ang = Math.atan2(v.y - gather.y, v.x - gather.x);
      const fold = Math.sin(ang * 6.0) * t * 0.006;
      v.z += fold;
      v.y += Math.cos(ang * 6.0) * t * 0.005;
    }

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, M.pillow);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* ══════════════════════════════════════════════════════════════
   Fluffy slipper
   ══════════════════════════════════════════════════════════════ */
export function makeSlipper(M) {
  const g = new THREE.Group();
  g.name = 'slipper';

  // sole
  const sole = new THREE.Mesh(
    (() => {
      const geo = superEllipsoid(0.070, 0.014, 0.088, 0.5, 0.6, 28, 16);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const t = clamp((v.z + 0.088) / 0.176, 0, 1);
        v.x *= lerp(0.88, 1.04, t);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    })(),
    M.slipperSole
  );
  sole.position.set(0, -0.093, 0.030);
  sole.castShadow = true;
  g.add(sole);

  // fluffy upper
  const upper = new THREE.Mesh(
    (() => {
      const geo = superEllipsoid(0.072, 0.058, 0.090, 0.55, 0.62, 34, 22);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const t = clamp((v.z + 0.09) / 0.18, 0, 1);
        v.x *= lerp(0.86, 1.02, t);
        // fuzzy silhouette
        const bump = noise1(v.x * 22 + v.z * 15, 7) * 0.004 + noise1(v.y * 18 - v.z * 11, 9) * 0.004;
        v.addScaledVector(v.clone().normalize(), bump);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    })(),
    M.slipper
  );
  upper.position.set(0, -0.046, 0.028);
  upper.castShadow = true;
  upper.receiveShadow = true;
  g.add(upper);

  // ribbon bow on the vamp
  const bow = makeBow(M, {
    width: 0.062, height: 0.034, depth: 0.020,
    knot: 0.015, tails: false, color: M.pink,
  });
  bow.position.set(0, 0.006, 0.070);
  bow.rotation.x = -0.62;
  g.add(bow);

  return g;
}
