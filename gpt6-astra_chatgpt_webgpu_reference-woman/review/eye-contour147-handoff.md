# Eye contour147 — frozen native comparison handoff

**Status:** local source checks passed; native rendering and artistic judgment are pending. The accepted score stays **77/100**. The parent runs the Mac test and owns all production edits. Nothing under `src/` was changed for147.

## Approved change and baseline

This is one OFF/ON application of the parent’s original147 field, using eight manually placed eye-aperture controls. Both iris centers and the current nose tip/bridge are pinned. The corrected145 first20 manual correspondences provide the QA provenance; the other15 controls and all image pixels are excluded from this calculation. The maps are neither analyzed nor rebaked.

The exact guarded base is accepted141, including full130/140 lips and133/118 hair:

- `src/main.js`: `2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a`.
- `src/hair-groom.js`: `a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d`.
- Corrected `review/likeness145-native.json`: `e3d6da292dd4fcb9d52bdcab5a4fe31871d0b291fae514c883f969525c4a744b`.

The field is a common C2 displacement in actual **world XY** across anatomical-head meshes. Its analytic world Z component is exactly zero. The back depth gate runs from world Z0.10 to0.35; the lower fade runs from photo Y560 to600. Stored Float32 positions can introduce tiny world-Z roundoff after inverse frame conversion, which is measured rather than called bit-exact worldZ.

No head population, topology, UV, atlas, material, render group, neck, blouse or hair is changed. All untouched vertices preserve the original stored position and normal components. Unused zero normals remain zero. The actual accepted140 upper-lip geometry object and the accepted lower-lip geometry object remain the originals because the mouth is outside support.

## Native entry point and transfer dependencies

Run from the project root on the existing native Mac environment:

```sh
node review/eye-contour147-native.mjs
```

`PORTRAIT_URL` and `CHROME_PATH` are optional overrides. The defaults are the existing local8766 portrait and installed Google Chrome. The script does not select an alternative backend if native WebGPU is unavailable.

Transfer these new147 runtime/review files, preserving their paths:

| File | Purpose |
| --- | --- |
| `review/eye-contour-candidate147.js` | Once-only head applier and optional QA release |
| `review/eye-contour147-native.mjs` | Parent-only fresh-page OFF/ON wrapper |
| `review/eye-contour147-native-qa.js` | Temporary source, buffer and live-scene instrumentation |
| `review/eye-contour147-controls.js` | Fixed corrected145 triangle/rounded-vertex sampling |
| `review/eye-contour147-geometry-audit.js` | Finite-triangle and bounds-limited BVH contact QA |
| `review/eye-contour147-applier-audit.json` | Frozen local source evidence recorded in native manifest |

The wrapper also reads the already present `eye-contour147-config.json`, `eye-contour147-field.js`, `eye-contour147-field-audit.json`, corrected `likeness145-native.json`, and frozen `near-ear144-geometry.mjs`. The last file supplies only its generic triangle-distance function, not rejected144 geometry or route data. `eye-contour147-freeze.json` lists byte counts and SHA256 for the complete handoff and the source-only harness dependencies.

The wrapper builds a separate `output/qa/app-eye-contour147.js`, injects one awaited QA preparation immediately after the literal accepted140 call, and starts a **fresh page** for each mode. It leaves production `app.js` untouched and never calls an extra `compileAsync`.

Outputs:

- `output/qa/eye-contour147-native.json` with full source/resource, finite-triangle, control and contact evidence.
- Fourteen `output/qa/eye-contour147-{0,1}-{front,detail,left,right,back,eye,eye-oblique}.png` compositor captures.
- Both close cameras use the OFF source iris midpoint. The ordinary five cameras and the two close cameras must match exactly between pages.

All captures use native WebGPU, Neutral tone map7, exposure1.4, soft lighting, output900×1200 and AA2/internal1800×2400. Source checks surround the views; the test checks idle0, restores source geometry, disposes only wholly private geometry, removes listeners and releases temporary QA references. The browser closes in `finally`, including failure paths. There is no export test or display/material sweep.

## Independent field review

The field’s Wendland kernel is `(1-r)^4(4r+1)` inside radius80 and zero outside. At its center the radial expansion is `1−10r²+20r³−15r⁴+4r⁵`, which is C2; the compact boundary jets and both quintic fades are also C2.

The existing dense grid is supplemented by a conservative analytic derivative bound, not treated as a proof by itself. The component Hessian entry bounds are0.24663082 and0.71242979. Each support point lies within half a0.25 grid step in each axis, so the Frobenius gradient margin is0.26654807. This gives raw displacement Lipschitz bound0.84522386; the lower-fade product term adds0.00714531, giving **0.85236917<1**.

This bound applies to each fixed-Z **XY slice**, not the full3D displacement-gradient norm: the depth gate adds a Z derivative column. Global injectivity still follows because outputZ equals inputZ. Two coincident outputs must originate in the same Z slice, whose map is the identity plus a displacement with Lipschitz constant below1. The photo/world XY transform is a scaled orthogonal reflection and preserves the operator norm under conjugacy. The XY determinant remains positive, with the conservative bound `(1−0.85236917)²`; the actual sampled minimum is about0.58394.

The applier transports each existing authored normal once through the actual affine `matrixWorld`, the field inverse transpose, and the local frame. It does not assume UV derivatives equal posed spatial derivatives and does not add a new normal weld. Finite-triangle orientation uses transported **baseline geometric** normals at the source triangle centroid and is reported separately from authored-normal correctness.

