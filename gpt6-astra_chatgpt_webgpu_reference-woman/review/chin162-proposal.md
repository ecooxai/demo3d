# Chin162 — closed lower-face and upper-neck junction proposal

## Proposed improvement

Replace the small intersecting lower-head/upper-neck region with **one smoothly joined submental surface**: a rounded chin that turns underneath into the front neck. Preserve the accepted mouth, upper face, lateral jaw above the repair, lower neck and clothing. This is a bounded topology and profile repair, not a new face proportion study.

The proposed first candidate is OFF/ON only. No geometry, material, atlas or diagnostic code has been implemented. Current accepted production is157/78;159 remains subject to its final close attachment review. If159 is adopted,162 should be built from those actual prepared vertices, after159, so its upper and lower boundary curves carry the selected taper.

## What the source and existing images establish

I viewed the sole `reference/image1.png`, all six160 original/clay/unlit jaw images, and both161 head-only clay images. The source photograph shows a soft rounded chin with a short natural transition into the neck. The current model has a conspicuous broad, rather straight lower edge and dark shelf. Uniform lit clay retains that shelf. Unlit original color softens its darkness but retains the geometric boundary. Removing the neck makes the head-only outline more rounded, while exposing a small bottom slit and retaining some central flattening. These observations support a junction/profile correction; they do not identify every visible pixel's triangle or justify repainting the lower face.

In `src/face.js`, the lowest profile sample is authored Y −1.18, half-width 0.015, front depth 0.20 and rear depth 0.13. The next sample, only 0.06 higher, has half-width 0.160 and front depth 0.40. The “rounded chin cap” code modifies only the width interpolation. `createHead()` still emits circumferential rows, joins adjacent rows, and never closes the first row. The last lower ring is narrow in X but extended in depth; it is not a closed rounded underside. Later pose/proportion maps deform that opening but cannot close it.

The neck is independently generated as an 80×44 circumferential grid, from authored Y 0.69 to 2.08. Its upper ring is seated inside the mandible. At the top, the nominal width 0.438 is reduced by 0.053; the centerX offset −0.154 is shifted by +0.024, while front depth is 0.239 before the −0.020 offset and local surface relief. It is an overlapping second surface with its own normals and color map. The distinct head and shoulder frames are then carried through the accepted proportions, pose and99 balance.

This explains why a neck setback alone is incomplete: it can expose the original open lower ring and does not repair the head's depth profile. A flat disk over that ring would close the hole while leaving the intersecting shelf and could introduce a new flat underside. Neither is the proposed candidate.

The152 chin UV point is hidden by the neck in the frontal scene. It is **not** a visible silhouette control. The existing161 head-only shape is useful as geometric context, not as a license to force that buried point to a photograph coordinate.

## Bounded surface ownership

I recommend a local annular junction that replaces the two overlapping bands and continues into the retained neck, rather than placing a third sheet over the overlap.

The initial boundary proposal, to be aligned before implementation, is:

- **Upper boundary:** original continuous-face row 24, with its existing 380 angular segments. Its authored construction Y is approximately −0.95490, below the mouth; use its actual prepared positions and adjacent surface direction after all selected maps. Every original face triangle/attribute above this boundary remains unchanged. The mouth, eye and ear meshes are outside this ownership.
- **Lower boundary:** neck row 32, with its existing 80 angular segments, at authored Y ≈1.70091. Keep that row and the lower neck exactly fixed. Remove only the neck triangles above it that would otherwise overlap the replacement. This boundary stays above the collar support.
- **Circumference:** close the junction around the complete loop so no side slit is left at the end of a front-only patch. The anatomical shaping is concentrated on the anterior chin and submental return. Posterior/side continuation should follow the existing outer support with minimal shape change; it cannot simply be declared hidden by hair.

The row numbers refer to the original construction inventory, not current UV-Y. The face's present UVs were reassigned from its already warped coordinates before later proportion/pose changes. Treating those UVs as the original profile's Y parameter would be incorrect. The front/rear face indices are also reordered into material groups; an ownership cut must use original vertex-row membership, not a guessed contiguous index interval.

Those two cuts would retire about 18,240 lower-face triangles and 1,920 upper-neck triangles. A replacement of roughly 6,000–10,000 triangles is sufficient as an initial budget; it should not increase total detail merely to hide an unresolved profile. Exact emitted counts and boundaries would be frozen with the source study. A zipper between the existing 380- and 80-segment boundary loops avoids T-junctions without changing retained boundary vertices.

