# Proposal 148 — coherent upper shoulder passage

**Read-only diagnosis and proposed coarse study. No 148 candidate geometry, fine strands, material edits or production changes have been made.** Use accepted141/133 at77/100. Both independent reviewers rejected143 at76; its files remain frozen as a diagnostic branch, not an adopted lower baseline.

The proposed change is one shared upper route for the near curtain and its existing forward-side companions. It should let the hair descend more vertically beside the neck, then turn gradually around the actual shoulder crest into the accepted chest routes. It must retain finite clump depth and irregular existing strand groupings. No flattened common sheet, extra backing surface or new material is proposed.

## Observed problem and actual cause

I viewed image1 and all five accepted141 views supplied as `near-ear144-0-*`. Both profiles show a conspicuous diagonal passage from the head-side fall to the forward chest locks. Several neighboring surfaces follow this almost straight bridge together. The front view hides much of its depth, but the profile exposes the unsupported span and the gap above the shoulder.

The authored near front path advances from rawZ approximately .05 at rawY−.78, through .36–.43 at−1.29, to approximately .79 at−1.90. Its inner and curl companions use similarly forward shoulder knots. The eight forward-side guides turn even more sharply in depth. These routes were authored before the current blouse and are subsequently moved through the partial head/gravity counterpose; a smooth raw spline does not by itself establish a natural model-space shoulder passage.

The read-only source study evaluates those routes through the exact accepted pose/contact helper and compares them with the actual emitted MASS and blouse triangles. The following values are in the model frame before unchanged balance99. A Z-gap is a projected gap, not the nearest 3D surface distance.

| Model Y | Near-front median Z | Actual torso hits /33 centers | Median projected torso gap | Existing contact behavior |
| --- | ---: | ---: | ---: | --- |
| 2.30 | .097 | 0 | — | 86 and118 both zero |
| 1.50 | .502 | 14 | .413 | Front query returns only2 hits; both have zero attraction weight |
| 1.30 | .634 | 33 | .313 | 118 is still off;86 pull is effectively zero |
| 1.10 | .757 | 33 | .325 | Median118 pull .00140; median86 pull zero |

Three source rules explain why previous attraction changes do little here:

1. **Placement118 starts below rawY−1.74**, approximately modelY1.21, and reaches full weight only atY .55. It preserves the upper bridge by design.
2. **Contact86 fades out through modelY1.22–1.92.** Its broad collar exclusion also makes the near-side attraction zero where blouse-local `abs(x) <= .84` and the upper Y gate is saturated. Many current near-curtain centers lie inside that exclusion even when actual cloth is farther behind them.
3. **The front support query rejects normals with Z component at most .35.** It also erodes attraction near open edges. Real shoulder-crest triangles therefore exist where this front-facing attraction query returns no useful sample. A shoulder route needs the actual crest and collar geometry, including their upper-facing surfaces.

For the eight near forward-side guides148–155, the median forward slope around modelY1.50 is .925 Z units per unit downward Y, compared with .589 for the front33. Leaving these companions fixed while moving only the front layer would preserve diagonal straps and recreate a crossing constraint like the one encountered in143.

The source evidence is in `upper-shoulder148-source-study.mjs` and its JSON. The script only reads accepted sources and emits diagnostics; it does not construct a proposed148 route.

## Proposed ownership

For one bounded near-side study, own the **upper portions of75 existing guides and their2,415 base fine strands**:

| Existing group | IDs | Guides | Base fibers |
| --- | --- | ---: | ---: |
| Near front | 58–90 | 33 | 1,419 |
| Near curl | 133–138 | 6 | 324 |
| Near inner | 172–199 | 28 | 448 |
| Near forward-side companions | 148–155 | 8 | 224 |

The selected guide population and random slots stay unchanged. Their already assigned flyaways follow the same changed upper spans only; record the exact count during a later coarse/fine handoff. Side156–159, all rear/inner-back guides, the far curtain and far-temple94 remain fixed. The scalp, part, crown, fringe133, face, ears, blouse and materials/maps are protected. This proposal does not attempt the far-side bridge at the same time; its visible limitation remains explicit.

A starting influence interval is **modelY2.30 down toY .55**, with exact old routes outside it. The upper boundary is below the head-side crown passage and must be checked against the actual face/neck envelope before any implementation. If the first coarse support study shows that a fixed neighboring core blocks a useful route, report that named obstacle and its exposed effect; do not silently enlarge ownership or pin the whole solution against an inherited buried overlap.

## One coarse mechanism

Build accepted118.5 first. Use these accepted curves and their sections as immutable inputs. Retain their original X/Y center paths for the first study so the photographic front arrangement and current lower lengths remain stable.

