# Jaw and ear159 — actual native interpretation

## Recommendation

**The measured attachment problem that blocked155 is resolved in159's sampled support checks.** I favor the smoother selected jaw shape at **78/100**, without an additional point. All twelve supplied159 images have been reviewed against the sole reference and the accepted157 appearance. Ordinary front/detail improve the broad taper; neither profile nor the back shows a new visible defect at the supplied scale.

The far-ear oblique camera looks across the cheek and hides most of the ear. It is therefore inadequate as the close attachment/art gate. The narrow opposite-side OFF/ON close pair being prepared by Quality42 is justified by the new fixed-hair contacts below. Subject to that pair showing no exposed root gap or hair/ear defect, I find no current source, geometry or sampled-support blocker to adoption. No wider contact or field sweep is requested.

## Authoritative evidence

Native1864 report: `review/jaw-ear159-native.json`, **375,938 B**, SHA256 `3c3a08201ad8397462b7e7f7d68d1421aa66352cb2a6e54f81cf612f984155f9`. Its status explicitly separates completed native checks from pending visual/interface interpretation. The matched camera records are exact across the two fresh pages.

The actual face/neck output matches all ten selected155 attribute records. The current157 source matches the twenty original records for face, neck and both ears. The existing155 certificate is reused with the identical actual mouth bounds; no field-grid rerun was performed.

## Ear support and emitted geometry

| Ear | Baseline samples within 0.005 directional band | Released samples | Lost AFTER face hits | Maximum AFTER offset of baseline-band samples |
| --- | ---: | ---: | ---: | ---: |
| Left / near | 896 | 0 | 0 | 0.00493659890 |
| Right / far | 1,159 | 0 | 0 | 0.00483679803 |

The far ear previously had 257 released samples and a 0.05297406 maximum after offset when155 moved only the face/neck. Under159, the face and ear are queried at their respective original/deformed positions, and none of those baseline-band samples leaves the band. There are no missing directional face hits on either side. One far-ear sample changes from a nonpositive to positive axial offset, while remaining within the band. The largest increase over **all** right-ear samples is 0.00527208; it is a different statistic from release of baseline attachment samples.

These are outward-axis support measurements, not signed shortest distances, penetration depths or proof of a continuous weld. The finite triangle contact result below remains separate.

The near ear is effectively unchanged: two positions differ, with maximum displacement 1.2644e−7; only ten triangles change. The far ear has 4,691 changed positions and 9,472 changed triangles, with maximum displacement 0.06472891. The far-ear minimum area ratio is 0.88416856, and the minimum cosine to the transported geometric normal is 0.99998326. Neither ear has a new degenerate triangle, a reversal against the original, or a geometric normal opposed to the field-transported expectation. These geometric-normal checks are distinct from authored shading-normal transport.

## Actual contact identities

Counts include only candidate pairs with at least one changed triangle. They are not complete scene counts. The near ear contributes no contact in that filtered scope.

| Far-ear partner | BEFORE | AFTER | Retained | New | Removed |
| --- | ---: | ---: | ---: | ---: | ---: |
| Co-moving face | 499 | 499 | 497 | 2 | 2 |
| Fixed CROWN | 183 | 146 | 40 | 106 | 143 |
| Fixed DETAIL fibers | 163 | 166 | 32 | 134 | 131 |
| Fixed WISPS | 132 | 88 | 4 | 84 | 128 |
| Fixed MASS and fringe | 0 | 0 | 0 | 0 | 0 |

The face retains 497 of 499 contact identities. The two new and two removed pairs meet the same face triangle 50149 and occupy the same photo bin, X 688–704/Y528–544. The stored new witness has a BEFORE unsigned gap 3.6133e−6 and an AFTER edge/triangle intersection; the removed witness has an AFTER gap 3.3821e−6. This is consistent with a small discrete contact-identity shift while support is retained. It is not evidence that every surface is disjoint or that the change is solely floating-point noise.

Fixed-hair contacts total **478→400**, with **324 new and 402 removed**. The lower total does not erase the new contacts. Full pair IDs show that the 324 new pairs involve **172 front-shell and 152 back-shell ear triangles**, using the source ear's first 5,280 front and last 5,280 back triangles. They cannot all be described as hidden rear contacts.

Every new pair contributes a witness-location bin. Hair bins span photo X 704–752/Y496–592, broadly along the far lateral ear/crown region. Only seventeen individual new hair witnesses are stored. Their worldZ values span −0.11839 to −0.09231, and some previously separated triangle pairs had gaps up to 0.039419 before becoming actual edge/triangle intersections. Those are real geometric intersections at the audit tolerance; their unsigned BEFORE distances are not AFTER penetration depths. The limited examples do not establish visibility or burial of all 324 pairs. No alpha-map, culling or material assumption is used to dismiss them.

## Visual reading of all twelve supplied images

- **Front and detail:** the lower cheek/jaw transitions are slimmer and smoother while the accepted eyes, mouth and expression remain stable. The old chin/neck shelf remains;159 does not address it. The far ear follows the altered head more coherently, but these views expose little of its inner attachment.
- **Both profiles:** the visible jaw remains natural at ordinary scale. I see no new floating ear edge, added hair strap or changed expression. Existing hair limits inspection of the far ear.
- **Back:** no meaningful visible difference is apparent. No decoded pixel-equality claim is made.
- **Ear-oblique:** both images show mainly cheek, eye and hair. They confirm the same taper from that angle but do not provide the intended ear-root close inspection. The camera direction is the specific remaining evidence gap.

## Source, runtime and cleanup

Both pages pass all 64 mesh bindings and 282 original attribute records. ON owns twenty private attribute records across four geometries. Exact-value native index widening is recorded separately; the final restored source upload also passes. No original geometry is disposed; four private geometries are disposed after restoration, and QA source records/listeners are released. Idle frames and browser errors are zero. The restored ordinary front is rendered and source-checked; this test does not assert full-compositor PNG equality.

The helper takes 32.2 ms. Actual replacement storage is 8,295,776 B before upload and 8,464,736 B after index widening. The same 8,295,776 B of source attributes is temporarily retained for QA, with no prior GPU upload of those original selected geometries before159. These are replacement/temporary-retention figures, not equal permanent scene-memory increases.

The focused interface audit takes 164 ms and peaks at 18,780,248 B of tracked typed arrays, with 52,990,928 B cumulatively allocated and **zero tracked buffers retained**. Renderer and JavaScript-object overhead are excluded. No texture, draw, mesh population or per-frame work is added.

Production remains157/78 until root completes the narrow opposite-side view and adoption decision. Frozen159 runtime files are unchanged by this interpretation. Read-only162 chin proposal work remains separate.
