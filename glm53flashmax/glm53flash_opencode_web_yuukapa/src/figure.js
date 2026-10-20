// Procedural anime figure: "yuukapa" — pajama girl w/ halo, pillow, bunny ribbon.
// All geometry generated from scratch (spheres/capsules/rloft ribbons). Faces +z.
import * as THREE from 'three';
import {
  ribbon, scallopHem, pillowGeometry, vertTint, centerGeom, addOutline, runOutlines,
  limbBetween,
} from './geometry.js';
import { toon, P, toonRamp } from './materials.js';
import { makeFaceTextures, makePajamaTexture } from './textures.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const deg = (d) => THREE.MathUtils.degToRad(d);

/* ================= head ================= */
// anime head: sphere reshaped (flat-ish face window, tapered jaw), sphere-UV with
// u=0.5 at front (+z) via phiStart = -PI/2.
function headGeometry() {
  const g = new THREE.SphereGeometry(1, 64, 48, -Math.PI / 2, Math.PI * 2, 0.02, Math.PI * 0.999);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // anatomy shaping on unit sphere
    const yv = v.y; // 1 top .. -1 bottom
    // jaw taper below cheek line
    const d = THREE.MathUtils.smoothstep(-yv, 0.18, 0.98);
    v.x *= 1 - 0.42 * d * d;
    v.z *= 1 - 0.10 * d * d;
    // front-face flattening (only front hemisphere, strongest at face center)
    if (v.z > 0) {
      const az = Math.atan2(v.x, v.z); // 0 at center front
      const flat = Math.max(0, Math.cos(az));
      v.z *= THREE.MathUtils.lerp(1, 0.70, Math.pow(flat, 1.25));
    }
    // slightly wider temples / narrower top (skull cap reads round)
    const topness = THREE.MathUtils.smoothstep(yv, 0.35, 1);
    v.x *= 1 + 0.06 * (1 - topness) * 0.5;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.scale(0.101, 0.112, 0.103);
  g.computeVertexNormals();
  return g;
}

