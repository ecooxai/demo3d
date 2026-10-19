# Iteration146 — independent coarse visual decision

**Decision: NO-GO. Do not rebuild the dedicated fine layer on this coarse shape, integrate146, or begin export work.** Keep accepted141 at77/100. This is an isolated structural diagnostic with the same old owned fine ranges hidden in both modes, so no production-quality score is assigned to either146 image set.

The independent hair review visually inspected the sole reference and all twelve local captures `crown146-coarse-{0,1}-{front,detail,left,right,back,junction}.jpg`, beginning with ordinary front/detail. Candidate source and the native wrapper remain frozen.

## Visual reasons

| View | Independent finding |
|---|---|
| Ordinary front | ON introduces a dark, straight-edged corner below the part. It is visible at portrait scale, so this is not solely a magnified texture complaint. The forehead opening becomes more sharply cut. |
| Detail | The new left bed projects into the center as a broad triangular bank over the fringe roots. The accepted lower bows remain recognizable, and the left upper transition is somewhat longer, but their roots still appear to emerge below a separate solid cap. |
| Junction | ON's terminal fan becomes a pointed sheet corner. Its diagonal lower edge and small adjacent notch are stronger than OFF's already imperfect release. The crown-to-fringe region still reads as a surface boundary rather than overlapping strands flowing out of the part. |
| Left profile | No new large gap or obvious floating loop. The outer silhouette and ear region remain stable. The limited upper-fringe depth change is insufficient to compensate for the front-view bank. |
| Right profile | Broad coverage and lower silhouette remain stable; the front root contour changes slightly. It does not establish a more natural part or release. |
| Back | No visible change. The native back PNG hashes are exactly equal. |

The reference has unequal overlapping locks running from the part across the left sweep and into several narrow bowed strands. It does not show this exposed geometric corner over the central roots. The coarse gate was specifically intended to establish a convincing bed and hem before fine rebuilding. Adding back fine ribbons to conceal this corner would skip that gate.

The frozen endpoint rail offers a direct structural explanation for the new corner: on the left its endpoint rises fromY1.098 at u=.935 to1.112 at.950, then falls through1.066/1.047 toward the shared terminal point atY1.034720. The entire final column closes there. The surface is mathematically ordered and shares a valid normal limit, but its exposed hem still forms a broad descending corner. This is a source-based explanation of the visible silhouette, not a claim that one triangle or material contribution has been independently ray-isolated.

Both coarse cases expose old100 texture knots because the same575 dedicated crown ribbons and310 edge wisps are hidden. The ON/OFF comparison is therefore useful for this coarse shape decision, but neither should be described as the full production groom. Actual100 RGB also differs between modes; its normal-weighted rebake can change contrast. That qualification does not remove the clearly changed geometric boundary. No material, alpha or strength rescue is proposed.

## Native evidence

The local native summary identifies the canonical full Mac report as300,580 bytes, SHA256 `6d850fde8d7fd54ca40fbddaf6241959e432ad9922d6e7d87ea9b355eec4b168`.

| Check | OFF | ON |
|---|---:|---:|
| Native WebGPU |true|true|
| Errors / nonfinite attributes |0 /0|0 /0|
| Source hair triangles |1,114,888|1,114,888|
| Coarse rendered hair triangles |1,070,108|1,070,108|
| Geometry |52.49MiB|52.49MiB|
| Construction |1880.7ms|2011.7ms|
| Recorded JS heap |354.145MiB|390.719MiB|
| Strict restored detail PNG |exact|exact|

ON adds131.0ms, approximately6.97%, in this paired native construction. The single recorded heap readings are not a retained-memory or GC-controlled comparison.

Actual post100 atlas RGB hashes differ: OFF `cccf4341748b12c9bb4104709c2820565a6cb5f139d6d6e4221a22827a617a6a`, ON `3966a97a47b95af8d6bdbcfe82d2647f63aade4b4950074b388df6ca7a7157de`. Coverage, normal-map bytes, UV1 and compensated vertex-color hashes are equal. The back PNG is equal at `b370d1e238e48685333adb6e8649d43f898919374b2ebe269117ed251c66d2aa`.

## Why93.885 and4.909 are different measurements

The frozen helper's metadata name `maximumCutCurvatureJump` is imprecise. It records a **curve-parameter second-derivative difference**, not geometric curvature. The source audit separately computes a geometric-curvature magnitude difference.

| Record | Definition | Sampling / population | Units and interpretation |
|---|---|---|---|
| Native helper `maximumCutCurvatureJump=93.8851983751` | Maximum norm of `r''(cut−.0006) − original''(cut+.0006)`, where primes use the original normalized curve parameter t | Central second difference with h=.0003; all1,135 owned source slots, including omitted cores | Local distance per squared parameter unit. Includes changes in parameter speed as well as normal bending. It is not a curvature value in inverse length. |
| Source audit `maximumGeometricCurvatureJump=4.9090527443` | Maximum absolute difference of scalar `κ = |r' × r''| / |r'|³` on the two sides of the cut | Samples at cut±.0003 with derivative h=.0001;938 actually emitted strands | Inverse local length. Removes parameter-speed dependence, but compares scalar curvature magnitude rather than the complete curvature vector. |

These use different definitions, sample offsets and populations; they are not interchangeable numbers or a fixed-factor conversion. The source helper's own raw result93.8851983729 agrees with native93.8851983751 to about2.2×10⁻⁹. There is no evidence of a native-versus-source mathematical discrepancy.

Both are finite-difference measurements near the join, not an exact analytic evaluation of the limiting curvature discontinuity. The candidate was explicitly C1, not C2. Its measured lower tangent agreement and exact protected rows remain valid, but they do not establish equal curvature or an acceptable rendered junction. The rejection here is driven by the ordinary-view coarse bed and part corner.

## Next action

Stop fine rebuilding for146 and retain all frozen evidence. Await the joint structural decision before authoring a new candidate. No extra sweep, source change, fine-density increase, material adjustment or export characterization follows this rejected coarse gate.
