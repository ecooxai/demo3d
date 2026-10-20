import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld } from './scene.js';
import { buildCharacter } from './character.js';

/* ────────────────────────────────────────────────────────────
   Build metadata (shown bottom-right in the viewer)
   ──────────────────────────────────────────────────────────── */
const ITERATION = 1;
const SCORE = 72;
const MODEL_NAME = 'DeepSeek V4.1 Flash';
const TOOL_NAME = 'opencode · web';

const params = new URLSearchParams(location.search);
const CLEAN = params.get('clean') === '1';
if (CLEAN) document.body.classList.add('is-clean');

const state = {
  backend: null,
  width: 900,
  height: 1200,
  resolutionLabel: '900 × 1200',
  renderer: null,
  canvas: null,
  camera: null,
  controls: null,
  world: null,
  character: null,
  renderReady: false,
  autoRotate: false,
  outlines: true,
  dust: true,
  camTween: null,
  zoom: 7.55,
};

const el = {
  stageFrame: document.getElementById('stageFrame'),
  stage: document.querySelector('.stage'),
  loader: document.getElementById('loader'),
  loaderBar: document.getElementById('loaderBar'),
  loaderNote: document.getElementById('loaderNote'),
  backendReadout: document.getElementById('backendReadout'),
  panel: document.getElementById('panel'),
  panelBody: document.getElementById('panelBody'),
  panelToggle: document.getElementById('panelToggle'),
  railRight: document.querySelector('.rail-right'),
  mobileSettings: document.getElementById('mobileSettings'),
  backendSegment: document.getElementById('backendSegment'),
  backendWebGPU: document.getElementById('backendWebGPU'),
  webgpuSupport: document.getElementById('webgpuSupport'),
  resolution: document.getElementById('resolution'),
  dustToggle: document.getElementById('dustToggle'),
  orbitToggle: document.getElementById('orbitToggle'),
  outlineToggle: document.getElementById('outlineToggle'),
  captureBtn: document.getElementById('captureBtn'),
  resetBtn: document.getElementById('resetBtn'),
  fpsReadout: document.getElementById('fpsReadout'),
  scoreValue: document.getElementById('scoreValue'),
  iterationValue: document.getElementById('iterationValue'),
  stageFallback: document.getElementById('stageFallback'),
  fallbackWebGL: document.getElementById('fallbackWebGL'),
  fallbackRetry: document.getElementById('fallbackRetry'),
  scoreBadge: document.getElementById('scoreBadge'),
};

el.scoreValue.textContent = String(SCORE);
el.iterationValue.textContent = String(ITERATION).padStart(2, '0');

/* ────────────────────────────────────────────────────────────
   UI helpers
   ──────────────────────────────────────────────────────────── */
let toastTimer = 0;
function toast(message, tone = 'default') {
  let node = document.getElementById('toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'toast';
    node.className = 'toast';
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.dataset.tone = tone;
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 2600);
}

function setLoading(progress, note) {
  if (el.loaderBar) el.loaderBar.style.width = `${progress}%`;
  if (note && el.loaderNote) el.loaderNote.textContent = note;
}

function hideLoader() {
  if (!el.loader) return;
  el.loader.classList.add('is-done');
  setTimeout(() => { el.loader.style.display = 'none'; }, 1100);
}

function showFallback(message) {
  el.stageFallback.hidden = false;
  const p = el.stageFallback.querySelector('.fallback-card > p:not(.eyebrow)');
  if (p && message) p.textContent = message;
  hideLoader();
}

function hideFallback() {
  el.stageFallback.hidden = true;
}

function setBackendUI(kind) {
  for (const btn of el.backendSegment.querySelectorAll('button')) {
    btn.classList.toggle('is-active', btn.dataset.backend === kind);
  }
  if (el.backendReadout) {
    el.backendReadout.textContent = `${kind.toUpperCase()} · ${state.width} × ${state.height}`;
  }
}

function setCameraChip(name) {
  for (const chip of document.querySelectorAll('.chip[data-camera]')) {
    chip.classList.toggle('is-active', chip.dataset.camera === name);
  }
}

function updateSizeUI() {
  if (el.backendReadout && state.backend) {
    el.backendReadout.textContent = `${state.backend.toUpperCase()} · ${state.width} × ${state.height}`;
  }
}

