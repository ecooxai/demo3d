# Iteration 145 — existing manual facial correspondences

**Read-only diagnostic completed. Retain production 141 at 77/100.** No geometry, source mapping, material, camera, display setting or production code changed. The measurement motivates one separate, bounded eye-contour candidate147; it does not establish a new likeness score.

## What was measured

The existing `src/reference-skin.js` table contains35 manually authored correspondences between canonical mesh coordinates and image1. This diagnostic uses its first20 entries: the two iris centers, eight eye-aperture points, four nasal points, five mouth points and one chin control. It does not detect image features, analyze source pixels, add landmarks or treat the original atlas controls as independent anatomical measurements.

The wrapper finds each correspondence on its actual accepted141 mesh, applies the mesh's current world transform and projects it through the ordinary front/detail cameras. A two-iris similarity aligns global framing and roll with the existing source-photo iris coordinates. Residuals are therefore in original-photo pixels, independent of the two tested preview crops. Depth, yaw, hand placement and correspondence error can still contribute to a residual.

Fourteen controls resolve by triangle UV interpolation. Six lie at rounded UV boundaries and resolve to an existing vertex within5e-6 UV: both lower apertures, the mouth seam, both mouth corners and chin. They are explicitly marked as boundary matches. Both triangle and fallback queries for `continuous-face` use only vertices referenced by front material group0; the face also has a separate rear group. Where canonical UVs tie, maximum localZ selects the front candidate.

The corrected wrapper and report are `likeness145-native.mjs` and `likeness145-native.json`. The initial14-match pass is retained separately in `likeness145-before-boundary-match.mjs/.json`. Its unselected nearest-vertex information must not be substituted for the corrected matched surface.

## Corrected result

Both native front and detail passes match20/20 selected controls, with the same photo-space residuals to floating-point precision. Native WebGPU used the accepted900×1200 display, Neutral1.4 and AA2. Projection took60.3ms and92.0ms; browser errors were empty. These are diagnostic timings, not added production costs.

PositiveX means the mapped mesh point is right of the manual source control. PositiveY means it is below it.

| Existing control | X residual, photo px | Y residual, photo px |
|---|---:|---:|
|Near iris center|0.000|0.000|
|Far iris center|0.000|0.000|
|Near outer canthus|0.008|−4.014|
|Near inner canthus|4.353|−8.989|
|Far inner canthus|−12.474|−14.758|
|Far outer canthus|−2.164|−8.245|
|Near upper aperture|4.114|−4.320|
|Near lower aperture|−3.235|−3.011|
|Far upper aperture|1.114|−3.320|
|Far lower aperture|−2.235|−5.011|
|Nose tip|−7.043|−0.690|
|Nose bridge|−12.688|2.788|
|Near nasal wing|−14.437|5.641|
|Far nasal wing|−9.290|7.883|
|Mouth seam center|−3.367|2.203|
|Near mouth corner|−5.681|3.584|
|Far mouth corner|−2.247|4.024|
|Upper lip border|−10.493|3.269|
|Lower lip border|−7.692|−3.805|
|Front chin UV control|−36.545|3.997|

## Decision and limits

The nose-tip and mouth-height residuals do not justify undoing accepted50's overall proportion correction. The aperture points suggest a smaller asymmetric eye-contour experiment with the measured iris centers pinned. Candidate147 may move the common head surfaces through one bounded continuous field and must be judged in ordinary native images. Pinning iris centers does not imply preserving every point or the entire shape of either iris.

**These are owned-surface correspondences, not ray-certified visible landmarks.** In particular, the front chin UV control is on the physical bottom ring. It has not been shown to be the visible chin outline or to clear the neck. Its large horizontal residual is not evidence by itself for changing chin depth, jaw width, yaw or pose. An occlusion and silhouette check would be needed before using that value for geometry.

The eight aperture controls are also manual approximations. Exact numerical fitting would not establish better facial identity. A candidate can pass a correspondence test and still worsen the expression, eyelid shape, corneal appearance, fringe contact or profiles. Preserve current141 until native visual review demonstrates a gain.

Corrected native report:85,962bytes, SHA256 `e3d6da292dd4fcb9d52bdcab5a4fe31871d0b291fae514c883f969525c4a744b`. Source correspondence code SHA256 `c20bf43aa89e5cfbbc658a39b599148588ab844701db5fa51aef7a69449b0c73`. The sole image1 JPEG SHA256 remains `ef577a4eb5a7da2ab153cb93d0540760f756c23cb8d8fcba7271d6bd15976174`.
