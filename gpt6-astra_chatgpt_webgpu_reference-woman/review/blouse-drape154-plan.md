# Iteration 154 proposal — one uneven roll in the loose front cotton

**Approved isolated study: reshape one connected fold in the exposed image-left panel beside the middle body button.** Keep overall quality at **78/100 pending native art review**. The review-only candidate has been implemented; production geometry remains unchanged. The implementation amendments at the end record the constrained coefficients and full buffer ownership.

## Visual diagnosis

I compared the sole `reference/image1.png` with the current `eyelash151-1-front.jpg` and detail views. The older `cloth117-legal-50-garment.jpg` and `sleeve106-garment.jpg` help reveal the same underlying blouse geometry without hair, but their older presentation is not used as a current lighting comparison.

The exposed central cotton reads as a broad, rather rigid panel. The photograph has an uneven diagonal roll near the middle fastening, with a narrower hollow beside a broader relaxed shoulder. That is a useful visible shape target away from the neck, collar and outer silhouette. The exact depth is inferred from the front photograph, not measured anatomy or a recovered cloth simulation.

The source is not missing wrinkle functions. `fabricRelief()` and `secondaryClothRelief()` already include button pulls, a close placket channel and a hanging roll. Adding another set of small wrinkles would make the implementation more complicated without a clear new shape. I propose one stronger, asymmetric cross-section along the existing middle-left tension path, leaving the other folds alone. This retains correspondence with the existing painted shading instead of moving a geometric fold away from its map.

This also avoids repeating the prior changes: the 102-to-106 source difference is confined to the sleeve relief and description; 117 builds a bounded photographic torso-color atlas. Neither mechanism is altered here.

## Exact ownership and protections

Own only position and normal entries of **`blouse-continuous-torso-and-sleeves`** inside the following compact front-left band, in final blouse-local coordinates after its existing width transform and before body pose/balance:

- Let `C(Y)` be the existing `placketX(Y)` carried through the same two accepted width transforms. Let `d = C(Y) - X`.
- Front-left sheet only: original UV `0.75 < u < 1`, with positive front depth.
- Outer guard: `0.18 < d < 0.76` and `-0.96 < Y < 0.34`.
- Fold center: `Yc(d) = -0.209 - 0.44*d + 0.18*d*d`, following the existing middle-left button-pull direction.
- Compact support: `abs(Y - Yc(d)) < 0.27`, with C2 gates at every boundary.

A read-only evaluation of the current source grid finds **254 existing vertices** inside that compact support, from the torso's **21,809 vertices / 43,008 triangles**. They lie in columns 181–191 and rows 43–73 of the 192-by-112 grid; these are a bounding range, not a claim that every vertex in the rectangle is owned. The exact owned indices are the predicate above. Source-space bounds of that set are approximately X `[-0.5893, -0.0495]`, Y `[-0.6881, -0.0315]`.

Protect exactly:

- Every torso vertex outside that compact band, including all back, sleeve, shoulder, neckline, crop and opposite-panel vertices.
- The full central pinned strip, every separate placket/seam mesh, all four button assemblies, both collar leaves/edges/folds, both facings, neck and all hair geometry.
- All indices, UVs, vertex colors, material settings and maps. No geometry population changes.

## Coarse deformation

Use one smooth blouse-local depth field:

`(X, Y, Z) -> (X, Y, Z + H(X,Y))`.

`H` re-profiles the existing middle-left fold into a broad convex shoulder above a narrower hollow below it. The roll widens as it travels away from the pinned placket, then releases smoothly before the outer guard. It is one connected feature, not a sequence of repeated ridges. Keep the existing center path and use the same support envelope for both sides of its cross-section.

Initial bounded target: no more than **+0.040 outward / -0.028 inward** in blouse units, with the narrowest transition at least about **0.06 units** wide. Aim for a resolved ordinary-preview fold, not a knife crease. The exact peak and trough coefficients must be checked on the actual coarse surface before a native-ready freeze; do not silently exceed those bounds to force visibility.

X/Y stay bit-exact. The continuous field has determinant 1. Transport each accepted normal analytically by the inverse transpose:

