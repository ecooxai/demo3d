# Candidate144 — existing upper near-ear curl

**Frozen for root-only native comparison. Artistic score remains77/100.** The source geometry and integrity checks pass. No native144 render has been run by this agent, and no production file has been edited.

## Scope and cause

The selected object is original near-side curl guide138, its54 existing regular fine ribbons and its single dependent flyaway40. The cause is the explicit upper-ear/lower-join route in the original continuous front root. These guides already bypass `earDepth`; changing that compression switch would do nothing.

The candidate keeps the original root, parameter cuts, section half-width0.04420781458, depth0.01944478415, lane population, fine widths, phases, UVs, RGB/alpha, materials, textures, mesh count and triangle count. It adds no strands. CROWN, accepted133 fringe, all other guides, and their fibers remain byte-exact. Guide138 and its fibers at authoredY≤−1.05 remain exact for143.

The guide center receives a compact displacement `(dx(y), 0, dz(y))` over authoredY∈(−0.58,0.65). Seven stored quintic Bezier segments form one C2 field with zero value and first/second derivatives at both support ends. Its authored center-map determinant is1. Tangents use the analytic derivative of this displacement on the original curve tangent. The existing gravity/pose/contact construction and geometric normal generation then run normally; the actual resulting triangles are audited separately.

The regular fine strands retain their original54 lanes, tip/end parameters and original lower curves. Their active upper samples follow the parent’s actual swept section, with a smooth guard to the exact original fine curves outside authoredY∈(−0.70,0.76). Using only the old19 Cartesian controls made several rear companion triangles shortcut through the pinna. Flyaway40 keeps its existing curve construction with the same guard. No random generator calls were added or reordered.

## Final route coordinates

H is the common head frame after accepted99 balance. The fitter inverses the existing gravity map at fixed authoredY. H.Y is therefore derived, rather than supplied independently. The actual accepted115 ear occupies H.X[−1.163321,−0.942519], H.Y[−0.334505,0.234596], H.Z[0.050215,0.239395].

| AuthoredY | H.X | H.Y | H.Z | Role |
|---:|---:|---:|---:|---|
|0.65|−0.987600|0.609915|0.330674|Exact original upper continuation|
|0.45|−1.070000|0.409915|0.270000|Descend from existing root|
|0.27|−1.095000|0.228660|0.235000|Pass over the upper outer pinna|
|0.18|−1.148000|0.135647|0.180000|Turn around the upper rim|
|0.05|−1.195000|−0.001744|0.125000|Outer return|
|−0.10|−1.205000|−0.163663|0.035000|Continue outside the pinna|
|−0.32|−1.180000|−0.405048|−0.120000|Return below the ear|
|−0.58|−1.101115|−0.690301|−0.166676|Exact original lower continuation|

The only waypoint changes from the approved starting proposal are H.Z at authoredY0.05 (0.070→0.125) and−0.10 (−0.010→0.035). These shared depth changes resolve the actual straight render-triangle clearance of the existing fine companions. Width and population stay fixed.

The continuous guide-center displacement has a Bezier convex-hull bound of **0.216186521704**, within a certified interval of width8.30e−10. The largest final stored vertex displacement is **0.217871625525**. Because corresponding render triangles interpolate their vertex displacements linearly, the latter also bounds the whole actual piecewise-linear surface correspondence. It is not a claim about every point of an unrendered ideal continuous sweep.

## Completed source checks

The final result is `near-ear144-source-audit.json`; `near-ear144-contract.json` checks the field jets and analytic geometry fixtures. These are local source-harness results, not native Three or artistic validation.

| Check | Result |
|---|---:|
|Off constructor vs frozen133|Every mesh attribute/index hash exact|
|Changed MASS positions / normals|126 /144|
|Changed selected DETAIL positions / normals|860 /1,077|
|Changes outside selected ranges|0|
|Selected lower vertices with exact positions and normals|1,898|
|Lower guide position/tangent samples, all exact|1,071|
|Lower fine position/tangent samples, all exact|14,243|
|Root guide prefix position/tangent samples, all exact|282|
|Original cuts, widths, topology, UV/color/alpha, maps/materials|Exact|
|Maximum unit-normal error|4.97e−8|
|MASS / actual115 ear minimum triangle distance|0.01700285377|
|Fine / actual115 ear minimum triangle distance|0.00568438863|
|MASS / ear intersection pairs|0 (baseline38)|
|Fine / ear intersection pairs|0|
|Changed MASS triangles / smallest area ratio|240 /0.591611|
|MASS winding flips / nonadjacent strip intersections|0 /0|
|Changed fine triangles / smallest area ratio|966 /0.559408|
|New folded fine quads|0|
|Smallest paired fine-triangle normal cosine|0.919368|
|Largest finite-difference displacement-derivative error|1.10e−10|
|Endpoint value/first/second derivative residual|0|
|Largest intersegment C2 jet residual|3.91e−14|

