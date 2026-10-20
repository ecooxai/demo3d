/**
 * ui.js — the settings panel, readouts, capture tools and the
 * WebGPU availability prompt.
 */
import { VIEWS } from './app.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(app) {
    this.app = app;
    this.toastTimer = null;
    this.recorder = null;
    this.bind();
  }

  bind() {
    const app = this.app;

    /* ── panel ── */
    $('gearBtn').addEventListener('click', () => this.togglePanel());
    $('panelClose').addEventListener('click', () => this.togglePanel(false));

    /* ── backend ── */
    this.backendBtns = [...document.querySelectorAll('#backendSeg .seg-btn')];
    this.backendBtns.forEach((b) => b.addEventListener('click', () => {
      this.requestBackend(b.dataset.backend);
    }));

    /* ── resolution ── */
    this.resBtns = [...document.querySelectorAll('#resGrid .res-btn')];
    this.resBtns.forEach((b) => b.addEventListener('click', () => {
      const [w, h] = b.dataset.res.split('x').map(Number);
      this.setResolution(w, h);
      this.markRes(b);
    }));

    $('orient').addEventListener('change', (e) => {
      const v = e.target.value;
      let w = app.resW, h = app.resH;
      if (v === 'vertical' && w > h) { const t = w; w = h; h = t; }
      if (v === 'landscape' && h > w) { const t = w; w = h; h = t; }
      this.setResolution(w, h);
    });

    /* ── camera views ── */
    this.viewBtns = [...document.querySelectorAll('#viewGrid button')];
    this.viewBtns.forEach((b) => b.addEventListener('click', () => {
      app.setView(b.dataset.view);
      this.markView(b);
    }));

    /* ── toggles ── */
    const toggle = (id, fn) => {
      const el = $(id);
      el.addEventListener('change', () => fn(el.checked));
    };
    toggle('autoRotate', (v) => { app.options.autoRotate = v; });
    toggle('anim', (v) => { app.options.animate = v; });
    toggle('outline', (v) => app.setOutlineVisible(v));
    toggle('rim', (v) => app.setRimVisible(v));
    toggle('shadows', (v) => { app.options.shadows = v; app.applyOptions(); });

    const fov = $('fov');
    fov.addEventListener('input', () => {
      app.options.fov = Number(fov.value);
      $('fovOut').textContent = fov.value + '°';
      app.applyOptions();
    });

    /* ── capture ── */
    $('shotBtn').addEventListener('click', () => this.screenshot());
    $('recBtn').addEventListener('click', () => this.toggleRecord());

    /* ── keyboard ── */
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const keys = Object.keys(VIEWS);
      if (e.key === 's' || e.key === 'S') this.togglePanel();
      if (e.key >= '1' && e.key <= '8') {
        const name = keys[Number(e.key) - 1];
        if (name) { app.setView(name); this.markViewByName(name); }
      }
      if (e.key === 'p' || e.key === 'P') this.screenshot();
    });
  }

  togglePanel(force) {
    const p = $('panel');
    const open = force === undefined ? !p.classList.contains('open') : force;
    p.classList.toggle('open', open);
  }

  markRes(btn) { this.resBtns.forEach((b) => b.classList.toggle('active', b === btn)); }
  markView(btn) { this.viewBtns.forEach((b) => b.classList.toggle('active', b === btn)); }
  markViewByName(name) {
    this.viewBtns.forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  }

  setResolution(w, h) {
    this.app.setResolution(w, h);
    this.resBtns.forEach((b) => {
      const [bw, bh] = b.dataset.res.split('x').map(Number);
      b.classList.toggle('active', bw === w && bh === h);
    });
  }

  setBackendUI(active) {
    this.backendBtns.forEach((b) => b.classList.toggle('active', b.dataset.backend === active));
  }

  setBackendHint(text) { $('backendHint').textContent = text; }

  disableBackend(name) {
    const b = this.backendBtns.find((x) => x.dataset.backend === name);
    if (b) { b.disabled = true; b.title = 'Not available in this browser'; }
  }

  /**
   * Switching to WebGPU when it is unavailable must ask first —
   * the app never silently drops to another backend.
   */
  requestBackend(name) {
    const app = this.app;
    if (name === app.backend) return;
    if (name === 'webgpu' && !app.capabilities.webgpu) {
      this.showModal(
        'WebGPU is unavailable',
        `${app.capabilities.reason || 'This device does not support WebGPU.'} ` +
        'Switching to the WebGL 2 backend instead?',
        () => this.switchBackend('webgl')
      );
      return;
    }
    this.switchBackend(name);
  }

  async switchBackend(name) {
    const app = this.app;
    this.toast(`Switching to ${name === 'webgpu' ? 'WebGPU' : 'WebGL 2'}…`);
    await app.rebuild(name);
    this.setBackendUI(name);
    this.toast(name === 'webgpu' ? 'WebGPU backend active' : 'WebGL 2 backend active');
  }

  showModal(title, body, onOk) {
    const m = $('modal');
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = body;
    m.hidden = false;
    const close = () => { m.hidden = true; };
    $('modalOk').onclick = () => { close(); onOk && onOk(); };
    $('modalCancel').onclick = close;
  }

  toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
  }

  /* ── capture ────────────────────────────────────────────── */
  async screenshot() {
    const app = this.app;
    try {
      await app.frame();
      const url = app.canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `yuukapa_minimax-m31-flash_opencode_${app.resW}x${app.resH}_${stamp}.png`;
      a.href = url;
      a.click();
      this.toast('Screenshot saved');
    } catch (e) {
      this.toast('Screenshot failed: ' + e.message);
    }
  }

  async toggleRecord() {
    if (this.recorder) { this.stopRecord(); return; }
    const app = this.app;
    try {
      const stream = app.canvas.captureStream(30);
      const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
        .find((m) => MediaRecorder.isTypeSupported(m));
      if (!mime) { this.toast('Recording is not supported here'); return; }
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12e6 });
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = 'yuukapa_minimax-m31-flash_opencode_showcase.webm';
        a.href = url;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        this.toast('Clip saved');
      };
      rec.start(250);
      this.recorder = rec;
      this.recStart = performance.now();
      $('recBtn').textContent = 'Stop recording';
      $('recBtn').classList.add('rec');
      $('record').hidden = false;
      this.recTimer = setInterval(() => {
        const s = Math.floor((performance.now() - this.recStart) / 1000);
        $('recTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }, 250);
      this.toast('Recording started');
    } catch (e) {
      this.toast('Recording failed: ' + e.message);
    }
  }

  stopRecord() {
    if (!this.recorder) return;
    this.recorder.stop();
    this.recorder = null;
    clearInterval(this.recTimer);
    $('recBtn').textContent = 'Record 60s';
    $('recBtn').classList.remove('rec');
    $('record').hidden = true;
  }

  setHud(fps, backend) {
    $('fps').textContent = fps;
    $('backendTag').textContent = backend === 'webgpu' ? 'WebGPU' : 'WebGL 2';
  }
}
