# Native 138 — independent visual decision

**Decision: retain 0 at 77/100; reject 100 at 73/100.** This is an art assessment of the rendered result, not a score inferred from passing source checks. Production remains unchanged.

I viewed the sole reference, `reference/image1.png`, and all twelve native images: both 0 and 100 for front, detail, left, right, back and the isolated curtain closeup.

## What the images show

| View | Independent finding |
|---|---|
| Front | The near curtain becomes several long, similarly flat tendrils. Large shirt-colored slots divide the lower hair, and the shoulder has a new angled bridge. The reference has a connected mass with unequal internal sweeps and much smaller, less persistent openings. The newly separated ends are a clear regression at ordinary preview size. |
| Curtain closeup | Squared changes of direction, triangular holes and crossing faces appear around the shoulder. The lower locks have nearly constant ribbon-like faces and synchronized returns. More fine geometry follows these shapes, but it does not make the underlying layout natural. |
| Left / near profile | Additional bends and thin looping ends break the continuous shoulder-to-chest fall. The profile contains a new angular knot at the upper transition. Any local reduction in cloth stand-off is outweighed by these shape defects. |
| Right / far profile | The protected far curtain remains dominant, but a new near-side angular protrusion is visible beyond it at shoulder height. There is no compensating improvement from this view. |
| Detail and back | I see no material change in the protected face/crown or rear hair. These are useful controls, rather than an artistic gain. |

The useful intention was a stronger unequal lower S-flow and more varied endpoints. The result makes those flows too separate and too flat. It also exposes the shoulder transition as a geometric assembly. The failure is visible without zooming, and the closeup confirms it.

## Cost and technical limits

The native report records construction of 1,673.6 ms off and 5,299.4 ms on, geometry of 52.49 and 69.45 MiB, and warm GPU queue medians of 10.3 and 11.3 ms. CPU frame time is 1.8 ms in both cases. The extra 317,594 triangles and 16.96 MiB buy no acceptable visible improvement. The construction increase is about 3.17 times baseline.

Finite geometry and protected fingerprints pass. The separate source obstacle study still contains newly intersecting upper-transition samples against fixed side locks; those should not be described as a clean intersection gate. I did not extend that audit after the native art rejection.

Evidence: `review/near-curtain138-native-summary.json`, its preserved full-report SHA, the twelve `review/near-curtain138-*` images, `review/near-curtain138-obstacles.json`, and the frozen candidate sources. The score printed in the comparison UI was held at the 77 baseline; the on candidate's independent review score is 73.

## Next decision

Keep candidate 138 frozen and rejected. Candidate 143 should use the six major flows as influences on one continuously spaced curtain, with inner guides filling the gaps behind the front layer and a coupled smooth shoulder join. Do not implement a strength sweep of 138, add gloss, or further subdivide the same failed geometry. The proposed replacement is recorded in `review/near-curtain143-plan.md`.
