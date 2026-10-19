# Collar158 — frozen source for one native OFF/ON comparison

**Status: source-ready, pending native art. Accepted157 remains78/100.** No production or Mac files were changed. Root approved the visible coarse camber for this single comparison; the coarse diagram and numeric checks do not establish adoption.

The approved design remains unchanged at `review/collar158-proposal.md`, SHA256 `51cd08b781f216ca78d5ffbfbc7a58a57da530d01efc8047d36c8b5fdb0d09b8`. The manifest records every relevant runtime input and the source evidence. Current main is21796 bytes, SHA256 `03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5`.

## Run and decision scope

From the existing Mac project root, with the ordinary server available:

```bash
node review/collar158-native.mjs
```

The wrapper uses existing Playwright/esbuild/Chrome, explicit native WebGPU, and the exact current157 main. It does not replace production groom/blouse source or select another renderer. Optional `CHROME_PATH` and `PORTRAIT_URL` retain the established wrapper behavior.

Fresh OFF/ON pages preserve the accepted117/154/151/147/149/140/141/130 preparations, Neutral1.4,900x1200 output andAA2. The only injected candidate call follows117/154 and precedes the single99 pass. A separate QA-only continuation balances the four retained originals immediately after that ordinary99 call. The comparison sets iteration158, score78 after asserting the accepted157 state.

The12 art captures are `output/qa/collar158-{0,100}-{front,garment,left,right,back,collar-oblique}.png`. The isolated garment and collar-oblique views hide only the head/hair pivot; their same fixed cameras are used in both states. Each mode also saves a restored-front PNG and a full audit in `output/qa/collar158-native-result.json`.

**Primary art gate:** the ordinary portrait should show a softer turned cotton leaf, the isolated garment should show one broad roll reaching its free edge, and profiles should retain a thin plausible collar. Reject a standing fin, a sharp hinge, a new pale gap, seam lift, hair poke, exaggerated white wedge or an exposed old `beneathCollar` shaded outline. The fixed high right root and broad triangular outline remain limitations. The sole photograph partly hides the tips, so their exact reconstruction is uncertain. A useful local result need not raise the whole-scene78.

## Geometry and exact ownership

`review/collar-roll-candidate158.js` owns only the existing left/right `spread-collar` leaves and their `collar-edge` tubes. These four meshes contain5,870 vertices and11,328 triangles; population and index values are unchanged. Front, back and edge vertices receive the same ambient deformation in the asserted identity mesh-to-blouse frame. The original folds, facings, neckline/V, buttons, body154, neck and every hair/face surface remain protected.

The source X/Y chart includes both actual width maps, upper roll, side offsets and original free-leaf Y term. Its bounded inverse supplies coordinates for every real front/back/tube vertex. The added camber has left/right limits.060/.045 and the small longitudinal return uses.025/.020. The full chart/gate/return Jacobian carries existing normals by the inverse transpose. No normal recalculation, maps/material changes, seam population or extra backing surface is used.

One conservative source correction was necessary to honor the original protected strip on the underside: UV rowv=.1875 reaches ambient chartv=.211437 on the left and.217794 on the right because the source back is inset along its normal. The shared longitudinal gate therefore begins at ambientv=.22 instead of.20. This keeps **all original UVu<=.20 orUVv<=.20 front/back values exact** without independently pinning the back. The approved proposal remains frozen; this correction is documented here and in the helper spec. Both original fold tubes,810 vertices, are outside the actual field.

Complete private clones include position, normal, UV, color and index; no supposedly immutable disposable binding is shared. The production default retains no originals. The QA option retains them solely to verify exact source restoration.

## Focused source evidence

| Measure | Result |
|---|---:|
| Field-owned vertices |3,891|
| Changed positions / normals |3,846 /3,889|
| Continuous determinant minimum |0.86726846|
| Maximum total displacement |0.06637930|
| Maximum X/Y point return |0.03595960|
| Maximum added height |0.05999458|
| Chart inverse residual |1.998e-13|
| Original source-chart residual |8.719e-8|
| Analytic Jacobian finite-difference error,108 samples |8.990e-9|
| Updated normal unit-length error |4.057e-8|
| Actual owned triangles |7,705|
| New reversed / degenerate triangles |0 /0|
| Minimum old/new triangle-normal cosine |0.88844310|
| Emitted triangle area ratio |0.813063–1.162918|
| Maximum sampled chord/map deviation |0.000475997|

