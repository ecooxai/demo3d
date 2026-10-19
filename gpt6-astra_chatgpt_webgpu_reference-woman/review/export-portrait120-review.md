# Candidate120: preserve physical sheen during GLB export

**Status: isolated review candidate; native retry pending. Artistic score remains 76/100.**

## Observed failure and its cause

The original focused117 native test was frozen at 29,492 bytes with SHA256 `65890d8e1e597ccf18cd4b2fa1d819c10759670ab25e0ab418b934698eed5501`. Root's actual Mac run passed the torso atlas, weave bump, topology, UV and base-color-factor checks, then failed at `Loaded effective cotton sheen changed`. Source integrity and cleanup passed; there were no browser errors.

Root inspected the installed Three r186 exporter and loader. The exporter writes `KHR_materials_sheen.sheenColorFactor` from `material.sheenColor.toArray()` without the Three scalar `material.sheen`. The loader restores `material.sheen=1`. Cotton has scalar 0.105, so this path raises its effective sheen by approximately 9.524 times. This is an export material defect, independent of117's atlas legality correction.

## Isolated change

`review/export-portrait-candidate120.js` is based on the current accepted104 exporter. It retains that file exactly except for one report field, a compact positive-sheen normalization function and its call. The audit reverses those additions and requires byte-for-byte equality with `src/export-portrait.js`.

For each positive sheen material, the export clone receives:

```js
clone.sheenColor.copy(source.sheenColor).multiplyScalar(source.sheen);
clone.sheen = 1;
```

The operation uses the working linear color. It adds no pixel buffer, canvas, geometry copy or work per frame. The existing exporter already gives each material its own color object and each texture independent metadata and `TextureSource`, with immutable source pixels shared where appropriate.

For a sampled sheen color map `M(u,v)`, the original product `s × C × M(u,v)` becomes `1 × (s × C) × M(u,v)`. The scalar therefore needs no map bake or sampler change. Sheen roughness and both sheen maps remain unchanged. Normal-map scale conversion and the104 crown alpha merge remain exactly as previously accepted.

Zero sheen keeps its zero scalar and original color, including when maps are assigned. The exporter should omit the sheen extension and the loaded material should have sheen disabled. A positive scalar with black sheen color remains physically black. Nonfinite or negative scalars and resulting sheen color factors outside [0,1] produce a specific error before changing the clone color; the helper does not clip. Its existing failure cleanup disposes any temporary clones.

## Focused native retry

The amended `review/reference-cloth117-export-native.mjs` defaults to the production exporter. Choose120 explicitly:

```bash
CLOTH117_EXPORT_MODULE=candidate120 node review/reference-cloth117-export-native.mjs
```

The override selects **both** `createPortraitExport` and `exportPortraitGLB` from the same candidate module. Production main remains unchanged. The result records the selected module and its SHA256, plus the original frozen117 failure provenance. Candidate120 output uses a separate prefix so it does not overwrite the original production117 failure report:

```text
output/qa/cloth117-export120-native-result.json
output/qa/cloth117-export120-source-front.png
output/qa/cloth117-export120-source-garment.png
output/qa/cloth117-export120-loaded-front.png
output/qa/cloth117-export120-loaded-garment.png
output/qa/cloth117-export120-restored-front.png
```

The existing torso test keeps its exact atlas/bump bytes, UV, topology, material-factor, source-resource and cleanup checks. It now records source/prepared/serialized/loaded sheen and checks the live source sheen scalar, color object, color values and roughness at every integrity checkpoint. It retains the native compositor eye patches and the same paired front/garment views. Every rendered preview uses the app's normal offscreen render path; there is no standalone `compileAsync` call.

For the120 override only, three tiny fixtures also pass through the installed exporter/loader: positive constant sheen, positive sheen with a color map and roughness map, and zero sheen with those maps assigned. They use one shared triangle and two authored 2×2 textures. The test requires exact mapped pixels, orientation, UV transforms, scalar/color products, zero-extension omission, independent clone metadata, unchanged source values/versions and cleanup. These fixtures never enter the portrait scene or renderer.

## Local verification

Run `node review/export-portrait120-audit.mjs` to repeat the dependency-free checks. The script checks 13 normalization cases, seven source-injection cases, syntax for both modules and both generated entries, and exact preservation of the accepted104 exporter logic. It writes `review/export-portrait120-audit-result.json` with source hashes and the separate bounded-color feasibility analysis.

These checks execute the actual new normalization function with simple color objects. They do not claim to exercise Three, its renderer or glTF loading locally. The native fixture and actual torso roundtrip remain pending root's Mac run.

## Separate collar/placket color bounds

This is a distinct pre-existing issue and is not changed by120 or the focused torso test. Current `src/blouse.js` converts these source colors to linear values and multiplies them by 1.28:

| Material | Linear red | Linear green | Linear blue |
| --- | ---: | ---: | ---: |
| Cotton |0.860727241|0.888155854|0.983233468|
| Collar |0.973471366|0.993052439|1.063385442|
| Placket |1.002928373|1.012861364|1.083997736|

The full-precision values are calculated from the source constants in the audit result. The collar-fold tubes receive white vertex RGB through the common mesh helper. The center placket also receives white RGB. Their effective products therefore exceed 1; all three center-placket channels are above the bound, although blue is the largest excess.

An exact absorption is feasible only for a mesh/channel whose original material factor `C` times every vertex component `V` already lies in [0,1]. One can choose `Cprime=min(C,1)` and set an export-only vertex attribute to `Vprime=C×V/Cprime` for nonzero channels. Alpha and all other buffers stay shared and unchanged. Constant multiplication commutes with triangle interpolation, so the physical color is preserved apart from Float32 re-encoding.

That method **cannot** handle the demonstrated white-vertex collar folds or center placket while keeping every standard glTF factor bounded. The product of a bounded base-color factor, a bounded vertex color and an ordinary bounded base-color texture cannot exceed 1. A texture bake cannot create the missing headroom for these untextured white vertices. Preserving those values exactly requires an explicitly supported nonstandard representation; a bounded standard-glTF conversion would necessarily change some effective albedo. No clipping, emissive compensation, lighting edit or silent approximation is included in120. A later choice needs its own measured native material review.
