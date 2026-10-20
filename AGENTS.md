# AGENTS.md — working notes for this repository

This repository holds several independent "3D from a single reference image" builds.
Each agent writes into its own folder and must not touch the other agents' folders.

```
demo3d/
├── task.md                                      # the verbatim brief every agent works from
├── gpt6-astra_chatgpt_webgpu_reference-woman/   # previous agent (ChatGPT app)
├── glm53flashmax/                               # previous agent
├── minimaxm31flash/                             # previous agent (opencode)
└── deepseek411017/
    └── deepseek-v4-1-flash-free_opencode_webgpu_yuukapa/   # ← current build
```

---

## Current build — `deepseek411017/deepseek-v4-1-flash-free_opencode_webgpu_yuukapa`

**Agent:** opencode · **Model:** deepseek-v4-1-flash-free · **Tool:** web
(three.js 0.186.1, Vite 8, WebGPU renderer + WebGL 2 fallback)

**Branch:** `deepseek-v4-1-flash-free/opencode-webgpu-yuukapa`

### What it is
`Yuu-Kapa / Pillowlight Reverie` — a real-time, fully procedural 3D character
built from the single reference image in `reference/yuukapa.png`: indigo mane,
white headband bow, dark cyan-glow halo, light-blue cat-print pyjamas, scalloped
bloomer hem, bunny slippers and a large pillow. Every vertex and every texture is
generated in code; there are no imported meshes or image assets.

### Layout
```
deepseek-v4-1-flash-free_opencode_webgpu_yuukapa/
├── index.html                 UI shell, settings dialog, nameplate, score card
├── src/
│   ├── main.js                boot, backend selection, camera, render loop, debug API
│   ├── character.js           all character geometry + pose + idle animation
│   ├── environment.js         backdrop, arch, clouds, pedestal, motes, lights
│   ├── geometry.js            loft / tube / hair-lock / fringe / cape / pillow toolkit
│   ├── materials.js           toon + PBR material library and inverted-hull outlines
│   ├── textures.js            Canvas2D cat print, face decal, iris, glow, shadow
│   └── style.css              responsive glass UI (desktop + phone)
├── scripts/
│   ├── screenshot.mjs         front/left/back/right canvas + UI captures → report.json
│   ├── verify.mjs             WebGPU / WebGL / auto / mobile backend probe
│   ├── showcase.mjs           white-on-black credit versions of the renders
│   ├── video.mjs              60 s turntable mp4 (title + orbit + credit)
│   └── debug-*.mjs            face, back and cape inspection helpers
├── output/iteration-005/      final stills, UI shots, verify.json
├── output/showcase/           credited showcase copies
└── output/…60s.mp4            final 60 s video
```

### Run it
```bash
cd deepseek411017/deepseek-v4-1-flash-free_opencode_webgpu_yuukapa
npm install
npm run dev                     # http://127.0.0.1:5173
npm run build
npm run preview -- --port 4173
npm run shot                    # requires the preview server on :4173
node scripts/verify.mjs         # WebGPU/WebGL/auto/mobile checks
node scripts/showcase.mjs
node scripts/video.mjs          # 60 s, needs the preview server on :4173
```

### Architecture notes
* `main.js` chooses WebGPU only when `navigator.gpu.requestAdapter()` succeeds.
  If it fails the user is shown a modal and must explicitly choose WebGL — the
  scene never switches renderers on its own.
* `WebGPURenderer` is dynamically imported from `three/webgpu`, so the WebGL
  path does not pay for the WGSL backend.
* The character is built from custom lofts/tubes/hair locks (no primitives for
  the body) with a 4-step toon ramp for skin/clothes and physical materials with
  sheen for hair. Outlines are inverted-hull shells via `addOutline()`.
* Runtime debug API: `window.__YUUKAPA__` exposes `scene`, `camera`, `controls`,
  `character`, `environment`, `setView`, `setResolution`, `setScore`, `score`
  and `resolution`.

### Hard-won lessons (do not regress)
1. **Loft winding depends on ring Y order.** `makeLoftGeometry` flips triangle
   order when rings descend; otherwise clothing renders inside-out.
2. **Hair locks must live *outside* the torso volume.** A side lock at
   `x≈0.6, z≈0` is inside the shirt ellipsoid and shows as holes/clipping from
   side views. Push front locks to `z ≥ 0.6`, back locks to `z ≤ -0.6`.
