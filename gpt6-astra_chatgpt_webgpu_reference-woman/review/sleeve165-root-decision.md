# Sleeve study 165 — root visual decision

Date: 2026-10-19. Accepted production remains iteration 164, 78/100. Goal remains unmet.

## Decision

Select the revised sleeve as a modest component improvement for the next controlled integration. Do not assign it a separate overall scene quality gain or change the live 164 source yet.

The root reviewed the ordinary front, isolated garment, both profiles, back, and sleeve close-up in matched OFF/ON native WebGPU captures. The ON sleeve has a slightly clearer tucked fold and a small inward break in the outer upper-arm silhouette. Its attachment line remains continuous and slender in the close-up. The profile change is restrained; the opposite sleeve, back, face and hair remain visually stable in this comparison. I do not see a new pinched spike, doubled seam, pale open gap, or hard projecting ledge. The garment-only camera clips much of the target sleeve, so that view alone is insufficient evidence; the ordinary front and dedicated sleeve/profile views support the decision.

This remains smooth, lightly described cloth. It is not a claim of complete fabric realism, a large likeness improvement, or AAA quality. The reference provides a front view only; the side construction is authored inference.

## Technical evidence already completed

The immutable-164 native report is review/sleeve165-native-report.json, 842117 bytes, SHA-256 cd95a3e8be303755ef3142f0db3b6e97af297326f4b67728b043d81150c5ef73. The selected helper is review/sleeve-fold-candidate165.js, SHA-256 965cbc0351f601f36e78d55e0cb98ca4b319a026c1c5ea0ba81a479c6a3f3934, guarded by the frozen sleeve165 manifest.

The change owns 990 torso/sleeve vertices and 135 vertices of the existing image-left sleeve attachment. It changes 1098 positions and 1121 normals in total, preserving the remaining geometry and all UVs, colors, logical indices and material/map bindings. Existing live position and normal buffers are updated atomically because the retained 154 preparation owns those geometries. Application occurs after 117, 154 and 158 and before the existing 99 balance exactly once.

The completed source check reports no new degenerate or reversed affected triangles, minimum sampled deformation Jacobian 0.755265, and maximum displacement about 0.04113 world units. The native contact check retains the same five fixed hair/cloth contacts and adds none; the source fixture's zero-contact result must not replace that native count. All 113 tracked seam supports remain matched. Maximum added directional support gap is about 0.001512; this is not an unrestricted nearest-distance guarantee.

Native helper time was 17.1 ms, with 530256 staging bytes and no staging retained by the candidate. The private QA backup allocation was 1229452 bytes and the one-time balance proxy took 6.3 ms. These are single-run measurements, not a general performance benchmark. Restored fronts match OFF exactly, and the native report records zero errors, zero idle geometry writes, and exact restoration of protected resources. No optional rerender is needed before a combined integration is ready.

## Next action

Keep study 165 frozen. Integrate its exact selected helper only alongside other art-approved changes, preserve the accepted preparation order and once-only behavior, then check the ordinary combined front, detail, profiles and back. Continue the chin, eye sampling and hair work; the accepted overall score remains 78/100.
