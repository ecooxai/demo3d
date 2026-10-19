# Iteration 146 — coordinated front crown and upper fringe proposal

**Read-only proposal. No candidate is implemented. Retain production 141 at 77/100.** Frozen 142 remains rejected: root 75, independent hair review 76. Its original visual decision and separate isolation addendum are `crown142-visual-decision.md` and `crown142-isolation-addendum146.md`.

## What made the 142 bank

I re-viewed the original image and all twelve native 142 captures, then inspected the accepted 133 construction, frozen 142 field and current 100 atlas code. The ordinary front/detail failure is a broad, blunt newly exposed surface. Its smaller crimped pattern has more than one possible contributor; the existing pair does not isolate their pixel contributions.

| Mechanism | Actual evidence | Consequence |
|---|---|---|
| Surface facing and hem shape | Of 3,505 changed, nondegenerate emitted CROWN triangles, 898 switch from back-facing to front-facing in the accepted front camera. Of those, 736 have fully opaque vertex alpha. No changed front-facing triangle switches away. | Accepted 141's FrontSide setting now reveals part of the repaired chart that was formerly culled. Fixing the folded return exposes a bank; it does not automatically produce a convincing hairline. These are facing counts, not ray-visible pixel counts. |
| Short retained-prefix transition | 142 holds old left roots through v≈.575–.805 and right roots through v≈.625–.705. Its new hem then departs from those old spherical trajectories over the remaining parameter interval. | The field must change direction locally while preserving the old root placement. The hem becomes flatter and lower in the middle, with a rapid transition toward the closed tip. |
| Uneven UV metric | The physical arc occupied by the unchanged v=.875–1 release expands 1.85× at left u=.90 and 2.11× at u=.93. At u=.985 it contracts to .42× on the left and .33× on the right. | This is not uniform compression. The central bank stretches while the terminal corner compresses; the same texture and alpha coordinates acquire very different physical scales. At left (.97,.65), the local transverse metric grows 5.13× and the growth direction turns 44.3°. |
| Native 100 rebake | 100 weights source contrast by `smooth(0,.42,facing)` from current CROWN normals. At emitted-triangle centroid samples, 736 weights change from zero to above .5; some become1. | The final atlas RGB is not proven equal between OFF and ON. Source-audit map equality is pre-100 only. Newly exposed geometry can also receive stronger contrast. The fixed atlas UV layout does not imply a fixed RGB result. |
| Fine orientation and placement | 142 retains all FRINGE133 geometry, while changing 414 dedicated crown ribbons and narrowing some to55% of their old width. Its closing field also bounds their normal offsets more tightly. | The crown fibers follow the altered bank while the upper fringe retains its old paths. These changes can emphasize the surface transition. The native images do not prove that a particular visible chevron belongs solely to geometry, normals, or atlas contrast. |

`crown146-diagnosis.json` records the source hashes, samples and qualifications. It does not read photograph pixels. The exposed flat bank is enough to reject142; no material or alpha rescue for142 is proposed.

## Recommended change: one longer root-to-bow construction

Reauthor the **actual existing front CROWN field and the upper parts of fringe groups0–5 together**. Release the old exact root-prefix constraint. Use a shared family flow from the part through the crown and into the existing bowed paths; preserve those accepted paths below explicitly recorded cuts. Do not add another carrier layer or preserve an obsolete spherical prefix just to satisfy a byte-equality test.

The source image calls for a broad left sweep that feeds the long diagonal, several unequal shorter central strands, and a smaller right fall. The new coarse shape should express those unequal departures before individual fibers are rebuilt. The bed should end at different places along those flows, without a common horizontal bank, a periodic scalloped hem, or several new opaque straps.

### Explicit ownership

| Component | Proposed ownership | Exact protection |
|---|---|---|
| CROWN foundation | None | All7,685 foundation vertices, indices, UVs and alpha; the141 near-ear region. |
| Existing left CROWN sheet | Front u>.755, with a smooth identity buffer to full ownership aroundu=.79; the complete growth span may change. | u≤.755 and the rear/side sheet outside the buffer. No v=.8-style protected prefix. |
| Existing right CROWN sheet | Front u>.745, with a smooth identity buffer to full ownership aroundu=.78. | u≤.745, and all CROWN geometry at/below head-localY=.38. |
| Part rail | Shared by both sheets. Keep its established XY course; permit one smooth anterior-depth inset of at most.035 in the frontal u>.86 region. The precise depth is a geometric fit, not a material variant. | Part u≤.86, rear crown and outer head silhouette. No second scalp plate. |
| FRINGE groups0–5 | Their upper paths above the cuts below, including formerly protected root controls. | Original path parameters, positions, widths, colors and ends at/below the cuts; group6 entirely. |
| Dedicated CROWN fibers / front edge wisps | Only existing slots whose host lies in the owned chart; follow its same field after the coarse shape is approved. | All other DETAIL, the separate22 temple/ear wisps,86 flyaways and far-ear94 layer. |
| MASS, long hair, ears, face, body | None | Every guide/mesh,118 lower placement,86 contact,133 lower diagonal,143/144 work and accepted materials. |

The CROWN ownership is broader than142, but still ends well before the main MASS scalp-root range (maximumu≈.705). It does not alter the rear, foundation, ear141 correction, or lower hair.

### Preserve real downstream curves, not merely their endpoints

