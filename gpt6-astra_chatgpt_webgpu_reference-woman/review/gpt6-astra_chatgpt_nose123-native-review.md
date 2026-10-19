# Candidate 123: native visual review and existing mouth artifact

## Decision

**Retain depth 0. Overall quality remains 77/100 after the accepted Neutral 1.4 display change.** The two nasal reductions pass the reported technical checks, but neither produces a convincing visible likeness gain that warrants integrating the geometry change.

Reviewed the sole reference, `reference/image1.png`, and all 21 native images: `nose123-{0,12,24}-{front,detail,left,right,back,nose,nose-quarter}.jpg`. The historical candidate watermark still says 76; this review uses the current accepted overall baseline of 77.

| Head-unit depth reduction | Visual assessment | Decision / overall score |
| --- | --- | --- |
| 0 | The baseline nose retains a soft tip and familiar alar contour. The principal face and mouth construction limitations remain. | Keep, 77/100 |
| .012 | A faint reduction in tip projection is visible in the close-ups and profiles. Normal portrait and detail views do not show a repeatable likeness improvement. | Do not adopt, 77/100 |
| .024 | More detectable profile compression and a small change to tip/alar shading, without resolving the broader feature relationship or skin-response discrepancy. It is not clearly closer to image1. | Do not adopt, 77/100 |

The nonzero variants do not reveal an obvious new nostril gap, eye/cornea failure, or discontinuity in the protected mouth region. Back views remain visually equivalent. Image1 provides no alternate profile with which to validate the small projection changes; plausible geometry alone is insufficient evidence of improved likeness.

Root reports that all three actual native runs passed the source-data, geometry, orientation, attachment and restoration checks. This is a visual acceptance decision, not a technical failure. No further optional 123 tests are needed, and the isolated source/audit/wrapper remain frozen.

## Existing mouth artifact: next diagnostic target

The enlarged baseline front and quarter images show two separate defects: a thin pale line running nearly straight from mouth corner to mouth corner, and an abruptly bounded lower-lip patch. Both are already visible at depth 0 and persist across all three depths. Candidate 123 excludes the lips and cannot explain their appearance. Image1 has a softly joined lip surface and a gently shaped dark closure, without this pale geometric stroke or cut-out lower border.

The source supports two focused hypotheses:

1. **The independent mouth-crease tube is the primary suspect for the pale line.** In `src/face.js`, `makeMouth()` creates `closed-mouth-crease` as an opaque tube of radius .0019, using a nearly straight authored seam and a separate `#96605a` material. Its center is only .0008 above the lip seam at matching canonical positions, before the tube's radius. `applyReferenceSkin()` assigns the shared source atlas to the lip surfaces but does not include this tube, so it can draw a separately lit stroke over the already photographed dark closure. This fits the line's location and shape; identifying that mesh as its actual cause still requires a visibility-only native comparison.

2. **The lip border is demonstrably not tangent to the surrounding face.** The lip elevation is `+.001 + w * (.024 * smooth(v) + .022 * sin(pi*v))`, with v=0 at the outer border and v=1 at the closure. At v=0, its elevation is .001 and its elevation derivative is `.022*pi*w`, which is nonzero except at the corners. The separately computed lip normals therefore meet the continuous face with an authored slope discontinuity. The retained .12 lip clearcoat and lip/skin roughness difference can emphasize that existing border. A material-only change cannot establish geometric tangency.

The accepted 67 thickness helper explicitly preserves the closed seam, depth, UVs, materials and crease geometry; it is not evidence that this newly magnified artifact was introduced by that refinement. The reference atlas is shared and spatially registered across face and lips. Do not shift its feature anchors to disguise a join problem.

**Smallest useful next diagnostic:** use the ordinary render path for the same enlarged front and quarter views, first with the original source, then with only `closed-mouth-crease.visible=false`, restoring it afterward. If the pale stroke persists, a separate export-safe material clone with lip clearcoat disabled can distinguish a specular edge from the remaining geometry/atlas seam. Keep all positions, UVs, maps, eye/cornea materials and lighting fixed. No independent screen-target `compileAsync()` is needed.

After that attribution, a bounded lip-attachment study could make the outer elevation and its derivative approach the face smoothly, while retaining the closed seam, corner positions, central vermilion volume and exact UVs. That is a proposed next task only: no mouth geometry or material change has been implemented or visually accepted here.

## Scope

Local review only. No Mac calls, production edits, atlas edits, additional assets or new renders were made for this review. The current production state remains the accepted 128 display over the 122/118.5 model.
