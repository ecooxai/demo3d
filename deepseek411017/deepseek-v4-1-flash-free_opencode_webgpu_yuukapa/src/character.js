import * as THREE from 'three';
import {
  makeLoftGeometry,
  makeTubeGeometry,
  makeHairLockGeometry,
  makeHairFringeGeometry,
  makeHairCapeGeometry,
  makePillowGeometry,
  makeScallopedRing,
  createRoundedBox,
  makePetalShape,
} from './geometry.js';
import { addOutline } from './materials.js';
import { makeIrisTexture, makeBlushTexture, makeFaceTexture } from './textures.js';

const TAU = Math.PI * 2;

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeHeadGeometry() {
  const geometry = new THREE.SphereGeometry(1, 112, 80);
  const positions = geometry.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < positions.count; i += 1) {
    v.fromBufferAttribute(positions, i);
    const y = v.y;
    const jaw = THREE.MathUtils.smoothstep(-y, 0.08, 1);
    const jawCurve = Math.pow(jaw, 1.12);

    let x = v.x * 0.588 * (1 - 0.5 * jawCurve);
    let z = v.z * 0.55 * (1 - 0.06 * jawCurve);
    const ny = y * 0.635;

    x *= 1 + 0.055 * THREE.MathUtils.smoothstep(y, 0.0, 0.8);
    z += 0.05 * Math.pow(jaw, 1.85);
    if (z > 0) z *= 0.965;
    z += 0.024 * Math.exp(-Math.pow((y + 0.52) / 0.24, 2));

    positions.setXYZ(i, x, ny, z);
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeRoundedRectPoints(width, height, radius, z = 0, segments = 8) {
  const points = [];
  const hw = width / 2;
  const hh = height / 2;
  const corners = [
    [hw - radius, -hh + radius, -Math.PI / 2],
    [hw - radius, hh - radius, 0],
    [-hw + radius, hh - radius, Math.PI / 2],
    [-hw + radius, -hh + radius, Math.PI],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= segments; i += 1) {
      const a = start + (i / segments) * (Math.PI / 2);
      points.push(new THREE.Vector3(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, z));
    }
  }
  return points;
}


function makeFacePatchGeometry() {
  const x0 = -0.455;
  const x1 = 0.455;
  const y0 = -0.29;
  const y1 = 0.33;
  const cols = 36;
  const rows = 30;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= rows; j += 1) {
    const y = THREE.MathUtils.lerp(y0, y1, j / rows);
    const ny = y / 0.63;
    const jaw = THREE.MathUtils.smoothstep(-ny, 0.08, 1);
    const jawCurve = Math.pow(jaw, 1.12);
    const rx = 0.588 * (1 - 0.5 * jawCurve);
    const rz = 0.552 * (1 - 0.06 * jawCurve);

    for (let i = 0; i <= cols; i += 1) {
      const x = THREE.MathUtils.lerp(x0, x1, i / cols);
      const radial = Math.max(0, 1 - Math.pow(x / rx, 2) - Math.pow(ny, 2));
      let z = rz * Math.sqrt(radial);
      z += 0.05 * Math.pow(jaw, 1.85);
      z *= 0.965;
      z += 0.024 * Math.exp(-Math.pow((ny + 0.52) / 0.24, 2));
      z += 0.016;
      positions.push(x, y, z);
      uvs.push((x - x0) / (x1 - x0), (y - y0) / (y1 - y0));
    }
  }

  const stride = cols + 1;
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const a = j * stride + i;
      const b = a + 1;
      const c = (j + 1) * stride + i;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createEye(mats, x) {
  const irisTexture = makeIrisTexture();
  const group = new THREE.Group();
  group.position.set(x, 0.045, 0.535);
  group.rotation.y = x > 0 ? 0.18 : -0.18;
  group.rotation.x = 0.015;
  if (x > 0) group.scale.x = -1;

  const blink = new THREE.Group();
  group.add(blink);

  const w = 0.142;
  const h = 0.105;
  const eyeShape = new THREE.Shape();
  eyeShape.moveTo(-w, 0);
  eyeShape.bezierCurveTo(-w * 0.78, h * 0.92, -w * 0.18, h * 1.18, w * 0.55, h * 0.8);
  eyeShape.quadraticCurveTo(w * 1.08, h * 0.42, w, 0);
  eyeShape.bezierCurveTo(w * 0.7, -h * 0.9, -w * 0.58, -h * 0.88, -w, 0);

  const sclera = new THREE.Mesh(new THREE.ShapeGeometry(eyeShape, 36), mats.eyeWhite);
  sclera.position.z = 0.001;
  blink.add(sclera);

  const irisMat = new THREE.MeshBasicMaterial({
    map: irisTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const iris = new THREE.Mesh(new THREE.PlaneGeometry(0.195, 0.195), irisMat);
  iris.position.set(-0.003, 0.002, 0.005);
  blink.add(iris);

  const gleamMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const gleam = new THREE.Mesh(new THREE.CircleGeometry(0.011, 16), gleamMat);
  gleam.position.set(-0.04, 0.035, 0.011);
  blink.add(gleam);

  const gleamSmall = new THREE.Mesh(new THREE.CircleGeometry(0.005, 12), gleamMat);
  gleamSmall.position.set(0.033, -0.027, 0.011);
  blink.add(gleamSmall);

  const upperLash = makeTubeGeometry(
    [
      new THREE.Vector3(-w * 1.02, h * 0.02, 0.009),
      new THREE.Vector3(-w * 0.58, h * 0.95, 0.01),
      new THREE.Vector3(-w * 0.06, h * 1.16, 0.011),
      new THREE.Vector3(w * 0.58, h * 0.82, 0.01),
      new THREE.Vector3(w * 1.03, h * 0.22, 0.009),
    ],
    [0.004, 0.009, 0.01, 0.007, 0.002],
    24,
    7,
  );
  blink.add(new THREE.Mesh(upperLash, mats.lash));

  const outerLash = makeTubeGeometry(
    [
      new THREE.Vector3(-w * 0.88, h * 0.24, 0.01),
      new THREE.Vector3(-w * 1.13, h * 0.53, 0.009),
      new THREE.Vector3(-w * 1.28, h * 0.72, 0.007),
    ],
    [0.008, 0.005, 0.001],
    12,
    6,
  );
  blink.add(new THREE.Mesh(outerLash, mats.lash));

  const lowerLash = makeTubeGeometry(
    [
      new THREE.Vector3(-w * 0.72, -h * 0.54, 0.009),
      new THREE.Vector3(0, -h * 0.78, 0.01),
      new THREE.Vector3(w * 0.76, -h * 0.36, 0.009),
    ],
    [0.003, 0.004, 0.001],
    16,
    5,
  );
  const lowerMat = new THREE.MeshBasicMaterial({
    color: 0x5b427f,
    transparent: true,
    opacity: 0.52,
    side: THREE.DoubleSide,
  });
  blink.add(new THREE.Mesh(lowerLash, lowerMat));

  const brow = makeTubeGeometry(
    [
      new THREE.Vector3(-w * 1.0, h * 1.92, 0.015),
      new THREE.Vector3(-w * 0.16, h * 2.16, 0.018),
      new THREE.Vector3(w * 0.92, h * 1.86, 0.014),
    ],
    [0.004, 0.006, 0.002],
    14,
    5,
  );
  group.add(new THREE.Mesh(brow, mats.brow));

  group.userData.blinkGroup = blink;
  return group;
}

function createHand(mats, { side = 1, grasp = false } = {}) {
  const group = new THREE.Group();
  const palm = new THREE.Mesh(createRoundedBox(0.145, 0.17, 0.085, 0.035, 4), mats.skin);
  palm.position.y = 0.015;
  palm.castShadow = true;
  palm.receiveShadow = true;
  group.add(palm);

  const fingerPositions = [-0.052, -0.018, 0.018, 0.051];
  for (let i = 0; i < fingerPositions.length; i += 1) {
    const length = i === 3 ? 0.068 : i === 0 ? 0.078 : 0.088;
    const finger = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.0185, length, 4, 8),
      mats.skin,
    );
    finger.position.set(fingerPositions[i], 0.105 + length * 0.38, grasp ? 0.02 : 0);
    finger.rotation.z = (fingerPositions[i] / 0.06) * -0.1;
    finger.rotation.x = grasp ? 0.65 : 0.08;
    finger.castShadow = true;
    group.add(finger);
  }

  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.021, 0.065, 4, 8), mats.skin);
  thumb.position.set(side * 0.087, 0.035, grasp ? 0.025 : 0.01);
  thumb.rotation.z = side * 0.92;
  thumb.rotation.x = grasp ? 0.5 : 0.15;
  thumb.castShadow = true;
  group.add(thumb);

  return group;
}

