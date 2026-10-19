# Crown departure 136 — native visual decision

**Reject strength 1 at 75/100. Retain strength 0 / accepted 133 at 77/100. No integration, export characterization or intermediate-strength sweep.**

I independently viewed all twelve `crown136-{0,1}-{front,detail,left,right,back,junction}.jpg` images and re-viewed the sole reference `reference/image1.png` during this review turn. The source audit and native execution passed, but the candidate does not improve the visual result.

## What the images show

The opaque triangular return is reduced. That geometric diagnosis was useful: the candidate visibly changes the intended piece of the old boundary rather than only recoloring it. The replacement is worse, however. The released center/right paths resolve into a tightly gathered wavy hank, with conspicuous small hook and loop shapes close to the old part edge. Tiny pale openings remain at the seam beside that hank. The left transition acquires loose crossing strands and a frayed, net-like inner edge rather than the continuous, softly bowed hierarchy in the reference.

These defects are visible in the ordinary front portrait and detail view. The junction capture makes their construction especially clear: the retained crown still reads as a broad opaque lid, and the modified fibers form a second visibly different, stringy band immediately below it. Removing the triangle did not remove the dominant cap-to-fringe discontinuity.

The reference has longer coherent diagonal bows and uneven but smooth separation from the upper sweep. It does not have the short, tightly wavy central fringe created here. The accepted 133 long diagonal remains intact and useful, but the new neighboring flow competes with it.

Both profiles and the back are broadly stable. I see no large new silhouette loop, loss of rear coverage or long-hair movement. That confirms the usefulness of the protected scope; it does not offset the frontal regression. The main failure is the visible shape and distribution of the redirected paths, not merely a stronger highlight on the retained DETAIL material.

## Why the source pass was insufficient

The paths are finite, descending in Y, sampled as supported and tangent-continuous at their joins. Those conditions did not prevent visible lateral reversals or several neighboring paths gathering into the same narrow wavy region. Projected coverage measured how much of a finite window contained hair; it did not establish that the overlapping path directions formed a natural clump. The retained bed also still ends as a broad distinct surface behind this new strand population.

The useful result is narrower than the proposed solution: the old front-return layer really contributes to the triangular wedge. The current redistribution of its fibers and the accompanying bed withdrawal are not an acceptable replacement. Do not try to rescue this render through a material adjustment or a weaker strength alone.

## Execution and disposition

Both native cases used WebGPU and reported no nonfinite attributes or page errors. Hair stayed at 1,114,888 triangles and 52.49 MiB. Native construction was 1,727.6 ms off versus 1,746.7 ms on; observed heap was 339.09 versus 349.17 MiB. Performance is not the rejection reason.

All 136 candidate, helper, audit and native-wrapper files remain frozen. Accepted 133 geometry, 100 crown atlas, materials and production files remain unchanged. The separate 141 sidedness review can proceed independently.
