import * as THREE from 'three';
import {
  sweepEllipse, loft, makeHeadGeometry, makeOutlineGeometry,
  makeAlmondGeometry, scallopBand, scallopEdgePoints, ringCurve,
  makePillowGeometry, pillowSeamCurve, softPatch, limbGeometry, trimTube,
} from './geom.js';
import {
  makePajamaFabric, makeClothNoise, makeEyeTexture, makeMouthTexture,
  makeBlushTexture, makeShadowTexture, mulberry32, makeGlowTexture,
} from './textures.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const TAU = Math.PI * 2;

function mirroredShape(shape) {
  const pts = shape.getPoints(72).map((p) => new THREE.Vector2(-p.x, p.y)).reverse();
  const s = new THREE.Shape();
  s.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, pts[i].y);
  s.closePath();
  return s;
}

/* ────────────────────────────────────────────────────────────
   Materials
   ──────────────────────────────────────────────────────────── */
function makeMaterials() {
  const pajama = makePajamaFabric();
  const bump = makeClothNoise();

  const fabric = (repeatU, repeatV, opts = {}) => {
    const map = pajama.clone();
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatU, repeatV);
    map.needsUpdate = true;
    const bmp = bump.clone();
    bmp.wrapS = bmp.wrapT = THREE.RepeatWrapping;
    bmp.repeat.set(repeatU * 1.5, repeatV * 1.5);
    bmp.needsUpdate = true;
    return new THREE.MeshPhysicalMaterial({
      map,
      bumpMap: bmp,
      bumpScale: 0.0014,
      color: 0xffffff,
      roughness: 0.86,
      metalness: 0.0,
      clearcoat: 0.03,
      clearcoatRoughness: 0.8,
      sheen: 0.3,
      sheenColor: new THREE.Color('#e7f7ff'),
      sheenRoughness: 0.8,
      envMapIntensity: 0.3,
      side: THREE.DoubleSide,
      ...opts,
    });
  };

  const skin = new THREE.MeshPhysicalMaterial({
    color: 0xffdccd,
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.07,
    clearcoatRoughness: 0.75,
    sheen: 0.34,
    sheenColor: new THREE.Color('#ffd3c8'),
    sheenRoughness: 0.9,
    envMapIntensity: 0.2,
    emissive: new THREE.Color('#a05348'),
    emissiveIntensity: 0.075,
  });

  const hair = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    color: 0xffffff,
    roughness: 0.52,
    metalness: 0.04,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
    sheen: 0.65,
    sheenColor: new THREE.Color('#7361cf'),
    sheenRoughness: 0.6,
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  });

  const satin = new THREE.MeshPhysicalMaterial({
    color: 0xf9fdff,
    roughness: 0.56,
    metalness: 0.0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.52,
    sheen: 0.45,
    sheenColor: new THREE.Color('#dcefff'),
    sheenRoughness: 0.7,
    envMapIntensity: 0.42,
    side: THREE.DoubleSide,
  });

  const trim = new THREE.MeshPhysicalMaterial({
    color: 0xf7fbff,
    roughness: 0.62,
    metalness: 0.0,
    sheen: 0.5,
    sheenColor: new THREE.Color('#e3f4ff'),
    sheenRoughness: 0.7,
    envMapIntensity: 0.45,
    side: THREE.DoubleSide,
  });

  const plainBlue = new THREE.MeshPhysicalMaterial({
    color: 0xcdeafd,
    roughness: 0.74,
    sheen: 0.5,
    sheenColor: new THREE.Color('#e8f8ff'),
    sheenRoughness: 0.7,
    envMapIntensity: 0.38,
    side: THREE.DoubleSide,
  });

  const skinShadow = new THREE.MeshBasicMaterial({
    color: 0xc69399,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const outline = new THREE.MeshBasicMaterial({ color: 0x4a3e68, side: THREE.BackSide });
  const hairOutline = new THREE.MeshBasicMaterial({ color: 0x1d172f, side: THREE.BackSide });
  const softOutline = new THREE.MeshBasicMaterial({ color: 0x8ba2bf, side: THREE.BackSide });

  const eyeMatL = new THREE.MeshBasicMaterial({
    map: makeEyeTexture(true),
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const eyeMatR = new THREE.MeshBasicMaterial({
    map: makeEyeTexture(false),
    transparent: true,
    alphaTest: 0.01,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });

  const lash = new THREE.MeshStandardMaterial({ color: 0x241526, roughness: 0.46, metalness: 0.0 });
  const brow = new THREE.MeshStandardMaterial({ color: 0x5d4269, roughness: 0.7 });
  const mouth = new THREE.MeshBasicMaterial({
    map: makeMouthTexture(), transparent: true, depthWrite: false, toneMapped: false,
  });
  const blush = new THREE.MeshBasicMaterial({
    map: makeBlushTexture(), transparent: true, opacity: 0.9, depthWrite: false,
    toneMapped: false, blending: THREE.NormalBlending,
  });
  const noseSkin = new THREE.MeshStandardMaterial({ color: 0xecc4be, roughness: 0.62 });

  const button = new THREE.MeshPhysicalMaterial({
    color: 0xf6fbff, roughness: 0.22, metalness: 0.15, clearcoat: 0.9,
    clearcoatRoughness: 0.18, envMapIntensity: 1.1, iridescence: 0.35,
    iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 400],
  });
  const buttonRim = new THREE.MeshStandardMaterial({ color: 0xd9ebfb, roughness: 0.4, metalness: 0.2 });

  const pillow = new THREE.MeshPhysicalMaterial({
    color: 0xfdfeff,
    roughness: 0.66,
    metalness: 0.0,
    sheen: 1.0,
    sheenColor: new THREE.Color('#e8f4ff'),
    sheenRoughness: 0.5,
    clearcoat: 0.1,
    clearcoatRoughness: 0.7,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
  });
  const pillowSeam = new THREE.MeshStandardMaterial({ color: 0xb9cfe4, roughness: 0.6 });

  const plush = new THREE.MeshPhysicalMaterial({
    color: 0xf9fdff, roughness: 0.82, metalness: 0,
    sheen: 1.0, sheenColor: new THREE.Color('#e5f4ff'), sheenRoughness: 0.55,
    envMapIntensity: 0.4,
  });
  const sole = new THREE.MeshPhysicalMaterial({
    color: 0xcfe8f9, roughness: 0.48, metalness: 0.0, clearcoat: 0.3,
    clearcoatRoughness: 0.45, envMapIntensity: 0.5,
  });
  const pinkSatin = new THREE.MeshPhysicalMaterial({
    color: 0xf3b6d0, roughness: 0.4, metalness: 0.0, clearcoat: 0.45,
    clearcoatRoughness: 0.4, sheen: 1.0, sheenColor: new THREE.Color('#ffdceb'),
    sheenRoughness: 0.45, envMapIntensity: 0.7, side: THREE.DoubleSide,
  });

  const haloMetal = new THREE.MeshPhysicalMaterial({
    color: 0x141a2e,
    roughness: 0.26,
    metalness: 0.94,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.5,
  });
  const haloRim = new THREE.MeshBasicMaterial({
    color: 0x5dc7ff, transparent: true, opacity: 0.78, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  });
  const haloRimSoft = new THREE.MeshBasicMaterial({
    color: 0x2a7fd4, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending,
    depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  });
  const hairHighlight = new THREE.MeshPhysicalMaterial({
    color: 0x8c7fd6, roughness: 0.3, metalness: 0.1, clearcoat: 0.3,
    sheen: 1, sheenColor: new THREE.Color('#b7abff'), sheenRoughness: 0.4,
    envMapIntensity: 0.9, transparent: true, opacity: 0.9,
  });

  return {
    pajama, bump, fabric, skin, hair, satin, trim, plainBlue, skinShadow,
    outline, hairOutline, softOutline, eyeMatL, eyeMatR, lash, brow, mouth,
    blush, noseSkin, button, buttonRim, pillow, pillowSeam, plush, sole,
    pinkSatin, haloMetal, haloRim, haloRimSoft, hairHighlight,
  };
}

/* ────────────────────────────────────────────────────────────
   Character
   ──────────────────────────────────────────────────────────── */
export function buildCharacter() {
  const M = makeMaterials();
  const root = new THREE.Group();
  root.name = 'Yuukapa';
  const outlines = [];
  const hairLocks = [];
  const sprites = [];
  const rnd = mulberry32(20261019);

  function addMesh(parent, geo, mat, opts = {}) {
    const {
      ink = 0, inkMat = M.outline, cast = true, receive = true,
      name = '', renderOrder = 0,
    } = opts;
    if (ink > 0) {
      const outlineMesh = new THREE.Mesh(makeOutlineGeometry(geo, ink), inkMat);
      outlineMesh.name = name + '_ink';
      outlineMesh.castShadow = false;
      outlineMesh.receiveShadow = false;
      outlineMesh.renderOrder = renderOrder - 1;
      outlines.push(outlineMesh);
      parent.add(outlineMesh);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    mesh.renderOrder = renderOrder;
    parent.add(mesh);
    return mesh;
  }

  /* everything above the collarbone lives in this rig so the whole
     head assembly can be scaled to the reference proportions        */
  const HEAD_SCALE = 0.78;
  const HEAD_PIVOT_Y = 2.20;
  const headRig = new THREE.Group();
  headRig.name = 'head_rig';
  headRig.scale.setScalar(HEAD_SCALE);
  headRig.position.set(0, HEAD_PIVOT_Y * (1 - HEAD_SCALE), 0);
  root.add(headRig);

  function makeLock(points, opts = {}) {
    const {
      width = 0.1, segments = 24, radialSegments = 8,
      colorRoot = '#241c3b', colorMid = '#3a2c61', colorTip = '#63539f',
      sideHint = V(1, 0, 0), phase = rnd() * TAU,
      amp = 0.005, ampX = 0.0035, ink = 0.0022, name = 'hair_lock',
      capStart = false, capEnd = false, mat = M.hair,
      tipPow = 0.34, thickScale = 1, midPow = 0.78,
    } = opts;

    const pivot = points[0].clone();
    const local = points.map((p) => p.clone().sub(pivot));
    const geo = sweepEllipse(local, {
      tubularSegments: segments,
      radialSegments,
      widthFn: (t) => width * (0.52 + 0.58 * Math.sin(Math.PI * Math.pow(t, midPow))) * Math.pow(1 - t, tipPow),
      thicknessFn: (t) => Math.max(0.0015, width * 0.27 * thickScale * (0.38 + 0.62 * Math.sin(Math.PI * Math.pow(t, 0.7)))),
      sideHint,
      colorRoot, colorMid, colorTip,
      edgeShade: 0.2,
      capStart, capEnd,
    });
    const group = new THREE.Group();
    group.position.copy(pivot);
    group.name = name;
    const mesh = addMesh(group, geo, mat, { ink, inkMat: M.hairOutline, name });
    mesh.castShadow = width > 0.075;
    headRig.add(group);
    hairLocks.push({ group, baseRot: group.rotation.clone(), phase, amp, ampX });
    return group;
  }

  function addSparkle(pos, scale, opacity = 0.7, color = 0xffffff) {
    const mat = new THREE.SpriteMaterial({
      map: makeGlowTexture(), color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const s = new THREE.Sprite(mat);
    s.position.copy(pos);
    s.scale.setScalar(scale);
    root.add(s);
    sprites.push({ sprite: s, baseOpacity: opacity, phase: rnd() * TAU });
    return s;
  }

  /* ════════════════════════════════════════════════════════
     HEAD
     ════════════════════════════════════════════════════════ */
  const HEAD = V(0, 2.47, 0.012);
  const headSkullScale = V(0.316, 0.334, 0.304);
  const headGroup = new THREE.Group();
  headGroup.position.copy(HEAD);
  headGroup.name = 'head';
  headRig.add(headGroup);

  const headGeo = makeHeadGeometry(V(0, 0, 0), headSkullScale);
  addMesh(headGroup, headGeo, M.skin, { ink: 0.0065, cast: true, receive: true, name: 'head' });

  // exact z of the sculpted face surface, so decals sit on the skin
  const faceSurfaceZ = (x, y) => {
    const nx = x / headSkullScale.x;
    const ny = y / headSkullScale.y;
    const below = Math.max(0, -ny);
    const taper = 1 - 0.36 * Math.pow(below, 1.25) - 0.05 * Math.pow(below, 5);
    const vx = nx / Math.max(0.18, taper);
    const inside = Math.max(0.01, 1 - vx * vx - ny * ny);
    let z = Math.sqrt(inside) * taper * 0.96;
    const chin = Math.exp(-Math.pow((ny + 0.72) / 0.2, 2))
      * Math.max(0, z) * Math.exp(-Math.pow(nx / 0.32, 2));
    z += chin * 0.10;
    return z * headSkullScale.z;
  };

  const addFaceDecal = (cx, cy, w, h, mat, opts = {}) => {
    const { renderOrder = 2, offset = 0.0035, segX = 10, segY = 8 } = opts;
    const g = new THREE.PlaneGeometry(w, h, segX, segY);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + cx;
      const y = p.getY(i) + cy;
      p.setXYZ(i, x, y, faceSurfaceZ(x, y) + offset);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.renderOrder = renderOrder;
    headGroup.add(m);
    return m;
  };

  // ears
  for (const side of [-1, 1]) {
    const earGeo = new THREE.SphereGeometry(1, 28, 22);
    const ear = new THREE.Mesh(earGeo, M.skin);
    ear.scale.set(0.036, 0.072, 0.048);
    ear.position.set(side * 0.294, -0.055, -0.012);
    ear.rotation.z = side * 0.12;
    ear.rotation.y = side * 0.2;
    ear.castShadow = true;
    headGroup.add(ear);
    // inner ear shading
    const inner = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), M.skinShadow);
    inner.scale.set(0.018, 0.043, 0.025);
    inner.position.set(side * 0.303, -0.055, 0.002);
    inner.rotation.y = side * 0.25;
    headGroup.add(inner);
  }

  // neck
  const neck = loft([
    { y: 1.60, rx: 0.108, rz: 0.098, cx: 0, cz: 0.006 },
    { y: 1.78, rx: 0.094, rz: 0.086, cx: 0, cz: 0.010 },
    { y: 1.99, rx: 0.084, rz: 0.078, cx: 0, cz: 0.016 },
    { y: 2.15, rx: 0.086, rz: 0.082, cx: 0, cz: 0.010 },
  ], { radialSegments: 32, colorA: '#f0cbc5', colorB: '#f8ded8', capTop: false, capBottom: false });
  addMesh(headRig, neck, M.skin, { ink: 0.0045, name: 'neck' });

  // soft shadow beneath the chin, painted decal (very subtle)
  const chinShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.09),
    new THREE.MeshBasicMaterial({
      map: makeShadowTexture(), transparent: true, opacity: 0.25,
      color: 0xb6868d, depthWrite: false, toneMapped: false,
    })
  );
  chinShadow.position.set(0, -0.35, 0.078);
  chinShadow.rotation.x = -0.28;
  headGroup.add(chinShadow);

  /* ── FACE ───────────────────────────────────────────── */
  const eyeData = [];
  const eyeLocal = { x: 0.136, y: -0.030 };
  for (const side of [-1, 1]) {
    const isLeft = side > 0; // character's left, screen right
    const zSurf = faceSurfaceZ(side * eyeLocal.x, eyeLocal.y);
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * eyeLocal.x, eyeLocal.y, zSurf + 0.001);
    eyeGroup.rotation.y = side * 0.30;
    eyeGroup.rotation.x = -0.02;
    eyeGroup.rotation.z = -side * 0.02;
    eyeGroup.scale.setScalar(1.0);
    eyeGroup.name = isLeft ? 'eye_L' : 'eye_R';
    headGroup.add(eyeGroup);

    const eyeGeo = makeAlmondGeometry(0.206, 0.188, 0.006);
    const eyeMesh = new THREE.Mesh(eyeGeo, isLeft ? M.eyeMatL : M.eyeMatR);
    eyeMesh.renderOrder = 4;
    eyeMesh.name = isLeft ? 'eye_surface_L' : 'eye_surface_R';
    eyeGroup.add(eyeMesh);

    // soft socket shading just above the eye
    const socket = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.062),
      new THREE.MeshBasicMaterial({
        map: makeShadowTexture(), transparent: true, opacity: 0.13,
        color: 0xc08f9b, depthWrite: false, toneMapped: false,
      })
    );
    socket.position.set(0, 0.098, 0.006);
    socket.renderOrder = 3;
    eyeGroup.add(socket);

    // lower lid — a whisper of warm rose
    const dir = isLeft ? 1 : -1;
    const lowerPts = [
      V(-0.080 * dir, -0.048, 0.002),
      V(-0.02 * dir, -0.073, 0.001),
      V(0.04 * dir, -0.071, -0.001),
      V(0.090 * dir, -0.036, -0.003),
    ];
    const lowerGeo = sweepEllipse(lowerPts, {
      tubularSegments: 16, radialSegments: 5,
      widthFn: (t) => 0.0038 * (0.4 + Math.sin(Math.PI * t)),
      thicknessFn: (t) => 0.0022,
      colorRoot: 0xc58c9e, colorMid: 0xc58c9e, colorTip: 0xc58c9e,
      capStart: true, capEnd: true,
    });
    const lowerLash = new THREE.Mesh(lowerGeo, new THREE.MeshStandardMaterial({ color: 0xb87f92, roughness: 0.6 }));
    lowerLash.renderOrder = 5;
    eyeGroup.add(lowerLash);

    eyeData.push({ group: eyeGroup, side, blink: 0 });
  }

  // eyebrows — soft, sleepy, barely there
  for (const side of [-1, 1]) {
    const dir = side;
    const pts = [
      [0.056, 0.128], [0.092, 0.142], [0.134, 0.146], [0.172, 0.138], [0.198, 0.126],
    ].map(([x, y]) => V(x * dir, y, faceSurfaceZ(x * dir, y) + 0.006));
    const geo = sweepEllipse(pts, {
      tubularSegments: 18, radialSegments: 5,
      widthFn: (t) => 0.0042 * (0.5 + 0.7 * Math.sin(Math.PI * Math.pow(t, 0.9))) * (1 - t * 0.65),
      thicknessFn: (t) => 0.002,
      colorRoot: 0x6b5578, colorMid: 0x6b5578, colorTip: 0x6b5578,
      sideHint: V(0, 0, 1),
      capStart: true, capEnd: true,
    });
    const browMesh = new THREE.Mesh(geo, M.brow);
    browMesh.position.set(0, 0, 0);
    headGroup.add(browMesh);
  }

  // nose — a tiny, barely-there shadow
  const noseGeo = new THREE.SphereGeometry(1, 16, 12);
  const nose = new THREE.Mesh(noseGeo, M.noseSkin);
  nose.scale.set(0.0075, 0.0042, 0.003);
  nose.position.set(0.003, -0.096, faceSurfaceZ(0.003, -0.096) + 0.003);
  headGroup.add(nose);

  // mouth — mapped onto the curve of the face
  addFaceDecal(0, -0.172, 0.082, 0.034, M.mouth, { renderOrder: 3, offset: 0.0045 });

  // blush
  for (const side of [-1, 1]) {
    addFaceDecal(side * 0.192, -0.104, 0.140, 0.086, M.blush, { renderOrder: 2, offset: 0.003 });
  }

  /* ════════════════════════════════════════════════════════
     HAIR — cap, curtain, fringe, flowing locks, flyaways
     ════════════════════════════════════════════════════════ */

  // close-fitting crown cap
  {
    const M2 = 96, N2 = 44;
    const positions = [], normals = [], uvs = [], colors = [], indices = [];
    const cA = new THREE.Color('#1f1832');
    const cB = new THREE.Color('#3a2b5f');
    for (let iv = 0; iv <= N2; iv++) {
      const v = iv / N2;
      for (let iu = 0; iu <= M2; iu++) {
        const phi = (iu / M2) * TAU;
        const thetaMax = 1.115 + 0.70 * (0.5 - 0.5 * Math.cos(phi));
        const theta = Math.max(0.0005, v * thetaMax);
        const ripple = 1 + 0.008 * Math.sin(phi * 9) * Math.sin(theta * 4);
        const x = Math.sin(theta) * Math.sin(phi) * 0.316 * ripple + HEAD.x;
        const y = Math.cos(theta) * 0.379 * ripple + HEAD.y + 0.004;
        const z = Math.sin(theta) * Math.cos(phi) * 0.323 * ripple + HEAD.z + 0.004;
        positions.push(x, y, z);
        const nx = Math.sin(theta) * Math.sin(phi);
        const ny = Math.cos(theta);
        const nz = Math.sin(theta) * Math.cos(phi);
        normals.push(nx, ny, nz);
        uvs.push(iu / M2, v);
        const col = cA.clone().lerp(cB, Math.pow(v, 1.4) * 0.75);
        colors.push(col.r, col.g, col.b);
      }
    }
    for (let iv = 0; iv < N2; iv++) {
      for (let iu = 0; iu < M2; iu++) {
        const a = iv * (M2 + 1) + iu;
        const b = (iv + 1) * (M2 + 1) + iu;
        const c = (iv + 1) * (M2 + 1) + iu + 1;
        const d = iv * (M2 + 1) + iu + 1;
        indices.push(a, b, d, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    addMesh(headRig, g, M.hair, { ink: 0.0035, inkMat: M.hairOutline, name: 'hair_cap' });
  }

  // soft solid curtain behind the shoulders, so no scalp ever shows through
  {
    const rows = [
      { y: 2.70, rx: 0.315, rz: 0.300 },
      { y: 2.50, rx: 0.355, rz: 0.312 },
      { y: 2.20, rx: 0.398, rz: 0.318 },
      { y: 1.90, rx: 0.428, rz: 0.318 },
      { y: 1.60, rx: 0.438, rz: 0.300 },
      { y: 1.30, rx: 0.428, rz: 0.278 },
      { y: 1.02, rx: 0.398, rz: 0.252 },
    ];    const cols = 76;
    const phi0 = Math.PI * 0.43, phi1 = Math.PI * 1.57;
    const positions = [], colors = [], uvs = [], indices = [];
    const cA = new THREE.Color('#1e1731');
    const cB = new THREE.Color('#493b78');
    for (let ir = 0; ir < rows.length; ir++) {
      const row = rows[ir];
      const t = ir / (rows.length - 1);
      for (let iu = 0; iu <= cols; iu++) {
        const u = iu / cols;
        const phi = phi0 + u * (phi1 - phi0);
        const ripple = 1 + 0.015 * Math.sin(phi * 11 + ir * 1.4);
        let y = row.y;
        if (ir === rows.length - 1) y += 0.065 * Math.sin(phi * 9 + 1.2) + 0.02 * Math.sin(phi * 17);
        positions.push(HEAD.x + Math.sin(phi) * row.rx * ripple, y, HEAD.z + Math.cos(phi) * row.rz * ripple);
        uvs.push(u, t);
        const col = cA.clone().lerp(cB, Math.pow(t, 1.3));
        colors.push(col.r, col.g, col.b);
      }
    }
    for (let ir = 0; ir < rows.length - 1; ir++) {
      for (let iu = 0; iu < cols; iu++) {
        const a = ir * (cols + 1) + iu;
        const b = (ir + 1) * (cols + 1) + iu;
        const c = (ir + 1) * (cols + 1) + iu + 1;
        const d = ir * (cols + 1) + iu + 1;
        indices.push(a, b, d, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    addMesh(headRig, g, M.hair, { ink: 0.003, inkMat: M.hairOutline, name: 'hair_curtain' });

    // a second shorter, slightly larger layer for silhouette depth
    const rows2 = rows.slice(0, 4).map((r) => ({ ...r, rx: r.rx * 1.035, rz: r.rz * 1.035 }));
    const cols2 = cols;
    const pos2 = [], col2 = [], uv2 = [], idx2 = [];
    for (let ir = 0; ir < rows2.length; ir++) {
      const row = rows2[ir];
      const t = ir / (rows2.length - 1);
      for (let iu = 0; iu <= cols2; iu++) {
        const u = iu / cols2;
        const phi = phi0 + u * (phi1 - phi0);
        const ripple = 1 + 0.02 * Math.sin(phi * 7 - ir * 2.1);
        let y = row.y;
        if (ir === rows2.length - 1) y += 0.025 * Math.sin(phi * 10);
        pos2.push(HEAD.x + Math.sin(phi) * row.rx * ripple, y, HEAD.z + Math.cos(phi) * row.rz * ripple);
        uv2.push(u, t);
        const col = cA.clone().lerp(cB, Math.pow(t, 1.6));
        col2.push(col.r, col.g, col.b);
      }
    }
    for (let ir = 0; ir < rows2.length - 1; ir++) {
      for (let iu = 0; iu < cols2; iu++) {
        const a = ir * (cols2 + 1) + iu;
        const b = (ir + 1) * (cols2 + 1) + iu;
        const c = (ir + 1) * (cols2 + 1) + iu + 1;
        const d = ir * (cols2 + 1) + iu + 1;
        idx2.push(a, b, d, b, c, d);
      }
    }
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3));
    g2.setAttribute('uv', new THREE.Float32BufferAttribute(uv2, 2));
    g2.setAttribute('color', new THREE.Float32BufferAttribute(col2, 3));
    g2.setIndex(idx2);
    g2.computeVertexNormals();
    addMesh(headRig, g2, M.hair, { name: 'hair_curtain_outer' });
  }

  const palettes = [
    ['#16112a', '#282050', '#4b3d8c'],
    ['#1a1430', '#302659', '#5d4ea2'],
    ['#131024', '#231b44', '#3f3277'],
    ['#1c1536', '#352a61', '#6a5ab0'],
  ];

  // dense fringe shell — covers the forehead so the face never reads as a bald dome
  {
    const cols = 72;
    const rows = [
      { y: 2.898, rx: 0.070, rz: 0.075 },
      { y: 2.858, rx: 0.175, rz: 0.175 },
      { y: 2.802, rx: 0.255, rz: 0.245 },
      { y: 2.735, rx: 0.298, rz: 0.272 },
      { y: 2.665, rx: 0.315, rz: 0.292 },
      { y: 2.598, rx: 0.318, rz: 0.300 },
      { y: 2.588, rx: 0.314, rz: 0.305 },
    ];
    const phi0 = -1.12, phi1 = 1.12;
    const positions = [], colors = [], uvs = [], indices = [];
    const cA = new THREE.Color('#150f28');
    const cB = new THREE.Color('#2c2358');
    for (let ir = 0; ir < rows.length; ir++) {
      const row = rows[ir];
      const t = ir / (rows.length - 1);
      for (let iu = 0; iu <= cols; iu++) {
        const u = iu / cols;
        const phi = phi0 + u * (phi1 - phi0);
        let y = row.y;
        if (ir === rows.length - 1) {
          y += 0.062 * Math.sin(phi * 8.5 + 0.7) + 0.026 * Math.sin(phi * 19 - 1.1);
        }
        const x = HEAD.x + Math.sin(phi) * row.rx;
        const z = HEAD.z + Math.cos(phi) * row.rz;
        positions.push(x, y, z);
        uvs.push(u, t);
        const strand = 0.5 + 0.5 * Math.sin(phi * 23 + ir * 0.7);
        const col = cA.clone().lerp(cB, Math.min(1, 0.18 + 0.58 * t + 0.16 * strand));
        colors.push(col.r, col.g, col.b);
      }
    }
    for (let ir = 0; ir < rows.length - 1; ir++) {
      for (let iu = 0; iu < cols; iu++) {
        const a = ir * (cols + 1) + iu;
        const b = (ir + 1) * (cols + 1) + iu;
        const c = (ir + 1) * (cols + 1) + iu + 1;
        const d = ir * (cols + 1) + iu + 1;
        indices.push(a, b, d, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    // dark backing mass so skin never shows between the fringe ribbons
    addMesh(headRig, g, M.hair, { name: 'fringe_backing', cast: false, receive: false });
  }

  // fringe / bangs — broad, layered ribbons that fully frame the forehead
  const fringeSpecs = [
    { pts: [[-0.235, 2.810, 0.020], [-0.272, 2.710, 0.080], [-0.292, 2.605, 0.130], [-0.296, 2.520, 0.160], [-0.286, 2.455, 0.170]], w: 0.142, p: 0 },
    { pts: [[-0.175, 2.840, 0.024], [-0.216, 2.742, 0.090], [-0.240, 2.640, 0.150], [-0.250, 2.548, 0.185], [-0.244, 2.490, 0.195]], w: 0.150, p: 1 },
    { pts: [[-0.118, 2.858, 0.028], [-0.152, 2.764, 0.100], [-0.175, 2.664, 0.170], [-0.186, 2.572, 0.210], [-0.182, 2.515, 0.220]], w: 0.140, p: 2 },
    { pts: [[-0.058, 2.872, 0.032], [-0.086, 2.782, 0.108], [-0.105, 2.684, 0.185], [-0.116, 2.594, 0.228], [-0.116, 2.540, 0.238]], w: 0.130, p: 3 },
    { pts: [[0.002, 2.878, 0.034], [-0.012, 2.792, 0.112], [-0.022, 2.696, 0.192], [-0.028, 2.606, 0.236], [-0.032, 2.552, 0.245]], w: 0.110, p: 0 },
    { pts: [[0.060, 2.872, 0.032], [0.086, 2.782, 0.108], [0.104, 2.684, 0.185], [0.114, 2.590, 0.228], [0.114, 2.532, 0.238]], w: 0.130, p: 2 },
    { pts: [[0.120, 2.858, 0.028], [0.156, 2.764, 0.100], [0.178, 2.662, 0.170], [0.188, 2.568, 0.210], [0.184, 2.508, 0.220]], w: 0.140, p: 1 },
    { pts: [[0.178, 2.840, 0.024], [0.218, 2.742, 0.090], [0.242, 2.638, 0.150], [0.252, 2.544, 0.185], [0.246, 2.486, 0.195]], w: 0.150, p: 3 },
    { pts: [[0.236, 2.810, 0.020], [0.274, 2.710, 0.080], [0.294, 2.602, 0.130], [0.298, 2.516, 0.160], [0.288, 2.450, 0.170]], w: 0.132, p: 0 },
    { pts: [[-0.040, 2.868, 0.090], [0.000, 2.804, 0.170], [0.040, 2.735, 0.220], [0.072, 2.672, 0.250]], w: 0.052, p: 1 },
  ];
  for (let i = 0; i < fringeSpecs.length; i++) {
    const s = fringeSpecs[i];
    const pal = palettes[(i + 1) % palettes.length];
    const pts = s.pts.map(([x, y, z]) => {
      const surf = faceSurfaceZ(x, y - HEAD.y) + HEAD.z + 0.032;
      return V(x, y, Math.max(z, surf));
    });
    makeLock(pts, {
      width: s.w, segments: 28, radialSegments: 8,
      colorRoot: pal[0], colorMid: pal[1], colorTip: pal[2],
      phase: 4 + s.p * 1.7, amp: 0.0018, ampX: 0.0014, ink: 0.0018,
      tipPow: 1.05, thickScale: 0.55, midPow: 0.6,
      name: 'fringe_' + i,
    });
  }

  // long face-framing sidelocks (in front of the shoulders, like the reference)
  const sideSpecs = [
    { pts: [[-0.238, 2.825, 0.060], [-0.298, 2.700, 0.165], [-0.335, 2.470, 0.240], [-0.352, 2.210, 0.248], [-0.368, 1.950, 0.225], [-0.382, 1.790, 0.185]], w: 0.122, p: 0.4 },
    { pts: [[0.236, 2.825, 0.058], [0.298, 2.700, 0.162], [0.335, 2.470, 0.238], [0.352, 2.210, 0.246], [0.368, 1.950, 0.222], [0.384, 1.790, 0.182]], w: 0.124, p: 2.1 },
    { pts: [[-0.302, 2.760, -0.005], [-0.360, 2.520, 0.060], [-0.388, 2.230, 0.095], [-0.408, 1.960, 0.075], [-0.428, 1.800, 0.045]], w: 0.104, p: 3.2 },
    { pts: [[0.302, 2.760, -0.008], [0.360, 2.520, 0.055], [0.388, 2.230, 0.090], [0.408, 1.960, 0.070], [0.430, 1.800, 0.040]], w: 0.104, p: 5.0 },
    { pts: [[-0.188, 2.842, 0.050], [-0.240, 2.700, 0.140], [-0.268, 2.560, 0.205], [-0.278, 2.430, 0.235]], w: 0.062, p: 1.2 },
    { pts: [[0.188, 2.842, 0.048], [0.240, 2.700, 0.138], [0.268, 2.560, 0.202], [0.278, 2.430, 0.232]], w: 0.062, p: 4.2 },
  ];
  for (let i = 0; i < sideSpecs.length; i++) {
    const s = sideSpecs[i];
    const pal = palettes[(i + 2) % palettes.length];
    makeLock(s.pts.map((p) => V(...p)), {
      width: s.w, segments: 28, radialSegments: 8,
      colorRoot: pal[0], colorMid: pal[1], colorTip: pal[2],
      phase: s.p, amp: 0.003, ampX: 0.0022, ink: 0.002,
      name: 'sidelock_' + i,
    });
  }

  // main back + side cascade, two layers of wide ribbons
  for (let i = 0; i < 15; i++) {
    const phi = 1.32 + (i / 14) * (TAU - 2.64);
    const sx = Math.sin(phi), cz = Math.cos(phi);
    const pal = palettes[i % palettes.length];
    const jitter = (rnd() - 0.5) * 0.026;
    const tipY = 1.02 + ((i * 37) % 11) * 0.032;
    const flip = (i % 2 === 0 ? 1 : -1) * 0.045;
    const pts = [
      V(sx * 0.282 + jitter * 0.4, 2.665 + 0.025 * Math.sin(i * 1.7), cz * 0.278 + 0.004),
      V(sx * 0.315, 2.46, cz * 0.30 + 0.012),
      V(sx * 0.392 + jitter, 2.10, cz * 0.352 + 0.018),
      V(sx * 0.442 + jitter * 0.7, 1.72, cz * 0.37 + 0.025),
      V(sx * 0.462 + flip * 0.6, 1.38, cz * 0.352 + 0.035),
      V(sx * 0.418 + flip * 1.5 + 0.015, tipY, cz * 0.315 + 0.045),
    ];
    const width = 0.224 + ((i * 17) % 7) * 0.014;
    makeLock(pts, {
      width, segments: 30, radialSegments: 8,
      colorRoot: pal[0], colorMid: pal[1], colorTip: pal[2],
      sideHint: V(cz, 0, -sx),
      phase: i * 0.83, amp: 0.0045 + (i % 3) * 0.001, ampX: 0.003,
      ink: 0.0023, name: 'backlock_' + i,
    });
  }

  // inner layer to fill volume and hide the neck through the back
  for (let i = 0; i < 8; i++) {
    const phi = 1.7 + (i / 7) * (TAU - 3.4);
    const sx = Math.sin(phi), cz = Math.cos(phi);
    const pal = palettes[(i + 2) % palettes.length];
    const tipY = 1.52 + (i % 3) * 0.12;
    const pts = [
      V(sx * 0.245, 2.60, cz * 0.245),
      V(sx * 0.30, 2.34, cz * 0.285),
      V(sx * 0.36, 1.98, cz * 0.32),
      V(sx * 0.375, 1.70, cz * 0.30),
      V(sx * 0.355, tipY, cz * 0.27),
    ];
    makeLock(pts, {
      width: 0.19, segments: 24, radialSegments: 7,
      colorRoot: pal[0], colorMid: pal[1], colorTip: pal[2],
      sideHint: V(cz, 0, -sx),
      phase: 2 + i, amp: 0.003, ampX: 0.002,
      ink: 0.0018, name: 'innerlock_' + i,
    });
  }

  // crown layer, short locks that give the back of the head its roundness
  for (let i = 0; i < 5; i++) {
    const phi = 2.15 + (i / 4) * (TAU - 4.3);
    const sx = Math.sin(phi), cz = Math.cos(phi);
    const pal = palettes[(i + 1) % palettes.length];
    const pts = [
      V(sx * 0.15, 2.80, cz * 0.15),
      V(sx * 0.26, 2.68, cz * 0.27),
      V(sx * 0.335, 2.42, cz * 0.31),
      V(sx * 0.36, 2.12, cz * 0.315),
      V(sx * 0.35, 1.90, cz * 0.30),
    ];
    makeLock(pts, {
      width: 0.178, segments: 24, radialSegments: 7,
      colorRoot: pal[0], colorMid: pal[1], colorTip: pal[2],
      sideHint: V(cz, 0, -sx),
      phase: 1 + i, amp: 0.0025, ampX: 0.0018,
      ink: 0.002, name: 'crownlock_' + i,
    });
  }

  // delicate, lighter flyaways for the sunlit silhouette
  for (let i = 0; i < 11; i++) {
    const phi = 1.38 + (i / 10) * (TAU - 2.76) + (rnd() - 0.5) * 0.08;
    const sx = Math.sin(phi), cz = Math.cos(phi);
    const pal = palettes[(i + 3) % palettes.length];
    const tipY = 1.08 + rnd() * 0.7;
    const pts = [
      V(sx * 0.30, 2.60 + rnd() * 0.04, cz * 0.29),
      V(sx * 0.40, 2.28, cz * 0.34),
      V(sx * 0.47 + (rnd() - 0.5) * 0.04, 1.88, cz * 0.36),
      V(sx * 0.50 + (rnd() - 0.5) * 0.08, tipY + 0.15, cz * 0.35),
      V(sx * 0.48 + (rnd() - 0.5) * 0.12, tipY, cz * 0.31),
    ];
    makeLock(pts, {
      width: 0.022 + rnd() * 0.013, segments: 20, radialSegments: 6,
      colorRoot: pal[1], colorMid: pal[2], colorTip: '#8676c1',
      phase: 3 + i * 0.7, amp: 0.007, ampX: 0.005, ink: 0,
      name: 'flyaway_' + i,
    });
  }

  // long highlight ribbons that catch the light
  for (let i = 0; i < 7; i++) {
    const phi = 1.66 + (i / 6) * (TAU - 3.32);
    const sx = Math.sin(phi), cz = Math.cos(phi);
    const pts = [
      V(sx * 0.325, 2.49, cz * 0.335),
      V(sx * 0.405, 2.12, cz * 0.385),
      V(sx * 0.455, 1.76, cz * 0.395),
      V(sx * 0.445, 1.43, cz * 0.36),
      V(sx * 0.405, 1.22 + rnd() * 0.2, cz * 0.33),
    ];
    makeLock(pts, {
      width: 0.030, segments: 24, radialSegments: 6,
      colorRoot: '#6b5aa4', colorMid: '#9a89e0', colorTip: '#c2b5f4',
      phase: i, amp: 0.003, ampX: 0.002, ink: 0,
      mat: M.hairHighlight, name: 'hair_highlight_' + i,
    });
  }

  // little curled ahoge at the crown
  {
    const pts = [
      V(-0.175, 2.855, 0.035),
      V(-0.222, 2.94, 0.03),
      V(-0.295, 2.985, 0.018),
      V(-0.322, 2.945, 0.005),
      V(-0.282, 2.902, -0.004),
      V(-0.232, 2.925, -0.011),
      V(-0.212, 2.962, -0.018),
    ];
    makeLock(pts, {
      width: 0.027, segments: 30, radialSegments: 6,
      colorRoot: '#2b2044', colorMid: '#5e4e96', colorTip: '#8a78c4',
      phase: 0.3, amp: 0.004, ampX: 0.002, ink: 0.0018,
      name: 'ahoge',
    });
  }

  /* ── WHITE BOW & HEADBAND ───────────────────────────── */
  const satinOutline = new THREE.MeshBasicMaterial({ color: 0x9db2cc, side: THREE.BackSide });

  {
    const bandPts = [
      V(-0.303, 2.535, 0.028),
      V(-0.258, 2.735, -0.014),
      V(-0.13, 2.862, -0.036),
      V(0.0, 2.886, -0.04),
      V(0.13, 2.862, -0.036),
      V(0.258, 2.735, -0.014),
      V(0.303, 2.535, 0.028),
    ];
    const bandCurve = new THREE.CatmullRomCurve3(bandPts);
    const bandGeo = sweepEllipse(bandPts, {
      tubularSegments: 64, radialSegments: 8,
      widthFn: (t) => 0.152 * (0.82 + 0.18 * Math.sin(Math.PI * t)),
      thicknessFn: () => 0.016,
      sideHint: V(0, 0, 1),
      colorRoot: 0xffffff, colorMid: 0xffffff, colorTip: 0xffffff,
      capStart: true, capEnd: true,
    });
    addMesh(headRig, bandGeo, M.satin, { ink: 0.0016, inkMat: satinOutline, name: 'headband_band' });

    // frilled bonnet edge running along the front of the band
    const frillPts = [];
    const frillN = 84;
    for (let i = 0; i <= frillN; i++) {
      const t = i / frillN;
      const p = bandCurve.getPoint(t);
      const tan = bandCurve.getTangent(t);
      const out = new THREE.Vector3(tan.z, 0, -tan.x).normalize();
      frillPts.push(V(p.x + out.x * 0.012, p.y - 0.075 + 0.012 * Math.sin(t * 6), p.z + out.z * 0.012 + 0.042));
    }
    const frillGeo = sweepEllipse(frillPts, {
      tubularSegments: 96, radialSegments: 6,
      widthFn: (t) => 0.030 + 0.019 * Math.sin(t * Math.PI * 16),
      thicknessFn: (t) => 0.011 + 0.005 * Math.sin(t * Math.PI * 16 + 1),
      sideHint: V(0, 1, 0),
      colorRoot: 0xffffff, colorMid: 0xfbfeff, colorTip: 0xf2faff,
      capStart: true, capEnd: true,
    });
    addMesh(headRig, frillGeo, M.satin, { cast: false, ink: 0.0012, inkMat: satinOutline, name: 'headband_frill' });
  }

  const bowGroup = new THREE.Group();
  bowGroup.position.set(-0.100, 2.812, 0.196);
  bowGroup.rotation.set(-0.22, -0.30, 0.42);
  bowGroup.scale.setScalar(0.95);
  bowGroup.name = 'bow';
  headRig.add(bowGroup);

  {
    // one puffy satin loop: a squashed torus reads as solid volume from every angle
    const makeLoop = (mirror, r, tube, squash, tilt, yaw) => {
      const geo = new THREE.TorusGeometry(r, tube, 22, 46);
      const mesh = new THREE.Mesh(geo, M.satin);
      mesh.position.set(mirror * (r * 0.74), 0.006, 0);
      mesh.scale.set(1.06, 1.0, squash);
      mesh.rotation.set(0, yaw, mirror * -tilt);
      mesh.castShadow = true;
      mesh.name = mirror < 0 ? 'bow_loop_R' : 'bow_loop_L';
      bowGroup.add(mesh);

      const ink = new THREE.Mesh(makeOutlineGeometry(geo, 0.0018), satinOutline);
      ink.scale.copy(mesh.scale);
      ink.position.copy(mesh.position);
      ink.rotation.copy(mesh.rotation);
      bowGroup.add(ink);
      outlines.push(ink);

      // crease that gives the loop its folded-satin read
      const creasePts = [
        V(mirror * (r * 0.5), -r * 0.7, tube * squash * 1.05),
        V(mirror * (r * 1.42), -r * 0.34, tube * squash * 1.2),
        V(mirror * (r * 1.74), r * 0.3, tube * squash * 0.66),
      ];
      const crease = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(creasePts), 22, 0.0042, 5, false),
        new THREE.MeshStandardMaterial({ color: 0xbdd4e8, roughness: 0.55 })
      );
      crease.castShadow = false;
      bowGroup.add(crease);
    };
    makeLoop(-1, 0.124, 0.070, 0.60, 0.34, -0.20);
    makeLoop(1, 0.131, 0.074, 0.58, 0.30, -0.32);

    // satin tails hanging behind the bow
    const tailSpec = [
      { pts: [[-0.02, -0.03, 0.0], [-0.052, -0.13, 0.028], [-0.05, -0.23, -0.005], [-0.10, -0.32, -0.06], [-0.145, -0.39, -0.10]], w: 0.052 },
      { pts: [[0.03, -0.02, 0.02], [0.078, -0.11, 0.032], [0.105, -0.20, 0.0], [0.16, -0.28, -0.06], [0.195, -0.34, -0.11]], w: 0.046 },
    ];
    for (let i = 0; i < tailSpec.length; i++) {
      const spec = tailSpec[i];
      const pts = spec.pts.map(([x, y, z]) => V(x, y, z));
      const geo = sweepEllipse(pts, {
        tubularSegments: 26, radialSegments: 7,
        widthFn: (t) => spec.w * (0.75 + 0.5 * Math.sin(Math.PI * t)) * (1 - t * 0.35),
        thicknessFn: (t) => 0.012 * (1 - t * 0.3),
        sideHint: V(0, 0, 1),
        colorRoot: 0xffffff, colorMid: 0xf6fcff, colorTip: 0xebf7ff,
        capStart: true, capEnd: true,
      });
      addMesh(bowGroup, geo, M.satin, { ink: 0.0012, inkMat: satinOutline, name: 'bow_tail_' + i });
    }

    // knot
    const knotGeo = new THREE.SphereGeometry(1, 32, 24);
    const knot = new THREE.Mesh(knotGeo, M.satin);
    knot.scale.set(0.054, 0.048, 0.044);
    knot.position.set(0, 0.004, 0.026);
    knot.castShadow = true;
    bowGroup.add(knot);
    const knotOutline = new THREE.Mesh(makeOutlineGeometry(knotGeo, 0.0015), satinOutline);
    knotOutline.scale.copy(knot.scale);
    knotOutline.position.copy(knot.position);
    bowGroup.add(knotOutline);
    outlines.push(knotOutline);

    const wrapGeo = new THREE.TorusGeometry(0.032, 0.012, 8, 30, Math.PI * 1.5);
    const wrap = new THREE.Mesh(wrapGeo, M.satin);
    wrap.position.set(0, 0.002, 0.032);
    wrap.rotation.set(0.1, 0, Math.PI * 1.2);
    bowGroup.add(wrap);

    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 20, 16), M.button);
    pearl.position.set(0.0, -0.004, 0.060);
    bowGroup.add(pearl);
  }
  /* ── HALO ───────────────────────────────────────────── */
  const halo = new THREE.Group();
  halo.position.set(0, 3.17, 0.004);
  halo.rotation.set(Math.PI / 2 + 0.11, 0.0, -0.055);
  halo.name = 'halo';
  headRig.add(halo);

  {
    const ringGeo = new THREE.TorusGeometry(0.425, 0.020, 24, 220);
    const ring = new THREE.Mesh(ringGeo, M.haloMetal);
    ring.castShadow = true;
    halo.add(ring);

    const rimGeo = new THREE.TorusGeometry(0.425, 0.0080, 10, 220);
    const rim = new THREE.Mesh(rimGeo, M.haloRim);
    rim.scale.setScalar(1.028);
    rim.renderOrder = 3;
    halo.add(rim);

    const innerRimGeo = new THREE.TorusGeometry(0.395, 0.003, 8, 200);
    const innerRim = new THREE.Mesh(innerRimGeo, M.haloRimSoft);
    innerRim.renderOrder = 3;
    halo.add(innerRim);

    // tiny suspended star charm on the rim
    const charm = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(), color: 0x8fd8ff, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    }));
    charm.position.set(-0.415, 0.0, 0.012);
    charm.scale.setScalar(0.1);
    halo.add(charm);
    sprites.push({ sprite: charm, baseOpacity: 0.9, phase: 1.2 });

    const glowMat = new THREE.SpriteMaterial({
      map: makeGlowTexture('rgba(214,244,255,0.9)', 'rgba(90,180,255,0.42)'),
      color: 0x7dcdff, transparent: true, opacity: 0.34,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.setScalar(1.4);
    glow.position.z = 0.01;
    halo.add(glow);
    sprites.push({ sprite: glow, baseOpacity: 0.32, phase: 0.4 });

    const haloLight = new THREE.PointLight(0x6bc6ff, 3.2, 2.4, 2.0);
    haloLight.position.set(0, 0, 0.02);
    halo.add(haloLight);
  }

  for (const spec of [[V(0.30, 2.98, 0.13), 0.16, 0.55, 0x9fdcff], [V(-0.28, 3.02, -0.10), 0.11, 0.4, 0xcfeaff]]) {
    addSparkle(spec[0], spec[1], spec[2], spec[3]);
  }

  /* ════════════════════════════════════════════════════════
     PAJAMA SHIRT
     ════════════════════════════════════════════════════════ */
  const shirtMat = M.fabric(3.35, 1.12);
  const shirtRings = [
    { y: 2.07, rx: 0.262, rz: 0.195 },
    { y: 2.035, rx: 0.322, rz: 0.228 },
    { y: 1.985, rx: 0.348, rz: 0.245 },
    { y: 1.93, rx: 0.342, rz: 0.255 },
    { y: 1.86, rx: 0.328, rz: 0.255 },
    { y: 1.78, rx: 0.318, rz: 0.248 },
    { y: 1.69, rx: 0.306, rz: 0.238 },
    { y: 1.61, rx: 0.326, rz: 0.256 },
    { y: 1.558, rx: 0.345, rz: 0.271 },
    { y: 1.536, rx: 0.348, rz: 0.273 },
  ];
  const shirtGeo = loft(shirtRings, {
    radialSegments: 72,
    capTop: true,
    capBottom: true,
    uRepeat: 1,
    wrinkle: (a, t) => 0.006 * Math.sin(a * 6 + t * 12) + 0.003 * Math.sin(a * 13 - t * 5),
  });
  addMesh(root, shirtGeo, shirtMat, { ink: 0.0055, name: 'pajama_shirt' });

  // white piping at the hem
  {
    const hemCurve = ringCurve(0.351, 0.277, 1.538, 0, 0, 120, (a) => 0.0035 * Math.sin(a * 7 + 0.6));
    const hemTrim = trimTube(hemCurve, 0.0042, M.trim, 180, 6);
    hemTrim.castShadow = false;
    root.add(hemTrim);
  }

  // V of skin at the open collar
  {
    const s = new THREE.Shape();
    s.moveTo(-0.086, 2.075);
    s.quadraticCurveTo(0, 2.012, 0.086, 2.075);
    s.quadraticCurveTo(0.058, 1.933, 0.006, 1.842);
    s.quadraticCurveTo(-0.052, 1.925, -0.086, 2.075);
    s.closePath();
    const g = new THREE.ShapeGeometry(s, 28);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      const z = 0.258 - 3.0 * Math.pow(Math.max(0, y - 1.925), 2) + 0.02 * Math.max(0, 1.925 - y) - 0.35 * x * x;
      pos.setZ(i, z);
    }
    g.computeVertexNormals();
    addMesh(root, g, M.skin, { cast: false, name: 'chest' });

    // clavicle hint
    for (const sx of [-1, 1]) {
      const pts = [
        V(sx * 0.012, 2.028, 0.245),
        V(sx * 0.045, 2.031, 0.249),
        V(sx * 0.078, 2.022, 0.244),
      ];
      const geo = sweepEllipse(pts, {
        tubularSegments: 12, radialSegments: 4,
        widthFn: (t) => 0.0035 * Math.sin(Math.PI * t),
        thicknessFn: () => 0.0015,
        colorRoot: 0xdfadaf, colorMid: 0xdfadaf, colorTip: 0xdfadaf,
        capStart: true, capEnd: true,
      });
      addMesh(root, geo, M.skinShadow, { cast: false, receive: false, name: 'clavicle' });
    }

    const neckShade = new THREE.Mesh(
      new THREE.PlaneGeometry(0.17, 0.1),
      new THREE.MeshBasicMaterial({
        map: makeShadowTexture(), transparent: true, opacity: 0.3,
        color: 0xb27f86, depthWrite: false, toneMapped: false,
      })
    );
    neckShade.position.set(0, 2.055, 0.238);
    neckShade.rotation.x = -0.22;
    root.add(neckShade);
  }

  // collar lapels
  {
    const lapelShape = new THREE.Shape();
    lapelShape.moveTo(0.004, 2.072);
    lapelShape.lineTo(0.184, 2.038);
    lapelShape.quadraticCurveTo(0.212, 2.002, 0.181, 1.968);
    lapelShape.lineTo(0.058, 1.845);
    lapelShape.quadraticCurveTo(0.02, 1.861, 0.006, 1.905);
    lapelShape.quadraticCurveTo(-0.002, 1.982, 0.004, 2.072);
    lapelShape.closePath();

    const makeLapel = (mirror) => {
      const shape = mirror ? mirroredShape(lapelShape) : lapelShape;
      const geo = new THREE.ShapeGeometry(shape, 24);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        const z = 0.266 - 0.28 * x * x + 0.032 * Math.max(0, 1.95 - y) + 0.02 * Math.max(0, y - 2.02);
        pos.setZ(i, z);
      }
      geo.computeVertexNormals();
      addMesh(root, geo, M.plainBlue, { ink: 0.0035, name: mirror ? 'lapel_R' : 'lapel_L' });
    };
    makeLapel(false);
    makeLapel(true);

    // white piping around the V neckline
    const piping = [];
    piping.push(V(-0.184, 2.035, 0.256));
    piping.push(V(-0.208, 2.001, 0.261));
    piping.push(V(-0.178, 1.966, 0.267));
    piping.push(V(-0.058, 1.842, 0.276));
    piping.push(V(0.0, 1.895, 0.281));
    piping.push(V(0.058, 1.842, 0.276));
    piping.push(V(0.178, 1.966, 0.267));
    piping.push(V(0.208, 2.001, 0.261));
    piping.push(V(0.184, 2.035, 0.256));
    const pipeGeo = sweepEllipse(piping, {
      tubularSegments: 80, radialSegments: 6,
      widthFn: (t) => 0.009 * (0.85 + 0.15 * Math.sin(t * Math.PI * 6)),
      thicknessFn: () => 0.006,
      colorRoot: 0xffffff, colorMid: 0xffffff, colorTip: 0xffffff,
      capStart: true, capEnd: true,
    });
    addMesh(root, pipeGeo, M.trim, { cast: false, name: 'collar_piping' });

    // top collar band around the nape
    const napePts = [
      V(-0.19, 2.035, 0.10),
      V(-0.155, 2.075, -0.01),
      V(-0.065, 2.092, -0.075),
      V(0.065, 2.092, -0.075),
      V(0.155, 2.075, -0.01),
      V(0.19, 2.035, 0.10),
    ];
    const napeGeo = sweepEllipse(napePts, {
      tubularSegments: 50, radialSegments: 6,
      widthFn: (t) => 0.06 + 0.018 * Math.sin(Math.PI * t),
      thicknessFn: () => 0.014,
      sideHint: V(0, 1, 0),
      colorRoot: 0xf8fcff, colorMid: 0xf8fcff, colorTip: 0xf8fcff,
      capStart: true, capEnd: true,
    });
    addMesh(root, napeGeo, M.trim, { name: 'nape_collar' });
  }

  // button placket
  {
    const ps = new THREE.Shape();
    ps.moveTo(-0.029, 1.88);
    ps.lineTo(0.029, 1.88);
    ps.lineTo(0.031, 1.553);
    ps.lineTo(-0.031, 1.553);
    ps.closePath();
    const g = new THREE.ShapeGeometry(ps, 8);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, 0.269 - 0.25 * x * x + 0.018 * Math.max(0, 1.9 - y));
    }
    g.computeVertexNormals();
    addMesh(root, g, M.plainBlue, { cast: false, name: 'placket' });

    for (const sx of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const y = THREE.MathUtils.lerp(1.88, 1.556, i / 16);
        pts.push(V(sx * 0.0305, y, 0.27 + 0.018 * Math.max(0, 1.9 - y) - 0.002));
      }
      const trim = trimTube(new THREE.CatmullRomCurve3(pts), 0.0028, M.trim, 40, 5);
      trim.castShadow = false;
      root.add(trim);
    }

    const buttonY = [1.835, 1.735, 1.635, 1.555];
    for (let i = 0; i < buttonY.length; i++) {
      const y = buttonY[i];
      const z = 0.278 + 0.018 * Math.max(0, 1.9 - y);
      const g = new THREE.CylinderGeometry(0.0165, 0.0165, 0.008, 28);
      const m = new THREE.Mesh(g, M.button);
      m.rotation.x = Math.PI / 2;
      m.position.set(0, y, z);
      m.castShadow = true;
      root.add(m);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0158, 0.0024, 8, 28), M.buttonRim);
      rim.position.set(0, y, z + 0.0035);
      root.add(rim);
      const hole = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 10, 8), M.buttonRim);
      hole.position.set(-0.0045, y, z + 0.005);
      root.add(hole);
      const hole2 = hole.clone();
      hole2.position.x = 0.0045;
      root.add(hole2);
    }
  }

  // pocket on her left chest
  {
    const w = 0.128, h = 0.118;
    const cx = 0.163, cy = 1.795;
    const pocketGeo = new THREE.PlaneGeometry(w, h, 12, 12);
    const pos = pocketGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, y = pos.getY(i) + cy;
      const z = 0.252 - 0.312 * Math.pow(x, 2) - 3.4 * Math.pow(Math.max(0, y - 1.925), 2) + 0.02 * Math.max(0, 1.925 - y);
      pos.setXYZ(i, x, y, z);
    }
    pocketGeo.computeVertexNormals();
    addMesh(root, pocketGeo, M.fabric(0.42, 0.4), { cast: false, ink: 0.0022, name: 'pocket' });

    // rounded piping around the pocket
    const pts = [];
    const rr = 0.024;
    const corners = [
      [cx - w / 2 + rr, cy + h / 2 - rr, Math.PI, Math.PI * 1.5],
      [cx + w / 2 - rr, cy + h / 2 - rr, Math.PI * 1.5, Math.PI * 2],
      [cx + w / 2 - rr, cy - h / 2 + rr, 0, Math.PI * 0.5],
      [cx - w / 2 + rr, cy - h / 2 + rr, Math.PI * 0.5, Math.PI],
    ];
    for (const [ccx, ccy, a0, a1] of corners) {
      for (let k = 0; k <= 5; k++) {
        const a = THREE.MathUtils.lerp(a0, a1, k / 5);
        const x = ccx + Math.cos(a) * rr;
        const y = ccy + Math.sin(a) * rr;
        pts.push(V(x, y, 0.257 - 0.312 * x * x + 0.02 * Math.max(0, 1.925 - y)));
      }
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const pipe = trimTube(curve, 0.0038, M.trim, 140, 5);
    pipe.castShadow = false;
    root.add(pipe);

    // tiny embroidered cat-face button at the pocket
    const fold = new THREE.Mesh(
      new THREE.PlaneGeometry(0.13, 0.032),
      new THREE.MeshBasicMaterial({
        map: makeShadowTexture(), transparent: true, opacity: 0.2,
        color: 0x7da4c5, depthWrite: false, toneMapped: false,
      })
    );
    fold.position.set(cx, cy + h / 2 - 0.005, 0.271);
    fold.rotation.z = 0.01;
    root.add(fold);
  }

  /* ── sleeves ────────────────────────────────────────── */
  for (const side of [-1, 1]) {
    const sg = new THREE.Group();
    sg.position.set(side * 0.305, 2.01, 0.008);
    sg.rotation.z = side * 0.44;
    sg.rotation.x = 0.06;
    sg.name = side < 0 ? 'sleeve_R' : 'sleeve_L';
    root.add(sg);

    const rings = [
      { y: 0.03, rx: 0.125, rz: 0.145 },
      { y: -0.03, rx: 0.15, rz: 0.16 },
      { y: -0.11, rx: 0.163, rz: 0.168 },
      { y: -0.19, rx: 0.175, rz: 0.176 },
      { y: -0.245, rx: 0.183, rz: 0.18 },
    ];
    const geoS = loft(rings, {
      radialSegments: 40, capTop: true,
      wrinkle: (a, t) => 0.012 * Math.sin(a * 5 + t * 2) * t,
    });
    addMesh(sg, geoS, M.fabric(2.0, 0.62), { ink: 0.0048, name: 'sleeve' });

    const band = scallopBand({
      yTop: -0.238, yBottom: -0.285, rx: 0.184, rz: 0.181,
      scallops: 10, amp: 0.019, bulge: 0.006, segments: 80,
      material: M.trim, phase: side * 0.2,
    });
    band.castShadow = false;
    sg.add(band);

    const edgePts = scallopEdgePoints(0.187, 0.184, -0.285, 0, 0, 10, 0.019, 120, side * 0.2);
    const edgeCurve = new THREE.CatmullRomCurve3(edgePts, true);
    const edgeTube = trimTube(edgeCurve, 0.0035, M.trim, 160, 5);
    edgeTube.castShadow = false;
    sg.add(edgeTube);

    // lining ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.154, 0.009, 8, 48), M.trim);
    ring.rotation.x = Math.PI / 2;
    ring.scale.z = 0.94;
    ring.position.y = -0.238;
    sg.add(ring);

    // soft crease just above the cuff
    const crease = new THREE.Mesh(
      new THREE.TorusGeometry(0.178, 0.003, 6, 60), M.trim
    );
    crease.rotation.x = Math.PI / 2;
    crease.scale.z = 0.96;
    crease.position.y = -0.217;
    sg.add(crease);
  }

  /* ════════════════════════════════════════════════════════
     PAJAMA SHORTS
     ════════════════════════════════════════════════════════ */
  {
    const hipGeo = loft([
      { y: 1.585, rx: 0.325, rz: 0.252 },
      { y: 1.48, rx: 0.333, rz: 0.26 },
      { y: 1.37, rx: 0.322, rz: 0.252 },
      { y: 1.29, rx: 0.302, rz: 0.242 },
    ], {
      radialSegments: 48,
      capTop: true,
      capBottom: false,
      wrinkle: (a, t) => 0.006 * Math.sin(a * 8 + t * 3),
    });
    addMesh(root, hipGeo, M.fabric(3.55, 0.75), { ink: 0.004, name: 'shorts_hip' });

    for (const side of [-1, 1]) {
      const cxTop = side * 0.118;
      const cxMid = side * 0.142;
      const cxHem = side * 0.158;
      const legGeo = loft([
        { y: 1.472, rx: 0.192, rz: 0.214, cx: cxTop, cz: 0.002 },
        { y: 1.37, rx: 0.197, rz: 0.216, cx: side * 0.133, cz: 0.004 },
        { y: 1.27, rx: 0.183, rz: 0.202, cx: cxMid, cz: 0.006 },
        { y: 1.19, rx: 0.172, rz: 0.19, cx: side * 0.152, cz: 0.008 },
        { y: 1.148, rx: 0.164, rz: 0.181, cx: cxHem, cz: 0.008 },
      ], {
        radialSegments: 52,
        capTop: false,
        capBottom: true,
        wrinkle: (a, t) => 0.008 * Math.sin(a * 7 + t * 2.5) + 0.003 * Math.sin(a * 15 + 1.2),
      });
      addMesh(root, legGeo, M.fabric(2.05, 0.62), { ink: 0.0045, name: 'shorts_leg' });

      const band = scallopBand({
        yTop: 1.152, yBottom: 1.105, rx: 0.17, rz: 0.187,
        cx: cxHem, cz: 0.008,
        scallops: 12, amp: 0.018, bulge: 0.006, segments: 88,
        material: M.trim, phase: side * 0.35,
      });
      band.castShadow = false;
      root.add(band);

      const edgePts = scallopEdgePoints(0.173, 0.19, 1.105, cxHem, 0.008, 12, 0.018, 132, side * 0.35);
      const edge = trimTube(new THREE.CatmullRomCurve3(edgePts, true), 0.0032, M.trim, 160, 5);
      edge.castShadow = false;
      root.add(edge);

      // small side seam
      const seamPts = [];
      for (let k = 0; k <= 8; k++) {
        const y = THREE.MathUtils.lerp(1.46, 1.16, k / 8);
        seamPts.push(V(side * (0.265 + 0.013 * (1 - k / 8)), y, 0.02));
      }
      const seam = trimTube(new THREE.CatmullRomCurve3(seamPts), 0.0022, M.trim, 30, 4);
      root.add(seam);
    }
  }

  /* ════════════════════════════════════════════════════════
     ARMS + HANDS
     ════════════════════════════════════════════════════════ */
  // character's right arm — raised, fingertips in her hair
  {
    const armPts = [
      V(-0.312, 1.985, 0.014),
      V(-0.392, 1.870, 0.045),
      V(-0.446, 1.742, 0.072),
      V(-0.442, 1.960, 0.108),
      V(-0.382, 2.220, 0.152),
      V(-0.312, 2.418, 0.186),
    ];
    const armGeo = limbGeometry(armPts, [0.073, 0.064, 0.052, 0.049, 0.042, 0.034], {
      radialSegments: 18, tubularSegments: 48,
    });
    addMesh(root, armGeo, M.skin, { ink: 0.0038, name: 'arm_raised' });

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.052, 20, 16), M.skin);
    elbow.position.set(-0.446, 1.742, 0.072);
    elbow.castShadow = true;
    root.add(elbow);

    // hand
    const hand = new THREE.Group();
    hand.position.set(-0.292, 2.452, 0.212);
    hand.rotation.set(-0.26, -0.46, -0.22);
    hand.name = 'hand_raised';
    root.add(hand);
    const palmGeo = new THREE.SphereGeometry(1, 28, 22);
    const palm = new THREE.Mesh(palmGeo, M.skin);
    palm.scale.set(0.042, 0.058, 0.022);
    palm.position.y = 0.028;
    palm.castShadow = true;
    hand.add(palm);
    const palmInk = new THREE.Mesh(makeOutlineGeometry(palmGeo, 0.0018), M.outline);
    palmInk.scale.copy(palm.scale);
    palmInk.position.copy(palm.position);
    hand.add(palmInk);
    outlines.push(palmInk);

    // wrist blend
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.033, 16, 12), M.skin);
    wrist.position.set(0, -0.008, 0);
    hand.add(wrist);

    const fingerXs = [-0.028, -0.0095, 0.0095, 0.028];
    const fingerLens = [0.072, 0.084, 0.079, 0.066];
    for (let i = 0; i < 4; i++) {
      const x = fingerXs[i];
      const len = fingerLens[i];
      const pts = [
        V(x, 0.052, 0.0),
        V(x * 1.05, 0.052 + len * 0.45, 0.008),
        V(x * 1.12 + 0.003, 0.052 + len * 0.82, 0.006),
        V(x * 1.16 + 0.008, 0.052 + len, -0.002),
      ];
      const g = sweepEllipse(pts, {
        tubularSegments: 14, radialSegments: 8,
        widthFn: (t) => THREE.MathUtils.lerp(0.020, 0.012, t),
        thicknessFn: (t) => THREE.MathUtils.lerp(0.019, 0.011, t),
        sideHint: V(1, 0, 0),
        colorRoot: 0xffffff, colorMid: 0xffffff, colorTip: 0xffffff,
        capStart: true, capEnd: true,
      });
      const fm = new THREE.Mesh(g, M.skin);
      fm.castShadow = true;
      hand.add(fm);
      const tip = pts[3];
      const nail = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M.pinkSatin);
      nail.scale.set(0.0062, 0.0095, 0.0022);
      nail.position.set(tip.x, tip.y - 0.002, tip.z + 0.0075);
      hand.add(nail);
    }
    const thumbPts = [
      V(-0.038, 0.018, 0.008),
      V(-0.056, 0.045, 0.022),
      V(-0.057, 0.072, 0.03),
      V(-0.048, 0.088, 0.03),
    ];
    const thumbGeo = sweepEllipse(thumbPts, {
      tubularSegments: 12, radialSegments: 8,
      widthFn: (t) => THREE.MathUtils.lerp(0.022, 0.013, t),
      thicknessFn: (t) => THREE.MathUtils.lerp(0.02, 0.012, t),
      capStart: true, capEnd: true,
    });
    const thumb = new THREE.Mesh(thumbGeo, M.skin);
    thumb.castShadow = true;
    hand.add(thumb);
  }

  // character's left arm — relaxed, holding the pillow
  {
    const armPts = [
      V(0.318, 1.98, 0.010),
      V(0.378, 1.866, 0.040),
      V(0.428, 1.742, 0.062),
      V(0.452, 1.626, 0.084),
      V(0.456, 1.512, 0.104),
    ];
    const armGeo = limbGeometry(armPts, [0.072, 0.062, 0.053, 0.045, 0.036], {
      radialSegments: 18, tubularSegments: 36,
    });
    addMesh(root, armGeo, M.skin, { ink: 0.0038, name: 'arm_relaxed' });

    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.052, 20, 16), M.skin);
    elbow.position.set(0.428, 1.742, 0.062);
    elbow.castShadow = true;
    root.add(elbow);

    const hand = new THREE.Group();
    hand.position.set(0.448, 1.502, 0.126);
    hand.rotation.set(0.42, 0.22, -0.12);
    hand.name = 'hand_resting';
    root.add(hand);

    const palmGeo = new THREE.SphereGeometry(1, 28, 22);
    const palm = new THREE.Mesh(palmGeo, M.skin);
    palm.scale.set(0.044, 0.056, 0.021);
    palm.position.y = -0.012;
    palm.castShadow = true;
    hand.add(palm);
    const palmInk = new THREE.Mesh(makeOutlineGeometry(palmGeo, 0.0018), M.outline);
    palmInk.scale.copy(palm.scale);
    palmInk.position.copy(palm.position);
    hand.add(palmInk);
    outlines.push(palmInk);

    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), M.skin);
    wrist.position.set(0, 0.033, 0);
    hand.add(wrist);

    const fingerXs = [-0.027, -0.009, 0.009, 0.027];
    const fingerLens = [0.062, 0.075, 0.072, 0.06];
    for (let i = 0; i < 4; i++) {
      const x = fingerXs[i];
      const len = fingerLens[i];
      const pts = [
        V(x, -0.03, 0.0),
        V(x * 1.05, -0.03 - len * 0.45, -0.012),
        V(x * 1.08, -0.03 - len * 0.85, -0.026),
        V(x * 1.12, -0.03 - len, -0.038),
      ];
      const g = sweepEllipse(pts, {
        tubularSegments: 14, radialSegments: 8,
        widthFn: (t) => THREE.MathUtils.lerp(0.019, 0.012, t),
        thicknessFn: (t) => THREE.MathUtils.lerp(0.018, 0.011, t),
        sideHint: V(1, 0, 0),
        colorRoot: 0xffffff, colorMid: 0xffffff, colorTip: 0xffffff,
        capStart: true, capEnd: true,
      });
      const fm = new THREE.Mesh(g, M.skin);
      fm.castShadow = true;
      hand.add(fm);
      const tip = pts[3];
      const nail = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M.pinkSatin);
      nail.scale.set(0.006, 0.009, 0.0022);
      nail.position.set(tip.x, tip.y + 0.002, tip.z + 0.0065);
      hand.add(nail);
    }
    const thumbPts = [
      V(-0.038, -0.005, 0.008),
      V(-0.058, -0.028, 0.016),
      V(-0.064, -0.052, 0.026),
      V(-0.055, -0.068, 0.028),
    ];
    const thumbGeo = sweepEllipse(thumbPts, {
      tubularSegments: 12, radialSegments: 8,
      widthFn: (t) => THREE.MathUtils.lerp(0.022, 0.013, t),
      thicknessFn: (t) => THREE.MathUtils.lerp(0.02, 0.012, t),
      capStart: true, capEnd: true,
    });
    const thumb = new THREE.Mesh(thumbGeo, M.skin);
    thumb.castShadow = true;
    hand.add(thumb);
  }

  /* ════════════════════════════════════════════════════════
     LEGS + SLIPPERS
     ════════════════════════════════════════════════════════ */
  const legSpecs = [
    {
      side: -1,
      pts: [
        V(-0.148, 1.49, 0.028), V(-0.153, 1.23, 0.045), V(-0.16, 0.92, 0.072),
        V(-0.16, 0.64, 0.096), V(-0.153, 0.38, 0.115), V(-0.15, 0.21, 0.124),
      ],
      radii: [0.108, 0.1, 0.079, 0.073, 0.054, 0.044],
      slipper: { x: -0.15, z: 0.10, rotY: 0.13, tilt: 0.0, y: 0.0, raised: false },
    },
    {
      side: 1,
      pts: [
        V(0.154, 1.49, 0.005), V(0.16, 1.23, 0.0), V(0.172, 0.92, -0.008),
        V(0.185, 0.64, -0.016), V(0.195, 0.4, -0.022), V(0.2, 0.27, -0.026),
      ],
      radii: [0.107, 0.099, 0.079, 0.078, 0.056, 0.044],
      slipper: { x: 0.203, z: 0.002, rotY: -0.55, tilt: 0.29, y: 0.083, raised: true },
    },
  ];

  for (const spec of legSpecs) {
    const geo = limbGeometry(spec.pts, spec.radii, { radialSegments: 20, tubularSegments: 48 });
    addMesh(root, geo, M.skin, { ink: 0.0038, name: 'leg' });

    const knee = new THREE.Mesh(new THREE.SphereGeometry(spec.radii[2] * 1.08, 22, 16), M.skin);
    knee.position.copy(spec.pts[2]);
    knee.scale.set(1, 1.02, 0.98);
    knee.castShadow = true;
    root.add(knee);

    // build slipper
    const sp = spec.slipper;
    const sg = new THREE.Group();
    sg.position.set(sp.x, sp.y, sp.z);
    sg.rotation.set(sp.tilt, sp.rotY, spec.side * -0.03);
    sg.name = spec.raised ? 'slipper_back' : 'slipper_front';
    root.add(sg);

    // hidden foot
    const foot = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), M.skin);
    foot.scale.set(0.058, 0.046, 0.108);
    foot.position.set(0, 0.095, 0.02);
    foot.rotation.x = -0.15;
    sg.add(foot);

    // sole
    const soleGeo = new THREE.SphereGeometry(1, 40, 26);
    const soleMesh = new THREE.Mesh(soleGeo, M.sole);
    soleMesh.scale.set(0.118, 0.030, 0.184);
    soleMesh.position.set(0, 0.026, 0.038);
    soleMesh.castShadow = true;
    sg.add(soleMesh);
    const soleInk = new THREE.Mesh(makeOutlineGeometry(soleGeo, 0.0018), M.softOutline);
    soleInk.scale.copy(soleMesh.scale);
    soleInk.position.copy(soleMesh.position);
    sg.add(soleInk);
    outlines.push(soleInk);

    // plush upper
    const upperGeo = new THREE.SphereGeometry(1, 48, 34);
    const upper = new THREE.Mesh(upperGeo, M.plush);
    upper.scale.set(0.112, 0.090, 0.156);
    upper.position.set(0, 0.078, 0.058);
    upper.castShadow = true;
    sg.add(upper);
    const upperInk = new THREE.Mesh(makeOutlineGeometry(upperGeo, 0.0018), M.softOutline);
    upperInk.scale.copy(upper.scale);
    upperInk.position.copy(upper.position);
    sg.add(upperInk);
    outlines.push(upperInk);

    // fluffy ankle collar
    const fur = new THREE.Mesh(new THREE.TorusGeometry(0.070, 0.019, 10, 42), M.plush);
    fur.rotation.x = Math.PI / 2;
    fur.scale.set(1.02, 1.25, 1.0);
    fur.position.set(0, 0.145, -0.028);
    fur.castShadow = true;
    sg.add(fur);
    const furInk = new THREE.Mesh(makeOutlineGeometry(new THREE.TorusGeometry(0.070, 0.019, 10, 42), 0.0012), M.softOutline);
    furInk.rotation.copy(fur.rotation);
    furInk.scale.copy(fur.scale);
    furInk.position.copy(fur.position);
    sg.add(furInk);
    outlines.push(furInk);

    // inner opening
    const opening = new THREE.Mesh(
      new THREE.CircleGeometry(0.062, 32),
      new THREE.MeshBasicMaterial({ color: 0xa9c4dd, transparent: true, opacity: 0.55 })
    );
    opening.rotation.x = -Math.PI / 2;
    opening.position.set(0, 0.151, -0.028);
    sg.add(opening);

    // seam across the vamp
    const seamPts = [];
    for (let k = 0; k <= 12; k++) {
      const t = k / 12;
      const x = THREE.MathUtils.lerp(-0.092, 0.092, t);
      const z = 0.140 - 0.072 * Math.pow((x / 0.092), 2);
      const y = 0.138 - 0.039 * Math.pow(Math.abs(x) / 0.092, 2);
      seamPts.push(V(x, y, z));
    }
    const seam = trimTube(new THREE.CatmullRomCurve3(seamPts), 0.0021, M.trim, 30, 4);
    seam.castShadow = false;
    sg.add(seam);

    // sole piping
    const rimPts = [];
    for (let k = 0; k < 64; k++) {
      const a = (k / 64) * TAU;
      rimPts.push(V(Math.cos(a) * 0.111, 0.056 - 0.007 * Math.cos(a), 0.038 + Math.sin(a) * 0.176));
    }
    const rim = trimTube(new THREE.CatmullRomCurve3(rimPts, true), 0.0028, M.trim, 100, 4);
    rim.castShadow = false;
    sg.add(rim);

    // pink bow on the vamp
    const bow = new THREE.Group();
    bow.position.set(0.0, 0.158, 0.128);
    bow.rotation.x = -0.18;
    sg.add(bow);
    for (const sx of [-1, 1]) {
      const loop = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), M.pinkSatin);
      loop.scale.set(0.031, 0.017, 0.008);
      loop.position.set(sx * 0.024, 0.012, 0);
      loop.rotation.z = sx * 0.55;
      loop.castShadow = true;
      bow.add(loop);
      const loopInk = new THREE.Mesh(makeOutlineGeometry(new THREE.SphereGeometry(1, 18, 12), 0.001), M.outline);
      loopInk.scale.copy(loop.scale);
      loopInk.position.copy(loop.position);
      loopInk.rotation.copy(loop.rotation);
      bow.add(loopInk);
      outlines.push(loopInk);
    }
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.013, 16, 12), M.pinkSatin);
    knot.position.set(0, 0.008, 0.007);
    bow.add(knot);
    const tail1 = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 8), M.pinkSatin);
    tail1.rotation.z = 1.2;
    tail1.position.set(-0.012, -0.014, 0.004);
    bow.add(tail1);
    const tail2 = tail1.clone();
    tail2.rotation.z = -1.2;
    tail2.position.x = 0.012;
    bow.add(tail2);
  }

  /* ════════════════════════════════════════════════════════
     PILLOW
     ════════════════════════════════════════════════════════ */
  const pillowGroup = new THREE.Group();
  pillowGroup.position.set(0.472, 0.955, 0.030);
  pillowGroup.rotation.set(0.05, -0.30, -0.19);
  pillowGroup.name = 'pillow';
  root.add(pillowGroup);

  {
    const pw = 0.68, ph = 0.96, pd = 0.30;
    const geo = makePillowGeometry(pw, ph, pd, 7);
    addMesh(pillowGroup, geo, M.pillow, { ink: 0.0028, inkMat: M.softOutline, name: 'pillow_body' });

    const seamCurve = pillowSeamCurve(pw, ph, pd, 0.008);
    const seamA = trimTube(seamCurve, 0.0026, M.pillowSeam, 220, 5);
    seamA.castShadow = false;
    pillowGroup.add(seamA);

    // shallow fold lines across the face of the pillow
    const foldMat = new THREE.MeshBasicMaterial({
      color: 0xaec8de, transparent: true, opacity: 0.35, depthWrite: false,
    });
    for (let i = 0; i < 3; i++) {
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const u = k / 10;
        const x = THREE.MathUtils.lerp(-0.28, 0.25, u);
        const y = 0.25 - i * 0.2 + Math.sin(u * Math.PI * 1.4 + i) * 0.035;
        const z = pd * 0.5 * 0.82 * Math.sqrt(Math.max(0.02, 1 - Math.pow(x / (pw * 0.5), 2) - Math.pow(y / (ph * 0.5), 2))) + 0.003;
        pts.push(V(x, y, z));
      }
      const fold = trimTube(new THREE.CatmullRomCurve3(pts), 0.0018, foldMat, 24, 4);
      fold.castShadow = false;
      pillowGroup.add(fold);
    }

    // fine blue edge stitching
    const stitchPts = [];
    for (let k = 0; k < 96; k++) {
      const a = (k / 96) * TAU;
      const c = Math.abs(Math.cos(a));
      const s = Math.abs(Math.sin(a));
      const n = 3.6;
      const sr = 1 / Math.pow(Math.pow(c, n) + Math.pow(s, n), 1 / n);
      stitchPts.push(V(Math.cos(a) * sr * pw * 0.465, Math.sin(a) * sr * ph * 0.465, 0.004));
    }
    const stitch = trimTube(new THREE.CatmullRomCurve3(stitchPts, true), 0.001, foldMat, 160, 3);
    stitch.castShadow = false;
    pillowGroup.add(stitch);
  }

  /* ════════════════════════════════════════════════════════
     IDLE ANIMATION
     ════════════════════════════════════════════════════════ */
  const restRot = pillowGroup.rotation.clone();
  const haloBaseY = halo.position.y;
  const eyeBaseY = eyeData.map((e) => e.group.position.y);
  let blinkStart = -10;
  let nextBlink = 2.4;

  const update = (t, dt) => {
    // hair — slow, weighty secondary motion
    for (let i = 0; i < hairLocks.length; i++) {
      const l = hairLocks[i];
      const sway = Math.sin(t * 0.55 + l.phase) * l.amp + Math.sin(t * 1.17 + l.phase * 1.8) * l.amp * 0.35;
      const swayX = Math.cos(t * 0.42 + l.phase * 0.9) * l.ampX;
      l.group.rotation.z = l.baseRot.z + sway;
      l.group.rotation.x = l.baseRot.x + swayX;
    }

    root.position.y = Math.sin(t * 1.05) * 0.0022;
    halo.position.y = haloBaseY + Math.sin(t * 0.9 + 0.4) * 0.011;
    halo.rotation.z = -0.055 + Math.sin(t * 0.55) * 0.012;

    pillowGroup.rotation.z = restRot.z + Math.sin(t * 0.7 + 1.2) * 0.006;
    pillowGroup.rotation.x = restRot.x + Math.sin(t * 0.5) * 0.004;

    for (const s of sprites) {
      s.sprite.material.opacity = s.baseOpacity * (0.72 + 0.28 * Math.sin(t * 1.6 + s.phase));
    }

    // blink
    if (t > nextBlink) {
      blinkStart = t;
      nextBlink = t + 2.8 + rnd() * 3.4;
    }
    let blink = 0;
    const bt = t - blinkStart;
    if (bt >= 0 && bt < 0.17) blink = Math.sin((bt / 0.17) * Math.PI);
    for (let i = 0; i < eyeData.length; i++) {
      const e = eyeData[i];
      const amount = Math.pow(blink, 1.4);
      e.group.scale.y = 1 - amount * 0.92;
      e.group.position.y = eyeBaseY[i] - amount * 0.018;
    }
  };

  update(0, 0);

  return {
    root,
    outlines,
    hairLocks,
    halo,
    bowGroup,
    pillowGroup,
    headGroup,
    eyes: eyeData,
    update,
  };
}