/* ────────────────────────────────────────────────────────────
   Stage layout
   ──────────────────────────────────────────────────────────── */
function layoutStage() {
  if (!el.stage || !el.stageFrame) return;
  const rect = el.stage.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;
  const ar = state.width / state.height;
  let h = rect.height;
  let w = h * ar;
  if (w > rect.width) {
    w = rect.width;
    h = w / ar;
  }
  w = Math.max(1, Math.floor(w));
  h = Math.max(1, Math.floor(h));
  el.stageFrame.style.width = `${w}px`;
  el.stageFrame.style.height = `${h}px`;
  el.stageFrame.style.aspectRatio = `${ar}`;
  if (el.stage) el.stage.dataset.landscape = ar > 1.35 ? 'true' : 'false';
}

const ro = new ResizeObserver(() => layoutStage());
ro.observe(document.querySelector('.stage'));
window.addEventListener('resize', layoutStage);

/* ────────────────────────────────────────────────────────────
   WebGPU capability probe
   ──────────────────────────────────────────────────────────── */
let webgpuAvailable = false;
async function probeWebGPU() {
  try {
    if (!('gpu' in navigator)) { webgpuAvailable = false; }
    else {
      const adapter = await navigator.gpu.requestAdapter();
      webgpuAvailable = !!adapter;
    }
  } catch {
    webgpuAvailable = false;
  }
  if (el.webgpuSupport) {
    el.webgpuSupport.textContent = webgpuAvailable ? 'available' : 'unavailable';
    el.webgpuSupport.classList.toggle('is-warn', !webgpuAvailable);
  }
  return webgpuAvailable;
}

/* ────────────────────────────────────────────────────────────
   Renderer creation / swapping
   ──────────────────────────────────────────────────────────── */
async function createRenderer(kind) {
  const canvas = document.createElement('canvas');
  canvas.id = 'scene';
  canvas.setAttribute('aria-label', 'Procedural 3D character viewer');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none;background:#dcefff;';

  let renderer;
  if (kind === 'webgpu') {
    const mod = await import('three/webgpu');
    renderer = new mod.WebGPURenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    await renderer.init();
  } else {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
  }

  renderer.setPixelRatio(1);
  renderer.setSize(state.width, state.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.93;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0xdcefff, 1);

  return { renderer, canvas };
}

function attachCanvas(canvas) {
  // The 3D canvas lives underneath the HUD overlays.
  const old = el.stageFrame.querySelector('canvas#scene');
  if (old) old.remove();
  const firstOverlay = el.stageFrame.querySelector('.stage-sheen');
  if (firstOverlay) el.stageFrame.insertBefore(canvas, firstOverlay);
  else el.stageFrame.insertBefore(canvas, el.stageFrame.firstChild);
  state.canvas = canvas;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    toast('The WebGL context was lost — reload to restore the stage.', 'warn');
  });
  canvas.addEventListener('dblclick', () => goToView('front', true));
}

function attachControls(canvas) {
  if (state.controls) {
    state.controls.dispose();
    state.controls = null;
  }
  const controls = new OrbitControls(state.camera, canvas);
  controls.target.set(0, 2.005, 0.055);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 4.4;
  controls.maxDistance = 11;
  controls.minPolarAngle = 0.48;
  controls.maxPolarAngle = 1.585;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.65;
  controls.autoRotate = state.autoRotate;
  controls.autoRotateSpeed = 0.38;
  state.controls = controls;
}

