# Iteration 156 — frozen coarse native handoff

## Status and decision scope

This is one frozen, reversible coarse study of a connected crown-to-fringe surface. It is ready for the root's native art comparison **with known coverage limitations**. No new score is assigned. Accepted149 remains the isolated reference at **78/100**; current production may advance independently. No156 geometry, material, fine population or source sampling should change before the native decision.

The proposal replaces the disconnected lifted routes that failed150 with two filled, connected banks, a shared part and five unequal emerging branches. The ordinary front/detail shape, attachment and interior coverage must justify any later fine rebuilding. A technically finite surface can still fail this art gate.

## Immutable baseline and command

Run from the project on the root's Mac:

```bash
node review/crown156-coarse-native.mjs
```

The wrapper expects the existing server at `http://127.0.0.1:8766/` and installed Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. It uses the ordinary native WebGPU render path, with no compilation shortcut, browser fallback, export or production-source mutation.

Its entry is `review/main149-baseline.js`, SHA256 `a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521`. Original JS dependencies are bundled from `review/crown156-baseline149-sources.json` with `src` as the resolve directory; live157 main is irrelevant to the pair. Separate byte guards cover `src/eye-contour-config.json` and `reference/image1-color.jpg`, closing the non-JS provenance issue found in the peer review.

The native report is written to `output/qa/crown156-coarse-native-report.json`. Captures include accepted149 and deferred-tint ZERO controls, then coarse OFF/ON front, detail, both profiles, back and junction, followed by restored detail. The UI labels these as a coarse study at the78 baseline. Console errors, page errors, backend, idle frames, restoration and post100 map hashes are recorded.

## Ownership and preparation

Both original128×64 CROWN charts retire cells `i=80…127, j=0…63`: **12,288 triangles**. The original24,455 vertex attributes, source100 preparation, foundation and surviving original index values remain intact. The replacement copies original collar columns80…88, retaining **1,170 copied vertices /2,048 triangles**, then continues from `u=.6875` through connected, head-supported interior banks to unequal clefts and five branches.

The new mesh is `Connected crown-to-fringe banks156`. Its five branch associations are old groups `{0}`, `{1,2}`, `{3}`, `{4,5}`, `{6}`. The far group6 route lies inside the retained side-crown projection, so its outer boundary shares the attachment instead of folding back into a self-crossing lobe. The actual copied crown envelope persists through the attachment before a smooth transition to the supported frontal field. There is no separate opaque backing strip or new fine population.

Coarse OFF and ON hide exactly the same existing slots:

| Existing layer | Records | Hidden triangles |
|---|---:|---:|
| Dedicated front crown DETAIL, captured `u>=.615` |885|46,020|
| Front edge WISPS, captured `u>=.615` |484|23,232|
| FRINGE groups0–6 upstream diagnostic rows |1,079|130,720|
| Total | |199,972|

Group0 rows below unbalanced posed `Y=.45` remain directly preserved; its shorter companions that never reach this height contribute endpoint targets only. Other groups are hidden for this coarse diagnostic. Exact hidden index ranges are recorded by the wrapper. MASS, long attached DETAIL, foundation/rear, temple94, lower118/contact86, and the actual147 head/ears are protected. This pair is **not** a complete production comparison with all fines visible.

The helper API is:

```js
createGroomHair({ ..., captureFront156: true });
applyFrontRoot156(groom, anatomicalHead, { strength: 0 }); // zero; no helper allocation
applyFrontRoot156(groom, anatomicalHead, { strength: 1 }); // one coarse application
setCoarseIsolation156(groom, true);
releaseFrontRoot156(groom); // restores isolated indices and removes private mesh
```

Only strengths0/1 are valid. Repeated strength1 returns the existing result; switching an applied groom to0 requires release or a fresh groom. The helper runs after actual147 preparation and100, **before** the deferred once-only149 tint. The optional constructor capture costs approximately15.5ms locally even in the review ZERO path; this is separate from the helper's zero return.

