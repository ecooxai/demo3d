# 165 near-sleeve compression fold

Accepted164 remains78/100. This is one isolated geometry study, authorized through a first native OFF/ON art gate. The sole visual source is `reference/image1.png`; no source-image pixels are analyzed and no assets or material changes are introduced.

The visible image-left sleeve is much smoother and more uniformly rounded than the reference. The candidate gives that existing panel one diagonal inward compression crease and a smaller, broader return roll. The selected coarse version follows the existing upper-sleeve fan and fades before the sleeve crown. It should change a small part of the ordinary outer silhouette and produce a cotton roll across the visible front/side, without a decorative repeated ripple field.

## Ownership and geometry

Only `blouse-continuous-torso-and-sleeves` and its existing left `blouse-sleeve-attachment--1` seam tube are eligible. The field is zero outside the left outer sleeve, above its compact top limit, at the crop, on the rear panel and toward the middle front. Every other mesh is exact. The selected154 middle-front roll, selected158 collar leaves/edges, neckline, placket, buttons, far sleeve and source117 UV/color/texture data remain exact. No vertex, triangle, draw or texture is added.

Use one blouse-local ambient map `F(p)=p+d H(X,Y,Z)`, with fixed unit direction `d=(-.55,0,sqrt(1-.55²))`. Negative H gives a restrained inward/rightward and rearward crease; positive H makes its modest return roll. Y is exact. H has a curved diagonal center in physical X/Y and compact C2 gates in outer-sleeve X, height, front/side depth and distance from the fold. Its full derivative includes the center-curve and gate product rules. Transport accepted normals using the exact rank-one inverse transpose of `I+d⊗grad(H)`; require comfortable positive Jacobian and separately check emitted triangles.

Apply after117,154 and158 and before the existing99 balance. Assert the actual identity mesh-to-blouse frames and the pre99 coordinate sentinel. The torso samples the C2 ambient field on its original mesh. The seam inherits that same **emitted triangle displacement**, extended along Z, rather than independently sampling the smoother field. For each source supporting triangle, its rounded vertex displacements define affine `ΔX(X,Y)` and `ΔZ(X,Y)`. The seam normal uses the exact triangular Jacobian of `(X+ΔX,Y,Z+ΔZ)`. This preserves the prior directional stand-off from the actual cloth without adding an arbitrary forward offset. Piecewise triangle derivatives and residual seam segment interpolation are explicitly checked separately from the smooth torso field.

## Resource ownership

The accepted154 cache retains its current torso replacement geometry even with production source retention disabled. Creating another disposable torso replacement would leave that superseded object retained by154. Therefore165 stages complete new position/normal values for the two unique live owners, validates them, then commits to the same existing attribute arrays. It does not replace their geometries, dispose an original, or share disposable GPU bindings. The production cache retains metrics only. Zero is a true no-op; repeating the selected application is idempotent.

For native OFF/ON restoration only, detached backups must clone every attribute and index privately. Carry those frame-identical backups through unchanged99 once without rendering, then copy their balanced p/n values back into the existing active arrays before disposing the private backups. This keeps all accepted154 geometry/cache bindings intact. Actual staged and QA-private bytes will be reported separately.

## First art gate

First inspect the actual original coarse torso triangles under a fixed diagnostic light. A useful result must show a continuous diagonal compression/return at ordinary front scale, a small natural sleeve silhouette tuck, and a coherent side roll. Reject an X-shaped ridge where this meets inherited106 relief, a sharp polygonal notch, a padded dent, a displaced seam, any new fixed-hair crossing, or an effect visible only in a close diagnostic. Keep all existing subdivisions; broaden this one roll if the original grid fails to resolve it. Then freeze one native OFF/ON comparison on current164 with front, garment, sleeve closeup and both profiles/back. Native appearance decides adoption; source checks do not raise the score.

## Bounded coarse corrections already made

The first narrow, oppositely sloping field crossed the inherited106 fan into an X and missed its continuous midpoint target by .0103 model units. That version is rejected and its coarse image/report are preserved under `sleeve165-first-rejected-coarse-*`. The final single crease is broader and follows the established upper fan; its maximum tested midpoint deviation is .00618 without adding cuts. A second alignment through the old positive ridge flattened the upper relief, so the selected crease sits in the adjacent compression channel instead.

Independently moving the original denser seam through the continuous field put five emitted seam-center samples behind the coarse torso, with minimum signed Z support -.00339. The selected emitted-triangle transport removes those newly inside samples. After the ordinary99 pass,113 actual ring/midpoint support samples have zero missing/new-inside cases, minimum signed gap .000305, maximum extra separation .00151 and maximum extra inset .000771. These finite directional samples do not certify all tube-volume contacts. The saved native sleeve/profile views must still reject a visibly broken or detached seam.
