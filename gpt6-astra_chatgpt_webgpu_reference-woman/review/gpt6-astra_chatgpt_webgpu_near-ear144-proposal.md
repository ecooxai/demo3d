# Near-ear route144 — diagnosis and proposed scope

**Author:** GPT-6 Astra / ChatGPT / WebGPU. **Status:** read-only proposal; no candidate geometry, production edits or native144 renders. **Accepted quality:**77/100, unchanged.

## Decision proposed for root

Try one original rooted near-side curl, **guide138**, together with its existing54 fine surface ribbons and its existing dependent flyaway40. Correct its short route over the upper outer pinna, then take it around the outer rim and back into the current hair. Keep the actual crown root, the lower curl and all other hair families fixed. This is a candidate for a limited upper-ear veil; its visual gain is unproven.

The reference shows a swept-back hair transition partly covering the upper ear, with a readable lower lobe. In the accepted141 front/detail and the earlier141 ear close-ups, the model instead has a large, pale, almost uninterrupted pinna silhouette. The sparse original temple wisps do cross its front, but they do not provide the denser transition visible in image1. The corrected141 underside material removes a separate bright sliver below the lobe; that correction does not solve the upper-ear exposure.

## Actual cause and coordinate frame

The main near-front guides58–90, and the near-side curl guides133–138, use `continuousFrontRoot`. Because these guides have both `front:true` and `scalpRoot`, `guide()` assigns **`deformEar:false`**. Their MASS vertices and their attached DETAIL ribbons carry that flag. Disabling `earDepth` for these families would therefore be a no-op.

Their explicit near-side upper knot is approximately `(-.919−.008q, .27, .078)` in authored groom coordinates. The main front lower join is approximately `(-.915−.018q, −.78, .054+.012q)`; the curl lower join is `(-.94, −.91, .10)`. `points.slice(7)` starts that tail. The earlier point at array index6 is not part of the joined route. These shallow knot positions, followed by the groom's existing gravity compensation, explain the measured retreat behind the ear.

All coordinates below labelled **H** use the actual head-local frame after99 balance, matching the141 native probe. If `G` is the existing `makeMesh` gravity compensation and `P` is an authored hair position, the local upper region obeys

`H = G(P) + B`, with `B = (−.2335190813, −.0400851434, −.0382363696)`.

This is the model-X balance shift `−.24` expressed through the inverse of the accepted head rotation `Ry(.16) Rz(−.17)`. The complete proposed support is in99's uniform translation region. Hair-contact118 does not modify these upper paths.

The accepted115 ear reconstructed from the actual ear source, accepted proportion warp, yaw−25°, Float32 storage and the same balance has these bounds:

| H axis | Minimum | Maximum |
| --- | ---: | ---: |
| X | −1.163320661 | −.942519069 |
| Y | −.334505290 | .234596252 |
| Z | .050215442 | .239394590 |

These agree with the existing native141 ear bounds to floating-point rounding. This agreement checks the coordinate interpretation; it does not establish the clearance of a new route.

The native guide centers in the upper-ear band sit near H.X−1.15 to−1.16 and H.Z.025–.041. An additional source-only triangle query shows that, at H.Y.22, the ear is already absent at X−1.12 and is present near X−1.10. At that height its front depths include Z.132773 at X−1.10 and Z.173251 at X−1.08. At Y.20, the corresponding depths are .165333 and .195793. Consequently, a depth-only lift of the present center would also miss much of the upper rim in X/Y. The proposed change needs a small inward lateral passage near the top, followed by an outward return around the rim.

The four existing `ear-root141-rays` samples are around the lower-lobe sliver. Their nearest hits identify CROWN backfaces and backing MASS surfaces. They are useful ownership evidence for141; they are not upper-pinna collision samples.

## Smallest selected dependency group

Guide138 is the last of the six original near-side curls. It has `scalpRoot:{side:−1,u:.680}`, `front:true`, width parameter `.044207815`, depth parameter `.019444784`, and the original continuous root exit near authored `(-.641332,.848372,.484480)`. Its opaque section is narrower than the main front locks, whose widths are about .059–.071. It already continues into a full lower curl rather than ending beside the ear.

| Existing geometry | Exact source ownership |
| --- | --- |
| Guide138 MASS | Vertices75762–76310; triangles132480–133439 |
| Its54 regular DETAIL ribbons | Vertices317086–320217 |
| Its existing dependent flyaway | Flyaway slot40; initial guide parameter `.3224321780`;50 existing DETAIL vertices |

The flyaway assignment was traced with the original procedural random sequence. No random draws were added or skipped. There is no need for guide137 or a new population in the first study. The source-only ownership trace built no output meshes and used about237MiB peak RSS for1.07s.

All other MASS guides, all other regular/flyaway fibers, CROWN, accepted133 fringe and WISPS are outside this proposal. Hair director confirmed that142's crown/front-wisp work leaves this MASS/DETAIL family untouched. Parent's143 lower-region boundary is authoredY−1.05; the proposed center correction ends at−.58, with a separate interpolation guard before−1.00 for the derived fine curves.

## Proposed route coordinates

These are **center targets for review**, not a frozen spline or validated swept surface. They retain authoredY exactly. The small changes in H.Y come from the existing gravity compensation when X/Z move.