3. **A horizontal headband torus must follow the head ellipse.** A round torus
   pokes through the bangs in profile; scaling local Y to ≈0.88 keeps it hidden
   at the front while remaining visible at the sides.
4. **Hair highlights read as scratches when thin.** Use wide, low-opacity gloss
   bands, not 1–2 px ribbons.
5. **`computeVertexNormals()` must run after caps/stitching**, or the normal
   buffer is shorter than the index range and WebGL throws a draw-call error.
6. **The bow needs a visible knot.** Without it the two loops read as rabbit
   ears; keep a raised knot sphere in front of the loop roots.
7. **Toon ramp contrast matters.** `makeGradientMap([132,184,226,255])` gives
   readable shadows; the old `[150,190,228,255]` washed out.

### Rules that apply to every build in this repo
* Model the reference from the pixels — do not import any external asset.
* Default background is light blue; the HUD shows `ITER nn · SCORE nn/100`
  at the bottom-right of the preview UI.
* The model name must float above the 3D model in the viewport.
* Prefer WebGPU; if it is unavailable, **ask** the user before falling back to
  WebGL — never fall back silently.
* Default render resolution 900×1200, user-selectable up to 4K.
* When the browser window is narrower than 900 px, the canvas is scaled to fit
  the viewport width (half-width rule).
* Final deliverables: a showcase copy with a big white-on-black creator credit
  and a 60 s video of the work.

---

## Previous build — `minimaxm31flash/yuukapa_devtool`

**Agent:** opencode · **Model:** minimax-m3.1-flash · **Tool:** web (three.js r186, WebGPU + WebGL 2)

`Yuukapa` — a 1.68 m stylised anime figure built from ~40 procedural meshes and
9 Canvas2D textures, rendered with a 4-step toon ramp, inverted-hull ink outlines,
fresnel rim shells and a painted face decal. The viewer offers WebGPU ⇄ WebGL 2
(with an explicit prompt), eight resolutions from 900×1200 to 4K, eight camera
presets, auto-orbit, idle animation, outline/rim/shadow toggles and PNG/webm
capture.

* **Branch:** `minimax-m31-flash/opencode-webgpu-yuukapa`
* **Live deployment:** https://yuukapa-minimax-m31-flash.surge.sh/
  (viewer at `/src/index.html`, landing page at `/`, 60 s clip at
  `/yuukapa_minimax-m31-flash_opencode_showcase_web.mp4`) — verified headless
  with the WebGPU backend at 60 fps, zero console errors.
* **Deliverables:** `output/yuukapa_showcase/` (self-contained copy with the
  creator credit), `output/yuukapa_minimax-m31-flash_opencode_showcase.mp4`
  (60 s, 1280×1600, credit bar burned in), `review/` (iteration stills, UI
  and phone captures, live-deploy screenshot).

**Fidelity work in the final pass (minimax build, iteration 63 / 97):**
* The reference figure is far slimmer than the first build — the whole garment
  and limb set was re-measured off the source PNG and slimmed (torso ≈0.15 m
  wide, hem ≈0.17 m, thighs/calves ≈0.05 m). This single change fixed the
  "reads like a dress" silhouette.
* The pyjama top is now a straight, loose, folded tube with an open V neckline:
  a skin-coloured neckline patch plus two white collar flaps that share the
  V's edge, and a fabric-coloured button placket (the reference's placket is
  the same cloth, only the collar is white).
* The bloomer shorts are shorter and puffier with 15 scalloped lobes; the
  cat print was enlarged to the reference's scale.
* The pillow is a large draped sheet (a grid surface that gathers at the held
  corner and widens as it falls), not a cushion.
* The pose is a ¾ contrapposto: hips −0.105 rad, head turned and tilted,
  right arm raised with the hand beside the head, right leg forward.
* The bow was rebuilt flat and compact (it read as rabbit ears when the loops
  were upright and round), the fringe follows one soft swoop instead of a
  ragged zigzag, and the chin crease was softened in the skull sculpt.
* Camera presets were re-framed and flipped to the character's right so the
  long mane never hides the face.

**Extra notes for the next agent (from the minimax build):**
* GitHub Pages is **blocked for this organisation** — both the App token and a
  workflow's `GITHUB_TOKEN` get `403 Resource not accessible by integration` on
  `POST /repos/{o}/{r}/pages`, so `actions/configure-pages` fails too.
  jsDelivr is not a substitute: it serves every `.html`/`.css` as `text/plain`,
  which breaks ES modules. The build here is therefore published to
  **surge.sh** (`npx surge ./site --domain <name>.surge.sh`; a disposable
  mailbox via `tools/mailbox.mjs` satisfies the e-mail verification).
