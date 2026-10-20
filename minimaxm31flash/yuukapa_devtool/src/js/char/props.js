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
   The pillow — a large soft quilt held by one corner, draping down
   ══════════════════════════════════════════════════════════════ */
export function makePillow(M, {
  w = 0.34, h = 0.66, d = 0.10, gather = new THREE.Vector3(-0.16, 0.30, 0),
} = {}) {
  const rows = 34, cols = 26;
  const verts = [], idx = [], uvs = [];
  const rand = rng(2468);

  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    // the sheet widens as it falls away from the gathered corner
    const wid = lerp(0.035, w, Math.pow(t, 0.62));
    const drop = t * h;
    for (let j = 0; j <= cols; j++) {
      const s = j / cols;
      const u = (s - 0.5) * 2;              // -1 .. 1 across the sheet

      // gather: everything collapses towards the pinch point
      const gatherK = 1 - smoothstep(0.0, 0.16, t);
      const pinch = new THREE.Vector3(gather.x, gather.y, gather.z);

      // gentle drape waves across the cloth
      const wave = Math.sin(u * 2.4 + t * 1.6) * 0.028 * smoothstep(0.05, 0.6, t);
      const wave2 = Math.cos(s * Math.PI * 2.2) * 0.020 * smoothstep(0.1, 0.8, t);

      // the sheet bulges outwards in the middle
      const bulge = Math.sin(Math.PI * Math.min(1, t * 1.05)) * (1 - u * u) * d;

      let x = u * wid * 0.5 + wave * 0.4;
      let y = -drop;
      let z = bulge + wave2;

      // pull the top rows into the pinch
      x = lerp(x, pinch.x, gatherK * 0.92);
      y = lerp(y, pinch.y, gatherK * 0.92);
      z = lerp(z, pinch.z, gatherK * 0.92);

      verts.push(x, y, z);
      uvs.push(s, t);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j, b = a + 1;
      const c = (i + 1) * (cols + 1) + j + 1, d2 = (i + 1) * (cols + 1) + j;
      idx.push(a, d2, b, b, d2, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, M.pillow);
  mesh.name = 'pillow';
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
      const geo = superEllipsoid(0.058, 0.012, 0.073, 0.5, 0.6, 28, 16);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const t = clamp((v.z + 0.073) / 0.146, 0, 1);
        v.x *= lerp(0.88, 1.04, t);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    })(),
    M.slipperSole
  );
  sole.position.set(0, -0.090, 0.026);
  sole.castShadow = true;
  g.add(sole);

  // fluffy upper
  const upper = new THREE.Mesh(
    (() => {
      const geo = superEllipsoid(0.060, 0.048, 0.076, 0.55, 0.62, 34, 22);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const t = clamp((v.z + 0.076) / 0.152, 0, 1);
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
  upper.position.set(0, -0.048, 0.024);
  upper.castShadow = true;
  upper.receiveShadow = true;
  g.add(upper);

  // ribbon bow on the vamp
  const bow = makeBow(M, {
    width: 0.050, height: 0.028, depth: 0.017,
    knot: 0.013, tails: false, color: M.pink,
  });
  bow.position.set(0, 0.002, 0.060);
  bow.rotation.x = -0.70;
  g.add(bow);

  return g;
}
