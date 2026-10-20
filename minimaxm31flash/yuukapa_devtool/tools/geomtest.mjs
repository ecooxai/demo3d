#!/usr/bin/env node
/** Unit test: verify the winding of sweep() and loft() with known shapes. */
import * as THREE from '../vendor/three/three.webgpu.js';
import { sweep, loft, ellipseRing } from '../src/js/lib/geom.js';

function signedVolume(geo) {
  const p = geo.attributes.position, idx = geo.index;
  let v = 0;
  for (let t = 0; t < idx.count; t += 3) {
    const i0 = idx.getX(t), i1 = idx.getX(t + 1), i2 = idx.getX(t + 2);
    const ax = p.getX(i0), ay = p.getY(i0), az = p.getZ(i0);
    const bx = p.getX(i1), by = p.getY(i1), bz = p.getZ(i1);
    const cx = p.getX(i2), cy = p.getY(i2), cz = p.getZ(i2);
    v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  return v / 6;
}

/* 1. a tube going straight down (like a limb) */
const down = [];
for (let i = 0; i <= 10; i++) down.push(new THREE.Vector3(0, -i * 0.1, 0));
const tube = sweep(down, { radial: 12, profile: () => ({ rx: 0.05, ry: 0.05 }) });
console.log('tube down      volume =', signedVolume(tube).toFixed(8), '(expect > 0)');

/* 2. a tube going straight up */
const up = [];
for (let i = 0; i <= 10; i++) up.push(new THREE.Vector3(0, i * 0.1, 0));
const tubeUp = sweep(up, { radial: 12, profile: () => ({ rx: 0.05, ry: 0.05 }) });
console.log('tube up        volume =', signedVolume(tubeUp).toFixed(8), '(expect > 0)');

/* 3. a tube along +X */
const xd = [];
for (let i = 0; i <= 10; i++) xd.push(new THREE.Vector3(i * 0.1, 0, 0));
const tubeX = sweep(xd, { radial: 12, profile: () => ({ rx: 0.05, ry: 0.05 }) });
console.log('tube +X        volume =', signedVolume(tubeX).toFixed(8), '(expect > 0)');

/* 4. loft bottom→top */
const ringsLow = [0, 1, 2].map((k) => ellipseRing(0, k * 0.1, 0, 0.08, 0.06, 16));
const l1 = loft(ringsLow, { capStart: true, capEnd: true });
console.log('loft low→high  volume =', signedVolume(l1).toFixed(8), '(expect > 0)');

/* 5. loft top→bottom */
const ringsHigh = [2, 1, 0].map((k) => ellipseRing(0, k * 0.1, 0, 0.08, 0.06, 16));
const l2 = loft(ringsHigh, { capStart: true, capEnd: true });
console.log('loft high→low  volume =', signedVolume(l2).toFixed(8), '(expect > 0)');

/* 6. replicate body.js limb() exactly */
const lerp = (a, b, t) => a + (b - a) * t;
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
    profile: (t) => { const r = profile(t); return { rx: r, ry: r }; },
    capStart: cap, capEnd: cap,
  });
}
const thigh = limb(0.400, (t) => lerp(0.064, 0.043, t) * (1 + 0.07 * Math.sin(t * Math.PI)), { bend: 0.004, seg: 12, radial: 16 });
console.log('thigh          volume =', signedVolume(thigh).toFixed(8), '(expect ~ +0.0031)');
console.log('thigh verts    =', thigh.attributes.position.count, 'idx =', thigh.index.count);

/* 7. the same, but with an explicit frame normal (like the hair) */
const hairPts = [];
for (let i = 0; i <= 10; i++) hairPts.push(new THREE.Vector3(0, -i * 0.1, 0.02 * Math.sin(i)));
const hair = sweep(hairPts, {
  radial: 9,
  frameNormals: hairPts.map(() => new THREE.Vector3(0, 0, 1)),
  profile: () => ({ rx: 0.03, ry: 0.008 }),
});
console.log('ribbon         volume =', signedVolume(hair).toFixed(8), '(expect > 0)');

/* 8. isolate the taper */
const taperPts = [];
for (let i = 0; i <= 12; i++) taperPts.push(new THREE.Vector3(0, -(i / 12) * 0.4, 0));
const taper = sweep(taperPts, {
  radial: 16,
  profile: (t) => { const r = lerp(0.064, 0.043, t) * (1 + 0.07 * Math.sin(t * Math.PI)); return { rx: r, ry: r }; },
  capStart: true, capEnd: true,
});
console.log('tapered tube   volume =', signedVolume(taper).toFixed(8), '(expect ~ +0.0036)');

/* 9. taper without caps */
const taperNC = sweep(taperPts, {
  radial: 16,
  profile: (t) => { const r = lerp(0.064, 0.043, t) * (1 + 0.07 * Math.sin(t * Math.PI)); return { rx: r, ry: r }; },
  capStart: false, capEnd: false,
});
console.log('taper no caps  volume =', signedVolume(taperNC).toFixed(8));