`n' = normalize(nx - Hx*nz, ny - Hy*nz, nz)`.

Use the exact mesh-to-blouse frame, or assert the current identity transform explicitly. Do not infer derivatives from the photographic UVs or replace the accepted normals with a separate shading approximation. Zero-field positions/normals remain byte-exact.

## Integration and contact

Apply the isolated helper **after the existing 117 bake and before balance99**, on a fresh blouse. That preserves the exact accepted atlas bytes and its registration; unchanged X/Y and UVs keep it attached to the same cotton coordinates. Do not rebake 117 using the deformed normals, alter its mask, or change its material factor.

No hair route, 86 contact application or 118 guide placement is rerun. The active band is inside the exposed front panel; nevertheless, check the actual fixed hair triangles above it before approval, particularly at the outer band edge. The existing blouse query is not automatically a query of the newly deformed surface: for the changed region, diagnostics must compose the source support with `H` and its normal transform, then compare against the real candidate triangles. Do not claim unchanged hair clearance merely because hair vertices stayed fixed.

The collar and neck sit well above the active support. The placket and buttons lie inside its exact zero strip. Those seating relationships should remain exact by construction and by buffer comparison.

## Cost and the single native gate

Use the existing grid: **zero new triangles, meshes, textures or draw calls**. Per root's approval correction, the replacement must privately clone **all attributes and the index**, including unchanged UV/color/index bindings. The actual full clone costs **1,217,644 bytes, about 1.161 MiB**, before a possible native index widening. Shared immutable GPU bindings are unsuitable for the disposable replacement. Target a one-time helper below 20 ms in the native browser; report the measurement instead of asserting it. No per-frame work, solve, cloth simulation or fine subdivision.

Before native: check finite/unit normals, actual triangle area and orientation, exact protections, and sampled candidate-triangle clearance to fixed hair and sewn components. Continuous determinant 1 alone is not the triangle/contact gate. If the existing grid cannot resolve the chosen cross-section, widen it within this single roll; do not allocate a fine-detail mesh.

One OFF/ON comparison should include the ordinary front portrait, garment closeup, left/right profiles and back. Accept only if the fold is visibly softer and more cotton-like at ordinary size, stays subtle in profile, and does not become a padded bulge, embossed stripe or doubled shadow against the unchanged colors. The collar's triangular shape remains an explicit limitation of this deliberately separate study.

## Approved implementation amendments

The single roll stays inside the original ownership and displacement bounds. Its lateral gates were broadened to `d = [0.18, 0.36, 0.56, 0.76]` after the emitted original grid showed an unresolved entry in the first draft. No subdivision was added.

Actual fixed-hair triangles constrained the positive crest. The initial coefficient 0.040 introduced 35 new body–hair pairs, including guide133; 0.018 still introduced four fine-triangle pairs even though sampled point gaps were positive. An exact projected-overlap calculation for those four observed pairs gave an upper crest coefficient of 0.006513 with a 0.0005 margin. The final candidate uses **crest 0.006 and hollow 0.028**. This is chiefly a deeper asymmetric hollow beside a restrained roll, not the initial padded crest.

The final actual grid displacement is **+0.005321 / −0.025848**, with 254 owned normal entries and 250 changed Float32 positions. X/Y and all outside p/n stay exact. The 576 affected triangles have no new degeneration/reversal, and maximum sampled field-to-chord error is 0.002011. The focused actual-groom source check retains all 46 inherited contact pairs with **zero new and zero removed pairs**; the additional sampled forward-gap minimum changes from 0.019090 to 0.018644, with no new sampled crossing. These are bounded checks, not a global collision or visual quality certificate.

For the native restoration comparison only, the detached original torso is carried through unchanged balance99 once by an unrendered frame-identical proxy. The candidate and actual model receive the ordinary99 pass once. The arithmetic integration check invokes the actual QA continuation and confirms that every balanced original attribute hash matches the untreated case. Native will verify the installed Three buffers and cleanup separately. Production retains no source geometry through154 and includes no proxy.

One matched OFF/ON six-view set remains the art gate. No production adoption or quality gain follows from the source checks.
