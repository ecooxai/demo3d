# Candidate159 — coherent jaw and ear field

## Decision state

Ready for one root-only native OFF/ON pair on accepted157. Current score remains **78/100**. Candidate159 has not been rendered or artistically accepted. Production and every frozen155 file are unchanged.

The selected155 jaw taper improved the silhouette, but its fixed far ear lost part of its authored face support. In the actual155 interface report, 257 of 1,159 baseline right-ear attachment samples left the 0.005 directional band, with a maximum after offset of 0.05297406068; the left ear had no released samples. These are directional support measurements, not signed shortest gaps or proof that the whole ear detached. The report and the visible extra far-ear edge justify checking a coherent repair before adopting the jaw. See `review/jaw155-interface-interpretation.md` and verified `review/jaw155-interface-native.json` (196,999 B, SHA256 `c93dd09eb540dd607bf806cda86434d5c103da50083c50f6b80079d44b07c132`).

## Exactly what changes

`applyJawEar159(model,{strength:1,retainSourceForQA:false})` calls the **unchanged frozen155 applier** for continuous-face and neck, then installs two fully private ear geometry copies deformed by the identical field. It uses each actual post115/147 mesh matrix and the field's analytic inverse transpose. It changes only positions and authored normals on these four meshes. The same geometric correspondence drives every ear vertex; there is no root-row warp, filler, extra surface or new population.

World Z and photo Y remain fixed within the existing Float32 roundoff bounds. All inactive positions/normals are copied exactly, including unused zero normals. UV0, vertex colors, topology, material bindings, maps and all other meshes remain unchanged. The existing147 eye geometry,151 eyelashes,140 lips,154 cotton,133 fringe and141 crown material are preserved.

The two ears are staged on the unmodified157 scene before the frozen155 helper runs. Both field constructions therefore use the same current mouth bounds. Face/neck output is checked against **all ten actual selected155 private attribute hashes**, with only the established exact-value index-storage widening exception. Twenty original selected attribute records independently guard the four source meshes.

Call159 once after accepted151 inside the existing cached preparation, before the first renderer upload. The review wrapper injects precisely after `state.eyelash151=applyEyelash151(anatomicalHead,{strength:1});`; it does not modify or reorder157 preparation. The helper is WeakMap cached and returns the identical metrics object on a repeated same-strength call. The approved study is OFF/ON only.

## Certificate and discrete risk

The runtime imports the exact native-tested155 helper, field, configuration and orientation audit. It reuses the actual155 full-support certificate and requires the current mouth bounding box and analytic lower bound to match. The native155 report is 337,654 B with SHA256 `e9f57d86ea02ea24d5271a71f516f4e5b0266e95eaa6b057b6877f254da0921a`. The analytic determinant lower bound is 0.480248525624963; the existing grid-based certified lower bound is about 0.58641, with world displacement upper below 0.095463. **The grid is not rerun.**

A common injective map preserves the continuously mapped relationship. Applying the map only at existing vertices leaves a separate risk in linearly emitted triangles. The native pair therefore checks actual ear triangle area/orientation and geometric-normal agreement, separately from authored normal transport. It does not repeat the already selected face/neck field or full-scene geometry sweep.

The focused interface audit checks both moving ears against each unchanged groom mesh and against the co-moving face. It filters to pairs where at least one actual triangle changes and uses before/after bounds. It records inherited/new/removed contact identities, all new witness-location photo bins and up to twelve diverse witness examples. Unsigned triangle distance is labeled as such; it is not penetration depth. Contact counts are not gated to zero.

The lateral support query follows each ear vertex: BEFORE face at BEFORE ear coordinates; AFTER face at AFTER ear coordinates. It uses union bounds, nearest outward-facing directional hits, and explicit baseline-supported samples whose AFTER face hit is missing. It does not reuse155's fixed-ear sample coordinates. Axial offsets, a sampled 0.005 band and limited examples do not certify a continuous weld or global burial. No material alpha or culling assumption removes a reported contact. The ordinary and close views still determine visible attachment and fixed-hair regressions.

## Ownership and cost

All four temporary geometries own every attribute and index buffer, including UV/color buffers. No live source buffer is disposed through a temporary geometry. In QA mode, release first restores both ear bindings; the frozen155 release then restores both face/neck bindings before its first disposal; only then are the ear copies disposed. Thus all four originals are installed before any private dispose event. The native guard also checks all 64 mesh bindings, source bytes, texture references, accepted preparation identities and disposal events. Exact-value Uint16/Uint8 index widening to Uint32 is separately recorded; detached original bytes remain protected.

