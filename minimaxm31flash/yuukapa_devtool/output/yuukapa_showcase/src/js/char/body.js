/**
 * body.js — skin, limbs, hands and feet.
 * Limbs are swept tapered tubes; the torso is a lofted set of
 * elliptical cross-sections.
 */
import * as THREE from 'three';
import { sweep, loft, ellipseRing, roundedBox, lerp, clamp, smoothstep } from '../lib/geom.js';

/* ── a tapered limb running down the local -Y axis ─────────── */
function limb(length, profile, { bend = 0, bendAxis = 'z', seg = 16, radial = 14, cap = true } = {}) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = new THREE.Vector3(0, -t * length, 0);
    const b = Math.sin(t * Math.PI) * bend;
    if (bendAxis === 'z') p.z += b; else p.x += b;
    pts.push(p);
  }
  return sweep(pts, {
    radial,
    profile: (t) => {
      const r = profile(t);
      return { rx: r, ry: r };
    },
    capStart: cap,
    capEnd: cap,
  });
}

function handGeometry(M, pose = 'relax') {
  const g = new THREE.Group();

  /* palm */
  const palm = new THREE.Mesh(roundedBox(0.050, 0.082, 0.026, 0.012, 4), M.skin);
  palm.position.set(0, -0.042, 0);
  palm.castShadow = true;
  g.add(palm);

  /* fingers */
  const fingerSpec = [
    { x: -0.019, len: 0.043, r: 0.0072, curl: 0.012 },
    { x: -0.006, len: 0.049, r: 0.0076, curl: 0.010 },
    { x: 0.007, len: 0.044, r: 0.0070, curl: 0.010 },
    { x: 0.019, len: 0.034, r: 0.0062, curl: 0.009 },
  ];
  fingerSpec.forEach((f, i) => {
    let curl = f.curl;
    let curlDir = 1;
    if (pose === 'grip') curl = 0.030;
    if (pose === 'relax') { curl = f.curl * 1.4; curlDir = 1; }
    if (pose === 'open') curl = 0.004;
    const geo = limb(f.len, (t) => f.r * (1 - 0.28 * t), { bend: curl, bendAxis: 'z', seg: 8, radial: 8 });
    const m = new THREE.Mesh(geo, M.skin);
    m.position.set(f.x, -0.080, 0.002 * i);
    m.castShadow = true;
    g.add(m);
  });

  /* thumb */
  const thumb = new THREE.Mesh(
    limb(0.036, (t) => 0.0072 * (1 - 0.25 * t), { bend: 0.010, bendAxis: 'x', seg: 8, radial: 8 }),
    M.skin
  );
  thumb.position.set(-0.024, -0.028, 0.004);
  thumb.rotation.z = pose === 'open' ? -0.95 : -0.60;
  thumb.rotation.x = 0.2;
  thumb.castShadow = true;
  g.add(thumb);

  return g;
}

function footGeometry(M) {
  const g = new THREE.Group();
  const foot = new THREE.Mesh(
    (() => {
      const geo = roundedBox(0.070, 0.048, 0.175, 0.022, 4);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const t = clamp((v.z + 0.0875) / 0.175, 0, 1);   // 0 heel → 1 toe
        v.x *= lerp(0.86, 1.06, t);
        v.y *= lerp(0.72, 0.95, t);
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    })(),
    M.skin
  );
  foot.position.set(0, -0.020, 0.030);
  foot.castShadow = true;
  g.add(foot);
  return g;
}

/**
 * Torso: a loft of elliptical rings from the hips to the neck.
 * Returned geometry is in "hips" space (y = 0 at the hip line).
 */
function torsoGeometry() {
  const rows = [
    { y: -0.03, rx: 0.106, rz: 0.084, z: 0.004 },
    { y: 0.05, rx: 0.114, rz: 0.088, z: 0.002 },
    { y: 0.12, rx: 0.100, rz: 0.076, z: 0.000 },
    { y: 0.20, rx: 0.101, rz: 0.075, z: 0.000 },
    { y: 0.28, rx: 0.108, rz: 0.081, z: 0.002 },
    { y: 0.35, rx: 0.115, rz: 0.086, z: 0.002 },
    { y: 0.41, rx: 0.112, rz: 0.080, z: 0.000 },
    { y: 0.455, rx: 0.072, rz: 0.064, z: -0.004 },
    { y: 0.492, rx: 0.050, rz: 0.048, z: -0.004 },
  ];
  const rings = rows.map((r) => ellipseRing(0, r.y, r.z, r.rx, r.rz, 24, { squashFront: 0.05 }));
  return loft(rings, { capStart: true, capEnd: true });
}

/**
 * Build the full body rig.
 * Returns the root group plus every named joint so the pose can be
 * driven from one place.
 */
