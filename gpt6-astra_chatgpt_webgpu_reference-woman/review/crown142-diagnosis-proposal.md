# Crown chart 142 — geometry diagnosis and proposed construction

**Proposal only. No candidate or production geometry has been implemented. Retain accepted 133 at 77/100.** This follows the native rejection of 136 and is independent of the unresolved 141 sidedness diagnostic.

## The front boundary should close at the part tip

The current charts interpolate between a part rail `R(u)` and a perimeter rail `E(side,u)`. At the front, `u=1`, the existing part point is:

`P = (0.185368, 1.034720, 0.626638)`.

The edge tables instead put both front endpoints at `(0.012000, 1.196504, 0.562648)`. Thus both sheets have an extra nonzero front-return boundary that rises .16178 units. Unequal side puff separates their intermediate surfaces. Reparameterizing growth coordinate `v` cannot make this existing path descend.

**Close both endpoint rails at the existing part tip: `E(-1,1)=E(+1,1)=R(1)=P`.** The last chart column then collapses into one corner, as in a triangular surface chart. There is no extra strip returning from the part tip to a second point. Nearby columns still have finite, descending paths from their part roots to distinct endpoints. This is preferable to replacing the old return with another shared nonzero boundary.

The read-only child review independently supported this construction and identified its pole-normal and interpolation constraints. I also inspected the reference, accepted 133 junction, and every native 136 view. No new reference imagery or assets are involved.

## Shared surface flow, without substituted strand families

Author a bounded front field for the actual CROWN bed and its existing dedicated fibers. Its rebuilt spans are cubic Bézier curves in growth coordinate `v`, whose four control points are themselves smooth rails in `u`:

`C(u,v) = B0(v)Q0(u) + B1(v)Q1(u) + B2(v)Q2(u) + B3(v)Q3(u)`.

`Q0` is the unchanged root or the end of the protected prefix; `Q3` is the authored endpoint rail. The two interior rails set a gradual departure and an endpoint direction. On an exposed descending span, ordered control heights guarantee descent throughout the curve. Ordered lateral controls, together with a positive transverse Jacobian, prevent the lateral reversals and neighboring-lane crossings that escaped 136's Y-only test.

Each existing crown fiber keeps its stratified `u` coordinate and follows this same field directly at its existing emitted rings. It is not attracted to a median fringe curve, switched between paths at a sampled Y, or gathered into a new centerline. Direct field sampling also avoids passing the rebuilt trajectories through another Catmull–Rom interpolation, which could overshoot the constrained shape. Preserve all random draws and strand slots.

For the ordinary front hem, keep the accepted endpoint rail's lateral spread initially. Re-author its height and depth through a few broad, unequal anchors associated with the existing left sweep and right fall. An initial bounded target is roughly .08–.16 units of downward redistribution in the affected left middle/central edge and .05–.12 on the right, transitioning into the exact fixed pole. These are starting geometric bounds, not a claim that every endpoint needs the maximum displacement. Root/contact and control-order constraints take precedence over the nominal drops.

The existing `.875–1` vertex-alpha release and original alpha texture stay unchanged. The geometric endpoint rail spreads that same release across a more meaningful, unequal physical interval. The bed itself travels with the fibers; there is no alpha hole exposing independently substituted curls and no new carrier or root plate. The original 100 RGB/UV layout, normal maps and physical materials stay intact.

### Initial numeric rail envelope

Use a shape-preserving spline through the following endpoint-height envelopes, with no oscillatory knots between them. The small ranges allow the control-polygon/order and retained-fringe clearance gates to select a feasible rail; they are not an optics or strength sweep.

| Side | u | Initial endpoint Y |
|---|---:|---:|
| Left | .80 | Accepted endpoint, identity |
| Left | .83 | .82–.86 |
| Left | .86 | .86–.90 |
| Left | .90 | .88–.93 |
| Left | .93 | .94–.98 |
| Left | .95 | .975–1.015 |
| Left | 1 | 1.034720, exact pole |
| Right | .84 | Accepted endpoint, identity |
| Right | .86 | .82–.85 |
| Right | .90 | .85–.90 |
| Right | .93 | .91–.96 |
| Right | .96 | .98–1.02 |
| Right | 1 | 1.034720, exact pole |

Keep accepted endpoint X outside the final closing interval, initially within .02 units in the ordinary affected hem. Close the left rail from about u=.94 and the right from about u=.90 to exact pole X=.185368, using an ordered transverse rail rather than moving several intervals to the same X. The pole's derivative constraints govern that final interval. Ordinary endpoint depth should remain supported in the upper-fringe volume, approximately .06–.10 ahead of the analytic forehead, while respecting the unchanged 133 bow geometry. The exact pole keeps its accepted Z=.626638 and its common tangent-plane approach; it is an explicit exception to that ordinary depth range. If the old diagonal would be covered, narrow the local change rather than move or hide the diagonal.

