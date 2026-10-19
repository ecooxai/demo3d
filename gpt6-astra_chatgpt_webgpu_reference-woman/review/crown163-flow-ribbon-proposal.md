# Iteration163 — proposed regular crown/fringe flow ribbons

**Read-only proposal; no implementation or native sweep has started.** Accepted149/157 remains78.156 is rejected. The proposed change is one coarse construction whose geometry, texture direction and coverage share the same root-to-end coordinate.

## One different structural premise

Build approximately24 shallow overlapping ribbons from a small ordered guide net, with16 on the larger left sweep and8 on the smaller right sweep. Each ribbon follows one continuous route from a supported root through the crown into an independently chosen endpoint. Adjacent ribbons overlap through the dense scalp region; they narrow at different physical distances before their foreground ends separate. There is no filled two-bank silhouette polygon with clefts cut into it, no closed circular tube and no second backing plate.

This differs from150's independent lifted tubes: the roots lie on one shared, shallow support envelope, and ribbon width is tied to neighbor spacing instead of giving separated root centers independent radii and depth. It differs from156's joined bank: the occupied surface follows hair growth from the beginning, and its thinning is distributed along those same routes. The part is an ordered seam between two root fans, with no convergence of all faces to a common triangular tip.

The source's longer left diagonal is the principal foreground route. Several smaller routes sit beside it with unequal endings; the center-right families are thinner, shorter and less numerous. Most of the root fan turns into the side sweep rather than continuing down the forehead. The coarse silhouette must show this hierarchy before any new fine fibers are considered.

## Geometry and support

Use a regular quad strip grid, initially48 samples along each ribbon and6 across it. A small set of cubic/Hermite guide rails controls the two fan fields. Corresponding cross-sections have ordered neighbors and one shared depth envelope against the actual prepared147 head. The field may have unequal broad crown lift, but it must not fit a global thin-plate interpolant through hundreds of boundary/interior points.

Through the region declared as dense scalp hair, each strip's width is its adjacent-guide spacing plus a small overlap. All overlap decisions use the same cross-section coordinate and shared depth so the strips cannot create150's root-depth ladder. The transverse surface is shallow and curved; width is substantially larger than depth. Approximately.003–.008 local depth above the common envelope gives finite relief without introducing circular rope sections. The envelope itself follows actual indexed scalp support and the accepted outer crown volume, with a smooth upstream underlap.

Tapers start at different positions along the routes, rather than after a shared cleft rail or a commonY. Physical width and vertex coverage both go to zero at the same terminal interval. Short companion routes do not inherit the principal route's full length. Additional fine fibers, flyaways and strand textures are outside this first gate.

Normals and tangent directions are derived from the same regular surface derivatives. TangentU follows the transverse coordinate and tangentV follows the actual route; the accepted anisotropy rotation continues to point along growth. No arbitrary triangulation, diagonal-flip optimization or harmonic UV solver is needed. A broad root-to-end bend should dominate the shape; local fitting that produces a raised hinge or tight wave is a rejection condition.

## Bounded ownership

The intended ownership is the original front CROWN region currently implicated in the hard lid, plus the upper/root routes of FRINGE groups0–5 and their corresponding dedicated front fibers/edge wisps. The old source arrays and100 layout remain retained for surviving CROWN; changes use a reversible index selection and one independent ordinary mesh.

The initial envelope for the retirement is the two original charts at `u>=.625`, but163 does not inherit156's copied9-column collar, cleft polygon or failed branch rails. The exact retired triangles must be derived from the declared supported upstream underlap and recorded before native. Any narrower or wider cut requires an explicit coverage reason; it cannot be chosen afterward to hide a miss.

Preserve foundation/rear, all MASS, all attached long DETAIL, temple94, ear geometry, lower118, contact86 and all face/pose/blouse work exactly. FRINGE group6 remains protected. For group0, preserve the successful accepted diagonal as a target below unbalanced posedY=.45, and retain its already emitted lower fine rows directly during the coarse comparison. Groups1–5 may release their complete routes so a short protected-prefix hinge does not force another crimped bank. Exact old upstream fine index ranges will be hidden identically in coarse OFF/ON and reported; unrelated fine layers remain present.

If protected MASS roots occupy the intended new fan volume, report the concrete conflicting guides before expanding ownership. Do not displace them with an ad hoc per-vertex depth clamp.

## UV and material contract

Each new ribbon has an explicit longitudinal coordinate proportional to physical arclength and a transverse coordinate proportional to its width. The coarse material is one private clone of the **existing pre-tint MASS material**, using the existing original procedural MASS RGB/alpha map and longitudinal normal map. There is no new external asset, image generation, photographed screen projection or material-parameter sweep.

The UV-v range for the initial coarse surface stays in the original map's opaque portion, below the earliest procedural tip release. The new geometry's own taper and vertex alpha therefore own its termination; the old CROWN release mask cannot chop off a still-wide ribbon. Texture frequency in the transverse direction is specified per physical width rather than fitting a whole512-pixel tile into every strip.

This deliberately does not reuse100's CROWN RGB/coverage chart on unrelated new topology.100 remains exact on surviving original CROWN. The ordinary new mesh carries no100 export metadata, and149 tint applies once after its material exists. Its authored vertex color uses the existing procedural hair palette, not a source-color compensation copied from a differently mapped crown vertex. The first render is an incomplete structural diagnostic, so it cannot establish final pigment or fine-detail equivalence. No export work is needed before art acceptance.

## Independent coverage and the first art gate

Before emitting strips, declare the intended dense scalp area using the source-directed hairline and actual accepted scalp, independently of the candidate's footprint. Keep the156 intended region as an explicit comparison in the source evidence; if163's intended area differs, show the difference and its visual reason before sampling. Do not widen or shrink the region after observing misses.

At a few shared root-to-release sections, verify geometric overlap between adjacent ribbon intervals, actual emitted triangle support, orientation and lateral order. Then check the full interior in front and both oblique directions. Head-facing versus truly occluded samples must remain separate. A few successful attachment samples or positive UV areas do not establish coverage.

The first native pair is coarse OFF/ON on one immutable accepted baseline, with the same old owned fines hidden in both cases. Inspect ordinary front/detail first, followed by both profiles, back and junction. Reject immediately if it still reads as a root ladder, common band with opaque straps, scalloped helmet, raised part wedge, pale exposed edge or regularly clipped tips. Do not add fine fibers to rescue that outcome.

A useful coarse result must give a continuous left sweep, a smaller right root fan, gradual unequal release into the principal diagonal and companions, and modest profile lift with no visible scalp arc through the intended dense interior. Detailed surface grain is subordinate to this gate.

## Complexity and integration budget

The initial24×48×6 strip grid has13,824 triangles and8,232 vertices before any necessary boundary duplication. With position, normal, UV, RGBA vertex color, explicit tangent and indices, a target below.75MiB for the new mesh is realistic but must be measured. Retiring roughly the old12,288 front triangles keeps the expected whole-groom increase small. There is one extra draw/material, no new texture allocation and no per-frame work.

Regular sampling removes156's initial triangulation, repeated diagonal flips and harmonic solve. Actual-head support queries are still required. The native preparation target is below250ms, not a promised measurement; stop at a useful first art gate rather than tuning a rejected surface for speed.

Implementation would remain in new review modules with a root-owned native wrapper. Source checks cover finite emitted geometry, protected buffers/RNG, actual support/overlap, UV/tangent direction, once-only149 and restoration. Only after a visible coarse gain would the matching fine layer or export contract be addressed.
