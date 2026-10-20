import * as THREE from 'three';
import { makeGlowTexture, makeLabelTexture, makeShadowTexture, makeStarTexture } from './textures.js';

function makeBackdropTexture() {
  const height = 1024;
  const width = 512;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#f2fbff');
  gradient.addColorStop(0.22, '#dcefff');
  gradient.addColorStop(0.54, '#c2e3ff');
  gradient.addColorStop(0.82, '#abcfef');
  gradient.addColorStop(1, '#bddaf5');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width * 0.5, height * 0.36, 10, width * 0.5, height * 0.36, height * 0.4);
  glow.addColorStop(0, 'rgba(255,255,255,0.56)');
  glow.addColorStop(0.54, 'rgba(237,249,255,0.14)');
  glow.addColorStop(1, 'rgba(237,249,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function makeFrostTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.72)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 244, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(111,211,245,0.34)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 232, 0.3, 2.09);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 232, 3.44, 5.24);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createArch() {
  const group = new THREE.Group();
  group.position.set(0, -0.5, -7.4);

  const width = 5.8;
  const radius = width / 2;
  const straight = 5.4;

  const shape = new THREE.Shape();
  shape.moveTo(-radius, 0);
  shape.lineTo(-radius, straight);
  shape.absarc(0, straight, radius, Math.PI, 0, true);
  shape.lineTo(radius, 0);
  shape.lineTo(-radius, 0);

  const pane = new THREE.Mesh(
    new THREE.ShapeGeometry(shape, 64),
    new THREE.MeshBasicMaterial({
      color: 0xeaf8ff,
      transparent: true,
      opacity: 0.21,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    }),
  );
  group.add(pane);

  const framePoints = [];
  framePoints.push(new THREE.Vector3(-radius, 0, 0));
  framePoints.push(new THREE.Vector3(-radius, straight, 0));
  for (let i = 1; i <= 48; i += 1) {
    const a = Math.PI - (i / 48) * Math.PI;
    framePoints.push(new THREE.Vector3(Math.cos(a) * radius, straight + Math.sin(a) * radius, 0));
  }
  framePoints.push(new THREE.Vector3(radius, straight, 0));
  framePoints.push(new THREE.Vector3(radius, 0, 0));
  const frameCurve = new THREE.CatmullRomCurve3(framePoints, false, 'centripetal');
  const frame = new THREE.Mesh(
    new THREE.TubeGeometry(frameCurve, 180, 0.022, 6, false),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.58,
      toneMapped: false,
    }),
  );
  group.add(frame);

  const innerScale = 0.965;
  const innerPoints = framePoints.map((p) => p.clone().multiplyScalar(innerScale));
  innerPoints.forEach((p) => { p.y += straight * (1 - innerScale); });
  const innerCurve = new THREE.CatmullRomCurve3(innerPoints, false, 'centripetal');
  const innerFrame = new THREE.Mesh(
    new THREE.TubeGeometry(innerCurve, 180, 0.006, 4, false),
    new THREE.MeshBasicMaterial({
      color: 0x8fe7ff,
      transparent: true,
      opacity: 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  group.add(innerFrame);

  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(1.36, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  moon.position.set(1.55, straight + 1.55, -0.03);
  group.add(moon);

  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: 0xd8f4ff,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }));
  moonGlow.position.set(1.55, straight + 1.55, -0.04);
  moonGlow.scale.set(5.2, 5.2, 1);
  group.add(moonGlow);

  return group;
}

function createClouds() {
  const group = new THREE.Group();
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xf4fbff,
    roughness: 0.98,
    metalness: 0,
    transparent: true,
    opacity: 0.82,
    sheen: 0.5,
    sheenColor: new THREE.Color(0xdcefff),
    sheenRoughness: 0.8,
  });
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x9ac3e8,
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  });
  const geometry = new THREE.IcosahedronGeometry(1, 3);
  const puffs = [
    [-3.8, 0.0, -1.4, 0.55], [-3.25, 0.3, -1.5, 0.8], [-2.8, 0.1, -1.2, 0.48],
    [3.55, -0.1, -1.5, 0.62], [3.0, 0.15, -1.2, 0.76], [4.05, 0.24, -1.9, 0.52],
    [-1.3, -0.42, -3.5, 0.8], [2.0, -0.48, -4.0, 0.95], [0.3, -0.55, -4.4, 0.7],
    [-5.4, 1.7, -5.2, 1.35], [5.9, 2.0, -5.8, 1.5], [-6.3, -0.6, -3.9, 1.2],
    [6.8, -0.5, -3.6, 1.15],
  ];

  for (let i = 0; i < puffs.length; i += 1) {
    const [x, y, z, scale] = puffs[i];
    const cloud = new THREE.Group();
    const count = 4 + (i % 3);
    for (let p = 0; p < count; p += 1) {
      const puff = new THREE.Mesh(geometry, material);
      const a = (p / count) * Math.PI * 2;
      puff.position.set(
        Math.cos(a) * scale * 0.48 + (p === 0 ? 0 : (p % 2) * 0.14),
        Math.sin(a * 2) * scale * 0.11,
        Math.sin(a) * scale * 0.24,
      );
      puff.scale.setScalar(scale * (0.55 + (p % 3) * 0.09));
      puff.castShadow = false;
      puff.receiveShadow = false;
      cloud.add(puff);
    }
    cloud.position.set(x, y, z);
    cloud.userData.baseY = y;
    cloud.userData.phase = i * 1.27;
    group.add(cloud);
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(2.7, 64),
    shadowMaterial,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.062, 0);
  group.add(shadow);

  return group;
}

