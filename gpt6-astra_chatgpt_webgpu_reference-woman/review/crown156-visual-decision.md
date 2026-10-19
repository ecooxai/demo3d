# Iteration156 — native coarse visual decision

**Decision: NO-GO. Do not rebuild fines, optimize, export or integrate156.** Root and the hair reviewer independently reject this coarse construction. Accepted149 remains78/100 for this comparison; current production157 also remains78. No numeric production score is assigned to the deliberately incomplete coarse render.

The hair reviewer visually inspected the sole source `reference/image1.png` and all twelve actual native images `review/crown156-coarse-{0,1}-{front,detail,left,right,back,junction}.jpg`. These are the real1889 native captures, not local geometry proxies.

## Visual findings

The ordinary ON front/detail has a wrinkled band across the upper fringe, two conspicuous flat dark triangular patches at the part, and four visible opaque branches. The first two long branches keep substantial width almost to a clipped or split end; the central pointed branch is cleaner but still reads as a rigid strip. The source photograph has a broad continuous left sweep that separates gradually into unequal narrow strands. Its smaller foreground families share that flowing root distribution instead of hanging from a common transverse band.

The left profile adds the narrow long foreground branch without a large lower-hair change, but its top attachment remains abrupt. The right profile is decisive: ON creates a bulky front/part ridge and a pale slit or fin along the newly exposed boundary. The junction makes the folded-looking texture and triangular patches obvious. The back is visually unchanged; no byte-exact back-image claim is made.

This is an ordinary-view failure of the coarse premise. Adding finer fibers would conceal parts of the problem without establishing a useful root-to-fringe structure.

## Geometry, UVs and inherited maps — distinguished

1. **The common band and opaque straps are structural.** `makePlan156` makes two filled polygons bounded by four clefts and narrow branch rails. The branch width function stays broad through most of its route and narrows late. This produces a common frontal bank with a few isolated extensions, regardless of shading. The pale profile boundary and extra front volume also require a geometric/culling explanation; a normal map cannot create an edge outside the surface silhouette.

2. **The clipped/split tips have a specific coverage mismatch.** New branch UV growth runs from.60 to1 (the far branch from.86 to1), while the retained CROWN coverage begins its unequal releases at approximately.905–.98 of growth. Thus it removes portions of the new branches before their geometric endpoint and before all their width has tapered away. This predicts the observed clipped/multiple small tips. Positive UV area alone never established a compatible coverage chart.

3. **The corrugated appearance is a mixed surface/chart problem.** The original procedural normal map has longitudinal lane variation, and100 supplies an additional RGB atlas on the old crown chart.156 interpolates its new UV coordinates with an unweighted harmonic solve over irregularly refined triangles. That solver enforces smooth scalar coordinates and the audit found no reversed triangles; it does not guarantee a consistent physical frequency, a hair-growth-aligned tangent field, or uniform UV conditioning near clefts and the shared part. The new surface therefore samples and orients the unchanged maps differently. Coarse OFF already reveals some wavy grain when its existing fine layer is hidden. ON makes that grain sharply kinked and irregular.

4. **The exact split between geometric normals, tangent-space normal response and RGB sampling is unmeasured.** No no-normal-map, unlit or neutral-material isolation was rendered. The native report proves the actual post100 RGB, coverage and normal-map inputs match across the pair; it does not prove identical appearance on new geometry/UVs.100 did not create the original normal map. It would be inaccurate to blame all wrinkles or flat triangles exclusively on100, on the normal map, or on the depth solve. No optical rescue of156 is recommended.

## Native evidence

The full native report is `review/crown156-coarse-native-report.json`,1,574,409bytes, SHA256 `4dec29fc14bb7b3a84504b5884d917359b1b857a09ad5d143a0ce91de8999c7a`.

All four cases used native WebGPU, had zero nonfinite attributes and no browser errors, and rendered zero idle frames. Accepted149 and the review ZERO control match exactly in both front and detail PNGs/decoded pixels. Both coarse cases restore their original detail exactly and release back to the accepted full-detail image exactly. `post100PairExact` is true.

The native ON helper took475.4ms, including60.7ms for actual-head support indexing,102.1ms initial triangulation,136.5ms refinement,29.6ms the harmonic UV chart and90.2ms attribute/support emission. Coarse OFF/ON have914,916/912,617 hair triangles and50.840/51.098MiB of measured post-upload geometry respectively. These figures are technical evidence, not art acceptance. No performance sweep followed the rejection.

The frozen source handoff retains the17 oblique interior misses, max distance.091719 from the independent intended boundary, and the associated surface/support qualifications. The new visible profile slit is consistent with a coverage/boundary risk, but it has not been ray-matched to a particular one of those samples, so that correspondence is not claimed.

All156 code, handoff, native report and images remain frozen. A separate163 proposal describes a different, simpler topology; it is not authorized implementation.