function createSlipper(mats, side) {
  const group = new THREE.Group();

  const sole = new THREE.Mesh(createRoundedBox(0.48, 0.075, 0.82, 0.055, 6), mats.slipperSole);
  sole.position.set(0, 0.045, 0.12);
  sole.castShadow = true;
  sole.receiveShadow = true;
  group.add(sole);

  const upper = new THREE.Mesh(new THREE.SphereGeometry(0.5, 44, 30), mats.slipper);
  upper.scale.set(0.275, 0.215, 0.4);
  upper.position.set(0, 0.19, 0.08);
  upper.castShadow = true;
  upper.receiveShadow = true;
  group.add(upper);

  const toe = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 26), mats.slipper);
  toe.scale.set(0.255, 0.155, 0.245);
  toe.position.set(0, 0.22, 0.33);
  toe.castShadow = true;
  group.add(toe);

  // Small plush bunny ears give the slippers their storybook read.
  for (const earSide of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.5, 22, 16), mats.slipper);
    ear.scale.set(0.068, 0.145, 0.05);
    ear.position.set(earSide * 0.112, 0.34, 0.12);
    ear.rotation.set(-0.35, 0, earSide * 0.26);
    ear.castShadow = true;
    group.add(ear);

    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12), mats.bowPink);
    inner.scale.set(0.03, 0.078, 0.016);
    inner.position.set(earSide * 0.112, 0.345, 0.153);
    inner.rotation.set(-0.35, 0, earSide * 0.26);
    group.add(inner);
  }

  const seam = makeTubeGeometry([
    new THREE.Vector3(-0.2, 0.14, 0.36),
    new THREE.Vector3(0, 0.155, 0.4),
    new THREE.Vector3(0.2, 0.14, 0.36),
  ], [0.006, 0.008, 0.006], 18, 6);
  group.add(new THREE.Mesh(seam, mats.slipperSole));

  const bow = new THREE.Group();
  bow.position.set(0.01, 0.32, 0.335);
  bow.rotation.x = -0.5;
  for (const sign of [-1, 1]) {
    const loop = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), mats.bowPink);
    loop.scale.set(0.083, 0.043, 0.02);
    loop.position.x = sign * 0.064;
    loop.rotation.z = sign * 0.32;
    loop.castShadow = true;
    bow.add(loop);
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), mats.bowPink);
  knot.scale.z = 0.8;
  bow.add(knot);
  group.add(bow);

  if (side < 0) group.rotation.y = -0.13;
  else group.rotation.y = 0.09;
  return group;
}

function createBow(mats, scale = 1) {
  const group = new THREE.Group();

  function makeLoop(sign) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.03);
    shape.bezierCurveTo(sign * 0.18, 0.26, sign * 0.52, 0.29, sign * 0.72, 0.095);
    shape.bezierCurveTo(sign * 0.75, -0.02, sign * 0.5, -0.14, sign * 0.27, -0.115);
    shape.quadraticCurveTo(sign * 0.09, -0.085, 0, -0.04);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.022,
      bevelThickness: 0.018,
      curveSegments: 36,
    });
    geometry.translate(0, 0, -0.041);
    return geometry;
  }

  function makeFold(sign) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.008);
    shape.bezierCurveTo(sign * 0.19, 0.13, sign * 0.44, 0.135, sign * 0.56, 0.04);
    shape.bezierCurveTo(sign * 0.4, -0.05, sign * 0.2, -0.075, 0, -0.03);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.01,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.008,
      bevelThickness: 0.004,
      curveSegments: 20,
    });
    geometry.translate(0, 0, 0.046);
    return geometry;
  }

  for (const sign of [-1, 1]) {
    const loop = new THREE.Mesh(makeLoop(sign), mats.trim);
    loop.position.set(sign * 0.035, 0.045, 0);
    loop.rotation.z = sign * 0.09;
    loop.rotation.y = sign * 0.07;
    loop.castShadow = true;
    addOutline(loop, { thickness: 1.008, material: mats.outline });
    group.add(loop);

    const fold = new THREE.Mesh(makeFold(sign), mats.bowShade);
    fold.rotation.z = sign * 0.09;
    fold.rotation.y = sign * 0.07;
    group.add(fold);
  }

  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.105, 32, 22), mats.trim);
  knot.scale.set(0.82, 0.94, 0.6);
  knot.position.set(0, 0.025, 0.038);
  knot.castShadow = true;
  group.add(knot);

  const knotFold = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.12, 4, 8), mats.pillowShade);
  knotFold.rotation.z = Math.PI / 2;
  knotFold.position.set(0, 0.02, 0.1);
  group.add(knotFold);

  const tailGeometry = new THREE.ExtrudeGeometry(makePetalShape(0.12, 0.62), {
    depth: 0.035,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.009,
    bevelThickness: 0.007,
    curveSegments: 18,
  });
  tailGeometry.translate(0, 0, -0.017);
  for (const sign of [-1, 1]) {
    const tail = new THREE.Mesh(tailGeometry, mats.trim);
    tail.position.set(sign * 0.09, -0.1, -0.06);
    tail.rotation.set(-0.18, sign * -0.16, Math.PI + sign * 0.17);
    tail.castShadow = true;
    group.add(tail);
  }

  group.scale.setScalar(scale);
  return group;
}

