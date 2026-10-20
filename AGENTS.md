# AGENTS.md — working notes for this repository

This repository holds several independent "3D from a single reference image" builds.
Each agent writes into its own folder and must not touch the other agents' folders.

```
demo3d/
├── task.md                     # the verbatim brief every agent works from
├── gpt6-astra_chatgpt_webgpu_reference-woman/   # previous agent (ChatGPT app)
├── deepseek411017/             # previous agent
├── glm53flashmax/              # previous agent
└── minimaxm31flash/           # ← this build (minimax-m3.1-flash / opencode)
    └── yuukapa_devtool/
```

---

## This build — `minimaxm31flash/yuukapa_devtool`

**Agent:** opencode · **Model:** minimax-m3.1-flash · **Tool:** web (three.js r186, WebGPU + WebGL 2)

### What it is
`Yuukapa` — a real-time, fully procedural 3D reconstruction of the anime girl in
`assets/reference.png` (halo, frilled headband + bow, long indigo mane, violet eyes,
light-blue cat-print pyjamas, scalloped bloomer hem, fluffy slippers, big pillow).

Everything — every vertex, every texture — is generated in code. No external assets.

### Layout
```
src/                     the viewer (ES modules, import-map → ../vendor/three)
  index.html             UI shell, settings panel, HUD (iteration + score, bottom-right)
  styles.css             glass UI, responsive down to phone width
  js/main.js             boot, URL params, capability probe, WebGPU→WebGL prompt
  js/core/app.js         renderer, scene, lights, camera rig, post FX, render loop
  js/core/ui.js          settings panel, capture (png / webm), modal
  js/core/meta.js        MODEL_NAME / ITERATION / SCORE shown in the HUD
  js/char/character.js   assembly + the pose (world-space bone aiming)
  js/char/head.js        sculpted skull + conforming face patch
  js/char/hair.js        scalp shell, bangs, side locks, 30-lock mane
  js/char/body.js        limbs, hands, feet, torso
  js/char/outfit.js      shirt, bloomer shorts with scalloped hem, collar, placket
  js/char/props.js       bow, headband, halo, pillow, slippers
  js/lib/geom.js         geometry toolkit (sweep, loft, sculpted patch, super-ellipsoid)
  js/lib/tex.js          all Canvas2D textures (anime face, cat print, fabric…)
  js/lib/mat.js          material library, toon ramps, rim shells, ink outlines
vendor/three/            three.js r186 (three.webgpu.js, three.core.js, three.tsl.js)
tools/                   dev harness: static server, headless capture, geometry tests
output/                  deliverables: showcase bundle, 60 s mp4, credit strip
```

### Run it
```bash
cd minimaxm31flash/yuukapa_devtool
node tools/serve.mjs            # http://localhost:8123
```

### Capture harness
```bash
node tools/shoot.mjs --out review/x --views front,three4,left,right,back --backend webgl
node tools/shoot.mjs --out review/x --views front --backend webgpu
node tools/uishot.mjs review/ui 1440 900        # full-page UI
node tools/showcaseshot.mjs review/showcase    # showcase build with credit bar
node tools/video.mjs 60 1280 1600 webgpu /output/yuukapa_showcase/src/index.html
```

### Validation tools (use these before declaring a visual change good)
* `tools/geomtest.mjs` — signed-volume test for `sweep()` / `loft()` winding.
  A negative volume means inverted normals (invisible shading bugs).
* `tools/normalcheck.mjs` — in-browser signed volume + normal direction per mesh.
* `tools/attrcheck.mjs` — every attribute count must match the position count.
* `tools/measure.mjs` — measures the reference PNG's regions for proportion checks.

### Hard-won lessons (read before touching the geometry)
1. **`sweep()` frames must be re-orthogonalised against the new tangent.**
   Without it the parallel-transport frame flips 180° on nearly-straight curves,
   which silently inverts limbs and shreds ribbons.
2. **Row order decides loft winding.** `loft()` auto-detects top→bottom vs
   bottom→top and flips the triangles; keep that behaviour.
3. **`computeVertexNormals()` must run last**, after caps/closed stitching are
   added, otherwise the normal buffer is shorter than the index range and
   WebGL reports "Vertex buffer is not big enough for the draw call".
4. **TSL `vec3(0xrrggbb)` splats the number** (→ white). Use `color(0xrrggbb)`.
5. **three's `toonOutlinePass` misbehaves with these meshes** — the project uses
   its own inverted-hull ink shells (CPU-expanded geometry, `addOutline`).
6. **A point light 10 cm from the hair blows it out** (inverse square). The halo
   glow is baked into the hair's vertex colours instead.
7. **Rim shells need an explicit flat-face normal** (`frameNormals`), otherwise
   tight loops (the bow) explode into shards.

### Rules that apply to every build in this repo
* Model the reference from the pixels — do not import any external asset.
* Default background is light blue; the HUD shows `ITER nn · SCORE nn/100`
  at the bottom-right of the preview UI.
* The model name must float above the 3D model in the viewport.
* Prefer WebGPU; if it is unavailable, **ask** the user before falling back to
  WebGL — never fall back silently.
* Default render resolution 900×1200, user-selectable up to 4K.
* When the window is narrower than 900 px, the canvas is shown at half width.
* Final deliverables: a showcase copy with a big white-on-black creator credit
  and a 60 s video of the work.

---

## Summary of the last task (minimax-m3.1-flash / opencode — Yuukapa)

**Goal:** rebuild the reference illustration as a real-time 3D character in the
browser, as close to the source as possible, with no borrowed assets.

**Result:** a 1.68 m stylised anime figure built from ~40 procedural meshes and
9 Canvas2D textures, rendered with a 4-step toon ramp, inverted-hull ink
outlines, fresnel rim shells and a painted face decal that conforms exactly to
the skull surface. A full settings panel offers WebGPU ⇄ WebGL 2 (with an
explicit prompt before any fallback), eight resolutions from 900×1200 to 4K,
eight camera presets, auto-orbit, idle animation, outlines/rim/shadow toggles
and PNG/webm capture. 60 fps at 900×1200 on both backends.

**Deliverables:** `output/yuukapa_showcase/` (self-contained copy with the
creator credit), `output/yuukapa_minimax-m31-flash_opencode_showcase.mp4`
(60 s turntable), `review/` (iteration stills and UI captures).

**Open threads for the next agent:** the pillow is still slightly too boxy, the
bow's loops could read more like fabric petals, and the mane could use a few
separated locks at the very bottom to match the reference's silhouette exactly.
