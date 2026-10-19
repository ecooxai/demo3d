# Iteration146 — frozen coarse crown / upper-fringe gate

**Native-ready coarse diagnostic. Production141 remains77/100. No146 visual score is assigned.** No production source, accepted133, frozen142, material, map or photograph is edited.

Run on the root-controlled Mac from the project directory:

```sh
node review/crown146-coarse-native.mjs
```

The wrapper requires accepted141 main SHA `2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a`. It bundles the isolated groom with `crownFlow146:0` and `:1` on separate fresh native WebGPU pages, retaining133/118/.35 contact/100/140/141. It produces front, detail, left, right, back, junction and restored-detail in both modes. The same OFF junction target is used for ON. Console errors, page errors, strict restored-detail hashes and **actual post100 RGB/coverage/normal texture hashes** are recorded.

## Coarse isolation is identical in both modes

The old dedicated front crown fibers and old front edge wisps have deliberately not been rebuilt. Their exact existing index ranges are omitted from both native views; attributes, original materials and unrelated fibers remain intact. This prevents an incompatible old fine layer from concealing the new coarse shape. It is **not a production coverage or quality comparison**.

| Existing mesh | Side | Source slots k | Vertex interval, inclusive | Ribbons |
|---|---:|---:|---:|---:|
| DETAIL dedicated crown | −1 |868–1149|530766–545993|282|
| DETAIL dedicated crown | +1 |857–1149|592272–608093|293|
| WISPS front edge | −1 |158–309|7900–15499|152|
| WISPS front edge | +1 |152–309|23100–30999|158|

The wrapper checks that every removed triangle belongs wholly to one owned range. It removes44,780 triangles in each coarse page, yielding1,070,108 rendered hair triangles. Original source geometry remains1,114,888 triangles /52.49 MiB in both modes. The independent22 temple/ear wisps,86 flyaways, far-ear94, long-hair DETAIL and all unrelated sheet fibers remain present.

## Actual change

The front sheet is reauthored over its complete growth span, with identity buffers leftu=.755–.790 and rightu=.745–.780. It uses one continuous head-supported depth envelope. Shared part XY remains exact; its frontal depth inset is bounded at.035. An unequal endpoint rail leads into an exactly closed final-column tip with one finite normal. No new plate, carrier, strand population, texture or alpha edit is added.

Upper portions of the938 emitted fringe strands in groups0–5 now follow this field, then take longer descending bows into their frozen accepted133 curves. The original per-strand cuts use head-local Y `.74/.76/.78/.73/.63/.50`. Nineteen unusually short strands receive the stronger protection `t=.90` instead of extending a replacement to their endpoint. All accepted emitted positions and normals at and below the protected cuts are copied directly from the original emission. Group6 is unchanged. The old133 group0 prefix from approximatelyY.90 down to.74 is explicitly released, while its accepted diagonal below.74 stays exact.

The narrow root offset is in depth while preserving the sheet's exact XY course. This avoids converting small derivative changes in the original forehead lookup into lateral/height oscillations. Free bows have ordered descending controls and small 3D width; there is no additional backing surface.

## Focused source result

`crown146-coarse-source-audit.json` passes with no errors or nonfinite attributes.

| Check | Actual result |
|---|---|
| OFF geometry | All five meshes' attributes and indices byte-identical to frozen133 |
| Protected geometry | MASS, all DETAIL, all WISPS, CROWN foundation/rear/side buffers, fringe group6 and protected lower rows exact |
| Source appearance inputs | Colors, UV0, indices, alpha, original map bytes and material constructors unchanged |
| Owned CROWN |4,196 vertices; minimum old/new Y=.443999, above protected.38 region |
| Part | XY delta0; max Float32 depth inset.035000026 |
| Emitted triangles |144 inherited degeneracies plus exactly128 intended new final-column degeneracies; zero unexpected degeneracies |
| Emitted orientation | Minimum dot with the analytic field normal.916593; no opposing triangles |
| Pole | Maximum position and normal disagreement0 |
| Actual head support |36,956 CROWN vertex/centroid/edge-midpoint samples; minimum anterior gap.049160, no penetration |
| Actual fringe support |61,305 owned emitted vertices; minimum anterior head gap.047031, no penetration |
| Downstream fringe |31,263 protected emitted vertices, zero position or normal changes |
| Upper trajectory |938 emitted strands; no sampled upward step; all free-bow Y control gaps positive |
| Lower tangent |Maximum cut tangent difference.00348° |
| Lower curvature |C1, not C2: maximum measured geometric-curvature jump4.909 per local unit |
| Emitted lower join |Max chord turn16.075° versus16.393° baseline; max adjacent ring-normal angle9.513° |