Triangle distances use both edge/face crossing and the actual minimum point/triangle/edge distances in one frame. The tested upper region H.Y[−0.60,0.58] contains the entire ear plus a margin. The checker passed analytic crossing, parallel, coplanar overlap and separated-triangle fixtures. Geometric normal rotations and authored normal length errors are reported separately.

The final source audit took14.89s wall /17.37s CPU, with556.34MiB peak RSS; full enabled source-harness groom construction took4.63s. These include the local emulation cost and are not native construction measurements. The helper adds **no GPU geometry or texture bytes**, no draw calls and no per-frame work. Its fit/collision search exists only in the offline review tools; native construction reads the small frozen coefficient table.

## Native handoff

Run from the project root on the existing Mac server at127.0.0.1:8766:

```bash
node review/near-ear144-native.mjs
```

Transfer these native dependencies together: `near-ear144-native.mjs`, `hair-groom-candidate144.js`, `near-ear-route-candidate144.js`, `near-ear144-coefficients.js`, and `near-ear144-geometry.mjs`. The wrapper builds its own ignored `output/qa/app-near-ear144.js`. It requires the exact accepted141 main and frozen133 production groom below, and patches only its isolated bundle.

It runs fresh mode0 and mode1 pages with the ordinary accepted141 preparation, both130/140 lip corrections,141 unique-CROWN side settings, Neutral tone mapping/exposure1.4, native WebGPU,900×1200 output and AA2. There is no automatic backend fallback, live geometry replacement, renderer-internal patch, or extra `compileAsync`.

For each mode it saves front, detail, left, right, back, and two matched ear views. The ear cameras match the earlier141 probe. Expected output is14 PNGs named `output/qa/near-ear144-{0,1}-{front,detail,left,right,back,ear,ear-oblique}.png`, plus `output/qa/near-ear144-native.json`.

The wrapper snapshots after ordinary first GPU upload, checks all protected geometry and lower raw-Y entries across modes, audits actual native ear clearance, MASS/ribbon triangle orientation and MASS self-intersections, and checks stable source references/bytes/maps/material bindings through the views. It also checks four cached preparation result identities, zero original resource disposal and zero idle rendering. Every page and the browser close in `finally`. The report retains compact selected native vertex arrays solely to compare actual geometry between the fresh pages; there is no per-frame allocation or work.

The live first-upload handling matters: installed r186 can widen original Uint16 indices without changing topology values. The wrapper snapshots after that ordinary upload. The source audit independently proves the original constructor indices and all lower arrays exact.

## Native artistic decision

Inspect the ordinary front/detail first: does the original connected curtain now partially veil the upper pinna in a way supported by image1? Inspect both profiles and the ear-oblique view for an isolated outer return, floating strap, excessively broad dark band or changed ear silhouette. The accepted133 fringe/CROWN and lower hair should remain identical. Root continuity and collision clearance are necessary geometry checks; neither establishes a visual gain. **Keep77 until the native images justify a decision.**

No image or material change is included. The source photo does not establish a hidden-side hairstyle; the side/back views are continuity checks, not invented reference evidence.

## Frozen files

The complete13-file byte/SHA256 manifest is `near-ear144-freeze.json`. Key files:

| File | Bytes | SHA256 |
|---|---:|---|
|`near-ear144-native.mjs`|18,883|`ab131973b2da0a065a2a2b72193419691754619c7279d4fd6de67477f863abbe`|
|`hair-groom-candidate144.js`|45,965|`f5a39b28aa6201c69259d69d270004c7d3b9019f444ac31678fd99ba41ede70e`|
|`near-ear-route-candidate144.js`|7,218|`01f207f978a89b3f866f1fb80354ca459b579d9606a697e5547c3bd50a71bd65`|
|`near-ear144-coefficients.js`|6,395|`ddad0d67dc2d44fffa5a4b2b99242177bcec06c9867e0c0cd3a0dba1a414450b`|
|`near-ear144-geometry.mjs`|7,979|`3377610957ee596e7d63cac772404081a4058ca92ff8ff7e18020504b369aee4`|
|`near-ear144-source-audit.json`|13,046|`0821c2faa2d0a1a009da0f067a3e94f2bec2af7722e5c62014226513b69a340e`|

Unmodified production main SHA256: `2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a`.

Unmodified production/frozen133 groom SHA256: `a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d`.

Coefficient content fingerprint: `658144a4afac9dd3835d2422d9776f11fc922b1d61e539c0fba0624b5d38dad8`.

To reproduce the offline files, run `node review/near-ear144-prepare.mjs`, then `node review/near-ear144-build.mjs`, `node review/near-ear144-contract.mjs`, and `node --expose-gc review/near-ear144-audit.mjs`. The fitter now defaults to the final `near-ear144-route-targets.json`, so it cannot silently revert to the earlier colliding route. The original proposal and initial fine-intersection report are retained as history. Syntax checks pass for the helper, generated constructor, coefficient/geometry modules and native wrapper. Native execution remains root’s next step.
