# Independent visual decision — eye contour147

**Recommendation: ACCEPT 147 ON. Subjective overall score: 78/100, compared with OFF at77/100.** This verdict was sent to the parent before the parent supplied its artistic score. It is a recommendation for the parent’s integration decision; this review does not change production.

Reviewer: GPT-6 Astra / ChatGPT built-in agent, `/root/glb_export_repair`.

## Visual basis

I directly viewed sole `reference/image1.png` and all14 local comparison images: `eye-contour147-{0,1}-{front,detail,left,right,back,eye,eye-oblique}.jpg`. I compared ordinary front/detail before judging the enlarged eye images. The source-control residual and passing technical gates were not treated as artistic points.

The gain is visible at ordinary size. ON gives the inner corners and lid-to-iris relationship a more open, attentive shape that is closer to image1. The baseline far eye has a heavier, more slanted expression; ON reduces that impression while keeping the overall gaze and closed-mouth expression coherent. Both eyes now read more consistently with the reference’s open, calm expression. This is a small likeness improvement, not a claim that the portrait has reached realistic production quality.

| Matched view | Independent observation |
| --- | --- |
| Front | ON provides a useful eye-shape/expression change at ordinary viewing size. The benefit does not depend on an enlarged crop. |
| Detail | The inner-corner placement and lid/iris relationship look closer to the reference. The nose, closed mouth, lower-face outline and general expression remain coherent. |
| Left profile | No meaningful new protrusion, discontinuity or silhouette problem is visible. The sole frontal source cannot establish an exact profile likeness. |
| Right profile | The altered eye opening remains readable from the side; I do not see a new bulging iris, dark aperture or broken lid edge. |
| Back | No visible change. The native report additionally confirms identical OFF/ON back PNG hashes. |
| Eye | Both irises remain readable and the lid borders stay connected. I do not see a new lid/face gap or skin poke-through. The far iris is still imperfect, and the existing lashes and strong catchlights remain stylized. |
| Eye-oblique | The candidate remains coherent off axis. No visible corneal failure or newly exposed broken eye layer is apparent. The rounder far-eye opening improves the comparison without becoming a decisive new artifact. |

The ON face still has substantial limitations: stylized lash geometry, strong source-bound catchlights, simplified skin response and the existing groom construction. These justify a modest one-point assessment. They do not warrant an optical sweep or unrelated compensating edit as part of147.

## Verified native evidence

I read the complete local `review/eye-contour147-native-report.json` and verified its **773,341 bytes** and SHA256:

`375db921d8e72a999eba9d0d2bcf1959362c251298a81f311c2ec61ff739c6e8`

Both fresh pages passed with native WebGPU, Neutral tone map7/exposure1.4, 900×1200 output and1800×2400 AA2 rendering. All seven cameras match exactly. The report contains no browser errors, and both pages have zero additional idle frames.

The complete live scene includes64 source meshes,35 head meshes,282 protected attributes and10 source textures. The head’s5,838 zero normals remain unchanged, and113,664 outside-support head vertices preserve their stored position/normal components. The actual accepted140 upper-lip geometry reference remains exact. Cleanup restores all original geometry references, disposes31 wholly private geometries and disposes zero original resources.

ON moves47,479 stored head positions and changes70,885 finite triangles. There are zero new degenerate or reversed triangles. The global minimum area ratio is0.57233973, and minimum agreement with transported baseline geometric normals is0.99811471. The maximum fixed-control residual is0.00150803 photo pixels. These support the implementation’s bounded behavior; the ordinary visual comparison supplies the artistic reason to keep it.

## Contact qualification

The native report does **not** establish a globally disjoint face/hair assembly or zero new hair contact pairs. These preexisting overlaps change as follows:

| Pair population | Before | After | New identities | Removed identities |
| --- | ---: | ---: | ---: | ---: |
| Near lid / face |115 |111 |1 |5 |
| Far lid / face |122 |111 |34 |45 |
| Fringe / near individual eyelashes |106 |94 |75 |87 |
| Fringe / face |190 |189 |0 |1 |
| Fringe / near cornea |2 |0 |0 |2 |
| Wisps / face |2 |2 |0 |0 |

Iris/cornea, lid/cornea and lid/sclera gain zero contact pairs on either side. The dense-fringe/eyelash population is an especially necessary qualification: a reduced total does not erase its75 newly meeting triangle identities. In the supplied front, detail and eye-oblique images I do not see a new visible tangle, gap or eye-layer failure from those contact changes. That is a visual assessment at the captured views, not proof that all possible angles are artifact-free.

The contact routine retains the stated0.001 distance window and1e−8 meeting tolerance. Null distances are window lower bounds, not unbounded global clearances. It considers affected head triangles against only bounds-overlapping hair triangles. The native hair subsets contain195 crown,1,560 MASS,3,940 independent fine,21,667 dense fringe and4,026 wisp triangles; no whole-groom all-pairs claim is made.

## Resource interpretation

The actual helper took **71.3ms** once during initialization. The31 private replacement geometries total **9,361,962 CPU bytes before upload**, and **9,712,704 bytes afterward**. The report’s **9,734,976-byte GPU attribute estimate** describes the complete replacement inventory, including estimated widening/alignment; it is not a measured VRAM reading and is not an equal incremental allocation over the original model.

The test temporarily retained9,361,962 bytes of original replacement geometry for restoration. Production defaults to keeping only147 metrics and applies before the first GPU upload, so this helper does not retain those original geometry references. Earlier owners may still retain their own originals. No texture, draw group or per-frame work was added. All QA source records and listeners were released after comparison.

## Decision scope

Keep the frozen ON geometry field as the accepted candidate if the parent agrees with the visual verdict. Preserve its original UVs, atlases, eye materials and cornea settings. No further parameter sweep, optical adjustment, export audit or repeat native run is requested by this review. The frozen147 source, wrapper, audit and handoff remain untouched.