async function switchBackend(kind, { initial = false } = {}) {
  if (!initial && state.backend === kind && state.renderer) return true;
  if (kind === 'webgpu' && !webgpuAvailable) {
    setBackendUI(state.backend ?? 'webgl');
    showFallback('WebGPU is not available in this browser. Nothing has been switched automatically — choose WebGL to open the stage.');
    return false;
  }

  if (!initial) {
    toast(kind === 'webgpu' ? 'Starting the WebGPU stage…' : 'Starting the WebGL stage…');
  }

  let result;
  try {
    result = await createRenderer(kind);
  } catch (err) {
    console.error('Renderer init failed:', err);
    if (state.backend) setBackendUI(state.backend);
    showFallback(kind === 'webgpu'
      ? 'WebGPU could not start on this device. Nothing has been switched automatically — choose WebGL to continue.'
      : 'The renderer could not start. Try a different backend or reload.');
    return false;
  }

  // free the old renderer only after the new one reports ready
  if (state.renderer) {
    try { state.renderer.dispose(); } catch { /* noop */ }
  }
  state.renderer = result.renderer;
  state.backend = kind;
  attachCanvas(result.canvas);
  attachControls(result.canvas);
  setBackendUI(kind);
  updateSizeUI();
  hideFallback();

  state.camera.aspect = state.width / state.height;
  state.camera.updateProjectionMatrix();
  if (state.controls) {
    state.controls.autoRotate = state.autoRotate;
    state.controls.update();
  }
  layoutStage();

  // first render immediately so the loader can reveal a real image
  if (state.world) {
    try {
      characterUpdate(0, 0);
      state.renderer.render(state.world.scene, state.camera);
    } catch (err) {
      console.error('First render failed:', err);
      if (kind === 'webgpu') {
        showFallback('WebGPU started but could not draw this scene. Choose WebGL to continue.');
        return false;
      }
    }
  }
  return true;
}

/* ────────────────────────────────────────────────────────────
   Scene / camera
   ──────────────────────────────────────────────────────────── */
function makeCamera() {
  const camera = new THREE.PerspectiveCamera(31, state.width / state.height, 0.08, 80);
  camera.position.set(0.5, 2.06, state.zoom);
  camera.lookAt(0, 2.0, 0);
  state.camera = camera;
}

const views = {
  front: { pos: [0.5, 2.06, 7.55], target: [0, 2.005, 0.055] },
  'three-quarter': { pos: [2.95, 2.14, 6.95], target: [0, 2.005, 0.03] },
  profile: { pos: [7.5, 2.07, 0.6], target: [0, 2.005, 0.02] },
  back: { pos: [-0.55, 2.06, -7.4], target: [0, 2.02, 0.0] },
};

function goToView(name, instant = false) {
  const v = views[name];
  if (!v) return;
  setCameraChip(name);
  if (!state.camera) return;
  if (instant) {
    state.camera.position.set(...v.pos);
    state.controls.target.set(...v.target);
    state.controls.update();
    state.camTween = null;
    return;
  }
  state.camTween = {
    start: performance.now(),
    duration: 900,
    fromPos: state.camera.position.clone(),
    fromTarget: state.controls.target.clone(),
    toPos: new THREE.Vector3(...v.pos),
    toTarget: new THREE.Vector3(...v.target),
  };
}

function updateCameraTween(now) {
  const tw = state.camTween;
  if (!tw) {
    if (state.controls) state.controls.autoRotate = state.autoRotate;
    return;
  }
  if (state.controls) state.controls.autoRotate = false;
  const k = Math.min(1, (now - tw.start) / tw.duration);
  const e = 1 - Math.pow(1 - k, 3);
  state.camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
  state.controls.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
  if (k >= 1) {
    state.camTween = null;
    if (state.controls) state.controls.autoRotate = state.autoRotate;
  }
}

function characterUpdate(t, dt) {
  if (state.character) state.character.update(t, dt);
}

/* ────────────────────────────────────────────────────────────
   Resolution
   ──────────────────────────────────────────────────────────── */
function parseResolution(value) {
  const [w, h] = value.split('x').map(Number);
  return { w, h };
}

function setResolution(w, h, label) {
  state.width = w;
  state.height = h;
  state.resolutionLabel = label ?? `${w} × ${h}`;
  if (state.renderer) {
    state.renderer.setSize(w, h, false);
    state.camera.aspect = w / h;
    state.camera.updateProjectionMatrix();
  }
  layoutStage();
  updateSizeUI();
}

/* ────────────────────────────────────────────────────────────
   Screenshot
   ──────────────────────────────────────────────────────────── */
