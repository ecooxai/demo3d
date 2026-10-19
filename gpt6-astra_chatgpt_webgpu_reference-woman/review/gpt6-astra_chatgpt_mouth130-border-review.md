# Mouth130 outer-border native art review

Reviewer: GPT-6 Astra / ChatGPT, independent local visual review.

## Decision

Choose geometry strength **1**, retaining the accepted hidden `closed-mouth-crease`. Keep overall quality **77/100**. This is a modest visible repair to the lip join, with the strongest benefit in the matched mouth closeups. It does not establish a large likeness gain or the requested production-quality target.

The root supplied the completed native WebGPU renders. I inspected all 21 images in `mouth130-border-{0,50,100}-{front,detail,left,right,back,nose,nose-quarter}.jpg` against the uploaded `reference/image1.png`. I made no Mac calls, production changes, new renders, or changes to the frozen helper/test.

| Strength | Visual finding | Decision |
| --- | --- | --- |
| 0 | The lower lip has a conspicuously clean elliptical outer edge in the nose and quarter views. Its skin transition looks like a separate raised patch. The earlier pale straight closure tube is already absent. | Retain only as the comparison baseline. |
| 0.5 | The lower boundary softens, but its central and image-right edge remain more sharply delimited than at full strength. A faint curved highlight appears on the upper lip. | A smaller improvement, without a compelling advantage over 1. |
| 1 | The bottom and lateral lower-lip transition becomes more gradual and better matches the reference's soft transition. The repaired lip remains full and the dark closure retains its original expression. A narrow curved upper-lip highlight is more apparent. | Best geometry setting; accept as a small refinement at 77. |

## View-specific assessment

The **nose and nose-quarter** views make the choice clearest. At full strength, the lower lip no longer ends in such a uniformly sharp, pasted-on curve. The skin immediately below it flows more naturally into the vermilion. The reference has a soft lower transition and restrained central highlights; full strength moves toward that relationship.

At **face detail**, the lower-lip improvement remains perceptible. At the ordinary **front** size, the three settings are very close. I see no new change in the mouth corners, closure, expression, nose, eye response, or face silhouette. The improvement should not be overstated as a broad portrait transformation.

The **left and right** views retain the original lip projection and facial profile at the provided scale. The **back** views show no change, as expected for this bounded mouth intervention. I see no new disconnected edge or corner pinch in the supplied views.

## Remaining response issue and bounded next comparison

Full strength produces a thin curved pale band across the outer portion of the upper vermilion, most noticeable in the frontal nose closeup and on the image-right upper lip in the quarter view. It is curved and responds to the geometry strength; it is distinct from the already removed straight crease tube. A softer but still separate-looking lower-lip response is also visible at very close range.

The frozen geometry study kept the material and source atlas exact. Consequently, the change in highlight is evidence of the modified surface/normal field interacting with the existing lip response. It is **not proof** that the remaining band is caused solely by a material discontinuity. The transition curvature and authored normal residual can contribute. Do not promise that a material blend will remove it.

Current source settings provide a concrete reason to try **one** bounded material isolation:

| Property | Lip | Front face |
| --- | --- | --- |
| Roughness | 0.44 | 0.53 |
| Specular intensity | 0.23 | 0.23 |
| Clearcoat | 0.12 | 0 |
| Clearcoat roughness | 0.30 | Irrelevant at zero clearcoat |

With geometry fixed at 1 and the tube still hidden, compare the unchanged lip material against a smooth outer-edge field:

`roughness = 0.44 + 0.09 * m`

`clearcoat = 0.12 * (1 - m)`

Here `m` is one at the interior outer border and fades smoothly to zero by the existing `v = 0.35` boundary, using the established corner gate. Keep the original central response for `v >= 0.35`, the closure and corners, the atlas and its registration, all geometry/normals, and every other material property fixed. This compares one specific face-to-lip response discontinuity without flattening the wet center. It should use ordinary render preparation and portable physical-material inputs; any texture quantization must be reported rather than called exact.

The face also has pore bump and a small sheen response that the lip material does not share. I do **not** recommend adding those to this first isolation: doing so would introduce another explanation for any image change. The retained 0.001 geometric offset also remains; the proposed roughness/clearcoat study cannot establish that it has no shadow contribution.

The material comparison should be judged by whether it reduces the curved band and residual boundary while retaining the original central highlights. If it merely dulls the lips, keep the geometry-only result. No material implementation is authorized by this review itself.

## Native evidence and limits

The root reports that all three native cases passed with browser errors `[]`, unchanged source data/materials/maps, correct restoration, and full disposal of the two private temporary geometries. Native construction was approximately 24.9/24 ms for the nonzero cases; private staged attributes totalled 189,496 bytes. These are technical safety findings, separate from the visual decision above.

The frozen source audit documents the maximum full vertex depth change of approximately 0.005054 head units, unchanged central/seam/corner buffers, finite unit normals, preserved projected triangle orientation, and no new face penetration at its sampled locations. Those findings support the bounded implementation but do not prove artistic improvement by themselves. See `mouth-continuity130-handoff.md` and `mouth-continuity130-source-audit.json` for the full distinctions between geometric transport and authored shading-normal alignment.

Production integration remains owned by the root. This review creates no changes to the frozen candidate or production scene.