function createHalo(mats) {
  const group = new THREE.Group();
  const tilt = new THREE.Group();
  group.add(tilt);

  const darkRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.036, 20, 160), mats.haloDark);
  darkRing.rotation.x = Math.PI / 2;
  darkRing.castShadow = true;
  tilt.add(darkRing);

  const innerDark = new THREE.Mesh(new THREE.TorusGeometry(0.585, 0.014, 12, 140), mats.haloDark);
  innerDark.rotation.x = Math.PI / 2;
  tilt.add(innerDark);

  const rimA = new THREE.Mesh(new THREE.TorusGeometry(0.704, 0.0085, 10, 180), mats.haloGlow);
  rimA.rotation.x = Math.PI / 2;
  tilt.add(rimA);

  const rimB = new THREE.Mesh(new THREE.TorusGeometry(0.665, 0.0045, 8, 180), mats.haloGlow);
  rimB.rotation.x = Math.PI / 2;
  tilt.add(rimB);

  const glowSoft = new THREE.Mesh(new THREE.TorusGeometry(0.71, 0.055, 12, 160), mats.haloGlowSoft);
  glowSoft.rotation.x = Math.PI / 2;
  tilt.add(glowSoft);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeHaloSprite(),
    color: 0x8ceaff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.34,
    toneMapped: false,
  }));
  sprite.scale.set(2.2, 2.2, 1);
  group.add(sprite);

  const light = new THREE.PointLight(0x8ceaff, 2.2, 4.6, 2.2);
  group.add(light);

  const sparkleMat = new THREE.SpriteMaterial({
    map: makeSparkTexture(),
    color: 0xcdf8ff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.9,
    toneMapped: false,
  });
  const sparkles = new THREE.Group();
  for (let i = 0; i < 6; i += 1) {
    const sparkle = new THREE.Sprite(sparkleMat);
    const a = (i / 6) * TAU;
    sparkle.position.set(Math.cos(a) * (0.82 + (i % 2) * 0.06), Math.sin(a * 2) * 0.02, Math.sin(a) * 0.82);
    sparkle.scale.setScalar(0.085 + (i % 3) * 0.02);
    sparkles.add(sparkle);
  }
  group.add(sparkles);

  group.userData.sparkles = sparkles;
  group.userData.tilt = tilt;
  return group;
}

