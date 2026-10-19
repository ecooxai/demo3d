# Collar158 — a broad roll carried through the free leaf

Status: proposal only; no candidate, production edit, new render, or quality gain. Accepted overall score remains 78/100. Use the selected157 appearance for both eventual native states. The collar geometry is still the accepted blouse source `02b15fe9bbdfa428be27fd0f9ed44f7171b3178056b32c9586b8cf63a1da63a6`.

## Visual purpose and actual cause

I compared the sole photograph `reference/image1.png` with the ordinary front, isolated garment and both profile captures of adopted154. In the photograph, the visible image-left leaf turns outward into a soft cup, and the other leaf has a quieter unequal turn under the hair. The current garment shows two broad, stiff triangular leaves with nearly straight lower edges. Most of their area has one continuous pale response. The high right neck root is also squared; this first proposal does not move its attachment to solve that separate defect. The photograph partly hides the actual tips, so a precise reconstructed tip length would be an inference.

This is not an absence of existing collar relief. `collarPoint()` already has an upper roll and `collarLeafBend()` already adds a crest/trough. The latter is multiplied by `sin(pi*v)`, so its entire added bend vanishes at the free lower edge, v=1. Its small Y relaxation lowers the outer tip. The ruled inner/outer endpoint layout and edge thus retain the conspicuous spear shape even when the middle receives a little relief.

There is a second real constraint: `clothGeometry()` bakes a `beneathCollar` attenuation band into torso vertex colors using the original lower-edge equation. Large tip shortening could reveal that old shaded outline, even though117's atlas is unchanged. The proposed change therefore prioritizes a roll that reaches the free edge, with only a small curved point return. No torso color correction is included or silently assumed.

## One proposed change

Give each existing free leaf one broad transverse camber, extending through its lower boundary, and let the outer point return slightly upward along its existing longitudinal layout. The image-left roll is modestly stronger. This should produce a visible curved edge and changing surface normal across a real cotton leaf, including a restrained view of its underside. It should not form a standing fin, a narrow crease, a detached flap, or another ornamental wrinkle.

Initial bounded shape, to be resolved once against actual coarse triangles:

- Preserve the inner strip u<=.20 and upper strip v<=.20 exactly. This also keeps the existing fold tube near u=.12 fixed.
- Use broad quintic gates: transverse onset u=.20 to .62; longitudinal onset v=.20 to .58. No change is concentrated into one or two rows of the existing24x48 grid.
- Add one positive, broad camber peaking near u=.65–.75, with a smaller positive height at u=1. It remains nonzero at v=1. Initial peak limits are .060 on the image-left and .045 on the image-right; free outer edge heights are approximately .03/.02 before obstacle constraints. These are proposal parameters, not measured runtime results.
- Return only the lower outer portion along the original X/Y layout: v'=v-epsilon*W(u,v), with epsilon initially .025/.020 and the return gate beginning at v=.55. This is roughly a few hundredths of a model unit of tip rise, not a new short-collar silhouette. The actual displacement and exposed old attenuation band must be reported from the coarse result.
- X/Y of the pinned strips, the neckline/V, facings, collar button and body buttons remain exact. No global collar scaling or shoulder motion.

If the current fixed hair prevents a visible roll within these limits, report that concrete obstruction with the coarse image. Do not add a bulge elsewhere or retain an imperceptible fit merely because it passes a source check.

## Exact object and resource ownership

Own only these four existing meshes and their position/normal values:

1. `blouse-left-spread-collar`
2. `blouse-right-spread-collar`
3. `blouse-left-collar-edge`
4. `blouse-right-collar-edge`

Both sides of each existing closed leaf and its connecting edge triangles receive the same continuous field. Each existing edge tube receives that same field at its actual vertices; it is not left floating on the original outline. The two `collar-fold` tubes remain protected because the entire u=.12 neighborhood is inside the fixed strip; verify all of their actual vertices are outside the field before accepting that assertion.

All other meshes are protected, including the two neck-opening facings/stitches, finished neckline, torso/sleeves and adopted154 fold, placket, buttons, neck, face and entire hair. Preserve all original UV/color/index values, groups, material values/identities and all maps, including117. No new surfaces, subdivisions, seam population, draw calls or maps.

Clone every attribute and the index into each private replacement; do not share GPU bindings with a disposable replacement. The four current meshes contain5,870 vertices and11,328 triangles. Their complete copies total314,608 bytes with current Uint16 indices, or382,576 bytes if the backend widens all those indices to Uint32. This is approximately .300/.365MiB, with zero added triangles. Actual native counts/bytes supersede this source-derived budget. Target a low one-time preparation cost, approximately under30ms; no per-frame evaluator.

## Coherent deformation and normals

Use one ambient map per leaf in final blouse-local coordinates, rather than independently repositioning front, back and seam samples. The exact X/Y part of the current `collarPoint()` layout, followed by both authored width maps, defines a chart C(u,v). Its X/Y formula is independent of `supportedDepth()`. Recover the chart coordinate of each actual leaf/back/edge vertex with a bounded inverse and check the residual, including the thin offset outside the front surface.

For a recovered point p=(X,Y,Z), set:

`F(p) = ( Cx(u,v'), Cy(u,v'), Z + h(u,v) )`.

Here v' is the bounded return above and h is the single broad camber. Include the full chart, inverse-chart, gate and return derivatives. With A0=DC(u,v) and A1=D[C(u,v')]/D(u,v), the upper2x2 Jacobian is A1*A0^-1, its Z column is zero, the bottom row is `(Dh*A0^-1, 1)`. Carry each existing authored normal by the exact inverse transpose in the actual mesh/blouse frame. Copy protected positions and normals byte-exact; do not recalculate all collar normals or leave seam normals on the old surface.

The unchanged closed index graph does not by itself prove a valid solid. Require finite chart inversion and unit normals, positive continuous determinant with a comfortable target minimum of .70, plus actual triangle orientation and front/back separation checks. The ambient deformation preserves the common layer relationship but does not promise exact .0045 normal thickness; measure its change and reject a visibly compressed or inflated leaf.

Apply after the accepted cloth preparation and154, before the single99 balance pass. All four collar meshes occupy99's rigid collar/facing region, so that pass must remain unchanged. QA restoration must use correctly balanced original buffers before disposing the all-private replacements; retain the already verified154 ownership pattern instead of restoring an unbalanced source.

## Minimum coarse and native gate

First show the actual four coarse meshes with the unchanged torso, facings and nearby fixed hair. Check changed leaf/edge triangles against the actual body, neck, opposite leaf, facing and bounds-overlapping hair triangles; report inherited pair identities separately from new ones. Source body queries alone are insufficient. Check edge-tube support along emitted segments and the unchanged fold-tube neighborhood. No blanket refinement if a roll is too narrow: broaden this single camber within its approved support.

Then one OFF/ON comparison using the same selected157 scene: ordinary front, garment, both profiles, back, and a fixed collar oblique. No strength/material/light sweep.

Adopt only if the ordinary front shows a softer turned leaf without exaggerating the white wedge, the garment view shows a broad continuous roll reaching the free edge, and profiles show plausible thin cotton rather than an outward blade. The V/neck seating and button layout must stay stable. Reject new pale gaps, exposed old shaded outlines, seam lift, hair/cloth pokes, a sharp hinge or merely a changed highlight with no convincing fold. A local success does not automatically raise the whole-scene78; the larger hair and likeness limitations remain.