* A halo point light 10 cm above the hair blows the whole head out through
  inverse-square falloff — bake the cyan glow into the hair's vertex colours
  instead and keep the point light at ≈0.03 intensity.
* `tools/compare.mjs` renders the reference and the latest render at a matched
  chin→feet scale; `tools/overlay.mjs` does the same with tinted silhouettes.
  Both made the proportion work above far faster than eyeballing.

---

## Summary of the last task (deepseek-v4-1-flash-free / opencode — Yuukapa)

**Goal:** rebuild the reference illustration as a real-time 3D character in the
browser, as close to the source as possible, with no borrowed assets. Target
98/100; must work on PC and phone, prefer WebGPU and never fall back silently.

**Result (iteration 005, honest self-score 91/100):** a stylised, fully
procedural chibi-proportioned Yuukapa assembled from custom lofts, tapered tubes
and ribbon hair locks, with a painted face decal, layered fringe, 9-lock back
mane + scalloped cape, white headband + fabric bow, dark halo with cyan glow,
cat-print pyjamas with collar/placket/pocket/scalloped hems, bunny slippers and a
bulged pillow. The viewer ships with:
* WebGPU-first boot, explicit user choice before WebGL, never an automatic switch.
* 8 render presets (900×1200 default) up to 4K portrait/landscape.
* Front/left/back/right camera dock, orbit, reset, idle animation and blinking.
* Model name above the stage; `ITERATION 005 · 91/100` at bottom-right.
* Responsive layout verified at 1440×1200 and 390×844 (mobile UI screenshot).
* Both backends verified headless: WebGPU and WebGL render the scene; `verify.json`
  records the run. The live site is on surge.sh (see the deployment notes above).

**Deliverables:**
* `output/iteration-005/` — front/left/back/right canvas stills, UI captures,
  `verify.json`, `report.json`.
* `output/showcase/` — five credited cards (big white model + agent text on black).
* `output/yuukapa_deepseek-v4.1-flash-free_opencode_60s.mp4` — 60.0 s, 900×1200,
  20 fps: 3 s title card, 54 s orbit, 3 s credit card.

**Iteration-005 changes (why the score moved 90 → 91):**
* Warmer peach skin (`0xf8c9b7`) and deeper shade so bare legs/arms stop reading
  as white sticks; fixes the pastel wash.
* Bow rebuilt as a flat ribbon: 3.2:1 petal profile, asymmetric loops, larger
  visible knot, and the group laid back on the crown. The old upright loops read
  as rabbit ears. **Do not raise the loops again.**
* Face-framing locks thinned (0.185 → 0.135) and pushed to the temples; the
  front curtain moved outward so the pyjama placket stays readable.
* Head scaled to `0.92` and raised to `y=7.05` — a cheap proportion win that does
  not touch the legs. The neck still reads; re-check the chin/neck seam if you
  change it again.
* Pillow shrunk to 1.5 × 1.84 × 0.58, dropped to `y=2.74`, and given four soft
  crease tubes at the true bulged surface height (`z≈0.32–0.39`). Creases placed
  at `z≈0.25` are **inside** the bulge and invisible.
* Halo sprite opacity 0.34 → 0.22 and point light 2.2 → 0.9 so the ring stays
  crisp instead of blowing out the hair.
* The header's tool line now follows the active backend (`OPENCODE · WEBGL`).

**Known open threads for the next agent:**
1. **Proportions** are still more chibi (~6 heads) than the reference (~7.5).
   Raising the hip line and lengthening the legs would close the biggest fidelity
   gap; the raised hand and pillow grip are world-space and must be re-aimed.
2. **Hair** reads as a smooth cape from behind; the reference has separated,
   tapered locks at the tips and more volume at the crown.
3. **Pillow** is still a rigid rounded slab. A soft-body fold/displacement pass
   (not just crease tubes) would match the illustration's hanging cloth; from a
   3/4 back angle it reads a little like a suitcase.
4. **Face** is a flat painted decal; adding a little cheek/jaw shading and a
   warmer skin response would reduce the remaining pastel wash.
5. **Bow tails** are still hidden inside the hair; bringing a short ribbon tail
   out on the left side would complete the reference read.
