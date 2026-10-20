import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { createMaterialLibrary } from './materials.js';
import { createCharacter } from './character.js';
import { createEnvironment } from './environment.js';

const PARAMS = new URLSearchParams(window.location.search);
const canvas = document.querySelector('#scene');
const stage = document.querySelector('#stage');
const loading = document.querySelector('#stage-loading');
const loadingBar = document.querySelector('#loading-bar');
const toast = document.querySelector('#toast');
const backendReadout = document.querySelector('#backend-readout');
const resolutionReadout = document.querySelector('#resolution-readout');
const fpsReadout = document.querySelector('#fps-readout');
const backendNote = document.querySelector('#backend-note');
const gpuStatus = document.querySelector('#gpu-status');
const settingsPanel = document.querySelector('#settings-panel');
const backendPrompt = document.querySelector('#backend-prompt');
const fatalScreen = document.querySelector('#fatal-screen');
const fatalMessage = document.querySelector('#fatal-message');

const VIEWS = {
  front: new THREE.Vector3(0.65, 4.66, 18.85),
  left: new THREE.Vector3(-15.5, 4.68, 9.7),
  back: new THREE.Vector3(-0.4, 4.7, -18.9),
  right: new THREE.Vector3(15.6, 4.68, 9.6),
};

const DEFAULT_CAMERA = new THREE.Vector3(1.2, 4.74, 19.2);
const TARGET = new THREE.Vector3(0.08, 4.34, 0);

const RESOLUTIONS = {
  '900x1200': [900, 1200],
  '720x1280': [720, 1280],
  '1280x720': [1280, 720],
  '1920x1080': [1920, 1080],
  '1440x2560': [1440, 2560],
  '2560x1440': [2560, 1440],
  '2160x3840': [2160, 3840],
  '3840x2160': [3840, 2160],
};

const savedResolution = localStorage.getItem('yuukapa:resolution');
let resolutionKey = RESOLUTIONS[savedResolution] ? savedResolution : '900x1200';
let [renderWidth, renderHeight] = RESOLUTIONS[resolutionKey];
let currentBackend = PARAMS.get('backend');
let character = null;
let environment = null;
let renderer = null;
let scene = null;
let camera = null;
let controls = null;
let clock = null;
let currentIteration = 1;
let currentScore = 96;
let cameraTween = null;
let orbitWasAuto = false;
let toastTimer = null;
let firstFrameDone = false;

const scoreElement = document.querySelector('#score-value');
const iterationElement = document.querySelector('#iteration-value');
scoreElement.textContent = String(currentScore);
iterationElement.textContent = String(currentIteration).padStart(3, '0');

document.documentElement.style.setProperty('--stage-aspect', (renderWidth / renderHeight).toFixed(5));
resolutionReadout.textContent = `${renderWidth} × ${renderHeight}`;
backendReadout.textContent = (currentBackend || 'webgpu').toUpperCase();

updateResolutionSelection();
updateBackendSelection();
wireUI();

boot().catch((error) => {
  console.error(error);
  showFatal(error);
});

async function boot() {
  if (!currentBackend) {
    const gpu = await getWebGpuInfo();
    if (gpu.available) {
      currentBackend = 'webgpu';
    } else {
      backendReadout.textContent = 'AWAITING';
      gpuStatus.textContent = 'WebGPU unavailable — choose WebGL';
      showBackendPrompt();
      hideLoading();
      return;
    }
  }

  if (currentBackend !== 'webgpu' && currentBackend !== 'webgl') {
    showFatal(new Error(`Unknown renderer "${currentBackend}".`));
    return;
  }

  backendReadout.textContent = currentBackend.toUpperCase();
  updateBackendSelection();
  await initScene(currentBackend);
}

async function getWebGpuInfo() {
  if (!navigator.gpu) return { available: false, reason: 'This browser does not expose WebGPU.' };
  try {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return { available: false, reason: 'The browser did not return a GPU adapter.' };
    const info = adapter.info || {};
    const name = [info.vendor, info.architecture, info.device].filter(Boolean).join(' ');
    return { available: true, label: name || 'WebGPU adapter ready' };
  } catch (error) {
    return { available: false, reason: error?.message || 'The WebGPU adapter request failed.' };
  }
}

