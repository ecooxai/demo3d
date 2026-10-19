# Jaw 155 — native interface interpretation

## Decision

**Hold production adoption of 155 until the face and ears receive a coherent deformation. Retain the accepted jaw-shape assessment at 78/100.** The ordinary front/detail improvement remains useful. This audit identifies a local far-ear attachment regression that the initial artistic review had correctly left conditional.

Root independently reached the same decision after reviewing the existing images. Candidate 159 is authorized to apply the exact unchanged 155 world field to the face, neck and both actual ear shells. It must preserve the accepted 115 ear pose and all existing topology, UVs, colors and materials. No seam filler, arbitrary root-row warp or weakened jaw field is proposed.

## Evidence and scope

The authoritative file is `review/jaw155-interface-native.json`, **196,999 bytes**, SHA-256 `c93dd09eb540dd607bf806cda86434d5c103da50083c50f6b80079d44b07c132`. Root ran native 1817; this author verified the complete local file and interpreted its contents. Production and frozen 155 files remain unchanged.

The audit compares 84,671 actually changed face triangles and 3,563 changed neck triangles with bounds-overlapping fixed ear, eye, hair and clothing triangles. Contact tolerance is `1e-8` world units; reported near distances use a `0.001` search window. Counts refer to triangle-pair identities, not independent physical contact sites. Distances are unsigned, not penetration depths.

I re-viewed the sole `reference/image1.png`, the existing paired 155 ordinary front/detail, jaw-oblique and both profiles. The original complete 14-image artistic review is recorded separately in `jaw-silhouette155-visual-decision.md`. No new render or image-feature extraction was used here.

## Contact findings

| Interface | Before | After | Retained | New | Removed |
|---|---:|---:|---:|---:|---:|
| Face / far-right ear | 496 | 390 | 135 | 255 | 361 |
| Face / fine bowed fringe | 226 | 222 | 51 | 171 | 175 |
| Neck / torso | 149 | 140 | 91 | 49 | 58 |
| Neck / finished neckline | 28 | 30 | 7 | 23 | 21 |
| Neck / right spread collar | 8 | 8 | 8 | 0 | 0 |
| **Total** | **907** | **790** | **292** | **498** | **615** |

All new/removed pair lists are complete, and all new pairs contribute witness-based photo bins. The fall in total contacts does not establish that every new contact is harmless.

The far-ear pair changes occupy photo bins approximately X 672–720, Y 496–592, alongside the original interface. There are 105 distinct moving face triangles and 174 distinct ear triangles among the 255 new pairs. Actual stored witnesses are edge/triangle intersections. This is a displaced intersection boundary, not merely a count fluctuation; the directional support results below explain why it matters.

The 171 new fringe pairs occupy four bins at X 304–336, Y 496–544, involving 21 face triangles and 169 fringe triangles. They remain in the existing near-side fringe/face overlap region, and the paired images show no new ordinary-view poke-through or cut. The report does not establish their complete optical concealment. The existing bounded overlap does not warrant another fringe edit in this task.

The 49 new torso pairs and 23 new neckline pairs occupy the existing neck-opening region at roughly X 416–544, Y 784–832. Stored witnesses range over posterior/side world Z values; a few examples are not proof that every contact is hidden. The paired ordinary/profile images do not reveal a new collar hole or neck protrusion. The eight right-collar contacts are retained exactly. No additional clothing repair is justified by this report alone.

Within this changed-face/neck scope, the audited eye surfaces, crown, main hair mass, independent fine lengths and temple wisps produce no contacts. Most eye meshes are excluded by their actual bounds; the right iris and cornea have no overlapping candidate triangles. This is not a whole-scene intersection-free claim.

## Far-ear attachment is the blocker

The lateral support test samples all 5,282 fixed vertices on each ear. It selects the outermost front-facing facial surface along the actual head's outward X direction. A positive offset means the ear sample lies outward of that directional support; it is **not a shortest signed gap or penetration depth**.

| Measurement | Near-left ear | Far-right ear |
|---|---:|---:|
| Baseline samples inside or within the 0.005 attachment band | 896 | 1,159 |
| Baseline-band samples beyond 0.005 after 155 | 0 | 257 |
| Previously inside samples crossing outward through zero | 0 | 230 |
| Baseline-band samples losing the lateral face hit entirely | 0 | 0 |
| Maximum AFTER offset among baseline-band samples | 0.00493660 | 0.05297406 |

The 257 released far-ear samples represent **22.17%** of that ear's baseline-band population. Release bins span X 672–704, Y 512–608, with most concentrated at X 688–704, Y 544–592. The largest stored releases are on the inner lower-lobe strip, including paired front and back shell vertices with authored ear UVs about U 0.362–0.383, V 0.055–0.150. The worst recorded sample moves from a directional offset of 0.00413505 to 0.05297406. Source `ear.js` confirms these are the independent ear's planar UVs, not a facial-atlas coordinate.

The far-ear face-only ray test reports **410** newly uncovered vertices in the ordinary detail direction and **279** in the jaw-oblique direction. Every such transition is `faceAhead → noFaceHit`. They are vertex samples, not pixel-area counts. Hair, alpha coverage, ear self-occlusion and lighting are not included. The near ear has zero transitions in both directions.

The images corroborate a more exposed far-ear/lower-root edge. No large open background seam is obvious at the supplied scale, and the ear still has face intersections elsewhere; it would be inaccurate to call the entire ear detached. Nevertheless, the combination of a substantial support change and visible extra edge is enough to block unqualified adoption of a change that was intended to leave the ear attachment stable. The source photograph does not expose this far-ear root, so the new edge earns no likeness benefit.

## Why a common-field ear correction is appropriate

The existing face already contains a smooth authored seat for the far pinna (`face.js`, `refineEarBed`). Applying 155 to the face while leaving the separate ear fixed moves that seat away from part of its shell. Applying the **same invertible world map to both surfaces** carries their continuous geometric relationship together without inventing a new attachment profile. Both ears should receive that same rule so the accepted 115 near-ear pose is composed with the new map consistently; the near ear's measured 155 influence is already very small.

This statement applies to the exact continuously mapped surfaces. Their exported/displayed triangles are linear interpolants of transformed vertices, so continuous injectivity does not replace the narrow discrete orientation/contact check. Normals must use the same analytic inverse transpose through the actual prepared mesh frames. Photo Y/world Z semantics and all UV/color/index/material data remain unchanged.

**Fixed hair is the new 159 risk.** The present audit moves only face/neck; it establishes nothing about an ear moved toward or through unchanged hair. Candidate 159 therefore needs a focused OFF/ON moving-ear-versus-fixed-hair contact comparison, actual face/ear attachment evaluation and an ordinary/ear-oblique visual check. The exact 155 field certificate can be reused by provenance, without another full grid. No existing successful 155 count should be relabeled as a 159 pass.

## Native execution and cleanup

The interface audit takes **620 ms**, with **27,359,952 bytes** of peak tracked CPU typed arrays and 83,973,016 cumulative allocated bytes. The ledger ends with zero held buffers/bytes; JavaScript overhead and renderer allocations are separate. Native execution reports zero idle frames and zero browser errors.

All 64 mesh bindings and the 106 relevant original data stamps pass, with six private position/normal/index stamps while ON. Forty-nine exact logical index widenings are observed across the completed lifecycle. Original geometry references are restored; two wholly private replacements are disposed with no source attributes or buffers shared, and zero original disposals. These results establish clean execution and ownership, not artistic or attachment success.
