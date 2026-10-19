# Proposal 143 — continuous near-curtain layout

**Approved design record, followed by the implementation addendum below.** The original proposal is retained to explain the design choices. Isolated143 review files now implement the lower continuum; production and frozen138 remain unchanged. Baseline remains77/100 pending one native off/on comparison.

## Intended visible change

The image-left hair in the sole reference has a connected upper fall, two dominant lower S-sweeps and several narrower companions. Dark channels divide its surface without opening the whole curtain into separate straps. The outer contour makes a broad lower return, and the tips release at unequal heights. The photograph supplies the front arrangement; the profile is a conservative 3D construction that must remain natural around the actual shoulder and blouse.

Native 138 demonstrates that six separate bundles are the wrong layout for this target. Both the 33 front guides and the 28 inner guides were assigned to individual family centers, leaving the same inter-family spaces empty. Their per-family support controls then received different depth lifts, including a first correction up to 0.1466 authored units. The fit excluded the upper transition. Thin new sections, independent height schedules and those depth humps produced flat tendrils, squared shoulder folds and visible holes. C2 endpoints alone did not bound curvature through the join.

143 should change the arrangement itself: one continuous curtain coordinate, six unequal flow influences, a staggered inner layer and a common shoulder-to-chest depth field. It should retain the real section volume of the accepted hair.

## Ownership and construction order

| Group | Existing guide IDs | Purpose in 143 |
|---|---|---|
| Near front | 58–90, 33 guides | Continuously spaced visible surface with six broad flow influences |
| Near inner | 172–199, 28 guides | Staggered coverage behind neighboring front guides, especially between major flows |
| Near curl | 133–138, 6 guides | Sparse unequal releases that stay gathered until the lower curtain |

The same 2,191 dependent base fibers and assigned lower flyaways follow these guides. Keep the original slot order and random draws. Protect all far, side, back, crown and fringe 133 geometry and materials. The source region above authored Y = -1.05, including its fine sampling and normal neighborhood, stays exact. Existing inherited intersections within that fixed root region are reported separately from any new intersections.

Construct accepted 118.5 first and retain it on every protected guide. Its selected near-guide curves supply the immutable root prefix and entry position, tangent and curvature. Replace only the lower portions of the 67 owned guides; do not run a second 118 fit over the replacements. Retain accepted 86 at 0.35 exactly once in final mesh construction. Plan support in the final pre-balance model frame through that same transform, using the full upper counterpose where it has not yet cancelled. Accepted balance 99 remains downstream and unchanged.

## 1. One continuous front coordinate

Give the 33 original front slots a persistent lateral coordinate q from inner to outer edge. Preserve guide IDs even if an initial, recorded spatial rank is needed to resolve existing overlaps; never sort or change assignments at each height.

Author inner and outer boundary curves against the reference and six broad flow anchors between them. The anchors influence the curvature of a continuous field X(q, h), where h is one shared physical-height coordinate. They are not six target centers to which all nearby guides converge. Interpolate across q with an order-preserving construction and bounded derivatives. Unequal anchor spacings and different bend heights provide the two larger sweeps and narrower companions.

In the fully changed lower region, keep the lateral map one-to-one: outer lanes must remain farther out than inner lanes. Bound adjacent center spacing against the local curtain width; a starting range of roughly 0.65–1.45 times the mean spacing allows grouping without six empty corridors. The inherited root region is exempt from an artificial new ordering requirement. Its transition still receives actual crossing checks against the accepted baseline.

At any shared height, derive each front section's projected width from its adjacent lane distances. Use modest overlapping coverage, with typical projected half-widths about 0.65–1.0 local spacings before the final tip taper. Vary these values smoothly rather than alternating wide/narrow on every guide. The exact emitted sections, not a center-spacing formula alone, decide whether the visible coverage is adequate.

The six major flows can change width, density, bend phase and shallow relative depth together. They must not create six disconnected opaque plates. Preserve the accepted front section depths as the initial values, approximately 0.022–0.037, rather than shrinking them to 138's 0.0058–0.0165 range. Reduce depth only for genuinely small terminal releases, with an explicit section-volume check. Existing materials and maps stay unchanged.

## 2. Inner coverage spans the spaces between flows

Place the 28 inner slots at staggered q values across the entire curtain, initially near (j + 0.5) / 28. Each inner guide follows the same height and lateral field as its neighboring front guides. It is not assigned to the nearest major family's center.

Derive an inner guide's width from the front intervals it must support. Place its forward surface a small deliberate distance behind the visible front envelope while its rear surface satisfies cloth clearance. This keeps dark channels dark hair rather than exposed white blouse. The inner layer is existing closed hair geometry, not a new backing sheet. Check which surfaces are actually visible so a supposed filler does not become a new broad front face.

Retain continuous inner coverage through most of the fall. Shorten it locally near the bottom so the existing curl slots and front tips can release. The source supports a few narrow windows near loose ends; it does not support several full-length open slots. Vary end height as a smooth function of q plus small per-guide deviations. Avoid six abrupt end-height bands.

The six curl guides stay close to their neighboring front/inner flow over the shoulder and chest. Their meaningful lateral and depth separation begins only in the lower portion. Give them unequal lengths and return heights, with a maximum of a few deliberately open terminal spaces, rather than six synchronized long hooks.

## 3. One shared shoulder depth field

Build a smooth Z(q, h) field for the whole curtain before meshing. Both front and inner layers use it, with explicit depth offsets that preserve their ordering and finite section volume. Neighboring major-flow anchors cannot acquire independent alternating support humps.

