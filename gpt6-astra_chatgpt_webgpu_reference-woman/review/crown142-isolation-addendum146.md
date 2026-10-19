# Candidate 142 — isolation qualification added during read-only 146 diagnosis

This addendum accompanies the immutable `crown142-visual-decision.md`. Its decision is unchanged: root ON 75/100, independent ON 76/100, both reject and retain accepted 141 at 77/100. No 142 source, audit, wrapper or image is changed.

**The native pair does not guarantee equal final CROWN RGB atlas bytes.** Candidate 142 preserves the original source map bytes, UV0, vertex alpha, material constructors and the 100 processing code. Its source audit checks those maps **before** main applies reference-crown 100.

`src/reference-crown.js` subsequently rebakes the atlas using the current posed CROWN vertex normals. Its contrast weight includes `smooth(0, .42, facing)`. Candidate 142 changes the surface and its normals, so it can change that weight and the final RGB atlas even with identical photograph, UV layout and sampling code. The existing coverage map and vertex-alpha inputs remain unchanged. The source audit's original map equality is therefore a pre-100 equality, not a claim about the final native atlas.

Under accepted 141's `FrontSide` setting, some repaired chart faces also change from facing away from the front camera to facing toward it. This can expose a previously hidden surface bank. Its visibility and broad shape are separate from the contrast that 100 then applies to it. The ordinary front/detail rejection concerns the resulting flat, blunt bank and squared forehead opening; the precise contribution of atlas contrast to the smaller crimped pattern is not isolated by the available pair.

Read-only measurements and their limitations are recorded in `crown146-diagnosis.json`. They classify camera-facing triangles rather than ray-tested visible pixels, and sample the 100 normal weight at triangle centroids rather than counting changed atlas texels. No material/alpha rescue or new 142 strength mode is proposed.