**A remaining art risk is that the reshaped bed may still read as a sheet.** Closing the pole fixes the extra return boundary; it does not by itself prove that the broad crown release looks natural. A first native result must demonstrate the latter rather than receive credit for mathematical closure alone.

## Preserve actual 133 root contacts

A source-only probe recorded the actual accepted fringe root-control bounds:

| Group | Side | Root u range | Maximum root v |
|---|---|---|---:|
| 0, accepted long diagonal | Left | .788643–.829365 | .777998 |
| 1 | Left | .881445–.920415 | .738000 |
| 2 | Left | .923920–.945306 | .547985 |
| 3 | Right | .845385–.884956 | .678000 |
| 4 | Right | .811222–.829128 | .597997 |
| 5 | Right | .760404–.777877 | .637990 |
| 6 | Right | .701124–.726959 | .547999 |

Keep the accepted crown field exactly through these root footprints, with a small UV buffer. Use smooth protected-prefix boundaries between them rather than one unnecessarily long `v=.8` cutoff everywhere. Rebuild the free tail after that boundary. The entire front column can be re-authored beyond approximately left `u=.95` and right `u=.89`, where no 133 fringe root control exists. FRINGE itself still uses the accepted field and remains byte-identical.

The first prefix envelope is explicit: on the left, retain through v=.805 across the group-0 interval with u buffer to .835; through v=.765 over the group-1 interval with buffer to .926; and through v=.575 over group 2 with buffer to .952. Use smooth transitions between these required envelopes, then release the protected prefix toward v=0 by u=.98. On the right, retain v=.625 around group 4 through u=.835 and v=.705 around group 3 through u=.890, then release toward v=0 by u=.925. Groups 5/6 lie outside the proposed geometry patch. The actual root-coordinate table remains the final protection authority, including the interpolation cells around its controls.

Preserving the left `.95` prefix retains its existing small covered rise: Y1.1656 at the root to Y1.1752 around v.325. Record that exception; do not claim every preserved column is globally descending. New exposed paths must descend after any explicitly retained covered apex.

The main long-hair crown routes lie at `u≤.705`; the far-ear layer is farther outside this front patch. Keep MASS, lower placement/contact, the inset foundation, ear141 area and rear crown exact. A front patch beginning around left `u=.80` and right `u=.84–.85` is sufficient for the initial construction, with identity buffers before those boundaries.

There is one small scope addition worth including in the shared flow: the existing short **front edge wisps** whose roots lie in the rebuilt chart. Otherwise they retain the old upward-return endpoint after its bed is gone. Resample only that existing subset from the same field and bound its extension near the pole. Preserve its count and RNG; leave the separate temple/ear wisps and flyaways exact. No new hair population is proposed.

## A smooth corner, rather than a conical kink

All four control rails must converge to `P` with a compatible first-order limit. With `s=1-u`, require `C(u,v)=P+s A(v)+O(s²)`, where the vectors `A(v)` lie in one common tangent plane, turn consistently through the left/right sectors, and have nonzero `A × dA/dv` away from the boundary. The fixed root-rail tangent determines one direction of that plane. Endpoint coincidence alone is insufficient; averaging normals cannot repair a nonplanar fan.

Keeping the existing grid and indices gives **128 new intentional zero-area triangles**, one per final-column quad across both sheets. All other triangles must remain regular. Weld the coincident pole normals using nondegenerate area contributions and explicitly assign the unused corner a finite normal. The current part-row weld alone does not do this. Alternatively omit precisely those degenerate triangles after visual acceptance; no vertex/UV reordering is needed for the first comparison.

Near the pole, fixed strand width and the existing per-knot lift noise can dominate a shrinking path. Keep the existing `u` distribution, but attenuate wander/lift variation and bound ribbon width smoothly against the local path length and transverse spacing. Use the common surface normal for the lift. Continue consuming the original RNG slots. This avoids a compact knot of short ribbons without reallocating them into neighboring families.

## Minimal source gate and native decision

Before the first native capture, check protected geometry/RNG/maps/materials and the exact root footprints; pole coincidence and the intended degeneracies; finite common pole normals; normalized Jacobian orientation; actual emitted ribbon lateral order and width; and fine-segment clearance over the actual tessellated CROWN host. Direct field samples alone do not prove that a coarse straight ribbon segment stays above a curved bed.

Then make one off/on native comparison in front, detail, both profiles, back and junction. The candidate must remove the triangular return and soften the old hem without creating a pointed fan, broad new plate, loops, pinwheel highlight, blank forehead pocket or damaged profile coverage. No shader sweep or export work precedes that art decision.

Only this proposal and read-only measurements have been written. Frozen 136 and live 133 remain unchanged.
