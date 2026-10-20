/**
 * main.js — entry point.
 * Boots the viewer, wires the UI and exposes a small automation
 * surface used by the headless capture harness.
 */
import { App } from './core/app.js';
import { UI } from './core/ui.js';
import { ITERATION, SCORE } from './core/meta.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const canvas = document.getElementById('view');
const boot = document.getElementById('boot');

const app = new App(canvas);
let ui = null;

/* ── automation surface ───────────────────────────────────── */
window.__yuukapa = {
  ready: false,
  app,
  setView: (v) => app.setView(v),
  info: () => app.info(),
  setBackend: async (b) => { await app.rebuild(b); },
};

async function boot3D() {
  const caps = await App.probe();
  app.capabilities = caps;

  const want = params.get('backend');
  let backend = 'webgl';
  if (want === 'webgpu' && caps.webgpu) backend = 'webgpu';

  if (want === 'webgpu' && !caps.webgpu) {
    // never fall back silently — ask the user
    ui = ui || new UI(app);
    ui.setBackendUI('webgpu');
    ui.setBackendHint('WebGPU is unavailable here — choose a backend.');
    ui.disableBackend('webgpu');
    boot.classList.add('gone');
    ui.showModal(
      'WebGPU is unavailable',
      `${caps.reason || 'This browser does not expose navigator.gpu.'} ` +
      'Start with the WebGL 2 backend?',
      async () => { await start('webgl'); }
    );
    return;
  }

  await start(backend);
}

async function start(backend) {
  try {
    await app.init(backend);
  } catch (e) {
    console.error('[yuukapa] init failed', e);
    boot.querySelector('.boot-sub').textContent = 'failed: ' + e.message;
    boot.querySelector('.boot-title').textContent = 'Error';
    return;
  }

  if (!ui) ui = new UI(app);
  ui.setBackendUI(backend);
  if (!app.capabilities.webgpu) {
    ui.disableBackend('webgpu');
    ui.setBackendHint('WebGPU is not available in this browser — running on WebGL 2.');
  } else {
    ui.setBackendHint('WebGPU ready · WebGL 2 fallback available.');
  }

  /* resolution */
  const res = params.get('res');
  let w = 900, h = 1200;
  if (res && /^\d+x\d+$/.test(res)) {
    [w, h] = res.split('x').map(Number);
  }
  app.setResolution(w, h);
  const resBtn = [...document.querySelectorAll('#resGrid .res-btn')]
    .find((b) => b.dataset.res === `${w}x${h}`);
  ui.markRes(resBtn || document.querySelector('#resGrid .res-btn'));

  /* view */
  const view = params.get('view');
  if (view) {
    app.setView(view, true);
    ui.markViewByName(view);
  }

  /* feature overrides for automated capture */
  if (params.get('outline') === '0') { app.options.outline = false; }
  if (params.get('rim') === '0') { app.options.rim = false; app.setRimVisible(false); }
  if (params.get('shadows') === '0') { app.options.shadows = false; }
  if (params.get('anim') === '0') { app.options.animate = false; }
  if (params.get('fov')) { app.options.fov = Number(params.get('fov')); }
  const hide = params.get('hide');
  if (hide) {
    const map = {
      hair: () => { app.character.hair.visible = false; },
      outfit: () => { const o = app.character.rig.root.getObjectByName('outfit'); if (o) o.visible = false; },
      mane: () => { app.character.hair.children.forEach((c) => { if (c.name.startsWith('mane')) c.visible = false; }); },
      bangs: () => { app.character.hair.children.forEach((c) => { if (c.name.startsWith('bang')) c.visible = false; }); },
      pillow: () => { app.character.pillow.visible = false; },
      halo: () => { app.character.halo.visible = false; },
      headband: () => { app.character.headband.visible = false; },
      bow: () => { app.character.bow.visible = false; },
      arms: () => { app.character.rig.arms.L.shoulder.visible = false; app.character.rig.arms.R.shoulder.visible = false; },
      legs: () => { app.character.rig.legs.L.hip.visible = false; app.character.rig.legs.R.hip.visible = false; },
      body: () => { app.character.rig.torso.visible = false; },
    };
    for (const k of hide.split(',')) if (map[k]) map[k]();
  }

  /* hud */
  $('iterTag').textContent = 'ITER ' + String(ITERATION).padStart(2, '0');
  $('scoreTag').textContent = 'SCORE ' + SCORE + '/100';
  if (params.get('hud') === '0') {
    document.getElementById('hud').style.display = 'none';
    document.getElementById('topbar').style.display = 'none';
  }
  if (params.get('cine') === '1') {
    app.options.cine = true;
    document.getElementById('hud').style.display = 'none';
    document.getElementById('topbar').style.display = 'none';
    app.setView('three4', true);
  }

  app.applyOptions();
  app.setOutlineVisible(app.options.outline);
  app.setRimVisible(app.options.rim);
  app.start();
  await app.frame();

  boot.classList.add('gone');
  window.__yuukapa.ready = true;

  setInterval(() => ui.setHud(app.fps, app.backend), 400);
}

window.addEventListener('resize', () => {
  app.resize();
});

boot3D();
