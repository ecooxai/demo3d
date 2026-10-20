import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildFigure } from './figure.js';
import { P } from './materials.js';
import { makeGlowTexture, makeContactShadowTexture } from './textures.js';
import { JOURNAL } from './badge.js';

/* ================= state ================= */
const qs = new URLSearchParams(location.search);
const SHOT = qs.get('shot') === '1';
if (SHOT) document.body.classList.add('shotmode');

const LS = {
  backend: 'yk_backend', res: 'yk_res', orient: 'yk_orient',
  rot: 'yk_rot', outline: 'yk_outline', idle: 'yk_idle',
};
const RES_PRESETS = {
  '900':  { p: [900, 1200], l: [1200, 900] },
  '1280': { p: [1280, 1704], l: [1704, 1280] },
  '1080': { p: [1080, 1920], l: [1920, 1080] },
  '2k':   { p: [1440, 2560], l: [2560, 1440] },
  '4k':   { p: [2160, 3840], l: [3840, 2160] },
};

const state = {
  backend: qs.get('bf') || localStorage.getItem(LS.backend) || null,
  res: localStorage.getItem(LS.res) || '900',
  orient: localStorage.getItem(LS.orient) || 'portrait',
  autoRotate: localStorage.getItem(LS.rot) === '1',
  outlines: localStorage.getItem(LS.outline) !== '0',
  idle: localStorage.getItem(LS.idle) !== '0',
};

const hasWebGPU = !!navigator.gpu;
let renderer = null;
let scene, camera, controls, parts, clock;
let renderW = 900, renderH = 1200;
const stage = document.getElementById('stage');
let canvas = document.getElementById('gl');

/* ================= badge ================= */
const bIter = document.getElementById('bIter');
const bScore = document.getElementById('bScore');
function refreshBadge() {
  bIter.textContent = `Iter ${JOURNAL.iter}`;
  bScore.textContent = `Score ${JOURNAL.score}/100`;
  bScore.className = JOURNAL.score >= 95 ? 'ok' : 'warn';
}
refreshBadge();