async function initScene(backend) {
  const mats = createMaterialLibrary();
  environment = createEnvironment(mats);
  scene = environment.scene;
  character = createCharacter(mats);
  scene.add(character.root);

  camera = new THREE.PerspectiveCamera(30, renderWidth / renderHeight, 0.1, 90);
  camera.position.copy(DEFAULT_CAMERA);

  clock = new THREE.Clock();

  progress(24);

  if (backend === 'webgpu') {
    let WebGPURenderer;
    try {
      ({ WebGPURenderer } = await import('three/webgpu'));
      renderer = new WebGPURenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      await renderer.init();
      progress(52);
    } catch (error) {
      console.error(error);
      backendReadout.textContent = 'WEBGPU ERROR';
      gpuStatus.textContent = 'WebGPU could not start';
      showBackendPrompt(error);
      hideLoading();
      return;
    }
  } else {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: PARAMS.has('capture'),
    });
    progress(52);
  }

  configureRenderer(backend);
  progress(70);

  controls = new OrbitControls(camera, canvas);
  controls.target.copy(TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.8;
  controls.panSpeed = 0.55;
  controls.minDistance = 10.5;
  controls.maxDistance = 30;
  controls.minPolarAngle = 0.38;
  controls.maxPolarAngle = 1.7;
  controls.autoRotateSpeed = 0.55;
  controls.autoRotate = false;
  controls.update();

  controls.addEventListener('start', () => {
    if (!cameraTween) setActiveView(null);
  });

  canvas.addEventListener('dblclick', resetView);
  wireCanvasGestures();

  renderer.setSize(renderWidth, renderHeight, false);
  progress(86);

  if (typeof renderer.compileAsync === 'function') {
    try {
      await renderer.compileAsync(scene, camera);
    } catch {
      // Compilation is an optimization; the first visible render still proves the pipeline.
    }
  }

  renderer.render(scene, camera);
  progress(100);
  firstFrameDone = true;

  requestAnimationFrame(() => {
    loading.classList.add('is-hidden');
  });

  setupDebugApi();
  updateGpuStatus(backend);
  startLoop(backend);
}

function configureRenderer(backend) {
  renderer.setPixelRatio(1);
  renderer.setSize(renderWidth, renderHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xcfe8ff, 1);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.dataset.backend = backend;
}

function startLoop(backend) {
  let frames = 0;
  let lastFpsUpdate = performance.now();
  let failed = false;

  const loop = () => {
    requestAnimationFrame(loop);
    if (failed) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    character.update(time);
    environment.update(time);
    updateCameraTween();

    if (!cameraTween && !controls.autoRotate) {
      controls.update();
    } else if (cameraTween) {
      controls.update();
    }

    try {
      renderer.render(scene, camera);
    } catch (error) {
      failed = true;
      console.error(error);
      showFatal(error, backend);
      return;
    }

    frames += 1;
    const now = performance.now();
    if (now - lastFpsUpdate > 600) {
      const fps = Math.round((frames * 1000) / (now - lastFpsUpdate));
      fpsReadout.textContent = `${fps} FPS`;
      frames = 0;
      lastFpsUpdate = now;
    }

    if (!firstFrameDone) {
      firstFrameDone = true;
      loading.classList.add('is-hidden');
    }
  };

  loop();
}

function updateCameraTween() {
  if (!cameraTween) return;
  const now = performance.now();
  const t = Math.min(1, (now - cameraTween.start) / cameraTween.duration);
  const eased = 1 - Math.pow(1 - t, 3);
  camera.position.lerpVectors(cameraTween.from, cameraTween.to, eased);
  camera.lookAt(TARGET);
  if (t >= 1) {
    cameraTween = null;
    controls.enabled = true;
    controls.autoRotate = orbitWasAuto;
    controls.update();
  }
}

function goToView(name) {
  const destination = VIEWS[name];
  if (!destination) return;
  orbitWasAuto = controls.autoRotate;
  controls.autoRotate = false;
  controls.enabled = false;
  cameraTween = {
    from: camera.position.clone(),
    to: destination.clone(),
    start: performance.now(),
    duration: 920,
  };
  setActiveView(name);
}

function resetView() {
  goToView('front');
  if (controls.autoRotate) {
    controls.autoRotate = false;
    document.querySelector('#orbit-toggle').checked = false;
    orbitWasAuto = false;
  }
  showToast('Camera reset to front');
}

function setActiveView(name) {
  document.querySelectorAll('.view-chip').forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.view === name);
  });
}

function wireUI() {
  document.querySelectorAll('.view-chip').forEach((button) => {
    button.addEventListener('click', () => goToView(button.dataset.view));
  });

  document.querySelector('#reset-view').addEventListener('click', resetView);

  const settingsButton = document.querySelector('#settings-button');
  const closeButton = document.querySelector('#settings-close');
  const doneButton = document.querySelector('#settings-done');

  settingsButton.addEventListener('click', () => {
    settingsPanel.showModal();
    settingsButton.setAttribute('aria-expanded', 'true');
  });

  const closeSettings = () => {
    if (settingsPanel.open) settingsPanel.close();
    settingsButton.setAttribute('aria-expanded', 'false');
  };

  closeButton.addEventListener('click', closeSettings);
  doneButton.addEventListener('click', closeSettings);
  settingsPanel.addEventListener('click', (event) => {
    if (event.target === settingsPanel) closeSettings();
  });
  settingsPanel.addEventListener('close', () => {
    settingsButton.setAttribute('aria-expanded', 'false');
  });

  document.querySelectorAll('#resolution-control button').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.resolution;
      if (!RESOLUTIONS[key] || key === resolutionKey) return;
      setResolution(key);
    });
  });

  document.querySelectorAll('#backend-control button').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.backend;
      if (target === currentBackend) return;
      switchBackend(target);
    });
  });

  document.querySelector('#orbit-toggle').addEventListener('change', (event) => {
    if (!controls) return;
    controls.autoRotate = event.target.checked;
    orbitWasAuto = event.target.checked;
    if (event.target.checked) setActiveView(null);
    showToast(event.target.checked ? 'Cinematic orbit enabled' : 'Cinematic orbit paused');
  });

  document.querySelector('#atmosphere-toggle').addEventListener('change', (event) => {
    if (!environment) return;
    for (const object of environment.atmosphere) object.visible = event.target.checked;
    showToast(event.target.checked ? 'Atmosphere restored' : 'Atmosphere muted');
  });

  document.querySelector('#prompt-webgl').addEventListener('click', () => {
    switchBackend('webgl', true);
  });

  document.querySelector('#prompt-retry').addEventListener('click', () => {
    switchBackend('webgpu', true);
  });

  document.querySelector('#fatal-webgl').addEventListener('click', () => {
    switchBackend('webgl', true);
  });
}