/* ================= torso profile (shirt+placket reference) ================= */
function torsoProfile() {
  // y -> [r, rx scale, rz scale]
  const pts = [
    [0.885, 0.126], [0.935, 0.121], [1.005, 0.114], [1.065, 0.116],
    [1.13, 0.124], [1.19, 0.132], [1.245, 0.130], [1.283, 0.106], [1.305, 0.062],
  ];
  return {
    r(y) {
      if (y <= pts[0][0]) return pts[0][1];
      if (y >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
      for (let i = 0; i < pts.length - 1; i++) {
        const [y0, r0] = pts[i], [y1, r1] = pts[i + 1];
        if (y <= y1) {
          const t = (y - y0) / (y1 - y0);
          return THREE.MathUtils.lerp(r0, r1, t * t * 0.4 + t * 0.6);
        }
      }
      return pts[pts.length - 1][1];
    },
    top: pts[pts.length - 1][0],
    bottom: pts[0][0],
  };
}

/* ================= figure ================= */
export function buildFigure(fx = {}) {
  runOutlines();
  const root = new THREE.Group();
  const parts = {};
  const faceTex = makeFaceTextures();

  /* ----- materials ----- */
  const faceMat = new THREE.MeshToonMaterial({
    color: 0xffffff, map: faceTex.open, gradientMap: toonRamp(),
  });
  const skinMat = toon(P.skin);
  const hairMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonRamp(), vertexColors: true });
  const shirtMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: makePajamaTexture('shirt', 11), gradientMap: toonRamp() });
  const shirtSleeveMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: makePajamaTexture('cuff', 13), gradientMap: toonRamp() });
  const shortsMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: makePajamaTexture('shorts', 17), gradientMap: toonRamp() });
  const whiteMat = toon(P.white);
  const pillowMat = toon(P.pillow);
  const slipperMat = toon(0xf3f4f6);
  const bowMat = toon(P.bow);
  const haloMat = new THREE.MeshStandardMaterial({ color: 0x14161d, roughness: 0.34, metalness: 0.25 });
  const haloGlowMat = new THREE.MeshBasicMaterial({ color: 0x7ee6ff });

  /* ================= body group (so idle bob moves body+hair, not shadow/halo) ================= */
  const body = new THREE.Group();
  root.add(body);

  /* ----- head ----- */
  const head = new THREE.Mesh(headGeometry(), faceMat);
  head.position.set(0, 1.507, -0.002);
  body.add(head);
  addOutline(head, { t: 0.0026, color: 0x8a6f8a });

  // neck
  const neck = limbBetween(V3(0, 1.336, 0.012), V3(0, 1.405, 0.010), 0.030, 0.026, skinMat);
  body.add(neck);

  /* ----- ears hidden by hair; none built ----- */

  /* ----- hair root cap ----- */
  const scalp = new THREE.Mesh(new THREE.SphereGeometry(0.0965, 40, 30, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  scalp.position.copy(head.position);
  scalp.scale.set(1.0, 1.06, 1.02);
  body.add(scalp);

  const QS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const DBG = {
    hide: (QS.get('hide') || '').split(',').filter(Boolean),
    recolor: !!QS.get('recolor'),
  };

  /* ================= hair ribbons ================= */
  const hairAll = new THREE.Group();
  body.add(hairAll);
  const HA = P.hairMid, HB = P.hairTip; // root color -> tip color

  function strand(pts3, o = {}) {
    let colorA = o.colorA ?? HA;
    if (DBG.recolor && o.tag === 'back') colorA = 0xff8800;
    if (DBG.recolor && o.tag === 'side') colorA = 0x00ff00;
    if (DBG.recolor && o.tag === 'lock') colorA = 0xff00ff;
    const { geom, center } = ribbon(pts3, {
      colorA, colorB: o.colorB ?? HB,
      gradStart: o.gradStart ?? 0.45, ...o,
    });
    const mesh = new THREE.Mesh(geom, hairMat);
    mesh.position.copy(center);
    hairAll.add(mesh);
    addOutline(mesh, { t: o.ot ?? 0.0032, color: 0x302a52 });
    return mesh;
  }

  // hairline anchors (front z ~ +0.06..0.075 at forehead arc)
  const hl = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8; // -1..1 across forehead, -1 = her right (-x)
    const x = (t - 0.5) * 0.152;
    const z = 0.063 + 0.018 * Math.cos((t - 0.5) * Math.PI * 1.1) * 0.8;
    const y = 1.585 + 0.012 * Math.sin(Math.PI * t);
    hl.push(V3(x, y, z));
  }
  // crown anchor helper
  const crown = (x, y = 1.60, z = 0.05) => V3(x, y, z);

  // — big sweep lock covering her right cheek (viewer-left) —
  strand([
    crown(-0.030, 1.604, 0.062), V3(-0.058, 1.572, 0.070), V3(-0.088, 1.528, 0.060),
    V3(-0.100, 1.470, 0.048), V3(-0.096, 1.408, 0.038),
  ], { w: 0.046, t: 0.024, wTip: 0.011, tipStart: 0.55, gradStart: 0.5 });

  // — left-of-center bang strips (fringe ends at brow line, never over eyes) —
  strand([
    crown(-0.006, 1.610, 0.060), V3(-0.030, 1.578, 0.070), V3(-0.046, 1.552, 0.064),
  ], { w: 0.038, t: 0.018, wTip: 0.008, tipStart: 0.42, gradStart: 0.55 });
  strand([
    crown(0.012, 1.612, 0.056), V3(0.000, 1.580, 0.072), V3(-0.010, 1.548, 0.064),
  ], { w: 0.036, t: 0.018, wTip: 0.008, tipStart: 0.42, gradStart: 0.55 });
  strand([
    crown(0.030, 1.612, 0.050), V3(0.032, 1.578, 0.066), V3(0.024, 1.540, 0.060),
  ], { w: 0.034, t: 0.017, wTip: 0.007, tipStart: 0.42, gradStart: 0.55 });
  strand([
    crown(0.052, 1.608, 0.042), V3(0.066, 1.570, 0.058), V3(0.058, 1.526, 0.052),
  ], { w: 0.036, t: 0.017, wTip: 0.008, tipStart: 0.44, gradStart: 0.55 });
  strand([
    crown(0.072, 1.600, 0.028), V3(0.088, 1.562, 0.042), V3(0.086, 1.510, 0.036),
  ], { w: 0.036, t: 0.017, wTip: 0.009, tipStart: 0.46, gradStart: 0.55 });

  // — side locks framing face —
  // her right (short, in front of ear)
  strand([
    V3(-0.078, 1.560, 0.052), V3(-0.096, 1.482, 0.044), V3(-0.100, 1.398, 0.038),
    V3(-0.090, 1.302, 0.034),
  ], { w: 0.036, t: 0.024, wTip: 0.009, tipStart: 0.5, gradStart: 0.4 });
  // her left (long, over shoulder to chest)
  strand([
    V3(0.080, 1.556, 0.052), V3(0.100, 1.462, 0.044), V3(0.108, 1.358, 0.036),
    V3(0.112, 1.232, 0.030), V3(0.106, 1.132, 0.026),
  ], { w: 0.044, t: 0.026, wTip: 0.010, tipStart: 0.5, gradStart: 0.42 });

  // — big lock crossing to her left hip (in front of shoulder) —
  strand([
    V3(0.070, 1.590, 0.030), V3(0.104, 1.500, 0.018), V3(0.142, 1.390, 0.012),
    V3(0.163, 1.270, 0.008), V3(0.172, 1.130, 0.006), V3(0.168, 1.020, 0.002),
  ], { w: 0.052, t: 0.030, wTip: 0.012, tipStart: 0.5, gradStart: 0.42, tag: 'lock' });

  // — her right long strand beyond the raised arm —
  strand([
    V3(-0.068, 1.580, 0.014), V3(-0.098, 1.470, 0.006), V3(-0.130, 1.340, 0.000),
    V3(-0.150, 1.190, -0.006), V3(-0.156, 1.040, -0.010), V3(-0.146, 0.930, -0.012),
  ], { w: 0.048, t: 0.028, wTip: 0.011, tipStart: 0.5, gradStart: 0.42, tag: 'lock' });

  // — back mass: crown → waist → spikes (S-curve hugging the back) —
  strand([
    V3(0.030, 1.600, -0.030), V3(0.010, 1.470, -0.105), V3(0.004, 1.280, -0.128),
    V3(-0.010, 1.060, -0.120), V3(-0.020, 0.800, -0.100), V3(-0.022, 0.520, -0.070),
  ], { w: 0.072, t: 0.050, wTip: 0.020, tipStart: 0.5, gradStart: 0.4, tag: 'back' });
  strand([
    V3(-0.038, 1.586, -0.026), V3(-0.058, 1.440, -0.092), V3(-0.070, 1.230, -0.118),
    V3(-0.082, 0.990, -0.112), V3(-0.094, 0.740, -0.096), V3(-0.100, 0.560, -0.070),
  ], { w: 0.066, t: 0.046, wTip: 0.018, tipStart: 0.52, gradStart: 0.4, tag: 'back' });
  strand([
    V3(0.046, 1.588, -0.026), V3(0.072, 1.450, -0.088), V3(0.090, 1.250, -0.112),
    V3(0.104, 1.010, -0.108), V3(0.114, 0.760, -0.094), V3(0.118, 0.590, -0.068),
  ], { w: 0.064, t: 0.046, wTip: 0.018, tipStart: 0.52, gradStart: 0.4, tag: 'back' });
  // outer side-falls behind arms
  strand([
    V3(-0.058, 1.560, -0.010), V3(-0.086, 1.400, -0.040), V3(-0.110, 1.240, -0.050),
    V3(-0.126, 1.060, -0.048), V3(-0.130, 0.900, -0.040),
  ], { w: 0.046, t: 0.030, wTip: 0.012, tipStart: 0.55, gradStart: 0.45, tag: 'side' });
  strand([
    V3(0.060, 1.560, -0.008), V3(0.090, 1.400, -0.036), V3(0.112, 1.240, -0.044),
    V3(0.124, 1.070, -0.042), V3(0.126, 0.920, -0.036),
  ], { w: 0.046, t: 0.030, wTip: 0.012, tipStart: 0.55, gradStart: 0.45, tag: 'side' });
  // thin flyaways
  strand([
    V3(0.020, 1.596, -0.048), V3(0.040, 1.420, -0.100), V3(0.058, 1.160, -0.132),
    V3(0.076, 0.940, -0.128),
  ], { w: 0.013, t: 0.008, wTip: 0.004, tipStart: 0.5, ot: 0.0022 });
  strand([
    V3(-0.010, 1.600, -0.050), V3(-0.016, 1.380, -0.118), V3(-0.028, 1.100, -0.138),
    V3(-0.040, 0.860, -0.126),
  ], { w: 0.014, t: 0.008, wTip: 0.004, tipStart: 0.5, ot: 0.0022 });

  parts.hairAll = hairAll;

  /* ================= headband + bunny ribbon ================= */
  const bandGroup = new THREE.Group();
  body.add(bandGroup);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.096, 0.019, 18, 44), whiteMat);
  band.position.set(0, 1.548, 0.008);
  band.rotation.x = deg(-80);  // nearly horizontal towel wrap
  band.rotation.y = 0;
  // fluff jitter
  {
    const pos = band.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const jx = Math.sin(i * 12.9898) * 0.5;
      const jy = Math.sin(i * 78.233) * 0.5;
      const jz = Math.sin(i * 39.465) * 0.5;
      pos.setXYZ(i, pos.getX(i) * (1 + jx * 0.02), pos.getY(i) * (1 + jy * 0.02), pos.getZ(i) * (1 + jz * 0.02));
    }
    band.geometry.computeVertexNormals();
  }
  bandGroup.add(band);
  addOutline(band, { t: 0.0025, color: 0xc9d6e6 });

  // bunny ribbon: two white blades + inner fold shadows
  const ribbonGroup = new THREE.Group();
  body.add(ribbonGroup);
  function whiteBlade(pts3, o = {}) {
    const { geom, center } = ribbon(pts3, { colorA: o.colorA ?? P.white, colorB: o.colorB ?? P.whiteShade, ...o });
    const m = new THREE.Mesh(geom, whiteMat);
    m.position.copy(center);
    ribbonGroup.add(m);
    addOutline(m, { t: o.ot ?? 0.0022, color: 0xc9d6e6 });
    return m;
  }
  // knot
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.024, 20, 14), whiteMat);
  knot.scale.set(1.15, 0.85, 0.9);
  knot.position.set(0.010, 1.648, 0.030);
  ribbonGroup.add(knot);
  // left ear (viewer-right, long leaning right-back)
  whiteBlade([
    V3(0.028, 1.660, 0.030), V3(0.052, 1.692, 0.050), V3(0.070, 1.718, 0.070),
    V3(0.084, 1.740, 0.086),
  ], { w: 0.046, t: 0.012, wTip: 0.022, tipStart: 0.5 });
  whiteBlade([
    V3(0.024, 1.646, 0.028), V3(0.044, 1.678, 0.040), V3(0.056, 1.702, 0.058),
  ], { w: 0.026, t: 0.007, wTip: 0.012, tipStart: 0.4, colorB: 0xdfe7f2 });
  // right ear (viewer-left, leaning left)
  whiteBlade([
    V3(0.004, 1.658, 0.036), V3(-0.028, 1.696, 0.060), V3(-0.056, 1.724, 0.082),
    V3(-0.078, 1.746, 0.098),
  ], { w: 0.044, t: 0.012, wTip: 0.021, tipStart: 0.5 });
  whiteBlade([
    V3(0.000, 1.646, 0.032), V3(-0.022, 1.682, 0.044), V3(-0.040, 1.708, 0.060),
  ], { w: 0.024, t: 0.007, wTip: 0.011, tipStart: 0.4, colorB: 0xdfe7f2 });
  parts.ribbonGroup = ribbonGroup;

  /* ================= torso / shirt ================= */
  const prof = torsoProfile();
  const shirtPts = [];
  for (let y = prof.bottom; y <= prof.top + 0.001; y += 0.02) {
    shirtPts.push(new THREE.Vector2(prof.r(y), y));
  }
  const torso = new THREE.Mesh(new THREE.LatheGeometry(shirtPts, 42), shirtMat);
  torso.geometry.center();
  torso.position.set(0, prof.bottom + (prof.top - prof.bottom) / 2, 0);
  torso.scale.set(1.0, 1, 0.66);
  body.add(torso);
  // shirt map repeat to taste
  shirtMat.map.repeat.set(1.15, 0.85);
  addOutline(torso, { t: 0.0032, color: 0x7fa8c2 });

  // bust hint
  const bustMat = shirtMat;
  for (const s of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.0455, 22, 16), bustMat);
    b.position.set(s * 0.048, 1.205, 0.062);
    b.scale.set(1.25, 0.95, 0.65);
    b.geometry.computeVertexNormals && null;
    body.add(b);
  }

  // sleeves
  for (const s of [-1, 1]) {
    // upper-arm direction roughly (down, out)
    const a1 = V3(s * 0.126, 1.272, 0.004), a2 = V3(s * 0.196, 1.175, 0.010);
    // sleeve follows upper arm
    const dir = new THREE.Vector3().subVectors(a2, a1).normalize();
    const slGroup = new THREE.Group();
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.0495, 0.0535, 0.105, 22, 1, true), shirtSleeveMat);
    cyl.position.copy(new THREE.Vector3().addVectors(a1, a2).multiplyScalar(0.5));
    cyl.quaternion.setFromUnitVectors(V3(0, 1, 0), dir);
    slGroup.add(cyl);
    shirtSleeveMat.map.repeat.set(1.0, 0.6);
    // shoulder cap
    const capMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0515, 20, 14), shirtSleeveMat);
    capMesh.position.copy(a1).add(dir.clone().multiplyScalar(0.018));
    capMesh.scale.set(1.1, 0.85, 1.05);
    slGroup.add(capMesh);
    // scallop trim at bottom
    const hemG = scallopHem({ rx: 0.0555, rz: 0.0555, y: 0, height: 0.030, count: 7, flare: 0.16, mid: 2 });
    const hem = new THREE.Mesh(hemG, whiteMat);
    hem.position.copy(a2);
    hem.quaternion.copy(cyl.quaternion);
    // rotate scallop sag toward world-down
    {
      const axis = dir.clone();
      const down = new THREE.Vector3(0, -1, 0);
      const proj = down.clone().sub(axis.clone().multiplyScalar(down.dot(axis)));
      if (proj.lengthSq() > 1e-6) {
        proj.normalize();
        const local = proj.clone().applyQuaternion(cyl.quaternion.clone().invert());
        const ang = Math.atan2(local.z, local.x);
        hem.rotateOnAxis(new THREE.Vector3(0, 1, 0), ang - Math.PI / 2);
      }
    }
    slGroup.add(hem);
    body.add(slGroup);
    for (const m of [cyl, capMesh]) addOutline(m, { t: 0.0028, color: 0x7fa8c2 });
    addOutline(hem, { t: 0.0022, color: P.outlineWhite });
  }

  // collar petals (peter-pan round collar), white
  function collarPetal(s) {
    const shape = new THREE.Shape();
    const rIn = 0.026, rOut = 0.058, a0 = -0.66, a1 = 0.66;
    shape.absarc(0, 0, rOut, a0, a1, false);
    shape.absarc(0, 0, rIn, a1, a0, true);
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.0025, bevelSegments: 2 });
    g.rotateX(Math.PI / 2); // lay flat, pivot at neckline
    return g;
  }
  for (const s of [-1, 1]) {
    const petal = new THREE.Mesh(collarPetal(s), whiteMat);
    petal.position.set(s * 0.052, 1.296, 0.062);
    petal.rotation.y = s * deg(6);
    petal.rotation.z = s * deg(-4);
    petal.scale.set(1.05, 1.0, 1.0);
    body.add(petal);
    addOutline(petal, { t: 0.0022, color: P.outlineWhite });
  }
  // collar back band
  const cb = new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.0085, 10, 28), whiteMat);
  cb.position.set(0, 1.302, -0.004);
  cb.rotation.x = deg(78);
  body.add(cb);

  // front placket (white strip) + buttons
  const plG = [];
  for (let y = 1.10; y <= 1.292; y += 0.008) {
    const r = prof.r(y) * 0.66; // rz front
    plG.push(new THREE.Vector2(r + 0.0025, y));
  }
  const placket = new THREE.Mesh(new THREE.LatheGeometry(plG, 8, -Math.PI / 2 - 0.075, 0.15), whiteMat);
  // lathe theta: applies rotation around Y from x-axis... need front (+z) slice
  placket.geometry.translate(0, 0, 0);
  placket.rotation.y = deg(90) - 0; // lathe param: pts (r,y), theta around Y
  // simpler rebuild via custom theta span:
  {
    const pts2 = [];
    for (let y = 1.10; y <= 1.296; y += 0.008) {
      const r = prof.r(y) * 0.66 + 0.003;
      pts2.push(new THREE.Vector2(r, y));
    }
    placket.geometry.dispose();
    placket.geometry = new THREE.LatheGeometry(pts2, 8, deg(-24), deg(48));
    placket.rotation.y = 0;
  }
  body.add(placket);
  placket.scale.set(1, 1, 1);
  for (let i = 0; i < 5; i++) {
    const y = 1.128 + i * 0.040;
    const r = prof.r(y) * 0.66;
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.0035, 12), whiteMat);
    btn.position.set(-0.014, y, r + 0.007);
    btn.rotation.x = deg(90);
    body.add(btn);
  }

  // pocket (viewer-left chest, white outline + mini cat patch)
  {
    const pc = document.createElement('canvas'); pc.width = pc.height = 128;
    const pcx = pc.getContext('2d');
    pcx.fillStyle = '#d5f1fb'; pcx.fillRect(0, 0, 128, 128);
    // mini cat
    pcx.strokeStyle = '#fff'; pcx.lineWidth = 9;
    pcx.beginPath(); pcx.roundRect(34, 40, 62, 52, 16); pcx.stroke();
    pcx.fillStyle = 'rgba(244,169,198,0.95)';
    pcx.beginPath(); pcx.moveTo(44, 40); pcx.lineTo(56, 22); pcx.lineTo(62, 38); pcx.closePath(); pcx.fill();
    pcx.beginPath(); pcx.moveTo(88, 40); pcx.lineTo(76, 22); pcx.lineTo(70, 38); pcx.closePath(); pcx.fill();
    pcx.fillStyle = 'rgba(137,205,228,0.95)';
    pcx.beginPath(); pcx.ellipse(52, 62, 3.6, 4.6, 0, 0, 7); pcx.fill();
    pcx.beginPath(); pcx.ellipse(80, 62, 3.6, 4.6, 0, 0, 7); pcx.fill();
    const patchMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: new THREE.CanvasTexture(pc), gradientMap: toonRamp() });
    patchMat.map.colorSpace = THREE.SRGBColorSpace;
    const pk = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.062, 0.004), patchMat);
    pk.position.set(-0.062, 1.185, 0.0815);
    pk.rotation.y = deg(-9);
    body.add(pk);
    addOutline(pk, { t: 0.0016, color: P.outlineWhite });
  }

  parts.torso = torso;

  /* ================= shorts ================= */
  const shortWrapPts = [];
  for (let y = 0.958; y <= 1.048; y += 0.012) {
    const r = 0.116 + (y - 0.958) * 0.055;
    shortWrapPts.push(new THREE.Vector2(r, y));
  }
  const shortsWrap = new THREE.Mesh(new THREE.LatheGeometry(shortWrapPts, 40), shortsMat);
  shortsWrap.geometry.center();
  shortsWrap.position.set(0, 0.958 + (1.048 - 0.958) / 2, 0);
  shortsWrap.scale.set(1.04, 1, 0.70);
  body.add(shortsWrap);
  shortsMat.map.repeat.set(1.1, 0.62);
  addOutline(shortsWrap, { t: 0.003, color: 0x7fa8c2 });

  // two voluminous legs of the shorts
  for (const s of [-1, 1]) {
    const h1 = V3(s * 0.054, 0.858, 0.0), h2 = V3(s * 0.050, 0.63, 0.004);
    const cyl = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, Math.abs(h2.y - h1.y), 6, 22), shortsMat);
    cyl.position.copy(new THREE.Vector3().addVectors(h1, h2).multiplyScalar(0.5));
    cyl.scale.set(1, 1, 0.78);
    body.add(cyl);
    // scallop hem
    const hem = new THREE.Mesh(
      scallopHem({ rx: 0.080, rz: 0.080 * 0.78, y: h2.y - 0.006, height: 0.028, count: 8, flare: 0.08, mid: 2 }),
      whiteMat,
    );
    body.add(hem);
    for (const m of [cyl]) addOutline(m, { t: 0.0028, color: 0x7fa8c2 });
    addOutline(hem, { t: 0.0022, color: P.outlineWhite });
    // inner white trim line
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.0745, 0.0032, 8, 30), whiteMat);
    trim.position.set(s * 0.050, h2.y + 0.002, 0.004);
    trim.rotation.x = deg(90);
    trim.scale.set(1, 1, 0.78);
    body.add(trim);
  }

  /* ================= legs ================= */
  for (const s of [-1, 1]) {
    const front = s < 0 ? 0.055 : -0.05; // front foot = her right = -x side
    const hip = V3(s * 0.056, 0.875, 0);
    const knee = V3(s * 0.054, 0.545, front > 0 ? 0.02 : 0.012);
    const ankle = V3(s * 0.050, 0.052, s < 0 ? 0.026 : -0.014);
    const thigh = limbBetween(hip, knee, 0.0585, 0.0475, skinMat);
    const calf = limbBetween(knee, ankle, 0.0455, 0.0285, skinMat);
    // calf muscle hint
    const cm = new THREE.Mesh(new THREE.SphereGeometry(0.039, 14, 12), skinMat);
    cm.position.set(s * 0.052, 0.40, 0.010);
    cm.scale.set(1, 1.6, 1.1);
    cm.geometry.computeVertexNormals && null;
    body.add(thigh, calf, cm);
    for (const m of thigh.children) {
      addOutline(m, { t: 0.0026, color: 0xa5838f });
    }
    for (const m of calf.children) {
      addOutline(m, { t: 0.0022, color: 0xa5838f });
    }
  }

  /* ================= feet / slippers ================= */
  parts.slippers = [];
  for (const [x, z, ry, side] of [[-0.052, 0.062, deg(-14), 'r'], [0.046, -0.052, deg(12), 'l']]) {
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.058, 24, 18), slipperMat);
    sp.scale.set(0.98, 0.72, 1.35);
    sp.position.set(x, 0.036, z);
    sp.rotation.y = ry;
    sp.rotation.z = 0;
    sp.geometry.computeVertexNormals && null;
    body.add(sp);
    addOutline(sp, { t: 0.0024, color: 0xdcd6da });
    // bow
    const bow = new THREE.Group();
    for (const s of [-1, 1]) {
      const lp = new THREE.Mesh(new THREE.SphereGeometry(0.0135, 14, 10), bowMat);
      lp.scale.set(1, 0.62, 0.55);
      lp.position.set(s * 0.016, 0.004, -0.004);
      lp.rotation.y = s * deg(14);
      lp.rotation.z = s * deg(-6);
      bow.add(lp);
    }
    const kn = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), bowMat);
    bow.add(kn);
    bow.position.set(x, 0.078, z - 0.036);
    bow.rotation.y = ry;
    body.add(bow);
    parts.slippers.push(sp);
  }

  /* ================= arms + hands ================= */
  function hand(o) {
    const g = new THREE.Group();
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.0245, 16, 12), skinMat);
    palm.scale.set(0.95, 1.5, 0.62);
    g.add(palm);
    const rl = 0.0098;
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.CapsuleGeometry(rl, 0.028 - i * 0.002, 4, 10), skinMat);
      f.position.set((i - 1.5) * 0.0105, 0.0315, o.curl * 0.004);
      f.rotation.set(o.curl * deg(58), 0, (i - 1.5) * deg(2.5));
      g.add(f);
    }
    const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.0093, 0.020, 4, 10), skinMat);
    th.position.set(-o.mirror * 0.017, 0.001, 0.011);
    th.rotation.set(0, 0, -o.mirror * deg(42));
    g.add(th);
    addOutline(palm, { t: 0.0018, color: 0xa5838f });
    return g;
  }

  // RIGHT arm raised, hand to head (viewer-left, world -x)
  {
    const S = V3(-0.128, 1.288, 0.006), E = V3(-0.252, 1.242, -0.010), W = V3(-0.158, 1.528, 0.036);
    const up = limbBetween(S, E, 0.0405, 0.0345, skinMat);
    // deltoid cap
    const delt = new THREE.Mesh(new THREE.SphereGeometry(0.042, 18, 12), skinMat);
    delt.position.copy(S);
    body.add(delt);
    const fore = limbBetween(E, W, 0.0335, 0.0245, skinMat);
    const elb = new THREE.Mesh(new THREE.SphereGeometry(0.037, 14, 10), skinMat);
    elb.position.copy(E);
    body.add(up, fore, elb);
    for (const m of up.children) addOutline(m, { t: 0.0024, color: 0xa5838f });
    for (const m of fore.children) addOutline(m, { t: 0.0022, color: 0xa5838f });
    const hd = hand({ curl: 1, mirror: 1 });
    hd.position.copy(W);
    hd.rotation.set(deg(-12), deg(-38), deg(-58)); // palm toward head, fingers up-in
    body.add(hd);
  }

  // LEFT arm holds pillow (viewer-right)
  {
    const S = V3(0.128, 1.288, 0.006), E = V3(0.198, 1.062, 0.024), W = V3(0.158, 0.975, 0.078);
    const up = limbBetween(S, E, 0.0395, 0.0335, skinMat);
    const delt = new THREE.Mesh(new THREE.SphereGeometry(0.042, 18, 12), skinMat);
    delt.position.copy(S);
    body.add(delt);
    const fore = limbBetween(E, W, 0.0325, 0.0235, skinMat);
    const elb = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), skinMat);
    elb.position.copy(E);
    body.add(up, fore, elb);
    for (const m of up.children) addOutline(m, { t: 0.0024, color: 0xa5838f });
    for (const m of fore.children) addOutline(m, { t: 0.0022, color: 0xa5838f });
    const hd = hand({ curl: 0.75, mirror: -1 });
    hd.position.copy(W);
    hd.rotation.set(deg(70), deg(0), deg(-18)); // draping over pillow edge
    body.add(hd);
  }

  /* ================= pillow ================= */
  {
    const { geom, center } = pillowGeometry();
    const pw = new THREE.Mesh(geom, pillowMat);
    pw.scale.set(0.86, 0.9, 0.88);
    pw.position.set(0.178, 0.872, 0.030);
    pw.rotation.set(deg(9), deg(-8), deg(-24));
    body.add(pw);
    addOutline(pw, { t: 0.0030, color: P.outlineWhite });
    // soft AO tint on lower/back
    vertTint(pw.geometry, (p) => {
      const d = THREE.MathUtils.smoothstep(-p.y - 0.36, 0.05, 0.5);
      return new THREE.Color(1, 1 - d * 0.06, 1 - d * 0.035);
    });
    parts.pillow = pw;
  }

  /* *soft AO on shoulders edges of shirt via vertTint skipped (visual iteration later) */

  /* ================= halo ================= */
  const halo = new THREE.Group();
  root.add(halo);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.0105, 20, 64), haloMat);
  const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.0955, 0.0048, 14, 64), haloGlowMat);
  halo.add(ring, glowRing);
  halo.position.set(0, 1.862, 0.012);
  halo.rotation.set(deg(74), deg(-14), deg(-7));
  parts.halo = halo;
  parts.haloRing = ring;

  /* ================= contact shadow ================= */
  const shRoot = new THREE.Group();
  root.add(shRoot);

  /* ----- animation hooks ----- */
  let blinkT = 2.2, blinkState = 0;
  animFace();
  function animFace() { faceMat.map = blinkState ? faceTex.closed : faceTex.open; faceMat.needsUpdate = true; }

  parts.root = root;
  parts.body = body;
  parts.head = head;
  parts.faceTex = faceTex;
  parts.faceMat = faceMat;

  parts.update = (t, dt, idle) => {
    if (!idle) return;
    // breathing bob
    body.position.y = 0.004 * Math.sin(t * 1.5);
    body.rotation.z = 0.0025 * Math.sin(t * 0.9);
    // halo float
    halo.position.y = 1.862 + 0.005 * Math.sin(t * 1.9 + 1.2);
    halo.rotation.z = deg(-7) + deg(1.6) * Math.sin(t * 1.1);
    halo.rotation.x = deg(74) + deg(1.6) * Math.sin(t * 1.35);
    // hair sway
    hairAll.rotation.z = deg(0.5) * Math.sin(t * 1.2 + 2);
    hairAll.rotation.y = deg(0.7) * Math.sin(t * 0.7);
    // ribbon flutter
    ribbonGroup.rotation.z = deg(1.2) * Math.sin(t * 2.1);
    // blink
    blinkT -= dt;
    if (blinkT <= 0 && blinkState === 0) {
      blinkState = 1; blinkT = 0.12; animFace();
    } else if (blinkState === 1 && blinkT <= 0) {
      blinkState = 0; blinkT = 2.4 + Math.random() * 2.6; animFace();
    }
  };

  return parts;
}