The sampled maximum displacement plus the grid/Lipschitz margin is below0.073 world units. The applier enforces that bound, determinant>0.02 and finite Float32 storage tolerances. These mathematical guards do not establish artistic likeness or absence of a visible overlay edge.

## Completed local evidence

`review/eye-contour147-applier-audit.json` executes the actual continuous-face, both accepted lip grids and the four core surfaces of both eyes through the accepted proportions, refinements, balance and140 chain. The old source-only matrix/geometry harness supplies basic Three-like containers; it does not render or evaluate materials. Tubes, brows, ears and live groom contact remain native checks.

| Check | Accepted-frame result |
| --- | --- |
| Stored corrected145 controls before147 | All20 match within the1e−6 world guard; core eye/nose errors are at floating-point arithmetic scale |
| Maximum actual control residual after147 | **0.00150803 photo pixels** using the same stored barycentric weights/rounded vertices |
| Maximum finite-difference authored-normal transport error | **2.96×10⁻8** component error |
| Maximum stored world-Z roundoff | **3.39×10⁻8** world units |
| Changed core position vertices |31,905 |
| Exact outside-support core vertices |102,941 |
| Minimum changed finite-triangle area ratio |**0.60286743** |
| Minimum agreement with transported baseline geometric normals |**0.99811471** |
| New degenerate or opposed triangles |0 |
| Core private geometry allocations |9; **8,396,346 bytes** before native upload |
| Accepted upper/lower lip geometry references |Exact originals |

The second source case uses an oblique, nonuniform frame. It independently differentiates the complete world/local point operation and reaches a maximum normal component error2.98×10⁻8 and actual control residual0.00151307 pixels. All original bytes/attribute references and zero-normal population remain exact; all private attributes and indices own their buffers and release safely. Same-geometry/same-frame instances share one private clone; a different frame receives another clone. Returning an original geometry from a broken clone is rejected without disposing that original. Zero skips traversal and matrices, and repeated ON returns the same cached metrics identity.

The last source run took about5.06 seconds wall time/8.03 seconds CPU with peak RSS508.7MiB. Those figures include the source fixtures, two finite geometry audits, hashing and controls; they are not the live helper’s initialization cost. Native records that cost separately.

### Existing overlay contacts remain a visual qualification

The source audit introduces **zero** contact pairs for iris/cornea, lid/cornea or lid/sclera. The already intersecting lid-over-face border changes triangle-pair identities:

| Overlay | Before total pairs | After total pairs | Newly meeting pair identities |
| --- | ---: | ---: | ---: |
| Near lid/face |115 |111 |1 |
| Far lid/face |122 |111 |34 |

These are actual finite-triangle measurements with1e−8 distance tolerance. Reduced totals do not justify calling the contact change lossless. Conversely, new pair identities in an existing overlay do not by themselves establish a newly visible poke-through. The first native ordinary/detail/eye views must decide whether a gap, overlap or expression regression is visible. Root explicitly approved proceeding with this qualification instead of broadening tests to force zero pairs.

The native contact audit uses only actually affected head triangles and unchanged hair triangles whose world bounds overlap that support, with a BVH and a0.001 distance window. A null minimum is a lower-bound statement for that window, not an unbounded closest-distance claim. It reports all selected hair populations and all contact-pair changes; it does not compare whole-groom triangle pairs.

## Ownership and memory interpretation

The8.40MB is the **replacement buffer size**, not an equal permanent CPU or GPU increase. Full geometries are privately cloned to avoid r186 disposing cached shared UV/color/index bindings through a temporary geometry. Production calls the helper before the first renderer upload; the helper’s default WeakMap entry retains metrics only, allowing its old unreferenced CPU arrays to become eligible for collection. The renderer uploads replacement buffers instead of first uploading both sets. Earlier owners may retain their own source geometry, so this module does not claim to control all project retention.

For this native comparison only, `retainSourceForQA:true` keeps originals so cleanup can restore them. The native report distinguishes pre-upload replacement CPU bytes, post-upload CPU bytes, estimated GPU attribute allocation and QA-retained originals. r186 may widen nonnormalized Uint16 indices to Uint32 on first upload; the check accepts only that observed engine conversion with identical logical values and unchanged attribute/version/layout. It still checks the original saved bytes and rejects unexplained data changes. No geometry shader or per-frame allocation is added.

Production-style API, if the art is later accepted:

```js
// Inside the existing once-only preparation promise, immediately after140.
state.eyeContour147 = applyEyeContour147(anatomicalHead, { strength: 1 });
```

The first application decides the retention policy. Repeating the same strength is idempotent and returns the same metrics; changing strength requires a fresh head or an explicitly QA-retained release. `releaseEyeContour147` restores original references before disposing private buffers. The default production policy intentionally cannot undo from retained snapshots because it keeps none.

## Pending artistic decision

Judge the native front/detail first against soleimage1, then both profiles, back and matched eye/oblique crops. The question is whether the control correction improves ordinary eye shape/feature relationships while preserving the expression and natural iris shape. Reject if it creates a stretched iris, lid/face gap, poke-through, fringe contact artifact or poorer likeness even when the geometric guards pass. Do not alter eye optics, maps, hair or the accepted lips to conceal a failure. No gain above77 is claimed before those images are reviewed.