The actual155 source inventory gives **8,295,776 B** of replacement attributes before upload: 7,704,240 B face/neck plus 591,536 B ears. Expected native index widening adds 168,960 B, yielding 8,464,736 B of replacement attribute storage. These are estimates pending the actual159 report, and they are **replacement sizes**, not equal permanent CPU/GPU increases. The QA page temporarily retains 8,295,776 B of old attributes to make comparison/restoration reviewable. There are no initial old-buffer GPU uploads before159 because injection precedes first rendering. The production default adds no original geometry references to159's cache; existing unrelated caches and renderer overhead are outside these counts.

No texture, draw, vertex, index or per-frame work is added. The one-time interface audit reports its own typed-array peak/cumulative allocations and releases all tracked arrays. `finish()` removes QA listeners and clears source/private records. The production applier has no QA accelerator, source comparison records or field-grid work.

## Native execution

Only root runs this, from the Mac project root with its existing server and installed dependencies:

```bash
node review/jaw-ear159-native.mjs
```

`PORTRAIT_URL` and `CHROME_PATH` may override the default server 8766 and Chrome path. Native WebGPU is required; there is no automatic WebGL fallback. The ordinary render path uses Neutral tone mapping 7, exposure 1.4, soft lighting, 900×1200 output and AA2 (1800×2400 internal). No out-of-pipeline `compileAsync` is added.

The wrapper uses fresh OFF and ON pages. Each produces front, detail, left, right, back and one matched lower-inner far-ear oblique view: **twelve captures total**. The close target is computed from OFF's existing right-ear UV strip solely for camera framing, then fixed across both pages. It is not a deformation control. All camera settings must match exactly. Source cleanup runs before the restored ordinary front render, followed by a final source check and record release. The wrapper does not repeat a fragile full-compositor PNG-equality gate for the known lower-left UI control variation.

Outputs:

- `output/qa/jaw-ear159-native.json`
- `output/qa/jaw-ear159-{0,1}-{front,detail,left,right,back,ear-oblique}.png`

The normal console output is a compact progress/metric summary; no base64 is printed. Browser/page cleanup is in `finally`, and a failed preparation is recorded as JSON. Mathematical/source success is explicitly separate from attachment and art approval.

## Completed local checks

`node --experimental-vm-modules review/jaw-ear159-local-check.mjs` passes 50 file hashes, parses the four modules without evaluating or linking dependencies, verifies actual155/157 provenance and expected 20/10 attribute inventories, and runs one small common-translation regression for the moved support query. That regression preserves a 0.001 offset after moving the face and ear together, reports no lost support and releases its 504 B tracked allocation. It is not an actual portrait geometry test. No local renderer, native page, broad geometry fixture or repeated field grid was run.

Quality_review_42 independently read the actual ear map/normal equations, moved support-query coordinates and release order; no concrete normal-path blocker was found. This was read-only review, not native verification.

## Frozen files

The 50-file baseline registry guards the accepted157 source tree, the actual imported `reference/image1-color.jpg`, proof dependencies and the four candidate runtime files. The initial registry incorrectly listed an unused local-only PNG that is absent on Mac; that entry has been removed. The actual JPEG guard and all four runtime modules are unchanged. The separate manifest lists transfer files and all existing guarded dependencies. Main must remain 21,796 B, SHA256 `03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5`.

| File | Bytes | SHA256 |
| --- | ---: | --- |
| `review/jaw-ear-candidate159.js` | 10,500 | `1c318d885a53919188c82a92e126cb84b8c7b5872e5dc17c9ecac2ccbfd6a843` |
| `review/jaw-ear159-geometry.js` | 22,703 | `53b2656c3069071cf154289298159d66ebee284eeeea09fb1f0a21306d14ec4b` |
| `review/jaw-ear159-native-qa.js` | 16,242 | `d255e41e0001a293c408b117f2e4ce778bb0ae884c49a350b2267f6f1c9ef552` |
| `review/jaw-ear159-native.mjs` | 10,758 | `34ca198f2e3782e09478570d689b6e33908d628024374a5e4de6f8c68eff6f9f` |
| `review/jaw-ear159-baseline.json` | 8,411 | `bfdbb1036516af6c48db0d9682971a833f945f9cc1f6ccac069a7e26d038708c` |
| `review/jaw-ear159-local-check.mjs` | 5,556 | `cda2e0956e5b661b23b67031d7793a48100bdade9b2a93d5f3c9c2adf05c755c` |
| `review/jaw-ear159-local-check.json` | 5,316 | `b0569771066c0f8f7da8d345c0cc1f46cdf963f9e726a0e846199dfd8bfb5b32` |
