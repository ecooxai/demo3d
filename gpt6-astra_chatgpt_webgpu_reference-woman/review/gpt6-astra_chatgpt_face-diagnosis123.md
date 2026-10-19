# Face diagnosis123: bounded lower-nose depth study

Reviewer: GPT-6 Astra / ChatGPT, `/root/glb_export_repair`.

**Proposal only; no geometry, mapping, material or production changes have been implemented. Current assessment remains 76/100.**

## Visual finding

I inspected only the specified `reference/image1.png` and `near115-25-{front,detail,left,right}.jpg` for this diagnosis. The face is unchanged through the subsequent cloth/export/palette work.

The strongest new geometry hypothesis is the lower nose. The current model reads as more projecting and harder around the central tip/alar transition than image1's soft, compact tip. The frontal under-tip transition contributes to that impression, and the constructed profiles show enough forward projection to make a small depth reduction plausible. I would test that relationship before moving already registered facial features.

The eye-to-mouth layout is already reasonably close. The remaining dark far-eye and cheek regions cannot be treated as proof of a geometric hollow: the prior material-isolation studies identified photographed shading there. Brow/fringe boundaries and the broad hair masses also affect facial likeness, but separate agents are working on the hair, and this proposal does not change them.

This is an inference from the supplied frontal reference, not a measurement of the person's true nose depth. The profile renders are useful for checking a plausible constructed shape; image1 does not provide a true profile for direct matching.

## Relevant source and accepted history

`src/face.js` independently sculpts the nasal bridge, tip, alar region and columella before its initial landmark warp. The lower tip term has an effective amplitude of 0.150 head units where its existing `nasalBlend` is fully active. The current proposal is a small reduction of that projecting form, not a replacement nose mesh.

`src/reference-skin.js` assigns the existing facial atlas from canonical X/Y. Its landmark correspondence places the nasal tip at canonical `[0,−.475]`, the naris centers near `[±.113,−.537]`, the eye centers at `[±.342,.050]`, and the mouth seam near Y −.788. The atlas UVs are assigned before the accepted post-bake deformations. Preserving those UVs keeps the same photo features attached to their geometry.

The source helpers and `review/quality-journal.json` establish these constraints:

| Earlier work | Established outcome | Consequence for 123 |
| --- | --- | --- |
| 32 eye tangent correction | Shared eye-surface depth correction with aperture corners fixed | Preserve all eye, iris, cornea, aperture and lash geometry. |
| 36/40/45 jaw and cheek artifacts | Source-color problems corrected in the atlas | Do not infer another jaw deformation from those old dark marks. |
| 49/61 socket and nasal-wall tone | Accepted caps 14/7; larger socket caps gave little gain | Keep those source-tone corrections fixed. |
| 50 lower-face compaction | Factor 0.94 retained in production | Use its known coordinate derivative when transporting normals. |
| 58 lower-cheek taper | 2.5% accepted; 4% begins to pinch | Keep the selected taper rather than increasing lower-face narrowing. |
| 65 cheek tone | Strength 0.60 accepted; 0.90 gives little benefit | Keep its photographed-shadow correction. |
| 67 lip thickness | 6% accepted; 8% adds little; seam/corners fixed | Keep all lip geometry and material behavior. |
| 77–79 outer canthus tone | Cap 40 accepted with aperture/lash guards | Leave atlas samples and those guards unchanged. |
| 95/96 brows | 95 too thin; 96 accepted broader version | Keep the accepted brow guides and atlas contribution. |

Root confirmed there is no reliable additional rejected nasal geometry or chin trial to invent beyond this evidence.

## One proposed change

Apply a single smooth backward displacement along the anatomical head's Z axis to the lower nasal complex:

- Canonical field center approximately `(0,−.43)`; elliptical radii `(.24,.22)`.
- A small flat inner core followed by a C2 falloff, with exact zero outside the ellipse.
- One depth parameter, initially compared at 0, 0.012 and 0.024 head units backward. The hard maximum is 0.024.
- A smooth front-surface gate that is fully active on the nose and zero on the rear head.
- Apply the identical spatial field to `continuous-face`, `naris--1` and `naris-1`. Move no other mesh.

This support spans canonical Y approximately [−.65,−.21] and X [−.24,.24]. It stays below the eye/lid/lash region and above the actual lip meshes. Moving the naris patches with the face avoids leaving floating nostrils on a recessed skin surface. Because the field is the same at corresponding X/Y and fully active in Z there, their original tiny face separation is retained.

The expected gain is a quieter tip projection and a softer transition into the adjacent alar skin, visible primarily in detail and quarter/profile views. A clearer likeness gain in the full portrait is a hypothesis to test, not a promised score increase. Excessive retreat could flatten the bulb and make the nose look pasted onto the face; the small maximum and the profiles are intended to expose that failure quickly.

## Registration and rendering safeguards

Define the support from the existing atlas UVs, rather than recovering canonical X/Y from geometry that already carries the pose and balance translations. In this local nasal support, the accepted cheek taper is identity in X, and the lower-face compaction is the constant 0.94 Y transform. Those relationships provide the analytical derivative for normal transport. The later whole-head pose/balance translations do not alter that derivative.

Only anatomical Z positions and the affected authored normals would change. X/Y, UVs, indices, material groups, texture/source objects, atlas bytes, TPS landmarks, eye textures and all corneal properties remain fixed. Use the analytic inverse transpose for the new field rather than recomputing normals over the entire face. In the fully active nasal region, a Z displacement depending only on X/Y has determinant 1; any front-gate transition must also have a positive bounded Jacobian.

For the first isolated comparison, apply the study **after** the accepted one-time skin illumination compensation. That keeps the displayed atlas byte-identical and lets the comparison answer a geometry question. Rerunning compensation simultaneously would introduce a second variable and could disguise the cause of any improvement or regression.

Existing 120 GLB material preparation and the normal viewer render path require no change. The study must not invoke a standalone screen-target `compileAsync`, alter the cornea/transmission materials, or substitute eye artwork.

## Acceptance criteria if aligned

Use fresh models at the three depths. First establish exact preservation of every protected eye/lip/ear/brow attribute, all atlas UV/data bytes, material/texture references and topology; confirm finite unit normals and a positive Jacobian in the affected region. Then compare matched front, face detail, quarter, left and right views under the current lighting, with a short relit check only if the first views show a useful gain.

Select a nonzero amount only if the lower nose looks more natural and closer to image1 without a flattened bulb, nostril separation, new fold, or loss of eye/nose/lip registration. If the visible discrepancy survives in the unchanged source shading, reject this geometry study rather than adding a simultaneous atlas retouch. Keep 76/100 until an actual integrated visual improvement warrants another assessment.

No original-image measurements, image generation, external assets, Mac/browser actions or source edits were performed for this proposal.