| Authored Y | Existing center in H | Proposed center in H | Purpose |
| ---: | --- | --- | --- |
| .65 | (−.987600,.609915,.330674) | Exact original | Start after the retained rooted prefix, with zero displacement jets |
| .45 | (−1.108918,.409915,.131153) | (−1.070000,.409915,.270000) | Continue the existing swept root without its sharp depth retreat |
| .27 | (−1.160087,.228565,.038493) | (−1.095000,.228660,.235000) | Pass over the upper outer helix |
| .18 | (−1.161545,.135583,.030273) | (−1.148000,.135647,.180000) | Turn toward the outer edge, leaving the inner bowl open |
| .05 | (−1.161104,−.001332,.000771) | (−1.195000,−.001744,.070000) | Pass outside the pinna rather than down its front |
| −.10 | (−1.155634,−.162467,−.048802) | (−1.205000,−.163663,−.010000) | Return behind the ear from the outside |
| −.32 | (−1.136566,−.403001,−.124517) | (−1.180000,−.405048,−.120000) | Release the outward bow below the lobe |
| −.58 | (−1.101115,−.690301,−.166676) | Exact original | Rejoin the existing lower curl with zero displacement jets |

The largest listed authored displacement is approximately ΔX+.06536, ΔZ+.19642 at Y.27, about.207 head units in total. This is a substantial local depth correction, despite involving one guide. A fit must be capped and must report its continuous maximum; these waypoint values are not a global displacement bound.

The intended visible coverage is the **upper outer part of the pinna, approximately H.Y.14–.235 and H.X−1.12 to−1.07**. That is roughly the upper sixth of its height at the central veil, with a narrow continuation beside the outer rim. The actual projected area depends on the original swept ellipse and attached fibers and remains to be measured. The inner bowl and the lower lobe should remain readable. The lower outward passage is a clearance route into the existing hair, not a request to cover the whole outer ear.

## Geometry mechanism and invariants

Use compact C2 functions `a(y), b(y)` to correct the existing guide as `(x+a(y), y, z+b(y))`, fitted to the reviewed targets. Their values and first two derivatives are zero at the retained prefix and lower rejoin. Keeping authoredY and the original curve parameter preserves existing root/tip weights and the source color/UV schedule. The center map has determinant1; this alone does not prove that a re-framed swept section stays clear or nonfolded.

Do not rebuild `continuousFrontRoot` with a changed knot and recomputed arc-length cuts. That would change parameter locations along the entire lower curl even where its geometric path was meant to stay fixed. Decorate the existing curve while retaining its `t` domain and exact outside-support returns.

Apply the decoration **before** `fitLowerGuides118` and before construction of MASS and its fine curves.118's `g.original118` then retains the reviewed upper route; applying144 afterward would cause the current `protectUpperFiber118` path to restore old upper fibers and separate them from the moved MASS. Derived fine curves need an explicit lower support guard because Catmull-Rom interpolation can carry a changed control point beyond the center correction. All geometry at authoredY≤−1.05 must remain byte-exact, including the dependent flyaway.

Rebuild the existing swept geometry's normals from its actual triangles. Keep widths, depths, original material objects, vertex RGB, UV0, indices, alpha, procedural texture bytes, mesh count and draw groups unchanged. No shader or per-frame operation is proposed.

## Required narrow checks if root approves implementation

1. Sample the **entire swept MASS section and its triangles** against the actual accepted115 ear, using the consistent H frame. The center targets alone do not establish clearance. Also check the attached fine ribbons and the root/scalp transition. A small positive physical gap is appropriate; a large floating gap is not.
2. Keep the source root prefix and the below−1.05 region exact. Check topology, UV/RGB/texture bytes, original random dependencies, finite unit normals and actual triangle orientation. Separate any pre-existing overlaps from new intersections.
3. Use one native off/on comparison on the ordinary current display path: front/detail, both profiles/back, and the existing matched ear/ear-oblique cameras. Look specifically for a natural upper veil, an open lower lobe, an exposed blade/strap, a raised root, or a new side bulge. A technically safe route should still be rejected if it creates those visible artifacts.

114's failed14 new short cover locks were independent geometry and read as broad floating strips.144 must not reproduce that appearance with an existing guide. Retaining a real root and only one narrower curl improves the premise; it is not an artistic guarantee.

## Inputs and limitations

Visual inspection used only `reference/image1.png`, accepted `crown-sides141-five-2-front/detail.jpg`, `ear-root141-ear/ear-oblique.jpg`, and the historical failed `near114-1-front/detail.jpg`. No source-image feature extraction, recoloring or image generation was used.

Source reasoning used `src/hair-groom.js`, `src/ear.js`, `src/near-ear.js`, `src/portrait-proportions.js`, `src/portrait-pose.js`, `src/portrait-balance.js`, `src/lower-guide-placement.js` and the existing115/141 source/native evidence. The ear comparison uses the established local source harness, including its documented centripetal-curve implementation; native Three remains authoritative for a future rebuilt candidate.

| Input | SHA-256 |
| --- | --- |
| Current main141 | `2e1e13d2fe6bbc87a29809ce6d0aa12dc8ee70853dac2c4a82322c58d703593a` |
| Current groom133/118 | `a7b04c16fd8e13277e9418954c996c2370895f84ef446ed295ccb942a73a002d` |
| Ear geometry source | `ae8ca8de8e1a75ebb1f985b912338bca068debf129659119cc80edff6d86b5d9` |
| Accepted115 ear helper | `fb07d572e9759ace39417cb411b5efb7274ef54f1aaaf9ce38900fefbc6ee4fb` |
| Native141 geometry probe | `2072143e2c2e9a1871fcd36722e084fb0e7e5510fe6f140b4aaa5c233004136` |
| Native141 lower-lobe rays | `8a082151ae0079cbc281700c1a9ad13a03080decca6f5bfe566c342935e9a3fe` |

No144 helper or native wrapper has been implemented. No improvement score is assigned before a rendered comparison.