The geometry gate uses actual emitted collar triangles and one BVH over their before/after union. It visits fixed nearby body, facing, fold, neck, placket and full groom triangles. In the current source fixture,1,171,816 fixed triangles contain19,515 nearby triangles;17,316 tested pairs produce **0 before,0 after,0 new and0 removed contacts**. The opposite owned left/right assemblies have disjoint complete-vertex X bounds, separated by.51348271 before and after.

Each closed leaf's2,304 actual front triangles is checked against its2,304 back triangles: no front/back intersections. Minimum corresponding front/back vertex separation is.00388913 left and.00399625 right. Thickness ratios are.86030–1.15351 and.88592–1.12887. This is measured thickness variation, not a claim of exact constant normal thickness.

Each edge tube has193 actual ring-center/emitted-segment midpoint samples projected to its own actual front triangles. All before/after hits remain; maximum additional signed Z stand-off is.00040925 left and.00033622 right. These sampled directional separations are not a shortest-distance or full tube-volume containment certificate. Closing side walls and expected same-leaf attachment are distinguished from front/back self-intersections. No global scene-disjointness claim is made.

The source fixtures reconstruct the accepted Float32 geometry using local source arithmetic. The edge/fold tubes use the existing centripetal-curve fixture. Actual installed Three, all complete-scene obstacles and GPU behavior remain the native authority; the wrapper repeats this narrow gate on the actual scene. Large reproducible source mesh JSON stays local and is excluded from transfer.

## Resource and restoration checks

The four full replacements contain**314,608 bytes** before upload (.300MiB), or**382,576 bytes** (.365MiB) if all sourceUint16 indices widen toUint32. These replace the same production buffers: added vertices, triangles, draws, maps and per-frame work are all zero. Native actual bytes supersede this source budget.

Latest local helper preparation was48.0ms in the arithmetic fixture. Building the full source groom for the contact check took5.40s; total source audit was7.03s,8.48 CPU seconds, with501.72MiB peak process RSS. These full-fixture costs are not added production helper costs. The contact diagnostic itself took437ms and used at most15,510,240 bytes for one temporary transformed position array, with no diagnostic geometry retained on the scene. Native reports separately record actual helper, proxy, construction, JS heap and eight warm front submissions; paired queue timing is not evidence of a GPU speedup.

The real native QA prepare/afterBalance/cleanup functions passed a focused local integration check. Both fresh states' balanced original attributes match exactly. OFF has no proxy/private disposal; ON uses four frame-identical unrendered meshes with the original collar names, preserving99's rigid classification, and one fresh proxy cache. Their5,870 vertices match the source counts. All four original geometry bindings are restored before four private geometries are disposed. Original resource disposals are zero, and every private disposal owns all its bindings. Production retains no QA source or proxy.

Peer review by `glb_export_repair` found no concrete chart/Jacobian/normal/frame blocker, and separately found no afterBalance/cleanup ownership blocker. Those reviews explicitly did not substitute for the actual emitted-triangle or native art gates.

The native harness fingerprints all actual model attributes/bindings, materials, texture pixels/samplers and accepted cached preparations after the ordinary first WebGPU frame. OFF/ON comparison masks only the158-owned position/normal entries. It also compares complete balanced original collar attributes, permits only verified logical index widening, checks no disposal of original resources, restores front camera/state and records both restored PNG hashes. It checks idle rendering and console/page errors, and its failure path still attempts QA release, page close and browser close independently.

## Curated transfer

The manifest's `nativeTransferFiles` is the complete small transfer list. The five runtime files are the candidate,158 geometry audit,158 native QA,158 native wrapper and existing frozen154 triangle-intersection dependency. The remaining transfer files are the manifest, this handoff, approved proposal, three concise source reports and the coarse review PNG. All source runtime dependencies already exist in the Mac project and are hash-guarded. No production source is copied or modified by this package.

Source status: **ready for the single native art comparison; no score gain or adoption claim.**