function switchBackend(target, forceReload = false) {
  if (target === 'webgpu' && !forceReload) {
    getWebGpuInfo().then((info) => {
      if (!info.available) {
        showBackendPrompt(new Error(info.reason), true);
        return;
      }
      reloadWithBackend(target);
    });
    return;
  }
  reloadWithBackend(target);
}

function reloadWithBackend(backend) {
  const url = new URL(window.location.href);
  url.searchParams.set('backend', backend);
  window.location.href = url.toString();
}

function showBackendPrompt(error = null, userInitiated = false) {
  if (!backendPrompt.open) backendPrompt.showModal();
  const title = document.querySelector('#backend-prompt-title');
  const copy = backendPrompt.querySelector('p');
  if (error) {
    title.textContent = userInitiated ? 'WebGPU could not be started.' : 'WebGPU isn’t available here.';
    copy.textContent = `Nothing will switch automatically. ${error.message || 'The graphics adapter rejected the request.'} Choose WebGL to continue, or retry WebGPU.`;
  } else {
    title.textContent = 'WebGPU isn’t available here.';
    copy.textContent = 'This showcase prefers WebGPU for its richer light transport. Nothing will switch automatically. Choose WebGL to continue with the compatibility renderer.';
  }
}

function showFatal(error, backend = currentBackend) {
  hideLoading();
  fatalMessage.textContent = `${error?.message || 'The graphics device rejected the renderer.'} · Renderer: ${String(backend).toUpperCase()} · ${renderWidth}×${renderHeight}`;
  fatalScreen.hidden = false;
  if (backendPrompt.open) backendPrompt.close();
}

function progress(percent) {
  loadingBar.style.width = `${percent}%`;
}

function hideLoading() {
  loading.classList.add('is-hidden');
}

async function setResolution(key) {
  const next = RESOLUTIONS[key];
  if (!next) return;
  resolutionKey = key;
  [renderWidth, renderHeight] = next;
  document.documentElement.style.setProperty('--stage-aspect', (renderWidth / renderHeight).toFixed(5));
  resolutionReadout.textContent = `${renderWidth} × ${renderHeight}`;
  updateResolutionSelection();
  localStorage.setItem('yuukapa:resolution', key);

  if (renderer) {
    renderer.setSize(renderWidth, renderHeight, false);
    camera.aspect = renderWidth / renderHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  showToast(`Render resolution · ${renderWidth} × ${renderHeight}`);
}

function updateResolutionSelection() {
  document.querySelectorAll('#resolution-control button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.resolution === resolutionKey);
  });
}

function updateBackendSelection() {
  document.querySelectorAll('#backend-control button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.backend === currentBackend);
  });
}

async function updateGpuStatus(backend) {
  if (backend === 'webgl') {
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'WebGL compatibility renderer';
    gpuStatus.textContent = String(gpu).slice(0, 54);
    backendNote.textContent = 'The scene never switches renderers by itself. WebGPU is available on supported browsers; switching reloads the scene.';
    return;
  }

  const info = await getWebGpuInfo();
  gpuStatus.textContent = info.available ? info.label.slice(0, 54) : 'WebGPU adapter ready';
  backendNote.textContent = 'WebGPU is active. The scene never falls back automatically; switching to WebGL requires an explicit reload.';
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function wireCanvasGestures() {
  let lastTap = 0;
  canvas.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch') return;
    const now = performance.now();
    if (now - lastTap < 310) {
      resetView();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  });
}

function setupDebugApi() {
  window.__YUUKAPA__ = {
    THREE,
    backend: currentBackend,
    renderer,
    scene,
    camera,
    controls,
    character,
    environment,
    resolution: () => [renderWidth, renderHeight],
    setView: goToView,
    setResolution,
    score: () => ({ iteration: currentIteration, score: currentScore }),
    setScore: (iteration, score) => {
      currentIteration = iteration;
      currentScore = score;
      scoreElement.textContent = String(score);
      iterationElement.textContent = String(iteration).padStart(3, '0');
    },
  };
  document.body.dataset.ready = 'true';
}
