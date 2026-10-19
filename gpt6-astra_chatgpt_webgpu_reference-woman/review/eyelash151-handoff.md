# Eyelash 151 — frozen native handoff

**Status: local source and math checks passed; native execution and artistic decision pending. Accepted production stays 149 / 78. No production file was changed.**

## One candidate

Only the two existing `individual-eyelashes` meshes change: 80 fibers, 2,064 vertices and 2,616 triangles. Every one of the 320 accepted147 root-ring position/normal vertices is copied exactly. The original UV/index inventory, material bindings, eye aperture/corners, iris/cornea, lash margins, waterlines, menisci, accepted140 mouth, scalp and groom remain unchanged.

The candidate shortens the eyelid-surface component of each original sweep, preserves its forward reach, introduces a small distal fan variation, and reduces radius smoothly to 8% at the existing final ring. It adds no cap, fiber, draw, map or per-frame work. The root position and derivative jets remain those of147. The sharp lower border itself is outside this study; do not credit151 with repairing an unchanged waterline or source-map feature.

## Geometry and normals

The three unique vertices of each original ring exactly reconstruct its center and two ellipse axes. Natural C2 cubic interpolants define the existing sweep. A C2 longitudinal gate gives the center correction; shortest-rotation Rodrigues carries the ring frame between the old/new centerline tangents. The target radius factor is `0.08 + 0.92 (1 − S5(u))^1.6`.

Normals use `K1^(-T) K0^T n` from the declared source/target tube-coordinate derivatives, transported through the actual post147 mesh-to-head affine matrices. There is no separate normal flattening or material adjustment. Nonzero tangents, nonsingular Jacobians and a rotation denominator away from zero are guarded. The accepted root buffers bypass recomputation.

The continuous displacement bound uses subdivided polynomial Bernstein hulls and the orthogonal rotation norm bound. Bezier chords/control polygons enclose centerline lengths. The maximum reported bound is **0.015148903713 head units**, below .016. The maximum length-ratio upper bound is **0.902346013027**, below 1.02. These are conservative bounds on the declared sweep in floating-point arithmetic; actual finite triangles are checked separately. The radial-disk determinant lower bound is exact at the sampled longitudinal sections, not a continuous global volume-Jacobian proof.

## Local evidence

The final source audit completed in 1844.1 ms, with the helper taking **223.3 ms** and its alternate sheared mesh-frame case 199.4 ms. Its 287.1 MiB peak RSS includes two full source-head fixtures and temporary QA data; it is not the lash replacement cost.

- All 320 root-ring vertices, source arrays/versions, unrelated geometry references, topology/UV bytes and materials remained exact; two private geometries restored and disposed cleanly.
- Maximum vertex displacement: 0.013816681334. No new finite-triangle degeneration or radial reversal. Minimum area ratio: 0.028493865088.
- Analytic derivative maximum error versus independent finite differences: 3.26e-10. Minimum finite-difference surface-normal agreement: 0.9999999999995. These derivative checks are distinct from authored shading-normal agreement and actual triangle winding.
- Re-expressing the same accepted source in a translated/sheared/nonuniform mesh frame gives maximum world position difference 1.42e-07, and normal-vector difference 2.55e-05; both include Float32 re-expression.
- The source fixture has no new ocular root or distal contact pair. Existing lid/root pairs are **524 → 522**. First strips include fixed root vertices and moving second rings, so their contacts are explicitly reported rather than ignored.

The local fixture uses the original source eye/lash construction with a small curve/tube implementation; it is not installed Three. It omits the margins/menisci and groom. Those actual retained surfaces are included in the native risk check. No native clearance or artistic gain is claimed from the fixture.

## Resource ownership

151 clones every attribute and index of each selected mesh, because disposal in installed Three can reach cached attribute bindings. The local Uint16 replacement is **81,744 B**; WebGPU index widening can make it **97,440 B**. These replace the old lash buffers and are not equal permanent CPU/GPU increases. The helper defaults to retaining only metrics, before the first upload. QA explicitly retains source geometry for restoration and releases its records/listeners afterward. No texture memory or draw count is added.

`applyEyelash151(head,{strength:1})` returns cached metrics. The same call is idempotent. OFF exits before traversal. Review restoration requires the explicit `retainSourceForQA:true` option and `releaseEyelash151(head)`; production does not keep source copies for undo. Do not integrate before reviewing the native images.

## Native run

From the existing project on the parent-owned Mac:

```sh
node review/eyelash151-native.mjs
```

Optional existing server/Chrome overrides are `PORTRAIT_URL` and `CHROME_PATH`. The wrapper verifies the frozen manifest and exact accepted149 main/groom. It injects QA once immediately after `state.eyeContour147=applyEyeContour147(anatomicalHead,{strength:1});` inside the cached preparation. Two fresh pages run explicit native WebGPU, Neutral tone mapping / exposure1.4, soft lighting, 900×1200 output and AA2. It does not perform an extra compile or backend fallback.

The six matched views are front, detail, left, right, eye and eye-oblique; the close cameras are exact stored OFF147 cameras with recorded provenance. The back-facing geometry is unchanged and was already covered by integration149. No optical, material or camera sweep is included.

The wrapper protects all actual model mesh/material/map records and the six prior preparation-result identities, including both continuous-face material slots. It permits only documented WebGPU index widening with exact logical values and unchanged original bytes. Narrow actual contacts include the retained eyelid, margin, waterline, meniscus, sclera, iris, cornea, front-face triangles, and bounds-overlapping existing133 fringe triangles. New pair identities are recorded alongside inherited root contacts; a passing source audit does not assert global disjointness.

Results go to `output/qa/eyelash151-native.json`, with 12 comparison PNGs and two restored-front PNGs. Restoration uses the ordinary render path. Full compositor hash equality is recorded, not asserted: earlier accepted tests observed button-overlay variations. Any visible portrait difference still requires review. The browser closes in `finally`, including failed setup/cleanup paths.

## Frozen files

The manifest lists every native transfer dependency and all source-audit inputs. Installed runtime dependencies remain the existing project packages. No external asset is introduced.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| review/eyelash-sweep151.js | 10234 | `ec468f644708d7fd5a7b70d0423d9c42a0979816a8199607b69bb32807ce528b` |
| review/eyelash-candidate151.js | 14510 | `7f03bc3686dc24caf53b83c4aa5b67ba7a4244ca4e1b3646ae2b11aacf9475f4` |
| review/eyelash151-geometry-audit.js | 8222 | `bb9f8467da6f580cbe32a60a5b49401394df88cee23ceabb57f78bb17c196f2a` |
| review/eyelash151-native-qa.js | 19000 | `daa59b45e4a9e0c6dd66e6619c66c627c8dde897a031702edc38975f834172c3` |
| review/eyelash151-native.mjs | 9936 | `d211e27f21b4a02bad7f781a7610ba70574aa0db5c74f60314742134bd8dda4c` |
| review/eyelash151-cameras.json | 1167 | `d7ae5c3152e18e7e24a3ab53c23749ebb5dd25689cdc76a401126ab310b78012` |
| review/eyelash151-manifest.json | 4843 | `88845195e931cda37037bf8e215a600b5c125e5e99781bdc08715dca2fc46665` |
| review/eyelash151-audit.json | 189375 | `2c050ad8fe58835dafbb1678e4feaf3c064441ab8c862578cbb663571078db72` |

Production main remains `a85fa76871b72b9ec1ed1cc545598c5066d346fdbb6e3226b6a247f9ddea9521`. The geometric candidate is ready for the first native art pair; **score remains78**.