The private mesh clones the prepared CROWN physical material, preserving RGB/coverage/normal-map references, normal scale, channels, transforms, samplers, alpha settings and141 sidedness. Its export-selection metadata is cleared.149 then applies the accepted uniform tint exactly once to the original five plus the private sixth material. No optical adjustment was added. A later private layout-aware export coverage merge would be needed if the art is adopted; none is proposed before that decision.

## Source evidence and explicit limitations

The focused audit preserves accepted133 emitted geometry under constructor capture, ZERO, protected attribute/array identities and logical index values, and release restoration. All emitted attributes are finite. The new mesh has **5,336 vertices /9,989 triangles /358,750 bytes** in the local pre-upload fixture, replacing12,288 triangles. Coarse OFF is914,916 hair triangles; ON is912,617. No texture or per-frame work is added. These are source counts, not native heap or post-upload byte measurements.

The prepared source fixture uses the actual147 indexed front material group, eyelids and ears for support. It creates the exact100 UV/layout/coverage contract, but its channel1 RGB is a labeled placeholder. It does **not** claim equality of actual photo-atlas RGB. The native wrapper prepares actual100 and records the resulting maps and samplers for both modes.

The focused support check samples31,764 emitted triangle centroids and edge midpoints. Fresh interior samples have a minimum normal gap of **.002993** and no measured intersections. There are103 samples without a supported head hit. Nine negative samples, down to **−.008880**, belong to newly triangulated corner connectors whose vertices were copied from the old collar/exterior; all have zero alpha. They are not all unchanged source faces. Ten emitted vertices also lack a support hit, chiefly at the boundary; this remains a native profile limitation.

Actual emitted UVs have zero reversed or degenerate triangles. The maximum100 affine UV1 error is `4.2841e-8`; maximum compensated linear vertex RGB is `.135267`. The harmonic chart solve converged in133/135 iterations. All new triangles face forward in the authored XY projection, which does not establish camera-facing orientation in every view. The95th-percentile face/vertex-normal angle is7.17°. One zero-alpha corner triangle has101.59° disagreement; the minimum visible face/normal dot is.63056. Copied collar normal attributes are exact, while the actual geometric join is only approximately smooth: maximum upper attachment angle18.52°, maximum over all128 attachment edges43.32° at the lower far corner. No C1 claim is made for that edge.

For33 group0 target samples below unbalancedY=.45, the emitted coarse bank covers every queried XY, but its surface depth differs from the retained accepted target by up to **.016333**. The original downstream fine rows themselves remain exact in both coarse modes.

### Independent interior coverage — incomplete by design of this gate

The intended dense region was fixed before candidate triangulation, using the original crown `u=.625` upper/sides and the following unbalanced posedXY lower rail:

```text
(-.84,.59), (-.60,.94), (-.23,1.04), (.09,1.10),
(.355,1.00), (.572,.845), (.76,.48)
```

It has not been widened or replaced by the candidate's own footprint. The audit uses1,678 actual front-head samples at.018 spacing, excludes truly backfacing/self-occluded samples separately, and checks CROWN, MASS and the new coarse bank with alpha>=.5. It does not use fine strands to conceal misses. The alpha test is a source approximation without GPU mipmapping or alpha-to-coverage.

| Direction | Visible intended | Covered | Uncovered | Farthest uncovered distance from fixed boundary | Misses farther than.04 |
|---|---:|---:|---:|---:|---:|
| Authored head XY |1,644|1,629|15|.024761|0|
| Actual world front |1,601|1,565|36|.035223|0|
| World −30° |1,370|1,310|60|**.091719**|**17**|
| World +30° |1,638|1,632|6|.015129|0|

