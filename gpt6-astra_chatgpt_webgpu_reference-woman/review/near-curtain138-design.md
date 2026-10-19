# Candidate 138 — one coherent near hair curtain

**Approved isolated design study. Baseline remains 77/100; native art review decides adoption.**

The target is the image-left front curtain below the ear and across the shoulder/chest. The reference shows a few unequal, overlapping long sweeps with narrower companions and different returns at their ends. The current model distributes many similar bends across the whole curtain. The replacement will change the guide center paths and group widths together. It will use the existing materials and maps.

## Exact ownership

| Existing source group | Guide IDs, inclusive | Locks | Dependent base fibers |
|---|---|---:|---:|
| Near front | 58–90 | 33 | 1,419 |
| Near curl | 133–138 | 6 | 324 |
| Near inner coverage | 172–199 | 28 | 448 |
| Total | Three ranges above | 67 | 2,191 |

Flyaways assigned to these guides also follow the replacement family. The original random slots and guide ordering remain stable. The far curtain, side locks, rear locks, far-temple layer, crown, all crown fibers, fringe 133 and independent upper wisps stay protected. No old near inner sheet or old lower fine carrier remains behind the replacement.

The guide and surface region above authored Y = −1.05 is retained. The frozen implementation adds a guard to Y = −1.34 and joins the full family paths by Y = −1.97. Fine ribbons also retain the original sample immediately below their protected prefix, so normals above −1.05 remain exactly unchanged. Body shaping uses monotone physical height with smooth first/second derivative joins; end lengths vary below that join. The original head counterpose and ear routing remain in the standard construction pipeline.

## Six unequal families

The 67 existing slots are assigned to six shared master paths in order from the inner neckline edge to the outer silhouette. Two broad, long S sweeps carry most of the apparent volume. The smaller families end at different heights and release with different lateral curvature.

| Family | Visual role | Approximate share of curtain width | Front / curl / inner slots |
|---|---|---:|---:|
| A | Narrow inner fall with a restrained inward tip | 11% | 4 / 0 / 3 |
| B | Inner sweep, with a later bend and shorter return | 14% | 5 / 1 / 4 |
| C | Dominant inner S, broad through the chest | 23% | 7 / 0 / 6 |
| D | Dominant outer S, longest and with a lower outward turn | 26% | 8 / 2 / 7 |
| E | Outer return, turning earlier and ending higher | 17% | 6 / 2 / 5 |
| F | Narrow outer release, with a short, loose ending | 9% | 3 / 1 / 3 |

These shares are planning values, not six uniformly spaced lanes. The master paths have independently authored bend heights and endpoints. Neighboring subguides use bounded lateral offsets and different widths within the family. Their depth and width taper with the same family parameter. Existing inner slots form the underside of their own family and release at the same unequal boundaries, preserving dark longitudinal separations between the larger groups.

Manual source inspection, including `review/near-curtain138-reference-inspection.png`, guides the relative shapes. The lower near silhouette may move outward modestly to create the reference's stronger lower return. The prototype will not infer hidden depth from the frontal photograph; its profile volume is a conservative construction constrained by the actual blouse and neighboring hair.

## Contact before meshing

First construct the usual accepted 118.5 baseline. Preserve its fitted curves on every protected guide. Then replace the selected 67 curves with the new family construction. The replacement does **not** receive a second 118 fit, and its fine paths do not use the old 118 lower-curve blending branch.

Accepted 86 contact at strength 0.35 remains applied **exactly once** by the existing final mesh construction. The family planner evaluates that same forward transform when choosing the curves and checking their cross-sections. Below authored Y = −1.64 the gravity counterpose cancels the head rotation, so the final pre-balance mapping is:

```text
X = authoredX + 0.26
Y = authoredY + 2.95
Z = authoredZ + contact86(X, Y, authoredZ)
```

The scalar Z response is inverted while planning the lower family centers. This puts the intended volume in the final scene without adding another mesh compression. Upper joins use the complete existing forward transform.