Plan a **shared model-space upper depth corridor** for all75 guides. It has three connected portions: a free descent beside the neck, a rounded passage over/forward of the shoulder crest, and a long return to the accepted chest route. Use a small smooth control field across physical lateral position and height, shared by front/inner/curl/side companions. Do not assign guides to a few discrete bundle centers. Keep their original relative layer offsets and section depths rather than compressing the whole depth stack.

The crest constraints must come from the actual torso, collar, facing and neighboring hair triangles, using local surface normals and the complete rear/side sections. They cannot be a clamped frontZ lookup or a new broad collar rectangle. Plan rear-surface normal clearances roughly .05–.10 where hair passes over a supported surface, with deliberately larger free clearance beside the neck and for existing loose companions. These are initial design targets, not a claim that every strand must rest on cloth.

The measured source gaps suggest a useful first target of approximately **.12–.20 less forward depth around modelY1.3–1.6**, fading to zero at the head-side and lower boundaries. This is a hypothesis for the coarse geometry gate. It should not become a forced displacement if the actual collar, section depth or fixed side routes do not permit it. A large new forward bulge needed to restore clearance would contradict the purpose of the study.

Use a broad C2 join with bounded interior slope/curvature, not only matching endpoint derivatives. Match the accepted route, tangent and curvature exactly at both limits. Preserve the front X/Y centers, the guide population and existing unequal lower ends. Rebuild or transport each section coherently from that same route while retaining depth; inspect actual emitted cross-sections before allocating fine geometry. The intended change is a different route around the shoulder, not a stronger material highlight or a smaller depth stack.

The field is applied while preparing guide paths and section frames, before `longLock` and dependent fibers are emitted. Its depth shift can be shared without a depth derivative, so neighboring layers retain their separation; final acceptance still requires actual triangle checks rather than a determinant argument alone. Any support solve should run offline and freeze a compact coefficient set with exact source/pose guards.

## Transform and lower-interface contract

This interval includes the partial gravity counterpose above rawY−1.64. Therefore use the complete raw-to-head-to-model mapping and its derivative; the simplified `rawX + .26, rawY + 2.95` mapping used in143’s lower region is insufficient here. Plan through the existing86 field and invert it when authoring the replacement source route. The renderer then applies86 exactly once as usual. Do not fit118 again after the new upper route, and do not append a final-mesh compression.

For the current accepted141 study, every selected center route and section below modelY .55 returns exactly to accepted118.5. Preserve the original lower wave parameters, tip heights and fine samples there. The return interval must be long enough to avoid moving the shoulder bridge downward into a new elbow; if a coarse route cannot achieve that while preserving the lower boundary, report the concrete interface contradiction before fine construction.

If a future lower continuum revisits143’s useful coverage, compose it through **one shared guide evaluator**, not sequential148/143 fitting. A possible exact interface is143’s fully joined rawY−2.90 / modelY .05, where its field and derivatives are already defined. The upper join would need to be jointly authored to that interface. This is an integration option only; the rejected143 sheet, tip schedule and extra geometry are not carried into148.

## Coarse gate and performance budget

Before fine work, show actual closed MASS in front, near profile and both quarter views with the accepted body/collar. Check whether the upper diagonal bridge shortens and rounds without moving the photographic front boundary, exposing white corridors, creating a new elbow or changing the fixed lower tips. Track inherited buried root overlap separately from new exposed crossings. Check whole rear/side sections against cloth and neck, local orientation and the exact boundary attributes.

No MASS topology, population, material, map or draw-call increase is planned. Prefer a small frozen field and less than about2MiB transient host data, with no retained support grids and no per-frame work. After the coarse route is approved, aim for **at most roughly50,000 additional fine triangles /2.7MiB** and less than about200ms native construction overhead. These are proposed budgets, not measurements or automatic permission to subdivide. If the concrete host-chord requirements materially exceed them, report the cost before repeating143’s expensive fine stage.

Fine strands must use the same changed hosts and exact unchanged prefixes/suffixes. Sample actual post-pose/contact host triangles when checking attachment; a negative infinite-plane distance alone is insufficient, and small negative values are not excused by pixel size. Inspect exposed ribbon edges and carrier visibility as well as centers. Moving the main curtain can uncover a previously hidden fixed strand even when that strand’s buffers remain exact.

## Art risks and decision

The only photograph is frontal. The profile route is a conservative 3D inference, not a measured reconstruction of hidden anatomy. A closer shoulder passage could look pasted down, expose more ear/neck, cross the collar, or shift the perceived hair mass despite preserving center X/Y. A common corridor could also erase layer hierarchy if it imposes too much agreement between guides. Retaining original offsets, lower wave shapes and unequal ends is essential.

Proceed only if a coarse preview shows a visibly more natural upper passage with connected coverage and finite clump volume. Then one native off/on comparison should judge all five views plus an upper-shoulder closeup and actual cost. Keep accepted141 at77 until that art gate establishes an improvement. No148 implementation is authorized by this document itself.
