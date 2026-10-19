# Independent review: cloth117, exporter120, hair121 and palette122

Reviewer: GPT-6 Astra / ChatGPT, `/root/glb_export_repair`.

**Decisions: integrate the legal117 cloth atlas at strength 0.5 with exporter120; select palette122 mode 1; retain hair121 mode 0. Overall artistic assessment remains 76/100.** No production files were edited for this review.

## Cloth117 and exporter120: accept

I compared `export120-source-front.jpg`, `export120-loaded-front.jpg`, `export120-source-garment.jpg`, `export120-loaded-garment.jpg` and `export120-restored-front.jpg` directly. I see no source-to-loaded change in cotton tint, sheen, folds, placket edges or the source eyes. The restored portrait also matches. The selected half-strength117 texture keeps its previously accepted small improvement around the lower button folds without the doubled dark trough seen at full strength.

The actual native report, `reference-cloth117-export120-native-result.json`, supports this visual acceptance:

- The focused torso GLB is 1,627,640 bytes. All 21,809 vertex positions, normals, UVs and colors, and all 129,024 index values, are exact after loading.
- The 1024² atlas and 256² weave bump retain every RGBA byte and their orientation. `EXT_materials_bump` preserves scale 0.0021 and repeat 14×14.
- Prepared, serialized and loaded effective sheen are exactly `[0.09063150741236436, 0.09149354751557545, 0.09766164012925423]`. The positive constant, mapped and zero-sheen fixtures pass through the installed exporter/loader, including both mapped textures and zero-extension omission.
- Front compositor RGB MAE is 0; garment MAE is 0.0013261406 on the 0–255 byte scale, with maximum difference 1. The restored front is exact. Both original eye patches remain exact.
- Source references, versions and values remain unchanged; temporary and loaded resources are disposed, with zero source disposals. There are no browser errors or idle frames.

This closes the observed scalar-sheen export defect. It supersedes the pending-native assessment in `export-portrait120-review.md`, while preserving the original frozen117 failure and the120 source files. Acceptance applies to the focused torso under the controlled native viewer comparison, including matched renderer shadow settings and texture anisotropy; it is not a claim that the full portrait has been roundtrip-audited here.

The117 bake's already disclosed blue-tail clipping and neutral 8-bit rounding remain part of the selected source appearance. The export introduces no additional atlas-byte change. This is a small cloth improvement plus an export correctness fix, not a whole-point artistic gain.

## Palette122: select mode 1

I compared the baseline and mode 1 garment images, then viewed mode 1 front, detail, left, right and back against the sole image1 reference. The change is a slight neutralization of the collar and center placket. They still read as the reference's white cotton, without an objectionable gray strip, yellow cast or new collar/body mismatch. At ordinary portrait size, the difference is small. I prefer the bounded mode 1 palette and see no meaningful reference-fidelity cost in these views.

`blouse-albedo122-native-result.json` identifies exactly two originally unbounded material colors. Mode1 changes the placket RGB to `[1,1,1]` and only the collar's blue component to 1. The largest relative reductions are 7.75% for placket blue and 5.96% for collar blue. The audit then finds no unbounded RGB factors among 49 materials. It adds no geometry, texture bytes or work per frame and reports no errors.

This is an explicitly reviewed source-palette adjustment. It is separate from120's exact physical sheen normalization, and it does not pretend to preserve the original out-of-range reflectance exactly. Score remains 76/100.

## Hair121: retain mode 0; reject modes 1 and 2

I viewed all 18 supplied `response121` captures: modes 0, 1 and 2 in front, detail, left, right, back and relit front.

Mode1 adds some local strand visibility, but the overall front still reads as the same broad opaque locks. Side and back highlights become more mechanical, particularly along the outer rear edge. The change does not produce a clear improvement in the reference's soft, irregular strand separation. **Mode1 remains about 76/100 and is not selected.**

Mode2 makes the defect clear: dotted or ladder-like glints repeat down the side sheets, and narrow bands collect along the rear silhouette and lower bends. The left profile and back show the strongest examples; the relit front also exposes repeated bright marks near the viewer-left shoulder. These read as repeated surface relief rather than the reference's irregular individual hair reflections. The stronger response does not solve the broad lock shapes or the crown/fringe transition. **Reject mode 2 at about 75/100.**

The baseline remains imperfect, but these stronger material settings do not improve the complete portrait. No 121 changes should be included with the accepted117/120/122 work.

## Evidence inspected

Only `reference/image1-color.jpg`, the supplied local native captures and the two named native JSON reports were used. No image generation, external assets, Mac/browser actions or production edits were performed by this reviewer.