function createPedestal(mats) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.26, 0.2, 96), mats.stage);
  base.position.y = -0.04;
  base.receiveShadow = true;
  base.castShadow = false;
  group.add(base);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.105, 0.025, 8, 192), mats.stageRim);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.062;
  group.add(rim);

  const glow = new THREE.Mesh(new THREE.TorusGeometry(2.26, 0.012, 6, 192), mats.stageGlow);
  glow.rotation.x = Math.PI / 2;
  glow.position.y = 0.067;
  group.add(glow);

  const glow2 = new THREE.Mesh(new THREE.TorusGeometry(2.34, 0.005, 5, 192), mats.stageGlow);
  glow2.rotation.x = Math.PI / 2;
  glow2.position.y = 0.068;
  group.add(glow2);

  const frost = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 6.2),
    new THREE.MeshBasicMaterial({
      map: makeFrostTexture(),
      transparent: true,
      opacity: 0.46,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  frost.rotation.x = -Math.PI / 2;
  frost.position.y = 0.066;
  group.add(frost);

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 4.5),
    new THREE.MeshBasicMaterial({
      map: makeShadowTexture(),
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = 0.067;
  group.add(contact);

  const labelTexture = makeLabelTexture(['YUU·KAPA', 'DREAMWEAR / STUDY 01'], {
    width: 1024,
    height: 192,
    primarySize: 48,
    secondarySize: 17,
    color: '#465b80',
    secondaryColor: 'rgba(70,91,128,0.7)',
  });
  for (let i = 0; i < 4; i += 1) {
    const angle = i * Math.PI / 2;
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 0.33),
      new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    );
    label.position.set(Math.sin(angle) * 3.14, 0.005, Math.cos(angle) * 3.14);
    label.rotation.y = angle;
    group.add(label);
  }

  return group;
}

function createMotes() {
  const group = new THREE.Group();
  const random = (() => {
    let s = 91823;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  })();

  const positions = [];
  const colors = [];
  const count = 280;
  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xb7edff),
    new THREE.Color(0xcac4ff),
    new THREE.Color(0xffd9e8),
  ];

  for (let i = 0; i < count; i += 1) {
    const r = 3.2 + random() * 10.5;
    const a = random() * Math.PI * 2;
    positions.push(Math.cos(a) * r, 0.3 + random() * 11.2, Math.sin(a) * r - 1.6);
    const color = palette[Math.floor(random() * palette.length)];
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    map: makeGlowTexture(),
    size: 0.12,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    toneMapped: false,
  });
  const points = new THREE.Points(geometry, material);
  group.add(points);
  group.userData.points = points;
  return group;
}

function createStars() {
  const group = new THREE.Group();
  const starTexture = makeStarTexture();
  const random = (() => {
    let s = 4412;
    return () => {
      s = (s * 1103515245 + 12345) >>> 0;
      return s / 4294967296;
    };
  })();
  const stars = [];
  for (let i = 0; i < 24; i += 1) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: starTexture,
      color: i % 4 === 0 ? 0xd2c7ff : 0xd9f7ff,
      transparent: true,
      opacity: 0.24 + random() * 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }));
    const a = random() * Math.PI * 2;
    const radius = 7 + random() * 10;
    sprite.position.set(Math.cos(a) * radius, 3.5 + random() * 7.5, -7 - random() * 4);
    const scale = 0.11 + random() * 0.32;
    sprite.scale.set(scale, scale, 1);
    sprite.userData.phase = random() * 8;
    sprite.userData.speed = 0.25 + random() * 0.55;
    sprite.userData.baseOpacity = sprite.material.opacity;
    group.add(sprite);
    stars.push(sprite);
  }
  group.userData.stars = stars;
  return group;
}