Backfacing counts are34/77/308/40 respectively; no sampled self-occlusion was found. No closed interior uncovered cluster was found, but that does **not** mean full coverage: at−30° the largest edge-connected cluster is27 samples, with .198 XY extent and .072 estimated inscribed uncovered width. The17 misses farther than.04 lie on the positive-x frontal bank, in current groom-local ranges `x=.087481… .357481`, `y=.844915…1.024915`, `z=.336779… .414868`. The maximum is at `[.339481,.916915,.336779]`, front-head triangle88194, and is **.091719** from the fixed boundary. These remain concrete native art risks; no alternative ROI or visibility rationale is used to dismiss them.

All17 exact points, projected coordinates, mesh hits and triangle IDs are in `coverage.views[2].criticalInteriorMisses` of `crown156-focused-audit.json`. The rounded locations follow.

| Current groom-local x | y | z | Distance from fixed boundary |
|---:|---:|---:|---:|
|0.357481|0.844915|0.349630|0.043593|
|0.339481|0.862915|0.358245|0.047778|
|0.357481|0.862915|0.342849|0.058240|
|0.303481|0.880915|0.378175|0.041500|
|0.321481|0.880915|0.365564|0.051963|
|0.339481|0.880915|0.351512|0.062425|
|0.303481|0.898915|0.371640|0.056148|
|0.321481|0.898915|0.358735|0.066610|
|0.339481|0.898915|0.344392|0.077072|
|0.321481|0.916915|0.351528|0.081257|
|0.339481|0.916915|0.336779|0.091719|
|0.177481|0.970915|0.409054|0.041500|
|0.159481|0.988915|0.408250|0.045685|
|0.177481|0.988915|0.401319|0.056148|
|0.141481|1.006915|0.406590|0.051078|
|0.159481|1.006915|0.400090|0.060333|
|0.087481|1.024915|0.414868|0.048810|

The audit's current groom-local translation from the unbalanced source frame is `[-.233519085,-.040085196,-.038236380]`. The reported sample coordinates include that translation; they are not image pixels.

## Preparation cost

The final diagnostic-only run measured **948.35ms** for the helper, with15.50ms optional constructor capture. Earlier local preparation varied around.9–1.2s. Phase timings for this frozen geometry:

| Phase | Local time |
|---|---:|
| Build actual indexed head support |112.97ms|
| Attachment/branch plan |50.51ms|
| Depth controls |13.79ms|
| Smooth field solve |39.70ms|
| Initial triangulation |198.44ms|
| Interior refinement and physical diagonal flips |276.80ms|
| Harmonic UV chart |65.36ms|
| Attribute emission and vertex support checks |184.28ms|

Triangulation/refinement is the largest measured cause. This exceeds the initial approximately250ms target and is a startup concern to measure natively. There will be no blind performance sweep before the art gate. The15.7s complete local audit includes fixture construction, hashing and coverage checks and must not be reported as runtime helper preparation.

Packed temporary solve data is1,276,800bytes, the support index598,152bytes, and field data12,696bytes. These are measured packed arrays; total transient JS-object/heap allocation is not comprehensively bounded by them. No new textures are created.

## Native acceptance and restoration

Inspect ordinary front/detail before the junction. Reject if the connected surface still reads as a solid bank or triangular flap, creates a scalp arc, visibly exposes the qualified far-bank misses, or breaks the part/branch flow in either profile. A useful result must improve continuous interior coverage and the unequal front silhouette without relying on a future fine layer to hide a failed coarse surface.

The wrapper records actual post100 map hashes and prepared material properties, once-only149 application to five/six materials, actual counts and support metrics, native WebGPU, finite attributes and browser errors. Restoration preserves original attribute hashes and object identities. Index digests are canonical logical Uint32 values, with only documented exact-value Uint16→Uint32 renderer widening allowed and separately reported; detached original array bytes stay strict. PNG equality and decoded restoration differences are reported rather than presumed.

Root now decides this single coarse pair. No fine rebuilding, export characterization, strength sweep or production integration is authorized by this handoff alone.