Construct each accepted final133 strand first, including its current diagonal decoration. Locate a fixed parameter cut on that frozen curve using the following head-local Y values. AboveY=.38 the groom's gravity compensation is identity, so these are also its compensated head-local heights. Replace only the upstream function. For every original `t` at or below the cut, return the accepted curve directly; do **not** rerun133 on a changed input curve, recompute its lower arclength, or move its original emitted parameter rows.

| Group | Existing emitted strands | Protect at/below Y | Representative accepted join XYZ |
|---|---:|---:|---|
| 0: long left diagonal | 223 | .74 | (−.4140,.7400,.5926) |
| 1: left central bow | 203 | .76 | (−.2137,.7600,.6690) |
| 2: narrow central bow | 87 | .78 | (−.0274,.7800,.6769) |
| 3: right central bow | 248 | .73 | (.2709,.7300,.6263) |
| 4: intermediate right bow | 100 | .63 | (.4495,.6300,.5801) |
| 5: outer right bow | 77 | .50 | (.5553,.5000,.5533) |

These representative samples are measured from the existing emitted-strand construction; every strand gets its own cut. The old133 start nearY=.90 is **explicitly no longer protected** for group0. Its successful diagonal through the outer brow, temple/cheek and lower ends remains exact. The six owned groups contain938 emitted strands, with unchanged counts and random draws. `crown146-root-probe.json` records these samples and original upper roots.

## Coarse field mechanism

1. **Fit six long upper flow guides to the accepted lower joins.** Distribute the change over the full available root-to-join distance, approximately .43–.90 in vertical drop for the representative guides. Use ordered-height Bézier/Hermite controls after a buried apex, with no continued old spherical return. Match the accepted lower position and tangent; match or smoothly resolve curvature before the protected emitted rows. The left families descend diagonally. The right families may have one broad lateral bow consistent with the reference, rather than multiple S turns. Do not enforce a wrong old upper tangent as105 did.

2. **Loft one continuous existing sheet on each side through that field.** The same guides determine its root flow and the upstream fringe paths. Interpolate between neighboring family rails with ordered transverse controls; do not gather unrelated fibers into one nearest guide. The bed ends along a broad, unequal hem. Initial local endpoint-height envelopes are left around .80–.84 near group0, .98–1.04 near group1 and1.08–1.12 near group2; right around .86–.92 near group3, .66–.73 near group4 and .51–.58 near group5. These are constrained geometric fitting ranges, not a style sweep. Lateral endpoints must remain consistent with the photographed sweep and behind the actual free bows. They must not be selected by Y alone.

3. **Close the front chart as part of the new whole field.** If the unchanged rectangular UV grid is retained, both final chart columns close at the *new shared part tip*, with one tangent-plane limit. There is no requirement to preserve142's old tip depth or intermediate endpoint rails. No fixed old fringe prefix remains between the new part and the new hem. The corner is a small terminal limit, not a wide new band whose shape is driven by a collapsed pole. Record only the intended final-column degeneracies.

4. **Regularize geometry travel before transferring texture.** Sample the long paths using short arclength tables, then place the existing grid rows so neighboring texture intervals have a gradual physical scale. Preserve the existing UV0/UV1 chart layout and source alpha inputs if feasible. Measure local stretch, shear, facing and fade length; do not treat positive signed Jacobian alone as sufficient. A squeezed corner may have an intentional singular limit, but the ordinary exposed bed may not inherit that compression. No new alpha hole, coverage map, normal-map pattern or RGB correction is proposed.

5. **Only then resample existing fine slots from the same field.** The fringe's upper portions and dedicated crown fibers must agree on flow and support, with their existing narrow offsets and unequal thinning. Keep the protected lower bows and all materials exact. Do not preserve an incompatible old surface tangent merely to make a numerical join exact, and do not compensate for poor coarse coverage by adding density.

The root depth inset is bounded because the accepted part sits about .13–.15 ahead of the current analytic forehead envelope overu=.90–1. That envelope is a support estimate, not a measured scalp surface; the proposal does not move the part all the way to it. Native profiles remain necessary. If the original UV layout cannot support a regular new field, stop at that specific layout issue and coordinate a revised100/104 mapping before any atlas or export edits.

## First gate and budget

Before spending time rebuilding the fine ribbons, inspect the coarse CROWN shape with the existing ownership-isolation view. The new hem must already be unequal and continuous under141 facing, without a broad newly exposed forehead bank. Track camera-facing area separately from actual occlusion, and inspect the retained-alpha contour in physical space. A neutral shape diagnostic may separate shape from100 contrast; it is not a proposed replacement material. Final art must use the accepted production rendering and record the actual post-100 atlas hash rather than assuming equality.

The focused source gate checks finite output, ordered transverse strips, actual emitted surface orientation, physical release lengths, root/hem support, and exact downstream curve rows. After fines are rebuilt, check their actual chord/host clearance and local ordering. No exhaustive whole-groom collision audit is required before the first native glimpse. Front/detail and junction decide whether the structural premise helped; both profiles and back must preserve coverage.

**Budget:** zero new strand slots, meshes, draws, textures or per-frame work. Reuse the current CROWN grid and existing fringe/fine samples. Target the accepted **1,114,888 triangles /52.49 MiB**, with at most2% additional hair triangles only if a concrete coarse tessellation failure requires them and is reported before use. Keep new temporary flow tables below8 MiB, the new helper around15 KiB or less, and target native construction overhead below250 ms relative to the paired baseline. Precompute guide coefficients and short arclength tables once; do not query cloth or solve forehead geometry independently per fine vertex.

This is one coordinated structural candidate proposal, not a142 rescue or a parameter sweep. No146 source or native wrapper has been authored, and no quality increase is claimed.
