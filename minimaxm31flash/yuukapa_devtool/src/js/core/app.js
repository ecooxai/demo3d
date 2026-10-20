/**
 * app.js — the viewer.
 * Owns the renderer (WebGPU or WebGL 2), the scene, the camera rig,
 * the lighting and the toon outline pass.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { positionWorld, smoothstep, mix, color, float } from 'three/tsl';
import { createMaterials, addRim, addOutline } from '../lib/mat.js';
import { buildCharacter } from '../char/character.js';

const MODEL_NAME = 'minimax-m3.1-flash';

export const VIEWS = {
  front:   { az: -0.07,  el: 0.03, dist: 3.40, target: [0.05, 0.97, 0] },
  back:    { az: Math.PI, el: 0.07, dist: 3.30, target: [0, 0.95, 0] },
  left:    { az: -Math.PI / 2, el: 0.05, dist: 3.20, target: [0, 0.94, 0] },
  right:   { az: Math.PI / 2,  el: 0.05, dist: 3.20, target: [0, 0.94, 0] },
  three4:  { az: -0.30,  el: 0.09, dist: 3.25, target: [0.05, 0.98, 0] },
  top:     { az: 0.55,   el: 0.95, dist: 3.30, target: [0, 0.92, 0] },
  closeup: { az: -0.24,  el: 0.05, dist: 0.82, target: [0.02, 1.55, 0] },
  wide:    { az: -0.55,  el: 0.15, dist: 4.20, target: [0, 0.92, 0] },
};

export class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.backend = 'webgl';
    this.resW = 900;
    this.resH = 1200;
    this.clock = { last: performance.now() / 1000, elapsed: 0 };
    this.fps = 0;
    this._fpsAcc = 0;
    this._fpsFrames = 0;
    this.options = {
      outline: true,
      rim: true,
      shadows: true,
      animate: true,
      autoRotate: false,
      fov: 30,
    };
    this._camAnim = null;
    this._tagEl = document.getElementById('modelTag');
  }

  /* ── capability probe ───────────────────────────────────── */
  static async probe() {
    const out = { webgpu: false, webgl: false, reason: '' };
    try {
      const c = document.createElement('canvas');
      out.webgl = !!c.getContext('webgl2');
    } catch (e) { out.webgl = false; }
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        out.webgpu = !!adapter;
        if (!adapter) out.reason = 'No WebGPU adapter available.';
      } catch (e) {
        out.reason = e.message || 'WebGPU adapter request failed.';
      }
    } else {
      out.reason = 'navigator.gpu is not exposed by this browser.';
    }
    return out;
  }

  /* ── boot ───────────────────────────────────────────────── */
  async init(backend) {
    this.backend = backend;
    const renderer = new THREE.WebGPURenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      forceWebGL: backend === 'webgl',
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(1);
    renderer.setSize(this.resW, this.resH, false);
    renderer.setClearColor(0xdceaf4, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.NoToneMapping;
    await renderer.init();
    this.renderer = renderer;

    this.materials = createMaterials();
    this.blobTexture = this.materials.glowMap;

    this.scene = new THREE.Scene();
    this.buildEnvironment();
    this.buildCharacter();
    this.buildCamera();

    this.applyOptions();
    this.resize();

    this._raf = null;
    this.ready = true;
    return this;
  }

  /** Swap the rendering backend at runtime (fresh canvas + fresh GPU state). */
  async rebuild(backend) {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this._pipeline = null;
    if (this.renderer) { try { this.renderer.dispose(); } catch (e) { /* noop */ } }
    if (this.controls) { this.controls.dispose(); this.controls = null; }

    const old = this.canvas;
    const fresh = old.cloneNode(false);
    old.parentNode.replaceChild(fresh, old);
    this.canvas = fresh;
    this._tagEl = document.getElementById('modelTag');

    await this.init(backend);
    this._rebuildPipeline();
    this.start();
    return this;
  }

  /* ── environment: gradient sky, ground, lights ──────────── */
  buildEnvironment() {
    const scene = this.scene;

    // vertical gradient backdrop
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(40, 32, 24),
      (() => {
        const m = new THREE.MeshBasicNodeMaterial();
        m.side = THREE.BackSide;
        m.depthWrite = false;
        m.toneMapped = false;
        const h = smoothstep(float(-1.2), float(3.2), positionWorld.y);
        m.colorNode = mix(color(0xeaf6ff), color(0x9ec6e2), h);
        return m;
      })()
    );
    sky.name = 'sky';
    sky.renderOrder = -10;
    scene.add(sky);

    // shadow catcher
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.ShadowMaterial({ opacity: 0.16, color: 0x2c3f5c })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.name = 'ground';
    scene.add(ground);

    // soft ambient occlusion blob under the feet
    const blob = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.1),
      new THREE.MeshBasicMaterial({
        map: this.blobTexture, transparent: true, opacity: 0.55,
        depthWrite: false, toneMapped: false, color: 0x44587a,
      })
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.set(0.02, 0.004, 0.01);
    blob.renderOrder = -5;
    scene.add(blob);

    // ── lights
    const hemi = new THREE.HemisphereLight(0xe8f5ff, 0xa9c0d4, 0.30);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xdfe9f6, 0.30);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xfff3e6, 2.10);
    key.position.set(2.6, 3.8, 3.0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -1.6;
    key.shadow.camera.right = 1.6;
    key.shadow.camera.top = 2.4;
    key.shadow.camera.bottom = -0.4;
    key.shadow.bias = -0.0012;
    key.shadow.normalBias = 0.012;
    key.shadow.radius = 4;
    scene.add(key);
    scene.add(key.target);
    key.target.position.set(0, 0.9, 0);
    this.keyLight = key;

    const fill = new THREE.DirectionalLight(0xc3dcff, 0.42);
    fill.position.set(-3.4, 1.6, 2.6);
    scene.add(fill);

    const back = new THREE.DirectionalLight(0xd7c6ff, 0.80);
    back.position.set(-1.8, 2.9, -3.2);
    scene.add(back);

    // gentle cyan bounce from the halo — a real point light this close
    // would blow out the hair and face through inverse-square falloff
    const haloLight = new THREE.PointLight(0x59d8ff, 0.035, 1.4, 1);
    haloLight.position.set(0, 1.90, 0);
    scene.add(haloLight);
    this.haloLight = haloLight;
  }

  /* ── the character ──────────────────────────────────────── */
  buildCharacter() {
    this.character = buildCharacter(this.materials);
    this.scene.add(this.character.rig.root);

    // rim-light shells + inverted-hull ink outlines on the silhouette volumes
    const M = this.materials;
    this.character.rig.root.traverse((o) => {
      if (!o.isMesh || o.name === 'rim' || o.name === 'outline') return;
      if (o.material === M.eye) return;                 // the face is painted, not outlined
      if (o.material === M.haloGlow) return;
      const isHair = o.name.startsWith('mane') || o.name.startsWith('bang') ||
        o.name.startsWith('sideLock') || o.name === 'hairCap' ||
        o.name === 'curl' || o.name.startsWith('flyaway');
      const isSoft = o.material === M.pillow || o.material === M.cloth || o.material === M.slipper;

      addRim(o, isHair ? M.rimHair : isSoft ? M.rimWarm : M.rimBody);
      // the pillow's gathered corner folds through itself, so it gets no ink line
      if (o.material !== M.pillow) {
        addOutline(o, isHair ? M.outlineHair : isSoft ? M.outlineSoft : M.outlineBody,
          isHair ? 0.0014 : isSoft ? 0.0007 : 0.0026);
      }
    });
  }

  /* ── camera ─────────────────────────────────────────────── */
  buildCamera() {
    const cam = new THREE.PerspectiveCamera(this.options.fov, this.resW / this.resH, 0.05, 120);
    this.camera = cam;

    const controls = new OrbitControls(cam, this.canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.rotateSpeed = 0.85;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.6;
    controls.minDistance = 0.45;
    controls.maxDistance = 9;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.target.set(0, 0.94, 0);
    this.controls = controls;

    this.setView('three4', true);
  }

  /** Move the camera to a named preset. */
  setView(name, instant = false) {
    const v = VIEWS[name] || VIEWS.three4;
    this.activeView = name;
    const az = v.az + (this.options.autoRotate ? 0 : 0);
    const pos = new THREE.Vector3(
      Math.sin(az) * Math.cos(v.el) * v.dist,
      v.target[1] + Math.sin(v.el) * v.dist,
      Math.cos(az) * Math.cos(v.el) * v.dist
    );
    const target = new THREE.Vector3(...v.target);
    if (instant) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.controls.update();
      this._camAnim = null;
    } else {
      this._camAnim = {
        t: 0, dur: 0.85,
        fromPos: this.camera.position.clone(),
        toPos: pos,
        fromTgt: this.controls.target.clone(),
        toTgt: target,
      };
    }
    return true;
  }

  /* ── options ────────────────────────────────────────────── */
  applyOptions() {
    const o = this.options;
    this.camera.fov = o.fov;
    this.camera.updateProjectionMatrix();
    this.renderer.shadowMap.enabled = o.shadows;
    if (this.keyLight) this.keyLight.castShadow = o.shadows;
    this.scene.traverse((ob) => { if (ob.isMesh && ob.material && ob.material.isMeshToonMaterial) ob.material.needsUpdate = true; });
  }

  setRimVisible(on) {
    this.scene.traverse((ob) => { if (ob.name === 'rim') ob.visible = on; });
  }

  setOutlineVisible(on) {
    this.options.outline = on;
    this.scene.traverse((ob) => { if (ob.name === 'outline') ob.visible = on; });
  }

  /* ── post-processing ────────────────────────────────────── */
  _rebuildPipeline() {
    if (this._pipeline) { this._pipeline.dispose?.(); this._pipeline = null; }
  }

  /* ── sizing ─────────────────────────────────────────────── */
  setResolution(w, h) {
    this.resW = w; this.resH = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this._layoutCanvas();
  }

  /** Keep the on-screen canvas at the documented 900px rule. */
  _layoutCanvas() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let cssW = vw < 900 ? Math.max(240, Math.floor(vw / 2)) : 900;
    let cssH = Math.round(cssW * (this.resH / this.resW));
    // never exceed the viewport
    const maxH = vh - 32;
    if (cssH > maxH) {
      cssH = maxH;
      cssW = Math.round(cssH * (this.resW / this.resH));
    }
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
  }

  resize() {
    this._layoutCanvas();
  }

  /* ── frame ──────────────────────────────────────────────── */
  start() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);
      this.frame();
    };
    loop();
  }

  async frame() {
    const now = performance.now() / 1000;
    const dt = Math.min(now - this.clock.last, 0.05);
    this.clock.last = now;
    this.clock.elapsed += dt;
    const t = this.clock.elapsed;

    // fps meter
    this._fpsAcc += dt; this._fpsFrames++;
    if (this._fpsAcc > 0.5) {
      this.fps = Math.round(this._fpsFrames / this._fpsAcc);
      this._fpsAcc = 0; this._fpsFrames = 0;
    }

    if (this._camAnim) {
      const a = this._camAnim;
      a.t += dt;
      const k = Math.min(1, a.t / a.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.camera.position.lerpVectors(a.fromPos, a.toPos, e);
      this.controls.target.lerpVectors(a.fromTgt, a.toTgt, e);
      if (k >= 1) this._camAnim = null;
    } else if (this.options.cine) {
      // cinematic turntable: slow orbit with a gentle breathing dolly
      const off = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.115);
      off.setLength(3.25 + Math.sin(t * 0.21) * 0.30);
      this.camera.position.copy(this.controls.target).add(off);
      this.controls.target.y = 0.97 + Math.sin(t * 0.17) * 0.035;
    } else if (this.options.autoRotate) {
      const off = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.25);
      this.camera.position.copy(this.controls.target).add(off);
    }

    if (this.options.animate) this.animate(t, dt);

    this.controls.update();
    this.updateModelTag();

    await this.renderer.render(this.scene, this.camera);
  }

  /* ── idle animation ─────────────────────────────────────── */
  animate(t, dt) {
    const c = this.character;
    if (!c) return;
    const breath = Math.sin(t * 1.15);
    const sway = Math.sin(t * 0.62);
    const sway2 = Math.sin(t * 0.41 + 1.3);

    // body breathing
    c.rig.chest.scale.set(1 + breath * 0.008, 1 + breath * 0.006, 1 + breath * 0.010);
    c.rig.hips.position.y = 0.92 + breath * 0.004;
    c.rig.hips.rotation.z = 0.012 + sway * 0.006;

    // head drift
    c.rig.headPivot.rotation.x = 0.035 + sway2 * 0.020;
    c.rig.headPivot.rotation.y = -0.055 + sway * 0.035;
    c.rig.headPivot.rotation.z = 0.125 + sway2 * 0.016;

    // hair sway
    c.hair.rotation.z = sway * 0.020;
    c.hair.rotation.x = sway2 * 0.012;
    c.hair.position.x = sway * 0.0035;

    // arms
    c.rig.arms.R.shoulder.rotation.x += 0 + sway2 * 0.004;
    c.rig.arms.R.elbow.rotation.z += sway * 0.0025;
    c.rig.arms.L.shoulder.rotation.x += sway * 0.0035;

    // halo
    if (c.halo.userData.spin) {
      c.halo.userData.spin.rotation.z = t * 0.22;
      c.halo.userData.glow.rotation.z = -t * 0.34;
      c.halo.userData.bloom.rotation.z = t * 0.16;
      if (c.halo.userData.aura) {
        c.halo.userData.aura.material.opacity = 0.26 + Math.sin(t * 1.7) * 0.06;
      }
    }
    c.halo.position.y = 0.435 + Math.sin(t * 0.9) * 0.008;
    if (this.haloLight) this.haloLight.intensity = 0.035 + Math.sin(t * 2.2) * 0.008;
  }

  /* ── floating model-name chip ───────────────────────────── */
  updateModelTag() {
    const el = this._tagEl;
    if (!el) return;
    if (!this._tagAnchor) this._tagAnchor = new THREE.Vector3();
    this._tagAnchor.set(0, 2.09, 0);
    this._tagAnchor.project(this.camera);
    const behind = this._tagAnchor.z > 1;
    const rect = this.canvas.getBoundingClientRect();
    const x = (this._tagAnchor.x * 0.5 + 0.5) * rect.width + rect.left;
    const y = (-this._tagAnchor.y * 0.5 + 0.5) * rect.height + rect.top;
    const cx = Math.min(Math.max(x, 90), window.innerWidth - 90);
    const cy = Math.min(Math.max(y, 34), window.innerHeight - 24);
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    el.classList.toggle('on', !behind);
  }

  info() {
    return {
      backend: this.backend,
      fps: this.fps,
      res: `${this.resW}x${this.resH}`,
      model: MODEL_NAME,
      view: this.activeView,
    };
  }
}

export { MODEL_NAME };