/* ================= scene ================= */
function buildScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(P.bg);

  const hemi = new THREE.HemisphereLight(0xf0f7ff, 0xc6b6d8, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff2e6, 0.95);
  key.position.set(0.9, 1.7, 1.4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xcdd8ff, 0.5);
  rim.position.set(-1.3, 1.3, -1.6);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.22);
  fill.position.set(-0.7, 0.7, 1.5);
  scene.add(fill);

  parts = buildFigure();
  scene.add(parts.root);

  // contact shadow
  const shadowTex = makeContactShadowTexture();
  const sh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.66),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.6, depthWrite: false }),
  );
  sh.rotation.x = -Math.PI / 2;
  sh.position.set(-0.02, 0.003, 0.01);
  scene.add(sh);

  // halo glow sprite
  {
    const sm = new THREE.SpriteMaterial({
      map: makeGlowTexture(), color: 0x6fb7ff,
      transparent: true, opacity: 0.32, depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const sp = new THREE.Sprite(sm);
    sp.scale.setScalar(0.30);
    sp.position.set(0, 0, -0.02);
    parts.halo.add(sp);
  }

  camera = new THREE.PerspectiveCamera(32, renderW / renderH, 0.05, 60);
  camera.position.set(0.06, 1.08, 3.45);
  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.92, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = SHOT ? false : state.autoRotate;
  controls.autoRotateSpeed = 0.9;
  controls.minDistance = 1.2;
  controls.maxDistance = 8;
  controls.maxPolarAngle = 1.62;
  controls.update();

  // double-click / double-tap reset
  let lastTap = 0;
  canvas.addEventListener('pointerdown', () => {
    const t = performance.now();
    if (t - lastTap < 320) resetView();
    lastTap = t;
  });
}

/* ================= renderer / backend ================= */
function freshCanvas() {
  const c = document.createElement('canvas');
  c.id = 'gl';
  c.className = 'glcanvas';
  canvas.replaceWith(c);
  canvas = c;
  return c;
}

async function initRenderer(backend) {
  const c = freshCanvas();
  const opts = { canvas: c, antialias: true, forceWebGL: backend === 'webgl2' };
  const r = new THREE.WebGPURenderer(opts);
  await r.init();
  if (renderer) { try { renderer.dispose(); } catch (e) { /* ignore */ } }
  renderer = r;
  const realBackend = r.backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2';
  if (backend === 'webgpu' && realBackend !== 'WebGPU') {
    // never auto-fallback — refuse and surface an explicit problem
    showBackendProblem(`WebGPU request failed (renderer fell back internally to ${realBackend}). This app never auto-falls back. Retry WebGPU or explicitly choose WebGL2.`);
    return false;
  }
  state.backend = backend;
  localStorage.setItem(LS.backend, backend);
  console.log(`BACKEND=${realBackend}`);
  window.__APP__ = { backend: realBackend, ready: true };
  applySize();
  if (scene) {
    camera.aspect = renderW / renderH;
    camera.updateProjectionMatrix();
  }
  renderer.render(scene, camera);
  updateNote();
  updateBadgeBackend();
  return true;
}

function showBackendProblem(msg) {
  showModal('Renderer problem', msg, [
    { label: 'Use WebGL2', cls: 'primary', fn: () => switchBackend('webgl2') },
    { label: 'Retry WebGPU', cls: 'ghost', fn: () => switchBackend('webgpu') },
  ]);
}
function showModal(title, body, actions) {
  const modal = document.getElementById('modal');
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mBody').textContent = body;
  const acts = document.getElementById('mActions');
  acts.innerHTML = '';
  for (const a of actions) {
    const b = document.createElement('button');
    b.textContent = a.label;
    b.className = a.cls || 'ghost';
    b.onclick = () => { modal.hidden = true; a.fn && a.fn(); };
    acts.appendChild(b);
  }
  modal.hidden = false;
}

async function switchBackend(backend) {
  if (backend === 'webgpu' && !hasWebGPU) {
    showModal(
      'WebGPU not available',
      'WebGPU is not enabled in this browser.\nIt needs Chrome/Edge 113+ (or Safari 18+) with hardware acceleration on.\n\nThis app never auto-falls back — choose WebGL2 explicitly to keep rendering.',
      [{ label: 'Use WebGL2', cls: 'primary', fn: () => switchBackend('webgl2') }],
    );
    return;
  }
  try {
    const ok = await initRenderer(backend);
    if (!ok) return;
  } catch (err) {
    console.error(err);
    showBackendProblem(`Failed to init ${backend}:\n${err.message || err}\n\nRetry WebGPU or explicitly choose WebGL2.`);
    return;
  }
  syncUI();
}

/* ================= sizing ================= */
function applySize() {
  const preset = RES_PRESETS[state.res] || RES_PRESETS['900'];
  const [w, h] = state.orient === 'landscape' ? preset.l : preset.p;
  renderW = w; renderH = h;
  if (!renderer) return;
  renderer.setPixelRatio(1);
  renderer.setSize(renderW, renderH, false);
  if (camera) {
    camera.aspect = renderW / renderH;
    camera.updateProjectionMatrix();
  }
  // display sizing: 1:1 on desktop (>=900px), 1/2 width on smaller windows
  const vw = window.innerWidth, vh = window.innerHeight;
  let dw = vw < 900 ? Math.min(renderW / 2, vw - 12) : Math.min(renderW, vw - 16);
  const dh = dw * renderH / renderW;
  const maxH = vh - 24;
  if (dh > maxH) dw = maxH * renderW / renderH;
  canvas.style.width = `${Math.round(dw)}px`;
  canvas.style.height = `${Math.round(dw * renderH / renderW)}px`;
  document.getElementById('resLabel').textContent = `${renderW}×${renderH}`;
}
window.addEventListener('resize', applySize);

/* ================= UI ================= */
const panel = document.getElementById('panel');
document.getElementById('gear').onclick = () => { panel.hidden = !panel.hidden; };
const gpuNote = document.getElementById('gpuNote');

function syncUI() {
  document.querySelectorAll('input[name=backend]').forEach((r) => {
    r.checked = r.value === state.backend;
    if (r.value === 'webgpu' && !hasWebGPU) {
      r.disabled = true;
    }
  });
  document.getElementById('resPreset').value = state.res;
  document.querySelectorAll('input[name=orient]').forEach((r) => { r.checked = r.value === state.orient; });
  document.getElementById('ckRotate').checked = !!state.autoRotate;
  document.getElementById('ckOutline').checked = !!state.outlines;
  document.getElementById('ckIdle').checked = !!state.idle;
  updateNote();
  const p = RES_PRESETS[state.res];
  const [w, h] = state.orient === 'landscape' ? p.l : p.p;
}
function updateNote() {
  gpuNote.textContent = hasWebGPU
    ? `WebGPU detected · active: ${state.backend}`
    : 'WebGPU not detected in this browser';
}
function updateBadgeBackend() {
  const real = renderer?.backend?.isWebGPUBackend ? 'WebGPU' : 'WebGL2';
  bIter.setAttribute('data-b', real);
  bIter.textContent = `Iter ${JOURNAL.iter} · ${real}`;
}
document.querySelectorAll('input[name=backend]').forEach((r) => {
  r.onchange = () => switchBackend(r.value);
});
document.getElementById('resPreset').onchange = (e) => {
  state.res = e.target.value; localStorage.setItem(LS.res, state.res);
  applySize();
};
document.querySelectorAll('input[name=orient]').forEach((r) => {
  r.onchange = () => {
    state.orient = r.value; localStorage.setItem(LS.orient, state.orient);
    applySize();
  };
});
document.getElementById('ckRotate').onchange = (e) => {
  state.autoRotate = e.target.checked;
  localStorage.setItem(LS.rot, state.autoRotate ? '1' : '0');
  if (controls) controls.autoRotate = e.target.checked;
};
document.getElementById('ckOutline').onchange = (e) => {
  state.outlines = e.target.checked;
  localStorage.setItem(LS.outline, state.outlines ? '1' : '0');
  import('./geometry.js').then(({ outlinesVisible }) => outlinesVisible(e.target.checked));
};
document.getElementById('ckIdle').onchange = (e) => {
  state.idle = e.target.checked;
  localStorage.setItem(LS.idle, state.idle ? '1' : '0');
};
document.getElementById('btnReset').onclick = () => resetView();

function resetView() {
  camera.position.set(0.06, 1.08, 3.45);
  controls.target.set(0, 0.92, 0);
  controls.update();
}

/* ================= shot mode camera ================= */
function applyShotCamera() {
  const az = THREE.MathUtils.degToRad(parseFloat(qs.get('az') ?? '0'));
  const el = THREE.MathUtils.degToRad(parseFloat(qs.get('el') ?? '4'));
  const d = parseFloat(qs.get('d') ?? '3.45');
  const target = new THREE.Vector3(
    parseFloat(qs.get('tx') ?? '0'),
    parseFloat(qs.get('ty') ?? '0.92'),
    0,
  );
  const st = new THREE.Spherical(d, Math.PI / 2 - el, az);
  camera.position.setFromSpherical(st).add(target);
  camera.lookAt(target);
}

/* ================= boot ================= */
(async function boot() {
  clock = new THREE.Clock();
  buildScene();
  const defBackend = state.backend || (hasWebGPU ? 'webgpu' : null);
  if (!defBackend && !hasWebGPU) {
    // explicit prompt — never auto-fallback
    showModal(
      'Choose a renderer',
      'WebGPU is not detected in this browser.\nYou can still render with the WebGL2 backend — pick it explicitly.',
      [{ label: 'Use WebGL2', cls: 'primary', fn: () => switchBackend('webgl2') }],
    );
    sceneReady = true;
  } else {
    try {
      await initRenderer(defBackend);
    } catch (err) {
      console.error(err);
      showBackendProblem(`Failed to init ${defBackend}:\n${err.message || err}`);
    }
  }
  sceneReady = true;
  animate();
})();

let sceneReady = false;
const fpsEl = document.getElementById('fps');
let frames = 0, fpsT = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (SHOT) {
    applyShotCamera();
  } else {
    controls.autoRotate = state.autoRotate;
    if (state.autoRotate) controls.autoRotateSpeed = 0.9;
    controls.update();
  }
  parts.update(t, dt, state.idle && !SHOT);
  constraints();
  renderer.render(scene, camera);
  frames++;
  fpsT += dt;
  if (fpsT >= 1) {
    fpsEl.textContent = `${Math.round(frames / fpsT)} fps`;
    frames = 0; fpsT = 0;
  }
}
function constraints() {
  if (SHOT) return;
  controls.update();
}

applySize();
syncUI();