Use a small coupled control lattice in q and physical height. Match the accepted entry positions and tangent/curvature jets at the unchanged prefix. Continue toward the chest with bounded curvature and with lateral and longitudinal smoothing of the support correction. Do not blend old and new curves that are evaluated at different physical heights, as 138 did after changing each guide's height schedule.

The join endpoint is not forced to 138's authored Y = -1.97. Give the inherited shoulder fan enough distance to become the new continuous layout: provisionally finish the changed layout around model Y 0.7–0.9, subject to actual collar and side-lock clearance. Preserve more of the original shoulder trajectory if that is needed to avoid a large deflection. A continuous value/derivative join is necessary, but an extra opposing depth turn or a sharp tangent rotation in its interior is still a rejection.

Fit the coupled field against the actual accepted blouse and the actual triangles of the collar, facing, placket, buttons and fixed near-side hair. Sample complete rear and side cross-sections through the whole changed join, including the upper transition omitted from 138's fit. Plan for rear-surface normal stand-off around 0.07–0.14 over supported chest, allowing modest larger free spans and inherited entry depth. Treat these as placement goals, not a rule to paste every point onto the cloth.

Use fixed-side front/rear intervals to distinguish new penetration from inherited buried roots. If a local obstacle requires a large lift, change the broad route or extend the join; do not raise one family control row and accept the resulting bridge. Neighboring guides must move coherently. Any proposed movement of the protected side guides would require a separate scope decision.

For this static study, solve the small field once during local preparation and freeze its coefficients with the expected source geometry/pose specification. The native constructor should evaluate the frozen field rather than repeat 138's expensive support fit at every load. A source guard must reject stale geometry assumptions. All temporary support grids are discarded after preparation.

## 4. Fine strands use the emitted hosts

Generate the MASS sections and the dependent fine paths from the same field and transported frames. Fine strands keep their existing random phases and offsets but follow the new host surface continuously. There are no lower fibers left on the accepted old path and no independent planar carriers.

Retain 138's useful lesson: fine endpoints above the host do not prove that the connecting chord remains above it. Sample the actual emitted host triangles. Subdivide only a changed lower span that fails a bounded chord or host-clearance condition; preserve the protected upper samples exactly. The smoother coupled geometry should need fewer added samples than 138, but that remains a measured result, not an assumed saving.

No new materials, maps, draw calls or per-frame deformation are planned. MASS guide counts and topology remain the same for the first prototype. Additional fine triangles are permitted only when a concrete host-crossing check requires them. Report their count, bytes and construction cost before native review. Aim to stay well below 138's additional 317,594 triangles and 16.96 MiB; exceeding that would need a visible structural benefit rather than more complete sampling of another weak shape.

## Bounded source and native gate

Before preparing fine geometry, inspect a few full cross-sections and the front/profile outline of the coupled field. Confirm continuous projected coverage through the shoulder and chest, monotone lower lane ordering, bounded interior tangent turns and preserved section depth. If those already reveal the six tendrils or an angular bridge, revise the layout before spending time on fine sampling.

Then run one focused actual-geometry check: finite/unit normals and section orientation; exact off/protected buffers; complete-section cloth/collar/fixed-side support; newly introduced front/inner crossing intervals; and fine-versus-host chord separation. Distinguish intended buried overlap from a newly visible crossing face. These checks are sufficient to freeze a native art study; they do not justify an artistic score.

Root should capture one off/on comparison on the current accepted scene: front, detail, both profiles, back and the same near-curtain closeup. Keep display, camera, material, maps and light unchanged.

Acceptance requires a connected shoulder-to-chest fall, unequal broad flows readable at ordinary size, narrower dark hair channels without large white slots, retained 3D volume in profile, and varied ends without repeated squared bends or hooks. Detail and back must remain protected. A silhouette or shoulder regression rejects the whole candidate. No strength sweep is proposed. Overall score remains 77 until those native images establish an actual improvement.

## Implementation addendum — final coarse mechanism

The approved scope was extended to existing side154/155 and their56 base fibers after the fixed upper fan exposed a concrete transition contradiction. Final ownership is69 guides and2,247 base fibers; their23 assigned flyaways follow the same lower hosts. All other side/back/far/crown/fringe components remain protected. Rear companions use q .46/.60 and a shared−.15 raw depth layer, retaining their accepted upper routes and section depth.

The exact accepted route continues through authoredY−2.15 (modelY .80); the common field is fully active at−2.90 (modelY .05). This longer join is required by the inherited fan, so the intended gain is explicitly limited to the lower curtain. A C2 physical-height Hermite join matches the accepted position/tangent/curvature to the common field. Endpoint-height changes begin only after the full join. The sampled normalized lower lateral derivative is positive, range .3621–1.5543; the provisional narrower spacing bound was superseded by actual continuous coverage checks.

The offline field uses36 coupled coefficients fitted to841 support targets with lateral/height regularization and shared lower bounds. The native helper only evaluates the frozen field and builds the existing closed sections. It applies neither another118 fit nor a final-mesh compression. Frozen source/pose input hashes reject stale native construction.

Final coarse body/collar samples are clear. The fixed ten near-side cores and fully joined region have0 sampled inside cases. The178 new internal rear-companion transition overlaps are explicitly documented and covered by the tested opaque hair/model envelope. Root approved retaining buried closed-support overlap instead of adding a large outward lift. See the coarse-decision and side-audit files for the exact limits.

Fine sampling retains original samples above the actual deformation pin. Extra triangle-edge cuts and adaptive subdivision apply only below that pin. The first full build adds228,800 vertices/triangles and12,812,800 bytes (12.22MiB), with no new draw calls or maps. This cost requires visible native benefit. Fine transition burial and native appearance remain separate gates.
