# GPT-6 Astra Pro / ChatGPT — independent visual review 111 and 117

Date: 2026-10-18. Baseline: production 112, with the accepted 108 groom and prior 100/104/106 changes. This review examines the supplied native Mac captures against the sole original `reference/image1-color.jpg`. No production code, geometry, lighting or assets were changed during review.

## Decisions

| Study | Decision | Overall portrait score |
| --- | --- | --- |
| Hair 111 mode 0 | Retain as production baseline. | 76/100 |
| Hair 111 mode 1, private longitudinal normal field | Keep as a completed review study; do not integrate. | 76/100 |
| Hair 111 mode 2, the same normal field plus weak pigment | Do not integrate. | 76/100 |
| Cloth 117 strength 0 | Valid baseline; slightly less convincing front-panel shading than strength 0.5. | 76/100 |
| Cloth 117 strength 0.5 | Prefer and accept as a small material improvement, subject to root's final integration decision. | 76/100 |
| Cloth 117 strength 1 | Reject this strength because the lower folds become too heavy and partly duplicated. | 76/100 |

The half-strength cloth improvement is localized and does not justify another whole point for the portrait. None of these studies establishes the requested 95/98 quality level.

## Hair111 visual findings

Viewed `strand111-{1,2}-{front,detail,left,right,back}.jpg`, `strand111-0-{front,back}.jpg`, and matching baseline `torso110-0-{detail,left,right}.jpg`.

Mode 1 adds faint, continuous lengthwise detail, most visible on the back and profile lengths. The lines follow the existing locks; I see no return of the 107 photograph-pattern fingerprints, a new phase seam, or a new silhouette defect. Mode 2 does not provide a clear additional improvement over mode 1 in these captures.

The material change remains small at ordinary portrait size. Broad opaque lock sections, their large bends and the separation between those sections still determine the hair's appearance. The reference has much richer visible strand separation, irregular fine highlights and a softer aggregate shape. Candidate 111 changes the surface response without materially closing those larger visual differences. Retaining mode 0 is the better production choice for the demonstrated benefit and added resources; mode 1 remains the stronger of the two experimental variants.

## Hair111 technical disposition

The supplied `hair-strand-normal111-native-result.json` confirms all three modes passed every staged check, with zero browser errors and zero idle frames. Modes 1/2 constructed in 22.0/34.2 ms on the native machine. Both use the same verified normal-field hash.

The corrected diagnostic now confirms that the earlier mode 0 failure was native index storage widening: CROWN's 143,232 and WISPS' 94,824 index values changed storage from Uint16 to Uint32, with every value exact and original source-array hashes unchanged. BufferAttribute versions were unchanged. The 476,112-byte index-storage increase occurs in all three modes and belongs to the renderer baseline. Cleanup restored the original material/color references and disposed only each mode's owned resources.

No further 111 correctness testing is needed for this artistic rejection.

## Cloth117 visual findings

Viewed `cloth117-{0,50,100}-garment.jpg`, `cloth117-50-front.jpg`, and all five full-strength views. The half-strength side/back views were not supplied; the full-strength profile/back checks are evidence for the same bounded mask at its strongest setting, not direct observation of half-strength captures.

Strength 0.5 gives the central and lower front panels a little more of the reference's soft cotton shading. The improvement is easiest to see around and below the lower buttons and beside the curved placket. It preserves the restrained white appearance in the full portrait and avoids turning every sampled shadow into a prominent new wrinkle.

At strength 1, the viewer-left lower panel develops a broad extra dark trough beneath the existing diagonal fold. The two cues compete and can read as a duplicated or inflated fold. The stronger shading beside the lower placket also attracts more attention than it should. This is visible in the isolated garment view and survives into the full portrait.

I see no new source-patch boundary, sleeve/back stripe, or collar/button contamination in the supplied full-strength views. The source polygons and mask are constrained to cotton interiors; the helper explicitly describes the content as photographic shading, not measured albedo. The selected 0.5 value should keep that shading subordinate to the real mesh folds.

This selection accepts the supplied garment material treatment only. It does not establish new geometric wrinkles or lighting-independent cloth albedo. The native geometry/UV preservation evidence is consistent with the visual comparison.

## Integration recommendation

Keep 111 disabled. If integrating 117, use strength 0.5 and preserve its existing pre-balance registration order, geometry/UV layout, original source-image restriction and release path. Keep the overall score at 76/100. The next material or grooming study should be evaluated against this explicit baseline rather than treating a successful technical build as a visual score increase.

Metric terminology: 117's `sourceSamples` counter counts atlas texel samples that map into the photographed cotton polygons; it is not a count of distinct source-photo pixels.

## Follow-up: legal base-color atlas

Root replaced the original 230-headroom material treatment with a complete bounded RGB atlas and a white material factor, preserving the source geometry and other settings. I reviewed the revised `cloth117-legal-50-front.jpg` and `cloth117-legal-50-garment.jpg`; they retain the same small visible improvement at the supplied size. Root's revised native report measures 25,861 clipped channel values, maximum unclipped color 1.016244 and maximum neutral linear quantization error 0.002430. These are explicit bounded losses, not a lossless conversion of the previous appearance.

The selected strength remains 0.5 and the overall score remains 76/100. `reference-cloth117-export-native.mjs` provides the focused pending export comparison: production exporter, legal torso factor, exact opaque atlas pixels, retained `EXT_materials_bump` weave, exact UV/topology/color values, source immutability, and source/loaded torso images through the ordinary native render path. Native execution of that focused test belongs to root.
