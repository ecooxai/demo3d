# Jaw 155 — focused interface audit handoff

## Status and native command

**Frozen for root-only native execution.** The local source and small accelerator checks pass. Actual scene contacts and attachment findings are pending; artistic adoption remains conditional, with the accepted overall score at **78/100**.

From the existing project directory on the Mac, with the ordinary preview server running:

```bash
node review/jaw155-interface-native.mjs
```

The wrapper uses the existing Chrome installation and `http://127.0.0.1:8766/`. `CHROME_PATH` and `PORTRAIT_URL` remain optional overrides. It writes `output/qa/jaw155-interface-native.json`, saves intermediate findings, and closes the page and browser in `finally`. No Mac or native browser execution was performed by this author.

## Exact scope

One fresh page runs the live accepted 149 preparation, then the frozen 155 helper once after accepted 147. The two retained original face/neck geometries are OFF; the wholly private replacements are ON under exactly the same world matrices. The display remains native WebGPU, Neutral tone mapping 1.4, 900 × 1200, AA2. There is no extra `compileAsync`, screenshot sweep, material change, or per-frame work.

- Triangle contacts use only actually changed finite face/neck triangles and fixed ear, eye, hair or cloth triangles whose world bounds overlap the affected region. A typed-array BVH narrows candidates; one unchanged obstacle mesh is transformed at a time. The full groom is not copied into a triangle soup.
- The endpoint contact threshold is `1e-8` world units. Reported near distances are unsigned and restricted to the `0.001` search window. They are **not penetration depths** or global minimum clearances. Inherited degenerate triangles are counted and excluded.
- Every new/removed triangle-pair identity is retained. All changed pairs contribute photo-space bins using an actual intersection or closest-point witness. At most 12 spatially distinct examples per row are stored; examples do not certify complete burial. Alpha/culling flags are recorded without removing geometry from contact counts.
- Every fixed ear vertex receives an outward head-X support query. The chart `[headY, side·headZ, side·headX]` selects the outermost front-facing face depth. Positive offsets indicate outward displacement relative to this directional support. Baseline candidates inside or within `0.005` world units are tracked through finite separation **and separately through a missing AFTER hit**. The latter has counts, bins and examples, without an invented infinite gap.
- Face-only rays use the exact existing 155 detail and jaw-oblique camera directions. Nearest front-facing hits are labeled ahead, coincident, behind or missing. Ear self-occlusion, hair, alpha coverage, lighting and pixel visibility are excluded. This is a sampled face-support/occlusion diagnostic, not whole-scene visibility or a continuous anatomical-weld proof.

The common-field face/neck pair is not retested: both received the same already-verified world map. The existing native 155 orientation/shape results remain separate evidence. No repeated field certificate, normal/map suite, broad contact gate, or 14-view collection is added. Newly exposed far-ear support is the concrete pending risk; new pair counts alone are not an automatic rejection.

## Ownership and resource lifetime

The audit preserves all 64 original mesh bindings, material slots, flags, local transforms and world matrices. Data checks cover the selected position/normal/index attributes and obstacle position/index attributes needed for this audit. Exact logical index values may undergo only the known native Uint16/Uint8 → Uint32 storage widening; original detached-array bytes remain protected.

Both replacements own every attribute and index. Their **7,704,240 pre-upload bytes are replacement storage**, not a claim of permanent GPU growth. This QA retains the two old geometries for comparison; preparation occurs before first upload, so those originals are not simultaneously uploaded merely for measurement. Audit-owned spatial buffers are CPU-only and separately report peak/total bytes, held-buffer count and observed heap. JavaScript object overhead and renderer memory are explicitly outside the typed-array ledger.

After measurement, the spatial buffers are dropped. Original bindings are restored before private geometry disposal, the restored source follows the ordinary render/upload path, and QA listeners, arrays, sets and source references are released. No original resource may be disposed. JSON findings alone remain available for reporting. The frozen production helper defaults to `retainSourceForQA: false`; this wrapper's temporary retention is not a production requirement.

## Provenance and local validation

The native wrapper requires main SHA `a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521` and the verified actual 155 report, 337,654 bytes, SHA `e9f57d86ea02ea24d5271a71f516f4e5b0266e95eaa6b057b6877f254da0921a`. All 35 selected production/reference/package and frozen 155 dependencies match that report locally. It records the bundled dependency hashes again during native execution.

Four new JavaScript files pass syntax parsing. The small deterministic check covers 21 BVH queries against brute-force box selection, five front-facing projection cases, the previously omitted missing-AFTER-support branch, and five known triangle-contact/witness cases. It constructs no portrait fixture and reruns none of the 155 field/material tests. The tracked temporary typed arrays are fully released. `jaw155-interface-local-check.json` records these local results and source hashes.

Quality42's independent narrow review confirmed the support/ray axes and normal-path restoration/cleanup. Its missing-AFTER-hit finding is corrected and exercised by the dedicated small test.

## Transfer inventory

Transfer the three new runtime files: `jaw155-interface-native.mjs`, `jaw155-interface-qa.js`, and `jaw155-interface-geometry.js`. Existing dependencies are the frozen 155 candidate/field/config, `near-ear144-geometry.mjs`, the verified actual 155 native report, and the unchanged project dependencies. The local checker/report and this handoff are review evidence only.

`jaw155-interface-manifest.json` contains exact byte counts and SHA-256 values for these files and all 35 guarded dependencies. Production and frozen 155 files were not edited.