“Closed” here means a closed exterior junction between the retained face and neck, with no exposed lower ring or intersecting visible sheets in this region. It does not claim to repair unrelated global mesh boundaries such as the existing eye apertures or crown end.

## Profile and normal mechanism

Construct the junction in one actual common frame, using the prepared head and neck matrices. Align the angular correspondence from their actual front/side axes; do not assume the independently posed head and neck share an identity transform.

Each anterior section should have one softly convex chin lobe, turn underneath, then join the front neck with a continuous tangent. A constrained quintic Hermite loft can match the retained boundary position and first jet, with curvature matching where the original section is smooth. Its interior guide comes from the actual lower-head exterior already visible in161 and the retained upper-neck support. It must not continue the old rapidly shrinking ring as a pointed or flat terminal cap.

The shaping freedom should be small: start with a ≤0.02 world-unit allowance for additional forward/downward chin departure from the existing head-only exterior, and preserve the current outer-jaw curve above the owned band. That is a proposed visible-profile envelope, not a measured displacement result or a claim about the length of newly created connecting geometry. If a natural joined profile cannot fit the bounded region, return the concrete conflict for scope review rather than silently widening the edit.

Compute the new surface's normals from its own analytic derivatives. Keep the protected original normals outside the band unchanged. Measure boundary tangent/normal agreement and actual emitted triangle orientation separately: copying a boundary shading normal does not prove a geometric C2 join, and smoothing normals alone would leave the surface shelf. The new topology does not inherit159's continuous-map certificate.

The lower-face material has front/rear slots and the neck has an independent material. The actual front face uses roughness 0.53, specular intensity 0.23 and a 0.04 atlas-based emissive fill; the neck uses roughness 0.56, specular intensity 0.265 and its separate neck color bake. Therefore a welded geometric surface can still show a material/UV seam. That risk must be explicit.

For the initial geometry study, retain the actual source materials and map references and preserve all existing atlas bytes. New upper-band coordinates should inherit the existing face chart and the lower band the neck chart; do not reproject the mouth or change source registration. A material boundary must not be placed across the new foremost chin turn by convenience. If the coarse geometry succeeds but the final color boundary remains visible, a small source-derived transition for this new band would need a separate concrete mapping specification, using only the two existing image1-derived maps and fixed endpoint physical responses. No global skin recolor, lighting change or optical parameter sweep is proposed.

## Specific visual risks

| View | Risk to reject |
| --- | --- |
| Ordinary front/detail | A longer or pointier chin, loss of the selected jaw taper, a new straight albedo line, or a soft swollen shape that replaces the shelf without improving likeness. |
| Near profile | Excessive chin projection, a hooked underside, a sharp neck angle, or an apparent gap under the jaw. |
| Far profile | A twist caused by mixing head/neck frames, an asymmetric hollow, or a new skin/hair contact exposed by the159 taper. |
| Back | An open join, waist-like neck narrowing or a lumpy posterior connection visible through the existing hair. No source photograph exists for this view, so judge natural continuity without claiming reference correspondence. |

The already selected mouth, eyes, ear shells and hair remain unchanged. Only the actual repaired surface and its fixed boundary neighborhoods would need new orientation/contact checks. The first native comparison should use ordinary views plus the matched jaw/oblique cameras already established by160/161. A narrowly matched clay pair may confirm geometric ownership, but no new diagnostic is requested or run by this proposal.

## Provenance and status

Source read: actual `src/face.js`, `src/blouse.js`, `src/reference-skin.js`, `src/reference-neck.js`, `src/portrait-proportions.js`, `src/portrait-pose.js`, `src/portrait-balance.js`, and the live157 preparation order. Main remains 21,796 B, SHA256 `03fccbaf4fd627128733b9c522025c09293b1d130fd6ae89c4a61170bb146ea5`.

Existing evidence: `review/chin160-diagnostic-native.json` (10,733 B; SHA256 `df263a4774edf14c6d9ce9ebc816b2e1476fcf8d69fbdd575bbe5bb9f752224d`) and `review/chin161-head-only-native.json` (8,235 B; SHA256 `4f78b5a8b366e24677a736b2b57468a3500ff011e03cc8c9f0d5630651dc7b23`). Both diagnostics restored original bindings, disposed only their private diagnostic materials, and reported zero browser errors/idle frames. No new native run, image extraction, asset, production edit or geometry implementation was made for162.

**Requested alignment is the two boundary loops and the connected-junction scope.** This proposal does not yet freeze a profile, promise a score gain, or claim the color transition is solved. Current quality remains 78/100.