function makeHaloSprite() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.4, 'rgba(128,230,255,0.03)');
  g.addColorStop(0.63, 'rgba(112,222,255,0.24)');
  g.addColorStop(0.7, 'rgba(185,248,255,0.5)');
  g.addColorStop(1, 'rgba(112,222,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSparkTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.translate(size / 2, size / 2);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(220,251,255,0.96)');
  g.addColorStop(0.36, 'rgba(122,226,255,0.24)');
  g.addColorStop(1, 'rgba(122,226,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * TAU;
    const r = i % 2 === 0 ? 58 : 8;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCharacter(mats) {
  const root = new THREE.Group();
  root.name = 'YuukapaCharacter';
  const body = new THREE.Group();
  body.position.y = 0.065;
  root.add(body);

  function mesh(geometry, material, options = {}) {
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = options.cast ?? true;
    object.receiveShadow = options.receive ?? true;
    object.name = options.name ?? '';
    if (options.outline) {
      addOutline(object, {
        thickness: options.outlineThickness ?? 1.014,
        material: mats.outline,
      });
    }
    body.add(object);
    return object;
  }

  // ——— Legs and feet ———————————————————————————————————————
  const leftLegPath = [
    new THREE.Vector3(-0.31, 4.12, 0.025),
    new THREE.Vector3(-0.33, 3.32, 0.03),
    new THREE.Vector3(-0.35, 2.55, 0.025),
    new THREE.Vector3(-0.345, 1.78, 0.035),
    new THREE.Vector3(-0.345, 1.02, 0.07),
    new THREE.Vector3(-0.335, 0.48, 0.14),
    new THREE.Vector3(-0.32, 0.28, 0.18),
  ];
  const rightLegPath = [
    new THREE.Vector3(0.31, 4.12, 0.055),
    new THREE.Vector3(0.34, 3.3, 0.06),
    new THREE.Vector3(0.365, 2.5, 0.09),
    new THREE.Vector3(0.355, 1.74, 0.1),
    new THREE.Vector3(0.35, 0.98, 0.15),
    new THREE.Vector3(0.34, 0.47, 0.24),
    new THREE.Vector3(0.33, 0.28, 0.29),
  ];

  mesh(makeTubeGeometry(leftLegPath, [0.335, 0.305, 0.245, 0.185, 0.128, 0.103], 44, 20), mats.skin, {
    outline: true,
    outlineThickness: 1.012,
    name: 'leftLeg',
  });
  mesh(makeTubeGeometry(rightLegPath, [0.335, 0.305, 0.245, 0.185, 0.128, 0.103], 44, 20), mats.skin, {
    outline: true,
    outlineThickness: 1.012,
    name: 'rightLeg',
  });

  const leftSlipper = createSlipper(mats, -1);
  leftSlipper.position.set(-0.32, 0, 0.055);
  body.add(leftSlipper);

  const rightSlipper = createSlipper(mats, 1);
  rightSlipper.position.set(0.33, 0, 0.15);
  body.add(rightSlipper);

  // ——— Pajama shorts ——————————————————————————————————————
  mesh(makeLoftGeometry([
    { y: 4.58, rx: 0.79, rz: 0.575 },
    { y: 4.42, rx: 0.875, rz: 0.625 },
    { y: 4.12, rx: 0.885, rz: 0.63 },
    { y: 3.8, rx: 0.855, rz: 0.615 },
    { y: 3.56, rx: 0.805, rz: 0.59 },
  ], 64, true, [1.5, 1.2]), mats.pajamaShorts, {
    outline: true,
    outlineThickness: 1.012,
    name: 'pajamaShorts',
  });

  // Two soft bloomer legs make the silhouette read as shorts rather than a skirt.
  for (const side of [-1, 1]) {
    const bloomer = mesh(makeLoftGeometry([
      { y: 3.68, cx: side * 0.405, rx: 0.445, rz: 0.565 },
      { y: 3.42, cx: side * 0.415, rx: 0.46, rz: 0.58 },
      { y: 3.18, cx: side * 0.42, rx: 0.445, rz: 0.565 },
      { y: 3.06, cx: side * 0.42, rx: 0.405, rz: 0.535 },
    ], 48, true, [0.85, 0.6]), mats.pajamaShorts, {
      outline: true,
      outlineThickness: 1.011,
    });
    bloomer.castShadow = true;

    const frill = new THREE.Mesh(
      makeScallopedRing(0.424, 0.55, 3.05, 7, 0.038, 0.022, side * 0.42, 0),
      mats.trim,
    );
    frill.castShadow = true;
    body.add(frill);
  }

  // A soft centre seam gives the single bloomer volume its two-leg read.
  const shortsSeam = makeTubeGeometry([
    new THREE.Vector3(0, 4.44, 0.622),
    new THREE.Vector3(0, 4.05, 0.63),
    new THREE.Vector3(0, 3.64, 0.611),
    new THREE.Vector3(0, 3.22, 0.576),
  ], [0.006, 0.008, 0.007, 0.004], 24, 5);
  body.add(new THREE.Mesh(shortsSeam, mats.trim));

  for (const side of [-1, 1]) {
    const pocketLine = makeTubeGeometry([
      new THREE.Vector3(side * 0.48, 4.3, 0.59),
      new THREE.Vector3(side * 0.52, 4.05, 0.60),
      new THREE.Vector3(side * 0.54, 3.8, 0.585),
    ], [0.004, 0.005, 0.003], 14, 5);
    body.add(new THREE.Mesh(pocketLine, mats.trim));
  }

  // ——— Shirt ————————————————————————————————————————————————
  const shirt = mesh(makeLoftGeometry([
    { y: 4.38, rx: 0.98, rz: 0.66 },
    { y: 4.58, rx: 1.0, rz: 0.68 },
    { y: 4.95, rx: 0.965, rz: 0.665 },
    { y: 5.32, rx: 0.955, rz: 0.66 },
    { y: 5.58, rx: 0.995, rz: 0.665 },
    { y: 5.82, rx: 0.97, rz: 0.635 },
    { y: 5.98, rx: 0.82, rz: 0.53 },
    { y: 6.08, rx: 0.56, rz: 0.4 },
    { y: 6.145, rx: 0.38, rz: 0.31 },
  ], 72, true, [1.55, 2.1]), mats.pajama, {
    outline: true,
    outlineThickness: 1.012,
    name: 'pajamaShirt',
  });
  shirt.castShadow = true;

  const hem = new THREE.Mesh(makeScallopedRing(0.982, 0.664, 4.42, 12, 0.008, 0.015), mats.trim);
  body.add(hem);

  const placket = new THREE.Mesh(createRoundedBox(0.044, 1.43, 0.022, 0.012, 2), mats.trim);
  placket.position.set(0, 5.18, 0.675);
  placket.castShadow = true;
  body.add(placket);

  for (let i = 0; i < 4; i += 1) {
    const button = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 14), mats.button);
    button.scale.set(1, 1, 0.45);
    button.position.set(0, 5.7 - i * 0.4, 0.692);
    body.add(button);
  }

  const neckBand = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.036, 10, 64), mats.trim);
  neckBand.rotation.x = Math.PI / 2;
  neckBand.scale.z = 0.88;
  neckBand.position.set(0, 6.09, 0.01);
  neckBand.castShadow = true;
  body.add(neckBand);

  // Open pyjama neckline with a soft skin triangle beneath crisp collar flaps.
  const neckline = new THREE.Shape();
  neckline.moveTo(-0.23, 6.08);
  neckline.quadraticCurveTo(0, 6.02, 0.23, 6.08);
  neckline.lineTo(0.15, 5.62);
  neckline.quadraticCurveTo(0, 5.48, -0.15, 5.62);
  neckline.closePath();
  const necklineMesh = new THREE.Mesh(new THREE.ShapeGeometry(neckline, 24), mats.skin);
  necklineMesh.position.z = 0.668;
  body.add(necklineMesh);

  for (const side of [-1, 1]) {
    const collar = new THREE.Shape();
    collar.moveTo(side * 0.03, 6.07);
    collar.quadraticCurveTo(side * 0.24, 6.14, side * 0.39, 6.1);
    collar.lineTo(side * 0.48, 5.99);
    collar.quadraticCurveTo(side * 0.31, 5.82, side * 0.22, 5.64);
    collar.lineTo(side * 0.07, 5.45);
    collar.quadraticCurveTo(side * 0.08, 5.8, side * 0.03, 5.94);
    collar.closePath();
    const geometry = new THREE.ExtrudeGeometry(collar, {
      depth: 0.018,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.009,
      bevelThickness: 0.006,
      curveSegments: 20,
    });
    const collarMesh = new THREE.Mesh(geometry, mats.pajamaSolid);
    collarMesh.position.z = 0.666;
    collarMesh.castShadow = true;
    body.add(collarMesh);

    const collarEdge = new THREE.Mesh(makeTubeGeometry([
      new THREE.Vector3(side * 0.47, 6.0, 0.688),
      new THREE.Vector3(side * 0.31, 5.83, 0.694),
      new THREE.Vector3(side * 0.22, 5.65, 0.696),
      new THREE.Vector3(side * 0.075, 5.45, 0.696),
    ], [0.015, 0.015, 0.014, 0.012], 26, 6), mats.trim);
    body.add(collarEdge);
  }

  // Drawn fabric folds: soft blue strokes that suggest drape around the torso.
  const foldSpecs = [
    [[-0.62, 5.72, 0.43], [-0.42, 5.4, 0.56], [-0.5, 5.02, 0.585]],
    [[0.62, 5.72, 0.43], [0.42, 5.4, 0.56], [0.5, 5.02, 0.585]],
    [[-0.3, 5.66, 0.62], [-0.16, 5.46, 0.655], [-0.24, 5.24, 0.66]],
    [[0.34, 5.62, 0.61], [0.2, 5.4, 0.65], [0.28, 5.14, 0.655]],
    [[-0.72, 4.7, 0.48], [-0.5, 4.5, 0.6], [-0.2, 4.42, 0.655]],
    [[0.72, 4.7, 0.48], [0.5, 4.5, 0.6], [0.2, 4.42, 0.655]],
  ];
  for (const [a, b, c] of foldSpecs) {
    const fold = makeTubeGeometry([
      new THREE.Vector3(...a),
      new THREE.Vector3(...b),
      new THREE.Vector3(...c),
    ], [0.004, 0.007, 0.002], 18, 5);
    body.add(new THREE.Mesh(fold, mats.pajamaShade));
  }

  const pocket = new THREE.Mesh(createRoundedBox(0.237, 0.275, 0.023, 0.027, 3), mats.pajamaSolid);
  pocket.position.set(0.35, 5.4, 0.683);
  pocket.rotation.x = -0.02;
  pocket.castShadow = true;
  body.add(pocket);

  const pocketTrimMat = mats.trim;
  const pocketLines = [
    [new THREE.Vector3(0.238, 5.525, 0.698), new THREE.Vector3(0.462, 5.525, 0.698)],
    [new THREE.Vector3(0.238, 5.272, 0.698), new THREE.Vector3(0.462, 5.272, 0.698)],
    [new THREE.Vector3(0.238, 5.272, 0.698), new THREE.Vector3(0.238, 5.525, 0.698)],
    [new THREE.Vector3(0.462, 5.272, 0.698), new THREE.Vector3(0.462, 5.525, 0.698)],
  ];
  for (const [a, b] of pocketLines) {
    const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 2, 0.006, 5, false), pocketTrimMat);
    body.add(line);
  }

  // ——— Arms ————————————————————————————————————————————————
  const rightArmPoints = [
    new THREE.Vector3(-0.74, 5.84, 0.02),
    new THREE.Vector3(-0.92, 5.65, 0.03),
    new THREE.Vector3(-1.1, 5.42, 0.055),
    new THREE.Vector3(-1.18, 5.32, 0.075),
    new THREE.Vector3(-1.14, 5.76, 0.22),
    new THREE.Vector3(-1.05, 6.15, 0.35),
    new THREE.Vector3(-0.9, 6.55, 0.45),
  ];
  const leftArmPoints = [
    new THREE.Vector3(0.74, 5.84, 0.02),
    new THREE.Vector3(0.88, 5.57, 0.03),
    new THREE.Vector3(0.96, 5.18, 0.045),
    new THREE.Vector3(0.985, 4.88, 0.09),
    new THREE.Vector3(0.995, 4.5, 0.17),
    new THREE.Vector3(1.015, 4.16, 0.28),
    new THREE.Vector3(1.03, 3.96, 0.35),
  ];

  mesh(makeTubeGeometry(rightArmPoints, [0.185, 0.158, 0.132, 0.115, 0.105, 0.09, 0.082], 44, 16), mats.skin, {
    outline: true,
    outlineThickness: 1.012,
    name: 'rightArm',
  });
  mesh(makeTubeGeometry(leftArmPoints, [0.185, 0.158, 0.132, 0.115, 0.105, 0.09, 0.082], 44, 16), mats.skin, {
    outline: true,
    outlineThickness: 1.012,
    name: 'leftArm',
  });

  const rightElbow = new THREE.Mesh(new THREE.SphereGeometry(0.115, 22, 16), mats.skin);
  rightElbow.position.set(-1.185, 5.33, 0.075);
  body.add(rightElbow);
  const leftElbow = new THREE.Mesh(new THREE.SphereGeometry(0.112, 22, 16), mats.skin);
  leftElbow.position.set(0.985, 4.88, 0.095);
  body.add(leftElbow);

  // Puffed pajama sleeves
  const rightSleevePts = [
    new THREE.Vector3(-0.73, 5.86, 0.01),
    new THREE.Vector3(-0.88, 5.68, 0.025),
    new THREE.Vector3(-1.01, 5.5, 0.045),
    new THREE.Vector3(-1.09, 5.38, 0.065),
  ];
  const leftSleevePts = [
    new THREE.Vector3(0.73, 5.86, 0.01),
    new THREE.Vector3(0.85, 5.67, 0.02),
    new THREE.Vector3(0.95, 5.43, 0.035),
    new THREE.Vector3(1.02, 5.2, 0.05),
  ];

  for (const [points, dirEnd] of [[rightSleevePts, new THREE.Vector3(-1.115, 5.365, 0.068)], [leftSleevePts, new THREE.Vector3(1.035, 5.17, 0.055)]]) {
    const sleeve = mesh(makeTubeGeometry(points, [0.24, 0.32, 0.335, 0.29], 32, 22), mats.pajama, {
      outline: true,
      outlineThickness: 1.014,
    });
    sleeve.castShadow = true;

    const cuff = new THREE.Mesh(makeScallopedRing(0.29, 0.29, 0, 7, 0.019, 0.014), mats.trim);
    const axis = dirEnd.clone().sub(points[points.length - 2]).normalize();
    cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
    cuff.position.copy(dirEnd);
    cuff.castShadow = true;
    body.add(cuff);
  }

  // The raised hand rests against the temple, not a wave.
  const rightHand = createHand(mats, { side: -1 });
  rightHand.scale.setScalar(1.12);
  rightHand.position.set(-0.72, 6.82, 0.5);
  rightHand.rotation.set(0.02, 1.2, -0.16);
  body.add(rightHand);

  const rightWrist = new THREE.Mesh(new THREE.SphereGeometry(0.085, 18, 14), mats.skin);
  rightWrist.position.set(-0.88, 6.57, 0.47);
  body.add(rightWrist);

  // ——— Pillow and left hand ———————————————————————————————
  const pillowGroup = new THREE.Group();
  pillowGroup.position.set(1.4, 2.96, 0.36);
  pillowGroup.rotation.set(-0.15, 0.06, -0.2);
  body.add(pillowGroup);

  const pillow = new THREE.Mesh(makePillowGeometry(1.6, 1.94, 0.62, 0.24, 24), mats.pillow);
  pillow.castShadow = true;
  pillow.receiveShadow = true;
  pillowGroup.add(pillow);

  const seamMat = mats.pillowShade;
  const frontSeam = makeTubeGeometry(
    makeRoundedRectPoints(1.28, 1.56, 0.12, 0.249),
    [0.0055],
    72,
    5,
  );
  const backSeam = makeTubeGeometry(
    makeRoundedRectPoints(1.28, 1.56, 0.12, -0.249),
    [0.0055],
    72,
    5,
  );
  pillowGroup.add(new THREE.Mesh(frontSeam, seamMat));
  pillowGroup.add(new THREE.Mesh(backSeam, seamMat));

  const crease1 = makeTubeGeometry([
    new THREE.Vector3(-0.48, 0.78, 0.252),
    new THREE.Vector3(-0.3, 0.62, 0.258),
    new THREE.Vector3(-0.42, 0.41, 0.255),
  ], [0.004, 0.005, 0.003], 18, 5);
  const crease2 = makeTubeGeometry([
    new THREE.Vector3(0.55, -0.48, 0.252),
    new THREE.Vector3(0.4, -0.64, 0.258),
    new THREE.Vector3(0.56, -0.78, 0.254),
  ], [0.003, 0.005, 0.002], 18, 5);
  pillowGroup.add(new THREE.Mesh(crease1, seamMat));
  pillowGroup.add(new THREE.Mesh(crease2, seamMat));

  const leftHand = createHand(mats, { side: 1, grasp: true });
  leftHand.scale.setScalar(1.08);
  leftHand.position.set(1.1, 3.79, 0.63);
  leftHand.rotation.set(0.18, 0.06, Math.PI + 0.1);
  body.add(leftHand);

  // ——— Neck and head ——————————————————————————————————————
  mesh(makeTubeGeometry([
    new THREE.Vector3(0, 6.02, 0.015),
    new THREE.Vector3(0, 6.3, 0.018),
    new THREE.Vector3(0, 6.52, 0.02),
  ], [0.195, 0.17, 0.155], 20, 16), mats.skin, {
    outline: false,
    name: 'neck',
  });

  const head = new THREE.Group();
  head.position.set(0, 6.96, 0.015);
  head.scale.setScalar(1.075);
  head.rotation.z = -0.018;
  head.rotation.y = 0.035;
  body.add(head);

  const headMesh = new THREE.Mesh(makeHeadGeometry(), mats.skin);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  addOutline(headMesh, { thickness: 1.018, material: mats.outline });
  head.add(headMesh);

  const facePatch = new THREE.Mesh(makeFacePatchGeometry(), new THREE.MeshBasicMaterial({
    map: makeFaceTexture(),
    transparent: true,
    depthWrite: false,
    alphaTest: 0.01,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }));
  facePatch.renderOrder = 4;
  head.add(facePatch);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.017, 18, 12), mats.skinShade);
  nose.scale.set(0.55, 0.8, 0.5);
  nose.position.set(0, -0.095, 0.542);
  head.add(nose);

  // ——— Hair ————————————————————————————————————————————————
  const hairGroup = new THREE.Group();
  head.add(hairGroup);

  const capGeometry = new THREE.SphereGeometry(1, 80, 56, 0, TAU, 0, 1.28);
  const cap = new THREE.Mesh(capGeometry, mats.hair);
  cap.scale.set(0.605, 0.71, 0.61);
  cap.position.set(0, 0.025, -0.012);
  cap.castShadow = true;
  addOutline(cap, { thickness: 1.016, material: mats.outline });
  hairGroup.add(cap);

  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.5, 56, 40), mats.hairDeep);
  hood.scale.set(0.595, 0.735, 0.44);
  hood.position.set(0, -0.1, -0.21);
  hood.castShadow = false;
  hairGroup.add(hood);

  const nape = new THREE.Mesh(new THREE.SphereGeometry(0.5, 44, 30), mats.hairDeep);
  nape.scale.set(0.43, 0.46, 0.31);
  nape.position.set(0, -0.68, -0.14);
  nape.castShadow = false;
  hairGroup.add(nape);

  // A continuous fringe shell gives the forehead a clean, full hairline.
  const fringe = new THREE.Mesh(makeHairFringeGeometry({
    radiusX: 0.648,
    radiusY: 0.745,
    radiusZ: 0.65,
    centerY: 0.018,
    centerZ: -0.006,
    angleMin: -1.22,
    angleMax: 1.22,
    topTheta: 0.1,
    rows: 32,
    cols: 80,
    bottomY: (a, u) => 0.15
      + 0.05 * Math.sin(a + 0.2)
      + 0.045 * Math.sin(a * 6.2 + 0.8)
      + 0.055 * Math.pow(Math.abs(a) / 1.22, 2.2)
      - 0.05 * Math.exp(-Math.pow((u - 0.5) / 0.09, 2)),
  }), mats.hairSheet);
  fringe.castShadow = false;
  hairGroup.add(fringe);

  const bangs = [
    { root: -0.53, tip: -0.56, tipY: -0.2, width: 0.115, sweep: -0.03 },
    { root: -0.42, tip: -0.4, tipY: -0.07, width: 0.12, sweep: -0.018 },
    { root: -0.3, tip: -0.25, tipY: 0.0, width: 0.125, sweep: -0.006 },
    { root: -0.17, tip: -0.08, tipY: 0.045, width: 0.12, sweep: 0.01 },
    { root: -0.03, tip: 0.09, tipY: -0.05, width: 0.115, sweep: 0.024 },
    { root: 0.11, tip: 0.24, tipY: 0.04, width: 0.12, sweep: 0.038 },
    { root: 0.25, tip: 0.39, tipY: -0.02, width: 0.125, sweep: 0.052 },
    { root: 0.39, tip: 0.53, tipY: -0.07, width: 0.12, sweep: 0.066 },
    { root: 0.53, tip: 0.66, tipY: -0.19, width: 0.115, sweep: 0.08 },
  ];

  for (let i = 0; i < bangs.length; i += 1) {
    const b = bangs[i];
    const points = [
      new THREE.Vector3(b.root * 0.48, 0.68, 0.05),
      new THREE.Vector3(b.root * 0.82, 0.5, 0.22),
      new THREE.Vector3(b.tip * 0.94 + b.sweep, 0.28, 0.48),
      new THREE.Vector3(b.tip - b.sweep * 0.5, b.tipY + 0.09, 0.585),
      new THREE.Vector3(b.tip, b.tipY, 0.603),
    ];
    const geometry = makeHairLockGeometry(
      points,
      [b.width * 0.5, b.width * 0.92, b.width, b.width * 0.72, 0.01],
      [0.024, 0.046, 0.042, 0.025, 0.005],
      new THREE.Vector3(0, 0.04, 0.03),
      34,
      10,
    );
    const lock = new THREE.Mesh(geometry, mats.hair);
    lock.castShadow = false;
    hairGroup.add(lock);
  }

  // One longer centre wisp breaks up the fringe like the illustration.
  const centreWisp = new THREE.Mesh(makeHairLockGeometry([
    new THREE.Vector3(0.01, 0.66, 0.09),
    new THREE.Vector3(-0.015, 0.48, 0.31),
    new THREE.Vector3(0.028, 0.22, 0.55),
    new THREE.Vector3(0.05, -0.01, 0.615),
    new THREE.Vector3(0.035, -0.13, 0.61),
  ], [0.028, 0.06, 0.07, 0.045, 0.006], [0.016, 0.03, 0.028, 0.018, 0.004], new THREE.Vector3(0, 0.03, 0.02), 30, 8), mats.hair);
  centreWisp.castShadow = false;
  hairGroup.add(centreWisp);

  // A smooth cape behind the body replaces the old stack of disconnected strips.
  const backCape = new THREE.Mesh(makeHairCapeGeometry({
    topY: 0.54,
    radiusTopX: 0.52,
    radiusTopZ: 0.55,
    centerTopZ: -0.13,
    bottomY: -3.04,
    radiusBottomX: 0.7,
    radiusBottomZ: 0.27,
    centerBottomZ: -0.52,
    tipWave: 0.07,
  }), mats.hairSheet);
  backCape.castShadow = false;
  hairGroup.add(backCape);

  // Soft gloss ribbons that follow the cape and give it dimension from behind.
  for (const [x0, x1, yEnd, width] of [
    [-0.28, -0.34, -2.3, 0.028],
    [0.02, 0.05, -2.55, 0.022],
    [0.26, 0.33, -2.25, 0.026],
  ]) {
    const shine = new THREE.Mesh(makeHairLockGeometry([
      new THREE.Vector3(x0, 0.42, -0.42),
      new THREE.Vector3(x0 * 1.05, 0.02, -0.62),
      new THREE.Vector3(x1 * 0.8, -0.72, -0.72),
      new THREE.Vector3(x1, -1.58, -0.78),
      new THREE.Vector3(x1 * 1.06, yEnd, -0.8),
    ], [width * 0.5, width, width, width * 0.7, 0.004], [0.005, 0.008, 0.007, 0.005, 0.001], new THREE.Vector3(0, 0, -0.5), 34, 6), mats.hairHighlight);
    shine.renderOrder = 2;
    hairGroup.add(shine);
  }

  // Face-framing side locks.
  for (const side of [-1, 1]) {
    const points = [
      new THREE.Vector3(side * 0.48, 0.55, 0.2),
      new THREE.Vector3(side * 0.57, 0.2, 0.44),
      new THREE.Vector3(side * 0.6, -0.45, 0.6),
      new THREE.Vector3(side * 0.58, -1.1, 0.64),
      new THREE.Vector3(side * 0.55, -1.55, 0.58),
    ];
    const lock = new THREE.Mesh(makeHairLockGeometry(
      points,
      [0.11, 0.16, 0.18, 0.14, 0.02],
      [0.035, 0.045, 0.05, 0.04, 0.008],
      new THREE.Vector3(0, 0, 0.08),
      32,
      8,
    ), mats.hair);
    lock.castShadow = true;
    hairGroup.add(lock);
  }

  // Long outer side curtains: the wide silhouette that reads from every angle.
  for (const side of [-1, 1]) {
    const outer = new THREE.Mesh(makeHairLockGeometry([
      new THREE.Vector3(side * 0.45, 0.5, 0.02),
      new THREE.Vector3(side * 0.56, 0.2, -0.3),
      new THREE.Vector3(side * 0.66, -0.5, -0.66),
      new THREE.Vector3(side * 0.76, -1.32, -0.74),
      new THREE.Vector3(side * 0.85, -2.08, -0.66),
      new THREE.Vector3(side * 0.94, -2.7, -0.52),
    ], [0.09, 0.16, 0.2, 0.2, 0.15, 0.014], [0.035, 0.05, 0.06, 0.05, 0.035, 0.008], new THREE.Vector3(0, 0, -0.6), 42, 10), mats.hair);
    outer.castShadow = true;
    hairGroup.add(outer);

    const inner = new THREE.Mesh(makeHairLockGeometry([
      new THREE.Vector3(side * 0.39, 0.58, 0.16),
      new THREE.Vector3(side * 0.48, 0.22, 0.44),
      new THREE.Vector3(side * 0.55, -0.6, 0.6),
      new THREE.Vector3(side * 0.63, -1.48, 0.62),
      new THREE.Vector3(side * 0.66, -2.26, 0.56),
      new THREE.Vector3(side * 0.7, -2.68, 0.5),
    ], [0.06, 0.11, 0.14, 0.125, 0.075, 0.01], [0.025, 0.038, 0.044, 0.038, 0.024, 0.005], new THREE.Vector3(0, 0, 0.7), 38, 8), mats.hair);
    inner.castShadow = true;
    hairGroup.add(inner);

    const shine = new THREE.Mesh(makeHairLockGeometry([
      new THREE.Vector3(side * 0.55, 0.18, 0.5),
      new THREE.Vector3(side * 0.63, -0.5, 0.69),
      new THREE.Vector3(side * 0.69, -1.24, 0.71),
      new THREE.Vector3(side * 0.7, -1.88, 0.62),
    ], [0.012, 0.017, 0.013, 0.003], [0.003, 0.004, 0.003, 0.001], new THREE.Vector3(0, 0, 0.7), 26, 5), mats.hairHighlight);
    shine.renderOrder = 2;
    hairGroup.add(shine);
  }

  // Long flowing back hair — a few broad, layered curtains rather than thin strips.
  const hairBack = new THREE.Group();
  hairGroup.add(hairBack);
  const random = seededRandom(81017);
  const backSlots = 9;

  for (let i = 0; i < backSlots; i += 1) {
    const t = i / (backSlots - 1);
    const angle = THREE.MathUtils.lerp(Math.PI * 0.32, Math.PI * 1.68, t);
    const layer = i % 2;
    const wave = Math.sin(i * 1.9 + 0.4) * 0.09;
    const sway = Math.sin(i * 2.7) * 0.06;
    const length = 2.5 + Math.abs(Math.sin(i * 1.4)) * 0.5 + layer * 0.12;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    const tipSpread = 0.62 + Math.abs(cosA) * 0.12;
    const tipX = sinA * tipSpread + sway;
    const tipZ = cosA * (0.34 + layer * 0.03) - 0.44;

    const depth = layer === 0 ? -0.07 : 0.02;
    const points = [
      new THREE.Vector3(sinA * 0.29, 0.52, cosA * 0.28 - 0.06 + depth * 0.4),
      new THREE.Vector3(sinA * 0.5, 0.16, cosA * 0.48 - 0.2 + depth * 0.5),
      new THREE.Vector3(sinA * 0.6 + wave, -0.66, cosA * 0.5 - 0.31 + depth * 0.6),
      new THREE.Vector3(sinA * 0.67 + wave * 1.4, -1.62, cosA * 0.44 - 0.38 + depth * 0.7),
      new THREE.Vector3(tipX * 0.94 - wave * 0.6, -2.24, tipZ + depth),
      new THREE.Vector3(tipX, -length, tipZ + depth + 0.04),
    ];

    const width = (layer === 0 ? 0.36 : 0.32) + Math.abs(sinA) * 0.05;
    const geometry = makeHairLockGeometry(
      points,
      [width * 0.6, width * 0.92, width, width * 0.94, width * 0.62, 0.012],
      [0.03, 0.055, 0.062, 0.055, 0.032, 0.008],
      new THREE.Vector3(0, 0, -0.1),
      44,
      10,
    );
    const lock = new THREE.Mesh(geometry, layer === 0 ? mats.hair : mats.hairSheet);
    lock.castShadow = false;
    hairBack.add(lock);

    const shine = new THREE.Mesh(makeHairLockGeometry(
      points.map((point, index) => point.clone().add(new THREE.Vector3(0, 0, -0.028 - index * 0.002))),
      [0.009, 0.014, 0.013, 0.01, 0.006, 0.0015],
      [0.004, 0.006, 0.005, 0.004, 0.002, 0.001],
      new THREE.Vector3(0, 0, -0.1),
      40,
      6,
    ), mats.hairHighlight);
    shine.renderOrder = 2;
    hairBack.add(shine);
  }

  // Crown highlight ribbons and flyaways.
  for (const side of [-1, 1]) {
    const crownShine = makeHairLockGeometry([
      new THREE.Vector3(side * 0.39, 0.44, 0.15),
      new THREE.Vector3(side * 0.2, 0.63, 0.29),
      new THREE.Vector3(side * 0.02, 0.72, 0.34),
    ], [0.006, 0.014, 0.004], [0.002, 0.003, 0.001], new THREE.Vector3(0, 0.2, 0.1), 16, 4);
    hairGroup.add(new THREE.Mesh(crownShine, mats.hairShine));
  }

  for (let i = 0; i < 4; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const y0 = 0.35 - i * 0.16;
    const fly = makeTubeGeometry([
      new THREE.Vector3(side * 0.52, y0, -0.08),
      new THREE.Vector3(side * (0.68 + i * 0.02), y0 - 0.06, -0.12),
      new THREE.Vector3(side * (0.78 + i * 0.03), y0 - 0.18, -0.16),
    ], [0.009, 0.006, 0.001], 14, 5);
    const strand = new THREE.Mesh(fly, mats.hairDeep);
    hairGroup.add(strand);
  }

  // ——— Headband and bow ——————————————————————————————————
  const bow = createBow(mats, 1.04);
  bow.position.set(-0.02, 0.81, 0.22);
  bow.rotation.x = -0.26;
  bow.rotation.z = 0.05;
  hairGroup.add(bow);

  // ——— Halo ————————————————————————————————————————————————
  hairGroup.traverse((object) => {
    if (object.isMesh) object.castShadow = false;
  });
  hairBack.traverse((object) => {
    if (object.isMesh) object.castShadow = false;
  });

  const halo = createHalo(mats);
  halo.position.set(0, 8.56, -0.015);
  halo.rotation.z = 0.045;
  halo.rotation.x = 0.06;
  root.add(halo);

  // ——— Idle motion ————————————————————————————————————————
  const blinkGroups = head.children
    .filter((child) => child.userData.blinkGroup)
    .map((child) => child.userData.blinkGroup);
  const hairBaseZ = hairBack.rotation.z;
  const headBaseY = head.position.y;
  let nextBlink = 2.6;
  let blinkStart = -1;

  const update = (time) => {
    head.position.y = headBaseY + Math.sin(time * 1.15) * 0.004;
    head.rotation.z = -0.018 + Math.sin(time * 0.43) * 0.005;
    head.rotation.x = Math.sin(time * 0.52 + 0.7) * 0.004;

    hairBack.rotation.y = Math.sin(time * 0.43) * 0.018;
    hairBack.rotation.z = hairBaseZ + Math.sin(time * 0.36 + 0.4) * 0.006;

    if (time > nextBlink && blinkStart < 0) {
      blinkStart = time;
      nextBlink = time + 4.4 + (time % 1.7) * 1.4;
    }
    if (blinkStart >= 0) {
      const phase = (time - blinkStart) / 0.19;
      if (phase >= 1) {
        blinkStart = -1;
        for (const eye of blinkGroups) eye.scale.y = 1;
      } else {
        const closed = Math.sin(phase * Math.PI);
        for (const eye of blinkGroups) eye.scale.y = Math.max(0.06, 1 - closed * 0.95);
      }
    }

    halo.position.y = 8.56 + Math.sin(time * 0.82) * 0.035;
    halo.rotation.y = Math.sin(time * 0.19) * 0.04;
    halo.userData.sparkles.rotation.y = time * 0.12;

    pillowGroup.rotation.z = -0.2 + Math.sin(time * 0.5) * 0.004;
    pillowGroup.position.y = 2.96 + Math.sin(time * 0.62 + 0.4) * 0.005;
  };

  return {
    root,
    head,
    hairBack,
    halo,
    update,
    blinkGroups,
  };
}