function createPetals() {
  const group = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.06, 0.02, 0.055, 0.1, 0, 0.13);
  shape.bezierCurveTo(-0.055, 0.1, -0.06, 0.02, 0, 0);
  const geometry = new THREE.ShapeGeometry(shape, 10);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd7e5,
    transparent: true,
    opacity: 0.56,
    side: THREE.DoubleSide,
    depthWrite: false,
    toneMapped: false,
  });
  const random = (() => {
    let s = 7281;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  })();

  for (let i = 0; i < 26; i += 1) {
    const petal = new THREE.Mesh(geometry, material);
    const a = random() * Math.PI * 2;
    const radius = 2.8 + random() * 5.2;
    petal.position.set(Math.cos(a) * radius, 0.5 + random() * 8.8, Math.sin(a) * radius - 1.2);
    petal.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    petal.scale.setScalar(0.6 + random() * 1.3);
    petal.userData = {
      baseY: petal.position.y,
      phase: random() * 10,
      drift: 0.1 + random() * 0.25,
      spin: (random() - 0.5) * 0.5,
    };
    group.add(petal);
  }
  return group;
}

export function createEnvironment(mats) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfe8ff);
  scene.fog = new THREE.FogExp2(0xcfe8ff, 0.017);

  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(58, 48, 32),
    new THREE.MeshBasicMaterial({
      map: makeBackdropTexture(),
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    }),
  );
  scene.add(backdrop);

  const arch = createArch();
  scene.add(arch);

  const clouds = createClouds();
  scene.add(clouds);

  const pedestal = createPedestal(mats);
  scene.add(pedestal);

  const motes = createMotes();
  scene.add(motes);

  const stars = createStars();
  scene.add(stars);

  const petals = createPetals();
  scene.add(petals);

  const haloGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: 0x86e7ff,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }));
  haloGlow.position.set(0, 3.15, -3.2);
  haloGlow.scale.set(6.4, 6.4, 1);
  scene.add(haloGlow);

  // Lighting rig: warm key, cool fill, lavender rim, cyan stage bounce.
  const hemisphere = new THREE.HemisphereLight(0xf4fbff, 0x7289b8, 0.5);
  scene.add(hemisphere);

  const ambient = new THREE.AmbientLight(0xd8efff, 0.08);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff3e5, 2.05);
  key.position.set(-4.8, 10.5, 7.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 11;
  key.shadow.camera.bottom = -2;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 28;
  key.shadow.bias = -0.00022;
  key.shadow.normalBias = 0.022;
  key.shadow.radius = 3;
  scene.add(key);
  scene.add(key.target);

  const fill = new THREE.DirectionalLight(0x9edcff, 0.44);
  fill.position.set(6, 6.2, 5.2);
  scene.add(fill);
  scene.add(fill.target);

  const faceFill = new THREE.DirectionalLight(0xffe9e2, 1.05);
  faceFill.position.set(0.5, 6.8, 9.5);
  faceFill.target.position.set(0, 6.7, 0);
  scene.add(faceFill);
  scene.add(faceFill.target);

  const rim = new THREE.DirectionalLight(0x9f8aff, 1.25);
  rim.position.set(-1.5, 7.4, -6.5);
  scene.add(rim);
  scene.add(rim.target);

  const stageLight = new THREE.PointLight(0x79e8ff, 1.2, 7.5, 2);
  stageLight.position.set(0, 0.7, 2.4);
  scene.add(stageLight);

  const backLight = new THREE.PointLight(0x8e8cff, 1.7, 8, 2);
  backLight.position.set(0, 5.4, -4.2);
  scene.add(backLight);

  const update = (time) => {
    motes.userData.points.rotation.y = time * 0.018;
    motes.userData.points.position.y = Math.sin(time * 0.25) * 0.12;
    clouds.children.forEach((cloud) => {
      if (!cloud.userData.baseY) return;
      cloud.position.y = cloud.userData.baseY + Math.sin(time * 0.23 + cloud.userData.phase) * 0.045;
    });
    stars.userData.stars.forEach((star) => {
      const twinkle = 0.7 + 0.3 * Math.sin(time * star.userData.speed + star.userData.phase);
      star.material.opacity = star.userData.baseOpacity * twinkle;
      const s = star.scale.x;
      star.material.rotation = Math.sin(time * 0.11 + star.userData.phase) * 0.1;
      star.scale.setScalar(s);
    });
    petals.children.forEach((petal) => {
      const d = petal.userData;
      petal.position.y = d.baseY + Math.sin(time * 0.22 + d.phase) * 0.5;
      petal.position.x += Math.sin(time * 0.14 + d.phase) * 0.0007;
      petal.rotation.x += d.spin * 0.001;
      petal.rotation.z += d.spin * 0.0018;
    });
    haloGlow.material.opacity = 0.2 + Math.sin(time * 0.5) * 0.03;
    stageLight.intensity = 1.12 + Math.sin(time * 0.7) * 0.08;
  };

  return {
    scene,
    update,
    key,
    fill,
    rim,
    arch,
    haloGlow,
    stageLight,
    backLight,
    atmosphere: [motes, stars, petals, haloGlow],
  };
}