The head check uses the actual original upper head grid and Float32 roundings, including its existing eye openings. Later accepted facial deformations are identity in this owned upper region. It samples actual emitted geometry rather than only testing against the helper's own support function. It is still a finite sample check, not a continuous global intersection proof.

### Facing, occlusion and release are qualified separately

All8,190 changed nondegenerate CROWN triangles face the ordinary front camera, with total area.44744 local units². Of7,693 source-alpha-passing centroids,11 are occluded by another actual CROWN triangle, none by the actual head, and7,682 are unoccluded **within those tested surfaces**. This is not all-scene visibility or pixel coverage: unrelated hair may cover more, and mip/antialias coverage differs. The native views decide whether the exposed bed is a convincing shape or another broad bank.

The unchanged v=.875–1 release occupies .1284→.00774 units across the tested left rail and.1445→.00598 on the right. Relative to accepted133, representative physical fade ratios are leftu=.81:.763, .90:.675, .935:.537, .985:.259; rightu=.865:1.042, .90:.996, .935:.928, .985:.274. This measured terminal compression remains a visual risk near the intentionally collapsed tip. No atlas or alpha disguise has been applied. This coarse stage does not claim an arclength-regularized fine groom.

100 rebakes contrast using current normal-facing weights. Equal constructor maps/UVs **do not imply equal final atlas RGB**. The wrapper records the final hashes separately for both modes, preserving the accepted100 sampling algorithm.

## Cost and scope of this gate

The helper is10,378 bytes. It adds no permanent mesh, draw, texture, strand or per-frame work. The three-model source audit peaked around650 MiB because it holds complete baseline/OFF/ON fixtures and raw audit arrays together. Its source timings were13.6–15.7 seconds under concurrent shared-host load; these are not native runtime measurements. The native wrapper retains only one fresh page/model at a time and reports construction/heap directly.

**Inspect ordinary front/detail first**, then the junction and both profiles. A smooth but flat bank remains a rejection even when the pole and emitted triangles are valid. The coarse fringe's C1 join and the compressed tip must be judged visibly. If the coarse shape is convincing, existing dedicated crown/edge slots can be rebuilt from this same field, followed by the accepted100/104 coverage characterization. Do not integrate or export this hidden-fine diagnostic as production.

## Frozen files

| File | Bytes | SHA256 |
|---|---:|---|
|`review/crown-flow-candidate146.js`|10378|`6409701a815d142048204e1b8ef8703b015805829f50246d650bf51997679068`|
|`review/hair-groom-candidate146.js`|46431|`7708972bd77d85db749e32180d1822278133b151eb68f86695b3665145a6f217`|
|`review/crown146-coarse-native.mjs`|8878|`6a01187a19e65094707d32ccb2aa59f5b4c81b39b9f135837310023da39447c3`|
|`review/crown146-build.mjs`|4576|`a2facc810a3084ffdc15850df9a0a037d78777be6a561b67de8a5a8bce6f9d9b`|
|`review/crown146-source.mjs`|1120|`9cc74a596026c6849b319eb96a3614f00610f374d433c6ccebe9f2d84ea759f9`|
|`review/crown146-coarse-audit.mjs`|16946|`9eeb7043cc6bd8c4d37cfa0d9e9f21513c63ff9545e34d6c6f21f5c0c2e88cbc`|
|`review/crown146-coarse-source-audit.json`|138740|`88f60f45aa7dfa5525fc3222ec58705f84d369f3e06e62a616897e54990256a8`|