export function buildBody(M) {
  const root = new THREE.Group();
  root.name = 'body';

  /* ── hierarchy ─────────────────────────────────────────── */
  const hips = new THREE.Group(); hips.name = 'hips'; hips.position.set(0, 0.92, 0);
  const chest = new THREE.Group(); chest.name = 'chest'; chest.position.set(0, 0.16, 0);
  const neck = new THREE.Group(); neck.name = 'neck'; neck.position.set(0, 0.28, 0);
  const headPivot = new THREE.Group(); headPivot.name = 'headPivot'; headPivot.position.set(0, 0.025, 0);
  root.add(hips);
  hips.add(chest);
  chest.add(neck);
  neck.add(headPivot);

  /* ── torso ─────────────────────────────────────────────── */
  const torso = new THREE.Mesh(torsoGeometry(), M.skin);
  torso.name = 'torso';
  torso.castShadow = true;
  torso.receiveShadow = true;
  hips.add(torso);

  /* ── neck ──────────────────────────────────────────────── */
  const neckMesh = new THREE.Mesh(
    limb(0.115, (t) => lerp(0.046, 0.036, t), { bend: 0.010, seg: 8, radial: 16 }),
    M.skin
  );
  neckMesh.name = 'neck';
  neckMesh.position.set(0, 0.01, 0.004);
  neckMesh.castShadow = true;
  neck.add(neckMesh);

  /* ── arms ──────────────────────────────────────────────── */
  const arms = {};
  for (const side of ['L', 'R']) {
    const s = side === 'L' ? 1 : -1;

    const shoulder = new THREE.Group();
    shoulder.name = 'shoulder' + side;
    shoulder.position.set(s * 0.106, 0.258, 0.004);
    chest.add(shoulder);

    // deltoid
    const delt = new THREE.Mesh(
      (() => {
        const geo = new THREE.SphereGeometry(0.045, 20, 16);
        const pos = geo.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i);
          v.x *= 0.94; v.y *= 1.05; v.z *= 0.96;
          pos.setXYZ(i, v.x, v.y, v.z);
        }
        geo.computeVertexNormals();
        return geo;
      })(),
      M.skin
    );
    delt.name = 'deltoid' + side;
    delt.castShadow = true;
    shoulder.add(delt);

    const upper = new THREE.Mesh(
      limb(0.250, (t) => lerp(0.040, 0.030, t) * (1 + 0.10 * Math.sin(t * Math.PI)), { bend: 0.006, seg: 12 }),
      M.skin
    );
    upper.name = 'upperArm' + side;
    upper.castShadow = true;
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.name = 'elbow' + side;
    elbow.position.set(0, -0.250, 0);
    shoulder.add(elbow);

    const fore = new THREE.Mesh(
      limb(0.230, (t) => lerp(0.032, 0.023, t) * (1 + 0.12 * Math.sin(t * Math.PI * 0.9)), { bend: 0.004, seg: 12 }),
      M.skin
    );
    fore.name = 'foreArm' + side;
    fore.castShadow = true;
    elbow.add(fore);

    const wrist = new THREE.Group();
    wrist.name = 'wrist' + side;
    wrist.position.set(0, -0.230, 0);
    elbow.add(wrist);

    const hand = handGeometry(M, side === 'L' ? 'grip' : 'relax');
    hand.name = 'hand' + side;
    hand.castShadow = true;
    wrist.add(hand);

    arms[side] = { shoulder, elbow, wrist, hand };
  }

  /* ── legs ──────────────────────────────────────────────── */
  const legs = {};
  for (const side of ['L', 'R']) {
    const s = side === 'L' ? 1 : -1;

    const hip = new THREE.Group();
    hip.name = 'hip' + side;
    hip.position.set(s * 0.066, -0.005, 0);
    hips.add(hip);

    const thigh = new THREE.Mesh(
      limb(0.400, (t) => lerp(0.064, 0.043, t) * (1 + 0.07 * Math.sin(t * Math.PI)), { bend: 0.004, seg: 12, radial: 16 }),
      M.skin
    );
    thigh.name = 'thigh' + side;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.name = 'knee' + side;
    knee.position.set(0, -0.400, 0);
    hip.add(knee);

    const shin = new THREE.Mesh(
      limb(0.340, (t) => lerp(0.045, 0.026, t) * (1 + 0.11 * Math.sin(t * Math.PI * 0.8)), { bend: 0.004, seg: 12, radial: 16 }),
      M.skin
    );
    shin.name = 'shin' + side;
    shin.castShadow = true;
    knee.add(shin);

    const ankle = new THREE.Group();
    ankle.name = 'ankle' + side;
    ankle.position.set(0, -0.340, 0);
    knee.add(ankle);

    const foot = footGeometry(M);
    foot.name = 'foot' + side;
    ankle.add(foot);

    legs[side] = { hip, knee, ankle, foot };
  }

  return { root, hips, chest, neck, headPivot, arms, legs, torso };
}
