# Candidate124: replace the exposed front crown-to-fringe patch

Status: parent-approved proposal, now implemented as the isolated frozen candidate124. See `crown124-handoff.md` for its actual construction, audit results and native review gate. Production source is unchanged.

## Intended visual change

The source shows dense upper hair separating into overlapping, bowed locks and fine strands as it crosses the forehead. The model currently presents an opaque scalp-shaped surface that stops at a scalloped edge, followed by much thinner separate fringe groups.124 should remove that visual junction by building the affected roots and ends from the same set of continuous paths.

This requires replacing the affected construction rather than displacing the existing coating again. The accepted118 groom at `guidePlacement:.5` is the base. Its lower-hair registration/Jacobian field, contact86 at .35, long locks, far-ear94 layer, pose and accepted materials remain independent.

## Concrete scope

The initial footprint is the forward portion of each crown sheet, approximately source crown u=.60–1 and the latter half of its sideward flow. This includes the visible left sweep edge, the central forehead junction and the sharply bounded right fall. The upper crown silhouette, back, and established ear/side-length routes remain intact. The actual replacement boundary will be determined by the new shared paths and their opaque overlap, not a common horizontal Y cutoff.

The existing crown vertex count/order and UV0/UV1 layout should stay intact for100/104. Position and alpha values in the affected region may change deliberately. An additive foreground mesh is allowed only as the actual replacement root-to-tip groom, accompanied by withdrawal of the old exposed surface underneath it; it must not become another decorative layer over the old lid.

## Construction

1. **Author a shared family of continuous root-to-tip paths.** Use roughly24 unevenly spaced families, with the seven accepted108 visible bows as lower-path references and additional intermediate families crossing their current regular gaps. The left families include the broad diagonal sweep toward the exposed temple; central families have unequal brow-length ends; right families connect naturally toward the covered far temple. Each family starts within the retained upper hair, turns while still covered, and reaches its visible forehead path without an upward return or hook. After its highest point, its forehead portion must descend monotonically. The old spherical edge trajectory will not be used as the visible bang trajectory.

2. **Use those paths for both dense coverage and individual fibers.** A family contains several narrow curved layers in its dense upper portion and individual fine strands that continue along the same paths into the forehead. Root widths, layer depths, thinning positions and endpoints differ by family. There is no common line where all dense support ends. Reassign the existing foreground crown fibers and fringe strand budget to these paths instead of stacking a second complete fringe on top.

3. **Withdraw the old cap tail beneath the replacement.** The retained crown overlaps the new dense roots over a substantial hidden interval. Its old front tail is shortened, inset or masked only within the replaced patch. The old cap cutoff must stay behind the new root coverage and cannot remain the visible hairline. Between the lower forehead strands, the intended visible surface is the existing forehead. The upper dense region must remain covered; no unexplained holes through the crown are acceptable.

4. **Make the root-to-end transition gradual and filamentary.** Dense narrow layers should split and taper along the same family paths before the visible sparse ends. Fine edges use original procedural coverage and the existing strand geometry. Do not end medium-width supports at the hairline, which produced109/113’s teeth and pinholes. The foreground material starts from the accepted nonchrome fringe settings; shader125 remains a separate experiment.

## Why this addresses the earlier failures

-109/113 appended short carriers over a still-visible cap;124 replaces the cap’s exposed tail and the fringe together.
-105 forced the legacy crown direction into visible hooks;124 chooses the upper turning path while it is still buried and constrains the visible path to descend.
-116 changed pigment without creating layered structure;124 changes actual paths and coverage while retaining accepted color work.
-119 only modified the upper part and preserved the problematic release region belowY1.05;124 intentionally includes that region.

## Bounds and review gates

Aim to keep the total strand count near the accepted budget by replacing the old foreground crown/fringe allocation. A modest geometry change is justified, with an initial target below about8% additional hair triangles. Avoid adding large quantities of hidden fibers merely to fill an unmeasured hole.

The source audit should establish exact preservation of118’s protected lower geometry/field, finite noncollapsed geometry in the new patch, monotone exposed forehead paths, no upward hooks, and continuous support where the old cap retreats. Test the actual front and oblique coverage, not only radial scalp rays. Existing alpha/layout metadata must remain truthful, and104’s coverage characterization must be rerun if the live alpha changes.

Native comparison should use the current main, including `guidePlacement:.5`, with124 off/on and the same lighting and materials. Review front, detail, both profiles, back, and a junction close-up. One isolation showing the replacement paths with the old front cap tail hidden would make any unsupported roots immediately apparent. Adoption requires the hard lid to disappear visibly while maintaining density and natural sides; successful construction alone does not raise the76/100 score.