/* 10. straight tube, varying radius, with caps */
const taperStraight = sweep(taperPts, {
  radial: 16,
  profile: (t) => ({ rx: lerp(0.064, 0.043, t), ry: lerp(0.064, 0.043, t) }),
  capStart: true, capEnd: true,
});
console.log('taper simple   volume =', signedVolume(taperStraight).toFixed(8), '(expect ~ +0.0036)');

/* 11. isolate the bend */
const bendPts = [];
for (let i = 0; i <= 12; i++) {
  const t = i / 12;
  bendPts.push(new THREE.Vector3(0, -t * 0.4, Math.sin(t * Math.PI) * 0.004));
}
const bent = sweep(bendPts, {
  radial: 16,
  profile: (t) => { const r = lerp(0.064, 0.043, t) * (1 + 0.07 * Math.sin(t * Math.PI)); return { rx: r, ry: r }; },
  capStart: true, capEnd: true,
});
console.log('bent tube      volume =', signedVolume(bent).toFixed(8), '(expect ~ +0.0036)');

/* 12. bend applied to the points, straight profile */
const bent2 = sweep(bendPts, {
  radial: 16,
  profile: (t) => ({ rx: 0.05, ry: 0.05 }),
  capStart: true, capEnd: true,
});
console.log('bent simple    volume =', signedVolume(bent2).toFixed(8), '(expect ~ +0.0039)');

/* 13. inspect the bent geometry */
{
  const p = bent2.attributes.position;
  console.log('bent2 verts:', p.count);
  for (let i = 0; i < 6; i++) console.log('  v', i, p.getX(i).toFixed(4), p.getY(i).toFixed(4), p.getZ(i).toFixed(4));
  const mid = 16 * 8;
  for (let i = mid; i < mid + 4; i++) console.log('  m', i, p.getX(i).toFixed(4), p.getY(i).toFixed(4), p.getZ(i).toFixed(4));
  let nan = 0;
  for (let i = 0; i < p.count; i++) if (!isFinite(p.getX(i)) || !isFinite(p.getY(i)) || !isFinite(p.getZ(i))) nan++;
  console.log('  NaN verts:', nan);
}

/* 14. independent volume via the divergence theorem */
function divVolume(geo) {
  const p = geo.attributes.position, idx = geo.index;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), nrm = new THREE.Vector3();
  let v = 0;
  for (let t = 0; t < idx.count; t += 3) {
    a.fromBufferAttribute(p, idx.getX(t));
    b.fromBufferAttribute(p, idx.getX(t + 1));
    c.fromBufferAttribute(p, idx.getX(t + 2));
    ab.subVectors(b, a); ac.subVectors(c, a);
    nrm.crossVectors(ab, ac);
    const cen = new THREE.Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3);
    v += cen.dot(nrm) / 6;
  }
  return v;
}
console.log('div bent simple =', divVolume(bent2).toFixed(8));
console.log('div taper simple =', divVolume(taperStraight).toFixed(8));
console.log('div tube down   =', divVolume(tube).toFixed(8));

/* 15. check for a flipped frame: compare each ring's first vertex to the neighbour */
{
  const p = bent2.attributes.position, R = 16;
  let prev = null;
  for (let i = 0; i < 13; i++) {
    const v = new THREE.Vector3(p.getX(i * R), p.getY(i * R), p.getZ(i * R));
    if (prev) {
      const d = v.clone().sub(prev).length();
      process.stdout.write(d.toFixed(4) + ' ');
    }
    prev = v;
  }
  console.log('\n  ring-0 vertex spacing (should be smooth):');
}

/* 16. frame inspection for the bent tube */
{
  const { computeFrames } = await import('../src/js/lib/geom.js');
  const pts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector3(0, -t * 0.4, Math.sin(t * Math.PI) * 0.004));
  }
  const f = computeFrames(pts, new THREE.Vector3(0, 1, 0), false);
  console.log('bent frames:');
  f.normals.forEach((n, i) => console.log('  ', i, n.x.toFixed(3), n.y.toFixed(3), n.z.toFixed(3), '| B', f.binormals[i].x.toFixed(3), f.binormals[i].y.toFixed(3), f.binormals[i].z.toFixed(3), '| T', f.tangents[i].x.toFixed(3), f.tangents[i].y.toFixed(3), f.tangents[i].z.toFixed(3)));

  const pts2 = [];
  for (let i = 0; i <= 12; i++) pts2.push(new THREE.Vector3(0, -i / 12 * 0.4, 0));
  const f2 = computeFrames(pts2, new THREE.Vector3(0, 1, 0), false);
  console.log('straight frames:');
  f2.normals.forEach((n, i) => console.log('  ', i, n.x.toFixed(3), n.y.toFixed(3), n.z.toFixed(3)));
}
