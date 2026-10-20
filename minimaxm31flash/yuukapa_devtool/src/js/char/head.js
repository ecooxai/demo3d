/**
 * head.js — the sculpted anime head and the painted face patch.
 * The head is one continuous mathematical surface; the face is a
 * conforming patch of that same surface, so the artwork can never
 * float off the model.
 */
import * as THREE from 'three';
import { sculptedSphere, sculptedPatch, smoothstep, clamp, lerp } from '../lib/geom.js';

export const HEAD = {
  halfW: 0.0925,   // x half width
  halfH: 0.1135,   // y half height
  halfD: 0.1000,   // z half depth
  center: new THREE.Vector3(0, 0.185, 0),  // head centre inside the head pivot
};

/**
 * Maps a point on the unit sphere onto the stylised head surface.
 * Reads as: round cranium, flat-ish face plane, small pointed chin.
 */
export function headSculpt(v) {
  const d = v.clone().normalize();
  const H = HEAD;

  let x = d.x * H.halfW;
  let y = d.y * H.halfH;
  let z = d.z * H.halfD;

  // jaw taper towards the chin
  const jaw = smoothstep(-0.02, -0.98, d.y);
  x *= 1 - 0.62 * jaw;
  z *= 1 - 0.30 * jaw;
  y *= 1 - 0.05 * jaw;

  // chin pushed slightly forward
  z += 0.017 * jaw * jaw;

  // flatten the very bottom so the jaw has a plane
  if (d.y < -0.72) {
    const t = (d.y + 0.72) / 0.28;
    y = lerp(-H.halfH * 0.70, y, t * t);
  }
  // soften the crease where the jaw meets the chin
  const chin = smoothstep(-0.55, -0.95, d.y) * smoothstep(0.55, 0.05, Math.abs(d.x));
  z += 0.006 * chin;
  y += 0.004 * chin;

  // flatten the face plane a touch
  const front = Math.max(0, d.z);
  z -= 0.013 * front * front * (1 - Math.abs(d.y) * 0.45);

  // broader cranium
  const crown = smoothstep(0.15, 0.98, d.y);
  x *= 1 + 0.085 * crown;
  z *= 1 + 0.045 * crown;

  // rounder occiput
  const back = Math.max(0, -d.z);
  z -= 0.010 * back * back * (1 - crown * 0.5);

  // slight temple hollow
  const temple = smoothstep(0.15, 0.75, Math.abs(d.x)) * (1 - crown) * Math.max(0, d.y + 0.2);
  x -= Math.sign(d.x) * 0.0035 * temple;

  v.set(x, y, z);
  return v;
}

/** Outward surface normal of the head at a given direction (approximate). */
export function headNormal(dir) {
  const e = 0.012;
  const a = new THREE.Vector3().copy(dir).normalize();
  const b = new THREE.Vector3(a.x + e, a.y, a.z).normalize();
  const c = new THREE.Vector3(a.x, a.y + e, a.z).normalize();
  const p0 = headSculpt(a.clone());
  const p1 = headSculpt(b.clone());
  const p2 = headSculpt(c.clone());
  const n = new THREE.Vector3()
    .crossVectors(p2.sub(p0), p1.sub(p0))
    .normalize();
  if (n.dot(a) < 0) n.negate();
  return n;
}

/**
 * Point on the head surface.
 * @param az  azimuth in radians (0 = looking forward / +Z)
 * @param el  elevation in radians
 * @param inflate  push the point out along its normal
 * @returns Vector3 in head-pivot local space
 */
export function headSurface(az, el, inflate = 0) {
  const ce = Math.cos(el), se = Math.sin(el);
  const dir = new THREE.Vector3(Math.sin(az) * ce, se, Math.cos(az) * ce);
  const p = headSculpt(dir.clone());
  if (inflate) p.addScaledVector(dir, inflate);
  return p.add(HEAD.center);
}

/** Direction vector for a spherical coordinate. */
export function headDir(az, el) {
  const ce = Math.cos(el), se = Math.sin(el);
  return new THREE.Vector3(Math.sin(az) * ce, se, Math.cos(az) * ce);
}

/* ─────────────────────────────────────────────────────────────
   Build
   ───────────────────────────────────────────────────────────── */
export function buildHead(M) {
  const group = new THREE.Group();
  group.name = 'head';
  // the group origin is the centre of the skull
  group.position.copy(HEAD.center);

  // ── skull
  const skull = new THREE.Mesh(
    sculptedSphere(1, 72, 52, (v) => headSculpt(v)),
    M.skin
  );
  skull.name = 'skull';
  skull.castShadow = true;
  skull.receiveShadow = true;
  group.add(skull);

  // ── face artwork patch
  const patchGeo = sculptedPatch(1, {
    elev: [-1.40, 0.60],
    azimuthScale: 0.80,
    rows: 56, cols: 72,
    sculpt: (v) => headSculpt(v),
    offset: 0.0016,
  });
  const face = new THREE.Mesh(patchGeo, M.eye);
  face.name = 'face';
  face.renderOrder = 2;
  group.add(face);

  // ── ears
  const earGeo = (() => {
    const g = sculptedSphere(1, 22, 18, (v) => {
      const d = v.clone().normalize();
      v.set(d.x * 0.0165, d.y * 0.0255, d.z * 0.0135);
      // point the ear tip backwards
      v.z -= 0.006 * Math.max(0, d.y) * Math.abs(d.y);
      v.y += 0.004 * Math.max(0, d.y);
    });
    return g;
  })();
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, M.skin);
    ear.position.set(s * 0.0905, -0.012, -0.004);
    ear.rotation.set(0.10, s * 0.22, s * 0.16);
    ear.scale.set(1, 1, 1);
    ear.castShadow = true;
    group.add(ear);
    // inner ear
    const inner = new THREE.Mesh(earGeo, M.innerEar);
    inner.position.copy(ear.position);
    inner.rotation.copy(ear.rotation);
    inner.scale.set(0.62, 0.72, 0.5);
    inner.position.x += s * 0.004;
    inner.position.z += 0.004;
    group.add(inner);
  }

  return { group, skull, face };
}
