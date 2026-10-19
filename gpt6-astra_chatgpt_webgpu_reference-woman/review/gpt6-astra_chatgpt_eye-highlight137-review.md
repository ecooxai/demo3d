# Eye highlight ownership review 137

## Decision

Keep the accepted physical eye materials, mode 0, at the current portrait score of 77/100. The prominent white catchlight clusters are already present in the final bound image1 atlas and survive the Basic material diagnostic. Their main pattern is source-derived. Reducing iris or sclera specular response does not remove it or provide a visible likeness improvement.

This review supports closing the material-owner question. It does not authorize an iris mapping change, a highlight repaint, or a change to the cornea. The diagnostic does not assign every bright pixel to one component.

## Images inspected

The independent review inspected all eight native captures in `review/eye137-{0,1,2,3}-{detail,eye-detail}.jpg`, both exact bound-atlas PNG crops, and the original `reference/image1.png`.

For a direct view of the original small source features, two manually chosen rectangles were copied without resizing, recoloring or filtering:

| Original image1 crop | Rectangle, left/top/right/bottom | Dimensions |
| --- | --- | --- |
| `review/eye137-source-photo-left-eye.png` | 412, 400, 488, 464 | 76 × 64 |
| `review/eye137-source-photo-right-eye.png` | 591, 435, 663, 494 | 72 × 59 |

These are analysis crops of the user's supplied image, not new art assets. The final bound atlas crops remain the exact files from the native wrapper:

| Actual bound iris atlas crop | Atlas rectangle, left/top/width/height | PNG SHA-256 |
| --- | --- | --- |
| `review/eye137-bound-atlas-left-eye.png` | 280, 786, 114, 86 | `e91901c73e6d8de87a2a387a754cabab6d37c3c1422116755f4597664477d3dc` |
| `review/eye137-bound-atlas-right-eye.png` | 630, 787, 114, 85 | `1c66f1ad5eda4dcc4e8d3e696d1df502721996de26149302ff40063175863378` |

## Visual findings

Mode 1 suppresses only iris specular response. The major clustered catchlights retain their location, outline and visual prominence in both views. Mode 2 suppresses sclera specular and clearcoat, with the iris restored. The large pupil-region clusters again remain. Neither change offers a meaningful visible improvement at the ordinary detail scale.

Mode 3 replaces only the iris and sclera materials with Basic while retaining their actual surfaces, UV0, maps, material colors and output tone mapping. It retains the conspicuous catchlight clusters. This distinguishes the result from the lip diagnostic: the eye pattern does not disappear when these two underlying surfaces stop evaluating physical lighting.

The exact atlas crops visibly contain those same principal bright groups. The original image1 eye crops also contain corresponding multi-part catchlights in the same pupil regions. The left source eye has a vertically extended principal group with a small neighboring bright component; the right source eye has its corresponding compact group above the pupil center. The atlas retains these recognizable patterns.

The original-photo crops and atlas crops have different pixel scales and a different geometric registration. The atlas also looks softer, consistent with its existing bilinear source sampling. These observations do not establish a harmful local warp or a nonlinear expansion of the highlight. I have not asserted an equal-scale footprint ratio or a pixel-intensity amplification measurement. A mapping change should therefore not be inferred from this owner diagnostic alone.

The current portrait can still make the eyes feel more prominent than image1 because the complete face, eyelid surround, image framing and live shading differ. That broader likeness issue does not make removal of the source catchlights the correct edit.

## Interpretation limits

The current corneas remain present in every 137 state. The earlier 134 experiment had already shown that suppressing their reflection response or hiding them did not remove these principal clusters. Together with the visible atlas content, 137 now gives a direct source-map owner for the major pattern. It does not claim that physical iris, sclera or cornea response contributes exactly zero to every pixel.

Basic changes diffuse illumination as well as reflection, and Neutral output is nonlinear. The comparison is about pattern location and persistence. It is not an additive decomposition of light intensity, and it is not a proposal to use an unlit eye material.

## Native isolation and restoration

The corrected native run completed all four states during the connector interruption. The completed report was recovered; the test did not need another run. `review/eye-highlight-owner137-native-result.json` records:

- Native WebGPU for the accepted133 scene, full130 lips, mapping 7, exposure 1.4, soft lighting, 900 × 1200 output and AA2.
- All 24 original eye geometry attributes/index records exact throughout the material study.
- One shared original atlas with unchanged pixel bytes, texture/source identities, versions, sampler state and bindings.
- Original eye material settings, hidden fake-glint visibility, scene mesh references and lighting/display state retained.
- Two private material disposals for mode 1, two for mode 2 and four for mode 3, with zero original resource disposals.
- Original material references restored after every mode and in the final cleanup.
- Restored detail PNG SHA-256 `92484119ead263ae07d970f5fae02801c6665238df9a3c31cf3cecb4d5299c8b`, exactly equal to the original mode 0 detail capture.
- Zero additional idle frames and an empty browser error list.

The first wrapper's mode-2 clearcoat backing-field guard failure remains preserved separately. The successful wrapper differs only by allowing that intended `_clearcoat` change; its SHA-256 remains `1550169acbe708bc12406f34de21edc020b6a37ae30802e3c27526c22538d208`.

No production file or eye art was modified by this review. Retain mode 0 and the accepted score of 77/100.
