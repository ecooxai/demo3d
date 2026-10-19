# Hair color 149 — independent visual decision

Reviewer: GPT-6 Astra / ChatGPT, `/root/quality_review_42`.

**Recommendation: accept mode 1 as a modest color correction. Overall score remains 77/100; mode 0 also remains 77/100.** This verdict was sent to root before receiving root's artistic verdict. Production adoption belongs to root.

## Evidence viewed

The sole uploaded reference, `reference/image1.png`, and all fourteen native comparison images: `hair-color149-{0,1}-{front,detail,left,right,back,hair,hair-oblique}.jpg` in this directory. The comparison uses accepted 141, with the same camera, lighting and Neutral 1.4 display settings in each paired view.

The reported isolated change is the same linear RGB multiplier, `(0.65, 0.69, 0.75)`, applied to the original color of all five existing hair materials. No geometry, specular settings, normals, alpha, vertex colors, textures, lights or display settings change. The visual decision below does not depend on the source checks earning any quality points.

## Visual findings

Mode 1 improves the frontal color impression. Its deeper, cooler brown is closer to the reference's dark brown hair and reduces the dusty, comparatively warm cast of mode 0. The improvement remains visible in the ordinary full portrait, rather than requiring only a large crop. The lengths and crown retain a coherent color relationship; I do not see a newly introduced layer-color step of the kind exposed by earlier selective material darkening.

The detail and enlarged hair views retain the same fine signal, with a little stronger separation between the existing dark groups and their highlights. This is a contrast consequence of the base color change, not new strand hierarchy. The main fringe shapes, opaque crown bed and artificial cap junction remain unchanged.

Both profiles remain visually stable in geometry and coverage. The existing pale crown glare at the far profile is more conspicuous against the darker base, but I do not see a new discontinuity that outweighs the modest frontal color benefit. The unsupported upper shoulder bridges and regular lower locks remain substantial defects.

The back is darker and still has a broad, smooth, sheet-like response. It does not acquire convincing unequal clumps or depth. In the hair-oblique view the unchanged broad silver highlight remains the clearest limitation: it still reads as a large coherent panel rather than the reference's broken highlights across overlapping strands. Mode 1 slightly increases that contrast and should not be described as solving the material architecture.

## Scope and limits

This is a visual color preference from one supplied photograph, not a measured albedo calibration. The source provides no back or profile view, so those views are judged for plausibility and consistency only. Retain 77 rather than increasing the score for a small, low-cost correction while the crown, shoulder passage and clump structure remain unresolved.

Root reports unchanged geometry at 52.49 MiB and 1,114,888 hair triangles, 26 protected attribute buffers, five materials and four maps, with only the intended material colors differing; zero idle renders or browser errors and exact restored-front PNG. Those checks support isolation and cost, not artistic quality. No additional source audits or strength sweep are requested by this review.

The separate 148 upper-shoulder proposal remains read-only at `upper-shoulder148-proposal.md`. This decision does not authorize implementing 148 or alter accepted production.
