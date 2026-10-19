# Eyelash 151 — native interpretation and adoption recommendation

## Decision

**Recommend adopting 151 ON as a bounded improvement, retaining the overall score of 78/100.** Root and the independent quality reviewer also favor ON at 78. This recommendation uses the actual native contact report, the decoded restoration comparison, and direct inspection of all 12 matched images against the sole supplied photograph. It does not claim an intersection-free model or a whole-scene quality point.

The shorter, tapered lashes reduce the upright, evenly spaced pin appearance, especially around the far upper eye and in the eye close-ups. Their roots remain connected to the accepted eyelid shape. The front-view improvement is modest; the detail improvement is clearer. I did not see a new gap, eye poke-through, highlight fleck, or fringe hook in the matched front, detail, left, right, eye, and eye-oblique views. The unchanged lower waterline and source-map lash detail remain visible and are not improvements attributable to 151.

No additional native test is justified by the remaining evidence. The frozen helper, audit, wrapper, and manifest remain unchanged.

## Evidence and scope

Root ran the fresh OFF/ON native pages on accepted 149, using ordinary WebGPU rendering, Neutral tone mapping at exposure 1.4, 900 × 1200 output, and AA2. The native report is `review/eyelash151-native.json`, 1,402,508 bytes, SHA-256 `ccf5643c7e291ae66acd7461248d8d3079fd385620e4778908b0e6d9808af922`. I verified the local report size and digest. The separate decoded comparison is `review/eyelash151-restoration-diff.json`.

Only the two existing `individual-eyelashes` geometries change. The inventory remains 80 fibers, 2,064 vertices, and 2,616 triangles. All 320 accepted root-ring vertices remain exact. The original index values/order, UVs, materials, and all other surfaces remain protected, including the accepted 147 eye contours and 140 lips. Native checks cover 282 original attributes and 10 source images. There are no browser errors, additional idle frames, source-resource disposals, added draws, added textures, or per-frame work.

Actual native construction took 100.5 ms. The continuous displacement upper bound is 0.01514891 head units; maximum emitted-vertex displacement is 0.01381669. The maximum centerline length-ratio upper bound is 0.90234602. Actual finite triangles have no new degeneracy or reversal. The smallest area ratio is 0.02849387, reflecting the deliberately narrow tips. The positive section-Jacobian results are longitudinal samples with exact radial minima at those sections; they are not a global volume-injectivity proof.

## Ocular contacts: attachment redistribution

The native contact audit defines the root region as the first six triangles of each fiber, spanning the first longitudinal strip. It includes the fixed root ring and the following ring, which can move. Therefore exact roots do not imply exact contact identities across the entire first strip. All subsequent strips are classified as distal in this report; that label does not mean only the fiber tip.

| Eye / unchanged receiver | Root pairs OFF | Root pairs ON | New identities | Removed identities |
| --- | ---: | ---: | ---: | ---: |
| Left sculpted eyelids | 268 | 268 | 0 | 0 |
| Left upper lash margin | 394 | 388 | 5 | 11 |
| Left lower waterline | 160 | 160 | 4 | 4 |
| Left lower tear meniscus | 119 | 119 | 0 | 0 |
| Right sculpted eyelids | 256 | 254 | 0 | 2 |
| Right upper lash margin | 451 | 449 | 1 | 3 |
| Right lower waterline | 137 | 137 | 1 | 1 |
| Right lower tear meniscus | 132 | 132 | 5 | 5 |
| **Total** | **1,917** | **1,907** | **16** | **26** |

The 16 new identities are all within these first attachment strips. The largest preceding OFF separation among them was 0.00002274803 world units; the smallest was 0.0000001945655. All have ON triangle distance zero. A zero unsigned triangle distance establishes contact/intersection; it does **not** measure penetration depth. The small preceding gaps should not be presented as measured ON overlap depths.

The complete new-pair examples localize the changes to left upper fibers 0, 4, 5, and 7; left lower fibers 1 and 3; right upper fiber 21; and right lower fibers 1, 7, 8, and 9. These are contacts with the existing lash margin, waterline, or meniscus, rather than distal penetration of the eyeball. Both modes have zero audited distal contacts with every ocular receiver. Both root and distal regions have zero audited contacts with iris, cornea, sclera, or the continuous face within the report's bounded comparison window.

The earlier source fixture did not include all margin, waterline, meniscus, and groom surfaces. Its smaller contact inventory cannot supersede this native result. The native report is the authoritative contact evidence for the prepared scene.

## Fringe contacts: fewer total pairs, genuine new identities

The near-side distal lash/fringe count changes from **94 to 48**, comprising **40 new identities, 86 removed identities, and 8 retained identities**. Root/fringe contacts remain zero; the far eye has no audited root or distal fringe contacts.

The report stores six representative new fringe pairs, all on moving triangle 660: upper near-eye fiber 18, in its third strip at approximately one-third to one-half of its length. These six receivers are existing fringe triangles 50593–50597 and 50599. Their previous OFF gaps were approximately 0.00006813–0.00010266 world units; each ON distance is zero. The report does not retain locations for the other 34 new identities, so it does not support assigning all 40 to that one fiber.

These are actual triangle contacts with the existing opaque fringe material. They cannot be dismissed as alpha-mask broad-phase artifacts or mere hash noise. Fewer total pairs alone is also insufficient to prove improved visibility. The matched native views provide the relevant additional evidence: no new visible lash spike, hair fleck, or broken eye border is apparent. The remaining 48 contacts are documented geometric debt, compatible with this limited static-view adoption. The whole scene is not certified disjoint, and future animated or newly exposed views would require their own evaluation.

## Restoration and resource ownership

Both OFF-restored and ON-restored front PNGs are 506,631 bytes and have the identical complete SHA-256 `58afd99ad40f4af83a39abdb2a831e123ef997dd00549d61231019d69a5f05a2`. Thus the candidate cleanup reaches the same compositor result as the untouched comparison page after the same view sequence.

Neither restored PNG has the initial OFF compositor hash. Root decoded the existing initial and OFF-restored captures without rerendering the scene. The 796 × 1061 image contains 3,069 changed pixels / 8,995 changed channels, with a maximum channel difference of 3 bytes. Every changed pixel lies within x = 21–120, y = 1006–1036, the lower-left preview control rectangle. All portrait pixels outside that rectangle are exact. The channel-difference histogram is 3,130 values of 1, 5,832 of 2, and 33 of 3.

This supports unchanged portrait restoration and identical OFF/ON restored compositors. It is **not** an initial full-compositor equality pass. The cause of the tiny control variation was not established and is not attributed to a specific CSS, hover, or rendering mechanism.

Both private geometries are disposed and original bindings restored, with zero original disposals. Replacement attributes total 81,744 bytes before upload and 97,440 bytes after the renderer's index widening; the attribute/index GPU estimate is also 97,440 bytes. These are replacement allocation sizes, not permanent increases of the same amount. This QA retains 81,744 bytes of old selected buffers for restoration. The production helper retains no old geometry by default, and native preparation uploads the replacement before any old selected geometry is uploaded. Upstream accepted controllers may separately retain their own references. The report explicitly accepts only exact-value Uint16/Uint8-to-Uint32 index widening; it preserves checks on the original source data and all non-index attributes.

## Promotion boundary

Promote only the frozen 151 helper and sweep through the existing once-only prepared-head path, after accepted 147, with the default `retainSourceForQA: false`. Keep 149 hair colors, 140 lips, all eye surfaces and optical materials, the source atlas, and the margin/meniscus geometry unchanged. This review does not request additional diagnostic modes or a parameter sweep.
