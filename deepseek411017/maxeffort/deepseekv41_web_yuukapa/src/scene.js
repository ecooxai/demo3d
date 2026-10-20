import * as THREE from 'three';
import {
  makeSkyTexture, makeEnvironmentTexture, makeNameplateTexture,
  makeShadowTexture, makeGlowTexture, makeSparkleTexture, makeFeatherTexture,
  makeSoftCloudTexture, mulberry32,
} from './textures.js';

function makeFloorTexture() {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S * 0.5, S * 0.5, S * 0.03, S * 0.5, S * 0.5, S * 0.5);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.18, '#f5fbff');
  g.addColorStop(0.45, '#e2f2ff');
  g.addColorStop(0.76, '#c9e5fb');
  g.addColorStop(0.94, '#b2d6f2');
  g.addColorStop(1, '#a5cae9');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);

  // soft concentric drift lines
  x.strokeStyle = 'rgba(255,255,255,0.5)';
  x.lineWidth = 2;
  for (let i = 1; i < 7; i++) {
    x.beginPath();
    x.arc(S / 2, S / 2, (S / 2) * (i / 7.4), 0, Math.PI * 2);
    x.stroke();
  }
  x.strokeStyle = 'rgba(101,150,199,0.13)';
  x.lineWidth = 1.5;
  for (let i = 1; i < 12; i++) {
    x.beginPath();
    x.arc(S / 2, S / 2, (S / 2) * (i / 12.4), 0, Math.PI * 2);
    x.stroke();
  }

  const rnd = mulberry32(41);
  for (let i = 0; i < 100; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * S * 0.47;
    const px = S / 2 + Math.cos(a) * r;
    const py = S / 2 + Math.sin(a) * r;
    x.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.45})`;
    x.beginPath();
    x.arc(px, py, 0.8 + rnd() * 2.8, 0, Math.PI * 2);
    x.fill();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeMoonTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,253,248,1)');
  g.addColorStop(0.28, 'rgba(255,247,244,0.95)');
  g.addColorStop(0.42, 'rgba(255,232,243,0.55)');
  g.addColorStop(0.7, 'rgba(236,223,255,0.16)');
  g.addColorStop(1, 'rgba(224,219,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildWorld() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcfe7fa, 12, 32);

  const world = new THREE.Group();
  world.name = 'dream-stage';
  scene.add(world);

  const rnd = mulberry32(71203);

  /* ── sky ─────────────────────────────────────────────── */
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(34, 64, 48),
    new THREE.MeshBasicMaterial({
      map: makeSkyTexture(),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    })
  );
  sky.name = 'sky';
  sky.renderOrder = -20;
  scene.add(sky);

  const moonMat = new THREE.SpriteMaterial({
    map: makeMoonTexture(), transparent: true, opacity: 0.9,
    depthWrite: false, toneMapped: false, color: 0xfff7f1,
  });
  const moon = new THREE.Sprite(moonMat);
  moon.position.set(-6.8, 7.5, -15);
  moon.scale.set(8.5, 8.5, 1);
  scene.add(moon);

  const moonHaloMat = new THREE.SpriteMaterial({
    map: makeGlowTexture('rgba(255,247,244,0.55)', 'rgba(236,225,255,0.25)'),
    transparent: true, opacity: 0.4, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, color: 0xf5ecff,
  });
  const moonHalo = new THREE.Sprite(moonHaloMat);
  moonHalo.position.copy(moon.position);
  moonHalo.position.z -= 0.2;
  moonHalo.scale.set(16, 16, 1);
  scene.add(moonHalo);

  /* ── environment reflections ─────────────────────────── */
  const env = makeEnvironmentTexture();
  scene.environment = env;
  scene.environmentIntensity = 0.62;

  /* ── floor ───────────────────────────────────────────── */
  const floorMat = new THREE.MeshPhysicalMaterial({
    map: makeFloorTexture(),
    color: 0xffffff,
    roughness: 0.33,
    metalness: 0.05,
    clearcoat: 0.62,
    clearcoatRoughness: 0.34,
    envMapIntensity: 0.7,
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3.3, 160), floorMat);
  floor.name = 'moon-floor';
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.004;
  floor.receiveShadow = true;
  world.add(floor);

  const floorRim = new THREE.Mesh(
    new THREE.RingGeometry(3.28, 3.33, 180),
    new THREE.MeshBasicMaterial({
      color: 0xfcfdff, transparent: true, opacity: 0.72,
      side: THREE.DoubleSide, toneMapped: false, depthWrite: false,
    })
  );
  floorRim.rotation.x = -Math.PI / 2;
  floorRim.position.y = 0.001;
  world.add(floorRim);

  const rimGlowMat = new THREE.SpriteMaterial({
    map: makeGlowTexture('rgba(255,255,255,0.5)', 'rgba(185,224,255,0.24)'),
    color: 0xe3f3ff, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const rimGlow = new THREE.Sprite(rimGlowMat);
  rimGlow.position.set(0, 0.025, -1.5);
  rimGlow.scale.set(8, 2.2, 1);
  world.add(rimGlow);

  // soft contact shadow decal under the feet
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.5),
    new THREE.MeshBasicMaterial({
      map: makeShadowTexture(), transparent: true, opacity: 0.5,
      color: 0x6c86ac, depthWrite: false, toneMapped: false,
    })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(0.02, 0.006, 0.05);
  world.add(contact);

  // faint star dust scattered across the stage
  const floorDust = new THREE.Mesh(
    new THREE.CircleGeometry(3.28, 120),
    new THREE.MeshBasicMaterial({
      map: makeSparkleTexture(), transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      side: THREE.DoubleSide,
    })
  );
  floorDust.rotation.x = -Math.PI / 2;
  floorDust.position.y = 0.008;
  floorDust.scale.setScalar(1.2);
  world.add(floorDust);

  /* ── lights ──────────────────────────────────────────── */
  const hemi = new THREE.HemisphereLight(0xfff4f0, 0xa8b6cc, 0.92);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff1e6, 2.85);
  key.position.set(-4.2, 7.2, 5.6);
  key.target.position.set(0, 1.7, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -3.4;
  key.shadow.camera.right = 3.4;
  key.shadow.camera.top = 5.2;
  key.shadow.camera.bottom = -1.2;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.022;
  key.shadow.radius = 4;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(0xd6e8ff, 1.15);
  fill.position.set(5.4, 3.2, 3.8);
  fill.target.position.set(0, 2, 0);
  scene.add(fill, fill.target);

  const rim = new THREE.DirectionalLight(0xbfd2ff, 2.6);
  rim.position.set(0.6, 5.0, -5.6);
  rim.target.position.set(0, 2.1, 0);
  scene.add(rim, rim.target);

  const warmBounce = new THREE.DirectionalLight(0xffdbe2, 0.55);
  warmBounce.position.set(-3.4, 1.2, 2.2);
  warmBounce.target.position.set(0, 1.2, 0);
  scene.add(warmBounce, warmBounce.target);

  const underGlow = new THREE.PointLight(0xa8d8ff, 1.2, 4.5, 2);
  underGlow.position.set(0.4, 0.45, 1.2);
  scene.add(underGlow);

  // a soft warm key just for the face and hands
  const faceGlow = new THREE.PointLight(0xffc6ad, 3.4, 3.2, 2);
  faceGlow.position.set(0.5, 2.52, 1.55);

  // a cool bounce from below-left keeps the jaw and throat from going flat
  const cheekBounce = new THREE.PointLight(0xffd2cf, 1.7, 2.8, 2);
  cheekBounce.position.set(-0.75, 2.34, 1.5);
  scene.add(faceGlow);
  scene.add(cheekBounce);

  /* ── cloud bed behind the character ──────────────────── */
  const clouds = [];
  const cloudTexture = makeSoftCloudTexture();
  const cloudMatBase = new THREE.SpriteMaterial({
    map: cloudTexture, transparent: true, depthWrite: false,
    toneMapped: false, color: 0xffffff, opacity: 0.45,
  });
  const cloudDefs = [
    { p: [-2.7, 0.55, -2.4], s: [4.6, 2.1], o: 0.42, ph: 0.2 },
    { p: [2.9, 0.72, -2.9], s: [4.9, 2.2], o: 0.4, ph: 1.4 },
    { p: [0.2, 0.32, -3.7], s: [6.6, 2.4], o: 0.38, ph: 2.7 },
    { p: [-3.3, 1.5, -4.4], s: [4.4, 2.0], o: 0.28, ph: 4.1 },
    { p: [3.2, 1.7, -4.8], s: [4.2, 2.0], o: 0.25, ph: 5.3 },
    { p: [0.6, 0.22, 1.1], s: [4.2, 1.4], o: 0.16, ph: 3.4 },
  ];
  for (const def of cloudDefs) {
    const mat = cloudMatBase.clone();
    mat.opacity = def.o;
    const s = new THREE.Sprite(mat);
    s.position.set(...def.p);
    s.scale.set(def.s[0], def.s[1], 1);
    world.add(s);
    clouds.push({ sprite: s, baseY: def.p[1], baseX: def.p[0], phase: def.ph, op: def.o });
  }

  /* ── drifting dust ───────────────────────────────────── */
  const glowTex = makeGlowTexture();
  const dustSystems = [];
  const dustSpecs = [
    { count: 46, size: 0.055, color: 0xffffff, opacity: 0.55, spread: 4.6, height: 4.2 },
    { count: 26, size: 0.12, color: 0xc8e8ff, opacity: 0.38, spread: 5.4, height: 4.4 },
    { count: 14, size: 0.22, color: 0xffe6f1, opacity: 0.26, spread: 4.8, height: 3.6 },
  ];
  for (const spec of dustSpecs) {
    const positions = new Float32Array(spec.count * 3);
    const data = [];
    for (let i = 0; i < spec.count; i++) {
      const x = (rnd() - 0.5) * spec.spread;
      const y = rnd() * spec.height - 0.1;
      const z = (rnd() - 0.5) * 3.6 - 0.2;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      data.push({ baseX: x, baseZ: z, speed: 0.02 + rnd() * 0.06, phase: rnd() * Math.PI * 2, drift: 0.06 + rnd() * 0.1 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      map: glowTex,
      color: spec.color,
      size: spec.size,
      transparent: true,
      opacity: spec.opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      toneMapped: false,
    });
    const points = new THREE.Points(geo, mat);
    points.name = 'dust';
    world.add(points);
    dustSystems.push({ points, data, arr: positions, baseY: 0, speed: spec.speed ?? 0.02 });
  }

  /* ── floating feathers ───────────────────────────────── */
  const feathers = [];
  const featherTexture = makeFeatherTexture();
  for (let i = 0; i < 7; i++) {
    const mat = new THREE.SpriteMaterial({
      map: featherTexture, transparent: true, opacity: 0.5 + rnd() * 0.3,
      depthWrite: false, toneMapped: false, color: 0xfdfcff,
      rotation: rnd() * Math.PI * 2,
    });
    const s = new THREE.Sprite(mat);
    const home = new THREE.Vector3((rnd() - 0.5) * 4.4, 1.0 + rnd() * 2.4, -0.4 + (rnd() - 0.5) * 2.6);
    s.position.copy(home);
    s.scale.set(0.12 + rnd() * 0.1, 0.28 + rnd() * 0.2, 1);
    scene.add(s);
    feathers.push({
      sprite: s, home, phase: rnd() * Math.PI * 2,
      speed: 0.13 + rnd() * 0.12, spin: (rnd() - 0.5) * 0.35,
      baseRot: mat.rotation,
    });
  }

  /* ── sparkle accents ─────────────────────────────────── */
  const sparkles = [];
  const sparkleTex = makeSparkleTexture();
  for (let i = 0; i < 6; i++) {
    const mat = new THREE.SpriteMaterial({
      map: sparkleTex, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      color: i % 2 ? 0xd6ecff : 0xffeaf4,
    });
    const s = new THREE.Sprite(mat);
    const p = new THREE.Vector3((rnd() - 0.5) * 4.4, 1.2 + rnd() * 2.2, -0.8 + (rnd() - 0.5) * 1.6);
    s.position.copy(p);
    s.scale.setScalar(0.08 + rnd() * 0.12);
    scene.add(s);
    sparkles.push({ sprite: s, baseScale: s.scale.x, phase: rnd() * Math.PI * 2, y: p.y });
  }

  /* ── in-world model nameplate ────────────────────────── */
  const nameplate = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeNameplateTexture(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  }));
  nameplate.position.set(0, 3.615, 0.10);
  nameplate.scale.set(1.62, 0.475, 1);
  nameplate.renderOrder = 30;
  world.add(nameplate);

  const nameplateGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeGlowTexture('rgba(255,255,255,0.5)', 'rgba(200,231,255,0.22)'),
    transparent: true, opacity: 0.32, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, color: 0xe3f3ff,
  }));
  nameplateGlow.position.set(0, 3.615, 0.05);
  nameplateGlow.scale.set(2.2, 0.9, 1);
  nameplateGlow.renderOrder = 29;
  world.add(nameplateGlow);

  /* ── animation ───────────────────────────────────────── */
  let dustVisible = true;
  const update = (t) => {
    sky.rotation.y = t * 0.004;
    moon.position.y = 7.5 + Math.sin(t * 0.16) * 0.04;
    moonHalo.position.copy(moon.position);
    moonHalo.position.z -= 0.2;
    moonMat.opacity = 0.82 + Math.sin(t * 0.4) * 0.06;

    for (const c of clouds) {
      c.sprite.position.x = c.baseX + Math.sin(t * 0.035 + c.phase) * 0.35;
      c.sprite.position.y = c.baseY + Math.sin(t * 0.05 + c.phase * 1.3) * 0.05;
      c.sprite.material.opacity = c.op * (0.9 + Math.sin(t * 0.22 + c.phase) * 0.1);
    }

    for (let s = 0; s < dustSystems.length; s++) {
      const sys = dustSystems[s];
      const pos = sys.points.geometry.attributes.position;
      for (let i = 0; i < sys.data.length; i++) {
        const d = sys.data[i];
        let y = pos.getY(i) + d.speed * 0.016;
        if (y > 4.4) y = -0.1;
        const x = d.baseX + Math.sin(t * d.drift + d.phase) * 0.13;
        const z = d.baseZ + Math.cos(t * d.drift * 0.8 + d.phase) * 0.08;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
      sys.points.material.opacity = (0.32 + Math.sin(t * 0.5 + s) * 0.08) * (dustVisible ? 1 : 0);
    }

    for (const f of feathers) {
      const cycle = (t * f.speed + f.phase * 0.25) % 1;
      f.sprite.position.x = f.home.x + Math.sin(t * 0.28 + f.phase) * 0.55;
      f.sprite.position.y = f.home.y - cycle * 1.7 + Math.sin(t * 0.5 + f.phase) * 0.1;
      f.sprite.position.z = f.home.z + Math.cos(t * 0.22 + f.phase) * 0.25;
      if (f.sprite.position.y < 0.12) f.sprite.position.y += 3.4;
      f.sprite.material.rotation = f.baseRot + Math.sin(t * 0.5 + f.phase) * 0.4 + t * f.spin * 0.06;
      f.sprite.material.opacity = 0.32 + Math.sin(t * 0.4 + f.phase) * 0.14;
    }

    for (const sp of sparkles) {
      sp.sprite.material.opacity = 0.22 + 0.42 * (0.5 + 0.5 * Math.sin(t * 1.3 + sp.phase));
      const sc = sp.baseScale * (0.85 + 0.2 * Math.sin(t * 1.1 + sp.phase));
      sp.sprite.scale.setScalar(sc);
      sp.sprite.position.y = sp.y + Math.sin(t * 0.4 + sp.phase) * 0.07;
    }

    nameplate.position.y = 3.615 + Math.sin(t * 0.7) * 0.007;
    nameplateGlow.position.y = nameplate.position.y;
    rimGlow.material.opacity = 0.42 + Math.sin(t * 0.6) * 0.08;
    underGlow.intensity = 1.15 + Math.sin(t * 0.8) * 0.18;

    contact.material.opacity = 0.48;
  };

  update(0);

  return {
    scene,
    update,
    setDustVisible(v) {
      dustVisible = v;
      for (const f of feathers) f.sprite.visible = v;
      for (const sp of sparkles) sp.sprite.visible = v;
      for (const c of clouds) c.sprite.visible = v;
      for (const sys of dustSystems) sys.points.visible = v;
    },
    nameplate,
    floor,
  };
}