The accepted blouse surface query includes its current width and sleeve shaping. The planner transforms sample X/Y into blouse coordinates using the actual 0.045 shoulder roll about Y = 1. It also checks actual near collar/facing geometry because the torso query explicitly excludes those pieces. The native wrapper may construct the single existing blouse object before the groom and pass it as read-only support; it will reuse that object in the final scene.

Target rear-surface normal clearance over supported chest is approximately **0.07–0.14**, varying between families and along their length. Some outer curls may stand farther away deliberately. A broad smooth depth curve spans shoulder and chest; it must not follow individual garment wrinkles or a changing nearest-hit sample. The lock sections keep real depth. Missing support is an unsupported free span, not a reason to collapse a strand to a zero-depth surface.

Actual protected near side locks are additional obstacles. Already embedded source pairs are distinguished from originally separated pairs. A small bounded fit may lift a family or move its center laterally; it must not silently deform the protected side guides to make the new path fit.

## Shared mass and fine evaluation

Each replacement lock has one continuous swept-surface evaluator derived from its family's center curve, transported frame, width, depth and taper. The closed MASS section and its fine strands sample that evaluator. Fine strands use continuous family coordinates with a small surface offset, so they follow the new shoulder and end turns directly. Their tangent comes from that same path.

The 2,191 existing base-fiber slots are retained. Their original random draws are still consumed so every later protected crown/fringe/wisp slot stays unchanged. Assigned lower flyaways also use the new family path. The protected upper parts use the original curves with a guard before the changed join. There is no additional opaque carrier, blanket backing sheet, photo plane or texture experiment.

The MASS geometry retains its original segment budget. An actual emitted-geometry check found that the original 28-segment fine ribbons crossed their curved MASS hosts by up to 0.0245 units between sample vertices. The frozen candidate therefore subdivides only affected lower fine spans at their host's triangle boundaries and at a bounded curve-error tolerance. It adds 317,594 fine vertices/triangles and 16.96 MiB to the source build. This substantial cost needs a clear native visual benefit. There is no additional draw call, texture or per-frame computation. Temporary support data is released after construction.

## Measured baseline opportunity

The local source study sampled actual eight-sided lock sections after accepted 118.5 and 86.35, using the current blouse query. These are sampled section statistics, not a complete mesh-intersection proof.

| Pre-balance model height | Near guides crossing the row | Median normal gap | 90th percentile gap |
|---|---:|---:|---:|
| 1.05 | 67 | 0.289 | 0.405 |
| 0.50 | 67 | 0.230 | 0.381 |
| −0.05 | 67 | 0.216 | 0.333 |
| −0.55 | 64 | 0.238 | 0.345 |
| −0.85 | 38 | 0.153 | 0.303 |

Some existing tips are already much closer. The study found a minimum sampled gap of 0.005 near the lowest row, so a uniform pull would be inappropriate. Independent family paths and variable endings are needed.

## Bounded verification and native gate

1. Confirm finite geometry and unit normals, stable guide IDs/random slots, exact protected buffers and a true off branch.
2. Check representative rear cross-sections and actual triangle samples against blouse/collar support and fixed side obstacles. Report minimum clearance and where deliberate free spans occur.
3. Check monotone body height, tangent continuity at the shoulder join, nonzero section area and local triangle orientation. Inspect actual overlapping mesh intervals and fine-versus-host samples; positive center-line derivatives alone are insufficient.
4. Freeze one on/off comparison after these focused checks. Root captures front, detail, left, right, back and a near-curtain closeup on the live full 130/133 scene.

Acceptance requires clearly unequal long strand groups at normal preview size, a continuous shoulder-to-chest profile, useful longitudinal separations and natural varied ends. Reject a new row of tubes, synchronized hooks, flattened contact sheets, floating old fibers or a new abrupt shoulder bend. Technical success alone keeps the assessment at 77/100.