function captureFrame() {
  if (!state.renderer || !state.world) return;
  try {
    state.renderer.render(state.world.scene, state.camera);
  } catch (err) {
    console.error(err);
  }
  const canvas = state.renderer.domElement;
  const finish = (blob) => {
    if (!blob) {
      toast('This browser could not export the frame. Try WebGL.', 'warn');
      return;
    }
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `yuukapa_deepseek-v41-flash_web_iter${String(ITERATION).padStart(2, '0')}_${state.width}x${state.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Frame captured at render resolution.');
  };
  if (canvas.toBlob) canvas.toBlob(finish, 'image/png');
  else {
    const data = canvas.toDataURL('image/png');
    fetch(data).then((r) => r.blob()).then(finish);
  }
}

/* ────────────────────────────────────────────────────────────
   UI events
   ──────────────────────────────────────────────────────────── */
function bindUI() {
  for (const btn of el.backendSegment.querySelectorAll('button')) {
    btn.addEventListener('click', async () => {
      const kind = btn.dataset.backend;
      if (kind === state.backend) return;
      setBackendUI(kind);
      const ok = await switchBackend(kind);
      if (!ok) setBackendUI(state.backend ?? 'webgl');
    });
  }

  el.resolution.addEventListener('change', () => {
    const { w, h } = parseResolution(el.resolution.value);
    const label = el.resolution.options[el.resolution.selectedIndex].text.split('·')[0].trim();
    setResolution(w, h, label);
    toast(`Resolution set to ${label}.`);
  });

  for (const chip of document.querySelectorAll('.chip[data-camera]')) {
    chip.addEventListener('click', () => goToView(chip.dataset.camera));
  }

  el.dustToggle.addEventListener('click', () => {
    state.dust = !state.dust;
    el.dustToggle.classList.toggle('is-on', state.dust);
    el.dustToggle.setAttribute('aria-checked', String(state.dust));
    if (state.world) state.world.setDustVisible(state.dust);
  });

  el.orbitToggle.addEventListener('click', () => {
    state.autoRotate = !state.autoRotate;
    el.orbitToggle.classList.toggle('is-on', state.autoRotate);
    el.orbitToggle.setAttribute('aria-checked', String(state.autoRotate));
    if (state.controls) state.controls.autoRotate = state.autoRotate && !state.camTween;
  });

  el.outlineToggle.addEventListener('click', () => {
    state.outlines = !state.outlines;
    el.outlineToggle.classList.toggle('is-on', state.outlines);
    el.outlineToggle.setAttribute('aria-checked', String(state.outlines));
    if (state.character) {
      for (const ink of state.character.outlines) ink.visible = state.outlines;
    }
  });

  el.captureBtn.addEventListener('click', captureFrame);
  el.resetBtn.addEventListener('click', () => goToView('front'));

  el.panelToggle.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 980px)').matches) {
      el.railRight.classList.toggle('is-open');
    } else {
      el.panel.classList.toggle('is-collapsed');
      el.panelToggle.setAttribute('aria-expanded', String(!el.panel.classList.contains('is-collapsed')));
    }
  });

  el.mobileSettings.addEventListener('click', () => {
    el.railRight.classList.add('is-open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      el.railRight.classList.remove('is-open');
      if (!el.stageFallback.hidden) return;
    }
  });

  el.fallbackWebGL.addEventListener('click', () => switchBackend('webgl'));
  el.fallbackRetry.addEventListener('click', () => switchBackend('webgpu'));

  // drag detection: clear the active camera chip after manual orbiting
  const clearChip = () => {
    if (state.camTween) return;
    for (const chip of document.querySelectorAll('.chip[data-camera]')) chip.classList.remove('is-active');
  };
  // OrbitControls uses pointer events on the canvas; attach lazily when controls exist.
  const markOnInteract = () => {
    if (state.canvas) {
      state.canvas.addEventListener('pointerdown', clearChip, { once: false, passive: true });
    }
  };
  markOnInteract();
  window.__markOnInteract = markOnInteract;
}

/* ────────────────────────────────────────────────────────────
   Boot
   ──────────────────────────────────────────────────────────── */
async function boot() {
  setLoading(8, 'mixing moonlight and pigment…');
  await probeWebGPU();

  if (params.get('res')) {
    const { w, h } = parseResolution(params.get('res'));
    state.width = w;
    state.height = h;
    state.resolutionLabel = `${w} × ${h}`;
    const opt = `${w}x${h}`;
    if ([...el.resolution.options].some((o) => o.value === opt)) el.resolution.value = opt;
  }

  setLoading(22, 'drawing the cat-print cloth…');
  await new Promise((r) => requestAnimationFrame(r));

  state.world = buildWorld();
  state.character = buildCharacter();
  state.world.scene.add(state.character.root);

  setLoading(56, 'painting the face, strand by strand…');
  await new Promise((r) => requestAnimationFrame(r));

  makeCamera();

  setLoading(74, 'hanging the halo…');
  await new Promise((r) => requestAnimationFrame(r));

  let backend = params.get('backend');
  if (!backend) backend = webgpuAvailable ? 'webgpu' : 'webgl';
  if (!['webgl', 'webgpu'].includes(backend)) backend = 'webgl';

  setLoading(88, backend === 'webgpu' ? 'waking the WebGPU stage…' : 'waking the WebGL stage…');

  const ok = await switchBackend(backend, { initial: true });
  if (!ok) {
    // let the user explicitly choose a fallback — never silently switch
    hideLoader();
    setBackendUI('webgl');
    bindUI();
    return;
  }

  state.renderReady = true;
  bindUI();
  if (window.__markOnInteract) window.__markOnInteract();

  if (params.get('view') && views[params.get('view')]) {
    goToView(params.get('view'), true);
  } else {
    goToView('front', true);
  }

  setLoading(100, 'ready.');
  setTimeout(hideLoader, 380);

  // pre-warm shaders at the final camera
  try {
    state.renderer.compile(state.world.scene, state.camera);
  } catch { /* WebGPU compile can be async */ }

  startLoop();
  exposeAPI();
}

/* ────────────────────────────────────────────────────────────
   Loop
   ──────────────────────────────────────────────────────────── */
let frames = 0;
let fpsClock = performance.now();
let lastTime = performance.now();

function startLoop() {
  let hasRendered = false;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!state.renderer) return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    const t = now / 1000;

    updateCameraTween(now);
    if (state.controls) state.controls.update();
    characterUpdate(t, dt);
    state.world.update(t);

    try {
      state.renderer.render(state.world.scene, state.camera);
      hasRendered = true;
    } catch (err) {
      if (!hasRendered) {
        console.error('Render failed:', err);
        showFallback('This renderer could not draw the scene. Choose WebGL to continue.');
      }
    }

    frames++;
    if (now - fpsClock > 600) {
      const fps = Math.round((frames * 1000) / (now - fpsClock));
      if (el.fpsReadout) el.fpsReadout.textContent = `${fps} FPS · LIVE`;
      frames = 0;
      fpsClock = now;
    }
  }
  requestAnimationFrame(frame);
}

/* ────────────────────────────────────────────────────────────
   Debug / QA API
   ──────────────────────────────────────────────────────────── */
function exposeAPI() {
  window.__YUU__ = {
    get ready() { return state.renderReady; },
    get backend() { return state.backend; },
    get score() { return SCORE; },
    get iteration() { return ITERATION; },
    model: `${MODEL_NAME} · ${TOOL_NAME}`,
    setView: (name, instant = true) => goToView(name, instant),
    setBackend: (kind) => switchBackend(kind),
    setResolution: (w, h) => {
      setResolution(w, h);
      el.resolution.value = `${w}x${h}`;
    },
    setDust: (v) => {
      state.dust = !!v;
      el.dustToggle.classList.toggle('is-on', state.dust);
      if (state.world) state.world.setDustVisible(state.dust);
    },
    setAutoRotate: (v) => {
      state.autoRotate = !!v;
      el.orbitToggle.classList.toggle('is-on', state.autoRotate);
      if (state.controls) state.controls.autoRotate = state.autoRotate;
    },
    setOutlines: (v) => {
      state.outlines = !!v;
      el.outlineToggle.classList.toggle('is-on', state.outlines);
      if (state.character) for (const ink of state.character.outlines) ink.visible = state.outlines;
    },
    capture: captureFrame,
    state,
  };
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  const fallback = document.getElementById('stageFallback');
  if (fallback) {
    fallback.hidden = false;
    const p = fallback.querySelector('.fallback-card > p:not(.eyebrow)');
    if (p) p.textContent = 'The stage failed to boot. Please reload, or choose WebGL if the browser refused WebGPU.';
  }
  hideLoader();
});
